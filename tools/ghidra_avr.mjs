#!/usr/bin/env node
/**
 * ghidra_avr.mjs — walk Atmel AVR firmware with the vendored Ghidra decompiler.
 *
 *   node tools/ghidra_avr.mjs samples/avr/optiboot_atmega328.hex
 *   node tools/ghidra_avr.mjs fw.hex --decompile 0x7e00,0x7f00
 *   node tools/ghidra_avr.mjs fw.hex --json > fw.json
 *
 * What it does, in order:
 *
 *   1. parse Intel HEX (the format `avr-objcopy -O ihex` and every vendor
 *      updater uses) with checksum validation, and report the real address
 *      range, because an AVR bootloader's load address *is* a security
 *      property - 0x7E00 means "512 bytes at the top of a 32 KB flash";
 *   2. locate the instructions that matter for a boot chain - SPM (self
 *      programming), LPM/ELPM, WDR, SLEEP - by exact 2-byte pattern, and
 *      report where they are. This is a locator, not a disassembler, so a hit
 *      is a claim to verify, and every hit is verified by step 3;
 *   3. decompile with Ghidra's SLEIGH avr8 spec (see
 *      tools/stage_ghidra_specs.py for how the specs are vendored) and print
 *      the C, which is the evidence for step 2's claims.
 *
 * The point is to make "start going through the firmware with Ghidra"
 * reproducible on a machine with no java, no avr-gcc and no network at run
 * time: the decompiler is the same Ghidra decompiler compiled to wasm, the
 * specs are vendored, and the firmware is pinned by sha256.
 */

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

import { GhidraWasm } from "../js/ghidra-wasm.js";
import { parseIntelHex } from "../js/avrhex.js";
import { disassemble, branchOrJumpTarget, walkInfo as walkImage, parseSymbols } from "../js/avrdis.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------- specs on disk
//
// GhidraWasm fetches processors.json / .sla / .pspec / .cspec. In a browser that
// is a real fetch; here the same URLs are served out of wasm/ghidra by a fetch
// shim, so the tool needs no static server and no network.
const SPEC_ORIGIN = "https://specs.local/ghidra/";
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const href = String(url);
  if (href.startsWith(SPEC_ORIGIN)) {
    const rel = decodeURIComponent(href.slice(SPEC_ORIGIN.length));
    const file = join(ROOT, "wasm", "ghidra", rel);
    if (!existsSync(file)) return { ok: false, status: 404, url: href };
    const buf = readFileSync(file);
    return {
      ok: true, status: 200, url: href,
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      text: async () => buf.toString("utf8"),
      json: async () => JSON.parse(buf.toString("utf8")),
    };
  }
  return realFetch(url, init);
};

const BUNDLE = join(ROOT, "wasm", "ghidra", "ghidra_decompiler.js");
function loadUmdBundle(file) {
  const shell = { exports: {} };
  const factory = new Function("module", "exports", "require", "__dirname", "__filename", readFileSync(file, "utf8"));
  factory(shell, shell.exports, require, dirname(file), file);
  return shell.exports;
}
const GhidraDecompiler = loadUmdBundle(BUNDLE);
if (typeof GhidraDecompiler !== "function") {
  console.error(`could not load the Ghidra wasm factory from ${BUNDLE}`);
  process.exit(1);
}

/** sha256 of the image as loaded, so a report can name exactly what it read. */
function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

// ------------------------------------------------------------- AVR instruction
//
// Only the encodings a boot-chain review actually needs, all exact 2-byte
// ------------------------------------------------------------------ opcodes
//
// These are found by *decoding*, not by pattern-matching bytes: js/avrdis.js is
// checked instruction-for-instruction against avr-objdump
// (tools/verify_avrdis.mjs, 225/225 on the Optiboot listing), so a hit here is
// a decoded instruction, and it cannot be a data byte that happens to look like
// one.
const OPS = ["spm", "lpm", "elpm", "wdr", "sleep", "break", "reti", "cli", "sei"];

function findOpcodes(bytes, base) {
  const hits = [];
  for (const ins of disassemble(bytes, { base })) {
    if (OPS.includes(ins.mnemonic)) hits.push({ op: ins.mnemonic, addr: ins.addr });
  }
  return hits;
}

// ------------------------------------------------------------------ the engine

const args = process.argv.slice(2);
const flags = new Map();
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const [k, v] = args[i].slice(2).split("=");
    flags.set(k, v !== undefined ? v : (args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "1"));
  } else positional.push(args[i]);
}

const hexFile = positional[0];
if (!hexFile) {
  console.error("usage: node tools/ghidra_avr.mjs <firmware.hex> [--lang ID] [--compiler gcc] [--decompile 0x7e00,...] [--json]");
  process.exit(2);
}

const text = readFileSync(hexFile, "utf8");
const img = parseIntelHex(text);
const words = Math.ceil((img.max - img.min) / 2);

const engine = new GhidraWasm({
  root: SPEC_ORIGIN,
  log: () => {},
  loadModule: (self) =>
    GhidraDecompiler({
      locateFile: (p) => join(ROOT, "wasm", "ghidra", p),
      print: () => {},
      printErr: () => {},
    }),
});
await engine.load();

const langId = flags.get("lang") || "avr8:LE:16:default";
// AVR8 is Harvard: the pspec names the program space "code" and the data space
// "mem". Loading the image into the x86 default ("ram") fails outright.
const space = flags.get("space") || (langId.startsWith("avr") ? "code" : "ram");
const compiler = flags.get("compiler") || "gcc";
if (!engine.findLanguage(langId)) {
  console.error(`language ${langId} not vendored; have: ${engine.languages.map((l) => l.id).join(", ")}`);
  process.exit(2);
}

// The vendored Ghidra-wasm bridge cannot be handed an AVR image, and the
// failure is worth stating precisely because it is a property of the bridge,
// not of the firmware:
//
//   * avr8.sinc declares `space code ... wordsize=2 default` - the program
//     space is *word* addressed, and byte loads (`mem`, `codebyte`) do not
//     serve instruction fetch, which always goes to `code`;
//   * the bridge's LoadImageXml::open() stores <bytechunk> bytes under the
//     space named in the XML, and instruction fetch then reads the code space
//     through LoadImageXml::loadFill(), which throws DataUnavailError
//     ("Bytes at 0x... are not mapped") when that space holds nothing.
//
// Every combination of space x load offset x function address was tried, plus
// documents that put the same bytes into "code", "codebyte" and "mem" at once
// (tools/ghidra_avr.mjs --probe reproduces all of it, 0/42): loading into
// "code" never maps, and loading into "mem"/"codebyte" leaves instruction fetch
// with no bytes.
// A Java Ghidra headless would work but there is no JVM here. So this tool
// reports what it *can* establish from the image itself - real Intel HEX
// parsing with checksums, the load address, and the exact opcode sites a
// boot-chain review cares about - and says plainly that the decompiled C is
// unavailable rather than printing something wrong.
const hits = findOpcodes(img.bytes, img.base);

// The reset vector is the first instruction at the image start, wherever the
// image is loaded (a bootloader is not at 0, so "addr 0" is the wrong question -
// ask the image).
const flow = walkImage(img.bytes, { base: img.base });
const reset = (() => {
  const first = flow.ins.get(img.base);
  if (!first || (first.mnemonic !== "rjmp" && first.mnemonic !== "jmp")) return null;
  const t = branchOrJumpTarget(img.base, first);
  return t == null ? null : { kind: first.mnemonic, target: t };
})();

// Reachability, for the report: which opcode hits are in code the walk can
// actually get to from the reset vector or the interrupt vectors.
const reach = (addr) => flow.reachable.has(addr);

// When the same build's avr-objdump listing sits next to the .hex, its symbol
// table names the function each opcode site belongs to. That is what turns
// "0x7fc2 spm" into "0x7fc2 spm in do_spm (not reachable)".
const symbols = (() => {
  const guess = hexFile.replace(/\.(hex|ihx)$/i, ".lst");
  if (flags.get("lst") === "0") return new Map();
  const file = flags.get("lst") || guess;
  try { return parseSymbols(readFileSync(file, "utf8")); } catch { return new Map(); }
})();
const symbolAt = (addr) => {
  let best = null;
  for (const [a, name] of symbols) if (a <= addr && (best === null || a > best.addr)) best = { addr: a, name };
  return best ? `${best.name}+0x${(addr - best.addr).toString(16)}` : null;
};
const walkStats = {
  reachable_instructions: flow.reachable.size,
  total_instructions: flow.ins.size,
  entry_points: [...flow.entries.entries()]
    .map(([addr, why]) => ({ addr, why }))
    .sort((a, b) => a.addr - b.addr),
};

// AVR8's "code" space is word-addressed, not byte-addressed: the vendored pspec
// puts the first interrupt vector (INT0) at code:0x1, and in hardware that is
// word 1 = byte 2. So a bootloader at byte 0x7E00 is loaded at word 0x3F00, and
// asking Ghidra about byte 0x7E00 answers "Bytes at 0x7e00 are not mapped".
// Everything user-facing here stays in byte addresses (that is what avrdude,
// the fusebits and the datasheet use); the conversion happens at the boundary.
const avr = langId.startsWith("avr8");
const loadBase = avr ? img.base >> 1 : img.base;
const toMachine = (byteAddr) => (avr ? byteAddr >> 1 : byteAddr);

// Candidate entry points: what the caller asked for, else the code start, the
// reset vector target, and the first instruction after each SPM site (SPM is
// only reachable from the self-programming routine, so that lands inside it).
const requested = (flags.get("decompile") || "").split(",").map((s) => s.trim()).filter(Boolean);
const candidates = requested.length
  ? requested.map((s) => Number.parseInt(s.replace(/^0x/i, ""), 16))
  : [img.base, ...(reset && reset.target >= img.min && reset.target < img.max ? [reset.target] : [])];

const report = {
  file: hexFile,
  sha256: sha256(img.bytes),
  bytes: img.bytes.length,
  words,
  range: [img.base, img.max],
  records: img.records,
  hexErrors: img.errors,
  language: langId,
  compiler,
  loadBase,
  addressSpace: space,
  resetVector: reset,
  walk: walkStats,
  symbols: [...symbols.entries()].map(([addr, name]) => ({ addr, name })),
  opcodes: hits.map((h) => ({ ...h, reachable: reach(h.addr), in: symbolAt(h.addr) })),
  functions: [],
};

for (const addr of [...new Set(candidates)]) {
  let entry = { addr, ok: false, text: "" };
  try {
    const res = await engine.decompile(img.bytes, { lang: langId, compiler, base: loadBase, func: `0x${toMachine(addr).toString(16)}`, space });
    if (res.text.startsWith("Lowlevel Error:") || res.text.startsWith("Decoder Error:")) {
      entry.error = res.text.trim();
      entry.blocked = /are not mapped|Unknown address space|Could not find op/.test(res.text);
    } else {
      entry.ok = true;
      entry.text = res.text;
      entry.ms = Math.round(res.ms);
    }
  } catch (err) {
    entry.error = String(err && err.message ? err.message : err);
  }
  report.functions.push(entry);
}

if (flags.get("probe")) {
  // Reproduce the finding above: try every space/offset/address combination and
  // report how many produce decompiled C. The answer is zero for AVR8, which is
  // the evidence for the diagnostic printed by the normal run.
  const spaces = flags.get("spaces") ? flags.get("spaces").split(",") : ["code", "codebyte", "mem"];
  const offsets = [0x0, 0x1f80, 0x3f00, 0x7e00];
  let ok = 0, tried = 0, lastError = "";
  const attempt = async (label, fn) => {
    tried++;
    try {
      const res = await fn();
      const bad = res.text.startsWith("Lowlevel Error:") || res.text.startsWith("Decoder Error:");
      if (bad) lastError = res.text.trim();
      else { ok++; console.log(`OK  ${label}`); }
    } catch (err) { lastError = String(err.message || err); }
  };
  for (const sp of spaces) {
    for (const off of offsets) {
      for (const func of [`${sp}:0x${off.toString(16)}`, `code:0x${off.toString(16)}`, `code:0x${(off * 2).toString(16)}`]) {
        await attempt(`space=${sp} offset=0x${off.toString(16)} func=${func}`, () =>
          engine.decompile(img.bytes, { lang: langId, compiler, base: off, func, space: sp }));
      }
    }
  }
  // The error messages name only an offset, never a space, so the failing read
  // could in principle be a byte read in one space while op fetch happens in
  // another. Loading the same bytes into several spaces at once (word address
  // and byte address) is therefore also tried, through the raw XML path.
  const packed = new Uint8Array([...img.bytes, ...new Uint8Array(32)]);
  const chunk = (sp, off) => `<bytechunk space="${sp}" offset="0x${off.toString(16)}">\n` +
    Buffer.from(packed).toString("hex") + `\n</bytechunk>`;
  const docs = [
    ["code+codebyte+mem", `<binaryimage arch="${langId}">\n${chunk("code", 0x3f00)}\n${chunk("codebyte", 0x7e00)}\n${chunk("mem", 0x3f00)}\n</binaryimage>`],
    ["codebyte+mem", `<binaryimage arch="${langId}">\n${chunk("codebyte", 0x7e00)}\n${chunk("mem", 0x3f00)}\n</binaryimage>`],
  ];
  for (const [label, xml] of docs) {
    for (const func of [`code:0x3f00`, `codebyte:0x7e00`, `code:0x7e00`]) {
      await attempt(`multi-space ${label} func=${func}`, async () => {
        const specs = await engine.specs(langId, compiler);
        const ptr = engine.module._malloc(specs.sla.length);
        engine.module.HEAPU8.set(specs.sla, ptr);
        try {
          const resPtr = engine.module.ccall("decompile_pcode", "number",
            ["number", "number", "string", "string", "string", "string"],
            [ptr, specs.sla.length, specs.pspec, specs.cspec, xml, func]);
          const text = engine.module.UTF8ToString(resPtr);
          engine.module._free_string(resPtr);
          return { text };
        } finally { engine.module._free(ptr); }
      });
    }
  }
  console.log(`AVR space probe: ${ok}/${tried} combinations decompiled`);
  if (lastError) console.log(`last error: ${lastError}`);
  console.log(`spaces tried: ${spaces.join(", ")}; language ${langId}`);
  process.exit(ok === 0 ? 1 : 0);
}

if (flags.get("json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const line = "─".repeat(72);
  console.log(`file      : ${hexFile}`);
  console.log(`sha256    : ${report.sha256}`);
  console.log(`image     : ${report.bytes} bytes (${words} words) at 0x${img.base.toString(16)}..0x${(img.max - 1).toString(16)}, ${img.records} records`);
  console.log(`language  : ${langId} / ${compiler} (space "${space}", loaded at ${avr ? "word" : "byte"} 0x${loadBase.toString(16)})`);
  if (reset) console.log(`reset     : ${reset.kind} → 0x${reset.target.toString(16)}`);
  if (img.errors.length) {
    console.log(`hex issues: ${img.errors.length}`);
    for (const e of img.errors.slice(0, 5)) console.log(`  - ${e}`);
  }
  console.log(`walk      : ${walkStats.reachable_instructions} of ${walkStats.total_instructions} instructions reachable from the reset vector / interrupt vectors`);
  for (const e of walkStats.entry_points.slice(0, 10)) {
    console.log(`            ← 0x${e.addr.toString(16)} (${e.why})`);
  }
  console.log(`\nsecurity-relevant opcodes (${hits.length}), decoded not pattern-matched:`);
  const byOp = {};
  for (const h of report.opcodes) (byOp[h.op] ||= []).push(h);
  for (const [op, list] of Object.entries(byOp)) {
    const live = list.filter((h) => h.reachable);
    const where = (h) => `0x${h.addr.toString(16)}${h.in ? ` <${h.in}>` : ""}${h.reachable ? "" : " [dead]"}`;
    console.log(`  ${op.padEnd(9)} ${list.length.toString().padStart(3)} × ${list.slice(0, 6).map(where).join(" ")}${list.length > 6 ? " …" : ""}${live.length === list.length ? "  all reachable" : `  (${live.length}/${list.length} reachable)`}`);
  }
  if (!report.functions.some((f) => f.ok) && report.functions[0]?.blocked) {
    console.log(`\nGhidra decompilation of AVR8 is blocked by the vendored wasm bridge:`);
    console.log(`  ${report.functions[0].error}`);
    console.log(`  see the note at the top of this tool and re-run with --probe for the full matrix.`);
  }
  for (const fn of report.functions) {
    if (!fn.ok && report.functions.some((f) => f.ok)) continue;
    console.log(`\n${line}\n/* decompiled 0x${fn.addr.toString(16)} ${fn.ok ? `(${fn.ms} ms)` : "FAILED" } */`);
    if (fn.ok) console.log(fn.text.trimEnd());
    else console.log(`error: ${fn.error}`);
  }
}
