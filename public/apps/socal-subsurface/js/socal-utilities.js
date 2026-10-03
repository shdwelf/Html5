/**
 * SOCAL SUBSURFACE — utilities, microwave skyway and orbital windows (scene).
 *
 * Three groups, one builder:
 *
 *   power      500 kV / HVDC corridors draped on the terrain, plus the bulk
 *              substations and converter stations they land at
 *   longlines  AT&T Long Lines relay towers and the hops between them, each
 *              hop checked against the terrain with the same propagation core
 *              the broadcast layer uses — a 1960s microwave path budget,
 *              recomputed live
 *   orbital    one satellite ground track and its swath edges, drawn as thin
 *              lines across the frame. Minimal on purpose: the interesting
 *              part of an overpass is when and which way, not a model of a
 *              spacecraft
 */

import * as THREE from "../vendor/three.module.min.js";
import { elevY, elevationAt, project } from "./socal-geo.js";
import {
  CIRCUIT_CLASSES,
  LONGLINES,
  LONGLINE_BY_ID,
  LONGLINE_HOPS,
  STATION_CLASSES,
  SUBSTATIONS,
  TRANSMISSION,
} from "./socal-utilities-data.js";
import { SATELLITES, SAT_BY_ID, swathAcross, trackGeometry } from "./socal-orbital.js";
import { analyzePath, distanceKm, fresnelRadiusM } from "./socal-propagation.js";

/** Antenna centreline as a fraction of structure height where none is filed. */
const HORN_FRACTION = 0.8;

/** Densify a lon/lat polyline and drape it on the terrain. */
function drapedLine(path, { liftM = 0, stepKm = 3 } = {}) {
  const pts = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [lon0, lat0] = path[i];
    const [lon1, lat1] = path[i + 1];
    const segKm = distanceKm(lon0, lat0, lon1, lat1);
    const n = Math.max(1, Math.ceil(segKm / stepKm));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const lon = lon0 + (lon1 - lon0) * t;
      const lat = lat0 + (lat1 - lat0) * t;
      const [x, z] = project(lon, lat);
      pts.push(new THREE.Vector3(x, elevY(elevationAt(lon, lat) + liftM), z));
    }
  }
  const [lonN, latN] = path[path.length - 1];
  const [xn, zn] = project(lonN, latN);
  pts.push(new THREE.Vector3(xn, elevY(elevationAt(lonN, latN) + liftM), zn));
  return pts;
}

function lineRecord(line) {
  return {
    id: `transmission-${line.id}`,
    name: line.name,
    layer: "transmission",
    tier: line.tier,
    kind: "transmission",
    path: line.path,
    facts: [
      `${CIRCUIT_CLASSES[line.cls].name}${line.ratingMw ? ` · about ${line.ratingMw.toLocaleString()} MW` : ""} · ${line.operator}.`,
      ...line.facts,
    ],
    sources: line.sources,
  };
}

function stationRecord(st) {
  const cls = STATION_CLASSES[st.cls];
  return {
    id: `substation-${st.id}`,
    name: st.name,
    layer: "transmission",
    tier: st.tier,
    lon: st.lon,
    lat: st.lat,
    depthM: 0,
    kind: "substation",
    facts: [
      `${cls.name} · ${st.operator}.`,
      st.approx
        ? `Position is a generalized pin: ${st.positionSource}.`
        : `Position from an agency record: ${st.positionSource}.`,
      ...st.facts,
    ],
    sources: st.sources,
  };
}

function longlineRecord(site) {
  const hops = LONGLINE_HOPS.filter((h) => h.from === site.id || h.to === site.id);
  return {
    id: `longline-${site.id}`,
    name: `${site.name} — AT&T Long Lines`,
    layer: "longlines",
    tier: site.tier,
    lon: site.lon,
    lat: site.lat,
    depthM: 0,
    kind: "longline",
    facts: [
      `${site.hornBand} horns on ${site.structureM} m of structure${site.hardened ? ", hardened" : ""}${site.staffed ? ", staffed" : ", unattended"} · ${site.status}.`,
      `${hops.length} documented path${hops.length === 1 ? "" : "s"} off this site in this register.`,
      site.approx
        ? `Position is a generalized pin: ${site.positionSource}.`
        : `Position: ${site.positionSource}.`,
      ...site.facts,
    ],
    sources: site.sources,
  };
}

/** Terminal geometry for a hop: tower top positions and the path analysis. */
export function hopAnalysis(hop) {
  const a = LONGLINE_BY_ID.get(hop.from);
  const b = LONGLINE_BY_ID.get(hop.to);
  if (!a || !b) return null;
  const freqMHz = hop.band * 1000;
  // Terminal heights are pinned to the PUBLISHED site elevations, not to the
  // elevation field. We know what these summits are; what we do not yet know
  // (until a 3DEP grid is installed) is the ground between them. Letting the
  // synthetic field set the tower bases would sink every hilltop station a few
  // hundred metres and report the entire network as blocked, which would be an
  // artefact of the terrain model masquerading as a finding.
  const aglFor = (site) =>
    site.elevM + site.structureM * HORN_FRACTION - elevationAt(site.lon, site.lat);
  const analysis = analyzePath({
    elevAt: elevationAt,
    tx: { lon: a.lon, lat: a.lat, aglM: aglFor(a) },
    rx: { lon: b.lon, lat: b.lat, aglM: aglFor(b) },
    freqMHz,
    // A TD-2 radio put out single-digit watts into a high-gain horn; ERP in
    // the kilowatt class once the antenna is counted. Field strength is not
    // the question on a microwave hop — clearance is — but the path budget
    // wants a number, so this is a representative one.
    erpKw: 2,
    steps: 220,
    medianAllowanceDb: 0,
  });
  const midFresnelM = fresnelRadiusM(freqMHz, analysis.distKm / 2, analysis.distKm / 2);
  return { from: a, to: b, hop, freqMHz, analysis, midFresnelM };
}

export function buildUtilities() {
  const root = new THREE.Group();
  root.name = "utilities";

  const groups = {
    power: new THREE.Group(),
    longlines: new THREE.Group(),
    orbital: new THREE.Group(),
  };
  groups.power.name = "utilities-power";
  groups.longlines.name = "utilities-longlines";
  groups.orbital.name = "utilities-orbital";
  for (const g of Object.values(groups)) root.add(g);

  const pickables = [];
  // Kept so a vertical-exaggeration change can re-seat everything without a
  // full teardown: same contract as buildRadio().rebuild().
  const lineEntries = [];
  const stationGroups = [];
  const towerGroups = [];
  const hopEntries = [];

  /* ------------------------------------------------------------- power */

  for (const line of TRANSMISSION) {
    const cls = CIRCUIT_CLASSES[line.cls];
    const color = new THREE.Color(cls.color);
    // Conductors ride above the ground, so lift the drape by a tower height.
    const pts = drapedLine(line.path, { liftM: 45 });
    const curve = new THREE.CatmullRomCurve3(pts);
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, Math.max(24, pts.length * 2), cls.width * 0.35, 5, false),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color.clone().multiplyScalar(0.35),
        roughness: 0.45,
        metalness: 0.1,
      }),
    );
    mesh.userData = { kind: "transmission", record: lineRecord(line) };
    groups.power.add(mesh);
    pickables.push(mesh);

    // Lattice tower ticks every few samples: the visual signature of a line
    // you can see from a freeway.
    const tickPts = [];
    for (let i = 0; i < pts.length; i += 3) {
      const p = pts[i];
      tickPts.push(new THREE.Vector3(p.x, p.y, p.z), new THREE.Vector3(p.x, p.y - elevY(45), p.z));
    }
    const ticks = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(tickPts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }),
    );
    groups.power.add(ticks);
    lineEntries.push({ line, mesh, ticks, cls });
  }

  for (const st of SUBSTATIONS) {
    const cls = STATION_CLASSES[st.cls];
    const color = new THREE.Color(cls.color);
    const [x, z] = project(st.lon, st.lat);
    const y = elevY(elevationAt(st.lon, st.lat));
    const g = new THREE.Group();
    g.position.set(x, y, z);

    // Switchyard pad: a flat box, because that is what they look like.
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.03, 0.16),
      new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.3), roughness: 0.6 }),
    );
    pad.position.y = 0.015;
    pad.userData = { kind: "substation", record: stationRecord(st) };
    g.add(pad);
    pickables.push(pad);

    // Bus gantries.
    const gantry = [];
    for (let i = -1; i <= 1; i++) {
      gantry.push(new THREE.Vector3(i * 0.07, 0.0, -0.06), new THREE.Vector3(i * 0.07, 0.09, -0.06));
      gantry.push(new THREE.Vector3(i * 0.07, 0.09, -0.06), new THREE.Vector3(i * 0.07, 0.09, 0.06));
      gantry.push(new THREE.Vector3(i * 0.07, 0.0, 0.06), new THREE.Vector3(i * 0.07, 0.09, 0.06));
    }
    g.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(gantry),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }),
      ),
    );

    // Converter stations get a valve hall: a solid block, the one building on
    // site that matters.
    if (st.cls === "converter") {
      const hall = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.07, 0.07),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, emissive: 0x330a12, roughness: 0.5 }),
      );
      hall.position.set(0.05, 0.05, 0);
      g.add(hall);
    }

    // Approximate pins get a dashed ring instead of a solid one: the symbology
    // carries the evidence tier, so a generalized pin cannot be mistaken for a
    // surveyed one at a glance.
    const ringPts = [];
    const segs = st.approx ? 24 : 40;
    for (let i = 0; i <= segs; i++) {
      if (st.approx && i % 2 === 0) continue;
      const th = (i / segs) * Math.PI * 2;
      const th2 = ((i + 1) / segs) * Math.PI * 2;
      ringPts.push(
        new THREE.Vector3(Math.cos(th) * 0.19, 0.005, Math.sin(th) * 0.19),
        new THREE.Vector3(Math.cos(th2) * 0.19, 0.005, Math.sin(th2) * 0.19),
      );
    }
    g.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(ringPts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }),
      ),
    );

    groups.power.add(g);
    stationGroups.push({ st, group: g });
  }

  /* --------------------------------------------------------- longlines */

  const hopReports = [];

  for (const site of LONGLINES) {
    const [x, z] = project(site.lon, site.lat);
    const y = elevY(elevationAt(site.lon, site.lat));
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const color = new THREE.Color(site.hardened ? "#fca5a5" : "#cbd5e1");
    const towerH = Math.max(0.12, elevY(site.structureM) * 2.2);

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.032, towerH, 4),
      new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.2), roughness: 0.6 }),
    );
    mast.position.y = towerH / 2;
    g.add(mast);

    // The horns. Four of them, facing out — the thing you actually recognise
    // from a highway at 70 mph.
    for (let i = 0; i < 4; i++) {
      const th = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.035, 0.07, 4),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.2 }),
      );
      horn.position.set(Math.cos(th) * 0.045, towerH * HORN_FRACTION, Math.sin(th) * 0.045);
      horn.rotation.z = Math.PI / 2;
      horn.rotation.y = -th;
      g.add(horn);
    }

    // Hardened sites get a blockhouse at the base.
    if (site.hardened) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.045, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 }),
      );
      block.position.y = 0.022;
      g.add(block);
    }

    const head = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055),
      new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.5), roughness: 0.3 }),
    );
    head.position.y = towerH + 0.05;
    head.userData = { kind: "longline", record: longlineRecord(site), siteId: site.id };
    g.add(head);
    pickables.push(head);

    groups.longlines.add(g);
    towerGroups.push({ site, group: g });
  }

  // Hop beams, coloured by what the terrain says about the path.
  for (const hop of LONGLINE_HOPS) {
    const report = hopAnalysis(hop);
    if (!report) continue;
    hopReports.push(report);
    const { from, to, analysis } = report;
    const [x0, z0] = project(from.lon, from.lat);
    const [x1, z1] = project(to.lon, to.lat);
    const y0 = elevY(elevationAt(from.lon, from.lat) + from.structureM * HORN_FRACTION);
    const y1 = elevY(elevationAt(to.lon, to.lat) + to.structureM * HORN_FRACTION);
    const clear = analysis.fresnelClear;
    const los = analysis.lineOfSight;
    const color = new THREE.Color(
      hop.documented === false ? "#94a3b8" : clear ? "#5eead4" : los ? "#fbbf24" : "#f87171",
    );
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x0, y0, z0),
      new THREE.Vector3(x1, y1, z1),
    ]);
    const beam = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: clear ? 0.85 : 0.6 }),
    );
    beam.userData = {
      kind: "longline-hop",
      hopId: `${hop.from}->${hop.to}`,
      record: {
        id: `longline-hop-${hop.from}-${hop.to}`,
        name: `${from.name} → ${to.name} microwave hop`,
        layer: "longlines",
        tier: from.tier === "official" && to.tier === "official" ? "community" : "context",
        kind: "longline-hop",
        facts: [
          `${analysis.distKm.toFixed(1)} km at ${hop.band} GHz. ${hop.note}.`,
          hop.documented === false
            ? "Inferred link, drawn grey: the site descriptions name both stations but not this path between them."
            : "Documented path: named in the station descriptions on long-lines.net.",
          los
            ? `Geometrically clear over the 4/3-earth profile${clear ? ", and the first Fresnel zone is clear too — a hop you could commission." : `, but only ${(analysis.obstruction.fresnelFraction * 100).toFixed(0)}% of the first Fresnel zone is clear, so it would take ${analysis.diffractionDb.toFixed(1)} dB of obstruction loss.`}`
            : `Blocked on this terrain field: ${analysis.diffractionDb.toFixed(1)} dB of knife-edge loss, controlling obstruction ${analysis.obstruction.distKm.toFixed(1)} km out.`,
          `First Fresnel zone at midpath is ${report.midFresnelM.toFixed(0)} m across; the earth bulge alone is ${((analysis.distKm / 2) ** 2 * 1000 / (2 * 8494.67)).toFixed(0)} m.`,
          "Computed live against this theater's elevation field. On the synthetic surface that is a demonstration; install a real 3DEP grid and it becomes a path survey.",
        ],
        sources: [...from.sources, ...to.sources],
      },
    };
    groups.longlines.add(beam);
    pickables.push(beam);
    hopEntries.push({ hop, beam, from, to });
  }

  /* ----------------------------------------------------------- orbital */

  let orbitalSat = null;

  function clearOrbital() {
    for (let i = groups.orbital.children.length - 1; i >= 0; i--) {
      const o = groups.orbital.children[i];
      o.geometry?.dispose();
      o.material?.dispose();
      groups.orbital.remove(o);
    }
    orbitalSat = null;
  }

  /**
   * Draw one satellite's track and swath edges across the frame. Three lines
   * and nothing else — the swath is the information.
   */
  function showOrbital(satId, { bbox, lon, lat }) {
    clearOrbital();
    const sat = SAT_BY_ID.get(satId);
    if (!sat) return null;
    const swath = swathAcross(sat, { bbox, lon, lat });
    if (!swath) return null;
    const color = new THREE.Color(sat.color);
    const lift = 900; // metres, so the track floats clear of the ridges

    const addLine = (pts, opacity, dashed) => {
      const v = pts.map(([plon, plat]) => {
        const [x, z] = project(plon, plat);
        return new THREE.Vector3(x, elevY(elevationAt(plon, plat) + lift), z);
      });
      // Resample so the track follows the terrain lift rather than cutting
      // through a mountain at constant height.
      const dense = drapedLine(pts, { liftM: lift, stepKm: 12 });
      const geom = new THREE.BufferGeometry().setFromPoints(dense.length > 2 ? dense : v);
      const mat = dashed
        ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.3, gapSize: 0.22 })
        : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      const line = new THREE.Line(geom, mat);
      if (dashed) line.computeLineDistances();
      groups.orbital.add(line);
      return line;
    };

    addLine(swath.centre, 0.9, false);
    addLine(swath.left, 0.45, true);
    addLine(swath.right, 0.45, true);
    orbitalSat = satId;
    return { sat, swath, geometry: trackGeometry(sat, lat) };
  }

  /** Re-seat geometry after a vertical-exaggeration change. */
  function rebuild() {
    for (const { line, mesh, ticks } of lineEntries) {
      const pts = drapedLine(line.path, { liftM: 45 });
      const curve = new THREE.CatmullRomCurve3(pts);
      mesh.geometry.dispose();
      mesh.geometry = new THREE.TubeGeometry(
        curve,
        Math.max(24, pts.length * 2),
        CIRCUIT_CLASSES[line.cls].width * 0.35,
        5,
        false,
      );
      const tickPts = [];
      for (let i = 0; i < pts.length; i += 3) {
        const p = pts[i];
        tickPts.push(new THREE.Vector3(p.x, p.y, p.z), new THREE.Vector3(p.x, p.y - elevY(45), p.z));
      }
      ticks.geometry.dispose();
      ticks.geometry = new THREE.BufferGeometry().setFromPoints(tickPts);
    }
    for (const { st, group } of stationGroups) {
      group.position.y = elevY(elevationAt(st.lon, st.lat));
    }
    for (const { site, group } of towerGroups) {
      group.position.y = elevY(elevationAt(site.lon, site.lat));
    }
    for (const { beam, from, to } of hopEntries) {
      const [x0, z0] = project(from.lon, from.lat);
      const [x1, z1] = project(to.lon, to.lat);
      beam.geometry.dispose();
      beam.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x0, elevY(elevationAt(from.lon, from.lat) + from.structureM * HORN_FRACTION), z0),
        new THREE.Vector3(x1, elevY(elevationAt(to.lon, to.lat) + to.structureM * HORN_FRACTION), z1),
      ]);
    }
  }

  return {
    root,
    groups,
    pickables,
    hopReports,
    rebuild,
    showOrbital,
    clearOrbital,
    get orbitalSat() {
      return orbitalSat;
    },
    satellites: SATELLITES,
  };
}
