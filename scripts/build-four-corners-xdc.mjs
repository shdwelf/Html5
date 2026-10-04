/**
 * Package FOUR CORNERS 4Dwm as a Webxdc bundle.
 *
 * A .xdc is a deflated ZIP rooted at index.html + manifest.toml. This script
 * stages the root-level authoring sources (four-corners.html, js/, css/,
 * vendor three) into public/apps/four-corners/ as a flat offline bundle,
 * then zips it deterministically.
 *
 *   node scripts/build-four-corners-xdc.mjs
 */

import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "four-corners");
const outName = "four-corners.xdc";
const mtime = new Date("2026-10-04T00:00:00.000Z"); // reproducible builds

const manifest = `name = "Four Corners 4Dwm"
source_code_url = "https://github.com/shdwelf/Html5"
`;

await rm(appDir, { recursive: true, force: true });
await mkdir(path.join(appDir, "js"), { recursive: true });
await mkdir(path.join(appDir, "css"), { recursive: true });
await mkdir(path.join(appDir, "vendor"), { recursive: true });

let html = await readFile(path.join(root, "four-corners.html"), "utf8");
html = html.replace(
  '<script type="module" src="./js/four-corners.js"></script>',
  '<script src="./webxdc.js"></script>\n  <script type="module" src="./js/four-corners.js"></script>',
);
await writeFile(path.join(appDir, "index.html"), html);

await copyFile(path.join(root, "css", "four-corners.css"), path.join(appDir, "css", "four-corners.css"));

// Follow the app's actual module graph rather than maintaining a second list.
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
      if (!specifier.startsWith(".")) continue;
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

const { modules, optional } = await collectModules(path.join(root, "js", "four-corners.js"));
for (const abs of modules) {
  const rel = path.relative(root, abs);
  await mkdir(path.dirname(path.join(appDir, rel)), { recursive: true });
  await copyFile(abs, path.join(appDir, rel));
}
for (const dependency of optional) console.log(`Optional module not shipped: ${dependency}`);

for (const f of ["three.module.min.js", "OrbitControls.js", "THREE_LICENSE"]) {
  await copyFile(path.join(root, "vendor", f), path.join(appDir, "vendor", f));
}

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
