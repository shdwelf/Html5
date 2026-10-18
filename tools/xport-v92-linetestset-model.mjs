/**
 * xport-v92-linetestset-model.mjs — an isolated telephone line test set.
 *
 * The legitimate member of the phreaking "box" family. This is the circuit that
 * a lineman's handset (a "butt set") actually is, and it is sold commercially by
 * Fluke and Greenlee. Clipping it onto a line you do not own is wiretapping and
 * is illegal; the hardware itself is a standard telecom maintenance tool.
 *
 * Signal chain:
 *
 *   test leads -> 100 mA fuse -> 100R surge limiters -> varistor + snubber
 *     -> bridge rectifier (so tip/ring polarity does not matter)
 *     -> hook relay -> 600:600 "wet" transformer
 *     -> centre-tapped hybrid -> TALK/MONITOR switch
 *                                   |-- TALK: 600R termination, earpiece + electret
 *                                   |-- MONITOR: 10k bridge, volume pot, earpiece
 *
 * Three features are what separate this from an audio tap, and each is a real
 * requirement rather than a flourish:
 *
 *   1. THE BRIDGE RECTIFIER. A test set gets clipped onto pairs whose polarity
 *      nobody knows. Full-wave rectifying the line ahead of everything else
 *      means the rest of the circuit always sees the same orientation. Without
 *      it, half of every job is guessing which lead is tip.
 *
 *   2. TALK VERSUS MONITOR. TALK goes off-hook and terminates the line in
 *      600 ohms, so you can be part of the call. MONITOR bridges at 10k, which
 *      is high enough not to load the line or disturb an existing conversation,
 *      so you can listen and measure without anyone knowing. Those are opposite
 *      requirements and the switch selects between them.
 *
 *   3. IT RUNS FROM THE LINE. The electret bias and the line-present LED are fed
 *      from the rectified loop through 2k2 and 1k. No battery to be flat when
 *      you are standing at a cabinet in the rain.
 *
 * DC loop budget in TALK, because this decides whether the exchange sees an
 * off-hook at all:
 *
 *     F1 fuse        ~0.2 ohm
 *     R1 + R2        200 ohm   surge limiters
 *     BR1            ~2 x 1.1 V drop, a few ohm effective
 *     K1 contact     ~0.1 ohm
 *     T1 primary     40-150 ohm
 *     -------------------------
 *     total 240-350 ohm       (limit 400 ohm)
 *
 * SAFETY. The line side is zone 'mains' and BOARD.creepageMm is 3.0 mm, so the
 * DRC enforces 3 mm between every line-side pad and every SELV pad, and T1's
 * primary pins are marked line-referenced individually through padZones so the
 * check measures the transformer's own pin spacing rather than trusting its
 * silk. T1 is the only isolation barrier; the shield pad is placed to clear the
 * secondary pins because 2.54 mm row pitch does not.
 *
 * Isolation resistance from line to any touchable metal has to hold 5 Mohm at
 * 100 V DC. Measure it after assembly.
 */

import {
  PACKAGES as AB_PACKAGES,
  SYMBOLS as AB_SYMBOLS,
  DEVICESETS as AB_DEVICESETS,
} from './xport-v92-audiobridge-model.mjs';

import {
  rotPt, padAbs, courtAbs, symbolBBox, stubDir, makePinAbsolute, STUB, rnd,
  PACKAGE_SOURCES,
} from './eda-core.mjs';

export { rotPt, padAbs, courtAbs, symbolBBox, stubDir, STUB, rnd, PACKAGE_SOURCES };

/* ------------------------------------------------------------------- packages */
/*
 * Everything the audio bridge already defines is reused as-is, so the two boards
 * cannot drift apart on a footprint. Only the four parts a test set adds are new.
 */

const P = (x, y, drill = 1.0, diameter = 1.8, extra = {}) => ({ x, y, drill, diameter, ...extra });
const silk = (pts, layer = 21, width = 0.127) => ({ w: pts, layer, width });

const NEW_PACKAGES = {
  'BRIDGE-WOB': {
    name: 'BRIDGE-WOB',
    descr: 'Bridge rectifier, WOB inline-4, 1 A 600 V',
    courtyard: { x1: -5.4, y1: -2.6, x2: 5.4, y2: 2.6 },
    pads: [P(-3.81, 0, 0.9, 1.8, { shape: 'square' }), P(-1.27, 0, 0.9, 1.8),
           P(1.27, 0, 0.9, 1.8), P(3.81, 0, 0.9, 1.8)],
    silk: [silk([[-4.8, 2.0], [4.8, 2.0]]), silk([[4.8, 2.0], [4.8, -2.0]]),
           silk([[4.8, -2.0], [-4.8, -2.0]]), silk([[-4.8, -2.0], [-4.8, 2.0]])],
    texts: [{ x: -4.8, y: 2.5, size: 1, layer: 25, text: '>NAME' }],
  },

  'TOGGLE-SPDT': {
    name: 'TOGGLE-SPDT',
    descr: 'Miniature toggle switch, SPDT, 2.54 mm pitch',
    courtyard: { x1: -4.2, y1: -3.2, x2: 4.2, y2: 3.2 },
    pads: [P(-2.54, 0, 0.9, 1.8, { shape: 'square' }), P(0, 0, 0.9, 1.8),
           P(2.54, 0, 0.9, 1.8)],
    silk: [silk([[-3.6, 2.6], [3.6, 2.6]]), silk([[3.6, 2.6], [3.6, -2.6]]),
           silk([[3.6, -2.6], [-3.6, -2.6]]), silk([[-3.6, -2.6], [-3.6, 2.6]])],
    texts: [{ x: -3.6, y: 3.1, size: 1, layer: 25, text: '>NAME' }],
  },

  'SPEAKER-12': {
    name: 'SPEAKER-12',
    descr: 'Earpiece, 12 mm dynamic, 150 ohm',
    courtyard: { x1: -7.4, y1: -7.4, x2: 7.4, y2: 7.4 },
    pads: [P(-3.81, 0, 1.0, 1.8, { shape: 'square' }), P(3.81, 0, 1.0, 1.8)],
    silk: [silk([[-6.8, 6.8], [6.8, 6.8]]), silk([[6.8, 6.8], [6.8, -6.8]]),
           silk([[6.8, -6.8], [-6.8, -6.8]]), silk([[-6.8, -6.8], [-6.8, 6.8]])],
    circles: [{ x: 0, y: 0, r: 5.5, layer: 21, width: 0.2032 }],
    texts: [{ x: -6.8, y: 7.3, size: 1, layer: 25, text: '>NAME' }],
  },

  'ELECTRET-10': {
    name: 'ELECTRET-10',
    descr: 'Electret microphone capsule, 10 mm, 3.8 mm lead pitch',
    courtyard: { x1: -5.6, y1: -5.6, x2: 5.6, y2: 5.6 },
    pads: [P(-1.9, 0, 0.9, 1.8, { shape: 'square' }), P(1.9, 0, 0.9, 1.8)],
    silk: [silk([[-5.0, 5.0], [5.0, 5.0]]), silk([[5.0, 5.0], [5.0, -5.0]]),
           silk([[5.0, -5.0], [-5.0, -5.0]]), silk([[-5.0, -5.0], [-5.0, 5.0]])],
    circles: [{ x: 0, y: 0, r: 4.6, layer: 21, width: 0.2032 }],
    texts: [{ x: -5.0, y: 5.5, size: 1, layer: 25, text: '>NAME' }],
  },
};

/* Pads are positional above and named here; the length check is the point. */
const PAD_NAMES = {
  'BRIDGE-WOB': ['~1', '~2', '+', '-'],
  'TOGGLE-SPDT': ['1', '2', '3'],
  'SPEAKER-12': ['1', '2'],
  'ELECTRET-10': ['1', '2'],
};
for (const [name, pkg] of Object.entries(NEW_PACKAGES)) {
  const want = PAD_NAMES[name];
  if (want.length !== pkg.pads.length)
    throw new Error(`${name}: ${pkg.pads.length} pads but ${want.length} names`);
  pkg.pads.forEach((pad, i) => { pad.name = want[i]; });
}

export const PACKAGES = { ...AB_PACKAGES, ...NEW_PACKAGES };

/* -------------------------------------------------------------------- symbols */

const pin = (name, x, y, rot = 'R0', length = 'short', direction = 'pas') =>
  ({ name, x, y, rot, length, direction });

const NEW_SYMBOLS = {
  BRIDGE: {
    name: 'BRIDGE',
    wires: [{ w: [[-5.08, 5.08], [5.08, 5.08]], layer: 94, width: 0.4064 },
            { w: [[5.08, 5.08], [5.08, -5.08]], layer: 94, width: 0.4064 },
            { w: [[5.08, -5.08], [-5.08, -5.08]], layer: 94, width: 0.4064 },
            { w: [[-5.08, -5.08], [-5.08, 5.08]], layer: 94, width: 0.4064 },
            { w: [[-3.175, 3.175], [3.175, -3.175]], layer: 94, width: 0.254 },
            { w: [[-3.175, -3.175], [3.175, 3.175]], layer: 94, width: 0.254 }],
    texts: [{ x: -5.08, y: 5.7, size: 1.778, layer: 95, text: '>NAME' },
            { x: -5.08, y: -8.2, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('AC1', -7.62, 2.54, 'R0'), pin('AC2', -7.62, -2.54, 'R0'),
           pin('P', 7.62, 2.54, 'R180'), pin('N', 7.62, -2.54, 'R180')],
  },

  'SW-SPDT': {
    name: 'SW-SPDT',
    wires: [{ w: [[-1.905, 1.27], [1.905, 2.54]], layer: 94, width: 0.254 },
            { w: [[-2.54, 0], [-1.905, 0]], layer: 94, width: 0.254 },
            { w: [[1.905, 0], [2.54, 0]], layer: 94, width: 0.254 }],
    texts: [{ x: -2.54, y: 3.8, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -3.6, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('2', -5.08, 0, 'R0'), pin('1', 5.08, 2.54, 'R180'),
           pin('3', 5.08, -2.54, 'R180')],
  },

  SPEAKER: {
    name: 'SPEAKER',
    wires: [{ w: [[-1.27, 2.54], [-1.27, -2.54]], layer: 94, width: 0.254 },
            { w: [[-1.27, 2.54], [1.27, 3.81]], layer: 94, width: 0.254 },
            { w: [[1.27, 3.81], [1.27, -3.81]], layer: 94, width: 0.254 },
            { w: [[1.27, -3.81], [-1.27, -2.54]], layer: 94, width: 0.254 },
            { w: [[-2.54, 0], [-1.27, 0]], layer: 94 },
            { w: [[-2.54, -2.54], [-1.27, -2.54]], layer: 94 }],
    texts: [{ x: 2.54, y: 2.54, size: 1.778, layer: 95, text: '>NAME' },
            { x: 2.54, y: -4.3, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', -5.08, 0, 'R0'), pin('2', -5.08, -2.54, 'R0')],
  },

  MIC: {
    name: 'MIC',
    wires: [{ w: [[0, 2.54], [0, 1.27]], layer: 94, width: 0.254 },
            { w: [[0, -1.27], [0, -2.54]], layer: 94, width: 0.254 },
            { w: [[-1.905, 1.27], [1.905, 1.27]], layer: 94, width: 0.254 },
            { w: [[-1.905, -1.27], [1.905, -1.27]], layer: 94, width: 0.254 },
            { w: [[-1.905, 1.27], [-1.905, -1.27]], layer: 94, width: 0.4064 },
            { w: [[1.905, 1.27], [1.905, -1.27]], layer: 94, width: 0.254 }],
    texts: [{ x: 2.54, y: 1.9, size: 1.778, layer: 95, text: '>NAME' },
            { x: 2.54, y: -3.8, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', 0, 5.08, 'R270'), pin('2', 0, -5.08, 'R90')],
  },
};

export const SYMBOLS = { ...AB_SYMBOLS, ...NEW_SYMBOLS };

/* ----------------------------------------------------------------- devicesets */

const NEW_DEVICESETS = {
  BRIDGE:   { prefix: 'BR', symbol: 'BRIDGE',   package: 'BRIDGE-WOB',
              connects: { AC1: '~1', AC2: '~2', P: '+', N: '-' } },
  'SW-SPDT': { prefix: 'SW', symbol: 'SW-SPDT', package: 'TOGGLE-SPDT',
              connects: { 1: '1', 2: '2', 3: '3' } },
  SPEAKER:  { prefix: 'LS', symbol: 'SPEAKER',  package: 'SPEAKER-12',
              connects: { 1: '1', 2: '2' } },
  ELECTRET: { prefix: 'MIC', symbol: 'MIC',     package: 'ELECTRET-10',
              connects: { 1: '1', 2: '2' } },
};

export const DEVICESETS = { ...AB_DEVICESETS, ...NEW_DEVICESETS };

/* ----------------------------------------------------------------------- board */

export const BOARD = {
  name: 'xport-v92-linetestset', rev: 'A',
  w: 110, h: 80, layers: 2, thickness: 1.57,
  edgeClearance: 1.5,
  zones: {
    mains: { x1: 0, y1: 0, x2: 30, y2: 80 },
    selv: { x1: 34, y1: 0, x2: 110, y2: 80 },
  },
  creepageMm: 3.0,
  clearanceMm: 0.35,
  mountingHoles: [{ x: 4, y: 4 }, { x: 106, y: 4 }, { x: 4, y: 76 }, { x: 106, y: 76 }],
};

export const SHEET = { w: 520, h: 420, columns: 13, rows: 11 };

/* ------------------------------------------------------------------------ nets */

export const NETS = {
  LINE_TIP:  [['J1', '1'], ['F1', '1']],
  FUSE_OUT:  [['F1', '2'], ['R1', '1']],
  PROT_TIP:  [['R1', '2'], ['RV1', '1'], ['C1', '1'], ['BR1', 'AC1']],
  PROT_RING: [['J1', '2'], ['R2', '1'], ['RV1', '2']],
  RING_IN:   [['R2', '2'], ['C1', '2'], ['BR1', 'AC2']],

  BRP:       [['BR1', 'P'], ['K1', 'C'], ['R8', '1'], ['R7', '1']],
  BRM:       [['BR1', 'N'], ['T1', '3'], ['LED1', 'C']],
  LOOP_A:    [['K1', 'NO'], ['T1', '1']],
  LED_A:     [['R8', '2'], ['LED1', 'A']],
  MIC_B:     [['R7', '2'], ['R10', '1']],

  HYB_TOP:   [['T1', '4'], ['R3', '1'], ['C3', '2']],
  HYB_BOT:   [['T1', '6'], ['R4', '1']],
  HYB_CT:    [['T1', '5'], ['RV2', '2'], ['SW1', '2']],
  BAL_A:     [['R3', '2'], ['RV2', '1']],
  BAL_B:     [['R4', '2'], ['RV2', '3']],

  TALK_ARM:  [['SW1', '1'], ['R6', '1']],
  MON_ARM:   [['SW1', '3'], ['R5', '1']],
  MON_IN:    [['R5', '2'], ['RV3', '1']],
  MON_WIPE:  [['RV3', '2'], ['C2', '1'], ['J3', 'T']],
  SPK_HI:    [['C2', '2'], ['LS1', '1']],
  SPK_LO:    [['LS1', '2'], ['RV3', '3'], ['J3', 'S']],

  MIC_S:     [['R10', '2'], ['MIC1', '1'], ['C3', '1'], ['J3', 'R']],
  MIC_RTN:   [['MIC1', '2']],

  RLY_HI:    [['J2', '1'], ['K1', 'A1'], ['D1', 'A']],
  RLY_SW:    [['K1', 'A2'], ['D1', 'C']],
  HOOK:      [['J2', '2'], ['TP1', '1']],

  GND:       [['TP2', '1'], ['T1', 'S'], ['R6', '2']],
};

/* ----------------------------------------------------------------------- parts */

export const PARTS = [
  // --- line side, zone 'mains' -----------------------------------------
  { ref: 'J1', set: 'TERM-2', value: 'TIP/RING', zone: 'mains',
    note: 'Test leads or alligator clips land here. Screw 1 is tip, screw 2 is ring; the bridge rectifier makes the polarity irrelevant.' },
  { ref: 'F1', set: 'FUSE', value: '100mA', zone: 'mains',
    note: '100 mA, above the 20-50 mA loop but low enough to clear a power-cross before the transformer.' },
  { ref: 'R1', set: 'R-EU', value: '100R', zone: 'mains', note: 'Series surge limiter, tip.' },
  { ref: 'R2', set: 'R-EU', value: '100R', zone: 'mains', note: 'Series surge limiter, ring.' },
  { ref: 'RV1', set: 'VARISTOR', value: '275V', zone: 'mains',
    note: 'Clamps lightning and power-cross surges ahead of the rectifier.' },
  { ref: 'C1', set: 'C-EU', value: '100nF/630V', zone: 'mains',
    note: 'Snubber with R1/R2, so the varistor does not ring on the line.' },
  { ref: 'BR1', set: 'BRIDGE', value: 'W04 1A/600V', zone: 'mains',
    note: 'Full-wave bridge. This is why the test set can be clipped on either way round.' },
  { ref: 'K1', set: 'RELAY', value: 'HK 5V SPST', zone: 'mains',
    note: 'Hook switch. Off-hook in TALK only; MONITOR leaves the line alone.' },
  { ref: 'R8', set: 'R-EU', value: '1k', zone: 'mains',
    note: 'Line-present LED limiter, fed from the rectified loop.' },
  { ref: 'LED1', set: 'LED', value: 'LINE', zone: 'mains',
    note: 'Glows whenever there is line voltage, including ring. No battery involved.' },
  { ref: 'R7', set: 'R-EU', value: '2k2', zone: 'mains',
    note: 'Electret bias feed, taken from the rectified loop rather than from a cell.' },

  // --- the barrier -----------------------------------------------------
  { ref: 'T1', set: 'XFMR-600', value: '600:600 WET', zone: 'selv',
    padZones: { 1: 'mains', 2: 'mains', 3: 'mains' },
    note: 'MUST be the wet type, specified for 20-50 mA DC loop without saturating. Pads 1-3 are the primary and stay line-referenced; the shield goes to ground.' },

  // --- SELV side -------------------------------------------------------
  { ref: 'R3', set: 'R-EU', value: '620R', zone: 'selv', note: 'Hybrid bridge arm.' },
  { ref: 'R4', set: 'R-EU', value: '620R', zone: 'selv', note: 'Hybrid bridge arm, other half.' },
  { ref: 'RV2', set: 'TRIM', value: '470R', zone: 'selv',
    note: 'Balance trimmer. Adjust for minimum sidetone with a real line connected.' },
  { ref: 'SW1', set: 'SW-SPDT', value: 'TALK/MON', zone: 'selv',
    note: 'TALK terminates in 600R and opens the hook; MONITOR bridges at 10k and leaves the line undisturbed.' },
  { ref: 'R6', set: 'R-EU', value: '600R', zone: 'selv',
    note: 'Talk-mode termination. Completes the fourth arm of the bridge.' },
  { ref: 'R5', set: 'R-EU', value: '10k', zone: 'selv',
    note: 'Monitor bridging resistor. 10k is high enough not to load a live call.' },
  { ref: 'RV3', set: 'TRIM', value: '10k', zone: 'selv', note: 'Earpiece volume.' },
  { ref: 'C2', set: 'C-EU', value: '10u NP', zone: 'selv', note: 'DC block to the earpiece.' },
  { ref: 'LS1', set: 'SPEAKER', value: '150R EAR', zone: 'selv', note: 'Earpiece, 12 mm.' },
  { ref: 'MIC1', set: 'ELECTRET', value: 'ELECTRET', zone: 'selv',
    note: 'Talk microphone. Biased from the line through R7, so it works with no battery fitted.' },
  { ref: 'R10', set: 'R-EU', value: '2k2', zone: 'selv', note: 'Electret load resistor.' },
  { ref: 'C3', set: 'C-EU', value: '1u NP', zone: 'selv', note: 'DC block, microphone to line.' },
  { ref: 'J3', set: 'JACK-TRS', value: 'HEADSET', zone: 'selv',
    note: 'Alternative to the built-in earpiece and microphone. Tip earpiece, ring mic, sleeve common.' },
  { ref: 'J2', set: 'TERM-2', value: 'HOOK CTRL', zone: 'selv',
    note: 'Drive pin 1 high to go off-hook. Pin 2 is the return. In MONITOR leave it low.' },
  { ref: 'D1', set: 'DIODE-SCH', value: '1N4148', zone: 'selv', note: 'Flyback across the relay coil.' },
  { ref: 'TP1', set: 'TP', value: 'HOOK', zone: 'selv', note: 'Probe the hook control.' },
  { ref: 'TP2', set: 'TP', value: 'GND', zone: 'selv', note: 'Scope reference.' },

  { ref: 'H1', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H2', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H3', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H4', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
];

/* ------------------------------------------------------------------ placement */
/*
 * Line side is confined to x < 30 and laid out so nothing lands inside the
 * transformer's courtyard. The SELV side uses a 16 mm column grid, which is the
 * spacing that cleared the DRC on xport-v92-audiobridge for the same package set.
 */
export const PLACEMENT = {
  C1:   { x: 8,  y: 10 },
  R2:   { x: 22, y: 12 },
  RV1:  { x: 8,  y: 20 },
  R8:   { x: 22, y: 20 },
  LED1: { x: 22, y: 26 },
  J1:   { x: 8,  y: 32 },
  BR1:  { x: 20, y: 32 },
  K1:   { x: 22, y: 42 },
  F1:   { x: 8,  y: 46 },
  R1:   { x: 22, y: 50 },
  R7:   { x: 8,  y: 52 },
  T1:   { x: 19, y: 68 },

  R3:   { x: 42, y: 70 },
  R4:   { x: 58, y: 70 },
  R6:   { x: 74, y: 70 },
  R5:   { x: 90, y: 70 },
  RV2:  { x: 42, y: 58 },
  SW1:  { x: 58, y: 58 },
  RV3:  { x: 74, y: 58 },
  R10:  { x: 90, y: 58 },
  C2:   { x: 42, y: 46 },
  C3:   { x: 58, y: 46 },
  LS1:  { x: 78, y: 40 },
  MIC1: { x: 96, y: 44 },
  J3:   { x: 44, y: 32 },
  J2:   { x: 62, y: 26 },
  D1:   { x: 80, y: 20 },
  TP1:  { x: 94, y: 24 },
  TP2:  { x: 102, y: 12 },

  H1:   { x: 4,   y: 4 },
  H2:   { x: 106, y: 4 },
  H3:   { x: 4,   y: 76 },
  H4:   { x: 106, y: 76 },
};

/* --------------------------------------------------------------------- copper */

export const POUR = { x1: 1.5, y1: 1.5, x2: 108.5, y2: 78.5 };

export const BARRIER = { x1: 32, y1: 6, x2: 32, y2: 74 };

export const BOARD_LINES = [
  { x1: 32, y1: 4, x2: 32, y2: 76, layer: 21, width: 0.5, style: 'longdash' },
  { x1: 30, y1: 4, x2: 30, y2: 76, layer: 41, width: 0.2 },
  { x1: 34, y1: 4, x2: 34, y2: 76, layer: 41, width: 0.2 },
];

export const BOARD_NOTES = [
  { x: 2, y: 78, size: 1.8, layer: 21,
    text: 'Isolated Line Test Set rev A - 110 x 80 mm, 2 layers. LEFT of the slot is LINE-REFERENCED.' },
  { x: 2, y: 66, size: 1.4, layer: 21,
    text: 'T1 is the only isolation barrier. Keep the slot clear of copper and solder.' },
  { x: 36, y: 78, size: 1.4, layer: 21,
    text: 'SELV: hybrid, TALK 600R / MONITOR 10k, earpiece, electret, headset jack.' },
  { x: 2, y: 4, size: 1.4, layer: 21,
    text: 'Connect only to lines you are authorised to work on. Clipping onto someone else\'s line is illegal.' },
];

export const SCHEM_NOTES = [
  { x: 20, y: 412, size: 3.4, layer: 97,
    text: 'Isolated Line Test Set - a lineman\'s handset, polarity independent, line powered' },
  { x: 20, y: 400, size: 2.2, layer: 97,
    text: 'leads -> F1 100mA -> R1/R2 100R -> RV1 + C1 snubber -> BR1 bridge -> K1 hook -> T1 wet 600:600 -> hybrid' },
  { x: 20, y: 392, size: 2.2, layer: 97,
    text: 'TALK: 600R termination, off-hook, earpiece and electret.  MONITOR: 10k bridge, no load, volume to earpiece.' },
  { x: 20, y: 380, size: 2.2, layer: 97,
    text: 'DC loop in TALK: R1 100 + R2 100 + K1 + T1 primary 40-150 = 240-350 R, under the 400 R limit.' },
  { x: 20, y: 368, size: 2.2, layer: 97,
    text: 'The bridge rectifier is why the leads can go on either way round - the rest of the circuit always sees one polarity.' },
  { x: 20, y: 356, size: 2.2, layer: 97,
    text: 'Line powered: the electret bias (R7) and the line-present LED (R8) come from the rectified loop. No battery.' },
  { x: 20, y: 344, size: 2.2, layer: 97,
    text: 'SAFETY: T1 must be the wet type. A dry voice transformer saturates on 20-50 mA of loop current.' },
  { x: 20, y: 332, size: 2.2, layer: 97,
    text: 'Isolation line to touchable metal must hold 5 Mohm at 100 V DC. Measure after assembly.' },
];

/* ------------------------------------------------------------ schematic spots */
/*
 * 60 mm columns, 40 mm rows, sized to the widest symbol box on the sheet
 * (the transformer, about 58 x 42 mm) rather than to the average part.
 */
export const SCHEM_PLACEMENT = {
  T1:   { x: 275, y: 388 },
  J1:   { x: 35,  y: 348 },  F1:  { x: 95,  y: 348 },  R1:  { x: 155, y: 348 },
  R2:   { x: 215, y: 348 },  RV1: { x: 275, y: 348 },  C1:  { x: 335, y: 348 },
  BR1:  { x: 395, y: 348 },  K1:  { x: 455, y: 348 },
  R8:   { x: 35,  y: 308 },  LED1: { x: 95, y: 308 },  R7:  { x: 155, y: 308 },
  R3:   { x: 215, y: 308 },  R4:  { x: 275, y: 308 },  RV2: { x: 335, y: 308 },
  SW1:  { x: 395, y: 308 },  R6:  { x: 455, y: 308 },
  R5:   { x: 35,  y: 268 },  RV3: { x: 95,  y: 268 },  C2:  { x: 155, y: 268 },
  LS1:  { x: 215, y: 268 },  MIC1: { x: 275, y: 268 }, R10: { x: 335, y: 268 },
  C3:   { x: 395, y: 268 },  J3:  { x: 455, y: 268 },
  J2:   { x: 35,  y: 228 },  D1:  { x: 95,  y: 228 },  TP1: { x: 155, y: 228 },
  TP2:  { x: 215, y: 228 },
};

/* ------------------------------------------------------------------- metadata */

export const TITLE = 'Isolated Line Test Set';
export const MODEL_PATH = 'tools/xport-v92-linetestset-model.mjs';
export const DESCRIPTION =
  'A lineman\'s test handset: polarity-independent, line powered, with an '
  + 'isolated 600:600 wet transformer and switchable TALK / MONITOR loading.';
export const DOC_REF = 'docs/phreaking-boxes-vlsi-notes.md';

export const NET_CLASS = { GND: 0.5 };

export const UNCONNECTED = [
  ['T1', '2'],     // primary centre tap, not used by the 1:1 arrangement
  ['MIC1', '2'],   // electret case, tied at the capsule
];

export const POWER_BUDGET = [
  { rail: 'LINE', supplyMA: 50, loads: [
    { ref: 'R8', what: 'Line-present LED, about 5 mA from the rectified loop', mA: 5 },
    { ref: 'MIC1', what: 'Electret bias through R7 and R10, about 0.7 mA', mA: 1 },
    { ref: 'K1', what: 'Hook relay coil in TALK, the dominant load', mA: 40 },
  ] },
];

export function POWER_BUDGET_REPORT() {
  const lines = ['## Power budget', '',
    'The set is line powered: everything is fed from the rectified loop, so there',
    'is no cell to go flat in the field.', ''];
  for (const rail of POWER_BUDGET) {
    const used = rail.loads.reduce((n, l) => n + l.mA, 0);
    lines.push(`### ${rail.rail} - ${used} mA drawn of the 20-50 mA loop`, '');
    for (const l of rail.loads)
      lines.push(`- ${l.ref ? `${l.ref}: ` : ''}${l.what} - ${l.mA} mA`);
    lines.push('');
  }
  return lines.join('\n');
}

export const BOM_INTRO =
  'Two parts are not interchangeable. T1 must be a "wet" 600:600 ohm telecom '
  + 'transformer, specified to carry 20-50 mA of DC loop current without '
  + 'saturating - a dry voice transformer of the same impedance works on the '
  + 'bench and fails the moment the line goes off-hook. BR1 must be rated for '
  + 'the line: 600 V reverse, since ring and surge both sit above anything a '
  + 'signal diode survives. Everything else is generic through-hole stock.';

export const SAFETY_NOTES = [
  'The left of the board is line-referenced. 48 V DC sits on the pair, ring '
  + 'peaks above 150 V, and a lightning or power-cross event puts far more on it.',
  'T1 is the only isolation barrier between the line and the earpiece you put '
  + 'against your head. Do not substitute a transformer that is not rated for '
  + 'the line.',
  'Isolation resistance from the line side to any touchable metal has to hold '
  + '5 Mohm measured at 100 V DC. Measure it after assembly, before first use.',
  'The 3 mm creepage across the barrier is enforced by the design-rule checker '
  + 'and backed by a keep-out slot. Do not bridge it with a jumper or a solder '
  + 'blob.',
  'Use only on lines you are authorised to work on. Connecting to a line that '
  + 'is not yours, or listening to a call you are not a party to, is illegal in '
  + 'most jurisdictions regardless of what the hardware is capable of.',
];

/* --------------------------------------------------------------- geometry fns */

export const pinAbsolute = makePinAbsolute(SYMBOLS);

/*
 * Wire lists are written as [x, y] pairs above for readability; the emitter
 * wants {x, y} objects, so normalise once at load.
 */
function normGraphics(list) {
  for (const g of list || [])
    if (g && Array.isArray(g.w) && Array.isArray(g.w[0]))
      g.w = g.w.map(([x, y]) => ({ x, y }));
}
for (const pkg of Object.values(NEW_PACKAGES)) normGraphics(pkg.silk);
for (const sym of Object.values(NEW_SYMBOLS)) normGraphics(sym.wires);
normGraphics(BOARD_LINES);
