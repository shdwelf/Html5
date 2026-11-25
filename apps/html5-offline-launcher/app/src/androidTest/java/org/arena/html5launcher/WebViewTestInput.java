package org.arena.html5launcher;

import static org.junit.Assert.assertTrue;

import android.app.Instrumentation;
import android.graphics.Rect;
import android.os.SystemClock;
import android.util.Log;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.webkit.WebView;

import androidx.test.uiautomator.UiDevice;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Real touchscreen activation for user-gesture-gated WebView controls. Test APK only. */
final class WebViewTestInput {
    static void tapElement(Instrumentation instrumentation, WebView web, String id) throws Exception {
        // Preserve the original idle-synchronized path for picker/game controls.
        Log.i("Html5GestureSmoke", id + ": waiting for the focused app window");
        UiDevice device = UiDevice.getInstance(instrumentation);
        String targetPackage = instrumentation.getTargetContext().getPackageName();
        long deadline = SystemClock.uptimeMillis() + 15000;
        boolean[] focused = new boolean[1];
        do {
            instrumentation.runOnMainSync(() -> focused[0] = web.isShown() && web.hasWindowFocus());
            if (focused[0] && targetPackage.equals(device.getCurrentPackageName())) break;
            SystemClock.sleep(100);
        } while (SystemClock.uptimeMillis() < deadline);
        assertTrue("gesture requires the target app's foreground window; current=" + device.getCurrentPackageName(),
                focused[0] && targetPackage.equals(device.getCurrentPackageName()));
        tapVisibleElement(instrumentation, web, id);
    }

    static void tapBusyElement(Instrumentation instrumentation, WebView web, String id) throws Exception {
        // Page JS can be ready while another Android window is foreground.
        // Instrumentation correctly refuses an injection into another UID.
        // Wait for our own visible, focused window; never tap through system
        // alerts or replace a user gesture with a synthetic JavaScript click.
        // Phase-only diagnostics: never log page values, keys or passphrases.
        Log.i("Html5GestureSmoke", id + ": waiting for the focused app window");
        String targetPackage = instrumentation.getTargetContext().getPackageName();
        String currentPackage = "";
        long deadline = SystemClock.uptimeMillis() + 15000;
        boolean[] focused = new boolean[1];
        do {
            instrumentation.runOnMainSync(() -> focused[0] = web.isShown() && web.hasWindowFocus());
            // UiDevice.getCurrentPackageName implicitly waits for global
            // accessibility idleness, up to 10 seconds PER call. A live
            // progress bar need not become idle before its Stop can be tapped.
            // Refresh the actual active window's package instead; keep both
            // the foreground-package and visible/focused-view guards intact.
            currentPackage = activeWindowPackage(instrumentation);
            if (focused[0] && targetPackage.equals(currentPackage)) break;
            SystemClock.sleep(100);
        } while (SystemClock.uptimeMillis() < deadline);
        assertTrue("gesture requires the target app's foreground window; current=" + currentPackage,
                focused[0] && targetPackage.equals(currentPackage));
        tapVisibleElement(instrumentation, web, id);
    }

    private static void tapVisibleElement(Instrumentation instrumentation, WebView web, String id) throws Exception {
        Log.i("Html5GestureSmoke", id + ": focused; scrolling and measuring the visible HTML control");
        evaluate(web, "document.getElementById(" + JSONObject.quote(id) + ").scrollIntoView({behavior:'instant',block:'center',inline:'center'}); 'scrolled'");
        JSONArray point = new JSONArray(evaluate(web,
                "JSON.stringify((() => { const r=document.getElementById(" + JSONObject.quote(id) + ").getBoundingClientRect();" +
                "return [r.left + Math.min(r.width / 2, 24), r.top + r.height / 2, innerWidth, r.width, r.height]; })())"));
        assertTrue("gesture target must be visible and nonempty", point.getDouble(3) > 0 && point.getDouble(4) > 0);
        int[] location = new int[2];
        Rect visible = new Rect();
        instrumentation.runOnMainSync(() -> { web.getLocationOnScreen(location); web.getGlobalVisibleRect(visible); });
        float scale = web.getWidth() / (float) point.getDouble(2);
        float x = location[0] + (float) point.getDouble(0) * scale;
        float y = location[1] + (float) point.getDouble(1) * scale;
        assertTrue("gesture point must be inside the visible app WebView, not a status/navigation bar: " + x + "," + y + " within " + visible,
                visible.contains(Math.round(x), Math.round(y)));
        long now = SystemClock.uptimeMillis();
        MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, x, y, 0);
        MotionEvent up = MotionEvent.obtain(now, now + 80, MotionEvent.ACTION_UP, x, y, 0);
        try {
            down.setSource(InputDevice.SOURCE_TOUCHSCREEN); up.setSource(InputDevice.SOURCE_TOUCHSCREEN);
            Log.i("Html5GestureSmoke", id + ": injecting ACTION_DOWN");
            instrumentation.sendPointerSync(down);
            Log.i("Html5GestureSmoke", id + ": injecting ACTION_UP");
            instrumentation.sendPointerSync(up);
            Log.i("Html5GestureSmoke", id + ": touchscreen injection returned");
        } finally { down.recycle(); up.recycle(); }
    }

    @SuppressWarnings("deprecation") // Recycle remains appropriate on older supported test APIs.
    private static String activeWindowPackage(Instrumentation instrumentation) {
        AccessibilityNodeInfo root = instrumentation.getUiAutomation().getRootInActiveWindow();
        if (root == null) return "";
        try {
            if (!root.refresh()) return ""; // A stale/detached root cannot authorize a gesture.
            CharSequence name = root.getPackageName();
            return name == null ? "" : name.toString();
        } finally { root.recycle(); }
    }

    private static String evaluate(WebView web, String expression) throws Exception {
        CountDownLatch complete = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        web.post(() -> web.evaluateJavascript(expression, value -> { result.set(value); complete.countDown(); }));
        assertTrue("gesture JavaScript callback must be bounded", complete.await(10, TimeUnit.SECONDS));
        Object parsed = new JSONTokener(result.get() == null ? "null" : result.get()).nextValue();
        return parsed == null || parsed == JSONObject.NULL ? "" : String.valueOf(parsed);
    }
}
