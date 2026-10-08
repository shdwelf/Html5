#!/usr/bin/env node
/**
 * import-kicad-footprints.mjs — turn real KiCad footprints into EAGLE-style
 * package data for the wallplug family.
 *
 *   node tools/import-kicad-footprints.mjs           fetch + rewrite tools/eda-packages.mjs
 *   node tools/import-kicad-footprints.mjs --dry     fetch and report, write nothing
 *
 * Why this file exists: every pad coordinate in the variant designs comes from a
 * footprint somebody already drew and published, not from a guess. This script is
 * the provenance chain — it records, per package, the repository and path it was
 * read from, and it is re-runnable.
 *
 * Sources are read through the GitHub REST API (api.github.com) with the
 * `application/vnd.github.raw` accept header. Nothing is cached: a refresh is a
 * fresh read, and the emitted header carries the fetch date and blob sizes so a
 * stale import is visible in the diff.
 *
 * Conversion rules (KiCad → this repo's package schema):
 *   pad  smd      → { name, x, y, smd: { dx, dy } }
 *   pad  thru_hole→ { name, x, y, drill, diameter, shape }   (square ⇒ pin 1)
 *   pad  np_thru  → holes: [{ x, y, drill }]                  (no copper)
 *   courtyard     → F.CrtYd lines/rects, else F.Fab, else fp_circle, else pads+1 mm
 *   rotation      → kept per pad; the DRC rotates SMD rectangles with the part
 *
 * KiCad y grows downward, EAGLE y grows upward, so every y is negated and the
 * courtyard flipped. Pad *names* are kept verbatim — including the mini-PCIe's
 * numeric pins, the IRM-05-5's AC/L → '1' rename (applied here, explicitly) and
 * the PLC Stamp's missing pad 14.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
export const OUT = join(HERE, 'eda-packages.mjs');

const KICAD_FOOTPRINTS = 'KiCad/kicad-footprints';
const PIONIX = 'PionixPublic/reference-hardware';
const MPCIE_REPO = 'drbild/kicad-mini-pci-e';
const WIZ_REPO = 'es-ude/kicad-library';

/**
 * name → { repo, path, descr, source (human-readable provenance), flipY,
 *          rename (pad-name map), courtyard (override, in EAGLE mm) }
 */
export const TARGETS = [
  // --- power -------------------------------------------------------------
  {
    name: 'IRM055', repo: 'sebdehne/DehneEVSE-Hardware',
    path: 'DehneEVSEFootPrints.pretty/CONV_IRM-05-5.kicad_mod',
    descr: 'MEAN WELL IRM-05-5, 5 W encapsulated AC-DC, 85-305 VAC in, 5 V / 1 A out, 45.7 x 25.4 x 21.5 mm',
    source: 'MEAN WELL IRM-05-5 (DigiKey 1866-3027-ND, EN60950-1/UL60950-1, CB/CE/cURus/TUV); pad geometry from the DehneEVSE KiCad library, pad names AC/L, AC/N, VNEG, VPOS renumbered 1-4',
    rename: { 'AC/L': '1', 'AC/N': '2', 'VNEG': '3', 'VPOS': '4' },
  },
  {
    name: 'MPM2012', repo: PIONIX, path: 'Yak/lib/ev-devboard.pretty/MPM2012.kicad_mod',
    descr: 'MEAN WELL MPM-20-12, 20 W encapsulated AC-DC, 12 V / 1.67 A out',
    source: 'PIONIX EVerest reference hardware (Yak) footprint library; pin roles from the same project\'s symbol: 1 AC/N, 2 AC/L, 3 +V, 4 -V',
  },
  {
    name: 'LM2576S', repo: KICAD_FOOTPRINTS, path: 'Package_TO_SOT_SMD.pretty/TO-263-5_TabPin3.kicad_mod',
    descr: 'TO-263-5 (D2PAK) with tab tied to pin 3 — LM2576S-3.3 step-down regulator',
    source: 'KiCad official library, Package_TO_SOT_SMD/TO-263-5_TabPin3',
  },
  {
    name: 'AMS1117', repo: KICAD_FOOTPRINTS, path: 'Package_TO_SOT_SMD.pretty/SOT-223-3_TabPin2.kicad_mod',
    descr: 'SOT-223 with tab tied to pin 2 (VOUT) — AMS1117-3.3 / LD1117S33 linear regulator',
    source: 'KiCad official library, Package_TO_SOT_SMD/SOT-223-3_TabPin2',
  },

  // --- the modules these boards exist for --------------------------------
  {
    name: 'PLCSTAMP', repo: PIONIX, path: 'Yak/lib/ev-devboard.pretty/PLC_Stamp_mini_2.kicad_mod',
    descr: 'chargebyte (ex I2SE) PLC Stamp mini 2 — QCA7005 HomePlug Green PHY module, 43.5 x 22 x 6.5 mm, integrated mains coupling',
    source: 'PIONIX EVerest reference hardware (Yak) footprint library; outline and pad 14 omission per chargebyte PLC Stamp mini 2 datasheet rev 13 §11',
  },
  {
    name: 'MPCIE', repo: MPCIE_REPO, path: 'mpcie.pretty/mini-PCIe_H1_Half.kicad_mod',
    descr: 'PCI Express Mini Card socket, 52 positions at 0.8 mm, two staggered rows, half-size card (30 x 26.8 mm), Ø2.6 mounting holes',
    source: 'drbild/kicad-mini-pci-e (mpcie.pretty/mini-PCIe_H1_Half); signal names from the PCI Express Mini Card Electromechanical Specification rev 1.2',
    courtyard: { x1: -11.4, y1: -1.6, x2: 19.1, y2: 27.05 },
  },
  {
    name: 'ESP32WROOM', repo: KICAD_FOOTPRINTS, path: 'RF_Module.pretty/ESP32-WROOM-32.kicad_mod',
    descr: 'Espressif ESP32-WROOM-32 / -32E module, 18 x 25.5 mm, 38 castellated pads + ground pad',
    source: 'KiCad official library, RF_Module/ESP32-WROOM-32 (the -32E is pin and footprint compatible)',
  },
  {
    name: 'WIZ850IO', repo: WIZ_REPO, path: 'library/custom_library.pretty/WIZ850IO.kicad_mod',
    descr: 'WIZnet WIZ850io plug-in Ethernet module: W5500 + magnetics + RJ45, two 1x6 headers 20.32 mm apart',
    source: 'es-ude/kicad-library WIZ850IO footprint; pinout from the WIZnet WIZ850io datasheet v1.0 (J1: GND GND MOSI SCLK SCNn INTn, J2: GND 3V3 3V3 NC RSTn MISO)',
    courtyard: { x1: -11.75, y1: -13.1, x2: 11.75, y2: 13.1 },
  },
  {
    name: 'HDR2X20', repo: KICAD_FOOTPRINTS, path: 'Connector_PinSocket_2.54mm.pretty/PinSocket_2x20_P2.54mm_Vertical.kicad_mod',
    descr: '2x20 female header, 2.54 mm — Raspberry Pi Zero 2 W GPIO socket',
    source: 'KiCad official library, Connector_PinSocket_2.54mm/PinSocket_2x20_P2.54mm_Vertical; pin names from the Raspberry Pi 40-pin GPIO map',
  },

  // --- magnetics, RF, connectors -----------------------------------------
  {
    name: 'HR911105A', repo: KICAD_FOOTPRINTS, path: 'Connector_RJ.pretty/RJ45_Hanrun_HR911105A.kicad_mod',
    descr: 'Hanrun HR911105A — single-port RJ45 with integrated magnetics, 10/100Base-TX, 1500 Vrms isolation',
    source: 'KiCad official library, Connector_RJ/RJ45_Hanrun_HR911105A (datasheet URL is inside the footprint: kosmodrom.com.ua/pdf/HR911105A.pdf)',
  },
  {
    name: 'TRJG0926HENL', repo: PIONIX, path: 'Yak/CM4IO.pretty/TRJG0926HENL.kicad_mod',
    descr: 'TRJG0926HENL — RJ45 with integrated magnetics, 20 pads, used on the PIONIX EVerest Yak CM4 carrier',
    source: 'PIONIX EVerest reference hardware (Yak); footprint descr cites globalsources spec K1160305690',
  },
  {
    name: 'UFL', repo: KICAD_FOOTPRINTS, path: 'Connector_Coaxial.pretty/U.FL_Hirose_U.FL-R-SMT-1_Vertical.kicad_mod',
    descr: 'Hirose U.FL-R-SMT-1 coax receptacle (Intel mini-PCIe cards use U.FL-R-SMT with U.FL-LP-066 cables)',
    source: 'KiCad official library, Connector_Coaxial/U.FL_Hirose_U.FL-R-SMT-1_Vertical',
  },
  {
    name: 'SMAV', repo: KICAD_FOOTPRINTS, path: 'Connector_Coaxial.pretty/SMA_Amphenol_132134_Vertical.kicad_mod',
    descr: 'Amphenol 132134 SMA jack, vertical PCB mount — bulkhead pigtail landing point',
    source: 'KiCad official library, Connector_Coaxial/SMA_Amphenol_132134_Vertical',
  },
  {
    name: 'UMTSANT', repo: PIONIX, path: 'Yak/lib/ev-devboard.pretty/UMTS1.6.kicad_mod',
    descr: 'Chip antenna, 2 pads, 1.7 GHz / 2.6 GHz band (UMTS-LTE-WiMAX adjacent)',
    source: 'PIONIX EVerest reference hardware (Yak), symbol UMTS_1.6',
  },
  {
    name: 'PIZERO', repo: 'tylercrumpton/CrumpPrints.pretty', path: 'Raspberry_Pi_Zero.kicad_mod',
    descr: 'Raspberry Pi Zero / Zero 2 W template: 2x20 header pads plus the four M2.5 corner holes at 58 x 23 mm, board outline 65 x 30 mm',
    source: 'tylercrumpton/CrumpPrints.pretty Raspberry_Pi_Zero (HAT template); hole pattern cross-checked against the Raspberry Pi Zero mechanical drawing (65 x 30 mm, four M2.5 holes, 58 x 23 mm centres) and electronics-lab.com\'s footprint note',
    // the footprint only draws the header on F.Fab, so the courtyard is set to the
    // module outline: the Pi Zero sits on top of this area and nothing may overlap it
    courtyard: { x1: 0, y1: 0, x2: 65, y2: 30 },
  },
  {
    name: 'TO92', repo: 'KiCad/kicad-footprints', path: 'Package_TO_SOT_THT.pretty/TO-92_Inline.kicad_mod',
    descr: 'TO-92 inline, 1.27 mm pitch — 2N3904-class relay driver',
    source: 'KiCad official library, Package_TO_SOT_THT/TO-92_Inline',
  },
  {
    name: 'USBMB', repo: KICAD_FOOTPRINTS, path: 'Connector_USB.pretty/USB_Micro-B_Molex-105017-0001.kicad_mod',
    descr: 'Molex 105017-0001 USB Micro-B receptacle — upstream host connection',
    source: 'KiCad official library, Connector_USB/USB_Micro-B_Molex-105017-0001',
  },
  {
    name: 'MICROSIM', repo: KICAD_FOOTPRINTS, path: 'Connector_Card.pretty/microSIM_JAE_SF53S006VCBR2000.kicad_mod',
    descr: 'JAE SF53S006VCBR2000 micro-SIM holder — for the UIM pins of a mini-PCIe modem card',
    source: 'KiCad official library, Connector_Card/microSIM_JAE_SF53S006VCBR2000',
  },
  {
    name: 'XTAL3225', repo: KICAD_FOOTPRINTS, path: 'Crystal.pretty/Crystal_SMD_3225-4Pin_3.2x2.5mm.kicad_mod',
    descr: '3.2 x 2.5 mm 4-pad SMD crystal — 25 MHz for W5500 / QCA7000-class parts',
    source: 'KiCad official library, Crystal/Crystal_SMD_3225-4Pin_3.2x2.5mm (same family as the TXC 7M used on the QCA7000 board in Millisman/QCA7000)',
  },

  // --- switching, protection, field wiring --------------------------------
  {
    name: 'G5LE1', repo: KICAD_FOOTPRINTS, path: 'Relay_THT.pretty/Relay_SPDT_Omron-G5LE-1.kicad_mod',
    descr: 'Omron G5LE-1 SPDT power relay, 12 V coil, 10 A contacts — switched socket outlet',
    source: 'KiCad official library, Relay_THT/Relay_SPDT_Omron-G5LE-1',
  },
  {
    name: 'AHES4291', repo: PIONIX, path: 'Yak/lib/ev-devboard.pretty/AHES4291.kicad_mod',
    descr: 'Panasonic AHES4291 relay, coil + 3 contact sets — heavier-duty alternative to G5LE-1',
    source: 'PIONIX EVerest reference hardware (Yak); pin roles from that project\'s symbol: COM_1..3, COIL_1/2, NC_3, NO_1/2',
  },
  {
    name: 'TERM3', repo: KICAD_FOOTPRINTS, path: 'TerminalBlock.pretty/TerminalBlock_bornier-3_P5.08mm.kicad_mod',
    descr: '3-position 5.08 mm screw terminal — L / N / PE field wiring',
    source: 'KiCad official library, TerminalBlock/TerminalBlock_bornier-3_P5.08mm',
  },
  {
    name: 'CUI_TB003', repo: PIONIX, path: 'Yak/lib/ev-devboard.pretty/CUI_TB003-500-P03BE.kicad_mod',
    descr: 'CUI TB003-500-P03BE, 3-position 5.00 mm terminal block, drill 1.4 mm',
    source: 'PIONIX EVerest reference hardware (Yak), symbol TB003-500-P03BE',
  },
  {
    name: 'WAGO2604', repo: PIONIX, path: 'Yak/lib/ev-devboard.pretty/2604-1102.kicad_mod',
    descr: 'WAGO 2604-1102 through-hole terminal, 2 positions x 2 pads, 5.0 x 8.2 mm grid',
    source: 'PIONIX EVerest reference hardware (Yak); note WAGO also ships 2606-1105_increased_creepage for exactly this job',
  },
  {
    name: 'T60404', repo: PIONIX, path: 'Yak/lib/ev-devboard.pretty/T60404-N4641-X920.kicad_mod',
    descr: 'Vacuumschmelze T60404-N4641-X920 current sensor with signal conditioning, 16 pads + 5 mounting holes',
    source: 'PIONIX EVerest reference hardware (Yak); pin roles from that project\'s symbol (AC1_IN/AC1_OUT ... PWM_OUT, ERROR_OUT)',
  },
  {
    name: 'PLCREDBEET', repo: PIONIX, path: 'Yak/lib/ev-devboard.pretty/PLC_RED_Beet.kicad_mod',
    descr: 'PLC "Red Beet E" module — Green PHY modem with the analog lines (TXP/TXN/RXP/RXN) brought out, so coupling is external',
    source: 'PIONIX EVerest reference hardware (Yak); pinout from that project\'s Pionix.kicad_sym (33 pins)',
    courtyard: null,
  },

  // --- chip-level options (documented, not built) -------------------------
  {
    name: 'QFN68-8', repo: KICAD_FOOTPRINTS, path: 'Package_DFN_QFN.pretty/QFN-68-1EP_8x8mm_P0.4mm_EP5.2x5.2mm.kicad_mod',
    descr: 'QFN-68 8 x 8 mm, 0.4 mm pitch, 5.2 x 5.2 mm exposed pad — QCA7000 (bare-chip PLC alternative)',
    source: 'KiCad official library, Package_DFN_QFN/QFN-68-1EP_8x8mm_P0.4mm_EP5.2x5.2mm; the same package Millisman/QCA7000 uses for its QCA7000',
  },
  {
    name: 'LQFP48-7', repo: KICAD_FOOTPRINTS, path: 'Package_QFP.pretty/LQFP-48_7x7mm_P0.5mm.kicad_mod',
    descr: 'LQFP-48 7 x 7 mm, 0.5 mm pitch — W5500 (bare-chip Ethernet alternative to WIZ850io)',
    source: 'KiCad official library, Package_QFP/LQFP-48_7x7mm_P0.5mm',
  },

  // --- passives -----------------------------------------------------------
  {
    name: 'R0603', repo: KICAD_FOOTPRINTS, path: 'Resistor_SMD.pretty/R_0603_1608Metric.kicad_mod',
    descr: '0603 (1608 metric) chip resistor', source: 'KiCad official library',
  },
  {
    name: 'C0603', repo: KICAD_FOOTPRINTS, path: 'Capacitor_SMD.pretty/C_0603_1608Metric.kicad_mod',
    descr: '0603 (1608 metric) chip capacitor', source: 'KiCad official library',
  },
  {
    name: 'LRAD12', repo: KICAD_FOOTPRINTS, path: 'Inductor_THT.pretty/L_Radial_D12.0mm_P5.00mm_Fastron_11P.kicad_mod',
    descr: 'Radial power inductor, Ø12 mm body, 5.0 mm lead pitch — 100 µH for the LM2576',
    source: 'KiCad official library, Inductor_THT/L_Radial_D12.0mm_P5.00mm_Fastron_11P',
  },
];

/* --------------------------------------------------------------- fetch/parse */

/**
 * Read a file from a public GitHub repository.
 *
 * Prefers the `gh` CLI when it is on PATH: it carries the user's credentials (no
 * 60/hour anonymous ceiling) and it works behind TLS-intercepting proxies, which
 * plain `fetch` does not. Falls back to the REST API with the raw accept header.
 */
function ghAvailable() {
  if (ghAvailable.cache !== undefined) return ghAvailable.cache;
  try {
    const r = spawnSync('gh', ['--version'], { encoding: 'utf8' });
    ghAvailable.cache = r.status === 0;
  } catch { ghAvailable.cache = false; }
  return ghAvailable.cache;
}

async function fetchFootprint(repo, path) {
  const api = `repos/${repo}/contents/${path}`;
  if (ghAvailable()) {
    const r = spawnSync('gh', ['api', api, '-H', 'Accept: application/vnd.github.raw'], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status !== 0) throw new Error(`${repo}/${path} → gh api failed: ${(r.stderr || '').trim().slice(0, 160)}`);
    return r.stdout;
  }
  const url = `https://api.github.com/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, { headers: { accept: 'application/vnd.github.raw', 'user-agent': 'html5-eda-import' } });
  if (!res.ok) throw new Error(`${repo}/${path} → HTTP ${res.status}`);
  return res.text();
}

const PAD_RE = /\(pad "?([^"\s]*)"?\s+(\w+)\s+(\w+)\s+\(at ([-\d.]+)\s+([-\d.]+)(?:\s+([-\d.]+))?\)\s+\(size ([-\d.]+)\s+([-\d.]+)\)((?:\s+\(drill[^)]*\))?)/g;

/**
 * KiCad lets several pads share a name (every shell leg of an SMA jack, every
 * thermal via under an exposed pad). EAGLE does not: pad names must be unique
 * inside a package. Repeats get a `_2`, `_3`, … suffix, and the deviceset's
 * connect lists them all — `<connect pin="SH" pad="2 2_2 2_3 2_4"/>` is legal
 * EAGLE and is what the generator emits for an array.
 */
function uniqueNames(pads) {
  const seen = new Map();
  pads.forEach((pad, i) => { if (!pad.name) pad.name = `P${i + 1}`; });   // KiCad thermal vias are unnamed
  for (const pad of pads) {
    const n = seen.get(pad.name) ?? 0;
    seen.set(pad.name, n + 1);
    if (n) pad.name = `${pad.name}_${n + 1}`;
  }
  return pads;
}

export function parseFootprint(text, opt = {}) {
  const pads = [];
  const holes = [];
  for (const m of text.matchAll(PAD_RE)) {
    const [, name, type, shape, x, y, rot, w, h, drillPart] = m;
    const drill = /\(drill (?:oval )?([\d.]+)/.exec(drillPart || '');
    const rec = {
      name: (opt.rename && opt.rename[name]) || name,
      // KiCad y is down-positive; EAGLE y is up-positive.
      x: Number(x), y: -Number(y), rot: Number(rot || 0),
    };
    if (type === 'smd') {
      rec.smd = { dx: Number(w), dy: Number(h) };
      if (rec.rot === 90 || rec.rot === 270) { rec.smd.dx = Number(h); rec.smd.dy = Number(w); rec.rot = 0; }
    } else {
      rec.drill = drill ? Number(drill[1]) : 0.9;
      rec.diameter = Number(w);
      if (shape === 'rect' || shape === 'roundrect' || shape === 'oval') rec.shape = 'square';
      if (type === 'np_thru_hole') { holes.push({ x: rec.x, y: rec.y, drill: rec.drill }); continue; }
    }
    pads.push(rec);
  }
  const box = [];
  const collect = (layerRe) => {
    for (const m of text.matchAll(/\(fp_(?:line|rect)\b([\s\S]*?)\)\s*\)\s*\n/g)) {
      const seg = m[1];
      const lay = /\(layer ([\w.]+)\)/.exec(seg);
      if (!lay || !layerRe.test(lay[1])) continue;
      for (const c of seg.matchAll(/\((?:start|end) ([-\d.]+) ([-\d.]+)\)/g)) {
        box.push([Number(c[1]), -Number(c[2])]);
      }
    }
  };
  collect(/^F\.CrtYd$/);
  if (!box.length) collect(/^F\.Fab$/);
  if (!box.length) {
    for (const m of text.matchAll(/\(fp_circle \(center ([-\d.]+) ([-\d.]+)\) \(end ([-\d.]+) ([-\d.]+)\)/g)) {
      const [cx, cy, ex, ey] = m.slice(1).map(Number);
      const r = Math.hypot(ex - cx, ey - cy);
      box.push([cx - r, -(cy - r)], [cx + r, -(cy + r)]);
    }
  }
  let courtyard;
  if (opt.courtyard) courtyard = opt.courtyard;
  else if (box.length) {
    courtyard = {
      x1: Math.min(...box.map((p) => p[0])), y1: Math.min(...box.map((p) => p[1])),
      x2: Math.max(...box.map((p) => p[0])), y2: Math.max(...box.map((p) => p[1])),
    };
  } else {
    const xs = [...pads.map((p) => p.x), ...holes.map((h) => h.x)];
    const ys = [...pads.map((p) => p.y), ...holes.map((h) => h.y)];
    courtyard = { x1: Math.min(...xs) - 1, y1: Math.min(...ys) - 1, x2: Math.max(...xs) + 1, y2: Math.max(...ys) + 1 };
  }
  for (const k of ['x1', 'y1', 'x2', 'y2']) courtyard[k] = Math.round(courtyard[k] * 1000) / 1000;
  const renamed = uniqueNames(pads);
  const dupes = renamed.filter((p) => p.name.includes('_')).map((p) => p.name);
  return { courtyard, pads: renamed, holes, dupes };
}

/* -------------------------------------------------------------------- emit */

const js = (v) => JSON.stringify(v);

function emitPackage(pkg) {
  const lines = [];
  lines.push(`  ${js(pkg.name)}: {`);
  lines.push(`    name: ${js(pkg.name)},`);
  lines.push(`    descr: ${js(pkg.descr)},`);
  lines.push(`    // ${pkg.source}`);
  lines.push(`    // fetched ${pkg.fetched} from ${pkg.repo}/${pkg.path} (${pkg.bytes} bytes)`);
  lines.push(`    courtyard: { x1: ${pkg.courtyard.x1}, y1: ${pkg.courtyard.y1}, x2: ${pkg.courtyard.x2}, y2: ${pkg.courtyard.y2} },`);
  lines.push('    pads: [');
  for (const p of pkg.pads) {
    if (p.smd) lines.push(`      { name: ${js(p.name)}, x: ${p.x}, y: ${p.y}, smd: { dx: ${p.smd.dx}, dy: ${p.smd.dy}, layer: 1 } },`);
    else lines.push(`      { name: ${js(p.name)}, x: ${p.x}, y: ${p.y}, drill: ${p.drill}, diameter: ${p.diameter}${p.shape ? `, shape: ${js(p.shape)}` : ''} },`);
  }
  lines.push('    ],');
  if (pkg.holes.length) {
    lines.push('    holes: [');
    for (const h of pkg.holes) lines.push(`      { x: ${h.x}, y: ${h.y}, drill: ${h.drill} },`);
    lines.push('    ],');
  }
  lines.push('  },');
  return lines.join('\n');
}

export function renderModule(pkgs, when) {
  return `/**
 * eda-packages.mjs — GENERATED FILE, do not edit by hand.
 *
 *   node tools/import-kicad-footprints.mjs        (re-fetch and rewrite)
 *
 * ${pkgs.length} packages, imported ${when}. Every pad coordinate below was read
 * from a published KiCad footprint; the comment above each entry names the
 * repository and path it came from, plus the datasheet that fixes the pin roles.
 * Nothing here is inferred from a photograph or a forum post.
 *
 * Schema (same as tools/wallplug-model.mjs):
 *   courtyard {x1,y1,x2,y2}   mm, EAGLE orientation (y up)
 *   pads      [{name,x,y,drill,diameter,shape?} | {name,x,y,smd:{dx,dy,layer}}]
 *   holes     [{x,y,drill}]   non-plated: mounting holes, no copper
 */

export const PACKAGE_SOURCES = {
${pkgs.map((p) => `  ${js(p.name)}: { repo: ${js(p.repo)}, path: ${js(p.path)}, bytes: ${p.bytes}, fetched: ${js(p.fetched)} },`).join('\n')}
};

export const IMPORTED_PACKAGES = {
${pkgs.map(emitPackage).join('\n')}
};

export default IMPORTED_PACKAGES;
`;
}

export async function importAll({ write = true } = {}) {
  const when = new Date().toISOString().slice(0, 10);
  const pkgs = [];
  const report = [];
  for (const t of TARGETS) {
    const text = await fetchFootprint(t.repo, t.path);
    const { courtyard, pads, holes, dupes } = parseFootprint(text, t);
    if (!pads.length) throw new Error(`${t.name}: no pads parsed from ${t.repo}/${t.path}`);
    pkgs.push({
      ...t, courtyard, pads, holes, bytes: text.length, fetched: when,
      dupes: dupes || [],
    });
    report.push(`${t.name.padEnd(12)} ${String(pads.length).padStart(3)} pads ${String(holes.length).padStart(2)} np  court ${courtyard.x1}..${courtyard.x2} × ${courtyard.y1}..${courtyard.y2}${dupes.length ? `  renamed ${dupes.join(',')}` : ''}`);
  }
  const body = renderModule(pkgs, when);
  if (write) writeFileSync(OUT, body, 'utf8');
  return { pkgs, body, report, outPath: OUT };
}

const isMain = process.argv[1] && import.meta.url === `file://${resolve(process.argv[1])}`;
if (isMain) {
  const dry = process.argv.includes('--dry');
  const { report, body, outPath } = await importAll({ write: !dry });
  console.log(report.join('\n'));
  console.log(`\n${report.length} packages, ${body.length} bytes of source`);
  console.log(dry ? '--dry: nothing written' : `wrote ${outPath}`);
  if (!dry && existsSync(outPath)) {
    const back = readFileSync(outPath, 'utf8');
    if (back !== body) { console.error('read-back mismatch'); process.exit(1); }
    console.log('read-back matches');
  }
}
