# LZMA2, ACE `-2`, filesystem boundaries, and Haiku Vault

**Status:** investigation/design note; this PR does not change the standard ACE
format or add an ACE encoder/decoder feature.

## Findings and scope

The Vault change in this branch uses the standard 7z container with its LZMA2
coder, as an optional, authenticated payload codec in a new `haiku-vault-v2.`
envelope. It is a separate format layer. It does **not** make an ACE archive,
claim ACE interoperability, or change the existing `haiku-vault-v1.` format.

ACE `-2` is an ACE blocked-compression mode whose observed Huffman/LZ77/Delta
behavior is documented separately in
[`ace-huffman-delta-luby-raptor-research-2026-11-07.md`](ace-huffman-delta-luby-raptor-research-2026-11-07.md)
and the independent archive-data CRC diagnosis in
[`ace-delta-history-crc-fix-2026-11-07.md`](ace-delta-history-crc-fix-2026-11-07.md).
The `-2` archive-data CRC-32 mismatch and CyberChef's ACE header CRC-16 check
are different failures and must remain separately diagnosed. A known source
patch for `ace-c` does not establish that a new compressor is bit-compatible
with ACE or with WinACE.

LZMA2 cannot be inserted into an ACE `-2` stream merely by changing an option:
that would change the compressed-data grammar, block boundaries, Huffman/delta
state, and interoperability contract. It would require a separately named
experimental format with a written specification, an implementation based on
observed mechanics, an independent expected-output vector, and a duplicate
check against this repository before code is added. None of those gates is
satisfied for an ACE/LZMA2 hybrid here, so no such codec or archive mode is
implemented.

## Safe layering for future work

1. **ACE compatibility boundary:** keep ACE parsing and the ACE `-2` encoder
   separate from 7z/LZMA2. Any ACE correction must retain the observed
   Huffman-delta mechanics and pass the existing independent vectors, archive
   tests, and relevant CRC regressions. Do not silently redefine standard ACE.
2. **Filesystem boundary:** an archive adapter should expose validated entry
   bytes to a caller; it should not mount or write an arbitrary host filesystem.
   Normalize names, reject absolute paths, traversal, links and duplicate
   normalized names, and enforce entry/count/size limits before writing into a
   private temporary tree. The Vault implementation uses the 7z library's
   in-memory filesystem and accepts exactly one `payload.json` output; it does
   not expose that temporary filesystem to callers.
3. **Vault boundary:** v2 authenticates the complete marker/codec/length/payload
   frame with AES-256-GCM before optional decompression. LZMA2 is compression,
   not encryption. The authenticated original length and a strict output limit
   are checked before parsing JSON. V1 remains untouched.

## Implemented here

- Opt-in v2 AES-GCM Vault envelope with raw JSON or a single 7z/LZMA2 member.
- Lazy use of a pinned local WebAssembly runtime; no CDN or network fallback.
- A maximum 16 MiB JSON output and 32 MiB archive, a fixed member name, and
  exact output-file validation.
- Separate notices/license files for the third-party 7z runtime.

## Not implemented or claimed

- No 7z-to-ACE conversion and no LZMA2 method inside standard ACE.
- No filesystem mount, virtual drive, host-path integration, or general-purpose
  archive extractor.
- No ACE Huffman, Delta, `-2`, or CRC behavior is changed by the Vault code.
- No user-data sync or transmission is added.
