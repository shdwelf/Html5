import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// The site intentionally has no root package.json. Import the browser ES module
// through a data URL so this dependency-free Node suite exercises its real code.
const source = await readFile(new URL("../js/syllables.js", import.meta.url), "utf8");
const syllables = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const { countSyllables, countLineSyllables, checkHaiku, greedy575 } = syllables;

const pronunciations = {
  gentle: 2,
  poetry: 3,
  beautiful: 3,
  agitated: 4,
  approaches: 3,
  camellia: 4,
  hototogisu: 5,
  prayer: 1,
  violent: 3,
  "morning-glory": 4,
  "winter-peony": 5,
  "108": 4,
};
for (const [word, expected] of Object.entries(pronunciations)) {
  assert.equal(countSyllables(word), expected, `${word} should have ${expected} syllables`);
}

assert.equal(countSyllables("moon-light"), 2, "unknown compounds sum their parts");
assert.equal(countLineSyllables("old pond / a frog"), 4, "punctuation does not create syllables");
assert.deepEqual(checkHaiku(["green leaf moon sky rain", "beautiful river moon light", "old pond frog splash night"]), {
  counts: [5, 7, 5],
  valid: true,
});
assert.equal(checkHaiku(["green leaf moon sky rain", "beautiful river light", "old pond frog splash"]).valid, false);
assert.equal(checkHaiku(["green leaf moon sky rain", "beautiful river light", "old pond frog splash night dawn"]).valid, false);

const overflow = greedy575("moon moon moon moon moon moon moon moon moon moon moon moon moon moon moon moon moon moon".split(" "));
assert.deepEqual(overflow.counts, [5, 7, 6]);
assert.equal(overflow.lines.flat().length, 18, "greedy split must never discard overflow words");
assert.equal(overflow.isHaiku, false, "5-7-6 must fail strict validation");

console.log("08-syllables: all assertions passed");
