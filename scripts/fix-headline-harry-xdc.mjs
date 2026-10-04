// Repack headline-harry.xdc with the corrected index.html.
//
// The archive is the only home of the big binary payloads (the four-floppy
// roms/headline-harry.jsdos bundle and the js-dos 8.4.1 engine incl.
// wdosbox.wasm), so unlike the other theaters there is no full source
// staging dir — the canonical, reviewable source of the shell page lives at
// public/apps/headline-harry/index.html and this script splices it into the
// existing archive, leaving every other entry byte-identical.
//
// Why: the shipped shell booted the v7 API (`Dos(el, opts)` followed by
// `dosInstance.run(bundleUrl)`) against the bundled js-dos v8 engine, which
// has no .run() — the boot threw "dosInstance.run is not a function" and the
// pressroom never started.  v8 takes `url` in the options and auto-starts.
//
//   node scripts/fix-headline-harry-xdc.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, zipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const XDC = path.join(root, "headline-harry.xdc");
const SHELL = path.join(root, "public", "apps", "headline-harry", "index.html");

const files = unzipSync(readFileSync(XDC));
if (!files["index.html"]) throw new Error("headline-harry.xdc has no index.html");

const shell = readFileSync(SHELL);
const shellText = shell.toString("utf8");
if (/dosInstance\.run\(/.test(shellText)) {
  throw new Error("staged shell still calls the v7 dosInstance.run() API — refusing to pack");
}
if (!/url:\s*"roms\/headline-harry\.jsdos"/.test(shellText)) {
  throw new Error("staged shell does not point js-dos v8 at roms/headline-harry.jsdos");
}
files["index.html"] = new Uint8Array(shell);

// Deterministic archive: fixed timestamp, stable entry order, max deflate.
const FIXED_DATE = new Date("2026-10-04T00:00:00Z");
const ordered = {};
for (const name of Object.keys(files).sort()) {
  ordered[name] = [files[name], { level: 9, mtime: FIXED_DATE }];
}
const zipped = zipSync(ordered);
writeFileSync(XDC, zipped);

const sha = createHash("sha256").update(zipped).digest("hex");
console.log(`headline-harry.xdc: ${zipped.length} bytes, ${Object.keys(files).length} entries`);
console.log(`sha256 ${sha}`);
