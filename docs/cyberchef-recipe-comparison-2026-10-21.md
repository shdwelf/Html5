# CyberChef recipe-pack comparison — 21 Oct 2026

*Stream S10 (T10.1: backlog line 7 — “using comparison of all recipes in cyberchef*
*optimally enhance”). Reproduce: `node scripts/compare-cyberchef-recipe-packs.mjs`*
*(boots the real page in JSDOM, same pattern as*
`scripts/audit-cyberchef-sfx-coverage.mjs`). Coverage baseline at delivery:*
*500 operations, 225 packs, 649 entries, select-all verdict clean (audit run same day).*

## Measured shape of the corpus

| Measurement | Value |
| --- | ---: |
| Operations | 500 across 48 categories |
| Packs / entries | 225 / 649 |
| Union of pack ids | 500 (full registry) |
| Pack pairs sharing ≥1 op | 145 of 25,200 |
| Ops in exactly one pack | 385 (77.0%) |
| Near-duplicate/subset pairs (Jaccard ≥ 0.6 or strict subset) | 11 |

Category skew: **GCWizard 176 (35%)**, Classical 61, Boxentriq 28, Block Cipher 22,
Data 21, Coins 19, FIDO 18, Hash 14, Encoding 13 — then a long tail (Crypto 1,
MAC 1, Text 1, Math 1, Movies/Mystery 1 …).

## Findings

1. **The corpus is orthogonal, not redundant.** Only 145 of 25,200 pack pairs share
   any operation; 77% of operations appear in exactly one pack. A comparative pass
   finds almost nothing to *deduplicate* — the optimization opportunity is coverage
   and packaging, not deletion.

2. **All 11 subset pairs are pedagogical spotlights, not defects.** Examples:
   “Algorithm Complexity & Symbolic Logic” ⊂ “Full Coverage — Algorithms & Logic”
   (J = 1.00); “Wehrmacht Enigma I” ⊂ “Museum Rotor Machines — Enigma M3/M4” (0.67);
   “Avery LabelPro — Aztec Code” ⊂ “Avery label sheets” (1.00); the two Gutenberg
   codebook overlaps; “MZ Header Preflight” ⊂ “EXE Packer Triage”. Each smaller pack
   is a single-theme lab; the larger is a tour. **Recommendation: keep them, and
   document the taxonomy** (spotlight / lab / full-coverage / field-pack) in the
   installer UI so users can pick by depth.

3. **A few hub operations carry cross-cutting demos.** `cryptoTimeline` (Encyclopedia)
   is in 6 packs, `aesGCM` (Encryption) in 4 — the AES-GCM “Encryption Lab” shares it
   with the X25519/ML-KEM/keygen E2EE packs. Hub status is a *reason* to keep these
   ops dependency-light and doc-stable.

4. **Enhancement targets (the “optimally enhance” list):**
   - **Thin categories** (Crypto 1, MAC 1, Text 1, Math 1, Secret Sharing 1) are the
     real gaps: a second pack cannot exist where a category has one operation — those
     rows are new-operation work, sourced like [`recipe-sourcing-round-5-2026-10-14.md`](recipe-sourcing-round-5-2026-10-14.md).
   - **Registry ops without a spotlight pack** are hidden inside “Full Coverage”
     tours only; a `compare --spotlights` query can enumerate them for one-op lab packs
     (the cheapest pack-level win, matching the successful single-op Aztec/CueCat/Enigma
     pattern).
   - **Cross-pack hubs** (`cryptoTimeline`, `aesGCM`, `straddlingCheckerboard`, the
     Gutenberg set) should be the first rows of any regression recipe: they break the
     most packs if they change.

5. **Nothing suggests merging or rewriting existing recipes.** With 0 dangling ids,
   0 orphaned ops, and near-zero overlap, the merge discipline from
   [`cyberchef-recipe-sync-2026-10-07.json`](cyberchef-recipe-sync-2026-10-07.json)
   is holding. The next comparative win is breadth (new sourced ops → new spotlight
   packs), not restructuring.

## Reproduction

```sh
node scripts/audit-cyberchef-sfx-coverage.mjs     # coverage verdict
node scripts/compare-cyberchef-recipe-packs.mjs   # the tables behind this doc
```

Both boot `public/apps/cyberchef/index.html` in JSDOM against the live page
artifacts; no hand-copied registries.
