// Lossless expansion of the compact, source-filename snapshot.
export function parseCatalogIndex(text){
 const rows=[],counts={};let letter=null;
 for(const raw of text.split(/\r?\n/)){
  const line=raw.trim();if(!line||line.startsWith('#'))continue;
  if(/^\[[A-Z]\]$/.test(line)){letter=line[1];if(letter in counts)throw Error('Duplicate category '+letter);counts[letter]=0;continue;}
  if(!letter)throw Error('File outside category');
  const title=line.startsWith('!')?line.slice(1):line+' Los Alamos ID.png';
  if(!/\.(png|jpg|jpeg|gif|tif)$/i.test(title))throw Error('Unsupported file '+title);
  rows.push([letter,title]);counts[letter]++;
 }
 return {rows,counts};
}
export function commonsImageURL(title,hash){
 const file=encodeURIComponent(title.replace(/ /g,'_')),base=`${hash[0]}/${hash.slice(0,2)}/${file}`;
 // Original legacy scans are only 130 × 180; avoid unnecessary upscaling.
 if(title.endsWith(' Los Alamos ID.png'))return `https://upload.wikimedia.org/wikipedia/commons/${base}`;
 const thumb=/\.tif$/i.test(title)?`lossy-page1-250px-${file}.jpg`:`250px-${file}`;
 return `https://upload.wikimedia.org/wikipedia/commons/thumb/${base}/${thumb}`;
}
export function mergeCatalog(curated,entries,toRecord){
 const records=new Map(curated.map(r=>[r.id,{...r,curated:true}]));
 for(const row of entries){if(!records.has(row[1]))records.set(row[1],toRecord(row));}
 return [...records.values()];
}
