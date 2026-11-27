import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT/'tools/android-ci/publish-test-summary.py'
spec = importlib.util.spec_from_file_location('android_test_summary', SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class AndroidCiReviewTests(unittest.TestCase):
    def test_only_test_counts_and_bounded_failure_details_not_logcat(self):
        with tempfile.TemporaryDirectory() as tmp:
            xml = Path(tmp)/'TEST-control.xml'
            xml.write_text('''<testsuite name="synthetic" tests="1" failures="1" errors="0"><testcase name="offlineInstall"><failure message="SYNTHETIC-CONTROL-FAILURE"/></testcase><system-out>RAW-LOGCAT-NOT-FOR-REPORT</system-out></testsuite>''')
            report = mod.summarize(xml)
            self.assertEqual(report['tests'], 1)
            self.assertEqual(report['failureDetails'][0]['message'], 'SYNTHETIC-CONTROL-FAILURE')
            self.assertNotIn('RAW-LOGCAT-NOT-FOR-REPORT', str(report))

    def test_message_and_xml_size_bounds(self):
        with tempfile.TemporaryDirectory() as tmp:
            xml = Path(tmp)/'TEST-control.xml'
            xml.write_text('<testsuite><testcase><failure message="'+'x'*6000+'"/></testcase></testsuite>')
            self.assertEqual(len(mod.summarize(xml)['failureDetails'][0]['message']), 2000)
            xml.write_bytes(b'x'*(2*1024*1024+1))
            with self.assertRaises(ValueError): mod.summarize(xml)

    def test_cannot_publish_local_personal_device_results_by_default(self):
        env = dict(os.environ); env.pop('GITHUB_ACTIONS', None)
        result = subprocess.run([sys.executable, str(SCRIPT)], env=env, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('::notice', result.stdout)

    def test_instrumentation_diagnostics_are_test_only_and_emulator_gated(self):
        path = ROOT/'apps/zshaolin-android/app/src/androidTest/java/org/dyne/zshaolin/modern/ToolboxTest.java'
        text = path.read_text()
        self.assertLess(text.index('Explicit disposable-CI consent'), text.index('Toolbox.install(ctx'))
        self.assertLess(text.index('Build.HARDWARE.equals("ranchu")'), text.index('Toolbox.install(ctx'))
        self.assertIn('Math.min(1800, in.length())', text)
        production = (ROOT/'apps/zshaolin-android/app/src/main/java/org/dyne/zshaolin/modern/Toolbox.java').read_text()
        self.assertNotIn('syntheticDiagnostic', production)
        workflow = (ROOT/'.github/workflows/zshaolin-modern-apk.yml').read_text()
        self.assertIn('-Pandroid.testInstrumentationRunnerArguments.zshaolinDisposableCi=true', workflow)
        self.assertIn('python3 tools/android-ci/publish-test-summary.py', workflow)


if __name__ == '__main__':
    unittest.main()
