import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,mkdtempSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {ROOT} from '../tools/wiki-workspace/deps.mjs';
import {exclusionReason} from '../tools/wiki-workspace/catalog.mjs';

const pin=JSON.parse(readFileSync(path.join(ROOT,'tools/wiki-workspace/javacard/simulator.lock.json'),'utf8'));
const runner=path.join(ROOT,'tools/wiki-workspace/javacard/test.mjs');
function badInput(t,exists) {
  mkdirSync(path.join(ROOT,'.cache'),{recursive:true});
  const dir=mkdtempSync(path.join(ROOT,'.cache/wiki-card-negative-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const jar=path.join(dir,'untrusted.jar');if(exists)writeFileSync(jar,'not executable simulator code');
  const report=path.join(ROOT,'build/wiki-javacard/report.json');const before=existsSync(report)?readFileSync(report):null;
  const result=spawnSync(process.execPath,[runner,'--offline'],{
    cwd:ROOT,encoding:'utf8',timeout:10000,
    env:{...process.env,WIKI_JCARDSIM_JAR:jar,JAVA_HOME:path.join(dir,'must-not-look-up-a-jdk')}
  });
  assert.equal(result.error,undefined);assert.notEqual(result.status,0);
  assert.doesNotMatch(result.stdout,/Fetching|PASS applet/,'neither download nor simulator execution is allowed');
  if(before)assert.deepEqual(readFileSync(report),before,'failed preflight must not erase a prior report');
  return result;
}
test('JavaCard simulator dependency is immutable, explicitly old and excluded from publication',()=>{
  assert.equal(pin.apiVersion,'2.2.2');assert.equal(pin.repository,'licel/jcardsim');
  assert.match(pin.commit,/^[0-9a-f]{40}$/);assert.match(pin.gitBlob,/^[0-9a-f]{40}$/);
  assert.match(pin.sha256,/^[0-9a-f]{64}$/);assert.equal(pin.bytes,394661);
  assert.match(pin.scope,/test-only/);assert.ok(exclusionReason('.cache/wiki-javacard/'+pin.file));
});
test('offline runner rejects altered simulator bytes before Java lookup',t=>{
  const result=badInput(t,true);assert.match(result.stderr,/Simulator checksum\/size mismatch; no code was loaded/);
});
test('offline runner does not download or silently substitute a missing simulator',t=>{
  const result=badInput(t,false);assert.match(result.stderr,/Pinned simulator not cached/);
});
