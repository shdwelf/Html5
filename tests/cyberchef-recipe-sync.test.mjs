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
  // The 2026-10-07 Html5 <-> Html5-sync-incoming merge produced counts.mergedRuntime
  // operations. The build has grown locally since (QR Code + Avery label sheet),
  // so the registry must be a superset of the merge, never a subset of it.
  assert.ok(ids.length >= report.counts.mergedRuntime,
    `registry (${ids.length}) must not lose operations from the merge (${report.counts.mergedRuntime})`);
  assert.equal(ops.length, ids.length);
  assert.match(html, new RegExp(`HTML5 · ${ids.length} recipes`), "header count matches the registry");

  // Every operation the merge contributed is still present.
  for (const id of report.onlyPorter) {
    assert.ok(ids.includes(id), `lost merged recipe ${id}`);
  }
  // Locally added after the merge.
  for (const id of ["qr", "averyLabels"]) {
    assert.ok(ids.includes(id), `missing locally added recipe ${id}`);
  }

  // Six Crow/field-cipher recipes were the original sync-outgoing payload.
  for (const id of ["enigmaM4", "secomSchedule", "odPoemKey", "secomExact", "iocFitness", "plugboardHillClimb"]) {
    assert.ok(ids.includes(id), `missing synced recipe ${id}`);
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
