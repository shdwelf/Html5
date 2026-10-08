#!/usr/bin/env node
/**
 * Package the Lawrence, KS subsurface theater as a self-contained Webxdc.
 *
 *   node scripts/build-lawrence-subsurface-xdc.mjs
 *
 * The app stages root authoring sources into public/apps/lawrence-subsurface,
 * follows the first-party JS import graph (including an optional locally
 * generated higher-resolution DEM), then creates deterministic ZIP archives.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "lawrence-subsurface");
const outName = "lawrence-subsurface.xdc";
const mtime = new Date("2026-10-08T00:00:00.000Z");

// Keep the generated browser module byte-identical to the JSON source register.
execFileSync(process.execPath, [path.join(root, "scripts/build-lawrence-dem-data.mjs")], { stdio: "inherit" });

const manifest = `name = "Lawrence Subsurface 4Dwm"
source_code_url = "https://github.com/shdwelf/Html5"
`;

await rm(appDir, { recursive: true, force: true });
await mkdir(path.join(appDir, "css"), { recursive: true });
await mkdir(path.join(appDir, "vendor"), { recursive: true });

const shell = await readFile(path.join(root, "lawrence-subsurface.html"), "utf8");
const entryTag = '<script type="module" src="./js/lawrence-subsurface.js"></script>';
if (!shell.includes(entryTag)) throw new Error("Lawrence HTML is missing its module entry tag");
const bundledShell = shell.replace(entryTag, '<script src="./webxdc.js"></script>\n  ' + entryTag);
await writeFile(path.join(appDir, "index.html"), bundledShell);
await copyFile(path.join(root, "css/socal-subsurface.css"), path.join(appDir, "css/socal-subsurface.css"));

function moduleSpecifiers(source) {
  const found = [];
  const patterns = [
    /\b(?:import\s+(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*)["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match[1]);
  }
  return found;
}

async function collectModules(entry) {
  const pending = [entry];
  const visited = new Set();
  const optional = new Set();
  while (pending.length) {
    const absolute = path.resolve(pending.pop());
    if (visited.has(absolute)) continue;
    visited.add(absolute);
    const source = await readFile(absolute, "utf8");
    for (const specifier of moduleSpecifiers(source)) {
      if (!specifier.startsWith(".")) continue;
      const dependency = path.resolve(path.dirname(absolute), specifier);
      const rel = path.relative(root, dependency).split(path.sep).join("/");
      if (!rel || rel === ".." || rel.startsWith("../")) {
        throw new Error(`module import escapes the repo: ${specifier} from ${path.relative(root, absolute)}`);
      }
      if (rel === "vendor" || rel.startsWith("vendor/")) continue;
      if (await stat(dependency).catch(() => null)) pending.push(dependency);
      else optional.add(`${path.relative(root, absolute).split(path.sep).join("/")} -> ${specifier}`);
    }
  }
  return { modules: [...visited].sort(), optional: [...optional].sort() };
}

const { modules, optional } = await collectModules(path.join(root, "js/lawrence-subsurface.js"));
for (const absolute of modules) {
  const relative = path.relative(root, absolute);
  const destination = path.join(appDir, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(absolute, destination);
}
for (const missing of optional) console.log(`Optional module not staged: ${missing}`);

// This module is loaded through a Vite-ignored dynamic path so the standalone
// root HTML still serves when no high-resolution grid has been generated.
const optionalDem = path.join(root, "js", "lawrence-dem-grid.js");
if (await stat(optionalDem).catch(() => null)) {
  await copyFile(optionalDem, path.join(appDir, "js", "lawrence-dem-grid.js"));
} else {
  console.log("Optional module not staged: js/lawrence-dem-grid.js (generate with scripts/fetch-lawrence-dem.py)");
}

for (const filename of ["three.module.min.js", "OrbitControls.js", "THREE_LICENSE"]) {
  await copyFile(path.join(root, "vendor", filename), path.join(appDir, "vendor", filename));
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
const iconPath = path.join(root, "icon.png");
if (await stat(iconPath).catch(() => null)) await copyFile(iconPath, path.join(appDir, "icon.png"));

async function walk(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, item.name);
    if (item.isDirectory()) files.push(...(await walk(absolute)));
    else if (item.isFile()) files.push(absolute);
  }
  return files;
}

const archive = {};
for (const absolute of (await walk(appDir)).sort()) {
  const name = path.relative(appDir, absolute).split(path.sep).join("/");
  archive[name] = [new Uint8Array(await readFile(absolute)), { level: 9, mtime }];
}
if (!archive["index.html"] || !archive["manifest.toml"]) throw new Error("xdc is missing index.html or manifest.toml");
const bytes = zipSync(archive, { level: 9, mtime });
await writeFile(path.join(root, outName), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outName), bytes);
console.log(`Webxdc: ${outName} (${bytes.length.toLocaleString()} bytes, ${Object.keys(archive).length} entries)`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
