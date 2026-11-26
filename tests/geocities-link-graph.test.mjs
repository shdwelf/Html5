import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
test("GeoCities graph has real compiled CSV, complete-gzip, transfer-integrity, privacy and overflow controls without networking", () => {
  const run = spawnSync("python3", ["-m", "unittest", "discover", "-s", "tests", "-p", "geocities_link_graph_test.py"], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 60_000,
  });
  assert.equal(run.status, 0, run.stderr || run.error?.message);
  assert.match(run.stderr, /Ran \d+ tests/);
  assert.match(run.stderr, /OK/);
});

test("the 19-GB graph run is explicit, read-only and retains only sanitized JSON, not raw graph or anchor text", () => {
  const workflow = read(".github/workflows/geocities-link-graph.yml");
  assert.match(workflow, /if: github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /--probe-receipt \.cache\/geocities-link-graph\/probe\.json/);
  assert.match(workflow, /--scan --scanner/);
  assert.match(workflow, /python3 -m unittest discover/);
  assert.doesNotMatch(workflow, /secrets\.|contents: write|pull_request_target|continue-on-error|git push|git commit/);
  assert.match(workflow, /path: \|\n            \.cache\/geocities-link-graph\/probe\.json\n            \.cache\/geocities-link-graph\/scan\.json\n/);
  assert.match(workflow, /retention-days: 14/);
  for (const [, action] of workflow.matchAll(/uses:\s+([^\s#]+)/g)) assert.match(action, /^actions\/[a-z-]+@[a-f0-9]{40}$/);
});
