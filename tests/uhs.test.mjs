// UHS88a reader (T3.1): cipher known-answer + synthetic-fixture parse tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decrypt88a, encrypt88a, parseUhs88a } from "../js/uhs.js";

test("88a cipher matches the published worked example and round-trips", () => {
  // Stefan Wolff's dissection: "gHrGtGs iqrGr" decrypts to "Opening Scene".
  assert.equal(decrypt88a("gHrGtGs iqrGr"), "Opening Scene");
  for (let p = 32; p <= 126; p++) {
    const ch = String.fromCharCode(p);
    assert.equal(decrypt88a(encrypt88a(ch)), ch, `round-trip for code ${p}`);
  }
});

function fixture() {
  // A tiny Borrowed-Time-shaped file, authored with the cipher itself.
  // Layout (stored numbering starts after the 4-line header; actual = stored + 4):
  //  main list (actual 5-8): "Chapter One" -> sublist at actual 9 (stored 5),
  //    "Loose End" -> question group at actual 16 (stored 12)
  //  sublist (actual 9-12): "First puzzle" -> hints at actual 13 (stored 9),
  //    "Second puzzle" -> hints at actual 15 (stored 11)
  //  hints: actual 13..19 — groups of 2 (13-14), 1 (15) and 4 (16-19)
  const L = [];
  L.push("UHS", "Test Game", "9", "15");
  L.push(encrypt88a("Chapter One"), "5");
  L.push(encrypt88a("Loose End"), "12");
  L.push(encrypt88a("First puzzle"), "9");
  L.push(encrypt88a("Second puzzle"), "11");
  L.push(encrypt88a("Try the door."), encrypt88a("It is locked. Look under the mat."));
  L.push(encrypt88a("The key is under the mat."));
  L.push(encrypt88a("A gentle nudge."), encrypt88a("A firm push."), encrypt88a("It swings open!"));
  L.push(encrypt88a("Final hint."));
  return L.join("\r\n") + "\r\n";
}

test("parser builds the section/question tree with progressive hint groups", () => {
  const doc = parseUhs88a(fixture());
  assert.equal(doc.format, "UHS88a");
  assert.equal(doc.title, "Test Game");
  assert.equal(doc.items.length, 2);
  const [chapter, loose] = doc.items;
  assert.equal(chapter.type, "section");
  assert.equal(chapter.label, "Chapter One");
  assert.deepEqual(chapter.items.map((i) => i.label), ["First puzzle", "Second puzzle"]);
  assert.deepEqual(chapter.items[0].hints, ["Try the door.", "It is locked. Look under the mat."]);
  assert.deepEqual(chapter.items[1].hints, ["The key is under the mat."]);
  assert.equal(loose.type, "question");
  assert.deepEqual(loose.hints, ["A gentle nudge.", "A firm push.", "It swings open!", "Final hint."]);
});

test("parser tolerates LF endings and refuses 91a+ and non-UHS input", () => {
  const doc = parseUhs88a(fixture().replaceAll("\r\n", "\n"));
  assert.equal(doc.title, "Test Game");
  assert.throws(() => parseUhs88a("UHS\nT\n1\n2\nx\n** END OF 88A FORMAT **\n"), /OpenUHS/);
  assert.throws(() => parseUhs88a("NOPE\nT\n1\n2\n"), /magic/);
});
