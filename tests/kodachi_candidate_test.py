"""Original synthetic controls for the supplemental literal, never passwords."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('kodachi_candidate_search', ROOT / 'tools/kodachi/search-candidate.py')
search = importlib.util.module_from_spec(spec)
spec.loader.exec_module(search)


class CandidateTests(unittest.TestCase):
    def setUp(self):
        self.review = search.load_inspector()
        self.original = tuple(self.review.REQUESTED_LITERALS)
        self.review.REQUESTED_LITERALS = (*self.original, search.CANDIDATE)

    def report(self, contents):
        files = []
        for index, data in enumerate(contents):
            item = self.review.inspect_content('/opt/kodachi/config' + str(index), data, 'kodachi-runtime-or-config')
            item['layer'] = '/live/filesystem.squashfs'
            files.append(item)
        return {
            'files': files, 'counts': {'scannedFiles': len(files)},
            'iso': {'name': 'synthetic.iso', 'bytes': 0, 'sha256': '0' * 64},
            'layers': [], 'bytesRead': sum(len(data) for data in contents),
            'limits': {}, 'skipped': [], 'inspectedAtRunnerClock': 'synthetic',
            'sourceCommit': None, 'runId': None,
            'inspectionScriptSha256': hashlib.sha256((ROOT / 'tools/kodachi/inspect-iso.py').read_bytes()).hexdigest(),
            'dependencyLockSha256': hashlib.sha256((ROOT / 'tools/kodachi/inspect-requirements.txt').read_bytes()).hexdigest(),
            'scope': 'Original synthetic control, not the Kodachi ISO.',
            **{flag: False for flag in search.BOUNDARY_FLAGS},
        }

    def test_exact_candidate_utf8_and_standalone_boundaries(self):
        item = self.report([b'r@@t0r xr@@t0ry r@@t0r_ r@@tOr R@@t0r'])
        result = search.summarize(item, self.original)['requestedLiteralSearch'][search.CANDIDATE]
        self.assertEqual(result['matchingScannedFiles'], 1)
        self.assertEqual(result['utf8SubstringOccurrences'], 3)
        self.assertEqual(result['standaloneAsciiOccurrences'], 1)
        self.assertFalse(result['workingVpnCredentialProven'])

    def test_all_three_encodings_have_explicit_counts(self):
        data = [search.CANDIDATE.encode(encoding) for encoding in ('utf-8', 'utf-16le', 'utf-16be')]
        result = search.summarize(self.report(data), self.original)['requestedLiteralSearch'][search.CANDIDATE]
        self.assertEqual(result['matchingScannedFiles'], 3)
        for encoding in search.ENCODINGS:
            self.assertEqual(result[encoding + 'SubstringOccurrences'], 1)

    def test_zero_is_not_password_rejection_or_global_absence(self):
        result = search.summarize(self.report([b'no requested literal']), self.original)
        candidate = result['requestedLiteralSearch'][search.CANDIDATE]
        self.assertEqual(candidate['matchingScannedFiles'], 0)
        for encoding in search.ENCODINGS:
            self.assertEqual(candidate[encoding + 'SubstringOccurrences'], 0)
        for field in ('passwordAccepted', 'passwordRejected'):
            self.assertIsNone(result[field])
        for field in ('passwordAuthenticationAttempted', 'decryptionAttempted', 'ghidraRerun', 'noMatchProvesAbsenceFromEntireIsoOrRuntime'):
            self.assertFalse(result[field])

    def test_prior_literals_and_historical_module_are_not_modified(self):
        self.assertEqual(self.original, ('r00t0r', 'r00tor', 'r00t'))
        self.assertEqual(search.load_inspector().REQUESTED_LITERALS, self.original)
        result = search.summarize(self.report([b'r00t0r r00tor r00t']), self.original)
        self.assertEqual(tuple(result['requestedLiteralSearch']), (*self.original, search.CANDIDATE))
        self.assertEqual(result['requestedLiteralSearch']['r00t']['utf8SubstringOccurrences'], 3)
        self.assertEqual(self.review.candidate_kind('/somewhere/r@@t0r.txt'), 'requested-literal-path')

    def test_only_fixed_literal_metadata_leaves_the_wrapper(self):
        report = self.report([b'vpn_password="SYNTHETIC-UNKNOWN-SECRET"\nr@@t0r\n<key>SYNTHETIC-PRIVATE-KEY</key>'])
        result = search.summarize(report, self.original)
        text = json.dumps(result)
        self.assertNotIn('SYNTHETIC-UNKNOWN-SECRET', text)
        self.assertNotIn('SYNTHETIC-PRIVATE-KEY', text)
        self.assertNotIn('credentialFields', text)
        self.assertFalse(result['arbitraryStringsOrFileContentsPublished'])
        self.assertEqual(result['supplementalMatchingFileMetadata'][0]['bytesRead'], report['files'][0]['bytesRead'])

    def test_matching_file_metadata_and_transport_are_bounded(self):
        report = self.report([b'r@@t0r'] * 20)
        result = search.summarize(report, self.original)
        self.assertEqual(len(result['supplementalMatchingFileMetadata']), 16)
        self.assertEqual(result['supplementalMatchingFileMetadataOmitted'], 4)
        self.assertLessEqual(len((json.dumps(result, separators=(',', ':')) + '\n').encode()), search.MAX_REPORT_BYTES)
        report['scope'] = 'x' * search.MAX_REPORT_BYTES
        with self.assertRaisesRegex(ValueError, 'transport'):
            search.summarize(report, self.original)

    def test_missing_or_violated_boundary_and_incomplete_counts_fail_closed(self):
        for flag in search.BOUNDARY_FLAGS:
            for value in (True, None):
                report = self.report([])
                report[flag] = value
                with self.subTest(flag=flag, value=value), self.assertRaises(ValueError):
                    search.summarize(report, self.original)
        report = self.report([])
        report['counts']['scannedFiles'] = 1
        with self.assertRaisesRegex(ValueError, 'counts'):
            search.summarize(report, self.original)

    def test_wrong_iso_cannot_produce_an_output(self):
        with tempfile.TemporaryDirectory() as directory:
            iso = Path(directory) / 'not-an-iso'
            iso.write_bytes(b'not an ISO')
            output = Path(directory) / 'result.json'
            with self.assertRaisesRegex(ValueError, 'pinned original ISO'):
                search.main(iso, output)
            self.assertFalse(output.exists())

    def test_existing_output_and_dangling_symlink_are_not_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'result.json'
            output.write_text('keep')
            with self.assertRaisesRegex(ValueError, 'fresh'):
                search.main(Path(directory) / 'absent.iso', output)
            self.assertEqual(output.read_text(), 'keep')
            output.unlink()
            output.symlink_to('absent')
            with self.assertRaisesRegex(ValueError, 'fresh'):
                search.main(Path(directory) / 'absent.iso', output)

    def test_orchestration_writes_private_summary_and_removes_temporary_report(self):
        report = self.report([b'r@@t0r'])
        seen = []
        def fixture_main(iso_path, output):
            # The real pinned ISO gate is covered above and by the base tests.
            seen.append(output)
            output.write_text(json.dumps(report))
        self.review.main = fixture_main
        self.review.REQUESTED_LITERALS = self.original
        with tempfile.TemporaryDirectory() as directory, patch.object(search, 'load_inspector', return_value=self.review):
            output = Path(directory) / 'result.json'
            result = search.main(Path(directory) / 'synthetic.iso', output)
            self.assertEqual(output.stat().st_mode & 0o777, 0o600)
            self.assertEqual(json.loads(output.read_text()), result)
            self.assertEqual(self.review.REQUESTED_LITERALS, (*self.original, search.CANDIDATE))
            self.assertFalse(seen[0].exists())


if __name__ == '__main__':
    unittest.main()
