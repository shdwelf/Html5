import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";

const root = process.cwd();
const htmlBytes = readFileSync(path.join(root, "greeran-family-4dwm.html"));
const html = htmlBytes.toString("utf8");
const nameResourceReview = readFileSync(path.join(root, "docs/greeran-name-resources.md"), "utf8");
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

  it("adds an accessible keepsake preface, baseline GEDCOM, and inside-cover Bible link", () => {
    expect(html).toContain('data-t="book"');
    expect(html).toContain('id="p-book"');
    expect(html).toContain("THE TREE OF LIFE");
    expect(html).toContain("Inside back cover");
    expect(html).toContain('href="./greeran-family-4dwm.ged" download');
    expect(html).toContain('href="./assets/greeran/world-english-bible.epub" download');
    expect(html.match(/<details class="kp-qr-card" id="qr-/g)).toHaveLength(2);
    expect(html).not.toContain("PLACEHOLDER_FAMILY_QR");
    expect(html).not.toContain("PLACEHOLDER_BIBLE_QR");
  });

  it("offers an explicit, first-name-only NameAlmanac lookup without background requests", () => {
    expect(html).toContain("function firstGivenName(fullName)");
    expect(html).toContain("function nameAlmanacUrl(name)");
    expect(html).toContain("https://namealmanac.com/name/${slug}");
    expect(html).toContain('target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer"');
    expect(html).toContain("Optional external lookup using only this first name.");
    expect(html).toContain("the app does not send a name lookup in the background");
  });

  it("records provenance and reuse terms for all six supplied name resources", () => {
    for (const url of [
      "https://github.com/tfmorris/Names",
      "https://namealmanac.com/about",
      "https://github.com/FinNLP/humannames",
      "https://github.com/teamclairvoyant/NameDatabases",
      "https://github.com/KarlAmort/firstname-database",
      "https://github.com/Debdut/names.io",
    ]) {
      expect(nameResourceReview).toContain(url);
    }
    expect(nameResourceReview).toContain("CC BY 4.0");
    expect(nameResourceReview).toContain("CC BY-SA 4.0");
    expect(nameResourceReview).toContain("No meaning, frequency, gender classification, or name variant has been copied into the GEDCOM");
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

  it("packages the application and its companion files in a valid Webxdc", () => {
    const xdc = readFileSync(path.join(root, "greeran-family-4dwm.xdc"));
    const files = unzipSync(new Uint8Array(xdc));
    expect(Object.keys(files).sort()).toEqual([
      "assets/greeran/world-english-bible.epub",
      "greeran-family-4dwm.ged",
      "icon.png",
      "index.html",
      "manifest.toml",
    ]);
    expect(Buffer.from(files["index.html"]).equals(htmlBytes)).toBe(true);
    expect(strFromU8(files["manifest.toml"])).toContain('name = "Greeran Family Tree · 4DWM"');
    expect(strFromU8(files["manifest.toml"])).toContain("https://github.com/shdwelf/Html5");
    expect(files["icon.png"].slice(0, 8)).toEqual(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    );

    const gedcom = strFromU8(files["greeran-family-4dwm.ged"]);
    expect((gedcom.match(/^0 @[^\r\n]+@ INDI$/gm) ?? [])).toHaveLength(2090);
    expect((gedcom.match(/^0 @[^\r\n]+@ FAM$/gm) ?? [])).toHaveLength(588);
    expect(gedcom).toContain("Baseline GEDCOM export");
    expect(gedcom).toContain("no Kirkpatrick or first-name-meaning data has been merged");
    expect(gedcom).toContain("0 @INEW001@ INDI");
    expect(gedcom).toContain("Blank placeholder");
    const individualIds = new Set(
      [...gedcom.matchAll(/^0 (@[A-Z0-9]+@) INDI$/gm)].map((match) => match[1]),
    );
    const familyIds = new Set(
      [...gedcom.matchAll(/^0 (@[A-Z0-9]+@) FAM$/gm)].map((match) => match[1]),
    );
    for (const line of gedcom.split(/\r?\n/)) {
      const familyMember = line.match(/^1 (?:HUSB|WIFE|CHIL) (@[A-Z0-9]+@)$/);
      if (familyMember) expect(individualIds.has(familyMember[1])).toBe(true);
      const personFamily = line.match(/^1 (?:FAMS|FAMC) (@[A-Z0-9]+@)$/);
      if (personFamily) expect(familyIds.has(personFamily[1])).toBe(true);
    }

    const epubBytes = files["assets/greeran/world-english-bible.epub"];
    expect(Buffer.from(epubBytes).equals(readFileSync(path.join(root, "assets/greeran/world-english-bible.epub")))).toBe(true);
    const epub = unzipSync(new Uint8Array(epubBytes));
    expect(strFromU8(epub["mimetype"])).toBe("application/epub+zip");
    expect(strFromU8(epub["OEBPS/package.opf"])).toContain("World English Bible (WEB)");
    expect(strFromU8(epub["OEBPS/about.xhtml"])).toContain("public-domain");
    const bookDocs = Object.entries(epub).filter(([name]) => /^OEBPS\/book-\d{2}-.+\.xhtml$/.test(name));
    expect(bookDocs).toHaveLength(66);
    const verseCount = bookDocs.reduce(
      (sum, [, bytes]) => sum + (strFromU8(bytes).match(/class="verse" id=/g) ?? []).length,
      0,
    );
    expect(verseCount).toBe(31_103);
  });
});
