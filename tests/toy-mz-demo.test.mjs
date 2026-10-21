import test from 'node:test';
import assert from 'node:assert/strict';
import { buildToyMZ, parseMZ } from '../tools/toy_mz_demo.mjs';

test('toy_mz_demo: MZ header fields are internally consistent', () => {
  const { bytes } = buildToyMZ();
  const { fields } = parseMZ(bytes);
  assert.equal(fields.e_magic, 'MZ');
  assert.equal(fields.e_cparhdr, 4);
  assert.equal(fields.e_crlc, 1);
  const sizeFromHeader = (fields.e_cp - 1) * 512 + fields.e_cblp;
  assert.equal(sizeFromHeader, bytes.length);
});

test('toy_mz_demo: relocation entry is real and located by e_lfarlc', () => {
  const { bytes } = buildToyMZ();
  const { fields, relocs } = parseMZ(bytes);
  assert.equal(fields.e_lfarlc, 0x1c);
  assert.equal(relocs.length, 1);
  assert.equal(relocs[0].offset, 0x03);   // the imm16 of `mov dx, imm16`
  assert.equal(relocs[0].segment, 0x00);
});

test('toy_mz_demo: DOS int 21h stub is present at the header end', () => {
  const { bytes } = buildToyMZ();
  const { codeStart } = parseMZ(bytes);
  assert.equal(codeStart, 64);
  // cd 21 (int 21h) appears twice: print + exit
  const stub = bytes.subarray(64, 64 + 12);
  assert.equal(stub.filter((v, i) => v === 0xcd && stub[i + 1] === 0x21).length, 2);
});

test('toy_mz_demo: RSRC string table round-trips', () => {
  const { bytes, strings } = buildToyMZ(['HELLO-FROM-TOY', 'TOY-RESOURCE-1']);
  const parsed = parseMZ(bytes);
  assert.ok(parsed.rsrcOffset > 0);
  assert.deepEqual(parsed.strings, strings);
});

test('toy_mz_demo: custom string sets round-trip', () => {
  const set = ['A', 'LONGER-RESOURCE-NAME', 'X'];
  const { bytes } = buildToyMZ(set);
  assert.deepEqual(parseMZ(bytes).strings, set);
});

test('toy_mz_demo: rejects non-MZ input', () => {
  assert.throws(() => parseMZ(Buffer.from('GIF89a not an exe')), /not an MZ/);
});
