import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { unzipSync } from 'fflate';
import { PUBLIC_CORPUS_EXCLUDED_ASSETS, PUBLIC_CORPUS_EXCLUDED_SOURCES } from '../tools/wikiinajar/public-corpus-policy.mjs';

const reportPath = 'docs/kodachi-vpn-iso-inspection-2026-11-17.md';
const registerPath = 'docs/research/kodachi-vpn-iso-inspection-2026-11-17.json';
const roundPath = 'docs/backlog-execution-round-96-2026-11-17.md';
const evidence = JSON.parse(readFileSync(registerPath, 'utf8'));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');

test('measured original-ISO evidence retains source, input and current analysis-tool hashes', () => {
  assert.equal(evidence.schema, 1);
  assert.match(evidence.sourceCommit, /^[a-f0-9]{40}$/u);
  assert.equal(evidence.iso.bytes, 4544303104);
  assert.equal(evidence.iso.sha256, '57693b32079bef101b75f21f3391bd036f1aae72836b8a06c921d236df626c14');
  assert.deepEqual(evidence.nativeAnalysis.iso, evidence.iso);
  assert.equal(evidence.nativeAnalysis.sourceCommit, evidence.sourceCommit);
  for (const [path, digest] of Object.entries(evidence.nativeAnalysis.sourceSha256)) assert.equal(sha(path), digest, `stale measured analysis input: ${path}`);
  assert.equal(evidence.staticInspection.inspectionScriptSha256, sha('tools/kodachi/inspect-iso.py'));
  assert.equal(evidence.staticInspection.dependencyLockSha256, sha('tools/kodachi/inspect-requirements.txt'));
  assert.equal(evidence.nativeEvidenceTransport.nativeWorkflowSha256, sha('.github/workflows/kodachi-native-analysis.yml'));
  assert.equal(evidence.nativeEvidenceTransport.conclusion, 'success');
  assert.equal(evidence.originalAcquisition.publisherKeyIndependentlyAuthenticated, false);
});

test('bounded literal search and OS login defaults are not promoted into a VPN password', () => {
  const scan = evidence.staticInspection;
  assert.equal(scan.counts.scannedFiles, 1175);
  assert.equal(scan.bytesRead, 491894381);
  assert.equal(scan.skippedCount, 3);
  assert.equal(scan.previewOnly, true);
  assert.deepEqual(scan.requestedLiteralEncodings, ['UTF-8', 'UTF-16LE', 'UTF-16BE']);
  assert.deepEqual(Object.keys(scan.requestedLiteralSearch).sort(), ['r00t', 'r00t0r', 'r00tor']);
  for (const result of Object.values(scan.requestedLiteralSearch)) {
    assert.equal(result.matchingScannedFiles, 0);
    assert.equal(result.utf8SubstringOccurrences, 0);
    assert.equal(result.workingVpnCredentialProven, false);
    assert.equal(result.roleUnproven, true);
  }
  assert.equal(scan.knownOsLoginLiteralTotals.Security4All, 19);
  assert.equal(evidence.conclusion.workingVpnPasswordEstablished, false);
  assert.equal(evidence.conclusion.noMatchProvesAbsenceFromEntireIsoOrRuntime, false);
  assert.match(evidence.publicSourceCrossCheck.osLoginDefault.role, /OS login.*not.*VPN/u);
});

test('actual native disassembly and bounded decompilation are backed by real positive controls, not only source checks', () => {
  const native = evidence.nativeAnalysis;
  assert.equal(native.ghidra.version, '12.1.4');
  assert.equal(native.ghidra.archiveSha256, 'ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db');
  assert.equal(native.findCrypt.signatures, 126);
  assert.equal(native.findCrypt.databaseSha256, 'ec3f54412ea1a1ddca05ec39eaa8ad1a9c38ce021297f359dbc0a58b9c7a8897');
  const control = native.positiveControls['native-control'];
  assert.ok(control.functionsDefined > 0 && control.instructionsVisitedUpTo500000 > 0);
  assert.ok(control.boundedDecompilations.some(d => d.completed));
  for (const [literal, count] of Object.entries({ r00t0r: 1, r00tor: 1, r00t: 3 })) assert.equal(control.fixedLiteralReferences.find(r => r.literal === literal).loadedMemorySubstringMatchesUpTo32, count);
  assert.ok(native.positiveControls['aes-control'].findCryptMatches.some(r => r.label === 'AES_Encryption_SBox' && r.matchesUpTo32 === 1));
  assert.deepEqual(native.programs.map(p => p.input.flatName).sort(), ['online-auth.elf', 'routing-switch.elf']);
  const inputPins = { 'online-auth.elf': '0c812d83ce153460350e1cb4a631a8ae7567d9cb604d2077bc2c5b8f67fe906c', 'routing-switch.elf': '80bbbf29ea2ff222a60b9c85f9b6050accb1c806e0777689b336a90df4aeb62b' };
  for (const { input, analysis } of native.programs) {
    assert.equal(input.sha256, inputPins[input.flatName]);
    assert.equal(input.sha256, analysis.inputSha256);
    assert.equal(input.executableBit, false);
    assert.equal(input.executed, false);
    assert.match(analysis.format, /ELF/u);
    assert.ok(analysis.functionsDefined > 0 && analysis.instructionsVisitedUpTo500000 > 0);
    assert.ok(analysis.instructionsVisitedUpTo500000 <= 500000);
    assert.equal(typeof analysis.autoAnalysisTimedOut, 'boolean');
    assert.equal(analysis.automaticWholeProgramAnalysisRequested, false);
    assert.equal(analysis.disassemblySeedLimit, 4);
    assert.equal(analysis.disassemblyBytesPerSeedLimit, 4096);
    assert.ok(analysis.boundedDisassembly.length > 0 && analysis.boundedDisassembly.length <= 4);
    assert.ok(analysis.boundedDisassembly.some(d => d.instructionCountInWindow > 0));
    for (const d of analysis.boundedDisassembly) {
      assert.ok(d.windowBytes <= 4096);
      assert.equal(d.automaticCodeAnalysisEnabled, false);
    }
    assert.equal(typeof analysis.instructionCapReached, 'boolean');
    assert.ok(analysis.bufferedLoadedBytes > 0 && analysis.bufferedLoadedBytes <= 64 * 1024 ** 2);
    assert.equal(analysis.loadedMemoryByteLimit, 64 * 1024 ** 2);
    assert.ok(analysis.boundedDecompilations.some(d => d.completed));
    assert.ok(analysis.boundedDecompilations.length <= 4);
    for (const d of analysis.boundedDecompilations) {
      assert.equal(d.cSourcePublished, false);
      if (d.completed) assert.match(d.cSha256, /^[a-f0-9]{64}$/u);
    }
    for (const field of ['inputExecuted', 'credentialsUsed', 'decryptionPerformed', 'arbitraryStringsOrSourcePublished', 'privateKeysPublished']) assert.equal(analysis[field], false, field);
  }
});

test('new evidence, report and backlog notes remain out of public offline manual corpora', () => {
  for (const path of [reportPath, roundPath]) assert.ok(PUBLIC_CORPUS_EXCLUDED_SOURCES.includes(path));
  assert.ok(PUBLIC_CORPUS_EXCLUDED_ASSETS.includes(registerPath));
  for (const name of ['sitek.xdc', 'adl.xdc']) {
    const archive = unzipSync(readFileSync(name));
    for (const path of [reportPath, registerPath, roundPath]) assert.equal(archive[path], undefined, `${name} must not publish ${path}`);
  }
  const wiki = JSON.parse(new TextDecoder().decode(unzipSync(readFileSync('wikiinajar.xdc'))['docs.json']));
  for (const path of [reportPath, roundPath]) assert.ok(!wiki.pages.some(page => page.source === path));
  assert.ok(readFileSync('gateway-config.html', 'utf8').includes(reportPath));
  assert.ok(readFileSync(reportPath, 'utf8').includes('No working VPN password'));
});

test('follow-through preserves original backlog terminal states and the declined permission change', () => {
  const backlog = JSON.parse(readFileSync('docs/agent-backlog-2026-10-21.json', 'utf8'));
  assert.equal(backlog.tasks.length, 31);
  assert.equal(backlog.tasks.filter(t => t.status === 'done').length, 30);
  assert.equal(backlog.tasks.find(t => t.id === 'T9.3').status, 'declined');
  assert.equal(evidence.conclusion.booted, false);
  assert.equal(evidence.conclusion.connectedToVpn, false);
  assert.equal(evidence.conclusion.credentialsUsed, false);
});
