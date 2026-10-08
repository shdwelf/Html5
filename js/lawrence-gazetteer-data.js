/**
 * LAWRENCE, KANSAS — local USGS GNIS seed register.
 *
 * Data was queried from the official USGS National Map Gazetteer ArcGIS
 * MapServer on 2026-10-08. Each FEATURE_ID below is the service's `gaz_id`;
 * coordinates are returned geometry in EPSG:4326, not hand-placed points.
 * Only records with a GNIS feature and an in-frame returned coordinate are
 * included. Roads, campuses, and other cultural sites are intentionally not
 * invented or conflated with GNIS records. User geocaches are imported from
 * GPX and remain FEATURE_ID=null.
 *
 * Row shape: [name, featureClass, FTT, county, lat, lon, elevM|null,
 *             GNIS_FEATURE_ID|null, verified(0|1), note, metadata]
 */

const GNIS_ROOT = "https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer";

export const GAZ_META = {
  title: "USGS GNIS gazetteer — Lawrence, Kansas",
  standard: "USGS National Map Gazetteer / GNIS, EPSG:4326",
  source: `${GNIS_ROOT} — official feature-layer queries (layers 3, 6, 7)`,
  retrieved: "2026-10-08",
  bbox: { lon0: -95.31, lat0: 38.88, lon1: -95.15, lat1: 39.04 },
  rowCount: 5,
  verified: 5,
  unverified: 0,
  tiers: { official: 5, community: 0, context: 0 },
  license: "USGS GNIS factual names and coordinates are U.S. Government work (17 USC 105).",
  note: "No context coordinates are fabricated. Curated city-specific sites can be added only after their source coordinates have been cross-checked.",
};

export const GAZ_CLASSES = ["Geocache", "Lake", "Populated Place", "Stream"];

export const GAZ_ROWS = [
  [
    "Lawrence",
    "Populated Place",
    "pop.place",
    "Douglas",
    38.971675824003874,
    -95.235257697033887,
    null,
    "479145",
    1,
    "Official GNIS multipoint geometry contains two city points; this row uses the in-frame central point. Coordinates are returned by the USGS query, not a street-address geocode.",
    {
      tier: "official",
      source: `${GNIS_ROOT}/3/query?where=gaz_name='Lawrence' AND state_alpha='KS'`,
      featureClass: "Populated Place",
      serviceField: "gaz_id",
    },
  ],
  [
    "Kansas River",
    "Stream",
    "hydro.stream",
    "Douglas",
    39.005563828421565,
    -95.247480004109718,
    null,
    "485184",
    1,
    "USGS GNIS returns the named stream as multipoint geometry. This is the returned point in Douglas County inside the Lawrence frame; the pin is not a surveyed bank location or a full river line.",
    {
      tier: "official",
      source: `${GNIS_ROOT}/6/query?where=gaz_name='Kansas River' AND state_alpha='KS'`,
      featureClass: "Stream",
      serviceField: "gaz_id",
    },
  ],
  [
    "Wakarusa River",
    "Stream",
    "hydro.stream",
    "Douglas",
    38.911121512695331,
    -95.255813797171371,
    null,
    "482756",
    1,
    "USGS GNIS returns the named stream as multipoint geometry. This is one returned Douglas County point within the frame; it is not a surveyed channel trace.",
    {
      tier: "official",
      source: `${GNIS_ROOT}/6/query?where=gaz_name='Wakarusa River' AND state_alpha='KS'`,
      featureClass: "Stream",
      serviceField: "gaz_id",
    },
  ],
  [
    "Lake View Lake",
    "Lake",
    "hydro.lake",
    "Douglas",
    39.012230227007983,
    -95.301647519223479,
    null,
    "478818",
    1,
    "USGS GNIS point geometry; near the west/north edge of the theater frame.",
    {
      tier: "official",
      source: `${GNIS_ROOT}/7/query?where=gaz_name LIKE '%Lake%' AND state_alpha='KS' (spatially filtered to Lawrence frame)`,
      featureClass: "Lake",
      serviceField: "gaz_id",
    },
  ],
  [
    "Potter Lake",
    "Lake",
    "hydro.lake",
    "Douglas",
    38.960326978991638,
    -95.248737397572469,
    null,
    "479154",
    1,
    "USGS GNIS point geometry; located on the Mount Oread / KU side of Lawrence.",
    {
      tier: "official",
      source: `${GNIS_ROOT}/7/query?where=gaz_name LIKE '%Lake%' AND state_alpha='KS' (spatially filtered to Lawrence frame)`,
      featureClass: "Lake",
      serviceField: "gaz_id",
    },
  ],
];
