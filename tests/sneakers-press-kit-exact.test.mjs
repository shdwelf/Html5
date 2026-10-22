// Byte-preservation checks for the separate original-source Sneakers Webxdc.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const decoder = new TextDecoder();
const sourceZipPath = "webxdc-sneakers-exact/source/Sneakers_Promotional_Diskette.zip";
const xdcPath = "sneakers-press-kit-exact.xdc";
const engineFiles = [
  "js-dos.js", "js-dos.css", "emulators.js", "wdosbox.js",
  "wdosbox.wasm", "wlibzip.js", "wlibzip.wasm",
];
const expected = {
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

function read(relative) {
  return readFileSync(path.join(root, relative));
}

function digest(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function assertHashes(bytes, spec, label) {
  assert.equal(bytes.length, spec.size, `${label} size`);
  for (const algorithm of ["md5", "sha1", "sha256"]) {
    if (spec[algorithm]) assert.equal(digest(bytes, algorithm), spec[algorithm], `${label} ${algorithm}`);
  }
}

function getZipMembers(bytes, label) {
  try {
    return unzipSync(bytes);
  } catch (error) {
    assert.fail(`${label} is not a readable ZIP: ${error.message}`);
  }
}

test("supplied promotional ZIP and its original DOS files match verified hashes", () => {
  const sourceBytes = read(sourceZipPath);
  assertHashes(sourceBytes, expected.source, "original promotional ZIP");
  const source = getZipMembers(sourceBytes, "original promotional ZIP");
  assert.deepEqual(Object.keys(source).sort(), ["SNEAK.EXE", "SNEAKERS.EXE"]);

  for (const name of ["SNEAKERS.EXE", "SNEAK.EXE"]) {
    const exe = source[name];
    assertHashes(exe, expected[name], name);
    assert.equal(exe[0], 0x4d, `${name} begins with MZ`);
    assert.equal(exe[1], 0x5a, `${name} begins with MZ`);
  }
  const sfx = decoder.decode(source["SNEAK.EXE"]);
  assert.match(sfx, /LHA's SFX 2\.12S/);
  assert.match(sfx, /-lh5-/);
  assert.match(sfx, /SNEAKERS\.EXE/);
});

test("exact-source XDC embeds the raw archive and launches byte-identical original executables", () => {
  const sourceBytes = read(sourceZipPath);
  const sourceMembers = getZipMembers(sourceBytes, "original promotional ZIP");
  const xdc = getZipMembers(read(xdcPath), "sneakers-press-kit-exact.xdc");
  for (const name of [
    "README.md", "index.html", "manifest.toml", "webxdc.js", "icon.png",
    "original/Sneakers_Promotional_Diskette.zip", "roms/SNEAKERS.jsdos",
    ...engineFiles.map((name) => `js-dos/${name}`),
  ]) assert.ok(xdc[name], `exact-source XDC is missing ${name}`);

  assert.deepEqual(
    Buffer.from(xdc["original/Sneakers_Promotional_Diskette.zip"]),
    sourceBytes,
    "the archived original ZIP must be embedded byte-for-byte",
  );
  assertHashes(xdc["original/Sneakers_Promotional_Diskette.zip"], expected.source, "embedded original ZIP");

  const game = getZipMembers(xdc["roms/SNEAKERS.jsdos"], "original Sneakers js-dos bundle");
  assert.deepEqual(Object.keys(game).sort(), [".jsdos/dosbox.conf", "SNEAK.EXE", "SNEAKERS.EXE"]);
  for (const name of ["SNEAKERS.EXE", "SNEAK.EXE"]) {
    assert.deepEqual(
      Buffer.from(game[name]),
      Buffer.from(sourceMembers[name]),
      `${name} in the runnable bundle must match its original ZIP member byte-for-byte`,
    );
    assertHashes(game[name], expected[name], `bundled ${name}`);
  }

  const conf = decoder.decode(game[".jsdos/dosbox.conf"]);
  assert.match(conf, /^machine=svga_s3$/m);
  assert.match(conf, /^xms=true$/m);
  assert.match(conf, /^ems=true$/m);
  assert.match(conf, /^mount c \.$/m);
  assert.match(conf, /^c:$/m);
  assert.match(conf, /^SNEAKERS\.EXE$/m);
  assert.doesNotMatch(conf, /^SNEAK\.EXE$/m, "the LHA self-extractor is retained, not booted instead of the program");

  for (const name of engineFiles) {
    assert.deepEqual(
      Buffer.from(xdc[`js-dos/${name}`]),
      read(`webxdc-dos/public/js-dos/${name}`),
      `packed js-dos/${name} differs from the vendored runtime`,
    );
  }

  assert.equal(decoder.decode(xdc["index.html"]), read("webxdc-sneakers-exact/app/index.html").toString("utf8"));
  assert.equal(decoder.decode(xdc["manifest.toml"]), read("webxdc-sneakers-exact/app/manifest.toml").toString("utf8"));
  assert.equal(decoder.decode(xdc["webxdc.js"]), read("webxdc-sneakers-exact/app/webxdc.js").toString("utf8"));
  assert.equal(decoder.decode(xdc["README.md"]), read("webxdc-sneakers-exact/README.md").toString("utf8"));

  const html = decoder.decode(xdc["index.html"]);
  assert.match(html, /url:\s*"roms\/SNEAKERS\.jsdos"/);
  assert.match(html, /pathPrefix:\s*"js-dos\/"/);
  assert.match(html, /noCloud:\s*true/);
  assert.match(html, /pointerdown[\s\S]*?focusDos/);
  assert.match(html, /event === "ci-ready"[\s\S]*?focusDos\(\)/);
  assert.match(html, /setSoftKeyboardLayout\(touchKeyboardLayout\)/);
  assert.match(html, /setMouseCapture\(false\)/);
  assert.match(html, /on-screen keyboard/i);
  assert.doesNotMatch(html, /dosInstance\.run\(/, "v7 js-dos API should not be used");
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=\s*["']https?:/i, "runtime script references must stay local");
  assert.doesNotMatch(html, /setec astronomy/i, "the reconstructed package's password prompt is not the original launch flow");
  assert.match(html, /SNEAKERS\.EXE/);
  assert.match(html, /not represented as part of this ZIP/i);
  assert.match(html, /repository-built reconstruction/i);

  const manifest = decoder.decode(xdc["manifest.toml"]);
  assert.match(manifest, /^name = "Sneakers Press Kit · Original ZIP \(DOS·1992\)"/);
  const icon = Buffer.from(xdc["icon.png"]);
  assert.deepEqual(Array.from(icon.slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(icon.readUInt32BE(16), 256);
  assert.equal(icon.readUInt32BE(20), 256);

  assert.ok(!Object.keys(xdc).some((name) => /(?:^|\/)sneakers\.img$/i.test(name)));
});

test("exact Sneakers builder stages a local preview and produces a deterministic XDC", () => {
  const result = spawnSync(process.execPath, ["scripts/build-sneakers-press-kit-exact-xdc.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /sneakers-press-kit-exact\.xdc is current/);
  assert.match(result.stdout, /verified byte-for-byte/);
});
