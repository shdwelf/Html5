// Cold War Spy Manual challenge distillation (T11.1 / T10.2 cookbook tail).
// The cookbook section #spy-manual-challenges documents a measured figure for
// every kitchen-backed route of the book's 16-item Code and Cipher-Breaking
// Challenge. These tests (a) read the section back as text and fail if a
// documented figure disappears, and (b) re-bake each figure through the real
// recipe -> bake() pipeline, with independent implementations for Vigenere,
// columnar transposition and Playfair so the page cannot quietly agree with
// itself.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const cookbookHtml = readFileSync(new URL("../public/apps/cookbook/index.html", import.meta.url), "utf8");
const kitchenHtml = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

/** The visible text of the spy-challenge section, whitespace-collapsed. */
function sectionText() {
  const dom = new JSDOM(cookbookHtml);
  const head = dom.window.document.getElementById("spy-manual-challenges");
  assert.ok(head, "cookbook has no section #spy-manual-challenges");
  let text = head.textContent;
  for (let el = head.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) {
    text += " " + el.textContent;
  }
  dom.window.close();
  return text.replace(/\s+/g, " ").trim();
}

test("the spy-manual challenge section exists and is well formed", () => {
  const dom = new JSDOM(cookbookHtml);
  try {
    const d = dom.window.document;
    const heads = [...d.querySelectorAll("h2")];
    const ids = heads.map((h) => h.id);
    assert.equal(new Set(ids).size, ids.length, "every h2 id must be unique");
    const s = d.getElementById("spy-manual-challenges");
    assert.ok(s, "section #spy-manual-challenges is missing");
    assert.equal(s.querySelector(".n").textContent.trim(), "24.");
    assert.ok(d.querySelector(".foot"), "the page still ends with its footer");
    assert.doesNotMatch(d.body.textContent, /&[a-z]+;/, "an HTML entity did not resolve");
    assert.doesNotMatch(d.body.textContent, /<div|<span|<h3/, "markup leaked into visible text");
  } finally {
    dom.window.close();
  }
});

test("the section text carries every figure the kitchen must reproduce", () => {
  const text = sectionText();
  const figures = [
    "978-1-910860-02-1",
    "16",
    "Uryyb, fcl jbeyq!",
    "Hello, spy world!",
    "FDHVDU",
    "CAESAR",
    "3-1-1, 2-1-2, 2-1-1, 1-6-1",
    "GOLD",
    "MEETING AT NOON",
    "JAAQFKC ZQ KLLK",
    "UXNTEEWIAZ",
    "CIPHER",
    "SPYMANUALS",
    "WEAREDISCOVEREDFLEEATONCE",
    "EVLN_ACDT_ESEA_ROFO_DEEC_WIREE",
    "MEETINGATNOONUNDERTHECLOCKTOWER",
    "IEETNMWTKOECLEHCOTOTANOGENUDRN_____R",
    "MEETINGATNOON",
    "MXEXEXTNIONOGNAT",
    "ATTACKATDAWN",
    "RSSRDERSBRNY",
    "SPYMEETSATTHREE",
    "TQ CN IU KL XB SZ PD MK IU",
    "SP YM EX ET SA TX TH RE EX",
    "CLOCK-S CLOCK-P CLOCK-Y",
    "CLK2-S CLK2-P CLK2-Y",
    "... --- ...",
    "S O S",
    "IAXUFG",
    "W/SW | NW/SW",
    "Sierra Papa Yankee",
    "01000001 01000010",
    "8:94@4?85:::9D",
    "gihcocngdiiihs",
    "tests/cyberchef-spy-challenge.test.mjs",
  ];
  for (const fig of figures) {
    assert.ok(text.includes(fig), `section text is missing the documented figure: ${fig}`);
  }
});

// --- live kitchen -----------------------------------------------------------
const dom = new JSDOM(kitchenHtml, {
  runScripts: "dangerously",
  url: "https://example.test/apps/cyberchef/",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.alert = () => undefined;
    window.confirm = () => false;
    window.prompt = () => null;
    window.URL.createObjectURL = () => "blob:spy-challenge-test";
    window.URL.revokeObjectURL = () => undefined;
  },
});
const w = dom.window;
after(() => w.close());

/** Runs one operation through the app's real recipe -> bake() pipeline. */
async function bakeOp(opId, args, input) {
  w.document.getElementById("input").value = input;
  return w.eval(`(async function(){
    recipe=[];
    const op = OPERATIONS.find(o=>o.id===${JSON.stringify(opId)});
    if (!op) throw new Error("no such op ${opId}");
    const item = { uid: ++opIdCounter, op, args: {} };
    op.args.forEach(a => { item.args[a.key] = a.default; });
    Object.assign(item.args, ${JSON.stringify(args || {})});
    recipe.push(item);
    await bake();
    const err = document.getElementById('out-error');
    if (err && err.style.display !== 'none') throw new Error(err.textContent);
    return document.getElementById('output').value;
  })()`);
}

test("shift warm-ups", async () => {
  assert.equal(await bakeOp("rot13", {}, "Uryyb, fcl jbeyq!"), "Hello, spy world!");
  assert.equal(await bakeOp("caesar", { shift: "3", mode: "decrypt" }, "FDHVDU"), "CAESAR");
});

test("book cipher extracts the documented coordinates", async () => {
  const ref =
    "The secret treasure is buried deep under the old oak tree\n" +
    "Look near the stone wall where the creek turns north\n" +
    "Geocaching mysteries require careful observation and patience";
  const out = await bakeOp("gcwBookCipher", {}, ref);
  assert.match(out, /Reference Text Lines : 3 lines \(28 total words\)/);
  assert.match(out, /Extracted Mystery Text : GOLD/);
});

test("keyed substitution round-trips with the ZEBRAS alphabet", async () => {
  const enc = await bakeOp("keyedSubstitution", { key: "ZEBRAS", mode: "encrypt" }, "MEETING AT NOON");
  assert.equal(enc, "JAAQFKC ZQ KLLK");
  assert.equal(await bakeOp("keyedSubstitution", { key: "ZEBRAS", mode: "decrypt" }, enc), "MEETING AT NOON");
  // Independent keyed alphabet: key word, then the remaining letters in order.
  const alphabet = [...new Set(("ZEBRAS" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ").split(""))].join("");
  assert.equal(alphabet, "ZEBRASCDFGHIJKLMNOPQTUVWXY");
});

test("Vigenere agrees with an independent A-Z implementation", async () => {
  const key = "CIPHER";
  const plain = "SPYMANUALS";
  let ct = "";
  for (let i = 0; i < plain.length; i++) {
    ct += String.fromCharCode(65 + ((plain.charCodeAt(i) - 65 + (key.charCodeAt(i % key.length) - 65)) % 26));
  }
  assert.equal(ct, "UXNTEEWIAZ", "the documented ciphertext must come from the standard rule");
  assert.equal(await bakeOp("vigenere", { key, mode: "decrypt" }, ct), plain);
});

test("columnar transposition round-trips and matches an independent decrypt", async () => {
  const plain = "WEAREDISCOVEREDFLEEATONCE";
  const enc = await bakeOp("coltrans", { key: "ZEBRAS", mode: "encrypt" }, plain);
  assert.equal(enc, "EVLN_ACDT_ESEA_ROFO_DEEC_WIREE");
  assert.equal(await bakeOp("coltrans", { key: "ZEBRAS", mode: "decrypt" }, enc), plain);
  // Independent decrypt: the key's alphabetical order decides which column
  // was read first when the ciphertext was written.
  const key = "ZEBRAS";
  const order = [...key].map((c, i) => [c, i]).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, i]) => i);
  const width = key.length;
  const rows = enc.length / width;
  const cols = Array.from({ length: width }, () => Array(rows).fill(""));
  order.forEach((colIdx, readNo) => {
    for (let r = 0; r < rows; r++) cols[colIdx][r] = enc[readNo * rows + r];
  });
  let out = "";
  for (let r = 0; r < rows; r++) for (let c = 0; c < width; c++) out += cols[c][r];
  assert.equal(out.replaceAll("_", ""), plain, "independent columnar decrypt must recover the plaintext");
});

test("double transposition and zigzag round-trip", async () => {
  const plain = "MEETINGATNOONUNDERTHECLOCKTOWER";
  const enc = await bakeOp("doubleTransposition", { key1: "ZEBRAS", key2: "CIPHER", mode: "encrypt" }, plain);
  assert.equal(enc, "IEETNMWTKOECLEHCOTOTANOGENUDRN_____R");
  assert.equal(await bakeOp("doubleTransposition", { key1: "ZEBRAS", key2: "CIPHER", mode: "decrypt" }, enc), plain);

  const zplain = "MEETINGATNOON";
  const zenc = await bakeOp("zigzagTransposition", { length: "8", mode: "encrypt" }, zplain);
  assert.equal(zenc, "MXEXEXTNIONOGNAT");
  assert.equal(await bakeOp("zigzagTransposition", { length: "8", mode: "decrypt" }, zenc), "MEETINGATNOONXXX");
});

test("Playfair decrypt is the textbook inverse of encrypt", async () => {
  const enc = await bakeOp("playfair", { key: "MONARCHY", mode: "encrypt" }, "ATTACKATDAWN");
  assert.equal(enc, "RSSRDERSBRNY");
  assert.equal(await bakeOp("playfair", { key: "MONARCHY", mode: "decrypt" }, enc), "ATTACKATDAWN");

  // Independent textbook Playfair (5x5, I/J merged, key word + alphabet fill).
  const square = (keyWord) => {
    const seen = new Set();
    let sq = "";
    for (const c of keyWord.replace(/[J]/g, "I")) if (!seen.has(c)) { seen.add(c); sq += c; }
    for (let cc = 65; cc <= 90; cc++) {
      const c = String.fromCharCode(cc);
      if (c === "J") continue;
      if (!seen.has(c)) { seen.add(c); sq += c; }
    }
    return sq;
  };
  const run = (text, keyWord, mode) => {
    const sq = square(keyWord);
    const pos = {};
    [...sq].forEach((c, i) => { pos[c] = [Math.floor(i / 5), i % 5]; });
    let t = text.replace(/J/g, "I");
    const pairs = [];
    let i = 0;
    while (i < t.length) {
      if (i === t.length - 1) { pairs.push(t[i] + "X"); i++; }
      else if (mode === "encrypt" && t[i] === t[i + 1]) { pairs.push(t[i] + "X"); i++; }
      else { pairs.push(t[i] + t[i + 1]); i += 2; }
    }
    const step = mode === "decrypt" ? 4 : 1;
    let out = "";
    for (const [a, b] of pairs) {
      const [r1, c1] = pos[a];
      const [r2, c2] = pos[b];
      if (r1 === r2) out += sq[r1 * 5 + ((c1 + step) % 5)] + sq[r2 * 5 + ((c2 + step) % 5)];
      else if (c1 === c2) out += sq[((r1 + step) % 5) * 5 + c1] + sq[((r2 + step) % 5) * 5 + c2];
      else out += sq[r1 * 5 + c2] + sq[r2 * 5 + c1];
    }
    return out;
  };
  assert.equal(run("ATTACKATDAWN", "MONARCHY", "encrypt"), enc, "independent square must agree");
  assert.equal(run(enc, "MONARCHY", "decrypt"), "ATTACKATDAWN", "independent inverse must agree");

  // The GCWizard bigram sibling keeps its pair structure through a round trip.
  const gcw = await bakeOp("gcwPlayfair", { op: "encode", keyword: "MONARCHY" }, "SPYMEETSATTHREE");
  const ct = gcw.match(/Playfair Output: (.*)$/m)[1];
  assert.equal(ct, "TQ CN IU KL XB SZ PD MK IU");
  const back = await bakeOp("gcwPlayfair", { op: "decode", keyword: "MONARCHY" }, ct);
  assert.equal(back.match(/Playfair Output: (.*)$/m)[1], "SP YM EX ET SA TX TH RE EX");
});

test("clock plate tables round-trip", async () => {
  const c = await bakeOp("gcwFicCicero", { table: "clocks", mode: "encode" }, "SPY");
  assert.equal(c, "CLOCK-S CLOCK-P CLOCK-Y");
  assert.equal(await bakeOp("gcwFicCicero", { table: "clocks", mode: "decode" }, c), "SPY");
  const k = await bakeOp("gcwPruinfClkToki", { table: "clk2", mode: "encode" }, "SPY");
  assert.equal(k, "CLK2-S CLK2-P CLK2-Y");
  assert.equal(await bakeOp("gcwPruinfClkToki", { table: "clk2", mode: "decode" }, k), "SPY");
});

test("the preface-hinted toolset round-trips", async () => {
  assert.equal(await bakeOp("morse", { mode: "encode" }, "SOS"), "... --- ...");
  assert.equal(await bakeOp("morse", { mode: "decode" }, "... --- ..."), "S O S");

  const fm = await bakeOp("fractionatedMorse", { key: "ROUNDTABLE", mode: "encrypt" }, "MEETING");
  assert.equal(fm, "IAXUFG");
  assert.equal(await bakeOp("fractionatedMorse", { key: "ROUNDTABLE", mode: "decrypt" }, fm), "MEETING");

  const braille = await bakeOp("gcwBraille", { op: "encode" }, "CODE");
  assert.match(braille, /Braille Out : ⠉ ⠕ ⠙ ⠑/);
  const brailleBack = await bakeOp("gcwBraille", { op: "decode" }, "⠉ ⠕ ⠙ ⠑");
  assert.match(brailleBack, /Decoded Text\s+: CODE/);

  const sema = await bakeOp("gcwSemaphore", { op: "encode" }, "HI");
  assert.match(sema, /Semaphore Out: W\/SW {2}\| {2}NW\/SW/);
  const semaBack = await bakeOp("gcwSemaphore", { op: "decode" }, "W/SW  |  NW/SW");
  assert.match(semaBack, /Decoded Text\s+: HI/);

  assert.equal(await bakeOp("gcwSymbolMore", { table: "nato", mode: "encode" }, "SPY"), "Sierra Papa Yankee");
  assert.equal(await bakeOp("gcwSymbolMore", { table: "nato", mode: "decode" }, "Sierra Papa Yankee"), "SPY");
});

test("binary plumbing and the rot47 probe", async () => {
  assert.equal(await bakeOp("toBinary", {}, "AB"), "01000001 01000010");
  assert.equal(await bakeOp("fromBinary", {}, "01000001 01000010"), "AB");
  assert.equal(await bakeOp("rot47", {}, "8:94@4?85:::9D"), "gihcocngdiiihs");
});
