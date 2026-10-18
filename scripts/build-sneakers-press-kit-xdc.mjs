// Build the offline Sneakers Press Kit Webxdc from the reviewable player shell,
// the repository's local reconstructed js-dos bundle, and the complete vendored
// js-dos 8.4.1 runtime. The original Archive.org disk/ZIP is intentionally not
// represented as being part of this package.
//
//   node scripts/build-sneakers-press-kit-xdc.mjs
//   node scripts/build-sneakers-press-kit-xdc.mjs --check
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, zipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "webxdc-sneakers", "app");
const engine = path.join(root, "webxdc-dos", "public", "js-dos");
const gameBundlePath = path.join(root, "webxdc-dos", "public", "roms", "SNEAKERS.jsdos");
const readmePath = path.join(root, "webxdc-sneakers", "README.md");
const output = path.join(root, "sneakers-press-kit.xdc");
const CHECK_ONLY = process.argv.includes("--check");
const FIXED_DATE = new Date("2026-10-18T00:00:00Z");
const ENGINE_FILES = [
  "js-dos.js",
  "js-dos.css",
  "emulators.js",
  "wdosbox.js",
  "wdosbox.wasm",
  "wlibzip.js",
  "wlibzip.wasm",
];

function readRequired(file) {
  if (!existsSync(file)) throw new Error(`missing required input: ${path.relative(root, file)}`);
  return new Uint8Array(readFileSync(file));
}

function validateGameBundle(bundleBytes) {
  const files = unzipSync(bundleBytes);
  const executable = files["SNEAKERS.EXE"];
  if (!executable || executable[0] !== 0x4d || executable[1] !== 0x5a) {
    throw new Error("local Sneakers bundle is missing its MZ SNEAKERS.EXE");
  }
  if (executable.length < 28) throw new Error("SNEAKERS.EXE is too short to contain an MZ header");
  const lastPageBytes = executable[2] | (executable[3] << 8);
  const pages = executable[4] | (executable[5] << 8);
  const declaredSize = lastPageBytes ? (pages - 1) * 512 + lastPageBytes : pages * 512;
  if (declaredSize !== executable.length) {
    throw new Error(`SNEAKERS.EXE MZ size mismatch: header=${declaredSize}, actual=${executable.length}`);
  }

  const decoder = new TextDecoder();
  const runBat = decoder.decode(files["RUN.BAT"] ?? new Uint8Array());
  if (!/SNEAKERS\.EXE/i.test(runBat)) throw new Error("RUN.BAT does not launch SNEAKERS.EXE");
  const conf = decoder.decode(files[".jsdos/dosbox.conf"] ?? new Uint8Array());
  const autoexec = conf.split(/^\[autoexec\]\s*$/im)[1] ?? "";
  const commands = autoexec.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (commands.at(-1)?.toUpperCase() !== "RUN.BAT") {
    throw new Error(`js-dos autoexec must launch RUN.BAT; got ${commands.at(-1) ?? "<empty>"}`);
  }
  if (!/^mount\s+c\s+\./im.test(autoexec)) throw new Error("js-dos autoexec does not mount its local bundle as C:");
  return { files, executable };
}

const html = readRequired(path.join(app, "index.html"));
const htmlText = new TextDecoder().decode(html);
if (!/url:\s*"roms\/SNEAKERS\.jsdos"/.test(htmlText)) {
  throw new Error("player shell does not point to the local Sneakers js-dos bundle");
}
if (!/pathPrefix:\s*"js-dos\/"/.test(htmlText)) {
  throw new Error("player shell does not use the local js-dos runtime pathPrefix");
}
if (/dosInstance\.run\(/.test(htmlText)) {
  throw new Error("v7 dosInstance.run() API found; this package uses js-dos v8");
}
if (/<script\b[^>]*\bsrc\s*=\s*["']https?:/i.test(htmlText)) {
  throw new Error("player shell has a remote script dependency");
}
if (/(?:url|pathPrefix):\s*["']https?:/i.test(htmlText)) {
  throw new Error("player shell has a remote DOS bundle/engine URL");
}

const bundleBytes = readRequired(gameBundlePath);
const { executable } = validateGameBundle(bundleBytes);
const icon = readRequired(path.join(app, "icon.png"));
if (icon[0] !== 0x89 || icon[1] !== 0x50 || icon[2] !== 0x4e || icon[3] !== 0x47) {
  throw new Error("app icon is not a PNG");
}
const iconWidth = (icon[16] << 24) | (icon[17] << 16) | (icon[18] << 8) | icon[19];
const iconHeight = (icon[20] << 24) | (icon[21] << 16) | (icon[22] << 8) | icon[23];
if (iconWidth !== 256 || iconHeight !== 256) {
  throw new Error(`Webxdc icon must be 256x256; got ${iconWidth}x${iconHeight}`);
}

const entries = {
  "README.md": readRequired(readmePath),
  "icon.png": icon,
  "index.html": html,
  "manifest.toml": readRequired(path.join(app, "manifest.toml")),
  "roms/SNEAKERS.jsdos": bundleBytes,
  "webxdc.js": readRequired(path.join(app, "webxdc.js")),
};
for (const name of ENGINE_FILES) {
  entries[`js-dos/${name}`] = readRequired(path.join(engine, name));
}

const ordered = {};
for (const name of Object.keys(entries).sort()) {
  ordered[name] = [entries[name], { level: 9, mtime: FIXED_DATE }];
}
const archive = zipSync(ordered);

if (CHECK_ONLY) {
  if (!existsSync(output)) throw new Error("sneakers-press-kit.xdc is missing; run the builder first");
  const current = readFileSync(output);
  if (!current.equals(Buffer.from(archive))) {
    throw new Error("sneakers-press-kit.xdc is stale; run the builder to regenerate it");
  }
  console.log(`sneakers-press-kit.xdc is current (${archive.length} bytes, ${Object.keys(entries).length} entries)`);
} else {
  writeFileSync(output, archive);
  const sha256 = createHash("sha256").update(archive).digest("hex");
  console.log(`built sneakers-press-kit.xdc: ${archive.length} bytes, ${Object.keys(entries).length} entries`);
  console.log(`sha256 ${sha256}`);
  console.log(`embedded reconstructed SNEAKERS.EXE: ${executable.length} bytes`);
}
