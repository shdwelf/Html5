#!/usr/bin/env node
/**
 * render_research.mjs — write criteria/RESEARCH-VIRUSES.md from js/virus-catalog.js.
 *
 *   node tools/render_research.mjs
 *
 * The catalog module is the single source of truth for the lab's research tab
 * and for this document, so the two can never drift apart.
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { SAMPLES, TIMELINE, LESSONS, REFERENCES } from "../js/virus-catalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = [];

out.push("# Virus research notes");
out.push("");
out.push("> Generated from `js/virus-catalog.js` — edit the module, then run");
out.push("> `node tools/render_research.mjs`. Nothing here executes anything: the");
out.push("> samples are 16-bit real-mode DOS code and need a BIOS, an interrupt");
out.push("> vector table and a floppy controller to do anything at all.");
out.push("");

out.push("## 1. The source corpus");
out.push("");
out.push("All assembler sources come from [ksaj/Ontario1024](https://github.com/ksaj/Ontario1024),");
out.push("a collection of early-90s virus code. Three of the entries have been");
out.push("reassembled into real binaries for this lab (marked **binary**); the rest are");
out.push("read as source.");
out.push("");
out.push("| sample | kind | era | binary | notes |");
out.push("| --- | --- | --- | --- | --- |");
for (const s of SAMPLES) {
  const note = (s.summary || "").replace(/\s+/g, " ").slice(0, 160).trim();
  out.push(`| **${s.name}** | ${s.kind} | ${s.era || "—"} | ${s.binary ? `\`${s.binary}\`` : "—"} | ${note}${note.length >= 160 ? "…" : ""} |`);
}
out.push("");

for (const s of SAMPLES) {
  out.push(`### ${s.name}`);
  out.push("");
  if (s.aka?.length) out.push(`*Also known as:* ${s.aka.join(", ")}  `);
  if (s.family) out.push(`*Family:* ${s.family}  `);
  if (s.authored) out.push(`*Attributed to:* ${s.authored}  `);
  out.push(`*Source:* ${s.origin || s.source}  `);
  if (s.binary) out.push(`*Binary in this lab:* \`${s.binary}\` (${s.byteLength} bytes at ${s.base}, ${s.lang})  `);
  out.push("");
  out.push(s.summary || "");
  out.push("");
  if (s.techniques?.length) {
    out.push("**Techniques**");
    out.push("");
    for (const t of s.techniques) out.push(`- ${t}`);
    out.push("");
  }
  if (s.narrative?.length) {
    out.push("**Reconstructed execution** (read from the source, not observed)");
    out.push("");
    s.narrative.forEach((n, i) => out.push(`${i + 1}. ${n}`));
    out.push("");
  }
  if (s.whyItMatters) {
    out.push(`**Why it matters.** ${s.whyItMatters}`);
    out.push("");
  }
  if (s.annotations?.length) {
    out.push("**Annotated addresses**");
    out.push("");
    out.push("| address | label | note |");
    out.push("| --- | --- | --- |");
    for (const a of s.annotations) out.push(`| \`${a.addr}\` | ${a.label} | ${a.note.replace(/\|/g, "\\|")} |`);
    out.push("");
  }
  if (s.refs?.length) {
    for (const r of s.refs) out.push(`- [${r.label}](${r.url})`);
    out.push("");
  }
}

out.push("## 2. Wider timeline");
out.push("");
out.push("Damage figures are the widely-cited estimates and vary between sources —");
out.push("treat them as order-of-magnitude, not audited numbers.");
out.push("");
out.push("| year | milestone | platform | class |");
out.push("| --- | --- | --- | --- |");
for (const t of TIMELINE) out.push(`| ${t.year} | **${t.name}** | ${t.platform} | ${t.class} |`);
out.push("");
for (const t of TIMELINE) {
  out.push(`### ${t.year} — ${t.name}`);
  out.push("");
  out.push(`${t.platform} · ${t.class}`);
  out.push("");
  out.push(t.note);
  out.push("");
}

out.push("## 3. What carries forward");
out.push("");
for (const l of LESSONS) {
  out.push(`### ${l.title}`);
  out.push("");
  out.push(l.body);
  out.push("");
}

out.push("## 4. References");
out.push("");
for (const r of REFERENCES) out.push(`- [${r.label}](${r.url})`);
out.push("");

const target = join(ROOT, "criteria", "RESEARCH-VIRUSES.md");
writeFileSync(target, out.join("\n"), "utf8");
console.log(`wrote ${target} (${out.join("\n").length} bytes, ${SAMPLES.length} samples, ${TIMELINE.length} milestones)`);
