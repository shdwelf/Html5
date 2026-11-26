package org.html5.putty;

import java.io.IOException;

/** Internal bridge: never exposed to intents, a browser, or another app. */
final class NativePty {
    static { System.loadLibrary("puttypty"); }
    private NativePty() {}
    static native int[] spawn(String executable, String home, String[] arguments) throws IOException;
    static native int waitFor(int pid);
    static native void terminate(int pid);
}
