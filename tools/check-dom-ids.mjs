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

/**
 * The id set is what the *page* can answer getElementById with. Blink never
 * fabricates one (`Element? getElementById(DOMString)` —
 * core/dom/non_element_parent_node.idl:7), so an id referenced from a
 * controller and absent from the markup is a live bug, not a style choice.
 * Ids that code creates for itself count as present.
 */
function read(src) {
  return src.map((f) => readFileSync(join(ROOT, f), "utf8"));
}

function collect(pair, inline) {
  const html = readFileSync(join(ROOT, pair.html), "utf8");
  const controller = read(pair.js);
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const defined = [...controller, ...scripts];
  const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const src of defined) {
    for (const m of src.matchAll(/\.id\s*=\s*"([^"]+)"/g)) htmlIds.add(m[1]);
    for (const m of src.matchAll(/\bid="([^"]+)"/g)) htmlIds.add(m[1]);
    for (const m of src.matchAll(/setAttribute\(\s*"id",\s*"([^"]+)"/g)) htmlIds.add(m[1]);
  }
  const jsIds = new Set();
  for (const src of inline ? defined : controller) {
    for (const m of src.matchAll(/\$\("([^"]+)"\)/g)) jsIds.add(m[1]);
    for (const m of src.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g)) jsIds.add(m[1]);
  }
  return { htmlIds, jsIds, pair, inline };
}

const argv = process.argv.slice(2);
const val = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1].split(",") : dflt;
};
// `--self page.html` treats the page's own inline script as the controller,
// which is the shape of every standalone page in this repository.
const inline = argv.includes("--self");
const pairs = inline
  ? val("--self", []).map((html) => ({ html, js: [] }))
  : [{ html: val("--html", ["ghidra-lab.html"])[0], js: val("--js", ["js/viruslab.js"]) }];

let bad = 0;
for (const pair of pairs) {
  const { htmlIds, jsIds } = collect(pair, inline);
  const missing = [...jsIds].filter((id) => !htmlIds.has(id)).sort();
  const unused = [...htmlIds].filter((id) => !jsIds.has(id)).sort();
  console.log(`${pair.html}: ${htmlIds.size} ids the page can resolve, ${jsIds.size} referenced from ${inline ? "its own script" : pair.js.join(", ")}`);
  if (unused.length && !inline) console.log(`\nids declared but not used by the controller (fine if purely presentational):\n  ${unused.join(", ")}`);
  if (missing.length) {
    bad = 1;
    console.error(`\nMISSING ids referenced but not defined:\n  ${missing.join(", ")}`);
  }
}
if (!bad) console.log("\nall controller element ids exist in the markup");
process.exit(bad);
