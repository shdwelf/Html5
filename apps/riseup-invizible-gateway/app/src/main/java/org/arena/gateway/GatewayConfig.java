package org.arena.gateway;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Combined Riseup VPN x InviZible gateway configuration core
 * (clean-room; mirrors js/gateway-config.js). Dependency-free so the
 * same source compiles into the CLI JAR (tools/gateway-config) and
 * the Android app. Research and limits:
 * docs/riseup-invizible-combined-gateway-research-2026-10-25.md
 *
 * Modes: vpn (Bitmask/LEAP provider tunnel), tor-dnscrypt
 * (InviZible-style local Tor+DNSCrypt routing), combined (tunnel
 * first, DNSCrypt through it, Tor per-app). Optimisations are
 * recorded as named decisions; conflicts resolve loudly in warnings.
 */
public final class GatewayConfig {

    public static final int PROFILE_VERSION = 1;

    public final String mode;
    public final boolean censorshipBridges;
    public final boolean enableI2p;
    public final boolean allowLan;
    public final String dnscryptResolver;
    public final List<String> warnings = new ArrayList<>();
    public final List<String> decisions = new ArrayList<>();

    public GatewayConfig(String mode, boolean censorshipBridges, boolean enableI2p,
                         boolean allowLan, String dnscryptResolver) {
        this.mode = ("vpn".equals(mode) || "tor-dnscrypt".equals(mode)) ? mode : "combined";
        this.censorshipBridges = censorshipBridges;
        this.enableI2p = enableI2p;
        this.allowLan = allowLan;
        this.dnscryptResolver = (dnscryptResolver == null || dnscryptResolver.isEmpty())
                ? "cloudflare" : dnscryptResolver;
        if ("tor-dnscrypt".equals(this.mode) && censorshipBridges) {
            warnings.add("censorshipBridges set without a VPN tunnel: bridges apply to the provider transport and were ignored in tor-dnscrypt mode");
        }
        if ("vpn".equals(this.mode) && enableI2p) {
            warnings.add("enableI2p set in vpn mode: I2P needs the local anonymity stack and was ignored; use tor-dnscrypt or combined");
        }
        decide("killSwitch=true", "Always-on VPN with block-without-VPN: no fallback to the bare interface on tunnel drop.");
        decide("blockIpv6=true", "No IPv6 routes until the tunnel carries IPv6; an unrouted v6 stack leaks silently.");
        decide("allowLan=" + allowLan, allowLan
                ? "Caller opted in to LAN access; recorded because it widens the leak surface."
                : "LAN bypass off (InviZible-style firewall posture); exceptions are per-app and explicit.");
        decide("tunMtu=1400", "tun-mtu 1400 / mssfix 1360 avoids fragmentation blackholes behind carrier NAT.");
        decide("dnsLeakProtection=true", "All DNS forced through the encrypted path; no system resolver fallback.");
        decide("dnsMode=" + dnsMode(), dnsRationale());
    }

    public boolean useVpn() {
        return "vpn".equals(mode) || "combined".equals(mode);
    }

    public boolean useTor() {
        return !"vpn".equals(mode);
    }

    public boolean useDnscrypt() {
        return !"vpn".equals(mode);
    }

    public boolean i2pEnabled() {
        return enableI2p && !"vpn".equals(mode);
    }

    public String dnsMode() {
        return useDnscrypt() ? "dnscrypt" : "provider";
    }

    private String dnsRationale() {
        if (!useDnscrypt()) {
            return "Provider DNS stays inside the OpenVPN tunnel (block-outside-dns semantics).";
        }
        return "combined".equals(mode)
                ? "DNSCrypt is reached through the VPN tunnel; the local network sees neither plaintext DNS nor the resolver choice."
                : "DNSCrypt encrypts and authenticates DNS where no provider tunnel exists.";
    }

    private void decide(String name, String rationale) {
        decisions.add(name + " — " + rationale);
    }

    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"profileVersion\": ").append(PROFILE_VERSION).append(",\n");
        sb.append("  \"mode\": \"").append(mode).append("\",\n");
        sb.append("  \"provider\": ").append(useVpn()
                ? "{\"name\": \"Riseup\", \"apiUrl\": \"https://riseup.net\", \"transport\": \"openvpn\"}" : "null").append(",\n");
        sb.append("  \"vpnService\": {\"alwaysOn\": true, \"blockWithoutVpn\": true, \"mtu\": 1400,")
                .append(" \"addresses\": [\"10.66.0.2/24\"], \"routes\": [\"0.0.0.0/0\"],")
                .append(" \"dnsServers\": [\"").append(useDnscrypt() ? "127.0.0.1" : "provider-pushed").append("\"],")
                .append(" \"allowLan\": ").append(allowLan).append("},\n");
        sb.append("  \"tor\": ").append(useTor()
                ? "{\"socks\": \"127.0.0.1:9050\", \"transProxy\": \"127.0.0.1:9040\", \"dnsPort\": \"127.0.0.1:9053\", \"perAppLayer\": " + "combined".equals(mode) + "}"
                : "null").append(",\n");
        sb.append("  \"dnscrypt\": ").append(useDnscrypt()
                ? "{\"resolver\": \"" + dnscryptResolver + "\", \"requireDnssec\": true, \"viaTunnel\": " + "combined".equals(mode) + "}"
                : "null").append(",\n");
        sb.append("  \"i2p\": {\"enabled\": ").append(i2pEnabled()).append("},\n");
        sb.append("  \"warnings\": [");
        for (int i = 0; i < warnings.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("\"").append(warnings.get(i).replace("\"", "'")).append("\"");
        }
        sb.append("]\n}\n");
        return sb.toString();
    }

    public String openVpnDirectives() {
        if (!useVpn()) {
            return "# no OpenVPN profile in mode " + mode + "\n";
        }
        List<String> lines = new ArrayList<>();
        lines.add("client");
        lines.add("dev tun");
        lines.add("tun-mtu 1400");
        lines.add("mssfix 1360");
        lines.add("redirect-gateway def1 block-local");
        lines.add("block-ipv6");
        lines.add(censorshipBridges
                ? "# pluggable transport: obfs4/snowflake bridge lines are provider-supplied"
                : "# direct transport (no bridges)");
        lines.add("# remote and certificates are provider-supplied via the LEAP EIP service definition");
        return String.join("\n", lines) + "\n";
    }

    public String torrc() {
        if (!useTor()) {
            return "# tor disabled in mode " + mode + "\n";
        }
        return "SocksPort 127.0.0.1:9050\n"
                + "TransPort 127.0.0.1:9040\n"
                + "DNSPort 127.0.0.1:9053\n"
                + "AutomapHostsOnResolve 1\n"
                + "VirtualAddrNetworkIPv4 10.192.0.0/10\n"
                + "# generated by GatewayConfig — local VpnService listeners\n";
    }

    public String dnscryptToml() {
        if (!useDnscrypt()) {
            return "# dnscrypt disabled in mode " + mode + "\n";
        }
        return String.format(Locale.ROOT,
                "server_names = ['%s']\nlisten_addresses = ['127.0.0.1:53']\nrequire_dnssec = true\nrequire_nolog = true\nrequire_nofilter = false\n%s\n",
                dnscryptResolver,
                "combined".equals(mode)
                        ? "# resolver is reached through the VPN tunnel (combined mode)"
                        : "# resolver is reached directly; no provider tunnel in this mode");
    }
}
