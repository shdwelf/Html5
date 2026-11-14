import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

// Concrete (and Torch) are optional, multi-GB dependencies. Enable explicitly
// after installing tools/he-concrete-requirements.txt in CPython 3.11.
test("Concrete performs encrypted multiply/add/lookup with programmable bootstrapping", {
  skip: process.env.RUN_CONCRETE_FHE !== "1" && "set RUN_CONCRETE_FHE=1 after installing Concrete",
}, () => {
  const run = spawnSync("python3", ["tools/he-concrete-fhe-demo.py"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    timeout: 180_000,
    env: { ...process.env, OMP_NUM_THREADS: "1", MKL_NUM_THREADS: "1", OPENBLAS_NUM_THREADS: "1" },
  });
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stderr);
  const { programmable_bootstraps: bootstraps, results } = JSON.parse(run.stdout);
  assert.ok(bootstraps > 0);
  assert.equal(results.length, 16);
  for (const { x, y, result } of results) assert.equal(result, (x * y + x + 1) ** 2);
});
