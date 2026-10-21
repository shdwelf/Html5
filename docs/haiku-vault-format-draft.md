# The Haiku Vault File Format — draft specification (v1)

*Stream S9 / task T9.4 (“draw up the rfc for these new formats bag-it and haiku vault”).*
*Status: Informational draft, documenting the format that already ships in*
[`src/lib/vaultfile.ts`](../src/lib/vaultfile.ts) *(and its standalone WebCrypto*
*decryptor). It does not change the wire format. Companion:*
[`tests/haiku-vault-format-vector.test.mjs`](../tests/haiku-vault-format-vector.test.mjs)
*pins the test vector below with `node:crypto`, independent of the `@noble`*
*implementation and of the generated decryptor page.*

## Abstract

This document specifies **haiku-vault-v1**, an encrypted file-exchange format for
JSON payloads (wallet records, seed catalogs, OCR haiku collections). A vault is a
single text line: a magic prefix followed by Base64 of a version byte, a salt, an IV,
and an AES-256-GCM ciphertext with its authentication tag. The key is derived from a
UTF-8 passphrase with PBKDF2-HMAC-SHA256. The document also profiles BagIt (RFC 8493)
for vault bundles, matching the repository’s Xena-inspired preservation pattern.

## 1 · Wire format

```text
haiku-vault-v1. + Base64( 0x01 | salt[16] | iv[12] | ciphertext+tag )
```

| Field | Size | Notes |
| --- | --- | --- |
| magic | 15 ASCII | `haiku-vault-v1.` (including the trailing dot) |
| version | 1 byte | `0x01`; decoders MUST reject other values |
| salt | 16 bytes | fresh random per file; independent of the IV so one passphrase/Ensō ID can back many files |
| iv | 12 bytes | fresh random per file (GCM nonce) |
| ciphertext+tag | ≥16 bytes | AES-256-GCM output; GCM tag is the trailing 16 bytes |

- **Plaintext:** UTF-8 encoding of `JSON.stringify(payload, null, 2)`.
- **Key derivation:** PBKDF2-HMAC-SHA256 (RFC 2898), `c = 120000`, `dkLen = 32`,
  passphrase bytes = UTF-8 of the passphrase, salt = the 16-byte field above.
- **AEAD:** AES-256-GCM (NIST SP 800-38D), 12-byte IV, default 128-bit tag,
  no AAD.
- **Encoding:** standard Base64 (RFC 4648, with `+/` and `=` padding) — *not*
  Base64url. Encoding is not encryption; the SSE-family codecs (SSEBase64,
  HybridBase62) are **not** used here (see
  [`wiki-workspace-research-2026-10-15.md`](wiki-workspace-research-2026-10-15.md)).

Decoders MUST reject: a wrong/absent magic (unless the bare body is passed on a
trusted channel), version ≠ 1, body shorter than 1+16+12+16 bytes, non-Base64
input, and any GCM authentication failure (wrong passphrase or tampering).
Decoders MUST NOT emit partial plaintext on failure.

## 2 · Test vector

Passphrase `correct horse battery staple` · salt = 16 × `0x2a` · iv = 12 × `0x2a` ·
plaintext (48 bytes, note the pretty-printed JSON with trailing newline-less form as
produced by `JSON.stringify(value, null, 2)`):

```json
{
  "note": "haiku vault format test vector"
}
```

| Output | Hex |
| --- | --- |
| PBKDF2 key | `65033e57d99c573585534ef016031e62d84710b0a546845a0fadba4b7ca2418d` |
| ciphertext+tag | `5a6a7e4e6e156a4683b69aac6d0c1f0d6c7382c4b8e9983fe585ce82b02dd514ce31af6f30a8a130da54b16605f64d841a6224b841ab79d75722651bd9a7` |

Complete file:

```text
haiku-vault-v1.ASoqKioqKioqKioqKioqKioqKioqKioqKioqKipaan5ObhVqRoO2mqxtDB8NbHOCxLjpmD/lhc6CsC3VFM4xr28wqKEw2lSxZgX2TYQaYiS4Qat511ciZRvZpw==
```

## 3 · Implementations

| Implementation | Crypto stack | Notes |
| --- | --- | --- |
| `src/lib/vaultfile.ts` | `@noble/ciphers` + `@noble/hashes` | canonical; Node-testable |
| generated decryptor page (`standaloneDecryptorHtml`) | native WebCrypto | offline, no imports/network; optionally pre-embedded blob |
| wiki-workspace browser helper | native WebCrypto | exercises both directions incl. non-ASCII passphrases |
| `tests/haiku-vault-format-vector.test.mjs` | `node:crypto` | independent re-derivation of §2 |

## 4 · Versioning policy

A future envelope (e.g. Argon2id KDF, different AEAD, different framing) MUST
bump the version byte and the magic (`haiku-vault-v2.` …), and MUST NOT change
v1 decoding. Migration is a copy step: decrypt v1 → re-encrypt v2. This matches
the decision recorded in [`wiki-workspace-research-2026-10-15.md`](wiki-workspace-research-2026-10-15.md).

## 5 · BagIt profile for vault bundles

For transport/preservation together with companion material (standalone
decryptor, provenance notes, the payload’s source files), vaults travel as a
**BagIt 1.0 bag (RFC 8493)** — the house preservation format already used by
`docs/fna102b-xena-preservation.md` and `docs/geomate-gpx-preservation.md`:

```text
<vault-bag>/
  bagit.txt                     # BagIt-Version: 1.0 / UTF-8
  manifest-sha256.txt           # payload hashes
  tagmanifest-sha256.txt
  data/
    <name>.haikuvault           # the v1 blob (ASCII)
    decryptor.html              # standalone decryptor (optional but recommended)
    provenance.md               # origin of the plaintext payload
```

Bagging is for integrity and provenance; the **vault format already provides
confidentiality and authenticity** (GCM). A bag MAY therefore carry a vault in
the clear inside `data/`. If a policy requires at-rest separation, bag the
decryptor separately from the vault; do not invent a second encryption layer.

## 6 · Security considerations

- PBKDF2-HMAC-SHA256 @ 120k is the shipped v1 KDF; it is the floor of its era,
  not a claim of modernity. High-value payloads should use strong passphrases;
  a future Argon2id envelope is §4 work.
- GCM tag truncation is not supported. Random 12-byte IVs make per-file keys
  unique even under one passphrase.
- The magic prefix is visible metadata: it discloses *that* a vault exists and
  its format. Steganographic carriers (stegfs/tirdFS/shufflecake —
  [`backlog-execution-round-1-2026-10-21.md`](backlog-execution-round-1-2026-10-21.md))
  are the layer for hiding existence; not this format.
- JSON plaintext means payload structure leaks through length. Padding is out
  of scope for v1.

## 7 · IANA considerations

None. This document is an internal draft (`docs/` house series), not a submission.
The keyword capitalization (MUST/SHOULD/MAY) follows RFC 2119 semantics regardless.
