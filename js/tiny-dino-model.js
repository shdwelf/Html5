/**
 * tiny-dino - the game logic for the size-coded endless runner in
 * public/apps/tiny-dino/index.html.
 *
 * The logic lives here rather than inline in the HTML for two reasons. First,
 * duplicating it would mean the page and the tests exercise different code,
 * which is how a "verified" demo ends up broken in the browser. Second, physics
 * with a jump arc and AABB collision is exactly the kind of thing that looks
 * right and is subtly wrong, so it needs deterministic tests rather than
 * eyeballing a canvas.
 *
 * Everything is integer-friendly and driven by an explicit fixed timestep, so
 * a run is reproducible from a seed. That is what makes the scoring test
 * meaningful: the same seed must always produce the same score.
 */

/** Fixed simulation step in seconds. Decoupled from the frame rate on purpose. */
export const STEP = 1 / 60;

export const WORLD = {
  groundY: 0, // the dino's y is height above the ground, so 0 means standing
  gravity: 2400, // px/s^2
  jumpVelocity: 780, // px/s
  runSpeed: 240, // px/s, increases with score
  speedGainPerPoint: 0.35,
  maxRunSpeed: 560,
  dino: { w: 22, h: 34 },
  cactus: { minW: 12, maxW: 22, minH: 24, maxH: 44 },
  spawnMin: 0.55, // seconds between obstacles at current speed
  spawnMax: 1.35,
  viewWidth: 480,
};

/**
 * Deterministic LCG. Not for anything security-related - it exists so a test
 * can replay a run exactly. Seeded from the caller.
 */
export function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function createState(seed = 1) {
  return {
    seed,
    rng: makeRng(seed),
    t: 0,
    distance: 0,
    score: 0,
    best: 0,
    y: WORLD.groundY,
    vy: 0,
    onGround: true,
    obstacles: [],
    spawnIn: 0.8,
    alive: true,
    jumps: 0,
  };
}

/** Queue the next obstacle and decide when the one after it appears. */
export function scheduleObstacle(state) {
  const { cactus, spawnMin, spawnMax, runSpeed, speedGainPerPoint } = WORLD;
  const speed = runSpeedFor(state);
  const r = state.rng;
  const w = Math.round(cactus.minW + r() * (cactus.maxW - cactus.minW));
  const h = Math.round(cactus.minH + r() * (cactus.maxH - cactus.minH));
  state.obstacles.push({ x: WORLD.viewWidth + w, w, h, scored: false });
  // Spacing is a distance, converted to time at the current speed, so the game
  // stays playable as it accelerates instead of becoming a wall.
  const gap = (spawnMin + r() * (spawnMax - spawnMin)) * speed * 1.9;
  state.spawnIn = gap / speed;
  void runSpeed;
  void speedGainPerPoint;
}

export function runSpeedFor(state) {
  const { runSpeed, speedGainPerPoint, maxRunSpeed } = WORLD;
  return Math.min(maxRunSpeed, runSpeed + state.score * speedGainPerPoint);
}

/** One fixed simulation step. Pure with respect to `state` - it mutates and returns it. */
export function step(state, input = {}) {
  if (!state.alive) return state;
  const { gravity, jumpVelocity, dino } = WORLD;
  const speed = runSpeedFor(state);

  state.t += STEP;
  state.distance += speed * STEP;

  // Jump only from the ground, so holding the key cannot fly.
  if (input.jump && state.onGround) {
    state.vy = jumpVelocity;
    state.onGround = false;
    state.jumps += 1;
  }

  state.vy -= gravity * STEP;
  state.y += state.vy * STEP;
  if (state.y <= WORLD.groundY) {
    state.y = WORLD.groundY;
    state.vy = 0;
    state.onGround = true;
  }

  // Move obstacles, retire the ones that left the screen, score the ones passed.
  for (const o of state.obstacles) {
    o.x -= speed * STEP;
    if (!o.scored && o.x + o.w < 0) {
      o.scored = true;
    }
  }
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > -4);

  state.spawnIn -= STEP;
  if (state.spawnIn <= 0) scheduleObstacle(state);

  // Score from distance, one point per 24 px, which keeps the number readable.
  state.score = Math.floor(state.distance / 24);
  if (state.score > state.best) state.best = state.score;

  // AABB overlap. The dino occupies [y, y+h] and a cactus occupies [0, o.h],
  // so the vertical test only needs the foot height: ducking could never help
  // against an obstacle that grows up from the ground, which is why there is
  // no duck input here rather than one that silently does nothing.
  const dinoLeft = 24;
  const dinoRight = dinoLeft + dino.w;
  for (const o of state.obstacles) {
    const horizontal = dinoRight > o.x && dinoLeft < o.x + o.w;
    const vertical = state.y < o.h;
    if (horizontal && vertical) {
      state.alive = false;
      break;
    }
  }
  return state;
}

/** Run n steps with a constant input; useful for tests and for the demo attract mode. */
export function run(state, n, input = {}) {
  for (let i = 0; i < n; i++) step(state, input);
  return state;
}

/**
 * Play greedily: jump whenever an obstacle is close and low enough to clear.
 * Used by the test to prove the collision model is actually survivable - a game
 * where nothing can avoid anything would still "pass" a test that only checks
 * the score counter increments.
 */
export function autoplay(state, steps) {
  for (let i = 0; i < steps; i++) {
    const dinoLeft = 24;
    const lead = runSpeedFor(state) * 0.32;
    const threat = state.obstacles.find((o) => o.x + o.w > dinoLeft - 2 && o.x < dinoLeft + lead);
    step(state, { jump: !!threat && state.onGround });
    if (!state.alive) break;
  }
  return state;
}
