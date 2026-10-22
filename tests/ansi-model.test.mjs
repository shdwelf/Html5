import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createScreen, feed, plainText, toHtml, ANSI_COLORS, DEFAULT_COLS, DEFAULT_ROWS,
} from "../js/ansi-model.js";

const txt = (seq, opts) => plainText(feed(createScreen(opts), seq)).replace(/\n+$/, "");
const pt = (s) => plainText(s).replace(/\n+$/, "");   // plainText keeps all rows
const at = (s, x, y) => s.grid[y][x];

test("plain text lands at the cursor and advances it", () => {
  const s = feed(createScreen({ cols: 20, rows: 4 }), "HELLO");
  assert.equal(pt(s), "HELLO");
  assert.equal(s.x, 5);
  assert.equal(s.written, 5);
});

test("CR returns to column 0, LF moves down", () => {
  assert.equal(txt("AB\r\nCD"), "AB\nCD");
  const s = feed(createScreen({ cols: 10, rows: 3 }), "ABCD\rXY");
  assert.equal(pt(s).split("\n")[0], "XYCD", "CR overwrites from column 0");
});

test("CUP is 1-based, so ESC[1;1H is the top-left cell", () => {
  const s = feed(createScreen({ cols: 10, rows: 3 }), "\x1b[1;1HX");
  assert.equal(at(s, 0, 0).ch, "X");
  const s2 = feed(createScreen({ cols: 10, rows: 3 }), "\x1b[3;5HY");
  assert.equal(at(s2, 4, 2).ch, "Y", "row 3 col 5 -> y=2 x=4");
});

test("CUP with no parameters homes the cursor", () => {
  const s = feed(createScreen({ cols: 10, rows: 3 }), "ABCD\x1b[HZ");
  assert.equal(at(s, 0, 0).ch, "Z");
});

test("relative cursor movement clamps at the screen edges", () => {
  const s = feed(createScreen({ cols: 10, rows: 3 }), "\x1b[99AX");
  assert.equal(s.y, 0, "moving up past row 0 clamps, it does not wrap");
  const s2 = feed(createScreen({ cols: 10, rows: 3 }), "\x1b[99BY");
  assert.equal(s2.y, 2, "moving down past the last row clamps");
  const s3 = feed(createScreen({ cols: 10, rows: 3 }), "\x1b[99DZ");
  assert.equal(s3.x, 1, "moved to 0 then wrote one char");
});

test("SGR sets the 16 colours and resets them", () => {
  const s = feed(createScreen({ cols: 20, rows: 2 }), "\x1b[31;44mA\x1b[0mB");
  assert.equal(at(s, 0, 0).fg, "red");
  assert.equal(at(s, 0, 0).bg, "blue");
  assert.equal(at(s, 1, 0).fg, null, "SGR 0 clears");
  assert.equal(ANSI_COLORS.length, 8);
});

test("ESC[m with no parameter means ESC[0m", () => {
  const s = feed(createScreen({ cols: 20, rows: 2 }), "\x1b[1;31mA\x1b[mB");
  assert.equal(at(s, 0, 0).bold, true);
  assert.equal(at(s, 1, 0).bold, false);
  assert.equal(at(s, 1, 0).fg, null);
});

test("attributes persist across the cells that follow them", () => {
  const s = feed(createScreen({ cols: 20, rows: 2 }), "\x1b[32mABC");
  for (const x of [0, 1, 2]) assert.equal(at(s, x, 0).fg, "green", `cell ${x}`);
});

test("line wrap moves to the next row at the right margin", () => {
  const s = feed(createScreen({ cols: 4, rows: 3 }), "ABCDEF");
  assert.equal(pt(s), "ABCD\nEF");
  assert.equal(s.y, 1);
});

test("writing on the last row scrolls instead of running off the screen", () => {
  const s = feed(createScreen({ cols: 4, rows: 2 }), "AB\r\nCD\r\nEF");
  assert.equal(pt(s), "CD\nEF", "the first line scrolled away");
  assert.equal(s.y, 1, "cursor stays on the last row, it does not grow");
  assert.equal(s.rows, 2);
});

test("ED 2 clears the whole screen and homes the cursor", () => {
  const s = feed(createScreen({ cols: 6, rows: 3 }), "AAAA\r\nBBBB\x1b[2J");
  assert.equal(pt(s).trim(), "");
  assert.equal(s.x, 0);
  assert.equal(s.y, 0);
});

test("ED 0 clears from the cursor forward, ED 1 backward", () => {
  const fwd = feed(createScreen({ cols: 6, rows: 2 }), "ABCDEF\x1b[1;3H\x1b[0J");
  assert.equal(plainText(fwd).split("\n")[0], "AB", "cursor onward erased");
  const back = feed(createScreen({ cols: 6, rows: 2 }), "ABCDEF\x1b[1;3H\x1b[1J");
  assert.equal(plainText(back).split("\n")[0], "   DEF", "ED 1 is inclusive of the cursor cell");
});

test("EL erases within one line only", () => {
  const s = feed(createScreen({ cols: 8, rows: 2 }), "ABCDEFGH\x1b[1;4H\x1b[0K");
  assert.equal(pt(s).split("\n")[0], "ABC");
  assert.equal(s.y, 0, "the second line is untouched");
});

test("save and restore cursor keeps attributes too", () => {
  const s = feed(createScreen({ cols: 20, rows: 3 }), "\x1b[31m\x1b7\x1b[3;3HXY\x1b8Z");
  assert.equal(at(s, 2, 2).ch, "X");
  assert.equal(at(s, 0, 0).ch, "Z", "restored to the saved position");
  assert.equal(at(s, 0, 0).fg, "red", "attributes came back with it");
});

test("an unsupported CSI is consumed, not printed", () => {
  const s = feed(createScreen({ cols: 20, rows: 2 }), "A\x1b[?25lB\x1b[6n C");
  assert.equal(pt(s), "AB C", "neither the params nor the final byte leaked");
  assert.equal(s.sequences, 2, "both sequences were parsed");
});

test("C0 controls other than the handled ones are dropped silently", () => {
  assert.equal(txt("A\x07B"), "AB", "BEL");
  assert.equal(txt("A\x0bB"), "AB", "VT");
});

test("TAB advances to the next stop of eight and clamps at the margin", () => {
  const s = feed(createScreen({ cols: 20, rows: 2 }), "AB\tC");
  assert.equal(pt(s), "AB      C", "column 2 -> column 8");
  const s2 = feed(createScreen({ cols: 10, rows: 2 }), "\x1b[1;9H\tX");
  assert.equal(s2.x, 10, "clamped to the last column rather than wrapping");
});

test("ICH and DCH shift the rest of the line", () => {
  const ins = feed(createScreen({ cols: 8, rows: 2 }), "ABCDEF\x1b[1;2H\x1b[2@");
  assert.equal(plainText(ins).split("\n")[0], "A  BCDEF", "insert pushed chars right");
  const del = feed(createScreen({ cols: 8, rows: 2 }), "ABCDEF\x1b[1;2H\x1b[2P");
  assert.equal(plainText(del).split("\n")[0], "ADEF", "delete pulled chars left");
});

test("reverse video swaps foreground and background in the render", () => {
  const s = feed(createScreen({ cols: 10, rows: 2 }), "\x1b[37;40m\x1b[7mR");
  const html = toHtml(s);
  assert.match(html, /color:#000/, "reverse makes the fg colour the background");
  assert.match(html, /background:#aaa/);
});

test("toHtml escapes markup so a BBS banner cannot inject into the page", () => {
  const html = toHtml(feed(createScreen({ cols: 20, rows: 2 }), '<img src=x onerror="alert(1)">'));
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  // The precise claim: once this renderer's own tags are removed, no "<"
  // survives, so no tag can be opened. Quotes are deliberately NOT escaped --
  // the text only ever lands in element content, never in an attribute, and
  // the style string is built from a fixed palette with no user data in it.
  const textOnly = html.replace(/<\/?(?:div|span)[^>]*>/g, "");
  assert.doesNotMatch(textOnly, /</, "a stray < would let a banner open a tag");
});

test("CP437 bytes render as the mapped glyphs, not as latin-1", () => {
  const table = new Array(128).fill("?");
  table[0xDB - 0x80] = "\u2588";                 // full block
  table[0xCD - 0x80] = "\u2550";                 // double horizontal
  const s = feed(createScreen({ cols: 10, rows: 2 }), new Uint8Array([0xDB, 0xCD]), { cp437: table });
  assert.equal(pt(s), "\u2588\u2550");
});

test("a Uint8Array and the equivalent string produce the same screen", () => {
  const seq = "\x1b[2J\x1b[1;1H\x1b[36mWILDCAT!\x1b[0m\r\nReady.";
  const a = plainText(feed(createScreen({ cols: 40, rows: 4 }), seq));
  const b = plainText(feed(createScreen({ cols: 40, rows: 4 }), new TextEncoder().encode(seq)));
  assert.equal(a, b);
});

test("defaults are the 80x25 the BBS era assumed", () => {
  const s = createScreen();
  assert.equal(s.cols, DEFAULT_COLS);
  assert.equal(s.rows, DEFAULT_ROWS);
  assert.equal(s.grid.length, 25);
  assert.equal(s.grid[0].length, 80);
});

test("a nonsense screen size is refused rather than silently clamped", () => {
  assert.throws(() => createScreen({ cols: 0 }), RangeError);
  assert.throws(() => createScreen({ rows: -3 }), RangeError);
  assert.throws(() => createScreen({ cols: 80.5 }), RangeError);
});

test("a truncated escape at the end of a stream does not throw", () => {
  const s = feed(createScreen({ cols: 20, rows: 2 }), "AB\x1b[3");
  assert.equal(pt(s), "AB");
});

test("an empty capture yields a blank screen, not an error", () => {
  const s = feed(createScreen({ cols: 10, rows: 2 }), "");
  assert.equal(pt(s).trim(), "");
  assert.equal(s.written, 0);
});
