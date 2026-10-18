/**
 * xport-v92-faxcard-model.mjs — "xPort Pro V.92 Fax Card": a card in the HP
 * Enhanced I/O (EIO) expansion-slot form factor that puts a Lantronix xPort Pro
 * device server and a V.92 56k data/fax modem inside a printer, bridged by an
 * STMicroelectronics Nucleo-64.
 *
 * The signal chain, in order
 *   1. xPort Pro      Ethernet 10/100 → serial. Its RJ45 comes out on the EIO
 *                     faceplate and carries the telnet BBS front end.
 *   2. Nucleo-64      two UARTs: USART2 to the xPort Pro, USART1 to the modem.
 *   3. V.92 modem     controller-based module, serial TTL at 3.3 V, Group 3
 *                     fax at 14.4 kbps (Class 1), integrated DAA.
 *   4. EIO edge       the printer's expansion slot: mechanical registration and
 *                     the faceplate. See the EIO section below before assuming
 *                     anything electrical about it.
 *
 * Where the numbers come from
 *   xPort Pro: Lantronix xPort Pro Integration Guide 900-557 rev K — pin roles
 *     are already fixed by the XPORTPRO symbol in tools/wallplug-model.mjs
 *     (1 GND, 2 3V3, 3 !RESET, 4 DOUT, 5 DIN, 6-8 CP1-CP3, S1/S2 chassis).
 *     ColdFire core, 8/16 MB SDRAM, Evolution OS or Linux.
 *   Nucleo-64: ST UM1724 (MB1136). The Arduino-header mapping used here is the
 *     revision-independent one, cross-checked against UM1724 rev 14 and rev 17:
 *       D0 = PA3 = USART2_RX     D1 = PA2 = USART2_TX
 *       D8 = PA9 = USART1_TX     D2 = PA10 = USART1_RX
 *       D9 = PC7, D10 = PB6, D11 = PA7
 *     Note the trap: PA2/PA3 are also the ST-LINK virtual COM port, wired by
 *     default through solder bridges SB62/SB63 with SB13/SB14 OFF. Leaving them
 *     as the VCP gives a free USB console; the xPort Pro link then shares those
 *     pins with the ST-LINK, so for a production card either fit a Nucleo with
 *     SB62/SB63 open or move the xPort Pro to USART1 and the modem to USART2.
 *     ST's CN designators for the four headers are not stable across board
 *     revisions, so the footprint names its pads by Arduino Uno R3 signal
 *     instead. Header body positions are a mechanical approximation — confirm
 *     against the board's mechanical drawing before cutting a panel.
 *   VIN on the Arduino power header is specified 7-12 V (UM1724), which is why
 *     this card takes a 12 V tap and feeds the Nucleo's own onboard regulator
 *     rather than trying to back-power its 3V3 pin.
 *   Modem: the envelope follows the Radicom V92HM4-RC class of part —
 *     controller-based, no external memory, 3.3 V VCC with 5 V tolerant I/O,
 *     serial TTL DTE, 3 kV isolation, V.92 data to 56 kbps, 14.4 kbps fax,
 *     V.253 voice, DTMF, about 1 x 1 x 0.3 in, 66-78 mA typical and 270 mW.
 *     Multi-Tech's SocketModem is the through-hole alternative and states its
 *     serial DTE channel runs to 230.4 kbps and connects straight to a UART.
 *   Fax protocol: Class 1 is TIA/EIA-578; Class 1.0 is T.31. Group 3 over
 *     V.17/V.29/V.27ter, 14.4 kbps ceiling.
 *   EIO: HP Enhanced I/O. It uses the 3.3 V signalling of the conventional PCI
 *     bus, will not accept LIO cards, and is not mechanically interchangeable
 *     with MIO. HP does not publish the connector pinout.
 *
 * Units mm, EAGLE orientation (y up). Files land in hardware/xport-v92-faxcard/.
 */

import {
  FAMILY_PACKAGES, FAMILY_SYMBOLS, FAMILY_DEVICESETS, buckBlock, powerLed, merge,
} from './eda-blocks.mjs';
import {
  rotPt, padAbs, courtAbs, symbolBBox, stubDir, makePinAbsolute, STUB, rnd,
  pick, budgetCheck, PACKAGE_SOURCES, icSymbol, ds,
} from './eda-core.mjs';

export { rotPt, padAbs, courtAbs, symbolBBox, stubDir, STUB, rnd, PACKAGE_SOURCES };

export const TITLE = 'xPort Pro V.92 Fax Card';
export const MODEL_PATH = 'tools/xport-v92-faxcard-model.mjs';
export const DESCRIPTION = 'HP EIO-slot card: Lantronix xPort Pro (telnet BBS over Ethernet) bridged by an STM32 Nucleo-64 to a V.92 56k Class 1 fax modem, RJ45 and RJ11 on the faceplate';
export const DOC_REF = 'see docs/xport-nucleo-v92-eio-fax-card.md';

/* ------------------------------------------------------------------- board */

export const BOARD = {
  name: 'xport-v92-faxcard',
  rev: 'A',
  w: 150,
  h: 100,
  layers: 2,
  thickness: 1.57,          // PCI-class card thickness, which is what EIO expects
  edgeClearance: 1.5,
  zones: {
    // No mains on this card. Everything is SELV: a 12 V tap in, 3.3 V derived.
    selv: { x1: 0, y1: 0, x2: 150, y2: 100 },
  },
  // No mains zone, so the creepage rule has nothing to measure. 1.0 mm is the
  // working clearance for 3.3 V and 12 V SELV under IPC-2221 B1 (internal/
  // external, ≤ 30 V). The DAA's 3 kV isolation is inside the modem module.
  creepageMm: 1.0,
  clearanceMm: 0.35,
  mountingHoles: [{ x: 5, y: 5 }, { x: 145, y: 5 }, { x: 5, y: 95 }, { x: 145, y: 95 }],
};

/* --------------------------------------------------------------- registries */

export const PACKAGES = pick(FAMILY_PACKAGES, [
  'R-7.62', 'C-5.08', 'CP-D10-P5', 'FB-7.62', 'LED-5MM', 'TP', 'MOUNT-M3',
  'R0603', 'C0603', 'DO41', 'LRAD12', 'TERM2-5.08', 'XPORTPRO',
  'LM2576S', 'MOUNT-M3',
]);

export const SYMBOLS = pick(FAMILY_SYMBOLS, [
  'R-EU', 'C-EU', 'CPOL-EU', 'FERRITE', 'LED', 'TP', 'BUCK-3V3', 'DIODE',
  'INDUCTOR', 'TERM-2', 'XPORTPRO',
]);

export const DEVICESETS = pick(FAMILY_DEVICESETS, [
  'R-EU', 'C-EU', 'CPOL-EU', 'FERRITE', 'LED', 'TP', 'MOUNT-M3',
  'BUCK-3V3', 'DIODE-SCH', 'TERM-2', 'R-0603', 'C-0603', 'L-RADIAL',
  'XPORT-PRO',
]);

/* ----------------------------------------------------- new packages (mm) */

const P = PACKAGES;

/**
 * Nucleo-64 as a socketed module, the way the Pi Wall Socket models a Zero 2 W.
 * 32 Arduino Uno R3 header pads in four single rows at 2.54 mm, plus the four
 * M3 holes. Header bodies sit at x = ±24.13; treat that as approximate.
 */
const NUC_R = 24.13;
const NUC_L = -24.13;
const PITCH = 2.54;
const col = (x, names, yTop) => names.map((name, i) => ({
  name, x, y: rnd(yTop - i * PITCH), drill: 1, diameter: 1.7, shape: i === 0 ? 'square' : 'round',
}));

P.NUCLEO64 = {
  name: 'NUCLEO64',
  descr: 'STM32 Nucleo-64 socketed on four 2.54 mm single rows (Arduino Uno R3 signals) + 4 x M3',
  courtyard: { x1: -35, y1: -35, x2: 35, y2: 35 },
  pads: [
    // power header, top to bottom
    ...col(NUC_R, ['IOREF', 'NRST', '3V3', '5V', 'GND1', 'GND2', 'VIN', 'NCP'], 22.86),
    // analogue header
    ...col(NUC_R, ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'], 0),
    // digital high (D7..D0 then the two Arduino NC positions)
    ...col(NUC_L, ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0', 'NCD1', 'NCD2'], 22.86),
    // digital low
    ...col(NUC_L, ['D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'GNDL', 'AREF'], -5.08),
  ],
  holes: [
    { x: -31.75, y: 31.75, drill: 3.2 }, { x: 31.75, y: 31.75, drill: 3.2 },
    { x: -31.75, y: -31.75, drill: 3.2 }, { x: 31.75, y: -31.75, drill: 3.2 },
  ],
};

/**
 * V.92 data/fax modem module: 25.4 mm square, two rows of 7 through-hole pads.
 * Host side on -X, line side on +X so the DAA faces the RJ11.
 */
P.V92MOD = {
  name: 'V92MOD',
  descr: 'V.92/56k controller-based data+fax modem module, 25.4 mm sq, serial TTL 3.3 V, DAA on board',
  courtyard: { x1: -12.7, y1: -12.7, x2: 12.7, y2: 12.7 },
  pads: [
    ...col(-10.16, ['VCC', 'GND', 'TXD', 'RXD', '!RTS', '!CTS', '!DTR'], 7.62),
    ...col(10.16, ['!DCD', '!RI', '!DSR', 'TIP', 'RING', 'NC1', 'NC2'], 7.62),
  ],
};

/** 6P4C (RJ11/RJ14) jack, staggered contacts so 1.02 mm pitch is drillable. */
P['RJ11-6P4C'] = {
  name: 'RJ11-6P4C',
  descr: '6P4C modular jack, staggered 2 x 3 contacts, nose over the board edge',
  courtyard: { x1: -8, y1: -2, x2: 8, y2: 2 },
  pads: [
    { name: '1', x: -2.04, y: 0, drill: 0.8, diameter: 1.4 },
    { name: '3', x: 0, y: 0, drill: 0.8, diameter: 1.4 },
    { name: '5', x: 2.04, y: 0, drill: 0.8, diameter: 1.4 },
    { name: '2', x: -2.04, y: -2.54, drill: 0.8, diameter: 1.4 },
    { name: '4', x: 0, y: -2.54, drill: 0.8, diameter: 1.4 },
    { name: '6', x: 2.04, y: -2.54, drill: 0.8, diameter: 1.4 },
    { name: 'S1', x: -6.35, y: -5.08, drill: 1.6, diameter: 2.6 },
    { name: 'S2', x: 6.35, y: -5.08, drill: 1.6, diameter: 2.6 },
  ],
};

/**
 * The EIO edge, as a mechanical keep-out only. EIO uses conventional-PCI 3.3 V
 * signalling, and an STM32 cannot enumerate as a PCI target, so this revision
 * claims nothing electrical from the slot: no finger is assigned a net until
 * the pinout is traced from a donor JetDirect card. The package deliberately
 * has no pads — see the EIO notes.
 */
P['EIO-EDGE'] = {
  name: 'EIO-EDGE',
  descr: 'HP EIO / conventional-PCI 3.3 V card edge, mechanical keep-out, pinout TBD',
  courtyard: { x1: -34, y1: -4, x2: 34, y2: 8 },
  pads: [],
};

/* ------------------------------------------------------------ new symbols */

const S = SYMBOLS;

S.NUCLEO64 = icSymbol('NUCLEO64', {
  w: 33.02,
  left: ['5V', 'VIN', '3V3', 'IOREF', 'NRST', 'GND1', 'GND2', 'GNDL', 'AREF', 'NCP'],
  right: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'NCD1', 'NCD2'],
  bottom: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
  texts: [
    { x: -12, y: 2, size: 1.778, layer: 94, ratio: 10, text: 'Nucleo-64' },
    { x: -12, y: -0.6, size: 1.4, layer: 94, ratio: 10, text: 'D0/D1 = USART2, D8/D2 = USART1' },
  ],
});

S.V92MOD = icSymbol('V92MOD', {
  w: 27.94,
  left: ['VCC', 'GND', 'TXD', 'RXD', '!RTS', '!CTS', '!DTR'],
  right: ['!DCD', '!RI', '!DSR', 'TIP', 'RING', 'NC1', 'NC2'],
  texts: [
    { x: -10, y: 2, size: 1.778, layer: 94, ratio: 10, text: 'V.92 56k' },
    { x: -10, y: -0.6, size: 1.4, layer: 94, ratio: 10, text: 'Class 1 fax 14.4k' },
  ],
});

S['RJ11-6P4C'] = icSymbol('RJ11-6P4C', {
  w: 17.78,
  left: ['1', '2', '3'],
  right: ['4', '5', '6'],
  bottom: ['S1', 'S2'],
  minH: 10.16,
});

S['EIO-EDGE'] = icSymbol('EIO-EDGE', { w: 20.32, minH: 7.62 });

/* -------------------------------------------------------- new devicesets */

const ident = (names) => Object.fromEntries(names.map((n) => [n, n]));

DEVICESETS['NUCLEO-64'] = ds('J', 'NUCLEO64', 'NUCLEO64', ident([
  'IOREF', 'NRST', '3V3', '5V', 'GND1', 'GND2', 'VIN', 'NCP',
  'A0', 'A1', 'A2', 'A3', 'A4', 'A5',
  'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7',
  'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'GNDL', 'AREF', 'NCD1', 'NCD2',
]));

DEVICESETS['V92-MODEM'] = ds('U', 'V92MOD', 'V92MOD', ident([
  'VCC', 'GND', 'TXD', 'RXD', '!RTS', '!CTS', '!DTR',
  '!DCD', '!RI', '!DSR', 'TIP', 'RING', 'NC1', 'NC2',
]));

DEVICESETS['RJ11-6P4C'] = ds('J', 'RJ11-6P4C', 'RJ11-6P4C', ident([
  '1', '2', '3', '4', '5', '6', 'S1', 'S2',
]));

DEVICESETS['EIO-EDGE'] = ds('J', 'EIO-EDGE', 'EIO-EDGE', {});

/* ------------------------------------------------------------------ parts */

const blocks = merge(
  buckBlock({ cin: '470uF/25V', inRail: '12V' }),
  powerLed({ r: 'R1', led: 'LED1' }, 'PWR green'),
);

const EXTRA_PARTS = [
  // ---- 12 V in, and the ferrite that keeps the modem's DAA noise off it ----
  { ref: 'J1', set: 'TERM-2', value: '12V IN', zone: 'selv', note: '12 V DC tap, 5.08 mm. VIN on the Nucleo power header is specified 7-12 V (UM1724), so 12 V feeds the Nucleo through its own regulator and is also the buck input.' },
  { ref: 'FB1', set: 'FERRITE', value: '600R@100MHz', zone: 'selv', note: 'ferrite on the 12 V entry' },

  // ---- the Nucleo-64, socketed so it can be reflashed off the card ----------
  {
    ref: 'J2', set: 'NUCLEO-64', value: 'Nucleo-64', zone: 'selv',
    note: 'STM32 Nucleo-64 (MB1136 class). USART2 on D1/D0 = PA2/PA3 to the xPort Pro, USART1 on D8/D2 = PA9/PA10 to the modem, PC7/PB6/PA7 on D9/D10/D11 for DCD/DTR/RI. Powered from 12 V on VIN. PA2/PA3 are also the ST-LINK VCP by default (SB62/SB63 ON, SB13/SB14 OFF): leave it wired for a USB console, or open SB62/SB63 on a production card so the xPort Pro owns the port.',
  },
  { ref: 'C5', set: 'C-0603', value: '100nF', zone: 'selv', note: '3.3 V decoupling at the Nucleo header' },

  // ---- the xPort Pro ------------------------------------------------------
  {
    ref: 'X1', set: 'XPORT-PRO', value: 'XPP100300S-04R', zone: 'selv', edge: 'bottom',
    note: 'Lantronix xPort Pro: ColdFire, 16 MB flash, 8/16 MB SDRAM, Evolution OS or Linux, RJ45 10/100 on the faceplate carrying the telnet BBS. Serial channel is 3.3 V TTL, so DIN/DOUT go straight to the STM32 with no level shifter.',
  },
  { ref: 'R2', set: 'R-EU', value: '10k', zone: 'selv', note: 'xPort Pro !RESET pull-up' },
  { ref: 'C6', set: 'C-0603', value: '100nF', zone: 'selv', note: 'xPort Pro 3.3 V decoupling' },
  { ref: 'R7', set: 'R-EU', value: '100R', zone: 'selv', note: 'xPort DOUT → Nucleo D0 series resistor' },
  { ref: 'R8', set: 'R-EU', value: '100R', zone: 'selv', note: 'Nucleo D1 → xPort DIN series resistor' },

  // ---- the V.92 modem -----------------------------------------------------
  {
    ref: 'U3', set: 'V92-MODEM', value: 'V92HM4-RC', zone: 'selv',
    note: 'Controller-based V.92/56k data+fax module: 3.3 V, 5 V tolerant serial TTL, 3 kV isolation, integrated DAA, V.92 data to 56 kbps, Group 3 fax to 14.4 kbps Class 1, V.253 voice, DTMF. About 66-78 mA typical, 270 mW. Keep the DAA half (package +X) away from the buck inductor.',
  },
  { ref: 'R3', set: 'R-EU', value: '100R', zone: 'selv', note: 'modem TXD → Nucleo D2 series resistor' },
  { ref: 'R4', set: 'R-EU', value: '100R', zone: 'selv', note: 'Nucleo D8 → modem RXD series resistor' },
  { ref: 'C7', set: 'C-0603', value: '100nF', zone: 'selv', note: 'modem 3.3 V decoupling' },
  { ref: 'R6', set: 'R-EU', value: '1k0', zone: 'selv', note: 'LED2 current limit; LED2 is driven by !DSR, so it lights while the modem holds the line' },
  { ref: 'LED2', set: 'LED', value: 'FAX amber', zone: 'selv', note: 'lit while !DSR is asserted' },
  { ref: 'J3', set: 'RJ11-6P4C', value: 'LINE', zone: 'selv', edge: 'bottom', note: '6P4C to the PSTN. Contacts 3/4 are the centre pair (tip/ring); 6P4C also lands 2 and 5, which are the second pair and stay open here.' },

  // ---- the slot -----------------------------------------------------------
  {
    ref: 'J5', set: 'EIO-EDGE', value: 'EIO', zone: 'selv', edge: 'bottom', boardOnly: true,
    note: 'HP EIO card edge, mechanical keep-out only. EIO uses conventional-PCI 3.3 V signalling and an STM32 cannot enumerate as a PCI target, so this revision takes nothing electrical from the slot. HP does not publish the pinout; trace a donor JetDirect card before assigning any finger.',
  },

  // ---- test points and hardware -------------------------------------------
  { ref: 'TP5', set: 'TP', value: 'MD TXD', zone: 'selv', note: '' },
  { ref: 'TP6', set: 'TP', value: 'MD RXD', zone: 'selv', note: '' },
  { ref: 'H1', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 card mounting hole' },
  { ref: 'H2', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 card mounting hole' },
  { ref: 'H3', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 card mounting hole' },
  { ref: 'H4', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 card mounting hole' },
];

export const PARTS = [...blocks.parts, ...EXTRA_PARTS];

/* ----------------------------------------------------------------- netlist */

const BLOCK_NETS = blocks.nets;

export const NETS = {
  ...BLOCK_NETS,

  // 12 V in, through the ferrite, then split to the buck and the Nucleo's VIN
  '12V_IN': [['J1', '1'], ['FB1', '1']],
  '12V': [...BLOCK_NETS['12V'], ['FB1', '2'], ['J2', 'VIN']],

  // ---- xPort Pro ↔ Nucleo USART2 (D1 = PA2 TX, D0 = PA3 RX) ----
  XP_DOUT: [['X1', 'DOUT'], ['R7', '1']],
  XP_RX: [['R7', '2'], ['J2', 'D0']],
  XP_DIN: [['X1', 'DIN'], ['R8', '1']],
  XP_TX: [['R8', '2'], ['J2', 'D1']],
  XP_RST: [['X1', '!RESET'], ['R2', '2']],

  // ---- modem ↔ Nucleo USART1 (D8 = PA9 TX, D2 = PA10 RX) ----
  MD_TXD: [['U3', 'TXD'], ['R3', '1'], ['TP5', '1']],
  MD_RX: [['R3', '2'], ['J2', 'D2']],
  MD_RXD: [['U3', 'RXD'], ['R4', '1'], ['TP6', '1']],
  MD_TX: [['R4', '2'], ['J2', 'D8']],
  MD_DCD: [['U3', '!DCD'], ['J2', 'D9']],
  MD_DTR: [['J2', 'D10'], ['U3', '!DTR']],
  MD_RI: [['U3', '!RI'], ['J2', 'D11']],
  MD_DSR: [['U3', '!DSR'], ['LED2', 'K']],
  LED2_A: [['R6', '2'], ['LED2', 'A']],

  // ---- PSTN ----
  LINE_TIP: [['U3', 'TIP'], ['J3', '3']],
  LINE_RING: [['U3', 'RING'], ['J3', '4']],

  // xPort Pro chassis tabs go to the printer frame, not to signal ground
  CHASSIS: [['X1', 'S1'], ['X1', 'S2']],

  '3V3': [
    ...BLOCK_NETS['3V3'],
    ['R1', '1'], ['C5', '1'], ['X1', '3V3'], ['C6', '1'], ['R2', '1'],
    ['U3', 'VCC'], ['C7', '1'], ['R6', '1'],
  ],
  GND: [
    ...BLOCK_NETS.GND,
    ['J1', '2'], ['J2', 'GND1'], ['J2', 'GND2'], ['J2', 'GNDL'], ['C5', '2'],
    ['X1', 'GND'], ['C6', '2'],
    ['U3', 'GND'], ['C7', '2'],
    ['J3', 'S1'], ['J3', 'S2'],
  ],
};

/** Pins deliberately open, with the reason. */
export const UNCONNECTED = [
  ['U1', 'FB'],          // LM2576S-3.3 bonds feedback inside the package
  // Nucleo-64 header positions this card does not use
  ['J2', 'IOREF'], ['J2', 'NRST'], ['J2', '3V3'], ['J2', '5V'], ['J2', 'NCP'],
  ['J2', 'A0'], ['J2', 'A1'], ['J2', 'A2'], ['J2', 'A3'], ['J2', 'A4'], ['J2', 'A5'],
  ['J2', 'D3'], ['J2', 'D4'], ['J2', 'D5'], ['J2', 'D6'], ['J2', 'D7'],
  ['J2', 'D12'], ['J2', 'D13'], ['J2', 'AREF'], ['J2', 'NCD1'], ['J2', 'NCD2'],
  // xPort Pro channel pins: unused until the second serial channel is needed
  ['X1', 'CP1'], ['X1', 'CP2'], ['X1', 'CP3'],
  // no hardware flow control at 115200 8N1 with an interrupt-driven RX
  ['U3', '!RTS'], ['U3', '!CTS'], ['U3', 'NC1'], ['U3', 'NC2'],
  // 6P4C centre pair in use; 2/5 are the second pair, 1/6 are absent in RJ11
  ['J3', '1'], ['J3', '2'], ['J3', '5'], ['J3', '6'],
];

/** Net → EAGLE class: 2 = power rail, 0 = signal. No mains class on this card. */
export const NET_CLASS = {
  '12V_IN': 2, '12V': 2, '3V3': 2, SW_3V3: 2, GND: 2, CHASSIS: 2,
};

/* ------------------------------------------------------ power budget (mA) */

/**
 * Datasheet maxima, not typical values, so the budget is a worst case.
 */
export const POWER_BUDGET = [
  {
    rail: '12V', supplyMA: 500,   // whatever internal tap is used; sized for 6 W
    loads: [
      // 3.3 V x 0.43 A = 1.42 W out; the LM2576 is ~77 % efficient here, so the
      // 12 V side sees about 1.84 W = 154 mA.
      { what: 'U1 buck input: 3.3 V x 0.43 A / 0.77 efficiency / 12 V', mA: 154 },
      { ref: 'J2', what: 'Nucleo-64 via VIN: MCU plus the ST-LINK section, ~250 mA at 5 V referred to 12 V through the onboard regulator', mA: 250 },
    ],
  },
  {
    rail: '3V3', supplyMA: 3000,  // LM2576S-3.3, 3 A
    loads: [
      { ref: 'X1', what: 'xPort Pro, allow 300 mA worst case including Ethernet TX', mA: 300 },
      { ref: 'U3', what: 'V.92 modem module, 270 mW at 3.3 V plus DAA peak', mA: 100 },
      { what: 'LED1, LED2 and the pull-ups', mA: 30 },
    ],
  },
];
export const POWER_BUDGET_REPORT = budgetCheck(POWER_BUDGET);

/* --------------------------------------------------- board placements (mm) */

export const PLACEMENT = {
  // ---- 12 V entry and the 3.3 V step-down, along the top edge ----
  J1: { x: 12, y: 90, rot: 'R0' },
  FB1: { x: 24, y: 90, rot: 'R0' },
  U1: { x: 42, y: 88, rot: 'R0' },
  L1: { x: 60, y: 88, rot: 'R0' },
  D1: { x: 42, y: 76, rot: 'R0' },
  C2: { x: 26, y: 76, rot: 'R0' },
  C3: { x: 60, y: 76, rot: 'R0' },
  C4: { x: 70, y: 76, rot: 'R0' },
  TP4: { x: 72, y: 84, rot: 'R0' },
  R1: { x: 40, y: 66, rot: 'R0' },
  LED1: { x: 48, y: 66, rot: 'R0' },

  // ---- the Nucleo-64, right half of the card ----
  J2: { x: 110, y: 55, rot: 'R0' },
  C5: { x: 70, y: 66, rot: 'R0' },

  // ---- the modem, left of centre, DAA (+X) facing the RJ11 ----
  U3: { x: 22, y: 40, rot: 'R0' },
  R3: { x: 40, y: 44, rot: 'R0' },
  R4: { x: 40, y: 38, rot: 'R0' },
  C7: { x: 40, y: 32, rot: 'R0' },
  R6: { x: 40, y: 26, rot: 'R0' },
  LED2: { x: 48, y: 26, rot: 'R0' },
  TP5: { x: 56, y: 44, rot: 'R0' },
  TP6: { x: 56, y: 38, rot: 'R0' },

  // ---- faceplate: RJ11 then the xPort Pro's RJ45 ----
  J3: { x: 18, y: 8, rot: 'R0' },
  X1: { x: 52, y: 10, rot: 'R0' },
  R2: { x: 70, y: 24, rot: 'R0' },
  C6: { x: 70, y: 12, rot: 'R0' },
  R7: { x: 70, y: 32, rot: 'R0' },
  R8: { x: 70, y: 40, rot: 'R0' },

  // ---- the slot, and the card's own mounting holes ----
  J5: { x: 105, y: 4, rot: 'R0' },
  H1: { x: 5, y: 5, rot: 'R0' },
  H2: { x: 145, y: 5, rot: 'R0' },
  H3: { x: 5, y: 95, rot: 'R0' },
  H4: { x: 145, y: 95, rot: 'R0' },
};

/* --------------------------------------------------------- schematic sheet */

export const SHEET = { w: 520, h: 520, columns: 13, rows: 13 };

export const SCHEM_PLACEMENT = {
  // A: 12 V in and its conditioning
  J1: { x: 40, y: 490 }, FB1: { x: 110, y: 490 }, TP4: { x: 180, y: 490 },
  // B: the 3.3 V step-down
  U1: { x: 50, y: 420 }, L1: { x: 130, y: 420 }, D1: { x: 200, y: 420 },
  C2: { x: 265, y: 420 }, C3: { x: 325, y: 420 }, C4: { x: 385, y: 420 },
  R1: { x: 440, y: 420 }, LED1: { x: 490, y: 420 },
  // C: the Nucleo-64 — the tallest symbol on the sheet
  J2: { x: 80, y: 300 }, C5: { x: 220, y: 300 },
  // D: the xPort Pro and its series resistors
  X1: { x: 330, y: 300 }, R2: { x: 440, y: 320 }, C6: { x: 490, y: 320 },
  R7: { x: 440, y: 280 }, R8: { x: 490, y: 280 },
  // E: the V.92 modem
  U3: { x: 80, y: 150 }, R3: { x: 200, y: 170 }, R4: { x: 200, y: 130 },
  C7: { x: 260, y: 170 }, R6: { x: 260, y: 130 }, LED2: { x: 320, y: 130 },
  TP5: { x: 320, y: 170 }, TP6: { x: 375, y: 170 },
  // F: the line connector
  J3: { x: 460, y: 150 },
  // G: the slot keep-out and the mounting holes
  J5: { x: 60, y: 40 }, H1: { x: 160, y: 40 }, H2: { x: 230, y: 40 },
  H3: { x: 300, y: 40 }, H4: { x: 370, y: 40 },
};

export const SCHEM_NOTES = [
  { x: 20, y: 512, size: 3.4, layer: 97, text: 'xPort Pro V.92 Fax Card — HP EIO slot form factor: telnet BBS on the xPort Pro RJ45, Group 3 fax on the RJ11' },
  { x: 20, y: 504, size: 2.2, layer: 97, text: 'POWER (row A/B): J1 12 V → FB1 → U1 (LM2576S-3.3) → L1 → 3V3. The same 12 V feeds J2 VIN, which UM1724 specifies as 7-12 V, so the Nucleo makes its own MCU rail.' },
  { x: 20, y: 499, size: 2.2, layer: 97, text: 'L1 is the block default 100 uH. The LM2576 nomogram wants more inductance at 12 V in than at 5 V in — re-read the L-vs-VIN chart and refit before building.' },
  { x: 20, y: 494, size: 2.2, layer: 97, text: 'The header 3V3 pin on J2 is left open on purpose: back-powering it while VIN is live would fight the Nucleo onboard regulator.' },
  { x: 20, y: 372, size: 2.2, layer: 97, text: 'USART2 to the xPort Pro: D1 = PA2 = TX → X1 DIN, D0 = PA3 = RX ← X1 DOUT. USART1 to the modem: D8 = PA9 = TX → U3 RXD, D2 = PA10 = RX ← U3 TXD.' },
  { x: 20, y: 367, size: 2.2, layer: 97, text: 'TRAP: PA2/PA3 are also the ST-LINK virtual COM port (MB1136 SB62/SB63 ON, SB13/SB14 OFF). Leave it wired for a free USB console, or open SB62/SB63 so the xPort Pro owns the port.' },
  { x: 20, y: 362, size: 2.2, layer: 97, text: 'Both links are 3.3 V TTL. The xPort Pro serial channel and the modem module are 3.3 V parts, so there is no level shifter; the 100 R resistors are hot-plug and fault limiting, not translation.' },
  { x: 20, y: 224, size: 2.2, layer: 97, text: 'U3 is a controller-based V.92/56k module: 3.3 V, 5 V tolerant serial TTL, DAA and 3 kV isolation on the module, V.92 data to 56 kbps, Group 3 fax to 14.4 kbps Class 1 (TIA/EIA-578; Class 1.0 is T.31).' },
  { x: 20, y: 219, size: 2.2, layer: 97, text: 'No hardware flow control. 115200 8N1 against a 14.4 kbps fax channel leaves 8x headroom for an interrupt-driven RX; add RTS/CTS if the firmware ever polls.' },
  { x: 20, y: 214, size: 2.2, layer: 97, text: 'TIP and RING run only between U3 and J3. The isolation is inside the module; a test point on that pair would defeat it.' },
  { x: 20, y: 96, size: 2.2, layer: 97, text: 'EIO (J5) is a mechanical keep-out. EIO uses conventional-PCI 3.3 V signalling, an STM32 cannot enumerate as a PCI target, and HP does not publish the pinout. This revision takes power from J1, not from the slot.' },
];

export const BOARD_NOTES = [
  { x: 2, y: 98, size: 1.8, layer: 21, text: 'xPort Pro V.92 Fax Card rev A — 150 x 100 mm, 2 layers, 1.57 mm FR-4 (PCI-class card thickness)' },
  { x: 2, y: 95.5, size: 1.2, layer: 21, text: 'SELV only: 12 V in at J1, 3.3 V derived. No mains on this card.' },
  { x: 2, y: 20, size: 1.2, layer: 21, text: 'J3 (RJ11) and X1 (xPort Pro RJ45) overhang the bottom edge — that is the EIO faceplate end' },
  { x: 66, y: 98, size: 1.4, layer: 21, text: 'PSTN — isolation is inside U3; keep TIP/RING off every pad except U3 and J3' },
  { x: 33, y: 24, size: 1.2, layer: 21, text: 'U3 DAA end (+X) — no copper, no test point, keep L1 away' },
  { x: 71, y: 12, size: 1.2, layer: 21, text: 'J5 EIO keep-out 68 x 12 mm: no copper until the slot pinout is traced from a donor JetDirect card' },
];

/** No mains on this card, so there is no barrier to keep. Degenerate, off-board. */
export const BARRIER = { x1: -20, y1: 0, x2: -20, y2: 0 };

export const BOARD_LINES = [
  // the EIO faceplate strip along the slot end
  { x1: 0, y1: 14, x2: 150, y2: 14, layer: 21, width: 0.4, style: 'shortdash' },
  // the EIO keep-out box
  { x1: 71, y1: 0, x2: 139, y2: 8, layer: 41, width: 0.2 },
  { x1: 71, y1: 8, x2: 139, y2: 8, layer: 41, width: 0.2 },
  // the DAA keep-out around the modem's line side
  { x1: 32, y1: 26, x2: 32, y2: 54, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 40, y1: 26, x2: 40, y2: 54, layer: 21, width: 0.2, style: 'shortdash' },
];

export const POUR = { x1: 1.5, y1: 1.5, x2: 148.5, y2: 98.5 };

export const pinAbsolute = makePinAbsolute(SYMBOLS);

export const BOM_INTRO = `The Nucleo-64 is a separate purchase and plugs into J2 on four 2.54 mm single
rows. Its 12 V comes from J1, not from the EIO slot, and its own onboard
regulator makes the MCU rail.

The modem is the critical long-lead item. The pinout here follows the Radicom
V92HM4-RC class of part: controller-based, 3.3 V, serial TTL, DAA and 3 kV
isolation on the module, Group 3 fax to 14.4 kbps. Multi-Tech's SocketModem is
the through-hole alternative and is specified to connect straight to a UART at
up to 230.4 kbps. Confirm the pin order against whichever module is actually
bought before the board is released - module pinouts are not standardised.

The xPort Pro is the part that is known-good here: its pin roles are already
fixed by the verified XPORTPRO symbol shared with the xPort Wallplug design.
`;

export const SAFETY_NOTES = [
  'No mains on this card. Everything is SELV: 12 V in, 3.3 V derived, PSTN on the RJ11.',
  'The PSTN is not SELV. The modem module provides the isolation (3 kV class); do not bypass it, do not route TIP or RING anywhere except between U3 and J3, and do not break that path with a test point.',
  'The 12 V tap must be fused at the source. This card has a ferrite on the entry, not a fuse, because the tap it comes from is expected to be already protected.',
  'Connecting a telephone line to equipment is regulated in most countries. A modem that is not approved for the local PSTN cannot lawfully be connected to it, whatever this board does.',
  'The EIO slot pinout is unpublished. Do not energise any EIO finger on the strength of a guess, and do not assume a JetDirect card pinout carries over to another EIO accessory.',
];
