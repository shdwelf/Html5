/** Original, offline architecture planner. NEVER a tunnel engine or usable VPN configuration. */
export const GATEWAY_MODES = Object.freeze(['vpn', 'tor-dnscrypt', 'combined']);
export const GATEWAY_PROVIDERS = Object.freeze(['proton-wireguard', 'bitmask', 'wireguard']);
export const GATEWAY_PROFILE_VERSION = 2;
export const PLAN_WARNING = 'PLAN ONLY: no tunnel engines, routing, DNS protection or kill switch are active in this scaffold.';
const plain = (v) => v !== null && typeof v === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(v));
function choice(value, values, fallback, label) {
  if (value === undefined) return fallback;
  if (!values.includes(value)) throw new TypeError(`Unsupported ${label}.`);
  return value;
}
export function normaliseInput(input = {}) {
  if (!plain(input)) throw new TypeError('Gateway input must be a plain object.');
  const allowed = ['mode', 'provider', 'invizibleChannel', 'enableI2p', 'allowLan', 'appExceptions', 'dnscryptResolver', 'censorshipBridges'];
  if (Object.keys(input).some((k) => !allowed.includes(k))) throw new TypeError('Unknown input; never paste credentials or WireGuard configurations into this planner.');
  for (const key of ['enableI2p', 'allowLan', 'censorshipBridges']) if (input[key] !== undefined && typeof input[key] !== 'boolean') throw new TypeError(`${key} must be boolean.`);
  const list = input.appExceptions === undefined ? [] : input.appExceptions;
  if (!Array.isArray(list) || list.length > 32 || Array.from(list).some((v) => typeof v !== 'string' || v.length > 200 || !/^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)+$/u.test(v))) throw new TypeError('Use at most 32 Android package names, without wildcards.');
  const resolver = input.dnscryptResolver ?? 'cloudflare';
  if (typeof resolver !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(resolver)) throw new TypeError('Resolver must be a 1–64 character catalog identifier, not a URL or configuration line.');
  return {
    mode: choice(input.mode, GATEWAY_MODES, 'combined', 'mode'),
    provider: choice(input.provider, GATEWAY_PROVIDERS, 'proton-wireguard', 'provider'),
    invizibleChannel: choice(input.invizibleChannel, ['stable', 'beta'], 'stable', 'InviZible channel'),
    enableI2p: input.enableI2p === true, allowLan: input.allowLan === true,
    censorshipBridges: input.censorshipBridges === true,
    appExceptions: [...new Set(list)].sort(), dnscryptResolver: resolver,
  };
}
export function buildGatewayConfig(input = {}) {
  const opt = normaliseInput(input), local = opt.mode !== 'vpn', vpn = opt.mode !== 'tor-dnscrypt';
  const transport = opt.provider === 'bitmask' ? 'openvpn' : 'wireguard';
  const warnings = [PLAN_WARNING];
  if (local && opt.invizibleChannel === 'beta') warnings.push('Beta is an alternative release channel, not an extra anonymity layer. Verify package ID, signing identity and release notes; never start two InviZible VPN services.');
  if (opt.censorshipBridges) warnings.push(vpn && transport === 'openvpn'
    ? 'Bitmask obfuscation depends on the selected provider and transport. A bridge flag does not provision a working bridge.'
    : 'No automatic bridge conversion: Tor bridges are not WireGuard transports. Select supported obfuscation in the official client.');
  if (opt.allowLan || opt.appExceptions.length) warnings.push('LAN access and excluded apps widen bypass risk; lockdown may instead block them. This plan does not enforce either behavior.');
  if (opt.enableI2p) warnings.push('I2P is a separate destination network, not an Internet-wide VPN. Keep .i2p lookups off public DNS; budget reseeding, peer traffic, battery and startup time.');
  const decisions = [
    { name: 'singleVpnOwner', value: 1, rationale: 'Android has one active VPN service per user/profile. Provider choices are alternatives, not simultaneous apps.' },
    { name: 'killSwitch', value: 'required-not-enforced', rationale: 'Always-on and block-without-VPN require OS/user configuration and device failure-path tests. Do not set this planner as always-on.' },
    { name: 'ipv6', value: 'capture-or-block-before-connect', rationale: 'Omitting IPv6 routes alone is not leak protection. Capture ::/0 and carry or explicitly block unsupported IPv6 in a real engine.' },
    { name: 'dns', value: local ? 'local-encrypted-resolver-plan' : 'provider-dns-plan', rationale: 'DNS forwarding, bootstrap, .onion/.i2p separation and no-fallback policy need an implemented and tested packet path.' },
    { name: 'mtu', value: 'engine-and-path-dependent', rationale: 'No universal MTU/MSS optimization is assumed. Measure the actual transport and mobile path.' },
  ];
  const config = {
    profileVersion: 2, mode: opt.mode,
    readiness: { status: 'plan-only', protectionActive: false, enginesBundled: [], tunEstablished: false },
    provider: vpn ? { id: opt.provider, transport, provisioning: opt.provider === 'bitmask' ? 'LEAP provider discovery and certificates required' : opt.provider === 'proton-wireguard' ? 'Owner-generated Proton WireGuard configuration required in a real client' : 'Owner-managed WireGuard peer configuration required in a real client' } : null,
    invizible: local ? { channel: opt.invizibleChannel, execution: 'future embedded modules OR explicitly configured proxy-only companion; not a second VPN' } : null,
    vpnService: { plannedOwner: 'one-future-integrated-service', maxActivePerProfile: 1, consentRequested: false, alwaysOnConfigured: false },
    requirements: { defaultRoutes: ['0.0.0.0/0', '::/0'], unsupportedIpv6: 'block', fallback: 'deny', allowLan: opt.allowLan, appExceptions: opt.appExceptions, mtu: null },
    openvpn: vpn && transport === 'openvpn' ? { engine: 'not-bundled', obfuscationRequested: opt.censorshipBridges } : null,
    wireguard: vpn && transport === 'wireguard' ? { engine: 'not-bundled', overTor: false, privateKeyAccepted: false } : null,
    tor: local ? { socks: '127.0.0.1:9050', scope: opt.mode === 'combined' ? 'selected TCP applications above provider tunnel' : 'selected TCP applications via local routing engine', udp: 'block-except-explicit-internal-dns-handling', egress: vpn ? 'provider tunnel required' : 'direct overlay transport' } : null,
    dnscrypt: local ? { resolver: opt.dnscryptResolver, listen: '127.0.0.1:5354', egress: vpn ? 'provider tunnel required' : 'direct encrypted DNS; resolver can observe queries', enforced: false } : null,
    i2p: { enabled: opt.enableI2p, implementation: opt.enableI2p ? 'Purple I2P / i2pd (not bundled)' : null, destinationScope: '.i2p only; no automatic clearnet outproxy', egress: vpn ? 'provider tunnel required' : 'direct overlay transport' },
    gates: ['pinned-engines-and-license-review', 'single-tun-packet-router', 'authenticated-provider-provisioning', 'loop-and-dns-bootstrap-prevention', 'ipv4-ipv6-dns-udp-leak-tests', 'revocation-reboot-handover-lockdown-tests', 'signed-build-and-owner-device-validation'],
    decisions, warnings,
  };
  return { config, decisions, warnings };
}
// All fragments are inert comments. Even externally altered objects cannot inject active lines.
const commentValue = (value) => String(value).replace(/[\r\n\u2028\u2029]/gu, ' ');
export function renderOpenVpn(config) {
  return `# PLAN ONLY — not an importable OpenVPN configuration.\n# Selected transport: ${commentValue(config.provider?.transport ?? 'none')}.\n# Provider discovery, keys, certificate validation and a tunnel engine are not supplied.\n`;
}
export function renderWireGuard(config) {
  return `# PLAN ONLY — no WireGuard configuration or private key is accepted/generated.\n# Provider: ${commentValue(config.provider?.id ?? 'none')}.\n# Use an owner-generated profile in a trusted real client; do not publish it.\n# Standard WireGuard UDP cannot be sent through Tor SOCKS as if it were TCP.\n`;
}
export function renderTorrc(config) {
  return `# PLAN ONLY — no Tor daemon is started.\n# SOCKS listener: ${commentValue(config.tor?.socks ?? 'disabled')}.\n# TCP-only application routing; never send ordinary BitTorrent through Tor.\n# Proxy-only mode does not capture other apps automatically.\n`;
}
export function renderDnscryptToml(config) {
  return `# PLAN ONLY — no DNS forwarder is installed.\n# Resolver catalog identifier: ${commentValue(config.dnscrypt?.resolver ?? 'disabled')}.\n# Local listener: ${commentValue(config.dnscrypt?.listen ?? 'disabled')}.\n# Bootstrap, routing and no-fallback enforcement remain unimplemented.\n`;
}
