#!/usr/bin/env node
/**
 * decompile_mz.mjs — run the vendored Ghidra WASM decompiler headlessly over a
 * 16-bit DOS MZ executable, with no JVM and no network.
 *
 * Protection schemes (LZEXE 0.91, PKLITE, EXEPACK, polymorphic decryptors…)
 * put a small unpacking stub at the MZ entry point; this tool loads the image
 * flat at a fixed base with the `x86:LE:16:Real Mode` SLEIGH spec and hands the
 * entry address to the decompiler, exactly like the browser lab does.
 *
 * The 16-bit segment arithmetic of the DOS loader is honoured when resolving
 * `entry`: entry_seg = (load_seg + e_cs) & 0xFFFF, then linear =
 * entry_seg*16 + e_ip.  That is what makes PKLITE's cs=0xFFF0 trick (entry
 * wrapping back to image offset 0) resolve correctly.
 *
 *   node tools/decompile_mz.mjs <mzfile> [entry|0xADDR[,0xADDR...]] [--list FROM:TO] [--bytes N]
 *
 *   --list FROM:TO   disassemble linear address range with js/x86dis.js
 *   --bytes N        also hexdump N bytes at each decompiled function (default 0)
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

// ---- MZ parse ---------------------------------------------------------------
const BASE = 0x10000;          // linear base of the load image (load_seg = 0x1000)
const LOAD_SEG = 0x1000;

function parseMz(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint16(0, true) !== 0x5a4d) throw new Error("not an MZ executable");
  const u16 = (o) => dv.getUint16(o, true);
  const h = {
    cblp: u16(2), cp: u16(4), crlc: u16(6), cparhdr: u16(8),
    minalloc: u16(10), maxalloc: u16(12), ss: u16(14), sp: u16(16),
    csum: u16(18), ip: u16(20), cs: u16(22), lfarlc: u16(24), ovno: u16(26),
  };
  h.imageBytes = (h.cp - 1) * 512 + (h.cblp || 512) - h.cparhdr * 16;
  h.image = buf.slice(h.cparhdr * 16);
  // DOS loader: entry_seg = (load_seg + e_cs) & 0xFFFF; linear = entry_seg*16 + e_ip
  h.entry = ((((LOAD_SEG + h.cs) & 0xffff) * 16) + h.ip) >>> 0;
  h.entryOff = h.entry - BASE;
  return h;
}

const [file, funcArg = "entry", ...rest] = process.argv.slice(2);
if (!file) { console.error("usage: decompile_mz.mjs <mzfile> [entry|0xADDR[,0xADDR...]] [--list FROM:TO]"); process.exit(2); }
const flags = new Map();
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith("--")) flags.set(rest[i].slice(2), rest[i + 1]);

const bytes = new Uint8Array(readFileSync(file));
const mz = parseMz(bytes);
const lang = "x86:LE:16:Real Mode";
const compiler = "default";

console.error(`# ${file}`);
console.error(`# MZ: pages=${mz.cp} lastPage=${mz.cblp} relo=${mz.crlc} hdrParas=${mz.cparhdr} (image @file 0x${(mz.cparhdr * 16).toString(16)})`);
console.error(`#     minalloc=${mz.minalloc} maxalloc=${mz.maxalloc} ss:sp=0x${mz.ss.toString(16)}:0x${mz.sp.toString(16)}`);
console.error(`#     entry cs:ip=0x${mz.cs.toString(16)}:0x${mz.ip.toString(16)} -> linear 0x${mz.entry.toString(16)} (image +0x${mz.entryOff.toString(16)})`);
console.error(`#     load image ≈ 0x${mz.imageBytes.toString(16)} bytes, file image ${mz.image.length} bytes, base=0x${BASE.toString(16)} lang=${lang}`);

if (flags.has("list")) {
  const [from, to] = flags.get("list").split(":").map((s) => Number.parseInt(s, 16));
  const start = Math.max(0, from - BASE), end = Math.min(mz.image.length, to - BASE);
  const a = analyze(mz.image.slice(start, end), { base: from, entries: [from], mode: 16, maxInsns: 100000 });
  for (const addr of a.order) {
    const ins = a.insns.get(addr);
    const raw = (ins.bytes || mz.image.slice(ins.ip - from, ins.ip - from + ins.len));
    console.log(`${ins.ip.toString(16).padStart(5, "0")}  ${Array.from(raw, (b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(20)}  ${ins.repr}`);
  }
  process.exit(0);
}

const funcs = funcArg === "entry" ? [mz.entry] : funcArg.split(",").map((s) => Number.parseInt(s, 16));
const engine = new GhidraWasm({ root: SPEC_ORIGIN, log: () => {},
  loadModule: () => GhidraDecompiler({ locateFile: (p) => join(ROOT, "wasm", "ghidra", p), print: () => {}, printErr: () => {} }) });
await engine.load();
for (const f of funcs) {
  const r = await engine.decompile(mz.image, { lang, compiler, base: BASE, func: f });
  console.log(`\n/* ==== 0x${f.toString(16)}  (${lang}, ${r.compiler}, ${Math.round(r.ms)} ms) ==== */`);
  console.log(r.text.trim());
}
