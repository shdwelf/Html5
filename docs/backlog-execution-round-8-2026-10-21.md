# Backlog execution round 8 — 21 Oct 2026

*Eighth round: the requester's queue — “search archive.org for jeopardy wheel of
fortune abandonware ghirdra both and disassemble investigate · snopes.com deep
dive · and continue backlog · search github for smtp port for other than mail ·
disassemble radmin”. Rounds: [1](backlog-execution-round-1-2026-10-21.md) ·
[2](backlog-execution-round-2-2026-10-21.md) · [3](backlog-execution-round-3-2026-10-21.md) ·
[4](backlog-execution-round-4-2026-10-21.md) · [5](backlog-execution-round-5-2026-10-21.md) ·
[6](backlog-execution-round-6-2026-10-21.md) · [7](backlog-execution-round-7-2026-10-21.md).*

## Delivered

| Artifact | What it closes |
| --- | --- |
| [`game-show-ghidra-research-2026-10-21.md`](game-show-ghidra-research-2026-10-21.md) | **Jeopardy! + Wheel of Fortune** corpus: 10 archive.org items pinned (1987 ShareData → 1994 Win3.x Deluxe; GameTek Chapter 11 1998), RE targets = puzzle/question DB formats + answer-validation + state machines, Ghidra plan |
| [`snopes-game-show-forensics-2026-10-21.md`](snopes-game-show-forensics-2026-10-21.md) | **Snopes deep dive**: the “Clam Digger” fake (Santoli's source-episode reconstruction of the Dec 8 2009 broadcast), the crypto-parody “Bitcoin” fake (font tells), the 2015 “_UCK _E…” board fake (letter-fill logic) + a techniques table mapped onto the binary-side workflow |
| [`radmin-and-smtp-research-2026-10-21.md`](radmin-and-smtp-research-2026-10-21.md) | **Radmin disassembly notes** (IANA 4899, nmap handshake bytes, v2.x MD5/Twofish-era claims, v3.x DH-2048/AES-256 claims, Shadowserver 36k-host census, 6 GitHub RE sources incl. the `.RPB` format + synacktiv's v3 auth research) + **SMTP non-mail ports** (service identification 25/465/587, SMTP smuggling CVE-2023-51764 + USENIX '25 detection work, open-relay ecosystem catalog) |

## Notes

- **Game-show RE thesis:** these games are unusually honest targets — the
  puzzle/question databases are the product, so formats are plain and the only
  interesting code is answer validation and the spin/solve state machines.
  The Snopes material is the media side of the same data: an extracted puzzle
  DB is exactly the reference that adjudicates viral “episode puzzle” fakes.
- **Radmin thesis:** a legitimate admin tool whose fixed byte-level handshake
  (`01 00 00 00 25`) and vendor crypto claims make it a clean Ghidra
  case-study; the defensive value is claim-verification + detection (Nessus
  11123, Shadowserver census), not attack tooling. The encyclopedia's existing
  boundary paragraph stands and is deepened, not weakened.
- **SMTP thesis:** “other than mail” = (a) non-mail services wearing 25/465/587,
  (b) smuggling (channel used to move non-mail-shaped streams past gateways),
  (c) open-relay abuse infrastructure. The defensive half (Suricata/Zeek rules,
  tarpits, relay lockdown) is the study path.
- All F3/F4 boundaries held: links and provenance only for archive.org items;
  no cracking/brute-force/scan/smuggle procedures reproduced.

## Test tally at round-8 close

Docs-only round (plus GitHub search tooling); no registry/tool changes — the
round-7 suites remain green (`cow-level-xgrep` 5, `sierra-xgrep` 5, uhs 11,
recipe-sync+sfx 3, round5-ops 8).

## Next (round 9)

- Carry over round-8 backlog items not on this queue: toy-binary loader demo,
  John test-vector regression, `--spotlights` pack batches, ZIP legacy-garble note.
- On user-supplied specimens: Jeopardy/WoF puzzle-DB extraction + Ghidra
  validation-logic pass; Radmin handshake/crypto claim verification.
- Gated: DOSBox sneakers smoke; Warrick relay runs.
