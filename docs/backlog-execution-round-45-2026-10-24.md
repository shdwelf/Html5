# Backlog execution — round 45 (2026-10-24)

**Stream:** S6 — ARPANET 1971/1977 time slices for the historical-network
viewer (the remaining S6 item from round 20; the bulk FidoNet layer stays
local-import-only under the standing rights decision).
**Branch:** `arena/3c1048e1-html5`, after merging PR #152 (and with it
#151, auto-marked merged by GitHub) and fast-forwarding to `main`.

## What shipped

The comms-history seed (`resources/historical-network/comms-history-seed-2026-10-23.json`,
regenerated into `js/historical-network-comms-data.js`) grows from the
1969 first four to dated cohorts, every node resting on a single
install-dated observation:

- **1970 cohort** (by June 1970): BBN, MIT, SDC, Harvard.
- **January 1971 cohort**: Stanford, MIT Lincoln Laboratory, Carnegie
  Mellon, Case Western Reserve.
- **April 1971 cohort**: RAND, University of Illinois (Urbana), NASA
  Ames (a TIP, per RFC 235) — completing the canonical **15-node, 23-host
  network** of Hobbes' Internet Timeline (RFC 2235), with host computers
  and network addresses from RFC 235's September 1971 site-status table.
- **1977-slice international cohort**: University of Hawaii (IMP
  installed 1972-12-17, ALOHA satellite link), SDAC Alexandria (US
  endpoint), NORSAR, Norway (first non-US node, 1973-06-15) and
  University College London (first packets 1973-07-25 via the terrestrial
  circuit from NORSAR). Two new logical-only edges trace the documented
  SDAC→NORSAR satellite path (via Tanum Earth Station) and NORSAR→UCL
  circuit; no route geometry is claimed, and not all 57 IMPs of 1977 are
  seeded — the slice records dated, cited additions only.

The viewer (`historical-network-viewer.html`) gains an **ARPANET time
slice** control for the comms pack: cumulative 1969 / 1971 / 1977 / All
buttons filter both the records table and the schematic by install date
(the pre-existing year slider keeps its per-year record semantics and
clears any slice). Other packs are untouched.

## Sources

Hobbes' Internet Timeline (RFC 2235) for the 15-node list; RFC 235 for
1971 hosts/addresses; NORSAR's institutional history and SATNET/UCL
records for the 1972–73 satellite dates — all citation-only snapshots in
the pack, per the round 17/18 rights decisions. Citations:
[1](https://www.zakon.org/robert/internet/timeline/) ·
[2](https://www.rfc-editor.org/info/rfc235/) ·
[3](https://www.norsar.no/about-us/history/)

## Verification

- Historical-network suites: 17/17 (`comms-seed` with new slice
  assertions — 4 nodes by 1969, 15 by 1971, 19 by 1977, all edges
  logical-only, no nodelist content; `packs` with new viewer-wiring
  assertions; validator clean, `captureReady` still false).
- Viewer inline module syntax-checked; full suite and wiki rebuild in
  the PR verification table.

## Next

S6's remainder is rights-gated (a lawfully redistributable nodelist
snapshot) or capture-gated (a second independent Keyhole listing).
Open fronts: S5 (live incident/camera layers), S2 (sneakers-press-kit
layout verification), S1/S7/S8 residuals needing binaries or hardware.
