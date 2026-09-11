#!/usr/bin/env node
/**
 * build_lens3d_wasm.mjs — assemble wasm/lens3d.wat into wasm/lens3d.wasm.
 *
 *   npm i --no-save wabt          # dev-only, like the other optional harnesses
 *   node tools/build_lens3d_wasm.mjs          # write wasm/lens3d.wasm
 *   node tools/build_lens3d_wasm.mjs --check  # fail if the committed .wasm is
 *                                             #   stale w.r.t. the .wat
 *
 * The repository ships the compiled module, so the app itself never needs a
 * build step — this tool exists so the .wat stays the reviewed source of truth
 * and a stale binary is a test failure rather than a mystery. The same choice
 * js/engine.js makes for wasm/entropy.wasm, which tools/build_entropy_wasm.py
 * emits byte by byte; here wabt does the assembling because lens3d is large
 * enough that hand-encoded opcodes would be unreadable.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WAT = join(ROOT, "wasm", "lens3d.wat");
const WASM = join(ROOT, "wasm", "lens3d.wasm");
const CHECK = process.argv.includes("--check");

let wabt;
try {
  ({ default: wabt } = await import("wabt"));
} catch {
  if (CHECK) {
    console.log("lens3d wasm: SKIPPED (npm i --no-save wabt)");
    process.exit(0);
  }
  console.error("wabt is required to assemble the .wat:  npm i --no-save wabt");
  process.exit(1);
}

let module_;
try {
  module_ = (await wabt()).parseWat("lens3d.wat", readFileSync(WAT, "utf8"), {});
} catch (err) {
  // wabt's throw carries the whole emscripten bundle on `.stack`; only the
  // message (filename:line:col plus the offending token) is worth reading.
  console.error(String(err.message).split("\n").slice(0, 12).join("\n"));
  process.exit(1);
}
const { buffer } = module_.toBinary({ writeDebugNames: false, generateNameSection: true });
const bytes = Buffer.from(buffer);

// Wabt's name section embeds nothing time-dependent, but symbol order can shift
// across wabt versions; compare content, not mtime.
const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);

if (CHECK) {
  if (!existsSync(WASM)) {
    console.error(`lens3d wasm: MISSING ${WASM}`);
    process.exit(1);
  }
  const onDisk = readFileSync(WASM);
  if (onDisk.equals(bytes)) {
    console.log(`lens3d wasm: up to date (${bytes.length} bytes, sha256 ${digest}…)`);
    process.exit(0);
  }
  console.error(
    `lens3d wasm: STALE — wasm/lens3d.wasm (${onDisk.length} B) ≠ assembled lens3d.wat (${bytes.length} B)\n` +
      `  run: node tools/build_lens3d_wasm.mjs && commit the result`
  );
  process.exit(1);
}

writeFileSync(WASM, bytes);
// Instantiate once so a module that assembles but fails to validate never lands
// in the tree: Node's WebAssembly validator is a second opinion on wabt's.
await WebAssembly.instantiate(bytes, {});
console.log(`wrote ${WASM.replace(`${ROOT}/`, "")}: ${bytes.length} bytes, sha256 ${digest}… — instantiates`);
