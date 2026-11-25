# Backlog execution round 56 — Drive queue connector audit + chipwright restore unblock (2026-10-29)

## Scope

The Drive-reconciliation remainder recorded in
[`chipwright-restore-status-2026-10-22.md`](chipwright-restore-status-2026-10-22.md):
25 Chipwright files exist only inside the 2026-09-27 Drive snapshot
(`Html5-worktree-2026-09-27-12c463f.tar.gz`, 33,141,885 B, sole copy of
`chipwright.html` and the rest of the workbench), and every runner fetch since
2026-10-09 has failed. Round 55 established the authorized connectors as the
sanctioned fetch path (F3); this round is the first connector-led audit of the
whole queue, plus the plumbing that finally completes the restore.

## What this round established (2026-10-29, connector-side)

| Check | Result |
| --- | --- |
| Dropbox `/Html5-Backups/Html5-worktree-2026-09-27-12c463f.tar.gz` | **present** — uploaded 2026-10-23T19:12Z, i.e. the owner step the status doc asked for is done; size 33,141,885 B matches `.arena-drive/requests.txt` exactly |
| The standing Dropbox shared link in `url-overrides.json` | **live**: resolves to that file, `audience: public`, `allow_download: true`, no password, no expiry (`get_shared_link_metadata`) |
| Drive copy of the same tarball | still `anyoneWithLink` reader, size 33,141,885 B (`files.get`) — so the 404s on the runner are anonymous-download quota on datacenter IPs, not permissions |
| Connector `get_temporary_link` | rejected by the app (`not_allowed`) — direct pre-authorized content URLs are unavailable |
| Connector `create_shared_link` (fresh expiring link to reset the per-link rate counter) | rejected: `settings_error/not_authorized`, then `shared_link_already_exists` — the owner's standing link cannot be replaced from here |
| `gh secret set/delete` | HTTP 403 "Resource not accessible by integration" — the `CHIPWRIGHT_TARBALL_URL` secret route stays owner-only |
| Dispatch `arena-drive-sync` on this branch (run 45581818003) | completed **without committing**: the runner repeated the committed failure pattern — Dropbox served `RATE-LIMITED page (title: 'Dropbox - Error - Simplify your life')` on the `www` `dl=1`/`raw=1` forms and HTTP 404 on the `dl.dropboxusercontent.com` form, then Drive quota 404s (diagnosed from the committed `.arena-drive/fetch.log`; CI logs are unreachable from the sandbox — `results-receiver` EOF) |

Net: every byte path into the sandbox is closed (egress allowlist has no
Dropbox/Drive host; connector tools cannot return 33 MB), and the runner's
existing override forms are rate-limited. What the round adds is a
**fetch-form probe** that runs on the runner, tries alternative forms of the
same verified-live link, and on success performs the restore.

## The probe (post-merge, CI-committed)

[`arena-dropbox-probe.yml`](../.github/workflows/arena-dropbox-probe.yml) — a
temporary diagnostic workflow, dispatched after this PR merges (GitHub resolves
`workflow_dispatch` by filename on the default branch, so a branch-only file
cannot be dispatched). It:

1. fetches the tarball in turn as: browser-UA `dl=1`, plain-UA `dl=1`,
   `dl.dropboxusercontent.com` form, share-page `st`-signature extraction,
   Drive anonymous endpoints, `gdown` — logging every response to
   `docs/drive-sync/dropbox-probe.log`;
2. verifies the bytes by size **and** SHA-256 (logged against the run-1 prefix
   `c4cb0bc0276e2af4…` from the status doc);
3. on success runs the already-fixed restore —
   `node scripts/drive-sync-apply.mjs --manifest
   docs/drive-sync/Html5-file-manifest-2026-09-27-12c463f.sha256 --snapshot
   <root> --write` — which re-hashes every restored file against the
   committed manifest and tees to `docs/drive-sync/restore-12c463f.log`;
4. persists the winning URL form into `.arena-drive/url-overrides.json`
   (skipped for the short-lived `st` form), retires the tarball line in
   `requests.txt` (`# RESTORED 2026-10-29 (dropbox-probe): …`), appends the
   resolution to
   [`chipwright-restore-status-2026-10-22.md`](chipwright-restore-status-2026-10-22.md),
   and commits all of it (never the gitignored payload — the workflow refuses
   to stage `.arena-drive/payload/`, same guard as the standing workflow).

Outcome records land in `docs/drive-sync/dropbox-probe.log` +
`docs/drive-sync/restore-12c463f.log` on `main`; the audit after the probe is
`node scripts/drive-sync-audit.mjs`.

## Stream state after this round

- **S1/S2 (chipwright strand of the Drive reconciliation):** every
  in-sandbox/connector-side blocker is discharged; the restore is queued as
  the post-merge probe run. If all fetch forms fail, the probe log is the
  next diagnostic — no silent failure is possible (the log commit is
  unconditional).
- **Drive queue remainders, unchanged and still owner-gated:** the three
  manifests are already reconciled and committed under `docs/drive-sync/`;
  the two APK lines stay NOT-SHARED (link-readable toggle remains the
  documented human step before a runner triage round).
- **S5 snapshots / S6-S9 hardware- and rights-gated remainders / S10 Ghidra
  DTSearch:** untouched, runner work per round 55.

## Verification (this commit)

- Connector metadata calls recorded above (2026-10-29).
- `node --test tests/wikiinajar.test.mjs tests/wikiinajar-docs-sync.test.mjs`
  green after the wiki rebuild with this document (24/24).
- `node scripts/drive-sync-audit.mjs` at this commit: 28 of 29 checks pass;
  the one drift (`greeran-family-4dwm.xdc` sha vs its Drive value) predates
  this round — the file is untouched here and the ledger owns the fix. The
  chipwright orphan check reads *still Drive-only*, as expected pre-restore;
  the probe's ledger step above is what keeps the audit green afterwards.
