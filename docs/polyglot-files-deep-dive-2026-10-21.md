# Polyglot files — deep dive (21 Oct 2026)

*Request: “investigate polyglot … recipes deep dive”. A format-security study
companion to [`omniglot-recipes-deep-dive-2026-10-21.md`](omniglot-recipes-deep-dive-2026-10-21.md)
(the recipe-registry side). F4 posture: detection, defense, and format
literature; crafting techniques are described for recognition, not as exploit
walkthroughs.*

## 1. Definition and taxonomy

A **polyglot** is a file valid in two or more formats. Corkami's docs
([`corkami/docs/AbusingFileFormats`](https://github.com/corkami/docs/blob/master/AbusingFileFormats/README.md))
split the field properly:

- **polyglot** — different types *simultaneously* (filter bypass);
- **multiple-personality (“multi”)** — different parsers read different
  content from the same bytes;
- **chimera** — the *same* data interpreted as different types (the advanced
  case).

ACM-Asia 2022 (“Toward the Detection of Polyglot Files”,
[10.1145/3546096.3546106](https://dl.acm.org/doi/10.1145/3546096.3546106))
adds the practical construction taxonomy from **Ange Albertini**'s tool
[`corkami/mitra`](https://github.com/corkami/mitra) (“loosely named after
Mithridates, a polyglot historical figure”):

| Construction | Mechanism | Precondition |
| --- | --- | --- |
| **Stack** | second file appended; offsets patched | first tolerates trailing data; second doesn't enforce magic-at-zero |
| **Parasite** | payload stored in slack/comment/ignored regions | format has a tolerated-carrier region (most do) |
| **Jigsaw / chimera** | shared bytes read as different structures by different parsers | parser disagreement about structure |
| **Near-polyglot / polymock** | almost-valid variants that route around a checker's exactness | checker strictness gaps |

The 2022 paper's overt/covert framing (the format a file *presents* vs the one
analysis reveals) is the vocabulary used in
[`tools/polyglot_scan.mjs`](../tools/polyglot_scan.mjs) (this round's detector).

## 2. Landmark cases (recognition corpus)

- **GIFAR** (GIF+JAR, ~2008): a valid GIF with an appended Java archive —
  smuggled into browser same-origin execution via avatar uploads
  (Nitesh/Hardin/Rios; Wikipedia “Polyglot (computing)”).
- **AngeCryption** (Albertini & Aumasson): AES-based — force an encryption
  routine to output a file that is *also* a valid format of the attacker's
  choice; pairs with the **key-commitment** attacks of USENIX Security '22
  (“How to Abuse and Fix Authenticated Encryption Without Key Commitment”,
  [`kste/keycommitment`](https://github.com/kste/keycommitment)): binary
  polyglots turn cryptographic ambiguity into practical files (250+ format
  combinations via mitra).
- **Janus** (CVE-2017-13156): DEX+APK signature-ambiguity on Android —
  verifiers and loaders disagree on where the signed region is.
- **Shattered** (SHA-1 collision): colliding contents as a “crypto-polyglot”
  of two PDFs.
- **Benign in-the-wild polyglots** (Albertini's “clean” list): hybrid ISOs
  (ISO+MBR), **self-extracting archives (executable+archive)** — exactly the
  SFX case in [`arj-lha-ace-password-notes-2026-10-21.md`](arj-lha-ace-password-notes-2026-10-21.md) /
  [`arj-garble-format-notes.md`](arj-garble-format-notes.md) — and hybrid
  PDFs (PDF+OpenDocument). **Phar** (PHP) is the designed polyglot: stub
  (executable PHP) + manifest + files + optional signature (Vickie Li's
  writeup).
- **PoC||GTFO** (pastor manul's journal): the deliberate art-house case —
  PDF/ZIP/ELF/etc. multi-personality as a publication format.

## 3. Detection research (the current frontier)

| Work | Result |
| --- | --- |
| Jana & Shmatikov 2012 (“Werewolf”) | a TAR+ZIP stack evaded 20 of 36 VirusTotal detectors |
| ACM-Asia 2022 | `file`, **polydet**, binwalk, TrID all fail at reliable polyglot detection; MalConv2/CatBoost ~95% on their corpus |
| “Where the Polyglots Are” (arXiv 2407.01529, 2024) | survey: even purpose-built tools miss wild polyglots; attack-chain framing (upload filters, sanitizers, AI interfaces) |
| “On the Abuse and Detection of Polyglot Files” (2025) | **PolyConv** (PR-AUC 0.999, F1 99.2%) + **ImSan** content-disarmament sanitizing 100% of image polyglots in their set |

Tool/library pointers for a lab: `corkami/mitra` (generator),
`mindcrypt/polyglot` (curated techniques/tools/resources list),
`corkami/pocs/poly`, `truepolyglot.hackade.org`, and the detection side
(polydet, TrID rules, TrIDLib). Format-design lessons from mitra's README:
**enforce magic at offset 0**; prefer footers (XZ, ID3v1) to detect
truncation/appendage; treat “starts anywhere, no magic” (PostScript, MP4) as
exploitable-by-design.

## 4. Repo integration (this round)

- **`tools/polyglot_scan.mjs`** — offline multi-signature scanner: reports
  every magic found at every offset, then classifies *unknown / single /
  parasite-or-stack / multi-offset / chimera-candidate* (chimera = overlapping
  region matches; parasite-or-stack = format at offset 0 plus later magics —
  the SFX/GIFAR shape).
  Sibling to `tools/carve.mjs` / `tools/fnaf_xcarve.mjs` and the XDC
  `extractStream.js` sigScan approach; 8 fixture-based tests, no game data.
- **Recipe angle (CyberChef):** the registry's archive ops (`paranoidUnzip`,
  `arjHeader`, `lhaHeader`, `aceHeader`) are the natural place to surface
  “trailing data beyond EOCD / SFX stub present” findings; a `polyglotScan`
  op is the follow-up if the CLI tool proves out.
- Cross-links: SFX-as-polyglot in the password-notes docs; carving protocol in
  [`dos-game-disassembly.md`](dos-game-disassembly.md).

## 5. Provenance

Every claim above is sourced inline (ACM/arXiv/USENIX papers, corkami docs &
tool READMEs, CVE-2017-13156, the mindcrypt index). No polyglot payloads are
generated or redistributed here — fixtures in the tests are synthetic
byte-patterns only.
