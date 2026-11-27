import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT/'docs/research/android-root-static-review.json'


class AndroidRootEvidenceReviewTests(unittest.TestCase):
    def record(self):
        return json.loads(EVIDENCE.read_text())

    def test_retrieved_transport_hash_and_actual_source_identity_are_preserved(self):
        raw = EVIDENCE.read_bytes()
        self.assertEqual(len(raw), 12956)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), 'f1ad4aae4e63e88ccb6e48cd12cf02313009af1f85102194b7d7a12246325cfd')
        record = self.record()
        self.assertEqual(record['sourceCommit'], '130910469950b67319046b808a4f5ec27a48b301')
        self.assertEqual(record['runId'], '46054707860')
        for path, expected in record['sourceSha256'].items():
            self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(), expected, path)

    def test_actual_input_pins_and_observed_certificate_match_receipt(self):
        record = self.record()
        pins = json.loads((ROOT/'tools/android-root-review/inputs.json').read_text())
        self.assertEqual(record['magisk']['sha256'], pins['magisk']['sha256'])
        self.assertEqual(record['ghidra']['sha256'], pins['ghidra']['sha256'])
        self.assertEqual(record['apkSignerCertificateSha256'], ['b4cb83b4dad99f997dbe872f013aa16c14eec41d167021f371f7e1330f273ee6'])
        self.assertIn('not independent authentication', record['signatureLimit'])
        self.assertIn('Verified using v2 scheme (APK Signature Scheme v2): true', record['apkSignatureVerification'])

    def test_two_measured_architectures_and_native_positive_control(self):
        record = self.record()
        self.assertEqual(len(record['programs']), 2)
        for row in record['programs']:
            analysis = row['analysis']
            self.assertEqual(analysis['inputSha256'], row['input']['sha256'])
            self.assertEqual(analysis['ghidraVersion'], '12.1.4')
            self.assertGreater(analysis['instructionsVisitedUpTo1000000'], 0)
            self.assertGreater(analysis['functionsDefinedUpTo200000'], 0)
            self.assertEqual(sum(x['completed'] for x in analysis['boundedDecompilations']), 4)
            for sample in analysis['boundedDecompilations']:
                self.assertGreater(sample['decompiledUtf8Bytes'], 0)
                self.assertRegex(sample['decompiledSha256'], r'^[0-9a-f]{64}$')
            for field in ['inputExecuted', 'deviceRootVerified', 'firmwarePatchedOrFlashed',
                          'malwareFreeOrSafeVerdict', 'wholeProgramSecurityAudit']:
                self.assertFalse(analysis[field])
        control = record['syntheticPositiveControl']
        self.assertGreater(control['instructionsVisitedUpTo1000000'], 0)
        self.assertTrue(any(x['completed'] for x in control['boundedDecompilations']))

    def test_static_success_is_never_physical_root_or_whole_apk_security_claim(self):
        record = self.record()
        for key in ['deviceConnected', 'firmwareAcquired', 'firmwareFlashed', 'rootVerifiedOnDevice',
                    'wholeApkAudited', 'identifierCollection']:
            self.assertFalse(record[key])
        self.assertFalse(record['screenshotEvidence']['assessment']['knownWorkingRootMethodForThisDeviceVerified'])
        policy = (ROOT/'tools/wikiinajar/public-corpus-policy.mjs').read_text()
        self.assertIn('"docs/research/android-root-static-review.json"', policy)
        doc = (ROOT/'docs/android-a037u1-rooting-review.md').read_text()
        self.assertIn(record['sourceCommit'], doc)
        self.assertIn('not a whole-program', doc)


if __name__ == '__main__':
    unittest.main()
