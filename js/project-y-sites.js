import {sites,modelDisclaimer,yieldPresets} from './project-y-sites-data.js';
const $=id=>document.getElementById(id);
let current=sites[0],engine=null,wireframe=false,scope='los',yieldKt=sites[0].yieldKt||21;
const liveDemSamples=new Map();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtYield=kt=>kt>=1000?(kt/1000).toLocaleString(undefined,{maximumFractionDigits:kt>=10000?1:2})+' Mt':Math.round(kt).toLocaleString()+' kt';
function setScope(next){scope=next;const los=$('site-scope-los'),all=$('site-scope-all');if(los)los.setAttribute('aria-pressed',String(scope==='los'));if(all)all.setAttribute('aria-pressed',String(scope==='all'));}
function selectSite(id,{setYield=true}={}){
 current=sites.find(s=>s.id===id)||sites[0];
 document.querySelectorAll('[data-site]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.site===current.id)));
 $('site-detail').innerHTML=`<p class="eyebrow">${esc(current.region)} / ${esc(current.period)}</p><h3>${esc(current.name)}</h3><span class="site-role">${esc(current.role)}</span><p>${esc(current.summary)}</p><h4>People & consequences</h4><p>${esc(current.context)}</p><h4>Reading the model</h4><p>${esc(current.interpretation)}</p><ul>${current.landmarks.map(([name,note])=>`<li><b>${esc(name)}</b> — ${esc(note)}</li>`).join('')}</ul><details><summary>Research sources & model limits</summary><p>${esc(modelDisclaimer)}</p>${current.sources.map(([name,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)} ↗</a>`).join('')}<a href="docs/project-y-sites.md">Complete research notes ↗</a></details>`;
 $('site-vrml').href=`models/project-y/${current.id}.wrl`;
 $('site-vrml').download=`${current.id}.wrl`;
 $('site-canvas').setAttribute('aria-label',`${current.name}: schematic exterior model, not to scale. Drag to orbit or use view controls below.`);
 if(setYield)yieldKt=current.yieldKt||yieldKt;
 syncYieldControls();
 drawYieldOverlay();
 engine?.load(current);
}
function updateYieldNote(preset){
 const correction='Fact check: Ivy Mike was a 10.4 Mt liquid-deuterium thermonuclear test. The accidentally larger-yield story is Castle Bravo’s lithium-7 result; Silly Putty is unrelated.';
 $('yield-note').textContent=preset?.note?`${preset.note} ${correction}`:correction;
 const sample=liveDemSamples.get(current.id);
 const sampleText=sample?` · live USGS 3DEP samples ${sample.count}×, ${sample.min.toFixed(0)}–${sample.max.toFixed(0)} m`:'';
 $('yield-source').textContent=`${current.dem?.source||'Minimal DEM-style overlay'}${sampleText} · relative ring radius scales with cube-root yield; not a blast, dose, fireball, fallout, or casualty model.`;
 const sampleButton=$('yield-sample-usgs');
 if(sampleButton){sampleButton.disabled=!current.dem?.center;sampleButton.textContent=current.dem?.center?'Sample live USGS 3DEP point':'USGS 3DEP unavailable for this site';}
}
function syncYieldControls(preset){
 if($('yield-slider'))$('yield-slider').value=String(Math.max(1,Math.min(15000,Math.round(yieldKt))));
 if($('yield-value')){$('yield-value').value=fmtYield(yieldKt);$('yield-value').textContent=fmtYield(yieldKt);}
 updateYieldNote(preset);
}
function reliefValue(kind,x,y){
 const nx=x-.5,ny=y-.5;
 if(kind==='ridge')return .45+.25*Math.sin((x*3+y*.8)*Math.PI*2)+.25*Math.exp(-Math.pow((y-.2)*4,2));
 if(kind==='river')return .45+.22*Math.sin(x*5)+.18*Math.cos(y*4)-.35*Math.exp(-Math.pow((y-.22)*10,2));
 if(kind==='basin')return .58-.42*Math.exp(-(nx*nx*2.8+ny*ny*3.6))+.12*Math.sin(x*15)*Math.cos(y*7);
 if(kind==='atoll'){const r=Math.hypot(nx*1.45,ny*1.15);return r>.38&&r<.52?.72:r<.36?.22:.42;}
 return .55+.24*Math.sin((x*2.6+y*1.5)*Math.PI)+.2*Math.exp(-Math.pow((y-.35)*4,2));
}
function colorRamp(v,kind){
 if(kind==='atoll'){if(v<.3)return [61,128,146];if(v>.65)return [214,205,164];return [86,157,166];}
 const a=Math.max(0,Math.min(1,v));
 return [Math.round(91+a*120),Math.round(96+a*95),Math.round(75+a*70)];
}
function drawYieldOverlay(){
 const canvas=$('yield-canvas');if(!canvas)return;
 const dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth||420,h=canvas.clientHeight||230;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);} 
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const kind=current.dem?.relief||'mesa',cols=46,rows=28,cw=w/cols,ch=h/rows;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const v=reliefValue(kind,(i+.5)/cols,(j+.5)/rows),c=colorRamp(v,kind);ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;ctx.fillRect(i*cw,j*ch,cw+1,ch+1);} 
 ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=1;for(let i=0;i<=cols;i+=5){ctx.beginPath();ctx.moveTo(i*cw,0);ctx.lineTo(i*cw,h);ctx.stroke();}for(let j=0;j<=rows;j+=5){ctx.beginPath();ctx.moveTo(0,j*ch);ctx.lineTo(w,j*ch);ctx.stroke();}
 const cx=w*.52,cy=h*.52,r=Math.min(w,h)*(.055+.17*Math.cbrt(yieldKt/15000));
 ctx.fillStyle='rgba(183,75,43,.16)';ctx.strokeStyle='rgba(183,75,43,.92)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle='rgba(183,75,43,.55)';ctx.beginPath();ctx.arc(cx,cy,Math.max(4,r*.42),0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='rgba(20,25,20,.82)';ctx.font='12px DM Sans, Arial, sans-serif';ctx.fillText(current.name,12,20);ctx.fillText(fmtYield(yieldKt),12,38);ctx.font='10px monospace';const sample=liveDemSamples.get(current.id);ctx.fillText(sample?`USGS 3DEP ${sample.min.toFixed(0)}–${sample.max.toFixed(0)} m`:'minimal DEM-style overlay',12,h-22);ctx.fillText('relative yield ring only',12,h-9);
}
async function sampleLiveUsgs(){
 const button=$('yield-sample-usgs');
 if(!current.dem?.center||!button)return;
 const [lat,lon]=current.dem.center,offset=.025;
 const points=[[lat,lon],[lat+offset,lon],[lat-offset,lon],[lat,lon+offset],[lat,lon-offset]];
 button.disabled=true;button.textContent='Sampling USGS 3DEP…';
 try{
  const values=[];
  for(const [y,x] of points){
   const geometry=encodeURIComponent(JSON.stringify({x,y,spatialReference:{wkid:4326}}));
   const url='https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify?geometry='+geometry+'&geometryType=esriGeometryPoint&returnGeometry=false&returnCatalogItems=false&f=json';
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
   const response=await fetch(url,{signal:controller.signal});clearTimeout(timer);
   const data=await response.json();const elev=data.value==='NoData'?NaN:Number(data.value);
   if(Number.isFinite(elev))values.push(elev);
  }
  if(!values.length)throw Error('No USGS elevation values returned');
  liveDemSamples.set(current.id,{count:values.length,min:Math.min(...values),max:Math.max(...values),fetched:new Date().toISOString().slice(0,10)});
  syncYieldControls();drawYieldOverlay();button.textContent='USGS 3DEP sampled ✓';
 }catch(error){$('yield-source').textContent='Live USGS 3DEP sampling blocked or unavailable — keeping the minimal offline DEM-style overlay.';button.textContent='Retry live USGS sample';}
 finally{button.disabled=!current.dem?.center;}
}
function initYieldControls(){
 const presetBox=$('yield-presets');if(presetBox){presetBox.innerHTML=yieldPresets.map(p=>`<button type="button" data-yield-preset="${esc(p.id)}">${esc(p.label)}</button>`).join('');presetBox.onclick=e=>{const b=e.target.closest('[data-yield-preset]');if(!b)return;const p=yieldPresets.find(x=>x.id===b.dataset.yieldPreset);if(!p)return;yieldKt=p.kt;syncYieldControls(p);drawYieldOverlay();};}
 const slider=$('yield-slider');if(slider)slider.oninput=()=>{yieldKt=Number(slider.value)||1;syncYieldControls();drawYieldOverlay();};
 $('yield-sample-usgs')?.addEventListener('click',sampleLiveUsgs);
 addEventListener('resize',drawYieldOverlay);
}
document.querySelectorAll('[data-site]').forEach(b=>b.addEventListener('click',()=>selectSite(b.dataset.site)));
$('site-scope-los')?.addEventListener('click',()=>{setScope('los');selectSite('los-alamos');document.dispatchEvent(new CustomEvent('project-y-site-scope',{detail:{mode:'los'}}));});
$('site-scope-all')?.addEventListener('click',()=>{setScope('all');document.dispatchEvent(new CustomEvent('project-y-site-scope',{detail:{mode:'all'}}));});
$('site-pip-current')?.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('project-y-open-site-pip',{detail:{id:current.id}})));
document.addEventListener('project-y-select-site',e=>{selectSite(e.detail?.id||'los-alamos');document.getElementById('sites')?.scrollIntoView({block:'start'});});
initYieldControls();
selectSite('los-alamos');
async function start(){
 try{
 const [THREE,{OrbitControls}]=await Promise.all([import('../vendor/three.module.min.js'),import('../vendor/OrbitControls.js')]);
 const renderer=new THREE.WebGLRenderer({canvas:$('site-canvas'),antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.setClearColor('#e5e2d5');
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(42,1,.1,1500);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=false;controls.minDistance=30;controls.maxDistance=350;controls.maxPolarAngle=Math.PI*.49;
 const render=()=>renderer.render(scene,camera);
 controls.addEventListener('change',render);
 scene.add(new THREE.HemisphereLight('#fff8e7','#706c5d',2.3));
 const sun=new THREE.DirectionalLight('#fff5da',2.5);sun.position.set(-60,110,40);scene.add(sun);
 let group=new THREE.Group();scene.add(group);
 function reset(){camera.up.set(0,1,0);camera.position.fromArray(current.camera);controls.target.fromArray(current.target);controls.update();render();}
 function load(site){
  for(const child of [...group.children]){child.geometry.dispose();child.material.dispose();group.remove(child);}
  for(const o of site.objects){const geometry=new THREE.BoxGeometry(...o.size);const material=new THREE.MeshStandardMaterial({color:o.color,roughness:1,metalness:0,wireframe});const mesh=new THREE.Mesh(geometry,material);mesh.name=o.name;mesh.position.fromArray(o.position);mesh.quaternion.setFromAxisAngle(new THREE.Vector3(...o.rotation.slice(0,3)),o.rotation[3]);group.add(mesh);}
  reset();
 }
 const resize=()=>{const r=$('site-stage').getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();};
 new ResizeObserver(resize).observe($('site-stage'));
 engine={load};load(current);resize();
 $('site-render-status').textContent='Drag to explore · Schematic exterior model';
 $('site-reset').onclick=reset;
 $('site-top').onclick=()=>{camera.position.set(controls.target.x+.01,180,controls.target.z+.01);controls.update();render();};
 function rotate(angle){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(offset);controls.update();render();}
 $('site-left').onclick=()=>rotate(-Math.PI/8);$('site-right').onclick=()=>rotate(Math.PI/8);
 function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();render();}
 $('site-zoom-in').onclick=()=>zoom(.8);$('site-zoom-out').onclick=()=>zoom(1.25);
 $('site-wire').onclick=()=>{wireframe=!wireframe;$('site-wire').setAttribute('aria-pressed',String(wireframe));for(const mesh of group.children)mesh.material.wireframe=wireframe;render();};
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('site-render-status').textContent='3D context lost. Reload to retry; historical notes and VRML downloads remain available.';});
 }catch(error){
  $('site-render-status').textContent='3D is unavailable in this browser. Historical descriptions and all VRML downloads remain available below.';
  $('site-stage').classList.add('unavailable');
  document.querySelectorAll('.site-controls button').forEach(b=>b.disabled=true);
  console.warn('Project Y site viewer unavailable:',error.message);
 }
}
// Defer WebGL creation until the exhibit is near the viewport.
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();start();}},{rootMargin:'250px'});observer.observe($('sites'));}else start();
