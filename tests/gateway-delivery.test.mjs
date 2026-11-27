import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { unzipSync } from 'fflate';

const root = 'research/gateway-config';
const receipt = JSON.parse(readFileSync(`${root}/build-receipt.json`, 'utf8'));
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

test('delivered planner build receipt matches every current Android/JAR source input, without a protection claim', () => {
  assert.equal(receipt.schema, 2); assert.equal(receipt.protectionActive, false);
  assert.match(receipt.sourceCommit, /^[a-f0-9]{40}$/u); assert.match(receipt.runId, /^\d+$/u);
  assert.equal(receipt.runUrl, `https://github.com/shdwelf/Html5/actions/runs/${receipt.runId}`);
  assert.equal(receipt.retrieval.buildConclusion, 'success'); assert.equal(receipt.retrieval.ownerDeviceTested, false);
  assert.match(receipt.javaVersion, /17\.0\./u); assert.equal(Object.keys(receipt.sourceSha256).length, 10);
  for (const [path, expected] of Object.entries(receipt.sourceSha256)) assert.equal(sha(path), expected, `stale delivered build input: ${path}`);
});
test('actual delivered APK/JAR byte counts and hashes match the measured runner receipt and checksum list', () => {
  assert.deepEqual(Object.keys(receipt.outputs).sort(), ['gateway-config.jar', 'gateway-debug.apk']);
  for (const [name, expected] of Object.entries(receipt.outputs)) {
    const path = `${root}/${name}`; assert.equal(readFileSync(path).length, expected.bytes); assert.equal(sha(path), expected.sha256);
  }
  for (const line of readFileSync(`${root}/SHA256SUMS.txt`, 'utf8').trim().split('\n')) {
    const [expected, name] = line.split('  '); assert.match(expected, /^[a-f0-9]{64}$/u); assert.equal(sha(resolve(root, name)), expected);
  }
});
test('delivered APK is a real Android ZIP and recorded SDK inspection identifies only the plan-only activity', () => {
  const apk = unzipSync(readFileSync(`${root}/gateway-debug.apk`));
  for (const path of ['AndroidManifest.xml', 'classes.dex', 'resources.arsc']) assert.ok(apk[path]?.length, path);
  assert.deepEqual([...apk['classes.dex'].slice(0, 4)], [100, 101, 120, 10]);
  const manifest = readFileSync(`${root}/apk-manifest.txt`, 'utf8');
  assert.match(manifest, /org\.arena\.gateway/u); assert.match(manifest, /0\.2\.0-plan-only/u);
  assert.match(manifest, /MainActivity/u); assert.doesNotMatch(manifest, /E: service|E: uses-permission|android\.net\.VpnService/u);
  assert.doesNotMatch(readFileSync(`${root}/apk-permissions.txt`, 'utf8'), /uses-permission|BIND_VPN_SERVICE/u);
});
test('recorded apksigner verification has a complete review certificate, not production/upstream identity', () => {
  const signature = readFileSync(`${root}/apk-signature.txt`, 'utf8');
  assert.match(signature, /Verified using v2 scheme \(APK Signature Scheme v2\): true/u);
  assert.match(signature, /Signer #1 certificate SHA-256 digest: [a-f0-9]{64}/u);
  assert.match(signature, /Android Debug/u);
  // Local parsing of this text is not cryptographic APK signature validation.
  // The read-only matching-source CI must run SDK apksigner on the delivered
  // bytes again, compare this output, and verify the measured build run.
});
