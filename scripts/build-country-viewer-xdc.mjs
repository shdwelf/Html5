/**
 * Package the PC-Globe-style country viewer as a Webxdc bundle.
 *
 * A .xdc is a deflated ZIP rooted at index.html + manifest.toml. This stages
 * the root-level authoring sources (country-viewer.html, js/country-*.js)
 * into public/apps/country-viewer/ as a flat offline bundle, then zips it
 * deterministically — same flow as build-cheyenne-xdc.mjs.
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

const manifest = `name = "Country Viewer - PC-Globe style (Factbook)"
source_code_url = "https://github.com/shdwelf/Html5"
`;

await rm(appDir, { recursive: true, force: true });
await mkdir(path.join(appDir, "js"), { recursive: true });

let html = await readFile(path.join(root, "country-viewer.html"), "utf8");
html = html.replace(
  '<script type="module" src="./js/country-viewer.js"></script>',
  '<script src="./webxdc.js"></script>\n  <script type="module" src="./js/country-viewer.js"></script>',
);
await writeFile(path.join(appDir, "index.html"), html);
for (const f of ["country-viewer.js", "country-data.js"]) {
  await copyFile(path.join(root, "js", f), path.join(appDir, "js", f));
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
