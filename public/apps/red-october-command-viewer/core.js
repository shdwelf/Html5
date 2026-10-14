export const VIEWER_VERSION = "1.0.0";

/** Narrative index only; these are not recovered mission timestamps. */
export const STORY_BEATS = Object.freeze([
  Object.freeze({
    id: "patrol",
    at: 0,
    title: "Northern patrol",
    region: "Barents Sea region",
    summary: "The viewer opens in a broad northern sector. This chapter marker is an authored story index, not a recovered game coordinate or historical track.",
  }),
  Object.freeze({
    id: "departure",
    at: 0.2,
    title: "Westbound departure",
    region: "Norwegian Sea region",
    summary: "A westbound narrative stage. The route line is a schematic illustration only; no sensor observations or navigational record are represented.",
  }),
  Object.freeze({
    id: "uncertainty",
    at: 0.4,
    title: "Contact uncertainty",
    region: "North Atlantic approaches",
    summary: "The story turns on interpretation of a contact. This viewer does not simulate sonar, detection ranges, or classified procedures.",
  }),
  Object.freeze({
    id: "pursuit",
    at: 0.6,
    title: "Pursuit",
    region: "Central North Atlantic",
    summary: "A broad narrative position for the pursuit sequence. Vessel placements are illustrative and must not be read as real track data.",
  }),
  Object.freeze({
    id: "deception",
    at: 0.8,
    title: "Deception sequence",
    region: "Western Atlantic approaches",
    summary: "The chapter marker represents a plot transition, not a tactically accurate maneuver or a recovered game event log.",
  }),
  Object.freeze({
    id: "resolution",
    at: 1,
    title: "Resolution",
    region: "Western Atlantic region",
    summary: "The final marker closes this interpretive timeline. No exact destination, time, or operational track is asserted.",
  }),
]);

export const VESSELS = Object.freeze([
  Object.freeze({
    id: "red-october",
    name: "Red October",
    classLabel: "Fictional vessel · Project 941 / Typhoon-inspired",
    role: "Story vessel",
    color: "#59e0bf",
    silhouette: "broad",
    sourceNote: "Fictional vessel from a work of fiction. Display geometry is normalized and diagrammatic.",
  }),
  Object.freeze({
    id: "dallas",
    name: "USS Dallas",
    classLabel: "Story character · Los Angeles-class reference",
    role: "Story contact",
    color: "#79b9ff",
    silhouette: "slender",
    sourceNote: "A real ship name used in the story; this scene's placement is fictionalized and is not an actual patrol record.",
  }),
  Object.freeze({
    id: "akula-contact",
    name: "Akula-class contact",
    classLabel: "Generic class contact · no specific hull",
    role: "Illustrative contact",
    color: "#ffc06e",
    silhouette: "medium",
    sourceNote: "A generic class label only. No individual submarine, acoustic signature, or operational position is represented.",
  }),
]);

/*
 * Broad, authored map anchors let the story slider move a marker across a
 * low-resolution globe. They are not extracted from a book, game, log, or
 * military record. The app deliberately never displays numeric coordinates.
 */
export const STORY_TRACKS = Object.freeze({
  "red-october": Object.freeze([
    Object.freeze({ at: 0, lat: 71, lon: 30 }),
    Object.freeze({ at: 0.2, lat: 67, lon: 9 }),
    Object.freeze({ at: 0.4, lat: 62, lon: -8 }),
    Object.freeze({ at: 0.6, lat: 57, lon: -24 }),
    Object.freeze({ at: 0.8, lat: 51, lon: -39 }),
    Object.freeze({ at: 1, lat: 46, lon: -55 }),
  ]),
  dallas: Object.freeze([
    Object.freeze({ at: 0, lat: 47, lon: -43 }),
    Object.freeze({ at: 0.2, lat: 49, lon: -41 }),
    Object.freeze({ at: 0.4, lat: 51, lon: -39 }),
    Object.freeze({ at: 0.6, lat: 53, lon: -37 }),
    Object.freeze({ at: 0.8, lat: 55, lon: -35 }),
    Object.freeze({ at: 1, lat: 56, lon: -33 }),
  ]),
  "akula-contact": Object.freeze([
    Object.freeze({ at: 0, lat: 69, lon: 25 }),
    Object.freeze({ at: 0.2, lat: 66, lon: 12 }),
    Object.freeze({ at: 0.4, lat: 63, lon: 0 }),
    Object.freeze({ at: 0.6, lat: 60, lon: -13 }),
    Object.freeze({ at: 0.8, lat: 57, lon: -25 }),
    Object.freeze({ at: 1, lat: 54, lon: -36 }),
  ]),
});

export const DATA_SOURCES = Object.freeze([
  Object.freeze({
    label: "Internet Archive · 1987 DOS listing",
    url: "https://archive.org/details/msdos_The_Hunt_for_Red_October_1987",
    note: "Archive metadata describes an Oxford Digital Enterprises / IntelliCreations release. The viewer does not reproduce the game or extract its coordinates.",
  }),
  Object.freeze({
    label: "Internet Archive · 1990 DOS listing",
    url: "https://archive.org/details/msdos_The_Hunt_for_Red_October_1990_1990",
    note: "A separate listing. Its identity and relationship to other adaptations are not assumed here.",
  }),
  Object.freeze({
    label: "Internet Archive · Grandslam manual record",
    url: "https://archive.org/details/HuntforRedOctober",
    note: "A separate 1990 film-based game/manual record; do not conflate it with the earlier Oxford Digital game or console releases.",
  }),
  Object.freeze({
    label: "Internet Archive · Jane’s Defence Weekly exact-title search",
    url: "https://archive.org/advancedsearch.php?q=title%3A%22Jane%27s%20Defence%20Weekly%22&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=mediatype&rows=50&page=1&output=json",
    note: "Point-in-time catalog check on 2026-10-13: the exact-title query returned zero records; broader title and full-text phrase searches also returned none. This is not proof that every alternate title or archived web capture is absent. No JDW issue scan or article text is bundled or used for the story map.",
  }),
  Object.freeze({
    label: "Internet Archive Wayback · Jane’s Defence Weekly, 17 Sep 1994",
    url: "https://web.archive.org/web/20090227172628/http://www.janes.com/extract/jdw94/jdw00821.html",
    note: "A preserved Janes.com page identifies a 17 September 1994 JDW article on the US Navy’s SC-21 surface-combatant program. The archived page is an excerpt/subscription landing page, not a complete weekly issue and not submarine-design evidence; retained here as a discovery pointer only.",
  }),
  Object.freeze({
    label: "TRID · Jane’s Defence Weekly Project 941 citation (1986)",
    url: "https://trid.trb.org/View/427904",
    note: "TRID’s secondary record cites Jane’s Defence Weekly, vol. 5, 1 March 1986, p. 376, for ‘Soviet Typhoon class: Leviathan of the Deep.’ Its abstract labels the internal arrangement as presumed or estimated. It is a bibliographic/abstract pointer, not an IA scan or a verified blueprint; this viewer does not use it to assert a real internal layout.",
  }),
  Object.freeze({
    label: "Internet Archive · Bulletin of the Atomic Scientists, Jan–Feb 1987",
    url: "https://archive.org/details/sim_bulletin-of-the-atomic-scientists_january-february-1987_43_1",
    note: "Archive metadata catalogs volume 43, issue 1 (January–February 1987), but flags the issue as access-restricted. Access may require an eligible account or library; no scan or article text is redistributed here.",
  }),
  Object.freeze({
    label: "Bulletin of the Atomic Scientists · Nuclear Notebook archive",
    url: "https://thebulletin.org/nuclear-notebook/",
    note: "The Bulletin describes the Nuclear Notebook as an FAS-authored series published since 1987. It is a sourced expert-estimate series, not primary operational telemetry, a JDW issue, or evidence for this fictional story route; no arsenal figures are imported into the scene.",
  }),
  Object.freeze({
    label: "Ghidra · official source repository",
    url: "https://github.com/NationalSecurityAgency/ghidra",
    note: "A possible static-analysis tool for legally obtained executables. No commercial game binary is included in this app.",
  }),
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}

export function storyBeatAt(progress) {
  const p = clamp(progress, 0, 1);
  let beat = STORY_BEATS[0];
  for (const candidate of STORY_BEATS) {
    if (candidate.at <= p) beat = candidate;
    else break;
  }
  return beat;
}

function toVector(point) {
  const lat = (point.lat * Math.PI) / 180;
  const lon = (point.lon * Math.PI) / 180;
  const cosLat = Math.cos(lat);
  return [cosLat * Math.cos(lon), cosLat * Math.sin(lon), Math.sin(lat)];
}

function fromVector(vector) {
  const [x, y, z] = vector;
  const length = Math.hypot(x, y, z) || 1;
  return {
    lat: (Math.asin(clamp(z / length, -1, 1)) * 180) / Math.PI,
    lon: (Math.atan2(y, x) * 180) / Math.PI,
  };
}

/** Spherical interpolation, so paths remain well-behaved across longitude wrap. */
export function interpolateGeo(a, b, amount) {
  const t = clamp(amount, 0, 1);
  const av = toVector(a);
  const bv = toVector(b);
  const dot = clamp(av[0] * bv[0] + av[1] * bv[1] + av[2] * bv[2], -1, 1);
  const omega = Math.acos(dot);
  if (omega < 1e-8) return fromVector(av.map((value, index) => value + (bv[index] - value) * t));
  const sinOmega = Math.sin(omega);
  if (Math.abs(sinOmega) < 1e-8) return fromVector(av.map((value, index) => value + (bv[index] - value) * t));
  const left = Math.sin((1 - t) * omega) / sinOmega;
  const right = Math.sin(t * omega) / sinOmega;
  return fromVector(av.map((value, index) => value * left + bv[index] * right));
}

export function trackPosition(track, progress) {
  if (!Array.isArray(track) || track.length === 0) throw new TypeError("A non-empty story track is required");
  const p = clamp(progress, 0, 1);
  if (track.length === 1 || p <= track[0].at) return { lat: track[0].lat, lon: track[0].lon };
  for (let index = 1; index < track.length; index += 1) {
    const right = track[index];
    if (p <= right.at) {
      const left = track[index - 1];
      const span = right.at - left.at;
      const local = span <= 0 ? 1 : (p - left.at) / span;
      return interpolateGeo(left, right, local);
    }
  }
  const last = track[track.length - 1];
  return { lat: last.lat, lon: last.lon };
}

export function sampleTrack(track, progress, samplesPerSegment = 12) {
  if (!Array.isArray(track) || track.length === 0) throw new TypeError("A non-empty story track is required");
  const p = clamp(progress, 0, 1);
  if (track.length === 1 || p <= track[0].at) return [{ lat: track[0].lat, lon: track[0].lon }];
  const samples = Math.max(1, Math.floor(samplesPerSegment));
  const result = [{ lat: track[0].lat, lon: track[0].lon }];
  for (let index = 1; index < track.length; index += 1) {
    const left = track[index - 1];
    const right = track[index];
    if (left.at >= p) break;
    const endAt = Math.min(right.at, p);
    const span = right.at - left.at;
    const localEnd = span <= 0 ? 1 : (endAt - left.at) / span;
    const count = Math.max(1, Math.ceil(samples * localEnd));
    for (let step = 1; step <= count; step += 1) {
      result.push(interpolateGeo(left, right, (localEnd * step) / count));
    }
    if (p <= right.at) break;
  }
  return result;
}

/** Orthographic projection used by the offline globe. `z >= 0` is visible. */
export function projectOrthographic(lat, lon, centerLat, centerLon) {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  const phi0 = (centerLat * Math.PI) / 180;
  const lambda0 = (centerLon * Math.PI) / 180;
  const delta = lambda - lambda0;
  const x = Math.cos(phi) * Math.sin(delta);
  const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(delta);
  const z = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(delta);
  return { x, y, z, visible: z >= 0 };
}

export function formatClock(scale, date, progress) {
  const instant = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(instant.getTime())) throw new TypeError("A valid wall-clock date is required");
  if (scale === "story") {
    const beat = storyBeatAt(progress);
    const index = STORY_BEATS.indexOf(beat) + 1;
    return `CHAPTER ${String(index).padStart(2, "0")} / ${String(STORY_BEATS.length).padStart(2, "0")} · ${beat.title}`;
  }
  if (scale === "utc") return instant.toISOString().replace(".000Z", "Z");
  if (scale === "local") return instant.toLocaleString();
  if (scale === "unix") return `${Math.floor(instant.getTime() / 1000)} s · ${instant.getTime()} ms`;
  if (scale === "julian") return (2440587.5 + instant.getTime() / 86400000).toFixed(5);
  throw new RangeError(`Unsupported time scale: ${scale}`);
}

function rgbFromHex(hex) {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "59e0bf";
  return [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16) / 255);
}

function meshCoordinates(length, halfBeam, halfDepth, rings = 12, segments = 24) {
  const vertices = [];
  const faces = [];
  const lines = [];
  for (let i = 0; i <= rings; i += 1) {
    const u = -Math.PI / 2 + (Math.PI * i) / rings;
    const x = (length / 2) * Math.sin(u);
    const radial = Math.cos(u);
    for (let j = 0; j <= segments; j += 1) {
      const v = (Math.PI * 2 * j) / segments;
      const y = halfBeam * radial * Math.cos(v);
      const z = halfDepth * radial * Math.sin(v);
      vertices.push(`${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`);
    }
  }
  for (let i = 0; i < rings; i += 1) {
    for (let j = 0; j < segments; j += 1) {
      const a = i * (segments + 1) + j;
      const b = a + segments + 1;
      faces.push(`${a} ${b} ${b + 1} ${a + 1} -1`);
    }
  }
  for (let i = 0; i <= rings; i += 1) {
    const row = [];
    for (let j = 0; j <= segments; j += 1) row.push(i * (segments + 1) + j);
    lines.push(`${row.join(" ")} ${row[0]} -1`);
  }
  for (let j = 0; j <= segments; j += 2) {
    const column = [];
    for (let i = 0; i <= rings; i += 1) column.push(i * (segments + 1) + j);
    lines.push(`${column.join(" ")} -1`);
  }
  return { vertices, faces, lines };
}

function vrmlMesh(name, mesh, color, { wireframe = false, transparency = 0 } = {}) {
  const geometry = wireframe
    ? `IndexedLineSet { coord Coordinate { point [\n${mesh.vertices.map((point) => `      ${point},`).join("\n")}\n    ] } coordIndex [\n${mesh.lines.map((line) => `      ${line},`).join("\n")}\n    ] }`
    : `IndexedFaceSet { solid FALSE coord Coordinate { point [\n${mesh.vertices.map((point) => `      ${point},`).join("\n")}\n    ] } coordIndex [\n${mesh.faces.map((face) => `      ${face},`).join("\n")}\n    ] }`;
  const rgb = rgbFromHex(color).map((component) => component.toFixed(3)).join(" ");
  return `Shape { # ${name}\n  appearance Appearance { material Material { diffuseColor ${rgb} emissiveColor ${rgb} transparency ${transparency.toFixed(2)} } }\n  geometry ${geometry}\n}`;
}

/**
 * Export a normalized, illustrative VRML 2.0 hull volume. It is not an
 * engineering drawing, true-to-scale model, compartment plan, or track record.
 */
export function buildVrml(vesselId, options = {}) {
  const vessel = VESSELS.find((entry) => entry.id === vesselId);
  if (!vessel) throw new RangeError(`Unknown vessel: ${vesselId}`);
  const wireframe = Boolean(options.wireframe);
  const xray = Boolean(options.xray);
  const dimensions = vessel.silhouette === "broad"
    ? { length: 150, beam: 36, depth: 24 }
    : vessel.silhouette === "slender"
      ? { length: 150, beam: 17, depth: 15 }
      : { length: 150, beam: 25, depth: 19 };
  const mesh = meshCoordinates(dimensions.length, dimensions.beam / 2, dimensions.depth / 2);
  const inner = meshCoordinates(dimensions.length * 0.66, dimensions.beam * 0.27, dimensions.depth * 0.25, 10, 20);
  const hullTransparency = xray ? 0.52 : wireframe ? 0.02 : 0.12;
  const sailWidth = vessel.silhouette === "broad" ? 22 : 16;
  const sailHeight = vessel.silhouette === "broad" ? 15 : 12;
  const innerModel = xray
    ? `${vrmlMesh("generic inner volume · not an internal layout", inner, "#ffc06e", { wireframe, transparency: 0.25 })}\n`
    : "";
  const sail = wireframe
    ? "Shape { appearance Appearance { material Material { diffuseColor 0.95 0.69 0.35 emissiveColor 0.95 0.69 0.35 } } geometry IndexedLineSet { coord Coordinate { point [ 18 -8 0, 38 -8 0, 38 8 0, 18 8 0, 18 -8 18, 38 -8 18, 38 8 18, 18 8 18 ] } coordIndex [ 0 1 2 3 0 -1, 4 5 6 7 4 -1, 0 4 -1, 1 5 -1, 2 6 -1, 3 7 -1 ] } }"
    : `Transform { translation 27 0 9 children [ Shape { appearance Appearance { material Material { diffuseColor 0.95 0.69 0.35 emissiveColor 0.95 0.69 0.35 transparency ${xray ? "0.38" : "0.06"} } } geometry Box { size 20 ${sailWidth} ${sailHeight} } } ] }`;
  return `#VRML V2.0 utf8
# Red October 4Dwm — schematic export, normalized display units only.
# Fiction-inspired; no actual track, engineering dimensions, machinery, or compartment arrangement.
WorldInfo { title "${vessel.name} — schematic profile" info [ "${vessel.classLabel}", "Normalized display units; not to scale." ] }
NavigationInfo { type [ "EXAMINE" "ANY" ] }
Background { skyColor [ 0.008 0.025 0.045 ] }
DirectionalLight { direction -0.5 -0.8 -1 intensity 0.8 }
Transform { rotation 0 0 1 1.570796 children [
  ${vrmlMesh("outer hull envelope", mesh, vessel.color, { wireframe, transparency: hullTransparency })}
  ${innerModel}  ${sail}
] }
`;
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&apos;",
  })[character]);
}

function utf8Base64(value) {
  const bytes = new TextEncoder().encode(String(value));
  if (typeof btoa === "function") {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  }
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  throw new Error("No Base64 encoder is available in this environment");
}

/** Emit the Xena default-package wrapper + its documented Binary object schema. */
export function buildXenaRecord({ vesselId, sceneText, createdAt = new Date().toISOString() }) {
  const vessel = VESSELS.find((entry) => entry.id === vesselId);
  if (!vessel) throw new RangeError(`Unknown vessel: ${vesselId}`);
  const base64 = utf8Base64(sceneText).match(/.{1,76}/g)?.join("\n") ?? "";
  const sourceUri = `urn:red-october-command-viewer:${vessel.id}:schematic-v${VIEWER_VERSION}`;
  const description = "The following data is a MIME-compliant (RFC 2045) PEM base64 (RFC 1421) representation of the original file contents.";
  return `<?xml version="1.0" encoding="UTF-8"?>
<xena xmlns="http://preservation.naa.gov.au/xena/1.0">
  <meta_data>
    <meta_data_wrapper_name>Default Package Wrapper</meta_data_wrapper_name>
    <normaliser_name>au.gov.naa.digipres.xena.kernel.normalise.BinaryToXenaBinaryNormaliser</normaliser_name>
    <input_source_uri>${xmlEscape(sourceUri)}</input_source_uri>
  </meta_data>
  <content>
    <binary-object:binary-object xmlns:binary-object="http://preservation.naa.gov.au/binary-object/1.0" binary-object:description="${xmlEscape(description)}">
${base64.split("\n").map((line) => `      ${line}`).join("\n")}
    </binary-object:binary-object>
  </content>
</xena>
<!-- Original format: VRML 2.0 UTF-8; generated ${xmlEscape(createdAt)}; this is an illustrative model, not source track data. -->
`;
}

export function buildSceneManifest({ vesselId, progress, toggles = {}, createdAt = new Date().toISOString(), sceneSha256 = null } = {}) {
  const vessel = VESSELS.find((entry) => entry.id === vesselId);
  if (!vessel) throw new RangeError(`Unknown vessel: ${vesselId}`);
  const beat = storyBeatAt(progress);
  return {
    schema: "red-october-command-viewer-scene/1",
    viewerVersion: VIEWER_VERSION,
    createdAt,
    subject: { id: vessel.id, name: vessel.name, classLabel: vessel.classLabel },
    scene: {
      storyBeatId: beat.id,
      storyBeatTitle: beat.title,
      storyIndex: Number(clamp(progress, 0, 1).toFixed(3)),
      coordinatesAsserted: false,
      historicalTrack: false,
      operationalData: false,
      internalArrangementClaimed: false,
      modelUnits: "normalized display units; not a physical scale",
      toggles: { xray: Boolean(toggles.xray), wireframe: Boolean(toggles.wireframe), relief: Boolean(toggles.relief) },
    },
    artifact: { format: "model/vrml; version=2.0", fileName: `red-october-${vessel.id}-schematic.wrl`, sha256: sceneSha256 },
    provenance: {
      basemap: "Natural Earth low-resolution country outlines shipped with the app; coastline context only.",
      route: "Authored narrative anchors for visualization; not extracted from a publication, game binary, log, or sensor record.",
      limits: [
        "No real submarine positions, tracks, timestamps, tactics, or sensor data are represented.",
        "The hull is a generic schematic silhouette, not a precise internal arrangement or engineering drawing.",
        "No bathymetry, USGS 3DEP raster, or SAR measurement is used in this globe scene.",
      ],
      sources: DATA_SOURCES.map(({ label, url }) => ({ label, url })),
    },
  };
}
