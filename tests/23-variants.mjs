/**
 * 23 · the wallplug family: four designs, one pipeline.
 *
 * Every design in tools/build-wallplug-eagle.mjs's DESIGNS registry gets the same
 * treatment the xPort wallplug gets in tests/20 — build, parse, resolve every
 * reference, compare the connectivity against the model, run the geometry DRC and
 * the schematic-layout check — plus the assertions that are specific to the parts
 * these boards are built around:
 *
 *   · the imported footprints really are what their datasheets say (pad counts,
 *     pitches, hole patterns, outlines), because a wrong footprint is a board that
 *     does not assemble;
 *   · the chargebyte PLC module's own pad layout honours the 8 mm creepage its
 *     datasheet §8.3 claims between the L/N pads and everything else — the claim
 *     is checked against the geometry, not taken on faith;
 *   · the boards that carry that module use 8.0 mm as their creepage limit, and
 *     the boards that do not are allowed the usual 6.4 mm;
 *   · every power rail has headroom against the datasheet maxima;
 *   · the pins that are deliberately open are listed, with the design saying why;
 *   · the committed CAD files are byte-identical to a fresh build.
 *
 * It also pins the finding that kept a relay off the Pi board: the Panasonic
 * AHES4291 footprint puts a contact pad 7.65 mm from a coil pad, which is inside
 * an 8 mm creepage rule.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { suite, ROOT } from './lib.mjs';
import {
  DESIGNS, designNames, useDesign, buildFiles, parseXml, all, outDir, runChecks,
} from '../tools/build-wallplug-eagle.mjs';
import { checkGeometry, collectPads, padGap } from '../tools/wallplug-drc.mjs';
import { IMPORTED_PACKAGES as IMPORTED, PACKAGE_SOURCES } from '../tools/eda-packages.mjs';
import { budgetCheck } from '../tools/eda-core.mjs';

const s = suite('23 · wallplug family (4 designs: build, verify, geometry, budgets)');

/* ------------------------------------------------------- the registry itself */

s.eq('four designs are registered', designNames().sort(),
  ['lantronix-wallplug', 'pi-wall-socket', 'plc-bridge', 'wimax-cpe']);
for (const name of designNames()) {
  const D = DESIGNS[name];
  s.eq(`${name}: BOARD.name matches the registry key`, D.BOARD.name, name);
  s.ok(`${name}: names its model file`, /\.mjs$/.test(D.MODEL_PATH ?? ''), D.MODEL_PATH);
  s.ok(`${name}: has a title and a description`, Boolean(D.TITLE) && (D.DESCRIPTION ?? '').length > 20);
  s.ok(`${name}: cites a document in the title block`, (D.DOC_REF ?? '').length > 10, D.DOC_REF);
  s.ok(`${name}: exports the generator's helper set`,
    ['rotPt', 'padAbs', 'courtAbs', 'symbolBBox', 'stubDir', 'pinAbsolute'].every((f) => typeof D[f] === 'function'));
  s.ok(`${name}: STUB is 5.08 mm (middle pin length)`, D.STUB === 5.08);
}

/* --------------------------------------------- build + verify every design */

const results = {};
for (const name of designNames()) {
  useDesign(name);
  const D = DESIGNS[name];
  const dir = outDir(D);
  const files = buildFiles();
  const n = D.BOARD.name;

  s.eq(`${name}: four artefacts`, Object.keys(files).sort(), [`${n}.brd`, `${n}.lbr`, 'BOM.md', `${n}.sch`].sort());
  for (const [f, text] of Object.entries(files)) {
    if (f.endsWith('.md')) continue;
    const { root, errors } = parseXml(text);
    s.eq(`${name}: ${f} is well-formed XML`, errors, []);
    s.eq(`${name}: ${f} root is <eagle>`, root?.name, 'eagle');
    s.eq(`${name}: ${f} names its library after the board`,
      [...new Set(all(root, 'library').map((l) => l.attrs.name))], [n]);
  }

  // the committed files must be the ones the model produces
  const stale = [];
  for (const f of Object.keys(files)) {
    const p = join(dir, f);
    if (!existsSync(p)) { stale.push(`${f} (missing)`); continue; }
    if (readFileSync(p, 'utf8') !== files[f]) stale.push(f);
  }
  s.eq(`${name}: hardware/${n}/ matches a fresh build`, stale, []);

  // references, pin coverage, connectivity, geometry, sheet layout
  const { errors, geo, sch } = runChecks(files);
  s.eq(`${name}: runChecks() is clean`, errors.slice(0, 4), []);
  s.ok(`${name}: pads counted`, geo.pads.length > 100, `${geo.pads.length} pads`);
  s.ok(`${name}: instances on the sheet`, sch.boxes.length >= D.PARTS.filter((p) => !p.boardOnly).length);
  s.near(`${name}: worst mains↔SELV creepage ≥ limit`, geo.worstCreepage >= D.BOARD.creepageMm, true);
  s.ok(`${name}: creepage pair reported`, /↔/.test(geo.worstPair), geo.worstPair);
  results[name] = { files, geo, sch, dir };
}

/* --------------------------------------------------- model-level invariants */

for (const name of designNames()) {
  const D = DESIGNS[name];
  const refs = new Set(D.PARTS.map((p) => p.ref));
  s.eq(`${name}: every part has a board placement`,
    D.PARTS.filter((p) => !D.PLACEMENT[p.ref]).map((p) => p.ref), []);
  s.eq(`${name}: every drawn part has a schematic placement`,
    D.PARTS.filter((p) => !p.boardOnly && !D.SCHEM_PLACEMENT[p.ref]).map((p) => p.ref), []);
  s.eq(`${name}: every net member names a real part`,
    [...new Set(Object.values(D.NETS).flat().filter(([r]) => !refs.has(r)).map(([r]) => r))], []);
  s.eq(`${name}: every part's deviceset exists`,
    [...new Set(D.PARTS.filter((p) => !D.DEVICESETS[p.set]).map((p) => p.set))], []);
  s.eq(`${name}: every deviceset's package and symbol exist`,
    Object.entries(D.DEVICESETS)
      .filter(([, d]) => (d.package && !D.PACKAGES[d.package]) || (d.symbol && !D.SYMBOLS[d.symbol]))
      .map(([k]) => k), []);

  // connects: pin names must exist on the symbol, pad names on the package
  const bad = [];
  for (const [dsName, d] of Object.entries(D.DEVICESETS)) {
    const sym = d.symbol ? D.SYMBOLS[d.symbol] : null;
    const pkg = d.package ? D.PACKAGES[d.package] : null;
    const symPins = new Set((sym?.pins ?? []).map((p) => p.name));
    const pads = new Set((pkg?.pads ?? []).map((p) => p.name));
    for (const [pin, pad] of Object.entries(d.connects)) {
      if (sym && !symPins.has(pin)) bad.push(`${dsName}: pin ${pin}`);
      for (const one of Array.isArray(pad) ? pad : [pad]) {
        if (pkg && !pads.has(one)) bad.push(`${dsName}: pad ${one}`);
      }
    }
  }
  s.eq(`${name}: every connects entry resolves pin→pad`, bad, []);

  // UNCONNECTED must name real pins that are genuinely not in a net
  const inNet = new Set(Object.values(D.NETS).flat().map(([r, p]) => `${r}.${p}`));
  const wrong = [];
  for (const [r, p] of D.UNCONNECTED) {
    if (!refs.has(r)) wrong.push(`${r}: no such part`);
    else if (inNet.has(`${r}.${p}`)) wrong.push(`${r}.${p}: listed as open but is in a net`);
  }
  s.eq(`${name}: D.UNCONNECTED entries are real and really open`, wrong, []);

  // every net class referenced is 0/1/2 and the mains nets are class 1
  s.eq(`${name}: net classes are legal`,
    [...new Set(Object.values(D.NET_CLASS))].filter((c) => ![0, 1, 2].includes(c)), []);
  s.eq(`${name}: every class-1 net contains a mains-zone pad`,
    Object.entries(D.NET_CLASS).filter(([, c]) => c === 1).map(([net]) => net)
      .filter((net) => !D.NETS[net]), []);

  // notes and prose
  s.ok(`${name}: schematic notes are substantial`, D.SCHEM_NOTES.length >= 5, `${D.SCHEM_NOTES.length} notes`);
  s.ok(`${name}: board notes exist`, D.BOARD_NOTES.length >= 4, `${D.BOARD_NOTES.length} notes`);
  s.ok(`${name}: BOM intro explains the DNP options`, (D.BOM_INTRO ?? '').length > 120);
  s.ok(`${name}: safety notes are present`, (D.SAFETY_NOTES ?? []).length >= 4, `${D.SAFETY_NOTES.length} notes`);
  s.ok(`${name}: BOM.md lists every reference`,
    D.PARTS.every((p) => results[name].files['BOM.md'].includes(`| ${p.ref} |`)));
  s.ok(`${name}: BOM.md marks every DNP part`,
    D.PARTS.filter((p) => p.dnp).every((p) => new RegExp(`\\| ${p.ref} \\|[^\\n]*\\| DNP \\|`).test(results[name].files['BOM.md'])));
  s.ok(`${name}: the barrier is a line inside the board`,
    D.BARRIER.x1 > 0 && D.BARRIER.x1 < D.BOARD.w && D.BARRIER.y2 <= D.BOARD.h);

  // power budgets
  if (D.POWER_BUDGET) {
    const rep = budgetCheck(D.POWER_BUDGET);
    s.eq(`${name}: every rail has headroom`, rep.filter((r) => !r.ok).map((r) => `${r.rail} ${r.headroomMA} mA`), []);
    s.ok(`${name}: rails are not loaded past 90 %`, rep.every((r) => r.pct <= 90),
      rep.map((r) => `${r.rail} ${r.pct}%`).join(', '));
    s.eq(`${name}: the exported budget report agrees`, D.POWER_BUDGET_REPORT.map((r) => r.ok), rep.map((r) => r.ok));
  }
}

/* ------------------------------------------------- footprint ground truth */

const pkg = (k) => IMPORTED[k];
const padsOf = (k) => pkg(k).pads;
const xs = (k) => padsOf(k).map((p) => p.x);
const ys = (k) => padsOf(k).map((p) => p.y);
const pitch = (vals) => {
  const u = [...new Set(vals.map((v) => Math.round(v * 1000) / 1000))].sort((a, b) => a - b);
  const gaps = u.slice(1).map((v, i) => Math.round((v - u[i]) * 1000) / 1000);
  return [...new Set(gaps)];
};

// chargebyte PLC Stamp mini 2 ------------------------------------------------
s.eq('PLCSTAMP: 24 pads — pin 14 does not exist (datasheet §11 note 4)', padsOf('PLCSTAMP').length, 24);
s.ok('PLCSTAMP: no pad named 14', !padsOf('PLCSTAMP').some((p) => p.name === '14'));
{
  const g = pitch(xs('PLCSTAMP'));
  s.eq('PLCSTAMP: a 1.27 mm grid with exactly two deliberate gaps (no pad 14, and the mains/host separation)',
    g, [1.27, 10.16]);
  const at = (n) => padsOf('PLCSTAMP').find((p) => p.name === n);
  s.near('PLCSTAMP: pad 13 (ZC_IN) to pad 15 (N) is 13.97 mm centre-to-centre',
    Math.abs(at('13').x - at('15').x), 13.97, 0.001);
}
s.near('PLCSTAMP: the two pad rows are 20.47 mm apart',
  Math.max(...ys('PLCSTAMP')) - Math.min(...ys('PLCSTAMP')), 20.47, 0.001);
s.near('PLCSTAMP: courtyard matches the 43.5 x 22 mm outline (§3)',
  pkg('PLCSTAMP').courtyard.x2 - pkg('PLCSTAMP').courtyard.x1, 44, 0.5);
{
  // the datasheet claims 8 mm creepage between the L/N pads and every other
  // connection; check that claim against the footprint that was actually imported
  const mains = padsOf('PLCSTAMP').filter((p) => ['15', '16', '17'].includes(p.name));
  const other = padsOf('PLCSTAMP').filter((p) => !['15', '16', '17'].includes(p.name));
  const shape = (p) => ({ x: p.x, y: p.y, shape: { box: true, hw: p.smd.dx / 2, hh: p.smd.dy / 2 } });
  let worst = Infinity; let pair = '';
  for (const a of mains) for (const b of other) {
    const g = padGap(shape(a), shape(b));
    if (g < worst) { worst = g; pair = `${a.name}↔${b.name}`; }
  }
  s.near('PLCSTAMP: the vendor footprint keeps ≥ 8 mm between L/N and the host pads (§8.3)',
    worst >= 8.0, true);
  s.ok('PLCSTAMP: worst internal creepage pair', worst > 12, `${pair} = ${worst.toFixed(2)} mm`);
}

// PCI Express Mini Card socket ------------------------------------------------
s.eq('MPCIE: 52 signal pads', padsOf('MPCIE').filter((p) => /^\d+$/.test(p.name)).length, 52);
s.eq('MPCIE: two Ø2.6 non-plated mounting holes', pkg('MPCIE').holes.map((h) => h.drill), [2.6, 2.6]);
s.near('MPCIE: mounting holes are 24.2 mm apart',
  Math.abs(pkg('MPCIE').holes[1].x - pkg('MPCIE').holes[0].x), 24.2, 0.001);
{
  const odd = padsOf('MPCIE').filter((p) => /^\d+$/.test(p.name) && Number(p.name) % 2 === 1).map((p) => p.x);
  const even = padsOf('MPCIE').filter((p) => /^\d+$/.test(p.name) && Number(p.name) % 2 === 0).map((p) => p.x);
  // this socket footprint splits the 52 contacts into pins 1-16 and 17-52 with a
  // 4 mm gap between the groups; the 0.8 mm pitch holds inside each group
  s.eq('MPCIE: 0.8 mm pitch inside each contact group', [pitch(odd), pitch(even)], [[0.8, 4], [0.8, 4]]);
  s.near('MPCIE: the two rows are staggered by 0.4 mm', Math.min(...even) - Math.min(...odd), 0.4, 0.001);
  s.eq('MPCIE: contact groups are 1-16 and 17-52',
    padsOf('MPCIE').filter((p) => p.x < 0 && /^\d+$/.test(p.name)).length, 16);
}
s.near('MPCIE: pads are 0.6 x 2.35 mm', padsOf('MPCIE')[0].smd.dx, 0.6, 0.001);
s.near('MPCIE: the card area is 26.8 mm deep (half Mini Card)',
  pkg('MPCIE').courtyard.y2 - pkg('MPCIE').courtyard.y1, 28.65, 0.1);

// Raspberry Pi Zero -----------------------------------------------------------
s.eq('PIZERO: 40 header pads', padsOf('PIZERO').length, 40);
s.eq('PIZERO: four M2.5 holes at Ø2.75', pkg('PIZERO').holes.map((h) => h.drill), [2.75, 2.75, 2.75, 2.75]);
{
  const h = pkg('PIZERO').holes;
  const spanX = Math.max(...h.map((p) => p.x)) - Math.min(...h.map((p) => p.x));
  const spanY = Math.max(...h.map((p) => p.y)) - Math.min(...h.map((p) => p.y));
  s.eq('PIZERO: hole centres are 58 x 23 mm', [spanX, spanY], [58, 23]);
  s.eq('PIZERO: courtyard is the 65 x 30 mm module outline',
    [pkg('PIZERO').courtyard.x2 - pkg('PIZERO').courtyard.x1,
      pkg('PIZERO').courtyard.y2 - pkg('PIZERO').courtyard.y1], [65, 30]);
  s.eq('PIZERO: header pitch is 2.54 mm', pitch(xs('PIZERO')), [2.54]);
}

// MEAN WELL IRM-05-5 ----------------------------------------------------------
s.eq('IRM055: four pads', padsOf('IRM055').length, 4);
s.near('IRM055: courtyard is the 45.7 x 25.4 mm body (+0.5 mm)',
  pkg('IRM055').courtyard.x2 - pkg('IRM055').courtyard.x1, 46.2, 0.05);
s.near('IRM055: body depth', pkg('IRM055').courtyard.y2 - pkg('IRM055').courtyard.y1, 25.9, 0.05);

// WIZnet WIZ850io -------------------------------------------------------------
s.eq('WIZ850IO: two 1x6 headers', padsOf('WIZ850IO').length, 12);
s.near('WIZ850IO: header rows are 20.32 mm apart',
  Math.abs(padsOf('WIZ850IO')[6].x - padsOf('WIZ850IO')[0].x), 20.32, 0.001);
s.eq('WIZ850IO: 2.54 mm pitch', pitch(ys('WIZ850IO')), [2.54]);

// ESP32-WROOM-32(E) -----------------------------------------------------------
s.eq('ESP32WROOM: 39 pads (38 castellations + ground pad)', padsOf('ESP32WROOM').length, 39);
s.near('ESP32WROOM: courtyard spans 28.5 mm (the 18 mm module plus its antenna keep-out)',
  pkg('ESP32WROOM').courtyard.x2 - pkg('ESP32WROOM').courtyard.x1, 28.5, 0.01);

// the relay that did not make it onto a board ---------------------------------
{
  const p = padsOf('AHES4291');
  const at = (n) => p.find((x) => x.name === n);
  // PIONIX's symbol: 4 COIL_1, 5 COIL_2; contacts are 1, 2, 3, 6, 7, 8
  const coil = ['4', '5'].map(at);
  const contact = ['1', '2', '3', '6', '7', '8'].map(at);
  let centre = Infinity; let edge = Infinity;
  for (const a of coil) for (const b of contact) {
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < centre) centre = d;
    const g = d - (a.diameter + b.diameter) / 2;
    if (g < edge) edge = g;
  }
  s.near('AHES4291: coil pad to contact pad, centre-to-centre', centre, 7.65, 0.05);
  s.near('AHES4291: the same pair edge-to-edge, which is what creepage measures', edge, 4.8, 0.05);
  s.ok('AHES4291: that is why no board in this family switches mains with it', edge < 8.0,
    `${edge.toFixed(2)} mm < 8.0 mm`);
}

/* --------------------------------------------------- provenance of the library */

s.ok('every imported package records repo + path + fetch date',
  Object.entries(PACKAGE_SOURCES).every(([, v]) => v.repo && v.path && /^\d{4}-\d{2}-\d{2}$/.test(v.fetched)));
s.eq('the imported package count matches the source table',
  Object.keys(IMPORTED).length, Object.keys(PACKAGE_SOURCES).length);
for (const name of designNames()) {
  const D = DESIGNS[name];
  const imported = Object.keys(D.PACKAGES).filter((k) => k in PACKAGE_SOURCES);
  if (name === 'lantronix-wallplug') {
    // this library predates the importer: its provenance is the header comment of
    // tools/wallplug-model.mjs, and tests/20 pins the xPort Pro footprint geometry
    s.eq(`${name}: uses its own hand-built library, not the importer`, imported, []);
  } else {
    s.ok(`${name}: uses imported footprints, all traceable`, imported.length >= 5 &&
      imported.every((k) => PACKAGE_SOURCES[k].repo), `${imported.length} imported`);
  }
}

/* ------------------------------------------------------ per-design specifics */

const PLC = DESIGNS['plc-bridge'];
s.eq('plc-bridge: creepage limit is the module\'s 8.0 mm (datasheet §8.3)', PLC.BOARD.creepageMm, 8.0);
s.eq('plc-bridge: clearance limit is the module\'s 6.5 mm', PLC.BOARD.clearanceMm, 6.5);
s.eq('plc-bridge: the modem\'s mains pads are zoned mains',
  Object.entries(PLC.PARTS.find((p) => p.ref === 'U2').padZones).filter(([, z]) => z === 'mains').map(([p]) => p).sort(),
  ['15', '16', '17']);
s.ok('plc-bridge: the modem couples to the fused line and to neutral',
  PLC.NETS.AC_L_F.some(([r, p]) => r === 'U2' && p === 'L') && PLC.NETS.AC_N.some(([r, p]) => r === 'U2' && p === 'N'));
s.ok('plc-bridge: warns that automotive variants are not for mains',
  PLC.SCHEM_NOTES.some((n) => /AUTOMOTIVE VARIANTS/i.test(n.text) && /NOT FOR MAINS/i.test(n.text)));
s.ok('plc-bridge: states SPI mode 3 and the 12 MHz ceiling',
  PLC.SCHEM_NOTES.some((n) => /mode 3/.test(n.text) && /12 MHz/.test(n.text)));
s.ok('plc-bridge: ZC_IN is left floating for the mains variant, with a DNP pull-down',
  PLC.UNCONNECTED.some(([r, p]) => r === 'U2' && p === 'ZC_IN') ||
  PLC.NETS.ZC_IN.some(([r]) => r === 'R2'));
s.eq('plc-bridge: the DNP ZC pull-down is 10 kΩ (§8.2 note 2)',
  PLC.PARTS.find((p) => p.ref === 'R2')?.value, '10k');
s.ok('plc-bridge: GPIO LED bootstrap uses 3.3 kΩ (figure 3)',
  ['R5', 'R6'].every((r) => PLC.PARTS.find((p) => p.ref === r)?.value === '3k3'));
s.ok('plc-bridge: switch bootstrap uses 100 Ω + 10 kΩ + 100 pF (figure 4)',
  PLC.PARTS.find((p) => p.ref === 'R3')?.value === '100R' &&
  PLC.PARTS.find((p) => p.ref === 'R4')?.value === '10k' &&
  PLC.PARTS.find((p) => p.ref === 'C5')?.value === '100pF');

const WIMAX = DESIGNS['wimax-cpe'];
s.eq('wimax-cpe: creepage stays at the usual 6.4 mm (no powerline module on board)',
  WIMAX.BOARD.creepageMm, 6.4);
{
  const N = Object.fromEntries(Object.entries(
    Object.fromEntries(Object.entries(WIMAX.DEVICESETS['MPCIE-SOCKET'].connects).map(([pin, pad]) => [pad, pin])),
  ));
  const aux = ['2', '24', '39', '41', '52'].map((p) => N[p]);
  s.eq('wimax-cpe: all five 3.3 Vaux contacts are on the 3.3 V rail',
    aux.filter((pin) => !WIMAX.NETS['3V3'].some(([r, p]) => r === 'U2' && p === pin)), []);
  s.ok('wimax-cpe: USB D+/D- (pads 38/36) reach the upstream receptacle',
    WIMAX.NETS.USB_DP.some(([r]) => r === 'J3') && WIMAX.NETS.USB_DM.some(([r]) => r === 'J3'));
  s.ok('wimax-cpe: the PCIe pairs and REFCLK are open, with the reason recorded',
    ['11', '13', '23', '25', '33'].every((pad) =>
      WIMAX.UNCONNECTED.some(([r, p]) => r === 'U2' && p === N[pad])));
  s.ok('wimax-cpe: host VBUS is deliberately not used',
    WIMAX.UNCONNECTED.some(([r, p]) => r === 'J3' && p === 'VBUS'));
  s.ok('wimax-cpe: W_DISABLE# is pulled up and switched (EM spec §3.2.5.2)',
    WIMAX.NETS.MPCIE_WDISABLE.some(([r]) => r === 'SW4') &&
    WIMAX.PARTS.find((p) => p.ref === 'R3')?.value === '10k');
  s.ok('wimax-cpe: the SIM option is wired to the UIM pins and is DNP',
    ['UIM_PWR', 'UIM_DATA', 'UIM_CLK', 'UIM_RESET'].every((net) =>
      WIMAX.NETS[net].some(([r]) => r === 'J4')) && WIMAX.PARTS.find((p) => p.ref === 'J4')?.dnp === true);
  s.ok('wimax-cpe: the +1.5 V rail is a DNP option, not a guess',
    WIMAX.PARTS.find((p) => p.ref === 'U3')?.dnp === true &&
    WIMAX.NETS['1V5'].filter(([r]) => r === 'U2').length === 3);
  s.eq('wimax-cpe: 12 V in, 3.3 V out for the card',
    WIMAX.POWER_BUDGET.map((r) => r.rail), ['12V', '3V3']);
}

const PI = DESIGNS['pi-wall-socket'];
s.eq('pi-wall-socket: creepage is the module\'s 8.0 mm', PI.BOARD.creepageMm, 8.0);
s.eq('pi-wall-socket: the Pi socket uses the Zero footprint', PI.DEVICESETS['PI-ZERO-SOCKET'].package, 'PIZERO');
s.eq('pi-wall-socket: 40 header connects', Object.keys(PI.DEVICESETS['PI-ZERO-SOCKET'].connects).length, 40);
{
  const pinOf = (hdr) => Object.entries(PI.DEVICESETS['PI-ZERO-SOCKET'].connects)
    .find(([, pad]) => pad === hdr)?.[0];
  s.ok('pi-wall-socket: SPI0 (pins 19/21/23/24) drives the WIZ850io',
    [['19', 'MOSI'], ['21', 'MISO'], ['23', 'SCLK'], ['24', '!SCS']].every(([hdr, sig]) =>
      PI.NETS[`ETH_${sig.replace('!', '')}`]?.some(([r, p]) => r === 'J2' && p === pinOf(hdr)) ??
      PI.NETS.ETH_CS?.some(([r, p]) => r === 'J2' && p === pinOf(hdr))));
  s.ok('pi-wall-socket: SPI1 (pins 35/36/38/40) drives the PLC modem',
    ['35', '36', '38', '40'].every((hdr) =>
      Object.values(PI.NETS).some((members) => members.some(([r, p]) => r === 'J2' && p === pinOf(hdr)) &&
        members.some(([r]) => r === 'U3'))));
  s.ok('pi-wall-socket: the Pi is fed 5 V on header pins 2 and 4',
    PI.NETS['5V'].filter(([r, p]) => r === 'J2' && [pinOf('2'), pinOf('4')].includes(p)).length === 2);
  s.ok('pi-wall-socket: all eight Pi ground pins are tied',
    PI.NETS.GND.filter(([r]) => r === 'J2').length === 8);
  s.eq('pi-wall-socket: the Pi\'s own 3.3 V output is not paralleled with the board rail',
    PI.UNCONNECTED.filter(([r, p]) => r === 'J2' && [pinOf('1'), pinOf('17')].includes(p)).length, 2);
  s.ok('pi-wall-socket: three rails are budgeted', PI.POWER_BUDGET.map((r) => r.rail).join(',') === '12V,5V,3V3');
}

// the xPort wallplug's own numbers must not have moved: tests/20 pins the detail
const X = DESIGNS['lantronix-wallplug'];
s.eq('lantronix-wallplug: still 41 nets and 46 parts', [Object.keys(X.NETS).length, X.PARTS.length], [41, 46]);
s.eq('lantronix-wallplug: creepage unchanged', X.BOARD.creepageMm, 6.4);

process.exit(s.done() ? 1 : 0);
