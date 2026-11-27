import hashlib
import importlib.util
import io
import json
import os
import re
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'tools/zshaolin-legacy/overlay/z-ssh'
SPEC = json.loads((ROOT / 'tools/zshaolin-modern/inputs.json').read_text())
module_spec = importlib.util.spec_from_file_location('zshaolin_prepare', ROOT / 'tools/zshaolin-modern/prepare.py')
prepare = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(prepare)
receipt_spec = importlib.util.spec_from_file_location('zshaolin_apk_receipt', ROOT/'tools/zshaolin-modern/apk-receipt.py')
apk_receipt = importlib.util.module_from_spec(receipt_spec)
receipt_spec.loader.exec_module(apk_receipt)


class ZshaolinModernTests(unittest.TestCase):
    def test_full_major_toolbox_groups_are_not_replaced_by_system_sh(self):
        for group in ['system', 'text', 'crypto', 'fileManager', 'languages', 'media', 'network', 'games']:
            self.assertTrue(SPEC['packageGroups'][group])
        self.assertIn('emacs', SPEC['packageGroups']['text'])
        self.assertIn('perl', SPEC['packageGroups']['languages'])
        self.assertIn('ffmpeg', SPEC['packageGroups']['media'])
        self.assertIn('openssh', SPEC['packageGroups']['network'])
        self.assertIn('zsh', SPEC['packageGroups']['system'])
        self.assertGreaterEqual(len(SPEC['requiredCommands']), 50)
        self.assertTrue(any(x['old'] == 'matanza/ctris/cryptoslam' for x in SPEC['legacyChanges']))

    def test_inputs_are_source_pinned_and_abi_specific(self):
        for item in ['terminalSource', 'packageRecipes']:
            self.assertRegex(SPEC[item]['sha256'], r'^[a-f0-9]{64}$')
            self.assertRegex(SPEC[item]['commit'], r'^[a-f0-9]{40}$')
            self.assertIn(SPEC[item]['commit'], SPEC[item]['url'])
        self.assertEqual(set(prepare.ARCHES), {'arm', 'aarch64', 'x86_64'})
        for arch in prepare.ARCHES:
            self.assertRegex(SPEC['bootstrap'][arch], r'^[a-f0-9]{64}$')

    def test_archive_path_guard_rejects_escape_and_windows_names(self):
        for value in ['/etc/passwd', '../x', 'a/../../x', 'a\\b', '', 'a\x00b']:
            with self.assertRaises(ValueError, msg=repr(value)): prepare.safe_path(value)
        self.assertEqual(str(prepare.safe_path('bin/zsh')), 'bin/zsh')

    def test_apt_is_isolated_authenticated_download_only(self):
        text = (ROOT / 'tools/zshaolin-modern/prepare.py').read_text()
        for marker in ['Dir::State::status=', 'Dir::State::lists=', 'signed-by=',
                       'Acquire::AllowInsecureRepositories=false', 'APT::Get::AllowUnauthenticated=false',
                       'Acquire::ForceHash=SHA256', "'--download-only'", "hashfield.startswith('SHA256:')"]:
            self.assertIn(marker, text)
        self.assertNotIn('trusted=yes', text)
        self.assertNotIn('shell=True', text)
        self.assertIn('Full-toolbox command coverage missing:', text)
        self.assertIn("'nativePackagesSelfCompiled': False", text)

    def test_postinst_command_links_require_literal_prefix_target_and_provider(self):
        script = b'''#!/data/data/com.termux/files/usr/bin/sh
if [ "$1" = 'configure' ]; then
    update-alternatives \\
      --install "/data/data/com.termux/files/usr/bin/vim" "vim" "/data/data/com.termux/files/usr/libexec/vim/vim" 50
fi
'''
        links = prepare.configured_command_links(script)
        self.assertEqual(links, [{'command': 'vim', 'link': 'bin/vim', 'target': 'libexec/vim/vim'}])
        self.assertEqual(prepare.missing_commands(['vim'], {'libexec/vim/vim', 'bin/update-alternatives'}, links), [])
        self.assertEqual(prepare.missing_commands(['vim'], {'libexec/vim/vim'}, links), ['vim'])
        self.assertEqual(prepare.missing_commands(['vim'], {'bin/update-alternatives'}, links), ['vim'])
        self.assertEqual(prepare.missing_commands(['vim', 'tetris'], {'bin/vim', 'bin/tetris'}, []), [])
        for invalid in [script.replace(b'/usr/bin/vim"', b'/usr/bin/wrong"'),
                        script.replace(b'/usr/libexec/vim/vim', b'/other/libexec/vim/vim'),
                        script.replace(b'"/data/data/com.termux/files/usr/libexec/vim/vim"', b'"$PREFIX/libexec/vim/vim"')]:
            self.assertEqual(prepare.configured_command_links(invalid), [])
        with self.assertRaises(ValueError):
            prepare.configured_command_links(script.replace(b'/usr/libexec/vim/vim', b'/usr/../../outside'))

    def test_package_names_and_command_names_are_not_confused_or_silently_omitted(self):
        self.assertIn('vitetris', SPEC['packageGroups']['games'])
        self.assertIn('tetris', SPEC['requiredCommands'])
        self.assertNotIn('vitetris', SPEC['requiredCommands'])
        self.assertIn('vim', SPEC['requiredCommands'])
        self.assertIn('lua5.4', SPEC['requiredCommands'])
        app = (ROOT/'apps/zshaolin-android/app/src/main/java/org/dyne/zshaolin/modern/Toolbox.java').read_text()
        self.assertIn('canExecute()', app)
        self.assertIn('A required full-toolbox command is missing', app)

    def test_app_has_only_internet_permission_and_no_exported_command_api(self):
        manifest = (ROOT/'apps/zshaolin-android/app/src/main/AndroidManifest.xml').read_text()
        self.assertEqual(manifest.count('<uses-permission'), 1)
        self.assertIn('android.permission.INTERNET', manifest)
        self.assertNotIn('<service', manifest)
        self.assertNotIn('<receiver', manifest)
        self.assertIn('android:allowBackup="false"', manifest)
        source = (ROOT/'apps/zshaolin-android/app/src/main/java/org/dyne/zshaolin/modern/MainActivity.java').read_text()
        self.assertIn('FLAG_SECURE', source)
        self.assertIn('new String[]{"zsh", "-i"}', source)
        self.assertNotIn('getIntent().', source)
        self.assertNotIn('Log.', source)
        self.assertIn('session.finishIfRunning()', source)

    def test_compatibility_target_and_namespace_are_explicit_not_faked(self):
        self.assertEqual(SPEC['applicationId'], 'com.termux')
        self.assertIn('termux_compatible_full', SPEC['namespaceConsent'])
        gradle = (ROOT/'apps/zshaolin-android/app/build.gradle').read_text()
        self.assertIn("applicationId 'com.termux'", gradle)
        self.assertIn('targetSdk 28', gradle)
        self.assertIn('debuggable false', gradle)
        self.assertNotIn('testkey_untrusted', gradle)
        self.assertNotIn('sharedUserId', (ROOT/'apps/zshaolin-android/app/src/main/AndroidManifest.xml').read_text())

    def test_private_prefix_accepts_only_same_owned_directory_not_path_string_alias(self):
        app = (ROOT/'apps/zshaolin-android/app/src/main/java/org/dyne/zshaolin/modern/Toolbox.java').read_text()
        guard = app[app.index('static boolean samePrivateDirectory'):app.index('JSONObject spec = receipt(ctx);')]
        for marker in ['Os.stat(actual.getAbsolutePath())', 'Os.stat(expected.getAbsolutePath())',
                       'a.st_uid == uid && b.st_uid == uid', 'a.st_dev == b.st_dev', 'a.st_ino == b.st_ino',
                       'OsConstants.S_ISDIR(a.st_mode)', 'OsConstants.S_ISDIR(b.st_mode)',
                       '!ctx.getPackageName().equals("com.termux")', 'android.os.Process.myUid() / 100000 != 0',
                       'samePrivateDirectory(ctx.getFilesDir(), new File(FILES))']:
            self.assertIn(marker, guard)
        self.assertNotIn('getCanonicalPath().equals', guard)
        control = (ROOT/'apps/zshaolin-android/app/src/androidTest/java/org/dyne/zshaolin/modern/ToolboxTest.java').read_text()
        self.assertIn('Toolbox.samePrivateDirectory(ctx.getFilesDir(), new File(Toolbox.FILES))', control)
        self.assertIn('Toolbox.samePrivateDirectory(ctx.getCacheDir(), new File(Toolbox.FILES))', control)

    def test_atomic_bootstrap_promotion_does_not_cross_bind_mount_aliases_or_copy(self):
        app = (ROOT/'apps/zshaolin-android/app/src/main/java/org/dyne/zshaolin/modern/Toolbox.java').read_text()
        self.assertIn('File stage = new File(FILES, ".zshaolin-staging")', app)
        self.assertIn('File prefix = new File(PREFIX)', app)
        self.assertIn('public static final String PREFIX = FILES + "/usr"', app)
        self.assertIn('Os.rename(stage.getAbsolutePath(), prefix.getAbsolutePath())', app)
        self.assertNotIn('stage.renameTo(prefix)', app)
        self.assertNotIn('new File(ctx.getFilesDir(), ".zshaolin-staging")', app)

    def test_bootstrap_normalization_preserves_parent_traversal_and_collision_guards(self):
        app = (ROOT/'apps/zshaolin-android/app/src/main/java/org/dyne/zshaolin/modern/Toolbox.java').read_text()
        for marker in ['static String archiveName(String name)', 'if (part.equals("..")) throw',
                       '!part.isEmpty() && !part.equals(".")', 'if (parts.isEmpty()) throw',
                       'String name = archiveName(entry.getName())', '!seen.add(name)',
                       'String linkName = archiveName(pair[1])', '!linkNames.add(linkName)',
                       'canonical.startsWith(new File(PREFIX).getCanonicalPath() + "/")']:
            self.assertIn(marker, app)
        control = (ROOT/'apps/zshaolin-android/app/src/androidTest/java/org/dyne/zshaolin/modern/ToolboxTest.java').read_text()
        self.assertIn('Toolbox.archiveName("./bin/./zsh")', control)
        self.assertIn('"bin/../outside"', control)
        self.assertIn('Unsafe archive path accepted', control)

    def test_startup_is_lean_and_no_history_or_servers(self):
        text = (ROOT/'tools/zshaolin-modern/assets/zshrc').read_text()
        commands = '\n'.join(line for line in text.splitlines() if line and not line.startswith('#'))
        self.assertIn('HISTFILE=/dev/null', commands)
        self.assertIn('SAVEHIST=0', commands)
        self.assertNotRegex(commands, r'(?m)^\s*(?:exec\s+)?(?:sshd|ssh-agent|curl|wget|compinit|emacs|ffmpeg)\b')
        config = (ROOT/'tools/zshaolin-modern/assets/sshd_config').read_text()
        for line in ['ListenAddress 127.0.0.1', 'PasswordAuthentication no', 'PubkeyAuthentication yes', 'StrictModes yes']:
            self.assertIn(line, config)

    def fixture(self, directory):
        home = Path(directory)/'home'; prefix = Path(directory)/'usr'
        home.mkdir(); (prefix/'bin').mkdir(parents=True)
        event = Path(directory)/'events'
        keygen = prefix/'bin/ssh-keygen'
        keygen.write_text('''#!/bin/sh
printf 'keygen %s\\n' "$*" >> "$CONTROL_EVENTS"
case "$1" in -l) exit 0;; esac
while test "$#" -gt 0; do
  if test "$1" = -f; then shift; printf 'SYNTHETIC-HOST-CONTROL' > "$1"; printf 'PUBLIC-HOST-CONTROL' > "$1.pub"; exit 0; fi
  shift
done
exit 1
'''); keygen.chmod(0o700)
        daemon = prefix/'bin/sshd'
        daemon.write_text('''#!/bin/sh
printf 'sshd %s\\n' "$*" >> "$CONTROL_EVENTS"
exit 0
'''); daemon.chmod(0o700)
        env = dict(os.environ, HOME=str(home), PREFIX=str(prefix), CONTROL_EVENTS=str(event))
        env.pop('ZSHAOLIN_PREFIX', None); env.pop('ZSHAOLIN_FILES', None)
        return home, prefix, event, env

    def invoke(self, env, *args):
        # The helper intentionally uses a POSIX subset; this is a mocked host
        # flow control, not an assertion of actual Android/OpenSSH execution.
        return subprocess.run(['/bin/sh', str(HELPER), *args], env=env, text=True, capture_output=True)

    def test_no_argument_only_shows_help_without_generating_keys_or_starting_daemon(self):
        with tempfile.TemporaryDirectory() as t:
            home, prefix, events, env = self.fixture(t)
            result = self.invoke(env)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('No HTTP setup service', result.stdout)
            self.assertFalse(events.exists())

    def test_missing_public_key_refuses_before_host_key_generation(self):
        with tempfile.TemporaryDirectory() as t:
            home, prefix, events, env = self.fixture(t)
            result = self.invoke(env, 'start')
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('PUBLIC key', result.stderr)
            self.assertFalse(events.exists())

    def test_private_or_options_record_is_not_accepted_as_authorization(self):
        for value in ['-----BEGIN OPENSSH PRIVATE KEY-----\n', 'command="bad" ssh-ed25519 QUFBQQ==\n', 'garbage\n']:
            with self.subTest(value=value), tempfile.TemporaryDirectory() as t:
                home, prefix, events, env = self.fixture(t)
                (home/'.ssh').mkdir(); (home/'.ssh/authorized_keys').write_text(value)
                result = self.invoke(env, 'start')
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(events.exists())

    def test_symlinked_ssh_state_is_refused(self):
        with tempfile.TemporaryDirectory() as t:
            home, prefix, events, env = self.fixture(t)
            external = Path(t)/'outside'; external.mkdir()
            (home/'.ssh').symlink_to(external, target_is_directory=True)
            self.assertNotEqual(self.invoke(env, 'start').returncode, 0)
            self.assertFalse(events.exists())

    def test_mocked_valid_public_key_path_generates_only_host_key_and_foreground_daemon(self):
        with tempfile.TemporaryDirectory() as t:
            home, prefix, events, env = self.fixture(t)
            (home/'.ssh').mkdir(); (home/'.ssh/authorized_keys').write_text('ssh-ed25519 QUFBQQ== synthetic-public-control\n')
            result = self.invoke(env, 'start')
            self.assertEqual(result.returncode, 0, result.stderr)
            text = events.read_text()
            self.assertIn('keygen -l -f', text)
            self.assertIn('zshaolin_host_rsa_key', text)
            self.assertIn('sshd -D -e -f', text)
            self.assertNotIn('client', text)
            self.assertNotIn('curl', text)
            self.assertNotIn('httpd', text)
            config = home/'.ssh/zshaolin-key-only.conf'
            self.assertEqual(stat.S_IMODE(config.stat().st_mode), 0o600)
            self.assertIn('ListenAddress 127.0.0.1', config.read_text())
            self.assertIn('PasswordAuthentication no', config.read_text())

    def test_rotation_warning_does_not_recreate_old_http_server(self):
        with tempfile.TemporaryDirectory() as t:
            home, prefix, events, env = self.fixture(t)
            result = self.invoke(env, 'secure')
            self.assertEqual(result.returncode, 0)
            self.assertIn('copied private keys cannot be retracted', result.stdout)
            self.assertFalse(events.exists())


class ZshaolinApkReceiptTests(unittest.TestCase):
    def suite(self):
        root = ET.Element('testsuite', name=apk_receipt.TEST_SUITE, tests='5', failures='0', errors='0', skipped='0')
        for name in sorted(apk_receipt.REQUIRED_TEST_CASES):
            ET.SubElement(root, 'testcase', name=name, classname=apk_receipt.TEST_SUITE)
        return root

    def results(self, root, required=True):
        with tempfile.TemporaryDirectory() as tmp:
            ET.ElementTree(root).write(Path(tmp)/'TEST-control.xml')
            return apk_receipt.android_test_results(tmp, required=required)

    def test_exact_five_control_methods_must_match_actual_instrumentation(self):
        java = (ROOT/'apps/zshaolin-android/app/src/androidTest/java/org/dyne/zshaolin/modern/ToolboxTest.java').read_text()
        self.assertEqual(set(re.findall(r'@Test public void (\w+)\(', java)), apk_receipt.REQUIRED_TEST_CASES)
        report = self.results(self.suite())
        self.assertEqual(report[0]['testCases'], sorted(apk_receipt.REQUIRED_TEST_CASES))
        self.assertEqual(report[0]['tests'], 5)
        self.assertRegex(report[0]['xmlSha256'], r'^[a-f0-9]{64}$')

    def test_no_skipped_failed_or_disabled_cases_even_with_zero_suite_counters(self):
        for tag in ['skipped', 'failure', 'error']:
            root = self.suite(); ET.SubElement(root[0], tag)
            with self.subTest(tag=tag), self.assertRaises(ValueError): self.results(root)
        for counter in ['skipped', 'failures', 'errors', 'disabled']:
            root = self.suite(); root.set(counter, '1')
            with self.subTest(counter=counter), self.assertRaises(ValueError): self.results(root)

    def test_inflated_duplicate_wrong_or_absent_control_results_cannot_pass(self):
        for attribute, value in [('tests', '10'), ('tests', '-1'), ('name', 'unrelated')]:
            root = self.suite(); root.set(attribute, value)
            with self.subTest(attribute=attribute), self.assertRaises(ValueError): self.results(root)
        for attribute, value in [('name', 'unrelated'), ('name', sorted(apk_receipt.REQUIRED_TEST_CASES)[1]),
                                 ('classname', 'unrelated')]:
            root = self.suite(); root[0].set(attribute, value)
            with self.subTest(attribute=attribute, value=value), self.assertRaises(ValueError): self.results(root)
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError): apk_receipt.android_test_results(tmp, required=True)
            self.assertEqual(apk_receipt.android_test_results(tmp, required=False), [])
            (Path(tmp)/'TEST-control.xml').write_bytes(b'x'*(2*1024*1024+1))
            with self.assertRaises(ValueError): apk_receipt.android_test_results(tmp, required=True)

    def test_offline_gate_is_explicit_and_not_a_physical_or_arm_execution_claim(self):
        self.assertTrue(apk_receipt.offline_emulator_verified('x86_64', True, {'ZSHAOLIN_EMULATOR_OFFLINE': '1'}))
        for arch, env in [('x86_64', {}), ('x86_64', {'ZSHAOLIN_EMULATOR_OFFLINE': '0'}),
                          ('arm', {'ZSHAOLIN_EMULATOR_OFFLINE': '1'}), ('aarch64', {'ZSHAOLIN_EMULATOR_OFFLINE': '1'})]:
            with self.subTest(arch=arch, env=env), self.assertRaises(ValueError):
                apk_receipt.offline_emulator_verified(arch, True, env)
        self.assertFalse(apk_receipt.offline_emulator_verified('arm', False, {}))

    def test_packaged_remediation_and_lean_startup_must_equal_reviewed_sources(self):
        assets = {'z-ssh': HELPER.read_bytes().replace(b'#!env zsh', b'#!/data/data/com.termux/files/usr/bin/zsh', 1)}
        for name in ('sshd_config', 'zshrc', 'COPYING', 'NOTICE', 'LICENSE-APACHE-2.0', 'TERMUX-LICENSE.md'):
            assets[name] = (ROOT/'tools/zshaolin-modern/assets'/name).read_bytes()
        for changed in [None, *assets]:
            data = io.BytesIO()
            with zipfile.ZipFile(data, 'w') as archive:
                for name, raw in assets.items(): archive.writestr('assets/'+name, raw if name != changed else raw+b'\nUNREVIEWED\n')
            with zipfile.ZipFile(io.BytesIO(data.getvalue())) as archive:
                if changed is None:
                    measured = apk_receipt.verify_security_assets(archive)
                    self.assertEqual(set(measured), set(assets))
                    self.assertEqual(measured['z-ssh']['bytes'], len(assets['z-ssh']))
                else:
                    with self.subTest(asset=changed), self.assertRaises(ValueError): apk_receipt.verify_security_assets(archive)

    def test_sshd_output_case_is_normalized_without_weakening_values_or_bind_checks(self):
        java = (ROOT/'apps/zshaolin-android/app/src/androidTest/java/org/dyne/zshaolin/modern/ToolboxTest.java').read_text()
        self.assertIn('line.trim().toLowerCase(Locale.ROOT)', java)
        self.assertIn('sshConfigRows("PasswordAuthentication yes").contains("passwordauthentication no")', java)
        self.assertIn('config.contains("kbdinteractiveauthentication no")', java)
        self.assertIn('Collections.singleton("listenaddress 127.0.0.1:2222"), listeners', java)
        self.assertIn('2221, 2222, 8022, 10000', java)

    def test_workflow_and_test_verify_offline_setup_before_installation(self):
        workflow = (ROOT/'.github/workflows/zshaolin-modern-apk.yml').read_text()
        for marker in ['adb shell cmd connectivity airplane-mode enable', 'adb shell svc wifi disable',
                       'adb shell svc data disable', "ZSHAOLIN_EMULATOR_OFFLINE=1", 'settings get global airplane_mode_on',
                       'settings get global wifi_on']:
            self.assertLess(workflow.index(marker), workflow.index('gradle :app:connectedReleaseAndroidTest'))
        java = (ROOT/'apps/zshaolin-android/app/src/androidTest/java/org/dyne/zshaolin/modern/ToolboxTest.java').read_text()
        self.assertLess(java.index('Airplane mode must be enabled'), java.index('Toolbox.install(ctx'))
        self.assertLess(java.index('Wi-Fi must be disabled'), java.index('Toolbox.install(ctx'))
        for path in apk_receipt.SOURCE_FILES: self.assertTrue((ROOT/path).is_file(), path)


class ZshaolinMeasuredApkTests(unittest.TestCase):
    def record(self):
        return json.loads((ROOT/'docs/research/zshaolin-modern-x86_64-apk-summary.json').read_text())

    def test_retrieved_summary_keeps_exact_run_source_and_current_reviewed_file_hashes(self):
        raw = (ROOT/'docs/research/zshaolin-modern-x86_64-apk-summary.json').read_bytes()
        self.assertEqual(len(raw), 22860)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), 'ab4d5ab684d74d5405118a41370e7e1c9d46643a50effda068cfb4a39a8182b5')
        report = self.record()
        self.assertEqual(report['runId'], '46063037718')
        self.assertEqual(report['sourceCommit'], '64218e56d82a3949d3884fca5cd912f9f405042a')
        self.assertEqual(set(report['sourceSha256']), set(apk_receipt.SOURCE_FILES))
        for path, expected in report['sourceSha256'].items():
            self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(), expected, path)
        self.assertEqual(report['fullReceiptBytes'], 120521)
        self.assertEqual(report['fullReceiptSha256'], 'bb81c50248ec5a0a1a8c5c4a30c9cbbf6a96633c343b4ef792aee5afde269ecd')

    def test_actual_ci_measured_apk_signature_namespace_and_full_dependency_versions(self):
        report = self.record(); apk = report['apk']; payload = report['payload']
        self.assertEqual(apk['bytes'], 285549547)
        self.assertEqual(apk['sha256'], '2e5d3bd17fa3f480c78d5c676b27d5b19c2c9a59f1cd11e6110ca33d7f78904a')
        self.assertEqual(apk_receipt.certificate_fingerprints(report['apkSignatureVerification']), [apk['signerCertificateSha256']])
        self.assertIn('Verified using v2 scheme (APK Signature Scheme v2): true', report['apkSignatureVerification'])
        self.assertEqual(apk['applicationId'], 'com.termux'); self.assertEqual(apk['targetSdk'], 28)
        self.assertEqual(apk['abi'], 'x86_64'); self.assertFalse(apk['debuggable'])
        self.assertEqual(len(payload['packageVersions']), 253)
        self.assertEqual(payload['packageVersions']['openssh'], '10.6p2')
        self.assertEqual(payload['requiredCommands'], SPEC['requiredCommands'])
        self.assertEqual(payload['bootstrapSha256'], SPEC['bootstrap']['x86_64'])
        self.assertTrue(payload['aptSignatureVerificationRequired']); self.assertFalse(payload['missingCommands'])
        self.assertFalse(payload['nativePackagesSelfCompiled'])

    def test_all_five_actual_offline_android13_controls_completed_without_skips(self):
        report = self.record()
        self.assertTrue(report['testedOnAndroid13X86Emulator'])
        self.assertTrue(report['android13EmulatorOfflineInstallVerified'])
        self.assertEqual(len(report['androidInstrumentationSuites']), 1)
        suite = report['androidInstrumentationSuites'][0]
        self.assertEqual(suite['suite'], apk_receipt.TEST_SUITE)
        self.assertEqual(suite['tests'], 5)
        self.assertEqual(set(suite['testCases']), apk_receipt.REQUIRED_TEST_CASES)
        for key in ['failures', 'errors', 'skipped', 'disabled']: self.assertEqual(suite[key], 0)
        self.assertEqual(suite['xmlSha256'], '4fabf791718dca3edf8cb0600118a97ca29e8ef6af1d2bf038189bc57fcde989')

    def test_actual_packaged_remediation_startup_and_notices_match_reviewed_sources(self):
        report = self.record()
        assets = report['packagedSecurityAssets']
        self.assertEqual(set(assets), {'z-ssh', 'sshd_config', 'zshrc', 'COPYING', 'NOTICE', 'LICENSE-APACHE-2.0', 'TERMUX-LICENSE.md'})
        for name, measured in assets.items():
            data = (HELPER.read_bytes().replace(b'#!env zsh', b'#!/data/data/com.termux/files/usr/bin/zsh', 1)
                    if name == 'z-ssh' else (ROOT/'tools/zshaolin-modern/assets'/name).read_bytes())
            self.assertEqual(measured['bytes'], len(data), name)
            self.assertEqual(measured['sha256'], hashlib.sha256(data).hexdigest(), name)

    def test_both_actual_arm_apks_have_separate_measurements_and_no_inherited_runtime_pass(self):
        expected = {
            'arm': ('armeabi-v7a', 22291, '8b0894321cdb977b6bbe30cdd5f3e3bac4bd00f14ec0bce613121990d4f8edd1',
                    265398239, '7b03b4200854e47cf85fed3cb718616c908e7a2f95e35481f6d1422bea295b36'),
            'aarch64': ('arm64-v8a', 22301, '69d39b6873cffba28bd876942ece3ac505dc7e55023db599a5591373830d4213',
                        273688885, '14e4cf1328f954ce075f3c851da64c17afee71f2d819c325cdb1164eecd54ebe'),
        }
        x86 = self.record(); signers = {x86['apk']['signerCertificateSha256']}
        for arch, (abi, length, digest, apk_bytes, apk_hash) in expected.items():
            raw = (ROOT/f'docs/research/zshaolin-modern-{arch}-apk-summary.json').read_bytes()
            self.assertEqual(len(raw), length); self.assertEqual(hashlib.sha256(raw).hexdigest(), digest)
            report = json.loads(raw); apk = report['apk']; payload = report['payload']
            self.assertEqual(report['runId'], '46063968229')
            self.assertEqual(report['sourceCommit'], x86['sourceCommit'])
            self.assertEqual(report['sourceSha256'], x86['sourceSha256'])
            self.assertEqual(report['packagedSecurityAssets'], x86['packagedSecurityAssets'])
            self.assertEqual(apk['abi'], abi); self.assertEqual(apk['bytes'], apk_bytes)
            self.assertEqual(apk['sha256'], apk_hash)
            self.assertEqual(apk_receipt.certificate_fingerprints(report['apkSignatureVerification']), [apk['signerCertificateSha256']])
            self.assertIn('Verified using v2 scheme (APK Signature Scheme v2): true', report['apkSignatureVerification'])
            signers.add(apk['signerCertificateSha256'])
            self.assertEqual(payload['arch'], arch); self.assertEqual(payload['bootstrapSha256'], SPEC['bootstrap'][arch])
            self.assertEqual(payload['requiredCommands'], SPEC['requiredCommands'])
            self.assertEqual(len(payload['packageVersions']), 253)
            self.assertTrue(payload['aptSignatureVerificationRequired']); self.assertFalse(payload['missingCommands'])
            self.assertEqual(report['androidInstrumentationSuites'], [])
            for key in ['testedOnAndroid13X86Emulator', 'android13EmulatorOfflineInstallVerified',
                        'armDeviceExecutionVerified', 'testedOnPhysicalSamsung', 'rootVerified', 'vpnProtectionProvided']:
                self.assertFalse(report[key])
        self.assertEqual(len(signers), 3, 'Different ephemeral review signers are not update-compatible identities')

    def test_transport_record_preserves_checks_hashes_and_local_apk_retrieval_boundary(self):
        transport = json.loads((ROOT/'docs/research/zshaolin-modern-evidence-transport.json').read_text())
        self.assertFalse(transport['rawApkBytesDownloadedLocally'])
        self.assertFalse(transport['fullDependencyReceiptsDownloadedLocally'])
        self.assertEqual(len(transport['records']), 3)
        self.assertEqual({row['arch'] for row in transport['records']}, {'x86_64', 'arm', 'aarch64'})
        policy = (ROOT/'tools/wikiinajar/public-corpus-policy.mjs').read_text()
        self.assertIn('"docs/research/zshaolin-modern-evidence-transport.json"', policy)
        for row in transport['records']:
            raw = (ROOT/row['summary']).read_bytes(); report = json.loads(raw)
            self.assertEqual(len(raw), row['bytes']); self.assertEqual(hashlib.sha256(raw).hexdigest(), row['sha256'])
            self.assertEqual(report['sourceCommit'], row['sourceCommit']); self.assertEqual(report['runId'], row['runId'])
            self.assertEqual(row['checksChunks'], 5 if row['arch'] == 'x86_64' else 4)
            self.assertFalse(row['localApkBytesDownloaded']); self.assertFalse(row['fullReceiptDownloaded'])
            self.assertIn('/actions/runs/'+row['runId']+'/artifacts/'+str(row['artifactId']), row['artifactUrl'])
            self.assertGreater(row['artifactZipBytesReportedByGitHub'], report['apk']['bytes'])
            self.assertIn('"'+row['summary']+'"', policy)

    def test_emulator_receipt_is_not_phone_root_arm_execution_vpn_or_blanket_licence_clearance(self):
        report = self.record()
        for key in ['testedOnPhysicalSamsung', 'armDeviceExecutionVerified', 'rootVerified', 'vpnProtectionProvided']:
            self.assertFalse(report[key])
        policy = (ROOT/'tools/wikiinajar/public-corpus-policy.mjs').read_text()
        self.assertIn('"docs/research/zshaolin-modern-x86_64-apk-summary.json"', policy)
        self.assertIn('"docs/zshaolin-modern-native-build.md"', policy)
        guide = (ROOT/'docs/zshaolin-modern-native-build.md').read_text()
        for text in ['Cannot coexist with Termux', 'Primary Android user only', 'targetSdk 28', 'ephemeral',
                     'not a claim of distribution-complete clearance', 'not a firewall']:
            self.assertIn(text, guide)


if __name__ == '__main__':
    unittest.main()
