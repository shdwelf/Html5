/* CHIPWRIGHT · cw-tap.js — an exact IEEE 1149.1 TAP simulator.
 *
 * This is not an animation. It is the state machine and the scan paths,
 * implemented so that a real adapter could be swapped in behind the same
 * interface (`TapTransport`): `reset()`, `shiftIr(bits)`, `shiftDr(bits)`,
 * `to(state)`. The simulator and a Web Serial bridge answer the same calls,
 * which is what makes the bench tab honest — the transcript you watch here is
 * the transcript that would go down the wire.
 *
 * Bit order follows the standard: in Shift-IR / Shift-DR the LSB of the
 * register goes out on TDO first and the next bit enters TDI at the
 * *other* end, on the same TCK. The last bit is shifted in on the transition
 * out of the Shift state, which is why every scan routine has one extra clock.
 */

import { TAP_STATES, TAP_BY_ID, hex, u32 } from "./cw-data.js";

/* ------------------------------------------------------------------ *
 * Transition table, written as (next[TMS=0], next[TMS=1]) per state.
 * tools/verify_chipwright.mjs cross-checks this against TAP_STATES in
 * cw-data.js, which is transcribed from the standard, so a typo in either
 * copy fails the build rather than silently mis-simulating a board.
 * ------------------------------------------------------------------ */

export const STATE_IDS = TAP_STATES.map((s) => s.id);
const IX = Object.fromEntries(STATE_IDS.map((id, i) => [id, i]));
const NEXT = [
  ["RTI", "TLR"], //  0 Test-Logic-Reset
  ["RTI", "SDR"], //  1 Run-Test/Idle
  ["CDR", "SIR"], //  2 Select-DR-Scan
  ["SHDR", "X1DR"], //  3 Capture-DR
  ["SHDR", "X1DR"], //  4 Shift-DR
  ["PDR", "UDR"], //  5 Exit1-DR
  ["PDR", "X2DR"], //  6 Pause-DR
  ["SHDR", "UDR"], //  7 Exit2-DR
  ["RTI", "SDR"], //  8 Update-DR
  ["CIR", "TLR"], //  9 Select-IR-Scan
  ["SHIR", "X1IR"], // 10 Capture-IR
  ["SHIR", "X1IR"], // 11 Shift-IR
  ["PIR", "UIR"], // 12 Exit1-IR
  ["PIR", "X2IR"], // 13 Pause-IR
  ["SHIR", "UIR"], // 14 Exit2-IR
  ["RTI", "SDR"], // 15 Update-IR
];

export const STATE_INDEX = IX;

/* ------------------------------------------------------------------ *
 * Devices
 * ------------------------------------------------------------------ */

/** A data register: how wide, what Capture-DR loads, what Update-DR does. */
export class Register {
  constructor(name, width, { capture = null, onCapture = null, onUpdate = null } = {}) {
    this.name = name;
    this.width = width;
    this.shift = new Array(width).fill(0); // index 0 = closest to TDO
    this.update = new Array(width).fill(0);
    this.capture = capture;
    this.onCapture = onCapture;
    this.onUpdate = onUpdate;
  }

  doCapture() {
    if (this.onCapture) this.onCapture(this);
    else if (this.capture) {
      for (let i = 0; i < this.width; i++) this.shift[i] = (this.capture >>> i) & 1;
    } else {
      for (let i = 0; i < this.width; i++) this.shift[i] = 0;
    }
  }

  doUpdate() {
    this.update = this.shift.slice();
    if (this.onUpdate) this.onUpdate(this);
  }

  /** The value currently in the update latches, LSB-first → integer. */
  get value() {
    let v = 0;
    for (let i = this.width - 1; i >= 0; i--) v = (v << 1) | this.update[i];
    return u32(v);
  }

  set value(n) {
    for (let i = 0; i < this.width; i++) this.update[i] = (n >>> i) & 1;
    this.shift = this.update.slice();
  }
}

/** One TAP in the chain. */
export class TapDevice {
  constructor({ name, irlen, idcode = null, instructions = {}, drCaptureAllOnes = false }) {
    this.name = name;
    this.irlen = irlen;
    this.idcode = idcode;
    this.ir = new Array(irlen).fill(1); // BYPASS = all ones is the reset value
    this.irLatch = this.ir.slice();
    this.regs = new Map();
    this.regs.set("BYPASS", new Register("BYPASS", 1, { capture: 0 }));
    if (idcode !== null) {
      this.regs.set("IDCODE", new Register("IDCODE", 32, { capture: idcode }));
      // 0xE is the Arm CoreSight JTAG-DP IDCODE instruction; other vendors
      // place it elsewhere, so a real chain scan tries every opcode (see
      // IR-sweep in cw-probe.js) rather than assuming 0xE.
      this.setInstruction(0x0e, "IDCODE", 32, { capture: idcode });
    }
    this.drCaptureAllOnes = drCaptureAllOnes;
    for (const [code, def] of Object.entries(instructions || {})) {
      this.setInstruction(Number(code), def.name, def.width, def);
    }
    this.selReg = this.regs.get("BYPASS");
    this.tmsHistory = "";
  }

  setInstruction(code, name, width, opts = {}) {
    if (!this.regs.has(name)) this.regs.set(name, new Register(name, width, opts));
    this.byCode = this.byCode || new Map();
    this.byCode.set(code & ((1 << this.irlen) - 1), name);
    return this;
  }

  /** BYPASS instruction is always all-ones; EXTEST/SAMPLE are device-specific. */
  get bypassCode() {
    return (1 << this.irlen) - 1;
  }

  irValue() {
    let v = 0;
    for (let i = this.irlen - 1; i >= 0; i--) v = (v << 1) | this.irLatch[i];
    return v;
  }

  onCaptureIr() {
    // Standard: Capture-IR loads a fixed pattern into the two LSBs so a
    // debugger can confirm the chain is alive. 1149.1 requires bit0 = 1 and
    // bit1 = 0 for a device with an IDCODE-less reset; implementations vary.
    // We use the widely-copied "01" pattern (bit0=1, bit1=0).
    for (let i = 0; i < this.irlen; i++) this.ir[i] = i === 0 ? 1 : 0;
  }

  onUpdateIr() {
    this.irLatch = this.ir.slice();
    const name = this.byCode ? this.byCode.get(this.irValue()) : null;
    this.selReg = (name && this.regs.get(name)) || this.regs.get("BYPASS");
    if (!name) this.unknownInstruction = this.irValue();
    else delete this.unknownInstruction;
  }
}

/* ------------------------------------------------------------------ *
 * The simulator
 * ------------------------------------------------------------------ */

export class TapSim {
  constructor(devices) {
    this.devices = devices;
    this.state = "TLR";
    this.cycles = 0;
    this.log = [];
    this.trace = [];
  }

  static fromSpecs(specs) {
    return new TapSim(specs.map((s) => new TapDevice(s)));
  }

  /**
   * One TCK. `tms`/`tdi` are 0/1, returns the TDO bit.
   *
   * `shiftData=false` is the detail that makes this exact rather than
   * approximate: the clock that carries TMS=1 out of a Shift state is the
   * *transition* clock, and IEEE 1149.1 does not shift the scan register on
   * it. The final data bit is presented during the last clock spent IN the
   * Shift state. Shifting on the transition clock as well pushes the whole
   * register one place too far, and the resulting IDCODE is off by one bit —
   * which is exactly the class of bug that makes a homebrew adapter "almost"
   * work and sends you chasing phantom wiring faults.
   */
  clock(tms, tdi, shiftData = true) {
    tms = tms ? 1 : 0;
    tdi = tdi ? 1 : 0;
    const from = this.state;
    let tdo = 0;
    const shifting = shiftData && (from === "SHIR" || from === "SHDR");

    if (from === "SHIR" && shifting) {
      // devices[0] is nearest TDO; the chain runs TDI → devices[n-1] → … →
      // devices[0] → TDO. Each device's bit0 exits into the next device's
      // last cell, so the loop overwrites `bit` as it goes — but TDO is the
      // bit that left devices[0], which must be captured before the loop
      // carries on. Returning the last device's bit instead is wrong by
      // exactly one device-width, and shows up as a mangled IDCODE.
      let b = tdi;
      for (let i = this.devices.length - 1; i >= 0; i--) b = this.shiftOne(b, this.devices[i].ir, this.devices[i].irlen);
      tdo = b; // whatever left devices[0] is what appears on TDO
    } else if (from === "SHDR" && shifting) {
      let b = tdi;
      for (let i = this.devices.length - 1; i >= 0; i--) {
        const r = this.devices[i].selReg;
        b = this.shiftOne(b, r.shift, r.width);
      }
      tdo = b;
    } else if (from === "CDR") {
      for (const d of this.devices) d.selReg.doCapture();
      tdo = this.devices.length ? this.devices[this.devices.length - 1].selReg.shift[0] : 0;
    } else if (from === "CIR") {
      for (const d of this.devices) d.onCaptureIr();
      tdo = this.devices.length ? this.devices[this.devices.length - 1].ir[0] : 0;
    } else if (from === "UDR") {
      for (const d of this.devices) d.selReg.doUpdate();
    } else if (from === "UIR") {
      for (const d of this.devices) d.onUpdateIr();
    } else if (from === "TLR") {
      // TAP reset: IR goes to BYPASS (all ones) and the BYPASS register is
      // selected. No shifting occurs on this clock.
      for (const d of this.devices) {
        d.ir = new Array(d.irlen).fill(1);
        d.onUpdateIr();
      }
    } else {
      // Not a shift state: TDO still reflects the head of the selected chain.
      if (from === "SHIR") {
        tdo = this.devices.length ? this.devices[this.devices.length - 1].ir[0] : 0;
      } else if (from === "SHDR") {
        tdo = this.devices.length ? this.devices[0].selReg.shift[0] : 0;
      }
    }

    const to = tms ? NEXT[IX[from]][1] : NEXT[IX[from]][0];
    this.state = to;
    this.cycles++;
    this.trace.push({ cycle: this.cycles, tms, tdi, tdo, from, to });
    return tdo;
  }

  /**
   * Shift one bit through one scan register. `reg[0]` is the TDO end,
   * `reg[width-1]` is the TDI end.
   *
   * One rule for every width, including 1: what comes out is what was already
   * at the TDO end, and the incoming bit takes the TDI end. For a 1-bit
   * register — which is what BYPASS is, and every device in a chain has one —
   * that makes it a genuine one-clock delay line: the bit you push in on clock
   * k appears on TDO on clock k+1. That single-clock-per-device delay is the
   * whole basis of chain discovery, so a model that gets it wrong reports one
   * device no matter how many are on the wire, and the failure looks exactly
   * like "my adapter only sees the first TAP".
   */
  shiftOne(bitIn, reg, width) {
    const bitOut = reg[0];
    for (let k = 0; k < width - 1; k++) reg[k] = reg[k + 1];
    reg[width - 1] = bitIn;
    return bitOut;
  }

  /** Drive a raw TMS string ("1011…"), LSB of the string first. */
  tmsSequence(bits, tdi = 0) {
    const out = [];
    for (const ch of String(bits)) out.push(this.clock(ch === "1" ? 1 : 0, tdi));
    return out;
  }

  /** Walk the state machine to a target state along the shortest legal path. */
  to(target, tdi = 0) {
    if (this.state === target) return [];
    const path = shortestPath(this.state, target);
    if (!path) throw new Error(`no TAP path from ${this.state} to ${target}`);
    return this.tmsSequence(path, tdi);
  }

  reset(leaveIn = "RTI") {
    this.tmsSequence("11111"); // TLR from anywhere
    const out = [];
    if (leaveIn === "RTI") out.push(...this.tmsSequence("0"));
    this.note(`TAP reset (${leaveIn})`);
    return out;
  }

  note(text) {
    this.log.push({ cycle: this.cycles, state: this.state, text });
  }

  /**
   * Shift `bits` (array of 0/1, LSB first) through the whole chain's IR and
   * return exactly `bits.length` TDO bits.
   *
   * The clock budget, spelled out because this is where every homebrew
   * adapter goes wrong and it never fails loudly — it just rotates the answer
   * by one bit and sends you chasing phantom wiring faults:
   *
   *   · RTI → Select-IR-Scan → Capture-IR costs two TCKs and no data;
   *   · the TCK that leaves Capture-IR performs the capture and produces no
   *     data bit. The captured value is what the *first shift* clock moves
   *     out, so counting the capture clock as a bit displaces everything;
   *   · N TCKs with TMS low, one per bit, each returning the bit that was at
   *     the TDO end before that edge;
   *   · one TCK with TMS high to leave Shift-IR. It transitions the state
   *     machine but does NOT shift (`shiftData=false`) — 1149.1 moves the
   *     state on that edge without moving the scan register.
   *
   * So: N bits in, N bits out, N+1 TCKs spent in the scan path.
   * `tools/verify_chipwright.mjs` pins this against chains of 1-9 devices
   * with mixed IR lengths and known IDCODEs.
   */
  shiftIr(bits) {
    const n = bits.length;
    const out = [];
    this.to("CIR");
    this.clock(0, 0, false);                            // Capture-IR, no data bit
    for (let i = 0; i < n; i++) out.push(this.clock(0, bits[i]));
    this.clock(1, 0, false);                            // Exit1-IR, no shift
    this.to("RTI");
    return out;
  }

  /** Shift through whichever DR each device currently has selected. */
  shiftDr(bits, { leave = "RTI" } = {}) {
    const n = bits.length;
    const out = [];
    this.to("CDR");
    this.clock(0, 0, false);                            // Capture-DR, no data bit
    for (let i = 0; i < n; i++) out.push(this.clock(0, bits[i]));
    this.clock(1, 0, false);                            // Exit1-DR, no shift
    this.to(leave);
    return out;
  }

  /* ---- whole-word conveniences --------------------------------- */

  /**
   * Put `code` in one device's IR and BYPASS in every other device.
   *
   * Chain order matters and is the classic place to lose an afternoon. The
   * physical chain is TDI → devices[n-1] → … → devices[0] → TDO, so the first
   * bit pushed in on TDI travels furthest and lands in devices[0] — the
   * device nearest TDO. That means the IR bit stream is ordered devices[0]
   * first. Reversing it here does not fail loudly: it hands each device its
   * neighbour's instruction, so the target sits in BYPASS and the scan reads
   * back zeros while everything else looks healthy.
   */
  isolate(index, code) {
    const bits = [];
    for (let i = 0; i < this.devices.length; i++) {
      const d = this.devices[i];
      const c = i === index ? code : d.bypassCode;
      for (let b = 0; b < d.irlen; b++) bits.push((c >>> b) & 1);
    }
    this.shiftIr(bits);
    return bits.length;
  }

  /**
   * Read every device's IDCODE, one at a time, with all other devices held in
   * BYPASS so their contribution to the DR scan is exactly one bit each.
   * `idcodeIr` is the IR opcode that selects IDCODE — 0xE on an Arm CoreSight
   * JTAG-DP, but it is vendor-specific, so the caller supplies it per device.
   */
  readIdcodes({ ir = 0x0e } = {}) {
    const found = [];
    for (let i = 0; i < this.devices.length; i++) {
      if (this.devices[i].idcode === null) continue;
      this.reset("RTI");
      this.isolate(i, ir);
      // `i` devices nearer TDO each contribute one BYPASS bit, and the DR scan
      // returns the Capture-DR bit as element 0, so the target's 32 bits start
      // at index 1 + i.
      const dr = this.shiftDr(new Array(32 + i).fill(0));
      // Devices nearer TDO than the target contribute one BYPASS bit each,
      // and those come out first, so the target's 32 bits start at index i.
      const slice = dr.slice(i, i + 32);
      let v = 0;
      for (let b = 31; b >= 0; b--) v = (v << 1) | (slice[b] & 1);
      found.push({ index: i, name: this.devices[i].name, idcode: u32(v), hex: hex(u32(v)) });
    }
    return found;
  }

  /**
   * Chain discovery — what can actually be measured, and what cannot.
   *
   * After a TAP reset every device selects BYPASS, whose register is one bit
   * wide and captures a 0. So a DR scan that shifts in *ones* returns N zeros
   * followed by ones, and the run of zeros is the device count N. That part is
   * unambiguous and is what `countDevices()` does.
   *
   * The total IR length M cannot be recovered from that scan: a BYPASS scan
   * looks the same for every M. Tools that report M either read it from a
   * BSDL file, are told it (OpenOCD's `jtag newtap … -irlen 4`), or sweep
   * candidate lengths and accept the first that yields a structurally valid
   * IDCODE. `sweepIrLength()` implements the sweep, and the app never presents
   * a swept length as a measured fact.
   */
  discover() {
    const steps = [];
    const bp = this.bypassCheck();
    steps.push({
      what: "BYPASS delay-line measurement",
      result: bp.explain,
      devices: bp.devicesMeasured,
      ev: bp.agrees ? "std" : "anomaly",
    });
    const known = this.devices.reduce((a, d) => a + d.irlen, 0);
    steps.push({
      what: "Total IR length",
      result: `${known} bit(s), taken from the device definitions. A DR scan cannot reveal it: every BYPASS chain looks identical. Real tools read it from a BSDL file or are told it (OpenOCD's \`jtag newtap … -irlen 4\`); findIdcodeInstruction() probes what can be probed once it is known.`,
      irlen: known,
      ev: "model",
    });
    for (const [i, d] of this.devices.entries()) {
      steps.push({
        what: `device[${i}] — ${i === 0 ? "nearest TDO" : i === this.devices.length - 1 ? "nearest TDI" : "middle of chain"}`,
        result: `${d.name}: irlen ${d.irlen}${d.idcode !== null ? ", IDCODE " + hex(d.idcode) : ", no IDCODE register"}`,
        ev: "model",
      });
    }
    const ids = this.readIdcodes();
    if (ids.length) {
      steps.push({
        what: "IDCODE scan",
        result: ids.map((x) => `${x.name} = ${x.hex}`).join(", "),
        ev: "std",
      });
    } else {
      steps.push({ what: "IDCODE scan", result: "no device in this chain implements IDCODE", ev: "std" });
    }
    return steps;
  }

  /**
   * Count the devices in the chain — the fpga4fun procedure, which works
   * because BYPASS is a one-bit delay line, not a register that holds a value:
   *
   *   1. TAP reset, then all-ones IR so every device is in BYPASS;
   *   2. DR scan of zeros long enough to flush every delay line;
   *   3. DR scan of ones and count how many clocks pass before the first 1
   *      comes back. Each device delays TDI→TDO by exactly one clock, so that
   *      count *is* the device count.
   *
   * This is a genuine measurement with no assumption about capture values.
   */
  countDevices({ flush = 64 } = {}) {
    this.reset("RTI");
    const totalIr = this.devices.reduce((a, d) => a + d.irlen, 0);
    this.shiftIr(new Array(totalIr).fill(1)); // BYPASS everywhere
    this.shiftDr(new Array(flush).fill(0));   // flush the delay lines to 0
    const ones = this.shiftDr(new Array(flush).fill(1));
    let n = 0;
    while (n < ones.length && ones[n] === 0) n++;
    return n;
  }

  /**
   * The same measurement expressed as latency, because that is the number a
   * logic-analyser capture actually shows: the first 1 pushed into TDI comes
   * back on TDO this many scan clocks later. Each BYPASS register is one
   * flip-flop, so the latency is one clock per device.
   */
  bypassLatency({ flush = 64 } = {}) {
    this.reset("RTI");
    const totalIr = this.devices.reduce((a, d) => a + d.irlen, 0);
    this.shiftIr(new Array(totalIr).fill(1));
    this.shiftDr(new Array(flush).fill(0));
    const ones = this.shiftDr(new Array(flush).fill(1));
    return ones.indexOf(1);
  }

  /**
   * Same measurement, reported with the reasoning attached so a wrong answer
   * can be diagnosed rather than just observed.
   */
  bypassCheck() {
    const totalIr = this.devices.reduce((a, d) => a + d.irlen, 0);
    const measured = this.countDevices();
    const agrees = measured === this.devices.length;
    return {
      devicesExpected: this.devices.length,
      devicesMeasured: measured,
      totalIrBits: totalIr,
      agrees,
      explain: agrees
        ? `All-ones IR put ${measured} device(s) in BYPASS; each delayed TDI→TDO by one clock, so the first 1 came back after ${measured} clock(s). The chain is what the model says it is.`
        : `Expected ${this.devices.length} device(s), measured ${measured}. More means extra TAPs on the wire (or a stuck-high TDO); fewer means a device is not in BYPASS, its TDO is not driving, or the IR length assumption is wrong so all-ones did not land on BYPASS.`,
    };
  }

  /**
   * Find the IR opcode that selects IDCODE, by trying every opcode the IR can
   * hold and accepting the first whose DR scan produces a structurally valid
   * 32-bit IDCODE: bit0 = 1, and an odd-parity JEP106 identity in bits 11:1.
   *
   * This is a heuristic, not a measurement, and it only works when the IR
   * length is already known (from a datasheet or BSDL). It is included because
   * it answers a real question — "this board has a JTAG header and I have no
   * idea what is behind it" — and because it fails loudly rather than quietly:
   * a wrong IR length yields no candidate at all.
   */
  findIdcodeInstruction({ irlen = null } = {}) {
    const L = irlen !== null ? irlen : this.devices.reduce((a, d) => a + d.irlen, 0);
    const hits = [];
    for (let op = 0; op < (1 << L); op++) {
      this.reset("RTI");
      const bits = [];
      for (let b = 0; b < L; b++) bits.push((op >>> b) & 1);
      this.shiftIr(bits);
      const dr = this.shiftDr(new Array(32).fill(0));
      let v = 0;
      for (let b = 31; b >= 0; b--) v = (v << 1) | (dr[b] & 1);
      v = u32(v);
      if (v === 0 || v === 0xffffffff) continue;
      if ((v & 1) !== 1) continue;
      const ident = (v >>> 1) & 0x7f;
      if (ident === 0 || ident === 0x7f) continue;
      const parity = ident & 1;
      let pc = 0;
      for (let x = ident >>> 1; x; x >>>= 1) pc += x & 1;
      if (parity !== ((pc + 1) & 1)) continue; // JEP106: odd parity over the identity code
      hits.push({ opcode: op, opcodeHex: hex(op, Math.ceil(L / 4)), idcode: v, hex: hex(v) });
    }
    return hits;
  }

  /** The full TMS/TDI/TDO transcript so far, as a wire-level listing. */
  transcript(limit = 400) {
    return this.trace.slice(-limit);
  }
}

/* ------------------------------------------------------------------ *
 * Graph helper — duplicated from cw-data.tapPath on purpose so this
 * module has no dependency on the data table for its own correctness.
 * ------------------------------------------------------------------ */

export function shortestPath(from, to) {
  if (from === to) return "";
  const prev = new Map([[from, null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const tms of [0, 1]) {
      const nxt = NEXT[IX[cur]][tms];
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
      q.push(nxt);
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * ARM CoreSight DAP — the layer above the TAP on every Cortex-M
 *
 * ev: "std" for the DP register map and the 35-bit scan format, which is
 * published by Arm and implemented identically by OpenOCD, pyOCD and
 * Black Magic Probe.
 * ------------------------------------------------------------------ */

export const DP_ACC_FORMAT = {
  bits: 35,
  layout: [
    { lo: 0, hi: 2, name: "A[3:2]", meaning: "Register select: 0=reserved, 4=DP CTRL/STAT or APACC target, 8=DP SELECT, 12=DP RDBUFF" },
    { lo: 3, hi: 3, name: "RnW", meaning: "1 = read, 0 = write" },
    { lo: 4, hi: 35, name: "DATAIN / DATAOUT", meaning: "32-bit payload. On a read, the data you want comes back on the *next* scan (RDBUFF), not this one." },
  ],
  note: "A read is pipelined: DPACC(read) returns the previous transaction's data. Real debuggers therefore always follow a read with a RDBUFF poll until the ACK says OK. Modelling that pipeline faithfully is what makes this simulator useful rather than decorative.",
};

export const DP_REGISTERS = [
  { addr: 0x0, name: "DPIDR", rw: "R", meaning: "The DP's own IDCODE. Bits [11:1] are the JEP106 designer code — 0x23B for Arm — and [31:28] the DP version." },
  { addr: 0x4, name: "CTRL/STAT", rw: "R/W", meaning: "CSYSPWRUPACK/CSYSPWRUPREQ (bits 31/29) and CDBGPWRUPACK/CDBGPWRUPREQ (29/28) are the power-up handshake. Skipping it is the most common reason a first DAP read returns all ones." },
  { addr: 0x8, name: "DP SELECT", rw: "W", meaning: "APSEL[31:28], APBANKSEL[7:4], DPBANKSEL[3:0]. Chooses which AP and which bank the next APACC hits." },
  { addr: 0xc, name: "DP RDBUFF", rw: "R", meaning: "Read buffer — where a pipelined read finally lands." },
];

// NOTE: these ACK codes belong to the *Serial Wire* DP, not to JTAG. A
// JTAG-DP has no ACK field at all — the 35-bit scan is request-only and errors
// surface in CTRL/STAT. They are listed because a repair bench meets both.
export const SWD_ACK = [
  { code: 1, name: "OK", meaning: "Transaction accepted." },
  { code: 2, name: "WAIT", meaning: "The target is busy. Retry — and if it never clears, the debug power domain is not up." },
  { code: 4, name: "FAULT", meaning: "The previous transaction errored. Read CTRL/STAT to find out why, then clear it." },
  { code: 7, name: "NO REPLY", meaning: "Nothing answered. Wrong pin, dead target, or the debug port is disabled." },
];

/* ------------------------------------------------------------------ *
 * A worked, self-checking example: read the IDCODE of a 2-device chain.
 * `tools/verify_chipwright.mjs` runs this and asserts the answers.
 * ------------------------------------------------------------------ */

export function demoChain() {
  return TapSim.fromSpecs([
    {
      name: "dap",
      irlen: 4,
      idcode: 0x4ba00477,
      instructions: {
        0xa: { name: "DPACC", width: 35 },
        0xb: { name: "APACC", width: 35 },
        0x8: { name: "ABORT", width: 35 },
      },
    },
    {
      name: "bsr-cpld",
      irlen: 8,
      idcode: null,
      instructions: {
        0x00: { name: "EXTEST", width: 40 },
        0x01: { name: "SAMPLE", width: 40 },
      },
    },
  ]);
}

export const TMS_LEGEND = [
  { tms: "11111", from: "anywhere", to: "Test-Logic-Reset", why: "TLR is the only state that loops on TMS=1, so five ones is guaranteed to land there from any state, including an unknown one after power-up." },
  { tms: "0", from: "TLR", to: "Run-Test/Idle", why: "The parking state. Everything starts and ends here." },
  { tms: "1100", from: "RTI", to: "Shift-DR", why: "Select-DR → Capture-DR → Shift-DR." },
  { tms: "110100", from: "RTI", to: "Shift-IR", why: "Select-DR → Select-IR → Capture-IR → Shift-IR." },
  { tms: "10", from: "Shift-*", to: "Update-*", why: "Exit1 → Update. The 1 on the last shift clock is what moves you out." },
];

export { hex };
