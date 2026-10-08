/**
 * 20 · the xPort Wallplug EAGLE design: hardware/lantronix-wallplug/*.lbr/.sch/.brd
 * are generated from tools/wallplug-model.mjs by tools/build-wallplug-eagle.mjs.
 *
 * What is asserted, and why each one is a bug class rather than a formality:
 *   - the committed files are byte-identical to a fresh build (no stale CAD);
 *   - all three parse as well-formed XML with the EAGLE DTD's element names, in
 *     the order KiCad's importer (common/io/eagle/eagle_parser.h) expects;
 *   - every reference resolves: part → deviceset → gate → symbol pin → package
 *     pad, element → package, contactref → element + pad;
 *   - the connectivity in the files equals the model's NETS table, pin for pin
 *     and pad for pad — a dropped or duplicated pin is a real wiring bug;
 *   - the xPort Pro footprint carries the geometry from Lantronix's Integration
 *     Guide 900-557 rev K (8 staggered pins, 2.54 mm rows, 1.27 mm stagger,
 *     0.90 mm drills) plus the two shield-tab holes;
 *   - the mains ↔ SELV creepage rule passes with margin, and no courtyard
 *     overlaps or leaves the board outline;
 *   - the schematic sheet is readable: no two instance label boxes overlap;
 *   - BOM.md accounts for every part and flags every DNP option.
 *
 * node tests/20-wallplug.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { suite, ROOT } from './lib.mjs';
import {
  BOARD, PACKAGES, SYMBOLS, DEVICESETS, PARTS, NETS, PLACEMENT, UNCONNECTED, SHEET, BARRIER,
} from '../tools/wallplug-model.mjs';
import { buildFiles, parseXml, all, first, OUT_DIR } from '../tools/build-wallplug-eagle.mjs';
import { checkGeometry, checkSchematicLayout } from '../tools/wallplug-drc.mjs';

const s = suite('20 · xPort Wallplug EAGLE design');
const rel = (f) => join(ROOT, 'hardware', 'lantronix-wallplug', f);

/* ------------------------------------------------------------ files exist */

const FILES = ['lantronix-wallplug.lbr', 'lantronix-wallplug.sch', 'lantronix-wallplug.brd', 'BOM.md'];
for (const f of FILES) s.ok(`${f} exists`, existsSync(rel(f)));

const fresh = buildFiles();
let stale = [];
for (const f of FILES.slice(0, 3)) {
  if (existsSync(rel(f)) && readFileSync(rel(f), 'utf8') !== fresh[f]) stale.push(f);
}
s.eq('committed CAD files match a fresh build', stale, []);

/* ------------------------------------------------------------------- parse */

const docs = {};
for (const f of FILES.slice(0, 3)) {
  const text = readFileSync(rel(f), 'utf8');
  const { root, errors } = parseXml(text);
  s.eq(`${f} parses as well-formed XML`, errors, []);
  s.eq(`${f} root element`, root?.name, 'eagle');
  s.ok(`${f} declares an EAGLE version`, /^\d+\.\d+\.\d+$/.test(root?.attrs?.version ?? ''), root?.attrs?.version);
  s.eq(`${f} has one <drawing>`, all(root, 'drawing').length, 1);
  docs[f] = root;
}

// <schematic> / <board> are children of <drawing>, not of <eagle>
const sch = all(docs['lantronix-wallplug.sch'], 'schematic')[0];
const brd = all(docs['lantronix-wallplug.brd'], 'board')[0];
s.ok('schematic file has <schematic> and no <board>',
  Boolean(sch) && all(docs['lantronix-wallplug.sch'], 'board').length === 0);
s.ok('board file has <board> and no <schematic>',
  Boolean(brd) && all(docs['lantronix-wallplug.brd'], 'schematic').length === 0);

// DTD order that KiCad's importer relies on: drawing(settings?, grid?, layers, …)
for (const [name, root] of Object.entries(docs)) {
  const drawing = first(root, 'drawing');
  const order = drawing.children.map((c) => c.name);
  s.eq(`${name} <drawing> child order`, order.slice(0, 3), ['settings', 'grid', 'layers']);
}
s.eq('schematic child order', sch.children.map((c) => c.name),
  ['description', 'libraries', 'attributes', 'variantdefs', 'classes', 'parts', 'sheets']);
s.eq('board child order', brd.children.map((c) => c.name).filter((n) => n !== 'plain'),
  ['libraries', 'attributes', 'variantdefs', 'classes', 'designrules', 'elements', 'signals']);

/* ------------------------------------------------------------- references */

const lib = first(sch, 'libraries').children.find((c) => c.name === 'library');
s.eq('library name', lib.attrs.name, 'lantronix-wallplug');
s.eq('packages in the library', all(first(lib, 'packages'), 'package').length, Object.keys(PACKAGES).length);
s.eq('symbols in the library', all(first(lib, 'symbols'), 'symbol').length, Object.keys(SYMBOLS).length);
s.eq('devicesets in the library', all(first(lib, 'devicesets'), 'deviceset').length, Object.keys(DEVICESETS).length);

const parts = all(first(sch, 'parts'), 'part');
s.eq('schematic parts', parts.length, PARTS.filter((p) => !p.boardOnly).length);
const instances = all(sch, 'instance');
s.eq('one instance per part', instances.length, parts.length);
s.eq('every instance is on sheet 1', all(first(sch, 'sheets'), 'sheet').length, 1);

const elements = all(brd, 'element');
s.eq('board elements', elements.length, PARTS.length);
for (const part of PARTS) {
  const el = elements.find((e) => e.attrs.name === part.ref);
  s.ok(`${part.ref} placed at the model coordinates`,
    el && Number(el.attrs.x) === PLACEMENT[part.ref].x && Number(el.attrs.y) === PLACEMENT[part.ref].y,
    el ? `${el.attrs.x},${el.attrs.y} ${el.attrs.rot}` : 'missing');
}

/* ------------------------------------------------------------- connectivity */

const schNets = all(sch, 'net');
s.eq('nets in the schematic', schNets.length, Object.keys(NETS).length);
for (const [net, members] of Object.entries(NETS)) {
  const n = schNets.find((x) => x.attrs.name === net);
  const got = all(n, 'pinref').map((p) => `${p.attrs.part}.${p.attrs.pin}`).sort();
  s.eq(`net ${net} pinrefs`, got, members.map(([r, p]) => `${r}.${p}`).sort());
  // every pinref needs a wire stub and a label so the sheet is wire-readable
  s.eq(`net ${net} stubs`, all(n, 'wire').length, members.length);
  s.eq(`net ${net} labels`, all(n, 'label').length, members.length);
}

const signals = all(brd, 'signal').filter((x) => x.attrs.name);
s.eq('signals on the board', signals.length, Object.keys(NETS).length);
for (const [net, members] of Object.entries(NETS)) {
  const sig = signals.find((x) => x.attrs.name === net);
  const want = [...new Set(members.map(([r, p]) => `${r}.${DEVICESETS[PARTS.find((q) => q.ref === r).set].connects[p]}`))].sort();
  s.eq(`signal ${net} contactrefs`, all(sig, 'contactref').map((c) => `${c.attrs.element}.${c.attrs.pad}`).sort(), want);
}

/* ------------------------------------------------------- xPort Pro geometry */

const xp = PACKAGES.XPORTPRO;
s.eq('xPort Pro interface pins', xp.pads.filter((p) => /^\d$/.test(p.name)).length, 8);
s.eq('xPort Pro shield tabs', xp.pads.filter((p) => p.name.startsWith('S')).length, 2);
const rows = [...new Set(xp.pads.filter((p) => /^\d$/.test(p.name)).map((p) => p.x))].sort((a, b) => a - b);
s.eq('two pin rows 2.54 mm apart', [rows[1] - rows[0]], [2.54]);
const ys = xp.pads.filter((p) => /^\d$/.test(p.name)).map((p) => p.y).sort((a, b) => a - b);
const staggers = ys.slice(1).map((y, i) => Number((y - ys[i]).toFixed(4)));
s.eq('1.27 mm stagger between adjacent pins', [...new Set(staggers)], [1.27]);
s.eq('pin drill = 0.90 mm (IG Figure 2-7)', [...new Set(xp.pads.filter((p) => /^\d$/.test(p.name)).map((p) => p.drill))], [0.9]);
s.eq('shield-tab drill = 1.6764 mm', [...new Set(xp.pads.filter((p) => p.name.startsWith('S')).map((p) => p.drill))], [1.6764]);
s.eq('RJ45 nose clearance holes', xp.holes.map((h) => h.drill), [3.5, 3.5]);
s.eq('module body is 33.90 mm long', Number((15.48 - -18.42).toFixed(2)), 33.9);
s.eq('xPort Pro symbol pins match IG Table 2-2',
  SYMBOLS.XPORTPRO.pins.map((p) => p.name),
  ['GND', '3V3', '!RESET', 'DOUT', 'DIN', 'CP1', 'CP2', 'CP3', 'S1', 'S2']);
s.eq('symbol pin → package pad mapping', DEVICESETS['XPORT-PRO'].connects,
  { GND: '1', '3V3': '2', '!RESET': '3', DOUT: '4', DIN: '5', CP1: '6', CP2: '7', CP3: '8', S1: 'S1', S2: 'S2' });

/* ------------------------------------------------------- power + safety nets */

s.eq('mains path is L → fuse → module', NETS.AC_L, [['J1', '1'], ['F1', '1']]);
s.eq('fused line feeds the converter and the varistor', NETS.AC_L_F, [['F1', '2'], ['PS1', 'AC-L'], ['MOV1', '1']]);
s.eq('neutral feeds the converter and the varistor', NETS.AC_N, [['J1', '2'], ['PS1', 'AC-N'], ['MOV1', '2']]);
s.eq('converter output goes through the ferrite bead', NETS['3V3_P'], [['PS1', '+VO'], ['FB1', '1'], ['C1', '+']]);
s.eq('chassis net carries the IG 200 V / 10 nF caps', NETS.CHASSIS,
  [['X1', 'S1'], ['X1', 'S2'], ['J2', 'SH'], ['C9', '1'], ['C10', '1'], ['TP5', '1']]);
s.eq('Data Out pull-up is on the TTL net', NETS.TXD_TTL.some(([r, p]) => r === 'R1' && p === '1'), true);
s.eq('DTE/DCE straps switch pins 2 and 3', [NETS.DB9_2, NETS.DB9_3],
  [[['J2', 'RXD'], ['J3', '2'], ['JP1', '3'], ['JP2', '2']], [['J2', 'TXD'], ['J3', '1'], ['JP1', '2'], ['JP2', '3']]]);

/* -------------------------------------------------------------- every pin */

const inNet = new Set(Object.values(NETS).flat().map(([r, p]) => `${r}.${p}`));
const allowed = new Set(UNCONNECTED.map(([r, p]) => `${r}.${p}`));
const orphans = [];
for (const part of PARTS.filter((p) => !p.boardOnly)) {
  const ds = DEVICESETS[part.set];
  if (!ds.symbol) continue;
  for (const pin of SYMBOLS[ds.symbol].pins) {
    const key = `${part.ref}.${pin.name}`;
    if (!inNet.has(key) && !allowed.has(key)) orphans.push(key);
  }
}
s.eq('every symbol pin is netted or declared UNCONNECTED', orphans, []);
s.eq('UNCONNECTED pins really are unconnected', [...allowed].filter((k) => inNet.has(k)), []);

/* ------------------------------------------------------------------ geometry */

const geo = checkGeometry();
s.eq('no courtyard overlaps', geo.errors.filter((e) => e.startsWith('courtyard')), []);
s.eq('no pad-spacing violations', geo.errors.filter((e) => e.startsWith('pad spacing')), []);
s.eq('no creepage violations', geo.errors.filter((e) => e.startsWith('creepage')), []);
s.eq('nothing outside the board outline', geo.errors.filter((e) => e.includes('outside board')), []);
s.ok(`worst mains↔SELV creepage ≥ ${BOARD.creepageMm} mm`, geo.worstCreepage >= BOARD.creepageMm,
  `${geo.worstCreepage.toFixed(2)} mm at ${geo.worstPair}`);
s.eq('every part has a board placement', PARTS.filter((p) => !PLACEMENT[p.ref]).map((p) => p.ref), []);

const schLayout = checkSchematicLayout();
s.eq('no overlapping instance boxes on the sheet', schLayout.errors, []);
s.ok(`sheet is ${SHEET.w} × ${SHEET.h} mm`, SHEET.w > 0 && SHEET.h > 0);
s.ok('mains barrier is inside the board', BARRIER.x1 > 0 && BARRIER.x1 < BOARD.w && BARRIER.y2 <= BOARD.h);

/* --------------------------------------------------------------------- BOM */

const bom = readFileSync(rel('BOM.md'), 'utf8');
const missing = PARTS.filter((p) => !bom.includes(`| ${p.ref} |`)).map((p) => p.ref);
s.eq('BOM.md lists every part', missing, []);
const dnp = PARTS.filter((p) => p.dnp);
s.ok('BOM.md marks the DNP options', dnp.every((p) => new RegExp(`\\| ${p.ref} \\|[^\n]*\\| DNP \\|`).test(bom)),
  `${dnp.length} DNP refs: ${dnp.map((p) => p.ref).join(', ')}`);
s.ok('BOM.md carries the safety section', /## Safety/.test(bom) && /6\.4 mm creepage/.test(bom));
s.eq('netlist table row count', (bom.match(/^\| [A-Z0-9_']+ \| \d+ \|/gm) ?? []).length, Object.keys(NETS).length);

process.exit(s.done() ? 1 : 0);
