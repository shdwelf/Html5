# From the Bulletin montage to an indexed showcase

Updated **14 September 2026**.

## What changed

The app now starts with **1,404 distinct public image-file records**, rather than seven selected records followed by a required live import. All 26 surname-category queries were completed; X returned no files. The seven researched records are retained with their local photographs, transcribed identifiers, and research notes. All other badge identifiers remain untranscribed.

The default display is a dense, clickable **montage/contact sheet**. Card and list views remain available. Search, A–Z filters, saved records, the researched subset, and CSV export use the complete bundled index. Choose 100, 250, or **All files** per page. Non-bundled photographs load lazily from Wikimedia; the names and source links do not require the Commons API to be available.

## Three different collections—not interchangeable counts

1. **The Bulletin image:** the user-supplied article displays a cropped montage. A reduced 700 × 810 reference image was retrieved and inspected, and is included with attribution and an enlargement control. It contains many small portraits, clipped at the boundaries, not a legible name list. No automated facial identification or badge OCR was performed. [1](https://thebulletin.org/multimedia/the-faces-that-made-the-bomb/)
2. **Wellerstein’s 2012 project:** the article describes a composite made from **1,229** digitized LANL badge photographs, arranged alphabetically, with names derived from source filenames. It also notes duplicates and source errors. This is a related full-collection research lead, not proof that every cell of the Bulletin crop has been mapped to a person. [2](https://blog.nuclearsecrecy.com/2012/08/31/the-faces-of-project-y/)
3. **The bundled Commons snapshot:** **1,404 image files** returned by the A–Z category queries on 14 September 2026. It includes older scans, later higher-resolution uploads, cropped variants, and alternate photographs. It is **not 1,404 unique people**, not the precise 1,229-image montage roster, and not every badge ever issued. [3](https://commons.wikimedia.org/wiki/Category:Los_Alamos_identity_badges)

The interactive contact sheet is constructed independently from the Commons file index; it is not a crop-and-name reconstruction of the Bulletin image. No claim is made that its order or cells match that image.

## Snapshot provenance

Each letter was queried using the public MediaWiki API:

```text
https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Los_Alamos_identity_badges:_{LETTER}&cmlimit=500&cmprop=title&format=json
```

The A query returned the same title fields with additional page IDs. Those page IDs are not needed by the app. Each completed response contained no continuation token. The larger M and S text results were read through their final extraction chunks. The failed N request was retried successfully.

| Category | Files | Category | Files |
| --- | ---: | --- | ---: |
| A | 59 | N | 43 |
| B | 134 | O | 29 |
| C | 94 | P | 49 |
| D | 57 | Q | 6 |
| E | 14 | R | 76 |
| F | 67 | S | 139 |
| G | 64 | T | 47 |
| H | 113 | U | 6 |
| I | 5 | V | 26 |
| J | 25 | W | 78 |
| K | 56 | X | 0 |
| L | 72 | Y | 5 |
| M | 136 | Z | 4 |

- `data/project-y/commons-index.txt` preserves the returned source filenames in a compact, reviewable representation. `[A]` begins a category. Normal lines have the exact common suffix ` Los Alamos ID.png` restored; lines starting with `!` retain an entire filename verbatim. Source misspellings are intentionally not silently corrected.
- `data/project-y/catalog.js` is generated from that file. Each entry contains category, exact filename, and the MD5 hash used by Wikimedia’s file-path layout. MD5 here locates files; it is **not** an authenticity check of photograph contents.
- `data/project-y/manifest.json` records retrieval date, query template, per-category totals, overall count, and scope.

Example queries: [A](https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Los_Alamos_identity_badges:_A&cmlimit=500&cmprop=title&format=json), [F](https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Los_Alamos_identity_badges:_F&cmlimit=500&cmprop=title&format=json), [Z](https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Los_Alamos_identity_badges:_Z&cmlimit=500&cmprop=title&format=json).

## Labels, ordering, and verification

- The name shown for an unreviewed record is a **source-derived label**, not an independently established identity. Archive suffixes are stripped and the recognizable surname-first hyphen form is reordered for display. Ambiguous or erroneous filenames may yield awkward labels.
- Every detail panel includes the exact original filename and a link to the file-description page. Researchers can inspect the original rather than relying on the display label.
- A–Z filtering follows the **source category**, including its inconsistencies. Display ordering groups by category, then inferred surname, label, and filename. This is not an arrival or badge-issue sequence.
- No portraits are merged based on facial similarity. Distinct filenames remain distinct records. Exact filename matches preserve the seven researched records instead of overwriting them during snapshot merging or an online refresh.
- Historic badge numbers are displayed only when already manually transcribed in the seven researched records. Identifiers are not inferred from montage positions, alphabetical order, or another photograph of the same person.
- This update makes Mary Frankel, Eldred Nelson, Naomi Livesay, and many other previously absent source records discoverable. It does **not** claim to have completed their biographies or badge-number review.

## Images, rights, and offline behavior

The reduced Bulletin image is a credited reference at the user's request. Its compilation-specific reuse license has not been established, and the app does not label it public domain. See `assets/los-alamos/NOTICE-bulletin-montage.txt`. Individual Commons file rights remain attached to their respective source pages; the montage's status is not inferred from them.

The full archive’s image binaries are **not bundled**. Older 130 × 180 scans are requested from Wikimedia’s original-file paths; other formats use smaller thumbnail paths (including a rendered JPEG thumbnail for TIFF). The local filenames/hash metadata are bundled, so search, counts, filtering, and exports continue to work even when remote images fail. Failed photographs show an explicit unavailable state with their source-derived labels, not a substitute portrait.

The optional Commons button now **checks for updates**. Failure does not turn the existing bundled index into an allegedly partial import: the UI distinguishes an incomplete update from the available 1,404-file snapshot. Successful refreshes add new source files without replacing reviewed records. The snapshot is not a promise that live Commons categories will never change.

## Regeneration and tests

```sh
node scripts/build-project-y-catalog.mjs
node --test tests/los-alamos.test.mjs tests/project-y-catalog.test.mjs tests/project-y-sites.test.mjs
# With the preview running and optional browser packages installed:
node tests/project-y-catalog-browser.mjs
node tests/project-y-sites-browser.mjs
```

The catalog build is deterministic and checks the reviewed category counts and distinct filenames. Tests cover lossless expansion, image-path hashing, total counts, researched-record preservation, source-label search, A–Z filtering, all-files display, pagination, modal details, saving, CSV export across all pages, the local reference image and zoom control, mobile overflow, and failed-update preservation.

The dedicated catalog browser test deliberately blocks all external requests. It validates the bundled index and unavailable-image behavior, **not successful delivery of 1,404 remote photographs**. The Three.js/VRML browser regression also remains passing. No third-party gallery-cell identity mapping is claimed.
