/**
 * pi-socket-model.mjs — "Pi Wall Socket": a Raspberry Pi Zero 2 W carrier meant
 * to live in a wall-socket enclosure. It takes L/N/PE from the socket's own
 * terminals, makes isolated 12 V, then 5 V for the Pi and 3.3 V for everything
 * else, and gives the Pi two network paths it does not have on its own:
 * wired Ethernet (WIZnet WIZ850io on SPI0) and Ethernet-over-powerline
 * (chargebyte PLC Stamp mini 2 on SPI1).
 *
 * Why a Pi Zero 2 W and not a Pi 4
 *   The Zero 2 W is 65 x 30 mm with four M2.5 holes on 58 x 23 mm centres, so it
 *   fits behind a socket faceplate; it has no Ethernet, which is exactly the gap
 *   this carrier fills. A Compute Module 4 is the industrial alternative — it has
 *   an Ethernet PHY on the module (pins 3-12 are Ethernet_Pair0..3 P/N) and takes
 *   5 V on six pins, but it needs two 100-way 0.4 mm mezzanine connectors; see
 *   docs/wimax-pi-powerline-variants-2026-10-08.md for the trade.
 *
 * Where the numbers come from
 *   Raspberry Pi Zero 2 W: RP3A0 (BCM2710A1), quad Cortex-A53 @ 1 GHz, 512 MB
 *     LPDDR2, 2.4 GHz 802.11b/g/n, BT 4.2 + BLE, no Ethernet, 40-pin GPIO
 *     (unpopulated), mini-HDMI, micro-USB OTG + micro-USB power, 65 x 30 x 5 mm,
 *     four M2.5 mounting holes, ≈3 W max (0.6 A at 5 V).
 *   Raspberry Pi 40-pin GPIO map: pins 1/17 = 3.3 V (≈50 mA available), 2/4 = 5 V,
 *     SPI0 = 19 MOSI (GPIO10), 21 MISO (GPIO9), 23 SCLK (GPIO11), 24 CE0 (GPIO8),
 *     26 CE1 (GPIO7); SPI1 = 35 MISO (GPIO19), 36 CE (GPIO16), 38 MOSI (GPIO20),
 *     40 SCLK (GPIO21); UART0 = 8 TXD (GPIO14), 10 RXD (GPIO15); 27/28 = ID_SD/ID_SC.
 *     Cross-checked against the PI40HAT and OX40HAT symbols in the PIONIX EVerest
 *     reference hardware library, which list the same 40 names (plus RUN/GLOBAL_EN
 *     on the CM4 side).
 *   Package geometry: tylercrumpton/CrumpPrints.pretty Raspberry_Pi_Zero — the
 *     header pads and the four Ø2.75 holes in their real relative positions.
 *   PLC Stamp mini 2 datasheet rev 13: see tools/plc-bridge-model.mjs for the full
 *     citation list. The two figures that shape this board are §8.3 (8 mm
 *     creepage / 6.5 mm clearance between L/N and everything else, 4000 Vac) and
 *     §8.2 (IDD 150 mA average / 300 mA max).
 *   WIZnet WIZ850io datasheet v1.0: pinout, 2.97-3.63 V, 141 mA typ, 13 mA in
 *     power-down, 23 x 25.75 x 18 mm, RSTn must be held low ≥ 500 µs.
 *   MEAN WELL MPM-20-12 and IRM-05-5 pin roles from the PIONIX EVerest symbol and
 *     the DehneEVSE footprint respectively.
 *
 * Units mm, EAGLE orientation (y up). Files land in hardware/pi-wall-socket/.
 */

import {
  FAMILY_PACKAGES, FAMILY_SYMBOLS, FAMILY_DEVICESETS, mainsBlock, buckBlock,
  powerLed, merge, PI40_NAMES,
} from './eda-blocks.mjs';
import {
  rotPt, padAbs, courtAbs, symbolBBox, stubDir, makePinAbsolute, STUB, rnd,
  pick, budgetCheck, PACKAGE_SOURCES,
} from './eda-core.mjs';

export { rotPt, padAbs, courtAbs, symbolBBox, stubDir, STUB, rnd, PACKAGE_SOURCES };

export const TITLE = 'Pi Wall Socket';
export const MODEL_PATH = 'tools/pi-socket-model.mjs';
export const DESCRIPTION = 'mains-powered Raspberry Pi Zero 2 W carrier for a wall-socket enclosure, with wired Ethernet (WIZ850io, SPI0) and Ethernet-over-powerline (PLC Stamp mini 2, SPI1)';
export const DOC_REF = 'see docs/wimax-pi-powerline-variants-2026-10-08.md';

/* ------------------------------------------------------------------- board */

export const BOARD = {
  name: 'pi-wall-socket',
  rev: 'A',
  w: 180,
  h: 120,
  layers: 2,
  thickness: 1.6,
  edgeClearance: 1.5,
  zones: {
    mains: { x1: 0, y1: 40, x2: 70, y2: 120 },
    selv: { x1: 60, y1: 0, x2: 180, y2: 120 },
  },
  // The PLC module's datasheet figure governs: 8 mm creepage / 6.5 mm clearance
  // between its L/N pads and every other connection, 4000 Vac isolation test.
  creepageMm: 8.0,
  clearanceMm: 6.5,
  mountingHoles: [{ x: 4, y: 4 }, { x: 176, y: 4 }, { x: 4, y: 116 }, { x: 176, y: 116 }],
};

/* --------------------------------------------------------------- registries */

export const PACKAGES = pick(FAMILY_PACKAGES, [
  'R-7.62', 'C-5.08', 'CP-D10-P5', 'CP-D6.3-P2.5', 'FB-7.62', 'FUSE-RADIAL',
  'MOV07', 'LED-5MM', 'SW-TACT-6MM', 'TP', 'MOUNT-M3', 'HDR-2X5',
  'CUI_TB003', 'MPM2012', 'LM2576S', 'LRAD12', 'DO41', 'R0603', 'C0603',
  'PIZERO', 'PLCSTAMP', 'WIZ850IO',
]);

export const SYMBOLS = pick(FAMILY_SYMBOLS, [
  'R-EU', 'C-EU', 'CPOL-EU', 'FERRITE', 'FUSE', 'MOV', 'LED',
  'SW-PUSH', 'TP', 'HDR-2X5', 'ACDC-4', 'BUCK-3V3', 'DIODE', 'INDUCTOR',
  'TERM-3', 'PI40', 'PLCSTAMP', 'WIZ850IO',
]);

export const DEVICESETS = pick(FAMILY_DEVICESETS, [
  'R-EU', 'C-EU', 'CPOL-EU', 'CPOL-SMALL', 'FERRITE', 'FUSE', 'MOV', 'LED',
  'SW-PUSH', 'TP', 'MOUNT-M3', 'HDR-2X5', 'ACDC-12V', 'BUCK-3V3', 'BUCK-5V',
  'DIODE-SCH', 'L-RADIAL', 'TERM-3', 'R-0603', 'C-0603',
  'PLC-STAMP-MINI-2', 'WIZ850IO',
]);

/**
 * The Pi is socketed on the Zero's own footprint: 40 header pads plus the four
 * M2.5 holes, in the real relative positions, so the module bolts down onto this
 * board with 2.54 mm female headers.
 */
DEVICESETS['PI-ZERO-SOCKET'] = {
  prefix: 'J', symbol: 'PI40', package: 'PIZERO',
  connects: Object.fromEntries(
    Object.entries(PI40_NAMES).map(([pad, name]) => [name, pad]),
  ),
};

/* -------------------------------------------------------------------- parts */

const blocks = merge(
  mainsBlock({ ps: 'ACDC-12V', psValue: 'MPM-20-12', rail: '12V', fuse: 'T1A/250V' }),
  buckBlock({
    inRail: '12V', out: '5V', value: 'LM2576S-5.0', cin: '470uF/25V',
    refs: { u: 'U1', l: 'L1', d: 'D1', cin: 'C2', cout: 'C3', ccer: 'C4', tp: 'TP4' },
  }),
  buckBlock({
    inRail: '12V', out: '3V3', cin: '470uF/25V',
    refs: { u: 'U2', l: 'L2', d: 'D2', cin: 'C5', cout: 'C6', ccer: 'C7', tp: 'TP5' },
  }),
  powerLed({ r: 'R1', led: 'LED1' }, 'PWR green'),
);

const EXTRA_PARTS = [
  // ---- the Pi itself -------------------------------------------------------
  {
    ref: 'J2', set: 'PI-ZERO-SOCKET', value: 'Pi Zero 2 W', zone: 'selv',
    note: '2x20 female header on the Raspberry Pi Zero footprint + four M2.5 holes at 58 x 23 mm. Power in on pins 2/4 (5 V); pins 1/17 (the Pi\'s own 3.3 V output, ≈50 mA) are left open rather than paralleled with U2.',
  },

  // ---- powerline modem -----------------------------------------------------
  {
    ref: 'U3', set: 'PLC-STAMP-MINI-2', value: 'I2PLCBMN-ISC-004-T', zone: 'selv',
    padZones: { 15: 'mains', 16: 'mains', 17: 'mains' },
    note: 'chargebyte PLC Stamp mini 2 (QCA7005, HomePlug Green PHY, SPI slave, transformer 1:4:5 + zero-cross on the module). Pads 15/16/17 are the mains coupling and keep 8 mm from every other pad (datasheet §8.3).',
  },
  { ref: 'R3', set: 'R-EU', value: '3k3', zone: 'selv', note: 'GPIO_0 LED bootstrap, 3.3 kΩ (datasheet figure 3); GPIO_0 = PLC connection established' },
  { ref: 'LED2', set: 'LED', value: 'PLC link', zone: 'selv', note: 'Green PHY network joined' },
  { ref: 'R4', set: 'R-EU', value: '3k3', zone: 'selv', note: 'GPIO_1 LED bootstrap; GPIO_1 = Simple Connect, blinks at 1 Hz while pairing' },
  { ref: 'LED3', set: 'LED', value: 'PAIR amber', zone: 'selv', note: 'Simple Connect indicator' },
  { ref: 'R5', set: 'R-EU', value: '10k', zone: 'selv', note: 'GPIO_3 pull-up (datasheet figure 4)' },
  { ref: 'R6', set: 'R-EU', value: '100R', zone: 'selv', note: 'GPIO_3 series resistor (datasheet figure 4)' },
  { ref: 'C8', set: 'C-EU', value: '100pF', zone: 'selv', note: 'GPIO_3 switch debounce (datasheet figure 4)' },
  { ref: 'SW3', set: 'SW-PUSH', value: 'PAIR', zone: 'selv', note: 'GPIO_3: 0.5-3 s Simple Connect, 5-8 s randomise NMK, 10-15 s factory defaults (datasheet table 5)' },
  { ref: 'R7', set: 'R-EU', value: '10k', zone: 'selv', dnp: true, note: 'ZC_IN pull-down — only for DC-line coupling (datasheet §8.2 note 2); the mains variant leaves pin 13 floating (§12.1)' },
  { ref: 'TP6', set: 'TP', value: 'PLC RESET', zone: 'selv', note: '' },

  // ---- wired Ethernet ------------------------------------------------------
  { ref: 'U4', set: 'WIZ850IO', value: 'WIZ850io', zone: 'selv', edge: 'right', note: 'WIZnet W5500 + magnetics + RJ45 module on SPI0; the RJ45 nose overhangs the right edge' },
  { ref: 'R8', set: 'R-EU', value: '10k', zone: 'selv', note: 'WIZ850io RSTn pull-up (the module wants ≥ 500 µs low to reset)' },
  { ref: 'C9', set: 'C-0603', value: '100nF', zone: 'selv', note: 'U4 3.3 V decoupling' },

  // ---- break-out: the Pi's console and two spare GPIO ----------------------
  { ref: 'J3', set: 'HDR-2X5', value: 'GPIO/UART', zone: 'selv', note: '5V GND TXD0 RXD0 GPIO4 GPIO22 + spares — the Pi\'s console is on UART0, so this header is how the board is provisioned without a display' },

  { ref: 'H1', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 carrier mounting hole' },
  { ref: 'H2', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 carrier mounting hole' },
  { ref: 'H3', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 carrier mounting hole' },
  { ref: 'H4', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 carrier mounting hole' },
];

export const PARTS = [...blocks.parts, ...EXTRA_PARTS];

/* ------------------------------------------------------------------- netlist */

const B = blocks.nets;
const P = PI40_NAMES;   // header pin number → symbol pin name

export const NETS = {
  ...B,

  // ---- the Pi is fed from the 5 V buck, on its header ----
  '5V': [...B['5V'], ['J2', P['2']], ['J2', P['4']], ['J3', '1']],
  GND: [
    ...B.GND,
    ['J2', P['6']], ['J2', P['9']], ['J2', P['14']], ['J2', P['20']],
    ['J2', P['25']], ['J2', P['30']], ['J2', P['34']], ['J2', P['39']],
    ['J3', '2'],
    ['U3', 'GND'], ['LED2', 'K'], ['LED3', 'K'], ['SW3', '2'], ['C8', '2'], ['R7', '2'],
    ['U4', 'GND'], ['C9', '2'],
  ],

  // ---- the powerline modem couples onto the incoming mains ----
  AC_L_F: [...B.AC_L_F, ['U3', 'L']],
  AC_N: [...B.AC_N, ['U3', 'N']],

  '3V3': [
    ...B['3V3'],
    ['U3', 'VDD'], ['R5', '1'], ['U4', '3V3'], ['R8', '1'], ['C9', '1'], ['R1', '1'],
  ],

  // ---- SPI1 → the Green PHY modem (mode 3, burst CS, ≤ 12 MHz) ----
  //      needs the spi1-3cs device-tree overlay on Raspberry Pi OS
  PLC_SCLK: [['J2', P['40']], ['U3', 'SERIAL_1']],   // GPIO21
  PLC_MISO: [['J2', P['35']], ['U3', 'SERIAL_3']],   // GPIO19
  PLC_MOSI: [['J2', P['38']], ['U3', 'SERIAL_4']],   // GPIO20
  PLC_CS: [['J2', P['36']], ['U3', 'SERIAL_2']],     // GPIO16
  PLC_INT: [['J2', P['37']], ['U3', 'SERIAL_0']],    // GPIO26
  PLC_RESET: [['J2', P['31']], ['U3', 'RESET_L'], ['TP6', '1']],   // GPIO6

  // ---- SPI0 → the W5500 ----
  ETH_SCLK: [['J2', P['23']], ['U4', 'SCLK']],       // GPIO11
  ETH_MISO: [['J2', P['21']], ['U4', 'MISO']],       // GPIO9
  ETH_MOSI: [['J2', P['19']], ['U4', 'MOSI']],       // GPIO10
  ETH_CS: [['J2', P['24']], ['U4', '!SCS']],         // GPIO8 (CE0)
  ETH_INT: [['J2', P['22']], ['U4', '!INT']],        // GPIO25
  ETH_RST: [['J2', P['13']], ['U4', '!RST'], ['R8', '2']],   // GPIO27

  // ---- modem bootstrap (datasheet figures 3 and 4) ----
  PLC_GPIO0: [['U3', 'GPIO_0'], ['R3', '1']],
  LED2_A: [['R3', '2'], ['LED2', 'A']],
  PLC_GPIO1: [['U3', 'GPIO_1'], ['R4', '1']],
  LED3_A: [['R4', '2'], ['LED3', 'A']],
  PLC_GPIO3: [['U3', 'GPIO_3'], ['R5', '2'], ['R6', '2']],
  SW3_N: [['R6', '1'], ['SW3', '1'], ['C8', '1']],
  ZC_IN: [['U3', 'ZC_IN'], ['R7', '1']],

  // ---- UART0 console and two spare GPIO on the break-out ----
  BRK_TXD: [['J2', P['8']], ['J3', '3']],            // GPIO14
  BRK_RXD: [['J2', P['10']], ['J3', '4']],           // GPIO15
  BRK_GPIO4: [['J2', P['7']], ['J3', '5']],
  BRK_GPIO22: [['J2', P['15']], ['J3', '6']],
};

/**
 * Deliberately open. The Pi's 3.3 V output pins are the important ones: the
 * Zero's own regulator can supply roughly 50 mA and this board has a 3 A rail for
 * the modem and the W5500, so paralleling the two would be a mistake.
 */
export const UNCONNECTED = [
  ['J2', P['1']], ['J2', P['17']],     // Pi's own 3.3 V output — not paralleled
  ['J2', P['3']], ['J2', P['5']],      // GPIO2/GPIO3 (I2C1) — spare
  ['J2', P['11']], ['J2', P['12']],    // GPIO17, GPIO18 — spare
  ['J2', P['16']], ['J2', P['18']],    // GPIO23, GPIO24 — spare
  ['J2', P['26']],                     // GPIO7 (SPI0 CE1) — spare
  ['J2', P['27']], ['J2', P['28']],    // ID_SD / ID_SC (HAT EEPROM) — spare
  ['J2', P['29']], ['J2', P['32']], ['J2', P['33']],   // GPIO5, GPIO12, GPIO13
  ['U1', 'FB'], ['U2', 'FB'],          // LM2576S fixed outputs bond FB internally
  ['U3', 'GPIO_2'],                    // unused in the module's default configuration
  ['U4', 'NC'],
  ['J3', '7'], ['J3', '8'], ['J3', '9'], ['J3', '10'],
];

export const NET_CLASS = {
  AC_L: 1, AC_L_F: 1, AC_N: 1, PE: 1,
  '12V_P': 2, '12V': 2, '5V': 2, '3V3': 2, GND: 2, SW_5V: 2, SW_3V3: 2,
};

/* ------------------------------------------------------ power budget (mA) */

export const POWER_BUDGET = [
  {
    rail: '12V', supplyMA: 1670,     // MPM-20-12: 20 W / 12 V
    loads: [
      { what: 'U1 (5 V buck) input: 5 V x 0.75 A / 12 V / 0.8 efficiency', mA: 391 },
      { what: 'U2 (3.3 V buck) input: 3.3 V x 0.6 A / 12 V / 0.8 efficiency', mA: 206 },
    ],
  },
  {
    rail: '5V', supplyMA: 3000,      // LM2576S-5.0, 3 A
    loads: [{ what: 'Raspberry Pi Zero 2 W, ≈3 W max', mA: 600 }],
  },
  {
    rail: '3V3', supplyMA: 3000,     // LM2576S-3.3, 3 A
    loads: [
      { what: 'U3 PLC Stamp mini 2, IDD max (datasheet §8.2)', mA: 300 },
      { what: 'U4 WIZ850io, 141 mA typ + margin', mA: 180 },
      { what: 'LED1-LED3, strap resistors, break-out load', mA: 80 },
    ],
  },
];
export const POWER_BUDGET_REPORT = budgetCheck(POWER_BUDGET);

/* --------------------------------------------------- board placements (mm) */

export const PLACEMENT = {
  // ---- mains ----
  J1: { x: 14, y: 110, rot: 'R0' },
  F1: { x: 30, y: 110, rot: 'R0' },
  MOV1: { x: 40, y: 110, rot: 'R0' },
  TP3: { x: 50, y: 112, rot: 'R0' },
  PS1: { x: 34, y: 84, rot: 'R180' },   // AC pins left, DC pins right

  // ---- 12 V conditioning ----
  FB1: { x: 78, y: 112, rot: 'R0' },
  C1: { x: 90, y: 108, rot: 'R0' },
  TP1: { x: 100, y: 116, rot: 'R0' },
  TP2: { x: 100, y: 110, rot: 'R0' },
  R1: { x: 110, y: 116, rot: 'R0' },
  LED1: { x: 118, y: 118, rot: 'R0' },

  // ---- 5 V buck (the Pi) ----
  U1: { x: 120, y: 106, rot: 'R0' },
  L1: { x: 140, y: 106, rot: 'R0' },
  D1: { x: 138, y: 92, rot: 'R0' },
  C2: { x: 122, y: 92, rot: 'R0' },
  C3: { x: 152, y: 92, rot: 'R0' },
  C4: { x: 166, y: 92, rot: 'R0' },
  TP4: { x: 172, y: 100, rot: 'R0' },

  // ---- 3.3 V buck (modem + Ethernet + straps) ----
  U2: { x: 120, y: 74, rot: 'R0' },
  L2: { x: 140, y: 74, rot: 'R0' },
  D2: { x: 138, y: 60, rot: 'R0' },
  C5: { x: 122, y: 60, rot: 'R0' },
  C6: { x: 152, y: 60, rot: 'R0' },
  C7: { x: 166, y: 60, rot: 'R0' },
  TP5: { x: 172, y: 68, rot: 'R0' },

  // ---- the Raspberry Pi, socketed, antenna end toward the board edge ----
  J2: { x: 82, y: 20, rot: 'R0' },

  // ---- powerline modem, straddling the barrier like the isolation it contains ----
  U3: { x: 44, y: 16, rot: 'R0' },
  TP6: { x: 58, y: 34, rot: 'R0' },
  R7: { x: 66, y: 34, rot: 'R0' },

  // ---- modem bootstrap strip ----
  R3: { x: 72, y: 10, rot: 'R0' },
  LED2: { x: 82, y: 10, rot: 'R0' },
  R4: { x: 92, y: 10, rot: 'R0' },
  LED3: { x: 102, y: 10, rot: 'R0' },
  R5: { x: 112, y: 10, rot: 'R0' },
  R6: { x: 122, y: 10, rot: 'R0' },
  C8: { x: 132, y: 10, rot: 'R0' },
  SW3: { x: 142, y: 8, rot: 'R0' },

  // ---- wired Ethernet ----
  U4: { x: 160, y: 34, rot: 'R0' },
  C9: { x: 142, y: 54, rot: 'R0' },
  R8: { x: 162, y: 50, rot: 'R0' },

  // ---- break-out and hardware ----
  J3: { x: 164, y: 10, rot: 'R0' },
  H1: { x: 4, y: 4, rot: 'R0' },
  H2: { x: 176, y: 4, rot: 'R0' },
  H3: { x: 4, y: 116, rot: 'R0' },
  H4: { x: 176, y: 116, rot: 'R0' },
};

/* ------------------------------------------------- schematic placement (mm) */

export const SHEET = { w: 520, h: 500, columns: 13, rows: 12 };

export const SCHEM_PLACEMENT = {
  // A: mains input
  J1: { x: 45, y: 470 }, F1: { x: 125, y: 470 }, MOV1: { x: 205, y: 470 },
  PS1: { x: 285, y: 470 }, TP3: { x: 365, y: 470 },
  // B: 12 V conditioning
  FB1: { x: 45, y: 420 }, C1: { x: 105, y: 420 }, TP1: { x: 165, y: 420 }, TP2: { x: 215, y: 420 },
  // C: the 5 V buck
  U1: { x: 50, y: 370 }, L1: { x: 130, y: 370 }, D1: { x: 200, y: 370 },
  C2: { x: 265, y: 370 }, C3: { x: 325, y: 370 }, C4: { x: 385, y: 370 }, TP4: { x: 440, y: 370 },
  // D: the 3.3 V buck
  U2: { x: 50, y: 320 }, L2: { x: 130, y: 320 }, D2: { x: 200, y: 320 },
  C5: { x: 265, y: 320 }, C6: { x: 325, y: 320 }, C7: { x: 385, y: 320 }, TP5: { x: 440, y: 320 },
  // E: the three modules and the break-out header
  J2: { x: 70, y: 240 }, U3: { x: 180, y: 240 }, U4: { x: 290, y: 240 },
  J3: { x: 380, y: 240 }, R8: { x: 440, y: 240 }, C9: { x: 490, y: 240 },
  // F: modem bootstrap
  R3: { x: 45, y: 150 }, LED2: { x: 100, y: 150 }, R4: { x: 155, y: 150 },
  LED3: { x: 210, y: 150 }, R5: { x: 265, y: 150 }, R6: { x: 320, y: 150 },
  C8: { x: 375, y: 150 }, SW3: { x: 430, y: 150 }, R7: { x: 485, y: 150 },
  // G: indicators and the modem reset test point
  R1: { x: 45, y: 80 }, LED1: { x: 100, y: 80 }, TP6: { x: 155, y: 80 },
};

export const SCHEM_NOTES = [
  { x: 20, y: 492, size: 3.4, layer: 97, text: 'Pi Wall Socket — Raspberry Pi Zero 2 W carrier for a wall-socket enclosure: 12 V mains supply, wired Ethernet and Ethernet-over-powerline' },
  { x: 20, y: 484, size: 2.2, layer: 97, text: 'MAINS (row A): L → F1 → PS1.2 (MPM-20-12 AC/L) and U3 pin 16/17 (L); N → PS1.1 (AC/N) and U3 pin 15 (N); MOV1 across L-N after the fuse.' },
  { x: 20, y: 479, size: 2.2, layer: 97, text: 'PE lands on J1.3 and TP3 only — it is never bonded to SELV ground on this PCB.' },
  { x: 20, y: 474, size: 2.2, layer: 97, text: 'POWER TREE: 12 V → U1 LM2576S-5.0 → Pi header pins 2/4 (the Zero 2 W takes ≈3 W max); 12 V → U2 LM2576S-3.3 → modem, WIZ850io, straps.' },
  { x: 20, y: 469, size: 2.2, layer: 97, text: 'Header pins 1/17 are the Pi\'s own 3.3 V output (≈50 mA). They are left open, not paralleled with U2.' },
  { x: 20, y: 300, size: 2.2, layer: 97, text: 'SPI1 → U3 (the Green PHY modem is a SPI slave: mode 3, burst CS, max 12 MHz). Raspberry Pi OS needs dtoverlay=spi1-3cs.' },
  { x: 20, y: 295, size: 2.2, layer: 97, text: 'SPI0 → U4 (WIZ850io = W5500 + magnetics + RJ45, so no analogue design on this board).' },
  { x: 20, y: 290, size: 2.2, layer: 97, text: 'U3 is the CE Class B / North America variant: transformer 1:4:5 and zero-cross detection on the module, pin 13 floating. Automotive variants are NOT for mains (datasheet §12.2).' },
  { x: 20, y: 285, size: 2.2, layer: 97, text: 'Isolation is inside U3: 4000 Vac, 8 mm creepage / 6.5 mm clearance between L/N and everything else (§8.3). This board keeps 8.0 mm, checked by --check.' },
  { x: 20, y: 190, size: 2.2, layer: 97, text: 'BOOTSTRAP (row F): GPIO_0 and GPIO_1 are read at boot, so their LEDs use the 3.3 kΩ series resistors of datasheet figure 3; GPIO_3 is the pushbutton input' },
  { x: 20, y: 185, size: 2.2, layer: 97, text: 'with the 100 Ω / 10 kΩ / 100 pF network of figure 4. After boot GPIO_0 = PLC link, GPIO_1 = Simple Connect blink (1 Hz), GPIO_2 unused.' },
  { x: 20, y: 110, size: 2.2, layer: 97, text: 'CONSOLE (row G / J3): UART0 on GPIO14/GPIO15 is how the board is provisioned; the Pi has no display connector in a socket box.' },
];

export const BOARD_NOTES = [
  { x: 2, y: 118, size: 1.8, layer: 21, text: 'Pi Wall Socket rev A — 180 x 120 mm, 2 layers, 1.6 mm FR-4' },
  { x: 2, y: 115.5, size: 1.2, layer: 21, text: 'MAINS: L → F1 → PS1.2 and U3.16/17 ; N → PS1.1 and U3.15 ; MOV1 after F1' },
  { x: 72, y: 118, size: 1.4, layer: 21, text: 'HAZARDOUS VOLTAGE — 8.0 mm creepage / 6.5 mm clearance to all SELV copper' },
  { x: 72, y: 115.5, size: 1.2, layer: 21, text: 'Creepage figure from PLC Stamp mini 2 datasheet §8.3 (4000 Vac isolation)' },
  { x: 2, y: 32, size: 1.2, layer: 21, text: 'U3 pads 15/16/17 are mains: keep this corner free of every other pad' },
  { x: 84, y: 52, size: 1.2, layer: 21, text: 'Raspberry Pi Zero 2 W: 65 x 30 mm module, four M2.5 holes at 58 x 23 mm' },
  { x: 150, y: 14, size: 1.2, layer: 21, text: 'U4 RJ45 nose overhangs the right edge' },
];

export const BARRIER = { x1: 70, y1: 44, x2: 70, y2: 120 };

/**
 * The barrier runs through the modem (which is the isolation there) and a keep-out
 * is drawn around its three mains pads: 8 mm, per datasheet §8.3. The Pi's own
 * outline and the WIZ850io's RJ45 overhang are drawn for the enclosure.
 */
export const BOARD_LINES = [
  { x1: 70, y1: 0.8, x2: 70, y2: 44, layer: 21, width: 0.4, style: 'shortdash' },
  // 8 mm keep-out around U3's mains coupling pads (module at 44,16)
  { x1: 15.8, y1: 18.2, x2: 43.3, y2: 18.2, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 15.8, y1: 34.2, x2: 43.3, y2: 34.2, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 15.8, y1: 18.2, x2: 15.8, y2: 34.2, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 43.3, y1: 18.2, x2: 43.3, y2: 34.2, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 16.5, y1: 19, x2: 42.5, y2: 19, layer: 41, width: 0.2 },
  // the Pi module's own outline is part of its package courtyard; this marks the
  // keep-clear zone above it (the Zero's Wi-Fi antenna is at that end)
  { x1: 82, y1: 50, x2: 147, y2: 50, layer: 21, width: 0.2, style: 'longdash' },
];

export const POUR = { x1: 72, y1: 0.8, x2: 179.2, y2: 119.2 };

export const pinAbsolute = makePinAbsolute(SYMBOLS);

export const BOM_INTRO = `The Raspberry Pi Zero 2 W is a separate purchase and bolts onto J2 with 2.54 mm
female headers; its four M2.5 holes land on the Ø2.75 holes in the same package,
58 x 23 mm apart, so no separate hole parts are needed.

Two network paths are fitted: U4 (WIZnet WIZ850io, SPI0) for wired Ethernet and
U3 (chargebyte PLC Stamp mini 2, SPI1) for Ethernet-over-powerline on the building
wiring. Raspberry Pi OS needs \`dtoverlay=spi1-3cs\` for the second bus, and the
Green PHY side needs Qualcomm's open-plc-utils (or chargebyte's V2G Core) plus the
QCA7000 SPI protocol described in chargebyte's AN4.

R7 (ZC_IN pull-down) is DNP: only DC-line coupling needs it.

A relay-switched socket outlet was considered and deliberately not fitted: the
Panasonic AHES4291 used on the PIONIX EVerest devboard puts a contact pad 7.65 mm
centre-to-centre (≈4.8 mm edge-to-edge) from a coil pad, which is inside this
board's 8 mm creepage rule; tests/23 measures it. An Omron G5LE-1
keeps ≥ 12 mm between its coil and contact pin groups, so that is the relay to use
if the outlet is added later — see tools/replacement-parts.mjs.`;

export const SAFETY_NOTES = [
  'U3 pins 15/16/17 are on the mains. The module provides the isolation (4000 Vac, 8 mm creepage / 6.5 mm clearance, datasheet §8.3); this board keeps 8.0 mm between those pads and every other pad, enforced by `--check`.',
  'PS1 (MEAN WELL MPM-20-12, 20 W) provides the primary isolation. The 12 V, 5 V and 3.3 V rails are all SELV.',
  'Fuse F1 is in the line conductor only; MOV1 sits after the fuse. PE lands on J1.3 and TP3 and is not bonded to SELV ground.',
  'The Pi Zero 2 W and the modem both have radios. A metal faceplate over the Pi\'s antenna end or the modem\'s coupling will change both; the silkscreen marks the keep-clear line.',
  'The modem is MSL 3 and tolerates at most two reflows (datasheet §13, IPC/JEDEC J-STD-020 and J-STD-033).',
  'This is a design study, not a certified product. A board that lives in a wall-socket enclosure needs IEC/EN 62368-1 assessment, and the enclosure needs to keep the socket\'s live parts away from the SELV side by more than this board alone does.',
];
