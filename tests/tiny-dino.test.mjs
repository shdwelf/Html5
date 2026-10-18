import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

import {
  STEP,
  WORLD,
  autoplay,
  createState,
  run,
  runSpeedFor,
  scheduleObstacle,
  step,
} from "../js/tiny-dino-model.js";

const HTML = new URL("../public/apps/tiny-dino/index.html", import.meta.url);

test("the simulation is deterministic for a given seed", () => {
  const a = run(createState(1234), 1800);
  const b = run(createState(1234), 1800);
  assert.equal(a.score, b.score);
  assert.equal(a.t, b.t);
  assert.deepEqual(
    a.obstacles.map((o) => [o.x, o.w, o.h]),
    b.obstacles.map((o) => [o.x, o.w, o.h]),
  );
  // Without this the determinism test would pass on an empty obstacle list.
  assert.ok(a.obstacles.length > 0 || a.score > 0, "the run produced nothing to compare");
});

test("different seeds produce different runs", () => {
  const a = run(createState(1), 1800);
  const b = run(createState(2), 1800);
  const same = JSON.stringify(a.obstacles) === JSON.stringify(b.obstacles) && a.score === b.score;
  assert.ok(!same, "two seeds gave an identical run; the RNG is not seeded");
});

test("a jump clears the tallest obstacle", () => {
  const s = createState(7);
  let apex = 0;
  step(s, { jump: true });
  for (let i = 0; i < 200 && !s.onGround; i++) {
    step(s, {});
    apex = Math.max(apex, s.y);
  }
  // Closed form for the arc: v^2 / 2g. Asserted against the constants so a
  // change to gravity or jump velocity has to be a deliberate one.
  const predicted = (WORLD.jumpVelocity * WORLD.jumpVelocity) / (2 * WORLD.gravity);
  assert.ok(apex > 0, "the dino never left the ground");
  assert.ok(Math.abs(apex - predicted) < 12, `apex ${apex.toFixed(1)} vs predicted ${predicted.toFixed(1)}`);
  assert.ok(apex > WORLD.cactus.maxH, `apex ${apex} cannot clear a ${WORLD.cactus.maxH}px cactus`);
  assert.equal(s.onGround, true, "the dino never came back down");
  assert.equal(s.y, WORLD.groundY);
  assert.equal(s.jumps, 1);
});

test("holding jump cannot fly", () => {
  // The model deliberately re-jumps whenever `jump` is true on landing; the
  // page turns the key into an edge (held.jump = false after each step). So the
  // property that matters here is not the jump count but that altitude stays
  // bounded by the arc - repeated jumps must not accumulate height.
  const s = createState(3);
  const apex = (WORLD.jumpVelocity * WORLD.jumpVelocity) / (2 * WORLD.gravity);
  let max = 0;
  step(s, { jump: true });
  for (let i = 0; i < 600; i++) {
    step(s, { jump: true });
    max = Math.max(max, s.y);
  }
  assert.ok(max <= apex + 1e-6, `held jump reached ${max.toFixed(1)}px, above the ${apex.toFixed(1)}px arc`);
  assert.ok(s.jumps > 1, "a held key should re-jump on landing");
  assert.equal(s.onGround || s.y > WORLD.groundY, true);
});

test("the page treats a jump as an edge, not a level", () => {
  const html = readFileSync(HTML, "utf8");
  assert.match(html, /held\.jump = false;.*edge/s, "the page must clear the jump flag each frame");
});

test("running into an obstacle is fatal", () => {
  const s = createState(9);
  s.obstacles.length = 0;
  s.spawnIn = 1e6; // stop new ones arriving
  s.obstacles.push({ x: 30, w: 14, h: 30, scored: false });
  step(s, {});
  assert.equal(s.alive, false, "walked straight into a cactus and survived");
});

test("an obstacle that has been passed is not still lethal", () => {
  const s = createState(9);
  s.obstacles.length = 0;
  s.spawnIn = 1e6;
  s.obstacles.push({ x: -40, w: 14, h: 30, scored: false });
  step(s, {});
  assert.equal(s.alive, true, "a cactus behind the dino killed it");
});

test("autoplay survives, which proves the collision model is not unwinnable", () => {
  // A test that only checked "the score goes up" would pass on a game where
  // every obstacle is an unavoidable instant death.
  let survived = 0;
  let totalScore = 0;
  for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) {
    const s = autoplay(createState(seed), 3600);
    if (s.alive) survived++;
    totalScore += s.score;
  }
  assert.ok(totalScore > 0, "no points were ever scored");
  assert.ok(survived >= 4, `autoplay only survived ${survived}/8 runs; the game may be unwinnable`);
});

test("score derives from distance and never decreases", () => {
  const s = createState(11);
  let prev = 0;
  for (let i = 0; i < 1200 && s.alive; i++) {
    step(s, {});
    assert.ok(s.score >= prev, `score went backwards: ${prev} -> ${s.score}`);
    prev = s.score;
    assert.equal(s.score, Math.floor(s.distance / 24));
    if (s.score > s.best) s.best = s.score;
  }
  assert.equal(s.best, s.score);
});

test("speed ramps up but respects its cap", () => {
  const s = createState(4);
  assert.equal(runSpeedFor(s), WORLD.runSpeed);
  s.score = 100000;
  assert.equal(runSpeedFor(s), WORLD.maxRunSpeed, "runaway score should not give runaway speed");
  assert.ok(WORLD.maxRunSpeed > WORLD.runSpeed, "the cap must be above the starting speed");
});

test("obstacle spacing scales with speed so the game stays playable", () => {
  const s = createState(6);
  scheduleObstacle(s);
  const slowGap = s.spawnIn;
  s.score = 100000; // at the speed cap
  scheduleObstacle(s);
  const fastGap = s.spawnIn;
  assert.ok(slowGap > 0 && fastGap > 0, "spawn delay must be positive");
  assert.ok(fastGap < slowGap, `faster play should shorten the delay (${fastGap} vs ${slowGap})`);
  for (const o of s.obstacles) {
    assert.ok(o.w >= WORLD.cactus.minW && o.w <= WORLD.cactus.maxW);
    assert.ok(o.h >= WORLD.cactus.minH && o.h <= WORLD.cactus.maxH);
  }
});

test("the fixed timestep is what the page actually uses", () => {
  const html = readFileSync(HTML, "utf8");
  // The page must import STEP and accumulate against it, otherwise the physics
  // verified here is not the physics running in the browser.
  assert.match(html, /import \{[^}]*STEP[^}]*\} from "\.\.\/\.\.\/js\/tiny-dino-model\.js"/);
  assert.match(html, /while \(acc >= STEP\)/);
  assert.ok(Math.abs(STEP - 1 / 60) < 1e-12);
});

test("the page does not duplicate the physics it imports", () => {
  const html = readFileSync(HTML, "utf8");
  // Inlining a second copy of the constants would mean the browser and this
  // test suite exercise different numbers.
  for (const needle of ["2400", "780", "gravity:", "jumpVelocity:"]) {
    assert.ok(!html.includes(needle), `page re-declares ${needle} instead of importing it`);
  }
});

test("the page stays inside its size budget", () => {
  const bytes = statSync(HTML).size;
  // The whole point of the size-coded exercise. 8 KiB is generous for what this
  // is, and the assertion exists so growth is a decision rather than an accident.
  assert.ok(bytes > 0);
  assert.ok(bytes < 8 * 1024, `index.html is ${bytes} bytes, over the 8 KiB budget`);
  assert.match(readFileSync(HTML, "utf8"), /<canvas/);
});
