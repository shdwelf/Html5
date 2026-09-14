import {seedRecords,recordFromPage,filterRecords} from './los-alamos-data.js';
import {catalogEntries,catalogMetadata} from '../data/project-y/catalog.js';
import {commonsImageURL,mergeCatalog} from './project-y-catalog-utils.js';
const $=id=>document.getElementById(id);
let records=mergeCatalog(seedRecords,catalogEntries,([letter,title,hash])=>({...recordFromPage({title:'File:'+title,imageinfo:[{thumburl:commonsImageURL(title,hash)}]},letter),note:'Source label derived from the Commons filename below; spelling and name order may contain source errors. This file was listed in surname category '+letter+' in the 14 September 2026 snapshot. Identity, dates, and badge number have not been independently verified. Alternate files may depict the same person. Consult the original source for identification and reuse rights.'})),letter='All',savedOnly=false,curatedOnly=false,page=1,mode='montage',visible=[],saved=new Set();
const pageSize=()=> $('page-size').value==='all'?Math.max(1,visible.length):Number($('page-size').value);
try{const ids=JSON.parse(localStorage.getItem('project-y-saved')||'[]');if(Array.isArray(ids))saved=new Set(ids.filter(x=>typeof x==='string'));}catch{}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function picture(r){return `<img src="${escape(r.image)}" alt="${escape(r.name)} — archival badge photograph" loading="lazy"><span class="image-fallback"><b>${escape(r.surname.slice(0,1))}</b>Image unavailable<br>Open record for original source ↗</span>`;}
function bindImages(root){root.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.style.display='none';if(img.nextElementSibling)img.nextElementSibling.style.display='flex';},{once:true}));}
function toggleSave(id){saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('project-y-saved',JSON.stringify([...saved]));}catch{}render();}
function render(){
 visible=filterRecords(curatedOnly?records.filter(r=>r.curated):records,{query:$('search').value,letter,savedOnly,saved,sort:$('sort').value});
 const size=pageSize(),pages=Math.max(1,Math.ceil(visible.length/size));page=Math.min(page,pages);
 $('total').textContent=String(records.length).padStart(2,'0');$('tab-count').textContent=records.length;$('saved-count').textContent=saved.size;
 $('all-tab').classList.toggle('selected',!savedOnly&&!curatedOnly);$('saved-tab').classList.toggle('selected',savedOnly);
 $('curated-tab').classList.toggle('selected',curatedOnly);$('curated-tab').setAttribute('aria-pressed',String(curatedOnly));
 $('all-tab').setAttribute('aria-pressed',String(!savedOnly&&!curatedOnly));$('saved-tab').setAttribute('aria-pressed',String(savedOnly));
 $('result-count').textContent=`${visible.length} ${visible.length===1?'record':'records'}${letter!=='All'?' / '+letter:''} · ${$('sort').selectedOptions[0].textContent}`;
 $('alphabet').innerHTML=['All',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l=>`<button data-letter="${l}" class="${l===letter?'selected':''}" aria-pressed="${l===letter}" aria-label="${l==='All'?'All surnames':'Surnames starting with '+l}">${l}</button>`).join('');
 $('records').className='records '+(mode==='grid'?'':mode);
 $('records').innerHTML=visible.slice((page-1)*size,page*size).map(r=>`<article class="record"><button class="record-image" data-open="${escape(r.id)}" aria-label="View ${escape(r.name)}">${picture(r)}</button><div class="record-info"><span class="badge-tag">${r.badge?'BADGE '+escape(r.badge):'ID NOT TRANSCRIBED'}</span><h3><button data-open="${escape(r.id)}" style="padding:0;text-align:left">${escape(r.name)}</button></h3><div class="record-bottom"><span>${r.curated?'RESEARCHED BADGE':'SOURCE LABEL · UNVERIFIED'}</span><button class="save" data-save="${escape(r.id)}" aria-label="${saved.has(r.id)?'Unsave':'Save'} ${escape(r.name)}" aria-pressed="${saved.has(r.id)}">${saved.has(r.id)?'▣':'▢'}</button></div></div></article>`).join('')||'<div class="empty">No badges match this selection.<button id="reset">Clear search and filters</button></div>';
 $('pagination').innerHTML=pages>1?`<button id="prev" ${page===1?'disabled':''}>← Previous</button><span>Page ${page} of ${pages} · ${(page-1)*size+1}–${Math.min(page*size,visible.length)}</span><button id="next" ${page===pages?'disabled':''}>Next →</button>`:'';
 bindImages($('records'));
}
function openRecord(id){const r=records.find(r=>r.id===id);if(!r)return;
 $('detail-content').innerHTML=`<div>${picture(r)}</div><div><p class="eyebrow">PROJECT Y / PERSONNEL RECORD</p><h2>${escape(r.name)}</h2><span class="badge-tag">${r.badge?'BADGE '+escape(r.badge):'BADGE NUMBER NOT TRANSCRIBED'}</span><p>${escape(r.note)}</p><p class="source-filename"><b>Source filename</b><br>${escape(r.id)}</p>${r.profile?`<section class="research-profile"><h3>Wartime · Project Y</h3><p>${escape(r.profile.wartime)}</p><h3>Postwar · Computing legacy</h3><p>${escape(r.profile.postwar)}</p><h3>Research & sources</h3><ul>${r.profile.references.map(ref=>`<li><a href="${escape(ref.url)}" target="_blank" rel="noopener">${escape(ref.label)} ↗</a></li>`).join('')}</ul></section>`:''}<p>Collection: c. 1943–1947<br>Los Alamos, New Mexico</p><a href="${escape(r.source)}" target="_blank" rel="noopener">View original source & rights information ↗</a><button class="outline" id="detail-save">${saved.has(id)?'Remove from saved badges':'Save this badge'}</button></div>`;
 bindImages($('detail-content'));$('detail-save').onclick=()=>{toggleSave(id);$('detail-save').textContent=saved.has(id)?'Remove from saved badges':'Save this badge';};$('detail').showModal();
}
$('records').onclick=e=>{const open=e.target.closest('[data-open]'),save=e.target.closest('[data-save]');if(open)openRecord(open.dataset.open);if(save)toggleSave(save.dataset.save);if(e.target.id==='reset'){letter='All';savedOnly=false;curatedOnly=false;$('search').value='';page=1;render();}};
$('alphabet').onclick=e=>{if(e.target.dataset.letter){letter=e.target.dataset.letter;page=1;render();}};
$('pagination').onclick=e=>{if(e.target.id==='prev')page--;else if(e.target.id==='next')page++;else return;render();$('collection').scrollIntoView();};
$('search').oninput=$('sort').onchange=$('page-size').onchange=()=>{page=1;render();};
$('all-tab').onclick=()=>{savedOnly=false;curatedOnly=false;page=1;render();};$('curated-tab').onclick=()=>{savedOnly=false;curatedOnly=true;page=1;render();};$('saved-tab').onclick=()=>{savedOnly=true;curatedOnly=false;page=1;render();};
for(const v of ['montage','grid','list'])$(v+'-view').onclick=()=>{mode=v;page=1;for(const m of ['montage','grid','list']){$(m+'-view').classList.toggle('selected',m===v);$(m+'-view').setAttribute('aria-pressed',String(m===v));}render();};
$('close-detail').onclick=()=>$('detail').close();$('detail').onclick=e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('detail').open){e.preventDefault();$('search').focus();}});
$('download').onclick=()=>{const cell=s=>'"'+String(s??'').replace(/"/g,'""')+'"';const csv=[['Source-derived label','Badge identifier','Source','Notes','Source filename','Review status'],...visible.map(r=>[r.name,r.badge,r.source,r.note,r.id,r.curated?'Researched':'Source label — unverified'])].map(row=>row.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='project-y-badges.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const completed=new Set();
async function api(params){const url=new URL('https://commons.wikimedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',origin:'*',...params});const response=await fetch(url,{signal:AbortSignal.timeout(18000)});if(!response.ok)throw Error('Archive request failed');const data=await response.json();if(data.error)throw Error(data.error.info);return data;}
async function loadLetter(l){let continuation={};const imported=[];do{const data=await api({generator:'categorymembers',gcmtitle:'Category:Los Alamos identity badges: '+l,gcmtype:'file',gcmlimit:'50',prop:'imageinfo',iiprop:'url',iiurlwidth:'400',...continuation});for(const p of Object.values(data.query?.pages||{}))imported.push(recordFromPage(p,l));continuation=data.continue;}while(continuation);return imported;}
$('load-all').onclick=async()=>{const button=$('load-all');button.disabled=true;button.textContent='Checking for updates…';let failed=0;
 // Two workers limit load on Commons. Completed categories survive retries.
 const queue=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(l=>!completed.has(l));
 async function worker(){while(queue.length){const l=queue.shift();try{const additions=await loadLetter(l);const ids=new Set(records.map(r=>r.id));for(const r of additions)if(!ids.has(r.id)){records.push(r);ids.add(r.id);}completed.add(l);render();}catch{failed++;if(failed>=2)queue.length=0;}$('load-status').textContent=`${completed.size}/26 surname categories loaded · ${records.length} files available${failed?' · Some requests failed':''}.`;}}
 await Promise.all([worker(),worker()]);button.disabled=false;
 if(failed){button.textContent='Retry update ↗';$('load-status').textContent=`Update incomplete: ${completed.size}/26 categories checked. The bundled 1404-file index remains available (${records.length} files currently loaded). Commons could not be reached for some categories; retry when connected.`;}else{button.textContent='Archive update complete ✓';button.disabled=true;$('load-status').textContent=`All 26 surname categories checked. ${records.length} available files, including alternate scans. This is a public image collection, not a complete Manhattan Project roster.`;}
};
render();
$('load-status').textContent=`${catalogMetadata.fileCount.toLocaleString()} source files indexed locally · snapshot ${catalogMetadata.retrieved}. Names and source links do not require the Commons API; non-bundled photographs need internet access.`;

$('open-montage-reference').onclick=()=>$('montage-reference').showModal();
$('close-montage-reference').onclick=()=>$('montage-reference').close();
$('reference-zoom').oninput=()=>{const value=$('reference-zoom').value;$('reference-image').style.width=value+'%';$('reference-zoom-value').value=value+'%';};
