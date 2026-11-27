import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'tools/android-root-review/device-state.py'
spec = importlib.util.spec_from_file_location('android_device_review', SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class AndroidRootReviewTests(unittest.TestCase):
    def good(self):
        return {'ro.product.model': 'SM-A037U1', 'ro.build.version.incremental': mod.CANDIDATE_BUILD,
                'ro.build.version.release': '13', 'ro.build.version.sdk': '33',
                'ro.boot.flash.locked': '0', 'ro.boot.vbmeta.device_state': 'unlocked',
                'ro.boot.verifiedbootstate': 'orange'}

    def test_screenshots_resolve_the_firmware_transcription(self):
        record = json.loads((ROOT / 'tools/android-root-review/screenshot-findings.json').read_text())
        self.assertEqual(record['observed']['modelLabel'], 'SM-A037U1/DS')
        self.assertEqual(record['observed']['buildDisplay'], 'TP1A.220624.014.A037U1UESBDYI1')
        self.assertEqual(record['observed']['firmwareSuffix'], mod.CANDIDATE_BUILD)
        self.assertEqual(record['observed']['oneUiCore'], '5.1')
        self.assertEqual(record['observed']['android'], '13')
        self.assertEqual(record['observed']['selinux'], 'Enforcing')

    def test_follow_up_confirms_patch_date_without_inventing_initial_visibility(self):
        record = json.loads((ROOT / 'tools/android-root-review/screenshot-findings.json').read_text())
        self.assertEqual(record['observed']['androidSecurityPatchLevel'], '2025-07-01')
        self.assertEqual(record['observed']['googlePlaySystemUpdate'], '2024-08-01')
        self.assertFalse(record['captureProgression']['initialScreenshotAndroidPatchDateVisible'])
        self.assertTrue(record['captureProgression']['followUpScreenshotAndroidPatchDateVisible'])
        self.assertFalse(any('cut off' in row for row in record['notVisible']))
        self.assertEqual(record['externalCatalogCrossCheck']['listedAndroidSecurityPatchLevel'], '2025-07-01')
        self.assertIn('not an authenticated firmware', record['externalCatalogCrossCheck']['limit'])

    def test_official_label_and_model_sku_do_not_prove_unlock_or_management_state(self):
        record = json.loads((ROOT / 'tools/android-root-review/screenshot-findings.json').read_text())
        self.assertEqual(record['observed']['phoneStatusLabel'], 'Official')
        self.assertEqual(record['observed']['salesModelCode'], 'SM-A037UZKLLLA')
        for key in ['officialStatusLabelProvesUnlockedOrUnmanaged', 'profileAdministratorOrSpywareIdentified', 'secureFolderSupportConfirmed']:
            self.assertFalse(record['assessment'][key])

    def test_screenshot_does_not_claim_root_or_ghidra_execution(self):
        record = json.loads((ROOT / 'tools/android-root-review/screenshot-findings.json').read_text())
        for field in ['bootloaderUnlockConfirmed', 'magiskInstallabilityConfirmed',
                      'knownWorkingRootMethodForThisDeviceVerified', 'vulnerabilityProvedByKernelVersion',
                      'selinuxEnforcingProvesUnrooted', 'vpnProviderOrProtectionVerified',
                      'ghidraAnalysisPerformed', 'firmwarePatchedOrFlashed',
                      'screenshotsCopiedIntoRepository', 'phoneIdentifiersOrNetworkAddressesRetainedInThisRecord']:
            self.assertIs(record['assessment'][field], False, field)

    def test_no_download_state_means_stop_even_when_owner_reports_oem_toggle(self):
        result = mod.assess(self.good())
        self.assertFalse(result['bootloaderUnlockConfirmed'])
        self.assertFalse(result['magiskPrerequisitesAppearSatisfied'])
        self.assertGreaterEqual(len(result['blockers']), 2)

    def test_only_confirmed_prerequisites_are_not_a_working_root_claim(self):
        result = mod.assess(self.good(), 'OFF (U)', 'Checking')
        self.assertTrue(result['magiskPrerequisitesAppearSatisfied'])
        for field in ['workingRootVerified', 'physicalDeviceTested', 'stockFirmwareAcquiredAndAuthenticated',
                      'patchedFirmwareProduced', 'flashingPerformed', 'identifierCollection']:
            self.assertIs(result[field], False)

    def test_ds_label_is_same_reported_model_not_an_international_firmware_substitution(self):
        values = self.good(); values['ro.product.model'] = 'SM-A037U1/DS'
        self.assertTrue(mod.assess(values, 'OFF (U)', 'Completed')['magiskPrerequisitesAppearSatisfied'])
        for model in ['SM-A037F', 'SM-A037G', 'SM-A037M', 'SM-A037U', 'SM-A037W']:
            values['ro.product.model'] = model
            self.assertFalse(mod.assess(values, 'OFF (U)', 'Completed')['magiskPrerequisitesAppearSatisfied'], model)

    def test_on_u_is_not_unlocked(self):
        result = mod.assess(self.good(), 'ON (U)', 'Checking')
        self.assertFalse(result['bootloaderUnlockConfirmed'])
        self.assertFalse(result['magiskPrerequisitesAppearSatisfied'])

    def test_locked_or_contradictory_properties_fail_closed(self):
        for key, value in [('ro.boot.flash.locked', '1'), ('ro.boot.vbmeta.device_state', 'locked'),
                           ('ro.boot.flash.locked', ''), ('ro.boot.vbmeta.device_state', '')]:
            values = self.good(); values[key] = value
            self.assertFalse(mod.assess(values, 'OFF (U)', 'Checking')['magiskPrerequisitesAppearSatisfied'])

    def test_knoxguard_active_locked_prenormal_missing_are_stops(self):
        for kg in ['Active', 'Locked', 'Prenormal', 'not-shown', None]:
            self.assertFalse(mod.assess(self.good(), 'OFF (U)', kg)['magiskPrerequisitesAppearSatisfied'], kg)

    def test_other_firmware_never_passes_current_device_gate(self):
        values = self.good(); values['ro.build.version.incremental'] = 'A037U1UESADYD1'
        self.assertFalse(mod.assess(values, 'OFF (U)', 'Checking')['magiskPrerequisitesAppearSatisfied'])

    def test_identifier_property_keys_are_rejected(self):
        for name in ['ro.serialno', 'ro.boot.serialno', 'imei', 'phoneNumber', 'deviceId']:
            values = self.good(); values[name] = 'NOT-REAL-ID'
            with self.assertRaises(ValueError): mod.assess(values)

    def test_identifier_shaped_value_is_rejected_even_with_known_key(self):
        values = self.good(); values['ro.product.model'] = '123456789012345'
        with self.assertRaises(ValueError): mod.assess(values)

    def test_invalid_properties_are_rejected(self):
        for bad in ['wrong\nline', 'wrong\rline', 'x' * 181, 33]:
            values = self.good(); values['ro.product.model'] = bad
            with self.assertRaises(ValueError): mod.assess(values)

    def test_cli_error_never_echoes_unknown_or_identifier_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'untrusted.json'
            path.write_text(json.dumps({'ro.serialno': 'SYNTHETIC-DO-NOT-ECHO'}))
            result = subprocess.run([sys.executable, str(SCRIPT), '--from-json', str(path)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertNotIn('SYNTHETIC-DO-NOT-ECHO', result.stdout + result.stderr)
            self.assertEqual(result.stdout, '')

    def test_collect_command_is_fixed_getprop_only_not_identifier_dump_or_flash(self):
        text = SCRIPT.read_text()
        self.assertIn("[args.adb, 'shell', 'getprop', key]", text)
        self.assertNotIn('shell=True', text)
        self.assertNotIn("'devices'", text)
        for prop in mod.PROPERTIES:
            self.assertNotRegex(prop, r'(?i)(serial|imei|subscriber|account|phone_number)')
        self.assertNotRegex(text, r"subprocess\.[^(]+\(\[[^\]]*'(?:su|root|flash|reboot|unlock)'", text)

    def test_public_evidence_has_no_identifier_shaped_sequences_or_raw_image_links(self):
        for rel in ['tools/android-root-review/screenshot-findings.json', 'docs/android-a037u1-rooting-review.md']:
            text = (ROOT / rel).read_text()
            self.assertNotRegex(text, r'(?<!\d)\d{14,16}(?!\d)')
            self.assertNotRegex(text, r'!\[[^\]]*\]\([^)]*\.(?:jpg|png)')

    def test_magisk_and_ghidra_inputs_are_pinned_not_a_safety_verdict(self):
        pins = json.loads((ROOT / 'tools/android-root-review/inputs.json').read_text())
        self.assertTrue(pins['firmwareConfirmedInOwnerScreenshot'])
        self.assertFalse(pins['candidateFirmwareMeasuredOnDevice'])
        for name in ['magisk', 'ghidra']:
            self.assertRegex(pins[name]['sha256'], r'^[0-9a-f]{64}$')
            self.assertTrue(pins[name]['url'].startswith('https://github.com/'))
        self.assertTrue(all(value is False for value in pins['guardrails'].values()))


if __name__ == '__main__':
    unittest.main()
