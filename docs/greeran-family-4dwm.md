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

## Build and verification

```bash
npm run build:greeran-family
npx vitest run test/greeran-family-4dwm.test.ts
unzip -t greeran-family-4dwm.xdc
```

The reproducible package contains exactly `index.html`, `manifest.toml`, and
`icon.png`. It is self-contained and does not load scripts, styles, fonts, maps, or
data from the network.
