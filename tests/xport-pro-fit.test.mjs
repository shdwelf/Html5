/*
 * xport-pro-fit.test.mjs -- the arithmetic behind "Synchronet won't fit".
 *
 * The claim is easy to make and easy to be wrong about, so these tests pin the
 * numbers down rather than restating the conclusion. The one that matters most
 * is the last-but-three: strip Synchronet of every optional byte and it still
 * has to fail to fit at BOTH ends of the binary-size range, because that range
 * is the only quantity in the model that was not measured.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import {
  XPORT_PRO, SYNCHRONET, WIKI_IN_A_JAR,
  writableBudget, flashMapCheck, synchronetFit, wikiFit, whatWouldFit, check,
} from '../tools/xport-pro-fit-model.mjs';

const MiB = 1024 * 1024;

/* ------------------------------------------------------------------- device */

test('the published flash map is consistent with the chip it is on', () => {
  const m = flashMapCheck();
  assert.equal(m.fits, true, 'the partition map overflows the flash');
  assert.equal(m.chipBytes, 16 * MiB);
  // Two kernel banks, not one: dual-bank upgrade with a safe bank is what eats
  // the space, and it is the first thing anyone proposing an install misses.
  assert.equal(XPORT_PRO.flashMap.kernelBanks, 2);
  assert.ok(m.remainderBytes > 0, 'a map that exactly fills the chip is a red flag');
});

test('writable space is the JFFS2 partition and nothing else', () => {
  // ROMFS is read-only and already carries the vendor userland, so it is not
  // budget an application can spend.
  assert.equal(writableBudget(), XPORT_PRO.flashMap.mtd5Jffs2Bytes);
  assert.equal(writableBudget(), 4 * MiB);
  assert.equal(XPORT_PRO.mmu, false);
});

/* ---------------------------------------------------------------- measured */

test('the measured Synchronet numbers are internally consistent', () => {
  // ctrl/ total must exceed its .tdf component, or one of the two is a typo.
  assert.ok(SYNCHRONET.ctrlTdfBytes < SYNCHRONET.ctrlBytes);
  assert.ok(SYNCHRONET.ctrlTdfFiles < SYNCHRONET.ctrlFiles);
  // The .tdf files are the overwhelming majority of ctrl/, which is the point:
  // they are area and file lists, and they are what makes this hopeless.
  assert.ok(SYNCHRONET.ctrlTdfBytes / SYNCHRONET.ctrlBytes > 0.9,
    'expected .tdf to dominate ctrl/');
  assert.equal(SYNCHRONET.binaryCount, 23,
    'docs/synchronet-build-and-uclinux-notes.md records 23 binaries from make -C src/sbbs3');
  assert.ok(SYNCHRONET.coreSourceLines > 400000);
});

test('the jar size matches what the deep-dive recorded from the bytes', () => {
  assert.equal(WIKI_IN_A_JAR.xraysJarBytes, 26107,
    'docs/lantronix-uclinux-deep-dive-2026-10-08.md 5.3 measured lib/xrays.jar at 26,107');
});

test('the fit model agrees with itself', () => {
  const { ok, fails } = check();
  assert.equal(ok, true, `fit assertions failed: ${fails.join('; ')}`);
});

/* ---------------------------------------------------------------- the claim */

test('the .tdf files alone are larger than the entire flash chip', () => {
  const s = synchronetFit();
  // No assumption about binary size, toolchain, or stripping. Measured bytes
  // against a published chip size.
  assert.equal(s.tdfAlone.exceedsWholeFlash, true);
  assert.ok(s.tdfAlone.vsWholeFlash > 1.0);
  assert.equal(s.tdfAlone.exceedsWritable, true);
});

test('as-shipped Synchronet does not fit the writable partition', () => {
  const s = synchronetFit();
  assert.equal(s.full[0].fits, false);
  assert.ok(s.full[0].percentOfBudget > 500, 'expected it to miss by a wide margin');
});

test('stripped to the floor, Synchronet still does not fit at either end', () => {
  const s = synchronetFit();
  // This is the load-bearing test. The binary size is the only unmeasured
  // quantity, so it is carried as a range and the conclusion must hold at both
  // ends. If it only failed at the pessimistic end, the honest answer would be
  // "it might fit", and that is not what the model claims.
  assert.equal(s.noTdf.length, 2, 'expected one case per end of the binary range');
  for (const r of s.noTdf) {
    assert.equal(r.fits, false,
      `${r.label} unexpectedly fit with ${r.binariesBytes} of binaries`);
    assert.ok(r.percentOfBudget > 100);
  }
  assert.notEqual(s.noTdf[0].binariesBytes, s.noTdf[1].binariesBytes,
    'the two cases must actually span the range');
});

test('the process model rules it out even if the bytes fit', () => {
  const s = synchronetFit();
  assert.equal(s.architecture.runsOnThisKernel, false);
  assert.equal(XPORT_PRO.mmu, false);
  // Counted with grep, not remembered.
  assert.ok(SYNCHRONET.forkCallSites > 0);
  assert.ok(SYNCHRONET.popenCallSites > 0);
  assert.match(s.architecture.reason, /vfork/);
});

test('the jar fits in flash and still cannot run', () => {
  const w = wikiFit();
  // Size was never the problem with this one, and the report should not imply
  // that it was.
  assert.equal(w.fitsInFlash, true);
  assert.ok(w.timesItWouldFit > 10);
  assert.equal(w.canRun, false);
  assert.equal(w.requiresJvm, true);
  assert.equal(w.jvmAvailableForTarget, false);
});

test('what the device would accept leaves real headroom', () => {
  const f = whatWouldFit();
  assert.ok(f.realisticCeilingBytes < f.budgetBytes);
  assert.ok(f.headroomBytes > 0);
  // The constraint that is easiest to forget, and the one that killed this idea.
  assert.ok(f.constraints.some((c) => /no fork, only vfork/.test(c)));
});

/* ------------------------------------------------------- re-measure, if able */

test('the measured bytes still match the upstream tree', { skip: !existsSync('.cache/fit/sbbs/ctrl') && 'run: git clone --depth 1 https://github.com/SynchronetBBS/sbbs.git .cache/fit/sbbs' }, () => {
  // Optional, and skipped unless the clone is present, because .cache is
  // gitignored. When it does run it re-derives ctrl/ from the tree and compares
  // against the constant baked into the model, which is the only thing standing
  // between these numbers and a transcription error.
  const out = execFileSync('bash', ['-c',
    'find .cache/fit/sbbs/ctrl -type f -exec stat -c %s {} + | awk \'{s+=$1} END {print s+0}\''],
    { encoding: 'utf8' }).trim();
  assert.equal(Number(out), SYNCHRONET.ctrlBytes,
    `ctrl/ measured ${out} bytes, model says ${SYNCHRONET.ctrlBytes}`);
});
