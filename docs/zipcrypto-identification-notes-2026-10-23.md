# ZIP legacy encryption (ZipCrypto) — identification notes (T1.2) — 2026-10-23

*Identification only. This note teaches recognition of legacy-encrypted ZIP
entries from their headers; per the house rule for cracking-adjacent
material (F4) it contains no password-recovery procedure. The companion
audit op is CyberChef's `paranoidUnzip` (central-directory walk); filename
garbling is covered by `docs/zip-garble-format-notes.md`.*

## Recognising a ZipCrypto entry
Traditional PKZIP encryption ("ZipCrypto") is declared entirely in the
headers — no payload inspection is needed to identify it:

| Signal | Where | Reading |
| --- | --- | --- |
| General-purpose flag **bit 0** set | local + central header | entry is encrypted |
| Compression method ≠ 99 | local + central header | method 99 would mean WinZip AES instead (see below) |
| Compressed size | headers | includes a **12-byte encryption header** prepended to the data |
| CRC-32 / sizes present (or zeroed with bit 3) | headers | zeros + flag **bit 3** ⇒ values live in a data descriptor after the data |

## The 12-byte header and the check byte
The encrypted stream opens with 12 bytes: 11 arbitrary bytes plus a
**check byte** that lets a decryptor reject most wrong passwords after
one byte instead of a full CRC pass. Which byte it must equal depends on
flag bit 3, and this is the classic implementation bug farm:

- **Bit 3 clear** — check byte = the **high-order byte of the entry's
  CRC-32**. Worked example: an entry whose plaintext is the ASCII string
  `123456789` has the catalogue CRC-32 check value `0xCBF43926`, so a
  ZipCrypto header for it must end in **`0xCB`**.
- **Bit 3 set** (sizes/CRC deferred to a data descriptor, typically by
  streaming writers) — the writer cannot know the CRC when the header is
  emitted, so the APPNOTE substitutes the **high-order byte of the DOS
  modification time**. Worked example: DOS time `0x7C21` ⇒ check byte
  **`0x7C`**. Readers that demand the CRC byte here reject valid
  streaming-produced archives, and vice versa.

## Telling ZipCrypto from WinZip AES at a glance
WinZip's AES extension never sets a normal method: the entry's method
field reads **99**, the real method and AES strength (128/192/256) live
in the **0x9901 extra field**, and the data opens with a salt (8/12/16
bytes by strength) plus a 2-byte password-verification value, with a
10-byte HMAC-SHA1 authentication code appended. Bit 0 is still set.
`paranoidUnzip` already labels method 99 as "aes (WinZip)" and reports the
encryption bits; strength/vendor detail comes from walking the extra
field, not from the data.

## Why the format is legacy (context, not a recipe)
ZipCrypto's keystream derives from three CRC-fed 32-bit registers keyed
by the password; Biham & Kocher published a known-plaintext attack
against it in 1994, and its effective strength has been considered
broken for archival purposes ever since. Consequences for this repo's
handling rules: treat ZipCrypto containers as *obfuscated, not
confidential*; do not store anything sensitive in them; prefer the
WinZip-AES form (or 7z-AES) when a ZIP-family container must actually
protect content. No attack tooling is documented here (F4).

## Identification checklist (what an auditor records)
1. Per entry: flag bit 0 (encrypted?), bit 3 (descriptor form?), method
   (99 ⇒ AES path; else ZipCrypto if bit 0), extra field 0x9901 present?
2. If ZipCrypto: which check-byte rule applies (CRC-high vs time-high) —
   decided by bit 3, never by guessing.
3. Add 12 bytes of encryption header to the expected data extent when
   auditing offsets; overlapping-range checks in `paranoidUnzip` already
   account for header-declared sizes.
4. Record, don't open: contents stay sealed in the audit workflow; an
   identification result is the deliverable.
