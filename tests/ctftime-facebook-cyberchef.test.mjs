// Static, hash-pinned FBCTF 2019 excerpts; no challenge binary is executed or bundled.
// See docs/ctftime-facebook-2019-software-crypto-2026-11-13.md for source,
// offsets, source-code path, and the distinction between a program's transform
// and an optional analyst-only Base64 interpretation.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createDecipheriv, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const pathHex = "d48f968bd4909e82d5999295"; // main.c: constructor, split immediates in ELF
const printedFlagHex = "9d9980cc93cfcca4accf8895cca4a8cba4b3cfa99f86"; // b64_flag_dec
const kekTextHex = "a99083b9a9c888c89abfaac8a3ca98cb98c9cfc8a3cab68ca3cb9ccbae96a9c2"; // b64_flag_enc
const debugArrayHex = "a6fb6fd7a6a364a695d446a6aca174a597a223a6aca15ae2aca070a5a1fd45acfe";
const encHex = "e5cca6d1c93c1160d732fbfb339804e9d9104968da5e087b34ac6061f56a9704539f026ed4b9027c82ecdb764e6f2ef85a4a43dcd1d4bca1e8fc438e8edb094e";
const publicDebugKeyHex = "38475fb0a7ac9bb193d112e63b2f0b90ebd4509f366671a64bd13bb494a0bc42";

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:ctftime-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const ops = new Map(dom.window.eval("OPERATIONS").map(op => [op.id, op]));
  const packs = dom.window.eval("RECIPE_PACKS");
  const run = (id, input, overrides = {}) => {
    const op = ops.get(id);
    assert.ok(op, `missing kitchen operation ${id}`);
    return op.run(input, Object.assign(Object.fromEntries(op.args.map(arg => [arg.key, arg.default])), overrides));
  };
  const bake = (name, input) => {
    assert.ok(Array.isArray(packs[name]), `missing kitchen pack ${name}`);
    for (const [id, args] of packs[name]) input = run(id, input, args);
    return input;
  };
  return { dom, run, bake, packs };
}

test("SOMBRERO ROJO packs separate the printed flag from the KEK's Base64-looking text", () => {
  const { dom, bake, packs } = boot();
  try {
    const menu = dom.window.eval("OPERATIONS.find(op => op.id === 'recipePack').args[0].options.map(option => option[0])");
    for (const name of Object.keys(packs).filter(name => name.startsWith("FBCTF 2019")))
      assert.ok(menu.includes(name), `pack missing from visible menu: ${name}`);
    assert.equal(bake("FBCTF 2019 — SOMBRERO ROJO key-file path (XOR)", pathHex), "/tmp/key.bin");
    assert.equal(bake("FBCTF 2019 — SOMBRERO ROJO printed flag bytes (XOR)", printedFlagHex), "fb{7h47_W4sn7_S0_H4Rd}");
    const kekText = bake("FBCTF 2019 — SOMBRERO ROJO KEK text (XOR; NOT Base64 decoded)", kekTextHex);
    assert.equal(kekText, "RkxBR3s3aDQ3X1c0c243X1MwX0g0UmR9");
    assert.equal(bake("FBCTF 2019 — SOMBRERO ROJO KEK text (analyst Base64 inspection)", kekTextHex), "FLAG{7h47_W4sn7_S0_H4Rd}");
    assert.deepEqual([...packs["FBCTF 2019 — SOMBRERO ROJO KEK text (XOR; NOT Base64 decoded)"].map(([op]) => op)], ["xor"]);
    assert.deepEqual([...packs["FBCTF 2019 — SOMBRERO ROJO KEK text (analyst Base64 inspection)"].map(([op]) => op)], ["xor", "fromB64"]);
  } finally { dom.window.close(); }
});

test("XOR hex key handles high bytes and a 4-byte schedule without changing text-key defaults", () => {
  const { dom, run } = boot();
  try {
    assert.equal(run("xor", debugArrayHex, { key: "f4:90:17:95", keyFmt: "hex", infmt: "hex", outfmt: "text" }),
      "RkxBR3s3aDQ3X1c0c243X1MwX0g0UmR9\n");
    assert.notEqual(run("xor", debugArrayHex, { key: "4f901795", keyFmt: "hex", infmt: "hex", outfmt: "text" }),
      "RkxBR3s3aDQ3X1c0c243X1MwX0g0UmR9\n", "source's 4f comment is not the assigned f4 byte");
    assert.equal(run("xor", "HELLO", { key: "B", infmt: "text", outfmt: "hex" }), "0a070e0e0d");
    assert.throws(() => run("xor", "ab", { key: "f", keyFmt: "hex", infmt: "hex" }), /complete byte pairs/);
    assert.throws(() => run("xor", "ab", { key: "fg", keyFmt: "hex", infmt: "hex" }), /complete byte pairs/);
  } finally { dom.window.close(); }
});

test("netscream pack is a byte-exact display of the organizer's 32+32 byte envelope, not a decryptor", () => {
  const { dom, bake, packs } = boot();
  try {
    const bytes = Buffer.from(encHex, "hex");
    assert.equal(bytes.length, 64);
    assert.equal(sha256(bytes), "cb6c403237c0a18820cb64a65a7f88bcc85f6517edd260e5afbf21a50745c459");
    const rawString = bytes.toString("latin1"); // same byte bridge as the kitchen's Load File
    const dump = bake("FBCTF 2019 — netscream enc envelope (inspect only)", rawString);
    const lines = dump.split("\n");
    assert.equal(lines.length, 4);
    const asHex = lines.map(line => (line.slice(10).split("|")[0].match(/\b[0-9a-f]{2}\b/g) || []).join(""));
    assert.equal(asHex.join(""), encHex);
    assert.equal(asHex.slice(0, 2).join(""), encHex.slice(0, 64), "first 32 bytes are IV");
    assert.equal(asHex.slice(2).join(""), encHex.slice(64), "remaining bytes are ciphertext");
    assert.deepEqual([...packs["FBCTF 2019 — netscream enc envelope (inspect only)"].map(([id]) => id)], ["toHexdump"]);
  } finally { dom.window.close(); }
});

test("off-kitchen AES-256-IGE cross-check uses organizer's published debug key, not a recovered Dual EC state", () => {
  const enc = Buffer.from(encHex, "hex");
  const key = Buffer.from(publicDebugKeyHex, "hex");
  assert.equal(sha256(key), "ca054a0a5cfdd083cc52edc00080d7d002a428f740d4ddb9cc0463b2091daad3");
  const xor = (a, b) => Buffer.from(a.map((v, i) => v ^ b[i]));
  let prevCipher = enc.subarray(0, 16);
  let prevPlain = enc.subarray(16, 32);
  const plain = [];
  for (let i = 32; i < enc.length; i += 16) {
    const block = enc.subarray(i, i + 16);
    const decipher = createDecipheriv("aes-256-ecb", key, null);
    decipher.setAutoPadding(false);
    const intermediate = Buffer.concat([decipher.update(xor(block, prevPlain)), decipher.final()]);
    const output = xor(intermediate, prevCipher);
    plain.push(output);
    prevCipher = block;
    prevPlain = output;
  }
  const joined = Buffer.concat(plain);
  assert.equal(sha256(joined), "24de1a1551e565c890209b5e0a8985a53a5ac69749e126d25fa205f2e489a18b");
  assert.equal(joined.toString("utf8"), "fb{dual_ec_is_not_a_good_prng_}\n");
});
