import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const reporter = new URL("../scripts/report-html5-android-runner.py", import.meta.url);
function report(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "synthetic-android-report-"));
  try {
    for (const [name, contents] of Object.entries(files)) {
      const path = join(dir, name); mkdirSync(join(path, ".."), { recursive: true }); writeFileSync(path, contents);
    }
    const run = spawnSync("python3", [reporter.pathname, dir], { encoding: "utf8", timeout: 10000 });
    assert.equal(run.status, 0, run.stderr);
    return run.stdout;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("empty testcase failures retain suite-level Android runner death, not just an empty failure label", () => {
  const output = report({ "instrumentation-reports/network-local-files/result.xml":
    '<testsuite><testcase classname="Synthetic" name="file"><failure/></testcase><system-err>Test run failed: Instrumentation process crashed. INSTRUMENTATION_RESULT: shortMsg=Process crashed.</system-err></testsuite>' });
  assert.match(output, /Android-runner-XML/);
  assert.match(output, /shortMsg=Process crashed/);
  assert.match(output, /network-local-files/);
});

test("native aborts and last touchscreen phases survive noisy WebView and Gradle tails", () => {
  const output = report({
    "android-webview-tests.log": "Test run failed to complete: expected 6 tests, received 1\n" + "at Gradle.task()\n".repeat(500),
    "android-webview-logcat.log": "Html5GestureSmoke: start: injecting ACTION_UP\nlibc: Fatal signal 6 (SIGABRT)\nAbort message: synthetic input deadlock\n" + "WebViewFactory: synthetic noise\n".repeat(500),
  });
  assert.match(output, /expected 6 tests, received 1/);
  assert.match(output, /Fatal signal 6/);
  assert.match(output, /synthetic input deadlock/);
  assert.match(output, /injecting ACTION_UP/);
});

test("annotation data is escaped and malformed or absent XML is not labeled a passing test", () => {
  const output = report({
    "instrumentation-reports/public-local-files/broken.xml": "<broken",
    "android-webview-tests.log": "Test run failed: 50%\n::notice title=untrusted::not a separate command\r\n",
  });
  assert.match(output, /50%25%0A::notice/);
  assert.equal(output.split("\n").filter((line) => line.startsWith("::notice")).length, 0);
  const absent = report();
  assert.match(absent, /does not establish success or a root cause/);
});

test("suite diagnostics keep early cause and late context with bounded annotation count and size", () => {
  const files = {};
  for (let i = 0; i < 28; i++) files[`instrumentation-reports/synthetic/${i}.xml`] =
    `<testsuite><system-err>early synthetic cause ${"x".repeat(12000)} late context</system-err></testsuite>`;
  const output = report(files), annotations = output.trimEnd().split("\n");
  assert.equal(annotations.length, 12);
  for (const line of annotations) {
    assert.ok(line.length < 3200);
    assert.match(line, /early synthetic cause/);
    assert.match(line, /late context/);
    assert.match(line, /bounded middle omitted/);
  }
});

test("lost-emulator and bounded host evidence are retained without treating normal lmkd initialization as an OOM", () => {
  const output = report({
    "android-webview-logcat.log": "lowmemorykiller: lmkd updated properties successfully\nlowmemorykiller: closing lmkd data connection\n",
    "android-webview-tests.log": "com.android.ddmlib.AdbCommandRejectedException: device 'emulator-5554' not found\nTest run failed to complete. Expected 1 tests, received 0\n",
    "android-webview-host.log": "synthetic pre-teardown resource snapshot\nmemory.events: oom_kill 1\nOut of memory: Killed process synthetic qemu\n",
  });
  assert.match(output, /device 'emulator-5554' not found/);
  assert.match(output, /Android-runner-host/);
  assert.match(output, /oom_kill 1/);
  assert.doesNotMatch(output, /lmkd updated properties successfully|closing lmkd data connection/);
});

const buildWrapper = new URL("../scripts/run-html5-android-ci.sh", import.meta.url);
function build(script) {
  const dir = mkdtempSync(join(tmpdir(), "synthetic-android-build-"));
  try {
    const log = join(dir, "public-build.log");
    const result = spawnSync("bash", [buildWrapper.pathname, log, "--", "bash", "-c", script], { encoding: "utf8", timeout: 10000 });
    return { ...result, log: readFileSync(log, "utf8") };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("build wrapper preserves success and the original nonzero exit code without retries", () => {
  const good = build("printf 'synthetic build succeeded\\n'");
  assert.equal(good.status, 0); assert.match(good.stdout, /synthetic build succeeded/);
  assert.doesNotMatch(good.stdout, /::error/);
  const bad = build("printf 'FAILURE: synthetic build refused\\nCaused by: unavailable public dependency\\n' >&2; exit 23");
  assert.equal(bad.status, 23); assert.match(bad.stdout, /command exited 23/);
  assert.match(bad.stdout, /Caused by: unavailable public dependency/);
  assert.equal(bad.log.split("FAILURE:").length, 2);
});

test("build failure annotations escape untrusted log data and retain early causes before long stack tails", () => {
  const result = build("printf 'error: 50%% synthetic failure\\n::notice title=untrusted::not a command\\n'; for i in {1..1000}; do printf 'at synthetic.Gradle.task()\\n'; done; exit 1");
  assert.equal(result.status, 1); assert.match(result.stdout, /50%25 synthetic failure/);
  assert.match(result.stdout, /%0A::notice/);
  assert.equal(result.stdout.split("\n").filter((line) => line.startsWith("::notice")).length, 0);
  assert.ok(result.stdout.length < 13000);
});

const completeSummary = () => ({ schema: 1, phases: Object.entries({ "public-local-files": 6, "network-local-files": 6, "public-audio-policy": 1, "public-headline-harry": 1 })
  .map(([phase, tests]) => ({ phase, exit: 0, tests, passed: tests, failed: 0, skipped: 0, firstFailure: null })) });
function validate(summary) {
  const dir = mkdtempSync(join(tmpdir(), "synthetic-android-complete-"));
  try {
    const path = join(dir, "summary.json");
    if (summary !== undefined) writeFileSync(path, typeof summary === "string" ? summary : JSON.stringify(summary));
    return spawnSync("python3", [reporter.pathname, "--require-complete", path], { encoding: "utf8", timeout: 10000 });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("Android completion gate requires all 14 passing actual results and four zero exits", () => {
  const result = validate(completeSummary());
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /14 passed, zero failed\/skipped/);
});

test("Android completion gate refuses partial/no results, skips, failures or nonzero phase exit even if a runner claims success", () => {
  for (const change of [
    (s) => { s.phases[0].tests = 5; s.phases[0].passed = 5; },
    (s) => { s.phases[1].skipped = 1; s.phases[1].passed = 5; },
    (s) => { s.phases[1].failed = 1; s.phases[1].passed = 5; },
    (s) => { s.phases[2].exit = 1; },
    (s) => { s.phases[3].exit = null; s.phases[3].tests = 0; s.phases[3].passed = 0; },
    (s) => { s.phases[0].tests = true; },
  ]) {
    const summary = completeSummary(); change(summary);
    const result = validate(summary);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /Android-WebView-incomplete/);
  }
});

test("Android completion gate refuses malformed, missing, duplicate or unknown phase metadata", () => {
  for (const summary of [undefined, "{broken", {}, { schema: 1, phases: [] },
    { schema: true, phases: completeSummary().phases },
    { schema: 1, phases: [null, ...completeSummary().phases.slice(1)] },
    { schema: 1, phases: [completeSummary().phases[1], ...completeSummary().phases.slice(1)] },
    { schema: 1, phases: [{ phase: "untrusted\n::notice title=fake::no" }, ...completeSummary().phases.slice(1)] },
  ]) {
    const result = validate(summary);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /Android-WebView-incomplete/);
    assert.doesNotMatch(result.stdout, /::notice/);
  }
});
