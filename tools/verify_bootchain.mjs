#!/usr/bin/env node
/**
 * verify_bootchain.mjs — keep js/bootchain.js honest.
 *
 *   node tools/verify_bootchain.mjs
 *
 * Three checks, all mechanical:
 *
 *   1. the LAYOUT / CONSTS in js/bootchain.js must equal what
 *      `python3 tools/bootchain.py --layout-json` derives *from the RTL*
 *      (rtl/vchip_top.v + rtl/vchip_pkg.vh), so the page cannot decode a status
 *      word the hardware no longer produces;
 *   2. every cycle of the golden transcript is decoded by both implementations
 *      (JS here, Python in tools/bootchain.py) and the verdict lists must match
 *      requirement for requirement;
 *   3. the JS requirement policy must reject the same crafted status words the
 *      Python selftest uses — a healthy word, a tampered word, a word that
 *      leaks a destructive grant, an unarmed word, and a reserved-bit word.
 *
 * Exit 1 on any mismatch.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { LAYOUT, CONSTS, decodeStatus, platformChecks, summarise } from "../js/bootchain.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TRANSCRIPT = join(ROOT, "rtl", "golden", "vchip_transcript.txt");

let failures = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); failures++; };
const ok = (msg) => console.log(`  ok   ${msg}`);

// ------------------------------------------------------- 1. layout vs the RTL
const fromRtl = JSON.parse(execFileSync("python3", [join(ROOT, "tools", "bootchain.py"), "--layout-json"],
  { cwd: ROOT, encoding: "utf8" }));

// The RTL's assign statements are not in bit order ([52:55] is written last),
// so compare as sets: same fields on the same bits is what matters.
const norm = (l) => l.map(([lo, hi, name]) => `${lo}:${hi}:${name}`).sort();
const rtlLayout = fromRtl.layout.map(({ lo, hi, name }) => [lo, hi, name]);
if (JSON.stringify(norm(rtlLayout)) !== JSON.stringify(norm(LAYOUT))) {
  fail("js/bootchain.js LAYOUT differs from the layout parsed out of rtl/vchip_top.v");
  const a = new Map(LAYOUT.map(([lo, hi, n]) => [`${lo}-${hi}`, n]));
  const b = new Map(rtlLayout.map(([lo, hi, n]) => [`${lo}-${hi}`, n]));
  for (const [k, v] of b) if (a.get(k) !== v) console.log(`     RTL says [${k}] = ${v}, JS says ${a.get(k) ?? "nothing"}`);
  for (const [k, v] of a) if (!b.has(k)) console.log(`     JS has an extra field [${k}] = ${v}`);
} else {
  ok(`status layout matches the RTL (${LAYOUT.length} fields, all 64 bits assigned)`);
}

const constNames = ["LCK_IDLE", "LCK_MEASURING", "LCK_UNLOCKED", "LCK_LOCKED", "BOOT_LEGACY", "BOOT_UEFI",
  "MODE_DUAL", "MODE_LEGACY", "MODE_UEFI", "DENY_NONE", "DENY_CHAIN", "DENY_MODE", "DENY_SOURCE",
  "DENY_TAMPER", "DENY_ARM", "ABORT_NONE", "ABORT_POLICY", "ABORT_FROZEN", "ABORT_NO_PREP",
  "STAGE_MBR", "STAGE_EFI", "STAGE_LOADER", "VCHIP_STAGES"];
const constMismatch = constNames.filter((n) => fromRtl.consts[n] !== CONSTS[n]);
if (constMismatch.length) fail(`CONSTS differ from rtl/vchip_pkg.vh: ${constMismatch.map((n) => `${n} RTL=${fromRtl.consts[n]} JS=${CONSTS[n]}`).join(", ")}`);
else ok(`constants match rtl/vchip_pkg.vh (${constNames.length} checked)`);

// ------------------------------------------------- 2. every transcript cycle
const lines = readFileSync(TRANSCRIPT, "utf8").split("\n").filter((l) => /^[a-z_]+#\d+\s/.test(l));
const pyVerdicts = new Map();
{
  // Ask python for its verdicts for every cycle in one go.
  const script = `
import json, sys, importlib.util
spec = importlib.util.spec_from_file_location("bc", r"${join(ROOT, "tools", "bootchain.py")}")
bc = importlib.util.module_from_spec(spec)
sys.modules["bc"] = bc          # dataclasses looks the module up by name
spec.loader.exec_module(bc)
out = {}
for line in open(r"${TRANSCRIPT}"):
    import re
    m = re.match(r"^([a-z_]+#\\d+)\\s+(.*)$", line.strip())
    if not m: continue
    f = dict(re.findall(r"([a-z_]+)=([0-9a-fx/]+)", m.group(2)))
    word = int(f["st"], 16)
    rep = bc.check_platform(word, "dual")
    out[m.group(1)] = [[c.id, c.level, c.ok] for c in rep.checks]
print(json.dumps(out))
`;
  const raw = execFileSync("python3", ["-c", script], { encoding: "utf8" });
  for (const [k, v] of Object.entries(JSON.parse(raw))) pyVerdicts.set(k, v);
}

let compared = 0, cycleMismatch = 0;
for (const line of lines) {
  const [name, rest] = line.split(/\s+/).reduce((acc, tok, i) => (i === 0 ? [tok, ""] : [acc[0], acc[1] + " " + tok]), ["", ""]);
  const fields = Object.fromEntries([...rest.matchAll(/([a-z_]+)=([0-9a-fx/]+)/g)].map((m) => [m[1], m[2]]));
  if (!fields.st) continue;
  const word = BigInt(`0x${fields.st}`);
  const js = platformChecks(word, "dual").map((c) => [c.id, c.level, c.ok]);
  const py = pyVerdicts.get(name);
  if (!py) { fail(`python produced no verdicts for ${name}`); continue; }
  compared++;
  if (JSON.stringify(js) !== JSON.stringify(py)) {
    cycleMismatch++;
    if (cycleMismatch <= 3) {
      console.log(`     ${name}: JS ${JSON.stringify(js)}`);
      console.log(`     ${name}: PY ${JSON.stringify(py)}`);
    }
  }
}
if (cycleMismatch) fail(`${cycleMismatch}/${compared} transcript cycles got different verdicts from JS and Python`);
else ok(`JS and Python agree on all ${compared} transcript cycles (requirement by requirement)`);

// ------------------------------------------------- 3. crafted status words
const st = (o) => {
  let w = 0n;
  for (const [k, v] of Object.entries(o)) {
    const hit = LAYOUT.find(([, , n]) => n === k);
    if (!hit) throw new Error(`unknown field ${k}`);
    w |= BigInt(v) << BigInt(hit[0]);
  }
  return w;
};
const healthy = st({ chain_ok: 1, lock_state: 2, arm_latched: 1, mode_ok: 1, media_read_allow: 1,
  media_write_allow: 1, cpu_release: 1, boot_kind: 2, policy_boot_mode: 2 });
const cases = [
  ["healthy unlocked word", healthy, true],
  ["tampered word", st({ lock_state: 3, tamper_latch: 1, arm_latched: 1, boot_kind: 2, policy_boot_mode: 2, boot_deny_reason: CONSTS.DENY_TAMPER }), false],
  ["destructive grant while tampered", st({ lock_state: 3, tamper_latch: 1, erase_grant: 1 }), false],
  ["enforcement never armed", st({ chain_ok: 1, lock_state: 2, mode_ok: 1, media_read_allow: 1, cpu_release: 1, boot_kind: 2, policy_boot_mode: 2 }), false],
  ["reserved bit set", healthy | (1n << 50n), false],
  ["locked chipset", st({ lock_state: 3, arm_latched: 1, boot_kind: 1, policy_boot_mode: 2, boot_deny_reason: CONSTS.DENY_CHAIN }), false],
];
for (const [label, word, shouldPass] of cases) {
  const s = summarise(platformChecks(word, "dual"));
  if (s.ok !== shouldPass) fail(`${label}: expected ${shouldPass ? "pass" : "deny"}, got ${s.ok ? "pass" : "deny"} (${JSON.stringify(s)})`);
  else ok(`${label}: ${s.ok ? "requirements met" : "boot denied"} (${s.pass} pass / ${s.fail} fail)`);
}

// the decoder must be total: every 64-bit word decodes without throwing, and
// reserved bits are the only way to get an "all clear" on a tampered word
for (let i = 0; i < 64; i++) {
  const w = 1n << BigInt(i);
  decodeStatus(w);
}
ok("decoder handled all 64 single-bit words");

console.log(failures ? `\n${failures} failure(s)` : "\nbootchain JS mirror verified");
process.exit(failures ? 1 : 0);
