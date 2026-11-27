package org.dyne.zshaolin.modern;

import static org.junit.Assert.*;
import android.content.Context;
import android.os.Build;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.ActivityTestRule;
import com.termux.terminal.TerminalSession;
import com.termux.view.TerminalView;
import java.io.File;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.lang.reflect.Field;
import java.net.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import org.json.*;
import org.junit.*;
import org.junit.runners.MethodSorters;

/** Disposable emulator only; never run against a user's existing Termux prefix. */
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class ToolboxTest {
    static Context ctx;
    @Rule public ActivityTestRule<MainActivity> activity = new ActivityTestRule<>(MainActivity.class, false, false);
    @BeforeClass public static void installFullOfflinePayload() throws Exception {
        assertEquals("Explicit disposable-CI consent is mandatory", "true",
            InstrumentationRegistry.getArguments().getString("zshaolinDisposableCi"));
        assertTrue("Never run this control against a physical/personal device",
            Build.HARDWARE.equals("ranchu") || Build.HARDWARE.equals("goldfish"));
        ctx = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("Airplane mode must be enabled before the offline payload install", 1,
            android.provider.Settings.Global.getInt(ctx.getContentResolver(), "airplane_mode_on", -1));
        assertEquals("Wi-Fi must be disabled before the offline payload install", 0,
            android.provider.Settings.Global.getInt(ctx.getContentResolver(), "wifi_on", -1));
        try { Toolbox.install(ctx, text -> { /* no normal install logs */ }); }
        catch (Exception e) { throw syntheticDiagnostic(e); }
    }
    private static AssertionError syntheticDiagnostic(Exception e) {
        // Test APK only, after both disposable-emulator gates. This file contains
        // fixed offline-install/synthetic-control output, not logcat or user data.
        String details = "";
        File file = new File(Toolbox.HOME, ".zshaolin-install-error.log");
        if (file.isFile()) try (RandomAccessFile in = new RandomAccessFile(file, "r")) {
            int length = (int)Math.min(1800, in.length());
            byte[] tail = new byte[length]; in.seek(in.length() - length); in.readFully(tail);
            details = "\nDisposable-control command output:\n" + new String(tail, StandardCharsets.UTF_8);
        } catch (Exception ignored) { /* Preserve the original control failure. */ }
        return new AssertionError(e.getClass().getSimpleName() + ": " + e.getMessage() + details, e);
    }
    private static String control(List<String> args, int seconds) throws Exception {
        try { return Toolbox.run(args, seconds); }
        catch (Exception e) { throw syntheticDiagnostic(e); }
    }
    @Test public void aAllDeclaredPackagesAndCommandsAreInstalled() throws Exception {
        assertEquals("bin/zsh", Toolbox.archiveName("./bin/./zsh"));
        assertEquals("share/man", Toolbox.archiveName("share//man/"));
        for (String invalid : new String[]{"", ".", "./", "../outside", "bin/../outside", "/absolute", "bad\\name", "bad\0name"}) {
            try { Toolbox.archiveName(invalid); fail("Unsafe archive path accepted"); }
            catch (java.io.IOException expected) { /* fail closed */ }
        }
        assertTrue("Android storage aliases must refer to the identical owned directory",
            Toolbox.samePrivateDirectory(ctx.getFilesDir(), new File(Toolbox.FILES)));
        assertFalse("Another app-private directory must not satisfy native-prefix identity",
            Toolbox.samePrivateDirectory(ctx.getCacheDir(), new File(Toolbox.FILES)));
        JSONObject receipt = Toolbox.receipt(ctx);
        assertFalse(receipt.getBoolean("rootRequired"));
        assertFalse(receipt.getBoolean("vpnProtectionProvided"));
        assertTrue(receipt.getBoolean("aptSignatureVerificationRequired"));
        assertEquals(0, receipt.getJSONArray("missingCommands").length());
        JSONArray commands = receipt.getJSONArray("requiredCommands");
        assertTrue(commands.length() >= 50);
        for (int i = 0; i < commands.length(); i++)
            assertTrue(commands.getString(i), new File(Toolbox.PREFIX + "/bin/" + commands.getString(i)).canExecute());
        String audit = control(Arrays.asList(Toolbox.PREFIX + "/bin/dpkg", "--audit"), 30);
        assertTrue("dpkg must report no unconfigured packages", audit.trim().isEmpty());
        for (String name : new String[]{"NOTICE", "LICENSE-APACHE-2.0", "TERMUX-LICENSE.md"})
            assertTrue("Upstream licence notices must be installed", new File(Toolbox.PREFIX + "/share/zshaolin/" + name).length() > 0);
    }
    @Test public void bRealNativeShellEditorsCryptoLanguagesAndMedia() throws Exception {
        String script = "set -eu; " +
            "print -r -- ZSH_NATIVE_OK; " +
            "printf 'b\\na\\n' | sort | grep -qx a || test $(printf 'b\\na\\n' | sort | head -n 1) = a; " +
            "emacs --batch -Q --eval '(princ \"EMACS_NATIVE_OK\")'; " +
            "vim --version >/dev/null; perl -e 'print qq(PERL_NATIVE_OK\\n)'; " +
            "lua5.4 -e 'print(\"LUA_NATIVE_OK\")'; " +
            "gpg --version >/dev/null; ssh -V 2>&1; ffmpeg -version >/dev/null; ffprobe -version >/dev/null; " +
            "magick -size 2x2 xc:red $TMPDIR/zshaolin-synthetic.png; " +
            "test $(magick identify -format '%wx%h' $TMPDIR/zshaolin-synthetic.png) = 2x2; " +
            "rm $TMPDIR/zshaolin-synthetic.png; " +
            "ffmpeg -v error -f lavfi -i 'sine=frequency=440:duration=0.1' -f null -; " +
            "sox -n -t null /dev/null synth 0.1 sine 440; print -r -- MEDIA_NATIVE_OK";
        String result = control(Arrays.asList(Toolbox.PREFIX + "/bin/zsh", "-fc", script), 180);
        for (String marker : new String[]{"ZSH_NATIVE_OK", "EMACS_NATIVE_OK", "PERL_NATIVE_OK", "LUA_NATIVE_OK", "MEDIA_NATIVE_OK"})
            assertTrue(marker, result.contains(marker));
    }
    private static Set<String> sshConfigRows(String dump) {
        // OpenSSH 10.6 prints canonical CamelCase keywords; older releases used
        // lowercase. Normalize text casing only; password-enabled policy fails.
        Set<String> rows = new HashSet<>();
        for (String line : dump.split("\n")) rows.add(line.trim().toLowerCase(Locale.ROOT));
        return rows;
    }
    @Test public void cNoAutomaticListenersAndMissingKeyRefusesToStart() throws Exception {
        assertEquals(sshConfigRows("passwordauthentication no"), sshConfigRows("PasswordAuthentication no"));
        assertFalse(sshConfigRows("PasswordAuthentication yes").contains("passwordauthentication no"));
        control(Arrays.asList(Toolbox.PREFIX + "/bin/zsh", "-fc",
            "if z-ssh start >/dev/null 2>&1; then exit 42; fi; z-ssh help >/dev/null"), 30);
        for (int port : new int[]{2221, 2222, 8022, 10000}) {
            try (Socket socket = new Socket()) {
                try { socket.connect(new InetSocketAddress("127.0.0.1", port), 500); fail("Unexpected automatic listener: " + port); }
                catch (ConnectException expected) { /* expected */ }
                catch (SocketTimeoutException expected) { /* no accepting listener */ }
            }
        }
        Set<String> config = sshConfigRows(control(Arrays.asList(Toolbox.PREFIX + "/bin/sshd", "-T", "-f", Toolbox.PREFIX + "/etc/ssh/sshd_config"), 30));
        assertTrue("sshd -T must disable password authentication", config.contains("passwordauthentication no"));
        assertTrue("sshd -T must enable public-key authentication", config.contains("pubkeyauthentication yes"));
        assertTrue("sshd -T must disable keyboard-interactive authentication", config.contains("kbdinteractiveauthentication no"));
        Set<String> listeners = new HashSet<>();
        for (String row : config) if (row.startsWith("listenaddress ")) listeners.add(row);
        assertEquals("No extra wildcard, IPv6 or non-loopback SSH bind is allowed",
            Collections.singleton("listenaddress 127.0.0.1:2222"), listeners);
    }
    @Test public void dSyntheticLoopbackKeyOnlySshWithoutHttpProvisioning() throws Exception {
        String script = "set -eu; umask 077; " +
            "T=$TMPDIR/zshaolin-ssh-control; mkdir -p $T $HOME/.ssh; " +
            "test ! -s $HOME/.ssh/authorized_keys; " +
            "ssh-keygen -q -t ed25519 -N '' -f $T/client; " +
            "cp $T/client.pub $HOME/.ssh/authorized_keys; " +
            "z-ssh start >$T/private-server.log 2>&1 & server=$!; " +
            "trap 'kill $server 2>/dev/null || :; wait $server 2>/dev/null || :; rm -f $HOME/.ssh/authorized_keys; rm -rf $T' EXIT; " +
            "for i in {1..120}; do test -s $HOME/.ssh/zshaolin_host_rsa_key.pub && break; sleep 0.1; done; " +
            "{ printf '[127.0.0.1]:2222 '; cat $HOME/.ssh/zshaolin_host_rsa_key.pub; } >$T/known_hosts; " +
            "sleep 1; " +
            "printf 'print -r -- SSH_KEY_ONLY_CONTROL_OK\\nexit\\n' | " +
            "ssh -T -p 2222 -i $T/client -o BatchMode=yes -o ConnectTimeout=10 " +
            "-o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$T/known_hosts " +
            "$(id -un)@127.0.0.1";
        String result = control(Arrays.asList(Toolbox.PREFIX + "/bin/zsh", "-fc", script), 120);
        assertTrue(result.contains("SSH_KEY_ONLY_CONTROL_OK"));
        try (Socket socket = new Socket()) {
            try { socket.connect(new InetSocketAddress("127.0.0.1", 2221), 300); fail("HTTP provisioning unexpectedly exists"); }
            catch (ConnectException expected) { /* no HTTP */ }
        }
    }
    @Test public void eForegroundTerminalPtyAndExitLifecycle() throws Exception {
        MainActivity screen = activity.launchActivity(null);
        AtomicReference<TerminalSession> shell = new AtomicReference<>();
        Field field = MainActivity.class.getDeclaredField("terminal"); field.setAccessible(true);
        long deadline = System.currentTimeMillis() + 20000;
        while (shell.get() == null && System.currentTimeMillis() < deadline) {
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
                try {
                    TerminalView view = (TerminalView)field.get(screen);
                    if (view.mTermSession != null && view.mTermSession.getEmulator() != null) shell.set(view.mTermSession);
                } catch (IllegalAccessException e) { throw new AssertionError(e); }
            });
            Thread.sleep(100);
        }
        assertNotNull("Native PTY must start", shell.get());
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> shell.get().write("printf 'PTY-CONTROL-OK\\n'\n"));
        AtomicReference<Boolean> seen = new AtomicReference<>(false);
        deadline = System.currentTimeMillis() + 10000;
        while (!seen.get() && System.currentTimeMillis() < deadline) {
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> seen.set(
                shell.get().getEmulator().getScreen().getTranscriptText().contains("PTY-CONTROL-OK")));
            Thread.sleep(100);
        }
        assertTrue("Actual native PTY output must reach terminal emulator", seen.get());
        activity.finishActivity();
        Thread.sleep(1000);
        assertFalse("Foreground shell must end on Exit", shell.get().isRunning());
    }
}
