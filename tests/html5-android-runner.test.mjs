import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
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
