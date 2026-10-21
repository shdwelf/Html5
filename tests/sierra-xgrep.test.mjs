// Tests for tools/sierra_xgrep.mjs — the cross-title string sweep that
// implements the round-5 sweep recommendation (grep sibling Sierra titles'
// known Easter-egg strings across a resource corpus). Fixtures are synthetic;
// no game data ships with the repo. See
// docs/sierra-shadow-president-sweep-2026-10-21.md §2.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  EGG_STRINGS, scanBuffer, scanDirectory, renderReport,
} from "../tools/sierra_xgrep.mjs";

test("scanBuffer finds documented egg strings case-insensitively with context", () => {
  const buf = Buffer.concat([
    Buffer.from("padding before the door password ", "latin1"),
    Buffer.from("Ken Sent Me", "latin1"),
    Buffer.from(" then more text", "latin1"),
  ]);
  const hits = scanBuffer(buf);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "ken-sent-me");
  assert.equal(hits[0].offset, 33);
  assert.ok(hits[0].context.includes("Ken Sent Me"));
});

test("scanBuffer matches several needles and skips absent ones", () => {
  const buf = Buffer.from("SIGNED BY MARK CROWE, ALSO RICK CAVIN ON DISK", "latin1");
  const hits = scanBuffer(buf);
  const ids = hits.map((h) => h.id).sort();
  assert.deepEqual(ids, ["crowe", "rick-cavin"]);
  // first-hit-only semantics: one row per needle
  const twice = scanBuffer(Buffer.from("CROWE and again CROWE", "latin1"));
  assert.equal(twice.length, 1);
  assert.equal(twice[0].offset, 0);
});

test("scanBuffer supports custom needles and ignores high-bit noise", () => {
  const buf = Buffer.from([0x60, 0xea, 0x41, 0x42, 0x00, 0xff, 0x43, 0x49, 0x54, 0x59]);
  const hits = scanBuffer(buf, [{ id: "x", needle: "ab\x00\xffci" }]);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].offset, 2);
});

test("EGG_STRINGS is conservative and sourced", () => {
  assert.ok(EGG_STRINGS.length >= 8);
  for (const n of EGG_STRINGS) {
    assert.ok(n.needle.length >= 4, `${n.id} needle long enough to be distinctive`);
    assert.ok(n.source, `${n.id} has provenance`);
    assert.ok(n.note, `${n.id} has a note`);
  }
  // no generic single words
  for (const n of EGG_STRINGS) assert.ok(!["KEN", "SCOTT", "GRAHAM"].includes(n.needle));
});

test("scanDirectory + renderReport walk a synthetic corpus", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "sierra-xgrep-"));
  try {
    await writeFile(path.join(dir, "LOGIC.003"), "message: KEN SENT ME please");
    await writeFile(path.join(dir, "ROOM.EXE"), Buffer.from("MZ\x90\x00CROWE\x00garbage"));
    await writeFile(path.join(dir, "clean.bin"), "nothing interesting here");
    const report = await scanDirectory(dir);
    assert.equal(report.length, 3);
    const byFile = Object.fromEntries(report.map((r) => [r.file, r.hits]));
    assert.deepEqual(byFile["LOGIC.003"].map((h) => h.id), ["ken-sent-me"]);
    assert.deepEqual(byFile["ROOM.EXE"].map((h) => h.id), ["crowe"]);
    assert.equal(byFile["clean.bin"].length, 0);
    const lines = [];
    const counts = renderReport(report, (s) => lines.push(s));
    assert.equal(counts.hits, 2);
    assert.equal(counts.files, 3);
    assert.ok(lines.some((l) => l.includes("LOGIC.003") && l.includes("ken-sent-me")));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
