/**
 * codename.js — classified-style random name generator (T11.1).
 *
 * Three historical shapes:
 *  - operation names: ADJECTIVE + NOUN ("SILENT HARBOR")
 *  - cryptonyms: a two-letter digraph (historically a country/topic prefix)
 *    fused to a stem word ("ZRLANCHOR")
 *  - project words: a single evocative noun in caps ("NIGHTJAR")
 * Seeded (mulberry32) so names are reproducible for tests and after-action
 * reports; batch mode samples without replacement so a generated set never
 * repeats itself. Entropy is reported, not exaggerated: adjective×noun is
 * only ~11 bits, fine for codenames, useless as a password — the module
 * says so.
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

export const ADJECTIVES = [
  "Silent", "Crimson", "Hollow", "Velvet", "Iron", "Amber", "Frozen", "Scarlet",
  "Patient", "Broken", "Golden", "Murky", "Quiet", "Restless", "Paper", "Granite",
  "Hidden", "Electric", "Wooden", "Midnight", "Careful", "Lonely", "Rapid", "Static",
  "Vigilant", "Umbral", "Cinder", "Mosaic", "Harbor", "Willow", "Copper", "Feral",
  "Modest", "Urgent", "Pale", "Sable", "Thorn", "Mirror", "Cobalt", "Second",
];
export const NOUNS = [
  "Harbor", "Anchor", "Lantern", "Compass", "Falcon", "Ledger", "Mirror", "Signal",
  "Orchard", "Bastion", "Cipher", "Dagger", "Ember", "Furnace", "Glacier", "Heron",
  "Inkwell", "Jackal", "Kestrel", "Loom", "Monsoon", "Needle", "Obsidian", "Parade",
  "Quarry", "Raven", "Saddle", "Tempest", "Umbrella", "Vessel", "Walnut", "Yardarm",
  "Zephyr", "Nightjar", "Foxglove", "Hammer", "Island", "Juniper", "Keystone", "Tidepool",
];
export const DIGRAPHS = ["ZR", "KU", "MH", "PB", "AM", "GT", "LN", "SB", "QD", "HT", "FK", "WN"];
export const STEMS = [
  "RIFLE", "LANCHOR", "MORPH", "CASTOR", "BEACON", "TALENT", "WIDGET", "HARBOR",
  "PONDER", "SABLE", "VECTOR", "MANGLE", "OSPREY", "TUNDRA", "VELVET", "WALNUT",
];

const unique = (arr) => [...new Set(arr)];

export function spaceSize(format) {
  switch (format) {
    case "operation": return unique(ADJECTIVES).length * unique(NOUNS).length;
    case "cryptonym": return DIGRAPHS.length * STEMS.length;
    case "project": return unique(NOUNS).length;
    default: throw new Error("unknown codename format: " + format);
  }
}

export function entropyBits(format) {
  return Math.log2(spaceSize(format));
}

function draw(rand, format) {
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  switch (format) {
    case "operation": return `${pick(unique(ADJECTIVES))} ${pick(unique(NOUNS))}`.toUpperCase();
    case "cryptonym": return pick(DIGRAPHS) + pick(STEMS);
    case "project": return pick(unique(NOUNS)).toUpperCase();
    default: throw new Error("unknown codename format: " + format);
  }
}

/** One name. Same seed + format => same name, every time. */
export function generateCodename(seed, format = "operation") {
  return draw(mulberry32(seed >>> 0), format);
}

/** A batch with no repeats (rejection sampling over the seeded stream). */
export function generateBatch(seed, count, format = "operation") {
  if (count > spaceSize(format)) throw new Error(`Only ${spaceSize(format)} unique ${format} names exist; asked for ${count}`);
  const rand = mulberry32(seed >>> 0);
  const out = new Set();
  while (out.size < count) out.add(draw(rand, format));
  return [...out];
}
