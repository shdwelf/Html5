#!/usr/bin/env node
/**
 * Stage the pinned 7z-wasm browser runtime for the standalone HTML/Webxdc build.
 * The codec stays as separate local JavaScript and WASM files and is imported
 * lazily only for Haiku Vault v2 LZMA2 operations.
 */
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageDir = path.join(root, "node_modules", "7z-wasm");
const packageJson = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8"));
if (packageJson.name !== "7z-wasm" || packageJson.version !== "1.2.0") {
  throw new Error(`Expected 7z-wasm@1.2.0, found ${packageJson.name}@${packageJson.version}`);
}
const output = path.join(root, "public", "vendor", "7z-wasm");
mkdirSync(output, { recursive: true });
for (const file of ["7zz.es6.js", "7zz.wasm"]) {
  copyFileSync(path.join(packageDir, file), path.join(output, file));
}
console.log("Staged the pinned 7z-wasm browser runtime at public/vendor/7z-wasm/.");
