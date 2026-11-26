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
    static String lastGesture = "none"; // Synthetic control geometry only, never page values.

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
        // Dismissing the network warning can restore focus to the native
        // toolbar rather than this WebView. Window focus alone is insufficient.
        boolean[] viewFocused = new boolean[1];
        instrumentation.runOnMainSync(() -> { web.requestFocus(); viewFocused[0] = web.hasFocus(); });
        assertTrue("the actual target WebView must own view focus before a touch", viewFocused[0]);
        evaluate(web, "document.getElementById(" + JSONObject.quote(id) + ").scrollIntoView({behavior:'instant',block:'center',inline:'center'}); 'scrolled'");
        // A completed evaluateJavascript callback acknowledges DOM layout, not
        // the frame currently receiving Android touches. Wait for compositor
        // readiness and actual animation frames before measuring/injecting.
        awaitVisualState(instrumentation, web);
        JSONArray point = new JSONArray(evaluate(web,
                "JSON.stringify((() => { const e=document.getElementById(" + JSONObject.quote(id) + "), r=e.getBoundingClientRect();" +
                "const x=r.left + Math.min(r.width / 2, 24), y=r.top + r.height / 2, hit=document.elementFromPoint(x,y);" +
                "const v=window.visualViewport || {width:innerWidth,offsetLeft:0,offsetTop:0};" +
                // Native pixels cover the VISUAL viewport, not a wider layout
                // viewport or its pan/zoom offset after native focus changes.
                "return [x-v.offsetLeft,y-v.offsetTop,v.width,r.width,r.height,!!hit && (hit===e || e.contains(hit)),!e.disabled]; })())"));
        assertTrue("gesture target must be visible and nonempty", point.getDouble(3) > 0 && point.getDouble(4) > 0);
        assertTrue("gesture must hit the enabled HTML control, not padding/another element", point.getBoolean(5) && point.getBoolean(6));
        int[] location = new int[2], width = new int[1];
        Rect visible = new Rect();
        instrumentation.runOnMainSync(() -> { web.getLocationOnScreen(location); web.getGlobalVisibleRect(visible); width[0] = web.getWidth(); });
        float scale = width[0] / (float) point.getDouble(2);
        float x = location[0] + (float) point.getDouble(0) * scale;
        float y = location[1] + (float) point.getDouble(1) * scale;
        lastGesture = id + ": CSS/viewport=" + point + ", native=" + x + "," + y + ", visible=" + visible + ", viewFocus=" + viewFocused[0];
        Log.i("Html5GestureSmoke", lastGesture);
        assertTrue("gesture point must be inside the visible app WebView, not a status/navigation bar: " + x + "," + y + " within " + visible,
                visible.contains(Math.round(x), Math.round(y)));
        long now = SystemClock.uptimeMillis();
        MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, x, y, 0);
        MotionEvent up = null;
        try {
            down.setSource(InputDevice.SOURCE_TOUCHSCREEN);
            Log.i("Html5GestureSmoke", id + ": injecting ACTION_DOWN");
            instrumentation.sendPointerSync(down);
            // Use a real tap duration and current event time, not an ACTION_UP
            // timestamp in the future submitted immediately after ACTION_DOWN.
            SystemClock.sleep(80);
            up = MotionEvent.obtain(now, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, x, y, 0);
            up.setSource(InputDevice.SOURCE_TOUCHSCREEN);
            Log.i("Html5GestureSmoke", id + ": injecting ACTION_UP");
            instrumentation.sendPointerSync(up);
            Log.i("Html5GestureSmoke", id + ": touchscreen injection returned");
        } finally { down.recycle(); if (up != null) up.recycle(); }
    }

    static void awaitVisualState(Instrumentation instrumentation, WebView web) throws Exception {
        CountDownLatch drawn = new CountDownLatch(1);
        instrumentation.runOnMainSync(() -> {
            web.postVisualStateCallback(SystemClock.uptimeMillis(), new WebView.VisualStateCallback() {
                @Override public void onComplete(long requestId) {
                    // The callback guarantees the requested DOM state can be
                    // drawn NEXT; it does not say that frame was drawn already.
                    web.postOnAnimation(() -> web.postOnAnimation(drawn::countDown));
                }
            });
            web.invalidate();
        });
        assertTrue("WebView must present the requested visual state before a native gesture", drawn.await(10, TimeUnit.SECONDS));
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
