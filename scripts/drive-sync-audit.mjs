#!/usr/bin/env node
// Re-check the repository half of the Google Drive backup ledger.
//
// The ledger (docs/drive-inventory-2026-10-04.json) records, for every artifact
// and commit named anywhere in the Drive backup area, what this repository is
// expected to contain. This script enforces that, so the ledger cannot quietly
// rot as main moves on:
//
//   commits   each SHA named in a Drive note must be on main, or absent
//   artifacts each Drive artifact mapped to a repo path must still be there,
//             and must still hash to the value Drive recorded
//   orphans   content that exists ONLY in Drive must still be missing here —
//             when someone restores it, this flips to RESTORED and the ledger
//             needs updating
//
// It talks to git only. Drive is unreachable from the development sandbox
// (egress is allowlisted to GitHub/PyPI/npm), which is the whole reason the
// ledger exists as a committed file instead of a live query.
//
//   node scripts/drive-sync-audit.mjs            human-readable table
//   node scripts/drive-sync-audit.mjs --json     machine-readable
//
// Exit code 0 = ledger still accurate, 1 = something drifted.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = join(ROOT, 'docs', 'drive-inventory-2026-10-04.json');
const asJson = process.argv.includes('--json');

const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
const results = [];
const record = (section, name, ok, detail) => results.push({ section, name, ok, detail });

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

// `main` locally, else origin/main — a fresh clone may only have the remote ref.
const mainRef = ['main', 'origin/main'].find((r) => git(['rev-parse', '--verify', `${r}^{commit}`])) ?? null;

// --- commits -----------------------------------------------------------------
// A shallow clone cannot answer "is this commit absent" — it has almost nothing.
// Say so rather than reporting false orphans.
const shallow = existsSync(join(ROOT, '.git', 'shallow'));

for (const { sha, expect, note } of ledger.commits ?? []) {
  const present = git(['cat-file', '-e', `${sha}^{commit}`]) !== null;
  let actual;
  if (!present) actual = 'absent';
  else if (mainRef && git(['merge-base', '--is-ancestor', sha, mainRef]) !== null) actual = 'on-main';
  else actual = 'present-off-main';

  if (shallow && actual === 'absent') {
    record('commit', sha, null, `cannot judge in a shallow clone — run: git fetch --unshallow (${note})`);
  } else {
    record('commit', sha, actual === expect, `expected ${expect}, found ${actual}`);
  }
}

// --- artifacts ---------------------------------------------------------------
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

for (const art of ledger.artifacts ?? []) {
  const rel = art.repo_path;
  if (!rel) continue;
  const abs = join(ROOT, rel);
  const label = `${rel} ← ${art.drive_name}`;

  if (!existsSync(abs)) {
    record('artifact', label, false, 'missing from the working tree');
    continue;
  }
  if (art.expected_sha256) {
    const got = sha256(abs);
    record('artifact', label, got === art.expected_sha256,
      got === art.expected_sha256
        ? `sha256 matches the value Drive recorded (${got.slice(0, 12)}…)`
        : `sha256 drifted: Drive ${art.expected_sha256.slice(0, 12)}… vs repo ${got.slice(0, 12)}…`);
    continue;
  }
  // No recorded hash: the ledger only claims presence, plus a size note for drift.
  const detail = art.status === 'drift'
    ? `present; known drift — Drive ${art.size} B vs repo ${art.repo_size ?? '?'} B`
    : `present (${art.status})`;
  record('artifact', label, true, detail);
}

// --- orphans -----------------------------------------------------------------
const globMatches = (pattern) => {
  const dir = dirname(pattern);
  const base = pattern.slice(dir.length + 1);
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const rx = new RegExp(`^${base.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
  return readdirSync(abs).filter((f) => rx.test(f)).map((f) => join(dir, f));
};

for (const orphan of ledger.orphans ?? []) {
  const found = [
    ...(orphan.paths ?? []).filter((p) => existsSync(join(ROOT, p))),
    ...(orphan.glob_paths ?? []).flatMap(globMatches),
  ];
  const tracked = (orphan.paths ?? []).length + (orphan.glob_paths ?? []).length;
  if (tracked === 0) {
    record('orphan', orphan.name, true, 'narrative finding, no paths to check');
  } else if (found.length === 0) {
    record('orphan', orphan.name, true, `still Drive-only (${orphan.file_count ?? tracked} files)`);
  } else {
    record('orphan', orphan.name, false,
      `RESTORED into the repo (${found.join(', ')}) — update ${LEDGER.replace(ROOT + '/', '')}`);
  }
}

// --- report ------------------------------------------------------------------
const failed = results.filter((r) => r.ok === false);
const skipped = results.filter((r) => r.ok === null);

if (asJson) {
  console.log(JSON.stringify({
    audited: ledger.audited,
    main_head: mainRef ? git(['rev-parse', mainRef]) : null,
    ok: failed.length === 0,
    failed: failed.length,
    skipped: skipped.length,
    results,
  }, null, 2));
} else {
  console.log(`Drive ↔ repository ledger — audited ${ledger.audited}, re-checked against ${mainRef ?? 'no main ref'}\n`);
  let section = null;
  for (const r of results) {
    if (r.section !== section) {
      section = r.section;
      console.log(`${section.toUpperCase()}S`);
    }
    const mark = r.ok === null ? '·' : r.ok ? '✓' : '✗';
    console.log(`  ${mark} ${r.name.padEnd(52)} ${r.detail}`);
  }
  console.log();
  console.log(failed.length === 0
    ? `Ledger still accurate: ${results.length - skipped.length} checks passed${skipped.length ? `, ${skipped.length} skipped` : ''}.`
    : `${failed.length} of ${results.length} checks drifted — the ledger needs updating.`);
}

process.exit(failed.length === 0 ? 0 : 1);
