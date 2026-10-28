import test from 'node:test';
import assert from 'node:assert/strict';
import { EVOLUTION_TARGETS, ASSEMBLY_MODULES, FIRMWARE_CANDIDATES, buildAssembly, summarizeReport, headlessCommand, collectReports } from '../tools/evolution-os/evolution-os.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('targets pin both Ghidra languages to the right part numbers', () => {
  const byId = Object.fromEntries(EVOLUTION_TARGETS.map((t) => [t.id, t]));
  assert.equal(byId['xport-pro-evolution'].ghidraLanguage, '68000:BE:32:Coldfire');
  assert.match(byId['xport-pro-evolution'].part, /XPP1002000-02R/);
  assert.equal(byId['xport-classic'].ghidraLanguage, 'x86:LE:16:Real Mode');
  assert.match(byId['xport-classic'].part, /XP100100-01/);
  // Every target is an Evolution OS target with a language and artifacts.
  for (const t of EVOLUTION_TARGETS) {
    assert.match(t.os, /Evolution OS/);
    assert.ok(t.ghidraLanguage.includes(':'));
    assert.ok(t.artifacts.length > 0);
  }
});

test('assembly modules name the real BBS, wiki and fax-modem artefacts', () => {
  const paths = ASSEMBLY_MODULES.map((m) => m.path);
  assert.ok(paths.includes('public/apps/bbs-viewer/index.html'));
  assert.ok(paths.includes('wikiinajar.html'));
  assert.ok(paths.includes('docs/xport-nucleo-v92-eio-fax-card.md'));
  assert.ok(paths.includes('tools/urln/ln'));
  assert.ok(paths.includes('tools/ghidra_scripts/GenericProgramReport.java'));
});

test('headless command carries the target language and the reporter script', () => {
  const cmd = headlessCommand(EVOLUTION_TARGETS[0], { image: 'xport_pro.rom', reportsDir: 'out' });
  assert.match(cmd, /-processor 68000:BE:32:Coldfire/);
  assert.match(cmd, /GenericProgramReport\.java out/);
  assert.match(cmd, /-import xport_pro\.rom/);
});

test('summarizeReport counts a GenericProgramReport JSON and rejects junk', () => {
  const row = summarizeReport({
    program: 'xport_pro.rom', executableFormat: 'Raw Binary', language: '68000:BE:32:Coldfire',
    sha256: 'abc', functions: 12, instructions: 340, definedStrings: 56,
    imports: [{ name: 'a' }, { name: 'b' }], decompilations: [{ completed: true }, { completed: false }], memoryBlocks: [{}],
  }, 'x.ghidra.json');
  assert.equal(row.functions, 12);
  assert.equal(row.imports, 2);
  assert.equal(row.decompiled, 1);
  assert.equal(row.decompileAttempted, 2);
  assert.throws(() => summarizeReport(null), TypeError);
  assert.throws(() => summarizeReport([1, 2]), TypeError);
});

test('firmware candidates point at the hash-recorded archive.org mirrors', () => {
  const first = FIRMWARE_CANDIDATES[0];
  assert.equal(first.target, 'xport-pro-evolution');
  assert.equal(first.version, '6.0.0.1R2');
  assert.equal(first.archiveOrg, 'Lantronix_XPort-Pro_6.0.0.1R2_136c8');
  assert.equal(first.zipMd5, '136c8005c1aacd8734ed0f621ec73383');
  // Payload facts read out of the archive.org ZIP listing + its md5sum.txt.
  assert.equal(first.payloadName, 'xport_pro_6_0_0_1_R2.romz');
  assert.equal(first.payloadBytes, 623002);
  assert.equal(first.payloadMd5, '7c996f6ea2d07625012a98e748cad759');
  const second = FIRMWARE_CANDIDATES[1];
  assert.equal(second.payloadName, 'xport_pro_7_0_0_0_R2.romz');
  assert.equal(second.payloadMd5, 'c0e1fbdc9011783e3a9644bdcf5aa9ae');
  assert.match(first.download, /^https:\/\/archive\.org\/download\//);
  for (const c of FIRMWARE_CANDIDATES) {
    assert.ok(EVOLUTION_TARGETS.some((t) => t.id === c.target), `unknown target ${c.target}`);
    assert.match(c.status, /romz/);
  }
  const md = buildAssembly({ reports: [], generatedAt: '2026-10-28T00:00:00.000Z' });
  assert.match(md, /Lantronix_XPort-Pro_6\.0\.0\.1R2_136c8/);
  assert.match(md, /xport_pro_6_0_0_1_R2\.romz/);
  assert.match(md, /evolution-os-software-search-2026-10-28\.md/);
});

test('assembly with no reports states the gap instead of inventing a listing', () => {
  const md = buildAssembly({ reports: [], generatedAt: '2026-10-27T00:00:00.000Z' });
  assert.match(md, /no Evolution OS image staged, no disassembly yet/);
  assert.match(md, /Nothing in this record is a fabricated listing/);
  assert.match(md, /68000:BE:32:Coldfire/);
  assert.match(md, /x86:LE:16:Real Mode/);
  assert.match(md, /V\.92 modem/);
  assert.match(md, /capture\.ans/);
});

test('assembly with a report prints its fingerprint', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evo-reports-'));
  writeFileSync(join(dir, 'xport_pro.rom.ghidra.json'), JSON.stringify({
    program: 'xport_pro.rom', executableFormat: 'Raw Binary', language: '68000:BE:32:Coldfire',
    sha256: '0123456789abcdef0123456789abcdef', functions: 42, instructions: 1000, definedStrings: 77,
    imports: [], decompilations: [{ completed: true }], memoryBlocks: [],
  }));
  const reports = collectReports([dir]);
  assert.equal(reports.length, 1);
  const md = buildAssembly({ reports, generatedAt: '2026-10-27T00:00:00.000Z' });
  assert.match(md, /1 Ghidra report\(s\) assembled/);
  assert.match(md, /xport_pro\.rom/);
  assert.match(md, /0123456789abcdef/);
  assert.match(md, /\| 42 \| 1000 \| 77 \|/);
});
