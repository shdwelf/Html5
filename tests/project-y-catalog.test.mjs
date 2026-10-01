import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalogEntries,catalogMetadata} from '../data/project-y/catalog.js';
import {parseCatalogIndex,commonsImageURL,mergeCatalog,annotateVariants,variantKeyForRecord} from '../js/project-y-catalog-utils.js';
import {seedRecords,recordFromPage,filterRecords} from '../js/los-alamos-data.js';
const raw=readFileSync(new URL('../data/project-y/commons-index.txt',import.meta.url),'utf8');
const records=annotateVariants(mergeCatalog(seedRecords,catalogEntries,([letter,title,hash])=>recordFromPage({title:'File:'+title,imageinfo:[{url:commonsImageURL(title,hash)}]},letter)));
test('full reviewed snapshot covers 26 categories and 1404 distinct source files',()=>{
 const parsed=parseCatalogIndex(raw);assert.equal(parsed.rows.length,1404);assert.deepEqual(parsed.counts,catalogMetadata.categoryCounts);assert.equal(Object.keys(parsed.counts).length,26);assert.equal(parsed.counts.X,0);assert.equal(new Set(catalogEntries.map(r=>r[1])).size,1404);assert.equal(catalogMetadata.fileCount,1404);
 assert.deepEqual(catalogEntries.map(r=>r.slice(0,2)),parsed.rows);
});
test('every image path derives from its exact canonical filename',()=>{
 for(const [letter,title,hash] of catalogEntries){assert.match(letter,/^[A-Z]$/);assert.equal(hash,createHash('md5').update(title.replace(/ /g,'_')).digest('hex'));assert.ok(commonsImageURL(title,hash).startsWith('https://upload.wikimedia.org/wikipedia/commons/'));}
 const opp=catalogEntries.find(r=>r[1]==='J. R. Oppenheimer Los Alamos ID.jpg');assert.match(commonsImageURL(opp[1],opp[2]),/\/7\/73\//);
 const tif=catalogEntries.find(r=>r[1].endsWith('.tif'));assert.match(commonsImageURL(tif[1],tif[2]),/lossy-page1-250px-.*\.tif\.jpg$/);
});
test('curated records are retained once without assigning IDs to new files',()=>{
 assert.equal(records.length,1404);assert.equal(records.filter(r=>r.curated).length,7);
 assert.equal(records.filter(r=>r.badge).length,7);
 const met=records.find(r=>r.id==='Metropolis-nicholas.jpg');assert.equal(met.badge,'G-15');assert.ok(met.profile);assert.equal(met.image,'assets/los-alamos/metropolis.jpg');
 const mary=records.find(r=>r.id==='Frankel-mary p.jpg');assert.equal(mary.badge,null);assert.equal(mary.name,'Mary P Frankel');
});
test('all categories and lesser-known source labels are searchable immediately',()=>{
 assert.equal(filterRecords(records,{letter:'Z'}).length,4);assert.equal(filterRecords(records,{letter:'A'}).length,59);
 for(const query of ['Eldred','Mary P. Frankel','Donaciano Gonzales','Naomi','Segrè','Viki','McKibbin'])assert.ok(filterRecords(records,{query}).length>0,query);
 assert.equal(filterRecords(records,{query:'G15'}).length,1);
 const az=filterRecords(records);assert.equal(az[0].letter,'A');assert.equal(az.at(-1).letter,'Z');
});

test('filename variation groups expose alternate source files without assigning badge IDs',()=>{
 assert.equal(records.filter(r=>r.variantCount>1).length,283);
 const feynman=records.filter(r=>r.variantKey==='feynman|richard');
 assert.equal(feynman.length,7);assert.ok(feynman.some(r=>r.id.includes("Feynman's badge photo")));
 assert.ok(feynman.every(r=>r.badge===null||r.badge==='I-11'));
 const opp=records.filter(r=>r.variantKey==='oppenheimer|j robert');
 assert.equal(opp.length,5);assert.ok(opp.some(r=>r.id==='Oppenheimer Los Alamos mugshot.jpg'));
 const david=records.find(r=>r.id==='David L. Anderson Los Alamos ID.png');
 assert.equal(david.name,'David L. Anderson');assert.equal(david.variantCount,1);assert.equal(variantKeyForRecord(david),'anderson|david');
 const met=records.filter(r=>r.variantKey==='metropolis|nicholas');
 assert.equal(met.length,3);assert.ok(met.some(r=>r.id==='Metropolis Nicholas Badge.gif'));
});
