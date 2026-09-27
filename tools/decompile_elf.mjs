#!/usr/bin/env node
/**
 * decompile_elf.mjs — run the vendored Ghidra WASM decompiler (wasm/ghidra/)
 * headlessly over a real ELF, with no JVM and no network.
 *
 * The in-repo wasm bridge does a FLAT load, so we load the whole file at
 * base = (p_vaddr - p_offset) of the executable PT_LOAD segment; then any file
 * offset f maps to virtual address base+f inside that segment, and a function
 * at virtual address V is decompiled by passing func=V.
 *
 *   node tools/decompile_elf.mjs <elf> <funcAddr[,funcAddr...]|entry> [--lang ID] [--compiler gcc]
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { GhidraWasm } from "../js/ghidra-wasm.js";

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
if (typeof GhidraDecompiler !== "function") { console.error("bundle load failed"); process.exit(1); }

// ---- minimal ELF64 parse: entry + executable PT_LOAD base ----
function parseElf(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0) !== 0x7f454c46) throw new Error("not ELF");
  const is64 = buf[4] === 2, le = buf[5] === 1;
  if (!is64) throw new Error("only ELF64 supported here");
  const u16 = (o) => dv.getUint16(o, le), u32 = (o) => dv.getUint32(o, le);
  const u64 = (o) => Number(dv.getBigUint64(o, le));
  const machine = u16(18), entry = u64(24), phoff = u64(32), phentsize = u16(54), phnum = u16(56);
  let execBase = null;
  for (let i = 0; i < phnum; i++) {
    const o = phoff + i * phentsize;
    const type = u32(o), flags = u32(o + 4), off = u64(o + 8), vaddr = u64(o + 16);
    if (type === 1 && (flags & 1)) { execBase = vaddr - off; break; } // PT_LOAD & PF_X
  }
  const langByMachine = { 0x3e: "x86:LE:64:default", 0x03: "x86:LE:32:default" };
  return { machine, entry, execBase: execBase ?? 0, lang: langByMachine[machine] || "x86:LE:64:default" };
}

const [file, funcArg, ...rest] = process.argv.slice(2);
if (!file || !funcArg) { console.error("usage: decompile_elf.mjs <elf> <addr[,addr]|entry> [--lang ID] [--compiler gcc]"); process.exit(2); }
const flags = new Map();
for (let i = 0; i < rest.length; i++) if (rest[i].startsWith("--")) flags.set(rest[i].slice(2), rest[i + 1]);

const bytes = new Uint8Array(readFileSync(file));
const elf = parseElf(bytes);
const lang = flags.get("lang") || elf.lang;
const compiler = flags.get("compiler") || "gcc";
const base = "0x" + (elf.execBase >>> 0).toString(16);
const funcs = funcArg === "entry" ? ["0x" + elf.entry.toString(16)] : funcArg.split(",");

const engine = new GhidraWasm({ root: SPEC_ORIGIN, log: () => {},
  loadModule: () => GhidraDecompiler({ locateFile: (p) => join(ROOT, "wasm", "ghidra", p), print: () => {}, printErr: () => {} }) });
await engine.load();
console.error(`# ${file}  machine=0x${elf.machine.toString(16)} lang=${lang} base=${base} entry=0x${elf.entry.toString(16)}`);
for (const f of funcs) {
  const r = await engine.decompile(bytes, { lang, compiler, base, func: f });
  console.log(`\n/* ==== ${f}  (${lang}, ${r.compiler}, ${Math.round(r.ms)} ms) ==== */`);
  console.log(r.text.trim());
}
