# Backlog execution round 87 — snapshot-tarball fetch probe + chipwright restore (2026-10-29)

> Renumbered from a 2026-10-29 working title of "round 56": while this branch
> was in flight, main's round-56 slot was claimed by the 2026-11-04
> public-repository privacy-audit round, and the register advanced to round 86.
> This round is re-scoped to comply with that audit's doctrine — see the
> privacy posture section.

## Scope

The last open strand of the Drive reconciliation:
[`chipwright-restore-status-2026-10-22.md`](chipwright-restore-status-2026-10-22.md).
25 Chipwright workbench files exist only inside the 2026-09-27 snapshot
worktree tarball (`chipwright.html` and companions, hashes pinned in the
committed `docs/drive-sync/Html5-file-manifest-2026-09-27-12c463f.sha256`).
Every runner fetch has failed since 2026-10-09: the Drive anonymous endpoints
return quota 404s from datacenter IPs, and the standing shared-link override
forms were answered with rate-limit HTML pages ("Dropbox - Error - Simplify
your life"), as recorded in the pre-sanitization fetch log.

## What this round established (2026-10-29, connector-side)

Authorized-connector verification of the storage area (no identifiers
recorded here, per the privacy audit):

| Check | Result |
| --- | --- |
| Host file for the snapshot tarball | present — uploaded by the owner on 2026-10-23, i.e. the manual step the status doc asked for is done; byte count matches the queue's recorded expectation exactly |
| The standing shared link for it | live: public audience, download allowed, no password, no expiry — re-verified via the authorized connector |
| The Drive-side copy | still link-shared for readers, so the runner 404s are anonymous-download quota, not permissions |
| Connector temporary-link retrieval | rejected by the app (`not_allowed`) |
| Replacement expiring link (to reset the per-link rate counter) | refused — a link already exists and the API will not mint a second one |
| Actions-secret write | HTTP 403 for this integration — the secret route stays owner-only |
| Branch dispatch of the standing sync workflow (run 45581818003) | completed without committing: the runner repeated the committed failure pattern byte-for-byte, and CI logs are unreachable from the sandbox (log-endpoint EOF), so the committed fetch log is the diagnostic channel |

Net: every byte path into the sandbox is closed (egress allowlist; connector
tools cannot return a 33 MB binary), and the runner's existing override forms
are rate-limited. What this round ships is a **fetch-form probe** that runs on
the runner and, on a verified fetch, performs the restore.

## Privacy posture (shaped by the 2026-11-04 audit)

The 2026-11-04 public-repository privacy audit removed the user-specific
request/override/log files from the tree, ignore-ruled them against
re-addition, and stopped Drive reports from carrying identifiers, per-file
inventories, exact sizes and checksums. This round is built to that standard:

- The probe workflow contains **no fetch URL, no host identifier, and no
  share-link key**. Candidates are recovered at run time — from the
  `CHIPWRIGHT_TARBALL_URL` secret when set, otherwise from the
  pre-sanitization commit in git history (data that has been public in
  history all along; the audit records that a history purge is an owner
  decision).
- The committed probe log records **form names, HTTP codes, content types,
  byte counts, and a 16-character SHA-256 prefix only** (the prefix already
  published in the status doc), with query strings redacted by a final
  sweep.
- The restore re-hashes every file against the committed manifest — the
  same guarantee `drive-sync-apply` has always provided.
- No queue file is re-added; the commit step refuses payload and sanitized
  queue paths outright, mirroring the standing workflow's guard.

## The probe (post-merge, CI-committed)

[`arena-dropbox-probe.yml`](../.github/workflows/arena-dropbox-probe.yml) — a
temporary diagnostic workflow, dispatched after this PR merges (GitHub
resolves `workflow_dispatch` by filename on the default branch, so a
branch-only file cannot be dispatched). It:

1. recovers fetch candidates (secret, else history) and tries each override
   form, then the Drive anonymous endpoints, a share-page signature
   extraction, and `gdown`, logging every response by form name with
   redactions to `docs/drive-sync/dropbox-probe.log`;
2. verifies the bytes by size and SHA-256 (prefix against the status doc's
   published run-1 value);
3. on success runs the already-fixed restore —
   `node scripts/drive-sync-apply.mjs --manifest
   docs/drive-sync/Html5-file-manifest-2026-09-27-12c463f.sha256 --snapshot
   <root> --write` — which re-hashes every restored file and tees to
   `docs/drive-sync/restore-12c463f.log`;
4. appends a resolution note to the status doc and commits the restored
   files plus the redacted logs (never the gitignored payload);
5. on total failure, still commits the redacted log, so no attempt can fail
   silently.

Outcome records land on `main` in `docs/drive-sync/dropbox-probe.log` and
`docs/drive-sync/restore-12c463f.log`; the follow-up check is
`node scripts/drive-sync-audit.mjs`.

## Stream state after this round

- **S1/S2 (chipwright strand of the Drive reconciliation):** every
  connector-side and sandbox-side blocker is discharged; the restore rides
  the post-merge probe run.
- **Drive queue remainders, unchanged and still owner-gated:** the snapshot
  manifests remain reconciled under `docs/drive-sync/`; the APK triage
  requests were retired from the tree by the privacy audit and remain a
  manual-step item if ever revived.
- **S5 snapshots / S6-S9 hardware- and rights-gated remainders / S10 Ghidra
  DTSearch:** untouched, runner work per round 55.

## Verification (this commit)

- Connector metadata calls recorded above (2026-10-29).
- Wiki rebuilt with this document — the build's privacy preflight (added by
  the 2026-11-04 audit round) passes on it;
  `node --test tests/wikiinajar.test.mjs tests/wikiinajar-docs-sync.test.mjs`
  green (25/25).
- `node scripts/drive-sync-audit.mjs` re-run at this commit: passes — the
  sanitized ledger carries no checkable entries by design, so the only
  meaningful post-restore checks are the probe's own manifest re-hash and
  the restored files' presence.

## Probe outcome (CI run 45587347179)

The probe (post-merge, redacted log committed as
`docs/drive-sync/dropbox-probe.log`) answered the open question
definitively: **no server-side fetch form can work.** Every override form of
the shared link returned the host's web-app HTML instead of bytes (231 KB
`maestro` pages), the alternate content host 404'd, the anonymous Drive
endpoints are still quota-404, `gdown` failed, and the share page carries no
URL-style signature parameter to extract. The decisive cross-check: the
platform-side page fetcher — a completely different network path — receives
the identical "error" page, while the authorized-connector metadata still
reports the link as live, public, and downloadable. That combination means
the host is blocking **datacenter IP ranges**, not the link, the form, or
the credentials: a valid public link that no server-side fetcher may
download.

## Completion path (release-asset route, one owner step)

Following the PR-184 retrieval doctrine (owner bridges the network gap with
a browser step; CI does the rest), the round ships
[`chipwright-restore.yml`](../.github/workflows/chipwright-restore.yml):

1. **Owner (browser, ~2 minutes):** download
   `Html5-worktree-2026-09-27-12c463f.tar.gz` from the storage area and
   attach it to a GitHub release tagged `chipwright-snapshot-12c463f`
   (Releases → draft → drag the file in → publish).
2. **Agent/CI:** dispatch `chipwright-restore`. The workflow downloads the
   release asset (repo-internal URL — no external host, no identifiers),
   verifies the SHA-256 against the prefix published in the status doc,
   extracts the snapshot, locates its root via `chipwright.html`, restores
   the missing files with `scripts/drive-sync-apply.mjs` (re-hashing each
   against the committed manifest), and commits them plus the apply log.

Until the owner step is done, the chipwright strand stays at
"everything staged, one browser upload pending" — the same terminal state
the PR-184 APK retrieval record documents.
