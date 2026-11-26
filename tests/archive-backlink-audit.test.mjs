import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("archive backlink audit has offline privacy, boundary and ordered-stage controls", () => {
  const result = spawnSync("python3", ["-m", "unittest", "discover", "-s", "tests", "-p", "archive_backlink_audit_test.py"], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 30_000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stderr, /Ran \d+ tests/);
  assert.match(result.stderr, /OK/);
});

test("archive CI is read-only and uploads only the sanitized receipt, never raw HTML", () => {
  const workflow = readFileSync(new URL("../.github/workflows/archive-backlink-audit.yml", import.meta.url), "utf8");
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /contents: write|git push|git commit|secrets\./);
  assert.match(workflow, /path: \.cache\/archive-backlink-audit\/receipt\.json/);
  const actions = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
  assert.equal(actions.length, 2);
  for (const action of actions) assert.match(action, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
});
