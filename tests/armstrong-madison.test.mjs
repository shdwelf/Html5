import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { unzipSync } from '../vendor/fflate/index.mjs';
import { audit, comparisonReadings, editionBody, makeReceipt, numericReadings, parseEdition, parseKey, subsequenceAudit, validateKey } from '../apps/armstrong-madison/analysis.mjs';
import { buildArmstrongMadison, createArmstrongBuild, EVIDENCE_FILES, INPUT_SHA256, replaceOnce } from '../scripts/build-armstrong-madison.mjs';
import { buildCatalog } from '../scripts/build-html5-offline-launcher-assets.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const E = 'docs/research/armstrong-madison-1808/';
const read = (name) => readFileSync(resolve(ROOT, name), 'utf8');
const data = (name) => readFileSync(resolve(ROOT, name));
const json = (name) => JSON.parse(read(E + name));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const transcript = read(E + 'founders-feb20.txt');
const key = json('afio-key.json').key;
const claim = read(E + 'afio-claimed-plaintext.txt');
const comparison = read(E + 'github-comparison.txt');
const parsed = parseEdition(transcript);
const receipt = makeReceipt(transcript, key, claim, comparison);
const source = read('public/apps/armstrong-madison/index.html');
const research = read('public/apps/armstrong-madison/research.html');

test('the .xdc.xml attachment is preserved as the exact pinned three-member ZIP, not treated as XML', () => {
  const supplied = data('apps/armstrong-madison/input/armstrong-madison-cipher.xdc');
  assert.equal(supplied.length, 2451221);
  assert.equal(supplied.subarray(0, 4).toString('hex'), '504b0304');
  assert.equal(hash(supplied), INPUT_SHA256);
  const files = unzipSync(supplied), attachment = json('attachment.json');
  assert.deepEqual(Object.keys(files).sort(), ['icon.png', 'index.html', 'manifest.toml']);
  for (const entry of attachment.entries) {
    assert.equal(files[entry.path].length, entry.bytes); assert.equal(hash(files[entry.path]), entry.sha256);
  }
});

test('the editorial parser excludes line-count descriptions and isolates the damaged prefix', () => {
  assert.equal(numericReadings(parsed.tokens).length, 365);
  assert.equal(numericReadings(parsed.tokens, true).length, 366);
  assert.equal(new Set(numericReadings(parsed.tokens)).size, 216);
  assert.deepEqual(parsed.tokens.filter((token) => token.kind === 'number' && !token.complete).map((token) => [token.value, token.printed]), [[17, '17⟨   ⟩']]);
  assert.equal(receipt.strict.glyphDescriptors, 34);
  assert.equal(receipt.strict.glyphSpans, 35);
  assert.equal(receipt.strict.wholeGlyphLines, 4);
});

test('the pinned GitHub stream exactly reproduces naive editorial digit extraction, not the correct code count', () => {
  assert.deepEqual(comparisonReadings(comparison), editionBody(transcript).match(/\d+/gu).map(Number));
  assert.equal(receipt.githubComparison.total, 369);
  assert.equal(receipt.githubComparison.mapped, 133);
  assert.equal(receipt.githubComparison.equalsNaiveDigitExtraction, true);
  assert.deepEqual(receipt.githubComparison.extraOccurrences, [{ code: 1, extra: 2 }, { code: 2, extra: 1 }]);
});

test('all 56 published AFIO pairs are audited without changing absence, order or unknowns', () => {
  const strict = audit(parsed.tokens, key);
  assert.equal(strict.keyEntries, 56); assert.equal(strict.mapped, 130); assert.equal(strict.unmapped, 235);
  assert.equal(strict.mappedDistinct, 51);
  assert.deepEqual(strict.absentKeyCodes, [6, 39, 131, 432, 1358]);
  assert.ok(Math.abs(strict.coveragePercent - 35.61643835616438) < 1e-12);
  assert.equal(strict.min, 1); assert.equal(strict.max, 1900);
  assert.equal(strict.frequency.find((row) => row.code === 453).label, null);
  assert.equal(strict.frequency.find((row) => row.code === 431).label, null);
});

test('including the damaged 17 is an explicit alternate policy and changes only that occurrence', () => {
  const complete = audit(parsed.tokens, key), provisional = audit(parsed.tokens, key, true);
  assert.equal(provisional.total, 366); assert.equal(provisional.mapped, 131);
  assert.equal(complete.frequency.find((row) => row.code === 17).count, 12);
  assert.equal(provisional.frequency.find((row) => row.code === 17).count, 13);
  assert.equal(provisional.distinct, complete.distinct);
  for (const row of complete.frequency.filter((row) => row.code !== 17)) assert.deepEqual(provisional.frequency.find((candidate) => candidate.code === row.code), row);
});

test('Founders 203 is retained instead of silently replacing it with the attachment 1203', () => {
  const readings = numericReadings(parsed.tokens);
  assert.equal(readings.includes(203), true); assert.equal(readings.includes(1203), false);
  assert.match(transcript, /56\. 203\. 38 symbol/u);
  assert.match(json('dossier.json').findings.find((finding) => finding.id === 'variants').text, /203[\s\S]*1203/u);
});

test('the omission-allowing subsequence is a diagnostic, not a plaintext or significance score', () => {
  const result = subsequenceAudit(parsed.tokens, key, claim);
  assert.equal(result.claimWords, 60); assert.equal(result.matchedInOrder, 40);
  assert.equal(result.mappedOccurrencesNotUsedByBestSubsequence, 90);
  assert.deepEqual(result.claimWordsWithNoKeyLabel, ['examined', 'not', 'receive', 'seamen', 'shall', 'we']);
  assert.match(result.caveat, /not supplied as wildcard/u);
});

test('the 26 trailing-zero pairs are reported without asserting equal meanings', () => {
  assert.equal(receipt.strict.trailingZeroPairs.length, 26);
  assert.ok(receipt.strict.trailingZeroPairs.some(([a, b]) => a === 76 && b === 760));
  assert.match(json('dossier.json').findings.find((finding) => finding.id === 'zero').text, /does not show/u);
});

test('key validation is canonical, bounded and never evaluates text or accepts prototype keys', () => {
  assert.equal(parseKey('{"453":"bearer"}')['453'], 'bearer');
  assert.equal(validateKey({ 1: '  our  ' })[1], 'our');
  assert.equal(Object.getPrototypeOf(validateKey({})), null);
  for (const input of ['null', '[]', '5', '{"0":"x"}', '{"01":"x"}', '{"1901":"x"}', '{"1":5}', '{"1":""}', '{"1":"a\\nb"}', '{"__proto__":{"polluted":true}}', '{"constructor":"x"}']) assert.throws(() => parseKey(input), undefined, input);
  assert.throws(() => parseKey(' '.repeat(96001)));
  assert.throws(() => validateKey({ 1: 'x'.repeat(81) }));
  assert.throws(() => validateKey(Object.fromEntries(Array.from({ length: 1900 }, (_, i) => [i + 1, '"'.repeat(80)]))), /96,000 exported JSON/u);
  const maximumEntries = validateKey(Object.fromEntries(Array.from({ length: 1900 }, (_, i) => [i + 1, 'label'])));
  assert.deepEqual(parseKey(JSON.stringify(maximumEntries, null, 2) + '\n'), maximumEntries);
  assert.equal({}.polluted, undefined);
  // Markup is legal research text, not markup to execute. DOM tests enforce text-only rendering.
  assert.equal(validateKey({ 453: '<img src=x onerror=alert(1)>' })[453], '<img src=x onerror=alert(1)>');
});

test('unexpected edition structure fails closed instead of harvesting numbers from unrelated prose', () => {
  assert.throws(() => parseEdition('20 February 1808: 123 456'));
  assert.throws(() => parseEdition(transcript.replace('453. 240.', 'comment 453. 240.')));
  assert.throws(() => parseEdition(transcript.replace('453. 240.', '9999. 240.')));
});

test('audits do not mutate the source tokens or the supplied mapping', () => {
  const before = JSON.stringify(parsed.tokens), originalKey = JSON.stringify(key);
  audit(parsed.tokens, key); subsequenceAudit(parsed.tokens, key, claim); makeReceipt(transcript, key, claim, comparison);
  assert.equal(JSON.stringify(parsed.tokens), before); assert.equal(JSON.stringify(key), originalKey);
  assert.deepEqual(json('audit.json'), receipt);
});

test('all evidence levels and citations resolve without treating failed retrievals or mirrors as primary witnesses', () => {
  const dossier = json('dossier.json'), ids = new Set(dossier.sources.map((item) => item.id));
  assert.equal(dossier.sources.length, 33); assert.equal(ids.size, 33);
  for (const record of dossier.findings) for (const id of record.sources) assert.ok(ids.has(id), id);
  for (const item of dossier.letters) assert.ok(ids.has(item.source));
  for (const query of dossier.queries) for (const id of query.sources || []) assert.ok(ids.has(id));
  for (const item of dossier.sources) if (item.url) assert.equal(new URL(item.url).protocol, 'https:');
  assert.match(dossier.findings.find((item) => item.id === 'missing-key').text, /Neither note specifies/u);
  assert.match(dossier.findings.find((item) => item.id === 'august').text, /do not solve the February/u);
  assert.match(dossier.sources.find((item) => item.id === 'S17').status, /failed/u);
  assert.match(dossier.sources.find((item) => item.id === 'S34').status, /failed/u);
});

test('the search register records all named services and distinguishes directories from actual search outcomes', () => {
  const queries = json('dossier.json').queries;
  assert.equal(queries.length, 9);
  const services = queries.map((query) => query.service).join(' ');
  for (const name of ['baresearch.org', 'libresearch.space', 'utilibre.org', 'searx.space', 'GitHub', 'archive.org', 'Project Gutenberg']) assert.ok(services.includes(name), name);
  assert.match(queries.find((query) => query.service === 'searx.space').result, /not represented as a cipher search/u);
  assert.match(queries.find((query) => query.service === 'baresearch.org').result, /not proof/u);
});

test('the retained GitHub comparison and license match their pinned Git blobs and SHA-256 receipts', () => {
  const github = json('github-receipt.json');
  assert.equal(github.commit, 'd8ac608093e1149f9456eaa2c99bb456ca0abc92');
  assert.equal(github.sourceExecuted, false);
  for (const [path, local] of [['targets/armstrong/feb20_ciphertext.txt', 'github-comparison.txt'], ['LICENSE', 'github-MIT-LICENSE.txt']]) {
    const entry = github.files.find((file) => file.path === path), content = data(E + local);
    assert.equal(content.length, entry.bytes); assert.equal(hash(content), entry.sha256);
    assert.equal(createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex'), entry.gitBlob);
  }
  assert.match(read(E + 'github-MIT-LICENSE.txt'), /Copyright \(c\) 2026 Dan Bourdeau/u);
});

test('Gutenberg excerpt hashes, mirror identity and formula-hit context remain explicit', () => {
  const gutenberg = json('gutenberg-receipt.json'), excerpt = data(E + gutenberg.excerpt.path);
  assert.equal(gutenberg.commit, '714c07904a75b84e7191cc9d1e5dfb48e1def1bb');
  assert.equal(gutenberg.files.find((entry) => entry.path === '53767-0.txt').bytes, 1300025);
  assert.equal(excerpt.length, gutenberg.excerpt.endByteExclusive - gutenberg.excerpt.startByte);
  assert.equal(hash(excerpt), gutenberg.excerpt.sha256);
  assert.match(excerpt.toString(), /May 2, 1808/u); assert.match(excerpt.toString(), /Harden/u);
  assert.match(read(E + 'gutenberg-formula-hit.txt'), /March 2, 1809/u);
  assert.match(gutenberg.directGutenbergFetch, /Failed/u);
  assert.match(gutenberg.openingFormulaHit, /Dupont de Nemours/u);
});

test('the deterministic build preserves 18 tabs plus the new default review and refuses patch drift', () => {
  assert.match(source, /const om=\[\{id:"verified",label:"Verified research"\}/u);
  const ids = source.match(/const om=\[([\s\S]*?)\];function Kx/u)[1].match(/id:"[a-z]+"/gu);
  assert.equal(ids.length, 19);
  assert.match(source, /function Kx\(\)\{const\[r,h\]=X.useState\("verified"\)/u);
  assert.match(source, /sandbox:"allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox"/u);
  assert.doesNotMatch(source, /allow-same-origin/u);
  assert.doesNotMatch(source, /const o=X.useCallback\(u=>\{o\(b=>/u);
  assert.doesNotMatch(source, /localStorage.getItem\(Om\)/u);
  assert.throws(() => replaceOnce('abc abc', 'abc', 'x'));
  assert.throws(() => replaceOnce('abc', 'missing', 'x'));
});

test('the self-contained research document uses matching CSP script/style hashes and no remote resources', () => {
  const script = research.match(/<script>([\s\S]*?)<\/script>/u)[1];
  const style = research.match(/<style>([\s\S]*?)<\/style>/u)[1];
  for (const value of [script, style]) assert.ok(research.includes(`sha256-${createHash('sha256').update(value).digest('base64')}`));
  assert.match(research, /connect-src 'none'/u);
  assert.doesNotMatch(research, /<(?:script|img|link)\b[^>]*\b(?:src|href)=["']https?:/iu);
  assert.match(source, /connect-src 'none'/u);
  assert.doesNotMatch(source, /fetch\(window.location.href/u);
});

test('all checked-in outputs and the root XDC match a fresh deterministic build', () => {
  const first = createArmstrongBuild(), second = createArmstrongBuild();
  assert.deepEqual(first.archive, second.archive);
  assert.equal(first.files.size, 20);
  const members = unzipSync(first.archive);
  assert.deepEqual(Object.keys(members).sort(), [...first.files.keys()].sort());
  for (const [name, content] of first.files) {
    assert.deepEqual(Buffer.from(members[name]), content);
    assert.deepEqual(data('public/apps/armstrong-madison/' + name), content);
    assert.ok(!name.includes('..') && !name.startsWith('/'));
  }
  for (const name of EVIDENCE_FILES) assert.ok(members['evidence/' + name], name);
  assert.match(Buffer.from(members['manifest.toml']).toString(), /source_code_url = "https:\/\/github.com\/shdwelf\/Html5/u);
  assert.ok(members['THIRD_PARTY_NOTICES.txt']);
  assert.deepEqual(data('armstrong-madison-cipher.xdc'), first.archive);
  assert.deepEqual(json('build-receipt.json'), first.receipt);
  buildArmstrongMadison({ check: true });
});

test('deterministic ZIP wall-clock fields and receipts do not depend on the build timezone', () => {
  for (const TZ of ['Pacific/Auckland', 'America/Los_Angeles']) {
    const output = execFileSync(process.execPath, ['scripts/build-armstrong-madison.mjs', '--check'], { cwd: ROOT, env: { ...process.env, TZ }, encoding: 'utf8' });
    assert.match(output, /20 bundled files verified/u);
  }
});

test('the bundled report resolves local evidence links and all copies retain the complete comparison license', () => {
  const files = unzipSync(data('armstrong-madison-cipher.xdc'));
  const report = Buffer.from(files['SOURCE-CHECK.md']).toString();
  const localLinks = [...report.matchAll(/\]\((evidence\/[^)]+)\)/gu)].map((match) => match[1]);
  assert.ok(localLinks.includes('evidence/audit.json'));
  assert.ok(localLinks.includes('evidence/attachment.json'));
  assert.ok(localLinks.includes('evidence/dossier.json'));
  for (const path of localLinks) assert.ok(files[path], path);
  assert.doesNotMatch(report, /\]\(research\/armstrong-madison-1808\//u);
  assert.ok(Buffer.from(files['THIRD_PARTY_NOTICES.txt']).toString().includes(read(E + 'github-MIT-LICENSE.txt').trim()));
  assert.match(research, /id="third-party-notices"/u);
  assert.match(research, /Copyright \(c\) 2026 Dan Bourdeau/u);
});

test('CI watches the archive and verifies the current source tree in both public packaging profiles', () => {
  const workflow = read('.github/workflows/html5-offline-launcher-build.yml');
  assert.equal([...workflow.matchAll(/- 'armstrong-madison-cipher\.xdc'/gu)].length, 2);
  assert.match(workflow, /node scripts\/build-armstrong-madison\.mjs --check && node --test tests\/armstrong-madison\.test\.mjs && node tests\/armstrong-madison-browser\.mjs/u);
  assert.match(workflow, /len\(slugs\) != 100/u);
  assert.match(workflow, /for app in \("openpgp-workbench", "torrent-atlas", "armstrong-madison"\)/u);
});

test('the reviewed app is discoverable in public/network catalogs without relaxing the private profile', () => {
  const catalog = buildCatalog();
  assert.equal(catalog.length, 98);
  const app = catalog.find((item) => item.slug === 'armstrong-madison');
  assert.ok(app); assert.equal(app.hasRemoteResources, false);
  assert.equal(buildCatalog('network').length, 100);
  assert.deepEqual(buildCatalog('private').map((item) => item.slug).sort(), ['helios-observatory', 'prime-viewer']);
  assert.match(read('public/apps/index.html'), /href="\.\/armstrong-madison\/index.html"/u);
  const browser = JSON.parse(read('public/apps/catalog.json'));
  assert.ok(browser.apps.some((item) => item.slug === 'armstrong-madison'));
});
