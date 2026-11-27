import test from 'node:test';
import assert from 'node:assert/strict';
import { File } from 'node:buffer';
import { createHash, webcrypto } from 'node:crypto';
import { LIMITS, TorrentError, safeComponent, hex, bencode, decodeMetainfo, inspectTorrent, inspectMagnet, createTorrent } from '../apps/torrent-atlas/torrent.mjs';
import { SOURCES, SEARCH_PROVIDERS, MANAGERS, buildSearchLink, filterSources, filterManagers } from '../apps/torrent-atlas/data.mjs';
import { sha, map, concat, v1, v2 } from './torrent-fixtures.mjs';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const encoded = (value) => new TextEncoder().encode(value);
const h1 = '0123456789abcdef0123456789abcdef01234567';
const magnet = `magnet:?xt=urn:btih:${h1}`;

test('canonical bencode and exact original info bytes include unknown binary data', async () => {
  assert.equal(new TextDecoder().decode(bencode(map({ z: 1, a: ['é', -7] }))), 'd1:al2:éi-7ee1:zi1ee');
  const fixture = v1({ fields: { unknown: new Uint8Array([0, 255, 254]) } });
  const decoded = decodeMetainfo(fixture.bytes), expected = createHash('sha1').update(bencode(fixture.info)).digest('hex');
  assert.deepEqual(decoded.infoBytes, bencode(fixture.info));
  assert.equal((await inspectTorrent(fixture.bytes)).v1, expected);
  assert.equal((await inspectTorrent(fixture.bytes, expected.toUpperCase())).expectedMatched, true);
  await assert.rejects(inspectTorrent(fixture.bytes, '0'.repeat(40)), /does not match/);
});
for (const value of ['de', 'd4:infoi0ee', 'd4:infodeex', 'd4:infode4:infodee', 'd1:zi1e1:ai2ee', 'd4:infodi01eee', 'd4:infodi-0eee', 'd4:infodi9007199254740992eee', 'd04:infodee', 'd4:infod1:a10:hi', 'd4:infod1:a1:\xffe']) {
  test(`strict metainfo rejects malformed encoding ${JSON.stringify(value)}`, () => assert.throws(() => decodeMetainfo(encoded(value))));
}
test('metadata size, nesting, node and integer bounds fail closed', () => {
  assert.throws(() => decodeMetainfo(new Uint8Array(LIMITS.metadataBytes + 1)), /4 MiB/);
  assert.throws(() => decodeMetainfo(encoded('d4:info' + 'l'.repeat(35) + 'e'.repeat(35) + 'e')), /nesting/);
  assert.throws(() => decodeMetainfo(encoded('d4:infod1:al' + '0:'.repeat(LIMITS.nodes) + 'eee')), /node/);
  assert.throws(() => bencode(Number.MAX_SAFE_INTEGER + 1), /integer/);
  assert.throws(() => bencode(new Map([['a', 1], [encoded('a'), 2]])), /Duplicate/);
});
for (const name of ['..', '.', 'a/b', 'a\\b', 'C:drive', 'a\u0000b', 'a\u202eb', 'con.txt', 'LPT9', 'a.', 'a ', 'file?.txt', '<bad>', 'a|b', 'a"b', '*', 'é'.repeat(128)]) {
  test(`portable paths reject ${JSON.stringify(name)}`, () => assert.throws(() => safeComponent(name), TorrentError));
}
test('ordinary Unicode, leading dots and inert punctuation are preserved', () => {
  assert.equal(safeComponent('数据-α.txt'), '数据-α.txt'); assert.equal(safeComponent('.hidden'), '.hidden');
});
for (const fields of [ { 'meta version': 3 }, { pieces: new Uint8Array(0) }, { 'piece length': 0 }, { private: 2 }, { attr: 'l' }, { 'symlink path': ['other'] }, { 'name.utf-8': 'other.txt' }, { length: -1 } ]) {
  test(`v1 inspection rejects invalid or ambiguous fields ${Object.keys(fields)}`, async () => await assert.rejects(inspectTorrent(v1({ fields }).bytes)));
}
test('v1 file trees reject traversal, collisions, file-directory conflicts and alternate paths', async () => {
  for (const paths of [[['..']], [['A'], ['a']], [['é'], ['e\u0301']], [['a'], ['a', 'b']]]) {
    const fields = { files: paths.map((path) => map({ path, length: 0 })), pieces: new Uint8Array(0) }, fixture = v1({ fields }); fixture.info.delete('length');
    await assert.rejects(inspectTorrent(bencode(fixture.root)));
  }
  const fixture = v1(); fixture.info.delete('length'); fixture.info.set('files', [map({ path: ['safe'], 'path.utf-8': ['other'], length: 5 })]);
  await assert.rejects(inspectTorrent(bencode(fixture.root)), /Ambiguous/);
});
test('private metadata keeps trackers as inert data and never emits a share magnet', async () => {
  const fixture = v1({ fields: { private: 1 }, root: { announce: 'https://tracker.example.invalid/secret-passkey', 'url-list': ['https://seed.example.invalid/file'] } });
  const summary = await inspectTorrent(fixture.bytes);
  assert.equal(summary.private, true); assert.equal(summary.magnet, null); assert.equal(summary.trackers.length, 1); assert.equal(summary.webSeeds.length, 1);
});
for (const [count, pieceLength] of [[1, 16384], [2, 16384], [3, 16384], [3, 32768], [5, 65536]]) {
  test(`v2 verifies independent Merkle vector (${count} pieces, ${pieceLength} bytes)`, async () => {
    const fixture = v2({ count, pieceLength }); const summary = await inspectTorrent(fixture.bytes);
    assert.equal(summary.version, 'v2'); assert.equal(summary.v1, ''); assert.equal(summary.total, fixture.data.length);
    assert.equal(summary.v2, hex(sha('sha256', bencode(fixture.info))));
    assert.equal(summary.pieceCount, count);
  });
}
test('v2 rejects missing, extra, mutated and incorrectly sized piece layers', async () => {
  const fixture = v2(); const layers = fixture.root.get('piece layers');
  fixture.root.delete('piece layers'); await assert.rejects(inspectTorrent(bencode(fixture.root)), /requires a piece layers/);
  fixture.root.set('piece layers', new Map()); await assert.rejects(inspectTorrent(bencode(fixture.root)), /piece layer/);
  fixture.root.set('piece layers', layers); const layer = layers.get(fixture.rootHash); layer[0] ^= 1;
  await assert.rejects(inspectTorrent(bencode(fixture.root)), /Merkle root/); layer[0] ^= 1;
  layers.set(new Uint8Array(32), new Uint8Array(32)); await assert.rejects(inspectTorrent(bencode(fixture.root)), /unused/); layers.delete([...layers.keys()].at(-1));
  layers.set(fixture.rootHash, layer.subarray(0, 32)); await assert.rejects(inspectTorrent(bencode(fixture.root)), /inconsistent/);
});
test('v2 empty files omit roots; symlinks, unsafe names and short roots are rejected', async () => {
  const info = map({ name: 'empty', 'meta version': 2, 'piece length': 16384, 'file tree': map({ empty: map({ '': map({ length: 0 }) }) }) });
  const root = map({ info, 'piece layers': new Map() }); assert.equal((await inspectTorrent(bencode(root))).total, 0);
  const leaf = info.get('file tree').get('empty').get('');
  leaf.set('pieces root', new Uint8Array(32)); await assert.rejects(inspectTorrent(bencode(root)), /Empty/);
  leaf.delete('pieces root'); leaf.set('attr', 'l'); await assert.rejects(inspectTorrent(bencode(root)), /Symbolic/);
});
test('consistent single-file hybrid has both exact hashes; file mismatch is rejected', async () => {
  const fixture = v2({ count: 2 }); fixture.info.set('length', fixture.data.length);
  fixture.info.set('pieces', concat(sha('sha1', fixture.data.subarray(0, 16384)), sha('sha1', fixture.data.subarray(16384))));
  const summary = await inspectTorrent(bencode(fixture.root)); assert.equal(summary.version, 'hybrid'); assert.equal(summary.v1.length, 40); assert.equal(summary.v2.length, 64);
  fixture.info.set('name', 'different.bin'); await assert.rejects(inspectTorrent(bencode(fixture.root)), /hybrid file trees/);
});
test('hybrid multi-file alignment accepts exact padding but not hidden extra payload', async () => {
  const file = (name, length) => [name, map({ '': map({ length, 'pieces root': new Uint8Array(32).fill(length) }) })];
  const info = map({ name: 'multi', 'meta version': 2, 'piece length': 16384, 'file tree': new Map([file('a', 1), file('b', 2)]), files: [map({ path: ['a'], length: 1 }), map({ path: ['.pad', '16383'], length: 16383, attr: 'p' }), map({ path: ['b'], length: 2 })], pieces: new Uint8Array(40) });
  const root = map({ info, 'piece layers': new Map() }); assert.equal((await inspectTorrent(bencode(root))).total, 3);
  info.get('files')[1].set('length', 16382); await assert.rejects(inspectTorrent(bencode(root)), /hybrid padding/);
});
test('magnet hex/base32 and SHA-256 v2 topics normalize, including hybrid claims', () => {
  assert.equal(inspectMagnet(magnet).v1, h1);
  assert.equal(inspectMagnet('magnet:?xt=urn:btih:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA').v1, '0'.repeat(40));
  const summary = inspectMagnet(magnet + '&xt=urn:btmh:1220' + 'b'.repeat(64) + '&dn=A+name&xl=123');
  assert.equal(summary.version, 'hybrid claims'); assert.equal(summary.name, 'A name'); assert.equal(summary.length, 123);
  assert.equal(inspectMagnet(summary.magnet).v2, 'b'.repeat(64));
});
test('minimal magnet removes endpoints, peer hints, file selections and unknown authorities', () => {
  const result = inspectMagnet(magnet + '&tr=https%3A%2F%2Ftracker.example.invalid%2Fsecret&ws=https%3A%2F%2Fseed.example.invalid%2Fa&x.pe=127.0.0.1%3A1234&so=0-2&unknown=value');
  assert.equal(result.magnet, inspectMagnet(magnet).magnet); assert.deepEqual(result.stripped, ['tr', 'ws', 'x.pe', 'so', 'unknown']);
});
for (const input of ['', 'https://example.invalid', 'magnet://?xt=x', magnet + '#frag', magnet + '&dn=%00', magnet + '&dn=%E0%A4', magnet + '&dn=%GG', magnet + '&dn=a&dn=b', magnet + '&xl=01', magnet + '&xl=9007199254740992', magnet + '&xt=urn:btih:' + 'f'.repeat(40), magnet + '&tr=javascript%3Aalert(1)', magnet + '&tr=https%3A%2F%2Fu%3Ap%40example.invalid', 'magnet:?xt=urn:btmh:1320' + '0'.repeat(64), magnet + '&' + 'a=b&'.repeat(130) + 'c=d']) {
  test(`magnet rejects hostile or unsupported input ${input.slice(0, 85)}`, () => assert.throws(() => inspectMagnet(input), TorrentError));
}
test('creation is deterministic, sorted and hashes pieces spanning file boundaries', async () => {
  const a = new File([new Uint8Array(12000).fill(65)], 'a.txt'), b = new File([new Uint8Array(9000).fill(66)], 'b.txt');
  const progress = [], created = await createTorrent([b, a], { pieceLength: 16384 }, (p) => progress.push(p.processed));
  assert.deepEqual(created.bytes, (await createTorrent([a, b], { pieceLength: 16384 })).bytes);
  const { info } = decodeMetainfo(created.bytes), all = concat(await a.arrayBuffer(), await b.arrayBuffer());
  assert.deepEqual(info.get(hex(encoded('pieces'))), concat(sha('sha1', all.subarray(0, 16384)), sha('sha1', all.subarray(16384))));
  assert.deepEqual(created.summary.files.map((file) => file.path.join('/')), ['a.txt', 'b.txt']);
  assert.equal(progress.at(-1), 21000); assert.equal(created.summary.total, 21000);
});
test('creation handles empty files and private flag without claiming seeding', async () => {
  const file = new File([], 'empty.txt'); assert.equal((await createTorrent([file])).summary.pieceCount, 0);
  await assert.rejects(createTorrent([file], { private: true }), /explicit tracker/);
  const result = await createTorrent([file], { private: true, trackers: ['https://tracker.example.invalid/announce'] });
  assert.equal(result.summary.magnet, null); assert.equal(result.summary.private, true);
});
test('creation rejects too many/large, duplicate, malformed, changed and unsafe source files', async () => {
  for (const files of [[], Array(257).fill(new File([], 'a')), [new File([], 'a'), new File([], 'A')], [new File([], '../bad')], [{ name: 'large', size: LIMITS.createBytes + 1, slice() { throw Error('must not read'); } }], [{ name: 'changed', size: 4, slice() { return new Blob(['x']); } }]]) await assert.rejects(createTorrent(files));
  await assert.rejects(createTorrent([new File([], 'a')], { pieceLength: 17000 }), /power of two/);
});
test('directory and manager landscape are unique HTTPS primary links and filters are local', () => {
  assert.ok(SOURCES.length >= 27); assert.ok(MANAGERS.length >= 35);
  for (const list of [SOURCES, MANAGERS]) { assert.equal(new Set(list.map((v) => v.id)).size, list.length); for (const item of list) assert.equal(new URL(item.url).protocol, 'https:'); }
  assert.ok(filterSources('searx').length > 1); assert.ok(filterSources('', 'client').every((v) => v.category === 'client'));
  assert.equal(filterSources('not-a-real-source-8844').length, 0); assert.equal(filterManagers('Dropbox')[0].id, 'dropbox');
});
test('outbound searches are encoded, fixed-origin and Archive requires actual torrent metadata', () => {
  for (const provider of SEARCH_PROVIDERS) { const url = new URL(buildSearchLink(provider.id, 'a & b/#? ☃')); assert.equal(url.origin, provider.origin); assert.equal(url.hash, ''); }
  assert.match(new URL(buildSearchLink('archive', 'data')).searchParams.get('query'), /^format:"Archive BitTorrent"/);
  assert.throws(() => buildSearchLink('https://attacker.invalid', 'test'));
  for (const query of ['', ' '.repeat(3), 'a'.repeat(257), 'a\u0000']) assert.throws(() => buildSearchLink('github', query));
});
