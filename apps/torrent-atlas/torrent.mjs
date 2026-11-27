/** Local-only BitTorrent metadata tools. No transport, storage, HTML or peer authority. */
export const LIMITS = Object.freeze({
  metadataBytes: 4 * 1024 * 1024, depth: 32, nodes: 65_536, files: 4096,
  magnetChars: 16_384, parameters: 128, endpoints: 32, pieces: 65_536,
  createBytes: 256 * 1024 * 1024, createFiles: 256, workerMilliseconds: 60_000,
});
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const BAD_TEXT = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
export class TorrentError extends Error { constructor(message) { super(message); this.name = 'TorrentError'; } }
const fail = (message) => { throw new TorrentError(message); };
export const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (value) => Uint8Array.from(value.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
const bytes = (value) => value instanceof Uint8Array;
const field = (map, key) => map instanceof Map ? map.get(hex(encoder.encode(key))) : undefined;
const has = (map, key) => map instanceof Map && map.has(hex(encoder.encode(key)));
function text(value, label, max = 2048) {
  if (!bytes(value) || value.length > max) fail(`${label} is missing, too long, or not a byte string.`);
  let result; try { result = decoder.decode(value); } catch { fail(`${label} is not valid UTF-8.`); }
  if (BAD_TEXT.test(result)) fail(`${label} contains control or bidirectional override characters.`);
  return result;
}
function integer(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(`${label} is outside the supported integer range.`);
  return value;
}
export function safeComponent(value) {
  if (typeof value !== 'string' || !value || encoder.encode(value).length > 255 || BAD_TEXT.test(value) ||
      /[/\\:<>"|?*]/u.test(value) || value === '.' || value === '..' || /[. ]$/u.test(value) ||
      /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(value)) fail('Unsafe or non-portable file/path component.');
  return value;
}
function compare(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}
function join(parts) {
  const output = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output;
}
/** Canonical encoder for newly created values, NOT used to reconstruct an imported info dictionary. */
export function bencode(value, depth = 0) {
  if (depth > LIMITS.depth) fail('Bencode nesting limit exceeded.');
  if (typeof value === 'number') return encoder.encode(`i${integer(value, 'Bencode integer', -Number.MAX_SAFE_INTEGER)}e`);
  if (typeof value === 'string') value = encoder.encode(value);
  if (bytes(value)) return join([encoder.encode(`${value.length}:`), value]);
  if (Array.isArray(value)) return join([encoder.encode('l'), ...value.map((v) => bencode(v, depth + 1)), encoder.encode('e')]);
  if (value instanceof Map) {
    const entries = [...value].map(([key, v]) => [typeof key === 'string' ? encoder.encode(key) : key, v]);
    if (entries.some(([key]) => !bytes(key))) fail('Dictionary keys must be byte strings.');
    entries.sort(([a], [b]) => compare(a, b));
    for (let i = 1; i < entries.length; i++) if (compare(entries[i - 1][0], entries[i][0]) === 0) fail('Duplicate dictionary key.');
    return join([encoder.encode('d'), ...entries.flatMap(([k, v]) => [bencode(k, depth + 1), bencode(v, depth + 1)]), encoder.encode('e')]);
  }
  fail('Unsupported bencode value.');
}
/** Decoded dictionaries use raw-byte hex keys. Exact original top-level info bytes are retained. */
export function decodeMetainfo(input) {
  if (input instanceof ArrayBuffer) input = new Uint8Array(input);
  if (!bytes(input) || !input.length || input.length > LIMITS.metadataBytes) fail('Select a non-empty .torrent of at most 4 MiB.');
  let offset = 0, nodes = 0, infoStart = -1, infoEnd = -1;
  const string = () => {
    const start = offset;
    while (offset < input.length && input[offset] >= 48 && input[offset] <= 57 && offset - start <= 10) offset++;
    if (offset === start || offset - start > 10 || input[offset] !== 58 || (offset - start > 1 && input[start] === 48)) fail('Invalid bencode string length.');
    const length = Number(decoder.decode(input.subarray(start, offset++)));
    if (!Number.isSafeInteger(length) || length > input.length - offset) fail('Truncated bencode string.');
    const result = input.subarray(offset, offset + length); offset += length; return result;
  };
  const parse = (depth) => {
    if (++nodes > LIMITS.nodes || depth > LIMITS.depth) fail('Bencode node/nesting limit exceeded.');
    const tag = input[offset];
    if (tag >= 48 && tag <= 57) return string();
    if (tag === 105) {
      const start = ++offset;
      while (offset < input.length && input[offset] !== 101 && offset - start <= 17) offset++;
      const raw = decoder.decode(input.subarray(start, offset));
      if (input[offset++] !== 101 || !/^(?:0|-?[1-9][0-9]*)$/u.test(raw)) fail('Non-canonical bencode integer.');
      return integer(Number(raw), 'Bencode integer', -Number.MAX_SAFE_INTEGER);
    }
    if (tag !== 100 && tag !== 108) fail('Invalid or truncated bencode value.');
    offset++; const result = tag === 100 ? new Map() : []; let previous;
    while (input[offset] !== 101) {
      if (offset >= input.length) fail('Truncated bencode container.');
      if (tag === 108) { result.push(parse(depth + 1)); continue; }
      if (++nodes > LIMITS.nodes) fail('Bencode node limit exceeded.');
      const key = string();
      if (previous && compare(previous, key) >= 0) fail('Dictionary keys must be strictly sorted with no duplicates.');
      previous = key; const start = offset; const value = parse(depth + 1);
      result.set(hex(key), value);
      if (depth === 0 && hex(key) === '696e666f') { infoStart = start; infoEnd = offset; }
    }
    offset++; return result;
  };
  const root = parse(0);
  if (offset !== input.length || !(root instanceof Map) || !(field(root, 'info') instanceof Map) || infoStart < 0) fail('Expected one complete metainfo dictionary with an info dictionary and no trailing data.');
  return { root, info: field(root, 'info'), infoBytes: input.subarray(infoStart, infoEnd) };
}
function endpoint(value, protocols = ['https:', 'http:', 'udp:', 'wss:', 'ws:']) {
  if (typeof value !== 'string' || value.length > 2048 || BAD_TEXT.test(value) || /\s/u.test(value)) fail('Invalid tracker/web-seed URL.');
  let url; try { url = new URL(value); } catch { fail('Invalid tracker/web-seed URL.'); }
  if (!protocols.includes(url.protocol) || !url.hostname || url.username || url.password || url.hash) fail('Unsupported or credential-bearing tracker/web-seed URL.');
  return url.href;
}
function endpoints(values, protocols) {
  if (values.length > LIMITS.endpoints) fail('At most 32 tracker or web-seed entries are supported.');
  return [...new Set(values.map((value) => endpoint(value, protocols)))];
}
function minimalMagnet(v1, v2, name = '', length) {
  const query = new URLSearchParams();
  if (v1) query.append('xt', `urn:btih:${v1}`);
  if (v2) query.append('xt', `urn:btmh:1220${v2}`);
  if (name) query.append('dn', name);
  if (length !== undefined) query.append('xl', String(length));
  return `magnet:?${query}`;
}
function base32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let pending = 0, bits = 0; const result = [];
  for (const ch of value.toUpperCase()) {
    pending = (pending << 5) | alphabet.indexOf(ch); bits += 5;
    if (bits >= 8) { bits -= 8; result.push((pending >>> bits) & 255); pending &= (1 << bits) - 1; }
  }
  return hex(new Uint8Array(result));
}
export function inspectMagnet(input) {
  if (typeof input !== 'string' || input.length > LIMITS.magnetChars) fail('Magnet input must be at most 16,384 characters.');
  input = input.trim();
  if (!/^magnet:\?/iu.test(input) || BAD_TEXT.test(input) || input.includes('#') || /\s/u.test(input)) fail('Expected a magnet:? URI, not a URL, encoded wrapper or fragment.');
  const pairs = input.slice(8).split('&');
  if (pairs.length > LIMITS.parameters || pairs.some((v) => !v || !v.includes('='))) fail('Invalid or excessive magnet parameters.');
  const params = new Map();
  for (const pair of pairs) {
    const at = pair.indexOf('='); let key, value;
    try { key = decodeURIComponent(pair.slice(0, at).replaceAll('+', ' ')).toLowerCase(); value = decodeURIComponent(pair.slice(at + 1).replaceAll('+', ' ')); }
    catch { fail('Malformed percent-encoding or UTF-8 in magnet URI.'); }
    if (!key || key.length > 64 || BAD_TEXT.test(key) || BAD_TEXT.test(value)) fail('Invalid magnet parameter text.');
    const entries = params.get(key) ?? []; entries.push(value); params.set(key, entries);
  }
  let v1 = '', v2 = '';
  for (const topic of params.get('xt') ?? []) {
    let match;
    if ((match = /^urn:btih:([a-f0-9]{40}|[a-z2-7]{32})$/iu.exec(topic))) {
      const hash = match[1].length === 32 ? base32(match[1]) : match[1].toLowerCase();
      if (v1 && v1 !== hash) fail('Conflicting v1 hashes in one magnet.'); v1 = hash;
    } else if ((match = /^urn:btmh:1220([a-f0-9]{64})$/iu.exec(topic))) {
      const hash = match[1].toLowerCase(); if (v2 && v2 !== hash) fail('Conflicting v2 hashes in one magnet.'); v2 = hash;
    } else fail('Unsupported exact topic. Use v1 btih or SHA-256 v2 btmh (1220).');
  }
  if (!v1 && !v2) fail('A supported exact-topic infohash is required.');
  const one = (key) => { const values = params.get(key) ?? []; if (values.length > 1) fail(`Duplicate ${key} parameter.`); return values[0]; };
  const name = one('dn') ?? '';
  if (encoder.encode(name).length > 1024) fail('Display name is too long.');
  const rawLength = one('xl'); let length;
  if (rawLength !== undefined) {
    if (!/^(?:0|[1-9][0-9]*)$/u.test(rawLength)) fail('Invalid exact length.'); length = integer(Number(rawLength), 'Exact length');
  }
  const trackers = endpoints(params.get('tr') ?? []);
  const webSeeds = endpoints([...(params.get('ws') ?? []), ...(params.get('as') ?? [])], ['https:', 'http:']);
  const stripped = [...params.keys()].filter((key) => !['xt', 'dn', 'xl'].includes(key));
  return { version: v1 && v2 ? 'hybrid claims' : v2 ? 'v2' : 'v1', name, length, v1, v2, trackers, webSeeds, stripped,
    magnet: minimalMagnet(v1, v2, name, length),
    warning: 'A magnet is a claim, not fetched metadata or proof of safety, availability or ownership. A hybrid claim is not cross-verified. Minimal output drops trackers, web seeds, peer addresses, selections and all other parameters. Never share a private torrent this way.' };
}
function paths(files) {
  if (!files.length || files.length > LIMITS.files) fail('Supported file count is 1–4096.');
  const seen = new Set(); let total = 0;
  for (const file of files) {
    if (!Array.isArray(file.path) || !file.path.length || file.path.length > LIMITS.depth) fail('Invalid file path.');
    file.path.forEach(safeComponent);
    const path = file.path.join('/'); if (encoder.encode(path).length > 1024) fail('File path is too long.');
    const key = path.normalize('NFC').toLowerCase();
    if (seen.has(key)) fail('Duplicate or case/normalization-colliding file paths.'); seen.add(key);
    total = integer(total + integer(file.length, 'File length'), 'Total payload length');
  }
  for (const key of seen) { const segments = key.split('/'); segments.pop(); while (segments.length) { if (seen.has(segments.join('/'))) fail('A file path is also used as a directory.'); segments.pop(); } }
  return total;
}
function attributes(dict) {
  const attr = has(dict, 'attr') ? text(field(dict, 'attr'), 'File attributes', 32) : '';
  if (attr.includes('l') || has(dict, 'symlink path')) fail('Symbolic-link torrents are not supported.');
  return { padding: attr.includes('p') };
}
function v1Files(info, name) {
  if (has(info, 'length') === has(info, 'files')) fail('v1 metadata must have length OR files, not both/neither.');
  if (has(info, 'length')) return [{ path: [name], length: integer(field(info, 'length'), 'File length'), ...attributes(info) }];
  const list = field(info, 'files'); if (!Array.isArray(list) || list.length > LIMITS.files) fail('Invalid v1 file list.');
  return list.map((file) => {
    const path = field(file, 'path'); if (!Array.isArray(path)) fail('Invalid v1 file path.');
    const decoded = path.map((part) => text(part, 'Path component', 255));
    if (has(file, 'path.utf-8')) {
      const alternate = field(file, 'path.utf-8');
      if (!Array.isArray(alternate) || alternate.length !== decoded.length || alternate.some((part, i) => text(part, 'Alternate path component', 255) !== decoded[i])) fail('Ambiguous alternate UTF-8 file path.');
    }
    return { path: decoded, length: integer(field(file, 'length'), 'File length'), ...attributes(file) };
  });
}
function v2Files(info) {
  const files = []; const tree = field(info, 'file tree');
  function walk(node, path) {
    if (!(node instanceof Map) || !node.size || path.length > LIMITS.depth) fail('Invalid v2 file tree.');
    if (node.has('')) {
      const leaf = node.get(''); if (!path.length || node.size !== 1 || !(leaf instanceof Map)) fail('Invalid v2 file-tree leaf.');
      const length = integer(field(leaf, 'length'), 'v2 file length'); const root = field(leaf, 'pieces root');
      if (length > 0 && (!bytes(root) || root.length !== 32)) fail('Non-empty v2 files need a 32-byte pieces root.');
      if (length === 0 && root !== undefined) fail('Empty v2 files must omit pieces root.');
      const attr = attributes(leaf); if (attr.padding) fail('Explicit v2 padding files are not supported.');
      files.push({ path, length, root: root ? hex(root) : '', padding: false });
      if (files.length > LIMITS.files) fail('Too many v2 files.'); return;
    }
    for (const [key, value] of node) walk(value, [...path, text(fromHex(key), 'v2 path component', 255)]);
  }
  walk(tree, []); return files;
}
async function digest(algorithm, value) {
  if (!globalThis.crypto?.subtle) fail('Hashing requires Web Crypto in HTTPS or a trusted local context.');
  return new Uint8Array(await crypto.subtle.digest(algorithm, value));
}
async function verifyLayers(root, files, pieceLength) {
  const layers = field(root, 'piece layers'); if (!(layers instanceof Map)) fail('v2 metadata requires a piece layers dictionary.');
  const used = new Map(); let budget = 0;
  let zero = new Uint8Array(32);
  for (let size = 16_384; size < pieceLength; size *= 2) zero = await digest('SHA-256', join([zero, zero]));
  for (const file of files) {
    if (file.length <= pieceLength) continue;
    const count = Math.ceil(file.length / pieceLength);
    if (used.has(file.root)) { if (used.get(file.root) !== count) fail('Inconsistent v2 piece-layer sizes.'); continue; }
    const layer = layers.get(file.root);
    if (!bytes(layer) || count > LIMITS.pieces || layer.length !== count * 32 || (budget += count) > LIMITS.pieces) fail('Missing, oversized or inconsistent v2 piece layer.');
    used.set(file.root, count);
    let width = 1; while (width < count) width *= 2;
    let nodes = Array.from({ length: width }, (_, i) => i < count ? layer.subarray(i * 32, i * 32 + 32) : zero);
    while (nodes.length > 1) {
      const next = [];
      for (let i = 0; i < nodes.length; i += 2) next.push(await digest('SHA-256', join([nodes[i], nodes[i + 1]])));
      nodes = next;
    }
    if (hex(nodes[0]) !== file.root) fail('v2 piece-layer hashes do not match the advertised Merkle root.');
  }
  if (layers.size !== used.size) fail('Unexpected or unused v2 piece-layer entries.');
}
function checkHybrid(oldFiles, newFiles, pieceLength) {
  const visible = oldFiles.filter((file) => !file.padding);
  if (visible.length !== newFiles.length || visible.some((file, i) => file.length !== newFiles[i].length || file.path.join('/') !== newFiles[i].path.join('/'))) fail('Inconsistent hybrid file trees.');
  let offset = 0;
  for (const file of oldFiles) {
    if (file.padding) {
      const gap = (pieceLength - offset % pieceLength) % pieceLength;
      if (!gap || file.length !== gap) fail('Inconsistent hybrid padding.');
    } else if (file.length && offset % pieceLength) fail('Hybrid files must start on a piece boundary.');
    offset += file.length;
  }
}
export async function inspectTorrent(input, expected = '') {
  const { root, info, infoBytes } = decodeMetainfo(input);
  const metaVersion = field(info, 'meta version');
  if (metaVersion !== undefined && metaVersion !== 2) fail('Unsupported metainfo version; only v1 and meta version 2 are supported.');
  const isV2 = metaVersion === 2, isV1 = has(info, 'pieces');
  if (!isV1 && !isV2) fail('No supported v1 pieces or v2 metadata.');
  if (!isV2 && has(info, 'file tree')) fail('A v2 file tree requires meta version 2.');
  if (isV2 && !isV1 && (has(info, 'length') || has(info, 'files'))) fail('Incomplete hybrid metadata.');
  const name = safeComponent(text(field(info, 'name'), 'Torrent name', 255));
  if (has(info, 'name.utf-8') && text(field(info, 'name.utf-8'), 'Alternate name', 255) !== name) fail('Ambiguous alternate UTF-8 torrent name.');
  const pieceLength = integer(field(info, 'piece length'), 'Piece length', 1, 16 * 1024 * 1024);
  if (isV2 && (pieceLength < 16_384 || !Number.isInteger(Math.log2(pieceLength)))) fail('v2 piece length must be a power of two, at least 16 KiB.');
  const privateFlag = field(info, 'private');
  if (privateFlag !== undefined && privateFlag !== 0 && privateFlag !== 1) fail('Private flag must be 0 or 1.');
  const oldFiles = isV1 ? v1Files(info, name) : [];
  const newFiles = isV2 ? v2Files(info) : [];
  const oldTotal = oldFiles.length ? paths(oldFiles) : 0;
  if (newFiles.length) paths(newFiles);
  if (isV1) {
    const pieces = field(info, 'pieces'), count = Math.ceil(oldTotal / pieceLength);
    if (!bytes(pieces) || count > LIMITS.pieces || pieces.length !== count * 20) fail('v1 piece count does not match the declared payload size.');
  }
  if (isV2) await verifyLayers(root, newFiles, pieceLength);
  if (isV1 && isV2) checkHybrid(oldFiles, newFiles, pieceLength);
  const files = isV2 ? newFiles : oldFiles; const total = paths(files);
  const trackers = [];
  if (has(root, 'announce')) trackers.push(text(field(root, 'announce'), 'Tracker URL'));
  if (has(root, 'announce-list')) {
    const tiers = field(root, 'announce-list'); if (!Array.isArray(tiers)) fail('Invalid announce-list.');
    for (const tier of tiers) { if (!Array.isArray(tier)) fail('Invalid tracker tier.'); for (const item of tier) { trackers.push(text(item, 'Tracker URL')); if (trackers.length > LIMITS.endpoints + 1) fail('Too many trackers.'); } }
  }
  const webSeeds = [];
  for (const key of ['url-list', 'httpseeds']) if (has(root, key)) {
    const value = field(root, key); const list = bytes(value) ? [value] : value;
    if (!Array.isArray(list)) fail('Invalid web-seed list.');
    for (const item of list) webSeeds.push(text(item, 'Web-seed URL'));
  }
  const cleanTrackers = endpoints([...new Set(trackers)]), cleanSeeds = endpoints(webSeeds, ['https:', 'http:']);
  const v1 = isV1 ? hex(await digest('SHA-1', infoBytes)) : '';
  const v2 = isV2 ? hex(await digest('SHA-256', infoBytes)) : '';
  if (expected) {
    expected = expected.trim().toLowerCase();
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(expected) || (expected !== v1 && expected !== v2)) fail('The complete expected infohash does not match this metadata.');
  }
  return { version: isV1 && isV2 ? 'hybrid' : isV2 ? 'v2' : 'v1', name, total, pieceLength, private: privateFlag === 1,
    pieceCount: isV1 ? Math.ceil(oldTotal / pieceLength) : files.reduce((n, file) => n + Math.ceil(file.length / pieceLength), 0),
    files: files.map(({ path, length, padding }) => ({ path, length, padding })), trackers: cleanTrackers, webSeeds: cleanSeeds,
    v1, v2, expectedMatched: Boolean(expected), magnet: privateFlag === 1 ? null : minimalMagnet(v1, v2, name),
    warning: 'Metadata checks do not verify payload bytes, publisher identity, signatures, licenses, malware status or current seed availability. SHA-1 is used only for legacy BitTorrent compatibility, not authentication.' };
}
/** Create a deterministic v1 torrent. Reads in piece-sized slices, including pieces spanning file boundaries. */
export async function createTorrent(inputFiles, options = {}, onProgress = () => {}) {
  if (!Array.isArray(inputFiles) || !inputFiles.length || inputFiles.length > LIMITS.createFiles) fail('Choose 1–256 files to create a torrent.');
  const files = inputFiles.map((file) => {
    if (!file || typeof file.slice !== 'function') fail('Expected local File/Blob inputs.');
    return { blob: file, path: [safeComponent(file.name)], length: integer(file.size, 'Source file size') };
  }).sort((a, b) => compare(encoder.encode(a.path[0]), encoder.encode(b.path[0])));
  const total = paths(files); if (total > LIMITS.createBytes) fail('Creation is limited to 256 MiB of selected source files.');
  const name = safeComponent(options.name || (files.length === 1 ? files[0].path[0] : 'shared-files'));
  const pieceLength = integer(options.pieceLength ?? 262_144, 'Creation piece length', 16_384, 4 * 1024 * 1024);
  if (!Number.isInteger(Math.log2(pieceLength))) fail('Creation piece length must be a power of two.');
  const trackers = endpoints(options.trackers ?? []);
  if (options.private === true && !trackers.length) fail('Private torrents require an explicit tracker.');
  const piece = new Uint8Array(pieceLength), hashes = []; let filled = 0, processed = 0;
  for (const file of files) {
    for (let offset = 0; offset < file.length;) {
      const size = Math.min(pieceLength - filled, file.length - offset);
      const chunk = new Uint8Array(await file.blob.slice(offset, offset + size).arrayBuffer());
      if (chunk.length !== size) fail('Source file changed or could not be read completely.');
      piece.set(chunk, filled); filled += size; offset += size; processed += size;
      if (filled === pieceLength) { hashes.push(await digest('SHA-1', piece)); filled = 0; }
      onProgress({ processed, total });
    }
  }
  if (filled) hashes.push(await digest('SHA-1', piece.subarray(0, filled)));
  const info = new Map([['name', name], ['piece length', pieceLength], ['pieces', join(hashes)]]);
  if (files.length === 1) info.set('length', total);
  else info.set('files', files.map((file) => new Map([['length', file.length], ['path', file.path]])));
  if (options.private === true) info.set('private', 1);
  const root = new Map([['created by', 'Torrent Atlas 1'], ['info', info]]);
  if (trackers.length) { root.set('announce', trackers[0]); root.set('announce-list', trackers.map((url) => [url])); }
  const output = bencode(root);
  if (output.length > LIMITS.metadataBytes) fail('Created metainfo exceeds the metadata bound.');
  const summary = await inspectTorrent(output);
  return { bytes: output, summary, filename: `${name}.torrent` };
}
