/**
 * js/four-corners-data.js — FOUR CORNERS 4Dwm data pack.
 *
 * One plate, four states: the AZ / CO / NM / UT quadripoint country —
 * Navajo volcanic field necks, the San Juan energy basin, the uranium
 * legacy ring, and the Ancestral Puebloan core (Mesa Verde / Chaco /
 * Hovenweep / Canyon de Chelly).
 *
 * Modeled after the socal-subsurface theater: same evidence-tier
 * discipline, same single-plate local equirectangular projection
 * (1 scene unit = 10 km), same PiP/dossier interaction grammar.
 *
 * Evidence tiers:
 *   official  — NPS/BLM/DOE-LM/USGS/agency or operator published fact
 *   community — well-documented secondary sourcing
 *   context   — schematic/approximate only; always labelled
 *
 * Gazetteer rows are a curated seed register in the ADL GCS entry model
 * (names set + point footprint + GNIS feature-class classification),
 * matching docs/socal-usgs-gazetteer.md. FEATURE_IDs are NOT pinned yet,
 * so every row is community/curated tier by construction — none carries
 * an invented id. Sync hooks for the socal register live in
 * scripts/sync-gazetteer.mjs's folded-name conventions.
 */

export const META = {
  title: "FOUR CORNERS 4Dwm",
  subtitle: "Quadripoint country · volcanic necks · San Juan energy basin · Ancestral Puebloan core — schematic, not a survey",
  center: { lon: -109.0452, lat: 36.9990 }, // the monument
  bbox: { lon0: -110.60, lon1: -107.80, lat0: 35.80, lat1: 37.90 },
  quadripoint: {
    lon: -109.045172, lat: 36.998976,
    note: "Four Corners Monument quadripoint (NAD83 36°59′56.3″N 109°02′42.6″W). The surveyed point is legally final even though it sits a few hundred meters from the 'ideal' 37°N / 32°W-of-Washington intersection.",
  },
  unitsPerKm: 0.1,
};

/* -------------------------------------------------------------- layers -- */

export const LAYERS = [
  { id: "terrain", name: "Terrain · curated control-point relief", color: "#9a8f7d", kind: "terrain", on: true },
  { id: "borders", name: "State lines + quadripoint", color: "#e8d9a0", kind: "line", on: true },
  { id: "rivers", name: "San Juan River corridor", color: "#5cb8ff", kind: "line", on: true },
  { id: "gaz", name: "GNIS gazetteer · curated register", color: "#b8c7d1", kind: "node", on: true },
  { id: "necks", name: "Navajo volcanic field necks", color: "#d98a6a", kind: "node", on: true },
  { id: "energy", name: "Energy · coal, gas, oil, CO₂", color: "#ffb020", kind: "node", on: true },
  { id: "uranium", name: "Uranium legacy · UMTRA + mill", color: "#b5e061", kind: "node", on: true },
  { id: "ruins", name: "Ancestral Puebloan core", color: "#ff6ec7", kind: "node", on: true },
];

/* ------------------------------------------------------------- borders -- */
/* Schematic: the legal lines are the surveyed lines through the monument,
 * not the nominal 37°N / -109.0452°. Drawn through the monument values. */

export const BORDERS = {
  quadLon: -109.045172,
  quadLat: 36.998976,
  states: [
    { id: "az", name: "ARIZONA", labelAt: { lon: -109.9, lat: 36.25 }, tint: "#7a4a3a" },
    { id: "nm", name: "NEW MEXICO", labelAt: { lon: -108.25, lat: 36.25 }, tint: "#8a6a3a" },
    { id: "co", name: "COLORADO", labelAt: { lon: -108.25, lat: 37.55 }, tint: "#4a6a4a" },
    { id: "ut", name: "UTAH", labelAt: { lon: -109.9, lat: 37.55 }, tint: "#9a5a4a" },
  ],
};

/* San Juan River — approximate corridor polyline (context tier), upstream
 * (Farmington NM) to downstream (toward Lake Powell). */
export const SAN_JUAN_RIVER = [
  [-107.95, 36.72], [-108.22, 36.72], [-108.47, 36.76], [-108.69, 36.78],
  [-108.87, 36.90], [-109.05, 36.92], [-109.27, 37.00], [-109.43, 37.11],
  [-109.55, 37.28], [-109.73, 37.23], [-109.86, 37.15], [-109.93, 37.17],
  [-110.10, 37.10], [-110.30, 37.14], [-110.47, 37.17],
];

/* ----------------------------------------------------------- gazetteer -- */
/* Curated seed register, ADL GCS triple per row:
 * [name, fclass, ftt, state, lat, lon, elevM|null, note|null]
 * No FEATURE_IDs pinned — never invented. */

export const GAZETTEER = [
  ["Four Corners Monument", "Locale", "pop.locale", "AZ/CO/NM/UT", 36.998976, -109.045172, 1510, "the only US quadripoint; Navajo Nation tribal park"],
  ["Shiprock", "Summit", "phys.summit", "NM", 36.6875, -108.8365, 2187, "Tsé Bitʼaʼí, 'rock with wings' — the flagship minette neck"],
  ["Shiprock", "Populated Place", "pop.ppl", "NM", 36.7856, -108.6870, 1496, "largest Navajo Nation chapter town"],
  ["Farmington", "Populated Place", "pop.ppl", "NM", 36.7281, -108.2187, 1644, "San Juan Basin energy hub"],
  ["Aztec", "Populated Place", "pop.ppl", "NM", 36.8222, -107.9928, 1719, null],
  ["Cortez", "Populated Place", "pop.ppl", "CO", 37.3489, -108.5859, 1884, null],
  ["Dolores", "Populated Place", "pop.ppl", "CO", 37.4747, -108.4967, 2109, null],
  ["Mancos", "Populated Place", "pop.ppl", "CO", 37.3450, -108.2890, 2124, null],
  ["Dove Creek", "Populated Place", "pop.ppl", "CO", 37.7661, -108.9062, 2078, "pinto-bean capital on the Great Sage Plain"],
  ["Durango", "Populated Place", "pop.ppl", "CO", 37.2753, -107.8801, 1988, "theater's east edge"],
  ["Towaoc", "Populated Place", "pop.ppl", "CO", 37.2044, -108.7298, 1764, "Ute Mountain Ute Tribe seat"],
  ["Kayenta", "Populated Place", "pop.ppl", "AZ", 36.7278, -110.2545, 1716, null],
  ["Teec Nos Pos", "Populated Place", "pop.ppl", "AZ", 36.9256, -109.0929, 1620, "the chapter at the monument's doorstep"],
  ["Dennehotso", "Populated Place", "pop.ppl", "AZ", 36.8458, -109.8534, 1524, null],
  ["Mexican Water", "Populated Place", "pop.ppl", "AZ", 36.9633, -109.3187, 1500, null],
  ["Red Mesa", "Populated Place", "pop.ppl", "AZ", 36.9594, -109.2437, 1554, null],
  ["Lukachukai", "Populated Place", "pop.ppl", "AZ", 36.4164, -109.2287, 1951, null],
  ["Round Rock", "Populated Place", "pop.ppl", "AZ", 36.5086, -109.4651, 1760, null],
  ["Beclabito", "Populated Place", "pop.ppl", "NM", 36.8333, -109.0167, 1609, null],
  ["Bluff", "Populated Place", "pop.ppl", "UT", 37.2847, -109.5518, 1315, "1880 Hole-in-the-Rock settlement"],
  ["Mexican Hat", "Populated Place", "pop.ppl", "UT", 37.1514, -109.8568, 1268, "named for the sombrero rock across the river"],
  ["Montezuma Creek", "Populated Place", "pop.ppl", "UT", 37.2669, -109.3065, 1341, null],
  ["Aneth", "Populated Place", "pop.ppl", "UT", 37.2158, -109.1840, 1372, null],
  ["Blanding", "Populated Place", "pop.ppl", "UT", 37.6244, -109.4793, 1860, null],
  ["Monticello", "Populated Place", "pop.ppl", "UT", 37.8714, -109.3429, 2156, "theater's north edge"],
  ["Monument Valley", "Valley", "phys.valley", "AZ/UT", 36.9830, -110.1120, 1580, "Tsé Biiʼ Ndzisgaii; Navajo Tribal Park"],
  ["Valley of the Gods", "Valley", "phys.valley", "UT", 37.2333, -109.8333, 1340, "Cedar Mesa sandstone monolith floor"],
  ["Goosenecks of the San Juan", "Locale", "pop.locale", "UT", 37.1744, -109.9268, 1510, "entrenched meanders, ~300 m deep"],
  ["Comb Ridge", "Ridge", "phys.ridge", "UT/AZ", 37.1000, -109.6500, 1700, "130 km monocline sawtooth"],
  ["The Hogback", "Ridge", "phys.ridge", "NM", 36.7200, -108.5500, 1600, "monocline that named the first oil field"],
  ["Sleeping Ute Mountain", "Summit", "phys.summit", "CO", 37.2842, -108.7742, 2993, "Ute Mountain; laccolithic range"],
  ["Abajo Peak", "Summit", "phys.summit", "UT", 37.8403, -109.4595, 3463, "Abajo (Blue) Mountains high point"],
  ["Bears Ears", "Summit", "phys.summit", "UT", 37.6294, -109.8669, 2702, "twin buttes of the national monument"],
  ["Pastora Peak", "Summit", "phys.summit", "AZ", 36.7919, -109.1444, 2869, "Carrizo Mountains high point"],
  ["Roof Butte", "Summit", "phys.summit", "AZ", 36.4617, -109.0919, 2996, "Chuska crest; highest point on the Navajo Nation north half"],
  ["Chuska Mountains", "Range", "phys.range", "NM/AZ", 36.2000, -108.9000, 2750, "sandstone highland along the state line"],
  ["Carrizo Mountains", "Range", "phys.range", "AZ", 36.8000, -109.0800, 2600, "laccolithic dome SW of the monument"],
  ["Mesa Verde", "Summit", "phys.summit", "CO", 37.1839, -108.4886, 2600, "the great cuesta; park row lives in ruins layer"],
  ["Agathla Peak", "Pillar", "phys.pillar", "AZ", 36.8261, -110.2039, 2157, "El Capitan; minette neck north of Kayenta"],
  ["Alhambra Rock", "Pillar", "phys.pillar", "UT", 37.1086, -109.8555, 1450, "minette dike cluster near Mexican Hat"],
  ["Mitten Rock", "Pillar", "phys.pillar", "NM", 36.6903, -108.9664, 1890, "neck pair west of Shiprock"],
  ["East Mitten Butte", "Pillar", "phys.pillar", "AZ", 36.9890, -110.0948, 1860, "Monument Valley's postcard pair, with the West Mitten"],
  ["San Juan River", "Stream", "hydro.stream", "NM/CO/UT", 37.0000, -109.0500, 1480, "corridor plotted as a polyline; this row anchors the name"],
  ["Animas River", "Stream", "hydro.stream", "NM", 36.7200, -108.2000, 1620, "mouth at Farmington plotted"],
  ["Mancos River", "Stream", "hydro.stream", "NM/CO", 36.9900, -108.8600, 1480, "mouth at the San Juan plotted"],
  ["McElmo Creek", "Stream", "hydro.stream", "UT/CO", 37.2186, -109.1870, 1370, "mouth near Aneth plotted"],
  ["Chinle Wash", "Stream", "hydro.stream", "AZ/UT", 37.2100, -109.7200, 1310, "mouth at the San Juan plotted"],
];

/* --------------------------------------------------------------- sites -- */

const S = (id, layer, tier, name, lon, lat, extra = {}) => ({ id, layer, tier, name, lon, lat, ...extra });

export const SITES = [
  /* ---- Navajo volcanic field necks (geology dossiers) ---- */
  S("neck-shiprock", "necks", "community", "Shiprock neck + dike swarm", -108.8365, 36.6875, {
    elevM: 2187, kind: "volcanic neck",
    story: [
      "Eroded minette diatreme of the ~30–25 Ma Navajo volcanic field; three radial dikes, the south one a wall you can drive along.",
      "Sacred to the Diné as Tsé Bitʼaʼí; climbing has been prohibited since 1970.",
    ],
    sources: [["USGS/NPS Navajo volcanic field summaries", "https://www.usgs.gov/volcanoes"], ["Navajo Nation Parks", "https://navajonationparks.org/"]],
  }),
  S("neck-agathla", "necks", "community", "Agathla Peak (El Capitan)", -110.2039, 36.8261, {
    elevM: 2157, kind: "volcanic neck",
    story: ["Minette neck guarding the south approach to Monument Valley; Kit Carson-era landmark name."],
    sources: [["Navajo volcanic field literature", "https://www.usgs.gov/volcanoes"]],
  }),
  S("neck-alhambra", "necks", "community", "Alhambra Rock", -109.8555, 37.1086, {
    elevM: 1450, kind: "minette dikes",
    story: ["Jagged dike cluster beside the Mexican Hat road; the field's northern outpost."],
    sources: [["Navajo volcanic field literature", "https://www.usgs.gov/volcanoes"]],
  }),
  S("neck-mitten", "necks", "community", "Mitten Rock + Barber Peak", -108.9664, 36.6903, {
    elevM: 1890, kind: "volcanic neck",
    story: ["Neck-and-dike pair on the Red Rock Highway west of Shiprock; smaller sibling of the big neck."],
    sources: [["Navajo volcanic field literature", "https://www.usgs.gov/volcanoes"]],
  }),

  /* ---- Energy: San Juan Basin coal / gas / oil / CO₂ ---- */
  S("fcpp", "energy", "official", "Four Corners Power Plant", -108.4817, 36.6889, {
    elevM: 1630, kind: "coal plant · APS",
    story: [
      "1963 mine-mouth coal station on Navajo Nation land at Morgan Lake; units 4–5 (~1,540 MW) remain after units 1–3 retired in 2013.",
      "APS and the co-owners have announced closure by 2031 — the end of big coal in the basin.",
    ],
    sources: [["APS — Four Corners Power Plant", "https://www.aps.com/en/About/Our-Company/Power-Plants"], ["EIA plant data", "https://www.eia.gov/electricity/"]],
  }),
  S("navajo-mine", "energy", "official", "Navajo Mine (NTEC)", -108.4522, 36.5519, {
    elevM: 1650, kind: "surface coal mine",
    story: [
      "Strip mine on Navajo Nation land feeding Four Corners Power Plant since 1963; owned since 2013 by the Navajo Transitional Energy Company.",
    ],
    sources: [["NTEC", "https://navenergy.com/"]],
  }),
  S("sjgs", "energy", "official", "San Juan Generating Station (demolished)", -108.4428, 36.8028, {
    elevM: 1670, kind: "retired coal plant",
    story: [
      "PNM's 1,848 MW flagship ran 1973–2022; retired 2022-09-30, stacks and boilers imploded in 2024 demolition.",
      "Carbon-capture conversion proposals (Enchant Energy) did not close; the site is in decommissioning.",
    ],
    sources: [["PNM San Juan closure materials", "https://www.pnm.com/"], ["Farmington Daily Times demolition reporting", "https://www.daily-times.com/"]],
  }),
  S("san-juan-mine", "energy", "official", "San Juan Mine (closed)", -108.5042, 36.7922, {
    elevM: 1700, kind: "underground coal mine",
    story: ["Underground longwall that fed SJGS across the fence; ceased coal production with the plant in 2022."],
    sources: [["MSHA mine data", "https://www.msha.gov/"]],
  }),
  S("hogback-field", "energy", "community", "Hogback oil field (1922)", -108.5500, 36.7500, {
    elevM: 1590, kind: "historic oil field",
    story: ["New Mexico's first commercial oil came in on the Hogback monocline in 1922 — the San Juan Basin's discovery story, a year before the state's southeast took over."],
    sources: [["EMNRD / NM Bureau of Geology petroleum history", "https://geoinfo.nmt.edu/"]],
  }),
  S("rattlesnake-field", "energy", "community", "Rattlesnake oil + helium field", -108.7800, 36.6700, {
    elevM: 1620, kind: "historic field",
    story: ["1924 Navajo-lease field southwest of Shiprock; later a strategic helium producer from the same structure."],
    sources: [["NM Bureau of Geology petroleum history", "https://geoinfo.nmt.edu/"]],
  }),
  S("aneth-field", "energy", "official", "Greater Aneth oil field", -109.2200, 37.2700, {
    elevM: 1400, depthM: -1700, kind: "oil field · Paradox Basin",
    story: [
      "Utah's largest oil field, discovered 1956 in the Pennsylvanian Paradox Formation; waterflood + CO₂ flood units under Navajo Nation Oil and Gas today.",
      "Plotted at the field centroid; the productive zone sits roughly 5,500 ft down — the depth slider reads the schematic reservoir marker.",
    ],
    sources: [["Utah Geological Survey", "https://geology.utah.gov/"], ["Navajo Nation Oil and Gas", "https://www.nnogc.com/"]],
  }),
  S("mcelmo-dome", "energy", "official", "McElmo Dome CO₂ field", -108.8000, 37.3800, {
    elevM: 1900, depthM: -2400, kind: "CO₂ field",
    story: [
      "Near-pure CO₂ in the Mississippian Leadville Limestone; anchor supply for the ~500-mile Cortez Pipeline to the Permian Basin EOR market since 1984.",
    ],
    sources: [["Kinder Morgan CO₂", "https://www.kindermorgan.com/"]],
  }),

  /* ---- Uranium legacy ring ---- */
  S("umtra-shiprock", "uranium", "official", "Shiprock UMTRA disposal site", -108.6792, 36.7789, {
    elevM: 1500, kind: "DOE-LM disposal cell",
    story: [
      "Tailings of the 1954–1968 Kerr-McGee/Vanadium Corp uranium mill, stabilized in an on-site cell above the San Juan; DOE Office of Legacy Management custody.",
    ],
    sources: [["DOE-LM Shiprock site page", "https://www.energy.gov/lm/shiprock-new-mexico-disposal-site"]],
  }),
  S("umtra-mexican-hat", "uranium", "official", "Mexican Hat UMTRA disposal site", -109.8470, 37.1236, {
    elevM: 1310, kind: "DOE-LM disposal cell",
    story: ["Disposal cell holding Mexican Hat mill tailings plus the relocated Monument Valley tailings; Halchita, on Navajo land."],
    sources: [["DOE-LM Mexican Hat site page", "https://www.energy.gov/lm/mexican-hat-utah-disposal-site"]],
  }),
  S("umtra-monument-valley", "uranium", "official", "Monument Valley processing site", -110.2306, 36.9369, {
    elevM: 1560, kind: "DOE-LM groundwater site",
    story: ["Cane Valley mill site (Monument No. 2 ore); tailings hauled to Mexican Hat 1992–94, leaving a long-running nitrate/sulfate groundwater program."],
    sources: [["DOE-LM Monument Valley site page", "https://www.energy.gov/lm/monument-valley-arizona-processing-site"]],
  }),
  S("monument-no2", "uranium", "community", "Monument No. 2 mine (Yazzie Mesa)", -110.2600, 36.9250, {
    elevM: 1700, kind: "historic V-U mine",
    story: ["The famous vanadium-uranium mesa mine that fed Cane Valley; one of the richest Salt Wash producers of the Cold War boom."],
    sources: [["AEC/USGS Colorado Plateau uranium literature", "https://pubs.usgs.gov/"]],
  }),
  S("white-mesa-mill", "uranium", "official", "White Mesa Mill", -109.4919, 37.5331, {
    elevM: 1700, kind: "operating uranium mill",
    story: [
      "Energy Fuels' 1980 mill south of Blanding — the only fully licensed, operating conventional uranium mill in the United States; also a rare-earth and vanadium processing play.",
      "The Ute Mountain Ute community of White Mesa sits 8 km south; groundwater monitoring is a standing controversy, carried here as context.",
    ],
    sources: [["Energy Fuels — White Mesa Mill", "https://www.energyfuels.com/white-mesa-mill"], ["Utah DEQ mill oversight", "https://deq.utah.gov/"]],
  }),

  /* ---- Ancestral Puebloan core ---- */
  S("mesa-verde", "ruins", "official", "Mesa Verde NP · Cliff Palace", -108.4733, 37.1675, {
    elevM: 2100, kind: "NPS · World Heritage",
    story: ["Largest cliff dwelling in North America (~150 rooms, 23 kivas), built c. 1190–1280 CE; park established 1906, UNESCO 1978."],
    sources: [["NPS Mesa Verde", "https://www.nps.gov/meve/"]],
  }),
  S("chaco", "ruins", "official", "Chaco Culture NHP · Pueblo Bonito", -107.9617, 36.0613, {
    elevM: 1860, kind: "NPS · World Heritage",
    story: [
      "Monumental great house of 650+ rooms, c. 850–1150 CE, hub of the Chacoan road and great-house network that reaches every corner of this theater.",
      "Theater's south-east tip — the Great North Road runs from here toward the San Juan.",
    ],
    sources: [["NPS Chaco Culture", "https://www.nps.gov/chcu/"]],
  }),
  S("aztec-ruins", "ruins", "official", "Aztec Ruins National Monument", -108.0003, 36.8361, {
    elevM: 1720, kind: "NPS · World Heritage",
    story: ["Chacoan outlier great house on the Animas with the reconstructed Great Kiva; the 'Aztec' name is a settler misnomer."],
    sources: [["NPS Aztec Ruins", "https://www.nps.gov/azru/"]],
  }),
  S("hovenweep", "ruins", "official", "Hovenweep National Monument", -109.0742, 37.3839, {
    elevM: 1580, kind: "NPS",
    story: ["Square Tower group and five outlying canyon-head villages on the Cajon Mesa rim, c. 1200–1300 CE."],
    sources: [["NPS Hovenweep", "https://www.nps.gov/hove/"]],
  }),
  S("canyon-de-chelly", "ruins", "official", "Canyon de Chelly · White House Ruin", -109.4664, 36.1178, {
    elevM: 1710, kind: "NPS on Navajo land",
    story: ["Cliff dwelling below the 200 m sandstone wall; the monument is jointly NPS-administered on Navajo Nation land with families still farming the canyon floor."],
    sources: [["NPS Canyon de Chelly", "https://www.nps.gov/cach/"]],
  }),
  S("salmon-ruins", "ruins", "community", "Salmon Ruins", -108.1264, 36.7625, {
    elevM: 1660, kind: "county museum site",
    story: ["Chacoan colony great house on the San Juan terrace at Bloomfield, c. 1090; run by San Juan County Museum Association."],
    sources: [["Salmon Ruins Museum", "https://www.salmonruins.com/"]],
  }),
  S("lowry-pueblo", "ruins", "official", "Lowry Pueblo · Canyons of the Ancients", -108.8640, 37.5853, {
    elevM: 2060, kind: "BLM national monument",
    story: ["Great-kiva pueblo on the Great Sage Plain inside Canyons of the Ancients NM — the densest archaeological landscape in the US."],
    sources: [["BLM Canyons of the Ancients", "https://www.blm.gov/programs/national-conservation-lands/colorado/canyons-of-the-ancients"]],
  }),
];

/* ------------------------------------------------------ terrain control -- */
/* Curated control points for the IDW relief plate: [lon, lat, elevM].
 * Context tier — a reading surface, not a DEM. */

export const TERRAIN_POINTS = [
  [-109.045, 36.999, 1510],  // monument bench
  [-108.837, 36.688, 2187],  // Shiprock neck
  [-108.774, 37.284, 2993],  // Sleeping Ute
  [-109.459, 37.840, 3463],  // Abajo Peak
  [-109.867, 37.629, 2702],  // Bears Ears
  [-109.144, 36.792, 2869],  // Pastora Peak (Carrizos)
  [-109.092, 36.462, 2996],  // Roof Butte (Chuskas)
  [-108.900, 36.100, 2750],  // Chuska crest south
  [-108.489, 37.184, 2600],  // Mesa Verde cuesta
  [-110.204, 36.826, 2157],  // Agathla
  [-110.112, 36.983, 1580],  // Monument Valley floor
  [-109.927, 37.174, 1510],  // Goosenecks rim
  [-109.857, 37.151, 1268],  // Mexican Hat (river low)
  [-109.552, 37.285, 1315],  // Bluff (river low)
  [-109.184, 37.216, 1372],  // Aneth (river low)
  [-108.687, 36.900, 1450],  // river at Mancos mouth
  [-108.219, 36.728, 1644],  // Farmington
  [-107.993, 36.822, 1719],  // Aztec
  [-107.880, 37.275, 1988],  // Durango bench
  [-107.962, 36.061, 1860],  // Chaco bench
  [-108.586, 37.349, 1884],  // Cortez / McElmo sage plain
  [-108.906, 37.766, 2078],  // Dove Creek upland
  [-109.343, 37.871, 2156],  // Monticello bench
  [-109.479, 37.624, 1860],  // Blanding bench
  [-110.255, 36.728, 1716],  // Kayenta bench
  [-109.650, 37.100, 1700],  // Comb Ridge
  [-110.470, 37.170, 1250],  // downstream San Juan low
  [-109.229, 36.416, 1951],  // Lukachukai bench
  [-108.452, 36.552, 1650],  // Navajo Mine bench
  [-110.500, 36.000, 1750],  // Black Mesa shoulder (SW corner fill)
  [-107.900, 37.800, 2600],  // La Plata shoulder (NE corner fill)
];

/* --------------------------------------------------------------- views -- */

export const VIEWS = [
  { id: "quad", label: "VIEW · QUADRIPOINT", target: [-109.0452, 36.9990], dist: 14, pitch: 48 },
  { id: "shiprock", label: "VIEW · SHIPROCK", target: [-108.8365, 36.6875], dist: 9, pitch: 35 },
  { id: "monument", label: "VIEW · MONUMENT VALLEY", target: [-110.1120, 36.9830], dist: 10, pitch: 35 },
  { id: "mesaverde", label: "VIEW · MESA VERDE / SAGE PLAIN", target: [-108.5300, 37.2500], dist: 11, pitch: 40 },
  { id: "energy", label: "VIEW · SAN JUAN ENERGY BASIN", target: [-108.4700, 36.7300], dist: 11, pitch: 42 },
  { id: "uranium", label: "VIEW · URANIUM LEGACY RING", target: [-109.6500, 37.2000], dist: 16, pitch: 50 },
  { id: "overview", label: "VIEW · FULL THEATER", target: [-109.0452, 36.9990], dist: 26, pitch: 55 },
];

export const CREDITS = [
  "Evidence tiers — official: NPS/BLM/DOE-LM/USGS/operator fact; community: well-sourced secondary; context: schematic only.",
  "Terrain is a curated control-point reading surface, not a DEM. State lines drawn through the surveyed quadripoint.",
  "Gazetteer: curated seed register in the ADL GCS entry model; FEATURE_IDs not yet pinned (none invented).",
];
