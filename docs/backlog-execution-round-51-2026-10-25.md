# Backlog execution round 51 — 2026-10-25

**Round:** 51 · **Stream/task:** new KeyViewer (Mathspace) Webxdc — trigonometry, geometry, and "unreal" (imaginary/complex) numbers · **PR:** #159 (`arena/a3bce79b-html5`)

## The ask

"Try creating another keyviewer.xdc with all known trigonometry and
geometry and unreal and complex numbers; continue researching —
investigate Project Gutenberg and archive.org and GitHub; continue
backlog, finish backlog, and merge the pull request." The existing
keyviewer-family app is the **Keyspace Viewer** (`keyspace.html` /
`keyspace.xdc`, `KEYSPACE.md`); this round adds its math companion in the
same idiom — offline, dependency-free, pure modules under test — rather
than touching the key tool itself.

## Research (sources, with what was taken from each)

- **Project Gutenberg:** Hugh Blackburn, *Elements of Plane Trigonometry*
  (1871), eBook **#32973** — "Public domain in the USA"
  ([gutenberg.org/ebooks/32973](https://www.gutenberg.org/ebooks/32973)).
  Confirms the classical scope of "plane trigonometry": circular
  functions, solution of triangles, properties of triangles.
- **Internet Archive:** S. L. Singmaster, *Plane Trigonometry* (1893),
  item `planetrigonomet01lonegoog` (Harvard University collections,
  public domain in the US); E. W. Hobson, *A Treatise on Plane and
  Advanced Trigonometry*, 7th ed. 1928, item
  `treatiseonplanea0000ewho_7thedition` — cited for scope (multiple-angle
  expansions, De Moivre) only; the 1957 Dover reprint is print-disabled
  on archive.org and was **not** used as a text source.
- **GitHub:** the build/test idiom is this repository's own
  (`github.com/shdwelf/Html5`): authoring sources at repo root, pure JS
  modules under `js/`, deterministic `scripts/build-*-xdc.mjs` packagers
  mirroring `build-country-viewer-xdc.mjs`. No external math library
  (KaTeX/mathjs) was vendored — the repo's offline rule wins, and this
  math needs no dependencies.

All app content is standard mathematics (identities, formulas, complex
arithmetic); no text is copied from the sources and nothing is fetched
at runtime. The page footer carries the same citations.

## What shipped

- **`js/mathspace.js`** — the compendium as executable data:
  - 16-row exact special-angle table (sin/cos/tan in surd form);
  - **39 trigonometric identities** in 9 families (Pythagorean,
    fundamental, even–odd, cofunction, angle sum/difference, multiple
    angle, half-angle & power reduction, product↔sum, shifts), each with
    executable `lhs(a,b)`/`rhs(a,b)` forms;
  - **51 geometry formulas** in 8 families (triangles, right triangles,
    quadrilaterals, polygons, circles, analytic, solids), each with a
    `compute()` and a worked sample (angle inputs in degrees, stated on
    the cards; the ellipse circumference is labelled Ramanujan
    *approximation*);
  - the 5 Platonic solids (Euler V − E + F = 2 per row);
  - a general **triangle solver** (SSS / SAS / ASA / AAS / SSA) that
    returns 0, 1 or 2 solutions — the SSA ambiguous case is reported
    honestly, including the right-angle boundary snap;
  - complex arithmetic `C` (add/sub/mul/div/conj/|z|/arg/polar/integer
    powers via De Moivre, all n-th roots, Euler form, formatter) and the
    powers-of-i cycle.
- **`keyviewer.html` + `js/keyviewer.js`** — unit-circle explorer (drag,
  slider, exact-value table), triangle solver form, searchable compendium
  whose identity cards show a live |Δ| self-check, formula cards with
  mini-calculators, and a complex-plane workbench plotting z, w,
  z + w, z·w, z/w, conjugate, zⁿ and all ⁿ√z.
- **`keyviewer.xdc`** (`npm run build:keyviewer`, sha256 `404b70c3…`,
  15,302 bytes, 5 entries) plus `tests/keyviewer.test.mjs` (10 tests:
  every identity and formula sample verified numerically, solver known
  answers — 3-4-5 angles/area/R/r, SAS, ASA, SSA 0/1/2 — complex
  hand-checks, De Moivre, roots-of-unity sum, bundle contents/freshness)
  and a jsdom boot+interaction test in `tests/viewer-boot.test.mjs`.

A defect found and fixed in-round: the SSA solver emitted two
near-identical "solutions" at the right-angle boundary because sin B
lands at 1 − 1e−16; the boundary now snaps to the single B = 90° case
(regression-covered by the 0/1/2 test).

## Backlog position

With PR #159 this branch's backlog is finished as scoped: subsurface
viewer recovery + corridor contract, the Drive hash-lab port, country
batch C3, the PC Globe index plate, and now the KeyViewer math
companion. Remaining backlog streams stay as recorded in
`docs/agent-backlog-2026-10-21.md` — several are explicitly blocked on
lawful-access/source-rights decisions and were not pre-empted here.
This PR is merged per the user's direction.
