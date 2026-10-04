# `docs/drive-sync/` — generated reconciliation reports

Written by [`.github/workflows/arena-drive-sync.yml`](../../.github/workflows/arena-drive-sync.yml).
Each Drive snapshot manifest that the runner retrieves produces three files here:

| file | what it is |
| --- | --- |
| `<snapshot>.sha256` | the Drive manifest itself, committed as provenance |
| `<snapshot>.txt` | human-readable rsync-style diff against the tree at that commit |
| `<snapshot>.json` | the same diff, machine-readable |

Snapshot tarballs are **not** committed — they are 33–96 MB and live only in
the gitignored `.arena-drive/payload/` on the runner. Only the hashes, the
reports, and files the diff proves are missing here ever enter the repository.
That is the point of doing this manifest-first: the comparison needs a few
hundred KB of checksums, not the whole tree.

## Reading a report

```
= identical        744   byte-for-byte the same on both sides
~ differing         54   same path, different bytes — the repo has moved on
< only on Drive      0   content that exists nowhere in Git  ← the thing to care about
> only in repo    1369   added since the snapshot was taken
```

`only on Drive` is the number that matters. Everything else is expected drift
between a September snapshot and current `main`.

## Running it by hand

```bash
node scripts/drive-rsync-diff.mjs <manifest.sha256> --tracked-only --plan
node scripts/drive-sync-apply.mjs --manifest <manifest.sha256> \
     --snapshot <unpacked-dir> --only 'chipwright*' --write
node scripts/drive-sync-audit.mjs
```

`drive-sync-apply.mjs` never overwrites a file that already exists here, and
re-hashes everything it writes against the manifest — a mismatch deletes the
file and fails the run rather than leaving a half-correct restore of content
that exists nowhere else.

Background and findings: [`../drive-repo-sync-2026-10-04.md`](../drive-repo-sync-2026-10-04.md).
