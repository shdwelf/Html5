# Haiku Vault v2 — opt-in format draft

Status: implemented as an opt-in browser export/import format. The existing v1
format, exporter, and standalone v1 decryptor remain unchanged.

## Text envelope

A v2 file is UTF-8 text:

```text
haiku-vault-v2.<base64(salt || IV || ciphertext-and-GCM-tag)>
```

- `salt`: 16 random bytes.
- `IV`: 12 random bytes, generated independently of the salt.
- `ciphertext-and-GCM-tag`: AES-256-GCM encryption/authentication output.
- Base64 is standard padded Base64; whitespace around the complete file is
  ignored by import.

The key is derived from the Ensō ID (UTF-8) with PBKDF2-HMAC-SHA256, 120,000
iterations, and a 32-byte output. This deliberately retains the v1 key schedule;
it is not a claim that the work factor is adequate for arbitrary human
passphrases.

## Authenticated plaintext frame

The entire frame is encrypted and authenticated by GCM. Its fixed header is
nine bytes:

| Offset | Length | Meaning |
|---:|---:|---|
| 0 | 4 | Magic bytes `48 56 32 00` (`HV2\0`). |
| 4 | 1 | Codec ID: `0` = raw JSON UTF-8; `1` = one-member 7z archive using LZMA2. |
| 5 | 4 | Original JSON byte length, unsigned big-endian. |
| 9 | variable | JSON bytes for codec 0, or the 7z archive bytes for codec 1. |

The marker, codec, original length, and payload are all inside the authenticated
ciphertext. Import authenticates before inspecting or decompressing the frame.
For codec 0, the payload length must equal the header length. For codec 1, the
archive must contain exactly one regular file named `payload.json`; its
extracted byte length must match the authenticated header before UTF-8/JSON
parsing.

## Compression selection and limits

- The UI offers an explicit v2 export. It requests `auto`: create a 7z/LZMA2
  member and keep it only when the archive is smaller than the raw JSON. A
  no-compression v2 frame is used otherwise.
- The library also has `none` and `lzma2` modes for interoperability tests and
  callers that explicitly require the LZMA2 codec. The unchanged default is
  7z/LZMA2 effort 5 with an 8 MiB dictionary request. Callers can pass
  `lzma2Level: 0..9`; level 0 still emits a valid LZMA2 member in the pinned
  7zz build, **not** a claim that Vault codec ID 0 was selected.
- `deltaDistance: 1..256` is an **opt-in** standard 7z Delta prefilter before
  LZMA2, only when compression is enabled. It is intended for suitable
  structured data; it does not guarantee smaller JSON. Invalid levels or
  strides are rejected rather than truncated. The default UI remains `auto`
  with no Delta filter.
- Maximum uncompressed JSON: 16 MiB. Maximum 7z archive: 32 MiB.
- The WebAssembly runtime is pinned as `7z-wasm@1.2.0`, copied into local app
  assets by `scripts/build-7z-wasm-assets.mjs`, and loaded lazily only for v2
  LZMA2 work. There is no CDN or network fallback.
- The codec notice and upstream license texts are in
  [`public/licenses/7z-wasm/`](../public/licenses/7z-wasm/).

**Compatibility/version plan.** Level and Delta settings live inside the
standard single-member 7z archive, under the existing authenticated codec ID 1;
the nine-byte v2 frame is unchanged. The pinned 7zz decoder handles both the
old LZMA2-only archive and the new optional Delta+LZMA2 chain. The reader now
rejects other 7z methods under ID 1 before extraction. A future new compressor
(e.g. Huffman-coded ZIP/DEFLATE) would need its own explicitly negotiated codec
ID or a new envelope version, plus old/new-reader tests: neither the ZIP writer
nor ACE's Huffman patch is silently substituted here. The repository's Luby
Transform (LT) is **erasure recovery for transport**, not compression; placing
LT packets inside this v2 frame would change its grammar and reader contract,
so this change leaves LT outside Vault. A regression test separately applies
existing LT packets to an **already encrypted** synthetic v2 file, drops 25%
of packets, reconstructs the exact bytes and authenticates/decrypts the vault;
that test is not a new Vault packet format or a general recovery guarantee.
LZMA2 itself uses range coding, not a Huffman stage that can be toggled on by
raising its effort level.

To evaluate sizes without any private Vault content, run
`node tools/bench-vault-v2-codecs.mjs --json`. It verifies reconstructed bytes
and SHA-256 on three seeded/synthetic JSON corpora across all ten LZMA2 effort
settings, with and without Delta at levels 5 and 9, and compares standard
ZIP/DEFLATE separately. This is a size study, **not** a speed/security claim.

The generated standalone HTML decryptor is a v1 tool. V2 import currently runs
inside the offline-capable application, which includes the local JS/WASM codec
assets; do not label the v1 standalone page as a v2 decryptor.

## Security and compatibility notes

- The version prefix is a dispatch label, not a security boundary. The v2
  marker/codec/length are authenticated inside AES-GCM.
- A wrong password, altered header, altered ciphertext, or altered archive
  fails authentication or validation; decompression is not attempted before
  successful GCM authentication.
- The codec is not a cipher. LZMA2 is used only for compression inside the
  authenticated v2 frame.
- V1 is still the default legacy export and retains its historical format and
  behavior. V2 is opt-in; imports dispatch by prefix.
- Vault files are local user data. This code does not upload, sync, or log their
  contents.
