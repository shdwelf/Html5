// The 1914 British War Office Manual of Cryptography (General Staff, War Office;
// Aegean Park Press facsimile) prints two fully worked field ciphers in chapter
// III(a), and this suite pins the recipes to those printed pages:
//
//   * §2, the Zigzag Transposition cipher — "A reconnaissance made yesterday
//     across the river found no traces of the enemy" written down 8-letter
//     columns, alternating direction column by column, with the dummies FULLSTO
//     (65 letters + 7 dummies = the 72-letter cryptogram, which the book prints
//     in five-letter groups).
//   * §4, the Nihilists' Cipher — "The sixth division will attack at dawn" under
//     the keyword Thames (alphabetical ranks 631425) with the dummies QXYZ,
//     printed as ZQWXNYIOSNIWXETSHIAALTLTIDTIHVAACTKD.
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
      window.URL.createObjectURL = () => "blob:war-office-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const runner = (id) => {
    const op = dom.window.eval("OPERATIONS").find((entry) => entry.id === id);
    assert.ok(op, `${id} is registered`);
    const run = (input, changes = {}) => {
      const args = Object.fromEntries(op.args.map((arg) => [arg.key, arg.default]));
      Object.assign(args, changes);
      return op.run(input, args);
    };
    return { op, run };
  };
  return { dom, runner };
}

// The manual's own words, page 22: the reconnaissance sentence, the FULLSTO
// dummies, and the cryptogram in its printed five-letter groups.
const RECON = "A reconnaissance made yesterday across the river found no traces of the enemy";
const ZIGZAG = "AMAOSNOMYREDRSDTEFECECTNRNUCNYAHUAELOAEYEOCELNSSARFEHSNSTDIRSTTAIERVEOFO";
const ZIGZAG_PRINTED = "AMAOS NOMYR EDRSD TEFEC ECTNR NUCNY AHUAE LOAEY EOCEL NSSAR FEHSN STDIR STTAI ERVEO FO";

test("the manual's zigzag example: 8-letter columns, FULLSTO dummies, 72-letter cryptogram", () => {
  const { dom, runner } = boot();
  try {
    const zigzag = runner("zigzagTransposition");
    const out = zigzag.run(RECON, { length: "8", pad: "FULLSTO" });
    assert.equal(out.length, 72, "65 letters plus 7 dummies");
    assert.equal(out, ZIGZAG, "the cryptogram must match the printed page");
    assert.equal(out.match(/.{1,5}/g).join(" "), ZIGZAG_PRINTED, "reads back in the book's five-letter groups");
    // The receiver divides by the agreed column length and reads the diagram.
    const back = zigzag.run(out, { length: "8", pad: "FULLSTO", mode: "decrypt" });
    assert.equal(back, "ARECONNAISSANCEMADEYESTERDAYACROSSTHERIVERFOUNDNOTRACESOFTHEENEMYFULLSTO");
  } finally { dom.window.close(); }
});

test("the zigzag direction convention is pinned by hand-checkable mini cases", () => {
  const { dom, runner } = boot();
  try {
    const zigzag = runner("zigzagTransposition");
    // Twelve letters in 3-letter columns: four columns, no padding.
    // Column 1 runs down (A B C), column 2 back up (D E F), and so on;
    // reading the lines gives AFGL / BEHK / CDIJ.
    assert.equal(zigzag.run("abcdefghijkl", { length: "3" }), "AFGLBEHKCDIJ");
    // The key may instead start at the bottom: column 1 runs up, column 2 down.
    assert.equal(zigzag.run("ABCDEFGHIJKL", { length: "3", start: "bottom" }), "CDIJBEHKAFGL");
    // Padding letters cycle when the gap is longer than the pad string.
    assert.equal(zigzag.run("ABCDEFG", { length: "5", pad: "AB" }), "AABBCADGEF");
    // A cryptogram that is not a whole number of columns is refused.
    assert.throws(
      () => zigzag.run("ABCDEFG", { length: "5", mode: "decrypt" }),
      /does not divide into 5-letter columns/,
    );
    assert.throws(() => zigzag.run("12345"), /Enter a message/);
  } finally { dom.window.close(); }
});

test("the manual's Nihilists' square example: Thames → 631425, dummies QXYZ", () => {
  const { dom, runner } = boot();
  try {
    const square = runner("nihilistSquare");
    const out = square.run("The sixth division will attack at dawn", { key: "Thames", pad: "QXYZ" });
    assert.equal(out.length, 36, "a 6×6 square");
    assert.equal(out, "ZQWXNYIOSNIWXETSHIAALTLTIDTIHVAACTKD", "the cryptogram must match the printed page");
    const back = square.run(out, { key: "Thames", pad: "QXYZ", mode: "decrypt" });
    assert.equal(back, "THESIXTHDIVISIONWILLATTACKATDAWNQXYZ", "the square comes back with the dummies last");
    // Spaces in the received cryptogram do not disturb the decryption.
    const spaced = "ZQWXNYIOSNIWXETSHIAALTLT IDTIHVAACTKD";
    assert.equal(square.run(spaced, { key: "Thames", pad: "QXYZ", mode: "decrypt" }), back);
  } finally { dom.window.close(); }
});

test("the Nihilists' keyword sets both sides of the square, and an ordered keyword does nothing", () => {
  const { dom, runner } = boot();
  try {
    const square = runner("nihilistSquare");
    // A keyword that is already alphabetically ordered ranks as itself, so the
    // letters keep their coordinates and each table comes back row by row. The
    // message is longer than one 3×3 table, so successive tables are filled.
    assert.equal(square.run("DEFENDTHEEAST", { key: "ABC", pad: "X" }), "DEFENDTHEEASTXXXXX");
    assert.equal(square.run("DEFENDTHEEASTTWENTYTWO", { key: "ABC", pad: "X" }), "DEFENDTHEEASTTWENTYTWOXXXXX");
    assert.equal(
      square.run(square.run("DEFENDTHEEASTTWENTYTWO", { key: "ABC", pad: "X" }), { key: "ABC", pad: "X", mode: "decrypt" }),
      "DEFENDTHEEASTTWENTYTWOXXXXX",
    );
    // The same text under a real keyword must move letters around, one 6×6
    // table here, and come back with its dummies.
    const thames = square.run("DEFENDTHEEAST", { key: "Thames" });
    assert.notEqual(thames, "DEFENDTHEEASTXXXXX");
    assert.equal(thames.length, 36);
    assert.equal(square.run(thames, { key: "Thames", mode: "decrypt" }), "DEFENDTHEEAST" + "X".repeat(23));
    // Round trip on a longer keyword (9 letters → 81 cells, 54 dummies for a
    // 27-letter message).
    const round = square.run(square.run("Attack the bridge at first light", { key: "SPARTACUS" }), { key: "SPARTACUS", mode: "decrypt" });
    assert.equal(round, "ATTACKTHEBRIDGEATFIRSTLIGHT" + "X".repeat(54));
    // Refusals instead of silent guessing.
    assert.throws(() => square.run("ABC", { key: "" }), /Enter a keyword/);
    assert.throws(() => square.run("ABC", { key: "A" }), /at least two letters/);
    assert.throws(() => square.run("ABC", { key: "AB", mode: "decrypt" }), /does not fill 2×2 squares/);
    assert.throws(() => square.run("   ", { key: "AB" }), /Enter a message/);
  } finally { dom.window.close(); }
});
