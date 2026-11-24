import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { PUBLIC_CORPUS_EXCLUDED_SOURCES, PUBLIC_CORPUS_EXCLUDED_ASSETS } from "../tools/wikiinajar/public-corpus-policy.mjs";
import * as openpgp from "openpgp";
import { serializeMessage } from "./openpgp-v6-native/packet-bytes.mjs";
import { nativeTapResult, escapeAnnotation } from "./openpgp-v6-native/report.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("synthetic fingerprint negatives retain the complete encrypted packet stream instead of an empty lazy ArrayStream", async () => {
  const generated = await openpgp.generateKey({ type: "curve25519", userIDs: [{ name: "Synthetic lazy-stream negative control only" }], config: { v6Keys: true, aeadProtect: true } });
  const cipher = await openpgp.encrypt({ message: await openpgp.createMessage({ binary: Uint8Array.of(0, 1, 2, 255) }), encryptionKeys: await openpgp.readKey({ armoredKey: generated.publicKey }), format: "binary" });
  const parsed = await openpgp.readMessage({ binaryMessage: cipher });
  const originalFingerprint = Uint8Array.from(parsed.packets[0].publicKeyFingerprint), originalKeyID = parsed.packets[0].publicKeyID.toHex();
  parsed.packets[0].publicKeyFingerprint[31] ^= 1;
  const bytes = await serializeMessage(parsed);
  assert.ok(bytes.length > 128);
  const again = await openpgp.readMessage({ binaryMessage: bytes });
  assert.equal(again.packets.length, 2); assert.equal(again.packets[0].publicKeyID.toHex(), originalKeyID);
  assert.notDeepEqual(again.packets[0].publicKeyFingerprint, originalFingerprint);
  assert.equal(again.packets[0].publicKeyFingerprint[31], originalFingerprint[31] ^ 1);
  assert.equal(again.packets[1].version, 2);
  await assert.rejects(serializeMessage({ write: () => new Uint8Array() }));
  await assert.rejects(serializeMessage({ write: () => new Uint8Array(4 * 1024 * 1024 + 1) }));
  let released = false;
  await assert.rejects(serializeMessage({ write: () => ({ getReader: () => ({
    read: async () => ({ done: false, value: "not packet bytes" }), releaseLock: () => { released = true; },
  }) }) }));
  assert.equal(released, true, "a failed stream control must still release its reader");
});

test("independent v6 reader absence is optional locally but never becomes a mandatory CI pass", () => {
  const run = (required) => {
    const env = { ...process.env, OPENPGP_V6_GO_READER: "/nonexistent/html5-synthetic-v6-reader", REQUIRE_OPENPGP_V6_NATIVE: required };
    delete env.NODE_TEST_CONTEXT;
    return spawnSync(process.execPath, ["--test", "--test-reporter=tap", "tests/openpgp-v6-native-interop.test.mjs"], {
      cwd: root, env, encoding: "utf8", timeout: 20000, maxBuffer: 131072,
    });
  };
  const optional = run("0");
  assert.equal(optional.status, 0, optional.stderr); assert.match(optional.stdout, /# skipped 4/); assert.match(optional.stdout, /# pass 0/);
  const required = run("1");
  assert.notEqual(required.status, 0); assert.match(required.stdout, /# fail 4/); assert.match(required.stdout, /# skipped 0/);
  assert.match(required.stdout, /must not silently skip/);
});

test("the independent native v6 lane is bounded, SHA-pinned, hash-verified, cache-free and cannot upload keys or use app secrets", () => {
  const workflow = read(".github/workflows/openpgp-v6-native.yml");
  assert.match(workflow, /contents: read/); assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /timeout-minutes: 10/);
  assert.match(workflow, /go-version: '1\.26\.9'/);
  assert.match(workflow, /cache: false/); assert.match(workflow, /GOTOOLCHAIN: local/);
  assert.match(workflow, /GOFLAGS: '-mod=readonly'/);
  assert.match(workflow, /go mod download/); assert.match(workflow, /go mod verify/);
  assert.match(workflow, /go build -trimpath -mod=readonly/);
  assert.match(workflow, /git diff --exit-code -- go\.mod go\.sum/); assert.match(workflow, /go vet \./);
  assert.match(workflow, /unformatted="\$\(gofmt -l main\.go\)"/);
  assert.match(workflow, /node tests\/openpgp-v6-native\/report\.mjs "\$log" \|\| status=1/);
  assert.match(workflow, /exit "\$status"/);
  assert.match(workflow, /REQUIRE_OPENPGP_V6_NATIVE: '1'/);
  assert.match(workflow, /node --test tests\/openpgp-v6-native-interop\.test\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\.|contents: write|upload-artifact|actions\/cache|continue-on-error|go mod tidy|go get|\|\| true/);
  const uses = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
  assert.equal(uses.length, 3);
  for (const action of uses) assert.match(action, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
  assert.match(workflow, /'tests\/openpgp-v6-native\/\*\*'/);
  assert.match(workflow, /'tests\/openpgp-v6-native-\*'/);
});

test("test-only Go dependencies are exact and locked, and no production/browser dependency is introduced", () => {
  const mod = read("tests/openpgp-v6-native/go.mod"), sums = read("tests/openpgp-v6-native/go.sum");
  assert.match(mod, /^module html5\.local\/synthetic-v6-interop\n/);
  assert.match(mod, /go 1\.23\.0/);
  assert.doesNotMatch(mod, /replace|exclude|toolchain|latest|[<>~^]/);
  const expected = new Map([
    ["github.com/ProtonMail/go-crypto", "v1.5.2"], ["github.com/cloudflare/circl", "v1.6.3"],
    ["golang.org/x/crypto", "v0.41.0"], ["golang.org/x/sys", "v0.35.0"],
  ]);
  const rows = sums.trim().split("\n").map((line) => line.split(" "));
  assert.equal(rows.length, expected.size * 2);
  for (const [module, version] of expected) {
    assert.ok(mod.includes(`${module} ${version}`));
    assert.deepEqual(rows.filter((row) => row[0] === module).map((row) => row[1]), [version, `${version}/go.mod`]);
  }
  for (const [module, , hash] of rows) { assert.ok(expected.has(module)); assert.match(hash, /^h1:[A-Za-z0-9+/]{43}=$/); }
  assert.match(sums, /go-crypto v1\.5\.2 h1:cucYnvqcY7UOXVD\/\/mSyjeaPY0SSN3v5cDkYPxumINk=/);
  const main = read("tests/openpgp-v6-native/main.go");
  assert.match(main, /openpgp\/v2/); assert.match(main, /ReadBuildInfo/);
  assert.match(main, /io\.ReadAll\(io\.LimitReader\(message\.UnverifiedBody, maximumBytes\+1\)\)/);
  assert.match(main, /O_EXCL, 0600/); assert.match(main, /session\.KeyFingerprint, expectedEncryption/);
  assert.doesNotMatch(main, /math\/rand|os\/exec|net\/http|InsecureAllow.*:\s*true|ReadKeyRing\(/);
  assert.doesNotMatch(read("package.json"), /go-crypto|gopenpgp|circl/);
});


test("native CI evidence requires all four actual cases, refuses skips/incomplete totals and escapes annotation controls", () => {
  const tap = (tests, passed, failed, skipped, failure = "") => `${failure}# tests ${tests}\n# pass ${passed}\n# fail ${failed}\n# skipped ${skipped}\n`;
  assert.equal(nativeTapResult(tap(4, 4, 0, 0)).success, true);
  assert.equal(nativeTapResult(tap(4, 0, 0, 4)).success, false);
  assert.equal(nativeTapResult(tap(4, 3, 1, 0, "not ok 2 - synthetic failure\n")).success, false);
  assert.equal(nativeTapResult(tap(0, 0, 0, 0)).success, false);
  assert.throws(() => nativeTapResult(tap(4, 3, 0, 0)));
  assert.throws(() => nativeTapResult("# pass 4\n"));
  assert.throws(() => nativeTapResult(tap(4, 4, 0, 0) + "# pass 4\n"));
  assert.equal(escapeAnnotation("100%\r\n::error::synthetic"), "100%25%0D%0A::error::synthetic");
});


test("independent v6 evidence binds the tested harness and operational reports stay outside public offline corpora", () => {
  const evidence = JSON.parse(read("docs/research/openpgp-v6-native-interop-2026-11-17.json"));
  assert.equal(evidence.schema, "html5-openpgp-v6-native-interop-v1");
  assert.equal(evidence.localRun.tests, 4); assert.equal(evidence.localRun.passed, 4);
  assert.equal(evidence.localRun.failed, 0); assert.equal(evidence.localRun.skipped, 0);
  const paths = [".github/workflows/openpgp-v6-native.yml", "tests/openpgp-v6-native-interop.test.mjs", "tests/openpgp-v6-native-policy.test.mjs",
    "tests/openpgp-v6-native/go.mod", "tests/openpgp-v6-native/go.sum", "tests/openpgp-v6-native/main.go",
    "tests/openpgp-v6-native/packet-bytes.mjs", "tests/openpgp-v6-native/report.mjs", "tests/openpgp-v6-native/README.md"];
  assert.deepEqual(evidence.testedHarnessFiles.map((file) => file.path).sort(), paths.sort());
  for (const file of evidence.testedHarnessFiles) assert.equal(file.sha256, createHash("sha256").update(read(file.path)).digest("hex"), `${file.path} changed: rerun the required controls and refresh evidence`);
  for (const path of ["docs/backlog-execution-round-86-2026-11-17.md", "docs/openpgp-v6-native-interop-2026-11-17.md"]) {
    assert.ok(PUBLIC_CORPUS_EXCLUDED_SOURCES.includes(path)); assert.ok(read(path).length > 0);
  }
  assert.ok(PUBLIC_CORPUS_EXCLUDED_ASSETS.includes("docs/research/openpgp-v6-native-interop-2026-11-17.json"));
});
