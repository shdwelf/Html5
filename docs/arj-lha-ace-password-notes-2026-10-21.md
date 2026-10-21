# ARJ / LHA / ACE password & SFX notes — cookbook level (21 Oct 2026)

*Backlog round 6, stream **S1** (“password recipes at cookbook level” for the
decompressor line). Companion to [`arj-garble-format-notes.md`](arj-garble-format-notes.md)
and [`decompressor-recipe-matrix-2026-10-21.md`](decompressor-recipe-matrix-2026-10-21.md).*

**Scope and constraints (standing flags):** **F2** — garbled/encrypted artifacts
are preserved and inspected only (see
[`fna102b-xena-preservation.md`](fna102b-xena-preservation.md)); nothing here
decrypts a member of any real archive. **F4** — recipe/notes level only: this is
*how the formats implement password features and how to recognize them*, with
identification and verification recipes. No cracking procedures, no wordlists,
no bypasses.

## 1. ARJ: "garbling" (format-level XOR)

ARJ never calls it encryption. The flag is `GARBLED_FLAG` (main-header flags bit
0x01), the switch is `-g`, and Robert Jung's documentation says *garbling* — a
word that does not claim cryptographic strength
([format notes](arj-garble-format-notes.md), verified against the KGK.ARJ main
header; corroborated by the modern ARJ summary at
[Grokipedia](https://grokipedia.com/page/ARJ): "a simple XOR-based method
'garbles' the archive headers and compressed data streams using a repeating key
derived from the user-supplied password").

| Item | Recipe-level fact |
| --- | --- |
| Identify | main header `flags & 0x01` (`arjwalk.py` / `archive_inspect.py` decode the field) |
| Mechanism | XOR of header + compressed stream with a repeating keystream derived from the password |
| Verify | decompress with the candidate password and compare the stored CRC16/CRC32 of the member |
| Constraints | F2 preserve-only for real garbled bags; F4 no cracking recipes |

Because the stream is XOR-based and the format has known structure (method bytes,
dictionary control words), known-plaintext relationships exist — that is an
analysis *observation*, and studying it on real bags stays inspection-only.

## 2. LHA / LZH: there is no first-party encryption to study

The LHA format (LHarc → LHa, Haruyasu Yoshizaki) **has no encryption field and no
password mode**. Every first-party source agrees: the translated `lhx.doc` header
specification ([jca02266/lha `header.doc.md`](https://github.com/jca02266/lha/blob/master/header.doc.md))
describes level-0/1/2 headers, method IDs `-lh0-`…`-lh7-`, `-lzs-`, and a header
checksum — nothing else; `lhasa`'s `lha.1` documents every option and has no
password switch; format references list encryption as unsupported.

Cookbook consequence: when a `.lha/.lzh` is advertised as "password protected",
the crypto is **not in the LHA format** — it is a third-party wrapper, an SFX
stub, or a mislabeled different format. Identification recipe:

| Step | What to check |
| --- | --- |
| 1 | Level-0/1 header: `size, checksum, "-lh?-"/"-lzs-" method ID …`; level-2: total-size-first variant |
| 2 | Member integrity = CRC16 of the *uncompressed* data (the only verifier) |
| 3 | If extraction "asks for a password", you are no longer looking at plain LHA — inspect the stub with the SFX recipe (§4) |

## 3. ACE: Blowfish-160, one SHA-1, zero IV, no verifier

ACE (Marcel Lemke / e-merge) is the one format in this line with real cipher
material. The published v1.2 technical specification (`ace-doc.txt`, Lemke, May
1998 — mirrored at
[darbinding.sourceforge.net/specs/ACE.txt](https://darbinding.sourceforge.net/specs/ACE.txt))
defines the block format and `HEAD_FLAGS`; the encryption design is described
precisely by the independent `acefile` docs
([apidoc.roe.ch/acefile](https://apidoc.roe.ch/acefile/latest/)) and corroborated
by the ace-c reimplementation and format summaries:

| Item | Recipe-level fact |
| --- | --- |
| Identify | MAIN block signature `**ACE**` at offset 7 of the main header; `HEAD_FLAGS` **bit 3** = encrypted (archive- or per-member-level) |
| Key schedule | password (≤ 50 chars) → **single SHA-1 application** → 160-bit Blowfish key; the "ACE-flavoured Blowfish" variant keeps Schneier's π-derived P/S tables but uses ACE's own key schedule, 8-byte block padding, reverse-order subkey walk on decrypt ([ace-c notes](https://github.com/seb3773/ace-c)) |
| Data | Blowfish **CBC with a constant zero IV**, applied to the compressed stream *after* compression, each archive member restarted separately |
| Verify | **none in the format** — no salt, no password verifier; the only check is CRC32 of the decompressed data after a successful decrypt (`acefile`; inverted CRC-32 poly `0x04C11DB7`, headers use a truncated CRC16) |
| F4 observations | constant IV + per-member CBC restart + no verifier are design flaws the independent docs call out; they are recorded here as *format study*, not as an attack recipe |

SFX footnote with real-world impact: extraction of ACE SFX historically went
through `unacev2.dll`, which carried a path-traversal bug exploited in the wild
(**CVE-2018-20250**); WinRAR dropped ACE support entirely in 5.70 (2019). Treat
found `.ace`/SFX samples as hostile input to any tool chain — same posture as the
virus-encyclopedia entries.

## 4. SFX identification recipe (which format is the stub hiding?)

Self-extracting archives = small DOS/Win stub + a normal archive after it. Recipe:
run the stub through `tools/archive_inspect.py` / `tools/arjwalk.py`, then scan
for the format signature and apply the per-format notes above.

| Signature (bytes) | Format | Password behaviour |
| --- | --- | --- |
| `60 EA` (header id, repeats per header) | ARJ | garble flag `flags&1` → XOR garble (§1) |
| `2D 6C 68 ? 2D` = `"-lh?-"/"-lzs-"` (method ID at hdr+2) | LHA | none in format (§2) |
| `2A 2A 41 43 45 2A 2A` = `"**ACE**"` at main-header offset 7 | ACE | `HEAD_FLAGS` bit 3 → Blowfish (§3) |
| `50 4B 03 04` / `50 4B 05 06` | PKZIP | legacy "garble"/ZipCrypto (see [encyclopedia](software-protection-encyclopedia.md#arj-and-pkzip-archive-formats-not-protection-bypasses)) |

Stubs themselves can be packed/overlaid (PKLITE, LZEXE — see
[`exe-protection-deep-dive.md`](exe-protection-deep-dive.md)); identify the stub
first, the embedded archive second.

## 5. What is verified vs. reported

- **Verified in-house:** ARJ main-header garble-bit decoding against KGK.ARJ
  ([`arj-garble-format-notes.md`](arj-garble-format-notes.md)); LHA header
  structure against `header.doc.md`; the identification recipes above are
  exercised by `tools/archive_inspect.py`/`arjwalk.py` over fixture data.
- **Reported from cited sources:** ACE Blowfish/SHA-1/zero-IV design (`ace-doc`,
  `acefile`, `ace-c`), CVE-2018-20250, ARJ XOR-summary corroboration.
- **Not done (by design):** decryption of any garbled/encrypted member, password
  recovery procedures, or bypass tooling (F2/F4).
