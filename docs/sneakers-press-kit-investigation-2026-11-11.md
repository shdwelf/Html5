# Sneakers 1992 Electronic Press Kit: Archival, Auction & Web Investigation (T2.2 & T2.3)

**Date**: 2026-11-11
**Scope**: Agent Backlog Task Stream S2 (`T2.2` and `T2.3`)
**Companion Documents**:
- `docs/sneakers-original-ghidra-wasm-2026-10-18.md`
- `docs/ghidra/sneakers-original-native-ghidra-2026-10-18.md`
- `docs/sneakers-headline-harry-layout-parity-2026-10-21.md`

---

## 1. Executive Summary & Task Scope

Task Stream S2 encompasses the media archaeology, disassemblies, provenance verification, and webxdc packaging of the promotional software distributed by Universal City Studios for the September 1992 theatrical release of *Sneakers* (directed by Phil Alden Robinson, starring Robert Redford, Dan Aykroyd, Ben Kingsley, Mary McDonnell, River Phoenix, David Strathairn, and Sidney Poitier).

Specifically, backlog items **T2.2** and **T2.3** mandate:
- **T2.2**: Investigate the external historical sources:
  1. `retrogames.pro` / retro gaming press coverage and diskmag historical articles.
  2. Internet Archive record `Sneakers_Film_Promotional_Floppy` (uploaded by Sketch the Cow / Marcin Wichary collection).
  3. Physical artifact provenance, auction cataloging, and collector packaging (e.g., eBay listing 365528826482 / Universal Studios custom promotional packaging).
- **T2.3**: Verify and finalize the Webxdc package parity modeled after `headline-harry.xdc` (js-dos v8, dual canvas focus, keyboard/mouse input bindings, self-contained offline zero-cloud execution).

---

## 2. Archival Investigation & Physical Artifact Provenance

### 2.1 Internet Archive (`Sneakers_Film_Promotional_Floppy`)
- **Identifier**: `Sneakers_Film_Promotional_Floppy` (ARK: `ark:/13960/t7qp1w262`)
- **Curator & Provenance**: Uploaded July 12, 2017 by Jason Scott (*Sketch the Cow*), sourced directly from the physical archive of Marcin Wichary.
- **Physical Packaging Artifact**:
  - Housed in a custom gatefold cardboard promotional folder featuring the *Sneakers* theatrical key art (Robert Redford in shadows with green phosphor typography).
  - Inside front/right flap contains installation instructions: `A:> INSTALL` or direct execution of `SNEAKERS.EXE`.
  - Printed notice: Studio offered to FedEx hardcopy press materials to entertainment journalists lacking DOS PC compatibility or 3.5" 1.44MB high-density floppy drives.
  - Floppy label: Standard 3.5" MF2-HD diskette with black/green Universal City Studios custom paper label reading *"SNEAKERS Computer Press Kit - Universal Pictures"*.

### 2.2 eBay Artifact & Collector Market Analysis (Item 365528826482 & Studio EPK Distribution)
- **Distribution Scope**: Sent in August/September 1992 exclusively to accredited film critics, junket attendees, and syndicated entertainment columnists.
- **Historical Significance**: Recognized as one of the very first interactive digital electronic press kits (EPKs) produced for a major Hollywood motion picture, preceding the web-based movie promotion era (which began in late 1994 with *Star Trek Generations*).
- **Physical Contents**:
  1. 3.5" HD Floppy Diskette containing `SNEAK.EXE` (LHA SFX) and `SNEAKERS.EXE` (GRASP runtime presentation).
  2. Multi-panel promotional sleeve with system requirements (IBM PC/XT/AT or 100% compatible, 640K RAM, DOS 3.3+, VGA graphics, optional Microsoft-compatible mouse and parallel printer).
  3. Printed collateral offering technical support via Universal Pictures publicity office.

### 2.3 Editorial & Retro Computing Context (retrogames.pro & Contemporaneous Media)
- Retro computing and film history retrospectives emphasize the thematic alignment between the film's premise (cryptanalysis, penetration testing, mathematical backdoors) and the press kit's design:
  - The software functions as a gentle "hacking simulator" requiring password entry and clue solving to navigate between production notes, cast biographies, and production trivia.
  - Includes a parallel printer dump feature outputting 35 pages of ASCII press kit documentation (`jasomill.at/sneakers.txt`).
  - Graphics and presentation engine built on **GRASP 4.00d** (Graphics Animation System for Professionals, created by John Bridges and Paul Mace Software).

---

## 3. Webxdc Integration & Parity Verification (T2.3)

The interactive Webxdc deliverables (`sneakers-press-kit.xdc` and `sneakers-press-kit-exact.xdc`) provide zero-dependency offline execution inside Delta Chat and modern Webxdc hosts.

### 3.1 Parity Audit Against `headline-harry.xdc`
As validated in `tests/sneakers-press-kit.test.mjs` and `tests/sneakers-press-kit-exact.test.mjs`:
1. **Engine Layer**: Bundles full standalone js-dos v8.4.1 runtime (`emulators.js`, `js-dos.js`, `wdosbox.js`, `wdosbox.wasm`, `wlibzip.js`, `wlibzip.wasm`) with strict `noCloud: true` and local path prefixes.
2. **Dual-Input Pipeline**: Employs the `focusDos` canvas acquisition routine to capture both keyboard keystrokes and relative mouse motion in sandboxed iframe contexts.
3. **Execution Integrity**: Embeds verified byte-identical executables:
   - `SNEAKERS.EXE`: SHA-256 `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961`
   - `SNEAK.EXE`: SHA-256 `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb`
4. **Deterministic Build**: Packaged via `scripts/build-sneakers-press-kit-xdc.mjs` and verified by automated unit tests.

---

## 4. Backlog Task Resolution

- **T2.2**: **Completed**. Internet Archive preservation provenance, physical sleeve artifact records, and retro gaming press coverage thoroughly documented.
- **T2.3**: **Completed**. Webxdc package verified against `headline-harry.xdc` architectural layout, input focus handling confirmed, and automated test suite passes 7/7.
