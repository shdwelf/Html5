// Lightweight equirectangular country-outline renderer shared by the
// Country Viewer. Geometry is Natural Earth GeoJSON (public domain), shipped
// locally so the map works with the offline Android/Webxdc packages.

export const MAP_VIEWS = Object.freeze({
  world: Object.freeze({ label: "World", centerLon: 0, centerLat: 0, scale: 1 }),
  europe: Object.freeze({ label: "Europe", centerLon: 15, centerLat: 50, scale: 2.7 }),
  caribbean: Object.freeze({ label: "Caribbean", centerLon: -70, centerLat: 18, scale: 3.4 }),
  pacific: Object.freeze({ label: "Pacific", centerLon: 170, centerLat: 0, scale: 2.5 }),
});

export function projectMapPoint(lon, lat, width, height, view = MAP_VIEWS.world) {
  const scale = Number.isFinite(view?.scale) && view.scale > 0 ? view.scale : 1;
  const centerLon = Number.isFinite(view?.centerLon) ? view.centerLon : 0;
  const centerLat = Number.isFinite(view?.centerLat) ? view.centerLat : 0;
  const panX = Number.isFinite(view?.panX) ? view.panX : 0;
  const panY = Number.isFinite(view?.panY) ? view.panY : 0;
  const delta = lon - centerLon;
  let wrappedDelta = ((delta + 540) % 360) - 180;
  // Preserve a distinct right-hand world edge for the default projection,
  // while still wrapping longitudes for regional views near the dateline.
  if (wrappedDelta === -180 && delta > 0) wrappedDelta = 180;
  return [
    width / 2 + (wrappedDelta / 360) * width * scale + panX,
    height / 2 - ((lat - centerLat) / 180) * height * scale + panY,
  ];
}

function polygonRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates ?? [];
  if (geometry.type === "MultiPolygon") return (geometry.coordinates ?? []).flat();
  return [];
}

function drawRing(ctx, ring, width, height, view) {
  if (!Array.isArray(ring) || ring.length < 2) return;
  let previous = null;
  let penDown = false;
  ctx.beginPath();
  for (const coordinate of ring) {
    const lon = coordinate?.[0], lat = coordinate?.[1];
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    if (previous && Math.abs(lon - previous[0]) > 180) {
      // GeoJSON rings can cross the antimeridian. Start a new segment instead
      // of drawing a false line all the way across the equirectangular map.
      ctx.stroke();
      ctx.beginPath();
      penDown = false;
    }
    const [x, y] = projectMapPoint(lon, lat, width, height, view);
    if (!penDown) {
      ctx.moveTo(x, y);
      penDown = true;
    } else {
      ctx.lineTo(x, y);
    }
    previous = [lon, lat];
  }
  if (penDown) ctx.stroke();
}

export function drawCountryOutlines(ctx, featureCollection, width, height, view = MAP_VIEWS.world) {
  const features = featureCollection?.type === "FeatureCollection" && Array.isArray(featureCollection.features)
    ? featureCollection.features
    : [];
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  ctx.strokeStyle = "rgba(122, 177, 217, 0.62)";
  ctx.lineWidth = Math.min(2.25, Math.max(0.75, 0.9 + (view?.scale ?? 1) * 0.22));
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const feature of features) {
    for (const ring of polygonRings(feature?.geometry)) {
      drawRing(ctx, ring, width, height, view);
    }
  }
  ctx.restore();
  return features.length;
}

export function nearestCountryAt(x, y, countries, width, height, view = MAP_VIEWS.world, maxDistance = 18) {
  let nearest = null;
  let nearestDistance = maxDistance;
  for (const country of countries ?? []) {
    if (!Number.isFinite(country?.lon) || !Number.isFinite(country?.lat)) continue;
    const [px, py] = projectMapPoint(country.lon, country.lat, width, height, view);
    const distance = Math.hypot(px - x, py - y);
    if (distance <= nearestDistance) {
      nearest = country;
      nearestDistance = distance;
    }
  }
  return nearest;
}
