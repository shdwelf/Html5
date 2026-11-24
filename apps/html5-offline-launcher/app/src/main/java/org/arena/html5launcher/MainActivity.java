package org.arena.html5launcher;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.JsPromptResult;
import android.webkit.ValueCallback;
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
    private static final int REQUEST_ANC_AUDIO = 4105;
    private static final int REQUEST_OPEN_FILE = 4112;
    private static final java.util.Set<String> AUDIO_HOSTS = new java.util.HashSet<>(java.util.Arrays.asList(
            "app-anc-studio.invalid", "app-sound-sanctuary.invalid", "app-aura-sound-studio.invalid"));
    private WebView webView;
    private TextView pageTitle;
    private PermissionRequest pendingAudioRequest;
    private ValueCallback<Uri[]> pendingFileInput;
    private LocalFileExports localFiles;
    private OfflineAssetWebViewClient assetClient;
    private String localFilesScript = "";

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
        pageTitle.setText(BuildConfig.NETWORK_ENABLED
                ? "HTML5 Network Library"
                : "HTML5 Offline Library");
        pageTitle.setTextColor(Color.WHITE);
        pageTitle.setTextSize(15);
        pageTitle.setSingleLine(true);
        pageTitle.setEllipsize(android.text.TextUtils.TruncateAt.END);
        titleColumn.addView(pageTitle, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView mode = new TextView(this);
        mode.setText(BuildConfig.NETWORK_ENABLED
                ? "NETWORK ON  ·  HTTPS HOST VALIDATION"
                : "LOCAL ONLY  ·  NO NETWORK ACCESS");
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

        assetClient = new OfflineAssetWebViewClient(this, BuildConfig.NETWORK_ENABLED);
        localFiles = new LocalFileExports(this, assetClient::isPackagedAppOrigin);
        try (java.io.InputStream script = getAssets().open("launcher/local-files.js")) {
            java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[4096]; int count;
            while ((count = script.read(buffer)) != -1) output.write(buffer, 0, count);
            localFilesScript = output.toString(java.nio.charset.StandardCharsets.UTF_8.name());
        } catch (java.io.IOException failure) {
            Toast.makeText(this, "Local save adapter is unavailable; no download is confirmed.", Toast.LENGTH_LONG).show();
        }
        assetClient.setPageLifecycle(new OfflineAssetWebViewClient.PageLifecycle() {
            @Override public void started() { denyPendingAudioRequest(); cancelFileInput(); localFiles.cancel(); }
            @Override public void finished(String url) {
                if (assetClient.isPackagedAppOrigin(Uri.parse(url)) && url.equals(webView.getUrl())) {
                    webView.evaluateJavascript(localFilesScript, null);
                }
            }
        });
        webView.setWebViewClient(assetClient);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onReceivedTitle(WebView view, String title) {
                if (title != null && !title.trim().isEmpty()) pageTitle.setText(title.trim());
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> handleWebPermissionRequest(request));
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                runOnUiThread(() -> {
                    if (pendingAudioRequest == request) pendingAudioRequest = null;
                });
            }

            @Override
            public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
                return localFiles.handle(view.getUrl(), url, message, defaultValue, result);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (!assetClient.isPackagedAppOrigin(Uri.parse(view.getUrl() == null ? "" : view.getUrl()))) {
                    callback.onReceiveValue(null);
                    return true;
                }
                cancelFileInput();
                pendingFileInput = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*"); // Apps validate their own bounded file format after selection.
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { startActivityForResult(intent, REQUEST_OPEN_FILE); }
                catch (android.content.ActivityNotFoundException missing) {
                    cancelFileInput();
                    Toast.makeText(MainActivity.this, "Install or enable an Android Files provider to import a file.", Toast.LENGTH_LONG).show();
                }
                return true;
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture,
                                          android.os.Message resultMsg) {
                return false;
            }
        });
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                Toast.makeText(this, "No local save was confirmed. Use the app’s Save/Download export control, or open this link in a full browser.", Toast.LENGTH_SHORT).show());

        back.setOnClickListener(view -> goBack());
        catalog.setOnClickListener(view -> openCatalog());
        webView.loadUrl(OfflineAssetWebViewClient.HOME_URL);
        if (BuildConfig.NETWORK_ENABLED) {
            new AlertDialog.Builder(this)
                    .setTitle("Network-enabled apps")
                    .setMessage("This separate build can contact external HTTPS services. News Globe loads dynamic OPML and RSS URLs, so the set of feed hosts is not fixed. Network destinations are checked for HTTPS and syntactically valid hostnames (literal IPs and local-only suffixes are rejected), but hostnames are not resolved or reputation-checked; this does not verify who operates a feed or guarantee its content is safe. Aircraft data providers, News Globe's RSS/CDN services, and RadarScope's configured proxy fallbacks may be unavailable or change their terms; proxy operators can observe proxied request URLs. The public and private offline APKs remain network-disabled.")
                    .setCancelable(false)
                    .setPositiveButton("Continue", (dialog, which) -> {})
                    .setNegativeButton("Exit", (dialog, which) -> finish())
                    .show();
        }
    }

    // Package-private so the Android instrumentation suite can exercise the
    // same WebView permission policy with deterministic PermissionRequest fakes.
    void handleWebPermissionRequest(PermissionRequest request) {
        if (request == null || !isAllowedAudioRequest(request)) {
            if (request != null) request.deny();
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
            return;
        }
        if (pendingAudioRequest != null) {
            request.deny();
            return;
        }
        pendingAudioRequest = request;
        if (shouldShowRequestPermissionRationale(Manifest.permission.RECORD_AUDIO)) {
            Toast.makeText(this,
                    "Microphone access is available only to the three packaged audio labs after you enable their microphone mode.",
                    Toast.LENGTH_LONG).show();
        }
        requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, REQUEST_ANC_AUDIO);
    }

    private boolean isAllowedAudioRequest(PermissionRequest request) {
        if (webView == null || !isAudioOrigin(request.getOrigin())) return false;
        Uri currentPage = Uri.parse(webView.getUrl() == null ? "" : webView.getUrl());
        if (!isAudioOrigin(currentPage) || !LocalFileExports.origin(currentPage).equals(LocalFileExports.origin(request.getOrigin()))) return false;
        String[] resources = request.getResources();
        return resources != null && resources.length == 1 &&
                PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resources[0]);
    }

    private static boolean isAudioOrigin(Uri uri) {
        return uri != null &&
                "https".equalsIgnoreCase(uri.getScheme()) &&
                uri.getUserInfo() == null &&
                AUDIO_HOSTS.contains(uri.getHost() == null ? "" : uri.getHost().toLowerCase(java.util.Locale.ROOT)) &&
                (uri.getPort() == -1 || uri.getPort() == 443);
    }

    private void denyPendingAudioRequest() {
        if (pendingAudioRequest != null) {
            pendingAudioRequest.deny();
            pendingAudioRequest = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_ANC_AUDIO) return;
        PermissionRequest request = pendingAudioRequest;
        pendingAudioRequest = null;
        boolean granted = grantResults.length > 0 &&
                grantResults[0] == PackageManager.PERMISSION_GRANTED &&
                checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        if (request == null) return;
        if (granted && isAllowedAudioRequest(request)) {
            request.grant(new String[] { PermissionRequest.RESOURCE_AUDIO_CAPTURE });
        } else {
            request.deny();
            if (!granted) {
                Toast.makeText(this,
                        "Microphone permission was not granted. Enable it in Android Settings > Apps > HTML5 Offline Library > Permissions, then retry.",
                        Toast.LENGTH_LONG).show();
            }
        }
    }

    private void cancelFileInput() {
        if (pendingFileInput != null) {
            pendingFileInput.onReceiveValue(null);
            pendingFileInput = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (localFiles.onActivityResult(requestCode, resultCode, data)) return;
        if (requestCode != REQUEST_OPEN_FILE) return;
        ValueCallback<Uri[]> callback = pendingFileInput;
        pendingFileInput = null;
        if (callback == null) return;
        Uri uri = resultCode == Activity.RESULT_OK && data != null ? data.getData() : null;
        callback.onReceiveValue(uri != null && "content".equals(uri.getScheme()) ? new Uri[] { uri } : null);
    }

    private void goBack() {
        if (webView != null && webView.canGoBack()) {
            denyPendingAudioRequest();
            webView.goBack();
        } else if (webView != null) {
            Toast.makeText(this, "You are at the app catalog.", Toast.LENGTH_SHORT).show();
        }
    }

    private void openCatalog() {
        if (webView != null) {
            denyPendingAudioRequest();
            webView.loadUrl(OfflineAssetWebViewClient.HOME_URL);
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            denyPendingAudioRequest();
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        denyPendingAudioRequest();
        cancelFileInput();
        if (localFiles != null) localFiles.destroy();
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
