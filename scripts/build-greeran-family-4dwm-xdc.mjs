#!/usr/bin/env node
/**
 * Package the Drive-sourced Greeran Family Tree 4DWM globe as Webxdc.
 *
 * The application is deliberately a single offline HTML document: its family
 * data, coastline geometry, styles, renderer, and webxdc fallback are embedded.
 * This packer adds only the standard manifest and icon and writes a reproducible
 * ZIP to the repository root and the ignored dist/ directory.
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
const manifest = `name = "Greeran Family Tree · 4DWM"
orientation = "landscape"
source_code_url = "https://github.com/shdwelf/Html5"
`;

const archive = {
  "icon.png": [new Uint8Array(icon), { level: 9, mtime }],
  "index.html": [new Uint8Array(html), { level: 9, mtime }],
  "manifest.toml": [enc.encode(manifest), { level: 9, mtime }],
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
