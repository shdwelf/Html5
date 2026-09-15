# Project Y Badge Load Verification — 2026-09-15

This note documents the follow-up verification that **all 1,404 badges** in the bundled A–Z snapshot render correctly after fast-forwarding `arena/01a0a4c6-html5` to `origin/main` (`7cd4cdd`).

## Fast-forward
- Branch was at `2e0c416` (PR #38). Fast-forwarded to `7cd4cdd` (PR #42) to include:
  - PR #41: 1,404-file catalog (`data/project-y/catalog.js` + `commons-index.txt`, 26 categories, 7 curated)
  - PR #42: SITE-K 4Dwm PIP deck (`los-alamos.html` PIP per card)

## Source integrity
- `data/project-y/commons-index.txt` → `parseCatalogIndex` → 1,404 rows, counts `A:59 B:134 C:94 D:57 E:14 F:67 G:64 H:113 I:5 J:25 K:56 L:72 M:136 N:43 O:29 P:49 Q:6 R:76 S:139 T:47 U:6 V:26 W:78 X:0 Y:5 Z:4`
- `catalog.js` MD5 hashes for all titles: 0 mismatches
- `mergeCatalog(seedRecords=7, catalogEntries=1404)` → 1,404 distinct records (7 curated retained, not duplicated)

## Unit tests
```
node --test tests/los-alamos.test.mjs tests/project-y-catalog.test.mjs tests/project-y-sites.test.mjs
# tests 15, pass 15
```
- `full reviewed snapshot covers 26 categories and 1404 distinct`
- `every image path derives from its exact canonical filename`
- `all categories and lesser-known source labels are searchable immediately`

## Browser (headless Chromium, Commons blocked)
- Served via `tests/lib-browser.mjs:serve()` on ephemeral port
- `#total` → `1404`, montage 100 paginated, `all` → 1404 visible
- `curated` tab → 7, `Z` → 4, `X` → empty+reset, `A` → 59
- Search `Mary P. Frankel` → 1, dialog `BADGE NUMBER NOT TRANSCRIBED` + filename
- `load-all` with network blocked → `Update incomplete` but `#total` stays 1404
- CSV export → 1405 lines (header+1404), contains `Mary P. Frankel Los Alamos ID.png`
- No `pageerror`, `loadStatus` → `1,404 source files indexed locally · snapshot 2026-09-14`

## Result
All 1,404 badges are bundled and render from the offline index; remote thumbnails are on-demand with fallback. No code change beyond the fast-forward.
