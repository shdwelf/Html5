// Round-14: spotlight coverage — every registered operation must appear in at
// least one thematic (non-"Full Coverage" tour) pack, so nothing is
// discoverable only via the category tours. The tour-only definition mirrors
// scripts/compare-cyberchef-recipe-packs.mjs --spotlights (an op is tour-only
// when every pack containing it matches /full coverage/i); round 14 closed
// the last 85 (docs/backlog-execution-round-14-2026-10-22.md). JSDOM harness
// pattern follows tests/cyberchef-polyglot-scan.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const appHtml = readFileSync(new URL("../public/apps/cyberchef/index.html", import.meta.url), "utf8");

function boot() {
  const dom = new JSDOM(appHtml, {
    runScripts: "dangerously",
    url: "https://example.test/apps/cyberchef/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => undefined;
      window.confirm = () => false;
      window.prompt = () => null;
      window.URL.createObjectURL = () => "blob:spotlight-coverage-test";
      window.URL.revokeObjectURL = () => undefined;
    },
  });
  const data = JSON.parse(dom.window.eval(`JSON.stringify((() => {
    const packs = {};
    for (const [name, entries] of Object.entries(RECIPE_PACKS))
      packs[name] = entries.map((e) => e[0]);
    return { ids: OPERATIONS.map((o) => o.id), packs };
  })())`));
  dom.window.close();
  return data;
}

test("no operation is tour-only (Full Coverage packs only)", () => {
  const { ids, packs } = boot();
  const isTour = (name) => /full coverage/i.test(name);
  const tourOnly = ids.filter((id) => {
    const where = Object.keys(packs).filter((n) => packs[n].includes(id));
    return where.length > 0 && where.every(isTour);
  });
  assert.deepEqual(tourOnly, [], `tour-only ops remain: ${tourOnly.join(", ")}`);
  const orphans = ids.filter((id) => !Object.values(packs).some((list) => list.includes(id)));
  assert.deepEqual(orphans, [], `ops in no pack: ${orphans.join(", ")}`);
});

test("round-14 spotlight packs exist and resolve", () => {
  const { ids, packs } = boot();
  const known = new Set(ids);
  const expected = {
    "Spotlight — Electronics lab (logic gates · adder · 7-segment · truth tables)":
      ["icAND", "icOR", "icXOR", "icNAND", "icNOR", "icXNOR", "icNOT", "icAdder", "ic7seg", "icTruth"],
    "Spotlight — Recipe pack loader": ["recipePack"],
    "Spotlight — Wallets & secret sharing (BIP-39 · BIP-44 haiku · Shamir)":
      ["bip39", "haikub44", "shamir"],
  };
  for (const [name, members] of Object.entries(expected)) {
    assert.ok(Array.isArray(packs[name]), `missing pack: ${name}`);
    assert.deepEqual(packs[name], members);
  }
  for (const [name, list] of Object.entries(packs)) {
    if (!name.startsWith("Spotlight —")) continue;
    for (const id of list) assert.ok(known.has(id), `spotlight pack "${name}" references unknown op ${id}`);
  }
});
