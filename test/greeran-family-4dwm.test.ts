import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";

const root = process.cwd();
const htmlBytes = readFileSync(path.join(root, "greeran-family-4dwm.html"));
const html = htmlBytes.toString("utf8");
const nameResourceReview = readFileSync(path.join(root, "docs/greeran-name-resources.md"), "utf8");
const wiktionaryNotice = readFileSync(path.join(root, "assets/greeran/WIKTIONARY-NAME-NOTES-LICENSE.md"), "utf8");
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

  it("includes the locally bundled WEBU reader and untouched Kirkpatrick ZIP", () => {
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
    expect(html).toContain("The Holy Bible · World English Bible Updated");
    expect(html).toContain("not as evidence of a historical or biological relationship");
    expect(html).toContain("./samples/archive/kirkpatrick/FNA102B.ZIP");
    expect(html).toContain("No overlay has been decrypted, extracted, or used");
  });

  it("offers explicit, first-name-only NameAlmanac and English Wiktionary lookups", () => {
    expect(html).toContain("function firstGivenName(fullName)");
    expect(html).toContain("function nameAlmanacUrl(name)");
    expect(html).toContain("function wiktionaryUrl(name)");
    expect(html).toContain("https://namealmanac.com/name/${slug}");
    expect(html).toContain("https://en.wiktionary.org/wiki/${encodeURIComponent(title)}#English");
    expect(html).toContain('target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer"');
    expect(html).toContain("Optional external links use only this first name");
    expect(html).toContain("the app makes no background lookup");
  });

  it("includes attributed Wiktionary etymology notes for a small reviewed set", () => {
    for (const name of ["mary", "john", "william", "bernard", "hugh", "catherine"]) {
      expect(html).toContain(`${name}:{note:`);
      expect(wiktionaryNotice).toContain(`wiki/${name[0].toUpperCase()}${name.slice(1)}#English`);
    }
    expect(html).toContain("CC BY-SA 4.0");
    expect(html).toContain('href="./assets/greeran/WIKTIONARY-NAME-NOTES-LICENSE.md"');
    expect(wiktionaryNotice).toContain("https://creativecommons.org/licenses/by-sa/4.0/");
    expect(wiktionaryNotice).toContain("Changes by this project");
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
    expect(html).toContain("const BIBLE_DATA_URL='./public/apps/greeran-family-bible/complete-bible.json'");
    expect(html).toMatch(/fetch\(BIBLE_DATA_URL\)/);
    expect(html).not.toMatch(/fetch\(\s*['\"`]https?:/i);
  });

  it("packages the application and its companion files in a valid Webxdc", () => {
    const xdc = readFileSync(path.join(root, "greeran-family-4dwm.xdc"));
    const files = unzipSync(new Uint8Array(xdc));
    expect(Object.keys(files).sort()).toEqual([
      "assets/greeran/WIKTIONARY-NAME-NOTES-LICENSE.md",
      "assets/greeran/family-tree-qr.svg",
      "assets/greeran/world-english-bible-epub-qr.svg",
      "assets/greeran/world-english-bible.epub",
      "greeran-family-4dwm.ged",
      "icon.png",
      "index.html",
      "manifest.toml",
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
    const packedNotice = strFromU8(files["assets/greeran/WIKTIONARY-NAME-NOTES-LICENSE.md"]);
    expect(packedNotice).toBe(wiktionaryNotice);
    expect(packedNotice).toContain("CC BY-SA 4.0");
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
