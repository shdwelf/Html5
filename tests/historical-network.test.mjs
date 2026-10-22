import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { KEYHOLE_EVIDENCE_PACK } from "../js/historical-network-keyhole-data.js";
import {
  applyFidonetNodediff,
  applyFidonetNodediffChain,
  assessMergeCandidate,
  detectHistoricalImportFormat,
  observationsToCsv,
  parseFidonetNodelist,
  parseTextfilesHistoricalList,
  searchObservations,
  sha256Hex,
  summarizeEvidencePack,
  validateEvidencePack,
} from "../js/historical-network.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(path.join(root, "resources/historical-network/keyhole-evidence-pack-2026-10-22.json"), "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));

test("Keyhole evidence pack is generated from the checked-in JSON fixture", () => {
  assert.deepEqual(KEYHOLE_EVIDENCE_PACK, fixture);
  execFileSync(process.execPath, ["scripts/build-historical-network.mjs", "--check"], {
    cwd: root,
    stdio: "pipe",
  });
});

test("Keyhole fixture is structurally valid but deliberately not capture-ready", () => {
  const validation = validateEvidencePack(fixture);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(validation.captureReady, false, "citation-only USBBS/TEXTFILES snapshots must not pass the bundled-dataset gate");
  assert.deepEqual(validation.counts, {
    snapshots: 3,
    observations: 3,
    places: 1,
    nodes: 1,
    edges: 0,
    merges: 2,
    rejectedMatches: 2,
    negativeSearches: 2,
  });
  assert.ok(validation.warnings.some((warning) => /sha256 is null/.test(warning)));
  assert.ok(validation.warnings.some((warning) => /citation-only/.test(warning)));

  const summary = summarizeEvidencePack(fixture);
  assert.equal(summary.firstObserved, "1994-01-01", "the retrospective TEXTFILES span starts the derived range");
  assert.equal(summary.lastObserved, "1996-12-31", "the retrospective TEXTFILES span ends the derived range");
  assert.equal(summary.nodes[0].observationCount, 3);

  const [place] = fixture.places;
  assert.equal(place.granularity, "city");
  assert.equal(place.lat, null, "Denver must not receive an invented centroid");
  assert.equal(place.lon, null);
  assert.equal(fixture.edges.length, 0, "no FidoNet or physical edge is inferred from BBS listings");

  const merges = new Map(fixture.mergeLog.map((merge) => [merge.id, merge]));
  assert.equal(merges.get("merge-usbbs-127-134").independence, "same-publication");
  assert.equal(merges.get("merge-textfiles303-keyhole").independence, "separate-publication-underlying-source-unresolved");
  assert.ok(fixture.rejectedMatches.some((row) => row.id === "reject-keyhole-bbs-818"), "the distinct 818 Keyhole BBS must stay rejected");
  assert.ok(fixture.negativeSearches.some((row) => /NodelistDB/.test(row.source)), "FidoNet negative search must remain part of the evidence");
});

test("validator rejects false place precision, name-only merges, and logical-edge geometry", () => {
  const coarsePin = clone(fixture);
  coarsePin.places[0].lat = 39.7392;
  coarsePin.places[0].lon = -104.9903;
  coarsePin.places[0].coordinateBasis = "city centroid";
  let validation = validateEvidencePack(coarsePin);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => /coarse place coordinates require radiusKm/.test(error)));

  const nameOnly = clone(fixture);
  nameOnly.mergeLog[0].matchedFields = ["name"];
  nameOnly.mergeLog[0].rule = "same display name";
  validation = validateEvidencePack(nameOnly);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => /never be merged solely/.test(error)));

  const logicalGeometry = clone(fixture);
  logicalGeometry.edges.push({
    id: "bad-logical-edge",
    fromNodeId: "node-keyhole-bbs-denver",
    toNodeId: "node-keyhole-bbs-denver",
    kind: "mail-route",
    geometryBasis: "logical-only",
    geometry: [[-104.99, 39.74], [-105.0, 39.75]],
    observationIds: ["obs-usbbs127-keyhole"],
  });
  validation = validateEvidencePack(logicalGeometry);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => /logical-only edges must not carry physical geometry/.test(error)));
});

test("TEXTFILES historical-list parser returns observations without canonicalizing them", () => {
  const text = `Historical List of BBSes in the 303 Area Code
---------------------------------------------
Created by TEXTFILES.COM From Many Sources

303-477-6337 | Keyhole BBS
              | DENVER, CO (1994-1996)
--------------+-----------------------------------------------------------
818-545-0870 | The Keyhole BBS
              | UNKNOWN, CA (1994)
        SYSOP | Greg Hiscott
     SOFTWARE | XBBS
     COMMENTS | Mac/IBM/UNIX
              | Computer help
--------------+-----------------------------------------------------------`;
  const parsed = parseTextfilesHistoricalList(text, { captureUri: "local-file:fixture.txt" });

  assert.equal(parsed.snapshot.rightsStatus, "local-import-only");
  assert.equal(parsed.snapshot.captureStatus, "user-supplied-local-text");
  assert.equal(parsed.observations.length, 2);

  const [Denver, other] = parsed.observations;
  assert.equal(Denver.fields.name, "Keyhole BBS");
  assert.equal(Denver.fields.locality, "Denver");
  assert.equal(Denver.fields.years, "1994-1996");
  assert.equal(Denver.validFrom, "1994-01-01");
  assert.equal(Denver.validTo, "1996-12-31");
  assert.match(Denver.locator, /^line 5:/);

  assert.equal(other.fields.sysop, "Greg Hiscott");
  assert.equal(other.fields.software, "XBBS");
  assert.equal(other.fields.comments, "Mac/IBM/UNIX Computer help");
  assert.ok(parsed.observations.every((observation) => observation.evidenceTier === "local-user-import"));
  assert.ok(parsed.observations.every((observation) => /no canonical merge/.test(observation.warnings.join(" "))));
});

test("merge assessment requires more than a matching board name", () => {
  const [usbbs127, usbbs134, textfiles303] = fixture.observations;
  assert.deepEqual(assessMergeCandidate(usbbs127, usbbs134), {
    decision: "merge-candidate",
    confidence: 0.98,
    matchedFields: ["phone", "name", "locality", "sysop"],
    mismatchedFields: [],
    reason: "Telephone, board name, locality, and sysop all agree.",
  });
  assert.equal(assessMergeCandidate(usbbs127, textfiles303).decision, "merge-candidate");
  assert.equal(assessMergeCandidate(usbbs127, textfiles303).confidence, 0.86);

  const otherKeyhole = {
    fields: {
      name: "The Keyhole BBS",
      phone: "818-545-0870",
      locality: null,
      state: null,
      sysop: "Greg Hiscott",
    },
  };
  const rejected = assessMergeCandidate(usbbs127, otherKeyhole);
  assert.equal(rejected.decision, "reject");
  assert.ok(rejected.mismatchedFields.includes("phone"));
  assert.ok(rejected.mismatchedFields.includes("sysop"));
});

test("search and CSV export operate on observations, not inferred claims", () => {
  assert.equal(searchObservations(fixture, "Linda").length, 2);
  assert.equal(searchObservations(fixture, "303 477 6337").length, 3);
  assert.equal(searchObservations(fixture, "EarthViewer").length, 0);

  const csv = observationsToCsv(fixture);
  const lines = csv.trimEnd().split("\n");
  assert.equal(lines.length, 4);
  assert.match(lines[0], /^observation_id,snapshot_id,locator/);
  assert.ok(lines.some((line) => line.includes("obs-textfiles303-keyhole")));
  assert.ok(!csv.includes("Keyhole, Inc."), "rejected matches are not exported as observations");
});

test("FidoNet nodelist parser derives addresses without canonicalizing systems", async () => {
  assert.equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(await sha256Hex(new TextEncoder().encode("abc")), await sha256Hex("abc"));

  const text = [
    ";A FidoNet Nodelist for Friday, September 9, 1994 -- Day number 252 : 12345",
    ";A Synthetic parser fixture; no historical listing is reproduced.",
    ";THE ordinary comment is not an error-interest comment.",
    ";SE Synthetic nodelist-processor error comment.",
    "Zone,1,Zone_One,Example_CO,Zone_Operator,1-303-555-0101,9600,CM",
    "Region,19,Example_Region,Example_CO,Region_Operator,1-303-555-0102,9600,CM",
    "Host,104,Example_Net,Denver_CO,Net_Operator,1-303-555-0103,9600,CM",
    "Hub,300,Example_Hub,Denver_CO,Hub_Operator,1-303-555-0104,9600,CM",
    ",301,Example_BBS,Denver_CO,Example_Sysop,1-303-555-0100,14400,V32B,CM",
    "Pvt,302,Quiet_Node,Denver_CO,Private_Sysop,-Unpublished-,300",
    "Down,303,Retired_Node,Denver_CO,Former_Sysop,-Unpublished-,300",
  ].join("\r\n") + "\r\n" + String.fromCharCode(26);

  assert.equal(detectHistoricalImportFormat(text), "fidonet-nodelist");
  const sha256 = await sha256Hex(text);
  const parsed = parseFidonetNodelist(text, {
    captureUri: "local-file:synthetic-nodelist.252",
    sha256,
    byteLength: new TextEncoder().encode(text).length,
  });

  assert.equal(parsed.snapshot.rightsStatus, "local-import-only");
  assert.equal(parsed.snapshot.issued, "1994-09-09");
  assert.equal(parsed.snapshot.header.dayNumber, 252);
  assert.equal(parsed.snapshot.header.crc, "12345");
  assert.equal(parsed.snapshot.sha256, sha256);
  assert.equal(parsed.observations.length, 7);
  assert.deepEqual(
    parsed.observations.map((observation) => observation.fields.fidonetAddress),
    ["1:1/0", "1:19/0", "1:104/0", "1:104/300", "1:104/301", "1:104/302", "1:104/303"],
  );
  assert.ok(parsed.warnings.some((warning) => /CRC 12345 was preserved but not verified/.test(warning)));
  assert.deepEqual(
    parsed.warnings.filter((warning) => /nodelist error comment/.test(warning)),
    ["line 4: nodelist error comment preserved as a warning: ;SE Synthetic nodelist-processor error comment."],
  );

  const member = parsed.observations.find((observation) => observation.fields.fidonetAddress === "1:104/301");
  assert.equal(member.fields.name, "Example BBS");
  assert.equal(member.fields.locality, "Denver");
  assert.equal(member.fields.state, "CO");
  assert.equal(member.fields.sysop, "Example Sysop");
  assert.equal(member.fields.phone, "303-555-0100");
  assert.equal(member.fields.phoneRaw, "1-303-555-0100");
  assert.deepEqual(member.fields.flags, ["V32B", "CM"]);
  assert.equal(member.observedAt, "1994-09-09");

  const quiet = parsed.observations.find((observation) => observation.fields.fidonetAddress === "1:104/302");
  assert.equal(quiet.fields.phone, null);
  assert.equal(quiet.fields.phoneUnpublished, true);
  assert.ok(quiet.warnings.some((warning) => /do not dial or probe/i.test(warning)));
  assert.ok(parsed.observations.every((observation) => /no canonical merge/.test(observation.warnings.join(" "))));

  const localPack = {
    schemaVersion: 1,
    id: "local-fidonet-test",
    title: "Local FidoNet parser test",
    snapshots: [parsed.snapshot],
    observations: parsed.observations,
    places: [],
    nodes: [],
    edges: [],
    mergeLog: [],
    rejectedMatches: [],
    negativeSearches: [],
  };
  const validation = validateEvidencePack(localPack);
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(validation.captureReady, false, "a hashed local FidoNet import remains rights-blocked for bundled redistribution");
  assert.equal(searchObservations(localPack, "1:104/301").length, 1);
  assert.ok(observationsToCsv(localPack).includes("1:104/301"));
});

test("FidoNet nodediff application is edition-checked and refuses partial edits", () => {
  const previous = [
    ";A FidoNet Nodelist for Friday, September 2, 1994 -- Day number 245 : 11111",
    "Zone,1,Example_Zone,Denver_CO,Zone_Operator,1-303-555-0101,9600",
    "Host,104,Example_Net,Denver_CO,Net_Operator,1-303-555-0102,9600",
    ",301,Old_Example_BBS,Denver_CO,Example_Sysop,1-303-555-0100,9600",
    "; synthetic end",
  ].join("\r\n") + "\r\n" + String.fromCharCode(26);
  const newHeader = ";A FidoNet Nodelist for Friday, September 9, 1994 -- Day number 252 : 22222";
  const diff = [
    previous.split("\r\n")[0],
    "D1",
    "A1",
    newHeader,
    "C2",
    "D1",
    "A1",
    ",301,Example_BBS,Denver_CO,Example_Sysop,1-303-555-0100,14400,V32B",
    "C1",
  ].join("\r\n");
  assert.equal(detectHistoricalImportFormat(diff), "fidonet-nodediff");

  const applied = applyFidonetNodediff(previous, diff);
  assert.deepEqual(applied.errors, []);
  assert.equal(applied.lines[0], newHeader);
  assert.match(applied.lines[3], /Example_BBS/);
  assert.ok(applied.text.endsWith(String.fromCharCode(26)));
  assert.equal(applied.stats.copiedLines, 3);
  assert.equal(applied.stats.deletedLines, 2);
  assert.equal(parseFidonetNodelist(applied.text).observations.at(-1).fields.name, "Example BBS");

  const thirdHeader = ";A FidoNet Nodelist for Friday, September 16, 1994 -- Day number 259 : 33333";
  const secondDiff = [newHeader, "D1", "A1", thirdHeader, "C4"].join("\r\n");
  const chain = applyFidonetNodediffChain(previous, [diff, secondDiff]);
  assert.deepEqual(chain.errors, []);
  assert.match(chain.text, new RegExp(thirdHeader.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const wrongEdition = applyFidonetNodediff(previous, secondDiff);
  assert.equal(wrongEdition.text, null);
  assert.ok(wrongEdition.errors.some((error) => /does not exactly match/.test(error)));

  const partial = applyFidonetNodediff(previous, [previous.split("\r\n")[0], "D1", "A1", newHeader, "C1"].join("\r\n"));
  assert.equal(partial.text, null);
  assert.ok(partial.errors.some((error) => /refusing a partial edit/.test(error)));
});

test("historical viewer uses the shared model and exposes the local-only slice", () => {
  const html = readFileSync(path.join(root, "historical-network-viewer.html"), "utf8");
  assert.match(html, /from "\.\/js\/historical-network-keyhole-data\.js"/);
  assert.match(html, /from "\.\/js\/historical-network\.js"/);
  assert.match(html, /Local BBS-list import/);
  assert.match(html, /parseFidonetNodelist/);
  assert.match(html, /detectHistoricalImportFormat/);
  assert.match(html, /sha256Hex/);
  assert.match(html, /FidoNet nodelist \(FTS-5000\)/);
  assert.match(html, /will not fabricate a standalone snapshot/);
  assert.match(html, /not geocoded/);
  assert.match(html, /do not dial or probe it/i);
  assert.doesNotMatch(html, /href="tel:/, "historical numbers must never become dial links");
  assert.doesNotMatch(html, /fetch\(/, "the Phase 0 viewer must not silently fetch external BBS data");
});
