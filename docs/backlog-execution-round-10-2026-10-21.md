# Backlog execution round 10 — 21 Oct 2026

*Tenth round: the requester supplied a download-portal guide (Radmin VPN
mirrors, Jeopardy!/WoF editions, retro espionage games — with citations) plus
“Continue backlog”. Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md) ·
[8](backlog-execution-round-8-2026-10-21.md) · [9](backlog-execution-round-9-2026-10-21.md).*

## Delivered

| Artifact | What it closes |
| --- | --- |
| [`abandonware-download-portals-2026-10-21.md`](abandonware-download-portals-2026-10-21.md) | the requester's guide processed into the corpus with verification status: **Radmin.exe/VPN** obtainment hygiene (official radmin-vpn.com + radmin.com/download; Uptodown/Softpedia mirrors as-supplied; wrapper/redirect caution + polyglot-until-proven-innocent rule), **WoF editions** (1998 Hasbro/Artech ✅, Deluxe 2005 ✅ Dec 30 Sony Online, New Second Edition 1988 ✅), **spy-game index** (Covert Action ⚠️ re-sold on GOG; Floor 13 ✅; Spy Fox ⚠️ re-sold via Tommo), portal-safety consensus, **DOSBox quick-config + IPX-over-UDP LAN notes** (answers the guide's closing question both ways) |
| `tools/toy_mz_demo.mjs` + `tests/toy-mz-demo.test.mjs` | **backlog**: John/Ghidra open question 3 answered — a self-contained DOS MZ fixture (header + relocation + int 21h stub + RSRC string table) demonstrates loader/resource analysis without proprietary assets; 6 tests |
| [`game-show-ghidra-research-2026-10-21.md`](game-show-ghidra-research-2026-10-21.md) / [`radmin-and-smtp-research-2026-10-21.md`](radmin-and-smtp-research-2026-10-21.md) / [`john-ghidra-diablo-research.md`](john-ghidra-diablo-research.md) | cross-refs: round-10 annex pointer; VPN obtainment pointer; open question 3 marked answered |

## Verification notes

- The guide's WoF claims check out at lineage level: Hasbro Interactive era
  (1998–2001, Artech Digital; 2nd “red” edition 2000 with behind-the-scenes
  content), Sony Online *Deluxe* (Dec 30 2005), New Second Edition 1988
  (“more than a thousand new phrases”, DOSBox-supported on myabandonware).
  Size figures stay “as supplied”.
- Legal nuance logged where it matters: **Covert Action** and **Spy Fox** are
  commercially re-sold (GOG/Steam via Tommo/Retroism) — archival copies exist
  but “abandonware” is the wrong frame, mirroring the LucasArts note in the
  round-5 work.
- The closing question (“LAN group via Radmin VPN, or DOSBox config help?”) is
  answered as documentation in portal-guide §1/§4: Radmin VPN LAN = intended
  use with consenting machines; DOS IPX titles ride DOSBox `ipxnet` over the
  VPN's UDP. Automation stays gated (no DOSBox/Xvfb in sandbox).

## Test tally at round-10 close

| Suite | Result |
| --- | --- |
| `tests/toy-mz-demo.test.mjs` (new) | 6 PASS |
| `tests/polyglot-scan.test.mjs` | 8 PASS |
| earlier suites (cow-level 5, sierra 5, uhs 11, sync+sfx 3, round5 8) | unchanged, green |

## Next (round 11)

- ZIP legacy-garble note (S1 remainder) — last open S1 item.
- `polyglotScan` CyberChef op (registry add workflow: `POST_MERGE_OPS` 22→23,
  sfx `+22`→`+23`, header count).
- John test-vector regression wiring (open question 4 — the last one).
- Spotlight packs incl. TomTom-slash round-trip; HVD/Puzzle Code glyph tiles
  pending font terms.
- Gated: DOSBox sneakers smoke; Warrick relay runs.
