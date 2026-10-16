#!/usr/bin/env node
/**
 * Package the Drive-sourced Greeran Family Tree 4DWM globe as Webxdc.
 *
 * The family data, coastline geometry, styles, renderer, and webxdc fallback
 * remain embedded in the HTML. This packer adds the offline WEBU Bible dataset,
 * its attribution/license, the untouched FNA102B shareware ZIP, and the standard
 * manifest/icon, then writes a reproducible archive to the repository root and
 * ignored dist/ directory.
 *
 *   node scripts/build-greeran-family-4dwm-xdc.mjs
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "greeran-family-4dwm.html");
const outputName = "greeran-family-4dwm.xdc";
const mtime = new Date("2026-10-01T00:00:00.000Z");
const enc = new TextEncoder();

const html = await readFile(source);
const icon = await readFile(path.join(root, "img/greeran-family-4dwm-icon.png"));
const bibleData = await readFile(path.join(root, "public/apps/greeran-family-bible/complete-bible.json"));
const bibleMetadata = await readFile(path.join(root, "public/apps/greeran-family-bible/metadata.json"));
const bibleLicense = await readFile(path.join(root, "public/apps/greeran-family-bible/LICENSE"));
const bibleReadme = await readFile(path.join(root, "public/apps/greeran-family-bible/README.md"));
const fnaArchive = await readFile(path.join(root, "samples/archive/kirkpatrick/FNA102B.ZIP"));
const manifest = `name = "Greeran Family Tree · 4DWM"
orientation = "landscape"
source_code_url = "https://github.com/shdwelf/Html5"
`;

const archive = {
  "icon.png": [new Uint8Array(icon), { level: 9, mtime }],
  "index.html": [new Uint8Array(html), { level: 9, mtime }],
  "manifest.toml": [enc.encode(manifest), { level: 9, mtime }],
  "public/apps/greeran-family-bible/complete-bible.json": [new Uint8Array(bibleData), { level: 9, mtime }],
  "public/apps/greeran-family-bible/metadata.json": [new Uint8Array(bibleMetadata), { level: 9, mtime }],
  "public/apps/greeran-family-bible/LICENSE": [new Uint8Array(bibleLicense), { level: 9, mtime }],
  "public/apps/greeran-family-bible/README.md": [new Uint8Array(bibleReadme), { level: 9, mtime }],
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
console.log(`  entries:      ${Object.keys(archive).sort().join(", ")}`);
