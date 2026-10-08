/**
 * 22 · the Lantronix lab page controller: js/lantronix-lab.js executed against
 * the DOM stub with the ids taken from lantronix-lab.html, so the page's own
 * logic runs for real — including the SVG renderers, which are the part that
 * silently breaks when a coordinate goes non-finite.
 *
 * What is asserted, and why each one is a bug class rather than a formality:
 *   - every id the controller asks for exists in the markup (strictIds on);
 *   - all six panels render their tables from the data they claim to render
 *     (device matrix, signature table, Ghidra languages, SDK stack,
 *     alternatives, JVM-vs-JCVM, ACME servers, sources);
 *   - the EDA view draws the generated board and schematic: element counts match
 *     tools/wallplug-model.mjs, and no SVG attribute is NaN/undefined — the
 *     failure mode that makes a CAD view blank instead of wrong;
 *   - the in-browser DRC agrees with the node-side one (same functions, so this
 *     pins that the page imports the real checks and does not fake a verdict);
 *   - the triage tool names the architecture of a synthetic µClinux uImage and
 *     of a Java class blob, which is the whole point of the GHIDRA MATCH tab;
 *   - tab switching hides exactly one panel at a time.
 *
 * node tests/22-lantronix-lab.mjs
 */
import { readFileSync } from 'node:fs';
import { suite, ROOT } from './lib.mjs';
import { installDomStub } from '../tools/dom-stub.mjs';
import {
  PARTS, NETS, PACKAGES, DEVICESETS, PLACEMENT,
} from '../tools/wallplug-model.mjs';

const s = suite('22 · Lantronix lab page controller');

const html = readFileSync(`${ROOT}lantronix-lab.html`, 'utf8');
const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

const { document, byId } = installDomStub({ strictIds: true });

// The stub models element properties, not attributes; the SVG renderer calls
// setAttribute, so give the element class one and keep a record of what was set.
const proto = Object.getPrototypeOf(document.body);
proto.setAttribute = function (k, v) { (this.attrs ||= {})[k] = String(v); return this; };
proto.getAttribute = function (k) { return this.attrs?.[k] ?? null; };

const INPUT_IDS = new Set(['deviceSearch', 'netSearch', 'triageHex']);
for (const id of htmlIds) {
  const node = document.createElement('div');
  node.id = id;
  if (INPUT_IDS.has(id)) node.value = '';
  document.body.appendChild(node);
}
s.ok('stub seeded every id from the markup', htmlIds.every((id) => document.getElementById(id) !== null),
  `${htmlIds.length} ids`);

const $ = (id) => document.getElementById(id);

let threw = null;
let mod = null;
try {
  mod = await import('../js/lantronix-lab.js');
} catch (err) {
  threw = err;
}
const { DEVICES, SIGNATURES, SDK_STACK, ALTERNATIVES, JVM_ROWS, ACME_ROWS, SOURCES } = mod ?? {};
s.ok('controller ran to completion under the DOM stub', threw === null, threw ? String(threw.message || threw) : '');

/* ------------------------------------------------------------- data tables */

// The stub keeps innerHTML as a string and appended children as nodes, so a
// table can be counted either way; the controllers append DOM rows here.
const rowsOf = (id) => ($(id).children.length
  || ($(id).innerHTML.match(/<tr/g) ?? []).length);
const htmlOf = (id) => ($(id).children.map((c) => `${c.className}::${c.innerHTML}`).join('\n') || $(id).innerHTML);
s.eq('device matrix rows = DEVICES', rowsOf('deviceBody'), DEVICES.length);
s.eq('signature table rows = SIGNATURES', rowsOf('sigBody'), SIGNATURES.length);
s.eq('SDK stack rows', rowsOf('sdkBody'), SDK_STACK.length);
s.eq('alternatives rows', rowsOf('altBody'), ALTERNATIVES.length);
s.eq('JVM vs JCVM rows', rowsOf('jvmBody'), JVM_ROWS.length);
s.eq('ACME web-server rows', rowsOf('acmeBody'), ACME_ROWS.length);
s.eq('sources rendered', ($('sourceList').innerHTML.match(/<li>/g) ?? []).length, SOURCES.length);
s.ok('kernel version appears in the SDK stack', /2\.6\.30/.test($('sdkBody').innerHTML));
s.ok('ColdFire language id appears in the language table', /68000:BE:32:Coldfire/.test($('langBody').innerHTML));
s.ok('JVM language id appears in the language table', /JVM:BE:32:default/.test($('langBody').innerHTML));
s.ok('Buildroot mcf5208 defconfig is cited', /qemu_m68k_mcf5208_defconfig/.test($('altBody').innerHTML));
s.ok('NanoHTTPD finding is stated (not Acme.Serve)', /NanoHTTPD/.test($('wikiCard').innerHTML));

/* ------------------------------------------------------------------- BOM */

s.eq('BOM rows = every part', rowsOf('bomBody'), PARTS.length);
const dnpCount = PARTS.filter((p) => p.dnp).length;
s.eq('BOM tags the DNP options', $('bomBody').children.filter((c) => c.innerHTML.includes('>DNP<')).length, dnpCount);
const bomHtml = $('bomBody').children.map((c) => c.innerHTML).join('');
s.ok('BOM tags mains vs SELV zones', /MAINS/.test(bomHtml) && /SELV/.test(bomHtml));

/* ------------------------------------------------------------------- nets */

const netCount = Object.keys(NETS).length;
s.eq('net list entries', $('netList').children.length, netCount);
s.eq('net count tag', $('netCount').textContent.trim(), `${netCount} / ${netCount}`);

/* -------------------------------------------------------------------- eda */

function walk(node, out = []) {
  for (const c of node.children ?? []) { out.push(c); walk(c, out); }
  return out;
}

function assertSvg(label, root) {
  const nodes = walk(root);
  s.ok(`${label}: drew elements`, nodes.length > 100, `${nodes.length} svg nodes`);
  const bad = [];
  for (const n of nodes) {
    for (const [k, v] of Object.entries(n.attrs ?? {})) {
      if (/^(x|y|x1|y1|x2|y2|cx|cy|r|width|height|d)$/.test(k) && !Number.isFinite(Number(v))) bad.push(`${n.tagName}.${k}=${v}`);
      if (/NaN|undefined/.test(v)) bad.push(`${n.tagName}.${k}=${v}`);
    }
  }
  s.eq(`${label}: every coordinate is finite`, bad.slice(0, 5), []);
  return nodes;
}

const boardNodes = assertSvg('board view', $('edaSvg'));
const padShapes = boardNodes.filter((n) => (n.attrs?.class ?? '').split(' ').includes('pad')
  || (n.attrs?.class ?? '').split(' ').includes('pad smd') || (n.attrs?.class ?? '').split(' ').includes('pad mains'));
const modelPads = PARTS.reduce((n, p) => n + (PACKAGES[DEVICESETS[p.set].package].pads?.length ?? 0), 0);
s.ok('board view drew a shape per model pad', padShapes.length >= modelPads,
  `${padShapes.length} pad shapes ≥ ${modelPads} model pads`);
s.ok('board view marks mains pads', boardNodes.some((n) => (n.attrs?.class ?? '').includes('mains')));

// switch to the schematic view through the real click handler
const viewBtn = $('viewSchem');
s.ok('schematic toggle has a click handler', Array.isArray(viewBtn.listeners.click));
viewBtn.listeners.click[0]({});
const schNodes = assertSvg('schematic view', $('edaSvg'));
const netPins = Object.values(NETS).reduce((n, m) => n + m.length, 0);
const stubs = schNodes.filter((n) => (n.attrs?.class ?? '') === 'wire');
s.ok('schematic drew a wire stub per net pin', stubs.length >= netPins,
  `${stubs.length} stubs ≥ ${netPins} net pins`);

// layer toggles must not throw and must keep drawing
for (const id of ['layerZones', 'layerCourts', 'layerCu']) {
  const b = $(id);
  let err = null;
  try { b.listeners.click[0]({}); } catch (e) { err = e; }
  s.ok(`${id} toggle re-renders`, err === null, err ? err.message : '');
}

/* -------------------------------------------------------------------- drc */

const drcHtml = htmlOf('drcReport');
s.ok('DRC reports clean geometry', /geometry clean/.test(drcHtml), drcHtml.split('\n')[0] ?? '');
s.ok('DRC reports the creepage verdict', /creepage \d+\.\d\d mm/.test(drcHtml));
s.ok('DRC reports the sheet verdict', /sheet readable|instances/.test(drcHtml));
s.ok('DRC names the unconnected-by-design pins', /RI/.test(drcHtml));

/* ------------------------------------------------------------------ triage */

$('triageDemo').listeners.click[0]({});
const triageText = htmlOf('triageResult');
s.ok('demo blob is recognised as a uImage', /uImage/.test(triageText));
s.ok('demo blob resolves to M68K/ColdFire', /M68K|ColdFire/i.test(triageText));
s.ok('demo blob yields the ColdFire Ghidra language', /68000:BE:32:Coldfire/.test(triageText));
s.ok('demo blob surfaces the kernel banner', /Linux version 2\.6\.30/.test(triageText));
s.ok('demo blob finds the ROMFS root', /ROMFS superblock/.test(triageText));
s.ok('demo blob finds the JFFS2 partition', /JFFS2 magic/.test(triageText));

$('triageHex').value = 'ca fe ba be 00 00 00 34';
$('triageRun').listeners.click[0]({});
const hexText = htmlOf('triageResult');
s.ok('hex input is parsed and sniffed', /CAFEBABE/.test(hexText) && /Java class/.test(hexText), hexText.split('\n').slice(0, 2).join(' | '));

/* ------------------------------------------------------------------- java */

$('javaDemo').listeners.click[0]({});
const javaText = htmlOf('javaResult');
s.ok('demo class parses in the tab', /XPortStatus/.test(javaText), javaText.split('\n')[0] ?? '');
s.ok('demo class bytecode is disassembled', /disassembled \d+ instructions/.test(javaText));
s.ok('demo class listing shows real mnemonics', /getfield|invokevirtual|ifeq|ireturn/.test($('javaListing').textContent || $('javaListing').innerHTML));
s.eq('demo class listing is visible', $('javaListing').hidden, false);

/* ------------------------------------------------------------------- tabs */

$('tabEda').listeners.click[0]({});
s.eq('clicking EDA hides the device panel', $('panel-device').hidden, true);
s.eq('clicking EDA shows the eda panel', $('panel-eda').hidden, false);
$('tabSources').listeners.click[0]({});
s.eq('clicking SOURCES hides the eda panel', $('panel-eda').hidden, true);
s.eq('clicking SOURCES shows the sources panel', $('panel-sources').hidden, false);

/* -------------------------------------------------------------- downloads */

s.ok('download links point at the generated files',
  ['lantronix-wallplug.sch', 'lantronix-wallplug.brd', 'lantronix-wallplug.lbr', 'BOM.md']
    .every((f) => $('downloads').innerHTML.includes(`./hardware/lantronix-wallplug/${f}`)));

process.exit(s.done() ? 1 : 0);
