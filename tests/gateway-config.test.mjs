import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GATEWAY_MODES, GATEWAY_PROVIDERS, buildGatewayConfig, normaliseInput, renderOpenVpn, renderWireGuard, renderTorrc, renderDnscryptToml } from '../js/gateway-config.js';

test('gateway defaults are an explicitly inactive plan, not a protection claim', () => {
  const { config, warnings } = buildGatewayConfig();
  assert.equal(config.profileVersion, 2); assert.equal(config.provider.id, 'proton-wireguard');
  assert.deepEqual(config.readiness, { status: 'plan-only', protectionActive: false, enginesBundled: [], tunEstablished: false });
  assert.equal(config.vpnService.consentRequested, false); assert.equal(config.vpnService.alwaysOnConfigured, false);
  assert.equal(config.invizible.channel, 'stable'); assert.match(warnings[0], /PLAN ONLY/);
  assert.deepEqual(config.requirements.defaultRoutes, ['0.0.0.0/0', '::/0']); assert.equal(config.requirements.fallback, 'deny'); assert.equal(config.requirements.mtu, null);
});
for (const mode of GATEWAY_MODES) for (const provider of GATEWAY_PROVIDERS) for (const channel of ['stable', 'beta']) {
  test(`gateway topology ${mode}/${provider}/${channel}: one future owner and no engines`, () => {
    const { config } = buildGatewayConfig({ mode, provider, invizibleChannel: channel, enableI2p: true });
    assert.equal(config.vpnService.maxActivePerProfile, 1); assert.equal(config.readiness.protectionActive, false);
    assert.equal(config.i2p.enabled, true); assert.match(config.i2p.destinationScope, /no automatic clearnet/);
    assert.equal(Boolean(config.provider), mode !== 'tor-dnscrypt');
    assert.equal(Boolean(config.openvpn), mode !== 'tor-dnscrypt' && provider === 'bitmask');
    assert.equal(Boolean(config.wireguard), mode !== 'tor-dnscrypt' && provider !== 'bitmask');
    if (config.wireguard) assert.equal(config.wireguard.overTor, false);
    assert.equal(Boolean(config.tor), mode !== 'vpn');
    if (config.dnscrypt) { assert.equal(config.dnscrypt.enforced, false); assert.match(config.dnscrypt.listen, /:5354$/); }
    for (const render of [renderOpenVpn, renderWireGuard, renderTorrc, renderDnscryptToml]) {
      const fragment = render(config); assert.match(fragment, /^# PLAN ONLY/);
      assert.ok(fragment.trim().split('\n').every((line) => line.startsWith('#')), 'every output line must be inert');
    }
  });
}
for (const input of [null, [], 'vpn', { mode: 'nonsense' }, { provider: 'protonvpn-app-plus-bitmask' }, { provider: {} }, { invizibleChannel: 'stable+beta' }, { enableI2p: 'true' }, { appExceptions: ['*'] }, { appExceptions: ['org.a\nclient'] }, { appExceptions: Array(33).fill('org.test') }, { dnscryptResolver: "x']\nlisten_addresses=['0.0.0.0:53" }, { dnscryptResolver: '../a' }, { privateKey: 'never accept me' }]) {
  test(`gateway rejects unsupported or injectable input ${JSON.stringify(input)}`, () => assert.throws(() => buildGatewayConfig(input), TypeError));
}
test('gateway normalizes a copy, rejects bypass ambiguity and records beta/transport warnings', () => {
  const input = { appExceptions: ['org.z', 'org.a', 'org.z'] }, options = normaliseInput(input);
  assert.deepEqual(options.appExceptions, ['org.a', 'org.z']); assert.deepEqual(input.appExceptions, ['org.z', 'org.a', 'org.z']);
  const { warnings } = buildGatewayConfig({ invizibleChannel: 'beta', censorshipBridges: true, allowLan: true });
  assert.ok(warnings.some((v) => /not an extra anonymity layer/.test(v)));
  assert.ok(warnings.some((v) => /not WireGuard transports/.test(v)));
  assert.ok(warnings.some((v) => /lockdown may instead block/.test(v)));
});
test('Android planner cannot prompt for, start or advertise a working VPN', () => {
  const base = 'apps/riseup-invizible-gateway/app/src/main/';
  const manifest = readFileSync(base + 'AndroidManifest.xml', 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  assert.doesNotMatch(manifest, /<service|uses-permission|BIND_VPN_SERVICE/);
  const activity = readFileSync(base + 'java/org/arena/gateway/MainActivity.java', 'utf8');
  assert.match(activity, /NOT a VPN/); assert.doesNotMatch(activity, /VpnService\.prepare|startService|startActivityForResult|SharedPreferences|new Socket/);
  const service = readFileSync(base + 'java/org/arena/gateway/GatewayVpnService.java', 'utf8');
  assert.doesNotMatch(service, /new Builder|\.establish\(|addRoute|Log\./); assert.match(service, /START_NOT_STICKY/);
});
test('sparse/null package lists fail and even externally altered render values stay inert', () => {
  assert.throws(() => buildGatewayConfig({ appExceptions: Array(2) }), TypeError);
  assert.throws(() => buildGatewayConfig({ appExceptions: null }), TypeError);
  const config = { provider: { transport: 'openvpn\nremote attacker.invalid', id: 'wireguard\n[Interface]' }, tor: { socks: '9050\nSocksPort 0.0.0.0:9050' }, dnscrypt: { resolver: "catalog\nserver_names=['bad']", listen: "5354\nlisten_addresses=['0.0.0.0:53']" } };
  for (const render of [renderOpenVpn, renderWireGuard, renderTorrc, renderDnscryptToml]) assert.ok(render(config).trim().split('\n').every((line) => line.startsWith('#')));
});
test('gateway web UI is wired to every planner choice and uses inert text rendering', () => {
  const html = readFileSync('gateway-config.html', 'utf8');
  for (const id of ['modeSelect', 'providerSelect', 'channelSelect', 'bridgesToggle', 'i2pToggle', 'lanToggle', 'exceptionsInput', 'profileOut', 'wireguardOut']) assert.ok(html.includes(`id="${id}"`), id);
  assert.match(html, /PLAN ONLY/); assert.doesNotMatch(html, /\.innerHTML|fetch\(|localStorage/);
});
