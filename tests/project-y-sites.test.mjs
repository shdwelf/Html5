import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sites,toVRML,yieldPresets} from '../js/project-y-sites-data.js';

test('researched site sequence has citations and explicit schematic limits',()=>{
 assert.deepEqual(sites.map(s=>s.id),['los-alamos','oak-ridge','hanford','trinity','ivy-mike','castle-bravo']);
 for(const s of sites){
  assert.ok(s.sources.length>=2,`${s.id} has sources`);
  assert.ok(s.interpretation,`${s.id} has interpretation notes`);
  assert.ok(s.context,`${s.id} has consequence context`);
  assert.ok(s.dem?.source,`${s.id} has DEM overlay caveat`);
  assert.ok(Number.isFinite(s.yieldKt)&&s.yieldKt>0,`${s.id} has comparison yield`);
  assert.ok(s.objects.length>5,`${s.id} has enough primitives`);
  for(const o of s.objects){
   assert.ok(o.size.every(v=>Number.isFinite(v)&&v>0),`${s.id}/${o.name} has valid size`);
   assert.ok(o.position.every(Number.isFinite),`${s.id}/${o.name} has valid position`);
   assert.ok(o.rotation.every(Number.isFinite),`${s.id}/${o.name} has valid rotation`);
   assert.ok(Math.abs(Math.hypot(...o.rotation.slice(0,3))-1)<1e-8,`${s.id}/${o.name} rotation axis is unit length`);
  }
 }
});

test('checked-in VRML exactly matches the shared Three.js geometry',()=>{
 for(const s of sites){
  const text=toVRML(s);
  assert.equal(readFileSync(new URL('../models/project-y/'+s.id+'.wrl',import.meta.url),'utf8'),text);
  assert.ok(text.startsWith('#VRML V2.0 utf8\n'));
  assert.equal((text.match(/geometry Box/g)||[]).length,s.objects.length);
  assert.match(text,/not a survey/);
  assert.match(text,/https:\/\//);
  assert.equal((text.match(/{/g)||[]).length,(text.match(/}/g)||[]).length);
  assert.equal((text.match(/\[/g)||[]).length,(text.match(/\]/g)||[]).length);
 }
});

test('Trinity separates historical height from invented placement',()=>{
 const s=sites.find(s=>s.id==='trinity');
 assert.match(s.interpretation,/30.48/);
 assert.match(s.interpretation,/displaced inset/);
 assert.match(s.summary,/July 16, 1945/);
 assert.equal(s.objects.filter(o=>o.name==='Tower leg').length,4);
});

test('Ivy Mike and Castle Bravo correction is explicit',()=>{
 const ivy=sites.find(s=>s.id==='ivy-mike');
 const bravo=sites.find(s=>s.id==='castle-bravo');
 assert.equal(ivy.yieldKt,10400);
 assert.match(ivy.summary,/10\.4 megatons/);
 assert.match(ivy.interpretation,/Silly Putty.*unrelated/);
 assert.equal(bravo.yieldKt,15000);
 assert.match(bravo.summary,/lithium-7/);
 assert.match(bravo.interpretation,/cube-root yield/);
 assert.ok(yieldPresets.some(p=>p.id==='castle-bravo-expected'&&p.kt===6000));
});
