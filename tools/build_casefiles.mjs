#!/usr/bin/env node
/*
 * build_casefiles.mjs — regenerate the CASEFILES lab's derived artifacts.
 *
 *   node tools/build_casefiles.mjs            # build inlined HTML + webxdc
 *   node tools/build_casefiles.mjs --check    # verify only; exit 1 on drift
 *
 * Two artifacts are derived from tracked sources and must never be hand-edited:
 *
 *   1. casefiles-inlined.html
 *      casefiles.html with ./css/validator.css, ./css/viruslab.css and
 *      ./css/casefiles.css inlined into <style> elements, and the whole ES
 *      module graph behind ./js/casefiles.js (x86dis, ghidra-wasm, artifacts,
 *      krome-catalog, makint, vendor/fflate) inlined into a single
 *      <script type="module">. The vendored Ghidra decompiler bundle
 *      (wasm/ghidra/*) and the demo.exe sanity binary are embedded as base64
 *      so the single file runs with no server and no network.
 *
 *   2. casefiles.xdc
 *      A webxdc package in this repo's established NUL-delimited layout:
 *      entries written as name + NUL + content, with a final NUL terminator.
 *      Entry order is manifest.json, index.html (the inlined file), icon.png.
 *
 * --check compares both regenerated artifacts against the files on disk, so CI
 * or a pre-commit run can prove the checked-in artifacts match their sources.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p));
const md5 = (b) => createHash("md5").update(b).digest("hex");
const checkOnly = process.argv.includes("--check");

// --- 1. inline the stylesheets ----------------------------------------------
let inlined = read("casefiles.html").toString("utf8");
for (const name of ["validator.css", "viruslab.css", "casefiles.css"]) {
  const css = read(`css/${name}`).toString("utf8");
  const tag = `  <link rel="stylesheet" href="./css/${name}" />`;
  if (!inlined.includes(tag)) {
    console.error(`build_casefiles: expected stylesheet tag not found:\n  ${tag.trim()}`);
    process.exit(2);
  }
  inlined = inlined.replace(tag, `  <style>\n${css}\n</style>`);
}

// --- 2. bundle the ES module graph ------------------------------------------
// Strip module syntax so every module shares one flat scope.
const stripExports = (src) =>
  src
    // import declarations (single- or multi-line, incl. bare side-effect imports)
    .replace(/^import\s+(?:[^'"`]*?\s+from\s+)?['"][^'"]+['"]\s*;?\s*$/gm, "")
    // re-export lists: `export { Deflate };`
    .replace(/^export\s*\{[^}]*\}\s*;?$/gm, "")
    // named exports: `export function|const|let|var|class …`
    .replace(/^export\s+(?=(?:async\s+)?(?:function|const|let|var|class)\b)/gm, "");

// fflate ships the Node entry (it pulls `createRequire` from `node:module`).
// Drop the two Node-only lines; the `require('worker_threads')` probe is inside
// a try/catch so it degrades to the synchronous browser path casefiles uses.
const fflate = stripExports(
  read("vendor/fflate/index.mjs")
    .toString("utf8")
    .replace("import { createRequire } from 'module';\nvar require = createRequire('/');\n", "")
);

const ghidra = stripExports(
  read("js/ghidra-wasm.js")
    .toString("utf8")
    // Inlined build: wasm assets come from the embedded base64 store, not disk.
    .replace(
      `const DEFAULT_ROOT = new URL("../wasm/ghidra/", import.meta.url);`,
      `const DEFAULT_ROOT = "wasm/ghidra/"; // inlined build: assets resolve via __ghidraFetch/__ghidraUrl`
    )
    .replace(
      `const res = await fetch(new URL("processors.json", this.root));`,
      `const res = await __ghidraFetch("processors.json");`
    )
    .replace(
      `this.module = await globalThis.GhidraDecompiler({\n          locateFile: (p) => new URL(p, this.root).href,\n          print: (s) => this.log(s, "ghidra"),\n          printErr: (s) => this.log(s, "error"),\n        });`,
      `this.module = await globalThis.GhidraDecompiler({\n          wasmBinary: await (await __ghidraFetch("ghidra_decompiler.wasm")).arrayBuffer(),\n          print: (s) => this.log(s, "ghidra"),\n          printErr: (s) => this.log(s, "error"),\n        });`
    )
    .replace(
      `const src = new URL("ghidra_decompiler.js", this.root).href;`,
      `const src = __ghidraUrl("ghidra_decompiler.js");`
    )
    .replace(`fetch(new URL(lang.sla, this.root)),`, `__ghidraFetch(lang.sla),`)
    .replace(`fetch(new URL(lang.pspec, this.root)),`, `__ghidraFetch(lang.pspec),`)
    .replace(`fetch(new URL(compiler.spec, this.root)),`, `__ghidraFetch(compiler.spec),`)
);

const casefiles = stripExports(
  read("js/casefiles.js")
    .toString("utf8")
    .replace(
      `async function loadDemo() {\n  const res = await fetch("./demo.exe");\n  return new Uint8Array(await res.arrayBuffer());\n}`,
      `async function loadDemo() {\n  return __demoBytes();\n}`
    )
);

// --- 3. embedded asset store (wasm/ghidra + demo.exe) -----------------------
function walk(dir, base = "") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    if (statSync(abs).isDirectory()) out.push(...walk(abs, rel));
    else out.push(rel);
  }
  return out.sort();
}

const assets = {};
for (const rel of walk(join(root, "wasm", "ghidra"))) {
  assets[rel] = read(join("wasm", "ghidra", rel)).toString("base64");
}
const demoB64 = read("demo.exe").toString("base64");

const assetLiteral = JSON.stringify(assets, null, 2)
  // keep the object one key per line but avoid huge indentation on the values
  .replace(/: "([A-Za-z0-9+/=]{200,})"/g, ': "$1"');

const preamble = `/* Inlined asset store — generated by tools/build_casefiles.mjs. */
const __GHIDRA_ASSETS = ${assetLiteral};
function __b64bytes(b64) {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function __ghidraFetch(rel) {
  const b64 = __GHIDRA_ASSETS[rel];
  if (b64 !== undefined) return Promise.resolve(new Response(__b64bytes(b64)));
  return fetch(rel);
}
function __ghidraUrl(rel) {
  const b64 = __GHIDRA_ASSETS[rel];
  if (b64 === undefined) return rel;
  const mime = rel.endsWith(".wasm")
    ? "application/wasm"
    : rel.endsWith(".json")
    ? "application/json"
    : "text/plain;charset=utf-8";
  return "data:" + mime + ";base64," + b64;
}
const __DEMO_B64 = "${demoB64}";
function __demoBytes() { return __b64bytes(__DEMO_B64); }
`;

const bundle = [
  preamble,
  fflate,
  read("js/x86dis.js").toString("utf8").replace(/^export\s+/gm, ""),
  ghidra,
  read("js/artifacts.js").toString("utf8").replace(/^export\s+/gm, ""),
  read("js/krome-catalog.js").toString("utf8").replace(/^export\s+/gm, ""),
  read("js/makint.js").toString("utf8").replace(/^export\s+/gm, ""),
  casefiles,
].join("\n");

const SCRIPT_TAG = '  <script type="module" src="./js/casefiles.js"></script>';
if (!inlined.includes(SCRIPT_TAG)) {
  console.error(`build_casefiles: expected script tag not found:\n  ${SCRIPT_TAG.trim()}`);
  process.exit(2);
}
inlined = inlined.replace(SCRIPT_TAG, `  <script type="module">\n${bundle}\n</script>`);

// The standalone build must not reference external CSS or JS.
for (const bad of ['<link rel="stylesheet"', "<script src="]) {
  if (inlined.includes(bad)) {
    console.error(`build_casefiles: inlined build still references external asset: ${bad}`);
    process.exit(2);
  }
}

// --- 4. pack the webxdc -----------------------------------------------------
// Comma/colon spacing matches the manifest the original packer wrote
// (Python json.dumps defaults). Keep it byte-stable.
const jsonDumps = (value) => {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(jsonDumps).join(", ")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${jsonDumps(v)}`).join(", ")}}`;
  }
  return JSON.stringify(value);
};

const manifest = jsonDumps({
  name: "Ghidra Casefiles",
  source_code_url: "https://github.com/shdwelf/Html5",
  version: "1.0.0",
  min_api: 1,
  webxdc: "index.html",
});

const NUL = Buffer.from([0]);
const parts = [];
for (const [name, content] of [
  ["manifest.json", manifest],
  ["index.html", inlined],
  ["icon.png", read("icon.png")],
]) {
  parts.push(Buffer.from(name, "utf8"), NUL, Buffer.from(content), NUL);
}
const xdc = Buffer.concat(parts);

// --- 5. write or verify -----------------------------------------------------
const targets = [
  ["casefiles-inlined.html", Buffer.from(inlined, "utf8")],
  ["casefiles.xdc", xdc],
];

let drift = 0;
for (const [rel, want] of targets) {
  let have;
  try {
    have = read(rel);
  } catch {
    have = Buffer.alloc(0);
  }
  if (have.equals(want)) {
    console.log(`up to date  ${rel}  (${want.length} bytes, md5 ${md5(want)})`);
    continue;
  }
  if (checkOnly) {
    console.log(`STALE       ${rel}  on disk ${have.length} bytes / md5 ${md5(have)}`);
    console.log(`            ${rel}  rebuilt ${want.length} bytes / md5 ${md5(want)}`);
    drift++;
  } else {
    writeFileSync(join(root, rel), want);
    console.log(`wrote       ${rel}  (${want.length} bytes, md5 ${md5(want)})`);
  }
}

// --- 6. self-verification ---------------------------------------------------
if (!checkOnly) {
  const fields = xdc.toString("latin1").split("\0");
  if (
    fields[0] !== "manifest.json" ||
    !fields[1].includes('"name": "Ghidra Casefiles"') ||
    fields[2] !== "index.html" ||
    !fields[3].startsWith("<!DOCTYPE html>") ||
    fields[4] !== "icon.png"
  ) {
    console.error("build_casefiles: container round-trip failed — layout corrupt");
    process.exit(1);
  }
  console.log(`container verified: ${fields[4] === "icon.png" ? "3" : "?"} entries, layout intact`);
  console.log(`bundle modules: fflate + x86dis + ghidra-wasm + artifacts + krome-catalog + makint + casefiles`);
  console.log(`embedded assets: ${Object.keys(assets).length} wasm/ghidra files + demo.exe`);
}

if (checkOnly && drift) {
  console.error(`\n${drift} derived artifact(s) out of date — run: node tools/build_casefiles.mjs`);
  process.exit(1);
}
