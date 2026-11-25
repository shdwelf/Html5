import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { FIELDS, fieldById, fieldAdd, fieldMultiply, fieldPower, fieldInverse, fieldDivide, elementPolynomial } from "../js/galois.js";
import { initGaloisExplorer } from "../js/galois-view.js";
import { LENS_BY_ID } from "../js/formal.js";
import { drawLens } from "../js/lens-draw.js";
import { makeCanvas } from "./lib.mjs";

// Independent carryless convolution, then polynomial long division. The
// implementation uses a shift-and-reduce loop instead.
function polynomialProduct(a, b, degree, modulus) {
  let product = 0;
  for (let bit = 0; bit < degree; bit++) if ((b >> bit) & 1) product ^= a << bit;
  for (let bit = degree * 2 - 2; bit >= degree; bit--)
    if ((product >> bit) & 1) product ^= modulus << (bit - degree);
  return product;
}

for (const field of FIELDS) test(`${field.id}: exhaustive products, inverses and field identities`, () => {
  assert.equal(fieldById(field.id), field);
  assert.equal(fieldInverse(field, 0), null);
  assert.equal(fieldDivide(field, 0, 0), null);
  for (let a = 0; a < field.order; a++) {
    const inverse = fieldInverse(field, a);
    assert.equal(inverse === null, a === 0);
    if (a) assert.equal(fieldMultiply(field, a, inverse), 1);
    for (let b = 0; b < field.order; b++) {
      const expected = field.characteristic === 2
        ? polynomialProduct(a, b, field.degree, field.modulus) : (a * b) % 17;
      const product = fieldMultiply(field, a, b);
      assert.equal(product, expected);
      assert.equal(product, fieldMultiply(field, b, a));
      const c = (b * 7 + a) % field.order;
      assert.equal(fieldMultiply(field, a, fieldAdd(field, b, c)), fieldAdd(field, product, fieldMultiply(field, a, c)));
      assert.equal(fieldMultiply(field, product, c), fieldMultiply(field, a, fieldMultiply(field, b, c)));
      if (b) assert.equal(fieldMultiply(field, fieldDivide(field, a, b), b), a);
      else assert.equal(fieldDivide(field, a, b), null);
    }
    assert.equal(fieldAdd(field, a, 0), a);
    assert.equal(fieldMultiply(field, a, 1), a);
    if (a) assert.equal(fieldPower(field, a, field.order - 1), 1);
  }
});

test("published AES example, polynomial-basis distinction, prime arithmetic and strict bounds", () => {
  const aes = fieldById("aes"), rs = fieldById("rs"), f17 = fieldById("f17");
  assert.equal(fieldMultiply(aes, 0x57, 0x83), 0xc1);
  assert.equal(fieldAdd(aes, 0x57, 0x83), 0xd4);
  assert.equal(fieldInverse(aes, 0x53), 0xca);
  assert.equal(fieldMultiply(aes, 0x80, 2), 0x1b);
  assert.equal(fieldMultiply(rs, 0x80, 2), 0x1d);
  assert.equal(fieldAdd(f17, 16, 2), 1);
  assert.equal(fieldMultiply(f17, 16, 16), 1);
  assert.equal(elementPolynomial(aes, 0x57), "x^6 + x^4 + x^2 + x + 1");
  assert.equal(elementPolynomial(aes, 0), "0");
  assert.throws(() => fieldById("z16"), /preset/);
  assert.throws(() => fieldMultiply({ ...aes }, 1, 1), /preset/);
  for (const bad of [-1, 256, NaN, Infinity, 1.5, "1"]) assert.throws(() => fieldAdd(aes, bad, 1), /integers/);
  for (const bad of [-1, 1.5, Infinity]) assert.throws(() => fieldPower(aes, 1, bad), /exponent/);
});

test("all-zero entropy is never presented as having a multiplicative inverse", () => {
  const entropy = new Uint8Array(16);
  const result = LENS_BY_ID.get("alg-field").compute({ entropy });
  assert.match(JSON.stringify(result.rows), /zero has no inverse/);
  assert.doesNotMatch(JSON.stringify(result.rows), /\(=1\)/);
  assert.match(result.predict, /no nonzero byte/);
  assert.match(result.explain, /SHA-256/);
  const canvas = makeCanvas();
  const labels = [];
  const fillText = canvas._ctx.fillText;
  canvas._ctx.fillText = (text, ...args) => { labels.push(String(text)); fillText(text, ...args); };
  drawLens("alg-field", canvas, { entropy });
  assert.ok(labels.includes("undefined"), "zero cells explicitly mark the inverse undefined");
  assert.deepEqual(canvas._ctx.bad, []);
});

test("field UI supports presets, exact values, explicit entropy sampling and errors without changing phrase", () => {
  const html = readFileSync(new URL("../keyspace.html", import.meta.url), "utf8");
  const dom = new JSDOM(html);
  const { document, Event, MouseEvent } = dom.window;
  const canvas = makeCanvas();
  canvas._ctx.clearRect = () => {};
  dom.window.HTMLCanvasElement.prototype.getContext = () => canvas._ctx;
  const $ = (id) => document.getElementById(id);
  let entropy = null;
  const explorer = initGaloisExplorer(document, () => entropy);
  try {
    assert.equal($("fieldPreset").options.length, 4);
    assert.equal($("fieldProduct").textContent, "0xc1");
    assert.equal($("fieldFromEntropy").disabled, true);
    const phrase = $("phrase").value;
    entropy = new Uint8Array([0, 0]);
    explorer.update();
    assert.equal($("fieldProduct").textContent, "0xc1", "entropy is only sampled on explicit click");
    $("fieldFromEntropy").dispatchEvent(new MouseEvent("click"));
    assert.match($("fieldInverse").textContent, /undefined/);
    assert.match($("fieldDivision").textContent, /undefined/);
    assert.match($("fieldStatus").textContent, /Phrase unchanged/);
    assert.equal($("phrase").value, phrase);
    assert.deepEqual([...entropy], [0, 0]);
    $("fieldPreset").value = "f17";
    $("fieldPreset").dispatchEvent(new Event("change"));
    $("fieldA").value = "16"; $("fieldB").value = "2";
    $("fieldA").dispatchEvent(new Event("input"));
    assert.equal($("fieldSum").textContent, "1");
    assert.equal($("fieldProduct").textContent, "15");
    $("fieldA").value = "17";
    $("fieldA").dispatchEvent(new Event("input"));
    assert.equal($("fieldProduct").textContent, "—");
    assert.match($("fieldStatus").textContent, /0…16/);
    $("fieldA").value = "1e1";
    $("fieldA").dispatchEvent(new Event("input"));
    assert.match($("fieldStatus").textContent, /decimal or 0x/);
    assert.deepEqual(canvas._ctx.bad, []);
  } finally { dom.window.close(); }
});
