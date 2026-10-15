#!/usr/bin/env node
// Explicitly opt-in integration check. Uses only in-memory Simulator APIs.
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync,renameSync} from 'node:fs';
import path from 'node:path';
import {ROOT,javaTool} from '../deps.mjs';

const args=process.argv.slice(2);
if(args.some(a=>a!=='--offline'))throw new Error('Usage: node tools/wiki-workspace/javacard/test.mjs [--offline]');
const here=path.join(ROOT,'tools/wiki-workspace/javacard');
const pin=JSON.parse(readFileSync(path.join(here,'simulator.lock.json'),'utf8'));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const cache=path.join(ROOT,'.cache/wiki-javacard');mkdirSync(cache,{recursive:true});
const jar=process.env.WIKI_JCARDSIM_JAR?path.resolve(process.env.WIKI_JCARDSIM_JAR):path.join(cache,pin.file);
function verify(bytes) {
  if(bytes.length!==pin.bytes||sha256(bytes)!==pin.sha256)throw new Error('Simulator checksum/size mismatch; no code was loaded');
  const blob=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if(blob!==pin.gitBlob)throw new Error('Simulator Git blob mismatch');
}
if(!existsSync(jar)) {
  if(args.includes('--offline')||process.env.WIKI_JCARDSIM_JAR)throw new Error('Pinned simulator not cached. Supply the exact WIKI_JCARDSIM_JAR or run once without --offline.');
  console.log('Fetching historical, test-only jCardSim API; no Oracle SDK or card installation.');
  const url=`https://api.github.com/repos/${pin.repository}/contents/${pin.file}?ref=${pin.commit}`;
  // Host trust store, TLS verification enabled, no redirect to an unreviewed download host.
  const response=JSON.parse(execFileSync('curl',['--fail','--silent','--show-error','--max-time','60','-H','Accept: application/vnd.github+json',url],{maxBuffer:4*1024*1024,encoding:'utf8'}));
  if(response.encoding!=='base64'||response.sha!==pin.gitBlob||response.size!==pin.bytes)throw new Error('Unexpected pinned dependency response');
  const bytes=Buffer.from(response.content,'base64');verify(bytes);
  const temporary=jar+'.tmp-'+process.pid;
  try{writeFileSync(temporary,bytes);renameSync(temporary,jar);}finally{rmSync(temporary,{force:true});}
}
verify(readFileSync(jar));
const work=path.join(ROOT,'build/wiki-javacard');
// Fixed generated subdirectory only; never caller-supplied.
rmSync(work,{recursive:true,force:true});mkdirSync(work,{recursive:true});
const classes=path.join(work,'classes');mkdirSync(classes);
const applet=path.join(here,'VaultDigestApplet.java'),harness=path.join(here,'test/VaultDigestSimulation.java');
const classpath=[jar,classes].join(path.delimiter);
// The test subprocesses do not need cloud credentials or Java agent injection settings.
const env=Object.fromEntries(['PATH','LANG','LC_ALL','SYSTEMROOT','TMP','TEMP','LD_LIBRARY_PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
const javac=javaTool('javac'),java=javaTool('java');
execFileSync(javac,['--release','8','-Xlint:-options','-encoding','UTF-8','-cp',jar,'-d',classes,applet],{stdio:'inherit',env});
// Host-side javax.smartcardio value objects require the JDK 11 API surface here.
// This harness is not the card applet, not a CAP, and never creates a TerminalFactory.
execFileSync(javac,['--release','11','-encoding','UTF-8','-cp',classpath,'-d',classes,harness],{stdio:'inherit',env});
const reportPath=path.join(work,'report.json');
const result=spawnSync(java,['-Xmx256m','-Djava.awt.headless=true','-cp',classpath,'org.html5.card.testing.VaultDigestSimulation',reportPath],{encoding:'utf8',env,timeout:30000,maxBuffer:1024*1024});
if(result.stdout)process.stdout.write(result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
if(result.error)throw result.error;
if(!existsSync(reportPath))throw new Error('Simulator did not produce a report');
const report=JSON.parse(readFileSync(reportPath,'utf8'));
const version=spawnSync(java,['-version'],{encoding:'utf8',env});
const classFile=path.join(classes,'org/html5/card/VaultDigestApplet.class'),classBytes=readFileSync(classFile);
report.validatedAt=new Date().toISOString();
report.dependency=pin;
report.toolchain={javaVersion:(version.stdout+version.stderr).trim(),appletRelease:8,hostHarnessRelease:11,appletClassMajorVersion:classBytes.readUInt16BE(6)};
report.sources={appletSHA256:sha256(readFileSync(applet)),harnessSHA256:sha256(readFileSync(harness))};
report.outputs={appletClassSHA256:sha256(classBytes)};
report.scopeCounts=report.cases.reduce((counts,t)=>(counts[t.scope]=(counts[t.scope]||0)+1,counts),{});
report.boundaries=['Only direct, in-memory jCardSim calls; no physical card or terminal access','The historical simulator has known transport/reset/transaction limitations','No Oracle SDK tools or simulator binaries were downloaded','This is API-surface compilation and protocol regression testing, not CAP verification'];
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
const disassembly=execFileSync(javaTool('javap'),['-classpath',classpath,'-c','-p','-s','org.html5.card.VaultDigestApplet'],{encoding:'utf8',env});
writeFileSync(path.join(work,'VaultDigestApplet.javap.txt'),disassembly);
console.log('Detailed results:',path.relative(ROOT,reportPath));
console.log('Not validated: CAP, vendor SDK, physical cards, fragmented transport, Le enforcement, EEPROM rollback or power loss.');
process.exit(result.status===0&&report.failed===0?0:1);
