#!/usr/bin/env node
/**
 * decompile_boot.mjs — run the vendored Ghidra WASM decompiler headlessly over
 * a FLAT 16-bit x86 binary: boot sectors (org 0x7C00), MBRs, and DOS .COM
 * files (org 0x100).
 *
 * Companion to decompile_mz.mjs for the parts of the DOS world that never had
 * an MZ header: the boot-sector virus corpus (Michelangelo, EXEBUG2, Stoned
 * era) and COM infectors (zippy). The bytes are mapped flat at --org with the
 * `x86:LE:16:Real Mode` SLEIGH spec and the decompiler is pointed at the first
 * instruction — for a boot sector that is the BIOS jump entry at 0x7C00.
 *
 *   node tools/decompile_boot.mjs <bin> [entry|0xADDR[,0xADDR...]]
 *                                 [--org 0x7C00] [--list FROM:TO] [--bytes N]
 *
 *   --org ADDR   load base (default 0x7C00 boot sector; use 0x100 for COM)
 *   --list FROM:TO  linear disassembly of a range via js/x86dis.js
 *   --bytes N    hexdump N bytes at each decompiled function (default 0)
 *
 * If the file is 512 bytes and ends in 55 AA it is reported as a bootable
 * sector; bootSectorInfo-style fields (OEM, partition count) are printed.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { GhidraWasm } from "../js/ghidra-wasm.js";
import { analyze } from "../js/x86dis.js";

const nreq = createRequire(import.meta.url);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_ORIGIN = "https://specs.local/ghidra/";
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const href = String(url);
  if (href.startsWith(SPEC_ORIGIN)) {
    const rel = decodeURIComponent(href.slice(SPEC_ORIGIN.length));
    const file = join(ROOT, "wasm", "ghidra", rel);
    if (!existsSync(file)) return { ok: false, status: 404, url: href };
    const buf = readFileSync(file);
    return { ok: true, status: 200, url: href,
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      text: async () => buf.toString("utf8"), json: async () => JSON.parse(buf.toString("utf8")) };
  }
  return realFetch(url, init);
};
function loadBundle(file) {
  const shell = { exports: {} };
  const factory = new Function("module", "exports", "require", "__dirname", "__filename", readFileSync(file, "utf8"));
  factory(shell, shell.exports, nreq, dirname(file), file);
  return shell.exports;
}
const GhidraDecompiler = loadBundle(join(ROOT, "wasm", "ghidra", "ghidra_decompiler.js"));

const raw = process.argv.slice(2);
const flags = new Map();
const pos = [];
for (let i = 0; i < raw.length; i++) {
  const s = raw[i];
  if (s.startsWith("--")) {
    const nxt = raw[i + 1];
    if (nxt !== undefined && !nxt.startsWith("--")) { flags.set(s.slice(2), nxt); i++; }
    else flags.set(s.slice(2), true);
  } else pos.push(s);
}
const file = pos[0];
const funcArg = pos[1] || "entry";
if (!file) { console.error("usage: decompile_boot.mjs <bin> [entry|0xADDR,...] [--org 0x7C00] [--list FROM:TO] [--bytes N]"); process.exit(2); }

const bytes = new Uint8Array(readFileSync(file));
const ORG = flags.has("org") ? Number.parseInt(flags.get("org"), 0) : 0x7c00;
const lang = "x86:LE:16:Real Mode";

console.error(`# ${file}`);
console.error(`# flat ${bytes.length} bytes at org 0x${ORG.toString(16)}  lang=${lang}`);
if (bytes.length === 512 && bytes[510] === 0x55 && bytes[511] === 0xaa) {
  const oem = String.fromCharCode(...bytes.subarray(3, 11)).replace(/[^\x20-\x7e]/g, ".");
  let parts = 0;
  for (let i = 0; i < 4; i++) { const e = 0x1be + i * 16; if (bytes[e + 4]) parts++; }
  console.error(`# boot sector: 55 AA magic, OEM "${oem}", ${parts} partition entr${parts === 1 ? "y" : "ies"}`);
}
if (ORG === 0x7c00 && bytes.length !== 512) {
  console.error(`# note: ${bytes.length} bytes at 0x7C00 is not a plain 512-byte sector (MBR + more?)`);
}

if (flags.has("list")) {
  const [from, to] = flags.get("list").split(":").map((s) => Number.parseInt(s, 16));
  const start = Math.max(0, from - ORG), end = Math.min(bytes.length, to - ORG);
  const a = analyze(bytes.slice(start, end), { base: from, entries: [from], mode: 16, maxInsns: 100000 });
  for (const addr of a.order) {
    const ins = a.insns.get(addr);
    const raw = (ins.bytes || bytes.slice(ins.ip - from, ins.ip - from + ins.len));
    console.log(`${ins.ip.toString(16).padStart(5, "0")}  ${Array.from(raw, (b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(20)}  ${ins.repr}`);
  }
  process.exit(0);
}

const funcs = funcArg === "entry" ? [ORG] : funcArg.split(",").map((s) => Number.parseInt(s, 16));
// Real-mode far calls/jmps (call far [cs:0xA], int 13h through the IVT) compute
// linear targets anywhere in the first 1 MiB; a 512-byte map makes the
// decompiler abort with "not mapped".  Map the whole 20-bit real-mode space,
// with the payload at ORG and zeros elsewhere — exactly the RAM a PC would
// have, minus whatever the IVT pointed at.
let mapped = bytes;
if (!flags.has("nopad")) {
  mapped = new Uint8Array(0x100000);
  // IRET padding: IVT/far targets land on a clean 0xCF return instead of
  // disassembling an endless run of zero-byte ADDs.
  mapped.fill(0xcf);
  mapped.set(bytes, Math.min(ORG, 0x100000 - bytes.length));
}
const engine = new GhidraWasm({ root: SPEC_ORIGIN, log: () => {},
  loadModule: () => GhidraDecompiler({ locateFile: (p) => join(ROOT, "wasm", "ghidra", p), print: () => {}, printErr: () => {} }) });
await engine.load();
for (const f of funcs) {
  // the bridge wants "0xADDR" hex strings; bare numbers are read as symbol
  // names and silently decompile the wrong (or an empty) function
  const r = await engine.decompile(mapped, { lang, compiler: "default", base: 0, func: "0x" + f.toString(16) });
  console.log(`\n/* ==== 0x${f.toString(16)}  (${lang}, ${r.compiler}, ${Math.round(r.ms)} ms) ==== */`);
  console.log(r.text.trim());
  if (flags.has("bytes")) {
    const n = Number.parseInt(flags.get("bytes"), 0);
    const off = f - ORG;
    const chunk = bytes.slice(Math.max(0, off), Math.max(0, off) + n);
    console.log(`/* bytes at 0x${f.toString(16)}: ${Array.from(chunk, (b) => b.toString(16).padStart(2, "0")).join(" ")} */`);
  }
}
