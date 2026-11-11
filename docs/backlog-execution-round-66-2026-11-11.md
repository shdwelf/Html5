# Backlog execution — round 66 (2026-11-11)

## Completed in this pass

### 1. CyberChef Operation Registry: Munitions T-Shirt (`munitionsTshirt`)
- Integrated the historic 1995 Adam Back 3-line Perl RSA munitions signature into CyberChef under the `Public Key` category.
- Added actions for generating the Perl/dc script, computing textbook modular exponentiations, and summarizing the ITAR Category XIII export control legal brief and *Bernstein v. United States* (9th Cir. 1999) First Amendment precedent.
- Registered dedicated recipe pack: `Munitions T-Shirt — Perl RSA & Free Speech`.
- Updated operation count from 518 to 519 in `public/apps/cyberchef/index.html` and `public/apps/cyberchef-merged/index.html`.
- Synchronized `POST_MERGE_OPS` (41 ops) and updated SFX offline generator test thresholds; automated tests passed cleanly (11/11).

### 2. Perl Decentralized Stack Cookbook (`tools/cryptofountain.pl`)
- Delivered pure Perl 5 reference implementation and self-testing cookbook for CryptoFountain BBS mathematical primitives:
  - Adler-32 (`0x6f2a22e2`) & Fletcher-16 (`0xe704`) bit-exact checksums.
  - 64-bit Dual FNV-1a (`6ed10d32dac30e74`).
  - Galois Field $\text{GF}(2^8)$ arithmetic over AES polynomial $x^8 + x^4 + x^3 + x + 1$ ($0x11d$).
  - Rateless Luby Transform (LT) Robust Soliton distribution and peeling belief-propagation decoder.

### 3. Version 2 Inactivation Gaussian Elimination Decoder (`tools/raptor_gaussian_decoder.mjs`)
- Solved decoding stalls in finite-length fountain codes ($K \approx 10\text{--}30$) by introducing a hybrid two-phase solver:
  - Phase 1: Linear-time peeling cascade.
  - Phase 2: Inactivation bit-matrix Gaussian elimination over $\text{GF}(2)$ and precomputed $O(1)$ $\text{GF}(2^8)$ log/exp tables (`tools/gf256.mjs`).
- Achieved successful cycle recovery in 21% of stalled graphs without requiring supplementary channel overhead.

### 4. 3D VRML / Sanborn Suite Lighting Synchronization
- Reconciled Three.js hemisphere/directional sun lighting between `public/apps/sanborn-restaurant-4dwm/index.html`, `sanborn-codex.html`, and `public/apps/sanborn-suite/index.html`.
- Rebuilt `sanborn-suite.xdc` and `sanborn-codex.xdc` packages.
- Validated regression suite across all 3D viewers (`tests/sanborn-codex-lighting.test.mjs`, `tests/sanborn-suite.test.mjs`, `tests/red-october.test.mjs`, `tests/html5-offline-launcher.test.mjs`).

### 5. Documentation & Wiki in a Jar Rebuild
- Documented findings in `docs/cryptofountain-cookbook-and-perl-guide-2026-11-07.md`, `docs/ace-huffman-delta-luby-raptor-research-2026-11-07.md`, and `docs/offline-viewer-and-3d-pipeline-investigation-2026-11-11.md`.
- Synchronized `docs/README.md` and `public/apps/wikiinajar/docs.json` (337 docs).
- Rebuilt `wikiinajar.xdc` (1,870,248 bytes).

## Verification
- Node test runner: `node --test tests/cryptofountain-erasure-codes.test.mjs tests/hybrid-raptor-decoder.test.mjs tests/cyberchef-recipe-sync.test.mjs tests/cyberchef-sfx.test.mjs tests/offline-viewer.test.mjs tests/html5-offline-launcher.test.mjs tests/red-october.test.mjs tests/red-october-command-viewer.test.mjs tests/sanborn-codex-lighting.test.mjs tests/sanborn-suite.test.mjs` — all 61 tests pass.
- Perl validation: `perl tools/cryptofountain.pl` — passes.
