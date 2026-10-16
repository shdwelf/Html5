# Greeran Family Tree · 4DWM

`greeran-family-4dwm.html` is the offline, time-scrubbable globe conversion of the
Google Drive Webxdc `Greeran_Family_Tree.xdc`.

## Import provenance

- Drive file modified: **2026-10-01 12:34:47 UTC**
- Imported Webxdc size: **102,871 bytes**
- Imported Webxdc SHA-256: `1c23f8ab5b2e05e3c345fee6f9370a469c1f302197660aaa5ecfa34448c6e97f`
- Imported `index.html` size: **575,847 bytes**
- Imported `index.html` SHA-256: `361f18064f564f2ef7ebf1e8ac6e453c0601f9ce924478c5e0e66065b0816a8c`
- Imported datasets: **2,089 people**, **588 families**, **79 location clusters**, and
  **15 all-time migration arcs**

The embedded `LOCS`, `MIGS`, `PEOPLE`, and `FAMILIES` JSON literals are unchanged.
Their source-byte hashes and record counts are pinned in
`test/greeran-family-4dwm.test.ts` so a rebuild cannot silently alter genealogy data.

## What the fourth dimension means

The original all-time 2D-canvas globe remains available with the **4DWM / ALL TIME**
toggle. The added mode derives a temporal index without making network requests:

1. Years are parsed from dated birth and death records.
2. Coordinates explicitly attached to a person's birthplace seed an exact normalized
   place-to-coordinate index.
3. Other birth records inherit coordinates only when their normalized birthplace is
   an exact match. Death records are plotted only when the death place independently
   matches a place in that index; a birth coordinate is never relabeled as a death
   coordinate.
4. Parent-to-child arcs are dated to the child's birth year and rendered only inside
   the selected time window.
5. The slider, ±5/10/20/40-year window, play control, hover details, rotation, themes,
   zoom, touch input, and keyboard controls all work offline.

At build time this produces **567 dated geocoded records** (432 birth, 135 death),
**39 dated kinship links**, and a **1774–2023** playable range. These are derived
views; the underlying source arrays are not rewritten.

## Tree of Life and Bible eBook

The **🎄 Tree of Life · eBook** tab adds an original family preface, followed by an
inside-back-cover WEBU reader. The reader loads its data only when opened, directly
from the XDC's local files; it offers book/chapter navigation, text search, and a
short genealogy-reading trail (Genesis 5 and 10, Ruth 4, 1 Chronicles 1, Matthew 1,
and Luke 3). Scripture is a reading resource, not proof of a Greeran relationship.

- Translation: **World English Bible Updated (WEBU)**, sourced from eBible.org.
- Dataset: `ringletech/webu-open-bible`, commit
  `44ce9156b77649adf11c0bbcee89c1d80e2c1f1c`; 66 books, 1,189 chapters, 31,098
  verses.
- License: CC0 1.0 / public domain. The upstream license and metadata are bundled
  unchanged with the data in `public/apps/greeran-family-bible/`.
- The app can download a GEDCOM 5.5.1 snapshot built only from the 2,089 people and
  588 families already embedded in this XDC. No standalone source GEDCOM was found
  in the repository or Drive, so this is clearly labeled as a derived snapshot,
  not an update to an original file. It retains embedded notes, puts dates it cannot
  normalize into notes, and omits map coordinates rather than asserting they are
  person-level evidence. No new relationships or source citations are invented.

## Kirkpatrick archive and QR-code check

The app offers `samples/archive/kirkpatrick/FNA102B.ZIP` byte-for-byte as the
original First Name Almanac 1.02B shareware archive (SHA-256
`341271dbce5aa7ed864fd9fd2d9fd41c1c17f2ccaf524178ac945ad1e9d94caf`). The file is
not an ARJ archive; its ZIP contains internally protected commercial overlays.
The package does not extract, decrypt, or use the name meanings as genealogical
evidence. Its included shareware notices remain intact; redistribution is limited
to the terms stated in those notices.

The original Greeran XDC was ZIP-inspected (only `icon.png`, `index.html`, and
`manifest.toml` were present); its HTML was searched, and the emblem icon was
checked visually and with a local ZXing QR decoder (no code detected). No second
source image/artifact or destination was supplied, so no codes were guessed or
inserted. If “two hidden QR codes” meant two new codes, their payloads and intended
hiding location are still needed.

## Build and verification

```bash
npm run build:greeran-family
npx vitest run test/greeran-family-4dwm.test.ts
unzip -t greeran-family-4dwm.xdc
```

The reproducible XDC includes the app `index.html`, `manifest.toml`, `icon.png`,
the local WEBU data/metadata/license/README, and the untouched FNA ZIP. It requires
no network for its reader, styles, scripts, maps, or genealogy data; its source
links are optional references only.
