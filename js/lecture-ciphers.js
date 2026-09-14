/**
 * lecture-ciphers.js — reference implementations behind the Intelligence
 * Lecture Hall records of apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html.
 *
 * Why this file exists: every lecture-hall claim that can be *computed* is
 * reproduced here instead of being asserted from a web page. Two of the four
 * sources publish their own ciphertexts, so a record is worth keeping only if
 * the bytes re-derive from the described mechanism:
 *
 *   1. Field Notes "Clandestine" (Fall 2018) cipher wheel — ported from
 *      Jurph/cipherwheel, master @ 2a40b7f (6 Dec 2020), cipherwheel.py
 *      <https://github.com/Jurph/cipherwheel>. Port is validated against the
 *      upstream unit vectors (see WHEEL_VECTORS) and against eight ciphertexts
 *      published by the solver community (see the verifier).
 *   2. F5's Black Hat 2016 cipher challenge — Playfair + ROT1 + Atbash nesting,
 *      ported from the Ruby generator F5 published in the DevCentral post-mortem
 *      <https://community.f5.com/kb/technicalarticles/blackhat-2016-f5-cipher-challenge/275036>
 *      (pliam, 11 Aug 2016). Re-derives all four published ciphertexts.
 *
 * Educational/historical use only. Both schemes are classical: they encode,
 * they do not encrypt. Neither protects a secret with consequences.
 *
 * No dependencies, no DOM, no network: usable from a browser <script type=module>
 * and from node tools alike.
 */

/* ------------------------------------------------------------------ alphabet */

/** The wheel's 36-character pool: A–Z then 0–9, zero-indexed. */
export const WHEEL_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
/** Playfair's 25-character pool: J merged into I. */
export const PLAYFAIR_POOL = "abcdefghiklmnopqrstuvwxyz";

const rotate = (str, n) => {
  const k = ((n % str.length) + str.length) % str.length;
  return str.slice(k) + str.slice(0, k);
};

/* ------------------------------------------------------------ cipher wheel */

/**
 * The wheel's monoalphabetic substitution for one key.
 *
 * Hardware model (from the upstream source, kept verbatim in behaviour):
 *   - the pool is split into two demi-alphabets by index parity
 *     (`index % key.length === 0` -> evens, else odds);
 *   - the SECOND key letter shifts the odds demi-alphabet relative to the evens,
 *     by floor((rotor2 + index(letter2)) / 2) + 1 — which is why only 18 of the
 *     36 possible second letters do anything new;
 *   - the two halves are interleaved back together;
 *   - the FIRST key letter rotates the whole wheel by (rotor1 + index(letter1)),
 *     a plain Caesar offset in a 36-symbol alphabet.
 *
 * @param {string} key exactly two characters from WHEEL_POOL (upstream does not
 *   sanitise input; this port refuses anything else rather than invent a rule)
 * @param {[number, number]} rotors the "hardware" offsets; [13, 13] is the
 *   default that reproduces Field Notes' own codes
 * @returns {string[]} the 36-character cipher alphabet, aligned to WHEEL_POOL
 */
export function wheelAlphabet(key, rotors = [13, 13]) {
  if (typeof key !== "string" || key.length !== 2) {
    throw new TypeError("wheel key must be exactly two characters");
  }
  const k = key.toUpperCase();
  const turns = [...k].map((c) => {
    const i = WHEEL_POOL.indexOf(c);
    if (i < 0) throw new TypeError(`wheel key must be A–Z or 0–9, got "${c}"`);
    return i;
  });
  const evens = [];
  const odds = [];
  for (let i = 0; i < WHEEL_POOL.length; i++) {
    (i % k.length === 0 ? evens : odds).push(WHEEL_POOL[i]);
  }
  const shiftedOdds = rotate(odds.join(""), Math.floor((rotors[1] + turns[1]) / 2) + 1).split("");
  let interleave = "";
  for (let i = 0; i < shiftedOdds.length; i++) {
    interleave += evens[i] + shiftedOdds[i];
  }
  return rotate(interleave, rotors[0] + turns[0]).split("");
}

/**
 * @param {string} key two-character wheel key
 * @param {[number, number]} [rotors]
 * @returns {{encode: (s: string) => string, decode: (s: string) => string, alphabet: string[]}}
 *   `encode` turns a plaintext into the wheel's printed ciphertext (the upstream
 *   encrypt direction); `decode` is its inverse — which is the direction the
 *   Clandestine corpus needs to give up its plaintext. Both pass through
 *   anything outside A-Z0-9 (spaces, punctuation), as the Python original does.
 */
export function wheel(key, rotors = [13, 13]) {
  const alphabet = wheelAlphabet(key, rotors);
  // Direction stays faithful to the upstream source, whose cipher dict is
  // zip(wheelAlphabet(key), pool) and whose `encrypt` walks keyed -> original.
  // That reads backwards at first glance, but it is the convention both the
  // unit tests and the Clandestine literature use: encoding an answer yields the
  // published code, and decoding a published ciphertext yields the plaintext.
  // A port that "corrects" the direction silently fails every vector.
  const toPlain = new Map();   // keyed -> original   (upstream encrypt)
  const toCipher = new Map();  // original -> keyed   (upstream decrypt)
  for (let i = 0; i < 36; i++) {
    toPlain.set(alphabet[i], WHEEL_POOL[i]);
    toCipher.set(WHEEL_POOL[i], alphabet[i]);
  }
  const map = (table, s) =>
    [...s.toUpperCase()].map((c) => table.get(c) ?? c).join("");
  return {
    alphabet,
    encode: (s) => map(toPlain, s),
    decode: (s) => map(toCipher, s),
  };
}

/** How many distinct alphabets the 36x36 key space really reaches (README claim). */
export function wheelKeyspace(rotors = [13, 13]) {
  const set = new Set();
  const identity = WHEEL_POOL.split("").join("");
  const nulls = [];
  for (const a of WHEEL_POOL) {
    for (const b of WHEEL_POOL) {
      const joined = wheelAlphabet(a + b, rotors).join("");
      set.add(joined);
      if (joined === identity) nulls.push(a + b);
    }
  }
  return { keys: 36 * 36, distinct: set.size, identityKeys: nulls };
}

/* ------------------------------------------------------------ F5 Playfair */

/** The card-puzzle ciphers F5 named in the post-mortem. */
export const caesar = (msg, shift = 3, fwd = true) =>
  [...msg].map((c) => {
    const i = c.toLowerCase().charCodeAt(0) - 97;
    if (i < 0 || i > 25) return c;
    const o = (((i - shift * (fwd ? 1 : -1)) % 26) + 26) % 26;
    return String.fromCharCode(97 + o);
  }).join("");

export const atbash = (msg) =>
  [...msg].map((c) => {
    const i = c.toLowerCase().charCodeAt(0) - 97;
    if (i < 0 || i > 25) return c;
    return String.fromCharCode(97 + (25 - i));
  }).join("");

const normalise = (s) => s.toLowerCase().replace(/[^a-z]/g, "").replace(/j/g, "i");

/** 5x5 key square: key phrase first (dupes dropped), then the rest of the pool. */
export function playfairSquare(key) {
  const stream = normalise(key) + PLAYFAIR_POOL;
  const seen = new Set();
  const cells = [];
  for (const c of stream) {
    if (seen.has(c)) continue;
    seen.add(c);
    cells.push(c);
    if (cells.length === 25) break;
  }
  const coords = {};
  cells.forEach((c, i) => { coords[c] = [Math.floor(i / 5), i % 5]; });
  return { cells, coords, rows: [0, 1, 2, 3, 4].map((r) => cells.slice(r * 5, r * 5 + 5).join(" ")) };
}

/**
 * Playfair in the exact variant F5 shipped: doubles are broken with an
 * inserted "x", an odd tail is padded with "q", rectangles swap corners.
 */
export function playfair(key) {
  const { cells, coords, rows } = playfairSquare(key);
  const at = (r, c) => cells[(((r % 5) + 5) % 5) * 5 + (((c % 5) + 5) % 5)];
  const digram = (a, b, fwd) => {
    const inc = fwd ? 1 : -1;
    const [r1, c1] = coords[a];
    const [r2, c2] = coords[b];
    if (r1 === r2) return at(r1, c1 + inc) + at(r2, c2 + inc);
    if (c1 === c2) return at(r1 + inc, c1) + at(r2 + inc, c2);
    return at(r1, c2) + at(r2, c1);
  };
  const split = (p) => {
    const out = [];
    for (let i = 0; i < p.length; i += 2) out.push([p[i], p[i + 1]]);
    return out;
  };
  return {
    rows,
    encrypt(p) {
      let t = normalise(p).replace(/([a-z])\1/g, "$1x$1");
      if (t.length % 2) t += "q";
      return split(t).map(([a, b]) => digram(a, b, true)).join("");
    },
    decrypt(c) {
      const t = normalise(c);
      return split(t).map(([a, b]) => digram(a, b, false)).join("")
        .replace(/([a-z])x\1/g, "$1$1")
        .replace(/q$/, "");
    },
  };
}

/* --------------------------------------------------- published reference data */

/** Unit vectors taken from the upstream repo (cipherwheel.py, class TestCustomFunctions). */
export const WHEEL_VECTORS = {
  identityKeys: ["XW", "XV"],
  alphabetAA: "1O3Q5S7U9WBYD0F2H4J6L8NAPCRETGVIXKZM",
  alphabetFN: "SLUNWPYR0T2V4X6Z81A3C5E7G9IBKDMFOHQJ",
  encrypt: [
    { key: "A9", plain: "HELLO ABC 789", cipher: "Q1UUB XKZ GVI" },
    { key: "FN", plain: "HELLO", cipher: "7WBB6" },
  ],
};

/** messages.txt of the same repo — the Clandestine release literature's puzzle corpus. */
export const CLANDESTINE_MESSAGES = [
  "0j'a d6j wduhgfjw3 0d u63w j6 3wu0f7wh 0j bsjwh, 0j'a wduhgfjw3 0d u63w j6 3wu0f7wh 0j d6e",
  "5owb3d6jwa1hsd3.u64 = f[6]eldnotes[V]rand.com",
  "m9uuty01h4qwksq.1op",
  "8qejhiyi6f8nlpa.hb5",
  "da1kw7og52sxmn.g2d",
  "iydk96hmwanj0u7.ui3",
];

/**
 * Ciphertext codes + keys + published answers as documented by the solver
 * community at f1eldn0tes.com/known (Tumblr, "Agents of F.I.E.L.D.").
 * `expect` is what the wheel must produce; `status` records whether this
 * repository could reproduce it, so the table doubles as an audit ledger.
 */
export const FIELDNOTES_CODES = [
  { puzzle: 10, key: "06", code: "8RP4 0FIB LP8L", answer: "LUSH DIVE OSLO", status: "exact" },
  { puzzle: 12, key: "JS", code: "TOXX 3W5U T9SA 6JXI IJ", answer: "BAFFLINGBREW S1F4 41", status: "exact" },
  { puzzle: 13, key: "NS", code: "T5K1 MO29 S17K QOIJ AFH", answer: "FRANCES VINTAGE 85013", status: "exact" },
  { puzzle: 14, key: "MB", code: "LT8L PWHE P", answer: "AIDA E1 6JE", status: "exact" },
  { puzzle: 15, key: "BS", code: "EADA 5WEW 4BAH XUXM O", answer: "SON OF A SAILOR 78702", status: "exact" },
  { puzzle: 16, key: "H9", code: "TC4I OPF7 PQRT RYUN E5GH", answer: "TWO HANDS PAPERIE 80302", pre: "quartet-shift 2-0-0-1", status: "exact" },
  { puzzle: 17, key: "54", code: "G5XZ GHVG GCKU LWSL", answer: "OLD FOX BOOKS 21401", status: "exact" },
  { puzzle: 18, key: "FE", code: "U6FF WWAT CD06 OIOM I", answer: "COFFEE STUDIO 60640", status: "exact" },
  { puzzle: 9, key: "VK", code: "FU41 C9F6 SQTR S", answer: "OBLATION 97209", twoStageKey: "KS", status: "exact-double" },
  { puzzle: 11, key: "JB", code: "T2PR PK5S W GV LIZ6 ST82", answer: "VORTEX SOUVENIR 67214", status: "transposed" },
];

/** The four ciphertexts and the solution F5 published for Black Hat 2016. */
export const F5_2016 = {
  card1: "HSHRZQHCCKD",
  card2: "DIZKKVWRMZNBHGVIB",
  card3: "INSIDE AN ENIGMA (pigpen glyphs; the image is not in the text record)",
  tshirt: "SF PS DS IY FR CS MB DM IN QN NP HR FV EI BX YG WF QW XC WY SM LK",
  keyPhrases: ["It is a riddle", "wrapped in a mystery", "inside an enigma"],
  shift: 1,
  solution: "THERE IS NOTHING MORE DECEPTIVE THAN AN OBVIOUS FACT",
  square: ["itsar", "dlewp", "nmygb", "cfhko", "quvxz"],
};

/**
 * The 32 hex characters engraved in the gold ring of the U.S. Cyber Command
 * seal, transcribed by the press on 8 July 2010, plus the preimage the community
 * matched to it. Reproduced in tools/verify_lecture_hall.mjs with node:crypto.
 */
export const USCYBERCOM = {
  sealHash: "9ec4c12949a4f31474f299058ce2b22a",
  missionStatement:
    "USCYBERCOM plans, coordinates, integrates, synchronizes and conducts activities to: " +
    "direct the operations and defense of specified Department of Defense information networks and; " +
    "prepare to, and when directed, conduct full spectrum military cyberspace operations in order to " +
    "enable actions in all domains, ensure US/Allied freedom of action in cyberspace and deny the same " +
    "to our adversaries.",
};
