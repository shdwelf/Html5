#!/usr/bin/env node
/**
 * verify_ghidra.mjs — prove the vendored Ghidra wasm actually decompiles the
 * samples, headlessly, using the same loader the page uses.
 *
 *   node tools/serve.mjs 8099 &          # any static server works; specs are
 *   node tools/verify_ghidra.mjs 8099    # fetched over HTTP like in a browser
 *
 * For every sample that has a binary in the catalog it will:
 *   - fetch processors.json + the SLA/PSPEC/CSPEC files over HTTP
 *   - decompile the entry point and every named label the catalog knows about
 *   - report which ones produced real C and which produced Ghidra's refusal
 *     messages (an entry point in the middle of a data blob legitimately does)
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { GhidraWasm } from "../js/ghidra-wasm.js";
import { analyze, bootSectorInfo } from "../js/x86dis.js";
import { ANALYZABLE } from "../js/virus-catalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const PORT = Number(process.argv[2] || process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;

const GhidraDecompiler = require(join(ROOT, "wasm", "ghidra", "ghidra_decompiler.js"));

const engine = new GhidraWasm({
  root: `${BASE}/wasm/ghidra/`,
  log: () => {},
  loadModule: (self) =>
    GhidraDecompiler({
      locateFile: (p) => join(ROOT, "wasm", "ghidra", p),
      print: () => {},
      printErr: () => {},
    }),
});

await engine.load();
console.log(`engine ready · ${engine.languages.length} languages: ${engine.languages.map((l) => l.id).join(", ")}\n`);

let failures = 0;
let totalFuncs = 0;

for (const sample of ANALYZABLE) {
  const bytes = new Uint8Array(readFileSync(join(ROOT, sample.binary)));
  const base = Number.parseInt(sample.base, 16);
  const boot = bytes.length === 512 ? bootSectorInfo(bytes) : null;
  const analysis = analyze(bytes, {
    base,
    entries: [Number.parseInt(sample.entry, 16)],
    dataRanges: boot && boot.magic ? [[0x1be, 0x200]] : [],
  });

  // Only code addresses are worth handing to a decompiler; the catalog also
  // carries labels for data (partition table, string tables, ...).
  const targets = [{ label: "entry", addr: sample.entry }];
  const skipped = [];
  for (const a of sample.annotations || []) {
    if (a.addr === sample.entry) continue;
    const insn = analysis.insns.get(Number.parseInt(a.addr, 16));
    if (insn && !insn.data) targets.push({ label: a.label, addr: a.addr });
    else skipped.push(a.label);
  }
  if (skipped.length) console.log(`   (skipping data labels: ${skipped.join(", ")})`);

  console.log(`── ${sample.name} (${bytes.length} bytes @ ${sample.base}, ${sample.lang})`);
  let ok = 0;
  for (const t of targets) {
    totalFuncs++;
    try {
      const res = await engine.decompile(bytes, {
        lang: sample.lang,
        compiler: sample.compiler,
        base: sample.base,
        func: t.addr,
      });
      const lines = res.text.split("\n");
      const isError = /^(\/\*\s*)?(Error|Lowlevel Error|Decoder Error|Standard Exception)/m.test(res.text) || /^Error:/.test(res.text.trim());
      if (isError) {
        failures++;
        console.log(`   ✗ ${t.label.padEnd(20)} ${t.addr}  ${lines[0].slice(0, 88)}`);
      } else {
        ok++;
        console.log(`   ✓ ${t.label.padEnd(20)} ${t.addr}  ${String(lines.length).padStart(4)} lines in ${res.ms.toFixed(0)} ms`);
      }
    } catch (err) {
      failures++;
      console.log(`   ✗ ${t.label.padEnd(20)} ${t.addr}  threw: ${err.message}`);
    }
  }
  console.log(`   → ${ok}/${targets.length} decompiled\n`);
}

console.log(`${totalFuncs - failures}/${totalFuncs} functions produced C · wasm time ${engine.stats.ms.toFixed(0)} ms`);
process.exit(failures > 0 && failures === totalFuncs ? 1 : 0);
