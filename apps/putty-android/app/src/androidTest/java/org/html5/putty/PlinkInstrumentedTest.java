package org.html5.putty;

import android.content.Context;
import android.os.Bundle;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Only local, disposable CI SSH credentials are permitted in this suite.
 * No SDF, free-shell provider or user-owned account is contacted.
 */
@RunWith(AndroidJUnit4.class)
public final class PlinkInstrumentedTest {
    private static final String BAD_PIN = "SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private final Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
    private final Bundle args = InstrumentationRegistry.getArguments();

    private final class Probe implements PtySession.Listener, AutoCloseable {
        final PlainTerminal output = new PlainTerminal();
        final CountDownLatch done = new CountDownLatch(1);
        final Object changed = new Object();
        final PtySession session;
        volatile int code = -999;
        volatile boolean failed;
        Probe(String executable, String[] arguments) {
            session = new PtySession(executable, context.getFilesDir().getAbsolutePath(), arguments, this);
            session.start();
        }
        Probe(String[] arguments) { this(context.getApplicationInfo().nativeLibraryDir + "/libplink.so", arguments); }
        public void started() {}
        public void output(char[] chars, int count) { output.append(chars, count); synchronized (changed) { changed.notifyAll(); } }
        public void ended(int result, boolean startFailed) {
            code = result; failed = startFailed; done.countDown();
            synchronized (changed) { changed.notifyAll(); }
        }
        boolean contains(String text, int seconds) throws InterruptedException {
            long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(seconds);
            synchronized (changed) {
                while (!output.snapshot().contains(text)) {
                    long left = until - System.nanoTime();
                    if (left <= 0 || done.getCount() == 0) return false;
                    TimeUnit.NANOSECONDS.timedWait(changed, left);
                }
            }
            return true;
        }
        void send(String text) { assertTrue("PTY input should be accepted", session.send(text.getBytes(StandardCharsets.UTF_8))); }
        public void close() { session.close(); }
    }

    private SessionConfig localConfig(String pin) {
        String user = args.getString("sshUser");
        assertNotNull("Synthetic runner SSH user must be supplied; no public fallback", user);
        return new SessionConfig("127.0.0.1", "2222", user, pin);
    }

    @Test public void packagedPlinkIsReal085AndRunsUnderAndroidUid() throws Exception {
        try (Probe probe = new Probe(new String[] {"-V"})) {
            assertTrue("Packaged Plink must exit", probe.done.await(15, TimeUnit.SECONDS));
            assertFalse(probe.failed);
            assertEquals(0, probe.code);
            assertTrue(probe.output.snapshot(), probe.output.snapshot().contains("Release 0.85"));
        }
    }

    @Test public void wrongHostKeyFailsBeforePasswordPrompt() throws Exception {
        try (Probe probe = new Probe(localConfig(BAD_PIN).arguments())) {
            assertTrue("Wrong host key must fail, not wait for acceptance", probe.done.await(20, TimeUnit.SECONDS));
            assertFalse(probe.failed);
            assertNotEquals(0, probe.code);
            String text = probe.output.snapshot().toLowerCase(Locale.ROOT);
            assertTrue(text, text.contains("host key") && (text.contains("configured") || text.contains("match")));
            assertFalse("No credentials offered to a mismatched host", text.contains("password:"));
            assertFalse(text.contains("putty_android_ready"));
        }
    }

    @Test public void trustedSyntheticSshAuthenticatesOverPtyAndRunsLineCommand() throws Exception {
        String pin = args.getString("sshPin");
        String password = args.getString("sshPassword");
        assertNotNull("Synthetic pin must be supplied", pin);
        assertNotNull("Synthetic password must be supplied", password);
        try (Probe probe = new Probe(localConfig(pin).arguments())) {
            assertTrue("Expected password prompt on synthetic SSH server: " + probe.output.snapshot(), probe.contains("password:", 20));
            probe.send(password + "\r");
            // Plink may retain its anti-spoofing Return prompt. Do not disable it
            // for convenience in production; explicitly respond if it appears.
            long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(15);
            boolean acknowledged = false;
            while (!probe.output.snapshot().contains("PUTTY_ANDROID_READY") && System.nanoTime() < until) {
                if (!acknowledged && probe.output.snapshot().contains("Press Return to begin session")) {
                    probe.send("\r"); acknowledged = true;
                }
                probe.contains("PUTTY_ANDROID_READY", 1);
            }
            assertTrue("Authenticated shell marker expected", probe.output.snapshot().contains("PUTTY_ANDROID_READY"));
            assertFalse("Password must not be locally echoed into transcript", probe.output.snapshot().contains(password));
            probe.send("run-self-test\r");
            assertTrue(probe.done.await(20, TimeUnit.SECONDS));
            assertFalse(probe.failed);
            assertEquals("Synthetic command must exit successfully", 0, probe.code);
            assertTrue("Un-echoed server response proves command execution", probe.output.snapshot().contains("PUTTY_ANDROID_SSH_OK"));
        }
    }

    @Test public void failedExecIsReportedAndChildReaped() throws Exception {
        try (Probe probe = new Probe(context.getApplicationInfo().nativeLibraryDir + "/missing-plink", new String[] {"-V"})) {
            assertTrue(probe.done.await(10, TimeUnit.SECONDS));
            assertTrue(probe.failed);
            assertFalse(probe.session.send("not-a-real-secret".getBytes(StandardCharsets.UTF_8)));
        }
    }

    @Test public void closeStopsForegroundSessionWithoutAuthentication() throws Exception {
        Probe probe = new Probe(localConfig(args.getString("sshPin")).arguments());
        try {
            assertTrue(probe.contains("password:", 20));
            probe.close();
            assertTrue("Close must terminate and reap child", probe.done.await(10, TimeUnit.SECONDS));
            assertNotEquals(0, probe.code);
        } finally { probe.close(); }
    }
}
