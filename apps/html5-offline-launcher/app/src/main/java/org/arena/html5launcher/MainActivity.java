package org.arena.html5launcher;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/** Minimal native shell around the packaged, offline-only HTML catalog. */
public final class MainActivity extends Activity {
    private static final int INK = Color.rgb(20, 27, 38);
    private static final int ACCENT = Color.rgb(66, 214, 190);
    private WebView webView;
    private TextView pageTitle;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(INK);
        window.setNavigationBarColor(INK);

        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(Color.rgb(247, 249, 252));
        setContentView(shell);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(8), dp(5), dp(10), dp(5));
        toolbar.setBackgroundColor(INK);
        shell.addView(toolbar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(54)));

        Button back = new Button(this);
        back.setText("‹");
        back.setTextSize(25);
        back.setTextColor(Color.WHITE);
        back.setAllCaps(false);
        back.setMinWidth(dp(44));
        back.setContentDescription("Back");
        toolbar.addView(back, new LinearLayout.LayoutParams(dp(48), ViewGroup.LayoutParams.MATCH_PARENT));

        LinearLayout titleColumn = new LinearLayout(this);
        titleColumn.setOrientation(LinearLayout.VERTICAL);
        titleColumn.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams titleColumnParams = new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.MATCH_PARENT, 1f);
        titleColumnParams.setMargins(dp(4), 0, dp(4), 0);
        toolbar.addView(titleColumn, titleColumnParams);

        pageTitle = new TextView(this);
        pageTitle.setText("HTML5 Offline Library");
        pageTitle.setTextColor(Color.WHITE);
        pageTitle.setTextSize(15);
        pageTitle.setSingleLine(true);
        pageTitle.setEllipsize(android.text.TextUtils.TruncateAt.END);
        titleColumn.addView(pageTitle, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView mode = new TextView(this);
        mode.setText("LOCAL ONLY  ·  NO NETWORK ACCESS");
        mode.setTextColor(ACCENT);
        mode.setTextSize(9);
        mode.setLetterSpacing(0.08f);
        titleColumn.addView(mode, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        Button catalog = new Button(this);
        catalog.setText("Apps");
        catalog.setTextSize(12);
        catalog.setTextColor(ACCENT);
        catalog.setAllCaps(false);
        catalog.setContentDescription("Open the app catalog");
        toolbar.addView(catalog, new LinearLayout.LayoutParams(dp(68), ViewGroup.LayoutParams.MATCH_PARENT));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        shell.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setGeolocationEnabled(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setLoadsImagesAutomatically(true);

        webView.setWebViewClient(new OfflineAssetWebViewClient(this));
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onReceivedTitle(WebView view, String title) {
                if (title != null && !title.trim().isEmpty()) pageTitle.setText(title.trim());
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.deny();
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture,
                                          android.os.Message resultMsg) {
                return false;
            }
        });
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                Toast.makeText(this, "Downloads are not handled by this offline viewer.", Toast.LENGTH_SHORT).show());

        back.setOnClickListener(view -> goBack());
        catalog.setOnClickListener(view -> openCatalog());
        webView.loadUrl(OfflineAssetWebViewClient.HOME_URL);
    }

    private void goBack() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else if (webView != null) {
            Toast.makeText(this, "You are at the app catalog.", Toast.LENGTH_SHORT).show();
        }
    }

    private void openCatalog() {
        if (webView != null) webView.loadUrl(OfflineAssetWebViewClient.HOME_URL);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
