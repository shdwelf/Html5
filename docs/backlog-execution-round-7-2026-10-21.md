# Backlog execution round 7 — 21 Oct 2026

*Seventh round against [`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md) +
the requester's added queue (“continue ghirdra · GFI LANguard Network Security
Scanner · don't forget Diablo.iso from archive.org — investigate the secret cow
level”). Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md).*

## Delivered

| Artifact | What it closes |
| --- | --- |
| [`john-ghidra-diablo-research.md`](john-ghidra-diablo-research.md) (extended) | **Corpus question answered** (Diablo 1 retail ISO = `archive.org/details/diablo.iso`, ark `t81k76897`, + the 2013/2020 preservation alternates + Hellfire companion) and the **Secret Cow Level investigation** written: published record, Ghidra/MPQ method, expected finding |
| `tools/cow_level_xgrep.mjs` + `tests/cow-level-xgrep.test.mjs` | the binary-side sweep: 10 sourced needles + `profileReport()` verdicts (D1 = interaction-without-level profile; D2/Hellfire/StarCraft content classed apart) |
| [`gfi-languard-nss-research.md`](gfi-languard-nss-research.md) | **GFI LANguard NSS** research note: freeware→commercial timeline (2000 Tucows item → NSS 3.3/8/9/11/12.x), feature set from GFI's own hosted manuals/reviews, Ghidra-triage plan, authorized-use boundary |

## The cow-level question, in one paragraph

The legend (click the Tristram cows until a portal opens) is **an interaction
without a level**: retail Diablo 1 has real cow-click character one-liners
(“Yup, that's a cow all right!”, “I am not thirsty!”), the purported level
screenshots were Photoshopped from unused assets, and Blizzard's own Arreat
Summit page states *“There was, of course, no Cow Level in Diablo, but the
legend was born.”* The joke cascade is fully documented: Hellfire hid a
cow-suited NPC quest behind `command.txt`, StarCraft shipped the denial cheat
`there is no cow level`, and Diablo II built the real Moo Moo Farm (Hell
Bovines, Cow King, Wirt's Leg + Tome of Town Portal) after the 1 April 1999
April-Fools screenshot. The tooling checks this against a user-supplied ISO
extract: click-dialogue hits + zero cow-level hits = the documented profile;
any cow-level hit in a D1 corpus is a *finding* (non-retail build), not a cheat.

## F3/F4 boundaries respected

- The ISO itself stays **user-supplied/relay** — archive.org item pages are
  captured as provenance (identifiers, file names, sizes), nothing downloaded
  here; no game assets are redistributed by the repo.
- The GFI LANguard note is authorized-use research only: no scanning or patch
  procedures for third-party networks, no deployment bypasses.
- John/Ghidra house rules from the research doc apply unchanged.

## Test tally at round-7 close

| Suite | Result |
| --- | --- |
| `tests/cow-level-xgrep.test.mjs` | 5 PASS |
| round-6 suites (sierra-xgrep, recipe-sync, sfx, round5 ops, uhs) | unchanged, green |

## Next (round 8)

- Toy-binary loader/resource demo (open question 3 in the John/Ghidra notes) so
  the same triage techniques run on redistributable fixtures.
- John test-vector regression wiring (open question 4).
- More `--spotlights` pack batches (round-6 remainder), ZIP legacy-garble note.
- On user-supplied ISO: run `tools/cow_level_xgrep.mjs` + Ghidra headless pass
  per the investigation recipe and file the result back into the research doc.
- Gated: DOSBox sneakers smoke; Warrick relay runs.
