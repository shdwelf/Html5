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

/**
 * messages.txt of the same repo — the Clandestine release literature's puzzle
 * corpus, transcribed in full and in file order.
 *
 * Fidelity note (2026-09-20): this array used to carry six lines. Upstream
 * messages.txt has **seven** — the seventh is the publisher's domain in the
 * clear, and it is the corpus's own answer key for line 2. It was fetched from
 * the GitHub API rather than retyped, so the port is now byte-faithful:
 *
 *   gh api repos/Jurph/cipherwheel/contents/messages.txt --jq .content | base64 -d
 */
export const CLANDESTINE_MESSAGES = [
  "0j'a d6j wduhgfjw3 0d u63w j6 3wu0f7wh 0j bsjwh, 0j'a wduhgfjw3 0d u63w j6 3wu0f7wh 0j d6e",
  "5owb3d6jwa1hsd3.u64 = f[6]eldnotes[V]rand.com",
  "m9uuty01h4qwksq.1op",
  "8qejhiyi6f8nlpa.hb5",
  "da1kw7og52sxmn.g2d",
  "iydk96hmwanj0u7.ui3",
  "fieldnotesbrand.com",
];

/**
 * The three readings of corpus line 2 that the 2026-09-20 pass separated.
 *
 * The dial is 36 characters wide and mixes letters with digits, so a
 * transcription can be perfectly legible and still wrong. All three strings
 * below are the *same* line read three ways; the wheel turns each into
 * something different, and only one of them is the publisher's domain.
 */
export const CLANDESTINE_AMBIGUITY = {
  /** the ciphertext exactly as messages.txt prints it (letter O, digit 1) */
  asFile: "5OWB3D6JWA1HSD3.U64",
  /** what the wheel actually emits for FIELDNOTESBRAND.COM (digit 0, digit 1) */
  asWheel: "50WB3D6JWA1HSD3.U64",
  /** the file's ciphertext with the digit 1 read as a lowercase L, which is
   *  what reproduces the corpus's own annotation f[6]eldnotes[V]rand.com */
  asAnnotated: "5OWB3D6JWALHSD3.U64",
  plaintext: "FIELDNOTESBRAND.COM",
  annotation: "f[6]eldnotes[V]rand.com",
};

/**
 * The complete f1eldn0tes.com ledger — all 21 published codes, keys and
 * answers, transcribed from the archive's own "Solutions / What We Know" page
 * <https://f1eldn0tes.com/known> and re-derived here in 2026-09-20.
 *
 * `op` is the operation the archive itself documents for that puzzle. The
 * previous pass could only assert eight rows; the full ledger re-derives
 * eighteen of twenty-one, proves a nineteenth is a permutation, and proves the
 * last two are corrupt rather than merely odd.
 *
 * op vocabulary
 *   decode        wheel(key).decode(code) === answer
 *   encode        wheel(key).encode(code) === answer   (#6 — "came from
 *                 encoding, not decoding")
 *   decode+box    wheel decode, then read the result out of a 5x4 box by
 *                 columns (#5 — the blog's "stacked 4x5" is 4 wide, 5 tall)
 *   double        wheel(KS).decode(wheel(VK).decode(code))   (#9)
 *   quartet       shift each 4-character group by 2-0-0-1 in the 36-symbol
 *                 pool, then decode (#16)
 *   decode+book   wheel decode yields seven 2-digit word numbers into the
 *                 Declaration of Independence (#8)
 *   decode+spiral wheel decode yields a permutation of the answer; the spiral
 *                 geometry is on the notebook page, which is not published (#11)
 *   collision     the archive prints one code for two puzzles and no key in the
 *                 whole reachable space reproduces either answer (#19, #20)
 */
export const FIELDNOTES_CODES = [
  { puzzle: 1,  key: "SH", code: "D7BH 0NB5 B77.",            answer: "826 CHI 60622",              op: "decode",      status: "exact",        note: "Sherlock Holmes. Resolves the archivist’s “820chi” query — see docs/lecture-hall-research-2026-09-20.md" },
  { puzzle: 2,  key: "KG", code: "7K4N GZNM MRKJ WUUU",       answer: "URBAN MATTER 63111",         op: "decode",      status: "exact",        note: "Kasper Gutman, The Maltese Falcon" },
  { puzzle: 3,  key: "HP", code: "F3U8 F4S0 Y8FO KNGR",       answer: "THE STOCKIST 84105",         op: "decode",      status: "exact",        note: "Hercule Poirot" },
  { puzzle: 4,  key: "OG", code: "2XVN 1IRL JU9S 9Y",         answer: "DOMESTICA 50309",            op: "decode",      status: "exact",        note: "Ole Golly" },
  { puzzle: 5,  key: "JB", code: "QLQ1 PO2E WJP1 0PBE WS65",  answer: "CRIMINAL RECORDS 30307",     op: "decode+box",  status: "exact",        box: [5, 4], note: "James Bond; wheel gives CNC3RAO0ILR3MRD0IES7, then read a 5x4 box by columns" },
  { puzzle: 6,  key: "GS", code: "436T R0X1 6TDQ OHFK",       answer: "LONE CHIMNEY 75201",         op: "encode",      status: "exact",        note: "George Smiley; the archive states this one came from encoding, not decoding" },
  { puzzle: 7,  key: "EH", code: "T8OZ B83I HK",              answer: "ABRGS BKLYN",                op: "decode",      status: "exact",        note: "Ethan Hunt" },
  { puzzle: 8,  key: "BG", code: "9M OO 7U QB 5M QO OQ",      answer: "TTM EP LA",                  op: "decode+book", status: "exact",        note: "Benjamin Gates; wheel gives the 14 digits 70225849304224 = seven word numbers" },
  { puzzle: 9,  key: "VK", code: "FU41 C9F6 SQTR S",          answer: "OBLATION 97209",             op: "double",      status: "exact",        twoStageKey: "KS", note: "Verbal Kint then Keyser Söze" },
  { puzzle: 10, key: "06", code: "8RP4 0FIB LP8L",            answer: "LUSH DIVE OSLO",             op: "decode",      status: "exact",        note: "Number 6, The Prisoner" },
  { puzzle: 11, key: "JB", code: "T2PR PK5S W GV LIZ6 ST82",  answer: "VORTEX SOUVENIR 67214",      op: "decode+spiral", status: "permutation", note: "Jason Bourne; wheel gives VORTR67EI2XN41SEVUO — same 19 characters, spiral order unpublished" },
  { puzzle: 12, key: "JS", code: "TOXX 3W5U T9SA 6JXI IJ",    answer: "BAFF LING BREW S1F4 41",     op: "decode",      status: "exact",        note: "Jack Skellington" },
  { puzzle: 13, key: "NS", code: "T5K1 MO29 S17K QOIJ AFH",   answer: "FRANCES VINTAGE 85013",      op: "decode",      status: "exact",        note: "Nakia / Shuri" },
  { puzzle: 14, key: "MB", code: "LT8L PWHE P",               answer: "AIDA E1 6JE",                op: "decode",      status: "exact",        note: "Modesty Blaise; the one non-US answer, a London postcode" },
  { puzzle: 15, key: "BS", code: "EADA 5WEW 4BAH XUXM O",     answer: "SON OF A SAILOR 78702",      op: "decode",      status: "exact",        note: "Sydney Bristow, “reversed”" },
  { puzzle: 16, key: "H9", code: "TC4I OPF7 PQRT RYUN E5GH",  answer: "TWO HANDS PAPERIE 80302",    op: "quartet",     status: "exact",        quartet: [2, 0, 0, 1], note: "HAL 9000, after the documented pre-shift of each four-character group" },
  { puzzle: 17, key: "54", code: "G5XZ GHVG GCKU LWSL",       answer: "OLD FOX BOOKS 21401",        op: "decode",      status: "exact",        note: "LIV, Olivia Pope’s nickname — LIV in Roman numerals is 54" },
  { puzzle: 18, key: "FE", code: "U6FF WWAT CD06 OIOM I",     answer: "COFFEE STUDIO 60640",        op: "decode",      status: "exact",        note: "Iron Man" },
  { puzzle: 19, key: "JB", code: "3STO IDV3 AIDT 7RPM PATF H04N", answer: "DAYTRIP SOCIETY 04046",  op: "collision",   status: "not-reproducible", note: "J.B. Fletcher. The archive prints #20’s code here; under JB the string reads 5EVA4FX5W4FV9TR8RWVHJMQP" },
  { puzzle: 20, key: "IE", code: "3STO IDV3 AIDT 7RPM PATF H04N", answer: "PEACE VALLEY DRY GOODS 83702", op: "collision", status: "not-reproducible", note: "Irwin “Whistler” Emery. Under IE the same string reads OVERLYGODLYESCAPADE02378 — neither answer, and no key in the space gives either" },
  { puzzle: 21, key: null, code: "8EQ7 HPV6 ULVB 6TJS 131F",  answer: "PLAY JACKBOX TWITCH 330",    op: "polyalphabetic", status: "exact",     note: "no notebook; embedded in a Jackbox Twitch stream" },
];

/**
 * Puzzle #21’s finish line, which the archive describes in one sentence: "Key:
 * Each of the previous 20 key, in order, for each of the 20 letters in the
 * code." Twenty letters, twenty keys, one letter each — a polyalphabetic
 * finish line for a cipher that is otherwise monoalphabetic.
 *
 * The rule that actually reproduces the published answer applies each puzzle’s
 * key in that puzzle’s OWN documented operation: #6 encodes, #9 double-decodes,
 * everything else decodes. With all three honoured the reconstruction is exact;
 * with a flat "decode with key i" it is 18 of 20 and looks like a bad key.
 */
export const FIELDNOTES_21 = {
  code: "8EQ7 HPV6 ULVB 6TJS 131F",
  answer: "PLAY JACKBOX TWITCH 330",
  keysInOrder: ["SH","KG","HP","OG","JB","GS","EH","BG","VK","06","JB","JS","NS","MB","BS","H9","54","FE","JB","IE"],
  /** index -> operation, where it is not a plain decode */
  exceptions: {
    5: { op: "encode", because: "puzzle #6 came from encoding, not decoding" },
    8: { op: "double", secondKey: "KS", because: "puzzle #9 was VK then KS, a double decode" },
  },
};

/**
 * Puzzle #8’s book cipher. The wheel turns the published code into fourteen
 * digits; read as seven two-digit numbers they are word positions in the
 * Declaration of Independence, and the first letters spell the answer.
 *
 * The only convention that works counts “Nature’s” as ONE word. Splitting the
 * possessive shifts every later index and yields TTOGPLA instead of TTMEPLA —
 * so the seven letters also date the tokenisation. All seven indices fall
 * inside the first sentence, which is why only that sentence is stored here.
 */
export const DECLARATION_FIRST_SENTENCE =
  "When in the Course of human events, it becomes necessary for one people to dissolve " +
  "the political bands which have connected them with another, and to assume among the " +
  "powers of the earth, the separate and equal station to which the Laws of Nature and " +
  "of Nature's God entitle them, a decent respect to the opinions of mankind requires " +
  "that they should declare the causes which impel them to the separation.";

export const FIELDNOTES_8 = {
  digits: "70225849304224",
  wordNumbers: [70, 22, 58, 49, 30, 42, 24],
  words: ["the", "them", "mankind", "entitle", "powers", "Laws", "another"],
  letters: "TTMEPLA",
  answer: "TTM EP LA",
  expandsTo: "Time Travel Mart, Echo Park, Los Angeles",
  /** the wrong tokenisation, kept so the harness can assert it fails */
  possessiveSplitResult: "TTOGPLA",
};

/**
 * The #19/#20 collision, stated as something the harness can re-prove rather
 * than remember: the archive prints ONE code for two different puzzles with two
 * different keys and two different answers, and no key in the wheel's whole
 * reachable space, in either direction, turns that code into either answer.
 */
export const FIELDNOTES_COLLISION = {
  sharedCode: "3STO IDV3 AIDT 7RPM PATF H04N",
  readings: { IE: "OVERLYGODLYESCAPADE02378", JB: "5EVA4FX5W4FV9TR8RWVHJMQP" },
  answers: ["DAYTRIP SOCIETY 04046", "PEACE VALLEY DRY GOODS 83702"],
  /** 1296 keys x 2 directions x 2 answers x 2 orientations = 10368 attempts */
  attempts: 10368,
  successes: 0,
  verdict: "the code printed for #19 and #20 belongs to neither puzzle",
};

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

/* ------------------------------------------------- keyed Vigenere (F5 2018) */

/**
 * The Keyed Vigenere tableau as rumkin.com implements it — the tool the 2018
 * F5 crossword pointed solvers at ("keyed / vigenere / rumking" in the blue
 * squares).
 *
 * The tableau's alphabet is the *alphabet key* (de-duplicated, then the
 * remaining letters in natural order). Of the six index conventions that look
 * plausible, exactly one reproduces F5's published plaintext; the harness tries
 * all six and asserts the other five fail. The survivor takes BOTH the
 * ciphertext position and the passphrase position in the keyed alphabet.
 *
 * @param {string} alphabetKey the 26-letter keyed alphabet
 * @returns {{keyed: string, encrypt: (s:string)=>string, decrypt: (s:string)=>string}}
 */
export function keyedVigenere(alphabetKey) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const seen = new Set();
  const keyed = [];
  for (const c of alphabetKey.toUpperCase().replace(/[^A-Z]/g, "") + A) {
    if (seen.has(c)) continue;
    seen.add(c);
    keyed.push(c);
  }
  const KA = keyed.join("");
  const step = (s, sign) =>
    [...s.toUpperCase().replace(/[^A-Z]/g, "")]
      .map((c, i) => {
        const k = KA[i % KA.length];
        return KA[((KA.indexOf(c) + sign * KA.indexOf(k)) % 26 + 26) % 26];
      })
      .join("");
  return {
    keyed: KA,
    passphrase: null,
    /** @param {string} s plaintext @param {string} pass repeating passphrase */
    encryptWith(s, pass) {
      const P = pass.toUpperCase().replace(/[^A-Z]/g, "");
      return [...s.toUpperCase().replace(/[^A-Z]/g, "")]
        .map((c, i) => KA[((KA.indexOf(c) + KA.indexOf(P[i % P.length])) % 26 + 26) % 26])
        .join("");
    },
    decryptWith(s, pass) {
      const P = pass.toUpperCase().replace(/[^A-Z]/g, "");
      return [...s.toUpperCase().replace(/[^A-Z]/g, "")]
        .map((c, i) => KA[((KA.indexOf(c) - KA.indexOf(P[i % P.length])) % 26 + 26) % 26])
        .join("");
    },
    decrypt: step,
    encrypt: (s) => step(s, 1),
  };
}

/**
 * The 2018 edition of F5's booth puzzle, reconstructed from the only public
 * writeup (Eviatar Gerzi, 14 Sep 2018) and re-derived here.
 *
 * The chain the shirt and the card built between them:
 *   crossword blue squares  -> "keyed / vigenere / rumking" -> the tool to use
 *   crossword red squares   -> "truths / return / zero"      -> the passphrase
 *   shirt front             -> flag-semaphore robots spelling "F5" (the method)
 *   shirt back              -> moons carrying clock-face flag angles -> letters
 *   planet/moon distances   -> the order those letters arrive on Earth
 */
export const F5_2018 = {
  /** per-planet key letters, in the order the shirt's planets sit from Earth */
  byPlanet: [
    { planet: "Earth", moons: ["Luna"], keys: "G" },
    { planet: "Mars", moons: ["Phobos", "Deimos"], keys: "DP" },
    { planet: "Jupiter", moons: ["Io", "Europa", "Ganymede", "Callisto"], keys: "QWLZ" },
    { planet: "Saturn", moons: ["Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan"], keys: "IHMSON" },
    { planet: "Uranus", moons: ["Ariel", "Umbriel", "Titania", "Oberon", "Miranda"], keys: "AKFYX" },
    { planet: "Neptune", moons: ["Triton", "Nereid", "Proteus"], keys: "TVJ" },
    { planet: "Pluto", moons: ["Charon", "Nix", "Hydra", "Kerberos", "Styx"], keys: "RBCEU" },
  ],
  alphabetKey: "GDPQWLZIHMSONAKFYXTVJRBCEU",
  passphrase: "truthsreturnzero",
  ciphertext: "WVBYTJPYHGPBHBIRYAIBFPQUYBZILI",
  plaintext: "NECESSITY DISPENSETH WITH DECORUM",
  attribution: "Thomas Carlyle",
  /** the card's bonus question, per the same writeup */
  bonus: { question: "which planet receives all the decryption keys first", answer: "Saturn" },
  writeup: "https://eviatargerzi.medium.com/solving-f5s-puzzle-on-black-hat-usa-2018-c991e6134886",
};

/* -------------------------------------------------- box / columnar reading */

/**
 * The "box cipher" f1eldn0tes puzzle #5 needed after the wheel: lay the string
 * out row-major in a rows x cols box, then read it off column by column, left
 * to right. The blog calls it "stacked 4x5"; the geometry that actually
 * reproduces the published answer is 5 rows of 4, so the blog's "4x5" means
 * 4 wide by 5 tall. Both readings are asserted by the harness.
 */
export function boxCipher(text, rows, cols) {
  const t = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const grid = [];
  for (let r = 0; r < rows; r++) grid.push([...t.slice(r * cols, (r + 1) * cols)]);
  let out = "";
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) out += grid[r][c] ?? "";
  return out;
}

/* ------------------------------------------------- OpenPGP issuer key ID */

/**
 * Pull the issuer key ID out of an ASCII-armoured OpenPGP signature without a
 * keyserver, without GnuPG and without trusting anyone's transcription.
 *
 * An issuer subpacket is type 0x10 and carries exactly 8 bytes: the signer's
 * long key ID. Cicada 3301 named its key ID in prose ("Key ID 7A35090F"); this
 * reads the same number out of the signature blob itself, which is the only
 * place it is not a claim.
 *
 * @param {string} armoured the base64 body of a -----BEGIN PGP SIGNATURE----- block
 * @returns {{longKeyId: string, shortKeyId: string, offset: number}|null}
 */
export function openpgpIssuer(armoured) {
  const b64 = armoured.replace(/[^A-Za-z0-9+/=]/g, "");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atobLike(b64 + pad);
  // walk: subpacket length is 1, 2, 3 or 5 bytes; type 0x10 = issuer, 0x21 = issuer fingerprint
  for (let i = 0; i + 3 < bin.length; i++) {
    if (bin[i] === 0x10 && i + 9 <= bin.length) {
      const id = [...bin.slice(i + 1, i + 9)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      if (/^[0-9A-F]{16}$/.test(id)) return { longKeyId: id, shortKeyId: id.slice(8), offset: i - 1 };
    }
  }
  return null;
}

/** Minimal base64 -> byte array, so this module stays dependency-free in node and browser. */
function atobLike(s) {
  const T = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const out = [];
  let buf = 0;
  let bits = 0;
  for (const ch of s) {
    if (ch === "=") break;
    const v = T.indexOf(ch);
    if (v < 0) continue;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return out;
}

/**
 * Cicada 3301 — the material this hall can actually check.
 *
 * The point of the record is not the legend but the verification discipline
 * Cicada forced on its solvers: every clue signed with one OpenPGP key, and an
 * explicit instruction to distrust anything that was not. That discipline is
 * reproducible offline, from the published signature bytes, and it is
 * reproduced here.
 */
export const CICADA3301 = {
  /** the key ID Cicada names in its own Welcome text */
  keyId: "7A35090F",
  /** the full v4 fingerprint as printed by gpg --verify */
  fingerprint: "6D85 4CD7 9333 22A6 01C3 286D 181F 01E5 7A35 090F",
  /** the uid gpg reports, with the community's own tracker number in it */
  uid: "Cicada 3301 (845145127)",
  /** gpg's caveat, quoted because it is the whole lesson */
  gpgWarning: "WARNING: This key is not certified with a trusted signature!",
  /**
   * The OutGuess payload of the 2012 welcome image, verbatim. Its middle line
   * is the only place Cicada ever says where the key lives.
   */
  welcomeText:
    "- From here on out, we will cryptographically sign all messages with this key.\n" +
    "It is available on the mit keyservers.  Key ID 7A35090F, as posted in a2e7j6ic78h0j.\n" +
    "Patience is a virtue.\nGood luck.\n\n3301",
  imgurAlbum: "a2e7j6ic78h0j",
  /** the signature block that follows it — first line is enough to carry the issuer subpacket */
  welcomeSignatureB64:
    "iQIcBAEBAgAGBQJPBRz7AAoJEBgfAeV6NQkP1UIQALFcO8DyZkecTK5pAIcGez7k",
  /**
   * The keyserver claim, source-checked on 2026-09-20.
   * Cicada wrote "the mit keyservers" and named no host, so every hostname
   * below is this repository's check, not Cicada's assertion.
   */
  keyservers: {
    claimedByCicada: "the mit keyservers",
    resolves: [
      { host: "pgp.mit.edu", address: "18.9.60.141", note: "the MIT keyserver solvers were pointed at" },
      { host: "cryptonomicon.mit.edu", address: "18.9.60.141", note: "the canonical name pgp.mit.edu CNAMEs to; the same address" },
    ],
    doesNotResolve: [
      {
        host: "cryptomomicon.mit.edu",
        error: "getaddrinfo ENOTFOUND (gaierror -2, Name or service not known)",
        note: "one letter from cryptonomicon — an n becomes an m. It has never been in DNS.",
      },
    ],
  },
  /** the RSA sub-puzzle, published with the claim that it was deliberately weak */
  rsa: {
    module: "Crypt::RSA::ES::OAEP",
    version: "1.99",
    e: 65537,
    n: "7467492769579356967270197440403790283193525917787433197231759008957255433116469460882489015469125000179524189783",
    cicadasClaim: "Note that it has a low bit modulus and is therefore breakable",
    attemptedHere: ["trial division to 97", "Fermat (2e6)", "Pollard rho (2.4e7)", "Pollard p-1 (B1=1e6)"],
    factoredHere: false,
  },
  /** chronology, each item sourced in the record's sourceLinks */
  timeline: [
    { date: "2012-01-04", event: "first puzzle posted to 4chan; ran nearly a month" },
    { date: "2013-01-04", event: "second round begins; first puzzle solved by Marcus Wanner" },
    { date: "2014-01-04", event: "third round posted on Twitter — the Liber Primus, still unsolved" },
    { date: "2015-07", event: "an unrelated group calling itself “3301” intrudes on Planned Parenthood; Cicada signs a denial" },
    { date: "2016-01-05", event: "“The path lies empty; epiphany seeks the devoted. … Beware false paths. Verify OpenPGP 7A35090F.”" },
    { date: "2017-04", event: "last verified signed message; its Version line reads “CicadaPG v.3301”, which no GnuPG ever printed" },
  ],
  numbers: { threeThreeOhOneIsPrime: true, eIsFermatPrimeF4: true, broodCycles: [13, 17] },
};

/**
 * The U.S. Army Institute of Heraldry's official blazon for the USCYBERCOM
 * seal — the primary source that closes the "does the seal still carry it"
 * thread. Quoted because it repeats, in the command's own heraldic record, the
 * error the record exists to correct: an MD5 digest does not encrypt anything.
 */
export const USCYBERCOM_HERALDRY = {
  authority: "The Institute of Heraldry (tioh.army.mil), HeraldryId 16683",
  blazonExcerpt:
    "Within the blue disk is a golden circle laid with MD5 hash that ties the command back to the early days of computer networking; USCYBERCOM's mission statement is encrypted within this code",
  /** the seal survived the command's elevation to a unified combatant command */
  elevatedToUnifiedCombatantCommand: "May 2018",
  theErrorInTheBlazon: "“encrypted within this code” — MD5 is a one-way digest; nothing is encrypted or decryptable",
};
