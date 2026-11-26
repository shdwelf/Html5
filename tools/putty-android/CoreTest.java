package org.html5.putty;

import java.util.Arrays;

/** Dependency-free tests, run by tools/putty-android/test-core.sh. */
public final class CoreTest {
    private static final String PIN = "SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    private static int tests;
    private static void check(boolean value, String name) {
        if (!value) throw new AssertionError(name);
        System.out.println("ok " + (++tests) + " - " + name);
    }
    private static void reject(String host, String port, String user, String pin, String name) {
        try { new SessionConfig(host, port, user, pin); throw new AssertionError("Accepted: " + name); }
        catch (IllegalArgumentException expected) { check(true, name); }
    }
    private static PlainTerminal render(String... chunks) {
        PlainTerminal terminal = new PlainTerminal();
        for (String chunk : chunks) terminal.append(chunk);
        return terminal;
    }
    public static void main(String[] ignored) {
        System.out.println("TAP version 13");
        SessionConfig sdf = new SessionConfig("tty.sdf.org", "22", "testuser", PIN);
        check(sdf.host.equals("tty.sdf.org") && sdf.port == 22 && sdf.hostKey.equals(PIN), "SDF parameters parsed without DNS or login");
        check(new SessionConfig("[2001:db8::1]", "65535", "_test-user.1", PIN + "=").host.equals("2001:db8::1"), "IPv6 and padded canonical SHA256 accepted");
        check(new SessionConfig("127.0.0.1", "00022", "new", PIN).port == 22, "Explicit local synthetic server parameters accepted");
        String[] args = sdf.arguments();
        check(Arrays.equals(args, new String[]{"-ssh","-2","-t","-noagent","-a","-x","-noshare","-P","22","-l","testuser","-hostkey",PIN,"tty.sdf.org"}), "Only SSH2, exact pin, disabled agent/X11/sharing and explicit destination flags");
        args[0] = "-telnet";
        check(sdf.arguments()[0].equals("-ssh"), "Argument copies cannot mutate configuration");
        for (String host : new String[]{"", "-proxycmd", "user@host", "https://tty.sdf.org", "host;id", "host\nother", "a..b", "a_b", "host.", "[:::]", "::gg", "[::1%wlan0]", "a".repeat(64)+".net", "a.".repeat(127)+"a"})
            reject(host, "22", "user", PIN, "Reject malformed/injected host: " + host.replace("\n", "<LF>"));
        for (String user : new String[]{"", "-l", "a b", "a@b", "a\nb", "a\u0000b", "a".repeat(65)})
            reject("host", "22", user, PIN, "Reject malformed username " + tests);
        for (String port : new String[]{"", "0", "65536", "-1", "22;id", "22.0", " 2 2 ", "100000"})
            reject("host", port, "user", PIN, "Reject malformed port " + tests);
        for (String pin : new String[]{"", "*", "SHA256:*", "MD5:aa:bb", "SHA256:"+"A".repeat(42), "SHA256:"+"A".repeat(44), PIN+"==", PIN+";other", "SHA256:"+"A".repeat(42)+"B", PIN+"\n-hostkey *"})
            reject("host", "22", "user", pin, "Reject missing, wildcard, noncanonical or injected host key " + tests);
        check(render("hello\r\nworld\t✓").snapshot().equals("hello\nworld\t✓"), "Plain UTF-8 line display");
        check(render("a\u001b[", "31mb\u001b[0m").snapshot().equals("ab"), "CSI removed across read boundaries");
        check(render("before\u001b]52;c;stolen", "\u0007after").snapshot().equals("beforeafter"), "OSC clipboard instruction removed");
        check(render("before\u001b]8;;https://evil", "\u001b", "\\label\u001b]8;;\u001b\\after").snapshot().equals("beforelabelafter"), "OSC hyperlinks removed including split ST");
        check(render("a\u001bPunknown payload\u001b\\b\u009d8;;url\u009cc").snapshot().equals("abc"), "DCS and C1 strings removed");
        check(render("a\u202Eb\u2066c\u0000\u007f\u0007").snapshot().equals("abc"), "Bidi controls, NUL, DEL and bell not rendered");
        check(render("x".repeat(PlainTerminal.LIMIT*3)).snapshot().length() == PlainTerminal.LIMIT, "Output bounded to 32768 UTF-16 code units");
        PlainTerminal reset = render("secret\u001b]unterminated");
        reset.clear(); reset.append("safe");
        check(reset.snapshot().equals("safe"), "Clear removes transcript AND escape-parser state");
        for (String sequence : new String[]{"A\u001b[1;31mB\u001b[0mC", "A\u001b]52;c;hidden\u001b\\B", "A\u001bPblob\u001b\\B"}) {
            String expected = render(sequence).snapshot();
            for (int split = 0; split <= sequence.length(); split++)
                check(render(sequence.substring(0,split), sequence.substring(split)).snapshot().equals(expected), "Escape split-boundary consistency " + tests);
        }
        System.out.println("1.." + tests);
    }
}
