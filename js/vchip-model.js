/**
 * vchip-model.js — JavaScript reference model of the virtual chipset.
 *
 * This file is the SPECIFICATION. rtl/vchip_mix.v, rtl/boot_vector_lock.v,
 * rtl/ata_security_fsm.v and rtl/vchip_top.v are the implementation, and
 * tools/verify_rtl.py proves the two agree:
 *
 *   - the mixer arithmetic is compared against this model on a generated vector
 *     table (rtl/golden/vchip_vectors.json), so the RTL cannot drift;
 *   - the RTL is driven through the scenarios in rtl/scenarios/vchip_scenarios.json
 *     by tools/sim/vchip_driver.cc, and the resulting transcript is compared
 *     with the transcript this model produces (tools/run_vchip_scenarios.mjs).
 *
 * The model is pure: no DOM, no I/O, no timers. It is also what chipset-lab.html
 * animates, which is why the transcript format lives here rather than in the
 * driver.
 *
 * Semantics mirror the Verilog exactly, including its non-blocking assignment
 * discipline: every step() computes the complete next state from the current
 * state, then commits. Nothing is read back mid-step.
 *
 * Honesty notes, repeated from the RTL because they matter:
 *   - mix() is NOT a cryptographic hash. It is a stand-in for a hash core.
 *   - "power-on reset" is modelled as an input; a real tamper latch must not be
 *     cleared by a reset an attacker can pull.
 */

export const VEC_W = 64;
export const LANES = 4;
export const LANE_W = VEC_W / LANES;
export const ROUNDS = 4;
export const STAGES = 3;

const M16 = 0xffffn;
const M64 = (1n << 64n) - 1n;

/** Lock states (mirror `LCK_*` in rtl/vchip_pkg.vh). */
export const LOCK = { IDLE: 0, MEASURING: 1, UNLOCKED: 2, LOCKED: 3 };

/** Boot source kinds (mirror `BOOT_*`). */
export const BOOT = { NONE: 0, LEGACY: 1, UEFI: 2 };

/** Boot mode policy (mirror `MODE_*`). */
export const MODE = { DUAL: 0, LEGACY: 1, UEFI: 2 };

/** Boot denial reasons (mirror `DENY_*`). */
export const DENY = {
  NONE: 0, CHAIN: 1, MODE: 2, SOURCE: 3, TAMPER: 4, ARM: 5,
};

/** ATA security opcodes (mirror `ATA_*`). */
export const ATA = {
  SEC_SET_PWD: 0xf1,
  SEC_UNLOCK: 0xf2,
  SEC_ERASE_PREP: 0xf3,
  SEC_ERASE_UNIT: 0xf4,
  SEC_FREEZE: 0xf5,
  SEC_DISABLE: 0xf6,
  READ_DMA: 0xc8,
  WRITE_DMA: 0xca,
  VENDOR_REFLASH: 0xfe,
};

/** Abort codes (mirror `ABORT_*`). */
export const ABORT = {
  NONE: 0, ABRT: 1, FROZEN: 2, PWD: 3, LOCKED: 4, POLICY: 5,
  NOT_ENABLED: 6, NO_PREP: 7,
};

/** Initial measurement vector: {VEC_W{1'b0}} ^ {LANES{16'h5A5A}}. */
export const SEED = 0x5a5a5a5a5a5a5a5an;

/** Lane i of a vector occupies bits [i*LANE_W +: LANE_W]; lane 0 is the LSB. */
function lane(v, i) {
  return (v >> BigInt(LANE_W * i)) & M16;
}

function rotl16(v, k) {
  return ((v << BigInt(k)) | (v >> BigInt(16 - k))) & M16;
}

function rconst(r) {
  return (0xace1n + BigInt(r) * 0x1b3fn) & M16;
}

/**
 * Extend a measurement vector with a stage digest.
 * Bit-exact with rtl/vchip_mix.v.
 */
export function mix(acc, dig) {
  let cur = acc & M64;
  for (let r = 0; r < ROUNDS; r++) {
    let next = 0n;
    for (let i = 0; i < LANES; i++) {
      const a = lane(cur, i);
      const d0 = lane(dig, (i + r) % LANES);
      const d1 = lane(dig, (i + r + 1) % LANES);
      const out = (rotl16(a ^ d0, 5) + d1 + rconst(r)) & M16;
      next |= out << BigInt(LANE_W * i);
    }
    cur = next;
  }
  return cur & M64;
}

/** Hex formatting used by both transcripts. */
export function hex64(v) {
  return (v & M64).toString(16).padStart(16, '0');
}

export const DEFAULT_INPUTS = {
  // straps / policy
  arm: 0,
  strapRecovery: 0,
  bootKind: BOOT.NONE,
  policyBootMode: MODE.DUAL,
  policyAllowDestructive: 0,
  policyProvLatches: 1,
  // provisioning (fixture)
  provValid: 0,
  provIdx: 0,
  provVec: 0n,
  // measurement engine
  measValid: 0,
  measStage: 0,
  measDigest: 0n,
  // ATA command interface
  cmdValid: 0,
  cmd: 0,
  pwdOk: 0,
};

export class Vchip {
  constructor(inputs = {}) {
    this.inputs = { ...DEFAULT_INPUTS, ...inputs };
    // lock state
    this.tamperLatch = 0;
    this.lockState = LOCK.IDLE;
    this.vector = SEED;
    this.stageOkMask = 0;
    this.expectedStage = 0;
    this.extCount = 0;
    this.armLatched = 0;
    this.provDone = 0;
    this.provViolation = 0;
    this.lastStage = 0;
    this.lastStageOk = 0;
    this.ignoredMeasurements = 0;
    this.measSeen = 0;
    this.golden = [SEED, SEED, SEED];
    // ATA state
    this.secEnabled = 0;
    this.secLocked = 0;
    this.secFrozen = 0;
    this.erasePrepared = 0;
    this.eraseRequired = 0;
    this.unlockBlocked = 0;
    this.failCount = 0;
    this.abortCode = ABORT.NONE;
    this.cmdAborted = 0;
    this.lastCmd = 0;
    this.eraseReq = 0;
    this.reflashReq = 0;
    this.eraseDeniedTamper = 0;
    this.reflashDeniedTamper = 0;
  }

  /** Power-on reset, i.e. rst_n low. */
  powerOnReset() {
    const fresh = new Vchip(this.inputs);
    Object.assign(this, fresh);
  }

  /**
   * chain_ok is combinational: unlocked state with no latch.
   * Mirror of `assign chain_ok = (lock_state == LCK_UNLOCKED) & ~tamper_latch;`
   */
  chainOkNow() {
    return this.lockState === LOCK.UNLOCKED && !this.tamperLatch ? 1 : 0;
  }

  /** Combinational view (mirror of the continuous assigns in vchip_top.v). */
  get outputs() {
    const o = this.plainOutputs();
    o.status = this.statusWord(o);
    return o;
  }

  /** Everything except the packed status word, so statusWord() cannot recurse. */
  plainOutputs() {
    const chainOk = this.chainOkNow();
    const preboot = !chainOk && this.lockState === LOCK.IDLE;
    const recoveryActive = this.inputs.strapRecovery && preboot ? 1 : 0;
    const modeOk = this.inputs.policyBootMode === MODE.LEGACY
      ? (this.inputs.bootKind === BOOT.LEGACY ? 1 : 0)
      : this.inputs.policyBootMode === MODE.UEFI
        ? (this.inputs.bootKind === BOOT.UEFI ? 1 : 0)
        : (this.inputs.bootKind !== BOOT.NONE ? 1 : 0);
    const cpuRelease = chainOk && modeOk
      && this.inputs.bootKind !== BOOT.NONE && !this.tamperLatch ? 1 : 0;
    const deny = cpuRelease ? DENY.NONE
      : this.tamperLatch ? DENY.TAMPER
        : !chainOk ? DENY.CHAIN
          : this.inputs.bootKind === BOOT.NONE ? DENY.SOURCE
            : !modeOk ? DENY.MODE
              : DENY.ARM;
    return {
      chainOk,
      tamperLatch: this.tamperLatch,
      lockState: this.lockState,
      vector: this.vector,
      stageOkMask: this.stageOkMask,
      extCount: this.extCount,
      expectedStage: this.expectedStage,
      armLatched: this.armLatched,
      provDone: this.provDone,
      provViolation: this.provViolation,
      lastStage: this.lastStage,
      lastStageOk: this.lastStageOk,
      ignoredMeasurements: this.ignoredMeasurements,
      recoveryActive,
      modeOk,
      cpuRelease,
      bootDenyReason: deny,
      // Combinational capability gates over registered state (the ATA FSM's
      // assign statements): no cycle may expose a grant with an unverified
      // chain or a set latch.
      mediaWriteAllow: (chainOk && !this.tamperLatch && !this.secLocked) ? 1 : 0,
      mediaReadAllow: (chainOk && !this.tamperLatch && !this.secLocked) ? 1 : 0,
      eraseGrant: (this.eraseReq && chainOk && !this.tamperLatch
        && this.inputs.policyAllowDestructive) ? 1 : 0,
      reflashGrant: (this.reflashReq && chainOk && !this.tamperLatch) ? 1 : 0,
      eraseDeniedTamper: this.eraseDeniedTamper,
      reflashDeniedTamper: this.reflashDeniedTamper,
      secEnabled: this.secEnabled,
      secLocked: this.secLocked,
      secFrozen: this.secFrozen,
      eraseRequired: this.eraseRequired,
      unlockBlocked: this.unlockBlocked,
      failCount: this.failCount,
      abortCode: this.abortCode,
      cmdAborted: this.cmdAborted,
    };
  }

  /** Mirror of the `status` assignment block in vchip_top.v. */
  statusWord(o = this.plainOutputs()) {
    let s = 0n;
    const put = (lo, hi, val) => {
      const width = hi - lo + 1;
      const mask = (1n << BigInt(width)) - 1n;
      s |= (BigInt(val) & mask) << BigInt(lo);
    };
    put(0, 0, o.chainOk);
    put(1, 1, o.tamperLatch);
    put(2, 3, o.lockState);
    put(4, 5, this.inputs.bootKind);
    put(6, 7, this.inputs.policyBootMode);
    put(8, 8, o.modeOk);
    put(9, 12, o.bootDenyReason);
    put(13, 13, o.secEnabled);
    put(14, 14, o.secLocked);
    put(15, 15, o.secFrozen);
    put(16, 16, o.eraseRequired);
    put(17, 19, o.failCount);
    put(20, 20, o.mediaWriteAllow);
    put(21, 21, o.mediaReadAllow);
    put(22, 22, o.eraseGrant);
    put(23, 23, o.reflashGrant);
    put(24, 24, o.eraseDeniedTamper);
    put(25, 25, o.reflashDeniedTamper);
    put(26, 27, o.lastStage);
    put(28, 28, o.lastStageOk);
    put(29, 31, o.extCount);
    put(32, 32, o.provDone);
    put(33, 33, o.provViolation);
    put(34, 34, o.recoveryActive);
    put(35, 35, o.cpuRelease);
    put(36, 36, o.armLatched);
    put(37, 38, 0);
    put(44, 47, o.abortCode);
    put(48, 48, o.cmdAborted);
    put(52, 55, o.ignoredMeasurements);
    return s;
  }

  /**
   * Advance one clock cycle.
   * Returns the outputs observed after the (single) rising edge.
   */
  step(newInputs = {}) {
    this.inputs = { ...this.inputs, ...newInputs };
    const i = this.inputs;

    // ---- combinational terms, all from the CURRENT state ----
    const closed = this.tamperLatch
      || this.lockState === LOCK.LOCKED
      || this.lockState === LOCK.UNLOCKED;
    const chainOk = this.chainOkNow();
    const preboot = !chainOk && this.lockState === LOCK.IDLE;
    const recoveryActive = i.strapRecovery && preboot ? 1 : 0;
    const provEn = recoveryActive;

    // Same race as the RTL: a provisioning attempt that must be treated as an
    // attack also suppresses a measurement arriving in the same cycle.
    const provWriteOk = provEn && !this.provDone && !this.measSeen && !closed ? 1 : 0;
    const provAttack = i.provValid && !provWriteOk ? 1 : 0;
    const provAttackLatches = provAttack && i.policyProvLatches
      && (this.provDone || this.measSeen || closed) ? 1 : 0;
    const closedNow = closed || provAttackLatches ? 1 : 0;

    const mixNext = mix(this.vector, i.measDigest);
    const goldenSel = this.golden[Math.min(i.measStage, STAGES - 1)];
    const stageMatch = mixNext === goldenSel ? 1 : 0;
    const armed = this.armLatched;

    const next = {};

    // ---------------------------------------------------------- lock block
    if (i.arm) next.armLatched = 1;

    if (i.provValid) {
      if (provWriteOk) {
        next.golden = this.golden.slice();
        next.golden[i.provIdx] = i.provVec & M64;
        if (i.provIdx === STAGES - 1) next.provDone = 1;
      } else {
        next.provViolation = 1;
        if (provAttackLatches) {
          next.tamperLatch = 1;
          // Fail closed: the latch always drives the lock to LOCKED.
          next.lockState = LOCK.LOCKED;
        }
      }
    }

    if (i.measValid) {
      if (closedNow) {
        next.ignoredMeasurements = (this.ignoredMeasurements + 1) & 0xf;
      } else if (!armed) {
        next.ignoredMeasurements = (this.ignoredMeasurements + 1) & 0xf;
      } else if (i.measStage !== this.expectedStage) {
        next.tamperLatch = 1;
        next.lockState = LOCK.LOCKED;
        next.lastStage = i.measStage;
        next.lastStageOk = 0;
      } else {
        next.measSeen = 1;
        next.vector = mixNext;
        next.extCount = (this.extCount + 1) & 0x7;
        next.expectedStage = (i.measStage + 1) & 0x3;
        next.lastStage = i.measStage;
        next.lastStageOk = stageMatch;
        if (!stageMatch) {
          next.tamperLatch = 1;
          next.lockState = LOCK.LOCKED;
        } else {
          next.stageOkMask = this.stageOkMask | (1 << i.measStage);
          if (this.extCount === 0) next.lockState = LOCK.MEASURING;
          if (i.measStage === STAGES - 1) {
            const mask = next.stageOkMask;
            if ((mask & 0b01) && (mask & 0b10)) {
              next.lockState = LOCK.UNLOCKED;
            } else {
              next.tamperLatch = 1;
              next.lockState = LOCK.LOCKED;
            }
          }
        }
      }
    }

    // ----------------------------------------------------------- ATA block
    const state = {
      secEnabled: this.secEnabled,
      secLocked: this.secLocked,
      secFrozen: this.secFrozen,
      erasePrepared: this.erasePrepared,
      eraseRequired: this.eraseRequired,
      unlockBlocked: this.unlockBlocked,
      failCount: this.failCount,
      abortCode: ABORT.NONE,
      cmdAborted: 0,
      eraseReq: 0,
      reflashReq: 0,
      eraseDeniedTamper: 0,
      reflashDeniedTamper: 0,
    };
    const policyDeniesErase = (this.tamperLatch || !chainOk || !i.policyAllowDestructive) ? 1 : 0;
    const policyDeniesReflash = (this.tamperLatch || !chainOk) ? 1 : 0;

    if (i.cmdValid) {
      next.lastCmd = i.cmd;
      switch (i.cmd) {
        case ATA.WRITE_DMA:
          if (!(chainOk && !this.tamperLatch && !this.secLocked)) {
            state.cmdAborted = 1;
            state.abortCode = this.secLocked ? ABORT.LOCKED : ABORT.POLICY;
          }
          break;
        case ATA.READ_DMA:
          if (this.secLocked) { state.cmdAborted = 1; state.abortCode = ABORT.LOCKED; }
          break;
        case ATA.SEC_SET_PWD:
          if (this.secFrozen) { state.cmdAborted = 1; state.abortCode = ABORT.FROZEN; }
          else if (!this.secEnabled) {
            state.secEnabled = 1; state.secLocked = 0;
            state.failCount = 0; state.unlockBlocked = 0;
          } else if (i.pwdOk) { state.failCount = 0; }
          else {
            state.failCount = (this.failCount + 1) & 0x7;
            state.cmdAborted = 1; state.abortCode = ABORT.PWD;
            if (this.failCount === 4) { state.eraseRequired = 1; state.unlockBlocked = 1; }
          }
          break;
        case ATA.SEC_UNLOCK:
          if (this.secFrozen) { state.cmdAborted = 1; state.abortCode = ABORT.FROZEN; }
          else if (!this.secEnabled) { state.cmdAborted = 1; state.abortCode = ABORT.NOT_ENABLED; }
          else if (this.unlockBlocked) { state.cmdAborted = 1; state.abortCode = ABORT.PWD; }
          else if (i.pwdOk) { state.secLocked = 0; state.failCount = 0; }
          else {
            state.failCount = (this.failCount + 1) & 0x7;
            state.secLocked = 1;
            state.cmdAborted = 1; state.abortCode = ABORT.PWD;
            if (this.failCount === 4) { state.eraseRequired = 1; state.unlockBlocked = 1; }
          }
          break;
        case ATA.SEC_DISABLE:
          if (this.secFrozen) { state.cmdAborted = 1; state.abortCode = ABORT.FROZEN; }
          else if (!this.secEnabled) { state.cmdAborted = 1; state.abortCode = ABORT.NOT_ENABLED; }
          else if (i.pwdOk) {
            state.secEnabled = 0; state.secLocked = 0;
            state.failCount = 0; state.unlockBlocked = 0;
          } else {
            state.failCount = (this.failCount + 1) & 0x7;
            state.cmdAborted = 1; state.abortCode = ABORT.PWD;
          }
          break;
        case ATA.SEC_FREEZE:
          if (this.secFrozen) { state.cmdAborted = 1; state.abortCode = ABORT.FROZEN; }
          else state.secFrozen = 1;
          break;
        case ATA.SEC_ERASE_PREP:
          if (this.secFrozen) { state.cmdAborted = 1; state.abortCode = ABORT.FROZEN; }
          else if (!this.secEnabled) { state.cmdAborted = 1; state.abortCode = ABORT.NOT_ENABLED; }
          else state.erasePrepared = 1;
          break;
        case ATA.SEC_ERASE_UNIT:
          if (this.secFrozen) {
            state.cmdAborted = 1; state.abortCode = ABORT.FROZEN; state.erasePrepared = 0;
          } else if (!this.erasePrepared) {
            state.cmdAborted = 1; state.abortCode = ABORT.NO_PREP;
          } else if (policyDeniesErase) {
            state.erasePrepared = 0;
            state.cmdAborted = 1; state.abortCode = ABORT.POLICY;
            if (this.tamperLatch) state.eraseDeniedTamper = 1;
          } else if (i.pwdOk) {
            state.erasePrepared = 0;
            state.eraseReq = 1;
            state.secLocked = 0; state.failCount = 0;
            state.unlockBlocked = 0; state.eraseRequired = 0;
          } else {
            state.erasePrepared = 0;
            state.failCount = (this.failCount + 1) & 0x7;
            state.cmdAborted = 1; state.abortCode = ABORT.PWD;
          }
          break;
        case ATA.VENDOR_REFLASH:
          if (policyDeniesReflash) {
            state.cmdAborted = 1; state.abortCode = ABORT.POLICY;
            if (this.tamperLatch) state.reflashDeniedTamper = 1;
          } else if (recoveryActive) {
            state.reflashReq = 1;
          } else {
            state.cmdAborted = 1; state.abortCode = ABORT.POLICY;
          }
          break;
        default:
          state.cmdAborted = 1; state.abortCode = ABORT.ABRT;
          break;
      }
    }

    // --------------------------------------------------------------- commit
    const lockKeys = ['armLatched', 'provViolation', 'provDone', 'golden', 'tamperLatch',
      'lockState', 'ignoredMeasurements', 'lastStage', 'lastStageOk', 'measSeen',
      'vector', 'extCount', 'expectedStage', 'stageOkMask'];
    for (const k of lockKeys) if (next[k] !== undefined) this[k] = next[k];
    for (const k of Object.keys(state)) this[k] = state[k];
    this.eraseDeniedTamper = state.eraseDeniedTamper;
    this.reflashDeniedTamper = state.reflashDeniedTamper;
    this.abortCode = state.abortCode;
    this.cmdAborted = state.cmdAborted;
    this.lastCmd = next.lastCmd !== undefined ? next.lastCmd : this.lastCmd;

    return this.outputs;
  }

  /**
   * Canonical transcript line. tools/sim/vchip_driver.cc prints the identical
   * format, so the two can be diffed directly.
   */
  line(scenario, cycle) {
    const o = this.outputs;
    const i = this.inputs;
    const f = (v) => (v ? 1 : 0);
    return [
      `${scenario}#${String(cycle).padStart(3, '0')}`,
      `arm=${f(i.arm)}`,
      `arml=${f(o.armLatched)}`,
      `recov=${f(i.strapRecovery)}`,
      `boot=${i.bootKind}`,
      `mode=${i.policyBootMode}`,
      `meas=${f(i.measValid)}/${i.measStage}`,
      `prov=${f(i.provValid)}/${i.provIdx}`,
      `cmd=${i.cmd.toString(16).padStart(2, '0')}`,
      `pwd=${f(i.pwdOk)}`,
      `chain=${f(o.chainOk)}`,
      `tamper=${f(o.tamperLatch)}`,
      `state=${o.lockState}`,
      `mask=${o.stageOkMask.toString(2).padStart(4, '0')}`,
      `ext=${o.extCount}`,
      `vec=${hex64(o.vector)}`,
      `deny=${o.bootDenyReason}`,
      `rel=${f(o.cpuRelease)}`,
      `wr=${f(o.mediaWriteAllow)}`,
      `rd=${f(o.mediaReadAllow)}`,
      `ers=${f(o.eraseGrant)}`,
      `rfl=${f(o.reflashGrant)}`,
      `ersd=${f(o.eraseDeniedTamper)}`,
      `rfld=${f(o.reflashDeniedTamper)}`,
      `sec=${f(o.secEnabled)}${f(o.secLocked)}${f(o.secFrozen)}`,
      `fail=${o.failCount}`,
      `abrt=${o.abortCode}`,
      `ign=${o.ignoredMeasurements}`,
      `st=${hex64(o.status)}`,
    ].join(' ');
  }
}
