// Build the byte-verified original Sneakers Press Kit Webxdc. The supplied
// Archive.org ZIP is retained unchanged inside the XDC; the two original
// executable members are copied unchanged into a js-dos bundle with only a
// local DOSBox config added around them.
//
//   node scripts/build-sneakers-press-kit-exact-xdc.mjs
//   node scripts/build-sneakers-press-kit-exact-xdc.mjs --check
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, zipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "webxdc-sneakers-exact", "app");
const sourceZipPath = path.join(root, "webxdc-sneakers-exact", "source", "Sneakers_Promotional_Diskette.zip");
const engineSource = path.join(root, "webxdc-dos", "public", "js-dos");
const readmePath = path.join(root, "webxdc-sneakers-exact", "README.md");
const output = path.join(root, "sneakers-press-kit-exact.xdc");
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
const EXPECTED = {
  source: {
    size: 2_066_643,
    md5: "7ee0f238f94fbbe06649d719d92fc769",
    sha1: "a94c7ef89f60c37f488d6163f5f8d7bc05b9cd31",
    sha256: "b6e3d2a99de90b6de401a5d8d0023299c632e65ca98246bbe5d4842336f01eef",
  },
  "SNEAKERS.EXE": {
    size: 2_219_117,
    sha256: "d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961",
  },
  "SNEAK.EXE": {
    size: 1_074_631,
    sha256: "4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb",
  },
};

function readRequired(file) {
  if (!existsSync(file)) throw new Error(`missing required input: ${path.relative(root, file)}`);
  return new Uint8Array(readFileSync(file));
}

function hash(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function checkHash(label, bytes, expected) {
  if (bytes.length !== expected.size) {
    throw new Error(`${label} size mismatch: expected ${expected.size}, got ${bytes.length}`);
  }
  if (expected.md5 && hash(bytes, "md5") !== expected.md5) {
    throw new Error(`${label} MD5 mismatch: expected ${expected.md5}, got ${hash(bytes, "md5")}`);
  }
  if (expected.sha1 && hash(bytes, "sha1") !== expected.sha1) {
    throw new Error(`${label} SHA-1 mismatch: expected ${expected.sha1}, got ${hash(bytes, "sha1")}`);
  }
  if (expected.sha256 && hash(bytes, "sha256") !== expected.sha256) {
    throw new Error(`${label} SHA-256 mismatch: expected ${expected.sha256}, got ${hash(bytes, "sha256")}`);
  }
}

const sourceArchive = readRequired(sourceZipPath);
checkHash("original source ZIP", sourceArchive, EXPECTED.source);
const sourceMembers = unzipSync(sourceArchive);
const memberNames = Object.keys(sourceMembers).sort();
const expectedNames = ["SNEAK.EXE", "SNEAKERS.EXE"];
if (JSON.stringify(memberNames) !== JSON.stringify(expectedNames)) {
  throw new Error(`original ZIP member list changed: ${memberNames.join(", ")}`);
}
for (const name of expectedNames) checkHash(name, sourceMembers[name], EXPECTED[name]);

const mainExe = sourceMembers["SNEAKERS.EXE"];
const sfxExe = sourceMembers["SNEAK.EXE"];
if (mainExe[0] !== 0x4d || mainExe[1] !== 0x5a) {
  throw new Error("original SNEAKERS.EXE is missing its DOS MZ signature");
}
if (sfxExe[0] !== 0x4d || sfxExe[1] !== 0x5a) {
  throw new Error("original SNEAK.EXE is missing its DOS MZ signature");
}
const sfxText = new TextDecoder("latin1").decode(sfxExe);
if (!sfxText.includes("LHA's SFX 2.12S") || !sfxText.includes("-lh5-") || !sfxText.includes("SNEAKERS.EXE")) {
  throw new Error("SNEAK.EXE no longer identifies as the supplied LHA SFX companion");
}

const html = readRequired(path.join(app, "index.html"));
const htmlText = new TextDecoder().decode(html);
if (!/url:\s*"roms\/SNEAKERS\.jsdos"/.test(htmlText)) {
  throw new Error("player shell does not point to its local original-Sneakers bundle");
}
if (!/pathPrefix:\s*"js-dos\/"/.test(htmlText)) {
  throw new Error("player shell does not use the local js-dos runtime pathPrefix");
}
if (!/pointerdown[\s\S]*?focusDos/.test(htmlText) || !/event === "ci-ready"[\s\S]*?focusDos\(\)/.test(htmlText)) {
  throw new Error("player shell is missing the Headline Harry canvas-focus behavior");
}
if (!/setSoftKeyboardLayout\(touchKeyboardLayout\)/.test(htmlText)) {
  throw new Error("player shell does not install its touch-friendly keyboard layout");
}
if (!/setMouseCapture\(false\)/.test(htmlText)) {
  throw new Error("player shell does not leave mouse/touch input uncaptured");
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

const icon = readRequired(path.join(app, "icon.png"));
if (icon[0] !== 0x89 || icon[1] !== 0x50 || icon[2] !== 0x4e || icon[3] !== 0x47) {
  throw new Error("app icon is not a PNG");
}
const iconWidth = (icon[16] << 24) | (icon[17] << 16) | (icon[18] << 8) | icon[19];
const iconHeight = (icon[20] << 24) | (icon[21] << 16) | (icon[22] << 8) | icon[23];
if (iconWidth !== 256 || iconHeight !== 256) {
  throw new Error(`Webxdc icon must be 256x256; got ${iconWidth}x${iconHeight}`);
}

const dosboxConfig = `# Original Sneakers promotional files; wrapper config only.
[dosbox]
machine=svga_s3
memsize=16

[dos]
xms=true
ems=true
umb=true

[cpu]
core=auto
cputype=auto
cycles=auto

[sblaster]
sbtype=sb16

[autoexec]
mount c .
c:
SNEAKERS.EXE
`;
const gameEntries = {
  "SNEAK.EXE": [sfxExe, { level: 9, mtime: FIXED_DATE }],
  "SNEAKERS.EXE": [mainExe, { level: 9, mtime: FIXED_DATE }],
  ".jsdos/dosbox.conf": [new TextEncoder().encode(dosboxConfig), { level: 9, mtime: FIXED_DATE }],
};
const gameBundle = zipSync(gameEntries);

const manifest = readRequired(path.join(app, "manifest.toml"));
const webxdcShim = readRequired(path.join(app, "webxdc.js"));
const entries = {
  "README.md": readRequired(readmePath),
  "icon.png": icon,
  "index.html": html,
  "manifest.toml": manifest,
  "original/Sneakers_Promotional_Diskette.zip": sourceArchive,
  "roms/SNEAKERS.jsdos": gameBundle,
  "webxdc.js": webxdcShim,
};
for (const name of ENGINE_FILES) entries[`js-dos/${name}`] = readRequired(path.join(engineSource, name));

const ordered = {};
for (const name of Object.keys(entries).sort()) {
  const level = name === "original/Sneakers_Promotional_Diskette.zip" ? 0 : 9;
  ordered[name] = [entries[name], { level, mtime: FIXED_DATE }];
}
const archive = zipSync(ordered);

function verifyStagedFile(file, expectedBytes, label) {
  if (!existsSync(file)) throw new Error(`missing staged preview file: ${path.relative(root, file)}; run the builder first`);
  if (!readFileSync(file).equals(Buffer.from(expectedBytes))) {
    throw new Error(`${label} staging file is stale; run the builder to regenerate it`);
  }
}

if (CHECK_ONLY) {
  verifyStagedFile(path.join(app, "roms", "SNEAKERS.jsdos"), gameBundle, "roms/SNEAKERS.jsdos");
  for (const name of ENGINE_FILES) {
    verifyStagedFile(path.join(app, "js-dos", name), readRequired(path.join(engineSource, name)), `js-dos/${name}`);
  }
  if (!existsSync(output)) throw new Error("sneakers-press-kit-exact.xdc is missing; run the builder first");
  if (!readFileSync(output).equals(Buffer.from(archive))) {
    throw new Error("sneakers-press-kit-exact.xdc is stale; run the builder to regenerate it");
  }
  console.log(`sneakers-press-kit-exact.xdc is current (${archive.length} bytes, ${Object.keys(entries).length} entries)`);
  console.log(`original ZIP and both executable members verified byte-for-byte`);
} else {
  mkdirSync(path.join(app, "roms"), { recursive: true });
  mkdirSync(path.join(app, "js-dos"), { recursive: true });
  writeFileSync(path.join(app, "roms", "SNEAKERS.jsdos"), gameBundle);
  for (const name of ENGINE_FILES) {
    writeFileSync(path.join(app, "js-dos", name), readRequired(path.join(engineSource, name)));
  }
  writeFileSync(output, archive);
  console.log(`built sneakers-press-kit-exact.xdc: ${archive.length} bytes, ${Object.keys(entries).length} entries`);
  console.log(`sha256 ${hash(archive, "sha256")}`);
  console.log(`source ZIP: ${sourceArchive.length} bytes · sha256 ${hash(sourceArchive, "sha256")}`);
  console.log(`original SNEAKERS.EXE: ${mainExe.length} bytes · sha256 ${hash(mainExe, "sha256")}`);
  console.log(`original SNEAK.EXE: ${sfxExe.length} bytes · sha256 ${hash(sfxExe, "sha256")}`);
}
