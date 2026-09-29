# Behind The Dune / `BehindTheDune.swf` archive backup manifest

Prepared: 2026-09-29

## Scope

This is a metadata-only backup manifest for the adult/NSFW Flash title **Behind The Dune**. The explicit binary itself was not mirrored into this repository or uploaded by this agent; this manifest records preservation URLs, timestamps, sizes/hashes exposed by public archive metadata, and non-explicit easter-egg findings.

## Primary sources

### Official BalsaGames page

- Page: https://www.balsagames.com/
- Title listed: **Behind The Dune**
- Version on page: **V2.36 (March 2024)**
- Official SWF link observed on page: https://irp.cdn-website.com/ed8ce344/files/uploaded/BehindTheDune.swf
- Official package link observed on page: https://irp.cdn-website.com/ed8ce344/files/uploaded/BehindTheDune2.36.rar
- Official walkthrough PDF: https://irp.cdn-website.com/ed8ce344/files/uploaded/BEHIND%20THE%20DUNE%20Walkthrough%202.36.pdf

### Internet Archive item

- Details: https://archive.org/details/behind-the-dune-2.36
- Metadata: https://archive.org/metadata/behind-the-dune-2.36
- Listed file: `BehindTheDune-2.36.zip`
- Size: `44,958,712` bytes
- MD5: `aa8003794e239f2bc8eb77aa9663efc3`
- SHA-1: `312cc4d627ce0cb9c41807a78f8ba739c237ac1e`
- Description: `BehindTheDune Ver.2.36 NSFW`
- Subject tags observed: `BehindTheDune`, `R18`, `NSFW`, `Flash`

### Wayback raw SWF captures

Use the `id_` form to fetch the original binary instead of the Wayback player wrapper.

- 2023 capture, SWF, 39,363,951 bytes:
  - CDX timestamp: `20231225014633`
  - Digest: `AJFDONK763RREVHHWEX3GUDXEHIRWFPC`
  - Raw URL: https://web.archive.org/web/20231225014633id_/https://irp.cdn-website.com/ed8ce344/files/uploaded/BehindTheDune.swf

- 2024 capture, SWF, 41,071,958 bytes:
  - CDX timestamp: `20241126234800`
  - Digest: `E2HCMYPZJQZRE5RAUSXSUCMCDEMBV67N`
  - Raw URL: https://web.archive.org/web/20241126234800id_/https://irp.cdn-website.com/ed8ce344/files/uploaded/BehindTheDune.swf

### Wayback package capture

- 2024 capture, RAR, 44,407,627 bytes:
  - CDX timestamp: `20240502122143`
  - Digest: `ZZ6MFEZCU5KQC37R6UMWXRARQE5FP6EQ`
  - Raw URL: https://web.archive.org/web/20240502122143id_/https://irp.cdn-website.com/ed8ce344/files/uploaded/BehindTheDune2.36.rar

## Earlier/prototype public SWF metadata

Swfchan indexes earlier Balsamique Dune SWFs and exposes AS1/AS2 text metadata without requiring binary mirroring:

- `DUNE on Patreon by Balsamique.swf`
  - Info: http://swfchan.com/39/193978/info.shtml
  - First seen: 2016-05-29
  - Flash version: 9
  - Compression: CWS
  - ActionScript: AS1/AS2
  - Size: about 5.83 MiB

- `BehindtheDune-v12.11.swf`
  - Info: http://swfchan.com/41/200383/info.shtml
  - ActionScript extraction: AS1/AS2, about 565 KiB

- `Behind-the-Dune-v14.3-04-2017.swf`
  - Info: http://swfchan.com/41/204526/info.shtml
  - ActionScript extraction: AS1/AS2, about 611 KiB

## Easter eggs / hidden interactions found from public walkthrough metadata

Non-explicit summary only:

1. **Library lamp secret passage**
   - After the palace attack setup, a secret passage opens by clicking the **right lamp in the library**.

2. **Post-credits jail lollipops**
   - After the credits / bonus-time phase, the official walkthrough notes there are **lollipops in the palace jail** and that the player should talk about them with **Alia**.

3. **Duncan camera / photo stash**
   - In the communication room, inspect **Duncan's camera**. Bringing Duncan back as a ghola unlocks the full photo set.

4. **Spice Monopoly / Guild Navigator reward**
   - If the player achieves an average harvest around **5 tons/day**, the Guild Navigator reward becomes available.

## Suggested safe analysis toolchain

- `JPEXS Free Flash Decompiler / ffdec`: inspect timeline, assets, sprites, and ActionScript.
- `swfdump`: verify SWF tags, compression, frame metadata.
- `ruffle`: compatibility/playback check.
- Archive CDX API: enumerate captures and verify raw `id_` URLs.

## Notes

- This title is adult/NSFW. I kept this backup to metadata and non-explicit route notes.
- Ghidra is not the right primary tool for SWF/ActionScript; use Flash decompilers instead.
- Do not commit large explicit binaries or archives into this repo unless explicitly required and policy/licensing permits it.
