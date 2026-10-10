# RED OCTOBER · CUTAWAY 4DWM — deep dive

*2026-10-09 · `red-october-4dwm.html` · companion to `js/red-october-{data,geo,checks,vrml,4dwm}.js`*

A DK cross-section cutaway of three hulls — the Soviet Project 941 SSBN the
1984 novel calls the *Red October*, the Los Angeles-class boat that finds her,
and the Project 971 that carries the name NATO gives to neither — over a
four-dimensional timeline of the book, in the same viewer idiom as
`vincennes-4dwm.html` and `socal-subsurface.html`.

Everything on screen is computed at load time from
`js/red-october-data.js` (published dimensions, tiered) by
`js/red-october-geo.js` (pure geometry), asserted by
`js/red-october-checks.js` (cross-checks), and mirrored to `.wrl` by
`js/red-october-vrml.js`. Nothing is a stored screen coordinate and nothing is
scaled to fit the camera: one scene unit is one metre.

## What is real and what is the novel

The viewer carries two very different kinds of fact and refuses to blend them:

- **Real.** Project 941, Los Angeles and Project 971 dimension data, each value
  tagged `official` (navy/treaty-publication) or `community` (well-sourced
  secondary reference). Where two publications disagree the disagreement is
  carried, not averaged.
- **Fiction.** The caterpillar drive, the boat named *Red October*, and the plot
  are tagged `fiction` and labelled as such on screen. No Project 941 boat
  carried a magnetohydrodynamic drive; the model draws it because the novel
  does, and says so.

The "Lithuanian city school teacher" could not be verified against the novel or
against any published Project 941 reference. Ramius being Lithuanian-born *is*
in the novel and is modelled; the school-teacher connection is recorded as an
open question in `SOURCES` (`src-unverified`) rather than built into the
geometry. That is the honest resolution.

## The naming collision

The single most confusing thing about these boats is that the names are
swapped between the two navies, and the viewer refuses to paper over it:

| Soviet project | Soviet name | NATO reporting name |
| --- | --- | --- |
| 941 | «Акула» (shark) | **Typhoon** |
| 971 | «Щука-Б» | **Akula** |

Both names are correct for both boats depending on who is speaking. The boat
switcher shows the project number first precisely because that is the only
unambiguous identifier. `fleet/naming-collision` is a cross-check that fails if
the data ever stops recording both names for both projects.

## The DK section and the VRML cut

"DK" is the pressure body. The live viewer does the cut with a real Three.js
clip plane at the centreline, keeping the port half, so the pressure hull,
silo grid and compartments are visible inside the light hull; a slider walks
the clip plane across the beam.

VRML 2.0 has **no clip planes**, so the export does the cut geometrically:
faces whose vertices all fall on one side of the plane are emitted, the rest
dropped, and the open edge capped with the cross-section polygon from
`sectionAt()`. `tests/red-october.test.mjs` asserts the cut drops roughly half
the faces and that the cap is present only in section mode. The header records
how many faces survived the cut, so the number is verifiable, not asserted.

The hull form itself is deliberately asymmetric — a blunt elliptical nose
forward (the sonar dome is close to a hemisphere) and a long taper aft to the
screw. Getting that inverted produces a teardrop pointed at the bow, which is
the first thing the hull-form test catches.

## Cross-checks (two independent paths)

Every check compares two numbers that reached the model down independent
paths. `kind: "contradiction"` marks a check written to pass *while the sources
still disagree*; it prints the spread rather than averaging it away.

- `*/beam-closure` — the pressure hull(s) fit inside the light hull
  (2 × 7.2 m + 1.6 m gap = 16.0 m ≤ 23.0 m on the Typhoon).
- `typhoon/silo-grid` — 20 R-39 silos in two files of ten, inside the silo deck,
  no overlap.
- `*/displacement-band` — envelope volume integrated from the hull surface
  against the published submerged displacement. ~1.0× on the attack boats; the
  Typhoon reads high because a teardrop envelope overstates a catamaran with
  inter-hull void, and the check says so.
- `*/admiralty` — shaft power and top speed imply a plausible coefficient; the
  spread across the three boats (C ≈ 3–8) is the finding.
- `*/crew-density` — m³ per crewmember; an SSBN cannot be compared to an SSN on
  this axis because most of its envelope is missile volume, and the check
  reports that instead of pretending otherwise.

## Verification

- `tests/red-october.test.mjs` — 20/20. Pure geometry, silo grid, section,
  checks, VRML validity, page/viewer wiring.
- `tests/red-october-browser.mjs` — 9/9 on real WebGL (SwiftShader). Boots,
  draws non-background pixels, survives every boat × mode transition, exports a
  `.wrl` from inside the page, and guards the regression where `<body
  data-mode>` was accidentally bound as a mode button and reset the view on
  every click.
