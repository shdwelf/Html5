/**
 * plc-bridge-model.mjs — "Powerline Bridge": a mains-powered wallplug that puts
 * Ethernet frames on the building's power wiring (HomePlug Green PHY) and hands
 * them to a wired 10/100 port.
 *
 * Signal chain
 *   L/N ─┬─ F1 ─ MOV1 ─ PS1 (IRM-05-5, isolated 5 V) ─ FB1 ─ U1 (LM2576S-3.3) ─ 3V3
 *        └─────────────────────────────────────────── U2 pins 15/16/17 (L/N)
 *   U2 = chargebyte PLC Stamp mini 2 (QCA7005, HomePlug Green PHY, SPI slave)
 *   U3 = ESP32-WROOM-32E, SPI master on two buses:
 *          HSPI (IO14/12/13/15 + IO4 INT)  → U2  (SPI mode 3, ≤ 12 MHz)
 *          VSPI (IO18/19/23/5  + IO33 INT) → U4  (WIZnet WIZ850io = W5500 + magnetics + RJ45)
 *
 * Where the numbers come from
 *   PLC Stamp mini 2 datasheet rev 13 (chargebyte GmbH, 2023-10-13):
 *     §3    3.3 V, 0.5 W, 10 Mbit/s, 300 m reach, 43.5 x 22 x 6.5 mm, 5.6 g
 *     §8.2  VDD 3.13-3.46 V, IDD 150 mA average / 300 mA max, VAC 85-250 V,
 *           VDC to 380 V, mains frequency tolerance 48.5-51.5 / 57.9-62.1 Hz
 *     §8.3  isolation L/N ↔ everything else: 8 mm creepage / 6.5 mm clearance,
 *           4000 Vac test voltage  ←  BOARD.creepageMm below is 8.0 for this reason
 *     §10   pinout (table 3): 1-4 GPIO_0..3, 5 RESET_L, 6-10 SERIAL_4..0, 11 GND,
 *           12 VDD, 13 NC/ZC_IN, 14 not available, 15 N, 16 L, 17 L, 18-25 GND
 *     §10.1 boot straps (table 4) and post-boot GPIO roles (table 5)
 *     §10.2 SERIAL_x = SPI (0 INT, 1 CLK, 2 CS, 3 MISO, 4 MOSI) or UART;
 *           SPI Motorola mode 3 (CPOL=1, CPHA=1), burst CS, max 12 MHz
 *     §12.1 CE Class B / North America variant: transformer 1:4:5 and zero-cross
 *           detection on the module, ZC_IN (pin 13) left floating
 *     §12.2 automotive variants are NOT for mains: tie 16/17 to GND, use 15 only
 *     §13   IPC/JEDEC J-STD-020 / J-STD-033, at most 2 reflows; MSL 3 (§6)
 *     fig 3 GPIO LED bootstrap: 3.3 kΩ in series
 *     fig 4 GPIO switch bootstrap: 100 Ω series, 10 kΩ pull-up, 100 pF across the switch
 *     fig 6 external zero-cross circuit (automotive variants only): 2200 pF, 820 kΩ,
 *           CGRM4007-G, TCLT100x optocoupler, 100 Ω, 39 kΩ, 220 nF, 1000 pF, 1 µF
 *     §15   order codes: I2PLCBMN-ISC-004-T = QCA7005, industrial, SPI, CE Class B,
 *           transformer I2PLCTR-1 and zero-cross on the module, tray of 20
 *   WIZnet WIZ850io datasheet v1.0: J1 1 GND, 2 GND, 3 MOSI, 4 SCLK, 5 SCNn,
 *     6 INTn; J2 1 GND, 2 3.3 V, 3 3.3 V, 4 NC, 5 RSTn (≥ 500 µs low), 6 MISO;
 *     VDD 2.97-3.63 V, IDD 141 mA typ, 13 mA power-down, -40…85 °C, 23 x 25.75 mm
 *   Espressif ESP32-WROOM-32(E): pin numbers/names from the KiCad official symbol.
 *   PIONIX EVerest reference hardware (github.com/PionixPublic/reference-hardware,
 *     Yak/powerline.kicad_sch) is the published precedent for a Green PHY modem on a
 *     Raspberry Pi carrier; its netlist gave the SPI wiring pattern
 *     (PLC_SCK/PLC_MISO/PLC_MOSI/PLC_CS/PLC_INT) reproduced here. Note that PIONIX
 *     fitted the *automotive* variant and tied pins 16/17 to GND — that board is
 *     coupled to the control pilot, not to mains. This one uses the CE Class B
 *     variant and connects 16/17 to L and N, per §12.1.
 *   qca/open-plc-utils (Qualcomm Atheros Open Powerline Toolkit) and
 *     uhi22/wt32eth01-ethernet-to-qca7000-bridge are the software precedents for
 *     bridging a QCA7000's SPI slave interface to Ethernet frames.
 *
 * Units mm, EAGLE orientation (y up). Generated files land in
 * hardware/plc-bridge/.
 */

import {
  FAMILY_PACKAGES, FAMILY_SYMBOLS, FAMILY_DEVICESETS, mainsBlock, buckBlock,
  powerLed, merge, PI40_NAMES,
} from './eda-blocks.mjs';
import {
  rotPt, padAbs, courtAbs, symbolBBox, stubDir, makePinAbsolute, STUB, rnd,
  pick, grid, rows, budgetCheck, PACKAGE_SOURCES,
} from './eda-core.mjs';

export { rotPt, padAbs, courtAbs, symbolBBox, stubDir, STUB, rnd, PACKAGE_SOURCES };

export const TITLE = 'Powerline Bridge';
export const MODEL_PATH = 'tools/plc-bridge-model.mjs';
export const DESCRIPTION = 'mains-powered HomePlug Green PHY (QCA7005) ↔ 10/100 Ethernet bridge: PLC Stamp mini 2 + ESP32 SPI host + WIZ850io';
export const DOC_REF = 'see docs/wimax-pi-powerline-variants-2026-10-08.md';

/* ------------------------------------------------------------------- board */

export const BOARD = {
  name: 'plc-bridge',
  rev: 'A',
  w: 160,
  h: 100,
  layers: 2,
  thickness: 1.6,
  edgeClearance: 1.5,
  zones: {
    mains: { x1: 0, y1: 24, x2: 64, y2: 100 },
    selv: { x1: 60, y1: 0, x2: 160, y2: 100 },
  },
  // PLC Stamp mini 2 datasheet §8.3: 8 mm creepage / 6.5 mm clearance between the
  // L/N terminals and every other connection, 4000 Vac isolation test. The board
  // inherits the module's figure — it is stricter than the 6.4 mm the xPort
  // wallplug uses for its AC/DC module.
  creepageMm: 8.0,
  clearanceMm: 6.5,
  mountingHoles: [{ x: 4, y: 4 }, { x: 156, y: 4 }, { x: 4, y: 96 }, { x: 156, y: 96 }],
};

/* --------------------------------------------------------------- registries */

const PKG_NAMES = [
  // generics carried over from the xPort wallplug library
  'R-7.62', 'C-5.08', 'CP-D10-P5', 'CP-D6.3-P2.5', 'FB-7.62', 'FUSE-RADIAL',
  'MOV07', 'LED-5MM', 'SW-TACT-6MM', 'TP', 'MOUNT-M3', 'HDR-2X5',
  // imported footprints
  'CUI_TB003', 'IRM055', 'LM2576S', 'LRAD12', 'PLCSTAMP', 'ESP32WROOM',
  'WIZ850IO', 'R0603', 'C0603',
  // hand-drawn in tools/eda-blocks.mjs
  'DO41',
];
export const PACKAGES = pick(FAMILY_PACKAGES, PKG_NAMES);

const SYM_NAMES = [
  'R-EU', 'C-EU', 'CPOL-EU', 'FERRITE', 'FUSE', 'MOV', 'LED',
  'SW-PUSH', 'TP', 'HDR-2X5',
  'ACDC-4', 'BUCK-3V3', 'DIODE', 'INDUCTOR', 'TERM-3',
  'PLCSTAMP', 'ESP32-WROOM', 'WIZ850IO',
];
export const SYMBOLS = pick(FAMILY_SYMBOLS, SYM_NAMES);

const DS_NAMES = [
  'R-EU', 'C-EU', 'CPOL-EU', 'FERRITE', 'FUSE', 'MOV', 'LED',
  'SW-PUSH', 'TP', 'HDR-2X5', 'MOUNT-M3',
  'ACDC-5V', 'BUCK-3V3', 'DIODE-SCH', 'L-RADIAL', 'TERM-3', 'R-0603', 'C-0603',
  'PLC-STAMP-MINI-2', 'ESP32-WROOM-32E', 'WIZ850IO',
];
export const DEVICESETS = pick(FAMILY_DEVICESETS, DS_NAMES);

/* -------------------------------------------------------------------- parts */

const blocks = merge(
  mainsBlock({ psValue: 'IRM-05-5', fuse: 'T630mA/250V' }),
  buckBlock({ cin: '470uF/10V' }),
  powerLed({ r: 'R1', led: 'LED1' }, 'PWR green'),
);

/** ref → what it is, for the BOM. Zones drive the creepage checker. */
const EXTRA_PARTS = [
  // ---- the powerline modem -------------------------------------------------
  {
    ref: 'U2', set: 'PLC-STAMP-MINI-2', value: 'I2PLCBMN-ISC-004-T', zone: 'selv',
    padZones: { 15: 'mains', 16: 'mains', 17: 'mains' },
    note: 'chargebyte PLC Stamp mini 2: QCA7005 HomePlug Green PHY, SPI, transformer I2PLCTR-1 (1:4:5) and zero-cross detection on the module (datasheet §12.1). Pads 15/16/17 are the mains coupling and stay 8 mm from every other pad (§8.3).',
  },
  { ref: 'R2', set: 'R-EU', value: '10k', zone: 'selv', dnp: true, note: 'ZC_IN pull-down — only for DC-line coupling (datasheet §8.2 note 2); the mains variant leaves pin 13 floating (§12.1)' },
  { ref: 'R5', set: 'R-EU', value: '3k3', zone: 'selv', note: 'GPIO_0 LED bootstrap, 3.3 kΩ per datasheet figure 3 (GPIO_0 = PLC connection established)' },
  { ref: 'LED2', set: 'LED', value: 'PLC link', zone: 'selv', note: 'lit when the Green PHY network is joined' },
  { ref: 'R6', set: 'R-EU', value: '3k3', zone: 'selv', note: 'GPIO_1 LED bootstrap (GPIO_1 = Simple Connect, blinks at 1 Hz while pairing)' },
  { ref: 'LED3', set: 'LED', value: 'PAIR amber', zone: 'selv', note: 'Simple Connect indicator' },
  { ref: 'R4', set: 'R-EU', value: '10k', zone: 'selv', note: 'GPIO_3 pull-up, datasheet figure 4' },
  { ref: 'R3', set: 'R-EU', value: '100R', zone: 'selv', note: 'GPIO_3 series resistor, datasheet figure 4' },
  { ref: 'C5', set: 'C-EU', value: '100pF', zone: 'selv', note: 'GPIO_3 switch debounce, datasheet figure 4' },
  { ref: 'SW3', set: 'SW-PUSH', value: 'PAIR', zone: 'selv', note: 'GPIO_3 pushbutton: 0.5-3 s Simple Connect, 5-8 s randomise NMK, 10-15 s factory defaults (datasheet table 5)' },

  // ---- SPI host ------------------------------------------------------------
  { ref: 'U3', set: 'ESP32-WROOM-32E', value: 'ESP32-WROOM-32E', zone: 'selv', note: 'SPI master for both the modem (mode 3, ≤ 12 MHz) and the W5500; keep the antenna end (package +Y) clear of copper and of the enclosure wall' },
  { ref: 'C6', set: 'C-0603', value: '100nF', zone: 'selv', note: 'U3 EN delay / decoupling' },
  { ref: 'C7', set: 'C-0603', value: '100nF', zone: 'selv', note: 'U3 3.3 V decoupling' },
  { ref: 'R7', set: 'R-EU', value: '10k', zone: 'selv', note: 'EN pull-up' },
  { ref: 'R8', set: 'R-EU', value: '10k', zone: 'selv', note: 'IO0 pull-up: high = run, low = download boot' },
  { ref: 'R10', set: 'R-EU', value: '10k', zone: 'selv', note: 'IO15 pull-down — IO15 is a strapping pin (MTDO); held low at reset so the ROM does not print boot messages on the PLC chip-select line' },
  { ref: 'SW1', set: 'SW-PUSH', value: 'RESET', zone: 'selv', note: 'EN to GND' },
  { ref: 'SW2', set: 'SW-PUSH', value: 'BOOT', zone: 'selv', note: 'IO0 to GND, hold while resetting to enter the UART bootloader' },
  { ref: 'J2', set: 'HDR-2X5', value: 'PROG', zone: 'selv', note: '3V3 GND TXD0 RXD0 EN IO0 + spares — flash the bridge firmware over UART0' },

  // ---- wired side ----------------------------------------------------------
  { ref: 'U4', set: 'WIZ850IO', value: 'WIZ850io', zone: 'selv', edge: 'right', note: 'WIZnet W5500 + magnetics + RJ45 in one module: 3.3 V, 141 mA typ, SPI mode 0/3. The RJ45 nose overhangs the board edge.' },
  { ref: 'R9', set: 'R-EU', value: '10k', zone: 'selv', note: 'WIZ850io RSTn pull-up (the module wants ≥ 500 µs low to reset)' },
  { ref: 'C8', set: 'C-0603', value: '100nF', zone: 'selv', note: 'U4 3.3 V decoupling' },

  // ---- test points and hardware --------------------------------------------
  { ref: 'TP5', set: 'TP', value: 'PLC RESET', zone: 'selv', note: '' },
  { ref: 'H1', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H2', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H3', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
  { ref: 'H4', set: 'MOUNT-M3', value: '', zone: 'selv', boardOnly: true, note: 'M3 mounting hole' },
];

export const PARTS = [...blocks.parts, ...EXTRA_PARTS];

/* ------------------------------------------------------------------- netlist */

const BLOCK_NETS = blocks.nets;

export const NETS = {
  ...BLOCK_NETS,

  // the modem couples straight onto the incoming mains: fused L and N
  AC_L_F: [...BLOCK_NETS.AC_L_F, ['U2', 'L']],
  AC_N: [...BLOCK_NETS.AC_N, ['U2', 'N']],

  // ---- HSPI: ESP32 master → QCA7005 slave (mode 3, burst CS, ≤ 12 MHz) ----
  PLC_SCLK: [['U3', 'IO14'], ['U2', 'SERIAL_1']],
  PLC_MISO: [['U3', 'IO12'], ['U2', 'SERIAL_3']],
  PLC_MOSI: [['U3', 'IO13'], ['U2', 'SERIAL_4']],
  PLC_CS: [['U3', 'IO15'], ['U2', 'SERIAL_2'], ['R10', '1']],
  PLC_INT: [['U3', 'IO4'], ['U2', 'SERIAL_0']],
  PLC_RESET: [['U3', 'IO32'], ['U2', 'RESET_L'], ['TP5', '1']],

  // ---- GPIO bootstrap (datasheet figures 3 and 4, tables 4 and 5) ----
  PLC_GPIO0: [['U2', 'GPIO_0'], ['R5', '1']],
  LED2_A: [['R5', '2'], ['LED2', 'A']],
  PLC_GPIO1: [['U2', 'GPIO_1'], ['R6', '1']],
  LED3_A: [['R6', '2'], ['LED3', 'A']],
  PLC_GPIO3: [['U2', 'GPIO_3'], ['R4', '2'], ['R3', '2']],
  SW3_N: [['R3', '1'], ['SW3', '1'], ['C5', '1']],
  ZC_IN: [['U2', 'ZC_IN'], ['R2', '1']],

  // ---- VSPI: ESP32 master → WIZ850io ----
  ETH_SCLK: [['U3', 'IO18'], ['U4', 'SCLK']],
  ETH_MISO: [['U3', 'IO19'], ['U4', 'MISO']],
  ETH_MOSI: [['U3', 'IO23'], ['U4', 'MOSI']],
  ETH_CS: [['U3', 'IO5'], ['U4', '!SCS']],
  ETH_INT: [['U3', 'IO33'], ['U4', '!INT']],
  ETH_RST: [['U3', 'IO26'], ['U4', '!RST'], ['R9', '2']],

  // ---- ESP32 strapping, reset and console ----
  ESP_EN: [['U3', 'EN'], ['R7', '1'], ['C6', '1'], ['SW1', '1'], ['J2', '5']],
  ESP_IO0: [['U3', 'IO0'], ['R8', '1'], ['SW2', '1'], ['J2', '6']],
  ESP_TXD0: [['U3', 'TXD0'], ['J2', '3']],
  ESP_RXD0: [['U3', 'RXD0'], ['J2', '4']],

  // ---- rails the blocks did not cover ----
  '3V3': [
    ...BLOCK_NETS['3V3'],
    ['U2', 'VDD'], ['R4', '1'], ['R7', '2'], ['R8', '2'], ['R9', '1'],
    ['U3', 'VDD'], ['C7', '1'], ['U4', '3V3'], ['C8', '1'], ['J2', '1'], ['R1', '1'],
  ],
  GND: [
    ...BLOCK_NETS.GND,
    ['U2', 'GND'], ['LED2', 'K'], ['LED3', 'K'], ['SW3', '2'], ['C5', '2'], ['R2', '2'],
    ['R10', '2'], ['U3', 'GND_1'], ['U3', 'GND_15'], ['U3', 'GND_38'], ['U3', 'GND_39'],
    ['C6', '2'], ['C7', '2'], ['SW1', '2'], ['SW2', '2'], ['J2', '2'],
    ['U4', 'GND'], ['C8', '2'],
  ],
};

/** Pins that are deliberately open, with the reason. */
export const UNCONNECTED = [
  ['U1', 'FB'],          // LM2576S-3.3 bonds the feedback pin inside the package
  ['U2', 'GPIO_2'],      // unused in the module's default configuration (table 5)
  ['U3', 'SENSOR_VP'], ['U3', 'SENSOR_VN'],
  ['U3', 'IO34'], ['U3', 'IO35'], ['U3', 'IO25'], ['U3', 'IO27'],
  ['U3', 'IO21'], ['U3', 'IO22'], ['U3', 'IO16'], ['U3', 'IO17'], ['U3', 'IO2'],
  ['U3', 'NC_17'], ['U3', 'NC_18'], ['U3', 'NC_19'], ['U3', 'NC_20'],
  ['U3', 'NC_21'], ['U3', 'NC_22'], ['U3', 'NC_32'],
  ['U4', 'NC'],
  ['J2', '7'], ['J2', '8'], ['J2', '9'], ['J2', '10'],
];

/** Net → EAGLE class: 1 = mains, 2 = power rail, 0 = signal. */
export const NET_CLASS = {
  AC_L: 1, AC_L_F: 1, AC_N: 1, PE: 1,
  '5V_P': 2, '5V': 2, '3V3': 2, GND: 2, SW_3V3: 2,
};

/* ------------------------------------------------------ power budget (mA) */

/**
 * Every figure is the datasheet maximum, not a typical value, so the budget is a
 * worst case: tests/23 fails if a rail is oversubscribed.
 */
export const POWER_BUDGET = [
  {
    rail: '5V', supplyMA: 1000,   // MEAN WELL IRM-05-5: 5 W / 5 V
    loads: [
      // 3.3 V x 0.70 A = 2.31 W out; the LM2576 is ~77 % efficient at this point,
      // so the 5 V side sees about 3.0 W = 600 mA.
      { what: 'U1 buck input: 3.3 V x 0.70 A / 0.77 efficiency / 5 V', mA: 600 },
    ],
  },
  {
    rail: '3V3', supplyMA: 3000,  // LM2576S-3.3, 3 A
    loads: [
      { ref: 'U2', what: 'PLC Stamp mini 2, IDD max 300 mA (datasheet §8.2)', mA: 300 },
      { ref: 'U3', what: 'ESP32-WROOM-32E as an SPI host with the radio OFF (Wi-Fi TX bursts would add ~300 mA — this board has an Ethernet port, it does not need the radio)', mA: 200 },
      { ref: 'U4', what: 'WIZ850io, IDD 141 mA typ + margin', mA: 180 },
      { what: 'LED1-LED3 and the bootstrap resistors', mA: 20 },
    ],
  },
];
export const POWER_BUDGET_REPORT = budgetCheck(POWER_BUDGET);

/* --------------------------------------------------- board placements (mm) */

export const PLACEMENT = {
  // ---- mains: terminal, fuse, varistor, isolated converter ----
  J1: { x: 12, y: 92, rot: 'R0' },
  F1: { x: 27, y: 92, rot: 'R0' },
  MOV1: { x: 37, y: 92, rot: 'R0' },
  TP3: { x: 47, y: 94, rot: 'R0' },
  PS1: { x: 32, y: 68, rot: 'R0' },    // IRM-05-5: AC pins at local -x, so R0 points them at the mains side

  // ---- the powerline modem, straddling the barrier: its L/N pads sit in the
  //      mains half, its host pads in the SELV half, like the module's own
  //      internal isolation ----
  U2: { x: 64, y: 26, rot: 'R0' },

  // ---- 5 V conditioning and the 3.3 V step-down ----
  FB1: { x: 72, y: 92, rot: 'R0' },
  C1: { x: 86, y: 90, rot: 'R0' },
  TP1: { x: 96, y: 94, rot: 'R0' },
  TP2: { x: 96, y: 88, rot: 'R0' },
  R1: { x: 68, y: 64, rot: 'R0' },
  LED1: { x: 76, y: 66, rot: 'R0' },
  U1: { x: 134, y: 88, rot: 'R0' },
  C2: { x: 94, y: 74, rot: 'R0' },
  D1: { x: 110, y: 74, rot: 'R0' },
  L1: { x: 128, y: 74, rot: 'R0' },
  C3: { x: 150, y: 74, rot: 'R0' },
  C4: { x: 140, y: 66, rot: 'R0' },
  TP4: { x: 140, y: 60, rot: 'R0' },

  // ---- modem bootstrap strip ----
  R2: { x: 56, y: 10, rot: 'R0' },
  R5: { x: 70, y: 10, rot: 'R0' },
  LED2: { x: 80, y: 10, rot: 'R0' },
  R6: { x: 90, y: 10, rot: 'R0' },
  LED3: { x: 100, y: 10, rot: 'R0' },
  R4: { x: 110, y: 10, rot: 'R0' },
  R3: { x: 120, y: 10, rot: 'R0' },
  C5: { x: 130, y: 10, rot: 'R0' },
  SW3: { x: 140, y: 8, rot: 'R0' },

  // ---- SPI host and its strapping ----
  U3: { x: 102, y: 28, rot: 'R0' },
  C6: { x: 70, y: 58, rot: 'R0' },
  C7: { x: 78, y: 58, rot: 'R0' },
  R7: { x: 88, y: 58, rot: 'R0' },
  R8: { x: 99, y: 58, rot: 'R0' },
  R10: { x: 110, y: 58, rot: 'R0' },
  SW1: { x: 121, y: 58, rot: 'R0' },
  SW2: { x: 132, y: 58, rot: 'R0' },
  J2: { x: 150, y: 58, rot: 'R0' },

  // ---- wired side ----
  U4: { x: 140, y: 30, rot: 'R0' },
  R9: { x: 122, y: 44, rot: 'R0' },
  C8: { x: 126, y: 50, rot: 'R0' },

  // ---- test points and mounting holes ----
  TP5: { x: 86, y: 44, rot: 'R0' },
  H1: { x: 4, y: 4, rot: 'R0' },
  H2: { x: 156, y: 4, rot: 'R0' },
  H3: { x: 4, y: 96, rot: 'R0' },
  H4: { x: 156, y: 96, rot: 'R0' },
};

/* ------------------------------------------------- schematic placement (mm) */

export const SHEET = { w: 480, h: 460, columns: 12, rows: 10 };

/**
 * Rows are spaced for the tallest symbol in each: the PLC module is 30.5 mm of
 * pin column and the ESP32 is 50.8 mm, and the generator adds the 5.08 mm wire
 * stub plus its label to every instance box before it tests for overlaps.
 */
export const SCHEM_PLACEMENT = {
  // A: mains input
  J1: { x: 40, y: 430 }, F1: { x: 110, y: 430 }, MOV1: { x: 180, y: 430 },
  PS1: { x: 260, y: 430 }, TP3: { x: 350, y: 430 },
  // B: 5 V conditioning
  FB1: { x: 40, y: 380 }, C1: { x: 100, y: 380 }, TP1: { x: 160, y: 380 }, TP2: { x: 210, y: 380 },
  // C: the 3.3 V step-down
  U1: { x: 50, y: 330 }, L1: { x: 130, y: 330 }, D1: { x: 200, y: 330 },
  C2: { x: 265, y: 330 }, C3: { x: 325, y: 330 }, C4: { x: 385, y: 330 }, TP4: { x: 435, y: 330 },
  // D: the powerline modem and its bootstrap
  U2: { x: 70, y: 255 }, R2: { x: 160, y: 255 }, R5: { x: 215, y: 255 },
  LED2: { x: 270, y: 255 }, R6: { x: 325, y: 255 }, LED3: { x: 380, y: 255 }, R4: { x: 435, y: 255 },
  R3: { x: 160, y: 215 }, C5: { x: 215, y: 215 }, SW3: { x: 270, y: 215 }, TP5: { x: 330, y: 215 },
  // E: the two SPI peripherals
  U3: { x: 70, y: 140 }, U4: { x: 250, y: 140 },
  // F: host support
  C6: { x: 40, y: 70 }, C7: { x: 95, y: 70 }, R7: { x: 150, y: 70 }, R8: { x: 205, y: 70 },
  R10: { x: 260, y: 70 }, SW1: { x: 315, y: 70 }, SW2: { x: 370, y: 70 }, C8: { x: 425, y: 70 },
  // G: console, Ethernet pull-up, power indicator
  J2: { x: 50, y: 25 }, R9: { x: 130, y: 25 }, R1: { x: 200, y: 25 }, LED1: { x: 255, y: 25 },
};

export const SCHEM_NOTES = [
  { x: 20, y: 452, size: 3.4, layer: 97, text: 'Powerline Bridge — HomePlug Green PHY (QCA7005) on the mains wiring, bridged to 10/100 Ethernet by an ESP32' },
  { x: 20, y: 444, size: 2.2, layer: 97, text: 'MAINS (row A): L → F1 → PS1.1 and → U2 pin 16/17 (L); N → PS1.2 and U2 pin 15 (N). MOV1 across L-N after the fuse. PE is not bonded to SELV ground.' },
  { x: 20, y: 439, size: 2.2, layer: 97, text: 'U2 is a chargebyte PLC Stamp mini 2, order code I2PLCBMN-ISC-004-T: QCA7005, SPI, transformer 1:4:5 and zero-cross on the module (§12.1).' },
  { x: 20, y: 434, size: 2.2, layer: 97, text: 'Isolation is inside U2 — 4000 Vac, 8 mm creepage / 6.5 mm clearance between L/N and everything else (§8.3). This board keeps 8.0 mm, checked by --check.' },
  { x: 20, y: 429, size: 2.2, layer: 97, text: 'AUTOMOTIVE VARIANTS (I2PLCBMN-ISE/ISP-*) ARE NOT FOR MAINS (§12.2): they tie pins 16/17 to GND and couple through pin 15 only. Do not fit one here.' },
  { x: 20, y: 296, size: 2.2, layer: 97, text: 'SERIAL_x roles (§10.2 table 6): 0 INT, 1 CLK, 2 CS, 3 MISO, 4 MOSI. SPI Motorola mode 3 (CPOL=1, CPHA=1), CS held low for the whole message, max 12 MHz.' },
  { x: 20, y: 291, size: 2.2, layer: 97, text: 'GPIO boot straps (§10.1 table 4): GPIO_0 boot source, GPIO_1 host interface (10 kΩ pull-down preloaded on the module), GPIO_2 SPI burst/legacy, GPIO_3 none.' },
  { x: 20, y: 286, size: 2.2, layer: 97, text: 'After boot (§10.1 table 5): GPIO_0 = PLC link LED, GPIO_1 = Simple Connect blink, GPIO_3 = pushbutton (0.5-3 s pair, 5-8 s NMK, 10-15 s factory defaults).' },
  { x: 20, y: 281, size: 2.2, layer: 97, text: 'LED bootstrap is 3.3 kΩ in series (figure 3); switch bootstrap is 100 Ω series + 10 kΩ pull-up + 100 pF across the switch (figure 4).' },
  { x: 20, y: 176, size: 2.2, layer: 97, text: 'U3 is the SPI master on two buses: HSPI → U2 (the modem is a SPI slave), VSPI → U4 (WIZ850io). IO15 carries a 10 kΩ pull-down because it is a strapping pin.' },
  { x: 20, y: 171, size: 2.2, layer: 97, text: 'Firmware precedent: qca/open-plc-utils (plctool/slac) and uhi22/wt32eth01-ethernet-to-qca7000-bridge, which bridges a QCA7000 SPI slave to Ethernet frames.' },
  { x: 20, y: 100, size: 2.2, layer: 97, text: 'Green PHY is 10 Mbit/s and shares the medium with HomePlug AV/AV2; it does NOT interoperate with ITU-T G.hn (different FEC: turbo coding vs LDPC).' },
];

export const BOARD_NOTES = [
  { x: 2, y: 98, size: 1.8, layer: 21, text: 'Powerline Bridge rev A — 160 x 100 mm, 2 layers, 1.6 mm FR-4' },
  { x: 2, y: 95.5, size: 1.2, layer: 21, text: 'MAINS: L → F1 → PS1.1 and U2.16/17 ; N → PS1.2 and U2.15 ; MOV1 after F1' },
  { x: 66, y: 98, size: 1.4, layer: 21, text: 'HAZARDOUS VOLTAGE — 8.0 mm creepage / 6.5 mm clearance to all SELV copper' },
  { x: 66, y: 95.5, size: 1.2, layer: 21, text: 'Creepage figure from PLC Stamp mini 2 datasheet §8.3 (4000 Vac isolation)' },
  { x: 2, y: 20, size: 1.2, layer: 21, text: 'U2 pads 15/16/17 are mains: keep this corner free of every other pad' },
  { x: 92, y: 4, size: 1.2, layer: 21, text: 'U3 antenna end (+Y) — no copper, no enclosure wall within 10 mm' },
  { x: 126, y: 12, size: 1.2, layer: 21, text: 'U4 RJ45 nose overhangs the right edge' },
];

/** Silkscreen + tRestrict barrier between the mains and SELV halves. */
export const BARRIER = { x1: 64, y1: 44, x2: 64, y2: 100 };

/**
 * The barrier continues through the modem's own body: U2 is the isolation
 * boundary there, so the line is drawn dashed over the module and a keep-out is
 * drawn around its three mains pads (8 mm moat, per datasheet §8.3).
 */
export const BOARD_LINES = [
  { x1: 64, y1: 0.8, x2: 64, y2: 44, layer: 21, width: 0.4, style: 'shortdash' },
  // 8 mm keep-out around U2's mains coupling pads (module at 64,26; pads at
  // local x -20.16/-18.89/-8.73, y +10.235)
  { x1: 35.8, y1: 28.2, x2: 63.3, y2: 28.2, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 35.8, y1: 44.2, x2: 63.3, y2: 44.2, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 35.8, y1: 28.2, x2: 35.8, y2: 44.2, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 63.3, y1: 28.2, x2: 63.3, y2: 44.2, layer: 21, width: 0.2, style: 'shortdash' },
  { x1: 36.5, y1: 26.5, x2: 62.5, y2: 26.5, layer: 41, width: 0.2 },
];

/** Ground pour: SELV half only, clear of the barrier and of the module's L/N end. */
export const POUR = { x1: 66, y1: 0.8, x2: 159.2, y2: 99.2 };

export const pinAbsolute = makePinAbsolute(SYMBOLS);

export const BOM_INTRO = `Fit the CE Class B / North America variant of the modem (order code
I2PLCBMN-ISC-004-T or -R for tape and reel): it carries the 1:4:5 PLC
transformer and the zero-cross detector on the module, and its pin 13 stays
floating. The automotive EVSE/PEV variants (…-ISE-…, …-ISP-…) have a 1:1:1
transformer, need the external zero-cross circuit of datasheet figure 6, and are
explicitly not for mains — do not fit one on this board.

R2 (ZC_IN pull-down) is DNP: it is only needed when the module is coupled to a DC
line, where the datasheet asks for ZC_IN tied low through 10 kΩ.

U4 is a WIZ850io module, so the magnetics, the RJ45 and the W5500's analogue
front end are all inside a part with a published datasheet. A chip-level
alternative (W5500 LQFP-48 plus a Hanrun HR911105A magjack) is listed in
tools/replacement-parts.mjs.`;

export const SAFETY_NOTES = [
  'U2 pins 15/16/17 are connected to the mains. The module provides the isolation (4000 Vac, 8 mm creepage / 6.5 mm clearance, datasheet §8.3); this board keeps 8.0 mm between those pads and every other pad, enforced by `--check`.',
  'PS1 (MEAN WELL IRM-05-5) is a certified encapsulated supply — EN60950-1 / UL60950-1, CB, CE, cURus, TUV — so the 5 V side is SELV. Its own isolation is inside the module.',
  'Fuse F1 is in the line conductor only; MOV1 sits after the fuse. PE lands on J1.3 and a test point and is never bonded to SELV ground on the PCB.',
  'The modem is MSL 3 and tolerates at most two reflows (datasheet §13, IPC/JEDEC J-STD-020 and J-STD-033).',
  'Green PHY shares the medium with HomePlug AV/AV2 and does not interoperate with ITU-T G.hn. Two standards on one phase degrade both; keep one family per circuit.',
  'This is a design study, not a certified product. A mains-connected PLC adapter needs IEC/EN 62368-1 assessment plus the PLC-specific coupling and emissions work (the module\'s CE Class B variant is the starting point, not the finish).',
];
