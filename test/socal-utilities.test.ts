import { describe, expect, it } from "vitest";
import {
  CIRCUIT_CLASSES,
  LONGLINES,
  LONGLINE_BY_ID,
  LONGLINE_HOPS,
  MAX_PLAUSIBLE_HOP_KM,
  STATION_CLASSES,
  SUBSTATIONS,
  SUBSTATION_BY_ID,
  TRANSMISSION,
  UTILITY_SOURCE_URLS,
} from "../js/socal-utilities-data.js";
import {
  ORBITAL_SOURCE_URLS,
  SATELLITES,
  SAT_BY_ID,
  argumentOfLatitudeDeg,
  formatHours,
  groundTrackHeadingDeg,
  localSolarTimeAtLat,
  nextWindows,
  passWindows,
  swathAcross,
  trackGeometry,
} from "../js/socal-orbital.js";
import { distanceKm } from "../js/socal-propagation.js";
import { BBOX } from "../js/socal-subsurface-data.js";

const TIERS = ["official", "community", "context"];

const inBbox = (lon: number, lat: number) =>
  lon >= BBOX.lon0 && lon <= BBOX.lon1 && lat >= BBOX.lat0 && lat <= BBOX.lat1;

describe("utility data integrity", () => {
  it("places every substation inside the theater with a usable tier", () => {
    expect(SUBSTATIONS.length).toBeGreaterThanOrEqual(10);
    for (const st of SUBSTATIONS) {
      expect(inBbox(st.lon, st.lat), `${st.id} out of frame`).toBe(true);
      expect(TIERS).toContain(st.tier);
      expect(STATION_CLASSES[st.cls]).toBeDefined();
      expect(st.sources.length).toBeGreaterThan(0);
      expect(st.facts.length).toBeGreaterThan(0);
      expect(st.positionSource).toBeTruthy();
    }
  });

  it("never claims an official tier for a generalized pin", () => {
    // The symbology tells the truth about the evidence; so must the data.
    for (const st of SUBSTATIONS) {
      if (st.approx) expect(st.tier).not.toBe("official");
    }
    for (const site of LONGLINES) {
      if (site.approx) expect(site.tier).not.toBe("official");
    }
  });

  it("keeps substation ids unique and indexed", () => {
    expect(SUBSTATION_BY_ID.size).toBe(SUBSTATIONS.length);
    expect(LONGLINE_BY_ID.size).toBe(LONGLINES.length);
  });

  it("routes every transmission corridor between in-frame vertices", () => {
    expect(TRANSMISSION.length).toBeGreaterThanOrEqual(6);
    for (const line of TRANSMISSION) {
      expect(CIRCUIT_CLASSES[line.cls]).toBeDefined();
      expect(line.path.length).toBeGreaterThanOrEqual(3);
      for (const [lon, lat] of line.path) {
        expect(inBbox(lon, lat), `${line.id} vertex out of frame`).toBe(true);
      }
      expect(line.sources.length).toBeGreaterThan(0);
    }
  });

  it("starts the lines that terminate at a mapped substation on that substation", () => {
    const check: Array<[string, string, number]> = [
      ["path26", "vincent", 0],
      ["vincent-lugo", "vincent", 0],
      ["lugo-eldorado", "lugo", 0],
      ["devers-palo-verde", "devers", 0],
      ["adelanto-rinaldi", "adelanto", 0],
    ];
    for (const [lineId, stationId, index] of check) {
      const line = TRANSMISSION.find((l) => l.id === lineId)!;
      const st = SUBSTATION_BY_ID.get(stationId)!;
      const [lon, lat] = line.path[index];
      expect(distanceKm(lon, lat, st.lon, st.lat), `${lineId} → ${stationId}`).toBeLessThan(0.5);
    }
  });

  it("carries source urls for the register", () => {
    expect(UTILITY_SOURCE_URLS.length).toBeGreaterThan(5);
    for (const u of UTILITY_SOURCE_URLS) expect(u).toMatch(/^https?:\/\//);
  });
});

describe("Long Lines network", () => {
  it("has hops whose endpoints both exist", () => {
    for (const hop of LONGLINE_HOPS) {
      expect(LONGLINE_BY_ID.get(hop.from), hop.from).toBeDefined();
      expect(LONGLINE_BY_ID.get(hop.to), hop.to).toBeDefined();
      expect(hop.band).toBeGreaterThanOrEqual(4);
      expect(hop.band).toBeLessThanOrEqual(11);
    }
  });

  it("refuses to draw a microwave hop longer than a microwave hop can be", () => {
    // A horn on a 50 m tower against the earth's curvature is a 30-60 km
    // instrument. The register deliberately omits the 200 km "links" that
    // would be several hops in reality.
    for (const hop of LONGLINE_HOPS) {
      const a = LONGLINE_BY_ID.get(hop.from)!;
      const b = LONGLINE_BY_ID.get(hop.to)!;
      const d = distanceKm(a.lon, a.lat, b.lon, b.lat);
      expect(d, `${hop.from} → ${hop.to}`).toBeLessThanOrEqual(MAX_PLAUSIBLE_HOP_KM);
      expect(d).toBeGreaterThan(5);
    }
  });

  it("marks inferred paths as inferred", () => {
    const documented = LONGLINE_HOPS.filter((h) => h.documented !== false);
    expect(documented.length).toBeGreaterThanOrEqual(5);
    for (const hop of LONGLINE_HOPS) expect(typeof hop.documented).toBe("boolean");
  });

  it("reproduces the published Turquoise–Kelso Peak path length", () => {
    // long-lines.net: Kelso Peak "hops north to Turquoise, 24 miles".
    const a = LONGLINE_BY_ID.get("ll-turquoise")!;
    const b = LONGLINE_BY_ID.get("ll-kelso-peak")!;
    const miles = distanceKm(a.lon, a.lat, b.lon, b.lat) / 1.609344;
    expect(miles).toBeGreaterThan(20);
    expect(miles).toBeLessThan(28);
  });

  it("pins Turquoise on its FCC record", () => {
    const t = LONGLINE_BY_ID.get("ll-turquoise")!;
    expect(t.lat).toBeCloseTo(35.4358, 3);
    expect(t.lon).toBeCloseTo(-115.9247, 3);
    expect(t.structureM).toBeCloseTo(50.9, 1);
    expect(t.tier).toBe("official");
  });
});

describe("orbital geometry", () => {
  const LAT = 34.6;
  const LON = -117.95;

  it("knows which satellites it is talking about", () => {
    expect(SATELLITES.length).toBeGreaterThanOrEqual(5);
    expect(SAT_BY_ID.size).toBe(SATELLITES.length);
    for (const sat of SATELLITES) {
      expect(sat.inclinationDeg).toBeGreaterThan(95);
      expect(sat.inclinationDeg).toBeLessThan(100);
      expect(sat.repeatDays).toBeGreaterThan(0);
      expect(sat.swathKm).toBeGreaterThan(100);
      expect(["ascending", "descending"]).toContain(sat.nodeType);
      expect(sat.sources.length).toBeGreaterThan(0);
    }
    for (const u of ORBITAL_SOURCE_URLS) expect(u).toMatch(/^https?:\/\//);
  });

  it("puts Landsat over Southern California at 10:35 local, which is where it is", () => {
    // Landsat's equator crossing is 10:12 descending; local time runs later
    // with latitude on a northern descending pass. Real Landsat scenes over
    // Los Angeles are acquired around 18:30 UTC, i.e. ~10:30 local.
    const l9 = SAT_BY_ID.get("landsat-9")!;
    const t = localSolarTimeAtLat(l9, LAT)!;
    expect(t).toBeGreaterThan(10.3);
    expect(t).toBeLessThan(10.8);
    const [w] = passWindows(l9, { lat: LAT, lon: LON, count: 1, from: new Date("2026-06-01T00:00:00Z") });
    const utcHours = w.utc.getUTCHours() + w.utc.getUTCMinutes() / 60;
    expect(utcHours).toBeGreaterThan(18.0);
    expect(utcHours).toBeLessThan(18.9);
  });

  it("puts the Sentinel-1 ascending pass in the early evening, local", () => {
    const s1 = SAT_BY_ID.get("sentinel-1a")!;
    const t = localSolarTimeAtLat(s1, LAT)!;
    // LTAN 18:00 at the equator; earlier at northern latitudes on the
    // ascending branch, by the same mechanism that makes Landsat later.
    expect(t).toBeGreaterThan(17.0);
    expect(t).toBeLessThan(18.0);
  });

  it("gives the textbook sun-synchronous track headings", () => {
    const s1 = SAT_BY_ID.get("sentinel-1a")!;
    const l9 = SAT_BY_ID.get("landsat-9")!;
    // Ascending ~347°, descending ~193°, both leaning west because the orbit
    // is retrograde and the Earth turns underneath it.
    expect(groundTrackHeadingDeg(s1, LAT)!).toBeGreaterThan(344);
    expect(groundTrackHeadingDeg(s1, LAT)!).toBeLessThan(350);
    expect(groundTrackHeadingDeg(l9, LAT)!).toBeGreaterThan(190);
    expect(groundTrackHeadingDeg(l9, LAT)!).toBeLessThan(196);
  });

  it("keeps the two nodes twelve hours and 180-ish degrees apart", () => {
    for (const sat of SATELLITES) {
      const g = trackGeometry(sat, LAT);
      const dt = Math.abs(((g.opposite.localTime - g.localTime) % 24) + 24) % 24;
      expect(dt).toBeCloseTo(12, 6);
      // The two tracks are NOT antiparallel: both lean west by the same
      // Earth-rotation angle, so ascending and descending cross at about
      // twice that lean — the X pattern every SAR coverage map shows.
      const diff = (((g.opposite.heading! - g.heading!) % 360) + 360) % 360;
      const crossing = Math.abs(diff - 180);
      expect(crossing).toBeGreaterThan(18);
      expect(crossing).toBeLessThan(32);
    }
  });

  it("refuses latitudes the orbit cannot reach", () => {
    const sat = SAT_BY_ID.get("landsat-9")!;
    expect(argumentOfLatitudeDeg(sat.inclinationDeg, 89.9, true)).toBeNull();
    expect(groundTrackHeadingDeg(sat, 89.9)).toBeNull();
  });

  it("spaces windows by exactly the repeat cycle", () => {
    for (const sat of SATELLITES) {
      const w = passWindows(sat, { lat: LAT, lon: LON, count: 3, from: new Date("2026-10-03T00:00:00Z") });
      expect(w.length).toBe(3);
      for (let i = 1; i < w.length; i++) {
        const days = (w[i].utc.getTime() - w[i - 1].utc.getTime()) / 86400000;
        expect(days).toBeCloseTo(sat.repeatDays, 6);
      }
      for (const win of w) {
        expect(win.utc.getTime()).toBeGreaterThanOrEqual(new Date("2026-10-03T00:00:00Z").getTime());
        // Honesty flag: these dates are cycle arithmetic, not an ephemeris.
        expect(win.nominal).toBe(true);
      }
    }
  });

  it("merges and sorts windows across the constellation", () => {
    const all = nextWindows({ lat: LAT, lon: LON, perSat: 2, from: new Date("2026-10-03T00:00:00Z") });
    expect(all.length).toBe(SATELLITES.length * 2);
    for (let i = 1; i < all.length; i++) {
      expect(all[i].utc.getTime()).toBeGreaterThanOrEqual(all[i - 1].utc.getTime());
    }
  });

  it("formats hours the way a schedule reads", () => {
    expect(formatHours(10.2)).toBe("10:12");
    expect(formatHours(18)).toBe("18:00");
    expect(formatHours(-1)).toBe("23:00");
  });

  it("lays a swath across the frame at the right width and heading", () => {
    const sat = SAT_BY_ID.get("sentinel-1a")!;
    const sw = swathAcross(sat, { bbox: BBOX, lon: LON, lat: LAT })!;
    expect(sw.swathKm).toBe(sat.swathKm);
    // Edges are half a swath either side of the centreline.
    // Edge separation holds at both ends of the track, not just at the centre.
    for (const i of [0, Math.floor(sw.centre.length / 2), sw.centre.length - 1]) {
      const c = sw.centre[i];
      const l = sw.left[i];
      const r = sw.right[i];
      expect(distanceKm(c[0], c[1], l[0], l[1])).toBeCloseTo(sat.swathKm / 2, 0);
      expect(distanceKm(c[0], c[1], r[0], r[1])).toBeCloseTo(sat.swathKm / 2, 0);
      expect(distanceKm(l[0], l[1], r[0], r[1])).toBeCloseTo(sat.swathKm, -1);
    }
    // And the track is long enough to cross the whole theater.
    const a = sw.centre[0];
    const b = sw.centre[sw.centre.length - 1];
    expect(distanceKm(a[0], a[1], b[0], b[1])).toBeGreaterThan(
      (BBOX.lat1 - BBOX.lat0) * 111.32,
    );
  });
});
