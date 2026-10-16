import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";

const root = process.cwd();
const htmlBytes = readFileSync(path.join(root, "greeran-family-4dwm.html"));
const html = htmlBytes.toString("utf8");
const sha256 = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");

function embeddedArray(name: string) {
  const match = html.match(new RegExp(`const ${name}=(\\[.*?\\]);\\n`, "s"));
  if (!match) throw new Error(`missing ${name}`);
  return { raw: match[1], value: JSON.parse(match[1]) };
}

describe("Greeran Family Tree 4DWM", () => {
  it("preserves the four Drive-source datasets byte for byte", () => {
    const expected = {
      LOCS: [79, "2f9ed0723706ee468540d4bf670e2ae58cfc9f74360b8c340b43a9a9afa2051b"],
      MIGS: [15, "5905212171cfd54feaf5bfbcfb615e42fe30746621665d1d0a1479f4c6007871"],
      PEOPLE: [2089, "816c6c061b23697704cf736fea82b4310a39e589876c7a5fc3020b0d6f6d1ac7"],
      FAMILIES: [588, "df55d9fdf87ae97319d3ece9c823c08e658d30c0f63047664f4e532d49c6d167"],
    } as const;

    for (const [name, [count, digest]] of Object.entries(expected)) {
      const data = embeddedArray(name);
      expect(data.value).toHaveLength(count);
      expect(sha256(data.raw)).toBe(digest);
    }
  });

  it("contains an offline time-scrubbable globe with all-time fallback", () => {
    expect(html).toContain('id="time-slider"');
    expect(html).toContain('id="time-window"');
    expect(html).toContain("const TIME_EVENTS=[]");
    expect(html).toContain("const TIME_ARCS=[]");
    expect(html).toContain("function temporalLocations()");
    expect(html).toContain("function togTime()");
    expect(html).toContain("frameLocs=timeMode?temporalLocations():LOCS");
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).toContain("const BIBLE_DATA_URL='./public/apps/greeran-family-bible/complete-bible.json'");
    expect(html).toMatch(/fetch\(BIBLE_DATA_URL\)/);
    expect(html).not.toMatch(/fetch\(\s*['\"`]https?:/i);
  });

  it("includes the locally bundled, public-domain WEBU eBook and the untouched FNA ZIP", () => {
    const biblePath = path.join(root, "public/apps/greeran-family-bible/complete-bible.json");
    const bibleBytes = readFileSync(biblePath);
    const verses = JSON.parse(bibleBytes.toString("utf8"));
    const metadata = JSON.parse(readFileSync(path.join(root, "public/apps/greeran-family-bible/metadata.json"), "utf8"));
    const fnaBytes = readFileSync(path.join(root, "samples/archive/kirkpatrick/FNA102B.ZIP"));
    expect(verses).toHaveLength(31_098);
    expect(sha256(bibleBytes)).toBe("9ea9afde1fbcdf521025a56c055c738c87d357bf6874f66f240d583afda94d3f");
    expect(sha256(fnaBytes)).toBe("341271dbce5aa7ed864fd9fd2d9fd41c1c17f2ccaf524178ac945ad1e9d94caf");
    expect(new Set(verses.map((verse: { book: string }) => verse.book)).size).toBe(66);
    expect(metadata.translation.code).toBe("WEBU");
    expect(metadata.translation.license).toContain("CC0-1.0");
    expect(html).toContain("The Tree of Life");
    expect(html).toContain("The Holy Bible · World English Bible Updated");
    expect(html).toContain("not as evidence of a historical or biological relationship");
    expect(html).toContain("./samples/archive/kirkpatrick/FNA102B.ZIP");
    expect(html).toContain("No overlay has been decrypted, extracted, or used");
    expect(fnaBytes.length).toBeGreaterThan(0);
  });

  it("packages the same application and offline resources in a valid reproducible Webxdc", () => {
    const xdc = readFileSync(path.join(root, "greeran-family-4dwm.xdc"));
    const files = unzipSync(new Uint8Array(xdc));
    expect(Object.keys(files).sort()).toEqual([
      "icon.png", "index.html", "manifest.toml",
      "public/apps/greeran-family-bible/LICENSE",
      "public/apps/greeran-family-bible/README.md",
      "public/apps/greeran-family-bible/complete-bible.json",
      "public/apps/greeran-family-bible/metadata.json",
      "samples/archive/kirkpatrick/FNA102B.ZIP",
    ]);
    expect(Buffer.from(files["index.html"]).equals(htmlBytes)).toBe(true);
    expect(Buffer.from(files["public/apps/greeran-family-bible/complete-bible.json"]).equals(
      readFileSync(path.join(root, "public/apps/greeran-family-bible/complete-bible.json")),
    )).toBe(true);
    expect(Buffer.from(files["samples/archive/kirkpatrick/FNA102B.ZIP"]).equals(
      readFileSync(path.join(root, "samples/archive/kirkpatrick/FNA102B.ZIP")),
    )).toBe(true);
    expect(strFromU8(files["manifest.toml"])).toContain('name = "Greeran Family Tree · 4DWM"');
    expect(strFromU8(files["manifest.toml"])).toContain("https://github.com/shdwelf/Html5");
    expect(files["icon.png"].slice(0, 8)).toEqual(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  });
});
