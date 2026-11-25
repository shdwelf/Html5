package org.arena.html5launcher;

import static org.junit.Assert.*;

import android.app.Instrumentation;
import android.os.SystemClock;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.ActivityTestRule;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Public APK, real WebView/module workers and touchscreen controls; synthetic keys only. */
@RunWith(AndroidJUnit4.class)
public final class RecoveryWebViewSmokeTest {
    private static final String PGP_URL = "https://app-openpgp-workbench.invalid/index.html";
    private static final String WORKER_URL = "https://app-openpgp-workbench.invalid/recovery-worker.mjs";
    private final Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    @Rule public final ActivityTestRule<MainActivity> activityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test(timeout = 120000)
    public void exactV4AndV6CandidatesRecoverAllSecretPacketsInRealLocalModuleWorkers() throws Exception {
        WebView web = launch("fast");
        try {
            for (String profile : new String[] { "v4", "v6" }) {
                Log.i("Html5RecoverySmoke", "exact recovery control: " + profile);
                tap(web, "recovery-clear");
                evaluate(web, "__androidRecoverySmoke.load('" + profile + "'); 'loaded'");
                int before = snapshot(web).getJSONArray("records").length();
                assertTrue(snapshot(web).getBoolean("startDisabled"));
                preview(web, "success");
                JSONObject planned = snapshot(web);
                assertTrue("exact full fixture fingerprint must be displayed", planned.getBoolean("identityMatches"));
                assertEquals("v4".equals(profile) ? 40 : 64, planned.getInt("fingerprintLength"));
                assertEquals(2, planned.getInt("previewCount"));
                assertTrue(planned.getBoolean("previewHidesValues"));
                assertTrue(planned.getBoolean("startDisabled"));
                assertEquals("inspection must not attempt any candidate", 0, planned.getInt("attempts"));
                assertEquals(before + 1, planned.getJSONArray("records").length());
                assertEquals("inspect", planned.getJSONArray("records").getJSONObject(before).getString("operation"));
                assertTrue(planned.getJSONArray("records").getJSONObject(before).getBoolean("terminated"));

                evaluate(web, "__androidRecoverySmoke.confirmFingerprint(true); 'confirmed'");
                tap(web, "recovery-owner-ack");
                tap(web, "recovery-start");
                awaitText(web, "exact full");
                assertEquals("fingerprint mismatch must never create a guessing worker", before + 1, snapshot(web).getJSONArray("records").length());
                evaluate(web, "__androidRecoverySmoke.confirmFingerprint(); 'confirmed'");
                tap(web, "recovery-start");
                awaitText(web, "Exact candidate #2 unlocked and validated all 2");
                JSONObject result = snapshot(web);
                assertEquals(2, result.getInt("attempts"));
                assertTrue(result.getBoolean("inputsCleared"));
                assertTrue(result.getBoolean("matchEmpty"));
                assertTrue(result.getBoolean("matchHidden"));
                assertFalse(result.getBoolean("revealHidden"));
                assertNoPersistence(result);
                assertWorkers(result, before + 2, true);
                tap(web, "recovery-reveal-match");
                awaitTrue(web, "__androidRecoverySmoke.revealedMatchIsExact()");
                tap(web, "recovery-reveal-match");
                assertTrue(snapshot(web).getBoolean("matchEmpty"));
                assertTrue(snapshot(web).getBoolean("matchHidden"));
            }
        } finally { dispose(web); }
    }

    @Test(timeout = 120000)
    public void unsupportedKeysAreRefusedBeforeAttemptsAndBoundedNoMatchIsNotSuccess() throws Exception {
        WebView web = launch("fast");
        try {
            String[] profiles = { "public", "unprotected", "argon2" };
            String[] reasons = { "PRIVATE key", "Every secret packet must be protected", "Argon2-protected keys" };
            for (int i = 0; i < profiles.length; i++) {
                Log.i("Html5RecoverySmoke", "pre-attempt refusal control: " + profiles[i]);
                tap(web, "recovery-clear");
                evaluate(web, "__androidRecoverySmoke.load('" + profiles[i] + "', 'no-match'); 'loaded'");
                preview(web, "error");
                awaitText(web, reasons[i]);
                JSONObject refused = snapshot(web);
                assertEquals(0, refused.getInt("attempts"));
                assertTrue(refused.getBoolean("startDisabled"));
                assertTrue(refused.getBoolean("matchEmpty"));
                assertTrue(refused.getBoolean("revealHidden"));
                JSONArray records = refused.getJSONArray("records");
                for (int n = 0; n < records.length(); n++) assertEquals("inspect", records.getJSONObject(n).getString("operation"));
                assertWorkers(refused, records.length(), true);
                assertNoPersistence(refused);
            }
            assertTrue("both protection failures must reach real inspection workers", snapshot(web).getJSONArray("records").length() >= 2);
            tap(web, "recovery-clear");
            evaluate(web, "__androidRecoverySmoke.load('v4', 'no-match'); 'loaded'");
            preview(web, "success");
            start(web);
            awaitText(web, "bounded plan is exhausted, not all possible passphrases");
            assertNotEquals("success", evaluate(web, "document.getElementById('recovery-status').dataset.kind"));
            JSONObject exhausted = snapshot(web);
            assertEquals(1, exhausted.getInt("attempts"));
            assertTrue(exhausted.getBoolean("matchEmpty"));
            assertTrue(exhausted.getBoolean("revealHidden"));
            assertWorkers(exhausted, exhausted.getJSONArray("records").length(), true);
            assertNoPersistence(exhausted);
        } finally { dispose(web); }
    }

    @Test(timeout = 120000)
    public void stopAndBothClearControlsTerminateActualInFlightExpensiveWorkers() throws Exception {
        WebView web = launch("slow");
        try {
            for (String action : new String[] { "recovery-stop", "recovery-clear", "clear-all" }) {
                Log.i("Html5RecoverySmoke", "in-flight cancellation control: " + action);
                tap(web, "recovery-clear");
                evaluate(web, "__androidRecoverySmoke.load('slow', 'slow'); 'loaded'");
                preview(web, "success");
                start(web);
                awaitTrue(web, "__androidRecoverySmoke.snapshot().attempts >= 1 && __androidRecoverySmoke.snapshot().live === 1");
                // A real expensive S2K is executing off-thread; the page must
                // still evaluate JS and accept an actual foreground touch.
                assertEquals("42", evaluate(web, "String(6 * 7)"));
                tap(web, action);
                awaitText(web, "recovery-stop".equals(action) ? "not a completed/exhausted search" : "cleared; any worker terminated");
                JSONObject stopped = snapshot(web);
                assertWorkers(stopped, stopped.getJSONArray("records").length(), true);
                assertTrue(stopped.getBoolean("matchEmpty"));
                assertTrue(stopped.getBoolean("revealHidden"));
                assertTrue(stopped.getBoolean("startDisabled"));
                assertTrue(stopped.getBoolean("stopDisabled"));
                assertNoPersistence(stopped);
                int attempts = stopped.getInt("attempts");
                SystemClock.sleep(350);
                assertEquals("terminated workers must not deliver late progress/matches", attempts, snapshot(web).getInt("attempts"));
                assertTrue(snapshot(web).getBoolean("matchEmpty"));
                assertTrue(snapshot(web).getBoolean("revealHidden"));
            }
            assertWorkers(snapshot(web), 6, true);
        } finally { dispose(web); }
    }

    private WebView launch(String mode) throws Exception {
        assertFalse("this explicit recovery phase runs only in the offline public APK", BuildConfig.NETWORK_ENABLED);
        MainActivity activity = activityRule.launchActivity(null);
        WebView web = find(activity.getWindow().getDecorView());
        assertNotNull(web);
        instrumentation.runOnMainSync(() -> web.loadUrl(PGP_URL));
        awaitTrue(web, "location.href === '" + PGP_URL + "' && document.readyState === 'complete' && Boolean(document.getElementById('recovery-form')) && !document.getElementById('recovery-preview').disabled");
        assertEquals("function", evaluate(web, "typeof Worker"));
        tap(web, "clear-all");
        tap(web, "recovery-tab");
        try (InputStream input = instrumentation.getContext().getAssets().open("openpgp-recovery-smoke.js")) {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096]; int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            evaluate(web, output.toString(StandardCharsets.UTF_8.name()) + "; 'installed'");
        }
        Log.i("Html5RecoverySmoke", "fresh synthetic fixture generation: " + mode);
        evaluate(web, "__androidRecoverySmoke.create('" + mode + "'); 'creating'");
        awaitTrue(web, "__androidRecoverySmoke.snapshot().ready || __androidRecoverySmoke.snapshot().failed");
        JSONObject initial = snapshot(web);
        assertFalse("synthetic fixture generation must succeed, without exposing inputs/errors", initial.getBoolean("failed"));
        assertTrue(initial.getBoolean("secure"));
        assertWorkers(initial, 0, true);
        assertNoPersistence(initial);
        return web;
    }
    private void preview(WebView web, String kind) throws Exception {
        Log.i("Html5RecoverySmoke", "requesting preview; expected kind: " + kind);
        tap(web, "recovery-preview");
        awaitTrue(web, "!document.getElementById('recovery-preview').disabled && document.getElementById('recovery-status').dataset.kind === '" + kind + "'");
    }
    private void start(WebView web) throws Exception {
        Log.i("Html5RecoverySmoke", "confirming synthetic fingerprint and starting exact attempts");
        evaluate(web, "__androidRecoverySmoke.confirmFingerprint(); 'confirmed'");
        tap(web, "recovery-owner-ack");
        tap(web, "recovery-start");
    }
    private void tap(WebView web, String id) throws Exception { WebViewTestInput.tapElement(instrumentation, web, id); }
    private JSONObject snapshot(WebView web) throws Exception { return new JSONObject(evaluate(web, "JSON.stringify(__androidRecoverySmoke.snapshot())")); }
    private void assertNoPersistence(JSONObject result) throws Exception {
        assertTrue("no private/candidate/session persistence", result.getBoolean("noPersistence"));
        assertTrue("recovery must never import a public certificate", result.getBoolean("noKeyringImport"));
    }
    private void assertWorkers(JSONObject result, int expected, boolean terminated) throws Exception {
        JSONArray records = result.getJSONArray("records");
        assertEquals(expected, records.length());
        for (int i = 0; i < records.length(); i++) {
            JSONObject worker = records.getJSONObject(i);
            assertEquals(WORKER_URL, worker.getString("url"));
            assertEquals("module", worker.getString("type"));
            assertEquals(terminated, worker.getBoolean("terminated"));
        }
        if (terminated) assertEquals(0, result.getInt("live"));
    }
    private void dispose(WebView web) throws Exception {
        // Clear via the actual app control before discarding test-only fixtures.
        tap(web, "clear-all");
        evaluate(web, "window.__androidRecoverySmoke?.dispose(); 'disposed'");
    }
    private void awaitText(WebView web, String text) throws Exception {
        awaitTrue(web, "document.getElementById('recovery-status').textContent.includes(" + JSONObject.quote(text) + ")");
    }
    private void awaitTrue(WebView web, String expression) throws Exception {
        long deadline = SystemClock.uptimeMillis() + 30000;
        while (SystemClock.uptimeMillis() < deadline) {
            if ("true".equals(evaluate(web, "String(Boolean(" + expression + "))"))) return;
            SystemClock.sleep(100);
        }
        fail("Synthetic recovery condition did not settle (no page values or secret diagnostics emitted)");
    }
    private String evaluate(WebView web, String expression) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        web.post(() -> web.evaluateJavascript(expression, value -> { result.set(value); complete.countDown(); }));
        assertTrue("WebView callback must be bounded", complete.await(10, TimeUnit.SECONDS));
        Object parsed = new JSONTokener(result.get() == null ? "null" : result.get()).nextValue();
        return parsed == null || parsed == JSONObject.NULL ? "" : String.valueOf(parsed);
    }
    private static WebView find(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) for (int i = 0; i < ((ViewGroup) view).getChildCount(); i++) {
            WebView found = find(((ViewGroup) view).getChildAt(i)); if (found != null) return found;
        }
        return null;
    }
}
