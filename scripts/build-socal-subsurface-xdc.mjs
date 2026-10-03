/**
 * Package SOCAL SUBSURFACE 4Dwm as a Webxdc bundle.
 *
 * A .xdc is a deflated ZIP rooted at index.html + manifest.toml. This script
 * stages the root-level authoring sources (socal-subsurface.html, js/, css/,
 * vendor three) into public/apps/socal-subsurface/ as a flat offline bundle,
 * then zips it deterministically.
 *
 *   node scripts/build-socal-subsurface-xdc.mjs
 */

import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Prefer the installed package; fall back to the vendored copy so the build
// works in a bare checkout with no node_modules.
const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "socal-subsurface");
const outName = "socal-subsurface.xdc";
const mtime = new Date("2026-09-28T00:00:00.000Z"); // reproducible builds

const manifest = `name = "SoCal Subsurface 4Dwm"
source_code_url = "https://github.com/shdwelf/Html5"
`;

await rm(appDir, { recursive: true, force: true });
await mkdir(path.join(appDir, "js"), { recursive: true });
await mkdir(path.join(appDir, "css"), { recursive: true });
await mkdir(path.join(appDir, "vendor"), { recursive: true });

let html = await readFile(path.join(root, "socal-subsurface.html"), "utf8");
html = html.replace(
  '<script type="module" src="./js/socal-subsurface.js"></script>',
  '<script src="./webxdc.js"></script>\n  <script type="module" src="./js/socal-subsurface.js"></script>',
);
await writeFile(path.join(appDir, "index.html"), html);

await copyFile(path.join(root, "css", "socal-subsurface.css"), path.join(appDir, "css", "socal-subsurface.css"));
for (const f of [
  "socal-subsurface.js",
  "socal-subsurface-data.js",
  "socal-gazetteer-data.js",
  "socal-geo.js",
  "socal-overlays.js",
  "socal-overlays-data.js",
  "socal-sites-extended.js",
]) {
  await copyFile(path.join(root, "js", f), path.join(appDir, "js", f));
}
for (const f of ["three.module.min.js", "OrbitControls.js", "THREE_LICENSE"]) {
  await copyFile(path.join(root, "vendor", f), path.join(appDir, "vendor", f));
}

// Simulator shim: Delta Chat replaces webxdc.js at runtime, but shipping one
// keeps the bundle runnable from a plain static server too.
await writeFile(
  path.join(appDir, "webxdc.js"),
  `/* webxdc simulator shim - the host overrides this file at runtime. */
window.webxdc = window.webxdc || {
  selfAddr: "local@device",
  selfName: "local",
  sendUpdate() {},
  setUpdateListener: async () => 0,
  getAllUpdates: async () => [],
};
`,
);

await writeFile(path.join(appDir, "manifest.toml"), manifest);
const iconSrc = path.join(root, "icon.png");
if (await stat(iconSrc).catch(() => null)) await copyFile(iconSrc, path.join(appDir, "icon.png"));

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(abs)));
    else if (e.isFile()) out.push(abs);
  }
  return out;
}

const archive = {};
for (const abs of (await walk(appDir)).sort()) {
  const rel = path.relative(appDir, abs).split(path.sep).join("/");
  archive[rel] = [new Uint8Array(await readFile(abs)), { level: 9, mtime }];
}
if (!archive["index.html"] || !archive["manifest.toml"]) throw new Error("bundle missing index.html/manifest.toml");

const bytes = zipSync(archive, { level: 9, mtime });
await writeFile(path.join(root, outName), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outName), bytes);

console.log(`Webxdc: ${outName} (${bytes.length.toLocaleString()} bytes, ${Object.keys(archive).length} entries)`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
