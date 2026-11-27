import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('android_apk_signature', ROOT/'tools/android-ci/apk_signature.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
DIGEST = 'a1' * 32


class AndroidSignatureReviewTests(unittest.TestCase):
    def test_old_and_new_verified_certificate_labels(self):
        for prefix in ['Signer #1', 'Signer #2', 'V2 Signer', 'V3 Signer', 'V3.1 Signer',
                       'Signer (minSdkVersion=28, maxSdkVersion=32)']:
            with self.subTest(prefix=prefix):
                text = f'Verifies\nNumber of signers: 1\n{prefix}: certificate SHA-256 digest: {DIGEST}\n'
                self.assertEqual(mod.certificate_fingerprints(text), [DIGEST])

    def test_certificate_not_public_key_or_weak_digest(self):
        for label in ['public key SHA-256', 'certificate SHA-1', 'certificate MD5']:
            self.assertEqual(mod.certificate_fingerprints(f'V2 Signer: {label} digest: {DIGEST}\n'), [])

    def test_hex_length_line_anchor_and_unexpected_labels_fail_closed(self):
        for value in ['a'*63, 'a'*65, 'not-hex', DIGEST+' extra']:
            self.assertEqual(mod.certificate_fingerprints('V2 Signer: certificate SHA-256 digest: '+value), [])
        for label in ['WARNING V2 Signer', 'Not A Signer', 'V9 Signer']:
            self.assertEqual(mod.certificate_fingerprints(label+': certificate SHA-256 digest: '+DIGEST), [])

    def test_duplicate_scheme_certificate_is_unique_and_different_certs_are_preserved(self):
        text = f'V2 Signer: certificate SHA-256 digest: {DIGEST}\nV3 Signer: certificate SHA-256 digest: {DIGEST.upper()}\n'
        self.assertEqual(mod.certificate_fingerprints(text), [DIGEST])
        text += 'Signer #2: certificate SHA-256 digest: '+('b2'*32)+'\n'
        self.assertEqual(mod.certificate_fingerprints(text), [DIGEST, 'b2'*32])

    def test_both_receipts_use_parser_after_successful_apksigner_command(self):
        static = (ROOT/'tools/android-root-review/static-review.py').read_text()
        apk = (ROOT/'tools/zshaolin-modern/apk-receipt.py').read_text()
        self.assertIn('from apk_signature import certificate_fingerprints', static)
        self.assertIn('from apk_signature import certificate_fingerprints', apk)
        self.assertLess(apk.index('subprocess.check_output([str(signer)'), apk.index('fingerprints = certificate_fingerprints'))
        self.assertIn('if len(fingerprints) != 1:', apk)
        workflow = (ROOT/'.github/workflows/android-root-static-review.yml').read_text()
        self.assertIn('set -euo pipefail', workflow)
        self.assertIn('verify --verbose --print-certs', workflow)
        self.assertNotIn('continue-on-error', workflow)


if __name__ == '__main__':
    unittest.main()
