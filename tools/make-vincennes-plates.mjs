#!/usr/bin/env node
/**
 * Generate the DjVu plate fixtures under data/vincennes/djvu/.
 *
 * Why generated and not downloaded
 * --------------------------------
 * The real plates are the Fogarty report scan, the ICAO figures and the
 * Nimitz Graybook pages. They are public documents and this repo links to
 * every one of them, but it does not vendor them: they are tens to hundreds
 * of megabytes, their licensing is "public domain, probably, in most
 * jurisdictions", and a geometry viewer should not ship a 3,548-page scan to
 * prove it can read a chunk header.
 *
 * What these fixtures are instead: real DjVu byte streams \u2014 AT&T magic,
 * IFF85 chunks, a valid INFO, an ANTa annotation, and a TXTa hidden-text
 * layer with a real zone tree \u2014 carrying the transcribed text of the page
 * they stand in for, positioned where it sits on the page. No image layer,
 * because there is no scan. The viewer reads them with exactly the same code
 * path it uses for a file you drag in from EarthExplorer or archive.org.
 *
 *   node tools/make-vincennes-plates.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { encodePlate, parseDjvu } from "../js/vincennes-djvu.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "data/vincennes/djvu");

/** Lay lines out down a US-Letter-at-300dpi page, DjVu origin bottom-left. */
function typeset(linesIn, { top = 3000, leading = 62, x = 300, size = 46 } = {}) {
  return linesIn.map((l, i) => {
    const text = typeof l === "string" ? l : l.text;
    const indent = typeof l === "string" ? 0 : (l.indent ?? 0);
    const gap = typeof l === "string" ? 0 : (l.gapBefore ?? 0);
    return {
      text,
      x: x + indent * 90,
      y: top - i * leading - gap,
      w: Math.max(40, Math.round(text.length * size * 0.52)),
      h: size,
    };
  });
}

const PLATES = [
  {
    file: "fogarty-encl5-timeline.djvu",
    theater: "hormuz-1988",
    title: "Fogarty report \u2014 chronology of events, 0647Z\u20130655Z",
    standsFor:
      "Investigation Report, Downing of Iran Air Flight 655 (DoD release scan), enclosure chronology",
    url: "https://time.com/wp-content/uploads/2014/03/dodvincennes.pdf",
    annotation: "(background #f4f1e8) (zoom page) (mode bw)",
    lines: typeset([
      "UNCLASSIFIED",
      { text: "CHRONOLOGY OF EVENTS \u2014 3 JULY 1988", gapBefore: 120 },
      { text: "All times Zulu.  Source: IO Exhibit 91, data reduction tape.", gapBefore: 30 },
      { text: "0647  IR655 departs Bandar Abbas rwy 21, squawk 6760.", gapBefore: 110 },
      { text: "0647  VINCENNES SPY-1A detection, brg 025, rng 47, 900 ft.", indent: 0 },
      "0648  SIDES detection, brg 355, rng 32, 1500 ft.",
      "0649  First MAD challenge transmitted on 243.0 MHz.",
      "0650  IDS reports Mode II 1100.  System holds Mode III 6760.",
      "0651  Track called ASTRO on the AAW net; tagged F-14.",
      "0652  CO advised POSSIBLE COMAIR.  Track at 20 nm, 10,000 ft.",
      "0653  Final IAD warning, 15.5 nm, brg 204 from VINCENNES.",
      "0654  Firing key turned 0654:05.  FIRING AUTHORIZE 0654:19.",
      "0654  Two SM-2 BLK II away 0654:22, one second apart.",
      "0654  Intercept 0654:43, 8 nm, 13,500 ft, 383 kt.",
      { text: "Elapsed from detection to launch: seven minutes, five seconds.", gapBefore: 110 },
      { text: "Impact site 6.5 statute miles east of Hengam Island at", gapBefore: 60 },
      "26-37.75N 056-01E, 3.37 miles west of the centerline of A-59.",
      { text: "UNCLASSIFIED", gapBefore: 160 },
    ]),
  },
  {
    file: "icao-figure-1-positions.djvu",
    theater: "hormuz-1988",
    title: "ICAO Figure 1 \u2014 unit positions at launch",
    standsFor: "ICAO C-WP/8708 Figure 1, as reproduced in the Yale J. Int'l L. and Iran's ICJ Memorial",
    url: "https://www.icj-cij.org/public/files/case-related/79/6629.pdf",
    annotation: "(background #ffffff) (zoom width)",
    lines: typeset([
      "FIGURE 1 \u2014 POSITIONS AT 0654:22 GMT",
      { text: "USS VINCENNES (CG-49)     26-30-47 N   056-00-57 E", gapBefore: 130 },
      "USS MONTGOMERY (FF-1082)  26-31-00 N   055-55-12 E",
      "IR 655 at launch          26-40-06 N   056-02-41 E",
      "IR 655 at impact          26-40-06 N   056-02-41 E",
      { text: "Airway A-59 is 20 nautical miles wide, ten miles either side of", gapBefore: 120 },
      "the centerline.  Flight 655 remained within four miles of that",
      "centerline throughout, and within the airway at all times.",
      { text: "The launching ship was inside the territorial sea of the", gapBefore: 110 },
      "Islamic Republic of Iran at the moment of firing.",
    ]),
  },
  {
    file: "graybook-v1-savo.djvu",
    theater: "savo-1942",
    title: "Nimitz Graybook vol. 1 \u2014 Savo Island, 9 August 1942",
    standsFor: "Command Summary of Fleet Admiral Chester W. Nimitz, Volume 1, running estimate for 9 Aug 1942",
    url: "https://www.usnwcarchives.org/repositories/2/digital_objects/22",
    annotation: "(background #efe9d8) (zoom page)",
    lines: typeset([
      "RUNNING ESTIMATE OF THE SITUATION",
      { text: "9 AUGUST 1942", gapBefore: 40 },
      { text: "Northern group, screening force TULAGI-GUADALCANAL:", gapBefore: 120 },
      { text: "VINCENNES, QUINCY, ASTORIA, with HELM and WILSON,", indent: 1 },
      { text: "patrolling a five mile square northeast of SAVO,", indent: 1 },
      { text: "speed ten knots, changing course ninety degrees", indent: 1 },
      { text: "every half hour.", indent: 1 },
      { text: "0143  Enemy force illuminated and opened fire on the", gapBefore: 110 },
      { text: "southern group.  Northern group turned to 045 at", indent: 1 },
      { text: "0150 on completion of the leg then in progress.", indent: 1 },
      { text: "0250  VINCENNES capsized and sank, position 09-10 S,", gapBefore: 70 },
      { text: "159-52 E, approximately two and one half miles", indent: 1 },
      { text: "east of SAVO ISLAND.  Casualties 332.", indent: 1 },
      { text: "Losses this action: VINCENNES, QUINCY, ASTORIA,", gapBefore: 110 },
      { text: "HMAS CANBERRA sunk.  CHICAGO damaged.", indent: 1 },
    ]),
  },
  {
    file: "graybook-v5-formosa.djvu",
    theater: "leyte-1944",
    title: "Nimitz Graybook vol. 5 \u2014 Formosa strikes and Cripple Division 1",
    standsFor: "Command Summary of Fleet Admiral Chester W. Nimitz, Volume 5, pp. 270\u2013272",
    url: "https://www.usnwcarchives.org/repositories/2/digital_objects/22",
    annotation: "(background #efe9d8) (zoom page)",
    lines: typeset([
      "RUNNING ESTIMATE OF THE SITUATION",
      { text: "14 \u2013 16 OCTOBER 1944", gapBefore: 40 },
      { text: "14 Oct 0700 (I)  CANBERRA torpedoed by aircraft east of", gapBefore: 120 },
      { text: "FORMOSA, lat 22-33.6 N long 123-25.8 E.  Taken in tow", indent: 1 },
      { text: "by WICHITA, making good four and one half knots.", indent: 1 },
      { text: "14 Oct 1800 (I)  HOUSTON hit aft, taken in tow by", gapBefore: 70 },
      { text: "BOSTON, three knots.", indent: 1 },
      { text: "14 Oct 2300 (Z)  BESUGO reports enemy cruiser force", gapBefore: 70 },
      { text: "standing out of BUNGO SUIDO, course 140, speed 18.", indent: 1 },
      { text: "16 Oct 1422 (I)  HOUSTON hit a second time, still in", gapBefore: 70 },
      { text: "tow.  CRIPDIV 1 retiring towards ULITHI.", indent: 1 },
      { text: "25 Oct 0240 (I)  TASK GROUP 34.5 formed under ComBatDiv 7:", gapBefore: 110 },
      { text: "IOWA, NEW JERSEY, BILOXI, VINCENNES, MIAMI and eight", indent: 1 },
      { text: "destroyers, to sweep SAN BERNARDINO STRAIT.", indent: 1 },
      { text: "26 Oct 0035 (I)  NOWAKI brought to action and sunk by", gapBefore: 70 },
      { text: "gunfire and torpedoes off SAN BERNARDINO.", indent: 1 },
    ]),
  },
];

mkdirSync(outDir, { recursive: true });
const manifest = [];
for (const plate of PLATES) {
  const bytes = encodePlate({
    width: 2550,
    height: 3300,
    dpi: 300,
    gamma: 2.2,
    annotation: plate.annotation,
    lines: plate.lines,
  });
  const path = resolve(outDir, plate.file);
  writeFileSync(path, bytes);

  // Never ship a fixture the reader cannot read.
  const doc = parseDjvu(bytes);
  const txt = doc.pages[0]?.text?.[0];
  if (!doc.magic) throw new Error(`${plate.file}: magic lost`);
  if (txt?.zoneParse !== "ok") throw new Error(`${plate.file}: zone round-trip failed (${txt?.zoneParse})`);
  const got = txt.text.split("\n");
  const want = plate.lines.map((l) => l.text);
  if (got.length !== want.length || got.some((g, i) => g !== want[i])) {
    throw new Error(`${plate.file}: text round-trip mismatch`);
  }

  manifest.push({
    file: `djvu/${plate.file}`,
    theater: plate.theater,
    title: plate.title,
    standsFor: plate.standsFor,
    url: plate.url,
    bytes: bytes.length,
    pageWidth: 2550,
    pageHeight: 3300,
    dpi: 300,
    lines: plate.lines.length,
    chars: txt.text.length,
    zones: txt.zoneCount,
    generated: true,
  });
  console.log(
    `${plate.file.padEnd(34)} ${String(bytes.length).padStart(6)} B  ` +
      `${String(txt.zoneCount).padStart(3)} zones  ${txt.text.length} chars  \u2713 round-trip`
  );
}

const manifestPath = resolve(root, "data/vincennes/plates.json");
writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      meta: {
        kind: "djvu plate manifest",
        generated: "tools/make-vincennes-plates.mjs",
        status:
          "GENERATED FIXTURES, NOT SCANS. Each file is a structurally valid DjVu carrying the transcribed text of the page it stands for, with no image layer. The real documents are linked per plate.",
        reader: "js/vincennes-djvu.js",
      },
      plates: manifest,
    },
    null,
    2
  ) + "\n"
);
console.log(`\nwrote ${manifestPath}`);
