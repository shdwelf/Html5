/**
 * Package the CIA Museum VRML campus app as a Webxdc bundle.
 *
 * A .xdc is a deflated ZIP rooted at index.html + manifest.toml. The app is
 * authored flat inside public/apps/cia-museum/ (no build step — dependency-
 * free ES modules), so this script just zips that directory deterministically
 * — same flow as build-cheyenne-xdc.mjs.
 *
 *   node scripts/build-cia-museum-xdc.mjs
 */

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Prefer the installed package; fall back to the vendored copy so the build
// works in a bare checkout with no node_modules.
const { zipSync } = await import("fflate").catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "cia-museum");
const outPath = path.join(root, "cia-museum.xdc");
const mtime = new Date("2026-10-02T00:00:00.000Z"); // reproducible builds

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(abs)));
    else if (entry.isFile()) files.push(abs);
  }
  return files;
}

const archive = {};
for (const abs of (await walk(appDir)).sort()) {
  const rel = path.relative(appDir, abs).split(path.sep).join("/");
  if (rel === "README.md") continue; // maintainer notes, not shipped content
  archive[rel] = [new Uint8Array(await readFile(abs)), { level: 9, mtime }];
}

// A Webxdc must be rooted at index.html + manifest.toml.
for (const required of ["index.html", "manifest.toml"]) {
  if (!archive[required]) throw new Error(`${required} missing from ${appDir}`);
}

const bytes = zipSync(archive, { level: 9, mtime });
await writeFile(outPath, bytes);

const digest = createHash("sha256").update(bytes).digest("hex");
console.log(`Webxdc: ${path.relative(root, outPath)} (${bytes.length.toLocaleString()} bytes, ${Object.keys(archive).length} entries)`);
console.log(`  sha256: ${digest}`);
