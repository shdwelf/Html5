(function () {
  const STYLE_KEY = 'greeran-book-style-v1';
  const VAULT_KEY = 'greeran-book-vault-v1';

  // --- Quote of the Day engine ---
  const QOTD_QUOTES = [
    { text: "The point of this edition is not to romanticize or to flatten the record. It is to keep the whole available timeline in view.", cite: "Editorial Premise, Chapter I" },
    { text: "When Emergency! debuted on January 15, 1972, only 12 paramedic squads existed in the entire United States. By the time it ended, more than half of all Americans were within 4-7 minutes of advanced life-saving care.", cite: "The Emergency! Effect" },
    { text: "KMG365 — the call sign Station 51's crew uses to acknowledge dispatch — is a real FCC station license assigned to LACoFD Fire Station 98 in Bellflower.", cite: "Emergency! Research" },
    { text: "It was not a metaphor. It was a father literally giving a part of himself so his son could live without the machine.", cite: "Chapter IV — Robert & Chuck Hewitt" },
    { text: "The ham radio world was its own kind of fire service: a network of voices on the air, people listening and responding, a community built around the ability to reach out across distance with nothing but a signal and a frequency.", cite: "Maurice Frederick Hewitt, KG6ZD" },
    { text: "The award-winning story was about Battalion Chief Robert Hewitt. The real story was about what a family carries — in uniform, in blood, on the air.", cite: "Chapter IV — The Hewitt Family" },
    { text: "A balanced life file needs to show education, labor, volunteerism, and geography alongside the later legal record, while remaining honest about the fact that most of this broader life trail presently survives as self-description.", cite: "Chapter VI — Work, Service, and Craft" },
    { text: "The King hypothesis, held from the first session to the last, turned out to be true all along: Catherine King, daughter of Hugh King and Bridget Doyle of Dechomet, Drumgooland, Co. Down.", cite: "Chapter VII — The Seize Quartiers" },
    { text: "Fourteen of sixteen ancestral slots proven from primary sources, two strongly evidenced, none unknown — a seize quartiers completed in ten sessions of one day, using only free public records.", cite: "Chapter VII — The Seize Quartiers" },
    { text: "Samuel Carey of Bucks County served in the Plumstead Township Militia in 1780-81. He is NSDAR Ancestor #A020262 — which makes his Greeran descendants eligible for the lineage societies their ancestor earned.", cite: "Chapter VII — Deep Roots" },
    { text: "The family's service timeline runs 1780 to 1972: the Plumstead militia, four veterans of the Second World War across two theaters, and a Marine corporal at Da Nang, Hue, and Khe Sanh.", cite: "Chapter VIII — The Family Uniform" },
    { text: "Every tool in the workshop obeys one rule: a single HTML file, no keys, no server, no build step — run it anywhere, even air-gapped.", cite: "Chapter IX — The HTML5 Workshop" },
    { text: "The workshop and the family file are two halves of one habit: the research produced a 90,542-line GEDCOM, and the converter that turns such files into maps and reports sits in the same toolbox.", cite: "Chapter IX — The HTML5 Workshop" },
    { text: "The last word is not free poetry: its first bits complete the entropy and its final 4 bits are forced by SHA-256. Only 128 of the 2048 words can close the phrase.", cite: "Chapter IX — The BIP-39 Haiku Workbench" },
    { text: "Derivation paths stay locked until the checksum passes. A wallet refuses invalid mnemonics — so does the page.", cite: "Chapter IX — The BIP-39 Haiku Workbench" },
    { text: "120 curated phrases — 13 valid, 107 invalid. Repeated-word patterns show why a checksum can't be guessed; poetic phrases show why memorable entropy is almost never valid.", cite: "Chapter IX — The Haiku Catalogue" },
    { text: "The portfolio presents itself as an RC4-encrypted stream, and the key hint points at the subject's own username — a workshop that asks to be audited.", cite: "Chapter IX — ACME Cryptographic Audit Workstation" },
    { text: "Clark's Nutcracker caches 30,000+ pine seeds across 5,000-6,000 locations and recovers them nine months later using geometric landmark relationships.", cite: "Chapter IX — Audubon Bird Brain Research" },
    { text: "Thirty years of ACME Labs — Unix stream filters, X11 root-window animations, thttpd, bignums — remastered as 23 components that run in a browser tab.", cite: "Chapter IX — ACME Labs HTML5 Software Suite" },
    { text: "A browser DSP studio modeling THX Deep Notes, Dolby Atmos object panning, Bose phase-inversion cancellation, and IMAX 15 Hz sub-bass — 60 frames a second, zero installs.", cite: "Chapter IX — AURA SoundStudio Pro" },
    { text: "The show's dispatch sequences were not fiction to Grandpa; they echoed LACOFD dispatch, the actual radio traffic of the Los Angeles County Fire Department.", cite: "Chapter IV — Personal Recollection" },
    { text: "Being halfback meant running the midfield, connecting defense to attack, doing the work that rarely made the highlight reel but kept the game moving.", cite: "Chapter III — Glendora Childhood" },
    { text: "Those were not costumes — they were artifacts of a career.", cite: "On Grandpa's dress uniform" },
    { text: "The blacktop lunch was a universal Southern California school experience — and the seagulls would come inland from the beach, wheeling over the campus looking for scraps, proof that the ocean was never as far away as it seemed.", cite: "Chapter III — The Milk Man" },
    { text: "An entire generation of firefighters grew up watching the adventures of Johnny and Roy, and many of them credit the television show with motivating them to choose their careers in public safety.", cite: "LA County Fire Museum, Emergency! History" },
    { text: "When filming began in late 1971, the paramedic program in Los Angeles County was barely two years old, and paramedics had only gained the freedom to go out on calls without nurses in 1970.", cite: "Station 127, Carson, CA" },
    { text: "Publishing unsourced memories as fact would blur the line between biography and invention, and in some cases would identify third parties who are not public figures.", cite: "Chapter XI — Gaps & Private Prompts" },
    { text: "The Squad and the Ward LaFrance Engine — restored by volunteers, donated by Universal, retired from Yosemite, brought home to Bellflower.", cite: "LA County Fire Museum" },
    { text: "Squad 51 also made appearances in the hit TV show CHiPs, filmed at MGM Studios in Culver City — now Sony Pictures Studios.", cite: "Culver City & CHiPs Connection" },
    { text: "CHiPs Central was filmed at 777 W. Washington Blvd, Los Angeles — the real CHP Central Los Angeles Area Office. Interior scenes were later shot on Stage 10 at MGM Studios in Culver City.", cite: "CHiPs Filming Locations" },
    { text: "Both the Disney chipmunks 'Chip 'n' Dale' and the male strip club 'Chippendales' are independently named after Thomas Chippendale, the 18th-century English furniture maker.", cite: "Culver City Cultural Footnote" },
    { text: "In 1979, Steve Banerjee renamed his failing West LA bar 'Destiny II' to 'Chippendales' and launched the first all-male stripping venue for women. The original club closed in 1988 after losing its liquor license and fire permit.", cite: "Chippendales History, West Los Angeles" },
    { text: "Grandpa gave his dress uniform, badge, and clothes to keep. The uniform service brought replacements, and what was retired from duty became history in a child's hands.", cite: "Chapter IV — The Hewitt Family" },
    { text: "The familiar tones that called Station 51 into service were initiated by dispatch using a Motorola Quik Call I unit, listening on a common paging frequency for a pair of special audio tones assigned to that station.", cite: "Emergency! Dispatch Technical Detail" },
    { text: "A callsign on the ham radio band — KG6ZD — that kept transmitting.", cite: "Maurice Frederick Hewitt" },
    { text: "El Monte had its own fire department from 1912 to 1998, when it contracted with LACoFD. The four stations became LACoFD Stations 166 through 169.", cite: "LACoFD El Monte Research" },
    { text: "Battalion 10 covers El Monte, Rosemead, San Gabriel, South El Monte, and Temple City — headquartered at Station 4.", cite: "LACoFD Battalion 10" },
    { text: "Clarice, the female chipmunk singer, debuted in 'Two Chips and a Miss' (1952) at the Acorn Club. Chip and Dale both wore tuxedos. She didn't reappear in animation for 69 years.", cite: "Disney — Two Chips and a Miss" },
    { text: "In 'Chips Ahoy' (1956), Chip and Dale steal a ship in a bottle from Donald's fishing shack to sail to an island overflowing with acorns. Donald ends up stranded. The final Chip 'n' Dale theatrical short.", cite: "Disney — Chips Ahoy" },
    { text: "Both 'Chip 'n' Dale' and 'Chippendales' are named after Thomas Chippendale, the 18th-century English furniture maker. In 'House of Mouse,' Minnie hires the chipmunks as the 'Chip and Dale Dancers' — a parody of Chippendales.", cite: "Disney & Chippendales Connection" },
    { text: "Over 220 cabins were built in Big Santa Anita Canyon during the Great Hiking Era. Materials hauled in by mules and people's backs on narrow mountain trails — pack trains traveled seven days a week.", cite: "Chantry Flat Cabin History" },
    { text: "The Chantry Road to the trailhead wasn't built until 1935. Before that, you hiked from Sierra Madre, adding four miles each way. Everything — lumber, propane, groceries, furniture — still goes in by mule.", cite: "Chantry Flat, Angeles National Forest" },
    { text: "Adams Pack Station, operating since 1936, is the last remaining pack station in Southern California. Donkeys and mules still carry supplies to the 80 privately owned cabins and Sturtevant Camp.", cite: "Adams Pack Station, Chantry Flat" },
    { text: "The cabins cannot be rebuilt if lost — a living museum to early 20th-century Southern California mountain life. The canyon has the last magneto-type crank phone system in the United States.", cite: "Big Santa Anita Canyon Preservation" },
    { text: "Great-grandfather brought the family up to Angeles Crest campground on top of the ridge, where they built huts — materials packed up by mule from Chantry Flats. They lived in cabins.", cite: "Chapter IV — Family Mountain History" },
    { text: "Fire Station 47 is in Temple City, near the University of the West in Rosemead. BC Robert Hewitt was captain there for a long time — Battalion 10, Division 9.", cite: "LACoFD Temple City Research" },
    { text: "Robert D. Hewitt and Janice E. Murasko, 53144 Pine Road, Idyllwild-Pine Cove, CA 92549. Purchased May 3, 2013. High Country Archery — traditional archery instruction, Level 2 certified with USA Archery.", cite: "Property Records & High Country Archery" },
    { text: "When Highway 243 is closed from fire or landslide damage, the alternate route to Idyllwild comes up from the south through Temecula: I-15 to Highway 79 to Highway 371 to Highway 74.", cite: "Idyllwild Access Research" },
    { text: "The 2018 Cranston Fire burned 7,500 acres and forced the evacuation of Idyllwild, Pine Cove, Fern Valley, and Cedar Glen. Highway 243 closed between Pine Cove and Mountain Center.", cite: "Cranston Fire, July 2018" },
    { text: "Adams Pack Station at Chantry Flat — where mail and supplies come from. The last remaining pack station in Southern California, operating since 1936.", cite: "Chapter IV — Family Mountain History" },
    { text: "During the Cold War, 16 Nike missile sites surrounded Los Angeles in the 'Ring of Supersonic Steel.' The San Gabriel ridge was designed to lay cover for the city to retreat.", cite: "Nike Missile Defense Perimeter" },
    { text: "Mount Gleason (LA-04) was the first Nike missile site in the Angeles National Forest, active 1955–1974. After decommissioning, it became LACoFD Camp 16 — destroyed in the 2009 Station Fire.", cite: "LA-04 Mount Gleason Research" },
    { text: "Robert has an antique fire engine at his nephew Randy's place in Phelan. The user gave him an antique fire extinguisher to go with it — fire-service family artifacts, kept in the high desert.", cite: "Chapter IV — Hewitts of the Highlands" },
    { text: "The LA Emergency Operations Command Center is the most earthquake-proof building in Los Angeles, designed with seismic moat covers to withstand 27 inches of movement.", cite: "LA Command Center Research" },
    { text: "Grandfather Bernard worked at Aerojet in Azusa with security clearance. Aerojet sold the facility in 2001 to Northrop Grumman — now Space Systems division. R&D, optics, infrared detectors for satellites.", cite: "Chapter IV — Bernard at Aerojet" },
    { text: "Aerojet was founded in 1942 and moved to Azusa in January 1943. By December they had 150 employees. The Army ordered 2,000 rockets before year's end. The company that launched the space age started in a San Gabriel Valley suburb.", cite: "Aerojet History, Azusa" },
    { text: "The Azusa site was declared an EPA Superfund Site in 1985 after TCE contamination was found in groundwater. NDMA and ammonium perchlorate followed in 1997. The San Gabriel Valley's buried rocket legacy.", cite: "San Gabriel Superfund Site II" },
    { text: "In Florida, near the Everglades, a 1963 Aerojet rocket test went wrong — the nozzle ejected, spreading hydrochloric acid across wetlands, crop fields, and homes. The AJ-260-2 motor still sits in its silo today.", cite: "Aerojet Florida Facility" },
    { text: "In 1943, Parsons, Malina, Forman, and von Kármán established Aerojet Engineering Corporation to manufacture JATO motors. JPL was officially named in November 1943. Aerojet and JPL were born from the same group.", cite: "Aerojet & JPL Origins" },
    { text: "Conway Snyder accidentally launched the world's first underwater rocket from a rowboat at Morris Dam. The sixth rocket shot out of the water and through the air. This mishap helped lead to the submarine-launched Polaris ICBM.", cite: "Morris Dam, Conway Snyder, Caltech" },
    { text: "The Variable Angle Launcher at Morris Dam was the only such structure in the nation — a 300-foot welded steel frame firing torpedoes at up to 680 mph into the reservoir, adjustable from 5 to 38 degrees.", cite: "Morris Dam Naval Weapons Test Site" },
    { text: "The torpedo tests 'paid off for the fleet with the tremendous victories won by Navy aviators at the Battle of Leyte Gulf in October 1944' — 60 enemy ships sunk.", cite: "Morris Dam Testing, WWII" },
    { text: "Same San Gabriel Canyon. Same Caltech/JPL scientists. Same classified defense work. Same mountain. Bernard at Aerojet in Azusa. The torpedoes at Morris Dam just up the road.", cite: "Chapter IV — The San Gabriel Defense Corridor" },
    { text: "On Halloween 1936, the Suicide Squad — Malina, Parsons, Forman — tested their first rocket motor in the Arroyo Seco. People on campus started calling them the Suicide Squad after a detonation launched a gauge piece into GALCIT's wall.", cite: "JPL Origins, Caltech" },
    { text: "The Dalton Hotshots were organized in September 1953 in Glendora. Foreman Chuck Hartley and 22 Native American firefighters — 11 Jemez, 11 Zia from New Mexico. The Bighorn Ram. Before Robert was a captain, he was a hotshot.", cite: "Angeles National Forest Hotshot History" },
    { text: "When I started, there were barely a dozen Hotshot crews in the whole country. Now there's more than 150. We were part of building that foundation.", cite: "Chuck Hartley, Dalton Hotshots Superintendent" },
    { text: "Years ago there were Fry's, Marvacs in Pasadena, Orvac's in Orange and Radio Shacks. They are all gone. Maurice's workbench: vacuum tube and TV repair, radio batteries to VCR repair.", cite: "Chapter IV — Maurice's Workbench in Duarte" },
    { text: "Maurice made terminals that went in fire engines for texting dispatch — custom-built Mobile Data Terminals connecting responding crews to Computer-Aided Dispatch. In the early days, many MDTs were custom devices.", cite: "Chapter IV — Maurice's Fire Dispatch Terminals" },
    { text: "WildCAD: the computer-aided dispatch system used by wildland fire agencies nationwide. Angeles National Forest is federal — the archives might go back to early digital dispatch records.", cite: "WildCAD Research, Angeles National Forest" },
    { text: "Gordon Rowley moved to Glendora in 1956. The Big Dalton Canyon Campground was renamed the Rowley Wilderness Amphitheater on May 24, 2020 — approved unanimously by City Council.", cite: "Big Dalton Canyon, Glendora" },
    { text: "An LI-900 tile can be heated to 2,200°F and plunged into cold water without damage. Made from 99.9% pure silica glass fibers, 94% air by volume. About 20,000 tiles per shuttle.", cite: "Space Shuttle Thermal Protection System" },
    { text: "Lockheed refused to file a patent, saying there was no market for it. It was put on the shelf and his research stopped for two years. Then interest from the shuttle program revived it.", cite: "Kevin Forsberg, Lockheed, on Robert Beasley's tile invention" },
    { text: "Big Dalton Canyon: named after Henry Dalton, born London 1803, settled 1843. The closest neighbor to 2860 was Candice Driscoll — the NSA connection to deciphering.", cite: "Chapter III — Big Dalton Canyon Neighborhood" },
    { text: "Ohmer took a general on a reconnaissance flight at 5,000 feet. He asked the guest to identify the plant, but all the general said he could see was suburb after California suburb.", cite: "Operation Camouflage, Lockheed Burbank, WWII" },
    { text: "The first 50 U-2 spy planes were assembled at a secret Lockheed facility on Norris Road in Oildale, disguised as a tire factory. Built in 1956-1957, then flown at night to Groom Lake.", cite: "U-2 History, Oildale/Bakersfield" },
    { text: "Warner Brothers disguised a nearby studio to look like an aircraft plant from the air, in case the Japanese had intelligence that there was a military facility in the area.", cite: "Operation Camouflage, Hollywood Decoy" },
    { text: "The names have been changed. Like camouflaged Burbank during the war, the facility was making the space shuttle in Azusa.", cite: "Chapter IV — Personal Recollection" },
    { text: "Peter Merlin spent 25+ years locating crash sites of historic aircraft from Area 51 and Edwards. He and Tony Moore co-founded the Aviation Archeology Field Research Team.", cite: "CLUI, Down to Earth Exhibition" },
    { text: "The Road Runners Internationale — people who worked on secret aircraft programs at Area 51 and Groom Lake. U-2, SR-71, OXCART/A-12. The 25th reunion, October 10, 2017.", cite: "Road Runners Internationale" },
    { text: "Frank Murray, call sign DUTCH 20, CIA pilot who flew the A-12 OXCART at Area 51. Awarded the CIA Intelligence Star for Valor, May 17, 1968.", cite: "Road Runners Internationale — Frank Murray" },
    { text: "Jack Weeks, call sign DUTCH 29, was killed when his A-12 broke up over the Pacific. His letters continued to arrive after his death — a salute to his love and concern for his family.", cite: "Road Runners Internationale — Jack Weeks" },
    { text: "Jack called from Okinawa on June 1, 1968 to wish his son Steve and daughter Susan a happy birthday. Three days later he disappeared without a trace.", cite: "Jack Weeks Tribute, Roadrunners Internationale" },
    { text: "The bus left from CLUI's office in Culver City, looping through the Antelope Valley. Merlin and Moore on board, explaining what happened to cause an X-15 to crash at this location in 1967.", cite: "CLUI Field Trip, 2013" },
    { text: "Rushing to JPL because Mr. Surampudi was inviting us for the naming of the Sojourner rover. They had given out Hot Wheels cars to the guests on tour.", cite: "Personal Recollection \u2014 JPL" },
    { text: "The name Sojourner was chosen through a worldwide contest won by Valerie Ambroise, 12, of Bridgeport, Connecticut \u2014 named after Sojourner Truth, abolitionist and women\u2019s rights activist.", cite: "Mars Pathfinder, JPL" },
    { text: "The MUFON Symposium in Los Angeles. The Alien Research Center in Hiko. The Little A’Le’Inn in Rachel. The sheriff will stop you before the lonely road.", cite: "Personal Reclection — Area 51" },
    { text: "Creech Air Force Base escorting with a drone. General Atomics is over there guarding El Mirage. I used to live in Wrightwood.", cite: "Personal Reclection — Wrightwood & El Mirage" },
    { text: "The Gathering of the Eagles at Edwards. They auction everything. Angela was the hostess. The base commander\u2019s funeral at the veterans cemetery above Tehachapi.", cite: "Personal Reclection \u2014 Edwards AFB" },
    { text: "The 412th Test Wing paired with SETP to arrange the test pilots school in Mojave. SETP was founded in 1955 when six test pilots met at Aleck\u2019s in Lancaster.", cite: "SETP History" },
    { text: "The MUFON Symposium at the JW Marriott in Las Vegas. The Case for the Secret Space Program. George Knapp has been a regular speaker.", cite: "MUFON Symposium, Las Vegas" },
    { text: "They don\u2019t like to have their names on it. But that\u2019s how I ended up at the atomic testing museum.", cite: "Personal Reclection \u2014 Las Vegas" },
    { text: "I was geocaching along the way. Some stories along the way, much the same as Ingress and Munzee.", cite: "Personal Reclection \u2014 E.T. Highway" },
    { text: "2,000 geocaches along the Extraterrestrial Highway. 51 in the shape of an alien head in the middle of the desert. A power cache.", cite: "E.T. Highway Geocaching" },
    { text: "I was there for the first flight of the B-2 stealth bomber and Stratolaunch. What an age difference \u2014 30 years apart.", cite: "Personal Reclection \u2014 Edwards/Palmdale/Mojave" },
    { text: "The musical highway is a blast. Avenue G, Lancaster. Rumble strips playing the William Tell Overture at 55 miles per hour.", cite: "Personal Reclection \u2014 Lancaster" },
    { text: "The Forest Service had a Skunk. A Stalker UAV \u2014 12-foot wingspan, 8-hour flight time, launched by bungee. The same Skunk Works that built the U-2 and SR-71.", cite: "Fox Field Job Fair, Lancaster" },
    { text: "Eugene Moses was my boss at the San Gabriel Valley Examiner. A colonel who took shrapnel. Former mayor of Azusa. He built Canyon City Ghost Town on San Gabriel Canyon Road.", cite: "Personal Reclection \u2014 Eugene Moses, San Gabriel Valley Examiner" },
    { text: "The newspaper was next to the Naked Juice factory in Glendora. Naked Juice Co. of Glendora, Inc. \u2014 the company was literally named after the city.", cite: "San Gabriel Valley Examiner / Naked Juice" },
    { text: "Like Harry Truman I was there when it was burning. He was there when it erupted. The wildfire activity in the San Gabriel Mountains is unusual.", cite: "Personal Reclection \u2014 Wildfires" },
    { text: "David Valentine worked on WiFire at SDSC after working for Greg Jan\u00e9e at the Davidson Library Map and Image Laboratory on the Alexandria Digital Library Gazetteer.", cite: "UCSB / SDSC / WiFire" },
    { text: "I worked for David Seubert, curator of special collections at UCSB. He went to Oberlin. I connected the Apple Darwin wax cylinder recordings to Z39.50 PHP to send queries to the Pegasus system that syncs with MELVYL.", cite: "Personal Reclection \u2014 UCSB Davidson Library" },
    { text: "The California Digital Library was founded in 1997 by the UC Board of Regents. A library without walls. It emerged from efforts to enhance MELVYL, the UC system\u2019s union catalog.", cite: "California Digital Library / UC Board of Regents" },
    { text: "Lego Logo for the Apple IIe at Cal Poly Pomona. Programming robotic equipment from the COM port. Arthurian legend. French with Hometown U.S.A.", cite: "Summer School, Cal Poly Pomona" },
    { text: "Hometown, U.S.A. \u2014 1988 software for building 3D models of homes and schools. Now abandonware on the Internet Archive. Won the 1989 SPA Award.", cite: "Hometown U.S.A., Publishing International" }
  ];

  let qotdIndex = Math.floor(Math.random() * QOTD_QUOTES.length);

  function renderQOTD() {
    const q = QOTD_QUOTES[qotdIndex];
    const textEl = document.getElementById('qotdText');
    const citeEl = document.getElementById('qotdCite');
    if (textEl && citeEl) {
      textEl.textContent = q.text;
      citeEl.textContent = '— ' + q.cite;
    }
  }

  const qotdPrev = document.getElementById('qotdPrev');
  const qotdNext = document.getElementById('qotdNext');
  const qotdRandom = document.getElementById('qotdRandom');

  if (qotdPrev) {
    qotdPrev.addEventListener('click', function () {
      qotdIndex = (qotdIndex - 1 + QOTD_QUOTES.length) % QOTD_QUOTES.length;
      renderQOTD();
    });
  }
  if (qotdNext) {
    qotdNext.addEventListener('click', function () {
      qotdIndex = (qotdIndex + 1) % QOTD_QUOTES.length;
      renderQOTD();
    });
  }
  if (qotdRandom) {
    qotdRandom.addEventListener('click', function () {
      qotdIndex = Math.floor(Math.random() * QOTD_QUOTES.length);
      renderQOTD();
    });
  }

  renderQOTD();

  const palettes = [
    {
      id: 'desert-brass',
      name: 'Desert brass',
      sceneA: '#3c342b',
      sceneB: '#191612',
      paper: '#f6eedf',
      paper2: '#eadbbd',
      ink: '#1d1812',
      inkSoft: '#5f5343',
      accent: '#9a6a12',
      accent2: '#70490d'
    },
    {
      id: 'spruce-ledger',
      name: 'Spruce ledger',
      sceneA: '#20352f',
      sceneB: '#111b18',
      paper: '#edf2e7',
      paper2: '#d6e4d2',
      ink: '#16201c',
      inkSoft: '#4d6158',
      accent: '#3f7d60',
      accent2: '#2f5e47'
    },
    {
      id: 'oxford-file',
      name: 'Oxford file',
      sceneA: '#1f2e49',
      sceneB: '#101723',
      paper: '#eef2f8',
      paper2: '#dbe4f2',
      ink: '#141a23',
      inkSoft: '#4d596d',
      accent: '#496fa9',
      accent2: '#294e80'
    },
    {
      id: 'plum-archive',
      name: 'Plum archive',
      sceneA: '#3c2439',
      sceneB: '#1d111a',
      paper: '#f5ecf4',
      paper2: '#ead7e6',
      ink: '#231520',
      inkSoft: '#624e5d',
      accent: '#9a4e82',
      accent2: '#773763'
    },
    {
      id: 'basalt-court',
      name: 'Basalt court',
      sceneA: '#2b3135',
      sceneB: '#131618',
      paper: '#f1f1ef',
      paper2: '#dfdfdb',
      ink: '#181a1c',
      inkSoft: '#53585c',
      accent: '#7a5f4a',
      accent2: '#57412f'
    }
  ];

  const papers = [
    { id: 'field-notebook', name: 'Field notebook' },
    { id: 'ambassador-ledger', name: 'Ambassador ledger' },
    { id: 'cotton-rag', name: 'Cotton rag' },
    { id: 'dot-grid', name: 'Dot grid' },
    { id: 'onion-skin', name: 'Onion skin' },
    { id: 'blueprint-sheet', name: 'Blueprint sheet' },
    { id: 'archive-card', name: 'Archive card' },
    { id: 'legal-pad', name: 'Legal pad' },
    { id: 'marbled-endpaper', name: 'Marbled endpaper' },
    { id: 'postcard-stock', name: 'Postcard stock' }
  ];

  const themeNumber = document.getElementById('themeNumber');
  const paletteName = document.getElementById('paletteName');
  const paperName = document.getElementById('paperName');
  const paperSelect = document.getElementById('paperSelect');
  const rollStyle = document.getElementById('rollStyle');
  const storeStyle = document.getElementById('storeStyle');
  const progress = document.getElementById('progress');

  const fileList = document.getElementById('fileList');
  const filePathInput = document.getElementById('filePathInput');
  const fileEditor = document.getElementById('fileEditor');
  const vaultStatus = document.getElementById('vaultStatus');
  const newFileBtn = document.getElementById('newFileBtn');
  const saveFileBtn = document.getElementById('saveFileBtn');
  const deleteFileBtn = document.getElementById('deleteFileBtn');
  const snapshotBtn = document.getElementById('snapshotBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');

  let styleState = loadStyleState();
  let vault = loadVault();
  let currentFile = Object.keys(vault.files).sort()[0];

  function loadStyleState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STYLE_KEY) || '{}');
      if (typeof parsed.paletteIndex === 'number' && typeof parsed.paperIndex === 'number') {
        return parsed;
      }
    } catch (err) {}
    return { paletteIndex: 0, paperIndex: 0 };
  }

  function saveStyleState() {
    localStorage.setItem(STYLE_KEY, JSON.stringify(styleState));
  }

  function applyTheme() {
    const palette = palettes[styleState.paletteIndex % palettes.length];
    const paper = papers[styleState.paperIndex % papers.length];
    const root = document.documentElement.style;
    root.setProperty('--scene-a', palette.sceneA);
    root.setProperty('--scene-b', palette.sceneB);
    root.setProperty('--paper', palette.paper);
    root.setProperty('--paper-2', palette.paper2);
    root.setProperty('--ink', palette.ink);
    root.setProperty('--ink-soft', palette.inkSoft);
    root.setProperty('--accent', palette.accent);
    root.setProperty('--accent-2', palette.accent2);
    document.body.dataset.paper = paper.id;
    themeNumber.textContent = String(styleState.paletteIndex * papers.length + styleState.paperIndex + 1).padStart(2, '0') + ' / 50';
    paletteName.textContent = palette.name;
    paperName.textContent = paper.name;
    paperSelect.value = paper.id;
    saveStyleState();
  }

  function randomizeStyle() {
    styleState.paletteIndex = Math.floor(Math.random() * palettes.length);
    styleState.paperIndex = Math.floor(Math.random() * papers.length);
    applyTheme();
    setVaultStatus('Random style rolled and stored in browser settings.');
  }

  papers.forEach((paper, index) => {
    const option = document.createElement('option');
    option.value = paper.id;
    option.textContent = paper.name;
    option.dataset.index = String(index);
    paperSelect.appendChild(option);
  });

  paperSelect.addEventListener('change', function () {
    styleState.paperIndex = papers.findIndex((paper) => paper.id === paperSelect.value);
    if (styleState.paperIndex < 0) styleState.paperIndex = 0;
    applyTheme();
    setVaultStatus('Paper texture changed.');
  });

  rollStyle.addEventListener('click', randomizeStyle);
  storeStyle.addEventListener('click', function () {
    const styleFile = {
      saved_at: new Date().toISOString(),
      theme_number: styleState.paletteIndex * papers.length + styleState.paperIndex + 1,
      palette: palettes[styleState.paletteIndex].name,
      paper: papers[styleState.paperIndex].name,
      palette_index: styleState.paletteIndex,
      paper_index: styleState.paperIndex
    };
    vault.files['/settings/style.json'] = JSON.stringify(styleFile, null, 2);
    saveVault();
    renderFiles();
    openFile('/settings/style.json');
    setVaultStatus('Current style stored at /settings/style.json');
  });

  function defaultVault() {
    return {
      version: 1,
      files: {
        '/chapters/00-premise.md': [
          '# Premise',
          '',
          'This book model is built from two source classes:',
          '- official 2025 USVI public records',
          '- a self-published Steven Greeran web resume',
          '',
          'Keep the legal chronology factual and keep self-published material clearly labeled.'
        ].join('\n'),
        '/chapters/01-southern-california-trail.md': [
          '# Southern California trail',
          '',
          'Verified from the self-published resume:',
          '- Glendora High School (1997-2001)',
          '- Citrus Community College (2001 summer school)',
          '- California State Polytechnic Institute Pomona (1998 summer school)',
          '- Duarte, San Dimas, Pomona references in projects/volunteer listings',
          '',
          'Only move extra place anecdotes into the public book after verification.'
        ].join('\n'),
        '/chapters/02-ucsb-santa-barbara.md': [
          '# UCSB and Santa Barbara years',
          '',
          'Resume-backed items:',
          '- UCSB CMPSCI / College of Engineering (2001-2004)',
          '- Davidson Library / Alexandria Digital Library student programming',
          '- Wax-cylinder project listing',
          '- Santa Barbara Food Bank / Botanic Garden / Goleta fair references'
        ].join('\n'),
        '/chapters/03-public-record.md': [
          '# Official public record',
          '',
          '- California conviction referenced by VIDOJ',
          '- Initial USVI registration: 2022-10-28',
          '- Most recent published update: 2023-10-27',
          '- Missed annual update: 2024-10-28',
          '- Wanted notice: 2025-02-21',
          '- Arrest: 2025-02-23',
          '- Arraignment / charge / bail: 2025-02-24',
          '',
          'Pending charge is not a conviction.'
        ].join('\n'),
        '/chapters/04-glendora-childhood.md': [
          '# Growing up in Glendora — prompts to expand',
          '',
          '## Verified from personal recollection (labeled)',
          '- House at 2860, Glendora. Small room in the back.',
          '- Landers soccer team, halfback. Teammate: Chris Griffin.',
          '- Found near-sighted (eye exam).',
          '- Required to learn instrument → violin at Seller\'s.',
          '- Cafeteria job: milk man, 50¢ boxed milk.',
          '- Blacktop lunches, seagulls from the beach.',
          '- Aunt Lila (Uncle Chuck\'s wife) = Dr. Bushman\'s secretary, GUSD district office.',
          '',
          '## Prompts still to fill in',
          '- [ ] What grade/age when started soccer with the Landers?',
          '- [ ] Seller\'s full name & location — music store or school program?',
          '- [ ] Which school had the cafeteria milk job? Elementary? Middle?',
          '- [ ] Other teammates besides Chris Griffin?',
          '- [ ] What years at 2860? Did the family move?',
          '- [ ] Any other Glendora schools attended before GHS?',
          '- [ ] City recreation activities or parks frequented?',
          '',
          '## Robert Hewitt Jr. & Janice — Idyllwild / Pine Cove',
          '- Robert D. Hewitt remarried and retired with Janice E. Murasko.',
          '- Property: 53144 Pine Road, Idyllwild-Pine Cove, CA 92549.',
          '- Purchased May 3, 2013 for $435,000 from John W. Wallen III.',
          '- High Country Archery at same address (established 2014, now closed).',
          '  - Robert Hewitt: Level 2 certified archery coach, USA Archery.',
          '  - Traditional archery: recurve, long bow instruction.',
          '  - Phone: 951-659-6385 / alt: 626-833-2311',
          '  - Email: rhewittarchery@gmail.com',
          '- Janice runs an animal school for dogs.',
          '',
          '## Getting there — the back way through Temecula',
          '- Main entrance (Highway 243 from Banning) repeatedly closed:',
          '  - Feb 2019 storms collapsed sections of 243 (closed most of year).',
          '  - 2018 Cranston Fire (7,500 acres) evacuated Idyllwild, Pine Cove, Fern Valley.',
          '  - 2020 boulder blasting closures on 243.',
          '- Diamond Zen Center: 18500 Diamond Zen Rd, Banning — NOT the Hewitt place.',
          '  - 15 miles north of Idyllwild, down the hill toward Banning.',
          '  - Korean influence, desert surroundings.',
          '- Alternate route: up through Temecula via Highway 74 from the south.',
          '  - From Temecula: I-15 → Hwy 79 → Hwy 371 → Hwy 74 → Idyllwild.',
          '  - Or through Hemet on Highway 74.',
          '',
          '## Hewitts of the High Desert — Randy & Kim in Phelan',
          '- Robert Hewitt\'s nephews: Randy Hewitt and Kim in Phelan, CA.',
          '- "Hewitts of the Highlands" — property name or family reference.',
          '- Phelan: unincorporated San Bernardino County, High Desert, 75 miles NE of LA.',
          '- Near Wrightwood, north of the San Gabriel Mountains, ~4,100 ft elevation.',
          '- Robert has an antique fire engine at Randy\'s place in Phelan.',
          '- User gave Robert an antique fire extinguisher to go with the fire engine.',
          '',
          '## Nike missile sites — the San Gabriel ridge',
          '- 16 Nike missile sites surrounded LA during the Cold War ("Ring of Supersonic Steel").',
          '- Purpose: intercept Soviet bombers before they could reach the city.',
          '- The San Gabriel Mountains ridge was designed with missile sites to lay cover',
          '  for Los Angeles to retreat — a defensive perimeter.',
          '- Key sites in the Angeles National Forest:',
          '  - Mount Gleason (LA-04): first Nike site in the Angeles, active 1955-1974.',
          '    - Later became LACoFD Camp 16 (destroyed in 2009 Station Fire).',
          '  - Los Pinetos/Newhall (LA-94): 4,000 ft above San Fernando Valley, 1955-1968.',
          '  - Barley Flats/Mount Disappointment (LA-09).',
          '  - Magic Mountain/Lang (LA-98).',
          '- South El Monte site (LA-14): near Whittier Narrows, active 1956-1961.',
          '- LA-96: Encino hills, Mulholland Drive, active 1956-1968 (now San Vicente Mountain Park).',
          '- All decommissioned by 1974 under SALT agreement.',
          '',
          '## Aerojet — Grandfather Bernard in Azusa',
          '- Grandfather Bernard worked at Aerojet in Azusa, California.',
          '- Aerojet founded 1942, moved to Azusa in January 1943.',
          '- Address: 1100 W Hollyvale St, Azusa, CA 91702.',
          '- Rocket engine manufacturing, JATO (Jet-Assisted TakeOff) units, testing.',
          '- Bernard had security clearance — classified military/defense projects.',
          '- Aerojet sold the Azusa facility in 2001 to Northrop Grumman Corporation.',
          '- Now operates as Northrop Grumman Space Systems division.',
          '',
          '## Aerojet Superfund sites',
          '- Azusa site: TCE contamination in groundwater discovered 1980.',
          '  - 1985: declared Superfund Site (San Gabriel Superfund Site II).',
          '  - 1997: NDMA and Ammonium Perchlorate contamination also found.',
          '  - Cleanup under Baldwin Park Operable Unit.',
          '- Rancho Cordova (Sacramento): main propulsion facility, 8,500 acres.',
          '  - Superfund site since 1983. 27-square-mile groundwater contamination.',
          '  - Solvents: TCE, chloroform. Rocket fuel byproducts: NDMA, perchlorate.',
          '  - $60 million cleanup ordered 2011. Purifies 25 million gallons/day.',
          '- Florida facility: near Homestead, near Everglades National Park.',
          '  - Built 1963 for solid fuel rocket motor manufacturing.',
          '  - Canal redirected fresh water from Taylor Slough into Barnes Sound.',
          '  - During testing, rocket nozzle ejected, spreading hydrochloric acid',
          '    across wetlands, crop fields, and homes in Homestead.',
          '  - AJ-260-2 rocket motor remains in silo to this day.',
          '  - 5,100 acres traded to Bureau of Land Management, now nature preserve.',
          '- Chino Hills: former ordnance facility, 800 acres.',
          '  - Munitions, explosive compounds, depleted uranium, perchlorate.',
          '  - Ceased operations 1995. Cleanup ongoing.',
          '',
          '## JPL, Caltech, and the Aerojet connection',
          '- JPL traces roots to 1936 at Caltech (GALCIT - Guggenheim Aeronautical Lab).',
          '- The "Suicide Squad": Frank Malina, Jack Parsons, Edward Forman.',
          '- Halloween 1936: first rocket motor test in the Arroyo Seco, Pasadena.',
          '- In 1943, Parsons, Malina, Forman, and von Karman established Aerojet',
          '  Engineering Corporation to manufacture JATO (Jet-Assisted Take-Off) motors.',
          '- JPL officially named November 1943 — Aerojet and JPL born from the same group.',
          '- Aerojet moved to Azusa in January 1943. JPL stayed in Pasadena.',
          '- Bernard worked in the same building where Caltech/JPL people worked.',
          '',
          '## Morris Dam — torpedo testing in the San Gabriel Mountains',
          '- Morris Dam: on the San Gabriel River, 3-5 miles north of Azusa.',
          '- Built 1934 by Pasadena for water supply. Named after Samuel B. Morris.',
          '- 245-foot concrete gravity dam, 1.5-mile-long, 160-foot-deep reservoir.',
          '- WWII (1943): Caltech established Morris Reservoir Naval Weapons Test Site',
          '  for the U.S. Navy. Substation of Naval Ordnance Test Station (NOTS) China Lake.',
          '- Caltech managed operations 1943-1950. Navy took over after.',
          '- Testing: torpedoes, depth bombs, submarine-launched weapons, Polaris missile.',
          '- Variable Angle Launcher (VAL): only such structure in the nation.',
          '  - 300-foot welded steel frame, compressed air, speeds up to 680 mph.',
          '  - Adjustable from 5 to 38 degrees entry angle.',
          '  - 24 hydrophones, cameras on shoreline, cables, underwater housings.',
          '- Conway Snyder (Caltech grad student, later JPL scientist):',
          '  - Accidental underwater rocket launch from a rowboat at Morris Dam.',
          '  - This mishap helped lead to development of submarine-launched Polaris ICBM.',
          '- Torpedo tests "paid off with tremendous victories at Battle of Leyte Gulf, Oct 1944"',
          '  — 60 enemy ships sunk by Navy aviators.',
          '- Testing continued until June 1993. Decommissioned 1997 (BRAC).',
          '- Concrete ski-jump launch ramp still visible from Highway 39.',
          '- Environmental cleanup: 17,000 cubic yards contaminated soil, $6.5 million.',
          '- October 2024: designated National Historic Engineering Landmark (90th anniversary).',
          '- Same San Gabriel Canyon area as Aerojet Azusa — just a few miles apart.',
          '- Same Caltech/JPL scientists, same classified defense work, same mountain.',
          '',
          '## Command center near Cal Poly Pomona',
          '- Robert brought the user to work at newly constructed earthquake-retrofitted command center.',
          '- Located outside Cal Poly Pomona.',
          '- Cal Poly Pomona has an Emergency Operations Center (EOC).',
          '- LA Emergency Operations Command Center: most earthquake-proof building in LA.',
          '  - Designed with seismic moat covers for 27 inches of movement.',
          '',
          '## Adams Pack Station — mail and supplies',
          '- Adams Pack Station at Chantry Flat is where mail and supplies come from.',
          '- Last remaining pack station in Southern California (since 1936).',
          '- Donkeys and mules carry supplies to remote cabins.',
          '',
          '## Big Dalton Canyon — the neighborhood at 2860',
          '- Big Dalton Canyon: named after Henry Dalton (b. London 1803, settled 1843).',
          '- The canyon is in Glendora, in the San Gabriel Mountains foothills.',
          '',
          '## Neighbors closest to 2860',
          '- Candice Driscoll: closest neighbor. User believes NSA connection — "Op G 20"',
          '  connection to deciphering. Possibly signals intelligence or code-breaking.',
          '- 1803: Ida Meacham next door.',
          '  - Dan Bjorklund: dad\'s best man. Daughter Lauren Bjorklund.',
          '  - Boots Gordon: Rowley\'s wife.',
          '  - Nancy Burns: the Burns residence next to Ida.',
          '',
          '## Gordon Rowley — confirmed Big Dalton Canyon connection',
          '- Gordon Rowley moved to Glendora in 1956 with his family.',
          '- Founding member of Glendora Riding and Hiking Trails Advisory Committee.',
          '- Big Dalton Canyon Campground renamed "Rowley Wilderness Amphitheater" May 24, 2020.',
          '  - Approved by City Council unanimously after Gordon\'s passing in 2020.',
          '  - Also memorializes wife Norma Rowley (passed February 2022).',
          '- "Boots" may be a nickname for Norma, or another family member.',
          '',
          '## Scott Stapenhill — fire captain & space shuttle connection',
          '- Scott Stapenhill: fire captain in the Glendora area.',
          '- User says he "turned off the space shuttle on reentry landing."',
          '- "I think they made the heat tiles" — connection to shuttle tile manufacturing.',
          '- Space shuttle heat tiles: made by Lockheed Missiles & Space Co., Sunnyvale, CA.',
          '  - LI-900 tiles: 99.9% pure silica glass fibers, 94% air by volume.',
          '  - Developed by chemist Robert Beasley at Lockheed in the 1960s.',
          '  - About 20,000 HRSI tiles per shuttle. Cost up to $2,000 each.',
          '  - Can be heated to 2,200°F and plunged into cold water without damage.',
          '- Shuttles built in Southern California (Palmdale — Rockwell/Boeing).',
          '- Many shuttle landings at Edwards Air Force Base (high desert, near Glendora).',
          '- Fire captains would be part of emergency response at shuttle landing sites.',
          '',
          '## Camouflaged Burbank, hidden Azusa, secret Oildale',
          '- Boots is Norma Rowley — confirmed.',
          '',
          '## Lockheed Burbank — Operation Camouflage (WWII)',
          '- Entire Lockheed Burbank plant disguised as a fake suburban neighborhood.',
          '- Burlap houses, wire-and-feather trees, rubber automobiles, painted streets.',
          '- Hollywood helped: MGM, Disney, 20th Century Fox, Paramount, Universal.',
          '- Colonel John F. Ohmer led the operation.',
          '- Warner Brothers disguised a nearby studio to look like an aircraft plant (decoy).',
          '- 94,000 workers. P-38 Lightning, B-17 bombers assembled underneath.',
          '- "Ohmer took a general on a reconnaissance flight at 5,000 feet.',
          '  The general said he could only see suburb after suburb."',
          '',
          '## The facility in Azusa — making the space shuttle',
          '- User says: "like camouflaged Burbank during the war, the facility was making',
          '  the space shuttle in Azusa."',
          '- Aerojet (now Northrop Grumman) in Azusa — same San Gabriel Canyon corridor.',
          '- Shuttle orbiters built in Palmdale (Rockwell/Boeing), components from Azusa.',
          '- The names have been changed — privacy in the telling.',
          '',
          '## U-2 spy plane — built in Oildale (Bakersfield)',
          '- First 50 U-2s assembled at secret Lockheed facility on Norris Road, Oildale.',
          '- Called "Unit 80." Disguised as a tire factory next to Bakersfield airport.',
          '- Built 1956-1957. Partially disassembled, flown to Groom Lake (Area 51) at night.',
          '- GPO/NASA book: "Unlimited Horizons" by Peter Merlin — U-2 history.',
          '  - https://www.nasa.gov/wp-content/uploads/2015/07/unlimited-horizons.pdf',
          '',
          '## Beale Air Force Base — the high flyer',
          '- Beale AFB: home of the U-2 Dragon Lady since 1976.',
          '- Named after Edward Fitzgerald Beale (19th-century pioneer/frontiersman).',
          '- 9th Reconnaissance Wing. All 27 U-2s operated from Beale.',
          '- Also hosted the SR-71 Blackbird (retired 1990s).',
          '- "High flyer named after their football team" — Beale local connection.',
          '- U-2 can fly above 70,000 feet. Still in service 70+ years after first flight.',
          '',
          '## Road Runners Internationale & Peter Merlin',
          '- User attended 2017 Road Runners Internationale reunion with Peter Merlin.',
          '  - Photo: https://www.roadrunnersinternationale.com/photos/reunion_2017/index.html',
          '  - 25th reunion, October 10, 2017. Photos by Dave Budd.',
          '- Road Runners Internationale: organization of people who worked on secret',
          '  aircraft programs (U-2, SR-71, OXCART/A-12) at Area 51, Groom Lake.',
          '- User at reunion: wearing blue, sitting on the corner, having dinner with',
          '  the captain at Fort Knox.',
          '',
          '## Frank Murray — CIA A-12 OXCART pilot',
          '- Frank Murray, call sign "DUTCH 20," CIA pilot who flew the A-12 OXCART at Area 51.',
          '- Awarded the CIA Intelligence Star for Valor on May 17, 1968 at Area 51.',
          '- Born September 21, 1930. Passed away March 26, 2023.',
          '- Final assignment: A-12 safety chase pilot, 1129th Special Activities Squadron, Area 51.',
          '- Flew combat missions in Vietnam.',
          '- His wife Stella was a regular supporter of Road Runners, never missing a reunion.',
          '- Murray received an award at the 2017 reunion — user was present at the dinner.',
          '- "These are retired mostly" — attendees were mostly retired CIA, military, defense personnel.',
          '- Books authored by Frank Murray published on roadrunnersinternationale.com.',
          '',
          '## JPL & the Sojourner Rover',
          '- One of the user\'s better memories: rushing to JPL for the naming of the Sojourner rover.',
          '- Mr. Surampudi was inviting them for the naming ceremony.',
          '- Sojourner: first rover on Mars, part of Mars Pathfinder (landed July 4, 1997).',
          '- Named through worldwide contest won by Valerie Ambroise, 12, Bridgeport, CT.',
          '- Named after Sojourner Truth, 19th-century abolitionist and women\'s rights activist.',
          '- Contest initiated March 1994 by The Planetary Society, Pasadena, with NASA/JPL.',
          '- JPL gave out Hot Wheels cars to guests: JPL Sojourner Mars Rover Action Pack.',
          '  - Product #16145 (1996-1997). Designed in collaboration with NASA/JPL.',
          '  - Included Sojourner rover, Mars Lander, and Mars Pathfinder vehicles.',
          '',
          '## Boeing Ventura & engineering summer program',
          '- User toured Boeing factory in Ventura near Golf N\'Stuff miniature golf course.',
          '- Engineering summer program, the summer prior to attending college.',
          '- Also got into UCSD but not UCLA or UCSC. Then UCSB.',
          '',
          '## MUFON, Area 51 & the desert road',
          '- MUFON Symposium in Los Angeles — Mutual UFO Network. User met "the other family."',
          '- On the way to Reno: Alien Research Center in Hiko, Nevada (gift shop on ET Highway).',
          '- Little A\'Le\'Inn in Rachel, Nevada (pop. ~54). Closest motel to Area 51. Connie West.',
          '- "The sheriff will stop you before the lonely road."',
          '- Nevada\'s legal brothels dot the highways near Area 51.',
          '- Creech Air Force Base, Indian Springs, NV — main operational drone airport since 2000.',
          '  Was escorting with a drone.',
          '',
          '## Wrightwood & General Atomics at El Mirage',
          '- User used to live in Wrightwood, San Bernardino Mountains.',
          '- General Atomics: maker of MQ-1 Predator and MQ-9 Reaper drones.',
          '- Operates from El Mirage Field and Gray Butte Field, west of Adelanto, CA.',
          '- El Mirage: dry lake bed in Mojave Desert, drone testing since 1980s (with CIA).',
          '- Gray Butte: radar cross-section test facility built by McDonnell Douglas 1970s,',
          '  then Boeing, then General Atomics bought it in 2000 for UAV R&D.',
          '- "General Atomics is over there guarding El Mirage."',
          '',
          '## Gathering of the Eagles, Edwards AFB',
          '- Fundraiser for the Air Force Flight Test Museum at Edwards AFB.',
          '- Held at the Edwards fairgrounds. They auction everything.',
          '- Angela was the hostess.',
          '',
          '## Base commander funeral — Bakersfield National Cemetery',
          '- User went to a base commander\'s funeral in the foothills above Tehachapi.',
          '- Bakersfield National Cemetery: Highway 58 between Tehachapi and Bakersfield.',
          '- 500 acres donated by Tejon Ranch. Oak-dotted foothills.',
          '- Nation\'s 130th national cemetery. Serves ~200,000 veterans in the region.',
          '- "The garden society veterans cemetery before Bakersfield."',
          '',
          '## 412th Test Wing, SETP & the National Test Pilot School',
          '- 412th Test Wing at Edwards AFB paired with SETP to arrange the test pilots school.',
          '- Society of Experimental Test Pilots (SETP): founded September 14, 1955.',
          '  Six civilian test pilots met at Aleck\'s in Lancaster, CA.',
          '  Among founders: Scott Crossfield (NACA/X-15).',
          '- National Test Pilot School in Mojave: world\'s premier civilian test pilot school.',
          '  Operating 30+ years in the high desert.',
          '',
          '## MUFON Symposium — JW Marriott, Las Vegas',
          '- MUFON International Symposium at JW Marriott Resort and Spa, Las Vegas.',
          '  221 N Rampart Blvd.',
          '- 48th annual symposium (2017): "The Case for the Secret Space Program."',
          '- Speakers: Richard Dolan, physicist John Brandenburg, Cheryll Jones (MC).',
          '- George Knapp (KLAS-TV) regular speaker.',
          '- Offers Area 51 tours, experiencer workshops, field investigator training.',
          '',
          '## National Atomic Testing Museum, Las Vegas',
          '- "They don\'t like to have their names on it." The Road Runners prefer anonymity.',
          '- That\'s how the user ended up at the National Atomic Testing Museum.',
          '- 755 E. Flamingo Road, Las Vegas. Smithsonian affiliate.',
          '- One of only 37 museums created by Congress and enacted by public law.',
          '- Preserves stories of Nevada Test Site, atomic veterans, Downwinders.',
          '- Includes exhibit: "Area 51 — Myth or Reality."',
          '',
          '## Geocaching on the Extraterrestrial Highway',
          '- User was geocaching along the way to Area 51 and the desert installations.',
          '- E.T. Highway (Route 375): one of the world\'s largest geocache "power trails."',
          '  Over 2,000 geocaches hidden along the highway.',
          '- The Alien Head: 51 geocaches in the shape of an alien head in the desert.',
          '- Connie West (Little A\'Le\'Inn): geocachers saved her business.',
          '  "They came from Australia, Austria, England."',
          '- NDOT removed the caches at one point — every booking cancelled.',
          '- Alien Cathouse: only alien-themed brothel in the world, near ET Highway junction.',
          '- Stories along the way: like Ingress (Niantic\'s AR game, factions/portals) and',
          '  Munzee (QR-code scavenger hunts in the real world).',
          '',
          '## B-2 Stealth Bomber first flight',
          '- User was there for the first flight of the B-2 Stealth Bomber.',
          '- July 17, 1989, from Air Force Plant 42, Palmdale, to Edwards AFB.',
          '- Northrop test pilot Bruce Hinds and Col. Richard S. Couch.',
          '- 1 hour, 52 minutes. Top-secret stealth bomber.',
          '- First publicly displayed November 22, 1988, rolled out at Plant 42.',
          '',
          '## Stratolaunch "Roc" first flight',
          '- User was there for the first flight of Stratolaunch "Roc."',
          '- April 13, 2019, from Mojave Air & Space Port.',
          '- World\'s largest aircraft by wingspan: 385 feet (117 meters).',
          '- Built by Scaled Composites, founded by Paul Allen (died Oct 2018).',
          '- Six Pratt & Whitney PW4056 turbofans (from Boeing 747-400).',
          '- Twin fuselage, 500,000 pounds, designed to air-launch rockets/hypersonics.',
          '- "What an age difference" — 30 years between B-2 (1989) and Stratolaunch (2019).',
          '',
          '## Fox Field job fair & Forest Service Stalker',
          '- Job fair at William J. Fox Airfield, Lancaster. F-35s on the field.',
          '- LA County Airshow held at Fox Field.',
          '- Forest Service had a "skunk" — Lockheed Stalker UAV for wildfire reconnaissance.',
          '  12-foot wingspan, 8-hour flight time, launched by bungee or rail.',
          '  Developed by Skunk Works for military, adapted for firefighting.',
          '',
          '## Saxon Aerospace Museum, Boron',
          '- 26922 Twenty Mule Team Road, Boron, California.',
          '- Named for Col. Vernon Parker Saxon Jr., vice commander at Edwards Flight Test Center.',
          '- Milestones: first sound barrier break, first hypersonic flight, first shuttle landing.',
          '- Collection: F-4 fighter jet, XLR-8 rocket engine, flight suits and helmets.',
          '',
          '## Apollo Park & geocaching',
          '- Apollo Park: 4555 W. Ave G, Lancaster. Named for Apollo 11 astronauts.',
          '  54 acres, three lakes. Just down the street from Fox Airfield.',
          '- Museum next to Apollo Park — user went geocaching there.',
          '',
          '## Musical highway — Lancaster',
          '- Avenue G between 30th and 40th Streets West, Lancaster, CA.',
          '- Rumble strips play the William Tell Overture at 55 mph.',
          '- Built for a Honda commercial in 2008. Built wrong twice.',
          '  Grooves miscalculated, then rebuilt using the same wrong blueprint.',
          '- "The musical highway is a blast."',
          '',
          '## Personal artifacts — coffee mugs',
          '- Thermochromatic coffee mug: Dunn-Edwards made thermochromatic, like DuPont made Kevlar.',
          '  Thermochromatic patents historically owned by Aerojet General Corp (where Bernard worked).',
          '  Starts black, hot coffee turns it clear, blue underneath shows through. Heat causes the change.',
          '  "Out of the black and into the blue."',
          '- NASA mug — received for writing an article.',
          '',
          '## Eugene Moses — San Gabriel Valley Examiner',
          '- Eugene Moses: boss at the San Gabriel Valley Examiner (newspaper delivery).',
          '- Colonel who took shrapnel, has a pacemaker. Goes to the VA hospital.',
          '- Former mayor of Azusa, California. Elected to City Council 1978, mayor 1982.',
          '  Reelected multiple times — at least 4 terms, always with 56%+ of the vote.',
          '- Pennsylvania native, graduated from John Muir High School, Pasadena.',
          '- Korean War veteran (Navy). After service: die caster, restaurant in Alhambra,',
          '  coin-operated amusement machines for 20+ years.',
          '- Built Canyon City Ghost Town on San Gabriel Canyon Road — intended as a family',
          '  recreation park like Knott\'s Berry Farm. Put development aside when elected to',
          '  avoid conflict of interest. Used for charity events.',
          '- Also sold fish bait and gold-panning equipment at the entrance to San Gabriel Canyon.',
          '- Had the Hearst at the newspaper.',
          '- San Gabriel Valley Examiner: weekly newspaper serving the foothill communities.',
          '  Next to the Naked Juice factory in Glendora.',
          '- Naked Juice: founded in Glendora (1976). 533 West Foothill Blvd, Glendora, CA 91741.',
          '  Originally "Naked Juice Co of Glendora Inc."',
          '',
          '## Wildfire activity & WiFire / Alexandria Digital Library',
          '- Wildfire activity in the San Gabriel Mountains area is unusual.',
          '- National Interagency Fire Center (NIFC) in Boise, Idaho — used for briefings,',
          '  overlays of burns, situation reports. Data feeds from NIFC WFIGS.',
          '- "Like Harry Truman I was there when it was burning" — Harry Truman was at Mount St. Helens',
          '  when it erupted (May 18, 1980). He refused to evacuate. Died in the eruption.',
          '- WiFire: at the San Diego Supercomputer Center (SDSC), UC San Diego.',
          '  Led by Ilkay Altintas. NSF-funded ($2.65M, 2013; $5M for BurnPro3D).',
          '  Integrates satellite data, remote sensors, computational models for wildfire prediction.',
          '  Partners: CAL FIRE, U.S. Forest Service, SDG&E, San Diego County EOC.',
          '- David Valentine: worked on WiFire at SDSC after working at UCSB.',
          '- At UCSB: worked for Greg Janée at the Davidson Library Map and Image Laboratory.',
          '  On the Alexandria Digital Library (ADL) project — the USGS Gazetteer interface.',
          '  ADL: georeferenced digital library at UCSB. Catalog, Gazetteer, GeoRef.',
          '  ADL Gazetteer: combines USGS GNIS and NIMA GNS databases.',
          '  Co-authored papers: Valentine, Janée, Frew — "Accessing ADL from GIS" (2004).',
          '- James Frew: UCSB researcher on ADL, Donald Bren School of Environmental Science.',
          '- The user worked at UCSB Davidson Library on the Alexandria Digital Library project.',
          '  The Gazetteer interface was part of that work.',
          '',
          '## David Seubert, wax cylinders, Z39.50, MELVYL, California Digital Library',
          '- David Seubert: curator of special collections / Performing Arts Curator at UCSB Library.',
          '  Went to Oberlin. The user worked for him.',
          '- UCSB Cylinder Audio Archive: one of the world\'s largest collections of wax cylinder recordings.',
          '  Over 16,000 recordings, close to 11,000 online. First library with big collection online for free download.',
          '  Started 2002 as pilot project (60 cylinders). Full archive launched autumn 2005 (5,000 recordings).',
          '  Uses the Archeophone (designed 1998 by Henri Chamoux) to digitize wax cylinders.',
          '- User connected the Apple Darwin wax cylinder recordings to Z39.50 PHP to send queries',
          '  to and from the Pegasus system that syncs with the Library of Congress MELVYL system.',
          '  Z39.50: standard protocol for bibliographic information retrieval.',
          '  MELVYL: UC system\'s union catalog. California Digital Library emerged from enhancing MELVYL.',
          '- California Digital Library (CDL): founded 1997 by UC Board of Regents and President Richard Atkinson.',
          '  "Library without walls." Emerged from discussions begun in 1991 on enhancing MELVYL.',
          '  Clifford Lynch: head of Division of Library Automation for UC system.',
          '  CDL vision: building/sharing/preserving digital collections, creating tools/services,',
          '  influencing scholarly communication, fostering strategic partnerships.',
          '',
          '## First boss — ESGVROP & Camp Williams',
          '- First boss: Ryan Quisenberry at ESGVROP.',
          '- East San Gabriel Valley Regional Occupational Program & Technical Center.',
          '  Founded 1970. 1501 W Del Norte St, West Covina, CA 91790.',
          '  Joint Powers Agency: 7 unified school districts (Azusa, Baldwin Park, Charter Oak,',
          '  Covina, Glendora, Walnut, West Covina).',
          '- Campus was south of Irwindale, before the freeway, in the West Covina area.',
          '- Went to Camp Williams — up Azusa Canyon (San Gabriel Canyon, Highway 39).',
          '  On the East Fork of the San Gabriel River. 7 miles north of San Dimas.',
          '  Campground and mobile home park, surrounded by Angeles National Forest.',
          '  History: Native Americans, Gold Rush prospectors, ghost town of Eldoradoville.',
          '  People still pull gold out of the river.',
          '',
          '## Family — Dunn-Edwards connection',
          '- User\'s aunt married Donald Dunn — possibly Ralph Dunn\'s son.',
          '- Dunn-Edwards Paints: founded 1925 in Los Angeles by Frank "Buddy" Dunn and Arthur C. Edwards.',
          '  Largest family-owned paint manufacturer in the US. 100 years old in 2025.',
          '- Thermochromatic patents: historically owned by Aerojet General Corporation.',
          '  Connection: grandfather Bernard worked at Aerojet in Azusa with security clearance.',
          '',
          '## Summer school at Cal Poly Pomona',
          '- Lego Logo for the Apple IIe: programming robotic equipment from the COM port.',
          '  Logo: educational programming language created at MIT, 1967 (Wally Feurzeig, Seymour Papert).',
          '  Lego TC Logo: developed by Mitchel Resnick and Steve Ocko at MIT Media Lab (1984-1988).',
          '  Hardware: Lego #9750 "Interface A" — card in Apple IIe controlling motors, lights, sensors.',
          '  Manual: "Teaching the Turtle." Sold only to schools. Now on Internet Archive.',
          '  User learned to command physical robots (Lego with motors/sensors) through Logo code.',
          '- Arthurian legend class. Standard reading across universities:',
          '  Sir Gawain and the Green Knight (Marie Borroff, Norton)',
          '  Le Morte d\'Arthur by Sir Thomas Malory (Oxford World Classics)',
          '  T.H. White, The Once and Future King',
          '  Chretien de Troyes: Erec and Enide, Lancelot: The Knight of the Cart, Story of the Grail',
          '  Tennyson, Idylls of the King',
          '  Mark Twain, A Connecticut Yankee in King Arthur\'s Court',
          '  Cal Poly Pomona English catalogs 1968-1995: digital files in University Archives.',
          '  Class schedules 1955-2008 also available.',
          '  Sources: Geoffrey of Monmouth, Welsh Mabinogion, Marie de France Lais, Alliterative Morte Arthur.',
          '- French class using Hometown, U.S.A. (1988, Publishing International, Manley & Associates).',
          '  Educational software: create real 3D models of homes, offices, schools, missions.',
          '  Available on DOS, Apple IIgs, Macintosh, FM Towns.',
          '  Won 1989 Software Publishers Association Award for Best Educational Creativity Product.',
          '  Now abandonware, preserved on the Internet Archive.',
          '',
          '## Grandpa Greeran — 555 IC & VCR timer recorder',
          '- Grandpa Greeran worked with the 555 IC — the 555 timer integrated circuit.',
          '- 555 timer IC: designed by Hans Camenzind in 1971 for Signetics Corporation.',
          '  One of the most widely used ICs in history — over a billion sold per year.',
          '  25 transistors, 2 diodes, 15 resistors in an 8-pin DIP package.',
          '  Originally called "The IC Time Machine."',
          '- Grandpa Greeran made the VCR timer recorder — using the 555 timer chip for timing.',
          '  An electronics engineer in the family, building consumer devices that defined an era.',
          '',
          '## Jack W. Weeks — CIA A-12 OXCART pilot (DUTCH 29)',
          '- Jack W. Weeks, call sign "DUTCH 29," CIA pilot who flew the A-12 OXCART at Area 51.',
          '- Born February 23, 1933. Killed June 5, 1968.',
          '- A-12 (60-6932/Article 129) lost over the Pacific near Philippines during FCF from Kadena.',
          '- Right engine overtemping, low fuel flow, catastrophic failure, aircraft break-up.',
          '- Honored in the "Book of Honor" at CIA Headquarters, Langley, Virginia.',
          '- Obtained first photographs of USS Pueblo after capture by North Korea in 1968.',
          '- Called from Okinawa June 1, 1968 to wish son Steve and daughter Susan happy birthday.',
          '- Three days later, disappeared without a trace. Letters continued to arrive after death.',
          '- Wife Sharlene accepted posthumous CIA Intelligence Star for Courageous Action.',
          '- Weeks was the last CIA pilot killed in the OXCART Program.',
          '- Home was Canoga Park, California (1963–1968). Ostensibly a civilian Lockheed consultant.',
          '- Suggested naming the A-12 "Cygnus" (following Lockheed celestial naming practice).',
          '',
          '## User knew Jack Weeks — personal connection',
          '- Jack Weeks was the user\'s mail man.',
          '- User served time in "Charlie" at the John A. Bell Detainment Facility.',
          '- Also in Garden Grove.',
          '- "The names have been changed."',
          '',
          '## Peter Merlin — aviation historian & author',
          '- Peter W. Merlin: aviation historian, archivist, aviation archeologist.',
          '- 25+ years locating crash sites of historic aircraft from Area 51 & Edwards AFB.',
          '- Co-founded the Aviation Archeology Field Research Team with Tony Moore.',
          '- Hired as archivist at NASA Dryden Flight Research Center, Edwards AFB.',
          '- Books:',
          '  - "X-Plane Crashes: Exploring Experimental, Rocket Plane and Spycraft',
          '    Incidents, Accidents and Crash Sites" (Specialty Press, 2008)',
          '  - "Breaking the Mishap Chain" (NASA, 2012)',
          '  - "Crash Course: Lessons Learned from Accidents Involving Remotely',
          '    Piloted and Autonomous Aircraft" (NASA, 2013)',
          '- Wrote the NASA/GPO history: "Unlimited Horizons" — U-2 program.',
          '',
          '## Center for Land Use Interpretation (CLUI), Culver City',
          '- CLUI: 9331 Venice Blvd, Culver City, CA.',
          '- Peter Merlin\'s books on sale at CLUI.',
          '- CLUI organized "Down to Earth: Experimental Aircraft Crash Sites of the Mojave"',
          '  - Exhibition, public presentation, and field trip (Jan-Feb 2013).',
          '  - Based on Merlin\'s 25+ years of work with the Aviation Archeology Field Research Team.',
          '  - Bus trip left from CLUI\'s office in Culver City, loop through Antelope Valley.',
          '  - Merlin and Tony Moore on board, explaining crash sites.',
          '  - Supported by Andy Warhol Foundation for the Visual Arts.',
          '- CLUI Desert Research Station in Hinkley, California.',
          '',
          '## State-level writing award',
          '- Honorable mention at board room ceremony.',
          '- Story about Battalion Chief Robert Hewitt, LACoFD, El Monte.',
          '- [ ] What grade was this? What year approximately?',
          '- [ ] What was the prompt or contest name?',
          '- [ ] Do you still have a copy of the story?'
        ].join('\n'),
        '/chapters/05-hewitt-family.md': [
          '# The Hewitt family — prompts to expand',
          '',
          '## Key figures',
          '- Battalion Chief Robert Hewitt, LACoFD, El Monte station.',
          '- Chuck Hewitt — Robert\'s oldest son. Agent Orange connection.',
          '  - Kidneys failed; received Robert\'s kidney (transplant, not dialysis).',
          '- Maurice Frederick Hewitt — other son of Robert.',
          '  - Ham radio callsign: KG6ZD.',
          '',
          '## Grandpa & the fire service',
          '- Stayed at Grandpa\'s house. Listened to radio, watched Emergency! on TV.',
          '- The show\'s dispatch echoed real LACOFD dispatch.',
          '- Grandpa gave his dress uniform, badge, and clothes',
          '  when the uniform service brought replacements.',
          '',
          '## Emergency! research notes',
          '- Premiered NBC Jan 15, 1972. 124 episodes through 1977.',
          '- Station 51 = real Station 127, 2049 E 223rd St, Carson CA.',
          '- KMG365 = real FCC call sign, Fire Station 98, Bellflower.',
          '- Sam Lanier = real LACoFD dispatcher, voiced dispatch on the show.',
          '- Jim Page = Battalion Chief, basis for John Gage character.',
          '- Squad 51 (1972 Dodge D-300) restored at LA County Fire Museum, Bellflower.',
          '- Engine 51 (1973 Ward LaFrance) restored by museum, finished 2012.',
          '- 1970 Chevy ambulance restoration started Sept 2020.',
          '- Museum: 16400 Bellflower Blvd, Bellflower CA. Open Wed-Sat 9AM-2PM.',
          '- 50th anniversary celebration Aug 19-21, 2022.',
          '',
          '## CHiPs connection (Culver City)',
          '- CHiPs filmed at MGM Studios, Culver City (now Sony Pictures Studios).',
          '- Interior scenes on Stage 10 at MGM.',
          '- CHP Central at 777 W Washington Blvd, Los Angeles.',
          '- Squad 51 appeared in CHiPs S3E17 "E.M.T."',
          '',
          '## Chippendales — the other Culver City/West LA landmark',
          '- Chippendales, the famous male strip club, started in West Los Angeles.',
          '- Somen "Steve" Banerjee bought a failing bar called Destiny II in 1975.',
          '- In 1979 he renamed it Chippendales and launched all-male stripping for women.',
          '- Named after Thomas Chippendale, the 18th-century English furniture maker.',
          '- Disney\'s "Chip \'n\' Dale" chipmunks are also named after Chippendale.',
          '- Original club closed 1988 after losing liquor license and fire permit.',
          '- Banerjee pleaded guilty to arson, racketeering, murder-for-hire; died in custody 1994.',
          '- Chippendales continues today with Las Vegas residency and world tours.',
          '',
                    '## LACoFD El Monte area research',
          '- Battalion 10 covers El Monte, headquartered at Station 4.',
          '- Battalion 10 serves: El Monte, Rosemead, San Gabriel, South El Monte, Temple City.',
          '- Division 9 includes El Monte area plus Bell, Bell Gardens, Commerce.',
          '- El Monte had its own fire department from 1912 to 1998.',
          '- In 1998, El Monte FD contracted to LACoFD; four stations became LACoFD 166-169.',
          '  - Station 166: 3615 N Santa Anita Ave (was El Monte Station 1, built 1955)',
          '  - Station 167: 11567 Bryant Road (was El Monte Station 2, built 1957)',
          '  - Station 168: 3207 N Cogswell Road (was El Monte Station 3, built 1950)',
          '  - Station 169: 5112 N Peck Road (was El Monte Station 4, built 1950)',
          '- Fire Station 90: 10115 E Rush St, South El Monte.',
          '- BC Robert Hewitt was at the LACoFD El Monte station (pre-1998 contract).',
          '- Other BCs who served El Monte: Thomas C. Ewald, Anderson D. Mackey Jr., Nicholas A. Duvally.',
          '- Jesse J. Vela started at City of El Monte FD in 1988, joined LACoFD 1994.',
          '',
          '## Robert Hewitt — Hotshot before Temple City',
          '- Before captain in Temple City, Robert was a hotshot for the fire crew.',
          '- "Probably where they all met" — family connections through firefighting.',
          '- Angeles National Forest hotshot crews:',
          '  - Dalton Hotshots: organized Sept 1953 in Glendora.',
          '    - Station: 1090 Glendora Mountain Road, Glendora.',
          '    - Original crew: foreman Charles (Chuck) Hartley + 22 Native American firefighters.',
          '    - 11 Jemez and 11 Zia men from Northern New Mexico.',
          '    - Bighorn Ram mascot — inspired by wild sheep in the San Gabriels.',
          '    - Chuck Hartley joined Forest Service 1956, became superintendent in 1960s.',
          '    - Introduced daily PT before it was required. Taught carpentry and construction.',
          '  - Little Tujunga Hotshots: established 1970, Sylmar.',
          '  - Bear Divide Hotshots: Canyon Country.',
          '  - Valyermo Hotshots: Valyermo.',
          '  - Texas Canyon Hotshots: Santa Clarita.',
          '  - Historic: Chilao Hotshots, Oak Grove Hotshots.',
          '- El Cariso Hotshots: 12 crewmen died in Loop Fire, Nov 1, 1966, Pacoima Canyon.',
          '- Canyon Inn Fire 1968: 18,000 acres, foreman + 7 teen crewmen died.',
          '',
          '## Maurice — workbench in Duarte & fire dispatch terminals',
          '- Not a shop — Maurice\'s workbench at his house in Duarte.',
          '- User used to hang out there and learn soldering.',
          '- Maurice made terminals that are in fire engines for texting dispatch.',
          '  - Custom-built Mobile Data Terminals (MDTs) for fire dispatch communication.',
          '  - In the early days, many MDTs were custom devices, even specialized point-to-point radios.',
          '  - These connected responding crews to Computer-Aided Dispatch (CAD) systems.',
          '- Marvacs in Pasadena was a real electronics parts store (confirmed in Yelp reviews).',
          '  - "Years ago there were Fry\'s, Marvacs in Pasadena, Orvac\'s in Orange.',
          '    They are all gone."',
          '- Maurice\'s skills: vacuum tube and TV repair, soldering, radio batteries to VCR repair.',
          '- Good example of dispatch archives: WildCAD for Angeles National Forest.',
          '  - WildCAD: computer-aided dispatch system used by wildland fire agencies nationwide.',
          '  - Streamlines ordering firefighters and equipment to new fires.',
          '  - Federal system — archives might go back to early digital dispatch records.',
          '  - Angeles National Forest is federal (USFS), so WildCAD data would be federal.',
          '',
          '## Temple City & Chantry Flat research',
          '- Fire Station 47 is in Temple City (Battalion 10, Division 9).',
          '- Temple City is near University of the West in Rosemead.',
          '- BC Robert Hewitt was captain in Temple City for a long time.',
          '- Division 9: El Monte, Rosemead, South El Monte, Temple City, Bell, Bell Gardens, Commerce.',
          '',
          '## Chantry Flat — Big Santa Anita Canyon',
          '- Originally "Poison Oak Flat," renamed after prospector Charley Chantry (arrived 1905).',
          '- Adams Pack Station: last remaining pack station in Southern California (since 1936).',
          '- Over 220+ cabins built during the Great Hiking Era (1890s-1920s).',
          '- Materials hauled in by mules and people\'s backs on narrow mountain trails.',
          '- Pack trains traveled seven days a week during the busy construction years.',
          '- Chantry Road to the trailhead wasn\'t built until 1935.',
          '- Before that: hiked from Sierra Madre (adding 4 miles each way).',
          '- 1938 flood destroyed many cabins. 1953 Monrovia Peak Fire destroyed more.',
          '- 1969 flood took out more. 2020 Bobcat Fire destroyed 18 of 80 remaining cabins.',
          '- About 80 cabins remain today, privately owned on USFS land leases.',
          '- No electricity or utilities — everything brought in by mule.',
          '- Last magneto-type crank phone system in the United States.',
          '- Sturtevant Camp: founded 1893, one of the oldest resorts in the San Gabriels.',
          '- Great-grandfather brought the family up to Angeles Crest campground.',
          '- Built huts on top of the ridge, materials packed up by mule from Chantry Flats.',
          '- They lived in cabins at Chantry Flats.',
          '',
          '## Prompts still to fill in',
          '- [ ] Grandpa\'s full name and rank?',
          '- [ ] Which LACofd station did Grandpa serve at?',
          '- [ ] How did Chuck Hewitt get exposed to Agent Orange? Vietnam service?',
          '- [ ] When did the kidney transplant happen?',
          '- [ ] Is Maurice Frederick still active on KG6ZD?',
          '- [ ] How is the Hewitt family related to you? (Grandpa\'s side? Mother\'s side?)',
          '- [ ] Did the Emergency! connection influence career or interest in fire service?',
          '- [ ] What happened to the dress uniform and badge? Still have them?',
          '- [ ] Do you have QSL cards or any KG6ZD memorabilia?',
          '- [ ] Have you visited the LA County Fire Museum in Bellflower?',
          '- [ ] Did Grandpa know Jim Page or Sam Lanier personally?'
        ].join('\n'),
        '/notes/source-ledger.txt': [
          'Sources presently in use:',
          '1-8 = official/public reporting on USVI registration case',
          '9 = self-published Standard Resume page',
          '',
          'If new documentation arrives, log it here before revising the public book.'
        ].join('\n'),
        '/notes/private-prompts.txt': [
          'Private prompts area.',
          '',
          'Use this file for memories, locations, social connections, apartment notes, class schedule fragments, or travel recollections that are not yet verified.',
          'Do not promote them into the published book until sourced or intentionally labeled personal recollection.'
        ].join('\n'),
        '/settings/style.json': JSON.stringify({
          note: 'Use the Store style button to overwrite this file with the current theme.'
        }, null, 2)
      }
    };
  }

  function loadVault() {
    try {
      const parsed = JSON.parse(localStorage.getItem(VAULT_KEY) || '{}');
      if (parsed && parsed.files && typeof parsed.files === 'object') {
        return parsed;
      }
    } catch (err) {}
    const fresh = defaultVault();
    localStorage.setItem(VAULT_KEY, JSON.stringify(fresh));
    return fresh;
  }

  function saveVault() {
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  }

  function setVaultStatus(message) {
    vaultStatus.textContent = message;
  }

  function renderFiles() {
    const paths = Object.keys(vault.files).sort();
    fileList.innerHTML = '';
    paths.forEach((path) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = path;
      button.className = path === currentFile ? 'active' : '';
      button.addEventListener('click', function () {
        openFile(path);
      });
      li.appendChild(button);
      fileList.appendChild(li);
    });
  }

  function openFile(path) {
    currentFile = path;
    filePathInput.value = path;
    fileEditor.value = vault.files[path] || '';
    renderFiles();
  }

  function commitCurrentFile() {
    const nextPath = (filePathInput.value || '').trim();
    if (!nextPath.startsWith('/')) {
      setVaultStatus('Paths must begin with /.');
      return false;
    }

    if (nextPath !== currentFile) {
      delete vault.files[currentFile];
      currentFile = nextPath;
    }

    vault.files[currentFile] = fileEditor.value;
    saveVault();
    renderFiles();
    setVaultStatus('Saved ' + currentFile);
    return true;
  }

  newFileBtn.addEventListener('click', function () {
    const raw = window.prompt('New file path', '/notes/new-note.txt');
    if (!raw) return;
    const path = raw.trim();
    if (!path.startsWith('/')) {
      setVaultStatus('New files must begin with /.');
      return;
    }
    if (!vault.files[path]) {
      vault.files[path] = '';
      saveVault();
    }
    openFile(path);
    setVaultStatus('Opened ' + path);
  });

  saveFileBtn.addEventListener('click', commitCurrentFile);

  deleteFileBtn.addEventListener('click', function () {
    if (!currentFile) return;
    const paths = Object.keys(vault.files);
    if (paths.length === 1) {
      setVaultStatus('Vault must keep at least one file.');
      return;
    }
    if (!window.confirm('Delete ' + currentFile + '?')) return;
    delete vault.files[currentFile];
    currentFile = Object.keys(vault.files).sort()[0];
    saveVault();
    openFile(currentFile);
    setVaultStatus('File deleted.');
  });

  snapshotBtn.addEventListener('click', function () {
    const activeSection = Array.from(document.querySelectorAll('.page'))
      .reverse()
      .find((section) => window.scrollY + 180 >= section.offsetTop) || document.querySelector('.page');

    const title = activeSection ? activeSection.querySelector('h2')?.textContent || activeSection.id : 'snapshot';
    const slug = (activeSection?.id || 'snapshot').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = '/snapshots/' + stamp + '-' + slug + '.txt';
    const body = [
      'SNAPSHOT: ' + title,
      'Saved: ' + new Date().toString(),
      '',
      activeSection ? activeSection.innerText.trim() : ''
    ].join('\n');
    vault.files[path] = body;
    saveVault();
    openFile(path);
    setVaultStatus('Chapter snapshot saved to ' + path);
  });

  exportBtn.addEventListener('click', function () {
    const blob = new Blob([JSON.stringify(vault, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'greeran-book-vault.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setVaultStatus('Vault exported as greeran-book-vault.json');
  });

  importInput.addEventListener('change', function () {
    const file = importInput.files && importInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed.files || typeof parsed.files !== 'object') throw new Error('bad vault');
        vault = parsed;
        saveVault();
        currentFile = Object.keys(vault.files).sort()[0];
        openFile(currentFile);
        setVaultStatus('Vault imported successfully.');
      } catch (err) {
        setVaultStatus('Import failed: JSON did not match vault format.');
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  });

  filePathInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitCurrentFile();
    }
  });

  document.addEventListener('scroll', function () {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }, { passive: true });

  applyTheme();
  renderFiles();
  openFile(currentFile);
})();
