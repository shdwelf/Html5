import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT/'tools/android-root-review/profile-state.py'
spec = importlib.util.spec_from_file_location('profile_review', SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
FEATURES = 'feature:android.software.managed_users\nfeature:android.hardware.camera\n'
PERSONAL = 'Users:\n\tUserInfo{0:SYNTHETIC-PRIVATE-PERSONAL:c13} running\n'
WORK = 'UserInfo{10:SYNTHETIC-PRIVATE-WORK:1030} running\n'
QUIET = 'UserInfo{11:SYNTHETIC-PRIVATE-QUIET:10b0}\n'


class AndroidProfileReviewTests(unittest.TestCase):
    def test_exactly_three_fixed_read_only_commands(self):
        self.assertEqual(mod.COMMANDS, (
            ('shell', 'getprop', 'ro.build.version.sdk'),
            ('shell', 'pm', 'list', 'features'),
            ('shell', 'pm', 'list', 'users'),
        ))
        text = SCRIPT.read_text()
        self.assertNotIn('shell=True', text)
        self.assertNotIn('dumpsys', '\n'.join(line for line in text.splitlines() if 'subprocess' in line))

    def test_android13_has_no_stock_private_space_version_eligibility(self):
        report = mod.summarize('33\n', FEATURES, PERSONAL)
        self.assertFalse(report['privateSpaceMeetsAndroidVersionMinimum'])
        self.assertFalse(report['privateSpaceAvailabilityConfirmed'])
        self.assertTrue(report['managedUsersSystemFeatureAdvertised'])

    def test_android15_version_gate_does_not_claim_complete_support(self):
        report = mod.summarize('35', FEATURES, PERSONAL)
        self.assertTrue(report['privateSpaceMeetsAndroidVersionMinimum'])
        self.assertFalse(report['privateSpaceAvailabilityConfirmed'])
        self.assertFalse(report['samsungSecureFolderSupportConfirmed'])

    def test_active_and_quiet_flags_are_counted_separately(self):
        report = mod.summarize('33', FEATURES, PERSONAL+WORK+QUIET)
        self.assertEqual(report['userOrProfileRecordCount'], 3)
        self.assertEqual(report['managedProfileFlagCount'], 2)
        self.assertEqual(report['quietManagedProfileFlagCount'], 1)

    def test_labels_and_user_ids_are_not_serialized(self):
        report = mod.summarize('33', FEATURES, PERSONAL+WORK)
        text = json.dumps(report)
        self.assertNotIn('SYNTHETIC-PRIVATE-PERSONAL', text)
        self.assertNotIn('SYNTHETIC-PRIVATE-WORK', text)
        for key in ['users', 'profiles', 'userIds', 'profileNames', 'adminComponents', 'accounts']:
            self.assertNotIn(key, report)
        self.assertFalse(report['profileNamesUserIdsAdminComponentsOrAccountsPublished'])

    def test_profile_name_with_colons_cannot_change_flags(self):
        report = mod.summarize('33', FEATURES, PERSONAL+'UserInfo{12:Label:with:colons:1030}\n')
        self.assertEqual(report['managedProfileFlagCount'], 1)
        self.assertNotIn('Label', json.dumps(report))

    def test_vendor_container_is_not_attributed_to_employer_or_spyware(self):
        report = mod.summarize('33', FEATURES, PERSONAL+'UserInfo{150:SYNTHETIC-VENDOR-CONTAINER:20001030}\n')
        self.assertEqual(report['managedProfileFlagCount'], 1)
        for field in ['profileAdministratorIdentified', 'organizationOrPersonalOwnershipDetermined',
                      'rootOrBootloaderUnlockVerified', 'vpnProtectionVerified']:
            self.assertFalse(report[field])
        self.assertTrue(any('Samsung vendor' in value for value in report['limits']))

    def test_absent_capability_is_not_replaced_with_an_assumption(self):
        report = mod.summarize('33', 'feature:android.hardware.camera\n', PERSONAL)
        self.assertFalse(report['managedUsersSystemFeatureAdvertised'])
        self.assertEqual(report['managedProfileFlagCount'], 0)

    def test_absent_or_unrecognized_user_output_fails_closed(self):
        for value in ['', 'Users:\n', 'Error: SYNTHETIC-RAW-NOT-FOR-REPORT', 'UserInfo{10:bad:NOTHEX}']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                mod.summarize('33', FEATURES, value)

    def test_duplicate_user_record_fails_closed(self):
        with self.assertRaises(ValueError): mod.summarize('33', FEATURES, PERSONAL+WORK+WORK)

    def test_invalid_sdk_or_oversize_output_fails_closed(self):
        for sdk in ['Android 13', '33\nother', '123456789012345', '0', '999', '34.0']:
            with self.subTest(sdk=sdk), self.assertRaises(ValueError): mod.summarize(sdk, FEATURES, PERSONAL)
        with self.assertRaises(ValueError): mod.summarize('33', 'x'*(mod.MAX_OUTPUT+1), PERSONAL)

    def test_profile_or_policy_changes_and_secondary_user_native_install_are_never_claimed(self):
        report = mod.summarize('33', FEATURES, PERSONAL+WORK)
        for field in ['rawOutputSavedOrPrinted', 'profileOrPolicyModified', 'zshaolinCompatibleBuildSupportsWorkProfileInstall']:
            self.assertFalse(report[field])
        self.assertTrue(any('primary-user-only' in line for line in report['limits']))

    def test_cli_error_omits_raw_adb_error_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            adb = Path(tmp)/'fake-adb'
            adb.write_text('#!/bin/sh\nprintf "SYNTHETIC-IDENTIFIER-ERROR" >&2\nexit 1\n')
            adb.chmod(0o700)
            result = subprocess.run([sys.executable, str(SCRIPT), '--adb', str(adb)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(result.stdout, '')
            self.assertNotIn('SYNTHETIC-IDENTIFIER-ERROR', result.stderr)

    def test_cli_emits_only_sanitized_counts_with_fake_read_only_adb(self):
        with tempfile.TemporaryDirectory() as tmp:
            adb = Path(tmp)/'fake-adb'
            log = Path(tmp)/'commands'
            code = '''#!/usr/bin/env python3
import os,sys
with open(os.environ['PROFILE_COMMAND_LOG'],'a') as f: f.write(' '.join(sys.argv[1:])+'\\n')
args=sys.argv[1:]
if args==['shell','getprop','ro.build.version.sdk']: print('33')
elif args==['shell','pm','list','features']: print('feature:android.software.managed_users')
elif args==['shell','pm','list','users']: print('Users:\\n  UserInfo{0:SYNTHETIC-NAME-NOT-RETAINED:c13} running\\n  UserInfo{10:SYNTHETIC-WORK-NOT-RETAINED:1030} running')
else: sys.exit(42)
'''
            adb.write_text(code); adb.chmod(0o700)
            env = dict(os.environ, PROFILE_COMMAND_LOG=str(log))
            result = subprocess.run([sys.executable, str(SCRIPT), '--adb', str(adb)], env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn('SYNTHETIC-NAME-NOT-RETAINED', result.stdout)
            self.assertNotIn('SYNTHETIC-WORK-NOT-RETAINED', result.stdout)
            self.assertEqual(json.loads(result.stdout)['managedProfileFlagCount'], 1)
            self.assertEqual(log.read_text().splitlines(), [' '.join(x) for x in mod.COMMANDS])

    def test_build_failure_annotation_redacts_secret_environment_values(self):
        env = dict(os.environ, SYNTHETIC_TOKEN='SYNTHETIC-REDACTION-CONTROL')
        child = "import os,sys; print(os.environ['SYNTHETIC_TOKEN']);sys.exit(7)"
        result = subprocess.run([sys.executable, str(ROOT/'tools/android-ci/run-checked.py'), 'synthetic-control', sys.executable, '-c', child], env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 7)
        annotation = next(line for line in result.stdout.splitlines() if line.startswith('::error'))
        self.assertIn('[REDACTED]', annotation)
        self.assertNotIn('SYNTHETIC-REDACTION-CONTROL', annotation)

    def test_document_preserves_profile_and_rooting_limits(self):
        text = (ROOT/'docs/android-work-profile-private-mode.md').read_text()
        for value in ['Android 15', 'July 1, 2025', 'not a stock Android 13 feature',
                      'primary', 'not a supported workaround', 'No raw screenshots', 'Pause is not delete']:
            self.assertIn(value, text)
        self.assertNotRegex(text, r'(?<!\d)\d{14,16}(?!\d)')
        self.assertNotRegex(text, r'(?i)(?:[0-9a-f]{2}:){5}[0-9a-f]{2}')
        policy = (ROOT/'tools/wikiinajar/public-corpus-policy.mjs').read_text()
        self.assertIn('"docs/android-work-profile-private-mode.md"', policy)


if __name__ == '__main__':
    unittest.main()
