package org.html5.putty;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Base64;
import java.util.regex.Pattern;

/** Deliberately small SSH-only configuration; never accepts arbitrary options. */
public final class SessionConfig {
    private static final Pattern LABEL = Pattern.compile("[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?");
    private static final Pattern USER = Pattern.compile("[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}");
    private static final Pattern PIN = Pattern.compile("SHA256:[A-Za-z0-9+/]{43}=?");
    public final String host, username, hostKey;
    public final int port;

    public SessionConfig(String host, String port, String username, String pin) {
        this.host = validateHost(host == null ? "" : host.trim());
        this.username = username == null ? "" : username.trim();
        if (!USER.matcher(this.username).matches())
            throw new IllegalArgumentException("Enter a username (1–64 ASCII letters, numbers, underscore, dot or hyphen; no leading hyphen).");
        String number = port == null ? "" : port.trim();
        if (!number.matches("[0-9]{1,5}")) throw new IllegalArgumentException("Port must be 1–65535.");
        this.port = Integer.parseInt(number);
        if (this.port < 1 || this.port > 65535) throw new IllegalArgumentException("Port must be 1–65535.");
        String fingerprint = pin == null ? "" : pin.trim();
        if (!PIN.matcher(fingerprint).matches()) throw new IllegalArgumentException("A complete SHA256: server host-key fingerprint is required. Obtain it from the administrator over a trusted channel.");
        byte[] decoded = Base64.getDecoder().decode(fingerprint.substring(7));
        String canonical = "SHA256:" + Base64.getEncoder().withoutPadding().encodeToString(decoded);
        if (decoded.length != 32 || !canonical.equals(fingerprint.replaceFirst("=$", "")))
            throw new IllegalArgumentException("The SHA-256 host-key fingerprint is not canonical.");
        this.hostKey = canonical;
    }

    private static String validateHost(String input) {
        String host = input;
        if (host.startsWith("[") && host.endsWith("]")) host = host.substring(1, host.length() - 1);
        if (host.isEmpty() || host.length() > 253) throw new IllegalArgumentException("Enter a hostname or IP address, without a URL or username.");
        if (host.indexOf(':') >= 0) {
            if (!host.matches("[0-9A-Fa-f:.]+")) throw new IllegalArgumentException("Invalid IPv6 address.");
            try {
                new URI("ssh://[" + host + "]"); // Syntax check only: no DNS request.
                return host;
            } catch (URISyntaxException e) {
                throw new IllegalArgumentException("Invalid IPv6 address.");
            }
        }
        for (String label : host.split("\\.", -1)) {
            if (!LABEL.matcher(label).matches()) throw new IllegalArgumentException("Use a DNS hostname or IP address, not a URL, command or SSH option.");
        }
        return host;
    }

    public String[] arguments() {
        return new String[] {"-ssh", "-2", "-t", "-noagent", "-a", "-x", "-noshare",
                "-P", Integer.toString(port), "-l", username, "-hostkey", hostKey, host};
    }
}
