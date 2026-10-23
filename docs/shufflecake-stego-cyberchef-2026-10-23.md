# Shufflecake, steganography, and CyberChef — S9 research note

*2026-10-23 · backlog T9.1 · desk research + audit of the repository's own
CyberChef build. Nothing installed; Shufflecake is a Linux kernel module and
is documented here, not run.*

## Shufflecake in one paragraph

Shufflecake (Anzuoni & Gagliardoni, Kudelski/EPFL; ACM CCS 2023,
arXiv:2310.04589, ePrint 2023/1529) is a plausible-deniability storage layer
for Linux: a device-mapper target (**dm-sflc**) plus a userland CLI that
multiplexes one block device into up to **15 hidden volumes**. Volumes are
allocated as encrypted *slices* at random offsets, indistinguishable from
random fill; a 60 MiB-class header holds one slot per volume, each slot
encrypted under its own password and recursively containing the key of the
*less hidden* volume below it, so one password opens a volume and everything
less secret than it. It is the spiritual successor to TrueCrypt/VeraCrypt
hidden volumes, fixing their two structural limits (one hidden volume,
filesystem baked in) — any filesystem can be created on an opened
`/dev/mapper/sflc_X_Y` device. Crypto is AES with Argon2 key derivation,
with a single-snapshot security proof.

## The caveats that matter operationally

- **Corruption trap.** If you open only some volumes, dm-sflc cannot know
  the closed volumes' slices are occupied and may allocate them to an open
  volume, silently overwriting hidden data. The project's own guidance:
  always unlock the *most* sensitive volume for routine use; surrender a
  decoy password only under coercion. Plausible deniability here is an
  operational discipline, not a checkbox.
- **No multi-snapshot protection** (same weakness as TrueCrypt): an
  adversary with two disk images can see "free" slices change and infer a
  still-hidden volume. The paper discusses mitigations (virtual quotas,
  dummy writes) as extensions, not shipped guarantees.
- **Platform:** Linux only, tested on Debian/Ubuntu-class systems; the
  current C implementation lives on Codeberg (`shufflecake/shufflecake-c`).
  There is no webxdc/browser expression of this — a kernel block layer
  cannot be approximated by a CyberChef recipe, and pretending otherwise
  would misstate the security properties. **Decision: document, don't port.**

## Steganography → CyberChef (repo audit)

Task asked for "Shufflecake + steganography → CyberChef". Shufflecake itself
doesn't map (above), but the steganography half has a concrete home: the
repository's CyberChef build (`public/apps/cyberchef/index.html`) already
carries a custom stego op family and a spotlight recipe —

| Op | What it does | Grade |
| --- | --- | --- |
| `stegoLSB` | LSB encode/decode demonstration; red-channel LSBs, 8-bit grouping, `0xFF` terminator | demo-grade: generates a *synthetic* image; real files need a raw pixel buffer the current op doesn't ingest |
| `stegoSpace` | whitespace steganography | working text op |
| `stegoHide` / `stegoReveal` | hide/reveal pair used by the lab | working text op |
| `stegoAcro` | acrostic (first letters of words) | working text op |
| recipe "Spotlight — Steganography lab (LSB · whitespace · hide/reveal)" | chains the above | shipped |

Honest gap, recorded rather than papered over: **real-image LSB extraction**
(drop a PNG, read pixels, walk channels/bit-planes in order) is the one
stego capability the lab lacks — the op explains the mechanism instead of
performing it on user files. That is the correct next build if this stream
continues: a pixel-ingesting variant (canvas-decoded input, selectable
channel order and bit depth, length-prefixed as well as terminator framing),
with test vectors generated in-repo. Until then the lab teaches the
mechanism without claiming forensic capability.

## Relation to the vault work (T9.2)

The haiku-vault line (T9.2, partial) is the repository's deniability-adjacent
experiment at application level — memorable-text key material rather than
hidden volumes. Shufflecake's hierarchy (decoy → secret, one password
unlocking everything less hidden) is the reference model to borrow
*vocabulary* from; the vault should not claim Shufflecake-grade deniability,
since application-level files announce their own existence in a way dm-sflc
volumes deliberately do not.

## Sources

- Kudelski Security Research, *Introducing Shufflecake* (2022-11-10) —
  https://research.kudelskisecurity.com/2022/11/10/introducing-shufflecake-plausible-deniability-for-multiple-hidden-filesystems-on-linux/
- Anzuoni & Gagliardoni, *Shufflecake: Plausible Deniability for Multiple
  Hidden Filesystems on Linux*, ACM CCS 2023; arXiv:2310.04589;
  IACR ePrint 2023/1529
- Project site + install notes — https://shufflecake.net/
- C implementation — https://codeberg.org/shufflecake/shufflecake-c
- Repo audit target: `public/apps/cyberchef/index.html` (ops `stegoLSB`,
  `stegoSpace`, `stegoHide`, `stegoReveal`, `stegoAcro`)

Backlog status: T9.1's Shufflecake and stego halves are closed by this note
(research + audit; real-image LSB op named as the follow-on build). The
BasicCard/JavaCard and algorithms-book parts of T9.1 remain open under S9.
