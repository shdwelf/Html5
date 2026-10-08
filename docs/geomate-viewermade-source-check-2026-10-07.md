# N17Pro3426 / ViewerMade — source check (2026-10-07)

> **Decision: NOT imported, NOT cloned, NOT analyzed.** This note records what
> the repository is so the decision can be audited later; no binary from this
> account is checked into the Html5 repo and no blob was downloaded to the
> workspace.

## Account

- Login: `N17Pro3426` ("! DogeTech", Ukraine) — created 2022-11-18
- Public repos: 316, all with descriptions of the form
  "C++/C#/batch GDI trojan by …", "C# ransomware by …",
  "creepypasta GDI trojan", "BSOD joke program" and similar.
- Sample titles across the account:
  `Antivirus_Installer`, `cgwkwmbvzo` ("C# ransomware by pankoza"),
  `devilransom`, `BAT.KillMBR`, `CatDaMBR`, `Bonzify`, `Coffin32`
  ("C++ GDI joke program"), `BSOD2`, `DeathPlus`, `Covid22`.

This is not a reverse-engineering tutorial account, not a cookbook-authoring
account, and not a source-code library. It is a collected malware-sample zoo.

## Repository: ViewerMade

- URL: https://github.com/N17Pro3426/ViewerMade
- Description (author's own): *"All of GDI/non-GDI malwares, ransomwares and
  more will be here! :)"*
- Default branch: **`Malwares`** (not `main`/`master`)
- Size reported by GitHub API: 1,857,202 KB (~1.8 GB)
- Top-level tree (API directory listing): ~1,000 blobs returned by the
  recursive tree endpoint (GitHub truncates at 1,000 entries; the repo is
  larger). Every top-level entry is a packaged Windows binary
  (`.exe` / `.zip` / `.rar` / `.7z`), not source.
- Representative filenames from the first 40 entries:
  `001.exe` (500 KiB), `0b02.exe`, `0x07.exe`, `2 EURO.exe` (18 MiB),
  `BAT.KillMBR.zip`, `Antivirus2021.exe`, `AdministratorGDI740.exe`,
  `BootHeaderMaker.exe`, `CatDaMBR.exe`, `Cipher.exe`, `BlueLogon.zip`,
  `Bonzify.zip`, `BSOD2.exe`, `Bitmap2.zip`, `3gp.exe`.
- There is no `README`, no `src/`, no build script, no source file of any
  language, and no documentation describing encoding, obfuscation, encryption,
  or disassembly recipes. The contents are exclusively precompiled Windows
  PE samples and archives containing them.

## Why the repo is rejected as a recipe source

1. **Content is malware.** The author self-identifies the contents as GDI
   trojans, ransomware, MBR wipers, and fake-AV payloads. Importing, cloning,
   or running Ghidra headless on these binaries would drop live Windows
   malware into `/home/user`, which is snapshotted and persisted across turns.
2. **No source.** Even for a purely static read, the value is near zero:
   compiled PE samples do not come with algorithms we can record as
   inspectable, reproducible CyberChef/Ghidra recipes. Recipes built from
   them would just be IOC signatures of specific trojans, not general
   encoding/obfuscation/encryption techniques.
3. **Provenance hygiene.** This repo's existing Ghidra workflow (see
   `.github/workflows/drsolomon-ghidra.yml`) requires pinned SHA-256 gates,
   downloads of *named historical artifacts* from trusted hosts
   (archive.org, official Ghidra releases), post-run binary deletion, and
   explicit safety declarations. ViewerMade satisfies none of those gates:
   there is no vendor, no version, no pinned hash, and no benign purpose.
4. **Scope match.** The cookbook documents algorithmic primitives (DES, 3DES,
   RC4, AES, ChaCha20, Camellia, HMAC, APDU parsing, …) with test vectors
   from RFCs/FIPS. Pulling "recipes" out of random trojan samples would not
   add a primitive; it would only pair the cookbook's name with malware.

## Outcome

- No clone, no `git fetch`, no blob download was performed. Only the GitHub
  REST API (`repos/N17Pro3426/ViewerMade`, `git/trees/Malwares?recursive=1`,
  and the directory listing) was queried, which returns JSON metadata only.
- No artifact from this account will be checked into `docs/`, `tools/`,
  `samples/`, `public/`, or the Ghidra evidence directories.
- Legitimate additions to the CyberChef/Ghidra kitchen (encoding,
  obfuscation, encryption, disassembly helpers) are recorded separately in
  `docs/ghidra-cyberchef-recipes.md`, drawn from Ghidra's own public
  documentation, the `ghidra-findcrypt`/FindCrypt family of tools, CyberChef
  operation catalogues, and the already-checked-in benign samples (the
  Dr Solomon's 1992 Win16 NE set, the AVR optiboot/micronucleus corpus, and
  the JCreator/JDK toolchain samples).
