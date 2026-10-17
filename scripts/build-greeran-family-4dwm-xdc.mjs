#!/usr/bin/env node
/**
 * Package the Greeran Family Tree 4DWM globe and keepsake pages as Webxdc.
 *
 * The interactive application remains a single offline HTML document. The
 * package includes the baseline GEDCOM export, WEB EPUB, lazy-loaded WEBU reader
 * data and notices, and the unchanged Kirkpatrick shareware ZIP, plus the standard
 * manifest and icon.
 * The ZIP is written reproducibly to the repository root and ignored dist/.
 *
 *   node scripts/build-greeran-family-4dwm-xdc.mjs
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGreeranGedcom } from "../tools/greeran-family-export.mjs";

const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "greeran-family-4dwm.html");
const outputName = "greeran-family-4dwm.xdc";
const mtime = new Date("2026-10-01T00:00:00.000Z");
const enc = new TextEncoder();

const html = await readFile(source);
const gedcomResult = buildGreeranGedcom(html.toString("utf8"));
const gedcom = Buffer.from(gedcomResult.text, "utf8");
const gedcomName = "greeran-family-4dwm.ged";
const biblePath = path.join(root, "assets/greeran/world-english-bible.epub");
const bible = await readFile(biblePath);
const webuDir = path.join(root, "public/apps/greeran-family-bible");
const webuData = await readFile(path.join(webuDir, "complete-bible.json"));
const webuMetadata = await readFile(path.join(webuDir, "metadata.json"));
const webuLicense = await readFile(path.join(webuDir, "LICENSE"));
const webuReadme = await readFile(path.join(webuDir, "README.md"));
const fnaArchive = await readFile(path.join(root, "samples/archive/kirkpatrick/FNA102B.ZIP"));
const icon = await readFile(path.join(root, "img/greeran-family-4dwm-icon.png"));
const manifest = `name = "Greeran Family Tree · 4DWM"
orientation = "landscape"
source_code_url = "https://github.com/shdwelf/Html5"
`;

await writeFile(path.join(root, gedcomName), gedcom);
const archive = {
  "icon.png": [new Uint8Array(icon), { level: 9, mtime }],
  "index.html": [new Uint8Array(html), { level: 9, mtime }],
  "manifest.toml": [enc.encode(manifest), { level: 9, mtime }],
  [gedcomName]: [new Uint8Array(gedcom), { level: 9, mtime }],
  "assets/greeran/world-english-bible.epub": [new Uint8Array(bible), { level: 9, mtime }],
  "public/apps/greeran-family-bible/complete-bible.json": [new Uint8Array(webuData), { level: 9, mtime }],
  "public/apps/greeran-family-bible/metadata.json": [new Uint8Array(webuMetadata), { level: 9, mtime }],
  "public/apps/greeran-family-bible/LICENSE": [new Uint8Array(webuLicense), { level: 9, mtime }],
  "public/apps/greeran-family-bible/README.md": [new Uint8Array(webuReadme), { level: 9, mtime }],
  "samples/archive/kirkpatrick/FNA102B.ZIP": [new Uint8Array(fnaArchive), { level: 9, mtime }],
};
const bytes = zipSync(archive, { level: 9, mtime });

await writeFile(path.join(root, outputName), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outputName), bytes);

const digest = (value) => createHash("sha256").update(value).digest("hex");
console.log(`Webxdc: ${outputName} (${bytes.length.toLocaleString()} bytes)`);
console.log(`  xdc sha256:   ${digest(bytes)}`);
console.log(`  index sha256: ${digest(html)}`);
console.log(`  gedcom:       ${gedcomResult.stats.exportedIndividuals} INDI, ${gedcomResult.stats.families} FAM; ${gedcomResult.stats.missingPersonIds.length} blank stub(s)`);
console.log(`  bible EPUB:   ${bible.length.toLocaleString()} bytes`);
console.log(`  WEBU data:    ${webuData.length.toLocaleString()} bytes`);
console.log(`  FNA ZIP:     ${fnaArchive.length.toLocaleString()} bytes (copied without modification)`);
console.log(`  entries:      ${Object.keys(archive).sort().join(", ")}`);
