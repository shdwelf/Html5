/**
 * Package INGRESS INTEL 4Dwm as a Webxdc bundle.
 *
 * Same discipline as scripts/build-socal-subsurface-xdc.mjs: a .xdc is a
 * deflated ZIP rooted at index.html + manifest.toml, the module graph is walked
 * from the entry rather than duplicated in a second list here, and the build is
 * deterministic (fixed mtime) so two runs produce the same sha256.
 *
 * Two additions specific to this app:
 *   · vendor/world/countries.geo.json is staged, because the globe fetches it
 *     relatively and an offline .xdc must not silently lose its coastlines
 *   · the feed module is *expected* to fail its live rungs in a chat host; the
 *     bundle therefore has to carry the offline register, and the build asserts
 *     that module is present instead of letting a stripped package ship as if it
 *     could reach the intel map
 *
 *   node scripts/build-ingress-intel-xdc.mjs
 */

import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "ingress-intel");
const outName = "ingress-intel.xdc";
const mtime = new Date("2026-10-07T00:00:00.000Z"); // reproducible builds

const manifest = `name = "Ingress Intel 4Dwm"
source_code_url = "https://github.com/shdwelf/Html5"
`;

await rm(appDir, { recursive: true, force: true });
for (const dir of ["js", "css", "vendor/world"]) await mkdir(path.join(appDir, dir), { recursive: true });

let html = await readFile(path.join(root, "ingress-intel.html"), "utf8");
html = html.replace(
  '<script type="module" src="./js/ingress-intel.js"></script>',
  '<script src="./webxdc.js"></script>\n  <script type="module" src="./js/ingress-intel.js"></script>',
);
await writeFile(path.join(appDir, "index.html"), html);

await copyFile(path.join(root, "css", "ingress-intel.css"), path.join(appDir, "css", "ingress-intel.css"));

function moduleSpecifiers(source) {
  const specs = [];
  const staticImport = /\b(?:import\s+(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*)["']([^"']+)["']/g;
  const dynamicImport = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const pattern of [staticImport, dynamicImport]) {
    for (const match of source.matchAll(pattern)) specs.push(match[1]);
  }
  return specs;
}

async function collectModules(entry) {
  const pending = [entry];
  const modules = new Set();
  const optional = new Set();

  while (pending.length) {
    const abs = path.resolve(pending.pop());
    if (modules.has(abs)) continue;
    modules.add(abs);

    const source = await readFile(abs, "utf8");
    for (const specifier of moduleSpecifiers(source)) {
      if (!specifier.startsWith(".")) continue; // bare package specifier
      const dependency = path.resolve(path.dirname(abs), specifier);
      const rel = path.relative(root, dependency).split(path.sep).join("/");
      if (rel === "vendor" || rel.startsWith("vendor/")) continue;
      if (!rel || rel.startsWith("../")) {
        throw new Error(`module import escapes repository: ${specifier} from ${path.relative(root, abs)}`);
      }
      if (await stat(dependency).catch(() => null)) pending.push(dependency);
      else optional.add(`${path.relative(root, abs).split(path.sep).join("/")} -> ${specifier}`);
    }
  }

  return { modules: [...modules].sort(), optional: [...optional].sort() };
}

const { modules, optional } = await collectModules(path.join(root, "js", "ingress-intel.js"));
const shipped = modules.map((abs) => path.relative(root, abs).split(path.sep).join("/"));

// The offline register is not optional: without it a bundle that cannot reach
// the intel origin would open on an empty globe and an empty plate.
for (const required of ["js/ingress-intel-sim.js", "js/ingress-intel-feed.js", "js/ingress-intel-proto.js", "js/ingress-intel-globe.js", "js/socal-gazetteer-data.js"]) {
  if (!shipped.includes(required)) throw new Error(`bundle would ship without ${required} — the offline fallback is mandatory`);
}

for (const abs of modules) {
  const rel = path.relative(root, abs);
  await mkdir(path.dirname(path.join(appDir, rel)), { recursive: true });
  await copyFile(abs, path.join(appDir, rel));
}
for (const dependency of optional) console.log(`Optional module not shipped: ${dependency}`);

for (const f of ["three.module.min.js", "OrbitControls.js", "THREE_LICENSE"]) {
  await copyFile(path.join(root, "vendor", f), path.join(appDir, "vendor", f));
}
await copyFile(path.join(root, "vendor", "world", "countries.geo.json"), path.join(appDir, "vendor", "world", "countries.geo.json"));

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
