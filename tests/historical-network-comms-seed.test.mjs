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
  assert.equal(pack.edges.length, 1);
  assert.equal(pack.edges[0].geometryBasis, "logical-only", "no historical circuit route is claimed");
  // Rights decision (rounds 17/18): nodelists are local-import-only. The seed
  // must contain facts about FidoNet, never nodelist records.
  const blob = JSON.stringify(pack);
  assert.doesNotMatch(blob, /NODELIST\.\d{3}/, "no nodelist file content may be bundled");
  for (const s of pack.snapshots) assert.equal(s.rightsStatus, "citation-only");
  const summary = summarizeEvidencePack(pack);
  assert.ok(summary && typeof summary === "object");
});
