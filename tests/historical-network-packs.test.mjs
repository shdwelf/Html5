import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { COMMS_HISTORY_PACK } from "../js/historical-network-comms-data.js";
import { CICADA_3301_PACK } from "../js/historical-network-cicada-data.js";
import { validateEvidencePack } from "../js/historical-network.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (name) => JSON.parse(readFileSync(path.join(root, "resources/historical-network", name), "utf8"));

test("seed-pack data modules are generated from the checked-in JSON packs", () => {
  assert.deepEqual(COMMS_HISTORY_PACK, readJson("comms-history-seed-2026-10-23.json"));
  assert.deepEqual(CICADA_3301_PACK, readJson("cicada-3301-poster-seed-2026-10-23.json"));
});

test("both seed packs validate and stay capture-unready (citation-only)", () => {
  for (const pack of [COMMS_HISTORY_PACK, CICADA_3301_PACK]) {
    const v = validateEvidencePack(pack);
    assert.deepEqual(v.errors, [], `${pack.id} should validate: ${v.errors.join("; ")}`);
    assert.equal(v.captureReady, false, `${pack.id} must not claim capture-ready status`);
    for (const place of pack.places) {
      if (place.lat != null) {
        assert.ok(place.radiusKm > 0, `${place.id}: plotted places need a context radius`);
      }
    }
    // Node <-> observation <-> place wiring must be complete for rendering.
    const placeIds = new Set(pack.places.map((p) => p.id));
    const obsIds = new Set(pack.observations.map((o) => o.id));
    for (const node of pack.nodes) {
      assert.ok(placeIds.has(node.placeId), `${node.id} references missing place ${node.placeId}`);
      for (const id of node.observationIds) assert.ok(obsIds.has(id), `${node.id} references missing observation ${id}`);
    }
    for (const edge of pack.edges) {
      assert.ok(edge.observationIds?.length, `${edge.id} needs supporting observations`);
      assert.equal(edge.geometryBasis, "logical-only", "no physical route geometry may be claimed");
    }
  }
});

test("the viewer offers all three bundled packs without any remote loading", () => {
  const html = readFileSync(path.join(root, "historical-network-viewer.html"), "utf8");
  assert.match(html, /historical-network-comms-data\.js/);
  assert.match(html, /historical-network-cicada-data\.js/);
  assert.match(html, /id="packSelect"/);
  assert.match(html, /id="schematic"/);
  assert.match(html, /renderSchematic/);
  assert.doesNotMatch(html, /fetch\(/, "pack switching must stay offline; data modules are static imports");
  assert.doesNotMatch(html, /href="tel:/, "historical numbers must never become dial links");
});
