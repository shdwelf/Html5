import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {BROWSER_STORAGE_FILTER} from '../tools/wiki-workspace/tiddlywiki/config.mjs';
import {toTiddlers} from '../tools/wiki-workspace/exchange.mjs';
const require=createRequire(import.meta.url);

test('actual TiddlyWiki filter persists changes, not every source page or quota-alert tiddlers',()=>{
  const tw=require('tiddlywiki').TiddlyWiki();tw.boot.argv=['--version'];tw.boot.boot();
  tw.wiki.addTiddler({title:'Unchanged source',text:'must not be autosaved'});
  tw.wiki.addTiddler({title:'Changed note',text:'save this'});
  const filter=tw.wiki.compileFilter(BROWSER_STORAGE_FILTER);
  const actual=filter(iterator=>{
    for(const title of ['Changed note','Deleted note','$:/state/keep','$:/state/popup/skip','$:/temp/alerts/quota','$:/status/RepositorySync'])iterator(tw.wiki.getTiddler(title),title);
  });
  // TiddlyWiki compiles modules in its own vm realm; compare primitive entries in this realm.
  assert.deepEqual(Array.from(actual),['Changed note','Deleted note','$:/state/keep']);
});
test('portable previews are bounded and labelled without altering the vault source hash or splitting UTF-8',()=>{
  const source={title:'Repo/A/a.txt',path:'a.txt',repo:'A',body:'é'.repeat(10000),mime:'text/plain',sha256:'0'.repeat(64),id:'1'.repeat(64),truncated:false,links:[],backlinks:[],references:[]};
  const [t]=toTiddlers([source],{maxSourceBytes:513});
  assert.match(t.text,/Native TiddlyWiki preview truncated/);assert.ok(!t.text.includes('\uFFFD'));assert.ok(Buffer.byteLength(t.text)<650);
  assert.equal(t['source-truncated'],'true');assert.equal(t['source-sha256'],source.sha256);
  assert.ok(Object.values(t).every(v=>typeof v==='string'));
  assert.equal(toTiddlers([source])[0].text,source.body,'JSON exchange keeps the larger library preview');
});
