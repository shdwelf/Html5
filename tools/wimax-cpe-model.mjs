/**
 * wimax-cpe-model.mjs — "WiMAX CPE Wallplug": a mains-powered carrier for a
 * PCI Express Mini Card WiMAX modem (IEEE 802.16e), talking to a host over USB.
 *
 * Why this shape
 *   The Intel Centrino Advanced-N + WiMAX 6250 is a *half* Mini Card
 *   (26.65 x 29.85 x 4.39 mm, 4.5 g) whose WiMAX side is USB 2.0 and whose
 *   Wi-Fi side is PCI Express. A wallplug has no PCIe root complex, so this
 *   carrier wires the USB half to an upstream micro-USB receptacle and leaves
 *   PERp0/PERn0/PETp0/REFCLK± open: on this board the card's 802.11 radio stays
 *   dark and the 802.16e radio is the product. That is the honest consequence of
 *   the card's own product brief ("Connector interface: PCIe electrical
 *   interface for Wi-Fi, USB 2.0 for WiMAX"), not a shortcut.
 *
 * Where the numbers come from
 *   Intel Centrino Advanced-N + WiMAX 6250 product brief (rfwel.com mirror of the
 *     Intel PDF): 802.16e-2005 Wave 2, Mobile WiMAX Release 1 Wave 2 system
 *     profile, 2.3 / 2.5 / 3.5 GHz, 20 Mbps down / 6 Mbps up over WiMAX, 300 Mbps
 *     Wi-Fi, PCIe Half Mini Card 26.65 x 29.85 x 4.39 mm, 4.5 g, two LED outputs
 *     (one Wi-Fi, one WiMAX, behaviour per the Mini Card specification), radio
 *     on/off control in hardware and software, 0…+80 °C, FCC ID PD9622ANXH.
 *   Intel WiFi Adapter Information Guide: 52-pin Mini Card edge connector,
 *     voltage 3.3 V, antenna interface Hirose U.FL-R-SMT mating with U.FL-LP-066
 *     cable connectors, on-board diversity, Mini Card 50.80 x 30 x 4.5 mm,
 *     Half-Mini Card 26.64 x 30 x 4.5 mm.
 *   PCI Express Mini Card Electromechanical Specification rev 1.2: current rating
 *     0.50 A per power contact continuous; W_DISABLE# "requires a pull-up
 *     resistor on the card" and is mandatory for systems and cards with RF;
 *     pin table (1 WAKE#, 2 +3.3Vaux, 3 COEX1, 4 GND, 5 COEX2, 6 1.5V/COEX3,
 *     7 CLKREQ#, 8 UIM_PWR, 9 GND, 10 UIM_DATA, 11 REFCLK-, 12 UIM_CLK,
 *     13 REFCLK+, 14 UIM_RESET, 15 GND, 16 UIM_VPP, 17 RSVD(UIM_C8), 18 GND,
 *     19 UIM_IC_DP, 20 W_DISABLE#, 21 GND, 22 PERST#, 23 PERn0, 24 +3.3Vaux,
 *     25 PERp0, 26 GND, 27 GND, 28 +1.5V, 29 GND, 30 SMB_CLK, 31 GND,
 *     32 SMB_DATA, 33 PETp0, 34 GND, 35 GND, 36 USB_D-, 37 GND, 38 USB_D+,
 *     39 +3.3Vaux, 40 GND, 41 +3.3Vaux, 42 LED_WWAN#, 43 LED_WLAN#,
 *     44 LED_WPAN#, 45/46/47 Reserved, 48 +1.5V, 49 Reserved, 50 GND,
 *     51 W_DISABLE2#, 52 +3.3Vaux), cross-checked against hardwarebook.info and
 *     ARM's DSTREAM Mini-PCIe documentation, which agree.
 *   PEAK Systems PCIe-miniPCIe adapter manual: 3.3 V max 1100 mA and 1.5 V max
 *     375 mA for a card — the budget this board's 3.3 V rail is sized against.
 *   MEAN WELL MPM-20-12 (PIONIX EVerest symbol: 1 AC/N, 2 AC/L, 3 +V, 4 -V) and
 *     LM2576S-3.3 (TO-263-5, tab = GND) for the supply.
 *
 * Antennas are NOT board parts. The card carries its own Hirose U.FL-R-SMT
 * jacks, so the enclosure takes two U.FL-LP-066 → SMA bulkhead pigtails and the
 * carrier board only has to keep the card's antenna end clear of copper and metal
 * (BOARD_LINES draws that keep-out).
 *
 * Units mm, EAGLE orientation (y up). Generated files land in hardware/wimax-cpe/.
 */

import {
  FAMILY_PACKAGES, FAMILY_SYMBOLS, FAMILY_DEVICESETS, mainsBlock, buckBlock,
  powerLed, merge, MPCIE_NAMES,
} from './eda-blocks.mjs';
import {
  rotPt, padAbs, courtAbs, symbolBBox, stubDir, makePinAbsolute, STUB, rnd,
  pick, budgetCheck, PACKAGE_SOURCES,
} from './eda-core.mjs';

export { rotPt, padAbs, courtAbs, symbolBBox, stubDir, STUB, rnd, PACKAGE_SOURCES };

export const TITLE = 'WiMAX CPE Wallplug';
export const MODEL_PATH = 'tools/wimax-cpe-model.mjs';
export const DESCRIPTION = 'mains-powered PCI Express Mini Card carrier for an IEEE 802.16e WiMAX modem (Intel Centrino Advanced-N + WiMAX 6250), USB 2.0 to the host';
export const DOC_REF = 'see docs/wimax-pi-powerline-variants-2026-10-08.md';

/* ------------------------------------------------------------------- board */

export const BOARD = {
  name: 'wimax-cpe',
  rev: 'A',
  w: 140,
  h: 90,
  layers: 2,
  thickness: 1.6,
  edgeClearance: 1.5,
  zones: {
    mains: { x1: 0, y1: 34, x2: 60, y2: 90 },
    selv: { x1: 56, y1: 0, x2: 140, y2: 90 },
  },
  // No powerline modem on this board, so the isolation figure is the usual one for
  // a 250 V rms working voltage with reinforced insulation (IEC 60664-1 /
  // 62368-1), matching the xPort wallplug. The AC/DC module brings its own
  // certified barrier.
  creepageMm: 6.4,
  clearanceMm: 4.0,
  mountingHoles: [{ x: 4, y: 4 }, { x: 136, y: 4 }, { x: 4, y: 86 }, { x: 136, y: 86 }],
};

/* --------------------------------------------------------------- registries */

export const PACKAGES = pick(FAMILY_PACKAGES, [
  'R-7.62', 'C-5.08', 'CP-D10-P5', 'CP-D6.3-P2.5', 'FB-7.62', 'FUSE-RADIAL',
  'MOV07', 'LED-5MM', 'SW-TACT-6MM', 'TP', 'MOUNT-M3',
  'CUI_TB003', 'MPM2012', 'LM2576S', 'LRAD12', 'MPCIE', 'USBMB', 'MICROSIM',
  'AMS1117', 'R0603', 'C0603', 'DO41',
]);

export const SYMBOLS = pick(FAMILY_SYMBOLS, [
  'R-EU', 'C-EU', 'CPOL-EU', 'FERRITE', 'FUSE', 'MOV', 'LED',
  'SW-PUSH', 'TP', 'ACDC-4', 'BUCK-3V3', 'DIODE', 'INDUCTOR', 'TERM-3',
  'MPCIE', 'USB-MICRO-B', 'MICRO-SIM', 'LDO-3V3',
]);

export const DEVICESETS = pick(FAMILY_DEVICESETS, [
  'R-EU', 'C-EU', 'CPOL-EU', 'CPOL-SMALL', 'FERRITE', 'FUSE', 'MOV', 'LED',
  'SW-PUSH', 'TP', 'MOUNT-M3', 'ACDC-12V', 'BUCK-3V3', 'DIODE-SCH', 'L-RADIAL',
  'TERM-3', 'R-0603', 'C-0603', 'LDO-3V3', 'USB-MICRO-B', 'MICRO-SIM',
]);
// deviceset for the Mini Card socket, built from the EM-spec pin table
DEVICESETS['MPCIE-SOCKET'] = {
  prefix: 'X', symbol: 'MPCIE', package: 'MPCIE',
  connects: Object.fromEntries(
    Object.entries(MPCIE_NAMES).map(([pad, name]) => [name, pad]),
  ),
};

/* -------------------------------------------------------------------- parts */

const blocks = merge(
  mainsBlock({ ps: 'ACDC-12V', psValue: 'MPM-20-12', rail: '12V', fuse: 'T630mA/250V' }),
  buckBlock({ inRail: '12V', cin: '470uF/25V' }),
  powerLed({ r: 'R1', led: 'LED1' }, 'PWR green'),
);

const N = MPCIE_NAMES;   // socket pad number → symbol pin name

const EXTRA_PARTS = [
  // ---- the card socket -----------------------------------------------------
  {
    ref: 'U2', set: 'MPCIE-SOCKET', value: 'mini-PCIe 52p', zone: 'selv',
    note: 'PCI Express Mini Card socket, 0.8 mm pitch, half-size card (30 x 26.8 mm); Ø2.6 mounting holes 24.2 mm apart. 3.3 V only — the Intel 6250 needs no 1.5 V.',
  },
  { ref: 'C5', set: 'C-0603', value: '100nF', zone: 'selv', note: '3.3 Vaux decoupling at the socket' },
  { ref: 'C6', set: 'C-0603', value: '100nF', zone: 'selv', note: '3.3 Vaux decoupling at the socket' },
  { ref: 'C7', set: 'CPOL-SMALL', value: '10uF/10V', zone: 'selv', note: 'local reservoir for the card\'s TX bursts' },

  // ---- reset, radio-disable and management bus -----------------------------
  { ref: 'R2', set: 'R-EU', value: '10k', zone: 'selv', note: 'PERST# pull-up: no PCIe host here, so the card is held out of reset and enumerated over USB' },
  { ref: 'R3', set: 'R-EU', value: '10k', zone: 'selv', note: 'W_DISABLE# pull-up (the EM spec requires one on the card; this is the belt-and-braces copy on the carrier)' },
  { ref: 'SW4', set: 'SW-PUSH', value: 'RADIO OFF', zone: 'selv', note: 'drives W_DISABLE# and W_DISABLE2# low: the regulatory radio-disable the EM spec §3.2.5.2 expects a system to provide' },
  { ref: 'R4', set: 'R-EU', value: '2k2', zone: 'selv', note: 'SMB_CLK pull-up' },
  { ref: 'R5', set: 'R-EU', value: '2k2', zone: 'selv', note: 'SMB_DATA pull-up' },

  // ---- status LEDs (the card drives them open-drain) -----------------------
  { ref: 'R6', set: 'R-EU', value: '3k3', zone: 'selv', note: 'LED_WWAN# (WiMAX) current limit' },
  { ref: 'LED2', set: 'LED', value: 'WWAN', zone: 'selv', note: 'WiMAX radio status, behaviour per the Mini Card specification' },
  { ref: 'R7', set: 'R-EU', value: '3k3', zone: 'selv', note: 'LED_WLAN# (Wi-Fi) current limit — dark on this board, the PCIe side is not wired' },
  { ref: 'LED3', set: 'LED', value: 'WLAN', zone: 'selv', note: 'Wi-Fi status (unused here)' },

  // ---- upstream USB to the host -------------------------------------------
  { ref: 'J3', set: 'USB-MICRO-B', value: 'USB UP', zone: 'selv', note: 'Molex 105017-0001 micro-USB, wired as the upstream (B-device) port: D+/D- to the socket\'s USB pins, shell to GND, VBUS deliberately not used' },

  // ---- SIM: not needed by the Intel 6250, needed by an LTE swap-in ---------
  { ref: 'J4', set: 'MICRO-SIM', value: 'UIM (DNP)', zone: 'selv', dnp: true, note: 'JAE SF53S006VCBR2000 micro-SIM holder on the UIM_* pins — the Intel 6250 has no SIM, an LTE mini-PCIe swap-in does' },

  // ---- +1.5 V, optional ---------------------------------------------------
  { ref: 'U3', set: 'LDO-3V3', value: 'AMS1117-1.5', zone: 'selv', dnp: true, note: 'the EM spec provides +1.5 V on pins 6/28/48; the Intel 6250 runs from 3.3 V alone, so this is only for a card that asks for it' },
  { ref: 'C8', set: 'CPOL-SMALL', value: '10uF/10V', zone: 'selv', dnp: true, note: 'U3 input' },
  { ref: 'C9', set: 'CPOL-SMALL', value: '10uF/10V', zone: 'selv', dnp: true, note: 'U3 output' },

  // ---- test points ---------------------------------------------------------
  { ref: 'TP5', set: 'TP', value: '3V3AUX', zone: 'selv', note: '' },
  { ref: 'TP6', set: 'TP', value: '1V5', zone: 'selv', note: '' },
  { ref: 'TP7', set: 'TP', value: 'USB_D+', zone: 'selv', note: '' },
  { ref: 'TP8', set: 'TP', value: 'USB_D-', zone: 'selv', note: '' },

  { ref: 'H1', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H2', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H3', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H4', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
];

export const PARTS = [...blocks.parts, ...EXTRA_PARTS];

/* ------------------------------------------------------------------- netlist */

const B = blocks.nets;
const gndPins = ['4', '9', '15', '18', '21', '26', '27', '29', '31', '34', '35', '37', '40', '50'].map((p) => ['U2', N[p]]);
const auxPins = ['2', '24', '39', '41', '52'].map((p) => ['U2', N[p]]);
const v15Pins = ['6', '28', '48'].map((p) => ['U2', N[p]]);

export const NETS = {
  ...B,

  // ---- card power: five 3.3 V contacts, 0.50 A each per the EM spec ----
  '3V3': [...B['3V3'], ...auxPins, ['C5', '1'], ['C6', '1'], ['C7', '+'], ['R1', '1'], ['R2', '1'], ['R3', '1'], ['R4', '1'], ['R5', '1'], ['TP5', '1'], ['U3', 'VI'], ['C8', '+']],
  GND: [
    ...B.GND, ...gndPins,
    ['C5', '2'], ['C6', '2'], ['C7', '-'], ['SW4', '2'], ['LED2', 'K'], ['LED3', 'K'],
    ['J3', 'GND'], ['J3', 'SH'], ['J4', 'GND'], ['J4', 'SH'], ['U3', 'GND'],
    ['C8', '-'], ['C9', '-'],
  ],
  '1V5': [...v15Pins, ['U3', 'VO'], ['C9', '+'], ['TP6', '1']],
  // R1 is the power LED's series resistor: the powerLed() block wires R1.2 → LED1
  // and leaves the rail end to the design, because only the design knows the rail

  // ---- USB 2.0: the only host interface this carrier actually uses ----
  USB_DP: [['U2', N['38']], ['J3', 'DP'], ['TP7', '1']],
  USB_DM: [['U2', N['36']], ['J3', 'DM'], ['TP8', '1']],

  // ---- card control ----
  MPCIE_PERST: [['U2', N['22']], ['R2', '2']],
  MPCIE_WDISABLE: [['U2', N['20']], ['U2', N['51']], ['R3', '2'], ['SW4', '1']],
  SMB_CLK: [['U2', N['30']], ['R4', '2']],
  SMB_DATA: [['U2', N['32']], ['R5', '2']],
  LED_WWAN: [['U2', N['42']], ['R6', '1']],
  LED2_A: [['R6', '2'], ['LED2', 'A']],
  LED_WLAN: [['U2', N['43']], ['R7', '1']],
  LED3_A: [['R7', '2'], ['LED3', 'A']],

  // ---- SIM (UIM) pins, for an LTE swap-in ----
  UIM_PWR: [['U2', N['8']], ['J4', 'VCC']],
  UIM_DATA: [['U2', N['10']], ['J4', 'IO']],
  UIM_CLK: [['U2', N['12']], ['J4', 'CLK']],
  UIM_RESET: [['U2', N['14']], ['J4', 'RST']],
};

/** Deliberately open pins, each with the reason it is open. */
export const UNCONNECTED = [
  ['U2', N['1']],    // WAKE#: no host to wake
  ['U2', N['3']],    // COEX1
  ['U2', N['5']],    // COEX2 — coexistence lines are for a combo radio in a laptop
  ['U2', N['7']],    // CLKREQ#: PCIe only
  ['U2', N['11']],   // REFCLK-: a PCIe host supplies the 100 MHz reference
  ['U2', N['13']],   // REFCLK+
  ['U2', N['23']],   // PERn0: PCIe receive pair, no root complex on this board
  ['U2', N['25']],   // PERp0
  ['U2', N['33']],   // PETp0: PCIe transmit pair
  ['U2', N['16']],   // UIM_VPP: SIM programming voltage, obsolete in 3G/4G UICC
  ['U2', N['17']],   // Reserved (UIM_C8)
  ['U2', N['19']],   // UIM_IC_DP
  ['U2', N['44']],   // LED_WPAN#: no Bluetooth on the 6250
  ['U2', N['45']], ['U2', N['46']], ['U2', N['47']], ['U2', N['49']],  // Reserved
  ['J3', 'VBUS'],    // host VBUS is not used: this board is mains-powered, and
  ['J3', 'ID'],      // tying VBUS to a board rail would back-feed the host. ID is
                     // open because the board is the B-device (peripheral).
  ['J4', 'DET'],     // card-detect switch, not wired
  ['U1', 'FB'],      // LM2576S-3.3 bonds the feedback pin inside the package
];

export const NET_CLASS = {
  AC_L: 1, AC_L_F: 1, AC_N: 1, PE: 1,
  '12V_P': 2, '12V': 2, '3V3': 2, '1V5': 2, GND: 2, SW_3V3: 2,
};

/* ------------------------------------------------------ power budget (mA) */

export const POWER_BUDGET = [
  {
    rail: '12V', supplyMA: 1670,   // MPM-20-12: 20 W / 12 V
    loads: [{ what: 'U1 buck input: 3.3 V x 1.3 A / 12 V / 0.8 efficiency', mA: 447 }],
  },
  {
    rail: '3V3', supplyMA: 3000,   // LM2576S-3.3, 3 A
    loads: [
      { what: 'card, PEAK Systems adapter rating for a Mini Card (1100 mA at 3.3 V)', mA: 1100 },
      { what: 'LED1-LED3 and pull-ups', mA: 30 },
    ],
  },
];
export const POWER_BUDGET_REPORT = budgetCheck(POWER_BUDGET);

/* --------------------------------------------------- board placements (mm) */

export const PLACEMENT = {
  // ---- mains ----
  J1: { x: 12, y: 82, rot: 'R0' },
  F1: { x: 27, y: 82, rot: 'R0' },
  MOV1: { x: 37, y: 82, rot: 'R0' },
  TP3: { x: 47, y: 84, rot: 'R0' },
  PS1: { x: 30, y: 58, rot: 'R180' },   // MPM-20-12: AC pins at local +x, so R180 points them left

  // ---- 12 V conditioning, power indicator and the 3.3 V step-down ----
  FB1: { x: 72, y: 82, rot: 'R0' },
  C1: { x: 86, y: 80, rot: 'R0' },
  TP1: { x: 96, y: 84, rot: 'R0' },
  TP2: { x: 96, y: 78, rot: 'R0' },
  R1: { x: 104, y: 86, rot: 'R0' },
  LED1: { x: 114, y: 88, rot: 'R0' },
  U1: { x: 112, y: 78, rot: 'R0' },
  C2: { x: 97, y: 64, rot: 'R0' },
  D1: { x: 112, y: 66, rot: 'R0' },
  L1: { x: 130, y: 66, rot: 'R0' },
  C3: { x: 130, y: 44, rot: 'R0' },
  C4: { x: 114, y: 48, rot: 'R0' },
  TP4: { x: 94, y: 54, rot: 'R0' },

  // ---- the card socket: connector at the bottom, card body extends +Y ----
  U2: { x: 86, y: 20, rot: 'R0' },
  C5: { x: 70, y: 46, rot: 'R0' },
  C6: { x: 70, y: 38, rot: 'R0' },
  C7: { x: 70, y: 30, rot: 'R0' },
  J3: { x: 68, y: 60, rot: 'R0' },

  // ---- card control: one row under the socket ----
  R2: { x: 68, y: 8, rot: 'R0' },
  R3: { x: 80, y: 8, rot: 'R0' },
  SW4: { x: 92, y: 8, rot: 'R0' },
  R4: { x: 104, y: 8, rot: 'R0' },
  R5: { x: 116, y: 8, rot: 'R0' },
  R6: { x: 128, y: 8, rot: 'R0' },
  R7: { x: 136, y: 16, rot: 'R90' },
  LED2: { x: 118, y: 16, rot: 'R0' },
  LED3: { x: 126, y: 16, rot: 'R0' },

  // ---- options and test points ----
  J4: { x: 120, y: 30, rot: 'R0' },
  U3: { x: 104, y: 54, rot: 'R0' },
  C8: { x: 114, y: 54, rot: 'R0' },
  C9: { x: 122, y: 54, rot: 'R0' },
  TP5: { x: 62, y: 44, rot: 'R0' },
  TP6: { x: 62, y: 52, rot: 'R0' },
  TP7: { x: 62, y: 68, rot: 'R0' },
  TP8: { x: 62, y: 74, rot: 'R0' },

  // ---- mounting holes ----
  H1: { x: 4, y: 4, rot: 'R0' },
  H2: { x: 136, y: 4, rot: 'R0' },
  H3: { x: 4, y: 86, rot: 'R0' },
  H4: { x: 136, y: 86, rot: 'R0' },
};

/* ------------------------------------------------- schematic placement (mm) */

export const SHEET = { w: 480, h: 460, columns: 12, rows: 10 };

export const SCHEM_PLACEMENT = {
  // A: mains
  J1: { x: 40, y: 430 }, F1: { x: 110, y: 430 }, MOV1: { x: 180, y: 430 },
  PS1: { x: 260, y: 430 }, TP3: { x: 350, y: 430 },
  // B: 12 V conditioning
  FB1: { x: 40, y: 380 }, C1: { x: 100, y: 380 }, TP1: { x: 160, y: 380 }, TP2: { x: 210, y: 380 },
  // C: the 3.3 V step-down
  U1: { x: 50, y: 330 }, L1: { x: 130, y: 330 }, D1: { x: 200, y: 330 },
  C2: { x: 265, y: 330 }, C3: { x: 325, y: 330 }, C4: { x: 385, y: 330 }, TP4: { x: 435, y: 330 },
  // D: the 52-pin socket (68 mm of pin column) and the card-control parts
  U2: { x: 70, y: 250 },
  R2: { x: 140, y: 250 }, R3: { x: 195, y: 250 }, SW4: { x: 250, y: 250 },
  R4: { x: 305, y: 250 }, R5: { x: 360, y: 250 }, R6: { x: 415, y: 250 },
  // E: LEDs, decoupling, upstream USB
  LED2: { x: 60, y: 140 }, LED3: { x: 115, y: 140 }, R7: { x: 170, y: 140 },
  C5: { x: 225, y: 140 }, C6: { x: 280, y: 140 }, C7: { x: 335, y: 140 }, J3: { x: 400, y: 140 },
  // F: the SIM and 1.5 V options, test points
  J4: { x: 60, y: 70 }, U3: { x: 150, y: 70 }, C8: { x: 215, y: 70 }, C9: { x: 270, y: 70 },
  TP5: { x: 325, y: 70 }, TP6: { x: 375, y: 70 }, TP7: { x: 425, y: 70 },
  // G: console-free row: last test point and the power indicator
  TP8: { x: 40, y: 25 }, R1: { x: 100, y: 25 }, LED1: { x: 155, y: 25 },
};

export const SCHEM_NOTES = [
  { x: 20, y: 452, size: 3.4, layer: 97, text: 'WiMAX CPE Wallplug — mains-powered Mini Card carrier for an IEEE 802.16e modem, USB 2.0 to the host' },
  { x: 20, y: 444, size: 2.2, layer: 97, text: 'MAINS (row A): L → F1 → PS1.2 (MPM-20-12 AC/L), N → PS1.1 (AC/N), MOV1 across L-N after the fuse. PE is not bonded to SELV ground.' },
  { x: 20, y: 439, size: 2.2, layer: 97, text: '12 V → U1 LM2576S-3.3 → 3.3 V. The card may take 1100 mA at 3.3 V (PEAK Systems adapter rating); the EM spec allows 0.50 A per power contact and there are five of them.' },
  { x: 20, y: 296, size: 2.2, layer: 97, text: 'CARD (row D): Intel Centrino Advanced-N + WiMAX 6250, half Mini Card, 3.3 V, 802.16e-2005 Wave 2 on 2.3/2.5/3.5 GHz.' },
  { x: 20, y: 291, size: 2.2, layer: 97, text: 'Its WiMAX side is USB 2.0 (pins 36/38) and its Wi-Fi side is PCI Express. This carrier has no PCIe root complex, so REFCLK±, PERp0/PERn0, PETp0 and CLKREQ# stay open' },
  { x: 20, y: 286, size: 2.2, layer: 97, text: 'and only the WiMAX radio runs. That is a property of the card, not a layout mistake — a PCIe host would be needed for the 802.11 half.' },
  { x: 20, y: 281, size: 2.2, layer: 97, text: 'W_DISABLE# / W_DISABLE2# are pulled up and switched by SW4: the EM spec makes the radio-disable signal mandatory for RF cards and asks for a pull-up.' },
  { x: 20, y: 176, size: 2.2, layer: 97, text: 'USB (row E): J3 is the upstream port. VBUS is deliberately not connected — the board is mains-powered and tying host VBUS to a rail would back-feed the host.' },
  { x: 20, y: 171, size: 2.2, layer: 97, text: 'Antennas: the card has its own Hirose U.FL-R-SMT jacks (U.FL-LP-066 cables). Two SMA bulkhead pigtails are enclosure items; keep the card\'s antenna end clear of copper.' },
  { x: 20, y: 100, size: 2.2, layer: 97, text: 'OPTIONS (row F): J4 micro-SIM on the UIM pins and U3 AMS1117-1.5 for the +1.5 V rail are both DNP — an LTE mini-PCIe card swap-in needs the SIM, the Intel 6250 needs neither.' },
];

export const BOARD_NOTES = [
  { x: 2, y: 88, size: 1.8, layer: 21, text: 'WiMAX CPE Wallplug rev A — 140 x 90 mm, 2 layers, 1.6 mm FR-4' },
  { x: 2, y: 85.5, size: 1.2, layer: 21, text: 'MAINS: L → F1 → PS1.2 ; N → PS1.1 ; MOV1 across L-N after F1' },
  { x: 62, y: 88, size: 1.4, layer: 21, text: 'HAZARDOUS VOLTAGE — 6.4 mm creepage to all SELV copper' },
  { x: 62, y: 85.5, size: 1.2, layer: 21, text: 'Barrier line: no copper crosses it except inside PS1' },
  { x: 76, y: 14, size: 1.2, layer: 21, text: 'Mini Card socket: pin 1 at the left, half-size card extends 26.8 mm toward +Y' },
  { x: 108, y: 84, size: 1.2, layer: 21, text: 'U1 tab is GND — copper area here' },
];

export const BARRIER = { x1: 60, y1: 34, x2: 60, y2: 90 };

/**
 * Card outline and RF keep-out, drawn in silkscreen: the half Mini Card is
 * 30 x 26.8 mm and its two U.FL jacks sit at the far end from the socket, so that
 * end wants no copper and no metal above it.
 */
export const BOARD_LINES = [
  // card outline from the socket (U2 at 86,20: socket pads at local y -1.375,
  // card runs to local y +26.8)
  { x1: 74.85, y1: 18.6, x2: 105.15, y2: 18.6, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 105.15, y1: 18.6, x2: 105.15, y2: 47.05, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 105.15, y1: 47.05, x2: 74.85, y2: 47.05, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 74.85, y1: 47.05, x2: 74.85, y2: 18.6, layer: 21, width: 0.2, style: 'shortdash' },
  // RF keep-out over the card's antenna end (its U.FL jacks live there)
  { x1: 76, y1: 40, x2: 104, y2: 40, layer: 41, width: 0.2 },
  { x1: 76, y1: 46, x2: 104, y2: 46, layer: 41, width: 0.2 },
  { x1: 76, y1: 40, x2: 76, y2: 46, layer: 41, width: 0.2 },
  { x1: 104, y1: 40, x2: 104, y2: 46, layer: 41, width: 0.2 },
  { x1: 77, y1: 43, x2: 103, y2: 43, layer: 21, width: 0.15, style: 'longdash' },
];

export const POUR = { x1: 62, y1: 0.8, x2: 139.2, y2: 89.2 };

export const pinAbsolute = makePinAbsolute(SYMBOLS);

export const BOM_INTRO = `U2 is the socket; the card is a separate purchase. The reference card is an
Intel Centrino Advanced-N + WiMAX 6250 (622ANXHMW / 622ANHMW), half Mini Card,
3.3 V, two U.FL antenna jacks. Its WiMAX radio is USB, so the host connection is
J3 (micro-USB upstream) — a Raspberry Pi's OTG port or a PC works.

Enclosure items, not board parts: 2 x U.FL-LP-066 → SMA bulkhead pigtails and two
2.5 GHz-band antennas (the card's diversity antennas connect to the U.FL jacks on
the card itself).

DNP by default: J4 (micro-SIM on the UIM pins) and U3 + C8 + C9 (the +1.5 V rail).
Fit them only for a card that needs a SIM or 1.5 V — an LTE mini-PCIe module is the
realistic 2026 swap-in, since WiMAX networks themselves are gone (see the design
notes).`;

export const SAFETY_NOTES = [
  `PS1 (MEAN WELL MPM-20-12, 20 W) provides the isolation; the PCB keeps ${BOARD.creepageMm} mm creepage / ${BOARD.clearanceMm} mm clearance between mains and SELV copper, enforced by \`--check\`.`,
  'Fuse F1 is in the line conductor only; MOV1 sits after the fuse. PE lands on J1.3 and a test point and is not bonded to SELV ground.',
  'The card is a 3.3 V part with no 5 V tolerance; the EM spec rates each power contact at 0.50 A continuous and this board feeds all five 3.3 V contacts from a 3 A buck.',
  'A radio transmitter in a wallplug has regulatory consequences beyond safety: W_DISABLE# must be reachable (SW4), and the antenna keep-out on the silkscreen is part of the RF design, not decoration.',
  'This is a design study, not a certified product. Mains products need IEC/EN 62368-1 assessment; radio products need the RED/FCC assessment of the *card*, which this carrier does not change but does mount.',
];
