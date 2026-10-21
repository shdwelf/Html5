#!/usr/bin/env node
/**
 * sierra_xgrep.mjs — cross-title string sweep for Sierra AGI/SCI message tables.
 *
 * Implements the round-5 sweep recommendation (docs/sierra-shadow-president-
 * sweep-2026-10-21.md §2): "Any RE of one title's message tables should grep the
 * others' known strings." Sierra's Easter eggs travel across franchises (LSL1's
 * assembly-line death room assembles spare Larries next to a King's Quest dragon
 * and the Space Quest 1 droid), so a byte-level scan for the documented egg
 * strings over a corpus of game resources finds cross-title references that a
 * single-title RE pass would miss.
 *
 * Usage:
 *   node tools/sierra_xgrep.mjs <dir-or-file> [--json]
 *
 * Programmatic:
 *   scanBuffer(buf) -> [{ id, needle, offset, context }]
 *   scanDirectory(root) -> [{ file, hits }]
 *
 * The needle list is conservative (long, distinctive strings only) and every
 * entry carries its source. Add project-specific needles via EXTRA_NEEDLES or
 * by editing EGG_STRINGS; generic words like "KEN" alone are deliberately NOT
 * needles (they match everything).
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

/** Known cross-title strings, each with provenance (see the sweep doc §2). */
export const EGG_STRINGS = [
  { id: "ken-sent-me", needle: "KEN SENT ME",
    note: "LSL1 Lefty's door password (Sierra Chest egg 344)", source: "sierrachest.com" },
  { id: "ken-williams", needle: "KEN WILLIAMS",
    note: "Ken Williams cameo / signature text (Sierra Chest egg 340 family)", source: "sierrachest.com" },
  { id: "crowe", needle: "CROWE",
    note: "SQ3 Mark Crowe signature egg (sierrahelp SQ egg list)", source: "sierrahelp.com" },
  { id: "rick-cavin", needle: "RICK CAVIN",
    note: "SQ3 whips cameo (Ken Williams + Rick Cavin)", source: "sierrahelp.com" },
  { id: "droids-b-us", needle: "DROIDS",
    note: "SQ3 'Droids B-Us'/'another lawsuit' gag (spelling varies)", source: "sierrahelp.com" },
  { id: "roberta-williams", needle: "ROBERTA WILLIAMS",
    note: "King's Quest designer cameo text", source: "sierrahelp.com" },
  { id: "al-lowe", needle: "AL LOWE",
    note: "Leisure Suit Larry designer cameo text", source: "sierrachest.com" },
  { id: "scott-murphy", needle: "SCOTT MURPHY",
    note: "Space Quest co-designer cameo (SQ1 'ken'/'scott' typing eggs)", source: "sierrahelp.com" },
];

const CONTEXT = 24;

/** Case-insensitive ASCII search; returns one entry per (id, first offset). */
export function scanBuffer(buf, needles = EGG_STRINGS) {
  const hay = buf.toString("latin1").toLowerCase();
  const hits = [];
  for (const n of needles) {
    const off = hay.indexOf(n.needle.toLowerCase());
    if (off < 0) continue;
    const from = Math.max(0, off - CONTEXT);
    const to = Math.min(buf.length, off + n.needle.length + CONTEXT);
    hits.push({
      id: n.id,
      needle: n.needle,
      offset: off,
      context: buf.subarray(from, to).toString("latin1").replace(/[^\x20-\x7e]/g, "."),
    });
  }
  return hits;
}

async function walk(p, out) {
  const st = await stat(p);
  if (st.isDirectory()) {
    for (const name of (await readdir(p)).sort()) await walk(path.join(p, name), out);
  } else out.push(p);
  return out;
}

/** Scan every file under root; returns [{ file, size, hits }]. */
export async function scanDirectory(root, needles = EGG_STRINGS) {
  const files = await walk(root, []);
  const report = [];
  for (const file of files) {
    const buf = await readFile(file);
    const hits = scanBuffer(buf, needles);
    report.push({ file: path.relative(root, file), size: buf.length, hits });
  }
  return report;
}

/** GHIDRA_COOKBOOK-style report; returns { files, hits } counts. */
export function renderReport(report, log = console.log) {
  log("### Sierra cross-title string sweep");
  let total = 0;
  for (const row of report) {
    if (!row.hits.length) continue;
    for (const h of row.hits) {
      total++;
      log(`| ${row.file} | +0x${h.offset.toString(16)} | ${h.needle} | ${h.id} | ${JSON.stringify(h.context)} |`);
    }
  }
  log(`files scanned: ${report.length}, hits: ${total}`);
  return { files: report.length, hits: total };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const json = process.argv.includes("--json");
  const root = args[0];
  if (!root) {
    console.error("usage: node tools/sierra_xgrep.mjs <dir-or-file> [--json]");
    process.exit(2);
  }
  const report = await scanDirectory(root);
  if (json) console.log(JSON.stringify(report, null, 2));
  else {
    const { hits } = renderReport(report);
    if (!hits) console.log("(no known cross-title strings found)");
  }
}
