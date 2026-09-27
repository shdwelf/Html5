# Intelligence Lecture Hall — source-check follow-up, 2026-09-27

This is a follow-up to `docs/lecture-hall-research-2026-09-20.md`. It does two
things: records what the Google Drive update actually contained, and closes the
next Cicada 3301 thread without claiming more than the bytes establish.

## 0. Google Drive update and merge disposition

The connected Drive was searched by filename and full text for `cicada`,
`3301`, `cipher`, and `intelligence`, then listed in full. It contains no
Cicada source, cipher-machine lecture notes, or newer lecture-hall record. The
relevant material is a backup area:

- `Html5-worktree-2026-09-27-12c463f.tar.gz`, a working-tree snapshot at
  commit `12c463f`;
- `Html5-file-manifest-2026-09-27-12c463f.sha256` and
  `BACKUP-INFO-2026-09-27.txt`;
- several backup-status and repository-inventory notes.

The Drive backup record says explicitly that the snapshot contains working-tree
content only, no Git history, and that it supersedes an older snapshot rather
than representing a branch to merge. The current checkout is the shallow
`a2a8014` main tree, and its lecture hall already contains the ten-record
2026-09-20 pass. The archive was therefore not unpacked over the checkout: it
would be an unsafe replacement of a newer/different tree, not a merge of source
material. The Drive search also found no research artifact that could safely be
merged into this investigation.

That negative result is recorded here so a later session does not mistake the
backup tarball for an unmerged research source.

## 1. Cicada 3301 — April 2017 message

### 1.1 Primary transcription

The surviving primary artifact is the Pastebin page titled **Message from
3301/Cicada**, dated 4 April 2017:

<https://pastebin.com/yEiTHhvF>

Its cleartext is:

```text
Beware false paths.  Always verify PGP signature from 7A35090F.

3301
```

The page also preserves the ASCII armor line `Version: CicadaPG v.3301`, the
`Hash: SHA512` header, the signature bytes, and the CRC line. The community
archive is useful as a second transcription and discovery record, but it is not
substituted for the primary page:

<https://uncovering-cicada.fandom.com/wiki/PGP_Signed_Message_April_2017>

### 1.2 What the published bytes establish

The first 64 Base64 characters are enough to parse the packet header and all
metadata before the RSA MPI. `js/lecture-ciphers.js` now parses that prefix with
`openpgpSignatureInfo`; the verifier checks the following values:

| Field | Parsed value | Meaning |
|---|---:|---|
| packet header | `89 02 1c` | old-format OpenPGP Tag 2, declared packet length 540 |
| signature version | `4` | v4 signature packet |
| signature type | `1` | canonical text signature |
| public-key algorithm | `1` | RSA |
| hash algorithm | `10` | SHA-512 |
| hashed subpackets | `6` bytes | creation-time subpacket |
| unhashed subpackets | `10` bytes | includes issuer subpacket `09 10` |
| issuer long key ID | `181F01E57A35090F` | low 32 bits are `7A35090F` |
| creation time | `2017-04-04 23:23:28 UTC` | `0x58e42af0` |
| RSA MPI size | `4096` bits | the signature's MPI declaration |

This is a byte-level continuity check: the April packet carries the same issuer
long and short IDs already found in the 2012 material. It is **not** RSA
verification. An issuer subpacket is data inside an unsigned subpacket area and
can be written by an impostor; actual authenticity requires the public key,
the exact cleartext and a successful signature verification. The repository
now says this explicitly instead of calling the April message “the same key” as
if the key's human owner had been established.

### 1.3 What the `CicadaPG` anomaly means

The old record treated `Version: CicadaPG v.3301` as anomalous mainly because it
is not a GnuPG version string. RFC 4880 §6.2 is the more useful source check:

<https://www.rfc-editor.org/rfc/rfc4880.html>

The RFC says that armor headers are part of the ASCII armor, not the message,
and are not protected by signatures. It defines `Version` as implementation
metadata. Therefore:

1. the string cannot authenticate a signer or an implementation;
2. a non-GnuPG label does not by itself invalidate the signature; and
3. the label is consistent with a custom or out-of-tree encoder, but does not
   prove who controlled the signing key.

RFC 4880 §7 describes the cleartext signature framework and its `Hash:` header.
Here, the header says SHA512 and the embedded packet's hash-algorithm byte is
also 10 (SHA-512), so the two layers agree. The right disposition is therefore
**narrowed anomaly, not solved provenance**: the packet is structurally
coherent, the issuer ID is continuous, and the identity behind it remains
unattributed until the signature is independently verified against a trusted
key.

## 2. Repository update

The Intelligence Lecture Hall app record `cicada-3301` now contains:

- the exact April 2017 Pastebin source link;
- the RFC 4880 source link;
- the parsed packet fields and timestamp;
- the distinction between issuer-ID continuity, RSA verification, and human
  identity; and
- the corrected caution about the unprotected `Version` armor header.

The proof harness gained checks for all of those fields. The update is
reproducible with:

```bash
python3 tools/update_cicada_source_check.py
node tools/verify_lecture_hall.mjs
```

The update script is intentionally fail-loud and refuses to apply twice.

### Sources

- Pastebin primary transcription: <https://pastebin.com/yEiTHhvF>
- Community archive and discovery record:
  <https://uncovering-cicada.fandom.com/wiki/PGP_Signed_Message_April_2017>
- RFC 4880, §§6.2 and 7: <https://www.rfc-editor.org/rfc/rfc4880.html>
- Earlier 2012 Welcome payload and key fingerprint record:
  <https://github.com/aadishgoel/Cicada-3301/blob/master/Welcome.txt>
