# CyberChef SFX coverage verification — updated 2026-10-15

## Current Html5 result

The current `public/apps/cyberchef/index.html` registers **485 unique operations**. Running the page's real `applyRecipePacks(Object.keys(RECIPE_PACKS))` path produces a 485-operation recipe:

| Measurement | Result |
| --- | ---: |
| Operation registry | 485 unique IDs |
| Recipe packs | 218 |
| Pack entries | 626 |
| Unique IDs in pack union | 485 |
| Select-all recipes installed | 485 |
| Dangling pack IDs | 0 |
| Registered operations omitted from every pack | 0 |

Reproduce with:

```sh
node scripts/audit-cyberchef-sfx-coverage.mjs
```

This checks the **installer's coverage**: that every operation is represented in the serialized pack list and is loaded into the SFX recipe. It does not execute all 485 operations as one long transformation chain.

## Aztec and CueCat additions

- `aztecCode` generates an ISO/IEC 24778 Aztec Code SVG locally with the pinned `bwip-js@4.7.0` browser bundle.
- `aztecDecode` decodes one Aztec symbol from a loaded image file, Base64 image, or image data URL with the bundled ZXing JavaScript `0.21.3` reader. It runs locally and does not fetch image data.
- `averyLabels` offers Aztec Code for Avery 5160, 5161, 5163, 5392, and custom layouts, with its own error-correction percentage argument. The decoder expects one clear symbol; crop multi-label sheets before scanning.
- `cuecatDecode` decodes the RadioShack CueCat's modified-Base64 keyboard-wedge scans. CueCat is a separate legacy input format, not an Aztec decoder or Aztec-capable scanner.
- The XDC packages both libraries and their MIT licenses. The standalone SFX serializer inlines both libraries so its one-file download remains offline-capable.
- Browser and Node tests verify Aztec generation, image decode, Avery 5392 layout, CueCat published vectors, complete pack coverage, and package contents.

The browser-side test is optional and requires `puppeteer-core` plus `@sparticuz/chromium`:

```sh
node tests/cyberchef-aztec-browser.mjs
```

## Test coverage

```sh
node --test \
  tests/cyberchef-barcode.test.mjs \
  tests/cyberchef-sfx.test.mjs \
  tests/webxdc-packages.test.mjs
```

The SFX test serializes all pack names, boots the standalone offline page, and checks the loaded unique IDs against the operation registry. The page remains offline; the barcode renderer is bundled locally and no recipe content is fetched at runtime.

## Historical snapshot — 2026-10-13

The previous audit recorded **482 operations**, 214 recipe packs, 621 pack entries, 482 IDs in the pack union, and full 482/482 coverage. Its local fixes included the `gcwPostal` registration, symbolic-logic parenthesis tokens, and RM4SCC/PostNL KIX decode normalization. That snapshot predates the Aztec and CueCat additions above.

The reported 117-of-478 result did not occur in that checkout's Html5 SFX build. This is a repository-local finding; it does not claim a successful write to `Html5-sync-incoming`.

## Count history

- `docs/cyberchef-recipe-sync-2026-10-07.json` records the original **478-operation** merge baseline.
- The QR Code and Avery label operations brought the kitchen to **480**.
- `complexityLab` and `symbolicLogic` brought it to **482**.
- `aztecCode` and `cuecatDecode` brought this checkout to **484**; the new `aztecDecode` image operation raises it to **485**.
