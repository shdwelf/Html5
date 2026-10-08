/**
 * INGRESS INTEL 4Dwm — checks.
 *
 *   node --test tests/ingress-intel.test.mjs
 *
 * The wire readers, the tile physics, the generator and the packaging contract.
 * The network rungs are deliberately not exercised: this app's honest claim is
 * that it *tries* and reports what came back, which a sandbox without a route to
 * ingress.com cannot assert either way. What is pinned here is everything that
 * must stay true regardless of what answered — decoding, determinism, provenance
 * strings, and the DOM id contract the shell and the module share.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (rel) => readFileSync(path.join(root, rel), "utf8");

const {
  classifyFailure,
  buildIntelPermalink,
  parseIntelPermalink,
  pointToTileId,
  readIntel,
  parseCSV,
  parseGeoJSON,
  parseGetEntities,
  parsePlexts,
  parsePortalDetails,
  scoreFrame,
  teamOf,
  tileKeysForBBox,
  tileParams,
  tileToLng,
  lngToTile,
  tileToLat,
  latToTile,
  toCSV,
  toGeoJSON,
} = await import("../js/ingress-intel-proto.js");

const { buildSimFrame, mulberry32, SIM_NOTICE } = await import("../js/ingress-intel-sim.js");
const { LADDER, REFRESH, RULES, FACTIONS } = await import("../js/ingress-intel-data.js");
const { geodesicPath, subdivideTriangle, subsolarPoint } = await import("../js/ingress-intel-globe.js");

/* --------------------------------------------------- the shapes on the wire */

/** Current array wire format, transcribed from IITC-CE core/code/* + json_examples. */
function currentGetEntities() {
  const portalArr = (team, latE6, lngE6, level, health, resCount, title) => [
    "p", team, latE6, lngE6, level, health, resCount, "https://lh3.googleusercontent.com/img",
    title, null, null, null, null, 1714000000000,
    [{ owner: "agent", name: "Shockron", rarity: "rare", stats: null }],
    [[null, level, level * 1000], [null, level, level * 900]],
    "agent",
    null,
    3, // history bitfield: visited + captured
  ];
  return {
    result: {
      timestamp: 1714000000000,
      map: {
        "12_1298_1586_6_8_100": {
          deletedGameEntityGuids: ["deadbeef00000000000000000000dead.b"],
          gameEntities: [
            ["aaaa1111222233334444555566667777.16", 1714000000000, portalArr("R", 34052233, -118243685, 7, 88, 8, "Pike & 7th")],
            ["bbbb1111222233334444555566667777.16", 1714000000001, portalArr("E", 34061111, -118252222, 5, 41, 6, "Echo Park Lake")],
            [
              "cccc1111222233334444555566667777.b",
              1714000000002,
              ["l", "R", "aaaa1111222233334444555566667777.16", 34052233, -118243685, "bbbb1111222233334444555566667777.16", 34061111, -118252222],
            ],
            [
              "dddd1111222233334444555566667777.c",
              1714000000003,
              [
                "c",
                "R",
                [
                  ["aaaa1111222233334444555566667777.16", 34052233, -118243685],
                  ["bbbb1111222233334444555566667777.16", 34061111, -118252222],
                  ["eeee1111222233334444555566667777.16", 34070000, -118240000],
                ],
              ],
            ],
          ],
        },
      },
    },
  };
}

test("current array format decodes into a frame", () => {
  const frame = parseGetEntities(currentGetEntities());
  assert.equal(frame.portals.length, 2);
  assert.equal(frame.links.length, 1);
  assert.equal(frame.fields.length, 1);
  assert.equal(frame.deleted.length, 1);

  const [a, b] = frame.portals;
  assert.equal(a.title, "Pike & 7th");
  assert.equal(a.team, "RES");
  assert.equal(a.color, FACTIONS[1].color);
  assert.ok(Math.abs(a.lat - 34.052233) < 1e-6, "E6 → degrees");
  assert.ok(Math.abs(a.lon + 118.243685) < 1e-6);
  assert.equal(a.level, 7);
  assert.equal(a.health, 88);
  assert.equal(a.resonators.length, 2);
  assert.equal(a.mu, 14, "MU = sum of resonator levels");
  assert.equal(a.tier, "official");
  assert.match(a.provenance, /getEntities portal entity/);
  assert.equal(a.history.captured, true);
  assert.equal(a.history.visited, true);

  assert.equal(frame.links[0].team, "RES");
  assert.ok(frame.links[0].lengthKm > 0.5 && frame.links[0].lengthKm < 3, "link length from the two ends");
  assert.equal(frame.fields[0].corners.length, 3);
});

test("tombstoned guids are dropped, not drawn", () => {
  const payload = currentGetEntities();
  payload.result.map["12_1298_1586_6_8_100"].gameEntities[0][0] = "deadbeef00000000000000000000dead.b";
  const frame = parseGetEntities(payload);
  assert.equal(frame.portals.length, 1);
  assert.ok(!frame.portals.some((p) => p.title === "Pike & 7th"));
});

test("the 2013 object form and the keyed gameEntities form both read", () => {
  const legacy = {
    result: {
      map: {
        "1_32742_21790": {
          gameEntities: [
            ["51502606f12c4eaebef135ac5e48c751.16", 1385766074861, {
              level: 6, title: "Regent Arcade House", image: "http://lh4.ggpht.com/x", resCount: 8,
              latE6: 51514835, health: 85, team: "RESISTANCE", lngE6: -141049, type: "portal",
            }],
          ],
        },
      },
    },
  };
  const frame = parseGetEntities(legacy);
  assert.equal(frame.portals.length, 1);
  assert.equal(frame.portals[0].team, "RES");
  assert.equal(frame.portals[0].title, "Regent Arcade House");

  const keyed = {
    result: {
      map: {
        "9_1_2": {
          gameEntities: {
            "guid-1.16": [1714000000000, "PORTAL", ["p", "E", 34000000, -118000000, 3, 50, 4, "", "Keyed form", null, null, null, null, 1714000000000, [], [], null, null, 0]],
          },
        },
      },
    },
  };
  const f2 = parseGetEntities(keyed);
  assert.equal(f2.portals.length, 1);
  assert.equal(f2.portals[0].team, "ENL");
  assert.equal(f2.portals[0].title, "Keyed form");
});

test("team tokens keep their raw form and flag the legacy collision", () => {
  assert.equal(teamOf("R").key, "RES");
  assert.equal(teamOf("E").key, "ENL");
  assert.equal(teamOf("RESISTANCE").key, "RES");
  assert.equal(teamOf(2).key, "ENL");
  assert.equal(teamOf("").key, "NEU");
  assert.equal(teamOf("M").key, "MAC", "modern M is MACHINA");
  assert.equal(teamOf("M").ambiguous, true, "…but legacy M meant Matter/Resistance, so it is flagged");
  assert.equal(teamOf("L").key, "NEU", "legacy L is 'locked', not a faction");
  assert.equal(teamOf("L").ambiguous, true);
});

test("portal details fold a dossier onto a record", () => {
  const rec = parsePortalDetails({
    resonatorArray: { resonators: [{ slot: 0, level: 8, energyTotal: 8000, ownerGuid: "agent.one" }, { slot: 1, level: 7, energyTotal: 7000, ownerGuid: "agent.two" }] },
    locationE6: { latE6: 34052233, lngE6: -118243685 },
    controllingTeam: { team: "ENLIGHTENED" },
    portalV2: { linkedEdges: [{ otherPortalGuid: "x.16", length: 1234500 }] },
    title: "Angels Flight",
    guid: "0f0f.16",
  });
  assert.equal(rec.team, "ENL");
  assert.equal(rec.lat.toFixed(6), "34.052233");
  assert.equal(rec.level, 8);
  assert.equal(rec.resonators.length, 2);
  assert.equal(rec.mu, 15);
  assert.equal(rec.links.length, 1);
  assert.equal(rec.links[0].lengthKm, 1234.5, "linkedEdges[].length is metres, so 1 234 500 → 1234.5 km");
});

test("plexts decode with their geo tag", () => {
  const frame = parsePlexts({
    result: {
      plexts: [
        { timestamp: 1, plext: { ownerName: "agent.one", team: "RESISTANCE", latE6: 34050000, lngE6: -118240000, messageData: { autoPlext: { plextMessage: "linked to" }, portal: { title: "Pike & 7th" } } } },
        { timestamp: 2, plext: { ownerName: "agent.two", team: "ENLIGHTENED", messageData: { autoPlext: { plextMessage: "captured" } } } },
      ],
    },
  });
  assert.equal(frame.plexts.length, 2);
  assert.equal(frame.plexts[0].geo, true);
  assert.equal(frame.plexts[1].geo, false, "no coordinates ⇒ not drawn as a marker");
  assert.equal(frame.plexts[0].text, "linked to · Pike & 7th");
});

test("malformed entities are skipped with a warning, never guessed at", () => {
  const bad = { result: { map: { "1_1_1": { gameEntities: [["g.16", 1, ["p", "R", null, undefined, 3, 50, 3]], ["g2.16", 1, ["l", "R", null, 1, 2]]] } } } };
  const frame = parseGetEntities(bad);
  assert.equal(frame.portals.length, 0);
  assert.equal(frame.links.length, 0);
  assert.equal(frame.warnings.length, 2);
  assert.match(frame.warnings[0], /unusable coordinates/);
});

/* -------------------------------------------------------------- importers */

test("geojson import reads points, lines and polygons", () => {
  const gj = JSON.stringify({
    type: "FeatureCollection",
    features: [
      { type: "Feature", geometry: { type: "Point", coordinates: [-118.24, 34.05] }, properties: { name: "A", team: "RESISTANCE", level: 6 } },
      { type: "Feature", geometry: { type: "LineString", coordinates: [[-118.24, 34.05], [-118.25, 34.06]] }, properties: { team: "R" } },
      { type: "Feature", geometry: { type: "Polygon", coordinates: [[[-118.2, 34.0], [-118.21, 34.0], [-118.205, 34.01], [-118.2, 34.0]]] }, properties: { team: "ENLIGHTENED", mu: 40 } },
    ],
  });
  const frame = parseGeoJSON(gj);
  assert.equal(frame.portals.length, 1);
  assert.equal(frame.links.length, 1);
  assert.equal(frame.fields.length, 1);
  assert.equal(frame.portals[0].team, "RES");
  assert.equal(frame.portals[0].tier, "community", "imported data is community-tier even if it came from the game");
});

test("csv import is header-driven and quotes survive", () => {
  const csv = [
    "name,lat,lon,team,level",
    '"Union Station, Los Angeles",34.056146,-118.236533,RES,8',
    "Bradbury Building,34.050632,-118.246942,ENL,6",
    "broken row,notanumber,12,RES,3",
  ].join("\n");
  const frame = parseCSV(csv);
  assert.equal(frame.portals.length, 2);
  assert.equal(frame.portals[0].title, "Union Station, Los Angeles");
  assert.equal(frame.warnings.length, 1);
  assert.match(frame.warnings[0], /row 3/);
});

test("readIntel sniffs permalink, entities, geojson and csv", () => {
  assert.equal(readIntel("https://www.ingress.com/intel?ll=34.05,-118.24&z=13&pll=34.0503,-118.2437").kind, "permalink");
  assert.equal(readIntel(JSON.stringify(currentGetEntities())).kind, "entities");
  assert.equal(readIntel(JSON.stringify({ type: "FeatureCollection", features: [] })).kind, "geojson");
  assert.equal(readIntel("name,lat,lon\nA,1,2").kind, "csv");
  assert.equal(readIntel("").kind, "empty");
  assert.equal(readIntel("not a thing at all").kind, "unknown");
  assert.equal(readIntel("{oops").kind, "json-error");
});

test("csv export round-trips through the csv reader", () => {
  const frame = parseGetEntities(currentGetEntities());
  const csv = toCSV(frame);
  assert.ok(csv.startsWith("guid,name,lat,lon,team,level,health,resCount,mu,lengthKm,kind,provenance\n"), "the header is the contract");
  assert.equal(csv.trim().split("\n").length, 5, "header + 2 portals + 1 link + 1 field, all four in the file");
  const reread = parseCSV(csv);
  assert.equal(reread.portals.length, 2, "the portals survive the round trip");
  assert.match(reread.warnings.join(" "), /2 row\(s\) tagged as links or fields were skipped/, "and the geometry rows are counted, not flattened into points");
  assert.equal(reread.portals[0].lat.toFixed(6), frame.portals[0].lat.toFixed(6), "six decimal places is all the E6 grid was worth anyway");
  const gj = JSON.parse(toGeoJSON(frame));
  assert.equal(gj.features.length, 4, "2 portals + 1 link + 1 field, all four as geometry");
  for (const f of gj.features) assert.equal(f.properties.tier, "official", "the evidence tier travels with every kind of geometry");
  assert.match(gj.features[0].properties.provenance, /getEntities/);
});

/* --------------------------------------------------------------- tile math */

test("tile physics match the reference client", () => {
  const p = tileParams(12);
  assert.equal(p.tilesPerEdge, 8000, "zoom 12 → 8000 tiles per global edge");
  assert.equal(p.level, 3, "portal levels below 3 are hidden at this data zoom");
  assert.equal(p.minLinkKm, 0.3, "links shorter than 300 m are not returned");
  assert.equal(tileParams(3).hasPortals, false, "no portals below the link-length cutoff");

  const key = pointToTileId(p, 1999, 1585);
  assert.equal(key, "12_1999_1585_3_8_100", "zoom_x_y_level_8_100 as the stock client sends it");
  assert.equal(pointToTileId(p, 1999, 1585, { extended: false }), "12_1999_1585");

  // A wrap-around x must land in the same tile as the un-wrapped one.
  assert.equal(pointToTileId(p, 1999 + p.tilesPerEdge, 1585, { extended: false }), "12_1999_1585");
});

test("lng/lat ↔ tile round-trips", () => {
  const p = tileParams(14);
  const x = lngToTile(-118.2437, p);
  const y = latToTile(34.0522, p);
  assert.ok(tileToLng(x, p) <= -118.2437 && tileToLng(x + 1, p) > -118.2437);
  assert.ok(tileToLat(y, p) >= 34.0522 && tileToLat(y + 1, p) < 34.0522);
});

test("tileKeysForBBox is centre-out and bounded", () => {
  const bbox = { lon0: -118.85, lon1: -117.85, lat0: 33.62, lat1: 34.55 };
  const keys = tileKeysForBBox(bbox, 12, { limit: 120 });
  assert.ok(keys.length >= 4 && keys.length <= 120);
  assert.ok(keys.every((k) => /^12_\d+_\d+$/.test(k)));
  const limited = tileKeysForBBox(bbox, 12, { limit: 3 });
  assert.equal(limited.length, 3);
  assert.deepEqual(limited, keys.slice(0, 3), "the limit keeps the tiles nearest the view centre");
});

/* --------------------------------------------------------- intel permalinks */

test("intel permalink parses the four parameters that matter", () => {
  const l = parseIntelPermalink("https://intel.ingress.com/intel?ll=34.050030,-118.243680&z=17&pll=34.050300,-118.243700&pguid=abc123.16");
  assert.equal(l.ok, true);
  assert.equal(l.lat.toFixed(5), "34.05003");
  assert.equal(l.lon.toFixed(5), "-118.24368");
  assert.equal(l.zoom, 17);
  assert.equal(l.pguid, "abc123.16");
  assert.equal(l.isIntelOrigin, true);
  assert.equal(l.origin, "https://intel.ingress.com");

  const built = buildIntelPermalink({ lat: 34.05003, lon: -118.24368, zoom: 17, portalLat: 34.0503, portalLon: -118.2437, pguid: "abc123.16" });
  assert.equal(parseIntelPermalink(built).pguid, "abc123.16");
  assert.match(built, /^https:\/\/intel\.ingress\.com\/intel\?ll=34\.050030,-118\.243680/);
});

/* -------------------------------------------------------------- failure map */

test("failure triage separates what an agent can fix from what they cannot", () => {
  assert.equal(classifyFailure(new TypeError("Failed to fetch")).cls, "CORS_OR_NET");
  assert.equal(classifyFailure(new Error("This operation has been aborted due to timeout")).cls, "TIMEOUT");
  assert.equal(classifyFailure(null, { status: 401 }).cls, "AUTH");
  assert.equal(classifyFailure(null, { status: 403 }).cls, "AUTH");
  assert.equal(classifyFailure(null, { status: 404 }).cls, "PATH");
  assert.equal(classifyFailure(null, { status: 429 }).cls, "RATE");
  assert.equal(classifyFailure(null, { status: 502 }).cls, "UPSTREAM");
  assert.match(classifyFailure(new TypeError("Failed to fetch")).fix, /Access-Control-Allow-Origin/);
  assert.match(classifyFailure(null, { status: 401 }).fix, /intel\.ingress\.com/);
});

/* ---------------------------------------------------------------- the sim */

const LA = { lon0: -118.85, lon1: -117.85, lat0: 33.62, lat1: 34.55 };

test("the offline register is deterministic per (seed, bbox) and varies across seeds", () => {
  const a = buildSimFrame({ bbox: LA, seed: "socal-gaz" });
  const b = buildSimFrame({ bbox: LA, seed: "socal-gaz" });
  const c = buildSimFrame({ bbox: LA, seed: "other-seed" });
  assert.ok(a.portals.length > 5, "the LA plate must have something to draw");
  assert.deepEqual(JSON.parse(JSON.stringify(a.portals)), JSON.parse(JSON.stringify(b.portals)));
  assert.notDeepEqual(JSON.parse(JSON.stringify(a.portals.map((p) => p.team))), JSON.parse(JSON.stringify(c.portals.map((p) => p.team))), "a different seed is a different network");
  assert.equal(mulberry32(1)(), mulberry32(1)(), "the PRNG is a pure function of its seed");
});

test("every simulated record says it was simulated", () => {
  const f = buildSimFrame({ bbox: LA });
  assert.equal(f.source, "sim");
  assert.equal(f.sim, true);
  assert.match(f.warnings.join(" "), /SIM — synthetic/);
  const all = [...f.portals, ...f.links, ...f.fields, ...f.plexts];
  assert.ok(all.length > 10);
  for (const r of all) {
    assert.equal(r.tier, "context", `${r.kind} must not claim a stronger tier`);
    assert.match(r.provenance, /sim ·/, `${r.kind} provenance names its generator`);
  }
  assert.match(SIM_NOTICE, /No Niantic data, no game state/);
});

test("the simulation obeys the published rules it claims to", () => {
  const f = buildSimFrame({ bbox: LA });
  const linkMax = RULES.find((r) => r.key === "linkMaxKm").value;
  for (const l of f.links) assert.ok(l.lengthKm <= linkMax + 1e-6, `link of ${l.lengthKm} km exceeds the ${linkMax} km base limit`);
  for (const p of f.portals) {
    if (p.team === "NEU") { assert.equal(p.level, 0); continue; }
    assert.ok(p.level >= 1 && p.level <= 8);
    assert.ok(p.resonators.length <= 8);
    for (const r of p.resonators) assert.ok(r.level <= p.level, "no resonator above the portal level");
  }
  // Fields must be closed triangles of real generated links.
  const pairSet = new Set(f.links.map((l) => [l.oGuid, l.dGuid].sort().join("|")));
  for (const fd of f.fields) {
    const g = fd.corners.map((c) => c.guid).sort();
    for (const pair of [[0, 1], [0, 2], [1, 2]]) assert.ok(pairSet.has([g[pair[0]], g[pair[1]]].sort().join("|")), "field edge was not linked");
    const mu = Math.min(...fd.corners.map((c) => f.portals.find((p) => p.guid === c.guid)?.mu ?? 0));
    assert.equal(fd.mu, mu, "field MU = weakest corner");
  }
});

test("an empty bbox yields an empty frame and an explanation, not a lie", () => {
  const f = buildSimFrame({ bbox: { lon0: 10, lon1: 11, lat0: 40, lat1: 41 } });
  assert.equal(f.portals.length, 0);
  assert.match(f.warnings.join(" "), /covers|register|bbox/);
});

test("scores come out of the frame, not a scoreboard", () => {
  const f = buildSimFrame({ bbox: LA });
  const s = scoreFrame(f);
  const total = Object.values(s.per).reduce((acc, t) => acc + t.mu, 0);
  assert.ok(total > 0);
  assert.equal(s.portals, f.portals.length);
  for (const t of Object.values(s.per)) assert.ok(t.mu >= 0);
});

/* ------------------------------------------------- geodesics + solar math */

test("great-circle paths and spherical subdivision produce usable geometry", () => {
  const p = geodesicPath({ lon: -118.24, lat: 34.05 }, { lon: -117.15, lat: 33.45 }, 24);
  assert.equal(p.length, 25);
  assert.ok(Math.abs(p[0].lat - 34.05) < 1e-9);
  // The midpoint of a great circle must sit *north* of the rhumb-line midpoint
  // here, which is the whole reason LA→Palm routes bow upward on the intel map.
  const mid = p[12];
  assert.ok(mid.lat > (34.05 + 33.45) / 2);

  const tri = subdivideTriangle([{ lat: 0, lon: 0 }, { lat: 10, lon: 0 }, { lat: 0, lon: 10 }], 4, (lon, lat) => [lon, lat, 0]);
  assert.equal(tri.length % 9, 0, "flat triples");
  assert.ok(tri.length / 9 >= 16, "tessellated at least as finely as requested");
});

test("the subsolar point tracks UTC", () => {
  const noon = subsolarPoint(new Date(Date.UTC(2026, 5, 21, 12, 0, 0)));
  assert.ok(noon.lat > 22 && noon.lat < 24, "June solstice declination ≈ +23.4°");
  assert.ok(Math.abs(noon.lon) < 3, "subsolar longitude is near the prime meridian at 12Z");
  const midnight = subsolarPoint(new Date(Date.UTC(2026, 11, 21, 0, 0, 0)));
  assert.ok(midnight.lat < -22, "December declination is negative");
});

/* ------------------------------------------- the ladder: what it promises */

test("the ladder documents every rung it will attempt, and never claims a silent success", () => {
  assert.ok(LADDER.length >= 6);
  assert.deepEqual(LADDER.map((r) => r.id), ["sameorigin", "relay", "proxy", "capture", "peer", "sim"]);
  for (const r of LADDER) {
    assert.ok(r.name && r.summary && r.requires, `${r.id} needs a name, a summary and a requirement`);
    assert.ok(["official", "community", "context"].includes(r.tier), `${r.id} carries an evidence tier`);
    assert.ok(Array.isArray(r.docs) && r.docs.length, `${r.id} cites where its contract is documented`);
  }
  const probes = LADDER.filter((r) => r.probe).map((r) => r.id);
  assert.deepEqual(probes, ["sameorigin", "relay", "proxy"], "the three network rungs are the ones actually attempted");
  assert.equal(LADDER[2].id, "proxy", "the GET-only rung is documented as incapable of a credentialed POST");
});

test("politeness constants match the reference client's manners", () => {
  assert.equal(REFRESH.MAX_REQUESTS, 6);
  assert.ok(REFRESH.MOVE_DELAY_S <= 1, "no fetch storm on every pan");
  assert.ok(REFRESH.TILE_TTL_S >= 300, "tiles are held long enough to be useful, short enough to be current");
  assert.ok(REFRESH.REFRESH_S >= 30, "the ring must not hammer the API");
});

/* -------------------------------------------------- packaging + DOM contract */

test("the shell and the module agree on every element id", () => {
  const html = read("ingress-intel.html");
  const js = read("js/ingress-intel.js");
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const used = [...js.matchAll(/\$\("([a-zA-Z0-9_-]+)"\)/g)].map((m) => m[1]);
  assert.ok(used.length > 30, "the viewer wires a real number of controls");
  const missing = [...new Set(used)].filter((id) => !ids.has(id));
  assert.deepEqual(missing, [], `elements referenced by the module but absent from the shell: ${missing.join(", ")}`);
});

test("the app is offline-clean: no remote tags, no CDN imports", () => {
  const html = read("ingress-intel.html");
  const css = read("css/ingress-intel.css");
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:/i);
  assert.doesNotMatch(css, /url\(["']?https?:/i);
  for (const rel of ["js/ingress-intel.js", "js/ingress-intel-proto.js", "js/ingress-intel-feed.js", "js/ingress-intel-sim.js", "js/ingress-intel-globe.js", "js/ingress-intel-data.js", "css/ingress-intel.css", "scripts/build-ingress-intel-xdc.mjs"]) {
    assert.ok(existsSync(path.join(root, rel)), `${rel} missing`);
  }
});

test("no module in the app reaches for a credential store", () => {
  for (const rel of ["js/ingress-intel.js", "js/ingress-intel-feed.js", "js/ingress-intel-proto.js"]) {
    const src = read(rel);
    // localStorage holds the relay *URL* and display settings; a cookie, a token
    // or a password must never be persisted by this app.
    assert.doesNotMatch(src, /document\.cookie\s*=/, `${rel} must not write cookies`);
    assert.doesNotMatch(src, /localStorage\.setItem\([^)]*(token|cookie|password)/i, `${rel} must not persist credentials`);
  }
  const feed = read("js/ingress-intel-feed.js");
  assert.match(feed, /sessionStorage\.setItem\("ingress-intel\.key"/, "the relay key is session-only, by construction");
  assert.match(feed, /const { relayKey, \.\.\.rest } = cfg;/, "and it is stripped before anything is persisted");
});

test("package.json and the hub page both know about the app", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["build:ingress-intel"], "node scripts/build-ingress-intel-xdc.mjs");
  assert.match(pkg.scripts["build:4dwm"], /build-ingress-intel-xdc\.mjs/);
  assert.match(read("index.html"), /href="\.\/ingress-intel\.html"/);
});
