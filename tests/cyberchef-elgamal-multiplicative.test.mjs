// ElGamal mechanics are sourced from David J. Wu, XRDSFHE.pdf, § ElGamal:
// c=(g^r, h^r m), componentwise multiplication, and rerandomization with Enc(1).
// The expected numbers below are an independent hand calculation, also checked
// separately with Python's pow(base, exponent, modulus); the paper supplies no
// ready-made numeric vector.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:cyberchef-elgamal-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const ops = dom.window.eval("OPERATIONS");
  const byId = new Map(ops.map((op) => [op.id, op]));
  const run = (id, input = "", changes = {}) => {
    const op = byId.get(id);
    assert.ok(op, `operation ${id} is registered`);
    const args = Object.fromEntries(op.args.map((arg) => [arg.key, arg.default]));
    Object.assign(args, changes);
    return op.run(input, args);
  };
  return { dom, ops, run };
}

test("ElGamal recipe registry has one operation and one named teaching pack", () => {
  const { dom, ops } = boot();
  try {
    const matches = ops.filter((op) => /elgamal|homomorphic/i.test(`${op.id} ${op.name}`));
    assert.equal(matches.length, 1, "no local ElGamal/homomorphic operation should be duplicated");
    assert.equal(matches[0].id, "elgamalMulDemo");

    const packs = dom.window.eval("RECIPE_PACKS");
    const dedicated = "ElGamal Multiplicative Homomorphism (not FHE)";
    assert.deepEqual(JSON.parse(JSON.stringify(packs[dedicated])), [["elgamalMulDemo", {}]]);
    assert.ok(packs["Full Coverage — Public Key"].some(([id]) => id === "elgamalMulDemo"));
    assert.equal(Object.keys(packs).filter((name) => /ElGamal/i.test(name)).length, 1);
  } finally {
    dom.window.close();
  }
});

test("worked vector verifies encryption, multiplicative homomorphism, and rerandomization", () => {
  const { dom, run } = boot();
  try {
    // Independent vector for P=23, q=11, g=2, α=3, m0=4/r0=4,
    // m1=8/r1=5, and rerandomization exponent s=3.
    const out = JSON.parse(run("elgamalMulDemo"));
    assert.equal(out.group.modulusP, "23");
    assert.equal(out.group.primeOrderQ, "11");
    assert.equal(out.group.generatorG, "2");
    assert.equal(out.group.publicH, "8");
    assert.deepEqual(out.encryptions, [
      { message: "4", randomizer: "4", ciphertext: { c0: "16", c1: "8" } },
      { message: "8", randomizer: "5", ciphertext: { c0: "9", c1: "13" } },
    ]);
    assert.deepEqual(out.homomorphicProduct, {
      formula: "(c0₀·c0₁ mod P, c1₀·c1₁ mod P)",
      ciphertext: { c0: "6", c1: "12" },
      plaintextProductModP: "9",
      decrypted: "9",
    });
    assert.deepEqual(out.rerandomization, {
      formula: "C′ = C · Enc(1; s)",
      freshExponent: "3",
      freshEncryptionOfOne: { c0: "8", c1: "6" },
      ciphertext: { c0: "2", c1: "3" },
      decrypted: "9",
    });
    assert.match(out.scope, /not FHE/i);
    assert.match(out.notes.join(" "), /not fresh independent randomness/i);
    assert.match(out.notes.join(" "), /does not implement arbitrary circuits, bootstrapping, or GSW/i);
  } finally {
    dom.window.close();
  }
});

test("non-prime groups and messages outside the chosen subgroup are rejected", () => {
  const { dom, run } = boot();
  try {
    assert.throws(() => run("elgamalMulDemo", "", { p: "21" }), /P must be prime/i);
    assert.throws(() => run("elgamalMulDemo", "", { m0: "5" }), /m₀ must be a nonzero member/i);
    assert.throws(() => run("elgamalMulDemo", "", { r1: "11" }), /r₁ must satisfy/i);
    assert.throws(() => run("elgamalMulDemo", "", { q: "10" }), /q must be prime/i);
  } finally {
    dom.window.close();
  }
});
