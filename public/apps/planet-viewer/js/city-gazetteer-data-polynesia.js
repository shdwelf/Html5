// Name-only locality index entry for Bora Bora.
//
// This is not a country profile and deliberately contains no coordinates.
// The single upstream candidate is ODbL-1.0 and has not been independently
// corroborated; see resources/country-viewer/bora-bora-place-register-2026-11-09.json
// and the bundled ODbL license text before redistributing this row.
export const GAZ_META = {
  generated: "2026-11-09",
  source: "Bora-Bora place-name candidate from dr5hn/countries-states-cities-database, pinned at 30fcbf267d538f96dafd0e4e451f5e43b2989700; ODbL-1.0; coordinates withheld",
  crs: "EPSG:4326",
  bbox: null,
  rowCount: 1,
  verified: 0,
  unverified: 1,
  license: "ODbL-1.0; full text bundled at resources/country-viewer/licenses/ODbL-1.0.md",
  regen: "curated from resources/country-viewer/bora-bora-place-register-2026-11-09.json"
};

export const GAZ_CLASSES = ["Locality"];

/** [name, fclass, ftt, area/context, lat|null, lon|null, elevM|null, gnisId|null, verified 0|1, note|null, source|null] */
export const GAZ_ROWS = [[
  "Bora Bora",
  "Locality",
  "pop.ppl",
  "French Polynesia",
  null,
  null,
  null,
  null,
  0,
  "Name-only place lookup in French Polynesia; not a country. The pinned ODbL candidate's coordinates are withheld pending independent corroboration.",
  "resources/country-viewer/bora-bora-place-register-2026-11-09.json"
]];
