import importlib.util
import io
import json
from pathlib import Path
import struct
import tarfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('cydia_review', ROOT/'tools/cydia-static-review/review.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


def thin(bits=32, endian='<', commands=b'', count=0, cpu=None, subtype=9):
    magic = 0xfeedfacf if bits == 64 else 0xfeedface
    if cpu is None: cpu = 0x100000c if bits == 64 else 12
    header = struct.pack(endian+'7I', magic, cpu, subtype, 2, count, len(commands), 0)
    return header+(b'\0'*4 if bits == 64 else b'')+commands


def fat(parts):
    start = 8+20*len(parts)
    entries, body = [], b''
    for part in parts:
        meta = review.thin_metadata(part)
        entries.append(struct.pack('>5I', meta['cpuType'], meta['cpuSubtype'], start+len(body), len(part), 0))
        body += part
    return b'\xca\xfe\xba\xbe'+struct.pack('>I', len(parts))+b''.join(entries)+body


def package_archive(entries):
    data = io.BytesIO()
    with tarfile.open(fileobj=data, mode='w') as archive:
        for name, value in entries:
            member = tarfile.TarInfo(name)
            if value is None:
                member.type = tarfile.SYMTYPE
                member.linkname = '/outside'
                archive.addfile(member)
            else:
                member.size = len(value)
                archive.addfile(member, io.BytesIO(value))
    data.seek(0)
    return tarfile.open(fileobj=data, mode='r:')


class CydiaStaticReviewTests(unittest.TestCase):
    def test_fixed_public_package_is_historical_and_not_misrepresented_as_authenticated(self):
        pin = review.SPEC['cydia']
        self.assertEqual(pin['version'], '1.1.30')
        self.assertEqual(pin['bytes'], 1292624)
        self.assertEqual(pin['md5FromHttpsIndex'], 'bb0cdc40d3abac5b874972ad8a8b70a1')
        self.assertEqual(pin['url'], 'https://apt.saurik.com/debs/cydia_1.1.30_iphoneos-arm.deb')
        self.assertIn('not a modern authenticated', pin['provenanceLimit'])
        self.assertIn('Third-party', review.SPEC['sourceMirror']['limit'])
        root_pin = json.loads((ROOT/'tools/android-root-review/inputs.json').read_text())
        self.assertEqual(review.SPEC['ghidra'], root_pin['ghidra'])
        self.assertTrue(all(v is False for v in review.SPEC['guardrails'].values()))

    def test_little_and_big_endian_32_and_64_bit_headers(self):
        for bits in (32, 64):
            for endian in ('<', '>'):
                with self.subTest(bits=bits, endian=endian):
                    raw = thin(bits, endian)
                    rows = review.native_slices(raw)
                    self.assertEqual(rows[0][1], raw)
                    self.assertEqual(rows[0][0]['bits'], bits)
                    self.assertEqual(rows[0][0]['byteOrder'], endian)
                    self.assertFalse(rows[0][0]['codeSignatureCryptographicallyVerified'])

    def test_absent_or_zero_encryption_command_is_not_decryption(self):
        self.assertEqual(review.thin_metadata(thin())['encryptionInfo'], [])
        for bits in (32, 64):
            command = struct.pack('<5I', 0x2c if bits == 64 else 0x21, 24 if bits == 64 else 20, 0, 0, 0)
            if bits == 64: command += b'\0'*4
            meta = review.thin_metadata(thin(bits, commands=command, count=1))
            self.assertFalse(meta['nonzeroEncryptionCryptid'])
            self.assertEqual(meta['encryptionInfo'][0]['cryptid'], 0)
            self.assertFalse(meta['codeSignatureCryptographicallyVerified'])

    def test_nonzero_cryptid_is_detected_without_touching_encrypted_bytes(self):
        cmd = struct.pack('<5I', 0x21, 20, 0, 4, 1)
        meta = review.thin_metadata(thin(commands=cmd, count=1))
        self.assertTrue(meta['nonzeroEncryptionCryptid'])
        self.assertEqual(meta['encryptionInfo'][0]['bytes'], 4)
        text = (ROOT/'tools/cydia-static-review/review.py').read_text()
        self.assertIn("if metadata['nonzeroEncryptionCryptid']:", text)
        self.assertIn('no decryption/bypass attempted', text)

    def test_signature_metadata_is_not_cryptographic_verification(self):
        command = struct.pack('<4I', 0x1d, 16, 0, 4)
        meta = review.thin_metadata(thin(commands=command, count=1))
        self.assertEqual(meta['embeddedCodeSignatureRanges'], [{'offset': 0, 'bytes': 4}])
        self.assertFalse(meta['codeSignatureCryptographicallyVerified'])

    def test_truncated_commands_sizes_counts_and_out_of_range_records_fail_closed(self):
        bad = [b'', b'\xce\xfa\xed\xfe', thin()[:27],
               thin(commands=struct.pack('<2I', 1, 0), count=1),
               thin(commands=struct.pack('<2I', 1, 12), count=1),
               thin(commands=struct.pack('<2I', 1, 8), count=2),
               thin(commands=struct.pack('<2I', 1, 8), count=0),
               thin(commands=struct.pack('<5I', 0x21, 20, 1000, 1000, 1), count=1),
               thin(commands=struct.pack('<4I', 0x1d, 16, 1000, 1000), count=1),
               thin(commands=struct.pack('<2I', 0x2c, 8), count=1)]
        for raw in bad:
            with self.subTest(raw=raw), self.assertRaises(ValueError): review.native_slices(raw)

    def test_universal_slices_and_hashes_are_separate(self):
        a, b = thin(), thin(64)
        rows = review.native_slices(fat([a, b]))
        self.assertEqual(len(rows), 2)
        self.assertEqual([m['cpuType'] for m, _ in rows], [12, 0x100000c])
        self.assertEqual([m['sha256'] for m, _ in rows], [review.sha(a), review.sha(b)])

    def test_universal_table_overlap_architecture_disagreement_and_alignment_rejected(self):
        raw = fat([thin(), thin(64)])
        variants = [raw[:15], raw[:4]+struct.pack('>I', 17)+raw[8:]]
        for offset, value in [(16, 1), (24, 32), (8, 99), (36, 48), (36, 1)]:
            item = bytearray(raw)
            struct.pack_into('>I', item, offset, value)
            variants.append(bytes(item))
        for item in variants:
            with self.subTest(item=item), self.assertRaises(ValueError): review.native_slices(item)

    def test_tar_reads_one_native_member_and_does_not_extract_or_run_maintainer_scripts(self):
        path = review.SPEC['cydia']['nativeEntry']
        raw = thin()
        with package_archive([('postinst', b'NEVER EXECUTE'), ('./'+path, raw)]) as archive:
            self.assertEqual(review.native_from_tar(archive), raw)
        text = (ROOT/'tools/cydia-static-review/review.py').read_text()
        self.assertIn("['dpkg-deb', '--fsys-tarfile'", text)
        self.assertNotIn('shell=True', text)
        self.assertNotIn("['dpkg',", text)
        self.assertNotIn('archive.extractall', text[:text.index("ghidra = download")])

    def test_tar_traversal_duplicate_native_and_symlink_fail_closed(self):
        path = review.SPEC['cydia']['nativeEntry']
        for entries in [[('../outside', b'x'), (path, thin())], [('/outside', b'x'), (path, thin())],
                        [(path, None)], [(path, thin()), (path, thin())], [('not-cydia', thin())],
                        [('bad\\name', b'x'), (path, thin())]]:
            with self.subTest(entries=entries), package_archive(entries) as archive:
                with self.assertRaises(ValueError): review.native_from_tar(archive)

    def test_redirects_never_follow_plaintext_and_only_upgrade_fixed_author_asset(self):
        handler = review.HttpsOnlyRedirect()
        request = review.urllib.request.Request(review.SPEC['cydia']['url'])
        target = 'http://cache.saurik.com/debs/cydia_1.1.30_iphoneos-arm.deb'
        redirected = handler.redirect_request(request, None, 302, 'Found', {}, target)
        self.assertEqual(redirected.full_url, target.replace('http://', 'https://', 1))
        self.assertFalse(handler.upgrades[0]['plaintextRequestMade'])
        for unsafe in [target.replace('cache.saurik.com', 'evil.example'),
                       target.replace('cache.saurik.com', 'cache.saurik.com.evil.example'),
                       target.replace('cache.saurik.com', 'user@cache.saurik.com'),
                       target+'?unreviewed=1', target+'#fragment',
                       target.replace('http://', 'ftp://'), target.replace('1.1.30', 'unreviewed'),
                       target.replace('cache.saurik.com', 'cache.saurik.com:80')]:
            with self.subTest(unsafe=unsafe), self.assertRaises(ValueError):
                handler.redirect_request(request, None, 302, 'Found', {}, unsafe)
        with self.assertRaises(ValueError):
            handler.redirect_request(review.urllib.request.Request(review.SPEC['cydia']['indexUrl']),
                                     None, 302, 'Found', {}, target)
        secure = 'https://github.com/public/fixed'
        self.assertEqual(handler.redirect_request(request, None, 302, 'Found', {}, secure).full_url, secure)

    def test_index_matching_requires_exact_package_version_and_architecture(self):
        stanza = b'Package: cydia\nVersion: 1.1.30\nArchitecture: iphoneos-arm\nFilename: debs/example.deb\n'
        self.assertEqual(review.matching_stanza(stanza)['Version'], '1.1.30')
        for bad in [b'', stanza.replace(b'1.1.30', b'1.1.29'), stanza+b'\n'+stanza,
                    stanza.replace(b'iphoneos-arm', b'android-arm')]:
            with self.subTest(bad=bad), self.assertRaises(ValueError): review.matching_stanza(bad)

    def test_report_preserves_phone_model_and_domain_attribution_limits(self):
        report = (ROOT/'docs/samsung-secure-folder-saurik-cydia-review.md').read_text()
        for text in ['SM-A037U1', 'Android Enterprise (Generic)', 'not a test of Secure Folder',
                     'current Knox Guard state', 'current-binary verdict', 'third-party',
                     'not a claim it is the latest', 'not evidence of historical aliases',
                     'No results', 'No port scan', 'no working Kodachi VPN']:
            self.assertIn(text.lower(), report.lower())
        self.assertIn('https://svn.haxx.se/dev/archive-2002-06/1614.shtml', report)
        self.assertIn('https://www.saurik.com/masterkey1.html', report)
        self.assertIn('https://support.apple.com/guide/security/data-protection-overview-secf6276da8a/web', report)
        self.assertNotIn('/tmp/arena-coding-uploads/', report)

    def test_new_operational_research_is_not_bundled_into_public_manuals(self):
        policy = (ROOT/'tools/wikiinajar/public-corpus-policy.mjs').read_text()
        self.assertIn('"docs/research/cydia-static-review.json"', policy)
        self.assertIn('"docs/samsung-secure-folder-saurik-cydia-review.md"', policy)

    def test_ci_does_not_install_jailbreak_or_target_and_records_actual_analysis(self):
        workflow = (ROOT/'.github/workflows/cydia-static-review.yml').read_text()
        for required in ["github.event_name == 'workflow_dispatch'", 'distribution: temurin', "java-version: '21'",
                         'timeout --kill-after=15s', 'CydiaCryptoReview.java', '-deleteProject', 'persist-credentials: false']:
            self.assertIn(required, workflow)
        for forbidden in ['dpkg -i ', 'sudo dpkg', 'adb ', 'iproxy ', 'frida ', 'ldid -S', 'pull_request_target']:
            self.assertNotIn(forbidden, workflow)
        java = (ROOT/'tools/ghidra_scripts/CydiaCryptoReview.java').read_text()
        for marker in ['getExecutableSHA256()', 'decompileFunction(f, 30,', 'candidates.size() < 4',
                       'inputExecuted", false', 'deviceDataDecrypted", false', 'jailbreakVerified", false',
                       'malwareFreeVerdict", false', 'wholeProgramSecurityAudit", false']:
            self.assertIn(marker, java)


class CydiaMeasuredEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = (ROOT/'docs/research/cydia-static-review.json').read_bytes()
        cls.report = json.loads(cls.raw)

    def test_measured_receipt_hash_run_and_reviewed_source_files(self):
        self.assertEqual(len(self.raw), 15820)
        self.assertEqual(review.sha(self.raw), '888262c79456f17b05c74273353ad307fce42c4185b02bf475a98a079b53043b')
        self.assertEqual(self.report['runId'], '46058618410')
        self.assertEqual(self.report['sourceCommit'], 'fd9c0ddea99ed0385db4c481aabd58a35da09067')
        self.assertEqual(len(self.report['sourceSha256']), 4)
        for path, digest in self.report['sourceSha256'].items():
            self.assertEqual(review.sha((ROOT/path).read_bytes()), digest, path)

    def test_measured_acquisition_retains_https_upgrade_and_authenticity_limits(self):
        acquisition = self.report['acquisition']
        self.assertEqual(acquisition['package'], review.SPEC['cydia'])
        self.assertEqual(acquisition['downloadedPackageSha256'], 'f80a5228b2bacbd8e2640d96dc1b15a5cf0db681d2ed976cf53f1f5c64a9b184')
        transport = acquisition['httpsTransport'][1]
        self.assertEqual(transport['finalHttpsHost'], 'cache.saurik.com')
        self.assertEqual(len(transport['legacyRedirectsUpgradedBeforeRequest']), 1)
        upgrade = transport['legacyRedirectsUpgradedBeforeRequest'][0]
        self.assertEqual(upgrade['requestedInstead'], upgrade['from'].replace('http://', 'https://', 1))
        self.assertFalse(upgrade['plaintextRequestMade'])
        for key in ['repositorySignatureChainVerified', 'publisherSignatureVerified',
                    'deviceDataAcquired', 'inputOrMaintainerScriptsExecuted']:
            self.assertIs(acquisition[key], False)

    def test_both_actual_native_slices_and_positive_control_recovered_code(self):
        programs = self.report['programs']
        self.assertEqual({p['slice']['bits'] for p in programs}, {32, 64})
        self.assertEqual(len(programs), 2)
        counts = {64: (244790, 3487), 32: (80613, 1675)}
        for program in programs:
            native, analysis = program['slice'], program['analysis']
            self.assertEqual(native['sha256'], analysis['inputSha256'])
            self.assertEqual(analysis['ghidraVersion'], review.SPEC['ghidra']['version'])
            self.assertEqual((analysis['instructionsVisitedUpTo1000000'], analysis['functionsDefinedUpTo200000']), counts[native['bits']])
            self.assertEqual(sum(x['completed'] for x in analysis['boundedDecompilations']), 4)
            self.assertFalse(native['nonzeroEncryptionCryptid'])
            self.assertEqual(len(native['encryptionInfo']), 1)
            self.assertEqual(native['encryptionInfo'][0]['cryptid'], 0)
            self.assertTrue(native['embeddedCodeSignatureRanges'])
            self.assertFalse(native['codeSignatureCryptographicallyVerified'])
        control = self.report['syntheticPositiveControl']
        self.assertEqual(control['instructionsVisitedUpTo1000000'], 91)
        self.assertEqual(sum(x['completed'] for x in control['boundedDecompilations']), 4)
        self.assertIn('ELF', control['format'])

    def test_native_measurement_never_becomes_decryption_jailbreak_or_safety_verdict(self):
        self.assertTrue(all(value is False for value in self.report['guardrails'].values()))
        for program in self.report['programs']:
            analysis = program['analysis']
            for key in ['inputExecuted', 'deviceDataDecrypted', 'jailbreakVerified',
                        'malwareFreeVerdict', 'wholeProgramSecurityAudit']:
                self.assertIs(analysis[key], False)
            for key in ['symmetricAndDigestCrypto', 'trustAndTls', 'networkAndHttp']:
                self.assertEqual(analysis['fixedNamedApiCategories'][key], [])
        report = (ROOT/'docs/samsung-secure-folder-saurik-cydia-review.md').read_text()
        self.assertIn('not proof of no cryptography', report)
        self.assertIn('not a device-data decryption result', report)


if __name__ == '__main__':
    unittest.main()
