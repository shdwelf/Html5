import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sites,toVRML} from '../js/project-y-sites-data.js';
test('three researched sites have citations and explicit schematic limits',()=>{
 assert.deepEqual(sites.map(s=>s.id),['los-alamos','hanford','trinity']);
 for(const s of sites){assert.ok(s.sources.length>=2);assert.ok(s.interpretation);assert.ok(s.context);assert.ok(s.objects.length>5);for(const o of s.objects){assert.ok(o.size.every(v=>Number.isFinite(v)&&v>0));assert.ok(o.position.every(Number.isFinite));assert.ok(o.rotation.every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...o.rotation.slice(0,3))-1)<1e-8);}}
});
test('checked-in VRML exactly matches the shared Three.js geometry',()=>{
 for(const s of sites){const text=toVRML(s);assert.equal(readFileSync(new URL('../models/project-y/'+s.id+'.wrl',import.meta.url),'utf8'),text);assert.ok(text.startsWith('#VRML V2.0 utf8\n'));assert.equal((text.match(/geometry Box/g)||[]).length,s.objects.length);assert.match(text,/not a survey/);assert.match(text,/https:\/\//);assert.equal((text.match(/{/g)||[]).length,(text.match(/}/g)||[]).length);assert.equal((text.match(/\[/g)||[]).length,(text.match(/\]/g)||[]).length);}
});
test('Trinity separates historical height from invented placement',()=>{
 const s=sites.find(s=>s.id==='trinity');assert.match(s.interpretation,/30.48/);assert.match(s.interpretation,/displaced inset/);assert.match(s.summary,/July 16, 1945/);assert.equal(s.objects.filter(o=>o.name==='Tower leg').length,4);
});
