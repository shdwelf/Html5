// Encrypted vault file exchange + standalone offline decryptor.
//
// Format (version 1), also understood by the generated decryptor page:
//
//   haiku-vault-v1.<base64( 0x01 | salt(16) | iv(12) | ciphertext+tag )>
//
// Key: PBKDF2-HMAC-SHA256, 120,000 iterations, 32 bytes -> AES-256-GCM.
// The salt is separate from the IV, so one Ensō ID can safely back multiple
// files. Implemented with @noble (deterministic, Node-testable); the emitted
// decryptor page re-implements the same layout with native WebCrypto.

import { gcm } from "@noble/ciphers/aes.js";
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "./rngBytes";
import { download } from "./wallet";

export const VAULT_FILE_MAGIC = "haiku-vault-v1.";
export const VAULT_FILE_V2_MAGIC = "haiku-vault-v2.";
export const PBKDF2_ITERATIONS = 120_000;

const V2_FRAME_MAGIC = new Uint8Array([0x48, 0x56, 0x32, 0x00]);
const V2_FRAME_HEADER_BYTES = 9;
const V2_CODEC_NONE = 0;
const V2_CODEC_7Z_LZMA2 = 1;
const V2_MAX_JSON_BYTES = 16 * 1024 * 1024;
const V2_MAX_ARCHIVE_BYTES = 32 * 1024 * 1024;
let sevenZipPromise: Promise<import("7z-wasm").SevenZipModule> | null = null;
let sevenZipOutput: string[] = [];
let sevenZipRunId = 0;

export type VaultFileV2Compression = "none" | "lzma2" | "auto";

export interface VaultFileV2Options {
  /** `auto` keeps the LZMA2 archive only when it is smaller than the JSON. */
  compression?: VaultFileV2Compression;
  /** Deterministic test hooks; omit both in production to use fresh randomness. */
  salt?: Uint8Array;
  iv?: Uint8Array;
}

function deriveKey(password: string, salt: Uint8Array): Uint8Array {
  return pbkdf2(sha256, new TextEncoder().encode(password), salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  });
}

function toB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64.trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Encrypt any JSON-serialisable payload into the v1 exchange format. */
export function encryptVaultFile(value: unknown, password: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(password, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(value, null, 2));
  const ct = gcm(key, iv).encrypt(plaintext);
  const packed = new Uint8Array(1 + salt.length + iv.length + ct.length);
  packed[0] = 1;
  packed.set(salt, 1);
  packed.set(iv, 17);
  packed.set(ct, 29);
  return VAULT_FILE_MAGIC + toB64(packed);
}

/** Decrypt a v1 exchange blob. Throws on wrong password or tampering. */
export function decryptVaultFile(blob: string, password: string): unknown {
  const body = blob.trim().startsWith(VAULT_FILE_MAGIC)
    ? blob.trim().slice(VAULT_FILE_MAGIC.length)
    : blob.trim();
  let packed: Uint8Array;
  try {
    packed = fromB64(body);
  } catch {
    throw new Error("Not a haiku-vault-v1 file.");
  }
  if (packed[0] !== 1 || packed.length < 46) {
    throw new Error("Not a haiku-vault-v1 file.");
  }
  const salt = packed.slice(1, 17);
  const iv = packed.slice(17, 29);
  const ct = packed.slice(29);
  const key = deriveKey(password, salt);
  const plain = gcm(key, iv).decrypt(ct);
  return JSON.parse(new TextDecoder().decode(plain));
}

async function loadSevenZip(): Promise<import("7z-wasm").SevenZipModule> {
  if (!sevenZipPromise) {
    sevenZipPromise = (async () => {
      const nodeProcess = (globalThis as { process?: { versions?: { node?: string } } }).process;
      const nodePackage = ["7z", "-wasm"].join("");
      const module = nodeProcess?.versions?.node
        ? await import(/* @vite-ignore */ nodePackage)
        : await import(/* @vite-ignore */ new URL("./vendor/7z-wasm/7zz.es6.js", document.baseURI).href);
      return module.default({
        print: (line: string) => sevenZipOutput.push(line),
        printErr: () => {},
      });
    })();
  }
  return sevenZipPromise;
}

function runSevenZip(
  sevenZip: import("7z-wasm").SevenZipModule,
  args: string[],
): string[] {
  const output: string[] = [];
  const previousOutput = sevenZipOutput;
  sevenZipOutput = output;
  try {
    sevenZip.callMain(args);
  } finally {
    sevenZipOutput = previousOutput;
  }
  return output;
}

function removeSevenZipTree(fs: import("7z-wasm").FileSystem, path: string): void {
  let entries: string[];
  try {
    entries = fs.readdir(path);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "." || name === "..") continue;
    const child = `${path}/${name}`;
    const stat = fs.lstat(child);
    if (fs.isDir(stat.mode) && !fs.isLink(stat.mode)) removeSevenZipTree(fs, child);
    else fs.unlink(child);
  }
  fs.rmdir(path);
}

function validateSevenZipMemberListing(output: string[], expectedBytes: number): void {
  const text = output.join("\n").trim();
  const records = text.split(/\n\s*\n/).map((record) => record.trim()).filter(Boolean);
  if (records.length !== 1) {
    throw new Error("Invalid 7z/LZMA2 payload; the archive must list exactly one member.");
  }
  const fields = new Map<string, string>();
  for (const line of records[0].split(/\r?\n/)) {
    const separator = line.indexOf(" = ");
    if (separator <= 0) throw new Error("Invalid 7z/LZMA2 member listing.");
    const key = line.slice(0, separator);
    if (fields.has(key)) throw new Error("Invalid 7z/LZMA2 member listing.");
    fields.set(key, line.slice(separator + 3));
  }
  const memberSize = Number(fields.get("Size"));
  if (
    fields.get("Path") !== "payload.json" ||
    fields.get("Folder") === "+" ||
    fields.has("Symbolic Link") ||
    fields.has("Hard Link") ||
    !Number.isSafeInteger(memberSize) ||
    memberSize !== expectedBytes ||
    memberSize > V2_MAX_JSON_BYTES
  ) {
    throw new Error("Invalid 7z/LZMA2 payload; expected one bounded regular payload.json member.");
  }
}

async function compressJsonWithLzma2(json: Uint8Array): Promise<Uint8Array> {
  const sevenZip = await loadSevenZip();
  const runRoot = `/hv2-compress-${sevenZipRunId++}`;
  const inputPath = `${runRoot}/payload.json`;
  const archivePath = `${runRoot}/payload.7z`;
  const fs = sevenZip.FS;
  fs.mkdir(runRoot);
  try {
    fs.writeFile(inputPath, json);
    runSevenZip(sevenZip, [
      "a", "-t7z", "-m0=LZMA2", "-mx=5", "-md=8m", "-mmt=1",
      "-mtc=off", "-mta=off", "-mtm=off", "-bd", "-bso0", "-bsp0", "-bse0",
      archivePath, inputPath,
    ]);
    const archive = fs.readFile(archivePath);
    if (archive.byteLength > V2_MAX_ARCHIVE_BYTES) {
      throw new Error("LZMA2 archive exceeds the v2 size limit.");
    }
    return new Uint8Array(archive);
  } finally {
    removeSevenZipTree(fs, runRoot);
  }
}

async function decompressJsonWithLzma2(archive: Uint8Array, expectedBytes: number): Promise<Uint8Array> {
  if (archive.byteLength > V2_MAX_ARCHIVE_BYTES) {
    throw new Error("LZMA2 archive exceeds the v2 size limit.");
  }
  const sevenZip = await loadSevenZip();
  const runRoot = `/hv2-decompress-${sevenZipRunId++}`;
  const archivePath = `${runRoot}/payload.7z`;
  const outputDir = `${runRoot}/out`;
  const outputPath = `${outputDir}/payload.json`;
  const fs = sevenZip.FS;
  fs.mkdir(runRoot);
  fs.mkdir(outputDir);
  try {
    fs.writeFile(archivePath, archive);
    const listing = runSevenZip(sevenZip, [
      "l", "-slt", "-ba", "-sccUTF-8", "-bd", "-bso1", "-bsp0", "-bse0", archivePath,
    ]);
    validateSevenZipMemberListing(listing, expectedBytes);
    runSevenZip(sevenZip, [
      "x", "-y", "-bd", "-bso0", "-bsp0", "-bse0", `-o${outputDir}`, archivePath,
    ]);
    const extracted = fs.readdir(outputDir).filter((name) => name !== "." && name !== "..");
    if (extracted.length !== 1 || extracted[0] !== "payload.json") {
      throw new Error("Invalid 7z/LZMA2 payload; the archive must contain only payload.json.");
    }
    const lstat = fs.lstat(outputPath);
    if (fs.isLink(lstat.mode) || !fs.isFile(lstat.mode)) {
      throw new Error("The v2 LZMA2 payload must be a regular file.");
    }
    const stat = fs.stat(outputPath);
    if (stat.size !== expectedBytes || stat.size > V2_MAX_JSON_BYTES) {
      throw new Error("The v2 LZMA2 payload length does not match its authenticated header.");
    }
    return new Uint8Array(fs.readFile(outputPath));
  } finally {
    removeSevenZipTree(fs, runRoot);
  }
}

function makeV2Frame(codec: number, originalBytes: number, payload: Uint8Array): Uint8Array {
  const frame = new Uint8Array(V2_FRAME_HEADER_BYTES + payload.length);
  frame.set(V2_FRAME_MAGIC, 0);
  frame[4] = codec;
  new DataView(frame.buffer).setUint32(5, originalBytes, false);
  frame.set(payload, V2_FRAME_HEADER_BYTES);
  return frame;
}

/** Encrypt JSON into the opt-in v2 envelope; v1 remains unchanged and readable. */
export async function encryptVaultFileV2(
  value: unknown,
  password: string,
  options: VaultFileV2Options = {},
): Promise<string> {
  const serialized = JSON.stringify(value, null, 2);
  if (serialized === undefined) throw new TypeError("Vault payload is not JSON-serialisable.");
  const json = new TextEncoder().encode(serialized);
  if (json.byteLength > V2_MAX_JSON_BYTES) throw new Error("JSON payload exceeds the v2 size limit.");
  const mode = options.compression ?? "auto";
  if (!["none", "lzma2", "auto"].includes(mode)) throw new Error("Unsupported v2 compression mode.");

  let codec = V2_CODEC_NONE;
  let payload: Uint8Array<ArrayBufferLike> = json;
  if (mode !== "none") {
    const archive = await compressJsonWithLzma2(json);
    if (mode === "lzma2" || archive.byteLength < json.byteLength) {
      codec = V2_CODEC_7Z_LZMA2;
      payload = archive;
    }
  }

  const salt = options.salt ? new Uint8Array(options.salt) : randomBytes(16);
  const iv = options.iv ? new Uint8Array(options.iv) : randomBytes(12);
  if (salt.length !== 16 || iv.length !== 12) throw new Error("Invalid v2 salt or IV length.");
  const key = deriveKey(password, salt);
  const frame = makeV2Frame(codec, json.byteLength, payload);
  const ciphertext = gcm(key, iv).encrypt(frame);
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(ciphertext, salt.length + iv.length);
  return VAULT_FILE_V2_MAGIC + toB64(packed);
}

/** Decrypt and authenticate a v2 file, then unpack its optional 7z/LZMA2 frame. */
export async function decryptVaultFileV2(blob: string, password: string): Promise<unknown> {
  const trimmed = blob.trim();
  if (!trimmed.startsWith(VAULT_FILE_V2_MAGIC)) throw new Error("Not a haiku-vault-v2 file.");
  const body = trimmed.slice(VAULT_FILE_V2_MAGIC.length);
  const maxPacked = 16 + 12 + 16 + V2_FRAME_HEADER_BYTES + V2_MAX_ARCHIVE_BYTES;
  if (body.length > Math.ceil(maxPacked / 3) * 4) throw new Error("Vault file exceeds the v2 size limit.");
  let packed: Uint8Array;
  try {
    packed = fromB64(body);
  } catch {
    throw new Error("Vault body is not valid Base64.");
  }
  if (packed.length < 16 + 12 + 16 + V2_FRAME_HEADER_BYTES) {
    throw new Error("Vault body is too short for v2.");
  }
  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const ciphertext = packed.slice(28);
  let frame: Uint8Array;
  try {
    frame = gcm(deriveKey(password, salt), iv).decrypt(ciphertext);
  } catch {
    throw new Error("Vault authentication failed (wrong password or tampered data).");
  }
  if (frame.length < V2_FRAME_HEADER_BYTES || !V2_FRAME_MAGIC.every((byte, index) => frame[index] === byte)) {
    throw new Error("Authenticated v2 frame header is invalid.");
  }
  const codec = frame[4];
  const expectedBytes = new DataView(frame.buffer, frame.byteOffset, frame.byteLength).getUint32(5, false);
  if (expectedBytes > V2_MAX_JSON_BYTES) throw new Error("JSON payload exceeds the v2 size limit.");
  const payload = frame.slice(V2_FRAME_HEADER_BYTES);
  let json: Uint8Array;
  if (codec === V2_CODEC_NONE) {
    if (payload.byteLength !== expectedBytes) throw new Error("The v2 payload length does not match its header.");
    json = payload;
  } else if (codec === V2_CODEC_7Z_LZMA2) {
    json = await decompressJsonWithLzma2(payload, expectedBytes);
  } else {
    throw new Error(`Unsupported v2 compression codec ${codec}.`);
  }
  try {
    return JSON.parse(new TextDecoder().decode(json));
  } catch {
    throw new Error("Decrypted v2 payload is not valid JSON.");
  }
}

export function downloadVaultFile(value: unknown, password: string) {
  download(
    encryptVaultFile(value, password),
    `haiku-vault-${new Date().toISOString().slice(0, 10)}.haikuvault`,
    "text/plain"
  );
}

export async function downloadVaultFileV2(
  value: unknown,
  password: string,
  options: VaultFileV2Options = {},
): Promise<void> {
  const text = await encryptVaultFileV2(value, password, options);
  download(
    text,
    `haiku-vault-v2-${new Date().toISOString().slice(0, 10)}.haikuvault`,
    "text/plain",
  );
}

/**
 * A self-contained decryptor page: no imports, no network, no scripts loaded
 * from anywhere — save it next to the vault file and open it from a USB stick.
 * Re-derives the key with native WebCrypto and only ever shows the plaintext
 * locally. Generated with the vault blob optionally pre-embedded.
 */
export function standaloneDecryptorHtml(embeddedBlob?: string): string {
  const embedded = embeddedBlob
    ? JSON.stringify(embeddedBlob)
    : "null";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Haiku Vault Decryptor</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#09090b; color:#e4e4e7; margin:0; padding:2rem 1rem; }
  main { max-width: 46rem; margin: 0 auto; }
  h1 { font-size: 1.1rem; color:#a1a1aa; letter-spacing:.08em; text-transform:uppercase; }
  p { color:#a1a1aa; font-size:.85rem; line-height:1.5; }
  input[type=file], input[type=password] { width:100%; box-sizing:border-box; margin:.4rem 0 1rem; padding:.6rem; background:#18181b; color:#e4e4e7; border:1px solid #3f3f46; border-radius:.5rem; }
  textarea { width:100%; box-sizing:border-box; min-height:18rem; margin-top:.5rem; padding:.6rem; background:#18181b; color:#e4e4e7; border:1px solid #3f3f46; border-radius:.5rem; font-family:inherit; font-size:.75rem; }
  button { padding:.6rem 1.2rem; background:#18181b; color:#e4e4e7; border:1px solid #52525b; border-radius:.5rem; cursor:pointer; }
  button:hover { border-color:#a1a1aa; }
  .ok { color:#34d399; } .bad { color:#f87171; }
  pre { white-space:pre-wrap; word-break:break-all; }
</style>
</head>
<body>
<main>
  <h1>Haiku Vault Decryptor</h1>
  <p>Decrypts <code>haiku-vault-v1.*</code> files produced by the BIP-39 Haiku
  Workbench (PBKDF2-SHA256 &times; 120,000, AES-256-GCM; salt 16 &hairsp;|&hairsp;
  IV 12 &hairsp;|&hairsp; ciphertext+tag). Everything runs locally in this page
  &mdash; it loads nothing and talks to nobody.</p>
  <label>Vault file${embeddedBlob ? " (pre-loaded &mdash; you can replace it)" : ""}</label>
  <input type="file" id="file" accept=".haikuvault,text/plain">
  <label>Vault password (your Ens&#333; ID)</label>
  <input type="password" id="pass" autocomplete="off" spellcheck="false">
  <button id="go">Decrypt</button>
  <button id="save" hidden>Download plaintext JSON</button>
  <p id="status"></p>
  <textarea id="out" spellcheck="false" placeholder="plaintext appears here"></textarea>
</main>
<script>
(() => {
  "use strict";
  const MAGIC = ${JSON.stringify(VAULT_FILE_MAGIC)};
  const ITERS = ${String(PBKDF2_ITERATIONS)};
  let blob = ${embedded};
  let plain = null;
  const $ = (id) => document.getElementById(id);
  const b64ToBytes = (b64) => Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0));
  $("file").addEventListener("change", async () => {
    blob = await $("file").files[0]?.text() ?? null;
    $("status").textContent = blob ? "File loaded." : "";
  });
  $("go").addEventListener("click", async () => {
    $("status").className = ""; $("status").textContent = "Deriving key (120k PBKDF2)\u2026";
    try {
      if (!blob) throw new Error("Load a vault file first.");
      const body = blob.trim().startsWith(MAGIC) ? blob.trim().slice(MAGIC.length) : blob.trim();
      const packed = b64ToBytes(body);
      if (packed[0] !== 1 || packed.length < 46) throw new Error("Not a haiku-vault-v1 file.");
      const pass = new TextEncoder().encode($("pass").value || "default-vault-key");
      const base = await crypto.subtle.importKey("raw", pass, "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: packed.slice(1, 17), iterations: ITERS, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const pt = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: packed.slice(17, 29) }, key, packed.slice(29));
      plain = new TextDecoder().decode(pt);
      $("out").value = plain;
      $("save").hidden = false;
      $("status").className = "ok"; $("status").textContent = "Decrypted.";
    } catch (e) {
      plain = null; $("save").hidden = true;
      $("status").className = "bad";
      $("status").textContent = "Failed: " + (e.message || e) + " (wrong password?)";
    }
  });
  $("save").addEventListener("click", () => {
    if (plain == null) return;
    const url = URL.createObjectURL(new Blob([plain], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = "haiku-vault-plain.json"; a.click();
    URL.revokeObjectURL(url);
  });
})();
</script>
</body>
</html>
`;
}

export function downloadStandaloneDecryptor(embeddedBlob?: string) {
  download(
    standaloneDecryptorHtml(embeddedBlob),
    "haiku-vault-decryptor.html",
    "text/html"
  );
}
