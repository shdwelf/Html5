# vendored: CXXRTL runtime (from Yosys)

`rtl/` is verified by *simulating* it, and the simulator is CXXRTL — the C++
back-end that Yosys generates. The generated `sim/vchip_top.cc` includes
`<cxxrtl/cxxrtl.h>`, so the runtime headers and the C API implementation live
here and are put on the include path by `tools/verify_rtl.py`:

```
g++ -std=c++17 -O2 -Isim -Ivendor/cxxrtl -Irtl/golden tools/sim/vchip_driver.cc -o sim/vchip_rtl
```

## Where it came from

| | |
| --- | --- |
| upstream | `YosysHQ/yosys`, directory `backends/cxxrtl/runtime/` |
| commit | `d0e71cfb7bcafe2b437f3edc1789b69e99ecd55a` (the `main` head at vendoring time) |
| archive | `https://codeload.github.com/YosysHQ/yosys/tar.gz/d0e71cfb7bcafe2b437f3edc1789b69e99ecd55a` |
| archive sha256 | `2fcffd4efd420dd06c0aa3c93c0674413576f83facb81912cd1a38fc3609acd4` |
| license | ISC (`COPYING` in the same archive: "ISC License, Copyright (C) 2012 - 2026 Claire Xenia Wolf") |

The whole directory is copied verbatim; nothing is patched. That is checked, not
asserted — re-fetch the archive above and compare:

```sh
tar xzf yosys-<sha>.tar.gz
diff -r yosys-<sha>/backends/cxxrtl/runtime vendor/cxxrtl   # must print nothing
```

Pinning to a *commit* rather than a branch matters here: the first vendoring was
done from `refs/heads/main`, and by the time this file was written `main` had
moved on, so a branch-pinned archive is not reproducible.

## Files and hashes

```
9fa21b73508f760a15309546c8cfc1da7130cc92939c7c8d06f3b88c9b7b95c5  README.txt
e161fc07407b63b198e37057657d3ee8f1853d871b39c6af26c788d3033f5494  cxxrtl/capi/cxxrtl_capi.cc
2e53569e39b12aa50725e68939a5d3f4e30062af86d062e057342fb189026ff5  cxxrtl/capi/cxxrtl_capi.h
e40e882b8ead83c05682cfefcd2d7cde9f473197d63fb1597c9cc28e7077bd6f  cxxrtl/capi/cxxrtl_capi_vcd.cc
3fa28112cfbbe882b82f02818576e3bbd9f0907deb9a6a949b8b92ba2692f3c3  cxxrtl/capi/cxxrtl_capi_vcd.h
f0b10970e58343d4992b0838c6729357e8c6c299ef26eaa36a344f1a741e0dcf  cxxrtl/cxxrtl.h
ddb140cb79d8b5a1f832c2c8f4abdff3c2ba0583a430bf2994333198fb4f76cb  cxxrtl/cxxrtl_replay.h
eb3231b971bb6d7cb95167bb5ae03f2901e2c15ed55af72c35e73038f00bfdb5  cxxrtl/cxxrtl_time.h
2f854e3b1edcf6b1a4c53162f158e184d1846eecf17ff8fa3f90f4ff49f45a30  cxxrtl/cxxrtl_vcd.h
```

## Two CXXRTL behaviours worth knowing (found the hard way)

Both are documented in `docs/VCHIP.md` because they change how a driver must be
written, and both were discovered by simulation disagreeing with the reference
model rather than by reading:

* **Two `step()` calls per rising edge.** `step()` is
  `do { eval(); } while (commit() && !converged)`, so a single call can return
  after applying newly written inputs without re-evaluating the design — the
  whole model then lags exactly one cycle. `tools/sim/probe.cc` is the record of that
  experiment (patterns A/B versus C/D/E).
* **The generated `reset()` may be empty.** `p_vchip__top::reset()` is a no-op
  here (`rst_n` is an ordinary input), so the driver drives reset itself; calling
  `reset()` and expecting initialised registers would silently give zeros.

Only `cxxrtl/vcd` support is unused: witness traces would come from
`cxxrtl_vcd.h` if a counterexample ever needs to be replayed, since the
`yowasp-sby` wrapper has no `--dump-vcd`.
