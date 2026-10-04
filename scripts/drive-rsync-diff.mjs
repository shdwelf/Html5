#!/usr/bin/env node
// drive-rsync-diff.mjs — rsync-style, hash-level diff between a Drive snapshot
// and this working tree.
//
// Every Html5 backup on Drive ships a `.sha256` manifest next to its tarball
// (`sha256sum` output: one `<hash>  <path>` line per file). That manifest is a
// complete, authoritative description of the snapshot's contents, and it is
// three orders of magnitude smaller than the tarball — so the comparison can be
// done from the manifest alone, and only the files that actually differ ever
// need their bytes moved. That is precisely rsync's trick, and it is what makes
// this workable when the snapshot is 96 MB and the real delta is 25 files.
//
//   node scripts/drive-rsync-diff.mjs <manifest.sha256> [options]
//
//     --strip N        drop N leading path components (default: auto-detect a
//                      common wrapper dir such as `Html5-12c463f/`)
//     --base DIR       compare against DIR instead of the repo root
//     --tracked-only   ignore working-tree files git does not track, so
//                      build output and caches are not reported as "new"
//     --json           machine-readable
//     --plan           print a restore plan for the only-on-drive set
//
// Exit 0 when the two sides are identical, 1 when they differ — so CI and the
// sync workflow can gate on it.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const manifestPath = argv.find((a) => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--strip'
  && argv[argv.indexOf(a) - 1] !== '--base');
if (!manifestPath) {
  console.error('usage: node scripts/drive-rsync-diff.mjs <manifest.sha256> [--strip N] [--base DIR]'
    + ' [--tracked-only] [--json] [--plan]');
  process.exit(2);
}
const BASE = resolve(opt('--base', ROOT));
const asJson = flag('--json');

// --- read the Drive-side manifest -------------------------------------------
// `sha256sum` writes "<64 hex><space><space|*><path>"; tolerate extra spaces and
// a `./` prefix, and skip blank or comment lines.
//
// Non-ASCII and backslash-bearing names are *quoted*, and getting this wrong is
// not cosmetic — it reports files as lost that are sitting right there. Two
// conventions appear in practice:
//
//   GNU coreutils  line is prefixed with `\`, then \n and \\ are escaped
//   git            path wrapped in "..." with C escapes and octal \NNN bytes
//                  (git ls-tree/ls-files do this unless core.quotePath=false)
//
// This repository has four such files (apps/randomEnsō*.html), so the case is
// live, not theoretical.
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
    if (c >= '0' && c <= '7') {             // octal byte escape, e.g. \305\215
      const oct = body.slice(i, i + 3);
      bytes.push(parseInt(oct, 8) & 0xff);
      i += 2;
      continue;
    }
    bytes.push(...Buffer.from(c, 'utf8'));  // unknown escape: keep it literal
  }
  return Buffer.from(bytes).toString('utf8');
}

const drive = new Map();
let malformed = 0;
let quoted = 0;
for (const raw of readFileSync(manifestPath, 'utf8').split('\n')) {
  let line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const gnuEscaped = line.startsWith('\\');
  if (gnuEscaped) line = line.slice(1);
  const m = /^([0-9a-fA-F]{64})\s+[*]?(.+)$/.exec(line);
  if (!m) { malformed++; continue; }
  const path = unquotePath(m[2], gnuEscaped);
  if (path !== m[2]) quoted++;
  drive.set(path.replace(/^\.\//, ''), m[1].toLowerCase());
}

// Snapshot tarballs usually unpack into a single wrapper directory. Detect it
// rather than making the operator count path components.
let strip = Number(opt('--strip', '-1'));
if (strip < 0) {
  const heads = new Set([...drive.keys()].map((p) => p.split('/')[0]));
  const allHaveDir = [...drive.keys()].every((p) => p.includes('/'));
  strip = heads.size === 1 && allHaveDir ? 1 : 0;
}
const stripped = new Map();
for (const [p, h] of drive) {
  const parts = p.split('/');
  stripped.set(parts.slice(strip).join('/') || p, h);
}

// --- read this side ----------------------------------------------------------
const SKIP = new Set(['.git', 'node_modules', 'dist', '.relay', '.arena-relay', '__pycache__',
  '.cache', '.venv', 'sim']);

let repoFiles;
if (flag('--tracked-only')) {
  repoFiles = execFileSync('git', ['ls-files', '-z'], { cwd: BASE, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0').filter(Boolean);
} else {
  repoFiles = [];
  const walk = (dir) => {
    for (const e of readdirSync(join(BASE, dir) || BASE, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) walk(rel);
      else if (e.isFile()) repoFiles.push(rel);
    }
  };
  walk('');
}

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// --- compare -----------------------------------------------------------------
const identical = [], differing = [], onlyDrive = [], onlyRepo = [];
const repoSet = new Set(repoFiles);

for (const [path, hash] of stripped) {
  const abs = join(BASE, path);
  if (!repoSet.has(path) && !existsSync(abs)) { onlyDrive.push({ path, hash }); continue; }
  let local;
  try { local = sha256(abs); } catch { onlyDrive.push({ path, hash, note: 'unreadable' }); continue; }
  (local === hash ? identical : differing).push({
    path, drive: hash, repo: local,
    bytes: (() => { try { return statSync(abs).size; } catch { return null; } })(),
  });
}
for (const path of repoFiles) if (!stripped.has(path)) onlyRepo.push({ path });

const total = stripped.size;
const inSync = differing.length === 0 && onlyDrive.length === 0;

// --- report ------------------------------------------------------------------
if (asJson) {
  console.log(JSON.stringify({
    manifest: relative(ROOT, resolve(manifestPath)) || manifestPath, quoted_paths: quoted,
    base: BASE, strip, malformed,
    counts: {
      drive_files: total, repo_files: repoFiles.length,
      identical: identical.length, differing: differing.length,
      only_on_drive: onlyDrive.length, only_in_repo: onlyRepo.length,
    },
    in_sync: inSync,
    differing, only_on_drive: onlyDrive, only_in_repo: onlyRepo,
  }, null, 2));
} else {
  const pct = total ? ((identical.length / total) * 100).toFixed(1) : '0.0';
  console.log(`rsync-style diff — Drive snapshot vs ${BASE === ROOT ? 'working tree' : BASE}`);
  console.log(`  manifest       ${manifestPath}${strip ? `  (stripped ${strip} leading component)` : ''}`);
  console.log(`  drive side     ${total} files`);
  console.log(`  this side      ${repoFiles.length} files${flag('--tracked-only') ? ' (git-tracked only)' : ''}`);
  if (malformed) console.log(`  malformed      ${malformed} manifest lines skipped`);
  if (quoted) console.log(`  unquoted       ${quoted} escaped path(s) decoded`);
  console.log();
  console.log(`  = identical        ${String(identical.length).padStart(5)}  (${pct}% of the snapshot)`);
  console.log(`  ~ differing        ${String(differing.length).padStart(5)}`);
  console.log(`  < only on Drive    ${String(onlyDrive.length).padStart(5)}  ← recoverable content`);
  console.log(`  > only in repo     ${String(onlyRepo.length).padStart(5)}  ← added since the snapshot`);

  const show = (title, rows, fmt, limit = 40) => {
    if (!rows.length) return;
    console.log(`\n${title}`);
    for (const r of rows.slice(0, limit)) console.log(`  ${fmt(r)}`);
    if (rows.length > limit) console.log(`  … and ${rows.length - limit} more`);
  };
  show('ONLY ON DRIVE (missing here)', onlyDrive, (r) => `${r.hash.slice(0, 12)}…  ${r.path}${r.note ? `  [${r.note}]` : ''}`);
  show('DIFFERING (same path, different bytes)', differing,
    (r) => `${r.drive.slice(0, 12)}… → ${r.repo.slice(0, 12)}…  ${r.path}`);
  show('ONLY IN REPO (newer than the snapshot)', onlyRepo, (r) => r.path, 25);

  if (flag('--plan') && onlyDrive.length) {
    console.log(`\nRESTORE PLAN — ${onlyDrive.length} files`);
    console.log('  # from an unpacked copy of the snapshot:');
    console.log('  SNAP=restore/<snapshot-dir>');
    for (const r of onlyDrive.slice(0, 60)) {
      console.log(`  install -D "$SNAP/${r.path}" "${r.path}"`);
    }
    if (onlyDrive.length > 60) console.log(`  # … ${onlyDrive.length - 60} more, see --json`);
    console.log('  node scripts/drive-rsync-diff.mjs ' + manifestPath + '   # expect 0 only-on-drive');
  }

  console.log(`\n${inSync
    ? 'In sync: every file in the snapshot is present here with identical bytes.'
    : `Out of sync: ${onlyDrive.length} missing, ${differing.length} changed.`}`);
}

process.exit(inSync ? 0 : 1);
