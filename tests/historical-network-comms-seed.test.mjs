import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateEvidencePack, summarizeEvidencePack } from "../js/historical-network.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pack = JSON.parse(
  readFileSync(path.join(root, "resources/historical-network/comms-history-seed-2026-10-23.json"), "utf8"),
);

test("the comms-history seed pack validates against the historical-network schema", () => {
  const v = validateEvidencePack(pack);
  assert.deepEqual(v.errors, [], `seed pack should validate: ${v.errors.join("; ")}`);
  assert.equal(v.valid, true);
  // Citation-only sources: the pack must never claim to be a captured dataset.
  assert.equal(v.captureReady, false);
});

test("the seed carries the ARPANET first-four, the Mojave booth, and FidoNet's origin — and no nodelist data", () => {
  const names = pack.nodes.map((n) => n.name).join(" | ");
  for (const needle of ["IMP #1", "IMP #2", "IMP #3", "IMP #4", "Mojave phone booth", "FidoNet origin"]) {
    assert.match(names, new RegExp(needle.replace("#", "\\#")), `missing seed node: ${needle}`);
  }
  assert.equal(pack.edges.length, 3);
  for (const e of pack.edges) assert.equal(e.geometryBasis, "logical-only", "no historical circuit route is claimed");
  // Rights decision (rounds 17/18): nodelists are local-import-only. The seed
  // must contain facts about FidoNet, never nodelist records.
  const blob = JSON.stringify(pack);
  assert.doesNotMatch(blob, /NODELIST\.\d{3}/, "no nodelist file content may be bundled");
  for (const s of pack.snapshots) assert.equal(s.rightsStatus, "citation-only");
  const summary = summarizeEvidencePack(pack);
  assert.ok(summary && typeof summary === "object");
});

test("ARPANET time slices: 1969 first four, 15 nodes by 1971, international by the 1977 slice", () => {
  const obsById = new Map(pack.observations.map((o) => [o.id, o]));
  const arpanet = pack.nodes.filter((n) => n.network === "arpanet");
  const installedBy = (iso) =>
    arpanet.filter((n) => {
      const o = obsById.get(n.observationIds[0]);
      return (o.validFrom ?? o.observedAt) <= iso;
    }).length;
  assert.equal(arpanet.length, 19, "19 ARPANET sites seeded across the cohorts");
  assert.equal(installedBy("1969-12-31"), 4, "1969 slice: the first four IMPs");
  assert.equal(installedBy("1971-12-31"), 15, "1971 slice: the canonical 15-node network (Hobbes/RFC 2235)");
  assert.equal(installedBy("1977-12-31"), 19, "1977 slice adds Hawaii, SDAC, NORSAR and UCL");
  const names = arpanet.map((n) => n.name).join(" | ");
  for (const needle of ["NASA Ames", "University of Hawaii", "NORSAR", "University College London;"]) {
    assert.ok(names.includes(needle.replace(";", "")), `slice node missing: ${needle}`);
  }
  // Every slice node is placed and dated; nothing claims a surveyed pin.
  for (const n of arpanet) {
    const o = obsById.get(n.observationIds[0]);
    assert.ok(o.validFrom, `${n.id}: install-dated observation required for slicing`);
    const place = pack.places.find((p) => p.id === n.placeId);
    assert.ok(place && place.coordinateBasis !== "not-geocoded", `${n.id}: placed with a stated basis`);
  }
  // International edges are the documented 1973 path, logical geometry only.
  const intl = pack.edges.filter((e) => [e.fromNodeId, e.toNodeId].some((id) => id.includes("norsar") || id === "node-arpanet-ucl"));
  assert.equal(intl.length, 2);
});
