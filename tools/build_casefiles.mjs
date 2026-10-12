#!/usr/bin/env node
/*
 * build_casefiles.mjs — regenerate the CASEFILES lab's single-file build.
 *
 *   node tools/build_casefiles.mjs            # build casefiles-inlined.html
 *   node tools/build_casefiles.mjs --check    # verify only; exit 1 on drift
 *
 * casefiles-inlined.html is derived from tracked sources and must never be
 * hand-edited. It is casefiles.html with ./css/validator.css,
 * ./css/viruslab.css, ./css/casefiles.css, ./css/project-y-4dwm.css and
 * ./css/casefiles-4dwm.css inlined into <style> elements, and the whole ES
 * module graph behind ./js/casefiles.js (x86dis, ghidra-wasm, artifacts,
 * krome-catalog, makint, the 4DWM theater, its window manager, the VRML writer,
 * vendor/fflate) inlined into a single <script type="module">. The vendored
 * Ghidra decompiler bundle (wasm/ghidra/*) and the demo.exe sanity binary are
 * embedded as base64 so the single file runs with no server and no network.
 *
 * The inlining flattens every module into one scope, so a top-level name
 * declared twice is a hard error: section 4 diffs the declarations across the
 * bundle and refuses to write the file otherwise.
 *
 * casefiles.xdc is NOT produced here. The webxdc ships the multi-file 4DWM
 * family layout — a real deflated ZIP with manifest.toml, js/, css/, wasm/ and
 * demo.exe as separate entries — and scripts/build-casefiles-xdc.mjs owns it:
 *
 *   node scripts/build-casefiles-xdc.mjs       # repack
 *   node scripts/build-casefiles-xdc.mjs --check
 *   npm run build:casefiles / npm run check:casefiles
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
for (const name of ["validator.css", "viruslab.css", "casefiles.css", "project-y-4dwm.css", "casefiles-4dwm.css"]) {
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

const flat = (p) => stripExports(read(p).toString("utf8"));
const bundleModules = [
  ["asset store", preamble],
  ["vendor/fflate", fflate],
  ["js/x86dis.js", flat("js/x86dis.js")],
  ["js/ghidra-wasm.js", ghidra],
  ["js/artifacts.js", flat("js/artifacts.js")],
  ["js/krome-catalog.js", flat("js/krome-catalog.js")],
  ["js/makint.js", flat("js/makint.js")],
  ["js/vrml-export.js", flat("js/vrml-export.js")],
  ["js/project-y-4dwm.js", flat("js/project-y-4dwm.js")],
  ["js/casefiles-4dwm.js", flat("js/casefiles-4dwm.js")],
  ["js/casefiles.js", casefiles],
];

// --- 3b. one scope, one name each -----------------------------------------
// Every module is concatenated into a single <script type="module">, so two
// top-level `const x` declarations would be a SyntaxError at load time, far
// from the file that caused it. Catch it here, where the message can name both.
function topLevelNames(src) {
  const names = new Map();
  const decl = /^(?:async\s+)?(?:export\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of src.matchAll(decl)) if (!names.has(m[1])) names.set(m[1], "");
  const destructuring = /^(?:const|let|var)\s+\{([^}]*)\}\s*=/gm;
  for (const m of src.matchAll(destructuring)) {
    for (const part of m[1].split(",")) {
      const name = part.split(":").pop().split("=")[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name) && !names.has(name)) names.set(name, "");
    }
  }
  return names;
}

const seen = new Map();
for (const [label, src] of bundleModules) {
  for (const name of topLevelNames(src).keys()) {
    if (seen.has(name)) {
      console.error(`build_casefiles: top-level name collides in the flat bundle: ${name} in ${seen.get(name)} and ${label}`);
      console.error("             rename one of them; the inlined build is one scope.");
      process.exit(2);
    }
    seen.set(name, label);
  }
}

const bundle = bundleModules.map(([, src]) => src).join("\n");

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

// --- 4. write or verify the single file ------------------------------------
// The inlined HTML is what ships as the repo's no-server, no-network build.
// casefiles.xdc is packed by scripts/build-casefiles-xdc.mjs (the 4DWM-family
// ZIP layout) out of the *authored* sources, not out of this file — the wasm
// belongs in the archive as bytes, not as base64 inside a <script>.
const targets = [["casefiles-inlined.html", Buffer.from(inlined, "utf8")]];

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

// --- 5. self-verification ---------------------------------------------------
if (!checkOnly) {
  const text = inlined;
  const mustSee = [
    ["4DWM tab", 'data-view="theater"'],
    ["4DWM canvas", 'id="cf4Canvas"'],
    ["4DWM desk", 'id="cf4Desk"'],
    ["theater module", "initCasefilesTheater"],
    ["window manager", "initPipWm"],
    ["VRML writer", "fieldToVrml"],
    ["flat-scope asset store", "__GHIDRA_ASSETS"],
  ];
  const missing = mustSee.filter(([, needle]) => !text.includes(needle)).map(([what]) => what);
  if (missing.length) {
    console.error(`build_casefiles: inlined build is missing ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log(`bundle modules: ${bundleModules.map(([label]) => label).join(" + ")}`);
  console.log(`embedded assets: ${Object.keys(assets).length} wasm/ghidra files + demo.exe`);
  console.log(`theater hooks: ${mustSee.length} checked in the written file`);
  console.log("next: node scripts/build-casefiles-xdc.mjs   (repacks casefiles.xdc)");
}

if (checkOnly && drift) {
  console.error(`\n${drift} derived artifact(s) out of date — run: npm run build:casefiles`);
  process.exit(1);
}
