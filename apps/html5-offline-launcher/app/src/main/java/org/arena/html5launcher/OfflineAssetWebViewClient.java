package org.arena.html5launcher;

import android.content.Context;
import android.content.res.AssetManager;
import android.net.Uri;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Serves only packaged assets and denies all non-local requests. */
final class OfflineAssetWebViewClient extends WebViewClient {
    static final String HOME_URL = "https://catalog.invalid/index.html";
    private static final String CATALOG_HOST = "catalog.invalid";
    private static final String TAG = "Html5Offline";

    private final AssetManager assets;
    private final Map<String, String> rootsByHost = new HashMap<>();

    OfflineAssetWebViewClient(Context context) {
        assets = context.getApplicationContext().getAssets();
        rootsByHost.put(CATALOG_HOST, "launcher");
        loadAppHosts();
    }

    private void loadAppHosts() {
        try (InputStream input = assets.open("launcher/catalog.json")) {
            JSONObject catalog = new JSONObject(readUtf8(input));
            JSONArray apps = catalog.getJSONArray("apps");
            Set<String> seen = new HashSet<>();
            for (int i = 0; i < apps.length(); i++) {
                JSONObject app = apps.getJSONObject(i);
                String slug = app.getString("slug");
                String host = app.getString("host").toLowerCase(Locale.ROOT);
                if (!slug.matches("[A-Za-z0-9][A-Za-z0-9._-]*") ||
                        !host.matches("[a-z0-9]+(?:-[a-z0-9]+)*\\.invalid") ||
                        CATALOG_HOST.equals(host) || !seen.add(host)) {
                    Log.e(TAG, "Ignoring invalid or duplicate catalog host for " + slug);
                    continue;
                }
                rootsByHost.put(host, "apps/" + slug);
            }
        } catch (Exception error) {
            Log.e(TAG, "Could not load the packaged app catalog", error);
        }
    }

    private static String readUtf8(InputStream input) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int read;
        while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
        return output.toString(StandardCharsets.UTF_8.name());
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        return serve(request.getUrl());
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
        return serve(Uri.parse(url));
    }

    private WebResourceResponse serve(Uri uri) {
        String scheme = uri.getScheme();
        if (scheme != null && isWebViewLocalScheme(scheme)) return null;

        String host = uri.getHost();
        String root = host == null ? null : rootsByHost.get(host.toLowerCase(Locale.ROOT));
        if (!"https".equalsIgnoreCase(scheme) || root == null) {
            return errorResponse(451, "Blocked", "Offline mode blocks external requests.");
        }

        String assetPath = resolveAssetPath(root, uri.getPath());
        if (assetPath == null) {
            return errorResponse(400, "Bad Request", "Invalid local asset path.");
        }

        try {
            InputStream stream = assets.open(assetPath, AssetManager.ACCESS_STREAMING);
            String mimeType = mimeTypeFor(assetPath);
            String encoding = isTextMime(mimeType) ? "UTF-8" : null;
            return new WebResourceResponse(mimeType, encoding, stream);
        } catch (FileNotFoundException missing) {
            return errorResponse(404, "Not Found", "Local asset not found.");
        } catch (IOException error) {
            Log.w(TAG, "Could not open local asset " + assetPath, error);
            return errorResponse(500, "Internal Server Error", "Local asset could not be read.");
        }
    }

    private static boolean isWebViewLocalScheme(String scheme) {
        return "data".equalsIgnoreCase(scheme) ||
                "blob".equalsIgnoreCase(scheme) ||
                "about".equalsIgnoreCase(scheme) ||
                "javascript".equalsIgnoreCase(scheme);
    }

    private static String resolveAssetPath(String root, String rawPath) {
        String path = rawPath == null || rawPath.isEmpty() ? "/" : rawPath;
        if (path.indexOf('\0') >= 0 || path.indexOf('\\') >= 0) return null;
        if (path.equals("/apps") || path.equals("/apps/")) return null;
        while (path.startsWith("/")) path = path.substring(1);
        if (path.isEmpty() || path.endsWith("/")) path += "index.html";

        String[] parts = path.split("/", -1);
        for (String part : parts) {
            if (part.isEmpty() || ".".equals(part) || "..".equals(part)) return null;
        }
        return root + "/" + path;
    }

    private static String mimeTypeFor(String assetPath) {
        int dot = assetPath.lastIndexOf('.');
        String extension = dot < 0 ? "" : assetPath.substring(dot + 1).toLowerCase(Locale.ROOT);
        switch (extension) {
            case "html":
            case "htm": return "text/html";
            case "css": return "text/css";
            case "js":
            case "mjs":
            case "cjs": return "text/javascript";
            case "json":
            case "map": return "application/json";
            case "webmanifest": return "application/manifest+json";
            case "xml":
            case "xsl": return "application/xml";
            case "svg": return "image/svg+xml";
            case "txt":
            case "md":
            case "toml": return "text/plain";
            case "csv": return "text/csv";
            case "wasm": return "application/wasm";
            case "pdf": return "application/pdf";
            case "png": return "image/png";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "gif": return "image/gif";
            case "webp": return "image/webp";
            case "avif": return "image/avif";
            case "ico": return "image/x-icon";
            case "woff": return "font/woff";
            case "woff2": return "font/woff2";
            case "ttf": return "font/ttf";
            case "otf": return "font/otf";
            case "mp3": return "audio/mpeg";
            case "ogg": return "audio/ogg";
            case "wav": return "audio/wav";
            case "mp4": return "video/mp4";
            case "webm": return "video/webm";
            case "zip":
            case "xdc":
            case "bin": return "application/octet-stream";
            default: return "application/octet-stream";
        }
    }

    private static boolean isTextMime(String mimeType) {
        return mimeType.startsWith("text/") ||
                "application/json".equals(mimeType) ||
                "application/manifest+json".equals(mimeType) ||
                "application/xml".equals(mimeType) ||
                "application/javascript".equals(mimeType) ||
                "image/svg+xml".equals(mimeType);
    }

    private static WebResourceResponse errorResponse(int status, String reason, String message) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        headers.put("X-Content-Type-Options", "nosniff");
        byte[] body = message.getBytes(StandardCharsets.UTF_8);
        return new WebResourceResponse(
                "text/plain",
                "UTF-8",
                status,
                reason,
                headers,
                new ByteArrayInputStream(body)
        );
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri = request.getUrl();
        String scheme = uri.getScheme();
        if (scheme != null && isWebViewLocalScheme(scheme)) return false;

        String host = uri.getHost();
        String normalizedHost = host == null ? "" : host.toLowerCase(Locale.ROOT);
        if ("https".equalsIgnoreCase(scheme) && rootsByHost.containsKey(normalizedHost)) {
            String path = uri.getPath();
            if (!CATALOG_HOST.equals(normalizedHost) &&
                    ("/apps".equals(path) || "/apps/".equals(path))) {
                view.loadUrl(HOME_URL);
                return true;
            }
            return false;
        }

        Toast.makeText(view.getContext(), "Offline mode: external links are disabled.", Toast.LENGTH_SHORT).show();
        return true;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();
        if (scheme != null && isWebViewLocalScheme(scheme)) return false;

        String host = uri.getHost();
        String normalizedHost = host == null ? "" : host.toLowerCase(Locale.ROOT);
        if ("https".equalsIgnoreCase(scheme) && rootsByHost.containsKey(normalizedHost)) {
            String path = uri.getPath();
            if (!CATALOG_HOST.equals(normalizedHost) &&
                    ("/apps".equals(path) || "/apps/".equals(path))) {
                view.loadUrl(HOME_URL);
                return true;
            }
            return false;
        }

        Toast.makeText(view.getContext(), "Offline mode: external links are disabled.", Toast.LENGTH_SHORT).show();
        return true;
    }
}
