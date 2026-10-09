import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");
const report = JSON.parse(readFileSync(new URL("../docs/cyberchef-recipe-sync-2026-10-07.json", import.meta.url), "utf8"));

function boot() {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:cyberchef-sync-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const ops = dom.window.eval("OPERATIONS");
  const ids = ops.map((op) => op.id);
  const packs = dom.window.eval("RECIPE_PACKS");
  dom.window.close();
  return { ops, ids, packs };
}

// Operations added after the 2026-10-07 merge baseline recorded in docs/.
// The report stays a faithful record of what the merge produced; the kitchen has
// since grown, so the expected total is baseline + these additions.
const POST_MERGE_OPS = ["qrcode", "averyLabels"];

test("merged CyberChef keeps both repositories' recipe sets", () => {
  const { ops, ids, packs } = boot();
  const expectedTotal = report.counts.mergedRuntime + POST_MERGE_OPS.length;
  assert.equal(new Set(ids).size, ids.length, "operation ids must stay unique");
  for (const id of POST_MERGE_OPS) {
    assert.ok(ids.includes(id), `missing post-merge recipe ${id}`);
  }
  assert.equal(ids.length, expectedTotal);
  assert.equal(ops.length, expectedTotal);
  assert.match(html, new RegExp(`HTML5 · ${expectedTotal} recipes`));

  // Six Crow/field-cipher recipes were the original sync-outgoing payload.
  for (const id of ["enigmaM4", "secomSchedule", "odPoemKey", "secomExact", "iocFitness", "plugboardHillClimb"]) {
    assert.ok(ids.includes(id), `missing synced recipe ${id}`);
  }

  // Html5-only research recipes survive the incoming-base merge.
  for (const id of report.onlyPorter) {
    assert.ok(ids.includes(id), `missing Html5-only recipe ${id}`);
  }

  // Incoming-only upstream/research recipes are present too.
  for (const id of ["gcwBraille", "primesFactor", "tspSolve", "danBrownAll", "britFieldPoems", "midiParse"]) {
    assert.ok(ids.includes(id), `missing incoming-only recipe ${id}`);
  }

  // Recipe packs were unioned, not overwritten.
  assert.ok(Array.isArray(packs["Classical Deep Dive — Fractionation & Checkerboards"]));
  assert.ok(Array.isArray(packs["EXE Packer Triage & LZEXE Unpack (Ghidra-verified)"]));
  const fieldPack = packs["Field Ciphers — SECOM & OD Poem Code"].map((entry) => entry[0]);
  assert.ok(fieldPack.includes("secomSchedule"));
  assert.ok(fieldPack.includes("straddlingCheckerboard"));
  assert.ok(fieldPack.includes("doubleColumn"));
});

test("every operation appears in at least one pack", () => {
  const { ids, packs } = boot();
  const packed = new Set();
  for (const entries of Object.values(packs))
    for (const [id] of entries) packed.add(id);
  const orphaned = ids.filter((id) => !packed.has(id));
  // Spread first: a JSDOM-realm array fails deepEqual against a Node one even
  // when the contents match.
  assert.deepEqual([...orphaned], [], `operations in no pack (SFX select-all drops them): ${orphaned.join(", ")}`);
});
