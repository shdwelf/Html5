# Deep Dive: The Buscador OSINT Virtual Machine

*A provenance, image-verification and reverse-engineering walkthrough of **Buscador**, the OSINT investigation Linux VM by David Westcott and Michael Bazzell (IntelTechniques) — written to pair with this repo's browser-side **[Ghidra WASM Lab](./ghidra-lab.html)** and the `abbottabad-ghidra` forensics corpus.*

> **Related:** interactive **[Distro Dossier](./distro-dossier.html)** research console · companion **[kodachi-deep-dive.md](./kodachi-deep-dive.md)**.

---

## 0. Scope & honesty note

This document was produced inside a sandbox with **no arbitrary outbound network from the shell** and a hard cap on committed artifacts. The Buscador appliance is a **~5 GB OVA**, so it was **not** downloaded into this repository — pulling a 5 GB binary here is neither possible over the available tooling nor appropriate to commit to Git.

Instead, "check the buscador image" is answered the rigorous, reproducible way:

1. The **authoritative MD5 checksums** published by the author are recorded below so anyone can verify a copy byte-for-byte.
2. A complete **verification + inspection procedure** is given (how to authenticate the OVA, unpack it, and mount the disk read-only).
3. The image's **contents and tooling** are documented from primary sources.
4. A realistic **"Ghidra WASM on Buscador"** workflow is described — because Ghidra decompiles *individual executables*, not whole disk images, the honest task is *extract binaries from the VM, then decompile them* in [`ghidra-lab.html`](./ghidra-lab.html).

Everything asserted here is sourced in [§9](#9-sources). Where sources disagree (notably the base OS and image size across versions), the conflict is called out rather than smoothed over.

---

## 1. What Buscador is

**Buscador** ("searcher" in Spanish) is a free Linux virtual machine **pre-configured for online investigators and OSINT (Open-Source Intelligence) work**. It was built by **David Westcott** and **Michael Bazzell** of **IntelTechniques**, and is the VM extensively referenced in Bazzell's book *Open Source Intelligence Techniques*.

The design goal is the OSINT analogue of Kali Linux: rather than shipping offensive/exploitation weaponry, Buscador hand-picks **collection, reconnaissance, capture and privacy** tools — plus custom launcher scripts — into one appliance so an investigator can "download and go" instead of installing and configuring dozens of Python tools by hand.

Distinguishing characteristics:

- **Investigation-first, not exploitation.** No Metasploit; the emphasis is passive collection, link analysis, evidence capture and metadata.
- **Privacy/stealth built in.** Tor and other privacy tooling ship pre-installed because investigators, like the targets they study, want to avoid tipping off subjects.
- **Point-and-click over CLI.** Custom `zenity`/GUI scripts wrap common tools so non-terminal users can run them.
- **Evidence capture.** Browser extensions such as **Hunchly** and screenshotting tools are included to preserve findings.

### Status: discontinued

Buscador is **no longer maintained**. Bazzell retired it in favour of teaching investigators to **build their own OSINT VM from scratch** (documented chapter-by-chapter in later editions of *OSINT Techniques*), on the logic that an investigator should be able to rebuild the workstation if the distribution ever disappears — which it since has. The official `inteltechniques.com/buscador/` page now returns *"The page you have requested is no longer available."* Community alternatives people migrated to include **Trace Labs OSINT VM** and **CSI Linux**.

---

## 2. Version history

| Version | Released | Notes |
| --- | --- | --- |
| **1.0 / 1.1 / 1.2** | 2017 – 2018 | Ubuntu-based (GNOME / MATE lineage). ~3–3.5 GB image; smaller, USB-bootable builds. `toolsmith #130` (Jan 2018) ran 1.1 by pulling the VMDK from the OVA and converting with QEMU. |
| **2.0** | **January 2019** | The last and most complete release. Build "under 5 GB." All tools pulled fresh from their Git sources with a script-only updater; many utilities grouped behind `zenity` menus; adds an **H8mail**, a **YouTube downloader** script, **GHIRO** image forensics, and an updated **Hunchly**. Distributed as VirtualBox and VMware OVAs (Google Drive + a direct mirror). |

> ⚠️ **Base-OS discrepancy.** Sources conflict. Null Byte (2018/2019) describes Buscador as "based on Ubuntu rather than Debian"; a Spanish walkthrough pins v1.0 to **Ubuntu 18.04 LTS MATE**; PenTestIT's 2.0 changelog claims 2.0 "moved to raw Debian." The KVM guide converts the disk and selects **"Debian"** as the guest OS type in virt-manager. The most defensible statement: **the 1.x line is Ubuntu-based; the 2.0 lineage is Debian/Ubuntu-family and self-identifies closer to Debian.** Confirm empirically from the mounted image (see [§5](#5-inspecting-the-contents-read-only)) by reading `/etc/os-release`.

> ⚠️ **Image-size discrepancy.** "3.5 GB" (Null Byte, 1.x) vs "under 5 GB" (IntelTechniques / PenTestIT, 2.0). Both can be true — they describe different versions.

---

## 3. Distribution & the image to verify

Buscador 2.0 shipped as two OVA appliances. An **OVA** is simply a `tar` archive containing an `.ovf` (XML descriptor), a `.mf` (manifest of SHA hashes), and one or more `.vmdk` virtual disks.

| Appliance | File | Author-published MD5 |
| --- | --- | --- |
| **VirtualBox** | `Buscador2VIRTUALBOX.ova` | `09dd771716502771af5f2bb86835e6c2` |
| **VMware** | `Buscador2VMWARE.ova` | `27f2d1ba37d1a15531ff34a050012ef4` |

Inside the VirtualBox OVA the primary disk was named:

```
Buscador2_export(vbox)(Jan-23-19)-disk001.vmdk
```

The `(Jan-23-19)` export date matches the **January 2019** 2.0 release, and is a useful provenance tell when authenticating a copy.

**Default credentials (documented):** user **`osint`** / password **`osint`**. (Also used for `sudo` during the VMware/VirtualBox guest-additions install steps.)

> Original download links (IntelTechniques page + a Google Drive mirror) are **dead**, and the IntelTechniques host is **excluded from the Wayback Machine**, so the page cannot be replayed there. Nobody appears to have made an authoritative public mirror. The **checksums above are therefore the load-bearing artifact**: any copy you obtain can be proven authentic (or not) against them, regardless of where it came from.

---

## 4. Verifying the image (byte-for-byte)

Once you have an OVA, authenticate it before trusting it. Match the whole-file MD5, then verify the internal per-file hashes in the OVA's own manifest.

```bash
# 1) Whole-appliance integrity — must match the author's published MD5
md5sum Buscador2VIRTUALBOX.ova
# expect: 09dd771716502771af5f2bb86835e6c2  Buscador2VIRTUALBOX.ova

# (VMware appliance)
md5sum Buscador2VMWARE.ova
# expect: 27f2d1ba37d1a15531ff34a050012ef4  Buscador2VMWARE.ova

# 2) An OVA is just a tar — list and unpack it
tar tvf Buscador2VIRTUALBOX.ova
tar xvf Buscador2VIRTUALBOX.ova     # yields .ovf, .mf, and the .vmdk disk(s)

# 3) The .mf is the appliance's *own* manifest of SHA1/SHA256 hashes.
#    Verify each member against it (independent of the MD5 above):
cat *.mf
sha1sum -c <(sed -E 's/^SHA1\(([^)]+)\)= (.*)$/\2  \1/' *.mf)   # if SHA1
sha256sum -c <(sed -E 's/^SHA256\(([^)]+)\)= (.*)$/\2  \1/' *.mf) # if SHA256
```

If the whole-file MD5 matches **and** the `.mf` members verify, the disk you are about to mount is bit-identical to what the author packaged. If either fails, stop — the copy is corrupted or tampered with.

---

## 5. Inspecting the contents (read-only)

You do **not** need to boot Buscador (and shouldn't, for forensic soundness) to inventory it. Mount the disk **read-only** and browse.

```bash
# Convert the VMware/VirtualBox VMDK to something loopback-friendly (raw or qcow2)
qemu-img info "Buscador2_export(vbox)(Jan-23-19)-disk001.vmdk"
qemu-img convert -O qcow2 "Buscador2_export(vbox)(Jan-23-19)-disk001.vmdk" buscador.qcow2   # KVM route
# ...or straight to raw for loop mounting:
qemu-img convert -O raw   "Buscador2_export(vbox)(Jan-23-19)-disk001.vmdk" buscador.raw

# Attach read-only and map partitions
sudo modprobe nbd max_part=16
sudo qemu-nbd --read-only --connect=/dev/nbd0 buscador.qcow2
lsblk /dev/nbd0
sudo mount -o ro,noload /dev/nbd0p1 /mnt/buscador   # ext4: noload skips journal replay

# Now enumerate WITHOUT executing anything:
cat /mnt/buscador/etc/os-release          # settle the Ubuntu-vs-Debian question
ls  /mnt/buscador/home/osint/Desktop      # the launcher scripts / tool shortcuts
dpkg-query --admindir=/mnt/buscador/var/lib/dpkg -W -f='${Package}\t${Version}\n' | sort
find /mnt/buscador/opt /mnt/buscador/home -maxdepth 3 -type d   # git-cloned tools live here

# clean up
sudo umount /mnt/buscador
sudo qemu-nbd --disconnect /dev/nbd0
```

Reading `/etc/os-release`, the `dpkg` database, and the `~/osint/Desktop` launchers is what turns the second-hand tool lists in [§6](#6-the-toolset) into a **ground-truth manifest** for the exact copy you hold. This mount-read-only-then-inventory pattern is the same discipline the `abbottabad-ghidra/` corpus applies to seized media in this repo.

---

## 6. The toolset

Buscador's value is its curated bundle. The list below is compiled from the official resource description and multiple independent write-ups; treat it as the *expected* set and reconcile against the `dpkg`/Desktop inventory from [§5](#5-inspecting-the-contents-read-only) for your specific build.

**Browsers & capture**
- **Firefox** — pre-loaded with OSINT add-ons
- **Chrome/Chromium** (incognito) — pre-loaded with extensions incl. **Hunchly** (evidence capture)
- Screenshot / web-capture utilities; **HTTrack** (site mirroring)

**Link analysis & frameworks**
- **Maltego CE** — graphical link analysis
- **Recon-ng** — modular web recon framework (Metasploit-style)
- **Spiderfoot** — automation/aggregation
- **Datasploit** — OSINT aggregation framework (now archived upstream)
- **OSRFramework** (usufy/mailfy/searchfy, etc.)

**People / social media**
- **Creepy** — geolocation from social platforms
- **Twint**, **tweets_analyzer**, **tinfoleak** — Twitter scraping/analysis (Twint later broke with the X API)
- **Instaloader** — Instagram media/metadata

**Domain / infrastructure**
- **theHarvester** — emails, subdomains, names
- **Sublist3r**, **Photon**, **Aquatone**, **knock**, **fierce**, **dnsrecon** — subdomain/DNS/crawl
- **EyeWitness** — bulk website screenshots + default-cred detection

**Files, media & metadata**
- **ExifTool** — metadata read/write
- **Metagoofil** — public-document metadata harvesting
- **GHIRO** — *automated image forensics web app* (**new in 2.0**)
- **MediaInfo**, **FFmpeg**, and a **YouTube downloader** script (**new in 2.0**), **VLC**, **Google Earth Pro**

**Breach / credential**
- **H8mail** — email OSINT & breach/password hunting (**new in 2.0**)

**Privacy**
- **Tor** and supporting privacy tooling; Yubikey support notes in the docs

> 🔎 **On "ghirdra".** The request said *"ghirdra"* — worth flagging that Buscador 2.0 bundles **GHIRO** (automated **image** forensics), which is easy to conflate with **Ghidra** (a **binary** reverse-engineering suite). They are unrelated tools. This repo's [`ghidra-lab.html`](./ghidra-lab.html) is a WebAssembly build of **Ghidra's decompiler**; the image-forensics counterpart inside Buscador is **GHIRO**. Both are covered below.

---

## 7. "Run Ghidra WASM on Buscador" — the real workflow

Ghidra decompiles **one executable at a time**; you cannot meaningfully "point Ghidra at a VM." A whole appliance is a filesystem of thousands of files. The sensible investigation is: **authenticate → mount read-only → pick binaries of interest → decompile each in the browser.**

1. **Authenticate & mount** the image ([§4](#4-verifying-the-image-byte-for-byte)–[§5](#5-inspecting-the-contents-read-only)).
2. **Select targets.** Good candidates in an OSINT VM are the **custom launcher binaries/scripts** and any **non-package `/opt` or `~/Desktop` executables** that aren't traceable to a distro package — exactly the "what did the author add?" question. Find ELF binaries with:
   ```bash
   sudo find /mnt/buscador -type f -exec sh -c 'file "$1" | grep -q ELF && echo "$1"' _ {} \;
   ```
3. **Triage before decompiling** (same posture as `abbottabad-ghidra/evidence/triage.json`): record `sha256sum`, `file`, and an entropy/`strings` pass so you know what you're feeding in.
4. **Decompile in the tab.** Open [`ghidra-lab.html`](./ghidra-lab.html) and **drop the extracted binary** into the file input. The lab accepts `.bin/.com/.exe/.rom/.wasm/.elf/.sys`; **ELF/PE are auto-sniffed**, so a 64-bit Linux ELF from Buscador loads without manual base/mode fiddling (those knobs are for raw DOS/boot-sector blobs). Read the **DISASSEMBLY**, **GHIDRA C**, **HEX · ENTROPY** and **RESEARCH** tabs; nothing is uploaded and nothing is executed — it is static analysis only.
5. **Persist outputs** in the repo's established shape if you want a corpus: an `outputs/<TARGET>/report.md` plus per-function decompiled C, mirroring `abbottabad-ghidra/outputs/*`.

For the **image-forensics** half (the GHIRO angle), the analogue is: run any suspect JPEG/PNG evidence through EXIF/entropy analysis — which is exactly what GHIRO does inside Buscador, and what ExifTool + this repo's analyzers do outside it.

---

## 8. Why this belongs next to `abbottabad-ghidra` and `ghidra-lab`

This repository already curates a **static, no-upload, browser-side reverse-engineering** philosophy: the Ghidra decompiler compiled to WASM, a virology corpus decompiled offline, and forensic triage JSON. Buscador is the **collection-side** sibling of that same mindset — an investigator's bench assembled from open tools, captured and preserved rather than executed against a live target. Documenting it here:

- records the **provenance and checksums** of a now-orphaned but historically important OSINT appliance before they rot further;
- gives a **reproducible verification/inspection recipe** consistent with how the repo already treats seized media; and
- wires it into the existing **Ghidra WASM Lab** as a concrete "extract-then-decompile" workflow.

---

## 9. Sources

- IntelTechniques — *Buscador 2.0 OSINT Virtual Machine Released!* (2019-01-25): https://inteltechniques.com/blog/2019/01/25/buscador-2-0-osint-virtual-machine-released/ *(page now retired)*
- IntelTechniques — official Buscador distribution page (dead / excluded from Wayback): https://inteltechniques.com/buscador/index.html
- PenTestIT — *UPDATE: Buscador Version 2.0* (2.0 changelog, checksums, "raw Debian," H8mail/GHIRO/YouTube-downloader): https://pentestit.com/update-buscador-version-2-0/ *(now 404; captured via search index)*
- Null Byte / WonderHowTo — *How to Use the Buscador OSINT VM* (base OS, ~3.5 GB, USB boot, tool intros, DDoS takedown note): https://null-byte.wonderhowto.com/how-to/use-buscador-osint-vm-for-conducting-online-investigations-0186611/
- haxf4rall — *Buscador – OSINT Investigative Operating System* (2.0 install notes, resource list, ~5 GB): https://haxf4rall.com/2019/06/27/buscador-osint/
- Medium / hacker-toolbelt — *Buscador VM OSINT* (OVA→KVM conversion, exact VMDK filename): https://medium.com/hacker-toolbelt/buscador-vm-osint-6da71754a1b7
- Security Boulevard — *toolsmith #130 – OSINT with Buscador* (v1.1 on Hyper-V via QEMU): https://securityboulevard.com/2018/01/toolsmith-130-osint-with-buscador/
- RSM WarRoom — *All In One OSINT* (Ubuntu GNOME base, ISO+OVA, tool overview): https://warroom.rsmus.com/all-in-one-osint/
- Medium (ES) — *Buscando la herramienta perfecta para hacer OSINT* (v1.0 = Ubuntu 18.04 LTS MATE, VirtualBox-only): https://medium.com/@alejandrodeltoromarin/buscando-la-herramienta-perfecta-para-hacer-osint-f2942b8e8b7a
- r/OSINT threads on discontinuation, mirrors, and migration to Trace Labs / DIY build: https://www.reddit.com/r/OSINT/comments/i9tqfn/ , https://www.reddit.com/r/OSINT/comments/bxvtsg/ , https://www.reddit.com/r/OSINT/comments/138ir9o/
- Trace Labs OSINT VM (successor community VM): https://www.tracelabs.org/trace-labs-osint-vm/

---

## Appendix A: Published integrity values (quick reference)

```
Buscador2VIRTUALBOX.ova   MD5  09dd771716502771af5f2bb86835e6c2
Buscador2VMWARE.ova       MD5  27f2d1ba37d1a15531ff34a050012ef4
Primary disk (vbox OVA)   Buscador2_export(vbox)(Jan-23-19)-disk001.vmdk
Default login             osint / osint
Release                   2.0  ·  January 2019  ·  build "under 5 GB"
```

## Appendix B: OVA → KVM (from the archived KVM guide)

```bash
mv Buscador2VIRTUALBOX.ova Buscador2VIRTUALBOX.tar
tar xvf Buscador2VIRTUALBOX.tar
qemu-img convert -O qcow2 "Buscador2_export(vbox)(Jan-23-19)-disk001.vmdk" Buscador2.qcow2
# then: virt-manager → "Import existing disk image" → Buscador2.qcow2 → OS type: Debian
```

---

*Have an authenticated copy of either OVA? Run the [§4](#4-verifying-the-image-byte-for-byte) checksum + `.mf` verification and the [§5](#5-inspecting-the-contents-read-only) read-only inventory, then drop the interesting ELF binaries into [`ghidra-lab.html`](./ghidra-lab.html). PRs adding an `outputs/buscador/` corpus in the `abbottabad-ghidra` shape are welcome.*
