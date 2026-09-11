import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const outputName = "bip39-haiku-workbench.xdc";
const manifest = `name = "BIP-39 Haiku Workbench"
orientation = "landscape"
`;

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

// In the merged Html5 repository the root index.html is the SITE-K app, so the
// workbench's Vite entry is bip39-haiku-workbench.html. It is packaged as the
// Webxdc's index.html root below.
const entryName = "bip39-haiku-workbench.html";
const indexPath = path.join(dist, entryName);
if (!(await stat(indexPath).catch(() => null))) {
  throw new Error(`dist/${entryName} is missing; run Vite before packaging Webxdc`);
}

await writeFile(path.join(dist, "manifest.toml"), manifest);

// Stable timestamps make two builds from identical input byte-for-byte equal.
const mtime = new Date("2026-08-23T00:00:00.000Z");
const archive = {};
for (const absolute of (await walk(dist)).sort()) {
  const relative = path.relative(dist, absolute).split(path.sep).join("/");
  if (relative.endsWith(".xdc")) continue;
  if (relative === entryName) continue; // packaged as index.html below
  archive[relative] = [new Uint8Array(await readFile(absolute)), { level: 9, mtime }];
}
archive["index.html"] = [new Uint8Array(await readFile(indexPath)), { level: 9, mtime }];

// A Webxdc is a ZIP rooted at index.html + manifest.toml.
const bytes = zipSync(archive, { level: 9, mtime });
const outputPath = path.join(dist, outputName);
await writeFile(outputPath, bytes);

const digest = createHash("sha256").update(bytes).digest("hex");
const indexDigest = createHash("sha256").update(await readFile(indexPath)).digest("hex");
console.log(`Webxdc: ${path.relative(root, outputPath)} (${bytes.length.toLocaleString()} bytes)`);
console.log(`  xdc sha256:   ${digest}`);
console.log(`  index sha256: ${indexDigest}`);
console.log(`  entries:      ${Object.keys(archive).length}`);

// Package companion Webxdc applications from public/apps/
async function packageAppXdc(appDir, xdcName) {
  const dirPath = path.join(root, "public", "apps", appDir);
  if (!(await stat(dirPath).catch(() => null))) return;
  const appArchive = {};
  for (const absolute of (await walk(dirPath)).sort()) {
    const relative = path.relative(dirPath, absolute).split(path.sep).join("/");
    appArchive[relative] = [new Uint8Array(await readFile(absolute)), { level: 9, mtime }];
  }
  const appBytes = zipSync(appArchive, { level: 9, mtime });
  const appOutDist = path.join(dist, xdcName);
  const appOutRoot = path.join(root, xdcName);
  await writeFile(appOutDist, appBytes);
  await writeFile(appOutRoot, appBytes);
  console.log(`Webxdc: ${path.relative(root, appOutDist)} (${appBytes.length.toLocaleString()} bytes)`);
}

await packageAppXdc("sanborn-codex", "sanborn-codex.xdc");
await packageAppXdc("kryptos-vrml", "kryptos-vrml.xdc");
