// Tests for tools/cow_level_xgrep.mjs — the string-sweep side of the Diablo
// "secret cow level" investigation (docs/john-ghidra-diablo-research.md).
// Fixtures are synthetic strings from the published record; no game data
// ships with the repo. See also tests/sierra-xgrep.test.mjs (same scanner).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { scanBuffer, scanDirectory } from "../tools/sierra_xgrep.mjs";
import { COW_NEEDLES, profileReport } from "../tools/cow_level_xgrep.mjs";

test("D1 click dialogue is recognized (documented Tristram cow lines)", () => {
  const buf = Buffer.from("Say: Yup, that's a cow all right! ... I am not thirsty!", "latin1");
  const hits = scanBuffer(buf, COW_NEEDLES);
  const ids = hits.map((h) => h.id).sort();
  assert.deepEqual(ids, ["d1-cow-click-1", "d1-cow-click-2"]);
});

test("a D1-style corpus profiles as interaction-without-level", () => {
  const report = [{ file: "DIABLO.EXE", hits: scanBuffer(Buffer.from("that's a cow ... not thirsty", "latin1"), COW_NEEDLES) }];
  const p = profileReport(report);
  assert.equal(p.click, true);
  assert.equal(p.level, false);
  assert.match(p.verdict, /documented profile/);
});

test("D2-era cow content profiles as real cow-level material", () => {
  const buf = Buffer.from("The Secret Cow Level: Moo Moo Farm, Hell Bovines, Cow King, Wirt's Leg", "latin1");
  const report = [{ file: "D2DATA.MPQ", hits: scanBuffer(buf, COW_NEEDLES) }];
  const p = profileReport(report);
  assert.equal(p.click, false);
  assert.equal(p.level, true);
  assert.match(p.verdict, /D2-era/);
  const levelIds = p.byExpect["cow-level"].map((h) => h.id).sort();
  assert.ok(levelIds.includes("moo-moo-farm") && levelIds.includes("hell-bovine") &&
    levelIds.includes("wirts-leg") && levelIds.includes("cow-king"));
});

test("the StarCraft denial cheat and Hellfire quest hooks are classed apart", () => {
  const buf = Buffer.from("cheat: THERE IS NO COW LEVEL. Also command.txt unlocks Jersey", "latin1");
  const report = [{ file: "STAR.EXE", hits: scanBuffer(buf, COW_NEEDLES) }];
  const p = profileReport(report);
  assert.equal(p.byExpect["starcraft"].length, 1);
  assert.equal(p.byExpect["hellfire"].length >= 1, true);
  assert.match(p.byExpect["starcraft"][0].context, /THERE IS NO COW LEVEL/i);
});

test("clean corpus says so; scanDirectory works end to end", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "cow-xgrep-"));
  try {
    await writeFile(path.join(dir, "TEXT.DAT"), "the church stands in tristram");
    await writeFile(path.join(dir, "COW.TXT"), "I am not thirsty! then moo");
    const report = await scanDirectory(dir, COW_NEEDLES);
    const p = profileReport(report);
    assert.equal(p.click, true);
    assert.equal(p.level, false);
    assert.equal(p.byExpect["d1-click"].length, 1);
    // empty corpus wording
    const none = profileReport([{ file: "x", hits: [] }]);
    assert.match(none.verdict, /neither/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
