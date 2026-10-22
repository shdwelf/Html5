# Drive backup and historical wiki continuation — 2026-10-15

Order followed: **back up PR #116 first, verify restoration, then resume the
historical wiki work**. PR #116 remains open; no merge or branch switch was made.

## 1. Verified baseline backup

[Open the backup folder](https://drive.google.com/drive/folders/1yZhxIeQDNTgO5UXdhttAsiID2On_Eqgr)
under the existing **Html5 backups** area. No older backup or sharing setting was
changed; the new folder inherits the existing area's access.

- Branch: `arena/dbace3b9-html5`.
- Backed-up commit: `70596d89ee69b984c1ffb0997761ca281cae264d`.
- Git increment prerequisite: `a4e75d12d85c627e57e31ea03bf7c5ef4fcabe5e`.
- Source snapshot: `8abeeaaedb928c98b072e81d76fe9c1a77087ac6a287b5b387c4dc1d5d79907d`.
- Eleven backup input files: **176,506,246 bytes**, plus the separately uploaded
  completion receipt. Every input's Drive-reported byte size and MD5 matched the
  local file. This is upload verification, not a second download of all data.
- Local restoration reproduced **all twelve release artifacts byte-for-byte** and
  checked **all 2,333 eligible source files** against SHA-256.

Evidence: [upload receipt](../research/wiki-workspace/drive-backup-20261015-pr116.json).
The Drive folder also contains `UPLOAD-VERIFIED.json`, the restore recipe,
`SHA256SUMS`, and `BACKUP-MANIFEST-20261015-pr116.md`.

The workspace did not retain the earlier generated `dist/` files. They were
rebuilt from committed sources before backup. The eligible source snapshot id
is unchanged; archive bytes differ from the pre-commit build because catalog
Git/exclusion metadata changed. The backup's checksums identify the actual
rebuilt files, not a purported copy of the earlier ephemeral artifacts.

### Shared payload instead of three duplicate JARs

The three modern editions mostly contain identical compressed ZIP records.
The backup stores the More edition once, split into two parts below the
connector's 100 MB upload limit. A 5,061,774-byte supplement contains the other
editions' differing records, portable XDC output and remaining metadata. The
restore recipe copies exact byte ranges; it does **not** recompress the JARs.
Thus it restores the original hashes without requiring a matching zlib or JDK.

HTML/JSON/XML exports already inside the canonical JAR are extracted from that
JAR instead of duplicated in the backup. The optional source extraction uses
the vault/catalog, preserves tracked executable bits, and never executes the
restored files.

### Restore

Download all files without changing their names. The standalone helper is
included on Drive; an identical source copy is also in this repository:

```sh
sha256sum -c SHA256SUMS
python3 restore-wiki-backup.py --output restored-wiki --extract-source
```

Or use the repository copy:

```sh
python3 tools/wiki-workspace/restore-backup.py \
  --backup /path/to/downloaded-backup --output /path/to/new-restored-directory \
  --extract-source
npm run test:wiki-backup
```

The output directory must not already exist. The helper verifies sizes and
SHA-256, rejects unsafe paths and out-of-bounds ranges, and removes its own
partial staging directory after failure. It needs only Python's standard
library. Eight offline tests cover exact reconstruction, executable modes,
missing/corrupted parts, incorrect output hashes, path traversal, invalid
ranges and refusal to overwrite existing data.

**Scope:** the Git bundle is an increment, not a full-history clone. It requires
the base commit above. The source vault offers independent file recovery, but
not the excluded relay caches, credentials, private runtime data, browser-local
drafts, full Git history, or every repository in an account. Earlier backup
chains were not recopied or silently declared complete.

## 2. Resumed: original 0.8 distribution recovered and rebuilt

After upload verification completed, the original archive already present in
Drive was downloaded through the connector and checked:

| Property | Observed value |
| --- | --- |
| File | `WikiInAJar-0.8-20081128-bin.zip` |
| Drive file | `1uKnAjh5zlgq_4iAQZ3Hw_CsNFPAEc2br` |
| Archive size | 123,402 bytes |
| Drive/local MD5 | `45943d5150400ae59f739a32dc475585` |
| Archive SHA-256 | `4db47b0f712f50a7416ed1f0c65c06229d6820855cc18825e0ad3f9bd8a5bd47` |
| Inner application JAR size | 98,464 bytes |
| Inner JAR SHA-256 | `7927d3d7b8e1c4df414a27026e80517adfe39b7bb57d08e37c3d86f7655f764f` |
| Main class | `org.rgse.wikiinajar.server.Server` |

The 83 original ZIP entries were checked for traversal/symlink entries before
extraction. These are identity/integrity checks against the user's stored copy,
not an upstream digital-signature verification. The original Drive file was
not changed. [Machine-readable provenance](../research/wiki-workspace/legacy-08-provenance.json).

`tools/wikiinajar/build-image-support.sh` successfully compiled the Java 8 image/
DjVu patches against that JAR and passed `ImageSupportSmokeTest`. The resulting
`WikiInAJar-0.8-image-support-pr116.zip` is a **historical 0.8 installation with
source patches and refreshed documentation**, not the new ACME application and
not a recovered More Wiki 0.9.9 release. It stays outside Git and is backed up as
a separately checksummed continuation artifact. Its output hashes and exact
build-input inventory are recorded in
[the build provenance](../research/wiki-workspace/legacy-08-build.json), outside
the generated wiki text to avoid a self-referential archive checksum.

### Real, bounded legacy HTTP checks

A reusable [HTTP smoke harness](../tools/wikiinajar/test/http-smoke.py) launches
only a short-lived JVM fixture, refuses a configuration enabling remote clients,
uses loopback GET requests, and always stops the server. Nine requests passed:

- The demo article returned 200 with rendered raster and DjVu markup.
- PNG, DjVu, JavaScript and WASM routes returned 200 with their expected MIME types.
- Plain/encoded image traversal, skin traversal and an unsupported/missing SVG
  returned 404.
- The existing two Node DjVu decoder tests also passed.

[HTTP observations](../research/wiki-workspace/legacy-08-http-smoke.json).
This is not a new full browser/device test or an Internet-security certification.

Static `javap` inspection confirmed the original `HttpServer` extends XRays'
`NanoHTTPD`, and that `Settings` defaults `only.allow.local.connections` to
`yes`. The socket itself binds a wildcard address; its accept handler filters
non-loopback peers. That differs from the new ACME server's loopback bind.
Do not confuse this filter with authentication or disable it for public hosting.

The first readiness probe also exposed a historical fragility: connecting and
closing without sending an HTTP request stopped acceptance in this build. The
harness now uses a complete HTTP request for readiness. This avoids the test
trigger; it is **not** a claimed repair to the 2008 server. The modern ACME
edition remains the recommended host.

## 3. Boundaries carried forward

The current continuation closes the missing-local-0.8-archive/build gap. It does
not recover historical More Wiki 0.9.9, convert Java bytecode to verified C++ or
native assembly, install a JavaCard CAP, or validate messenger-device sync and
live MediaWiki/Tiddlyhost deployment. GitLab/Archive.org live access remains
outside this sandbox's network policy. See the
[repository-wiki research report](wiki-workspace-research-2026-10-15.md) and
[build guide](../tools/wiki-workspace/README.md) for those separate work items.
