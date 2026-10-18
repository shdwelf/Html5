/**
 * xport-v92-audiobridge-model.mjs — the second sheet of the xPort Pro V.92 card
 * family: a POTS-to-sound-card audio bridge.
 *
 * What it does, in signal order:
 *
 *   PSTN tip/ring -> surge protection -> hook relay -> 600:600 ohm "wet"
 *   transformer -> centre-tapped hybrid -> 40 dB pad -> sound card MIC IN
 *                                    \-> sound card LINE OUT -> pad -> hybrid
 *                                    \-> agent headset jack
 *
 * Why a hybrid: the line is 2-wire, a sound card is 4-wire (separate send and
 * receive). Something has to convert between them or the agent hears their own
 * voice a beat late. The hybrid here is the resistive Wheatstone bridge of four
 * 620 ohm arms — one arm being the line itself in series with a DC blocking
 * capacitor — with a 470 ohm trimmer for the balance arm, because the line
 * impedance is not really 600 ohms and a fixed resistor never nulls properly.
 *
 * The transformer has to be the "wet" type. A wet transformer is specified to
 * carry the 20-50 mA of DC loop current without saturating; a dry voice
 * transformer is not, and will distort or go quiet once the line is off-hook.
 * Typical wet transformer DC resistance is 40-150 ohms and inductance a few
 * henries, which is also what sets the low-frequency response.
 *
 * DC LOOP BUDGET, because this is the number that decides whether the exchange
 * will even acknowledge the off-hook:
 *
 *     R1  100 ohm  surge limiter, tip
 *     R2  100 ohm  surge limiter, ring
 *     K1  ~0.1 ohm relay contact
 *     T1  40-150   transformer primary DC resistance
 *     -------------------------------
 *     total 240-350 ohm   (requirement: under 400 ohm)
 *
 * SAFETY / LEGAL, and this is not boilerplate:
 *
 * The line side of this board is marked zone 'mains' and BOARD.creepageMm is
 * 3.0 mm, so the design-rule checker enforces 3 mm between every line-side pad
 * and every SELV pad. The telephone line carries 48 V DC, ring peaks above
 * 150 V, and lightning and power-cross surges well past that. The transformer
 * is the only isolation barrier between that and the sound card, and the
 * isolation resistance from line to any touchable metal has to hold 5 Mohm at
 * 100 V DC.
 *
 * Connecting terminal equipment to a public network is regulated — FCC Part 68
 * in the United States, and equivalent national approvals elsewhere — and
 * compliance is what a Direct Access Arrangement (DAA) is for: an approved
 * module that provides the hook switch, the isolation and the impedance. A
 * discrete hybrid and a transformer on a home-made board is NOT an approved
 * interface. So either buy a DAA (Xecom, Cermetek and Siemens all make them)
 * and connect the hybrid behind it, or keep this board on the private side of
 * the network — behind a PBX, or on a bench line — where no approval applies.
 * The alternative is to take audio from the V.92 modem module's own isolated
 * DAA rather than from the line at all; see the schematic notes for the pin
 * caveat.
 *
 * Level maths, so the pad values are not guesses:
 *
 *   POTS nominal      -9 dBm = 275 mV rms into 600 ohms, 300-3400 Hz
 *   sound card LINE   ~1 V rms out
 *   sound card MIC    ~10 mV nominal input, and it supplies a ~5 V bias
 *
 *   line -> mic   275 mV -> ~10 mV needs roughly 28 dB, but 40 dB is the
 *                 conventional pad for exactly this interface and leaves
 *                 headroom for a loud talker. R8 10 k series + R9 100 ohm
 *                 shunt is 40 dB. R10 2.2 k keeps the card's bias current off
 *                 the transformer.
 *   card -> line  1 V -> ~275 mV is ~11 dB. R13 470 ohm + R14 100 ohm is
 *                 15 dB, which is deliberately a little heavy: better to run
 *                 the line slightly quiet than to overdrive the far end.
 */

/* ------------------------------------------------------------------ helpers */

const P = (x, y, drill = 1.0, diameter = 1.8, extra = {}) => ({ x, y, drill, diameter, ...extra });
const silk = (pts, layer = 21, width = 0.127) => ({ w: pts, layer, width });
const lead = (a, b) => ({ w: [a, b], layer: 51 });

/* ------------------------------------------------------------------- packages */

export const PACKAGES = {
  'R-7.62': {
    name: 'R-7.62',
    descr: 'Resistor, axial DIN0207 (6.3 x 2.5 mm), 7.62 mm pitch',
    courtyard: { x1: -4.31, y1: -1.75, x2: 4.31, y2: 1.75 },
    pads: [P(-3.81, 0, 0.8, 1.7, { shape: 'square' }), P(3.81, 0, 0.8, 1.7)],
    silk: [silk([[-3.15, 1.25], [3.15, 1.25]]), silk([[3.15, 1.25], [3.15, -1.25]]),
           silk([[3.15, -1.25], [-3.15, -1.25]]), silk([[-3.15, -1.25], [-3.15, 1.25]])],
    leads: [lead([-3.81, 0], [-3.15, 0]), lead([3.15, 0], [3.81, 0])],
    texts: [{ x: -3.15, y: 1.75, size: 1, layer: 25, text: '>NAME' }],
  },

  'C-5.08': {
    name: 'C-5.08',
    descr: 'Non-polarised film capacitor, 5.08 mm pitch',
    courtyard: { x1: -3.6, y1: -2.2, x2: 3.6, y2: 2.2 },
    pads: [P(-2.54, 0, 0.8, 1.7, { shape: 'square' }), P(2.54, 0, 0.8, 1.7)],
    silk: [silk([[-1.8, 1.6], [1.8, 1.6]]), silk([[1.8, 1.6], [1.8, -1.6]]),
           silk([[1.8, -1.6], [-1.8, -1.6]]), silk([[-1.8, -1.6], [-1.8, 1.6]])],
    leads: [lead([-2.54, 0], [-1.8, 0]), lead([1.8, 0], [2.54, 0])],
    texts: [{ x: -1.8, y: 2.1, size: 1, layer: 25, text: '>NAME' }],
  },

  'CP-D8-P3.5': {
    name: 'CP-D8-P3.5',
    descr: 'Polarised electrolytic, 8 mm body, 3.5 mm pitch',
    courtyard: { x1: -4.2, y1: -2.2, x2: 4.2, y2: 2.2 },
    pads: [P(-1.75, 0, 0.8, 1.7, { shape: 'square' }), P(1.75, 0, 0.8, 1.7)],
    silk: [silk([[-3.6, 1.6], [3.6, 1.6]]), silk([[3.6, 1.6], [3.6, -1.6]]),
           silk([[3.6, -1.6], [-3.6, -1.6]]), silk([[-3.6, -1.6], [-3.6, 1.6]])],
    texts: [{ x: -3.4, y: -1.1, size: 1.4, layer: 21, text: '+' },
            { x: -3.6, y: 2.1, size: 1, layer: 25, text: '>NAME' }],
  },

  'XFMR-600': {
    name: 'XFMR-600',
    descr: '600:600 ohm telecom audio transformer, wet, shielded can, 6 pin + shield',
    courtyard: { x1: -10.5, y1: -10.5, x2: 10.5, y2: 6.5 },
    pads: [
      P(-3.81, 2.54, 1.0, 1.8, { shape: 'square' }), P(0, 2.54, 1.0, 1.8),
      P(3.81, 2.54, 1.0, 1.8),
      P(3.81, -2.54, 1.0, 1.8), P(0, -2.54, 1.0, 1.8),
      P(-3.81, -2.54, 1.0, 1.8),
      // The shield sits well clear of the secondary pins: grounded on the SELV
      // side, so it has to clear the line-referenced primary by the creepage
      // rule too, and 2.54 mm row pitch does not give it room.
      P(8.89, -8.89, 1.2, 2.2),
    ],
    silk: [silk([[-8.9, 5.9], [8.9, 5.9]]), silk([[8.9, 5.9], [8.9, -5.9]]),
           silk([[8.9, -5.9], [-8.9, -5.9]]), silk([[-8.9, -5.9], [-8.9, 5.9]]),
           silk([[-8.9, 0], [8.9, 0]], 21, 0.2032)],
    texts: [{ x: -8.9, y: 6.4, size: 1, layer: 25, text: '>NAME' },
            { x: -8.9, y: -7.4, size: 1, layer: 27, text: '>VALUE' }],
  },

  'RELAY-SPST': {
    name: 'RELAY-SPST',
    descr: 'Signal relay, SPST-NO, 5 V coil, four pin',
    courtyard: { x1: -8, y1: -5.5, x2: 8, y2: 5.5 },
    pads: [
      P(-5.08, 2.54, 1.0, 1.8, { shape: 'square' }), P(-5.08, -2.54, 1.0, 1.8),
      P(5.08, 2.54, 1.0, 1.8), P(5.08, -2.54, 1.0, 1.8),
    ],
    silk: [silk([[-7.4, 4.9], [7.4, 4.9]]), silk([[7.4, 4.9], [7.4, -4.9]]),
           silk([[7.4, -4.9], [-7.4, -4.9]]), silk([[-7.4, -4.9], [-7.4, 4.9]])],
    texts: [{ x: -7.4, y: 5.4, size: 1, layer: 25, text: '>NAME' }],
  },

  'JACK-3P5': {
    name: 'JACK-3P5',
    descr: '3.5 mm TRS jack, panel/PCB mount, tip-ring-sleeve',
    courtyard: { x1: -6.5, y1: -5, x2: 6.5, y2: 5 },
    pads: [
      P(-2.54, 2.54, 1.0, 1.8, { shape: 'square' }), P(0, 2.54, 1.0, 1.8),
      P(2.54, 2.54, 1.0, 1.8),
    ],
    silk: [silk([[-5.9, 4.4], [5.9, 4.4]]), silk([[5.9, 4.4], [5.9, -4.4]]),
           silk([[5.9, -4.4], [-5.9, -4.4]]), silk([[-5.9, -4.4], [-5.9, 4.4]]),
           silk([[-5.9, -2], [-5.9, -4.4]], 21, 0.4)],
    texts: [{ x: -5.9, y: 4.9, size: 1, layer: 25, text: '>NAME' }],
  },

  'TRIM-3P': {
    name: 'TRIM-3P',
    descr: 'Cermet trimmer, 3 pin, top adjust',
    courtyard: { x1: -4.9, y1: -3.9, x2: 4.9, y2: 3.9 },
    pads: [P(-2.54, 2.54, 0.9, 1.8, { shape: 'square' }), P(0, -2.54, 0.9, 1.8),
           P(2.54, 2.54, 0.9, 1.8)],
    silk: [silk([[-4.3, 3.3], [4.3, 3.3]]), silk([[4.3, 3.3], [4.3, -3.3]]),
           silk([[4.3, -3.3], [-4.3, -3.3]]), silk([[-4.3, -3.3], [-4.3, 3.3]])],
    texts: [{ x: -4.3, y: 3.8, size: 1, layer: 25, text: '>NAME' }],
  },

  'MOV-7.62': {
    name: 'MOV-7.62',
    descr: 'Metal oxide varistor, 7 mm disc, 7.62 mm pitch',
    courtyard: { x1: -5, y1: -2.7, x2: 5, y2: 2.7 },
    pads: [P(-3.81, 0, 0.9, 1.8, { shape: 'square' }), P(3.81, 0, 0.9, 1.8)],
    silk: [silk([[-3.5, 2.1], [3.5, 2.1]]), silk([[3.5, 2.1], [3.5, -2.1]]),
           silk([[3.5, -2.1], [-3.5, -2.1]]), silk([[-3.5, -2.1], [-3.5, 2.1]])],
    leads: [lead([-3.81, 0], [-3.5, 0]), lead([3.5, 0], [3.81, 0])],
    texts: [{ x: -3.5, y: 2.6, size: 1, layer: 25, text: '>NAME' }],
  },

  'TO92': {
    name: 'TO92',
    descr: 'TO-92 transistor, flat side toward the reference',
    courtyard: { x1: -2.8, y1: -2.6, x2: 2.8, y2: 2.6 },
    pads: [P(-1.27, 0, 0.8, 1.6, { shape: 'square' }), P(0, 0, 0.8, 1.6),
           P(1.27, 0, 0.8, 1.6)],
    silk: [silk([[-2.4, -1.4], [2.4, -1.4]]), silk([[-2.4, -1.4], [-1.6, 1.6]]),
           silk([[2.4, -1.4], [1.6, 1.6]]), silk([[-1.6, 1.6], [1.6, 1.6]])],
    texts: [{ x: -2.4, y: 2.1, size: 1, layer: 25, text: '>NAME' }],
  },

  'TERM2-5.08': {
    name: 'TERM2-5.08',
    descr: 'Two way screw terminal, 5.08 mm pitch',
    courtyard: { x1: -5.3, y1: -3.8, x2: 5.3, y2: 3.8 },
    pads: [P(-2.54, 0, 1.3, 2.4, { shape: 'square' }), P(2.54, 0, 1.3, 2.4)],
    silk: [silk([[-4.7, 3.2], [4.7, 3.2]]), silk([[4.7, 3.2], [4.7, -3.2]]),
           silk([[4.7, -3.2], [-4.7, -3.2]]), silk([[-4.7, -3.2], [-4.7, 3.2]]),
           silk([[-4.7, 0], [-3.2, 0]], 21, 0.4), silk([[4.7, 0], [3.2, 0]], 21, 0.4)],
    texts: [{ x: -4.7, y: 3.7, size: 1, layer: 25, text: '>NAME' }],
  },

  'LED-5MM': {
    name: 'LED-5MM',
    descr: 'LED, 5 mm, 2.54 mm pitch',
    courtyard: { x1: -3.4, y1: -2.6, x2: 3.4, y2: 2.6 },
    pads: [P(-1.27, 0, 0.8, 1.7, { shape: 'square' }), P(1.27, 0, 0.8, 1.7)],
    silk: [silk([[-2.8, 1.9], [2.8, 1.9]]), silk([[-2.8, -1.9], [2.8, -1.9]]),
           silk([[-2.8, 1.9], [-2.8, 0.6]], 21, 0.4),
           silk([[2.8, -1.9], [2.8, -0.6]], 21, 0.4)],
    texts: [{ x: -2.8, y: 2.4, size: 1, layer: 25, text: '>NAME' }],
  },

  'DO41': {
    name: 'DO41',
    descr: 'DO-41 axial diode, 7.62 mm pitch',
    courtyard: { x1: -4.31, y1: -1.75, x2: 4.31, y2: 1.75 },
    pads: [P(-3.81, 0, 0.8, 1.7, { shape: 'square' }), P(3.81, 0, 0.8, 1.7)],
    silk: [silk([[-2.6, 1.25], [2.6, 1.25]]), silk([[2.6, 1.25], [2.6, -1.25]]),
           silk([[2.6, -1.25], [-2.6, -1.25]]), silk([[-2.6, -1.25], [-2.6, 1.25]]),
           silk([[-2.0, 1.25], [-2.0, -1.25]], 21, 0.3)],
    leads: [lead([-3.81, 0], [-2.6, 0]), lead([2.6, 0], [3.81, 0])],
    texts: [{ x: -2.6, y: 1.75, size: 1, layer: 25, text: '>NAME' }],
  },

  'TP': {
    name: 'TP',
    descr: 'Test point, 1 mm pad',
    courtyard: { x1: -1.1, y1: -1.1, x2: 1.1, y2: 1.1 },
    pads: [P(0, 0, 0, 1.6, { drill: 1.0 })],
    silk: [silk([[-1.0, 0], [1.0, 0]], 21, 0.4)],
    texts: [{ x: -1.1, y: 1.4, size: 1, layer: 25, text: '>NAME' }],
  },

  'MOUNT-M3': {
    name: 'MOUNT-M3',
    descr: 'M3 mounting hole, 3.2 mm drill, no copper',
    courtyard: { x1: -3.1, y1: -3.1, x2: 3.1, y2: 3.1 },
    // A hole, not a pad: the DRC measures every mounting hole against copper,
    // and a pad at the hole centre is 0.00 mm from itself.
    pads: [],
    holes: [{ x: 0, y: 0, drill: 3.2 }],
    silk: [],
    texts: [],
  },
};

/* -------------------------------------------------------------------- symbols */

const pin = (name, x, y, rot = 'R0', length = 'short', direction = 'pas') =>
  ({ name, x, y, rot, length, direction });


export const SYMBOLS = {
  'R-EU': {
    name: 'R-EU',
    wires: [
      { w: [[-2.54, 1.27], [2.54, 1.27]], layer: 94, width: 0.254 },
      { w: [[2.54, 1.27], [2.54, -1.27]], layer: 94, width: 0.254 },
      { w: [[2.54, -1.27], [-2.54, -1.27]], layer: 94, width: 0.254 },
      { w: [[-2.54, -1.27], [-2.54, 1.27]], layer: 94, width: 0.254 },
      { w: [[-2.54, 0], [-1.9, 1]], layer: 94 },
      { w: [[-1.9, 1], [-0.63, -1]], layer: 94 },
      { w: [[-0.63, -1], [0.63, 1]], layer: 94 },
      { w: [[0.63, 1], [1.9, -1]], layer: 94 },
      { w: [[1.9, -1], [2.54, 0]], layer: 94 },
    ],
    texts: [{ x: -2.54, y: 2.27, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -3.87, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', -5.08, 0, 'R0'), pin('2', 5.08, 0, 'R180')],
  },

  'C-EU': {
    name: 'C-EU',
    wires: [{ w: [[-2.54, 0.635], [2.54, 0.635]], layer: 94, width: 0.254 },
            { w: [[-2.54, -0.635], [2.54, -0.635]], layer: 94, width: 0.254 }],
    texts: [{ x: -2.54, y: 1.65, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -3.4, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', 0, 2.54, 'R270'), pin('2', 0, -2.54, 'R90')],
  },

  'CPOL-EU': {
    name: 'CPOL-EU',
    wires: [{ w: [[-2.54, 0.635], [2.54, 0.635]], layer: 94, width: 0.254 },
            { w: [[-2.54, -0.635], [2.54, -0.635]], layer: 94, width: 0.254 },
            { w: [[-1.9, 1.9], [-0.63, 1.9]], layer: 94 },
            { w: [[-1.27, 2.54], [-1.27, 1.27]], layer: 94 }],
    texts: [{ x: -2.54, y: 3.2, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -3.4, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('+', 0, 2.54, 'R270'), pin('-', 0, -2.54, 'R90')],
  },

  VARISTOR: {
    name: 'VARISTOR',
    wires: [{ w: [[-2.54, 1.27], [2.54, 1.27]], layer: 94, width: 0.254 },
            { w: [[2.54, 1.27], [2.54, -1.27]], layer: 94, width: 0.254 },
            { w: [[2.54, -1.27], [-2.54, -1.27]], layer: 94, width: 0.254 },
            { w: [[-2.54, -1.27], [-2.54, 1.27]], layer: 94, width: 0.254 },
            { w: [[-2.54, -1.9], [1.9, 1.9]], layer: 94, width: 0.254 },
            { w: [[1.9, 1.9], [2.54, 1.9]], layer: 94, width: 0.254 }],
    texts: [{ x: -2.54, y: 2.6, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -4.3, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', -5.08, 0, 'R0'), pin('2', 5.08, 0, 'R180')],
  },

  FUSE: {
    name: 'FUSE',
    wires: [{ w: [[-2.54, 0], [-1.9, 0]], layer: 94 },
            { w: [[-1.9, 1.0], [1.9, 1.0]], layer: 94, width: 0.254 },
            { w: [[1.9, 1.0], [1.9, -1.0]], layer: 94, width: 0.254 },
            { w: [[1.9, -1.0], [-1.9, -1.0]], layer: 94, width: 0.254 },
            { w: [[-1.9, -1.0], [-1.9, 1.0]], layer: 94, width: 0.254 },
            { w: [[1.9, 0], [2.54, 0]], layer: 94 }],
    texts: [{ x: -2.54, y: 1.9, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -3.6, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', -5.08, 0, 'R0'), pin('2', 5.08, 0, 'R180')],
  },

  DIODE: {
    name: 'DIODE',
    wires: [{ w: [[-1.27, 1.27], [-1.27, -1.27]], layer: 94, width: 0.254 },
            { w: [[-1.27, 0], [1.27, 1.27]], layer: 94, width: 0.254 },
            { w: [[1.27, 1.27], [1.27, -1.27]], layer: 94, width: 0.254 },
            { w: [[1.27, -1.27], [-1.27, 0]], layer: 94, width: 0.254 },
            { w: [[-2.54, 0], [-1.27, 0]], layer: 94 },
            { w: [[1.27, 0], [2.54, 0]], layer: 94 }],
    texts: [{ x: -2.54, y: 2.2, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -3.8, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('A', -5.08, 0, 'R0'), pin('C', 5.08, 0, 'R180')],
  },

  'XFMR-600': {
    name: 'XFMR-600',
    wires: [{ w: [[-1.27, 5.08], [-1.27, -5.08]], layer: 94, width: 0.4064 },
            { w: [[1.27, 5.08], [1.27, -5.08]], layer: 94, width: 0.4064 },
            { w: [[-7.62, 7.62], [7.62, 7.62]], layer: 94, width: 0.4064 },
            { w: [[7.62, 7.62], [7.62, -7.62]], layer: 94, width: 0.4064 },
            { w: [[7.62, -7.62], [-7.62, -7.62]], layer: 94, width: 0.4064 },
            { w: [[-7.62, -7.62], [-7.62, 7.62]], layer: 94, width: 0.4064 }],
    texts: [{ x: -7.62, y: 8.2, size: 1.778, layer: 95, text: '>NAME' },
            { x: -7.62, y: -10.8, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', -10.16, 5.08, 'R0'), pin('2', -10.16, 0, 'R0'),
           pin('3', -10.16, -5.08, 'R0'),
           pin('4', 10.16, 5.08, 'R180'), pin('5', 10.16, 0, 'R180'),
           pin('6', 10.16, -5.08, 'R180'),
           pin('S', 0, 10.16, 'R270')],
  },

  RELAY: {
    name: 'RELAY',
    wires: [{ w: [[-5.08, 5.08], [5.08, 5.08]], layer: 94, width: 0.4064 },
            { w: [[5.08, 5.08], [5.08, -5.08]], layer: 94, width: 0.4064 },
            { w: [[5.08, -5.08], [-5.08, -5.08]], layer: 94, width: 0.4064 },
            { w: [[-5.08, -5.08], [-5.08, 5.08]], layer: 94, width: 0.4064 },
            { w: [[-3.175, 0], [3.175, 1.905]], layer: 94, width: 0.254 }],
    texts: [{ x: -5.08, y: 5.7, size: 1.778, layer: 95, text: '>NAME' },
            { x: -5.08, y: -8.2, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('A1', -7.62, 2.54, 'R0'), pin('A2', -7.62, -2.54, 'R0'),
           pin('C', 7.62, 2.54, 'R180'), pin('NO', 7.62, -2.54, 'R180')],
  },

  'JACK-TRS': {
    name: 'JACK-TRS',
    wires: [{ w: [[-5.08, 5.08], [5.08, 5.08]], layer: 94, width: 0.4064 },
            { w: [[5.08, 5.08], [5.08, -5.08]], layer: 94, width: 0.4064 },
            { w: [[5.08, -5.08], [-5.08, -5.08]], layer: 94, width: 0.4064 },
            { w: [[-5.08, -5.08], [-5.08, 5.08]], layer: 94, width: 0.4064 }],
    texts: [{ x: -5.08, y: 5.7, size: 1.778, layer: 95, text: '>NAME' },
            { x: -5.08, y: -8.2, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('T', -7.62, 2.54, 'R0'), pin('R', -7.62, 0, 'R0'),
           pin('S', -7.62, -2.54, 'R0')],
  },

  TRIM: {
    name: 'TRIM',
    wires: [{ w: [[-2.54, 1.27], [2.54, 1.27]], layer: 94, width: 0.254 },
            { w: [[2.54, 1.27], [2.54, -1.27]], layer: 94, width: 0.254 },
            { w: [[2.54, -1.27], [-2.54, -1.27]], layer: 94, width: 0.254 },
            { w: [[-2.54, -1.27], [-2.54, 1.27]], layer: 94, width: 0.254 },
            { w: [[0, 3.81], [0, 2.0]], layer: 94 },
            { w: [[-0.9, 2.0], [0.9, 2.0]], layer: 94, width: 0.254 }],
    texts: [{ x: -2.54, y: 4.6, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -3.6, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', -5.08, 0, 'R0'), pin('2', 0, 7.62, 'R270'), pin('3', 5.08, 0, 'R180')],
  },

  NPN: {
    name: 'NPN',
    wires: [{ w: [[-0.635, 2.54], [-0.635, -2.54]], layer: 94, width: 0.4064 },
            { w: [[0, 2.54], [-0.635, 1.905]], layer: 94, width: 0.254 },
            { w: [[0, -2.54], [-0.635, -1.905]], layer: 94, width: 0.254 },
            { w: [[-2.54, 0], [-0.635, 0]], layer: 94, width: 0.254 }],
    texts: [{ x: 1.9, y: 2.54, size: 1.778, layer: 95, text: '>NAME' },
            { x: 1.9, y: -4.3, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('B', -5.08, 0, 'R0'), pin('C', 0, 5.08, 'R270'),
           pin('E', 0, -5.08, 'R90')],
  },

  'TERM-2': {
    name: 'TERM-2',
    wires: [{ w: [[-5.08, 3.81], [5.08, 3.81]], layer: 94, width: 0.4064 },
            { w: [[5.08, 3.81], [5.08, -3.81]], layer: 94, width: 0.4064 },
            { w: [[5.08, -3.81], [-5.08, -3.81]], layer: 94, width: 0.4064 },
            { w: [[-5.08, -3.81], [-5.08, 3.81]], layer: 94, width: 0.4064 }],
    texts: [{ x: -5.08, y: 4.4, size: 1.778, layer: 95, text: '>NAME' },
            { x: -5.08, y: -6.9, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('1', -7.62, 0, 'R0'), pin('2', 7.62, 0, 'R180')],
  },

  LED: {
    name: 'LED',
    wires: [{ w: [[-1.27, 1.27], [-1.27, -1.27]], layer: 94, width: 0.254 },
            { w: [[-1.27, 0], [1.27, 1.27]], layer: 94, width: 0.254 },
            { w: [[1.27, 1.27], [1.27, -1.27]], layer: 94, width: 0.254 },
            { w: [[1.27, -1.27], [-1.27, 0]], layer: 94, width: 0.254 },
            { w: [[-2.54, 0], [-1.27, 0]], layer: 94 },
            { w: [[1.27, 0], [2.54, 0]], layer: 94 },
            { w: [[0.63, 1.9], [2.54, 3.175]], layer: 94 },
            { w: [[-0.63, 2.54], [1.27, 3.81]], layer: 94 }],
    texts: [{ x: -2.54, y: 4.4, size: 1.778, layer: 95, text: '>NAME' },
            { x: -2.54, y: -4.0, size: 1.778, layer: 96, text: '>VALUE' }],
    pins: [pin('A', -5.08, 0, 'R0'), pin('C', 5.08, 0, 'R180')],
  },

  TP: {
    name: 'TP',
    wires: [],
    texts: [{ x: -1.27, y: 1.9, size: 1.778, layer: 95, text: '>NAME' }],
    pins: [pin('1', 0, -2.54, 'R90')],
  },
};

/* ----------------------------------------------------------------- devicesets */

export const DEVICESETS = {
  'R-EU':      { prefix: 'R',  symbol: 'R-EU',     package: 'R-7.62',
                connects: { 1: '1', 2: '2' } },
  'C-EU':      { prefix: 'C',  symbol: 'C-EU',     package: 'C-5.08',
                connects: { 1: '1', 2: '2' } },
  'CPOL-EU':   { prefix: 'C',  symbol: 'CPOL-EU',  package: 'CP-D8-P3.5',
                connects: { '+': '1', '-': '2' } },
  FUSE:        { prefix: 'F',  symbol: 'FUSE',     package: 'R-7.62',
                connects: { 1: '1', 2: '2' } },
  VARISTOR:    { prefix: 'RV', symbol: 'VARISTOR', package: 'MOV-7.62',
                connects: { 1: '1', 2: '2' } },
  'DIODE-SCH': { prefix: 'D',  symbol: 'DIODE',    package: 'DO41',
                connects: { A: '1', C: '2' } },
  'XFMR-600':  { prefix: 'T',  symbol: 'XFMR-600', package: 'XFMR-600',
                connects: { 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', S: 'S' } },
  RELAY:       { prefix: 'K',  symbol: 'RELAY',    package: 'RELAY-SPST',
                connects: { A1: '1', A2: '2', C: '3', NO: '4' } },
  'JACK-TRS':  { prefix: 'J',  symbol: 'JACK-TRS', package: 'JACK-3P5',
                connects: { T: '1', R: '2', S: '3' } },
  TRIM:        { prefix: 'RV', symbol: 'TRIM',     package: 'TRIM-3P',
                connects: { 1: '1', 2: '2', 3: '3' } },
  NPN:         { prefix: 'Q',  symbol: 'NPN',      package: 'TO92',
                connects: { B: '1', C: '2', E: '3' } },
  'TERM-2':    { prefix: 'J',  symbol: 'TERM-2',   package: 'TERM2-5.08',
                connects: { 1: '1', 2: '2' } },
  LED:         { prefix: 'LED', symbol: 'LED',     package: 'LED-5MM',
                connects: { A: '1', C: '2' } },
  TP:          { prefix: 'TP', symbol: 'TP',       package: 'TP',
                connects: { 1: '1' } },
  'MOUNT-M3':  { prefix: 'H',  symbol: null,       package: 'MOUNT-M3',
                connects: {} },
};

/*
 * Pads are written positionally above for readability and get their names here,
 * in the order they appear. The length assertion is the point: a package whose
 * pad count drifts from its deviceset's `connects` map fails at load instead of
 * emitting a library with unnameable pins.
 */
const PAD_NAMES = {
  'R-7.62': ['1', '2'], 'C-5.08': ['1', '2'], 'CP-D8-P3.5': ['1', '2'],
  'XFMR-600': ['1', '2', '3', '4', '5', '6', 'S'],
  'RELAY-SPST': ['1', '2', '3', '4'], 'JACK-3P5': ['1', '2', '3'],
  'TRIM-3P': ['1', '2', '3'], 'MOV-7.62': ['1', '2'], 'TO92': ['1', '2', '3'],
  'TERM2-5.08': ['1', '2'], 'LED-5MM': ['1', '2'], 'DO41': ['1', '2'],
  'TP': ['1'], 'MOUNT-M3': [],
};
for (const [name, pkg] of Object.entries(PACKAGES)) {
  const want = PAD_NAMES[name];
  if (!want) throw new Error(`${name}: no pad-name table`);
  if (want.length !== (pkg.pads || []).length)
    throw new Error(`${name}: ${pkg.pads.length} pads but ${want.length} names`);
  pkg.pads.forEach((pad, i) => { pad.name = want[i]; });
}

/*
 * Wire lists are written above as [x, y] pairs because a 40-pad footprint is
 * unreadable otherwise; the emitter wants {x, y} objects, so normalise once at
 * load rather than at every call site. Consecutive points form a polyline.
 */
function normGraphics(list) {
  for (const g of list || [])
    if (g && Array.isArray(g.w) && Array.isArray(g.w[0]))
      g.w = g.w.map(([x, y]) => ({ x, y }));
}
for (const pkg of Object.values(PACKAGES)) {
  normGraphics(pkg.silk); normGraphics(pkg.leads); normGraphics(pkg.restrict);
}
for (const sym of Object.values(SYMBOLS)) normGraphics(sym.wires);
// BOARD_LINES is normalised at the foot of the module - it is declared later.

/* ----------------------------------------------------------------------- board */

export const BOARD = {
  name: 'xport-v92-audiobridge', rev: 'A',
  w: 120, h: 90, layers: 2, thickness: 1.57,
  edgeClearance: 1.5,
  zones: {
    // The line side is held to a creepage rule. A PSTN line is 48 V DC with
    // ring above 150 V peak and surge on top of that; it is not SELV.
    mains: { x1: 0, y1: 0, x2: 38, y2: 90 },
    selv: { x1: 42, y1: 0, x2: 120, y2: 90 },
  },
  creepageMm: 3.0,
  clearanceMm: 0.35,
  mountingHoles: [{ x: 4, y: 4 }, { x: 116, y: 4 }, { x: 4, y: 86 }, { x: 116, y: 86 }],
};

export const SHEET = { w: 520, h: 420, columns: 13, rows: 11 };

/* ------------------------------------------------------------------------ nets */
/*
 * The hybrid is the centre-tapped arrangement: the sound card drives the whole
 * secondary (pads 4 and 6), the receive tap is the centre (pad 5), and the
 * balance arm is the 470 ohm trimmer. Primary pads 1 and 3 are the DC loop and
 * are marked mains through PARTS[].padZones below; pad 2 is the primary centre
 * tap and is left open.
 */
export const NETS = {
  LINE_TIP:  [['J1', '1'], ['F1', '1']],
  FUSE_OUT:  [['F1', '2'], ['R1', '1']],
  PROT_TIP:  [['R1', '2'], ['RV1', '1'], ['K1', 'C'], ['C1', '1']],
  PROT_RING: [['J1', '2'], ['R2', '1'], ['RV1', '2']],
  RING_IN:   [['R2', '2'], ['C1', '2'], ['T1', '3']],
  LOOP_A:    [['K1', 'NO'], ['T1', '1']],

  HYB_TOP:   [['T1', '4'], ['R3', '1'], ['C2', '2']],
  HYB_BOT:   [['T1', '6'], ['R4', '1']],
  HYB_CT:    [['T1', '5'], ['RV2', '2'], ['R8', '1']],
  BAL_A:     [['R3', '2'], ['RV2', '1']],
  BAL_B:     [['R4', '2'], ['RV2', '3']],

  TX_IN:     [['C6', '2'], ['R13', '1']],
  TX_PAD:    [['R13', '2'], ['R14', '1'], ['C2', '1'], ['C3', '1']],
  RX_PAD:    [['R8', '2'], ['R9', '1'], ['C4', '1'], ['R10', '1']],
  RX_OUT:    [['C5', '1'], ['J2', 'T']],
  MIC_BIAS:  [['R10', '2'], ['J2', 'R']],

  CARD_OUT:  [['J3', 'T'], ['C6', '1']],

  HS_SPK:    [['J4', 'T'], ['R11', '1']],
  HS_SPK_L:  [['R11', '2'], ['C7', '1']],
  HS_MIC:    [['J4', 'R'], ['C8', '1'], ['R12', '1']],
  HS_MIC_B:  [['R12', '2'], ['R15', '1']],
  HS_GND:    [['J4', 'S'], ['C7', '2'], ['C8', '2']],

  RLY_HI:    [['J5', '1'], ['K1', 'A1'], ['C9', '+'], ['D1', 'A']],
  RLY_SW:    [['K1', 'A2'], ['D1', 'C'], ['Q1', 'C'], ['LED1', 'C']],
  Q1_B:      [['Q1', 'B'], ['R16', '1']],
  HOOK:      [['R16', '2'], ['J6', '1'], ['TP1', '1']],
  LED_A:     [['R17', '2'], ['LED1', 'A']],
  V5:        [['J5', '2'], ['R17', '1'], ['R15', '2']],
  GND:       [['C9', '-'], ['J6', '2'], ['Q1', 'E'], ['J3', 'S'],
              ['TP2', '1'], ['T1', 'S'],
              ['R14', '2'], ['C3', '2'], ['R9', '2'], ['C4', '2'], ['C5', '2']],
};

/* ----------------------------------------------------------------------- parts */

export const PARTS = [
  // --- line side, zone 'mains' ------------------------------------------
  { ref: 'J1', set: 'TERM-2', value: 'LINE', zone: 'mains',
    note: 'PSTN pair. Screws 1 and 2 are tip and ring; polarity does not matter because the bridge is symmetrical.' },
  { ref: 'F1', set: 'FUSE', value: '50mA', zone: 'mains',
    note: 'Limits fault current on a power-cross. 50 mA is the conventional value for a line-side fuse and is above the 20-50 mA loop.' },
  { ref: 'RV1', set: 'VARISTOR', value: '275V', zone: 'mains',
    note: 'Clamps lightning and power-cross surges before they reach the transformer.' },
  { ref: 'C1', set: 'C-EU', value: '100nF/630V', zone: 'mains',
    note: 'With R1 and R2 forms the RC snubber that stops the varistor ringing on the line.' },
  { ref: 'R1', set: 'R-EU', value: '100R', zone: 'mains',
    note: 'Series surge limiter, tip. 100 ohm, part of the DC loop budget.' },
  { ref: 'R2', set: 'R-EU', value: '100R', zone: 'mains',
    note: 'Series surge limiter, ring. 100 ohm, part of the DC loop budget.' },
  { ref: 'K1', set: 'RELAY', value: 'HK 5V SPST', zone: 'mains',
    note: 'Hook switch. Closing the contact puts the transformer primary across the line, which is what going off-hook means.' },

  // --- the barrier -------------------------------------------------------
  { ref: 'T1', set: 'XFMR-600', value: '600:600 WET', zone: 'selv',
    padZones: { 1: 'mains', 2: 'mains', 3: 'mains' },
    note: 'MUST be the wet type: specified to carry 20-50 mA DC loop current without saturating. Pads 1 and 3 are the primary and stay line-referenced; the shield goes to ground.' },

  // --- SELV side ---------------------------------------------------------
  { ref: 'R3', set: 'R-EU', value: '620R', zone: 'selv',
    note: 'Hybrid bridge arm. Four 620 ohm arms make the resistive Wheatstone bridge; the line itself is the fourth.' },
  { ref: 'R4', set: 'R-EU', value: '620R', zone: 'selv',
    note: 'Hybrid bridge arm, the other half of the balance network.' },
  { ref: 'RV2', set: 'TRIM', value: '470R', zone: 'selv',
    note: 'Balance trimmer. Adjust for minimum sidetone with a real line connected: the line is not really 600 ohms so a fixed resistor never nulls.' },
  { ref: 'C2', set: 'C-EU', value: '2u2 NP', zone: 'selv',
    note: 'DC block on the transmit path so the sound card output bias never reaches the line.' },
  { ref: 'R13', set: 'R-EU', value: '470R', zone: 'selv',
    note: 'Transmit pad, series leg.' },
  { ref: 'R14', set: 'R-EU', value: '100R', zone: 'selv',
    note: 'Transmit pad, shunt leg. 470 + 100 is 15 dB, deliberately heavier than the 11 dB the levels need.' },
  { ref: 'C3', set: 'C-EU', value: '100nF', zone: 'selv',
    note: 'RF bypass at the transmit pad.' },
  { ref: 'R8', set: 'R-EU', value: '10k', zone: 'selv',
    note: 'Receive pad, series leg. 10 k series with 100 ohm shunt is the 40 dB line-to-microphone pad.' },
  { ref: 'R9', set: 'R-EU', value: '100R', zone: 'selv',
    note: 'Receive pad, shunt leg.' },
  { ref: 'C4', set: 'C-EU', value: '100nF', zone: 'selv',
    note: 'RF bypass at the receive pad.' },
  { ref: 'R10', set: 'R-EU', value: '2k2', zone: 'selv',
    note: 'Keeps the sound card microphone bias current out of the transformer.' },
  { ref: 'C5', set: 'C-EU', value: '1u NP', zone: 'selv',
    note: 'DC block into the microphone jack; the card supplies bias on that pin.' },
  { ref: 'J2', set: 'JACK-TRS', value: 'MIC IN', zone: 'selv',
    note: 'To the sound card MICROPHONE input (pink). Tip is signal, ring takes the card bias through R10, sleeve is ground.' },
  { ref: 'J3', set: 'JACK-TRS', value: 'CARD OUT', zone: 'selv',
    note: 'From the sound card LINE or headphone output (green). Do not use the microphone input of the card for this leg.' },
  { ref: 'C6', set: 'C-EU', value: '1u NP', zone: 'selv',
    note: 'DC block from the sound card output.' },

  { ref: 'J4', set: 'JACK-TRS', value: 'HEADSET', zone: 'selv',
    note: 'Agent headset. Tip is the earpiece, ring is the electret microphone, sleeve is common.' },
  { ref: 'R11', set: 'R-EU', value: '100R', zone: 'selv',
    note: 'Series isolation for the headset earpiece, and short-circuit protection.' },
  { ref: 'C7', set: 'C-EU', value: '100u NP', zone: 'selv',
    note: 'DC block to the earpiece.' },
  { ref: 'C8', set: 'C-EU', value: '1u NP', zone: 'selv',
    note: 'DC block from the electret microphone.' },
  { ref: 'R12', set: 'R-EU', value: '1k', zone: 'selv',
    note: 'Electret load resistor. The bias comes from V5 through R15.' },
  { ref: 'R15', set: 'R-EU', value: '2k2', zone: 'selv',
    note: 'Headset electret bias feed.' },

  // --- hook driver -------------------------------------------------------
  { ref: 'J5', set: 'TERM-2', value: 'PWR 5V', zone: 'selv',
    note: '5 V for the relay coil and the electret bias. Screw 1 is +5 V, screw 2 is the return.' },
  { ref: 'J6', set: 'TERM-2', value: 'CTRL', zone: 'selv',
    note: 'HOOK control from the Nucleo (drive high to go off-hook) and its return.' },
  { ref: 'C9', set: 'CPOL-EU', value: '10u/16V', zone: 'selv',
    note: 'Coil supply reservoir; the relay inrush is the largest transient on the board.' },
  { ref: 'D1', set: 'DIODE-SCH', value: '1N4148', zone: 'selv',
    note: 'Flyback across the coil. Without it the collapse spikes the transistor.' },
  { ref: 'Q1', set: 'NPN', value: 'BC547B', zone: 'selv',
    note: 'Coil driver. A 5 V logic level saturates it through R16.' },
  { ref: 'R16', set: 'R-EU', value: '1k', zone: 'selv',
    note: 'Base resistor, about 4 mA of base current for a saturated switch.' },
  { ref: 'R17', set: 'R-EU', value: '1k', zone: 'selv',
    note: 'LED current limit; the indicator shares Q1 so it tracks the hook state exactly.' },
  { ref: 'LED1', set: 'LED', value: 'HOOK', zone: 'selv',
    note: 'Off-hook indicator, red.' },

  { ref: 'TP1', set: 'TP', value: 'HOOK', zone: 'selv', note: 'Probe the hook control.' },
  { ref: 'TP2', set: 'TP', value: 'GND', zone: 'selv', note: 'Ground reference for a scope.' },

  { ref: 'H1', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H2', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H3', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H4', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
];

/* ------------------------------------------------------------------ placement */
/*
 * Left third is the line side, right two thirds the SELV side, with a 4 mm gap
 * between x = 38 and x = 42 carrying the 3 mm creepage. R1 and R2 sit in the
 * path between the fuse and the relay/transformer, so the nets that cross the
 * barrier are PROT_TIP, PROT_RING and LOOP_A.
 */
export const PLACEMENT = {
  // --- line side, all inside the mains zone (x < 38) ---
  J1:   { x: 8,   y: 45 },
  F1:   { x: 8,   y: 58 },
  RV1:  { x: 8,   y: 30 },
  C1:   { x: 8,   y: 20 },
  R1:   { x: 20,  y: 60 },
  R2:   { x: 20,  y: 12 },
  K1:   { x: 26,  y: 45 },
  T1:   { x: 28,  y: 76 },

  // --- SELV side, a 14 mm column grid starting at the barrier ---
  R3:   { x: 50,  y: 80 },
  R4:   { x: 64,  y: 80 },
  R8:   { x: 78,  y: 80 },
  R10:  { x: 92,  y: 80 },
  RV2:  { x: 50,  y: 70 },
  R9:   { x: 64,  y: 70 },
  C4:   { x: 78,  y: 70 },
  C5:   { x: 92,  y: 70 },
  J2:   { x: 52,  y: 60 },
  C2:   { x: 72,  y: 60 },
  C6:   { x: 84,  y: 60 },
  J3:   { x: 104, y: 60 },
  R13:  { x: 50,  y: 48 },
  R14:  { x: 64,  y: 48 },
  C3:   { x: 78,  y: 48 },
  R11:  { x: 92,  y: 48 },
  LED1: { x: 108, y: 48 },
  J4:   { x: 52,  y: 38 },
  C7:   { x: 72,  y: 38 },
  C8:   { x: 84,  y: 38 },
  R12:  { x: 98,  y: 38 },
  R15:  { x: 112, y: 38 },
  J5:   { x: 52,  y: 26 },
  C9:   { x: 66,  y: 26 },
  D1:   { x: 80,  y: 26 },
  Q1:   { x: 92,  y: 26 },
  R17:  { x: 104, y: 26 },
  J6:   { x: 52,  y: 14 },
  R16:  { x: 66,  y: 14 },
  TP1:  { x: 80,  y: 14 },
  TP2:  { x: 90,  y: 14 },

  H1:   { x: 4,   y: 4 },
  H2:   { x: 116, y: 4 },
  H3:   { x: 4,   y: 86 },
  H4:   { x: 116, y: 86 },
};

/* --------------------------------------------------------------------- copper */

export const POUR = { x1: 1.5, y1: 1.5, x2: 118.5, y2: 88.5 };

// The milled slot that makes the creepage a physical barrier and not just a
// spacing rule on the silk.
export const BARRIER = { x1: 40, y1: 6, x2: 40, y2: 84 };

export const BOARD_LINES = [
  // Isolation barrier: dashed on silk, and the pour stops short of it. This is
  // a keep-out and a crease line, not a board cut - a milled slot would need
  // bridges where PROT_TIP, PROT_RING and LOOP_A cross.
  { x1: 40, y1: 4, x2: 40, y2: 86, layer: 21, width: 0.5, style: 'longdash' },
  { x1: 38, y1: 4, x2: 38, y2: 86, layer: 41, width: 0.2 },
  { x1: 42, y1: 4, x2: 42, y2: 86, layer: 41, width: 0.2 },
];

export const BOARD_NOTES = [
  { x: 2, y: 88, size: 1.8, layer: 21,
    text: 'POTS Audio Bridge rev A - 120 x 90 mm, 2 layers. LEFT of the slot is LINE-REFERENCED.' },
  { x: 2, y: 76, size: 1.4, layer: 21,
    text: 'The 600:600 transformer T1 is the only isolation barrier. Keep the slot clear of copper.' },
  { x: 44, y: 88, size: 1.4, layer: 21,
    text: 'SELV side: hybrid, 40 dB receive pad, 15 dB transmit pad, headset, hook driver.' },
  { x: 2, y: 6, size: 1.4, layer: 21,
    text: 'Not a certified DAA. See the design doc before connecting to a public network.' },
];

export const SCHEM_NOTES = [
  { x: 20, y: 412, size: 3.4, layer: 97,
    text: 'POTS Audio Bridge - sound card microphone and headset across a telephone line' },
  { x: 20, y: 400, size: 2.2, layer: 97,
    text: 'Line -> F1 50mA -> R1/R2 100R -> K1 hook relay -> T1 wet 600:600 -> centre-tapped hybrid -> 40 dB pad -> MIC IN' },
  { x: 20, y: 392, size: 2.2, layer: 97,
    text: 'Sound card out -> 15 dB pad -> hybrid TX.  Agent headset hangs off the same hybrid.' },
  { x: 20, y: 380, size: 2.2, layer: 97,
    text: 'DC loop when off-hook: R1 100 + R2 100 + K1 contact + T1 primary 40-150 = 240-350 R, under the 400 R limit.' },
  { x: 20, y: 370, size: 2.2, layer: 97,
    text: 'The hybrid is a Wheatstone bridge of four 620 R arms, one being the line via C, nulled by RV2 470 R.' },
  { x: 20, y: 358, size: 2.2, layer: 97,
    text: 'SAFETY: T1 MUST be the wet type (20-50 mA DC without saturation). A dry voice transformer will saturate.' },
  { x: 20, y: 348, size: 2.2, layer: 97,
    text: 'REGULATORY: this is not an approved interface. Use a certified DAA, or stay on the private side of a PBX.' },
  { x: 20, y: 336, size: 2.2, layer: 97,
    text: 'POTS reference levels: -9 dBm (275 mV into 600 R), 300-3400 Hz, 48 V DC, ring above 150 V peak.' },
];

/* ------------------------------------------------------------ schematic spots */

export const SCHEM_PLACEMENT = {
  // 60 mm columns, 40 mm rows. The symbol boxes the layout checker builds are
  // about 48 x 9 mm for a two-pin part and 58 x 42 mm for the transformer, so
  // the grid is sized to the widest thing on the sheet, not the average.
  T1:   { x: 275, y: 388 },
  J1:   { x: 35, y: 348 },
  F1:   { x: 95, y: 348 },
  RV1:  { x: 155, y: 348 },
  C1:   { x: 215, y: 348 },
  R1:   { x: 275, y: 348 },
  R2:   { x: 335, y: 348 },
  K1:   { x: 395, y: 348 },
  R3:   { x: 455, y: 348 },
  R4:   { x: 35, y: 308 },
  RV2:  { x: 95, y: 308 },
  C2:   { x: 155, y: 308 },
  R13:  { x: 215, y: 308 },
  R14:  { x: 275, y: 308 },
  C3:   { x: 335, y: 308 },
  R8:   { x: 395, y: 308 },
  R9:   { x: 455, y: 308 },
  C4:   { x: 35, y: 268 },
  R10:  { x: 95, y: 268 },
  C5:   { x: 155, y: 268 },
  J2:   { x: 215, y: 268 },
  J3:   { x: 275, y: 268 },
  C6:   { x: 335, y: 268 },
  J4:   { x: 395, y: 268 },
  R11:  { x: 455, y: 268 },
  C7:   { x: 35, y: 228 },
  C8:   { x: 95, y: 228 },
  R12:  { x: 155, y: 228 },
  R15:  { x: 215, y: 228 },
  J5:   { x: 275, y: 228 },
  J6:   { x: 335, y: 228 },
  C9:   { x: 395, y: 228 },
  D1:   { x: 455, y: 228 },
  Q1:   { x: 35, y: 188 },
  R16:  { x: 95, y: 188 },
  R17:  { x: 155, y: 188 },
  LED1: { x: 215, y: 188 },
  TP1:  { x: 275, y: 188 },
  TP2:  { x: 335, y: 188 },
};

/* ------------------------------------------------------------------- metadata */

export const TITLE = 'POTS Audio Bridge';
export const MODEL_PATH = 'tools/xport-v92-audiobridge-model.mjs';
export const DESCRIPTION =
  'Bridges a telephone line to a sound card microphone input and an agent headset, '
  + 'through a 600:600 ohm wet isolation transformer and a resistive hybrid.';
export const DOC_REF = 'docs/xport-nucleo-v92-audio-bridge.md';

export const NET_CLASS = { GND: 0.5 };

export const UNCONNECTED = [
  ['T1', '2'],      // primary centre tap, not used by the 1:1 arrangement
  ['J2', 'S'],      // microphone jack sleeve: ground at the card, not wired here
  ['J3', 'R'],      // card output ring: mono, left channel only
];

export const POWER_BUDGET = [
  { rail: 'V5', supplyMA: 200, loads: [
    { ref: 'K1', what: 'Relay coil, 5 V, held off-hook for the whole call', mA: 40 },
    { ref: 'R12', what: 'Headset electret bias through R15, about 1.5 mA', mA: 2 },
    { ref: 'LED1', what: 'Off-hook indicator at about 3 mA', mA: 3 },
  ] },
];

export function POWER_BUDGET_REPORT() {
  const lines = ['## Power budget', ''];
  for (const rail of POWER_BUDGET) {
    const used = rail.loads.reduce((n, l) => n + l.mA, 0);
    lines.push(`### ${rail.rail} - ${used} mA of ${rail.supplyMA} mA`, '');
    for (const l of rail.loads)
      lines.push(`- ${l.ref ? `${l.ref}: ` : ''}${l.what} - ${l.mA} mA`);
    lines.push('');
  }
  return lines.join('\n');
}

export const BOM_INTRO =
  'The one part that is not interchangeable is T1. It has to be a "wet" '
  + '600:600 ohm telecom transformer: specified to carry the 20-50 mA of DC loop '
  + 'current without saturating. A dry voice transformer of the same impedance '
  + 'will work on the bench and go quiet or distort the moment the line goes '
  + 'off-hook. Everything else is generic through-hole stock.';

export const SAFETY_NOTES = [
  'The left of the board is line-referenced. 48 V DC sits on the pair, ring '
  + 'peaks above 150 V, and a lightning or power-cross event puts far more on '
  + 'it. Do not touch that end while it is connected.',
  'T1 is the only isolation barrier. If you replace it with anything other '
  + 'than a transformer rated for the line, the sound card and the PC chassis '
  + 'become part of the telephone circuit.',
  'This design is not a certified Direct Access Arrangement and is not '
  + 'approved for connection to a public network. Put an approved DAA in '
  + 'front of it, or keep it behind a PBX or on a bench line.',
  'Isolation resistance from the line side to any touchable metal has to hold '
  + '5 Mohm measured at 100 V DC. Measure it after assembly, not before.',
  'The 3 mm creepage between the line side and the SELV side is enforced by '
  + 'the design-rule checker and backed by a milled slot. Do not bridge the '
  + 'slot with a jumper or a solder blob.',
];

/* --------------------------------------------------------------- geometry fns */
/*
 * Re-exported from eda-core.mjs rather than copied: the emitter calls these by
 * name on the design module, and a second implementation here would drift from
 * the one the other four designs share.
 */
import {
  rotPt, padAbs, courtAbs, symbolBBox, stubDir, makePinAbsolute, STUB, rnd,
  PACKAGE_SOURCES,
} from './eda-core.mjs';

export { rotPt, padAbs, courtAbs, symbolBBox, stubDir, STUB, rnd, PACKAGE_SOURCES };
export const pinAbsolute = makePinAbsolute(SYMBOLS);
