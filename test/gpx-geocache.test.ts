import { createHash, webcrypto } from "node:crypto";
import { unzipSync } from "../vendor/fflate/index.mjs";
import { describe, expect, it, vi } from "vitest";
import {
  MAX_GPX_FILE_BYTES,
  cacheToGazetteerRow,
  createGpxPreservationBag,
  createNormalizedGeocacheXml,
  parseGeomateGpx,
  safeGpxFilename,
} from "../js/gpx-geocache.js";
import { makeGazetteerIndex, searchName } from "../js/socal-gazetteer.js";

const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:groundspeak="http://www.groundspeak.com/cache/1/0/1"
     version="1.1" creator="unit-test">
  <wpt lat="34.050000" lon="-118.250000">
    <name>GCABC</name><type>Geocache|Traditional Cache</type>
    <extensions><groundspeak:cache id="GCABC" available="True" archived="False">
      <groundspeak:name>Little Hill</groundspeak:name>
      <groundspeak:type>Traditional Cache</groundspeak:type>
      <groundspeak:container>Small</groundspeak:container>
      <groundspeak:difficulty>2</groundspeak:difficulty>
      <groundspeak:terrain>2.5</groundspeak:terrain>
      <groundspeak:owner>Private owner name</groundspeak:owner>
      <groundspeak:long_description html="True">Spoiler description not copied to the derivative.</groundspeak:long_description>
    </groundspeak:cache></extensions>
  </wpt>
  <wpt lat="40.000000" lon="-73.000000">
    <name>GCOUT</name><type>Geocache|Traditional Cache</type>
  </wpt>
  <wpt lat="not-a-number" lon="-118.000000">
    <name>GCERR</name><type>Geocache|Traditional Cache</type>
  </wpt>
  <wpt lat="34.050000" lon="-118.250000">
    <name>GCABC</name><type>Geocache|Traditional Cache</type>
  </wpt>
  <wpt lat="34.100000" lon="-118.300000">
    <name>Trailhead</name><sym>Waypoint</sym>
  </wpt>
</gpx>`;

describe("Geomate-compatible GPX import", () => {
  it("accepts GPX 1.1, keeps only geocache fields, and separates map coverage", () => {
    const parsed = parseGeomateGpx(GPX, { sourceName: "Pocket Query.gpx" });
    expect(parsed.gpxVersion).toBe("1.1");
    expect(parsed.sourceName).toBe("Pocket_Query.gpx");
    expect(parsed.caches).toHaveLength(2);
    expect(parsed.inFrameCaches).toHaveLength(1);
    expect(parsed.caches[0]).toMatchObject({
      cacheCode: "GCABC",
      name: "Little Hill",
      cacheType: "Traditional Cache",
      container: "Small",
      difficulty: 2,
      terrain: 2.5,
      lat: 34.05,
      lon: -118.25,
      inFrame: true,
    });
    expect(parsed.caches[1]).toMatchObject({ cacheCode: "GCOUT", inFrame: false });
    expect(parsed.stats).toMatchObject({
      waypoints: 5,
      cacheWaypoints: 4,
      normalized: 2,
      importedToMap: 1,
      nonCacheWaypoints: 1,
      invalidCoordinates: 1,
      duplicates: 1,
      outOfFrame: 1,
      omittedBeyondLimit: 0,
    });

    const row = cacheToGazetteerRow(parsed.inFrameCaches[0], parsed.sourceName);
    expect(row.slice(0, 5)).toEqual(["Little Hill (GCABC)", "Geocache", "rec.geocache", "Imported GPX", 34.05]);
    expect(row[10]).toMatchObject({ type: "GPX", file: "Pocket_Query.gpx", cacheCode: "GCABC" });
  });

  it("does not parse unsupported XML or expand document type declarations", () => {
    expect(() => parseGeomateGpx("<html><wpt/></html>")).toThrow(/not well-formed GPX/);
    expect(() => parseGeomateGpx("<!DOCTYPE gpx [<!ENTITY x 'x'>]><gpx version='1.1'/>")).toThrow(/DOCTYPE/);
    expect(() => parseGeomateGpx(GPX.replace("version=\"1.1\"", "version=\"2.0\""))).toThrow(/Only GPX 1.0 and GPX 1.1/);
    expect(() => parseGeomateGpx(GPX, { maxBytes: 16 })).toThrow(/import limit/);
  });

  it("bounds cache records without silently claiming a complete normalization", () => {
    const smallCap = parseGeomateGpx(GPX, { maxCaches: 1 });
    expect(smallCap.caches).toHaveLength(1);
    expect(smallCap.stats.omittedBeyondLimit).toBe(1);
  });

  it("normalizes to documented XML without private owner, hint or description fields", () => {
    const parsed = parseGeomateGpx(GPX);
    const normalized = createNormalizedGeocacheXml(parsed, {
      sourceSha256: "a".repeat(64),
      importedAt: "2026-10-08T12:00:00.000Z",
    });
    expect(normalized).toContain("urn:shdwelf:geomate-gpx-normalized:1");
    expect(normalized).toContain("GCOUT"); // off-frame caches remain in the preservation rendition
    expect(normalized).not.toContain("Private owner name");
    expect(normalized).not.toContain("Spoiler description");
    expect(normalized).not.toContain("Xena");

    const indexed = makeGazetteerIndex([
      cacheToGazetteerRow(parsed.inFrameCaches[0], parsed.sourceName),
    ]);
    expect(searchName(indexed, "GCABC", { facet: "rec" })[0]?.cacheCode).toBe("GCABC");
  });

  it("creates a BagIt ZIP with an unchanged source, normalized renditions, and valid manifests", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const originalBytes = new TextEncoder().encode(GPX);
    const sourceFile = {
      name: "Pocket Query.gpx",
      size: originalBytes.byteLength,
      arrayBuffer: async () => originalBytes.buffer.slice(
        originalBytes.byteOffset,
        originalBytes.byteOffset + originalBytes.byteLength,
      ),
    } as File;
    const parsed = parseGeomateGpx(GPX, { sourceName: sourceFile.name });
    const bag = await createGpxPreservationBag({
      sourceFile,
      parsed,
      importedAt: "2026-10-08T12:00:00.000Z",
    });
    const files = unzipSync(bag.bytes);
    expect(Object.keys(files)).toContain("bagit.txt");
    const decode = (name: string) => {
      expect(files[name], `BagIt member ${name}`).toBeDefined();
      return new TextDecoder().decode(files[name]);
    };
    const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

    expect(bag.fileName).toBe("Pocket_Query-preservation-bag.zip");
    expect(bag.complete).toBe(true);
    expect(decode("bagit.txt")).toContain("BagIt-Version: 1.0");
    expect(decode("data/original/Pocket_Query.gpx")).toBe(GPX);
    expect(decode("metadata/preservation-event.json")).toContain("application-defined");
    expect(decode("data/normalized/geocache-register.xml")).toContain("GCOUT");
    expect(decode("data/normalized/geocache-register.json")).not.toContain("Private owner name");
    expect(bag.originalSha256).toBe(sha256(originalBytes));

    for (const line of decode("manifest-sha256.txt").trim().split("\n")) {
      const [digest, path] = line.split(/\s{2,}/);
      expect(files[path]).toBeDefined();
      expect(sha256(files[path])).toBe(digest);
    }
    for (const line of decode("tagmanifest-sha256.txt").trim().split("\n")) {
      const [digest, path] = line.split(/\s{2,}/);
      expect(files[path]).toBeDefined();
      expect(sha256(files[path])).toBe(digest);
    }
  });

  it("rejects an oversized preservation source before allocating its bytes", async () => {
    const arrayBuffer = vi.fn();
    const sourceFile = { name: "large.gpx", size: MAX_GPX_FILE_BYTES + 1, arrayBuffer } as unknown as File;
    await expect(createGpxPreservationBag({ sourceFile, parsed: parseGeomateGpx(GPX) })).rejects.toThrow(/preservation export limit/);
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it("uses safe leaf names in the preservation archive", () => {
    expect(safeGpxFilename("../../private GPX.gpx")).toBe("private_GPX.gpx");
    expect(safeGpxFilename("C:\\users\\cache.gpx")).toBe("cache.gpx");
  });
});
