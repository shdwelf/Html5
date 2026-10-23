/**
 * haiku-vault.js — haiku generators + catalog for the haiku-vault-v1 format
 * (T9.2; format spec: docs/haiku-vault-format-draft.md).
 *
 * Two producers feed one payload shape:
 *  - a seeded phrase-bank generator: every bank phrase carries a verified
 *    syllable count, so generated haiku are 5-7-5 by construction;
 *  - a cataloger for found/OCR haiku text: groups lines into triples and
 *    records the counted meter (5-7-5 or off-meter) instead of guessing.
 * Payloads seal/open as haiku-vault-v1 files (PBKDF2-HMAC-SHA256, 120k,
 * AES-256-GCM) via WebCrypto, byte-compatible with the spec's test vector.
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

export const FIVES = [
  "soft rain on tin roofs", "moonlight on the pond", "first snow of winter",
  "a crow on the gate", "pine shadow at dusk", "cold wind through bare pines",
  "distant temple bell", "one leaf on the stream", "frost on the window",
  "the kettle sings low", "sparrows at daybreak", "mist over the fields",
];
export const SEVENS = [
  "a frog jumps into the pond", "the whole valley turns to mist",
  "an old dog sleeps by the door", "the river carries the moon",
  "cicadas cry in the pines", "we watch the clouds drift slowly",
  "the lantern sways in the wind", "a letter never sent south",
  "she pours the tea for no one", "the last train leaves the small town",
  "night deepens on the mountain", "the garden gate swings open",
];

/** Vowel-group syllable counter with a silent-e rule. */
export function countSyllablesInWord(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let groups = 0, prevVowel = false;
  for (const ch of w) {
    const vowel = "aeiouy".includes(ch);
    if (vowel && !prevVowel) groups++;
    prevVowel = vowel;
  }
  // Silent final e — bare ("gate") or before a plural s ("pines", "leaves") —
  // except when -le forms its own syllable ("temple", "kettle").
  const bare = w.endsWith("es") && !"aeiouy".includes(w[w.length - 3]) ? w.slice(0, -1) : w;
  const endsSilentE = bare.endsWith("e") && !"aeiouy".includes(bare[bare.length - 2]) && !(bare.endsWith("le") && !"aeiouy".includes(bare[bare.length - 3]));
  if (endsSilentE && groups > 1) groups--;
  return Math.max(groups, 1);
}

export function countSyllables(line) {
  return String(line).split(/\s+/).reduce((sum, w) => sum + countSyllablesInWord(w), 0);
}

// Verify the banks against the counter once; composition then trusts counts.
const PHRASE_COUNT = new Map();
for (const p of FIVES) PHRASE_COUNT.set(p, countSyllables(p));
for (const p of SEVENS) PHRASE_COUNT.set(p, countSyllables(p));

export function bankProblems() {
  const bad = [];
  for (const p of FIVES) if (PHRASE_COUNT.get(p) !== 5) bad.push(`${p} counts ${PHRASE_COUNT.get(p)}, want 5`);
  for (const p of SEVENS) if (PHRASE_COUNT.get(p) !== 7) bad.push(`${p} counts ${PHRASE_COUNT.get(p)}, want 7`);
  return bad;
}

/** Deterministic FNV-1a id for a haiku's text. */
export function haikuId(lines) {
  const s = lines.join("\n");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return "h-" + (h >>> 0).toString(16).padStart(8, "0");
}

export function makeEntry(lines, { source = "generated", title = null } = {}) {
  const clean = lines.map((l) => String(l).trim());
  if (clean.length !== 3 || clean.some((l) => !l)) throw new Error("A haiku entry needs exactly 3 non-empty lines");
  const syllables = clean.map(countSyllables);
  return {
    id: haikuId(clean),
    ...(title ? { title } : {}),
    lines: clean,
    syllables,
    meter: syllables.join("-") === "5-7-5" ? "5-7-5" : "off-meter",
    source,
  };
}

/** Seeded generator: 5-7-5 by construction (phrase counts verified above). */
export function generateHaiku(seed, { source = "enso-generator" } = {}) {
  const rand = mulberry32(seed >>> 0);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const entry = makeEntry([pick(FIVES), pick(SEVENS), pick(FIVES)], { source });
  return { ...entry, seed: seed >>> 0 };
}

/**
 * Catalog raw found/OCR text: split into non-empty lines, group consecutive
 * triples into entries; a trailing partial group is reported, not dropped.
 */
export function catalogHaikuText(text, { source = "ocr" } = {}) {
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const entries = [];
  let i = 0;
  for (; i + 3 <= lines.length; i += 3) entries.push(makeEntry(lines.slice(i, i + 3), { source }));
  return { entries, leftoverLines: lines.slice(i) };
}

export function buildCollectionPayload(entries, { title = "haiku collection", created = null } = {}) {
  return {
    kind: "haiku-collection",
    format: "haiku-vault-payload",
    version: 1,
    title,
    ...(created ? { created } : {}),
    count: entries.length,
    entries,
  };
}

// ---- haiku-vault-v1 seal/open (WebCrypto; spec: docs/haiku-vault-format-draft.md)

const MAGIC = "haiku-vault-v1.";
const subtle = () => {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("WebCrypto subtle is unavailable in this environment");
  return c.subtle;
};
const b64encode = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const b64decode = (b64) => Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));

async function deriveKey(passphrase, salt) {
  const km = await subtle().importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 },
    km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}

/** Seal a payload object into a haiku-vault-v1 one-line file string. */
export async function sealVault(payload, passphrase, { salt = null, iv = null } = {}) {
  const rand = (n) => { const b = new Uint8Array(n); globalThis.crypto.getRandomValues(b); return b; };
  salt = salt ?? rand(16);
  iv = iv ?? rand(12);
  const key = await deriveKey(passphrase, salt);
  const plain = new TextEncoder().encode(JSON.stringify(payload, null, 2));
  const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv }, key, plain));
  const body = new Uint8Array(1 + salt.length + iv.length + ct.length);
  body[0] = 0x01;
  body.set(salt, 1);
  body.set(iv, 1 + salt.length);
  body.set(ct, 1 + salt.length + iv.length);
  return MAGIC + b64encode(body);
}

/** Open a haiku-vault-v1 file string; rejects tampering/wrong passphrases. */
export async function openVault(text, passphrase) {
  const s = String(text).trim();
  if (!s.startsWith(MAGIC)) throw new Error("Missing haiku-vault-v1. magic");
  let body;
  try { body = b64decode(s.slice(MAGIC.length)); } catch { throw new Error("Vault body is not valid Base64"); }
  if (body.length < 1 + 16 + 12 + 16) throw new Error("Vault body too short");
  if (body[0] !== 0x01) throw new Error(`Unsupported vault version ${body[0]}`);
  const salt = body.subarray(1, 17), iv = body.subarray(17, 29), ct = body.subarray(29);
  const key = await deriveKey(passphrase, salt);
  let plain;
  try { plain = await subtle().decrypt({ name: "AES-GCM", iv }, key, ct); }
  catch { throw new Error("Vault authentication failed (wrong passphrase or tampered data)"); }
  return JSON.parse(new TextDecoder().decode(plain));
}
