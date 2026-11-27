import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { HEADER_LIMIT, FILE_LIMIT, classifyAnalysisHeader, analysisCommandPlan, bindAnalysisTools } from '../js/vpn-analysis-tools.js';

function elf(bits = 2) {
  const bytes = new Uint8Array(64); bytes.set([0x7f, 0x45, 0x4c, 0x46, bits, 1, 1]); return bytes;
}
function pe(managed, wide = false) {
  const bytes = new Uint8Array(512), view = new DataView(bytes.buffer), offset = 0x80, optional = offset + 24, directory = wide ? 112 : 96;
  bytes.set([0x4d, 0x5a]); view.setUint32(0x3c, offset, true); view.setUint32(offset, 0x4550, true);
  view.setUint16(offset + 20, directory + 16 * 8, true); view.setUint16(optional, wide ? 0x20b : 0x10b, true);
  view.setUint32(optional + directory - 4, 16, true);
  if (managed) { view.setUint32(optional + directory + 14 * 8, 0x2000, true); view.setUint32(optional + directory + 14 * 8 + 4, 72, true); }
  return bytes;
}
test('native ELF header detection selects Ghidra rather than a .NET tool', () => {
  for (const bits of [1, 2]) {
    const result = classifyAnalysisHeader(elf(bits));
    assert.equal(result.format, 'native'); assert.match(result.description, /Ghidra, not ILSpy/);
    for (const field of ['executed', 'uploaded', 'decompiled', 'decrypted']) assert.equal(result[field], false);
  }
  const bad = elf(); bad[5] = 0; assert.equal(classifyAnalysisHeader(bad).format, 'unknown');
  assert.equal(classifyAnalysisHeader(elf().slice(0, 16)).format, 'unknown');
});
test('native PE, managed CLI PE32/PE32+ and DOS MZ are kept separate', () => {
  for (const wide of [false, true]) {
    assert.equal(classifyAnalysisHeader(pe(true, wide)).format, 'dotnet');
    assert.equal(classifyAnalysisHeader(pe(false, wide)).format, 'native');
  }
  const mz = new Uint8Array(64); mz.set([0x4d, 0x5a]);
  assert.equal(classifyAnalysisHeader(mz).format, 'unknown');
  const overflow = pe(true); new DataView(overflow.buffer).setUint32(0x3c, 0xffffffff, true);
  assert.equal(classifyAnalysisHeader(overflow).format, 'unknown');
});
test('Java class magic has a bounded structural check and unknown bytes do not establish encryption', () => {
  const bytes = new Uint8Array([0xca, 0xfe, 0xba, 0xbe, 0, 0, 0, 65, 0, 4]);
  assert.equal(classifyAnalysisHeader(bytes).format, 'java');
  bytes[6] = 255; assert.equal(classifyAnalysisHeader(bytes).format, 'unknown');
  assert.match(classifyAnalysisHeader(new Uint8Array([1, 2, 3])).description, /does not establish encryption/);
});
test('empty, oversize, unbounded or inconsistent reads fail before triage', () => {
  for (const args of [[new Uint8Array()], [new Uint8Array(1), FILE_LIMIT + 1], [new Uint8Array(HEADER_LIMIT + 1)], [new Uint8Array(8), 4], [new Uint8Array(1), NaN], [null]]) assert.throws(() => classifyAnalysisHeader(...args), TypeError);
  assert.equal(classifyAnalysisHeader(elf(), FILE_LIMIT).headerBytesRead, 64);
});
test('Java runtime selections emit only their fixed Java 21 setup; they are not alternate decompilers', () => {
  for (const [runtime, variable] of [['temurin', 'TEMURIN_21_HOME'], ['zulu', 'ZULU_21_HOME'], ['openjdk', 'OPENJDK_21_HOME']]) {
    const plan = analysisCommandPlan({ runtime });
    assert.ok(plan.includes(`JAVA_HOME="$${variable}"`)); assert.match(plan, /analyzeHeadless/);
    assert.match(plan, /No automatic decryption/); assert.doesNotMatch(plan, /ilspycmd/);
  }
  assert.match(analysisCommandPlan({ format: 'dotnet' }), /ilspycmd/);
  assert.doesNotMatch(analysisCommandPlan({ format: 'dotnet' }), /export JAVA_HOME/);
  assert.match(analysisCommandPlan({ format: 'java' }), /javap.*-c -p/);
  assert.doesNotMatch(analysisCommandPlan({ format: 'unknown' }), /analyzeHeadless|ilspycmd|\/javap/);
});
test('acquisition templates distinguish offline, forced direct and explicitly configured HTTPS proxy', () => {
  assert.doesNotMatch(analysisCommandPlan(), /^curl /m);
  assert.match(analysisCommandPlan({ acquisition: 'direct' }), /--noproxy '\*'/);
  const proxy = analysisCommandPlan({ acquisition: 'proxy' });
  assert.match(proxy, /HTTPS_PROXY:\?Set an explicitly approved/); assert.match(proxy, /--proxy "\$HTTPS_PROXY" --noproxy ''/);
  assert.match(proxy, /sha256sum --check --strict/); assert.doesNotMatch(proxy, /allorigins|corsproxy\.io/);
  for (const options of [{ runtime: 'jdk8' }, { format: 'shell' }, { acquisition: 'auto' }, { runtime: '"; injected' }]) assert.throws(() => analysisCommandPlan(options), TypeError);
});
test('the UI reads only the header, uses inert filename text and never inserts it into commands', async () => {
  const dom = new JSDOM(readFileSync('gateway-config.html', 'utf8'));
  const d = dom.window.document; bindAnalysisTools(d);
  const file = { name: '<img src=x onerror=alert(1)>;$(touch SHOULD_NOT_RUN)', size: 1000000, slice(start, end) { assert.equal(start, 0); assert.equal(end, HEADER_LIMIT); return { arrayBuffer: async () => elf().buffer }; } };
  Object.defineProperty(d.getElementById('analysisFile'), 'files', { configurable: true, value: [file] });
  d.getElementById('analysisFile').dispatchEvent(new dom.window.Event('change'));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(d.getElementById('analysisFormat').value, 'native');
  assert.ok(d.getElementById('analysisStatus').textContent.includes(file.name));
  assert.equal(d.getElementById('analysisStatus').querySelector('img'), null);
  assert.ok(!d.getElementById('analysisPlan').textContent.includes('SHOULD_NOT_RUN'));
  d.getElementById('analysisFormat').value = 'dotnet'; d.getElementById('analysisFormat').dispatchEvent(new dom.window.Event('change'));
  assert.match(d.getElementById('analysisMismatch').textContent, /differs/);
  assert.equal(d.getElementById('analysisRuntime').disabled, true);
  d.getElementById('analysisClear').click();
  assert.match(d.getElementById('analysisStatus').textContent, /cleared/); dom.window.close();
});
test('clear rejects a stale asynchronous header read without reviving a file result', async () => {
  const dom = new JSDOM(readFileSync('gateway-config.html', 'utf8')), d = dom.window.document;
  let finish; bindAnalysisTools(d);
  Object.defineProperty(d.getElementById('analysisFile'), 'files', { value: [{ name: 'synthetic', size: 64, slice: () => ({ arrayBuffer: () => new Promise(resolve => { finish = resolve; }) }) }] });
  d.getElementById('analysisFile').dispatchEvent(new dom.window.Event('change'));
  d.getElementById('analysisClear').click(); finish(elf().buffer);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.match(d.getElementById('analysisStatus').textContent, /cleared/); dom.window.close();
});
