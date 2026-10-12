/**
 * Package CASEFILES · 4DWM as a Webxdc bundle — the 4DWM-family layout, applied
 * to the Ghidra casefiles lab.
 *
 * A .xdc is a deflated ZIP rooted at index.html + manifest.toml. This script
 * stages the root-level authoring sources as a *flat, offline, multi-file*
 * bundle under public/apps/casefiles/ and zips it deterministically:
 *
 *   index.html          casefiles.html, with <script src="./webxdc.js"> before
 *                       the module script (the host replaces the shim at
 *                       runtime) and the PWA links dropped — inside a webxdc
 *                       there is no site manifest to point at.
 *   js/, css/           the authored sources, copied verbatim: the module-graph
 *                       walker follows casefiles.js' real imports, so this
 *                       script never keeps a second dependency list.
 *   vendor/fflate/      the ES entry, with its two Node-only lines removed —
 *                       `import { createRequire } from 'module'` is a bare
 *                       specifier a webxdc host cannot resolve, and the
 *                       worker_threads probe is inside a try/catch so the
 *                       module falls back to the synchronous browser path.
 *   wasm/ghidra/        the decompiler bundle: 3.9 MB of wasm + .sla/.pspec/
 *                       .spec, shipped as separate entries and deflated, not
 *                       base64-stuffed into the HTML the way the single-file
 *                       build has to (see tools/build_casefiles.mjs).
 *   demo.exe, icon.png, img/  the offline sanity binary and the icons.
 *
 *   node scripts/build-casefiles-xdc.mjs            # repack casefiles.xdc
 *   node scripts/build-casefiles-xdc.mjs --check    # verify only; exit 1 on drift
 *
 * Byte-stability: entries are sorted and every mtime is pinned, so two builds
 * from the same sources produce the same sha256. The 4DWM-family check
 * (`npm run check:casefiles`) relies on that.
 */

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Prefer the installed package; fall back to the vendored copy so the build
// works in a bare checkout with no node_modules.
const { zipSync, unzipSync } = await import("fflate")
  .then((m) => m)
  .catch(() => import("../vendor/fflate/index.mjs"));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "public", "apps", "casefiles");
const outName = "casefiles.xdc";
const mtime = new Date("2026-10-12T00:00:00.000Z"); // reproducible builds
const checkOnly = process.argv.includes("--check");

const manifest = `name = "CASEFILES · Ghidra Case Files + 4DWM"
source_code_url = "https://github.com/shdwelf/Html5"
description = "Static analysis of the 1998 kr0me corp library and the 1996 Rodger Ramrod package: Wayback recovery behind a SHA-1 gate, fflate unzip, SLEIGH x86, the Ghidra decompiler as WebAssembly, and a 4DWM plate that draws the capture corpus and the bit-plane relief in 3D over a fourth axis of time. Nothing is executed."
`;

const CSS = ["validator.css", "viruslab.css", "casefiles.css", "project-y-4dwm.css", "casefiles-4dwm.css"];
const IMG = ["app-192.png", "apple-touch.png", "app-512.png"];

await rm(appDir, { recursive: true, force: true });
for (const dir of ["js", "css", "vendor/fflate", "wasm", "img"]) {
  await mkdir(path.join(appDir, dir), { recursive: true });
}

/* ------------------------------------------------------------- index.html */

let html = await readFile(path.join(root, "casefiles.html"), "utf8");
const SCRIPT_TAG = '  <script type="module" src="./js/casefiles.js"></script>';
if (!html.includes(SCRIPT_TAG)) {
  console.error("build-casefiles-xdc: expected module script tag not found in casefiles.html");
  process.exit(2);
}
html = html.replace(SCRIPT_TAG, `  <script src="./webxdc.js"></script>\n${SCRIPT_TAG}`);
// A PWA manifest and a favicon path are meaningless inside a chat app; drop the
// links instead of shipping a 404 for each.
const DROPPED = [
  '  <link rel="manifest" href="./manifest.webmanifest" />\n',
  '  <link rel="icon" href="./img/app-192.png" sizes="192x192" />\n',
  '  <link rel="apple-touch-icon" href="./img/apple-touch.png" sizes="180x180" />\n',
];
for (const tag of DROPPED) {
  if (!html.includes(tag)) {
    console.error(`build-casefiles-xdc: expected tag to drop not found:\n${tag.trim()}`);
    process.exit(2);
  }
  html = html.replace(tag, "");
}
await writeFile(path.join(appDir, "index.html"), html);

/* ------------------------------------------------------------- the module */
/* graph, followed rather than listed                                      */

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
  while (pending.length) {
    const abs = path.resolve(pending.pop());
    if (modules.has(abs)) continue;
    modules.add(abs);
    const source = await readFile(abs, "utf8");
    for (const specifier of moduleSpecifiers(source)) {
      if (!specifier.startsWith(".")) continue; // bare specifier: not resolvable in a webxdc
      const dependency = path.resolve(path.dirname(abs), specifier);
      const rel = path.relative(root, dependency).split(path.sep).join("/");
      if (rel.startsWith("..")) {
        throw new Error(`module import escapes repository: ${specifier} from ${path.relative(root, abs)}`);
      }
      if (rel === "vendor" || rel.startsWith("vendor/")) continue; // staged below, patched
      if (await stat(dependency).catch(() => null)) pending.push(dependency);
      else throw new Error(`module import does not resolve: ${specifier} from ${path.relative(root, abs)}`);
    }
  }
  return [...modules].sort();
}

const modules = await collectModules(path.join(root, "js", "casefiles.js"));
for (const abs of modules) {
  const rel = path.relative(root, abs);
  await mkdir(path.dirname(path.join(appDir, rel)), { recursive: true });
  await copyFile(abs, path.join(appDir, rel));
}

/* --------------------------------------------------------------- the css */

for (const name of CSS) {
  await copyFile(path.join(root, "css", name), path.join(appDir, "css", name));
}

/* ------------------------------------------------- the vendored inflater */

const fflateSource = await readFile(path.join(root, "vendor", "fflate", "index.mjs"), "utf8");
const nodeOnly = "import { createRequire } from 'module';\nvar require = createRequire('/');\n";
if (!fflateSource.startsWith(nodeOnly)) {
  console.error("build-casefiles-xdc: vendor/fflate/index.mjs no longer starts with the Node preamble this script strips");
  process.exit(2);
}
await writeFile(path.join(appDir, "vendor", "fflate", "index.mjs"), fflateSource.slice(nodeOnly.length));
await copyFile(path.join(root, "vendor", "fflate", "LICENSE"), path.join(appDir, "vendor", "fflate", "LICENSE"));

/* ------------------------------------------- the Ghidra wasm + languages */

async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  let count = 0;
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) count += await copyTree(src, dst);
    else if (entry.isFile()) { await copyFile(src, dst); count++; }
  }
  return count;
}
const wasmFiles = await copyTree(path.join(root, "wasm", "ghidra"), path.join(appDir, "wasm", "ghidra"));

for (const name of ["demo.exe"]) {
  await copyFile(path.join(root, name), path.join(appDir, name));
}
for (const name of IMG) {
  const src = path.join(root, "img", name);
  if (await stat(src).catch(() => null)) await copyFile(src, path.join(appDir, "img", name));
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
await copyFile(path.join(root, "icon.png"), path.join(appDir, "icon.png"));

/* --------------------------------------------------------------- the zip */

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
for (const required of ["index.html", "manifest.toml", "webxdc.js", "icon.png", "demo.exe"]) {
  if (!archive[required]) throw new Error(`bundle missing ${required}`);
}

const bytes = zipSync(archive, { level: 9, mtime });

/* --------------------------------------------------- self-verification */

// Round-trip the archive and prove that every relative import and every static
// reference in the shipped HTML resolves to an entry that is actually there.
const back = unzipSync(bytes);
const names = new Set(Object.keys(back));
const problems = [];
for (const name of names) {
  if (!name.endsWith(".js") && !name.endsWith(".mjs") && !name.endsWith(".html")) continue;
  const src = new TextDecoder().decode(back[name]);
  const base = path.posix.dirname(name);
  const refs = name.endsWith(".html")
    ? [...src.matchAll(/(?:src|href)="\.\/([^"]+\.(?:js|css|mjs))"/g)].map((m) => m[1])
    : moduleSpecifiers(src);
  for (const spec of refs) {
    if (!spec.startsWith(".") && name.endsWith(".html")) continue;
    const target = spec.startsWith(".") ? path.posix.normalize(path.posix.join(base, spec)) : spec;
    if (!names.has(target)) problems.push(`${name} → ${spec}`);
  }
}
if (problems.length) {
  console.error("build-casefiles-xdc: shipped references that do not resolve inside the bundle:");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
const indexHtml = new TextDecoder().decode(back["index.html"]);
for (const bad of ["./manifest.webmanifest", 'from "module"', "node:module"]) {
  if (indexHtml.includes(bad) || new TextDecoder().decode(back["vendor/fflate/index.mjs"]).includes(bad)) {
    console.error(`build-casefiles-xdc: bundle still carries a host-unresolvable reference: ${bad}`);
    process.exit(1);
  }
}

const digest = createHash("sha256").update(bytes).digest("hex");
const outPath = path.join(root, outName);
const onDisk = await readFile(outPath).catch(() => null);

if (checkOnly) {
  if (onDisk && createHash("sha256").update(onDisk).digest("hex") === digest) {
    console.log(`up to date  ${outName}  (${bytes.length.toLocaleString()} bytes, ${names.size} entries, sha256 ${digest.slice(0, 16)}…)`);
    process.exit(0);
  }
  console.log(`STALE       ${outName}`);
  console.log(`            on disk ${onDisk ? `${onDisk.length.toLocaleString()} bytes` : "missing"}`);
  console.log(`            rebuilt ${bytes.length.toLocaleString()} bytes / sha256 ${digest.slice(0, 16)}…`);
  console.error(`\n${outName} out of date — run: node scripts/build-casefiles-xdc.mjs`);
  process.exit(1);
}

await writeFile(outPath, bytes);
await mkdir(path.join(root, "dist"), { recursive: true });
await writeFile(path.join(root, "dist", outName), bytes);

console.log(`Webxdc: ${outName} (${bytes.length.toLocaleString()} bytes, ${names.size} entries)`);
console.log(`  sha256: ${digest}`);
console.log(`  js modules: ${modules.length} · css: ${CSS.length} · wasm/ghidra: ${wasmFiles} files · demo.exe + icons`);
console.log(`  fflate shipped with the Node-only preamble stripped (bare 'module' import cannot resolve in a host)`);
console.log(`  every relative import and static src/href resolves inside the archive — verified by round-trip`);
