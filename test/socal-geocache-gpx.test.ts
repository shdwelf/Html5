import { describe, expect, it } from "vitest";
import { GAZ_ROWS } from "../js/socal-gazetteer-data.js";
import { classRollup, makeGazetteerIndex, searchBox } from "../js/socal-gazetteer.js";
import { geocachesToGazetteerRows, parseGeocacheGpx } from "../js/socal-geocache-gpx.js";

const gpx = `<?xml version="1.0" encoding="utf-8"?>
<gpx version="1.0" xmlns="http://www.topografix.com/GPX/1/0" xmlns:groundspeak="http://www.groundspeak.com/cache/1/0/1">
  <wpt lat="34.2" lon="-117.5"><ele>1200</ele><name>GC12345</name><desc>Test Cache by someone, Traditional Cache (1.5/2)</desc>
    <urlname>Test Cache</urlname><type>Geocache|Traditional Cache</type>
    <groundspeak:cache><groundspeak:name>Test Cache</groundspeak:name><groundspeak:difficulty>1.5</groundspeak:difficulty><groundspeak:terrain>2</groundspeak:terrain></groundspeak:cache></wpt>
  <wpt lat="34.2" lon="-117.5"><name>GC12345</name></wpt>
  <wpt lat="95" lon="10"><name>GCBAD</name></wpt>
  <wpt lat="39.0" lon="-95.2"><name>GCKS01</name><urlname>Lawrence Cache</urlname></wpt>
  <wpt lat="35.1" lon="-118.1"><name>MY PRIVATE</name><desc>Private point</desc></wpt>
</gpx>`;

describe("geocache GPX import", () => {
  const parsed = parseGeocacheGpx(gpx);

  it("keeps valid cache waypoints and counts rejects", () => {
    expect(parsed.waypointCount).toBe(5);
    expect(parsed.caches.map((c) => c.cacheCode)).toEqual(["GC12345", "GCKS01", null]);
    expect(parsed.duplicates).toBe(1);
    expect(parsed.invalidCoordinates).toBe(1);
    expect(parsed.caches[0]).toMatchObject({ name: "Test Cache", elevationM: 1200, difficulty: 1.5, terrain: 2, cacheType: "Traditional Cache" });
  });

  it("rejects malformed XML and non-GPX roots", () => {
    expect(() => parseGeocacheGpx("<gpx><wpt></gpx>")).toThrow(/GPX/);
    expect(() => parseGeocacheGpx("<kml/>")).toThrow(/GPX/);
  });

  it("makes unverified rec.geocache rows that never claim a GNIS id", () => {
    const rows = geocachesToGazetteerRows(parsed.caches, { sourceFile: "pq.gpx", importedOn: "2026-10-07" });
    for (const r of rows) {
      expect(r.slice(1, 3)).toEqual(["Geocache", "rec.geocache"]);
      expect(r[7]).toBeNull();
      expect(r[8]).toBe(0);
      expect(String(r[9])).toContain("pq.gpx");
    }
    const idx = makeGazetteerIndex(GAZ_ROWS);
    const base = idx.entries.length;
    const added = idx.addRows(rows);
    expect(added[0].i).toBe(base);
    expect(searchBox(idx, { lat0: 34, lat1: 34.5, lon0: -117.6, lon1: -117.4 }, { classes: new Set(["Geocache"]) })).toHaveLength(1);
    expect(added[0].metadata).toMatchObject({ cacheCode: "GC12345", sourceFile: "pq.gpx" });
    idx.truncate(base);
    expect(idx.entries).toHaveLength(base);
    expect(classRollup(GAZ_ROWS).find((c) => c.fclass === "Geocache")?.count).toBe(0);
  });
});
