/**
 * wallplug-drc.mjs — the design-rule checks for the xPort Wallplug board and
 * sheet. Pure: no fs, no DOM, so the same checks run in node (via
 * tools/build-wallplug-eagle.mjs --check and tests/20-wallplug.mjs) and in the
 * browser (lantronix-lab.html renders the verdicts next to the copper).
 */
import {
  BOARD, PACKAGES, SYMBOLS, DEVICESETS, PARTS, NETS, PLACEMENT,
  SCHEM_PLACEMENT, SHEET, padAbs, courtAbs, symbolBBox, STUB,
} from './wallplug-model.mjs';

export function collectPads() {
  const out = [];
  for (const part of PARTS) {
    const ds = DEVICESETS[part.set];
    const pkg = PACKAGES[ds.package];
    const place = PLACEMENT[part.ref];
    for (const pad of padAbs(pkg, place)) {
      const p = pad.pad;
      const swap = place.rot === 'R90' || place.rot === 'R270';
      out.push({
        ref: part.ref, pad: pad.name, x: pad.x, y: pad.y,
        shape: p.smd
          ? { box: true, hw: (swap ? p.smd.dy : p.smd.dx) / 2, hh: (swap ? p.smd.dx : p.smd.dy) / 2 }
          : { box: false, r: (p.diameter ?? p.drill * 2) / 2 },
        zone: part.padZones?.[pad.name] ?? part.zone, net: netOf(part.ref, ds, pad.name),
        drill: p.drill,
      });
    }
  }
  return out;
}

export function netOf(ref, ds, padName) {
  const pin = Object.entries(ds.connects).find(([, pad]) => pad === padName)?.[0];
  if (!pin) return null;
  for (const [net, members] of Object.entries(NETS)) {
    if (members.some(([r, p]) => r === ref && p === pin)) return net;
  }
  return null;
}

/**
 * Edge-to-edge distance between two pads. Round pads use their annulus radius,
 * SMD pads their (rotation-corrected) rectangle, so a 1.27 mm SOIC pitch does
 * not look like an overlap.
 */
export function padGap(a, b) {
  const boxGap = (A, B) => {
    const gx = Math.max(0, Math.abs(A.x - B.x) - A.shape.hw - B.shape.hw);
    const gy = Math.max(0, Math.abs(A.y - B.y) - A.shape.hh - B.shape.hh);
    return Math.hypot(gx, gy);
  };
  const circleBox = (c, r) => {
    const dx = Math.max(0, Math.abs(c.x - r.x) - r.shape.hw);
    const dy = Math.max(0, Math.abs(c.y - r.y) - r.shape.hh);
    return Math.hypot(dx, dy) - c.shape.r;
  };
  if (a.shape.box && b.shape.box) return boxGap(a, b);
  if (!a.shape.box && !b.shape.box) return Math.hypot(a.x - b.x, a.y - b.y) - a.shape.r - b.shape.r;
  return a.shape.box ? circleBox(b, a) : circleBox(a, b);
}

export function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

export function overlap(a, b, gap = 0) {
  return a.x1 - gap < b.x2 && b.x1 - gap < a.x2 && a.y1 - gap < b.y2 && b.y1 - gap < a.y2;
}

/** Pairs allowed to overlap (connector overhangs, mounting holes, test points). */
const OVERLAY_OK = (a, b) => {
  const refs = [a.ref, b.ref].sort();
  if (refs[0] === refs[1]) return true;
  if (['H1', 'H2', 'H3', 'H4'].includes(a.ref) || ['H1', 'H2', 'H3', 'H4'].includes(b.ref)) return true;
  return false;
};

export function checkGeometry() {
  const errors = [];
  const notes = [];
  const pads = collectPads();
  const placed = PARTS.map((part) => {
    const ds = DEVICESETS[part.set];
    const pkg = PACKAGES[ds.package];
    const place = PLACEMENT[part.ref];
    return { ref: part.ref, zone: part.zone, box: courtAbs(pkg, place), pkg, place, ds, part };
  });

  // 1. courtyard overlaps
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i], b = placed[j];
      if (OVERLAY_OK(a, b)) continue;
      if (overlap(a.box, b.box, 0.2)) {
        errors.push(`courtyard overlap ${a.ref} ${JSON.stringify(a.box)} × ${b.ref} ${JSON.stringify(b.box)}`);
      }
    }
  }

  // 2. board containment (parts flagged `edge` mate through the outline)
  for (const p of placed) {
    const edgeOk = Boolean(p.part.edge);
    const m = edgeOk ? 0 : BOARD.edgeClearance;
    if (p.box.x1 < -m || p.box.y1 < -m || p.box.x2 > BOARD.w + m || p.box.y2 > BOARD.h + m) {
      errors.push(`${p.ref} outside board outline: ${JSON.stringify(p.box)} (board ${BOARD.w} × ${BOARD.h}, margin ${m})`);
    }
  }

  // 3. pad-to-pad spacing (same-net pads may touch)
  for (let i = 0; i < pads.length; i++) {
    for (let j = i + 1; j < pads.length; j++) {
      const a = pads[i], b = pads[j];
      const gap = padGap(a, b);
      const sameNet = a.net && a.net === b.net;
      const samePart = a.ref === b.ref;
      if (gap < 0.35 - 1e-6 && !sameNet && !samePart) {
        errors.push(`pad spacing ${a.ref}.${a.pad} ↔ ${b.ref}.${b.pad} = ${gap.toFixed(2)} mm < 0.35 mm`);
      } else if (gap < 0.35 - 1e-6 && !sameNet && samePart) {
        notes.push(`intra-package pad gap ${a.ref}.${a.pad} ↔ ${b.ref}.${b.pad} = ${gap.toFixed(2)} mm (package pitch)`);
      }
    }
  }

  // 4. mains ↔ SELV creepage
  let worst = Infinity;
  let worstPair = '';
  for (const a of pads.filter((p) => p.zone === 'mains')) {
    for (const b of pads.filter((p) => p.zone !== 'mains')) {
      const d = padGap(a, b);
      if (d < worst) { worst = d; worstPair = `${a.ref}.${a.pad} ↔ ${b.ref}.${b.pad}`; }
      if (d < BOARD.creepageMm) {
        errors.push(`creepage ${a.ref}.${a.pad} (${a.zone}) ↔ ${b.ref}.${b.pad} (${b.zone}) = ${d.toFixed(2)} mm < ${BOARD.creepageMm} mm`);
      }
    }
  }

  // 5. mounting holes vs copper
  for (const h of placed.filter((p) => p.part.boardOnly)) {
    for (const pad of pads) {
      const d = Math.hypot(pad.x - h.place.x, pad.y - h.place.y);
      if (d < 3.2) errors.push(`mounting hole ${h.ref} too close to ${pad.ref}.${pad.pad} (${d.toFixed(2)} mm)`);
    }
  }

  return { errors, notes, pads, placed, worstCreepage: worst, worstPair };
}

export function checkSchematicLayout() {
  const errors = [];
  const boxes = [];
  for (const part of PARTS.filter((p) => !p.boardOnly)) {
    const ds = DEVICESETS[part.set];
    if (!ds.symbol) continue;
    const place = SCHEM_PLACEMENT[part.ref];
    if (!place) { errors.push(`no schematic placement for ${part.ref}`); continue; }
    const bb = symbolBBox(SYMBOLS[ds.symbol]);
    // stubs leave horizontally for R0/R180 pins, vertically for R90/R270 pins
    let dx = 0; let dy = 0;
    for (const pin of SYMBOLS[ds.symbol].pins || []) {
      if (pin.rot === 'R0' || pin.rot === 'R180') dx = Math.max(dx, STUB + 14);
      else dy = Math.max(dy, STUB + 4);
    }
    boxes.push({
      ref: part.ref,
      x1: bb.x1 + place.x - dx, x2: bb.x2 + place.x + dx,
      y1: bb.y1 + place.y - dy - 3, y2: bb.y2 + place.y + dy + 3,
    });
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (overlap(a, b, 1.0)) {
        errors.push(`instance boxes overlap: ${a.ref} [${a.x1.toFixed(1)},${a.y1.toFixed(1)} → ${a.x2.toFixed(1)},${a.y2.toFixed(1)}] × ${b.ref} [${b.x1.toFixed(1)},${b.y1.toFixed(1)} → ${b.x2.toFixed(1)},${b.y2.toFixed(1)}]`);
      }
    }
  }
  for (const b of boxes) {
    if (b.x1 < 5 || b.y1 < 5 || b.x2 > SHEET.w - 5 || b.y2 > SHEET.h - 5) {
      errors.push(`instance ${b.ref} runs off the sheet: [${b.x1.toFixed(1)},${b.y1.toFixed(1)} → ${b.x2.toFixed(1)},${b.y2.toFixed(1)}] (sheet ${SHEET.w} × ${SHEET.h})`);
    }
  }
  return { errors, boxes };
}

