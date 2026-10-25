/** Combined Riseup VPN × InviZible gateway configuration engine.
 *
 *  Clean-room rule core for the side project researched in
 *  docs/riseup-invizible-combined-gateway-research-2026-10-25.md.
 *  One Android VpnService front-end, three ways to stand it up:
 *
 *    vpn           Bitmask/LEAP-style provider tunnel (OpenVPN), DNS in-tunnel
 *    tor-dnscrypt  InviZible-style local routing into Tor + DNSCrypt
 *    combined      VPN tunnel first; DNSCrypt reached through the tunnel;
 *                  Tor as a per-app layer; I2P optional
 *
 *  buildGatewayConfig(input) -> { config, decisions, warnings }
 *  Every optimisation is a named decision with a rationale; conflicting
 *  inputs are resolved explicitly and echoed, never silently dropped.
 *  Pure functions only — the Android/Java core mirrors this contract.
 */

export const GATEWAY_MODES = ["vpn", "tor-dnscrypt", "combined"];
export const GATEWAY_PROFILE_VERSION = 1;

const DEFAULTS = {
  mode: "combined",
  provider: { name: "Riseup", apiUrl: "https://riseup.net", transport: "openvpn" },
  censorshipBridges: false,
  enableI2p: false,
  allowLan: false,
  appExceptions: [],
  dnscryptResolver: "cloudflare",
};

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function normaliseInput(input = {}) {
  if (!isPlainObject(input)) throw new TypeError("gateway input must be an object");
  const provider = { ...DEFAULTS.provider, ...(isPlainObject(input.provider) ? input.provider : {}) };
  return {
    mode: GATEWAY_MODES.includes(input.mode) ? input.mode : DEFAULTS.mode,
    provider,
    censorshipBridges: input.censorshipBridges === true,
    enableI2p: input.enableI2p === true,
    allowLan: input.allowLan === true,
    appExceptions: Array.isArray(input.appExceptions) ? [...new Set(input.appExceptions.map(String))].sort() : [],
    dnscryptResolver: typeof input.dnscryptResolver === "string" && input.dnscryptResolver ? input.dnscryptResolver : DEFAULTS.dnscryptResolver,
  };
}

/**
 * Build the unified profile. `decisions` records every optimisation the
 * engine applied (name, value, rationale); `warnings` records conflicts
 * it resolved against the caller's input.
 */
export function buildGatewayConfig(input = {}) {
  const opt = normaliseInput(input);
  const decisions = [];
  const warnings = [];
  const decide = (name, value, rationale) => decisions.push({ name, value, rationale });

  const useVpn = opt.mode === "vpn" || opt.mode === "combined";
  const useTor = opt.mode === "tor-dnscrypt" || opt.mode === "combined";
  const useDnscrypt = opt.mode !== "vpn";

  if (opt.mode === "tor-dnscrypt" && opt.censorshipBridges) {
    warnings.push("censorshipBridges set without a VPN tunnel: bridges apply to the provider transport and were ignored in tor-dnscrypt mode");
  }
  if (opt.enableI2p && opt.mode === "vpn") {
    warnings.push("enableI2p set in vpn mode: I2P needs the local anonymity stack and was ignored; use tor-dnscrypt or combined");
  }

  decide("killSwitch", true, "Always-on VPN with block-without-VPN: traffic must never fall back to the bare interface when the tunnel drops.");
  decide("blockIpv6", true, "No IPv6 routes are installed until the tunnel carries IPv6; an unrouted v6 stack is a silent leak.");
  decide("allowLan", opt.allowLan, opt.allowLan
    ? "Caller opted in to local-network access; recorded explicitly because it widens the leak surface."
    : "Local-network bypass is off (InviZible-style firewall posture); exceptions must be requested per app.");
  decide("tunMtu", 1400, "tun-mtu 1400 with mssfix 1360 avoids fragmentation/PMTU blackholes behind carrier NAT.");
  decide("dnsLeakProtection", true, "All DNS is forced through the encrypted path selected below; no system resolver fallback.");

  const dns = useDnscrypt
    ? {
        mode: "dnscrypt",
        resolver: opt.dnscryptResolver,
        listen: "127.0.0.1:53 (VpnService DNS)",
        viaTunnel: opt.mode === "combined",
        rationale: opt.mode === "combined"
          ? "DNSCrypt is reached through the VPN tunnel, so the local network sees neither plaintext DNS nor the resolver choice."
          : "DNSCrypt encrypts and authenticates DNS where no provider tunnel exists.",
      }
    : {
        mode: "provider",
        resolver: "provider-pushed",
        listen: "tunnel DNS",
        viaTunnel: true,
        rationale: "Provider DNS stays inside the OpenVPN tunnel (block-outside-dns semantics).",
      };
  decide("dnsMode", dns.mode, dns.rationale);

  const config = {
    profileVersion: GATEWAY_PROFILE_VERSION,
    mode: opt.mode,
    provider: useVpn ? opt.provider : null,
    vpnService: {
      alwaysOn: true,
      blockWithoutVpn: true,
      mtu: 1400,
      addresses: ["10.66.0.2/24"],
      routes: ["0.0.0.0/0"],
      dnsServers: useDnscrypt ? ["127.0.0.1"] : ["provider-pushed"],
      allowLan: opt.allowLan,
      appExceptions: opt.appExceptions,
    },
    openvpn: useVpn
      ? {
          transport: opt.provider.transport,
          bridges: opt.censorshipBridges ? "obfs4/snowflake (pluggable transports)" : "none",
          directives: [
            "client",
            "dev tun",
            "tun-mtu 1400",
            "mssfix 1360",
            "redirect-gateway def1 block-local",
            "block-ipv6",
            opt.censorshipBridges ? "# pluggable transport: obfs4/snowflake bridge lines are provider-supplied" : "# direct transport (no bridges)",
            "# remote and certificates are provider-supplied via the LEAP EIP service definition",
          ],
        }
      : null,
    tor: useTor
      ? {
          socks: "127.0.0.1:9050",
          transProxy: "127.0.0.1:9040",
          dnsPort: "127.0.0.1:9053",
          perAppLayer: opt.mode === "combined",
          rationale: opt.mode === "combined"
            ? "Tor is a per-app layer above the tunnel (exit choice per app), not the default route."
            : "Tor is the default route; the VpnService feeds its transproxy and DNS ports.",
        }
      : null,
    dnscrypt: useDnscrypt
      ? {
          resolver: opt.dnscryptResolver,
          requireDnssec: true,
          requireNoLog: true,
          requireNoFilter: false,
          viaTunnel: opt.mode === "combined",
        }
      : null,
    i2p: opt.enableI2p && opt.mode !== "vpn"
      ? { enabled: true, note: "Purple I2P daemon for .i2p (eepsites); off the default route." }
      : { enabled: false },
    decisions,
    warnings,
  };
  return { config, decisions, warnings };
}

export function renderOpenVpn(config) {
  if (!config.openvpn) return "# no OpenVPN profile in mode " + config.mode + "\n";
  return config.openvpn.directives.join("\n") + "\n";
}

export function renderTorrc(config) {
  if (!config.tor) return "# tor disabled in mode " + config.mode + "\n";
  const [socksHost, socksPort] = config.tor.socks.split(":");
  const [transHost, transPort] = config.tor.transProxy.split(":");
  const [dnsHost, dnsPort] = config.tor.dnsPort.split(":");
  return [
    `SocksPort ${socksHost}:${socksPort}`,
    `TransPort ${transHost}:${transPort}`,
    `DNSPort ${dnsHost}:${dnsPort}`,
    "AutomapHostsOnResolve 1",
    "VirtualAddrNetworkIPv4 10.192.0.0/10",
    "# generated by js/gateway-config.js — addresses are the local VpnService listeners",
    "",
  ].join("\n");
}

export function renderDnscryptToml(config) {
  if (!config.dnscrypt) return "# dnscrypt disabled in mode " + config.mode + "\n";
  return [
    `server_names = ['${config.dnscrypt.resolver}']`,
    "listen_addresses = ['127.0.0.1:53']",
    "require_dnssec = true",
    "require_nolog = true",
    "require_nofilter = false",
    config.dnscrypt.viaTunnel
      ? "# resolver is reached through the VPN tunnel (combined mode)"
      : "# resolver is reached directly; no provider tunnel in this mode",
    "",
  ].join("\n");
}
