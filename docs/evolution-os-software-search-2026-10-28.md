# Evolution OS — investigating lantronix.com, GitHub and archive.org for the software

Research date: 2026-10-28. Companion to `docs/evolution-os-ghidra-assembly.md`
(the Ghidra pipeline) and `js/lantronix-lab.js` (the device matrix).

**Question.** The previous record ended with "pipeline ready — no Evolution OS
image staged". This one goes looking for the software itself: what does
Lantronix publish at <https://www.lantronix.com/products/evolution-os/>, and
does GitHub or archive.org hold an Evolution OS firmware image or SDK that the
Ghidra pipeline could lawfully analyse?

## 1. The Lantronix page itself

The product page describes Evolution OS as Lantronix's "next-generation
Network Operating System for device servers":

- **Cisco-like CLI**, **XML-based configuration records**, **RSS** feeds,
  **AJAX web manager / HTTP server**, **SNMP v2c** (MIB-II), **syslog**, PPP.
- **Enterprise-grade security:** SSH and SSL built in; AES, 3DES, RC4 ciphers;
  SHA-1 and MD5 hashing. "Device servers with this operating system also
  cannot be used to bring down other devices on the network."
- **"Support for compressed firmware images"** and **flash wear leveling** —
  both matter below: the shipped images are compressed `.romz` files.
- **An SDK** "that exposes more modules", with custom MIB support.

Downloads on the page itself: exactly one file, the *Evolution OS Product
Brief* (`Evolution-OS-SDK.pdf`, 97 KB). No firmware, no SDK archive. The
"Related Products" panel points at **Evolution OS for xPort AR**, confirming
the OS spans the device-server families the Lantronix Lab matrix lists. The
real software channel is therefore not this page — it is the support FTP the
page's ecosystem points to, which is where archive.org comes in.

## 2. GitHub — essentially nothing, and that is a finding

- Repo search (`Lantronix Evolution OS`, `Evolution OS firmware lantronix`,
  `lantronix firmware`, `DSTni`, `evolution os sdk`): **no firmware, no SDK
  mirror**. The two `lantronix xport` hits are `morkai/walkner-tools` (3★,
  MIT) and `gtortone/XPort-ioc` (1★).
- `morkai/walkner-tools` is helper tooling (e.g. `lantronix-burn-image.js`)
  for **the XPort Pro Linux SDK 2.0.0.x** on µClinux — useful for the Linux
  part numbers, explicitly **not** Evolution OS.
- Code search (`"Evolution OS" xport`, `"romz" lantronix`): the only relevant
  hits are **this repository's own files**. Nobody on GitHub is mirroring
  Evolution OS images or documenting the `.romz` container in code.
- The official `Lantronix` org publishes newer-product code (`xpw-jslib`,
  `meta-lantronix`, `yocto-premierwave`, Percepxion MCP server…). No
  Evolution OS repository.

**Verdict:** GitHub cannot supply the binary. Anyone claiming a GitHub
Evolution OS SDK mirror is pointing at the Linux SDK.

## 3. archive.org — yes: the firmwarelibrary mirror of the Lantronix FTP

An advancedsearch for `(lantronix) AND (evolution OR firmware OR xport)`
returns **212 items**, most uploaded 2024-05-17 into the `embeddedfirmware` /
`firmwarelibrary` / `softwarecapsules` collections by a third-party uploader
(`timonheu+archive@gmail.com`), one ZIP per Lantronix release. The same
releases are listed on the official server
`https://ts.lantronix.com/ftp/XPort-Pro/` — 5.5.0.2R5, 6.0.0.0R5, 6.0.0.1R2
(2021-07-02), 6.0.0.3R1 (2022-11-29), 7.0.0.0R2 (2024-04-15), 7.1.0.0R1
(2025-06-05), plus a separate `Linux/` directory, which is exactly the
Evolution-vs-Linux split the part numbers encode.

**Proof these are Evolution OS, not Linux:** Lantronix PCN-728
(FM-196 Rev. S, 2021-06-29) announces "XPORT PRO Firmware version 6.0.0.1R2"
for **XPP1002000-02R / XPP100200S-02R** — the Evolution OS part numbers — and
Lantronix support ("Latest firmware for the XPort Pro Evolution") names
**v7.1.0.0R1** as the current Evolution release.

| Item (archive.org identifier) | Version | ZIP in item | Provenance |
| --- | --- | --- | --- |
| `Lantronix_XPort-Pro_6.0.0.1R2_136c8` | 6.0.0.1R2 | `136c8005….zip`, 637,761 B, MD5 `136c8005c1aacd8734ed0f621ec73383`, SHA-1 `9fac545077eb1a95f50cbeb23c40ba381931d60c` | PCN-728: Evolution part numbers |
| `Lantronix_XPort-Pro_7.0.0.0R2_7769a` | 7.0.0.0R2 | `7769a2f3….zip`, 638,418 B, MD5 `7769a2f3359905a3fccb15e2f5b4216f`, SHA-1 `b6f25081807f1957fab9ca78bff31045e8bac73b` | Newest mirrored Evolution release |
| `Lantronix_XPort-Pro_5.5.0.2R5_8eb4f`, `_6.0.0.0R5_51e0f`, `_6.0.0.3R1_726b1` | 5.5.0.2R5 / 6.0.0.0R5 / 6.0.0.3R1 | one ZIP each | Same mirror; 6.0.0.0R5's FTP twin names the payload (below) |
| `Lantronix_matchport-ar_6.0.0.1R2_7737b` | 6.0.0.1R2 | one ZIP | MatchPort AR UG rev F is the 6.0.0.1R2 update |
| `Lantronix_eds1100_2100_6.0.0.0R1_ca0f3` (+ duplicate `_e647d`) | 6.0.0.0R1 | one ZIP | EDS1100/2100 Evolution line |
| `Lantronix_XPort-05_6.10.0.3_49aca`, `Lantronix_XPort-AR_5.2.0.0-R21_3bda9` | 6.10.0.3 / 5.2.0.0 | one ZIP | The 16-bit x86 (DSTni-EX) Evolution targets |

Each ZIP has `filecount: 3`; the official 6.0.0.0R5 directory shows what the
three files are: `md5sum.txt`, the release notes, and the firmware itself —
`xport_pro_6_0_0_0_R5.romz` (622,761 bytes).

## 4. The remaining blocker is named now: `.romz`

Evolution firmware ships **compressed**: Lantronix's own upgrade notes move
from `.rom.gz` (the one-time 4.0.0.0 bridge) to `.romz` for all later
releases, with a separate bootloader image (`eds4100boot.romz`,
`edsprboot.romz`, …); a DeviceInstaller log quoted on the Lantronix forums
says it outright: `Load Type: EOS … Rom Compressed: True`. The vendor page's
"support for compressed firmware images" is this feature.

No public `.romz` decompressor surfaced in GitHub code search or the web
searches run for this record. So the honest state is one step better than
before, not done:

- **Before:** no image anywhere. **Now:** hash-recorded Evolution images are
  staged candidates (`FIRMWARE_CANDIDATES` in
  `tools/evolution-os/evolution-os.mjs`), dual-sourced from archive.org and
  the official FTP.
- **Next step:** unzip a candidate, identify the `.romz` compression (magic
  bytes first — the Lantronix Lab triage panel reads containers), inflate it
  to the ColdFire payload, and only then feed Ghidra
  `68000:BE:32:Coldfire`. Feeding the compressed container to Ghidra would
  manufacture the "confident garbage" the assembly record warns about.

Provenance note: the firmware is Lantronix-proprietary. The runner workflow
keeps the downloaded image on the runner and commits only derived
static-analysis reports — that boundary stays.

## 5. What changed in the repo

- `tools/evolution-os/evolution-os.mjs` — `FIRMWARE_CANDIDATES` (target,
  version, archive.org identifier, direct ZIP URL, ZIP MD5/SHA-1/size,
  official-FTP twin, status), printed in the assembly and the `--json`
  manifest; covered by `tests/evolution-os.test.mjs`.
- `docs/evolution-os-ghidra-assembly.md` — regenerated; now lists the
  candidates and the exact `tools/urln/ln` staging command.
- `.github/workflows/evolution-os-ghidra.yml` — staging now unpacks a ZIP
  candidate and selects the firmware payload before the Ghidra step.
- This record, carried into Wiki in a Jar like the rest.

## 6. Continued 2026-10-28: inside the archive.org ZIPs

The mirror can be inspected **without downloading the binary**: archive.org's
view-archive endpoint lists ZIP contents, and the small text members can be
read individually. Doing that for the two lead candidates settles what the
runner will actually receive:

| Item | Member (FTP path preserved) | Size | Vendor MD5 (`md5sum.txt`) |
| --- | --- | ---: | --- |
| `Lantronix_XPort-Pro_6.0.0.1R2_136c8` | `ftp/XPort-Pro/6.0.0.1R2/xport_pro_6_0_0_1_R2.romz` | 623,002 B | `7c996f6ea2d07625012a98e748cad759` |
| same | `…/xport_pro_6_0_0_1_R2_User_Release_Notes.txt` | 14,147 B | — |
| `Lantronix_XPort-Pro_7.0.0.0R2_7769a` | `ftp/XPort-Pro/7.0.0.0R2/xport_pro_7_0_0_0_R2.romz` | 623,434 B | `c0e1fbdc9011783e3a9644bdcf5aa9ae` |
| same | `…/xport_pro_7_0_0_0_R2_User_Release_Notes.txt` | 14,372 B | — |

The 6.0.0.1R2 release notes close the provenance loop in the vendor's own
words: the document is titled **"Lantronix Evolution Device Server Software —
Software Release Notes"** (2021-06-09) and lists `xport_pro_6_0_0_1_R2.romz`
as the released firmware file, with the same bug-fix set PCN-728 announces
(`+++AT` modem-mode handling, SSL handshake leak, SNMP off by default). The
CLI reference (`xport_pro_cli_6_0_0_1_R2.html`) is named in the notes but is
not a ZIP member — only the `.romz`, notes and `md5sum.txt` ship in the
mirror, matching the official FTP directory listing for 6.0.0.0R5.

**Census, widened.** `collection:firmwarelibrary AND creator:Lantronix`
holds **195 items**; the XPort / xPico / MatchPort / EDS subset alone is
**83 items** (5.5.0.2R5 → 7.0.0.0R2 for XPort Pro; MatchPort AR 5.1.0.0 and
6.0.0.1R2; eds1100_2100 6.0.0.0R1/R5 and 6.0.0.1R2; EDSxPR/EDSxPS and EDS4100
lines; XPort-01/03/04/05, XPort485, xpico/xpico110 for the 16-bit x86
targets). There is no shortage of Evolution OS images to analyse — every one
of them waits on the same `.romz` step. Follow-up searches for a public
`.romz` unpacker (GitHub code search, web) again found none; Lantronix's own
pages only confirm the container is compressed and that the one-time bridge
to 4.x was `.rom.gz`, suggesting — not proving — a gzip-family container for
the earliest images. The next experiment is therefore concrete and cheap:
on the runner, stage candidate 6.0.0.1R2, read the `.romz` magic bytes
(the workflow now prints them), and test gzip/zlib/raw-deflate inflation
before invoking Ghidra.

**To run the real disassembly after `.romz` inflation is solved:** dispatch
`evolution-os-ghidra.yml` with the candidate URL (or commit
`.arena-relay/evolution-os-ghidra.txt`), and the assembly record's Reports
table replaces "None yet" with the image's real fingerprint.
