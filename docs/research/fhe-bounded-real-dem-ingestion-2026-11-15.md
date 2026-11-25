# Bounded real-DEM ingestion for the BFV/SSE experiment

**Date:** 2026-11-15
**Status:** Reproducible research path; not a production FHE service.

## What changed

`tools/fhe-dem-sse-real-dem.mjs` now adapts the checked-in `data/lawrence/dem-anchors.json` control grid (USGS 3DEP `getSamples`, sparse 8 × 8 samples) to the existing BFV sum-of-squared-differences input contract. It selects up to eight values from each of two rows, subtracts one shared integer-metre offset, and rounds to whole metres. This preserves row-to-row integer differences while fitting the demo's conservative `0–1000` value bounds. It rejects malformed dimensions, unsupported units/datum, non-finite values, invalid rows, and oversize selections. NoData must be handled before this adapter.

Run:

```sh
node tools/fhe-dem-sse-real-dem.mjs
node tools/fhe-dem-sse-real-dem.mjs data/lawrence/dem-anchors.json /tmp/lawrence-input.json
node tools/he-bfv-dem-sse-demo.mjs /tmp/lawrence-input.json
```

The adapter reports USGS source/product, retrieval date, vertical datum, selected rows, quantization, and interpretation. The test suite now runs both the adapter and the bounded BFV evaluation against the real public control values.

## Interpretation limits (important)

The two vectors are same-column-index values from *different neighboring rows* of a sparse sampled grid. They are not elevations at matching coordinates, not a comparison of two DEM products, and not a measurement of DEM error, terrain accuracy, or an aligned surface difference. Their SSE is simply an encrypted arithmetic result over two short real-elevation vectors. The source grid itself is 8 × 8 sparse point samples; its source raster resolution does not mean the stored grid has that resolution.

The existing bounded contract allows at most eight pairs, values from 0 through 1000, and at most 8,000,000 for the sum. It uses whole integer metres and a locally held secret key in the same process as the evaluator. The library's reported 128-bit security level and a passing test do not constitute a security audit or production confidentiality guarantee. The user-visible output can leak information; data authentication, independent key custody, service/API controls, malicious-input defenses, NoData semantics, aligned CRS/resampling, realistic throughput/ciphertext-size benchmarks, and expert review remain unsolved.

## Deliberate boundary

This path is a small reproducible bridge from one repository DEM control artifact into an existing BFV experiment. It does not modify the browser terrain viewer, fetch raster files, claim production FHE readiness, perform threshold decryption, or process private data. A next useful benchmark would need two genuinely co-registered public DEM patches with explicit NoData/CRS/vertical-datum handling and a task-specific query contract; only after that should OpenFHE/TFHE-rs alternatives be compared on representative data.

Related landscape review: [FHE production readiness](fhe-production-readiness-2026-11-15.md).
