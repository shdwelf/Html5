/**
 * Package the PC-Globe-style country viewer as a Webxdc bundle.
 *
 * A .xdc is a deflated ZIP rooted at index.html + manifest.toml. This stages
 * the Country Viewer plus its five-city offline Gazetteer engine/data into
 * public/apps/country-viewer/ as a flat bundle, then zips it deterministically
 * — same flow as build-cheyenne-xdc.mjs.
 *
 *   node scripts/build-country-viewer-xdc.mjs
 */
import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Prefer the installed package; fall back to the vendored copy so the build
// works in a bare checkout with no node_modules.
const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "country-viewer");
const outName = "country-viewer.xdc";
const mtime = new Date("2026-10-02T00:00:00.000Z"); // reproducible builds

const manifest = `name = "Country Viewer - Country Outlines + Factbook"
source_code_url = "https://github.com/shdwelf/Html5"
description = "Offline country and area profiles with reviewed ISO name/code and IANA ccTLD search crosswalks, Natural Earth outlines, regional map views, and a limited place-name index."
`;

await rm(appDir, { recursive: true, force: true });
await mkdir(path.join(appDir, "js"), { recursive: true });
await mkdir(path.join(appDir, "vendor", "world"), { recursive: true });
await mkdir(path.join(appDir, "resources", "country-viewer", "licenses"), { recursive: true });

let html = await readFile(path.join(root, "country-viewer.html"), "utf8");
html = html.replace(
  '<script type="module" src="./js/country-viewer.js"></script>',
  '<script src="./webxdc.js"></script>\n  <script type="module" src="./js/country-viewer.js"></script>',
);
await writeFile(path.join(appDir, "index.html"), html);
for (const f of [
  "country-viewer.js", "country-viewer-search.js", "country-iso-crosswalk.js", "country-iana-cctlds.js", "country-map.js", "country-data.js", "city-gazetteer.js", "city-gazetteer-data.js",
  "city-gazetteer-data-atlanta.js", "city-gazetteer-data-buffalo.js",
  "city-gazetteer-data-kansascity.js", "city-gazetteer-data-lawrence.js",
  "city-gazetteer-data-toronto.js", "city-gazetteer-data-polynesia.js",
]) {
  await copyFile(path.join(root, "js", f), path.join(appDir, "js", f));
}
for (const f of ["countries.geo.json", "README.md", "UNLICENSE"]) {
  await copyFile(path.join(root, "vendor", "world", f), path.join(appDir, "vendor", "world", f));
}
for (const f of [
  "bora-bora-place-register-2026-11-09.json",
  "country-iso-crosswalk-register-2026-11-09.json",
  "country-iana-cctld-register-2026-11-09.json",
  "licenses/ODbL-1.0.md",
  "licenses/MIT-i18n-iso-countries.txt",
  "licenses/MIT-jehiah-generic-tlds.txt",
]) {
  await copyFile(
    path.join(root, "resources", "country-viewer", f),
    path.join(appDir, "resources", "country-viewer", f),
  );
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
const zipped = zipSync(archive, { level: 9 });
await writeFile(path.join(root, outName), zipped);
const sha = createHash("sha256").update(zipped).digest("hex");
console.log(`Webxdc: ${outName} (${zipped.length.toLocaleString("en-US")} bytes, ${Object.keys(archive).length} entries)`);
console.log(`  sha256: ${sha}`);
