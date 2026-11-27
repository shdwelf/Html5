#!/usr/bin/env node
/** Replace old runnable-looking samples with explicitly inert schema-v2 plans. */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildGatewayConfig, renderOpenVpn, renderWireGuard, renderTorrc, renderDnscryptToml } from '../js/gateway-config.js';
const root = resolve('research/gateway-config/samples');
rmSync(root, { recursive: true, force: true });
for (const mode of ['combined', 'vpn', 'tor-dnscrypt']) {
  const { config } = buildGatewayConfig({ mode }); const path = resolve(root, mode); mkdirSync(path, { recursive: true });
  for (const [name, value] of Object.entries({ 'profile.json': JSON.stringify(config, null, 2) + '\n', 'openvpn.plan.txt': renderOpenVpn(config), 'wireguard.plan.txt': renderWireGuard(config), 'tor.plan.txt': renderTorrc(config), 'dnscrypt.plan.txt': renderDnscryptToml(config) })) writeFileSync(resolve(path, name), value);
}
console.log('Schema-v2 offline plan samples written. No working credentials or engine configurations.');
