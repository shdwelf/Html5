import { VRMLViewer } from "./vrml-engine.js";

const $=id=>document.getElementById(id);
const OFFICIAL="https://www.cia.gov/legacy/museum/exhibit/";

const exhibits=[
  {
    id:"a12",name:"A-12 OXCART",short:"Higher, faster, and far less visible.",era:"COLD WAR / AVIATION",date:"1957—1968",type:"RECONNAISSANCE",collection:"AIR & SPACE",model:"./models/exhibits/a12-oxcart.wrl",official:`${OFFICIAL}a-12-oxcart/`,
    description:"Built for a mission that demanded extraordinary altitude, speed, and discretion, the titanium A-12 became a defining artifact of Cold War technical intelligence. This interpretive model emphasizes its long fuselage, chines, compact cockpit, and twin-engine silhouette.",
    note:"The outdoor airframe on the Headquarters campus and the museum's OXCART story are represented separately in this digital study.",
    highlights:[["TITANIUM AIRFRAME","Materials and manufacturing had to answer sustained high-speed heat."],["HIGH-ALTITUDE IMAGING","OXCART paired a remarkable aircraft with equally specialized cameras."],["A NARROW WINDOW","The A-12 flew operational missions in 1967 and 1968 before retirement."]]
  },
  {
    id:"technology",name:"CIA’s Impact on Technology",short:"When the mission has no off-the-shelf answer.",era:"INNOVATION / TRADECRAFT",date:"1947—PRESENT",type:"TECHNOLOGY",collection:"SCIENCE & TECHNOLOGY",model:"./models/exhibits/technology.wrl",official:`${OFFICIAL}cias-impact-on-technology/`,
    description:"A constellation of tools shows how unusual intelligence requirements can push optics, communications, materials, miniaturization, robotics, and disguise. The object study groups a dragonfly-scale platform, an aquatic form, and a camera-bearing bird as recognizable symbols of that experimentation.",
    note:"The forms are interpretive silhouettes, not engineering replicas. Follow the official link for declassified artifact records and dimensions.",
    highlights:[["INSECTOTHOPTER","A miniature aerial concept remembered for ambition as much as outcome."],["CHARLIE THE ROBOTIC CATFISH","An underwater platform explored remote sampling and control."],["PIGEON CAMERA","Lightweight cameras tested another perspective on overhead photography."]]
  },
  {
    id:"corona",name:"CORONA",short:"Film from orbit, recovered in mid-air.",era:"COLD WAR / SPACE",date:"1960—1972",type:"IMAGING SATELLITE",collection:"AIR & SPACE",model:"./models/exhibits/corona.wrl",official:`${OFFICIAL}corona-americas-first-imaging-satellite-program/`,
    description:"America’s first successful photographic reconnaissance satellite program changed strategic intelligence. CORONA exposed film in orbit, returned it in a reentry capsule, and used specially equipped aircraft to recover the descending payload.",
    note:"The suspended model brings the satellite body, solar arrays, and film-return capsule into one readable composition.",
    highlights:[["DISCOVERER 14","The first successful recovery of film from an orbiting satellite came in 1960."],["FILM-RETURN CAPSULE","Before digital downlink, imagery physically came home through the atmosphere."],["STRATEGIC PERSPECTIVE","Repeated coverage helped replace uncertainty with measurable evidence."]]
  },
  {
    id:"afghanistan",name:"On the Front Lines",short:"CIA in Afghanistan after September 11.",era:"POST-9/11",date:"2001—",type:"OPERATIONAL HISTORY",collection:"MISSION HISTORY",model:"./models/exhibits/afghanistan.wrl",official:`${OFFICIAL}on-the-front-lines-cia-in-afghanistan/`,
    description:"This gallery follows officers and partners sent into Afghanistan after the September 11 attacks. Its public record combines personal objects, field equipment, maps, and aircraft material to make an immense operation legible at human scale.",
    note:"The VRML scene is a symbolic gallery tableau. It does not reproduce operational geography, routes, or facilities.",
    highlights:[["TEAM ALPHA","A small team entered Afghanistan to connect intelligence with partners on the ground."],["AIR MOBILITY","A stylized helicopter form anchors the model’s field-operations story."],["PERSONAL RECORD","Objects and testimony preserve individual experience alongside institutional history."]]
  },
  {
    id:"azorian",name:"Project AZORIAN",short:"A recovery effort at the edge of possibility.",era:"COLD WAR / MARITIME",date:"1974",type:"OCEAN ENGINEERING",collection:"MISSION HISTORY",model:"./models/exhibits/azorian.wrl",official:`${OFFICIAL}project-azorian/`,
    description:"Project AZORIAN attempted to recover part of the sunken Soviet submarine K-129 from the Pacific Ocean floor. The undertaking joined intelligence, maritime engineering, heavy lift systems, secrecy, and an elaborate commercial cover story.",
    note:"The model is a sectional metaphor: submarine below, capture system above. It is not a reconstruction of the recovery vehicle.",
    highlights:[["K-129","The Soviet submarine sank in 1968 in deep Pacific waters."],["HUGHES GLOMAR EXPLORER","A purpose-built ship provided a public deep-sea-mining cover and a recovery platform."],["CAPTURE VEHICLE","Large-scale mechanical systems worked far below the ocean surface."]]
  },
  {
    id:"canadian-six",name:"The Canadian Six",short:"A classic case of deception, documented as ARGO.",era:"IRAN / 1979—1980",date:"1980",type:"EXFILTRATION",collection:"MISSION HISTORY",model:"./models/exhibits/canadian-six.wrl",official:`${OFFICIAL}rescue-of-the-canadian-six-n-a-classic-case-of-deception/`,
    description:"To help six U.S. diplomats leave Iran, CIA specialists built a convincing Hollywood production identity around a fictional science-fiction film. Documents, a portfolio, disguises, rehearsed cover stories, and Canadian partnership turned deception into safe passage.",
    note:"The briefcase and Studio Six presentation are modeled as museum objects; the story is larger than its later film adaptation.",
    highlights:[["STUDIO SIX PRODUCTIONS","A functioning production-office identity supported the cover."],["THE PORTFOLIO","Artwork and documents gave the fictional project material credibility."],["CANADIAN PARTNERSHIP","The operation depended on close collaboration and protected identities."]]
  },
  {
    id:"pan-am-103",name:"Pan Am Flight 103",short:"Evidence, attribution, and remembrance.",era:"COUNTERTERRORISM",date:"1988",type:"INVESTIGATION",collection:"LESSONS & LOSS",model:"./models/exhibits/pan-am-103.wrl",official:`${OFFICIAL}terrorist-bombing-of-pan-am-flight-103/`,
    description:"The bombing of Pan Am Flight 103 over Lockerbie killed 270 people. The exhibit links painstaking international investigation and intelligence work with the human cost of terrorism, preserving evidence without losing sight of remembrance.",
    note:"Nine quiet wall markers stand for a much larger field of names. The abstract vitrine avoids reconstructing traumatic material literally.",
    highlights:[["270 LIVES","The gallery begins with people, not process."],["FRAGMENT BY FRAGMENT","Physical evidence helped investigators trace the device and its components."],["INTERNATIONAL CASEWORK","Attribution required patient work across agencies, disciplines, and borders."]]
  },
  {
    id:"berlin-tunnel",name:"The Berlin Tunnel",short:"A listening post beneath a divided city.",era:"EARLY COLD WAR",date:"1955—1956",type:"SIGINT OPERATION",collection:"MISSION HISTORY",model:"./models/exhibits/berlin-tunnel.wrl",official:`${OFFICIAL}the-berlin-tunnel/`,
    description:"A joint U.S.–British operation tunneled into East Berlin to tap Soviet military communication lines. This cutaway turns the underground route, cable, and monitoring chamber into a concise sectional model.",
    note:"The section is diagrammatic. Lengths, alignments, and chamber positions are deliberately not survey-based.",
    highlights:[["OPERATION GOLD","The American name for an ambitious joint intelligence project."],["UNDERGROUND ACCESS","Engineers created a covert path beneath a politically charged boundary."],["A KNOWN SECRET","Soviet awareness did not immediately end the stream of collected communications."]]
  },
  {
    id:"coded-ceiling",name:"The Coded Ceiling",short:"The museum begins with a question overhead.",era:"MUSEUM / 2022",date:"2022",type:"INTERACTIVE INSTALLATION",collection:"MUSEUM DESIGN",model:"./models/exhibits/coded-ceiling.wrl",official:`${OFFICIAL}the-coded-ceiling/`,
    description:"At the modernized museum entrance, a field of black-and-white systems turns code into architecture. Morse, symbols, ciphers, and language-like patterns invite close looking before a visitor reaches the historical galleries.",
    note:"The VRML model captures rhythm and contrast rather than reproducing the encoded content or its exact tile sequence.",
    highlights:[["MANY SYSTEMS","The installation layers several visual approaches to hidden meaning."],["LOOK UP","Interpretation begins before the first display case."],["UNFINISHED BUSINESS","Some patterns are presented as challenges rather than labels with answers."]]
  },
  {
    id:"bin-ladin",name:"Hunt for Bin Ladin",short:"A model used to make a consequential place legible.",era:"COUNTERTERRORISM",date:"2011",type:"ANALYTIC MODEL",collection:"MISSION HISTORY",model:"./models/exhibits/bin-ladin.wrl",official:`${OFFICIAL}the-final-chapter-in-the-hunt-for-bin-ladin/`,
    description:"The exhibit follows years of intelligence work that identified a compound in Abbottabad, Pakistan. A scale model helped decision-makers understand the site and discuss the operation that ended the search for Usama bin Ladin in May 2011.",
    note:"This simplified study is based on the publicly exhibited concept. It omits tactical detail and is not dimensionally exact.",
    highlights:[["THE COURIER TRAIL","Patient analysis connected fragments that eventually led to the compound."],["ABBOTTABAD MODEL","A physical model supported shared spatial understanding."],["ANALYSIS TO DECISION","The object records how information was communicated, not only collected."]]
  },
  {
    id:"oss",name:"Office of Strategic Services",short:"Before CIA: an American intelligence experiment.",era:"WORLD WAR II",date:"1942—1945",type:"ORGANIZATIONAL HISTORY",collection:"ORIGINS",model:"./models/exhibits/oss.wrl",official:`${OFFICIAL}the-office-of-strategic-services-n-americas-first-intelligence-agency/`,
    description:"The OSS brought analysts, operators, communicators, scientists, and support networks into America’s first centralized wartime intelligence agency. The gallery traces both field ingenuity and the institutional inheritance that followed.",
    note:"A radio, field knife, supply canopy, and compact case form an object-based prologue to the CIA story.",
    highlights:[["FIELD COMMUNICATIONS","Portable radios connected dispersed teams under difficult conditions."],["RESEARCH & ANALYSIS","Intelligence work joined field collection with organized interpretation."],["A COMPLICATED LEGACY","The exhibit treats the OSS as an origin story, not a simple blueprint."]]
  }
];

const grounds=[
  {id:"museum",name:"CIA Museum",short:"A collection inside Headquarters.",era:"INSTITUTION / COLLECTION",date:"EST. 1972",type:"MUSEUM",collection:"HEADQUARTERS",model:"./models/grounds/museum.wrl",official:"https://www.cia.gov/legacy/museum/",site:[11,4,-6],description:"The CIA Museum preserves intelligence artifacts and builds internal exhibitions from declassified material. Its modernized 2022 galleries contain more than 600 carefully selected artifacts; the physical museum is not open to the general public.",note:"This pavilion is wholly conceptual. It represents a collection within Headquarters, not the museum’s actual plan or location.",highlights:[["MORE THAN 600 ARTIFACTS","The modernized museum spans the Agency’s prehistory through recent missions."],["OFFICIAL VISITORS","Access is limited because the museum is inside Headquarters."],["VIRTUAL DOORS","CIA publishes exhibits and more than 200 object records online."]]},
  {id:"kryptos",name:"Kryptos",short:"Jim Sanborn’s encrypted courtyard sculpture.",era:"PUBLIC ART / CRYPTOGRAPHY",date:"1990",type:"SCULPTURE",collection:"COURTYARD",model:"./models/grounds/kryptos.wrl",official:"https://www.cia.gov/legacy/headquarters/kryptos-sculpture/",site:[3,3,-20],description:"Jim Sanborn’s copper, granite, water, wood, and magnetic installation turns language into landscape. Its best-known screen carries four encrypted passages, making the act of reading part of the work.",note:"The articulated copper plates approximate the screen’s curve. Lettering is intentionally omitted from the model.",highlights:[["FOUR PASSAGES","K1 through K4 occupy the copper screen."],["MATERIAL LANGUAGE","Copper, stone, water, wood, and magnetism all contribute meaning."],["A LIVING PUZZLE","The work continues to attract close public study and debate."]]},
  {id:"a12-grounds",name:"A-12 OXCART",short:"The campus aircraft display.",era:"COLD WAR / AVIATION",date:"1960s",type:"CAMPUS LANDMARK",collection:"NORTH LAWN",model:"./models/grounds/a12-grounds.wrl",official:"https://www.cia.gov/legacy/headquarters/a-12-oxcart/",site:[52,4,-27],description:"An A-12 OXCART on the Headquarters campus makes a once-secret reconnaissance program tangible at full scale. The display connects technical ambition to the people who designed, maintained, and flew it.",note:"The campus and gallery object share a subject but serve different interpretive roles in this app.",highlights:[["FULL-SCALE PRESENCE","The outdoor display reveals proportions a case object cannot."],["OXCART PROGRAM","Speed, altitude, materials, and imaging worked as one system."],["DECLASSIFIED LANDMARK","A once-secret aircraft now anchors institutional memory."]]},
  {id:"u2-grounds",name:"U-2",short:"A high-altitude reconnaissance icon.",era:"COLD WAR / AVIATION",date:"1950s—",type:"CAMPUS LANDMARK",collection:"LANDSCAPE",model:"./models/grounds/u2.wrl",official:"https://www.cia.gov/legacy/headquarters/u-2/",site:[40,4,38],description:"The U-2’s extremely long wings and slender fuselage express its high-altitude mission at a glance. The Headquarters display recalls an aircraft whose intelligence contribution outlasted its earliest Cold War context.",note:"The display position and model geometry are interpretive; consult official photography for the actual installation.",highlights:[["LONG WING","The aircraft’s defining planform supports efficient flight at altitude."],["IMAGERY INTELLIGENCE","Specialized sensors transformed the platform into evidence."],["ENDURING DESIGN","The U-2 story extends well beyond its 1950s origin."]]},
  {id:"berlin-wall",name:"Berlin Wall Segments",short:"Three sections from a divided city.",era:"COLD WAR / MEMORY",date:"DEDICATED DEC 18, 1992",type:"HISTORIC MATERIAL",collection:"GROUNDS",model:"./models/grounds/berlin-wall.wrl",official:"https://www.cia.gov/legacy/headquarters/berlin-wall-monument/",site:[-49,4,31],description:"Three sections of the Berlin Wall stand on the Headquarters grounds. Concrete, paint, and damage carry the scale of the Cold War into a direct material encounter. The monument's bronze plaque records that the sections were removed near Checkpoint Charlie at Potsdamer Platz in November 1989; placed in the middle of a path by the OHB southwest entrance, the Wall must be confronted directly — just as Berliners confronted it for nearly three decades.",note:"The color marks in this model are expressive placeholders and do not copy the actual graffiti. The plaque's geography is loose: Checkpoint Charlie stood about a kilometer from Potsdamer Platz; the wording conflates two famous Wall sites.",highlights:[["THE PLAQUE","“These three sections of reinforced concrete were removed from the Berlin Wall near Checkpoint Charlie at Potsdamer Platz in November 1989.”"],["TWO SIDES, AS IN BERLIN","Orientation is preserved: the graffiti-covered west face against the whitewashed east face of the death strip."],["FIVE PRECEPTS","The CIA Fine Arts Commission set prominence, pedestrian orientation, the wall as obstacle, an unromantic presentation, and a measure of contemplation."]]},
  {id:"memorial-wall",name:"Memorial Wall",short:"Stars for officers lost in service.",era:"MEMORIAL",date:"1974—PRESENT",type:"PLACE OF HONOR",collection:"OLD HEADQUARTERS",model:"./models/grounds/memorial-wall.wrl",official:"https://www.cia.gov/legacy/headquarters/cia-memorial-wall/",site:[-24,6,-6],description:"On a marble wall in the Original Headquarters Building, carved stars honor CIA officers who died in service to their country. The adjacent Book of Honor records names when they may be made public.",note:"Five symbolic stars stand for the full memorial. The abstraction avoids asserting a count that changes over time.",highlights:[["A FIELD OF STARS","Each mark is cut by hand into marble."],["BOOK OF HONOR","Some entries can be named; others remain represented only by a star."],["AN ACTIVE MEMORIAL","The wall belongs to a continuing institutional history."]]},
  {id:"oss-memorial",name:"OSS Memorial",short:"A predecessor remembered on campus.",era:"WORLD WAR II / MEMORY",date:"1942—1945",type:"MEMORIAL",collection:"COURTYARD",model:"./models/grounds/oss-memorial.wrl",official:"https://www.cia.gov/legacy/headquarters/oss-memorial/",site:[-8,5,28],description:"The Headquarters landscape remembers the Office of Strategic Services, the World War II organization that preceded the postwar American intelligence institutions. Its memorial connects individual service with organizational origins.",note:"The figural form is abstract and should not be read as a replica of the installed artwork.",highlights:[["PREDECESSOR","OSS gathered intelligence, supported resistance, and developed unconventional capabilities."],["PEOPLE FIRST","Memorial interpretation centers service rather than equipment."],["ORIGIN AND DIFFERENCE","CIA inherited lessons from OSS but emerged in a different legal and political setting."]]},
  {id:"headquarters-seal",name:"Headquarters Seal",short:"An arrival point in stone and brass.",era:"INSTITUTIONAL SYMBOL",date:"1961",type:"ARCHITECTURAL DETAIL",collection:"LOBBY",model:"./models/grounds/headquarters-seal.wrl",official:"https://www.cia.gov/legacy/headquarters/cia-seal/",site:[-23,1,-32],description:"The large floor seal in the Original Headquarters Building lobby forms a ceremonial point of arrival. Its compass-like geometry provides a visual shorthand for the Agency’s global mission.",note:"This generic medallion is not a reproduction of a protected mark and omits text and heraldic detail.",highlights:[["FLOOR MEDALLION","Scale makes the symbol part of the architecture."],["COMPASS GEOMETRY","Directional form connects the lobby to a global frame."],["PUBLICLY PHOTOGRAPHED","The lobby is a familiar part of the official virtual Headquarters tour."]]}
];

const fieldSites=[
  {
    id:"camp-peary",name:"Camp Peary",aliases:"Camp Perry The Farm AFETA",short:"A documented military site with a carefully attributed intelligence history.",era:"VIRGINIA / EVIDENCE STUDY",date:"1942—PRESENT",type:"HISTORICAL SITE",collection:"FIELD SITES",model:"./models/field-sites/camp-peary.wrl",official:"https://www.cia.gov/readingroom/docs/HISTORY%20OF%20THE%20OFFICE%20OF%20[15662533].pdf",
    description:"Camp Peary—not “Camp Perry”—began as a World War II military training landscape near Williamsburg, Virginia, and remains a restricted U.S. government installation officially identified as the Armed Forces Experimental Training Activity. News accounts and former officers widely associate it with CIA training under the nickname “The Farm”; that association is presented here as public attribution, not as an official operational description.",
    note:"This symbolic barracks-and-landscape study is not based on a site plan, does not show current facilities, and supplies no navigational or operational detail.",
    highlights:[["SPELLING MATTERS","Camp Peary is the Virginia place name; “Camp Perry” is a common substitution and can refer to other locations."],["DOCUMENTED LAYER","Its military origin and present government designation can be separated from later journalistic and memoir claims."],["ATTRIBUTION, NOT ACCESS","Restricted status is not evidence for any particular activity; claims are labeled by source type."]]
  },
  {
    id:"camp-x",name:"Camp X / STS 103",aliases:"Site X Project J S 25-1-1 Hydra",short:"An Allied training school and communications link on Lake Ontario.",era:"CANADA / WORLD WAR II",date:"1941—1969",type:"TRAINING & SIGNALS SITE",collection:"ALLIED INTELLIGENCE",model:"./models/field-sites/camp-x.wrl",official:"https://www.cia.gov/resources/csi/static/OSS-Training-During-WWII.pdf",
    description:"Camp X was Special Training School No. 103, established by British Security Co-ordination near Whitby and Oshawa, Ontario. It trained Allied personnel in clandestine work during World War II and operated alongside the Hydra radio facility. CIA-published history records that American SO and SI instructors attended its courses in early 1942 before U.S. schools expanded.",
    note:"Camp X is neither this repository’s St. Croix Site-X nor the Manhattan Project’s Oak Ridge “Site X.” The VRML scene is a conceptual historical tableau, not a reconstruction.",
    highlights:[["STS 103","The school opened on 6 December 1941 and occupied a secluded Lake Ontario landscape."],["TRAINING CONNECTION","Early American instructors and recruits encountered British approaches before OSS built a larger school network."],["HYDRA","The associated communications station linked the site to a wider wartime signals system; a memorial now marks the landscape."]]
  },
  {
    id:"site-x-st-croix",name:"Site-X · St. Croix",aliases:"Site X STX USVI USGS NOAA UNIX",short:"A repository-specific St. Croix data identity—not Camp X.",era:"USVI / DATA STUDY",date:"PROJECT RECORD",type:"GEOSPATIAL INDEX",collection:"REPOSITORY CONTEXT",model:"./models/field-sites/site-x-st-croix.wrl",official:"../../../img/site-x-badge.png",
    description:"Within this repository, the clearest Site-X identity is a badge that explicitly reads “SITE-X · ST. CROIX USVI,” supported by local St. Croix geography and node datasets. This museum record preserves that project-specific meaning while keeping it separate from the Canadian Camp X and the Manhattan Project’s Oak Ridge “Site X.”",
    note:"Nothing in the local badge or datasets establishes a CIA installation. The island, linked nodes, and data marker are an interpretive visualization of repository context only.",
    highlights:[["THE BADGE","The existing visual names St. Croix and pairs it with USGS, NOAA, and UNIX references."],["LOCAL DATA","stx-geo.js and stx-nodes.js make the Caribbean context explicit."],["THREE DIFFERENT NAMES","St. Croix Site-X, Canadian Camp X, and Oak Ridge Site X must not be silently conflated."]]
  }
];

const collections={exhibits,grounds,"field-sites":fieldSites};
const state={tab:"exhibits",selected:"a12",query:"",labels:true,tour:-1,sourceViewer:null,loadToken:0};
let campusViewer,objectViewer;

const cameraPresets={
  overview:{theta:.74,phi:.66,distance:137,target:[0,2,1]},
  museum:{theta:.45,phi:.48,distance:55,target:[9,3,-5]},
  grounds:{theta:-.62,phi:.72,distance:116,target:[-6,2,7]},
  landscape:{theta:.02,phi:1.30,distance:142,target:[0,0,1]}
};

const siteCameras={
  museum:{theta:.45,phi:.42,distance:43,target:[11,3,-6]},kryptos:{theta:.6,phi:.40,distance:18,target:[3,2.5,-20]},
  "a12-grounds":{theta:.55,phi:.35,distance:35,target:[52,3,-27]},"u2-grounds":{theta:-.55,phi:.44,distance:35,target:[40,3,38]},
  "berlin-wall":{theta:-.45,phi:.42,distance:24,target:[-49,3,31]},"memorial-wall":{theta:2.8,phi:.33,distance:24,target:[-24,4,-6]},
  "oss-memorial":{theta:-.15,phi:.38,distance:22,target:[-8,3,28]},"headquarters-seal":{theta:2.8,phi:1.12,distance:24,target:[-23,0,-32]}
};

const hotspotData=grounds.map(g=>({id:g.id,label:g.name,position:g.site}));

function currentItems(){return collections[state.tab]}
function currentItem(){return currentItems().find(x=>x.id===state.selected)||currentItems()[0]}
function indexLabel(i,total){return `${String(i+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}

function renderList(){
  const data=currentItems(),q=state.query.trim().toLowerCase(),filtered=data.filter(item=>!q||`${item.name} ${item.aliases||""} ${item.era} ${item.collection}`.toLowerCase().includes(q));
  const list=$("collection-list");list.innerHTML="";
  if(!filtered.length){list.innerHTML='<div class="empty-list">No collection records match this search.</div>';return}
  filtered.forEach(item=>{
    const actual=data.indexOf(item),button=document.createElement("button");button.className=`collection-item${item.id===state.selected?" active":""}`;button.dataset.id=item.id;button.setAttribute("role","listitem");button.innerHTML=`<span class="item-index">${String(actual+1).padStart(2,"0")}</span><span class="item-copy"><b>${item.name}</b><small>${item.era}</small></span><span class="item-arrow">→</span>`;button.addEventListener("click",()=>selectItem(item.id,true));list.appendChild(button)
  })
}

async function selectItem(id,focus=false){
  const item=currentItems().find(x=>x.id===id);if(!item)return;state.selected=id;renderList();renderDetails(item);updateViewerHeading(item);updateHotspots();
  if(state.tab==="grounds"&&focus)focusSite(item.id);else if(state.tab==="exhibits"&&focus)campusViewer.setCamera(cameraPresets.museum);else if(state.tab==="field-sites"&&focus)campusViewer.setCamera(cameraPresets.landscape);
  if(innerWidth<=960)$("object-panel").classList.add("open");if(innerWidth<=720)$("collection-rail").classList.remove("open");
  const token=++state.loadToken;$("view-status-text").textContent="READING OBJECT MODEL…";
  try{await objectViewer.load(item.model);if(token!==state.loadToken)return;$("model-meta").textContent=`VRML V2.0 · ${objectViewer.objects.length} primitives`;$("view-status-text").textContent="LOCAL MODELS ONLINE";objectViewer.autoRotate=true;toast(`${item.name} / VRML loaded`)}catch(error){if(token!==state.loadToken)return;$("model-meta").textContent="Model unavailable";$("view-status-text").textContent="OBJECT MODEL ERROR";console.error(error)}
}

function renderDetails(item){
  const items=currentItems(),index=items.indexOf(item);$("object-number").textContent=indexLabel(index,items.length);$("object-era").textContent=item.era;$("object-title").textContent=item.name;$("object-deck").textContent=item.short;$("object-description").textContent=item.description;$("curator-note").querySelector("p").textContent=item.note;$("model-file").textContent=item.model.split("/").pop();$("official-link").href=item.official;$("status-selection").textContent=`${item.name.toUpperCase()} / SELECTED`;
  $("object-facts").innerHTML=`<div><dt>DATE</dt><dd>${item.date}</dd></div><div><dt>TYPE</dt><dd>${item.type}</dd></div><div><dt>COLLECTION</dt><dd>${item.collection}</dd></div><div><dt>MODEL STATUS</dt><dd>INTERPRETIVE</dd></div>`;
  $("object-highlights").innerHTML=item.highlights.map((h,i)=>`<article class="highlight"><span class="highlight-index">${String(i+1).padStart(2,"0")}</span><div><b>${h[0]}</b><p>${h[1]}</p></div></article>`).join("");$("highlight-count").textContent=`${String(item.highlights.length).padStart(2,"0")} STORIES`;$("pagination-progress").style.width=`${(index+1)/items.length*100}%`;
}

function updateViewerHeading(item){
  if(state.tab==="exhibits"){$("viewer-index").textContent=`GALLERY ${String(exhibits.indexOf(item)+1).padStart(2,"0")}`;$("viewer-title").textContent=`Museum collection / ${item.name}`;$("viewer-subtitle").textContent="Campus context at center · exhibit model in the object viewer"}
  else if(state.tab==="grounds"){$("viewer-index").textContent=`SITE ${String(grounds.indexOf(item)+1).padStart(2,"0")}`;$("viewer-title").textContent=item.name;$("viewer-subtitle").textContent="Public-source campus landmark · conceptual placement"}
  else{$("viewer-index").textContent=`STUDY ${String(fieldSites.indexOf(item)+1).padStart(2,"0")}`;$("viewer-title").textContent=item.name;$("viewer-subtitle").textContent="Separate historical/data study · not placed on the Headquarters campus"}
}

function switchTab(tab,selectFirst=true){
  state.tab=tab;state.query="";$("collection-search").value="";document.querySelectorAll("[data-rail-tab]").forEach(b=>{const on=b.dataset.railTab===tab;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on))});if(selectFirst)state.selected=collections[tab][0].id;renderList();selectItem(state.selected,false);updateHotspots()
}

function focusSite(id){const camera=siteCameras[id];if(camera)campusViewer.setCamera(camera);document.querySelectorAll("[data-preset]").forEach(b=>b.classList.remove("active"))}

function createHotspots(){const layer=$("hotspot-layer");hotspotData.forEach(h=>{const b=document.createElement("button");b.className="hotspot";b.dataset.id=h.id;b.innerHTML=`<span class="hotspot-pin"></span><span class="hotspot-text">${h.label}</span>`;b.setAttribute("aria-label",`Open ${h.label}`);b.addEventListener("click",()=>{if(state.tab!=="grounds")switchTab("grounds",false);selectItem(h.id,true)});layer.appendChild(b)});campusViewer.onFrame=updateHotspotPositions}
function updateHotspotPositions(){for(const h of hotspotData){const el=document.querySelector(`.hotspot[data-id="${h.id}"]`),p=campusViewer.project(h.position);if(!el||!p)continue;el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.classList.toggle("hidden",!p.visible||!state.labels||state.tab==="field-sites")}}
function updateHotspots(){document.querySelectorAll(".hotspot").forEach(el=>el.classList.toggle("active",state.tab==="grounds"&&el.dataset.id===state.selected))}

function stepObject(delta){const items=currentItems(),i=items.findIndex(x=>x.id===state.selected),next=(i+delta+items.length)%items.length;selectItem(items[next].id,state.tab==="grounds")}
function setPreset(name){const p=cameraPresets[name];if(!p)return;campusViewer.setCamera(p);document.querySelectorAll("[data-preset]").forEach(b=>b.classList.toggle("active",b.dataset.preset===name));toast(`${name.toUpperCase()} camera`)}

function openSource(viewer){state.sourceViewer=viewer;$("source-title").textContent=viewer.fileName;$("source-code").textContent=viewer.sourceText;$("source-lines").textContent=`${viewer.sourceText.split("\n").length} lines · ${viewer.objects.length} primitives`;$("source-modal").hidden=false;$("close-source").focus()}
function closeModal(id){$(id).hidden=true}
function downloadSource(){const v=state.sourceViewer;if(!v)return;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([v.sourceText],{type:"model/vrml"}));a.download=v.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),250)}

const tourStops=[
  {location:"CAMPUS / ARRIVAL",title:"A campus shaped by memory",copy:"Begin with an interpretive overview of Headquarters, landscape, aircraft, memorials, and the museum collection.",action:()=>setPreset("overview")},
  {location:"COURTYARD / 1990",title:"Kryptos turns reading into place",copy:"Copper, stone, water, wood, and magnetism hold four passages within Jim Sanborn’s landscape installation.",action:()=>{switchTab("grounds",false);selectItem("kryptos",true)}},
  {location:"AIR & SPACE / COLD WAR",title:"The view from above",copy:"OXCART and CORONA show two radically different systems built around strategic imaging.",action:()=>{switchTab("exhibits",false);selectItem("corona",true)}},
  {location:"DEEP PACIFIC / 1974",title:"Engineering a recovery",copy:"Project AZORIAN translated an extraordinary deep-ocean intelligence goal into ship, capture system, and cover story.",action:()=>selectItem("azorian",true)},
  {location:"TEHRAN / 1980",title:"The object is the cover",copy:"A portfolio, production identity, documents, and rehearsal made the fictional Studio Six feel real.",action:()=>selectItem("canadian-six",true)},
  {location:"MEMORIAL WALL",title:"End with the people",copy:"The campus is also a landscape of remembrance. Hand-cut stars hold public names and identities that remain protected.",action:()=>{switchTab("grounds",false);selectItem("memorial-wall",true)}}
];
function startTour(){closeModal("about-modal");state.tour=0;$("tour-card").hidden=false;applyTour()}
function applyTour(){const stop=tourStops[state.tour];$("tour-step").textContent=indexLabel(state.tour,tourStops.length);$("tour-location").textContent=stop.location;$("tour-title").textContent=stop.title;$("tour-copy").textContent=stop.copy;$("tour-progress").style.width=`${(state.tour+1)/tourStops.length*100}%`;$("tour-previous").disabled=state.tour===0;$("tour-next").textContent=state.tour===tourStops.length-1?"FINISH TOUR":"NEXT STOP →";stop.action()}
function moveTour(delta){if(state.tour===tourStops.length-1&&delta>0){$("tour-card").hidden=true;state.tour=-1;toast("Guided tour complete");return}state.tour=Math.max(0,Math.min(tourStops.length-1,state.tour+delta));applyTour()}

let toastTimer;function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),1700)}

function bind(){
  document.querySelectorAll("[data-rail-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.railTab)));
  $("collection-search").addEventListener("input",e=>{state.query=e.target.value;renderList()});
  document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>setPreset(b.dataset.preset)));
  document.querySelectorAll("[data-select]").forEach(b=>b.addEventListener("click",()=>{if(state.tab!=="grounds")switchTab("grounds",false);selectItem(b.dataset.select,true)}));
  $("previous-object").addEventListener("click",()=>stepObject(-1));$("next-object").addEventListener("click",()=>stepObject(1));
  $("reset-view").addEventListener("click",()=>setPreset("overview"));$("object-reset").addEventListener("click",()=>objectViewer.frameScene(true));
  $("toggle-spin").addEventListener("click",e=>{campusViewer.autoRotate=!campusViewer.autoRotate;e.currentTarget.classList.toggle("active",campusViewer.autoRotate);e.currentTarget.setAttribute("aria-pressed",String(campusViewer.autoRotate));toast(campusViewer.autoRotate?"Auto orbit on":"Auto orbit off")});
  $("toggle-labels").addEventListener("click",e=>{state.labels=!state.labels;e.currentTarget.classList.toggle("active",state.labels);e.currentTarget.setAttribute("aria-pressed",String(state.labels));updateHotspotPositions()});
  $("model-source").addEventListener("click",()=>openSource(campusViewer));$("exhibit-source-button").addEventListener("click",()=>openSource(objectViewer));$("close-source").addEventListener("click",()=>closeModal("source-modal"));$("download-source").addEventListener("click",downloadSource);
  $("about-button").addEventListener("click",()=>{$("about-modal").hidden=false;$("close-about").focus()});$("close-about").addEventListener("click",()=>closeModal("about-modal"));$("about-tour").addEventListener("click",startTour);
  $("tour-button").addEventListener("click",startTour);$("close-tour").addEventListener("click",()=>{$("tour-card").hidden=true;state.tour=-1});$("tour-previous").addEventListener("click",()=>moveTour(-1));$("tour-next").addEventListener("click",()=>moveTour(1));
  $("mobile-menu").addEventListener("click",e=>{const open=$("collection-rail").classList.toggle("open");e.currentTarget.setAttribute("aria-expanded",String(open))});$("object-panel-tab").addEventListener("click",()=>$("object-panel").classList.add("open"));$("object-panel-close").addEventListener("click",()=>$("object-panel").classList.remove("open"));
  for(const id of ["source-modal","about-modal"])$(id).addEventListener("click",e=>{if(e.target===e.currentTarget)closeModal(id)});
  document.addEventListener("keydown",e=>{if(e.key==="/"&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();$("collection-search").focus()}if(e.key==="Escape"){closeModal("source-modal");closeModal("about-modal");$("tour-card").hidden=true;$("collection-rail").classList.remove("open");$("object-panel").classList.remove("open")}})
}

async function init(){
  const bar=$("loading-bar"),message=$("loading-message");
  try{
    bar.style.width="12%";message.textContent="Starting local WebGL viewers…";
    campusViewer=new VRMLViewer($("campus-canvas"),{clear:[.78,.81,.76],fog:[.78,.81,.76],theta:.74,phi:.66});objectViewer=new VRMLViewer($("object-canvas"),{clear:[.82,.84,.80],fog:[.82,.84,.80],theta:.7,phi:.55});
    bind();renderList();renderDetails(exhibits[0]);updateViewerHeading(exhibits[0]);
    bar.style.width="38%";message.textContent="Reading campus.wrl…";
    const campusPromise=campusViewer.load("./models/campus.wrl");bar.style.width="54%";message.textContent="Reading A-12 exhibit model…";
    const objectPromise=objectViewer.load(exhibits[0].model);await Promise.all([campusPromise,objectPromise]);
    bar.style.width="82%";message.textContent="Placing museum landmarks…";campusViewer.setCamera(cameraPresets.overview,false);objectViewer.autoRotate=true;createHotspots();$("primitive-count").textContent=`${campusViewer.objects.length} PRIMITIVES`;$("model-meta").textContent=`VRML V2.0 · ${objectViewer.objects.length} primitives`;
    bar.style.width="100%";message.textContent="Archive ready";setTimeout(()=>{$("loading").classList.add("done");$("app-shell").setAttribute("aria-hidden","false")},280)
  }catch(error){console.error(error);message.textContent=`Unable to initialize: ${error.message}`;bar.style.width="100%";bar.style.background="#a82d32"}
}

init();
