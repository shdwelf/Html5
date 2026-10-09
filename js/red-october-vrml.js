/** RED OCTOBER · CUTAWAY — VRML 2.0 writer.
 *
 *  Emits a .wrl of the same arrays js/red-october-geo.js computes, so the
 *  exported model cannot disagree with what is on screen.
 *
 *  VRML 2.0 has no clipping planes, so the DK section cutaway is done
 *  geometrically: faces whose vertices all fall on one side of the cut plane
 * are emitted and the rest are dropped, and the open edge is capped with the
 *  cross-section polygon from sectionAt(). That is a real cut, not a texture
 *  trick, which is the only way a viewer without clip support shows the
 *  pressure hull inside the light hull.
 */

import {
  hullSurface,
  sectionAt,
  siloGrid,
  pressureHulls,
  compartments,
  HULL_FORM,
} from "./red-october-geo.js";

function fmt(n) {
  return Number(n).toFixed(4);
}

function name(s) {
  return String(s).replace(/[^A-Za-z0-9_]/g, "_").slice(0, 60);
}

function str(s) {
  return `"${String(s).replace(/["\\\r\n]/g, "")}"`;
}

const APPEAR = (rgb, transparency = 0) =>
  `appearance Appearance { material Material { diffuseColor ${fmt(rgb[0])} ${fmt(rgb[1])} ${fmt(rgb[2])}` +
  ` emissiveColor ${fmt(rgb[0] * 0.25)} ${fmt(rgb[1] * 0.25)} ${fmt(rgb[2] * 0.25)}` +
  ` transparency ${fmt(transparency)} } }`;

/**
 * The light-hull surface, cut at z <= 0 when `cut` is true.
 * Returns the VRML Shape body plus how many faces survived the cut, so the
 * caller can report a real number rather than claiming the whole hull.
 */
function hullShape(boat, cut, opts) {
  const form = HULL_FORM[boat.id] || HULL_FORM.dallas;
  const { positions, index, nRings } = hullSurface(boat, opts.stations || 49, opts.rings || 28, form);

  const vx = [];
  for (let i = 0; i < positions.length; i += 3) vx.push({ x: positions[i], y: positions[i + 1], z: positions[i + 2] });

  const coord = [];
  const remap = new Map();
  const faceIdx = [];
  let kept = 0;
  let dropped = 0;

  const push = (vi) => {
    if (remap.has(vi)) return remap.get(vi);
    const v = vx[vi];
    coord.push(`${fmt(v.x)} ${fmt(v.y)} ${fmt(v.z)}`);
    const n = coord.length - 1;
    remap.set(vi, n);
    return n;
  };

  for (let f = 0; f < index.length; f += 3) {
    const tri = [index[f], index[f + 1], index[f + 2]];
    const keep = cut ? tri.every((vi) => vx[vi].z <= 1e-9) : true;
    if (!keep) {
      dropped++;
      continue;
    }
    kept++;
    faceIdx.push(`${push(tri[0])} ${push(tri[1])} ${push(tri[2])} -1`);
  }

  const solid = cut ? "FALSE" : "TRUE";
  const shape = `Shape {
      ${APPEAR(opts.hullColor || [0.42, 0.46, 0.48], cut ? 0.15 : 0)}
      geometry IndexedFaceSet {
        coord Coordinate { point [ ${coord.join(", ")} ] }
        coordIndex [ ${faceIdx.join(" ")} ]
        solid ${solid}
        creaseAngle 0.6
      }
    }`;
  return { shape, kept, dropped, vertices: coord.length };
}

/** The DK cross-section cap at the cut plane: the superellipse outline. */
function capShape(boat, opts) {
  const sec = sectionAt(boat, opts.capStation == null ? 0.5 : opts.capStation);
  const pts = sec.outline
    .map((p) => `${fmt(sec.x)} ${fmt(p.y)} ${fmt(p.z)}`)
    .join(", ");
  const idx = [];
  for (let i = 0; i < sec.outline.length; i++) idx.push(i);
  return {
    sec,
    shape: `Shape {
      ${APPEAR([0.86, 0.55, 0.2], 0.05)}
      geometry IndexedFaceSet {
        coord Coordinate { point [ ${pts} ] }
        coordIndex [ ${idx.join(" ")} -1 ]
        solid FALSE
      }
    }`,
  };
}

function cylinderAlong(x0, x1, y, z, r, rgb) {
  const len = Math.abs(x1 - x0);
  return `Transform {
      translation ${fmt((x0 + x1) / 2)} ${fmt(y)} ${fmt(z)}
      rotation 0 0 1 1.5707963
      children Shape {
        ${APPEAR(rgb)}
        geometry Cylinder { radius ${fmt(r)} height ${fmt(len)} }
      }
    }`;
}

/**
 * Build the .wrl.
 *
 * opts:
 *   cut          boolean — emit only the port half (the DK section)
 *   capStation   0..1 — where the section cap sits, default midships
 *   labels       boolean — emit Text nodes for compartments
 *   pressure     boolean — draw the pressure hulls
 *   silos        boolean — draw the missile grid
 *   stations     hull surface resolution
 *   rings        hull surface resolution
 */
export function boatToVrml(boat, opts = {}) {
  const o = {
    cut: true,
    capStation: 0.5,
    labels: true,
    pressure: true,
    silos: true,
    stations: 49,
    rings: 28,
    hullColor: [0.42, 0.46, 0.48],
    title: null,
    ...opts,
  };

  const parts = [];
  const hull = hullShape(boat, o.cut, o);
  parts.push(`DEF LAYER_${name(boat.id)}_HULL Transform { children [ ${hull.shape} ] }`);

  if (o.cut) {
    const cap = capShape(boat, o);
    parts.push(`DEF LAYER_${name(boat.id)}_SECTION Transform { children [ ${cap.shape} ] }`);
  }

  if (o.pressure) {
    const hulls = pressureHulls(boat);
    const r = boat.dim.hullDiameter / 2;
    const x0 = boat.dim.loa * 0.05;
    const x1 = boat.dim.loa * 0.95;
    const inner = hulls
      .filter((h) => !o.cut || h.cx <= 0)
      .map((h) => cylinderAlong(x0, x1, 0, h.cx, r, [0.72, 0.62, 0.28]))
      .join("\n    ");
    parts.push(`DEF LAYER_${name(boat.id)}_PRESSURE Transform { children [ ${inner} ] }`);
  }

  if (o.silos) {
    const grid = siloGrid(boat);
    const y = boat.dim.hullDiameter / 2 + 2.0;
    const inner = grid
      .filter((s) => !o.cut || s.z <= 0)
      .map((s) => cylinderAlong(s.x - 2.5, s.x + 2.5, y, s.z, s.r, [0.36, 0.5, 0.56]))
      .join("\n    ");
    if (inner) {
      parts.push(`DEF LAYER_${name(boat.id)}_SILOS Transform { children [ ${inner} ] }`);
    }
  }

  // Compartments as translucent boxes, so the section reads as a floor plan.
  const comps = compartments(boat);
  const boxes = comps
    .map(
      (c) => `Transform {
      translation ${fmt((c.x0 + c.x1) / 2)} ${fmt((c.yTop + c.yBottom) / 2)} 0
      children Shape {
        ${APPEAR([0.3, 0.55, 0.6], 0.72)}
        geometry Box { size ${fmt(Math.max(0.01, c.x1 - c.x0))} ${fmt(Math.max(0.01, c.yTop - c.yBottom))} ${fmt(boat.dim.beam * 0.9)} }
      }
    }`,
    )
    .join("\n    ");
  parts.push(`DEF LAYER_${name(boat.id)}_COMPARTMENTS Transform { children [ ${boxes} ] }`);

  if (o.labels) {
    const labelNodes = comps
      .map(
        (c) => `Transform {
      translation ${fmt((c.x0 + c.x1) / 2)} ${fmt(c.yTop + 2.5)} 0
      children Shape {
        ${APPEAR([0.95, 0.9, 0.78])}
        geometry Text { string [ ${str(c.label)} ] fontStyle FontStyle { size 3 } }
      }
    }`,
      )
      .join("\n    ");
    parts.push(`DEF LAYER_${name(boat.id)}_LABELS Transform { children [ ${labelNodes} ] }`);
  }

  const title =
    o.title ||
    `${boat.name} · ${boat.project} · NATO ${boat.nato} — DK cross-section` +
      (o.cut ? " (port half, cut at the centreline)" : "");

  const header = `#VRML V2.0 utf8
# Generated by js/red-october-vrml.js — do not edit by hand.
# ${title}
# LOA ${fmt(boat.dim.loa)} m · beam ${fmt(boat.dim.beam)} m · hull Ø ${fmt(boat.dim.hullDiameter)} m
# Light-hull faces emitted: ${hull.kept} (dropped by the cut: ${hull.dropped})
# Coordinates are metres. +X bow, +Y up, +Z starboard.
`;

  const info = `DEF INFO Group { children [
  Transform { children Shape { ${APPEAR([1, 1, 1])} geometry Text { string [ ${str(title)} ] fontStyle FontStyle { size 4 } } } }
] }
`;

  return `${header}\nNavigationInfo { type [ "EXAMINE" "ANY" ] headlight TRUE }\nBackground { skyColor [ 0.04 0.06 0.09 ] }\n\n${info}\n${parts.join("\n\n")}\n`;
}

/**
 * A cheap structural validation, so a test can assert the export is well
 * formed without a VRML parser: header, balanced braces, and a non-empty
 * IndexedFaceSet. Returns a list of problems (empty = valid).
 */
export function validateVrml(wrl) {
  const problems = [];
  if (!wrl.startsWith("#VRML V2.0 utf8")) problems.push("missing #VRML V2.0 utf8 header");
  let depth = 0;
  for (const ch of wrl) {
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth < 0) {
      problems.push("unbalanced: closing brace before its opener");
      break;
    }
  }
  if (depth !== 0) problems.push(`unbalanced braces: ${depth} unclosed`);
  if (!/IndexedFaceSet/.test(wrl)) problems.push("no IndexedFaceSet in the export");
  if (/NaN|Infinity|undefined/.test(wrl)) problems.push("non-finite or undefined value in the export");
  return problems;
}
