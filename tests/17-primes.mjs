import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";
import {
  sieve, isPrime, factorize, formatFactorization, ulamCoordinate,
  primeConstellations, primeStatistics,
} from "../js/primes.js";

const hundred = sieve(100);
assert.equal(hundred.primes.length, 25, "π(100)=25");
assert.equal(sieve(100000).primes.length, 9592, "π(100000)=9592 at the UI ceiling");
assert.equal(hundred.primes.at(-1), 97);
assert.deepEqual(hundred.primes.slice(0, 10), [2,3,5,7,11,13,17,19,23,29]);
for (const p of hundred.primes) assert.equal(hundred.composite[p], 0, `${p} unmarked`);
for (const n of [4,6,8,9,10,12,15,21,25,49,77,91]) assert.equal(hundred.composite[n], 1, `${n} marked`);

for (const p of [2,3,5,97,7919,999983]) assert.equal(isPrime(p), true, `${p} prime`);
for (const n of [-7,0,1,4,99,1000000]) assert.equal(isPrime(n), false, `${n} composite/non-prime`);
assert.deepEqual(factorize(360), [[2,3],[3,2],[5,1]]);
assert.deepEqual(factorize(999983), [[999983,1]]);
assert.equal(formatFactorization(360), "2^3 × 3^2 × 5");

const spiral = [[0,0],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
spiral.forEach((xy, i) => assert.deepEqual(ulamCoordinate(i + 1), xy, `Ulam coordinate ${i + 1}`));

const families = primeConstellations(hundred.primes);
assert.equal(families.twins.length, 8);
assert.ok(families.twins.some(([a,b]) => a === 71 && b === 73));
assert.ok(families.cousins.some(([a,b]) => a === 3 && b === 7));
assert.ok(families.sexy.some(([a,b]) => a === 5 && b === 11));

const stats = primeStatistics(hundred.primes, 100);
assert.equal(stats.count, 25);
assert.equal(stats.maxGap, 8);
assert.equal(stats.maxGapAfter, 89);
assert.equal([...stats.residues30.values()].reduce((a,b) => a + b, 0), 22, "all primes > 5 occupy the mod-30 wheel");
assert.ok(Math.abs(stats.density - .25) < 1e-12);
assert.ok(stats.meanGap > 3 && stats.meanGap < 5);

const html = readFileSync(join(ROOT, "prime.html"), "utf8");
const js = readFileSync(join(ROOT, "js/prime-viewer.js"), "utf8");
for (const view of ["atlas", "solar", "constellation"]) {
  assert.match(html, new RegExp(`data-view="${view}"`));
  assert.match(js, new RegExp(`state\\.view === "${view}"|${view}: \\[`));
}
for (const chart of ["gaps", "residues", "counting"]) assert.match(html, new RegExp(`data-chart="${chart}"`));
assert.match(js, /window\.webxdc\?\.sendUpdate/);
assert.match(js, /window\.webxdc\?\.setUpdateListener/);

console.log("17-primes: all assertions passed");
