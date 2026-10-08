/**
 * eda-blocks.mjs — the parts library and the two circuit blocks that every board
 * in the wallplug family shares.
 *
 * Provenance rules used throughout:
 *   · pad geometry comes from tools/eda-packages.mjs, i.e. from a published KiCad
 *     footprint (see PACKAGE_SOURCES for repo + path);
 *   · pin *roles* come from a vendor datasheet or from a published open-hardware
 *     project's symbol/netlist, and each one is named in a comment;
 *   · anything I could not source is written as `NC` or left out, and the BOM or
 *     the design notes say so. Nothing here is a plausible guess presented as fact.
 *
 * Two blocks are reused verbatim by all three new designs:
 *   mainsBlock()  L/N/PE terminal → fuse → varistor → isolated AC/DC module
 *   buckBlock()   5 V → LM2576S-3.3 → 3.3 V, with the catch diode and reservoir
 */

import {
  box, nameValue, icSymbol, twoPinSymbol, pick, ds, IMPORTED, BASE_PACKAGES,
  BASE_SYMBOLS, BASE_DEVICESETS, rnd,
} from './eda-core.mjs';

/* ------------------------------------------------------------- hand packages */

const HAND = {};

HAND['DO41'] = {
  name: 'DO41',
  descr: 'DO-41 axial diode, 7.62 mm lead pitch (1N5822 / SS34-class Schottky)',
  courtyard: { x1: -5.0, y1: -1.8, x2: 5.0, y2: 1.8 },
  pads: [
    { name: 'A', x: -3.81, y: 0, drill: 0.9, diameter: 1.8 },
    { name: 'K', x: 3.81, y: 0, drill: 0.9, diameter: 1.8, shape: 'square' },
  ],
  silk: [
    { w: [{ x: -2.5, y: 1.3 }, { x: 2.5, y: 1.3 }], layer: 21 },
    { w: [{ x: 2.5, y: 1.3 }, { x: 2.5, y: -1.3 }], layer: 21 },
    { w: [{ x: 2.5, y: -1.3 }, { x: -2.5, y: -1.3 }], layer: 21 },
    { w: [{ x: -2.5, y: -1.3 }, { x: -2.5, y: 1.3 }], layer: 21 },
    { w: [{ x: 1.6, y: 1.3 }, { x: 1.6, y: -1.3 }], layer: 21 },   // cathode band
  ],
  texts: [{ x: -2.4, y: 1.9, size: 1.0, layer: 25, text: '>NAME' }],
};

HAND['MOUNT-M25'] = {
  name: 'MOUNT-M25',
  descr: 'M2.5 mounting hole, 2.75 mm drill — Raspberry Pi Zero 2 W corner holes',
  courtyard: { x1: -2.2, y1: -2.2, x2: 2.2, y2: 2.2 },
  pads: [],
  holes: [{ x: 0, y: 0, drill: 2.75 }],
  circles: [{ x: 0, y: 0, r: 2.0, layer: 21 }],
};

/** Package set: the xPort wallplug's verified generics + the imported footprints. */
export const FAMILY_PACKAGES = { ...BASE_PACKAGES, ...IMPORTED, ...HAND };
export const FAMILY_SYMBOLS = { ...BASE_SYMBOLS };
export const FAMILY_DEVICESETS = { ...BASE_DEVICESETS };

/* ------------------------------------------------------------------ symbols */

const SYM = {};

// Isolated AC/DC module: MEAN WELL IRM-05-5 (1 AC/L, 2 AC/N, 3 -Vo, 4 +Vo,
// pad names from the DehneEVSE footprint) and MPM-20-12 (PIONIX symbol:
// 1 AC/N, 2 AC/L, 3 +V, 4 -V). One symbol, two devicesets, per-part pad maps.
SYM['ACDC-4'] = icSymbol('ACDC-4', {
  w: 25.4, left: ['AC-L', 'AC-N'], right: ['+VO', '-VO'],
  texts: [
    { x: -8.0, y: 0, size: 1.6, layer: 94, ratio: 10, text: 'AC / DC' },
    { x: -8.0, y: -2.6, size: 1.3, layer: 94, ratio: 10, text: 'isolated' },
  ],
});

// LM2576S-3.3, TO-263-5. Pin roles per the LM2576 datasheet (1 VIN, 2 VOUT,
// 3 GND, 4 FB, 5 ON/OFF); on the fixed-3.3 V part FB is bonded inside the
// package, so the symbol keeps the pin and the design leaves it open.
SYM['BUCK-3V3'] = icSymbol('BUCK-3V3', {
  w: 20.32, left: ['VIN', 'FB'], right: ['VOUT', 'ONOFF'], bottom: ['GND'],
  texts: [{ x: -7.6, y: 0, size: 1.5, layer: 94, ratio: 10, text: 'LM2576' }],
});

// AMS1117-3.3 / LD1117S33, SOT-223: 1 GND, 2 VO (+ tab), 3 VI.
SYM['LDO-3V3'] = icSymbol('LDO-3V3', {
  w: 15.24, left: ['VI'], right: ['VO'], bottom: ['GND'],
  texts: [{ x: -5.0, y: 0, size: 1.5, layer: 94, ratio: 10, text: '1117' }],
});

SYM['DIODE'] = {
  name: 'DIODE',
  wires: [
    ...box(7.62, 5.08, 94, 0.254),
    { w: [{ x: -1.27, y: 1.27 }, { x: -1.27, y: -1.27 }], layer: 94, width: 0.254 },
    { w: [{ x: -1.27, y: 0 }, { x: 1.27, y: 1.27 }], layer: 94, width: 0.254 },
    { w: [{ x: 1.27, y: 1.27 }, { x: 1.27, y: -1.27 }], layer: 94, width: 0.254 },
    { w: [{ x: 1.27, y: -1.27 }, { x: -1.27, y: 0 }], layer: 94, width: 0.254 },
  ],
  texts: [...nameValue(7.62, 5.08)],
  pins: [
    { name: 'A', x: -7.62, y: 0, rot: 'R0', length: 'middle', direction: 'pas' },
    { name: 'K', x: 7.62, y: 0, rot: 'R180', length: 'middle', direction: 'pas' },
  ],
};

SYM['TERM-3'] = icSymbol('TERM-3', {
  w: 15.24, left: ['1', '2', '3'], lineSpacing: 5.08,
  texts: [{ x: -4.5, y: 0, size: 1.5, layer: 94, ratio: 10, text: 'TB3' }],
});

// 4-pad SMD crystal: 1 and 2 are the blank, 3 and 4 are the case (grounded).
SYM['XTAL'] = icSymbol('XTAL', {
  w: 12.7, left: ['1'], right: ['2'], bottom: ['3'], minH: 10.16,
  texts: [{ x: -4.5, y: 0, size: 1.4, layer: 94, ratio: 10, text: '25 MHz' }],
});

SYM['INDUCTOR'] = {
  name: 'INDUCTOR',
  wires: [
    ...box(10.16, 5.08, 94, 0.254),
    ...[-2.54, 0, 2.54].map((x) => ({ c: { x, y: 0.9, r: 1.27 }, layer: 94, width: 0.254 })),
  ],
  texts: [...nameValue(10.16, 5.08)],
  pins: [
    { name: '1', x: -10.16, y: 0, rot: 'R0', length: 'middle', direction: 'pas' },
    { name: '2', x: 10.16, y: 0, rot: 'R180', length: 'middle', direction: 'pas' },
  ],
};

SYM['COAX'] = icSymbol('COAX', {
  w: 12.7, left: ['SIG'], right: ['SH'], minH: 7.62,
});

SYM['ANT-CHIP'] = icSymbol('ANT-CHIP', {
  w: 12.7, left: ['FEED'], right: ['GND'], minH: 7.62,
});

// WIZnet WIZ850io: pin roles from the WIZ850io datasheet v1.0 —
// J1: 1 GND, 2 GND, 3 MOSI, 4 SCLK, 5 SCNn, 6 INTn
// J2: 1 GND, 2 3.3V, 3 3.3V, 4 NC, 5 RSTn, 6 MISO
// The footprint numbers the two rows 1-6 and 7-12, so J2 maps to 7-12.
SYM['WIZ850IO'] = icSymbol('WIZ850IO', {
  w: 22.86,
  left: ['MOSI', 'SCLK', '!SCS', '!INT', '!RST', 'MISO'],
  right: ['3V3', 'NC'],
  bottom: ['GND'],
  texts: [
    { x: -8.5, y: 0, size: 1.5, layer: 94, ratio: 10, text: 'WIZ850io' },
    { x: -8.5, y: -2.6, size: 1.2, layer: 94, ratio: 10, text: 'W5500 + magjack' },
  ],
});

// chargebyte PLC Stamp mini 2, pinout from datasheet rev 13 table 3:
// 1-4 GPIO_0..3, 5 RESET_L, 6-10 SERIAL_4..0, 11 GND, 12 VDD,
// 13 NC/ZC_IN, 14 not available, 15 N, 16 L, 17 L, 18-25 GND (assembly only).
// SERIAL_x roles from table 6: 0 INT, 1 CLK, 2 CS, 3 MISO, 4 MOSI.
SYM['PLCSTAMP'] = icSymbol('PLCSTAMP', {
  w: 30.48,
  left: ['GPIO_0', 'GPIO_1', 'GPIO_2', 'GPIO_3', 'RESET_L', 'SERIAL_4', 'SERIAL_3', 'SERIAL_2', 'SERIAL_1', 'SERIAL_0', 'ZC_IN'],
  right: ['VDD', 'N', 'L'],
  bottom: ['GND'],
  texts: [
    { x: -11.5, y: 0, size: 1.5, layer: 94, ratio: 10, text: 'PLC Stamp mini 2' },
    { x: -11.5, y: -2.6, size: 1.2, layer: 94, ratio: 10, text: 'QCA7005 Green PHY' },
  ],
});

// Espressif ESP32-WROOM-32(E), pin numbers and names from the KiCad official
// symbol (RF_Module/ESP32-WROOM-32). Repeated names get their pad number as a
// suffix because EAGLE pin names must be unique inside a symbol.
SYM['ESP32-WROOM'] = icSymbol('ESP32-WROOM', {
  w: 35.56,
  left: [
    'VDD', 'EN', 'SENSOR_VP', 'SENSOR_VN', 'IO34', 'IO35', 'IO32', 'IO33',
    'IO25', 'IO26', 'IO27', 'IO14', 'IO12', 'GND_15', 'IO13',
    'NC_17', 'NC_18', 'NC_19', 'NC_20', 'NC_21', 'NC_22',
  ],
  right: [
    'IO21', 'RXD0', 'TXD0', 'IO22', 'IO23', 'GND_38', 'GND_39', 'NC_32',
    'IO5', 'IO18', 'IO19', 'IO16', 'IO17', 'IO4', 'IO0', 'IO2', 'IO15', 'GND_1',
  ],
  texts: [
    { x: -14.0, y: 0, size: 1.5, layer: 94, ratio: 10, text: 'ESP32-WROOM-32E' },
    { x: -14.0, y: -2.6, size: 1.2, layer: 94, ratio: 10, text: 'SPI host' },
  ],
});

// Raspberry Pi 40-pin GPIO header, names from the Raspberry Pi GPIO map
// (cross-checked against PIONIX's PI40HAT/OX40HAT symbols, which agree).
const PI_ODD = [
  ['1', '3V3'], ['3', 'GPIO2'], ['5', 'GPIO3'], ['7', 'GPIO4'], ['9', 'GND'],
  ['11', 'GPIO17'], ['13', 'GPIO27'], ['15', 'GPIO22'], ['17', '3V3'],
  ['19', 'GPIO10'], ['21', 'GPIO9'], ['23', 'GPIO11'], ['25', 'GND'],
  ['27', 'GPIO0'], ['29', 'GPIO5'], ['31', 'GPIO6'], ['33', 'GPIO13'],
  ['35', 'GPIO19'], ['37', 'GPIO26'], ['39', 'GND'],
];
const PI_EVEN = [
  ['2', '5V'], ['4', '5V'], ['6', 'GND'], ['8', 'GPIO14'], ['10', 'GPIO15'],
  ['12', 'GPIO18'], ['14', 'GND'], ['16', 'GPIO23'], ['18', 'GPIO24'],
  ['20', 'GND'], ['22', 'GPIO25'], ['24', 'GPIO8'], ['26', 'GPIO7'],
  ['28', 'GPIO1'], ['30', 'GND'], ['32', 'GPIO12'], ['34', 'GND'],
  ['36', 'GPIO16'], ['38', 'GPIO20'], ['40', 'GPIO21'],
];
/** header pin → symbol pin name, unique (GND appears 8 times). */
/** header pin → symbol pin name; repeats (8 GND, 2 3V3, 2 5V) carry their pin number. */
export const PI40_NAMES = {};
{
  const used = new Set();
  for (const [num, fn] of [...PI_ODD, ...PI_EVEN]) {
    PI40_NAMES[num] = used.has(fn) ? `${fn}_${num}` : fn;
    used.add(fn);
  }
}
SYM['PI40'] = icSymbol('PI40', {
  w: 30.48,
  left: PI_ODD.map(([num]) => ({ name: PI40_NAMES[num], direction: 'pas' })),
  right: PI_EVEN.map(([num]) => ({ name: PI40_NAMES[num], direction: 'pas' })),
  texts: [
    { x: -12.0, y: 0, size: 1.5, layer: 94, ratio: 10, text: 'Raspberry Pi' },
    { x: -12.0, y: -2.6, size: 1.2, layer: 94, ratio: 10, text: 'Zero 2 W GPIO' },
  ],
});

// PCI Express Mini Card, signal names from the Mini Card Electromechanical
// Specification rev 1.2 (the pin table is reproduced by hardwarebook.info and
// by ARM's DSTREAM documentation, which agree).
const MPCIE_PINS = [
  ['1', 'WAKE#'], ['2', '3V3AUX'], ['3', 'COEX1'], ['4', 'GND'], ['5', 'COEX2'],
  ['6', '1V5'], ['7', 'CLKREQ#'], ['8', 'UIM_PWR'], ['9', 'GND'], ['10', 'UIM_DATA'],
  ['11', 'REFCLK-'], ['12', 'UIM_CLK'], ['13', 'REFCLK+'], ['14', 'UIM_RESET'],
  ['15', 'GND'], ['16', 'UIM_VPP'], ['17', 'RSVD_UIM_C8'], ['18', 'GND'],
  ['19', 'UIM_IC_DP'], ['20', 'W_DISABLE#'], ['21', 'GND'], ['22', 'PERST#'],
  ['23', 'PERn0'], ['24', '3V3AUX'], ['25', 'PERp0'], ['26', 'GND'],
  ['27', 'GND'], ['28', '1V5'], ['29', 'GND'], ['30', 'SMB_CLK'], ['31', 'GND'],
  ['32', 'SMB_DATA'], ['33', 'PETp0'], ['34', 'GND'], ['35', 'GND'],
  ['36', 'USB_D-'], ['37', 'GND'], ['38', 'USB_D+'], ['39', '3V3AUX'],
  ['40', 'GND'], ['41', '3V3AUX'], ['42', 'LED_WWAN#'], ['43', 'LED_WLAN#'],
  ['44', 'LED_WPAN#'], ['45', 'RSVD_45'], ['46', 'RSVD_46'], ['47', 'RSVD_47'],
  ['48', '1V5'], ['49', 'RSVD_49'], ['50', 'GND'], ['51', 'W_DISABLE2#'],
  ['52', '3V3AUX'],
];
/**
 * EAGLE writes active-low as !NAME (a bar over the name), and differential pairs
 * as _P/_N, so W_DISABLE# → !W_DISABLE and REFCLK+ → REFCLK_P. Repeats get the
 * pin number appended, because pin names must be unique inside a symbol.
 */
const mpcieBase = (fn) => {
  const low = fn.endsWith('#');
  const stem = low ? fn.slice(0, -1) : fn;
  const signed = stem.replace(/\+$/, '_P').replace(/-$/, '_N');
  return low ? `!${signed}` : signed;
};
export const MPCIE_NAMES = {};
{
  const seen = {};
  for (const [num, fn] of MPCIE_PINS) {
    const base = mpcieBase(fn);
    seen[base] = (seen[base] ?? 0) + 1;
    MPCIE_NAMES[num] = seen[base] > 1 || Object.values(MPCIE_NAMES).includes(base) ? `${base}_${num}` : base;
  }
}
/** mini-PCIe socket pin → symbol pin name, for the connects map and the nets. */
export const mpcieConnects = Object.fromEntries(MPCIE_PINS.map(([num]) => [MPCIE_NAMES[num], num]));
SYM['MPCIE'] = icSymbol('MPCIE', {
  w: 33.02,
  left: MPCIE_PINS.slice(0, 26).map(([num]) => ({ name: MPCIE_NAMES[num], direction: 'pas' })),
  right: MPCIE_PINS.slice(26).map(([num]) => ({ name: MPCIE_NAMES[num], direction: 'pas' })),
  texts: [
    { x: -13.0, y: 0, size: 1.5, layer: 94, ratio: 10, text: 'Mini Card socket' },
    { x: -13.0, y: -2.6, size: 1.2, layer: 94, ratio: 10, text: '52 pos / 0.8 mm' },
  ],
});

// Panasonic AHES4291 relay. Pin roles from the PIONIX EVerest symbol:
// 1 COM_1, 2 COM_2, 3 COM_3, 4 COIL_1, 5 COIL_2, 6 NC_3, 7 NO_2, 8 NO_1.
SYM['RELAY-2C'] = icSymbol('RELAY-2C', {
  w: 22.86,
  left: ['COM_1', 'NO_1', 'NC_3', 'COM_3'],
  right: ['COM_2', 'NO_2'],
  bottom: ['COIL_1', 'COIL_2'],
  texts: [{ x: -8.5, y: 0, size: 1.5, layer: 94, ratio: 10, text: 'relay' }],
});

// Molex 105017-0001 micro-USB receptacle: 1 VBUS, 2 D-, 3 D+, 4 ID, 5 GND,
// 6 shell (eight shell pads in the KiCad footprint).
SYM['USB-MICRO-B'] = icSymbol('USB-MICRO-B', {
  w: 20.32, left: ['VBUS', 'DM', 'DP'], right: ['ID', 'GND'], bottom: ['SH'],
});

// JAE SF53S006VCBR2000 micro-SIM. Pads 1,2,3,5,6,7 + eight shell pads.
// Contact roles follow ISO 7816-3 (C1 VCC, C2 RST, C3 CLK, C5 GND, C7 I/O);
// pad 6 is the card-detect switch and pad 4 (C4/VPP) is not fitted.
SYM['MICRO-SIM'] = icSymbol('MICRO-SIM', {
  w: 22.86, left: ['VCC', 'RST', 'CLK'], right: ['IO', 'GND', 'DET'], bottom: ['SH'],
});

Object.assign(FAMILY_SYMBOLS, SYM);

/* --------------------------------------------------------------- devicesets */

const DS = {
  'ACDC-5V': ds('PS', 'ACDC-4', 'IRM055', { 'AC-L': '1', 'AC-N': '2', '-VO': '3', '+VO': '4' }),
  'ACDC-12V': ds('PS', 'ACDC-4', 'MPM2012', { 'AC-N': '1', 'AC-L': '2', '+VO': '3', '-VO': '4' }),
  'BUCK-5V': ds('U', 'BUCK-3V3', 'LM2576S', {
    VIN: '1', VOUT: '2', GND: ['3', '3_2', 'P7', 'P8', 'P9', 'P10'], FB: '4', ONOFF: '5',
  }),
  'BUCK-3V3': ds('U', 'BUCK-3V3', 'LM2576S', {
    VIN: '1', VOUT: '2', GND: ['3', '3_2', 'P7', 'P8', 'P9', 'P10'], FB: '4', ONOFF: '5',
  }),
  'LDO-3V3': ds('U', 'LDO-3V3', 'AMS1117', { GND: '1', VO: ['2', '2_2'], VI: '3' }),
  'DIODE-SCH': ds('D', 'DIODE', 'DO41', { A: 'A', K: 'K' }),
  'TERM-3': ds('J', 'TERM-3', 'CUI_TB003', { 1: '1', 2: '2', 3: '3' }),
  'TERM-3-BORNIER': ds('J', 'TERM-3', 'TERM3', { 1: '1', 2: '2', 3: '3' }),
  'WIZ850IO': ds('U', 'WIZ850IO', 'WIZ850IO', {
    GND: ['1', '2', '7'], MOSI: '3', SCLK: '4', '!SCS': '5', '!INT': '6',
    '3V3': ['8', '9'], NC: '10', '!RST': '11', MISO: '12',
  }),
  'PLC-STAMP-MINI-2': ds('U', 'PLCSTAMP', 'PLCSTAMP', {
    GPIO_0: '1', GPIO_1: '2', GPIO_2: '3', GPIO_3: '4', RESET_L: '5',
    SERIAL_4: '6', SERIAL_3: '7', SERIAL_2: '8', SERIAL_1: '9', SERIAL_0: '10',
    GND: ['11', '18', '19', '20', '21', '22', '23', '24', '25'],
    VDD: '12', ZC_IN: '13', N: '15', L: ['16', '17'],
  }),
  'ESP32-WROOM-32E': ds('U', 'ESP32-WROOM', 'ESP32WROOM', {
    GND_1: '1', VDD: '2', EN: '3', SENSOR_VP: '4', SENSOR_VN: '5', IO34: '6',
    IO35: '7', IO32: '8', IO33: '9', IO25: '10', IO26: '11', IO27: '12',
    IO14: '13', IO12: '14', GND_15: '15', IO13: '16',
    NC_17: '17', NC_18: '18', NC_19: '19', NC_20: '20', NC_21: '21', NC_22: '22',
    IO15: '23', IO2: '24', IO0: '25', IO4: '26', IO16: '27', IO17: '28',
    IO5: '29', IO18: '30', IO19: '31', NC_32: '32', IO21: '33', RXD0: '34',
    TXD0: '35', IO22: '36', IO23: '37', GND_38: '38', GND_39: '39',
  }),
  'PI-ZERO-2W': ds('J', 'PI40', 'HDR2X20', Object.fromEntries(
    [PI_ODD, PI_EVEN].flat().map(([num]) => [PI40_NAMES[num], num]),
  )),
  'RELAY-AHES': ds('K', 'RELAY-2C', 'AHES4291', {
    COM_1: '1', COM_2: '2', COM_3: '3', COIL_1: '4', COIL_2: '5',
    NC_3: '6', NO_2: '7', NO_1: '8',
  }),
  'USB-MICRO-B': ds('J', 'USB-MICRO-B', 'USBMB', {
    VBUS: '1', DM: '2', DP: '3', ID: '4', GND: '5',
    SH: ['6', '6_2', '6_3', '6_4', '6_5', '6_6', '6_7', '6_8'],
  }),
  'MICRO-SIM': ds('J', 'MICRO-SIM', 'MICROSIM', {
    VCC: '1', RST: '2', CLK: '3', GND: '5', DET: '6', IO: '7',
    SH: ['SH', 'SH_2', 'SH_3', 'SH_4', 'SH_5', 'SH_6', 'SH_7', 'SH_8'],
  }),
  'COAX-UFL': ds('X', 'COAX', 'UFL', { SIG: '1', SH: ['2', '2_2'] }),
  'COAX-SMA': ds('X', 'COAX', 'SMAV', { SIG: '1', SH: ['2', '2_2', '2_3', '2_4'] }),
  'ANT-CHIP': ds('ANT', 'ANT-CHIP', 'UMTSANT', { FEED: '1', GND: '2' }),
  'XTAL-25M': ds('Y', 'XTAL', 'XTAL3225', { 1: '1', 2: '2', 3: ['3', '4'] }),
  'R-0603': ds('R', 'R-EU', 'R0603', { 1: '1', 2: '2' }),
  'C-0603': ds('C', 'C-EU', 'C0603', { 1: '1', 2: '2' }),
  'L-RADIAL': ds('L', 'INDUCTOR', 'LRAD12', { 1: '1', 2: '2' }),
  'MOUNT-M25': ds('H', null, 'MOUNT-M25', {}),
};
Object.assign(FAMILY_DEVICESETS, DS);

/* ------------------------------------------------------------ shared blocks */

/**
 * Mains front end, identical on all three boards: L and N enter a 5.00 mm
 * terminal, the fuse sits in L only, the varistor after the fuse, and the
 * isolated AC/DC module turns it into 5 V. PE lands on its own terminal pole and
 * on a chassis test point — it is never bonded to SELV ground on the PCB.
 */
export function mainsBlock({ ps = 'ACDC-5V', psValue = 'IRM-05-5', fuse = 'T630mA/250V', rail = '5V' } = {}) {
  const parts = [
    { ref: 'J1', set: 'TERM-3', value: 'MAINS IN', zone: 'mains', note: 'L / N / PE, CUI TB003-500-P03BE, 5.00 mm, 300 V' },
    { ref: 'F1', set: 'FUSE', value: fuse, zone: 'mains', note: 'TR5 radial fuse, line conductor only' },
    { ref: 'MOV1', set: 'MOV', value: 'S07K275', zone: 'mains', note: '275 Vrms varistor across L-N, after the fuse' },
    {
      ref: 'PS1', set: ps, value: psValue, zone: 'mains',
      padZones: ps === 'ACDC-12V' ? { 1: 'mains', 2: 'mains', 3: 'selv', 4: 'selv' } : { 1: 'mains', 2: 'mains', 3: 'selv', 4: 'selv' },
      note: 'isolated AC-DC; the reinforced barrier is inside the module (IRM-05-5: EN60950-1 / UL60950-1, CB, CE, cURus, TUV)',
    },
    { ref: 'FB1', set: 'FERRITE', value: '600R@100MHz', zone: 'selv', note: 'ferrite on the DC side of the module' },
    { ref: 'C1', set: 'CPOL-EU', value: '470uF/10V', zone: 'selv', note: 'bulk reservoir behind the AC/DC module' },
    { ref: 'TP1', set: 'TP', value: '+5V', zone: 'selv', note: '' },
    { ref: 'TP2', set: 'TP', value: 'GND', zone: 'selv', note: '' },
    { ref: 'TP3', set: 'TP', value: 'PE', zone: 'mains', note: 'protective earth, chassis side' },
  ];
  const nets = {
    AC_L: [['J1', '1'], ['F1', '1']],
    AC_L_F: [['F1', '2'], ['PS1', 'AC-L'], ['MOV1', '1']],
    AC_N: [['J1', '2'], ['PS1', 'AC-N'], ['MOV1', '2']],
    PE: [['J1', '3'], ['TP3', '1']],
    [`${rail}_P`]: [['PS1', '+VO'], ['FB1', '1'], ['C1', '+']],
    GND: [['PS1', '-VO'], ['C1', '-'], ['TP2', '1']],
    [rail]: [['FB1', '2'], ['TP1', '1']],
  };
  return { parts, nets };
}

/**
 * 5 V → 3.3 V step-down. LM2576S-3.3 (TO-263-5): VIN from the 5 V rail, VOUT
 * through a 100 µH radial inductor, SS34-class Schottky from the switch node,
 * ON/OFF tied low (always on), FB left open because the fixed-output part bonds
 * it internally. The 3 A part gives headroom for a WiMAX card's TX bursts.
 */
export function buckBlock({
  out = '3V3', cin = '220uF/10V', inRail = '5V', value = 'LM2576S-3.3',
  refs = { u: 'U1', l: 'L1', d: 'D1', cin: 'C2', cout: 'C3', ccer: 'C4', tp: 'TP4' },
} = {}) {
  const sw = `SW_${out}`;
  const ind = out === '5V' ? '47uH/3A' : '100uH/3A';
  const parts = [
    { ref: refs.u, set: out === '5V' ? 'BUCK-5V' : 'BUCK-3V3', value, zone: 'selv', note: `3 A step-down, ${inRail} in, fixed ${out === '5V' ? '5 V' : '3.3 V'} out; the TO-263 tab is ground and wants a copper area` },
    { ref: refs.l, set: 'L-RADIAL', value: ind, zone: 'selv', note: `LM2576 output inductor, radial (Fastron 11P style); ${ind} is the datasheet nomogram value for this output at up to 3 A — re-read the L-vs-VIN chart if the input rail changes` },
    { ref: refs.d, set: 'DIODE-SCH', value: 'SS34', zone: 'selv', note: 'catch diode, 3 A Schottky (1N5822 / SS34 class)' },
    { ref: refs.cin, set: 'CPOL-EU', value: cin, zone: 'selv', note: 'input reservoir for the regulator' },
    { ref: refs.cout, set: 'CPOL-EU', value: out === '5V' ? '330uF/10V' : '220uF/10V', zone: 'selv', note: 'output reservoir' },
    { ref: refs.ccer, set: 'C-0603', value: '100nF', zone: 'selv', note: 'ceramic across the output' },
    { ref: refs.tp, set: 'TP', value: `+${out}`, zone: 'selv', note: '' },
  ];
  const nets = {
    [inRail]: [[refs.u, 'VIN'], [refs.cin, '+']],
    [sw]: [[refs.u, 'VOUT'], [refs.l, '1'], [refs.d, 'K']],
    [out]: [[refs.l, '2'], [refs.cout, '+'], [refs.ccer, '1'], [refs.tp, '1']],
    GND: [[refs.u, 'GND'], [refs.u, 'ONOFF'], [refs.cin, '-'], [refs.cout, '-'], [refs.ccer, '2'], [refs.d, 'A']],
  };
  return { parts, nets };
}

/** 3.3 V from 5 V with a linear regulator — only where the load is small. */
export function ldoBlock({ out = '3V3' } = {}) {
  const parts = [
    { ref: 'U1', set: 'LDO-3V3', value: 'AMS1117-3.3', zone: 'selv', note: 'SOT-223 LDO, 800 mA; (5-3.3) V x I is heat, so the copper area under the tab matters' },
    { ref: 'C2', set: 'CPOL-SMALL', value: '10uF/10V', zone: 'selv', note: 'LDO input' },
    { ref: 'C3', set: 'CPOL-SMALL', value: '10uF/10V', zone: 'selv', note: 'LDO output' },
    { ref: 'C4', set: 'C-0603', value: '100nF', zone: 'selv', note: 'ceramic across the output' },
    { ref: 'TP4', set: 'TP', value: `+${out}`, zone: 'selv', note: '' },
  ];
  const nets = {
    '5V': [['U1', 'VI'], ['C2', '+']],
    [out]: [['U1', 'VO'], ['C3', '+'], ['C4', '1'], ['TP4', '1']],
    GND: [['U1', 'GND'], ['C2', '-'], ['C3', '-'], ['C4', '2']],
  };
  return { parts, nets };
}

/** Power LED on a rail, with its series resistor. */
export function powerLed(refs = { r: 'R1', led: 'LED1' }, value = 'PWR green') {
  return {
    parts: [
      { ref: refs.r, set: 'R-EU', value: '1k0', zone: 'selv', note: `${refs.led} current limit` },
      { ref: refs.led, set: 'LED', value, zone: 'selv', note: 'rail present' },
    ],
    nets: { LED_A: [[refs.r, '2'], [refs.led, 'A']], GND: [[refs.led, 'K']] },
  };
}

/** Merge block outputs; later nets with the same name are concatenated. */
export function merge(...blocks) {
  const parts = [];
  const nets = {};
  const notes = [];
  for (const b of blocks) {
    if (!b) continue;
    if (b.parts) parts.push(...b.parts);
    if (b.notes) notes.push(...b.notes);
    for (const [net, members] of Object.entries(b.nets ?? {})) {
      nets[net] = [...(nets[net] ?? []), ...members];
    }
  }
  // a ref must not appear twice in one net (the generator's pin coverage flags it)
  for (const [net, members] of Object.entries(nets)) {
    const seen = new Set();
    nets[net] = members.filter(([r, p]) => {
      const k = `${r}.${p}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  return { parts, nets, notes };
}

export { pick, rnd };
export const ALL_PACKAGES = FAMILY_PACKAGES;
export const ALL_SYMBOLS = FAMILY_SYMBOLS;
export const ALL_DEVICESETS = FAMILY_DEVICESETS;
