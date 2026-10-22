import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  PATTERNS,
  START_A,
  START_B,
  START_C,
  STOP,
  checksum,
  decode,
  encode,
  encodeValues,
  encodeVoucher,
  buildVoucher,
  parseVoucher,
  tableViolations,
  toModules,
  toSvg,
  voucherMac,
  voucherMacInput,
} from "../js/barcode-model.js";

const ZXING_VENDOR = new URL("../public/apps/cyberchef/vendor/zxing-library.min.js", import.meta.url);

/**
 * Pull CODE_PATTERNS out of the vendored ZXing build. ZXing is an independent
 * implementation, so this is a genuine cross-check of the hand-written width
 * table rather than a comparison of the table with itself.
 */
function zxingPatterns() {
  const src = readFileSync(ZXING_VENDOR, "utf8");
  const at = src.indexOf("CODE_PATTERNS=");
  if (at < 0) return null;
  const open = src.indexOf("[", at);
  let depth = 0;
  let close = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") {
      depth--;
      if (depth === 0) {
        close = i;
        break;
      }
    }
  }
  const blob = src.slice(open, close + 1);
  const entries = [...blob.matchAll(/Int32Array\.from\(\[\s*([\d,\s]+)\]\)/g)];
  return entries.map((m) => m[1].split(",").map((x) => Number(x.trim())));
}

test("the width table equals ZXing's independently-derived CODE_PATTERNS", (t) => {
  if (!existsSync(ZXING_VENDOR)) {
    t.skip("vendored zxing-library.min.js is absent; cross-check cannot run");
    return;
  }
  const zx = zxingPatterns();
  assert.ok(zx, "could not locate CODE_PATTERNS in the vendored ZXing build");
  assert.equal(zx.length, 107, "ZXing should define 107 Code 128 patterns");
  assert.equal(PATTERNS.length, zx.length);
  const diffs = [];
  for (let i = 0; i < PATTERNS.length; i++) {
    if (JSON.stringify(PATTERNS[i]) !== JSON.stringify(zx[i])) {
      diffs.push(`value ${i}: ours ${JSON.stringify(PATTERNS[i])} vs zxing ${JSON.stringify(zx[i])}`);
    }
  }
  assert.deepEqual(diffs, [], `table disagrees with ZXing in ${diffs.length} row(s): ${diffs.slice(0, 5).join("; ")}`);
});

test("the table satisfies the structural invariants of ISO/IEC 15417", () => {
  assert.deepEqual(tableViolations(), []);
  // Spelled out as well, so a future edit to tableViolations cannot silently
  // weaken the check it is supposed to be performing.
  assert.equal(PATTERNS.length, 107);
  for (let v = 0; v < 107; v++) {
    const isStop = v === STOP;
    assert.equal(PATTERNS[v].length, isStop ? 7 : 6, `value ${v} element count`);
    assert.equal(PATTERNS[v].reduce((a, b) => a + b, 0), isStop ? 13 : 11, `value ${v} module width`);
  }
  const unique = new Set(PATTERNS.map((p) => p.join(",")));
  assert.equal(unique.size, 107, "all 107 patterns must be distinct or the symbology is ambiguous");
});

test("the checksum is the standard weighted mod-103 sum", () => {
  // Start symbol carries weight 1 implicitly, then position * value.
  assert.equal(checksum([START_B]), START_B % 103);
  assert.equal(checksum([START_B, 0]), START_B % 103);
  assert.equal(checksum([START_C, 12, 34, 56]), (START_C + 1 * 12 + 2 * 34 + 3 * 56) % 103);
  // A value sequence that crosses 103 must wrap, not go negative or exceed 102.
  const c = checksum([START_A, 95, 95, 95, 95, 95, 95, 95, 95, 95]);
  assert.ok(c >= 0 && c <= 102, `check character ${c} outside 0..102`);
});

test("round-trip over a generated corpus of 1400 payloads", () => {
  const failures = [];
  const check = (s) => {
    try {
      const got = decode(encode(s));
      if (got.text !== s) failures.push(`round-trip ${JSON.stringify(s)} -> ${JSON.stringify(got.text)}`);
    } catch (err) {
      failures.push(`threw on ${JSON.stringify(s)}: ${err.message}`);
    }
  };

  // Seeded LCG rather than Math.random, so a failure here is reproducible
  // instead of a heisenbug that only shows on some runs.
  let seed = 0x2f6e2b1;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let i = 0; i < 500; i++) {
    const len = 1 + Math.floor(rnd() * 48);
    check(Array.from({ length: len }, () => String.fromCharCode(32 + Math.floor(rnd() * 95))).join(""));
  }
  for (let i = 0; i < 500; i++) {
    const len = 1 + Math.floor(rnd() * 48);
    check(
      Array.from({ length: len }, () =>
        rnd() < 0.8 ? String(Math.floor(rnd() * 10)) : String.fromCharCode(65 + Math.floor(rnd() * 26)),
      ).join(""),
    );
  }
  // Every ASCII code point alone, prefixed and suffixed with a digit run so the
  // set-switch boundaries on both sides get exercised.
  for (let c = 0; c < 128; c++) {
    const ch = String.fromCharCode(c);
    check(ch);
    check(ch + "123456");
    check("123456" + ch);
  }
  assert.deepEqual(failures, [], `${failures.length} failure(s): ${failures.slice(0, 5).join("; ")}`);
});

test('regression: the digit pair "98" in code set C is not read as SHIFT', () => {
  // Values 96..102 are function codes in sets A/B but ordinary pairs in set C.
  // Testing for SHIFT before knowing the code set corrupts any token
  // containing the pair 98, and the check character still verifies, so the
  // damage is silent.
  for (const s of ["989898", "999999", "98", "9898", "9812345678", "1234567898", "1234981234"]) {
    assert.equal(decode(encode(s)).text, s, `payload ${JSON.stringify(s)}`);
  }
  // The whole payload is one digit run, so it is a single code-set-C block and
  // the pair 98 appears as an ordinary data symbol.
  const { values, startSet } = encodeValues("9812345678");
  assert.equal(startSet, "C");
  assert.deepEqual(values.slice(1, 6), [98, 12, 34, 56, 78]);
  assert.equal(decode(encode("9812345678")).text, "9812345678");
});

test("regression: a trailing two-digit run stays in code set C", () => {
  // Entering C costs a switch symbol, so a run of 4 is the entry threshold.
  // Reusing that threshold as the EXIT test kicked the final pair of an
  // all-numeric payload back into set B and cost three symbols.
  const payload = "04294967290000070000125025560576"; // 32 digits
  const { values, startSet } = encodeValues(payload);
  assert.equal(startSet, "C");
  assert.equal(values.length - 3, 16, "32 digits must pack into exactly 16 code-set-C symbols");
  assert.equal(values[0], START_C);
  assert.equal(decode(encode(payload)).text, payload);
});

test("regression: control characters encode into set A at values 64..95", () => {
  // ASCII 0..31 live at 64..95 in code set A, not at 0..31.
  const { values, startSet } = encodeValues("\u0001\u0002\u0003");
  assert.equal(startSet, "A");
  assert.equal(values[0], START_A);
  assert.deepEqual(values.slice(1, 4), [65, 66, 67]);
  assert.equal(decode(encode("\u0001\u0002\u0003")).text, "\u0001\u0002\u0003");
  for (const s of ["A\u0000B", "\tTAB\u000b", "\u001f"]) {
    assert.equal(decode(encode(s)).text, s, `payload ${JSON.stringify(s)}`);
  }
});

test("code set selection is economical without being wasteful", () => {
  // Short digit runs must NOT trigger a switch to C: two data symbols in B
  // beat a switch symbol plus one pair.
  assert.equal(encodeValues("12").startSet, "B");
  assert.equal(encodeValues("123").startSet, "B");
  assert.equal(encodeValues("1234").startSet, "C");
  assert.equal(encodeValues("123456789012").values.length - 3, 6);
  // Mixed payloads that never reach the threshold stay in B entirely.
  assert.equal(encodeValues("ABC12345678DEF").startSet, "B");
});

test("decode refuses a corrupted symbol stream rather than guessing", () => {
  const modules = encode("HELLO");

  // Every way this can fail is a legitimate refusal; what must never happen is
  // a silent wrong answer, so assert on throwing at all and list the messages
  // that have been observed rather than inventing a narrow one.
  const refusals =
    /no Code 128 symbol matches|check character mismatch|not a whole symbol|fewer than 6 runs|leading symbol is not a start character|trailing 7-run symbol is not STOP|did not end with STOP/;

  const flipped = [...modules];
  flipped[12] ^= 1;
  assert.throws(() => decode(flipped), refusals);

  // A single dropped module desynchronises everything downstream: the first
  // symbol can no longer be matched at all.
  assert.throws(() => decode(modules.slice(1)), refusals);
  assert.throws(() => decode(modules.slice(1)), /leading symbol is not a start character/);

  // Truncated before STOP.
  assert.throws(() => decode(modules.slice(0, modules.length - 13)), refusals);

  assert.throws(() => decode([]), /too few modules/);
  assert.throws(() => decode("not an array"), /must be an array/);
});

test("decode rejects a valid-looking stream whose check character was recomputed wrongly", () => {
  const { values } = encodeValues("HELLO");
  const bad = [...values];
  bad[bad.length - 2] = (bad[bad.length - 2] + 1) % 103; // corrupt the check symbol
  assert.throws(() => decode(toModules(bad)), /check character mismatch/);
});

test("encode rejects input the symbology cannot represent", () => {
  assert.throws(() => encode(""), /empty payload/);
  assert.throws(() => encode("caf\u00e9"), /outside the ASCII range/);
  assert.throws(() => encode("\u4f60\u597d"), /outside the ASCII range/);
  assert.throws(() => encode(42), /must be a string/);
});

test("the module stream has the shape a scanner expects", () => {
  const modules = encode("HELLO");
  assert.ok(modules.every((m) => m === 0 || m === 1), "modules must be binary");
  assert.equal(modules[0], 1, "symbol must start with a bar");
  assert.equal(modules[modules.length - 1], 1, "STOP ends with the terminating bar");
  // 11 modules per data/start/check symbol plus 13 for STOP.
  const { values } = encodeValues("HELLO");
  assert.equal(modules.length, (values.length - 1) * 11 + 13);
});

test("toSvg emits a well-formed, self-contained image with a quiet zone", () => {
  const svg = toSvg("HELLO", { scale: 2, height: 40 });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<\/svg>$/);
  const width = Number(svg.match(/width="(\d+)"/)[1]);
  const modules = encode("HELLO");
  assert.equal(width, (modules.length + 20) * 2, "width must include the 10-module quiet zone on both sides");
  assert.ok(svg.includes('fill="#fff"'), "needs an explicit white background for scanning");
  assert.ok(svg.includes("crispEdges"), "bars must not be antialiased");
  // Bars only, never spaces, and every rect has positive width.
  for (const m of svg.matchAll(/<rect x="(\d+)" y="0" width="(\d+)"/g)) {
    assert.ok(Number(m[2]) > 0);
  }
});

/* --------------------------- voucher layer --------------------------- */

const KEY = "0123456789abcdef0123456789abcdef";
const OTHER_KEY = "ffffffffffffffffffffffffffffffff";

test("the MAC covers version, account, counter and amount", () => {
  assert.equal(voucherMacInput({ account: 1, atc: 2, amount: 3 }), "V1" + "0000000001" + "000002" + "00000003");
  const a = voucherMac({ key: KEY, account: 1, atc: 2, amount: 3 });
  const b = voucherMac({ key: KEY, account: 1, atc: 2, amount: 4 });
  const c = voucherMac({ key: KEY, account: 1, atc: 3, amount: 3 });
  const d = voucherMac({ key: OTHER_KEY, account: 1, atc: 2, amount: 3 });
  assert.equal(a.length, 8);
  assert.notEqual(a, b, "amount must be covered");
  assert.notEqual(a, c, "counter must be covered");
  assert.notEqual(a, d, "key must matter");
});

test("the voucher is 32 digits and packs two per symbol", () => {
  const p = buildVoucher({ key: KEY, account: 429496729, atc: 7, amount: 1250 });
  assert.match(p, /^\d{32}$/);
  assert.equal(p, "0429496729" + "000007" + "00001250" + voucherMac({ key: KEY, account: 429496729, atc: 7, amount: 1250 }));
  assert.equal(encodeValues(p).values.length - 3, 16);
  assert.equal(decode(encodeVoucher({ key: KEY, account: 429496729, atc: 7, amount: 1250 })).text, p);
});

test("parseVoucher round-trips and rejects every tamper", () => {
  const v = { key: KEY, account: 429496729, atc: 7, amount: 1250 };
  const p = buildVoucher(v);
  assert.deepEqual(parseVoucher(p, { key: KEY }), {
    account: 429496729,
    atc: 7,
    amount: 1250,
    mac: voucherMac(v),
  });

  const flipAt = (i) => p.slice(0, i) + ((Number(p[i]) + 1) % 10) + p.slice(i + 1);
  assert.throws(() => parseVoucher(flipAt(16), { key: KEY }), /MAC mismatch/, "amount");
  assert.throws(() => parseVoucher(flipAt(3), { key: KEY }), /MAC mismatch/, "account");
  assert.throws(() => parseVoucher(flipAt(11), { key: KEY }), /MAC mismatch/, "counter");
  assert.throws(() => parseVoucher(flipAt(31), { key: KEY }), /MAC mismatch/, "mac");
  assert.throws(() => parseVoucher(p, { key: OTHER_KEY }), /MAC mismatch/, "wrong key");
  assert.throws(() => parseVoucher(p.slice(0, 31), { key: KEY }), /expected 32 digits/);
  assert.throws(() => parseVoucher("x".repeat(32), { key: KEY }), /all digits/);

  // Every single-digit flip anywhere in the payload must be caught.
  for (let i = 0; i < p.length; i++) {
    assert.throws(() => parseVoucher(flipAt(i), { key: KEY }), /MAC mismatch/, `digit ${i}`);
  }
});

test("parseVoucher refuses a replayed counter", () => {
  const v = { key: KEY, account: 1, atc: 42, amount: 100 };
  const p = buildVoucher(v);
  assert.throws(() => parseVoucher(p, { key: KEY, lastAtc: 42 }), /replay/);
  assert.throws(() => parseVoucher(p, { key: KEY, lastAtc: 43 }), /replay/, "an older counter is also a replay");
  assert.equal(parseVoucher(p, { key: KEY, lastAtc: 41 }).atc, 42);
});

test("voucher field widths are enforced, not silently truncated", () => {
  assert.throws(() => buildVoucher({ key: KEY, account: 10 ** 10, atc: 1, amount: 1 }), /does not fit in 10 digits/);
  assert.throws(() => buildVoucher({ key: KEY, account: 1, atc: 10 ** 6, amount: 1 }), /does not fit in 6 digits/);
  assert.throws(() => buildVoucher({ key: KEY, account: 1, atc: 1, amount: 10 ** 8 }), /does not fit in 8 digits/);
  assert.throws(() => buildVoucher({ key: KEY, account: -1, atc: 1, amount: 1 }), /non-negative integer/);
  assert.throws(() => voucherMac({ key: KEY, account: 1, atc: 1, amount: 1, digits: 3 }), /4\.\.10/);
});
