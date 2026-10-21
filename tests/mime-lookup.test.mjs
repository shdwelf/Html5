import test from 'node:test';
import assert from 'node:assert/strict';
import { sniffMime, extMime, checkUpload, MAGIC_MIME, EXT_MIME } from '../tools/mime_lookup.mjs';

test('mime_lookup: sniffing knows the corpus formats', () => {
  assert.equal(sniffMime(Buffer.from('\xff\xd8\xff\xe0rest', 'latin1')), 'image/jpeg');
  assert.equal(sniffMime(Buffer.from('\x89PNG\r\n\x1a\nrest', 'latin1')), 'image/png');
  assert.equal(sniffMime(Buffer.from('GIF89a....', 'latin1')), 'image/gif');
  assert.equal(sniffMime(Buffer.from('PK\x03\x04rest', 'latin1')), 'application/zip');
  assert.equal(sniffMime(Buffer.from('%PDF-1.4', 'latin1')), 'application/pdf');
  assert.equal(sniffMime(Buffer.from('MZ\x90\x00', 'latin1')), 'application/x-msdownload');
  assert.equal(sniffMime(Buffer.from('\x60\xea\x01', 'latin1')), 'application/x-arj');
  assert.equal(sniffMime(Buffer.from('plain text')), null);
});

test('mime_lookup: extension mapping falls back to octet-stream', () => {
  assert.equal(extMime('photo.PNG'), 'image/png');
  assert.equal(extMime('archive.arj'), 'application/x-arj');
  assert.equal(extMime('app.exe'), 'application/x-msdownload');
  assert.equal(extMime('notes.txt'), 'text/plain');
  assert.equal(extMime('mystery.xyz'), 'application/octet-stream');
  assert.equal(extMime('README'), 'application/octet-stream');
});

test('mime_lookup: consistent upload passes', () => {
  const r = checkUpload('pic.jpg', Buffer.from('\xff\xd8\xff\xe0', 'latin1'));
  assert.equal(r.consistent, true);
  assert.equal(r.sniffed, 'image/jpeg');
  assert.equal(r.claimed, 'image/jpeg');
});

test('mime_lookup: claimed-vs-actual mismatch is flagged', () => {
  const r = checkUpload('cute.jpg', Buffer.from('PK\x03\x04', 'latin1'));
  assert.equal(r.consistent, false);
  assert.match(r.note, /MISMATCH/);
  assert.match(r.note, /never replay a client-supplied Content-Type/);
});

test('mime_lookup: no-magic files defer to extension + octet-stream note', () => {
  const r = checkUpload('readme.txt', Buffer.from('hello'));
  assert.equal(r.sniffed, null);
  assert.equal(r.consistent, true);
  assert.match(r.note, /nosniff/);
});

test('mime_lookup: tables export IANA-style names', () => {
  assert.ok(MAGIC_MIME.length >= 15);
  assert.ok(EXT_MIME['.wasm'] === 'application/wasm');
  for (const e of MAGIC_MIME) {
    assert.match(e.mime, /^[a-z]+\/[a-z0-9.+-]+$/);
    assert.ok(Array.isArray(e.exts));
  }
});
