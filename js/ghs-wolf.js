/**
 * Wolfenstein 3D JS level writer.
 *
 * Wolf3D levels are a fixed 64×64 grid, so the whole ~385 m campus is
 * resampled onto one level (≈6.4 m per tile).  The output follows the
 * GAMEMAPS.WL6 encoding:
 *
 *   wall plane  0-63 wall textures · 90 door · 100/101 elevator (exit)
 *               106-143 walkable floor, value-106 = area number
 *   thing plane 19-22 player spawn (oriented) · 23-70 props
 *               43/44 keys · 47 food · 48 medkit · 49 ammo · 98 pushwall
 *
 * The result is emitted as a JS module (ESM + browser global) that any
 * JS Wolf3D raycaster can consume, and it also carries the raw planes as
 * base64 for engines that want the WL6 layout verbatim.
 *
 * Pure module: no DOM.
 */

export const WOLF_SIZE = 64;
export const WOLF_DOOR = 90;
export const WOLF_ELEVATOR = 100;
export const WOLF_AREA_BASE = 106;

export const WOLF_WALLS = [
  { id: 1, key: "brick", name: "RED BRICK", rgb: [150, 92, 74] },
  { id: 2, key: "stucco", name: "STUCCO BLOCK", rgb: [214, 198, 164] },
  { id: 3, key: "concrete", name: "TILT-UP CONCRETE", rgb: [176, 178, 180] },
  { id: 4, key: "glass", name: "GLASS CURTAIN", rgb: [112, 148, 176] },
  { id: 5, key: "metal", name: "RIBBED METAL", rgb: [150, 156, 162] },
  { id: 6, key: "stone", name: "MASONRY", rgb: [148, 140, 128] },
  { id: 7, key: "door", name: "ENTRY DOOR", rgb: [122, 86, 54] },
  { id: 8, key: "fence", name: "CAMPUS FENCE", rgb: [96, 104, 96] },
  { id: 9, key: "locker", name: "LOCKER BANK", rgb: [86, 116, 96] },
  { id: 10, key: "riser", name: "RISERS", rgb: [132, 122, 108] },
];

export const WOLF_PROPS = {
  greenBarrel: 24,
  tableChairs: 25,
  floorLamp: 26,
  whitePillar: 30,
  tree: 31,
  pottedPlant: 34,
  flag: 62,
  keySilver: 43,
  keyGold: 44,
  food: 47,
  medkit: 48,
  ammo: 49,
  playerEast: 19,
  playerSouth: 20,
  playerWest: 21,
  playerNorth: 22,
};

const KIND_TO_WALL = {
  admin: 1,
  classroom: 2,
  gym: 3,
  hall: 6,
  annex: 3,
  portable: 5,
  shed: 5,
  canopy: 5,
  amphitheater: 10,
  cafeteria: 9,
};

function pointInRing(x, y, ring) {
  let inside = false;
  const n = ring.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i * 2], yi = ring[i * 2 + 1];
    const xj = ring[j * 2], yj = ring[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function b64encode(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += alphabet[b0 >> 2];
    out += alphabet[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? alphabet[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? alphabet[b2 & 63] : "=";
  }
  return out;
}

/**
 * Rasterise the campus into a Wolf3D level.
 * @param {object} model buildModel() output
 * @param {object} opts { size, hollowBuildings }
 */
export function buildWolfLevel(model, opts = {}) {
  const size = opts.size ?? WOLF_SIZE;
  const { minX, minY, maxX, maxY } = model.bounds;
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const scale = (size - 2) / Math.max(spanX, spanY);
  const ox = minX + (spanX - (size - 2) / scale) / 2;
  const oy = minY + (spanY - (size - 2) / scale) / 2;
  const toTile = (x, y) => [Math.round((x - ox) * scale) + 1, Math.round((y - oy) * scale) + 1];
  const toWorld = (tx, ty) => [(tx - 1) / scale + ox, (ty - 1) / scale + oy];

  const wall = new Uint8Array(size * size);
  const thing = new Uint8Array(size * size);
  const idx = (tx, ty) => ty * size + tx;

  // 1. everything outside the campus is solid rock (wall 0)
  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      const [wx, wy] = toWorld(tx, ty);
      const inside = pointInRing(wx, wy, model.campus);
      wall[idx(tx, ty)] = inside ? WOLF_AREA_BASE + 1 : 0;
    }
  }

  // 2. buildings become solid blocks (hollowed when they are big enough)
  const buildingCells = new Map();
  for (const b of model.buildings) {
    const cells = [];
    for (let ty = 0; ty < size; ty++) {
      for (let tx = 0; tx < size; tx++) {
        const [wx, wy] = toWorld(tx, ty);
        if (pointInRing(wx, wy, b.ring)) cells.push([tx, ty]);
      }
    }
    if (!cells.length) continue;
    buildingCells.set(b.id, cells);
    const wallId = KIND_TO_WALL[b.kind] || 2;
    const set = new Set(cells.map(([x, y]) => `${x},${y}`));
    const interior = new Set();
    if (opts.hollowBuildings !== false) {
      for (const [x, y] of cells) {
        if (set.has(`${x + 1},${y}`) && set.has(`${x - 1},${y}`) && set.has(`${x},${y + 1}`) && set.has(`${x},${y - 1}`)) {
          interior.add(`${x},${y}`);
        }
      }
    }
    for (const [x, y] of cells) {
      wall[idx(x, y)] = interior.has(`${x},${y}`) ? WOLF_AREA_BASE + 1 : wallId;
    }
    // door: the wall cell closest to a road that touches the interior
    if (interior.size) {
      let best = null;
      for (const [x, y] of cells) {
        if (interior.has(`${x},${y}`)) continue;
        const touchesInterior = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => interior.has(`${x + dx},${y + dy}`));
        if (!touchesInterior) continue;
        const [wx, wy] = toWorld(x, y);
        let d = Infinity;
        for (const r of model.roads) {
          for (let k = 0; k + 3 < r.line.length; k += 2) {
            const dd = segDist(wx, wy, r.line[k], r.line[k + 1], r.line[k + 2], r.line[k + 3]);
            if (dd < d) d = dd;
          }
        }
        if (!best || d < best.d) best = { x, y, d };
      }
      if (best) wall[idx(best.x, best.y)] = WOLF_DOOR;
    }
  }

  // 3. exit elevator on the campus boundary nearest the entry drive
  {
    const [etx, ety] = toTile(model.entry.x, model.entry.y);
    let best = null;
    for (let ty = 1; ty < size - 1; ty++) {
      for (let tx = 1; tx < size - 1; tx++) {
        if (wall[idx(tx, ty)] === 0) continue;
        const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => wall[idx(tx + dx, ty + dy)] > WOLF_AREA_BASE);
        if (open.length < 1) continue;
        const d = Math.hypot(tx - etx, ty - ety);
        if (!best || d < best.d) best = { x: tx, y: ty, d, open };
      }
    }
    if (best) {
      wall[idx(best.x, best.y)] = WOLF_ELEVATOR;
      // make sure there is a walkable tile on the far side of the elevator
      const [dx, dy] = best.open[0];
      const fx = best.x - dx;
      const fy = best.y - dy;
      if (fx > 0 && fy > 0 && fx < size - 1 && fy < size - 1 && wall[idx(fx, fy)] === 0) {
        wall[idx(fx, fy)] = WOLF_AREA_BASE + 1;
      }
    }
  }

  // 4. flood fill walkable space into areas (Wolf3D allows 37)
  const areas = new Int16Array(size * size).fill(-1);
  let areaCount = 0;
  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      if (wall[idx(tx, ty)] <= WOLF_AREA_BASE) continue;
      if (areas[idx(tx, ty)] >= 0) continue;
      const stack = [[tx, ty]];
      const id = areaCount++;
      while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const i = idx(x, y);
        if (areas[i] >= 0) continue;
        if (wall[i] <= WOLF_AREA_BASE && wall[i] !== WOLF_DOOR && wall[i] !== WOLF_ELEVATOR) continue;
        areas[i] = id;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      if (areaCount > 36) break;
    }
    if (areaCount > 36) break;
  }
  for (let i = 0; i < wall.length; i++) {
    if (wall[i] === WOLF_DOOR || wall[i] === WOLF_ELEVATOR) continue;
    if (areas[i] >= 0) wall[i] = WOLF_AREA_BASE + 1 + (areas[i] % 37);
    else if (wall[i] > WOLF_AREA_BASE) wall[i] = WOLF_AREA_BASE + 1;
  }

  // 5. things: player start, trees, lamps, props, pickups
  const [px, py] = toTile(model.entry.x, model.entry.y);
  let spawn = { x: px, y: py };
  if (wall[idx(px, py)] <= WOLF_AREA_BASE) {
    outer: for (let r = 0; r < 12; r++) {
      for (let a = 0; a < 16; a++) {
        const tx = px + Math.round(Math.cos((a / 16) * Math.PI * 2) * r);
        const ty = py + Math.round(Math.sin((a / 16) * Math.PI * 2) * r);
        if (tx < 1 || ty < 1 || tx >= size - 1 || ty >= size - 1) continue;
        if (wall[idx(tx, ty)] > WOLF_AREA_BASE) {
          spawn = { x: tx, y: ty };
          break outer;
        }
      }
    }
  }
  thing[idx(spawn.x, spawn.y)] = WOLF_PROPS.playerEast;

  const placeThing = (wx, wy, value) => {
    const [tx, ty] = toTile(wx, wy);
    if (tx < 1 || ty < 1 || tx >= size - 1 || ty >= size - 1) return false;
    const i = idx(tx, ty);
    if (wall[i] <= WOLF_AREA_BASE && wall[i] !== WOLF_DOOR) return false;
    if (thing[i]) return false;
    thing[i] = value;
    return true;
  };

  for (const t of model.trees) placeThing(t.x, t.y, WOLF_PROPS.tree);
  for (const r of model.roads) {
    if (r.kind !== "road") continue;
    let acc = 0;
    for (let i = 0; i + 3 < r.line.length; i += 2) {
      acc += Math.hypot(r.line[i + 2] - r.line[i], r.line[i + 3] - r.line[i + 1]);
      if (acc < 22) continue;
      acc = 0;
      placeThing((r.line[i] + r.line[i + 2]) / 2, (r.line[i + 1] + r.line[i + 3]) / 2, WOLF_PROPS.floorLamp);
    }
  }
  for (const b of model.buildings) {
    placeThing(b.cx, b.cy, WOLF_PROPS.greenBarrel);
  }
  const pickups = [WOLF_PROPS.medkit, WOLF_PROPS.ammo, WOLF_PROPS.food, WOLF_PROPS.keyGold];
  model.areas.forEach((a, i) => {
    placeThing(a.cx, a.cy, i % 4 === 0 ? pickups[i % pickups.length] : WOLF_PROPS.pottedPlant);
  });

  const things = [];
  for (let i = 0; i < thing.length; i++) {
    if (thing[i]) things.push({ tile: thing[i], x: i % size, y: Math.floor(i / size) });
  }

  const walkable = wall.reduce((n, v) => n + (v > WOLF_AREA_BASE ? 1 : 0), 0);
  const wallCells = wall.reduce((n, v) => n + (v <= WOLF_AREA_BASE ? 1 : 0), 0);

  return {
    size,
    scale,
    origin: { x: ox, y: oy },
    wall,
    thing,
    areas: areaCount,
    player: { x: spawn.x, y: spawn.y, angle: 0, tile: thing[idx(spawn.x, spawn.y)] },
    things,
    stats: { walkable, wallCells, doors: wall.reduce((n, v) => n + (v === WOLF_DOOR ? 1 : 0), 0) },
    toTile,
    toWorld,
  };
}

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Procedural 64×64 texture so the JS level ships without image assets. */
export function textureSource(id) {
  return `function makeTexture(id, size) {
  size = size || 64;
  const specs = ${JSON.stringify(WOLF_WALLS.map((w) => ({ id: w.id, rgb: w.rgb, name: w.name })))};
  const spec = specs.find(function (s) { return s.id === id; }) || specs[0];
  const px = new Uint8Array(size * size * 3);
  let seed = id * 2654435761 >>> 0;
  function rnd() {
    seed = (seed + 0x9e3779b9) >>> 0;
    let t = seed ^ (seed >>> 15);
    t = Math.imul(t, 0x2c1b3c6d);
    t ^= t >>> 12;
    return (t >>> 0) / 4294967296;
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = (rnd() - 0.5) * 26;
      const mortar = (y % 8 === 7) || (x % 16 === ((y >> 3) % 2 ? 8 : 0));
      const k = mortar ? 0.55 : 1;
      const o = (y * size + x) * 3;
      px[o] = Math.max(0, Math.min(255, spec.rgb[0] * k + n));
      px[o + 1] = Math.max(0, Math.min(255, spec.rgb[1] * k + n));
      px[o + 2] = Math.max(0, Math.min(255, spec.rgb[2] * k + n));
    }
  }
  return { width: size, height: size, rgb: px };
}`;
}

/**
 * Emit the standalone JS level module.
 * @param {object} level from buildWolfLevel()
 * @param {object} model buildModel() output (for the header comment)
 */
export function wolfLevelSource(level, model) {
  const wallB64 = b64encode(level.wall);
  const thingB64 = b64encode(level.thing);
  const wallsJson = JSON.stringify(Array.from(level.wall));
  const thingsJson = JSON.stringify(level.things);
  const header = [
    "/**",
    " * GLENDORA HIGH SCHOOL — Wolfenstein 3D JS level",
    ` * ${model.site.name} · ${model.site.address}`,
    ` * Geometry: ${model.site.source}`,
    ` * ${level.size}×${level.size} tiles ≈ ${(1 / level.scale).toFixed(2)} m per tile` +
      ` (campus ${model.stats.widthM.toFixed(0)} m × ${model.stats.depthM.toFixed(0)} m)`,
    " *",
    " * Wall plane encoding (GAMEMAPS.WL6):",
    " *   0-63 wall textures · 90 door · 100 elevator (exit) · 106-143 walkable area",
    " * Thing plane: 19-22 player spawn · 23-70 props · 43-56 pickups",
    " *",
    " * Generated by the SITE-K HTML5 exporter (js/ghs-wolf.js).",
    " */",
  ].join("\n");

  return `${header}

export const LEVEL_META = {
  name: "GHS CAMPUS",
  author: "SITE-K",
  description: "Glendora High School campus, reconstructed from OpenStreetMap",
  width: ${level.size},
  height: ${level.size},
  metersPerTile: ${Number((1 / level.scale).toFixed(3))},
  origin: { x: ${level.origin.x.toFixed(3)}, y: ${level.origin.y.toFixed(3)} },
  areas: ${level.areas},
  doors: ${level.stats.doors},
  generated: ${JSON.stringify(new Date().toISOString())},
};

export const WALLS_B64 = "${wallB64}";
export const THINGS_B64 = "${thingB64}";
export const WALLS = ${wallsJson};
export const THINGS = ${thingsJson};

export const PLAYER = { x: ${level.player.x}, y: ${level.player.y}, angle: ${level.player.angle} };

export const WALL_TEXTURES = ${JSON.stringify(WOLF_WALLS, null, 2)};

export function decodeB64(b64) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = b64.replace(/=+$/, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let acc = 0;
  let bits = 0;
  let n = 0;
  for (let i = 0; i < clean.length; i++) {
    acc = (acc << 6) | alphabet.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[n++] = (acc >> bits) & 0xff;
    }
  }
  return out;
}

export function wallPlane() { return decodeB64(WALLS_B64); }
export function thingPlane() { return decodeB64(THINGS_B64); }

${textureSource(1)}

export const LEVEL = {
  meta: LEVEL_META,
  width: LEVEL_META.width,
  height: LEVEL_META.height,
  walls: WALLS,
  things: THINGS,
  player: PLAYER,
  wallPlane,
  thingPlane,
  makeTexture,
};

if (typeof globalThis !== "undefined") globalThis.GHS_WOLF3D_LEVEL = LEVEL;
export default LEVEL;
`;
}
