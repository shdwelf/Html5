import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import "../js/book-builder-retrowave.js";

const retro = globalThis.BookBuilderRetrowave;
const html = readFileSync(new URL("../book-builder.html", import.meta.url), "utf8");
const source = readFileSync(new URL("../js/book-builder.js", import.meta.url), "utf8");

test("timeline years are explicit and unknown eras stay undated", () => {
  assert.equal(retro.parseTimelineYear("2003 (user recollection)"), 2003);
  assert.equal(retro.parseTimelineYear("1997–2001 · Glendora"), 1997);
  assert.equal(retro.parseTimelineYear("Middle-school science-camp years"), null);
  assert.deepEqual(retro.sortTimelineItems([
    { id: "unknown", year: null, era: "later residence years", label: "1803 E. Big Dalton Canyon Rd" },
    { id: "2003", era: "2003 (user recollection)" },
    { id: "2001", year: 2001 }
  ]).map((item) => item.id), ["2001", "2003", "unknown"]);
});

test("route playback interpolates along the actual polyline by distance", () => {
  const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 30 }];
  assert.deepEqual(retro.pointAlongPolyline(points, -1), { x: 0, y: 0 });
  assert.deepEqual(retro.pointAlongPolyline(points, 0), { x: 0, y: 0 });
  assert.deepEqual(retro.pointAlongPolyline(points, 0.5), { x: 10, y: 10 });
  assert.deepEqual(retro.pointAlongPolyline(points, 1), { x: 10, y: 30 });
  assert.equal(retro.pointAlongPolyline([], 0.5), null);
});

test("Book Builder exposes an 8-bit chronology and only animates imported route data", () => {
  assert.match(html, /8-bit personal timeline/);
  assert.match(html, /Play timeline/);
  assert.match(html, /Play selected route/);
  assert.match(html, /2003 Corolla memory has no confirmed start or end coordinates/);
  assert.match(source, /RETRO\.pointAlongPolyline/);
  assert.match(source, /state\.googleTimeline\?\.paths/);
  assert.match(source, /Toyota pickup → gray Corolla fuel-cost swap/);
  assert.match(source, /channel-data-systems-2004/);
  assert.match(source, /July–December 2004/);
  assert.match(source, /RETRO\.sortTimelineItems/);
  assert.match(source, /Place pins are not joined into an inferred route/);
});
