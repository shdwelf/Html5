#!/usr/bin/env node
/**
 * Refresh/audit the curated SoCal GNIS register from USGS The National Map.
 *
 * Usage:
 *   node tools/socal-gazetteer-query.mjs > /tmp/socal-gnis.json
 *
 * The output is review material; it never overwrites the shipped data. This
 * keeps a federal source refresh from silently moving labels or introducing
 * thousands of low-value points into the offline theater.
 */
import { SOCAL_GAZETTEER } from "../js/socal-gazetteer-data.js";

const SERVICE = "https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer";
const BBOX = "-121.6,32.45,-114.0,38.35";
const LAYERS = [3, 5, 7]; // populated places, landforms, other hydrographic features
const CHUNK = 20;
const rows = [];

const q = (value) => `'${value.replaceAll("'", "''")}'`;
const distance2 = (a, b) => (a[0] - b.lon) ** 2 + (a[1] - b.lat) ** 2;

for (const layer of LAYERS) {
  for (let start = 0; start < SOCAL_GAZETTEER.length; start += CHUNK) {
    const wanted = SOCAL_GAZETTEER.slice(start, start + CHUNK);
    const params = new URLSearchParams({
      where: `state_alpha='CA' AND gaz_name IN (${wanted.map((r) => q(r.name)).join(",")})`,
      geometry: BBOX,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "gaz_id,gaz_name,gaz_featureclass,county_name",
      returnGeometry: "true",
      outSR: "4326",
      geometryPrecision: "6",
      f: "json",
    });
    const response = await fetch(`${SERVICE}/${layer}/query?${params}`);
    if (!response.ok) throw new Error(`USGS layer ${layer}: HTTP ${response.status}`);
    const body = await response.json();
    if (body.error) throw new Error(`USGS layer ${layer}: ${JSON.stringify(body.error)}`);
    for (const feature of body.features || []) {
      const a = feature.attributes;
      const candidates = wanted.filter((r) => r.name === a.gaz_name);
      const points = feature.geometry?.points || (feature.geometry?.x ? [[feature.geometry.x, feature.geometry.y]] : []);
      for (const current of candidates) {
        const point = points.reduce((best, p) => !best || distance2(p, current) < distance2(best, current) ? p : best, null);
        if (!point) continue;
        rows.push({
          gnisId: a.gaz_id,
          name: a.gaz_name,
          featureClass: a.gaz_featureclass,
          county: a.county_name,
          lon: point[0],
          lat: point[1],
          driftKmApprox: Math.hypot(point[0] - current.lon, point[1] - current.lat) * 100,
          currentId: current.id,
          layer,
        });
      }
    }
  }
}

// Keep the closest service result for each shipped record.
const best = new Map();
for (const row of rows) {
  const old = best.get(row.currentId);
  if (!old || row.driftKmApprox < old.driftKmApprox) best.set(row.currentId, row);
}
const output = SOCAL_GAZETTEER.map((current) => ({
  current,
  usgs: best.get(current.id) || null,
}));
console.log(JSON.stringify({ source: SERVICE, queried: new Date().toISOString(), bbox: BBOX, records: output }, null, 2));
