# Drive backup — 2026-10-17

Branch `arena/c0c51527-html5` at commit `eb099fb`, backed up to Google Drive
from this session via the Drive connector (the sandbox's own egress is
allowlisted to GitHub/PyPI/npm and cannot reach Drive; the connector can).
Follows the pattern in [`drive-backup-2026-10-08.md`](drive-backup-2026-10-08.md).
The bundle covers `eb099fb` (the preservation work); this record was added in a
follow-up commit after the bundle was taken, so it is not inside the bundle.

Folder: **Html5 backup — 2026-10-17 (FIRST NAME ALMANAC v1.02b Xena preservation bag)**
`https://drive.google.com/drive/folders/1QqaSEhpzYrEW5DjgPSQusZBNtv9rChoK`

| File | Bytes | SHA-256 | What it is |
| --- | --- | --- | --- |
| `Html5-arena-c0c51527-html5-eb099fb.bundle` | 15,548 | `6534757f9e63ab02431f2654c95173dca371dd75f66a8c3b1d310ee25fd2d906` | git bundle of `main..arena/c0c51527-html5` over base `a9aefbaaa0ea5234e31cf0306cae8029223e28b4` |
| `0001-Add-FIRST-NAME-ALMANAC-v1.02b-Xena-inspired-preserva.patch` | 37,753 | `9ea0efad2c44967898a6b7cb8e4c5093c27e2ff8ea16f7baba709b6df0f17d5d` | commit `eb099fb` as `git format-patch --binary` |
| `MANIFEST.sha256` | 315 | — | SHA-256 of every file above |
| `README.txt` | 1,800 | — | restore recipe and the scope/gap statement |
| `fna102b-xena-2026-10-17.zip` | 13,848 | `1431d9b3f7c0af711cfe7e53eadd2ab6e88f88cc4540f6320beccebe7ab8bd85` | the BagIt 1.0 bag itself — all 13 files, added because `dist/` is gitignored so the bag exists nowhere else durable |
| `KGK.EXE` | 551,767 | `19ac8ee1ec0b3c635699597d65b420dbe1afbc7355a4ce1a5ec932eecd0e3b02` | reconstructed self-extracting ARJ — `MEANINGS.OVL + NAMES.OVL` concatenated as `INSTALL.COM`'s batch template does; ARJSFX stub + the byte-identical `KGK.ARJ`. No decryption involved |
| `DERIVED-MANIFEST.txt` | 184 | — | SHA-256 of the derived artifacts |

The folder listing was re-read after the first upload and returned those four
objects with matching byte counts; the bag zip was added afterwards and
verified at 13,848 bytes.

Pull request: <https://github.com/shdwelf/Html5/pull/120>

## Restore

```sh
git fetch ./Html5-arena-c0c51527-html5-eb099fb.bundle \
    arena/c0c51527-html5:arena/c0c51527-html5-restored

# or, while the branch is on GitHub:
git fetch origin arena/c0c51527-html5

# or apply the patch onto the base:
git checkout a9aefbaaa0ea5234e31cf0306cae8029223e28b4
git am ./0001-Add-FIRST-NAME-ALMANAC-v1.02b-Xena-inspired-preserva.patch
```

## Scope, stated plainly

- **This is a branch bundle, not `git bundle create --all`.** The repository is
  hundreds of megabytes on GitHub (mostly `.xdc` binaries); full history remains
  on GitHub only. The §5 gap noted in
  [`drive-repo-sync-2026-10-04.md`](drive-repo-sync-2026-10-04.md) ("no Git
  history on Drive") is still open for the whole repository — this branch is
  simply no longer only on GitHub.
- **The preservation bag is in the backup as `fna102b-xena-2026-10-17.zip`,**
  added after the initial four files. `dist/fna102b-xena/` is gitignored, so
  without it the bag existed only in the sandbox working tree. It is also
  rebuilt byte-for-byte by `npm run build:fna-xena` from
  `samples/archive/kirkpatrick/FNA102B.ZIP`, which is already in the repository
  and provenance-recorded — the zip is a convenience copy, not the only route.
- **No decrypted content exists to back up.** `MEANINGS.OVL` and `NAMES.OVL`
  are the halves of a split ARJ archive whose members carry the GARBLED flag.
  They are recorded by SHA-256 and format identification only. No ARJ member
  was decrypted, and no garble key was derived, guessed, or searched for — in
  the working tree, in the commit, or in this backup. See
  [`fna102b-xena-preservation.md`](fna102b-xena-preservation.md), "Not done,
  deliberately", and the *KGK.ARJ inspection* section of
  [`greeran-family-tree-ebook-and-data-status.md`](greeran-family-tree-ebook-and-data-status.md).
- **`shdwelf/Html5-sync-incoming` is not in the backup.** Writes to that
  repository are still refused for this integration; see
  [`../sync-outgoing/README.md`](../sync-outgoing/README.md).
