// Dual-shuffle explorer (T12.2): fairness and merge-strategy tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mulberry32, SHUFFLES, mergeDecks, positionBias, VERDICT, permutationBias, PERM_VERDICT } from "../js/dual-shuffle.js";

const A = ["a1", "a2", "a3", "a4"];
const B = ["b1", "b2", "b3"];

test("seeded RNG is deterministic and every shuffle is a permutation", () => {
  assert.equal(mulberry32(7)(), mulberry32(7)());
  for (const fn of Object.values(SHUFFLES)) {
    const out = fn([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(99));
    assert.deepEqual(out.slice().sort((x, y) => x - y), [1, 2, 3, 4, 5, 6, 7, 8]);
  }
});

test("both Fisher-Yates duals pass the bias meter; the naive swap is convicted", () => {
  for (const id of ["sample-rest", "permute-seen"]) {
    const { chi2 } = positionBias(SHUFFLES[id]);
    assert.equal(VERDICT(chi2, 5), "no bias detected", `${id} chi2=${chi2}`);
  }
  // The naive swap's single-card marginals are uniform; its crime is in the
  // joint permutation distribution, so convict it there.
  const naive = permutationBias(SHUFFLES.naive);
  assert.equal(PERM_VERDICT(naive.chi2, naive.df), "biased", `naive chi2=${naive.chi2}`);
});

test("merge strategies preserve the multiset union of both decks", () => {
  for (const strategy of ["interleave", "riffle", "blocks", "concat-shuffle"]) {
    const out = mergeDecks(A, B, strategy, mulberry32(5));
    assert.deepEqual(out.slice().sort(), A.concat(B).sort(), strategy);
  }
});

test("interleave with preserved order is exactly A,B,A,B with the tail appended", () => {
  const out = mergeDecks(A, B, "interleave", mulberry32(1), { preserveOrder: true });
  assert.deepEqual(out, ["a1", "b1", "a2", "b2", "a3", "b3", "a4"]);
});
