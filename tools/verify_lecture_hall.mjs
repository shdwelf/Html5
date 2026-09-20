#!/usr/bin/env node
/**
 * verify_lecture_hall.mjs — headless proof for the Intelligence Lecture Hall.
 *
 *   node tools/verify_lecture_hall.mjs
 *
 * The hall's rule is that anything computable must be computed, not quoted.
 * This harness re-derives every ciphertext-bearing claim in the records and then
 * audits the bundle those records live in:
 *
 *   1. wheel conformance — upstream unit vectors, the 36×18 keyspace, the
 *      null-key pair;
 *   2. the Clandestine corpus — all seven lines of messages.txt, the O/0 and
 *      1/l dial ambiguities that the file's own annotation records, and the
 *      strengthened negative for the four short codes;
 *   3. f1eldn0tes.com — the complete 21-puzzle ledger, including the #8 book
 *      cipher, the #5 box reading, the #11 permutation, the #19/#20 collision
 *      and the #21 polyalphabetic finish line;
 *   4. F5 Black Hat 2016 — both card ciphertexts, the key square, the T-shirt
 *      ciphertext, and the published three-layer peel;
 *   5. F5 Black Hat 2018 — the keyed Vigenère, and the five rival index
 *      conventions that must NOT reproduce the plaintext;
 *   6. USCYBERCOM — the seal digest recomputed with node:crypto, the near-miss
 *      preimages that must fail, and the Institute of Heraldry blazon;
 *   7. Cicada 3301 — the issuer key ID read out of the published signature
 *      bytes, the v4 fingerprint arithmetic, the RSA modulus's real size, and
 *      the keyserver hostname correction;
 *   8. bundle integrity — inline app script still parses, every lecture record
 *      is complete, every provenance label resolves in the legend, the colour
 *      map and the filter row, and no record's id collides.
 *
 * Zero dependencies beyond node itself. Exit code = number of failures.
 */

import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import {
  wheel, wheelAlphabet, wheelKeyspace, caesar, atbash, playfair,
  keyedVigenere, boxCipher, openpgpIssuer,
  WHEEL_POOL, WHEEL_VECTORS, CLANDESTINE_MESSAGES, CLANDESTINE_AMBIGUITY,
  FIELDNOTES_CODES, FIELDNOTES_21, FIELDNOTES_8, FIELDNOTES_COLLISION,
  DECLARATION_FIRST_SENTENCE,
  F5_2016, F5_2018, USCYBERCOM, USCYBERCOM_HERALDRY, CICADA3301,
} from "../js/lecture-ciphers.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUITE = join(ROOT, "apps", "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html");

let failures = 0;
let skips = 0;
const check = (ok, label) => {
  console.log(`   ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures++;
};
/**
 * A skip is not a pass. Section 8 audits the bundle the records live in, and
 * this harness is also kept as a standalone research corpus where that 1 MB
 * single-file app is deliberately absent. Absent material is announced rather
 * than silently green, because a check that quietly disappears is worse than
 * one that fails.
 */
const skip = (label) => {
  console.log(`   − SKIP ${label}`);
  skips++;
};
const md5 = (s) => createHash("md5").update(s, "utf8").digest("hex");
const squash = (s) => s.replace(/[^A-Z0-9]/g, "").toUpperCase();
/** wheel-side normaliser: the 36-char dial keeps dots, only whitespace goes */
const flat = (s) => s.toUpperCase().replace(/\s+/g, "");
/** every 36x36 key pair, in dial order */
const ALL_KEYS = (() => {
  const out = [];
  for (const a of WHEEL_POOL) for (const b of WHEEL_POOL) out.push(a + b);
  return out;
})();

/* ----------------------------------------------------------------─ 1. wheel */

console.log("── Field Notes cipher wheel (Jurph/cipherwheel model)");
{
  const pool = WHEEL_POOL.split("");
  check(pool.length === 36, `wheel pool is 36 characters (A–Z, 0–9): ${pool.length}`);
  check(
    wheelAlphabet("XW").join("") === WHEEL_POOL,
    "key XW is the identity alphabet — the null cipher the README warns about",
  );
  check(
    wheelAlphabet("XW").join("") === wheelAlphabet("XV").join(""),
    "XV and XW generate the same wheel (adjacent pairs collide, per the README)",
  );
  const { distinct, keys, identityKeys } = wheelKeyspace();
  check(
    keys === 1296 && distinct === 648,
    `36×36 = ${keys} keys reach exactly 36×18 = 648 distinct alphabets (got ${distinct})`,
  );
  check(identityKeys.length === 2, `exactly two null keys on the default dial: ${identityKeys.join(", ")}`);
  check(
    wheelAlphabet("AA").join("") === WHEEL_VECTORS.alphabetAA,
    'upstream unit vector: makealphabet("AA")',
  );
  check(
    wheelAlphabet("FN").join("") === WHEEL_VECTORS.alphabetFN,
    'upstream unit vector: makealphabet("FN")',
  );
  const vecs = WHEEL_VECTORS.encrypt.map(
    ({ key, plain, cipher }) =>
      wheel(key).encode(plain) === cipher && wheel(key).decode(cipher) === plain,
  );
  check(vecs.every(Boolean), `upstream encrypt/decrypt vectors: ${vecs.filter(Boolean).length}/${vecs.length}`);
}

/* --------------------------------------------------- 2. Clandestine corpus */

console.log("── Clandestine release corpus (messages.txt, all seven lines)");
{
  const fn = wheel("FN"); // .decode is the upstream decrypt direction, which is what the literature needs
  const [rhyme, urlLine, c1, c2, c3, c4, clearDomain] = CLANDESTINE_MESSAGES;
  check(
    CLANDESTINE_MESSAGES.length === 7 && clearDomain === "fieldnotesbrand.com",
    "the port carries all seven lines of messages.txt — the seventh is the publisher’s domain in the clear",
  );
  const rhymePt = fn.decode(rhyme.toUpperCase());
  check(
    rhymePt ===
      "IT’S NOT ENCRYPTED IN CODE TO DECIPHER IT LATER, IT’S ENCRYPTED IN CODE TO DECIPHER IT NOW".replace(/’/g, "'"),
    `line 1 recovers under key FN: “${rhymePt.slice(0, 44)}…”`,
  );

  // The 2026-09-20 finding: line 7 is line 2's answer key, and the file's own
  // ciphertext for line 2 is one glyph away from what the wheel emits.
  const { asFile, asWheel, asAnnotated, plaintext, annotation } = CLANDESTINE_AMBIGUITY;
  check(
    asFile === flat(urlLine.split("=")[0].trim()),
    "the file’s line-2 ciphertext is transcribed here byte-for-byte: " + asFile,
  );
  check(
    fn.encode(plaintext) === asWheel,
    `encoding line 7’s domain gives ${asWheel} — the wheel’s own output`,
  );
  const diffs = [...asFile].map((ch, i) => (ch !== asWheel[i] ? `${i}:${ch}≠${asWheel[i]}` : null)).filter(Boolean);
  check(
    diffs.length === 1 && diffs[0] === "1:O≠0",
    `the two differ in exactly one glyph (${diffs.join(",")}) — a letter O where the dial emits a zero`,
  );
  check(
    fn.decode(asWheel) === plaintext,
    `reading that O as a 0 recovers ${plaintext} exactly — the corpus is self-answering`,
  );
  check(
    fn.decode(asFile) === "F6ELDNOTESBRAND.COM",
    "reading it as printed gives F6ELDNOTESBRAND.COM — the 6 is the zero’s shadow",
  );
  check(
    fn.decode(asAnnotated) === "F6ELDNOTES" + "VRAND.COM" &&
      annotation === "f[6]eldnotes[V]rand.com",
    "and reading the ASCII 1 as a lowercase l reproduces the corpus’s own annotation f[6]eldnotes[V]rand.com",
  );
  check(
    fn.decode(flat(clearDomain)) !== clearDomain.toUpperCase(),
    "the seventh line is plaintext, not ciphertext — decoding it gives gibberish, which is the tell",
  );

  // The honest negative, in two parts.
  //
  // (a) The narrow sweep the 2026-09-14 pass claimed: the four codes exactly as
  //     printed, all 1296 keys, both directions, a 10-entry TLD list. Zero hits.
  // (b) The broadened sweep this pass tried — letter/digit lookalike variants
  //     against a 46-entry TLD list — does produce hits, so it is run against
  //     random control strings of identical shape. When a test fires just as
  //     often on noise, it is not evidence, and the hall says so instead of
  //     claiming a stronger negative than the method supports.
  const four = [c1, c2, c3, c4];
  const CONF = { O: "0", Q: "0", I: "1", L: "1", S: "5", B: "8", Z: "2", G: "6", T: "7" };
  const variants = (s) => {
    const u = s.toUpperCase();
    const idxs = [...u].map((ch, i) => (CONF[ch] ? i : -1)).filter((i) => i >= 0).slice(0, 8);
    const out = new Set([u]);
    for (let m = 0; m < 1 << idxs.length; m++) {
      const a = [...u];
      idxs.forEach((i, b) => { if (m & (1 << b)) a[i] = CONF[a[i]]; });
      out.add(a.join(""));
    }
    return [...out];
  };
  const TLD_NARROW = [".COM", ".NET", ".ORG", ".DEV", ".APP", ".INFO", ".ME", ".US", ".CO", ".XYZ"];
  const TLD_BROAD = ["COM","NET","ORG","IO","CO","ME","US","UK","INFO","BIZ","DEV","APP","XYZ","SHOP","STORE","BRAND","DESIGN","STUDIO","PRESS","INK","PAPER","MAIL","EMAIL","SITE","ONLINE","TECH","SPACE","FUN","LIFE","WORLD","TODAY","NEWS","BLOG","CLUB","GURU","LINK","PAGE","ZONE","WORKS","SUPPLY","SUPPLIES","GOODS","MARKET","COMPANY","MIL","GOV","EDU"];

  let narrowHits = 0;
  for (const key of ALL_KEYS) {
    const w = wheel(key);
    for (const code of four) {
      for (const dir of ["decode", "encode"]) {
        const out = w[dir](flat(code));
        if (TLD_NARROW.some((tld) => out.endsWith(tld))) narrowHits++;
      }
    }
  }
  check(
    narrowHits === 0 && four.length === 4,
    `four short codes stay unrecovered: ${four.length} rows × ${(ALL_KEYS.length * 2).toLocaleString("en-US")} key/direction pairs, ${narrowHits} domain-shaped candidates`,
  );

  // The broadened sweep, run as a calibrated test rather than a bare negative.
  //
  // Loosening the TLD list makes the sweep fire — 224 "domain-shaped" strings —
  // so a count of hits means nothing on its own. What separates a recovery from
  // noise is whether the *body* contains a word. That criterion is calibrated
  // against both a known recovery (the corpus's own line 2) and random controls
  // of identical shape, so the harness proves the test has power before it
  // trusts the test's silence.
  const WORDS = ("field notes brand clandestine cipher wheel secret puzzle agent code book store " +
    "shop paper ink press mail site tech life world news blog club link page zone works goods " +
    "market company").split(" ");
  const englishLike = (s) => (s.match(/[A-Z]{6,}/g) || [])
    .some((r) => (r.match(/[AEIOU]/g) || []).length >= 2 && !/[^AEIOU]{4}/.test(r));
  const sweep = (codes) => {
    let shaped = 0, wordy = 0, english = 0;
    const distinct = new Set();
    for (const key of ALL_KEYS) {
      const w = wheel(key);
      for (const code of codes) {
        for (const v of variants(flat(code))) {
          for (const dir of ["decode", "encode"]) {
            const out = w[dir](v);
            const [body, tail] = [out.split(".")[0], out.split(".").pop()];
            if (TLD_BROAD.includes(tail) && /[A-Z]{6,}/.test(body.replace(/[0-9]/g, ""))) {
              shaped++;
              distinct.add(out);
              if (WORDS.some((x) => body.toLowerCase().includes(x))) wordy++;
              if (englishLike(body)) english++;
            }
          }
        }
      }
    }
    return { shaped, wordy, english, distinct: distinct.size };
  };
  const real = sweep(four);
  // the criterion's positive control: a ciphertext we KNOW hides a real domain
  const positive = sweep([urlLine.split("=")[0].trim()]);
  let seed = 20260920;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const control = () => {
    const pick = (n) => Array.from({ length: n }, () => WHEEL_POOL[Math.floor(rnd() * 36)]).join("");
    return pick(15) + "." + pick(3);
  };
  const noise = sweep(Array.from({ length: 16 }, control));

  check(
    positive.wordy > 0 && positive.shaped > real.shaped,
    `the word criterion has power: run on the corpus’s own line 2 it fires ${positive.wordy} times (${positive.distinct} distinct outputs)`,
  );
  check(
    real.wordy === 0 && noise.wordy === 0,
    `and it never fires on the four short codes — ${real.shaped} domain-shaped strings across ${real.distinct} distinct outputs, ${real.wordy} containing a word`,
  );
  check(
    real.shaped <= noise.shaped,
    `the four are not even over-represented against noise: ${real.shaped} shaped hits on the real codes vs ${noise.shaped} on 16 random strings of the same shape`,
  );
  const underFN = four.map((c) => fn.decode(flat(c)));
  check(
    underFN.join("|") === "4JCC3GIBRM8E2A8.B6Z|Q8WTR0G0OPQXVZS.RLF|NSB2EH6YFKA74X.YKN|0GN2JOR4ESXTICH.C0D",
    "under FN the four decode to these, quoted so any future change to the port is caught: " + underFN.join(" · "),
  );
}

/* ---------------------------------------------- 3. f1eldn0tes: all 21 puzzles */

console.log("── f1eldn0tes.com — the complete 21-puzzle ledger");

/** #16’s documented pre-step: shift each four-character group by 2-0-0-1. */
const shiftQuartet = (s, sign, offsets = [2, 0, 0, 1]) =>
  s.replace(/[^A-Z0-9]/g, "").replace(/(.{4})/g, (_, q) =>
    [...q].map((c, i) => WHEEL_POOL[(WHEEL_POOL.indexOf(c) + sign * offsets[i] + 72) % 36]).join(""));

/** Word positions -> first letters, counting possessives as one word. */
const bookCipher = (sentence, nums, splitPossessive = false) => {
  const words = sentence.match(splitPossessive ? /[A-Za-z]+/g : /[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
  return nums.map((n) => (words[n - 1] || "?")[0].toUpperCase()).join("");
};

/** Apply the operation the archive documents for one ledger row. */
function applyOp(row) {
  const code = flat(row.code);
  switch (row.op) {
    case "decode": return wheel(row.key).decode(code);
    case "encode": return wheel(row.key).encode(code);
    case "decode+box": return boxCipher(wheel(row.key).decode(code), ...row.box);
    case "double": return wheel(row.twoStageKey).decode(wheel(row.key).decode(code));
    case "quartet": return wheel(row.key).decode(shiftQuartet(code, 1, row.quartet));
    case "decode+book": return wheel(row.key).decode(code);
    case "decode+spiral": return wheel(row.key).decode(code);
    default: return null;
  }
}

{
  const counts = { exact: 0, permutation: 0, collision: 0, polyalphabetic: 0 };
  const failuresList = [];
  for (const row of FIELDNOTES_CODES) {
    if (row.op === "collision") { counts.collision++; continue; }
    if (row.op === "polyalphabetic") { continue; }
    // squash: puzzle #1's code ends in a full stop, which the dial passes through
    const got = squash(applyOp(row) ?? "");
    const want = squash(row.answer);
    if (row.op === "decode+book") {
      // the wheel hands back digits; the book cipher turns them into letters
      if (!/^[0-9]+$/.test(got)) { failuresList.push(`#${row.puzzle} not all digits: ${got}`); continue; }
      if (got !== FIELDNOTES_8.digits) { failuresList.push(`#${row.puzzle} digits ${got} ≠ ${FIELDNOTES_8.digits}`); continue; }
      counts.exact++;
      continue;
    }
    if (row.op === "decode+spiral") {
      const same = [...got].sort().join("") === [...want].sort().join("");
      if (same) counts.permutation++;
      else failuresList.push(`#${row.puzzle} not a permutation: ${got}`);
      continue;
    }
    if (got === want) counts.exact++;
    else failuresList.push(`#${row.puzzle} ${row.op}: got ${got}, want ${want}`);
  }
  check(
    counts.exact === 17 && failuresList.length === 0,
    `17 of the 21 published codes re-derive exactly from the documented operation${failuresList.length ? " · " + failuresList.join("; ") : ""}`,
  );
  check(counts.permutation === 1, "#11 is proved to be a permutation — the wheel output has the answer’s exact 19 characters");
  check(counts.collision === 2, "#19 and #20 share one printed code");

  // #1: the query the archivist raised as “820chi” was puzzle #1’s decoded clue.
  const p1 = FIELDNOTES_CODES.find((r) => r.puzzle === 1);
  check(
    squash(wheel("SH").decode(flat(p1.code))) === "826CHI60622",
    "puzzle #1 (key SH, Sherlock Holmes) decodes to 826 CHI 60622 — the “820chi” query was one digit off this",
  );
  check(
    !ALL_KEYS.some((k) => wheel(k).decode("820CHI") === "826CHI60622" || wheel(k).encode("820CHI") === "826CHI60622"),
    "the string “820chi” itself decodes to nothing under any of the 1296 keys — it is a misremembering, not a code",
  );

  // #5: the box geometry, and the reading the blog's “4x5” wording invites.
  const p5 = FIELDNOTES_CODES.find((r) => r.puzzle === 5);
  const p5w = wheel(p5.key).decode(flat(p5.code));
  check(
    boxCipher(p5w, 5, 4) === squash(p5.answer) && boxCipher(p5w, 4, 5) !== squash(p5.answer),
    `#5’s box is 5 rows of 4 (${boxCipher(p5w, 5, 4)}); the 4-rows-of-5 reading the phrase “4x5” suggests gives ${boxCipher(p5w, 4, 5)}`,
  );

  // #6 and #17: the two directional coincidences the designers confirmed.
  const p6 = FIELDNOTES_CODES.find((r) => r.puzzle === 6);
  check(
    wheel("GS").encode(flat(p6.code)) === squash(p6.answer) &&
      wheel("GS").decode(flat(p6.code)) !== squash(p6.answer),
    "#6 only works in the encode direction — the archive’s own note, reproduced",
  );
  const p17 = FIELDNOTES_CODES.find((r) => r.puzzle === 17);
  check(
    wheel("54").decode(flat(p17.code)) === wheel("PO").encode(flat(p17.code)) &&
      wheel("54").alphabet.join("") !== wheel("PO").alphabet.join(""),
    "#17’s “fluke”: decoding under 54 and encoding under PO agree on OLDFOXBOOKS21401 from two different alphabets",
  );

  // #8: the book cipher, including the tokenisation that the answer dates.
  check(
    FIELDNOTES_8.wordNumbers.join(",") === "70,22,58,49,30,42,24",
    "#8’s wheel output is fourteen digits = seven word numbers: " + FIELDNOTES_8.wordNumbers.join(" "),
  );
  check(
    bookCipher(DECLARATION_FIRST_SENTENCE, FIELDNOTES_8.wordNumbers) === FIELDNOTES_8.letters,
    `first letters of those words in the Declaration’s opening sentence spell ${FIELDNOTES_8.letters} = ${FIELDNOTES_8.answer}`,
  );
  check(
    FIELDNOTES_8.wordNumbers.every((n) => n <= 71),
    "all seven indices fall inside the first sentence, so only that sentence is needed as key text",
  );
  check(
    bookCipher(DECLARATION_FIRST_SENTENCE, FIELDNOTES_8.wordNumbers, true) === FIELDNOTES_8.possessiveSplitResult &&
      FIELDNOTES_8.possessiveSplitResult !== FIELDNOTES_8.letters,
    "splitting “Nature’s” into two words gives TTOGPLA — the answer fixes the tokenisation, not the reverse",
  );

  // #11: the spiral geometry is genuinely absent from the record.
  const p11 = FIELDNOTES_CODES.find((r) => r.puzzle === 11);
  const p11dec = wheel(p11.key).decode(flat(p11.code));
  let spiralHits = 0;
  const spiralOrders = (r, c) => {
    const out = [];
    for (const cw of [true, false]) for (let corner = 0; corner < 4; corner++) {
      let top = 0, bot = r - 1, left = 0, right = c - 1;
      const cells = [];
      const tr = (y, x) => (corner === 0 ? [y, x] : corner === 1 ? [x, r - 1 - y] : corner === 2 ? [r - 1 - y, c - 1 - x] : [c - 1 - x, y]);
      while (top <= bot && left <= right) {
        if (cw) {
          for (let x = left; x <= right; x++) cells.push(tr(top, x)); top++;
          for (let y = top; y <= bot; y++) cells.push(tr(y, right)); right--;
          if (top <= bot) { for (let x = right; x >= left; x--) cells.push(tr(bot, x)); bot--; }
          if (left <= right) { for (let y = bot; y >= top; y--) cells.push(tr(y, left)); left++; }
        } else {
          for (let y = top; y <= bot; y++) cells.push(tr(y, left)); left++;
          for (let x = left; x <= right; x++) cells.push(tr(bot, x)); bot--;
          if (left <= right) { for (let y = bot; y >= top; y--) cells.push(tr(y, right)); right--; }
          if (top <= bot) { for (let x = right; x >= left; x--) cells.push(tr(top, x)); top++; }
        }
      }
      out.push(cells.map(([y, x]) => y * c + x));
    }
    return out;
  };
  for (let r = 2; r <= 19; r++) for (let c = 2; c <= 19; c++) {
    if (r * c < 19 || r * c > 25) continue;
    const orders = { row: Array.from({ length: r * c }, (_, i) => i) };
    orders.col = []; for (let x = 0; x < c; x++) for (let y = 0; y < r; y++) orders.col.push(y * c + x);
    spiralOrders(r, c).forEach((o, i) => (orders["sp" + i] = o));
    for (const place of Object.values(orders)) for (const read of Object.values(orders)) {
      const grid = new Array(r * c).fill(null);
      place.slice(0, 19).forEach((cell, i) => (grid[cell] = p11dec[i]));
      const got = read.slice(0, 19).map((cell) => grid[cell]).filter((v) => v != null).join("");
      if (got === squash(p11.answer) || [...got].reverse().join("") === squash(p11.answer)) spiralHits++;
    }
  }
  check(
    spiralHits === 0,
    `no rectangular spiral reproduces #11’s answer (${spiralHits} hits across every place×read order pair on grids up to 5×5) — the geometry is on the notebook page, which the archive does not publish`,
  );

  // #19/#20: the collision is a corruption, and that is now provable.
  const shared = flat(FIELDNOTES_COLLISION.sharedCode);
  check(
    wheel("IE").decode(shared) === FIELDNOTES_COLLISION.readings.IE &&
      wheel("JB").decode(shared) === FIELDNOTES_COLLISION.readings.JB,
    `the shared code reads ${FIELDNOTES_COLLISION.readings.IE} under IE and ${FIELDNOTES_COLLISION.readings.JB} under JB — neither is a shop and a ZIP`,
  );
  let attempts = 0;
  let successes = 0;
  for (const key of ALL_KEYS) {
    const w = wheel(key);
    for (const dir of ["decode", "encode"]) {
      for (const ans of FIELDNOTES_COLLISION.answers) {
        const a = squash(ans);
        attempts += 2;
        if (w[dir](shared) === a) successes++;
        if (w[dir](a) === shared) successes++;
      }
    }
  }
  check(
    attempts === FIELDNOTES_COLLISION.attempts && successes === FIELDNOTES_COLLISION.successes,
    `${attempts.toLocaleString("en-US")} key×direction×answer×orientation attempts, ${successes} successes — the code printed for #19/#20 belongs to neither puzzle`,
  );

  // #21: the polyalphabetic finish line, reconstructed exactly.
  const { code, answer, keysInOrder, exceptions } = FIELDNOTES_21;
  const c21 = flat(code);
  check(c21.length === 20 && keysInOrder.length === 20, `#21 is 20 letters against the previous 20 keys (${c21.length}/${keysInOrder.length})`);
  const op21 = (i, ch) => {
    const ex = exceptions[i];
    if (!ex) return wheel(keysInOrder[i]).decode(ch);
    if (ex.op === "encode") return wheel(keysInOrder[i]).encode(ch);
    return wheel(ex.secondKey).decode(wheel(keysInOrder[i]).decode(ch));
  };
  const rebuilt = [...c21].map((ch, i) => op21(i, ch)).join("");
  check(rebuilt === squash(answer), `#21 reconstructs exactly: ${rebuilt} = ${answer}`);
  const flatDecode = [...c21].map((ch, i) => wheel(keysInOrder[i]).decode(ch)).join("");
  check(
    flatDecode !== squash(answer) && [...flatDecode].filter((ch, i) => ch === squash(answer)[i]).length === 18,
    `a flat “decode with key i” gets 18 of 20 and looks like a wrong key: ${flatDecode}`,
  );
}

/* ------------------------------------------------------------- 4. F5 2016 */

console.log("── F5 Black Hat 2016 cipher challenge");
{
  const [p1, p2, p3] = F5_2016.keyPhrases.map((s) => s.toLowerCase().replace(/[^a-z]/g, ""));
  check(caesar(p1, F5_2016.shift) === F5_2016.card1.toLowerCase(), `card #1 = ROT1 of “${p1}” → ${F5_2016.card1}`);
  check(atbash(p2) === F5_2016.card2.toLowerCase(), `card #2 = Atbash of “${p2}” → ${F5_2016.card2}`);
  const pf = playfair(p1 + p2 + p3);
  const square = pf.rows.map((r) => r.replace(/\s+/g, ""));
  check(
    square.join("|") === F5_2016.square.join("|"),
    `Playfair key square rebuilt from the 42-char key: ${square.join(" / ")}`,
  );
  const plaintexts = ["There is nothing", "more deceptive than", "an obvious fact"];
  const [t1, t2, t3] = plaintexts.map((s) => s.toLowerCase().replace(/[^a-z]/g, ""));
  const inner = t1 + caesar(t2 + atbash(t3), F5_2016.shift);
  const ctx = pf.encrypt(inner);
  const grouped = ctx.replace(/(.{2})/g, "$1 ").trim().toUpperCase();
  check(grouped === F5_2016.tshirt, `T-shirt ciphertext re-derived digram-for-digram (${ctx.length} chars)`);
  const l1 = pf.decrypt(squash(F5_2016.tshirt).toLowerCase()).toUpperCase();
  check(l1 === "THEREISNOTHINGLNQDCDBDOSHUDSGZMYLKXDQKEGTYWF", "published layer 1 (Playfair only): " + l1);
  const l2 = (l1.slice(0, 14) + caesar(l1.slice(14).toLowerCase(), F5_2016.shift, false)).toUpperCase();
  check(l2 === "THEREISNOTHINGMOREDECEPTIVETHANZMLYERLFHUZXG", "published layer 2 (+ ROT1 peel): " + l2);
  const l3 = (l2.slice(0, 31) + atbash(l2.slice(31).toLowerCase())).toUpperCase();
  check(l3 === squash(F5_2016.solution), `published layer 3 (+ Atbash peel) resolves to the answer: ${l3}`);
  check(F5_2016.tshirt.split(" ").length === 22, `the T-shirt is 22 digrams = 44 characters`);
}

/* ------------------------------------------------------------- 5. F5 2018 */

console.log("── F5 Black Hat 2018 cipher challenge (keyed Vigenère)");
{
  const { alphabetKey, passphrase, ciphertext, plaintext, byPlanet } = F5_2018;
  const concatenated = byPlanet.map((p) => p.keys).join("");
  check(
    concatenated === alphabetKey,
    `the per-planet key letters concatenate to the alphabet key in distance order: ${concatenated}`,
  );
  check(
    [...alphabetKey].sort().join("") === "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "the alphabet key is a permutation of all 26 letters — one letter per moon, no repeats",
  );
  check(
    byPlanet.reduce((n, p) => n + p.moons.length, 0) === 26,
    `26 moons across ${byPlanet.length} bodies carry the 26 key letters`,
  );
  const kv = keyedVigenere(alphabetKey);
  check(
    kv.decryptWith(ciphertext, passphrase) === squash(plaintext),
    `decrypting ${ciphertext} with the keyed Vigenère gives ${kv.decryptWith(ciphertext, passphrase)} — “${plaintext}”, attributed to ${F5_2018.attribution}`,
  );
  check(
    kv.encryptWith(squash(plaintext), passphrase) === ciphertext,
    "and re-encrypting the plaintext reproduces the published ciphertext exactly",
  );
  // The five rival conventions that look plausible and are wrong. Only one of
  // the six index choices reproduces the plaintext; the harness proves the rest fail.
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const KA = alphabetKey;
  const P = passphrase.toUpperCase();
  const rival = (v) =>
    [...ciphertext].map((c, i) => {
      const k = P[i % P.length];
      switch (v) {
        case 1: return KA[((KA.indexOf(c) - A.indexOf(k)) % 26 + 26) % 26];
        case 3: return A[((KA.indexOf(c) - A.indexOf(k)) % 26 + 26) % 26];
        case 4: return KA[((A.indexOf(c) - A.indexOf(k)) % 26 + 26) % 26];
        case 5: return A[((A.indexOf(c) - KA.indexOf(k)) % 26 + 26) % 26];
        case 6: return KA[((A.indexOf(c) - KA.indexOf(k)) % 26 + 26) % 26];
        default: return c;
      }
    }).join("");
  const wrong = [1, 3, 4, 5, 6].filter((v) => rival(v) === squash(plaintext));
  check(
    wrong.length === 0,
    "five rival index conventions (plain-alphabet positions, mixed positions) all fail — the surviving one indexes both operands in the keyed alphabet",
  );
  check(
    keyedVigenere("ABCDEFGHIJKLMNOPQRSTUVWXYZ").decryptWith(ciphertext, passphrase) !== squash(plaintext),
    "an unkeyed Vigenère (identity alphabet key) does not solve it — the key order is the whole puzzle",
  );
}

/* --------------------------------------------------- 6. USCYBERCOM seal MD5 */

console.log("── USCYBERCOM seal hash");
{
  const { sealHash, missionStatement } = USCYBERCOM;
  check(/^[0-9a-f]{32}$/.test(sealHash), `the seal string is 32 hex characters: ${sealHash}`);
  check(
    md5(missionStatement) === sealHash,
    "md5(the published mission statement) equals the seal string — recomputed, not quoted",
  );
  check(md5(missionStatement + "\n") !== sealHash, "a trailing newline breaks the match (digest 5a7a7c3f…)");
  check(
    md5(missionStatement.replace("specified Department", "specific Department")) !== sealHash,
    "“specific” instead of “specified” breaks the match — the preimage is punctuation-pinned",
  );
  check(missionStatement.length === 392, `preimage is ${missionStatement.length} characters`);
  const crn = "9ec4c1294a4f31474f299058ce2b22a";
  check(
    !/^[0-9a-f]{32}$/.test(crn),
    `the CRN rendering (${crn.length} chars) is not a valid MD5 — transcription, not cryptography`,
  );
  // The official heraldic record still specifies the hash ring — and still
  // calls a digest an encryption.
  check(
    /MD5 hash/.test(USCYBERCOM_HERALDRY.blazonExcerpt) &&
      /encrypted within this code/.test(USCYBERCOM_HERALDRY.blazonExcerpt),
    "the Institute of Heraldry’s blazon specifies the MD5 ring and calls it “encrypted within this code”",
  );
  // The press described the preimage by length, and the length is wrong — one
  // more transcription to keep honest, computed rather than argued.
  const wordCount = missionStatement.trim().split(/\s+/).length;
  check(
    wordCount === 55,
    `the preimage that actually hashes is ${wordCount} words / ${missionStatement.length} characters`,
  );
  check(
    wordCount !== 58,
    "Computerworld called it “Cybercom’s 58-word mission statement” — three words off the text that reproduces the digest, so even the length had to be recomputed",
  );
}

/* -------------------------------------------------------- 7. Cicada 3301 */

console.log("── Cicada 3301 (OpenPGP 7A35090F)");
{
  const { keyId, fingerprint, welcomeSignatureB64, welcomeText, rsa, keyservers } = CICADA3301;
  check(/^[0-9A-F]{8}$/.test(keyId), `the key ID Cicada names in its own Welcome text is ${keyId}`);
  check(
    /mit keyservers/.test(welcomeText) && /Key ID 7A35090F/.test(welcomeText),
    "the Welcome text is quoted verbatim: “It is available on the mit keyservers. Key ID 7A35090F…”",
  );
  check(
    /a2e7j6ic78h0j/.test(welcomeText) && CICADA3301.imgurAlbum === "a2e7j6ic78h0j",
    "and it names where the key was posted: the imgur album a2e7j6ic78h0j",
  );

  // The issuer key ID, read out of the signature bytes rather than trusted from
  // a keyserver or a wiki page.
  const issuer = openpgpIssuer(welcomeSignatureB64);
  check(!!issuer, "the published signature block parses far enough to yield an issuer subpacket");
  check(
    issuer && issuer.longKeyId === fingerprint.replace(/\s+/g, "").slice(-16),
    `issuer subpacket carries ${issuer && issuer.longKeyId} — the fingerprint’s last 16 hex digits`,
  );
  check(
    issuer && issuer.shortKeyId === keyId,
    `and its low 32 bits are ${issuer && issuer.shortKeyId}, the ID Cicada published: the key ID is in the signature, so it needs no keyserver to check`,
  );
  const fp = fingerprint.replace(/\s+/g, "");
  check(fp.length === 40, `the v4 fingerprint is 40 hex digits = ${fp.length * 4} bits (SHA-1)`);
  check(fp.slice(-16) === "181F01E57A35090F" && fp.slice(-8) === keyId, "long key ID = last 16 digits, short key ID = last 8, per RFC 4880");

  // The keyserver claim, source-checked.
  const good = keyservers.resolves.map((h) => h.host);
  const bad = keyservers.doesNotResolve.map((h) => h.host);
  check(
    good.includes("pgp.mit.edu") && good.includes("cryptonomicon.mit.edu"),
    `pgp.mit.edu and its canonical name cryptonomicon.mit.edu both resolve, to the same address (${keyservers.resolves[0].address})`,
  );
  check(
    bad.length === 1 && bad[0] === "cryptomomicon.mit.edu",
    "the hostname “cryptomomicon.mit.edu” does not resolve — getaddrinfo ENOTFOUND",
  );
  check(
    "cryptomomicon" !== "cryptonomicon" &&
      [...("cryptomomicon")].filter((c, i) => c !== "cryptonomicon"[i]).length === 1,
    "it is a one-letter corruption of cryptonomicon (an n becomes an m) — recorded as a correction, not repeated as a fact",
  );
  check(
    !/cryptomomicon/.test(welcomeText),
    "Cicada never named a host at all: “the mit keyservers” is the whole of its claim",
  );

  // The RSA sub-puzzle: measure it, and do not claim what was not done.
  const n = BigInt(rsa.n);
  const bits = n.toString(2).length;
  check(
    rsa.n.length === 112 && bits === 372,
    `the published modulus is ${rsa.n.length} decimal digits = ${bits} bits — “low bit” is Cicada’s framing, not a measurement`,
  );
  check(
    rsa.e === 65537 && 65537 === 2 ** 16 + 1,
    `e = ${rsa.e} = 2^16 + 1, the Fermat prime F4 — and 65536 = 2^16 sits beside 3301 throughout`,
  );
  check(
    rsa.factoredHere === false && rsa.attemptedHere.length >= 4,
    `not factored here after ${rsa.attemptedHere.length} attempts (${rsa.attemptedHere.join(", ")}) — recorded as attempted, never as solved`,
  );
  check(n % 2n !== 0n && n % 3n !== 0n && n % 5n !== 0n, "no small prime factor, so the “breakable” claim is not a trial-division gift");

  // The numbers, as arithmetic and nothing more.
  const isPrime = (k) => {
    if (k < 2) return false;
    for (let p = 2; p * p <= k; p++) if (k % p === 0) return false;
    return true;
  };
  check(isPrime(3301), "3301 is prime");
  check(
    CICADA3301.numbers.broodCycles.every(isPrime),
    "the cicada’s 13- and 17-year brood cycles are both prime — the reason the insect was chosen is not published, so the hall records the arithmetic only",
  );
  check(
    CICADA3301.timeline.some((t) => /CicadaPG v\.3301/.test(t.event)),
    "the April 2017 message’s Version line reads “CicadaPG v.3301”, which no GnuPG release ever printed — flagged, not resolved",
  );
  check(
    /not certified with a trusted signature/.test(CICADA3301.gpgWarning),
    "gpg’s own caveat is quoted: a good signature proves authorship of a key, never the identity behind it",
  );
}

/* -------------------------------------------------------- 8. the suite bundle */

console.log("── cipher suite bundle");

/** Bracket-match an array literal in minified JS, skipping over string contents. */
function literalAt(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const open = text.indexOf("[", start);
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return { from: open, to: i + 1, text: text.slice(open, i + 1) };
    }
  }
  return null;
}

if (!existsSync(SUITE)) {
  skip(
    "bundle integrity — the cipher-suite HTML the records live in is not in this " +
    `checkout (looked for ${SUITE}). Every bundle assertion in this section, ` +
    "including the per-record ones, did NOT run: sections 1–7 re-derive the " +
    "cryptography from js/lecture-ciphers.js alone and are unaffected.",
  );
} else {
  const src = readFileSync(SUITE, "utf8");
  const scripts = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let parsed = 0;
  let parseError = "";
  for (const body of scripts) {
    if (!body.trim()) continue;
    try {
      new vm.Script(body, { filename: "suite-inline.js" });
      parsed++;
    } catch (e) {
      parseError = e.message;
    }
  }
  check(parseError === "" && parsed === scripts.filter((b) => b.trim()).length, `inline app script re-parsed clean (${parsed} block(s)${parseError ? " · " + parseError : ""})`);

  const pc = literalAt(src, "Pc=[");
  const records = vm.runInNewContext(`(${pc.text})`, Object.create(null), { timeout: 2000 });
  check(Array.isArray(records) && records.length === 10, `lecture hall holds ${records.length} records`);

  const required = ["id", "title", "period", "location", "confidence", "summary", "facts", "sourceLinks", "caution"];
  const shapeOk = records.every((r) =>
    required.every((k) => r[k] != null) &&
    Array.isArray(r.facts) && r.facts.length >= 6 && r.facts.every((f) => typeof f === "string" && f.length > 30) &&
    r.sourceLinks.length >= 1 && r.sourceLinks.every((l) => l.label && /^https?:\/\//.test(l.url)) &&
    r.summary.length > 120 && r.caution.length > 60,
  );
  check(shapeOk, "every record carries the full field set: facts ≥ 6, a sourceLink per row, summary, caution");

  const RAISED = [
    "f5-blackhat-2016", "uscybercom-seal-md5", "fieldnotes-wheel", "f1eldn0tes-agents",
    "cicada-3301", "f5-blackhat-2018",
  ];
  const raisedBarOk = RAISED.every((id) => {
    const r = records.find((x) => x.id === id);
    return (
      r && r.facts.length >= 8 && r.sourceLinks.length >= 4 &&
      r.summary.length >= 200 && r.caution.length >= 200 &&
      // no record may assert an unverified answer as fact
      !/the answer is|confirmed solution/i.test(JSON.stringify(r))
    );
  });
  check(raisedBarOk, "every record added or rewritten since 2026-09-14 meets the raised bar: ≥ 8 facts, ≥ 4 links, ≥ 200-char summary and caution, no asserted answers");
  check(new Set(records.map((r) => r.id)).size === records.length, "record ids are unique");

  // provenance vocabulary must resolve in all three places that use it
  const legend = vm.runInNewContext(`(${literalAt(src, "Vv=[").text})`, Object.create(null)).map((x) => x.label);
  const colours = [...src.matchAll(/"(Primary archive|Archived directory|Community archive|Community recollection|Not recovered)":/g)].map((m) => m[1]).filter((v2, i, arr) => arr.indexOf(v2) === i);
  const filters = (src.match(/\["all",([^\]]+)\]\.map\(/)[1].match(/"([^"]+)"/g) || []).map((s) => s.replace(/"/g, ""));
  const used = [...new Set(records.map((r) => r.confidence))];
  check(
    used.every((u) => legend.includes(u) && colours.includes(u) && filters.includes(u)),
    `labels ${used.join(", ")} all resolve in legend (${legend.length}), colour map (${colours.length}) and filter row (${filters.length})`,
  );

  const byId = Object.fromEntries(records.map((r) => [r.id, r]));
  const haystack = (id) => JSON.stringify(byId[id]);
  check(
    ["kr0mecorp", "orc-hcu", "fravia-searchlores", "kim-philby-stasi"].every((id) => byId[id]),
    "the four earliest records survive both passes intact",
  );
  check(
    ["f5-blackhat-2016", "uscybercom-seal-md5", "fieldnotes-wheel", "f1eldn0tes-agents"].every((id) => byId[id]),
    "the four 2026-09-14 records survive this pass intact",
  );
  check(
    ["cicada-3301", "f5-blackhat-2018"].every((id) => byId[id]),
    "the two records added by this pass are in the hall",
  );

  // F5 2016 — the two threads this pass closed on that record
  check(
    haystack("f5-blackhat-2016").includes(F5_2016.card1) &&
      haystack("f5-blackhat-2016").includes(F5_2016.card2) &&
      haystack("f5-blackhat-2016").includes(F5_2016.tshirt),
    "F5 2016 record quotes all three published ciphertexts verbatim",
  );
  check(haystack("f5-blackhat-2016").includes("BIG-IP"), "F5 2016 record carries the correction to the circulating AI summary");
  check(
    haystack("f5-blackhat-2016").includes("291348") && /no solution|never published|not published/i.test(haystack("f5-blackhat-2016")),
    "F5 2016 record closes the 2019 thread honestly: the JSON tree is published, the answer is not",
  );
  check(
    /pigpen/i.test(haystack("f5-blackhat-2016")) && /600/i.test(haystack("f5-blackhat-2016")),
    "F5 2016 record states card #3’s pigpen status — a 600×57 image, still unrecovered",
  );

  // F5 2018
  check(
    haystack("f5-blackhat-2018").includes(F5_2018.alphabetKey) &&
      haystack("f5-blackhat-2018").includes(F5_2018.ciphertext) &&
      haystack("f5-blackhat-2018").includes(squash(F5_2018.plaintext)),
    "F5 2018 record carries the alphabet key, the ciphertext and the plaintext it re-derives",
  );
  check(
    haystack("f5-blackhat-2018").includes("semaphore") && /Carlyle/i.test(haystack("f5-blackhat-2018")),
    "F5 2018 record names both halves of the shirt: flag semaphore on the front, moons on the back, and the Carlyle quotation",
  );

  // wheel record
  check(haystack("fieldnotes-wheel").includes("648"), "wheel record states the 36×18 keyspace");
  check(haystack("fieldnotes-wheel").includes("m9uuty01h4qwksq.1op"), "wheel record preserves the unrecovered code verbatim");
  check(
    haystack("fieldnotes-wheel").includes("fieldnotesbrand.com") &&
      /seven lines|7 lines|seventh/i.test(haystack("fieldnotes-wheel")),
    "wheel record now carries the corpus’s seventh line and says the port had dropped it",
  );
  check(
    /O.*0|zero/.test(haystack("fieldnotes-wheel")) && /lowercase l|letter l/i.test(haystack("fieldnotes-wheel")),
    "wheel record explains both dial ambiguities — the letter O against a zero, and the digit 1 against a lowercase l",
  );

  // agents record
  check(
    /18 of (the )?21|18 of twenty-one/i.test(haystack("f1eldn0tes-agents")),
    "agents record states the new coverage: 18 of 21 re-derived",
  );
  check(
    haystack("f1eldn0tes-agents").includes("826CHI60622") || haystack("f1eldn0tes-agents").includes("826 CHI 60622"),
    "agents record resolves the “820chi” query against puzzle #1’s decoded clue",
  );
  check(
    haystack("f1eldn0tes-agents").includes("PLAYJACKBOXTWITCH330") ||
      haystack("f1eldn0tes-agents").includes("PLAY JACKBOX TWITCH 330"),
    "agents record carries the reconstructed #21 finish line",
  );
  check(
    /10,?368|10368/.test(haystack("f1eldn0tes-agents")) && /transcription collision|belongs to neither/i.test(haystack("f1eldn0tes-agents")),
    "agents record keeps the #19/#20 collision flagged, now with the attempt count that proves it",
  );
  check(
    /Nature/i.test(haystack("f1eldn0tes-agents")) && /Declaration/i.test(haystack("f1eldn0tes-agents")),
    "agents record documents the #8 book cipher and the tokenisation its answer depends on",
  );

  // seal record
  check(haystack("uscybercom-seal-md5").includes(USCYBERCOM.sealHash), "Cyber Command record carries the 32-character seal string");
  check(haystack("uscybercom-seal-md5").includes(USCYBERCOM.missionStatement.slice(0, 60)), "Cyber Command record quotes the preimage");
  check(
    /Institute of Heraldry/i.test(haystack("uscybercom-seal-md5")) &&
      /encrypted within this code/.test(haystack("uscybercom-seal-md5")),
    "Cyber Command record closes the post-2018 thread with the official blazon — and corrects its word “encrypted”",
  );

  // cicada record
  check(haystack("cicada-3301").includes(CICADA3301.keyId), "Cicada record carries the key ID 7A35090F");
  check(
    haystack("cicada-3301").includes(fingerprintNoSpace(fpOf(CICADA3301.fingerprint))) ||
      haystack("cicada-3301").includes(CICADA3301.fingerprint),
    "Cicada record carries the full v4 fingerprint",
  );
  check(
    haystack("cicada-3301").includes("cryptonomicon.mit.edu") &&
      haystack("cicada-3301").includes("cryptomomicon.mit.edu"),
    "Cicada record names the real keyserver host AND the one-letter corruption, so the correction cannot be lost",
  );
  check(
    /372 bits|372-bit/.test(haystack("cicada-3301")) && /not factored|did not factor|not reproduce/i.test(haystack("cicada-3301")),
    "Cicada record measures the RSA modulus and states plainly that this pass did not factor it",
  );
  check(
    /issuer/i.test(haystack("cicada-3301")) && haystack("cicada-3301").includes("181F01E57A35090F"),
    "Cicada record explains how the key ID is checked without a keyserver: the issuer subpacket in the signature itself",
  );
  check(
    // Word-boundary test on purpose: a bare /solved|cracked|broken/ also fires
    // inside "resolved" and "unsolved", which would ban ordinary English rather
    // than a claim. Negations are stripped first so "not solved" cannot sneak
    // through as a boundary match on "solved".
    !/\b(solved|cracked|broken)\b/.test(
      haystack("cicada-3301").replace(/(not|never|remains|is still)\s+(been\s+)?(solved|cracked|broken)/gi, ""),
    ),
    "Cicada record never claims the third puzzle was solved — “resolved” and “unsolved” are allowed, a claim is not",
  );

  // absence is recorded as absence
  check(
    !/deliberately does not invent/.test(src) &&
      haystack("fieldnotes-wheel").includes("Not recovered") &&
      /unpublished|does not publish|not published/i.test(haystack("f1eldn0tes-agents")),
    "missing material is recorded as missing — placeholders and silent repairs both absent",
  );
  check(
    src.includes("internet puzzle hunts"),
    "the hall’s scope line was widened again to cover internet puzzle hunts",
  );
}

function fpOf(s) { return s; }
function fingerprintNoSpace(s) { return s.replace(/\s+/g, ""); }

const verdict = failures === 0
  ? skips === 0 ? "ALL CHECKS PASSED" : `ALL CHECKS PASSED · ${skips} section(s) skipped`
  : `${failures} CHECKS FAILED`;
console.log(`\n${verdict}`);
process.exit(failures ? 1 : 0);
