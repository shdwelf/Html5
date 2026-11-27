"""Synthetic static-inspection controls. No network, real ISO or credentials."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import struct
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('kodachi_inspect', ROOT / 'tools/kodachi/inspect-iso.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


def squash_fixture(files):
    """Small, original uncompressed SquashFS v4 fixture, not distro bytes."""
    data = bytearray(96)
    inode_data = bytearray(32)
    entries = bytearray(struct.pack('<III', len(files) - 1, 0, 2))
    for i, (name, content) in enumerate(files.items(), 2):
        position = len(data)
        data.extend(content)
        inode_offset = len(inode_data)
        inode_data.extend(struct.pack('<HHHHIIIIII', 2, 0o644, 0, 0, 0, i, position, 0xffffffff, 0, len(content)))
        if content:
            inode_data.extend(struct.pack('<I', len(content) | (1 << 24)))
        encoded = name.encode()
        entries.extend(struct.pack('<HhHH', inode_offset, i - 2, 2, len(encoded) - 1) + encoded)
    inode_data[:32] = struct.pack('<HHHHIIIIHHI', 1, 0o755, 0, 0, 0, 1, 0, 2, len(entries) + 3, 0, 1)
    inode_start = len(data)
    data.extend(struct.pack('<H', len(inode_data) | 0x8000) + inode_data)
    dir_start = len(data)
    data.extend(struct.pack('<H', len(entries) | 0x8000) + entries)
    id_block = len(data)
    data.extend(struct.pack('<HI', 4 | 0x8000, 0))
    id_table = len(data)
    data.extend(struct.pack('<Q', id_block))
    invalid = 0xffffffffffffffff
    data[:96] = struct.pack('<5I6H8Q', 0x73717368, len(files) + 1, 0, 4096, 0, 1, 12, 16, 1, 4, 0, 0, len(data), id_table, invalid, inode_start, dir_start, invalid, invalid)
    return bytes(data)


class InspectionTests(unittest.TestCase):
    def test_virtual_paths_reject_traversal_and_json_escape_literal_linux_names(self):
        for bad in ['relative', '/../etc/passwd', '/x/./vpn', '/x\x00']:
            with self.subTest(bad=repr(bad)), self.assertRaises(ValueError):
                review.safe_path(bad)
        self.assertEqual(review.safe_path('/etc/café/vpn.conf'), '/etc/café/vpn.conf')
        for literal in ['/x\\y', '/x\n::notice', '/x\udcff']:
            self.assertEqual(review.safe_path(literal), literal)
            self.assertNotIn('\n', json.dumps({'path': literal}))

    def test_candidate_scope_includes_profiles_auth_wireguard_and_kodachi_not_general_browser_data(self):
        for path in ['/any/provider.ovpn', '/etc/wireguard/wg0.conf', '/etc/openvpn/client/auth.txt', '/home/kodachi/Own_VPN_Config/myownvpnsetup', '/usr/bin/kodachi-vpn', '/opt/kodachi/config.json', '/home/kodachi/.config/kodachi/auth.json']:
            self.assertIsNotNone(review.candidate_kind(path), path)
        for path in ['/home/kodachi/.mozilla/firefox/bookmarks.sqlite', '/etc/shadow', '/usr/lib/other.so', '/opt/kodachi/wallpaper.png']:
            self.assertIsNone(review.candidate_kind(path), path)

    def test_empty_placeholder_and_runtime_fields_are_not_password_findings(self):
        for raw, expected in [("''", 'empty'), ('""', 'empty'), ('...', 'placeholder'), ('<password>', 'placeholder'), ('"your_password"', 'placeholder'), ('"${VPN_PASSWORD}"', 'runtime-expression'), ('$(read_password)', 'runtime-expression')]:
            self.assertEqual(review.value_state(raw)['state'], expected)

    def test_unknown_literals_are_redacted_even_if_the_user_is_looking_for_a_password(self):
        result = review.inspect_content('/etc/openvpn/config.json', b'vpn_password="SYNTHETIC-NOT-REAL-CREDENTIAL"\n', 'vpn-config')
        self.assertEqual(result['credentialFields'][0]['state'], 'nonempty-literal')
        self.assertNotIn('SYNTHETIC-NOT-REAL-CREDENTIAL', json.dumps(result))
        self.assertTrue(result['credentialFields'][0]['valueRedacted'])

    def test_known_public_os_login_literal_is_never_recast_as_a_working_vpn_password(self):
        result = review.inspect_content('/opt/kodachi/setup.sh', b'vpn_password="r@@t00"\n', 'kodachi-runtime-or-config')
        field = result['credentialFields'][0]
        self.assertEqual(field['knownPublishedOsLoginDefault'], 'r@@t00')
        self.assertFalse(field['vpnPasswordProven'])
        self.assertEqual(result['knownOsLoginLiteralOccurrences'], {'r@@t00': 1})

    def test_ovpn_auth_targets_are_inventory_only_and_inline_private_keys_are_not_published(self):
        text = b'client\nauth-user-pass ../auth.txt\n<key>\nSYNTHETIC-PRIVATE-MATERIAL\n</key>\n'
        result = review.inspect_content('/etc/openvpn/example.ovpn', text, 'vpn-profile')
        self.assertEqual(result['authDirectives'][0]['argument'], '../auth.txt')
        self.assertNotIn('SYNTHETIC-PRIVATE-MATERIAL', json.dumps(result))
        self.assertFalse(result['binary'])

    def test_inline_auth_and_two_line_auth_files_never_publish_values(self):
        for path, data, field in [('/etc/openvpn/a.ovpn', b'<auth-user-pass>\nSYNTHETIC-USER\nSYNTHETIC-PASSWORD\n</auth-user-pass>', 'inlineAuth'), ('/etc/openvpn/auth.txt', b'SYNTHETIC-USER\nSYNTHETIC-PASSWORD\n', 'shortAuthFileCandidate')]:
            result = review.inspect_content(path, data, 'vpn-config')
            self.assertEqual(result[field]['nonemptyLines'], 2)
            self.assertNotIn('SYNTHETIC-PASSWORD', json.dumps(result))
            self.assertNotIn('SYNTHETIC-USER', json.dumps(result))

    def test_binary_search_reports_paths_not_arbitrary_strings_or_credentials(self):
        data = b'\x7fELF\0password=SYNTHETIC-SECRET\0/etc/openvpn/auth.txt\0https://example.invalid/?token=SYNTHETIC-TOKEN'
        result = review.inspect_content('/usr/bin/kodachi-vpn', data, 'kodachi-runtime-or-config')
        self.assertIn('/etc/openvpn/auth.txt', result['pathReferences'])
        self.assertNotIn('SYNTHETIC-SECRET', json.dumps(result))
        self.assertNotIn('SYNTHETIC-TOKEN', json.dumps(result))

    def test_superblock_rejects_wrong_magic_bad_block_sizes_out_of_range_tables_and_truncation(self):
        data = squash_fixture({'example.ovpn': b'client\n'})
        self.assertEqual(review.validated_superblock(io.BytesIO(data))['inodes'], 2)
        for offset, value in [(0, 0), (4, review.MAX_ENTRIES + 1), (12, 1), (28, 3)]:
            bad = bytearray(data)
            struct.pack_into('<I', bad, offset, value)
            with self.subTest(offset=offset), self.assertRaises(ValueError):
                review.validated_superblock(io.BytesIO(bad))
        for bad in [data[:95], data[:-1]]:
            with self.assertRaises(ValueError):
                review.validated_superblock(io.BytesIO(bad))

    def test_preview_is_bounded_and_does_not_hide_later_small_findings_behind_one_large_record(self):
        large = {'path': '/opt/kodachi/a', 'kind': 'kodachi-runtime-or-config', 'pathReferences': ['/etc/openvpn/' + 'x' * 220] * 100, 'credentialFields': []}
        small = review.inspect_content('/etc/openvpn/b.conf', b'vpn_password=""\n', 'vpn-config')
        report = {'files': [large] * 100 + [small], 'skipped': []}
        result = review.preview(report)
        self.assertLess(len(json.dumps(result, separators=(',', ':')).encode()), 14001)
        self.assertTrue(any(r['path'] == '/etc/openvpn/b.conf' for r in result['previewFiles']))

    def test_flags_structures_and_code_are_not_mistaken_for_literal_passwords(self):
        for raw, state in [('false', 'boolean-not-credential'), ('{', 'structure-not-credential'), ('4096', 'numeric-configuration'), ('16 * 1024', 'runtime-expression'), ('read_password()', 'runtime-expression')]:
            self.assertEqual(review.value_state(raw)['state'], state)
        for name in ['password', 'VPN_PASS', 'pwd', 'username', 'auth_user_pass_template']:
            self.assertTrue(review.credential_field(name))
        for name in ['keepassxc', 'compass', 'bypass']:
            self.assertFalse(review.credential_field(name))
        result = review.inspect_content('/opt/kodachi/settings.json', b'keepassxc="/usr/bin/keepassxc"\novpn_uses_auth_user_pass: false\n', 'kodachi-runtime-or-config')
        self.assertEqual(len(result['credentialFields']), 1)
        self.assertEqual(result['credentialFields'][0]['state'], 'boolean-not-credential')

    def test_provider_auth_templates_report_empty_placeholder_or_redacted_states_only(self):
        text = json.dumps({'providers': [{'auth_user_pass_template': {'username': '{{USERNAME}}', 'password': ''}}, {'auth_user_pass_template': None}, {'auth_user_pass_template': {'username': 'SYNTHETIC-USER', 'password': 'SYNTHETIC-SECRET'}}]})
        result = review.inspect_content('/opt/kodachi/config/vpn-providers-public-api.json', text.encode(), 'kodachi-runtime-or-config')
        templates = result['providerAuthTemplates']
        self.assertEqual(len(templates), 3)
        self.assertTrue(any(t.get('state') == 'no-template' for t in templates))
        self.assertTrue(any(t.get('fields', {}).get('password', {}).get('state') == 'empty' for t in templates))
        self.assertTrue(any(t.get('fields', {}).get('username', {}).get('state') == 'placeholder' for t in templates))
        self.assertNotIn('SYNTHETIC-SECRET', json.dumps(result))
        self.assertNotIn('SYNTHETIC-USER', json.dumps(result))

    def test_runtime_paths_are_prioritized_over_compiler_sources_without_losing_config_references(self):
        data = b'\x7fELF\0/home/build/.cargo/registry/auth/src/lib.rs\0/etc/openvpn/auth.txt\0/run/kodachi/vpn.sock\0'
        result = review.inspect_content('/opt/kodachi/vpn-manager', data, 'kodachi-runtime-or-config')
        self.assertEqual(result['pathReferences'][0], '/etc/openvpn/auth.txt')
        text = b'VPN_CONFIG="/etc/openvpn/client.conf"\nVPN_PASSWORD="/auth/SYNTHETIC-SECRET"\n'
        result = review.inspect_content('/opt/kodachi/setup.sh', text, 'kodachi-runtime-or-config')
        self.assertIn('/etc/openvpn/client.conf', result['pathReferences'])
        self.assertNotIn('SYNTHETIC-SECRET', json.dumps(result))

    def test_preview_inventories_config_without_auth_fields_and_summarizes_entire_search(self):
        configs = [review.inspect_content('/etc/openvpn/config' + str(i) + '.conf', b'client\n', 'vpn-config') for i in range(100)]
        binary = review.inspect_content('/opt/kodachi/vpn-manager', b'\x7fELF\0/etc/openvpn/auth.txt\0', 'kodachi-runtime-or-config')
        result = review.preview({'files': configs + [binary], 'skipped': []})
        self.assertEqual(result['configurationInventoryCount'], 100)
        self.assertEqual(len(result['configurationInventory']), 8)
        self.assertEqual(result['authenticationRecordCounts']['shortAuthFileCandidate'], 0)
        self.assertLessEqual(len(json.dumps(result, separators=(',', ':')).encode()), 14000)
        self.assertTrue(any(f['path'] == configs[0]['path'] for f in result['previewFiles']))

    def test_path_shaped_credential_values_do_not_reappear_as_path_references(self):
        result = review.inspect_content('/etc/openvpn/settings.conf', b'vpn_password="/auth/SYNTHETIC-SECRET"\n', 'vpn-config')
        self.assertNotIn('SYNTHETIC-SECRET', json.dumps(result))
        self.assertNotIn('pathReferences', result)

    def test_virtual_walk_never_resolves_links_and_rejects_cyclic_directories(self):
        class Node:
            def __init__(self, name, type, block, children=()):
                self.name, self.type, self.block, self.offset, self.children = name, type, block, 0, children
            def is_symlink(self): return self.type == 'symlink'
            def is_dir(self): return self.type == 'dir'
            def is_file(self): return self.type == 'file'
            def iterdir(self): return iter(self.children)
        link = Node('vpn-link', 'symlink', 2)
        special = Node('device', 'special', 3)
        root = Node('/', 'dir', 1, [link, special])
        self.assertEqual([(path, kind) for path, node, kind in review.walk_files(root)], [('/vpn-link', 'symlink'), ('/device', 'special')])
        root.children = [Node('loop', 'dir', 1)]
        with self.assertRaisesRegex(ValueError, 'cyclic'):
            list(review.walk_files(root))

    def test_vpn_pass_pwd_passphrase_and_alternate_auth_filenames_are_not_missed(self):
        for field in ['VPN_PASS', 'vpn_pwd', 'vpn_passphrase', 'pass', 'pwd']:
            result = review.inspect_content('/etc/openvpn/config.conf', (field + '=SYNTHETIC-SECRET\n').encode(), 'vpn-config')
            self.assertEqual(result['credentialFields'][0]['state'], 'nonempty-literal')
            self.assertNotIn('SYNTHETIC-SECRET', json.dumps(result))
        for name in ['pass.txt', 'credentials.txt', 'login', 'secret.txt']:
            result = review.inspect_content('/etc/openvpn/' + name, b'SYNTHETIC-USER\nSYNTHETIC-SECRET\n', 'vpn-config')
            self.assertEqual(result['shortAuthFileCandidate']['nonemptyLines'], 2)
            self.assertNotIn('SYNTHETIC-SECRET', json.dumps(result))

    def test_requested_root_variants_are_literal_evidence_not_password_or_role_claims(self):
        result = review.inspect_content('/opt/kodachi/settings', b'r00t0r r00tor r00t xr00ty ' + 'r00tor'.encode('utf-16le'), 'kodachi-runtime-or-config')
        self.assertEqual(result['requestedLiteralMatches']['r00tor']['utf8SubstringOccurrences'], 1)
        self.assertEqual(result['requestedLiteralMatches']['r00tor']['utf16leSubstringOccurrences'], 1)
        self.assertEqual(result['requestedLiteralMatches']['r00t']['standaloneAsciiOccurrences'], 1)
        self.assertFalse(result['workingVpnCredentialProven'])
        self.assertTrue(result['literalRoleUnproven'])
        result = review.preview({'files': [result], 'skipped': []})
        self.assertEqual(result['requestedLiteralSearch']['r00t0r']['matchingScannedFiles'], 1)
        self.assertFalse(result['requestedLiteralSearch']['r00t0r']['workingVpnCredentialProven'])
        self.assertEqual(review.candidate_kind('/somewhere/r00t0r.txt'), 'requested-literal-path')

    def test_path_references_exclude_url_components_and_arbitrary_slash_shaped_tokens(self):
        data = b'\x7fELF\0https://host.invalid/auth/SYNTHETIC-TOKEN\0/etc/openvpn/auth.txt\0'
        result = review.inspect_content('/opt/kodachi/vpn', data, 'kodachi-runtime-or-config')
        self.assertNotIn('SYNTHETIC-TOKEN', json.dumps(result))
        self.assertEqual(result['binaryFormat'], 'ELF')
        self.assertEqual(result['pathReferences'], ['/etc/openvpn/auth.txt'])

    def test_preview_identifies_redacted_literal_field_locations_and_all_template_states(self):
        text=json.dumps({'vpn_password':'SYNTHETIC-SECRET','providers':[{'auth_user_pass_template':None},{'auth_user_pass_template':'{{USERNAME}}\\n{{PASSWORD}}'}]},indent=2)
        item=review.inspect_content('/opt/kodachi/config/vpn-providers-public-api.json',text.encode(),'kodachi-runtime-or-config')
        result=review.preview({'files':[item],'skipped':[]})
        self.assertEqual(result['credentialLiteralCandidatesCount'],1)
        self.assertEqual(result['credentialLiteralCandidates'][0]['field'],'vpn_password')
        self.assertEqual(result['credentialLiteralCandidates'][0]['path'],item['path'])
        self.assertTrue(result['credentialLiteralCandidates'][0]['valueRedacted'])
        self.assertEqual(result['providerTemplateStates'],{'no-template':1,'placeholder':1})
        self.assertNotIn('SYNTHETIC-SECRET',json.dumps(result))

    def test_all_requested_literals_are_searched_in_utf16be_and_zero_match_summaries_are_explicit(self):
        data='r00t0r r00tor r00t'.encode('utf-16be')
        item=review.inspect_content('/opt/kodachi/config.json',data,'kodachi-runtime-or-config')
        for token,count in [('r00t0r',1),('r00tor',1),('r00t',3)]:
            self.assertEqual(item['requestedLiteralMatches'][token]['utf16beSubstringOccurrences'],count)
            self.assertNotIn('utf8SubstringOccurrences',item['requestedLiteralMatches'][token])
        preview=review.preview({'files':[item],'skipped':[]})
        self.assertTrue(all(v['matchingScannedFiles']==1 for v in preview['requestedLiteralSearch'].values()))
        empty=review.preview({'files':[],'skipped':[]})
        self.assertTrue(all(v['matchingScannedFiles']==0 for v in empty['requestedLiteralSearch'].values()))

    def test_main_refuses_wrong_iso_size_before_parser_or_report_writes(self):
        with tempfile.TemporaryDirectory() as directory:
            iso = Path(directory) / 'wrong.iso'
            iso.write_bytes(b'not an ISO')
            out = Path(directory) / 'report.json'
            with self.assertRaisesRegex(ValueError, 'pinned original ISO'):
                review.main(iso, out)
            self.assertFalse(out.exists())

    def test_real_readers_inspect_original_synthetic_iso_and_squashfs_without_extracting_or_executing(self):
        import pycdlib
        fixture = squash_fixture({'vpn.ovpn': b'client\nauth-user-pass vpn-auth.txt\n', 'vpn-auth.txt': b'SYNTHETIC-USER\nSYNTHETIC-PASSWORD\n', 'kodachi-vpn': b'\x7fELF\0/etc/openvpn/client.conf\0'})
        with tempfile.TemporaryDirectory() as directory:
            iso_path = Path(directory) / 'synthetic.iso'
            iso = pycdlib.PyCdlib()
            iso.new(interchange_level=3, rock_ridge='1.09', joliet=3)
            iso.add_directory(iso_path='/LIVE', rr_name='live')
            iso.add_fp(io.BytesIO(fixture), len(fixture), iso_path='/LIVE/FILESYSTEM.SQUASHFS;1', rr_name='filesystem.squashfs')
            iso.write(str(iso_path))
            iso.close()
            result = review.inspect_iso(iso_path)
            self.assertEqual(result['counts']['scannedFiles'], 3)
            self.assertEqual(result['counts']['vpn-profile'], 1)
            self.assertFalse(result['booted'])
            self.assertFalse(result['mounted'])
            self.assertFalse(result['executedImageFiles'])
            self.assertEqual(sorted(p.name for p in Path(directory).iterdir()), ['synthetic.iso'])
            self.assertNotIn('SYNTHETIC-PASSWORD', json.dumps(result))
            auth = next(f for f in result['files'] if f['path'] == '/vpn-auth.txt')
            self.assertEqual(auth['shortAuthFileCandidate']['nonemptyLines'], 2)


if __name__ == '__main__':
    unittest.main()
