// Interpretive exterior massing only: all positions and footprints are invented.
// Shared primitives drive both Three.js and VRML so exports match the exhibit.
export const modelDisclaimer='SCHEMATIC HISTORICAL EXHIBIT — invented placement and simplified exterior forms; not a survey, navigational map, current facility plan, or engineering model. No interiors or operational systems are modeled.';
const box=(name,position,size,color,rotation=[0,1,0,0])=>({name,position,size,color,rotation});
function beam(name,a,b,color='#696c63',width=.4){
 const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),axis=[d[2],0,-d[0]],n=Math.hypot(...axis);
 return box(name,a.map((v,i)=>(v+b[i])/2),[width,length,width],color,n?[...axis.map(v=>v/n),Math.acos(d[1]/length)]:[1,0,0,d[1]<0?Math.PI:0]);
}
const ground=(color='#c4b896')=>box('Interpretive ground plane',[0,-1,0],[130,2,100],color);
const los=[ground('#aaa181'),box('Mesa — symbolic landform',[0,2,0],[96,5,66],'#bda47e'),box('Main street — illustrative',[0,4.6,3],[85,.2,6],'#dfd3b7')];
for(let i=0;i<5;i++)los.push(box('Technical-area building '+(i+1),[-32+i*15,8,-17],[11,7,14],'#ded8bd'));
for(let i=0;i<4;i++)los.push(box('Housing — representative '+(i+1),[-28+i*18,7,20],[12,5,11],'#bcbcab'));
los.push(box('Community building — representative',[35,9,0],[14,9,16],'#c49c75'));
const han=[ground('#bbb793'),box('Columbia River — symbolic strip',[0,.2,-32],[128,.5,15],'#67959a'),box('B Reactor — exterior massing',[-18,12,0],[30,24,24],'#c3bcaa'),box('Reactor annex — representative',[8,5,3],[22,10,20],'#ddd4be'),box('Stack — representative',[-36,23,-10],[3,46,3],'#a29380'),box('Support building — representative',[32,5,-13],[20,10,13],'#c5b799'),box('Access road — illustrative',[0,.1,29],[125,.2,5],'#ded6bc')];
const tri=[ground('#cbbc95')];
const h=30.48; // The historical tower height was 100 ft. Other dimensions are illustrative.
for(const x of [-3,3])for(const z of [-3,3])tri.push(beam('Tower leg',[x,0,z],[x,h,z]));
for(let y=0;y<h;y+=h/5){for(const z of [-3,3]){tri.push(beam('Tower bracing',[-3,y,z],[3,y+h/5,z]));tri.push(beam('Tower bracing',[3,y,z],[-3,y+h/5,z]));}for(const x of [-3,3])tri.push(beam('Tower side brace',[x,y,-3],[x,y+h/5,3]));}
tri.push(box('Tower platform — no device modeled',[0,h,0],[8,.6,8],'#787568'),box('Ground-zero marker — interpretive tile',[0,.1,0],[13,.2,13],'#ab7959'),box('McDonald ranch house — displaced inset',[37,3,26],[13,6,9],'#d8c9a7'));
export const sites=[
 {id:'los-alamos',name:'Los Alamos',region:'NEW MEXICO',period:'1943–1945',role:'Research & development',tag:'PROJECT Y',objects:los,camera:[100,85,115],target:[0,3,0],
  summary:'Project Y brought scientific research, engineering, and wartime weapon development together at Los Alamos. The laboratory was established in 1943.',
  context:'The laboratory’s creation displaced Pueblo people and Anglo and Hispanic homesteaders. This landscape was not empty before the Manhattan Project.',
  interpretation:'A symbolic mesa, technical-area blocks, housing, and a community building evoke the wartime laboratory town. No block is an authenticated building footprint.',
  landmarks:[['Mesa & town','Symbolic terrain, not a digital elevation model.'],['Technical area','Representative exterior blocks; no laboratory interiors.'],['Housing & community','A reminder that the laboratory was also a community.']],
  sources:[['LANL — Los Alamos National Laboratory, early days','https://www.lanl.gov/media/publications/national-security-science/0423-los-alamos-national-laboratory'],['NPS — Los Alamos development and displacement','https://www.nps.gov/articles/000/-h-our-history-lesson-the-development-of-the-manhattan-project-in-los-alamos-county-new-mexico-wwii-heritage-city.htm']]},
 {id:'hanford',name:'Hanford Site',region:'WASHINGTON',period:'1943–1945',role:'Plutonium production',tag:'B REACTOR',objects:han,camera:[100,78,115],target:[0,8,0],
  summary:'Along the Columbia River, Hanford’s B Reactor became the world’s first full-scale plutonium-production reactor. Construction began in October 1943; it achieved criticality on September 26, 1944. Hanford supplied plutonium used in Trinity and the Nagasaki bomb.',
  context:'The project forced Indigenous and non-Indigenous residents from their lands. The history includes the Wanapum, Yakama, Umatilla, and Nez Perce peoples—not just the industrial achievement.',
  interpretation:'This exterior vignette represents B Reactor and the Columbia River, not the entire Hanford reservation. Building sizes, stack form, river shape, and distances are illustrative; other reactor areas are omitted.',
  landmarks:[['B Reactor','Exterior massing only; no reactor core or process equipment.'],['Columbia River','A symbolic strip, not a mapped river course.'],['Support buildings','Generic forms, not a reconstruction of auxiliary systems.']],
  sources:[['NPS — B Reactor panoramic tour and chronology','https://www.nps.gov/articles/000/hanford-b-reactor-panoramic-tour.htm'],['DOE — B Reactor historical overview','https://www.energy.gov/management/b-reactor'],['Princeton Nuclear Princeton — Hanford and displacement','https://nuclearprinceton.princeton.edu/hanford-site']]},
 {id:'trinity',name:'Trinity Test Site',region:'NEW MEXICO',period:'16 JULY 1945',role:'First nuclear test',tag:'JORNADA DEL MUERTO',objects:tri,camera:[88,60,105],target:[0,10,0],
  summary:'The world’s first nuclear explosion took place on July 16, 1945, at the Alamogordo Bombing Range in the Jornada del Muerto. The test device was raised onto a 100-foot tower. This scene depicts an interpretive pre-test setting, not an explosion.',
  context:'Fallout exposed surrounding communities. The National Cancer Institute’s reconstruction discusses projected health effects and substantial uncertainty; this exhibit is not a radiation-dose or blast simulation.',
  interpretation:'Tower height is represented as 30.48 model units (100 feet at one nominal metre per unit). Bracing and footprint are illustrative. The ranch house is a displaced inset: its actual location was about two miles south, not beside the tower. No device or assembly detail is included.',
  landmarks:[['Test tower','Representative open framework; not a structural reconstruction.'],['Ground zero','Interpretive tile; not the postwar monument or a blast footprint.'],['McDonald ranch house','Symbolic off-site inset; distance and building form are not to scale.']],
  sources:[['DOE — Trinity site, date, tower, and ranch house','https://www.energy.gov/lm/trinity-site-worlds-first-nuclear-explosion'],['NCI — Trinity fallout study, community summary','https://dceg.cancer.gov/research/how-we-study/exposure-assessment/trinity/community-summary']]}
];
function rgb(hex){return hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255);}
const quote=s=>'"'+s.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,' ')+'"';
export function toVRML(site){
 const header=`#VRML V2.0 utf8\nWorldInfo { title ${quote(site.name+' — historical schematic')} info [ ${quote(modelDisclaimer)} ${quote(site.interpretation)} ${site.sources.map(s=>quote(s[0]+': '+s[1])).join(' ')} ] }\nNavigationInfo { type ["EXAMINE", "ANY"] }\nBackground { skyColor [0.94 0.93 0.89] }\nViewpoint { description "Overview" position 0 105 140 orientation 1 0 0 -0.55 }\nDirectionalLight { direction -1 -2 -1 intensity 0.9 }\n`;
 return header+site.objects.map((o,i)=>`# ${o.name}\nDEF OBJECT_${i} Transform { translation ${o.position.join(' ')} rotation ${o.rotation.join(' ')} children [ Shape { appearance Appearance { material Material { diffuseColor ${rgb(o.color).join(' ')} } } geometry Box { size ${o.size.join(' ')} } } ] }`).join('\n')+'\n';
}
