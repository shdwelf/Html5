# Geomate.jr GPX import and preservation boundary

## Research disposition

The 2014 **Geomate.jr User's Guide**, Part 04-0003-01, documents `.gpx` Pocket Query and Custom Cache inputs in the Geomate Loader, alongside encrypted regional `.cry` files. This supports GPX compatibility research, not recovery of the old updater or firmware. No byte-identical Geomate.jr updater/firmware image was recovered or analyzed during this work; consequently, no Geomate-specific Ghidra findings are claimed. Modern GeoMate/CHCNav survey products are a different product family and are not a substitute target.

The browser importer handles unencrypted GPX 1.0 and 1.1 only. It does not decrypt `.cry`, write to a Geomate, execute a loader, or flash firmware. `tools/verify_ghidra.mjs` is a self-test for the repository's bundled sample catalog, not a generic command-line analyzer for an arbitrary candidate file.

## Local import behavior

The importer lives in `js/gpx-geocache.js`; the UI integration is in `js/socal-subsurface.js` and `socal-subsurface.html`.

- Runs locally in the browser; there are no import or preservation-upload requests.
- Accepts GPX 1.0/1.1, rejects malformed XML, unsupported namespaces/versions, `DOCTYPE` declarations, files over 25 MiB, and more than 5,000 unique normalized cache records.
- Identifies cache waypoints from a Groundspeak cache extension, a `GC...` waypoint name, a cache-like GPX type, or cache-like symbol. It validates coordinates, counts invalid/duplicate/non-cache waypoints, and marks caches outside the theater.
- Adds only valid unique cache points within the current theater frame (lon −121.6°…−114.0°, lat 32.45°…38.35°) to the map and mutable `rec` Gazetteer facet. Imported rows are session-only and marked as user-supplied, not GNIS-verified. No GPX cache is baked into the fixed register.
- The normalized XML/JSON derivative carries the cache code, display name, coordinates, cache type/container and difficulty/terrain when present. It omits descriptions, hints, logs, owner names and child waypoints.

## Preservation export

The optional ZIP is a BagIt 1.0 bag with SHA-256 payload and tag manifests. It contains:

- `data/original/<safe-name>.gpx`: the original uploaded bytes, unchanged;
- `data/normalized/geocache-register.xml` and `.json`: app-defined normalized renditions, including valid caches outside the map frame;
- `metadata/preservation-event.json`, BagIt metadata and checksum manifests.

The normalized schema is explicitly application-defined. This is **Xena-inspired** in the limited sense that it retains a source object and creates a documented rendition; it is not processed by Xena and is not a native Xena `.xena` object. The `.xdc` file is the offline viewer package, not the GPX data or a Xena rendition.

**Privacy:** the normalized rendition excludes private listing fields, but the verbatim original GPX may contain them. Review the original before sharing the preservation ZIP. If more than 5,000 unique caches are found, the ZIP marks the normalization as incomplete and records how many additional records were not normalized; the source GPX remains complete.

## Verification

```sh
npm ci
npm test
npm run build:socal-subsurface
```

Focused tests are in `test/gpx-geocache.test.ts` and `test/socal-gazetteer.test.ts`; package checks are in `tests/webxdc-packages.test.mjs`. The GPX tests verify parser limits/validation, local-cache facet behavior, unchanged source bytes, and both BagIt manifests.

## References

- [Geomate.jr User's Guide, Part 04-0003-01 (2014)](https://www.homesciencetools.com/content/reference/Geomatejr_Users_Guide.pdf) — Loader input choices, including GPX Pocket Queries/Custom Caches and encrypted regional `.cry` files.
- [BagIt, RFC 8493](https://www.rfc-editor.org/rfc/rfc8493.html) — BagIt package structure and manifests.
- [National Archives of Australia Digital Preservation Policy](https://www.naa.gov.au/about-us/who-we-are/accountability-and-reporting/archival-policy-and-planning/digital-preservation-policy) — preservation of content, associated metadata, and documentation of preservation actions.
