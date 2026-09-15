import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cascadePosition, tilePositions } from "../js/project-y-4dwm.js";

test("cascade placement stays on screen and steps", () => {
  for (let i = 0; i < 24; i++) {
    const { left, top } = cascadePosition(i, 1280, 800);
    assert.ok(left >= 16 && left <= 1280 - 220, `left ${left}`);
    assert.ok(top >= 16 && top <= 800 - 120, `top ${top}`);
  }
  const a = cascadePosition(0, 1280, 800);
  const b = cascadePosition(1, 1280, 800);
  assert.notDeepEqual(a, b);
  assert.deepEqual(cascadePosition(0, 1280, 800), cascadePosition(8, 1280, 800));
});

test("tile placement covers every pip within the viewport", () => {
  for (const count of [1, 3, 7, 12]) {
    const spots = tilePositions(count, 1440, 900);
    assert.equal(spots.length, count);
    for (const { left, top } of spots) {
      assert.ok(left >= 0 && left < 1440);
      assert.ok(top >= 0 && top < 900);
    }
  }
  assert.equal(tilePositions(0, 1440, 900).length, 0);
});

test("the badge archive loads the 4Dwm and one pip loads per card", () => {
  const html = readFileSync(new URL("../los-alamos.html", import.meta.url), "utf8");
  assert.match(html, /css\/project-y-4dwm\.css/);
  assert.match(html, /id="pip-layer"/);
  assert.match(html, /id="wm4d"/);
  assert.match(html, /data-wm4d="tile"/);
  assert.match(html, /data-wm4d="clear"/);
  assert.match(html, /id="pip-results"/);
  const app = readFileSync(new URL("../js/los-alamos.js", import.meta.url), "utf8");
  assert.match(app, /initPipWm/);
  assert.match(app, /function openRecord\(id\)\{wm\.spawn\(id\);\}/);
  // PIP bodies share the record markup; the save control is class-based so
  // many pip windows can hold the same record shape without duplicate IDs.
  assert.doesNotMatch(app, /id="detail-save"/);
  assert.match(app, /class="outline detail-save"/);
});

test("pip windows keep their own escape hatch and window controls", () => {
  const wm = readFileSync(new URL("../js/project-y-4dwm.js", import.meta.url), "utf8");
  assert.match(wm, /data-act="min"/);
  assert.match(wm, /data-act="icon"/);
  assert.match(wm, /data-act="close"/);
  assert.match(wm, /Escape/);
  assert.match(wm, /spawnAll/);
});
