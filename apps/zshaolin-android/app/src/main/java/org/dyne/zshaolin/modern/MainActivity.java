package org.dyne.zshaolin.modern;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.os.Bundle;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import com.termux.terminal.*;
import com.termux.view.*;

/** Single foreground Zsh; no command intents, telemetry, root, agents or boot service. */
public final class MainActivity extends Activity implements TerminalSessionClient, TerminalViewClient {
    private TerminalView terminal;
    private TerminalSession session;
    private TextView status;
    private boolean destroyed;
    private float fontSp = 14;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL);
        status = new TextView(this); status.setPadding(16, 12, 16, 12);
        status.setTextColor(Color.WHITE); status.setBackgroundColor(0xff173d31);
        status.setText("ZShaolin Modern • unofficial • preparing offline toolbox");
        layout.addView(status);
        terminal = new TerminalView(this, null); terminal.setTerminalViewClient(this);
        terminal.setTextSize(Math.round(fontSp * getResources().getDisplayMetrics().scaledDensity));
        layout.addView(terminal, new LinearLayout.LayoutParams(-1, 0, 1));
        HorizontalScrollView scroll = new HorizontalScrollView(this);
        LinearLayout keys = new LinearLayout(this);
        key(keys, "ESC", () -> send("\u001b")); key(keys, "TAB", () -> send("\t"));
        key(keys, "CTRL-C", () -> send("\u0003"));
        key(keys, "↑", () -> send("\u001b[A")); key(keys, "↓", () -> send("\u001b[B"));
        key(keys, "Paste…", this::confirmPaste); key(keys, "Keyboard", this::keyboard);
        key(keys, "About", this::about); key(keys, "Exit", this::finish);
        scroll.addView(keys); layout.addView(scroll); setContentView(layout);
        new Thread(() -> {
            try {
                Toolbox.install(getApplicationContext(), text -> runOnUiThread(() -> { if (!destroyed) status.setText(text); }));
                runOnUiThread(() -> { if (!destroyed) startShell(); });
            } catch (Exception e) {
                // Do not send private paths, package output or terminal text to logcat.
                runOnUiThread(() -> {
                    if (destroyed) return;
                    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    status.setText("Installation stopped safely — no terminal started");
                    new AlertDialog.Builder(this).setTitle("Toolbox not ready")
                        .setMessage(e.getMessage()).setPositiveButton("Close", (d, w) -> finish()).show();
                });
            }
        }, "offline-toolbox-install").start();
    }
    private void key(LinearLayout keys, String label, Runnable action) {
        Button button = new Button(this); button.setText(label); button.setAllCaps(false);
        button.setContentDescription(label); button.setOnClickListener(v -> action.run()); keys.addView(button);
    }
    private void startShell() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        session = new TerminalSession(Toolbox.PREFIX + "/bin/zsh", Toolbox.HOME,
            new String[]{"zsh", "-i"}, Toolbox.environmentArray(), 2000, this);
        terminal.attachSession(session); terminal.requestFocus();
        status.setText("ZShaolin Modern • foreground Zsh • no VPN/root or auto-started server");
    }
    private void send(String text) { if (session != null) session.write(text); }
    private void keyboard() {
        terminal.requestFocus();
        ((InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).showSoftInput(terminal, InputMethodManager.SHOW_IMPLICIT);
    }
    private void confirmPaste() {
        if (session == null) return;
        new AlertDialog.Builder(this).setTitle("Paste into shell?")
            .setMessage("Clipboard text can contain executable commands. Paste only content you trust.")
            .setNegativeButton("Cancel", null).setPositiveButton("Paste", (d, w) -> {
                ClipboardManager cb = (ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
                if (cb.hasPrimaryClip() && cb.getPrimaryClip() != null && cb.getPrimaryClip().getItemCount() > 0) {
                    CharSequence text = cb.getPrimaryClip().getItemAt(0).coerceToText(this);
                    if (text != null && text.length() <= 65536 && session.getEmulator() != null)
                        session.getEmulator().paste(text.toString());
                }
            }).show();
    }
    private void about() {
        new AlertDialog.Builder(this).setTitle("ZShaolin Modern — unofficial")
            .setMessage("Full offline modern toolbox; only Zsh loads at startup. No root, VPN, account access or automatic servers.\n\n" +
                "Uses Termux terminal-engine source and authenticated Android packages. Not a Termux or original ZShaolin release. " +
                "Package ID com.termux cannot coexist with Termux in the same Android user.\n\n" +
                "Target SDK 28 is necessary for app-private native execution; this is a sideload-only compatibility build, not target-35 security. " +
                "No persistent history, backups, screenshots, telemetry, command-intent API or automatic clipboard access.\n\n" +
                "Run z-ssh help for explicit foreground, public-key, loopback SSH. The removed HTTP provisioning flow must never be used. " +
                "Rotate old client keys if they were exposed.\n\n" +
                "Source/build instructions and measured provenance: shdwelf/Html5, apps/zshaolin-android and tools/zshaolin-modern. " +
                "Licences are retained under $PREFIX/share/doc and $PREFIX/share/ZSHAOLIN-COPYING.")
            .setPositiveButton("OK", null).show();
    }
    @Override protected void onDestroy() {
        destroyed = true;
        if (session != null) session.finishIfRunning();
        super.onDestroy();
    }
    @Override public void onTextChanged(TerminalSession s) { terminal.onScreenUpdated(); }
    @Override public void onTitleChanged(TerminalSession s) { /* Never trust terminal text as app chrome. */ }
    @Override public void onSessionFinished(TerminalSession s) { status.setText("Zsh exited. Use Exit to close; relaunch to start a new session."); }
    @Override public void onCopyTextToClipboard(TerminalSession s, String text) { /* Reject OSC52/programmatic clipboard writes. */ }
    @Override public void onPasteTextFromClipboard(TerminalSession s) { /* Only explicit confirmed toolbar paste is allowed. */ }
    @Override public void onBell(TerminalSession s) {}
    @Override public void onColorsChanged(TerminalSession s) { terminal.onScreenUpdated(); }
    @Override public void onTerminalCursorStateChange(boolean state) { terminal.invalidate(); }
    @Override public void setTerminalShellPid(TerminalSession s, int pid) {}
    @Override public Integer getTerminalCursorStyle() { return 0; }
    @Override public float onScale(float scale) {
        if (scale < 0.9f || scale > 1.1f) {
            fontSp = Math.max(9, Math.min(26, fontSp * scale));
            terminal.setTextSize(Math.round(fontSp * getResources().getDisplayMetrics().scaledDensity));
            return 1;
        }
        return scale;
    }
    @Override public void onSingleTapUp(MotionEvent e) { keyboard(); }
    @Override public boolean shouldBackButtonBeMappedToEscape() { return false; }
    @Override public boolean shouldEnforceCharBasedInput() { return false; }
    @Override public boolean shouldUseCtrlSpaceWorkaround() { return true; }
    @Override public boolean isTerminalViewSelected() { return true; }
    @Override public void copyModeChanged(boolean mode) {}
    @Override public boolean onKeyDown(int code, KeyEvent e, TerminalSession s) { return false; }
    @Override public boolean onKeyUp(int code, KeyEvent e) { return false; }
    @Override public boolean onLongPress(MotionEvent e) { return false; }
    @Override public boolean readControlKey() { return false; }
    @Override public boolean readAltKey() { return false; }
    @Override public boolean readShiftKey() { return false; }
    @Override public boolean readFnKey() { return false; }
    @Override public boolean onCodePoint(int cp, boolean ctrl, TerminalSession s) { return false; }
    @Override public void onEmulatorSet() {}
    // Deliberately no terminal/keystroke logcat logging.
    @Override public void logError(String tag, String message) {}
    @Override public void logWarn(String tag, String message) {}
    @Override public void logInfo(String tag, String message) {}
    @Override public void logDebug(String tag, String message) {}
    @Override public void logVerbose(String tag, String message) {}
    @Override public void logStackTraceWithMessage(String tag, String message, Exception e) {}
    @Override public void logStackTrace(String tag, Exception e) {}
}
