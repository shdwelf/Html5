import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, copyFileSync, symlinkSync } from 'node:fs';
import { createServer } from 'node:net';
import { request as httpRequest } from 'node:http';
import { once } from 'node:events';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { ROOT, javaTool } from '../tools/wiki-workspace/deps.mjs';
import { sha256 } from '../tools/wiki-workspace/catalog.mjs';
import { encryptVault } from '../tools/wiki-workspace/web/vault.mjs';

async function freePort() { const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const port=s.address().port;await new Promise(r=>s.close(r));return port; }
async function launch(jar,cwd,token) {
  const port=await freePort(),env={...process.env};delete env.WIKI_WRITE_TOKEN;if(token)env.WIKI_WRITE_TOKEN=token;
  const child=spawn(javaTool('java'),['-jar',jar,'--port',String(port),'--bind','127.0.0.1','--data',path.join(cwd,'data')],{cwd,env,stdio:['ignore','pipe','pipe']});
  let output='';
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Java startup timeout: '+output));},12000);
    const receive=chunk=>{output+=chunk;if(output.includes('is listening.')){clearTimeout(timer);resolve();}};
    child.stdout.on('data',receive);child.stderr.on('data',receive);
    child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);reject(new Error('Java exited '+code+': '+output));});
  });
  return {port,base:`http://127.0.0.1:${port}`,async stop(){if(child.exitCode!==null)return;const done=once(child,'exit');child.kill('SIGTERM');await done;}};
}
function rawGet(port,p) {
  return new Promise((resolve,reject)=>{httpRequest({hostname:'127.0.0.1',port,path:p,method:'GET'},res=>{let body='';res.on('data',b=>body+=b);res.on('end',()=>resolve({status:res.statusCode,body}));}).on('error',reject).end();});
}
test('real executable JAR: ACME HTTP, safe vault routes, atomic revisions, restart and edition landings',
  {skip:process.env.WIKI_JAR_INTEGRATION!=='1',timeout:120000},async t=>{
    mkdirSync(path.join(ROOT,'.cache'),{recursive:true});
    const dir=mkdtempSync(path.join(ROOT,'.cache/wiki-server-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
    const original=path.join(ROOT,'dist/wiki-fixture'),jar=path.join(dir,'more.wiki.in.a.jar');copyFileSync(path.join(original,'more.wiki.in.a.jar'),jar);
    // Run from an otherwise empty directory, not the checkout; the snapshot must be inside the JAR.
    const token=randomBytes(32).toString('base64url'),headers={Authorization:'Bearer '+token};
    let server=await launch(jar,dir,token);t.after(async()=>server.stop());
    const get=(p,options={})=>fetch(server.base+p,{redirect:'manual',...options});
    const caps=await (await get('/api/capabilities')).json();assert.equal(caps.server,'ACME/TJWS');assert.equal(caps.writable,true);
    const landing=await get('/');assert.equal(landing.status,302);assert.equal(landing.headers.get('location'),'/library/index.html');
    assert.match(await (await get('/library/index.html')).text(),/Everything has/);
    const catalog=await (await get('/repository.json')).json();assert.equal(catalog.totals.pages,5);
    const page=catalog.pages.find(p=>p.path==='README.md'),binary=catalog.pages.find(p=>p.path.endsWith('boy.djvu'));
    const first=await get('/api/pages/'+page.id),etag=first.headers.get('etag'),source=await first.text();assert.ok(etag);assert.match(source,/bip39/);
    const head=await get('/api/pages/'+page.id,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('etag'),etag);
    const file=await get('/vault/'+page.sha256);assert.match(file.headers.get('content-disposition'),/^attachment/);assert.equal(file.headers.get('content-type'),'application/octet-stream');
    assert.equal(sha256(Buffer.from(await file.arrayBuffer())),page.sha256);
    const image=await get('/media/'+binary.sha256);assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/image\/vnd.djvu/);
    assert.equal((await get('/media/'+page.sha256)).status,404);
    assert.equal((await get('/wiki/djvu-rs/scalar/djvu_rs_bg.wasm')).headers.get('content-type'),'application/wasm');
    assert.equal((await get('/wiki/media/demo.png')).headers.get('content-type'),'image/png');
    assert.match(await (await get('/tiddlywiki.html')).text(),/"title":"Repository Home"/);
    assert.match(await (await get('/wiki/index.html')).text(),/calendarCreate/);
    assert.equal((await get('/api/capabilities',{method:'POST'})).status,405);
    const options=await get('/tiddlywiki.html',{method:'OPTIONS'});assert.equal(options.status,204);assert.equal(options.headers.has('dav'),false);assert.equal(options.headers.get('allow'),'GET, HEAD, OPTIONS');
    for(const p of ['/..%2f..%2f.git/config','/%2e%2e/.env','/vault/%252e%252e/.env','/vault/%5c..%5cfile','/%00','/META-INF/MANIFEST.MF','/.wiki-data','/library/../../.git/config','/org/html5/wiki/WikiServer.class']) {
      const r=await rawGet(server.port,p);assert.ok([400,404].includes(r.status),p+': '+r.status);
    }
    const endpoint='/api/pages/'+page.id;
    assert.equal((await get(endpoint,{method:'PUT',body:'unauthorized',headers:{'If-Match':etag}})).status,401);
    assert.equal((await get(endpoint,{method:'PUT',body:'missing condition',headers})).status,428);
    assert.equal((await get(endpoint,{method:'PUT',body:'CSRF',headers:{...headers,'If-Match':etag,Origin:'https://evil.example'}})).status,403);
    assert.equal((await get(endpoint,{method:'PUT',body:Buffer.from([255]),headers:{...headers,'If-Match':etag}})).status,400);
    assert.equal((await get(endpoint,{method:'PUT',body:'x'.repeat(1024*1024+1),headers:{...headers,'If-Match':etag}})).status,413);
    const results=await Promise.all(['first edit','concurrent edit'].map(body=>get(endpoint,{method:'PUT',body,headers:{...headers,'If-Match':etag}})));
    assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
    const current=await get(endpoint),currentTag=current.headers.get('etag'),saved=await current.text();assert.ok(['first edit','concurrent edit'].includes(saved));
    let history=await (await get('/api/history/'+page.id)).json();assert.equal(history.length,2);assert.equal(history[0].parent,history[1].revision);
    assert.equal(await (await get('/api/revisions/'+page.id+'/'+history[1].revision)).text(),source);
    const envelope=await encryptVault({format:'repository-wiki-vault',version:1,pages:[],files:[]},'test-only passphrase'),hash=sha256(envelope);
    assert.equal((await get('/api/vault/'+hash,{method:'PUT',body:envelope,headers})).status,201);
    assert.equal((await get('/api/vault/'+hash)).status,401);
    assert.equal(await (await get('/api/vault/'+hash,{headers})).text(),envelope);
    assert.equal((await get('/api/vault/'+'0'.repeat(64),{method:'PUT',body:envelope,headers})).status,400);
    const malformed='haiku-vault-v1.not base64';assert.equal((await get('/api/vault/'+sha256(malformed),{method:'PUT',body:malformed,headers})).status,400);
    const symlinkHash='1'.repeat(64);symlinkSync(path.join(dir,'more.wiki.in.a.jar'),path.join(dir,'data/vault/'+symlinkHash+'.haikuvault'));
    assert.equal((await get('/api/vault/'+symlinkHash,{headers})).status,500);
    await server.stop();server=await launch(jar,dir,token);
    const restarted=await get(endpoint);assert.equal(restarted.headers.get('etag'),currentTag);assert.equal(await restarted.text(),saved);
    assert.equal(await (await get('/api/vault/'+hash,{headers})).text(),envelope);
    assert.equal((await get(endpoint,{method:'PUT',body:source,headers:{...headers,'If-Match':currentTag}})).status,201);
    history=await (await get('/api/history/'+page.id)).json();assert.equal(history.length,3);
    await server.stop();server=await launch(jar,dir,undefined);
    assert.equal((await (await get('/api/capabilities')).json()).writable,false);
    assert.equal((await get(endpoint,{method:'PUT',body:'read-only',headers:{...headers,'If-Match':etag}})).status,403);
    assert.equal((await get('/api/vault/'+hash,{headers})).status,403);
    await server.stop();
    for(const [name,location] of [['wiki.in.a.jar','/wiki/index.html'],['tiddlywiki.in.a.jar','/tiddlywiki.html']]) {
      const edition=path.join(dir,name);copyFileSync(path.join(original,name),edition);server=await launch(edition,dir,undefined);
      assert.equal((await get('/')).headers.get('location'),location);await server.stop();
    }
});
