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

## 3. Cicada as a cryptographic/cipher-machine laboratory

The next research question is best answered as a **bounded model of the public
puzzle design**, not as a claim about who made it. The observable sequence is a
multi-stage instrument: it gives a solver a control (a signature, a known
plaintext page, or a published parameter), asks for one capability, and uses
the result to gate the next capability. That is enough to study a practical
cipher-machine laboratory without turning the word “laboratory” into an
institutional attribution.

### 3.1 Evidence and provenance matrix

| Laboratory control | Technique to reproduce | What the source actually is | Disposition |
|---|---|---|---|
| Authenticity gate | OpenPGP cleartext signatures; issuer `7A35090F` / `181F01E57A35090F` | Published signed messages, including the April 2017 primary transcription; earlier rounds are preserved through community transcriptions | Issuer continuity is checkable. Key ownership and human identity are not established by the issuer field alone. |
| Concealment gate | JPEG OutGuess extraction | 2012/2014 signed payloads and solver archives that preserve the extraction steps | Reproduce when the original image bytes are available. A walkthrough is not itself proof of original hosting. |
| Source-dependent text gate | Book cipher with edition, page/line/word coordinates | Community archive records the Mabinogion/Bulfinch and Emerson paths and their signed instructions | The edition is part of the key. A plaintext obtained from a different edition is not the same result. |
| Public-key gate | RSA/OAEP, normally with `e = 65537`; deliberately small puzzle parameters | Signed challenge text and archive-preserved modulus/ciphertext | Treat “breakable” as a puzzle property to measure, not a statement that RSA/OAEP is generally weak. Record modulus size and factorization result separately. |
| Anonymous-transport gate | Tor hidden service, CGI upload, and `/key.asc` publication | The archived signed 2014 instruction reproduced by the technical archive | This demonstrates an operational exercise. It does not identify the service operator, location, or motive. |
| Manuscript/numerical gate | Gematria Primus, rune substitution, Atbash/reversal, Vigenère-like shifts, prime and totient streams | Community Liber Primus transcription and solver analyses | Known pages are positive controls; unresolved pages remain unresolved. A community transcription is not an original publisher artifact. |
| Social/organizational claim | “Recruitment”, “international group”, and “Think Tank” language | A disputed leaked-email chain: first circulated form is labeled modified/unsigned; later recovery presents a purported PGP-signed copy | Preserve the exact claim, provenance, and corroboration as separate fields. Do not treat it as independent proof of authorship or an intelligence connection. |

The repository records this matrix as `CICADA_LAB` in
`js/lecture-ciphers.js`, while the bundled `cicada-3301` record carries the
reader-facing facts and source links. The new record language deliberately
says “laboratory model” and “methodological” rather than “intelligence lab”.

### 3.2 Reproducible laboratory notebook

The following is the safe, source-graded order for a local reproduction. It is
important not to substitute a live onion service, an untrusted keyserver, or a
random image found by search for the source bytes under examination.

1. **Freeze the artifact.** Save the image, signed cleartext, signature block,
   book edition metadata, ciphertext, and any onion-stage response with a
   cryptographic digest. Keep the URL/date and the archive that supplied the
   copy. The current repository's April check intentionally stops at the
   available RSA MPI prefix and does not call that a full signature
   verification.
2. **Extract, then authenticate.** Run OutGuess against a local copy of the
   JPEG and retain both the extracted bytes and the command output. Normalize
   line endings only in a separate working copy before OpenPGP verification;
   canonical-text signatures are sensitive to the exact cleartext convention.
   Verify the complete signature against a trusted copy of the public key, not
   merely the issuer subpacket.
3. **Solve the book code against the named edition.** Record title, edition,
   page numbering, and coordinate convention. Check the result against the
   signed message's expected shape. This prevents a later reprint or a solver's
   cleaned transcription from silently changing the key.
4. **Measure the RSA challenge.** Preserve `n`, `e`, padding mode, ciphertext,
   and the factorization/decryption result independently. The recurring
   `65537` exponent is ordinary RSA engineering; the teaching signal is the
   deliberately small or otherwise puzzle-sized modulus and the requirement to
   recognize OAEP rather than apply raw textbook RSA.
5. **Treat Tor as transport, not proof.** Recreate a hidden service only in an
   isolated local lab or use a captured response. The source's request for a
   CGI upload and `/key.asc` is an observable protocol step, not evidence of a
   particular operator. Do not upload personal data or private keys while
   reproducing the protocol.
6. **Run the rune/numerical controls.** Use the 29-symbol Gematria Primus
   alphabet and the source's stated direction/shift convention. Test the
   method first on a page for which the community has a published plaintext,
   then report the unsolved pages as negative or unresolved results. Prime
   sums, `phi(p)`/totient streams, and Vigenère-like shifts are hypotheses until
   the same convention reproduces a known control without hand-tuned exceptions.

The local structural checks currently available are:

```bash
node tools/verify_lecture_hall.mjs
node tools/check-dom-ids.mjs
```

The first check imports `CICADA_LAB`, checks the OpenPGP packet metadata already
parsed from the April bytes, and audits that the bundled record contains the
source-backed controls and explicit attribution limits. It does not pretend to
verify a signature without the complete public key and packet bytes.

### 3.3 The “Think Tank” claim and what can be said

The later PGP-signed copy is useful for a narrower question: whether the text
and signature form a coherent artifact that can be independently verified
against the published Cicada key. Even a successful cryptographic verification
would authenticate the text to that key; it would not authenticate the
organizational biography inside the text. The earliest circulated form is
explicitly described as modified and unsigned, which is a separate and weaker
provenance class. Therefore the lecture hall now stores three distinct labels:

- **exact claim:** the text says the group is like a “Think Tank” researching
  techniques for liberty, privacy, and security and inviting applicants;
- **provenance status:** the earliest leak is modified/unsigned; a later
  community-recovered version presents a signature for checking;
- **corroboration status:** no authenticated independent organizational record
  establishes the group, its members, or an intelligence affiliation.

That separation is the key research result. Cicada can be analyzed as a
cipher-machine laboratory because the technical pipeline is observable. The
same evidence cannot be promoted into a confirmed intelligence laboratory or
institutional identity.

### Sources added in this pass

- 2014 technical archive/transcription:
  <https://github.com/scream314/cicada3301/blob/master/2014.md>
- Liber Primus transcription and solver notes:
  <https://github.com/scream314/cicada3301/blob/master/liber_primus.md>
- Leaked-email provenance comparison:
  <https://uncovering-cicada.fandom.com/wiki/The_Leaked_Email>
- 2014 secondary reconstruction, including RSA and onion stages:
  <https://uncovering-cicada.fandom.com/wiki/What_Happened_Part_1_(2014)>
- Normative OpenPGP packet/signature reference:
  <https://www.rfc-editor.org/rfc/rfc4880.html>
