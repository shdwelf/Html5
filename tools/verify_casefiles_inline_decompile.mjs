#!/usr/bin/env node
/*
 * verify_casefiles_inline_decompile.mjs — prove the *inlined* CASEFILES bundle
 * can load the Ghidra decompiler from its embedded base64 assets (the browser
 * `_ensureGlobal` path, emulated headless) and decompile the demo.exe carve.
 *
 *   node tools/verify_casefiles_inline_decompile.mjs
 */
import vm from "node:vm";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "casefiles-inlined.html"), "utf8");
const open = html.indexOf('<script type="module">');
const close = html.lastIndexOf("</script>");
let bundle = html.slice(open + '<script type="module">'.length, close);
if (!bundle.trimEnd().endsWith("init();")) process.exit(1);
bundle = bundle.slice(0, bundle.lastIndexOf("init();"));

const dir = mkdtempSync(join(tmpdir(), "casefiles-deco-"));
const file = join(dir, "bundle.mjs");
writeFileSync(file, bundle + "\n" + `
import vm from "node:vm";
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exit(1); } };

// --- load the emscripten UMD from the embedded data: URL, as a classic script
const dataUrl = __ghidraUrl("ghidra_decompiler.js");
assert(dataUrl.startsWith("data:"), "ghidra_decompiler.js resolves to a data URL");
const umdSource = Buffer.from(dataUrl.split(",")[1], "base64").toString("utf8");

const sandbox = {
  window: {},
  document: { currentScript: { src: dataUrl } },
  console, performance, WebAssembly, fetch, Response, Headers,
  TextDecoder, TextEncoder, crypto: globalThis.crypto,
  setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON,
  URL, Uint8Array, Uint8ClampedArray, Int8Array, Int16Array, Uint16Array,
  Int32Array, Uint32Array, Float32Array, Float64Array, ArrayBuffer, DataView,
  BigInt, BigInt64Array, BigUint64Array, Promise, Error, TypeError,
};
vm.createContext(sandbox);
vm.runInContext(umdSource, sandbox);
assert(typeof sandbox.GhidraDecompiler === "function", "UMD exposes GhidraDecompiler");

// --- emulate the browser _ensureGlobal: a <script src=dataURL> load
globalThis.document = {
  createElement() { return {}; },
  head: {
    appendChild(el) {
      globalThis.GhidraDecompiler = sandbox.GhidraDecompiler;
      el.onload && el.onload();
    },
  },
};

const engine = new GhidraWasm({ log: () => {} });
await engine.load();
assert(engine.ready, "engine instantiated from embedded assets");
assert(engine.languages.length >= 5, "processor list parsed (" + engine.languages.length + " languages)");

// demo.exe code carve: mov ah,9 / mov dx,0F / int 21 / mov ax,4C00 / int 21
const demo = __demoBytes();
const carve = demo.subarray(0x40, 0x40 + 12);
const code = new Uint8Array(carve.length + 64);
code.set(carve);
code.fill(0xcb, carve.length); // RETF padding, as the lab harness does
const res = await engine.decompile(code, {
  lang: "x86:LE:16:Real Mode", compiler: "default", base: "0x100", func: "0x100",
});
const bad = /^(\\/\\*\\s*)?(Error|Lowlevel Error|Decoder Error|Standard Exception)/m.test(res.text);
if (bad) console.error("DECOMPILE TEXT:", JSON.stringify(res.text.slice(0, 400)));
assert(!bad, "decompile produced C, not an error");
assert(res.text.length > 0, "decompile returned text");
console.log("INLINE DECOMPILE OK —", res.text.replace(/\\n/g, " | ").slice(0, 160));
`);
try {
  await import(pathToFileURL(file).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
