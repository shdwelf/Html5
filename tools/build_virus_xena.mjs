/**
 * build_virus_xena.mjs — Xena-inspired preservation bag for the DOS Virus
 * Encyclopedia's Ghidra/encryption recipes.
 *
 * Follows the house pattern set by docs/geomate-gpx-preservation.md: a BagIt 1.0
 * bag that retains the inert source data and adds a documented normalized
 * rendition plus a preservation-event record, with SHA-256 payload and tag
 * manifests. It is Xena-*inspired* (source object + rendition + preservation
 * event); it is NOT processed by Xena and is not a native .xena object.
 *
 * The "recipes" preserved here are the analysis findings — boot-sector and
 * file-infection signatures, the self-decrypting loops (Cascade's overlapping
 * -word XOR, the ADD-byte boot decryptor), and the Ghidra decompilation notes —
 * captured as inert structured data. No sample is executed or packaged as
 * runnable code; the corpus stays in samples/ and is referenced by id.
 *
 *   node tools/build_virus_xena.mjs [outdir]
 */

import { createHash } from "node:crypto";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SAMPLES, TIMELINE, LESSONS, REFERENCES } from "../js/virus-catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(root, process.argv[2] || "dist/virus-encyclopedia-xena");
const NOW = "2026-10-09T00:00:00Z";
const TOOL = "tools/build_virus_xena.mjs";

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));

/** The recipes worth preserving: anything with a signature or a decryptor. */
const recipes = SAMPLES.map((s) => ({
  id: s.id,
  name: s.name,
  aka: s.aka || [],
  kind: s.kind,
  era: s.era || null,
  family: s.family || null,
  lang: s.lang || "x86:LE:16:Real Mode",
  base: s.base || null,
  byteLength: s.byteLength ?? null,
  signature: s.signature || null,
  techniques: s.techniques || [],
  // The encryption / Ghidra substance, when the catalog records it.
  decryptor: s.decryption || s.summary || null,
  analyzable: Boolean(s.binary),
}));

function normalizedXml() {
  const r = recipes.map((x) => `  <recipe id="${esc(x.id)}" kind="${esc(x.kind)}"${x.analyzable ? ' analyzable="true"' : ""}>
    <name>${esc(x.name)}</name>
${x.aka.length ? `    <aka>${x.aka.map(esc).join("; ")}</aka>\n` : ""}${x.era ? `    <era>${esc(x.era)}</era>\n` : ""}${x.family ? `    <family>${esc(x.family)}</family>\n` : ""}    <lang>${esc(x.lang)}</lang>
${x.byteLength != null ? `    <byteLength>${x.byteLength}</byteLength>\n` : ""}${x.signature ? `    <signature>${esc(x.signature)}</signature>\n` : ""}    <techniques>
${x.techniques.map((t) => `      <technique>${esc(t)}</technique>`).join("\n")}
    </techniques>
${x.decryptor ? `    <analysis>${esc(x.decryptor)}</analysis>\n` : ""}  </recipe>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Application-defined normalized rendition of the DOS Virus Encyclopedia
     Ghidra/encryption recipes. Schema is app-defined (see the companion doc);
     this is a Xena-inspired rendition, not a native Xena object. -->
<virusRecipes xmlns="urn:shdwelf:html5:virus-recipes:1" generated="${NOW}" tool="${TOOL}" count="${recipes.length}">
${r}
</virusRecipes>
`;
}

function preservationEvent() {
  return JSON.stringify({
    eventType: "normalization",
    tool: TOOL,
    timestamp: NOW,
    outcome: "success",
    source: "js/virus-catalog.js (SAMPLES/TIMELINE/LESSONS/REFERENCES)",
    description:
      "Normalized the DOS Virus Encyclopedia analysis recipes (boot-sector and " +
      "file-infection signatures, self-decrypting loops, Ghidra decompilation " +
      "notes) into an application-defined XML/JSON rendition. Inert data only; " +
      "no sample is executed or packaged as runnable code.",
    xenaRelationship:
      "Xena-inspired (source object + documented rendition + preservation " +
      "event). Not processed by Xena; not a native .xena object.",
    counts: { recipes: recipes.length, timeline: TIMELINE.length, lessons: LESSONS.length, references: REFERENCES.length },
  }, null, 2) + "\n";
}

async function main() {
  // data/original — the inert catalog exactly as the lab serves it.
  const catalogSrc = await readFile(path.join(root, "js/virus-catalog.js"));
  const original = { generated: NOW, samples: SAMPLES, timeline: TIMELINE, lessons: LESSONS, references: REFERENCES };

  const payload = new Map([
    ["data/original/virus-catalog.json", Buffer.from(JSON.stringify(original, null, 2) + "\n")],
    ["data/original/virus-catalog.js", catalogSrc],
    ["data/normalized/virus-recipes.xml", Buffer.from(normalizedXml())],
    ["data/normalized/virus-recipes.json", Buffer.from(JSON.stringify({ generated: NOW, recipes }, null, 2) + "\n")],
  ]);
  const tags = new Map([
    ["bagit.txt", Buffer.from("BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n")],
    ["metadata/preservation-event.json", Buffer.from(preservationEvent())],
  ]);

  const manifest = [...payload].map(([p, b]) => `${sha256(b)}  ${p}`).sort().join("\n") + "\n";
  tags.set("manifest-sha256.txt", Buffer.from(manifest));
  const tagmanifest = [...tags].map(([p, b]) => `${sha256(b)}  ${p}`).sort().join("\n") + "\n";
  tags.set("tagmanifest-sha256.txt", Buffer.from(tagmanifest));

  for (const [rel, buf] of [...payload, ...tags]) {
    const fp = path.join(OUT, rel);
    await mkdir(path.dirname(fp), { recursive: true });
    await writeFile(fp, buf);
  }
  console.log(`Xena-inspired BagIt bag: ${path.relative(root, OUT)}`);
  console.log(`  recipes: ${recipes.length}  payload files: ${payload.size}  tag files: ${tags.size}`);
  console.log(`  analyzable (reassembled) samples: ${recipes.filter((r) => r.analyzable).length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
