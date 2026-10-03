# Source check — Vincennes 4DWM reconstruction — 2026-09-29

> **Bibliographic index:** [Source-check bibliography](source-check-bibliography.md) — normalized references, source-status notes, and coverage audit.

Companion audit for `docs/vincennes-4dwm-deep-dive.md`, `js/vincennes-logs-data.js`,
`js/vincennes-dem.js`, `js/vincennes-djvu.js` and `data/vincennes/`.

## Method

Every numeric claim in `js/vincennes-logs-data.js` carries a `src` key resolving to a
record in the same file's `SOURCES` registry; `tests/19-vincennes.mjs` asserts that no key
is unresolved and that every source of kind `primary*` or `secondary` has a URL.

For the 1988 theater, claims were checked against **primary documents from opposed
parties** wherever possible: the Fogarty investigation (US Navy) and Iran's Memorial to the
ICJ quoting the ICAO report. Where both give a value for the same quantity, both are
recorded and the residual is computed rather than one being preferred. Positions taken from
a secondary reproduction of a primary figure (the Yale JIL article reproducing ICAO Figure 1)
are labelled `secondary` and say so.

For 1942 and 1944 the primary record is scanned and not machine-readable at source, so the
Graybook page references are recorded as `primary-scan` with the archive's stable URL and
the page number, and the values are labelled by what they are: a described geometry (Savo)
or single plotted positions (Leyte).

Two categories were held to a higher bar than "a source says so":

- **Derived quantities.** Anything the model computes rather than quotes is marked
  `derived: true` and computed only in `js/vincennes-logmath.js`. The A-59 centreline and
  the post-intercept positions are the main cases.
- **Assumptions made in order to draw a picture.** Marked `assumed: true` with a written
  explanation surfaced in the viewer. The stationary-ownship hold in 1988 is the main case.

Network access from the build sandbox is limited to the research tools; `curl`/`wget` have
no egress. That constraint is load-bearing for two decisions recorded below.

## Checked claims

### 1988 · Strait of Hormuz

| Claim | Evidence | Result |
|---|---|---|
| Vincennes launch position 26°30′47″N 56°00′57″E | [Yale J. Int'l L. 16:2](https://openyls.law.yale.edu/server/api/core/bitstreams/6def3043-a413-4592-a489-255762a9fbf8/content) reproducing ICAO Fig. 1; [Wikipedia](https://en.wikipedia.org/wiki/Iran_Air_Flight_655) | Confirmed; inside Iran's 12 NM limit, admitted by Adm. Crowe (1992) |
| First SPY-1A detection 0647Z, brg 025 / 47 NM / 900 ft | [DoD Fogarty release scan](https://time.com/wp-content/uploads/2014/03/dodvincennes.pdf); [Internal Report](https://en.wikisource.org/wiki/Formal_Investigation_into_the_Circumstances_Surrounding_the_Downing_of_Iran_Air_Flight_655_on_3_July_1988/Internal_Report) | Confirmed in both |
| USS Sides detection 0648Z, brg ~355 / 32 NM / 1,500 ft | Fogarty formal report | Confirmed |
| IR 655 at launch: 26°40′06″N 56°02′41″E | ICAO Fig. 1 via Yale JIL and Iran's [ICJ Memorial](https://www.icj-cij.org/public/files/case-related/79/6629.pdf) | Confirmed; **independently reproduced** by the model from the tape's BRG 010 / 10 NM to 0.56 NM |
| Impact 26-37.75N 056-01E, 6.5 mi east of Hengam | Fogarty formal report | Confirmed |
| Impact 26°38′22″N 56°01′24″E, 13,500 ft, 383 kt, 0654:43 | ICJ Memorial | Confirmed; differs from the US figure by ~0.6 NM — **both retained, not averaged** |
| Firing key 0654:05; FIRING AUTHORIZE 0654:19; launch 0654:22; intercept 0654:43 | Fogarty internal report (IO Exhibit 91) | Confirmed |
| "Only seven minutes and five seconds elapsed" | Fogarty formal report | Confirmed; **recomputed** as 425 s from the event times |
| Mode III-6760 held by the system; IDS reported Mode II-1100 | Fogarty internal report | Confirmed |
| Track number recycling 4474 → 4131; 4474 reassigned to a distant descending aircraft | [Carlson, USNI Proceedings 8/1993](https://www.usni.org/magazines/proceedings/1993/august/vincennes-case-study); [NPS-AS-93-008](https://apps.dtic.mil/sti/tr/pdf/ADA259045.pdf) | Confirmed |
| Airway A-59 is 20 NM wide, 10 NM each side of centreline | ICJ Memorial / ICAO | Confirmed |
| Flight stayed within 4 mi of the A-59 centreline | Yale JIL; ICJ Memorial | Confirmed |
| Impact was 3.37 mi **west** of the A-59 centreline | Fogarty | Confirmed as a quoted offset; the centreline itself is **derived from it** and labelled so |
| CIC called the contact descending "between 25 and 20 miles" | Fogarty internal report | Confirmed |
| Individual CIC altitude recollections (TIC 11,000@15; AIC-3 9,000@20; and six descent calls) | Fogarty internal report, Table 1 and the 0650–0655 findings | Confirmed; the two that **match** the tape are flagged `agrees: true` |
| Bandar Abbas OIKB rwy 21L threshold 27.232453N 56.387556E, true hdg 207 | Aerodrome data | Confirmed; used **only** as an independent target for the first-detection check |
| SM-2MR Block II mean speed ~1,371 kt over the intercept | — computed | **Derived** sanity check on the timebase, not a sourced claim |
| CPA ≈ 3.6 NM / TCPA ≈ 87 s; bearing drift 24° (not CBDR) | — computed from sourced bearings/ranges | **Derived**; consistent with Carlson's contemporaneous non-threat evaluation |
| Altitude regressions (−304 ft/NM R²=0.987; +99 ft/NM R²=0.27; cross at 21.7 NM) | — computed from the sourced samples | **Derived**; see boundary note below |

### 1942 · Savo Island

| Claim | Evidence | Result |
|---|---|---|
| Northern force patrolled a 5-mile square, 10 kt, 90° every half hour, onto 045° at midnight | [NHHC Combat Narratives, *The Battles of Savo Island*](https://www.history.navy.mil/content/dam/nhhc/browse-by-topic/War%20and%20Conflict/WWII-Pacific-Battles/Savo%20Web.pdf) | Confirmed |
| 5 NM at 10 kt = 1,800 s, so the two clauses are the same fact | — arithmetic | **Derived**; this is why the DR has no free parameters |
| Vincennes sank 0250, 9 Aug 1942, 09°10′S 159°52′E, ~2½ mi east of Savo | NHHC | Confirmed |
| Casualties 332 (some sources 322) | NHHC | Confirmed; **the discrepancy is retained**, not resolved |
| Riefkohl went below ~0050; XO Cdr Mullan had the ship | NHHC | Confirmed |
| Wreck found 16 Jan 2015 by Paul Allen's *Octopus*, ~1,020 m | Expedition reporting | Confirmed; an alternate coordinate (09°07′17″S 159°52′48″E) exists and is noted |
| Patrol start corner 09°07.0′S 159°53.6′E; 0150 DR 09°08.2′S 159°54.8′E | — computed | **Derived**; residual to the sinking position 3.3 NM |
| Quincy/Astoria drawn 180 s astern (≈600 yd at 10 kt) | column practice, not a logged interval | **Assumed**, flagged in the track note |

### 1944 · Formosa / Leyte

| Claim | Evidence | Result |
|---|---|---|
| Canberra torpedoed 14 Oct 0700I east of Formosa, in tow at 4.5 kt | [Nimitz Graybook v5 p.270](https://www.usnwcarchives.org/repositories/2/digital_objects/22) | Confirmed |
| Houston hit 14 Oct 1800I, in tow at 3 kt; hit again 16 Oct 1422I | Graybook v5 pp.270, 272 | Confirmed |
| Besugo enemy-cruiser contact off Bungo Suido, 14 Oct 2300 **GCT** | Graybook v5 p.271 | Confirmed; converted to +9 h so the plot runs on one clock, and the conversion is stated |
| TG 34.5 formed 0240I 25 Oct: Iowa, New Jersey, Biloxi, Vincennes, Miami, 8 DD; dissolved 0700I 27 Oct | [CominCh *Battle Experience: Leyte*](https://www.ibiblio.org/hyperwar/USN/rep/Leyte/BatExp/Leyte-BE-78.1.html) | Confirmed |
| Nowaki sunk ~0035 26 Oct by cruiser gunfire and Owen's torpedoes; ~1,400 lost incl. Chikuma survivors | [NHHC H-038-2](https://www.history.navy.mil/about-us/leadership/director/directors-corner/h-gram-038/h-038-2.html) | Confirmed |
| Canberra at 17°00′N 130°00′E labelled "15 Oct 0600I" | Legacy array in `apps/vincennes-command-viewer.html`, attributed to Graybook v5 p.270 | **Internally inconsistent — retained as a declared contradiction.** See below |

### Elevation data

| Claim | Evidence | Result |
|---|---|---|
| Outside the US, USGS distributes SRTM 1″, GMTED2010 and ASTER GDEM v3 via EarthExplorer / AppEEARS | [USGS FAQ](https://www.usgs.gov/faqs/where-can-i-get-global-elevation-data) | Confirmed |
| 3DEP has no coverage over any of these three theaters | USGS 3DEP product scope (US, territories) | Confirmed; recorded in `DEM_META.products` as `unusable: true` |
| Qeshm Island max ~370 m (Bukhun); mean 35–45 m | UNESCO tentative-list documentation | Confirmed (a second figure of ~290 m circulates; the higher is used and the range noted) |
| Hengam Island max 106 m, 9 × 6 km | Island gazetteer data | Confirmed |
| Savo Island cone ~485 m, ~3.2 NM across | Gazetteer | Confirmed |
| Iron Bottom Sound wreck depths 600–1,350 m | 2015 Allen survey reporting | Confirmed |
| Bandar Abbas field elevation 22 ft | Aerodrome data | Confirmed |
| All other DEM values | — | **Labelled `generalised` in `DEM_CONTROL[].control[].src`.** Nine of the thirty control points are explicitly generalisations, not published spot heights |

### DjVu format

| Claim | Evidence | Result |
|---|---|---|
| File = `AT&T` magic + IFF85; chunks padded to even length; only the outer FORM nests | [sndjvu spec](https://www.sndjvu.org/spec.html); [Wikipedia](https://en.wikipedia.org/wiki/DjVu) | Confirmed |
| INFO is 10 bytes with a **little-endian** dpi field | sndjvu spec | Confirmed; pinned by a test |
| DIRM header layout (bit 7 = bundled, BE16 count, BE32 offsets), remainder BZZ | sndjvu spec | Confirmed |
| NAVM must immediately follow DIRM and is wholly BZZ | sndjvu spec | Confirmed |
| TXTa = BE24 length + UTF-8 + version byte | sndjvu spec | Confirmed |
| TXTa **zone-tree layout** | DjVu3 spec §2.4 says "to be documented"; only DjVuLibre `DjVuText.cpp` describes it | **Not specifiable.** Implemented as `ZONE_RECORD` with the caveat attached, validated by exact-length consumption, and refused rather than guessed on mismatch |
| BZZ = Burrows–Wheeler + ZP adaptive arithmetic coder | Spec and DjVuLibre | Confirmed; **deliberately not implemented** |
| IA emits `<id>_djvu.txt` and `<id>_djvu.xml` (ABBYY word boxes) | Internet Archive derivative pipeline | Confirmed; `_djvu.xml` reader implemented and tested |

## Boundaries retained

1. **The two impact coordinates are not reconciled.** The US report says 26-37.75N 056-01E;
   Iran's Memorial says 26°38′22″N 56°01′24″E. They differ by roughly 0.6 NM. Both are in
   the data with their own sources. Averaging them would manufacture a third position that
   no document supports.

2. **The Canberra contradiction is preserved by construction.** The check `tow-speed` is of
   kind `contradiction` and **passes while the sources still disagree**. Editing the
   coordinate to make the plot tidy breaks the test suite. The model states which of the
   two numbers it believes (the position) and which it does not (the date label), and
   labels the sample `disputed: true`.

3. **The Savo casualty figure is given as 332 with 322 noted.** Not resolved.

4. **The A-59 centreline is derived, never quoted**, from the stated 3.37-mile offset and a
   corridor axis of 211° (the aircraft's own recorded course at 0654Z). If a published
   centreline geodetic surfaces, it replaces this.

5. **Ownship is held stationary in 1988 and this is declared.** Vincennes was manoeuvring in
   a gun action; no minute-by-minute ownship track is published. Every range and bearing in
   the model is therefore measured from the ICAO launch fix, and the holds are
   `assumed: true`.

6. **The altitude regressions describe the data, not a person.** R² = 0.27 on eight numbers
   recalled under fire is a statement about a small, bimodal set of recollections. The
   deep-dive explicitly declines three stronger readings the numbers do not support: it is
   not a mirror image (ratio −0.33, not −1), the room was not uniformly wrong (two
   recollections match the tape), and no cause is attributed.

7. **Nine of thirty DEM control points are generalisations** and say so in their own `src`
   string. The layer is labelled a control-point reconstruction in the module metadata, the
   layer tooltip, the inspector, `dem.json` and the data README.

8. **The DjVu zone-tree decoder does not claim spec conformance.** It claims to match
   DjVuLibre's implementation and to detect its own failure.

## Decisions forced by the sandbox, recorded so they can be revisited

The build environment has no outbound HTTPS from the shell. Two consequences, both of which
changed the design rather than being worked around silently:

- **No real DEM tiles.** SRTM/GMTED clips could not be downloaded, so the elevation layer is
  a control-point reconstruction. `DEM_META.swapIn` records the exact `gdal_translate`
  invocation and the target JSON shape, and every consumer goes through `sampleDem()`, so
  substituting a real clip changes nothing downstream. Had the tiles been fetchable, this
  layer would be a clipped raster.
- **No real `.djvu`.** Neither Graybook volume could be pulled from the Internet Archive, so
  the plate layer ships four generated fixtures — genuine DjVu byte streams carrying
  transcribed page text with no image layer, each linking the real document and each
  labelled `generated: true` in `plates.json` and "GENERATED FIXTURES, NOT SCANS" in its
  manifest header. The drag-and-drop path reads real files through identical code.

## New records produced

Derived values that did not previously exist in any consulted source, all computed in
`js/vincennes-logmath.js` and all asserted in `tests/19-vincennes.mjs`:

| Value | Result |
|---|---|
| First-detection back-projection vs. Bandar Abbas 21L threshold | 0.63 NM |
| Tape polar vs. ICAO absolute fix at launch | 0.56 NM / 0.6° |
| Intercept-to-impact fall displacement | 1.03 NM on ~184° |
| Derived A-59 centreline point | ≈26°36.0′N 56°04.2′E |
| Tape altitude gradient | −304 ft/NM, R² 0.987 |
| Recalled altitude gradient | +99 ft/NM, R² 0.27 |
| Gradient crossing | 21.7 NM / 9,424 ft |
| Slope ratio | −0.33 |
| Post-intercept descent rate | ≈−11,100 ft/min |
| SM-2 mean speed over the intercept | ≈1,371 kt (≈Mach 2.1) |
| Decision window, detect → firing key | 425 s |
| Bearing drift over the engagement | 24° (therefore not CBDR) |
| CPA / TCPA at launch geometry | ≈3.6 NM / ≈87 s |
| Savo patrol leg duration | 1,800 s exactly |
| Savo solved start corner | 09°07.0′S 159°53.62′E |
| Savo DR at first illumination vs. sinking position | 3.32 NM |
| Canberra made-good speed between plotted positions | 21.7 kt vs. 4.5 stated (×4.8) |
