#!/usr/bin/env node
/*
 * xport-pro-fit-model.mjs -- will Synchronet fit on a Lantronix xPort Pro?
 *
 * The question came up as "try putting Synchronet on the xPort Pro with
 * wiki.in.a.jar, it won't fit". It does not fit, and this file shows the
 * arithmetic rather than asserting the conclusion.
 *
 * Every number here is either measured or sourced, and says which. The measured
 * ones came from a shallow clone on 2026-10-18:
 *
 *   git clone --depth 1 https://github.com/SynchronetBBS/sbbs.git
 *   find sbbs/ctrl -type f -exec stat -c %s {} + | awk '{s+=$1} END {print s}'
 *
 * and the flash map from Lantronix's Linux SDK user guide 900-548 as recorded in
 * docs/lantronix-uclinux-deep-dive-2026-10-08.md. Nothing below is an estimate
 * dressed as a measurement; the one quantity that could not be measured here --
 * the size of a ColdFire sbbs binary -- is carried as an explicit range, and the
 * conclusion is shown to hold at both ends of it.
 *
 * Run:  node tools/xport-pro-fit-model.mjs --check
 */

const MiB = 1024 * 1024;
const KiB = 1024;

/* -------------------------------------------------------------------- device */

/**
 * Lantronix xPort Pro, Linux part numbers (XPP1003000-04R and friends).
 *
 * DSTni-FX: Freescale ColdFire, 166 MHz. 16 MB parallel flash is standard on
 * every xPort Pro; SDRAM is 8 or 16 MB by part number. Kernel 2.6.30, uClibc,
 * ROMFS root filesystem with an optional JFFS2 writable partition.
 *
 * The flash map is dual-bank with a safe bank, so an in-field upgrade has
 * somewhere to fail into. That is what leaves so little of the 16 MB for
 * applications: two kernel images, not one.
 */
export const XPORT_PRO = {
  name: 'Lantronix xPort Pro (uClinux)',
  cpu: 'DSTni-FX ColdFire, 166 MHz',
  mmu: false,                 // uClinux on this part is MMU-less by definition
  sdramMiB: [8, 16],          // by part number
  flashBytes: 16 * MiB,
  rootfs: 'ROMFS (read-only, XIP) + optional JFFS2 writable',
  kernel: 'Linux 2.6.30, uClibc',
  /** Lantronix SDK user guide 900-548 section 5, and dbug-config output. */
  flashMap: {
    bootloaderBytes: 0x40000,          // dBUG, 128-byte image header
    kernelBankBytes: 0x180000,         // 1.5 MiB, and there are two of them
    kernelBanks: 2,                    // active bank + safe bank
    mtd4RomfsBytes: Math.round(3.5 * MiB),   // read-only root, already occupied
    mtd5Jffs2Bytes: 4 * MiB,                 // the only writable space there is
  },
  /** What is already in ROMFS and cannot be displaced: the vendor userland. */
  romfsOccupants: [
    'BusyBox 1.13.3', 'boa 0.94.14rc21 + axTLS 1.2.4', 'dropbear 0.52',
    'openssl 0.9.8k', 'mDNSResponder-214.3 / avahi 0.6.25', 'tcpdump 3.9.8',
    's2e / s2e-ssh / s2e-ssl / s2e-gpio / cpm / dbug-config',
  ],
};

/** Writable bytes actually available to a third-party application. */
export function writableBudget(dev = XPORT_PRO) {
  // ROMFS is read-only and already holds the vendor userland, so an installed
  // application has the JFFS2 partition and nothing else.
  return dev.flashMap.mtd5Jffs2Bytes;
}

/** Does the published partition map even add up to the chip size? */
export function flashMapCheck(dev = XPORT_PRO) {
  const m = dev.flashMap;
  const used = m.bootloaderBytes + m.kernelBankBytes * m.kernelBanks
    + m.mtd4RomfsBytes + m.mtd5Jffs2Bytes;
  return {
    usedBytes: used,
    chipBytes: dev.flashBytes,
    remainderBytes: dev.flashBytes - used,
    fits: used <= dev.flashBytes,
  };
}

/* ---------------------------------------------------------------- synchronet */

/**
 * Measured from SynchronetBBS/sbbs at depth 1 on 2026-10-18.
 *
 * `ctrl` is the runtime directory: configuration, text, and the .tdf area and
 * file lists. It is not build output and it is not optional in any meaningful
 * sense -- a Synchronet installation without ctrl/ has no node configuration,
 * no message bases and no text.
 */
export const SYNCHRONET = {
  source: 'github.com/SynchronetBBS/sbbs (depth 1, 2026-10-18)',
  ctrlBytes: 23486515,          // find sbbs/ctrl -type f -exec stat -c %s {} +
  ctrlFiles: 1350,
  ctrlTdfBytes: 21506614,       // the 1196 .tdf files alone
  ctrlTdfFiles: 1196,
  textBytes: 225420,
  webBytes: 2942143,
  webv4Bytes: 1594210,
  /** Core compile set: what `make -C sbbs/src/sbbs3` pulls in, minus the
   *  bundled third-party doors in src/doors (2.39 M lines) which are optional. */
  coreSourceLines: 472398,
  coreSourceModules: ['sbbs3', 'xpdev', 'conio', 'smblib', 'encode', 'xptls',
                      'syncdraw', 'uifc', 'crt'],
  /** Measured earlier in this repository: `make -C sbbs/src/sbbs3 -j4` exits 0
   *  and produces 23 binaries. See docs/synchronet-build-and-uclinux-notes.md. */
  binaryCount: 23,
  /** NOT measured here -- no ColdFire toolchain in this sandbox. Carried as a
   *  range and the conclusion is tested at both ends. A C++ binary of this size
   *  class, stripped, is very unlikely to be under 100 KB. */
  binaryBytesRange: [100 * KiB, 1 * MiB],
  /** Process-model facts, counted with grep over src/sbbs3 and src/xpdev. */
  forkCallSites: 7,
  popenCallSites: 9,
  execvCallSites: 1,
  needsThreads: true,
  needsJavaScriptEngine: true,   // the JS scripting engine sbbs embeds
};

/* ------------------------------------------------------------ wiki.in.a.jar */

/**
 * "Wiki in a Jar", SourceForge wiki-in-a-jar / mirror astecenko/Wiki-in-a-Jar.
 * One jar, its own HTTP server (a NanoHTTPD derivative relocated into
 * net.sf.wikiinajar.xrays), default port 3003, no container, no database.
 */
export const WIKI_IN_A_JAR = {
  source: 'github.com/astecenko/Wiki-in-a-Jar (depth 1, 2026-10-18)',
  xraysJarBytes: 26107,          // measured; matches docs/lantronix-uclinux-deep-dive
  releaseZipBytes: 126362,       // 123.4 kB, WikiInAJar-0.8-20081128-bin.zip
  language: 'Java',
  /** The thing that decides this one. Not a size question. */
  requiresJvm: true,
};

/* ----------------------------------------------------------------- verdicts */

const bytes = (n) => {
  if (n >= MiB) return `${(n / MiB).toFixed(2)} MiB`;
  if (n >= KiB) return `${(n / KiB).toFixed(1)} KiB`;
  return `${n} B`;
};

/**
 * Synchronet at three levels of stripping, against the writable budget.
 *
 * Level 3 is the honest floor: no doors, no web content, no .tdf area lists --
 * just the configuration and text a BBS needs to answer a call, plus the
 * binaries. If that does not fit, nothing does.
 */
export function synchronetFit(dev = XPORT_PRO, sbbs = SYNCHRONET) {
  const budget = writableBudget(dev);
  const dataNoTdf = sbbs.ctrlBytes - sbbs.ctrlTdfBytes + sbbs.textBytes;

  const level = (label, dataBytes, perBinary) => {
    const binaries = sbbs.binaryCount * perBinary;
    const total = dataBytes + binaries;
    return {
      label, dataBytes, binariesBytes: binaries, totalBytes: total,
      budgetBytes: budget,
      fits: total <= budget,
      overByBytes: Math.max(0, total - budget),
      percentOfBudget: (total / budget) * 100,
    };
  };

  const [lo, hi] = sbbs.binaryBytesRange;
  return {
    full: [
      level('as shipped: ctrl + text + web + webv4',
        sbbs.ctrlBytes + sbbs.textBytes + sbbs.webBytes + sbbs.webv4Bytes, lo),
    ],
    noTdf: [
      level('ctrl minus .tdf, plus text', dataNoTdf, lo),
      level('ctrl minus .tdf, plus text', dataNoTdf, hi),
    ],
    /** The one number that needs no assumption about binary size at all. */
    tdfAlone: {
      bytes: sbbs.ctrlTdfBytes,
      vsWholeFlash: sbbs.ctrlTdfBytes / dev.flashBytes,
      exceedsWholeFlash: sbbs.ctrlTdfBytes > dev.flashBytes,
      exceedsWritable: sbbs.ctrlTdfBytes > budget,
    },
    /** The blocker that has nothing to do with bytes. */
    architecture: {
      mmu: dev.mmu,
      forkSites: sbbs.forkCallSites,
      popenSites: sbbs.popenCallSites,
      execvSites: sbbs.execvCallSites,
      needsJavaScriptEngine: sbbs.needsJavaScriptEngine,
      runsOnThisKernel: false,
      reason: dev.mmu
        ? 'MMU present'
        : 'uClinux on an MMU-less ColdFire has no fork, only vfork, and no '
          + 'virtual memory for an embedded JS engine. Synchronet forks in '
          + `${sbbs.forkCallSites} places and pipes through popen in `
          + `${sbbs.popenCallSites}; a program that forks and then does work `
          + 'before exec does not survive that.',
    },
  };
}

/**
 * The jar is 26 KB. It fits in flash about 640 times over. It still cannot run:
 * a Java web application needs a JVM, and the only Java virtual machine this
 * device family is ever discussed with is the Java Card VM, which is a different
 * machine -- no threads, no dynamic class loading, no java.io, no sockets.
 * docs/lantronix-uclinux-deep-dive-2026-10-08.md section 5.2 is the long form.
 */
export function wikiFit(dev = XPORT_PRO, w = WIKI_IN_A_JAR) {
  const budget = writableBudget(dev);
  return {
    bytes: w.xraysJarBytes,
    releaseBytes: w.releaseZipBytes,
    budgetBytes: budget,
    fitsInFlash: w.releaseZipBytes <= budget,
    timesItWouldFit: Math.floor(budget / w.releaseZipBytes),
    requiresJvm: w.requiresJvm,
    jvmAvailableForTarget: false,
    canRun: false,
    reason: 'Fits in flash trivially and cannot execute: no JVM exists for '
      + 'ColdFire uClinux, and the Java Card VM is not one.',
  };
}

/** What the space and the kernel would actually accept. */
export function whatWouldFit(dev = XPORT_PRO) {
  const budget = writableBudget(dev);
  return {
    budgetBytes: budget,
    constraints: [
      'single process -- no fork, only vfork',
      'no scripting engine -- no VM heap to give one',
      'C against uClibc, static or against the vendor runtime',
      'telnet or raw TCP in, serial out; the device is already a serial bridge',
    ],
    /** A few hundred kilobytes is the honest figure for that shape, and it is
     *  the same conclusion docs/synchronet-build-and-uclinux-notes.md reached
     *  from the other direction. */
    realisticCeilingBytes: 512 * KiB,
    headroomBytes: budget - 512 * KiB,
  };
}

/* -------------------------------------------------------------------- report */

export function report() {
  const map = flashMapCheck();
  const s = synchronetFit();
  const w = wikiFit();
  const fit = whatWouldFit();
  const L = [];
  L.push(`xPort Pro fit analysis`);
  L.push(`device      ${XPORT_PRO.name} — ${XPORT_PRO.cpu}, MMU: ${XPORT_PRO.mmu}`);
  L.push(`flash       ${bytes(XPORT_PRO.flashBytes)} chip, `
    + `${bytes(writableBudget())} writable (JFFS2 /dev/mtd5)`);
  L.push(`flash map   ${bytes(map.usedBytes)} partitioned of ${bytes(map.chipBytes)}, `
    + `${bytes(map.remainderBytes)} unaccounted (config/padding) — consistent: ${map.fits}`);
  L.push('');
  L.push('Synchronet, measured from SynchronetBBS/sbbs:');
  L.push(`  ctrl/                 ${bytes(SYNCHRONET.ctrlBytes)} across ${SYNCHRONET.ctrlFiles} files`);
  L.push(`    of which .tdf       ${bytes(SYNCHRONET.ctrlTdfBytes)} across ${SYNCHRONET.ctrlTdfFiles} files`);
  L.push(`  text/                 ${bytes(SYNCHRONET.textBytes)}`);
  L.push(`  web/ + webv4/         ${bytes(SYNCHRONET.webBytes + SYNCHRONET.webv4Bytes)}`);
  L.push(`  core source           ${SYNCHRONET.coreSourceLines} lines -> ${SYNCHRONET.binaryCount} binaries`);
  L.push('');
  L.push(`  .tdf files alone      ${bytes(s.tdfAlone.bytes)} = `
    + `${(s.tdfAlone.vsWholeFlash * 100).toFixed(0)}% of the ENTIRE `
    + `${bytes(XPORT_PRO.flashBytes)} chip — exceeds it: ${s.tdfAlone.exceedsWholeFlash}`);
  for (const r of s.full) {
    L.push(`  as shipped            ${bytes(r.totalBytes)} vs ${bytes(r.budgetBytes)} writable `
      + `= ${r.percentOfBudget.toFixed(0)}% — fits: ${r.fits}`);
  }
  for (const r of s.noTdf) {
    L.push(`  stripped floor        ${bytes(r.totalBytes)} (data ${bytes(r.dataBytes)} + `
      + `${SYNCHRONET.binaryCount} x ${bytes(r.binariesBytes / SYNCHRONET.binaryCount)}) `
      + `= ${r.percentOfBudget.toFixed(0)}% — fits: ${r.fits}`);
  }
  L.push('');
  L.push(`  process model         fork x${SYNCHRONET.forkCallSites}, popen x${SYNCHRONET.popenCallSites}, `
    + `execv x${SYNCHRONET.execvCallSites}; JS engine: ${SYNCHRONET.needsJavaScriptEngine}`);
  L.push(`  runs on this kernel   ${s.architecture.runsOnThisKernel} — ${s.architecture.reason}`);
  L.push('');
  L.push('wiki.in.a.jar, measured:');
  L.push(`  xrays.jar             ${bytes(w.bytes)}   release zip ${bytes(w.releaseBytes)}`);
  L.push(`  fits in writable      ${w.fitsInFlash} (would fit ${w.timesItWouldFit} times over)`);
  L.push(`  can run               ${w.canRun} — ${w.reason}`);
  L.push('');
  L.push('What the device would accept:');
  L.push(`  budget ${bytes(fit.budgetBytes)}, realistic ceiling ${bytes(fit.realisticCeilingBytes)}`);
  for (const c of fit.constraints) L.push(`    - ${c}`);
  return L.join('\n');
}

/* --------------------------------------------------------------------- check */

export function check() {
  const fails = [];
  const want = (label, got, expected) => {
    if (got !== expected) fails.push(`${label}: expected ${expected}, got ${got}`);
  };

  const map = flashMapCheck();
  want('published flash map fits the chip', map.fits, true);

  const s = synchronetFit();
  want('.tdf files exceed the whole 16 MB chip', s.tdfAlone.exceedsWholeFlash, true);
  want('as-shipped Synchronet fits the writable partition', s.full[0].fits, false);
  // The floor case is the one that matters: strip every optional byte and the
  // conclusion has to survive both ends of the binary-size range.
  for (const r of s.noTdf) {
    if (r.fits) fails.push(`stripped Synchronet unexpectedly fit at ${r.label}`);
  }
  want('Synchronet runs on an MMU-less uClinux kernel', s.architecture.runsOnThisKernel, false);

  const w = wikiFit();
  want('wiki.in.a.jar fits in flash', w.fitsInFlash, true);
  want('wiki.in.a.jar can run', w.canRun, false);

  return { ok: fails.length === 0, fails };
}

if (process.argv[1] && process.argv[1].endsWith('xport-pro-fit-model.mjs')) {
  console.log(report());
  if (process.argv.includes('--check')) {
    const { ok, fails } = check();
    console.log('');
    if (ok) console.log('OK  all fit assertions hold');
    else { for (const f of fails) console.log(`FAIL  ${f}`); process.exit(1); }
  }
}
