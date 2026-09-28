# PRIME VIEWER — Atlas, Orrery, and Constellations

`prime.html` · `js/prime-viewer.js` · `js/primes.js` · `css/prime.css`

Prime Viewer is an offline, deterministic companion to Keyspace Viewer. It
turns exact prime-number computations into three coordinated 3-D views while
keeping the distinction between measured structure and visual mapping explicit.
It has no CDN, API, font, analytics, or network dependency.

## The three universes

### Ulam Atlas

Every prime `p ≤ N` is placed at its exact integer coordinate on the square Ulam
spiral. The slight vertical displacement is only a legibility device; `(x,z)` is
the true spiral coordinate. Diagonal alignments are therefore properties of the
integer sequence, not random star placement.

### Residue Orrery

Every prime greater than five is in one of the eight residue classes coprime to
30:

```
1, 7, 11, 13, 17, 19, 23, 29 (mod 30)
```

Those classes become eight orbital families. Radius also receives a small
logarithmic `p` term and angle uses a golden-angle schedule to prevent visual
overlap. This is a wheel-factorisation view, not a physical model of gravity.

### Prime Constellations

Primes are evenly embedded on a Fibonacci sphere. Exact arithmetic separations
become edges:

- twin primes: `(p, p+2)`
- cousin primes: `(p, p+4)`
- sexy primes: `(p, p+6)`
- prime triplets: `(p,p+2,p+6)` or `(p,p+4,p+6)`

The sphere is an index embedding; the bonds are the number-theoretic data.

## Statistics and inspection

For a selected survey horizon from 100 through 100,000, the viewer reports:

- exact prime-counting function `π(N)` and density `π(N)/N`;
- the prime-number-theorem estimate `N/ln N` and relative error;
- observed mean, standard deviation, maximum gap, and where that record gap
  begins;
- exact twin-pair and prime-triplet counts;
- gap histogram, mod-30 residue counts, and an exact `π(x)` curve against
  `x/ln x`.

The integer inspector uses trial division through `√n` for values up to one
billion, reports exact factorisation for composites, and locates an in-range
prime in the active 3-D universe.

## Algorithms and limits

The survey uses a byte-array Sieve of Eratosthenes and is intentionally capped
at 100,000 for responsive mobile/WebView rendering. The pure engine is tested
against `π(100)=25`, known primality/factorisation cases, the first Ulam spiral
ring, known twin/cousin/sexy pairs, the record gap below 100, and the mod-30
wheel invariant.

Visual point size, orbital radius, sphere placement and line opacity are display
transforms. Prime membership, ordinal, gaps, residue classes, constellation
edges and all chart counts are exact.

## webxdc

**Share view** sends only `{view, limit, focus}`. Peers rebuild the same universe
locally; no large point cloud is transmitted. The update listener accepts only
the three declared view names and clamps the shared horizon to the UI range.

## Packaging

```sh
sh tools/pack_prime.sh   # -> prime.xdc
```

The standalone archive contains the page, styles, prime engine, viewer,
Three.js/OrbitControls and licenses. `prime.html` is also included in the SITE-K
hub package.
