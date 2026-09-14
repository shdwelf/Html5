#!/usr/bin/env node
/*
 * smoke_casefiles_bundle.mjs — prove the inlined CASEFILES bundle evaluates
 * and its modules expose the expected API, with the Ghidra asset store intact.
 *
 *   node tools/smoke_casefiles_bundle.mjs
 *
 * Extracts the single <script type="module"> from casefiles-inlined.html,
 * drops the DOM bootstrap (`init();`) so the module graph can be evaluated
 * headless, then exercises the flat-scope API: fflate sync codecs, x86dis,
 * GhidraWasm, artifacts, krome-catalog, makint, the demo bytes and the
 * embedded wasm/ghidra asset store.
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "casefiles-inlined.html"), "utf8");

const open = html.indexOf('<script type="module">');
const close = html.lastIndexOf("</script>");
if (open < 0 || close < 0 || close <= open) {
  console.error("smoke: could not locate the inline module script");
  process.exit(1);
}
let bundle = html.slice(open + '<script type="module">'.length, close);
// The controller self-boots with `init();` — drop it for a headless evaluation.
if (!bundle.trimEnd().endsWith("init();")) {
  console.error("smoke: expected the module to end with init();");
  process.exit(1);
}
bundle = bundle.slice(0, bundle.lastIndexOf("init();"));

const dir = mkdtempSync(join(tmpdir(), "casefiles-smoke-"));
const file = join(dir, "bundle.mjs");
writeFileSync(
  file,
  bundle +
    "\n" +
    `
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exit(1); } };
assert(typeof __GHIDRA_ASSETS === "object", "asset store present");
assert(Object.keys(__GHIDRA_ASSETS).length === 18, "18 embedded wasm/ghidra assets");
assert(typeof __ghidraFetch === "function" && typeof __ghidraUrl === "function", "asset helpers");
assert(typeof unzipSync === "function" && typeof unzlibSync === "function", "fflate sync api");
assert(typeof analyze === "function" && typeof entropyWindows === "function", "x86dis api");
assert(typeof GhidraWasm === "function" && typeof imageXml === "function", "ghidra-wasm api");
assert(typeof dissect === "function", "artifacts api");
assert(typeof SITE === "object" && Array.isArray(LIBRARY) && LIBRARY.length > 100, "krome catalog");
assert(typeof MAK_HEADER === "object" && typeof makeMakLines === "function", "makint api");
assert(typeof __demoBytes === "function" && __demoBytes().length === 63, "demo bytes");
const z = zipSync({ "a.txt": new Uint8Array([104, 105]) });
const unz = unzipSync(z);
assert(unz["a.txt"] && unz["a.txt"][0] === 104 && unz["a.txt"][1] === 105, "fflate zip round-trip");
const r = await __ghidraFetch("processors.json");
assert(r.ok, "processors.json fetch ok");
const j = await r.json();
assert(Array.isArray(j) && j.length === 6, "processors.json lists 6 languages");
const wasmBuf = await (await __ghidraFetch("ghidra_decompiler.wasm")).arrayBuffer();
assert(wasmBuf.byteLength === 2631174, "ghidra_decompiler.wasm byte length (" + wasmBuf.byteLength + ")");
const spec = await (await __ghidraFetch("Processors/x86/data/languages/x86.sla")).arrayBuffer();
assert(spec.byteLength === 432470, "x86.sla byte length (" + spec.byteLength + ")");
console.log("ALL SMOKE CHECKS PASSED");
`
);
try {
  await import(pathToFileURL(file).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
