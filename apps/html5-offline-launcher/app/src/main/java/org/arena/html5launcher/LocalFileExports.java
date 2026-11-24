package org.arena.html5launcher;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.webkit.JsPromptResult;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Predicate;

/** Write-only, bounded export RPC. Never exposes a file path or a read API to JS. */
final class LocalFileExports {
    static final String RPC = "html5-local-file-v1";
    static final int REQUEST_SAVE = 4111;
    static final long MAX_BYTES = 64L * 1024 * 1024;
    private final Activity activity;
    private final Predicate<Uri> trusted;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private Pending pending;

    private static final class Pending {
        String id, name, mime, origin;
        File file;
        OutputStream output;
        MessageDigest digest;
        long expected, written;
        int sequence;
        volatile boolean canceled;
        JsPromptResult result;
    }

    LocalFileExports(Activity activity, Predicate<Uri> trusted) {
        this.activity = activity;
        this.trusted = trusted;
        File directory = new File(activity.getCacheDir(), "local-file-exports");
        File[] files = directory.listFiles();
        if (files != null) for (File file : files) {
            if (file.getName().startsWith("export-")) file.delete();
        }
    }

    static String origin(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null ||
                uri.getUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443)) return "";
        return "https://" + uri.getHost().toLowerCase(java.util.Locale.ROOT);
    }

    boolean handle(String topUrl, String callerUrl, String message, String payload, JsPromptResult result) {
        if (!RPC.equals(message)) return false;
        try {
            Uri caller = Uri.parse(callerUrl == null ? "" : callerUrl);
            String topOrigin = origin(Uri.parse(topUrl == null ? "" : topUrl));
            if (topOrigin.isEmpty() || !trusted.test(caller) || !topOrigin.equals(origin(caller))) throw new Exception();
            if (payload == null || payload.length() > 65536) throw new Exception();
            JSONObject data = new JSONObject(payload);
            String operation = data.getString("op");
            if ("begin".equals(operation)) {
                if (pending != null) { reply(result, "error", "Another local save is pending."); return true; }
                Object length = data.get("size");
                if (!(length instanceof Number)) throw new Exception();
                long size = ((Number) length).longValue();
                if (((Number) length).doubleValue() != size || size < 0 || size > MAX_BYTES) throw new Exception();
                Pending next = new Pending();
                next.id = UUID.randomUUID().toString(); next.origin = topOrigin; next.expected = size;
                next.name = data.getString("name").replaceAll("[\\x00-\\x1f\\x7f/\\\\:\\u202a-\\u202e\\u2066-\\u2069]", "_");
                if (next.name.length() > 180) next.name = next.name.substring(0, 180);
                if (next.name.trim().isEmpty() || next.name.equals(".") || next.name.equals("..")) next.name = "export.bin";
                next.mime = data.optString("mime", "application/octet-stream").split(";", 2)[0];
                if (!next.mime.matches("[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+")) next.mime = "application/octet-stream";
                File directory = new File(activity.getCacheDir(), "local-file-exports");
                if (!directory.isDirectory() && !directory.mkdirs()) throw new Exception();
                next.file = File.createTempFile("export-", ".pending", directory);
                next.file.setReadable(false, false); next.file.setWritable(false, false);
                next.file.setReadable(true, true); next.file.setWritable(true, true);
                pending = next; // Any subsequent setup failure is cleaned below.
                next.output = new FileOutputStream(next.file);
                next.digest = MessageDigest.getInstance("SHA-256");
                result.confirm(new JSONObject().put("status", "ready").put("id", next.id).toString());
                return true;
            }
            Pending current = pending;
            if (current == null || current.result != null || !current.id.equals(data.getString("id")) || !current.origin.equals(topOrigin)) throw new Exception();
            if ("chunk".equals(operation)) {
                Object sequence = data.get("seq");
                if (!(sequence instanceof Number) || ((Number) sequence).doubleValue() != current.sequence) throw new Exception();
                String encoded = data.getString("base64");
                if (encoded.length() > 43692 || !encoded.matches("[A-Za-z0-9+/]*={0,2}")) throw new Exception();
                byte[] bytes = Base64.decode(encoded, Base64.NO_WRAP);
                if (bytes.length == 0 || bytes.length > 32768 || current.written + bytes.length > current.expected ||
                        !Base64.encodeToString(bytes, Base64.NO_WRAP).equals(encoded)) throw new Exception();
                current.output.write(bytes); current.digest.update(bytes);
                current.written += bytes.length; current.sequence++;
                result.confirm(new JSONObject().put("status", "chunk").put("seq", current.sequence).toString());
                return true;
            }
            if ("cancel".equals(operation)) { cancel(); reply(result, "canceled", "Local save canceled."); return true; }
            if (!"finish".equals(operation) || current.written != current.expected) throw new Exception();
            current.output.close(); current.output = null;
            current.result = result;
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(current.mime); intent.putExtra(Intent.EXTRA_TITLE, current.name);
            activity.startActivityForResult(intent, REQUEST_SAVE);
        } catch (Exception invalid) {
            cancel();
            reply(result, "error", "Local save was refused or could not start. No successful save is claimed.");
        }
        return true;
    }

    boolean onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != REQUEST_SAVE) return false;
        Pending current = pending;
        if (current == null) return true;
        if (resultCode != Activity.RESULT_OK || data == null || data.getData() == null || !"content".equals(data.getData().getScheme())) {
            cancel(); return true;
        }
        Uri destination = data.getData(); // Only the system picker supplies this; never JS.
        io.execute(() -> {
            String status = "saved", message = "Saved and read-back verified.";
            String digest = "";
            try {
                byte[] expected = current.digest.digest();
                try (InputStream input = new FileInputStream(current.file);
                     OutputStream output = activity.getContentResolver().openOutputStream(destination, "wt")) {
                    if (output == null) throw new Exception();
                    byte[] buffer = new byte[32768]; int count;
                    while ((count = input.read(buffer)) != -1) {
                        if (current.canceled) throw new Exception();
                        output.write(buffer, 0, count);
                    }
                    output.flush();
                }
                MessageDigest actual = MessageDigest.getInstance("SHA-256"); long total = 0;
                try (InputStream input = activity.getContentResolver().openInputStream(destination)) {
                    if (input == null) throw new Exception();
                    byte[] buffer = new byte[32768]; int count;
                    while ((count = input.read(buffer)) != -1) {
                        if (current.canceled || (total += count) > MAX_BYTES) throw new Exception();
                        actual.update(buffer, 0, count);
                    }
                }
                if (total != current.expected || !MessageDigest.isEqual(expected, actual.digest())) throw new Exception();
                StringBuilder hex = new StringBuilder();
                for (byte value : expected) hex.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
                digest = hex.toString();
            } catch (Exception failure) {
                status = "error"; message = "Save/read-back verification failed. A partial file may exist; check the chosen destination before retrying.";
            }
            final String outcome = status, detail = message, sha256 = digest;
            activity.runOnUiThread(() -> {
                if (pending == current) {
                    pending = null;
                    try {
                        current.result.confirm(new JSONObject().put("status", outcome).put("message", detail)
                                .put("bytes", current.expected).put("sha256", sha256).toString());
                    } catch (Exception ignored) { /* No file contents or paths in logs. */ }
                }
                cleanup(current);
            });
        });
        return true;
    }

    void cancel() {
        Pending current = pending; pending = null;
        if (current == null) return;
        current.canceled = true;
        if (current.result != null) reply(current.result, "canceled", "Local save canceled; check any already-selected destination for a partial file.");
        cleanup(current);
    }

    private static void reply(JsPromptResult result, String status, String message) {
        try { result.confirm(new JSONObject().put("status", status).put("message", message).toString()); }
        catch (Exception ignored) { result.cancel(); }
    }

    private static void cleanup(Pending current) {
        try { if (current.output != null) current.output.close(); } catch (Exception ignored) { }
        if (current.file != null) current.file.delete();
    }

    void destroy() { cancel(); io.shutdown(); }
}
