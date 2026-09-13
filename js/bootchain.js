/**
 * bootchain.js — platform-side boot requirements, in the browser.
 *
 * This is the JS half of tools/bootchain.py: it decodes the vchip status word
 * (the layout below mirrors `assign status[...]` in rtl/vchip_top.v) and answers
 * the question "may this machine boot, and under which policy".
 *
 * Duplicating the layout here is a drift risk, so it is not left to trust:
 *   - tools/bootchain.py parses the layout *out of the RTL* and can print it
 *     (`--layout-json`);
 *   - tools/verify_bootchain.mjs compares this file's LAYOUT/CONST against that
 *     output, and runs both implementations over every cycle of the golden
 *     transcript, requiring identical verdicts.
 * If the RTL layout changes, that harness fails until this file is updated.
 */

/** Mirrors the `assign status[hi:lo] = signal;` lines in rtl/vchip_top.v. */
export const LAYOUT = [
  [0, 0, "chain_ok"],
  [1, 1, "tamper_latch"],
  [2, 3, "lock_state"],
  [4, 5, "boot_kind"],
  [6, 7, "policy_boot_mode"],
  [8, 8, "mode_ok"],
  [9, 12, "boot_deny_reason"],
  [13, 13, "sec_enabled"],
  [14, 14, "sec_locked"],
  [15, 15, "sec_frozen"],
  [16, 16, "erase_required"],
  [17, 19, "fail_count"],
  [20, 20, "media_write_allow"],
  [21, 21, "media_read_allow"],
  [22, 22, "erase_grant"],
  [23, 23, "reflash_grant"],
  [24, 24, "erase_denied_tamper"],
  [25, 25, "reflash_denied_tamper"],
  [26, 27, "last_stage"],
  [28, 28, "last_stage_ok"],
  [29, 31, "ext_count"],
  [32, 32, "prov_done"],
  [33, 33, "prov_violation"],
  [34, 34, "recovery_active"],
  [35, 35, "cpu_release"],
  [36, 36, "arm_latched"],
  [37, 38, "reserved"],
  [39, 43, "reserved"],
  [44, 47, "abort_code"],
  [48, 48, "cmd_aborted"],
  [49, 51, "reserved"],
  [52, 55, "ignored_measurements"],
  [56, 63, "reserved"],
];

/** Mirrors rtl/vchip_pkg.vh (`define NAME <width>'d<value>`). */
export const CONSTS = {
  LCK_IDLE: 0, LCK_MEASURING: 1, LCK_UNLOCKED: 2, LCK_LOCKED: 3,
  BOOT_NONE: 0, BOOT_LEGACY: 1, BOOT_UEFI: 2,
  MODE_DUAL: 0, MODE_LEGACY: 1, MODE_UEFI: 2,
  DENY_NONE: 0, DENY_CHAIN: 1, DENY_MODE: 2, DENY_SOURCE: 3, DENY_TAMPER: 4, DENY_ARM: 5,
  STAGE_MBR: 0, STAGE_EFI: 1, STAGE_LOADER: 2, VCHIP_STAGES: 3,
  ABORT_NONE: 0, ABORT_ABRT: 1, ABORT_FROZEN: 2, ABORT_PWD: 3, ABORT_LOCKED: 4,
  ABORT_POLICY: 5, ABORT_NOT_ENABLED: 6, ABORT_NO_PREP: 7,
  ATA_VENDOR_REFLASH: 0xfe,
};

export const BIGINT64 = 0xffffffffffffffffn;

export function parseStatusWord(text) {
  const clean = String(text).trim().replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]{1,16}$/.test(clean)) throw new Error(`not a 16-digit hex status word: ${text}`);
  return BigInt(`0x${clean}`);
}

const maskOf = (lo, hi) => (1n << BigInt(hi - lo + 1)) - 1n;

/** Decode a status word into named fields. Unknown names are skipped. */
export function decodeStatus(word) {
  const w = typeof word === "bigint" ? word : parseStatusWord(word);
  const out = {};
  for (const [lo, hi, name] of LAYOUT) {
    if (name === "reserved") continue;
    out[name] = Number((w >> BigInt(lo)) & maskOf(lo, hi));
  }
  out.__word = w;
  return out;
}

export function reservedBitsSet(word) {
  const w = typeof word === "bigint" ? word : parseStatusWord(word);
  const set = [];
  for (const [lo, hi, name] of LAYOUT) {
    if (name !== "reserved") continue;
    const bits = (w >> BigInt(lo)) & maskOf(lo, hi);
    if (bits) set.push(`[${hi}:${lo}]=0x${bits.toString(16)}`);
  }
  return set;
}

export function denyName(v) {
  for (const [k, val] of Object.entries(CONSTS)) if (k.startsWith("DENY_") && val === v) return k.slice(5).toLowerCase();
  return `unknown(${v})`;
}
export function abortName(v) {
  for (const [k, val] of Object.entries(CONSTS)) if (k.startsWith("ABORT_") && val === v) return k.slice(6).toLowerCase();
  return `unknown(${v})`;
}
export function lockStateName(v) {
  return ({ [CONSTS.LCK_IDLE]: "IDLE", [CONSTS.LCK_MEASURING]: "MEASURING",
    [CONSTS.LCK_UNLOCKED]: "UNLOCKED", [CONSTS.LCK_LOCKED]: "LOCKED" })[v] ?? "?";
}
export function bootKindName(v) {
  return ({ [CONSTS.BOOT_NONE]: "none", [CONSTS.BOOT_LEGACY]: "legacy/MBR", [CONSTS.BOOT_UEFI]: "UEFI" })[v] ?? "?";
}
export function modeName(v) {
  return ({ [CONSTS.MODE_DUAL]: "dual", [CONSTS.MODE_LEGACY]: "legacy-only", [CONSTS.MODE_UEFI]: "uefi-only" })[v] ?? "?";
}
export function stageName(v) {
  return ({ [CONSTS.STAGE_MBR]: "MBR/LBA0", [CONSTS.STAGE_EFI]: "ESP boot app", [CONSTS.STAGE_LOADER]: "second stage" })[v] ?? "?";
}

/**
 * The requirements a boot handoff has to satisfy, evaluated against one status
 * word. `disk` (optional) is the set of boot sources the disk can offer, in the
 * same vocabulary tools/bootchain.py uses: "uefi" and/or "legacy".
 *
 * ids and labels here are the same ones tools/bootchain.py reports, so the two
 * can be diffed field by field.
 */
export function platformChecks(word, policy = "dual", opts = {}) {
  const f = decodeStatus(word);
  const out = [];
  const add = (id, what, level, ok, detail = "") => out.push({ id, what, level, ok, detail });

  const reserved = reservedBitsSet(word);
  add("status_reserved", "reserved status bits read as zero", "REQUIRED", reserved.length === 0,
    reserved.length ? `set: ${reserved.join(", ")}` : "");

  add("platform_chain", "measurement chain is complete and matched (chain_ok)", "REQUIRED",
    f.chain_ok === 1, `chain_ok=${f.chain_ok} state=${lockStateName(f.lock_state)}`);
  add("platform_arm", "enforcement was armed before measuring (arm_latched)", "REQUIRED",
    f.arm_latched === 1, `arm_latched=${f.arm_latched}`);
  add("platform_no_tamper", "no tamper latch is set", "REQUIRED", f.tamper_latch === 0,
    `tamper_latch=${f.tamper_latch}`);
  add("platform_unlocked", "lock state is UNLOCKED", "REQUIRED", f.lock_state === CONSTS.LCK_UNLOCKED,
    `lock_state=${lockStateName(f.lock_state)}`);
  add("platform_reads", "media reads are permitted (ATA security not blocking the boot path)", "REQUIRED",
    f.media_read_allow === 1,
    `media_read_allow=${f.media_read_allow} sec_locked=${f.sec_locked} sec_frozen=${f.sec_frozen} ` +
    `erase_required=${f.erase_required}`);
  add("platform_release", "chipset released the CPU (cpu_release)", "REQUIRED", f.cpu_release === 1,
    `cpu_release=${f.cpu_release} deny=${denyName(f.boot_deny_reason)}`);
  add("platform_mode", "presented boot source is allowed by the chipset policy", "REQUIRED",
    f.mode_ok === 1, `mode_ok=${f.mode_ok} boot_kind=${bootKindName(f.boot_kind)} policy=${modeName(f.policy_boot_mode)}`);

  const armed = f.chain_ok === 1 && f.tamper_latch === 0;
  const destructive = f.erase_grant || f.reflash_grant;
  add("platform_no_destructive_when_untrusted",
    "no erase/reflash grant while the chain is unverified or tampered", "REQUIRED",
    armed || !destructive,
    `erase_grant=${f.erase_grant} reflash_grant=${f.reflash_grant} chain_ok=${f.chain_ok} tamper=${f.tamper_latch}`);

  if (opts.disk) {
    const want = modeName(f.policy_boot_mode).replace("-only", "");
    const capable = opts.disk;
    const ok = (want === "dual" && capable.size > 0)
      || (want === "uefi" && capable.has("uefi"))
      || (want === "legacy" && capable.has("legacy"));
    add("platform_policy_matches_disk", "the disk can supply the boot source the chipset policy requires",
      "REQUIRED", ok, `policy requires ${want}, disk offers ${[...capable].sort().join(", ") || "nothing"}`);
  }
  return out;
}

export function summarise(checks) {
  const count = (v) => checks.filter((c) => (c.ok === false && c.level === "REQUIRED" ? "FAIL"
    : c.ok === false ? "WARN" : c.ok === null || c.ok === undefined ? "SKIP" : "PASS") === v).length;
  return { pass: count("PASS"), fail: count("FAIL"), warn: count("WARN"), skip: count("SKIP"),
    ok: count("FAIL") === 0 };
}
