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
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

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
        // HTML textareas normalize CRLF to LF before encryption. Verify the
        // exact submitted value, not the Java string before the HTML control.
        String submitted = evaluate(web, "document.getElementById('plaintext').value");
        assertEquals(plaintext.replace("\r\n", "\n"), submitted);
        Uri destination = document("export.asc");
        Instrumentation.ActivityMonitor picker = picker(Intent.ACTION_CREATE_DOCUMENT, Activity.RESULT_OK, destination);
        Throwable primaryFailure = null;
        String phase = "request local save";
        try {
            Log.i("Html5LocalFileSmoke", "message round trip: " + phase);
            evaluate(web, "document.querySelector('[data-download]').click(); 'requested'");
            phase = "wait for read-back-verified save";
            Log.i("Html5LocalFileSmoke", "message round trip: " + phase);
            await(web, "document.getElementById('encrypt-status').textContent", "Saved ");
            phase = "compare saved ciphertext bytes";
            Log.i("Html5LocalFileSmoke", "message round trip: " + phase);
            assertEquals("exactly one ACTION_CREATE_DOCUMENT request", 1, picker.getHits());
            assertArrayEquals(armor.getBytes(StandardCharsets.UTF_8), read(destination));
            assertTrue(evaluate(web, "document.getElementById('encrypt-status').textContent").contains("read-back verified"));
            phase = "submit local decryption";
            Log.i("Html5LocalFileSmoke", "message round trip: " + phase);
            evaluate(web, "document.getElementById('decrypt-tab').click();" +
                    "document.getElementById('armored-input').value=" + JSONObject.quote(new String(read(destination), StandardCharsets.UTF_8)) + ";" +
                    "document.getElementById('decrypt-passphrase').value='synthetic Android passphrase only';" +
                    "document.getElementById('decrypt-form').requestSubmit(); 'started'");
            phase = "wait for local decryption";
            Log.i("Html5LocalFileSmoke", "message round trip: " + phase);
            await(web, "document.getElementById('decrypt-status').dataset.kind || ''", "success");
            phase = "compare exact recovered text";
            Log.i("Html5LocalFileSmoke", "message round trip: " + phase);
            assertEquals(submitted, evaluate(web, "document.getElementById('decrypted-output').value"));
        } catch (Exception | AssertionError failure) {
            primaryFailure = failure;
            // Fixed phase names only: never page values, keys or passphrases.
            Log.e("Html5LocalFileSmoke", "message round trip failed during " + phase);
            throw failure;
        } finally {
            try {
                instrumentation.removeMonitor(picker);
                activity.getContentResolver().delete(destination, null, null);
                evaluate(web, "document.getElementById('clear-all').click(); 'cleared'");
            } catch (Exception | AssertionError cleanupFailure) {
                // A second callback timeout must not erase the real failure.
                // Cleanup-only failures still fail the test; nothing is skipped.
                if (primaryFailure == null) throw cleanupFailure;
                primaryFailure.addSuppressed(cleanupFailure);
                Log.e("Html5LocalFileSmoke", "message round trip: cleanup failure retained as suppressed");
            }
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
            evaluate(web, "document.getElementById('keyring-tab').click();" +
                    "window.__syntheticFileGesture='none'; window.__syntheticFileEvents=[];" +
                    "for (const type of ['pointerdown','pointerup','pointercancel','click']) document.addEventListener(type, event => {" +
                    "if (__syntheticFileEvents.length < 8) __syntheticFileEvents.push({type,target:event.target.id || event.target.tagName," +
                    "trusted:event.isTrusted,x:event.clientX,y:event.clientY}); }, {once:true,capture:true});" +
                    "document.getElementById('public-key-file').addEventListener('click', event => {" +
                    "window.__syntheticFileGesture=String(event.isTrusted) + '|' + String(navigator.userActivation.isActive); }, {once:true}); 'opened'");
            // A programmatic file-input click has no transient user activation
            // in Android WebView. Tap the real, visible HTML file control.
            WebViewTestInput.tapElement(instrumentation, web, "public-key-file");
            long pickerDeadline = SystemClock.uptimeMillis() + 10000;
            while (opening.getHits() == 0 && SystemClock.uptimeMillis() < pickerDeadline) SystemClock.sleep(100);
            assertEquals("file control must receive a trusted click with transient user activation; " +
                    WebViewTestInput.lastGesture + "; events=" + evaluate(web, "JSON.stringify(window.__syntheticFileEvents)"), "true|true",
                    evaluate(web, "window.__syntheticFileGesture"));
            assertEquals("a real input gesture must open ACTION_OPEN_DOCUMENT", 1, opening.getHits());
            await(web, "document.getElementById('public-key-input').value + '|' + document.getElementById('keyring-status').textContent", "SYNTHETIC NOT-A-KEY");
            assertEquals("0", evaluate(web, "String(document.querySelectorAll('#keyring-list li').length)"));
            assertEquals(new String(synthetic, StandardCharsets.UTF_8), evaluate(web, "document.getElementById('public-key-input').value"));
        } finally {
            instrumentation.removeMonitor(opening);
            activity.getContentResolver().delete(chosen, null, null);
            evaluate(web, "document.getElementById('clear-all').click(); 'cleared'");
        }
    }

    @Test(timeout = 120000)
    public void binaryEncryptedFileNeedsOnlyItsPassphraseAndSavesExactAcknowledgedBytes() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        acceptNetworkWarning();
        WebView web = find(activity.getWindow().getDecorView());
        load(web, PGP_URL);
        evaluate(web, "document.getElementById('clear-all').click(); (async () => { const pgp=await import('openpgp'), tools=await import('./crypto.mjs');" +
                "const bytes=await pgp.encrypt({message:await pgp.createMessage({binary:Uint8Array.of(0,255,254,1),filename:'../../untrusted.html'})," +
                "passwords:['synthetic Android binary message only'],format:'binary',config:tools.CLASSIC_OPENPGP_CONFIG});" +
                "window.__syntheticMessageFile=btoa(String.fromCharCode(...bytes)); })(); 'started'");
        await(web, "String(typeof window.__syntheticMessageFile === 'string')", "true");
        byte[] encrypted = android.util.Base64.decode(evaluate(web, "window.__syntheticMessageFile"), android.util.Base64.DEFAULT);
        Uri chosen = document("import.asc"), destination = document("export.asc");
        try (OutputStream output = activity.getContentResolver().openOutputStream(chosen, "wt")) { output.write(encrypted); }
        Instrumentation.ActivityMonitor opening = picker(Intent.ACTION_OPEN_DOCUMENT, Activity.RESULT_OK, chosen);
        try {
            evaluate(web, "document.getElementById('decrypt-tab').click();" +
                    "window.__syntheticMessageGesture='none';" +
                    "document.getElementById('encrypted-message-file').addEventListener('click',event => {" +
                    "window.__syntheticMessageGesture=String(event.isTrusted)+'|'+String(navigator.userActivation.isActive); },{once:true}); 'ready'");
            WebViewTestInput.tapElement(instrumentation, web, "encrypted-message-file");
            await(web, "String(document.getElementById('encrypted-message-file').files.length)", "1");
            assertEquals("file selection must keep trusted transient activation", "true|true", evaluate(web, "window.__syntheticMessageGesture"));
            assertEquals("one explicit file-open request", 1, opening.getHits());
            assertEquals("selection is not an automatic decrypt", "", evaluate(web, "document.getElementById('decrypted-output').value"));
            assertEquals("true", evaluate(web, "String(document.getElementById('download-decrypted-file').disabled)"));
            assertEquals("no private key is requested", "", evaluate(web, "document.getElementById('recovery-private-key').value"));
            evaluate(web, "document.getElementById('decrypt-passphrase').value='synthetic Android binary message only';" +
                    "document.getElementById('decrypt-form').requestSubmit(); 'started'");
            await(web, "document.getElementById('decrypt-status').dataset.kind || ''", "success");
            assertEquals("binary data is not rendered as text or HTML", "", evaluate(web, "document.getElementById('decrypted-output').value"));
            assertTrue(evaluate(web, "document.getElementById('decrypted-payload-status').textContent").contains("Binary payload"));
            assertEquals("acknowledgement is separate from decrypt", "true", evaluate(web, "String(document.getElementById('download-decrypted-file').disabled)"));
            Instrumentation.ActivityMonitor saving = picker(Intent.ACTION_CREATE_DOCUMENT, Activity.RESULT_OK, destination);
            try {
                evaluate(web, "document.getElementById('decrypted-save-ack').click(); document.getElementById('download-decrypted-file').click(); 'requested'");
                await(web, "document.getElementById('decrypt-status').textContent", "Saved ");
                assertEquals(1, saving.getHits());
                assertArrayEquals(new byte[] {0, (byte)255, (byte)254, 1}, read(destination));
                assertTrue(evaluate(web, "document.getElementById('decrypt-status').textContent").contains("UNENCRYPTED"));
            } finally { instrumentation.removeMonitor(saving); }
            assertEquals("no remembered secrets", "0", evaluate(web, "String(localStorage.length + sessionStorage.length)"));
        } finally {
            instrumentation.removeMonitor(opening);
            activity.getContentResolver().delete(chosen, null, null);
            activity.getContentResolver().delete(destination, null, null);
            evaluate(web, "document.getElementById('clear-all').click(); 'cleared'");
        }
    }

    @Test(timeout = 90000)
    public void providerWriteRefusalAndReadbackMismatchNeverClaimSuccessAndRetryWorks() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        acceptNetworkWarning();
        WebView web = find(activity.getWindow().getDecorView());
        load(web, PGP_URL);
        String synthetic = "Synthetic provider failure/retry control — no private data";
        for (String name : new String[] { "denied.asc", "corrupt.asc", "export.asc" }) {
            Uri destination = document(name);
            Instrumentation.ActivityMonitor saving = picker(Intent.ACTION_CREATE_DOCUMENT, Activity.RESULT_OK, destination);
            try {
                evaluate(web, "document.getElementById('encrypted-output').value=" + JSONObject.quote(synthetic) + ";" +
                        "document.querySelector('[data-download]').click(); 'requested'");
                boolean expectedSuccess = "export.asc".equals(name);
                await(web, "document.getElementById('encrypt-status').dataset.kind || ''", expectedSuccess ? "success" : "error");
                assertEquals(1, saving.getHits());
                assertEquals(synthetic, evaluate(web, "document.getElementById('encrypted-output').value"));
                if (expectedSuccess) {
                    assertArrayEquals(synthetic.getBytes(StandardCharsets.UTF_8), read(destination));
                    assertTrue(evaluate(web, "document.getElementById('encrypt-status').textContent").startsWith("Saved "));
                } else {
                    assertTrue(evaluate(web, "document.getElementById('encrypt-status').textContent").contains("Save failed"));
                    assertFalse(evaluate(web, "document.getElementById('encrypt-status').textContent").contains("read-back verified"));
                }
                java.io.File staging = new java.io.File(activity.getCacheDir(), "local-file-exports");
                String[] pending = staging.list();
                assertTrue("failed and successful saves must clean the temporary staging file", pending == null || pending.length == 0);
            } finally {
                instrumentation.removeMonitor(saving);
                activity.getContentResolver().delete(destination, null, null);
            }
        }
        evaluate(web, "document.getElementById('clear-all').click(); 'cleared'");
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

    @Test(timeout = 90000)
    public void androidPublicRememberingSurvivesReloadAndExplicitClearForgetsIt() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        acceptNetworkWarning();
        WebView web = find(activity.getWindow().getDecorView());
        load(web, PGP_URL);
        evaluate(web, "document.getElementById('clear-all').click(); document.getElementById('keyring-tab').click();" +
                "(async () => { const pgp = await import('openpgp');" +
                "const generated = await pgp.generateKey({type:'ecc',curve:'curve25519Legacy'," +
                "userIDs:[{name:'Synthetic Android PUBLIC remembering only'}]," +
                "passphrase:'synthetic Android key passphrase only',config:{v6Keys:false}});" +
                "document.getElementById('public-key-input').value=generated.publicKey;" +
                "document.getElementById('keyring-import-form').requestSubmit(); })(); 'started'");
        await(web, "String(document.querySelectorAll('#keyring-list li').length)", "1");
        assertEquals("0", evaluate(web, "String(localStorage.length)"));
        evaluate(web, "document.getElementById('remember-public-keyring').click(); 'remembered'");
        String snapshot = evaluate(web, "localStorage.getItem('openpgp-workbench.public-keyring.v1')");
        assertTrue(snapshot.contains("BEGIN PGP PUBLIC KEY BLOCK"));
        assertFalse(snapshot.contains("PRIVATE KEY"));
        assertFalse(snapshot.contains("passphrase"));
        load(web, PGP_URL);
        await(web, "String(document.querySelectorAll('#keyring-list li').length)", "1");
        // Entry count and same-URL readyState alone can refer to the PREVIOUS
        // document. Await the new document's completed restore, not a sleep.
        await(web, "document.getElementById('keyring-status').dataset.kind + '|' + document.getElementById('keyring-status').textContent", "success|Remembered PUBLIC certificates restored after revalidation");
        assertTrue(evaluate(web, "document.getElementById('keyring-status').textContent").contains("revalidation"));
        assertEquals("", evaluate(web, "document.getElementById('key-passphrase').value"));
        assertEquals("", evaluate(web, "document.getElementById('generated-public-output').value"));
        evaluate(web, "document.getElementById('clear-all').click(); 'cleared'");
        assertEquals("true", evaluate(web, "String(localStorage.getItem('openpgp-workbench.public-keyring.v1') === null)"));
    }

    @Test(timeout = 90000)
    public void v6PublicSubsetExportsSaveTwoPublicFilesAndRememberOnlyTheValidatedSubset() throws Exception {
        MainActivity activity = activityRule.launchActivity(null);
        acceptNetworkWarning();
        WebView web = find(activity.getWindow().getDecorView());
        load(web, PGP_URL);
        evaluate(web, "document.getElementById('clear-all').click(); document.getElementById('keyring-tab').click();" +
                "(async () => { const pgp = await import('openpgp');" +
                "const generated = await pgp.generateKey({type:'curve25519',userIDs:[{name:'Synthetic Android v6 PUBLIC export only'}]," +
                "subkeys:[{sign:false},{sign:true},{sign:false}],config:{v6Keys:true,aeadProtect:true}});" +
                "const key=await pgp.readKey({armoredKey:generated.publicKey}), packets=key.toPacketList();" +
                // Unsupported PUBLIC-only negative fixture, not a valid extra key.
                "packets.push({constructor:{tag:14},write:()=>Uint8Array.of(6,0,0,0,1,35,0,0,0,4,1,2,3,4)},key.subkeys[0].bindingSignatures[0]);" +
                "document.getElementById('public-key-input').value=pgp.armor(pgp.enums.armor.publicKey,packets.write());" +
                "document.getElementById('expected-fingerprint').value=key.getFingerprint().toUpperCase();" +
                "window.__syntheticV6Ready=true; })(); 'started'");
        await(web, "String(window.__syntheticV6Ready)", "true");
        String full = evaluate(web, "document.getElementById('public-key-input').value");
        String fingerprint = evaluate(web, "document.getElementById('expected-fingerprint').value");
        assertTrue("v6 primary needs its entire 64-hex fingerprint", fingerprint.matches("[A-F0-9]{64}"));
        for (boolean reduced : new boolean[] { false, true }) {
            Uri destination = document(reduced ? "v6-reduced.asc" : "v6-full.asc");
            Instrumentation.ActivityMonitor saving = picker(Intent.ACTION_CREATE_DOCUMENT, Activity.RESULT_OK, destination);
            try {
                evaluate(web, "document.getElementById('" + (reduced ? "export-reduced-public-input" : "export-full-public-input") + "').click(); 'requested'");
                await(web, "document.getElementById('keyring-status').textContent", "Saved ");
                assertEquals("exactly one system save per explicit export", 1, saving.getHits());
                String saved = new String(read(destination), StandardCharsets.UTF_8);
                assertTrue(saved.startsWith("-----BEGIN PGP PUBLIC KEY BLOCK-----"));
                assertFalse(saved.contains("PRIVATE KEY"));
                assertEquals("subset export must not overwrite the original input", full, evaluate(web, "document.getElementById('public-key-input').value"));
                if (!reduced) assertEquals(full, saved);
                else {
                    evaluate(web, "document.getElementById('public-key-input').value=" + JSONObject.quote(saved) + ";" +
                            "document.getElementById('keyring-import-form').requestSubmit(); 'imported'");
                    await(web, "document.getElementById('keyring-status').dataset.kind || ''", "success");
                    assertEquals("1", evaluate(web, "String(document.querySelectorAll('#keyring-list li').length)"));
                    assertTrue(evaluate(web, "document.getElementById('keyring-list').textContent").contains("Usable bound encryption key detected"));
                }
            } finally {
                instrumentation.removeMonitor(saving);
                activity.getContentResolver().delete(destination, null, null);
            }
        }
        evaluate(web, "document.getElementById('remember-public-keyring').click(); 'remembered'");
        load(web, PGP_URL);
        await(web, "document.getElementById('keyring-status').textContent", "Remembered PUBLIC certificates restored after revalidation");
        assertEquals("1", evaluate(web, "String(document.querySelectorAll('#keyring-list li').length)"));
        assertTrue(evaluate(web, "document.getElementById('keyring-list').textContent").contains("v6 Ed25519 / X25519"));
        assertEquals("", evaluate(web, "document.getElementById('key-passphrase').value"));
        evaluate(web, "document.getElementById('clear-all').click(); 'cleared'");
        assertEquals("true", evaluate(web, "String(localStorage.getItem('openpgp-workbench.public-keyring.v1') === null)"));
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
        // UiAutomator synchronizes the actual foreground window. A cached raw
        // AccessibilityNodeInfo tree can stay on the prior app during launch.
        UiDevice device = UiDevice.getInstance(instrumentation);
        UiObject2 title = device.wait(Until.findObject(By.text("Network-enabled apps")), 10000);
        assertNotNull("network warning must be shown, foreground package=" + device.getCurrentPackageName(), title);
        UiObject2 positive = device.wait(Until.findObject(By.res("android", "button1")), 10000);
        assertNotNull("network warning must have a native positive button", positive);
        assertEquals("continue", positive.getText().toLowerCase(java.util.Locale.ROOT));
        positive.click();
        assertTrue("synthetic user must explicitly dismiss the network warning",
                Boolean.TRUE.equals(device.wait(Until.gone(By.text("Network-enabled apps")), 10000)));
    }
    private void load(WebView web, String url) throws Exception {
        assertNotNull(web);
        Log.i("Html5LocalFileSmoke", "loading synthetic packaged page " + url);
        // Never evaluate JS in a provisional/initial navigation: Android may
        // discard that document's callback. A unique query (ignored by the
        // packaged asset resolver) distinguishes same-URL reloads without
        // changing origins or adding a production test hook.
        String requested = Uri.parse(url).buildUpon().appendQueryParameter("__androidSmokeNavigation",
                java.util.UUID.randomUUID().toString()).build().toString();
        instrumentation.runOnMainSync(() -> web.loadUrl(requested));
        long deadline = SystemClock.uptimeMillis() + 30000;
        boolean[] committed = new boolean[1];
        do {
            instrumentation.runOnMainSync(() -> {
                android.webkit.WebHistoryItem current = web.copyBackForwardList().getCurrentItem();
                committed[0] = current != null && requested.equals(current.getUrl()) &&
                        requested.equals(web.getUrl()) && web.getProgress() == 100;
            });
            if (committed[0]) break;
            SystemClock.sleep(100);
        } while (SystemClock.uptimeMillis() < deadline);
        assertTrue("requested packaged document must finish native navigation", committed[0]);
        WebViewTestInput.awaitVisualState(instrumentation, web);
        await(web, "document.readyState + '|' + location.href + '|' + typeof Html5LocalFiles", "complete|" + requested + "|object");
        Log.i("Html5LocalFileSmoke", "loaded synthetic packaged page " + url);
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
