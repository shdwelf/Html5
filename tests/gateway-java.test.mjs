import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { unzipSync } from 'fflate';
import { GATEWAY_MODES, GATEWAY_PROVIDERS, buildGatewayConfig, renderOpenVpn, renderWireGuard, renderTorrc, renderDnscryptToml } from '../js/gateway-config.js';
const jar = resolve(process.env.GATEWAY_JAR || 'research/gateway-config/gateway-config.jar');
const java = process.env.JAVA || (process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin/java') : 'java');
const available = spawnSync(java, ['-version']).status === 0;
if (process.env.GATEWAY_REQUIRE_JAVA === '1' && !available) throw new Error('A real Java runtime is required for gateway parity in CI.');
const run = (...args) => execFileSync(java, ['-jar', jar, ...args], { encoding: 'utf8', timeout: 10000 });
const cli = (out, input) => [out, input.mode, String(input.censorshipBridges), String(input.enableI2p), String(input.allowLan), input.provider, input.invizibleChannel, 'cloudflare', 'org.z,org.a,org.z'];

test('committed planner JAR source receipt matches the actual source and declares no protection', () => {
  const files = unzipSync(readFileSync(jar)), receipt = JSON.parse(new TextDecoder().decode(files['META-INF/gateway-build.json']));
  assert.equal(receipt.schema, 2); assert.equal(receipt.protectionActive, false);
  for (const [path, hash] of Object.entries(receipt.sources)) assert.equal(hash, createHash('sha256').update(readFileSync(path)).digest('hex'), `stale compiled source: ${path}`);
  assert.match(new TextDecoder().decode(files['META-INF/MANIFEST.MF']), /Main-Class: GatewayMain/);
  assert.deepEqual([...files['GatewayMain.class'].slice(0, 4)], [202, 254, 186, 190]);
});
test('Java/JS planner JSON parity across all 144 mode/provider/channel/boolean combinations', { skip: !available }, () => {
  let count = 0;
  for (const mode of GATEWAY_MODES) for (const provider of GATEWAY_PROVIDERS) for (const invizibleChannel of ['stable', 'beta']) for (let flags = 0; flags < 8; flags++) {
    const input = { mode, provider, invizibleChannel, censorshipBridges: Boolean(flags & 1), enableI2p: Boolean(flags & 2), allowLan: Boolean(flags & 4), appExceptions: ['org.z', 'org.a', 'org.z'] };
    assert.deepEqual(JSON.parse(run(...cli('--json', input))), buildGatewayConfig(input).config, JSON.stringify(input)); count++;
  }
  assert.equal(count, 144); assert.deepEqual(JSON.parse(run('--json')), buildGatewayConfig().config);
});
test('Java/JS fragments are identical inert comments for each topology', { skip: !available }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'gateway-plans-'));
  try {
    for (const mode of GATEWAY_MODES) for (const provider of GATEWAY_PROVIDERS) {
      const input = { mode, provider, invizibleChannel: 'stable', censorshipBridges: false, enableI2p: false, allowLan: false, appExceptions: ['org.z', 'org.a', 'org.z'] };
      run(...cli(dir, input)); const { config } = buildGatewayConfig(input);
      assert.deepEqual(JSON.parse(readFileSync(join(dir, 'profile.json'))), config);
      for (const [file, renderer] of [['openvpn.plan.txt', renderOpenVpn], ['wireguard.plan.txt', renderWireGuard], ['tor.plan.txt', renderTorrc], ['dnscrypt.plan.txt', renderDnscryptToml]]) assert.equal(readFileSync(join(dir, file), 'utf8'), renderer(config));
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('Java CLI rejects unknown choices, non-booleans, resolver injection and wildcard exclusions', { skip: !available }, () => {
  for (const args of [[], ['--json', 'bad'], ['--json', 'vpn', 'yes'], ['--json', 'combined', 'false', 'false', 'false', 'unknown'], ['--json', 'combined', 'false', 'false', 'false', 'wireguard', 'stable+beta'], ['--json', 'combined', 'false', 'false', 'false', 'wireguard', 'stable', "x\nfoo='bar'"], ['--json', 'combined', 'false', 'false', 'false', 'wireguard', 'stable', 'cloudflare', '*'], Array(10).fill('--json')]) {
    const result = spawnSync(java, ['-jar', jar, ...args], { encoding: 'utf8', timeout: 10000 }); assert.notEqual(result.status, 0, JSON.stringify(args));
  }
});
