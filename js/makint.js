/**
 * makint.js — a virtual MAKInterface, its smart-card side, and two port-era
 * peripherals: the RadioShack :CueCat and the Iomega Clik! drive.
 *
 * WHY THIS FILE IS DOM-FREE
 *
 * Everything here is a pure model: line state in, line state out, nothing
 * opened, nothing executed, no hardware and no network. That keeps the whole
 * thing testable in `tests/13-makint.mjs` under bare node, and it keeps the
 * lab's standing rule intact — the archive side of the repository recovers
 * bytes, and this side reasons about them.
 *
 * WHAT IS ACTUALLY KNOWN ABOUT THE BOX (sources, all archived)
 *
 *   makinterface.net/home1_e.php3  "MAKInterface has to be connected to a free
 *                                  25pole serial port."  Power — 5 V, up to 12 V
 *                                  for PIC programming — is drawn from the
 *                                  RS-232 port; 4×AA NiCd is the optional
 *                                  mobile supply. 3.579545 MHz crystal in a
 *                                  socket, swappable for 6.0 MHz. Jumper
 *                                  settings make it behave as CBUS, DumbMouse,
 *                                  FBUS, Harpune, JDM, LudiPipo, M2BUS,
 *                                  Phoenix, Season7, SmartMouse.
 *   makinterface.net/pinout_e.php3 the 2×5 header tables, verbatim below in
 *                                  MAK_HEADER — including the two Smartcard
 *                                  rows: reader (DumbMouse/Phoenix/SmartMouse)
 *                                  and *emulator* (Season/ASIM).
 *   order-e.txt                    art. 00519 / 00524 "Smartcard Emulator &
 *                                  Datalogger", art. 00605 "Standalone parallel
 *                                  port flashing interface", art. 00529 the
 *                                  socketed universal PCB whose populated chip
 *                                  combinations ARE the emulated card.
 *
 * The parallel port appears twice and both times it is worth naming exactly:
 * the wide parallel PROM/EPROM adapter kit ("free Parallel Ports on the PC are
 * required") and the standalone Nokia flasher. The interface itself is serial.
 */

/* ------------------------------------------------------------------ the header */

/**
 * The MAKInterface 2×5 IDC, as the vendor documented it: even pins are the "+"
 * column, odd pins the "−" column, and a device line may be wired to a *pair*
 * ("Maki Pin 1+2"), which is how a single half-duplex I/O gets both directions
 * of the UART pair without a transceiver.
 *
 * `db25` is the PC-side correspondence and is deliberately marked inferred:
 * the mapping lived in Pinout.zip, which is hash-pinned for browser-side
 * recovery and was never reachable from the build host. Guessing it silently
 * would be worse than saying which lines are documented and which are not.
 */
export const MAK_HEADER = {
  connector: "2×5 pole IDC, Schneid-Klemm (art. 00992), even row = +, odd row = −",
  lines: {
    1: { role: "TxD",    dir: "out", db25: 3,  db25Confidence: "inferred" },
    2: { role: "RxD",     dir: "in",  db25: 2,  db25Confidence: "inferred" },
    3: { role: "aux",     dir: "out", db25: 20, db25Confidence: "inferred" },
    4: { role: "GND",     dir: "any", db25: 7,  db25Confidence: "documented (signal ground)" },
    5: { role: "ctrl-a",  dir: "out", db25: 4,  db25Confidence: "inferred" },
    6: { role: "ctrl-b",  dir: "out", db25: 5,  db25Confidence: "inferred" },
    7: { role: "clk",     dir: "out", db25: 6,  db25Confidence: "inferred" },
    8: { role: "VCC",     dir: "power", db25: 8, db25Confidence: "inferred (or DTR 20)" },
    9: { role: "status",  dir: "in",  db25: 22, db25Confidence: "inferred" },
    10: { role: "spare",  dir: "any", db25: null, db25Confidence: "unassigned" },
  },
  /** The two smart-card rows, copied verbatim from pinout_e.php3. */
  smartcard: {
    reader:   { family: "Dumbmouse, Phoenix, Smartmouse", VCC: 8, Reset: 6, CLK: 7, GND: 4, IO: [1, 2] },
    emulator: { family: "Season, ASIM, …",               VCC: 8, Reset: 5, GND: 4, IO: [1, 2] },
  },
  /** Chip combinations the vendor sold as emulated cards (art. 00529 page). */
  emulatedCards: [
    { name: "Whitewafer / MultiMac I",  chips: ["16F84"] },
    { name: "Goldwafer / MultiMac II",  chips: ["16F84", "24C16"] },
    { name: "TwinPIC",                  chips: ["16F84", "16F84"] },
    { name: "Triple Card",              chips: ["16F84", "16F84", "24C16"] },
    { name: "Quadracard",               chips: ["16F84", "16F84", "24C16", "24C16"] },
    { name: "Jupiter1",                 chips: ["90S2323/43", "24C16"] },
    { name: "Funcard",                  chips: ["90S8515", "24C65"] },
    { name: "wide option",              chips: ["90S8515", "24C512"] },
    { name: "wide option",              chips: ["89S53", "24C512"] },
  ],
};

/**
 * The lines the box drives/samples. State is a plain object so a test (or the
 * UI) can poke it directly; `apply` resolves a device role to pins honouring
 * the "+pair" notation from the datasheet tables.
 */
export function makeMakLines() {
  const lines = {};
  for (const p of Object.keys(MAK_HEADER.lines)) lines[p] = 0;
  const api = {
    lines,
    power: false,
    set(pin, v) { lines[pin] = v ? 1 : 0; return api; },
    get(pin) { return lines[pin] ? 1 : 0; },
    /** VCC is only present once the port's handshake lines are asserted — the
     *  box has no supply of its own, which the vendor sells as a feature. */
    powerOn(on = true) { api.power = !!on; lines[8] = on ? 1 : 0; return api; },
    apply(mode, signal) {
      const row = MAK_HEADER.smartcard[mode];
      if (!row) throw new Error(`unknown smart-card mode ${mode}`);
      const pins = row[signal];
      return Array.isArray(pins) ? pins.map((p) => lines[p]) : [lines[pins]];
    },
  };
  return api;
}

/* ------------------------------------------------------------------ ISO 7816-3 */

/** Fi/Di from the TA1 character (ISO 7816-3 table, T=0 side). */
export const FI_DI = {
  0x00: [1, 2], 0x10: [372, 1], 0x20: [558, 1], 0x30: [744, 1],
  0x40: [1104, 1], 0x50: [1488, 1], 0x60: [1806, 1], 0x70: [372, 2],
  0x80: [558, 2], 0x90: [744, 2], 0xa0: [1104, 2], 0xb0: [1488, 2],
  0xc0: [1806, 2], 0xd0: [372, 4], 0xe0: [558, 4], 0xf0: [744, 4],
};

/** ETU in microseconds for a given clock + Fi/Di pair. */
export function etuUs(fiHz, F = 372, D = 1) {
  if (!(fiHz > 0) || !(F > 0) || !(D > 0)) return NaN;
  return (F / D) * (1e6 / fiHz);
}

/**
 * The clock the vendor ships is not a rounding accident: 3.579545 MHz is the
 * NTSC crystal, and F=372/D=1 over it is 9622.4 baud — within a tenth of a
 * percent of the 9600 the period's smart-card COM drivers defaulted to.
 */
export const CRYSTALS = {
  shipped: { hz: 3_579_545, note: "in a socket; F=372/D=1 → ~9622 baud, i.e. a 9600 COM port" },
  optional: { hz: 6_000_000, note: "vendor's drop-in alternative" },
  digitalMode: [4_915_200, 6_000_000, 8_000_000, 10_700_000],
};

/** TS/TA1/TB1/TC1/TD1 + historical bytes → ATR, with the TCK parity byte. */
export function atrBuild({ ts = 0x3b, ta1, tb1, tc1, td1, hist = [] } = {}) {
  let t0 = hist.length & 0x0f;
  if (ta1 !== undefined) t0 |= 0x10;
  if (tb1 !== undefined) t0 |= 0x20;
  if (tc1 !== undefined) t0 |= 0x40;
  if (td1 !== undefined) t0 |= 0x80;
  const body = [ts, t0];
  for (const b of [ta1, tb1, tc1, td1]) if (b !== undefined) body.push(b);
  body.push(...hist);
  let tck = 0;
  for (let i = 1; i < body.length; i++) tck ^= body[i];
  return Uint8Array.from([...body, tck]);
}

/** Parse an ATR back into the same shape, reporting the derived link budget. */
export function atrParse(atr, fiHz = CRYSTALS.shipped.hz) {
  const b = Array.from(atr);
  if (b.length < 2) throw new Error("ATR too short");
  const ts = b[0];
  const direct = (ts & 0x80) === 0x00;
  const t0 = b[1];
  const n = t0 & 0x0f;
  let i = 2;
  const out = { ts, direct, protocol: 0, Fi: 372, Di: 1, historical: [], interfaceBytes: [] };
  const present = [(t0 & 0x10) !== 0, (t0 & 0x20) !== 0, (t0 & 0x40) !== 0, (t0 & 0x80) !== 0];
  const names = ["ta1", "tb1", "tc1", "td1"];
  for (let k = 0; k < 4; k++) {
    if (!present[k]) continue;
    const v = b[i++];
    out[names[k]] = v;
    out.interfaceBytes.push(v);
    if (k === 0) {
      const pair = FI_DI[v & 0xf0];
      if (pair) { out.Fi = pair[0]; out.Di = pair[1]; }
      out.clockStop = (v & 0x08) !== 0;              // TA1 b4: clock stop requested
    }
    if (k === 3) out.protocol = v & 0x0f;
  }
  out.historical = b.slice(i, i + n);
  i += n;
  let tck = 0;
  for (let j = 1; j < i; j++) tck ^= b[j];
  out.tck = b[i];
  out.tckValid = out.tck === tck;
  out.histLen = n;
  out.etuUs = etuUs(fiHz, out.Fi, out.Di);
  out.baud = out.etuUs > 0 ? 1e6 / out.etuUs : NaN;
  return out;
}

/** T=0 character: 10 bits, LSB first, odd parity on the tenth. */
export function t0ParityByte(dataByte) {
  let ones = 0;
  for (let i = 0; i < 8; i++) if ((dataByte >> i) & 1) ones++;
  return (ones % 2 === 0) ? 1 : 0;   // parity bit makes the total odd
}

/**
 * Frame one T=0 byte onto the I/O line as a bit sequence, honouring the
 * direction flip the ISO does NOT define but the MAKInterface does: the box
 * has an inverter so the UART's idle-high line can present as idle-low.
 */
/**
 * One character on the I/O line, as ISO 7816-3 draws it: the line idles high
 * (pull-up, high-impedance release), the start bit pulls it low, eight data
 * bits go out LSB-first, the parity bit makes the count odd, the stop bit
 * returns it high, and two guard ETUs follow before the next character.
 *
 * The `invert` flag is the MAKInterface-specific part: the box documents an
 * on-board inverter per line, which is exactly why the same freeware could
 * drive cards wired either way.
 */
export function t0Frame(dataByte, { invert = false, guardEtu = 2 } = {}) {
  const hi = invert ? 0 : 1, lo = invert ? 1 : 0;
  const bits = [lo];                              // start
  for (let i = 0; i < 8; i++) bits.push((((dataByte >> i) & 1) ? hi : lo));
  bits.push(t0ParityByte(dataByte) ? hi : lo);     // odd parity over the 9 bits
  bits.push(hi);                                  // stop
  for (let g = 0; g < guardEtu; g++) bits.push(hi);
  return bits;
}

/**
 * A tiny ISO7816-4 card image: MF + a GSM-style DF + EF files, enough that the
 * emulator loop has something honest to answer with. It is a memory model, not
 * a security model — see the scope note at the bottom of this file.
 */
export function makeCardImage({ atr, files } = {}) {
  const tree = files || {
    "3f00": { name: "MF", size: 0, children: ["7f10"] },
    "7f10": { name: "DF_TELECOM", size: 0, children: ["6f07"] },
    "6f07": { name: "EF_ACC", data: new Uint8Array([0x00, 0x00, 0x00, 0x00]) },
  };
  let selected = null;
  const sw = (sw1, sw2) => [sw1, sw2];
  return {
    atr: atr || atrBuild({ ta1: 0x11, td1: 0x50, hist: [0x00, 0x62, 0x02, 0x04] }),
    selectedFile: () => selected,
    /** One APDU in, two status words out (T=0 style, no chained I/O block). */
    exchange(apdu) {
      const a = Array.from(apdu);
      if (a.length < 5) return Uint8Array.from(sw(0x6b, 0x00));   // wrong length
      const [cla, ins, p1, p2, lc] = a;
      if (ins === 0xa4) {                                          // SELECT FILE
        const id = a.slice(5, 5 + lc).map((x) => x.toString(16).padStart(2, "0")).join("");
        if (!tree[id]) return Uint8Array.from(sw(0x6a, 0x82));    // not found
        selected = id;
        return Uint8Array.from(sw(0x90, 0x00));
      }
      if (ins === 0xb0) {                                          // READ BINARY
        if (selected === null) return Uint8Array.from(sw(0x69, 0x86));  // no EF
        const node = tree[selected];
        if (!node.data) return Uint8Array.from(sw(0x6a, 0x81));
        const off = (p1 << 8) | p2;
        if (off >= node.data.length) return Uint8Array.from(sw(0x6b, 0x00));
        const n = Math.min(lc === undefined ? 0xff : lc, node.data.length - off);
        return Uint8Array.from([...node.data.slice(off, off + n), 0x90, 0x00]);
      }
      if (ins === 0xc0) {                                          // GET RESPONSE
        return Uint8Array.from(sw(0x6d, 0x00));
      }
      return Uint8Array.from(sw(0x6d, 0x00));                      // INS not supported
      void cla;
    },
    tree,
  };
}

/**
 * One reset-and-answer cycle. The master asserts VCC, holds Reset low for
 * 400 etu, releases it, and the card streams its ATR bit by bit.
 */
export function resetAndAnswer(card, { fiHz = CRYSTALS.shipped.hz } = {}) {
  const port = makeMakLines().powerOn(true);
  port.set(MAK_HEADER.smartcard.reader.Reset, 0);
  const atr = card.atr;
  port.set(MAK_HEADER.smartcard.reader.Reset, 1);
  const frames = Array.from(atr, (b) => t0Frame(b));
  return { atr, frames, etuUs: etuUs(fiHz), bytes: atr.length };
}

/* ------------------------------------------------------------------- :CueCat */

/**
 * RadioShack cat. 68-1158 / 68-1965 :CueCat. A PS/2 keyboard-protocol barcode
 * wand with a Hyundai CPU and a 93C46 serial EEPROM holding the serial number
 * Digital:Convergence was reading back off every scan — which is why the
 * standard mod is to lift pin 10 of the CPU (it is tied to ground; floating it
 * high selects the plain-ASCII output). The "encryption" the stock output uses
 * is a modified base64, and its full algorithm was never published by the
 * vendor; the decode below is the reconstruction from Bobby Gage's step-by-step
 * page, pinned by three published examples (see the test suite).
 */
export const CUECAT_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-";

export function cuecatDecode(section) {
  const pos = new Map();
  for (let i = 0; i < CUECAT_ALPHABET.length; i++) pos.set(CUECAT_ALPHABET[i], i);
  const vals = [];
  for (const c of section) if (pos.has(c)) vals.push(pos.get(c));
  const out = [];
  for (let i = 0; i < vals.length; i += 4) {
    const v = vals.slice(i, i + 4);
    const bytes = [];
    if (v.length >= 2) bytes.push(((v[0] << 2) | (v[1] >> 4)) & 0xff);
    if (v.length >= 3) bytes.push((((v[1] & 0x0f) << 4) | (v[2] >> 2)) & 0xff);
    if (v.length >= 4) bytes.push((((v[2] & 0x03) << 6) | v[3]) & 0xff);
    for (const b of bytes) {
      let ch = (b ^ 3) + 64;
      if (ch > 128) ch -= 128;                 // Gage's step 10 / 20 / 28
      out.push(ch);
    }
  }
  return String.fromCharCode(...out);
}

/** Split a raw :Cat keystroke stream into its three dot-delimited sections. */
export function cuecatSections(raw) {
  const parts = raw.replace(/^[.\s]+|[.\s]+$/g, "").split(".");
  const [serial = "", type = "", code = ""] = parts;
  return {
    serial: cuecatDecode(serial),
    type: cuecatDecode(type),
    code: cuecatDecode(code),
    sections: parts.length,
  };
}

/** Inverse of cuecatDecode, for building scan streams in tests and demos. */
export function cuecatEncode(text) {
  const bytes = Array.from(text, (c) => c.charCodeAt(0));
  // undo the fold: pick a 0..255 value whose ((b^3)+64 [, -128]) equals the byte
  const pre = bytes.map((want) => {
    for (let b = 0; b < 256; b++) {
      let ch = (b ^ 3) + 64;
      if (ch > 128) ch -= 128;
      if (ch === want) return b;
    }
    return 0;
  });
  let out = "";
  for (let i = 0; i < pre.length; i += 3) {
    const chunk = pre.slice(i, i + 3);
    const n = chunk.reduce((acc, b, j) => acc | (b << (16 - 8 * j)), 0);
    const digits = chunk.length + 1;
    for (let j = 0; j < digits; j++) {
      out += CUECAT_ALPHABET[(n >> (18 - 6 * j)) & 0x3f];
    }
  }
  return out;
}

/* ----------------------------------------------------------------- Iomega Clik! */

/**
 * Iomega Clik! (1999) — a 40 MB 1.8″ cartridge. Three host attachments existed
 * and they are three different worlds, which is why "disassemble the Clik!" has
 * to say which one: the PC Card Type II version is plain ATAPI-in-a-PCMCIA
 * envelope (Linux drove it with ide-floppy, with a model-string quirk — see
 * CLIK_ID), the parallel-port cradle is a bridge chip on LPT, and the USB one
 * is a vendor-specific SCSI-ish bulk protocol. The drive's own controller
 * firmware is not in any archive we can pin; the *drivers* are.
 */
export const CLIK_ID = {
  model: "IOMEGA Clik! 40 CZ ATAPI",
  modelNote:
    "ide-floppy matched this exact string until drives appeared whose model " +
    "differed; Paul Bristow's fix was strncmp(drive->id->model, \"IOMEGA Clik\", 11).",
  capacityBytes: 40 * 1000 * 1000,
  sectorBytes: 512,
  /** Iomega used partition 4, "nobody knows why this is so" — Bristow, 2002. */
  dataPartition: 4,
  seekMs: 38,
  transferKBps: [150, 600],
};

/**
 * The IDENTIFY DEVICE model field: 40 bytes at word offset 27, ASCII,
 * space-padded, and — the quirk that makes hand-built id buffers wrong —
 * byte-swapped inside every 16-bit word. Decoding it is `words.map(w =>
 * [w>>8, w&0xff])`, so a model string that reads back correctly is proof the
 * buffer was built the way an ATAPI device would present it.
 */
export function clikIdentifyModelWords(model, bytes = 40) {
  const s = (model + " ".repeat(bytes)).slice(0, bytes);
  const words = [];
  for (let i = 0; i + 1 < s.length; i += 2) {
    words.push(s.charCodeAt(i + 1) | (s.charCodeAt(i) << 8));
  }
  return words;
}

export function clikModelFromWords(words) {
  let out = "";
  for (const w of words) out += String.fromCharCode((w >> 8) & 0xff, w & 0xff);
  return out.trimEnd();
}

/**
 * The Clik! data-partition convention, as a function instead of folklore:
 * given a 512-byte MBR, return the start LBA and sector count of the *fourth*
 * partition record — the one Iomega formatted and the one Linux mounted.
 * Entries live at 0x1BE, 16 bytes each, LBA start at +8, count at +12.
 */
export function clikDataPartition(mbr) {
  const m = Array.from(mbr);
  if (m.length < 512) throw new Error("MBR must be 512 bytes");
  if (m[510] !== 0x55 || m[511] !== 0xaa) throw new Error("no 0x55aa boot signature");
  const off = 0x1be + 16 * 3;
  const le32 = (o) => m[o] | (m[o + 1] << 8) | (m[o + 2] << 16) | ((m[o + 3] << 24) >>> 0);
  return {
    type: m[off + 4],
    startLba: (le32(off + 8)) >>> 0,
    sectors: (le32(off + 12)) >>> 0,
    // Iomega's 40 MB cartridge, byte-exact from the two independent 32-bit fields
    bytes: ((le32(off + 12)) >>> 0) * 512,
  };
}

/* ------------------------------------------------------------------------- scope */

/**
 * SCOPE NOTE, deliberately in code so it ships with the model.
 *
 * The MAKInterface family can read, write, log and *emulate* smart cards, and
 * the vendor sold the emulator hardware openly (art. 00519/00524) for card
 * development. This module models the physical link — lines, ATR, T=0 framing —
 * and a plain memory card image, because that is the part that can be reasoned
 * about from the archived documentation and is the part that answers "could you
 * virtualise it".
 *
 * It does not model, and this repository will not host, anything that
 * reproduces a payment instrument, a SIM's authentication secrets, or a
 * pay-TV conditional-access module. Emulating the *transport* of a dead 2005
 * programmer is archaeology; producing live card credentials is not.
 */
export const SCOPE = "transport + memory-card model only; no credential or CA emulation";
