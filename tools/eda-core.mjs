/**
 * eda-core.mjs — the shared half of the wallplug family.
 *
 * tools/wallplug-model.mjs is the xPort Pro board and it carries its own copies
 * of the geometry helpers; this module re-implements the same semantics (they are
 * deliberately identical, and tests/23 asserts it) so the newer designs can be
 * written against one toolkit:
 *
 *   · geometry     rotPt / padAbs / courtAbs / symbolBBox / stubDir / STUB
 *   · drawing      box / nameValue / icSymbol / twoPinSymbol / pinRow
 *   · registries   pick() over the xPort base library + tools/eda-packages.mjs
 *   · placement    grid() and rows(), the two layouts every design uses
 *
 * Design modules import from here and re-export, so the EAGLE generator can treat
 * every design as one namespace (`import * as D`) with the same exports.
 */

import { IMPORTED_PACKAGES, PACKAGE_SOURCES } from './eda-packages.mjs';
import * as XPORT from './wallplug-model.mjs';

export { PACKAGE_SOURCES };
export const IMPORTED = IMPORTED_PACKAGES;

/* ---------------------------------------------------------------- geometry */

export const rnd = (v, p = 4) => Number(Number(v).toFixed(p));

/** Rotate a package/symbol-local point by an EAGLE rotation string. */
export function rotPt(x, y, rot = 'R0') {
  const deg = Number(String(rot).replace(/^R/, '')) || 0;
  const r = ((deg % 360) + 360) % 360;
  switch (r) {
    case 90: return [-y, x];
    case 180: return [-x, -y];
    case 270: return [y, -x];
    default: return [x, y];
  }
}

/** Absolute pad centres for a placed element. */
export function padAbs(pkg, place) {
  const out = [];
  for (const pad of pkg.pads || []) {
    const [dx, dy] = rotPt(pad.x, pad.y, place.rot);
    out.push({ name: pad.name, x: rnd(place.x + dx), y: rnd(place.y + dy), pad });
  }
  return out;
}

/** Absolute courtyard (axis-aligned bounding box) for a placed element. */
export function courtAbs(pkg, place) {
  const c = pkg.courtyard;
  const corners = [[c.x1, c.y1], [c.x2, c.y1], [c.x1, c.y2], [c.x2, c.y2]]
    .map(([x, y]) => rotPt(x, y, place.rot))
    .map(([x, y]) => [place.x + x, place.y + y]);
  const xs = corners.map((p) => p[0]);
  const ys = corners.map((p) => p[1]);
  return {
    x1: rnd(Math.min(...xs)), y1: rnd(Math.min(...ys)),
    x2: rnd(Math.max(...xs)), y2: rnd(Math.max(...ys)),
  };
}

/** Bounding box of a symbol, including its pins and texts. */
export function symbolBBox(sym) {
  const xs = [];
  const ys = [];
  const add = (x, y) => { xs.push(x); ys.push(y); };
  for (const g of sym.wires || []) {
    if (g.w) g.w.forEach((p) => add(p.x, p.y));
    if (g.c) { add(g.c.x - g.c.r, g.c.y - g.c.r); add(g.c.x + g.c.r, g.c.y + g.c.r); }
  }
  for (const p of sym.pins || []) add(p.x, p.y);
  for (const t of sym.texts || []) add(t.x, t.y);
  if (!xs.length) return { x1: -2.54, y1: -2.54, x2: 2.54, y2: 2.54 };
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}

/** Direction a wire stub leaves a symbol pin, given the pin's rotation. */
export function stubDir(rot) {
  switch (rot) {
    case 'R180': return [1, 0];
    case 'R90': return [0, -1];
    case 'R270': return [0, 1];
    default: return [-1, 0];
  }
}

export const STUB = 5.08;   // mm of wire that leaves every symbol pin before its label

/**
 * pinAbsolute bound to one symbol table — every design module exports a version
 * closed over its own SYMBOLS, which is what the generator calls as D.pinAbsolute.
 */
export function makePinAbsolute(SYMBOLS) {
  return function pinAbsolute(symName, pinName, inst) {
    const sym = SYMBOLS[symName];
    if (!sym) throw new Error(`unknown symbol ${symName}`);
    const pin = (sym.pins || []).find((p) => p.name === pinName);
    if (!pin) throw new Error(`symbol ${symName} has no pin ${pinName}`);
    const [dx, dy] = rotPt(pin.x, pin.y, inst.rot ?? 'R0');
    return { x: inst.x + dx, y: inst.y + dy, rot: pin.rot ?? 'R0', pin };
  };
}

/* ----------------------------------------------------------------- drawing */

/** EAGLE layers used here: 94 symbol outline, 95 names, 96 values, 97 notes. */
export function box(w, h, layer = 94, width = 0.254) {
  const x = w / 2, y = h / 2;
  return [
    { w: [{ x: -x, y }, { x, y }], layer, width },
    { w: [{ x, y }, { x, y: -y }], layer, width },
    { w: [{ x, y: -y }, { x: -x, y: -y }], layer, width },
    { w: [{ x: -x, y: -y }, { x: -x, y }], layer, width },
  ];
}

export function nameValue(w, h) {
  return [
    { x: rnd(-w / 2), y: rnd(h / 2 + 1.0), size: 1.778, layer: 95, text: '>NAME' },
    { x: rnd(-w / 2), y: rnd(-h / 2 - 2.6), size: 1.778, layer: 96, text: '>VALUE' },
  ];
}

/** Normalise a pin spec: 'NAME' or { name, direction, function, length, rot }. */
function mkPin(spec, x, y, rot) {
  const p = typeof spec === 'string' ? { name: spec } : { ...spec };
  return {
    name: p.name, x: rnd(x), y: rnd(y), rot,
    length: p.length ?? 'middle',
    ...(p.direction ? { direction: p.direction } : {}),
    ...(p.function ? { function: p.function } : {}),
  };
}

/**
 * Rectangle IC symbol. `left` and `right` are pin lists top-to-bottom, `top` and
 * `bottom` left-to-right. Height grows to fit the longest side, so a 52-pin
 * mini-PCIe socket and a 5-pin regulator use the same code path.
 */
export function icSymbol(name, opt) {
  const {
    w = 20.32, left = [], right = [], top = [], bottom = [],
    texts = [], lineSpacing = 2.54, margin = 2.54, width = 0.4064, minH = 7.62,
  } = opt;
  const rowsN = Math.max(left.length, right.length);
  const colsN = Math.max(top.length, bottom.length);
  const h = Math.max(rowsN * lineSpacing + margin, colsN * lineSpacing + margin, minH);
  const pins = [];
  const yTop = ((rowsN - 1) * lineSpacing) / 2;
  const xLeft = -((colsN - 1) * lineSpacing) / 2;
  left.forEach((p, i) => pins.push(mkPin(p, -w / 2, yTop - i * lineSpacing, 'R0')));
  right.forEach((p, i) => pins.push(mkPin(p, w / 2, yTop - i * lineSpacing, 'R180')));
  top.forEach((p, i) => pins.push(mkPin(p, xLeft + i * lineSpacing, h / 2, 'R270')));
  bottom.forEach((p, i) => pins.push(mkPin(p, xLeft + i * lineSpacing, -h / 2, 'R90')));
  return { name, wires: box(w, h, 94, width), texts: [...nameValue(w, h), ...texts], pins };
}

/** Two-pin symbol: resistor, capacitor, inductor, fuse, varistor, antenna… */
export function twoPinSymbol(name, opt = {}) {
  const { w = 5.08, h = 7.62, a = '1', b = '2', texts = [], vertical = true } = opt;
  const pins = vertical
    ? [mkPin(a, 0, h / 2, 'R270'), mkPin(b, 0, -h / 2, 'R90')]
    : [mkPin(a, -w / 2, 0, 'R0'), mkPin(b, w / 2, 0, 'R180')];
  return { name, wires: box(w, h, 94, 0.254), texts: [...nameValue(w, h), ...texts], pins };
}

/* --------------------------------------------------------------- registries */

/**
 * Take a named subset of a registry. A missing name is a bug in the design
 * module, so it throws instead of silently shrinking the library.
 */
export function pick(obj, names) {
  const out = {};
  for (const n of names) {
    if (!(n in obj)) throw new Error(`pick: '${n}' is not in the registry (have ${Object.keys(obj).length} entries)`);
    out[n] = obj[n];
  }
  return out;
}

/** The xPort wallplug's verified generic library: passives, terminals, hardware. */
export const BASE_PACKAGES = XPORT.PACKAGES;
export const BASE_SYMBOLS = XPORT.SYMBOLS;
export const BASE_DEVICESETS = XPORT.DEVICESETS;

/**
 * A deviceset whose connects map may list several pads per pin:
 *   connectPadList({ GND: ['11', '18'] })  →  <connect pin="GND" pad="11 18"/>
 */
export const ds = (prefix, symbol, pkg, connects) => ({ prefix, symbol, package: pkg, connects });

/* ---------------------------------------------------------------- placement */

/**
 * Row-major grid placement. `rot` may be a constant or a function of the ref, so
 * a whole bank of decoupling capacitors can be turned without listing each one.
 */
export function grid(refs, opt) {
  const { x0, y0, dx, dy, perRow = 8, rot = 'R0', overrides = {} } = opt;
  const out = {};
  refs.forEach((ref, i) => {
    const r = Math.floor(i / perRow);
    const c = i % perRow;
    out[ref] = {
      x: rnd(x0 + c * dx), y: rnd(y0 - r * dy),
      rot: typeof rot === 'function' ? rot(ref) : rot,
    };
  });
  return { ...out, ...overrides };
}

/**
 * Stacked rows of differing height — the schematic layout needs this because a
 * 52-pin symbol is 66 mm tall while a resistor is 8 mm, and the generator fails
 * the build when two instance boxes (symbol + stubs + labels) overlap.
 */
export function rows(groups, opt) {
  const { x0, y0, dx, heights = null, gap = 45, overrides = {} } = opt;
  const out = {};
  let y = y0;
  groups.forEach((refs, gi) => {
    refs.forEach((ref, ci) => { out[ref] = { x: rnd(x0 + ci * dx), y: rnd(y) }; });
    y -= heights ? heights[gi] : gap;
  });
  return { ...out, ...overrides };
}

/**
 * Power budget: the generator prints it, tests/23 asserts it. Every entry is a
 * rail with the consumers that hang off it and the source that feeds it.
 */
export function budgetCheck(POWER_BUDGET) {
  const out = [];
  for (const rail of POWER_BUDGET) {
    const load = rail.loads.reduce((a, l) => a + l.mA, 0);
    const headroom = rail.supplyMA - load;
    out.push({
      rail: rail.rail, supplyMA: rail.supplyMA, loadMA: load,
      headroomMA: headroom, pct: Math.round((load / rail.supplyMA) * 100),
      ok: headroom >= 0,
      sources: rail.loads.map((l) => `${l.ref ?? l.what} ${l.mA} mA`).join(' + '),
    });
  }
  return out;
}
