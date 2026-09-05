// Heuristic English syllable counter for BIP-39 5-7-5 mining.
// Ported from shdwelf/bip39-haiku-workbench (src/lib/syllables.ts).

const EXCEPTIONS = {
  abandon: 3, area: 3, idea: 3, video: 3, radio: 3, audio: 3, ratio: 3,
  poem: 2, poet: 2, lion: 2, quiet: 2, science: 2, fire: 1, hour: 1,
  iron: 2, every: 2, evening: 2, family: 3, vegetable: 4, chocolate: 3,
  business: 2, average: 3, different: 3, interest: 3, camera: 3, favorite: 3,
  orange: 2, people: 2, little: 2, simple: 2, table: 2, able: 2, apple: 2,
  bicycle: 3, animal: 3, energy: 3, enemy: 3, melody: 3, memory: 3,
  ocean: 2, create: 2, react: 2, riot: 2, diet: 2, giant: 2, client: 2,
  society: 4, real: 1, really: 2,
};

export function countSyllables(word) {
  let w = String(word || "").toLowerCase().trim().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (EXCEPTIONS[w] != null) return EXCEPTIONS[w];
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  w = w.replace(/^y/, "");
  const groups = w.match(/[aeiouy]{1,2}/g);
  let count = groups ? groups.length : 1;
  if (/[^aeiouy]le$/.test(String(word).toLowerCase())) count += 1;
  return Math.max(1, count);
}

export function countLineSyllables(line) {
  return String(line || "")
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, w) => sum + countSyllables(w), 0);
}

export function checkHaiku(lines) {
  const target = [5, 7, 5];
  const counts = lines.map(countLineSyllables);
  const valid = counts.length === 3 && counts.every((c, i) => c === target[i]);
  return { counts, valid };
}

/** Contiguous 3-way partition whose syllable sums are 5 / 7 / 5. */
export function partition575(words) {
  const syl = words.map(countSyllables);
  const n = words.length;
  for (let i = 1; i < n - 1; i++) {
    let a = 0;
    for (let k = 0; k < i; k++) a += syl[k];
    if (a !== 5) continue;
    for (let j = i + 1; j < n; j++) {
      let b = 0;
      for (let k = i; k < j; k++) b += syl[k];
      if (b !== 7) continue;
      let c = 0;
      for (let k = j; k < n; k++) c += syl[k];
      if (c !== 5) continue;
      return {
        lines: [
          words.slice(0, i).join(" "),
          words.slice(i, j).join(" "),
          words.slice(j).join(" "),
        ],
        counts: [a, b, c],
      };
    }
  }
  return null;
}

const NATURE = new Set([
  "river", "moon", "snow", "rain", "wind", "leaf", "flower", "frost", "cloud",
  "ocean", "forest", "autumn", "spring", "winter", "summer", "bird", "fish",
  "stone", "mountain", "sky", "dawn", "night", "shadow", "light", "garden",
]);

export function grammarScore(words) {
  let score = 60;
  for (let i = 1; i < words.length; i++) if (words[i] === words[i - 1]) score -= 25;
  const unique = new Set(words).size;
  score += (unique / Math.max(1, words.length)) * 20;
  for (const w of words) if (NATURE.has(w)) score += 6;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Greedy 5/7/5 split used by the inspector when a phrase is not a clean partition. */
export function greedy575(words) {
  const syllables = words.map(countSyllables);
  const lines = [[], [], []];
  const targets = [5, 7, 5];
  let li = 0;
  let acc = 0;
  for (let i = 0; i < words.length && li < 3; i++) {
    lines[li].push(words[i]);
    acc += syllables[i];
    if (acc >= targets[li]) {
      li += 1;
      acc = 0;
    }
  }
  const counts = lines.map((line) => line.reduce((s, w) => s + countSyllables(w), 0));
  return {
    lines,
    counts,
    isHaiku: counts[0] === 5 && counts[1] === 7 && counts[2] === 5 && li >= 2,
  };
}
