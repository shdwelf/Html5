#!/usr/bin/env node
/**
 * Rebuild the legacy-cased Georgia Subsurface Webxdc alias from the current
 * georgia-subsurface package while preserving its historical page content.
 *
 * The alias keeps its own .xdc name and page, but shares the same generated
 * app modules so fixes to the city PIP manager cannot drift between copies.
 */
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceApp = path.join(root, "public", "apps", "georgia-subsurface");
const appDir = path.join(root, "public", "apps", "Georgia-subsurface");
const outName = "Georgia-subsurface.xdc";
const mtime = new Date("2026-10-13T00:00:00.000Z");
const manifest = `name = "Georgia Subsurface 4Dwm"
source_code_url = "https://github.com/shdwelf/Html5"
`;

const sourceHtml = await readFile(path.join(root, "Georgia-subsurface.html"), "utf8");
const entry = '<script type="module" src="./js/city-subsurface.js"></script>';
if (!sourceHtml.includes(entry)) throw new Error("Georgia alias module insertion point is missing.");

await rm(appDir, { recursive: true, force: true });
await cp(sourceApp, appDir, { recursive: true });
const html = sourceHtml.replace(
  entry,
  '<script src="./webxdc.js"></script>\n  ' + entry,
);
await writeFile(path.join(appDir, "index.html"), html);
await writeFile(path.join(appDir, "manifest.toml"), manifest);

async function walk(dir) {
  const files = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, item.name);
    if (item.isDirectory()) files.push(...(await walk(absolute)));
    else if (item.isFile()) files.push(absolute);
  }
  return files;
}

const archive = {};
for (const absolute of (await walk(appDir)).sort()) {
  const relative = path.relative(appDir, absolute).split(path.sep).join("/");
  archive[relative] = [new Uint8Array(await readFile(absolute)), { level: 9, mtime }];
}
if (!archive["index.html"] || !archive["manifest.toml"] || !archive["js/pip-window-manager.js"]) {
  throw new Error("Georgia alias bundle is missing its entry, manifest, or local PIP manager.");
}

const bytes = zipSync(archive, { level: 9, mtime });
await writeFile(path.join(root, outName), bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outName), bytes);
console.log(`Webxdc: ${outName} (${bytes.length.toLocaleString()} bytes, ${Object.keys(archive).length} entries)`);
console.log(`  sha256: ${createHash("sha256").update(bytes).digest("hex")}`);
