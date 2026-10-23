// T11.1: classified random name generator — determinism, formats, entropy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateCodename, generateBatch, spaceSize, entropyBits, ADJECTIVES, NOUNS } from "../js/codename.js";

test("seeded generation is deterministic across formats", () => {
  for (const format of ["operation", "cryptonym", "project"]) {
    assert.equal(generateCodename(99, format), generateCodename(99, format));
  }
  assert.match(generateCodename(1, "operation"), /^[A-Z]+ [A-Z]+$/);
  assert.match(generateCodename(1, "cryptonym"), /^[A-Z]{2}[A-Z]+$/);
  assert.match(generateCodename(1, "project"), /^[A-Z]+$/);
});

test("operation names compose only from the published wordlists", () => {
  const adj = new Set(ADJECTIVES.map((w) => w.toUpperCase()));
  const noun = new Set(NOUNS.map((w) => w.toUpperCase()));
  for (let seed = 0; seed < 25; seed++) {
    const [a, n] = generateCodename(seed, "operation").split(" ");
    assert.ok(adj.has(a) && noun.has(n), `${a} ${n}`);
  }
});

test("batches never repeat, respect the space, and entropy is honest", () => {
  const batch = generateBatch(7, 50, "operation");
  assert.equal(new Set(batch).size, 50);
  assert.equal(spaceSize("operation"), new Set(ADJECTIVES).size * new Set(NOUNS).size);
  assert.ok(Math.abs(entropyBits("operation") - Math.log2(spaceSize("operation"))) < 1e-9);
  assert.ok(entropyBits("operation") < 12, "codename entropy stays modest — not a password");
  assert.throws(() => generateBatch(1, spaceSize("project") + 1, "project"), /Only \d+ unique/);
  assert.throws(() => generateCodename(1, "bogus"), /unknown codename format/);
});
