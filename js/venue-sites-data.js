// Convention-venue exhibit — shared schematic primitives.
//
// Interpretive exterior massing only: every footprint, height, spacing and
// placement is invented. The same primitives drive both the Three.js view and
// the VRML 2.0 export, so a downloaded .wrl matches what the page renders.
//
// Research and source check: docs/convention-venues.md
export const modelDisclaimer = 'SCHEMATIC VENUE EXHIBIT — invented footprints, heights, spacing and placement; simplified exterior massing only. Not a survey, site plan, floor plan, navigation aid, evacuation map, or event-planning tool. No interiors, booths, exhibitor layouts, docks or building systems are modeled.';

const box = (name, position, size, color, rotation = [0, 1, 0, 0]) => ({ name, position, size, color, rotation });
const ground = (color = '#d8d3c4', size = [300, 2, 220]) => box('Interpretive ground plane', [0, -1, 0], size, color);

/* ------------------------------------------------------------------ *
 * 1. Las Vegas Convention Center — campus massing
 * ------------------------------------------------------------------ */
const lvcc = [
  ground('#cfc9b6', [340, 2, 250]),
  box('Paradise Road — illustrative strip', [-96, .1, 0], [16, .3, 240], '#b9b4a6'),
  // West Hall (2021): the largest mass, with a stepped "ribbon" roof gesture.
  box('West Hall — exhibition mass (2021 expansion)', [-52, 12, -38], [62, 24, 96], '#e2ded0'),
  box('West Hall — Grand Lobby atrium', [-84, 16, -38], [10, 32, 54], '#cfe0e4'),
  box('West Hall — terrace deck', [-52, 25, 16], [62, 1.2, 12], '#c8c2ae'),
  // Legacy campus: North, Central and the two-story South Hall (2002).
  box('North Hall — exhibition mass', [24, 10, -74], [86, 20, 62], '#dbd6c6'),
  box('Central Hall — exhibition mass', [30, 11, -4], [98, 22, 70], '#d5d0bf'),
  box('South Hall — lower level', [36, 8, 74], [104, 16, 66], '#d9d3c1'),
  box('South Hall — upper level (two-story hall)', [36, 20, 74], [96, 9, 58], '#e3ded0'),
  box('Concourse link — illustrative', [-14, 8, -20], [16, 14, 120], '#cbc6b5'),
  // Convention Center Loop: a below-grade marker only, not a tunnel alignment.
  box('Convention Center Loop — below-grade marker', [-10, -2.4, 20], [120, 2.4, 6], '#9aa2a6'),
  box('Loop station portal — interpretive', [-52, 1.5, 26], [10, 5, 10], '#8e969b'),
  // Renaissance Las Vegas: a 15-storey non-gaming hotel block across Paradise Road.
  box('Renaissance Las Vegas — hotel slab (15 floors)', [-124, 27, -6], [22, 54, 40], '#cbbfae'),
  box('Renaissance Las Vegas — podium', [-124, 5, 26], [26, 10, 26], '#ddd4c2'),
  box('Surface parking — illustrative', [96, .1, 30], [58, .3, 180], '#c6c1b1'),
];

/* ------------------------------------------------------------------ *
 * 2. Sands Expo / Venetian Expo — the stacked halls
 * ------------------------------------------------------------------ */
const sands = [
  ground('#d2ccba', [260, 2, 200]),
  // Hall G: the low-ceiling lower hall (sourced: ~13 ft 5 in ≈ 4.09 model units).
  box('Hall G — lower hall, low ceiling (~13 ft 5 in)', [0, 2.05, 0], [150, 4.1, 110], '#c9c3b0'),
  box('Hall G — service apron', [0, .6, 66], [150, 1.2, 22], '#bdb7a6'),
  // Upper halls A–D: sourced ceiling height ~32 ft 5 in ≈ 9.88 model units.
  box('Hall A — upper level (~32 ft 5 in ceiling)', [-56, 9.04, -28], [36, 9.88, 52], '#e0dbcb'),
  box('Hall B — upper level', [-18, 9.04, -28], [36, 9.88, 52], '#dad5c4'),
  box('Hall C — upper level', [20, 9.04, -28], [36, 9.88, 52], '#e0dbcb'),
  box('Hall D — upper level', [54, 9.04, -22], [26, 9.88, 40], '#d5d0bf'),
  box('Upper concourse — illustrative', [0, 8.6, 22], [148, 9, 20], '#cdc8b7'),
  box('Escalator bank — interpretive', [-10, 6.5, 34], [14, 9, 8], '#b4aea0'),
  // Resort connection: the expo hall sat behind the hotel it was named for.
  box('Adjoining resort tower — massing only', [0, 46, -86], [70, 92, 26], '#c8b79d'),
  box('Resort podium — massing only', [0, 9, -66], [110, 18, 24], '#d3c6ad'),
  box('Sands Avenue — illustrative strip', [0, .1, 82], [230, .3, 14], '#b8b3a5'),
];

/* ------------------------------------------------------------------ *
 * 3. Anaheim Convention Center — Arena, halls, ACC North
 * ------------------------------------------------------------------ */
const anaheim = [
  ground('#cdd0bb', [300, 2, 230]),
  box('Katella Avenue — illustrative strip', [0, .1, 86], [280, .3, 16], '#b6b5a4'),
  // The 1967 domed Arena, stepped: VRML export writes boxes only.
  box('Arena — podium (1967 original structure)', [-92, 4, 34], [60, 8, 60], '#ddd8c6'),
  box('Arena dome — stepped approximation, tier 1', [-92, 10, 34], [52, 5, 52], '#e6e1cf'),
  box('Arena dome — stepped approximation, tier 2', [-92, 14.5, 34], [40, 4.5, 40], '#e6e1cf'),
  box('Arena dome — stepped approximation, tier 3', [-92, 18, 34], [26, 3, 26], '#ece7d5'),
  box('Arena dome — crown', [-92, 20.5, 34], [12, 2.5, 12], '#f0ebd9'),
  // Exhibit halls A–E as one long interpretive mass.
  box('Exhibit halls — long exhibition mass', [10, 11, 10], [130, 22, 96], '#dcd7c5'),
  box('Ballroom level — representative', [10, 24, -14], [110, 6, 48], '#e2ddcb'),
  box('Grand Plaza (2013) — outdoor event space', [-38, .2, 66], [90, .5, 34], '#c9cdb6'),
  // ACC North (2017): two levels on the former car park, with the bridge and balcony.
  box('ACC North — lower level (2017 expansion)', [104, 7, -30], [58, 14, 74], '#cfe1e6'),
  box('ACC North — upper column-free level', [104, 19, -30], [58, 10, 74], '#dceaef'),
  box('ACC North — balcony over Katella', [104, 24.6, 10], [50, 1.2, 10], '#c2d2d8'),
  box('Pedestrian bridge — climate-controlled link', [88, 16, -18], [34, 5, 9], '#cdc7b6'),
  box('Parking structure — representative', [116, 12, 54], [50, 24, 44], '#c3bfae'),
  box('Palm court — illustrative', [-40, .2, -56], [120, .4, 22], '#bfc7ab'),
];

/* ------------------------------------------------------------------ *
 * 4. Jacob K. Javits Convention Center — MD&M East
 * ------------------------------------------------------------------ */
const javits = [
  ground('#cbcdc2', [300, 2, 200]),
  box('Hudson River — symbolic strip', [0, .2, -78], [290, .5, 40], '#7f9aa4'),
  box('Eleventh Avenue — illustrative strip', [0, .1, 74], [290, .3, 16], '#b5b4a8'),
  box('Main exhibition shed — massing', [-20, 16, 0], [150, 32, 88], '#b9c6cc'),
  box('Crystal Palace lobby — glazed mass', [-108, 21, 0], [26, 42, 64], '#cfe2e8'),
  box('North expansion — later addition massing', [82, 18, -10], [54, 36, 70], '#c3ced4'),
  box('Rooftop terrace deck — interpretive', [82, 36.5, -10], [44, 1.2, 56], '#aebac0'),
  box('Truck marshalling apron — illustrative', [0, .2, 52], [220, .4, 26], '#b0aea2'),
  box('Neighbouring block — context massing', [-140, 30, 60], [40, 60, 40], '#c0bbb0'),
];

/* ------------------------------------------------------------------ *
 * 5. Mandalay Bay / Delano / W tower — the 64th-floor lounge band
 * ------------------------------------------------------------------ */
const tower = [
  ground('#d6cdb4', [300, 2, 230]),
  box('Resort podium — massing only', [0, 9, 44], [150, 18, 72], '#d8c9a8'),
  // Mandalay Bay Convention Center: the Black Hat USA floor since 2014.
  box('Mandalay Bay Convention Center — exhibition mass', [-116, 11, 14], [86, 22, 104], '#cfc1a2'),
  box('Convention center — ballroom level', [-116, 25, -10], [74, 8, 56], '#dacca9'),
  box('Convention center — expansion wing (2014–16)', [-116, 9, 76], [70, 18, 34], '#c6b897'),
  box('Convention link corridor — illustrative', [-56, 7, 34], [36, 14, 16], '#cdbf9f'),
  box('Hotel tower — suite floors (massing only)', [0, 48, -22], [44, 96, 26], '#c9b58f'),
  box('Tower side wing — massing only', [-34, 40, -22], [26, 80, 22], '#c2ae88'),
  // Sourced datum: the lounge occupies the 64th floor. Floor-to-floor spacing here
  // is a nominal 1.5 model units, so the band is a position marker, not a height.
  box('64th-floor lounge band — sourced storey, nominal height', [0, 96, -22], [48, 5, 30], '#e7d9b4'),
  box('Lounge terrace — interpretive', [26, 96, -22], [8, 4, 22], '#d9caa4'),
  box('Rooftop plant — representative', [0, 101.5, -22], [26, 6, 16], '#a8977a'),
  box('Pool deck — illustrative', [58, .4, 30], [56, .8, 70], '#bcc9c0'),
  box('Porte-cochère — representative', [-40, 5, 78], [34, 10, 20], '#cdbe9c'),
];

/* ------------------------------------------------------------------ *
 * 6. Walter E. Washington Convention Center — Sanborn's "Lingua"
 *    The link back to the Kryptos/Sanborn thread already in this repo.
 * ------------------------------------------------------------------ */
const lingua = [
  ground('#cec9bd', [220, 2, 180]),
  box('Convention center — exhibition mass', [0, 15, -34], [170, 30, 70], '#d9d5c9'),
  box('Entrance hall — glazed mass', [0, 19, 18], [120, 38, 34], '#cddde2'),
  box('Canopy — interpretive', [0, 38.6, 40], [130, 1.4, 16], '#bcbcb0'),
  box('Concourse floor — illustrative', [0, .3, 46], [150, .6, 30], '#c6c2b4'),
  // Sourced datum: two 16-foot bronze cylinders ≈ 4.88 model units tall.
  box('Lingua — bronze cylinder A (16 ft, boxed approximation)', [-9, 2.44, 44], [3, 4.88, 3], '#8c6b3f'),
  box('Lingua — bronze cylinder B (16 ft, boxed approximation)', [9, 2.44, 44], [3, 4.88, 3], '#8c6b3f'),
  box('Cylinder A — plinth', [-9, .35, 44], [5, .7, 5], '#b3ab9b'),
  box('Cylinder B — plinth', [9, .35, 44], [5, .7, 5], '#b3ab9b'),
  box('Projected-text wash — interpretive marker', [0, 6.5, 44], [46, .2, 20], '#e3d3ae'),
  box('Street — illustrative strip', [0, .1, 74], [210, .3, 14], '#b7b3a7'),
];

export const sites = [
  {
    id: 'lvcc', name: 'Las Vegas Convention Center', region: 'PARADISE ROAD, LAS VEGAS', period: '1959 · SOUTH HALL 2002 · WEST HALL 2021',
    role: 'CES · DEF CON 32–33', tag: 'LVCC', objects: lvcc, camera: [210, 150, 230], target: [-10, 8, 0],
    summary: 'A roughly 200-acre LVCVA campus of about 4.6 million square feet across the West, North, Central and South halls. CES has been held in Las Vegas since 1978; the two-story South Hall was added in 2002, and the $1 billion, 1.4-million-square-foot West Hall opened for World of Concrete on 8 June 2021.',
    context: 'The campus is the single best date stamp in the whole recollection. A ribbon-roofed West Hall and a Loop station mean 2021 or later; without them, the memory belongs to the older North / Central / South campus. DEF CON has run in the West Hall since DEF CON 32 in August 2024, so an LVCC memory from Black Hat week is 2024 or later, while a CES memory can be any year back to 1978. Published totals differ because they measure different things — 4.6 million sq ft is the campus, about 2.5 million sq ft is exhibit space.',
    interpretation: 'Hall blocks, the concourse link, Paradise Road and the parking apron are invented masses at invented spacings. The Convention Center Loop appears only as a below-grade marker bar — it is not a tunnel alignment. The Renaissance Las Vegas is shown as a slab across the road because it is genuinely adjacent, not because its shape or distance was measured.',
    landmarks: [
      ['West Hall', 'Opened June 2021. Exhibition mass plus an atrium gesture; not the real roof geometry.'],
      ['South Hall', 'Modelled as two stacked levels because the 2002 hall is two-story.'],
      ['Convention Center Loop', 'A marker only. No station, tunnel bore, or route is represented.'],
      ['Renaissance Las Vegas', '548 rooms over 15 floors, non-gaming and smoke-free, adjacent to the campus.'],
    ],
    sources: [
      ['LVCVA — West Hall expansion fact sheet, June 2021', 'https://www.multivu.com/players/English/8909751-lvcva-las-vegas-convention-center-expansion-informa-market-world-of-concrete/docs/WestHallFactSheet_1623197150059-907052717.pdf'],
      ['PR Newswire — West Hall debut and Loop, 8 June 2021', 'https://www.prnewswire.com/news-releases/1-billion-las-vegas-convention-center-expansion-debuts-with-first-major-convention-post-pandemic-301308548.html'],
      ['Review-Journal — renovated campus, CES in Las Vegas since 1978', 'https://www.reviewjournal.com/business/conventions/best-convention-center-in-the-world-reopens-after-massive-renovation-3604125/'],
      ['Cvent — Renaissance Las Vegas Hotel, 3400 Paradise Road', 'https://www.cvent.com/venues/las-vegas/hotel/renaissance-las-vegas-hotel/venue-de267c7f-28aa-454f-8b00-c57040b11c07'],
      ['DEF CON archives — DC 32 (2024) and DC 33 (2025) at the West Hall', 'https://defcon.org/html/links/dc-archives.html'],
    ],
  },
  {
    id: 'sands-expo', name: 'Sands Expo → Venetian Expo', region: 'SANDS AVENUE, LAS VEGAS', period: 'OPENED 9 NOV 1990 · RENAMED 2 SEP 2021',
    role: 'CES halls · AVN Expo to 2011', tag: 'STACKED HALLS', objects: sands, camera: [170, 105, 190], target: [0, 10, -10],
    summary: 'Developed by Las Vegas Sands behind the Sands Hotel and opened on 9 November 1990 with COMDEX. Expanded in 2003, renovated in 2013, and renamed The Venetian Expo effective 2 September 2021 during the sale of the Venetian–Palazzo complex. About 2.25 million square feet — the largest private convention facility in the United States.',
    context: 'This is the building behind the memory of “the CES show above the AVN show.” The stacking is real: halls A–D sit on the upper level at roughly 32½-foot ceilings, while Hall G is the lower hall at 13 feet 5 inches. Until 2012 the AVN Adult Entertainment Expo ran here in the same week as CES; in 2012 it moved to the following weekend and to the Hard Rock. A same-building, same-week visit therefore dates to January 2011 or earlier — and to a building then called the Sands Expo.',
    interpretation: 'Only the two ceiling heights are sourced; they set the relative thickness of the lower and upper slabs. Hall footprints, the concourse, the escalator bank, the resort tower and the street are invented. No hall is positioned where the real hall stands, and the letters mark relationships, not locations.',
    landmarks: [
      ['Hall G', 'The lower hall: about 380,000 sq ft at a 13 ft 5 in ceiling.'],
      ['Halls A–D', 'Upper-level halls at roughly 32 ft 5 in; A/B/C ≈ 178k/189k/188k sq ft, D ≈ 100.6k.'],
      ['Adjoining resort', 'Massing only. The Sands Hotel closed in 1996; the Venetian opened in 1999.'],
      ['Naming', 'Sands Expo before 2 September 2021; Venetian Expo after. Do not mix the two.'],
    ],
    sources: [
      ['Venetian Expo — opened as Sands Expo, renamed 2021', 'https://en.wikipedia.org/wiki/Venetian_Expo'],
      ['Hall table — upper halls A–D and lower Hall G dimensions', 'https://grokipedia.com/page/Venetian_Expo'],
      ['Las Vegas Sun — why CES and the adult expo split, 2012', 'https://lasvegassun.com/news/2012/jan/17/why-vegas-porn-convention-decided-meet-week-after-/'],
      ['Review-Journal — rename effective 2 September 2021', 'https://www.reviewjournal.com/business/tourism/sands-expo-changing-name-to-the-venetian-expo-on-sept-2-2400580/'],
    ],
  },
  {
    id: 'anaheim-cc', name: 'Anaheim Convention Center', region: 'KATELLA AVENUE, ANAHEIM', period: 'OPENED 1967 · ACC NORTH 26 SEP 2017',
    role: 'MD&M West', tag: 'ACC', objects: anaheim, camera: [200, 140, 220], target: [0, 10, 0],
    summary: 'Opened in 1967 with the domed Arena on Katella Avenue, and expanded seven times since. ACC North opened on 26 September 2017, adding 200,000 square feet over two levels — 100,000 of it column-free on the upper level — a 10,000 sq ft balcony, a climate-controlled pedestrian bridge and about 1,350 parking spaces. The complex now totals 1.8 million square feet, the largest convention center on the West Coast.',
    context: 'MD&M West is held here annually; the portfolio was founded in 1985, its 41st edition ran in February 2026, and it returns 9–11 February 2027. The show was branded IME West until Informa unified its advanced-manufacturing events under the MD&M name for the 2025 season, so an older visit was to a differently named show.',
    interpretation: 'The 1967 Arena is a stepped stack of boxes, because the VRML export writes boxes only — the real structure is a smooth mid-century dome. Hall footprints, the ballroom level, the plaza, the palm court and the parking structure are invented. ACC North is placed east of the halls with a bridge stub simply to record that the bridge exists.',
    landmarks: [
      ['Arena (1967)', '28,000 sq ft of flat floor seating up to 7,500. Stepped here, domed in reality.'],
      ['ACC North (2017)', 'Seventh expansion, built on former car park 1. A hard before/after date marker.'],
      ['Grand Plaza (2013)', 'Sixth expansion: about 100,000 sq ft of outdoor event space.'],
      ['Facility totals', '99 meeting rooms, 352,000 sq ft of meeting space, 238,000 sq ft of ballrooms.'],
    ],
    sources: [
      ['PR Newswire — ACC North opening, 26 September 2017', 'https://www.prnewswire.com/news-releases/anaheim-convention-center-officially-opens-acc-north-building-300526058.html'],
      ['Visit Anaheim — ACC North by the numbers', 'https://www.visitanaheim.org/articles/post/acc-north-officially-opens/'],
      ['Anaheim Convention Center — 1967 opening and seven expansions', 'https://sparkoc.com/venue/anaheim-convention-center/'],
      ['MD&M West — 41st edition, February 2026; returns February 2027', 'https://finance.yahoo.com/news/md-m-west-returns-focus-200000600.html'],
    ],
  },
  {
    id: 'javits', name: 'Jacob K. Javits Convention Center', region: '11TH AVENUE, NEW YORK', period: 'MD&M EAST · BIENNIAL',
    role: 'MD&M East', tag: 'JAVITS', objects: javits, camera: [200, 130, 210], target: [0, 14, 0],
    summary: 'MD&M East runs at the Javits Center, 429 11th Avenue, New York. The May 2025 edition ran 20–22 May; the next is scheduled 19–20 May 2027. MD&M East and MD&M South alternate as biennial regional expos, so there is no MD&M East in every calendar year.',
    context: 'Under its former IME East branding the show also ran in December — the 2021 edition was 7–9 December. That December-versus-May difference is a useful year filter for anyone trying to date a specific trip. “MD&M East and West” is two coasts and, since the rebrand, two different cadences; it is not an annual pair.',
    interpretation: 'A glazed shed, a lobby mass, a later north expansion with a roof deck, a truck apron and the river are all invented forms at invented spacings. The famous space-frame is not modelled; nothing here reproduces the real elevation, bay spacing, or block geometry.',
    landmarks: [
      ['Exhibition shed', 'One interpretive mass standing in for the main hall levels.'],
      ['North expansion', 'A later addition, represented by a block and a roof deck only.'],
      ['Schedule', 'MD&M East 20–22 May 2025; next edition 19–20 May 2027.'],
      ['Branding', 'IME East became MD&M East in the 2025 season rebrand.'],
    ],
    sources: [
      ['MD&M East — Javits Center, 19–20 May 2027', 'https://www.mdmeast.com/'],
      ['MD&DI events — MD&M East, 20–22 May 2025', 'https://www.mddionline.com/events/md-m-east'],
      ['MD&DI — IME events unify under the MD&M brand', 'https://www.mddionline.com/manufacturing/informa-markets-engineering-advanced-manufacturing-events-unify-to-md-m-brand'],
      ['Convention calendar — IME/MD&M East at Javits, December 2021', 'https://conventioncalendar.com/us/ny/new-york-city/jacob-javits-center/mdm-east-399792'],
    ],
  },
  {
    id: 'delano-tower', name: 'Mandalay Bay, the Delano tower & Skyfall', region: 'SOUTH STRIP, LAS VEGAS', period: 'BLACK HAT USA HERE SINCE 2014 · SKYFALL SINCE OCT 2015',
    role: 'Black Hat USA · Skyfall Lounge', tag: 'HACKER SUMMER CAMP', objects: tower, camera: [220, 140, 220], target: [-20, 40, 10],
    summary: 'Black Hat USA has been held at the Mandalay Bay Convention Center every year since 2014, after thirteen years at Caesars Palace. The convention center reached about 2.1 million sq ft — roughly 861,000 of it exhibition space — after a $70 million expansion completed across 2014–16. The tower alongside it opened on 17 December 2003 as THEhotel at Mandalay Bay, was rebranded Delano Las Vegas on 2 September 2014, and became W Las Vegas on 18 December 2024; Skyfall Lounge opened on its 64th floor in October 2015.',
    context: 'This pairing dates the Skyfall meeting tightly. Black Hat only arrived at Mandalay Bay in 2014, and Skyfall only opened in October 2015 — after Black Hat USA 2015 had already finished on 6 August. A Black Hat trip that included an evening at Skyfall therefore falls in 2016 or later, and not 2020, when Black Hat USA was virtual. If the same week also included the Las Vegas Convention Center, that points at DEF CON, which moved to the LVCC West Hall for DEF CON 32 in August 2024 after Caesars cancelled its contract — narrowing the trip to August 2024 or later.',
    interpretation: 'The convention-center masses, tower, wings, podium, pool deck and porte-cochère are invented forms at invented spacings; no hall, ballroom, or Business Hall layout is represented. Only one datum is sourced: the lounge sits on the 64th floor, so the band is placed high on the tower as a storey marker. Floor-to-floor spacing here is nominal — the band’s height above ground is not a measured elevation, and no interior, terrace layout, or view cone is modelled.',
    landmarks: [
      ['Mandalay Bay Convention Center', 'Black Hat USA venue since 2014; about 2.1M sq ft after the 2014–16 expansion.'],
      ['64th-floor band', 'A sourced storey number, rendered as a marker, not a measured height.'],
      ['Name chronology', 'THEhotel (2003–2014) → Delano (2014–2024) → W Las Vegas (2024–).'],
      ['Current status', 'Skyfall closed for renovation 20 July 2026; reopening planned 4 October 2026.'],
    ],
    sources: [
      ['Black Hat — event list: Caesars Palace through 2013, Mandalay Bay from 2014', 'https://en.wikipedia.org/wiki/Black_Hat_(conference)'],
      ['Review-Journal — $70M expansion brings Mandalay Bay to 2.1M sq ft', 'https://www.reviewjournal.com/business/tourism/expanded-mandalay-bay-convention-center-ready-to-welcome-even-more-crowds/'],
      ['W Las Vegas — THEhotel, Delano, and the 2024 rebrand', 'https://en.wikipedia.org/wiki/W_Las_Vegas'],
      ['Rivea and Skyfall Lounge open on the 64th floor, October 2015', 'https://www.themeetingmagazines.com/news/ducasse-debuts-rivea-skyfall-lounge-delano-las-vegas/'],
      ['DEF CON archives — DC 32 and DC 33 at the LVCC West Hall', 'https://defcon.org/html/links/dc-archives.html'],
    ],
  },
  {
    id: 'walter-e-washington', name: 'Walter E. Washington Convention Center', region: 'MOUNT VERNON SQUARE, WASHINGTON D.C.', period: 'LINGUA INSTALLED 2002',
    role: 'Sanborn · Lingua', tag: 'LINGUA', objects: lingua, camera: [110, 70, 150], target: [0, 8, 26],
    summary: 'Jim Sanborn’s Lingua stands in the Walter E. Washington Convention Center: two 16-foot bronze cylinders, installed in 2002, their surfaces waterjet-cut with historical texts in eight languages — Russian, Chinese, Ethiopic (Ge’ez), French, Spanish, Latin, Greek and Iroquois — ranging back to about 1400 BC. The Chinese section reproduces Wang Xizhi’s Lantingji Xu. Internal lights project the text outward across the building’s surfaces.',
    context: 'CORRECTION (28 Sept 2026): this building is NOT the “convention center VRML” remembered at the start of this pass. That artifact is the Sanborn installation viewer already in the repository — public/apps/kryptos-vrml/index.html — whose sculpture registry carries eleven Sanborn sites, Lingua among them, with the convention center in its location line. This model is only an exterior massing study of the building that houses the work; the sculpture itself is modelled, sourced and source-checked in that viewer, which is where a reader should go. It is kept here so the Sanborn thread and the Las Vegas / Anaheim trade-show thread stay visibly separate rather than braided in the book.',
    interpretation: 'Only the cylinder height is sourced, and even that is boxed: the VRML export writes boxes, so a 16-foot bronze cylinder is represented as a 4.88-unit square prism. Diameter, spacing, plinths, the building masses, the canopy and the street are invented. The “projected-text wash” is an editorial marker for the lighting effect, not a photometric or optical simulation, and no glyph, language, or text fragment is reproduced in the geometry.',
    landmarks: [
      ['Lingua (2002)', 'Two 16 ft bronze cylinders; text in eight languages, some dating to c. 1400 BC.'],
      ['Chinese section', 'Wang Xizhi’s Lantingji Xu, waterjet-cut into the bronze.'],
      ['Projection', 'The cylinders are lit from within and throw their text onto the surroundings.'],
      ['Where the sculpture lives', 'Modelled and source-checked in the Sanborn installation viewer: public/apps/kryptos-vrml/index.html (also catalogued in sanborn-codex.html).'],
    ],
    sources: [
      ['Lingua (sculpture) — two 16 ft cylinders, eight languages', 'https://en.wikipedia.org/wiki/Lingua_(sculpture)'],
      ['Jim Sanborn — selected works including Lingua', 'https://en.wikipedia.org/wiki/Jim_Sanborn'],
      ['Elonka Dunin — Sanborn works list, Lingua 2002', 'https://www.elonka.com/kryptos/sanborn.html'],
    ],
  },
];

function rgb(hex) { return hex.slice(1).match(/../g).map(n => parseInt(n, 16) / 255); }
const quote = s => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"';

export function toVRML(site) {
  const info = [modelDisclaimer, site.interpretation, ...site.sources.map(s => s[0] + ': ' + s[1])];
  const header = `#VRML V2.0 utf8
WorldInfo { title ${quote(site.name + ' — schematic venue exhibit')} info [ ${info.map(quote).join(' ')} ] }
NavigationInfo { type ["EXAMINE", "ANY"] }
Background { skyColor [0.91 0.92 0.94] }
Viewpoint { description "Overview" position 0 150 230 orientation 1 0 0 -0.55 }
DirectionalLight { direction -1 -2 -1 intensity 0.9 }
`;
  const body = site.objects.map((o, i) =>
    `# ${o.name}\nDEF OBJECT_${i} Transform { translation ${o.position.join(' ')} rotation ${o.rotation.join(' ')} children [ Shape { appearance Appearance { material Material { diffuseColor ${rgb(o.color).join(' ')} } } geometry Box { size ${o.size.join(' ')} } } ] }`
  ).join('\n');
  return header + body + '\n';
}
