import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";
import { zipSync } from "../vendor/fflate/index.mjs";

/* Packages BlueTops GSO · 4DWM as a Webxdc (ZIP rooted at index.html +
 * manifest.toml + icon.png). The app module is bundled with esbuild, CSS is
 * inlined, and the FPDS / USGS 3DEP / Federal Register snapshots plus the
 * countries GeoJSON are embedded as window.__BLUETOPS_DATA__ so the app runs
 * fully offline inside Delta Chat / ArcaneChat webxdc sandboxes (external
 * fetches are blocked there; the live-refresh buttons degrade gracefully).
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "bluetops-gso-4dwm.xdc";

const manifest = `name = "BLUETOPS GSO · 4DWM"
orientation = "landscape"
source_code_url = "https://github.com/shdwelf/Html5"
`;

// 1. bundle the ES module graph (app + vendored three.js + OrbitControls)
const bundled = await esbuild.build({
  entryPoints: [path.join(root, "js/bluetops-gso-4dwm.js")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  write: false,
  legalComments: "none",
  logLevel: "silent",
});
let bundleJs = bundled.outputFiles[0].text;
// never let a literal "</script>" terminate the inline tag
bundleJs = bundleJs.replace(/<\/script/g, "<\\/script");

// 2. read template, styles, data
const html = await readFile(path.join(root, "bluetops-gso-4dwm.html"), "utf8");
const css = await readFile(path.join(root, "css/bluetops-gso-4dwm.css"), "utf8");
const data = {
  awards: JSON.parse(await readFile(path.join(root, "data/bluetops/awards.json"), "utf8")),
  dem: JSON.parse(await readFile(path.join(root, "data/bluetops/dem.json"), "utf8")),
  register: JSON.parse(await readFile(path.join(root, "data/bluetops/register.json"), "utf8")),
  coastlines: JSON.parse(await readFile(path.join(root, "vendor/world/countries.geo.json"), "utf8")),
};

// 3. assemble the single-file document
const dataScript = `window.__BLUETOPS_DATA__ = ${JSON.stringify(data)};`.replace(
  /<\/script/g,
  "<\\/script"
);
let doc = html
  .replace(
    /<link rel="stylesheet" href="\.\/css\/bluetops-gso-4dwm\.css" \/>/,
    () => `<style>\n${css}\n</style>`
  )
  .replace(
    /<script type="module" src="\.\/js\/bluetops-gso-4dwm\.js"><\/script>/,
    () => `<script>${dataScript}</script>\n  <script>${bundleJs}</script>`
  );

if (!doc.includes("__BLUETOPS_DATA__") || doc.includes('src="./js/bluetops-gso-4dwm.js"')) {
  throw new Error("template substitution failed — check bluetops-gso-4dwm.html");
}

// 4. zip as webxdc
const mtime = new Date("2026-09-11T00:00:00.000Z"); // stable timestamps
const archive = {
  "index.html": [new TextEncoder().encode(doc), { level: 9, mtime }],
  "manifest.toml": [new TextEncoder().encode(manifest), { level: 9, mtime }],
  "icon.png": [new Uint8Array(await readFile(path.join(root, "img/bluetops-icon-256.png"))), { level: 9, mtime }],
};
const bytes = zipSync(archive, { level: 9, mtime });
const outPath = path.join(root, OUTPUT);
await writeFile(outPath, bytes);

const digest = createHash("sha256").update(bytes).digest("hex");
console.log(`Webxdc: ${OUTPUT} (${bytes.length.toLocaleString()} bytes)`);
console.log(`  xdc sha256: ${digest}`);
console.log(`  index.html: ${doc.length.toLocaleString()} chars`);
console.log(`  entries: ${Object.keys(archive).join(", ")}`);
