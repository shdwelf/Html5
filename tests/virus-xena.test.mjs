import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

test("the virus-encyclopedia Xena bag builds and verifies", () => {
  const out = mkdtempSync(path.join(tmpdir(), "virus-xena-"));
  execFileSync(process.execPath, [path.join(root, "tools/build_virus_xena.mjs"), out], { stdio: "pipe" });

  // BagIt structure.
  for (const f of ["bagit.txt", "manifest-sha256.txt", "tagmanifest-sha256.txt",
    "metadata/preservation-event.json", "data/normalized/virus-recipes.xml",
    "data/normalized/virus-recipes.json", "data/original/virus-catalog.json"]) {
    assert.ok(existsSync(path.join(out, f)), `missing ${f}`);
  }
  assert.match(readFileSync(path.join(out, "bagit.txt"), "utf8"), /BagIt-Version: 1\.0/);

  // Payload manifest hashes must match the files on disk.
  const manifest = readFileSync(path.join(out, "manifest-sha256.txt"), "utf8").trim().split("\n");
  assert.ok(manifest.length >= 4);
  for (const line of manifest) {
    const [hash, rel] = line.split(/\s+/);
    const actual = sha256(readFileSync(path.join(out, rel)));
    assert.equal(actual, hash, `payload hash mismatch: ${rel}`);
  }
  // Tag manifest too (it never lists itself).
  const tagman = readFileSync(path.join(out, "tagmanifest-sha256.txt"), "utf8").trim().split("\n");
  for (const line of tagman) {
    const [hash, rel] = line.split(/\s+/);
    assert.notEqual(rel, "tagmanifest-sha256.txt");
    assert.equal(sha256(readFileSync(path.join(out, rel))), hash, `tag hash mismatch: ${rel}`);
  }

  // Normalized rendition: well-formed XML carrying every recipe.
  const xml = readFileSync(path.join(out, "data/normalized/virus-recipes.xml"), "utf8");
  assert.match(xml, /^<\?xml version="1\.0"/);
  const recipeCount = (xml.match(/<recipe /g) || []).length;
  assert.ok(recipeCount >= 10, `expected the full corpus, got ${recipeCount}`);
  // The encryption/Ghidra substance is preserved (a known decryptor signature).
  assert.match(xml, /signature|analysis/);
  const json = JSON.parse(readFileSync(path.join(out, "data/normalized/virus-recipes.json"), "utf8"));
  assert.equal(json.recipes.length, recipeCount);

  // Preservation event declares the Xena relationship honestly.
  const ev = JSON.parse(readFileSync(path.join(out, "metadata/preservation-event.json"), "utf8"));
  assert.equal(ev.eventType, "normalization");
  assert.match(ev.xenaRelationship, /Xena-inspired/);
  assert.match(ev.xenaRelationship, /not a native \.xena object/);
});
