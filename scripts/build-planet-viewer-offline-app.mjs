#!/usr/bin/env node
/**
 * Stage the existing Planet Viewer as a self-contained public/apps entrypoint
 * for the offline Android library. This intentionally does not touch the
 * legacy planet-viewer-4dwm.xdc compatibility artifact (which carries the
 * SoCal Subsurface package).
 *
 *   node scripts/build-planet-viewer-offline-app.mjs
 */
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "planet-viewer");
const entryHtml = path.join(root, "planet-viewer-4dwm.html");
const entryModule = path.join(root, "js", "planet-viewer-4dwm.js");
const staticAssets = [
  "css/project-y-4dwm.css",
  "css/planet-viewer-4dwm.css",
  "vendor/THREE_LICENSE",
  "vendor/world/countries.geo.json",
  "vendor/world/README.md",
  "vendor/world/UNLICENSE",
  "resources/country-viewer/bora-bora-place-register-2026-11-09.json",
  "resources/country-viewer/licenses/ODbL-1.0.md",
  "icon.png",
];
const manifest = `name = "Planet Viewer · 4DWM"
source_code_url = "https://github.com/shdwelf/Html5"
description = "Offline 3DEP terrain plates, a limited Gazetteer place-name index, country globe, and PC Globe index. The viewer is schematic, not a survey product."
icon = "icon.png"
`;

function moduleSpecifiers(source) {
  const specs = [];
  const patterns = [
    /\b(?:import\s+(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*)["']([^"']+)["']/g,
    /\bimport\s*\(\s*(?:\/\*.*?\*\/\s*)?["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specs.push(match[1]);
  }
  return specs;
}

async function collectModules(entry) {
  const pending = [entry];
  const modules = new Set();
  while (pending.length) {
    const abs = path.resolve(pending.pop());
    if (modules.has(abs)) continue;
    const relative = path.relative(root, abs);
    if (!relative || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) {
      throw new Error(`module escapes repository: ${abs}`);
    }
    const info = await stat(abs).catch(() => null);
    if (!info?.isFile()) throw new Error(`missing Planet Viewer module: ${relative}`);
    modules.add(abs);
    const source = await readFile(abs, "utf8");
    for (const specifier of moduleSpecifiers(source)) {
      if (!specifier.startsWith(".")) continue;
      const dependency = path.resolve(path.dirname(abs), specifier);
      const depRelative = path.relative(root, dependency);
      if (!depRelative || depRelative.startsWith(".." + path.sep) || path.isAbsolute(depRelative)) {
        throw new Error(`module import escapes repository: ${specifier} from ${relative}`);
      }
      pending.push(dependency);
    }
  }
  return [...modules].sort();
}

async function copyRepositoryPath(relative) {
  const source = path.join(root, relative);
  if (!(await stat(source).catch(() => null))?.isFile()) {
    throw new Error(`required offline asset is missing: ${relative}`);
  }
  const destination = path.join(appDir, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

await rm(appDir, { recursive: true, force: true });
await mkdir(appDir, { recursive: true });
const sourceHtml = await readFile(entryHtml, "utf8");
const moduleTag = '<script type="module" src="./js/planet-viewer-4dwm.js"></script>';
if (!sourceHtml.includes(moduleTag)) throw new Error("Planet Viewer entry HTML module tag changed; update this builder deliberately");
const stagedHtml = sourceHtml.replace(
  moduleTag,
  '<script src="./webxdc.js"></script>\n  ' + moduleTag,
);
await writeFile(path.join(appDir, "index.html"), stagedHtml);

const modules = await collectModules(entryModule);
for (const abs of modules) {
  const relative = path.relative(root, abs).split(path.sep).join("/");
  await copyRepositoryPath(relative);
}
for (const relative of staticAssets) await copyRepositoryPath(relative);

await writeFile(path.join(appDir, "manifest.toml"), manifest);
await writeFile(path.join(appDir, "webxdc.js"), `/* webxdc simulator shim - the host overrides this file at runtime. */
window.webxdc = window.webxdc || {
  selfAddr: "local@device",
  selfName: "local",
  sendUpdate() {},
  setUpdateListener: async () => 0,
  getAllUpdates: async () => [],
};
`);

const appFiles = [];
async function walk(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const abs = path.join(directory, item.name);
    if (item.isDirectory()) await walk(abs);
    else if (item.isFile()) appFiles.push(path.relative(appDir, abs).split(path.sep).join("/"));
  }
}
await walk(appDir);
for (const required of [
  "index.html", "manifest.toml", "webxdc.js", "vendor/world/countries.geo.json", "vendor/world/UNLICENSE",
  "resources/country-viewer/bora-bora-place-register-2026-11-09.json",
  "resources/country-viewer/licenses/ODbL-1.0.md",
]) {
  if (!appFiles.includes(required)) throw new Error(`Planet Viewer offline app is missing ${required}`);
}
console.log(`Staged public/apps/planet-viewer (${appFiles.length} files; ${modules.length} local modules).`);
console.log("The legacy planet-viewer-4dwm.xdc compatibility artifact was not modified.");
