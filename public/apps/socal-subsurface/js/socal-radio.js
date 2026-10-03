/**
 * SOCAL SUBSURFACE — radio spectrum layer.
 *
 * Draws the FCC-registered transmitter sites as masts on the terrain, hangs
 * each site's licensed emitters up the mast at their radiation centres, and
 * computes terrain-aware coverage on demand:
 *
 *   contour     the field-strength service contour, ray-marched over the same
 *               elevation field everything else in this theater drapes on
 *   fcc circle  the smooth-earth FCC-style contour at the same threshold,
 *               drawn dashed, so the terrain correction is visible
 *   wavefront   an expanding phase-front ring, purely a reading aid — radio
 *               crosses this frame in two milliseconds, the animation does not
 *
 * Geometry comes from socal-geo.js (one projection, one surface) and the
 * physics from socal-propagation.js (no THREE in there, so it is testable).
 */

import * as THREE from "../vendor/three.module.min.js";
import { elevY, elevationAt, project } from "./socal-geo.js";
import { BANDS, EMITTERS, RADIO_SITES, SITE_BY_ID, emittersAt } from "./socal-radio-data.js";
import {
  analyzePath,
  circleRing,
  coverageRing,
  distanceKm,
  fccContourKm,
  groundwaveContourKm,
  haatPerFcc,
  radioHorizonKm,
  serviceThresholdDbu,
} from "./socal-propagation.js";

/** Minimum drawn mast height in scene units so a 30 m stick stays visible. */
const MIN_MAST = 0.22;

function drapedRingPoints(ring, lift = 0.12) {
  const pts = ring.map(([lon, lat]) => {
    const [x, z] = project(lon, lat);
    return new THREE.Vector3(x, elevY(elevationAt(lon, lat)) + lift, z);
  });
  if (pts.length) pts.push(pts[0].clone());
  return pts;
}

/** Tallest structure at a site, metres AGL — what the mast is drawn to. */
export function siteStructureM(siteId) {
  const ems = emittersAt(siteId);
  const tallest = ems.reduce((m, e) => Math.max(m, e.rcAglM || 0), 0);
  return Math.max(tallest, 30);
}

/**
 * Everything the dossier wants to say about one emitter, computed live
 * against the current elevation field.
 */
export function emitterReport(emitter, { azimuths = 72, maxKm = 240 } = {}) {
  const site = SITE_BY_ID.get(emitter.site);
  const band = BANDS[emitter.band];
  const groundM = elevationAt(site.lon, site.lat);
  const rcAmsl = groundM + (emitter.rcAglM || 30);
  const threshold = serviceThresholdDbu(emitter.band, emitter.freqMHz);
  const haat = haatPerFcc(elevationAt, site.lon, site.lat, rcAmsl);

  if (emitter.band === "am") {
    // Groundwave: no terrain ray march, no HAAT — a different physics entirely.
    const sigma = site.elevM < 100 ? 12 : 6; // damp coastal plain vs dry inland
    const km = groundwaveContourKm(emitter.erpKw, emitter.freqMHz, threshold, sigma);
    const ring = circleRing(site.lon, site.lat, km);
    return {
      emitter,
      site,
      band,
      mode: "groundwave",
      thresholdDbu: threshold,
      groundM,
      rcAmsl,
      haatM: null,
      fccKm: km,
      ring,
      terrain: null,
      conductivity: sigma,
      horizonKm: null,
    };
  }

  // Prefer the HAAT the licensee filed with the FCC over the one we can
  // measure off this terrain field: until a real 3DEP grid is installed the
  // synthetic surface smooths Mount Wilson down by a kilometre, and HAAT is
  // the single most leveraged number in the contour equation.
  const haatUsedM = emitter.haatM ?? haat.haatM;
  const fccKm = fccContourKm(emitter.erpKw, haatUsedM, threshold, emitter.freqMHz);
  const terrain = coverageRing({
    elevAt: elevationAt,
    lon: site.lon,
    lat: site.lat,
    aglM: emitter.rcAglM || 30,
    freqMHz: emitter.freqMHz,
    erpKw: emitter.erpKw,
    thresholdDbu: threshold,
    azimuths,
    maxKm,
    stepKm: 1.5,
    haatM: haatUsedM,
  });
  return {
    emitter,
    site,
    band,
    mode: "terrain",
    thresholdDbu: threshold,
    groundM,
    rcAmsl,
    haatM: haat.haatM,
    haatUsedM,
    haatRadials: haat.radials,
    filedHaatM: emitter.haatM ?? null,
    fccKm,
    fccRing: circleRing(site.lon, site.lat, fccKm),
    ring: terrain.ring,
    terrain,
    horizonKm: radioHorizonKm(Math.max(haatUsedM, 10)) + radioHorizonKm(9),
  };
}

/** Path analysis from an emitter to an arbitrary point. */
export function emitterPath(emitter, lon, lat) {
  const site = SITE_BY_ID.get(emitter.site);
  return analyzePath({
    elevAt: elevationAt,
    tx: { lon: site.lon, lat: site.lat, aglM: emitter.rcAglM || 30 },
    rx: { lon, lat },
    freqMHz: emitter.freqMHz,
    erpKw: emitter.erpKw,
    steps: Math.max(60, Math.min(320, Math.round(distanceKm(site.lon, site.lat, lon, lat) * 3))),
  });
}

/* ----------------------------------------------------------------- build */

export function buildRadio() {
  const root = new THREE.Group();
  root.name = "radio";

  const groups = {
    towers: new THREE.Group(),
    coverage: new THREE.Group(),
    wavefront: new THREE.Group(),
  };
  groups.towers.name = "radio-towers";
  groups.coverage.name = "radio-coverage";
  groups.wavefront.name = "radio-wavefront";
  groups.coverage.visible = true;
  groups.wavefront.visible = true;
  for (const g of Object.values(groups)) root.add(g);

  const pickables = [];
  const towerMeshes = [];
  const beacons = [];

  for (const site of RADIO_SITES) {
    const [x, z] = project(site.lon, site.lat);
    const ground = elevY(elevationAt(site.lon, site.lat));
    const g = new THREE.Group();
    g.position.set(x, ground, z);
    g.name = `radio-site-${site.id}`;

    const structM = siteStructureM(site.id);
    const mastH = Math.max(MIN_MAST, elevY(structM) * 2.2);
    const isAm = emittersAt(site.id).some((e) => e.band === "am");
    const color = new THREE.Color(isAm ? BANDS.am.color : "#e2e8f0");

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.03, mastH, 5),
      new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.25), roughness: 0.5 }),
    );
    mast.position.y = mastH / 2;
    g.add(mast);

    // Guy-wire triangle: three lines to ground, the visual tell of a tall stick.
    const guys = [];
    for (let i = 0; i < 3; i++) {
      const th = (i / 3) * Math.PI * 2;
      guys.push(
        new THREE.Vector3(0, mastH * 0.82, 0),
        new THREE.Vector3(Math.cos(th) * mastH * 0.42, 0, Math.sin(th) * mastH * 0.42),
      );
    }
    g.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(guys),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 }),
      ),
    );

    // FAA red obstruction beacon.
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xff2d2d }),
    );
    beacon.position.y = mastH + 0.03;
    g.add(beacon);
    beacons.push(beacon);

    // Pickable head.
    const head = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.22, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.5), roughness: 0.3 }),
    );
    head.position.y = mastH * 0.9;
    head.userData = { kind: "radio-site", record: siteRecord(site) };
    g.add(head);
    pickables.push(head);

    // Emitter collars up the mast, one per licensed facility, coloured by band.
    const ems = emittersAt(site.id);
    ems.forEach((em, i) => {
      const bandColor = new THREE.Color(BANDS[em.band].color);
      const y = Math.max(0.06, (mastH * (em.rcAglM || 30)) / Math.max(structM, 1)) * 0.95;
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.05 + i * 0.012, 0.012, 6, 16).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: bandColor, transparent: true, opacity: 0.9 }),
      );
      collar.position.y = Math.min(y, mastH * 0.98);
      collar.userData = { kind: "radio-emitter", record: emitterRecord(em), emitterId: em.id };
      g.add(collar);
      pickables.push(collar);
    });

    const pad = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.16, 20).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: THREE.DoubleSide }),
    );
    pad.position.y = 0.02;
    g.add(pad);

    groups.towers.add(g);
    towerMeshes.push({ site, group: g, mastH });
  }

  /* ------------------------------------------------------------ coverage */

  /** Currently drawn coverage, keyed by emitter id. */
  const drawn = new Map();

  function clearCoverage() {
    for (const [, entry] of drawn) {
      entry.objects.forEach((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
        o.parent?.remove(o);
      });
    }
    drawn.clear();
    for (let i = groups.wavefront.children.length - 1; i >= 0; i--) {
      const o = groups.wavefront.children[i];
      o.geometry?.dispose();
      o.material?.dispose();
      groups.wavefront.remove(o);
    }
  }

  /**
   * Draw (or redraw) coverage for one emitter.
   * @returns the report object from emitterReport()
   */
  function showCoverage(emitterId, { azimuths = 72, wavefront = true } = {}) {
    const em = EMITTERS.find((e) => e.id === emitterId);
    if (!em) return null;
    const report = emitterReport(em, { azimuths });
    const color = new THREE.Color(report.band.color);
    const objects = [];

    const contour = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(drapedRingPoints(report.ring, 0.14)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }),
    );
    contour.userData = { kind: "radio-contour", record: coverageRecord(report) };
    groups.coverage.add(contour);
    objects.push(contour);
    pickables.push(contour);

    if (report.fccRing) {
      const fcc = new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity: 0.45,
        dashSize: 0.35,
        gapSize: 0.3,
      });
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(drapedRingPoints(report.fccRing, 0.1)),
        fcc,
      );
      line.computeLineDistances();
      groups.coverage.add(line);
      objects.push(line);
    }

    // Radial spokes make the terrain shadowing legible as structure, not noise.
    if (report.terrain) {
      const spokes = [];
      const [sx, sz] = project(report.site.lon, report.site.lat);
      const sy = elevY(elevationAt(report.site.lon, report.site.lat)) + 0.15;
      report.ring.forEach(([lon, lat], i) => {
        if (i % 6) return;
        const [ex, ez] = project(lon, lat);
        spokes.push(
          new THREE.Vector3(sx, sy, sz),
          new THREE.Vector3(ex, elevY(elevationAt(lon, lat)) + 0.1, ez),
        );
      });
      const spokeLines = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(spokes),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.16 }),
      );
      groups.coverage.add(spokeLines);
      objects.push(spokeLines);
    }

    drawn.set(emitterId, { report, objects });

    if (wavefront) {
      const ringMesh = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(drapedRingPoints(circleRing(report.site.lon, report.site.lat, 5), 0.2)),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }),
      );
      ringMesh.userData = {
        wave: {
          lon: report.site.lon,
          lat: report.site.lat,
          maxKm: Math.max(report.terrain ? report.terrain.maxKm : report.fccKm, 8),
          phase: 0,
        },
      };
      groups.wavefront.add(ringMesh);
    }

    return report;
  }

  /** Animate the phase-front rings. dt in seconds. */
  function tickWavefront(dt) {
    for (const ring of groups.wavefront.children) {
      const w = ring.userData.wave;
      if (!w) continue;
      w.phase = (w.phase + dt * 0.28) % 1;
      const km = Math.max(1.5, w.maxKm * w.phase);
      const pts = drapedRingPoints(circleRing(w.lon, w.lat, km, 64), 0.2);
      ring.geometry.dispose();
      ring.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      ring.material.opacity = 0.75 * (1 - w.phase);
    }
  }

  /** Blink the obstruction beacons at the FAA L-864 rate (about 20–40 fpm). */
  function tickBeacons(now) {
    const on = (now % 2000) < 700;
    for (const b of beacons) b.material.color.setHex(on ? 0xff2d2d : 0x441010);
  }

  /** Re-seat masts after a vertical-exaggeration change. */
  function rebuild() {
    for (const { site, group } of towerMeshes) {
      group.position.y = elevY(elevationAt(site.lon, site.lat));
    }
    const ids = [...drawn.keys()];
    clearCoverage();
    for (const id of ids) showCoverage(id);
  }

  return {
    root,
    groups,
    pickables,
    towerMeshes,
    showCoverage,
    clearCoverage,
    tickWavefront,
    tickBeacons,
    rebuild,
    get drawn() {
      return drawn;
    },
  };
}

/* --------------------------------------------------------------- records */

function siteRecord(site) {
  const ems = emittersAt(site.id);
  const bandSummary = [...new Set(ems.map((e) => BANDS[e.band].name.split(" ")[0]))].join(" · ") || "no registered emitter in this pack";
  return {
    id: `radio-site-${site.id}`,
    name: site.name,
    layer: "radio",
    tier: site.tier,
    lon: site.lon,
    lat: site.lat,
    depthM: 0,
    kind: "radio-site",
    facts: [
      `Published ground elevation ${site.elevM.toLocaleString()} m; this theater's terrain field reads ${Math.round(elevationAt(site.lon, site.lat)).toLocaleString()} m here — the gap is the synthetic relief, and it is why the propagation numbers below are indicative, not filings.`,
      `${ems.length} emitter${ems.length === 1 ? "" : "s"} in this register: ${bandSummary}.`,
      ...site.facts,
    ],
    sources: site.sources,
  };
}

function emitterRecord(em) {
  const site = SITE_BY_ID.get(em.site);
  const band = BANDS[em.band];
  return {
    id: `radio-${em.id}`,
    name: `${em.call} — ${em.channel}`,
    layer: "radio",
    tier: em.tier,
    lon: site.lon,
    lat: site.lat,
    depthM: 0,
    kind: "radio-emitter",
    emitterId: em.id,
    facts: [
      `${em.service} from ${site.name}.`,
      `${em.freqMHz >= 1 ? `${em.freqMHz} MHz` : `${Math.round(em.freqMHz * 1000)} kHz`} · ERP ${em.erpKw >= 1 ? `${em.erpKw} kW` : `${Math.round(em.erpKw * 1000)} W`}${em.haatM ? ` · filed HAAT ${em.haatM} m` : ""}${em.facilityId ? ` · FCC facility ${em.facilityId}` : ""}.`,
      `Service contour drawn at ${serviceThresholdDbu(em.band, em.freqMHz).toFixed(1)} dBµV/m — ${band.rxNote}`,
      ...em.notes,
    ],
    sources: [
      "FCC LMS / CDBS broadcast facility data",
      "FCC Antenna Structure Registration (ASR)",
      "47 CFR 73.211 / 73.313 / 73.333; OET Bulletin 69",
    ],
  };
}

function coverageRecord(report) {
  const em = report.emitter;
  const facts = [
    `${em.call} ${em.channel}, ${em.erpKw >= 1 ? `${em.erpKw} kW` : `${Math.round(em.erpKw * 1000)} W`} ERP from ${report.site.name}.`,
    `Contour threshold ${report.thresholdDbu.toFixed(1)} dBµV/m.`,
  ];
  if (report.mode === "terrain") {
    facts.push(
      `Terrain-aware ray march: ${report.terrain.meanKm.toFixed(0)} km mean radius, ${report.terrain.minKm.toFixed(0)} km into the worst shadow, ${report.terrain.maxKm.toFixed(0)} km down the best corridor, ${Math.round(report.terrain.areaKm2).toLocaleString()} km² enclosed.`,
      `Smooth-earth FCC-style contour at the same power and HAAT: ${report.fccKm.toFixed(0)} km in every direction (dashed ring). The difference between the two rings is the whole argument against contour maps.`,
      `Computed HAAT from this terrain field, 8 cardinal radials 3–16 km per 47 CFR 73.313: ${Math.round(report.haatM)} m${report.filedHaatM ? ` (filed: ${report.filedHaatM} m)` : ""}.`,
      `Radio horizon for the radiation centre plus a 9 m receive antenna: ${report.horizonKm.toFixed(0)} km.`,
    );
  } else {
    facts.push(
      `Daytime groundwave only: ${report.fccKm.toFixed(0)} km to ${report.thresholdDbu.toFixed(1)} dBµV/m over ${report.conductivity} mS/m ground.`,
      "Skywave is not drawn. At night this signal reaches most of the western United States by ionospheric refraction, which no contour on this map describes.",
    );
  }
  return {
    id: `coverage-${em.id}`,
    name: `${em.call} service contour`,
    layer: "radio",
    tier: "context",
    kind: "radio-contour",
    facts,
    sources: [
      "47 CFR 73.333 F(50,50) curves; 73.211 class reference facilities",
      "ITU-R P.526 knife-edge diffraction",
      "FCC OET Bulletin 69 (Longley-Rice methodology — not implemented here)",
    ],
  };
}
