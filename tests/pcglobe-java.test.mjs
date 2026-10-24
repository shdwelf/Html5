import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const read = (p) => readFileSync(p, "utf8");

test("PC Globe media is hash-pinned and the Java reader is dependency-free", () => {
  const sums = read(".xfer/pcglobe/SHA256SUMS");
  for (const f of ["NAMES.DAT", "COUNTRY1.DAT", "COUNTRY2.DAT", "DATABASE.DAT"]) {
    assert.ok(existsSync(`.xfer/pcglobe/${f}`), `${f} must be present (round-43 fetch)`);
    const line = sums.split("\n").find((l) => l.endsWith(`  ${f}`));
    assert.ok(line, `SHA256SUMS must pin ${f}`);
    assert.equal(sha256(`.xfer/pcglobe/${f}`), line.split(/\s+/)[0], `${f} sha256 must match the round-43 manifest`);
  }
  const src = read("tools/pcglobe/PcGlobeReader.java");
  const imports = [...src.matchAll(/^import\s+([\w.]+);/gm)].map((m) => m[1]);
  assert.ok(imports.length > 0, "reader must declare its imports");
  for (const i of imports) assert.ok(i.startsWith("java."), `dependency-free: import ${i} must be JDK-only`);
  for (const f of ["NAMES.DAT", "COUNTRY1.DAT", "COUNTRY2.DAT", "DATABASE.DAT"]) {
    assert.ok(src.includes(f), `reader must handle ${f}`);
  }
  const wf = read(".github/workflows/arena-pcglobe-java.yml");
  assert.ok(wf.includes("PcGlobeReader.java"), "workflow must compile the reader");
  assert.ok(wf.includes("sha256sum -c SHA256SUMS"), "workflow must re-verify media before reading");
});

test("PC Globe Java dump reproduces the raw-probe sample (two-source check)", () => {
  const dump = JSON.parse(read("research/pcglobe-java/countries.json"));
  // Source hashes inside the dump must match the pinned media.
  for (const f of ["NAMES.DAT", "COUNTRY1.DAT", "COUNTRY2.DAT", "DATABASE.DAT"]) {
    assert.equal(dump.sources[f].sha256, sha256(`.xfer/pcglobe/${f}`), `${f}: dump source hash`);
    assert.equal(dump.sources[f].bytes, readFileSync(`.xfer/pcglobe/${f}`).length, `${f}: dump source size`);
  }
  // NAMES.DAT sections found by the reader match the round-43 probes.
  assert.deepEqual(dump.namesDat.stringRuns.map((r) => r.count), [216, 1268, 146]);
  assert.equal(dump.namesDat.countryNameCount, 216);
  assert.equal(dump.namesDat.countryNames[0], "AFGHANISTAN");
  assert.equal(dump.namesDat.countryNames[215], "RHODESIA");
  assert.ok(dump.namesDat.undecodedPrefixBytes > 0, "NAMES binary prefix must be reported, not hidden");

  // 83 + 94 records, every one with its count byte verified by the reader.
  assert.equal(dump.countryRecordCount, 177);
  assert.equal(dump.countries.filter((c) => c.file === "COUNTRY1.DAT").length, 83);
  assert.equal(dump.countries.filter((c) => c.file === "COUNTRY2.DAT").length, 94);
  for (const c of dump.countries) {
    assert.ok(c.labelTokenCount >= 2, `${c.file}#${c.index}: label tokens decoded`);
    assert.ok(c.undecodedPayloadBytes > 0, `${c.file}#${c.index}: binary payload reported undecoded`);
    assert.ok(c.features.length >= 1, `${c.file}#${c.index}: at least one feature`);
  }
  // Named sample: names from NAMES.DAT order, geography from the records.
  // (Records follow canonical-name order; the head of the alphabet has no
  // inversions, so indices 0..3 are Afghanistan..Andorra.)
  assert.deepEqual(dump.countries[0].features, [
    "Hindu Kush Mountains", "Safid Mountains", "Rigestan Desert",
    "Margow Desert", "Kabul River", "Helmand River",
  ]);
  assert.ok(dump.countries[1].features.includes("North Albanian Alps"));
  assert.ok(dump.countries[1].features.includes("Strait of Otranto"));
  assert.ok(dump.countries[2].features.includes("Sahara Desert"));
  assert.ok(dump.countries[3].features.includes("Valira River"));
  // Order corroborated deeper in the alphabet by geography alone:
  // #80 Jordan, #81 Kenya, #82 Kiribati, then COUNTRY2 opens with the two
  // Koreas (canonical order) and Kuwait - NAMES tokens JORDAN/KENYA/
  // KIRIBATI/KUWAIT sit at the matching positions of the name list.
  assert.ok(dump.countries[80].features.includes("Jordan River"));
  assert.ok(dump.countries[81].features.includes("Mount Kenya"));
  assert.ok(dump.countries[82].features.includes("Gilbert Islands"));
  assert.ok(dump.countries[83].features.includes("Yalu River"));
  assert.ok(dump.countries[84].features.includes("Cheju Island"));
  assert.ok(dump.countries[85].features.includes("Kuwait Bay"));
  const names = dump.namesDat.countryNames;
  assert.equal(names.indexOf("JORDAN"), 91);
  assert.equal(names.indexOf("KIRIBATI"), 93);
  assert.equal(names.indexOf("KUWAIT"), 94);

  // DATABASE.DAT: same 177-record table; Afghanistan's resource labels
  // reproduce the vocabulary visible in the round-43 raw probes.
  assert.equal(dump.databaseRecordCount, 177);
  assert.equal(dump.database.length, 177);
  for (const label of ["Natural Gas", "Crude Oil", "Coal", "Copper", "Talc", "Karakul Pelts"]) {
    assert.ok(dump.database[0].labels.includes(label), `DATABASE#0 must list ${label}`);
  }
  const txt = read("research/pcglobe-java/countries.txt");
  assert.ok(txt.includes("Hindu Kush Mountains"), "text dump must carry the decoded sample");
});
