# The fake Changelly "dev panel" and node v3.27 — investigation

*2026-10-23 · continuation of [`changelly-drainer-analysis.md`](changelly-drainer-analysis.md) ·
static analysis only; nothing executed.*

The "dev panel" is the user-facing half of the Changelly drainer's second
stage: a fake in-page overlay (`#__changelly_mod_overlay`, title bar
`changelly-node-loader — dev mode`, footer `changelly-node-loader v1.0.4 —
internal use only`) whose job is to make the victim personally activate the
transaction hijack by "loading node v3.27". There is no Changelly dev panel
and no public node-version line behind it; every public mention of
"node v3.27" traces to the lure campaign itself (forum threads on
forocoin.net / bitco.in through October 2026, all pointing at Google Docs
copies of the same "exploit" document).

## Version theatre

The panel offers four versions. Exactly one transition is real:

| Version | Label in panel | Status before activation | Clickable? | After activation |
| --- | --- | --- | --- | --- |
| 3.28 | `v3.28 (Stable)` — "Latest stable release. Currently loaded on this node." | `loaded` | no | `ready` |
| **3.27** | `v3.27` — "Older version. Known issues: Price errors during exchanges." | `ready` | **yes — the only selectable row** | `loaded` |
| 3.26 | `v3.26` — "Missing critical patches." | `outdated` | no (row shakes) | `outdated` |
| 3.25 | `v3.25` — "Incompatible with current API." | `outdated` | no (row shakes) | `outdated` |

The descriptions do the steering: 3.28 is framed as the safe present, 3.27's
"price errors" are precisely the bug the lure promises to exploit, and
3.26/3.25 exist only to make 3.27 look like the sweet spot in a real version
history. Selecting anything else is impossible by construction — disabled
rows respond with a shake animation, not a selection.

## The gate, in order

Clicking **Load version** (`#__cm_confirm`) runs four checks, in this order:

1. already active → `Dev panel is already loaded in this window. Cannot load again.`
2. nothing selected → `Please select a version to load.`
3. password field (`#__cm_password`) ≠ `admin` → `Invalid access key. Please try again.`
4. selected version ≠ `3.27` → `Selected version cannot be loaded right now.`

So the cover document's two magic values — password `admin`, version 3.27 —
are not flavour text; they are the literal comparison constants
(`_0x286562 = "admin"`, `_0x31bcc4 = "3.27"`) in the second stage. The lure
has to teach both because the panel refuses any other combination.

On success the panel plays a six-step progress script at 420 ms per step
(≈2.5 s total) —

```text
Validating access key…
Fetching node v3.27 manifest…
Downloading modules…
Applying patches…
Booting exchange engine…
Ready.
```

— then sets the active flag, starts the hijack (`window.fetch` override,
DOM patching), and fades the overlay out over 200 ms. Nothing is fetched
during those 2.5 s; the sequence is pure theatre timed to feel like work.

## Persistence and the missing off switch

- **Singleton.** The payload installs `window.__changelly_mod_loader_instance`
  (with `showAlreadyLoaded()`, `active`, `loadedVersion`). Running the loader
  a second time does not re-inject; it re-displays the panel with the
  "already loaded" error. One page, one panel, one activation.
- **Before activation, the panel is only a panel.** Cancel (`#__cm_cancel`)
  or the ✕ (`#__cm_close_btn`) simply removes the overlay; the fetch
  override is not installed until the progress sequence completes. A victim
  who closes it at this point has a clean page (the second stage has run,
  but it has not yet hooked anything).
- **After activation there is no user-facing way back.** The code contains a
  complete teardown — restores the original `fetch`, disconnects the
  MutationObserver, clears both intervals, un-hides elements, removes the
  boost markers — but it is **defined and never wired to any control**. The
  hijack therefore persists for the life of the page; only a reload removes
  it. A defensive teardown that exists but is unreachable is a useful
  fingerprint of the kit's priorities.

## Variant comparison — one kit, many dead drops

An independent static analysis published 2026-10-08
([victormeloasm/anotherbitcoinmalware](https://github.com/victormeloasm/anotherbitcoinmalware))
describes the same panel from a different sample. Side by side:

| Property | This repository's sample | Independent sample |
| --- | --- | --- |
| Lure Doc | `1luBwx1iBXdVbJu0AIvQabgWyz0NJ5dmJBtKoabJBr9I` ("API Script") | `1U8SdRHG8S4vIcHSvVZpvBNY-WFi-wUBNZdxwr_ciD34` |
| Payload Sheet | `15ZXXqVaJrRoojcBDbApNfHP_n6z5sLlFLNhdLNJd5PM` | `1YZHU4KyeoFD3L-qtvd9mMj8kWdFCeKgiXSKUo3ZLvpU` |
| Payload SHA-256 | `1646bf13…82afb` | `13ff3c41…9aa` |
| Payload size | 75,791 B | 75,878 B |
| Panel versions | 3.28 / **3.27** / 3.26 / 3.25 | 3.28 / **3.27** / 3.26 / 3.25 |
| Access key | `admin` | `admin` |
| Boost factor | **1.55** | **1.5** |
| Minimum | $200 (`0xc8`) | $200 (`0xc8`) |
| Wallets | 20 BTC + ETH/SOL/LTC/XMR set A | ~20 BTC + ETH/SOL/LTC/XMR set B (disjoint) |
| Panel strings/selectors | `__changelly_mod_overlay`, `__cm_*`, `payment-qr-code-modal`, … | identical set |

Same builder, same panel, same gate constants; per-instance dead drops,
wallet sets, and a tweaked boost factor. Forum lure threads additionally
reference at least two further Doc copies (`1Cz5fHkwyaApTWwqfgBBtpvConU8Lo_qJ9xtn7RazWpk`,
`1WhlQi8xpq819kqTE2nXcZTAeCgQ5m-ic2pm_7IZVt7w`), so the campaign treats the
Google Doc/Sheet pair as disposable per-channel infrastructure. Any
detection or takedown keyed to a single Doc, Sheet, wallet, or payload hash
will miss the next instance; the durable fingerprints are the panel's DOM
ids/classes, the `node`/`path` gviz pattern, and the gate constants.

## Panel fingerprints (for detection)

- DOM ids: `__changelly_mod_overlay`, `#__cm_window`, `#__cm_versions`,
  `#__cm_password`, `#__cm_confirm`, `#__cm_cancel`, `#__cm_close_btn`,
  `#__cm_progress`, `#__cm_progress_text`, `#__cm_error`, `#__cm_already`
- Window globals: `__changelly_mod_loader_instance`,
  `__changelly_mod_instance_active`
- Literal strings: `changelly-node-loader — dev mode`,
  `changelly-node-loader v1.0.4 — internal use only`,
  `Fetching node v3.27 manifest…`, `Selected version cannot be loaded right now.`
- Behavioural: a fixed-position overlay at `z-index: 2147483647` with a
  version list whose only selectable row is `3.27`, appearing immediately
  after a `javascript:` self-XSS execution on an exchange page.

## Preservation

The panel's code and strings are preserved inside the second-stage sample in
the BagIt bag (`data/original/second-stage-payload.txt`, gitignored `dist/`
only); the gate constants, version matrix, progress script, and this
comparison are recorded in
[`changelly-drainer-analysis.md`](changelly-drainer-analysis.md), the bag's
`second-stage-iocs.json` (`behaviourOnReviewedSample.devPanel`), and the
Xena-wrapped serialization described there. The independent sample was used
for comparison only — its payload was not downloaded, and its wallets are
recorded here as campaign IOCs, not merged into this sample's IOC set.
