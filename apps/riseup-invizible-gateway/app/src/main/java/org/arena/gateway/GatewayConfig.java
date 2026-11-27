package org.arena.gateway;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/** Dependency-free, offline PLAN ONLY core. Mirrored JS/Java parity is required in CI. */
public final class GatewayConfig {
    public static final int PROFILE_VERSION = 2;
    public static final String PLAN_WARNING = "PLAN ONLY: no tunnel engines, routing, DNS protection or kill switch are active in this scaffold.";
    public final String mode, provider, invizibleChannel, dnscryptResolver;
    public final boolean censorshipBridges, enableI2p, allowLan;
    public final List<String> appExceptions, warnings;
    private final Map<String, Object> plan;

    public GatewayConfig(String mode, boolean bridges, boolean i2p, boolean lan, String resolver) {
        this(mode, "proton-wireguard", "stable", bridges, i2p, lan, resolver, Collections.<String>emptyList());
    }

    public GatewayConfig(String mode, String provider, String channel, boolean bridges,
                         boolean i2p, boolean lan, String resolver, List<String> exceptions) {
        this.mode = choice(mode, "combined", "vpn", "tor-dnscrypt", "combined");
        this.provider = choice(provider, "proton-wireguard", "proton-wireguard", "bitmask", "wireguard");
        this.invizibleChannel = choice(channel, "stable", "stable", "beta");
        this.dnscryptResolver = resolver == null ? "cloudflare" : resolver;
        if (!this.dnscryptResolver.matches("[a-z0-9][a-z0-9_-]{0,63}")) throw new IllegalArgumentException("Invalid resolver catalog identifier.");
        if (exceptions == null || exceptions.size() > 32) throw new IllegalArgumentException("At most 32 package names.");
        for (String item : exceptions) if (item == null || item.length() > 200 || !item.matches("[a-zA-Z][a-zA-Z0-9_]*(?:\\.[a-zA-Z][a-zA-Z0-9_]*)+")) throw new IllegalArgumentException("Invalid package name.");
        this.appExceptions = Collections.unmodifiableList(new ArrayList<>(new TreeSet<>(exceptions)));
        this.censorshipBridges = bridges; this.enableI2p = i2p; this.allowLan = lan;
        boolean local = useTor(), vpn = useVpn();
        String transport = "bitmask".equals(this.provider) ? "openvpn" : "wireguard";
        List<String> notes = new ArrayList<>(); notes.add(PLAN_WARNING);
        if (local && "beta".equals(invizibleChannel)) notes.add("Beta is an alternative release channel, not an extra anonymity layer. Verify package ID, signing identity and release notes; never start two InviZible VPN services.");
        if (bridges) notes.add(vpn && "openvpn".equals(transport)
                ? "Bitmask obfuscation depends on the selected provider and transport. A bridge flag does not provision a working bridge."
                : "No automatic bridge conversion: Tor bridges are not WireGuard transports. Select supported obfuscation in the official client.");
        if (lan || !appExceptions.isEmpty()) notes.add("LAN access and excluded apps widen bypass risk; lockdown may instead block them. This plan does not enforce either behavior.");
        if (i2p) notes.add("I2P is a separate destination network, not an Internet-wide VPN. Keep .i2p lookups off public DNS; budget reseeding, peer traffic, battery and startup time.");
        warnings = Collections.unmodifiableList(notes);
        List<Map<String, Object>> decisions = Arrays.asList(
            map("name", "singleVpnOwner", "value", 1, "rationale", "Android has one active VPN service per user/profile. Provider choices are alternatives, not simultaneous apps."),
            map("name", "killSwitch", "value", "required-not-enforced", "rationale", "Always-on and block-without-VPN require OS/user configuration and device failure-path tests. Do not set this planner as always-on."),
            map("name", "ipv6", "value", "capture-or-block-before-connect", "rationale", "Omitting IPv6 routes alone is not leak protection. Capture ::/0 and carry or explicitly block unsupported IPv6 in a real engine."),
            map("name", "dns", "value", local ? "local-encrypted-resolver-plan" : "provider-dns-plan", "rationale", "DNS forwarding, bootstrap, .onion/.i2p separation and no-fallback policy need an implemented and tested packet path."),
            map("name", "mtu", "value", "engine-and-path-dependent", "rationale", "No universal MTU/MSS optimization is assumed. Measure the actual transport and mobile path.")
        );
        plan = map(
            "profileVersion", 2, "mode", this.mode,
            "readiness", map("status", "plan-only", "protectionActive", false, "enginesBundled", Collections.emptyList(), "tunEstablished", false),
            "provider", vpn ? map("id", this.provider, "transport", transport, "provisioning", "bitmask".equals(this.provider) ? "LEAP provider discovery and certificates required" : "proton-wireguard".equals(this.provider) ? "Owner-generated Proton WireGuard configuration required in a real client" : "Owner-managed WireGuard peer configuration required in a real client") : null,
            "invizible", local ? map("channel", invizibleChannel, "execution", "future embedded modules OR explicitly configured proxy-only companion; not a second VPN") : null,
            "vpnService", map("plannedOwner", "one-future-integrated-service", "maxActivePerProfile", 1, "consentRequested", false, "alwaysOnConfigured", false),
            "requirements", map("defaultRoutes", Arrays.asList("0.0.0.0/0", "::/0"), "unsupportedIpv6", "block", "fallback", "deny", "allowLan", lan, "appExceptions", appExceptions, "mtu", null),
            "openvpn", vpn && "openvpn".equals(transport) ? map("engine", "not-bundled", "obfuscationRequested", bridges) : null,
            "wireguard", vpn && "wireguard".equals(transport) ? map("engine", "not-bundled", "overTor", false, "privateKeyAccepted", false) : null,
            "tor", local ? map("socks", "127.0.0.1:9050", "scope", "combined".equals(this.mode) ? "selected TCP applications above provider tunnel" : "selected TCP applications via local routing engine", "udp", "block-except-explicit-internal-dns-handling", "egress", vpn ? "provider tunnel required" : "direct overlay transport") : null,
            "dnscrypt", local ? map("resolver", dnscryptResolver, "listen", "127.0.0.1:5354", "egress", vpn ? "provider tunnel required" : "direct encrypted DNS; resolver can observe queries", "enforced", false) : null,
            "i2p", map("enabled", i2p, "implementation", i2p ? "Purple I2P / i2pd (not bundled)" : null, "destinationScope", ".i2p only; no automatic clearnet outproxy", "egress", vpn ? "provider tunnel required" : "direct overlay transport"),
            "gates", Arrays.asList("pinned-engines-and-license-review", "single-tun-packet-router", "authenticated-provider-provisioning", "loop-and-dns-bootstrap-prevention", "ipv4-ipv6-dns-udp-leak-tests", "revocation-reboot-handover-lockdown-tests", "signed-build-and-owner-device-validation"),
            "decisions", decisions, "warnings", warnings
        );
    }
    private static String choice(String value, String fallback, String... values) {
        if (value == null) return fallback;
        if (!Arrays.asList(values).contains(value)) throw new IllegalArgumentException("Unsupported planner choice.");
        return value;
    }
    private static Map<String, Object> map(Object... pairs) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put((String) pairs[i], pairs[i + 1]);
        return result;
    }
    public boolean useVpn() { return !"tor-dnscrypt".equals(mode); }
    public boolean useTor() { return !"vpn".equals(mode); }
    public boolean useDnscrypt() { return useTor(); }
    public boolean i2pEnabled() { return enableI2p; }
    public String toJson() { return json(plan) + "\n"; }
    private static String join(String separator, List<String> items) {
        StringBuilder out = new StringBuilder();
        for (String item : items) { if (out.length() > 0) out.append(separator); out.append(item); }
        return out.toString();
    }
    private static String json(Object value) {
        if (value == null) return "null";
        if (value instanceof String) {
            StringBuilder out = new StringBuilder("\"");
            for (char c : ((String) value).toCharArray()) {
                if (c == '"' || c == '\\') out.append('\\').append(c);
                else if (c < 32) out.append(String.format(java.util.Locale.ROOT, "\\u%04x", (int) c));
                else out.append(c);
            }
            return out.append('"').toString();
        }
        if (value instanceof Map) {
            List<String> items = new ArrayList<>();
            for (Map.Entry<?, ?> e : ((Map<?, ?>) value).entrySet()) items.add(json(e.getKey()) + ":" + json(e.getValue()));
            return "{" + join(",", items) + "}";
        }
        if (value instanceof List) {
            List<String> items = new ArrayList<>(); for (Object v : (List<?>) value) items.add(json(v));
            return "[" + join(",", items) + "]";
        }
        if (value instanceof Boolean || value instanceof Integer) return value.toString();
        throw new IllegalArgumentException("Unsupported JSON value.");
    }
    public String openVpnDirectives() {
        String transport = useVpn() ? ("bitmask".equals(provider) ? "openvpn" : "wireguard") : "none";
        return "# PLAN ONLY — not an importable OpenVPN configuration.\n# Selected transport: " + transport + ".\n# Provider discovery, keys, certificate validation and a tunnel engine are not supplied.\n";
    }
    public String wireguardPlan() {
        return "# PLAN ONLY — no WireGuard configuration or private key is accepted/generated.\n# Provider: " + (useVpn() ? provider : "none") + ".\n# Use an owner-generated profile in a trusted real client; do not publish it.\n# Standard WireGuard UDP cannot be sent through Tor SOCKS as if it were TCP.\n";
    }
    public String torrc() {
        return "# PLAN ONLY — no Tor daemon is started.\n# SOCKS listener: " + (useTor() ? "127.0.0.1:9050" : "disabled") + ".\n# TCP-only application routing; never send ordinary BitTorrent through Tor.\n# Proxy-only mode does not capture other apps automatically.\n";
    }
    public String dnscryptToml() {
        return "# PLAN ONLY — no DNS forwarder is installed.\n# Resolver catalog identifier: " + (useDnscrypt() ? dnscryptResolver : "disabled") + ".\n# Local listener: " + (useDnscrypt() ? "127.0.0.1:5354" : "disabled") + ".\n# Bootstrap, routing and no-fallback enforcement remain unimplemented.\n";
    }
}
