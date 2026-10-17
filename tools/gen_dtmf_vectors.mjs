#!/usr/bin/env node
/**
 * gen_dtmf_vectors.mjs — freeze the DTMF golden model into rtl/golden/.
 *
 * Writes three things:
 *
 *   rtl/golden/dtmf_sine.hex      1024 x 12-bit two's complement, $readmemh-able
 *   rtl/golden/dtmf_vectors.json  phase increments, Goertzel coefficients, the
 *                                 first 64 samples of every key, decode results
 *   rtl/golden/dtmf_transcript.txt the same in a form you can read in a terminal
 *
 * The sine table is written out rather than recomputed on both sides: that is
 * the whole point. If js/dtmf-model.js and rtl/dtmf_tone_gen.v each derived
 * their own sine, agreement would prove nothing about either.
 *
 *   node tools/gen_dtmf_vectors.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DTMF_LOW, DTMF_HIGH, DTMF_KEYS, FS, PH_W, IDX_W, SAMPLE_W, ENTRIES,
  phaseInc, actualFreq, goertzelK, sineTable, hannWindow, generateKey, detect,
  goertzelPeakAccumulator,
} from '../js/dtmf-model.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'rtl', 'golden');
mkdirSync(OUT, { recursive: true });

const WAVE_LEN = 64;   // samples frozen per key; enough to expose an off-by-one

/* ------------------------------------------------------------- sine table */

const table = sineTable();
const hex = Array.from(table, (v) => (v & 0xfff).toString(16).padStart(3, '0')).join('\n');
writeFileSync(join(OUT, 'dtmf_sine.hex'), `${hex}\n`);

/* ------------------------------------------------------------- Hann window */
/*
 * Frozen for the same reason as the sine table: the RTL reads these bytes with
 * $readmemh, so the window cannot drift between the model and the hardware.
 */
const BLOCK_WIN = 205;   // ~25.6 ms, the classic DTMF minimum tone length
const win = hannWindow(BLOCK_WIN);
writeFileSync(join(OUT, 'dtmf_hann.hex'),
  `${Array.from(win, (v) => (v & 0xffff).toString(16).padStart(4, '0')).join('\n')}\n`);

/* ------------------------------------------------------------------ vectors */

const keys = DTMF_KEYS.flat();

const incs = {
  low: DTMF_LOW.map((f) => ({ freq: f, inc: phaseInc(f), actual: actualFreq(phaseInc(f)) })),
  high: DTMF_HIGH.map((f) => ({ freq: f, inc: phaseInc(f), actual: actualFreq(phaseInc(f)) })),
};

const coeffs = [...DTMF_LOW, ...DTMF_HIGH].map((f) => ({ freq: f, k: goertzelK(f) }));

// One full-length block per key for the detector, plus the frozen sample prefix.
const BLOCK = BLOCK_WIN;
const perKey = keys.map((key) => {
  const wave = generateKey(key, BLOCK, { table });
  const dec = detect(wave);
  return {
    key,
    first: Array.from(generateKey(key, WAVE_LEN, { table })),
    detected: dec ? dec.key : null,
    power: dec ? dec.power : 0,
  };
});

// Measured, not assumed: this is what sizes the accumulator in the RTL.
let peakAcc = 0;
for (const key of keys)
  for (const f of [...DTMF_LOW, ...DTMF_HIGH])
    peakAcc = Math.max(peakAcc,
      goertzelPeakAccumulator(generateKey(key, BLOCK, { table }), f, { window: win }));
const accBits = Math.ceil(Math.log2(peakAcc + 1)) + 1;

const vectors = {
  meta: {
    fs: FS, phaseWidth: PH_W, indexWidth: IDX_W, sampleWidth: SAMPLE_W,
    entries: ENTRIES, waveLen: WAVE_LEN, blockLen: BLOCK,
    generated: 'tools/gen_dtmf_vectors.mjs',
    model: 'js/dtmf-model.js',
    rtl: 'rtl/dtmf_tone_gen.v',
  },
  increments: incs,
  coefficients: coeffs,
  datapath: { peakAccumulator: peakAcc, accumulatorBits: accBits, powerBits: accBits * 2 + 15 },
  window: { kind: 'hann', length: BLOCK_WIN, q: 15 },
  keys: perKey,
  negatives: {
    silence: detect(new Int16Array(BLOCK)),
    // A single tone must not decode: a real keypad always puts up a pair.
    singleTone: detect(generateKeySingle(DTMF_LOW[1], BLOCK, table)),
    // Two keys at once is a talk-off; the detector is allowed to abstain.
    talkOff: detect(sum(generateKey('1', BLOCK, { table }), generateKey('9', BLOCK, { table }))),
  },
};

function generateKeySingle(freq, n, tbl) {
  const out = new Int16Array(n);
  const inc = phaseInc(freq);
  const mask = (1n << BigInt(PH_W)) - 1n;
  const shift = BigInt(PH_W - IDX_W);
  let phase = 0n;
  for (let i = 0; i < n; i++) {
    out[i] = tbl[Number((phase >> shift) & BigInt(tbl.length - 1))];
    phase = (phase + BigInt(inc)) & mask;
  }
  return out;
}
function sum(a, b) {
  const lim = (1 << (SAMPLE_W - 1)) - 1;
  const out = new Int16Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const s = a[i] + b[i];
    out[i] = s > lim ? lim : s < -lim - 1 ? -lim - 1 : s;
  }
  return out;
}

writeFileSync(join(OUT, 'dtmf_vectors.json'), `${JSON.stringify(vectors, null, 2)}\n`);

/* --------------------------------------------------------------- transcript */

const lines = [];
lines.push('# dtmf golden transcript');
lines.push(`# fs=${FS} Hz, ${PH_W}-bit phase accumulator, ${ENTRIES}-entry ${SAMPLE_W}-bit sine table`);
const decoded = perKey.filter((k) => k.detected === k.key).length;
lines.push(`# ${decoded}/${keys.length} keys decode to themselves`);
lines.push('');
lines.push('# phase increments (inc = round(f * 2^32 / fs))');
for (const grp of ['low', 'high'])
  for (const t of incs[grp])
    lines.push(`#   ${String(t.freq).padStart(4)} Hz  inc=${String(t.inc).padStart(10)}  actual=${t.actual.toFixed(4)} Hz  err=${((t.actual - t.freq) / t.freq * 1e6).toFixed(2)} ppm`);
lines.push('');
lines.push(`# goertzel accumulator: peak |s| = ${peakAcc} -> ${accBits} signed bits`);
lines.push(`# power term k*s1*s2 therefore needs ${accBits * 2 + 15} bits`);
lines.push('');
lines.push('# goertzel coefficients (k = round(2*cos(2*pi*f/fs) * 2^15))');
for (const c of coeffs) lines.push(`#   ${String(c.freq).padStart(4)} Hz  k=${c.k}`);
lines.push('');
lines.push('# detection');
for (const k of perKey)
  lines.push(`key ${k.key}  -> ${k.detected ?? '(none)'}   peak power ${k.power}`);
lines.push('');
lines.push('# negatives (all must be null)');
lines.push(`silence     -> ${vectors.negatives.silence ? vectors.negatives.silence.key : 'null'}`);
lines.push(`single tone -> ${vectors.negatives.singleTone ? vectors.negatives.singleTone.key : 'null'}`);
lines.push(`talk-off    -> ${vectors.negatives.talkOff ? vectors.negatives.talkOff.key : 'null'}`);
lines.push('');
lines.push('# first 16 samples of each key');
for (const k of perKey)
  lines.push(`${k.key}: ${k.first.slice(0, 16).map((v) => String(v).padStart(5)).join(' ')}`);

writeFileSync(join(OUT, 'dtmf_transcript.txt'), `${lines.join('\n')}\n`);

console.log(`wrote rtl/golden/dtmf_sine.hex (${ENTRIES} entries)`);
console.log(`wrote rtl/golden/dtmf_vectors.json (${keys.length} keys, ${WAVE_LEN} samples each)`);
console.log(`wrote rtl/golden/dtmf_transcript.txt`);
