/**
 * dual-shuffle.js — two-deck ("dual") shuffle explorer (T12.2).
 *
 * The question behind the backlog item: when two queues (two decks, two
 * people's playlists, a CyTube-style A/B rotation) are shuffled together,
 * which merge strategy and which shuffle algorithm stay fair? This module
 * implements the classic Fisher–Yates variants — including the two "dual"
 * formulations (sample-from-the-rest vs permute-what-you-have-seen) and the
 * famously biased naive swap — plus dual-deck merge strategies, all driven
 * by a seedable RNG so results are reproducible and testable.
 *
 * Pure functions, no DOM. dual-shuffle.html renders the explorer on top.
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, forward form: at each step sample from the rest. */
export function shuffleSampleRest(items, rand) {
  const a = items.slice();
  for (let i = 0; i < a.length - 1; i++) {
    const j = i + Math.floor(rand() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fisher–Yates, backward form: at each step permute what you have seen. */
export function shufflePermuteSeen(items, rand) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The naive "swap every slot with a random slot" shuffle — biased. Kept
 *  deliberately: the explorer's bias meter exists to convict it. */
export function shuffleNaive(items, rand) {
  const a = items.slice();
  for (let i = 0; i < a.length; i++) {
    const j = Math.floor(rand() * a.length);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const SHUFFLES = {
  "sample-rest": shuffleSampleRest,
  "permute-seen": shufflePermuteSeen,
  naive: shuffleNaive,
};

/**
 * Merge two decks into one queue.
 * strategy:
 *  - "interleave": strictly alternate A,B,A,B,... (longer deck's tail appends)
 *  - "riffle": repeatedly take from a random deck, weighted by cards remaining
 *  - "blocks": take runs of 1..3 from alternating decks (crossfade feel)
 *  - "concat-shuffle": concatenate, then shuffle the whole thing
 * Each deck is shuffled first unless opts.preserveOrder is set.
 */
export function mergeDecks(deckA, deckB, strategy, rand, opts = {}) {
  const shuffle = SHUFFLES[opts.shuffle || "permute-seen"] || shufflePermuteSeen;
  const a = opts.preserveOrder ? deckA.slice() : shuffle(deckA, rand);
  const b = opts.preserveOrder ? deckB.slice() : shuffle(deckB, rand);
  switch (strategy) {
    case "interleave": {
      const out = [];
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (i < a.length) out.push(a[i]);
        if (i < b.length) out.push(b[i]);
      }
      return out;
    }
    case "riffle": {
      const out = [];
      let i = 0, j = 0;
      while (i < a.length || j < b.length) {
        const remainingA = a.length - i, remainingB = b.length - j;
        if (remainingB === 0 || (remainingA > 0 && rand() < remainingA / (remainingA + remainingB))) out.push(a[i++]);
        else out.push(b[j++]);
      }
      return out;
    }
    case "blocks": {
      const out = [];
      let i = 0, j = 0, fromA = rand() < 0.5;
      while (i < a.length || j < b.length) {
        const run = 1 + Math.floor(rand() * 3);
        if (fromA) { for (let k = 0; k < run && i < a.length; k++) out.push(a[i++]); }
        else { for (let k = 0; k < run && j < b.length; k++) out.push(b[j++]); }
        fromA = !fromA;
        if (i >= a.length) fromA = false;
        if (j >= b.length) fromA = true;
      }
      return out;
    }
    case "concat-shuffle":
      return shuffle(a.concat(b), rand);
    default:
      throw new Error("unknown merge strategy: " + strategy);
  }
}

/**
 * Position-bias probe: shuffle [0..n-1] `trials` times and return, for the
 * tracked element (default 0), the count of trials landing at each position,
 * plus a chi-square statistic against the uniform expectation. A fair
 * shuffle of n=5 has 4 degrees of freedom; chi2 >> 20 is a conviction.
 */
export function positionBias(shuffleFn, { n = 5, trials = 6000, seed = 42, element = 0 } = {}) {
  const rand = mulberry32(seed);
  const base = Array.from({ length: n }, (_, i) => i);
  const counts = new Array(n).fill(0);
  for (let t = 0; t < trials; t++) counts[shuffleFn(base, rand).indexOf(element)]++;
  const expected = trials / n;
  const chi2 = counts.reduce((s, c) => s + ((c - expected) ** 2) / expected, 0);
  return { counts, chi2, trials, n };
}

export const VERDICT = (chi2, n) => (chi2 > 3 * (n - 1) ? "biased" : "no bias detected");

/**
 * Permutation-bias probe: count full permutations over many shuffles.
 * This is the probe that convicts the naive swap — its single-element
 * marginals are uniform, but its permutation distribution is not (n^n swap
 * sequences cannot divide evenly into n! permutations).
 */
export function permutationBias(shuffleFn, { n = 4, trials = 48000, seed = 42 } = {}) {
  const rand = mulberry32(seed);
  const base = Array.from({ length: n }, (_, i) => i);
  const counts = new Map();
  for (let t = 0; t < trials; t++) {
    const key = shuffleFn(base, rand).join(",");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let factorial = 1;
  for (let i = 2; i <= n; i++) factorial *= i;
  const expected = trials / factorial;
  let chi2 = 0;
  for (const c of counts.values()) chi2 += ((c - expected) ** 2) / expected;
  chi2 += (factorial - counts.size) * expected; // unseen permutations count fully
  return { counts, chi2, df: factorial - 1, trials, n };
}

export const PERM_VERDICT = (chi2, df) => (chi2 > 3 * df ? "biased" : "no bias detected");
