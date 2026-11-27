import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'tools/zshaolin-legacy/overlay/z-ssh'
SPEC = json.loads((ROOT / 'tools/zshaolin-modern/inputs.json').read_text())
module_spec = importlib.util.spec_from_file_location('zshaolin_prepare', ROOT / 'tools/zshaolin-modern/prepare.py')
prepare = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(prepare)


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


if __name__ == '__main__':
    unittest.main()
