#!/usr/bin/env node
/** Actual independent library controls. Uses only metadata parsers/hashers, never peers. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { File } from 'node:buffer';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectTorrent, createTorrent } from '../apps/torrent-atlas/torrent.mjs';
const python = process.env.PYTHON || 'python3';
const run = (...args) => execFileSync(python, ['tools/torrent-atlas-interop.py', ...args], { encoding: 'utf8', timeout: 30000 });
const vectors = JSON.parse(run('generate')), fixture = 'tests/fixtures/torrent-atlas-libtorrent-2.0.11.json';
for (const expected of vectors.vectors) {
  const actual = await inspectTorrent(new Uint8Array(Buffer.from(expected.base64, 'base64')));
  for (const key of ['version', 'pieceLength', 'v1', 'v2']) assert.equal(actual[key], expected[key], `${expected.id}: ${key}`);
  assert.equal(actual.total, expected.payloadBytes, expected.id);
  assert.equal(actual.files.filter((f) => !f.padding).length, expected.files, expected.id);
}
if (process.argv.includes('--write-fixtures')) writeFileSync(fixture, JSON.stringify(vectors, null, 2) + '\n');
else assert.deepEqual(vectors, JSON.parse(readFileSync(fixture)), 'Independent fixtures changed. Investigate rather than silently refreshing.');
const temp = mkdtempSync(join(tmpdir(), 'atlas-independent-exports-'));
try {
  const manifest = [];
  for (const [id, files, options] of [
    ['single', [new File(['hello'], 'one.txt')], {}],
    ['spanning', [new File([new Uint8Array(12000).fill(1)], 'a.bin'), new File([new Uint8Array(9000).fill(2)], 'b.bin')], { pieceLength: 16384 }],
    ['private', [new File(['hello'], 'one.txt')], { private: true, trackers: ['https://tracker.example.invalid/announce'] }],
    ['unicode', [new File(['synthetic'], '数据-α.txt')], {}],
  ]) {
    const result = await createTorrent(files, options), file = `${id}.torrent`;
    writeFileSync(join(temp, file), result.bytes); manifest.push({ file, v1: result.summary.v1, total: result.summary.total, private: result.summary.private });
  }
  writeFileSync(join(temp, 'manifest.json'), JSON.stringify(manifest));
  console.log(run('validate', temp).trim());
  console.log(`Atlas accepted ${vectors.vectors.length} independently generated v1/v2/hybrid vectors. No peer sessions created.`);
} finally { rmSync(temp, { recursive: true, force: true }); }
