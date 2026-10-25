// T10.2 Granite Island TSCM: the distilled inspection checklist stays sourced and well-formed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync(new URL("../resources/tscm/granite-island-inspection-2026-10-23.json", import.meta.url), "utf8"));

test("checklist cites Granite Island Group's public doctrine and states its defensive boundary", () => {
  assert.equal(pack.format, "tscm-inspection-checklist-v1");
  assert.match(pack.source.firm, /Granite Island Group/);
  assert.ok(pack.source.pages.length >= 3 && pack.source.pages.every((p) => p.url.startsWith("http://www.tscm.com/")));
  assert.match(pack.source.note, /defensive/i);
  assert.match(pack.source.note, /not reproduced/);
});

test("the 13-phase inspection sequence is complete, ordered, and escalates silently first", () => {
  assert.equal(pack.phases.length, 13);
  pack.phases.forEach((ph, i) => {
    assert.equal(ph.n, i + 1, "phases are sequential");
    assert.ok(ph.title.length > 3 && ph.checks.length >= 3, `phase ${ph.n} carries real checks`);
  });
  const alerting = pack.phases.map((p) => p.alerting);
  assert.ok(alerting.indexOf("passive") < alerting.indexOf("active-alerting"), "passive phases precede alerting ones");
  assert.equal(pack.phases[12].alerting, "response");
  assert.match(pack.phases[12].checks.join(" "), /law-enforcement/i);
});

test("threat clusters map adversary classes to detection phases with sourced kit benchmarks", () => {
  assert.ok(pack.threatClusters.length >= 4);
  const ids = pack.threatClusters.map((c) => c.id);
  for (const id of ["consumer", "amateur-professional", "law-enforcement-professional", "government-intelligence", "emerging-and-fantasy"]) {
    assert.ok(ids.includes(id), `cluster ${id} present`);
  }
  const consumer = pack.threatClusters.find((c) => c.id === "consumer");
  assert.deepEqual(consumer.detectedAtPhases, [5]);
  assert.match(consumer.kitBenchmarkUsd, /\$1,500/);
  const gov = pack.threatClusters.find((c) => c.id === "government-intelligence");
  assert.match(gov.kitBenchmarkUsd, /\$750,000/);
  assert.ok(gov.detectedAtPhases.includes(9));
  // Granite's order-of-magnitude rule: cluster detection phases never decrease as adversary class rises
  const firstPhase = pack.threatClusters.slice(0, 4).map((c) => Math.min(...c.detectedAtPhases));
  assert.deepEqual(firstPhase, [...firstPhase].sort((a, b) => a - b));
});

test("general parameters keep the full-spectrum promise from the source", () => {
  const all = pack.generalParameters.join(" ");
  assert.match(all, /20 Hz to above 110 GHz/);
  assert.match(all, /250 nm to 1750 nm/);
  assert.match(all, /central office/);
  assert.ok(pack.principles.some((p) => /order of magnitude/i.test(p)));
});
