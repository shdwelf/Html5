/**
 * SOCAL SUBSURFACE — vector overlay pack.
 *
 * FIRE PERIMETERS
 * ---------------
 * The authoritative sources are WIFIRE Firemap (UC San Diego / SDSC) and the
 * CAL FIRE FRAP historical perimeter database (`firep` series, fires back to
 * 1878, republished as GeoJSON on data.ca.gov and the CNRA ArcGIS Hub). This
 * app is offline-first and ships no network calls, so it cannot fetch those
 * layers at runtime. Instead each fire below is stored as:
 *
 *    centroid + published acreage + a deterministic organic ring
 *
 * and the ring is scaled at load time so its planar area equals the published
 * acreage. Shape is therefore SYNTHETIC — the location, the year, the size and
 * the story are real; the wiggle of the line is not. `FIRE_SOURCE_URLS` below
 * is the drop-in list for anyone who wants to swap in true FRAP geometry.
 *
 * DEM / SAR / QUAD FRAMES
 * -----------------------
 * The graticules are the real index frames of the data, drawn at their real
 * spacing: USGS 7.5-minute quadrangles (0.125°), 1×1 degree 1/3 arc-second DEM
 * tiles, and a Sentinel-1 IW descending swath at its real 250 km width.
 */

export const FIRE_SOURCE_URLS = [
  "https://firemap.sdsc.edu/ — WIFIRE Firemap (UCSD / San Diego Supercomputer Center)",
  "https://data.ca.gov/dataset/california-fire-perimeters-all — CAL FIRE FRAP, GeoJSON",
  "https://gis.data.cnra.ca.gov/api/download/v1/items/c3c10388e3b24cec8a954ba10458039d/geojson?layers=0",
  "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer",
];

export const ACRE_KM2 = 0.00404685642;

/**
 * Fires intersecting or bounding the theater.
 * acres = final reported size. aspect/rot orient the generalized blob along the
 * terrain grain (a fire in a pass is long and thin; a fire on a plateau is not).
 */
export const FIRES = [
  {
    id: "bluecut",
    name: "Blue Cut Fire",
    year: 2016,
    start: "2016-08-16",
    acres: 36274,
    lon: -117.47,
    lat: 34.335,
    aspect: 1.9,
    rot: -1.05,
    agency: "San Bernardino NF / USFS + CAL FIRE",
    notes: [
      "Reported 10:36 AM, 16 August 2016, on Old Cajon Blvd north of Kenwood Ave, west of I-15.",
      "Spotted across Cajon Creek and ran the pass: 18,000 acres in the first ~12 hours, ~82,600 people under evacuation, I-15 closed.",
      "Burned over the historic Summit Inn; a freight train crew had to abandon and flee.",
      "Mapped size bounced 30,000 → 25,626 → 31,689 → ~36,274 acres as infrared flights replaced smoothed hand lines — a clean illustration of why a perimeter is a timestamped estimate, not a fact.",
      "Cause undetermined at the time; USFS ran a WeTip arson line.",
    ],
    crosses: ["edwards-feeder", "calnev", "up-la-sub", "atsf-transcon", "swp"],
  },
  {
    id: "pilot",
    name: "Pilot Fire",
    year: 2016,
    start: "2016-08-07",
    acres: 8110,
    lon: -117.28,
    lat: 34.325,
    aspect: 1.3,
    rot: 0.2,
    agency: "San Bernardino NF",
    notes: ["Burned above Silverwood Lake nine days before Blue Cut; the two fires bracket the East Branch aqueduct terminus."],
  },
  {
    id: "old",
    name: "Old Fire",
    year: 2003,
    start: "2003-10-25",
    acres: 91281,
    lon: -117.21,
    lat: 34.225,
    aspect: 1.7,
    rot: 0.05,
    agency: "CAL FIRE / San Bernardino NF",
    notes: ["Arson; part of the October 2003 Santa Ana siege. Ran into the city of San Bernardino and the Rim of the World communities."],
  },
  {
    id: "grandprix",
    name: "Grand Prix Fire",
    year: 2003,
    start: "2003-10-21",
    acres: 59448,
    lon: -117.58,
    lat: 34.175,
    aspect: 2.4,
    rot: -0.05,
    agency: "Angeles / San Bernardino NF",
    notes: ["Burned the San Gabriel front from Fontana to Claremont and merged behaviour with the Old Fire — the 2003 fires stripped the same slopes Blue Cut would later run."],
  },
  {
    id: "station",
    name: "Station Fire",
    year: 2009,
    start: "2009-08-26",
    acres: 160577,
    lon: -118.13,
    lat: 34.31,
    aspect: 1.5,
    rot: -0.25,
    agency: "Angeles National Forest",
    notes: ["Largest fire in Los Angeles County history at the time; two LA County firefighters killed. Burned most of the front range above the LA Aqueduct's final descent."],
  },
  {
    id: "sand",
    name: "Sand Fire",
    year: 2016,
    start: "2016-07-22",
    acres: 41432,
    lon: -118.36,
    lat: 34.43,
    aspect: 1.4,
    rot: 0.35,
    agency: "Angeles NF / LA County",
    notes: ["Santa Clarita, three weeks before Blue Cut. Burned across the SP/Metrolink Soledad Canyon corridor."],
  },
  {
    id: "bobcat",
    name: "Bobcat Fire",
    year: 2020,
    start: "2020-09-06",
    acres: 115796,
    lon: -117.96,
    lat: 34.33,
    aspect: 1.2,
    rot: -0.1,
    agency: "Angeles National Forest",
    notes: ["One of the largest in the San Gabriels; burned to the edge of Mount Wilson and north into the Antelope Valley foothills."],
  },
  {
    id: "lake",
    name: "Lake Fire",
    year: 2015,
    start: "2015-06-17",
    acres: 31359,
    lon: -116.83,
    lat: 34.2,
    aspect: 1.2,
    rot: 0.1,
    agency: "San Bernardino NF",
  },
  {
    id: "apple",
    name: "Apple Fire",
    year: 2020,
    start: "2020-07-31",
    acres: 33424,
    lon: -116.92,
    lat: 34.05,
    aspect: 1.3,
    rot: -0.3,
    agency: "CAL FIRE / San Bernardino NF",
  },
  {
    id: "eldorado",
    name: "El Dorado Fire",
    year: 2020,
    start: "2020-09-05",
    acres: 22744,
    lon: -116.98,
    lat: 34.06,
    aspect: 1.1,
    rot: 0.2,
    agency: "San Bernardino NF",
    notes: ["Started by a pyrotechnic device at a gender-reveal party; one firefighter killed."],
  },
  {
    id: "erskine",
    name: "Erskine Fire",
    year: 2016,
    start: "2016-06-23",
    acres: 48019,
    lon: -118.44,
    lat: 35.62,
    aspect: 1.4,
    rot: -0.4,
    agency: "Kern County / Sequoia NF",
    notes: ["Lake Isabella; two deaths, ~285 homes. Northern bracket of the 2016 season inside this frame."],
  },
  {
    id: "cedar",
    name: "Cedar Fire",
    year: 2003,
    start: "2003-10-25",
    acres: 273246,
    lon: -116.72,
    lat: 32.95,
    aspect: 1.6,
    rot: -0.2,
    agency: "CAL FIRE / Cleveland NF",
    notes: ["Largest California fire of the 20th–21st century turn; 15 deaths. Sits at the southern edge of this frame."],
  },
];

/** Colour by decade, the way FRAP symbolizes its own historical layer. */
export const FIRE_DECADE_COLOR = {
  1990: "#4b5563",
  2000: "#b45309",
  2010: "#ea580c",
  2020: "#f87171",
};

/** Index frames: the actual tiling schemes the source data arrives in. */
export const FRAMES = {
  quad: {
    id: "quad",
    name: "USGS 7.5′ quadrangle graticule",
    stepLon: 0.125,
    stepLat: 0.125,
    color: "#6b8ba3",
    note: "0.125° × 0.125° — the 1:24,000 topo sheet. Roughly 6.8 × 9.3 miles at this latitude. The unit of the Historical Topographic Map Collection, and the unit the DjVu scans were cut to.",
  },
  demTile: {
    id: "demTile",
    name: "1° × 1° 3DEP DEM tile",
    stepLon: 1,
    stepLat: 1,
    color: "#2dd4bf",
    note: "Delivery tile of the seamless 1/3 arc-second (~10 m) DEM. This frame is ~7 × 5 tiles.",
  },
};

/**
 * Sentinel-1 style descending swath. Real IW geometry: 250 km swath, ~98.6°
 * inclination, descending pass crosses SoCal on a NNE→SSW heading in the
 * morning of local time. Drawn as a ribbon, not a claim about a specific frame.
 */
export const SAR_SWATHS = [
  {
    id: "s1-desc",
    name: "Sentinel-1 IW descending swath (schematic)",
    heading: -13, // degrees from north, descending
    centerLon: -117.6,
    centerLat: 34.6,
    widthKm: 250,
    color: "#a3e635",
    notes: [
      "C-band, 5.405 GHz, 5.6 cm wavelength. IW mode: 250 km swath, 5 × 20 m resolution.",
      "12-day repeat per satellite. Repeat-pass interferometry resolves line-of-sight ground motion at centimetre to millimetre scale.",
      "This is how subsidence over pumped aquifers, creep on the San Andreas, and burn-scar roughness change get measured without anyone driving out there.",
    ],
  },
];

/** InSAR-detectable deformation bowls inside the frame. */
export const DEFORMATION = [
  {
    id: "antelope",
    name: "Antelope Valley subsidence bowl",
    lon: -118.05,
    lat: 34.72,
    radiusKm: 28,
    color: "#facc15",
    notes: [
      "Groundwater-pumping subsidence around Lancaster / Edwards; decades of it, metres in total, and it is why parts of Rogers Dry Lake have had to be re-surveyed.",
      "Classic InSAR target: no vegetation, no rain, high coherence, huge signal.",
    ],
  },
  {
    id: "sanjoaquin",
    name: "San Joaquin Valley subsidence",
    lon: -119.45,
    lat: 35.7,
    radiusKm: 45,
    color: "#facc15",
    notes: ["Pumping-driven subsidence that has locally deformed the California Aqueduct itself, reducing its design capacity."],
  },
  {
    id: "saltoncreep",
    name: "Salton Trough deformation / geothermal drawdown",
    lon: -115.6,
    lat: 33.2,
    radiusKm: 22,
    color: "#facc15",
    notes: ["Tectonic spreading plus production-induced surface change over the geothermal field — both visible in the same interferogram."],
  },
];

/**
 * CLUI-register captions. The Center for Land Use Interpretation describes a
 * place by what is physically there and who operates it, in flat declarative
 * prose, without adjectives of awe. These follow that register deliberately.
 */
export const CLUI_CAPTIONS = [
  {
    id: "clui-cajon",
    lon: -117.45,
    lat: 34.33,
    title: "Cajon Pass",
    text: "A gap in the mountains produced by the San Andreas fault. Two railroads, an interstate highway, a refined-products pipeline, a natural gas transmission line, and a state aqueduct pass through it. It burned in 2016.",
  },
  {
    id: "clui-elmirage",
    lon: -117.605,
    lat: 34.633,
    title: "El Mirage Dry Lake",
    text: "A flat clay surface, approximately 3,000 acres, administered by the Bureau of Land Management. Used for land speed record attempts, glider operations, off-highway vehicle recreation, and motion picture production. A film set representing an airfield was built and destroyed here in 1996.",
  },
  {
    id: "clui-edwards",
    lon: -117.891,
    lat: 34.905,
    title: "Edwards Air Force Base",
    text: "A flight test installation of approximately 470 square miles, built around a dry lakebed used as a runway. Jet fuel arrives by underground pipeline from Colton, 55 miles south.",
  },
  {
    id: "clui-kern",
    lon: -118.9553,
    lat: 35.4519,
    title: "Kern River Oil Field",
    text: "An oilfield in operation since 1899. The oil is too viscous to pump cold, so steam is manufactured on site and injected into the ground. The field is a machine for converting natural gas into heavy oil.",
  },
  {
    id: "clui-salton",
    lon: -115.6,
    lat: 33.19,
    title: "Salton Sea Geothermal Field",
    text: "Eleven power plants extracting heat from brine at depths of 1,500 to 2,500 metres. The brine also contains lithium. The sea beside it is an accident of a canal failure in 1905 and is shrinking.",
  },
  {
    id: "clui-aqueduct",
    lon: -118.87,
    lat: 35.03,
    title: "Edmonston Pumping Plant",
    text: "Fourteen pumps lift water 1,926 feet over a mountain range. The plant is among the largest single consumers of electricity in the state. The water is going to Los Angeles.",
  },
  {
    id: "clui-fortirwin",
    lon: -116.685,
    lat: 35.263,
    title: "National Training Center, Fort Irwin",
    text: "A maneuver area of roughly 1,000 square miles containing constructed villages used for rehearsal. Water is drawn from local basins. There is no aqueduct.",
  },
  {
    id: "clui-colton",
    lon: -117.32,
    lat: 34.06,
    title: "North Colton Terminal",
    text: "Forty-three acres of tanks holding approximately 165,600 barrels. Two pipelines leave north through the pass. One of them ends in Nevada.",
  },
];
