# Google Drive ↔ repository sync — deep dive, 4 October 2026

A full reconciliation of the Google Drive backup area against `shdwelf/Html5`.
Every item on Drive was enumerated and classified; every commit SHA named in a
Drive note was checked against the repository's complete history.

- Machine-readable ledger: [`drive-inventory-2026-10-04.json`](drive-inventory-2026-10-04.json)
- Re-run the repository half: `node scripts/drive-sync-audit.mjs` (29 checks, exits non-zero on drift)

**Audit basis.** Drive: 57 items — 9 folders, 48 files, of which 46 relate to
this repository. Repository: `main` at `3fbea9b`, 445 commits, 90 refs, 2,164
tracked files. The clone was deliberately un-shallowed first (`git fetch
--unshallow`); the one-commit clone this session started from cannot tell
"absent from history" from "absent from the clone", and every orphan claim below
depends on that distinction.

---

## 1. Headline findings

| # | Finding | Severity |
| --- | --- | --- |
| 1 | The **chipwright workbench — 25 files — exists only on Drive.** Zero hits across 445 commits and 90 refs. | **High** |
| 2 | The **pub-crawl resolution was lost.** Drive preserves a commit resolving it as DEF CON's; main still records it as unverified. | Medium |
| 3 | **No Git history for `Html5` exists on Drive at all** — every Drive artifact is a working-tree snapshot. `Html5.bundle` was declared by two mirror runs and uploaded by neither. | **High** |
| 4 | **The newest full Drive snapshot is five days stale**: 1,342 files at `6635490` (29 Sept) against 2,164 tracked files on main today. | **High** |
| 5 | Two Drive-recorded SHA-256 values **reproduce exactly** against the current tree — the Drive ledger is accurate and worth trusting. | Good |
| 6 | Three apps show **size drift** between Drive and repo (`UFOpaedia.html`, `sse-webxdc.xdc`, and the kryptos-vrml lineage). | Medium |
| 7 | `shdwelf/Html5-sync-incoming` (~380 MB) is reported **public since 2026-08-31** and backed up in no form. Carried forward unverified — out of reach from here. | **High** |

---

## 2. Commit-level reconciliation

Every SHA named anywhere in the Drive notes, checked against full history. This
is the table `scripts/drive-sync-audit.mjs` enforces.

### 2.1 Landed — Drive is a redundant copy

| Commit | What Drive says | Reality |
| --- | --- | --- |
| `6a324e5` | base of the chipwright work | on main, 802 tracked files |
| `0c2e34c` `bf3f82c` `eaca3d8` `e5d24ec` `bd8f7aa` `285339f` | PR #60 set, "already on GitHub" | all on main — claim correct |
| `d7d9ba2` | Art Studio mnemonic-box fix (PR #55) | on main; `art-studio-fixed.zip` is a snapshot of it |
| `d9a4842` | base of the 2026-10-04 patch | on main |
| `1a93af7` | — | on main; relevant below |

### 2.2 Absent as a SHA, present as content

**`854f8ff`** — the 2026-10-04 Drive patch records this as the head of
`arena/01a106c7-html5` over base `d9a4842`. The SHA is absent from history. The
branch was rewritten after the backup was taken: PR #90's actual commits are

```
e1150b5  Add Four Corners gazetteer and orbital windows webxdc
3883c8f  Add minimal USGS 3DEP probes for four states
d6e6121  Add USGS CORS proxy and elevation fallback paths
1148120  Add OpenStreetMap context fallback
```

merged as `3fbea9b`. The described content — four-corners 4DWM app and `.xdc`,
gazetteer sync, Lost Treasure MRDS source check, launch windows, rebuilt
`socal-subsurface.xdc` and `cheyenne.xdc` — is on main. **Nothing to recover**;
the backup simply names a SHA that never reached GitHub.

**`6635490`** — "fold Smithsonian box/folder provenance into deep-dive doc and
kryptos-vrml K4 panel", preserved by the 29 Sept snapshot as not-yet-pushed. The
SHA is absent, but equivalent content reached main by another route:
`docs/lecture-hall-research-2026-09-29.md` carries the Smithsonian provenance
(Series 3: Commission Files, Box 6; Box 10:21, 10:24, 18:27), and
`docs/convention-venues.md` carries the K4 panel with the post-sale facts.
**Effectively landed.**

**`ee1ec85`** — "Refresh `apps/kryptos_vrml.html` from the canonical build",
79,519 B. The SHA is absent and the file today is 64,441 B — but it was rewritten
on main by `1a93af7` ("Kryptos K4 archive deep dive") on 29 Sept, *after* the
snapshot. **Superseded, not lost.** The chain-of-custody anchor still holds:
`apps/kryptos_vrml_backup.html` hashes to `29952bb430ac…`, exactly the value
`BACKUP-INFO-2026-09-28.txt` records for the unmodified received artifact.

### 2.3 Absent, and correctly so

`9d9de13`, `59631df`, `d943829` all belong to **`shdwelf/Html5-sync-incoming`**,
a different repository — the CyberChef SSE / hash-lab work and the Crow
field-cipher recipe sync. `sync-outgoing/README.md` already explains why that
commit is parked here as a patch and a bundle rather than pushed. Not a gap.

### 2.4 Absent, and genuinely lost

**`559fb69` — "Resolve the pub crawl: it is DEF CON's, not CES's"**

Preserved only inside `Html5-worktree-2026-09-28-ee1ec85.tar.gz`. Main's current
text, three places over, still treats the question as open:

- `docs/convention-venues.md:395` — *"and the \"pub crawl\" is unverified"*
- `docs/for-dummies-source-check.md:174` — *"## 5. \"Pub crawl\" — unresolved"*
- `greeran-book.html:1530` — *"remains unverified and stays out of the record"*

A resolved research question silently reverted to unresolved. The evidence
behind the resolution is in the tarball; it has not been re-derived here, and
the three documents are deliberately left untouched — re-asserting a conclusion
whose sourcing cannot be read from the sandbox would be exactly the kind of
unsourced claim this repository's source-check discipline exists to prevent.

**`12c463f` / `029e4ff` — the chipwright tree.** See §3.

---

## 3. The chipwright workbench is Drive-only

The strongest finding of this audit, and it is arithmetic rather than inference.

`READ ME FIRST.txt` describes `Html5-worktree-2026-09-27-12c463f.tar.gz` as "the
complete committed working tree at commit `12c463f`, **827 files**", verified
byte-for-byte against git blobs with 0 mismatches, and states it "includes the
chipwright offline hardware-triage workbench (`chipwright.html`,
`css/chipwright.css`, `js/cw-*.js`, `tools/`), its 12 tabs, and `chipwright.xdc`".

Its base commit `6a324e5` is on main and carries **802** tracked files.
827 − 802 = **25 files** of chipwright that never arrived.

Confirmation from the other direction:

```
$ git log --all --oneline -- '*chipwright*' 'js/cw-*.js' | wc -l
0
```

Zero, across 445 commits and all 90 refs. The Drive note explains the mechanism
itself: a mid-session sandbox re-clone destroyed `8366299`, `d6d11c3` and
`12c463f`; the surviving working tree was re-committed as `029e4ff`, which is
also absent — so that session's output never reached GitHub in any form.

Recorded identity of the packaged app, for whoever restores it:

| | |
| --- | --- |
| `chipwright.xdc` size | 400,057 B |
| md5 | `c9c7fff157c6e41160db013b7280e8ef` |
| sha256 | `0e6a47dc25a7987f15796faec9608fe2969cc414ff0cfc8930a52168f80c268c` |
| Drive copies | `chipwright-xdc-12c463f.zip` (400,183 B) and inside the 33 MB tarball, byte-exact |

`CHIPWRIGHT.md` also documented a naming collision worth preserving: in this
repository `.xdc` means a **WebXDC application bundle**, not Xilinx Design
Constraints — and the chipwright workbench deliberately contains both readings.

### Why this PR does not restore it

The development sandbox's egress is allowlisted. Measured during this audit:

```
$ curl -o /dev/null -w '%{http_code}' https://api.github.com
200
$ curl https://drive.google.com/...
curl: (35) OpenSSL SSL_connect: SSL_ERROR_SYSCALL in connection to drive.google.com:443
```

Drive bytes cannot reach the sandbox — the same constraint the Drive notes hit
from the other side ("the sandbox cannot pull bytes out of Drive"). Restoration
paths are in §6.

---

## 4. Artifact-level comparison

### 4.1 Verified in sync

Both Drive-recorded hashes reproduce exactly against the current tree:

| Repo path | SHA-256 | Drive source |
| --- | --- | --- |
| `greeran-family-4dwm.xdc` | `188db5ea100ba96c9efd650cd25b61901ca361da468da6d85a35a2fb26249f72` | `Greeran_Family_Tree_4DWM.xdc` description |
| `apps/kryptos_vrml_backup.html` | `29952bb430acffd5c9536f00c8a0a6cef62820d084d6b904f1f602b204db8f46` | `BACKUP-INFO-2026-09-28.txt` chain of custody |

`research/behind_the_dune_backup_manifest.md` matches its Drive copy at 4,300 B.

This matters beyond the two files: it is the evidence that the Drive area's
self-descriptions are reliable, which is what licenses trusting its chipwright
claim in §3.

### 4.2 Drift — unresolved

| Artifact | Drive | Repo | Note |
| --- | --- | --- | --- |
| UFOpaedia | `UFOpaedia.html` 44,687 B | `public/apps/ufopaedia/index.html` 42,581 B | 2,106 B apart. Direction unknown. Repo copy arrived via `9e41f39` (PR #65). |
| SSE WebXDC | `sse-webxdc-updated.xdc` 106,614 B; `sse-webxdc-verified.xdc` and `sse-webxdc.xml` both 57,765 B | `sse-webxdc.xdc` 58,808 B | Three Drive sizes for one app, none matching the repo. |
| kryptos-vrml | `ee1ec85` refresh, 79,519 B | `apps/kryptos_vrml.html` 64,441 B; `public/apps/kryptos-vrml/index.html` 81,707 B | Explained by `1a93af7`; recorded so it is not re-opened. |

Resolving these needs the Drive bytes, so they are documented rather than
guessed at.

### 4.3 Superseded by the repository

`art-studio-fixed.zip`, `art-studio-plus-keyspace.zip` (PR #55 / `d7d9ba2`, on
main), the 2026-10-04 patch and zip (PR #90, on main), and all three worktree
tarballs, whose trees main has moved past. Keep them as history; nothing to merge.

### 4.4 On Drive, no repository counterpart

`arj-research-report-2026-09-29.md` (Google Doc) and
`arj-research-backup-2026-09-29.zip` — ARJ/Kirkpatrick conversion and
authentication research, with a protection-boundary conclusion. No ARJ document
exists under `docs/`. Unlike chipwright this was never claimed to be part of the
repository, so it is a **candidate for import**, not a loss. The Drive
description notes it contains "no decrypted or bypassed commercial database
content" — importable under the repository's existing research-doc conventions
once the text can be read into a checkout.

Also Drive-only and out of scope for import: the CyberChef SSE / hash-lab folder
(7 files, belongs to `Html5-sync-incoming`), the SSE pre-merge folder (5 files),
`create (1).xdc.xml`, and `Greeran_Family_Tree.xdc` (102,871 B — the pre-4DWM
version superseded by the 111,244 B build).

---

## 5. Gaps on the Drive side

Carried forward from the backup area's own `STATUS.txt` and `READ ME FIRST.txt`,
re-checked where possible:

1. **No Git history, anywhere.** `Html5.bundle` and `Html5-sync-incoming.bundle`
   were declared by two mirror runs and uploaded by neither. Every Html5 artifact
   on Drive is a working tree with no commits. GitHub currently holds 445 commits
   and 90 refs — **none of which exists on Drive**. A `git bundle create --all`
   is the single highest-value upload available.
2. **The snapshot is stale.** Newest full snapshot: 29 Sept, `6635490`, 1,342
   files. Main today: 2,164 tracked files. The 2026-10-04 upload covers 34
   changed files, not the tree.
3. **`Html5-sync-incoming` is public and unbacked.** Reported `"private": false`
   since 2026-08-31. Not verifiable from here; flagged, not confirmed.
4. **`bip39-haiku-workbench.bundle` is unverified** — present at 3,576,209 B, never
   checked against a recorded hash.
5. **Binary uploads get mangled.** Raw `.bundle` / `.xdc` / `.wasm` / `.bin` are
   re-encoded as UTF-8 with replacement characters: a 65,552 B probe stored as
   118,711 B, a 400,057 B `.xdc` as 726,579 B. Forcing
   `application/octet-stream` does not help; `.zip` and `.tar.gz` survive.
   Corruption is deterministic, so matching md5s across re-uploads prove
   consistency, not correctness.

---

## 6. Recommended actions

**To recover chipwright** (needs a machine that can reach both Drive and GitHub):

```bash
# 1. pull the snapshot and its manifest from
#    GitHub Backups/shdwelf/Html5/
tar xzf Html5-worktree-2026-09-27-12c463f.tar.gz -C restore
cd restore/Html5-12c463f
sha256sum -c Html5-file-manifest-2026-09-27-12c463f.sha256   # expect 827 × ": OK"

# 2. copy only the 25 chipwright files into a checkout of this repo
#    chipwright.html  CHIPWRIGHT.md  css/chipwright.css  js/cw-*.js  tools/*  chipwright.xdc

# 3. verify the packaged app against the recorded identity
sha256sum chipwright.xdc
# expect 0e6a47dc25a7987f15796faec9608fe2969cc414ff0cfc8930a52168f80c268c

# 4. update the ledger, then confirm the audit notices the restore
node scripts/drive-sync-audit.mjs
```

**Alternatively, use the egress channel this repository already has.** The
`.arena-archive/fetch.py` + Actions pattern exists precisely because the sandbox
cannot reach the open internet while a runner can. A Drive file shared with
link-access would be fetchable by a runner and committed back the same way.
That requires a deliberate decision to expose those files, briefly and
intentionally — it is not done here.

**Backup hygiene, in priority order:**

1. Upload `git bundle create Html5.bundle --all` — the one artifact class Drive
   has none of, and the only one that would survive losing GitHub.
2. Take a fresh full snapshot at `3fbea9b`; the current one misses ~822 files.
3. Settle `Html5-sync-incoming`'s visibility, and back it up in some form.
4. Verify `bip39-haiku-workbench.bundle` against its recorded hash — one command
   on the machine holding the original.
5. Wrap every binary upload in `.zip`/`.tar.gz` and read back Drive's
   `md5Checksum` to confirm.

**In this repository:** re-run `node scripts/drive-sync-audit.mjs` whenever a
Drive backup is taken or restored. It fails loudly if a ledger claim stops being
true — including the day chipwright comes back.

---

## 7. Audit note

One reversible action was taken on Drive during this audit: two checksum
manifests (`Html5-file-manifest-2026-09-27-12c463f.sha256` and the 09-29
equivalent) were briefly given link-reader access to test whether the sandbox
could fetch their bytes directly. It could not — Drive is not in the egress
allowlist — and **both files were returned to private immediately**, confirmed
by the API. No other Drive permission, file or folder was modified, and nothing
was uploaded, moved or deleted. The findings above therefore rest on Drive
metadata, the backup area's own notes, and this repository's Git history.
