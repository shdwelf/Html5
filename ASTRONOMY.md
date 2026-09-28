# Helios Observatory

Helios is an offline, interactive Three.js astronomy exhibit for SITE-K and webxdc. Open `astronomy.html`.

## Views

- **Solar Orrery** propagates planets, dwarf planets, selected asteroids/near-Earth objects, comets, and major moons through time.
- **Near-Earth Radar** applies an Earth-centered distance transform to selected NEOs and comets. It is a visual proximity aid, not a close-approach or risk forecast.
- **Meteor Stream Atlas** draws modeled particles along approximate stream/parent orbits for the Perseids, Geminids, Leonids, Eta Aquariids, and Taurids.

The date, simulation speed, orbit/label/moon layers, body inspector, stream inspector, responsive telemetry drawer, camera controls, and deterministic webxdc shared state all work offline.

## Mathematical model

`js/astronomy.js` stores a curated educational snapshot of approximate orbital elements. For elapsed days `d`, mean anomaly advances as `M = M0 + 2πd/P`. Newton iteration solves Kepler's equation `E - e sin(E) = M`. Ellipse-plane coordinates are rotated by longitude of ascending node, inclination, and argument of periapsis into heliocentric 3-D coordinates. Moon coordinates are parent-relative; their display separation is intentionally enlarged. The full-system renderer uses a logarithmic radial transform, and the radar uses an Earth-centered nonlinear transform. These visual transforms do not alter telemetry calculations.

## Scientific scope

The catalog is deliberately substantial and representative, **not complete**. Stored elements and periods are approximate, mostly J2000-scale snapshots, without perturbation, precession, nongravitational comet effects, relativistic terms, or precision satellite ephemerides. Results are not suitable for navigation, observing plans, Horizons-equivalent ephemerides, close-approach prediction, or impact assessment.

A **meteoroid** is a small body orbiting the Sun; a **meteor** is the visible atmospheric phenomenon; a **meteorite** is material that survives to the ground. The stream display is modeled orbital geometry, never a claim of live meteor detections.

## Verification and packaging

Run `node tests/18-astronomy.mjs`. The suite checks catalog integrity, planetary coverage, moon parents, Kepler perihelion/aphelion invariants, closed paths, the J2000 epoch, stream metadata, view contracts, and webxdc sharing. Run `tools/pack_astronomy.sh` to create `astronomy.xdc`.