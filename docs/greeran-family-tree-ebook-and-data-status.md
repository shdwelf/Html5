# Greeran Family Tree: GEDCOM, keepsake pages, and Bible ebook

**Prepared:** 16 October 2026
**Related pull request:** [#117](https://github.com/shdwelf/Html5/pull/117)

## Work completed in the requested order

### 1. Family-name merge: blocked; no data was merged

A follow-up Drive search returned no raw GEDCOM by name. It found a separate `first_name_almanac_installer.exe` and an ARJ research report/backup, but those research materials contained no license or permission to use and redistribute the database. The installer was inspected statically only, never run: it identifies as a PE32/i386 GUI Setup Factory 9 installer; the scan found no ARJ SFX marker or CRC-valid embedded ARJ headers. The research backup contains a report and `arjwalk.py`, a structure-only header walker—not an ARJ payload, password, or decoded names. The report describes the legacy GARBLED transform but explicitly records no password attempt or extraction. Its per-member password modifier also means the pasted Gemini example's `0x27` is not a verified archive-wide value.

The local `samples/archive/kirkpatrick/FNA102B.ZIP` is a ZIP container, not a standalone ARJ. The Drive report explains that its `MEANINGS.OVL` and `NAMES.OVL` files together form a split ARJ archive with GARBLED members. No member was decrypted, extracted, or used, and no first-name meanings were added. The shareware notice limits redistribution to the original form.

### 2. Baseline GEDCOM and XDC repackaging

Because no source GEDCOM was available to update, `greeran-family-4dwm.ged` is explicitly a **baseline export**, generated from the `PEOPLE` and `FAMILIES` arrays already embedded in `greeran-family-4dwm.html`. It preserves the source's 2,089 people, 588 families, dates, places, occupations, notes, coordinates, and relationship links. One blank `INDI` stub is retained for an identifier referenced by a family but absent from the embedded people array; the stub has no name or other invented details.

The exporter is `tools/greeran-family-export.mjs`; it does not perform name enrichment. The packaged `greeran-family-4dwm.xdc` now includes the same GEDCOM snapshot and the Bible EPUB linked by the app. `test/greeran-family-4dwm.test.ts` verifies source-array hashes, GEDCOM record counts, ebook contents, and package entries.

### 3. Tree-of-Life preface

The family-tree app has a new **📖 Tree of Life** tab with a family preface, a decorative tree illustration, and direct buttons to the existing tree and 4DWM globe. The text treats the tree as a record to investigate and keeps uncertainty visible rather than adding unsupported family claims.

### 4. Bible ebook on the inside back cover

The inside-back-cover panel offers the complete **World English Bible (WEB)** as an offline, reflowable EPUB at `assets/greeran/world-english-bible.epub` (66 books; 31,103 verses). WEB was selected because eBible.org identifies its text as public domain. The text is unchanged; the EPUB adds only navigation, chapter/verse structure, and presentation markup. “World English Bible” is a trademark of eBible.org, so the package notes the trademark and the unmodified-text condition.

The ebook was built from the English `data/web` files in [`kuris/bible`](https://github.com/kuris/bible/tree/433550675f7a7680ebf7426902984d524d96b207/data/web), commit `433550675f7a7680ebf7426902984d524d96b207`, whose README identifies eBible.org's `engwebp` text as public domain. Only those English WEB files were used; the other translation in that repository was not included. The source dataset is not vendored in this repository. The generator is `tools/build_world_english_bible_epub.py` and accepts a local source directory.

- Official WEB listing: <https://ebible.org/pdf/eng-web/eng-web_all.pdf>
- Source JSON revision: <https://github.com/kuris/bible/tree/433550675f7a7680ebf7426902984d524d96b207/data/web>
- Source-data SHA-256: `d7d212e5bb12995af6ed1cf6a7564de605fd80d131fbc09c94117f20f539b083`
- EPUB SHA-256: `4b953798ce4e2c16d46c7590a4708563986e841fcd86d8fd62b928dec6603c24`

### 5. Two hidden QR codes

The inside back cover has two collapsed, keyboard-accessible `<details>` panels. Opening each reveals a high-contrast QR code and an ordinary direct link. One links to the family-tree XDC file page; the other links to the Bible EPUB file page on the repository's `main` branch. The QR data URIs are embedded in the single-file HTML, and `scripts/build-greeran-family-qr.mjs` verifies that each code matches its adjacent direct link.

## Rebuild commands

```sh
# When the public-domain source checkout is available locally:
python3 tools/build_world_english_bible_epub.py --source-dir /path/to/kuris-bible/data/web

# Refresh/verify the embedded QR images and rebuild the Webxdc + baseline GEDCOM:
node scripts/build-greeran-family-qr.mjs --write
npm run build:greeran-family
npm run check:greeran-gedcom
```

The original Kirkpatrick/ARJ enrichment remains pending until the actual source GEDCOM, the intended ARJ, and authorization to use its name data are supplied. The baseline export should not be described as that merge.

## Name-resource follow-up (16 October 2026)

The six supplied name resources were reviewed for meanings, matching data, provenance, and reuse terms. Profiles with a usable first name now offer optional NameAlmanac and Wiktionary links, and six entries have concise, attributed Wiktionary-derived etymology notes in the app. Lookups are user-initiated; the app makes no background request. No meanings or statistics were added to the GEDCOM, and person records remain unchanged. See [`greeran-name-resources.md`](greeran-name-resources.md) for the source-by-source findings, license notes, and guardrails.
