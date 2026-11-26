package org.html5.putty;

import android.os.ParcelFileDescriptor;
import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.RejectedExecutionException;

/** One foreground-only child and two bounded IO workers. No transcript files. */
final class PtySession implements Closeable {
    interface Listener {
        void started();
        void output(char[] text, int count);
        void ended(int code, boolean startFailed);
    }
    private final Object lock = new Object();
    private final ThreadPoolExecutor writer = new ThreadPoolExecutor(1, 1, 0, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(16), runnable -> new Thread(runnable, "plink-input"));
    private final String executable, home;
    private final String[] arguments;
    private final Listener listener;
    private boolean closed;
    private int pid;
    private InputStream input;
    private OutputStream output;

    PtySession(String executable, String home, String[] arguments, Listener listener) {
        this.executable = executable;
        this.home = home;
        this.arguments = arguments.clone();
        this.listener = listener;
    }

    void start() { new Thread(this::read, "plink-session").start(); }

    private void read() {
        int child = 0;
        boolean failed = true;
        int exit = -1;
        try {
            synchronized (lock) { if (closed) return; }
            int[] handles = NativePty.spawn(executable, home, arguments);
            child = handles[1];
            try (ParcelFileDescriptor master = ParcelFileDescriptor.adoptFd(handles[0])) {
                synchronized (lock) {
                    if (closed) { NativePty.terminate(child); }
                    else {
                        pid = child;
                        input = new ParcelFileDescriptor.AutoCloseInputStream(ParcelFileDescriptor.dup(master.getFileDescriptor()));
                        output = new ParcelFileDescriptor.AutoCloseOutputStream(ParcelFileDescriptor.dup(master.getFileDescriptor()));
                    }
                }
            }
            synchronized (lock) { if (closed) return; }
            failed = false;
            listener.started();
            char[] buffer = new char[2048];
            try (InputStreamReader reader = new InputStreamReader(input, StandardCharsets.UTF_8)) {
                int count;
                while ((count = reader.read(buffer)) != -1) listener.output(buffer, count);
            } finally {
                Arrays.fill(buffer, '\0');
            }
        } catch (IOException | RuntimeException error) {
            // Deliberately no credentials, exception text, argv or transcript logging.
            // PTY EOF commonly appears as EIO on Unix; exit status below is authoritative.
        } finally {
            synchronized (lock) {
                closed = true;
                if (input != null) try { input.close(); } catch (IOException ignored) {}
                if (output != null) try { output.close(); } catch (IOException ignored) {}
                input = null; output = null;
                if (failed && child > 1) NativePty.terminate(child);
                pid = 0;
            }
            for (Runnable queued : writer.shutdownNow()) if (queued instanceof PendingWrite) ((PendingWrite)queued).wipe();
            if (child > 1) exit = NativePty.waitFor(child);
            listener.ended(exit, failed);
        }
    }

    private final class PendingWrite implements Runnable {
        private final byte[] bytes;
        PendingWrite(byte[] bytes) { this.bytes = bytes; }
        void wipe() { Arrays.fill(bytes, (byte)0); }
        public void run() {
            try {
                OutputStream stream;
                synchronized (lock) { if (closed || output == null) return; stream = output; }
                stream.write(bytes);
                stream.flush();
            } catch (IOException ignored) {
                close();
            } finally { wipe(); }
        }
    }

    boolean send(byte[] bytes) {
        synchronized (lock) { if (closed || output == null) { Arrays.fill(bytes, (byte)0); return false; } }
        PendingWrite pending = new PendingWrite(bytes);
        try { writer.execute(pending); return true; }
        catch (RejectedExecutionException full) { pending.wipe(); return false; }
    }

    public void close() {
        synchronized (lock) {
            closed = true;
            if (pid > 1) NativePty.terminate(pid);
            if (input != null) try { input.close(); } catch (IOException ignored) {}
            if (output != null) try { output.close(); } catch (IOException ignored) {}
        }
        for (Runnable queued : writer.shutdownNow()) if (queued instanceof PendingWrite) ((PendingWrite)queued).wipe();
    }
}
