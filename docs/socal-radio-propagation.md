# Radiowave propagation, FCC towers and the relief map

Companion to `docs/socal-subsurface.md` and `docs/terrain-vector-overlay-deep-dive.md`.
What the spectrum layer computes, where the numbers come from, and exactly
which parts of it are a curve fit to a 1960s chart.

Modules: `js/socal-propagation.js` (maths), `js/socal-radio-data.js` (register),
`js/socal-radio.js` (scene), `js/socal-relief.js` (2D relief), and
`scripts/fetch-3dep-dem.py` (the DEM this all deserves).

---

## 1. Why a theater with pipelines in it grew an antenna farm

Everything else in this scene is a thing you can touch: a pipe, a rail, an
aqueduct, a fire scar. Radio is the one infrastructure in Southern California
that is pure terrain. A transmitter's reach is not a property of the
transmitter — it is a property of the ridge it stands on and the ridges between
it and you. Mount Wilson is 1,742 m of San Gabriel granite, and that is the
entire reason it carries most of the Los Angeles broadcast spectrum.

Which makes it the right stress test for the elevation field. Pipelines drape
on terrain; propagation *interrogates* it. If `elevationAt()` is wrong, a
coverage contour is visibly, embarrassingly wrong — a shadow where there is no
mountain. That is the point of putting it in: it makes the synthetic surface's
limitations impossible to ignore, and it is already wired to the real one.

---

## 2. Three models, and what each is for

`js/socal-propagation.js` carries three, deliberately disagreeing.

### 2a. Free space + knife-edge diffraction over a 4/3 earth

The physical one. March a radial, sample the ground, add the earth bulge
`d₁d₂/2kR` to each intermediate point so the line of sight can be drawn
straight, find the obstruction with the largest Fresnel-Kirchhoff parameter

```
v = h · sqrt( 2(d₁ + d₂) / (λ d₁ d₂) )
```

and take the ITU-R P.526 single knife-edge loss

```
J(v) = 6.9 + 20·log₁₀( sqrt((v − 0.1)² + 1) + v − 0.1 )   for v > −0.78
J(v) = 0                                                   otherwise
```

This model knows about Cajon Pass. Its contours have fingers and shadows.
It is also optimistic in open country, because it has no term for tropospheric
variability, clutter or multipath — which is what model 2b is for.

Two distinct clearance questions get distinct answers, because engineers treat
them differently:

- `lineOfSight` — does the ground, plus the bulge, rise into the straight ray?
- `fresnelClear` — is at least 0.6 of the first Fresnel zone clear? This is the
  criterion you actually survey to. A path can be geometrically clear and still
  lose a few dB; at 100 MHz over 18 km the first Fresnel zone is 116 m across,
  so "I can see the tower" is not the same statement as "the path is clear".

### 2b. The FCC smooth-earth contour

A closed-form stand-in for the F(50,50) and F(50,90) curves of 47 CFR 73.333
and 73.699:

```
E(dBµV/m) = K + 10·log₁₀(ERP kW) + A·log₁₀(HAAT m) − G·log₁₀(d km)
```

with `A = 16.3125` and `G = 49.4173` least-squares fitted to all eight FM class
reference facilities of 47 CFR 73.211(b)(1):

| Class | ERP | HAAT | contour | reference distance |
| --- | --- | --- | --- | --- |
| A | 6 kW | 100 m | 60 dBu | 28 km |
| B1 | 25 kW | 100 m | 57 dBu | 44 km |
| B | 50 kW | 150 m | 54 dBu | 65 km |
| C3 | 25 kW | 100 m | 60 dBu | 39 km |
| C2 | 50 kW | 150 m | 60 dBu | 52 km |
| C1 | 100 kW | 299 m | 60 dBu | 72 km |
| C0 | 100 kW | 450 m | 60 dBu | 83 km |
| C | 100 kW | 600 m | 60 dBu | 92 km |

RMS error 1.8 % in distance, worst case 3.3 % (Class C2).

**The height exponent is corroborated from an independent direction.** The
Commission's own power/height trade in 47 CFR 73.622(f) —
`ERPmax(dBk) = 72.57 − 17.08·log₁₀(HAAT)` for UHF, same −17.08 slope for both
VHF groups — is an iso-coverage curve: it says what you must give up in power
to buy height while holding coverage constant. Our fit implies
`10·log₁₀(P) = const − 16.31·log₁₀(HAAT)` along the same iso-coverage line.
16.31 against 17.08 is agreement to within 5 % on an exponent neither of us
derived from physics.

**`K` is per band, and that matters.** The FM fit extrapolated to a 28 dBu
low-VHF contour predicts 276 km where the rule says 128 km: a single-slope
power law cannot be right at both 30 km and 300 km, because the real curves
steepen past the horizon. So each TV band gets its own `K`, anchored on the
maximum-facility / maximum-service-radius pairs in the 47 CFR 73.626(c) Table
of Distances (Zone II/III rows, which is where California is):

| Band | Maximum facility | F(50,90) contour | Threshold | Fitted K |
| --- | --- | --- | --- | --- |
| ch 2–6 | 45 kW @ 305 m | 128 km | 28 dBu | 75.08 |
| ch 7–13 | 160 kW @ 305 m | 123 km | 36 dBu | 76.71 |
| ch 14–36 | 1000 kW @ 365 m | 103 km | 41 dBu | 68.68 |
| FM 88–108 | class reference facilities | — | 60 dBu | 91.6046 |

All four reproduce their anchors to under a kilometre (`test/socal-radio.test.ts`).
Each is honest only near its own anchor distance — which happens to be the
range the Mount Wilson stations in this register actually work in.

### 2c. The hybrid used for coverage polygons

The terrain march alone says a 1,700 m site serves 240 km over water.
Geometrically it does; the ray clears the bulge. In practice the signal is lost
to variability the model has no term for. So the smooth-earth curve is applied
as a **ceiling**: terrain can only subtract from it.

```
field = min( free space − knife edge − clutter allowance,  FCC curve )
```

Shadows stay sharp; open radials stop somewhere a broadcast engineer would
recognise. Both numbers are shown side by side in the dossier — solid ring for
the terrain march, dashed circle for the smooth-earth contour — so the
disagreement is visible rather than argued about.

### 2d. AM groundwave

Medium wave does not do any of the above. 640 kHz follows the curve of the
earth as a surface wave, and its range is set by ground conductivity, not by
height. An exponential-decay stand-in for the 47 CFR 73.184 curves:

```
E = (E₀/d)·exp(−d/d₀),   d₀ = 3.9·σ(mS/m)/f(MHz),   E₀ = 300·√P mV/m at 1 km
```

Coastal basin soils are taken at 12 mS/m and dry inland at 6, which puts a
50 kW Class A on 640 kHz past 200 km in the daytime — about where Southern
California's clear channels actually land. It is a cartoon of a Sommerfeld
solution, not one, and it is labelled as such in the panel. Skywave is not
drawn at all: that is 47 CFR 73.190 and a different physics.

### What none of this is

**Longley-Rice.** The ITM as implemented in OET-69 is the regulatory standard
for DTV coverage and interference, and it adds troposcatter, climate zones,
surface refractivity, ground constants and location/time variability on top of
the diffraction term. Closing that gap is a real piece of work and it is listed
as open. The contour method here is explicitly the Commission's own 1960s
simplification, carried because it is the thing the rules are written in.

---

## 3. HAAT, done to the rule

`haatPerFcc()` implements 47 CFR 73.313(d): average the ground elevation along
each of eight cardinal radials between 3 and 16 km from the antenna, at least
50 evenly spaced points per radial, subtract from the radiation centre AMSL,
and average the eight. Receive antenna is 9 m, per the curves.

On the synthetic field this returns about 290 m for a Mount Wilson station
whose filed HAAT is 981 m — the gaussian surface smooths a kilometre of San
Gabriel into a swell. So the contour model **prefers the filed HAAT** when the
register has one, and the computed value is displayed next to it as a running
check on the terrain. When a real 3DEP grid is installed, those two numbers
should converge; the gap between them is a live measurement of how wrong the
elevation field is.

---

## 4. The register

`js/socal-radio-data.js`: 19 transmitter sites and ~27 licensed emitters, each
row carrying its own `sources[]` and evidence tier.

- **official** — traceable to an FCC record: ASR registration, LMS facility,
  ULS licence, or an operator's own published site sheet. Example: ASR 1012836
  on Mount Wilson, 34-13-55.0 N / 118-04-17.8 W, site elevation 1,724.7 m,
  structure 274.2 m, overall 2,021.1 m AMSL, with lighting shielded to protect
  the observatory — a detail that is in the registration because the
  astronomers made it be.
- **community** — well-documented secondary sourcing (site operators' public
  pages, tower-site registers).
- **context** — generalized pin. Exactly one: Flint Peak.

Structure registration is required above 200 ft (60.96 m) AGL or when the
airport slope test is failed — FAA Form 7460/854 then an FCC ASR number. That
threshold is why the register is skewed to mountaintops and why the
Mojave's shorter land-mobile sticks are under-represented in public data.

Band thresholds implemented in `serviceThresholdDbu()`:

| Service | Protected / noise-limited contour |
| --- | --- |
| FM (A, C3, C2, C1, C0, C) | 60 dBµV/m |
| FM B1 / B | 57 / 54 dBµV/m |
| DTV ch 2–6 | 28 dBµV/m F(50,90) |
| DTV ch 7–13 | 36 dBµV/m |
| DTV ch 14–36 | 41 − 20·log(615/f) dBµV/m |
| AM daytime secondary | 0.5 mV/m (54 dBµV/m) |

---

## 5. The relief map

`js/socal-relief.js` is a small 2D cartographer on a canvas: hypsometric tint,
grey ramp or slope ramp, multiplied by a Lambertian hillshade

```
shade = cos(z)·cos(slope) + sin(z)·sin(slope)·cos(sunAz − aspect)
```

with a marching-squares contour generator over the same grid, every 250 /
500 / 1000 m, index contours darker. Default illumination is the cartographic
convention: 315°, 45° altitude, which is light from the upper left and is
physically impossible in the northern hemisphere. We do it anyway because
relief inversion — mountains reading as pits — happens the moment you light a
map from the south, and it is one of the few places where a convention beats
correctness.

The same three modes are available on the 3D terrain mesh itself through the
RELIEF button, computed on the mesh lattice rather than the canvas grid.

Clicking the relief map flies the camera; coverage contours drawn in the 3D
scene are drawn on it too, dashed for the smooth-earth version.

---

## 6. USGS 3DEP — the elevation field this deserves

`scripts/fetch-3dep-dem.py` is the bridge. It knows three retrieval recipes —
the 3DEP dynamic ImageServer, OpenTopography's `usgsdem` API, and the National
Map's TNM Access API — resamples to the app's 190 × 150 lattice, and emits a
base64 `Int16Array` ES module that `installDem()` in `js/socal-geo.js` accepts.

```
python3 scripts/fetch-3dep-dem.py --nx 190 --ny 150 --out js/socal-dem-grid.js
```

The app imports that file dynamically and falls back to the synthetic field if
it is absent, which is the shipped state: the grid is a large binary asset and
this theater runs offline from a `.xdc` package.

Programme status, as of the latest published figures: 3DEP had terrestrial
lidar over **98.3 %** of the nation at the end of FY2024, with baseline
collection expected complete in **2026** and the seamless national map in
**2027**; next-generation recollection at QL1 has been funded since FY2023. A
**seamless 1 m bare-earth DEM** is in development, as is a seamless topobathy
product. Until then 1/3 arc-second (~10 m) is the right choice for this frame:
seamless, 1° × 1° tiles, NAD83 / NAVD88.

What changes when it lands: every contour in this document stops being a
demonstration. HAAT computed from the grid should land within tens of metres
of the filed values, the Cajon and Soledad shadows become real shadows, and
the Long Lines hop analysis in the utilities layer becomes an actual path
survey rather than an illustration of one.

---

## 7. Still open here

- Longley-Rice / ITM, which is the only way to claim agreement with OET-69.
- Directional antenna patterns. Every emitter in the register is treated as
  omnidirectional; real FM and TV antennas have azimuth patterns and
  mechanical/electrical beam tilt, and the depression-angle correction matters
  for a site 1,700 m above its audience.
- Multiple-edge diffraction (Deygout, Epstein-Peterson). One knife edge is
  generous across the Transverse Ranges, where there are usually three.
- AM directional arrays and nighttime skywave.
- Real ground conductivity from the FCC M3 map rather than two constants.
