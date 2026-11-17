# CyberChef FHE architecture profile — 17 Nov 2026

## What changed

Added a separate `FHE Architecture Profile (manual measurements only)` operation
and the recipe pack `FHE Study — CKKS architecture profile (manual data only)`.
It is a bounded JSON calculator for measurements entered by the user; it is not
a new encryption or evaluation backend. The earlier F17 plaintext oracle,
deterministic byte-pair codec, and Lancelot case-study card remain separate.
The real Concrete programmable-bootstrap demo and the finite-noise, non-bootstrapped
BFV demo also remain separate from both browser recipes.

## Research synthesis from the additional Drive EPUBs

Two further 2023 architecture sources were downloaded and read locally:

- Rashmi Agrawal and Ajay Joshi, *On Architecting Fully Homomorphic
  Encryption-based Computing Systems*, Synthesis Lectures on Computer
  Architecture, Springer, 2023. ISBN 978-3-031-31754-5; DOI
  [10.1007/978-3-031-31754-5](https://doi.org/10.1007/978-3-031-31754-5).
  The book treats CKKS as approximate-number FHE; separates client-side
  encoding/encryption/decryption/decoding from server-side evaluation; and
  analyzes primitive operations, bootstrapping, an example logistic-regression
  workload, and CPU/GPU/ASIC/FPGA trade-offs. Its own profiling analysis
  characterizes the studied CKKS workload and bootstrapping as memory-bound.
- Alexander Lyashevsky, Alexey Titov, Yiqin Qiu, and Yujia Zhai, *XeHE: An Intel
  GPU Accelerated Fully Homomorphic Encryption Library*, Codeplay, 2023,
  electronic ISBN 979-8-88638-001-9, CC BY 4.0. The study describes a SYCL
  backend for Microsoft SEAL's CKKS path and emphasizes whole-pipeline work in
  addition to NTT kernels: modular arithmetic, memory allocation/reuse,
  asynchronous execution, and device/tile scheduling. Its reported speedups
  are results from two experimental, non-production Intel GPUs; the book
  explicitly says its numbers are not a hardware-selection guide. For example,
  it reports up to 9.93× over its naïve GPU NTT baseline, not a general FHE
  speedup guarantee.

These papers motivate measuring client, server, and kernel phases separately;
keeping host wall time distinct from asynchronous GPU event time; recording
allocation overhead; and reporting the provenance and meaning of byte counts.
They do not justify applying a published speedup to this repository or a user's
hardware. No source EPUB/PDF is copied into the repository, and no Drive URL or
private Drive identifier is exposed by the public recipe.

## Input contract

The operation consumes one JSON object, up to 65,536 UTF-8 bytes:

```json
{
  "schema": 1,
  "workload": "illustrative CKKS pipeline — synthetic figures",
  "scheme": "CKKS",
  "platform": "illustrative CPU + GPU",
  "timing_model": "serial",
  "stages": [
    {"name":"client encode/encrypt", "wall_ms":2.1, "host_allocation_ms":0.2},
    {"name":"server NTT/evaluation", "wall_ms":8.0,
     "gpu_event_ms":7.2, "host_allocation_ms":0.3,
     "read_bytes":8000000, "written_bytes":4000000,
     "work_count":24000000, "work_unit":"modular operations"},
    {"name":"client decrypt/decode", "wall_ms":2.4}
  ]
}
```

The figures above are fabricated test data, not a run of Concrete, SEAL, XeHE,
or an FHE benchmark. Each profile has 1–128 stages. `wall_ms` is required and
positive (at least 1e-9 ms); all timing inputs must be finite and no greater
than JavaScript's maximum safe integer. `gpu_event_ms` and
`host_allocation_ms` are optional, non-negative measurements;
`read_bytes` and `written_bytes` must be supplied together as non-negative safe
integers. The optional `work_count` and `work_unit` must also
be supplied together. Unknown values should be omitted rather than guessed.

`timing_model: "serial"` asserts that the supplied stage wall intervals are
sequential and non-overlapping, allowing the tool to report their **stage-wall
sum** and shares. This sum is not an end-to-end duration unless the profile
covers the whole path. `timing_model: "overlapping"` is for concurrent stages
or alternative runs; the calculator intentionally withholds sums and shares.
It never adds GPU event duration to wall time or to allocation time. The
host-allocation/wall ratio is descriptive and is not necessarily an additive
time share when measurements overlap.

## Output and interpretation

For a stage with both byte counters, the calculator reports
`io_bytes = read_bytes + written_bytes` and
`apparent_io_GB_per_second = io_bytes / (wall_ms × 1,000,000)` (decimal GB).
It labels this **apparent** because logical bytes are not necessarily physical
DRAM traffic. If the caller supplies a work count and unit, it reports the
user-defined ratio `work_count / io_bytes`; that is not a standardized
roofline/FLOP intensity. The largest entered wall-time measurement is identified without claiming
that it is a cryptographic bottleneck.

## Safety and non-goals

The operation only parses user-entered profile metadata and numbers. It does
not run a benchmark, read ciphertexts or key material, encrypt/decrypt, evaluate
a circuit, generate keys, refresh noise, choose parameters, estimate CKKS
precision/error, infer a BFV noise budget, or assess security. No arbitrary
circuit-depth, precision, memory, or runtime claim is made. Its output reports
only measurements that the user supplied and arithmetic derived from them.

## Verification

`tests/cyberchef-fhe-architecture-profile.test.mjs` checks the registry and
recipe-pack coverage, formulas, sequential versus overlapping timing semantics,
source-context labeling, and invalid/oversized inputs. The cookbook and SFX
coverage references were updated to 523 operations. Run:

```sh
node --test tests/cyberchef-fhe-architecture-profile.test.mjs \
  tests/cyberchef-fhe-kitchen.test.mjs tests/cyberchef-cookbook.test.mjs \
  tests/cyberchef-recipe-sync.test.mjs tests/cyberchef-sfx.test.mjs \
  tests/cyberchef-archive-headers.test.mjs
```
