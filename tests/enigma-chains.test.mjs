// Enigma indicator chains — the 1932 Polish pairing analysis, checked against the two
// worked examples printed in R. F. Churchhouse, Codes and Ciphers: Julius Caesar, the
// Enigma and the internet (Cambridge University Press, 2004), ch. 9 "The indicator
// chains in the Enigma", pp. 125-126.
//
// The book's own text is the control:
//   * Example 9.1 (the 12-letter mini-Enigma): "We see that there are two chains of 5
//     different letters and two chains of just 1 letter", printing AKJCI and BLFGE and
//     the two single-letter chains.
//   * Example 9.2 (26 doublets from an actual Enigma): "Starting with A we have the
//     chain ABQNUMLPIR of length 10. Since C hasn't occurred we now start with that and
//     find CDKSJTVYGH, also of length 10." The remaining six doublets close out as EZ,
//     WX and the fixed points FF and OO; the chain-length multiset is 10, 10, 2, 2, 1, 1,
//     which is the pairing property the chapter is about.
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
      window.URL.createObjectURL = () => "blob:enigma-chains-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const op = dom.window.eval("OPERATIONS").find((entry) => entry.id === "enigmaChains");
  assert.ok(op, "enigmaChains is registered");
  const run = (input, changes = {}) => {
    const args = Object.fromEntries(op.args.map((arg) => [arg.key, arg.default]));
    Object.assign(args, changes);
    return op.run(input, args);
  };
  return { dom, run };
}

// Example 9.1 — the 12-letter mini-Enigma, doublets as printed.
const EX91 = "AK BL CI DD EB FG GE HH IA JC KJ LF";
// Example 9.2 — "the following set of 26, sorted by the first letter".
const EX92 = "AB BQ CD DK EZ FF GH HC IR JT KS LP ML NU OO PI QN RA SJ TV UM VY WX XW YG ZE";

test("Example 9.1: two chains of five letters and two of one, as the book states", () => {
  const { dom, run } = boot();
  try {
    const out = run(EX91);
    assert.match(out, /^════ Enigma indicator chains ════$/m);
    assert.match(out, /Doublets {3}: 12, 12 distinct first letters — no letter starts two doublets/);
    assert.match(out, /Chain 1 {3}: AKJCI +length 5 +closed — IA returns to A/);
    assert.match(out, /Chain 2 {3}: BLFGE +length 5 +closed — EB returns to B/);
    assert.match(out, /Chain 3 {3}: DD +length 1 +fixed point/);
    assert.match(out, /Chain 4 {3}: HH +length 1 +fixed point/);
    assert.match(out, /Lengths {4}: 5, 5, 1, 1 — every length occurs an even number of times/);
    // The pairing is the point of the analysis, and it must be visible in the report.
    assert.match(out, /Structure {2}: 2 closed chains, 0 open, 2 fixed points; longest 5 letters, shortest 1/);
  } finally { dom.window.close(); }
});

test("Example 9.2: the two printed length-10 chains, then the remaining doublets", () => {
  const { dom, run } = boot();
  try {
    const out = run(EX92);
    assert.match(out, /Chain 1 {3}: ABQNUMLPIR +length 10 +closed — RA returns to A/);
    assert.match(out, /Chain 2 {3}: CDKSJTVYGH +length 10 +closed — HC returns to C/);
    // Beyond the two chains the book prints, the same rule closes the set out exactly:
    assert.match(out, /Chain 3 {3}: EZ +length 2 +closed — ZE returns to E/);
    assert.match(out, /Chain 4 {3}: FF +length 1 +fixed point/);
    assert.match(out, /Chain 5 {3}: OO +length 1 +fixed point/);
    assert.match(out, /Chain 6 {3}: WX +length 2 +closed — XW returns to W/);
    assert.match(out, /Doublets {3}: 26, 26 distinct first letters/);
    assert.match(out, /Lengths {4}: 10, 10, 2, 1, 1, 2 — every length occurs an even number of times/);
    assert.match(out, /Source {5}: R\. F\. Churchhouse/);
  } finally { dom.window.close(); }
});

test("continuous cipher text is cut into the same doublets, and an odd input is refused", () => {
  const { dom, run } = boot();
  try {
    const continuous = EX91.replace(/[^A-Za-z]/g, "");
    assert.equal(continuous.length, 24, "the mini-Enigma set is 12 doublets");
    const out = run(continuous, { mode: "text" });
    for (const chain of ["AKJCI", "BLFGE", "DD", "HH"]) {
      assert.ok(out.includes(chain), `continuous mode still finds ${chain}`);
    }
    assert.match(out, /Lengths {4}: 5, 5, 1, 1/);
    // One letter short of a doublet is refused rather than silently shifted.
    assert.throws(() => run(continuous.slice(0, -1), { mode: "text" }), /even number of letters/);
    assert.throws(() => run("AK BL CI D", {}), /odd number of letters/);
    assert.throws(() => run("   ", {}), /No letters in the input/);
  } finally { dom.window.close(); }
});

test("a partial batch is reported as an open chain and loses the pairing property", () => {
  const { dom, run } = boot();
  try {
    // Drop the fixed point HH from the mini-Enigma set: the two 5-chains pair with each
    // other but the surviving fixed point DD has no partner, so the property must fail.
    const partial = "AK BL CI DD EB FG GE IA JC KJ LF";
    const out = run(partial);
    assert.match(out, /Doublets {3}: 11, 11 distinct first letters/);
    assert.match(out, /Lengths {4}: 5, 5, 1 — at least one length occurs an odd number of times/);
    assert.match(out, /partial or corrupted set/);
    // Dropping the return doublet instead leaves a chain that simply stops.
    const open = run(EX92.split(" ").filter((d) => d !== "ZE").join(" "));
    assert.match(open, /Chain 3 {3}: EZ +length 2 +open — no doublet starts with "Z"/);
    assert.match(open, /Structure {2}: 3 closed chains, 1 open, 2 fixed points/);
  } finally { dom.window.close(); }
});
