/**
 * wallplug-model.mjs — the single source of truth for the "xPort Wallplug"
 * hardware design: packages, symbols, devicesets, parts, netlist, schematic and
 * board placements, BOM.
 *
 * Everything downstream is generated from this file:
 *
 *   tools/build-wallplug-eagle.mjs   → hardware/lantronix-wallplug/*.lbr/.sch/.brd + BOM.md
 *   lantronix-lab.html               → in-browser schematic/board viewer (imports this module)
 *   tests/20-wallplug.mjs            → structure + geometry checks
 *
 * Geometry provenance (see docs/lantronix-uclinux-deep-dive-2026-10-08.md §9):
 *   XPORTPRO  Lantronix xPort Pro Integration Guide 900-557 rev K, Table 2-2
 *             (pin functions) + Figure 2-7 (hole pattern), cross-checked against
 *             two third-party footprints: robertstarr/lbr_user lantronix.lbr
 *             (package XPORT) and tridrao/SparkFun-KiCad-Libraries
 *             XPORT.kicad_mod.
 *   HLK-PM03  Hi-Link HLK-PM03 (34 x 20 x 15 mm, 3.3 V / 1 A pk, 85-265 VAC,
 *             3 kV isolation); pin geometry from two independent KiCad
 *             footprints (ranseyer/home-automatics, CarnivalBen/BGCustomKiCadLibraries)
 *             which agree: AC pair 5.08 mm apart, DC pair 15.24 mm apart,
 *             rows 29.21 mm apart.
 *   DB9M-RA   KiCad kicad-footprints Connector_Dsub.pretty
 *             DSUB-9_Male_Horizontal_P2.77x2.84mm_EdgePinOffset7.70mm_Housed_
 *             MountingHolesOffset9.12mm (pad grid 2.77 x 2.84, holes 3.2 mm).
 *   SOIC-16   KiCad Package_SO.pretty/SOIC-16_3.9x9.9mm_P1.27mm (pad centres
 *             ±2.475 mm, pads 1.95 x 0.6 mm).
 *   SW_TACT6  KiCad Button_Switch_THT.pretty/SW_PUSH_6mm (pads ±3.25 / ±2.25).
 *   The rest are standard through-hole patterns (DIN0207 axial 7.62 mm, disc
 *   cap 5.08 mm, radial electrolytic, 5.08 mm screw terminal, 2.54 mm headers).
 *
 * Units: millimetres everywhere, Eagle-native (y up). Rotations are Eagle
 * counter-clockwise: R0, R90, R180, R270.
 */

/* ------------------------------------------------------------------ helpers */

/** Rotate a package/symbol-local point by an Eagle rotation string. */
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

const rnd = (v, p = 4) => Number(Number(v).toFixed(p));

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

/* ------------------------------------------------------------------- board */

export const BOARD = {
  name: 'lantronix-wallplug',
  rev: 'A',
  w: 110,          // mm
  h: 70,           // mm
  layers: 2,
  thickness: 1.6,
  edgeClearance: 1.5,   // nothing but edge connectors inside this margin
  // Functional zones, used by the creepage/clearance checker.
  zones: {
    mains: { x1: 0, y1: 34, x2: 50, y2: 70 },
    selv: { x1: 46, y1: 0, x2: 110, y2: 70 },
  },
  creepageMm: 6.4,      // reinforced insulation, 250 V rms working (IEC 62368-1 / 60664-1)
  clearanceMm: 4.0,
  mountingHoles: [      // M3, non-plated, at the four corners
    { x: 4, y: 4 }, { x: 106, y: 4 }, { x: 4, y: 66 }, { x: 106, y: 66 },
  ],
};

/* ---------------------------------------------------------------- packages */

const P = {};

P.XPORTPRO = {
  name: 'XPORTPRO',
  descr: 'Lantronix xPort Pro / xPort Pro Lx6 embedded device server, RJ45 at +X (front)',
  courtyard: { x1: -18.9, y1: -9.0, x2: 16.0, y2: 9.0 },
  pads: [
    // Staggered 8-pin interface: two rows 2.54 mm apart, 1.27 mm stagger.
    { name: '1', x: 1.27, y: -3.58, drill: 0.9, diameter: 1.8, shape: 'square' },
    { name: '2', x: -1.27, y: -2.31, drill: 0.9, diameter: 1.8 },
    { name: '3', x: 1.27, y: -1.04, drill: 0.9, diameter: 1.8 },
    { name: '4', x: -1.27, y: 0.23, drill: 0.9, diameter: 1.8 },
    { name: '5', x: 1.27, y: 1.5, drill: 0.9, diameter: 1.8 },
    { name: '6', x: -1.27, y: 2.77, drill: 0.9, diameter: 1.8 },
    { name: '7', x: 1.27, y: 4.04, drill: 0.9, diameter: 1.8 },
    { name: '8', x: -1.27, y: 5.31, drill: 0.9, diameter: 1.8 },
    // Shield tabs (chassis ground + heat sink; IG asks for ~1 in^2 of copper).
    { name: 'S1', x: 4.28, y: 8.025, drill: 1.6764, diameter: 3.175, shape: 'square' },
    { name: 'S2', x: 4.28, y: -8.025, drill: 1.6764, diameter: 3.175, shape: 'square' },
  ],
  holes: [
    { x: -7.62, y: 6.15, drill: 3.5 },
    { x: -7.62, y: -6.15, drill: 3.5 },
  ],
  silk: [
    { w: [{ x: -18.42, y: 8.5 }, { x: 15.48, y: 8.5 }], layer: 21 },
    { w: [{ x: 15.48, y: 8.5 }, { x: 15.48, y: -8.5 }], layer: 21 },
    { w: [{ x: 15.48, y: -8.5 }, { x: -18.42, y: -8.5 }], layer: 21 },
    { w: [{ x: -18.42, y: -8.5 }, { x: -18.42, y: 8.5 }], layer: 21 },
    // RJ45 nose (the plastic that carries the connector) — documentation layer.
    { w: [{ x: 2.38, y: 8.5 }, { x: 6.13, y: 8.5 }], layer: 51, style: 'shortdash' },
    { w: [{ x: 2.38, y: -8.5 }, { x: 6.13, y: -8.5 }], layer: 51, style: 'shortdash' },
    { w: [{ x: 12.0, y: 6.0 }, { x: 12.0, y: -6.0 }], layer: 51, style: 'shortdash' },
  ],
  texts: [
    { x: -14.0, y: -0.6, size: 1.27, layer: 51, rot: 'R0', text: 'FRONT (RJ45)' },
    { x: 16.6, y: -8.2, size: 1.27, layer: 25, rot: 'R90', text: '>NAME' },
    { x: 10.0, y: -1.0, size: 1.0, layer: 27, rot: 'R90', text: '>VALUE' },
  ],
};

P.HLKPM03 = {
  name: 'HLKPM03',
  descr: 'Hi-Link HLK-PM03 3 W AC/DC module, 85-265 VAC in, 3.3 V / 1 A out, 3 kV isolation',
  courtyard: { x1: -18.5, y1: -11.6, x2: 18.5, y2: 11.6 },
  pads: [
    { name: '1', x: -14.605, y: 2.54, drill: 1.0, diameter: 2.2, shape: 'square' }, // AC-L
    { name: '2', x: -14.605, y: -2.54, drill: 1.0, diameter: 2.2 },                 // AC-N
    { name: '3', x: 14.605, y: -7.62, drill: 1.0, diameter: 2.2 },                  // -Vo
    { name: '4', x: 14.605, y: 7.62, drill: 1.0, diameter: 2.2 },                   // +Vo
  ],
  silk: [
    { w: [{ x: -17, y: 10.1 }, { x: 17, y: 10.1 }], layer: 21 },
    { w: [{ x: 17, y: 10.1 }, { x: 17, y: -10.1 }], layer: 21 },
    { w: [{ x: 17, y: -10.1 }, { x: -17, y: -10.1 }], layer: 21 },
    { w: [{ x: -17, y: -10.1 }, { x: -17, y: 10.1 }], layer: 21 },
    // Isolation barrier inside the module: keep copper out of the 6.4 mm band.
    { w: [{ x: -3.2, y: 10.1 }, { x: -3.2, y: -10.1 }], layer: 51, style: 'shortdash' },
    { w: [{ x: 3.2, y: 10.1 }, { x: 3.2, y: -10.1 }], layer: 51, style: 'shortdash' },
  ],
  texts: [
    { x: -16.0, y: 5.5, size: 1.27, layer: 21, text: 'AC-L' },
    { x: -16.0, y: -6.5, size: 1.27, layer: 21, text: 'AC-N' },
    { x: 8.0, y: 6.5, size: 1.27, layer: 21, text: '+Vo' },
    { x: 8.0, y: -9.0, size: 1.27, layer: 21, text: '-Vo' },
    { x: -6.0, y: -1.0, size: 1.4, layer: 21, text: 'HLK-PM03' },
    { x: 19.0, y: -10.0, size: 1.27, layer: 25, rot: 'R90', text: '>NAME' },
  ],
};

P.SO16 = {
  name: 'SO16',
  descr: 'SOIC-16 narrow, 3.9 x 9.9 mm, 1.27 mm pitch (MAX3232)',
  courtyard: { x1: -3.8, y1: -5.3, x2: 3.8, y2: 5.3 },
  pads: Array.from({ length: 16 }, (_, i) => {
    const n = i + 1;
    const left = n <= 8;
    const k = left ? n - 1 : 16 - n;
    return {
      name: String(n),
      x: left ? -2.475 : 2.475,
      y: rnd(4.445 - k * 1.27),
      smd: { dx: 1.95, dy: 0.6, layer: 1 },
    };
  }),
  silk: [
    { w: [{ x: -1.95, y: 4.95 }, { x: 1.95, y: 4.95 }], layer: 21 },
    { w: [{ x: 1.95, y: 4.95 }, { x: 1.95, y: -4.95 }], layer: 21 },
    { w: [{ x: 1.95, y: -4.95 }, { x: -1.95, y: -4.95 }], layer: 21 },
    { w: [{ x: -1.95, y: -4.95 }, { x: -1.95, y: 4.95 }], layer: 21 },
  ],
  circles: [{ x: -1.2, y: 4.2, r: 0.35, layer: 21 }],
  texts: [
    { x: -1.9, y: 5.6, size: 1.0, layer: 25, text: '>NAME' },
    { x: -1.9, y: -6.6, size: 1.0, layer: 27, text: '>VALUE' },
  ],
};

P.SO8 = {
  name: 'SO8',
  descr: 'SOIC-8 narrow, 3.9 x 4.9 mm, 1.27 mm pitch (SP3485 / AD3485)',
  courtyard: { x1: -3.3, y1: -3.0, x2: 3.3, y2: 3.0 },
  pads: Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const left = n <= 4;
    const k = left ? n - 1 : 8 - n;
    return {
      name: String(n),
      x: left ? -1.9 : 1.9,
      y: rnd(1.905 - k * 1.27),
      smd: { dx: 1.6, dy: 0.6, layer: 1 },
    };
  }),
  silk: [
    { w: [{ x: -1.95, y: 2.45 }, { x: 1.95, y: 2.45 }], layer: 21 },
    { w: [{ x: 1.95, y: 2.45 }, { x: 1.95, y: -2.45 }], layer: 21 },
    { w: [{ x: 1.95, y: -2.45 }, { x: -1.95, y: -2.45 }], layer: 21 },
    { w: [{ x: -1.95, y: -2.45 }, { x: -1.95, y: 2.45 }], layer: 21 },
  ],
  circles: [{ x: -1.2, y: 1.8, r: 0.3, layer: 21 }],
  texts: [{ x: -1.9, y: 3.1, size: 1.0, layer: 25, text: '>NAME' }],
};

// Right-angle DE-9 (DB9) male, housed. Origin = pin 1. Board edge sits 7.70 mm
// in -Y from pin row 1 (KiCad EdgePinOffset7.70mm); the shell reaches +17.45.
P.DB9MRA = {
  name: 'DB9MRA',
  descr: 'DE-9 (DB9) male, right angle, housed; board edge 7.70 mm from pin row 1',
  courtyard: { x1: -10.4, y1: -2.35, x2: 21.5, y2: 17.95 },
  pads: [
    ...[0, 1, 2, 3, 4].map((k) => ({
      name: String(k + 1), x: rnd(k * 2.77), y: 0, drill: 1.0, diameter: 1.8,
      shape: k === 0 ? 'square' : 'round',
    })),
    ...[0, 1, 2, 3].map((k) => ({
      name: String(k + 6), x: rnd(1.385 + k * 2.77), y: 2.84, drill: 1.0, diameter: 1.8,
    })),
    { name: 'MH', x: -6.96, y: 1.42, drill: 3.2, diameter: 4.4 },
    { name: 'MH', x: 18.04, y: 1.42, drill: 3.2, diameter: 4.4 },
  ],
  silk: [
    { w: [{ x: -9.885, y: -1.8 }, { x: 20.965, y: -1.8 }], layer: 21 },
    { w: [{ x: 20.965, y: -1.8 }, { x: 20.965, y: 10.54 }], layer: 21 },
    { w: [{ x: 20.965, y: 10.54 }, { x: -9.885, y: 10.54 }], layer: 21 },
    { w: [{ x: -9.885, y: 10.54 }, { x: -9.885, y: -1.8 }], layer: 21 },
    { w: [{ x: -9.46, y: 10.94 }, { x: -9.46, y: 15.94 }], layer: 21 },
    { w: [{ x: -9.46, y: 15.94 }, { x: -4.46, y: 15.94 }], layer: 21 },
    { w: [{ x: -4.46, y: 15.94 }, { x: -4.46, y: 10.94 }], layer: 21 },
    { w: [{ x: 15.54, y: 10.94 }, { x: 15.54, y: 15.94 }], layer: 21 },
    { w: [{ x: 15.54, y: 15.94 }, { x: 20.54, y: 15.94 }], layer: 21 },
    { w: [{ x: 20.54, y: 15.94 }, { x: 20.54, y: 10.94 }], layer: 21 },
    // Board-edge reference line: the connector mates through this line.
    { w: [{ x: -10.4, y: -7.7 }, { x: 21.5, y: -7.7 }], layer: 51, style: 'shortdash' },
  ],
  texts: [
    { x: -10.0, y: -10.0, size: 1.0, layer: 51, text: 'BOARD EDGE' },
    { x: 2.0, y: 11.5, size: 1.27, layer: 25, text: '>NAME' },
    { x: 2.0, y: 5.0, size: 1.0, layer: 27, text: '>VALUE' },
  ],
};

/** n-pin 5.08 mm screw terminal, origin at the centre of the pin row. */
function terminal(n, name, descr) {
  const span = (n - 1) * 5.08;
  return {
    name, descr,
    courtyard: { x1: rnd(-span / 2 - 3.0), y1: -5.4, x2: rnd(span / 2 + 3.0), y2: 5.4 },
    pads: Array.from({ length: n }, (_, i) => ({
      name: String(i + 1), x: rnd(-span / 2 + i * 5.08), y: 0,
      drill: 1.52, diameter: 3.0, shape: i === 0 ? 'square' : 'round',
    })),
    silk: [
      { w: [{ x: -span / 2 - 2.54, y: 4.75 }, { x: span / 2 + 2.54, y: 4.75 }], layer: 21 },
      { w: [{ x: span / 2 + 2.54, y: 4.75 }, { x: span / 2 + 2.54, y: -4.75 }], layer: 21 },
      { w: [{ x: span / 2 + 2.54, y: -4.75 }, { x: -span / 2 - 2.54, y: -4.75 }], layer: 21 },
      { w: [{ x: -span / 2 - 2.54, y: -4.75 }, { x: -span / 2 - 2.54, y: 4.75 }], layer: 21 },
    ],
    texts: [{ x: rnd(-span / 2 - 2.0), y: 5.4, size: 1.27, layer: 25, text: '>NAME' }],
  };
}

P.TERM2 = terminal(2, 'TERM2-5.08', '2-pin 5.08 mm screw terminal (mains input)');
P.TERM5 = terminal(5, 'TERM5-5.08', '5-pin 5.08 mm screw terminal (RS-232 field wiring)');

/** Two-pad axial part (resistor / ferrite / fuse / MOV / LED / disc cap). */
function axial(name, descr, pitch, body, courtyardPad, opts = {}) {
  return {
    name, descr,
    courtyard: {
      x1: rnd(-pitch / 2 - courtyardPad), y1: -courtyardPad - (body.h / 2),
      x2: rnd(pitch / 2 + courtyardPad), y2: courtyardPad + (body.h / 2),
    },
    pads: [
      { name: '1', x: rnd(-pitch / 2), y: 0, drill: opts.drill ?? 0.8, diameter: opts.diameter ?? 1.7, shape: 'square' },
      { name: '2', x: rnd(pitch / 2), y: 0, drill: opts.drill ?? 0.8, diameter: opts.diameter ?? 1.7 },
    ],
    silk: body.round
      ? [{ c: { x: 0, y: 0, r: body.h / 2 }, layer: 21 }]
      : [
        { w: [{ x: -body.l / 2, y: body.h / 2 }, { x: body.l / 2, y: body.h / 2 }], layer: 21 },
        { w: [{ x: body.l / 2, y: body.h / 2 }, { x: body.l / 2, y: -body.h / 2 }], layer: 21 },
        { w: [{ x: body.l / 2, y: -body.h / 2 }, { x: -body.l / 2, y: -body.h / 2 }], layer: 21 },
        { w: [{ x: -body.l / 2, y: -body.h / 2 }, { x: -body.l / 2, y: body.h / 2 }], layer: 21 },
      ],
    leads: [
      { w: [{ x: rnd(-pitch / 2), y: 0 }, { x: -body.l / 2, y: 0 }], layer: 51 },
      { w: [{ x: body.l / 2, y: 0 }, { x: rnd(pitch / 2), y: 0 }], layer: 51 },
    ],
    texts: [{ x: rnd(-body.l / 2), y: rnd(body.h / 2 + 0.5), size: 1.0, layer: 25, text: '>NAME' }],
  };
}

P.R762 = axial('R-7.62', 'Resistor, axial DIN0207 (6.3 x 2.5 mm), 7.62 mm pitch', 7.62, { l: 6.3, h: 2.5 }, 0.5);
P.FB762 = axial('FB-7.62', 'Ferrite bead, axial 7.2 x 4.0 mm, 7.62 mm pitch', 7.62, { l: 7.2, h: 4.0 }, 0.5);
P.C508 = axial('C-5.08', 'Ceramic / film disc capacitor, 5.0 x 2.5 mm, 5.08 mm pitch', 5.08, { l: 5.0, h: 2.5 }, 0.5);
P.C200V = axial('C-5.08-200V', 'Ceramic disc capacitor, 200 V rated, 5.08 mm pitch', 5.08, { l: 5.0, h: 3.0 }, 0.5);
P.FUSE_R = axial('FUSE-RADIAL', 'Radial fuse, TR5 / 372 series, 8.5 mm body, 5.08 mm pitch', 5.08, { l: 8.5, h: 8.5, round: true }, 0.6, { drill: 1.0, diameter: 2.0 });
P.MOV07 = axial('MOV07', 'Metal-oxide varistor, 7 mm disc, 5.0 mm pitch', 5.0, { l: 7.0, h: 7.0, round: true }, 0.6, { drill: 0.8, diameter: 1.8 });
P.LED5 = axial('LED-5MM', 'LED 5 mm, 2.54 mm pitch', 2.54, { l: 5.0, h: 5.0, round: true }, 0.6);

/** Radial electrolytic. */
function radialCp(name, descr, d, pitch) {
  return {
    name, descr,
    courtyard: { x1: rnd(-d / 2 - 0.5), y1: rnd(-d / 2 - 0.5), x2: rnd(d / 2 + 0.5), y2: rnd(d / 2 + 0.5) },
    pads: [
      { name: '+', x: rnd(-pitch / 2), y: 0, drill: 1.0, diameter: 2.0, shape: 'square' },
      { name: '-', x: rnd(pitch / 2), y: 0, drill: 1.0, diameter: 2.0 },
    ],
    silk: [{ c: { x: 0, y: 0, r: d / 2 }, layer: 21 }],
    texts: [
      { x: rnd(-d / 2 + 0.6), y: rnd(-d / 2 + 0.4), size: 1.4, layer: 21, text: '+' },
      { x: rnd(-d / 2), y: rnd(d / 2 + 0.4), size: 1.0, layer: 25, text: '>NAME' },
    ],
  };
}

P.CP10 = radialCp('CP-D10-P5', 'Electrolytic, radial, 10 mm dia, 5.0 mm pitch', 10.0, 5.0);
P.CP63 = radialCp('CP-D6.3-P2.5', 'Electrolytic, radial, 6.3 mm dia, 2.5 mm pitch', 6.3, 2.5);

P.SWTACT6 = {
  name: 'SW-TACT-6MM',
  descr: 'Tactile pushbutton 6 x 6 mm, 2 poles (pins 1/1 and 2/2 internally common)',
  courtyard: { x1: -4.0, y1: -4.0, x2: 4.0, y2: 4.0 },
  pads: [
    { name: '1', x: -3.25, y: -2.25, drill: 1.1, diameter: 2.0, shape: 'square' },
    { name: '1', x: 3.25, y: -2.25, drill: 1.1, diameter: 2.0 },
    { name: '2', x: -3.25, y: 2.25, drill: 1.1, diameter: 2.0 },
    { name: '2', x: 3.25, y: 2.25, drill: 1.1, diameter: 2.0 },
  ],
  silk: [
    { w: [{ x: -3.0, y: -3.0 }, { x: 3.0, y: -3.0 }], layer: 21 },
    { w: [{ x: 3.0, y: -3.0 }, { x: 3.0, y: 3.0 }], layer: 21 },
    { w: [{ x: 3.0, y: 3.0 }, { x: -3.0, y: 3.0 }], layer: 21 },
    { w: [{ x: -3.0, y: 3.0 }, { x: -3.0, y: -3.0 }], layer: 21 },
  ],
  texts: [{ x: -3.0, y: 4.2, size: 1.0, layer: 25, text: '>NAME' }],
};

/** Three-pad solder jumper (strap selector). */
P.SJ3 = {
  name: 'SJ-3',
  descr: '3-pad solder jumper strap, 1.27 mm pitch',
  courtyard: { x1: -2.4, y1: -1.4, x2: 2.4, y2: 1.4 },
  pads: [
    { name: '1', x: -1.27, y: 0, drill: 0.8, diameter: 1.5, shape: 'square' },
    { name: '2', x: 0, y: 0, drill: 0.8, diameter: 1.5 },
    { name: '3', x: 1.27, y: 0, drill: 0.8, diameter: 1.5 },
  ],
  silk: [
    { w: [{ x: -2.1, y: 1.1 }, { x: 2.1, y: 1.1 }], layer: 21 },
    { w: [{ x: 2.1, y: 1.1 }, { x: 2.1, y: -1.1 }], layer: 21 },
    { w: [{ x: 2.1, y: -1.1 }, { x: -2.1, y: -1.1 }], layer: 21 },
    { w: [{ x: -2.1, y: -1.1 }, { x: -2.1, y: 1.1 }], layer: 21 },
  ],
  texts: [{ x: -2.1, y: 1.5, size: 0.9, layer: 25, text: '>NAME' }],
};

/** 2 x n pin header, 2.54 mm. */
function header2xn(n, name, descr) {
  const span = (n - 1) * 2.54;
  return {
    name, descr,
    courtyard: { x1: rnd(-span / 2 - 1.6), y1: -3.0, x2: rnd(span / 2 + 1.6), y2: 3.0 },
    pads: Array.from({ length: n * 2 }, (_, i) => {
      const col = Math.floor(i / 2);
      const row = i % 2;
      return {
        name: String(i + 1),
        x: rnd(-span / 2 + col * 2.54),
        y: row === 0 ? -1.27 : 1.27,
        drill: 1.0, diameter: 1.8, shape: i === 0 ? 'square' : 'round',
      };
    }),
    silk: [
      { w: [{ x: -span / 2 - 1.27, y: 2.54 }, { x: span / 2 + 1.27, y: 2.54 }], layer: 21 },
      { w: [{ x: span / 2 + 1.27, y: 2.54 }, { x: span / 2 + 1.27, y: -2.54 }], layer: 21 },
      { w: [{ x: span / 2 + 1.27, y: -2.54 }, { x: -span / 2 - 1.27, y: -2.54 }], layer: 21 },
      { w: [{ x: -span / 2 - 1.27, y: -2.54 }, { x: -span / 2 - 1.27, y: 2.54 }], layer: 21 },
    ],
    texts: [{ x: rnd(-span / 2 - 1.2), y: 3.2, size: 1.0, layer: 25, text: '>NAME' }],
  };
}

P.HDR2X5 = header2xn(5, 'HDR-2X5', '2 x 5 pin header, 2.54 mm (TTL serial + CP + reset)');

P.TP = {
  name: 'TP',
  descr: 'Test point, 1.0 mm hole, 2.0 mm pad',
  courtyard: { x1: -1.3, y1: -1.3, x2: 1.3, y2: 1.3 },
  pads: [{ name: '1', x: 0, y: 0, drill: 1.0, diameter: 2.0 }],
  texts: [{ x: -1.2, y: 1.6, size: 0.9, layer: 25, text: '>NAME' }],
};

P.MOUNT3 = {
  name: 'MOUNT-M3',
  descr: 'M3 mounting hole, 3.2 mm, non-plated, with keep-out ring',
  courtyard: { x1: -2.6, y1: -2.6, x2: 2.6, y2: 2.6 },
  pads: [],
  holes: [{ x: 0, y: 0, drill: 3.2 }],
  silk: [{ c: { x: 0, y: 0, r: 2.4 }, layer: 41 }],
  restrict: [{ c: { x: 0, y: 0, r: 2.4 }, layer: 41 }],
};

// Normalise: packages and symbols are keyed by their own `name`, which is what
// the devicesets (and therefore the EAGLE XML) reference.
const byName = (o) => Object.fromEntries(Object.values(o).map((v) => [v.name, v]));

export const PACKAGES = byName(P);

/* ----------------------------------------------------------------- symbols */

/**
 * Symbol pin convention (Eagle): the connection point is at (x,y); rot R0 puts
 * the pin on the left edge pointing right, R180 on the right edge, R270 on top,
 * R90 on the bottom. `length` is the pin line length (short=2.54, middle=5.08).
 */
const S = {};

function box(w, h, layer = 94, width = 0.254) {
  const x = w / 2, y = h / 2;
  return [
    { w: [{ x: -x, y }, { x, y }], layer, width },
    { w: [{ x, y }, { x, y: -y }], layer, width },
    { w: [{ x, y: -y }, { x: -x, y: -y }], layer, width },
    { w: [{ x: -x, y: -y }, { x: -x, y }], layer, width },
  ];
}

function nameValue(w, h) {
  return [
    { x: rnd(-w / 2), y: rnd(h / 2 + 1.0), size: 1.778, layer: 95, text: '>NAME' },
    { x: rnd(-w / 2), y: rnd(-h / 2 - 2.6), size: 1.778, layer: 96, text: '>VALUE' },
  ];
}

S.XPORTPRO = {
  name: 'XPORTPRO',
  wires: box(20.32, 30.48, 94, 0.4064),
  texts: [
    ...nameValue(20.32, 30.48),
    { x: -6.0, y: -2.0, size: 1.778, layer: 94, ratio: 10, text: 'xPort Pro' },
    { x: -6.0, y: -4.6, size: 1.4, layer: 94, ratio: 10, text: '16 MB flash' },
    { x: -6.0, y: 12.0, size: 1.4, layer: 94, ratio: 10, text: 'RJ45 10/100' },
  ],
  pins: [
    { name: 'GND', x: -15.24, y: -12.7, rot: 'R0', length: 'middle', direction: 'pwr' },
    { name: '3V3', x: -15.24, y: -10.16, rot: 'R0', length: 'middle', direction: 'pwr' },
    { name: '!RESET', x: -15.24, y: 12.7, rot: 'R0', length: 'middle', direction: 'in', function: 'dot' },
    { name: 'DOUT', x: -15.24, y: 7.62, rot: 'R0', length: 'middle', direction: 'out' },
    { name: 'DIN', x: -15.24, y: 5.08, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'CP1', x: -15.24, y: 0, rot: 'R0', length: 'middle' },
    { name: 'CP2', x: -15.24, y: -2.54, rot: 'R0', length: 'middle' },
    { name: 'CP3', x: -15.24, y: -5.08, rot: 'R0', length: 'middle' },
    { name: 'S1', x: 15.24, y: -12.7, rot: 'R180', length: 'middle', direction: 'pas' },
    { name: 'S2', x: 15.24, y: -10.16, rot: 'R180', length: 'middle', direction: 'pas' },
  ],
};

S.ACDC = {
  name: 'ACDC-3V3',
  wires: box(20.32, 15.24, 94, 0.4064),
  texts: [
    ...nameValue(20.32, 15.24),
    { x: -7.5, y: 1.0, size: 1.6, layer: 94, ratio: 10, text: 'AC/DC' },
    { x: -7.5, y: -1.6, size: 1.4, layer: 94, ratio: 10, text: '3.3 V / 3 W' },
    { x: -7.5, y: -4.2, size: 1.2, layer: 94, ratio: 10, text: '3 kV isol.' },
  ],
  pins: [
    { name: 'AC-L', x: -15.24, y: 5.08, rot: 'R0', length: 'middle', direction: 'pas' },
    { name: 'AC-N', x: -15.24, y: 2.54, rot: 'R0', length: 'middle', direction: 'pas' },
    { name: '+VO', x: 15.24, y: 5.08, rot: 'R180', length: 'middle', direction: 'pwr' },
    { name: '-VO', x: 15.24, y: 2.54, rot: 'R180', length: 'middle', direction: 'pwr' },
  ],
};

S.MAX3232 = {
  name: 'MAX3232',
  wires: box(17.78, 25.4, 94, 0.4064),
  texts: [...nameValue(17.78, 25.4), { x: -5.5, y: 0, size: 1.4, layer: 94, ratio: 10, text: 'RS-232' }],
  pins: [
    { name: 'C1+', x: -13.97, y: 10.16, rot: 'R0', length: 'middle' },
    { name: 'V+', x: -13.97, y: 7.62, rot: 'R0', length: 'middle', direction: 'pas' },
    { name: 'C1-', x: -13.97, y: 5.08, rot: 'R0', length: 'middle' },
    { name: 'C2+', x: -13.97, y: 2.54, rot: 'R0', length: 'middle' },
    { name: 'C2-', x: -13.97, y: 0, rot: 'R0', length: 'middle' },
    { name: 'V-', x: -13.97, y: -2.54, rot: 'R0', length: 'middle', direction: 'pas' },
    { name: 'T2OUT', x: -13.97, y: -5.08, rot: 'R0', length: 'middle', direction: 'out' },
    { name: 'R2IN', x: -13.97, y: -7.62, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'R2OUT', x: 13.97, y: -7.62, rot: 'R180', length: 'middle', direction: 'out' },
    { name: 'T2IN', x: 13.97, y: -5.08, rot: 'R180', length: 'middle', direction: 'in' },
    { name: 'T1IN', x: 13.97, y: -2.54, rot: 'R180', length: 'middle', direction: 'in' },
    { name: 'R1OUT', x: 13.97, y: 0, rot: 'R180', length: 'middle', direction: 'out' },
    { name: 'R1IN', x: 13.97, y: 2.54, rot: 'R180', length: 'middle', direction: 'in' },
    { name: 'T1OUT', x: 13.97, y: 5.08, rot: 'R180', length: 'middle', direction: 'out' },
    { name: 'GND', x: 13.97, y: -10.16, rot: 'R180', length: 'middle', direction: 'pwr' },
    { name: 'VCC', x: 13.97, y: 10.16, rot: 'R180', length: 'middle', direction: 'pwr' },
  ],
};

S.SP3485 = {
  name: 'SP3485',
  wires: box(15.24, 12.7, 94, 0.4064),
  texts: [...nameValue(15.24, 12.7), { x: -5.0, y: 0, size: 1.4, layer: 94, ratio: 10, text: 'RS-485' }],
  pins: [
    { name: 'RO', x: -12.7, y: 5.08, rot: 'R0', length: 'middle', direction: 'out' },
    { name: '!RE', x: -12.7, y: 2.54, rot: 'R0', length: 'middle', direction: 'in', function: 'dot' },
    { name: 'DE', x: -12.7, y: 0, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'DI', x: -12.7, y: -2.54, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'GND', x: -12.7, y: -5.08, rot: 'R0', length: 'middle', direction: 'pwr' },
    { name: 'A', x: 12.7, y: 5.08, rot: 'R180', length: 'middle' },
    { name: 'B', x: 12.7, y: 2.54, rot: 'R180', length: 'middle' },
    { name: 'VCC', x: 12.7, y: -5.08, rot: 'R180', length: 'middle', direction: 'pwr' },
  ],
};

S.DB9 = {
  name: 'DB9M',
  wires: [
    ...box(17.78, 25.4, 94, 0.4064),
  ],
  texts: [...nameValue(17.78, 25.4), { x: -6.0, y: 0, size: 1.4, layer: 94, ratio: 10, text: 'DE-9' }],
  pins: [
    { name: 'DCD', x: -13.97, y: 10.16, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'RXD', x: -13.97, y: 7.62, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'TXD', x: -13.97, y: 5.08, rot: 'R0', length: 'middle', direction: 'out' },
    { name: 'DTR', x: -13.97, y: 2.54, rot: 'R0', length: 'middle', direction: 'out' },
    { name: 'GND', x: -13.97, y: 0, rot: 'R0', length: 'middle', direction: 'pwr' },
    { name: 'DSR', x: -13.97, y: -2.54, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'RTS', x: -13.97, y: -5.08, rot: 'R0', length: 'middle', direction: 'out' },
    { name: 'CTS', x: -13.97, y: -7.62, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'RI', x: -13.97, y: -10.16, rot: 'R0', length: 'middle', direction: 'in' },
    { name: 'SH', x: 13.97, y: -10.16, rot: 'R180', length: 'middle', direction: 'pas' },
  ],
};

/** Generic two-pin part symbol (R, C, LED, fuse, MOV, ferrite, jumper). */
function twoPin(name, w, h, extra = [], p1 = '1', p2 = '2') {
  return {
    name,
    wires: [...box(w, h, 94, 0.254), ...extra],
    texts: nameValue(w, h),
    pins: [
      { name: p1, x: rnd(-w / 2 - 2.54), y: 0, rot: 'R0', length: 'short', direction: 'pas' },
      { name: p2, x: rnd(w / 2 + 2.54), y: 0, rot: 'R180', length: 'short', direction: 'pas' },
    ],
  };
}

S.R = twoPin('R-EU', 5.08, 2.54, [
  { w: [{ x: -2.54, y: 0 }, { x: -1.9, y: 1.0 }], layer: 94 },
  { w: [{ x: -1.9, y: 1.0 }, { x: -0.63, y: -1.0 }], layer: 94 },
  { w: [{ x: -0.63, y: -1.0 }, { x: 0.63, y: 1.0 }], layer: 94 },
  { w: [{ x: 0.63, y: 1.0 }, { x: 1.9, y: -1.0 }], layer: 94 },
  { w: [{ x: 1.9, y: -1.0 }, { x: 2.54, y: 0 }], layer: 94 },
]);

S.C = twoPin('C-EU', 5.08, 2.54, [
  { w: [{ x: -1.27, y: 0.9 }, { x: 1.27, y: 0.9 }], layer: 94, width: 0.3 },
  { w: [{ x: -1.27, y: -0.9 }, { x: 1.27, y: -0.9 }], layer: 94, width: 0.3 },
]);

S.CP = {
  name: 'CPOL-EU',
  wires: [
    ...box(5.08, 2.54, 94, 0.254),
    { w: [{ x: -1.27, y: 0.9 }, { x: 1.27, y: 0.9 }], layer: 94, width: 0.3 },
    { w: [{ x: -1.27, y: -0.9 }, { x: 1.27, y: -0.9 }], layer: 94, width: 0.3, style: 'shortdash' },
  ],
  texts: [...nameValue(5.08, 2.54), { x: -3.4, y: 1.2, size: 1.6, layer: 94, text: '+' }],
  pins: [
    { name: '+', x: -5.08, y: 0, rot: 'R0', length: 'short', direction: 'pas' },
    { name: '-', x: 5.08, y: 0, rot: 'R180', length: 'short', direction: 'pas' },
  ],
};

S.LED = {
  name: 'LED',
  wires: [
    ...box(5.08, 2.54, 94, 0.254),
    { w: [{ x: 1.0, y: 1.6 }, { x: 2.2, y: 2.8 }], layer: 94 },
    { w: [{ x: 1.8, y: 1.6 }, { x: 3.0, y: 2.8 }], layer: 94 },
  ],
  texts: nameValue(5.08, 2.54),
  pins: [
    { name: 'A', x: -5.08, y: 0, rot: 'R0', length: 'short', direction: 'pas' },
    { name: 'K', x: 5.08, y: 0, rot: 'R180', length: 'short', direction: 'pas' },
  ],
};

S.FUSE = twoPin('FUSE', 5.08, 2.54);
S.MOV = twoPin('MOV', 5.08, 2.54);
S.FB = twoPin('FERRITE', 5.08, 2.54);

S.SW = {
  name: 'SW-PUSH',
  wires: [
    { w: [{ x: -2.54, y: 1.27 }, { x: 2.54, y: 1.27 }], layer: 94 },
    { w: [{ x: 0, y: 1.27 }, { x: 0, y: 2.54 }], layer: 94 },
    { w: [{ x: -2.54, y: 0 }, { x: -1.27, y: 0 }], layer: 94 },
    { w: [{ x: 1.27, y: 0 }, { x: 2.54, y: 0 }], layer: 94 },
  ],
  texts: nameValue(7.62, 5.08),
  pins: [
    { name: '1', x: -5.08, y: 0, rot: 'R0', length: 'short', direction: 'pas' },
    { name: '2', x: 5.08, y: 0, rot: 'R180', length: 'short', direction: 'pas' },
  ],
};

S.SJ3 = {
  name: 'SJ-3',
  wires: box(10.16, 5.08, 94, 0.254),
  texts: nameValue(10.16, 5.08),
  pins: [
    { name: '1', x: -2.54, y: -5.08, rot: 'R90', length: 'short', direction: 'pas' },
    { name: '2', x: 0, y: 5.08, rot: 'R270', length: 'short', direction: 'pas' },
    { name: '3', x: 2.54, y: -5.08, rot: 'R90', length: 'short', direction: 'pas' },
  ],
};

/** n-pin single-row connector symbol, pins down the left edge. */
function connSym(name, labels, w = 12.7, step = 2.54, rightLabels = []) {
  const h = Math.max(labels.length, rightLabels.length) * step + 2.54;
  const pins = labels.map((n, i) => ({
    name: n, x: rnd(-w / 2 - 5.08), y: rnd(h / 2 - 2.54 - i * step), rot: 'R0',
    length: 'middle', direction: 'pas',
  }));
  rightLabels.forEach((n, i) => pins.push({
    name: n, x: rnd(w / 2 + 5.08), y: rnd(h / 2 - 2.54 - i * step), rot: 'R180',
    length: 'middle', direction: 'pas',
  }));
  return { name, wires: box(w, h, 94, 0.4064), texts: nameValue(w, h), pins };
}

S.TERM2 = connSym('TERM-2', ['1', '2'], 10.16, 5.08);
S.TERM5 = connSym('TERM-5', ['1', '2', '3', '4', '5'], 10.16, 5.08);

/** 2x5 header symbol: pins 1..5 left, 6..10 right. */
S.HDR2X5 = {
  name: 'HDR-2X5',
  wires: box(12.7, 15.24, 94, 0.4064),
  texts: nameValue(12.7, 15.24),
  pins: [
    ...['1', '3', '5', '7', '9'].map((n, i) => ({
      name: n, x: -11.43, y: rnd(5.08 - i * 2.54), rot: 'R0', length: 'middle',
    })),
    ...['2', '4', '6', '8', '10'].map((n, i) => ({
      name: n, x: 11.43, y: rnd(5.08 - i * 2.54), rot: 'R180', length: 'middle',
    })),
  ],
};

S.TP = {
  name: 'TP',
  wires: [{ c: { x: 0, y: 0, r: 1.27 }, layer: 94 }],
  texts: nameValue(2.54, 2.54),
  pins: [{ name: '1', x: 0, y: -3.81, rot: 'R90', length: 'short', direction: 'pas' }],
};

S.GND = {
  name: 'GND',
  wires: [
    { w: [{ x: -1.905, y: 0 }, { x: 1.905, y: 0 }], layer: 94, width: 0.254 },
  ],
  texts: [{ x: -1.27, y: -2.54, size: 1.778, layer: 96, text: '>VALUE' }],
  pins: [{ name: 'GND', x: 0, y: 2.54, rot: 'R270', length: 'short', direction: 'sup' }],
};

export const SYMBOLS = byName(S);

/* --------------------------------------------------------------- devicesets */

/**
 * deviceset → gates → devices → connects (symbol pin ↔ package pad).
 * `prefix` is the Eagle reference letter; `value` is shown on the board.
 */
export const DEVICESETS = {
  'XPORT-PRO': {
    prefix: 'X', symbol: 'XPORTPRO', package: 'XPORTPRO',
    connects: { GND: '1', '3V3': '2', '!RESET': '3', DOUT: '4', DIN: '5', CP1: '6', CP2: '7', CP3: '8', S1: 'S1', S2: 'S2' },
  },
  'ACDC-3V3': {
    prefix: 'PS', symbol: 'ACDC-3V3', package: 'HLKPM03',
    connects: { 'AC-L': '1', 'AC-N': '2', '-VO': '3', '+VO': '4' },
  },
  'MAX3232': {
    prefix: 'U', symbol: 'MAX3232', package: 'SO16',
    connects: {
      'C1+': '1', 'V+': '2', 'C1-': '3', 'C2+': '4', 'C2-': '5', 'V-': '6',
      T2OUT: '7', R2IN: '8', R2OUT: '9', T2IN: '10', T1IN: '11', R1OUT: '12',
      R1IN: '13', T1OUT: '14', GND: '15', VCC: '16',
    },
  },
  'SP3485': {
    prefix: 'U', symbol: 'SP3485', package: 'SO8',
    connects: { RO: '4', '!RE': '2', DE: '3', DI: '1', GND: '5', A: '6', B: '7', VCC: '8' },
  },
  'DB9M': {
    prefix: 'J', symbol: 'DB9M', package: 'DB9MRA',
    connects: { DCD: '1', RXD: '2', TXD: '3', DTR: '4', GND: '5', DSR: '6', RTS: '7', CTS: '8', RI: '9', SH: 'MH' },
  },
  'TERM-2': { prefix: 'J', symbol: 'TERM-2', package: 'TERM2-5.08', connects: { 1: '1', 2: '2' } },
  'TERM-5': { prefix: 'J', symbol: 'TERM-5', package: 'TERM5-5.08', connects: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' } },
  'HDR-2X5': {
    prefix: 'J', symbol: 'HDR-2X5', package: 'HDR-2X5',
    connects: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' },
  },
  'R-EU': { prefix: 'R', symbol: 'R-EU', package: 'R-7.62', connects: { 1: '1', 2: '2' } },
  'C-EU': { prefix: 'C', symbol: 'C-EU', package: 'C-5.08', connects: { 1: '1', 2: '2' } },
  'C-200V': { prefix: 'C', symbol: 'C-EU', package: 'C-5.08-200V', connects: { 1: '1', 2: '2' } },
  'CPOL-EU': { prefix: 'C', symbol: 'CPOL-EU', package: 'CP-D10-P5', connects: { '+': '+', '-': '-' } },
  'CPOL-SMALL': { prefix: 'C', symbol: 'CPOL-EU', package: 'CP-D6.3-P2.5', connects: { '+': '+', '-': '-' } },
  'LED': { prefix: 'LED', symbol: 'LED', package: 'LED-5MM', connects: { A: '1', K: '2' } },
  'FUSE': { prefix: 'F', symbol: 'FUSE', package: 'FUSE-RADIAL', connects: { 1: '1', 2: '2' } },
  'MOV': { prefix: 'MOV', symbol: 'MOV', package: 'MOV07', connects: { 1: '1', 2: '2' } },
  'FERRITE': { prefix: 'FB', symbol: 'FERRITE', package: 'FB-7.62', connects: { 1: '1', 2: '2' } },
  'SW-PUSH': { prefix: 'SW', symbol: 'SW-PUSH', package: 'SW-TACT-6MM', connects: { 1: '1', 2: '2' } },
  'SJ-3': { prefix: 'JP', symbol: 'SJ-3', package: 'SJ-3', connects: { 1: '1', 2: '2', 3: '3' } },
  'TP': { prefix: 'TP', symbol: 'TP', package: 'TP', connects: { 1: '1' } },
  'MOUNT-M3': { prefix: 'H', symbol: null, package: 'MOUNT-M3', connects: {} },
};

/* -------------------------------------------------------------------- parts */

/* -------------------------------------------------------------------- parts */

/**
 * ref → { set, value, note, dnp (do-not-populate), zone ('mains'|'selv'),
 *         padZones (per-pad override), edge (board edge this part mates through) }
 */
export const PARTS = [
  // ---- mains input and the isolated AC/DC converter ------------------------
  { ref: 'J1', set: 'TERM-2', value: 'MAINS IN', zone: 'mains', note: 'L / N screw terminal, 5.08 mm, 300 V rated' },
  { ref: 'F1', set: 'FUSE', value: 'T500mA/250V', zone: 'mains', note: 'TR5 radial fuse, in the line conductor only' },
  { ref: 'MOV1', set: 'MOV', value: 'S07K275', zone: 'mains', note: '275 Vrms varistor, L-N after the fuse' },
  {
    ref: 'PS1', set: 'ACDC-3V3', value: 'HLK-PM03', zone: 'mains',
    padZones: { 1: 'mains', 2: 'mains', 3: 'selv', 4: 'selv' },
    note: '3.3 V / 1 A pk isolated AC-DC, 3 kV; certified alternates: RECOM RAC03-3.3SK, MEAN WELL IRM-03-3.3',
  },

  // ---- 3.3 V conditioning --------------------------------------------------
  { ref: 'FB1', set: 'FERRITE', value: '600R@100MHz', zone: 'selv', note: '3.3 V rail bead — the Integration Guide asks for LC filtering' },
  { ref: 'C1', set: 'CPOL-EU', value: '1000uF/10V', zone: 'selv', note: 'bulk reservoir after the AC/DC module' },
  { ref: 'C2', set: 'CPOL-SMALL', value: '100uF/10V', zone: 'selv', note: 'local reservoir for the module' },
  { ref: 'R4', set: 'R-EU', value: '1k0', zone: 'selv', note: 'LED1 current limit' },
  { ref: 'LED1', set: 'LED', value: 'PWR green', zone: 'selv', note: '3.3 V present indicator' },
  { ref: 'TP1', set: 'TP', value: '+3V3', zone: 'selv', note: '' },
  { ref: 'TP2', set: 'TP', value: 'GND', zone: 'selv', note: '' },

  // ---- the Lantronix module ------------------------------------------------
  { ref: 'X1', set: 'XPORT-PRO', value: 'XPP100300S-04R', zone: 'selv', edge: 'right', note: 'xPort Pro: 16 MB flash, 8/16 MB SDRAM, Linux (uClinux) or Evolution OS' },
  { ref: 'C3', set: 'C-EU', value: '100nF', zone: 'selv', note: 'module 3.3 V bypass' },
  { ref: 'C4', set: 'C-EU', value: '100nF', zone: 'selv', note: 'module 3.3 V bypass' },
  { ref: 'R1', set: 'R-EU', value: '10k', zone: 'selv', note: 'Data Out pull-up (IG Table 2-2 note 1: pin 4 floats during reset)' },
  { ref: 'R7', set: 'R-EU', value: '10k', zone: 'selv', dnp: true, note: 'optional RESET pull-up (the module has an internal reset circuit)' },
  { ref: 'SW1', set: 'SW-PUSH', value: 'RESET', zone: 'selv', note: 'external reset, ties pin 3 to GND' },
  { ref: 'C9', set: 'C-200V', value: '10nF/200V', zone: 'selv', note: 'chassis → signal GND, per the IG ESD recommendation' },
  { ref: 'C10', set: 'C-200V', value: '10nF/200V', zone: 'selv', note: 'chassis → 3.3 V, per the IG ESD recommendation' },
  { ref: 'TP5', set: 'TP', value: 'CHASSIS', zone: 'selv', note: '' },

  // ---- RS-232 front end ----------------------------------------------------
  { ref: 'U2', set: 'MAX3232', value: 'MAX3232CSE', zone: 'selv', note: '3.3 V RS-232 driver/receiver for the data pair' },
  { ref: 'C5', set: 'C-EU', value: '100nF', zone: 'selv', note: 'U2 C1+ / C1-' },
  { ref: 'C6', set: 'C-EU', value: '100nF', zone: 'selv', note: 'U2 C2+ / C2-' },
  { ref: 'C7', set: 'C-EU', value: '100nF', zone: 'selv', note: 'U2 V+ reservoir' },
  { ref: 'C8', set: 'C-EU', value: '100nF', zone: 'selv', note: 'U2 V- reservoir' },
  { ref: 'JP1', set: 'SJ-3', value: 'TXD strap', zone: 'selv', note: '1-2 = DTE (default), 2-3 = DCE' },
  { ref: 'JP2', set: 'SJ-3', value: 'RXD strap', zone: 'selv', note: '1-2 = DTE (default), 2-3 = DCE' },
  { ref: 'J2', set: 'DB9M', value: 'DB9M DTE', zone: 'selv', edge: 'bottom', note: 'right-angle DE-9, wired DTE by default (EDS2100 style)' },
  { ref: 'J3', set: 'TERM-5', value: 'RS232 ALT', zone: 'selv', note: 'field terminal: TXD RXD RTS CTS GND' },

  // ---- optional modem-control transceiver (DNP) ----------------------------
  { ref: 'U3', set: 'MAX3232', value: 'MAX3232CSE', zone: 'selv', dnp: true, note: 'optional RTS/CTS/DTR/DCD level shifting' },
  { ref: 'C11', set: 'C-EU', value: '100nF', zone: 'selv', dnp: true, note: 'U3 C1+ / C1-' },
  { ref: 'C12', set: 'C-EU', value: '100nF', zone: 'selv', dnp: true, note: 'U3 C2+ / C2-' },
  { ref: 'C13', set: 'C-EU', value: '100nF', zone: 'selv', dnp: true, note: 'U3 V+' },
  { ref: 'C14', set: 'C-EU', value: '100nF', zone: 'selv', dnp: true, note: 'U3 V-' },

  // ---- optional RS-485 front end (DNP), per IG appendix A ------------------
  { ref: 'U4', set: 'SP3485', value: 'SP3485EN', zone: 'selv', dnp: true, note: 'optional 3.3 V RS-485 half-duplex transceiver' },
  { ref: 'R8', set: 'R-EU', value: '0R', zone: 'selv', dnp: true, note: 'DOUT → U4 DI link' },
  { ref: 'R9', set: 'R-EU', value: '0R', zone: 'selv', dnp: true, note: 'U4 RO → DIN link' },
  { ref: 'R10', set: 'R-EU', value: '0R', zone: 'selv', dnp: true, note: 'CP1 → U4 DE/!RE link' },
  { ref: 'J5', set: 'TERM-2', value: 'RS485 A/B', zone: 'selv', dnp: true, note: 'RS-485 field wiring' },

  // ---- TTL break-out and test points ---------------------------------------
  { ref: 'J4', set: 'HDR-2X5', value: 'TTL/CP', zone: 'selv', note: '3V3 GND TXD RXD CP1 CP2 CP3 RESET DSR GND' },
  { ref: 'TP3', set: 'TP', value: 'TXD TTL', zone: 'selv', note: '' },
  { ref: 'TP4', set: 'TP', value: 'RXD TTL', zone: 'selv', note: '' },

  // ---- board only ----------------------------------------------------------
  { ref: 'H1', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H2', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H3', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H4', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
];

/** Pins intentionally left open (reported, not silently dropped). */
export const UNCONNECTED = [
  ['J2', 'RI'],        // ring indicator: a device server never rings
  ['U2', 'T2IN'],      // U2's second channel is spare: the xPort Pro has one port
  ['U2', 'T2OUT'],
  ['U2', 'R2IN'],
  ['U2', 'R2OUT'],
];

/* ------------------------------------------------------------------ netlist */

export const NETS = {
  // ---- mains: never shares copper with SELV ----
  AC_L: [['J1', '1'], ['F1', '1']],
  AC_L_F: [['F1', '2'], ['PS1', 'AC-L'], ['MOV1', '1']],
  AC_N: [['J1', '2'], ['PS1', 'AC-N'], ['MOV1', '2']],

  // ---- 3.3 V rail ----
  '3V3_P': [['PS1', '+VO'], ['FB1', '1'], ['C1', '+']],
  '3V3': [
    ['FB1', '2'], ['C1', '-'], ['C2', '+'], ['X1', '3V3'], ['C3', '1'], ['C4', '1'],
    ['U2', 'VCC'], ['U3', 'VCC'], ['U4', 'VCC'], ['R1', '2'], ['R7', '2'],
    ['R4', '1'], ['C10', '2'], ['J4', '1'], ['TP1', '1'],
  ],
  GND: [
    ['PS1', '-VO'], ['C2', '-'], ['X1', 'GND'], ['C3', '2'], ['C4', '2'],
    ['U2', 'GND'], ['C7', '2'], ['C8', '2'], ['U3', 'GND'], ['C13', '2'], ['C14', '2'],
    ['U4', 'GND'], ['SW1', '2'], ['J2', 'GND'], ['J3', '5'], ['J4', '2'], ['J4', '10'],
    ['LED1', 'K'], ['C9', '2'], ['TP2', '1']],
  CHASSIS: [['X1', 'S1'], ['X1', 'S2'], ['J2', 'SH'], ['C9', '1'], ['C10', '1'], ['TP5', '1']],

  // ---- module TTL serial ----
  TXD_TTL: [['X1', 'DOUT'], ['R1', '1'], ['U2', 'T1IN'], ['J4', '3'], ['R8', '1'], ['TP3', '1']],
  RXD_TTL: [['X1', 'DIN'], ['U2', 'R1OUT'], ['J4', '4'], ['R9', '1'], ['TP4', '1']],
  RESET_N: [['X1', '!RESET'], ['SW1', '1'], ['R7', '1'], ['J4', '8']],
  CP1: [['X1', 'CP1'], ['U3', 'T1IN'], ['J4', '5'], ['R10', '1']],
  CP2: [['X1', 'CP2'], ['U3', 'T2IN'], ['J4', '6']],
  CP3: [['X1', 'CP3'], ['U3', 'R2OUT'], ['J4', '7']],

  // ---- RS-232 side ----
  T1OUT_2: [['U2', 'T1OUT'], ['JP1', '1']],
  R1IN_2: [['U2', 'R1IN'], ['JP2', '1']],
  DB9_2: [['J2', 'RXD'], ['J3', '2'], ['JP1', '3'], ['JP2', '2']],
  DB9_3: [['J2', 'TXD'], ['J3', '1'], ['JP1', '2'], ['JP2', '3']],
  CTS_232: [['U3', 'R1OUT'], ['J3', '4']],
  DB9_7: [['J2', 'RTS'], ['J3', '3'], ['U3', 'T1OUT']],
  DB9_8: [['J2', 'CTS'], ['U3', 'R1IN']],
  DB9_4: [['J2', 'DTR'], ['U3', 'T2OUT']],
  DB9_1: [['J2', 'DCD'], ['U3', 'R2IN']],
  DSR_TTL: [['J2', 'DSR'], ['J4', '9']],

  // ---- MAX3232 charge pumps ----
  VPLUS2: [['U2', 'V+'], ['C7', '1']],
  VMINUS2: [['U2', 'V-'], ['C8', '1']],
  C1P2: [['U2', 'C1+'], ['C5', '1']],
  C1N2: [['U2', 'C1-'], ['C5', '2']],
  C2P2: [['U2', 'C2+'], ['C6', '1']],
  C2N2: [['U2', 'C2-'], ['C6', '2']],
  VPLUS3: [['U3', 'V+'], ['C13', '1']],
  VMINUS3: [['U3', 'V-'], ['C14', '1']],
  C1P3: [['U3', 'C1+'], ['C11', '1']],
  C1N3: [['U3', 'C1-'], ['C11', '2']],
  C2P3: [['U3', 'C2+'], ['C12', '1']],
  C2N3: [['U3', 'C2-'], ['C12', '2']],

  // ---- optional RS-485 ----
  RS485_DI: [['R8', '2'], ['U4', 'DI']],
  RS485_RO: [['R9', '2'], ['U4', 'RO']],
  RS485_DE: [['R10', '2'], ['U4', 'DE'], ['U4', '!RE']],
  RS485_A: [['U4', 'A'], ['J5', '1']],
  RS485_B: [['U4', 'B'], ['J5', '2']],

  // ---- power indicator ----
  LED_A: [['R4', '2'], ['LED1', 'A']],
};

/* --------------------------------------------------- board placements (mm) */

export const PLACEMENT = {
  // ---- mains strip (top-left) ----
  J1: { x: 10, y: 62, rot: 'R0' },
  F1: { x: 22, y: 62, rot: 'R0' },
  MOV1: { x: 34, y: 62, rot: 'R0' },
  PS1: { x: 28, y: 44, rot: 'R0' },

  // ---- 3.3 V conditioning ----
  FB1: { x: 56, y: 51.62, rot: 'R0' },
  C1: { x: 68, y: 62, rot: 'R0' },
  C2: { x: 68, y: 50, rot: 'R0' },
  R4: { x: 56, y: 45, rot: 'R0' },
  LED1: { x: 62, y: 38, rot: 'R0' },
  TP1: { x: 78, y: 62, rot: 'R0' },
  TP2: { x: 78, y: 56, rot: 'R0' },

  // ---- the module: RJ45 nose through the right board edge ----
  X1: { x: 94, y: 44, rot: 'R0' },
  C3: { x: 102, y: 32, rot: 'R0' },
  C4: { x: 102, y: 27.5, rot: 'R0' },
  C9: { x: 100, y: 58, rot: 'R0' },
  C10: { x: 100, y: 64, rot: 'R0' },
  TP5: { x: 92, y: 58, rot: 'R0' },
  SW1: { x: 86, y: 58, rot: 'R0' },
  R1: { x: 80, y: 30, rot: 'R0' },
  R7: { x: 92, y: 30, rot: 'R0' },

  // ---- RS-232 (bottom band) ----
  J2: { x: 40, y: 7.7, rot: 'R0' },
  U2: { x: 70, y: 12, rot: 'R0' },
  C5: { x: 64, y: 8, rot: 'R90' },
  C6: { x: 64, y: 16, rot: 'R90' },
  C7: { x: 76, y: 8, rot: 'R90' },
  C8: { x: 76, y: 16, rot: 'R90' },
  JP1: { x: 70, y: 22, rot: 'R0' },
  JP2: { x: 78, y: 22, rot: 'R0' },
  J3: { x: 16, y: 8, rot: 'R0' },
  J5: { x: 7, y: 20, rot: 'R90' },
  J4: { x: 20, y: 20, rot: 'R0' },

  // ---- optional modem-control + RS-485 ----
  U3: { x: 90, y: 12, rot: 'R0' },
  C11: { x: 84, y: 8, rot: 'R90' },
  C12: { x: 84, y: 16, rot: 'R90' },
  C13: { x: 96, y: 8, rot: 'R90' },
  C14: { x: 96, y: 16, rot: 'R90' },
  U4: { x: 104, y: 10, rot: 'R0' },
  R8: { x: 94, y: 26, rot: 'R0' },
  R9: { x: 106, y: 20, rot: 'R90' },
  R10: { x: 90, y: 22, rot: 'R0' },

  // ---- test points ----
  TP3: { x: 66, y: 30, rot: 'R0' },
  TP4: { x: 72, y: 30, rot: 'R0' },

  // ---- mounting holes ----
  H1: { x: 4, y: 4, rot: 'R0' },
  H2: { x: 106, y: 4, rot: 'R0' },
  H3: { x: 4, y: 66, rot: 'R0' },
  H4: { x: 106, y: 66, rot: 'R0' },
};

/* ------------------------------------------------- schematic placements (mm) */

export const SHEET = { w: 480, h: 300, columns: 12, rows: 8 };

/**
 * Schematic instances on a 55 mm column / 45 mm row grid. The spacing is not
 * cosmetic: tools/build-wallplug-eagle.mjs --check computes each instance's
 * symbol box plus its 5.08 mm wire stubs and the label that hangs off them, and
 * fails the build when two boxes overlap or run off the sheet.
 */
export const SCHEM_PLACEMENT = {
  // ---- row A: mains input and the isolated converter ----
  J1: { x: 35, y: 240 },
  F1: { x: 90, y: 240 },
  MOV1: { x: 145, y: 240 },
  PS1: { x: 215, y: 240 },
  // ---- row B: 3.3 V conditioning ----
  FB1: { x: 35, y: 205 },
  C1: { x: 90, y: 205 },
  C2: { x: 145, y: 205 },
  R4: { x: 200, y: 205 },
  LED1: { x: 255, y: 205 },
  TP1: { x: 310, y: 205 },
  TP2: { x: 345, y: 205 },
  C9: { x: 395, y: 205 },
  C10: { x: 445, y: 205 },
  // ---- row C: the module and its immediate passives ----
  X1: { x: 60, y: 165 },
  C3: { x: 120, y: 165 },
  C4: { x: 175, y: 165 },
  SW1: { x: 230, y: 165 },
  R7: { x: 285, y: 165 },
  R1: { x: 340, y: 165 },
  TP3: { x: 390, y: 165 },
  TP4: { x: 415, y: 165 },
  TP5: { x: 445, y: 165 },
  // ---- row D: RS-232 driver/receiver ----
  U2: { x: 60, y: 120 },
  C5: { x: 120, y: 120 },
  C6: { x: 175, y: 120 },
  C7: { x: 230, y: 120 },
  C8: { x: 285, y: 120 },
  JP1: { x: 340, y: 120 },
  JP2: { x: 370, y: 120 },
  // ---- row E: connectors and the optional modem-control transceiver ----
  J2: { x: 60, y: 75 },
  J3: { x: 130, y: 75 },
  J4: { x: 200, y: 75 },
  U3: { x: 280, y: 75 },
  C11: { x: 340, y: 75 },
  C12: { x: 395, y: 75 },
  // ---- row F: optional RS-485 front end ----
  U4: { x: 60, y: 30 },
  R8: { x: 125, y: 30 },
  R9: { x: 180, y: 30 },
  R10: { x: 235, y: 30 },
  J5: { x: 290, y: 30 },
  C13: { x: 350, y: 30 },
  C14: { x: 405, y: 30 },
};

export const SCHEM_NOTES = [
  { x: 20, y: 292, size: 3.4, layer: 97, text: 'xPort Wallplug — mains-powered RS-232 ↔ Ethernet adapter around a Lantronix xPort Pro (16 MB flash)' },
  { x: 20, y: 284, size: 2.2, layer: 97, text: 'MAINS (row A): L → F1 → PS1 pin 1, N → PS1 pin 2, MOV1 across L-N after the fuse. Isolation is inside PS1 (3 kV reinforced).' },
  { x: 20, y: 279, size: 2.2, layer: 97, text: 'Keep 6.4 mm creepage / 4.0 mm clearance between mains and SELV copper — enforced by tools/build-wallplug-eagle.mjs --check.' },
  { x: 20, y: 274, size: 2.2, layer: 97, text: 'MODULE (row C): xPort Pro pinout per Integration Guide 900-557 rev K Table 2-2 — 1 GND, 2 +3V3, 3 RESET, 4 Data Out, 5 Data In,' },
  { x: 20, y: 269, size: 2.2, layer: 97, text: '6 CP1/RTS, 7 CP2/DTR, 8 CP3/CTS-DCD. Serial I/O is 3.3 V CMOS, so a transceiver (U2) is mandatory for RS-232 levels.' },
  { x: 20, y: 264, size: 2.2, layer: 97, text: 'JP1/JP2 strapped 1-2 = DTE (default, EDS2100 style), 2-3 = DCE (UDS1100 style). U3/U4/C11-C14/R8-R10/J5 are DNP options.' },
];

export const BOARD_NOTES = [
  { x: 2, y: 68, size: 1.8, layer: 21, text: 'xPort Wallplug rev A — 110 x 70 mm, 2 layers, 1.6 mm FR-4' },
  { x: 2, y: 65.5, size: 1.2, layer: 21, text: 'MAINS: L → F1 → PS1.1 ; N → PS1.2 ; MOV1 across L-N after F1' },
  { x: 52, y: 68, size: 1.4, layer: 21, text: 'HAZARDOUS VOLTAGE — 6.4 mm creepage to all SELV copper' },
  { x: 52, y: 65.5, size: 1.2, layer: 21, text: 'Barrier line: no copper crosses it except inside PS1' },
  { x: 30, y: 1.5, size: 1.2, layer: 21, text: 'DE-9: pin row 1 is 7.70 mm from this board edge' },
  { x: 76, y: 55, size: 1.2, layer: 21, text: '≥1 in² copper on the shield tabs = heatsink (IG §2)' },
];

/** Barrier between the mains and SELV zones: silkscreen warning + tRestrict. */
export const BARRIER = { x1: 50, y1: 34, x2: 50, y2: 70 };

/* ------------------------------------------------- schematic geometry helpers */

export const STUB = 5.08;   // mm of wire that leaves every symbol pin before its label

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

/** Absolute position of a symbol pin for a placed instance. */
export function pinAbsolute(symName, pinName, inst) {
  const sym = SYMBOLS[symName];
  const pin = sym.pins.find((p) => p.name === pinName);
  if (!pin) throw new Error(`symbol ${symName} has no pin ${pinName}`);
  const [dx, dy] = rotPt(pin.x, pin.y, inst.rot ?? 'R0');
  return { x: inst.x + dx, y: inst.y + dy, rot: pin.rot ?? 'R0', pin };
}
