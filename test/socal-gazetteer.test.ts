import { describe, expect, it } from "vitest";
import { GAZ_CLASSES, GAZ_META, GAZ_ROWS } from "../js/socal-gazetteer-data.js";
import {
  classRollup,
  describe as describeEntry,
  getCapabilities,
  haversineKm,
  makeGazetteerIndex,
  normalizeName,
  searchBox,
  searchName,
  searchPoint,
  trigramsFor,
} from "../js/socal-gazetteer.js";

const idx = makeGazetteerIndex(GAZ_ROWS);
// Fixed rows use ten tuple fields; session GPX rows may append source metadata as field 11.
const byNameClass = new Map(GAZ_ROWS.map((r) => [`${r[0]}|${r[1]}`, r]));

describe("fixed Gazetteer snapshot integrity", () => {
  it("has a healthy row count and bounded bbox", () => {
    expect(GAZ_ROWS.length).toBeGreaterThan(400);
    for (const r of GAZ_ROWS) {
      expect(r[4]).toBeGreaterThanOrEqual(GAZ_META.bbox.lat0);
      expect(r[4]).toBeLessThanOrEqual(GAZ_META.bbox.lat1);
      expect(r[5]).toBeGreaterThanOrEqual(GAZ_META.bbox.lon0);
      expect(r[5]).toBeLessThanOrEqual(GAZ_META.bbox.lon1);
      expect(r[2]).toMatch(/^(phys|hydro|pop|admin|manmade|rec)\./);
    }
  });

  it("anchors known FEATURE_IDs for the verified tier", () => {
    expect(byNameClass.get("Mount Whitney|Summit")).toMatchObject({ 7: "269051", 8: 1 });
    expect(byNameClass.get("Death Valley|Valley")).toMatchObject({ 7: "270787", 8: 1 });
    expect(byNameClass.get("Cajon Pass|Gap")).toMatchObject({ 7: "270155", 8: 1 });
    expect(byNameClass.get("Salton Sea|Lake")).toMatchObject({ 7: "248771", 8: 1 });
    expect(byNameClass.get("Salton Sea|Lake")![6]).toBe(-69);
    expect(byNameClass.get("Mono Lake|Lake")).toMatchObject({ 7: "263749", 8: 1 });
    expect(byNameClass.get("Telescope Peak|Summit")).toMatchObject({ 7: "250316", 8: 1 });
    expect(byNameClass.get("Panamint Range|Range")).toMatchObject({ 7: "1654983", 8: 1 });
  });

  it("never claims an invented FEATURE_ID on curated rows", () => {
    for (const r of GAZ_ROWS) {
      if (r[8] === 1) expect(r[7]).toMatch(/^\d+$/);
      else expect(r[7]).toBeNull();
    }
  });

  it("keeps name+class unique after dedupe", () => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const keys = GAZ_ROWS.map((r) => `${norm(r[0] as string)}|${r[1]}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps unsupported cache records out of the fixed GNIS/curated seed pack", () => {
    expect(GAZ_ROWS.length).toBe(GAZ_META.rowCount);
    expect(GAZ_ROWS.some((row) => row[1] === "Geocache")).toBe(false);
    expect(GAZ_CLASSES).not.toContain("Geocache");
    expect(GAZ_CLASSES).toEqual(expect.arrayContaining(["Military", "Canal", "Census", "Cape"]));
    expect(byNameClass.has("Edwards Air Force Base|Military")).toBe(true);
    expect(byNameClass.has("March Air Reserve Base|Military")).toBe(true);
    expect(byNameClass.has("All American Canal|Canal")).toBe(true);
    expect(byNameClass.has("Coachella Canal|Canal")).toBe(true);
    expect(byNameClass.has("Colorado River Aqueduct|Canal")).toBe(true);
    expect(GAZ_ROWS.filter((r) => r[0] === "Crowley Lake")).toHaveLength(2); // Lake + Reservoir duplicate classes coexist
    expect(byNameClass.has("Point Conception|Cape")).toBe(true);
    expect(byNameClass.has("Manzanar National Historic Site|Park")).toBe(true);
  });
});

describe("normalization + pg_trgm similarity", () => {
  it("folds case and punctuation", () => {
    expect(normalizeName("  Cajon PASS's, EAST ")).toBe("cajon pass s east");
    expect(normalizeName("Mt. Baldy")).toBe("mt baldy");
  });

  it("trigram sets are space-padded and stable", () => {
    const a = trigramsFor("cajon");
    expect(a.has(" ca")).toBe(true);
    expect(a.has("caj")).toBe(true);
    expect(a.has("on ")).toBe(true);
  });

  it("search-name hits exact matches tightly", () => {
    const hits = searchName(idx, "cajon pass", { limit: 5 });
    expect(hits[0].name).toBe("Cajon Pass");
    expect(hits[0].score).toBeGreaterThan(0.8);
  });

  it("search-name tolerates typos (mojve → Mojave)", () => {
    const hits = searchName(idx, "mojve river", { limit: 10 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.map((h) => h.name)).toContain("Mojave River");
  });

  it("search-name facet filters by FTT branch", () => {
    const physOnly = searchName(idx, "lake", { facet: "phys", limit: 40 });
    expect(physOnly.length).toBeGreaterThan(0);
    expect(physOnly.every((h) => h.ftt.startsWith("phys."))).toBe(true);
    const hydroOnly = searchName(idx, "lake", { facet: "hydro", limit: 60 });
    expect(hydroOnly.length).toBeGreaterThan(5);
    expect(hydroOnly.every((h) => h.ftt.startsWith("hydro."))).toBe(true);
    expect(searchName(idx, "cache", { facet: "rec", limit: 20 })).toEqual([]);
    const localCache = ["Example cache (GC123)", "Geocache", "rec.geocache", "Imported GPX", 34.05, -118.25, null, null, 0, "user-supplied GPX"];
    const withLocalCache = makeGazetteerIndex([...GAZ_ROWS, localCache]);
    const recOnly = searchName(withLocalCache, "cache", { facet: "rec", limit: 20 });
    expect(recOnly).toHaveLength(1);
    expect(recOnly.every((h) => h.ftt.startsWith("rec."))).toBe(true);
  });

  it("county names act as a secondary match field", () => {
    const hits = searchName(idx, "inyo", { limit: 40 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.county.startsWith("Inyo") || h.norm.startsWith("inyo"))).toBe(true);
  });
});

describe("GSP spatial ops", () => {
  it("search-box bounds the Cajon corridor", () => {
    const box = searchBox(idx, { lat0: 34.25, lat1: 34.4, lon0: -117.5, lon1: -117.3 });
    const names = box.map((r) => r.name);
    expect(names).toContain("Cajon Pass");
    expect(names).toContain("Silverwood Lake");
  });

  it("search-box class filter picks only PPL rows", () => {
    const box = searchBox(idx, { lat0: 33, lat1: 34, lon0: -116, lon1: -115 }, { classes: new Set(["Populated Place"]) });
    expect(box.length).toBeGreaterThan(2);
    expect(box.every((r) => r.fclass === "Populated Place")).toBe(true);
  });

  it("search-point returns distance-ranked hits around Furnace Creek", () => {
    const p = searchPoint(idx, 36.4578, -116.8708, { radiusKm: 30, limit: 40 });
    expect(p.length).toBeGreaterThanOrEqual(4);
    const dists = p.map((e) => e.distKm);
    for (let i = 1; i < dists.length; i += 1) expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1]);
    expect(p[0].name).toBe("Furnace Creek");
  });

  it("search-point tiny radius lands on the Death Valley anchor pin", () => {
    const p = searchPoint(idx, 36.4569, -116.8653, { radiusKm: 1 });
    expect(p.map((e) => e.name)).toContain("Death Valley");
  });

  it("describe() finds by positional index", () => {
    const pos = GAZ_ROWS.findIndex((r) => r[0] === "Mount Whitney");
    expect(pos).toBeGreaterThan(-1);
    const got = describeEntry(idx, pos);
    expect(got?.name).toBe("Mount Whitney");
    expect(got?.gnis).toBe("269051");
  });
});

describe("bounded top-k ranking for larger local registers", () => {
  const cacheRows = Array.from({ length: 2500 }, (_, i) => [
    `Cache ${String(i).padStart(4, "0")}`,
    "Geocache",
    "rec.geocache",
    "Imported GPX",
    34 + i * 0.00001,
    -118,
    null,
    null,
    0,
    "local test row",
  ]);
  const cacheIndex = makeGazetteerIndex(cacheRows);

  it("returns the best name scores in deterministic order", () => {
    const hits = searchName(cacheIndex, "cache", {
      facet: "rec",
      classes: new Set(["Geocache"]),
      threshold: 0.5,
      limit: 10,
    });
    expect(hits.map((entry) => entry.name)).toEqual(
      Array.from({ length: 10 }, (_, i) => `Cache ${String(i).padStart(4, "0")}`),
    );
    expect(searchName(cacheIndex, "cache", { limit: 0 })).toEqual([]);
  });

  it("keeps only the nearest or alphabetically earliest spatial results", () => {
    const nearest = searchPoint(cacheIndex, 34, -118, { radiusKm: 3, limit: 5 });
    expect(nearest).toHaveLength(5);
    expect(nearest[0].name).toBe("Cache 0000");
    expect(nearest[4].name).toBe("Cache 0004");

    const box = searchBox(cacheIndex, { lat0: 33, lat1: 35, lon0: -119, lon1: -117 }, { limit: 5 });
    expect(box.map((entry) => entry.name)).toEqual(
      Array.from({ length: 5 }, (_, i) => `Cache ${String(i).padStart(4, "0")}`),
    );
  });
});

describe("capability + UI roll-ups", () => {
  it("getCapabilities advertises the ADL GSP op set and register stats", () => {
    const caps = getCapabilities(GAZ_ROWS);
    expect(caps.operations).toEqual(
      expect.arrayContaining(["get-capabilities", "search-name", "search-point", "search-box", "describe"]),
    );
    expect(caps.features).toBe(GAZ_ROWS.length);
    expect(caps.srs).toBe("EPSG:4326");
    expect(caps.classes).toEqual(expect.arrayContaining(["Military", "Canal", "Summit"]));
  });

  it("classRollup sums to the register size and exposes new classes", () => {
    const roll = classRollup(GAZ_ROWS);
    expect(roll.reduce((n, c) => n + c.count, 0)).toBe(GAZ_ROWS.length);
    expect(roll.map((c) => c.fclass)).toEqual(expect.arrayContaining(["Military", "Canal", "Census", "Cape"]));
  });

  it("haversine ballparks LA→Whitney", () => {
    const d = haversineKm(34.0522, -118.2437, 36.5786, -118.2924);
    expect(d).toBeGreaterThan(270);
    expect(d).toBeLessThan(300);
  });
});
