#!/usr/bin/env node
/**
 * run_vchip_scenarios.mjs — drive js/vchip-model.js through the same scenarios
 * as the RTL and print the transcript.
 *
 *   node tools/run_vchip_scenarios.mjs > /tmp/model.txt
 *
 * Exit code is non-zero if the reference model's own mixer disagrees with the
 * generated vector table, which would mean the model and the table were
 * generated from different code.
 *
 * The output is compared byte for byte with the transcript produced by the
 * synthesizable RTL (tools/sim/vchip_driver.cc) in tools/verify_rtl.py.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Vchip, mix, hex64 } from '../js/vchip-model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VECTORS = join(ROOT, 'rtl', 'golden', 'vchip_vectors.json');

const doc = JSON.parse(readFileSync(VECTORS, 'utf8'));

// --- mixer conformance ------------------------------------------------------
let bad = 0;
for (const v of doc.mixVectors) {
  const got = hex64(mix(BigInt(`0x${v.acc}`), BigInt(`0x${v.dig}`)));
  if (got !== v.mix) {
    if (bad < 5) console.error(`mix mismatch: acc=${v.acc} dig=${v.dig} table=${v.mix} model=${got}`);
    bad++;
  }
}
if (bad) {
  console.error(`${bad}/${doc.mixVectors.length} mix vectors disagree with the model's own mixer`);
  process.exit(1);
}

const out = [];
out.push('# vchip transcript');
out.push(`# vector: ${doc.vecW} bits / ${doc.lanes} lanes / ${doc.rounds} rounds, seed ${doc.seed}`);
out.push(`# mixer conformance: ${doc.mixVectors.length}/${doc.mixVectors.length} vectors match`);
out.push(`# golden chain: mbr=${doc.goldens.mbr} efi=${doc.goldens.efi} loader=${doc.goldens.loader}`);
out.push('');

for (const sc of doc.scenarios) {
  out.push(`# ===== ${sc.name} =====`);
  if (sc.description) out.push(`# ${sc.description}`);
  const chip = new Vchip();
  let cycle = 0;
  for (const st of sc.steps) {
    if (st.note) out.push(`# ${sc.name}: ${st.note}`);
    const inputs = {
      arm: st.arm,
      strapRecovery: st.recov,
      bootKind: st.boot,
      policyBootMode: st.mode,
      policyAllowDestructive: st.allow_destr,
      policyProvLatches: st.prov_latches,
      provValid: st.prov_valid,
      provIdx: st.prov_idx,
      provVec: BigInt(`0x${st.prov_vec}`),
      measValid: st.meas_valid,
      measStage: st.meas_stage,
      measDigest: BigInt(`0x${st.meas_digest}`),
      cmdValid: st.cmd_valid,
      cmd: st.cmd,
      pwdOk: st.pwd_ok,
    };
    if (!st.rst_n) {
      // Asynchronous reset: the RTL holds every register cleared, and no input
      // is looked at. Mirror that exactly rather than running the logic.
      chip.powerOnReset();
      chip.inputs = { ...chip.inputs, ...inputs };
    } else {
      chip.step(inputs);
    }
    out.push(chip.line(sc.name, cycle));
    cycle++;
  }
  out.push('');
}

process.stdout.write(`${out.join('\n')}\n`);
