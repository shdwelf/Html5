import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateEvidencePack } from "../js/historical-network.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pack = JSON.parse(
  readFileSync(path.join(root, "resources/historical-network/cicada-3301-poster-seed-2026-10-23.json"), "utf8"),
);

test("the Cicada 3301 US poster seed validates and stays citation-only", () => {
  const v = validateEvidencePack(pack);
  assert.deepEqual(v.errors, [], `seed pack should validate: ${v.errors.join("; ")}`);
  assert.equal(v.captureReady, false);
});

test("the seed holds the eight US poster sites, dated Jan 2012, with no puzzle payload", () => {
  assert.equal(pack.places.length, 8);
  assert.equal(pack.nodes.length, 8);
  for (const o of pack.observations) {
    assert.equal(o.validFrom, "2012-01-09");
    assert.match(o.warnings.join(" "), /nothing|not visit/i, "every row must say the poster is gone");
  }
  // Historical record only: no QR payloads, no onion services, no solutions.
  const blob = JSON.stringify(pack);
  assert.doesNotMatch(blob, /\.onion|845145127\.com\/\d/i, "no puzzle payload material may be bundled");
});
