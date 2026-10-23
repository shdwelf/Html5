# T3.1 remaining strands: Game Wizard, UHS, Sierra — status 2026-10-23

The four Game Genie variants (NES, SNES, Game Boy/Game Gear, Genesis) are now
CyberChef ops (`gameGenieNes`, `gameGenieSnes`, `gameGenieGb`,
`gameGenieGenesis`; `tests/cyberchef-game-genie.test.mjs`, 7/7, each anchored
to a published worked example). What remains in T3.1 is three unlike things:

## Game Wizard (DOS) — a live-memory tool, not a code format
- Game Wizard (v2.3 shareware; Game Wizard 32 Pro 3.0) by Ray Hsu and
  Gerald Ryckman / Enhanced Software Design (1994): a DOS TSR you pop up
  mid-game to search memory for lives/ammo/money, then modify or *lock*
  values, save cheat "tables", and even snapshot a game in progress.
  Because it patches live RAM, there is no Game-Genie-style encoded-string
  format to decode; its artefacts are the `.GW`-style tables and the
  reference guide's search methodology (exact-value, then changed/unchanged
  differential passes — the direct ancestor of Cheat Engine's workflow).
- Preservation state: shareware builds are on the Internet Archive
  (`GameWizard`, `game-wizard-32-pro-30-a-dfi`); it runs under DOSBox with
  documented caveats (memory-state save/load does not work there because
  DOSBox lacks the internal DOS structures it snapshots; cheat tables and
  memory search do work). GW32Pro also binds an install-time BIOS checksum
  (copy protection), which breaks it after BIOS changes.
- Feasible local artifact, if wanted: a CyberChef op is the *wrong* shape.
  The right shapes are (a) a js-dos packaged GW + a bundled DOS game table
  demo, paralleling T2.3's press-kit work, or (b) documenting the table
  format from a captured shareware install. Both need the actual binary in
  the repo pipeline (archive.org fetch runner pattern), so this strand is
  recorded as *researched, not built*.

## UHS (Universal Hint System) — documented formats, open readers exist
- UHS (Jason Strautman, 1988) delivers graduated hints without spoilers:
  a tree of questions revealing progressively stronger hint text. Formats:
  **UHS88a** (line-based, CRLF, 4-line header, then a link tree and a hint
  list; line numbers in the file are relative to after the header) and the
  1991+ **91a/96a** "hunk" formats (typed hunks, embedded PNG hints with
  hotspots, obfuscated strings, trailing 16-bit CRC).
- Readers: official readers remain proprietary shareware (Windows/Mac);
  **OpenUHS** (Java, GPL, since 2006) covers all formats, and there is a
  pure-Python port (`Tormen/my-uhs`). The format spec used above is the
  long-standing public documentation (Stefan Wolff's UHS page).
- Feasible local artifact: a small **UHS88a reader** (parser + progressive
  reveal UI) is buildable from the published spec with synthetic fixtures,
  mirroring the dual-shuffle pattern. 91a/96a should be read via OpenUHS
  rather than re-implemented blind. Recorded as *researched; UHS88a reader
  is the identified next build*.

## Sierra Easter eggs / walkthroughs — content work, sources identified
- The Sierra Help Pages (sierrahelp.com) already curate cheat essentials,
  eggs and walkthroughs per title, and the Sierra Wiki documents UHS and
  the interpreters. A sweep here is *curation* (per-game egg lists against
  the DOS disassembly line, e.g. `spycraft-research.md`), not a format or
  tooling problem; nothing to decode or verify programmatically. It stays
  open as editorial work alongside the existing disassembly docs.

## Bottom line for T3.1
Encoded-cheat formats: **done** (four Game Genie ops, known-answer tested).
Game Wizard: researched; next artifact needs the shareware binary via the
fetch-runner channel. UHS: researched; UHS88a reader is buildable on demand.
Sierra sweep: editorial, sources identified. T3.1 stays *partial* on those
three strands only.
