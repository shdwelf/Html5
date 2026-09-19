/* CHIPWRIGHT · cw-data.js — the reference corpus.
 *
 * Everything in this module is *data + pure functions*. No DOM, no fetch, no
 * side effects, so `tools/verify_chipwright.mjs` can import it in bare node and
 * prove the arithmetic without a browser.
 *
 * EVIDENCE DISCIPLINE (the repo's house rule, see criteria/README.md):
 *   every row carries `ev`:
 *     "std"      — read out of a published standard / vendor datasheet
 *     "tool"     — read out of an open-source tool's own tables (flashrom,
 *                  OpenOCD, U-Boot) and quoted here
 *     "report"   — observed by third parties, reproduced here as a report
 *     "recall"   — transcribed from memory, NOT verified against the source.
 *                  The UI renders these with a warning stripe and refuses to
 *                  let them drive an automatic decision on their own.
 *   Nothing here is a guess presented as a fact.
 */

/* ------------------------------------------------------------------ *
 * 0. Bit twiddling used everywhere else
 * ------------------------------------------------------------------ */

export const u32 = (n) => n >>> 0;

export const hex = (n, width = 8) => "0x" + (u32(n) >>> 0).toString(16).toUpperCase().padStart(width, "0");

export const bin = (n, width = 32) => (u32(n) >>> 0).toString(2).padStart(width, "0");

export function parseHexInt(s) {
  if (typeof s === "number") return u32(s);
  const t = String(s || "").trim().replace(/^0[xX]/, "").replace(/[_\s]/g, "");
  if (!/^[0-9a-fA-F]{1,8}$/.test(t)) return null;
  return u32(parseInt(t, 16));
}

export function bytesToHex(u8, max = Infinity, sep = " ") {
  const n = Math.min(u8.length, max);
  const out = [];
  for (let i = 0; i < n; i++) out.push(u8[i].toString(16).padStart(2, "0"));
  return out.join(sep).toUpperCase();
}

/** CRC-32 as used by zlib / PNG / U-Boot's `ih_hcrc`. Poly 0xEDB88320 (reflected). */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes, start = 0, end = bytes.length, seed = 0) {
  let c = (seed ^ 0xffffffff) >>> 0;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export const CRC32_CHECK = 0xcbf43926; // crc32("123456789") — the standard check value

/** Fletcher-16, the cheap checksum that shows up in embedded boot headers. */
export function fletcher16(bytes, start = 0, end = bytes.length) {
  let c0 = 0;
  let c1 = 0;
  for (let i = start; i < end; i++) {
    c0 = (c0 + bytes[i]) % 255;
    c1 = (c1 + c0) % 255;
  }
  return ((c1 << 8) | c0) >>> 0;
}

/** Shannon entropy in bits/byte over a window. 8.0 = indistinguishable from random. */
export function entropy(bytes, start = 0, end = bytes.length) {
  const n = end - start;
  if (n <= 0) return 0;
  const hist = new Uint32Array(256);
  for (let i = start; i < end; i++) hist[bytes[i]]++;
  let h = 0;
  const ln2 = Math.LN2;
  for (let b = 0; b < 256; b++) {
    const c = hist[b];
    if (!c) continue;
    const p = c / n;
    h -= p * Math.log(p) / ln2;
  }
  return h;
}

/** Read helpers over a DataView-ish byte array (little/big endian, 16/32). */
export const rd = {
  u8: (b, i) => b[i],
  u16le: (b, i) => b[i] | (b[i + 1] << 8),
  u16be: (b, i) => (b[i] << 8) | b[i + 1],
  u32le: (b, i) => u32(b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)),
  u32be: (b, i) => u32((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]),
  ascii: (b, i, n) => {
    let s = "";
    for (let k = 0; k < n; k++) {
      const c = b[i + k];
      if (!c) break;
      s += c >= 32 && c < 127 ? String.fromCharCode(c) : "";
    }
    return s;
  },
};

/* ------------------------------------------------------------------ *
 * 1. IEEE 1149.1 — the TAP controller
 *    ev: "std" (IEEE Std 1149.1-2013, clause 6; corroborated by every
 *    vendor app note that redraws the diagram: Silabs AN105, NXP AN2074,
 *    Microchip SX/Axcelerator JTAG app notes, Lauterbach JTAG training).
 * ------------------------------------------------------------------ */

/**
 * Sixteen states. `tms0` is the next state with TMS=0, `tms1` with TMS=1.
 * Test-Logic-Reset is the only state that loops on TMS=1, which is why five
 * TCKs with TMS high is the universal "get me to a known place" move.
 */
export const TAP_STATES = [
  { id: "TLR", name: "Test-Logic-Reset", tms0: "RTI", tms1: "TLR", group: "reset" },
  { id: "RTI", name: "Run-Test/Idle", tms0: "RTI", tms1: "SDR", group: "idle" },
  { id: "SDR", name: "Select-DR-Scan", tms0: "CDR", tms1: "SIR", group: "select" },
  { id: "CDR", name: "Capture-DR", tms0: "SHDR", tms1: "X1DR", group: "dr" },
  { id: "SHDR", name: "Shift-DR", tms0: "SHDR", tms1: "X1DR", group: "dr" },
  { id: "X1DR", name: "Exit1-DR", tms0: "PDR", tms1: "UDR", group: "dr" },
  { id: "PDR", name: "Pause-DR", tms0: "PDR", tms1: "X2DR", group: "dr" },
  { id: "X2DR", name: "Exit2-DR", tms0: "SHDR", tms1: "UDR", group: "dr" },
  { id: "UDR", name: "Update-DR", tms0: "RTI", tms1: "SDR", group: "dr" },
  { id: "SIR", name: "Select-IR-Scan", tms0: "CIR", tms1: "TLR", group: "select" },
  { id: "CIR", name: "Capture-IR", tms0: "SHIR", tms1: "X1IR", group: "ir" },
  { id: "SHIR", name: "Shift-IR", tms0: "SHIR", tms1: "X1IR", group: "ir" },
  { id: "X1IR", name: "Exit1-IR", tms0: "PIR", tms1: "UIR", group: "ir" },
  { id: "PIR", name: "Pause-IR", tms0: "PIR", tms1: "X2IR", group: "ir" },
  { id: "X2IR", name: "Exit2-IR", tms0: "SHIR", tms1: "UIR", group: "ir" },
  { id: "UIR", name: "Update-IR", tms0: "RTI", tms1: "SDR", group: "ir" },
];

export const TAP_BY_ID = Object.fromEntries(TAP_STATES.map((s) => [s.id, s]));

/** Shortest TMS bit string (LSB-first) that walks a→b. BFS over the 16 states. */
export function tapPath(from, to) {
  if (from === to) return "";
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    for (const tms of [0, 1]) {
      const nxt = TAP_BY_ID[cur][tms === 0 ? "tms0" : "tms1"];
      if (prev.has(nxt)) continue;
      prev.set(nxt, { state: cur, tms });
      if (nxt === to) {
        let bits = "";
        let node = nxt;
        while (prev.get(node)) {
          const p = prev.get(node);
          bits = String(p.tms) + bits;
          node = p.state;
        }
        return bits;
      }
      queue.push(nxt);
    }
  }
  return null;
}

/** Five ones lands in TLR from anywhere; one zero then parks in RTI. */
export const TAP_RESET_TMS = "111110";

/* Mandatory / optional instructions, IEEE 1149.1 clause 8-9 (ev: "std"). */
export const TAP_INSTRUCTIONS = [
  { name: "EXTEST", mandatory: true, reg: "Boundary-Scan Register",
    what: "Isolates the core from the pins and drives/captures at the boundary cells. This is the interconnect test." },
  { name: "SAMPLE/PRELOAD", mandatory: true, reg: "Boundary-Scan Register",
    what: "Takes a snapshot of pin state while the part keeps running normally; PRELOAD seeds the update latches before an EXTEST." },
  { name: "BYPASS", mandatory: true, reg: "1-bit Bypass Register",
    what: "Connects TDI to TDO through one flip-flop. All-ones IR. Used to skip devices in a chain." },
  { name: "IDCODE", mandatory: false, reg: "32-bit IDCODE Register",
    what: "Shifts out version / part number / JEP106 manufacturer. Loaded automatically on TAP reset where implemented." },
  { name: "USERCODE", mandatory: false, reg: "32-bit user register",
    what: "Like IDCODE but programmable by the design; common on FPGAs to carry a bitstream revision." },
  { name: "INTEST", mandatory: false, reg: "Boundary-Scan Register",
    what: "Drives the boundary values into the core instead of the pins — tests internal logic on an assembled board." },
  { name: "CLAMP", mandatory: false, reg: "Bypass + held BSR update latches",
    what: "Holds preloaded values on the outputs while TDI→TDO runs through BYPASS. Drives safe states while scanning fast." },
  { name: "HIGHZ", mandatory: false, reg: "Bypass",
    what: "Tri-states all outputs, BYPASS selected. The 'stop driving the bus' instruction." },
  { name: "RUNBIST", mandatory: false, reg: "device-defined",
    what: "Kicks off the on-chip built-in self test; the TAP dwells in Run-Test/Idle for a defined number of TCKs." },
];

/* ------------------------------------------------------------------ *
 * 2. The 32-bit IDCODE, field by field (ev: "std")
 *    [31:28] version · [27:12] part number · [11:1] JEP106 mfr · [0] = 1
 * ------------------------------------------------------------------ */

export function decodeIdcode(id) {
  const v = u32(id);
  const version = (v >>> 28) & 0xf;
  const part = (v >>> 12) & 0xffff;
  const mfr = (v >>> 1) & 0x7ff;
  const one = v & 1;
  const continuation = (mfr >>> 7) & 0xf;
  const identity = mfr & 0x7f;
  const idData = identity >>> 1;
  const parity = identity & 1;
  const parityOk = parity === ((popcount(idData) + 1) & 1); // JEP106: odd parity
  return {
    raw: v,
    hex: hex(v),
    binary: bin(v),
    version,
    partNumber: part,
    partHex: part.toString(16).toUpperCase().padStart(4, "0"),
    manufacturerField: mfr,
    manufacturerHex: "0x" + mfr.toString(16).toUpperCase().padStart(3, "0"),
    continuationCode: continuation,
    jedecBank: continuation + 1,
    identity,
    identityData: idData,
    parityBit: parity,
    parityIsOdd: parityOk,
    lsbIsOne: one === 1,
    structurallyValid: one === 1 && parityOk && identity !== 0x00 && identity !== 0x7f,
  };
}

export function encodeIdcode({ version, partNumber, continuationCode, identity }) {
  const mfr = ((continuationCode & 0xf) << 7) | (identity & 0x7f);
  return u32(((version & 0xf) << 28) | ((partNumber & 0xffff) << 12) | (mfr << 1) | 1);
}

export function popcount(n) {
  let x = u32(n);
  let c = 0;
  while (x) { c += x & 1; x >>>= 1; }
  return c;
}

/**
 * JEP106 identity codes seen in the wild in this repo's problem space.
 * The `bank` column is the number of 0x7F continuation codes that precede it,
 * which different sources number differently (0-based vs 1-based). We store
 * the continuation count and let the reader do the +1.
 *
 * ev: "tool" — the vendor↔code pairs below are quoted from flashrom's
 * `flashchips.h` comments and from the EDK2 `JedecJep106Lib` bank tables, plus
 * the analysis at basicinputoutput.com "JEDEC Manufacturer IDs Are a Mess".
 */
export const JEP106 = [
  { cont: 0, code: 0x20, vendor: "STMicroelectronics / SGS-Thomson", also: "Numonyx, then Micron; also XMC in bank 10", where: "SPI-NOR RDID, STM32 IDCODEs", ev: "tool" },
  { cont: 0, code: 0x01, vendor: "AMD", also: "Spansion (AMD/Fujitsu JV) uses the same 0x01", where: "SPI-NOR RDID, parallel NOR", ev: "tool" },
  { cont: 0, code: 0xc2, vendor: "Macronix", also: "—", where: "SPI-NOR RDID (MX25L…)", ev: "tool" },
  { cont: 0, code: 0xbf, vendor: "Silicon Storage Technology (SST)", also: "acquired by Microchip", where: "SPI-NOR RDID (SST25/SST26)", ev: "tool" },
  { cont: 0, code: 0x89, vendor: "Intel", also: "Numonyx NOR line inherits this", where: "SPI-NOR RDID, FPGA IDCODEs", ev: "report" },
  { cont: 0, code: 0x6e, vendor: "Altera", also: "now Intel/AMD Programmable", where: "CPLD/FPGA IDCODEs", ev: "report" },
  { cont: 0, code: 0x09, vendor: "Xilinx", also: "now AMD", where: "FPGA/CPLD IDCODEs", ev: "report" },
  { cont: 1, code: 0x1c, vendor: "EON Silicon Devices", also: "EN29 series prefixes the vendor ID with 0x7F, EN25 does not — which collides with Mitsubishi", where: "SPI-NOR RDID (EN25Q…)", ev: "tool" },
  { cont: 1, code: 0x1f, vendor: "Atmel (now Microchip)", also: "AVR parts that have JTAG carry this in the IDCODE manufacturer field", where: "AVR JTAG IDCODEs", ev: "report" },
  { cont: 3, code: 0x0a, vendor: "Spansion (a reported JEP106 assignment)", also: "Separately, S25FL128P-era parts answer RDID with 0x5E while newer S25FL…S answer 0x01 — two different numbering spaces, easy to conflate", where: "JEP106 tables", ev: "recall" },
  { cont: 4, code: 0x3b, vendor: "ARM Ltd", also: "the designer, not the fab — ARM recommends the SoC vendor put their own JEP106 code in the debug ROM table PID instead", where: "every Cortex-M DAP IDCODE", ev: "std" },
  { cont: 6, code: 0xc8, vendor: "GigaDevice", also: "in bank 1, 0xC8 is Apple — the bank is not optional context", where: "SPI-NOR RDID (GD25Q…)", ev: "tool" },
  { cont: 0, code: 0xef, vendor: "Winbond (ex-Nexcom serial flash line)", also: "JEP106 gives Winbond 0xDA in bank 1; roughly half the parts in the field answer 0xEF because Winbond bought Nexcom's serial-NOR business", where: "SPI-NOR RDID (W25Q…)", ev: "tool" },
  { cont: 0, code: 0xda, vendor: "Winbond Electronics (JEP106 bank 1 assignment)", also: "see 0xEF above — this is exactly the mess", where: "SPD/JEP106 contexts", ev: "tool" },
  { cont: 0, code: 0xfe, vendor: "Numonyx", also: "absorbed into Micron, which then answers 0x20 (ST's code), not 0x2C", where: "SPI-NOR RDID on old parts", ev: "report" },
  { cont: 0, code: 0x2c, vendor: "Micron Technology", also: "not what Micron serial NOR answers", where: "SPD/JEP106 contexts", ev: "report" },
];

/* ------------------------------------------------------------------ *
 * 3. Known IDCODEs
 *    The two ARM DAP rows are the load-bearing ones: they are the values
 *    OpenOCD's own target scripts compare against, and the STM32F1 pair
 *    (0x1BA01477 / 0x2BA01477) is a documented, reproducible confusion —
 *    the second differs only in the version nibble and is what clone cores
 *    answer. ev: "tool" (OpenOCD stm32f1x.cfg / stm32f4x.cfg) + "report".
 * ------------------------------------------------------------------ */

export const IDCODES = [
  { id: 0x1ba01477, irlen: 4, family: "ARM Cortex-M3 r1p1 DAP (JTAG-DP)", note: "The value OpenOCD's stm32f1x.cfg expects for CPUTAPID.", ev: "tool", src: "OpenOCD target/stm32f1x.cfg" },
  { id: 0x2ba01477, irlen: 4, family: "ARM Cortex-M3 r2p0 DAP (JTAG-DP)", note: "Same designer/part, version nibble 2. Reported by CS32F103-class clones and some later ST silicon; OpenOCD prints UNEXPECTED idcode unless the cfg lists it too.", ev: "report", src: "multiple OpenOCD field reports" },
  { id: 0x4ba00477, irlen: 4, family: "ARM Cortex-M4/M7 DAP (JTAG-DP)", note: "OpenOCD stm32f4x.cfg CPUTAPID. Part number 0xBA00 is the ARM JTAG-DP.", ev: "tool", src: "OpenOCD target/stm32f4x.cfg" },
  { id: 0x07926093, irlen: 8, family: "ATmega328P (AVR, JTAG-less — see note)", note: "Shown here as the AVR IDCODE shape used by the JTAG-enabled megaAVR parts; ATmega328P itself has debugWIRE, not JTAG. Verify against the device datasheet before trusting this row.", ev: "recall", src: "unverified" },
  { id: 0x02214093, irlen: 4, family: "Xilinx XC9500XL CPLD family (example)", note: "Xilinx CPLD IDCODEs put the family in the part-number field; read the DS/UG for the exact member.", ev: "recall", src: "unverified" },
  { id: 0x020a10dd, irlen: 10, family: "Altera/Intel MAX II EPM570 (example)", note: "MAX II IR length is 10 bits, not 4 — a classic chain-discovery surprise.", ev: "recall", src: "unverified" },
];

/** IR lengths that keep biting people when a chain won't line up. ev: "std"/"report". */
export const IR_LENGTHS = [
  { family: "ARM Cortex-M (CoreSight JTAG-DP)", irlen: 4, ev: "std", note: "DPACC 0xA, APACC 0xB, ABORT 0x8, IDCODE 0xE, BYPASS 0xF." },
  { family: "ARM11 / Cortex-A JTAG-DP", irlen: 4, ev: "std", note: "Same DP instruction space; the AP differs." },
  { family: "ARM7TDMI (ICEbreaker)", irlen: 4, ev: "report", note: "INTEST 0xB, BYPASS 0xF — pre-CoreSight." },
  { family: "Silabs C8051Fxxx", irlen: 16, ev: "std", note: "AN105: EXTEST 0x0000, SAMPLE 0x0002, IDCODE 0x1004, FLASHCON 0x4082, BYPASS 0xFFFF." },
  { family: "Altera/Intel MAX II", irlen: 10, ev: "report", note: "Longer IR than anyone expects from a small CPLD." },
  { family: "Altera/Intel Cyclone / Stratix", irlen: 10, ev: "report", note: "Check the device handbook; some families are 10, others differ." },
  { family: "Xilinx 7-series / Spartan-6", irlen: 6, ev: "report", note: "JSTART 0x0C, CFG_IN 0x05, CFG_OUT 0x04, IDCODE 0x09, BYPASS 0x3F." },
  { family: "MSP430", irlen: 8, ev: "report", note: "Not 1149.1-conformant in the usual sense: the TAP is a small custom machine." },
];

/* ------------------------------------------------------------------ *
 * 4. SPI NOR — the flash you will actually meet on a router board
 *    ev: "tool" for the vendor IDs (flashrom flashchips.h) and "std" for
 *    the command set, which is a de-facto standard copied across vendors.
 * ------------------------------------------------------------------ */

export const SPI_VENDORS = [
  { id: 0xef, vendor: "Winbond", prefix: "W25Q…", ev: "tool" },
  { id: 0xc2, vendor: "Macronix", prefix: "MX25L… / MX25U…", ev: "tool" },
  { id: 0xc8, vendor: "GigaDevice", prefix: "GD25Q… / GD25LQ…", ev: "tool" },
  { id: 0x20, vendor: "ST / Numonyx / Micron / XMC", prefix: "M25P… / N25Q… / MT25Q…", ev: "tool" },
  { id: 0x01, vendor: "Spansion / Cypress / Infineon (and AMD)", prefix: "S25FL… / S25FS…", ev: "tool" },
  { id: 0x5e, vendor: "Spansion legacy family ID (0x5E)", prefix: "S25FL…P-era parts; flashrom also reports 0xC7 for some S25FS128S runs", ev: "tool" },
  { id: 0xbf, vendor: "SST (Microchip)", prefix: "SST25… / SST26…", ev: "tool" },
  { id: 0x1c, vendor: "EON Silicon Devices", prefix: "EN25Q… / EN25QH…", ev: "tool" },
  { id: 0x85, vendor: "Puya Semiconductor", prefix: "P25Q…", ev: "recall" },
];

export const SPI_VENDOR_BY_ID = Object.fromEntries(SPI_VENDORS.map((v) => [v.id, v]));

/**
 * RDID (0x9F) → three bytes. Byte 0 is the vendor, byte 1 the memory type,
 * byte 2 the capacity. For the Winbond/Macronix/GigaDevice families the
 * capacity byte is log2(bytes), i.e. capacity = 2 ** byte2. That single rule
 * identifies an unknown part well enough to read it, which is the whole point.
 */
export function decodeRdid(b0, b1, b2) {
  const vendor = SPI_VENDOR_BY_ID[b0] || null;
  const capacity = 2 ** b2;
  return {
    raw: [b0, b1, b2],
    hex: bytesToHex([b0, b1, b2]),
    vendorId: b0,
    vendor: vendor ? vendor.vendor : `unknown vendor 0x${b0.toString(16).toUpperCase().padStart(2, "0")}`,
    vendorEv: vendor ? vendor.ev : "none",
    memoryType: b1,
    memoryTypeMeaning: memoryTypeName(b1),
    capacityByte: b2,
    capacityBytes: capacity,
    capacityLabel: labelSize(capacity),
    capacityMbit: (capacity * 8) / 1e6,
    rule: "capacity = 2 ** capacityByte — holds for the Winbond W25Q, Macronix MX25L, GigaDevice GD25Q, EON EN25Q and XTX XT25F families (ev: datasheet / flashrom tables). Spansion S25FL uses the same trick on its second ID byte; SST25 does not always.",
    // `known` is what callers test to decide how confident to be: a vendor byte
    // that is in the table is a datasheet-backed reading, one that is not is an
    // inference from the capacity rule alone.
    known: !!vendor,
    // The upper bound is written as a literal, not `1 << 32`. JS shifts by
    // `count & 31`, so `1 << 32 === 1` and every capacity would read as
    // implausible — a silent false negative on the most common check in the
    // whole SPI path.
    plausible: capacity >= 1 << 16 && capacity <= 2 ** 32,
    note: `${vendor ? vendor.vendor : `unknown vendor 0x${b0.toString(16).toUpperCase().padStart(2, "0")}`} — ${labelSize(capacity)} (${(capacity * 8) / 1e6} Mbit), type byte 0x${b1.toString(16).toUpperCase().padStart(2, "0")} = ${memoryTypeName(b1)}`,
  };
}

function memoryTypeName(t) {
  switch (t) {
    case 0x20: return "standard SPI, 3.0-3.6 V, uniform 4 KB sectors (the common case)";
    case 0x25: return "Macronix MX25U (1.8 V) family — SST25 parts also use 0x25, so the vendor byte decides";
    case 0x30: return "Winbond W25X family";
    case 0x40: return "Winbond W25Q family (dual/quad output)";
    case 0x60: return "Winbond W25Q family, 1.8 V (W25Q…FW/JW class)";
    case 0x70: return "Winbond W25Q family, 1.8 V quad";
    case 0x02: return "Spansion/Cypress S25FL family";
    case 0x26: return "Micron/Numonyx N25Q family";
    case 0xba: return "Micron MT25Q family";
    default: return "vendor-specific memory type byte — read the datasheet";
  }
}

export function labelSize(bytes) {
  if (bytes >= 1 << 20) return `${bytes / (1 << 20)} MiB`;
  if (bytes >= 1 << 10) return `${bytes / (1 << 10)} KiB`;
  return `${bytes} B`;
}

/** The SPI-NOR command set. `ev` is "std" where every vendor datasheet agrees. */
export const SPI_COMMANDS = [
  { op: 0x06, name: "Write Enable (WREN)", args: 0, ev: "std", note: "Must precede every program/erase. Sets WEL in SR1." },
  { op: 0x04, name: "Write Disable (WRDI)", args: 0, ev: "std", note: "Clears WEL." },
  { op: 0x05, name: "Read Status Register 1 (RDSR)", args: 0, ev: "std", note: "Poll bit0 (WIP) until it clears; 256-byte page program is typically 0.4-3 ms, 4 KB sector erase 45-400 ms." },
  { op: 0x50, name: "Write Enable for Volatile SR (WREN-VSR)", args: 0, ev: "std", note: "Lets you change SR without burning the non-volatile bits. Essential when a dump comes back all-protected." },
  { op: 0x01, name: "Write Status Register (WRSR)", args: 1, ev: "std", note: "Writes SR1 (and SR2 on parts that chain them). This is how block-protect bits get set or cleared." },
  { op: 0x35, name: "Read Status Register 2", args: 0, ev: "std", note: "QE (quad enable) lives here on Winbond; on other vendors it lives in SR1 bit6." },
  { op: 0x03, name: "Read Data (1-1-1)", args: 3, ev: "std", note: "The universal read. Works on every part, at any speed the board tolerates. Start here." },
  { op: 0x0b, name: "Fast Read (1-1-1 + dummy)", args: 3, ev: "std", note: "Adds a dummy byte so the part can clock above ~50 MHz." },
  { op: 0x3b, name: "Fast Read Dual Output (1-1-2)", args: 3, ev: "std", note: "Data comes back on IO0+IO1." },
  { op: 0xeb, name: "Fast Read Quad I/O (1-4-4)", args: 3, ev: "std", note: "Needs QE set. Mode bits follow the address on many parts." },
  { op: 0x02, name: "Page Program (PP)", args: 3, ev: "std", note: "Up to 256 bytes, and it cannot cross a 256-byte page boundary — the address wraps inside the page. The single most common corruption bug in homebrew flashers." },
  { op: 0x20, name: "Sector Erase 4 KB", args: 3, ev: "std", note: "The granularity that lets you patch one region without touching the rest." },
  { op: 0x52, name: "Block Erase 32 KB", args: 3, ev: "std", note: "Not present on every part." },
  { op: 0xd8, name: "Block Erase 64 KB", args: 3, ev: "std", note: "Common; some 3.3 V parts use 0xD8, some 1.8 V parts use 0xDC." },
  { op: 0x60, name: "Chip Erase", args: 0, ev: "std", note: "0xC7 on some vendors. Only use when you have a verified dump to write back." },
  { op: 0x9f, name: "Read JEDEC ID (RDID)", args: 0, ev: "std", note: "Three bytes back: vendor / memory type / capacity. This is the identification step." },
  { op: 0xab, name: "Release Power-Down / Device ID", args: 0, ev: "std", note: "If a part was left in deep power-down it answers nothing until you send this." },
  { op: 0x90, name: "Manufacturer / Device ID (REMS)", args: 3, ev: "std", note: "Two-byte legacy ID. Useful when RDID returns 0x000000 because the part is a REMS-only device." },
  { op: 0x5a, name: "Read SFDP", args: 3, ev: "std", note: "JESD216: the part describes itself. 0x5A header, revision, then parameter table pointers. Preferred over any table when the part answers it." },
  { op: 0x4b, name: "Read Unique ID (64-bit)", args: 4, ev: "std", note: "Winbond/GigaDevice/Macronix implement the same protocol for this, so one routine serves all three." },
  { op: 0x44, name: "Erase Security Register", args: 3, ev: "std", note: "OTP region. Once written it is gone — read it out first." },
  { op: 0x66, name: "Enable Reset", args: 0, ev: "std", note: "Paired with 0x99 (Reset Device). Without this pair a part stuck mid-operation stays stuck." },
  { op: 0x99, name: "Reset Device", args: 0, ev: "std", note: "Software reset; tRST is a few microseconds." },
];

export const SPI_COMMAND_BY_OP = Object.fromEntries(SPI_COMMANDS.map((c) => [c.op, c]));

/** SR1 bit layout, Winbond W25Q-class. GigaDevice/Macronix agree on BP0-BP2;
 *  where they differ (SRP placement, QE location) the substitution gate flags it. */
export const SPI_SR_BITS = [
  { bit: 0, name: "WIP", rw: "R", meaning: "Write/erase in progress. Poll until 0." },
  { bit: 1, name: "WEL", rw: "R", meaning: "Write enable latch. Set by 0x06, cleared automatically after the operation." },
  { bit: 2, name: "BP0", rw: "R/W", meaning: "Block protect 0." },
  { bit: 3, name: "BP1", rw: "R/W", meaning: "Block protect 1." },
  { bit: 4, name: "BP2", rw: "R/W", meaning: "Block protect 2 — with CMP this decides top vs bottom." },
  { bit: 5, name: "TB", rw: "R/W", meaning: "Top/Bottom protect select." },
  { bit: 6, name: "SEC or QE", rw: "R/W", meaning: "VENDOR DIVERGENCE: Winbond puts QE (quad enable) here; parts with three 4 KB security registers put SEC here and QE in SR2 bit1." },
  { bit: 7, name: "SRP0", rw: "R/W", meaning: "Status register protect. When set, WRSR is ignored — the usual reason a 'simple' unlock fails." },
];

/* ------------------------------------------------------------------ *
 * 5. U-Boot legacy image header (ev: "tool" — U-Boot include/image.h)
 * ------------------------------------------------------------------ */

export const UIMAGE_MAGIC = 0x27051956;

export const UIMAGE_LAYOUT = [
  { off: 0x00, size: 4, field: "ih_magic", meaning: "0x27051956, big-endian. The only reason `file` recognises a uImage." },
  { off: 0x04, size: 4, field: "ih_hcrc", meaning: "CRC-32 of the whole 64-byte header *with this field zeroed*." },
  { off: 0x08, size: 4, field: "ih_time", meaning: "Unix timestamp the image was built. Often the single best clue to which vendor SDK a firmware came from." },
  { off: 0x0c, size: 4, field: "ih_size", meaning: "Length of the data that follows the header, in bytes." },
  { off: 0x10, size: 4, field: "ih_load", meaning: "Address the payload is copied to." },
  { off: 0x14, size: 4, field: "ih_ep", meaning: "Entry point. For a MIPS kernel this is 0x80000000-ish; for ARM, DRAM base + 0x8000." },
  { off: 0x18, size: 4, field: "ih_dcrc", meaning: "CRC-32 of the payload." },
  { off: 0x1c, size: 1, field: "ih_os", meaning: "Operating system id (see UIMAGE_OS)." },
  { off: 0x1d, size: 1, field: "ih_arch", meaning: "CPU architecture id (see UIMAGE_ARCH — verify against image.h before trusting a decode)." },
  { off: 0x1e, size: 1, field: "ih_type", meaning: "Image type id (kernel, ramdisk, firmware, script…)." },
  { off: 0x1f, size: 1, field: "ih_comp", meaning: "Compression id (none, gzip, bzip2, lzma, lzo…)." },
  { off: 0x20, size: 32, field: "ih_name", meaning: "NUL-padded ASCII name. `mkimage -n` puts whatever the build script said here — vendor kernels leak version strings through it constantly." },
];

/** ev: "tool" — the symbolic names are quoted from U-Boot include/image.h. */
export const UIMAGE_OS = [
  { id: 1, name: "IH_OS_OPENRTOS" }, { id: 2, name: "IH_OS_VXWORKS" },
  { id: 3, name: "IH_OS_QNX" }, { id: 4, name: "IH_OS_U_BOOT" },
  { id: 5, name: "IH_OS_LINUX" }, { id: 6, name: "IH_OS_BSD" },
  { id: 7, name: "IH_OS_NETBSD" }, { id: 8, name: "IH_OS_ARTOS" },
  { id: 9, name: "IH_OS_LYNXOS" }, { id: 10, name: "IH_OS_RTEMS" },
];

/**
 * ev: "recall". The symbolic order below is right, but the numeric ids must be
 * checked against include/image.h for the U-Boot version the board was built
 * with — they have shifted historically. The UI shows this as an unverified
 * enum and never lets it drive an automatic decision.
 */
export const UIMAGE_ARCH = [
  { id: 1, name: "IH_ARCH_ALPHA" }, { id: 2, name: "IH_ARCH_ARM" },
  { id: 3, name: "IH_ARCH_I386" }, { id: 4, name: "IH_ARCH_IA64" },
  { id: 5, name: "IH_ARCH_MIPS" }, { id: 6, name: "IH_ARCH_MIPS64" },
  { id: 7, name: "IH_ARCH_PPC" }, { id: 8, name: "IH_ARCH_S390" },
  { id: 9, name: "IH_ARCH_SH" }, { id: 10, name: "IH_ARCH_SPARC" },
  { id: 11, name: "IH_ARCH_SPARC64" }, { id: 12, name: "IH_ARCH_M68K" },
  { id: 13, name: "IH_ARCH_NIOS" }, { id: 14, name: "IH_ARCH_MICROBLAZE" },
  { id: 15, name: "IH_ARCH_NIOS2" }, { id: 16, name: "IH_ARCH_BLACKFIN" },
  { id: 17, name: "IH_ARCH_AVR32" }, { id: 18, name: "IH_ARCH_ST200" },
  { id: 19, name: "IH_ARCH_SANDBOX" }, { id: 20, name: "IH_ARCH_NDS32" },
  { id: 21, name: "IH_ARCH_OPENRISC" }, { id: 22, name: "IH_ARCH_ARM64" },
  { id: 23, name: "IH_ARCH_ARC" }, { id: 24, name: "IH_ARCH_X86_64" },
  { id: 25, name: "IH_ARCH_XTENSA" }, { id: 26, name: "IH_ARCH_RISCV" },
];

export const UIMAGE_COMP = [
  { id: 0, name: "IH_COMP_NONE" }, { id: 1, name: "IH_COMP_GZIP" },
  { id: 2, name: "IH_COMP_BZIP2" }, { id: 3, name: "IH_COMP_LZMA" },
  { id: 4, name: "IH_COMP_LZO" }, { id: 5, name: "IH_COMP_LZ4" },
  { id: 6, name: "IH_COMP_ZSTD" },
];

export const UIMAGE_TYPE = [
  { id: 1, name: "IH_TYPE_STANDALONE" }, { id: 2, name: "IH_TYPE_KERNEL" },
  { id: 3, name: "IH_TYPE_RAMDISK" }, { id: 4, name: "IH_TYPE_MULTI" },
  { id: 5, name: "IH_TYPE_FIRMWARE" }, { id: 6, name: "IH_TYPE_SCRIPT" },
  { id: 7, name: "IH_TYPE_FILESYSTEM" }, { id: 8, name: "IH_TYPE_FLATDT" },
  { id: 9, name: "IH_TYPE_KWBIMAGE" }, { id: 10, name: "IH_TYPE_IMXIMAGE" },
];

export function parseUimage(bytes, offset = 0) {
  if (bytes.length < offset + 64) return null;
  const magic = rd.u32be(bytes, offset);
  if (magic !== UIMAGE_MAGIC) return null;
  const hcrc = rd.u32be(bytes, offset + 4);
  const time = rd.u32be(bytes, offset + 8);
  const size = rd.u32be(bytes, offset + 12);
  const load = rd.u32be(bytes, offset + 16);
  const ep = rd.u32be(bytes, offset + 20);
  const dcrc = rd.u32be(bytes, offset + 24);
  const os = bytes[offset + 28];
  const arch = bytes[offset + 29];
  const type = bytes[offset + 30];
  const comp = bytes[offset + 31];
  const name = rd.ascii(bytes, offset + 32, 32);

  // header CRC covers the 64 bytes with ih_hcrc zeroed
  const scratch = bytes.slice(offset, offset + 64);
  scratch[4] = scratch[5] = scratch[6] = scratch[7] = 0;
  const calcHcrc = crc32(scratch);

  const dataStart = offset + 64;
  const haveData = bytes.length >= dataStart + size;
  const calcDcrc = haveData ? crc32(bytes, dataStart, dataStart + size) : null;

  return {
    offset, magic, hcrc, calcHcrc, hcrcOk: hcrc === calcHcrc,
    time, timeLabel: time ? new Date(time * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "(unset)",
    size, sizeLabel: labelSize(size),
    load, ep, dcrc, calcDcrc, dcrcOk: calcDcrc === null ? null : dcrc === calcDcrc,
    dataPresent: haveData,
    os, arch, type, comp, name,
    osName: (UIMAGE_OS.find((x) => x.id === os) || {}).name || `unknown(${os})`,
    archName: (UIMAGE_ARCH.find((x) => x.id === arch) || {}).name || `unknown(${arch})`,
    typeName: (UIMAGE_TYPE.find((x) => x.id === type) || {}).name || `unknown(${type})`,
    compName: (UIMAGE_COMP.find((x) => x.id === comp) || {}).name || `unknown(${comp})`,
  };
}

/* ------------------------------------------------------------------ *
 * 6. Firmware signature table
 *    The filesystem/compression magics below are corroborated by the OWASP
 *    FSTM stage-4 walkthrough and by flashrom/binwalk output quoted in it
 *    (ev: "tool"). Rows marked "recall" are transcribed from memory and must
 *    be confirmed against a known-good image before being trusted alone.
 * ------------------------------------------------------------------ */

export const SIGNATURES = [
  { id: "uimage", name: "U-Boot legacy image", magic: "27051956", endian: "big", ev: "tool", what: "uImage header. Parse it — the name field usually gives away the vendor SDK version." },
  { id: "squashfs", name: "SquashFS (LE)", magic: "68737173", endian: "little", ev: "tool", what: "'hsqs'. The root filesystem on most MIPS/ARM routers and IP cameras." },
  { id: "squashfs-be", name: "SquashFS (BE)", magic: "73717368", endian: "big", ev: "tool", what: "'sqsh'. Same filesystem, other byte order. DD-WRT has been seen using a 'tqsh' variant." },
  { id: "jffs2", name: "JFFS2 marker", magic: "8519", endian: "little", ev: "tool", what: "Two bytes only — expect false positives. A real node has a sane nodetype and a valid hdr_crc." },
  { id: "cramfs", name: "CramFS", magic: "453dcd28", endian: "little", ev: "tool", what: "Older embedded root filesystem." },
  { id: "ubi", name: "UBI# EC header", magic: "55424923", endian: "big", ev: "recall", what: "'UBI#' EC header on raw NAND. Verify before trusting." },
  { id: "ubifs", name: "UBIFS node", magic: "31181006", endian: "little", ev: "tool", what: "Quoted in the OWASP FSTM walkthrough as UBIFS 31 18 10 06." },
  { id: "gzip", name: "gzip member", magic: "1f8b08", endian: "any", ev: "tool", what: "Third byte 0x08 = deflate. Very common false positive inside compressed data — require FLG to be sane." },
  { id: "bzip2", name: "bzip2", magic: "425a68", endian: "any", ev: "tool", what: "'BZh' followed by a block-size digit 1-9." },
  { id: "xz", name: "xz", magic: "fd377a585a00", endian: "any", ev: "tool", what: "Six-byte magic. Confirmed against a real OpenWrt-derived recovery image." },
  { id: "lzma-alone", name: "LZMA Alone", magic: "5d0000", endian: "little", ev: "recall", what: "Properties byte 0x5D + a 4-byte dictionary size. Prone to false positives; check the dictionary size is a power of two." },
  { id: "zlib", name: "zlib stream", magic: "789c", endian: "any", ev: "recall", what: "CMF/FLG with default compression. 0x7801 (low) and 0x78DA (best) also occur." },
  { id: "zip", name: "ZIP local file header", magic: "504b0304", endian: "little", ev: "tool", what: "'PK\\x03\\x04'. Vendor firmware is often just a renamed zip." },
  { id: "7zip", name: "7-Zip", magic: "377abcaf271c", endian: "any", ev: "tool", what: "Six bytes." },
  { id: "rar", name: "RAR", magic: "52617221", endian: "any", ev: "tool", what: "'Rar!'." },
  { id: "elf", name: "ELF", magic: "7f454c46", endian: "any", ev: "tool", what: "'\\x7fELF'. Byte 5 tells you 32/64-bit, byte 6 the endianness." },
  { id: "fdt", name: "Flattened Device Tree", magic: "d00dfeed", endian: "big", ev: "tool", what: "'\\xd0\\x0d\\xfe\\xed'. totalsize at +4 gives the blob length." },
  { id: "arm64-image", name: "ARM64 kernel Image", magic: "644d5241", endian: "little", ev: "recall", what: "'ARM\\x64' at offset 56 of an arm64 Image. Check the code0 branch instruction at +0 too." },
  { id: "pe-mz", name: "EFI/PE (MZ)", magic: "4d5a", endian: "little", ev: "tool", what: "'MZ'. On x86 firmware images this is the UEFI volume's payload." },
  { id: "broadcom-nvram", name: "UBOOTENV NVRAM (Broadcom)", magic: "48445230", endian: "big", ev: "recall", what: "'HDR0' — Broadcom CFE NVRAM header. Common on older Broadcom routers." },
  { id: "vendor-wrapper", name: "Sercomm / vendor wrapper", magic: "", endian: "any", ev: "recall", what: "Many vendors wrap the same uImage+SquashFS layout in a proprietary header with a length table. Diff two official updates to find the table." },
];

/**
 * Scan a blob for the signature table.
 *
 * Returns `{ hits, count }`, not a bare array. Every hit is flattened so a
 * caller can render it without reaching back into the table: the `id` is the
 * stable slug used by the action builder, `name`/`what`/`ev` are for display.
 * Rows with an empty `magic` (the vendor-wrapper row) are prose, not patterns,
 * and are skipped — including them would match at every offset.
 */
export function scanSignatures(bytes, { maxHits = 512, alignCheck = false } = {}) {
  const pats = SIGNATURES.filter((s) => s.magic.length > 0).map((s) => ({
    sig: s,
    raw: hexToBytes(s.magic),
  }));
  const hits = [];
  const n = bytes.length;
  for (let i = 0; i < n && hits.length < maxHits; i++) {
    for (const p of pats) {
      const L = p.raw.length;
      if (i + L > n) continue;
      let ok = true;
      for (let k = 0; k < L; k++) if (bytes[i + k] !== p.raw[k]) { ok = false; break; }
      if (!ok) continue;
      if (alignCheck && p.sig.align && i % p.sig.align !== 0) continue;
      hits.push({
        offset: i, offsetHex: hex(i), id: p.sig.id, name: p.sig.name,
        magic: p.sig.magic, bytes: bytesToHex(bytes.subarray(i, i + L)),
        what: p.sig.what, endian: p.sig.endian, ev: p.sig.ev, length: L, sig: p.sig,
      });
    }
  }
  hits.sort((a, b) => a.offset - b.offset || a.name.localeCompare(b.name));
  return { hits, count: hits.length, truncated: hits.length >= maxHits, maxHits };
}

export function hexToBytes(s) {
  const t = String(s).replace(/[^0-9a-fA-F]/g, "");
  const out = new Uint8Array(t.length >> 1);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(t.substr(i * 2, 2), 16);
  return out;
}

/* ------------------------------------------------------------------ *
 * 7. Architectures
 *    ev: "std" where the values are architectural (vector table layout,
 *    register file, endianness) and "report"/"recall" for the vendor-specific
 *    addresses, which must be confirmed against the reference manual for the
 *    exact part.
 * ------------------------------------------------------------------ */

export const ARCHS = [
  {
    id: "cortex-m", name: "ARM Cortex-M (ARMv6-M / v7-M / v8-M)", ev: "std",
    endian: "little (optionally big for code on some implementations)",
    width: 32,
    isa: "Thumb / Thumb-2 — 16-bit encodings, with 32-bit encodings in the -M3/-M4/-M7 and later profiles",
    registers: "R0-R12, SP (R13), LR (R14), PC (R15); xPSR; PRIMASK/FAULTMASK/BASEPRI/CONTROL; MSP and PSP banked by CONTROL.SPSEL",
    debug: "CoreSight: SW-DP or JTAG-DP (SWJ-DP on most parts), AHB-AP. Serial Wire Debug needs only SWDIO+SWCLK; JTAG needs TCK/TMS/TDI/TDO(+nTRST).",
    vectors: "The vector table is at the address in VTOR (0xE000ED08, reset value = flash base). Word 0 = initial MSP, word 1 = reset handler, word 2 = NMI, word 3 = HardFault, then the rest in a fixed architectural order. Word 1's bit0 is always 1 (Thumb state).",
    memmap: [
      { lo: 0x00000000, hi: 0x1fffffff, name: "Code (flash, aliased at 0 by the boot pins)", ev: "std" },
      { lo: 0x20000000, hi: 0x3fffffff, name: "SRAM", ev: "std" },
      { lo: 0x40000000, hi: 0x5fffffff, name: "Peripheral", ev: "std" },
      { lo: 0xe0000000, hi: 0xe00fffff, name: "System: SCS, NVIC, SysTick, MPU at 0xE000Exxx; DWT/ITM/TPIU at 0xE0001000+", ev: "std" },
    ],
    keyRegs: [
      { addr: 0xe000e010, name: "SysTick CTRL/LOAD/VAL", ev: "std" },
      { addr: 0xe000ed00, name: "CPUID — implementer[31:24] (0x41 = ARM), variant, partno, revision", ev: "std" },
      { addr: 0xe000ed04, name: "ICSR — lets a debugger pend/resume and read the active vector", ev: "std" },
      { addr: 0xe000ed08, name: "VTOR — vector table offset", ev: "std" },
      { addr: 0xe000edf0, name: "DHCSR — the debug halt/step register. C_DEBUGEN is the gate on everything else.", ev: "std" },
      { addr: 0xe000edf8, name: "DCRDR / DEMCR — data channel and debug exception & monitor control", ev: "std" },
    ],
    gotchas: [
      "Read-out protection levels exist on nearly every vendor part. Level 1 usually keeps the debug port alive for erase-on-connect; the highest level is documented as irreversible. Check the reference manual for the exact part before assuming anything is recoverable.",
      "nTRST is optional. Many boards do not route it, so a reset means SRST plus five TCKs with TMS high.",
      "SWD and JTAG share pins on most parts; the boot firmware's remap can leave the SWJ pins reassigned to GPIO, and connect-under-reset is the standard way through that.",
    ],
  },
  {
    id: "mips32", name: "MIPS32 (4Kc / 24Kc / 74Kc — the router SoC workhorses)", ev: "std",
    endian: "big-endian by default; many router SoCs strap or configure little-endian, and the kernel image will tell you which",
    width: 32,
    isa: "MIPS I-V + MIPS32 releases. Fixed 32-bit instructions; MIPS16e / microMIPS add 16-bit encodings on some cores.",
    registers: "$0 (hardwired zero), $1 AT, $2-$3 V0-V1, $4-$7 A0-A3, $8-$15 T0-T7, $16-$23 S0-S7, $24-$25 T8-T9, $26-$27 K0-K1, $28 GP, $29 SP, $30 FP, $31 RA; HI/LO; PC; CP0 registers $0-$31",
    debug: "EJTAG. Uses the same four JTAG pins but its own instruction set and a Debug Mode with a small fast-download area (usually 0xFF200200 'pracc' space).",
    vectors: "Boot exception vector at 0xBFC00000 (the uncached alias of the reset flash region). General exception at 0x80000080. The 0x8/0x9/0xA/0xB address prefixes are the MIPS segment map: KSEG0 cached, KSEG1 uncached, both mapping the low 512 MiB of physical RAM/flash.",
    memmap: [
      { lo: 0x80000000, hi: 0x9fffffff, name: "KSEG0 / KSEG1 — low 512 MiB physical, cached / uncached", ev: "std" },
      { lo: 0xa0000000, hi: 0xbfffffff, name: "KSEG2 / KSEG3 — TLB-mapped", ev: "std" },
      { lo: 0xbfc00000, hi: 0xbfc00000 + 0x200000, name: "BEV — where the boot ROM / flash appears at reset", ev: "std" },
    ],
    keyRegs: [
      { addr: 0xff200000, name: "EJTAG debug region start", ev: "report" },
      { addr: 0xff200200, name: "PrAcc fast-download window used by OpenOCD's ejtag_dma / pracc code", ev: "report" },
      { addr: 0x1f000000, name: "typical SoC UART (Atheros/Qualcomm 0x1F000000-ish, MediaTek 0x1E000000-ish, Broadcom varies)", ev: "recall" },
    ],
    gotchas: [
      "EJTAG on many router SoCs is fused off or the pins are unpopulated. A board with a 14-pin footprint that has no header is not necessarily a board with no EJTAG.",
      "Big-endian vs little-endian changes every 32-bit constant you grep for, including the SquashFS magic. Check both.",
      "The IMR (implementation register) read through EJTAG gives the processor revision; the vendor's part number usually comes from the flash contents, not the core.",
    ],
  },
  {
    id: "avr", name: "Microchip (Atmel) AVR — ATmega / ATtiny", ev: "std",
    endian: "little",
    width: 8,
    isa: "RISC, 8-bit. Most instructions are one word (16 bits), a few (JMP/CALL/LPM with post-increment) are two words. 32 registers R0-R31 seen as 16 pairs X/Y/Z.",
    registers: "R0-R31, SPL/SPH, SREG (I T H S V N Z C), EIND/RAMPD/RAMPX/RAMPY/RAMPZ on the larger parts",
    debug: "Three different mechanisms across the family: JTAG (only on the parts that have it — ATmega16/32/64/128/2560 class), debugWIRE (single-wire, on the small parts), and UPDI (the modern single-wire replacement, on the 0/1-series and tinyAVR). PDI exists separately on XMEGA.",
    vectors: "Reset vector at the start of flash; the vector table is one word (or two on parts with >64 KB flash and IVCE-enabled extended vectors) per source, in a fixed order defined in the datasheet. Fuses select whether the vectors live in the application section or the boot section.",
    memmap: [
      { lo: 0x000000, hi: 0x00ffff, name: "Flash (word-addressed in the ISA, byte-addressed in the programmer)", ev: "std" },
      { lo: 0x000100, hi: 0x000fff, name: "SRAM data space starts at 0x100 on most ATmega parts (0x00-0xFF is the register file)", ev: "std" },
      { lo: 0x000000, hi: 0x00001f, name: "Register file R0-R31", ev: "std" },
    ],
    keyRegs: [],
    gotchas: [
      "The word/byte address confusion in the LPM/SPM instructions is the single most common source of 'my bootloader writes to the wrong place'.",
      "Lock bits and fuse bits are separate: fuses configure the device, lock bits protect the flash. Reading out a locked part through the documented interface is not generally possible; the documented recovery route is a full chip erase, which destroys the application.",
      "A part whose fuses were set to an external clock it does not have is not dead — it is recoverable through HVSP or a parallel programmer, and this is the most common self-inflicted AVR brick.",
    ],
  },
  {
    id: "mcs51", name: "Intel MCS-51 / 8051 derivatives (STC, Silabs C8051, NXP P89)", ev: "std",
    endian: "little for 16-bit ops, big for some vendor bootloaders",
    width: 8,
    isa: "CISC-ish 8-bit. 111 instructions, 1-4 bytes. Accumulator-centric: A, B, R0-R7 in four banks, DPTR, PC, SP.",
    registers: "A (E0h), B (F0h), PSW (D0h), SP (81h), DPTR (82h/83h), P0-P3 (80h/90h/A0h/B0h), plus SFR space 80h-FFh and bit-addressable 20h-2Fh in IRAM",
    debug: "Vendor-specific. Silabs C8051F uses a 16-bit-IR IEEE 1149.1 TAP (see AN105). STC parts use a serial ISP protocol over UART with a proprietary handshake.",
    vectors: "Reset at 0x0000, external INT0 at 0x0003, Timer0 at 0x000B, INT1 at 0x0013, Timer1 at 0x001B, serial at 0x0023, Timer2 at 0x002B. Eight bytes apart, which is why 8051 code is full of LJMPs at fixed offsets.",
    memmap: [
      { lo: 0x000000, hi: 0x00ffff, name: "Code space (external, via MOVC)", ev: "std" },
      { lo: 0x000000, hi: 0x0000ff, name: "IRAM lower 128 bytes — directly and indirectly addressable", ev: "std" },
      { lo: 0x000080, hi: 0x0000ff, name: "SFR space — the same addresses as upper IRAM, distinguished by direct vs indirect addressing", ev: "std" },
    ],
    keyRegs: [],
    gotchas: [
      "Upper IRAM and SFR space overlap at 80h-FFh. Direct addressing hits the SFR, indirect hits the RAM. Misreading this is a guaranteed bug.",
      "STC ISP requires a cold reset while the handshake is on the wire — power-cycle timing, not a reset pin.",
    ],
  },
  {
    id: "esp32", name: "Espressif ESP8266 / ESP32 / ESP32-S3", ev: "std",
    endian: "little",
    width: 32,
    isa: "ESP8266: Xtensa LX106. ESP32: Xtensa LX6 (dual). ESP32-S3: Xtensa LX7. ESP32-C3/C6: RISC-V.",
    registers: "Xtensa: A0-A15 windowed (the window rotates, so a register number means different things at different call depth), PC, SAR, plus special registers. RISC-V: x0-x31 standard.",
    debug: "Serial bootloader ROM protocol over UART0 at 74880 baud (ESP8266 boot messages) / 115200 (ESP32), with a sync frame and auto-reset via DTR/RTS on EN+GPIO0. JTAG exists on the S3 and C3 and is supported by OpenOCD; on the classic ESP32 it is present but rarely populated.",
    vectors: "ROM bootloader at a masked address; it reads the flash header at 0x0 (ESP8266: four 4-byte segments starting with a magic 0xE9) and jumps to the second-stage bootloader.",
    memmap: [
      { lo: 0x3ff00000, hi: 0x3fffffff, name: "ESP8266 peripherals / ESP32 DRAM-adjacent", ev: "report" },
      { lo: 0x40000000, hi: 0x4fffffff, name: "Instruction bus / internal ROM & IRAM", ev: "report" },
      { lo: 0x3f400000, hi: 0x3f7fffff, name: "ESP32 memory-mapped flash (DROM)", ev: "report" },
    ],
    keyRegs: [],
    gotchas: [
      "The ESP8266 flash image starts with magic byte 0xE9 followed by segment count, SPI mode, size/frequency, entry address. If a dump does not start with 0xE9 you are looking at the wrong offset or the wrong flash.",
      "Auto-reset wiring matters: DTR→EN and RTS→GPIO0 through the two-transistor arrangement, otherwise the chip lands in the wrong boot mode. Directly tying both is the classic 'it never enters download mode' fault.",
      "74880 baud on ESP8266 boot ROM messages is not a typo and not a broken crystal — it is the ROM's rate.",
    ],
  },
  {
    id: "x86-bios", name: "x86 / x86-64 platform firmware (BIOS / UEFI)", ev: "std",
    endian: "little",
    width: "16 at reset, 32/64 later",
    isa: "x86. At reset the CPU is in real mode with CS:IP = F000:FFF0, so the SPI flash is mapped so that its last 16 bytes land at 0xFFFFFFF0.",
    registers: "AX/BX/CX/DX (+H/L), SI/DI/BP/SP, CS/DS/ES/SS/FS/GS, FLAGS, EIP; 64-bit adds R8-R15 and RFLAGS",
    debug: "Not JTAG in the usual sense on production boards. Intel parts expose DCI over USB3 (BSSA/DbC) or ITP/XDP; AMD exposes HDT/SVI. External SPI programmer + flashrom is the realistic route for a repair.",
    vectors: "Reset vector at 0xFFFFFFF0. The flash descriptor (Intel) at offset 0x10 of the SPI dump, with the signature 0x5AA5F00F, defines the region layout.",
    memmap: [
      { lo: 0xfff00000, hi: 0xffffffff, name: "Top-of-flash alias containing the reset vector and the descriptor/ME/BIOS regions", ev: "std" },
      { lo: 0x000a0000, hi: 0x000fffff, name: "Legacy VGA/BIOS ROM shadow window", ev: "std" },
    ],
    keyRegs: [],
    gotchas: [
      "A full SPI dump is not the same as a BIOS region. On Intel platforms you must not write the descriptor or ME region back from a dump taken on a different board — the ME region carries per-board data and the descriptor carries the MAC.",
      "If flashrom reports the chip but reads all 0xFF, suspect the board is holding the chip in reset or the descriptor lock is blocking reads from the host side. An external programmer with the chip clipped (or desoldered, with power off) sidesteps both.",
      "BootGuard / verified boot means a re-flashed image whose signatures do not match the fused key manifest will not start. Check whether the platform fuses are set before promising a repair.",
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 8. Instruction tables — small, exact, and disassemblable.
 *    ev: "std". Each row is an encoding that can be assembled and
 *    disassembled by cw-arch.js; the verify script round-trips them.
 * ------------------------------------------------------------------ */

export const ISA = {
  thumb: {
    arch: "cortex-m", bits: 16, ev: "std",
    /*
     * In Thumb state a PC-relative branch reads PC as the address of the
     * current instruction PLUS FOUR, even though the instruction is only two
     * bytes wide. That is not a quirk to work around — it is the architectural
     * definition of the branch target, and it is what makes 0xE7FE the
     * canonical self-loop: imm11 sign-extends to -2, ×2 gives -4, and
     * (addr + 4) - 4 lands back on addr. Using addr + 2 instead puts every
     * Thumb branch target two bytes low, which points at the wrong halfword
     * and looks like plausible output right up until you follow it.
     */
    branchPcOffset: 4,
    note: "ARMv6-M subset — the encodings every Cortex-M0 bootloader is made of. bit15 is the MSB.",
    rows: [
      { asm: "MOVS Rd, #imm8", mask: "1111100000000000", val: "0010000000000000", enc: "00100dddiiiiiiii", fields: { Rd: [10, 8], imm8: [7, 0] }, note: "Rd 0-7 only. Sets N/Z." },
      { asm: "CMP Rn, #imm8", mask: "1111100000000000", val: "0010100000000000", enc: "00101nnniiiiiiii", fields: { Rn: [10, 8], imm8: [7, 0] }, note: "Subtracts without writing back." },
      { asm: "ADDS Rd, Rn, #imm3", mask: "1111100000000000", val: "0001100000000000", enc: "00011immnnnddd", fields: { imm3: [8, 6], Rn: [5, 3], Rd: [2, 0] }, note: "The 3-bit immediate form." },
      { asm: "LSLS Rd, Rm, #imm5", mask: "1111100000000000", val: "0000000000000000", enc: "00000iiiiiimmmddd", fields: { imm5: [10, 6], Rm: [5, 3], Rd: [2, 0] }, note: "imm5 = 0 means a MOV." },
      { asm: "ADD Rd, Rn", mask: "1111111100000000", val: "0100010000000000", enc: "010001000Dmmmmmddd", fields: {}, note: "High-register add; D and Rm[3] extend the register number to R0-R15." },
      { asm: "BX Rm", mask: "1111111110000111", val: "0100011100000000", enc: "010001110mmmm000", fields: { Rm: [6, 3] }, note: "Branch and exchange. Bit0 of Rm selects the instruction set — on a Cortex-M it must be 1." },
      { asm: "BLX Rm", mask: "1111111110000111", val: "0100011110000000", enc: "010001111mmmm000", fields: { Rm: [6, 3] }, note: "As BX, saving the return address in LR." },
      { asm: "PUSH {regs, LR}", mask: "1111111000000000", val: "1011010000000000", enc: "1011010Mrrrrrrrr", fields: { M: [8, 8], r7_r0: [7, 0] }, note: "M = LR in the list. Register list is R0..R7 ascending, LR last." },
      { asm: "POP {regs, PC}", mask: "1111111000000000", val: "1011110000000000", enc: "1011110Prrrrrrrr", fields: { P: [8, 8], r7_r0: [7, 0] }, note: "P = PC in the list, which is how a function returns." },
      { asm: "B #imm11", mask: "1111100000000000", val: "1110000000000000", enc: "11100iiiiiiiiiii", fields: { imm11: [10, 0] }, note: "PC-relative, sign-extended, ×2. Range ±2 KB." },
      { asm: "BEQ #imm8", mask: "1111000000000000", val: "1101000000000000", enc: "1101cccciiiiiiii", fields: { cond: [11, 8], imm8: [7, 0] },
        /*
         * cond is four bits but only 0-13 encode a condition. 0b1110 is
         * UNDEFINED and 0b1111 is SVC, which is a different instruction with a
         * different immediate. The mask/val pair cannot express "not 14, not
         * 15", so the row carries an explicit rejection instead — otherwise
         * 0xDEAD decodes to a confident BEQ and 0xDFFF to a confident branch,
         * both invented out of encodings the architecture reserves.
         */
        rejectIf: (f) => f.cond >= 14,
        reservedNote: "cond 0b1110 is UNDEFINED and 0b1111 is SVC; this word matches the conditional-branch pattern but its condition field is reserved.",
        note: "Conditional branch. cond 0=EQ 1=NE 2=CS 3=CC 4=MI 5=PL 6=VS 7=VC 8=HI 9=LS A=GE B=LT C=GT D=LE." },
      { asm: "NOP", mask: "1111111111111111", val: "1011111100000000", enc: "1011111100000000", fields: {}, note: "0xBF00." },
    ],
  },
  mips: {
    arch: "mips32", bits: 32, ev: "std",
    note: "The R-type/I-type/J-type core. Fields: op[31:26] rs[25:21] rt[20:16] rd[15:11] sa[10:6] funct[5:0].",
    rows: [
      { asm: "ADDU rd, rs, rt", enc: "000000ssssstttttddddd00000100001", fields: { rs: [25, 21], rt: [20, 16], rd: [15, 11] }, note: "funct 0x21, no overflow trap." },
      { asm: "SUBU rd, rs, rt", enc: "000000ssssstttttddddd00000100011", fields: { rs: [25, 21], rt: [20, 16], rd: [15, 11] }, note: "funct 0x23." },
      { asm: "AND rd, rs, rt", enc: "000000ssssstttttddddd00000100100", fields: { rs: [25, 21], rt: [20, 16], rd: [15, 11] }, note: "funct 0x24." },
      { asm: "OR rd, rs, rt", enc: "000000ssssstttttddddd00000100101", fields: { rs: [25, 21], rt: [20, 16], rd: [15, 11] }, note: "funct 0x25." },
      { asm: "SLL rd, rt, sa", enc: "00000000000tttttdddddsssss000000", fields: { rt: [20, 16], rd: [15, 11], sa: [10, 6] }, note: "funct 0x00. SLL $0,$0,0 is the architectural NOP — all zeroes." },
      { asm: "JR rs", enc: "000000sssss000000000000000001000", fields: { rs: [25, 21] }, note: "funct 0x08. The instruction after it is in the branch delay slot and always executes." },
      { asm: "JAL target", enc: "000011tttttttttttttttttttttttttt", fields: { target: [25, 0] }, note: "op 0x03. Target is 26 bits ×4 in the current 256 MiB region." },
      { asm: "LUI rt, imm", enc: "00111100000ttttttttttttttttttttt", fields: { rt: [20, 16], imm: [15, 0] }, note: "op 0x0F. Loads imm<<16; the standard first half of a 32-bit constant." },
      { asm: "ADDIU rt, rs, imm", enc: "001001ssssstttttiiiiiiiiiiiiiiii", fields: { rs: [25, 21], rt: [20, 16], imm: [15, 0] }, note: "op 0x09. ADDIU $sp,$sp,-N is the prologue you will see most." },
      { asm: "LW rt, off(rs)", enc: "100011ssssstttttiiiiiiiiiiiiiiii", fields: { rs: [25, 21], rt: [20, 16], off: [15, 0] }, note: "op 0x23." },
      { asm: "SW rt, off(rs)", enc: "101011ssssstttttiiiiiiiiiiiiiiii", fields: { rs: [25, 21], rt: [20, 16], off: [15, 0] }, note: "op 0x2B." },
      { asm: "BEQ rs, rt, off", enc: "000100ssssstttttiiiiiiiiiiiiiiii", fields: { rs: [25, 21], rt: [20, 16], off: [15, 0] }, note: "op 0x04. Offset is sign-extended ×4 from PC+4." },
      { asm: "BNE rs, rt, off", enc: "000101ssssstttttiiiiiiiiiiiiiiii", fields: { rs: [25, 21], rt: [20, 16], off: [15, 0] }, note: "op 0x05. Branch if not equal; same sign-extended ×4 offset from PC+4, and the delay slot always executes." },
      { asm: "J target", enc: "000010tttttttttttttttttttttttttt", fields: { target: [25, 0] }, note: "op 0x02. The 26-bit target is shifted left two and combined with the top four bits of PC+4, so a J cannot cross a 256 MiB region boundary — which is why linkers emit JR for far jumps and why a hand-assembled J into a different region lands somewhere unexpected." },
    ],
  },
  mos6502: {
    arch: "6502", bits: 8, ev: "std",
    note: "The 56 official opcodes. Addressing-mode bytes are exact and verifiable against any 6502 reference.",
    rows: [
      { asm: "LDA #imm", op: 0xa9, len: 2, mode: "immediate", note: "A = M" },
      { asm: "LDA zp", op: 0xa5, len: 2, mode: "zero page" },
      { asm: "LDA abs", op: 0xad, len: 3, mode: "absolute" },
      { asm: "STA zp", op: 0x85, len: 2, mode: "zero page" },
      { asm: "STA abs", op: 0x8d, len: 3, mode: "absolute" },
      { asm: "TAX", op: 0xaa, len: 1, mode: "implied" },
      { asm: "TAY", op: 0xa8, len: 1, mode: "implied" },
      { asm: "TXA", op: 0x8a, len: 1, mode: "implied" },
      { asm: "TYA", op: 0x98, len: 1, mode: "implied" },
      { asm: "CLC", op: 0x18, len: 1, mode: "implied" },
      { asm: "SEC", op: 0x38, len: 1, mode: "implied" },
      { asm: "SEI", op: 0x78, len: 1, mode: "implied" },
      { asm: "CLI", op: 0x58, len: 1, mode: "implied" },
      { asm: "PHA", op: 0x48, len: 1, mode: "implied" },
      { asm: "PLA", op: 0x68, len: 1, mode: "implied" },
      { asm: "JSR abs", op: 0x20, len: 3, mode: "absolute" },
      { asm: "RTS", op: 0x60, len: 1, mode: "implied" },
      { asm: "JMP abs", op: 0x4c, len: 3, mode: "absolute" },
      { asm: "JMP (ind)", op: 0x6c, len: 3, mode: "indirect", note: "The famous page-boundary bug: on NMOS 6502 the high byte of the target is fetched from the start of the same page." },
      { asm: "NOP", op: 0xea, len: 1, mode: "implied" },
      { asm: "BRK", op: 0x00, len: 1, mode: "implied" },
      { asm: "RTI", op: 0x40, len: 1, mode: "implied" },
      { asm: "ADC #imm", op: 0x69, len: 2, mode: "immediate" },
      { asm: "SBC #imm", op: 0xe9, len: 2, mode: "immediate" },
      { asm: "AND #imm", op: 0x29, len: 2, mode: "immediate" },
      { asm: "ORA #imm", op: 0x09, len: 2, mode: "immediate" },
      { asm: "EOR #imm", op: 0x49, len: 2, mode: "immediate" },
      { asm: "CMP #imm", op: 0xc9, len: 2, mode: "immediate" },
      { asm: "INC zp", op: 0xe6, len: 2, mode: "zero page" },
      { asm: "DEC zp", op: 0xc6, len: 2, mode: "zero page" },
      { asm: "INX", op: 0xe8, len: 1, mode: "implied" },
      { asm: "DEX", op: 0xca, len: 1, mode: "implied" },
      { asm: "INY", op: 0xc8, len: 1, mode: "implied" },
      { asm: "DEY", op: 0x88, len: 1, mode: "implied" },
      { asm: "BEQ rel", op: 0xf0, len: 2, mode: "relative" },
      { asm: "BNE rel", op: 0xd0, len: 2, mode: "relative" },
      { asm: "BCC rel", op: 0x90, len: 2, mode: "relative" },
      { asm: "BCS rel", op: 0xb0, len: 2, mode: "relative" },
      { asm: "BMI rel", op: 0x30, len: 2, mode: "relative" },
      { asm: "BPL rel", op: 0x10, len: 2, mode: "relative" },
      { asm: "BVC rel", op: 0x50, len: 2, mode: "relative" },
      { asm: "BVS rel", op: 0x70, len: 2, mode: "relative" },
    ],
  },
  avr: {
    arch: "avr", bits: 16, ev: "std",
    note: "A working subset, word-encoded little-endian (low byte first in flash).",
    rows: [
      { asm: "NOP", enc: "0000000000000000" },
      { asm: "LDI Rd, K", enc: "1110KKKKddddKKKK", note: "d = 16..31 (R16-R31 only)." },
      { asm: "MOV Rd, Rr", enc: "001011rdddddrrrr", note: "Full 32-register MOV. R0-R15 need MOVW or the 16-bit-range form." },
      { asm: "ADD Rd, Rr", enc: "000011rdddddrrrr" },
      { asm: "SUB Rd, Rr", enc: "000110rdddddrrrr" },
      { asm: "AND Rd, Rr", enc: "001000rdddddrrrr" },
      { asm: "OR Rd, Rr", enc: "001010rdddddrrrr" },
      { asm: "RJMP k", enc: "1100kkkkkkkkkkkk", note: "12-bit signed word offset, ×2 bytes, ±4 KB." },
      { asm: "RCALL k", enc: "1101kkkkkkkkkkkk" },
      { asm: "RET", enc: "1001010100001000" },
      { asm: "RETI", enc: "1001010100011000" },
      { asm: "PUSH Rr", enc: "1001001rrrrr1111" },
      { asm: "POP Rr", enc: "1001000rrrrr1111" },
      { asm: "IN Rd, A", enc: "10110AAdddddAAAA", note: "A is the 6-bit I/O address (0-63); the datasheet's 0x20-0x5F SFR addresses map to A-0x20." },
      { asm: "OUT A, Rr", enc: "10111AArrrrrAAAA" },
      { asm: "SBI A, b", enc: "10011010AAAAAbbb", note: "Set bit in I/O register, A = 0-31 only." },
      { asm: "CBI A, b", enc: "10011000AAAAAbbb" },
      { asm: "SEI", enc: "1001010001111000" },
      { asm: "CLI", enc: "1001010011111000" },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * 9. Debug connectors
 * ------------------------------------------------------------------ */

export const CONNECTORS = [
  {
    id: "arm20", name: "ARM standard 20-pin JTAG (2×10, 0.1\")", ev: "std",
    pitch: "2.54 mm",
    pins: [
      [1, "VTref", "Target reference voltage. The probe measures this, it does not supply it."],
      [2, "Vsupply", "Optional; many boards leave it unconnected."],
      [3, "nTRST", "Test reset, active low. Frequently not routed at all."],
      [4, "GND"], [5, "TDI"], [6, "GND"], [7, "TMS"], [8, "GND"],
      [9, "TCK"], [10, "GND"], [11, "RTCK", "Return clock — the target's own gated TCK, for adaptive clocking."],
      [12, "GND"], [13, "TDO"], [14, "GND"], [15, "nSRST", "System reset, active low."],
      [16, "GND"], [17, "DBGRQ", "Optional on the legacy connector."], [18, "GND"],
      [19, "DBGACK", "Optional."], [20, "GND"],
    ],
    note: "Every other pin is ground. That is not padding — it is what lets a 20-wire ribbon run next to a switching supply without turning into an antenna.",
  },
  {
    id: "arm10", name: "ARM 10-pin (2×5, 1.27 mm) — the modern Cortex-M default", ev: "std",
    pitch: "1.27 mm",
    pins: [
      [1, "VTref"], [2, "SWDIO / TMS"], [3, "GND"], [4, "SWDCLK / TCK"],
      [5, "GND"], [6, "SWO / TDO"], [7, "n/a (key)"], [8, "TDI"],
      [9, "GND"], [10, "nRESET / nSRST"],
    ],
    note: "The same ten pins serve both SWD and JTAG, which is why the connector is silk-screened either way on a lot of boards.",
  },
  {
    id: "arm20ct", name: "Cortex 20-pin (2×10, 0.05\" / 1.27 mm)", ev: "std",
    pitch: "1.27 mm",
    pins: [
      [1, "VTref"], [2, "SWDIO/TMS"], [3, "GND"], [4, "SWDCLK/TCK"], [5, "GND"],
      [6, "SWO/TDO"], [7, "key"], [8, "TDI"], [9, "GND"], [10, "RESET/nSRST"],
      [11, "GND"], [12, "nTRST"], [13, "SWOITM/TPI"], [14, "GND"], [15, "nRESET"],
      [16, "GND"], [17, "NC"], [18, "GND"], [19, "5V"], [20, "GND"],
    ],
    note: "Physically incompatible with the 2.54 mm 20-pin despite the same pin count. Adapters exist; assuming one is the classic mistake.",
  },
  {
    id: "jtag14", name: "MIPS EJTAG 14-pin (2×7, 1.27 mm)", ev: "report",
    pitch: "1.27 mm",
    pins: [
      [1, "TRST"], [2, "GND"], [3, "TDI"], [4, "GND"], [5, "TCK"], [6, "GND"],
      [7, "TMS"], [8, "GND"], [9, "SRST"], [10, "GND"], [11, "TDO"], [12, "GND"],
      [13, "NC/VTref"], [14, "GND"],
    ],
    note: "There is no single standard here — several vendors ship different 14-pin maps. Measure continuity to ground and to the SoC before connecting anything.",
  },
  {
    id: "uart4", name: "Unpopulated 4-pin UART (the cheapest door in)", ev: "report",
    pitch: "2.54 mm usually",
    pins: [[1, "VCC"], [2, "GND"], [3, "TX"], [4, "RX"]],
    note: "Find it by measuring continuity to ground for GND, then by looking for two adjacent traces that go to the SoC's UART pads. 3.3 V logic almost always — measure VCC before connecting a level-shifter-less adapter. Baud rates worth trying in order: 115200, 57600, 38400, 9600, 74880 (ESP8266 ROM).",
  },
];

/* ------------------------------------------------------------------ *
 * 10. Substitution families — the cross-manufacturer question
 *     ev: "tool" where the identity of the codes is documented (flashrom,
 *     vendor datasheets quoted in the sources block); "report" where it is
 *     common workshop knowledge that varies by production run.
 * ------------------------------------------------------------------ */

export const SUBSTITUTION_FAMILIES = [
  {
    id: "spi-nor-3v3",
    name: "3.3 V SPI NOR, 4 KB uniform sectors, SOIC-8 / WSON-8",
    ev: "tool",
    basis: "The command set is a de-facto industry standard: 0x06 WREN, 0x03 READ, 0x02 PP, 0x20 SE-4K, 0xD8 BE-64K, 0x9F RDID, 0x05 RDSR. Parts from different vendors implementing it are protocol-compatible at the SPI level.",
    members: [
      { vendor: "Winbond", part: "W25Q32JV / W25Q32FV", cap: 4 << 20, v: [2.7, 3.6], rdid: "EF 40 16", ev: "tool" },
      { vendor: "GigaDevice", part: "GD25Q32E", cap: 4 << 20, v: [2.7, 3.6], rdid: "C8 40 16", ev: "tool" },
      { vendor: "Macronix", part: "MX25L3206E / MX25L3233F", cap: 4 << 20, v: [2.7, 3.6], rdid: "C2 20 16", ev: "tool" },
      { vendor: "EON", part: "EN25QH32", cap: 4 << 20, v: [2.7, 3.6], rdid: "1C 70 16", ev: "report" },
      { vendor: "XTX", part: "XT25F32B", cap: 4 << 20, v: [2.7, 3.6], rdid: "0B 40 16", ev: "recall" },
      { vendor: "Puya", part: "P25Q32L", cap: 4 << 20, v: [2.3, 3.6], rdid: "85 60 16", ev: "recall" },
      { vendor: "Zbit", part: "ZB25VQ32", cap: 4 << 20, v: [2.7, 3.6], rdid: "5E 60 16", ev: "report" },
      { vendor: "Micron/ST", part: "M25P32 / N25Q032A", cap: 4 << 20, v: [2.7, 3.6], rdid: "20 20 16", ev: "tool" },
    ],
    gates: [
      { id: "capacity", hard: true, question: "Is the capacity identical?", why: "A smaller part truncates the image; a larger one usually works but the dump no longer round-trips and any code that assumes the size breaks." },
      { id: "vcc", hard: true, question: "Does the VCC range cover the board's rail?", why: "3.3 V vs 1.8 V parts share part-number shapes (W25Q32JV vs W25Q32JW). A 1.8 V part on a 3.3 V rail is destroyed, and it can take the rail with it." },
      { id: "package", hard: true, question: "Same package and pinout?", why: "SOIC-8 (208-mil and 150-mil are different footprints), WSON-8 6×5, WSON-8 8×6, USON-8. The pinout is the same across vendors; the footprint is not." },
      { id: "jedec", hard: false, question: "Does the host bootloader whitelist a specific RDID?", why: "Many vendor bootloaders and vendor flashing tools refuse an unknown JEDEC ID. This is the most common reason a physically perfect substitution fails at power-on." },
      { id: "sr-layout", hard: false, question: "Where do QE and SRP live in the status registers?", why: "Winbond puts QE in SR2 bit1 with the 0x35/0x31 accessors; other vendors put it in SR1 bit6. Firmware that writes SR blindly will disable quad mode or lock the part." },
      { id: "bp-layout", hard: false, question: "Do the block-protect bits cover the same address ranges?", why: "A status byte copied from one vendor to another can protect a different fraction of the array. The GD25Q128E datasheet publishes an explicit BP4-BP0 table; compare it, do not assume." },
      { id: "erase-gran", hard: false, question: "Which erase opcodes exist and at what granularity?", why: "0x52 (32 KB) is not universal. 0xD8 vs 0xDC for 64 KB differs between 3.3 V and 1.8 V families." },
      { id: "sfdp", hard: false, question: "Does the replacement answer SFDP (0x5A)?", why: "If the host reads SFDP, a part without it will be misconfigured. If the host does not, a part with a different SFDP table than its predecessor may be configured differently." },
      { id: "speed", hard: false, question: "Is fmax at least the board's SPI clock?", why: "A 104 MHz part replacing an 80 MHz part is fine. The reverse causes intermittent read corruption that looks like a bad solder joint." },
      { id: "otp", hard: false, question: "Are the security registers / OTP bits already burned on the donor part?", why: "A used part with OTP locked cannot take a per-device unique ID, MAC address or key. Read 0x48/0x4B before buying." },
    ],
  },
  {
    id: "logic-74hc",
    name: "74-series logic — the family-letter substitution",
    ev: "std",
    basis: "The function and pinout are defined by the 74xx number; the letters between 74 and the number are the manufacturer's process family, and they change the electrical envelope, not the truth table.",
    members: [
      { vendor: "TI", part: "SN74HCT00", cap: 0, v: [4.5, 5.5], rdid: "", ev: "std", note: "HCT inputs are TTL-level: VIH 2.0 V. Interop with 5 V CMOS outputs and 3.3 V drivers." },
      { vendor: "onsemi (Fairchild)", part: "MM74HCT00", cap: 0, v: [4.5, 5.5], rdid: "", ev: "std" },
      { vendor: "ST", part: "M74HCT00", cap: 0, v: [4.5, 5.5], rdid: "", ev: "std" },
      { vendor: "Nexperia", part: "74HCT00", cap: 0, v: [4.5, 5.5], rdid: "", ev: "std" },
      { vendor: "Harris/Intersil/Renesas", part: "CD74HCT00", cap: 0, v: [4.5, 5.5], rdid: "", ev: "report", note: "CD74 is a different pin-compatible family with slightly different timing; check tpd." },
    ],
    gates: [
      { id: "subfamily", hard: true, question: "HC vs HCT vs AHC vs AHCT vs LVC vs LVCH?", why: "HC inputs need CMOS levels (VIH ≈ 3.5 V at 5 V) and will not reliably see a 3.3 V output. HCT inputs are TTL-level and will. AHC is 3.3 V-native. Getting this wrong produces a circuit that works on the bench and fails in the cold." },
      { id: "vcc", hard: true, question: "Supply range covers the rail?", why: "74HC is 2-6 V; 74AHC is 1.65-5.5 V but is NOT 5 V tolerant on inputs; 74LVC is 1.65-3.6 V with 5 V tolerant inputs." },
      { id: "drive", hard: false, question: "Output drive and fanout?", why: "±4 mA (HC) vs ±8 mA (AHC variants) vs ±24 mA (some LVC). A buffer driving a long ribbon needs the number checked." },
      { id: "timing", hard: false, question: "Propagation delay within budget?", why: "Substituting a slower family into a clock path shifts phase. In a bus-hold or level-shift role it does not matter; in a clock tree it does." },
    ],
  },
  {
    id: "ldo-sot223",
    name: "SOT-223 3.3 V LDO — the most-substituted part on any board",
    ev: "report",
    basis: "A large family of parts share the SOT-223 pinout (1 = GND/ADJ, 2 = VOUT + tab, 3 = VIN) and a 1 A class rating, but they do NOT share dropout voltage or quiescent current.",
    members: [
      { vendor: "many", part: "AMS1117-3.3", cap: 0, v: [4.5, 12], rdid: "", ev: "report", note: "Dropout ≈ 1.1 V at 800 mA; Iq typically 5-10 mA. Very common, very mediocre." },
      { vendor: "TI", part: "TLV1117-33", cap: 0, v: [4.5, 12], rdid: "", ev: "report", note: "Pin-compatible with AMS1117, dropout ≈ 1.2 V max at 800 mA." },
      { vendor: "onsemi", part: "NCP1117-3.3", cap: 0, v: [4.5, 12], rdid: "", ev: "report" },
      { vendor: "Microchip", part: "MCP1825-3302E", cap: 0, v: [2.1, 6], rdid: "", ev: "report", note: "Different input range, much lower dropout (~210 mV), different pinout — NOT a drop-in." },
    ],
    gates: [
      { id: "pinout", hard: true, question: "Identical pinout AND package?", why: "SOT-223 and SOT-89 and TO-252 all exist in this role. Even within SOT-223 the tab connection differs (VOUT vs GND) between part families." },
      { id: "dropout", hard: true, question: "Is VIN − VOUT above the new part's dropout at the worst-case load?", why: "This is the failure that looks like a dead board: a 5 V rail, a 1.1 V dropout part, 3.3 V out, and a load spike pushes it into dropout. The MCU browns out at random." },
      { id: "iq", hard: false, question: "Quiescent current acceptable?", why: "10 mA of Iq on a battery device is the difference between months and days." },
      { id: "caps", hard: true, question: "Output capacitor ESR / value in the new part's stable range?", why: "Some LDO families require a minimum ESR and become unstable with a ceramic; others require ceramic. An unstable LDO looks exactly like a shorted board." },
      { id: "protection", hard: false, question: "Thermal shutdown / current limit present and adequate?", why: "Substituting a part with no current limit into a rail that can be shorted removes the only thing that was protecting the rest of the board." },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 11. Symptom → test → fix. This is the repair planner's rule base.
 *     ev: "report" throughout — these are workshop diagnostics, not
 *     measurements from this repo. The UI says so.
 * ------------------------------------------------------------------ */

export const SYMPTOMS = [
  {
    id: "no-idcode",
    symptom: "JTAG scan returns no IDCODE / all-ones / all-zeros on TDO",
    ev: "report",
    tests: [
      { order: 1, action: "Measure VTref at the connector", expect: "the board's core rail, usually 3.3 V ±5%, or 1.8 V", ifFail: "The board is not powered or the rail is down. Fix power first — a JTAG probe cannot debug an unpowered target, and driving TDI into an unpowered part can latch it up." },
      { order: 2, action: "Scope TCK at the target pin, not at the probe", expect: "clean edges at the configured speed, no ringing that crosses VIH/VIL", ifFail: "Too fast, too long a lead, or no ground reference. Drop to 100 kHz-1 MHz, shorten the lead, and make sure at least two grounds are connected." },
      { order: 3, action: "Clock TMS high for 5 TCKs and check that TDO responds", expect: "the TAP reaches Test-Logic-Reset; with IDCODE implemented, TDO drives the LSB (1) in Capture-DR", ifFail: "If TDO stays high-Z, the part's JTAG is disabled or the pins are remapped to GPIO by the boot firmware. Try connect-under-reset (assert SRST, start the scan, release SRST during the scan)." },
      { order: 4, action: "Measure TDO continuity to the SoC pin", expect: "a few ohms", ifFail: "The header is not actually wired to the SoC, or there is a series resistor / buffer in the path. Many boards populate a footprint that goes nowhere." },
      { order: 5, action: "Check for a read-out-protection fuse", expect: "documented in the part's reference manual under 'debug access'", ifFail: "If the highest protection level is set, the vendor documents debug access as disabled. That is a dead end by design — see the ethics note." },
    ],
  },
  {
    id: "flash-ff",
    symptom: "SPI flash reads back all 0xFF",
    ev: "report",
    tests: [
      { order: 1, action: "Send RDID (0x9F) and read three bytes", expect: "a known vendor / type / capacity triple", ifFail: "If RDID is also 0xFFFFFF, the chip is not talking: check CS# toggling, check that the chip is not held in reset, check VCC at the chip pin." },
      { order: 2, action: "Send 0xAB (release power-down), wait 3 µs, retry", expect: "a real ID", ifFail: "A part left in deep power-down answers nothing. This survives a programmer that never sends 0xAB." },
      { order: 3, action: "Check the block-protect bits in SR1", expect: "BP2:BP0 = 000", ifFail: "If SRP0 is set, WRSR is ignored. Use 0x50 (write-enable volatile SR) then 0x01 to clear the volatile copy; the non-volatile bits may be permanently set." },
      { order: 4, action: "Read with the chip isolated (clipped with power off, or desoldered)", expect: "real data", ifFail: "In-circuit reads fail when another device drives MISO or when the SoC holds the bus. Isolation is not optional for a trustworthy dump." },
      { order: 5, action: "Verify the dump twice and diff", expect: "bit-identical", ifFail: "Non-reproducible reads mean a signal-integrity problem, not a data problem. Fix that first; a corrupt dump written back is how a repairable board becomes unrepairable." },
    ],
  },
  {
    id: "flash-00",
    symptom: "SPI flash reads back all 0x00",
    ev: "report",
    tests: [
      { order: 1, action: "Check MISO wiring and the programmer's pin map", expect: "MISO on the programmer's SO input", ifFail: "Reversed SO/SI gives all zeros on read and a failed verify on write. The single most common homebrew-programmer fault." },
      { order: 2, action: "Check that CS# actually toggles", expect: "a low pulse framing each transaction", ifFail: "If CS# never asserts, the part never drives MISO and the line floats to whatever the pull does — often 0." },
      { order: 3, action: "Check for a second device on the same MISO", expect: "one driver", ifFail: "Bus contention. Isolate." },
    ],
  },
  {
    id: "boot-loop",
    symptom: "Device powers up, then resets every few seconds",
    ev: "report",
    tests: [
      { order: 1, action: "Watch the 3.3 V rail on a scope at power-on, AC coupled, 100 ms window", expect: "a monotonic rise with no dip below the MCU's brownout threshold", ifFail: "A dipping rail means the supply cannot deliver inrush current — a failed LDO, a shorted capacitor, or a bulging electrolytic. Find the short with a thermal camera or by milliohm measurement across suspicious capacitors." },
      { order: 2, action: "Attach the UART and capture the boot log", expect: "bootloader output", ifFail: "Garbage at 115200 means a wrong baud or a wrong crystal assumption. Nothing at all means the boot ROM never reached the UART, which points at a bad flash image or a dead SoC." },
      { order: 3, action: "Compare the flash dump against a known-good image for the same model and hardware revision", expect: "differences only in the calibration / MAC / config regions", ifFail: "If the differences are in the bootloader region, restore the bootloader first. Never restore per-device regions from another unit." },
      { order: 4, action: "Check the watchdog", expect: "not firing", ifFail: "A watchdog reset loop with a good image means the application is faulting early — a missing peripheral, a bad EEPROM, or an I2C device that is not answering." },
    ],
  },
  {
    id: "uart-garbage",
    symptom: "UART prints garbage characters",
    ev: "report",
    tests: [
      { order: 1, action: "Try 74880, then 115200, 57600, 38400, 9600", expect: "readable boot text", ifFail: "74880 is the ESP8266 ROM rate and is frequently mistaken for a broken crystal. If nothing works, the logic level is probably wrong." },
      { order: 2, action: "Measure the TX line's idle level and swing", expect: "3.3 V idle for most modern boards, 0 V for an inverting RS-232 level", ifFail: "A 1.8 V SoC driving a 3.3 V adapter input is marginal; a 5 V TX into a 1.8 V SoC RX will damage it. Use a level shifter." },
      { order: 3, action: "Check the crystal frequency and the SoC's UART clock divider", expect: "the divider produces the observed baud", ifFail: "If a previous repair substituted a crystal with a different load capacitance requirement, the frequency can be off by enough to break UART while still almost booting." },
    ],
  },
  {
    id: "brick-after-flash",
    symptom: "The device stopped responding during a firmware update",
    ev: "report",
    tests: [
      { order: 1, action: "Do not power-cycle repeatedly. Dump the flash externally first.", expect: "a readable image", ifFail: "Repeated power cycles on a partially-written flash can walk a bootloader into a worse state. Reading is non-destructive; do it before anything else." },
      { order: 2, action: "Locate the bootloader region in the dump and check it against a known-good copy", expect: "intact", ifFail: "If the bootloader is intact and only the kernel/rootfs regions are damaged, a recovery boot (TFTP, USB, SD, or the vendor's failsafe mode) can restore the rest." },
      { order: 3, action: "Look for a second flash or a recovery partition", expect: "an A/B layout or a failsafe image", ifFail: "Many devices keep a golden copy. Boot-select pins or a held button at power-on often switches to it." },
      { order: 4, action: "Check whether the region you wrote was signed", expect: "matches the fused key manifest if verified boot is enabled", ifFail: "On a verified-boot platform, an image signed with the wrong key will not start and there is no software route back. This is why the dump-first rule exists." },
    ],
  },
  {
    id: "hot-swap",
    symptom: "The part was replaced and the board is now worse",
    ev: "report",
    tests: [
      { order: 1, action: "Measure every rail before powering up again", expect: "no rail shorted to ground", ifFail: "A reversed or misaligned part can short a rail. Find it with the milliohm method: inject a known current and measure the drop, or use a bench supply with a current limit set just above the short." },
      { order: 2, action: "Verify the replacement's orientation markers", expect: "pin 1 aligned", ifFail: "SOIC-8 flash pin 1 is the dot; WSON-8 has a corner chamfer. Under a microscope, not by eye." },
      { order: 3, action: "Check for lifted pads and bridged pins", expect: "clean joints", ifFail: "A lifted pad on a fine-pitch part needs a bodge wire, and the bodge needs to be documented in the dossier or the next person repeats the fault." },
      { order: 4, action: "Re-read the JEDEC ID", expect: "the replacement's ID, not the original's", ifFail: "If you still read the original ID, the replacement is not on the bus — the joint is open or the old part is still fitted." },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 12. Rework safety numbers (ev: "std" — alloy properties; "report" for
 *     the profiles, which are board-dependent and must be tuned by test)
 * ------------------------------------------------------------------ */

export const REWORK = {
  alloys: [
    { name: "Sn63/Pb37 eutectic", melt: 183, ev: "std", note: "A true eutectic: solid to liquid at one temperature, no mushy phase. Legacy boards." },
    { name: "Sn96.5/Ag3.0/Cu0.5 (SAC305)", melt: "217-220", ev: "std", note: "Lead-free. Higher melting point and worse wetting; mixing it with leaded solder produces a joint with an unpredictable, often lower, melting range." },
    { name: "Sn42/Bi58 eutectic", melt: 138, ev: "std", note: "Low-temperature. The standard trick for removing a lead-free BGA or a multi-pin part without exceeding the board's glass transition: flood the joints with it to make a low-melting alloy." },
  ],
  profiles: [
    { step: "Preheat", value: "90-120 °C across the board, ramp ≤ 2 °C/s", why: "Boiling moisture inside the laminate is what delaminates a board. This is the step people skip." },
    { step: "Soak", value: "150-180 °C for 60-120 s", why: "Activates flux, equalises temperature between the part and the board." },
    { step: "Reflow / removal", value: "peak 235-250 °C for SAC, time above 217 °C ≤ 60 s", why: "Beyond that you lift pads and cook the laminate." },
    { step: "Cool", value: "≤ 3 °C/s to below 100 °C", why: "Fast cooling produces finer grain in the joint; too fast warps thin boards." },
  ],
  esd: [
    "A grounded wrist strap and a grounded mat are not ceremony. The gate oxides on a modern SoC are damaged well below the level you can feel (~2 kV HBM for a person, ~200 V for many CMOS parts).",
    "Do not use a hot-air station with a floating, ungrounded nozzle on a CMOS board without checking it — cheap stations leak tens of volts AC on the nozzle.",
    "Photograph the board, both sides, before any part is removed. That photo is the only schematic you are guaranteed to have.",
    "Bag and label every removed part with its position designator. A repair you cannot document is a repair nobody can finish.",
  ],
};

/* ------------------------------------------------------------------ *
 * 13. Sources — what the numbers above actually came from
 * ------------------------------------------------------------------ */

export const SOURCES = [
  { id: "pg65", kind: "reference corpus", cite: "Project Gutenberg eBook #65, “The First 100,000 Prime Numbers”, Unknown, released 20 June 2008 (earliest form 1 May 1993). Plain text: gutenberg.org/files/65/65.txt", used: "The prime lattice's verification corpus: the app regenerates the primes and compares them against this file, which itself documents the Cray X-MP C program that produced it.", ev: "std" },
  { id: "pg58225", kind: "reference corpus", cite: "Project Gutenberg eBook #58225, “Primes to One Trillion”, ed. Don Kostuch, 3 November 2018", used: "Cited for scale only — 10,000 files, ~486 GB of text. Not loaded; it is the reason the app bounds its sieve at 100,000 primes.", ev: "std" },
  { id: "pg-none", kind: "correction", cite: "There is no Project Gutenberg title called “Encyclopedia of Primes”.", used: "The nearest real artefacts are #65 and #58225, plus Ribenboim's “The Book of Prime Number Records” (Springer, not Gutenberg). Recorded here because a fabricated citation is worse than no citation.", ev: "std" },
  { id: "1149", kind: "standard", cite: "IEEE Std 1149.1 (JTAG) — TAP controller, instruction register, mandatory EXTEST / SAMPLE-PRELOAD / BYPASS, optional IDCODE / USERCODE / INTEST / CLAMP / HIGHZ / RUNBIST", used: "cw-tap.js implements the 16-state machine exactly as specified; the verify script proves it is deterministic and that TLR is reachable from every state.", ev: "std" },
  { id: "an105", kind: "vendor app note", cite: "Silicon Laboratories AN105, “IEEE 1149.1 (JTAG) Instruction Set and Programming”, Rev 1.4", used: "The 16-bit-IR C8051F example, the chain-discovery procedure (count bypass bits), and the five-TCK TAP reset idiom.", ev: "std" },
  { id: "an2074", kind: "vendor app note", cite: "Freescale/NXP AN2074 Rev 1, 8/2005 — JTAG step-by-step TAP walkthrough", used: "The TMS sequence tables and the worked BYPASS / IDCODE / EXTEST examples.", ev: "std" },
  { id: "lauterbach", kind: "training manual", cite: "Lauterbach TRACE32, “JTAG Interface” training manual, release 09.2022", used: "DRPRE/DRPOST chain accounting and the raw TMS-shift idiom used by real debuggers.", ev: "std" },
  { id: "arm-jep106", kind: "vendor KB", cite: "Arm Knowledge Article KA001301, “What is the JEDEC JEP-106 Manufacturer ID Code and how does Arm use it?”", used: "The 7-bit identity + odd parity structure, the 0x7F continuation code, the reserved 0x00/0x7F, and Arm's own guidance that the JEP106 code in an IDCODE names the *designer*, not the fab.", ev: "std" },
  { id: "jedec-mess", kind: "analysis", cite: "basicinputoutput.com, “JEDEC Manufacturer IDs Are a Mess” (14 Nov 2023)", used: "The Winbond 0xDA vs 0xEF problem, the Micron/Numonyx/ST 0x20 chain, and the GigaDevice 0xC8-vs-Apple 0xC8 bank collision. This is why the decoder always shows the continuation code next to the identity byte.", ev: "tool" },
  { id: "flashrom", kind: "tool source", cite: "flashrom `flashchips.h` / `flashchips.c` (coreboot.org) — vendor ID constants and per-chip geometry", used: "SPI vendor IDs and the capacity-byte rule. Also the OTP warning: flashrom cannot read security registers, so a clone made with it is not a complete clone.", ev: "tool" },
  { id: "openocd", kind: "tool source", cite: "OpenOCD `target/stm32f1x.cfg`, `target/stm32f4x.cfg`, and the TAP Declaration chapter of the user guide (`jtag newtap … -irlen 4 -expected-id 0x3ba00477`)", used: "The IDCODE rows and the IR lengths. The 0x1BA01477 / 0x2BA01477 confusion is documented across many OpenOCD field reports and reproduced here as a report, not as a fact about any specific board.", ev: "tool" },
  { id: "uboot", kind: "tool source", cite: "U-Boot `include/image.h` — legacy image header struct, IH_MAGIC 0x27051956, IH_NMLEN 32", used: "The 64-byte layout and the header-CRC rule (CRC over the header with ih_hcrc zeroed). The os/arch/type/comp enum *numbers* are flagged unverified in-app because they have shifted between U-Boot versions.", ev: "tool" },
  { id: "fstm", kind: "walkthrough", cite: "Tarlogic, “OWASP Firmware Security Testing Methodology, stage 4: Extracting the filesystem” (31 Oct 2022)", used: "The signature list (hsqs, sqsh, cramfs 453DCD28, UBIFS 31181006, JFFS2 8519, xz, 7z, rar, zip), the endianness warning, and the note that vendor-modified magics exist (DD-WRT's tqsh).", ev: "tool" },
  { id: "re-uboot", kind: "worked example", cite: "reverseengineering.stackexchange.com, “Help unpacking U-boot firmware” — a real header hexdump decoded field by field", used: "The cross-check that our parser produces the same field values as the published decode (ih_os 5 = Linux, ih_comp 3 = lzma, ih_name “MIPS OpenWrt Linux-3.10.14”).", ev: "report" },
  { id: "makint", kind: "in-repo research", cite: "resources/src-74-makinterface-port-lab.md", used: "The cautionary tale for this whole app: an order claimed the box hung off the parallel port, and the vendor's own archived page said “connected to a free 25pole serial port”. Every claim in the substitution tables here is subject to the same discipline — check the primary source before building on it.", ev: "std" },
  { id: "mdns", kind: "browser platform", cite: "draft-ietf-rtcweb-mdns-ice-candidates (mDNS ICE candidate obfuscation), Chromium `enable-webrtc-hide-local-ips-with-mdns` (default-on since M86), Firefox `media.peerconnection.ice.obfuscate_host_addresses`", used: "Why the DISCOVER tab cannot enumerate your network and says so instead of pretending.", ev: "std" },
];

/* ------------------------------------------------------------------ *
 * 14. Ethics & scope — printed in the app, not hidden in a README
 * ------------------------------------------------------------------ */

export const SCOPE = {
  claim: [
    "A web page cannot sniff a network. It has no raw sockets, no promiscuous mode, no ARP table, and modern browsers actively hide your own LAN address behind an mDNS placeholder. Anyone selling you an HTML page that claims otherwise is selling you theatre.",
    "What a web page *can* do is talk to hardware the user physically hands it: Web Serial, WebUSB, Web Bluetooth, Web HID and Web NFC all exist, all require a user gesture and a chooser, and all are enough to drive a JTAG adapter or an SPI programmer.",
    "So this workbench is built the other way round. The dossier is the unit of knowledge — you open one for a device you own, and every tool in the tab strip operates on that dossier. Discovery feeds the dossier; it does not replace it.",
  ],
  boundary: [
    "The tools here read, identify, verify and reconstruct. They are for equipment you own or are authorised to service.",
    "Read-out protection, secure boot and debug authentication exist to stop exactly what a JTAG tool makes easy. This workbench will tell you when a part is documented as protected and will stop there. It contains no bypass, no fuse-defeat procedure and no per-device unlock recipe, and adding one would be a change of purpose rather than a feature.",
    "Cross-manufacturer substitution is listed as an equivalence *analysis* — every gate that could differ is enumerated and the user is told which ones are unverifiable from a marking on a chip. A confident wrong substitution kills boards.",
  ],
  method: [
    "Every row in every table carries an evidence tag: std (published standard or datasheet), tool (read out of an open-source tool's own tables), report (third-party observation), recall (transcribed from memory, unverified).",
    "Rows tagged recall are rendered with a warning stripe and are excluded from automatic decisions. The REFS tab tells you exactly which primary document would settle each one.",
    "The PRIME LATTICE tab verifies its own arithmetic at load time: CRC-32 against the standard check value, the sieve against Project Gutenberg #65, and the JEP106 parity rule against every row in the vendor table.",
  ],
};
