#!/usr/bin/env node
/**
 * tools/ace_delta_fountain_sim.mjs
 *
 * Demonstrates a rateless fountain broadcast simulation:
 * Generates continuous LT packets until the receiver decodes the full payload,
 * testing across different channel packet loss rates (0%, 15%, 30%).
 */

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
  toBytes,
  toText
} from "./cryptofountain_core.mjs";

console.log("=== Autonomous Decentralized ACE Delta + LT Fountain Broadcast Sim ===");

const docEpoch0 = `=== P2P BBS LOG: GENESIS EPOCH ===
Node: 0x9f2a
Date: 2026-11-07T00:00:00Z
Protocol: ACE-LT-Raptor-v1
Topic: Decentralized ledger persistence over lossy acoustic and packet radio.
Payload: The quick brown fox jumps over the lazy dog repeatedly across multiple blocks.
`;

const docEpoch1 = `=== P2P BBS LOG: EPOCH 1 ===
Node: 0x9f2a
Date: 2026-11-07T01:15:00Z
Protocol: ACE-LT-Raptor-v1
Topic: Decentralized ledger persistence over lossy acoustic and packet radio.
Payload: The quick brown fox jumps over the lazy dog repeatedly across multiple blocks.
Update: Appended consensus block #10492 with hashcash proof-of-work stamp 1:16:1762473600:bbs::2048.
Signature: 36e53fb29b59a50b
`;

console.log("\n[1] Computing Rsync rolling delta between Epoch 0 and Epoch 1...");
const blockSize = 64;
const sigs = computeBlockSignatures(docEpoch0, blockSize);
const deltaOps = computeDelta(docEpoch1, sigs);
const deltaSerialized = JSON.stringify(deltaOps);
console.log(`Original size: ${toBytes(docEpoch1).length} B | Delta ops: ${deltaOps.length} | Delta payload: ${toBytes(deltaSerialized).length} B`);

const testLossRates = [0.0, 0.15, 0.30];
const ltBlockSize = 32;

for (const lossRate of testLossRates) {
  console.log(`\n--- Simulating Broadcast Fountain with ${(lossRate * 100).toFixed(0)}% Packet Loss ---`);
  // Generate a generous fountain stream
  const maxPackets = 120;
  const ltResult = ltEncode(deltaSerialized, ltBlockSize, maxPackets, 42);
  const K = ltResult.numBlocks;

  const receivedPackets = [];
  let packetsTransmitted = 0;
  let decoded = null;

  for (let i = 0; i < ltResult.packets.length; i++) {
    packetsTransmitted++;
    // Simulate channel loss
    if (Math.random() < lossRate) {
      continue; // Dropped packet
    }
    receivedPackets.push(ltResult.packets[i]);

    // Attempt decode once we receive at least K packets
    if (receivedPackets.length >= K) {
      const attempt = ltDecode(receivedPackets, K, ltBlockSize);
      if (attempt.success) {
        decoded = attempt;
        break;
      }
    }
  }

  if (decoded && decoded.success) {
    const overhead = ((receivedPackets.length - K) / K) * 100;
    console.log(`✓ Decoded successfully!`);
    console.log(`  Source blocks (K): ${K}`);
    console.log(`  Transmitted packets: ${packetsTransmitted}`);
    console.log(`  Packets received: ${receivedPackets.length} (overhead: ${overhead.toFixed(1)}%)`);
    const recoveredDeltaOps = JSON.parse(decoded.text);
    const restoredDoc = applyDelta(docEpoch0, recoveredDeltaOps, sigs.blockSize);
    console.log(`  Integrity Match: ${restoredDoc === docEpoch1} (Adler-32: 0x${adler32(restoredDoc).toString(16)})`);
  } else {
    console.log(`✗ Failed to decode within ${maxPackets} packets.`);
  }
}
