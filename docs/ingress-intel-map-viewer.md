# INGRESS INTEL 4Dwm — the map viewer

A browser theater for Ingress intel traffic: portals, links, fields, mind shields,
COMMS and control fields, drawn twice over — a planet globe with geodesic arcs and
a real day/night terminator, and a Los Angeles basin plate that reuses this repo's
SoCal projection, relief field and optional 3DEP grid.

- App shell: `ingress-intel.html`
- Viewer: `js/ingress-intel.js`
- Data pack (factions, layers, rules, the ladder, endpoints): `js/ingress-intel-data.js`
- Wire readers / writers (no `fetch`, no DOM): `js/ingress-intel-proto.js`
- The connection ladder + relay client: `js/ingress-intel-feed.js`
- Offline register (the SIM generator): `js/ingress-intel-sim.js`
- Globe math (geodesics, spherical triangles, subsolar point): `js/ingress-intel-globe.js`
- Styles: `css/ingress-intel.css`
- Webxdc build: `node scripts/build-ingress-intel-xdc.mjs` → `ingress-intel.xdc`
- Tests: `node --test tests/ingress-intel.test.mjs`, `node tests/ingress-intel-browser.mjs`
- Connection research + the relay contract: `docs/ingress-intel-connector-research-2026-10-07.md`

## The premise, stated plainly

There is **no public Ingress Intel API**. `/r/getEntities` is a same-origin,
session-cookie, CSRF-guarded endpoint that belongs to the intel map page, and a
browser will not attach another origin's cookies to a cross-origin `POST` no matter
what the page asks for. So this app does not pretend to "connect to Ingress". It
walks a six-rung ladder, prints a verdict for each rung, and draws whatever
survives. What is drawn is always labelled with where it came from:

| Rung | What it is | Verdict the panel shows |
| --- | --- | --- |
| `sameorigin` | The page is being served from `intel.ingress.com`, so `/r/getEntities` is same-origin and the session cookie applies. Only true if you run this file from that origin. | the origin it was loaded from, and the real HTTP/`TypeError` outcome of a live `?ping=1` probe |
| `relay` | A base you run that forwards to the intel map with a session it owns. `GET <base>/getEntities?tileKeys=…` plus `X-Intel-Key`. | `/status` handshake, then a real tile request; a live `tileParams`/`version` from the relay is adopted |
| `proxy` | A public CORS proxy. Can only `GET`, so it can never carry the credentialed `POST` the intel map needs; it can fetch public permalinks and static assets. | proxy → status → bytes → first line; an HTML body is reported as the login wall it is |
| `capture` | Anything you paste or drop: a `getEntities` dump, IITC's GeoJSON/KML export, a CSV of portals, or an intel permalink. | how many records were read, and one line per skipped row |
| `peer` | webxdc broadcast — another agent's copy of this bundle inside a chat host (`PEER_TAG`), so an imported frame can be shared with no server. | whether `window.webxdc` exists |
| `sim` | The floor. A synthetic register generated over USGS GNIS coordinates from this repo's gazetteer. | portal/link/field counts, and that they are synthetic |

A synthetic frame is never presented as game state: the watermark says `SIM`, every
record carries `tier: "context"` and a provenance string naming its generator, the
dossier repeats it, and `SIM_NOTICE` is printed in the FEED panel. Merging only ever
happens **between two real frames** — a pasted payload replaces the offline register
outright, because blending synthetic substrate into an imported capture would be a
provenance lie dressed up as a picture.

## One render path

`drawFrame(frame)` is the single draw routine for live, relay, proxy, pasted, peer
and simulated frames. The only things that vary are the watermark and the
`#linkState` chip, both driven by `feed.status.live` — that is, by *connection
truth*, never by whether data happens to be present. `GET DETAILS` on a portal and
the COMMS strip (`fetchPortalDetails`, `fetchComms`) go through the same
`relayOrIntel()` helper as the tile feed, so "does the live path work?" has one
answer everywhere in the app.

## What the readers know about the wire

Encoded in `js/ingress-intel-proto.js`, transcribed from IITC-CE's
`core/code/entity_decode.js`, `map_request.js`, `map_tiles.js` and
`json_examples/` (see the research doc for the file list):

- Entities arrive as triples `[guid, timestamp, data]`, and `data[0]` is a one-letter
  type: `p` portal, `l` link, `c` control field.
- Portal array: `['p', team, latE6, lngE6, level, health, resCount, image, title,
  ornaments, mission, mission50plus, artifactBrief, timestamp, mods, resonators,
  owner, artifactDetail, history]`. `history` is a bitfield (1 visited, 2 captured,
  4 scout-controlled).
- Link: `['l', team, oGuid, oLatE6, oLngE6, dGuid, dLatE6, dLngE6]`. Length is
  computed with great-circle math, not read from the payload.
- Field: `['c', team, [[guid, latE6, lngE6] × 3]]`.
- `gameEntities` may be an array of triples **or** a `{guid: [ts, "PORTAL", data]}`
  map, and the 2013 legacy payload carried plain objects with `latE6`/`team:
  "RESISTANCE"`; all three decode.
- Tiles also carry `deletedGameEntityGuids`; a tombstone removes the entity rather
  than leaving it on screen.
- Fake field edges (`<32 hex>.b_a|b`) are neither drawn nor invented: the decoder
  counts them in `fakedLinksSkipped` and moves on. `deriveLinksFromFields` will
  therefore never synthesise a link the payload did not carry.
- Team tokens are kept as `raw` alongside a normalised key, and the two ambiguous
  letters are flagged: `M` is MACHINA today but *Matter*/Resistance in the 2013
  payload, and legacy `L` meant "locked", not a faction.
- Tile keys are `zoom_x_y_level_8_100` (`ZOOM_TO_LEVEL` / `TILES_PER_EDGE` /
  `ZOOM_TO_LINK_LENGTH` are the reference client's own tables, indexed by data zoom
  8…21). Request bodies are `{tileKeys: [...], v: <40-hex version>}`; the version is
  per-deployment, which is the whole reason a relay that can read the intel page
  should forward its live parameters, and why the FEED panel shows the request body
  instead of guessing one.

The same module writes what it reads: `toGeoJSON`, `toKML` and `toCSV` (portals as
points, links as lines, fields as polygons; CSV is portals-only by design and the
reader reports the count of geometry rows it declined to flatten).

## Geometry worth the trip

- **Geodesics, not rhumb lines.** Links are great-circle paths
  (`geodesicPath`), because that is what the intel map draws — an LA→Palm Springs
  link bows north.
- **Fields drape.** On the basin plate the triangle is subdivided and every interior
  vertex is lifted onto the relief field, so a control field reads as paint on the
  ground. On the globe the same tessellation is projected back onto the sphere.
- **Contact front.** `contactFront` extracts the RES/ENL boundary from the frame and
  draws it as its own layer, which is the one thing a faction map shows that a
  portal scatter cannot.
- **Sun.** `subsolarPoint` (NOAA two-term) drives a night cap from the terminator
  ring, so the planet view knows where it is currently local midnight.
- **MU, honestly.** Field MU is the weakest corner, per the published rule
  (`RULES[].key === "fieldMu"`); the score panel sums MU per faction *from the frame
  on screen*, with the count of unmodelled modifiers alongside — mod and amplifier
  deltas are deliberately not asserted (`RULES.modifiers === null` says so).

## Controls

Keys: `V` cycles the view (globe → LA basin → SoCal transect) · `L` labels ·
`F` fields · `N` links · `X` x-ray relief · `P` re-probe the ladder · `R` reset ·
`Esc` clears the selection. Typing in a field swallows nothing, because the handler
stands down whenever the target is an `input`, `textarea` or `select` — and Enter in
the search box runs the search instead of letting the `<form>` reload the page and
throw the frame away. Time of day for the terminator is `#timeSelect`. Sliders: relief exaggeration (writes `scale.vert`, rebuilds the plate),
link lift (a multiplier, so an arc bows the same fraction of the view on the LA
plate as on the planet), and a link-length cap that tops out at the published 160 km
base limit. Portal cores, level dials, shield bands and pick proxies are all sized as
multiples of one glyph unit derived from the stage in view — the intel map draws a
portal as a fixed *screen* icon, and absolute radii would read as boulders over a
1° bbox and as dust on the planet.
Click anything for its dossier; `GET DETAILS` inside a dossier is a live-path call,
so it fails informatively when no rung answered. `#view=&ll=&z=` in the hash
reproduces a view, and every export is a Blob download from the frame in memory.

The FEED panel's **TILES HERE** button prints the exact request for the current view
— tile keys, data zoom, tiles per edge, minimum link length, and a `curl` line for
the relay contract — without sending anything, which is what makes the offline
build useful for someone writing their own relay.

## Verification

- `node --test tests/ingress-intel.test.mjs` — 29 checks: wire decoders against
  transcribed payloads, tile physics against the reference tables, permalink
  round-trips, importer sniffing, failure triage, sim determinism (same seed + bbox
  ⇒ identical frame), the rules the sim claims to obey (160 km links, no resonator
  above portal level, fields only where all three edges exist), provenance on every
  simulated record, plus the DOM id contract between shell and module and the
  offline-clean packaging rules.
- `node tests/ingress-intel-browser.mjs [url]` — 34 checks in real Blink + SwiftShader
  (it serves the repo root itself with no argument, or drives the URL you give it —
  so `node tests/ingress-intel-browser.mjs http://127.0.0.1:5173` runs the identical
  assertions through the vite dev server, which is the only way to catch a bundler
  choking on the optional DEM import):
  the stage rasterises (`lit px` on a decoded screenshot, both views), all six ladder
  cards render, every probed rung returns a sentence and a fix, the frame stays `SIM`
  while nothing live answered, a payload typed into the import box and imported via
  the button renders through the shared path (3 portals / 2 links / 1 field,
  `source=capture`), view switching re-points the same frame instead of refetching,
  the tile request is valid JSON at one data zoom, a no-WebGL webview gets a written
  explanation instead of a black rectangle, and no console error escapes that the
  ladder does not already expect.
