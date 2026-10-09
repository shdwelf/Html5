/**
 * Package RED OCTOBER · CUTAWAY 4DWM as a Webxdc bundle.
 *
 * Multi-file with native ES modules, like los-alamos.xdc and
 * vincennes-4dwm.xdc in this repo, so the provenance survives unzipping: the
 * viewer, the pure geometry/check/VRML modules, the source data and the
 * deep-dive all travel inside the bundle and stay readable. A messenger
 * overrides webxdc.js at runtime; a plain static server uses the shim.
 *
 *   node scripts/build-red-october-xdc.mjs
 */

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "red-october-4dwm.xdc";
const mtime = new Date("2026-10-09T00:00:00.000Z"); // reproducible builds

const manifest = `name = "Red October · Cutaway 4DWM"
source_code_url = "https://github.com/shdwelf/Html5"
description = "Project 941, USS Dallas and Project 971 as DK cross-section geometry, with a four-dimensional timeline of the novel and a VRML export."
`;

const files = new Map();
const enc = new TextEncoder();
const put = (rel, data) => files.set(rel, typeof data === "string" ? enc.encode(data) : new Uint8Array(data));
const copy = async (from, to = from) => put(to, await readFile(path.join(root, from)));

/* 1 · index.html with the shim injected ------------------------------------ */
let html = await readFile(path.join(root, "red-october-4dwm.html"), "utf8");
const moduleTag = '<script type="module" src="./js/red-october-4dwm.js"></script>';
if (!html.includes(moduleTag)) throw new Error("red-october-4dwm.html: entry script tag not found");
html = html.replace(moduleTag, ['<script src="./webxdc.js"></script>', `  ${moduleTag}`].join("\n"));
put("index.html", html);

/* 2 · source modules and styles -------------------------------------------- */
for (const f of [
  "js/red-october-4dwm.js",
  "js/red-october-data.js",
  "js/red-october-geo.js",
  "js/red-october-checks.js",
  "js/red-october-vrml.js",
  "js/project-y-4dwm.js",
  "css/red-october-4dwm.css",
  "css/project-y-4dwm.css",
  "vendor/three.module.min.js",
  "vendor/OrbitControls.js",
  "vendor/THREE_LICENSE",
]) {
  await copy(f);
}

/* 3 · the write-up so the bundle carries its own provenance ---------------- */
await copy("docs/red-october-cutaway-deep-dive.md", "docs/red-october-cutaway-deep-dive.md");

/* 4 · shim, manifest, icon -------------------------------------------------- */
put(
  "webxdc.js",
  `/* webxdc simulator shim — a messenger overrides this file at runtime.
 * Present so the bundle also runs from a plain static server. */
window.webxdc = window.webxdc || {
  selfAddr: "local@device",
  selfName: "local",
  sendUpdate() {},
  setUpdateListener: async () => 0,
  getAllUpdates: async () => [],
};
`,
);
put("manifest.toml", manifest);

// Icon: reuse the repo icon so the bundle is spec-valid; a bespoke one can
// replace it later without touching this script's logic.
const iconPath = path.join(root, "icon.png");
if (!(await stat(iconPath).catch(() => null))) throw new Error("missing icon.png");
put("icon.png", await readFile(iconPath));

/* 5 · zip ------------------------------------------------------------------- */
if (!files.has("index.html") || !files.has("manifest.toml")) {
  throw new Error("bundle missing index.html/manifest.toml");
}
const archive = {};
for (const rel of [...files.keys()].sort()) archive[rel] = [files.get(rel), { level: 9, mtime }];
const bytes = zipSync(archive, { level: 9, mtime });

await writeFile(path.join(root, OUT), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", OUT), bytes);

const raw = [...files.values()].reduce((n, b) => n + b.length, 0);
console.log(`Webxdc: ${OUT} (${bytes.length.toLocaleString()} bytes, ${Object.keys(archive).length} entries)`);
console.log(`  raw:    ${raw.toLocaleString()} bytes`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
for (const rel of Object.keys(archive)) {
  console.log(`    ${String(archive[rel][0].length).padStart(9)}  ${rel}`);
}
