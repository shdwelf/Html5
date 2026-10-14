// Field-cipher deep dive, 2026-10-14 — control vectors for the ten recipes added
// to the CyberChef Renovated Kitchen. Sources and the verification record:
// docs/field-cipher-deep-dive-2026-10-14.md
//
//   * OD poem code — Ton van Schendel / Ordedienst worksheet, Crypto Museum
//     (ONZE WAS ZIEN ALLE, secret 58265, callsign UXV, pad QW → EJHQT, 26
//     groups, check OTRGJ).
//   * VIC cipher — the worked example used by the CIA analysis and Wikipedia
//     (personal number 6, date 139195, phrase "Twas the night before Christmas",
//     keygroup 72401 → Q 0668005552551, R 758838, checkerboard header 5961328470,
//     99-digit message code), plus the second published vector used for the
//     diagonal transposition (crunchbangle/vic-ts: key 536124, 60 digits →
//     left widths 3,4,5,6,4,5,6,1,2,3) and the 2016 blog's first-transposition
//     and Diana vectors recorded in the deep-dive note.
//   * Diana cryptosystem — reciprocal trigraph table; control trio {B, K, O};
//     Programming Praxis field procedure (pad line UKVTF WZHOK GORWY WETFR COYET,
//     two clear indicator groups, ATTACK AT DAWN padded with XYZ →
//     UKVTF WZHOK TSPDZ TVNRI BYEXH).
//   * Gronsfeld — digit-key recovery over ten candidates per column.
//   * Binary byte recipes — hexdump and octal round trips, ASCII gutter immunity.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:cyberchef-field-cipher-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const ops = dom.window.eval("OPERATIONS");
  const byId = new Map(ops.map((op) => [op.id, op]));
  const run = (id, input = "", changes = {}) => {
    const op = byId.get(id);
    assert.ok(op, `operation ${id} is registered`);
    const args = Object.fromEntries(op.args.map((arg) => [arg.key, arg.default]));
    Object.assign(args, changes);
    return op.run(input, args);
  };
  return { run, ops, dom };
}

const NEW_OPS = [
  "odPoemExact",
  "vicSchedule",
  "vicExact",
  "diana",
  "dianaTable",
  "gronsfeldAnalyze",
  "toHexdump",
  "fromHexdump",
  "toOctal",
  "fromOctal",
];

// Published Crypto Museum example (OD poem code).
const OD_KEY = { poem: "TOEN ONZE MOP EEN MOPJE WAS HET AARDIG HEM TE ZIEN NU BROMT HY ALLE DAGEN EN BYT NOG BOVENDIEN", positions: "2,6,11,15", secret: "58265", callsign: "UXV", pad: "QW" };
const OD_GROUPS = "DTAOR AAROC FATSA FUEWH BAAPH SROPA MONTV OMEGG EFIOC SCDOI SXTIN ISNOC IRNNA GRTWN OBHVT RNANL SERGR QNGDT ESUOY ODAED IIPAS ERGRW ETROA YEIOT SFPAD EITNU";
const OD_PLAIN_NO_PAD = "READYFORACTIONNOWSTOPCONFIRMGOAHEADASPLANNEDBYBROADCASTINGTHEAGREEDMESSAGEVIARADIOORANGESTOPWAITINGFORFURTHERINSTRUCTIONSSTOPUXV";

// Published VIC example (Wikipedia / CIA analysis).
const VIC_KEY = { phrase: "Twas the night before Christmas", date: "139195", personal: "6", keygroup: "72401", row2: "AT ONE SIR" };
const VIC_99 =
  "602538000055500000080873198000099911155580677642881866676667549976028759956964596658338765886658337";

// Second published VIC vector (Basic Cryptography, 2016-11-06): columnar
// transposition of the 70-digit checkerboard stream, and the diagonal stage's
// published widths from crunchbangle/vic-ts.
const VIC_BLOG_D0 =
  "9255076458271547043013589409410775525476174451443586871274494585848057";
const VIC_BLOG_D1 =
  "4311685592445237414544544750078597555282185170644685817478070439709754";
const VIC_BLOG_Q = "66348071473";
const VIC_DIAG_WIDTHS = [3, 4, 5, 6, 4, 5, 6, 1, 2, 3];
const VIC_DIAG_KEY = "536124";
const VIC_DIAG_PLAIN = "ABCDEFGHIJKLMONPQRSTUVWXabcdefghijklmnopqrstuvwx0123456789YZ";
const VIC_DIAG_CT =
  "pGKPVbg269qsLQvch37YBEIOTXe0lnrtuRwxi48ZADHMSWdjkmCFJNUaf15o";

// Published 2016 example, second (diagonal) transposition: the raw second key and
// the pre-final output it produces, plus the header row of its tableau.
const VIC_BLOG_K2 = "248992486743";
const VIC_BLOG_PREFINAL =
  "4844550444515839435550568149887405477951640777152402410775193478627582";
const VIC_BLOG_TABLE_ORDER = [0, 5, 11, 1, 6, 10, 8, 9, 2, 7, 3, 4];

// Published Diana field-procedure vector (Programming Praxis, 2014-12-19).
const DIANA_LINE = "UKVTF WZHOK GORWY WETFR COYET";
const DIANA_SENT = "UKVTF WZHOK TSPDZ TVNRI BYEXH";

test("the deep-dive recipes are registered, packed and counted", () => {
  const { run, ops, dom } = boot();
  try {
    const ids = ops.map((op) => op.id);
    for (const id of NEW_OPS) assert.ok(ids.includes(id), `missing deep-dive recipe ${id}`);
    const packs = dom.window.eval("RECIPE_PACKS");
    const packed = new Set();
    for (const entries of Object.values(packs)) for (const [id] of entries) packed.add(id);
    for (const id of NEW_OPS) assert.ok(packed.has(id), `${id} must be reachable by SFX select-all`);
    // A smoke run on the default key material must produce a well-formed message.
    assert.match(run("odPoemExact", "TEST MESSAGE"), /Indicator : EJHQT/);
  } finally {
    dom.window.close();
  }
});

test("OD poem code reproduces the published Crypto Museum worked example", () => {
  const { run, dom } = boot();
  try {
    const enc = run("odPoemExact", "READY FOR ACTION NOW STOP CONFIRM GO AHEAD AS PLANNED BY BROADCASTING THE AGREED MESSAGE VIA RADIO ORANGE STOP WAITING FOR FURTHER INSTRUCTIONS STOP", OD_KEY);
    assert.match(enc, /Indicator : EJHQT/, enc);
    assert.match(enc, /Check     : OTRGJ/, enc);
    assert.match(enc, /Plain     : 128 letters/, enc);
    assert.ok(enc.includes(OD_GROUPS), `published groups mismatch:\n${enc}`);
    assert.ok(enc.endsWith(`${OD_GROUPS} OTRGJ`), `as-sent line mismatch:\n${enc}`);

    const dec = run("odPoemExact", `EJHQT ${OD_GROUPS} OTRGJ`, { ...OD_KEY, mode: "decrypt" });
    assert.match(dec, /Indicator : EJHQT {2}→ {2}positions 2,6,11,15/, dec);
    assert.match(dec, /Check     : OK \(OTRGJ\)/, dec);
    assert.match(dec, /Key       : ONZEWASZIENALLE/, dec);
    assert.ok(dec.includes(OD_PLAIN_NO_PAD), `decrypt mismatch:\n${dec}`);
    assert.match(dec, /Pad       : leading "QW" removed/, dec);

    // A corrupt check group must be reported, not silently accepted.
    const bad = run("odPoemExact", `EJHQT ${OD_GROUPS} OTRGK`, { ...OD_KEY, mode: "decrypt" });
    assert.match(bad, /MISMATCH — expected OTRGJ, got OTRGK/, bad);
  } finally {
    dom.window.close();
  }
});

test("VIC key schedule reproduces every published line of the worked example", () => {
  const { run, dom } = boot();
  try {
    const out = run("vicSchedule", "", VIC_KEY);
    const lines = new Map(out.split("\n").map((line) => [line.slice(0, 10).trim().split(/\s+/)[0], line]));
    assert.match(out, /A {9}: 72401/);
    assert.match(out, /B {9}: 13919/);
    assert.match(out, /C {9}: 69592 {3}\(A − B, no borrowing\)/);
    assert.match(out, /D {9}: TWASTHENIG HTBEFORECH/);
    assert.match(out, /E\.1 \/ E\.2 : 8017942653 \/ 6013589427/);
    assert.match(out, /F\.1 \/ F\.2 : 6959254417 \/ 1234567890/);
    assert.match(out, /G {9}: 4966196060/);
    assert.match(out, /H {9}: 3288628787/);
    assert.match(out, /J {9}: 3178429506/);
    assert.match(out, /K {9}: 5064805552/);
    assert.match(out, /L {9}: 5602850077/);
    assert.match(out, /M {9}: 1620350748/);
    assert.match(out, /N {9}: 7823857125/);
    assert.match(out, /P {9}: 5051328370/);
    assert.match(out, /Q {9}: 0668005552551/);
    assert.match(out, /R {9}: 758838/);
    assert.match(out, /S {9}: 5961328470/);
    assert.match(out, /Key lengths: 7 and 0 \(last two non-equal digits of P\) \+ personal 6 → 13 and 6/);
    assert.match(out, /matches the published worked example/);
    assert.ok(lines.size > 10, "schedule prints every labelled line");
  } finally {
    dom.window.close();
  }
});

test("VIC message stage reproduces the published 99-digit code and round-trips", () => {
  const { run, dom } = boot();
  try {
    // The published message carries the half-marker "/" after "mean 0500. Not 0915";
    // VIC has no space or slash symbol, so both are dropped before bisection at 20.
    const enc = run("vicExact", "Attack at dawn. By dawn I mean 0500. Not 0915 like you did last time.", {
      ...VIC_KEY, transp: "none", insert: "no", pad: "no", cut: "20",
    });
    const digits = (enc.match(/Ciphertext {2}: ([\d ]+)/) || [])[1].replace(/ /g, "");
    assert.equal(digits, VIC_99, `published 99-digit code mismatch:\n${enc}`);
    assert.match(enc, /Checkerboard: header 5961328470 with "AT ONE SIR"/);
    assert.match(enc, /Keys {8}: Q\(13\)=0668005552551 {2}R\(6\)=758838/);
    assert.match(enc, /Keygroup {4}: not inserted/);

    // Full field procedure: bisect, columnar + diagonal transposition, keygroup.
    const message = "ATTACK AT DAWN BY DAWN I MEAN 0500 NOT 0915 LIKE YOU DID LAST TIME";
    const full = run("vicExact", message, { ...VIC_KEY, cut: "20", transp: "double", insert: "yes", pad: "yes" });
    const ct = (full.match(/Ciphertext {2}: ([\d ]+)/) || [])[1].replace(/ /g, "");
    assert.match(ct, /^[0-9]+$/);
    assert.equal(ct.length % 5, 0, "sent groups are complete fives");
    assert.ok(ct.includes("72401"), "the cleartext keygroup rides inside the message");
    const dec = run("vicExact", ct, { ...VIC_KEY, mode: "decrypt", cut: "20", transp: "double", insert: "yes", pad: "yes" });
    assert.match(dec, /keygroup removed: 72401/, dec);
    assert.ok(dec.includes(`Recovered   : ${message.replace(/ /g, "")}`), `round trip mismatch:\n${dec}`);
  } finally {
    dom.window.close();
  }
});

test("Diana cryptosystem is a reciprocal trigraph table", () => {
  const { run, dom } = boot();
  try {
    // Control trio from the field testimony: B + K → O.
    assert.equal(run("diana", "K", { key: "B", group: "0" }), "O");
    assert.equal(run("diana", "O", { key: "B", group: "0" }), "K");
    assert.equal(run("diana", "B", { key: "K", group: "0" }), "O");
    // Every one of the six orders inside a trio must close.
    for (const [a, b, c] of [["B", "K", "O"], ["K", "O", "B"], ["O", "B", "K"], ["K", "B", "O"], ["B", "O", "K"], ["O", "K", "B"]]) {
      const third = [a, b, c].find((letter) => letter !== a && letter !== b);
      assert.equal(run("diana", third, { key: a, group: "0" }), b, `{${a},${b},${third}} must close`);
      assert.equal(run("diana", c, { key: b, group: "0" }), a, `{${a},${b},${third}} must close`);
    }
    // Reciprocity: enciphering with the pad and re-enciphering returns the plaintext.
    const pad = "BKOEX";
    const ct = run("diana", "ATTACK AT DAWN", { key: pad, group: "0" }).replace(/[^A-Za-z]/g, "");
    const pt = run("diana", ct, { key: pad, group: "0" }).replace(/[^A-Za-z]/g, "");
    assert.equal(pt, "ATTACKATDAWN");
    assert.equal(ct.length, "ATTACKATDAWN".length);
    // Layout is preserved when grouping is off, and case is respected.
    // c = 25 − (p + k) mod 26, layout and case preserved, spaces never enciphered.
    assert.equal(run("diana", "Attack at dawn", { key: pad, group: "0" }), "Ywsvao ps sccc");

    const table = run("dianaTable");
    assert.match(table, /Self-test: all 676 trios reciprocal → PASS/);
    assert.match(table, /Trio control: B\/K\/O closes as published/);
    assert.match(table, /^B \| [A-Z]( [A-Z]){25}$/m);
  } finally {
    dom.window.close();
  }
});

test("Gronsfeld analysis recovers a repeating digit key from ciphertext alone", () => {
  const { run, dom } = boot();
  try {
    const plain = "DEFENDTHEEASTWALLNOWANDFOREVERMOREPEOPLEWITHTHEOLDTOWNBRIGADE";
    const ct = run("gronsfeld", plain, { key: "3141", mode: "encrypt" });
    const out = run("gronsfeldAnalyze", ct);
    assert.match(out, /── best length 4 \(average column IoC 0\.06\d\d\) ──/, out);
    assert.match(out, /Recovered digit key : 3141/, out);
    assert.match(out, new RegExp(`Candidate plaintext : ${plain}`), out);
    assert.match(out, /  length {2}4 {2}IoC 0\.06\d\d/, out);
    assert.ok(
      out.indexOf("length  4") < out.indexOf("length  1"),
      "the true key length must outrank the trivial ones",
    );
  } finally {
    dom.window.close();
  }
});

test("binary byte recipes round-trip through hexdump and octal", () => {
  const { run, dom } = boot();
  try {
    const dump = run("toHexdump", "Hello World!");
    assert.equal(dump, "00000000  48 65 6c 6c 6f 20 57 6f  72 6c 64 21             |Hello World!|");
    assert.equal(run("fromHexdump", dump), "Hello World!");
    // The ASCII gutter must not be able to smuggle bytes back in.
    const poisoned = dump.replace("|Hello World!|", "|Hello 6f6f6f!|");
    assert.equal(run("fromHexdump", poisoned), "Hello World!");
    // Offsets and the group split are cosmetic on the way back.
    assert.equal(run("fromHexdump", "00000000 48 65 6c 6c 6f", { outfmt: "binstr" }), "Hello");
    assert.equal(run("fromHexdump", dump, { outfmt: "hex" }), "48656c6c6f20576f726c6421");

    assert.equal(run("toOctal", "Hi!"), "110 151 041");
    assert.equal(run("toOctal", "Hi!", { pad: "0" }), "110 151 41");
    assert.equal(run("fromOctal", "110 151 041"), "Hi!");
    assert.equal(run("fromOctal", "110 151 041", { outfmt: "hex" }), "486921");
    // GNU/od-style three-digit punctuation tokens are still octal, not decimal.
    assert.equal(run("fromOctal", "110 151 041"), run("fromOctal", "110 151 41"));
    assert.throws(() => run("fromHexdump", "no bytes here"), /No hex bytes found/);
    assert.throws(() => run("fromOctal", "zzz"), /No octal values found/);

    // Widths other than 16 stay aligned with the offset column.
    const wide = run("toHexdump", "abcdefghijklmnopqrstuvwxyz0123456789", { width: "8" });
    assert.match(wide, /^00000000 {2}61 62 63 64 {2}65 66 67 68 \|abcdefgh\|$/m);
    assert.match(wide, /^00000008 {2}69 6a 6b 6c {2}6d 6e 6f 70 \|ijklmnop\|$/m);
    assert.equal(
      run("fromHexdump", wide, { outfmt: "hex" }),
      run("toHex", "abcdefghijklmnopqrstuvwxyz0123456789", { sep: "none" }),
    );
  } finally {
    dom.window.close();
  }
});

test("VIC diagonal transposition follows the published rule, not a triangle guess", () => {
  const { run, dom } = boot();
  try {
    const ev = (code) => dom.window.eval(code);
    // Published widths from crunchbangle/vic-ts (key 536124, 60 digits) — four
    // independent implementations agree on this rule (see docs §2b).
    // (spread into a local array: values from the jsdom realm have a different prototype)
    assert.deepEqual([...ev(`fdVicLeftWidths("${VIC_DIAG_KEY}",60)`)], VIC_DIAG_WIDTHS);
    // The blog's own illustrated pattern: key 431526 puts labels 1, 2, 3 in
    // columns 2, 4, 1, so the left widths run 2,3,4,5,6 | 4,5,6 | 1,2,3,4,5,6.
    assert.deepEqual([...ev('fdVicLeftWidths("431526",84)')], [2, 3, 4, 5, 6, 4, 5, 6, 1, 2, 3, 4, 5, 6]);
    // Encipher/decipher are inverses and the stage is a permutation of the digits.
    assert.equal(ev(`fdVicDiagEnc(${JSON.stringify(VIC_DIAG_PLAIN)},"${VIC_DIAG_KEY}")`), VIC_DIAG_CT);
    assert.equal(ev(`fdVicDiagDec(${JSON.stringify(VIC_DIAG_CT)},"${VIC_DIAG_KEY}")`), VIC_DIAG_PLAIN);
    // Published first-transposition vector of the 2016 example (plain columnar).
    assert.equal(ev(`sxTransEnc(${JSON.stringify(VIC_BLOG_D0)},"${VIC_BLOG_Q}",false)`), VIC_BLOG_D1);

    // Published micro-vectors from the same article that documents the recipe:
    // sequencing of letters and of digits (0 valued at 10), chain addition, and
    // the digit-encoding step (90210 with key 6013589427 → 27067).
    assert.equal(ev('fdSeqLetters("OCTOPUS")'), "2163475");
    assert.equal(ev('fdSeqDigits("90210")'), "34215");
    assert.equal(ev('fdChainExt("90210",5)'), "92319");
    assert.equal(ev('fdVicDigitEncode("90210","1234567890","6013589427")'), "27067");
    // …and the encoding step is what vicSchedule uses for Line H.
    const schedule = run("vicSchedule", "", VIC_KEY);
    assert.match(schedule, /H {9}: 3288628787/);
    assert.equal(ev(`fdVicDigitEncode("4966196060","1234567890","6013589427")`), "3288628787");

    // Every transposition setting must round-trip through the recipe.
    const message = "ATTACK AT DAWN BY DAWN I MEAN 0500 NOT 0915 LIKE YOU DID LAST TIME";
    for (const transp of ["none", "single", "double"]) {
      for (const insert of ["no", "yes"]) {
        const enc = run("vicExact", message, { ...VIC_KEY, cut: "25", transp, insert, pad: "yes" });
        const ct = (enc.match(/Ciphertext {2}: ([\d ]+)/) || [])[1].replace(/ /g, "");
        assert.equal(ct.length % 5, 0, "sent groups are complete fives");
        const dec = run("vicExact", ct, { ...VIC_KEY, mode: "decrypt", cut: "25", transp, insert, pad: "yes" });
        assert.ok(
          dec.includes(`Recovered   : ${message.replace(/ /g, "")}`),
          `transp=${transp} insert=${insert} round trip failed:\n${dec}`,
        );
      }
    }
  } finally {
    dom.window.close();
  }
});

test("Diana reproduces the published field-procedure example", () => {
  const { run, dom } = boot();
  try {
    // Pad line, two clear indicator groups and XYZ filler, as published.
    const enc = run("diana", "ATTACK AT DAWN", { key: DIANA_LINE, clear: "2", padText: "XYZ", group: "5" });
    assert.equal(enc, DIANA_SENT);

    const dec = run("diana", DIANA_SENT, { key: DIANA_LINE, clear: "2", padText: "XYZ", group: "5", mode: "decrypt" });
    assert.match(dec, /Indicator : UKVTF WZHOK {3}\(2 clear groups of the pad line\)/, dec);
    assert.match(dec, /Pad line {2}: supplied pad line starts with this indicator — OK/, dec);
    assert.match(dec, /Key used {2}: GORWY WETFR COYET {3}\(continues after the indicator\)/, dec);
    assert.match(dec, /Recovered : ATTACKATDAWNXYZ/, dec);

    // A pad line that does not start with the received indicator must be flagged.
    const wrong = run("diana", DIANA_SENT, { key: "ZZZZZ WZHOK GORWY WETFR COYET", clear: "2", group: "5", mode: "decrypt" });
    assert.match(wrong, /MISMATCH: the supplied pad line does not start with the indicator/, wrong);

    // The indicator groups must be shorter than the pad line.
    assert.throws(
      () => run("diana", "ATTACK AT DAWN", { key: "BKOEX", clear: "2", group: "5" }),
      /clear indicator groups must be shorter than the pad line/,
    );
    // Without an indicator the operation keeps its plain single-key behaviour.
    assert.equal(run("diana", "ATTACK", { key: "BKOEX", clear: "0", group: "0" }), "YWSVAO");
  } finally {
    dom.window.close();
  }
});

test("primary-source D-area rule (Kahn, CIA 1993) and the 2016 divergence", () => {
  const { run, dom } = boot();
  try {
    const ev = (code) => dom.window.eval(code);

    // David Kahn, "Number One From Moscow" (CIA, 1993) — text-only micro-vectors
    // that the same primitives must satisfy.
    assert.equal(ev('fdSeqLetters("BABY")'), "2134");          // literal key → sequential key
    assert.equal(ev('fdSeqDigits("39646")'), "15324");         // breeder key → sequential key
    assert.equal(ev('fdChainExt("3964",10)'), "2506756321");   // chain addition extension
    // The hollow-nickel message: keygroup 20818 − date 39194 = 91724 (Line C).
    assert.equal(ev('fdNoCarrySub("20818","39194")'), "91724");

    // Kahn's D areas, as quoted in docs §2b: the first area begins in the top row
    // under keynumber 1 and runs to the right side; each following row begins one
    // column further right; when the columns are exhausted, one row is skipped and
    // the next area starts under keynumber 2.  The kitchen's triangle construct
    // must reproduce exactly that partition.
    const w = 12, counts = [12, 12, 12, 12, 12, 10];
    const pos = {};
    VIC_BLOG_TABLE_ORDER.forEach((column, label) => { pos[label + 1] = column; });
    const kahn = new Set();
    let row = 0, label = 1;
    while (row < counts.length && label <= w) {
      let start = pos[label], r = row;
      while (r < counts.length && start < counts[r]) {
        for (let c = start; c < counts[r]; c++) kahn.add(r * w + c);
        start += 1; r += 1;
      }
      if (r >= counts.length) break;
      row = r + 1; label += 1;
    }
    const kitchen = [...ev(`[...sxTriangles(70,"${VIC_BLOG_K2}")].sort((a,b)=>a-b)`)];
    assert.equal(kitchen.length, kahn.size, "same number of disrupted cells");
    assert.equal(kitchen.join(","), [...kahn].sort((a, b) => a - b).join(","), "same disrupted cells");

    // The one published table that does NOT follow that rule: the 2016 worked
    // example's own second tableau is a left-prefix staircase (row widths
    // 5,6,7,8,9, with the short last row filled in the first phase).  It does
    // reproduce that article's published 70-digit output — uniquely among prefix
    // partitions — so the divergence is in that source's tool, not in this test.
    const cell = {};
    let i = 0;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5 + r; c++) cell[`${r},${c}`] = VIC_BLOG_D1[i++];
    for (let c = 0; c < 10; c++) cell[`5,${c}`] = VIC_BLOG_D1[i++];
    for (let r = 0; r < 5; r++) for (let c = 5 + r; c < 12; c++) cell[`${r},${c}`] = VIC_BLOG_D1[i++];
    let blog = "";
    for (const c of VIC_BLOG_TABLE_ORDER) {
      for (let r = 0; r < counts.length; r++) if (cell[`${r},${c}`] !== undefined) blog += cell[`${r},${c}`];
    }
    assert.equal(blog, VIC_BLOG_PREFINAL, "the 2016 prefix staircase reproduces its published output");
    assert.notEqual(
      ev(`sxTransEnc(${JSON.stringify(VIC_BLOG_D1)},"${VIC_BLOG_K2}",true)`),
      VIC_BLOG_PREFINAL,
      "the Kahn rule and the 2016 table must not be silently conflated",
    );
  } finally {
    dom.window.close();
  }
});
