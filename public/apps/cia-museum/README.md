# CIA Museum · Interactive VRML Campus

A dependency-free HTML5 museum experience built from local, human-readable VRML97 models.

## Open

Serve the repository and visit `/apps/cia-museum/` (for example with `npm run dev`). VRML files are fetched locally, so opening `index.html` directly from `file://` is not supported by all browsers.

## Included

- `models/campus.wrl` — conceptual Old/New Headquarters massing, a transparent museum study pavilion with eleven exhibit bays, paths, water, planting, Kryptos, A-12, U-2, Berlin Wall segments, memorial elements and landscape details.
- `models/exhibits/*.wrl` — distinct models for all **11 exhibits** listed in the CIA's official online exhibit index.
- `models/grounds/*.wrl` — eight focused Headquarters landmark models.
- `models/field-sites/*.wrl` — three focused, off-campus context studies: Camp Peary, Canadian Camp X / STS 103, and the repository's St. Croix Site-X identity.
- `vrml-engine.js` — local WebGL renderer and a VRML97 subset parser supporting `DEF`/`USE`, `Transform`, `Group`, `Shape`, `Appearance`, `Material`, `Box`, `Cylinder`, `Cone`, and `Sphere`.
- Two simultaneous viewers: the campus context and a focused exhibit/object/site-study viewer.
- Search, camera presets, projected hotspots, source inspection/download, responsive layouts, keyboard controls and a six-stop guided tour.

## Sources and scope

The exhibit list follows the official [CIA Museum exhibit index](https://www.cia.gov/legacy/museum/exhibits/). Each record in the app links to its corresponding CIA page. The physical museum is inside CIA Headquarters and is not open to the general public.

The off-campus studies deliberately separate three names that can otherwise be confused:

- **Camp Peary** (often misspelled “Camp Perry”) is the restricted Virginia installation officially identified as the Armed Forces Experimental Training Activity. Its military history is documented; descriptions of CIA training and the nickname “The Farm” are presented as widespread journalistic/former-officer attribution rather than an official account of current activity. A CIA-hosted declassified history and historical reporting inform the interpretation.
- **Camp X** was British Special Training School No. 103 on Lake Ontario. The CIA-hosted history [*OSS Training During World War II*](https://www.cia.gov/resources/csi/static/OSS-Training-During-WWII.pdf) records early-1942 attendance by American SO/SI instructors. [Historica Canada](http://education.historicacanada.ca/en/tools/126), [Canada's History](https://www.canadashistory.ca/explore/military-war/spy-school-secrets), and the [Intrepid Society](https://intrepid-society.org/camp-x/) provide Canadian historical context for STS 103, Hydra, and the present memorial landscape.
- **Site-X · St. Croix** is a repository-specific identity documented by `/img/site-x-badge.png`, `/js/stx-geo.js`, and `/js/stx-nodes.js`. The local evidence does **not** establish a CIA facility. It is also not Camp X and not Oak Ridge, Tennessee, which other repository material calls “Site X” in Manhattan Project context.

The field studies are not placed on the Langley campus model. Their individual VRML scenes are conceptual historical/data tableaux, not site surveys or reconstructions. That separation avoids falsely implying that geographically distinct places are Headquarters installations.

This is an independent public-source educational visualization, not an architectural, operational, or security survey. Building massing, exhibit placement, paths, landscape, object geometry, dimensions and relative distances are interpretive and intentionally unsuitable for navigation. It is not affiliated with or endorsed by the Central Intelligence Agency.

## Spycraft research

Related research into Activision's 1996 *Spycraft: The Great Game* demo is documented in `/docs/spycraft-research.md`. Its reproducible GitHub Actions workflow uses an exact archive hash gate and Ghidra static analysis; it never launches the installer or game and never commits the copyrighted demo binaries.

## Test

```bash
node --test tests/cia-museum.test.mjs
```
