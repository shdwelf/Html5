#!/usr/bin/env node
/**
 * gen_vchip_vectors.mjs — expand rtl/scenarios/vchip_scenarios.json into
 * artifacts that both sides of the verification can consume.
 *
 *   node tools/gen_vchip_vectors.mjs            # check only (CI posture)
 *   node tools/gen_vchip_vectors.mjs --write    # rewrite the derived files
 *
 * Derived from js/vchip-model.js, which is the specification:
 *
 *   rtl/golden/vchip_vectors.json  mixer conformance vectors + golden chain
 *   rtl/golden/vchip_vectors.h     the same, as C++ for tools/sim/vchip_driver.cc
 *
 * The generator re-derives the golden chain from the stage digests on every
 * run. If the values stored in the scenario file disagree it fails, which is
 * what stops a mixer edit from silently re-baselining the test.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mix, SEED, VEC_W, LANES, LANE_W, ROUNDS, hex64 } from '../js/vchip-model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCENARIO_FILE = join(ROOT, 'rtl', 'scenarios', 'vchip_scenarios.json');
const OUT_JSON = join(ROOT, 'rtl', 'golden', 'vchip_vectors.json');
const OUT_H = join(ROOT, 'rtl', 'golden', 'vchip_vectors.h');

const STAGE_ORDER = ['mbr', 'efi', 'loader'];
const WRITE = process.argv.includes('--write');

const HEX64 = /^[0-9a-fA-F]{1,16}$/;

function parse64(text, where) {
  const clean = String(text).trim().replace(/^0x/i, '');
  if (!HEX64.test(clean)) throw new Error(`${where}: not a 64-bit hex value: ${text}`);
  return BigInt(`0x${clean}`);
}

function loadScenarios() {
  if (!existsSync(SCENARIO_FILE)) throw new Error(`missing ${SCENARIO_FILE}`);
  return JSON.parse(readFileSync(SCENARIO_FILE, 'utf8'));
}

/** Recompute the golden chain: g_i = mix(g_{i-1}, digest_i), g_{-1} = SEED. */
function deriveGoldens(digests) {
  const out = {};
  let acc = SEED;
  for (const stage of STAGE_ORDER) {
    const key = `${stage}_ok`;
    if (!(key in digests)) throw new Error(`scenario file has no digest "${key}"`);
    acc = mix(acc, digests[key]);
    out[stage] = acc;
  }
  return out;
}

function resolve(ref, digests, goldens, where) {
  if (typeof ref === 'number') return BigInt(ref);
  const text = String(ref);
  let m;
  if ((m = text.match(/^@digest\.(\w+)$/))) {
    if (!(m[1] in digests)) throw new Error(`${where}: unknown digest "${m[1]}"`);
    return digests[m[1]];
  }
  if ((m = text.match(/^@golden\.(\w+)$/))) {
    if (!(m[1] in goldens)) throw new Error(`${where}: unknown golden "${m[1]}"`);
    return goldens[m[1]];
  }
  return parse64(text, where);
}

/** Deterministic 64-bit xorshift so the vector table is reproducible. */
function makeRng(seed) {
  let s = BigInt(seed) & 0xffffffffffffffffn;
  return () => {
    s ^= (s << 13n) & 0xffffffffffffffffn;
    s ^= s >> 7n;
    s ^= (s << 17n) & 0xffffffffffffffffn;
    s &= 0xffffffffffffffffn;
    return s;
  };
}

function mixVectors(count = 96) {
  const rng = makeRng(0x243f6a8885a308d3n);
  const vectors = [];
  const push = (acc, dig, label) => vectors.push({ acc, dig, mix: mix(acc, dig), label });

  // Edge cases first: these catch lane-order and rotate mistakes that random
  // vectors can hide.
  const edges = [
    [0n, 0n], [0n, ~0n & 0xffffffffffffffffn],
    [~0n & 0xffffffffffffffffn, 0n], [~0n & 0xffffffffffffffffn, ~0n & 0xffffffffffffffffn],
    [SEED, 0n], [0n, SEED],
    [0x000000000000ffffn, 0xffff000000000000n],
    [0x00000000ffff0000n, 0x0000ffff00000000n],
    [0x0123456789abcdefn, 0xfedcba9876543210n],
    [0x8000000000000000n, 0x0000000000000001n],
    [0x0000000000000001n, 0x8000000000000000n],
  ];
  for (const [acc, dig] of edges) push(acc, dig, 'edge');
  for (let i = 0; i < count; i++) {
    push(rng(), rng(), `rand${i}`);
  }
  return vectors;
}

function main() {
  const doc = loadScenarios();

  const digests = {};
  for (const [k, v] of Object.entries(doc.digests || {})) {
    digests[k] = parse64(v, `digests.${k}`);
  }

  const goldens = deriveGoldens(digests);

  // The checked-in golden values must match what the mixer derives today.
  let drift = [];
  for (const stage of STAGE_ORDER) {
    const stored = doc.golden?.[stage];
    if (!stored) { drift.push(`${stage}: empty`); continue; }
    if (parse64(stored, `golden.${stage}`) !== goldens[stage]) drift.push(`${stage}: stored ${stored}, derived ${hex64(goldens[stage])}`);
  }
  if (drift.length && !WRITE) {
    console.error('golden vectors in rtl/scenarios/vchip_scenarios.json do not match the reference mixer:');
    for (const d of drift) console.error(`  - ${d}`);
    console.error('run with --write to re-baseline (and say why in the commit message)');
    process.exit(1);
  }

  // Resolve every scenario step into concrete input values.
  const scenarios = (doc.scenarios || []).map((sc) => {
    const steps = (sc.steps || []).map((st, idx) => {
      const where = `${sc.name}[${idx}]`;
      const get = (k) => (st[k] !== undefined ? st[k] : 0);
      return {
        rst_n: st.rst_n === undefined ? 1 : st.rst_n,
        arm: get('arm'),
        recov: get('recov'),
        boot: get('boot'),
        mode: get('mode'),
        allow_destr: st.allow_destr === undefined ? 0 : st.allow_destr,
        prov_latches: st.prov_latches === undefined ? 1 : st.prov_latches,
        prov_valid: get('prov_valid'),
        prov_idx: get('prov_idx'),
        prov_vec: resolve(st.prov_vec !== undefined ? st.prov_vec : 0, digests, goldens, `${where}.prov_vec`),
        meas_valid: get('meas_valid'),
        meas_stage: get('meas_stage'),
        meas_digest: resolve(st.meas_digest !== undefined ? st.meas_digest : 0, digests, goldens, `${where}.meas_digest`),
        cmd_valid: get('cmd_valid'),
        cmd: get('cmd'),
        pwd_ok: get('pwd_ok'),
        note: st.note || '',
      };
    });
    // JSON has no BigInt: the resolved 64-bit values travel as fixed-width hex.
    return {
      name: sc.name,
      description: sc.description || '',
      steps: steps.map((st) => ({
        ...st,
        prov_vec: hex64(st.prov_vec),
        meas_digest: hex64(st.meas_digest),
      })),
    };
  });

  if (!scenarios.length) throw new Error('scenario file defines no scenarios');

  const vectors = mixVectors();
  const resolved = {
    vecW: VEC_W, lanes: LANES, laneW: LANE_W, rounds: ROUNDS, seed: hex64(SEED),
    digests: Object.fromEntries(Object.entries(digests).map(([k, v]) => [k, hex64(v)])),
    goldens: Object.fromEntries(Object.entries(goldens).map(([k, v]) => [k, hex64(v)])),
    mixVectors: vectors.map((v) => ({ acc: hex64(v.acc), dig: hex64(v.dig), mix: hex64(v.mix) })),
    scenarios,
  };

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, `${JSON.stringify(resolved, null, 2)}\n`);

  writeFileSync(OUT_H, header(resolved));

  if (WRITE) {
    doc.golden = Object.fromEntries(STAGE_ORDER.map((s) => [s, hex64(goldens[s])]));
    writeFileSync(SCENARIO_FILE, `${JSON.stringify(doc, null, 2)}\n`);
    console.log('rewrote golden vectors in rtl/scenarios/vchip_scenarios.json');
  }

  console.log(`scenarios : ${scenarios.length} (${scenarios.reduce((n, s) => n + s.steps.length, 0)} cycles)`);
  console.log(`mix vectors: ${vectors.length}`);
  console.log(`golden     : mbr=${hex64(goldens.mbr)} efi=${hex64(goldens.efi)} loader=${hex64(goldens.loader)}`);
  console.log(`wrote      : ${OUT_JSON.replace(ROOT + '/', '')}, ${OUT_H.replace(ROOT + '/', '')}`);
}

function header(r) {
  const stepLines = r.scenarios.map((sc) => {
    const rows = sc.steps.map((st) => '  { ' + [
      st.rst_n, st.arm, st.recov, st.boot, st.mode, st.allow_destr, st.prov_latches,
      st.prov_valid, st.prov_idx, `0x${st.prov_vec}ull`,
      st.meas_valid, st.meas_stage, `0x${st.meas_digest}ull`,
      st.cmd_valid, st.cmd, st.pwd_ok,
      JSON.stringify(st.note),
    ].join(', ') + ' }').join(',\n');
    const id = `SC_${sc.name.toUpperCase()}`;
    return `static const VStep ${id}[] = {\n${rows}\n};`;
  }).join('\n\n');

  const scenRows = r.scenarios.map((sc) => {
    const id = `SC_${sc.name.toUpperCase()}`;
    return `  { ${JSON.stringify(sc.name)}, ${JSON.stringify(sc.description || '')}, ${id}, `
      + `(int)(sizeof(${id}) / sizeof(VStep)) }`;
  }).join(',\n');

  const vecRows = r.mixVectors.map((v) => `  { 0x${v.acc}ull, 0x${v.dig}ull, 0x${v.mix}ull }`).join(',\n');

  return `// GENERATED by tools/gen_vchip_vectors.mjs — do not edit by hand.
// Source: rtl/scenarios/vchip_scenarios.json + js/vchip-model.js
#pragma once
#include <stdint.h>

struct VMixVec { uint64_t acc; uint64_t dig; uint64_t mix; };

struct VStep {
  uint8_t rst_n, arm, recov, boot, mode, allow_destr, prov_latches;
  uint8_t prov_valid, prov_idx;
  uint64_t prov_vec;
  uint8_t meas_valid, meas_stage;
  uint64_t meas_digest;
  uint8_t cmd_valid, cmd, pwd_ok;
  const char *note;
};

struct VScenario { const char *name; const char *desc; const VStep *steps; int count; };

static const uint64_t VCHIP_SEED = 0x${r.seed}ull;
static const uint64_t VCHIP_GOLDEN_MBR = 0x${r.goldens.mbr}ull;
static const uint64_t VCHIP_GOLDEN_EFI = 0x${r.goldens.efi}ull;
static const uint64_t VCHIP_GOLDEN_LOADER = 0x${r.goldens.loader}ull;
static const int VCHIP_VEC_W = ${r.vecW};
static const int VCHIP_LANES = ${r.lanes};
static const int VCHIP_ROUNDS = ${r.rounds};

static const VMixVec VCHIP_MIX_VECTORS[] = {
${vecRows}
};
static const int VCHIP_MIX_VECTOR_COUNT = (int)(sizeof(VCHIP_MIX_VECTORS) / sizeof(VMixVec));

${stepLines}

static const VScenario VCHIP_SCENARIOS[] = {
${scenRows}
};
static const int VCHIP_SCENARIO_COUNT = (int)(sizeof(VCHIP_SCENARIOS) / sizeof(VScenario));
`;
}

main();
