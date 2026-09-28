// Guards the source-check pass applied to the Sanborn installation viewer
// (public/apps/kryptos-vrml/index.html) on 28 September 2026.
//
//   node --test tests/sanborn-viewer-sources.test.mjs
//
// The viewer is a single self-contained HTML file with one inline <script>.
// These tests read that script, evaluate only the SCULPTURES literal, and
// assert the facts that were verified against published sources — so a later
// edit cannot quietly reintroduce the two errors that were fixed.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const VIEWER = new URL("../public/apps/kryptos-vrml/index.html", import.meta.url);
const html = readFileSync(VIEWER, "utf8");

function loadSculptures() {
  const start = html.indexOf("const SCULPTURES = {");
  assert.notEqual(start, -1, "SCULPTURES registry not found");
  const open = html.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < html.length; i += 1) {
    const c = html[i];
    if (c === "'" || c === '"') {
      // skip string literals, honouring backslash escapes
      const quote = c;
      i += 1;
      while (i < html.length && html[i] !== quote) i += html[i] === "\\" ? 2 : 1;
      continue;
    }
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  assert.ok(end > open, "could not balance the SCULPTURES object literal");
  // eslint-disable-next-line no-new-func
  return new Function(`return (${html.slice(open, end)});`)();
}

const SCULPTURES = loadSculptures();

test("the viewer carries the eleven Sanborn sites, Lingua among them", () => {
  const keys = Object.keys(SCULPTURES);
  assert.equal(keys.length, 11);
  for (const k of ["kryptos", "entrance", "berlin_wall", "cyrillic", "coastline",
    "indian_run", "antipodes", "lingua", "atomic_time", "nsa_museum", "find_lodestone"]) {
    assert.ok(keys.includes(k), `missing installation: ${k}`);
  }
});

test("every installation records what is verified and where it came from", () => {
  for (const [key, sc] of Object.entries(SCULPTURES)) {
    assert.equal(typeof sc.verified, "string", `${key}: no verified line`);
    assert.ok(sc.verified.length > 40, `${key}: verified line is too thin to be useful`);
    assert.ok(Array.isArray(sc.sources) && sc.sources.length > 0, `${key}: no sources`);
    for (const entry of sc.sources) {
      assert.equal(entry.length, 2, `${key}: source entries are [label, url]`);
      assert.ok(entry[0].length > 8, `${key}: source label too short`);
      assert.match(entry[1], /^https:\/\//, `${key}: source url must be https`);
    }
  }
});

test("Lingua names the venue as it is named today, and dates the renaming", () => {
  const l = SCULPTURES.lingua;
  assert.match(l.loc, /Walter E\. Washington Convention Center/);
  assert.equal(l.year, "2002");
  assert.match(l.desc, /16-foot bronze cylinders/);
  assert.match(l.desc, /Ethiopic/);
  assert.doesNotMatch(l.desc, /Ethiopian/, "‘Ethiopian’ is not the name of the script");
  assert.match(l.desc, /Lantingji Xu/);
  assert.ok(l.clues.some((c) => /renamed it the Walter E\. Washington Convention Center in 2007/.test(c)),
    "the 2002 installation / 2003 opening / 2007 renaming sequence must stay on the record");
  assert.ok(l.clues.some((c) => /only sourced dimension/.test(c)),
    "the model must keep saying which measurement is sourced");
});

test("the Cyrillic Projector is at UNC Charlotte, not in a private collection", () => {
  const c = SCULPTURES.cyrillic;
  assert.match(c.loc, /University of North Carolina, Charlotte/);
  assert.doesNotMatch(c.loc, /Private collection/);
  assert.match(c.year, /1997/);
  assert.ok(c.clues.some((x) => /CORRECTION \(Sept 2026\)/.test(x)),
    "the correction should stay visible to the reader, not be silently swapped");
});

test("the K4 panel does not present the archive find as a cryptanalytic solve", () => {
  const start = html.indexOf("2025 BREAKTHROUGH:");
  assert.notEqual(start, -1);
  const block = html.slice(start, start + 1800);
  assert.match(block, /\$962,500/);
  assert.match(block, /sealed until 2075/);
  assert.match(block, /SINCE THE SALE \(2026\)/);
  assert.match(block, /has still not been broken/);
});

test("the panel renders the sources section", () => {
  assert.match(html, /id="sec-sources"/);
  assert.match(html, /SOURCES &amp; VERIFICATION/);
  assert.match(html, /getElementById\('p-sources'\)/);
  assert.match(html, /getElementById\('p-verified'\)/);
});
