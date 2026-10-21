# Omniglot recipes — deep dive (21 Oct 2026)

*Request: “… and omniglot recipes deep dive”. In this repository “Omniglot”
means [omniglot.com](https://www.omniglot.com) — the writing-systems
encyclopedia — as the **provenance source for GCWizard-area cipher recipes**
in the CyberChef registry (`public/apps/cyberchef/index.html`, category
`GCWizard`, catalog at `GCW_TABLE_CATALOG`). Companion to
[`polyglot-files-deep-dive-2026-10-21.md`](polyglot-files-deep-dive-2026-10-21.md).*

## 1. Inventory — where Omniglot is cited in the registry

| Recipe | Registry state | Source chain | Implementability |
| --- | --- | --- | --- |
| **A-tom-tom** (`gcwTomTinesWin`, table=tomtom) | ✅ **done** — full 26-letter `/`·`\` map + encode/decode | official map from GCWizard `lib/tools/crypto_and_encodings/tomtom/logic/tomtom.dart`, itself Omniglot/Hayden-sourced | verified; `ATOMTOM` + `atomEnc`/`atomDec` |
| **HVD** (`gcwCovHvd`, table=hvd) | named tokens only (`HVD-A`…`HVD-Z`, 24 letters, J K Q X unused) | Robbie J N, [omniglot.com/conscripts/hvd.php](https://www.omniglot.com/conscripts/hvd.php) | **glyph-gated**: the 1:1 map is an *image* on Omniglot (plus an HVD font by Aiden Neuding) — no text map exists to embed; tokens are the honest stop |
| **Puzzle Code** (`gcwPuzzCode`) | named tokens; jigsaw-piece glyph set | Josh Ragsdell 2006 / Omniglot | edge bitmaps not embedded — tokens only |
| **Codescript / Tines / Window** (`gcwTomTinesWin`, other tables) | named tokens (`CODE-A`, `TINE-A`, `WIN-A`) | GCWizard leftover image tables | **no published 1:1 Latin map** found — stay tokens |
| **Red Herring / Snooker / Billiards** (`gcwRedHerring` area) | value tables done where published (Snooker 1–7, WPA solids+stripes verified) | Omniglot + rulebooks | done where sources exist |

The catalog (`GCW_TABLE_CATALOG`) tracks these as “TomTom slash · Codescript ·
Tines · Window · Puzzle code · Red Herring …” among ~330 table entries.

## 2. Method lesson (what “done” means per table)

The registry's own notes encode the standard, and this deep dive ratifies it:

1. **Verified** — a published 1:1 Latin map from a primary implementation or
   the original designer (A-tom-tom via the GCWizard Dart logic: A→`/`,
   N→`\///`, Z→`/\//`, spaced letter groups).
2. **Named tokens** — the table is real but the glyph set is image/font data;
   the recipe emits stable `X-Y` tokens instead of fake glyphs (HVD, Codescript,
   Tines, Window, Puzzle Code).
3. **Reference** — documented provenance only.

Never fabricate a 1:1 map. Where the map is an image (HVD) the next rung is
asset work: obtain the published font/image (Aiden Neuding's HVD font,
credited on the Omniglot page) under terms that allow embedding, then render
stroke-bitmap tiles like `vendor/font8x8_basic.h` was vendored for the GB ROM.

## 3. Omniglot provenance discipline

- Cite the exact page (`/conscripts/hvd.php` — note `.php`, the `.htm` path
  404s) and the designer credit (Robbie J N; contact on page) — mirrors the
  dCode/geocachen.be credits in the Covenant recipe.
- Omniglot pages are editorial compilations: cross-check against the original
  designer or a primary implementation when one exists (the A-tom-tom lesson —
  GCWizard's Dart source beat the page).
- Times/shift variants of scripts are out of scope unless a puzzle corpus needs
  them (the registry's `GCW_TABLE_CATALOG` breadth is the coverage plan).

## 4. Recipe-pack status

Existing pack `GCWizard Covenant / HVD` = `[['gcwCovHvd',{}],['gcwIllumKartrak',{}]]`.
Suggested follow-ups (not added this round — pack-count machinery unchanged):
a “TomTom slash round-trip” spotlight (`gcwTomTinesWin` encode→decode) once
spotlight batches resume, and an HVD glyph pack **when** bitmap tiles exist.

## 5. Open items

1. HVD font acquisition + bitmap tiles (glyph-gated, see §2).
2. Puzzle Code jigsaw edge-bitmap tiles (same path).
3. Re-audit Codescript/Tines/Window for any published map (last checked 2026-10-21: none).
