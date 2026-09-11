// Driver for @mauricelam/ghidra-decompiler-wasm (Ghidra C++ decompiler -> WASM).
// Usage:
//   node wasm_decompile.js <binary> <language-id|auto> <baseAddr> <funcAddr|name> [cspec-id]
// Example:
//   node wasm_decompile.js sample.exe "x86:LE:32:default" 0x00400000 0x00401000
const fs = require("fs");
const path = require("path");

const DIST = "/home/user/tools/wasm-decompiler/package/dist";
const GhidraDecompiler = require(path.join(DIST, "ghidra_decompiler.js"));

function bytesToHex(bytes) {
  const hex = new Array(bytes.length + 32);
  for (let i = 0; i < bytes.length; i++) hex[i] = bytes[i].toString(16).padStart(2, "0");
  for (let i = bytes.length; i < bytes.length + 32; i++) hex[i] = "00";
  return hex.join("");
}

(async () => {
  const [binPath, langArg, base, func, cspecArg] = process.argv.slice(2);
  if (!binPath || !langArg || !base || !func) {
    console.error("usage: node wasm_decompile.js <binary> <lang|auto> <base> <func> [cspecId]");
    process.exit(2);
  }
  const binData = new Uint8Array(fs.readFileSync(binPath));
  const procs = JSON.parse(fs.readFileSync(path.join(DIST, "processors.json"), "utf8"));

  const mod = await GhidraDecompiler({ locateFile: (p) => path.join(DIST, p) });
  mod._init_decompiler();

  let lang = langArg, cspecId = cspecArg;
  if (langArg === "auto") {
    const p = mod._malloc(binData.length);
    mod.HEAPU8.set(binData, p);
    lang = mod.UTF8ToString(mod._detect_architecture(p, binData.length));
    mod._free(p);
    console.error("detected:", lang);
  }
  const proc = procs.find((p) => p.id === lang);
  if (!proc) { console.error("unknown language:", lang); process.exit(2); }
  let comp = proc.compilers[0];
  if (cspecId) {
    const c2 = proc.compilers.find((c) => c.id === cspecId);
    if (c2) comp = c2;
  }
  const slaData = new Uint8Array(fs.readFileSync(path.join(DIST, proc.sla)));
  const pspec = fs.readFileSync(path.join(DIST, proc.pspec), "utf8");
  const cspec = fs.readFileSync(path.join(DIST, comp.spec), "utf8");

  const imageXml =
    `<binaryimage arch="${proc.id}">\n` +
    `  <bytechunk space="ram" offset="${base}">\n    ${bytesToHex(binData)}\n  </bytechunk>\n` +
    `</binaryimage>`;

  const slaPtr = mod._malloc(slaData.length);
  mod.HEAPU8.set(slaData, slaPtr);
  try {
    const outPtr = mod.ccall("decompile_pcode", "number",
      ["number", "number", "string", "string", "string", "string"],
      [slaPtr, slaData.length, pspec, cspec, imageXml, func]);
    process.stdout.write(mod.UTF8ToString(outPtr));
    mod._free_string(outPtr);
  } finally {
    mod._free(slaPtr);
  }
})().catch((e) => { console.error(e); process.exit(1); });
