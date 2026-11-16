# Backlog execution — round 75 (2026-11-15)

## Keyspace Viewer: every word count above 24, up to the ceiling

The request was to let the Keyspace Viewer handle word counts beyond 24 — all
valid counts up to the maximum. The maths already did: `js/bip39.js`
generalises BIP-39's `CS = ENT/32` to *the largest `c ≤ 11` with `11n − c`
byte-aligned*, which closes `11n = ENT + CS` for every integer `n` from 2 to
512 with no gaps (CS runs over 4…11 and hits 11 every 8 words: 9, 17, 25,
33, …). What was missing was the page.

### What had happened to the page

`keyspace.html` / `js/viewer.js` on `main` only exposed the 12/15/18/21/24
ladder. Reading the GitHub history explains why: commit `cbbfddc`
(2026-08-31) added the generalised length menu, the invert-keyspace A↔B
block (§11) and the formal-system lens rack (§12), but the September work
(seed haiku `dc68153`, wallet derivatives `bcd4490`, top-50 coins `171ff40`,
statistics `31f0011`) was built on an older copy of the page and its merge
took that copy. `js/formal.js`, `js/lens-draw.js`, `js/lens-3d.js`,
`KEYSPACE.md` and suites 02–07 kept describing the layered viewer;
`tests/run.sh` had demoted suites 05 and 07 to "KNOWN-STALE, non-gating".

### What this round did

- **Three-way re-merge** of `keyspace.html`, `js/viewer.js` and
  `css/viewer.css` against their common base (`c4bb919`, the parent of
  `cbbfddc`): the layered page returns with §6 statistics, §13 seed haiku and
  §14 wallet derivatives kept. Seven conflict hunks, all "keep both".
- **Length menu lists every count.** `buildWordCountMenu()` rebuilds `#wc` at
  boot: the five ladder entries, then *all* generalised counts 25…512 (each
  labelled `n words · ENT-bit ENT · CS c` straight from `layoutForWords`, so
  the labels cannot drift from the rule), then the custom row (word count
  2–512 or an exact ENT bit length). `MIN_WORDS` / `MAX_WORDS` /
  `STANDARD_WORDS` / `allLayouts()` are now exported from `js/bip39.js` and
  used for every bound and message. 512 words = 5624-bit ENT + 8 CS =
  5632 bits (703 bytes) is the ceiling: the identity is unbounded, the UI
  stops where phrases still fit the WASM engine's index/path buffers and a
  full ∂Φ flip sweep stays interactive (1.3 s for all 5624 bits in headless
  Chromium).
- **Long-phrase rendering.** The parallel-coordinates plot thins its axis
  guides past 64 words and shrinks the markers past 48/128 words so a
  512-word phrase stays a readable polyline; the checksum fibre canvas
  already grows to 2048 cells for CS = 11.
- **Wallet gate unchanged.** `deriveWallet` / top-50 derivation still refuse
  anything that is not a standard 12/15/18/21/24-word phrase
  (`docs/wallet-card-deltas-2026-10-23.md`), now asserted in both DOM suites.
- `sh tools/pack_keyspace.sh` regenerated `public/apps/keyspace/` and
  `keyspace.xdc`; `tests/run.sh` gates suites 05 and 07 again; `KEYSPACE.md`
  renumbered (§11 invert, §12 lenses, §13 haiku, §14 wallet), corrected to the
  72 lenses `js/formal.js` actually registers, and its "suite 05 is stale"
  note rewritten as history.

### Verification

| check | result |
| --- | --- |
| `node tests/01-layout.mjs` | 91/91 — adds: all 511 layouts close `11n = ENT + CS`, byte-aligned, CS ∈ 4…11, `layoutForEntropyBits` inverts `layoutForWords` for all 511, `standard` is exactly the ladder, 512-word ceiling, 513 / ENT 5632 rejected, `randomMnemonic(26/100/512)` round trips |
| `node --import ./tests/stubs/register.mjs tests/05-viewer-dom.mjs` (jsdom) | 62/62 — the real `js/viewer.js` booted: menu has 488 contiguous entries 25…512, 512-word generate (chips, 512 tape rows, 512 hole plates, 1406 hex nibbles, `flipBit.max` 5623), wallet refusal, custom 40 words, 513 rejected, no uncaught errors |
| `node tests/07-browser.mjs` (headless Chromium + SwiftShader, real WebGL) | 30/30, 0 console/network errors — 512-word generate in 651 ms, stage still rasterises (611,722 lit px), wallet refuses |
| `node tests/02-lens-math.mjs` / `03-lens-draw.mjs` / `04-lens-3d.mjs` / `06-extreme.mjs` / `16-key-stats.mjs` | 148 / 140 / 20 / 151 / all pass |
| `node tools/check-dom-ids.mjs --html keyspace.html --js js/viewer.js` | all 111 controller ids exist in the markup |
| `node --test tests/webxdc-packages.test.mjs` | 16/16 — `keyspace.xdc` matches `keyspace.html` and the staged `public/apps/keyspace/` tree byte for byte |

Ad-hoc, in the same browser: focusing the differential lens on a 512-word
key probes 5624 bits — 5598/5624 flips move the checksum word, max change
2 words, histogram 1→29 / 2→5595 — consistent with an 8-bit checksum
(≈ 1/256 of flips leave the checksum byte unchanged, 22 expected, 26 seen).

## OnlyKey web apps (`apps.crp.to`, `?version=beta7`, `apps.onlykey.io`)

Written up in
[`onlykey-webapp-releases-2026-11-15.md`](onlykey-webapp-releases-2026-11-15.md).
Short form: `apps.crp.to` is Webcrypt 3.0.0 for firmware ≤ v3.0.4 (its
`/app/past_releases` plugin fetches a static `past_releases.json` and
`?version=beta7` is a 200 ms JavaScript redirect to the archived U2F-only
`past_releases/beta7/` build for firmware `v0.2-beta.7`, hence the "Loading…"
shell without JS); `apps.onlykey.io` is Webcrypt 4.0.0 (Sep 2026) for newer
firmware, with PQC age (X-Wing / `mlkem768x25519`) and composite PGP keys and
transit encryption v2; a `version-route` plugin on `apps.crp.to` bounces
newer keys across after reading `FWversion` from the handshake. Both
repositories are Apache-2.0 and the archived builds are static directories.

## Backlog state after this round

- Done here: keyspace word counts above 24 (all of 25…512); OnlyKey web-app
  investigation.
- Still open from the S-register: LCS35 alternate source, FHE + time-based
  auth write-up (`node-seal` demo), GitHub 2FA-routine search,
  FindCrypt-DB-vs-recipes cross-check.
