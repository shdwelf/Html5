import {seedRecords,recordFromPage,filterRecords} from './los-alamos-data.js';
import {catalogEntries,catalogMetadata} from '../data/project-y/catalog.js';
import {commonsImageURL,mergeCatalog,annotateVariants} from './project-y-catalog-utils.js';
import {initPipWm} from './project-y-4dwm.js';
import {sites,modelDisclaimer} from './project-y-sites-data.js';
const $=id=>document.getElementById(id);
let records=annotateVariants(mergeCatalog(seedRecords,catalogEntries,([letter,title,hash])=>({...recordFromPage({title:'File:'+title,imageinfo:[{thumburl:commonsImageURL(title,hash)}]},letter),note:'Source label derived from the Commons filename below; spelling and name order may contain source errors. This file was listed in surname category '+letter+' in the 14 September 2026 snapshot. Identity, dates, and badge number have not been independently verified. Alternate files may depict the same person. Consult the original source for identification and reuse rights.'}))),letter='All',savedOnly=false,curatedOnly=false,variantsOnly=false,page=1,mode='montage',visible=[],saved=new Set();
const pageSize=()=> $('page-size').value==='all'?Math.max(1,visible.length):Number($('page-size').value);
try{const ids=JSON.parse(localStorage.getItem('project-y-saved')||'[]');if(Array.isArray(ids))saved=new Set(ids.filter(x=>typeof x==='string'));}catch{}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const siteRecords=sites.map(site=>({...site,id:'site:'+site.id,siteId:site.id,kind:'site',surname:site.region,badge:null}));
const siteRecord=id=>siteRecords.find(s=>s.siteId===id||s.id===id);
const allSitePipIds=siteRecords.map(s=>s.id);
function picture(r){return `<img src="${escape(r.image)}" alt="${escape(r.name)} — archival badge photograph" loading="lazy"><span class="image-fallback"><b>${escape(r.surname.slice(0,1))}</b>Image unavailable<br>Open record for original source ↗</span>`;}
function bindImages(root){root.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.style.display='none';if(img.nextElementSibling)img.nextElementSibling.style.display='flex';},{once:true}));}
function toggleSave(id){saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('project-y-saved',JSON.stringify([...saved]));}catch{}render();}
function tabRecords(){return curatedOnly?records.filter(r=>r.curated):variantsOnly?records.filter(r=>r.variantCount>1):records;}
function variantBadge(r){return r.variantCount>1?`<span class="variant-tag" title="Filename-based variation group; not an identity merge">${r.variantCount} variants</span>`:'';}
function variantPeers(r){return r.variantKey?records.filter(x=>x.variantKey===r.variantKey&&x.id!==r.id):[];}
function variantPanel(r){const peers=variantPeers(r);return peers.length?`<section class="variation-panel"><h3>Source-file variations</h3><p>${r.variantCount} files in this filename-based group. Treat these as alternate source records until each image is checked; no badge number or identity is inferred from the grouping.</p><div>${peers.map(peer=>`<button data-variant-open="${escape(peer.id)}"><b>${escape(peer.name)}</b><small>${escape(peer.id)}</small></button>`).join('')}</div></section>`:'';}
function siteDetailHtml(site){
 return `<div class="site-pip-card"><p class="eyebrow">NUCLEAR RESEARCH SITE / ${escape(site.region)} / ${escape(site.period)}</p><h2>${escape(site.name)}</h2><span class="site-role">${escape(site.role)}</span><p>${escape(site.summary)}</p><h3>People & consequences</h3><p>${escape(site.context)}</p><h3>Reading the model</h3><p>${escape(site.interpretation)}</p><h3>Landmarks</h3><ul>${site.landmarks.map(([name,note])=>`<li><b>${escape(name)}</b> — ${escape(note)}</li>`).join('')}</ul><p class="fineprint">${escape(modelDisclaimer)} “All represented sites” opens the selected sites in this exhibit, not every Manhattan Project, AEC, supplier, proving-ground, or cleanup facility.</p><div class="site-pip-actions"><button class="outline" data-site-select="${escape(site.siteId)}">Switch 3D viewer to this site</button><a class="outline" href="models/project-y/${escape(site.siteId)}.wrl" download>Download .wrl ↓</a></div><h3>Sources</h3>${site.sources.map(([name,url])=>`<a href="${escape(url)}" target="_blank" rel="noopener">${escape(name)} ↗</a>`).join('')}<a href="docs/project-y-sites.md">Complete site notes ↗</a></div>`;
}
function findPipRecord(id){return records.find(r=>r.id===id)||siteRecord(id);}
function pipTitle(r){return r.kind==='site'?`${escape(r.name)} <i>${escape(r.tag||r.role)}</i>`:`${escape(r.name)} <i>${r.badge?'BADGE '+escape(r.badge):'ID UNTRANSCRIBED'}</i>`;}
function pipChip(r){return r.kind==='site'?{top:escape(r.name.toUpperCase().slice(0,8)),sub:'SITE'}:{top:escape((r.surname||r.name).slice(0,8).toUpperCase()),sub:r.badge?escape(r.badge):'PIP'};}
function closeOtherSitePips(keepId){for(const id of allSitePipIds)if(id!==keepId)wm.close?.(id);}
function openSitePip(siteId,{focusOnly=false}={}){const rec=siteRecord(siteId);if(!rec)return null;if(focusOnly)closeOtherSitePips(rec.id);return wm.spawn(rec.id);}
function openAllSitePips(){wm.spawnAll(allSitePipIds,allSitePipIds.length);wm.tile();return allSitePipIds.length;}
function render(){
 visible=filterRecords(tabRecords(),{query:$('search').value,letter,savedOnly,saved,sort:$('sort').value});
 const size=pageSize(),pages=Math.max(1,Math.ceil(visible.length/size));page=Math.min(page,pages);
 $('total').textContent=String(records.length).padStart(2,'0');$('tab-count').textContent=records.length;$('saved-count').textContent=saved.size;$('variant-count').textContent=records.filter(r=>r.variantCount>1).length;
 $('all-tab').classList.toggle('selected',!savedOnly&&!curatedOnly&&!variantsOnly);$('saved-tab').classList.toggle('selected',savedOnly);
 $('curated-tab').classList.toggle('selected',curatedOnly);$('variants-tab').classList.toggle('selected',variantsOnly);$('curated-tab').setAttribute('aria-pressed',String(curatedOnly));$('variants-tab').setAttribute('aria-pressed',String(variantsOnly));
 $('all-tab').setAttribute('aria-pressed',String(!savedOnly&&!curatedOnly&&!variantsOnly));$('saved-tab').setAttribute('aria-pressed',String(savedOnly));
 $('result-count').textContent=`${visible.length} ${visible.length===1?'record':'records'}${letter!=='All'?' / '+letter:''} · ${$('sort').selectedOptions[0].textContent}`;
 $('alphabet').innerHTML=['All',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l=>`<button data-letter="${l}" class="${l===letter?'selected':''}" aria-pressed="${l===letter}" aria-label="${l==='All'?'All surnames':'Surnames starting with '+l}">${l}</button>`).join('');
 $('records').className='records '+(mode==='grid'?'':mode);
 $('records').innerHTML=visible.slice((page-1)*size,page*size).map(r=>`<article class="record"><button class="record-image" data-open="${escape(r.id)}" aria-label="View ${escape(r.name)}">${picture(r)}</button><div class="record-info"><div class="record-flags"><span class="badge-tag">${r.badge?'BADGE '+escape(r.badge):'ID NOT TRANSCRIBED'}</span>${variantBadge(r)}</div><h3><button data-open="${escape(r.id)}" style="padding:0;text-align:left">${escape(r.name)}</button></h3><div class="record-bottom"><span>${r.curated?'RESEARCHED BADGE':'SOURCE LABEL · UNVERIFIED'}</span><span class="record-actions"><button class="pip-open" data-open="${escape(r.id)}" aria-label="Load a pip window for ${escape(r.name)}" title="Load pip">⧉</button><button class="save" data-save="${escape(r.id)}" aria-label="${saved.has(r.id)?'Unsave':'Save'} ${escape(r.name)}" aria-pressed="${saved.has(r.id)}">${saved.has(r.id)?'▣':'▢'}</button></span></div></div></article>`).join('')||'<div class="empty">No badges match this selection.<button id="reset">Clear search and filters</button></div>';
 $('pagination').innerHTML=pages>1?`<button id="prev" ${page===1?'disabled':''}>← Previous</button><span>Page ${page} of ${pages} · ${(page-1)*size+1}–${Math.min(page*size,visible.length)}</span><button id="next" ${page===pages?'disabled':''}>Next →</button>`:'';
 bindImages($('records'));
}
function recordDetailHtml(r,id){
 if(r.kind==='site')return siteDetailHtml(r);
 return `<div>${picture(r)}</div><div><p class="eyebrow">PROJECT Y / PERSONNEL RECORD</p><h2>${escape(r.name)}</h2><span class="badge-tag">${r.badge?'BADGE '+escape(r.badge):'BADGE NUMBER NOT TRANSCRIBED'}</span><p>${escape(r.note)}</p><p class="source-filename"><b>Source filename</b><br>${escape(r.id)}</p>${variantPanel(r)}${r.profile?`<section class="research-profile"><h3>Wartime · Project Y</h3><p>${escape(r.profile.wartime)}</p><h3>Postwar · Computing legacy</h3><p>${escape(r.profile.postwar)}</p><h3>Research & sources</h3><ul>${r.profile.references.map(ref=>`<li><a href="${escape(ref.url)}" target="_blank" rel="noopener">${escape(ref.label)} ↗</a></li>`).join('')}</ul></section>`:''}<p>Collection: c. 1943–1947<br>Los Alamos, New Mexico</p><a href="${escape(r.source)}" target="_blank" rel="noopener">View original source & rights information ↗</a><button class="outline detail-save">${saved.has(id)?'Remove from saved badges':'Save this badge'}</button></div>`;
}
function bindRecordBody(root,r){
 if(r.kind==='site'){root.querySelectorAll('[data-site-select]').forEach(button=>button.onclick=()=>document.dispatchEvent(new CustomEvent('project-y-select-site',{detail:{id:button.dataset.siteSelect}})));return;}
 bindImages(root);
 const btn=root.querySelector('.detail-save');
 if(btn)btn.onclick=()=>{toggleSave(r.id);btn.textContent=saved.has(r.id)?'Remove from saved badges':'Save this badge';};
 root.querySelectorAll('[data-variant-open]').forEach(button=>button.onclick=()=>openRecord(button.dataset.variantOpen));
}
/** 4Dwm: every badge card loads up its own floating PIP window. */
const wm=initPipWm({
 layer:$('pip-layer'),desk:$('wm4d'),tray:$('wm4d-tray'),status:$('wm4d-status'),
 findRecord:findPipRecord,
 titleFor:pipTitle,
 chipFor:pipChip,
 detailHtml:r=>recordDetailHtml(r,r.id),
  bindBody:bindRecordBody,
  ariaKindFor:r=>r.kind==='site'?'site pip':'badge pip',
});
function openRecord(id){wm.spawn(id);}
window.projectYWm={openSitePip,openAllSitePips,focusLosAlamosSite:()=>openSitePip('los-alamos',{focusOnly:true}),wm};
document.addEventListener('project-y-open-site-pip',e=>openSitePip(e.detail?.id||'los-alamos'));
document.addEventListener('project-y-site-scope',e=>{if(e.detail?.mode==='all')openAllSitePips();else openSitePip('los-alamos',{focusOnly:true});});
$('records').onclick=e=>{const open=e.target.closest('[data-open]'),save=e.target.closest('[data-save]');if(open)openRecord(open.dataset.open);if(save)toggleSave(save.dataset.save);if(e.target.id==='reset'){letter='All';savedOnly=false;curatedOnly=false;variantsOnly=false;$('search').value='';page=1;render();}};
$('alphabet').onclick=e=>{if(e.target.dataset.letter){letter=e.target.dataset.letter;page=1;render();}};
$('pagination').onclick=e=>{if(e.target.id==='prev')page--;else if(e.target.id==='next')page++;else return;render();$('collection').scrollIntoView();};
$('search').oninput=$('sort').onchange=$('page-size').onchange=()=>{page=1;render();};
$('all-tab').onclick=()=>{savedOnly=false;curatedOnly=false;variantsOnly=false;page=1;render();};$('curated-tab').onclick=()=>{savedOnly=false;curatedOnly=true;variantsOnly=false;page=1;render();};$('variants-tab').onclick=()=>{savedOnly=false;curatedOnly=false;variantsOnly=true;page=1;render();};$('saved-tab').onclick=()=>{savedOnly=true;curatedOnly=false;variantsOnly=false;page=1;render();};
for(const v of ['montage','grid','list'])$(v+'-view').onclick=()=>{mode=v;page=1;for(const m of ['montage','grid','list']){$(m+'-view').classList.toggle('selected',m===v);$(m+'-view').setAttribute('aria-pressed',String(m===v));}render();};
$('close-detail').onclick=()=>$('detail').close();$('detail').onclick=e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}};
$('pip-results').onclick=()=>{const size=pageSize();wm.spawnAll(visible.slice((page-1)*size,page*size).map(r=>r.id),12);};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('detail').open){e.preventDefault();$('search').focus();}});
$('download').onclick=()=>{const cell=s=>'"'+String(s??'').replace(/"/g,'""')+'"';const csv=[['Source-derived label','Badge identifier','Source','Notes','Source filename','Review status','Variation group'],...visible.map(r=>[r.name,r.badge,r.source,r.note,r.id,r.curated?'Researched':'Source label — unverified',r.variantCount>1?r.variantLabel:''])].map(row=>row.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='project-y-badges.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const completed=new Set();
async function api(params){const url=new URL('https://commons.wikimedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',origin:'*',...params});const response=await fetch(url,{signal:AbortSignal.timeout(18000)});if(!response.ok)throw Error('Archive request failed');const data=await response.json();if(data.error)throw Error(data.error.info);return data;}
async function loadLetter(l){let continuation={};const imported=[];do{const data=await api({generator:'categorymembers',gcmtitle:'Category:Los Alamos identity badges: '+l,gcmtype:'file',gcmlimit:'50',prop:'imageinfo',iiprop:'url',iiurlwidth:'400',...continuation});for(const p of Object.values(data.query?.pages||{}))imported.push(recordFromPage(p,l));continuation=data.continue;}while(continuation);return imported;}
$('load-all').onclick=async()=>{const button=$('load-all');button.disabled=true;button.textContent='Checking for updates…';let failed=0;
 // Two workers limit load on Commons. Completed categories survive retries.
 const queue=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(l=>!completed.has(l));
 async function worker(){while(queue.length){const l=queue.shift();try{const additions=await loadLetter(l);const ids=new Set(records.map(r=>r.id));for(const r of additions)if(!ids.has(r.id)){records.push(r);ids.add(r.id);}records=annotateVariants(records);completed.add(l);render();}catch{failed++;if(failed>=2)queue.length=0;}$('load-status').textContent=`${completed.size}/26 surname categories loaded · ${records.length} files available${failed?' · Some requests failed':''}.`;}}
 await Promise.all([worker(),worker()]);button.disabled=false;
 if(failed){button.textContent='Retry update ↗';$('load-status').textContent=`Update incomplete: ${completed.size}/26 categories checked. The bundled 1404-file index remains available (${records.length} files currently loaded). Commons could not be reached for some categories; retry when connected.`;}else{button.textContent='Archive update complete ✓';button.disabled=true;$('load-status').textContent=`All 26 surname categories checked. ${records.length} available files, including alternate scans. This is a public image collection, not a complete Manhattan Project roster.`;}
};
render();
$('load-status').textContent=`${catalogMetadata.fileCount.toLocaleString()} source files indexed locally · snapshot ${catalogMetadata.retrieved}. Names and source links do not require the Commons API; non-bundled photographs need internet access.`;

$('open-montage-reference').onclick=()=>$('montage-reference').showModal();
$('close-montage-reference').onclick=()=>$('montage-reference').close();
$('reference-zoom').oninput=()=>{const value=$('reference-zoom').value;$('reference-image').style.width=value+'%';$('reference-zoom-value').value=value+'%';};
