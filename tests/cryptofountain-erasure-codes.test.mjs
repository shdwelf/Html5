import test from "node:test";
import assert from "node:assert/strict";
import {
  adler32,
  fletcher16,
  fnv1a64,
  galoisIntegrity,
  ltEncode,
  ltDecode,
  generateRaptorRecovery,
  computeBlockSignatures,
  computeDelta,
  applyDelta,
  robustSolitonCDF
} from "../tools/cryptofountain_core.mjs";

test("Checksum and hash invariants match CryptoFountain BBS sample post", () => {
  // From resources/src-39-cryptofountain-bbs.md:
  // "Testing the CryptoFountain BBS — erasure-coded, delta-synced, chain-anchored microblogging!"
  // A32: 0x6f2a22e2 · F16: 0xe704 · FNV prefix: 6ed10d32
  const text = "Testing the CryptoFountain BBS — erasure-coded, delta-synced, chain-anchored microblogging!";
  const a32 = adler32(text);
  assert.equal("0x" + a32.toString(16), "0x6f2a22e2");

  const f16 = fletcher16(text);
  assert.equal("0x" + f16.toString(16), "0xe704");

  const fnv = fnv1a64(text);
  assert.ok(fnv.startsWith("6ed10d32"));
});

test("Robust Soliton CDF forms a valid monotonic cumulative distribution", () => {
  const K = 20;
  const cdf = robustSolitonCDF(K, 0.1, 0.5);
  assert.equal(cdf.length, K);
  assert.ok(cdf[0] > 0);
  assert.ok(Math.abs(cdf[K - 1] - 1.0) < 1e-9);
  for (let i = 1; i < K; i++) {
    assert.ok(cdf[i] >= cdf[i - 1], `CDF must be monotonic at index ${i}`);
  }
});

test("LT Fountain encode and belief propagation (peeling decode) roundtrip", () => {
  const payload = "Chancellor on brink of second bailout for banks. Autonomous P2P BBS with rateless fountain codes.";
  const blockSize = 16;
  const numPackets = 40;
  const { packets, numBlocks } = ltEncode(payload, blockSize, numPackets, 12345);

  assert.equal(numBlocks, Math.ceil(Buffer.from(payload).length / blockSize));
  assert.equal(packets.length, numPackets);

  const res = ltDecode(packets, numBlocks, blockSize);
  assert.equal(res.success, true);
  assert.equal(res.recoveredCount, numBlocks);
  assert.equal(res.text, payload);
});

test("Raptor / PAR recovery packets generate valid XOR parity and integrity codes", () => {
  const payload = "Rateless erasure codes with Raptor / PAR parity volumes.";
  const blockSize = 8;
  const recoveryCount = 4;
  const packets = generateRaptorRecovery(payload, blockSize, recoveryCount, 42);

  const srcPkts = packets.filter(p => !p.isRecovery);
  const recPkts = packets.filter(p => p.isRecovery);

  assert.equal(srcPkts.length, Math.ceil(Buffer.from(payload).length / blockSize));
  assert.equal(recPkts.length, recoveryCount);

  for (const p of packets) {
    assert.equal(typeof p.fletcher16, "number");
    assert.equal(typeof p.galoisIntegrity, "number");
    assert.equal(p.data.length, blockSize);
  }
});

test("Rsync rolling hash delta encoding and reconstruction roundtrip", () => {
  const base = "First microblog post on the decentralized filesystem.\nBlock A\nBlock B\nBlock C\nEnd of post.";
  const updated = "First microblog post on the decentralized filesystem.\nBlock A (revised with updates)\nBlock B\nBlock C\nEnd of post with trailing additions.";

  const sigs = computeBlockSignatures(base, 16);
  const deltas = computeDelta(updated, sigs);

  assert.ok(deltas.some(d => d.type === "copy"), "Delta should contain copy operations");
  assert.ok(deltas.some(d => d.type === "insert"), "Delta should contain literal insert operations");

  const reconstructed = applyDelta(base, deltas, sigs.blockSize);
  assert.equal(reconstructed, updated);
});
