/**
 * SOCAL SUBSURFACE — vector overlay layer.
 *
 * Builds four draped vector overlays on the same terrain surface the
 * infrastructure theater uses:
 *
 *   fires   historical fire perimeters (WIFIRE / CAL FIRE FRAP lineage)
 *   frames  USGS 7.5′ quad graticule + 1° 3DEP DEM delivery tiles
 *   sar     Sentinel-1 style descending swath + InSAR deformation bowls
 *   clui    Center for Land Use Interpretation register captions
 *
 * Everything is drawn from lon/lat through the shared projection in
 * socal-geo.js, so overlays sit on the hillsides instead of floating.
 */

import * as THREE from "../vendor/three.module.min.js";
import { elevY, elevationAt, lonLatFromXZ, pointInRing, project, ringKm2 } from "./socal-geo.js";
import { BBOX } from "./socal-subsurface-data.js";
import {
  ACRE_KM2,
  CLUI_CAPTIONS,
  DEFORMATION,
  FIRES,
  FIRE_DECADE_COLOR,
  FRAMES,
  SAR_SWATHS,
} from "./socal-overlays-data.js";

/* --------------------------------------------------------- ring synthesis */

/** Deterministic 0..1 hash so every reload draws the identical perimeter. */
function seeded(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Generalized perimeter for a fire: an organic closed ring around the
 * centroid, oriented with aspect/rot, then uniformly scaled so its planar area
 * equals the published acreage. The line's wiggle is synthetic; its location,
 * orientation and enclosed area are not.
 */
export function fireRing(fire, steps = 96) {
  const rnd = seeded(fire.id);
  const harmonics = [
    { k: 2, a: 0.16 + rnd() * 0.12, p: rnd() * 6.283 },
    { k: 3, a: 0.12 + rnd() * 0.1, p: rnd() * 6.283 },
    { k: 5, a: 0.07 + rnd() * 0.07, p: rnd() * 6.283 },
    { k: 9, a: 0.03 + rnd() * 0.04, p: rnd() * 6.283 },
  ];
  const aspect = fire.aspect || 1;
  const rot = fire.rot || 0;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const unit = [];
  for (let i = 0; i < steps; i++) {
    const th = (i / steps) * Math.PI * 2;
    let r = 1;
    for (const h of harmonics) r += h.a * Math.sin(h.k * th + h.p);
    const ux = r * Math.cos(th) * aspect;
    const uy = r * Math.sin(th);
    unit.push([ux * cos - uy * sin, ux * sin + uy * cos]);
  }

  // Scale so planar area == published acreage.
  const targetKm2 = fire.acres * ACRE_KM2;
  const unitRing = unit.map(([ux, uy]) => [fire.lon + ux * 0.01, fire.lat + uy * 0.01]);
  const unitKm2 = ringKm2(unitRing);
  const k = Math.sqrt(targetKm2 / unitKm2) * 0.01;
  return unit.map(([ux, uy]) => [fire.lon + ux * k, fire.lat + uy * k]);
}

/* ------------------------------------------------------------- geometry io */

function drapedPoints(ring, lift = 0.05, close = true) {
  const pts = ring.map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    return new THREE.Vector3(x, elevY(elevationAt(lon, lat)) + lift, z);
  });
  if (close && pts.length) pts.push(pts[0].clone());
  return pts;
}

function lineFromRing(ring, color, opacity, lift) {
  const geo = new THREE.BufferGeometry().setFromPoints(drapedPoints(ring, lift));
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

/**
 * Translucent cap over a perimeter. The contour vertices are draped; interior
 * triangles span between them, so over sharp ridges the cap can clip into
 * rock. That is deliberate — it stays honest about being a 2D polygon laid on
 * a 3D surface rather than pretending to be a burn-severity raster.
 */
function fillFromRing(ring, color, opacity, lift) {
  const shape = new THREE.Shape(
    ring.map(([lon, lat]) => {
      const [x, z] = project(lon, lat);
      return new THREE.Vector2(x, z); // Shape's Y axis carries our Z
    }),
  );
  const geo = new THREE.ShapeGeometry(shape);
  const src = geo.attributes.position;
  const out = new Float32Array(src.count * 3);
  for (let i = 0; i < src.count; i++) {
    const x = src.getX(i);
    const z = src.getY(i);
    const [lon, lat] = lonLatFromXZ(x, z);
    out[i * 3] = x;
    out[i * 3 + 1] = elevY(elevationAt(lon, lat)) + lift;
    out[i * 3 + 2] = z;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(out, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  return new THREE.Mesh(geo, mat);
}

/* ----------------------------------------------------------------- builder */

export function buildOverlays() {
  const root = new THREE.Group();
  root.name = "overlays";

  const groups = {
    fires: new THREE.Group(),
    frames: new THREE.Group(),
    sar: new THREE.Group(),
    clui: new THREE.Group(),
  };
  for (const g of Object.values(groups)) root.add(g);

  const rings = new Map();
  const pickables = [];
  const rebuilders = [];

  /* ------------------------------------------------------------- fires --- */

  for (const fire of FIRES) {
    const ring = fireRing(fire);
    rings.set(fire.id, ring);
    const decade = Math.floor(fire.year / 10) * 10;
    const color = new THREE.Color(FIRE_DECADE_COLOR[decade] || "#f97316");

    const g = new THREE.Group();
    const outline = lineFromRing(ring, color, 0.95, 0.08);
    const fill = fillFromRing(ring, color, 0.16, 0.06);
    const record = {
      ...fire,
      id: fire.id,
      layer: "fires",
      tier: "official",
      name: `${fire.name} (${fire.year})`,
      facts: [
        `Final reported size ${fire.acres.toLocaleString()} acres (${(fire.acres * ACRE_KM2).toFixed(0)} km²), start ${fire.start}.`,
        `Lead agency: ${fire.agency || "multiple"}.`,
        ...(fire.notes || []),
        "Perimeter geometry here is a generalized ring scaled to the published acreage — swap in CAL FIRE FRAP GeoJSON for the true line.",
      ],
      sources: [
        "WIFIRE Firemap (UC San Diego / SDSC)",
        "CAL FIRE FRAP historical fire perimeters (firep series, 1878–present)",
        "USFS / InciWeb incident reporting",
      ],
    };
    fill.userData = { record, kind: "fire" };
    outline.userData = { record, kind: "fire" };
    g.add(fill, outline);
    groups.fires.add(g);
    pickables.push(fill);

    rebuilders.push(() => {
      const r = rings.get(fire.id);
      const newOutline = lineFromRing(r, color, 0.95, 0.08);
      outline.geometry.dispose();
      outline.geometry = newOutline.geometry;
      const newFill = fillFromRing(r, color, 0.16, 0.06);
      fill.geometry.dispose();
      fill.geometry = newFill.geometry;
    });
  }

  /* ------------------------------------------------------------ frames --- */

  for (const frame of Object.values(FRAMES)) {
    const g = new THREE.Group();
    g.name = frame.id;
    const color = new THREE.Color(frame.color);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: frame.id === "quad" ? 0.18 : 0.45,
    });
    const segs = [];
    const lift = frame.id === "quad" ? 0.03 : 0.09;
    const snap = (v, s) => Math.ceil(v / s) * s;
    for (let lon = snap(BBOX.lon0, frame.stepLon); lon <= BBOX.lon1; lon += frame.stepLon) {
      for (let lat = BBOX.lat0; lat < BBOX.lat1; lat += 0.05) {
        const a = project(lon, lat);
        const b = project(lon, Math.min(lat + 0.05, BBOX.lat1));
        segs.push(
          new THREE.Vector3(a[0], elevY(elevationAt(lon, lat)) + lift, a[1]),
          new THREE.Vector3(b[0], elevY(elevationAt(lon, lat + 0.05)) + lift, b[1]),
        );
      }
    }
    for (let lat = snap(BBOX.lat0, frame.stepLat); lat <= BBOX.lat1; lat += frame.stepLat) {
      for (let lon = BBOX.lon0; lon < BBOX.lon1; lon += 0.05) {
        const a = project(lon, lat);
        const b = project(Math.min(lon + 0.05, BBOX.lon1), lat);
        segs.push(
          new THREE.Vector3(a[0], elevY(elevationAt(lon, lat)) + lift, a[1]),
          new THREE.Vector3(b[0], elevY(elevationAt(lon + 0.05, lat)) + lift, b[1]),
        );
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(segs);
    const mesh = new THREE.LineSegments(geo, mat);
    mesh.userData = {
      kind: "frame",
      record: {
        id: frame.id,
        layer: "frames",
        tier: "official",
        name: frame.name,
        facts: [frame.note],
        sources: ["USGS 3D Elevation Program (3DEP)", "USGS Historical Topographic Map Collection"],
      },
    };
    g.add(mesh);
    g.visible = frame.id === "demTile";
    groups.frames.add(g);
    rebuilders.push(() => {
      /* graticule rebuild is expensive and visually marginal; skip on scale change */
    });
  }

  /* --------------------------------------------------------------- sar --- */

  for (const swath of SAR_SWATHS) {
    const color = new THREE.Color(swath.color);
    const halfDeg = swath.widthKm / 2 / 111.32;
    const hdg = (swath.heading * Math.PI) / 180;
    const along = 3.2; // degrees of latitude drawn
    const edges = [];
    for (const side of [-1, 1]) {
      const pts = [];
      for (let t = -along; t <= along; t += 0.2) {
        const lat = swath.centerLat + t * Math.cos(hdg);
        const lon =
          swath.centerLon + t * Math.sin(hdg) / Math.cos((lat * Math.PI) / 180) + (side * halfDeg) / Math.cos((lat * Math.PI) / 180);
        pts.push([lon, lat]);
      }
      edges.push(pts);
    }
    const g = new THREE.Group();
    for (const pts of edges) {
      const geo = new THREE.BufferGeometry().setFromPoints(drapedPoints(pts, 0.6, false));
      g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 })));
    }
    // Ribbon fill between the two edges, held above the terrain like a look direction.
    const verts = [];
    for (let i = 0; i < edges[0].length; i++) {
      const a = project(...edges[0][i]);
      const b = project(...edges[1][i]);
      verts.push(new THREE.Vector3(a[0], 0.6 + elevY(2600), a[1]), new THREE.Vector3(b[0], 0.6 + elevY(2600), b[1]));
    }
    const ribbon = new THREE.BufferGeometry();
    const arr = [];
    for (let i = 0; i < verts.length - 3; i += 2) {
      arr.push(verts[i], verts[i + 1], verts[i + 2], verts[i + 1], verts[i + 3], verts[i + 2]);
    }
    ribbon.setFromPoints(arr);
    const ribbonMesh = new THREE.Mesh(
      ribbon,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
    );
    ribbonMesh.userData = {
      kind: "sar",
      record: {
        id: swath.id,
        layer: "sar",
        tier: "official",
        name: swath.name,
        facts: swath.notes,
        sources: ["ESA Copernicus Sentinel-1 product specification", "NASA/ISRO NISAR mission documentation", "JPL ARIA / UAVSAR"],
      },
    };
    g.add(ribbonMesh);
    pickables.push(ribbonMesh);
    groups.sar.add(g);
  }

  for (const d of DEFORMATION) {
    const color = new THREE.Color(d.color);
    const g = new THREE.Group();
    for (let k = 1; k <= 3; k++) {
      const ring = [];
      const rDeg = (d.radiusKm * (k / 3)) / 111.32;
      for (let i = 0; i <= 64; i++) {
        const th = (i / 64) * Math.PI * 2;
        ring.push([d.lon + (rDeg * Math.cos(th)) / Math.cos((d.lat * Math.PI) / 180), d.lat + rDeg * Math.sin(th)]);
      }
      const geo = new THREE.BufferGeometry().setFromPoints(drapedPoints(ring, 0.07, false));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 + k * 0.15 }));
      line.userData = {
        kind: "sar",
        record: {
          id: d.id,
          layer: "sar",
          tier: "community",
          name: d.name,
          facts: [...(d.notes || []), `Drawn as concentric fringes at ${d.radiusKm} km — a cartoon of an interferogram, not one.`],
          sources: ["USGS / JPL InSAR subsidence studies", "CA DWR SGMA subsidence monitoring"],
        },
      };
      g.add(line);
      pickables.push(line);
    }
    groups.sar.add(g);
  }

  /* -------------------------------------------------------------- clui --- */

  const cluiPoints = [];
  for (const cap of CLUI_CAPTIONS) {
    const [x, z] = project(cap.lon, cap.lat);
    const y = elevY(elevationAt(cap.lon, cap.lat));
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xe5e7eb }),
    );
    marker.position.set(x, y + 0.35, z);
    marker.userData = {
      kind: "clui",
      record: {
        id: cap.id,
        layer: "clui",
        tier: "context",
        name: cap.title,
        facts: [cap.text],
        sources: ["Register modelled on the Center for Land Use Interpretation, Culver City / Wendover"],
      },
    };
    groups.clui.add(marker);
    pickables.push(marker);
    cluiPoints.push({ cap, marker });
  }

  function rebuild() {
    for (const fn of rebuilders) fn();
    for (const { cap, marker } of cluiPoints) {
      marker.position.y = elevY(elevationAt(cap.lon, cap.lat)) + 0.35;
    }
  }

  /**
   * Which fire perimeters does a corridor actually run through, and for how
   * much of its plotted length? This is the whole point of putting the burn
   * history and the buried utilities in one scene.
   */
  function corridorFireCrossings(corridorPath, sampleDeg = 0.01) {
    const hits = new Map();
    let total = 0;
    let prev = null;
    for (let i = 0; i < corridorPath.length - 1; i++) {
      const [aLon, aLat] = corridorPath[i];
      const [bLon, bLat] = corridorPath[i + 1];
      const d = Math.hypot(bLon - aLon, bLat - aLat);
      const n = Math.max(1, Math.ceil(d / sampleDeg));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        const p = [aLon + (bLon - aLon) * t, aLat + (bLat - aLat) * t];
        const segKm = (d / n) * 111.32;
        total += segKm;
        for (const fire of FIRES) {
          const ring = rings.get(fire.id);
          if (!pointInRing(p, ring)) continue;
          const rec = hits.get(fire.id) || { fire, km: 0 };
          rec.km += segKm;
          hits.set(fire.id, rec);
        }
        prev = p;
      }
    }
    void prev;
    return { totalKm: total, hits: [...hits.values()].sort((a, b) => b.km - a.km) };
  }

  return { root, groups, rings, pickables, rebuild, cluiPoints, corridorFireCrossings };
}
