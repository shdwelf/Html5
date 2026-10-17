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

## KGK.ARJ inspection (17 October 2026)

A standalone `KGK.ARJ` was supplied with the one-word instruction "ungarble". It was walked with
`tools/arjwalk.py` (structure only). Verified facts:

- 536,909 bytes, ARJ revision 4 (archiver version 4, host OS 0), archive name `KGK.ARJ`. The
  main-header comment reads `ARJ archive created by Kenneth G. Kirkpatrick R#2112`.
- 19 local headers, all under `ALMANAC/`: `NAMES.EXE`, `DOCS.NAM`, `NAME001.NAM` through
  `NAME012.NAM`, `REGISTER.NAM`, `SYSOP.NAM`, `VENDOR.NAM`, `OMBUDSMN.ASP`, `FILE_ID.DIZ`.
- Every member carries flags `0x11` (GARBLED | PATHSYM) and method 1 (max). Compressed total
  535,650 bytes; uncompressed total 2,051,593 bytes.
- All 20 header CRC-32s verify. The gap between consecutive headers equals header size +
  compressed size + a 2-byte extended-header-size field for all 18 measured transitions, and the
  file ends with the `60 EA 00 00` end-of-archive marker, so the archive is complete rather than
  truncated or byte-mangled by the upload.

**No member was decrypted, and no password was attempted.** "Ungarbling" means defeating the
password transform the author applied to the payload. The unprotected `SYSOP.DOC` inside the
bundled `samples/archive/kirkpatrick/FNA102B.ZIP` identifies that payload's product: FIRST NAME
ALMANAC v1.02, released December 1993, ASP member author Kenneth G. Kirkpatrick, $49.95
registration. Its distribution policy grants permission to redistribute "in its ORIGINAL FORM"
with all copyright notices and files in place. A decoded payload is not the original form, so the
line recorded by the 2026-09-29 research and by the `arjwalk.py` header stands: structure only,
stop at the ciphertext boundary.

`KGK.ARJ` is also not the same container as `FNA102B.ZIP`. That ZIP holds `INSTALL.COM`,
`MEANINGS.OVL`, `NAMES.OVL`, `FILE_ID.DIZ`, and `SYSOP.DOC`, with the `.OVL` pair forming the
split ARJ. `KGK.ARJ` carries a larger member set (`NAMES.EXE` at 269,124 bytes plus twelve
`NAME0xx.NAM` files), so the ZIP is not a route around the garble either.

### Reference implementation check (17 October 2026)

The upstream ARJ source (`joncampbell123/arj`, commit `6af9746`, GPL-2.0 per `doc/COPYING`) was
cloned to a scratch directory outside the repository and built for Linux. `decode.c` is its
method-1–4 decompressor; `garble.c` holds the password transform. The build reports `ARJ32 v 3.10`:

```sh
git clone --depth 1 https://github.com/joncampbell123/arj.git arj-src
cd arj-src/gnu && ./configure && cd .. && make -f GNUmakefile   # serial: -j races on msg_arj.h
./linux-gnu/en/rs/arj/arj                                       # ARJ32 v 3.10
```

Two results settle what this resource does and does not change:

- **The pipeline works when the key is known.** A self-made archive garbled with
  `arj a -g<key> -m1 t.arj a.txt` extracts byte-identical under the same key (`diff` clean); a
  wrong key gives `Bad file data or bad password` plus a CRC error. The switch is `-g<password>`,
  not `-p<password>`.
- **The reference tool enforces the same boundary.** `arj t` on `KGK.ARJ` reports
  `File is password encrypted, Skipped` for all 19 members; `arj l` reads headers only.

A decoder was therefore never the missing piece: `decode.c` decompresses, `garble.c` needs the
key, and the key is the one input that has not been supplied. `arj l` also confirms the archive's
real timestamps — created 1993-12-15 11:55:12, members stamped 93-12-15 13:02:00 — which match the
December 1993 release date in `SYSOP.DOC`. (Hand-decoding the DOS date field out of the local
header earlier produced a nonsense year; the archiver's own reading is the one to trust.)

Once a password or written authorization is supplied, extraction is one CRC-checked command and
nothing further needs to be written:

```sh
arj x -g<password> -y /path/to/KGK.ARJ.xml out/
```

Authorization to fold the name database into the family-tree app remains a separate question from
the password: the same document that protects the data limits redistribution.

### Garble format research (17 October 2026)

The format itself was researched and written up in
[`arj-garble-format-notes.md`](arj-garble-format-notes.md). Summary: this archive is format
revision 4 (ARJ 2.30 layout) stamped 1993-12-15, which places it on the original **XOR garbling**
path — GOST 28147-89 only arrives with ARJCRYPT at v2.60/2.62. The per-file `modifier` that
`garble_init(char modifier)` consumes is a **plaintext byte at local-header offset 11**, verified
here against five members, so it is a public salt and adds no secrecy.

That note also withdraws two claims made earlier in this investigation — that the varying
per-member modifiers, or the absence of an embedded key in `INSTALL.COM`, were obstacles to
cryptanalysis. Neither is: the modifier is in the clear, and the constant in this scheme lives in
the header rather than the archiver binary. The decision not to attack the archive never rested on
technical difficulty, and the reason recorded above is unchanged.

## Name-resource follow-up (16 October 2026)

The six supplied name resources were reviewed for meanings, matching data, provenance, and reuse terms. Profiles with a usable first name now offer optional NameAlmanac and Wiktionary links, and six entries have concise, attributed Wiktionary-derived etymology notes in the app. Lookups are user-initiated; the app makes no background request. No meanings or statistics were added to the GEDCOM, and person records remain unchanged. See [`greeran-name-resources.md`](greeran-name-resources.md) for the source-by-source findings, license notes, and guardrails.
