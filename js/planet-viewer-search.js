/**
 * Resolve an offline Gazetteer result to the best place to view it.
 *
 * Search spans a small, multi-city subset while the terrain viewer has only
 * a few DEM plates. Points inside a plate use that local terrain; every other
 * valid point falls back to the orthographic globe instead of appearing to do
 * nothing. This module is deliberately DOM- and Three.js-free.
 */
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
