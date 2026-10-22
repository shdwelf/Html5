import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../js/book-builder.js", import.meta.url), "utf8");

function blockFor(marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing source marker: ${marker}`);
  const end = source.indexOf("\n      },", start);
  assert.notEqual(end, -1, `unterminated seed block: ${marker}`);
  return source.slice(start, end);
}

test("2003 Corolla memory preserves the user's account without inventing the route", () => {
  const artifact = blockFor('signature: "5bzz601"');
  assert.match(artifact, /Gray 4-door 2003 Corolla S-type/);
  assert.match(artifact, /Toyota pickup with a camper shell/);
  assert.match(artifact, /could not afford the truck's gas/);
  assert.match(artifact, /summer place/);
  assert.match(artifact, /exact truck model\/year, summer-place location, and route are not remembered/);
  assert.match(artifact, /explicitly authorized public inclusion/);
  assert.match(artifact, /July–December 2004/);

  const milestone = blockFor('id: "milestone-seed-corolla-truck-swap-2003"');
  assert.match(milestone, /era: "2003 \(user recollection\)"/);
  assert.match(milestone, /place: ""/);
  assert.match(milestone, /no map route is inferred/);
});
