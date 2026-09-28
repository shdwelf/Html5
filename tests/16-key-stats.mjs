import assert from "node:assert/strict";
import { entropyStatistics, autocorrelations, erfc, pearson } from "../js/key-stats.js";
import { buildForm, FORMS } from "../js/forms3d.js";

const zeros = entropyStatistics(new Uint8Array(16));
assert.equal(zeros.bitCount, 128);
assert.equal(zeros.ones, 0);
assert.equal(zeros.runs, 1);
assert.equal(zeros.longestRun, 128);
assert.equal(zeros.nibbleHistogram[0], 32);
assert.equal(zeros.uniqueBytes, 1);
assert.equal(zeros.byteEntropy, 0);
assert.equal(zeros.runsApplicable, false);
assert.equal(zeros.runsP, null);

const alternating = Array(16).fill(0xaa);
const alt = entropyStatistics(new Uint8Array(alternating), [0, 2047, 0, 2047]);
assert.equal(alt.balance, 0.5);
assert.equal(alt.runs, 128);
assert.equal(alt.longestRun, 1);
assert.ok(Math.abs(alt.autocorrelation[0].correlation + 1) < 1e-12, "lag 1 of 1010… is -1");
assert.ok(Math.abs(alt.autocorrelation[1].correlation - 1) < 1e-12, "lag 2 of 1010… is +1");
assert.ok(Math.abs(alt.wordLag1 + 1) < 1e-12);

const ramp = entropyStatistics(Uint8Array.from({ length: 32 }, (_, i) => i));
assert.equal(ramp.uniqueBytes, 32);
assert.equal(ramp.byteEntropy, 5);
assert.equal(ramp.minEntropy, 5);
assert.equal(ramp.nibbleHistogram.reduce((a, b) => a + b, 0), 64);
assert.equal(ramp.autocorrelation.length, 32);
assert.equal(ramp.sampleWarning, true);

assert.ok(Math.abs(erfc(0) - 1) < 1e-7);
assert.ok(erfc(4) < 1e-7);
assert.equal(pearson([1, 2, 3], [2, 4, 6]), 1);
assert.equal(pearson([1, 2, 3], [6, 4, 2]), -1);
assert.equal(autocorrelations([0, 1], 32).length, 0);

const names = new Set(FORMS.map(([name]) => name));
assert.ok(names.has("distribution"));
assert.ok(names.has("autocorrelation"));
for (const name of ["distribution", "autocorrelation"]) {
  const group = buildForm(name, { entropy: Uint8Array.from({ length: 32 }, (_, i) => i), indices: [], checksumBits: 8 });
  let objects = 0;
  let finite = true;
  group.traverse((object) => {
    objects++;
    const attr = object.geometry?.getAttribute?.("position");
    if (attr) for (const value of attr.array) if (!Number.isFinite(value)) finite = false;
  });
  assert.ok(objects > 1, `${name} should build visible objects`);
  assert.ok(finite, `${name} coordinates must be finite`);
}

console.log("16-key-stats: all assertions passed");
