import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, existsSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

test("the FIRST NAME ALMANAC Xena bag builds and verifies", () => {
  const out = mkdtempSync(path.join(tmpdir(), "fna-xena-"));
  const proc = spawnSync(process.execPath, [path.join(root, "tools/build_fna_xena.mjs"), out],
    { cwd: root, encoding: "utf8" });
  assert.equal(proc.status, 0, proc.stderr);

  // BagIt structure.
  for (const f of ["bagit.txt", "manifest-sha256.txt", "tagmanifest-sha256.txt",
    "metadata/preservation-event.json", "data/normalized/fna102b-catalog.xml",
    "data/normalized/fna102b-catalog.json", "data/normalized/install-com-ghidra.txt",
    "data/original/INSTALL.COM", "data/original/FILE_ID.DIZ", "data/original/SYSOP.DOC",
    "data/original/fna102b-zip-manifest.json"]) {
    assert.ok(existsSync(path.join(out, f)), `missing ${f}`);
  }
  assert.match(readFileSync(path.join(out, "bagit.txt"), "utf8"), /BagIt-Version: 1\.0/);

  // Payload and tag manifests must match the bytes on disk.
  const manifest = readFileSync(path.join(out, "manifest-sha256.txt"), "utf8").trim().split("\n");
  assert.equal(manifest.length, 9);
  for (const line of manifest) {
    const [hash, rel] = line.split(/\s+/);
    assert.equal(sha256(readFileSync(path.join(out, rel))), hash, `payload hash mismatch: ${rel}`);
  }
  for (const line of readFileSync(path.join(out, "tagmanifest-sha256.txt"), "utf8").trim().split("\n")) {
    const [hash, rel] = line.split(/\s+/);
    assert.notEqual(rel, "tagmanifest-sha256.txt");
    assert.equal(sha256(readFileSync(path.join(out, rel))), hash, `tag hash mismatch: ${rel}`);
  }

  // Every payload hash in the manifest corresponds to a real file, and nothing
  // extra was written into data/.
  const onDisk = walk(out).map((f) => path.relative(out, f))
    .filter((f) => f.startsWith("data/")).sort();
  const listed = manifest.map((l) => l.split(/\s+/)[1]).sort();
  assert.deepEqual(onDisk, listed);

  // The catalog records all five members.
  const xml = readFileSync(path.join(out, "data/normalized/fna102b-catalog.xml"), "utf8");
  assert.match(xml, /^<\?xml version="1\.0"/);
  assert.equal((xml.match(/<member /g) || []).length, 5);
  for (const n of ["INSTALL.COM", "MEANINGS.OVL", "NAMES.OVL", "FILE_ID.DIZ", "SYSOP.DOC"]) {
    assert.match(xml, new RegExp(`name="${n}"`), `catalog missing ${n}`);
  }
  const json = JSON.parse(readFileSync(path.join(out, "data/normalized/fna102b-catalog.json"), "utf8"));
  assert.equal(json.members.length, 5);
  assert.equal(json.containerSha256,
    "341271dbce5aa7ed864fd9fd2d9fd41c1c17f2ccaf524178ac945ad1e9d94caf");

  // The two GARBLED ARJ volumes are recorded but never carried into the bag.
  const retained = json.members.filter((m) => m.action === "retained-in-place");
  assert.deepEqual(retained.map((m) => m.name).sort(), ["MEANINGS.OVL", "NAMES.OVL"]);
  for (const m of retained) {
    assert.equal(m.encrypted, true);
    assert.equal(m.decrypted, false);
    assert.match(m.format, /ARJ archive volume/);
    assert.match(m.note, /no member was decrypted/);
    // Their bytes are not present anywhere in the bag, under any name.
    for (const f of onDisk) {
      assert.notEqual(sha256(readFileSync(path.join(out, f))), m.sha256,
        `${m.name} bytes leaked into the bag as ${f}`);
    }
  }
  // Nothing oversized: the largest retained object is the 3,988-byte installer.
  for (const f of onDisk) {
    assert.ok(statSync(path.join(out, f)).size < 16384, `${f} is unexpectedly large`);
  }

  // The Ghidra rendition really carries the decompiler's output.
  const ghidra = readFileSync(path.join(out, "data/normalized/install-com-ghidra.txt"), "utf8");
  assert.match(ghidra, /Ghidra WASM decompilation/);
  assert.match(ghidra, /x86:LE:16:Real Mode/);
  assert.match(ghidra, /void 0x10d40\(void\)/);
  assert.match(ghidra, /sha256: fc86820e6402783eaffafa58dcd3a3146a68ce3a000aef81d832c7ab6b354780/);
  // The preserved original is byte-identical to the ZIP entry.
  const install = readFileSync(path.join(out, "data/original/INSTALL.COM"));
  assert.equal(install.length, 3988);
  assert.equal(sha256(install), "fc86820e6402783eaffafa58dcd3a3146a68ce3a000aef81d832c7ab6b354780");

  // The CP437 -> UTF-8 renditions are valid UTF-8 and drop the CR of CRLF.
  const sysop = readFileSync(path.join(out, "data/normalized/sysop-doc.txt"), "utf8");
  assert.match(sysop, /BBS SYSOP DISTRIBUTION POLICY/);
  assert.ok(!sysop.includes("\r"));
  assert.match(sysop, /ORIGINAL FORM/);

  // The preservation event declares the Xena relationship and the exclusion.
  const ev = JSON.parse(readFileSync(path.join(out, "metadata/preservation-event.json"), "utf8"));
  assert.equal(ev.eventType, "normalization");
  assert.match(ev.xenaRelationship, /Xena-inspired/);
  assert.match(ev.xenaRelationship, /not a native \.xena object/);
  assert.deepEqual(ev.exclusions.decrypted, []);
  assert.deepEqual(ev.exclusions.retainedInPlace, ["MEANINGS.OVL", "NAMES.OVL"]);
  assert.equal(ev.counts.preserved, 3);
});
