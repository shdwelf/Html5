package org.dyne.zshaolin.modern;

import android.content.Context;
import android.os.Build;
import android.system.Os;
import android.system.OsConstants;
import android.system.StructStat;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.json.*;

/** Offline, private-prefix installation. Never requests root or fetches code. */
public final class Toolbox {
    public static final String FILES = "/data/data/com.termux/files";
    public static final String PREFIX = FILES + "/usr";
    public static final String HOME = FILES + "/home";
    private static final int MAX_LOG = 1024 * 1024;
    private Toolbox() {}
    public interface Progress { void update(String text); }

    public static JSONObject receipt(Context context) throws Exception {
        try (InputStream in = context.getAssets().open("toolbox.json")) {
            return new JSONObject(new String(readBounded(in, MAX_LOG), StandardCharsets.UTF_8));
        }
    }

    static byte[] readBounded(InputStream in, int max) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        byte[] buffer = new byte[32768]; int n;
        while ((n = in.read(buffer)) != -1) {
            if ((long) bytes.size() + n > max) throw new IOException("Input exceeds bound");
            bytes.write(buffer, 0, n);
        }
        return bytes.toByteArray();
    }

    static String hex(byte[] bytes) {
        StringBuilder out = new StringBuilder();
        for (byte b : bytes) out.append(String.format(Locale.ROOT, "%02x", b & 255));
        return out.toString();
    }

    public static Map<String, String> environment() {
        Map<String, String> env = new HashMap<>();
        env.put("HOME", HOME); env.put("PREFIX", PREFIX);
        env.put("PATH", PREFIX + "/bin:/system/bin");
        env.put("LD_LIBRARY_PATH", PREFIX + "/lib");
        if (new File(PREFIX + "/lib/libtermux-exec.so").isFile())
            env.put("LD_PRELOAD", PREFIX + "/lib/libtermux-exec.so");
        env.put("TMPDIR", PREFIX + "/tmp"); env.put("LANG", "C.UTF-8");
        env.put("TERM", "xterm-256color"); env.put("COLORTERM", "truecolor");
        env.put("ANDROID_ROOT", "/system"); env.put("ANDROID_DATA", "/data");
        env.put("TERMUX__ROOTFS", FILES); env.put("TERMUX__PREFIX", PREFIX);
        env.put("TERMUX_APP__PACKAGE_NAME", "com.termux");
        env.put("TERMUX_APP__DATA_DIR", "/data/data/com.termux");
        env.put("TERMUX_APP__APP_VERSION_NAME", "2.0.0-review");
        env.put("TERMUX_APK_RELEASE", "UNOFFICIAL_ZSHAOLIN");
        return env;
    }

    public static String[] environmentArray() {
        ArrayList<String> result = new ArrayList<>();
        for (Map.Entry<String, String> entry : environment().entrySet())
            result.add(entry.getKey() + "=" + entry.getValue());
        return result.toArray(new String[0]);
    }

    /** Normalize benign ./ components, but never resolve away parent traversal. */
    static String archiveName(String name) throws IOException {
        if (name.isEmpty() || name.startsWith("/") || name.contains("\\") || name.indexOf('\0') >= 0)
            throw new IOException("Unsafe archive path");
        ArrayList<String> parts = new ArrayList<>();
        for (String part : name.split("/")) {
            if (part.equals("..")) throw new IOException("Unsafe parent path component");
            if (!part.isEmpty() && !part.equals(".")) parts.add(part);
        }
        if (parts.isEmpty()) throw new IOException("Empty archive path after normalization");
        return String.join("/", parts);
    }

    /** Reject traversal before touching the filesystem; links are added last. */
    static File inside(File root, String name) throws IOException {
        File target = new File(root, archiveName(name));
        if (!target.getCanonicalPath().startsWith(root.getCanonicalPath() + "/"))
            throw new IOException("Archive escapes private staging directory");
        return target;
    }

    static void mkdir(File dir) throws Exception {
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("Could not create private directory");
        if (java.nio.file.Files.isSymbolicLink(dir.toPath()))
            throw new IOException("Refusing a symlinked private directory");
        Os.chmod(dir.getAbsolutePath(), 0700);
    }

    static void write(File target, byte[] bytes, int mode) throws Exception {
        try (FileOutputStream out = new FileOutputStream(target)) { out.write(bytes); out.getFD().sync(); }
        Os.chmod(target.getAbsolutePath(), mode);
    }

    static void asset(Context ctx, String name, File dest, String sha, long expected) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256"); long total = 0;
        try (InputStream in = ctx.getAssets().open(name); FileOutputStream out = new FileOutputStream(dest)) {
            byte[] b = new byte[65536]; int n;
            while ((n = in.read(b)) != -1) {
                total += n;
                if (total > expected) throw new IOException("Asset exceeds expected size");
                md.update(b, 0, n); out.write(b, 0, n);
            }
            out.getFD().sync();
        }
        if (total != expected || !hex(md.digest()).equals(sha)) {
            if (!dest.delete()) throw new IOException("Could not remove invalid asset");
            throw new IOException("Packaged asset digest mismatch");
        }
        Os.chmod(dest.getAbsolutePath(), 0600);
    }

    private static void bootstrap(Context ctx, JSONObject spec, File stage) throws Exception {
        if (stage.exists()) throw new IOException("Staging directory already exists; previous installation needs explicit review");
        mkdir(stage);
        ArrayList<String[]> links = new ArrayList<>();
        HashSet<String> seen = new HashSet<>(), linkNames = new HashSet<>();
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        long expanded = 0; int entries = 0;
        try (InputStream raw = ctx.getAssets().open("bootstrap.zip");
             java.security.DigestInputStream checked = new java.security.DigestInputStream(raw, sha);
             ZipInputStream zip = new ZipInputStream(checked)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String name = archiveName(entry.getName());
                if (++entries > 100000 || !seen.add(name)) throw new IOException("Invalid bootstrap inventory");
                if (name.equals("SYMLINKS.txt")) {
                    String list = new String(readBounded(zip, 1024 * 1024), StandardCharsets.UTF_8);
                    for (String line : list.split("\n")) {
                        if (line.isEmpty()) continue;
                        String[] pair = line.split("←", -1);
                        if (pair.length != 2) throw new IOException("Invalid bootstrap symlink");
                        String linkName = archiveName(pair[1]);
                        if (!linkNames.add(linkName)) throw new IOException("Duplicate normalized bootstrap symlink");
                        File link = inside(stage, linkName);
                        String target = pair[0];
                        // Relative links may traverse within the prefix, not outside it.
                        File resolved = target.startsWith("/") ? new File(target) : new File(link.getParentFile(), target);
                        String canonical = resolved.getCanonicalPath();
                        boolean allowed = (target.startsWith("/") &&
                            canonical.startsWith(new File(PREFIX).getCanonicalPath() + "/")) ||
                            canonical.startsWith(stage.getCanonicalPath() + "/") ||
                            target.equals("/system/bin/linker") || target.equals("/system/bin/linker64");
                        if (!allowed) throw new IOException("Bootstrap symlink escapes allowed prefix");
                        links.add(new String[]{target, linkName});
                    }
                    continue;
                }
                File target = inside(stage, name);
                if (entry.isDirectory()) { mkdir(target); continue; }
                mkdir(target.getParentFile());
                try (FileOutputStream out = new FileOutputStream(target)) {
                    byte[] b = new byte[65536]; int n;
                    while ((n = zip.read(b)) != -1) {
                        expanded += n;
                        if (expanded > 2L * 1024 * 1024 * 1024) throw new IOException("Bootstrap expanded-size bound exceeded");
                        out.write(b, 0, n);
                    }
                }
                // Preserve executable semantics, including apt methods and scripts.
                Os.chmod(target.getAbsolutePath(), 0700);
            }
            // ZipInputStream stops at the central directory. Hash the rest of the
            // exact asset as well; do not compare a partial-ZIP digest.
            byte[] tail = new byte[65536]; while (checked.read(tail) != -1) { /* hash */ }
        }
        // ZipInputStream buffers a small tail before exposing the central directory;
        // compute the definitive whole-asset digest independently, before any exec.
        MessageDigest full = MessageDigest.getInstance("SHA-256");
        try (InputStream in = ctx.getAssets().open("bootstrap.zip")) {
            byte[] b = new byte[65536]; int n; while ((n = in.read(b)) != -1) full.update(b, 0, n);
        }
        if (!hex(full.digest()).equals(spec.getString("bootstrapSha256")) || links.isEmpty())
            throw new IOException("Bootstrap authenticity/inventory check failed");
        for (String[] pair : links) {
            File link = inside(stage, pair[1]); mkdir(link.getParentFile());
            if (link.exists()) throw new IOException("Symlink collides with a regular bootstrap file");
            Os.symlink(pair[0], link.getAbsolutePath());
        }
    }

    public static String run(List<String> command, int seconds) throws Exception {
        ProcessBuilder builder = new ProcessBuilder(command).directory(new File(HOME)).redirectErrorStream(true);
        builder.environment().clear(); builder.environment().putAll(environment());
        Process process = builder.start(); ByteArrayOutputStream output = new ByteArrayOutputStream();
        Thread reader = new Thread(() -> {
            try (InputStream in = process.getInputStream()) {
                byte[] b = new byte[32768]; int n;
                while ((n = in.read(b)) != -1) {
                    int keep = Math.min(n, Math.max(0, MAX_LOG - output.size()));
                    if (keep > 0) output.write(b, 0, keep);
                }
            } catch (IOException ignored) { /* private child ended */ }
        }, "bounded-private-install-output");
        reader.start();
        if (!process.waitFor(seconds, TimeUnit.SECONDS)) {
            process.destroyForcibly(); reader.join(5000); throw new IOException("Private toolbox command timed out");
        }
        reader.join(5000);
        if (reader.isAlive()) throw new IOException("Private command output did not close");
        String text = output.toString("UTF-8");
        if (process.exitValue() != 0) {
            // Only a bounded private log, never logcat or an external report.
            write(new File(HOME, ".zshaolin-install-error.log"), text.getBytes(StandardCharsets.UTF_8), 0600);
            throw new IOException("Toolbox command failed (exit " + process.exitValue() + "); bounded details are in app-private .zshaolin-install-error.log");
        }
        return text;
    }

    static boolean samePrivateDirectory(File actual, File expected) throws Exception {
        // Android can expose /data/user/0 and /data/data as bind-mount aliases,
        // not symlinks. Canonical path strings need not match. Require the same
        // owned directory inode/device instead; never accept a secondary prefix.
        StructStat a = Os.stat(actual.getAbsolutePath());
        StructStat b = Os.stat(expected.getAbsolutePath());
        int uid = android.os.Process.myUid();
        return OsConstants.S_ISDIR(a.st_mode) && OsConstants.S_ISDIR(b.st_mode) &&
            a.st_uid == uid && b.st_uid == uid && a.st_dev == b.st_dev && a.st_ino == b.st_ino;
    }

    public static synchronized void install(Context ctx, Progress progress) throws Exception {
        if (!ctx.getPackageName().equals("com.termux"))
            throw new IOException("Install with the approved package-compatible ID");
        if (android.os.Process.myUid() / 100000 != 0)
            throw new IOException("Install on the primary Android user, not a work/secondary profile");
        if (!samePrivateDirectory(ctx.getFilesDir(), new File(FILES)))
            throw new IOException("Private files directory does not match the owned native-toolbox prefix");
        JSONObject spec = receipt(ctx);
        if (!Arrays.asList(Build.SUPPORTED_ABIS).contains(spec.getString("abi")))
            throw new IOException("This APK is for a different CPU ABI");
        File done = new File(ctx.getFilesDir(), ".zshaolin-complete");
        if (done.isFile()) return;
        mkdir(new File(HOME));
        File prefix = new File(PREFIX);
        if (!prefix.exists()) {
            progress.update("Verifying and extracting pinned offline bootstrap…");
            // Use the same mount namespace spelling for both sides of rename.
            // Bind-mount aliases may stat identically but cross-alias rename can
            // still fail with EXDEV. The owned primary-prefix guard ran above.
            File stage = new File(FILES, ".zshaolin-staging");
            bootstrap(ctx, spec, stage);
            Os.rename(stage.getAbsolutePath(), prefix.getAbsolutePath());
            write(new File(prefix, ".zshaolin-owned"), new byte[]{1}, 0600);
        } else if (!new File(prefix, ".zshaolin-owned").isFile()) {
            throw new IOException("Refusing to overwrite an existing unrecognized toolbox");
        }
        File cache = new File(ctx.getCacheDir(), "zshaolin-debs"); mkdir(cache);
        JSONArray list = spec.getJSONArray("packages");
        ArrayList<String> args = new ArrayList<>(Arrays.asList(PREFIX + "/bin/dpkg", "--force-confold", "--install"));
        for (int i = 0; i < list.length(); i++) {
            JSONObject pkg = list.getJSONObject(i);
            String name = pkg.getString("asset");
            if (!name.matches("packages/[A-Za-z0-9%+_.:~=-]+\\.deb")) throw new IOException("Invalid package asset name");
            File dest = new File(cache, name.substring("packages/".length()));
            asset(ctx, name, dest, pkg.getString("sha256"), pkg.getLong("bytes"));
            args.add(dest.getAbsolutePath());
        }
        progress.update("Configuring the complete toolbox offline (including Emacs). No root or servers…");
        run(args, 900);
        // Verify dpkg's actual installed state and exact packaged versions.
        String installed = run(Arrays.asList(PREFIX + "/bin/dpkg-query", "-W", "-f=${Package}\t${Version}\t${Status}\n"), 60);
        Set<String> rows = new HashSet<>(Arrays.asList(installed.split("\n")));
        for (int i = 0; i < list.length(); i++) {
            JSONObject pkg = list.getJSONObject(i);
            String expected = pkg.getString("package") + "\t" + pkg.getString("version") + "\tinstall ok installed";
            if (!rows.contains(expected)) throw new IOException("A packaged dependency is not fully configured");
        }
        JSONArray commands = spec.getJSONArray("requiredCommands");
        for (int i = 0; i < commands.length(); i++)
            if (!new File(PREFIX + "/bin/" + commands.getString(i)).canExecute())
                throw new IOException("A required full-toolbox command is missing");
        for (String name : new String[]{"z-ssh", "sshd_config", "COPYING", "NOTICE", "LICENSE-APACHE-2.0", "TERMUX-LICENSE.md"}) {
            String relative;
            if (name.equals("z-ssh")) relative = "bin/z-ssh";
            else if (name.equals("sshd_config")) relative = "etc/ssh/sshd_config";
            else if (name.equals("COPYING")) relative = "share/ZSHAOLIN-COPYING";
            else relative = "share/zshaolin/" + name;
            File dest = new File(PREFIX, relative);
            mkdir(dest.getParentFile());
            try (InputStream in = ctx.getAssets().open(name)) { write(dest, readBounded(in, MAX_LOG), name.equals("z-ssh") ? 0700 : 0600); }
        }
        File rc = new File(HOME, ".zshrc");
        if (!rc.exists()) try (InputStream in = ctx.getAssets().open("zshrc")) { write(rc, readBounded(in, MAX_LOG), 0600); }
        for (File deb : Objects.requireNonNull(cache.listFiles())) if (!deb.delete()) throw new IOException("Could not clean private install cache");
        write(done, spec.getString("sourceCommit").getBytes(StandardCharsets.UTF_8), 0600);
        progress.update("Complete offline toolbox ready. Only Zsh starts.");
    }
}
