# Backlog execution round 55 — S1 Drive-Doc BagIt preservation (2026-10-25)

## Scope

Close the last open S1 next-action from
[`agent-backlog-2026-10-21.md`](agent-backlog-2026-10-21.md): *"BagIt the
Google Doc `1luBwx1iBXdVbJu0AIvQabgWyz0NJ5dmJBtKoabJBr9I` together with its
Drive PDF once relay fetch is available (task line 16/153)."* The Drive
connector is now the sanctioned fetch path (F3: the user's own Drive via the
authorized connector), so the relay wait is over.

## What the Doc is

`files.get` on 2026-10-25: **"API Script"**, `application/vnd.google-apps.document`,
1,299 B (Drive-native size), modified 2026-10-08T18:32:17Z. Its text export
(725 B) is the **Changelly stage-1 loader** already analyzed under S14
([`changelly-drainer-analysis.md`](changelly-drainer-analysis.md)): an
IIFE that fetches a `docs.google.com` spreadsheet dead drop and injects the
returned `node`/`path` rows as a script element. Per the standing Changelly
rule the sample is preserved **inert and unexecuted**; committed records
reference hashes only and never reproduce payload text.

## Preservation (BagIt 1.0, gitignored `dist/`)

Bag: `dist/api-script-loader-bag/` — `BAG MANIFEST VALID` on re-check.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `data/api-script.txt` | 725 | `d1fc09826ca73acd127a29ece4989050d2b9faec3a33fcaf6588974ebe9ab96a` |
| `data/api-script.pdf` | 36,221 | `1e3412dbbb0412c52118b9820fba44807ef3e8650d21bec49917acdf4265a2f0` |
| `data/doc-metadata.json` | 1,061 | `b5ae6907746b0cfac0e53a932834ff43a85525f206151fd0fb9591a3c1a22cb6` |

Notes on the "Drive PDF": a name search (`name contains 'API Script'`)
returns only the Doc itself — **no Drive-native PDF companion exists** under
that name. The bagged PDF is therefore a fresh `application/pdf` export of
the Doc (a rendering), labelled as such in `doc-metadata.json`; it is not
represented as an original artifact. Xena normalization is not applicable
beyond this: the payload is a Google-native document with text/PDF exports,
and the executable content stays inert by policy (F2/F4-adjacent; S14
handling governs).

## Stream state after this round

- **S1**: the BagIt next-action is **closed**. S1's remaining strand is the
  Ghidra-side decompressor work, still blocked on a sandbox JVM (runner
  work), so the stream stays *partial* in the markdown register.
- Untouched and still gated: S5 static snapshots (KiwiSDR/fire lookouts —
  the `rx.kiwisdr.com` probe returned HTTP 500 on 2026-10-25; runner capture
  remains the path), S6/S7/S8/S9 hardware- and rights-gated remainders,
  S10's Ghidra DTSearch (runner).

## Verification

- Drive `files.get` + name search + two exports via the authorized
  connector (2026-10-25).
- BagIt manifest re-computed after assembly: `BAG MANIFEST VALID`;
  `git check-ignore` confirms the bag stays out of Git.
- Wiki rebuilt (`node scripts/build-wikiinajar-xdc.mjs`); wiki suites
  `node --test tests/wikiinajar.test.mjs tests/wikiinajar-docs-sync.test.mjs`
  green (see commit message for counts).
