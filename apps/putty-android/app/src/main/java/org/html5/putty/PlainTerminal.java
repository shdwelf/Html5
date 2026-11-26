package org.html5.putty;

/** Bounded line-oriented display, NOT a VT/xterm emulator.
 * Never executes OSC clipboard, links, terminal queries or escape sequences.
 * State survives read boundaries so split hostile sequences are still removed.
 */
public final class PlainTerminal {
    public static final int LIMIT = 32768;
    private final StringBuilder text = new StringBuilder();
    private int state; // 0=text, 1=ESC, 2=CSI, 3=control string, 4=string ESC

    public synchronized void append(char[] chars, int length) {
        for (int i = 0; i < length; i++) {
            char c = chars[i];
            if (state == 3) {
                if (c == 7 || c == 0x9c) state = 0;
                else if (c == 27) state = 4;
                continue;
            }
            if (state == 4) {
                state = (c == '\\' || c == 7 || c == 0x9c) ? 0 : c == 27 ? 4 : 3;
                continue;
            }
            if (state == 2) {
                if (c >= 0x40 && c <= 0x7e) state = 0;
                else if (c == 27) state = 1;
                continue;
            }
            if (state == 1) {
                if (c == '[') state = 2;
                else if (c == ']' || c == 'P' || c == '^' || c == '_') state = 3;
                else if (c >= 0x20 && c <= 0x2f) state = 1; // ESC intermediates
                else state = 0;
                continue;
            }
            if (c == 27) { state = 1; continue; }
            if (c == 0x9b) { state = 2; continue; }
            if (c == 0x90 || c == 0x9d || c == 0x9e || c == 0x9f) { state = 3; continue; }
            if (c == '\r') continue;
            if (c == '\n' || c == '\t' || (c >= 0x20 && !(c >= 0x7f && c <= 0x9f)
                    && Character.getType(c) != Character.FORMAT)) text.append(c);
        }
        if (text.length() > LIMIT) {
            int excess = text.length() - LIMIT;
            if (excess < text.length() && Character.isLowSurrogate(text.charAt(excess))) excess++;
            text.delete(0, excess);
        }
    }

    public synchronized void append(String value) {
        char[] chars = value.toCharArray();
        append(chars, chars.length);
    }

    public synchronized String snapshot() { return text.toString(); }
    public synchronized void clear() { text.setLength(0); state = 0; }
}
