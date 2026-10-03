import { describe, expect, it } from "vitest";
import {
  BANDS,
  EMITTERS,
  FM_CLASS_REFERENCE,
  RADIO_SITES,
  SITE_BY_ID,
  emittersAt,
} from "../js/socal-radio-data.js";
import {
  analyzePath,
  circleRing,
  coverageRing,
  diffractionParameter,
  distanceKm,
  earthBulgeM,
  fccContourKm,
  fccFieldDbu,
  contourFit,
  CONTOUR_FITS,
  freeSpaceFieldDbu,
  fresnelRadiusM,
  groundwaveContourKm,
  groundwaveFieldMvM,
  haatPerFcc,
  knifeEdgeLossDb,
  mvmToDbu,
  offsetLonLat,
  radioHorizonKm,
  serviceThresholdDbu,
} from "../js/socal-propagation.js";
import { BBOX } from "../js/socal-subsurface-data.js";
import { contourSegments, hillshade, hypsometric, sampleGrid, slopeGrid } from "../js/socal-relief.js";

/* ------------------------------------------------------------ data pack */

describe("FCC spectrum register", () => {
  it("keeps every transmitter site inside the theater frame", () => {
    expect(RADIO_SITES.length).toBeGreaterThan(14);
    for (const s of RADIO_SITES) {
      expect(s.lon).toBeGreaterThanOrEqual(BBOX.lon0);
      expect(s.lon).toBeLessThanOrEqual(BBOX.lon1);
      expect(s.lat).toBeGreaterThanOrEqual(BBOX.lat0);
      expect(s.lat).toBeLessThanOrEqual(BBOX.lat1);
      expect(["official", "community", "context"]).toContain(s.tier);
      expect(s.sources.length).toBeGreaterThan(0);
    }
  });

  it("joins every emitter to a declared site and a declared band", () => {
    expect(EMITTERS.length).toBeGreaterThan(20);
    for (const e of EMITTERS) {
      expect(SITE_BY_ID.get(e.site), `${e.call} site ${e.site}`).toBeTruthy();
      expect(BANDS[e.band], `${e.call} band ${e.band}`).toBeTruthy();
      expect(e.freqMHz).toBeGreaterThan(0);
      expect(e.erpKw).toBeGreaterThan(0);
      expect(e.notes.length).toBeGreaterThan(0);
    }
  });

  it("carries the sourced Mount Wilson facility figures", () => {
    const wilson = emittersAt("mt-wilson").map((e) => e.call);
    expect(wilson).toContain("KTLA");
    expect(wilson).toContain("KABC-TV");
    expect(EMITTERS.find((e) => e.id === "ktla")).toMatchObject({ erpKw: 1000, haatM: 981, freqMHz: 599 });
    expect(EMITTERS.find((e) => e.id === "kiis-fm")).toMatchObject({ erpKw: 8, haatM: 902, facilityId: 19218 });
    expect(EMITTERS.find((e) => e.id === "kcbs-tv")).toMatchObject({ erpKw: 485, haatM: 1095 });
  });

  it("maps each band to the service contour the FCC actually protects", () => {
    expect(serviceThresholdDbu("fm", 102.7)).toBe(60);
    expect(serviceThresholdDbu("vhf", 177)).toBe(36);
    // OET-69 Table 2: 41 - 20 log(615/f); at 615 MHz exactly 41 dBu.
    expect(serviceThresholdDbu("uhf", 615)).toBeCloseTo(41, 6);
    expect(serviceThresholdDbu("uhf", 575)).toBeLessThan(41);
    expect(serviceThresholdDbu("am", 0.64)).toBeCloseTo(mvmToDbu(0.5), 6);
  });
});

/* -------------------------------------------------------- the FCC model */

describe("smooth-earth contour model vs 47 CFR 73.211 reference distances", () => {
  it("reproduces all eight class reference distances within 5%", () => {
    for (const ref of FM_CLASS_REFERENCE) {
      const km = fccContourKm(ref.erpKw, ref.haatM, ref.dbu);
      expect(Math.abs(km / ref.refKm - 1), `class ${ref.cls}: ${km.toFixed(1)} vs ${ref.refKm}`).toBeLessThan(0.05);
    }
  });

  // 47 CFR 73.626(c) Table of Distances: maximum facility -> maximum service
  // radius, by channel group. Zone II/III rows, which is where California is.
  const TV_ANCHORS = [
    { label: "ch 2-6 Zone II/III", erpKw: 45, haatM: 305, dbu: 28, freqMHz: 69, km: 128 },
    { label: "ch 7-13 Zone II/III", erpKw: 160, haatM: 305, dbu: 36, freqMHz: 195, km: 123 },
    { label: "ch 14-36 all zones", erpKw: 1000, haatM: 365, dbu: 41, freqMHz: 600, km: 103 },
  ];

  it.each(TV_ANCHORS)("reproduces the $label Table of Distances radius", (a) => {
    expect(fccContourKm(a.erpKw, a.haatM, a.dbu, a.freqMHz)).toBeCloseTo(a.km, 0);
  });

  it("selects a band constant per frequency, not one curve for everything", () => {
    expect(contourFit(98)).toBe(CONTOUR_FITS.fm);
    expect(contourFit(69)).toBe(CONTOUR_FITS.vhfLo);
    expect(contourFit(195)).toBe(CONTOUR_FITS.vhfHi);
    expect(contourFit(600)).toBe(CONTOUR_FITS.uhf);
    for (const fit of Object.values(CONTOUR_FITS)) {
      expect(fit.A).toBeCloseTo(16.3125, 6);
      expect(fit.G).toBeCloseTo(49.4173, 6);
      expect(fit.note).toMatch(/47 CFR/);
    }
  });

  it("keeps the FM curve away from the TV bands", () => {
    // The whole reason K is per band: the FM fit extrapolated to a 28 dBu
    // low-VHF contour overshoots the rule by more than a factor of two.
    expect(fccContourKm(45, 305, 28, 98)).toBeGreaterThan(250);
    expect(fccContourKm(45, 305, 28, 69)).toBeCloseTo(128, 0);
  });

  it("is self-inverse: field at the contour distance equals the contour", () => {
    for (const ref of FM_CLASS_REFERENCE) {
      const km = fccContourKm(ref.erpKw, ref.haatM, ref.dbu);
      expect(fccFieldDbu(ref.erpKw, ref.haatM, km)).toBeCloseTo(ref.dbu, 6);
    }
  });

  it("treats HAAT below 30 m as 30 m, per 73.313", () => {
    expect(fccContourKm(1, 5, 60)).toBeCloseTo(fccContourKm(1, 30, 60), 9);
  });

  it("never predicts more than free space", () => {
    for (let d = 0.1; d < 5; d += 0.1) {
      expect(fccFieldDbu(100, 600, d)).toBeLessThanOrEqual(freeSpaceFieldDbu(100, d) + 1e-9);
    }
  });

  it("puts 1 kW ERP at about 107 dBu at 1 km in free space", () => {
    expect(freeSpaceFieldDbu(1, 1)).toBeCloseTo(106.92, 2);
    // Doubling distance costs 6 dB.
    expect(freeSpaceFieldDbu(1, 2)).toBeCloseTo(106.92 - 6.0206, 3);
  });
});

/* ---------------------------------------------------------- the physics */

describe("diffraction and geometry", () => {
  it("gives the textbook 4/3-earth horizon", () => {
    // d = 4.124 sqrt(h) km
    expect(radioHorizonKm(100)).toBeCloseTo(41.24, 1);
    expect(radioHorizonKm(1722)).toBeCloseTo(4.1218 * Math.sqrt(1722), 1);
    // Mount Wilson sees roughly 170 km of horizon from its own summit height.
    expect(radioHorizonKm(1722)).toBeGreaterThan(165);
  });

  it("bulges the earth between the path legs", () => {
    expect(earthBulgeM(0, 50)).toBe(0);
    expect(earthBulgeM(25, 25)).toBeCloseTo((25 * 25 * 1000) / (2 * 6371 * (4 / 3)), 4);
  });

  it("sizes the first Fresnel zone the usual way", () => {
    // Midpoint of a 10 km path at 100 MHz: 17.32*sqrt(25/(0.1*10)) = 86.6 m
    expect(fresnelRadiusM(100, 5, 5)).toBeCloseTo(86.6, 1);
    // Higher frequency, tighter zone.
    expect(fresnelRadiusM(600, 5, 5)).toBeLessThan(fresnelRadiusM(100, 5, 5));
  });

  it("applies ITU-R P.526 knife-edge loss only above the shadow threshold", () => {
    expect(knifeEdgeLossDb(-1)).toBe(0);
    expect(knifeEdgeLossDb(0)).toBeCloseTo(6.02, 1); // grazing, about 6 dB
    expect(knifeEdgeLossDb(2)).toBeGreaterThan(knifeEdgeLossDb(1));
    expect(knifeEdgeLossDb(3)).toBeGreaterThan(20);
  });

  it("signs the diffraction parameter by obstruction height", () => {
    expect(diffractionParameter(-200, 10, 10, 100)).toBeLessThan(0); // clear
    expect(diffractionParameter(200, 10, 10, 100)).toBeGreaterThan(0); // blocked
  });
});

describe("terrain-aware path analysis", () => {
  // A deterministic synthetic world: a 1,500 m ridge wall at longitude -118.0.
  const ridge = (lon: number) => 100 + 1500 * Math.exp(-(((lon + 118) / 0.05) ** 2));
  const elevAt = (lon: number) => ridge(lon);

  const tx = { lon: -118.4, lat: 34.2, aglM: 100 };

  it("sees a clear path on the near side of the ridge", () => {
    const near = analyzePath({ elevAt, tx, rx: { lon: -118.2, lat: 34.2 }, freqMHz: 100, erpKw: 50 });
    expect(near.lineOfSight).toBe(true);
    // Geometrically clear, but at 100 MHz the first Fresnel zone is 100 m+
    // across at this range, so a little obstruction loss is correct.
    expect(near.diffractionDb).toBeLessThan(5);
    expect(near.fieldDbu).toBeGreaterThan(80);
  });

  it("shadows the far side and charges diffraction loss for it", () => {
    const far = analyzePath({ elevAt, tx, rx: { lon: -117.6, lat: 34.2 }, freqMHz: 100, erpKw: 50 });
    expect(far.lineOfSight).toBe(false);
    expect(far.fresnelClear).toBe(false);
    expect(far.diffractionDb).toBeGreaterThan(10);
    expect(far.obstruction.distKm).toBeGreaterThan(20);
  });

  it("charges more diffraction loss at higher frequency for the same ridge", () => {
    const vhf = analyzePath({ elevAt, tx, rx: { lon: -117.6, lat: 34.2 }, freqMHz: 100, erpKw: 50 });
    const uhf = analyzePath({ elevAt, tx, rx: { lon: -117.6, lat: 34.2 }, freqMHz: 600, erpKw: 50 });
    expect(uhf.diffractionDb).toBeGreaterThan(vhf.diffractionDb);
  });

  it("produces an asymmetric coverage ring around an asymmetric world", () => {
    const cov = coverageRing({
      elevAt,
      lon: -118.4,
      lat: 34.2,
      aglM: 100,
      freqMHz: 100,
      erpKw: 50,
      thresholdDbu: 60,
      azimuths: 24,
      maxKm: 120,
      stepKm: 2,
    });
    expect(cov.ring).toHaveLength(24);
    expect(cov.maxKm).toBeGreaterThan(cov.minKm);
    expect(cov.areaKm2).toBeGreaterThan(0);
    // Every ring vertex is a finite lon/lat.
    for (const [lon, lat] of cov.ring) {
      expect(Number.isFinite(lon)).toBe(true);
      expect(Number.isFinite(lat)).toBe(true);
    }
  });
});

describe("HAAT per 47 CFR 73.313", () => {
  it("averages 3–16 km on eight cardinal radials", () => {
    const flat = () => 200;
    const h = haatPerFcc(flat, -118, 34, 1200);
    expect(h.radials).toHaveLength(8);
    expect(h.haatM).toBeCloseTo(1000, 6);
    for (const r of h.radials) expect(r.averageTerrainM).toBeCloseTo(200, 6);
  });

  it("drops HAAT when the surrounding terrain rises", () => {
    const bowl = () => 900;
    expect(haatPerFcc(bowl, -118, 34, 1200).haatM).toBeCloseTo(300, 6);
  });
});

describe("AM groundwave stand-in", () => {
  it("lands a 50 kW clear channel 0.5 mV/m contour in the right order of magnitude", () => {
    const km = groundwaveContourKm(50, 0.64, mvmToDbu(0.5), 8);
    expect(km).toBeGreaterThan(120);
    expect(km).toBeLessThan(220);
  });

  it("decays monotonically with distance and grows with power", () => {
    expect(groundwaveFieldMvM(50, 10, 0.64)).toBeGreaterThan(groundwaveFieldMvM(50, 50, 0.64));
    expect(groundwaveFieldMvM(50, 50, 0.64)).toBeGreaterThan(groundwaveFieldMvM(5, 50, 0.64));
  });

  it("reaches further over better ground", () => {
    expect(groundwaveContourKm(50, 0.64, mvmToDbu(0.5), 20)).toBeGreaterThan(
      groundwaveContourKm(50, 0.64, mvmToDbu(0.5), 4),
    );
  });
});

describe("geodesy helpers", () => {
  it("offsets and measures consistently", () => {
    const [lon, lat] = offsetLonLat(-118, 34, 90, 50);
    expect(lat).toBeCloseTo(34, 6);
    expect(distanceKm(-118, 34, lon, lat)).toBeCloseTo(50, 1);
    const [lon2, lat2] = offsetLonLat(-118, 34, 0, 50);
    expect(lon2).toBeCloseTo(-118, 6);
    expect(distanceKm(-118, 34, lon2, lat2)).toBeCloseTo(50, 1);
  });

  it("builds closed circles of the requested radius", () => {
    const ring = circleRing(-118, 34, 40, 36);
    expect(ring).toHaveLength(36);
    for (const [lon, lat] of ring) expect(distanceKm(-118, 34, lon, lat)).toBeCloseTo(40, 0);
  });
});

/* ------------------------------------------------------------- relief */

describe("relief map rendering primitives", () => {
  const bbox = { lon0: -118.5, lat0: 34, lon1: -117.5, lat1: 34.6 };
  const cone = (lon: number, lat: number) =>
    2000 * Math.exp(-(((lon + 118) / 0.1) ** 2 + ((lat - 34.3) / 0.1) ** 2));

  it("samples a grid north-to-south", () => {
    const grid = sampleGrid(cone, bbox, 40, 24);
    expect(grid.data).toHaveLength(960);
    const peak = Math.max(...grid.data);
    expect(peak).toBeGreaterThan(1500);
  });

  it("hillshades inside 0..1 and lights the sun-facing slope harder", () => {
    const grid = sampleGrid(cone, bbox, 60, 40);
    const shade = hillshade(grid, { sunAzDeg: 315, sunAltDeg: 45 });
    for (const v of shade) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    const nw = shade[Math.floor(40 * 0.42) * 60 + Math.floor(60 * 0.42)];
    const se = shade[Math.floor(40 * 0.58) * 60 + Math.floor(60 * 0.58)];
    expect(nw).toBeGreaterThan(se);
  });

  it("measures slope in degrees and finds the steep flank", () => {
    const grid = sampleGrid(cone, bbox, 60, 40);
    const slope = slopeGrid(grid);
    expect(Math.max(...slope)).toBeGreaterThan(5);
    expect(Math.min(...slope)).toBeGreaterThanOrEqual(0);
  });

  it("traces closed-ish contours around a cone", () => {
    const grid = sampleGrid(cone, bbox, 80, 50);
    const segs = contourSegments(grid, 1000);
    expect(segs.length).toBeGreaterThan(10);
    for (const s of segs) expect(s).toHaveLength(4);
    expect(contourSegments(grid, 99999)).toHaveLength(0);
  });

  it("ramps hypsometric colour monotonically upward", () => {
    const low = hypsometric(50);
    const high = hypsometric(3500);
    expect(high[0] + high[1] + high[2]).toBeGreaterThan(low[0] + low[1] + low[2]);
  });
});
