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
  { id: "fires", label: "Historical fires · WIFIRE/FRAP register", color: "#ff6a3d", on: true, era: [1990, 2018] },
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
      "1600 E Foothill Blvd, Glendora. OSM way 51207355, GNIS 271311. The diploma year that anchors the 2001 turning point — see the Glendora High 4Dwm viewer for the campus model. Commencements are held at Citrus College Stadium (the school's documented practice, 2011–2026); the exact June 2001 date remains unverified.",
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
    short: "$40",
    label: "Four applications, $40 and a life story each",
    tier: "official",
    layer: "apps",
    kind: "memory",
    lon: -118.2,
    lat: 34.05,
    era: [2000.75, 2000.95],
    dateLabel: "Oct–Nov 2000 filing period",
    note:
      "The fee is on the record now: $40 per campus — $160 for the four (UCSB, UCLA, UCSC, UCSD) — per UC PATHWAYS' own fee schedule for fall-2001 applicants (Wayback capture, Feb 2001); the remembered '$50' corrected. Paper filing period Oct 1–Nov 30, 2000; the PATHWAYS online application closed Dec 2, 2000. Fee waivers covered up to four campuses. The life-story essays stay memory-tier.",
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
      "The freshman-year hall. On the 2001–02 register (UCSB Housing, Oct 2001 capture): one of six co-ed university-owned halls — with San Miguel, Santa Rosa, Anacapa, Santa Cruz and San Rafael — 2,600 spaces; double occupancy $7,984, single $8,899 with unlimited meals; live-in RD/ARD, RAs, RCCs (Resident Computer Coordinators), APAs and MAPs; ResNet Ethernet in the rooms. Freshmen were assigned by lottery to a university-owned or university-affiliated hall. The paperwork hunt — move-in records, the RA, 'the daily flush' — stays open, so residence itself lives in the memory tier. The author's register of the year (October 2026): first floor.",
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
    era: [2001.6, 2005.7],
    dateLabel: "2001–2005",
    note:
      "The MIL, first floor north of Davidson Library — one of the country's largest map, aerial and GIS collections. The resume's student-programmer post: Alexandria Digital Library work under Greg Janée — and its second library post, Student Programmer II, June–September 2005, two floors up in Special Collections under Performing Arts Collection curator David Seubert: the wax-cylinder recordings served to the Pegasus catalog by Library-of-Congress-approved Z39.50. The post lands exactly on the archive's autumn-2005 public launch, and the resume's 'mentioned in an Article in Time Magazine' is now verified — TIME, June 16, 2008, '50 Best Websites of 2008,' per the archive's own press register (with the Wall Street Journal, February 13, 2006, and the Daily Nexus, January 20, 2006, in the era). Recollection: the century plant bloomed while on shift here. Agave americana blooms once after 10–25 years, a stalk up to 8 inches a day — but no dated public record of that particular bloom has surfaced, so the bloom stays memory-tier.",
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
      "UCSB's student-run station, broadcasting from Storke Tower — the 175-ft carillon campanile that also houses the Daily Nexus and La Cumbre beneath it. The remembered listening runs alongside the LA talk dial: Marc Germain as 'Mr. KABC' on KABC 790 (1997–2007), earlier 'Mr. KFI' on KFI 640 (1993–96). The memory-list 'store tower' is resolved as Storke Tower.",
  }),
  N({
    id: "storke-tower",
    short: "STORKE",
    label: "Storke Tower — the 'store tower' of the memory list",
    tier: "official",
    layer: "ucsb",
    kind: "tower",
    lon: -119.8484,
    lat: 34.4126,
    era: [1969.7, 2026],
    dateLabel: "dedicated Sept 28, 1969",
    note:
      "The 'store tower' of the memory list, resolved as Storke Tower: the 175-foot Brutalist carillon tower (Clark & Morgan), tallest structure in southern Santa Barbara County, dedicated September 28, 1969 and named for Thomas More Storke. Beneath it, the Storke Student Communications building houses the Daily Nexus, KCSB 91.9 and the La Cumbre yearbook; the 61-bell carillon plays 'Let There Be Light' at ten minutes to the hour. The rappelling off the tower during a Military Science course — UCSB's Army ROTC Surfrider Battalion, whose lower-division Basic Course carried no military obligation — is the author's memory; the enrollment would show in the author's own GOLD records.",
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
      "The UCSB SHPE/MAES chapter, founded in 1978 by eight Latino engineering students. It won UCSB Student Organization of the Year for 2001–02 — the subject's first year on campus — and partners with the National Society of Black Engineers at UCSB (NSBE-UCSB, founded in the 1970s under the MESA program; NSBE national was founded 1975 at Purdue). Membership and the Cachuma leadership retreat are recollection; the organizations and their record are public.",
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
    id: "fountainbleu",
    short: "FTBLEU",
    label: "Fontainebleu Apartments — 6525 El Colegio",
    tier: "official",
    layer: "iv",
    kind: "house",
    lon: -119.8625,
    lat: 34.4147,
    era: [1958, 2010.5],
    dateLabel: "1950s women's housing · 'Fountain Blue'",
    note:
      "The 'Fountain Blue / Fountain Bleu' of the memory list, resolved: one of the three apartment complexes (with Tropicana Gardens and Westgate) that UCSB's Dean of Students had a Los Angeles developer build for female students in the late 1950s — security entrances, pools, cafeterias, a beauty parlor. The Annex at 811 Camino Pescadero was the Fontainebleu Annex. In 2010 Tropicana Gardens bought the complex; it is now Tropicana Del Norte, the Annex now 'Villas at Tropicana.' Era-primary confirmation: UCSB Housing's own site (captured Dec 2001/Jan 2002) listed Fontainebleu as one of three university-affiliated residence halls — 430 spaces, Main (255) and Annex (175), 4–5-person suites with full meal service in the Main; 2001–02 rates $7,665 double to $8,875 single with unlimited meals. Attendance in the era: memory tier.",
  }),
  N({
    id: "tiki-house",
    short: "TIKI",
    label: "Tiki House — 6589 Del Playa",
    tier: "community",
    layer: "iv",
    kind: "house",
    lon: -119.868,
    lat: 34.4105,
    era: [1950, 2020],
    dateLabel: "the Del Playa party house",
    note:
      "Documented on LocalWiki Isla Vista: the house at 6589 Del Playa, ocean side, known for parties — county assessor dates it to 1928 (lore says 1905). In 2012 it was moved 30 feet back from the eroding bluff. The remembered Tiki House nights stay private memory.",
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
    id: "grad-hollister",
    short: "GRAD?",
    label: "The Grad bar off Hollister — graduate student lounge",
    tier: "memory",
    layer: "iv",
    kind: "house",
    lon: -119.885,
    lat: 34.4345,
    era: [2001.6, 2004.6],
    dateLabel: "2001–2004 (unlocated)",
    note:
      "Remembered: a Grad bar off Hollister in Goleta with a graduate student lounge. No public record of a Hollister-side Graduate has surfaced — the documented Graduate bar ran in the Embarcadero Hall building in Isla Vista (see the Embarcadero node) — so this one stays memory-tier, pinned schematically on the Hollister strip.",
  }),
  N({
    id: "lizards-mouth",
    short: "LIZARD",
    label: "Lizard's Mouth — the full-moon gathering ground",
    tier: "community",
    layer: "sb",
    kind: "rock",
    lon: -119.7945,
    lat: 34.5205,
    era: [2001.6, 2004.6],
    dateLabel: "West Camino Cielo",
    note:
      "The sandstone fin on West Camino Cielo — the classic full-moon gathering spot above the coast. The gatherings were the Word of Mouth full moons (see that node); attendance is memory.",
  }),
  N({
    id: "word-of-mouth",
    short: "WOM",
    label: "Word of Mouth — the full-moon gathering crew",
    tier: "community",
    layer: "sb",
    kind: "tent",
    lon: -119.785,
    lat: 34.523,
    era: [1998, 2005],
    dateLabel: "Santa Barbara mountains, 1990s–2000s",
    note:
      "The 'Word of Mouth' of the memory list, resolved: the Santa Barbara mountains full-moon gathering crew. DJ Unagi's Resident Advisor biography credits his start to 'his sets at the Word of Mouth Full Moon gatherings' in the Santa Barbara mountains; Santa Barbara locals on Reddit still ask after 'the old word of mouth parties' ('still around but not throwing parties anymore'). Pin schematic — the gatherings moved around the mountains; Lizard's Mouth country is the remembered ground.",
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
    short: "GLASS",
    label: "The Glass Factory — East Camino Cielo shooting area",
    tier: "official",
    layer: "sb",
    kind: "range",
    lon: -119.752,
    lat: 34.503,
    era: [1990, 2018.2],
    dateLabel: "designated shooting area · closed 2018",
    note:
      "The remembered 'shooting range' in the pass country, resolved: the Glass Factory, the designated target-shooting area on East Camino Cielo off Highway 154 in the Los Padres National Forest (formally the Arroyo Burro designated shooting area) — popular with generations of shooters, closed by the Forest Service in 2018 and again by fire-risk bans. The private Winchester Canyon Gun Club (6622 W. Camino Cielo) is the managed range nearby. Which one the era's trips used stays memory.",
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
      "Live Oak Camp: the county's 40-acre group camp on the Santa Ynez River, reservation-only, sharing its entrance road with Rancho San Marcos golf course — 'the Renaissance fair at the golf course, across from Lake Cachuma.' The faire roles are on the author's public resume — “Rat Races” referee for Friends of the Paramount Ranch (wonderful wood-plated golden medallions to the winners, in character, period dress) and “Humble Servant” with Renaissance Entertainment Productions' fencing guild at Glen Helen, Devore; the leadership retreat with Magaly stays private.",
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
  /* ---- added October 2026: halls, parks, employers, rails, deep history, fires -- */
  N({
    id: "san-rafael",
    short: "SAN RAF",
    label: "San Rafael Hall — the summer stay (memory)",
    tier: "memory",
    layer: "ucsb",
    kind: "dorm",
    lon: -119.868,
    lat: 34.4135,
    era: [2001.4, 2002.8],
    dateLabel: "built 1967 · summer stay (memory)",
    note:
      "Residence Hall #6 — Charles Luckman Associates, circa 1967 — UCSB's first co-educational residence hall, at the campus's western edge adjacent to Isla Vista, with Carrillo as its dining commons on the 2002–03 register (schematic pin). The author's summer stay — a bedroom and a Kmart futon ('just futons and bars, it folds out of metal pipe'), construction running on the adjacent Manzanita Village, completed for its Fall 2002 opening, and a roommate who ran Costco for the summer and played loud music — is memory tier.",
  }),
  N({
    id: "iv-disc-golf",
    short: "DISC",
    label: "Isla Vista Peace Course — the frisbee golf course",
    tier: "community",
    layer: "iv",
    kind: "park",
    lon: -119.8631,
    lat: 34.4134,
    era: [2000.4, 2026],
    dateLabel: "built 2000 · Ed Headrick",
    note:
      "The frisbee golf course of the memory list, resolved: Isla Vista's disc golf course was built in 2000 with 'Steady' Ed Headrick — the father of disc golf — who came to Isla Vista to design it with the Isla Vista Recreation and Park District. Nine holes, 100–250 ft, threading Estero Park (889 Camino del Sur; OSM node 6070196516), the Sueño Orchard and Tipi Village — 'from Hwy 101, exit Storke Rd., south toward ocean/UCSB' — right off the interchange. The Bottom Line profiled it in 2017. Attendance is memory.",
  }),
  N({
    id: "evergreen-disc-golf",
    short: "EVERG",
    label: "Evergreen Open Space — 18 disc golf holes",
    tier: "community",
    layer: "iv",
    kind: "park",
    lon: -119.885,
    lat: 34.4395,
    era: [2000, 2026],
    dateLabel: "Goleta's 18-hole course",
    note:
      "The area's other course, also off the 101's Glen Annie/Storke interchange: Evergreen Open Space west of Goleta — 18 holes, 'good variety of open long holes and tightly wooded ones,' free to play, with a regular Goleta following on UDisc (schematic pin; first tee near the path to the tennis courts). Which course the era's rounds ran — the Peace Course, Evergreen, or both — is memory.",
  }),
  N({
    id: "sealtight",
    short: "SEAL",
    label: "Sealtight Fastener — 5370 Hollister Ave",
    tier: "official",
    layer: "iv",
    kind: "work",
    lon: -119.8118,
    lat: 34.4353,
    era: [1990, 2026],
    dateLabel: "est. 1990 · President Larry Bogatz",
    note:
      "'Sealtightfastener' of the memory list, resolved: Sealtight Fastener, a bolts-nuts-screws-rivets-washers manufacturer established 1990 at 5370 Hollister Avenue #2, Santa Barbara / Goleta (OSM node 13167977938; ~28 employees), its president Larry Bogatz — the remembered 'Larry boats.' Bogatz is also the author of 'The Theory of Reality: Change Your Life and Live Your Dream' (Xlibris, November 2003, ISBN 978-1413422764). The author's public resume lists the role: website designer — the “Flash and HTML redesign.” The site is preserved (sealtightfastener.com — singular, the plural-domain check was the earlier miss; 90 Wayback captures 2003–2025; December 2003 reads “No web site is configured at this address,” so the redesign follows). The archived applications page carries the Mars claim in the company's own copy — “Product applications range from the Mars Rovers & Space Shuttles to Environmental Enclosures and Sheet Metal Products” — beside an Aerospace page of Space Shuttle, Various Missile Cases, Space Probes and Space Telescopes, and MS3212/MS3213 fasteners “used and trusted by the United States Armed Forces.” “Phoenix” is not named in the captures. The footer: B&B Hardware, Inc., 5370 Hollister #2, ©1990–2004; no MacroJump credit appears anywhere on the site.",
  }),
  N({
    id: "yardi",
    short: "YARDI",
    label: "Yardi Systems — 430 S. Fairview Ave, Goleta",
    tier: "official",
    layer: "iv",
    kind: "work",
    lon: -119.8284,
    lat: 34.4333,
    era: [1984, 2026],
    dateLabel: "founded 1984 · Anant Yardi",
    note:
      "The global real-estate software company founded 1984 by Anant Yardi, headquartered at 430 South Fairview Avenue, Goleta (OSM node 6070156225) — the landmark the remembered 'Grad bar' sat in front of. James Beane — 'James Beane at Yardi Systems' on the memory list — is publicly indexed there: Senior Manager, Cloud Services, 23+ years at Yardi, Santa Barbara. No Yardi role appears on the author's public resume — a landmark of the Hollister corridor, not an employer.",
  }),
  N({
    id: "montys-bar",
    short: "MONTYS",
    label: "Monty's — 5114 Hollister (the 'Grad bar' candidate)",
    tier: "community",
    layer: "iv",
    kind: "bar",
    lon: -119.8029,
    lat: 34.4355,
    era: [1974, 2026],
    dateLabel: "bar since the 1970s · now No Town Tavern",
    note:
      "A bar on this site for about fifty years — Monty's / Monty's Sports Bar (montyssportsbar.com), closed 2021, now the No Town Tavern (OSM node 1469690940) — on the Hollister airport corridor, 0.9 km east of Sealtight Fastener (5370 Hollister) and in the Yardi (430 S Fairview) corridor. The leading candidate for the remembered 'Grad bar' — 'right in front of Yardi, down the street from Larry Bogatz,' with a graduate student lounge — per the author's October 2026 clarification; confirmation pending. The graduate-student-lounge detail stays memory tier.",
  }),
  N({
    id: "pss",
    short: "PSS",
    label: "Particle Sizing Systems — 75 Aero Camino",
    tier: "official",
    layer: "iv",
    kind: "work",
    lon: -119.849,
    lat: 34.4351,
    era: [1978, 2026],
    dateLabel: "founded 1978 · Nicomp / AccuSizer",
    note:
      "Particle Sizing Systems — designer and manufacturer of particle-sizing instruments at 75 Aero Camino, Suite B (OSM way 658342264): the Nicomp 380/DLS submicron sizer (dynamic light scattering, 0.003–5 microns) and the AccuSizer 780/SPOS single-particle optical sizer. Founded 1978; acquired by Agilent Technologies in 2008, later an Entegris company. President David Nicoli (Harvard 1966–73). The author's website work for PSS — with Gavriel Popper Keiser, under the MacroJump name — is memory tier; his public resume lists the client role as IT Computer Support (AUTOCAD backup and server specifications for a new system) and marks PSS “no longer a client, absorbed by Channel Data Systems” — which sits beside, unresolved, the public record of the 2008 Agilent acquisition. pssnicomp.com is preserved in the Wayback Machine (340 captures, 1998–2026); macrojump.com itself holds only hosting placeholders (2010–2025).",
  }),
  N({
    id: "goleta-amtrak",
    short: "AMTRAK",
    label: "Goleta station & the Surfliner — the train home",
    tier: "official",
    layer: "iv",
    kind: "rail",
    lon: -119.8423,
    lat: 34.4378,
    era: [1998.7, 2026],
    dateLabel: "platform opened Sept 20, 1998",
    note:
      "The Pacific Surfliner era (the San Diegan extended to Santa Barbara in 1988, rebranded 2000) with the Goleta platform opened September 20, 1998 — the original 1901 Goleta depot sits a half-mile away in the South Coast Railroad Museum at Lake Los Carneros, moved there in 1981 (OSM node 9642170470 marks the station point). The Amtrak Thruway Motorcoach connection served the UCSB campus from the train stations — 'sometimes a transfer to the Amtrak bus,' per the author's memory of the rides.",
  }),
  N({
    id: "pow-camp",
    short: "POW 44",
    label: "German POW camp — Edwards Ranch, 1944–45",
    tier: "official",
    layer: "sb",
    kind: "history",
    lon: -119.96,
    lat: 34.459,
    era: [1944.8, 1945.95],
    dateLabel: "Oct 1944 – Dec 1945",
    note:
      "The Goleta Prisoner of War Branch Camp on the Edwards Ranch at Gatos Canyon, beside Highway 101 about nine miles west of Goleta — a branch of Camp Cooke (now Vandenberg) activated October 20, 1944, holding roughly 250 German prisoners, most of them professional men from Rommel's elite Afrika Korps: six guard towers, fourteen Nissen/Quonset huts, and a water tower whose weathered frame is the last visible sign, still standing south of the 101 between El Capitan Ranch Road and Rancho Dos Pueblos. The POWs picked lemons, packed walnuts at the Goleta Walnut Exchange on Kellogg Avenue, and were paid in coupons for the camp store; the camp closed December 1945 and the huts burned in 1970. Italian POWs from Camp Cooke were brought into town for meals at Mom's Italian Village (schematic pin on the Gaviota coast).",
  }),
  N({
    id: "mcas-goleta",
    short: "MCAS",
    label: "Marine Corps Air Station Santa Barbara — 1942",
    tier: "official",
    layer: "iv",
    kind: "history",
    lon: -119.8431,
    lat: 34.4274,
    era: [1942.9, 1946],
    dateLabel: "commissioned Dec 4, 1942",
    note:
      "The airport's war chapter: the U.S. Marines arrived in 1942 and commissioned Marine Corps Air Station Santa Barbara on December 4, 1942 — nicknamed 'The Swamp' for the marshy slough, built round-the-clock after the February 1942 Japanese shelling of Ellwood, peaking at roughly 500 officers, 3,100 enlisted men and 440 women Marines. It trained carrier-attack squadrons for the Pacific; when the Marines left, the field became today's Santa Barbara Municipal Airport (OSM relation 9044579) and the surplus barracks on Goleta Point became the first UCSB campus — the airport and the university are both direct results of the base. The 1931 General Western hangars (Buildings 248/249) survive as historic resources.",
  }),
  /* ---- historical fires · WIFIRE Commons / CAL FIRE FRAP register ------- */
  N({
    id: "painted-cave-fire",
    short: "1990",
    label: "Painted Cave Fire — June 27–28, 1990",
    tier: "official",
    layer: "fires",
    kind: "fire",
    lon: -119.775,
    lat: 34.476,
    era: [1990.49, 1990.55],
    dateLabel: "June 27–28, 1990",
    note:
      "Started near the Painted Cave community on San Marcos Pass at 6:02 p.m. June 27, 1990, and raced downslope under sundowner winds — five miles to the sea in two hours, jumping the 101 — to the edge of Hope Ranch: roughly 4,900 acres, 440 homes and 28 apartment complexes destroyed, one civilian death. Arson, never solved. One of the first wildland-urban-interface fires studied for structure survivability (schematic pin at the origin).",
  }),
  N({
    id: "williams-fire",
    short: "2002",
    label: "Williams Fire — September 2002",
    tier: "official",
    layer: "fires",
    kind: "fire",
    lon: -117.855,
    lat: 34.285,
    era: [2002.72, 2002.76],
    dateLabel: "Sept 22 – Oct 1, 2002",
    note:
      "Ignited near Camp Williams in the Angeles National Forest north of Glendora on Sunday, September 22, 2002; burned 38,094 acres of the San Gabriel high country before containment October 1 — the third-largest California fire of the 2002 season, destroying dozens of cabins at a $15 million suppression cost. The home-mountains fire of the UCSB years (schematic pin near the origin).",
  }),
  N({
    id: "gap-fire",
    short: "2008",
    label: "Gap Fire — July 2008",
    tier: "official",
    layer: "fires",
    kind: "fire",
    lon: -119.87,
    lat: 34.49,
    era: [2008.5, 2008.6],
    dateLabel: "July 2008",
    note:
      "Just under 10,000 acres in the mountains above Goleta on the West Camino Cielo ridge — the Lizard's Mouth and Glass Factory country of the full-moon era — with Goleta's agriculture belt serving as the buffer that saved the city. Part of the extraordinary 2008 Santa Barbara fire year (schematic pin above Goleta).",
  }),
  N({
    id: "tea-fire",
    short: "2008",
    label: "Tea Fire — November 13–14, 2008",
    tier: "official",
    layer: "fires",
    kind: "fire",
    lon: -119.65,
    lat: 34.44,
    era: [2008.87, 2008.9],
    dateLabel: "Nov 13–14, 2008",
    note:
      "1,940 acres and 210 homes destroyed in a single burn period: an illegal bonfire in the old Tea Gardens of a long-abandoned Montecito estate reignited on the evening of November 13 under one of the strongest sundowner events in recent memory — gusts to 85 mph (schematic pin in the Montecito hills).",
  }),
  N({
    id: "jesusita-fire",
    short: "2009",
    label: "Jesusita Fire — May 5–18, 2009",
    tier: "official",
    layer: "fires",
    kind: "fire",
    lon: -119.716,
    lat: 34.467,
    era: [2009.35, 2009.4],
    dateLabel: "May 5–18, 2009",
    note:
      "Started along the Jesusita Trail below Cathedral Peak on Cinco de Mayo 2009 — too remote for crews to reach before a sundowner pushed it into Mission and Rattlesnake Canyons: 8,733 acres, 80 homes and 79 outbuildings destroyed, called the county's worst disaster in 25 years (schematic pin in the trailhead country).",
  }),
  N({
    id: "station-fire",
    short: "2009",
    label: "Station Fire — August–October 2009",
    tier: "official",
    layer: "fires",
    kind: "fire",
    lon: -118.05,
    lat: 34.26,
    era: [2009.65, 2009.85],
    dateLabel: "Aug 26 – Oct 16, 2009",
    note:
      "160,577 acres — the largest fire in the recorded history of the Angeles National Forest: from the La Cañada foothills across the San Gabriel front country above Glendora, destroying 209 structures including 89 homes and killing firefighters Tedmund Hall and Arnaldo Quinones at Camp 16. The wildfire activity behind the book's NIFC/WIFIRE thread (schematic pin in the front country).",
  }),
  N({
    id: "thomas-fire",
    short: "2017",
    label: "Thomas Fire — December 2017",
    tier: "official",
    layer: "fires",
    kind: "fire",
    lon: -119.07,
    lat: 34.37,
    era: [2017.92, 2018.05],
    dateLabel: "Dec 2017 – Jan 2018",
    note:
      "281,893 acres from its origin near Santa Paula across Ventura and into Santa Barbara County to Carpinteria — the largest wildfire in California history at the time — followed on January 9, 2018 by the Montecito debris flows that killed 21. The closing event of the fire register's span (schematic pin near the origin).",
  }),
  N({
    id: "channel-data-systems",
    short: "CDS",
    label: "Channel Data Systems — 4141 State St",
    tier: "official",
    layer: "sb",
    kind: "work",
    lon: -119.7613,
    lat: 34.4398,
    era: [2004.5, 2005.0],
    dateLabel: "Jul–Dec 2004 · Computer Shop Manager",
    note:
      "'Santa Barbara's IT Resource' — network administration, repair and upgrades, data recovery, custom-built computers and servers at 4141 State Street #A-2, El Mercado Plaza (OSM node 6070217352; 805-964-6695). The author's public resume: Computer Shop Manager, July–December 2004 — mileage log for field work, opening and closing the store, scheduling repair, customer RMA through the secretary including billing, storefront stocked, building and branding OEM software and hardware with the company logo, Intel Corporation Channel Partner Wi-Max laptops. The shop that 'absorbed' the author's Sealtight and Particle Sizing Systems clients.",
  }),
  N({
    id: "novacoast",
    short: "NOVA",
    label: "Novacoast — 1505 Chapala St",
    tier: "official",
    layer: "sb",
    kind: "work",
    lon: -119.7101,
    lat: 34.4251,
    era: [2004.9, 2005.2],
    dateLabel: "Dec 2004–Feb 2005 · Programmer",
    note:
      "The Santa Barbara IT-services and cybersecurity company — BBB file opened August 1997, business started May 1999 — at 1505 Chapala Street (OSM node 6070274782). The author's public resume: Programmer, December 2004–February 2005 — 'create preliminary framework for proprietary programming language used in office for new product.'",
  }),
  N({
    id: "crm-security",
    short: "CRM",
    label: "CRM Security — crmsecurity.com (schematic)",
    tier: "official",
    layer: "apps",
    kind: "systems",
    lon: -119.86,
    lat: 34.413,
    era: [2003.8, 2004.2],
    dateLabel: "by Jan 2004 · telephony project",
    schematic: true,
    note:
      "The resume's Projects register: a schematic coupling a physical phone line to the computer through an audio transformer to speaker and mic jacks — headset interaction for JSP-served clients, DTMF tones played onto the line for automatic dialing. crmsecurity.com is preserved in the Wayback Machine, capture of January 31, 2004. Pin schematic — a project, not a place.",
  }),
  N({
    id: "dhammakaya",
    short: "DIMC",
    label: "Dhammakaya Int'l Meditation Center — Azusa (schematic)",
    tier: "official",
    layer: "esgvrop",
    kind: "org",
    lon: -117.89,
    lat: 34.13,
    era: [2006.0, 2007.9],
    dateLabel: "2006–07 · ordained 2007",
    schematic: true,
    note:
      "The resume's monastic register: volunteer 2006–2007 — traveling between monasteries to build assembly for Vesak (dates in the Thai lunar calendar), teaching basic yoga to lay persons, ordination set-up; ordained 2007 — 'Venerable' — the study of precepts and the English translation of the Tripiṭaka. See also peacepointmeditation.org and dhammakayacentral.com. Pin schematic at Azusa (dimc.net).",
  }),
  N({
    id: "sgv-examiner",
    short: "SGVE",
    label: "San Gabriel Valley Examiner — Glendora (schematic)",
    tier: "official",
    layer: "esgvrop",
    kind: "press",
    lon: -117.875,
    lat: 34.137,
    era: [2011.5, 2013.1],
    dateLabel: "Jul 2011–Jan 2013 · on payroll",
    schematic: true,
    note:
      "The weekly foothill newspaper whose office sat next to the Naked Juice factory in Glendora. The author's public resume: on payroll July 2011–January 2013 — collating newspapers, cleaning the office, delivery of the weekly from the in-house printing press, OSHA standards near heavy machinery — promoted to Gardener. Pin schematic near the Foothill Boulevard office corridor.",
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
  { sort: 1942.95, date: "Dec 4, 1942", tier: "official", nodeId: "mcas-goleta", text: "Marine Corps Air Station Santa Barbara commissioned on the Goleta airfield — the base that becomes both the airport and, on the point, UCSB." },
  { sort: 1944.8, date: "Oct 20, 1944", tier: "official", nodeId: "pow-camp", text: "The German POW branch camp activates on the Edwards Ranch — 250 of Rommel's Afrika Korps picking lemons and packing walnuts until December 1945." },
  { sort: 1990.49, date: "June 27–28, 1990", tier: "official", nodeId: "painted-cave-fire", text: "Painted Cave Fire: ~4,900 acres from the San Marcos Pass downslope across the 101 to Hope Ranch — 440+ homes lost, arson unsolved." },
  { sort: 1999.79, date: "Oct 1999", tier: "official", nodeId: "ivtv", text: "IVTV's first episode airs — the Isla Vista chronicle begins." },
  { sort: 2000.4, date: "2000", tier: "community", nodeId: "iv-disc-golf", text: "Isla Vista's disc golf course is built with 'Steady' Ed Headrick, the father of disc golf — Estero Park, right off the Storke Road interchange." },
  { sort: 2000.75, date: "Oct–Nov 2000", tier: "official", nodeId: "app-fee", text: "UC applications filed for four campuses — UCSB, UCLA, UCSC, UCSD — at $40 each, $160 total (UC PATHWAYS fee schedule; the remembered $50 corrected)." },
  { sort: 2001.05, date: "Feb 2001", tier: "official", nodeId: "dlg", text: "Jack Johnson's Brushfire Fairytales — 'Bubble Toes' — is released with the D.L.G. lunch and the tar-ball lines." },
  { sort: 2001.12, date: "Feb 23, 2001", tier: "official", nodeId: "ivtv", text: "The Sabado Tarde crash — IVTV's later footage of the aftermath would be played at the Attias trial (May 2002)." },
  { sort: 2001.37, date: "May 23, 2001", tier: "official", nodeId: "ivtv", text: "Daily Nexus: IVTV episode stalled over content, then aired after review." },
  { sort: 2001.42, date: "Spring 2001", tier: "memory", nodeId: "ucsb-admit", text: "Decisions: declined at UCSC and UCLA, accepted at UCSD and UCSB. UCSB it is." },
  { sort: 2001.44, date: "Jun 2001", tier: "memory", nodeId: "ghs", text: "Glendora High School graduation — Class of 2001; commencement at Citrus College Stadium per the school's long-standing practice (exact 2001 date unverified)." },
  { sort: 2001.45, date: "Jun 2001", tier: "official", nodeId: "esgvrop-delnorte", text: "Summer job begins at ESGVROP — Del Norte Campus, West Covina — for Ryan Quesenberry, Project Facilitator-Technology." },
  { sort: 2001.5, date: "Summer 2001", tier: "memory", nodeId: "glendora-library", text: "Working for Quesenberry, who had previously run the computer lab at the Glendora library; lunches together." },
  { sort: 2001.5, date: "Summer 2001", tier: "context", nodeId: "camp-williams", text: "The Camp Williams country — East Fork, Azusa Canyon — as the summer's escape valve." },
  { sort: 2001.6, date: "2001–04", tier: "context", nodeId: "coal-oil-point", text: "The recurring scene-set: Coal Oil Point seeps, Platform Holly offshore, tar on the beaches — monitored by UCSB teams 2001–03." },
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
  { sort: 2001.9, date: "2001–04", tier: "memory", nodeId: "iv-disc-golf", text: "Frisbee golf rounds 'right off the interchange' — the Peace Course and Evergreen Open Space (attendance memory)." },
  { sort: 2001.93, date: "Dec 5, 2001", tier: "official", nodeId: null, text: "Fall instruction ends; finals Dec 7–14; the first quarter closes Dec 14." },
  { sort: 2002.0, date: "2001–02", tier: "memory", nodeId: "davidson-mil", text: "The century plant blooms while on shift at the Map & Imagery Lab (memory; agave Americana blooms once after 10–25 years)." },
  { sort: 2002.1, date: "2001–02", tier: "official", nodeId: "los-ingenieros", text: "Los Ingenieros named UCSB Student Organization of the Year. NSBE and the engineering-society orbit." },
  { sort: 2002.15, date: "2001–05", tier: "memory", nodeId: "storke-tower", text: "Rappel off Storke Tower during a Military Science course — Army ROTC's tower, the 175-ft carillon above KCSB and the Daily Nexus (memory; course year unrecorded)." },
  { sort: 2002.35, date: "May 3, 2002", tier: "official", nodeId: "ivtv", text: "Daily Nexus: D.A. plays IVTV footage at the Attias trial." },
  { sort: 2002.5, date: "2001–04", tier: "context", nodeId: "bills-bus", text: "Bill's Bus downtown nights — the Arlington (1317 State St), State Street, and the Isla Vista addresses: Fontainebleu (6525 El Colegio), its Annex (811 Camino Pescadero), the Tiki House (6589 Del Playa)." },
  { sort: 2002.6, date: "2001–04", tier: "community", nodeId: "word-of-mouth", text: "Word of Mouth full-moon gatherings in the Santa Barbara mountains — Lizard's Mouth country; DJ Unagi's public bio credits his start to those sets." },
  { sort: 2002.65, date: "2001–04", tier: "official", nodeId: "shooting-range", text: "The Glass Factory shooting area on East Camino Cielo; Knapp's Castle sunsets; Cold Spring Tavern — the Wells Fargo-era stagecoach stop; Hope Ranch on the west side." },
  { sort: 2002.7, date: "2001–04", tier: "memory", nodeId: "live-oak-renfaire", text: "Renaissance faire at the golf course — Live Oak Camp by Rancho San Marcos, across from Lake Cachuma; the leadership retreat with Magaly." },
  { sort: 2002.72, date: "Sept 22–Oct 1, 2002", tier: "official", nodeId: "williams-fire", text: "Williams Fire: 38,094 acres from Camp Williams through the San Gabriel high country north of Glendora — the home-mountains fire of the UCSB years." },
  { sort: 2003.5, date: "circa 2002–04 (undated)", tier: "official", nodeId: "davidson-mil", text: "Student Programmer, Alexandria Digital Library — JSP interface and Perl utilities over the Map & Imagery Lab's terabytes of airphoto data (undated on the resume; slotted into the UCSB years)." },
  { sort: 2003.8, date: "circa 2003–04", tier: "official", nodeId: "pss", text: "IT Computer Support for Particle Sizing Systems — AUTOCAD backup and server specifications for a new system; the client later 'absorbed by Channel Data Systems' (the author's public resume)." },
  { sort: 2004.08, date: "by Jan 2004", tier: "official", nodeId: "crm-security", text: "The CRM Security project — a phone line coupled to the computer through an audio transformer: headset interaction for JSP-served clients and DTMF tones for automatic dialing; preserved in the Wayback Machine 31 January 2004." },
  { sort: 2004.5, date: "circa 2004–05", tier: "official", nodeId: "sealtight", text: "The Sealtight Fastener website — the author's Flash + HTML redesign (his public resume); the archived copy carries 'Mars Rovers & Space Shuttles' in its applications text and a B&B Hardware footer, ©1990–2004." },
  { sort: 2004.54, date: "Jul–Dec 2004", tier: "official", nodeId: "channel-data-systems", text: "Computer Shop Manager at Channel Data Systems, 4141 State Street (El Mercado Plaza) — opening and closing, repair scheduling, RMA billing, OEM branding, Intel Channel Partner Wi-Max laptops." },
  { sort: 2004.96, date: "Dec 2004–Feb 2005", tier: "official", nodeId: "novacoast", text: "Programmer at Novacoast, 1505 Chapala Street — a preliminary framework for the office's proprietary language for a new product." },
  { sort: 2005.46, date: "Jun–Sep 2005", tier: "official", nodeId: "davidson-mil", text: "Student Programmer II — Davidson Library Special Collections: the wax-cylinder recordings indexed by Z39.50 into the Pegasus catalog; 'mentioned in an Article in Time Magazine' (the resume)." },
  { sort: 2005.75, date: "autumn 2005", tier: "official", nodeId: "davidson-mil", text: "The Cylinder Preservation and Digitization Project launches publicly — 5,000 recordings online; the Wall Street Journal covers it February 13, 2006, and TIME names it one of the 50 Best Websites of 2008." },
  { sort: 2006.0, date: "2006–07", tier: "official", nodeId: "dhammakaya", text: "Volunteer at Dhammakaya International Meditation Center, Azusa — Vesak set-up and basic yoga instruction; ordained 2007 ('Venerable'), the precepts and the Tripiṭaka." },
  { sort: 2006.1, date: "Feb 2006", tier: "official", nodeId: "gmr-turn", text: "The Amgen Tour of California runs its first edition — the bike-race chapter of the Glendora years opens." },
  { sort: 2008.5, date: "July 2008", tier: "official", nodeId: "gap-fire", text: "Gap Fire: just under 10,000 acres on West Camino Cielo above Goleta — the Lizard's Mouth / Glass Factory country." },
  { sort: 2008.87, date: "Nov 13–14, 2008", tier: "official", nodeId: "tea-fire", text: "Tea Fire: 1,940 acres, 210 homes lost in Montecito under 85-mph sundowners." },
  { sort: 2009.35, date: "May 5–18, 2009", tier: "official", nodeId: "jesusita-fire", text: "Jesusita Fire: 8,733 acres from the Jesusita Trail into Mission and Rattlesnake Canyons — 80 homes lost." },
  { sort: 2009.66, date: "Aug 26–Oct 16, 2009", tier: "official", nodeId: "station-fire", text: "Station Fire: 160,577 acres across the Angeles front country above Glendora — the largest in the forest's recorded history." },
  { sort: 2011.54, date: "Jul 2011–Jan 2013", tier: "official", nodeId: "sgv-examiner", text: "On payroll at the San Gabriel Valley Examiner — collating the weekly, cleaning, delivery from the in-house press, OSHA compliance near the machinery; promoted to Gardener." },
  { sort: 2017.92, date: "Dec 2017", tier: "official", nodeId: "thomas-fire", text: "Thomas Fire: 281,893 acres — then the largest in California history — into Santa Barbara County; the Montecito debris flows follow in January." },
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

export const TIME_MIN = 1942.0;
export const TIME_MAX = 2020.0;
export const DEFAULT_TIME = 2001.75;

