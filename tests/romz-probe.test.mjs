import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync, deflateSync, deflateRawSync } from 'node:zlib';

const PROBE = new URL('../tools/evolution-os/romz_probe.py', import.meta.url).pathname;
// Firmware-flavoured plaintext: big enough and carrying the keyword strings
// a real Evolution payload carries in its web/CLI string regions.
const PAYLOAD = Buffer.concat([
  Buffer.from('Lantronix Evolution OS XPort Pro firmware '.repeat(40)),
  Buffer.from(Array.from({ length: 8192 }, (_, i) => i % 251)),
  Buffer.from('ColdFire HTTP SSH Telnet SNMP copyright '.repeat(30)),
]);

function runProbe(bytes, name) {
  const dir = mkdtempSync(join(tmpdir(), 'romz-'));
  const input = join(dir, name);
  const out = join(dir, 'payload.bin');
  const reportPath = join(dir, 'report.json');
  writeFileSync(input, bytes);
  const res = spawnSync('python3', [PROBE, input, '--out', out, '--report', reportPath], { encoding: 'utf8' });
  return { res, out, report: JSON.parse(readFileSync(reportPath, 'utf8')) };
}

test('probe inflates a gzip .romz and recovers the payload byte-for-byte', () => {
  const { res, out, report } = runProbe(gzipSync(PAYLOAD), 'fw.romz');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.equal(report.inflated.method, 'gzip');
  assert.deepEqual(readFileSync(out), PAYLOAD);
  assert.ok(report.attempts.some((a) => a.method === 'zlib'));
});

test('probe inflates zlib and raw-deflate containers', () => {
  for (const [bytes, method] of [[deflateSync(PAYLOAD), 'zlib'], [deflateRawSync(PAYLOAD), 'raw-deflate']]) {
    const { res, out, report } = runProbe(bytes, 'fw.romz');
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.equal(report.inflated.method, method);
    assert.deepEqual(readFileSync(out), PAYLOAD);
  }
});

test('probe finds a gzip stream behind a short vendor header', () => {
  const headed = Buffer.concat([Buffer.from([0x4c, 0x54, 0x58, 0x00, 0x01, 0x00, 0x00, 0x00]), gzipSync(PAYLOAD)]);
  const { res, out, report } = runProbe(headed, 'fw.romz');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.equal(report.inflated.offset, 8);
  assert.deepEqual(readFileSync(out), PAYLOAD);
});

test('probe refuses random bytes and still writes an honest report', () => {
  const noise = Buffer.from(Array.from({ length: 65536 }, (_, i) => (i * 1103515245 + 12345) >> 16 & 255));
  const { res, out, report } = runProbe(noise, 'fw.romz');
  assert.equal(res.status, 2);
  assert.equal(report.inflated, null);
  assert.equal(existsSync(out), false);
  assert.ok(report.attempts.length >= 5);
  assert.match(report.magicHex, /^[0-9a-f ]+$/);
});
