package org.arena.html5launcher;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.Manifest;
import android.app.Instrumentation;
import android.net.Uri;
import android.os.SystemClock;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.webkit.WebView;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;
import androidx.test.rule.GrantPermissionRule;

import org.json.JSONTokener;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Real Android WebView smoke tests for app-origin permissions and offline boot. */
@RunWith(AndroidJUnit4.class)
public final class OfflineWebViewSmokeTest {
    private static final String ANC_URL = "https://app-anc-studio.invalid/index.html";
    private static final String HARRY_URL = "https://app-headline-harry.invalid/index.html";
    private static final long PAGE_TIMEOUT_MS = 20_000;
    private static final long GAME_BOOT_TIMEOUT_MS = 60_000;
    private static final String HARRY_LOG_TAG = "HeadlineHarrySmoke";

    // Grant only the Android OS permission here. WebView still has to request
    // origin-scoped audio permission through MainActivity's WebChromeClient.
    @Rule
    public final GrantPermissionRule microphonePermission = GrantPermissionRule.grant(
            Manifest.permission.RECORD_AUDIO);

    @Rule
    public final ActivityTestRule<MainActivity> activityRule =
            new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void microphoneCaptureWorksOnlyForAncOriginAndAudioResource() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        WebView webView = findWebView(activity.getWindow().getDecorView());
        assertNotNull("launcher must host one packaged WebView", webView);
        loadAndWait(webView, ANC_URL);

        RecordingPermissionRequest allowed = new RecordingPermissionRequest(
                Uri.parse("https://app-anc-studio.invalid"),
                new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
        InstrumentationRegistryAccess.runOnMainSync(() -> activity.handleWebPermissionRequest(allowed));
        assertTrue("ANC audio request should be granted after Android permission", allowed.granted);
        assertFalse("allowed request should not also be denied", allowed.denied);
        assertEquals(1, allowed.grantedResources.length);
        assertEquals(PermissionRequest.RESOURCE_AUDIO_CAPTURE, allowed.grantedResources[0]);

        RecordingPermissionRequest foreignOrigin = new RecordingPermissionRequest(
                Uri.parse("https://headline-harry.invalid"),
                new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
        InstrumentationRegistryAccess.runOnMainSync(() -> activity.handleWebPermissionRequest(foreignOrigin));
        assertTrue("other apps must not receive microphone access", foreignOrigin.denied);
        assertFalse(foreignOrigin.granted);

        RecordingPermissionRequest cameraRequest = new RecordingPermissionRequest(
                Uri.parse("https://app-anc-studio.invalid"),
                new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
        InstrumentationRegistryAccess.runOnMainSync(() -> activity.handleWebPermissionRequest(cameraRequest));
        assertTrue("ANC is audio-only; camera requests must be denied", cameraRequest.denied);
        assertFalse(cameraRequest.granted);

        // Exercise Chromium WebView's actual getUserMedia -> WebChromeClient ->
        // Android permission grant chain with the permission pre-approved above.
        evaluate(webView,
                "(() => { window.__launcherMicProbe = 'pending'; " +
                "navigator.mediaDevices.getUserMedia({audio: true}).then(stream => { " +
                "window.__launcherMicProbe = 'granted:' + stream.getAudioTracks().length; " +
                "stream.getTracks().forEach(track => track.stop()); " +
                "}).catch(error => { window.__launcherMicProbe = 'error:' + error.name + ':' + error.message; }); " +
                "return 'started'; })()");
        String result = awaitValue(webView,
                "window.__launcherMicProbe || ''", "granted:", PAGE_TIMEOUT_MS);
        assertTrue("getUserMedia should open a microphone track in Android WebView; got " + result,
                result.matches("granted:[1-9][0-9]*"));
    }

    @Test
    public void headlineHarryStartControlBootsBundledDosProgramInAndroidWebView() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        WebView webView = findWebView(activity.getWindow().getDecorView());
        assertNotNull("launcher must host one packaged WebView", webView);

        Log.i(HARRY_LOG_TAG, "loading packaged Headline Harry page");
        loadAndWait(webView, HARRY_URL);
        String dosApiType = evaluateString(webView, "typeof window.Dos");
        Log.i(HARRY_LOG_TAG, "Headline Harry page loaded; typeof window.Dos=" + dosApiType);
        assertEquals("js-dos must load from the packaged app origin", "function", dosApiType);

        evaluate(webView,
                "(() => { window.__arenaSmokeErrors = []; " +
                "const record = detail => { if (window.__arenaSmokeErrors.length < 30) " +
                "window.__arenaSmokeErrors.push(String(detail).slice(0, 400)); }; " +
                "window.addEventListener('error', event => record( " +
                "String(event.message || event.error || 'window error') + ' at ' + event.filename + ':' + event.lineno)); " +
                "window.addEventListener('unhandledrejection', event => record( " +
                "'unhandled rejection: ' + String(event.reason))); " +
                "['error', 'warn'].forEach(level => { const original = console[level]; " +
                "console[level] = function() { const detail = Array.prototype.map.call(arguments, String).join(' '); " +
                "record(level + ': ' + detail); return original.apply(console, arguments); }; }); " +
                "return 'diagnostics-installed'; })()");
        Log.i(HARRY_LOG_TAG, "invoking packaged start control");
        evaluate(webView,
                "document.getElementById('start').click(); 'start-clicked'");
        long deadline = SystemClock.uptimeMillis() + GAME_BOOT_TIMEOUT_MS;
        String status = "";
        String lastLoggedStatus = null;
        while (SystemClock.uptimeMillis() < deadline) {
            status = evaluateString(webView,
                    "document.getElementById('status').textContent");
            if (!status.equals(lastLoggedStatus)) {
                Log.i(HARRY_LOG_TAG, "js-dos status: " + status);
                lastLoggedStatus = status;
            }
            if (status.contains("DOSBox ready")) {
                Log.i(HARRY_LOG_TAG, "Headline Harry reached DOSBox ci-ready");
                return;
            }
            if (status.startsWith("DOSBox error") || status.startsWith("failed to start js-dos")) {
                String detail = headlineDiagnostics(webView);
                Log.e(HARRY_LOG_TAG, "Headline Harry boot error: " + detail);
                assertFalse("Headline Harry boot failed in WebView: " + detail,
                        status.startsWith("DOSBox error") || status.startsWith("failed to start js-dos"));
            }
            SystemClock.sleep(250);
        }
        String detail = headlineDiagnostics(webView);
        Log.e(HARRY_LOG_TAG, "Timed out waiting for DOSBox ci-ready: " + detail);
        assertTrue("Headline Harry should reach js-dos ci-ready: " + detail,
                status.contains("DOSBox ready"));
    }

    private static String headlineDiagnostics(WebView webView) {
        String pageState;
        try {
            pageState = evaluateString(webView,
                    "JSON.stringify((() => { const status = document.getElementById('status'); " +
                    "const overlay = document.getElementById('overlay'); " +
                    "const container = document.getElementById('dosbox-container'); " +
                    "const canvas = container && container.querySelector('canvas'); " +
                    "return {url: location.href, readyState: document.readyState, " +
                    "status: status ? status.textContent : null, " +
                    "overlayDisplay: overlay ? getComputedStyle(overlay).display : null, " +
                    "dosApi: typeof window.Dos, canvas: canvas ? {width: canvas.width, height: canvas.height} : null, " +
                    "jsErrors: window.__arenaSmokeErrors || []}; })())");
        } catch (Exception | AssertionError error) {
            pageState = "unavailable: " + error.getClass().getSimpleName() + ": " + error.getMessage();
        }
        return "page=" + pageState;
    }

    private static void loadAndWait(WebView webView, String url) throws Exception {
        InstrumentationRegistryAccess.runOnMainSync(() -> webView.loadUrl(url));
        long deadline = SystemClock.uptimeMillis() + PAGE_TIMEOUT_MS;
        String state = "";
        String lastLoggedState = null;
        while (SystemClock.uptimeMillis() < deadline) {
            state = evaluateString(webView,
                    "document.readyState + '|' + location.href");
            if (HARRY_URL.equals(url) && !state.equals(lastLoggedState)) {
                Log.i(HARRY_LOG_TAG, "page load state: " + state);
                lastLoggedState = state;
            }
            if (state.equals("complete|" + url)) return;
            SystemClock.sleep(100);
        }
        assertEquals("offline page should load completely from packaged assets", "complete|" + url, state);
    }

    private static String awaitValue(WebView webView, String expression, String prefix,
                                     long timeoutMs) throws Exception {
        long deadline = SystemClock.uptimeMillis() + timeoutMs;
        String value = "";
        while (SystemClock.uptimeMillis() < deadline) {
            value = evaluateString(webView, expression);
            if (value.startsWith(prefix) || value.startsWith("error:")) return value;
            SystemClock.sleep(100);
        }
        return value;
    }

    private static String evaluateString(WebView webView, String expression) throws Exception {
        Object parsed = new JSONTokener(evaluate(webView, expression)).nextValue();
        return parsed == null ? "" : String.valueOf(parsed);
    }

    private static String evaluate(WebView webView, String expression) throws Exception {
        CountDownLatch completed = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>();
        InstrumentationRegistryAccess.runOnMainSync(() -> webView.evaluateJavascript(expression,
                result -> {
                    value.set(result);
                    completed.countDown();
                }));
        assertTrue("WebView JavaScript callback timed out", completed.await(10, TimeUnit.SECONDS));
        return value.get() == null ? "null" : value.get();
    }

    private static WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (!(view instanceof ViewGroup)) return null;
        ViewGroup group = (ViewGroup) view;
        for (int i = 0; i < group.getChildCount(); i++) {
            WebView found = findWebView(group.getChildAt(i));
            if (found != null) return found;
        }
        return null;
    }

    private static final class RecordingPermissionRequest extends PermissionRequest {
        private final Uri origin;
        private final String[] resources;
        private boolean granted;
        private boolean denied;
        private String[] grantedResources = new String[0];

        RecordingPermissionRequest(Uri origin, String[] resources) {
            this.origin = origin;
            this.resources = resources;
        }

        @Override public Uri getOrigin() { return origin; }
        @Override public String[] getResources() { return resources; }

        @Override
        public void grant(String[] resources) {
            granted = true;
            grantedResources = resources.clone();
        }

        @Override
        public void deny() {
            denied = true;
        }
    }

    /** Keeps the AndroidX instrumentation dependency surface small and explicit. */
    private static final class InstrumentationRegistryAccess {
        private static final Instrumentation INSTRUMENTATION =
                androidx.test.platform.app.InstrumentationRegistry.getInstrumentation();

        static void runOnMainSync(Runnable action) {
            INSTRUMENTATION.runOnMainSync(action);
        }
    }
}
