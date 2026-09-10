#!/usr/bin/env node
/**
 * check-dom-ids.mjs — contract test between ghidra-lab.html and js/viruslab.js.
 *
 *   node tools/check-dom-ids.mjs
 *
 * Catches the boring failure mode of hand-written vanilla-JS UIs: an id
 * referenced from the controller that the markup does not define (or defines
 * with a typo).  Exits non-zero on a mismatch so it can gate a commit.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(ROOT, "ghidra-lab.html"), "utf8");
const js = readFileSync(join(ROOT, "js", "viruslab.js"), "utf8");

const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const jsIds = new Set([
  ...[...js.matchAll(/\$\("([^"]+)"\)/g)].map((m) => m[1]),
  ...[...js.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]),
]);

const missing = [...jsIds].filter((id) => !htmlIds.has(id)).sort();
const unused = [...htmlIds].filter((id) => !jsIds.has(id)).sort();

console.log(`${htmlIds.size} ids in ghidra-lab.html, ${jsIds.size} referenced from viruslab.js`);
if (unused.length) console.log(`\nids declared but not used by the controller (fine if purely presentational):\n  ${unused.join(", ")}`);
if (missing.length) {
  console.error(`\nMISSING ids referenced by the controller:\n  ${missing.join(", ")}`);
  process.exit(1);
}
console.log("\nall controller element ids exist in the markup");
