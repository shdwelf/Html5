import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const FW = join(ROOT, 'firmware', 'xport-v92');

/**
 * The bridge firmware is C, so this test drives its own build rather than
 * reimplementing anything: it compiles src/*.c plus test/run_tests.c with
 * -Wall -Wextra -Werror and runs the resulting binary.
 */
function make(target) {
  return execFileSync('make', ['-C', FW, target], { encoding: 'utf8' });
}

test('the protocol core compiles clean and its tests pass', () => {
  make('clean');
  const out = make('test');

  // The summary line is the contract; assert on it, not on the absence of output.
  const m = out.match(/(\d+) checks, (\d+) failure\(s\)/);
  assert.ok(m, `no test summary in output:\n${out}`);

  const [, checks, failures] = m;
  assert.equal(failures, '0', `firmware tests reported failures:\n${out}`);
  assert.ok(Number(checks) >= 800, `expected a substantial check count, got ${checks}`);

  for (const suite of ['fcs', 'dle', 'at', 'fax1 frames', 'fax1 receive', 'xport'])
    assert.ok(out.includes(suite), `missing suite '${suite}' in output:\n${out}`);
});

test('the hardware-dependent layer type-checks too', () => {
  const out = make('compile-check');
  assert.ok(out.includes('bridge.c type-checks'), out);
});

test('the FCS is checked against an independent reference, not itself', () => {
  // 0x906E is the published CRC-16/X-25 check value for "123456789"; if this
  // string ever stops appearing in the test source, the cross-check is gone.
  const src = execFileSync('cat', [join(FW, 'test', 'run_tests.c')], { encoding: 'utf8' });
  assert.ok(src.includes('0x906E'), 'CRC-16/X-25 reference check value missing');
  assert.ok(src.includes('0xF0B8') || src.includes('FCS_GOOD_RESIDUE'),
    'good-residue cross-check missing');
});
