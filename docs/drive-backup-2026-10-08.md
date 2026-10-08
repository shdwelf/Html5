# Drive backup — 2026-10-08

Branch `arena/4924b3bd-html5` tip `f0c52ad`, backed up to Google Drive from this
session (the Drive connector reaches Drive even though the sandbox egress does
not — the earlier note in `docs/drive-repo-sync-2026-10-04.md` §6 described the
opposite retry path, so this is a new capability, not a re-run).

Folder: **Html5 backup — 2026-10-08 (CyberChef 478-op sync + five CITY SUBSURFACE apps)**
`https://drive.google.com/drive/folders/1M5cRnyj9K4rOFh6tlDFFa5jloHUEkszM`

| File | Bytes | What it is |
| --- | --- | --- |
| `Html5-arena-4924b3bd-html5-f0c52ad.bundle` | 2,191,931 | git bundle of the four branch commits over base `59c3baa7b3cce72ea82c5f65c70e0a4e58314b80` (the current `main` tip) |
| `0001-Sync-the-CyberChef-kitchen-…patch` | 1,230,783 | commit 1 as `format-patch --binary` |
| `0002-Add-CITY-SUBSURFACE-4Dwm-…patch` | 9,566,581 | commit 2 (five city apps, data packs, Webxdc, tests) |
| `0003-site-sw-test-…patch` | 2,626 | commit 3 (the SITE-K cache-name test fix) |
| `MANIFEST.sha256` | 498 | SHA-256 of every file above |
| `README.txt` | 1,366 | restore recipe and the scope/gap statement |

## Scope, stated plainly

- **This is a branch bundle, not `git bundle create --all`.** The repository is
  ~355 MB on GitHub (mostly `.xdc` binaries), which exceeds the Drive upload
  limit reachable from this session; full history remains on GitHub only. The
  §5 gap in `docs/drive-repo-sync-2026-10-04.md` ("no Git history on Drive")
  is therefore still open for the *whole* repository, but this branch is no
  longer only on GitHub.
- **`shdwelf/Html5-sync-incoming` is not in the backup.** Pushes and ref writes
  to it are still refused (403, retested 2026-10-08 — see
  `sync-outgoing/README.md` §"Retest").
- Restore:

  ```
  git fetch ./Html5-arena-4924b3bd-html5-f0c52ad.bundle \
      arena/4924b3bd-html5:arena/4924b3bd-html5-restored
  ```

  or simply `git fetch origin arena/4924b3bd-html5` while the branch is on
  GitHub (PR shdwelf/Html5#102).
