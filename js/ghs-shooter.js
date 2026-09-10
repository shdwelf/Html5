/**
 * GLENDORA HIGH · arena shooter core.
 *
 * Pure simulation: no DOM, no three.js, no timers.  The renderer in
 * ghs-shooter-three.js drives it with step(); tools/check_ghs.mjs drives the
 * exact same functions headlessly, so what the harness proves is what the
 * player gets.
 *
 * The arena is the same slab partition the Doom and Build exporters use, so
 * the walls you bump into are the walls those maps contain.
 */

import { decompose, partition } from "./ghs-slab.js";
import { campusRegions } from "./ghs-doom.js";
import { mulberry32 } from "./ghs-model.js";

export const PLAYER = {
  radius: 0.45,
  eye: 1.62,
  walk: 5.0,
  run: 8.2,
  hp: 100,
  ammo: 24,
  reserve: 96,
  fireDelay: 0.12,
  reloadTime: 1.5,
  range: 220,
  spread: 0.012,
  damage: 34,
};

export const BOT = {
  radius: 0.5,
  hp: 60,
  speed: 3.1,
  range: 42,
  fireDelay: 1.1,
  damage: 7,
  accuracy: 0.055,
  score: 100,
};

const OUTDOOR = new Set(["yard", "field", "court", "track", "parking", "road", "path", "plaza"]);

/* ------------------------------------------------------------------ *
 * world
 * ------------------------------------------------------------------ */

/**
 * Blocking segments + a uniform grid over them.
 * @param {object} model buildModel() result
 * @param {object} opts passed to campusRegions ({ walkable })
 */
export function buildWorld(model, opts = {}) {
  const { regions } = campusRegions(model, opts);
  const slabs = decompose(model.campus, regions, { minSlab: 0.05 });
  const part = partition(slabs);

  const solid = (s) => !s || s.kind === "block";
  const passable = (a, b) => {
    if (solid(a) || solid(b)) return false;
    if (!a || !b) return false;
    if (a.kind === "doorway" || b.kind === "doorway") return true;
    if (a.kind === "interior" && b.kind === "interior") return true;
    return OUTDOOR.has(a.kind) && OUTDOOR.has(b.kind);
  };

  const walls = [];
  for (const e of part.edges) {
    const a = e.left >= 0 ? part.slabs[e.left] : null;
    const b = e.right >= 0 ? part.slabs[e.right] : null;
    if (passable(a, b)) continue;
    const p = part.verts[e.a];
    const q = part.verts[e.b];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    walls.push({
      x0: p.x,
      y0: p.y,
      x1: q.x,
      y1: q.y,
      nx: -dy / len,
      ny: dx / len,
      len,
      indoor: !!a && !!b && (a.kind === "interior" || b.kind === "interior"),
    });
  }

  // uniform grid so a collision or shot query only tests a handful of segments
  const cell = 6;
  const grid = new Map();
  const key = (cx, cy) => cx * 100000 + cy;
  walls.forEach((w, i) => {
    const cx0 = Math.floor(Math.min(w.x0, w.x1) / cell);
    const cx1 = Math.floor(Math.max(w.x0, w.x1) / cell);
    const cy0 = Math.floor(Math.min(w.y0, w.y1) / cell);
    const cy1 = Math.floor(Math.max(w.y0, w.y1) / cell);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const k = key(cx, cy);
        let list = grid.get(k);
        if (!list) grid.set(k, (list = []));
        list.push(i);
      }
    }
  });

  const near = (x, y, r) => {
    const out = [];
    const seen = new Set();
    const cx0 = Math.floor((x - r) / cell);
    const cx1 = Math.floor((x + r) / cell);
    const cy0 = Math.floor((y - r) / cell);
    const cy1 = Math.floor((y + r) / cell);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const list = grid.get(key(cx, cy));
        if (!list) continue;
        for (const i of list) {
          if (seen.has(i)) continue;
          seen.add(i);
          out.push(walls[i]);
        }
      }
    }
    return out;
  };

  return { walls, grid, cell, near, slabs: part.slabs, verts: part.verts, model };
}

/* ------------------------------------------------------------------ *
 * geometry
 * ------------------------------------------------------------------ */

/** Distance from point p to segment ab. */
export function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/**
 * Nearest hit of a ray against the world's blocking segments.
 * @returns {{dist:number, wall:object, x:number, y:number}|null}
 */
export function raycastWorld(world, ox, oy, dx, dy, maxDist) {
  let best = null;
  for (const w of world.near(ox + dx * maxDist * 0.5, oy + dy * maxDist * 0.5, maxDist * 0.5 + 1)) {
    const t = raySegment(ox, oy, dx, dy, w);
    if (t !== null && t <= maxDist && (!best || t < best.dist)) {
      best = { dist: t, wall: w, x: ox + dx * t, y: oy + dy * t };
    }
  }
  return best;
}

/** Ray/segment intersection distance, or null. Ray direction must be unit-ish. */
export function raySegment(ox, oy, dx, dy, w) {
  const ex = w.x1 - w.x0;
  const ey = w.y1 - w.y0;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((w.x0 - ox) * ey - (w.y0 - oy) * ex) / denom;
  const u = ((w.x0 - ox) * dy - (w.y0 - oy) * dx) / denom;
  if (t < 0 || u < 0 || u > 1) return null;
  return t;
}

/** Slide a circle out of every wall it overlaps. Returns the resolved point. */
export function resolve(world, x, y, radius) {
  let px = x;
  let py = y;
  for (let pass = 0; pass < 4; pass++) {
    let moved = false;
    for (const w of world.near(px, py, radius + 0.1)) {
      const d = distToSeg(px, py, w.x0, w.y0, w.x1, w.y1);
      if (d >= radius) continue;
      // closest point on the segment
      const ex = w.x1 - w.x0;
      const ey = w.y1 - w.y0;
      const l2 = ex * ex + ey * ey;
      let t = l2 > 0 ? ((px - w.x0) * ex + (py - w.y0) * ey) / l2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = w.x0 + ex * t;
      const cy = w.y0 + ey * t;
      let nx = px - cx;
      let ny = py - cy;
      let n = Math.hypot(nx, ny);
      if (n < 1e-9) {
        nx = w.nx;
        ny = w.ny;
        n = 1;
      }
      const push = radius - d;
      px += (nx / n) * push;
      py += (ny / n) * push;
      moved = true;
    }
    if (!moved) break;
  }
  return { x: px, y: py };
}

/** Line of sight between two points. */
export function lineOfSight(world, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return true;
  const hit = raycastWorld(world, ax, ay, dx / dist, dy / dist, dist);
  return !hit || hit.dist >= dist - 1e-3;
}

/* ------------------------------------------------------------------ *
 * spawn points
 * ------------------------------------------------------------------ */

/** A walkable spot: on the entry drive, in a quad, clear of walls. */
export function findSpawn(world, x, y, minClear = 1.2) {
  const { model } = world;
  if (clearance(world, x, y) >= minClear) return { x, y };
  for (let r = 2; r <= 60; r += 2) {
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const px = x + Math.cos(ang) * r;
      const py = y + Math.sin(ang) * r;
      if (px < model.bounds.minX || px > model.bounds.maxX) continue;
      if (py < model.bounds.minY || py > model.bounds.maxY) continue;
      if (clearance(world, px, py) >= minClear) return { x: px, y: py };
    }
  }
  return { x, y };
}

/** Distance from a point to the nearest blocking wall. */
export function clearance(world, x, y) {
  let best = Infinity;
  for (const w of world.near(x, y, 24)) {
    const d = distToSeg(x, y, w.x0, w.y0, w.x1, w.y1);
    if (d < best) best = d;
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * game
 * ------------------------------------------------------------------ */

export function createGame(model, opts = {}) {
  const world = opts.world || buildWorld(model, opts);
  const seed = opts.seed ?? 20260910;
  const rand = mulberry32(seed);
  const spawn = findSpawn(world, model.entry.x, model.entry.y);

  const game = {
    model,
    world,
    rand,
    time: 0,
    wave: 0,
    waveTimer: 3,
    spawnBudget: 0,
    kills: 0,
    shots: 0,
    hits: 0,
    accuracy: 0,
    over: false,
    won: false,
    events: [],
    player: {
      x: spawn.x,
      y: spawn.y,
      z: model.ground(spawn.x, spawn.y),
      yaw: (model.entry.angle * Math.PI) / 180,
      pitch: 0,
      hp: PLAYER.hp,
      ammo: PLAYER.ammo,
      reserve: PLAYER.reserve,
      score: 0,
      fireCd: 0,
      reloading: 0,
      hurt: 0,
      bob: 0,
      recoil: 0,
    },
    bots: [],
    pickups: [],
    tracers: [],
    waves: opts.waves ?? 6,
    quota: opts.quota ?? 24,
  };
  return game;
}

function pushEvent(game, kind, data) {
  game.events.push({ t: game.time, kind, ...data });
  if (game.events.length > 240) game.events.shift();
}

/** Spawn one wave's worth of bots on walkable ground away from the player. */
function spawnWave(game) {
  game.wave++;
  const count = Math.min(3 + game.wave * 2, 14);
  game.spawnBudget = count;
  pushEvent(game, "wave", { wave: game.wave, count });
}

function trySpawnBot(game) {
  const { world, model, player, rand } = game;
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = model.bounds.minX + rand() * (model.bounds.maxX - model.bounds.minX);
    const y = model.bounds.minY + rand() * (model.bounds.maxY - model.bounds.minY);
    const d = Math.hypot(x - player.x, y - player.y);
    if (d < 26 || d > 150) continue;
    if (clearance(world, x, y) < 1.4) continue;
    if (lineOfSight(world, x, y, player.x, player.y)) continue;
    game.bots.push({
      id: game.kills + game.bots.length + 1,
      x,
      y,
      z: model.ground(x, y),
      hp: BOT.hp + game.wave * 6,
      maxHp: BOT.hp + game.wave * 6,
      fireCd: 0.4 + rand() * 1.2,
      strafe: rand() < 0.5 ? -1 : 1,
      strafeCd: 1 + rand() * 2,
      hitFlash: 0,
      dead: false,
    });
    game.spawnBudget--;
    return true;
  }
  return false;
}

/** Fire the player's weapon. Returns the hit record (or null). */
export function fire(game) {
  const p = game.player;
  if (game.over || p.fireCd > 0 || p.reloading > 0) return null;
  if (p.ammo <= 0) {
    reload(game);
    return null;
  }
  p.ammo--;
  p.fireCd = PLAYER.fireDelay;
  p.recoil = 1;
  game.shots++;
  const a = p.yaw + (game.rand() - 0.5) * PLAYER.spread * 2;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const wall = raycastWorld(game.world, p.x, p.y, dx, dy, PLAYER.range);
  const wallDist = wall ? wall.dist : PLAYER.range;

  let best = null;
  for (const b of game.bots) {
    if (b.dead) continue;
    const t = rayCircle(p.x, p.y, dx, dy, b.x, b.y, BOT.radius);
    if (t === null || t > wallDist) continue;
    if (!best || t < best.t) best = { t, bot: b };
  }
  const end = best ? best.t : wallDist;
  game.tracers.push({ x0: p.x, y0: p.y, x1: p.x + dx * end, y1: p.y + dy * end, life: 0.08 });
  if (best) {
    game.hits++;
    best.bot.hp -= PLAYER.damage;
    best.bot.hitFlash = 0.15;
    if (best.bot.hp <= 0) {
      best.bot.dead = true;
      game.kills++;
      p.score += BOT.score + game.wave * 10;
      pushEvent(game, "kill", { id: best.bot.id, wave: game.wave });
      if (game.rand() < 0.35) {
        game.pickups.push({ x: best.bot.x, y: best.bot.y, kind: game.rand() < 0.5 ? "ammo" : "health", life: 30 });
      }
    }
  } else if (wall) {
    pushEvent(game, "impact", { x: wall.x, y: wall.y });
  }
  game.accuracy = game.shots ? game.hits / game.shots : 0;
  return best ? { kind: "bot", bot: best.bot, dist: best.t } : wall ? { kind: "wall", dist: wallDist } : null;
}

export function reload(game) {
  const p = game.player;
  if (p.reloading > 0 || p.ammo >= PLAYER.ammo || p.reserve <= 0) return false;
  p.reloading = PLAYER.reloadTime;
  return true;
}

/** Ray vs upright cylinder (a bot), returns distance or null. */
export function rayCircle(ox, oy, dx, dy, cx, cy, r) {
  const fx = ox - cx;
  const fy = oy - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 ? t : null;
}

/**
 * Advance the simulation.
 * @param {object} game
 * @param {number} dt seconds
 * @param {object} input { forward, strafe, run, yaw, pitch, fire }
 */
export function step(game, dt, input = {}) {
  if (dt <= 0) return game;
  dt = Math.min(dt, 0.05);
  game.time += dt;
  const p = game.player;

  p.yaw += input.yaw || 0;
  p.pitch = Math.max(-1.35, Math.min(1.35, p.pitch + (input.pitch || 0)));
  p.fireCd = Math.max(0, p.fireCd - dt);
  p.recoil = Math.max(0, p.recoil - dt * 6);
  p.hurt = Math.max(0, p.hurt - dt * 2);
  if (p.reloading > 0) {
    p.reloading -= dt;
    if (p.reloading <= 0) {
      const need = PLAYER.ammo - p.ammo;
      const take = Math.min(need, p.reserve);
      p.ammo += take;
      p.reserve -= take;
    }
  }
  if (input.fire) fire(game);
  if (input.reload) reload(game);

  // movement
  const speed = (input.run ? PLAYER.run : PLAYER.walk) * (p.reloading > 0 ? 0.7 : 1);
  const fx = Math.cos(p.yaw);
  const fy = Math.sin(p.yaw);
  let vx = fx * (input.forward || 0) + -fy * (input.strafe || 0);
  let vy = fy * (input.forward || 0) + fx * (input.strafe || 0);
  const mag = Math.hypot(vx, vy);
  if (mag > 1) {
    vx /= mag;
    vy /= mag;
  }
  if (mag > 0.01) {
    p.bob += dt * speed * 1.6;
    const nx = p.x + vx * speed * dt;
    const ny = p.y + vy * speed * dt;
    const r = resolve(game.world, nx, ny, PLAYER.radius);
    p.x = r.x;
    p.y = r.y;
  }
  p.z = game.model.ground(p.x, p.y);

  // waves
  if (!game.over) {
    const alive = game.bots.filter((b) => !b.dead).length;
    if (game.spawnBudget > 0) {
      game.waveTimer -= dt;
      if (game.waveTimer <= 0 && alive < 12) {
        if (trySpawnBot(game)) game.waveTimer = 0.45;
      }
    } else if (alive === 0) {
      if (game.wave >= game.waves) {
        game.over = true;
        game.won = game.kills >= game.quota;
        pushEvent(game, "end", { won: game.won, kills: game.kills });
      } else {
        game.waveTimer -= dt;
        if (game.waveTimer <= 0) {
          spawnWave(game);
          game.waveTimer = 1.2;
        }
      }
    }
  }

  // bots
  for (const b of game.bots) {
    if (b.dead) continue;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.strafeCd -= dt;
    if (b.strafeCd <= 0) {
      b.strafe = -b.strafe;
      b.strafeCd = 1 + game.rand() * 2.5;
    }
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    const dist = Math.hypot(dx, dy) || 1;
    const see = dist < BOT.range && lineOfSight(game.world, b.x, b.y, p.x, p.y);
    let mx = 0;
    let my = 0;
    if (see) {
      const want = dist > 12 ? 1 : dist < 6 ? -0.6 : 0.15;
      mx = (dx / dist) * want + (-dy / dist) * b.strafe * 0.55;
      my = (dy / dist) * want + (dx / dist) * b.strafe * 0.55;
    } else {
      // last known direction: head for the player, hugging whatever is ahead
      mx = dx / dist;
      my = dy / dist;
    }
    const m = Math.hypot(mx, my) || 1;
    const r = resolve(game.world, b.x + (mx / m) * BOT.speed * dt, b.y + (my / m) * BOT.speed * dt, BOT.radius);
    if (Math.hypot(r.x - b.x, r.y - b.y) < BOT.speed * dt * 0.2) b.strafe = -b.strafe;
    b.x = r.x;
    b.y = r.y;
    b.z = game.model.ground(b.x, b.y);

    b.fireCd -= dt;
    if (see && b.fireCd <= 0) {
      b.fireCd = BOT.fireDelay * (0.7 + game.rand() * 0.8);
      const spread = (game.rand() - 0.5) * BOT.accuracy * 2;
      const ang = Math.atan2(dy, dx) + spread;
      const hx = raycastWorld(game.world, b.x, b.y, Math.cos(ang), Math.sin(ang), dist);
      game.tracers.push({ x0: b.x, y0: b.y, x1: p.x, y1: p.y, life: 0.06, enemy: true });
      if (!hx || hx.dist >= dist - 0.6) {
        p.hp -= BOT.damage;
        p.hurt = 1;
        pushEvent(game, "hurt", { hp: Math.max(0, p.hp) });
        if (p.hp <= 0) {
          p.hp = 0;
          game.over = true;
          game.won = false;
          pushEvent(game, "end", { won: false, kills: game.kills });
        }
      }
    }
  }
  game.bots = game.bots.filter((b) => !b.dead || b.hitFlash > 0);

  // pickups
  for (const it of game.pickups) {
    it.life -= dt;
    if (Math.hypot(it.x - p.x, it.y - p.y) < 1.1) {
      if (it.kind === "ammo") p.reserve = Math.min(240, p.reserve + 24);
      else p.hp = Math.min(PLAYER.hp, p.hp + 25);
      it.life = 0;
      pushEvent(game, "pickup", { kind: it.kind });
    }
  }
  game.pickups = game.pickups.filter((i) => i.life > 0);
  game.tracers = game.tracers.filter((t) => (t.life -= dt) > 0);

  return game;
}

/* ------------------------------------------------------------------ *
 * reporting
 * ------------------------------------------------------------------ */

export function scoreboard(game) {
  return {
    wave: game.wave,
    waves: game.waves,
    kills: game.kills,
    quota: game.quota,
    alive: game.bots.filter((b) => !b.dead).length,
    hp: Math.max(0, Math.round(game.player.hp)),
    ammo: game.player.ammo,
    reserve: game.player.reserve,
    score: game.player.score,
    accuracy: Math.round(game.accuracy * 100),
    over: game.over,
    won: game.won,
    time: Math.round(game.time * 10) / 10,
  };
}
