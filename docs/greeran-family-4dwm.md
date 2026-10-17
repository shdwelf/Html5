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

## Keepsake, Bible resources, and research status

The **📖 Tree of Life** tab combines a family-history preface, an inside-back-cover
reading panel, an interactive offline WEBU reader, and two collapsed QR panels. The
embedded family relationships remain the app's source data; Bible material is a
reading resource, not proof of a Greeran relationship.

The inside-back-cover panel offers:

- A complete **World English Bible (WEB)** EPUB: 66 books and 31,103 verses. The
  public-domain text is unchanged; the EPUB adds only reading structure and
  navigation. `tools/build_world_english_bible_epub.py` documents how to recreate it
  from the cited English WEB JSON source.
- A downloadable **baseline GEDCOM 5.5.1** generated from the data already embedded
  in the HTML: 2,089 source people and 588 families, plus one blank individual stub
  to preserve an otherwise orphaned family reference. It is not an update to an
  unavailable original GEDCOM or the requested Kirkpatrick first-name merge. Dates
  that cannot be normalized are kept in notes; map coordinates are not promoted to
  person-level evidence. No relationships or citations are invented by the exporter.
- Two generated QR panels, hidden until opened, that link to the explicitly named
  GitHub pages for the family-tree package and WEB EPUB. The imported source app and
  its checked emblem icon contained no identifiable QR payloads; these current,
  visible-purpose links are new and are not presented as recovered hidden codes.

The local **World English Bible Updated (WEBU)** reader loads its dataset only when
the tab is opened. It supports book/chapter navigation, text search, and a short
reading trail (Genesis 5 and 10, Ruth 4, 1 Chronicles 1, Matthew 1, and Luke 3).
Its data are bundled at `public/apps/greeran-family-bible/`:

- Source: eBible.org; dataset `ringletech/webu-open-bible`, commit
  `44ce9156b77649adf11c0bbcee89c1d80e2c1f1c`.
- Contents: 66 books, 1,189 chapters, 31,098 verses.
- License: CC0 1.0 / public domain. Upstream metadata, license, and README are
  included unchanged with the dataset.

The app also retains the untouched `samples/archive/kirkpatrick/FNA102B.ZIP`
shareware archive (SHA-256
`341271dbce5aa7ed864fd9fd2d9fd41c1c17f2ccaf524178ac945ad1e9d94caf`) with its
notices. It is a ZIP, not the split ARJ archive; the internally protected commercial
name-meaning overlays are not extracted, decrypted, or used as genealogical
evidence. Redistribution remains subject to the archive's own terms, and the file
must remain in its original form. No Kirkpatrick first-name data were added to the
tree. See `docs/greeran-family-tree-ebook-and-data-status.md` for provenance and
rebuild notes.

## Name research and Wiktionary notes

Profiles with a usable first-name token offer optional NameAlmanac and English Wiktionary links. They open only when selected, carry only the first name, and do not trigger a background lookup. Profiles for six names also show concise paraphrased Wiktionary etymology notes: Mary, John, William, Bernard, Hugh, and Catherine. The notes describe name forms—not an individual's identity or heritage—and preserve uncertainty in disputed or tentative etymologies. NameAlmanac statistics are not copied, and neither meanings nor external name data have been added to the baseline GEDCOM. The notes are adapted under CC BY-SA 4.0; the app links to the bundled attribution notice at `assets/greeran/WIKTIONARY-NAME-NOTES-LICENSE.md`. See the [name-resource review](greeran-name-resources.md) for source and license details.

## Build and verification

```bash
node scripts/build-greeran-family-qr.mjs --write
npm run build:greeran-family
npm run check:greeran-gedcom
npx vitest run test/greeran-family-4dwm.test.ts
unzip -t greeran-family-4dwm.xdc
```

The deterministic XDC includes the HTML, manifest, icon, generated GEDCOM, WEB
EPUB, WEBU JSON/metadata/license/README, and unchanged FNA ZIP. It needs no external
scripts, styles, fonts, maps, or genealogy data; online source links are optional
references only.
