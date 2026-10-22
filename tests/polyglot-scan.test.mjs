import test from 'node:test';
import assert from 'node:assert/strict';
import { scanBuffer, SIGS } from '../tools/polyglot_scan.mjs';

const S = (s) => Buffer.from(s, 'latin1');

test('polyglot_scan: pure PNG classifies as single', () => {
  const png = Buffer.concat([S('\x89PNG\r\n\x1a\n'), S('payload')]);
  const r = scanBuffer(png);
  assert.equal(r.classification, 'single');
  assert.equal(r.matches.length, 1);
  assert.equal(r.matches[0].id, 'png');
});

test('polyglot_scan: GIF + appended ZIP = parasite-or-stack (GIFAR shape)', () => {
  const gifar = Buffer.concat([S('GIF89a....'), S('PK\x03\x04jarbytes')]);
  const r = scanBuffer(gifar);
  assert.equal(r.classification, 'parasite-or-stack');
  assert.equal(r.matches[0].id, 'gif89');
  assert.ok(r.matches.some((m) => m.id === 'zip'));
});

test('polyglot_scan: MZ + later ARJ = parasite-or-stack (SFX shape)', () => {
  const sfx = Buffer.concat([S('MZ\x90\x00stub'), S('junkjunk'), S('\x60\xea')]);
  const r = scanBuffer(sfx);
  assert.equal(r.classification, 'parasite-or-stack');
  assert.equal(r.matches[0].id, 'mz');
  assert.ok(r.matches.some((m) => m.id === 'arj'));
});

test('polyglot_scan: overlapping magics = chimera-candidate (JPEG marker overlap)', () => {
  // FF D8 FF D8 FF: JPEG magic matches at 0 ([0,3)) and 2 ([2,5)) — ranges overlap.
  const r = scanBuffer(S('\xff\xd8\xff\xd8\xff'));
  assert.equal(r.classification, 'chimera-candidate');
  assert.equal(r.matches.filter((m) => m.id === 'jpeg').length, 2);
});

test('polyglot_scan: two later formats and no offset-0 magic = multi-offset', () => {
  const buf = Buffer.concat([S('....'), S('PK\x03\x04'), S('....'), S('%PDF-1.4')]);
  const r = scanBuffer(buf);
  assert.equal(r.classification, 'multi-offset');
  assert.equal(r.matches.filter((m) => m.offset === 0).length, 0);
});

test('polyglot_scan: unknown bytes classify as unknown', () => {
  const r = scanBuffer(S('hello, plain text only'));
  assert.equal(r.classification, 'unknown');
  assert.equal(r.matches.length, 0);
});

test('polyglot_scan: export surface is stable (incl. round-14 MIME labels)', () => {
  assert.ok(Array.isArray(SIGS) && SIGS.length >= 15);
  for (const s of SIGS) {
    assert.equal(typeof s.id, 'string');
    assert.ok(Array.isArray(s.magic) && s.magic.length >= 2);
    assert.equal(typeof s.anywhere, 'boolean');
    assert.match(s.mime, /^(image|application)\/[\w.+-]+$/, `${s.id} carries an IANA-style MIME label`);
  }
});

test('polyglot_scan: matches carry the MIME label of their signature', () => {
  const gifar = scanBuffer(Buffer.concat([S('GIF89a....'), S('PK\x03\x04jarbytes')]));
  assert.equal(gifar.matches.find((m) => m.id === 'gif89').mime, 'image/gif');
  assert.equal(gifar.matches.find((m) => m.id === 'zip').mime, 'application/zip');
  const png = scanBuffer(Buffer.concat([S('\x89PNG\r\n\x1a\n'), S('x')]));
  assert.equal(png.matches[0].mime, 'image/png');
  const sfx = scanBuffer(Buffer.concat([S('MZ\x90\x00stub'), S('\x60\xea')]));
  assert.equal(sfx.matches.find((m) => m.id === 'mz').mime, 'application/x-msdownload');
  assert.equal(sfx.matches.find((m) => m.id === 'arj').mime, 'application/x-arj');
});

test('polyglot_scan: PDF + ZIP EOCD non-overlap reports both', () => {
  const buf = Buffer.concat([S('%PDF-1.4\nbody\n'), S('PK\x05\x06')]);
  const r = scanBuffer(buf);
  assert.equal(r.classification, 'parasite-or-stack');
  assert.ok(r.matches.some((m) => m.id === 'pdf'));
  assert.ok(r.matches.some((m) => m.id === 'zip-eocd'));
});
