import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "dist", "changelly-drainer-xena");
const ZIP_OUT = `${OUT}.zip`;
const XENA_OUT = `${OUT}.xena`;
const XENA_SIDECAR = `${OUT}.xena.json`;
const BUILDER = path.join(root, "tools", "build_changelly_drainer_xena.mjs");

const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/**
 * Preservation bag for the "Changelly Exploit" loader.
 *
 * The interesting assertions are not that the bag builds — they are that the
 * bag is INERT and that it does not redistribute the social-engineering lure.
 * A defensive artifact that can itself execute, or that hands the next victim
 * the instructions, is worse than no artifact.
 */

function build(extraArgs = []) {
  const r = execFileSync(process.execPath, [BUILDER, OUT, ...extraArgs], { cwd: root, encoding: "utf8" });
  return r;
}

function walk(dir, base = dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else out.push(path.relative(base, p));
  }
  return out.sort();
}

test("the bag builds and every manifest hash verifies", () => {
  const log = build();
  assert.match(log, /Xena-inspired BagIt bag/);
  assert.match(log, /pins verified/);

  assert.match(readFileSync(path.join(OUT, "bagit.txt"), "utf8"), /BagIt-Version: 1\.0/);

  for (const mf of ["manifest-sha256.txt", "tagmanifest-sha256.txt"]) {
    const lines = readFileSync(path.join(OUT, mf), "utf8").trim().split("\n");
    assert.ok(lines.length > 0, `${mf} is empty`);
    for (const line of lines) {
      const [hash, rel] = line.split(/\s+/);
      const fp = path.join(OUT, rel);
      assert.ok(existsSync(fp), `${mf} lists a missing file: ${rel}`);
      assert.equal(sha256(readFileSync(fp)), hash, `hash mismatch in ${mf}: ${rel}`);
    }
  }

  // Every file on disk must be listed, so nothing can slip into the bag unhashed.
  const listed = new Set(
    [...readFileSync(path.join(OUT, "manifest-sha256.txt"), "utf8").trim().split("\n"),
     ...readFileSync(path.join(OUT, "tagmanifest-sha256.txt"), "utf8").trim().split("\n")]
      .map((l) => l.split(/\s+/)[1]),
  );
  for (const rel of walk(OUT)) {
    if (rel === "manifest-sha256.txt" || rel === "tagmanifest-sha256.txt") continue;
    assert.ok(listed.has(rel), `${rel} is on disk but not in any manifest`);
  }
});

test("the preserved loader is inert: no executable extension anywhere in the bag", () => {
  build();
  const files = walk(OUT);
  const dangerous = files.filter((f) => /\.(js|mjs|cjs|html|htm|svg|hta|sh|py)$/i.test(f));
  assert.deepEqual(dangerous, [], "the bag must not contain a file a browser or shell would execute");
  assert.ok(
    files.includes(path.join("data", "original", "loader-bookmarklet.txt")),
    "the loader should be preserved as .txt",
  );
});

test("the second-stage payload was never fetched, and the bag says so", () => {
  build();
  const ioc = JSON.parse(readFileSync(path.join(OUT, "data/normalized/ioc.json"), "utf8"));
  assert.equal(ioc.executed, false);
  assert.equal(ioc.fetched, false);
  assert.equal(ioc.secondStage.retrieved, false);
  assert.ok(ioc.secondStage.reason.length > 20, "the reason for not fetching should be recorded");

  const ev = JSON.parse(readFileSync(path.join(OUT, "metadata/preservation-event.json"), "utf8"));
  assert.deepEqual(ev.exclusions.executed, []);
  assert.deepEqual(ev.exclusions.fetched, []);
  assert.equal(ev.counts.secondStageRetrieved, false);
});

test("the decoded C2 location is pinned and decodes the same way twice", () => {
  build();
  const decoded = JSON.parse(readFileSync(path.join(OUT, "data/normalized/loader-decoded.json"), "utf8"));
  const ioc = JSON.parse(readFileSync(path.join(OUT, "data/normalized/ioc.json"), "utf8"));

  // Re-derive from the blob by a different route than the builder used, so a
  // mistake in the builder's own decoder would not be self-confirming.
  const blob = ioc.firstStage.base64Blob;
  const padded = blob + "=".repeat((4 - (blob.length % 4)) % 4);
  const url = Buffer.from(padded, "base64").toString("utf8");
  assert.equal(url, decoded.url);
  assert.equal(sha256(url), decoded.sha256);
  assert.equal(sha256(blob), ioc.firstStage.base64BlobSha256);

  assert.equal(decoded.host, "docs.google.com", "the real fetch target is Google, not Changelly");
  assert.equal(decoded.spreadsheetId, "15ZXXqVaJrRoojcBDbApNfHP_n6z5sLlFLNhdLNJd5PM");
  assert.equal(decoded.sheet, "API");
  assert.equal(decoded.query, "select A,B where A='node' or A='path'");
  assert.equal(decoded.bytes, 164);
});

test("the loader still contains the blob it is supposed to carry", () => {
  build();
  const src = readFileSync(path.join(OUT, "data/original/loader-bookmarklet.txt"), "utf8");
  const ioc = JSON.parse(readFileSync(path.join(OUT, "data/normalized/ioc.json"), "utf8"));
  assert.ok(src.includes(ioc.firstStage.base64Blob));
  // The camouflage detail is load-bearing to the analysis, so pin it.
  assert.match(src, /docs\.changelly\.com\/development\/authentication\?=/);
  assert.match(src, /atob\(URL\.split\("authentication\?="\)\[1\]\)/);
  assert.match(src, /createElement\("script"\)/);
  assert.match(src, /el\.remove\(\)/);
});

test("the social-engineering lure is NOT reproduced in the bag", () => {
  build();
  // The distinction that matters: naming the technique so a defender can
  // DETECT it is legitimate and necessary; reproducing the cover document's
  // step-by-step walkthrough would make the bag a working how-to for the next
  // victim. These are the instructional strings from that walkthrough.
  const forbidden = [
    "Step 1",
    "Step 2",
    "Step 3",
    "Step 4",
    "Step 5",
    "Complete the swap",
    "Load version",
    "Go to https://changelly.com",
  ];
  for (const rel of walk(OUT)) {
    const text = readFileSync(path.join(OUT, rel), "utf8");
    for (const needle of forbidden) {
      assert.ok(
        !text.toLowerCase().includes(needle.toLowerCase()),
        `${rel} reproduces the lure phrase ${JSON.stringify(needle)}`,
      );
    }
  }
});

test("no payload file is oversized", () => {
  build();
  // Same bound the other Xena bags hold: this is a text evidence bag, and a
  // large blob here would mean something unintended got preserved.
  for (const rel of walk(OUT)) {
    const size = statSync(path.join(OUT, rel)).size;
    assert.ok(size < 16 * 1024, `${rel} is ${size} bytes, over the 16 KiB bound`);
  }
});

test("the bag carries the deep dive, attack chain, detection rules, and bag-info", () => {
  build();
  for (const rel of [
    path.join("data", "normalized", "deep-dive.md"),
    path.join("data", "normalized", "attack-chain.json"),
    path.join("data", "normalized", "detection-rules.txt"),
    "bag-info.txt",
  ]) {
    assert.ok(existsSync(path.join(OUT, rel)), `missing ${rel}`);
  }
  const info = readFileSync(path.join(OUT, "bag-info.txt"), "utf8");
  assert.match(info, /Payload-Oxum: \d+\.7/, "bag-info should record the 7-file payload oxum");
  const chain = JSON.parse(readFileSync(path.join(OUT, "data/normalized/attack-chain.json"), "utf8"));
  assert.equal(chain.observedSecondStage, false);
  assert.equal(chain.stages.length, 7);
  assert.equal(chain.stages.at(-1).status.includes("unobserved"), true);
  const rules = readFileSync(path.join(OUT, "data/normalized/detection-rules.txt"), "utf8");
  assert.match(rules, /rule Changelly_Exploit_First_Stage_Loader/);
  assert.match(rules, /Do not use these rules to retrieve the live payload/);
  const dive = readFileSync(path.join(OUT, "data/normalized/deep-dive.md"), "utf8");
  assert.match(dive, /## Verdict/);
  assert.match(dive, /precise behaviour of the second stage/);
});

test("stage two serializes the bag and wraps it in a Xena binary record", () => {
  build();
  assert.ok(existsSync(ZIP_OUT), "serialized BagIt ZIP should exist");
  assert.ok(existsSync(XENA_OUT), "Xena record should exist");
  assert.ok(existsSync(XENA_SIDECAR), "Xena sidecar should exist");

  const zipBytes = readFileSync(ZIP_OUT);
  const entries = unzipSync(new Uint8Array(zipBytes));
  const bagFiles = walk(OUT).map((rel) => rel.split(path.sep).join("/")).sort();
  assert.deepEqual(Object.keys(entries).sort(), bagFiles, "the ZIP should serialize exactly the bag files");
  for (const rel of bagFiles) {
    assert.deepEqual(Buffer.from(entries[rel]), readFileSync(path.join(OUT, rel)), `ZIP entry differs from bag file: ${rel}`);
  }

  const sidecar = JSON.parse(readFileSync(XENA_SIDECAR, "utf8"));
  assert.equal(sidecar.serializedBag.sha256, sha256(zipBytes));
  assert.equal(sidecar.serializedBag.bytes, zipBytes.length);
  assert.equal(sidecar.xena.processedByXena, false, "the record is hand-built to the schemas, not Xena output");
  assert.equal(sidecar.safety.secondStageFetched, false);
  assert.equal(sidecar.safety.loaderExecuted, false);

  const xenaBytes = readFileSync(XENA_OUT);
  assert.equal(sidecar.xena.sha256, sha256(xenaBytes));
  assert.equal(sidecar.xena.bytes, xenaBytes.length);
  const xena = xenaBytes.toString("utf8");
  assert.match(xena, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xena, /<meta_data_wrapper_name>Default Package Wrapper<\/meta_data_wrapper_name>/);
  assert.match(xena, /BinaryToXenaBinaryNormaliser/);
  assert.match(xena, /binary-object:binary-object/);

  const m = xena.match(/<binary-object:binary-object[^>]*>([\s\S]*?)<\/binary-object:binary-object>/);
  assert.ok(m, "Xena record should carry a binary-object payload");
  const wrapped = Buffer.from(m[1].replace(/\s+/g, ""), "base64");
  assert.deepEqual(wrapped, zipBytes, "decoding the Xena record should reproduce the serialized BagIt ZIP byte for byte");
});

test("a supplied second-stage CSV is bagged inert, hashed, and analysed — never executed", () => {
  const fixture = path.join(root, "dist", "_stage2-fixture.csv");
  writeFileSync(fixture, 'name,value\nnode,"NODE_PART_1, with comma"\npath,"PATH_PART_2"\n');
  try {
    const log = build(["--second-stage-csv", fixture]);
    assert.match(log, /second-stage payload fetched: yes, as inert text/);
    const payloadPath = path.join(OUT, "data", "original", "second-stage-payload.txt");
    assert.ok(existsSync(payloadPath), "the assembled second stage should be bagged as .txt");
    assert.equal(readFileSync(payloadPath, "utf8"), "NODE_PART_1, with commaPATH_PART_2");
    const ioc = JSON.parse(readFileSync(path.join(OUT, "data/normalized/ioc.json"), "utf8"));
    assert.equal(ioc.secondStage.retrieved, true);
    assert.equal(ioc.executed, false);
    const s2 = JSON.parse(readFileSync(path.join(OUT, "data/normalized/second-stage-iocs.json"), "utf8"));
    assert.equal(s2.executed, false);
    assert.equal(s2.ghidra.applicable, false);
    const ev = JSON.parse(readFileSync(path.join(OUT, "metadata/preservation-event.json"), "utf8"));
    assert.equal(ev.counts.secondStageRetrieved, true);
  } finally {
    rmSync(fixture, { force: true });
    build(); // restore the default location-only bag for the remaining tests
  }
});

test("the builder fails closed if a pin drifts", () => {
  // Copy the builder, corrupt a pin, and confirm it refuses rather than
  // quietly preserving something other than what was analysed.
  const src = readFileSync(BUILDER, "utf8");
  const corrupted = src.replace(
    'decodedUrlLength: 164,',
    'decodedUrlLength: 165,',
  );
  assert.notEqual(corrupted, src, "the pin under test was not found in the builder");
  const tmp = path.join(root, "dist", "_pin-drift-probe.mjs");
  writeFileSync(tmp, corrupted);
  try {
    const r = execFileSync(process.execPath, [tmp, path.join(root, "dist", "_pin-drift-out")], {
      cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    assert.fail(`builder should have refused, but printed:\n${r}`);
  } catch (err) {
    assert.notEqual(err.status, 0, "builder exited 0 despite a drifted pin");
    assert.match(String(err.stderr), /decoded URL length drifted/);
  } finally {
    rmSync(tmp, { force: true });
  }
});

test("the bag lives in gitignored dist/, not in the repository", () => {
  build();
  const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
  assert.match(ignore, /^dist\//m, "dist/ must stay ignored");
  const tracked = execFileSync("git", ["ls-files", "dist/"], { cwd: root, encoding: "utf8" }).trim();
  assert.equal(tracked, "", "nothing under dist/ may be committed");
});
