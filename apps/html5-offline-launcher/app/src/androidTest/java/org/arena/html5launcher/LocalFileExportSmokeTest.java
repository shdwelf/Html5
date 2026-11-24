package org.arena.html5launcher;

import static org.junit.Assert.*;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.ComponentName;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ProviderInfo;
import android.net.Uri;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityNodeInfo;
import android.webkit.WebView;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;
import androidx.test.platform.app.InstrumentationRegistry;

import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Actual Android WebView callbacks + resolver I/O; only the picker choice is synthetic. */
@RunWith(AndroidJUnit4.class)
public final class LocalFileExportSmokeTest {
    private static final String PGP_URL = "https://app-openpgp-workbench.invalid/index.html";
    private final Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
    @Rule public final ActivityTestRule<MainActivity> activityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test(timeout = 120000)
    public void actualOpenPgpMessageSavesToSelectedDocumentAndDecryptsExactBytes() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        acceptNetworkWarning();
        WebView web = find(activity.getWindow().getDecorView());
        load(web, PGP_URL);
        assertEquals("object", evaluate(web, "typeof Html5LocalFiles"));
        String plaintext = "Synthetic Android local research — café 🔐\r\nsecond line";
        evaluate(web, "document.getElementById('plaintext').value=" + JSONObject.quote(plaintext) + ";" +
                "document.getElementById('encrypt-passphrase').value='synthetic Android passphrase only';" +
                "document.getElementById('encrypt-confirm').value='synthetic Android passphrase only';" +
                "document.getElementById('encrypt-form').requestSubmit(); 'started'");
        await(web, "document.getElementById('encrypt-status').dataset.kind || ''", "success");
        String armor = evaluate(web, "document.getElementById('encrypted-output').value");
        assertTrue(armor.startsWith("-----BEGIN PGP MESSAGE-----"));
        Uri destination = document("export.asc");
        Instrumentation.ActivityMonitor picker = picker(Intent.ACTION_CREATE_DOCUMENT, Activity.RESULT_OK, destination);
        try {
            evaluate(web, "document.querySelector('[data-download]').click(); 'requested'");
            await(web, "document.getElementById('encrypt-status').textContent", "Saved ");
            assertEquals("exactly one ACTION_CREATE_DOCUMENT request", 1, picker.getHits());
            assertArrayEquals(armor.getBytes(StandardCharsets.UTF_8), read(destination));
            assertTrue(evaluate(web, "document.getElementById('encrypt-status').textContent").contains("read-back verified"));
            evaluate(web, "document.getElementById('decrypt-tab').click();" +
                    "document.getElementById('armored-input').value=" + JSONObject.quote(new String(read(destination), StandardCharsets.UTF_8)) + ";" +
                    "document.getElementById('decrypt-passphrase').value='synthetic Android passphrase only';" +
                    "document.getElementById('decrypt-form').requestSubmit(); 'started'");
            await(web, "document.getElementById('decrypt-status').dataset.kind || ''", "success");
            assertEquals(plaintext, evaluate(web, "document.getElementById('decrypted-output').value"));
        } finally {
            instrumentation.removeMonitor(picker);
            activity.getContentResolver().delete(destination, null, null);
            evaluate(web, "document.getElementById('clear-all').click(); 'cleared'");
        }
    }

    @Test(timeout = 90000)
    public void canceledPickerNeverClaimsSuccessAndFileInputReadsOnlyTheChosenDocument() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        acceptNetworkWarning();
        WebView web = find(activity.getWindow().getDecorView());
        load(web, PGP_URL);
        Instrumentation.ActivityMonitor canceled = picker(Intent.ACTION_CREATE_DOCUMENT, Activity.RESULT_CANCELED, null);
        try {
            evaluate(web, "document.getElementById('encrypted-output').value='synthetic canceled export';" +
                    "document.querySelector('[data-download]').click(); 'requested'");
            await(web, "document.getElementById('encrypt-status').textContent", "Save canceled");
            assertEquals(1, canceled.getHits());
            assertEquals("synthetic canceled export", evaluate(web, "document.getElementById('encrypted-output').value"));
        } finally { instrumentation.removeMonitor(canceled); }

        Uri chosen = document("import.asc");
        byte[] synthetic = "SYNTHETIC NOT-A-KEY: input preview only; no automatic import.".getBytes(StandardCharsets.UTF_8);
        try (OutputStream output = activity.getContentResolver().openOutputStream(chosen, "wt")) { output.write(synthetic); }
        Instrumentation.ActivityMonitor opening = picker(Intent.ACTION_OPEN_DOCUMENT, Activity.RESULT_OK, chosen);
        try {
            evaluate(web, "document.getElementById('keyring-tab').click(); document.getElementById('public-key-file').click(); 'requested'");
            await(web, "document.getElementById('public-key-input').value", "SYNTHETIC NOT-A-KEY");
            assertEquals(1, opening.getHits());
            assertEquals("0", evaluate(web, "String(document.querySelectorAll('#keyring-list li').length)"));
            assertEquals(new String(synthetic, StandardCharsets.UTF_8), evaluate(web, "document.getElementById('public-key-input').value"));
        } finally {
            instrumentation.removeMonitor(opening);
            activity.getContentResolver().delete(chosen, null, null);
            evaluate(web, "document.getElementById('clear-all').click(); 'cleared'");
        }
    }

    @Test(timeout = 90000)
    public void genericSoundBlobExportsWorkAndForeignOriginsCannotUseTheNativeSaveRpc() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        acceptNetworkWarning();
        WebView web = find(activity.getWindow().getDecorView());
        Uri destination = document("export.asc");
        for (String path : new String[] { "https://app-sound-sanctuary.invalid/index.html", "https://app-aura-sound-studio.invalid/index.html", "https://app-aura-sound-studio.invalid/saved-settings.html" }) {
            load(web, path);
            Instrumentation.ActivityMonitor saving = picker(Intent.ACTION_CREATE_DOCUMENT, Activity.RESULT_OK, destination);
            try {
                evaluate(web, "(() => { const blob = new Blob(['synthetic sound preset only'],{type:'application/json'});" +
                        "const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download='synthetic.json';" +
                        "a.click(); URL.revokeObjectURL(url); return 'requested'; })()");
                await(web, "document.getElementById('html5-local-save-status')?.textContent || ''", "Saved ");
                assertEquals(1, saving.getHits());
                assertEquals("synthetic sound preset only", new String(read(destination), StandardCharsets.UTF_8));
            } finally { instrumentation.removeMonitor(saving); }
        }
        instrumentation.runOnMainSync(() -> web.loadDataWithBaseURL("https://untrusted.example.invalid/", "<!doctype html><body>synthetic untrusted page</body>", "text/html", "UTF-8", null));
        await(web, "document.readyState + '|' + location.origin", "complete|https://untrusted.example.invalid");
        assertEquals("undefined", evaluate(web, "typeof Html5LocalFiles"));
        String refused = evaluate(web, "prompt('html5-local-file-v1', JSON.stringify({op:'begin',name:'refused.asc',mime:'text/plain',size:1}))");
        assertEquals("error", new JSONObject(refused).getString("status"));
        activity.getContentResolver().delete(destination, null, null);
    }

    private Uri document(String name) throws Exception {
        android.content.Context context = instrumentation.getContext();
        ProviderInfo provider = context.getPackageManager().getProviderInfo(new ComponentName(context, SyntheticDocumentProvider.class), 0);
        return Uri.parse("content://" + provider.authority + "/" + name);
    }
    private Instrumentation.ActivityMonitor picker(String action, int resultCode, Uri uri) throws Exception {
        IntentFilter filter = new IntentFilter(action); filter.addCategory(Intent.CATEGORY_OPENABLE); filter.addDataType("*/*");
        Intent result = uri == null ? null : new Intent().setData(uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        return instrumentation.addMonitor(filter, new Instrumentation.ActivityResult(resultCode, result), true);
    }
    private byte[] read(Uri uri) throws Exception {
        try (InputStream input = instrumentation.getTargetContext().getContentResolver().openInputStream(uri)) {
            ByteArrayOutputStream output = new ByteArrayOutputStream(); byte[] buffer = new byte[4096]; int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return output.toByteArray();
        }
    }
    private void acceptNetworkWarning() {
        if (!BuildConfig.NETWORK_ENABLED) return;
        long deadline = SystemClock.uptimeMillis() + 10000;
        while (SystemClock.uptimeMillis() < deadline) {
            AccessibilityNodeInfo root = instrumentation.getUiAutomation().getRootInActiveWindow();
            if (root != null) for (AccessibilityNodeInfo node : root.findAccessibilityNodeInfosByText("Continue")) {
                if (node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) return;
            }
            SystemClock.sleep(100);
        }
        fail("network warning must be explicitly accepted by the synthetic test user");
    }
    private void load(WebView web, String url) throws Exception {
        assertNotNull(web);
        instrumentation.runOnMainSync(() -> web.loadUrl(url));
        await(web, "document.readyState + '|' + location.href + '|' + typeof Html5LocalFiles", "complete|" + url + "|object");
    }
    private String await(WebView web, String expression, String prefix) throws Exception {
        long deadline = SystemClock.uptimeMillis() + 30000; String value = "";
        while (SystemClock.uptimeMillis() < deadline) {
            value = evaluate(web, expression);
            if (value.startsWith(prefix)) return value;
            SystemClock.sleep(100);
        }
        assertTrue("WebView condition did not settle; expected " + prefix + ", got " + value, value.startsWith(prefix));
        return value;
    }
    private String evaluate(WebView web, String expression) throws Exception {
        CountDownLatch complete = new CountDownLatch(1); AtomicReference<String> result = new AtomicReference<>();
        instrumentation.runOnMainSync(() -> web.evaluateJavascript(expression, value -> { result.set(value); complete.countDown(); }));
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
