import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ln = path.join(repoRoot, 'tools', 'urln', 'ln');

function run(args, cwd) {
  return spawnSync(process.execPath, [ln, ...args], { cwd, encoding: 'utf8' });
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'urln-test-'));
}

test('urln/ln creates an ordinary local symlink', () => {
  const dir = tmpdir();
  const source = path.join(dir, 'source.txt');
  const link = path.join(dir, 'link.txt');
  fs.writeFileSync(source, 'local\n');

  const res = run(['-s', source, link], dir);
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.readlinkSync(link), source);
  assert.equal(fs.readFileSync(link, 'utf8'), 'local\n');
});

test('urln/ln downloads a URL target once, then links to the local file', () => {
  const dir = tmpdir();
  const cache = path.join(dir, 'cache');
  const source = path.join(dir, 'payload.txt');
  const link = path.join(dir, 'payload-link.txt');
  fs.writeFileSync(source, 'downloaded payload\n');

  const url = pathToFileURL(source).href;
  const res = run(['--cache-dir', cache, '-s', url, link], dir);
  assert.equal(res.status, 0, res.stderr);

  assert.ok(fs.lstatSync(link).isSymbolicLink());
  const target = fs.readlinkSync(link);
  assert.ok(target.startsWith(cache), `expected link into cache, got ${target}`);
  assert.equal(fs.readFileSync(link, 'utf8'), 'downloaded payload\n');
  assert.equal(fs.readFileSync(target, 'utf8'), 'downloaded payload\n');
});

test('urln/ln refuses to hard-link a URL target', () => {
  const dir = tmpdir();
  const source = path.join(dir, 'payload.txt');
  fs.writeFileSync(source, 'x\n');

  const res = run([pathToFileURL(source).href, path.join(dir, 'hard')], dir);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /URL targets require -s/);
});
