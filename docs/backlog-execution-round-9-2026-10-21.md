# Backlog execution round 9 — 21 Oct 2026

*Ninth round: “investigate polyglot and omniglot recipes deep dive · continue
backlog · update wiki”. Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md).*

## Delivered

| Artifact | What it closes |
| --- | --- |
| [`polyglot-files-deep-dive-2026-10-21.md`](polyglot-files-deep-dive-2026-10-21.md) | **Polyglot deep dive**: corkami taxonomy (polyglot / multi-personality / chimera), mitra construction classes (stack/parasite/jigsaw), GIFAR + Janus + AngeCryption + key-commitment + Shattered, the 2022→2025 detection papers (polydet/TrID failures; PolyConv/ImSan), format-design lessons, SFX-as-polyglot tie-in |
| [`omniglot-recipes-deep-dive-2026-10-21.md`](omniglot-recipes-deep-dive-2026-10-21.md) | **Omniglot recipes deep dive**: registry inventory (A-tom-tom ✅ implemented from GCWizard Dart source; HVD = image/font-gated on omniglot.com/conscripts/hvd.php; Codescript/Tines/Window/Puzzle Code = named tokens), implementability matrix + provenance discipline |
| `tools/polyglot_scan.mjs` + `tests/polyglot-scan.test.mjs` | **backlog/tooling**: offline multi-signature scanner classifying *unknown / single / parasite-or-stack / multi-offset / chimera-candidate* (SFX/GIFAR shape detection); 8 fixture tests |
| [`README.md`](README.md) (docs/) | **wiki update**: research-wiki index over all 182 markdown docs, sectioned (backlog · ghirdra line · protection/disassembly · archives/carving · crypto · localization · silicon · apps · notes) |

## Findings worth keeping

- **Omniglot lesson:** the registry's honesty discipline (“named tokens only —
  stroke bitmaps are not embedded”) is correct: HVD's 1:1 map exists only as an
  image + Aiden Neuding font on Omniglot — never fabricate a text map. A-tom-tom
  shows the right path: a primary implementation (GCWizard's Dart logic) beats
  an editorial page.
- **Polyglot lesson:** benign in-the-wild polyglots are older than the malicious
  ones (hybrid ISOs, **SFX archives**, hybrid PDFs); every detection study from
  2012→2025 shows general tools (`file`, TrID, binwalk, even polydet) failing —
  hence the repo keeps purpose-built scanners (`polyglot_scan`, `carve`,
  `fnaf_xcarve`, XDC `extractStream` sigScan).
- Test gotcha logged: magic-range overlap needs *byte-compatible* patterns —
  “BZh” cannot also be “BM”; the working chimera fixture is a doubled JPEG
  marker (`FF D8 FF D8 FF` matches at 0 and 2, ranges overlap).

## Test tally at round-9 close

| Suite | Result |
| --- | --- |
| `tests/polyglot-scan.test.mjs` (new) | 8 PASS |
| round-7/8 suites (cow-level 5, sierra 5, uhs 11, sync+sfx 3, round5 8) | unchanged, green |

## Next (round 10)

- Toy-binary loader/resource demo (John/Ghidra open question 3) — now with a
  polyglot-flavored fixture option.
- `polyglotScan` CyberChef op if the CLI tool earns its place; spotlight packs
  incl. a TomTom-slash round-trip.
- John test-vector regression wiring; ZIP legacy-garble note (S1 remainder).
- HVD/Puzzle Code glyph tiles if fonts/images clear terms for embedding.
- Gated: DOSBox sneakers smoke; Warrick relay runs.
