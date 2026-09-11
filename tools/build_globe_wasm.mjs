#!/usr/bin/env node
/**
 * build_globe_wasm.mjs — assemble wasm/globe.wat into wasm/globe.wasm.
 *
 *   npm i --no-save wabt                 # dev-only
 *   node tools/build_globe_wasm.mjs          # write wasm/globe.wasm
 *   node tools/build_globe_wasm.mjs --check  # fail if the binary is stale
 *
 * Same contract as build_lens3d_wasm.mjs: the repository ships the compiled
 * module so the page needs no build step; the .wat stays the reviewed
 * source of truth and a stale binary fails the run.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WAT = join(ROOT, "wasm", "globe.wat");
const WASM = join(ROOT, "wasm", "globe.wasm");
const CHECK = process.argv.includes("--check");

let wabt;
try {
  ({ default: wabt } = await import("wabt"));
} catch {
  if (CHECK) {
    console.log("globe wasm: SKIPPED (npm i --no-save wabt)");
    process.exit(0);
  }
  console.error("wabt is required to assemble the .wat:  npm i --no-save wabt");
  process.exit(1);
}

let module_;
try {
  module_ = (await wabt()).parseWat("globe.wat", readFileSync(WAT, "utf8"), {});
} catch (err) {
  console.error(String(err.message).split("\n").slice(0, 12).join("\n"));
  process.exit(1);
}
const { buffer } = module_.toBinary({ writeDebugNames: false, generateNameSection: true });
const bytes = Buffer.from(buffer);

if (CHECK) {
  if (!existsSync(WASM)) {
    console.error(`globe wasm: MISSING ${WASM}`);
    process.exit(1);
  }
  const cur = readFileSync(WASM);
  if (cur.equals(bytes)) {
    console.log(`globe wasm: up to date (${bytes.length} bytes)`);
  } else {
    console.log("globe wasm: STALE (run node tools/build_globe_wasm.mjs)");
    process.exit(1);
  }
} else {
  writeFileSync(WASM, bytes);
  console.log(`wrote ${WASM} (${bytes.length} bytes)`);
}
