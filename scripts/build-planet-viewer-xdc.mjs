/**
 * Package PLANET VIEWER · 4DWM as a Webxdc bundle.
 *
 * Multi-file with native ES modules, like the other 4DWM bundles in this repo,
 * so the provenance (viewer + pure modules + committed USGS control data +
 * deep-dive) survives unzipping. A messenger overrides webxdc.js at runtime.
 *
 *   node scripts/build-planet-viewer-xdc.mjs
 */

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "planet-viewer-4dwm.xdc";
const mtime = new Date("2026-10-09T00:00:00.000Z"); // reproducible builds

const manifest = `name = "Planet Viewer · 4DWM"
source_code_url = "https://github.com/shdwelf/Html5"
description = "Offline USGS 3DEP terrain plates with wireframe, x-ray, VRML, labels and relief modes over an offline GNIS gazetteer."
`;

const files = new Map();
const enc = new TextEncoder();
const put = (rel, data) => files.set(rel, typeof data === "string" ? enc.encode(data) : new Uint8Array(data));
const copy = async (from, to = from) => put(to, await readFile(path.join(root, from)));

let html = await readFile(path.join(root, "planet-viewer-4dwm.html"), "utf8");
const moduleTag = '<script type="module" src="./js/planet-viewer-4dwm.js"></script>';
if (!html.includes(moduleTag)) throw new Error("planet-viewer-4dwm.html: entry script tag not found");
html = html.replace(moduleTag, ['<script src="./webxdc.js"></script>', `  ${moduleTag}`].join("\n"));
put("index.html", html);

for (const f of [
  "js/planet-viewer-4dwm.js",
  "js/planet-viewer-data.js",
  "js/planet-viewer-checks.js",
  "js/cheyenne-dem.js",
  "js/cheyenne-dem-data.js",
  "js/city-dem-grid-lawrence.js",
  "js/city-gazetteer.js",
  "js/city-gazetteer-data.js",
  "js/city-gazetteer-data-atlanta.js",
  "js/city-gazetteer-data-buffalo.js",
  "js/city-gazetteer-data-kansascity.js",
  "js/city-gazetteer-data-lawrence.js",
  "js/city-gazetteer-data-toronto.js",
  "js/vrml-export.js",
  "js/project-y-4dwm.js",
  "css/planet-viewer-4dwm.css",
  "css/project-y-4dwm.css",
  "vendor/three.module.min.js",
  "vendor/OrbitControls.js",
  "vendor/THREE_LICENSE",
]) {
  await copy(f);
}

await copy("docs/planet-viewer-deep-dive.md", "docs/planet-viewer-deep-dive.md");

put(
  "webxdc.js",
  `/* webxdc simulator shim — a messenger overrides this file at runtime. */
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

const iconPath = path.join(root, "icon.png");
if (!(await stat(iconPath).catch(() => null))) throw new Error("missing icon.png");
put("icon.png", await readFile(iconPath));

if (!files.has("index.html") || !files.has("manifest.toml")) throw new Error("bundle missing index.html/manifest.toml");
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
