import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  GATEWAY_MODES,
  buildGatewayConfig,
  normaliseInput,
  renderDnscryptToml,
  renderOpenVpn,
  renderTorrc,
} from "../js/gateway-config.js";

test("combined mode is the default and layers DNSCrypt through the tunnel", () => {
  const { config, warnings } = buildGatewayConfig();
  assert.equal(config.mode, "combined");
  assert.equal(config.provider.name, "Riseup");
  assert.equal(config.dnscrypt.viaTunnel, true);
  assert.equal(config.tor.perAppLayer, true);
  assert.equal(config.vpnService.blockWithoutVpn, true);
  assert.equal(config.vpnService.mtu, 1400);
  assert.deepEqual(warnings, []);
  for (const name of ["killSwitch", "blockIpv6", "tunMtu", "dnsLeakProtection", "dnsMode"]) {
    assert.ok(config.decisions.some((d) => d.name === name), `decision ${name} must be recorded`);
  }
});

test("vpn mode is Bitmask-shaped: provider DNS in-tunnel, no Tor layer", () => {
  const { config } = buildGatewayConfig({ mode: "vpn" });
  assert.equal(config.dnscrypt, null);
  assert.equal(config.tor, null);
  assert.equal(config.dnsMode, undefined, "dns detail lives under decisions, not a stray field");
  assert.equal(config.vpnService.dnsServers[0], "provider-pushed");
  const ovpn = renderOpenVpn(config);
  assert.match(ovpn, /tun-mtu 1400/);
  assert.match(ovpn, /block-ipv6/);
  assert.equal(renderTorrc(config), "# tor disabled in mode vpn\n");
});

test("tor-dnscrypt mode is InviZible-shaped: no provider, Tor default route", () => {
  const { config, warnings } = buildGatewayConfig({ mode: "tor-dnscrypt", censorshipBridges: true, enableI2p: true });
  assert.equal(config.provider, null);
  assert.equal(config.openvpn, null);
  assert.equal(config.tor.perAppLayer, false);
  assert.equal(config.i2p.enabled, true);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /bridges apply to the provider transport/);
  const torrc = renderTorrc(config);
  assert.match(torrc, /TransPort 127\.0\.0\.1:9040/);
  assert.match(torrc, /DNSPort 127\.0\.0\.1:9053/);
  const toml = renderDnscryptToml(config);
  assert.match(toml, /require_dnssec = true/);
  assert.match(toml, /reached directly/);
});

test("conflicts resolve loudly and inputs are normalised deterministically", () => {
  const { warnings } = buildGatewayConfig({ mode: "vpn", enableI2p: true });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /I2P needs the local anonymity stack/);
  const a = normaliseInput({ appExceptions: ["org.example.b", "org.example.a", "org.example.a"] });
  assert.deepEqual(a.appExceptions, ["org.example.a", "org.example.b"]);
  assert.deepEqual(buildGatewayConfig({ mode: "nonsense" }).config.mode, "combined");
  assert.throws(() => buildGatewayConfig("vpn"), TypeError);
  for (const mode of GATEWAY_MODES) {
    const { config } = buildGatewayConfig({ mode });
    assert.equal(JSON.parse(JSON.stringify(config)).mode, mode, "profile must be JSON-round-trippable");
  }
});

test("gateway page and research doc are wired", () => {
  const html = readFileSync(new URL("../gateway-config.html", import.meta.url), "utf8");
  assert.match(html, /js\/gateway-config\.js/);
  for (const id of ["modeSelect", "bridgesToggle", "i2pToggle", "lanToggle", "exceptionsInput", "profileOut", "ovpnOut", "torrcOut", "dnscryptOut", "decisionList"]) {
    assert.ok(html.includes(`id="${id}"`), `page missing #${id}`);
  }
  const doc = readFileSync(new URL("../docs/riseup-invizible-combined-gateway-research-2026-10-25.md", import.meta.url), "utf8");
  assert.match(doc, /leapcode\/bitmask_android/);
  assert.match(doc, /Gedsh\/InviZible/);
  assert.match(doc, /GPL-3\.0/);
});
