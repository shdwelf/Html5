import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildSoundApps, SOUND_SNAPSHOTS } from "../scripts/build-sound-apps.mjs";
import { buildCatalog } from "../scripts/build-html5-offline-launcher-assets.mjs";
import { auditAppSources } from "../scripts/audit-app-source-inventory.mjs";

const root = new URL("../", import.meta.url);
test("all three full sound snapshots build reproducibly without changing their source bytes", () => {
  assert.deepEqual(buildSoundApps({ check: true }), { apps: 2, snapshots: 3, files: 9 });
  for (const snapshot of SOUND_SNAPSHOTS) {
    const source = readFileSync(new URL(snapshot.source, root));
    assert.equal(createHash("sha256").update(source).digest("hex"), snapshot.sha256);
    const restored = readFileSync(new URL(`public/apps/${snapshot.slug}/${snapshot.output}`, root), "utf8");
    assert.match(restored, /getUserMedia/);
    assert.match(restored, /createObjectURL/);
    assert.match(restored, /sound-snapshot-safety/);
    assert.match(restored, /not certified THX\/Dolby\/Bose\/IMAX/);
    assert.doesNotMatch(restored, /fonts\.googleapis\.com|fonts\.gstatic\.com|cloudflareinsights\.com|<script[^>]*src=["']\/src\//i);
    assert.ok(source.length > 300000 && restored.length > 300000, "never substitute a tiny unbuilt placeholder");
  }
});

test("Sanctuary and AURA are searchable public/network entries; both AURA snapshots share an isolated app origin", () => {
  for (const profile of ["public", "network"]) {
    const catalog = buildCatalog(profile);
    assert.equal(catalog.find((app) => app.slug === "sound-sanctuary")?.name, "Sound Sanctuary");
    assert.equal(catalog.find((app) => app.slug === "aura-sound-studio")?.name, "AURA Sound Studio");
    assert.equal(catalog.find((app) => app.slug === "sound-sanctuary")?.hasRemoteResources, false);
    assert.equal(catalog.find((app) => app.slug === "aura-sound-studio")?.hasRemoteResources, false);
  }
  for (const file of ["index.html", "saved-settings.html"]) {
    const aura = readFileSync(new URL(`public/apps/aura-sound-studio/${file}`, root), "utf8");
    assert.match(aura, /href="\.\/saved-settings\.html"/);
    assert.match(aura, /href="\.\/index\.html"/);
  }
  assert.doesNotMatch(JSON.stringify(buildCatalog("private")), /sound-sanctuary|aura-sound-studio/);
});

test("source audit accounts for every imported app without silently publishing private research or wallet candidates", () => {
  const report = auditAppSources();
  assert.ok(report.sources > 150);
  assert.equal(new Set(report.entries.map((entry) => entry.source)).size, report.sources);
  assert.equal(Object.values(report.counts).reduce((sum, value) => sum + value, 0), report.sources);
  for (const snapshot of SOUND_SNAPSHOTS) {
    const entry = report.entries.find((item) => item.source === snapshot.source);
    assert.equal(entry?.disposition, "bundled-reviewed-snapshot");
    assert.equal(entry?.sha256, snapshot.sha256);
  }
  assert.equal(report.entries.find((entry) => entry.source === "apps/aura-soundstudio-pro-thx-dolby-atmos-bose-anc-real")?.disposition, "unbuilt-placeholder");
  assert.equal(report.entries.find((entry) => entry.source === "apps/dna_dashboard.html")?.disposition, "private-review-required");
  assert.equal(report.entries.find((entry) => entry.source === "apps/HAIKU_WALLETv3.html")?.disposition, "security-review-required");
  assert.equal(report.entries.find((entry) => entry.source === "apps/ads-b-radar-scope")?.disposition, "network-only");
  assert.match(report.inventorySha256, /^[a-f0-9]{64}$/);
});
