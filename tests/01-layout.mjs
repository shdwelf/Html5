/**
 * 01 · the generalised BIP-39 layout: both directions, round trips, tamper.
 * node tests/01-layout.mjs
 */
import { suite, JS } from "./lib.mjs";

const B = await import(JS + "bip39.js");
const s = suite("01 · generalised layout");

console.log("\n[1] checksumForWords / layoutForWords");
for (const [n, ent, cs, std] of [
  [12, 128, 4, true], [15, 160, 5, true], [18, 192, 6, true], [21, 224, 7, true], [24, 256, 8, true],
  [25, 264, 11, false], [27, 288, 9, false], [30, 320, 10, false], [33, 352, 11, false], [56, 608, 8, false],
]) {
  const L = B.layoutForWords(n);
  s.eq(`words ${n}`, [L.entBits, L.csBits, L.standard], [ent, cs, std]);
  s.ok(`  11n closes: 11·${n} = ENT+CS`, 11 * n === L.entBits + L.csBits);
  s.ok(`  ENT byte aligned (${L.entBits})`, L.entBits % 8 === 0);
}

console.log("\n[2] inverse direction and mutual invertibility");
s.eq("ENT 128 -> words", B.layoutForEntropyBits(128).words, 12);
s.eq("ENT 256 -> words", B.layoutForEntropyBits(256).words, 24);
s.eq("ENT 264 -> words", B.layoutForEntropyBits(264).words, 25);
s.eq("ENT 56 -> words", B.layoutForEntropyBits(56).words, 6);
s.eq("ENT 56 -> cs", B.layoutForEntropyBits(56).csBits, 10);
s.eq("ENT 608 -> words", B.layoutForEntropyBits(608).words, 56);
s.ok("both directions agree for n = 2..60", (() => {
  for (let n = 2; n <= 60; n++) {
    const L = B.layoutForWords(n);
    if (B.layoutForEntropyBits(L.entBits).words !== n) return false;
  }
  return true;
})());
s.ok("rejects bad input", B.layoutForWords(1) === null && B.layoutForEntropyBits(7) === null);

console.log("\n[3] encode/decode round trip and tamper detection");
for (const n of [12, 24, 25, 33, 56]) {
  const { words, entropy, layout } = await B.randomMnemonic(n);
  s.eq(`randomMnemonic(${n}) length`, words.length, n);
  const a = await B.mnemonicToEntropy(words);
  s.ok(`  ${n}w decodes`, a.ok, a.reason);
  s.eq(`  ${n}w entropy round trip`, [...a.entropy].join(","), [...entropy].join(","));
  s.eq(`  ${n}w entBits`, a.entropyBits, layout.entBits);

  // Deterministic tamper: corrupt one checksum bit, leave ENT untouched.
  // Swapping a word is NOT a valid tamper test — a random new checksum matches
  // by chance with probability 2^-CS, so that assertion would be flaky.
  const csObs = a.checksumObserved.slice();
  csObs[csObs.length - 1] ^= 1;
  const cut = 11 - a.checksumBits;
  const leftover = (a.indices[a.indices.length - 1] >> a.checksumBits).toString(2).padStart(cut, "0");
  const corrupted = words.slice();
  corrupted[corrupted.length - 1] = B.WORDLIST[parseInt(leftover + csObs.join(""), 2)];
  const t = await B.mnemonicToEntropy(corrupted);
  s.ok(`  ${n}w corrupted checksum rejected`, t.ok === false, t.reason.slice(0, 44));
  s.ok(`  ${n}w ENT unchanged by that corruption`, [...t.entropy].join(",") === [...entropy].join(","));
}

console.log("\n[4] unknown words and odd bit lengths");
{
  const bad = await B.mnemonicToEntropy(["abandon", "notaword"]);
  s.ok("unknown word reported", bad.ok === false && /Unknown word/.test(bad.reason), bad.reason);
}
{
  const { entropy, layout } = await B.randomEntropyBits(56);
  const w = await B.entropyToMnemonic(entropy);
  s.eq("56-bit ENT -> 6 words", w.length, 6);
  s.eq("56-bit layout cs", layout.csBits, 10);
  s.ok("56-bit round trip", (await B.mnemonicToEntropy(w)).ok);
}

console.log("\n[6] the whole range 2…512: no gaps, one layout each, both directions agree");
{
  s.eq("bounds exported", [B.MIN_WORDS, B.MAX_WORDS], [2, 512]);
  s.eq("standard ladder exported", B.STANDARD_WORDS, [12, 15, 18, 21, 24]);
  const all = B.allLayouts();
  s.eq("allLayouts() covers every count", all.length, 511);
  let closed = 0, aligned = 0, csRange = 0, roundTrip = 0, standard = [];
  for (const L of all) {
    if (11 * L.words === L.entBits + L.csBits) closed++;
    if (L.entBits % 8 === 0 && L.entBytes === L.entBits / 8) aligned++;
    if (L.csBits >= 1 && L.csBits <= 11) csRange++;
    if (B.layoutForEntropyBits(L.entBits)?.words === L.words) roundTrip++;
    if (L.standard) standard.push(L.words);
  }
  s.eq("11n = ENT + CS for all 511", closed, 511);
  s.eq("ENT byte aligned for all 511", aligned, 511);
  s.eq("1 ≤ CS ≤ 11 for all 511", csRange, 511);
  s.eq("layoutForEntropyBits inverts layoutForWords for all 511", roundTrip, 511);
  s.eq("`standard` is exactly the BIP-39 ladder", standard, [12, 15, 18, 21, 24]);
  const top = B.layoutForWords(512);
  s.eq("ceiling: 512 words", [top.entBits, top.csBits, top.entBytes, top.totalBits], [5624, 8, 703, 5632]);
  s.ok("513 words and ENT 5632 have no layout", B.layoutForWords(513) === null && B.layoutForEntropyBits(5632) === null);
  s.ok("above-ladder counts are never called standard", [25, 26, 48, 100, 256, 512].every((n) => B.layoutForWords(n).standard === false));
  // "largest c ≤ 11 that closes 11n" never drops below 4 bits: r = 11n mod 8
  // takes r + 8 when that fits under 11, so CS ranges over exactly 4…11.
  const csSeen = [...new Set(all.map((L) => L.csBits))].sort((a, b) => a - b);
  s.eq("checksum widths that occur", csSeen, [4, 5, 6, 7, 8, 9, 10, 11]);
  const cs11 = all.find((L) => L.words > 24 && L.csBits === 11);
  s.eq("first CS=11 count above the ladder", cs11.words, 25);
  s.eq("CS period is 8 words", all.filter((L) => L.csBits === 11).map((L) => L.words).slice(0, 4), [9, 17, 25, 33]);
  for (const n of [26, 100, 512]) {
    const { words, entropy } = await B.randomMnemonic(n);
    const back = await B.mnemonicToEntropy(words);
    s.ok(`randomMnemonic(${n}) round trips`, back.ok && Buffer.from(back.entropy).equals(Buffer.from(entropy)) && back.layout.standard === false, back.reason);
  }
  let threw = "";
  try { await B.randomMnemonic(513); } catch (e) { threw = e.message; }
  s.ok("randomMnemonic(513) names the range", /2…512/.test(threw), threw);
}

console.log("\n[5] checksum strength: a random 12-word phrase validates at ~2^-CS");
{
  const trials = 400;
  let accepted = 0;
  for (let i = 0; i < trials; i++) {
    const junk = new Uint8Array(12);
    crypto.getRandomValues(junk);
    // 12 random 11-bit indices — not a real entropy sample
    const words = [...junk].slice(0, 12).map((b, k) => B.WORDLIST[((b * 8 + k * 37) % 2048)]);
    if ((await B.mnemonicToEntropy(words)).ok) accepted++;
  }
  const rate = accepted / trials;
  s.ok(`false-accept rate ${rate.toFixed(4)} within 1%–15% of the 1/16 expectation`, rate > 0.01 && rate < 0.15);
}

process.exit(s.done() ? 1 : 0);
