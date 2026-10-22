import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const script=readFileSync(new URL('../tools/wiki-workspace/tiddlywiki/webxdc.js',import.meta.url),'utf8');
function client() {
  const db=new Map([['Note',{fields:{title:'Note',type:'text/plain',text:'base'}}]]),sent=[];let listener,changed;
  const wiki={getTiddler:t=>db.get(t),each:fn=>db.forEach((t,title)=>fn(t,title)),addEventListener:(_n,fn)=>{changed=fn;},
    addTiddler(value){const f=value.fields||value;db.set(f.title,{fields:f});},deleteTiddler(title){db.delete(title);}};
  function Tiddler(...values){this.fields=Object.assign({},...values.filter(Boolean).map(v=>v.fields||v));}
  const sandbox={exports:{},TextEncoder,Map,window:{webxdc:{selfAddr:'test@chat',sendUpdate:u=>sent.push(u),setUpdateListener:fn=>{listener=fn;}}},$tw:{wiki,Tiddler}};
  vm.runInNewContext(script,sandbox);sandbox.exports.startup();
  return {db,sent,receive:u=>listener(u),flush:title=>changed({[title]:{modified:true}}),edit(title,text,type='text/plain'){wiki.addTiddler({title,type,text});changed({[title]:{modified:true}});}};
}
test('TiddlyWiki Webxdc sends only bounded non-system notes, with an explicit base',()=>{
  const c=client();c.edit('Note','local');assert.equal(c.sent.length,1);assert.equal(c.sent[0].payload.repositoryWiki.base,'base');
  c.edit('$:/modules/attack','evil','application/javascript');c.edit('Large','x'.repeat(25000));c.edit('Module','evil','application/javascript');
  assert.equal(c.sent.length,1);assert.match(c.db.get('$:/status/RepositorySync').fields.text,/plain text/);
});
test('remote updates preserve concurrent edits and replay does not generate echo messages',()=>{
  const c=client();c.edit('Note','local');
  c.receive({serial:17,payload:{repositoryWiki:{version:1,title:'Note',text:'remote',base:'base'}}});
  assert.equal(c.db.get('Note').fields.text,'local');assert.equal(c.db.get('Conflict/17/Note').fields.text,'remote');
  c.flush('Conflict/17/Note');assert.equal(c.sent.length,1);
  c.receive({serial:17,payload:{repositoryWiki:{version:1,title:'Note',text:'remote',base:'base'}}});
  assert.equal([...c.db.keys()].filter(k=>k.startsWith('Conflict/')).length,1);
});
test('remote code/system tiddlers are rejected; accepted notes are plain text and deletions conflict safely',()=>{
  const c=client();
  c.receive({serial:1,payload:{repositoryWiki:{version:1,title:'$:/evil',text:'code',base:null}}});assert.equal(c.db.has('$:/evil'),false);
  c.receive({serial:2,payload:{repositoryWiki:{version:1,title:'New',text:'<script>evil()</script>',base:null}}});
  assert.equal(c.db.get('New').fields.type,'text/plain');c.flush('New');assert.equal(c.sent.length,0);
  c.edit('Note','changed');c.receive({serial:3,payload:{repositoryWiki:{version:1,title:'Note',text:null,base:'base'}}});
  assert.equal(c.db.get('Note').fields.text,'changed');assert.match(c.db.get('Conflict/3/Note').fields.text,/deletion/);
});
