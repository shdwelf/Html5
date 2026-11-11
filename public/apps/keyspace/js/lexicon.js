import { WORDLIST } from "./bip39-en.js";

export function prefix4(word) {
  return word.slice(0, 4);
}

function edits1(a, b) {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return 99;
  if (la === lb) {
    let d = 0;
    for (let i = 0; i < la; i++) if (a[i] !== b[i] && ++d > 1) return d;
    return d;
  }
  const [s, l] = la < lb ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let d = 0;
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) {
      i++;
      j++;
    } else {
      if (++d > 1) return d;
      j++;
    }
  }
  return d + (l.length - j);
}

const neighborCache = new Map();

export function confusionPairs(word) {
  if (neighborCache.has(word)) return neighborCache.get(word);
  const out = [];
  for (const w of WORDLIST) {
    if (w === word) continue;
    if (w.slice(0, 3) === word.slice(0, 3) || edits1(w, word) === 1) out.push(w);
    if (out.length >= 6) break;
  }
  neighborCache.set(word, out);
  return out;
}

export function searchWords(q, limit = 24) {
  const s = q.trim().toLowerCase();
  if (!s) {
    return WORDLIST.slice(0, limit).map((w, i) => entry(w, i));
  }
  const hits = [];
  for (let i = 0; i < WORDLIST.length; i++) {
    const w = WORDLIST[i];
    if (w.startsWith(s) || String(i) === s || w.includes(s)) {
      hits.push(entry(w, i));
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

export function entry(word, index) {
  return {
    word,
    index,
    hex: index.toString(16).padStart(3, "0"),
    bin: index.toString(2).padStart(11, "0"),
    prefix: prefix4(word),
    near: confusionPairs(word),
  };
}

export function wordFromBits(bits) {
  let idx = 0;
  for (const b of bits) idx = (idx << 1) | (b ? 1 : 0);
  return { index: idx, word: WORDLIST[idx] };
}

export function bitsFromIndex(index) {
  const bits = [];
  for (let j = 10; j >= 0; j--) bits.push((index >> j) & 1);
  return bits;
}
