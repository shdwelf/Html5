# Backlog execution — round 79 (2026-11-17)

## FHE follow-up: bind the composable compiler contract

This round continues the FHE teaching/provenance work from round 76 and the
composable Concrete circuit merged in PR #222. That circuit already compiled
with `composable=True`, but its signed specification omitted the setting. This
round fixes the metadata gap rather than claiming to add bootstrapping or to
implement FHE-based authentication.

### Changes

- Move the public domain, bounds, compiler-setting constants and canonical
  specification into `tools/he_concrete_spec.py`, a standard-library-only
  module. The demo imports that contract; composability and evaluation-key
  compression now use the same constants in the specification and compiler
  configuration.
- Include `composable: true` in the hashed specification, advance the circuit
  ID to `f17-complete-field-arithmetic-v6`, and report the configured
  composability in the demo's JSON output. Existing v5 manifests do not match
  the v6 contract; arithmetic, parameters and input domain are unchanged.
- Add an always-on contract test. It runs Python with `-I -S` (no user/site
  packages), inspects the public metadata and independently hashes the exact
  canonical bytes with Node's SHA-256. It is not a simulated FHE evaluation.
- Strengthen the opt-in provenance checks: correctly signed manifests for a
  wrong circuit ID or a specification with `composable: false` must still be
  rejected. The latter retains the circuit ID and evaluation-key bytes to
  isolate the compiler-contract mismatch. The encrypted integration also
  checks that its reported specification digest matches the public contract.
- Correct the FHE audit's stale reduction bound and keyset-transport description,
  and replace its old “integration not run” status with the verified v6 result.

The canonical v6 specification SHA-256 is:

`71c5c1366bc27b6df892154422b7bdaff6cc8f38de8d76851044eed532802235`

Inspect the declared contract without installing the optional FHE environment:

```sh
python3 -I -S tools/he_concrete_spec.py
node --test tests/he-concrete.test.mjs
```

The CLI adds a display newline; that newline is not included in the hash. The
specification remains a declared contract, **not** an attestation of the exact
compiled binary, a production deployment, or an independent security review.
No private keys, evaluation keys, ciphertexts or dependency environments were
added to Git.

## Verification

- Real Concrete 2.11.0 integration on CPython 3.11 x86-64 Linux — **2 passed,
  0 skipped**, including the public-contract test. The encrypted run covers
  all **289 ordered F17 pairs**, the encrypted zero-divisor flag, fresh-input
  randomization, evaluation-key signatures and circuit/configuration rejection,
  and **depth-8 encrypted-output composition** with final-only decryption.
  It completed in approximately 398 seconds with the pinned optional
  requirements installed outside the repository:

  ```sh
  PATH="/tmp/he-concrete-venv/bin:$PATH" RUN_CONCRETE_FHE=1 \
    CONCRETE_FHE_TRACE=1 MALLOC_ARENA_MAX=2 OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 \
    node --test tests/he-concrete.test.mjs
  ```

- `npm test` — **318 Vitest tests passed**; Node runner: **1,057 passed,
  14 skipped, 0 failed**. The default run intentionally skips encrypted
  Concrete evaluation, which passed separately above. Other skips are the
  existing optional JDK, browser, pixel-rendering, JAR-integration and upstream
  source-tree gates.
- `python3 -m py_compile tools/he_concrete_spec.py tools/he-concrete-fhe-demo.py`
  — passed.
- `node --check tests/he-concrete.test.mjs` and `git diff --check` — passed.

The fixed-domain educational boundary remains: no real authentication secrets,
TOTP verifier or remote FHE service was introduced. Hardware, external-source
and live-service backlog gates remain unchanged.
