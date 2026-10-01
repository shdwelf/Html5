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

const variantKeyOverrides={
 'J. R. Oppenheimer Los Alamos ID.jpg':'oppenheimer|j robert',
 'J. R. Oppenheimer Los Alamos ID.png':'oppenheimer|j robert',
 'Oppenheimer Los Alamos mugshot.jpg':'oppenheimer|j robert',
 'Oppenheimer-j r ID badge.jpg':'oppenheimer|j robert',
 'Oppenheimer-j r.jpg':'oppenheimer|j robert',
};
function alpha(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function nameWords(value){return alpha(String(value||'').replace(/\([^)]*\)/g,' ')).split(/\s+/).filter(Boolean);}
export function variantKeyForRecord(record){
 if(!record)return null;
 if(variantKeyOverrides[record.id])return variantKeyOverrides[record.id];
 const surnameWords=nameWords(record.surname),surname=surnameWords.at(-1);
 if(!surname)return null;
 const words=nameWords(record.name).filter(w=>!['jr','sr','ii','iii'].includes(w));
 const last=words.at(-1);
 if(last!==surname)return null;
 let given=words.slice(0,-1);
 if(!given.length)return null;
 const hasFull=given.some(w=>w.length>1);
 if(hasFull)given=given.filter((w,i)=>w.length>1||i===0&&given.length===1);
 if(!given.length)return null;
 return `${surname}|${given.join(' ')}`;
}
export function annotateVariants(records){
 const keyed=records.map(record=>({...record,variantKey:variantKeyForRecord(record),variantCount:1,variantIndex:1,variantLabel:''}));
 const groups=new Map();
 for(const record of keyed){if(!record.variantKey)continue;if(!groups.has(record.variantKey))groups.set(record.variantKey,[]);groups.get(record.variantKey).push(record);}
 for(const group of groups.values()){
  if(group.length<2)continue;
  group.sort((a,b)=>(a.curated===b.curated?0:a.curated?-1:1)||a.id.localeCompare(b.id));
  group.forEach((record,index)=>{record.variantCount=group.length;record.variantIndex=index+1;record.variantLabel=`${group.length} source-file variants`;});
 }
 return keyed;
}
