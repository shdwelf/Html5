import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'acorn';
import { buildTorrentAtlas, TORRENT_ATLAS_FILES } from '../scripts/build-torrent-atlas.mjs';
import { inspectTorrent } from '../apps/torrent-atlas/torrent.mjs';

test('public Atlas is the exact eight-file source build, with no network/storage/HTML execution API', () => {
  assert.equal(buildTorrentAtlas({ check: true }), 8);
  const html = readFileSync('apps/torrent-atlas/index.html', 'utf8');
  assert.match(html, /connect-src 'none'/); assert.match(html, /worker-src 'self'/); assert.match(html, /form-action 'none'/);
  assert.doesNotMatch(html, /(?:src|href)="https?:[^\"]+"\s+(?:type="module"|rel="stylesheet")|<(?:script|img|iframe)[^>]+(?:src|href)="https?:/);
  const source = TORRENT_ATLAS_FILES.filter((v) => v.endsWith('.mjs')).map((v) => readFileSync(`apps/torrent-atlas/${v}`, 'utf8')).join('\n');
  const forbidden = new Set(['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'RTCPeerConnection', 'localStorage', 'sessionStorage', 'indexedDB', 'serviceWorker', 'sendBeacon']);
  function check(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Identifier') assert.equal(forbidden.has(node.name), false, `Forbidden runtime API: ${node.name}`);
    if (node.type === 'MemberExpression' && node.computed && node.property.type === 'Literal') assert.equal(forbidden.has(node.property.value), false, `Forbidden computed runtime API: ${node.property.value}`);
    for (const value of Object.values(node)) if (value && typeof value === 'object') { if (Array.isArray(value)) value.forEach(check); else check(value); }
  }
  for (const file of TORRENT_ATLAS_FILES.filter((v) => v.endsWith('.mjs'))) check(parse(readFileSync(`apps/torrent-atlas/${file}`, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' }));
  assert.doesNotMatch(source, /\.innerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new Function/);
  assert.doesNotMatch(source, /location\.(?:href|assign)|window\.open/);
});
const fixtures = JSON.parse(readFileSync('tests/fixtures/torrent-atlas-libtorrent-2.0.11.json'));
for (const vector of fixtures.vectors) test(`independent libtorrent fixture ${vector.id}`, async () => {
  const actual = await inspectTorrent(new Uint8Array(Buffer.from(vector.base64, 'base64')));
  for (const key of ['v1', 'v2', 'pieceLength', 'version']) assert.equal(actual[key], vector[key]);
  assert.equal(actual.total, vector.payloadBytes); assert.equal(actual.files.filter((file) => !file.padding).length, vector.files);
});
