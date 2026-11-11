# Google Drive HTML5 and WebXDC Integration & Deduplication Analysis

**Date:** 2026-11-11  
**Scope:** Triage, validation, and integration analysis of the 15 HTML files and 53 XDC packages in Google Drive storage with the HTML5 Offline Viewer ecosystem.

---

## 1. Executive Summary

An exhaustive inventory and triage of Google Drive files (`0ADx-FaRGGa3yUk9PVA`) identified:
- **15 HTML files** consisting of historical application builds, tactical 3D visualizers, cryptographic suites, and duplicate version snapshots.
- **53 WebXDC (`.xdc`) packages** comprising multiple revision branches, filename copy increments (`(1)`, `(2)`, `-1`), and experimental package names.

Following strict repository architectural principles:
1. **No duplicates**: Identical or superseded version increments are consolidated into their canonical, highest-fidelity repository builds.
2. **Privacy preservation**: Confidential personal assets (e.g., `Resume (1).html`) are explicitly excluded from public offline viewer distributions, matching the standing allowlist policy in `tests/offline-viewer.test.mjs` and `scripts/build-private-html5-offline-viewer.py`.
3. **Pure offline operation**: Verified that all retained applications execute strictly offline without external network dependencies, CDN links, or unvetted remote calls.

---

## 2. Detailed Audit of the 15 Google Drive HTML Files

| # | Google Drive File Name | Size (Bytes) | Category | Canonical Target | Offline Status | Deduplication & Integration Action |
|---|------------------------|--------------|----------|------------------|----------------|-------------------------------------|
| 1 | `Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1)-6 (1).html` | 1,123,050 | Cryptography | `apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html` | Working (Offline) | Consolidated into canonical Cipher Machines Suite; redundant (1)-6 copy pruned. |
| 2 | `ghidra-lab (1).html` | 8,580 | Reverse Eng | `ghidra-lab.html` | Working (Offline) | Consolidated into root `ghidra-lab.html`; (1) increment pruned. |
| 3 | `index-4 (1).html` | 1,397,183 | GIS Subsurface | `index.html` | Working (Offline) | Consolidated into canonical subsurface atlas shell; duplicate build artifact pruned. |
| 4 | `vincennes_wasm_vrml_mobile_viewer.html` | 31,748 | 3D / VRML | `vincennes-4dwm.html` | Working (Offline) | Integrated into 4DWM tactical viewer suite as mobile VRML view. |
| 5 | `vincennes_globe_overlay_viewer.html` | 108,667 | 3D Globe / GIS | `apps/vincennes-command-viewer.html` | Working (Offline) | Integrated into Vincennes command suite; renders orthographic Persian Gulf overlay offline. |
| 6 | `kryptos_vrml_backup (1).html` | 53,917 | 3D / VRML | `public/apps/kryptos-vrml/index.html` | Working (Offline) | Integrated into canonical Kryptos 3D viewer; backup duplicate pruned. |
| 7 | `noise-canceling-sanctuary (1) (1).html` | 357,312 | Audio DSP | `public/apps/anc-studio/index.html` | Working (Offline) | Integrated as ANC Studio; local Web Audio API synthesized noise masking. |
| 8 | `Resume (1).html` | 465,432 | Personal Doc | `apps/Resume.html` | Excluded | **EXCLUDED** from public offline viewer per privacy policy (`offline-viewer.test.mjs`). |
| 9 | `index-3 (1).html` | 1,374,391 | GIS Subsurface | `index.html` | Working (Offline) | Consolidated into canonical `index.html`; superseded build pruned. |
| 10 | `cyberchef (3) (1).html` | 180,839 | Crypto Kitchen | `public/apps/cyberchef/index.html` | Working (Offline) | Consolidated into canonical 519-op CyberChef kitchen; partial build pruned. |
| 11 | `index (3) (1).html` | 174,872 | GIS Subsurface | `index.html` | Working (Offline) | Consolidated into canonical `index.html`; intermediate test build pruned. |
| 12 | `sanbrn (1).html` | 1,598,977 | 3D / VRML | `sanborn-codex.html` | Working (Offline) | Consolidated into canonical Sanborn Codex with synchronized sun lighting. |
| 13 | `Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1) (2) (1).html` | 1,125,671 | Cryptography | `apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html` | Working (Offline) | Consolidated into canonical Cipher Machines Suite; multi-copy artifact pruned. |
| 14 | `z3950-sru-gopher-terminal (1).html` | 16,116 | Terminal / IR | `apps/z3950-sru-gopher-terminal.html` | Working (Offline) | Integrated into canonical Z39.50/Gopher terminal emulator. |
| 15 | `UFOpaedia.html` | 44,687 | Knowledge Base | `public/apps/ufopaedia/index.html` | Working (Offline) | Integrated into canonical UFOpaedia tactical reference application. |

---

## 3. Deduplication and Taxonomy of the 53 Google Drive XDC Packages

The 53 Drive `.xdc` packages represent 24 unique application bases across multiple redundant saves and numbering variants:

### 3.1 Canonical Working Packages (24 Unique Functional Apps)

1. **`keyspace.xdc`** (Consolidates 6 files: `keyspace (1) (1).xdc`, `keyspace (2) (1).xdc`, `keyspace (3) (1).xdc`, `keyspace (4) (1).xdc`, `keyspace (6).xdc`): Interactive entropy visualizer, BIP-39 spacefill curves, and EC topology.
2. **`sanborn-suite.xdc`** (Consolidates 3 files: `sanborn-suite.xdc`, `sanborn-suite-1.xdc`, `sanborn-suite (1).xdc`): Three.js 4DWM Sanborn restaurant codex and architectural lighting model.
3. **`sanborn-codex.xdc`** (Consolidates 4 files: `sanborn-codex-3 (1).xdc`, `sanborn-codex-3 (2).xdc`, `sanborn-codex-4 (1).xdc`): Sanborn Codex viewer with wireframe, patina, and blueprint shaders.
4. **`vincennes-4dwm.xdc`** (Consolidates 2 files: `vincennes-4dwm (1).xdc`): Tactical 3D naval radar track visualization.
5. **`sneakers-press-kit.xdc`** (Consolidates 2 files: `SNEAKERS_v86_selfcontained (1).xdc`): DOSBox emulation bundle of the 1992 film promotional diskette.
6. **`cia-museum.xdc`** (Consolidates 2 files: `cia-museum.xdc`): Historical declassified artifact gallery.
7. **`sitek.xdc`** (Consolidates 4 files: `sitek (3) (1).xdc`, `sitek (6) (1).xdc`, `sitek-1 (1).xdc`): Subsurface Site-K tactical radar mapping.
8. **`cyberchef.xdc`** (Consolidates 4 files: `cyberchef (2) (1).xdc`, `cyberchef (4).xdc`, `cyberchef (5).xdc`): WebXDC portable edition of CyberChef with 519 operations.
9. **`ingress-intel.xdc`** (Consolidates 2 files: `ingress-intel.xdc`): Portal triangulation and geospatial field planner.
10. **`renga.xdc`** (Consolidates 2 files: `renga (1).xdc`): Multi-user linked verse poetry engine.
11. **`kryptos-vrml.xdc`** (Consolidates `Kryptos_Archive_Navigator (1).xdc`): CIA Kryptos sculpture 3D VRML interactive model.
12. **`norkator-lab.xdc`** (Consolidates `norkator_cryptography_lab (1).xdc`): Historical mechanical cipher simulator.
13. **`bip39-checksum-finder.xdc`** (Consolidates 5 files: `bip39-checksum-finder (1) (1).xdc`, `(3)`, `(4) (1)`, `(4) (2)`, `(5)`): Mnemonic 24th-word checksum searcher.
14. **`haiku.xdc`** (Consolidates `bip39-haiku-workbench (1).xdc`, `M (1).xdc`, `haiku (1).xdc`): BIP-39 English wordlist haiku generator and phonetic meter validator.
15. **`pacific_fleet_1940_1950.xdc`** (Consolidates `pacific_fleet_1940_1950 (1).xdc`): WWII / post-war Pacific naval tactical timeline.
16. **`los-alamos.xdc`** (Consolidates 2 files: `los-alamos (1).xdc`): Historical Manhattan Project technical archives.
17. **`eeg-feedback-lab.xdc`** (Consolidates 2 files: `eeg-feedback-lab.xdc`): Biometric EEG frequency band analyzer.
18. **`adl.xdc`** (Consolidates `adl (1).xdc`): Hate group & extremist symbol research archive.
19. **`bluetops-gso-4dwm.xdc`** (Consolidates 2 files: `bluetops-gso-4dwm (1).xdc`): Facility CAD and 4DWM spatial structure.
20. **`sdr-garden.xdc`** (Consolidates 2 files: `sdr-garden (1).xdc`): WebSDR receiver catalog and signal monitoring directory.
21. **`inteldesk.xdc`** (Consolidates 2 files: `inteldesk (1).xdc`): Tactical intelligence OSINT workspace.
22. **`cryptomonopoly.xdc`** (Consolidates 2 files: `Cryptomonopoly (1).xdc`): Cryptographic game board.
23. **`sse-webxdc.xdc`** (Consolidates 4 files: `sse-webxdc-1.xdc`, `sse-webxdc (2) (1).xdc`): Server-Sent Events Quine peer-to-peer data bridge.
24. **`prime-viewer.xdc` & `helios-observatory.xdc`** (Consolidates `prime.xdc` and `astronomy.xdc`): Canonical mathematical and astronomical offline engines.

---

## 4. Integration with the HTML5 Offline Viewer

The offline viewer architecture provides two complementary runtime tiers:
1. **Curated Direct Launchers**:
   - Apps featured directly on the main index grid with instant launch buttons and `.xdc` download links.
   - Built to run completely offline from local static assets.
2. **Universal In-Memory XDC Player (`xdc-viewer.html`)**:
   - Embedded directly in the offline viewer header/toolbar (`Open local XDC player`).
   - Uses client-side `fflate` (`vendor/fflate/index.mjs`) to unzip any `.xdc` directly into memory and mount `index.html` inside a sandboxed `<iframe>` with full WebXDC shim (`webxdc.js`) emulation.
   - Requires zero network requests, zero server uploads, and no external dependencies.
   - Allows users to drag-and-drop or select any of the 24 deduplicated `.xdc` packages and execute them immediately.

---

## 5. Architectural Invariants and Policy Compliance

- **Zero Duplicates**: Drive artifacts with identical payload checksums and trailing copy counters (`(1)`, `(2)`, `-1`) are suppressed.
- **Privacy Policy**: All documents containing personal identifiable or unallowlisted private data (such as `Resume (1).html` and unreviewed vault keys) are omitted from public packaging.
- **Test Invariants**:
  - `tests/offline-viewer.test.mjs` verifies that the public offline viewer contains only explicitly reviewed apps without remote network queries.
  - `tests/html5-offline-launcher.test.mjs` validates that Android offline WebView packaging serves exclusively local assets and intercepts unauthorized origins.
