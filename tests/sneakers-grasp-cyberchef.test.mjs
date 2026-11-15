// Kitchen checks for the GRASP 4.00d protected-library operations.
// Vectors come from the repository's own Sneakers press-kit ZIP; the Python tool
// (tools/grasp_gl_cipher.py) and this browser code must agree byte for byte.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import { unzipSync } from "fflate";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const zip = readFileSync(new URL("../webxdc-sneakers-exact/source/Sneakers_Promotional_Diskette.zip", import.meta.url));
const sneakers = unzipSync(new Uint8Array(zip), { filter: f => f.name === "SNEAKERS.EXE" })["SNEAKERS.EXE"];
assert.equal(sha256(sneakers), "d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961");

// First 36 enciphered bytes of member asintro.txt (file offset 121997 + 3827 + 4).
const introCipherHex = "002b2a0042a9684f5d36d365864542dc4fd5d133d33665ab42e568368683 36d3652b2a00".replace(/\s/g, "");
const introPlain = ";\r\n; Universal Pictures' Sneakers\r\n;";

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:grasp-test";
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
  return { dom, run, packs };
}

const latin1 = bytes => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return s;
};

test("graspGlTable reproduces the runtime table and decrypts a pinned excerpt", () => {
  const { dom, run } = boot();
  try {
    const tables = run("graspGlTable", "", { keyWord: "ec70", mode: "table" });
    assert.match(tables, /key word 0xec70 · seed 0x736a6010/);
    const enc = tables.match(/encrypt \(plain→cipher\): ([0-9a-f]{512})/)[1];
    const dec = tables.match(/decrypt \(cipher→plain\): ([0-9a-f]{512})/)[1];
    assert.equal(enc.slice(0, 2), "43", "plain 0x00 -> 0x43");
    assert.equal(enc.slice(0x3b * 2, 0x3b * 2 + 2), "00", "plain ';' -> 0x00");
    assert.equal(enc.slice(0x20 * 2, 0x20 * 2 + 2), "42", "space -> 0x42");
    assert.equal(dec.slice(0x43 * 2, 0x43 * 2 + 2), "00");
    assert.equal(new Set(enc.match(/../g)).size, 256, "permutation");
    assert.equal(run("graspGlTable", introCipherHex, { keyWord: "ec70", mode: "decrypt", infmt: "hex", outfmt: "text" }), introPlain);
    assert.equal(run("graspGlTable", introPlain, { keyWord: "ec70", mode: "encrypt", infmt: "text", outfmt: "hex" }), introCipherHex);
    assert.throws(() => run("graspGlTable", "00", { keyWord: "xyz" }), /1–4 hex digits/);
  } finally { dom.window.close(); }
});

test("graspGlDirectory parses the whole EXE-bound library and extracts members byte-exactly", () => {
  const { dom, run, packs } = boot();
  try {
    const listing = run("graspGlDirectory", latin1(sneakers), {});
    assert.match(listing, /^GRASP GL directory @ file offset 121997 \(0x1dc8d\) · directory bytes 3825 · key word 0xec70 \(protected\) · members 224 · length-consistent 224/);
    assert.match(listing, /\nasintro\.txt +125824 +10153 {2}ok\n/);
    assert.doesNotMatch(listing, /MISMATCH/);
    const intro = run("graspGlDirectory", latin1(sneakers), { member: "asintro.txt", outfmt: "binstr" });
    assert.equal(sha256(Buffer.from(intro, "latin1")), "4184e79efdf783e8ebd1fb4bc57cd16cb7287b42ffe67cfa1d043de2d1ed9b68");
    assert.ok(intro.startsWith(introPlain));
    const menuPic = run("graspGlDirectory", latin1(sneakers), { member: "menu.pic", outfmt: "hex" });
    assert.equal(menuPic.slice(0, 4), "3412", "Pictor/PCPaint 0x1234 magic after decryption");
    assert.equal(sha256(Buffer.from(menuPic, "hex")), "c54019c782a015be4a1805e9dc04e8b722ba5762656365e3058ed88998f794de");
    assert.throws(() => run("graspGlDirectory", latin1(sneakers), { member: "nope.txt" }), /No member named/);
    const menu = dom.window.eval("OPERATIONS.find(op => op.id === 'recipePack').args[0].options.map(option => option[0])");
    for (const name of Object.keys(packs).filter(name => name.startsWith("Sneakers 1992 — GRASP")))
      assert.ok(menu.includes(name), `pack missing from menu: ${name}`);
    assert.deepEqual([...packs["Sneakers 1992 — GRASP GL directory + key word (Load File SNEAKERS.EXE)"].map(([id]) => id)], ["graspGlDirectory"]);
  } finally { dom.window.close(); }
});
