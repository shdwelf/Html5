/**
 * GREERAN SUBSURFACE — biography deep-dive data register.
 *
 * The life-file strata behind greeran-subsurface.html: a Glendora → Goleta
 * transect stage, era layers for each chapter of the 2001 turning point,
 * evidence-tiered nodes, and the master timeline that keeps events in order.
 *
 * Tiers (evidence classification, shared with the book lab):
 *   official  — public record / primary source, pinned and cited
 *   community — well-sourced secondary description
 *   context   — schematic scene-setting geometry, schematic placement only
 *   memory    — private recollection, kept separate until corroborated
 *
 * Schematic biography theater. Not a survey. Nodes are scene anchors, not
 * centimeter-accurate map points.
 */

/* ------------------------------------------------------------------ stage */

export const BBOX = { lon0: -120.45, lon1: -117.1, lat0: 32.7, lat1: 34.8 };
export const CENTER = { lon: -118.775, lat: 33.75 };

export const KM_PER_DEG_LAT = 111.32;
export const UNITS_PER_KM = 0.1;
export const COS_LAT = Math.cos((CENTER.lat * Math.PI) / 180);

/** lon/lat -> scene XZ (1 unit = 10 km, local equirectangular). */
export function project(lon, lat) {
  const x = (lon - CENTER.lon) * KM_PER_DEG_LAT * COS_LAT * UNITS_PER_KM;
  const z = -(lat - CENTER.lat) * KM_PER_DEG_LAT * UNITS_PER_KM;
  return [x, z];
}

/** scene XZ -> lon/lat. */
export function lonLatFromXZ(x, z) {
  const lat = CENTER.lat - z / (KM_PER_DEG_LAT * UNITS_PER_KM);
  const lon = CENTER.lon + x / (KM_PER_DEG_LAT * COS_LAT * UNITS_PER_KM);
  return [lon, lat];
}

export const LAND_BASE_M = 30;

/** Gaussian relief register (metres). Synthesized scene, USGS-3DEP-flavored. */
export const RELIEF = [
  // San Gabriel Mountains spine
  { lon: -117.646, lat: 34.289, h: 2850, s: 0.05 }, // Mt. San Antonio (Baldy)
  { lon: -117.7, lat: 34.26, h: 2100, s: 0.05 },
  { lon: -117.78, lat: 34.25, h: 1600, s: 0.05 },
  { lon: -117.9, lat: 34.22, h: 1200, s: 0.06 },
  { lon: -118.06, lat: 34.2, h: 1500, s: 0.05 },
  { lon: -118.2, lat: 34.19, h: 1300, s: 0.07 },
  { lon: -118.4, lat: 34.17, h: 900, s: 0.08 },
  // Glendora foothills above Big Dalton / GMR
  { lon: -117.83, lat: 34.19, h: 950, s: 0.022 },
  { lon: -117.8, lat: 34.17, h: 700, s: 0.018 },
  // San Bernardinos east of Baldy
  { lon: -117.55, lat: 34.18, h: 1700, s: 0.07 },
  // Verdugo / San Rafael Hills
  { lon: -118.22, lat: 34.22, h: 420, s: 0.018 },
  // Santa Susanas
  { lon: -118.65, lat: 34.32, h: 650, s: 0.05 },
  // Santa Monicas
  { lon: -118.85, lat: 34.09, h: 350, s: 0.07 },
  { lon: -118.7, lat: 34.08, h: 400, s: 0.04 },
  // Palos Verdes
  { lon: -118.35, lat: 33.75, h: 180, s: 0.016 },
  // Santa Ynez Range above Santa Barbara / Goleta (kept north of the coastal shelf)
  { lon: -119.9, lat: 34.58, h: 950, s: 0.07 },
  { lon: -119.7, lat: 34.56, h: 1100, s: 0.045 },
  { lon: -119.5, lat: 34.52, h: 900, s: 0.04 },
  // San Rafael / Topatopa behind the pass
  { lon: -119.85, lat: 34.72, h: 1300, s: 0.075 },
  { lon: -119.35, lat: 34.55, h: 1500, s: 0.07 },
  // Channel Islands (show through the translucent sea)
  { lon: -119.7, lat: 33.98, h: 380, s: 0.06 }, // Santa Cruz Island
  { lon: -119.4, lat: 34.01, h: 140, s: 0.015 }, // Anacapa
  { lon: -120.1, lat: 33.95, h: 280, s: 0.045 }, // Santa Rosa
  // San Diego County inner highlands
  { lon: -117.1, lat: 32.95, h: 500, s: 0.06 },
  { lon: -117.35, lat: 33.05, h: 600, s: 0.05 },
];

/** Coastline trace, San Diego (SE) to Point Conception (NW). */
export const COAST = [
  [-117.4, 32.7],
  [-117.28, 32.84],
  [-117.27, 32.96],
  [-117.39, 33.2],
  [-117.62, 33.43],
  [-117.93, 33.62],
  [-118.0, 33.65],
  [-118.2, 33.74],
  [-118.41, 33.74],
  [-118.39, 33.85],
  [-118.55, 33.93],
  [-118.78, 34.03],
  [-118.95, 34.0],
  [-119.11, 34.08],
  [-119.3, 34.28],
  [-119.51, 34.39],
  [-119.7, 34.4],
  [-119.755, 34.403],
  [-119.8, 34.406],
  [-119.827, 34.429],
  [-119.838, 34.426],
  [-119.8458, 34.4105],
  [-119.865, 34.4095],
  [-119.879, 34.4185],
  [-119.905, 34.423],
  [-120.1, 34.452],
  [-120.21, 34.468],
  [-120.35, 34.46],
  [-120.45, 34.44],
];

/* ----------------------------------------------------------------- layers */

/** Era layers — one per life chapter. Corridor color + time window. */
export const LAYERS = [
  { id: "apps", label: "Applications & senior year", color: "#e8c56a", on: true, era: [2000.75, 2001.5] },
  { id: "esgvrop", label: "ESGVROP summer — first boss", color: "#7fd39b", on: true, era: [2001.3, 2001.75] },
  { id: "ucsb", label: "UCSB — first quarter 2001", color: "#6f9dff", on: true, era: [2001.6, 2002.0] },
  { id: "iv", label: "Isla Vista & Goleta", color: "#58d6c9", on: true, era: [2001.6, 2004.5] },
  { id: "sb", label: "Santa Barbara & the pass", color: "#c9a2ff", on: true, era: [2001.6, 2004.5] },
  { id: "amgen", label: "Amgen Tour · GMR corridor", color: "#ffb020", on: true, era: [2006.1, 2019.5] },
  { id: "roads", label: "Roads & bus routes (context)", color: "#8fa3b8", on: true, era: [2000, 2020] },
];

export const TIER_COLOR = {
  official: "#ffb020",
  community: "#5cd6ff",
  context: "#b48cff",
  memory: "#ff6ec7",
};

export const TIER_LABEL = {
  official: "Official — public record",
  community: "Community — well-sourced secondary",
  context: "Context — schematic scene anchor",
  memory: "Memory — private recollection",
};

/* ----------------------------------------------------------------- nodes */

const N = (node) => node;

export const NODES = [
  /* ---- applications & senior year ---------------------------------- */
  N({
    id: "ghs",
    short: "GHS",
    label: "Glendora High School — Class of 2001",
    tier: "official",
    layer: "apps",
    kind: "school",
    lon: -117.8355,
    lat: 34.1343,
    era: [1997.8, 2001.5],
    dateLabel: "graduated June 2001",
    note:
      "1600 E Foothill Blvd, Glendora. OSM way 51207355, GNIS 271311. The diploma year that anchors the 2001 turning point — see the Glendora High 4Dwm viewer for the campus model.",
  }),
  N({
    id: "ucla",
    short: "UCLA",
    label: "UCLA — application declined",
    tier: "memory",
    layer: "apps",
    kind: "campus",
    lon: -118.4452,
    lat: 34.0689,
    era: [2000.75, 2001.4],
    dateLabel: "decision spring 2001 (memory)",
    note:
      "One of four UC applications filed in the fall 2000 cycle (filing period Oct 1 – Nov 30). Recollection: declined at UCLA and UCSC, accepted at UCSB and UCSD. Campus facts are public; the outcome rows are private memory until paperwork surfaces.",
  }),
  N({
    id: "ucsc",
    short: "UCSC",
    label: "UC Santa Cruz — application declined",
    tier: "memory",
    layer: "apps",
    kind: "campus",
    lon: -120.45,
    lat: 34.79,
    era: [2000.75, 2001.4],
    dateLabel: "decision spring 2001 (memory)",
    offFrame: true,
    offFrameDir: "↖",
    note:
      "Pinned to the frame corner: UCSC sits ~400 km northwest of this stage, outside the transect. Application + decline are private memory; kept on the register so the four-campus sweep stays countable.",
  }),
  N({
    id: "ucsd",
    short: "UCSD",
    label: "UC San Diego — accepted",
    tier: "memory",
    layer: "apps",
    kind: "campus",
    lon: -117.2369,
    lat: 32.8807,
    era: [2000.75, 2001.4],
    dateLabel: "decision spring 2001 (memory)",
    note:
      "Accepted at UCSD and UCSB, per recollection. The public record anchors the campus; the acceptance itself is memory-tier. UCSB won the tie-break — the whole rest of this stage exists because of that choice.",
  }),
  N({
    id: "ucsb-admit",
    short: "UCSB",
    label: "UC Santa Barbara — accepted, enrolled",
    tier: "memory",
    layer: "apps",
    kind: "campus",
    lon: -119.8489,
    lat: 34.414,
    era: [2000.75, 2004.6],
    dateLabel: "admit spring 2001 · enrolled fall 2001",
    note:
      "The resume lists UCSB CMPSCI / College of Engineering 2001–2004. Quarter system. Everything in the blue and teal layers hangs off this acceptance.",
  }),
  N({
    id: "app-fee",
    short: "$50",
    label: "Four applications, $50 and a life story each",
    tier: "memory",
    layer: "apps",
    kind: "memory",
    lon: -118.2,
    lat: 34.05,
    era: [2000.75, 2000.95],
    dateLabel: "Oct–Nov 2000 filing period",
    note:
      "Recollection: $50 per application, and each one carried a life-story essay. Today's published UC fee is $80 per campus; the published fee schedule for the fall-2001 cycle is still to be verified in a primary source, so the number stays memory-tier.",
  }),

  /* ---- ESGVROP ------------------------------------------------------- */
  N({
    id: "esgvrop-delnorte",
    short: "DEL N",
    label: "ESGVROP Del Norte Campus",
    tier: "official",
    layer: "esgvrop",
    kind: "first",
    lon: -117.9372,
    lat: 34.0766,
    era: [2001.3, 2001.75],
    dateLabel: "1501 W. Del Norte Ave, West Covina",
    note:
      "East San Gabriel Valley Regional Occupational Program & Technical Center. The archived key-contacts page lists the Del Norte Campus at 1501 W. Del Norte Avenue, West Covina — (626) 962-5080. A JPA of seven unified school districts: Azusa, Baldwin Park, Charter Oak, Covina, Glendora, Walnut, West Covina.",
  }),
  N({
    id: "esgvrop-sunflower",
    short: "SUNFL",
    label: "ESGVROP Sunflower Campus",
    tier: "official",
    layer: "esgvrop",
    kind: "first",
    lon: -117.8465,
    lat: 34.1133,
    era: [2001.3, 2001.75],
    dateLabel: "1505 S. Sunflower Ave, Glendora",
    note:
      "The second ESGVROP campus, confirmed in the archived key contacts: 1505 S. Sunflower Avenue, Glendora — (626) 335-5350. The 2002–03 ROP class schedule routes Medical Assistant, Retail Sales and Health Information classes through 'Sunflower Center' rooms A2, E2 and H2. See the ESGVROP 4Dwm viewer.",
  }),
  N({
    id: "quesenberry",
    short: "RQ",
    label: "Ryan Quesenberry — Project Facilitator, Technology",
    tier: "official",
    layer: "esgvrop",
    kind: "memory",
    lon: -117.9366,
    lat: 34.0762,
    era: [2001.3, 2001.75],
    dateLabel: "summer–fall 2001",
    note:
      "First boss. The public record puts Ryan Quesenberry on the ESGVROP key-contacts list as 'Project Facilitator-Technology' (rquesenberry@esgvrop.org, 626-962-5080). Recollection adds the human layer: he had previously run the computer lab at the library, and the two of them would go out to lunch.",
  }),
  N({
    id: "glendora-library",
    short: "LIB",
    label: "Glendora library computer lab (prior post)",
    tier: "memory",
    layer: "esgvrop",
    kind: "memory",
    lon: -117.8656,
    lat: 34.1384,
    era: [1998, 2001.3],
    dateLabel: "before summer 2001",
    note:
      "Schematic anchor for the remembered predecessor job: the computer lab at the Glendora library where Quesenberry taught before ESGVROP. Building placement approximate; the connection itself is private memory.",
  }),
  N({
    id: "camp-williams",
    short: "CW",
    label: "Camp Williams — East Fork, San Gabriel Canyon",
    tier: "context",
    layer: "esgvrop",
    kind: "resort",
    lon: -117.86,
    lat: 34.172,
    era: [2001.3, 2001.75],
    dateLabel: "summer 2001 outings",
    note:
      "Campground and mobile-home park on the East Fork of the San Gabriel River, Highway 39, Angeles National Forest. The remembered ESGVROP-era excursion ground — gold-panning country, Eldoradoville's ghost, an old mine across the river.",
  }),

  /* ---- UCSB first quarter ------------------------------------------- */
  N({
    id: "anacapa",
    short: "ANAC",
    label: "Anacapa Hall — first bed built",
    tier: "memory",
    layer: "ucsb",
    kind: "dorm",
    lon: -119.8513,
    lat: 34.4134,
    era: [2001.65, 2001.75],
    dateLabel: "September 2001",
    note:
      "One of UCSB's original 1950s residence halls. Recollection: stayed in different dorms and had to assemble the bed and furnishings more than once — once in Anacapa, then San Nicolas. Move-in order is private memory; the halls are public record.",
  }),
  N({
    id: "san-nicolas",
    short: "SN",
    label: "San Nicolas Hall — freshman-year dorm",
    tier: "memory",
    layer: "ucsb",
    kind: "dorm",
    lon: -119.858,
    lat: 34.4155,
    era: [2001.7, 2002.5],
    dateLabel: "2001–02",
    note:
      "The freshman-year hall. The paperwork hunt — move-in records, the RA who would know, 'the daily flush' — is an open research item; none of it is in the public record yet, so it lives in the memory tier.",
  }),
  N({
    id: "dlg",
    short: "DLG",
    label: "De La Guerra Dining Commons — sandwiches",
    tier: "official",
    layer: "ucsb",
    kind: "dining",
    lon: -119.8495,
    lat: 34.413,
    era: [2001.6, 2004.5],
    dateLabel: "2001–2004",
    note:
      "DLG, by the University Center. Jack Johnson — a UCSB film graduate — sings 'Well I was eating lunch at the D.L.G.' in 'Bubble Toes' (Brushfire Fairytales, February 2001), three verses after 'her feet are all covered with tar balls and scars.' The song maps the same two scenes as this stage: the commons and the tarred beach.",
  }),
  N({
    id: "davidson-mil",
    short: "MIL",
    label: "Davidson Library — Map & Imagery Laboratory",
    tier: "official",
    layer: "ucsb",
    kind: "library",
    lon: -119.8443,
    lat: 34.414,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "The MIL, first floor north of Davidson Library — one of the country's largest map, aerial and GIS collections. The resume's student-programmer post: Alexandria Digital Library work under Greg Janée. Recollection: the century plant bloomed while on shift here. Agave americana blooms once after 10–25 years, a stalk up to 8 inches a day — but no dated public record of that particular bloom has surfaced, so the bloom stays memory-tier.",
  }),
  N({
    id: "gold",
    short: "GOLD",
    label: "GOLD — Gaucho On-Line Data",
    tier: "official",
    layer: "ucsb",
    kind: "systems",
    lon: -119.8462,
    lat: 34.4148,
    era: [2001.6, 2004.6],
    dateLabel: "live by August 2001",
    note:
      "The registrar's GOLD system at gnet.ucsb.edu/gold: registration, add/drop, schedule search, BARC billing. The 2000–02 General Catalog still describes Registration by Telephone (RBT); by fall 2001 the web system carried the load. The archived gold.htm (captured Aug 16, 2001) enumerates what a first-quarter freshman could do from a dorm connection.",
  }),
  N({
    id: "catalog-cs",
    short: "CATALOG",
    label: "2000–02 General Catalog — CS 5JA / CS 10 prerequisites",
    tier: "official",
    layer: "ucsb",
    kind: "book",
    lon: -119.8436,
    lat: 34.4146,
    era: [2001.6, 2002.0],
    dateLabel: "in force for fall 2001",
    note:
      "The catalog in force for the first quarter. Computer Science 5JA (Java section) fed CS 10, 'Introduction to Computer Programming' (Gonzalez, Su) — 'students with no prior programming background are encouraged to take CS 5JA before 10.' The Java track matches the remembered JCreator coursework.",
  }),
  N({
    id: "jcreator",
    short: "JCRE",
    label: "JCreator in a trailer — first software",
    tier: "memory",
    layer: "ucsb",
    kind: "terminal",
    lon: -119.8409,
    lat: 34.4144,
    era: [2001.7, 2001.95],
    dateLabel: "fall 2001",
    note:
      "Recollection: time-management drills and assigned software built with JCreator, in a trailer classroom. Hard anchor: JCreator LE 2.5.0 shipped 2001-10-14 — mid-first-quarter (see docs/jcreator-jdk-coupling.md). Unresolved: which trailer — a UCSB temporary building near Engineering I, or an ESGVROP portable. Flagged in the ideas backlog.",
  }),
  N({
    id: "ucen-bookstore",
    short: "BOOK",
    label: "UCen & UCSB Bookstore",
    tier: "official",
    layer: "ucsb",
    kind: "shop",
    lon: -119.848,
    lat: 34.4129,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "The University Center and its bookstore — textbooks, gear, and the quarter's first long line. A.S. Publications (the AS copy shop) now handles course readers; in 2001 the reader trail ran through the bookstore and Isla Vista copy counters.",
  }),
  N({
    id: "satellite-repro",
    short: "SAT-R",
    label: "Satellite Reprographics — Isla Vista",
    tier: "memory",
    layer: "ucsb",
    kind: "shop",
    lon: -119.8655,
    lat: 34.4135,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "Remembered print counter in Isla Vista for course readers and copies. The published record documents A.S. Publications on campus and The Alternative on Pardall (35 years in I.V. by 2011); a shop specifically named 'Satellite Reprographics' has not yet been located in a source, so it stays memory-tier until a receipt or phone-book ad surfaces.",
  }),
  N({
    id: "kcsb",
    short: "KCSB",
    label: "KCSB 91.9 FM — the campus radio station",
    tier: "official",
    layer: "ucsb",
    kind: "radio",
    lon: -119.8473,
    lat: 34.4132,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "UCSB's student-run station. The remembered listening runs alongside the LA talk dial: Marc Germain as 'Mr. KABC' on KABC 790 (1997–2007), earlier 'Mr. KFI' on KFI 640 (1993–96). The 'store tower' detail and any Germain-tower connection is unresolved memory.",
  }),
  N({
    id: "daily-nexus",
    short: "NEXUS",
    label: "Daily Nexus — the student paper",
    tier: "official",
    layer: "ucsb",
    kind: "press",
    lon: -119.8455,
    lat: 34.4127,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "UCSB's student daily since 1930. Its archives carry the era: the May 23, 2001 IVTV censorship story, the May 3, 2002 court story on IVTV footage, and 20+ years of campus life. 'The daily flush' is an unlocated companion title — likely dorm-culture ephemera; memory tier.",
  }),
  N({
    id: "lagoon",
    short: "LAGOON",
    label: "The Lagoon & Campus Point",
    tier: "official",
    layer: "ucsb",
    kind: "lake",
    lon: -119.842,
    lat: 34.4125,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "The campus lagoon — a restored estuary — spits east to Campus Point. The campus master plan (Long Range Development Plan) maps how all of this was meant to grow; the 1990 LRDP governed the 2001 campus, with the next update process still years off. Remembered as part of the freshman walk-around.",
  }),
  N({
    id: "art-studio",
    short: "ART",
    label: "The Art Studio",
    tier: "context",
    layer: "ucsb",
    kind: "studio",
    lon: -119.839,
    lat: 34.4156,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "Schematic anchor for the remembered art-studio corner of campus life — building placement approximate, kept on the context tier rather than pinned.",
  }),
  N({
    id: "los-ingenieros",
    short: "LI",
    label: "Los Ingenieros — Student Organization of the Year 2001–02",
    tier: "official",
    layer: "ucsb",
    kind: "org",
    lon: -119.8415,
    lat: 34.4148,
    era: [2001.6, 2004.6],
    dateLabel: "founded 1978 · award 2001–02",
    note:
      "The UCSB SHPE/MAES chapter, founded in 1978 by eight Latino engineering students. It won UCSB Student Organization of the Year for 2001–02 — the subject's first year on campus — and partners with the National Society of Black Engineers (NSBE, founded 1975). Membership participation is recollection; the organization record is public.",
  }),

  /* ---- Isla Vista & Goleta ------------------------------------------- */
  N({
    id: "iv-embarcadero",
    short: "EMBAR",
    label: "Embarcadero loop — the Graduate, Giovanni's, the strip",
    tier: "official",
    layer: "iv",
    kind: "harbor",
    lon: -119.865,
    lat: 34.4135,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "Where the Embarcaderos meet: Embarcadero Hall — the rebuilt Bank of America — later ran as The Graduate bar, then The Anaconda, then IV Brewing. Wednesday nights, Giovanni's packed to watch IVTV. 'The Grad bar' as the remembered landmark is memory-tier; the building succession is documented.",
  }),
  N({
    id: "ivtv",
    short: "IVTV",
    label: "IVTV — Isla Vista Television, Channel 17",
    tier: "official",
    layer: "iv",
    kind: "tv",
    lon: -119.8642,
    lat: 34.4131,
    era: [1999.75, 2003.5],
    dateLabel: "first episode Oct 1999 · Jeffrey's tip",
    note:
      "Greg Shields and Sevan Matossian's public-access chronicle of Isla Vista, Wednesday nights on Cox Channel 17; the LA Times profiled it June 18, 2001. Jeffrey's recommendation and the YouTube reuploads ('IVTV all episodes') are the remembered thread; the series and its 2001–02 controversies are public record.",
  }),
  N({
    id: "del-playa",
    short: "DP",
    label: "Del Playa — Tiki House & the Annex",
    tier: "memory",
    layer: "iv",
    kind: "house",
    lon: -119.866,
    lat: 34.4105,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "The remembered Del Playa addresses — the Tiki House, the annex — stay private memory. The drive itself is public: the clifftop street every guide to Isla Vista describes.",
  }),
  N({
    id: "slurpee-run",
    short: "SLURP",
    label: "Slurpees with vodka",
    tier: "memory",
    layer: "iv",
    kind: "cup",
    lon: -119.8678,
    lat: 34.4124,
    era: [2001.7, 2002.6],
    dateLabel: "fall 2001",
    note:
      "The convenience-store run of legend. Private recollection — no public record will ever carry this one, which is exactly why the memory tier exists.",
  }),
  N({
    id: "monarch-grove",
    short: "MONARCH",
    label: "Ellwood Mesa monarch grove",
    tier: "official",
    layer: "iv",
    kind: "grove",
    lon: -119.893,
    lat: 34.4228,
    era: [2001.75, 2004.6],
    dateLabel: "arrive October, leave by March",
    note:
      "Western monarchs overwinter at Ellwood — documented since the 1920s, one of California's highest-priority groves, on eucalyptus planted by Ellwood Cooper in the 1870s. They arrive mid-October, cluster through December, and depart by mid-March. The remembered 'Goleta slough / by John's' vantage stays memory-tier.",
  }),
  N({
    id: "coal-oil-point",
    short: "COP",
    label: "Coal Oil Point seep field — the tar balls",
    tier: "official",
    layer: "iv",
    kind: "seep",
    lon: -119.879,
    lat: 34.4185,
    era: [2001.6, 2004.6],
    dateLabel: "active for 500,000 years",
    note:
      "One of the world's largest studied marine seep fields: ~100–150 barrels of petroleum a day, 40 tons of methane, tar balls on IV and Goleta beaches for miles. UCSB researchers monitored the beaches 2001–03 — the subject's exact window. 'Bubble Toes' puts those tar balls on the queen of hearts' feet in 2001.",
  }),
  N({
    id: "platform-holly",
    short: "HOLLY",
    label: "Platform Holly — the offshore derrick",
    tier: "official",
    layer: "iv",
    kind: "platform",
    lon: -119.925,
    lat: 34.4089,
    era: [1966, 2015],
    dateLabel: "South Ellwood field · idled 2015",
    note:
      "The oil platform visible from Devereux and Ellwood — the 'oil derrick off the coast.' Production at the South Ellwood field measurably cut seepage near the platform from 1973–95; the platform went idle in 2015.",
  }),
  N({
    id: "camino-real-cinemas",
    short: "CINE",
    label: "Goleta movie night — Jay and Silent Bob Strike Back",
    tier: "memory",
    layer: "iv",
    kind: "cinema",
    lon: -119.867,
    lat: 34.4348,
    era: [2001.68, 2001.72],
    dateLabel: "released Aug 24, 2001 · seen ~Sept 2001",
    note:
      "Two weeks before the quarter began, off Hollister in Goleta. Film release is public record; the ticket is memory. Goleta's 2001 screens: Camino Real Cinemas (first-run, 7040 Marketplace Dr) and the Cinema Twin 'three dollar theater' at 6050 Hollister (closed Feb 2006). The drive-in landmarks are older still: Airport Drive-In (6201 Hollister, closed 1986), Santa Barbara Twin Drive-In (907 S. Kellogg, closed 1991).",
  }),
  N({
    id: "devereux",
    short: "DEV",
    label: "Devereux Slough",
    tier: "official",
    layer: "iv",
    kind: "lake",
    lon: -119.8758,
    lat: 34.424,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "The seasonal estuary by Coal Oil Point and the West Campus bluffs — birding, surfing, and the walk between Isla Vista and the point.",
  }),

  /* ---- Santa Barbara & the pass -------------------------------------- */
  N({
    id: "bills-bus",
    short: "BUS",
    label: "Bill's Bus — the downtown run",
    tier: "official",
    layer: "sb",
    kind: "bus",
    lon: -119.7049,
    lat: 34.4234,
    era: [2001.6, 2004.6],
    dateLabel: "founded 1991 · ~25,000 riders/yr",
    note:
      "Bill Singer's IV-to-downtown shuttle — $7 plus a $1 gas surcharge, buses every Tue/Thu/Fri/Sat night, the last one leaving State Street at 2 a.m. The LA Times profiled it May 19, 2003. 'Bill's bus downtown' is period-perfect for 2001–04.",
  }),
  N({
    id: "arlington",
    short: "ARL",
    label: "The Arlington — downtown State Street",
    tier: "official",
    layer: "sb",
    kind: "theater",
    lon: -119.7057,
    lat: 34.4248,
    era: [2001.6, 2004.6],
    dateLabel: "1317 State St",
    note:
      "The Mission Revival movie palace at 1317 State Street (1929), the anchor of the downtown run. The remembered club stops — Fountain Blue / Fountain Bleu, the graduate-lounge bar off Hollister — stay memory-tier until a source pins them.",
  }),
  N({
    id: "lizards-mouth",
    short: "LIZARD",
    label: "Lizard's Mouth — full moon gatherings",
    tier: "community",
    layer: "sb",
    kind: "rock",
    lon: -119.7945,
    lat: 34.5205,
    era: [2001.6, 2004.6],
    dateLabel: "West Camino Cielo",
    note:
      "The sandstone fin on West Camino Cielo with the Pacific on one side and the whole county on the other — the classic full-moon gathering spot for UCSB students. The gatherings are community knowledge; attendance is memory.",
  }),
  N({
    id: "knapps-castle",
    short: "KNAPP",
    label: "Knapp's Castle",
    tier: "official",
    layer: "sb",
    kind: "ruin",
    lon: -119.7686,
    lat: 34.5083,
    era: [2001.6, 2004.6],
    dateLabel: "built 1916 · burned 1940",
    note:
      "George Knapp's mountain lodge on East Camino Cielo above Santa Barbara; the 1940 fire left the stone arches that frame sunsets over Lake Cachuma.",
  }),
  N({
    id: "cold-spring",
    short: "CST",
    label: "Cold Spring Tavern — the stagecoach stop",
    tier: "official",
    layer: "sb",
    kind: "tavern",
    lon: -119.7466,
    lat: 34.4881,
    era: [2001.6, 2004.6],
    dateLabel: "stage relay from 1868",
    note:
      "The Wells Fargo-era stagecoach relay on Stagecoach Road off Highway 154 — cold spring, tri-tip, live music, and the 19th century preserved in pitch. 'Wells Fargo stage coach stop' is exactly what it was.",
  }),
  N({
    id: "shooting-range",
    short: "RANGE",
    label: "The shooting range",
    tier: "memory",
    layer: "sb",
    kind: "range",
    lon: -119.752,
    lat: 34.483,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004",
    note:
      "Remembered range time in the San Marcos Pass country — unlocated in the public record so far, memory tier.",
  }),
  N({
    id: "hope-ranch",
    short: "HOPE",
    label: "Hope Ranch",
    tier: "official",
    layer: "sb",
    kind: "ranch",
    lon: -119.756,
    lat: 34.409,
    era: [2001.6, 2004.6],
    dateLabel: "west of Santa Barbara",
    note:
      "The old rancho-turned-private-enclave west of town — the named edge of the remembered Santa Barbara orbit (Kyle and Rhonda Zekanis, DJ Headshot and the rest stay in the private notes, not the published tier).",
  }),

  /* ---- Cachuma & retreats -------------------------------------------- */
  N({
    id: "lake-cachuma",
    short: "CACH",
    label: "Lake Cachuma — the leadership retreat",
    tier: "official",
    layer: "sb",
    kind: "lake",
    lon: -119.987,
    lat: 34.586,
    era: [2001.6, 2004.6],
    dateLabel: "Highway 154",
    note:
      "The reservoir behind Bradbury Dam, up the pass from Santa Barbara. The leadership retreat with Magaly is remembered 'across from Lake Cachuma' — memory tier for the event, official for the water.",
  }),
  N({
    id: "live-oak-renfaire",
    short: "RENF",
    label: "Renaissance faire — Live Oak Camp",
    tier: "official",
    layer: "sb",
    kind: "tent",
    lon: -119.946,
    lat: 34.548,
    era: [2001.6, 2004.6],
    dateLabel: "by Rancho San Marcos golf course",
    note:
      "Live Oak Camp: the county's 40-acre group camp on the Santa Ynez River, reservation-only, sharing its entrance road with Rancho San Marcos golf course — 'the Renaissance fair at the golf course, across from Lake Cachuma.' The faire role and Magaly are memory; the camp and its geography are public record.",
  }),

  /* ---- Amgen / GMR ---------------------------------------------------- */
  N({
    id: "gmr-turn",
    short: "GMR",
    label: "Amgen Tour — left turn onto Glendora Mountain Road",
    tier: "official",
    layer: "amgen",
    kind: "flag",
    lon: -117.86,
    lat: 34.16,
    era: [2006.1, 2019.5],
    dateLabel: "race era 2006–2019",
    note:
      "AEG's Tour of California (inaugural edition February 2006). The 2019 Ontario-to-Mt.-Baldy stage ran the outskirts of Glendora and turned left onto GMR toward the summit finish. The race corridor is public; the 1803 house-front bike staging stays a separate memory pip.",
  }),
  N({
    id: "mt-baldy",
    short: "BALDY",
    label: "Mt. Baldy summit finish",
    tier: "official",
    layer: "amgen",
    kind: "peak",
    lon: -117.6464,
    lat: 34.2887,
    era: [2006.1, 2019.5],
    dateLabel: "10,064 ft",
    note:
      "Mt. San Antonio, the San Gabriels' high point — the summit finish above GMR. The bike-tour chapter of the book picks up here; the Dalton Race 4Dwm viewer carries the canyon detail.",
  }),
  N({
    id: "house-1803",
    short: "1803",
    label: "1803 — house-front bike staging",
    tier: "memory",
    layer: "amgen",
    kind: "house",
    lon: -117.8328,
    lat: 34.1574,
    era: [2015, 2019.5],
    dateLabel: "race days (memory)",
    note:
      "Local-only: during the race's Glendora years, the bikes were parked in front of the 1803 house a couple of times. Public records align with a 1934, 1,405 sq ft two-bedroom profile at the address; the staging claim stays private until separately corroborated.",
  }),
];

/* -------------------------------------------------------------- corridors */

export const CORRIDORS = [
  {
    id: "us101",
    layer: "roads",
    tier: "context",
    label: "US-101 — the Glendora→Goleta commute spine",
    depthM: 0,
    path: [
      [-117.8656, 34.1278], // Glendora edge of the valley run
      [-117.9, 34.09],
      [-118.15, 34.05],
      [-118.45, 34.2],
      [-118.7, 34.25],
      [-119.05, 34.26],
      [-119.3, 34.28],
      [-119.51, 34.39],
      [-119.72, 34.4],
      [-119.85, 34.43],
    ],
  },
  {
    id: "hwy154",
    layer: "roads",
    tier: "context",
    label: "Highway 154 — San Marcos Pass to Cachuma",
    depthM: 0,
    path: [
      [-119.72, 34.42],
      [-119.748, 34.48],
      [-119.79, 34.52],
      [-119.88, 34.56],
      [-119.946, 34.548],
      [-119.987, 34.586],
    ],
  },
  {
    id: "bills-bus-route",
    layer: "roads",
    tier: "community",
    label: "Bill's Bus — Isla Vista to State Street",
    depthM: 0,
    path: [
      [-119.865, 34.4135],
      [-119.88, 34.428],
      [-119.85, 34.44],
      [-119.78, 34.435],
      [-119.72, 34.428],
      [-119.7049, 34.4234],
    ],
  },
  {
    id: "hollister-strip",
    layer: "iv",
    tier: "context",
    label: "Hollister Avenue — the Goleta movie strip",
    depthM: 0,
    path: [
      [-119.8877, 34.435], // Cinema Twin, 6050 Hollister
      [-119.867, 34.4348], // Camino Real Marketplace
      [-119.85, 34.43],
      [-119.82, 34.424],
      [-119.8, 34.416],
    ],
  },
  {
    id: "san-nicolas-dlg",
    layer: "ucsb",
    tier: "memory",
    label: "The freshman loop — San Nicolas → DLG → Davidson",
    depthM: 0,
    path: [
      [-119.858, 34.4155],
      [-119.8513, 34.4134],
      [-119.8495, 34.413],
      [-119.8443, 34.414],
    ],
  },
  {
    id: "gmr-amgen",
    layer: "amgen",
    tier: "official",
    label: "2019 Amgen stage — Glendora to Mt. Baldy via GMR",
    depthM: 0,
    path: [
      [-117.907, 34.128], // Azusa / Hwy 39
      [-117.88, 34.15],
      [-117.86, 34.16], // the left turn onto GMR
      [-117.87, 34.2],
      [-117.85, 34.26],
      [-117.75, 34.29],
      [-117.68, 34.27],
      [-117.6464, 34.2887], // summit finish
    ],
  },
  {
    id: "esgvrop-commute",
    layer: "esgvrop",
    tier: "memory",
    label: "The summer commute — Glendora to Del Norte & Sunflower",
    depthM: 0,
    path: [
      [-117.8355, 34.1343], // GHS / Glendora
      [-117.8465, 34.1133], // Sunflower campus
      [-117.9, 34.09],
      [-117.9372, 34.0766], // Del Norte campus
    ],
  },
];

/* -------------------------------------------------------------- timeline */

/**
 * Master timeline — chronological, the anti-shuffle device for the book.
 * `sort` is a fractional year used by the scrubber; entries may point at a
 * node (fly-to) or stand alone. Tier is the evidence class of the row.
 */
export const TIMELINE = [
  { sort: 1999.79, date: "Oct 1999", tier: "official", nodeId: "ivtv", text: "IVTV's first episode airs — the Isla Vista chronicle begins." },
  { sort: 2000.75, date: "Oct–Nov 2000", tier: "memory", nodeId: "app-fee", text: "UC applications filed for four campuses — UCSB, UCLA, UCSC, UCSD. $50 and a life story each (memory)." },
  { sort: 2001.05, date: "Feb 2001", tier: "official", nodeId: "dlg", text: "Jack Johnson's Brushfire Fairytales — 'Bubble Toes' — is released with the D.L.G. lunch and the tar-ball lines." },
  { sort: 2001.12, date: "Feb 23, 2001", tier: "official", nodeId: "ivtv", text: "The Sabado Tarde crash — IVTV's later footage of the aftermath would be played at the Attias trial (May 2002)." },
  { sort: 2001.37, date: "May 23, 2001", tier: "official", nodeId: "ivtv", text: "Daily Nexus: IVTV episode stalled over content, then aired after review." },
  { sort: 2001.42, date: "Spring 2001", tier: "memory", nodeId: "ucsb-admit", text: "Decisions: declined at UCSC and UCLA, accepted at UCSD and UCSB. UCSB it is." },
  { sort: 2001.44, date: "Jun 2001", tier: "memory", nodeId: "ghs", text: "Glendora High School graduation — Class of 2001." },
  { sort: 2001.45, date: "Jun 2001", tier: "official", nodeId: "esgvrop-delnorte", text: "Summer job begins at ESGVROP — Del Norte Campus, West Covina — for Ryan Quesenberry, Project Facilitator-Technology." },
  { sort: 2001.5, date: "Summer 2001", tier: "memory", nodeId: "glendora-library", text: "Working for Quesenberry, who had previously run the computer lab at the Glendora library; lunches together." },
  { sort: 2001.5, date: "Summer 2001", tier: "context", nodeId: "camp-williams", text: "The Camp Williams country — East Fork, Azusa Canyon — as the summer's escape valve." },
  { sort: 2001.65, date: "Aug 24, 2001", tier: "official", nodeId: "camino-real-cinemas", text: "Jay and Silent Bob Strike Back opens in theaters." },
  { sort: 2001.69, date: "Sept 2001", tier: "memory", nodeId: "camino-real-cinemas", text: "Movie night off Hollister in Goleta — two weeks before the quarter. The Grad bar landmark, the drive-in memories." },
  { sort: 2001.7, date: "Sept 11, 2001", tier: "official", nodeId: null, text: "September 11 attacks — the world context the quarter opened under." },
  { sort: 2001.71, date: "Sun Sept 16, 2001", tier: "official", nodeId: "gold", text: "Fall Quarter 2001 begins. Convocation Monday Sept 17, 2–6 p.m.; pre-instructional events through Friday Sept 21." },
  { sort: 2001.72, date: "Sept 2001", tier: "memory", nodeId: "anacapa", text: "Move-in: beds assembled more than once — first Anacapa, then San Nicolas for the year." },
  { sort: 2001.73, date: "Mon Sept 24, 2001", tier: "official", nodeId: "catalog-cs", text: "Instruction begins. First quarter: the catalog, the prerequisites, GOLD, the bookstore line." },
  { sort: 2001.75, date: "Sept–Oct 2001", tier: "memory", nodeId: "satellite-repro", text: "Course readers and copies — Satellite Reprographics in Isla Vista (unlocated in sources so far)." },
  { sort: 2001.79, date: "Oct 2, 2001", tier: "official", nodeId: "esgvrop-sunflower", text: "esgvrop.org captured by the Wayback Machine — the E-Campus weekly of that exact week; the two-campus register on the public record." },
  { sort: 2001.79, date: "Oct 2001", tier: "official", nodeId: "monarch-grove", text: "Monarchs arrive at Ellwood for the winter — as they had since the 1920s." },
  { sort: 2001.8, date: "Oct 14, 2001", tier: "official", nodeId: "jcreator", text: "JCreator LE 2.5.0 ships — the IDE of the remembered trailer-classroom software drills." },
  { sort: 2001.83, date: "Nov 2001", tier: "memory", nodeId: "san-nicolas", text: "First-quarter dorm life: Slurpee runs, the commons open but no candy, DLG sandwiches, tar-ball walks, IVTV Wednesdays." },
  { sort: 2001.88, date: "Nov 12, 2001", tier: "official", nodeId: null, text: "Veterans Day holiday — the quarter's first long weekend." },
  { sort: 2001.93, date: "Dec 5, 2001", tier: "official", nodeId: null, text: "Fall instruction ends; finals Dec 7–14; the first quarter closes Dec 14." },
  { sort: 2002.0, date: "2001–02", tier: "memory", nodeId: "davidson-mil", text: "The century plant blooms while on shift at the Map & Imagery Lab (memory; agave Americana blooms once after 10–25 years)." },
  { sort: 2002.1, date: "2001–02", tier: "official", nodeId: "los-ingenieros", text: "Los Ingenieros named UCSB Student Organization of the Year. NSBE and the engineering-society orbit." },
  { sort: 2002.35, date: "May 3, 2002", tier: "official", nodeId: "ivtv", text: "Daily Nexus: D.A. plays IVTV footage at the Attias trial." },
  { sort: 2001.6, date: "2001–04", tier: "context", nodeId: "coal-oil-point", text: "The recurring scene-set: Coal Oil Point seeps, Platform Holly offshore, tar on the beaches — monitored by UCSB teams 2001–03." },
  { sort: 2002.5, date: "2001–04", tier: "memory", nodeId: "bills-bus", text: "Bill's Bus downtown nights — the Arlington, Fountain Blue (memory), State Street." },
  { sort: 2002.6, date: "2001–04", tier: "memory", nodeId: "lizards-mouth", text: "Full-moon gatherings at Lizard's Mouth; Knapp's Castle sunsets; Cold Spring Tavern; the shooting range; Hope Ranch." },
  { sort: 2002.7, date: "2001–04", tier: "memory", nodeId: "live-oak-renfaire", text: "Renaissance faire at the golf course — Live Oak Camp by Rancho San Marcos, across from Lake Cachuma; the leadership retreat with Magaly." },
  { sort: 2006.1, date: "Feb 2006", tier: "official", nodeId: "gmr-turn", text: "The Amgen Tour of California runs its first edition — the bike-race chapter of the Glendora years opens." },
  { sort: 2019.37, date: "2019", tier: "official", nodeId: "mt-baldy", text: "The Ontario-to-Mt.-Baldy Amgen stage through Glendora and up GMR — the race corridor this stage carries." },
];

/* ----------------------------------------------------------------- views */

/**
 * Camera views. `anchor` is a list of node ids whose centroid is the orbit
 * target; `off` is the camera offset from that target (dx, dy, dz).
 */
export const VIEWS = [
  {
    id: "transect",
    label: "VIEW · GLENDORA→GOLETA TRANSECT",
    anchor: ["ghs", "ucsb-admit"],
    off: [9.5, 17, 16],
    note: "The whole 2001 arc: high school, ROP job, and the university, on one stage.",
  },
  {
    id: "glendora",
    label: "VIEW · GLENDORA 2001",
    anchor: ["ghs"],
    off: [5.2, 4.6, 6.4],
    note: "Graduation, the library lab, Sunflower Avenue, and the canyon country above town.",
  },
  {
    id: "esgvrop",
    label: "VIEW · ESGVROP CAMPUSES",
    anchor: ["esgvrop-delnorte", "esgvrop-sunflower"],
    off: [3.6, 3.6, 5.2],
    note: "Del Norte in West Covina and Sunflower in Glendora — the two campuses of the first boss.",
  },
  {
    id: "ucsb",
    label: "VIEW · UCSB FIRST QUARTER",
    anchor: ["davidson-mil", "san-nicolas", "dlg"],
    off: [3.9, 3.4, 5.4],
    note: "The halls, the commons, the library and the MIL, GOLD territory, the lagoon.",
  },
  {
    id: "iv",
    label: "VIEW · ISLA VISTA & GOLETA",
    anchor: ["iv-embarcadero", "monarch-grove"],
    off: [3.4, 3.2, 5.0],
    note: "Embarcadero, Del Playa, the movie strip on Hollister, the monarch grove, the seeps.",
  },
  {
    id: "sb",
    label: "VIEW · SANTA BARBARA & THE PASS",
    anchor: ["arlington", "lake-cachuma"],
    off: [3.4, 8.2, 12.5],
    note: "Downtown, Hope Ranch, and Highway 154 up to Lizard's Mouth, Knapp's Castle and Cachuma.",
  },
  {
    id: "amgen",
    label: "VIEW · AMGEN GMR CORRIDOR",
    anchor: ["gmr-turn", "mt-baldy"],
    off: [4.4, 6.0, 7.2],
    note: "Where the book left off: the race corridor from Glendora up GMR to the Baldy summit finish.",
  },
];

export const TIME_MIN = 1999.5;
export const TIME_MAX = 2020.0;
export const DEFAULT_TIME = 2001.75;
