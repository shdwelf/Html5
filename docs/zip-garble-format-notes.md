# ZIP “garbled” archives: legacy format notes

S1 stream remainder (round 12) — companion to
[`arj-garble-format-notes.md`](arj-garble-format-notes.md), in the same
posture: this documents the *formats* behind “garbled” ZIP symptoms. It is
**not** a procedure for decrypting an archive you do not own (F4); the
KGK.ARJ/FNA102B preservation decision in
[`fna102b-xena-preservation.md`](fna102b-xena-preservation.md) governs that
corpus unchanged.

## 1. Two different “garbles”

Old ZIPs fail in two distinct ways, and the symptoms get conflated:

| Symptom | Cause | Where |
| --- | --- | --- |
| **Mojibake filenames** (`┌┬┐`-soup, `?`/`_` mangling) | code-page mismatch: names are OEM CP437/CP866/CP932 unless **general-purpose bit 11** says UTF-8 | DOS-era archives (the KGK lineage), WinZip ≤8, some Linux tools |
| **Garbage after a “correct” password** (or endless `incorrect password`) | legacy **ZipCrypto** verify-byte math + CRC32 keystream | any “traditional PKWARE encryption” zip (PKZIP ≤2.04, 1989–2000s) |

## 2. Filenames: the encoding garble

- Bit 11 (0x800) of the general-purpose flag = UTF-8 names (APPNOTE; widely
  honored since ~2006). **Absent** means “whatever the writer's OEM code page
  was” — CP437 is the safe default assumption, but Japanese/Korean/Russian
  archives need CP932/CP949/CP866 to un-garble.
- Info-ZIP handles it explicitly: `unzip -O CP437` / `-O CP932`; 7-Zip guesses.
- Interop hazard: tools that normalize names to UTF-8 *without* the flag
  rewrite the names irreversibly — keep the original bytes in preservation
  work (the Xena/bag-it rule from the KGK notes).

## 3. ZipCrypto — the legacy “garble” cipher (format facts)

“Traditional PKWARE encryption” (flag bit 0, no bit 6): PKZIP 2.0-era ZipCrypto.

- **Keys:** three 32-bit words K0/K1/K2 initialized from the password, updated
  per plaintext byte with `crc32(byte, K*)`; the keystream byte is derived from
  K2.
- **Encryption header:** 12 bytes prepended to each member. Check byte is the
  **12th (old PKZIP) or 13th (Info-ZIP/WinZip “verify”)** header byte compared
  against the high byte of the member CRC (or of the mod time in old variants).
  That is an **8-bit** check → **1/256 wrong passwords pass the verify byte**
  and then decompress to garbage — the literal “garbled archive with the right
  password” symptom. A CRC failure after a clean verify is the expected
  signature of a false accept, not of a corrupt zip.
- **Strength (for the record):** the cipher is the CRC32 primitive abused as
  a stream cipher — the classic known-plaintext result (Biham & Kocher 1994;
  Stay 2002 on the compression metadata fix) recovers the keys when ≥13
  known plaintext bytes exist (the encryption header provides 11 free bytes
  when any stored filename/extra field is known). Password-cracking tooling
  catalogued at recipe level only: John the Ripper `PKZIP` formats and
  hashcat modes for PKZIP/WinZip (see the
  [`john-test-vectors-audit`](john-test-vectors-audit) posture in
  `tests/john-test-vectors-audit.test.mjs` — published vectors, no targets).
- **Verification without cracking:** a *correct* password shows the 12th-byte
  check **and** clean CRC + valid inflate; document both in any triage note.

## 4. Strong-encryption variants (contrast)

- Bit 6 (0x20) = strong encryption; PKWARE 0x0014 (cert-based) vs **WinZip
  AES (AE-2/AE-3)** vs 7-Zip AES-256 — these are real ciphers; none of the
  §3 weaknesses apply. The `decompressor-recipe-matrix-2026-10-21.md` entries
  for `7z pkware` families point here.
- SFX/spanned quirks: `PK\x07\x08` (spanned/split marker) and self-extractors
  are the polyglot cases in
  [`polyglot-files-deep-dive-2026-10-21.md`](polyglot-files-deep-dive-2026-10-21.md) §2.

## 5. Triage recipe (offline, your own files)

1. `node tools/polyglot_scan.mjs <file>` — SFX/stub present? (`MZ` + later
   `PK` = parasite-or-stack).
2. List members without decrypting (`zipinfo -v`, 7-Zip `l`) — record flag
   bits 0/6/11, method, and the check-byte variant from the writer's
   version field.
3. Names garbled? Re-open with `-O CP437` (or the right page) — do not
   rewrite the archive.
4. Password-protected? Record verify-byte behavior only; preservation rule:
   no member decrypted without owner consent (F2 standing decision).

## 6. Provenance

PKWARE APPNOTE.TXT (local header layout, flag bits), Info-ZIP documentation
(`-O` code-page switch), Biham–Kocher 1994 / Stay 2002 (format-level
cryptanalysis summary), John/hashcat format registries (mode names only).
Cross-refs: [`arj-garble-format-notes.md`](arj-garble-format-notes.md),
[`arj-lha-ace-password-notes-2026-10-21.md`](arj-lha-ace-password-notes-2026-10-21.md),
[`decompressor-recipe-matrix-2026-10-21.md`](decompressor-recipe-matrix-2026-10-21.md).
