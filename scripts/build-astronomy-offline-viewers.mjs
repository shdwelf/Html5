#!/usr/bin/env node
/**
 * Rebuild the offline Helios Observatory and Prime Viewer from their checked-in
 * Webxdc source archives. Each standalone folder includes the other viewer as
 * a local companion page so navigation still works without a server/network.
 *
 *   node scripts/build-astronomy-offline-viewers.mjs [--check]
 */
import { readFile, readdir, rm, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.join(root, "public", "apps");
const checkOnly = process.argv.includes("--check");

function archiveEntries(bytes, label) {
  const unpacked = unzipSync(bytes);
  const files = new Map();
  for (const [name, data] of Object.entries(unpacked)) {
    if (name.endsWith("/")) continue;
    if (name.startsWith("/") || name.includes("\\") || name.split("/").some((part) => part === ".." || part === "")) {
      throw new Error(`${label} contains an unsafe archive path: ${name}`);
    }
    files.set(name, new Uint8Array(data));
  }
  for (const required of ["index.html", "manifest.toml", "webxdc.js", "icon.png"]) {
    if (!files.has(required)) throw new Error(`${label} is missing ${required}`);
  }
  return files;
}

const heliosSource = archiveEntries(await readFile(path.join(root, "astronomy.xdc")), "astronomy.xdc");
const primeSource = archiveEntries(await readFile(path.join(root, "prime.xdc")), "prime.xdc");

function equalBytes(a, b) {
  return a.length === b.length && a.every((byte, index) => byte === b[index]);
}

function mergeStaticAssets(...archives) {
  const result = new Map();
  for (const archive of archives) {
    for (const [name, bytes] of archive) {
      if (name === "index.html" || name === "manifest.toml") continue;
      const current = result.get(name);
      if (current && !equalBytes(current, bytes)) {
        throw new Error(`Conflicting offline assets in source archives: ${name}`);
      }
      result.set(name, bytes);
    }
  }
  return result;
}

function rewriteNav(html, replacement, sourceLabel) {
  const matches = [...html.matchAll(/<nav>[\s\S]*?<\/nav>/g)];
  if (matches.length !== 1) throw new Error(`${sourceLabel} expected one navigation block, found ${matches.length}`);
  return html.replace(/<nav>[\s\S]*?<\/nav>/, replacement);
}

function text(bytes) {
  return new TextDecoder().decode(bytes);
}

function utf8(value) {
  return new TextEncoder().encode(value);
}

function makeAppFiles({ name, primaryHtml, companionHtml, companionFilename, manifest, assets }) {
  const files = new Map(assets);
  files.set("index.html", utf8(primaryHtml));
  files.set(companionFilename, utf8(companionHtml));
  files.set("manifest.toml", manifest);
  files.set("README.md", utf8(
    `# ${name} — offline viewer\n\n` +
    `Built locally from the checked-in astronomy.xdc and prime.xdc source archives. ` +
    `The companion viewer is included as a relative HTML page; JavaScript, CSS, ` +
    `Three.js, OrbitControls, and the Webxdc preview shim are local files. ` +
    `The app makes no network requests for viewer assets.\n`,
  ));
  return files;
}

const assets = mergeStaticAssets(heliosSource, primeSource);
const heliosIndex = text(heliosSource.get("index.html"));
const primeIndex = text(primeSource.get("index.html"));
const heliosHome = rewriteNav(
  heliosIndex,
  '<nav><a href="./prime.html">PRIME VIEWER</a></nav>',
  "Helios Observatory",
);
const primeHomeInHelios = rewriteNav(
  primeIndex,
  '<nav><a href="./index.html">HELIOS OBSERVATORY</a></nav>',
  "Prime Viewer companion page",
);
const primeHome = rewriteNav(
  primeIndex,
  '<nav><a href="./helios.html">HELIOS OBSERVATORY</a></nav>',
  "Prime Viewer",
);
const heliosHomeInPrime = rewriteNav(
  heliosIndex,
  '<nav><a href="./index.html">PRIME VIEWER</a></nav>',
  "Helios Observatory companion page",
);

const outputs = new Map([
  ["helios-observatory", makeAppFiles({
    name: "Helios Observatory",
    primaryHtml: heliosHome,
    companionHtml: primeHomeInHelios,
    companionFilename: "prime.html",
    manifest: heliosSource.get("manifest.toml"),
    assets,
  })],
  ["prime-viewer", makeAppFiles({
    name: "Prime Viewer",
    primaryHtml: primeHome,
    companionHtml: heliosHomeInPrime,
    companionFilename: "helios.html",
    manifest: primeSource.get("manifest.toml"),
    assets,
  })],
]);

async function listFiles(directory, relative = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(absolute, child));
    else if (entry.isFile()) files.push(child.split(path.sep).join("/"));
  }
  return files.sort();
}

for (const [appName, expected] of outputs) {
  const directory = path.join(appRoot, appName);
  if (checkOnly) {
    const actualFiles = await listFiles(directory).catch(() => null);
    const expectedFiles = [...expected.keys()].sort();
    if (!actualFiles || actualFiles.length !== expectedFiles.length || actualFiles.some((file, index) => file !== expectedFiles[index])) {
      throw new Error(`${appName} is stale or incomplete; run npm run build:astronomy-offline`);
    }
    for (const [relative, expectedBytes] of expected) {
      const actualBytes = new Uint8Array(await readFile(path.join(directory, relative)));
      if (!equalBytes(actualBytes, expectedBytes)) {
        throw new Error(`${appName}/${relative} differs from the XDC-derived expected output`);
      }
    }
    console.log(`Verified public/apps/${appName} (${expected.size} files).`);
  } else {
    await rm(directory, { recursive: true, force: true });
    for (const [relative, bytes] of expected) {
      const destination = path.join(directory, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, bytes);
    }
    console.log(`Built public/apps/${appName} (${expected.size} files; companion viewer is local).`);
  }
}
