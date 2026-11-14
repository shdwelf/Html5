import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

// Concrete (and Torch) are optional, multi-GB dependencies. Enable explicitly
// after installing tools/he-concrete-requirements.txt in CPython 3.11.
test("Concrete bootstraps encrypted add/subtract/multiply/modular-divide, including zero", {
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
  const { modulus, programmable_bootstraps: bootstraps, results } = JSON.parse(run.stdout);
  assert.equal(modulus, 17);
  assert.ok(bootstraps > 0);
  assert.equal(results.length, 16);
  for (const { x, y, result, sum, difference, product, quotient, divisor_valid: valid } of results) {
    assert.equal(result, (x * y + x + 1) ** 2);
    assert.equal(sum, (x + y) % modulus);
    assert.equal(difference, ((x - y) % modulus + modulus) % modulus);
    assert.equal(product, (x * y) % modulus);
    assert.equal(valid, Number(y !== 0));
    if (y) assert.equal((quotient * y) % modulus, x);
    else assert.equal(quotient, 0, "zero divisor has no quotient, only an encrypted invalid flag");
  }
});
