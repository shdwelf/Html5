import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  CONNECTOR_CUTOUT_MM,
  GOLDKEY_SPEC,
  NMU_SPEC,
  bomToCsv,
  buildBom,
  checkSpecConsistency,
  layoutFrontPanel,
  rackPanel,
  selfCheck,
  toDxf,
  toSvg,
} from "../tools/build_unit_cad.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const CLI = join(here, "..", "tools", "build_unit_cad.mjs");
const PROVENANCE = ["spec", "standard", "inferred", "NOT PUBLISHED"];

function runCli(...args) {
  try {
    return { status: 0, out: execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8" }) };
  } catch (e) {
    return { status: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

// ---------------------------------------------------------------- panel

test("a 2U panel is 3.5 in tall with 8 mounting holes on a 0.625 in pitch", () => {
  const p = rackPanel(2);
  assert.equal(p.heightIn, 3.5);
  assert.equal(p.widthIn, 19.0);
  assert.ok(Math.abs(p.heightMm - 88.9) < 1e-9);
  assert.ok(Math.abs(p.widthMm - 482.6) < 1e-9);
  assert.equal(p.mountingHoles.length, 8);
  assert.equal(p.holePitchIn, 0.625);
  assert.equal(p.standard, "EIA-310-D");
});

test("a 1U panel has 4 mounting holes and 1.75 in height", () => {
  const p = rackPanel(1);
  assert.equal(p.heightIn, 1.75);
  assert.equal(p.mountingHoles.length, 4);
});

// -------------------------------------------------------------- layout

test("every published nMU port becomes a cutout", () => {
  const panel = rackPanel(2);
  const layout = layoutFrontPanel(NMU_SPEC, panel);
  assert.equal(layout.cutouts.length, 7);
  for (const p of NMU_SPEC.ports) {
    assert.equal(layout.cutouts.filter((c) => c.port === p.key).length, p.count, p.key);
  }
});

test("all cutouts lie inside the panel and none overlap", () => {
  const panel = rackPanel(2);
  const layout = layoutFrontPanel(NMU_SPEC, panel);
  for (const c of layout.cutouts) {
    assert.ok(c.x >= 0 && c.x + c.w <= panel.widthMm, `${c.port} horizontal`);
    assert.ok(c.y >= 0 && c.y + c.h <= panel.heightMm, `${c.port} vertical`);
  }
  const sorted = [...layout.cutouts].sort((a, b) => a.x - b.x);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i - 1].x + sorted[i - 1].w <= sorted[i].x + 1e-9,
      `${sorted[i - 1].port} overlaps ${sorted[i].port}`);
  }
  assert.equal(layout.fitsWithinPanel, true);
});

test("every connector in the port list has a standard cutout size", () => {
  for (const p of NMU_SPEC.ports) {
    assert.ok(CONNECTOR_CUTOUT_MM[p.connector], `missing size for ${p.connector}`);
  }
});

test("layout throws on an unknown connector rather than guessing a size", () => {
  const panel = rackPanel(2);
  const fake = { ...NMU_SPEC, ports: [{ key: "x", connector: "Imaginary 40-pin", count: 1 }] };
  assert.throws(() => layoutFrontPanel(fake, panel), /no standard cutout size/);
});

// -------------------------------------------------------- spec conflict

test("the published nMU dimensions are detected as conflicting with 2U", () => {
  const issues = checkSpecConsistency(NMU_SPEC);
  assert.equal(issues.length, 1);
  assert.match(issues[0], /3\.5 in/);
  assert.match(issues[0], /4\.3/);
  assert.match(issues[0], /ambiguous/);
});

test("a spec whose dims contain the rack height raises no conflict", () => {
  const ok = { ...NMU_SPEC, publishedDimsIn: { w: 19.0, d: 7.3, h: 3.5 } };
  assert.deepEqual(checkSpecConsistency(ok), []);
});

// ----------------------------------------------------------------- BOM

test("every BOM line declares a provenance from the allowed set", () => {
  const panel = rackPanel(2);
  const layout = layoutFrontPanel(NMU_SPEC, panel);
  for (const bom of [buildBom(NMU_SPEC, panel, layout), buildBom(GOLDKEY_SPEC, panel, null)]) {
    for (const row of bom) {
      assert.ok(row.provenance, `row ${row.item} missing provenance`);
      assert.ok(PROVENANCE.includes(row.provenance), `bad provenance ${row.provenance}`);
    }
  }
});

test("undisclosed components are listed as NOT PUBLISHED, not invented", () => {
  const panel = rackPanel(2);
  const layout = layoutFrontPanel(NMU_SPEC, panel);
  const bom = buildBom(NMU_SPEC, panel, layout);
  const hidden = bom.filter((r) => r.provenance === "NOT PUBLISHED");
  assert.ok(hidden.length >= 5, `expected several undisclosed lines, got ${hidden.length}`);
  for (const r of hidden) {
    // No fabricated part numbers: reject anything shaped like AB1234.
    assert.ok(!/[A-Z]{2,}\d{3,}/.test(r.detail), `row ${r.item} looks like a fabricated part: ${r.detail}`);
  }
});

test("the S-Key line records the unresolved RFC question instead of asserting it", () => {
  const bom = buildBom(NMU_SPEC, rackPanel(2), null);
  const skey = bom.find((r) => /S-Key/.test(r.description));
  assert.ok(skey);
  assert.equal(skey.provenance, "NOT PUBLISHED");
  assert.match(skey.detail, /RFC 1760\/2289/);
  assert.match(skey.detail, /not stated/);
});

test("the GoldKey BOM states there is no battery and matches the published envelope", () => {
  const bom = buildBom(GOLDKEY_SPEC, rackPanel(1), null);
  const batt = bom.find((r) => /Battery/.test(r.description));
  assert.equal(batt.qty, 0);
  assert.match(batt.detail, /none/);
  const shell = bom.find((r) => /Enclosure shell/.test(r.description));
  assert.match(shell.detail, /30 x 12 x 4\.5 mm/);
  assert.match(shell.detail, /stainless steel/);
});

test("bomToCsv escapes commas and quotes correctly", () => {
  const csv = bomToCsv([{ item: 1, qty: 1, description: 'a, "b"', detail: "c", provenance: "spec" }]);
  const lines = csv.trim().split("\n");
  assert.equal(lines[0], "item,qty,description,detail,provenance");
  assert.equal(lines[1], '1,1,"a, ""b""",c,spec');
  // Round-trips through a naive CSV field count only because of the escaping.
  assert.equal(lines[1].split(",")[0], "1");
});

// ------------------------------------------------------------- emitters

test("toDxf emits a valid R12 structure with one LINE block per entity", () => {
  const ents = [[0, 0, 10, 0], [10, 0, 10, 10]];
  const dxf = toDxf(ents);
  const lines = dxf.trim().split("\n");
  // 4 header + 16 per LINE + 4 footer.
  assert.equal(lines.length, 8 + 16 * ents.length);
  assert.equal(lines[0], "0");
  assert.equal(lines[1], "SECTION");
  assert.equal(lines[lines.length - 2], "0");
  assert.equal(lines[lines.length - 1], "EOF");
  assert.equal(dxf.split("\n").filter((l) => l === "LINE").length, 2);
});

test("toSvg renders one rectangle per cutout plus the panel outline", () => {
  const panel = rackPanel(2);
  const layout = layoutFrontPanel(NMU_SPEC, panel);
  const svg = toSvg(NMU_SPEC, panel, layout, panel.widthMm, panel.heightMm);
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.trim().endsWith("</svg>"));
  assert.equal((svg.match(/<rect /g) || []).length, layout.cutouts.length + 1);
  assert.equal((svg.match(/<circle /g) || []).length, panel.mountingHoles.length);
});

// ------------------------------------------------------------ selfCheck

test("selfCheck runs real checks and reports zero failures", () => {
  const r = selfCheck();
  assert.ok(r.checks >= 50, `only ${r.checks} checks ran`);
  assert.deepEqual(r.failures, []);
  assert.equal(r.ok, true);
  assert.equal(r.dimensionIssues.length, 1);
});

test("selfCheck actually detects a broken specification", () => {
  // Guards against a self-check that reports ok unconditionally: such a version
  // passes the test above and is indistinguishable from a real clean run.
  const broken = {
    ...NMU_SPEC,
    id: "broken",
    ports: [{ key: "rj", label: "RJ45", connector: "IEC 60603-7 8P8C (RJ45)", count: 40, provenance: "spec" }],
  };
  const r = selfCheck({ specs: [broken] });
  assert.equal(r.ok, false);
  assert.ok(r.failures.length > 0);
  assert.ok(r.failures.some((f) => /fits within the panel/.test(f)), r.failures.join(" | "));
  assert.ok(r.failures.some((f) => /inside panel horizontally/.test(f)));
});

test("selfCheck reports the dimension conflict only for specs that have one", () => {
  const clean = { ...NMU_SPEC, id: "clean", publishedDimsIn: { w: 19.0, d: 7.3, h: 3.5 } };
  assert.equal(selfCheck({ specs: [clean] }).dimensionIssues.length, 0);
  assert.equal(selfCheck({ specs: [NMU_SPEC] }).dimensionIssues.length, 1);
});

// ----------------------------------------------------------------- CLI

test("CLI --check exits 0 and prints the check count", () => {
  const r = runCli("--check");
  assert.equal(r.status, 0);
  assert.match(r.out, /ran \d+ checks, 0 failure\(s\)/);
  const n = parseInt(r.out.match(/ran (\d+) checks/)[1], 10);
  assert.ok(n >= 50, `CLI reported only ${n} checks`);
});

test("CLI --emit writes all six artefacts", () => {
  const dir = join(here, "..", ".cache", "cad-test-out");
  rmSync(dir, { recursive: true, force: true });
  const r = runCli("--emit", "--out-dir", dir);
  assert.equal(r.status, 0);
  for (const f of [
    "nmu-front-panel.dxf", "nmu-front-panel.svg", "nmu-bom.csv",
    "goldkey-body.dxf", "goldkey-body.svg", "goldkey-bom.csv",
  ]) {
    assert.ok(existsSync(join(dir, f)), `missing ${f}`);
  }
  const dxf = readFileSync(join(dir, "nmu-front-panel.dxf"), "utf8");
  assert.ok(dxf.endsWith("EOF\n"));
  const csv = readFileSync(join(dir, "nmu-bom.csv"), "utf8");
  assert.match(csv, /^item,qty,description,detail,provenance$/m);
  assert.match(csv, /NOT PUBLISHED/);
  rmSync(dir, { recursive: true, force: true });
});
