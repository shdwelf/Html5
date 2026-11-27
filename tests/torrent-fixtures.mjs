/** Synthetic, never downloadable payloads. Independent node:crypto reference hashes. */
import { createHash } from 'node:crypto';
import { bencode } from '../apps/torrent-atlas/torrent.mjs';
export const sha = (algorithm, bytes) => new Uint8Array(createHash(algorithm).update(bytes).digest());
export const map = (object) => new Map(Object.entries(object));
export const concat = (...items) => new Uint8Array(Buffer.concat(items.map((v) => Buffer.from(v))));
export function v1({ name = 'test.txt', data = Buffer.from('hello'), length = data.length, pieceLength = 16384, fields = {}, root = {} } = {}) {
  const pieces = [];
  for (let i = 0; i < data.length; i += pieceLength) pieces.push(sha('sha1', data.subarray(i, i + pieceLength)));
  const info = map({ name, length, 'piece length': pieceLength, pieces: concat(...pieces), ...fields });
  const metainfo = map({ info, ...root });
  return { info, root: metainfo, bytes: bencode(metainfo) };
}
export function v2({ count = 3, pieceLength = 16384, tail = 17 } = {}) {
  const data = Uint8Array.from({ length: (count - 1) * pieceLength + tail }, (_, i) => i % 251);
  const leaves = [];
  for (let i = 0; i < data.length; i += 16384) leaves.push(sha('sha256', data.subarray(i, i + 16384)));
  let width = 1; while (width < leaves.length) width *= 2;
  while (leaves.length < width) leaves.push(new Uint8Array(32));
  const levels = [leaves];
  while (levels.at(-1).length > 1) { const before = levels.at(-1), next = []; for (let i = 0; i < before.length; i += 2) next.push(sha('sha256', concat(before[i], before[i + 1]))); levels.push(next); }
  const rootHash = levels.at(-1)[0], layer = levels[Math.log2(pieceLength / 16384)];
  const info = map({ name: 'example.bin', 'piece length': pieceLength, 'meta version': 2, 'file tree': map({ 'example.bin': map({ '': map({ length: data.length, 'pieces root': rootHash }) }) }) });
  const root = map({ info, 'piece layers': new Map(data.length > pieceLength ? [[rootHash, concat(...layer.slice(0, Math.ceil(data.length / pieceLength)))]] : []) });
  return { info, root, bytes: bencode(root), data, rootHash };
}
