import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { buildCatalog, exclusionReason, references, sha256 } from '../tools/wiki-workspace/catalog.mjs';
import { readExchange, toMediaWiki, toTiddlers, mediaWikiTitles } from '../tools/wiki-workspace/exchange.mjs';
import { encryptVault, decryptVault, validateWorkspaceVault, toBase64url, fromBase64url, toBase64 } from '../tools/wiki-workspace/web/vault.mjs';
const root=path.resolve(import.meta.dirname,'..');
function fixture(t) {
  mkdirSync(path.join(root,'.cache'),{recursive:true});
  const dir=mkdtempSync(path.join(root,'.cache/wiki-catalog-test-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const put=(name,value)=>{const f=path.join(dir,name);mkdirSync(path.dirname(f),{recursive:true});writeFileSync(f,value);};
  put('README.md','# Home\n[guide](docs/guide.md) [reference](https://example.org/ref)\n');
  put('docs/guide.md','# Guide\n[home](../README.md) [missing](missing.md)');
  put('same.txt','same bytes');put('copy.txt','same bytes');put('binary.bin',Buffer.from([0,255,1]));
  put('.env','private');put('.git/config','private');put('.relay/a','private');put('private.haikuvault','private');
  put('long.txt','é'.repeat(100));
  symlinkSync(path.join(dir,'README.md'),path.join(dir,'linked.md'));
  return {id:'Sample',root:dir,files:['README.md','docs/guide.md','same.txt','copy.txt','binary.bin','.env','.git/config','.relay/a','private.haikuvault','long.txt','linked.md','../escape']};
}
test('catalog indexes every eligible file, deduplicates bytes, and explicitly excludes private paths',t=>{
  const repo=fixture(t),{catalog,pages,blobs}=buildCatalog([repo]);
  assert.equal(pages.length,6);assert.equal(blobs.size,5);assert.equal(catalog.excluded.length,6);
  assert.equal(pages.find(p=>p.path==='binary.bin').text,false);
  const home=pages.find(p=>p.path==='README.md'),guide=pages.find(p=>p.path==='docs/guide.md');
  assert.deepEqual(home.links,[guide.id]);assert.deepEqual(home.backlinks,[guide.id]);assert.deepEqual(guide.unresolved,['docs/missing.md']);
  assert.equal(catalog.bibliography[0].url,'https://example.org/ref');
  assert.ok(!JSON.stringify(catalog).includes(repo.root),'machine paths are not published');
  assert.equal(pages.find(p=>p.path==='copy.txt').sha256,pages.find(p=>p.path==='same.txt').sha256);
  assert.equal(blobs.get(home.sha256).size,home.size);
});
test('catalog snapshot and ordering are deterministic, and detect changed bytes',t=>{
  const repo=fixture(t),a=buildCatalog([repo]),b=buildCatalog([repo]);assert.deepEqual(a.catalog,b.catalog);
  writeFileSync(path.join(repo.root,'same.txt'),'changed');assert.notEqual(buildCatalog([repo]).catalog.snapshot,a.catalog.snapshot);
});
test('preview limits do not change exact-byte digest or silently classify binary data as text',t=>{
  const repo=fixture(t),{pages}=buildCatalog([repo],{maxPreviewBytes:41});const p=pages.find(p=>p.path==='long.txt');
  assert.equal(p.truncated,true);assert.equal(p.sha256,sha256('é'.repeat(100)));assert.match(p.body,/Preview truncated/);assert.ok(!p.body.includes('\uFFFD'));
});
test('publication policy applies even to tracked caches, credentials and private exports',()=>{
  for(const p of ['.git/config','.arena-drive/secret','.cache/a','node_modules/pkg/a','folder/.env.production','folder/id_ed25519','a.p12','sync-outgoing/file','data/key.haikuvault'])assert.ok(exclusionReason(p),p);
  assert.equal(exclusionReason('.github/workflows/test.yml'),null);assert.equal(exclusionReason('src/App.tsx'),null);
  assert.deepEqual(references('[x](../../outside) [y](b.md#title) [z](https://user:password@example.org)','docs/a.md'),{remote:[],local:['docs/b.md']});
});
test('export JSON accepts the actual browser format, keeps history, skips tombstones and rejects wrong versions',()=>{
  const pages=readExchange({format:'wikiinajar-jar',version:1,pages:{A:{body:'current',history:[{body:'old',updated:'2026-10-01'}]},Gone:{body:'',deleted:true}}});
  assert.equal(pages.length,1);assert.equal(pages[0].history[0].body,'old');
  assert.throws(()=>readExchange({pages:{}}),/version 1/);assert.throws(()=>readExchange({format:'wikiinajar-jar',version:2,pages:{}}),/version 1/);
});
test('native TiddlyWiki imports have only string fields and cannot become executable system tiddlers',()=>{
  const tiddlers=toTiddlers([{title:'$:/modules/evil',body:'<script>window.pwned=true</script>',updated:'2026-10-15',history:[{body:'before',updated:'2026-10-14'}]}]);
  assert.equal(tiddlers[0].type,'text/plain');assert.ok(tiddlers[0].title.startsWith('Imported/'));assert.equal(tiddlers[0]['module-type'],undefined);
  assert.ok(Object.values(tiddlers[0]).every(v=>typeof v==='string'),'TiddlyWiki boot rejects arrays/non-string fields');
  assert.equal(JSON.parse(tiddlers[0]['wikiinajar-history'])[0].body,'before');
});
test('MediaWiki export escapes XML, preserves ordered revisions and rewrites known internal links',()=>{
  const pages=readExchange({format:'wikiinajar-jar',version:1,pages:{'A & <B>':{body:'[[Other|go]]\n<unsafe>&\u0000',updated:'2026-10-15',history:[{body:'first',updated:'2026-10-14'}]},Other:{body:'[[https://example.org|Reference]]'}}});
  const {xml,mapping}=toMediaWiki(pages),doc=new JSDOM(xml,{contentType:'text/xml'}).window.document;
  assert.equal(doc.querySelectorAll('page').length,2);assert.equal(doc.querySelectorAll('revision').length,3);assert.equal(doc.querySelectorAll('origin').length,3);
  assert.equal(doc.querySelector('text').textContent,'first');assert.equal(doc.querySelectorAll('text')[1].textContent,'[[Repository/Other|go]]\n<unsafe>&\uFFFD');
  assert.equal(doc.querySelectorAll('text')[2].textContent,'[https://example.org Reference]');
  assert.match(xml,/&lt;unsafe&gt;&amp;/);assert.equal(mapping.length,2);
  for(const text of doc.querySelectorAll('text'))assert.equal(Number(text.getAttribute('bytes')),Buffer.byteLength(text.textContent));
});
test('MediaWiki source pages are literal, namespace-safe and collision-safe with Unicode titles',()=>{
  const pages=[{title:'A:B',body:'</pre>{{admin}}'},{title:'A_B',body:'second'},{title:'😀'.repeat(400),body:'x'}];
  const mapping=mediaWikiTitles(pages);assert.equal(new Set(mapping.map(m=>m.title)).size,3);
  for(const m of mapping){assert.ok(Buffer.byteLength(m.title)<=255);assert.ok(m.title.startsWith('Repository/'));assert.ok(!m.title.includes(':'));assert.ok(m.title.isWellFormed());}
  const xml=toMediaWiki(pages).xml,doc=new JSDOM(xml,{contentType:'text/xml'}).window.document;
  assert.equal(doc.querySelector('text').textContent,'<pre>&lt;/pre&gt;{{admin}}</pre>');
});
test('vault envelopes use fresh salt/IV, authenticate tampering, and reject wrong passwords',async()=>{
  const data={format:'repository-wiki-vault',version:1,pages:[],files:[]};
  const a=await encryptVault(data,'passphrase with é and 🍃'),b=await encryptVault(data,'passphrase with é and 🍃');assert.notEqual(a,b);
  assert.deepEqual(await decryptVault(a,'passphrase with é and 🍃'),data);await assert.rejects(decryptVault(a,'wrong'));
  const bytes=Buffer.from(a.slice(15),'base64');bytes[35]^=1;await assert.rejects(decryptVault('haiku-vault-v1.'+bytes.toString('base64'),'passphrase with é and 🍃'));
  await assert.rejects(encryptVault(data,''),/no default password/);
});
test('vault import verifies attachment hashes and never publishes a decrypted wallet payload',async()=>{
  await assert.rejects(validateWorkspaceVault([{mnemonic:'sample'}]),/Wallet\/seed/);
  const bytes=Buffer.from('document'),value={format:'repository-wiki-vault',version:1,pages:[],files:[{name:'test.txt',base64:toBase64(bytes),sha256:sha256(bytes)}]};
  assert.equal(await validateWorkspaceVault(value),value);value.files[0].sha256='0'.repeat(64);await assert.rejects(validateWorkspaceVault(value),/digest mismatch/);
});
test('Base64url is a strict encoding adapter, not a Base65 cipher',()=>{
  const bytes=new Uint8Array([0,255,254,252]);const url=toBase64url(bytes);assert.match(url,/^[\w-]+$/);assert.deepEqual(fromBase64url(url),bytes);
  for(const bad of ['a','AA==','A+','AB'])assert.throws(()=>fromBase64url(bad));
});
test('native TiddlyWiki explains the sample, exact-file vault and Drive archive separately',()=>{
  const build=readFileSync(path.join(root,'tools/wiki-workspace/build.mjs'),'utf8');
  const readme=readFileSync(path.join(root,'tools/wiki-workspace/README.md'),'utf8');
  assert.ok(build.includes('[[Sample files and vault]]'));
  assert.ok(build.includes("title:'Sample files and vault'"));
  assert.ok(build.includes('files/tiddlywiki.xdc'));
  assert.ok(build.includes('wiki/media/djvu-smoke.djvu'));
  assert.ok(build.includes("path.join(web,'wiki/djvu-rs')"));
  assert.ok(readme.includes('the full repository sample set remains in the JAR'));
});
