#!/usr/bin/env node
/**
 * Repeatable SIZE comparison for public, synthetic Vault-shaped JSON.
 * 7z/LZMA2 level 0..9 plus opt-in Delta strides at levels 5/9 are checked
 * by extraction and SHA-256. ZIP/DEFLATE is a separate Huffman-based format,
 * NOT a codec to insert into an existing Haiku Vault v2 frame.
 *
 *   node tools/bench-vault-v2-codecs.mjs [--json]
 *
 * No vault plaintext, passwords, ciphertext, private backups, or network
 * downloads are read. 7z is a single-member archive of payload.json, using
 * the same CLI options as Vault v2. Sizes exclude the AES-GCM/text envelope.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import SevenZip from "7z-wasm";
import { zipFiles } from "../js/zip.js";

const encode = (value) => new TextEncoder().encode(JSON.stringify(value, null, 2));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fixedDate = new Date("2026-11-13T12:00:00Z");

function seededHex(length) {
  let state = 0x12345678;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    bytes[i] = state & 255;
  }
  return Buffer.from(bytes).toString("hex");
}

const cases = [
  ["repeated-notes", encode({ notes: Array.from({ length: 1200 }, (_, i) => ({
    section: i % 12, text: "A public synthetic note, not a wallet secret.", line: i,
  })) })],
  ["numeric-series", encode({ readings: Array.from({ length: 8192 }, (_, i) =>
    ({ t: i, sample: i * 11 + (i % 7) })) })],
  ["seeded-hex", encode({ payload: seededHex(16384) })],
];

const log = [];
const sevenZip = await SevenZip({ print: (line) => log.push(line), printErr: (line) => log.push(`ERR: ${line}`) });
sevenZip.FS.mkdir("/vault-bench");
const run = (args) => {
  log.length = 0;
  sevenZip.callMain(args);
  return [...log];
};
let counter = 0;
function encodeAndVerify(data, level, deltaDistance) {
  const dir = `/vault-bench/sample-${counter++}`;
  const input = `${dir}/payload.json`;
  const archive = `${dir}/payload.7z`;
  const output = `${dir}/out`;
  const fs = sevenZip.FS;
  fs.mkdir(dir);
  fs.mkdir(output);
  try {
    fs.writeFile(input, data);
    run(["a", "-t7z", "-m0=LZMA2",
      ...(deltaDistance === undefined ? [] : [`-m1=Delta:${deltaDistance}`]),
      `-mx=${level}`, "-md=8m", "-mmt=1",
      "-mtc=off", "-mta=off", "-mtm=off", "-bd", "-bso0", "-bsp0", "-bse0",
      archive, input]);
    const encoded = fs.readFile(archive);
    const method = run(["l", "-slt", "-ba", archive])
      .find((line) => line.startsWith("Method = "))?.slice("Method = ".length);
    assert.ok(method?.startsWith("LZMA2"), `not an LZMA2 archive: ${method}`);
    if (deltaDistance !== undefined) assert.ok(method.includes(`Delta:${deltaDistance}`), method);
    run(["x", "-y", "-bd", "-bso0", "-bsp0", "-bse0", `-o${output}`, archive]);
    assert.equal(sha256(fs.readFile(`${output}/payload.json`)), sha256(data));
    return { bytes: encoded.length, method };
  } finally {
    for (const file of [`${output}/payload.json`, input, archive]) {
      try { fs.unlink(file); } catch { /* extraction may have failed */ }
    }
    fs.rmdir(output);
    fs.rmdir(dir);
  }
}

const rows = cases.map(([corpus, data]) => {
  const levels = Array.from({ length: 10 }, (_, level) => {
    const baseline = encodeAndVerify(data, level);
    const row = { level, ...baseline };
    if (level === 5 || level === 9) {
      row.delta1 = encodeAndVerify(data, level, 1).bytes;
      row.delta4 = encodeAndVerify(data, level, 4).bytes;
    }
    return row;
  });
  return {
    corpus, bytes: data.length, sha256: sha256(data),
    zipDeflate6: zipFiles([{ name: "payload.json", data }], { deflate: true, date: fixedDate }).length,
    levels,
  };
});
if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
else {
  for (const { corpus, bytes, zipDeflate6, levels } of rows) {
    console.log(`\n${corpus}: ${bytes} raw JSON bytes; ZIP/DEFLATE-6 (separate container): ${zipDeflate6}`);
    console.table(levels);
  }
  console.log("Level 0 is still a 7z/LZMA2 member; Delta is opt-in and is not guaranteed to reduce JSON.");
  console.log("Sizes exclude Vault encryption/framing. LT is erasure recovery, not a compressor.");
}
