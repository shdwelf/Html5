#!/usr/bin/env node
/**
 * smoke_pipeline.mjs — exercise the DOM-free half of the lab.
 *
 *   node tools/smoke_pipeline.mjs
 *
 * Runs the exact analysis path viruslab.js uses (load bytes → analyze →
 * technique extraction → listing/entropy/strings) over every sample in the
 * catalog and prints what the UI would show. Catches crashes and empty panels
 * without needing a browser.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyze, bootSectorInfo, entropyWindows, extractTechniques,
  mnemonicHistogram, renderListing, stringsIn, hex,
} from "../js/x86dis.js";
import { SAMPLES, ANALYZABLE, TIMELINE, LESSONS } from "../js/virus-catalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let problems = 0;

// Contract check: the controller must not read a technique field the analyzer
// does not return. This is the bug class that bit us when `memoryRewrites` was
// replaced by the segment-aware maps — the UI kept compiling and silently
// rendered nothing.
{
  const controller = readFileSync(join(ROOT, "js/viruslab.js"), "utf8");
  // scope the scan to renderTechniques(), where `t` is the technique map
  const from = controller.indexOf("function renderTechniques");
  const body = controller.slice(from, controller.indexOf("\n/* ---", from));
  const shape = extractTechniques(analyze(new Uint8Array(16), { base: 0x100, org: 0x100 }));
  const known = new Set(Object.keys(shape));
  const referenced = new Set();
  for (const m of body.matchAll(/\b(?:t|tech)\.[a-zA-Z_][a-zA-Z0-9_]*/g)) referenced.add(m[0].split(".")[1]);
  const missing = [...referenced].filter((f) => !known.has(f));
  console.log(`technique fields: analyzer returns ${known.size}, controller reads ${referenced.size}`);
  if (missing.length) { problems++; console.log(`  !! controller reads undefined field(s): ${missing.join(", ")}`); }
}

console.log(`catalog: ${SAMPLES.length} samples (${ANALYZABLE.length} with bytes), ${TIMELINE.length} timeline entries, ${LESSONS.length} lessons\n`);

for (const sample of ANALYZABLE) {
  const bytes = new Uint8Array(readFileSync(join(ROOT, sample.binary)));
  const base = Number.parseInt(sample.base, 16);
  const entry = Number.parseInt(sample.entry, 16);
  const boot = bytes.length === 512 ? bootSectorInfo(bytes) : null;
  const analysis = analyze(bytes, { base, mode: 16, entries: [entry], dataRanges: boot && boot.magic ? [[0x1be, 0x200]] : [] });
  const tech = extractTechniques(analysis);
  const listing = renderListing(analysis, new Map((sample.annotations || []).map((a) => [Number.parseInt(a.addr, 16), a.label])));
  const insns = [...analysis.insns.values()].filter((i) => !i.data).length;

  console.log(`── ${sample.name}`);
  console.log(`   ${bytes.length} bytes @ ${hex(base)} · ${insns} instructions · ${analysis.codeBytes} code / ${analysis.dataBytes} data bytes`);
  if (boot) console.log(`   boot sector: magic=${boot.magic} oem="${boot.oem}" partitions=${boot.partitions}`);
  console.log(`   top mnemonics: ${mnemonicHistogram(analysis).slice(0, 8).map(([m, n]) => `${m}×${n}`).join(" ")}`);
  console.log(`   interrupts: ${tech.ints.map((i) => `${hex(i.addr)} int ${i.int.toString(16)}h${i.ah !== null ? `/${i.ah.toString(16).padStart(2, "0")}h` : ""}${i.service ? ` (${i.service})` : ""}`).join("  ") || "none"}`);
  console.log(`   ivt hooks: ${tech.hooks.map((h) => `${h.name} ${h.half}`).join(", ") || "none"}`);
  console.log(`   ivt reads: ${tech.ivtReads.map((h) => `${h.name} ${h.half} → ${h.target || "-"}`).join(", ") || "none"}`);
  console.log(`   bios reads: ${tech.biosReads.map((m) => hex(m.disp)).join(", ") || "none"}`);
  console.log(`   bios writes: ${tech.biosWrites.map((m) => `${hex(m.disp)} ← ${m.value}`).join(", ") || "none"}`);
  console.log(`   absolute writes: ${tech.absoluteWrites.map((m) => `${hex(m.resolved)} ← ${m.value}`).join(", ") || "none"}`);
  console.log(`   internal writes: ${tech.internalWrites.map((m) => `${hex(m.resolved)} ← ${m.value}`).join(", ") || "none"}`);
  console.log(`   bulk memory ops: ${tech.bulkWrites.map((b) => `${hex(b.addr)} ${b.text}`).join(", ") || "none"}`);
  console.log(`   unresolved stores: ${tech.unresolved.length}`);
  console.log(`   strings: ${stringsIn(bytes, 5).map((s) => JSON.stringify(s.text)).join(" ") || "none"}`);
  console.log(`   entropy: min ${Math.min(...entropyWindows(bytes).map((w) => w.entropy)).toFixed(2)} / max ${Math.max(...entropyWindows(bytes).map((w) => w.entropy)).toFixed(2)} bits/byte`);
  console.log(`   listing: ${listing.split("\n").length} lines, ${(listing.length / 1024).toFixed(1)} KB\n`);

  if (!insns) { problems++; console.log("   !! no instructions decoded"); }
  if (!tech.ints.length && sample.id.includes("michelangelo")) { problems++; console.log("   !! expected interrupt calls"); }
  if (!listing.length) { problems++; console.log("   !! empty listing"); }
}

console.log(problems ? `${problems} problem(s)` : "pipeline clean");
process.exit(problems ? 1 : 0);
