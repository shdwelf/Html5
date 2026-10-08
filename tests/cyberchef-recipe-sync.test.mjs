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

test("merged CyberChef keeps both repositories' recipe sets", () => {
  const { ops, ids, packs } = boot();
  assert.equal(new Set(ids).size, ids.length, "operation ids must stay unique");
  assert.equal(ids.length, report.counts.mergedRuntime);
  assert.equal(ops.length, report.counts.mergedRuntime);
  assert.match(html, new RegExp(`HTML5 · ${report.counts.mergedRuntime} recipes`));

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
