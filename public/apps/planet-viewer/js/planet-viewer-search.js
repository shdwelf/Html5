/**
 * Resolve an offline Gazetteer result to the best place to view it.
 *
 * Search spans a small, multi-city subset while the terrain viewer has only
 * a few DEM plates. Points inside a plate use that local terrain; every other
 * valid point falls back to the orthographic globe instead of appearing to do
 * nothing. This module is deliberately DOM- and Three.js-free.
 */
export function matchPcGlobeFeatureCoordinates(featureLabels, gazetteerRows) {
  const key = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase();
  const byName = new Map();
  for (const row of gazetteerRows ?? []) {
    const name = Array.isArray(row) ? row[0] : row?.name;
    const lat = Array.isArray(row) ? row[4] : row?.lat;
    const lon = Array.isArray(row) ? row[5] : row?.lon;
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const k = key(name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(row);
  }
  const matches = [];
  for (const label of featureLabels ?? []) {
    for (const point of byName.get(key(label)) ?? []) matches.push({ label, point });
  }
  return matches;
}

export function locateGazetteerPoint(plates, plateOrder, point) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return null;

  for (const id of plateOrder ?? []) {
    const plate = plates?.[id];
    const bbox = plate?.grid?.bbox;
    if (!Array.isArray(bbox) || bbox.length !== 4) continue;
    const [west, south, east, north] = bbox;
    if (point.lon >= west && point.lon <= east && point.lat >= south && point.lat <= north) {
      return { kind: "terrain", plateId: id };
    }
  }

  return { kind: "globe", lat: point.lat, lon: point.lon };
}
