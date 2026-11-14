import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { inflateRawSync } from "node:zlib";
import SevenZip from "7z-wasm";

import { zipFiles, rawDeflate } from "../js/zip.js";
import { buildModel } from "../js/ghs-model.js";
import { campusToVrml } from "../js/ghs-vrml.js";
import { buildXdcBundle } from "../js/ghs-xdc.js";

const encoder = new TextEncoder();
const fixedDate = new Date("2026-11-13T12:00:00Z");
const bytes = (value) => typeof value === "string" ? encoder.encode(value) : value;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

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

// Built-in zlib is an independent DEFLATE implementation. Check the ZIP
// directory and local headers too, not just the compressed byte stream.
function readDirectory(zip) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const end = zip.length - 22; // writer does not support an EOCD comment
  assert.equal(view.getUint32(end, true), 0x06054b50);
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const results = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint32(offset, true), 0x02014b50);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const rawSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(zip.subarray(offset + 46, offset + 46 + nameLength));
    assert.equal(view.getUint32(local, true), 0x04034b50);
    assert.equal(view.getUint16(local + 8, true), method);
    const dataOffset = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    const stored = zip.subarray(dataOffset, dataOffset + compressedSize);
    const data = method === 8 ? Uint8Array.from(inflateRawSync(stored)) : stored;
    assert.ok(method === 0 || method === 8);
    assert.equal(data.length, rawSize);
    results.set(name, { data, method, compressedSize });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  assert.equal(offset, end);
  return results;
}

const pythonReader = String.raw`
import hashlib, io, json, sys, zipfile
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as z:
    assert z.testzip() is None, 'CRC mismatch'
    assert len(z.namelist()) == len(set(z.namelist())), 'duplicate entry'
    print(json.dumps({i.filename: [i.compress_type, hashlib.sha256(z.read(i)).hexdigest()]
                      for i in z.infolist()}, sort_keys=True))
`;

function checkIndependentReaders(zip, files) {
  const py = spawnSync("python3", ["-c", pythonReader], { input: Buffer.from(zip) });
  if (py.error?.code !== "ENOENT") {
    assert.equal(py.status, 0, py.stderr?.toString());
    const entries = JSON.parse(py.stdout.toString());
    for (const file of files) {
      assert.equal(entries[file.name][1], sha256(bytes(file.data)), `Python ZIP CRC/data for ${file.name}`);
    }
  }

  // Info-ZIP is a second, separately maintained ZIP reader if installed.
  const dir = mkdtempSync(join(tmpdir(), "html5-zip-test-"));
  try {
    const file = join(dir, "sample.zip");
    writeFileSync(file, zip);
    const unzip = spawnSync("unzip", ["-tqq", file]);
    if (unzip.error?.code !== "ENOENT") {
      assert.equal(unzip.status, 0, unzip.stderr?.toString());
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("ZIP32 encodes text with actual DEFLATE, stores high-entropy bytes, and interoperates", () => {
  const text = readFileSync(new URL("../docs/decompressor-recipe-matrix-2026-10-21.md", import.meta.url), "utf8").repeat(8);
  const files = [
    { name: "readme.txt", data: text },
    { name: "empty.txt", data: new Uint8Array(0) },
    { name: "nested/naïve-🗜.txt", data: "UTF-8 names and bytes ✓" },
    { name: "random.bin", data: randomBytes(98304) },
    { name: "boundary.bin", data: encoder.encode("ABCD".repeat(32769)) }, // > 65535 bytes
  ];
  const archive = zipFiles(files, { deflate: true, date: fixedDate });
  assert.deepEqual(archive, zipFiles(files, { deflate: true, date: fixedDate }));
  const entries = readDirectory(archive);
  assert.equal(entries.size, files.length);
  for (const file of files) assert.deepEqual(entries.get(file.name).data, bytes(file.data));
  assert.equal(entries.get("readme.txt").method, 8);
  assert.equal(entries.get("boundary.bin").method, 8);
  assert.equal(entries.get("random.bin").method, 0);
  assert.equal(entries.get("empty.txt").method, 0);
  assert.ok(entries.get("readme.txt").compressedSize < bytes(text).length / 2);
  checkIndependentReaders(archive, files);
});

test("ZIP STORE mode and DEFLATE levels 0 and 9 preserve ZIP interoperability", () => {
  const files = [{ name: "example.txt", data: "The quick brown fox jumps over the lazy dog. ".repeat(1000) }];
  const store = readDirectory(zipFiles(files, { date: fixedDate }));
  assert.equal(store.get("example.txt").method, 0);
  for (const level of [0, 9]) {
    const archive = zipFiles(files, { deflate: true, level, date: fixedDate });
    assert.deepEqual(readDirectory(archive).get("example.txt").data, bytes(files[0].data));
    checkIndependentReaders(archive, files);
  }
});

test("ZIP32 rejects silently truncated entry counts, filenames, and invalid levels", () => {
  assert.throws(() => zipFiles([{ name: "a", data: "a" }], { deflate: true, level: 10 }), RangeError);
  assert.throws(() => zipFiles([{ name: "a".repeat(65536), data: "a" }]), RangeError);
  assert.throws(() => zipFiles(new Array(65536).fill({ name: "x", data: "" })), RangeError);
  assert.throws(() => zipFiles([{ name: "a", data: [1, 2] }]), TypeError);
});

test("actual Glendora webxdc export is smaller and independently readable", () => {
  const model = buildModel({ boxes: false, simplify: 0.6, trees: 190 });
  const wrl = campusToVrml(model, { grid: 22 });
  const bundle = buildXdcBundle(model, wrl);
  const oldSize = 22 + bundle.files.reduce((sum, file) => {
    return sum + 98 + 2 * bytes(file.name).length + rawDeflate(bytes(file.data)).length;
  }, 0);
  assert.ok(bundle.xdc.length < oldSize * 0.8, `export ${bundle.xdc.length}, old ${oldSize}`);
  checkIndependentReaders(bundle.xdc, bundle.files);
});

test("7-Zip's WASM ZIP reader verifies both DEFLATE and STORE entries", async () => {
  const archive = zipFiles([
    { name: "text.txt", data: "hello world! ".repeat(1000) },
    { name: "random.bin", data: randomBytes(5000) },
  ], { deflate: true, date: fixedDate });
  const log = [];
  const sevenZip = await SevenZip({ print: (line) => log.push(line), printErr: (line) => log.push(`ERROR ${line}`) });
  sevenZip.FS.writeFile("/sample.zip", archive);
  sevenZip.callMain(["t", "/sample.zip"]);
  assert.ok(log.some((line) => line.includes("Everything is Ok")), log.join("\n"));
  assert.ok(!log.some((line) => line.startsWith("ERROR ")), log.join("\n"));
});

test("legacy stored-block rawDeflate helper still decodes with zlib", () => {
  const data = randomBytes(65536);
  assert.deepEqual(Uint8Array.from(inflateRawSync(rawDeflate(data))), data);
  assert.deepEqual(Uint8Array.from(inflateRawSync(rawDeflate(new Uint8Array(0)))), new Uint8Array(0));
});
