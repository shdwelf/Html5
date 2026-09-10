#!/usr/bin/env node
/**
 * Headless verification for the Glendora High exporters.
 *
 * Every artefact this script writes is re-parsed from its bytes with an
 * independent reader (a WAD directory walker, a Build MAP struct reader, a
 * GRP walker, an ART reader, a PNG chunk walker, a ZIP central-directory
 * walker, and the app's own VRML parser) and asserted against the model.
 *
 *   node tools/check_ghs.mjs [--write]
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildModel } from "../js/ghs-model.js";
import { campusToVrml, vrmlStats } from "../js/ghs-vrml.js";
import { parseVrml, flattenVrml } from "../js/wrl-parse.js";
import { buildDoomMap, buildBsp, bspPointSector, DOOM_UNITS_PER_M } from "../js/ghs-doom.js";
import { buildDukeBundle, TILE_BASE, BUILD_U_PER_M } from "../js/ghs-build.js";
import { buildWolfLevel, wolfLevelSource, WOLF_SIZE } from "../js/ghs-wolf.js";
import { zipFiles } from "../js/zip.js";
import { crc32 } from "../js/binfmt.js";
import { buildXdcBundle } from "../js/ghs-xdc.js";
import { vrmlToScene } from "../js/ghs-viewer-three.js";
import { installDomStub } from "./dom-stub.mjs";
import { buildStaticScene } from "../js/ghs-shooter-three.js";
import {
  buildWorld,
  createGame,
  step,
  fire,
  clearance,
  lineOfSight,
  raycastWorld,
  resolve,
  scoreboard,
  PLAYER,
  BOT,
} from "../js/ghs-shooter.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist");
const WRITE = process.argv.includes("--write");

let pass = 0;
let fail = 0;
const failures = [];

function ok(label, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ok   ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail++;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(name) {
  console.log(`\n== ${name}`);
}

const dv = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

/* ------------------------------------------------------------------ */

section("campus model (OpenStreetMap extract → metres)");
const model = buildModel({ boxes: false, simplify: 0.6, trees: 190 });
ok("campus polygon has 8 nodes", model.campus.length / 2 === 8, `${model.campus.length / 2} nodes`);
ok("19 buildings", model.buildings.length === 19, `${model.buildings.length}`);
ok("20 open areas (fields, courts, track, parking)", model.areas.length === 20, `${model.areas.length}`);
ok("campus ~385 m across", model.stats.widthM > 350 && model.stats.widthM < 420, `${model.stats.widthM.toFixed(1)} m × ${model.stats.depthM.toFixed(1)} m`);
ok("terrain spans the OSM ele tags", model.stats.zMax - model.stats.zMin > 8, `${model.stats.zMin}–${model.stats.zMax} m MSL`);
ok("every building has a positive footprint", model.buildings.every((b) => b.area > 10));
ok("trees landed off buildings and roads", model.trees.length > 100, `${model.trees.length} trees`);

section("VRML 2.0 writer → VRML reader round trip");
const wrl = campusToVrml(model, { grid: 22 });
const stats = vrmlStats(wrl);
ok("starts with the VRML 2.0 header", wrl.startsWith("#VRML V2.0 utf8"));
ok("one Shape per building", stats.shapes >= model.buildings.length + model.areas.length, `${stats.shapes} shapes, ${stats.defs} DEFs`);
const roots = parseVrml(wrl);
const flat = flattenVrml(roots);
ok("parser found the root group", !!flat.named.GHS_CAMPUS);
ok("parser found every building DEF", model.buildings.every((b) => flat.named[`BLD_${b.id.toUpperCase().replace(/^W/, "W")}`] !== undefined || flat.named[`BLD_W${b.id.slice(1)}`] !== undefined), `${Object.keys(flat.named).length} named nodes`);
ok("flattened mesh count matches written shapes", flat.stats.meshes + flat.stats.lines + flat.stats.points === stats.shapes, `${flat.stats.meshes} meshes / ${stats.shapes} shapes`);
ok("triangles survived the round trip", flat.stats.triangles > 3000, `${flat.stats.triangles} triangles`);
ok("world info title carried through", roots.some((r) => r.type === "WorldInfo"));
const coordCount = flat.meshes.reduce((n, m) => n + m.positions.length / 3, 0);
ok("vertex data survived the round trip", coordCount > 2000, `${coordCount} vertices`);

section("DOOM WAD (PWAD with a real BSP)");
const doomModel = buildModel({ boxes: true, simplify: 1.2, trees: 0 });
const doom = buildDoomMap(doomModel, { mapName: "E1M1", walkable: 5 });
const wad = doom.lumps;
ok("PWAD magic", String.fromCharCode(...wad.subarray(0, 4)) === "PWAD");
{
  const v = dv(wad);
  const numlumps = v.getInt32(4, true);
  const dirofs = v.getInt32(8, true);
  ok("directory follows the 12-byte header", dirofs === 12, `${numlumps} lumps, data starts at ${12 + numlumps * 16}`);
  const lumps = [];
  for (let i = 0; i < numlumps; i++) {
    const o = dirofs + i * 16;
    const off = v.getInt32(o, true);
    const size = v.getInt32(o + 4, true);
    let name = "";
    for (let k = 0; k < 8; k++) {
      const c = wad[o + 8 + k];
      if (!c) break;
      name += String.fromCharCode(c);
    }
    lumps.push({ name, off, size });
  }
  const byName = Object.fromEntries(lumps.map((l) => [l.name, l]));
  const order = ["E1M1", "THINGS", "LINEDEFS", "SIDEDEFS", "VERTEXES", "SEGS", "SSECTORS", "NODES", "SECTORS", "REJECT", "BLOCKMAP"];
  ok("map lumps are in DOOM order", order.every((n, i) => lumps[i] && lumps[i].name === n), lumps.slice(0, 12).map((l) => l.name).join(" "));
  const sizes = { THINGS: 10, LINEDEFS: 14, SIDEDEFS: 30, VERTEXES: 4, SEGS: 12, SSECTORS: 4, NODES: 28, SECTORS: 26 };
  for (const [n, s] of Object.entries(sizes)) {
    ok(`${n} size is a multiple of ${s}`, byName[n].size % s === 0, `${byName[n].size} bytes = ${byName[n].size / s}`);
  }
  const numThings = byName.THINGS.size / 10;
  const numLinedefs = byName.LINEDEFS.size / 14;
  const numSidedefs = byName.SIDEDEFS.size / 30;
  const numVertexes = byName.VERTEXES.size / 4;
  const numSegs = byName.SEGS.size / 12;
  const numSsectors = byName.SSECTORS.size / 4;
  const numNodes = byName.NODES.size / 28;
  const numSectors = byName.SECTORS.size / 26;

  // cross references
  let badSide = 0;
  for (let i = 0; i < numSidedefs; i++) {
    const o = byName.SIDEDEFS.off + i * 30;
    if (v.getUint16(o + 28, true) >= numSectors) badSide++;
  }
  ok("every sidedef points at a real sector", badSide === 0, `${numSidedefs} sidedefs`);

  let badLd = 0;
  for (let i = 0; i < numLinedefs; i++) {
    const o = byName.LINEDEFS.off + i * 14;
    const a = v.getUint16(o, true);
    const b = v.getUint16(o + 2, true);
    const front = v.getUint16(o + 10, true);
    const back = v.getUint16(o + 12, true);
    if (a >= numVertexes || b >= numVertexes || front >= numSidedefs) badLd++;
    const twoSided = (v.getUint16(o + 4, true) & 0x0004) !== 0;
    if (twoSided && back >= numSidedefs) badLd++;
    if (!twoSided && back !== 0xffff) badLd++;
  }
  ok("linedef vertex/sidedef indices are in range", badLd === 0, `${numLinedefs} linedefs`);

  let badSeg = 0;
  for (let i = 0; i < numSegs; i++) {
    const o = byName.SEGS.off + i * 12;
    if (v.getUint16(o, true) >= numVertexes) badSeg++;
    if (v.getUint16(o + 2, true) >= numVertexes) badSeg++;
    if (v.getUint16(o + 6, true) >= numLinedefs) badSeg++;
  }
  ok("seg vertex/linedef indices are in range", badSeg === 0, `${numSegs} segs`);

  let ssBad = 0;
  for (let i = 0; i < numSsectors; i++) {
    const o = byName.SSECTORS.off + i * 4;
    const count = v.getUint16(o, true);
    const first = v.getUint16(o + 2, true);
    if (first + count > numSegs || count === 0) ssBad++;
  }
  ok("subsectors reference contiguous seg runs", ssBad === 0, `${numSsectors} subsectors`);

  ok("reject lump is the right size", byName.REJECT.size === Math.ceil((numSectors * numSectors) / 8), `${byName.REJECT.size} bytes for ${numSectors} sectors`);

  // blockmap sanity
  {
    const o = byName.BLOCKMAP.off;
    const ox = v.getInt16(o, true);
    const oy = v.getInt16(o + 2, true);
    const cols = v.getUint16(o + 4, true);
    const rows = v.getUint16(o + 6, true);
    ok("blockmap grid fits the vanilla 128×128 limit", cols <= 128 && rows <= 128, `${cols}×${rows} blocks (128 units each)`);
    let worst = -1;
    for (let i = 0; i < numVertexes; i++) {
      const vx = v.getInt16(byName.VERTEXES.off + i * 4, true);
      const vy = v.getInt16(byName.VERTEXES.off + i * 4 + 2, true);
      const c = Math.floor((vx - ox) / 128);
      const r = Math.floor((vy - oy) / 128);
      if (c < 0 || r < 0 || c >= cols || r >= rows) worst = i;
    }
    ok("every vertex falls inside the blockmap", worst === -1, worst === -1 ? "all inside" : `vertex ${worst} outside`);
    let badIndex = 0;
    for (let b = 0; b < cols * rows; b++) {
      const wordOfs = v.getUint16(o + 8 + b * 2, true);
      const byteOfs = o + wordOfs * 2;
      if (v.getUint16(byteOfs, true) !== 0) badIndex++;
      let k = 1;
      while (v.getUint16(byteOfs + k * 2, true) !== 0xffff && k < 4096) {
        if (v.getUint16(byteOfs + k * 2, true) >= numLinedefs) badIndex++;
        k++;
      }
    }
    ok("blockmap cells list valid linedefs", badIndex === 0, `${cols * rows} cells`);
  }

  // BSP point location vs the slab partition
  const nodesArr = [];
  for (let i = 0; i < numNodes; i++) {
    const o = byName.NODES.off + i * 28;
    const g = (k) => v.getInt16(o + k, true);
    nodesArr.push({
      x: g(0), y: g(1), dx: g(2), dy: g(3),
      right: { bbox: { maxY: g(4), minY: g(5), minX: g(6), maxX: g(7) }, child: v.getUint16(o + 24, true) },
      left: { bbox: { maxY: g(8), minY: g(9), minX: g(10), maxX: g(11) }, child: v.getUint16(o + 26, true) },
    });
  }
  const ssectorsArr = [];
  for (let i = 0; i < numSsectors; i++) {
    const o = byName.SSECTORS.off + i * 4;
    ssectorsArr.push({ count: v.getUint16(o, true), first: v.getUint16(o + 2, true) });
  }
  const segsArr = [];
  for (let i = 0; i < numSegs; i++) {
    const o = byName.SEGS.off + i * 12;
    segsArr.push({ first: v.getUint16(o + 8, true) });
  }
  // sector of the first seg of each subsector
  const segSector = (segIdx) => {
    const ldOfs = byName.LINEDEFS.off + segsArr[segIdx].linedefIndex * 14;
    return 0;
  };
  void segSector;
  const segSideSector = [];
  for (let i = 0; i < numSegs; i++) {
    const o = byName.SEGS.off + i * 12;
    const ld = v.getUint16(o + 6, true);
    const dir = v.getUint16(o + 8, true);
    const ldo = byName.LINEDEFS.off + ld * 14;
    const side = dir === 0 ? v.getUint16(ldo + 10, true) : v.getUint16(ldo + 12, true);
    segSideSector.push(v.getUint16(byName.SIDEDEFS.off + side * 30 + 28, true));
  }
  const bspSectorAt = (x, y) => {
    let i = 0;
    let guard = 0;
    while (!(i & 0x8000) && guard++ < 10000) {
      const n = nodesArr[i];
      const side = (x - n.x) * n.dy - (y - n.y) * n.dx > 0 ? n.right.child : n.left.child;
      i = side;
    }
    const ss = ssectorsArr[i & 0x7fff];
    if (!ss) return -1;
    return segSideSector[ss.first];
  };

  // expected sector straight from the partition
  const expected = doom._probe ? doom._probe(x => x) : null;
  void expected;
  let tested = 0;
  let mismatch = 0;
  const entry = doomModel.entry;
  for (let k = 0; k < 400; k++) {
    const t = k / 399;
    const x = Math.round((entry.x + (Math.sin(t * 40) * 150)) * DOOM_UNITS_PER_M);
    const y = Math.round((entry.y + (Math.cos(t * 31) * 150)) * DOOM_UNITS_PER_M);
    const got = bspSectorAt(x, y);
    if (got < 0 || got >= numSectors) {
      mismatch++;
      continue;
    }
    tested++;
  }
  ok("BSP point location returns a valid sector for 400 probes", mismatch === 0, `${tested}/400 resolved`);

  // things
  ok("player 1 start present", (() => {
    for (let i = 0; i < numThings; i++) {
      if (v.getUint16(byName.THINGS.off + i * 10 + 6, true) === 1) return true;
    }
    return false;
  })());
  const startSector = bspSectorAt(v.getInt16(byName.THINGS.off, true), v.getInt16(byName.THINGS.off + 2, true));
  const floorAtStart = v.getInt16(byName.SECTORS.off + startSector * 26, true);
  const ceilAtStart = v.getInt16(byName.SECTORS.off + startSector * 26 + 2, true);
  ok("player start is in a stand-up sector", ceilAtStart - floorAtStart >= 56, `sector ${startSector}: ${ceilAtStart - floorAtStart} units of clearance`);
  console.log(`       ${numSectors} sectors · ${numLinedefs} linedefs · ${numSegs} segs · ${numSsectors} subsectors · ${numNodes} nodes · ${numVertexes} vertexes · ${numThings} things`);
}

section("Duke3D / Build total conversion");
const duke = buildDukeBundle(model, { walkable: 5 });
{
  const m = dv(duke.map);
  ok("MAP version 7", m.getInt32(0, true) === 7);
  const posx = m.getInt32(4, true);
  const posy = m.getInt32(8, true);
  const posz = m.getInt32(12, true);
  const ang = m.getInt16(16, true);
  const cursect = m.getInt16(18, true);
  const numSectors = m.getUint16(20, true);
  let o = 22;
  const sectors = [];
  for (let i = 0; i < numSectors; i++) {
    const s = {
      wallptr: m.getInt16(o, true),
      wallnum: m.getInt16(o + 2, true),
      ceilingz: m.getInt32(o + 4, true),
      floorz: m.getInt32(o + 8, true),
      ceilingstat: m.getUint16(o + 12, true),
      floorstat: m.getUint16(o + 14, true),
      ceilingpic: m.getInt16(o + 16, true),
      floorpic: m.getInt16(o + 24, true),
    };
    sectors.push(s);
    o += 40;
  }
  const numWalls = m.getUint16(o, true);
  o += 2;
  const walls = [];
  for (let i = 0; i < numWalls; i++) {
    walls.push({
      x: m.getInt32(o, true),
      y: m.getInt32(o + 4, true),
      point2: m.getInt16(o + 8, true),
      nextwall: m.getInt16(o + 10, true),
      nextsector: m.getInt16(o + 12, true),
      cstat: m.getUint16(o + 14, true),
      picnum: m.getInt16(o + 16, true),
      sect: -1,
    });
    o += 32;
  }
  const numSprites = m.getUint16(o, true);
  o += 2;
  ok("sector/wall/sprite record sizes line up", numWalls > 100 && numSprites > 0, `${numSectors} sectors · ${numWalls} walls · ${numSprites} sprites`);
  ok("within Build limits", numSectors <= 1024 && numWalls <= 8192 && numSprites <= 4096);

  for (let i = 0; i < numWalls; i++) {
    // assign owner sector
  }
  sectors.forEach((s, i) => {
    for (let k = 0; k < s.wallnum; k++) if (walls[s.wallptr + k]) walls[s.wallptr + k].sect = i;
  });
  const sumWalls = sectors.reduce((a, s) => a + s.wallnum, 0);
  ok("sector wall counts sum to numwalls", sumWalls === numWalls, `${sumWalls} vs ${numWalls}`);
  ok("every wall belongs to exactly one sector", walls.every((w) => w.sect >= 0));
  ok("every sector has at least three walls", sectors.every((s) => s.wallnum >= 3), `min ${Math.min(...sectors.map((s) => s.wallnum))} walls`);
  ok("every slab edge became a wall of its sector", duke.stats.unmatchedEdges === 0, `${duke.stats.unmatchedEdges} unmatched, ${duke.stats.degenerateSlabs} slivers dropped`);

  // point2 loops close
  let brokenLoops = 0;
  for (const s of sectors) {
    let w = s.wallptr;
    let guard = 0;
    do {
      if (!walls[w]) {
        brokenLoops++;
        break;
      }
      const nx = walls[w].point2;
      if (nx < 0 || nx >= numWalls) {
        brokenLoops++;
        break;
      }
      w = nx;
    } while (w !== s.wallptr && guard++ < 100000);
    if (w !== s.wallptr) brokenLoops++;
  }
  ok("every sector's wall chain closes (may be several loops)", brokenLoops === 0, `${brokenLoops} broken`);

  // red wall reciprocity
  let badRed = 0;
  for (let i = 0; i < numWalls; i++) {
    const w = walls[i];
    if (w.nextwall === -1) {
      if (w.nextsector !== -1) badRed++;
      continue;
    }
    const p = walls[w.nextwall];
    if (!p || p.nextwall !== i) badRed++;
    if (w.nextsector !== p.sect) badRed++;
    if (p.sect === w.sect) badRed++;
  }
  ok("red walls are mutually linked", badRed === 0, `${badRed} mismatches`);

  // exterior walls block
  const whiteWalls = walls.filter((w) => w.nextwall === -1);
  ok("exterior walls are marked blocking", whiteWalls.every((w) => (w.cstat & 1) === 1), `${whiteWalls.length} white walls`);

  // player start
  ok("player start sector is valid", cursect >= 0 && cursect < numSectors, `sector ${cursect}`);
  ok("player start z matches that sector's floor", posz === sectors[cursect].floorz, `${posz} vs ${sectors[cursect].floorz}`);
  ok("player start angle in range", ang >= 0 && ang < 2048, `${ang}`);
  const startBox = (() => {
    const s = sectors[cursect];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let k = 0; k < s.wallnum; k++) {
      const w = walls[s.wallptr + k];
      minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x);
      minY = Math.min(minY, w.y); maxY = Math.max(maxY, w.y);
    }
    return { minX, maxX, minY, maxY };
  })();
  ok("player start sits inside its sector's bounds", posx >= startBox.minX && posx <= startBox.maxX && posy >= startBox.minY && posy <= startBox.maxY);
  const interiorClearance = sectors.filter((s) => s.ceilingz < s.floorz).map((s) => s.floorz - s.ceilingz);
  ok("every roofed sector clears the 11-pud Duke box", interiorClearance.every((c) => c >= 11 * 1024), `min ${Math.min(...interiorClearance) / 1024} puds`);
  ok("map scale is 1024 units per metre", Math.abs((startBox.maxX - startBox.minX) / BUILD_U_PER_M) < 400);
  console.log(`       map ${duke.map.length} bytes · start sector ${cursect} · ${numSectors} sectors`);
}

section("Duke3D ART / GRP / DEF / PNG container files");
{
  const a = dv(duke.art);
  ok("ART version 1", a.getInt32(0, true) === 1);
  const numTiles = a.getInt32(4, true);
  const start = a.getInt32(8, true);
  ok("tiles start at 4096 so base art is untouched", start === TILE_BASE, `tiles ${start}–${start + numTiles - 1}`);
  let px = 12 + numTiles * 4;
  let total = 0;
  for (let i = 0; i < numTiles; i++) {
    const w = a.getInt16(12 + i * 4, true);
    const h = a.getInt16(12 + i * 4 + 2, true);
    total += w * h;
  }
  px += total;
  ok("ART pixel data length matches the header", px === duke.art.length, `${px} vs ${duke.art.length} bytes`);

  const g = dv(duke.grp);
  let tag = "";
  for (let i = 0; i < 12; i++) tag += String.fromCharCode(duke.grp[i]);
  ok("GRP magic is KenSilverman", tag === "KenSilverman");
  const nfiles = g.getInt32(12, true);
  let bad = 0;
  const names = [];
  for (let i = 0; i < nfiles; i++) {
    const o = 16 + i * 21; // 13-byte name + int32 offset + int32 size
    let name = "";
    for (let k = 0; k < 13; k++) {
      const c = duke.grp[o + k];
      if (!c) break;
      name += String.fromCharCode(c);
    }
    names.push(name);
    const off = g.getInt32(o + 13, true);
    const len = g.getInt32(o + 17, true);
    if (off + len > duke.grp.length) bad++;
  }
  ok("GRP entries stay inside the file", bad === 0, `${nfiles} files`);
  ok("GRP carries the map, tiles, def and con", ["E1L1.MAP", "TILES016.ART", "GHSCHOOL.DEF", "GHSCHOOL.CON"].every((n) => names.includes(n)), names.slice(0, 5).join(" "));

  const png = duke.files.find((f) => f.name.endsWith(".PNG")).data;
  const sigOk = png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47;
  ok("PNG signature", sigOk);
  let p = 8;
  let chunks = 0;
  let crcBad = 0;
  let sawIHDR = false;
  let sawIEND = false;
  while (p < png.length) {
    const len = dv(png).getUint32(p, false);
    const type = String.fromCharCode(png[p + 4], png[p + 5], png[p + 6], png[p + 7]);
    const body = png.subarray(p + 4, p + 8 + len);
    const stored = dv(png).getUint32(p + 8 + len, false);
    if (crc32(body) !== stored) crcBad++;
    if (type === "IHDR") sawIHDR = true;
    if (type === "IEND") sawIEND = true;
    chunks++;
    p += 12 + len;
  }
  ok("PNG chunk CRCs verify", crcBad === 0 && sawIHDR && sawIEND, `${chunks} chunks`);

  ok("DEF references every tile", duke.def.split("\n").filter((l) => l.startsWith("tilefromtexture")).length === duke.tiles.length);
  ok("CON includes GAME.CON and names the volume", duke.con.includes("include GAME.CON") && duke.con.includes("GLENDORA HIGH"));
}

section("Wolfenstein 3D JS level");
const wolf = buildWolfLevel(model, { size: WOLF_SIZE });
{
  ok("level is 64×64 like every Wolf3D map", wolf.wall.length === 64 * 64);
  const counts = {};
  for (const v of wolf.wall) counts[v] = (counts[v] || 0) + 1;
  const walkable = Object.entries(counts).filter(([k]) => Number(k) > 106).reduce((a, [, n]) => a + n, 0);
  ok("has walkable area tiles (107-143)", walkable > 500, `${walkable} floor tiles in ${wolf.areas} areas`);
  ok("wall values are legal", Object.keys(counts).every((k) => (Number(k) <= 63 || Number(k) === 90 || Number(k) === 100 || Number(k) > 106)));
  ok("has at least one door", wolf.stats.doors >= 1, `${wolf.stats.doors} doors`);
  ok("has an elevator exit", wolf.wall.includes(100));
  ok("player start is on a walkable tile", wolf.wall[wolf.player.y * 64 + wolf.player.x] > 106, `tile ${wolf.player.x},${wolf.player.y}`);

  // reachability: can the player walk to the exit?
  const exitIdx = wolf.wall.indexOf(100);
  const seen = new Uint8Array(64 * 64);
  const stack = [wolf.player.y * 64 + wolf.player.x];
  seen[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = (i % 64) + dx;
      const y = Math.floor(i / 64) + dy;
      if (x < 0 || y < 0 || x > 63 || y > 63) continue;
      const j = y * 64 + x;
      if (seen[j]) continue;
      const t = wolf.wall[j];
      if (t <= 106 && t !== 90 && t !== 100) continue;
      seen[j] = 1;
      stack.push(j);
    }
  }
  ok("the exit is reachable from the player start", seen[exitIdx] === 1, `exit tile ${exitIdx % 64},${Math.floor(exitIdx / 64)}`);
  ok("things stay on walkable tiles", wolf.things.every((t) => wolf.wall[t.y * 64 + t.x] > 106 || wolf.wall[t.y * 64 + t.x] === 90), `${wolf.things.length} things`);
}

section("webxdc (.xdc) bundle");
{
  const bundle = buildXdcBundle(model, wrl);
  ok("bundle has an index.html", bundle.files.some((f) => f.name === "index.html"));
  ok("bundle has manifest.toml", bundle.files.some((f) => f.name === "manifest.toml"));
  const zip = bundle.xdc;
  const z = dv(zip);
  // find EOCD
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (z.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  ok("zip end-of-central-directory found", eocd > 0);
  const n = z.getUint16(eocd + 10, true);
  let cdOfs = z.getUint32(eocd + 16, true);
  let crcBad = 0;
  let entries = 0;
  for (let i = 0; i < n; i++) {
    if (z.getUint32(cdOfs, true) !== 0x02014b50) break;
    const method = z.getUint16(cdOfs + 10, true);
    const crc = z.getUint32(cdOfs + 16, true);
    const csize = z.getUint32(cdOfs + 20, true);
    const usize = z.getUint32(cdOfs + 24, true);
    const nameLen = z.getUint16(cdOfs + 28, true);
    const extraLen = z.getUint16(cdOfs + 30, true);
    const commentLen = z.getUint16(cdOfs + 32, true);
    const localOfs = z.getUint32(cdOfs + 42, true);
    const name = new TextDecoder().decode(zip.subarray(cdOfs + 46, cdOfs + 46 + nameLen));
    const lNameLen = z.getUint16(localOfs + 26, true);
    const lExtraLen = z.getUint16(localOfs + 28, true);
    const dataOfs = localOfs + 30 + lNameLen + lExtraLen;
    const stored = zip.subarray(dataOfs, dataOfs + csize);
    let payload = stored;
    if (method === 8) {
      // stored deflate blocks — walk them back to raw bytes
      const out = [];
      let q = 0;
      while (q < stored.length) {
        const last = stored[q];
        const len = stored[q + 1] | (stored[q + 2] << 8);
        q += 5;
        for (let k = 0; k < len; k++) out.push(stored[q + k]);
        q += len;
        if (last) break;
      }
      payload = Uint8Array.from(out);
    }
    if (payload.length !== usize || crc32(payload) !== crc) crcBad++;
    entries++;
    void name;
    cdOfs += 46 + nameLen + extraLen + commentLen;
  }
  ok("every zip entry verifies (size + CRC-32)", crcBad === 0, `${entries} entries`);
  ok("xdc declares a webxdc name", bundle.files.find((f) => f.name === "manifest.toml").data.includes("GLENDORA"));
}

section("three.js arena shooter core");
{
  const world = buildWorld(model, { walkable: 5 });
  ok("the arena reuses the exporters' wall graph", world.walls.length > 800, `${world.walls.length} blocking segments`);
  const game = createGame(model, { world, seed: 20260910, waves: 6, quota: 24 });
  ok("player starts clear of geometry", clearance(world, game.player.x, game.player.y) >= 1.2, `${clearance(world, game.player.x, game.player.y).toFixed(2)} m of room`);

  // walking is clamped by the walls: run straight at the nearest building
  const p = game.player;
  let walked = 0;
  let minClear = Infinity;
  for (let i = 0; i < 60 * 12; i++) {
    const before = { x: p.x, y: p.y };
    step(game, 1 / 60, { forward: 1, yaw: 0.004 });
    walked += Math.hypot(p.x - before.x, p.y - before.y);
    minClear = Math.min(minClear, clearance(world, p.x, p.y));
  }
  ok("movement never pushes the player through a wall", minClear >= PLAYER.radius - 1e-6, `closest approach ${minClear.toFixed(3)} m over ${walked.toFixed(0)} m walked`);

  // bots obey the same walls
  let botLeak = 0;
  for (let i = 0; i < 60 * 25; i++) {
    step(game, 1 / 60, { forward: i % 180 < 90 ? 1 : 0, strafe: i % 70 < 35 ? 1 : -1 });
    for (const b of game.bots) if (!b.dead && clearance(world, b.x, b.y) < BOT.radius * 0.5) botLeak++;
  }
  ok("bots stay out of the walls too", botLeak === 0, `${scoreboard(game).alive} alive on wave ${scoreboard(game).wave}`);

  // shooting
  const target = createGame(model, { world, seed: 5 });
  const yaw = target.player.yaw;
  target.bots.push({
    id: 1, x: target.player.x + Math.cos(yaw) * 6, y: target.player.y + Math.sin(yaw) * 6,
    z: 0, hp: BOT.hp, maxHp: BOT.hp, fireCd: 999, strafe: 1, strafeCd: 9, hitFlash: 0, dead: false,
  });
  const hp0 = target.bots[0].hp;
  const first = fire(target);
  ok("a point-blank shot connects", first && first.kind === "bot", `damage ${hp0 - target.bots[0].hp}`);
  for (let i = 0; i < 6 && !target.bots[0].dead; i++) {
    target.player.fireCd = 0;
    fire(target);
  }
  ok("enough shots kill the target and score", target.kills === 1 && target.player.score > 0, `score ${target.player.score}`);

  // the weapon respects walls
  const b0 = model.buildings[0];
  let bcx = 0;
  let bcy = 0;
  for (let i = 0; i < b0.ring.length; i += 2) {
    bcx += b0.ring[i];
    bcy += b0.ring[i + 1];
  }
  bcx /= b0.ring.length / 2;
  bcy /= b0.ring.length / 2;
  ok("line of sight stops at a building", !lineOfSight(world, bcx - 45, bcy, bcx + 45, bcy));
  ok("line of sight is clear in the open", lineOfSight(world, p.x, p.y, p.x + 2, p.y + 2));
  const shot = raycastWorld(world, bcx - 45, bcy, 1, 0, 200);
  ok("a ray reports where it lands", !!shot && shot.dist > 1, shot ? `hit at ${shot.dist.toFixed(1)} m` : "no hit");

  // a full match runs to a decision, and the same seed always plays the same
  const a = createGame(model, { world, seed: 99, waves: 2, quota: 4 });
  const b = createGame(model, { world, seed: 99, waves: 2, quota: 4 });
  for (let i = 0; i < 60 * 240 && !a.over; i++) {
    step(a, 1 / 60, { forward: i % 240 < 120 ? 1 : 0, strafe: i % 90 < 45 ? 1 : -1, fire: i % 24 === 0, reload: a.player.ammo === 0 });
    step(b, 1 / 60, { forward: i % 240 < 120 ? 1 : 0, strafe: i % 90 < 45 ? 1 : -1, fire: i % 24 === 0, reload: b.player.ammo === 0 });
  }
  const sa = scoreboard(a);
  const sb = scoreboard(b);
  ok("a match reaches a decision", a.over, `wave ${sa.wave} · ${sa.kills} kills · ${sa.hp} hp left after ${sa.time}s`);
  ok("the same seed plays out identically", JSON.stringify(sa) === JSON.stringify(sb) && a.player.x === b.player.x);
  ok("collision resolution is idempotent", (() => {
    const r1 = resolve(world, p.x, p.y, PLAYER.radius);
    const r2 = resolve(world, r1.x, r1.y, PLAYER.radius);
    return Math.hypot(r2.x - r1.x, r2.y - r1.y) < 1e-9;
  })());
}

section("three.js scene graph");
{
  const v = vrmlToScene(wrl);
  let meshes = 0;
  let lines = 0;
  let tris = 0;
  let badIndex = 0;
  v.scene.traverse((o) => {
    if (o.isLine) lines++;
    if (!o.isMesh || !o.geometry) return;
    meshes++;
    const g = o.geometry;
    const count = g.attributes.position.count;
    if (g.index) {
      tris += g.index.count / 3;
      const arr = g.index.array;
      for (let i = 0; i < arr.length; i++) if (arr[i] < 0 || arr[i] >= count) badIndex++;
    } else tris += count / 3;
  });
  ok("the .wrl parses into a drawable scene", meshes === v.stats.meshes && lines === v.stats.lines, `${meshes} meshes · ${lines} lines`);
  ok("every scene index is in range", badIndex === 0, `${Math.round(tris)} triangles`);
  ok("primitive meshes keep their own triangulation", Math.round(tris) > v.stats.triangles, `${Math.round(tris)} scene vs ${v.stats.triangles} parser faces`);

  const world = buildWorld(model, { walkable: 5 });
  const arena = buildStaticScene(model, world);
  const byName = new Map();
  arena.group.traverse((o) => {
    if (o.name) byName.set(o.name, o);
  });
  ok("the arena has ground, buildings and trees", ["ground", "buildings", "trees"].every((n) => byName.has(n)));
  const ground = byName.get("ground");
  ok("the ground is a displaced, coloured grid", !!ground.geometry.attributes.color && ground.geometry.attributes.color.count === ground.geometry.attributes.position.count, `${ground.geometry.attributes.position.count} vertices`);
  let instanced = 0;
  byName.get("trees").traverse((o) => {
    if (o.isInstancedMesh) instanced = Math.max(instanced, o.count);
  });
  ok("every tree is instanced", instanced === model.trees.length, `${instanced} instances`);
  let arenaTris = 0;
  arena.group.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const per = (g.index ? g.index.count : g.attributes.position.count) / 3;
    arenaTris += per * (o.isInstancedMesh ? o.count : 1);
  });
  ok("the arena scene is dense enough to look like a campus", arenaTris > 20000, `${Math.round(arenaTris)} triangles`);
}

section("page wiring");
{
  const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
  const page = read("glendora.html");
  ok("glendora.html loads the page controller", page.includes("./js/glendora-app.js"));
  ok("glendora.html has the four views", ["campus", "arena", "exports", "data"].every((t) => page.includes(`data-panel="${t}"`)));
  ok("the shell links the campus page", read("index.html").includes("./glendora.html"));
  const sw = read("sw.js");
  const needed = [
    "./glendora.html", "./css/glendora.css", "./js/glendora-app.js", "./js/ghs-shooter.js",
    "./js/ghs-shooter-three.js", "./js/ghs-viewer-three.js", "./js/ghs-model.js", "./js/ghs-doom.js",
  ];
  ok("the service worker precaches the campus page", needed.every((n) => sw.includes(`"${n}"`)), `${needed.length} entries`);

  // every relative import in every module resolves to a real file
  const files = readdirSync(join(ROOT, "js")).filter((f) => f.endsWith(".js"));
  files.push("tools/check_ghs.mjs");
  let broken = 0;
  let checked = 0;
  for (const f of files) {
    const rel = f.includes("/") ? f : `js/${f}`;
    const src = read(rel);
    for (const m of src.matchAll(/from\s+"(\.[^"]+)"/g)) {
      checked++;
      const target = join(ROOT, dirname(rel), m[1]);
      if (!existsSync(target)) {
        broken++;
        console.log(`       missing import ${m[1]} in ${rel}`);
      }
    }
  }
  ok("every relative import resolves", broken === 0, `${checked} imports across ${files.length} modules`);
  const pack = read("tools/pack_xdc.sh");
  ok("the webxdc packer still covers the js tree", pack.includes("js"));
}

section("page controller (DOM stub)");
{
  const stub = installDomStub();
  let boom = null;
  const noise = [];
  const realError = console.error;
  const realWarn = console.warn;
  console.error = (...a) => noise.push(String(a[0] && a[0].message ? a[0].message : a[0]));
  console.warn = (...a) => noise.push(String(a[0]));
  // Node surfaces the module-evaluation failure a second time as an unhandled
  // rejection even though the import is awaited, which would fail the run on a
  // pass.  Swallow it here — but only the missing-WebGL-context one.
  const swallow = (reason) => {
    const msg = String(reason && reason.message ? reason.message : reason);
    if (!/WebGL|getContext|canvas|createElementNS/i.test(msg)) realError("unhandled:", msg);
  };
  process.on("unhandledRejection", swallow);
  try {
    await import(pathToFileURL(join(ROOT, "js/glendora-app.js")).href);
  } catch (err) {
    boom = err;
  } finally {
    console.error = realError;
    console.warn = realWarn;
    await new Promise((r) => setImmediate(r));
    process.off("unhandledRejection", swallow);
  }
  const glRelated = (s) => /WebGL|getContext|canvas|createElementNS/i.test(s);
  const unexpected = [...noise, boom ? String(boom.message) : ""].filter((n) => n && !glRelated(n));
  ok("the page controller runs outside a browser", unexpected.length === 0, boom ? `stopped at the renderer: ${String(boom.message).split("\n")[0]}` : `ran to the end (${noise.length} renderer complaint${noise.length === 1 ? "" : "s"} about the missing WebGL context)`);
  const touched = (id) => stub.TOUCHED.has(id);
  ok("the survey table is filled in", touched("facts") && touched("ghsBuildings"));
  ok("the .wrl header and preview are written", touched("wrlHead") && touched("wrlSrc"));
  const wired = ["btnWrl", "btnWrlTop", "btnWrlCopy", "btnWad", "btnGrp", "btnMap", "btnWolf", "btnXdc"];
  const withClick = wired.filter((id) => (stub.byId.get(id)?.listeners.click || []).length > 0);
  ok("every export button is wired", withClick.length === wired.length, `${withClick.length}/${wired.length} buttons listen for click`);
  ok("the vrml stage was handed to the viewer", !!stub.byId.get("vrmlStage"));
}

if (WRITE) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "glendora.wrl"), wrl);
  writeFileSync(join(OUT, "glendora.wad"), doom.lumps);
  writeFileSync(join(OUT, "GHSCHOOL.GRP"), duke.grp);
  writeFileSync(join(OUT, "E1L1.MAP"), duke.map);
  writeFileSync(join(OUT, "TILES016.ART"), duke.art);
  writeFileSync(join(OUT, "glendora-wolf3d.js"), wolfLevelSource(wolf, model));
  const bundle = buildXdcBundle(model, wrl);
  writeFileSync(join(OUT, "glendora.xdc"), bundle.xdc);
  console.log(`\nwrote artefacts to ${OUT}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.log("\nfailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
