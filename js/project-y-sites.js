import {sites,modelDisclaimer} from './project-y-sites-data.js';
const $=id=>document.getElementById(id);
let current=sites[0],engine=null,wireframe=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function selectSite(id){
 current=sites.find(s=>s.id===id)||sites[0];
 document.querySelectorAll('[data-site]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.site===current.id)));
 $('site-detail').innerHTML=`<p class="eyebrow">${esc(current.region)} / ${esc(current.period)}</p><h3>${esc(current.name)}</h3><span class="site-role">${esc(current.role)}</span><p>${esc(current.summary)}</p><h4>People & consequences</h4><p>${esc(current.context)}</p><h4>Reading the model</h4><p>${esc(current.interpretation)}</p><ul>${current.landmarks.map(([name,note])=>`<li><b>${esc(name)}</b> — ${esc(note)}</li>`).join('')}</ul><details><summary>Research sources & model limits</summary><p>${esc(modelDisclaimer)}</p>${current.sources.map(([name,url])=>`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)} ↗</a>`).join('')}<a href="docs/project-y-sites.md">Complete research notes ↗</a></details>`;
 $('site-vrml').href=`models/project-y/${current.id}.wrl`;
 $('site-vrml').download=`${current.id}.wrl`;
 $('site-canvas').setAttribute('aria-label',`${current.name}: schematic exterior model, not to scale. Drag to orbit or use view controls below.`);
 engine?.load(current);
}
document.querySelectorAll('[data-site]').forEach(b=>b.addEventListener('click',()=>selectSite(b.dataset.site)));
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
  $('site-render-status').textContent='3D is unavailable in this browser. Historical descriptions and all three VRML downloads remain available below.';
  $('site-stage').classList.add('unavailable');
  document.querySelectorAll('.site-controls button').forEach(b=>b.disabled=true);
  console.warn('Project Y site viewer unavailable:',error.message);
 }
}
// Defer WebGL creation until the exhibit is near the viewport.
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();start();}},{rootMargin:'250px'});observer.observe($('sites'));}else start();
