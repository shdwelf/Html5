/**
 * js/cheyenne-data.js — CHEYENNE / ANGELES 4Dwm data pack.
 *
 * Two plates, one theater:
 *   chey — the Pikes Peak massif and Cheyenne Mountain, Colorado (headline:
 *          NORAD's granite), El Paso + Teller counties
 *   ange — the San Gabriel Mountains block of the Angeles National Forest,
 *          California (mines, camps, Bridge to Nowhere), LA + San Bernardino
 *
 * Evidence tiers, enforced exactly as in the socal-subsurface theater:
 *   official  — USGS MRDS records, USFS/Colorado Parks/national-park-grade
 *               published fact, GNIS federal gazetteer coordinates
 *   community — well-documented secondary sourcing (mine-historian sites,
 *               recreation.gov detail, local history)
 *   context   — schematic/approximate only; always labelled, never blended
 *
 * Mine coordinates + status + commodities in the "mines" layers are verbatim
 * USGS Mineral Resources Data System (MRDS) records pulled live from the
 * mrdata.usgs.gov WFS on 2026-10-02 (bbox queries over each plate); each
 * dossier links show-mrds.php?dep_id=<id>. The MRDS is a point-per-record
 * index: a "mine" may be one adit or a patented claim group.
 */

import { TELLER_RING, EL_PASO_TELLER_LINE, LA_COUNTY_RING, SB_COUNTY_LINE, ANF_RING } from "./cheyenne-borders.js";

export const META = {
  title: "CHEYENNE / ANGELES 4Dwm",
  subtitle: "NORAD's granite · Angeles NF mines + camps — schematic, not a survey",
  cheyCenter: { lon: -104.85, lat: 38.85 },
  angeCenter: { lon: -117.95, lat: 34.25 },
  plateGapNote: "Plates are ~1,310 km apart in reality; scene space shows them side by side for reading, not for flying.",
};

/* -------------------------------------------------------------- layers -- */

export const LAYERS = [
  { id: "terrain", name: "Terrain · USGS 3DEP control", color: "#8a9aa8", kind: "terrain", on: true },
  { id: "politics", name: "Political relief · counties + forest", color: "#e8d9a0", kind: "line", on: true },
  { id: "gaz", name: "GNIS gazetteer · summits + valleys", color: "#b8c7d1", kind: "node", on: true },
  { id: "norad", name: "NORAD / Cheyenne Mountain Complex", color: "#ffb020", kind: "node", on: true },
  { id: "camps", name: "Campsites · ANF + Cheyenne Mtn SP", color: "#7dd87d", kind: "node", on: true },
  { id: "minesA", name: "Mines · San Gabriel Mtns / ANF (USGS MRDS)", color: "#e8e3d3", kind: "node", on: true },
  { id: "minesC", name: "Mines · Cripple Creek district (MRDS)", color: "#f0d9a8", kind: "node", on: true },
  { id: "corridor", name: "East Fork mine trail + Pikes Hwy", color: "#67e8f9", kind: "line", on: true },
];

/* -------------------------------------------------------- political ---- */

export const POLITICS = {
  chey: [
    { id: "teller", name: "Teller County", ring: TELLER_RING, kind: "county" },
    { id: "elpaso-teller", name: "El Paso / Teller county line", ring: EL_PASO_TELLER_LINE, kind: "line" },
  ],
  ange: [
    { id: "anf", name: "Angeles National Forest (proclamation)", ring: ANF_RING, kind: "forest" },
    { id: "lacounty", name: "Los Angeles County", ring: LA_COUNTY_RING, kind: "county" },
    { id: "sbcounty", name: "LA / San Bernardino county line", ring: SB_COUNTY_LINE, kind: "line" },
  ],
  labels: {
    chey: [
      { name: "EL PASO COUNTY", lon: -104.72, lat: 38.90 },
      { name: "TELLER COUNTY", lon: -105.14, lat: 38.96 },
      { name: "PIKE NATIONAL FOREST", lon: -105.05, lat: 38.73 },
      { name: "COLORADO", lon: -104.68, lat: 38.64, kind: "state" },
    ],
    ange: [
      { name: "ANGELES NATIONAL FOREST", lon: -117.99, lat: 34.39 },
      { name: "SAN GABRIEL MOUNTAINS NATIONAL MONUMENT", lon: -117.88, lat: 34.19, small: true },
      { name: "LOS ANGELES COUNTY", lon: -118.28, lat: 34.08 },
      { name: "SAN BERNARDINO COUNTY", lon: -117.62, lat: 34.44 },
      { name: "CALIFORNIA", lon: -117.62, lat: 34.01, kind: "state" },
    ],
  },
};

/* ----------------------------------------------------- gazetteer ------- */
/* USGS GNIS (federal gazetteer, carto.nationalmap.gov geonames MapServer,
 * July 2026 refresh), queried 2026-10-02 over both plate envelopes. First
 * point of each MultiPoint geometry; feature class retained. */

export const GAZETTEER = {
  chey: [
    ["Pikes Peak", -105.0449, 38.8406, "Summit"],
    ["Cheyenne Mountain", -104.8675, 38.744, "Summit"],
    ["Almagre Mountain", -104.9935, 38.7912, "Summit"],
    ["Mount Rosa", -104.948, 38.7542, "Summit"],
    ["Cameron Cone", -104.9545, 38.8315, "Summit"],
    ["Mount Garfield", -104.9475, 38.8076, "Summit"],
    ["Mount Arthur", -104.9419, 38.8094, "Summit"],
    ["Mount Cutler", -104.8775, 38.7878, "Summit"],
    ["Mount Buckhorn", -104.9031, 38.8002, "Summit"],
    ["Saint Peters Dome", -104.9115, 38.7474, "Summit"],
    ["Sugarloaf Mountain", -104.9149, 38.7333, "Summit"],
    ["Mount Vigil", -104.9221, 38.7267, "Summit"],
    ["Blodgett Peak", -104.9071, 38.9588, "Summit"],
    ["Mount Manitou", -104.9637, 38.8646, "Summit"],
    ["Copper Mountain", -105.1836, 38.7795, "Summit"],
    ["Guyot Hill", -105.1632, 38.725, "Summit"],
    ["Sachett Mountain", -105.0239, 38.8211, "Summit"],
    ["Mount Deception", -105.0526, 39.107, "Summit"],
    ["Rampart Range", -105.0158, 38.9757, "Range"],
    ["Hoosier Pass", -105.1486, 38.7539, "Gap"],
    ["Ute Pass", -105.1575, 38.9417, "Gap"],
    ["North Cheyenne Canyon", -104.8643, 38.7907, "Valley"],
    ["South Cheyenne Canyon", -104.8638, 38.7905, "Valley"],
    ["Queens Canyon", -104.8857, 38.8926, "Valley"],
    ["Garden of the Gods", -104.8792, 38.8603, "Park"],
    ["Manitou Springs", -104.9129, 38.8575, "Populated Place"],
    ["Colorado Springs", -104.8209, 38.8339, "Populated Place"],
    ["Woodland Park", -105.0594, 38.9985, "Populated Place"],
    ["Green Mountain Falls", -105.0238, 38.9344, "Populated Place"],
    ["Cascade", -104.975, 38.9086, "Populated Place"],
    ["Monument", -104.8474, 39.0728, "Populated Place"],
    ["Cripple Creek", -105.185, 38.7466, "Populated Place"],
    ["Victor", -105.1419, 38.7087, "Populated Place"],
    ["Crystal Creek Reservoir", -105.0306, 38.9162, "Reservoir"],
    ["Rampart Reservoir", -104.97, 38.9808, "Reservoir"],
    ["Fountain", -104.7005, 38.8288, "Populated Place"],
  ],
  ange: [
    ["Mount San Antonio (Old Baldy)", -117.6461, 34.2891, "Summit"],
    ["Mount Baden-Powell", -117.7646, 34.3586, "Summit"],
    ["Mount Islip", -117.8399, 34.345, "Summit"],
    ["Throop Peak", -117.7991, 34.3505, "Summit"],
    ["Mount Hawkins", -117.8056, 34.3412, "Summit"],
    ["Mount Burnham", -117.7814, 34.3592, "Summit"],
    ["Iron Mountain", -117.7133, 34.2883, "Summit"],
    ["Mount Wilson", -118.0616, 34.2237, "Summit"],
    ["San Gabriel Peak", -118.0985, 34.2433, "Summit"],
    ["Mount Disappointment", -118.1048, 34.2467, "Summit"],
    ["Occidental Peak", -118.0836, 34.235, "Summit"],
    ["Strawberry Peak", -118.1204, 34.2834, "Summit"],
    ["Josephine Peak", -118.1538, 34.2856, "Summit"],
    ["Pacifico Mountain", -118.0345, 34.3818, "Summit"],
    ["Mount Gleason", -118.1781, 34.3866, "Summit"],
    ["Vetter Mountain", -118.0286, 34.2971, "Summit"],
    ["Monrovia Peak", -117.9695, 34.2132, "Summit"],
    ["Pine Mountain", -117.6442, 34.3136, "Summit"],
    ["Dawson Peak", -117.6359, 34.3032, "Summit"],
    ["Mount Harwood", -117.633, 34.2863, "Summit"],
    ["Cucamonga Peak", -117.5853, 34.2227, "Summit"],
    ["Ross Mountain", -117.7565, 34.3247, "Summit"],
    ["Vincent Gap", -117.7523, 34.3736, "Gap"],
    ["Islip Saddle", -117.8506, 34.3569, "Gap"],
    ["Red Box Gap", -118.1051, 34.2586, "Gap"],
    ["Mill Creek Summit", -118.0809, 34.3917, "Gap"],
    ["Newcomb Pass", -118.0273, 34.2325, "Gap"],
    ["Blue Ridge", -117.6331, 34.3338, "Ridge"],
    ["San Gabriel Range", -117.95, 34.3, "Range"],
    ["Heaton Flat", -117.7631, 34.2406, "Flat"],
    ["Crystal Lake", -117.8471, 34.3188, "Lake"],
    ["San Fernando Valley", -118.287778, 34.155833, "Valley"],
    ["Azusa", -117.9076, 34.1283, "Populated Place"],
    ["San Dimas", -117.8067, 34.1067, "Populated Place"],
    ["Rancho Cucamonga", -117.5931, 34.1064, "Populated Place"],
    ["Pasadena", -118.1445, 34.1478, "Populated Place"],
    ["Acton", -118.1965, 34.469, "Populated Place"],
    ["Wrightwood", -117.5975, 34.3608, "Populated Place"],
    ["La Cañada Flintridge", -118.2002, 34.2097, "Populated Place"],
    ["Cahuenga Pass", -118.346, 34.12, "Gap"],
    ["Vasquez Rocks", -118.3336, 34.4878, "Locale"],
    ["Agua Dulce", -118.3253, 34.4964, "Populated Place"],
    ["Burbank", -118.328333, 34.180278, "Populated Place"],
    ["Phelan", -117.5725, 34.4261, "Populated Place"],
    ["Pinon Hills", -117.6453, 34.4403, "Populated Place"],
    ["San Gabriel Mountains", -117.65, 34.29, "Range"],
    ["Verdugo Mountains", -118.29, 34.21, "Range"],
    ["Mount Emma", -117.876, 34.39, "Summit"],
    ["Mount Williamson", -118.049, 34.288, "Summit"],
    ["Ontario Peak", -117.624, 34.228, "Summit"],
    ["Waterman Mountain", -117.93, 34.336, "Summit"],
    ["Littlerock", -117.9833, 34.5214, "Populated Place"],
    ["Pearblossom", -117.9103, 34.5061, "Populated Place"],
  ],
};

/* ------------------------------------------------------------ NORAD ---- */

export const FACILITIES = [
  {
    id: "norad",
    plate: "chey",
    layer: "norad",
    tier: "official",
    name: "Cheyenne Mountain Complex — NORAD",
    lon: -104.8483,
    lat: 38.7425,
    elevM: 2351,
    depthM: -610,
    kind: "norad",
    facts: [
      "Excavation began 18 May 1961 (Utah Construction & Mining Co. under the Army Corps of Engineers); the NORAD Combat Operations Center inside the mountain was declared operational 20 April 1966.",
      "Roughly 4.5 acres of chambers in Precambrian granite, ~2,000 ft below the summit: 15 freestanding steel buildings on ~1,300 shock-isolating springs, each spring ~1,000 lb.",
      "The J-shaped entrance tunnel turns so a blast wave cannot run straight in; two 25-ton blast doors can seal the complex in about 45 seconds.",
      "Designed to ride out a Cold War-scale detonation — commonly cited as ~30 megatons at a mile and a half — sealed, on internal power and reservoir water.",
      "Day-to-day aerospace warning moved to Peterson SFB in 2006; Cheyenne Mountain Complex remains the hardened alternate command center (US Space Force, Peterson-Schriever Garrison).",
      "The doors were sealed for real exactly once in the facility's history: 11 September 2001.",
    ],
    sources: [
      "NORAD / US Space Force — Cheyenne Mountain Complex official history",
      "Everything-Everywhere + Dark Atlas facility write-ups (2026)",
      "3DEP ground elevation at portal area: 2,351 m (this app's DEM)",
    ],
  },
  {
    id: "peterson",
    plate: "chey",
    layer: "norad",
    tier: "official",
    name: "Peterson SFB — NORAD / NORTHCOM headquarters",
    lon: -104.6981,
    lat: 38.8352,
    elevM: 1911,
    depthM: 0,
    kind: "mil",
    facts: [
      "The day-to-day home of both NORAD and US Northern Command since 2006, on the Colorado Springs side of the massif.",
      "Paired with Cheyenne Mountain: Peterson runs the mission, the mountain is the hardened backup.",
      "Also anchors the region's space-complex triangle: Schriever SFB east of the city, USAFA on the north rim.",
    ],
    sources: ["NORAD public affairs", "Peterson-Schriever Garrison fact sheets"],
  },
  {
    id: "usafa",
    plate: "chey",
    layer: "norad",
    tier: "official",
    name: "US Air Force Academy",
    lon: -104.8660,
    lat: 38.9980,
    elevM: 2105,
    depthM: 0,
    kind: "mil",
    facts: [
      "The cadet wing sits on the plateau north of Cheyenne Mountain; the Cadet Chapel's spires are the front-door architecture of the American Air Force.",
      "The Academy's 18,500 acres run from the plains up into the Rampart Range foothills.",
    ],
    sources: ["USAFA official site"],
  },
  {
    id: "schriever",
    plate: "chey",
    layer: "norad",
    tier: "official",
    name: "Schriever SFB (space operations)",
    lon: -104.5330,
    lat: 38.9430,
    elevM: 2056,
    depthM: 0,
    kind: "mil",
    facts: [
      "Space Delta units fly satellites from the high plains east of the city — the third leg of the Colorado Springs military-space triangle.",
      "Named for General Bernard Adolph Schriever, father of the Air Force's ballistic missile and space programs.",
    ],
    sources: ["Schriever SFB public site"],
  },
  {
    id: "bridge",
    plate: "ange",
    layer: "norad",
    tier: "official",
    name: "Bridge to Nowhere — East Fork San Gabriel River",
    lon: -117.74667,
    lat: 34.28306,
    elevM: 821,
    depthM: 0,
    kind: "bridge",
    facts: [
      "A 120-ft-clearance open-spandrel concrete arch built in 1936 as part of a road meant to link the San Gabriel Valley to Wrightwood through the East Fork canyon.",
      "The March 1938 flood — southern California's great killer flood — shredded the approach roads; the project was abandoned and the road was never rebuilt.",
      "Now a private inholding inside the Angeles National Forest, five trail miles from the East Fork trailhead, famous for the bungee operation that jumps from its deck.",
      "The gold mines of the East Fork — Stanley-Miller, Allison, Gold Dollar, Eagle — sit on the canyon walls above; the 1938 flood is the same event that ended the mining era's last working roads.",
    ],
    sources: [
      "Wikipedia — Bridge to Nowhere (San Gabriel Mountains)",
      "USGS flood report: March 1938 Los Angeles floods",
      "3DEP deck elevation: 821 m (this app's DEM)",
    ],
  },
];

/* ----------------------------------------------------------- camps ----- */

export const CAMPS = [
  /* -------- Colorado -------- */
  {
    id: "chey-sp",
    plate: "chey",
    layer: "camps",
    tier: "official",
    name: "Cheyenne Mountain State Park campground",
    lon: -104.8540, lat: 38.7560, elevM: 2256, kind: "camp",
    facts: [
      "51 full-hookup sites plus 10 walk-in tent sites in four loops on the mountain's southeast flank — the closest camping to NORAD's front gate.",
      "1,680-acre park (opened 2006) with 20+ miles of trails climbing toward the complex's perimeter.",
      "Reservable, open year-round; every loop looks straight up at the granite the complex is buried in.",
    ],
    sources: ["Colorado Parks & Wildlife — Cheyenne Mountain State Park", "Uncover Colorado camping guide"],
  },
  {
    id: "golden-eagle",
    plate: "chey",
    layer: "camps",
    tier: "community",
    name: "Golden Eagle Campground (private, Rock Creek canyon)",
    lon: -104.8580, lat: 38.7380, elevM: 2000, kind: "camp",
    facts: [
      "Family-run since 1961 on Highway 115 south of the state park; 200 RV sites, 125 pull-through, on 900 acres.",
      "The civilian neighbor of the mountain's south side.",
    ],
    sources: ["Visit Colorado Springs — Golden Eagle Campground"],
  },
  {
    id: "mueller",
    plate: "chey",
    layer: "camps",
    tier: "official",
    name: "Mueller State Park campsites",
    lon: -105.1798, lat: 38.9571, elevM: 2783, kind: "camp",
    facts: [
      "High-country camping on the north side of the Pikes massif, 5,112 acres of aspen and spruce with Pikes Peak views.",
      "A reasonable base for the Cripple Creek mining district and the Rampart Reservoir road.",
    ],
    sources: ["Colorado Parks & Wildlife — Mueller State Park"],
  },
  /* -------- Angeles NF -------- */
  {
    id: "crystal-lake-camp",
    plate: "ange",
    layer: "camps",
    tier: "official",
    name: "Crystal Lake Recreation Area campground",
    lon: -117.8530, lat: 34.3230, elevM: 1972, kind: "camp",
    facts: [
      "The only natural lake in the San Gabriel Mountains, at 5,600 ft on the Highway 39 side; tent sites, first-come first-served.",
      "Burned over in the 2002 Curve Fire and rebuilt; the lake basin sits below the Pacifico-Hawkins crest.",
    ],
    sources: ["Recreation.gov — Crystal Lake, Angeles NF", "USFS San Gabriel Mountains National Monument"],
  },
  {
    id: "coldbrook",
    plate: "ange",
    layer: "camps",
    tier: "official",
    name: "Coldbrook Campground",
    lon: -117.8720, lat: 34.3010, elevM: 1021, kind: "camp",
    facts: [
      "22 shaded sites at the junction of Coldbrook and Soldier Creeks, North Fork San Gabriel River, elevation ~3,350 ft.",
      "First-come first-served; the Smith Mountain trailhead is a third of a mile away. Water status varies — check the forest order before packing.",
    ],
    sources: ["Angeles NF — Coldbrook Campground", "campflare status page"],
  },
  {
    id: "chilao",
    plate: "ange",
    layer: "camps",
    tier: "official",
    name: "Chilao campground (Little Pines + Manzanita loops)",
    lon: -118.0260, lat: 34.3260, elevM: 1584, kind: "camp",
    facts: [
      "The Angeles Crest's flagship campground at 5,300 ft near Chilao Flat, with two family loops plus group sites.",
      "Trailhead country for Mount Waterman, the Silver Moccasin trail and the 2009 Station Fire burn landscapes.",
    ],
    sources: ["Recreation.gov — Chilao Campground, Angeles NF"],
  },
  {
    id: "table-mountain",
    plate: "ange",
    layer: "camps",
    tier: "official",
    name: "Table Mountain campground",
    lon: -117.6820, lat: 34.3680, elevM: 2149, kind: "camp",
    facts: [
      "Big flat at 7,000 ft on the Blue Ridge above Wrightwood — the nearest drive-in camping to the desert-side crest.",
      "Snow in winter, dark skies, and the Pacific Crest Trail along the ridge.",
    ],
    sources: ["Recreation.gov — Table Mountain (Angeles)"],
  },
  {
    id: "manker",
    plate: "ange",
    layer: "camps",
    tier: "official",
    name: "Manker Flat campground",
    lon: -117.6560, lat: 34.2840, elevM: 2919, kind: "camp",
    facts: [
      "The trailhead camp for Mount San Antonio (Baldy) via the ski hut and Devil's Backbone — the highest trailhead camping in the range.",
      "Between the 2014 Colby Fire and repeated debris flows, sites have opened and closed; verify status.",
    ],
    sources: ["Recreation.gov — Manker Flat", "USFS Big Pines information"],
  },
  {
    id: "spruce-grove",
    plate: "ange",
    layer: "camps",
    tier: "community",
    name: "Spruce Grove trail camp (hike-in)",
    lon: -117.7710, lat: 34.2460, elevM: 953, kind: "camp",
    facts: [
      "Walk-in camp on the East Fork trail system below the Bridge to Nowhere stretch; the staging point for the Stanley-Miller and Allison climbs.",
      "Water from the river (treat it), and the canyon heat is the real hazard.",
    ],
    sources: ["USFS trail information", "hike write-ups of the East Fork"],
  },
  {
    id: "heaton-flats",
    plate: "ange",
    layer: "camps",
    tier: "official",
    name: "Heaton Flat / East Fork trailhead camp",
    lon: -117.7631, lat: 34.2406, elevM: 601, kind: "camp",
    facts: [
      "The launch point for the five-mile walk to the Bridge to Nowhere: canyon-bottom flats at ~2,000 ft, groups by permit.",
      "From here the East Fork trail threads the Narrows between the Iron Mountain mines high on both walls.",
    ],
    sources: ["USFS — East Fork Trail / Bridge to Nowhere", "recreation.gov area listing"],
  },
];

/* ------------------------------------------------------------ mines ---- */
/* USGS MRDS records, pulled from mrdata.usgs.gov WFS 2026-10-02.
 * Fields: [lon, lat] MRDS site point; status + commodities verbatim. */

const M = (id, name, lon, lat, status, com, extra = {}) => ({ id, name, lon, lat, status, com, ...extra });
const mrdsSrc = (dep) => [`USGS MRDS record ${dep}`, `https://mrdata.usgs.gov/mrds/show-mrds.php?dep_id=${dep}`];

export const MINES_ANGE = [
  /* -- East Fork / San Gabriel Canyon gold belt (the heart of the layer) -- */
  M("big-horn", "Big Horn Mine", -117.7445, 34.3567, "Producer", "Au Ag Cu Pb", {
    dep: 10110776, tier: "official", depthM: -120, story: [
      "Charles Tom Vincent's 1895 gold-quilt find on the face of Mount Baden-Powell; ~3,700 oz of gold over a working life that ended in 1985.",
      "277-acre inholding bought back by the Wilderness Land Trust in 2006 and returned to Sheep Mountain Wilderness; the mill burned in the 2024 Bridge Fire.",
    ] }),
  M("allison", "Allison Mine", -117.7281, 34.2714, "Producer", "Au", {
    dep: 10110774, tier: "official", depthM: -140, story: [
      "George Allison and sons, ~1917–1942, on Laurel Gulch above the East Fork; ~10,000 tons of ore for roughly $50,000 in gold.",
      "One of Hugh Blanchard's 'mines we will never see' — the trail to it is a trophy route.",
    ] }),
  M("stanley-miller", "Stanley-Miller Mine (approx. MRDS gap)", -117.732, 34.290, "Past Producer", "Au", {
    dep: null, tier: "community", depthM: -200, story: [
      "Gordon Stanley and Ben Miller filed seven claims in 1915 above the Narrows; twelve claims patented along half a mile of cliff.",
      "Miller built the Wetwater Trail — three feet wide, 300 ft of air — to haul the ball mill in by mule.",
      "Last worked 1939; a 1953 forest fire burned the cabin and mill and set off the abandoned blasting caps, dropping the machinery to the bottom of the Narrows. Five tunnels, an ore cart still in the adit.",
      "The USGS MRDS point index misses this site (no record in the East Fork bbox pull); plotted from mine-historian and trip-report concordance at ~1,200 ft above the Narrows on Iron Mountain's west face — hence community tier, not official.",
    ] }),
  M("gold-dollar", "Gold Dollar Mine", -117.6984, 34.2872, "Producer", "Au Ag", {
    dep: 10280891, tier: "official", depthM: -100, story: ["East Fork producer at the head of the Graveyard drainage; paired record 10076788 lists Au."] }),
  M("eagle", "Eagle Mine", -117.6962, 34.2820, "Producer", "Au", {
    dep: 10076787, tier: "official", depthM: -90, story: ["East Fork gold producer near the Graveyard-Alder confluence country."] }),
  M("native-son", "Native Son Mine", -117.6912, 34.3397, "Producer", "Au", {
    dep: 10076791, tier: "official", depthM: -110, story: ["North-side East Fork gold; the 'insanely hard to reach' list with Stanley-Miller and Allison."] }),
  M("baldora", "Baldora Mine (Widco)", -117.7034, 34.2747, "Past Producer", "Au Ag", {
    dep: 10207829, tier: "official", depthM: -80, story: ["East Fork workings paired with the Widco claims in the same drainage."] }),
  M("zanteson", "Zanteson", -117.7595, 34.2289, "Producer", "Au", {
    dep: 10076790, tier: "official", depthM: -60, story: ["Lower East Fork placer/lode producer."] }),
  M("san-gabriel-mine", "San Gabriel", -117.7509, 34.2500, "Producer", "Au", {
    dep: 10110511, tier: "official", depthM: -60, story: [] }),
  M("holly", "Holly", -117.7597, 34.2442, "Producer", "Au", {
    dep: 10115021, tier: "official", depthM: -50, story: [] }),
  M("queenie", "Queenie", -117.7592, 34.2417, "Prospect", "Au", {
    dep: 10139150, tier: "official", depthM: -40, story: [] }),
  M("happy-day", "Happy Day Placer", -117.7917, 34.2333, "Past Producer", "Au", {
    dep: 10115234, tier: "official", depthM: -20, story: [] }),
  M("phelps", "Phelps Placer", -117.8128, 34.2422, "Occurrence", "Au", {
    dep: 10139282, tier: "official", depthM: -10, story: [] }),
  M("justice", "Justice Placers", -117.7412, 34.2875, "Occurrence", "Au", {
    dep: 10115091, tier: "official", depthM: -15, story: [] }),
  M("noverto", "Noverto Placer", -117.7434, 34.2903, "Occurrence", "Au", {
    dep: 10139118, tier: "official", depthM: -15, story: [] }),
  M("chicken-finlay", "Chicken Finlay Placer", -117.7451, 34.2867, "Prospect", "Au", {
    dep: 10212389, tier: "official", depthM: -15, story: [] }),
  M("andrew-tungsten", "Andrew Tungsten Mine", -117.6849, 34.2582, "Past Producer", "W", {
    dep: 10115273, tier: "official", depthM: -60, story: ["Tungsten on the desert-side drainages of the range — the WWI/WWII strategic mineral."] }),
  M("dotson", "Dotson Scheelite", -117.7434, 34.2811, "MRDS record", "W", {
    dep: 10163190, tier: "official", depthM: -50, story: ["Scheelite (tungsten ore) record on the East Fork; status field truncated in the WFS pull."] }),
  M("blue-diamond", "Blue Diamond Mine", -117.5990, 34.2783, "Past Producer", "W Au Ag", {
    dep: 10286960, tier: "official", depthM: -60, story: ["Tungsten with byproduct gold on the San Bernardino-side crest above Lytle Creek."] }),
  M("winter-creek", "Winter Creek", -118.0219, 34.2014, "Past Producer", "Cu Au Mo Ag", {
    dep: 10139127, tier: "official", depthM: -50, story: ["Molybdenite-copper-gold workings on the Monrovia-side front range; two sibling occurrence records (10008312, 10037050)."] }),
  M("cogswell", "Cogswell", -117.9653, 34.2447, "Occurrence", "Mo RE", {
    dep: 10037046, tier: "official", depthM: -30, story: ["Molybdenum with RARE EARTHS flagged — the oddball commodity record of the front range (sibling 10008315)."] }),
  M("silver-mountain", "Silver Mountain", -117.8615, 34.2133, "Prospect", "Cu Au Ag", {
    dep: 10236509, tier: "official", depthM: -50, story: [] }),
  M("kelsey", "Kelsey, Et Al.", -117.8806, 34.1861, "Past Producer", "Au Pb Ag", {
    dep: 10212073, tier: "official", depthM: -60, story: ["Front-range producer at the San Gabriel Canyon mouth country."] }),
  M("glen-marie", "Glen-Marie Placer", -117.8101, 34.2383, "Past Producer", "Au", {
    dep: 10212492, tier: "official", depthM: -15, story: [] }),
  M("cole", "Cole", -117.8342, 34.2500, "Occurrence", "Mo", {
    dep: 10008314, tier: "official", depthM: -30, story: ["Molybdenite on the Cascade axis; sibling records 10092527 and 10211991 sit 2 km east."] }),
  M("lost-treasure", "Lost Treasure", -117.8117, 34.2014, "Prospect", "Ag", {
    dep: 10187810, tier: "official", depthM: -30, story: [
      "The only primary-silver prospect in the ANF index — surface-underground workings on the Glendora quad (T1N R9W, Mount Diablo meridian), San Gabriel watershed.",
      "Source checked 2026-10-04 (docs/lost-treasure-source-check-2026-10-04.md): MRDS carries one bibliographic reference — Calif. Jour. Mines and Geol., v. 50, 1954, p. 635 — reported 1991-03-31 by James Ridenour, U.S. Bureau of Mines (MAS 0060370037). Location accuracy is coarse: ±10,000 m.",
    ] }),
  M("w024049", "Unnamed Prospect W024049", -117.8117, 34.2014, "Prospect", "Au", {
    dep: 10260583, tier: "official", depthM: -10, story: [
      "Gold prospect co-registered at the same MAS coordinate pair as Lost Treasure but with a far tighter fix: ±500 m, elev. 975 m, T1N R9W sec. 3C. Added 2026-10-04 from the Lost Treasure source check's near-point sweep of the same MRDS source.",
      "Source: Mt. Baldy Ranger District (USFS) files via MRDS id W024049 / MAS 0060370039; reported 1991-03-31 by the USBM Western Field Operations Center. Related MRDS records: 10076795, 10284857. Land status: National Forest.",
    ] }),
  M("eva-canyon", "Eva Canyon (graphite)", -117.6926, 34.1711, "Occurrence", "Graphite", {
    dep: 10236342, tier: "official", depthM: -20, story: ["Graphite — the strangest commodity in the ANF index — on the south-side canyons."] }),
  M("san-dimas-barite", "San Dimas Barite Deposit", -117.7767, 34.1725, "Past Producer", "Ba", {
    dep: 10212413, tier: "official", depthM: -20, story: ["Barite (drilling-mud mineral) worked on the San Dimas side."] }),
  M("coldwater-prospect", "Coldwater Canyon Prospect", -117.7145, 34.2553, "Occurrence", "Au", {
    dep: 10211975, tier: "official", depthM: -20, story: [] }),
  M("woodman", "Woodman Placer", -117.8303, 34.2297, "Occurrence", "Au", {
    dep: 10211994, tier: "official", depthM: -10, story: [] }),
  M("sg-mining-co", "San Gabriel Mining Co.", -117.7531, 34.2750, "Prospect", "Au", {
    dep: 10236185, tier: "official", depthM: -30, story: [] }),
  M("sg-canyon-area", "San Gabriel Canyon Area", -117.6726, 34.2009, "Producer", "Au", {
    dep: 10076786, tier: "official", depthM: -20, story: ["District-scale placer-gold record for the whole San Gabriel Canyon country."] }),
  /* -- Big Tujunga / Acton / Santa Clara side -- */
  M("gold-bar", "Gold Bar", -118.0856, 34.3420, "Producer", "Au", {
    dep: 10076844, tier: "official", depthM: -60, story: ["Big Tujunga-country gold producer."] }),
  M("loomis", "Loomis", -118.0509, 34.3494, "Producer", "Au", {
    dep: 10110779, tier: "official", depthM: -50, story: [] }),
  M("black-cargo", "Black Cargo", -118.0942, 34.3464, "Producer", "Au", {
    dep: 10110783, tier: "official", depthM: -50, story: [] }),
  M("dewey", "Dewey Group", -118.0876, 34.3850, "Past Producer", "Au", {
    dep: 10139582, tier: "official", depthM: -60, story: [] }),
  M("monte-cristo", "Monte Cristo Mine", -118.0876, 34.3531, "Prospect", "Au", {
    dep: 10285258, tier: "official", depthM: -60, story: ["Alder Creek gold prospect in the upper Big Tujunga country — a different Monte Cristo than the MRDS 'Monte Cristo' record of the same name elsewhere in the county."] }),
  M("josephine", "Josephine", -118.1084, 34.3481, "Past Producer", "Au", {
    dep: 10188225, tier: "official", depthM: -50, story: [] }),
  M("casa-grande", "Casa Grande", -118.1709, 34.3839, "Prospect", "Au", {
    dep: 10285158, tier: "official", depthM: -50, story: [] }),
  M("mt-gleason", "Mt Gleason", -118.1781, 34.3886, "Producer", "Au", {
    dep: 10110784, tier: "official", depthM: -50, story: ["Gold at the Mount Gleason summit block; sibling titanium occurrence 10163272 sits 600 m south."] }),
  M("chilao-gold", "Chilao Gold Prospect", -118.0251, 34.3333, "Prospect", "Au", {
    dep: 10114806, tier: "official", depthM: -40, story: ["Gold prospect inside the Chilao campground country."] }),
  M("condor", "Condor", -118.1442, 34.3614, "Prospect", "Ti", {
    dep: 10139350, tier: "official", depthM: -20, story: [] }),
  M("antelope-valley-placer", "Antelope Valley (placer)", -118.2342, 34.3667, "Producer", "Au", {
    dep: 10072432, tier: "official", depthM: -10, story: ["Placer gold on the desert shoulder of the Acton country."] }),
  M("red-rover", "Red Rover Mine", -118.2212, 34.5067, "Past Producer", "Au", {
    dep: 10110786, tier: "official", depthM: -80, story: ["The Acton district's anchor mine — gold in the Santa Clara drainage, with the Puritan (10139269) and Hi-Grade (10139527) as neighbors."] }),
  M("puritan", "Puritan Mine", -118.2470, 34.5081, "Past Producer", "Au", {
    dep: 10139269, tier: "official", depthM: -60, story: ["Acton district; the stamp mill at this mine is a preserved county landmark."] }),
  M("hi-grade", "Hi-Grade Mine", -118.2206, 34.4897, "Past Producer", "Au", {
    dep: 10139527, tier: "official", depthM: -60, story: [] }),
  M("topeka", "Topeka", -118.1945, 34.5017, "Past Producer", "Au", {
    dep: 10211779, tier: "official", depthM: -50, story: [] }),
  M("ohio", "Ohio", -118.2467, 34.4344, "Past Producer", "Ag", {
    dep: 10114863, tier: "official", depthM: -40, story: [] }),
  M("buena-esperanza", "Buena Esperanza", -118.2365, 34.4947, "Prospect", "Au", {
    dep: 10187793, tier: "official", depthM: -40, story: [] }),
  M("triumph", "Triumph", -118.2290, 34.5317, "Prospect", "Au", {
    dep: 10212400, tier: "official", depthM: -40, story: [] }),
  M("palm-dev", "Palm Development Co.", -117.9720, 34.4925, "Occurrence", "Cu Au Ag", {
    dep: 10076808, tier: "official", depthM: -30, story: ["Copper-gold occurrence on the Palmdale-side desert edge."] }),
  M("john-ferry", "John F Ferry Rock Products", -117.9878, 34.5472, "Past Producer", "Sand & gravel", {
    dep: 10076827, tier: "official", depthM: -10, story: ["Desert-edge aggregate operation; the modern economy of the same mountains the gold camps missed."] }),
  M("nickel-greenstone", "Nickel Greenstone Quarry", -118.0362, 34.5067, "Prospect", "Sand & gravel", {
    dep: 10076829, tier: "official", depthM: -10, story: ["Greenstone road-metal prospect on the desert rim."] }),
  M("azusa-rock", "Azusa Rock and Sand Co (Woods)", -117.9173, 34.1131, "Past Producer", "Sand & gravel", {
    dep: 10076797, tier: "official", depthM: -40, story: [
      "The giant alluvial-fan quarry at the mouth of San Gabriel Canyon — Fish Canyon — that has fed Los Angeles concrete for a century.",
      "The mineral economy of this range in one record: gold underground, sand at the canyon mouth.",
    ] }),
  M("sg-anorthosite", "San Gabriel Anorthosite", -118.2281, 34.3867, "Prospect", "Al Ti Ca Fe Mg K Si Na", {
    dep: 10236223, tier: "official", depthM: -20, story: ["The largest anorthosite body in southern California, prospected for aluminum and titanium — never economic."] }),
  M("white-feldspar", "White Feldspar Placer", -118.2312, 34.4292, "Occurrence", "Feldspar", {
    dep: 10188101, tier: "official", depthM: -15, story: [] }),
  M("stewart-jasper", "Stewart Jasper Deposit", -118.1406, 34.4839, "Occurrence", "Gemstone", {
    dep: 10212547, tier: "official", depthM: -10, story: ["Jasper occurrence — the only gemstone record in the ANF index."] }),
  M("wrightwood-lst", "Wrightwood (limestone)", -117.5973, 34.3547, "Past Producer", "Limestone", {
    dep: 10116072, tier: "official", depthM: -30, story: ["Limestone above Wrightwood; sibling quarry record 10141187 at Big Pines."] }),
  M("big-pine", "Big Pine", -117.6495, 34.3750, "Occurrence", "Limestone", {
    dep: 10262256, tier: "official", depthM: -20, story: [] }),
  M("marble-canyon", "Marble Canyon", -117.6453, 34.1620, "Occurrence", "Marble", {
    dep: 10035298, tier: "official", depthM: -20, story: ["Marble on the San Bernardino-side front — quarry record 10116946 sits 300 m north."] }),
  M("empire-placer", "Empire Placer", -117.8270, 34.4133, "Occurrence", "Au", {
    dep: 10188033, tier: "official", depthM: -10, story: [] }),
  M("donaldson", "Donaldson Prospect", -117.8670, 34.3667, "Prospect", "Ag", {
    dep: 10285277, tier: "official", depthM: -30, story: [] }),
  M("sycamore-ag", "Sycamore Prospect", -117.9692, 34.4211, "Occurrence", "Ag", {
    dep: 10135178, tier: "official", depthM: -20, story: [] }),
  M("fenner", "Fenner Canyon Prospect", -117.7731, 34.3861, "Occurrence", "W", {
    dep: 10236076, tier: "official", depthM: -20, story: [] }),
  M("amercal", "Amercal", -117.7606, 34.4167, "Past Producer", "Crushed stone", {
    dep: 10285179, tier: "official", depthM: -15, story: [] }),
  M("victoria", "Victoria", -117.8828, 34.1792, "Past Producer", "Pb", {
    dep: 10034282, tier: "official", depthM: -30, story: ["Lead on the south-front canyons; sibling record 10285353 adds silver."] }),
  M("dime-canyon", "Dime Canyon Prospect", -117.7601, 34.2169, "Occurrence", "Au", {
    dep: 10284755, tier: "official", depthM: -15, story: [] }),
];

export const MINES_CRIPPLE = [
  M("cc-district", "Cripple Creek mining district", -105.1540, 38.7350, "district", "Au", {
    dep: null, tier: "official", depthM: -300, story: [
      "One of the great gold camps: ~23 million ounces produced from a collapsed volcanic caldera since 1891, and still worked by the Cresson surface mine.",
      "The USGS MRDS holds roughly 500 records inside this district; the pins below are the named set pulled live from the WFS on 2026-10-02.",
    ] }),
  M("ajax", "Ajax Mine", -105.1439, 38.7161, "Plant", "Au Ag", { dep: 10159458, tier: "official", depthM: -250, story: [] }),
  M("bonanza-king", "Bonanza King Mine", -105.1670, 38.7400, "Past Producer", "Au", { dep: 10167202, tier: "official", depthM: -200, story: [] }),
  M("commonwealth", "Commonwealth", -105.1620, 38.7206, "Past Producer", "Au", { dep: 10167227, tier: "official", depthM: -200, story: [] }),
  M("ophelia", "Ophelia Tunnel", -105.1578, 38.7336, "Past Producer", "Au", { dep: 10167317, tier: "official", depthM: -200, story: [] }),
  M("gold-hill", "Gold Hill Tunnel", -105.1675, 38.7414, "Past Producer", "Au", { dep: 10192169, tier: "official", depthM: -220, story: [] }),
  M("masterpiece", "Masterpiece Tunnel", -105.1664, 38.7678, "Past Producer", "Au", { dep: 10192233, tier: "official", depthM: -200, story: [] }),
  M("blue-flag", "Blue Flag Mine", -105.1475, 38.7317, "Past Producer", "Au", { dep: 10192248, tier: "official", depthM: -200, story: [] }),
  M("ada-bell", "Ada Bell No 1", -105.1448, 38.7242, "Past Producer", "Au", { dep: 10192256, tier: "official", depthM: -200, story: [] }),
  M("carpenter", "Carpenter Mine", -105.1331, 38.7317, "Past Producer", "Au", { dep: 10192288, tier: "official", depthM: -200, story: [] }),
  M("blanche", "Blanche Mine", -105.1659, 38.7331, "Past Producer", "Au", { dep: 10192350, tier: "official", depthM: -200, story: [] }),
  M("whip", "Whip", -105.1342, 38.7386, "Past Producer", "Au", { dep: 10167560, tier: "official", depthM: -200, story: [] }),
  M("kittie-lane", "Kittie Lane", -105.1539, 38.7197, "Past Producer", "Au", { dep: 10167145, tier: "official", depthM: -180, story: [] }),
  M("apex", "Apex Mine", -105.1587, 38.7475, "Past Producer", "Au", { dep: 10167156, tier: "official", depthM: -180, story: [] }),
  M("mollie-kathleen", "Mollie Kathleen Gold Mine (approx.)", -105.1720, 38.7450, "Past Producer", "Au", {
    dep: null, tier: "community", depthM: -305, story: [
      "Namesake shaft: Mollie Kathleen Gortner's 1890 claim; the shaft runs ~1,000 ft straight down and the mine has been giving underground tours since the 1960s.",
      "Plotted approximately (community tier); the MRDS pull for this plate did not include a named record at the site.",
    ] }),
];

/* -------------------------------------------------------- corridors ---- */

export const CORRIDORS = [
  {
    id: "east-fork",
    plate: "ange",
    layer: "corridor",
    tier: "community",
    name: "East Fork trail — Azusa to the Bridge and beyond",
    short: "East Fork trail",
    kind: "trail",
    path: [
      [-117.9076, 34.1283], [-117.8809, 34.1796], [-117.8542, 34.2263], [-117.8067, 34.2233],
      [-117.7759, 34.2285], [-117.7634, 34.2415], [-117.7567, 34.2598], [-117.74667, 34.28306],
      [-117.7350, 34.2900], [-117.7250, 34.3000],
    ],
    facts: [
      "The walk to the Bridge to Nowhere: ~5 miles from the East Fork trailhead, wets crossings and all.",
      "The same canyon floor the 1938 flood rearranged; the road the bridge was built for is gone from both banks.",
      "Beyond the bridge the trail climbs the Narrows toward Iron Fork — the country of the Stanley-Miller and Allison workings.",
    ],
    sources: ["USFS — East Fork Trail", "3DEP canyon-floor samples along this line (this app's DEM)"],
  },
  {
    id: "pikes-hwy",
    plate: "chey",
    layer: "corridor",
    tier: "official",
    name: "Pikes Peak Highway — Cascade to the summit",
    short: "Pikes Peak Highway",
    kind: "road",
    path: [
      [-104.9886, 38.9572], [-105.0000, 38.9300], [-105.0100, 38.9000], [-105.0158, 38.9757],
      [-105.0200, 38.8800], [-105.0300, 38.8700], [-105.0400, 38.8600], [-105.0449, 38.8406],
    ],
    facts: [
      "19-mile toll road from Cascade to the 14,115 ft summit, graded from the 1888 carriage road; the second-oldest race hillclimb in America runs up it.",
      "Roughly the track of the 3DEP crest samples this app interpolates its Pikes massif from.",
    ],
    sources: ["Pikes Peak Highway official site", "3DEP corridor samples (this app's DEM)"],
  },
];

/* ----------------------------------------------------------- views ----- */

export const VIEWS = {
  cheyNORAD: {
    id: "cheyNORAD", label: "NORAD · CHEYENNE MOUNTAIN", plate: "chey",
    cam: { lon: -104.83, lat: 38.71, h: 5.5 }, target: { lon: -104.86, lat: 38.76, h: 0.55 },
    note: "The granite under NORAD, from the southwest.",
  },
  cheyPikes: {
    id: "cheyPikes", label: "PIKES PEAK MASSIF", plate: "chey",
    cam: { lon: -105.12, lat: 38.95, h: 7.5 }, target: { lon: -105.0, lat: 38.83, h: 0.7 },
    note: "America's Mountain from the Teller County side.",
  },
  cheyCripple: {
    id: "cheyCripple", label: "CRIPPLE CREEK DISTRICT", plate: "chey",
    cam: { lon: -105.23, lat: 38.68, h: 6.5 }, target: { lon: -105.155, lat: 38.735, h: 0.6 },
    note: "The gold caldera, with the MRDS record field.",
  },
  angeEastFork: {
    id: "angeEastFork", label: "EAST FORK · BRIDGE TO NOWHERE", plate: "ange",
    cam: { lon: -117.84, lat: 34.21, h: 4.5 }, target: { lon: -117.747, lat: 34.283, h: 0.5 },
    note: "The canyon, the bridge, and the mines on its walls.",
  },
  angeCrest: {
    id: "angeCrest", label: "SAN GABRIEL CREST", plate: "ange",
    cam: { lon: -117.85, lat: 34.50, h: 7.5 }, target: { lon: -117.85, lat: 34.32, h: 0.65 },
    note: "Baldy to Baden-Powell along the county line.",
  },
  both: {
    id: "both", label: "BOTH PLATES · 1,310 KM APART", plate: "both",
    cam: { x: 0, y: 9, z: 17 }, target: { x: 0, y: 0.4, z: 0 },
    note: "Scene space, not geography: the plates sit side by side for reading.",
  },
};

/* --------------------------------------------------- off-frame register */

export const OFF_FRAME = [
  {
    name: "MRDS records outside the proclamation ring",
    note: "14 of the 67 plotted records sit outside the main-block forest boundary this app carries: the Acton district (Red Rover, Puritan, Hi-Grade, Topeka, Ohio, Buena Esperanza, Triumph), the Palmdale-fringe aggregate pits, the Cucamonga-side Marble Canyon, and the valley-floor Azusa Rock quarry. They stay plotted — the MRDS index is the point — with their positions honest.",
  },
  {
    name: "Big Horn Mine mill site — burned in the 2024 Bridge Fire",
    note: "The Big Horn pin is the MRDS record; the mill ruin itself is 2 km northeast at Vincent Gap and is off-plate detail.",
  },
  {
    name: "NORAD's radar fence",
    note: "The actual radar sites of the early-warning network are spread across the continent; none are inside either plate.",
  },
  {
    name: "Valley-floor aggregate plants (LA basin)",
    note: "Roughly 40 MRDS sand-and-gravel/brick records lie on the San Fernando + San Gabriel valley floors south of the forest. Only the canyon-mouth Azusa Rock operation is plotted.",
  },
];

export const LAYER_MENU_NOTE = [
  "Evidence tiers — official: USGS MRDS/GNIS/agency records; community: well-sourced secondary; context: approximate only.",
];

export function allMines() {
  return [
    ...MINES_ANGE.map((m) => ({ ...m, plate: "ange", layer: "minesA" })),
    ...MINES_CRIPPLE.map((m) => ({ ...m, plate: "chey", layer: "minesC" })),
  ];
}

export function mineSources(m) {
  return m.dep ? mrdsSrc(m.dep) : ["mine-historian concordance (no MRDS record at site)"];
}

export default {
  META, LAYERS, POLITICS, GAZETTEER, FACILITIES, CAMPS, MINES_ANGE, MINES_CRIPPLE,
  CORRIDORS, VIEWS, OFF_FRAME, allMines, mineSources,
};

