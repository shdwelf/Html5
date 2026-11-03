// Source-informed recipes: Sherlock Holmes's Dancing Men word-end flags and
// the Morse word separators used by the Nancy Drew tapping-code decoder.
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
      window.URL.createObjectURL = () => "blob:cyberchef-mystery-recipes-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const byId = new Map(dom.window.eval("OPERATIONS").map((op) => [op.id, op]));
  const run = (id, input = "", changes = {}) => {
    const op = byId.get(id);
    assert.ok(op, `operation ${id} is registered`);
    const args = Object.fromEntries(op.args.map((arg) => [arg.key, arg.default]));
    Object.assign(args, changes);
    return op.run(input, args);
  };
  return { dom, run };
}

function outputLine(result, prefix) {
  assert.equal(result?.__visual, true, "operation returns its visual report");
  const line = result.__text.split("\n").find((entry) => entry.startsWith(prefix));
  assert.ok(line, `visual report includes ${prefix}`);
  return line.slice(prefix.length).trim();
}

test("Dancing Men flags preserve word boundaries and round-trip text", () => {
  const { dom, run } = boot();
  try {
    // Independent fixed vector: D -> <o>|, A -> o/| plus U+005C; source-backed
    // flags belong only after the final figure of each word.
    const vector = outputLine(
      run("gcwDancingMen", "D A", { op: "encode", wordEnds: "flags" }),
      "Dancing Men Out: ",
    );
    assert.equal(vector, "<o>|⚑ o/|\\⚑");

    const plain = "ELSIE PREPARE TO MEET THY GOD";
    const encoded = run("gcwDancingMen", plain, { op: "encode", wordEnds: "flags" });
    const symbols = outputLine(encoded, "Dancing Men Out: ");
    assert.equal((symbols.match(/⚑/g) || []).length, 6, "one flag marks the end of each word");

    const decoded = run("gcwDancingMen", symbols, { op: "decode", wordEnds: "flags" });
    assert.equal(outputLine(decoded, "Decoded Text  : "), plain);
  } finally {
    dom.window.close();
  }
});

test("the Dancing Men stand-in alphabet is one-to-one and backwards-compatible by default", () => {
  const { dom, run } = boot();
  try {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const flagged = outputLine(
      run("gcwDancingMen", alphabet, { op: "encode", wordEnds: "flags" }),
      "Dancing Men Out: ",
    ).split(/\s+/);
    const unflaggedSymbols = flagged.map((symbol) => symbol.replace(/⚑$/, ""));
    assert.equal(flagged.length, 26);
    assert.equal(new Set(unflaggedSymbols).size, 26, "each letter has a distinct stand-in symbol");
    assert.equal(
      outputLine(run("gcwDancingMen", unflaggedSymbols.join(" "), { op: "decode", wordEnds: "flags" }), "Decoded Text  : "),
      alphabet,
    );

    const legacy = outputLine(run("gcwDancingMen", "TWO WORDS", { op: "encode" }), "Dancing Men Out: ");
    assert.doesNotMatch(legacy, /⚑/, "the old no-flag mode remains available and is the default");
    assert.equal(
      outputLine(run("gcwDancingMen", legacy, { op: "decode" }), "Decoded Text  : "),
      "TWOWORDS",
    );
  } finally {
    dom.window.close();
  }
});

test("Morse decoder preserves slash-separated word boundaries", () => {
  const { dom, run } = boot();
  try {
    const plain = "ATTACK AT DAWN";
    const encoded = run("morse", plain, { mode: "encode" });
    assert.equal(run("morse", encoded, { mode: "decode" }), plain);
    assert.equal(run("morse", ".... . / ... --- ...", { mode: "decode" }), "HE SOS");
    assert.equal(run("morse", "... --- ...", { mode: "decode" }), "S O S", "no-slash legacy output is unchanged");
  } finally {
    dom.window.close();
  }
});

test("book-inspired recipe packs select only the documented decoders", () => {
  const { dom } = boot();
  try {
    const packs = dom.window.eval("RECIPE_PACKS");
    assert.deepEqual(JSON.parse(JSON.stringify(packs["Sherlock Holmes — Dancing Men (word-end flags)"])), [
      ["gcwDancingMen", { op: "encode", wordEnds: "flags" }],
    ]);
    assert.deepEqual(JSON.parse(JSON.stringify(packs["Nancy Drew 16 — Tapping Heels (Morse decoder)"])), [
      ["morse", { mode: "decode" }],
    ]);
  } finally {
    dom.window.close();
  }
});
