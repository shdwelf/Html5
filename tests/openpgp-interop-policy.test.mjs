import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
function missingToolRun(file, env, pattern) {
  const childEnv = { ...process.env, ...env };
  // These are independent runner invocations, not descendants speaking the
  // parent runner's private IPC protocol (which can suppress TAP entirely).
  delete childEnv.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ["--test", "--test-reporter=tap", ...(pattern ? [`--test-name-pattern=${pattern}`] : []), file], {
    cwd: root, env: childEnv, encoding: "utf8", timeout: 20000, maxBuffer: 131072,
  });
}

test("native interop reports optional absence honestly and fails closed when required", () => {
  const env = { OPENPGP_GPG: "/nonexistent/html5-synthetic-gpg", OPENPGP_GPGCONF: "/nonexistent/html5-synthetic-gpgconf" };
  const optional = missingToolRun("tests/openpgp-native-interop.test.mjs", { ...env, REQUIRE_OPENPGP_NATIVE_INTEROP: "0" });
  assert.equal(optional.status, 0, optional.stderr); assert.match(optional.stdout, /# skipped 3/);
  const mandatory = missingToolRun("tests/openpgp-native-interop.test.mjs", { ...env, REQUIRE_OPENPGP_NATIVE_INTEROP: "1" });
  assert.notEqual(mandatory.status, 0); assert.match(mandatory.stdout, /# fail 3/); assert.match(mandatory.stdout, /# skipped 0/);
  assert.match(mandatory.stdout, /must not silently skip/);
});

test("the independent PGPy reader cannot silently disappear from a mandatory run", () => {
  const env = { OPENPGP_PYTHON: "/nonexistent/html5-synthetic-python" };
  const pattern = "independent PGPy unlocks";
  const optional = missingToolRun("tests/openpgp-key-interop.test.mjs", { ...env, REQUIRE_OPENPGP_INTEROP: "0" }, pattern);
  assert.equal(optional.status, 0, optional.stderr); assert.match(optional.stdout, /# skipped 1/);
  const mandatory = missingToolRun("tests/openpgp-key-interop.test.mjs", { ...env, REQUIRE_OPENPGP_INTEROP: "1" }, pattern);
  assert.notEqual(mandatory.status, 0); assert.match(mandatory.stdout, /# fail 1/); assert.match(mandatory.stdout, /# skipped 0/);
  assert.match(mandatory.stdout, /requires PGPy==0.6.0/);
});

test("the bounded native CI lane requires all readers and never uploads or caches synthetic secret material", () => {
  const workflow = read(".github/workflows/openpgp-interop.yml");
  assert.match(workflow, /contents: read/); assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /timeout-minutes: 10/);
  assert.match(workflow, /REQUIRE_OPENPGP_INTEROP: '1'/);
  assert.match(workflow, /REQUIRE_OPENPGP_NATIVE_INTEROP: '1'/);
  assert.match(workflow, /command -v gpg gpgconf gpgv/);
  assert.match(workflow, /--no-build-isolation --require-hashes/);
  assert.match(workflow, /node --test tests\/openpgp-native-interop\.test\.mjs tests\/openpgp-key-interop\.test\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\.|contents: write|upload-artifact|actions\/cache|continue-on-error|\|\| true/);
  const uses = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
  assert.equal(uses.length, 3);
  for (const action of uses) assert.match(action, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
});

test("test-only Python runtime and build dependencies are exact and hash-checked", () => {
  const expected = [
    ["openpgp-build.txt", ["setuptools==80.9.0", "wheel==0.45.1", "packaging==25.0"]],
    ["openpgp-interop.txt", ["PGPy==0.6.0", "cryptography==50.0.2", "cffi==2.1.1", "pycparser==3.12", "pyasn1==0.6.5"]],
  ];
  for (const [file, packages] of expected) {
    const lines = read(`tests/requirements/${file}`).split("\n").filter((line) => line.trim() && !line.startsWith("#"));
    assert.deepEqual(lines.filter((line) => !line.startsWith(" ")).map((line) => line.replace(/ \\$/, "")), packages);
    for (const line of lines) assert.match(line, /^(?:[A-Za-z0-9-]+==[0-9.]+ \\|    --hash=sha256:[a-f0-9]{64}(?: \\)?)$/);
  }
});
