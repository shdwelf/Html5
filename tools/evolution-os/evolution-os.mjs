#!/usr/bin/env node
/**
 * Evolution OS (Lantronix) — Ghidra disassembly assembly.
 *
 * What this is: the join between five things that already exist in this repo
 * and one thing that does not — an actual Evolution OS firmware image.
 *
 *   exists:  Lantronix Lab triage (which CPU / which Ghidra language),
 *            tools/ghidra_scripts/GenericProgramReport.java (the reporter),
 *            the GitHub-runner Ghidra pattern (pinned release + JDK 21),
 *            tools/urln/ln (stage a URL as a local file, via curl),
 *            the BBS viewer, Wiki in a Jar, and the xPort V.92 fax card.
 *   missing: any Evolution OS .rom/.romz bytes. None are in this repo, and
 *            this sandbox has no JVM, so Ghidra cannot run here. The runner
 *            workflow (.github/workflows/evolution-os-ghidra.yml) runs it.
 *
 * This module therefore does the part that is honestly doable without the
 * binary: it names every Evolution OS target with the exact Ghidra language
 * to load it under, emits the headless command template, and — once the
 * runner has produced GenericProgramReport *.ghidra.json files — assembles
 * them into one Markdown record alongside the BBS / wiki / fax-modem modules
 * the firmware ultimately serves.
 *
 *   node tools/evolution-os/evolution-os.mjs --out docs/evolution-os-ghidra-assembly.md
 *   node tools/evolution-os/evolution-os.mjs --reports docs/ghidra/evolution-os --out <file>
 *   node tools/evolution-os/evolution-os.mjs --json
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Evolution OS targets. CPU and Ghidra language are the facts the Lantronix
 *  Lab device matrix establishes (js/lantronix-lab.js); the trap it warns
 *  about is real: the RJ45-identical xPort classic is 16-bit x86, while the
 *  xPort Pro is ColdFire. Loading one under the other's language produces
 *  confident garbage, so the language is pinned per target here. */
export const EVOLUTION_TARGETS = [
  {
    id: 'xport-pro-evolution',
    name: 'xPort Pro (Evolution OS)',
    part: 'XPP1002000-02R / XPP100200S-02R',
    cpu: 'DSTni-FX — Freescale 32-bit ColdFire',
    os: 'Evolution OS 5.4.0.2R2',
    ghidraLanguage: '68000:BE:32:Coldfire',
    artifacts: 'xport_pro_*.rom / .romz firmware · web content (≤1 MB) · XML configuration records',
    boot: 'read-only Lantronix first stage; RecovLoader_*.rom over serial',
  },
  {
    id: 'matchport-ar-evolution',
    name: 'MatchPort AR (Evolution OS option)',
    part: 'MPB/MPDK1000 — Evolution OS variant',
    cpu: 'DSTni-FX — 32-bit ColdFire, 166 MHz',
    os: 'Evolution OS (dual-OS part; Linux option uses the µClinux SDK instead)',
    ghidraLanguage: '68000:BE:32:Coldfire',
    artifacts: 'matchport_*.rom / .romz firmware',
    boot: 'Lantronix first stage → dBUG (Linux option only)',
  },
  {
    id: 'eds-evolution',
    name: 'EDS1100 / EDS2100 (Evolution OS option)',
    part: 'EDS1100 / EDS2100 Evolution OS variant',
    cpu: 'ColdFire-class (same SDK family as MatchPort AR / xPort Pro)',
    os: 'Evolution OS 7.1.0.0R1',
    ghidraLanguage: '68000:BE:32:Coldfire',
    artifacts: 'eds*.rom / .romz firmware',
    boot: 'Lantronix first stage',
  },
  {
    id: 'xport-classic',
    name: 'xPort (classic)',
    part: 'XP100100-01',
    cpu: 'DSTni-EX "186" — x86-class 16-bit',
    os: 'Evolution OS',
    ghidraLanguage: 'x86:LE:16:Real Mode',
    artifacts: 'xport_*.rom firmware · built-in web pages',
    boot: '16 KB on-chip boot ROM; firmware by TFTP or serial',
  },
  {
    id: 'xpico',
    name: 'xPico',
    part: 'XPC100100B-01',
    cpu: 'DSTni-EX Enhanced 16-bit x86',
    os: 'Evolution OS',
    ghidraLanguage: 'x86:LE:16:Real Mode',
    artifacts: 'xpico_*.rom firmware · 384 KB web-page storage',
    boot: 'boot ROM; TFTP/serial upgrade',
  },
  {
    id: 'xport-485',
    name: 'xPort-485',
    part: 'XP100485-01',
    cpu: 'DSTni-EX "186"',
    os: 'Evolution OS',
    ghidraLanguage: 'x86:LE:16:Real Mode',
    artifacts: 'xport485_*.rom firmware',
    boot: 'boot ROM; TFTP/serial upgrade',
  },
];

/** The modules an Evolution OS disassembly is assembled with. Every path is
 *  a real artefact in this repo; the assembly doc links them rather than
 *  copying them, so the record cannot drift from the code under test. */
export const ASSEMBLY_MODULES = [
  {
    id: 'lantronix-lab',
    name: 'Lantronix Lab — firmware triage (GHIDRA MATCH)',
    path: 'lantronix-lab.html',
    role: 'Names the container, the CPU and the Ghidra language before Ghidra runs; an "Evolution" string means not-Linux, so there is no kernel banner to match.',
  },
  {
    id: 'ghidra-reporter',
    name: 'Ghidra reporter (static only)',
    path: 'tools/ghidra_scripts/GenericProgramReport.java',
    role: 'Writes <program>.ghidra.json + .asm + .c + .strings.txt from the program database. Never executes, emulates or patches the input.',
  },
  {
    id: 'urln',
    name: 'urln/ln — stage a URL as a local file',
    path: 'tools/urln/ln',
    role: 'A URL symlink target is downloaded with curl (nc fallback for plain HTTP) into a cache and linked locally, so a firmware URL becomes the local image Ghidra imports.',
  },
  {
    id: 'bbs-viewer',
    name: 'BBS viewer + netcat capture',
    path: 'public/apps/bbs-viewer/index.html',
    role: 'Renders a captured ANSI byte stream. Capture path: `nc -q1 <host> 23 > capture.ans`; local source: `node tools/bbs/wildcat-banner.mjs --serve 6420`.',
  },
  {
    id: 'wikiinajar',
    name: 'Wiki in a Jar',
    path: 'wikiinajar.html',
    role: 'This assembly is a docs/*.md record, so rebuilding the wiki (`node scripts/build-wikiinajar-xdc.mjs`) carries it into the offline wiki like every other research record.',
  },
  {
    id: 'fax-modem-card',
    name: 'xPort Pro → Nucleo-64 → V.92 fax modem (HP EIO card)',
    path: 'docs/xport-nucleo-v92-eio-fax-card.md',
    role: 'The hardware the firmware serves: PSTN → RJ11 → V.92 modem → Nucleo-64 USART1 (PA9/PA10) → USART2 (PA2/PA3) → xPort Pro DIN/DOUT → RJ45 telnet BBS.',
  },
];

/** Firmware candidates found 2026-10-28 by searching GitHub and archive.org
 *  for the software behind https://www.lantronix.com/products/evolution-os/ .
 *  Full record: docs/evolution-os-software-search-2026-10-28.md.
 *
 *  GitHub yielded no Evolution OS firmware or SDK mirror (code search for
 *  Evolution OS returns this repo; the Lantronix org publishes newer-product
 *  code only; morkai/walkner-tools targets the XPort Pro *Linux* SDK).
 *  archive.org's firmwarelibrary collection mirrors the official Lantronix
 *  FTP (ts.lantronix.com/ftp/) as one ZIP per release, and PCN-728 proves
 *  the XPort Pro 6.x line belongs to the Evolution OS part numbers
 *  XPP1002000-02R / XPP100200S-02R. The payload inside each ZIP is a
 *  compressed .romz ("Rom Compressed: True" in DeviceInstaller logs), so a
 *  candidate is *staged* here, not yet importable: the .romz container must
 *  be inflated before Ghidra sees ColdFire code. */
export const FIRMWARE_CANDIDATES = [
  {
    target: 'xport-pro-evolution',
    version: '6.0.0.1R2',
    why: 'PCN-728 (2021-06-29) lists this release for XPP1002000-02R / XPP100200S-02R — the Evolution OS part numbers.',
    archiveOrg: 'Lantronix_XPort-Pro_6.0.0.1R2_136c8',
    download: 'https://archive.org/download/Lantronix_XPort-Pro_6.0.0.1R2_136c8/136c8005c1aacd8734ed0f621ec73383.zip',
    zipBytes: 637761,
    zipMd5: '136c8005c1aacd8734ed0f621ec73383',
    zipSha1: '9fac545077eb1a95f50cbeb23c40ba381931d60c',
    officialFtp: 'https://ts.lantronix.com/ftp/XPort-Pro/6.0.0.1R2/',
    payloadName: 'xport_pro_6_0_0_1_R2.romz',
    payloadBytes: 623002,
    payloadMd5: '7c996f6ea2d07625012a98e748cad759',
    status: 'staged-candidate — unzip, inflate .romz, then Ghidra',
  },
  {
    target: 'xport-pro-evolution',
    version: '7.0.0.0R2',
    why: 'Newest XPort Pro Evolution release mirrored on archive.org; Lantronix support names v7.1.0.0R1 as current on the official FTP (not yet mirrored).',
    archiveOrg: 'Lantronix_XPort-Pro_7.0.0.0R2_7769a',
    download: 'https://archive.org/download/Lantronix_XPort-Pro_7.0.0.0R2_7769a/7769a2f3359905a3fccb15e2f5b4216f.zip',
    zipBytes: 638418,
    zipMd5: '7769a2f3359905a3fccb15e2f5b4216f',
    zipSha1: 'b6f25081807f1957fab9ca78bff31045e8bac73b',
    officialFtp: 'https://ts.lantronix.com/ftp/XPort-Pro/7.0.0.0R2/',
    payloadName: 'xport_pro_7_0_0_0_R2.romz',
    payloadBytes: 623434,
    payloadMd5: 'c0e1fbdc9011783e3a9644bdcf5aa9ae',
    status: 'staged-candidate — unzip, inflate .romz, then Ghidra',
  },
  {
    target: 'xport-pro-evolution',
    version: '5.5.0.2R5 / 6.0.0.0R5 / 6.0.0.3R1',
    why: 'Earlier Evolution releases in the same mirror (identifiers Lantronix_XPort-Pro_5.5.0.2R5_8eb4f, _6.0.0.0R5_51e0f, _6.0.0.3R1_726b1); the 6.0.0.0R5 FTP directory names the payload xport_pro_6_0_0_0_R5.romz (622,761 bytes) beside md5sum.txt.',
    archiveOrg: 'Lantronix_XPort-Pro_6.0.0.0R5_51e0f',
    download: 'https://archive.org/details/Lantronix_XPort-Pro_6.0.0.0R5_51e0f',
    zipBytes: 0,
    zipMd5: '',
    zipSha1: '',
    officialFtp: 'https://ts.lantronix.com/ftp/XPort-Pro/',
    status: 'catalogued — same .romz caveat',
  },
  {
    target: 'matchport-ar-evolution',
    version: '6.0.0.1R2',
    why: 'MatchPort AR user guide rev F (July 2021) is the 6.0.0.1R2 update; the mirror carries Lantronix_matchport-ar_6.0.0.1R2_7737b. Dual-OS part — Evolution image, not the µClinux SDK build.',
    archiveOrg: 'Lantronix_matchport-ar_6.0.0.1R2_7737b',
    download: 'https://archive.org/details/Lantronix_matchport-ar_6.0.0.1R2_7737b',
    zipBytes: 0,
    zipMd5: '',
    zipSha1: '',
    officialFtp: 'https://ts.lantronix.com/ftp/MatchPort-AR/',
    status: 'catalogued — same .romz caveat',
  },
  {
    target: 'eds-evolution',
    version: '6.0.0.0R1',
    why: 'Lantronix_eds1100_2100_6.0.0.0R1 in the same mirror; EDS Evolution firmware files are named eds*.romz with a separate *boot.romz bootloader (Lantronix upgrade notes for V4.1.0.2).',
    archiveOrg: 'Lantronix_eds1100_2100_6.0.0.0R1_ca0f3',
    download: 'https://archive.org/details/Lantronix_eds1100_2100_6.0.0.0R1_ca0f3',
    zipBytes: 0,
    zipMd5: '',
    zipSha1: '',
    officialFtp: 'https://ts.lantronix.com/ftp/EDS1100_2100/',
    status: 'catalogued — same .romz caveat',
  },
];

const PINNED_GHIDRA = {
  version: '12.1.4',
  date: '20260921',
  sha256: 'ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db',
  url: 'https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_12.1.4_build/ghidra_12.1.4_PUBLIC_20260921.zip',
};

/** The headless command for one target. `-processor` takes the language ID;
 *  for a raw .rom the loader and base address come from Lantronix Lab triage
 *  first, and a .romz must be inflated before import — the command is a
 *  template, not a claim that defaults are right for every image. */
export function headlessCommand(target, { image = '<staged-image>', reportsDir = '<reports-dir>', project = null } = {}) {
  const proj = project || `EVO_${String(target.id || 'target').replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`;
  return [
    'analyzeHeadless "$RUNNER_TEMP/ghidra-projects" ' + proj,
    `  -import ${image}`,
    `  -processor ${target.ghidraLanguage}`,
    '  -scriptPath tools/ghidra_scripts',
    `  -postScript GenericProgramReport.java ${reportsDir}`,
    '  -deleteProject',
  ].join(' \\\n');
}

/** Reduce one GenericProgramReport JSON to the row the assembly prints.
 *  Throws TypeError on anything that is not a report object, so a stray JSON
 *  file in the reports directory fails loudly instead of assembling noise. */
export function summarizeReport(report, sourceName = '') {
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new TypeError('Ghidra report must be a JSON object');
  }
  const decomp = Array.isArray(report.decompilations) ? report.decompilations : [];
  return {
    source: sourceName,
    program: String(report.program ?? ''),
    ghidraVersion: String(report.ghidraVersion ?? ''),
    format: String(report.executableFormat ?? ''),
    language: String(report.language ?? ''),
    sha256: String(report.sha256 ?? ''),
    md5: String(report.md5 ?? ''),
    imageBase: String(report.imageBase ?? ''),
    functions: Number(report.functions ?? 0),
    instructions: Number(report.instructions ?? 0),
    definedStrings: Number(report.definedStrings ?? 0),
    imports: Array.isArray(report.imports) ? report.imports.length : 0,
    decompiled: decomp.filter((d) => d && d.completed).length,
    decompileAttempted: decomp.length,
    memoryBlocks: Array.isArray(report.memoryBlocks) ? report.memoryBlocks.length : 0,
  };
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/** Assemble the Markdown record. With no reports the record says so, in the
 *  status line, and gives the exact staging + runner path instead of
 *  inventing a disassembly. */
export function buildAssembly({ reports = [], generatedAt = new Date().toISOString() } = {}) {
  const rows = reports.map((r) => (r && r.program !== undefined && r.language !== undefined && !r.source ? summarizeReport(r) : r));
  const lines = [];
  lines.push('# Evolution OS — Ghidra disassembly, assembled with BBS / wiki / fax modem');
  lines.push('');
  lines.push(`Generated: ${generatedAt} by \`tools/evolution-os/evolution-os.mjs\`.`);
  lines.push('');
  if (rows.length === 0) {
    lines.push('**Status: pipeline ready — no Evolution OS image staged, no disassembly yet.**');
    lines.push('No `.rom`/`.romz` Evolution OS firmware exists in this repo, and this sandbox has no JVM,');
    lines.push('so Ghidra has not run on Evolution OS here. What exists is the complete, pinned path below;');
    lines.push('the GitHub runner (`.github/workflows/evolution-os-ghidra.yml`) executes it when an image URL');
    lines.push('is supplied. Nothing in this record is a fabricated listing.');
  } else {
    lines.push(`**Status: ${rows.length} Ghidra report(s) assembled.** Static analysis only — no input was executed.`);
  }
  lines.push('');
  lines.push('## Targets — the language is pinned per part number');
  lines.push('');
  lines.push('| Target | Part | CPU | OS | Ghidra language | Firmware artefacts |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const t of EVOLUTION_TARGETS) {
    lines.push(`| ${mdCell(t.name)} | \`${mdCell(t.part)}\` | ${mdCell(t.cpu)} | ${mdCell(t.os)} | \`${mdCell(t.ghidraLanguage)}\` | ${mdCell(t.artifacts)} |`);
  }
  lines.push('');
  lines.push('The trap the Lantronix Lab matrix exists to prevent: the xPort Pro and the classic xPort share');
  lines.push('an RJ45 footprint and an 8-pin header, but one is ColdFire and the other is 16-bit x86. An');
  lines.push('Evolution OS image loaded under the wrong language disassembles into confident garbage.');
  lines.push('Also recorded there, and binding here: **do not flash a Linux image onto an Evolution OS part');
  lines.push('number or vice versa** — the SDK and PCN both warn that mixing images bricks the unit. This');
  lines.push('pipeline only reads images; it never writes one to a device.');
  lines.push('');
  lines.push('## Pipeline');
  lines.push('');
  lines.push('1. **Stage the image.** A firmware URL becomes a local file through `tools/urln/ln` (curl');
  lines.push('   download into a cache, then a symlink), or the runner downloads it directly. Record the');
  lines.push('   SHA-256 before analysis; the report carries Ghidra\'s own hash of the same bytes.');
  lines.push('2. **Triage before Ghidra.** `lantronix-lab.html` (GHIDRA MATCH tab) names the container:');
  lines.push('   inflate gzip, strip a uImage header, read an ELF `e_machine`, or find the vector table in a');
  lines.push('   raw image. An `Evolution` string settles the OS question — it is not Linux, so there is no');
  lines.push('   kernel banner, no `/proc`, and no ELF userland to expect.');
  lines.push(`3. **Disassemble on the runner.** Pinned Ghidra ${PINNED_GHIDRA.version} (SHA-256 gated,`);
  lines.push(`   \`${PINNED_GHIDRA.sha256.slice(0, 16)}…\`), JDK 21, \`GenericProgramReport.java\`:`);
  lines.push('');
  lines.push('```sh');
  lines.push(headlessCommand(EVOLUTION_TARGETS[0]));
  lines.push('```');
  lines.push('');
  lines.push('   For a raw `.rom`, set the loader and base address from the triage result first; a `.romz`');
  lines.push('   must be inflated before import. The 16-bit x86 targets use the same command with');
  lines.push('   `-processor x86:LE:16:Real Mode`.');
  lines.push('4. **Assemble.** `node tools/evolution-os/evolution-os.mjs --reports docs/ghidra/evolution-os`');
  lines.push('   rewrites this record from the runner\'s `*.ghidra.json` reports, and');
  lines.push('   `node scripts/build-wikiinajar-xdc.mjs` carries it into Wiki in a Jar.');
  lines.push('');
  lines.push('## Reports');
  lines.push('');
  if (rows.length === 0) {
    lines.push('None yet. When the runner completes, one row per analysed image lands here with the');
    lines.push('language Ghidra actually loaded, the image hash, and the function / instruction / string');
    lines.push('counts — the checkable fingerprint of a real run.');
  } else {
    lines.push('| Program | Format | Language | SHA-256 | Functions | Instructions | Strings | Imports | Decompiled |');
    lines.push('| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |');
    for (const r of rows) {
      lines.push(`| ${mdCell(r.program)} | ${mdCell(r.format)} | \`${mdCell(r.language)}\` | \`${mdCell(String(r.sha256).slice(0, 16))}…\` | ${r.functions} | ${r.instructions} | ${r.definedStrings} | ${r.imports} | ${r.decompiled}/${r.decompileAttempted} |`);
    }
  }
  lines.push('');
  lines.push('## Firmware candidates (GitHub + archive.org search, 2026-10-28)');
  lines.push('');
  lines.push('GitHub has no Evolution OS firmware or SDK mirror — code search returns this repo, the');
  lines.push('Lantronix org publishes newer-product code, and the one XPort Pro toolset found');
  lines.push('(morkai/walkner-tools) targets the *Linux* SDK. archive.org\'s firmwarelibrary collection');
  lines.push('mirrors the official Lantronix FTP as one ZIP per release. Record:');
  lines.push('`docs/evolution-os-software-search-2026-10-28.md`.');
  lines.push('');
  lines.push('| Target | Version | Source | ZIP SHA-1 | Payload (.romz, vendor MD5) | Status |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const c of FIRMWARE_CANDIDATES) {
    const payload = c.payloadName ? `${c.payloadName} (${c.payloadBytes} B, MD5 \`${String(c.payloadMd5).slice(0, 8)}…\`)` : '—';
    lines.push(`| ${mdCell(c.target)} | ${mdCell(c.version)} | archive.org \`${mdCell(c.archiveOrg)}\` | \`${mdCell(c.zipSha1 ? c.zipSha1.slice(0, 16) + '…' : '—')}\` | ${mdCell(payload)} | ${mdCell(c.status)} |`);
  }
  lines.push('');
  lines.push('Each ZIP wraps a compressed `.romz` payload (plus release notes and `md5sum.txt` on the FTP),');
  lines.push('so the remaining step before a real disassembly is `.romz` inflation — Ghidra must see the');
  lines.push('ColdFire payload, not the compressed container. Stage with:');
  lines.push('');
  lines.push('```sh');
  lines.push('tools/urln/ln -s ' + FIRMWARE_CANDIDATES[0].download + ' ./xport-pro-6.0.0.1R2.zip');
  lines.push('```');
  lines.push('');
  lines.push('## Assembled with');
  lines.push('');
  lines.push('| Module | Artefact | Role in this assembly |');
  lines.push('| --- | --- | --- |');
  for (const m of ASSEMBLY_MODULES) {
    lines.push(`| ${mdCell(m.name)} | \`${mdCell(m.path)}\` | ${mdCell(m.role)} |`);
  }
  lines.push('');
  lines.push('Why these belong in one record: the fax-modem card\'s whole purpose is to put an xPort Pro on');
  lines.push('Ethernet as a telnet BBS front end. The Evolution OS firmware is what answers that telnet');
  lines.push('session, so its disassembly, the BBS capture that exercises it, the wiki that archives the');
  lines.push('record, and the board that carries the modem are four views of the same system.');
  lines.push('');
  return lines.join('\n');
}

export function collectReports(paths) {
  const reports = [];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const names = p.endsWith('.json') ? [p] : readdirSync(p).filter((n) => n.endsWith('.ghidra.json')).map((n) => join(p, n));
    for (const file of names) {
      const parsed = JSON.parse(readFileSync(file, 'utf8'));
      reports.push(summarizeReport(parsed, basename(file)));
    }
  }
  return reports;
}

function parseArgs(argv) {
  const out = { reports: [], out: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--reports') out.reports.push(...String(argv[++i] || '').split(',').filter(Boolean));
    else if (a === '--help' || a === '-h') out.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return out;
}

const HELP = `Usage:
  node tools/evolution-os/evolution-os.mjs [--reports <dir-or-file>[,...]] [--out <file>]
  node tools/evolution-os/evolution-os.mjs --json

Without --reports, docs/ghidra/evolution-os/*.ghidra.json is used when present.
Without --out, the assembled Markdown is printed. --json prints the manifest
(targets, modules, pinned Ghidra) instead.`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { process.stdout.write(HELP + '\n'); return; }
  if (args.json) {
    process.stdout.write(JSON.stringify({ targets: EVOLUTION_TARGETS, modules: ASSEMBLY_MODULES, firmwareCandidates: FIRMWARE_CANDIDATES, ghidra: PINNED_GHIDRA }, null, 2) + '\n');
    return;
  }
  const reportPaths = args.reports.length ? args.reports : ['docs/ghidra/evolution-os'];
  const reports = collectReports(reportPaths);
  const markdown = buildAssembly({ reports });
  if (args.out) {
    writeFileSync(args.out, markdown);
    process.stdout.write(`reports=${reports.length} out=${args.out}\n`);
  } else {
    process.stdout.write(markdown);
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => { process.stderr.write(`evolution-os: ${error.message}\n`); process.exit(1); });
}
