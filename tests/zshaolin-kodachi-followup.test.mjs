import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { unzipSync } from 'fflate';
import { PUBLIC_CORPUS_EXCLUDED_ASSETS, PUBLIC_CORPUS_EXCLUDED_SOURCES } from '../tools/wikiinajar/public-corpus-policy.mjs';

const reportPath = 'docs/zshaolin-apk-and-kodachi-candidate-2026-11-17.md';
const sourcePath = 'docs/research/zshaolin-apk-investigation-2026-11-17.json';
const candidatePath = 'docs/research/kodachi-supplemental-literal-2026-11-17.json';
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const candidateBytes = readFileSync(candidatePath);
const candidate = JSON.parse(candidateBytes);
const historical = JSON.parse(readFileSync('docs/research/kodachi-vpn-iso-inspection-2026-11-17.json', 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');


test('ZShaolin research is pinned source evidence, not an invented APK audit or safety verdict', () => {
  assert.equal(source.upstream.sourceCommit, '9e4857a8fae42eb1e476a9a6ea26df172bf8e87e');
  assert.equal(source.upstream.committedAt, '2014-12-21T22:52:28Z');
  assert.equal(source.upstream.githubReleasesAtObservation, 0);
  assert.equal(source.upstream.pinnedTree.truncated, false);
  assert.equal(source.upstream.pinnedTree.apkPaths, 0);
  assert.equal(source.sourceArchive.archiveBytes, 443706);
  assert.equal(source.sourceArchive.archiveSha256, '3d0dc8aad25032f5f2635a9f83ff9ac9ba73f85bf52175037a139fe7b74d6b37');
  assert.equal(source.sourceArchive.regularFiles, 321);
  assert.equal(source.sourceArchive.uncompressedBytes, 1568698);
  assert.equal(source.sourceArchive.gitBlobIdentityCheckedForEveryRegularFile, true);
  assert.equal(source.sourceArchive.symlinks.length, 2);
  for (const link of source.sourceArchive.symlinks) {
    assert.equal(link.followed, false);
    assert.equal(link.extracted, false);
  }
  for (const field of ['obtained', 'installed', 'executed', 'binaryManifestDecoded', 'dexDecompiled', 'signatureVerified', 'literalSearchRun', 'safeOrMaliciousVerdictEstablished']) assert.equal(source.apk[field], false, field);
  for (const field of ['signerCertificateSha256', 'fileSha256', 'versionObservedFromApk']) assert.equal(source.apk[field], null, field);
  for (const file of source.reviewedSourceFiles) {
    assert.match(file.gitBlob, /^[a-f0-9]{40}$/u);
    assert.match(file.sha256, /^[a-f0-9]{64}$/u);
    assert.ok(file.url.startsWith(`https://github.com/dyne/ZShaolin/blob/${source.upstream.sourceCommit}/`));
  }
});

test('source manifest and repository-shipped ARM component are not mislabeled as a modern release APK', () => {
  assert.equal(source.sourceManifest.package, 'org.dyne.zshaolin');
  assert.equal(source.sourceManifest.versionName, '1.1');
  assert.equal(source.sourceManifest.versionCode, 18);
  assert.deepEqual(['minSdkVersion', 'targetSdkVersion', 'maxSdkVersion'].map(key => source.sourceManifest[key]), [4, 14, 20]);
  assert.deepEqual(source.sourceManifest.usesPermissions.map(p => p.replace('android.permission.', '')), ['INTERNET', 'WRITE_EXTERNAL_STORAGE', 'WAKE_LOCK', 'VIBRATE']);
  assert.equal(source.sourceManifest.notDecodedFromApk, true);
  assert.equal(source.sourceManifest.currentAndroidCompatibilityTested, false);
  assert.equal(source.sourceManifest.vpnServiceDeclared, false);
  const elf = source.sourceNativeComponent;
  assert.equal(elf.elfClass, 32);
  assert.equal(elf.machine, 'ARM');
  assert.equal(elf.bytes, 13860);
  assert.equal(elf.sha256, '47ed51afb295215f959361929470628d8c23ec2773c4b578aa961d4f6ed4174c');
  assert.equal(elf.sha256, source.reviewedSourceFiles.find(file => file.path === elf.path).sha256);
  assert.equal(elf.dynamicTextRelocations, true);
  assert.equal(elf.executed, false);
  assert.equal(elf.disassembledOrDecompiled, false);
});

test('SSH key-provisioning finding retains source-only and dormant-code distinctions without publishing keys', () => {
  const finding = source.findings.find(item => item.id === 'ZSHAOLIN-SOURCE-01');
  assert.match(finding.status, /source.*not reproduced/iu);
  assert.match(finding.title, /private-key.*plain HTTP/iu);
  assert.equal(finding.actualPrivateKeyValuesRetrieved, false);
  assert.equal(finding.actualPrivateKeyValuesPublished, false);
  assert.ok(finding.evidence.some(item => item.path === 'conf/helpers/z-ssh'));
  assert.ok(source.reviewedSourceFiles.some(item => item.path === 'conf/helpers/z-ssh'));
  assert.match(source.findings.find(item => item.id === 'ZSHAOLIN-SOURCE-05').status, /Dormant/u);
  assert.equal(source.conclusion.apkSpecificSecurityVerdictEstablished, false);
  assert.equal(source.conclusion.exactApkStillRequiredForCertificateDexAndPayloadReview, true);
});

test('supplemental result is the complete transported original-ISO report with unchanged source/workflow bytes', () => {
  const transport = source.kodachiSupplementalEvidenceTransport;
  assert.equal(transport.runId, 46041752784);
  assert.equal(transport.checkRunId, 140651111904);
  assert.equal(transport.sourceCommit, 'dd40f8a70ad19f4ea3658f85ca03de9ec37e7aad');
  assert.equal(transport.conclusion, 'success');
  assert.equal(transport.chunks, 3);
  assert.equal(candidateBytes.length, transport.decodedBytes);
  assert.equal(hash(candidateBytes), transport.decodedSha256);
  assert.equal(transport.completeDecodedReportPreservedAt, candidatePath);
  assert.equal(candidate.sourceCommit, transport.sourceCommit);
  assert.equal(candidate.runId, String(transport.runId));
  assert.ok(transport.controlJobs.every(job => job.conclusion === 'success'));
  assert.deepEqual(candidate.iso, historical.iso);
  for (const [path, digest] of Object.entries(candidate.sourceSha256)) assert.equal(hash(readFileSync(path)), digest, `stale supplemental source: ${path}`);
  assert.equal(hash(readFileSync(transport.workflowPath)), transport.workflowSha256);
  assert.equal(transport.artifact.fullArchiveRetrievedLocally, false);
});

test('new literal has real bounded negatives in three encodings, not a password rejection or retroactive Ghidra claim', () => {
  assert.equal(candidate.supplementalLiteral, 'r@@t0r');
  assert.equal(candidate.counts.scannedFiles, 1175);
  assert.equal(candidate.bytesRead, 491894381);
  assert.equal(candidate.skippedCount, 3);
  assert.equal(candidate.skippedExamples.length, 3);
  assert.deepEqual(candidate.encodings, ['UTF-8', 'UTF-16LE', 'UTF-16BE']);
  const result = candidate.requestedLiteralSearch['r@@t0r'];
  for (const key of ['matchingScannedFiles', 'utf8SubstringOccurrences', 'utf16leSubstringOccurrences', 'utf16beSubstringOccurrences', 'standaloneAsciiOccurrences']) assert.equal(result[key], 0, key);
  assert.equal(result.literalRoleUnproven, true);
  assert.equal(result.workingVpnCredentialProven, false);
  for (const key of ['booted', 'mounted', 'installed', 'executedImageFiles', 'connectedToVpn', 'credentialsUsed', 'decryptionAttempted', 'passwordAuthenticationAttempted', 'ghidraRerun', 'workingVpnPasswordEstablished', 'noMatchProvesAbsenceFromEntireIsoOrRuntime']) assert.equal(candidate[key], false, key);
  assert.equal(candidate.passwordAccepted, null);
  assert.equal(candidate.passwordRejected, null);
  assert.deepEqual(Object.keys(historical.staticInspection.requestedLiteralSearch).sort(), ['r00t', 'r00t0r', 'r00tor']);
  assert.equal(historical.staticInspection.requestedLiteralSearch['r@@t0r'], undefined);
  assert.equal(source.sourceLiteralSearch.matchingFiles, 0);
  assert.deepEqual(source.sourceLiteralSearch.substringOccurrencesByEncoding, { 'utf-8': 0, 'utf-16le': 0, 'utf-16be': 0 });
  assert.equal(source.sourceLiteralSearch.apkBytesSearched, false);
  assert.equal(source.conclusion.originalGhidraEvidenceRewrittenOrRerun, false);
});

test('new operational APK/candidate research stays outside public offline manual packages', () => {
  assert.ok(PUBLIC_CORPUS_EXCLUDED_SOURCES.includes(reportPath));
  for (const path of [sourcePath, candidatePath]) assert.ok(PUBLIC_CORPUS_EXCLUDED_ASSETS.includes(path));
  for (const name of ['sitek.xdc', 'adl.xdc']) {
    const archive = unzipSync(readFileSync(name));
    for (const path of [reportPath, sourcePath, candidatePath]) assert.equal(archive[path], undefined, `${name}: ${path}`);
  }
  const wiki = JSON.parse(new TextDecoder().decode(unzipSync(readFileSync('wikiinajar.xdc'))['docs.json']));
  assert.ok(!wiki.pages.some(page => page.source === reportPath));
  const text = readFileSync(reportPath, 'utf8');
  assert.match(text, /No exact ZShaolin APK was obtained/u);
  assert.match(text, /No working Kodachi VPN password/u);
  assert.ok(text.includes(sourcePath.replace('docs/', '')));
  assert.ok(text.includes(candidatePath.replace('docs/', '')));
  const review = readFileSync('.github/workflows/arena-gateway-build.yml', 'utf8');
  assert.match(review, /node --test[^\n]*tests\/zshaolin-kodachi-followup\.test\.mjs/u);
  for (const path of [reportPath, sourcePath, candidatePath]) assert.ok(review.includes(`- '${path}'`), `missing review trigger: ${path}`);
});
