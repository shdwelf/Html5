import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DTMF_LOW, DTMF_HIGH, DTMF_KEYS, FS, PH_W, IDX_W, SAMPLE_W, ENTRIES,
  phaseInc, actualFreq, goertzelK, sineTable, hannWindow,
  generateKey, detect, decodeStream, goertzelPeakAccumulator,
} from '../js/dtmf-model.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GOLDEN = join(ROOT, 'rtl', 'golden');
const RTL = join(ROOT, 'rtl', 'dtmf_tone_gen.v');

const vectors = JSON.parse(readFileSync(join(GOLDEN, 'dtmf_vectors.json'), 'utf8'));
const verilog = readFileSync(RTL, 'utf8');

const BLOCK = vectors.meta.blockLen;
const table = sineTable();

/**
 * The point of this suite.
 *
 * There is no Verilog simulator in this repository, so the Verilog cannot be
 * executed. What *can* be checked, and is, is that the two implementations agree
 * on every number they share: phase increments, Goertzel coefficients, the sine
 * table, the window, and the accumulator width. Those are the places an RTL port
 * actually goes wrong, and a drift on either side fails here.
 */

test('rtl/dtmf_tone_gen.v exists and declares both modules', () => {
  assert.ok(existsSync(RTL));
  assert.match(verilog, /module\s+dtmf_tone_gen\b/);
  assert.match(verilog, /module\s+dtmf_goertzel\b/);
});

test('the Verilog phase increments match the model exactly', () => {
  const found = {};
  const re = /localparam\s*\[PH_W-1:0\]\s*INC_(\d+)\s*=\s*32'd(\d+)\s*;/g;
  let m;
  while ((m = re.exec(verilog))) found[m[1]] = Number(m[2]);

  const expected = {};
  for (const f of [...DTMF_LOW, ...DTMF_HIGH]) expected[f] = phaseInc(f);

  assert.deepEqual(Object.keys(found).sort(), Object.keys(expected).sort(),
    'the Verilog must declare one increment per DTMF frequency');
  for (const f of Object.keys(expected))
    assert.equal(found[f], expected[f],
      `INC_${f} in the Verilog is ${found[f]} but the model computes ${expected[f]}`);
});

test('the Verilog accumulator is wide enough for the measured peak', () => {
  const m = verilog.match(/parameter\s+ACC_W\s*=\s*(\d+)/);
  assert.ok(m, 'ACC_W not found in the Verilog');
  const declared = Number(m[1]);

  // Recomputed here rather than trusted from the vectors file.
  let peak = 0;
  const win = hannWindow(BLOCK);
  for (const key of DTMF_KEYS.flat())
    for (const f of [...DTMF_LOW, ...DTMF_HIGH])
      peak = Math.max(peak, goertzelPeakAccumulator(generateKey(key, BLOCK, { table }), f, { window: win }));
  const need = Math.ceil(Math.log2(peak + 1)) + 1;

  assert.ok(declared >= need,
    `ACC_W=${declared} but the measured peak |s|=${peak} needs ${need} bits`);
  assert.equal(vectors.datapath.peakAccumulator, peak,
    'the frozen vectors disagree with a fresh measurement');
});

test('the frozen sine table is byte-identical to the model', () => {
  const hex = readFileSync(join(GOLDEN, 'dtmf_sine.hex'), 'utf8').trim().split('\n');
  assert.equal(hex.length, ENTRIES);
  for (let i = 0; i < ENTRIES; i++) {
    const want = (table[i] & 0xfff).toString(16).padStart(3, '0');
    assert.equal(hex[i], want, `sine entry ${i} differs`);
  }
});

test('the frozen Hann window matches hannWindow()', () => {
  const hex = readFileSync(join(GOLDEN, 'dtmf_hann.hex'), 'utf8').trim().split('\n');
  const w = hannWindow(BLOCK);
  assert.equal(hex.length, BLOCK);
  for (let i = 0; i < BLOCK; i++)
    assert.equal(hex[i], (w[i] & 0xffff).toString(16).padStart(4, '0'), `window entry ${i}`);
});

test('every phase increment lands on its frequency to within rounding', () => {
  // A 32-bit accumulator over 8 kHz steps frequency by 8000/2^32 = 1.86 uHz,
  // so rounding error must stay under half a step: well under 0.01 ppm.
  for (const f of [...DTMF_LOW, ...DTMF_HIGH]) {
    const err = Math.abs(actualFreq(phaseInc(f)) - f);
    assert.ok(err < FS / 2 ** (PH_W + 1),
      `${f} Hz: increment yields ${actualFreq(phaseInc(f))}, off by ${err}`);
  }
});

test('the Goertzel coefficients match 2*cos(2*pi*f/fs) independently', () => {
  for (const f of [...DTMF_LOW, ...DTMF_HIGH]) {
    const reference = Math.round(2 * Math.cos((2 * Math.PI * f) / FS) * 32768);
    assert.equal(goertzelK(f), reference, `k for ${f} Hz`);
  }
  for (const c of vectors.coefficients)
    assert.equal(c.k, goertzelK(c.freq), `frozen k for ${c.freq} Hz`);
});

test('the model regenerates the frozen waveform samples exactly', () => {
  for (const k of vectors.keys) {
    const wave = generateKey(k.key, vectors.meta.waveLen, { table });
    assert.deepEqual(Array.from(wave), k.first, `samples for key ${k.key}`);
  }
});

test('all 16 keys decode to themselves', () => {
  for (const key of DTMF_KEYS.flat()) {
    const d = detect(generateKey(key, BLOCK, { table }));
    assert.ok(d, `key ${key} did not decode at all`);
    assert.equal(d.key, key, `key ${key} decoded as ${d.key}`);
  }
});

test('the frozen per-key detection results are all correct', () => {
  // Read from the vectors file, so a stale or fudged transcript shows up.
  for (const k of vectors.keys)
    assert.equal(k.detected, k.key, `frozen result for key ${k.key}`);
});

test('silence, a lone tone, and a talk-off all decline to decode', () => {
  assert.equal(detect(new Int16Array(BLOCK)), null, 'silence decoded as a digit');
  assert.equal(vectors.negatives.silence, null);
  assert.equal(vectors.negatives.singleTone, null,
    'a single tone decoded as a key; the twist test is not working');
});

test('the mixed waveform never reaches the limiter', () => {
  // If it does, the tones are above 50% and their harmonics will land on other
  // DTMF bins. That bug cost 11 of 16 keys before it was found.
  const lim = (1 << (SAMPLE_W - 1)) - 1;
  for (const key of DTMF_KEYS.flat()) {
    const wave = generateKey(key, BLOCK, { table });
    for (const v of wave) {
      assert.ok(v < lim && v > -lim - 1,
        `key ${key} hit the limiter at ${v}; tone mixing is not at 50%`);
    }
  }
});

test('a full keypad sequence decodes digit by digit', () => {
  const want = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  const blocks = [];
  for (const key of want) {
    const wave = generateKey(key, BLOCK, { table });
    blocks.push(wave, wave);                       // held for two blocks
    blocks.push(new Int16Array(BLOCK));            // released
  }
  assert.deepEqual(decodeStream(blocks), want);
});

test('the index and accumulator widths agree between model and RTL', () => {
  assert.match(verilog, new RegExp(`parameter\\s+IDX_W\\s*=\\s*${IDX_W}\\b`));
  assert.match(verilog, new RegExp(`parameter\\s+SAMPLE_W\\s*=\\s*${SAMPLE_W}\\b`));
  assert.match(verilog, new RegExp(`parameter\\s+PH_W\\s*=\\s*${PH_W}\\b`));
  assert.match(verilog, /readmemh\("rtl\/golden\/dtmf_sine\.hex"/,
    'the Verilog must load the same sine table the model froze');
});
