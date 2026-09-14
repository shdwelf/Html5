/**
 * chipset-lab.js — controller for chipset-lab.html.
 *
 * Decodes a vchip status word and evaluates the boot requirements from
 * js/bootchain.js. The requirement ids, levels and pass/fail decisions are the
 * same ones tools/bootchain.py produces, and tools/verify_bootchain.mjs asserts
 * that on every cycle of the golden transcript.
 *
 * No network, no wasm: this is arithmetic over one 64-bit word.
 */

import {
  decodeStatus, reservedBitsSet, platformChecks, summarise,
  denyName, abortName, lockStateName, bootKindName, modeName, stageName, parseStatusWord,
} from "./bootchain.js";

const $ = (id) => document.getElementById(id);

const PRESETS = [
  {
    id: "honest",
    label: "honest_boot#016",
    word: "000120197830a129",
    note: "MBR → ESP → loader all matched, chain complete, CPU released.",
  },
  {
    id: "tampered",
    label: "tampered_mbr#006",
    word: "000000112000080e",
    note: "LBA0 did not match the golden vector: tamper latched, LOCKED, handoff denied.",
  },
  {
    id: "erase-denied",
    label: "tampered_mbr#012",
    word: "001150112100292e",
    note: "SECURITY ERASE UNIT attempted on the tampered box: refused by chipset policy (ABORT_POLICY) and latched.",
  },
  {
    id: "prov-violation",
    label: "provision_attack#006",
    word: "000000133000080e",
    note: "A write to the golden vectors after measuring started: same tamper latch, same denial.",
  },
  {
    id: "counter-spent",
    label: "attempt_counter#016",
    word: "00015019780b6129",
    note: "Five bad passwords spent the ATA counter; the erase is still refused (ABORT_POLICY), boot still allowed.",
  },
];

const ATA_COMMANDS = [
  { code: 0xf1, ata: "SECURITY SET PASSWORD", hdparm: "--security-set-pass PWD" },
  { code: 0xf2, ata: "SECURITY UNLOCK", hdparm: "--security-unlock PWD" },
  { code: 0xf3, ata: "SECURITY ERASE PREPARE", hdparm: "--security-erase PWD (prepare)" },
  { code: 0xf4, ata: "SECURITY ERASE UNIT", hdparm: "--security-erase / --security-erase-enhanced" },
  { code: 0xf5, ata: "SECURITY FREEZE LOCK", hdparm: "--security-freeze" },
  { code: 0xf6, ata: "SECURITY DISABLE PASSWORD", hdparm: "--security-disable PWD" },
  { code: 0xc8, ata: "READ DMA", hdparm: "(reads: dd)" },
  { code: 0xca, ata: "WRITE DMA", hdparm: "(writes: dd)" },
  { code: 0xfe, ata: "vendor reflash", hdparm: "(vendor updater)" },
];

function renderPresets() {
  const host = $("presets");
  host.textContent = "";
  for (const p of PRESETS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "preset";
    b.title = p.note;
    b.textContent = p.label;
    b.addEventListener("click", () => {
      $("status-input").value = p.word;
      render();
    });
    host.appendChild(b);
  }
}

function row(table, key, value, cls = "") {
  const tr = document.createElement("tr");
  const th = document.createElement("th");
  th.textContent = key;
  const td = document.createElement("td");
  td.textContent = value;
  if (cls) td.className = cls;
  tr.append(th, td);
  table.appendChild(tr);
}

function render() {
  const input = $("status-input").value.trim();
  const policy = $("policy-select").value;
  const verdict = $("verdict");
  const fields = $("fields");
  const reqs = $("requirements");
  const ata = $("ata");
  fields.textContent = "";
  reqs.textContent = "";
  ata.textContent = "";

  let word;
  try {
    word = parseStatusWord(input);
  } catch (err) {
    verdict.textContent = `not a 64-bit hex status word: ${err.message}`;
    verdict.className = "verdict bad";
    return;
  }

  const f = decodeStatus(word);
  const checks = platformChecks(word, policy, { disk: null });
  const s = summarise(checks);

  verdict.className = `verdict ${s.ok ? "good" : "bad"}`;
  verdict.textContent = s.ok
    ? `BOOT GRANTED — ${s.pass} requirement(s) met` +
      (s.warn ? `, ${s.warn} warning(s)` : "")
    : `BOOT DENIED — ${checks.filter((c) => c.ok === false && c.level === "REQUIRED").map((c) => c.id).join(", ")}`;

  const reserved = reservedBitsSet(word);
  row(fields, "chain_ok", f.chain_ok ? "1 (measured chain matched)" : "0");
  row(fields, "tamper_latch", f.tamper_latch ? "1 — SET" : "0", f.tamper_latch ? "bad" : "good");
  row(fields, "lock_state", `${f.lock_state} (${lockStateName(f.lock_state)})`);
  row(fields, "arm_latched", f.arm_latched ? "1 (enforcement was armed)" : "0 — never armed");
  row(fields, "ext_count", String(f.ext_count));
  row(fields, "stage_ok_mask", f.stage_ok_mask !== undefined ? String(f.stage_ok_mask) : "see transcript line");
  row(fields, "ignored_measurements", String(f.ignored_measurements));
  row(fields, "boot_kind", `${f.boot_kind} (${bootKindName(f.boot_kind)})`);
  row(fields, "policy_boot_mode", `${f.policy_boot_mode} (${modeName(f.policy_boot_mode)})`);
  row(fields, "mode_ok", f.mode_ok ? "1" : "0");
  row(fields, "boot_deny_reason", `${f.boot_deny_reason} (${denyName(f.boot_deny_reason)})`);
  row(fields, "cpu_release", f.cpu_release ? "1 — handed off" : "0", f.cpu_release ? "good" : "bad");
  row(fields, "last_stage / last_stage_ok", `${f.last_stage} (${stageName(f.last_stage)}) / ${f.last_stage_ok}`);
  row(fields, "media_read_allow / media_write_allow", `${f.media_read_allow} / ${f.media_write_allow}`);
  row(fields, "sec_enabled / sec_locked / sec_frozen",
    `${f.sec_enabled} / ${f.sec_locked} / ${f.sec_frozen}`);
  row(fields, "erase_required (counter spent)", f.erase_required ? "1" : "0");
  row(fields, "fail_count", String(f.fail_count));
  row(fields, "erase_grant / reflash_grant", `${f.erase_grant} / ${f.reflash_grant}`,
    (f.erase_grant || f.reflash_grant) && !(f.chain_ok && !f.tamper_latch) ? "bad" : "");
  row(fields, "erase_denied_tamper / reflash_denied_tamper",
    `${f.erase_denied_tamper} / ${f.reflash_denied_tamper}`);
  row(fields, "abort_code", `${f.abort_code}${f.cmd_aborted ? ` (${abortName(f.abort_code)})` : " (no abort)"}`);
  row(fields, "prov_done / prov_violation", `${f.prov_done} / ${f.prov_violation}`);
  row(fields, "recovery_active", String(f.recovery_active));
  row(fields, "reserved bits set", reserved.length ? reserved.join(", ") : "none",
    reserved.length ? "bad" : "good");

  for (const c of checks) {
    const div = document.createElement("div");
    const mark = c.ok === true ? "ok" : c.ok === false ? (c.level === "REQUIRED" ? "bad" : "warn") : "skip";
    div.className = `check ${mark}`;
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = mark === "ok" ? "PASS" : mark === "bad" ? "FAIL" : mark === "warn" ? "WARN" : "SKIP";
    // Built as nodes rather than innerHTML: the detail strings contain values
    // that come from data, and there is no reason to route them through HTML.
    const text = document.createElement("span");
    const id = document.createElement("b");
    id.textContent = c.id;
    text.append(id, document.createTextNode(` — ${c.what}`));
    div.append(badge, text);
    if (c.detail) {
      const d = document.createElement("small");
      d.textContent = c.detail;
      div.append(d);
    }
    reqs.append(div);
  }

  row(ata, "chain_ok & ~tamper_latch", (f.chain_ok && !f.tamper_latch) ? "true — capabilities available" : "false — all gates closed");
  row(ata, "erase_grant (destructive)", f.erase_grant ? "GRANTED" : "refused",
    f.erase_grant ? "" : "good");
  row(ata, "reflash_grant (firmware)", f.reflash_grant ? "GRANTED" : "refused", f.reflash_grant ? "" : "good");
  row(ata, "last refusal", f.cmd_aborted ? abortName(f.abort_code) : "none in this state",
    f.cmd_aborted && (f.erase_denied_tamper || f.reflash_denied_tamper) ? "bad" : "");
  for (const c of ATA_COMMANDS) {
    const gate = c.code === 0xf4
      ? (f.erase_grant ? "granted" : f.tamper_latch ? "refused: ABORT_POLICY (tamper)" : "refused: chain/policy")
      : c.code === 0xfe
        ? (f.reflash_grant ? "granted" : f.tamper_latch ? "refused: ABORT_POLICY (tamper)" : "refused: chain/presence")
        : c.code === 0xca
          ? (f.media_write_allow ? "allowed" : "refused: media_write_allow=0")
          : c.code === 0xc8
            ? (f.media_read_allow ? "allowed" : "refused: media_read_allow=0")
            : (f.sec_frozen ? "aborts: ABORT_FROZEN" : "handled by the ATA FSM");
    row(ata, `0x${c.code.toString(16).padStart(2, "0")} ${c.ata}`, `${c.hdparm} — ${gate}`);
  }
}

renderPresets();
$("status-input").addEventListener("input", render);
$("policy-select").addEventListener("change", render);
render();
