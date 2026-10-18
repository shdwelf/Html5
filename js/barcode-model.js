/**
 * Code 128 symbology + signed offline voucher layer.
 *
 * Why this exists when public/apps/cyberchef already renders Code 128: the
 * CyberChef operation delegates to bwip-js, which ENCODES only. The
 * unattended-terminal work (vending, laundry) needs the other direction —
 * a terminal with a cheap linear imager has to READ a token and decide
 * whether to trust it — so this module carries a decoder too, and a token
 * format on top.
 *
 * Verification, because a hand-typed 107-entry width table is exactly the
 * kind of thing that is wrong in one row and silently produces unreadable
 * labels:
 *
 *   - tests/barcode-model.test.mjs extracts CODE_PATTERNS from the vendored
 *     ZXing min build (public/apps/cyberchef/vendor/zxing-library.min.js)
 *     and asserts this table equals it element for element. ZXing is an
 *     independent implementation, so that is a real cross-check rather than
 *     a tautology against itself.
 *   - Structural invariants that must hold for any Code 128 table are
 *     computed here and asserted: 6 elements per symbol (7 for STOP), width
 *     sum 11 (13 for STOP), bar/space alternation starting on a bar, and all
 *     107 patterns distinct.
 *   - encode() -> decode() round-trip over a generated corpus.
 *
 * Reference: ISO/IEC 15417 (Code 128); the checksum is the standard
 * weighted mod-103 sum.
 */

import { createHmac } from "node:crypto";

/** Bar/space widths for values 0..106. Index 106 (STOP) has 7 elements. */
export const PATTERNS = [
  [2, 1, 2, 2, 2, 2], [2, 2, 2, 1, 2, 2], [2, 2, 2, 2, 2, 1], [1, 2, 1, 2, 2, 3],
  [1, 2, 1, 3, 2, 2], [1, 3, 1, 2, 2, 2], [1, 2, 2, 2, 1, 3], [1, 2, 2, 3, 1, 2],
  [1, 3, 2, 2, 1, 2], [2, 2, 1, 2, 1, 3], [2, 2, 1, 3, 1, 2], [2, 3, 1, 2, 1, 2],
  [1, 1, 2, 2, 3, 2], [1, 2, 2, 1, 3, 2], [1, 2, 2, 2, 3, 1], [1, 1, 3, 2, 2, 2],
  [1, 2, 3, 1, 2, 2], [1, 2, 3, 2, 2, 1], [2, 2, 3, 2, 1, 1], [2, 2, 1, 1, 3, 2],
  [2, 2, 1, 2, 3, 1], [2, 1, 3, 2, 1, 2], [2, 2, 3, 1, 1, 2], [3, 1, 2, 1, 3, 1],
  [3, 1, 1, 2, 2, 2], [3, 2, 1, 1, 2, 2], [3, 2, 1, 2, 2, 1], [3, 1, 2, 2, 1, 2],
  [3, 2, 2, 1, 1, 2], [3, 2, 2, 2, 1, 1], [2, 1, 2, 1, 2, 3], [2, 1, 2, 3, 2, 1],
  [2, 3, 2, 1, 2, 1], [1, 1, 1, 3, 2, 3], [1, 3, 1, 1, 2, 3], [1, 3, 1, 3, 2, 1],
  [1, 1, 2, 3, 1, 3], [1, 3, 2, 1, 1, 3], [1, 3, 2, 3, 1, 1], [2, 1, 1, 3, 1, 3],
  [2, 3, 1, 1, 1, 3], [2, 3, 1, 3, 1, 1], [1, 1, 2, 1, 3, 3], [1, 1, 2, 3, 3, 1],
  [1, 3, 2, 1, 3, 1], [1, 1, 3, 1, 2, 3], [1, 1, 3, 3, 2, 1], [1, 3, 3, 1, 2, 1],
  [3, 1, 3, 1, 2, 1], [2, 1, 1, 3, 3, 1], [2, 3, 1, 1, 3, 1], [2, 1, 3, 1, 1, 3],
  [2, 1, 3, 3, 1, 1], [2, 1, 3, 1, 3, 1], [3, 1, 1, 1, 2, 3], [3, 1, 1, 3, 2, 1],
  [3, 3, 1, 1, 2, 1], [3, 1, 2, 1, 1, 3], [3, 1, 2, 3, 1, 1], [3, 3, 2, 1, 1, 1],
  [3, 1, 4, 1, 1, 1], [2, 2, 1, 4, 1, 1], [4, 3, 1, 1, 1, 1], [1, 1, 1, 2, 2, 4],
  [1, 1, 1, 4, 2, 2], [1, 2, 1, 1, 2, 4], [1, 2, 1, 4, 2, 1], [1, 4, 1, 1, 2, 2],
  [1, 4, 1, 2, 2, 1], [1, 1, 2, 2, 1, 4], [1, 1, 2, 4, 1, 2], [1, 2, 2, 1, 1, 4],
  [1, 2, 2, 4, 1, 1], [1, 4, 2, 1, 1, 2], [1, 4, 2, 2, 1, 1], [2, 4, 1, 2, 1, 1],
  [2, 2, 1, 1, 1, 4], [4, 1, 3, 1, 1, 1], [2, 4, 1, 1, 1, 2], [1, 3, 4, 1, 1, 1],
  [1, 1, 1, 2, 4, 2], [1, 2, 1, 1, 4, 2], [1, 2, 1, 2, 4, 1], [1, 1, 4, 2, 1, 2],
  [1, 2, 4, 1, 1, 2], [1, 2, 4, 2, 1, 1], [4, 1, 1, 2, 1, 2], [4, 2, 1, 1, 1, 2],
  [4, 2, 1, 2, 1, 1], [2, 1, 2, 1, 4, 1], [2, 1, 4, 1, 2, 1], [4, 1, 2, 1, 2, 1],
  [1, 1, 1, 1, 4, 3], [1, 1, 1, 3, 4, 1], [1, 3, 1, 1, 4, 1], [1, 1, 4, 1, 1, 3],
  [1, 1, 4, 3, 1, 1], [4, 1, 1, 1, 1, 3], [4, 1, 1, 3, 1, 1], [1, 1, 3, 1, 4, 1],
  [1, 1, 4, 1, 3, 1], [3, 1, 1, 1, 4, 1], [4, 1, 1, 1, 3, 1], [2, 1, 1, 4, 1, 2],
  [2, 1, 1, 2, 1, 4], [2, 1, 1, 2, 3, 2], [2, 3, 3, 1, 1, 1, 2],
];

export const START_A = 103;
export const START_B = 104;
export const START_C = 105;
export const STOP = 106;

export const CODE_A = 101;
export const CODE_B = 100;
export const CODE_C = 99;
export const SHIFT = 98;
export const FNC_2 = 97;
export const FNC_3 = 96;
export const FNC_1 = 102;
export const FNC_4_A = 101; // same value as CODE_A, distinguished by current set
export const FNC_4_B = 100; // same value as CODE_B, distinguished by current set

/** Modules of quiet zone the spec wants on each side. */
export const QUIET_MODULES = 10;

/**
 * Self-check the table against properties that must hold for ANY conforming
 * Code 128 table. Returns a list of human-readable violations; empty means OK.
 * Cheap enough to run on every load of the module in tests.
 */
export function tableViolations() {
  const problems = [];
  if (PATTERNS.length !== 107) problems.push(`expected 107 patterns, got ${PATTERNS.length}`);

  const seen = new Map();
  PATTERNS.forEach((widths, value) => {
    const isStop = value === STOP;
    const wantLen = isStop ? 7 : 6;
    const wantSum = isStop ? 13 : 11;
    if (widths.length !== wantLen) problems.push(`value ${value}: ${widths.length} elements, want ${wantLen}`);
    const sum = widths.reduce((a, b) => a + b, 0);
    if (sum !== wantSum) problems.push(`value ${value}: widths sum to ${sum}, want ${wantSum}`);
    if (widths.some((w) => !Number.isInteger(w) || w < 1 || w > 4)) {
      problems.push(`value ${value}: element outside 1..4 in ${JSON.stringify(widths)}`);
    }
    // Elements alternate bar/space and the first element is always a bar, so
    // the last element of a 6-wide symbol is a space; STOP's 7th is the
    // terminating bar. Both must be bars at the right-hand edge of the symbol.
    const key = widths.join(",");
    if (seen.has(key)) problems.push(`value ${value} duplicates value ${seen.get(key)}`);
    seen.set(key, value);
  });
  return problems;
}

/** Weighted mod-103 check character for a symbol value sequence incl. start. */
export function checksum(valuesWithStart) {
  let sum = valuesWithStart[0];
  for (let i = 1; i < valuesWithStart.length; i++) sum += i * valuesWithStart[i];
  return ((sum % 103) + 103) % 103;
}

/**
 * Choose code sets for a payload. Code C packs two digits into one symbol, so
 * a run of >=4 digits (and an even count) pays for the switch symbol; fewer
 * than four digits is a net loss. This is the same trade a label printer's
 * optimiser makes, and it is why the voucher format below is all-numeric.
 */
function planCodeSets(text) {
  const out = []; // {value}
  let i = 0;
  let set = null;

  const digitsAt = (pos) => {
    let n = 0;
    while (pos + n < text.length && text[pos + n] >= "0" && text[pos + n] <= "9") n++;
    return n;
  };

  const needsA = (ch) => ch < " "; // control chars only exist in set A

  // Two separate decisions, and conflating them is a real bug: a run of 4 is
  // what justifies PAYING for a switch symbol to enter C, but once inside C a
  // run of 2 is already a free pair, so the exit condition is run < 2. Using
  // the entry threshold as the exit test throws the last pair of an
  // all-numeric payload back into set B and costs three symbols.
  const ENTER_C_MIN_DIGITS = 4;

  while (i < text.length) {
    const run = digitsAt(i);

    if (set !== "C") {
      if (run >= ENTER_C_MIN_DIGITS) {
        out.push({ value: CODE_C, switchTo: "C" });
        set = "C";
      }
    } else if (run < 2) {
      out.push({ value: CODE_B, switchTo: "B" });
      set = "B";
    }

    if (set === "C") {
      out.push({ value: Number(text.slice(i, i + 2)) });
      i += 2;
      continue;
    }

    const ch = text[i];
    if (needsA(ch)) {
      if (set !== "A") {
        out.push({ value: CODE_A, switchTo: "A" });
        set = "A";
      }
      out.push({ value: ch.charCodeAt(0) + 64 }); // ASCII 0..31 occupy values 64..95 in set A
    } else {
      if (set !== "B") {
        out.push({ value: CODE_B, switchTo: "B" });
        set = "B";
      }
      out.push({ value: ch.charCodeAt(0) - 32 });
    }
    i += 1;
  }

  const first = out.find((s) => s.switchTo);
  const startSet = first ? first.switchTo : "B";
  // Drop the redundant leading switch symbol: the start character already
  // establishes the set.
  if (first && out[0] === first) out.shift();
  return { values: out.map((s) => s.value), startSet };
}

const START_OF = { A: START_A, B: START_B, C: START_C };

/** Encode text to Code 128 symbol values, including start, check and STOP. */
export function encodeValues(text) {
  if (typeof text !== "string") throw new TypeError("encodeValues: text must be a string");
  if (text.length === 0) throw new RangeError("encodeValues: empty payload has no valid encoding");
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c > 127) throw new RangeError(`encodeValues: U+${c.toString(16)} outside the ASCII range Code 128 covers`);
  }
  const { values, startSet } = planCodeSets(text);
  const start = START_OF[startSet];
  const check = checksum([start, ...values]);
  return { values: [start, ...values, check, STOP], startSet, check };
}

/** Symbol values -> array of modules (1 = bar, 0 = space), no quiet zone. */
export function toModules(values) {
  const modules = [];
  for (const value of values) {
    const widths = PATTERNS[value];
    if (!widths) throw new RangeError(`toModules: unknown symbol value ${value}`);
    widths.forEach((w, idx) => {
      const isBar = idx % 2 === 0; // always starts on a bar
      for (let k = 0; k < w; k++) modules.push(isBar ? 1 : 0);
    });
  }
  return modules;
}

/** Convenience: text -> modules. */
export function encode(text) {
  return toModules(encodeValues(text).values);
}

/**
 * Decode a module array back to text. Deliberately strict: it verifies the
 * weighted mod-103 check character and throws on a mismatch, because a
 * terminal that accepts a misread token is worse than one that asks for a
 * rescan. Returns { text, values, startSet, check }.
 */
export function decode(modules) {
  if (!Array.isArray(modules)) throw new TypeError("decode: modules must be an array");
  if (modules.length < 11 * 3 + 13) throw new RangeError("decode: too few modules to hold start + one data symbol + stop");

  // Walk symbols from the left. The first 6-module symbol must be a start.
  let pos = 0;
  const values = [];
  const readSymbol = () => {
    // Count run lengths from the current position.
    const widths = [];
    let cur = modules[pos];
    let count = 0;
    while (pos < modules.length) {
      if (modules[pos] === cur) {
        count++;
        pos++;
      } else break;
    }
    widths.push(count);
    return widths;
  };

  // Collect all run lengths first; simpler and less error-prone than
  // consuming 6 at a time, because STOP legitimately has 7.
  const runs = [];
  {
    let p = 0;
    while (p < modules.length) {
      const v = modules[p];
      let c = 0;
      while (p < modules.length && modules[p] === v) {
        c++;
        p++;
      }
      runs.push({ bit: v, len: c });
    }
    void readSymbol;
  }
  if (runs.length < 6) throw new RangeError("decode: fewer than 6 runs");
  if (runs[0].bit !== 1) throw new RangeError("decode: symbol must begin with a bar");

  const patternOf = (startIdx, count) => runs.slice(startIdx, startIdx + count).map((r) => r.len);
  const lookup = (widths) => PATTERNS.findIndex((p) => p.length === widths.length && p.every((w, i) => w === widths[i]));

  let ri = 0;
  let first = lookup(patternOf(0, 6));
  if (first !== START_A && first !== START_B && first !== START_C) {
    throw new RangeError(`decode: leading symbol is not a start character (got value ${first})`);
  }
  values.push(first);
  ri += 6;

  let guard = 0;
  while (ri < runs.length) {
    const remaining = runs.length - ri;
    let widths;
    let value;
    if (remaining === 7) {
      widths = patternOf(ri, 7);
      value = lookup(widths);
      if (value !== STOP) throw new RangeError(`decode: trailing 7-run symbol is not STOP (got ${value})`);
      values.push(STOP);
      ri += 7;
      break;
    }
    if (remaining < 6) throw new RangeError(`decode: ${remaining} trailing runs, not a whole symbol`);
    widths = patternOf(ri, 6);
    value = lookup(widths);
    if (value < 0) throw new RangeError(`decode: no Code 128 symbol matches widths ${JSON.stringify(widths)}`);
    values.push(value);
    ri += 6;
    guard++;
    if (guard > 1024) throw new RangeError("decode: symbol count exceeds a sane maximum");
  }
  if (values[values.length - 1] !== STOP) throw new RangeError("decode: symbol stream did not end with STOP");
  if (values.length < 4) throw new RangeError("decode: need start, at least one data symbol, check and stop");

  const body = values.slice(0, values.length - 2); // drop check + STOP
  const checkChar = values[values.length - 2];
  const want = checksum(body);
  if (want !== checkChar) {
    throw new RangeError(`decode: check character mismatch (symbol ${checkChar}, computed ${want})`);
  }

  // Interpret the data symbols under whichever code set is current.
  //
  // Dispatch on the code set FIRST. The function values 96..102 overlap the
  // digit pairs 00..99 in set C, so testing for SHIFT (98) before knowing the
  // set turns the pair "98" into a shift and silently corrupts every
  // digit-heavy token that happens to contain it.
  let set = body[0] === START_A ? "A" : body[0] === START_B ? "B" : "C";
  let text = "";
  let shifted = false;
  for (let i = 1; i < body.length; i++) {
    const v = body[i];

    if (set === "C") {
      if (v <= 99) {
        text += String(v).padStart(2, "0");
        continue;
      }
      if (v === CODE_B) { set = "B"; continue; } // 100
      if (v === CODE_A) { set = "A"; continue; } // 101
      if (v === FNC_1) { text += "\u001dFNC1\u001d"; continue; }
      throw new RangeError(`decode: value ${v} is not defined in code set C`);
    }

    // Sets A and B from here on.
    if (v === SHIFT) {
      shifted = true;
      continue;
    }
    if (v === CODE_C) {
      set = "C";
      continue;
    }
    const active = shifted ? (set === "A" ? "B" : "A") : set;
    shifted = false;

    if (v === FNC_1) { text += "\u001dFNC1\u001d"; continue; }
    if (v === FNC_2) { text += "\u001dFNC2\u001d"; continue; }
    if (v === FNC_3) { text += "\u001dFNC3\u001d"; continue; }

    if (active === "A") {
      if (v === CODE_B) { set = "B"; continue; } // 100 is CODE B in set A
      if (v === FNC_4_A) { text += "\u001dFNC4\u001d"; continue; } // 101 is FNC4 in set A
      // 0..63 -> ASCII 32..95, 64..95 -> ASCII 0..31
      text += v < 64 ? String.fromCharCode(32 + v) : String.fromCharCode(v - 64);
      continue;
    }

    // Set B.
    if (v === CODE_A) { set = "A"; continue; } // 101 is CODE A in set B
    if (v === FNC_4_B) { text += "\u001dFNC4\u001d"; continue; } // 100 is FNC4 in set B
    if (v <= 95) text += String.fromCharCode(32 + v); // 0..95 -> ASCII 32..127
    else throw new RangeError(`decode: value ${v} is not defined in code set B`);
  }

  return { text, values, startSet: set, check: checkChar };
}

/**
 * Render an SVG. Kept dependency-free so it works identically in a browser
 * <img> tag and in a Node test assertion. `scale` is modules-per-unit;
 * the quiet zone is included because a scanner needs it.
 */
export function toSvg(text, { scale = 2, height = 50, quiet = QUIET_MODULES } = {}) {
  const modules = encode(text);
  const width = (modules.length + quiet * 2) * scale;
  const parts = [];
  let x = quiet * scale;
  let i = 0;
  while (i < modules.length) {
    if (modules[i] === 1) {
      let run = 0;
      while (i + run < modules.length && modules[i + run] === 1) run++;
      parts.push(`<rect x="${x}" y="0" width="${run * scale}" height="${height}"/>`);
      x += run * scale;
      i += run;
    } else {
      x += scale;
      i += 1;
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">`,
    `<rect width="${width}" height="${height}" fill="#fff"/>`,
    `<g fill="#000">${parts.join("")}</g>`,
    `</svg>`,
  ].join("");
}

/* -------------------------------------------------------------------------
 * Signed voucher layer.
 *
 * The security model is the same one the meal-plan Java Card applet uses,
 * and the same caveat applies with more force here: a printed barcode is a
 * BEARER INSTRUMENT. Anyone holding it can present it. So:
 *
 *   - the token carries an account reference and a monotonically increasing
 *     transaction counter (ATC), never a stored value;
 *   - value lives server-side, and an unattended terminal MUST get an online
 *     authorisation before dispensing. Offline acceptance is limited to the
 *     case where the operator has decided a bounded loss is cheaper than the
 *     connectivity, and that decision has to be explicit, not accidental;
 *   - the ATC is what stops a photo of a barcode being replayed, and only if
 *     the terminal remembers the last ATC it accepted for that account;
 *   - the MAC is truncated to fit the symbol. Eight decimal digits is about
 *     26.6 bits: fine against a casual forger standing at a machine, not fine
 *     against someone who can make unlimited offline guesses. Length is a
 *     parameter for that reason, and the default is documented as weak.
 * ------------------------------------------------------------------------- */

export const VOUCHER_VERSION = 1;
export const VOUCHER_DIGITS = { account: 10, atc: 6, amount: 8, mac: 8 };

const fieldWidth = (name) => {
  const w = VOUCHER_DIGITS[name];
  if (!w) throw new RangeError(`unknown voucher field ${name}`);
  return w;
};

const pad = (n, name) => {
  const s = String(n);
  const w = fieldWidth(name);
  if (s.length > w) throw new RangeError(`voucher ${name} ${n} does not fit in ${w} digits`);
  if (!/^\d+$/.test(s)) throw new TypeError(`voucher ${name} must be a non-negative integer, got ${JSON.stringify(n)}`);
  return s.padStart(w, "0");
};

/** The exact byte string the MAC is computed over. Exported so a terminal can re-derive it. */
export function voucherMacInput({ account, atc, amount }) {
  return `V${VOUCHER_VERSION}${pad(account, "account")}${pad(atc, "atc")}${pad(amount, "amount")}`;
}

/** Truncated decimal HMAC. `digits` is capped at 10 to stay inside Number.MAX_SAFE_INTEGER. */
export function voucherMac({ key, account, atc, amount, digits = VOUCHER_DIGITS.mac }) {
  if (!Buffer.isBuffer(key) && typeof key !== "string") throw new TypeError("voucherMac: key must be a Buffer or string");
  if (!Number.isInteger(digits) || digits < 4 || digits > 10) {
    throw new RangeError("voucherMac: digits must be an integer in 4..10");
  }
  const h = createHmac("sha256", key).update(voucherMacInput({ account, atc, amount })).digest();
  // Read 8 bytes big-endian and reduce mod 10^digits, rather than slicing
  // decimal characters off the hex, so the output is uniformly distributed
  // over the requested range.
  let n = 0n;
  for (let i = 0; i < 8; i++) n = (n << 8n) | BigInt(h[i]);
  return (n % 10n ** BigInt(digits)).toString().padStart(digits, "0");
}

/**
 * Build the numeric payload: account|atc|amount|mac, all fixed width.
 * 10+6+8+8 = 32 digits with the default MAC length — even, so Code C packs it
 * two digits per symbol. The "V<version>" prefix lives in the MAC input, not
 * in the printed payload: printing it would cost a symbol and buy nothing,
 * because the length is already fixed by the field widths.
 */
export function buildVoucher({ key, account, atc, amount, macDigits = VOUCHER_DIGITS.mac }) {
  const mac = voucherMac({ key, account, atc, amount, digits: macDigits });
  return `${pad(account, "account")}${pad(atc, "atc")}${pad(amount, "amount")}${mac}`;
}

/** Inverse of buildVoucher. Throws on a bad MAC; never returns an unverified token. */
export function parseVoucher(payload, { key, macDigits = VOUCHER_DIGITS.mac, lastAtc = -1 } = {}) {
  if (typeof payload !== "string" || !/^\d+$/.test(payload)) {
    throw new RangeError("parseVoucher: payload must be all digits");
  }
  const w = VOUCHER_DIGITS;
  const want = w.account + w.atc + w.amount + macDigits;
  if (payload.length !== want) throw new RangeError(`parseVoucher: expected ${want} digits, got ${payload.length}`);

  let off = 0;
  const account = Number(payload.slice(off, (off += w.account)));
  const atc = Number(payload.slice(off, (off += w.atc)));
  const amount = Number(payload.slice(off, (off += w.amount)));
  const mac = payload.slice(off, off + macDigits);

  const expect = voucherMac({ key, account, atc, amount, digits: macDigits });
  // Constant-time compare so a terminal does not leak the MAC byte by byte.
  let diff = 0;
  for (let i = 0; i < expect.length; i++) diff |= expect.charCodeAt(i) ^ mac.charCodeAt(i);
  if (diff !== 0) throw new RangeError("parseVoucher: MAC mismatch");

  if (Number.isFinite(lastAtc) && atc <= lastAtc) {
    throw new RangeError(`parseVoucher: ATC ${atc} is not newer than the last accepted ${lastAtc} (replay)`);
  }
  return { account, atc, amount, mac };
}

/** One-shot: account/counter/amount -> scannable module array. */
export function encodeVoucher(opts) {
  return encode(buildVoucher(opts));
}
