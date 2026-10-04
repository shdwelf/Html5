#!/usr/bin/env node
// drive-sync-apply.mjs — copy the delta a Drive snapshot is missing here.
//
// The "update" half of the rsync: drive-rsync-diff.mjs says what is only on
// Drive, this moves exactly those files out of an unpacked snapshot and into
// the working tree, verifying each one against the manifest hash as it lands.
//
//   node scripts/drive-sync-apply.mjs --manifest <m.sha256> --snapshot <dir> [options]
//
//     --snapshot DIR   unpacked snapshot root (the dir holding chipwright.html …)
//     --max-bytes N    skip anything larger (default 8 MiB — this repo already
//                      carries multi-MB .xdc files, but a restore should never
//                      silently drag in a 96 MB tarball's worth of payload)
//     --only GLOB      restrict to paths matching GLOB (repeatable)
//     --dry-run        report only, write nothing (default)
//     --write          actually copy
//
// Nothing is overwritten: a path that already exists here is left alone and
// reported. Restoring lost content must never clobber current work.
//
// Every copied file is re-hashed after writing and compared to the manifest.
// A mismatch deletes what was written and fails the run, because a half-correct
// restore of content that exists nowhere else is worse than no restore.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const all = (n) => argv.reduce((a, v, i) => (v === n && argv[i + 1] ? [...a, argv[i + 1]] : a), []);
const flag = (n) => argv.includes(n);

const manifestPath = opt('--manifest');
const snapshot = opt('--snapshot');
const write = flag('--write');
const maxBytes = Number(opt('--max-bytes', String(8 * 1024 * 1024)));
const only = all('--only');

if (!manifestPath || !snapshot) {
  console.error('usage: node scripts/drive-sync-apply.mjs --manifest <m.sha256> --snapshot <dir>'
    + ' [--only GLOB] [--max-bytes N] [--write]');
  process.exit(2);
}
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const SNAP = resolve(snapshot);

// Same manifest reader as drive-rsync-diff.mjs, including quoted-path handling:
// a name this cannot decode is content that silently never gets restored.
function unquotePath(raw, gnuEscaped) {
  if (gnuEscaped) return raw.replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
  if (!(raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2)) return raw;
  const body = raw.slice(1, -1);
  const bytes = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i] !== '\\') { bytes.push(...Buffer.from(body[i], 'utf8')); continue; }
    const c = body[++i];
    const simple = { n: 10, t: 9, r: 13, b: 8, f: 12, v: 11, a: 7, '\\': 92, '"': 34 };
    if (c in simple) { bytes.push(simple[c]); continue; }
    if (c >= '0' && c <= '7') { bytes.push(parseInt(body.slice(i, i + 3), 8) & 0xff); i += 2; continue; }
    bytes.push(...Buffer.from(c, 'utf8'));
  }
  return Buffer.from(bytes).toString('utf8');
}

const entries = new Map();
for (const raw of readFileSync(manifestPath, 'utf8').split('\n')) {
  let line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const gnu = line.startsWith('\\');
  if (gnu) line = line.slice(1);
  const m = /^([0-9a-fA-F]{64})\s+[*]?(.+)$/.exec(line);
  if (m) entries.set(unquotePath(m[2], gnu).replace(/^\.\//, ''), m[1].toLowerCase());
}

// Strip a single common wrapper directory, as the tarballs have one.
const heads = new Set([...entries.keys()].map((p) => p.split('/')[0]));
const strip = heads.size === 1 && [...entries.keys()].every((p) => p.includes('/')) ? 1 : 0;

const matches = (p) => !only.length || only.some((g) => {
  const rx = new RegExp('^' + g.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
  return rx.test(p);
});

const planned = [], skipped = [], absent = [];
for (const [rawPath, hash] of entries) {
  const path = rawPath.split('/').slice(strip).join('/') || rawPath;
  if (!matches(path)) continue;
  if (existsSync(join(ROOT, path))) continue;              // already here — never clobber
  const src = join(SNAP, path);
  if (!existsSync(src)) { absent.push({ path, why: 'not in the unpacked snapshot' }); continue; }
  const size = statSync(src).size;
  if (size > maxBytes) { skipped.push({ path, size, why: `larger than --max-bytes ${maxBytes}` }); continue; }
  planned.push({ path, hash, src, size });
}

console.log(`drive-sync-apply — ${write ? 'WRITING' : 'dry run'}`);
console.log(`  manifest   ${manifestPath}`);
console.log(`  snapshot   ${SNAP}`);
console.log(`  candidates ${planned.length} to restore, ${skipped.length} skipped, ${absent.length} unavailable\n`);

let restored = 0, failed = 0;
for (const p of planned) {
  if (!write) { console.log(`  would restore  ${String(p.size).padStart(9)}  ${p.path}`); continue; }
  const dest = join(ROOT, p.path);
  mkdirSync(dirname(dest), { recursive: true });
  const bytes = readFileSync(p.src);
  writeFileSync(dest, bytes);
  const got = createHash('sha256').update(readFileSync(dest)).digest('hex');
  if (got !== p.hash) {
    unlinkSync(dest);
    console.log(`  ✗ HASH MISMATCH  ${p.path}  (manifest ${p.hash.slice(0, 12)}… got ${got.slice(0, 12)}…) — removed`);
    failed++;
    continue;
  }
  console.log(`  ✓ restored       ${String(p.size).padStart(9)}  ${p.path}  ${got.slice(0, 12)}…`);
  restored++;
}
for (const s of skipped) console.log(`  · skipped        ${String(s.size).padStart(9)}  ${s.path}  (${s.why})`);
for (const a of absent) console.log(`  · unavailable              ${a.path}  (${a.why})`);

if (write) console.log(`\n${restored} restored, ${failed} failed verification, ${skipped.length} skipped.`);
else console.log(`\nDry run. Re-run with --write to copy ${planned.length} file(s).`);

process.exit(failed ? 1 : 0);
