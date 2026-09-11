#!/usr/bin/env node
/**
 * build_globe_data.mjs — decode config/land-110m.topojson (Natural Earth via
 * world-atlas 2.0.2, public domain) into config/coast-110m.json, the ring
 * soup the wasm globe renders.
 *
 *   node tools/build_globe_data.mjs          # write config/coast-110m.json
 *   node tools/build_globe_data.mjs --check  # fail if the checked-in file drifts
 *
 * TopoJSON arcs are delta-encoded quantized integers; a negative arc index
 * ~i means "arc i walked backwards". Every land ring becomes one polyline
 * (closed: first point repeated), coordinates rounded to 3 decimals — about
 * 100 m at the equator, far below a pixel at 110 m resolution. Shared
 * borders are drawn twice; at 5 k points the overdraw is unmeasurable.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "config", "land-110m.topojson");
const OUT = join(ROOT, "config", "coast-110m.json");
const CHECK = process.argv.includes("--check");

function decodeArcs(topo) {
  const { scale, translate } = topo.transform;
  return topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
}

function ringPoints(ring, arcs) {
  const pts = [];
  for (const idx of ring) {
    const rev = idx < 0;
    const arc = arcs[rev ? ~idx : idx];
    const seq = rev ? [...arc].reverse() : arc;
    // Stitch arcs: skip the joint point every arc after the first.
    for (const p of pts.length ? seq.slice(1) : seq) pts.push(p);
  }
  return pts;
}

function build() {
  const topo = JSON.parse(readFileSync(SRC, "utf8"));
  const arcs = decodeArcs(topo);
  const r3 = (n) => Math.round(n * 1000) / 1000;
  const rings = [];
  const geoms = topo.objects.land.geometries;
  for (const g of geoms) {
    const polys = g.type === "Polygon" ? [g.arcs] : g.arcs;
    for (const poly of polys) {
      for (const ring of poly) {
        const pts = ringPoints(ring, arcs).map(([lon, lat]) => [r3(lon), r3(lat)]);
        if (pts.length >= 4) {
          const first = pts[0];
          const last = pts[pts.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) pts.push([...first]);
          rings.push(pts);
        }
      }
    }
  }
  const points = rings.reduce((n, r) => n + r.length, 0);
  return {
    _meta: {
      source: "config/land-110m.topojson (world-atlas 2.0.2 / Natural Earth 110m)",
      rings: rings.length,
      points,
    },
    rings,
  };
}

const out = build();
const text = JSON.stringify(out) + "\n";
console.log(`${out._meta.rings} rings, ${out._meta.points} points`);

if (CHECK) {
  const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
  if (cur === text) {
    console.log("coast-110m.json is up to date");
  } else {
    console.log("coast-110m.json is STALE (run node tools/build_globe_data.mjs)");
    process.exit(1);
  }
} else {
  writeFileSync(OUT, text);
  console.log("wrote " + OUT);
}
