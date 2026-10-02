import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { parseVRML } from "../public/apps/cia-museum/vrml-engine.js";

const root=path.resolve(import.meta.dirname,"..");
const appDir=path.join(root,"public/apps/cia-museum");
const html=readFileSync(path.join(appDir,"index.html"),"utf8");
const app=readFileSync(path.join(appDir,"app.js"),"utf8");
const engine=readFileSync(path.join(appDir,"vrml-engine.js"),"utf8");

function shapeCount(node){return (!node?0:node.type==="Shape"?1:0)+(node?.children||[]).reduce((n,child)=>n+shapeCount(child),0)}

test("CIA museum app ships a local, dependency-free viewer",()=>{
  for(const file of ["index.html","museum.css","app.js","vrml-engine.js","icon.svg","manifest.toml","models/campus.wrl"])
    assert.ok(existsSync(path.join(appDir,file)),`missing ${file}`);
  assert.match(html,/type="module" src="\.\/app\.js"/);
  assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.doesNotMatch(app,/from\s+["']https?:/);
});

test("all eleven official online exhibits have distinct VRML files",()=>{
  const files=readdirSync(path.join(appDir,"models/exhibits")).filter(f=>f.endsWith(".wrl"));
  assert.equal(files.length,11);
  for(const file of files){
    const text=readFileSync(path.join(appDir,"models/exhibits",file),"utf8");
    assert.match(text,/^#VRML V2\.0 utf8/);
    assert.ok(shapeCount(parseVRML(text))>=5,`${file} has too little modeled geometry`);
  }
  for(const title of ["A-12 OXCART","CIA’s Impact on Technology","CORONA","On the Front Lines","Project AZORIAN","The Canadian Six","Pan Am Flight 103","The Berlin Tunnel","The Coded Ceiling","Hunt for Bin Ladin","Office of Strategic Services"])
    assert.ok(app.includes(title),`missing exhibit: ${title}`);
});

test("the campus model contains buildings, landscape and public landmarks",()=>{
  const text=readFileSync(path.join(appDir,"models/campus.wrl"),"utf8");
  const count=shapeCount(parseVRML(text));
  assert.ok(count>=100,`expected detailed campus geometry, got ${count} shapes`);
  for(const phrase of ["OLD HEADQUARTERS BUILDING","NEW HEADQUARTERS BUILDING","11 EXHIBIT BAYS","KRYPTOS","BERLIN WALL","A-12 OXCART","U-2 RECONNAISSANCE","MEMORIAL WALL","CAMPUS LANDSCAPE"])
    assert.ok(text.includes(phrase),`campus model missing ${phrase}`);
});

test("eight grounds objects have dedicated VRML studies",()=>{
  const files=readdirSync(path.join(appDir,"models/grounds")).filter(f=>f.endsWith(".wrl"));
  assert.equal(files.length,8);
  for(const file of files){
    const text=readFileSync(path.join(appDir,"models/grounds",file),"utf8");
    assert.match(text,/^#VRML V2\.0 utf8/);
    assert.ok(shapeCount(parseVRML(text))>=5,`${file} has too little modeled geometry`);
  }
});

test("three off-campus studies disambiguate Camp Peary, Camp X, and St. Croix Site-X",()=>{
  const files=readdirSync(path.join(appDir,"models/field-sites")).filter(f=>f.endsWith(".wrl"));
  assert.deepEqual(files.sort(),["camp-peary.wrl","camp-x.wrl","site-x-st-croix.wrl"]);
  for(const file of files){
    const text=readFileSync(path.join(appDir,"models/field-sites",file),"utf8");
    assert.match(text,/^#VRML V2\.0 utf8/);
    assert.ok(shapeCount(parseVRML(text))>=5,`${file} has too little modeled geometry`);
  }
  for(const phrase of ["Camp Peary","Camp Perry The Farm AFETA","Camp X / STS 103","Site-X · St. Croix","must not be silently conflated"])
    assert.ok(app.includes(phrase),`missing field-site context: ${phrase}`);
  assert.match(app,/not placed on the Headquarters campus/);
  assert.match(app,/establish(?:es)? a CIA installation/);
});

test("museum status and modeling caveats are explicit",()=>{
  assert.match(html,/VIRTUAL ACCESS ONLY/);
  assert.match(html,/not open to the public/);
  assert.match(html,/conceptual and not suitable for navigation/);
  assert.match(html,/not affiliated with or endorsed/);
  assert.match(app,/MODEL STATUS<\/dt><dd>INTERPRETIVE/);
});

test("both campus and object VRML viewers expose accessible controls",()=>{
  assert.match(html,/id="campus-canvas"[^>]+aria-label=/);
  assert.match(html,/id="object-canvas"[^>]+aria-label=/);
  for(const id of ["reset-view","toggle-spin","toggle-labels","model-source","object-reset","exhibit-source-button"])
    assert.ok(html.includes(`id="${id}"`),`missing control ${id}`);
  assert.match(engine,/ArrowLeft/);
  assert.match(app,/downloadSource/);
});
