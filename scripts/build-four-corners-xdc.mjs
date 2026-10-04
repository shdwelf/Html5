/** Build the Four Corners offline Webxdc. The data module is generated from the
 * existing SoCal ADL/GNIS and Cheyenne GNIS registers so the two apps cannot
 * silently drift apart. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { zipSync } = await import('fflate').catch(()=>import('../vendor/fflate/index.mjs'));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'public/apps/four-corners'); const mtime=new Date('2026-10-04T00:00:00Z');
const { GAZ_ROWS }=await import('../js/socal-gazetteer-data.js');
const { GAZETTEER }=await import('../js/cheyenne-data.js');
const places=[...GAZ_ROWS.map(r=>({name:r[0],kind:r[1],region:r[3],lat:r[4],lon:r[5],tier:r[8]?'official':'curated',source:'SoCal Subsurface / USGS GNIS'})),...Object.entries(GAZETTEER).flatMap(([plate,rows])=>rows.map(r=>({name:r[0],lon:r[1],lat:r[2],kind:r[3],region:plate==='chey'?'Cheyenne / Colorado':'Angeles / California',tier:'official',source:'Cheyenne / Angeles / USGS GNIS'})))];
const data=`export const PLACES=${JSON.stringify(places)};\nexport const SATELLITES=${JSON.stringify([
{name:'Sentinel-1A / 1C',platform:'ESA Copernicus C-SAR',altitude:693,repeat:6,window:'~18:00 local ascending node',status:'Two-satellite constellation; six-day revisit when both are operational.'},
{name:'NISAR',platform:'NASA / ISRO L+S SAR',altitude:747,repeat:12,window:'~18:00 local ascending node',status:'Nominal repeat geometry; calendar date requires an observed anchor.'},
{name:'Landsat 8 / 9',platform:'NASA / USGS optical + thermal',altitude:705,repeat:8,window:'~10:11–10:12 local descending node',status:'Eight-day pair cadence on the WRS-2 grid.'}
])};\nexport const LAUNCHES=${JSON.stringify([
{name:'SDA Tranche 1 Transport Layer A',date:'NET 2026-10-05',site:'Vandenberg SFB · SLC-4E',window:'08:17 UTC target; subject to range/weather',status:'schedule listing; confirm with VSFB / operator'},
{name:'Starlink Group 15-25',date:'NET 2026-10-10',site:'Vandenberg SFB',window:'23:00 UTC listing; subject to change',status:'schedule listing; confirm with operator'},
{name:'Vandenberg launch cadence',date:'2026',site:'California western range',window:'Opportunities are mission-specific, not a public guarantee',status:'planning note; no access or viewing implied'}
])};\nexport const DEM_SAMPLES=${JSON.stringify([
{state:'Utah',place:'Four Corners boundary / San Juan plateau',lat:37,lon:-109,seedM:null},
{state:'Colorado',place:'Pikes Peak GNIS / local 3DEP control',lat:38.8406,lon:-105.0449,seedM:4298.8},
{state:'Arizona',place:'Grand Canyon South Rim Gazetteer anchor',lat:36.0544,lon:-112.1401,seedM:null},
{state:'Nevada',place:'Charleston Peak GNIS anchor',lat:36.2716,lon:-115.6956,seedM:null}
])};`;
await rm(outDir,{recursive:true,force:true}); await mkdir(outDir,{recursive:true});
let html=await readFile(path.join(root,'four-corners.html'),'utf8'); html=html.replace('./four-corners.js','./four-corners.js'); await writeFile(path.join(outDir,'index.html'),html);
await cp(path.join(root,'four-corners.css'),path.join(outDir,'four-corners.css')); await cp(path.join(root,'four-corners.js'),path.join(outDir,'four-corners.js')); await writeFile(path.join(outDir,'four-corners-data.js'),data); await writeFile(path.join(outDir,'webxdc.js'),`window.webxdc=window.webxdc||{sendUpdate(){},setUpdateListener:async()=>0,getAllUpdates:async()=>[]};`); await writeFile(path.join(outDir,'manifest.toml'),'name = "Four Corners · Gazetteer + Orbit"\nsource_code_url = "https://github.com/shdwelf/Html5"\n'); await cp(path.join(root,'icon.png'),path.join(outDir,'icon.png')); await cp(path.join(root,'docs/source-check-four-corners-2026-10-04.md'),path.join(outDir,'source-check.md'));
const files={}; for(const f of ['index.html','four-corners.css','four-corners.js','four-corners-data.js','webxdc.js','manifest.toml','icon.png','source-check.md']) files[f]=[new Uint8Array(await readFile(path.join(outDir,f))),{level:9,mtime}]; const bytes=zipSync(files,{level:9,mtime}); await writeFile(path.join(root,'four-corners.xdc'),bytes); await mkdir(path.join(root,'dist'),{recursive:true}); await writeFile(path.join(root,'dist/four-corners.xdc'),bytes); console.log(`Webxdc: four-corners.xdc (${bytes.length} bytes, ${places.length} synced places)`); console.log(`sha256: ${createHash('sha256').update(bytes).digest('hex')}`);
