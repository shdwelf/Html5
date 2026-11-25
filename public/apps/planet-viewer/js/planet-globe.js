/** PLANET VIEWER · 4DWM — the globe plate (S4 tail, round 44).
 *
 *  Reuses the Red October globe for the planet viewer, as sequenced in
 *  docs/agent-backlog-2026-10-21.md (S4): the orthographic projection is
 *  imported, not copied, from the Red October command viewer's core
 *  (apps/red-october-command-viewer/core.js `projectOrthographic`), and
 *  the coastlines are the same bundled low-resolution Natural Earth
 *  country outlines (vendor/world/countries.geo.json; see
 *  vendor/world/README.md) that the Red October globe draws.
 *
 *  What is plotted on it: the country viewer's capital markers
 *  (js/country-data.js Factbook profiles whose capital carries
 *  coordinates; capital-less profiles are skipped, never placed).
 *  Country reference points are not used for markers -
 *  capitals are the labelled places. PC Globe (1990) records are NOT
 *  plotted: their binary map payload is reported undecoded by
 *  tools/pcglobe/PcGlobeReader.java, so inventing coordinates for its
 *  features would be fabrication. The decoded PC Globe country and
 *  name indexes are available as an index-only plate (names and label
 *  strings, no coordinates) via js/pcglobe-index-data.js.
 *
 *  Pure functions on plain data, like the rest of the planet viewer:
 *  the page (js/planet-viewer-4dwm.js) owns the canvas, this module owns
 *  the geometry.
 */

import { projectOrthographic } from "../apps/red-october-command-viewer/core.js";

export { projectOrthographic };

export const GLOBE_PROVENANCE = {
  projection: "orthographic, imported from apps/red-october-command-viewer/core.js (Red October globe)",
  coastlines: "vendor/world/countries.geo.json - low-resolution Natural Earth country outlines, coastline context only",
  markers: "js/country-data.js capitals (CIA World Factbook via factbook/factbook.json, CC0)",
};

/**
 * Capital markers from country-data rows. Rows whose capital carries no
 * finite coordinates are skipped and counted, never placed at 0,0.
 */
export function globeMarkers(countries) {
  const markers = [];
  let skipped = 0;
  for (const c of countries) {
    const cap = c.capital || {};
    if (Number.isFinite(cap.lat) && Number.isFinite(cap.lon)) {
      markers.push({ code: c.code, name: c.name, capital: cap.name || "", lat: cap.lat, lon: cap.lon });
    } else {
      skipped++;
    }
  }
  return { markers, skipped };
}

/**
 * Markers on the visible hemisphere for a globe centred at
 * (centerLat, centerLon), projected to unit-disc coordinates
 * (x right, y up) and sorted back-to-front (limb first).
 */
export function visibleMarkers(markers, centerLat, centerLon) {
  const out = [];
  for (const m of markers) {
    const p = projectOrthographic(m.lat, m.lon, centerLat, centerLon);
    if (p.visible) out.push({ ...m, x: p.x, y: p.y, z: p.z });
  }
  out.sort((a, b) => a.z - b.z);
  return out;
}

/** Graticule as [lon, lat] point lists: meridians and parallels. */
export function graticule(stepDeg = 20) {
  const meridians = [];
  for (let lon = -180; lon < 180; lon += stepDeg) {
    const line = [];
    for (let lat = -90; lat <= 90; lat += 5) line.push([lon, lat]);
    meridians.push(line);
  }
  const parallels = [];
  for (let lat = -80; lat <= 80; lat += stepDeg) {
    const line = [];
    for (let lon = -180; lon <= 180; lon += 5) line.push([lon, lat]);
    parallels.push(line);
  }
  return { meridians, parallels };
}

/**
 * Flatten a GeoJSON FeatureCollection of Polygon/MultiPolygon country
 * outlines into a list of rings, each a list of [lon, lat] pairs.
 * Coordinates are passed through verbatim - this is coastline context,
 * not a survey product.
 */
export function coastlineRings(geojson) {
  const rings = [];
  const features = geojson && Array.isArray(geojson.features) ? geojson.features : [];
  for (const f of features) {
    const g = f && f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      for (const ring of g.coordinates) rings.push(ring);
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates) for (const ring of poly) rings.push(ring);
    }
  }
  return rings;
}

/**
 * Project one [lon, lat] ring to visible-disc segments: runs of
 * consecutive visible points (unit-disc x/y, y up). Points on the far
 * hemisphere break the segment - nothing is drawn across the limb.
 */
export function projectSegments(ring, centerLat, centerLon) {
  const segments = [];
  let cur = null;
  for (const [lon, lat] of ring) {
    const p = projectOrthographic(lat, lon, centerLat, centerLon);
    if (p.visible) {
      if (!cur) {
        cur = [];
        segments.push(cur);
      }
      cur.push({ x: p.x, y: p.y, z: p.z });
    } else {
      cur = null;
    }
  }
  return segments.filter((s) => s.length >= 2);
}
