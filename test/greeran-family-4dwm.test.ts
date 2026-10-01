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
    expect(html).not.toMatch(/\bfetch\s*\(/);
  });

  it("packages the same application in a valid reproducible Webxdc", () => {
    const xdc = readFileSync(path.join(root, "greeran-family-4dwm.xdc"));
    const files = unzipSync(new Uint8Array(xdc));
    expect(Object.keys(files).sort()).toEqual(["icon.png", "index.html", "manifest.toml"]);
    expect(Buffer.from(files["index.html"]).equals(htmlBytes)).toBe(true);
    expect(strFromU8(files["manifest.toml"])).toContain('name = "Greeran Family Tree · 4DWM"');
    expect(strFromU8(files["manifest.toml"])).toContain("https://github.com/shdwelf/Html5");
    expect(files["icon.png"].slice(0, 8)).toEqual(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  });
});
