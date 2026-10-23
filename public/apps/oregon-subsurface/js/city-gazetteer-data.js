/**
 * CITY SUBSURFACE — default empty gazetteer pack.
 *
 * The real packs are `js/city-gazetteer-data-<city>.js`; `city-subsurface.js`
 * loads the pack for the city named on `<body data-city="...">` and passes it
 * into the engine. This empty pack exists so the engine module can be imported
 * (and unit-tested) without a city selected.
 */

export const GAZ_META = {
  generated: "2026-10-07",
  source: "empty default pack",
  crs: "EPSG:4326",
  bbox: { lon0: -180, lon1: 180, lat0: -90, lat1: 90 },
  rowCount: 0,
  verified: 0,
  unverified: 0,
  license: "USGS GNIS / US government work (17 USC 105); geocaches are community-source records, not GNIS features.",
  regen: "node scripts/build-city-subsurface.mjs",
};

export const GAZ_CLASSES = [];

/** [name, fclass, ftt, county, lat, lon, elevM|null, gnisId|null, verified 0|1, note|null] */
export const GAZ_ROWS = [];
