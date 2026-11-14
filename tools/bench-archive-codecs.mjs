#!/usr/bin/env node
/**
 * Repeatable SIZE comparison over equal bytes (not a speed or format decoder
 * benchmark). Optionally pass a local Gutenberg/Archive.org text path; no
 * copyrighted corpus, network fetch, archives, or keys are committed.
 *
 *   node tools/bench-archive-codecs.mjs [--json] [--file /path/to/text]
 * Run after npm ci for the optional 7z-wasm/LZMA2 column.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
// Zstd is available only in newer Node builds; keep the other columns usable
// without it instead of failing during ESM import on older Node versions.
import * as zlib from "node:zlib";
const { brotliCompressSync, brotliDecompressSync, constants, gzipSync, gunzipSync,
  zstdCompressSync, zstdDecompressSync } = zlib;
import { zipFiles, rawDeflate } from "../js/zip.js";

const zipName = "sample.dat";
const fixedDate = new Date("2026-11-13T12:00:00Z");
const json = process.argv.includes("--json");
const fileIndex = process.argv.indexOf("--file");
if (fileIndex >= 0 && !process.argv[fileIndex + 1]) throw new Error("--file needs a path");
const extraFile = fileIndex >= 0 ? process.argv[fileIndex + 1] : null;
const sha = (value) => createHash("sha256").update(value).digest("hex");
const text = (value) => new TextEncoder().encode(value);

function randomBytes(length) {
  const out = new Uint8Array(length);
  let state = 0x12345678;
  for (let i = 0; i < length; i++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    out[i] = state & 255;
  }
  return out;
}

const inputs = [
  ["docs", readFileSync(new URL("../docs/decompressor-recipe-matrix-2026-10-21.md", import.meta.url))],
  ["source", readFileSync(new URL("check_ghs.mjs", import.meta.url))],
  ["app", readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url))],
  ["entropy", randomBytes(131072)],
];
if (extraFile) inputs.push([`external:${basename(extraFile)}`, readFileSync(extraFile)]);

const SevenZip = await import("7z-wasm").then((m) => m.default).catch(() => null);
let sevenZip;
if (SevenZip) {
  sevenZip = await SevenZip({ print: () => {}, printErr: (line) => { throw new Error(line); } });
  sevenZip.FS.mkdir("/bench");
}

function size7z(data, index) {
  if (!sevenZip) return null;
  const dir = `/bench/case${index}`;
  sevenZip.FS.mkdir(dir);
  sevenZip.FS.writeFile(`${dir}/sample.dat`, data);
  sevenZip.callMain(["a", "-t7z", "-m0=LZMA2", "-mx=5", "-mmt=1",
    "-mtc=off", "-mta=off", "-mtm=off", `${dir}/sample.7z`, `${dir}/sample.dat`]);
  sevenZip.callMain(["t", `${dir}/sample.7z`]);
  return sevenZip.FS.readFile(`${dir}/sample.7z`).length;
}

const rows = inputs.map(([label, value], index) => {
  const data = new Uint8Array(value);
  const record = {
    corpus: label, bytes: data.length, sha256: sha(data),
    // Exact previous writer length: 30-byte local + 46-byte central + 22-byte
    // EOCD + UTF-8 filename twice + raw stored DEFLATE blocks.
    priorZipMethod8: rawDeflate(data).length + 98 + 2 * text(zipName).length,
    zipStore: zipFiles([{ name: zipName, data }], { date: fixedDate }).length,
    zipDeflate6: zipFiles([{ name: zipName, data }], { date: fixedDate, deflate: true }).length,
    zipDeflate9: zipFiles([{ name: zipName, data }], { date: fixedDate, deflate: true, level: 9 }).length,
  };
  const gz6 = gzipSync(data, { level: 6, mtime: 0 });
  const gz9 = gzipSync(data, { level: 9, mtime: 0 });
  const br5 = brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } });
  record.gzip6 = gz6.length;
  record.gzip9 = gz9.length;
  record.brotli5 = br5.length;
  assert.equal(sha(gunzipSync(gz6)), record.sha256);
  assert.equal(sha(gunzipSync(gz9)), record.sha256);
  assert.equal(sha(brotliDecompressSync(br5)), record.sha256);
  if (zstdCompressSync && zstdDecompressSync) {
    const zst = zstdCompressSync(data);
    record.zstdDefault = zst.length;
    assert.equal(sha(zstdDecompressSync(zst)), record.sha256);
  }
  record.sevenZipLzma2_5 = size7z(data, index);
  return record;
});
if (json) console.log(JSON.stringify(rows, null, 2));
else {
  console.table(rows.map(({ corpus, bytes, priorZipMethod8, zipStore, zipDeflate6,
    zipDeflate9, gzip6, gzip9, brotli5, zstdDefault, sevenZipLzma2_5 }) => ({
    corpus, bytes, priorZipMethod8, zipStore, zipDeflate6, zipDeflate9,
    gzip6, gzip9, brotli5, zstdDefault, sevenZipLzma2_5,
  })));
  console.log("Bytes include each format's own wrapper; different containers are NOT interchangeable.");
  console.log("Local inputs only. Archive.org/Gutenberg originals are not downloaded or redistributed by this script.");
}
