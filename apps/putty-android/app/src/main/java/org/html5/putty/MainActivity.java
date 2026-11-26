package org.html5.putty;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputFilter;
import android.text.InputType;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/** Unofficial, deliberately line-oriented Android front end to PuTTY/Plink. */
public final class MainActivity extends Activity {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final PlainTerminal terminal = new PlainTerminal();
    private EditText host, port, username, fingerprint, input;
    private CheckBox masked;
    private Button connect, send;
    private TextView display, status;
    private ScrollView outputScroll;
    private PtySession session;
    private boolean foreground, dirty;
    private volatile int generation;
    private final Runnable refresh = new Runnable() {
        @Override public void run() {
            if (!foreground) return;
            synchronized (terminal) {
                if (dirty) {
                    display.setText(terminal.snapshot());
                    outputScroll.post(() -> outputScroll.fullScroll(View.FOCUS_DOWN));
                    dirty = false;
                }
            }
            handler.postDelayed(this, 80);
        }
    };

    @Override public void onCreate(Bundle ignoredState) {
        super.onCreate(null); // Never restore credentials or a terminal transcript.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(16), dp(10), dp(16), dp(8));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(dp(16) + insets.getSystemWindowInsetLeft(), dp(10) + insets.getSystemWindowInsetTop(),
                    dp(16) + insets.getSystemWindowInsetRight(), dp(8) + insets.getSystemWindowInsetBottom());
            return insets;
        });
        root.setBackgroundColor(Color.rgb(16, 23, 30));
        setContentView(root);
        TextView title = label("PuTTY / Plink — unofficial review build", 20);
        root.addView(title);
        root.addView(label("Real PuTTY 0.85 SSH • line-oriented display, not xterm • foreground only", 12));
        ScrollView settingsScroll = new ScrollView(this);
        LinearLayout settings = new LinearLayout(this);
        settings.setOrientation(LinearLayout.VERTICAL);
        settingsScroll.addView(settings);
        root.addView(settingsScroll, new LinearLayout.LayoutParams(-1, dp(250)));
        host = field(settings, "SSH hostname (no URL)", "tty.sdf.org", 253);
        host.setText("tty.sdf.org");
        port = field(settings, "Port", "22", 5);
        port.setInputType(InputType.TYPE_CLASS_NUMBER);
        port.setText("22");
        username = field(settings, "Your authorized username", "username", 64);
        fingerprint = field(settings, "Verified server host-key fingerprint", "SHA256:… (obtain independently)", 80);
        fingerprint.setTextSize(13);
        fingerprint.setTypeface(Typeface.MONOSPACE);
        LinearLayout buttons = new LinearLayout(this);
        buttons.setOrientation(LinearLayout.HORIZONTAL);
        root.addView(buttons);
        connect = button(buttons, "Connect", this::confirmConnection);
        button(buttons, "Disconnect", this::disconnect);
        button(buttons, "Help", this::help);
        status = label("Not connected. No account has been validated.", 12);
        root.addView(status);
        outputScroll = new ScrollView(this);
        display = label("", 13);
        display.setTypeface(Typeface.MONOSPACE);
        display.setPadding(dp(8), dp(8), dp(8), dp(8));
        display.setTextIsSelectable(false);
        display.setSaveEnabled(false);
        display.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        outputScroll.setBackgroundColor(Color.BLACK);
        outputScroll.addView(display);
        root.addView(outputScroll, new LinearLayout.LayoutParams(-1, 0, 1));
        masked = new CheckBox(this);
        masked.setText("Mask input (password / verification code)");
        masked.setTextColor(Color.WHITE);
        masked.setChecked(true);
        root.addView(masked);
        input = new EditText(this);
        input.setTextColor(Color.WHITE);
        input.setHintTextColor(Color.LTGRAY);
        input.setHint("Wait for a prompt, type input, then Send");
        input.setSingleLine(true);
        input.setSaveEnabled(false);
        input.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        input.setImeOptions(EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING | EditorInfo.IME_FLAG_NO_EXTRACT_UI | EditorInfo.IME_ACTION_SEND);
        input.setFilters(new InputFilter[] {new InputFilter.LengthFilter(4096)});
        root.addView(input);
        masked.setOnCheckedChangeListener((view, checked) -> updateInputType());
        updateInputType();
        input.setOnEditorActionListener((view, action, event) -> {
            if (action == EditorInfo.IME_ACTION_SEND) { sendInput(); return true; }
            return false;
        });
        LinearLayout inputButtons = new LinearLayout(this);
        root.addView(inputButtons);
        send = button(inputButtons, "Send ↵", this::sendInput);
        send.setEnabled(false);
        button(inputButtons, "Ctrl-C", () -> sendControl((byte)3));
        button(inputButtons, "Ctrl-D", () -> sendControl((byte)4));
        button(inputButtons, "Clear", () -> { terminal.clear(); display.setText(""); });
        root.setSaveEnabled(false);
    }

    private void updateInputType() {
        input.setText(""); // Do not reveal an already typed secret when toggling.
        input.setInputType(InputType.TYPE_CLASS_TEXT | (masked.isChecked()
                ? InputType.TYPE_TEXT_VARIATION_PASSWORD
                : InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS));
        input.setTypeface(Typeface.MONOSPACE);
    }

    private void confirmConnection() {
        if (session != null || !foreground) return;
        final SessionConfig config;
        try { config = new SessionConfig(host.getText().toString(), port.getText().toString(),
                username.getText().toString(), fingerprint.getText().toString()); }
        catch (IllegalArgumentException invalid) {
            new AlertDialog.Builder(this).setTitle("Connection blocked").setMessage(invalid.getMessage()).setPositiveButton("OK", null).show();
            return;
        }
        new AlertDialog.Builder(this).setTitle("Verify destination")
                .setMessage(config.username + " @ " + config.host + ":" + config.port + "\n\n" + config.hostKey
                        + "\n\nContinue only if this host key was independently verified and this is your authorized account. A key obtained with ssh-keyscan alone is not authenticated."
                        + "\n\nThis is an unofficial, debug-signed review build. Do not use sensitive credentials before reviewing and testing it on your device.")
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Verified — connect", (dialog, which) -> start(config)).show();
    }

    private void start(SessionConfig config) {
        if (session != null || !foreground) return;
        terminal.clear(); display.setText(""); input.setText("");
        masked.setChecked(true);
        final int token = ++generation;
        status.setText("Starting Plink. An SSH connection does not validate SDF membership.");
        connect.setEnabled(false);
        session = new PtySession(getApplicationInfo().nativeLibraryDir + "/libplink.so", getFilesDir().getAbsolutePath(),
                config.arguments(), new PtySession.Listener() {
            public void started() { handler.post(() -> { if (current(token)) send.setEnabled(true); }); }
            public void output(char[] chars, int count) {
                synchronized (terminal) { if (token == generation) { terminal.append(chars, count); dirty = true; } }
            }
            public void ended(int code, boolean failed) {
                handler.post(() -> {
                    if (!current(token)) return;
                    session = null; connect.setEnabled(true); send.setEnabled(false); input.setText("");
                    status.setText(failed ? "Plink could not start on this device. See Help." : "Plink exited (" + code + "). No account-validation claim is made.");
                });
            }
        });
        session.start();
    }

    private boolean current(int token) { return foreground && generation == token; }

    private void sendInput() {
        if (session == null) { input.setText(""); return; }
        String line = input.getText().toString();
        input.setText("");
        byte[] bytes = (line + "\r").getBytes(StandardCharsets.UTF_8);
        // No local echo and no input history. The remote host can still echo data.
        if (!session.send(bytes)) status.setText("Input not sent: connection closed or input queue full.");
    }

    private void sendControl(byte control) {
        if (session != null && !session.send(new byte[] {control})) status.setText("Control input not sent.");
    }

    private void disconnect() {
        ++generation;
        PtySession old = session; session = null;
        if (old != null) old.close();
        if (input != null) input.setText("");
        if (send != null) send.setEnabled(false);
        if (connect != null) connect.setEnabled(true);
        if (status != null) status.setText("Disconnected. No account has been validated by this app.");
    }

    @Override protected void onStart() {
        super.onStart(); foreground = true; handler.post(refresh);
    }
    @Override protected void onStop() {
        foreground = false;
        handler.removeCallbacksAndMessages(null);
        disconnect(); terminal.clear(); display.setText("");
        super.onStop();
    }
    @Override protected void onDestroy() { disconnect(); handler.removeCallbacksAndMessages(null); super.onDestroy(); }
    @Override public void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        state.clear(); // Never persist input or output.
    }

    private void help() {
        String text = "UNOFFICIAL PuTTY/Plink 0.85 Android front end\n\n"
                + "This APK contains real PuTTY/Plink compiled from the official source, not a JSch replacement and not an official PuTTY-team app. The Android UI is line-oriented (TERM=dumb): use shell commands and line-based tools, not vim, tmux, screen or full-screen menus. No SFTP, private-key import, tunnels, saved sessions, background service or Pageant support in this version.\n\n"
                + "HOST KEYS\nEnter the complete SHA256: fingerprint for this exact host, obtained independently from its administrator or an already trusted connection. The app never accepts arbitrary host keys. Agent and X11 forwarding and connection sharing are disabled. No HTTP/telnet fallback.\n\n"
                + "SDF / FREESHELL\nThe supplied freeshell.org label linked to freewheel.org; these must not be treated as equivalent. SDF documents tty.sdf.org as an SSH endpoint (port 22), not an HTTP validation API. Signup is documented as ssh new@sdf.org. Use only your own authorized account. On your SDF shell, run validate for current membership instructions; this app does not execute it automatically, pay fees or validate membership. The public menu account is for vintage menus, not your own account.\n\n"
                + "SDF's public join page distinguishes free USERS after validation, ARPA enhancements and MetaARPA sponsorship/validation. Basic validation cost and this user's account status are not verified here. Ask SDF membership support if unsure. No SDF host key is preloaded because none has been independently authenticated for this build.\n\n"
                + "PRIVACY\nPasswords are typed only after an expected prompt, with Mask input selected, and pass through a private PTY, never process arguments, saved profiles or app logs. Input is cleared after sending; output is bounded and memory-only. Going to the background disconnects and clears the view. Screenshots and Android backup are disabled. The remote host or keyboard can still observe typed data; Java/OS memory cannot be guaranteed wiped. Do not use for sensitive access without review.\n\n"
                + "PRIMARY SOURCES\nhttps://www.chiark.greenend.org.uk/~sgtatham/putty/\nhttps://sdf.org/?join\nhttps://sdf.org/?signup\nhttps://sdf.org/?faq?BASICS?07\n\n";
        text += "PuTTY licence (included unchanged):\n" + asset("PUTTY-LICENCE.txt") + "\n\nBuild source verification:\n" + asset("putty-source.json");
        ScrollView scroll = new ScrollView(this);
        TextView details = new TextView(this);
        details.setPadding(dp(18), dp(12), dp(18), dp(12));
        details.setText(text); scroll.addView(details);
        new AlertDialog.Builder(this).setTitle("Scope, safety & licence").setView(scroll).setPositiveButton("Close", null).show();
    }

    private String asset(String name) {
        try (InputStream stream = getAssets().open(name); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[2048];
            int count;
            while ((count = stream.read(buffer)) != -1) {
                if (bytes.size() + count > 65536) throw new IOException("Oversized metadata");
                bytes.write(buffer, 0, count);
            }
            return new String(bytes.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException missing) { return "Missing build metadata — do not use this build."; }
    }
    private TextView label(String text, int size) {
        TextView label = new TextView(this); label.setText(text); label.setTextSize(size); label.setTextColor(Color.WHITE);
        return label;
    }
    private EditText field(LinearLayout parent, String title, String hint, int limit) {
        parent.addView(label(title, 12));
        EditText field = new EditText(this);
        field.setSingleLine(true); field.setTextColor(Color.WHITE); field.setHintTextColor(Color.GRAY);
        field.setHint(hint); field.setSaveEnabled(false);
        field.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        field.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        field.setFilters(new InputFilter[] {new InputFilter.LengthFilter(limit)});
        parent.addView(field); return field;
    }
    private Button button(LinearLayout parent, String title, Runnable action) {
        Button button = new Button(this); button.setText(title); button.setTextSize(11); button.setMinWidth(0);
        button.setPadding(dp(4), 0, dp(4), 0);
        button.setOnClickListener(view -> action.run());
        parent.addView(button, new LinearLayout.LayoutParams(0, dp(44), 1)); return button;
    }
    private int dp(int pixels) { return Math.round(pixels * getResources().getDisplayMetrics().density); }
}
