# Vincennes logs, modelled: a layered 4DWM reconstruction

`vincennes-4dwm.html` · `js/vincennes-logmath.js` · `js/vincennes-logs-data.js` ·
`js/vincennes-dem.js` · `js/vincennes-djvu.js` · `tests/19-vincennes.mjs`

---

## 1. What changed, and why it matters

There was already a Vincennes page in this repository: `apps/vincennes-command-viewer.html`,
a canvas plot driven by two hand-typed arrays of positions. It drew the right shapes. But
a list of screen coordinates is not a model — you cannot ask it a question it was not
already told the answer to. You cannot ask it where the aircraft was at 06:52:40, because
nobody typed that minute in. You cannot ask it whether the radar log and the court filing
describe the same aeroplane, because both were flattened into the same array of dots and
the distinction was lost on the way in.

This replaces that with a computation. `js/vincennes-logs-data.js` holds only what a
document says, each entry carrying the document it came from. `js/vincennes-logmath.js`
holds the geodesy and derives everything else. The viewer holds no coordinates at all —
the test suite asserts that, by grepping the view layer for literal latitudes.

The payoff is that the model can now be *wrong in public*. Every derived quantity can be
checked against a number that arrived by a different route, and eight such checks are
declared in the data and run on every load.

---

## 2. Three ships, one name

| | CA-44 | CL-64 | CG-49 |
|---|---|---|---|
| Class | *New Orleans*-class heavy cruiser | *Cleveland*-class light cruiser | *Ticonderoga*-class Aegis cruiser |
| The night | Savo Island, 9 Aug 1942 | Formosa / Leyte, Oct 1944 | Strait of Hormuz, 3 Jul 1988 |
| What survives | a patrol *described*, not plotted | single positions on Graybook pages | a data-reduction tape, second by second |
| The modelling problem | integrate a geometry back into a track | reconcile two numbers that disagree | reconcile a recording with a memory |

The three sets are deliberately unalike. They are three different *kinds* of log, and each
one needs a different piece of mathematics to become a track. That is the reason to put
them in one viewer.

---

## 3. 1988 · a recording against a memory

### 3.1 The reconstruction

The AEGIS Mk 7 data-reduction tape (IO Exhibit 91, quoted throughout the Fogarty
investigation) records TN 4131 as a series of **bearings and slant ranges from own ship**.
Iran's Memorial to the ICJ, and the ICAO report it quotes, give **absolute geodetic fixes**.
Neither document derives from the other; they were produced by opposed parties for opposed
purposes.

So the model reconstructs the aircraft twice. `fixFromPolar(observer, bearing, range)`
projects the radar log from the launch position; the absolute fixes are plotted directly.
Where both exist, the gap between them is the residual, and the residual is the finding.

### 3.2 The check nobody had to state

The strongest validation in the whole dataset is an accident.

Take the very first line on the tape — **bearing 025°, range 47 NM, altitude 900 ft** — and
project it from the launch fix at 26°30′47″N 56°00′57″E. It lands **0.63 NM from the
threshold of runway 21L at Bandar Abbas**.

Nothing in that calculation used the runway. The bearing and range are from a US Navy
recording; the threshold coordinate is from an aerodrome chart. An Airbus at 900 feet on a
47-mile radar return ought to be a few hundred yards off the end of the runway it just left,
and it is. That is what licenses everything else the polar reconstruction produces.

At the other end of the engagement the same test gives **0.56 NM** and **0.6°**: the tape's
"BRG 010 / RNG 10 NM" at launch against ICAO's 26°40′06″N 56°02′41″E.

### 3.3 The 1.04-mile residual that is not an error

The intercept polar — bearing 001, 8 NM — puts the warheads at 26.6465 N, 56.0181 E. The
impact site in the Fogarty report is 26°37.75′N 56°01′E, **1.04 NM away on a bearing of
about 184°**.

That is not a disagreement between documents. It is a wide-body airliner falling 13,500
feet over roughly seventy seconds while still carrying 383 knots of forward momentum, and
the displacement is down-track. The check is written with a two-mile tolerance and the test
suite additionally asserts the *direction*: if the residual ever stops pointing down-track,
something in the model has broken.

### 3.4 The divergence, and what the numbers actually support

Here is the part the layered view exists for.

The tape's altitudes, regressed against slant range over the sixteen pre-intercept samples:

> **−304 feet per nautical mile closed, R² = 0.987**

Range is measured closing, so a negative slope is a climb. R² of 0.987 over 39 miles is not
a noisy signal; it is an airliner on a standard departure profile, doing exactly one thing.

The altitudes as recalled in the Combat Information Center, regressed the same way:

> **+99 feet per nautical mile, R² = 0.27**

Opposite sign, and a fit so poor it is barely a line at all. The two fitted gradients cross
at **21.7 NM, 9,424 ft** — inside the very band, "between 25 and 20 miles," where CIC first
called the contact descending.

Three things the model is careful *not* to say:

1. **It is not a mirror image.** The slope ratio is **−0.33**, not −1. The recalled profile
   is not the true one inverted; it is shallower as well as opposite. Whatever produced it
   was not a clean sign flip, and the write-up says so.
2. **The room was not uniformly wrong.** Two recollections match the tape almost exactly —
   the Tactical Information Coordinator's 11,000 ft at 15 NM, and AIC-3's 9,000 ft at 20 NM.
   Those are flagged `agrees: true` in the data and drawn in the *system* colour. The
   divergence is confined to the descent calls. A model that painted every console red
   would be telling a simpler and less accurate story.
3. **The R² of 0.27 is a fact about a set of recollections, not about a person.** Eight
   numbers remembered under fire after the event do not have to lie on a line.

### 3.5 CPA, and the thing that was never true

"Constant bearing, decreasing range" is the classic attack cue. `cbdr()` runs it over the
actual bearing series rather than accepting it:

> bearing 025 → 021 → 001 over about seven minutes: **24° of drift**. Not CBDR.

And the closest point of approach, computed from the launch geometry (10 NM, bearing 010,
target course 211): **about 3.6 NM, in about 87 seconds**. The aircraft was going to pass
the ship by three and a half miles. Captain Carlson of USS *Sides* reached the same
conclusion from the same geometry at 06:53:20 and turned his attention to a P-3.

### 3.6 Time compression

`timeCompression(events, "detect", "key")` returns **425 seconds** — Fogarty's "only seven
minutes and five seconds elapsed," recomputed from the event times rather than quoted. The
missile flight itself: 8 NM in 21 seconds, a mean of **1,371 kt**, about Mach 2.1 at sea
level, which is the right order for an SM-2MR Block II including boost. That last number is
a sanity check on the clock: a reconstruction that cannot produce a plausible weapon has a
bad timebase somewhere.

---

## 4. 1942 · a patrol with no free parameters

The northern screening force off Savo left almost no track. What survives is an *order*:

> a five-mile square, ten knots, changing course ninety degrees every half hour,
> turning onto 045° at midnight

Those two clauses are the same fact stated twice. Five nautical miles at ten knots is
**1,800 seconds** — exactly the half hour. Which means the geometry is closed: given the
box centre, the side, the speed, the leg order and the time of the first turn, the ship's
position at every instant of that night is determined. There is nothing left to assume.

`patrolStartCorner()` solves for the corner that makes the four legs close with the
centroid on the stated centre — half a diagonal, 3.54 NM, due west of it — and `deadReckon()`
integrates from there at one-minute steps. *Quincy* and *Astoria* are drawn on the same
track offset 180 seconds astern, which at ten knots is the 600 yards the column was keeping.

Then the one position the record *does* give: *Vincennes* capsized at 0250, 09°10′S
159°52′E. The DR at first illumination (0150) puts her at **09°08.2′S 159°54.8′E** —
**3.3 NM to the north-east** of where she went down.

That residual is the answer, not a failure. Between those two times the ship was hit by
something over seventy shells and at least two torpedoes, lost steering, and burned for an
hour. Three miles of drift and manoeuvre is what that hour should look like. A DR that
landed *on* the sinking position would mean the model had been fitted to it.

---

## 5. 1944 · a contradiction, preserved

The Leyte theater is the thinnest of the three: single positions lifted off Graybook pages,
no continuous track. It earns its place because of what the model found in it.

Cripple Division 1 — *Canberra* torpedoed east of Formosa on 14 October, *Houston* hit the
same evening, both under tow — is the one part of this plot that can be checked against
itself, because the same Graybook entry gives two positions *and* the speed the ship was
making. So the check computes the speed made good between the fixes:

> **21.7 knots**, against a stated towing speed of **4.5**. A factor of 4.8.

A crippled heavy cruiser under tow does not make twenty-one knots. One of those numbers is
wrong, and the model's view is that the *position* is good and the *date label* is not: at
4.5 knots that run takes about four and a half days, which puts *Canberra* there around the
18th or 19th — consistent with her reaching Ulithi at the end of the month, and not with
0600 on the 15th.

Rather than quietly repairing the coordinate, the model introduces a check kind:

```js
{ id: "tow-speed", kind: "contradiction", stated: 4.5, minDiscrepancy: 5, ... }
```

A `contradiction` check **passes while the sources still disagree**. Editing the data to
make the plot tidy would break the test suite instead of the plot. The disagreement is the
finding, and the finding is now load-bearing.

---

## 6. The minimal USGS DEM

### 6.1 Why it is a reconstruction

This repository samples real USGS 3DEP elsewhere (`js/ca-geo.js`, `data/bluetops/dem.json`).
It cannot here, for a reason worth stating plainly: **3DEP is the United States.** The
Strait of Hormuz, Iron Bottom Sound and the Philippine Sea are not in it. An identify call
against the 3DEP ImageServer over Qeshm Island returns nothing, and a terrain layer that
silently returns nothing is worse than one that says so.

The USGS/EROS products that *do* cover these frames are global, and they are downloads
rather than APIs — SRTM 1 Arc-Second Global, ASTER GDEM v3, GMTED2010, all behind a free
EarthData registration. So `js/vincennes-dem.js` ships **30 published spot heights and
soundings**, generalised island outlines, and a documented interpolation kernel, and labels
itself a control-point reconstruction everywhere it can be seen: in `DEM_META.status`, in
the layer tooltip, in the inspector panel, and in `data/vincennes/README.md`.

`DEM_META.products` names all four products including the unusable one, with the
EarthExplorer path, and `DEM_META.swapIn` gives the two `gdal_translate` calls that replace
the whole thing with a real clip. Because every consumer goes through
`sampleDem(grid, lon, lat)`, that swap changes nothing downstream.

### 6.2 The kernel

Inverse-distance (Shepard, power 2.4) over a land-masked pool: land control points
interpolate land, soundings interpolate water, and the two never mix. Two refinements,
both because the naive version was visibly wrong:

- **The coastal taper scales to the island.** A fixed ramp flattened Hengam — nine
  kilometres across, 106 m high — into a bump while barely touching Luzon. The ramp is now
  0.3 × the polygon's smaller dimension, so small islands keep their height.
- **The shelf width is per theater.** A 13 km shoaling ramp is right for the broad sandy
  Gulf and absurd for a volcanic cone in a 1,000-metre sound: it put the *Vincennes* wreck
  in 73 metres of water instead of 1,020. Savo's shelf is now 0.018°, and the wreck reads
  −1,018 m against a control value of −1,020.

### 6.3 Keeping it honest

`validateControl()` asserts that every land spot height falls inside a land polygon and
every sounding outside all of them, with the right sign, inside the right bbox. A control
point on the wrong side of its own coastline is silently dropped from the interpolation
pool and yields a DEM that looks fine and is wrong — so this runs in the test suite, not in
a comment. `dem.json` also carries a probe table; the tests rebuild the grid and assert
each probe still reads within 2 m, which catches any accidental change to the kernel.

---

## 7. The DjVu layer

### 7.1 Why a scanned-document format is in a naval-geometry app

Every primary source here is a page image. The Graybook is 3,548 scanned pages; the Fogarty
report is a photocopied typescript with the classification markings struck through by hand;
the ICAO figures are halftones. DjVu is what library and archive pipelines put such pages
into, and it is the only common document format whose *structure* is the useful part: the
page is explicitly separated into a bitonal JB2 mask — the typing, the contour lines, the
stamps — and IW44 wavelet colour layers, with the OCR text in its own chunk carrying a
bounding box per word. That is a document you can overlay on a map.

### 7.2 What the reader does

`js/vincennes-djvu.js` implements, completely: the IFF85 container walk (`AT&T` magic,
`FORM:DJVM`/`DJVU`/`DJVI`/`THUM`, nesting, the odd-length pad byte), `INFO`, `INCL`, `ANTa`,
and `TXTa` including the hidden-text zone tree. `INFO`'s dpi field is little-endian in an
otherwise big-endian format — a real quirk of the original AT&T encoder, and one the tests
pin down explicitly.

### 7.3 What it refuses to do

`TXTz`, `ANTz`, `NAVM` and the `DIRM` body are **detected and reported, not decoded**. They
are BZZ streams: Burrows–Wheeler plus the ZP adaptive binary arithmetic coder, whose
256-entry state table cannot be reproduced from memory with any confidence. So the reader
names them, says why, and points at the two paths that work — `djvused -e 'print-pure-txt'`,
or the Internet Archive's `<id>_djvu.xml` derivative, which it parses into word boxes.

### 7.4 The undocumented part, handled as undocumented

The `TXTa` zone-record layout **is not in any published DjVu specification.** The DjVu3
spec says "to be documented." The only normative description is DjVuLibre's
`DjVuText.cpp`. So the layout is implemented from that, exported as `ZONE_RECORD` with its
caveat attached — and the parser then **insists it consumed exactly the chunk**. If it did
not, it emits `zoneParse: "length-mismatch"`, no boxes at all, and a warning naming
`ZONE_RECORD` as the thing to fix.

That design decision is the one worth defending. A guessed binary layout that emits
plausible-looking rectangles is far more dangerous than one that refuses, because the
rectangles are wrong in a way nobody will notice. The tests corrupt a zone type byte, and
separately inflate a child count, and assert both times that the reader refuses while the
*text* layer still works.

### 7.5 The fixtures

Four generated plates, about 4 KB total, in `data/vincennes/djvu/`. Each is a genuine DjVu
byte stream carrying the transcribed text of the page it stands for, with no image layer —
because there is no scan. The generator round-trips every plate through the reader and
throws if the text, the zone count or the geometry does not come back identical, so the
encoder and decoder validate each other. Drag a real `.djvu` or an IA `_djvu.xml` onto the
page and it takes the same code path.

---

## 8. The viewer

Local east-north-up tangent plane at the theater origin: +X east, +Z south so north is
up-screen, one scene unit to the nautical mile. Vertical exaggeration ×6, because 13,500
feet is 2.2 nautical miles and the interesting part of the 1988 geometry happens over ten
of them.

Nine to eleven toggleable layers per theater — terrain, manoeuvring board, airway corridor
or patrol box, one per track, recalled altitudes, fitted gradients, cross-check residuals,
landmarks, events, source plates — with `ALL` / `NONE` / `GEOMETRY ONLY` presets. The time
slider drives `setDrawRange` on the track geometry and moves a marker per contact; the
readout is zone-stamped (`Z`, `L`, `I`) because the 1988 story turns partly on the fact that
the ship kept Bahrain time while Iran kept Z+4:30.

Detail windows reuse `initPipWm` from `js/project-y-4dwm.js` unmodified, with `--accent`,
`--muted` and `--ink` re-pointed to a chart-paper palette. The window manager was written
for a different app and needed no changes, which is the test of whether it was actually
general.

Everything clickable resolves to its source. A track node gives its time, position,
altitude, slant range, bearing, and the document it came from; it is badged `DERIVED`,
`ASSUMED`, `DISPUTED`, `INTERPOLATED` or `DEAD RECKONED` where any of those apply.

---

## 9. What this is not

A geometric reconstruction for study. Not a track chart, not an accident report, not
evidence. The recorded tapes, the testimony and the court filings disagree with each other
in ways that are the whole point of the exercise; the model shows the disagreement, it does
not resolve it.

Specific boundaries retained in the data:

- **Ownship is held at one point in 1988.** *Vincennes* was manoeuvring hard in a gun action
  with Iranian small boats throughout, and no minute-by-minute ownship course and speed is
  published. The model holds her at the ICAO launch fix, marks the holds `assumed: true`,
  and flags every range and bearing as measured from that point.
- **The A-59 centreline is derived, never quoted.** The sources give the corridor width
  (20 NM) and the aircraft's maximum deviation (4 NM), not a geodetic centreline. It is
  reconstructed from the stated 3.37-mile offset of the impact point, and labelled as such.
- **The post-intercept positions are reconstructed** from the falling track's altitudes and
  are all marked `derived: true`. They are excluded from the climb fit; mixing a falling
  airframe into a departure profile would turn a line into a parabola.
- **The island outlines are generalisations** — a dozen vertices where the real coastline
  has ten thousand. They place the islands correctly at the right size; they are not a
  shoreline.
- **The Leyte date labels are disputed by the model itself.** See §5.

---

## 10. Testing

`tests/19-vincennes.mjs`, 60 tests, run by `tests/run.sh` after regenerating both data
artefacts — so a drift between a generator and its committed output fails the suite.

The suite covers the geodesy primitives against closed-form inverses; the three solved
theaters and all eight declared cross-checks; the specific findings above (the runway
back-projection, the fall direction, the sign and quality of both altitude fits, the
non-CBDR bearing drift, the corridor containment, the closed patrol box, the 600-yard
column interval, the preserved Canberra contradiction); provenance discipline (every `src`
key resolves, every primary source has a URL, every derived and assumed value is flagged);
the DEM control validation and probe table; and the DjVu reader — round-tripped against its
own encoder, then corrupted two different ways to confirm it refuses rather than guesses.

Two of the tests exist to stop the architecture eroding: one asserts the view layer
contains no literal latitudes, and one asserts the page loads the shared pip stylesheet
before its own so the theme can still override it.

## Shipping it as a chat app

`node scripts/build-vincennes-xdc.mjs` writes `vincennes-4dwm.xdc` (307 KB,
26 entries, byte-reproducible) to the repo root and to `dist/`. A `.xdc` is a
deflated ZIP rooted at `index.html` + `manifest.toml`; drop it into a Delta
Chat thread and it opens as an app inside the conversation.

The bundle is multi-file with native ES modules rather than inlined into one
document, which is the shape `los-alamos.xdc` already uses here. That choice
is about provenance: the six modules, `data/vincennes/dem.json`, the four DjVu
fixtures, this write-up and the source-check all travel inside the archive and
stay readable to anyone who unzips it. `vendor/THREE_LICENSE` rides along with
the vendored three.js.

Two things exist only in the bundle. `js/vincennes-xdc-data.js` carries the
plate manifest and the four DjVu fixtures as base64, because `fetch()` of a
bundled file is not guaranteed across webxdc hosts; the viewer prefers the
embed and falls back to HTTP, so the same `js/` tree serves both the web page
and the app. And `command-viewer.html` is the original canvas plot this
reconstruction grew out of, carried along unchanged — the bundle contains the
thing it replaced as well as the replacement, reachable from the COMMAND
VIEWER button in the top bar.

### The view is the shared state

A chat is where people argue about a reconstruction, so the plot is shared
rather than the messages about it. Switching theater, scrubbing the clock, or
opening an event, a cross-check or a plate broadcasts a small payload:

```js
{ v: 1, theater: "hormuz-1988", t: 24862, layers: ["dem", "track:tn4131", …],
  reason: "scrubbed the clock", open: "event:launch" }
```

Everyone else's plot moves to match. Scrubbing is coalesced on a 220 ms timer
because the slider fires continuously, and an update arriving within 400 ms of
one we sent is ignored so two clients cannot ping-pong a time cursor between
them. The `summary` line each update carries — `Hormuz 1988 — 03 JUL 0654:22Z`
— is what the chat shows in the message list, so the thread reads as a log of
where the argument went.

None of this is required. `initWebxdc()` returns immediately when
`globalThis.webxdc` is absent and `shareView()` is a no-op without a host, so
the page on the open web behaves exactly as it did before. The bundled
`webxdc.js` is the simulator shim: it satisfies the API and delivers nothing,
which makes a solo session out of a plain static server.

Four tests cover the packaging (`tests/19-vincennes.mjs`). The strongest one
opens the built `.xdc` and walks every `src`/`href` in `index.html` and every
relative `import` in every bundled module, asserting each target is present in
the archive — deleting one module from the zip fails it by name. It also
re-parses the embedded plates through `parseDjvu` and asserts they are
byte-identical to the shipped fixtures, so the embed cannot drift from
`tools/make-vincennes-plates.mjs`.
