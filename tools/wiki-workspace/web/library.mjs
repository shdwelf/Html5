import {encryptVault,decryptVault,digest,toBase64,fromBase64,validateWorkspaceVault} from './vault.mjs';
const $=id=>document.getElementById(id), base=new URL('../',import.meta.url);
const url=path=>new URL(path,base);
let catalog, byId, selected, revision, capability, shown=150, generation=0, envelope=null, mediaCleanup=()=>{};
const status=text=>{$('status').textContent=text;};
const human=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KiB':(n/1048576).toFixed(1)+' MiB';
function element(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
function download(name,value,type='application/octet-stream') {
  const link=element('a');link.href=URL.createObjectURL(new Blob([value],{type}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),2000);
}
async function request(path,options={}) {
  const response=await fetch(url(path),{...options,credentials:'omit'});
  if(!response.ok){let message;try{message=(await response.json()).message;}catch{}throw new Error(message||`Request failed (${response.status})`);}
  return response;
}
function draftKey(){return 'repository-wiki:'+catalog.snapshot+':'+selected.id;}
function auth(){const token=$('token').value.trim();if(!token)throw new Error('Enter this server’s write token first.');return {Authorization:'Bearer '+token};}
function fileMatches(p) {
  const needle=$('search').value.toLowerCase(),kind=$('kind').value;
  return (p.path+' '+p.repo).toLowerCase().includes(needle)&&(!kind||kind==='docs'&&/\.(md|wiki)$/i.test(p.path)||kind==='text'&&p.text||kind==='image'&&p.mime.startsWith('image/')||kind==='binary'&&!p.text);
}
function renderFiles() {
  const hits=catalog.pages.filter(fileMatches),fragment=document.createDocumentFragment();
  for(const page of hits.slice(0,shown)) {
    const b=element('button',page.path.split('/').pop());b.type='button';b.title=page.path;
    b.append(element('small',page.repo+' / '+(page.path.split('/').slice(0,-1).join('/')||'root')));
    b.setAttribute('aria-current',String(page.id===selected?.id));b.onclick=()=>{location.hash=page.id;};fragment.append(b);
  }
  $('file-list').replaceChildren(fragment);$('count').textContent=hits.length.toLocaleString()+' files'+(hits.length>shown?' · first '+shown:'');$('more').hidden=hits.length<=shown;
}
function pageLinks(id,ids) {
  const list=$(id);list.replaceChildren();
  for(const otherId of ids) {
    const other=byId.get(otherId);if(!other)continue;
    const li=element('li'),button=element('button',other.repo+'/'+other.path);button.onclick=()=>{location.hash=otherId;};li.append(button);list.append(li);
  }
  if(!list.children.length)list.append(element('li','None found.'));
}
async function previewMedia(page,run) {
  const mount=$('media-preview');mediaCleanup();mediaCleanup=()=>{};mount.replaceChildren();
  if(!page.mime.startsWith('image/'))return;
  if(page.mime==='image/vnd.djvu') {
    const hint=element('p','Loading DjVu preview…'),canvas=element('canvas'),controls=element('div');mount.append(hint,canvas,controls);
    try {
      if(page.size>64*1024*1024)throw new Error('document exceeds the 64 MiB preview limit');
      const decoder=await import('../wiki/djvu-rs/djvu_rs.js');await decoder.default();
      const bytes=new Uint8Array(await (await request('media/'+page.sha256)).arrayBuffer());
      if(run!==generation)return;
      const doc=decoder.WasmDocument.from_bytes(bytes);let current=0;
      mediaCleanup=()=>doc.free();const count=doc.page_count();
      if(!count)throw new Error('document has no pages');
      const previous=element('button','Previous'),next=element('button','Next');
      const draw=()=>{
        if(run!==generation)return;
        const p=doc.page(current);
        try{
          const edge=Math.max(p.width_at(96),p.height_at(96)),dpi=edge>1536?96*1536/edge:96;
          const w=p.width_at(dpi),h=p.height_at(dpi),pixels=p.render(dpi);
          canvas.width=w;canvas.height=h;canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels),w,h),0,0);
          hint.textContent='DjVu page '+(current+1)+' / '+count;previous.disabled=current===0;next.disabled=current+1===count;
        }finally{p.free();}
      };
      previous.onclick=()=>{if(current>0){current--;try{draw();}catch(e){status(e.message);}}};
      next.onclick=()=>{if(current+1<count){current++;try{draw();}catch(e){status(e.message);}}};
      controls.append(previous,next);draw();
    }catch(e){hint.textContent='DjVu preview unavailable: '+e.message+'. The exact file is still downloadable.';}
  } else {
    const img=element('img');img.alt=page.path;img.src=url('media/'+page.sha256);mount.append(img);
  }
}
async function openPage() {
  const id=location.hash.slice(1);selected=byId.get(id);const run=++generation;
  $('intro').hidden=!!selected;$('page').hidden=!selected;if(!selected)return;
  const page=selected;renderFiles();status('Loading page…');
  $('repo-label').textContent=page.repo+' / '+(page.text?'TEXT SOURCE':'VAULT ATTACHMENT');
  $('page-title').textContent=page.path;$('page-meta').textContent=human(page.size)+' · SHA-256 '+page.sha256.slice(0,20)+'…';
  $('original').href=url('vault/'+page.sha256);$('original').download=page.path.split('/').pop();$('truncated').hidden=!page.truncated;
  $('editor').value='';revision=null;$('save-server').disabled=true;
  pageLinks('outlinks',page.links);pageLinks('backlinks',page.backlinks);$('references').replaceChildren();
  for(const ref of page.references){const li=element('li'),a=element('a',ref);a.href=ref;a.target='_blank';a.rel='noopener noreferrer';li.append(a);$('references').append(li);}
  if(!page.references.length)$('references').append(element('li','No explicit URLs found.'));
  $('unresolved').replaceChildren(...(page.unresolved.length?page.unresolved:['None found.']).map(x=>element('li',x)));
  $('history').replaceChildren(element('li','Open the Revisions tab to load history.'));
  try {
    const response=await request('api/pages/'+id),body=await response.text();if(run!==generation)return;
    revision=response.headers.get('ETag');let draft=null;try{draft=localStorage.getItem(draftKey());}catch{}
    $('editor').value=draft??body;$('save-server').disabled=!capability.writable;
    status(draft===null?'Snapshot source loaded. Edits are separate wiki revisions.':'Local draft restored. Export it or save a server revision to keep another copy.');
    previewMedia(page,run);
  }catch(e){if(run===generation)status(e.message);}
}
async function renderHistory() {
  if(!selected)return;const id=selected.id,history=await (await request('api/history/'+id)).json();if(selected?.id!==id)return;
  $('history').replaceChildren();
  for(const item of history){const li=element('li'),b=element('button',item.updated+' · '+item.revision.slice(0,16));
    b.onclick=async()=>{try{const body=await (await request('api/revisions/'+id+'/'+item.revision)).text();if(selected?.id!==id)return;
      $('editor').value=body;showView('source');status('Earlier revision loaded as a draft. Save explicitly to restore it; the current server head is unchanged.');
    }catch(e){status(e.message);}};li.append(b);$('history').append(li);}
}
function showView(view) {
  for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
  for(const name of ['source','links','history','vault'])$('panel-'+name).hidden=name!==view;
  if(view==='history')renderHistory().catch(e=>status(e.message));
}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>showView(b.dataset.view);
$('search').oninput=$('kind').onchange=()=>{shown=150;renderFiles();};$('more').onclick=()=>{shown+=150;renderFiles();};
$('save-local').onclick=()=>{try{localStorage.setItem(draftKey(),$('editor').value);status('Local draft saved. This browser profile is not an encrypted vault—export for backup.');}catch{status('Browser storage is full or unavailable. Export the encrypted page now.');}};
$('reset-local').onclick=()=>{if(confirm('Discard this page’s local draft and reload the server revision?')){try{localStorage.removeItem(draftKey());}catch{}openPage();}};
$('save-server').onclick=async()=>{const id=selected?.id,body=$('editor').value,expected=revision;if(!id||!expected)return;
  try{const response=await request('api/pages/'+id,{method:'PUT',headers:{...auth(),'Content-Type':'text/plain;charset=utf-8','If-Match':expected},body});
    if(selected?.id!==id)return;revision=response.headers.get('ETag');try{localStorage.removeItem(draftKey());}catch{}status('Server revision saved. The original repository bytes remain unchanged.');
  }catch(e){status(e.message+' Your editor text has been kept.');}
};
$('export-vault').onclick=async()=>{try{
  const page={...selected},body=$('editor').value;const files=[];
  if($('include-file').checked){if(page.size>8*1024*1024)throw new Error('Source file exceeds the 8 MiB attachment limit.');
    const bytes=new Uint8Array(await (await request('vault/'+page.sha256)).arrayBuffer());if(await digest(bytes)!==page.sha256)throw new Error('Source digest mismatch');
    files.push({name:page.path,sha256:page.sha256,mime:page.mime,base64:toBase64(bytes)});
  }
  envelope=await encryptVault({format:'repository-wiki-vault',version:1,snapshot:catalog.snapshot,pages:[{id:page.id,title:page.title,body,revision}],files},$('password').value);
  $('password').value='';download('repository-page.haikuvault',envelope);$('store-vault').disabled=!capability.writable;status('Encrypted page exported. Keep the passphrase separately.');
}catch(e){status(e.message);}};
$('import-vault').onchange=async()=>{try{
  const f=$('import-vault').files[0];if(!f)return;if(f.size>16*1024*1024)throw new Error('Vault exceeds 16 MiB limit');
  const input=await f.text(),value=await validateWorkspaceVault(await decryptVault(input,$('password').value));
  $('password').value='';envelope=input.trim();$('vault-info').textContent='Verified '+value.pages.length+' page(s) and '+value.files.length+' file(s). Nothing has been published.';
  $('vault-files').replaceChildren();
  for(const page of value.pages){const b=element('button','Download page JSON: '+page.title);b.onclick=()=>download('wikiinajar-page.json',JSON.stringify({format:'wikiinajar-jar',version:1,pages:{[page.title]:{body:page.body,updated:new Date().toISOString(),history:[]}},contacts:[]},null,2),'application/json');$('vault-files').append(b);}
  for(const file of value.files){const b=element('button','Download verified file: '+file.name);b.onclick=()=>download(file.name.split('/').pop(),fromBase64(file.base64));$('vault-files').append(b);}
  $('store-vault').disabled=!capability.writable;status('Vault decrypted locally. Wallet payloads and executable modules are never imported into wiki pages.');
}catch(e){envelope=null;$('store-vault').disabled=true;$('vault-files').replaceChildren();$('vault-info').textContent='';status('Vault could not be opened: '+e.message);}finally{$('import-vault').value='';}};
$('store-vault').onclick=async()=>{try{if(!envelope)return;const hash=await digest(envelope);await request('api/vault/'+hash,{method:'PUT',headers:{...auth(),'Content-Type':'text/plain'},body:envelope});
  $('vault-location').textContent='Private envelope id: '+hash;status('Only ciphertext was stored. Retrieval uses GET api/vault/'+hash+' with the same bearer token.');
}catch(e){status(e.message);}};
window.addEventListener('hashchange',()=>openPage().catch(e=>status(e.message)));
try{
  [catalog,capability]=await Promise.all([request('repository.json').then(r=>r.json()),request('api/capabilities').then(r=>r.json())]);
  if(catalog.format!=='repository-wiki'||catalog.version!==1)throw new Error('Unsupported catalog version');
  byId=new Map(catalog.pages.map(p=>[p.id,p]));
  for(const [n,label] of [[catalog.totals.pages,'source pages'],[catalog.bibliography.length,'reference URLs'],[catalog.repositories.length,'repositories']]){const box=element('div');box.append(element('strong',n.toLocaleString()),element('span',label));$('totals').append(box);}
  $('server-mode').textContent=capability.server+' · '+(capability.writable?'authorized writes available':'read-only; local drafts and exports still work');
  renderFiles();await openPage();
}catch(e){status('Library could not load: '+e.message);}
