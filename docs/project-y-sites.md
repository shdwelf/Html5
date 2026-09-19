# Project Y — three historical site exhibits

Research checked: **14 September 2026**.

Open `los-alamos.html#sites`. The exhibit covers **Los Alamos**, **Hanford Site** (Washington; spelling corrected from “Handford”), and **Trinity Test Site** (New Mexico). These are three selected locations, not every Manhattan Project site. The badge collection remains specifically a Los Alamos collection; site history does not establish individual badge holders’ travel or assignments.

## 1. Los Alamos — research and development

Los Alamos was established as Project Y in 1943 and brought together the Manhattan Project’s scientific and weapon-development work. LANL’s institutional history describes this wartime origin. [1](https://www.lanl.gov/media/publications/national-security-science/0423-los-alamos-national-laboratory)

The NPS account explains that creation of the laboratory displaced Pueblo people and Anglo and Hispanic homesteaders, and repurposed the Los Alamos Ranch School. The exhibit does not describe the site as previously uninhabited. [2](https://www.nps.gov/articles/000/-h-our-history-lesson-the-development-of-the-manhattan-project-in-los-alamos-county-new-mexico-wwii-heritage-city.htm)

**Model:** a symbolic mesa with representative technical, residential, and community blocks. These are not individually identified historic buildings. No footprint, street, terrain elevation, or placement was derived from a survey. It is an interpretive town vignette, not the modern laboratory or an authenticated 1943 plan.

## 2. Hanford — plutonium production

The NPS identifies B Reactor as the world’s first full-scale nuclear-production reactor. Construction began in October 1943; criticality was achieved on **September 26, 1944**. The plutonium-production history connects Hanford with both Trinity and the bomb used at Nagasaki. [3](https://www.nps.gov/articles/000/hanford-b-reactor-panoramic-tour.htm)

DOE’s historical overview places the wartime B, D, and F reactors along the Columbia River. This exhibit focuses only on a representative **B Reactor exterior**, not all reactor areas or the entire reservation. [4](https://www.energy.gov/management/b-reactor)

Nuclear Princeton documents the forced removal of Indigenous and non-Indigenous residents and the relationships of the Wanapum, Yakama, Umatilla, and Nez Perce peoples to the land. This context is included alongside the industrial history. [5](https://nuclearprinceton.princeton.edu/hanford-site)

**Model:** a generic reactor-building mass, annex, stack, support building, road, and river strip. Exterior proportions, dimensions, placement, and river course are invented. No core, fuel, cooling circuit, separation equipment, interior, operating controls, or present-day infrastructure is modeled. It must not be used as a facility blueprint or navigation aid.

## 3. Trinity — the first nuclear test

DOE dates the first nuclear explosion to **July 16, 1945**, on the Alamogordo Bombing Range in the Jornada del Muerto. Its account gives a **100-foot tower** and places the McDonald ranch house about **two miles south** of ground zero. [6](https://www.energy.gov/lm/trinity-site-worlds-first-nuclear-explosion)

The exhibit uses the date but avoids false precision about detonation time or yield. Sources may use rounded times and differing yield estimates. No time/energy simulation is implemented.

The National Cancer Institute’s community summary describes fallout-exposure reconstruction, projected health consequences, and substantial uncertainty. These are population-level projections, not a basis for diagnosing any individual. The exhibit links to that research rather than reducing Trinity to an isolated technical spectacle. [7](https://dceg.cancer.gov/research/how-we-study/exposure-assessment/trinity/community-summary)

**Model:** a symbolic pre-test tower and terrain, with a separately interpreted ranch-house block. The tower is 30.48 nominal metre-units high, corresponding to the sourced 100-foot height. All other dimensions—including platform, leg spacing, bracing, ranch-house form, and ground plane—are illustrative. The ranch house is compressed into a **displaced inset**, not located at its real separation from the tower. The ground-zero tile is an editorial marker, not a historical foundation, fallout boundary, crater, or the later obelisk. There is no device, internal assembly, blast animation, dose model, or fallout model.

## Three.js and VRML implementation

- Viewer: existing locally vendored **Three.js r170** and `OrbitControls.js`; no CDN or new production dependency.
- Shared model data: `js/project-y-sites-data.js` contains interpretive box/beam primitives and research metadata.
- Display: `js/project-y-sites.js` builds a Three.js mesh for each primitive. Rendering occurs on view changes, rather than in a perpetual animation loop. WebGL initialization is deferred until the section is near the viewport.
- Controls: orbit, pan, zoom, reset, top view, rotation buttons, and wireframe. Buttons provide an alternative to mouse/touch gestures.
- Accessibility/failure mode: historical descriptions, sources, and download links remain available without WebGL. All three files are also directly linked in the HTML for users without JavaScript.
- Exports: `models/project-y/los-alamos.wrl`, `hanford.wrl`, and `trinity.wrl` are **VRML 2.0 UTF-8** scenes using `Transform`, `Shape`, `Box`, `Appearance`, `Material`, `Viewpoint`, and lighting nodes. Source links and model caveats travel with the files in `WorldInfo`.
- VRML matches the solid exterior model. Wireframe is a browser-view option, not a different export. Historical notes and landmark descriptions appear in HTML; they are not 3D text labels.
- These `.wrl` files are intended for a separate VRML-compatible viewer. This is not an immersive WebXR headset mode, VRML importer, or VRML browser plugin.

### Regenerate models

```sh
node scripts/build-project-y-models.mjs
```

### Validate

```sh
node --test tests/los-alamos.test.mjs tests/project-y-sites.test.mjs
python scripts/serve-los-alamos.py
# In another terminal, with optional browser-test packages installed:
node tests/project-y-sites-browser.mjs
```

The data tests verify valid finite primitive transforms, citation metadata, geometry-count parity, exact agreement between generated and committed VRML, and explicit Trinity placement limits. Browser tests exercise real Chromium/SwiftShader rendering, site switches, view controls, downloadable file responses, mobile overflow, and simulated WebGL failure. They do not certify historical survey accuracy or compatibility with every third-party VRML viewer.

## Next research priorities

1. Obtain properly licensed, dated exterior photographs or plans before replacing symbolic blocks with historically identified building forms.
2. Verify building identifiers, dates, and provenance separately for each site; do not import contemporary geometry into a wartime scene without labeling it.
3. Add Oak Ridge as a distinct, sourced exhibit if expanding beyond these requested locations.
4. Continue the badge-research queue with Eldred Nelson and Mary Frankel; do not fabricate Hanford or Trinity badge records from Los Alamos photographs.
