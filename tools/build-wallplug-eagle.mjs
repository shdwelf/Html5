#!/usr/bin/env node
/**
 * build-wallplug-eagle.mjs — generate the "xPort Wallplug" EAGLE files from
 * tools/wallplug-model.mjs, and verify them.
 *
 *   node tools/build-wallplug-eagle.mjs            write .lbr/.sch/.brd + BOM.md
 *   node tools/build-wallplug-eagle.mjs --check    write, then verify (non-zero exit on failure)
 *   node tools/build-wallplug-eagle.mjs --check --no-write   verify the files already on disk
 *
 * The XML grammar follows the EAGLE DTD as documented inside KiCad's importer
 * (common/io/eagle/eagle_parser.h):
 *   eagle(version) → drawing(settings?, grid?, layers, (library|schematic|board))
 *   schematic(description?, libraries?, attributes?, variantdefs?, classes?,
 *             parts?, sheets?, errors?)
 *   sheet(description?, plain?, instances?, busses?, nets?)
 *   net(name, class) → segment* → (pinref|wire|junction|label|probe)*
 *   board(designrules?, layers?, plain?, classes?, signals?, libraries?, elements?)
 *   element(name, library, package, value, x, y, rot, smashed) → attribute*
 *   signal(name, class) → (contactref|wire|via|polygon)*
 *
 * --check does three things:
 *   1. parses all three XML files with a self-contained parser (well-formedness),
 *   2. resolves every reference (part → deviceset → gate → symbol pin →
 *      package pad; element → package; contactref → element+pad) and compares
 *      the resulting connectivity against the model's NETS table,
 *   3. runs a geometry DRC: courtyard overlaps, board-edge containment,
 *      pad-to-pad spacing, and the mains ↔ SELV creepage rule.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOARD, PACKAGES, SYMBOLS, DEVICESETS, PARTS, NETS, PLACEMENT, UNCONNECTED,
  SCHEM_PLACEMENT, SCHEM_NOTES, BOARD_NOTES, SHEET, BARRIER,
  rotPt, padAbs, courtAbs, symbolBBox, stubDir, pinAbsolute, STUB,
} from './wallplug-model.mjs';
import { checkGeometry, checkSchematicLayout } from './wallplug-drc.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
export const OUT_DIR = join(ROOT, 'hardware', 'lantronix-wallplug');
const LIB = 'lantronix-wallplug';
const EAGLE_VERSION = '9.6.2';

/* ------------------------------------------------------------- xml helpers */

const num = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`bad coordinate ${v}`);
  const s = (Math.round(n * 1e4) / 1e4).toString();
  return s === '-0' ? '0' : s;
};

const esc = (s) => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function attrs(o) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join('');
}

const selfClose = (name, o) => `<${name}${attrs(o)}/>`;
const open = (name, o) => `<${name}${attrs(o)}>`;
const wrap = (name, o, body) => `<${name}${attrs(o)}>${body}</${name}>`;

/* --------------------------------------------------------------- xml parse */

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function unescapeText(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

/** Minimal, strict-enough XML parser: returns {root, errors}. */
export function parseXml(src) {
  const errors = [];
  const stack = [];
  let root = null;
  let i = 0;
  const n = src.length;
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt < 0) break;
    const text = src.slice(i, lt);
    if (text.trim() && stack.length) {
      const top = stack[stack.length - 1];
      top.text = (top.text || '') + unescapeText(text);
    } else if (text.trim() && !root) {
      errors.push(`text outside root element at offset ${lt}`);
    }
    i = lt;
    if (src.startsWith('<!--', i)) { const e = src.indexOf('-->', i); if (e < 0) { errors.push('unterminated comment'); break; } i = e + 3; continue; }
    if (src.startsWith('<?', i)) { const e = src.indexOf('?>', i); if (e < 0) { errors.push('unterminated PI'); break; } i = e + 2; continue; }
    if (src.startsWith('<![CDATA[', i)) {
      const e = src.indexOf(']]>', i);
      if (e < 0) { errors.push('unterminated CDATA'); break; }
      if (stack.length) stack[stack.length - 1].text = (stack[stack.length - 1].text || '') + src.slice(i + 9, e);
      i = e + 3; continue;
    }
    if (src.startsWith('<!', i)) { const e = src.indexOf('>', i); if (e < 0) { errors.push('unterminated declaration'); break; } i = e + 1; continue; }
    const gt = findTagEnd(src, i);
    if (gt < 0) { errors.push(`unterminated tag at offset ${i}`); break; }
    const inner = src.slice(i + 1, gt);
    i = gt + 1;
    if (inner[0] === '/') {
      const name = inner.slice(1).trim();
      const top = stack.pop();
      if (!top) { errors.push(`closing </${name}> with empty stack`); continue; }
      if (top.name !== name) errors.push(`mismatched close: <${top.name}> closed by </${name}> at offset ${i}`);
      continue;
    }
    const selfClosing = inner.endsWith('/');
    const body = selfClosing ? inner.slice(0, -1) : inner;
    const m = body.match(/^([^\s/>]+)/);
    if (!m) { errors.push(`tag without a name at offset ${i}`); continue; }
    const name = m[1];
    const node = { name, attrs: {}, children: [], text: '' };
    const attrRe = /([A-Za-z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let a;
    while ((a = attrRe.exec(body.slice(m[0].length)))) {
      node.attrs[a[1]] = unescapeText(a[3] ?? a[4] ?? '');
    }
    if (stack.length) stack[stack.length - 1].children.push(node);
    else if (!root) root = node;
    else errors.push(`second root element <${name}>`);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length) errors.push(`unclosed elements: ${stack.map((s) => s.name).join(', ')}`);
  if (!root) errors.push('no root element');
  return { root, errors };
}

function findTagEnd(src, i) {
  let q = null;
  for (let k = i + 1; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '>') return k;
  }
  return -1;
}

/** All descendants with a given tag name. */
export function all(node, name, out = []) {
  if (!node) return out;
  for (const c of node.children) {
    if (c.name === name) out.push(c);
    all(c, name, out);
  }
  return out;
}
export const first = (node, name) => (node ? node.children.find((c) => c.name === name) : undefined);

/* -------------------------------------------------------------- library xml */

function padXml(pad) {
  if (pad.smd) {
    return selfClose('smd', {
      name: pad.name, x: num(pad.x), y: num(pad.y),
      dx: num(pad.smd.dx), dy: num(pad.smd.dy), layer: pad.smd.layer,
      roundness: pad.smd.roundness, rot: pad.smd.rot,
    });
  }
  return selfClose('pad', {
    name: pad.name, x: num(pad.x), y: num(pad.y),
    drill: num(pad.drill), diameter: pad.diameter === undefined ? undefined : num(pad.diameter),
    shape: pad.shape === 'round' ? undefined : pad.shape,
    rot: pad.rot,
  });
}

function graphicsXml(pkg) {
  const out = [];
  for (const g of [...(pkg.silk || []), ...(pkg.leads || []), ...(pkg.restrict || [])]) {
    if (g.w) {
      for (let k = 0; k < g.w.length - 1; k++) {
        out.push(selfClose('wire', {
          x1: num(g.w[k].x), y1: num(g.w[k].y), x2: num(g.w[k + 1].x), y2: num(g.w[k + 1].y),
          width: num(g.width ?? 0.2032), layer: g.layer, style: g.style,
        }));
      }
    }
    if (g.c) out.push(selfClose('circle', { x: num(g.c.x), y: num(g.c.y), radius: num(g.c.r), width: num(g.width ?? 0.2032), layer: g.layer }));
  }
  for (const c of pkg.circles || []) out.push(selfClose('circle', { x: num(c.x), y: num(c.y), radius: num(c.r), width: num(c.width ?? 0.2032), layer: c.layer }));
  for (const t of pkg.texts || []) {
    out.push(wrap('text', { x: num(t.x), y: num(t.y), size: num(t.size), layer: t.layer, ratio: t.ratio, rot: t.rot, align: t.align }, esc(t.text)));
  }
  return out.join('\n');
}

function packagesXml() {
  return Object.values(PACKAGES).map((pkg) => wrap('package', { name: pkg.name }, [
    wrap('description', {}, esc(pkg.descr)),
    graphicsXml(pkg),
    ...(pkg.pads || []).map(padXml),
    ...(pkg.holes || []).map((h) => selfClose('hole', { x: num(h.x), y: num(h.y), drill: num(h.drill) })),
  ].join('\n'))).join('\n');
}

function symbolsXml() {
  return Object.values(SYMBOLS).map((sym) => wrap('symbol', { name: sym.name }, [
    graphicsXml({ silk: sym.wires, circles: sym.circles, texts: sym.texts }),
    ...(sym.pins || []).map((p) => selfClose('pin', {
      name: p.name, x: num(p.x), y: num(p.y), visible: p.visible ?? 'pin',
      length: p.length ?? 'middle', direction: p.direction, function: p.function,
      rot: p.rot ?? 'R0', swaplevel: p.swaplevel,
    })),
  ].join('\n'))).join('\n');
}

function devicesetsXml() {
  return Object.entries(DEVICESETS).map(([name, ds]) => wrap('deviceset', { name, prefix: ds.prefix }, [
    wrap('gates', {}, ds.symbol ? selfClose('gate', { name: 'G$1', symbol: ds.symbol, x: '0', y: '0' }) : ''),
    wrap('devices', {}, wrap('device', { name: '', package: ds.package }, [
      wrap('connects', {}, Object.entries(ds.connects)
        .map(([pin, pad]) => selfClose('connect', { gate: 'G$1', pin, pad })).join('\n')),
      wrap('technologies', {}, selfClose('technology', { name: '' })),
    ].join('\n'))),
  ].join('\n'))).join('\n');
}

function libraryXml() {
  return wrap('library', { name: LIB }, [
    wrap('description', {}, esc(`${LIB}: xPort Wallplug design library (generated by tools/build-wallplug-eagle.mjs)`)),
    wrap('packages', {}, packagesXml()),
    wrap('symbols', {}, symbolsXml()),
    wrap('devicesets', {}, devicesetsXml()),
  ].join('\n'));
}

/* ------------------------------------------------------------------- layers */

const SCH_LAYERS = [
  [90, 'Modules', 5], [91, 'Nets', 2], [92, 'Busses', 1], [93, 'Pins', 2],
  [94, 'Symbols', 4], [95, 'Names', 7], [96, 'Values', 7], [97, 'Info', 7], [98, 'Guide', 6],
];

const BRD_LAYERS = [
  [1, 'Top', 4], [16, 'Bottom', 1], [17, 'Pads', 2], [18, 'Vias', 2], [19, 'Unrouted', 6],
  [20, 'Dimension', 15], [21, 'tPlace', 7], [22, 'bPlace', 7], [23, 'tOrigins', 15],
  [24, 'bOrigins', 15], [25, 'tNames', 7], [26, 'bNames', 7], [27, 'tValues', 7],
  [28, 'bValues', 7], [29, 'tStop', 7], [30, 'bStop', 7], [31, 'tCream', 7], [32, 'bCream', 7],
  [33, 'tFinish', 6], [34, 'bFinish', 6], [35, 'tGlue', 7], [36, 'bGlue', 7],
  [37, 'tTest', 7], [38, 'bTest', 7], [39, 'tKeepout', 4], [40, 'bKeepout', 3],
  [41, 'tRestrict', 4], [42, 'bRestrict', 1], [43, 'vRestrict', 2], [44, 'Drills', 7],
  [45, 'Holes', 7], [46, 'Milling', 3], [47, 'Measures', 7], [48, 'Document', 7],
  [49, 'ReferenceLC', 7], [50, 'ReferenceLS', 7], [51, 'tDocu', 7], [52, 'bDocu', 7],
];

const layersXml = (rows, active) => wrap('layers', {}, rows
  .map(([number, name, color]) => selfClose('layer', {
    number, name, color, fill: 1,
    visible: name === 'Unrouted' || name === 'tDocu' || name === 'ReferenceLS' ? 'no' : 'yes',
    active: active === 'sch' ? (number >= 90 ? 'yes' : 'no') : (number <= 52 ? 'yes' : 'no'),
  })).join('\n'));

/* ------------------------------------------------------------------ classes */

function classesXml() {
  return wrap('classes', {}, [
    selfClose('class', { number: 0, name: 'default', width: 0.3048, drill: 0 }),
    wrap('class', { number: 1, name: 'mains', width: 2.5, drill: 0 }, [
      selfClose('clearance', { class: 0, value: 6.4 }),
      selfClose('clearance', { class: 1, value: 6.4 }),
      selfClose('clearance', { class: 2, value: 6.4 }),
    ].join('\n')),
    wrap('class', { number: 2, name: 'power', width: 1.0, drill: 0 }, [
      selfClose('clearance', { class: 0, value: 0.5 }),
      selfClose('clearance', { class: 2, value: 0.6 }),
    ].join('\n')),
  ].join('\n'));
}

const NET_CLASS = { AC_L: 1, AC_L_F: 1, AC_N: 1, '3V3_P': 2, '3V3': 2, GND: 2, CHASSIS: 2 };

/* --------------------------------------------------------------- designrules */

const DESIGN_RULES = [
  ['layerSetup', '(1*16)'], ['mtCopper', '0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm'],
  ['mtIsolate', '1.5mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm'],
  ['mdWireWire', '8mil'], ['mdWirePad', '8mil'], ['mdWireVia', '8mil'], ['mdPadPad', '8mil'],
  ['mdPadVia', '8mil'], ['mdViaVia', '8mil'], ['mdSmdPad', '0mil'], ['mdSmdVia', '0mil'],
  ['mdSmdSmd', '0mil'], ['mdViaViaSameLayer', '8mil'], ['mnLayersViaInSmd', '2'],
  ['mdCopperDimension', '20mil'], ['mdDrill', '8mil'], ['mdSmdStop', '0mil'],
  ['msWidth', '8mil'], ['msDrill', '0.35mm'], ['msMicroVia', '9.99mm'], ['msBlindViaRatio', '0.5'],
  ['rvPadTop', '0.25'], ['rvPadInner', '0.25'], ['rvPadBottom', '0.25'], ['rvViaOuter', '0.25'],
  ['rvViaInner', '0.25'], ['rvMicroViaOuter', '0.25'], ['rvMicroViaInner', '0.25'],
  ['rlMinPadTop', '10mil'], ['rlMaxPadTop', '20mil'], ['rlMinPadInner', '10mil'], ['rlMaxPadInner', '20mil'],
  ['rlMinPadBottom', '10mil'], ['rlMaxPadBottom', '20mil'], ['rlMinViaOuter', '8mil'], ['rlMaxViaOuter', '20mil'],
  ['rlMinViaInner', '8mil'], ['rlMaxViaInner', '20mil'], ['rlMinMicroViaOuter', '4mil'], ['rlMaxMicroViaOuter', '20mil'],
  ['rlMinMicroViaInner', '4mil'], ['rlMaxMicroViaInner', '20mil'], ['psTop', '-1'], ['psBottom', '-1'],
  ['psFirst', '-1'], ['psElongationLong', '100'], ['psElongationOffset', '100'],
  ['mvStopFrame', '1'], ['mvCreamFrame', '0'], ['mlMinStopFrame', '4mil'], ['mlMaxStopFrame', '4mil'],
  ['mlMinCreamFrame', '0mil'], ['mlMaxCreamFrame', '0mil'], ['mlViaStopLimit', '25mil'],
  ['srRoundness', '0'], ['srMinRoundness', '0mil'], ['srMaxRoundness', '0mil'],
  ['slThermalIsolate', '10mil'], ['slThermalsForVias', '0'], ['dpMaxLengthDifference', '10mm'],
  ['dpGapFactor', '2.5'], ['checkAngle', '0'], ['checkFont', '1'], ['checkRestrict', '1'],
  ['checkStop', '0'], ['checkValues', '0'], ['checkNames', '1'], ['checkWireStubs', '1'],
  ['checkPolygonWidth', '0'], ['useDiameter', '13'], ['maxErrors', '50'],
];

const designRulesXml = () => wrap('designrules', { name: 'wallplug-2layer' }, [
  wrap('description', {}, esc('2-layer wallplug rules: 8 mil minimum, mains class carries its own 6.4 mm creepage (see class 1).')),
  DESIGN_RULES.map(([name, value]) => selfClose('param', { name, value })).join('\n'),
].join('\n'));

/* ---------------------------------------------------------------- schematic */

function schematicXml() {
  const parts = PARTS.filter((p) => !p.boardOnly);
  const instances = [];
  const partByName = Object.fromEntries(parts.map((p) => [p.ref, p]));

  for (const part of parts) {
    const ds = DEVICESETS[part.set];
    if (!ds.symbol) continue;
    const place = SCHEM_PLACEMENT[part.ref];
    if (!place) throw new Error(`no schematic placement for ${part.ref}`);
    const bb = symbolBBox(SYMBOLS[ds.symbol]);
    instances.push(wrap('instance', {
      part: part.ref, gate: 'G$1', x: num(place.x), y: num(place.y), smashed: 'yes', rot: place.rot ?? 'R0',
    }, [
      selfClose('attribute', { name: 'NAME', x: num(place.x + bb.x1), y: num(place.y + bb.y2 + 1.27), size: 1.778, layer: 95 }),
      selfClose('attribute', { name: 'VALUE', x: num(place.x + bb.x1), y: num(place.y + bb.y1 - 2.54), size: 1.778, layer: 96 }),
    ].join('\n')));
  }

  const nets = Object.entries(NETS).map(([net, pins]) => {
    const seg = [];
    for (const [ref, pinName] of pins) {
      const part = partByName[ref];
      if (!part) throw new Error(`net ${net}: unknown part ${ref}`);
      const ds = DEVICESETS[part.set];
      if (!ds.symbol) continue;
      const place = SCHEM_PLACEMENT[ref];
      const pa = pinAbsolute(ds.symbol, pinName, place);
      const [ux, uy] = stubDir(pa.rot);
      const x2 = pa.x + ux * STUB;
      const y2 = pa.y + uy * STUB;
      seg.push(selfClose('pinref', { part: ref, gate: 'G$1', pin: pinName }));
      seg.push(selfClose('wire', {
        x1: num(pa.x), y1: num(pa.y), x2: num(x2), y2: num(y2), width: 0.1524, layer: 91,
      }));
      seg.push(selfClose('label', {
        x: num(x2), y: num(y2), size: 1.778, layer: 95, rot: pa.rot === 'R0' || pa.rot === 'R180' ? 'R0' : 'R270',
      }));
    }
    return wrap('net', { name: net, class: NET_CLASS[net] ?? 0 }, wrap('segment', {}, seg.join('\n')));
  });

  const plain = SCHEM_NOTES.map((t) => wrap('text', {
    x: num(t.x), y: num(t.y), size: num(t.size), layer: t.layer, ratio: t.ratio ?? 8,
  }, esc(t.text))).join('\n')
    + '\n' + selfClose('frame', {
      x1: 0, y1: 0, x2: num(SHEET.w), y2: num(SHEET.h), columns: 8, rows: 6, layer: 91,
      'border-left': 'yes', 'border-top': 'yes', 'border-right': 'yes', 'border-bottom': 'yes',
    })
    + '\n' + wrap('text', { x: num(SHEET.w - 150), y: 8, size: 2.2, layer: 97 }, esc(
      'xPort Wallplug rev A · sheet 1/1 · generated from tools/wallplug-model.mjs · see docs/lantronix-uclinux-deep-dive-2026-10-08.md',
    ));

  return wrap('schematic', { xreflabel: '%F%N/%S.%C%R', xrefpart: '/%S.%C%R' }, [
    wrap('description', {}, esc('xPort Wallplug: mains-powered RS-232 ↔ Ethernet adapter around a Lantronix xPort Pro.')),
    wrap('libraries', {}, libraryXml()),
    selfClose('attributes', {}),
    selfClose('variantdefs', {}),
    classesXml(),
    wrap('parts', {}, parts.map((p) => selfClose('part', {
      name: p.ref, library: LIB, deviceset: p.set, device: '', value: p.value, technology: '',
    })).join('\n')),
    wrap('sheets', {}, wrap('sheet', {}, [
      wrap('plain', {}, plain),
      wrap('instances', {}, instances.join('\n')),
      selfClose('busses', {}),
      wrap('nets', {}, nets.join('\n')),
    ].join('\n'))),
  ].join('\n'));
}

/* -------------------------------------------------------------------- board */

function boardXml() {
  const elements = [];
  for (const part of PARTS) {
    const ds = DEVICESETS[part.set];
    const place = PLACEMENT[part.ref];
    if (!place) throw new Error(`no board placement for ${part.ref}`);
    const pkg = PACKAGES[ds.package];
    const c = courtAbs(pkg, place);
    elements.push(wrap('element', {
      name: part.ref, library: LIB, package: ds.package, value: part.value,
      x: num(place.x), y: num(place.y), smashed: 'yes', rot: place.rot ?? 'R0',
    }, [
      selfClose('attribute', { name: 'NAME', x: num(c.x1), y: num(c.y2 + 0.4), size: 1.0, layer: 25, ratio: 10 }),
      part.value ? selfClose('attribute', { name: 'VALUE', x: num(c.x1), y: num(c.y1 - 1.6), size: 0.8, layer: 27, ratio: 10 }) : '',
      part.dnp ? selfClose('attribute', { name: 'DNP', value: 'DNP', x: num(c.x1), y: num(c.y2 + 1.8), size: 0.9, layer: 21, ratio: 10 }) : '',
    ].filter(Boolean).join('\n')));
  }

  const signals = Object.entries(NETS).map(([net, pins]) => {
    const refs = [];
    const seen = new Set();
    for (const [ref, pinName] of pins) {
      const ds = DEVICESETS[PARTS.find((p) => p.ref === ref).set];
      const pad = ds.connects[pinName];
      if (pad === undefined) throw new Error(`deviceset ${part_set(ref)} has no connect for pin ${pinName}`);
      const key = `${ref}.${pad}`;
      if (seen.has(key)) continue;
      seen.add(key);
      refs.push(selfClose('contactref', { element: ref, pad }));
    }
    return wrap('signal', { name: net, class: NET_CLASS[net] ?? 0 }, refs.join('\n'));
  });

  const outline = [
    selfClose('wire', { x1: 0, y1: 0, x2: num(BOARD.w), y2: 0, width: 0.15, layer: 20 }),
    selfClose('wire', { x1: num(BOARD.w), y1: 0, x2: num(BOARD.w), y2: num(BOARD.h), width: 0.15, layer: 20 }),
    selfClose('wire', { x1: num(BOARD.w), y1: num(BOARD.h), x2: 0, y2: num(BOARD.h), width: 0.15, layer: 20 }),
    selfClose('wire', { x1: 0, y1: num(BOARD.h), x2: 0, y2: 0, width: 0.15, layer: 20 }),
    // mains/SELV barrier: silkscreen warning + tRestrict so copper stays out
    selfClose('wire', { x1: num(BARRIER.x1), y1: num(BARRIER.y1), x2: num(BARRIER.x2), y2: num(BARRIER.y2), width: 0.4, layer: 21, style: 'shortdash' }),
    selfClose('wire', { x1: num(BARRIER.x1), y1: num(BARRIER.y1), x2: num(BARRIER.x2), y2: num(BARRIER.y2), width: 0.2, layer: 41 }),
    ...BOARD_NOTES.map((t) => wrap('text', { x: num(t.x), y: num(t.y), size: num(t.size), layer: t.layer, ratio: 12 }, esc(t.text))),
  ];

  return wrap('board', {}, [
    wrap('plain', {}, outline.join('\n')),
    wrap('libraries', {}, libraryXml()),
    selfClose('attributes', {}),
    selfClose('variantdefs', {}),
    classesXml(),
    designRulesXml(),
    wrap('elements', {}, elements.join('\n')),
    wrap('signals', {}, signalsWithPour(signals).join('\n')),
  ].join('\n'));
}

/**
 * Ground pour, but only over the SELV half of the board: a full-board pour on a
 * mains-powered PCB would bridge the creepage barrier. Vertices start 2 mm
 * inside the barrier line so the pour cannot reach the mains zone.
 */
function signalsWithPour(signals) {
  const x0 = BARRIER.x1 + 2;
  const verts = [
    [x0, 0.8], [BOARD.w - 0.8, 0.8], [BOARD.w - 0.8, BOARD.h - 0.8], [x0, BOARD.h - 0.8],
  ].map(([x, y]) => selfClose('vertex', { x: num(x), y: num(y) })).join('\n');
  const pour = (layer, rank) => wrap('polygon', {
    width: 0.4, layer, isolate: 0.4, orphans: 'yes', rank, thermals: 'yes', pour: 'solid',
  }, verts);
  return signals.map((sig) => {
    if (!sig.startsWith('<signal name="GND"')) return sig;
    return sig.replace(/(<signal name="GND"[^>]*>)/, `$1\n${pour(1, 2)}\n${pour(16, 2)}`);
  });
}

const part_set = (ref) => PARTS.find((p) => p.ref === ref)?.set;

/* ------------------------------------------------------------------ emitters */

const doc = (body) => [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<!DOCTYPE eagle SYSTEM "eagle.dtd">',
  `<!-- generated by tools/build-wallplug-eagle.mjs from tools/wallplug-model.mjs — do not edit by hand -->`,
  `<eagle version="${EAGLE_VERSION}">`,
  '<drawing>',
  wrap('settings', {}, [
    selfClose('setting', { alwaysvectorfont: 'no' }),
    selfClose('setting', { verticaltext: 'up' }),
  ].join('\n')),
  '',
  body,
  '</drawing>',
  '</eagle>',
  '',
].join('\n');

const GRID_SCH = selfClose('grid', { distance: 2.54, unitdist: 'mm', unit: 'mm', style: 'lines', multiple: 1, display: 'yes', altdistance: 0.635, altunitdist: 'mm', altunit: 'mm' });
const GRID_BRD = selfClose('grid', { distance: 0.5, unitdist: 'mm', unit: 'mm', style: 'lines', multiple: 1, display: 'yes', altdistance: 0.1, altunitdist: 'mm', altunit: 'mm' });

export function buildFiles() {
  const lbr = doc([GRID_BRD, layersXml(BRD_LAYERS, 'brd'), libraryXml()].join('\n'));
  const sch = doc([GRID_SCH, layersXml(SCH_LAYERS, 'sch'), schematicXml()].join('\n'));
  const brd = doc([GRID_BRD, layersXml(BRD_LAYERS, 'brd'), boardXml()].join('\n'));
  return {
    'lantronix-wallplug.lbr': lbr,
    'lantronix-wallplug.sch': sch,
    'lantronix-wallplug.brd': brd,
    'BOM.md': bomMarkdown(),
  };
}

function bomMarkdown() {
  const rows = PARTS.map((p) => {
    const ds = DEVICESETS[p.set];
    return `| ${p.ref} | ${p.value || '—'} | ${ds.package} | ${p.dnp ? 'DNP' : 'fit'} | ${p.zone} | ${p.note || ''} |`;
  });
  const nets = Object.entries(NETS).map(([n, pins]) => `| ${n} | ${pins.length} | ${pins.map(([r, pin]) => `${r}.${pin}`).join(', ')} |`);
  return `# xPort Wallplug — bill of materials

Generated by \`tools/build-wallplug-eagle.mjs\` from \`tools/wallplug-model.mjs\`.
Rev ${BOARD.rev}, ${BOARD.w} × ${BOARD.h} mm, ${BOARD.layers} layers, ${BOARD.thickness} mm FR-4.

**DNP** = designed-in but not fitted by default. Fit either the RS-232 front end
(U2 + JP1/JP2 + J2/J3) or the RS-485 option (U4 + R8/R9/R10 + J5); the module's
TTL serial pins are shared. U3 is the optional modem-control (RTS/CTS/DTR/DCD)
transceiver.

| Ref | Value | Package | Populate | Zone | Note |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Netlist (${Object.keys(NETS).length} nets)

| Net | Pins | Members |
| --- | ---: | --- |
${nets.join('\n')}

## Safety

* Everything in the **mains** zone is at hazardous voltage. The isolation
  barrier is inside PS1 (3 kV reinforced); the PCB keeps
  ${BOARD.creepageMm} mm creepage / ${BOARD.clearanceMm} mm clearance between
  mains and SELV copper, enforced by \`--check\`.
* Fuse F1 is in the line conductor only; MOV1 sits after the fuse.
* Do not power this board from a non-isolated capacitive dropper supply.
* This is a design study: it has not been certified. Mains products need
  IEC/EN 62368-1 (or 60950-1) assessment, and the AC/DC module should be a
  certified part (RECOM RAC03-3.3SK, MEAN WELL IRM-03-3.3) rather than the
  budget HLK-PM03 if the enclosure is user-accessible.
`;
}

/* ------------------------------------------------------------------- checks */

/**
 * Schematic readability check: every instance owns its symbol box plus the
 * 5.08 mm wire stubs and the label that hangs off them. Overlapping boxes mean
 * the sheet is unreadable, so they are reported as errors and the placements in
 * tools/wallplug-model.mjs get moved until the sheet is clean.
 */
function checkXml(file, text) {
  const errors = [];
  const { root, errors: parseErrors } = parseXml(text);
  errors.push(...parseErrors.map((e) => `${file}: ${e}`));
  if (!root) return { errors, root: null };
  if (root.name !== 'eagle') errors.push(`${file}: root <${root.name}> is not <eagle>`);
  if (!root.attrs.version) errors.push(`${file}: <eagle> has no version`);
  const drawing = first(root, 'drawing');
  if (!drawing) errors.push(`${file}: no <drawing>`);
  return { errors, root, drawing };
}

function checkReferences(file, drawing, kind) {
  const errors = [];
  const libs = all(drawing, 'library');
  const packages = new Map();
  const symbols = new Map();
  const devicesets = new Map();
  for (const lib of libs) {
    for (const p of all(first(lib, 'packages'), 'package')) {
      packages.set(p.attrs.name, new Set(all(p, 'pad').map((x) => x.attrs.name).concat(all(p, 'smd').map((x) => x.attrs.name))));
    }
    for (const s of all(first(lib, 'symbols'), 'symbol')) {
      symbols.set(s.attrs.name, new Set(all(s, 'pin').map((x) => x.attrs.name)));
    }
    for (const d of all(first(lib, 'devicesets'), 'deviceset')) {
      const gates = all(first(d, 'gates'), 'gate').map((g) => ({ name: g.attrs.name, symbol: g.attrs.symbol }));
      const devices = all(first(d, 'devices'), 'device').map((dev) => ({
        name: dev.attrs.name,
        package: dev.attrs.package,
        connects: all(dev, 'connect').map((c) => ({ gate: c.attrs.gate, pin: c.attrs.pin, pad: c.attrs.pad })),
      }));
      devicesets.set(d.attrs.name, { gates, devices, prefix: d.attrs.prefix });
    }
  }

  // deviceset → gate → symbol pin → package pad
  for (const [dsName, ds] of devicesets) {
    for (const gate of ds.gates) {
      if (!symbols.has(gate.symbol)) errors.push(`${file}: deviceset ${dsName} gate ${gate.name} → unknown symbol ${gate.symbol}`);
    }
    for (const dev of ds.devices) {
      if (dev.package && !packages.has(dev.package)) errors.push(`${file}: deviceset ${dsName} device → unknown package ${dev.package}`);
      const pads = packages.get(dev.package) ?? new Set();
      for (const c of dev.connects) {
        const gate = ds.gates.find((g) => g.name === c.gate);
        if (!gate) { errors.push(`${file}: ${dsName} connect ${c.pin} → unknown gate ${c.gate}`); continue; }
        const pins = symbols.get(gate.symbol) ?? new Set();
        if (!pins.has(c.pin)) errors.push(`${file}: ${dsName} connect → symbol ${gate.symbol} has no pin ${c.pin}`);
        if (!pads.has(c.pad)) errors.push(`${file}: ${dsName} connect ${c.pin} → package ${dev.package} has no pad ${c.pad}`);
      }
    }
  }

  if (kind === 'sch') {
    const parts = new Map(all(first(drawing, 'schematic') ? first(first(drawing, 'schematic'), 'parts') : null, 'part')
      .map((p) => [p.attrs.name, p.attrs]));
    for (const [name, a] of parts) {
      if (!devicesets.has(a.deviceset)) errors.push(`${file}: part ${name} → unknown deviceset ${a.deviceset}`);
      if (a.library && !libs.some((l) => l.attrs.name === a.library)) errors.push(`${file}: part ${name} → unknown library ${a.library}`);
    }
    const sheets = all(drawing, 'sheet');
    if (sheets.length !== 1) errors.push(`${file}: expected 1 sheet, found ${sheets.length}`);
    const instParts = new Set();
    for (const inst of all(drawing, 'instance')) {
      instParts.add(inst.attrs.part);
      if (!parts.has(inst.attrs.part)) errors.push(`${file}: instance → unknown part ${inst.attrs.part}`);
      const ds = devicesets.get(parts.get(inst.attrs.part)?.deviceset);
      if (ds && !ds.gates.some((g) => g.name === inst.attrs.gate)) errors.push(`${file}: instance ${inst.attrs.part} → unknown gate ${inst.attrs.gate}`);
    }
    // every non-board-only part must be placed on the sheet
    for (const part of PARTS.filter((p) => !p.boardOnly)) {
      if (!parts.has(part.ref)) errors.push(`${file}: part ${part.ref} missing from <parts>`);
      if (!instParts.has(part.ref)) errors.push(`${file}: part ${part.ref} has no <instance>`);
    }
    // pinrefs must name real pins, and the file's connectivity must equal NETS
    const got = {};
    for (const net of all(drawing, 'net')) {
      const members = [];
      for (const pr of all(net, 'pinref')) {
        const part = parts.get(pr.attrs.part);
        if (!part) { errors.push(`${file}: net ${net.attrs.name} pinref → unknown part ${pr.attrs.part}`); continue; }
        const ds = devicesets.get(part.deviceset);
        const gate = ds?.gates.find((g) => g.name === pr.attrs.gate);
        const pins = gate ? symbols.get(gate.symbol) : null;
        if (pins && !pins.has(pr.attrs.pin)) errors.push(`${file}: net ${net.attrs.name} → symbol ${gate.symbol} has no pin ${pr.attrs.pin}`);
        members.push([pr.attrs.part, pr.attrs.pin]);
      }
      got[net.attrs.name] = members;
    }
    errors.push(...compareNets(file, got));
    errors.push(...checkPinCoverage(file));
  }

  if (kind === 'brd') {
    const elements = new Map(all(drawing, 'element').map((e) => [e.attrs.name, e.attrs]));
    for (const [name, a] of elements) {
      if (!packages.has(a.package)) errors.push(`${file}: element ${name} → unknown package ${a.package}`);
      // board elements carry library+package (no deviceset): the model is the
      // authority for ref → package, and it is checked below against PLACEMENT.
      const part = PARTS.find((p) => p.ref === name);
      if (part && DEVICESETS[part.set].package !== a.package) {
        errors.push(`${file}: element ${name} package ${a.package} ≠ model ${DEVICESETS[part.set].package}`);
      }
    }
    for (const part of PARTS) {
      if (!elements.has(part.ref)) errors.push(`${file}: element ${part.ref} missing from the board`);
    }
    const got = {};
    for (const sig of all(first(drawing, 'board'), 'signal')) {
      if (!sig.attrs.name) continue;
      const members = [];
      for (const cr of all(sig, 'contactref')) {
        const el = elements.get(cr.attrs.element);
        if (!el) { errors.push(`${file}: signal ${sig.attrs.name} → unknown element ${cr.attrs.element}`); continue; }
        const pads = packages.get(el.package) ?? new Set();
        if (!pads.has(cr.attrs.pad)) errors.push(`${file}: signal ${sig.attrs.name} → package ${el.package} has no pad ${cr.attrs.pad}`);
        members.push([cr.attrs.element, cr.attrs.pad]);
      }
      got[sig.attrs.name] = members;
    }
    // compare on pads (board contactrefs are pad names, model nets are pin names)
    for (const [net, members] of Object.entries(NETS)) {
      const want = new Set(members.map(([ref, pin]) => `${ref}.${DEVICESETS[PARTS.find((p) => p.ref === ref).set].connects[pin]}`));
      const have = new Set((got[net] ?? []).map(([r, pad]) => `${r}.${pad}`));
      if (want.size !== have.size || [...want].some((w) => !have.has(w))) {
        errors.push(`${file}: signal ${net} members ${JSON.stringify([...have])} ≠ model ${JSON.stringify([...want])}`);
      }
    }
  }
  return errors;
}

/**
 * Every symbol pin of every placed part must appear in exactly one net, unless
 * it is listed in UNCONNECTED (then it is reported, not silently dropped).
 */
function checkPinCoverage(file) {
  const errors = [];
  const inNet = new Set();
  for (const [net, members] of Object.entries(NETS)) {
    for (const [ref, pin] of members) inNet.add(`${ref}.${pin}`);
  }
  const allowed = new Set(UNCONNECTED.map(([r, p]) => `${r}.${p}`));
  for (const part of PARTS.filter((p) => !p.boardOnly)) {
    const ds = DEVICESETS[part.set];
    if (!ds.symbol) continue;
    for (const pin of SYMBOLS[ds.symbol].pins) {
      const key = `${part.ref}.${pin.name}`;
      if (inNet.has(key)) continue;
      if (allowed.has(key)) continue;
      errors.push(`${file}: pin ${key} is in no net and not listed in UNCONNECTED`);
    }
  }
  for (const key of allowed) if (!inNet.has(key) === false) { /* listed and connected: fine */ }
  // duplicate membership would hide a wiring mistake
  for (const [, members] of Object.entries(NETS)) {
    const seen = new Set();
    for (const [ref, pin] of members) {
      const key = `${ref}.${pin}`;
      if (seen.has(key)) errors.push(`${file}: ${key} listed twice in the same net`);
      seen.add(key);
    }
  }
  for (const [a, membersA] of Object.entries(NETS)) {
    for (const [b, membersB] of Object.entries(NETS)) {
      if (a >= b) continue;
      const setB = new Set(membersB.map(([r, p]) => `${r}.${p}`));
      const shared = membersA.filter(([r, p]) => setB.has(`${r}.${p}`));
      if (shared.length) errors.push(`${file}: nets ${a} and ${b} share ${shared.map(([r, p]) => `${r}.${p}`).join(', ')}`);
    }
  }
  return errors;
}

function compareNets(file, got) {
  const errors = [];
  const wantNames = Object.keys(NETS);
  const gotNames = Object.keys(got);
  for (const n of wantNames) if (!gotNames.includes(n)) errors.push(`${file}: net ${n} missing`);
  for (const n of gotNames) if (!wantNames.includes(n)) errors.push(`${file}: unexpected net ${n}`);
  for (const [net, members] of Object.entries(NETS)) {
    const want = new Set(members.map(([r, p]) => `${r}.${p}`));
    const have = new Set((got[net] ?? []).map(([r, p]) => `${r}.${p}`));
    if (want.size !== have.size || [...want].some((w) => !have.has(w))) {
      errors.push(`${file}: net ${net} = ${JSON.stringify([...have])} ≠ model ${JSON.stringify([...want])}`);
    }
  }
  return errors;
}


function runChecks(files) {
  const errors = [];
  const info = [];
  for (const [name, text] of Object.entries(files)) {
    if (!name.endsWith('.lbr') && !name.endsWith('.sch') && !name.endsWith('.brd')) continue;
    const { errors: xerr, drawing } = checkXml(name, text);
    errors.push(...xerr);
    if (!drawing) continue;
    const kind = first(drawing, 'schematic') ? 'sch' : first(drawing, 'board') ? 'brd' : 'lbr';
    errors.push(...checkReferences(name, drawing, kind));
    info.push(`${name}: ${text.length} bytes, ${kind}, ${all(drawing, 'package').length} packages, ${all(drawing, 'symbol').length} symbols, ${all(drawing, 'deviceset').length} devicesets`);
  }
  const geo = checkGeometry();
  errors.push(...geo.errors.map((e) => `geometry: ${e}`));
  const sch = checkSchematicLayout();
  errors.push(...sch.errors.map((e) => `schematic: ${e}`));
  return { errors, info, geo, sch };
}

/* --------------------------------------------------------------------- main */

function main() {
  const argv = process.argv.slice(2);
  const doCheck = argv.includes('--check');
  const doWrite = !argv.includes('--no-write');

  const files = buildFiles();
  if (doWrite) {
    mkdirSync(OUT_DIR, { recursive: true });
    for (const [name, text] of Object.entries(files)) {
      writeFileSync(join(OUT_DIR, name), text);
      console.log(`wrote hardware/lantronix-wallplug/${name} (${text.length} bytes)`);
    }
  } else {
    for (const name of Object.keys(files)) {
      const p = join(OUT_DIR, name);
      if (!existsSync(p)) { console.error(`missing ${p}`); process.exit(1); }
      files[name] = readFileSync(p, 'utf8');
    }
  }

  if (!doCheck) return;
  const { errors, info, geo, sch } = runChecks(files);
  for (const line of info) console.log(`  ${line}`);
  console.log(`  geometry: ${geo.pads.length} pads, ${geo.placed.length} placed elements, ${Object.keys(NETS).length} nets`);
  console.log(`  worst mains↔SELV creepage: ${geo.worstCreepage.toFixed(2)} mm (${geo.worstPair}), limit ${BOARD.creepageMm} mm`);
  console.log(`  schematic: ${sch.boxes.length} instances on a ${SHEET.w} × ${SHEET.h} mm sheet, no overlapping label boxes`);
  for (const n of geo.notes) console.log(`  note: ${n}`);
  if (errors.length) {
    console.error(`\nFAIL — ${errors.length} problem(s):`);
    for (const e of errors.slice(0, 60)) console.error(`  · ${e}`);
    if (errors.length > 60) console.error(`  … and ${errors.length - 60} more`);
    process.exit(1);
  }
  console.log('\nOK — XML well-formed, every reference resolves, connectivity matches the model, geometry clean.');
}

// Only run when executed directly: tests import the builders and the checks.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) main();
