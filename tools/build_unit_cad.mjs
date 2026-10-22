#!/usr/bin/env node
/**
 * Spec-derived mechanical model + bill of materials for the two units.
 *
 * HONESTY NOTE, READ BEFORE TRUSTING ANY NUMBER HERE
 * --------------------------------------------------
 * Neither unit has been torn down and no schematic for either is public. So
 * every BOM line carries a `provenance` field:
 *
 *   spec           taken from the vendor's published datasheet/manual.
 *   standard       A published industry standard dimension (EIA-310, IEC 60603-7).
 *   inferred       Geometrically derived from the above; not stated by the vendor.
 *   NOT PUBLISHED  The vendor has not disclosed it. No part number is invented.
 *
 * Anything marked NOT PUBLISHED stays that way. A plausible-looking part number
 * for a secure element we have never seen would be fabrication dressed as
 * reverse engineering.
 *
 * Outputs: DXF (R12 ASCII), SVG, and BOM CSV.
 *   node tools/build_unit_cad.mjs --emit --out-dir cad/out
 *   node tools/build_unit_cad.mjs --check
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const IN = 25.4; // mm per inch

// ------------------------------------------------- published specifications

export const NMU_SPEC = Object.freeze({
  id: "nmu",
  name: "WideBand Network Management Unit (nMU)",
  partNumber: "WBNMUPRO",
  publishedDimsIn: { w: 19.0, d: 7.3, h: 4.3 },
  publishedDimsSource: "wband.com/products/gigabit-ethernet-networking/professional-network-management-unit-nmu/",
  rackUnits: 2,
  weightLbs: 8.6,
  ports: Object.freeze([
    { key: "lan", label: "LAN 10/100/1000 GbE", connector: "IEC 60603-7 8P8C (RJ45)", count: 1, provenance: "spec" },
    { key: "wan", label: "WAN 10/100 Ethernet", connector: "IEC 60603-7 8P8C (RJ45)", count: 1, provenance: "spec" },
    { key: "usb", label: "Maintenance USB", connector: "USB Type-A receptacle", count: 1, provenance: "spec" },
    { key: "vga", label: "Maintenance VGA", connector: "DE-15 (HD-15)", count: 1, provenance: "spec" },
    { key: "kbd", label: "Maintenance keyboard", connector: "Mini-DIN-6 (PS/2)", count: 1, provenance: "spec" },
    { key: "mouse", label: "Maintenance mouse", connector: "Mini-DIN-6 (PS/2)", count: 1, provenance: "spec" },
    { key: "serial", label: "Maintenance serial", connector: "DE-9", count: 1, provenance: "spec" },
  ]),
  managesSwitches: 128,
  slaveManagesSwitches: 64,
  slavePartNumber: "WBNMUPRO-S",
});

export const GOLDKEY_SPEC = Object.freeze({
  id: "goldkey",
  name: "GoldKey Security Token",
  publishedDimsMm: { w: 30, h: 12, t: 4.5 },
  publishedDimsSource: "goldkey.com product data / PCMag 2011 review",
  enclosure: "stainless steel filled with industrial epoxy",
  battery: "none (USB powered)",
  interface: "USB 1.1, CCID",
  maxCerts: 24,
});

/** Standard connector cutout sizes, mm (w x h). Industry-standard envelope. */
export const CONNECTOR_CUTOUT_MM = Object.freeze({
  "IEC 60603-7 8P8C (RJ45)": { w: 15.0, h: 13.5 },
  "USB Type-A receptacle": { w: 13.0, h: 6.5 },
  "DE-15 (HD-15)": { w: 31.0, h: 9.0 },
  "Mini-DIN-6 (PS/2)": { w: 12.0, h: 12.0 },
  "DE-9": { w: 31.0, h: 9.0 },
});

// -------------------------------------------------------- EIA-310 rack panel

/**
 * EIA-310-D 19 inch rack panel. 1U = 1.75 in; 2U = 3.5 in. Mounting holes on a
 * 0.625 in vertical pitch, 0.25 in from the panel edge.
 */
export function rackPanel(rackUnits) {
  const heightIn = 1.75 * rackUnits;
  const holePitchIn = 0.625;
  const holes = [];
  // Holes sit on the 0.625 grid, offset by 0.25 in within each 1.75 in band.
  for (let u = 0; u < rackUnits; u++) {
    for (const off of [0.625, 1.25]) {
      holes.push({ x: 0.25, y: u * 1.75 + off });
      holes.push({ x: 19.0 - 0.25, y: u * 1.75 + off });
    }
  }
  return {
    widthIn: 19.0,
    heightIn,
    widthMm: 19.0 * IN,
    heightMm: heightIn * IN,
    holePitchIn,
    mountingHoles: holes,
    standard: "EIA-310-D",
  };
}

/**
 * Lay the published ports out left to right with even gaps, and compute each
 * cutout rectangle in mm. Positions are derived, never copied, so they are
 * marked `inferred` even though the port list itself is `spec`.
 */
export function layoutFrontPanel(spec, panel, { gapMm = 6, leftMarginMm = 20 } = {}) {
  const cutouts = [];
  let x = leftMarginMm;
  const midY = panel.heightMm / 2;

  for (const p of spec.ports) {
    const size = CONNECTOR_CUTOUT_MM[p.connector];
    if (!size) throw new Error(`no standard cutout size for ${p.connector}`);
    for (let i = 0; i < p.count; i++) {
      const w = size.w;
      const h = size.h;
      cutouts.push({
        port: p.key,
        connector: p.connector,
        index: i,
        x,
        y: midY - h / 2,
        w,
        h,
        provenance: "inferred", // geometry derived; the port list itself is spec
      });
      x += w + gapMm;
    }
  }
  const usedMm = x - gapMm - leftMarginMm;
  return {
    cutouts,
    usedMm,
    rightEdgeMm: x - gapMm,
    fitsWithinPanel: x - gapMm <= panel.widthMm,
  };
}

/**
 * The published nMU dimensions are internally inconsistent: it is called a 2U
 * unit, which is 3.5 in tall by EIA-310-D, but the datasheet lists 4.3 in.
 * Report the conflict instead of silently picking one.
 */
export function checkSpecConsistency(spec) {
  const issues = [];
  const stdHeightIn = 1.75 * spec.rackUnits;
  const pub = spec.publishedDimsIn;
  const matchesStandard = [pub.w, pub.d, pub.h].some((v) => Math.abs(v - stdHeightIn) < 0.01);
  if (!matchesStandard) {
    issues.push(
      `${spec.name}: published dims ${pub.w} x ${pub.d} x ${pub.h} in contain no ` +
      `${stdHeightIn} in value, but the unit is described as ${spec.rackUnits}U ` +
      `(= ${stdHeightIn} in per EIA-310-D). The axis ordering is ambiguous and the ` +
      `vendor does not resolve it. Panel height here uses the ${stdHeightIn} in standard.`,
    );
  }
  return issues;
}

// -------------------------------------------------------------------- BOM

/**
 * Bill of materials. Every line declares where its numbers came from.
 * Components the vendor has not disclosed are listed as NOT PUBLISHED rather
 * than filled in with a guess.
 */
export function buildBom(spec, panel, layout) {
  // Dispatch on structure, not on the id string: a spec with a port list is a
  // panel-mount unit, one without is a handheld token. Matching on id made this
  // brittle for any injected or renamed spec.
  if (spec.ports) {
    return [
      { item: 1, qty: 1, description: "Front panel, 19 in rack", detail: `${panel.widthIn} x ${panel.heightIn} in, ${panel.standard}`, provenance: "standard" },
      { item: 2, qty: panel.mountingHoles.length, description: "Rack mounting hole", detail: `${panel.holePitchIn} in vertical pitch`, provenance: "standard" },
      { item: 3, qty: 2, description: "IEC 60603-7 8P8C (RJ45) receptacle", detail: "LAN 10/100/1000 + WAN 10/100", provenance: "spec" },
      { item: 4, qty: 1, description: "DE-15 (HD-15) VGA receptacle", detail: "maintenance console", provenance: "spec" },
      { item: 5, qty: 2, description: "Mini-DIN-6 (PS/2) receptacle", detail: "keyboard + mouse", provenance: "spec" },
      { item: 6, qty: 1, description: "DE-9 serial receptacle", detail: "maintenance console", provenance: "spec" },
      { item: 7, qty: 1, description: "USB Type-A receptacle", detail: "maintenance console", provenance: "spec" },
      { item: 8, qty: 1, description: "Enclosure", detail: "2U, 19 in rack, ~8.6 lbs", provenance: "spec" },
      { item: 9, qty: 1, description: "CPU / system-on-module", detail: "not disclosed by vendor", provenance: "NOT PUBLISHED" },
      { item: 10, qty: 1, description: "Gigabit Ethernet MAC/PHY", detail: "not disclosed by vendor", provenance: "NOT PUBLISHED" },
      { item: 11, qty: 1, description: "Persistent storage", detail: "not disclosed by vendor", provenance: "NOT PUBLISHED" },
      { item: 12, qty: 1, description: "Power supply", detail: "not disclosed by vendor", provenance: "NOT PUBLISHED" },
      { item: 13, qty: 1, description: "S-Key authentication module", detail: "vendor states 'integrated S-Key technology'; whether this is RFC 1760/2289 S/KEY is not stated", provenance: "NOT PUBLISHED" },
      { item: 14, qty: 1, description: "PCB", detail: "no schematic or board image is public", provenance: "NOT PUBLISHED" },
    ];
  }
  return [
    { item: 1, qty: 1, description: "Enclosure shell", detail: `${spec.publishedDimsMm.w} x ${spec.publishedDimsMm.h} x ${spec.publishedDimsMm.t} mm, ${spec.enclosure}`, provenance: "spec" },
    { item: 2, qty: 1, description: "USB Type-A plug", detail: "integral, no cable; plug height matches the 4.5 mm body thickness", provenance: "inferred" },
    { item: 3, qty: 1, description: "Potting compound", detail: "industrial grade epoxy, seals and deters tampering", provenance: "spec" },
    { item: 4, qty: 1, description: "Secure element / smart card controller", detail: "PIV-capable, CCID; part not disclosed", provenance: "NOT PUBLISHED" },
    { item: 5, qty: 1, description: "NAND flash (flash models)", detail: "8/16/32/64 GB offered; part not disclosed", provenance: "NOT PUBLISHED" },
    { item: 6, qty: 1, description: "USB controller", detail: "USB 1.1; part not disclosed", provenance: "NOT PUBLISHED" },
    { item: 7, qty: 0, description: "Battery", detail: "none - USB powered", provenance: "spec" },
    { item: 8, qty: 1, description: "PCB", detail: "potted; no board image is public", provenance: "NOT PUBLISHED" },
  ];
}

// ------------------------------------------------------------- emitters

function rectLines(x, y, w, h) {
  return [
    [x, y, x + w, y],
    [x + w, y, x + w, y + h],
    [x + w, y + h, x, y + h],
    [x, y + h, x, y],
  ];
}

/** Minimal but valid R12 ASCII DXF containing only LINE entities. */
export function toDxf(entities) {
  const out = ["0", "SECTION", "2", "ENTITIES"];
  for (const [x1, y1, x2, y2] of entities) {
    out.push("0", "LINE", "8", "0",
      "10", x1.toFixed(4), "20", y1.toFixed(4), "30", "0.0",
      "11", x2.toFixed(4), "21", y2.toFixed(4), "31", "0.0");
  }
  out.push("0", "ENDSEC", "0", "EOF");
  return out.join("\n") + "\n";
}

export function toSvg(spec, panel, layout, widthMm, heightMm) {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthMm.toFixed(2)} ${heightMm.toFixed(2)}" width="${widthMm.toFixed(0)}" height="${heightMm.toFixed(0)}">`,
    `<title>${spec.name} front panel (spec-derived)</title>`,
    `<rect x="0" y="0" width="${widthMm.toFixed(2)}" height="${heightMm.toFixed(2)}" fill="none" stroke="#222" stroke-width="0.4"/>`,
  ];
  for (const c of layout.cutouts) {
    parts.push(`<rect x="${c.x.toFixed(2)}" y="${c.y.toFixed(2)}" width="${c.w.toFixed(2)}" height="${c.h.toFixed(2)}" fill="#eef" stroke="#33c" stroke-width="0.2"/>`);
    parts.push(`<text x="${(c.x + c.w / 2).toFixed(2)}" y="${(c.y - 1).toFixed(2)}" font-size="2.2" text-anchor="middle" fill="#33c">${c.port}</text>`);
  }
  for (const h of panel.mountingHoles) {
    parts.push(`<circle cx="${(h.x * IN).toFixed(2)}" cy="${(h.y * IN).toFixed(2)}" r="1.6" fill="none" stroke="#a00" stroke-width="0.25"/>`);
  }
  parts.push("</svg>");
  return parts.join("\n") + "\n";
}

export function bomToCsv(bom) {
  const head = ["item", "qty", "description", "detail", "provenance"];
  const esc = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [head.join(","), ...bom.map((r) => head.map((k) => esc(r[k])).join(","))].join("\n") + "\n";
}

// ---------------------------------------------------------------- check

/**
 * Real checks. Returns { ok, checks, failures } -- never a hardcoded pass.
 * `specs` is injectable so a caller (or a test) can feed a deliberately broken
 * specification and confirm the checks actually detect it; a self-check that
 * cannot be made to fail proves nothing.
 */
export function selfCheck({ specs = [NMU_SPEC, GOLDKEY_SPEC] } = {}) {
  const checks = [];
  const failures = [];
  const check = (name, cond, detail = "") => {
    checks.push(name);
    if (!cond) failures.push(`${name}${detail ? ": " + detail : ""}`);
  };

  for (const spec of specs) {
    const panel = rackPanel(spec.rackUnits || 1);
    const layout = spec.ports ? layoutFrontPanel(spec, panel) : { cutouts: [], usedMm: 0, rightEdgeMm: 0, fitsWithinPanel: true };
    const bom = buildBom(spec, panel, layout);

    if (spec.ports) {
      check(`${spec.id}: panel height is 2U per EIA-310-D`, Math.abs(panel.heightIn - 3.5) < 1e-9, `${panel.heightIn}`);
      check(`${spec.id}: ${panel.mountingHoles.length} mounting holes on a 0.625 in pitch`,
        panel.mountingHoles.length === 8 && panel.holePitchIn === 0.625);
      for (const h of panel.mountingHoles) {
        check(`${spec.id}: hole y=${h.y} within panel`, h.y > 0 && h.y < panel.heightIn);
      }
      // Every published port must appear as a cutout.
      for (const p of spec.ports) {
        const n = layout.cutouts.filter((c) => c.port === p.key).length;
        check(`${spec.id}: port ${p.key} has ${p.count} cutout(s)`, n === p.count, `found ${n}`);
      }
      // Cutouts must stay inside the panel and must not overlap.
      for (const c of layout.cutouts) {
        check(`${spec.id}: cutout ${c.port} inside panel horizontally`,
          c.x >= 0 && c.x + c.w <= panel.widthMm, `x=${c.x.toFixed(1)} w=${c.w}`);
        check(`${spec.id}: cutout ${c.port} inside panel vertically`,
          c.y >= 0 && c.y + c.h <= panel.heightMm, `y=${c.y.toFixed(1)} h=${c.h}`);
      }
      const sorted = [...layout.cutouts].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        check(`${spec.id}: no overlap between ${prev.port} and ${sorted[i].port}`,
          prev.x + prev.w <= sorted[i].x + 1e-9, `prev end ${(prev.x + prev.w).toFixed(1)} > next start ${sorted[i].x.toFixed(1)}`);
      }
      check(`${spec.id}: layout fits within the panel`, layout.fitsWithinPanel);
    }

    // BOM integrity.
    const provs = new Set(bom.map((r) => r.provenance));
    check(`${spec.id}: every BOM line declares provenance`, bom.every((r) => r.provenance));
    check(`${spec.id}: BOM uses only known provenance values`,
      [...provs].every((p) => ["spec", "standard", "inferred", "NOT PUBLISHED"].includes(p)),
      [...provs].join("/"));
    const undisclosed = bom.filter((r) => r.provenance === "NOT PUBLISHED");
    check(`${spec.id}: ${undisclosed.length} undisclosed component(s) listed rather than guessed`, undisclosed.length > 0);
    for (const r of undisclosed) {
      check(`${spec.id}: undisclosed line ${r.item} carries no part number`,
        !/\b[A-Z]{2,}\d{3,}\b/.test(r.detail), r.detail);
    }
  }

  const issues = [];
  for (const spec of specs) {
    if (!spec.publishedDimsIn || !spec.rackUnits) continue;
    issues.push(...checkSpecConsistency(spec));
  }

  return { ok: failures.length === 0, checks: checks.length, failures, dimensionIssues: issues };
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes("--check")) {
    const r = selfCheck();
    console.log(`ran ${r.checks} checks, ${r.failures.length} failure(s)`);
    for (const f of r.failures) console.log(`  FAIL ${f}`);
    if (r.dimensionIssues.length) {
      console.log("\nspecification conflicts found in the published data:");
      for (const i of r.dimensionIssues) console.log(`  - ${i}`);
    }
    return r.ok ? 0 : 1;
  }
  const i = args.indexOf("--out-dir");
  const outDir = i >= 0 && args[i + 1] ? args[i + 1] : "cad/out";
  mkdirSync(outDir, { recursive: true });
  for (const spec of [NMU_SPEC, GOLDKEY_SPEC]) {
    const panel = rackPanel(spec.rackUnits || 1);
    if (spec.ports) {
      const layout = layoutFrontPanel(spec, panel);
      const ents = rectLines(0, 0, panel.widthMm, panel.heightMm);
      for (const c of layout.cutouts) ents.push(...rectLines(c.x, c.y, c.w, c.h));
      writeFileSync(join(outDir, `${spec.id}-front-panel.dxf`), toDxf(ents));
      writeFileSync(join(outDir, `${spec.id}-front-panel.svg`), toSvg(spec, panel, layout, panel.widthMm, panel.heightMm));
      writeFileSync(join(outDir, `${spec.id}-bom.csv`), bomToCsv(buildBom(spec, panel, layout)));
      console.log(`wrote ${spec.id} panel (${layout.cutouts.length} cutouts) + BOM (${buildBom(spec, panel, layout).length} lines)`);
    } else {
      const g = GOLDKEY_SPEC.publishedDimsMm;
      const ents = rectLines(0, 0, g.w, g.h);
      writeFileSync(join(outDir, `${spec.id}-body.dxf`), toDxf(ents));
      writeFileSync(join(outDir, `${spec.id}-body.svg`),
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.w} ${g.h}" width="${g.w * 8}" height="${g.h * 8}">` +
        `<rect x="0.4" y="0.4" width="${g.w - 0.8}" height="${g.h - 0.8}" fill="#ccd" stroke="#334" stroke-width="0.3"/>` +
        `<rect x="0.4" y="${g.h / 2 - 2.25}" width="12" height="4.5" fill="#889" stroke="#334" stroke-width="0.3"/>` +
        `<text x="${g.w / 2}" y="${g.h / 2 + 1}" font-size="3" text-anchor="middle">${g.w} x ${g.h} x ${g.t} mm</text></svg>\n`);
      writeFileSync(join(outDir, `${spec.id}-bom.csv`), bomToCsv(buildBom(spec, panel, null)));
      console.log(`wrote ${spec.id} body (${g.w} x ${g.h} x ${g.t} mm) + BOM (${buildBom(spec, panel, null).length} lines)`);
    }
  }
  return 0;
}

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (invokedDirectly) process.exit(main(process.argv));
