# Chipwright restore — status (2026-10-22)

**Goal:** restore the 25 Chipwright files that exist only in the
2026-09-27 Drive snapshot (`docs/drive-sync/` diff: 24 app/tool files
+ `chipwright.xdc`; hashes pinned in
`docs/drive-sync/Html5-file-manifest-2026-09-27-12c463f.sha256`).

**Attempts so far (runner, `.arena-drive/fetch.log`):**
run 1 fetched the 33 MB worktree tarball cleanly (sha256
`c4cb0bc0276e2af4…`, size-verified); every later run gets **HTTP 404**
from all Drive public endpoints and from gdown (its FAQ error =
anonymous download quota) despite the file being `anyoneWithLink`
with `canDownload=true`. Drive copy is refused (`can_copy: false`),
and the Drive connector cannot return 33 MB inline. Owner chose the
Dropbox channel (2026-10-22).

**Ready plumbing (this PR):** `fetch.py` accepts a per-file URL
override (`ARENA_FETCH_URL_<sanitized-id>`); the workflow maps it to
the `CHIPWRIGHT_TARBALL_URL` Actions secret. Restore itself is
already fixed and waiting: committed-manifest fallback +
snapshot-root detection via `chipwright.html` + tee'd apply log
(`docs/drive-sync/restore-12c463f.log`). `drive-sync-apply` never
overwrites and re-hashes every restored file.

**Next step (owner):** upload `Html5-worktree-2026-09-27-12c463f.tar.gz`
to Dropbox `/Html5-Backups/`. Then: temporary link → secret → requeue
run → verify 25 files against the manifest → revoke the Drive link
sharing, delete the secret, re-comment the tarball request line.
