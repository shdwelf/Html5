# FIRST NAME ALMANAC v1.02b — Xena-inspired preservation of the Kirkpatrick shareware archive

*2026-10-17 · `tools/build_fna_xena.mjs` · `npm run build:fna-xena`*

## What is preserved

The container is the shareware archive already bundled and provenance-recorded in this
repository: `samples/archive/kirkpatrick/FNA102B.ZIP` (556,030 bytes, SHA-256
`341271dbce5aa7ed864fd9fd2d9fd41c1c17f2ccaf524178ac945ad1e9d94caf`, from
[archive.org](https://archive.org/download/FNA102B_ZIP/FNA102B.ZIP) — see
`samples/archive/PROVENANCE.md`). The builder **refuses to run** if that hash drifts.

| Member | Bytes | ZIP CRC-32 | Treatment |
| --- | --- | --- | --- |
| `INSTALL.COM` | 3,988 | `FEFC50AA` | preserved verbatim + Ghidra-WASM static rendition |
| `FILE_ID.DIZ` | 450 | `CC586221` | preserved verbatim + CP437 → UTF-8 rendition |
| `SYSOP.DOC` | 1,970 | `A56D5EB7` | preserved verbatim + CP437 → UTF-8 rendition |
| `MEANINGS.OVL` | 275,968 | `9F51D53E` | **retained in place** — referenced by SHA-256 only |
| `NAMES.OVL` | 275,799 | `5B75FCA3` | **retained in place** — referenced by SHA-256 only |

The two `.OVL` files are the halves of a split ARJ archive (revision 4) whose members carry the
GARBLED flag — the author's password transform over a commercial name database. They are read,
format-identified, hashed and catalogued, then left alone: **no member was decrypted, no garble key
was sought, and no name data was copied.** The redistribution notice inside `SYSOP.DOC` permits use
"only … in its ORIGINAL FORM" with all copyright notices and files in place. The standing decision
and its provenance are recorded in the *KGK.ARJ inspection* section of
[`greeran-family-tree-ebook-and-data-status.md`](greeran-family-tree-ebook-and-data-status.md).

## Format — Xena-inspired, not native Xena

Following the house pattern in `docs/geomate-gpx-preservation.md` and
`docs/virus-encyclopedia-xena-preservation.md`, the output is a **BagIt 1.0** bag (RFC 8493) with
SHA-256 payload and tag manifests:

```
dist/fna102b-xena/
  bagit.txt
  manifest-sha256.txt                 # payload hashes (9 files)
  tagmanifest-sha256.txt              # tag-file hashes
  data/
    original/INSTALL.COM              # source object, byte-identical
    original/FILE_ID.DIZ              # source object, byte-identical
    original/SYSOP.DOC                # source object, byte-identical
    original/fna102b-zip-manifest.json
    normalized/install-com-ghidra.txt # MZ header + strings + Ghidra decompilation
    normalized/file-id-diz.txt        # CP437 -> UTF-8
    normalized/sysop-doc.txt          # CP437 -> UTF-8
    normalized/fna102b-catalog.xml    # app-defined rendition (urn:shdwelf:html5:fna-preservation:1)
    normalized/fna102b-catalog.json
  metadata/
    preservation-event.json           # the normalization event + exclusions
```

The normalized schema is **application-defined**. This is Xena-inspired in the limited sense the
other preservation work uses: it retains source objects, creates documented renditions, and records
a preservation event. It is **not processed by Xena** (the National Archives of Australia tool) and
is **not a native `.xena` object**; it has not been opened in a real Xena installation. The output
directory is `dist/`, which is gitignored, so no bag bytes enter the repository.

## INSTALL.COM — static analysis

Analysis is static only. `tools/decompile_mz.mjs` runs the vendored **Ghidra WASM** decompiler over
the image with the `x86:LE:16:Real Mode` SLEIGH spec; the DOS code is never executed, and no JVM or
network is involved.

Recorded in `normalized/install-com-ghidra.txt`:

- **MZ header** — `pages=8`, `lastPageSize=404`, header 2 paragraphs, `minAlloc=maxAlloc=0x846`,
  `ss:sp=0x101:0x80`, entry `cs:ip=0xD3:0x10`, load module 3,956 bytes.
- **Checksum** — `tools/exe_triage.py` reports stored `e_csum 0xE3EF` vs computed `0xE3F0`: a
  mismatch, i.e. patched, packed, or zeroed by a linker.
- **Packer probe** — `tools/pklite.py info` reports *not PKLITE-compressed*. The entry stub does
  carry an integrity-check error path that prints `Packed file is corrupt` then `INT 21h` /
  `exit(0xFF)`, so the load module has a self-checking prologue whose packer was **not identified**.
  The stub was deliberately **not unpacked** (see *Not done* below).
- **Strings** — 23 printable runs. The installer identifies itself as `KIRKPATRICK BROS` /
  `INSTALLATION PROGRAM`, asks `INSTALL TO WHAT DRIVE?`, then drives `COMMAND.COM` with
  `ECHO OFF`, `COPY/B MEANINGS.OVL+NAMES.OVL …`, `KGK.EXE`, `cd\almanac`, and writes
  `\ALMANAC\CONFIG.NAM` and `\ALMANAC\COPYRITE.NAM`.
- **Entry point** — the Ghidra decompilation of `0x10d40` is a short backward byte-copy loop
  preceded by `*(int2 *)0x4 = ES + 0x10`, consistent with a prologue that relocates or verifies the
  image before handing over to the real installer body.

No garble key appears in the plaintext string table. The invocation template at offset 3022 reads
`KGK -Y -g`, with the key supplied at runtime rather than stored as a visible string.

## Registration mechanism — what the installer checks

Recorded because it was asked, and because the answer is that there is nothing
to find.

`REGISTER.NAM` is **not a member of `FNA102B.ZIP`.** The ZIP has exactly five
members (`INSTALL.COM`, `MEANINGS.OVL`, `NAMES.OVL`, `FILE_ID.DIZ`,
`SYSOP.DOC`). `REGISTER.NAM` is garbled member 15 of `KGK.ARJ` — 2,359 bytes,
CRC `CBC41884`, modifier `0x00` — and it is a `.NAM` text document in the same
family as `SYSOP.NAM`, `VENDOR.NAM`, `DOCS.NAM`, `CONFIG.NAM` and
`COPYRITE.NAM`. It is a registration form, not code. There is nothing in it to
disassemble.

A token scan of the full 3,988-byte `INSTALL.COM` image for `serial`, `key`,
`valid`, `regist`, `expire`, `trial`, `licen` and `password` (both cases)
returns **zero hits for every one of them.** The installer performs no
credential check of any kind. Its batch-file template, read out of the image at
offsets 2955–3125, is:

```bat
ECHO OFF
COPY/B MEANINGS.OVL+NAMES.OVL KGK.EXE
KGK -Y -g<password>
cd\almanac
:: writes \ALMANAC\CONFIG.NAM and \ALMANAC\COPYRITE.NAM
:: "To Start FIRST NAME ALMANAC type: NAMES"
```

So the two `.OVL` halves are concatenated into `KGK.EXE` — a self-extracting
ARJ — which is then invoked with `-Y` and `-g<password>`. The password is the
only credential in the entire distribution, and it is a runtime argument, not a
computed value.

**There is no key algorithm in the shipped software, so there is no keygen to
write or find.** The registration artefact was a password the vendor mailed to
the registrant: `SYSOP.DOC`, which is in the clear in this ZIP and preserved in
the bag, gives the route as $49.95 to Kenneth G. Kirkpatrick, P.O. Box 981,
Taft CA 93268-0981, CompuServe 72712,3156.

The only place a serial or licence check could plausibly live is `NAMES.EXE`
(269,124 bytes), which is itself a garbled member of `KGK.ARJ` and cannot be
examined. That is the same blocker as the rest of the archive, and it is not
worked around here.

## A provenance cross-check with KGK.ARJ

The ZIP's own CRC-32 values confirm which documents the two archives share:

| FNA102B.ZIP member | ZIP CRC-32 | KGK.ARJ member | ARJ original CRC |
| --- | --- | --- | --- |
| `FILE_ID.DIZ` (450 B) | `CC586221` | `ALMANAC/FILE_ID.DIZ` (osize 450) | `CC586221` |
| `SYSOP.DOC` (1,970 B) | `A56D5EB7` | `ALMANAC/SYSOP.NAM` (osize 1970) | `A56D5EB7` |

Identical CRC-32 **and** identical length: these are the same two documents, and both are already
readable in the clear inside the ZIP. That is why the preservation bag can carry them verbatim
without touching the garble — and why nothing about the encrypted name data changes either way.

## Version note — 1.02a vs 1.02b

The request named `FNA102A.ZIP`. The repository holds **`FNA102B.ZIP`** (v1.02b) and the sandbox has
no route to fetch 1.02a, so the bag was built from 1.02b. Pointing the builder at 1.02a is a
two-line change (`ZIP_REL` and `ZIP_SHA256` at the top of `tools/build_fna_xena.mjs`); the analysis,
renditions and bag layout are unchanged. Until then the bag should be cited as **v1.02b**, and the
1.02a container remains unexamined.

## Not done, deliberately

- **No ARJ member was decrypted**, and no garble key was derived, guessed, or searched for.
- **The installer's self-checking stub was not unpacked.** `tools/pklite.py unpack` exists and
  `INSTALL.COM` is not PKLITE, so this would have needed the packer identified first; the only thing
  an unpacked installer yields in this context is the runtime garble key, which is the thing the
  standing decision keeps out of reach.
- **No name data was added** to `greeran-family-4dwm.ged`, `greeran-family-4dwm.html`, or any other
  app. The user-initiated NameAlmanac/Wiktionary lookups remain the licensed path for name data —
  see [`greeran-name-resources.md`](greeran-name-resources.md).

## Build and verify

```sh
npm run build:fna-xena                 # writes dist/fna102b-xena/
node --test tests/fna-xena.test.mjs    # BagIt structure, manifests, exclusions
```

The test builds the bag into a temp directory, verifies every payload and tag manifest hash against
the bytes on disk, asserts that the two GARBLED volumes' SHA-256s appear **nowhere** in the bag and
that no payload file exceeds 16 KB, checks the Ghidra rendition carries real decompiler output, and
confirms the preservation event declares both the Xena relationship and the exclusion list.
