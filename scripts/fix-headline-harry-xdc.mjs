// Repack both tracked Headline Harry XDC copies from the reviewable shell and
// embedded game bundle. The archive contains the large js-dos 8.4.1 engine;
// this script preserves those payloads, validates that the game bundle holds
// installer-recovered MZ executables and starts MAP.EXE directly, then applies
// the canonical shell and deterministic ZIP metadata.
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
const PACKAGE_XDC = path.join(root, "webxdc-headline-harry", "headline-harry.xdc");
const APP_SHELL = path.join(root, "webxdc-headline-harry", "app", "index.html");
const SHELL = path.join(root, "public", "apps", "headline-harry", "index.html");
const ENGINE_DIR = path.join(root, "webxdc-headline-harry", "app", "js-dos");

// The full js-dos 8.4.1 engine set the player needs at runtime.  Every entry
// is fetched relative to the `pathPrefix` ("js-dos/"): emulators.js lazily
// loads wdosbox.js for the DOSBox core *and* wlibzip.js + wlibzip.wasm for
// bundle handling — `bundleConfig()` awaits `libzip()` before it can read
// `.jsdos/dosbox.conf` out of the roms bundle, so a missing wlibzip pair
// 404s and the boot dies before the game appears.
const ENGINE_FILES = [
  "js-dos.js",
  "js-dos.css",
  "emulators.js",
  "wdosbox.js",
  "wdosbox.wasm",
  "wlibzip.js",
  "wlibzip.wasm",
];

const files = unzipSync(readFileSync(XDC));
if (!files["index.html"]) throw new Error("headline-harry.xdc has no index.html");

// Do not bless/repackage the previous packed floppy payload. Those source
// files start with `ff 4d 5a`; only the installer's output is a runnable MZ.
const gameBundle = files["roms/headline-harry.jsdos"];
if (!gameBundle) throw new Error("headline-harry.xdc has no roms/headline-harry.jsdos");
const gameFiles = unzipSync(gameBundle);
for (const name of ["INTRO.EXE", "MAP.EXE"]) {
  const executable = gameFiles[name];
  if (!executable || executable[0] !== 0x4d || executable[1] !== 0x5a) {
    throw new Error(`game bundle ${name} is missing or not a clean MZ executable`);
  }
}
const decoder = new TextDecoder();
const dosboxConf = decoder.decode(gameFiles[".jsdos/dosbox.conf"] ?? new Uint8Array());
const autoexec = dosboxConf.split(/^\[autoexec\]\s*$/im)[1] ?? "";
if (!/^[ \t]*MAP(?:\.EXE)?[ \t]*$/im.test(autoexec) || /^[ \t]*INTRO(?:\.EXE)?[ \t]*$/im.test(autoexec)) {
  throw new Error("game bundle must start MAP.EXE directly and must not run INTRO.EXE at boot");
}

const shell = readFileSync(SHELL);
const shellText = shell.toString("utf8");
if (/dosInstance\.run\(/.test(shellText)) {
  throw new Error("staged shell still calls the v7 dosInstance.run() API — refusing to pack");
}
if (!/url:\s*"roms\/headline-harry\.jsdos"/.test(shellText)) {
  throw new Error("staged shell does not point js-dos v8 at roms/headline-harry.jsdos");
}
files["index.html"] = new Uint8Array(shell);
writeFileSync(APP_SHELL, shell);

// Engine completeness: splice in any vendored 8.4.1 file the archive is
// missing (this is how the wlibzip pair was added after the v8 boot fix).
let injected = [];
for (const name of ENGINE_FILES) {
  const entry = `js-dos/${name}`;
  if (!files[entry]) {
    files[entry] = new Uint8Array(readFileSync(path.join(ENGINE_DIR, name)));
    injected.push(entry);
  }
}
if (injected.length) {
  console.log(`injected from webxdc-headline-harry/app/js-dos: ${injected.join(", ")}`);
}
for (const name of ENGINE_FILES) {
  if (!files[`js-dos/${name}`]) {
    throw new Error(`engine incomplete even after injection: js-dos/${name} missing`);
  }
}

// Deterministic archive: fixed timestamp, stable entry order, max deflate.
const FIXED_DATE = new Date("2026-10-04T00:00:00Z");
const ordered = {};
for (const name of Object.keys(files).sort()) {
  ordered[name] = [files[name], { level: 9, mtime: FIXED_DATE }];
}
const zipped = zipSync(ordered);
writeFileSync(XDC, zipped);
writeFileSync(PACKAGE_XDC, zipped);

const sha = createHash("sha256").update(zipped).digest("hex");
console.log(`headline-harry.xdc: ${zipped.length} bytes, ${Object.keys(files).length} entries`);
console.log(`sha256 ${sha}`);
console.log("synchronized webxdc-headline-harry/headline-harry.xdc");
