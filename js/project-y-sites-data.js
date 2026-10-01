// Interpretive exterior massing only: all positions and footprints are invented.
// Shared primitives drive both Three.js and VRML so exports match the exhibit.
export const modelDisclaimer='SCHEMATIC HISTORICAL EXHIBIT — invented placement and simplified exterior forms; not a survey, navigational map, current facility plan, blast/dose simulator, or engineering model. No interiors, weapon assemblies, or operational systems are modeled.';
const box=(name,position,size,color,rotation=[0,1,0,0])=>({name,position,size,color,rotation});
function beam(name,a,b,color='#696c63',width=.4){
 const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),axis=[d[2],0,-d[0]],n=Math.hypot(...axis);
 return box(name,a.map((v,i)=>(v+b[i])/2),[width,length,width],color,n?[...axis.map(v=>v/n),Math.acos(d[1]/length)]:[1,0,0,d[1]<0?Math.PI:0]);
}
const ground=(color='#c4b896')=>box('Interpretive ground plane',[0,-1,0],[130,2,100],color);
const water=(name,position,size,color='#74a7ad')=>box(name,position,size,color);

const los=[ground('#aaa181'),box('Mesa — symbolic landform',[0,2,0],[96,5,66],'#bda47e'),box('Main street — illustrative',[0,4.6,3],[85,.2,6],'#dfd3b7')];
for(let i=0;i<5;i++)los.push(box('Technical-area building '+(i+1),[-32+i*15,8,-17],[11,7,14],'#ded8bd'));
for(let i=0;i<4;i++)los.push(box('Housing — representative '+(i+1),[-28+i*18,7,20],[12,5,11],'#bcbcab'));
los.push(box('Community building — representative',[35,9,0],[14,9,16],'#c49c75'));

const oak=[ground('#b9ad87'),box('Black Oak Ridge — symbolic ridge',[-7,3,-29],[118,8,14],'#8f8b6d'),box('Oak Ridge town — representative',[28,7,-7],[32,6,18],'#d4c5a0'),box('Y-12 calutron building — representative',[-34,8,-8],[38,10,12],'#cbbf9d'),box('Y-12 beta building — representative',[-34,8,7],[32,10,10],'#d8ccb0'),box('K-25 gaseous diffusion north arm',[16,8,6],[46,10,9],'#bfb9a8'),box('K-25 gaseous diffusion west arm',[-11,8,19],[9,10,28],'#bfb9a8'),box('K-25 gaseous diffusion east arm',[43,8,19],[9,10,28],'#bfb9a8'),box('X-10 graphite reactor — exterior massing',[4,10,-16],[16,20,16],'#aaa28f'),box('X-10 chemical separation — representative',[22,7,-17],[20,12,13],'#cfc4aa'),box('S-50 thermal diffusion — symbolic strip',[-6,4,24],[40,6,6],'#d7cfba'),box('Clinch River — symbolic strip',[0,.2,35],[128,.5,9],'#6f9aa0')];

const han=[ground('#bbb793'),box('Columbia River — symbolic strip',[0,.2,-32],[128,.5,15],'#67959a'),box('B Reactor — exterior massing',[-18,12,0],[30,24,24],'#c3bcaa'),box('Reactor annex — representative',[8,5,3],[22,10,20],'#ddd4be'),box('Stack — representative',[-36,23,-10],[3,46,3],'#a29380'),box('Support building — representative',[32,5,-13],[20,10,13],'#c5b799'),box('Access road — illustrative',[0,.1,29],[125,.2,5],'#ded6bc')];

const tri=[ground('#cbbc95')];
const h=30.48; // The historical tower height was 100 ft. Other dimensions are illustrative.
for(const x of [-3,3])for(const z of [-3,3])tri.push(beam('Tower leg',[x,0,z],[x,h,z]));
for(let y=0;y<h;y+=h/5){for(const z of [-3,3]){tri.push(beam('Tower bracing',[-3,y,z],[3,y+h/5,z]));tri.push(beam('Tower bracing',[3,y,z],[-3,y+h/5,z]));}for(const x of [-3,3])tri.push(beam('Tower side brace',[x,y,-3],[x,y+h/5,3]));}
tri.push(box('Tower platform — no device modeled',[0,h,0],[8,.6,8],'#787568'),box('Ground-zero marker — interpretive tile',[0,.1,0],[13,.2,13],'#ab7959'),box('McDonald ranch house — displaced inset',[37,3,26],[13,6,9],'#d8c9a7'));

const ivy=[water('Enewetak lagoon — schematic',[0,-1,0],[128,1,96]),box('Northern reef rim — schematic',[0,.2,-28],[112,1.2,8],'#d8d0a6'),box('Southern reef rim — schematic',[0,.2,30],[108,1.2,7],'#d8d0a6'),box('Western reef rim — schematic',[-52,.2,2],[8,1.2,62],'#d8d0a6'),box('Eastern reef rim — schematic',[52,.2,1],[8,1.2,60],'#d8d0a6'),box('Elugelab pre-shot island — erased by Mike',[-33,1,-29],[18,2.5,7],'#bdb37e'),box('Mike crater — post-test void marker',[-33,1.4,-29],[23,.6,10],'#3d7f91'),box('Mike shot cab — no device details',[-33,6,-29],[7,9,5],'#b99774'),box('Enewetak support island — representative',[20,1,31],[22,2.5,6],'#cfc79a'),box('Pacific Proving Ground marker',[0,3,0],[6,6,6],'#a16f5c')];

const bravo=[water('Bikini lagoon — schematic',[0,-1,0],[128,1,96]),box('Bikini reef rim — schematic',[0,.2,-28],[118,1.2,7],'#d5cea4'),box('Bikini reef rim — southern arc',[0,.2,31],[112,1.2,7],'#d5cea4'),box('Namu island — representative',[-34,1,-25],[18,2.5,6],'#c5bb87'),box('Bravo shot causeway — symbolic',[-21,1.2,-19],[22,.8,3],'#b6a879',[0,1,0,.35]),box('Bravo crater marker',[-15,1.5,-18],[18,.6,9],'#3c7d8c'),box('Fallout plume direction — interpretive',[18,6,-4],[72,1,8],'#c7815d',[0,1,0,.28]),box('Downwind atolls reminder',[51,5,7],[9,9,9],'#d6a076'),box('Instrumentation bunker — representative',[-48,4,-12],[8,8,8],'#aba18c')];

export const yieldPresets=[
 {id:'trinity',label:'Trinity nominal',kt:21,note:'Approximate historical yield; overlay is a cube-root comparison, not an effects calculator.'},
 {id:'ivy-mike',label:'Ivy Mike',kt:10400,note:'DOE gives Mike as 10.4 megatons at Enewetak.'},
 {id:'castle-bravo',label:'Castle Bravo actual',kt:15000,note:'The unexpected larger-yield lithium-7 story belongs to Castle Bravo, not Ivy Mike.'},
 {id:'castle-bravo-expected',label:'Castle Bravo expected',kt:6000,note:'Often summarized as roughly 5–6 megatons expected before the 15 Mt result.'},
 {id:'low-yield',label:'Low-yield comparison',kt:1,note:'Included to show variable-yield scaling only.'}
];

export const sites=[
 {id:'los-alamos',name:'Los Alamos',region:'NEW MEXICO',period:'1943–1945',role:'Research & development',tag:'PROJECT Y',objects:los,camera:[100,85,115],target:[0,3,0],yieldKt:21,dem:{source:'USGS 3DEP minimal overlay — offline mesa sketch with optional live point samples',relief:'mesa',center:[35.883,-106.303]},
  summary:'Project Y brought scientific research, engineering, and wartime weapon development together at Los Alamos. The laboratory was established in 1943.',
  context:'The laboratory’s creation displaced Pueblo people and Anglo and Hispanic homesteaders. This landscape was not empty before the Manhattan Project.',
  interpretation:'A symbolic mesa, technical-area blocks, housing, and a community building evoke the wartime laboratory town. No block is an authenticated building footprint.',
  landmarks:[['Mesa & town','Symbolic terrain, not a digital elevation model.'],['Technical area','Representative exterior blocks; no laboratory interiors.'],['Housing & community','A reminder that the laboratory was also a community.']],
  sources:[['LANL — Los Alamos National Laboratory, early days','https://www.lanl.gov/media/publications/national-security-science/0423-los-alamos-national-laboratory'],['NPS — Los Alamos development and displacement','https://www.nps.gov/articles/000/-h-our-history-lesson-the-development-of-the-manhattan-project-in-los-alamos-county-new-mexico-wwii-heritage-city.htm']]},
 {id:'oak-ridge',name:'Oak Ridge',region:'TENNESSEE',period:'1942–1945',role:'Uranium enrichment & plutonium pilot work',tag:'SITE X',objects:oak,camera:[105,82,120],target:[2,7,1],yieldKt:21,dem:{source:'USGS 3DEP minimal overlay — offline Tennessee ridge/valley sketch with optional live point samples',relief:'ridge',center:[35.931,-84.310]},
  summary:'Oak Ridge, initially known as Site X / Clinton Engineer Works, combined uranium-enrichment plants at Y-12, K-25, and S-50 with the X-10 Graphite Reactor pilot plant. Land acquisition began in October 1942; by March 1943, 56,000 acres were sealed behind fences.',
  context:'The secret city and industrial reservation displaced rural Tennessee communities and created wartime housing, labor, and long-term environmental legacies. This exhibit treats Oak Ridge as a linked set of valleys and plants, not one single building.',
  interpretation:'The model shows symbolic ridges, a town block, Y-12 calutron buildings, the U-shaped idea of K-25, S-50, and X-10. Positions, spacing, footprints, ridge forms, and river course are invented; no process equipment, cascades, calutrons, reactor internals, or modern cleanup geometry is modeled.',
  landmarks:[['Y-12','Representative electromagnetic-separation buildings; no calutrons or interiors.'],['K-25','Simplified U-shaped gaseous-diffusion massing, not the real 44-acre footprint.'],['X-10','Pilot graphite reactor and chemical-separation blocks, exterior only.'],['Oak Ridge town','A reminder that the reservation was also a hastily built secret city.']],
  sources:[['DOE OREM — Oak Ridge history','https://www.energy.gov/orem/history'],['DOE — X-10 Graphite Reactor','https://www.energy.gov/management/x-10-graphite-reactor'],['DOE EM — Oak Ridge overview','https://www.energy.gov/em/oak-ridge'],['Nuclear Museum — Oak Ridge, TN','https://ahf.nuclearmuseum.org/ahf/location/oak-ridge-tn/']]},
 {id:'hanford',name:'Hanford Site',region:'WASHINGTON',period:'1943–1945',role:'Plutonium production',tag:'B REACTOR',objects:han,camera:[100,78,115],target:[0,8,0],yieldKt:21,dem:{source:'USGS 3DEP minimal overlay — offline Columbia Plateau sketch with optional live point samples',relief:'river',center:[46.628,-119.647]},
  summary:'Along the Columbia River, Hanford’s B Reactor became the world’s first full-scale plutonium-production reactor. Construction began in October 1943; it achieved criticality on September 26, 1944. Hanford supplied plutonium used in Trinity and the Nagasaki bomb.',
  context:'The project forced Indigenous and non-Indigenous residents from their lands. The history includes the Wanapum, Yakama, Umatilla, and Nez Perce peoples—not just the industrial achievement.',
  interpretation:'This exterior vignette represents B Reactor and the Columbia River, not the entire Hanford reservation. Building sizes, stack form, river shape, and distances are illustrative; other reactor areas are omitted.',
  landmarks:[['B Reactor','Exterior massing only; no reactor core or process equipment.'],['Columbia River','A symbolic strip, not a mapped river course.'],['Support buildings','Generic forms, not a reconstruction of auxiliary systems.']],
  sources:[['NPS — B Reactor panoramic tour and chronology','https://www.nps.gov/articles/000/hanford-b-reactor-panoramic-tour.htm'],['DOE — B Reactor historical overview','https://www.energy.gov/management/b-reactor'],['Princeton Nuclear Princeton — Hanford and displacement','https://nuclearprinceton.princeton.edu/hanford-site']]},
 {id:'trinity',name:'Trinity Test Site',region:'NEW MEXICO',period:'16 JULY 1945',role:'First nuclear test',tag:'JORNADA DEL MUERTO',objects:tri,camera:[88,60,105],target:[0,10,0],yieldKt:21,dem:{source:'USGS 3DEP minimal overlay — offline Jornada basin sketch with optional live point samples',relief:'basin',center:[33.677,-106.475]},
  summary:'The world’s first nuclear explosion took place on July 16, 1945, at the Alamogordo Bombing Range in the Jornada del Muerto. The test device was raised onto a 100-foot tower. This scene depicts an interpretive pre-test setting, not an explosion.',
  context:'Fallout exposed surrounding communities. The National Cancer Institute’s reconstruction discusses projected health effects and substantial uncertainty; this exhibit is not a radiation-dose or blast simulation.',
  interpretation:'Tower height is represented as 30.48 model units (100 feet at one nominal metre per unit). Bracing and footprint are illustrative. The ranch house is a displaced inset: its actual location was about two miles south, not beside the tower. No device or assembly detail is included.',
  landmarks:[['Test tower','Representative open framework; not a structural reconstruction.'],['Ground zero','Interpretive tile; not the postwar monument or a blast footprint.'],['McDonald ranch house','Symbolic off-site inset; distance and building form are not to scale.']],
  sources:[['DOE — Trinity site, date, tower, and ranch house','https://www.energy.gov/lm/trinity-site-worlds-first-nuclear-explosion'],['NCI — Trinity fallout study, community summary','https://dceg.cancer.gov/research/how-we-study/exposure-assessment/trinity/community-summary']]},
 {id:'ivy-mike',name:'Operation Ivy — Mike',region:'ENEWETAK ATOLL',period:'31 OCT / 1 NOV 1952',role:'First full-scale thermonuclear test',tag:'10.4 MT',objects:ivy,camera:[100,72,110],target:[-10,2,-6],yieldKt:10400,dem:{source:'USGS DEM minimal overlay — flat atoll fallback; 3DEP does not cover Enewetak',relief:'atoll'},
  summary:'The Atomic Energy Commission detonated the first thermonuclear device, code-named Mike, at Enewetak Atoll. DOE gives the yield as 10.4 megatons. The device used cryogenic liquid deuterium and was an experimental installation rather than a deliverable weapon.',
  context:'The Marshall Islands testing program caused long-term displacement and contamination. This exhibit continues the research line from Manhattan Project production and design into Cold War thermonuclear testing, while separating history from effects simulation.',
  interpretation:'This atoll scene is a symbolic lagoon/reef with Elugelab and a post-test crater marker. It does not model the device, cab engineering, blast, fallout, bathymetry, or a surveyed island outline. “Silly Putty” is unrelated; the larger-than-expected lithium-7 yield story belongs to Castle Bravo, not Ivy Mike.',
  landmarks:[['Elugelab','Shown as a pre-test island marker and a post-test void marker, not a precise coastline.'],['Mike shot cab','A generic block only; no device design is represented.'],['Lagoon & reef','Flat minimal terrain overlay for context, not bathymetry.']],
  sources:[['DOE — October 31, 1952: Mike Test','https://www.energy.gov/management/october-31-1952-mike-test'],['Britannica — Operation Ivy / Mike summary','https://www.britannica.com/topic/Operation-Ivy']]},
 {id:'castle-bravo',name:'Castle Bravo',region:'BIKINI ATOLL',period:'1 MARCH 1954',role:'Unexpected high-yield thermonuclear test',tag:'15 MT',objects:bravo,camera:[100,72,110],target:[-5,2,-7],yieldKt:15000,dem:{source:'USGS DEM minimal overlay — flat atoll fallback; 3DEP does not cover Bikini',relief:'atoll'},
  summary:'Castle Bravo was the largest U.S. nuclear test. It is included as a correction/comparison because the well-known “bigger than expected” story is about lithium-7 in solid lithium deuteride fuel, not Silly Putty and not Ivy Mike.',
  context:'The 15-megaton yield and fallout contaminated nearby inhabited atolls and exposed the crew of the Japanese fishing vessel Daigo Fukuryū Maru. This exhibit uses a yield-comparison ring only, not a fallout or casualty model.',
  interpretation:'The Bikini scene shows a symbolic reef, shot area, crater marker, and fallout-direction cue. It is a historical warning label for variable-yield comparisons: the ring scales with cube-root yield, not with actual damage, fallout, terrain shielding, weather, burst height, or weapon design.',
  landmarks:[['Namu / shot area','Representative location cue, not a surveyed causeway.'],['Fallout cue','A directional reminder, not a plume reconstruction.'],['Crater marker','Symbolic post-test scar.']],
  sources:[['Brookings — Castle Bravo overview and miscalculation','https://www.brookings.edu/articles/castle-bravo-the-largest-u-s-nuclear-explosion/'],['Johnston Archive — Castle Bravo event summary','https://www.johnstonsarchive.net/nuclear/radevents/1954USA1.html']]}
];
function rgb(hex){return hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255);}
const quote=s=>'"'+s.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,' ')+'"';
export function toVRML(site){
 const header=`#VRML V2.0 utf8\nWorldInfo { title ${quote(site.name+' — historical schematic')} info [ ${quote(modelDisclaimer)} ${quote(site.interpretation)} ${site.sources.map(s=>quote(s[0]+': '+s[1])).join(' ')} ] }\nNavigationInfo { type ["EXAMINE", "ANY"] }\nBackground { skyColor [0.94 0.93 0.89] }\nViewpoint { description "Overview" position 0 105 140 orientation 1 0 0 -0.55 }\nDirectionalLight { direction -1 -2 -1 intensity 0.9 }\n`;
 return header+site.objects.map((o,i)=>`# ${o.name}\nDEF OBJECT_${i} Transform { translation ${o.position.join(' ')} rotation ${o.rotation.join(' ')} children [ Shape { appearance Appearance { material Material { diffuseColor ${rgb(o.color).join(' ')} } } geometry Box { size ${o.size.join(' ')} } } ] }`).join('\n')+'\n';
}
