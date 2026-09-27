# Deep Dive: Linux Kodachi — the anti-forensic privacy OS

*A provenance, credential, VPN and reverse-engineering walkthrough of **Linux Kodachi** (now **Kodachi OS**) by Warith Al Maawali — a companion to [`buscador-deep-dive.md`](./buscador-deep-dive.md) and the interactive [Distro Dossier](./distro-dossier.html) / [Ghidra WASM Lab](./ghidra-lab.html).*

---

## 0. Why this file exists

The request was to *continue researching* and to fold the findings into new HTML5 research tooling. Kodachi is the natural counterpart to Buscador: where Buscador is a **collection** bench for investigators, Kodachi is an **anti-forensic anonymity** OS for the people being investigated. Both are shipped as downloadable images with **published default credentials** and a **verify-the-download** story — exactly the material the new [`distro-dossier.html`](./distro-dossier.html) console is built around.

As with the Buscador write-up: the multi-GB ISO is **not** downloaded into this repo. "Checking the image" is answered with the **published checksums + signature chain** and a reproducible verify/mount procedure. Everything is sourced in [§8](#8-sources).

---

## 1. What Kodachi is

Linux Kodachi is a **live, anti-forensic, anonymity-focused** Linux distribution. Boot it from USB/DVD/VM and, with zero configuration, it:

- **forces all outbound traffic through a VPN and then the Tor network**, with a kill-switch and DNS-leak protection;
- **encrypts DNS** (DNSCrypt), with one-click Tor-DNS;
- **runs entirely from RAM** and **wipes the session on shutdown**, leaving no trace on the host;
- exposes everything through a single **security dashboard** (rebuilt in Rust for v9).

Its stated audience is journalists, activists and everyday users who want Tails-grade protection but with an installable, daily-driver desktop and far more routing options. "Kodachi" (小太刀) is a short Japanese sword — the samurai-blade motif runs through the branding.

Kodachi is a **solo project** by **Warith Al Maawali** (Oman), first posted **20 October 2013**. Unlike many privacy distros the maintainer is publicly identified — a point worth weighing for trust.

---

## 2. Version history & the base-OS story

Kodachi's base OS has moved repeatedly, which is why old write-ups disagree:

| Era | Base | Notes |
| --- | --- | --- |
| Origin | **Linux Mint** | earliest customised builds |
| v4.3 | **Debian 9.5** | |
| v5.x | Debian 9.5 / **Xubuntu 18.04** | LinuxInsider describes 5.6 as "Debian 9.5 / Xubuntu 18.04 LTS" |
| v7 "Katana" (2020) | **Ubuntu 20.04** (kernel 5.4) | |
| v8.x (through 8.27) | **Xubuntu 18.04** | the long-lived 8.x branch many reviews cover |
| **v9.x** (2026) | **Debian 13 "Trixie"** | ground-up rebuild, drops Xubuntu entirely, **native Rust dashboard** |

> ⚠️ **Don't trust old "based on Xubuntu" listings for v9.** Versions up to 8.27 were Xubuntu-derived; v9 rebuilds directly on Debian 13. This is a real architectural change, not a version bump.

**Editions (v9):** *Desktop XFCE* (~5 GB, LibreWolf + Tor Browser, full dashboard) and *Terminal Server* (~2.4 GB, headless, SOCKS-proxy/gateway use). A signed **Binary Suite** tarball ships the Rust components for use on an existing Debian system.

---

## 3. Default credentials

Kodachi publishes fixed defaults for its **live** image (this is normal for a live OS, and the reason the [Distro Dossier](./distro-dossier.html) surfaces them):

```
Regular user (recommended):   username: kodachi   password: r@@t00
Root / su / sudo:             username: root      password: r@@t00
```

- **The last two characters of `r@@t00` are ZEROS, not the letter O.** The single most common "the password doesn't work" cause (also: check Num-Lock). This has been the default across the 3.x–8.x line.
- **Do not rename or abandon the `kodachi` user.** Much of the system depends on custom shell scripts that only work under that account; log in as `kodachi`, not `root`.
- On a **persistent install**, disable auto-login via the dashboard and set unique passwords: `passwd` (user), then `su` + `passwd` (root).
- **v9 caveat:** a community report cites `Security4All` for some v9 *hardened* images, and users note the stock creds only apply to the **Live** boot option, not the full-hardening installer path. Treat v9 creds as **build-specific** and confirm from the docs/first-boot wizard for your exact ISO.

---

## 4. VPN & the OpenVPN mechanism — and the "root password is for the VPN" claim

Kodachi's headline feature is **forced VPN → Tor** routing. v9's dashboard advertises 11 routing protocols in its stats and lists **14** in detail, including **OpenVPN**, **WireGuard**, Shadowsocks, V2Ray, Xray, Hysteria2, **AmneziaWG** (obfuscated WireGuard), OpenVPN-over-Cloak, and a Dante **SOCKS5** gateway. Multiple Tor instances sit behind an HAProxy front end for throughput. Thirteen commercial providers (Mullvad, ProtonVPN, IVPN, NordVPN, Riseup…) come pre-loaded to browse, benchmark and connect — **or you paste your own config**.

### Bring-your-own OpenVPN

The documented custom-VPN path (stable since the 6.x era):

```
1. cd /home/kodachi/Own_VPN_Config
2. Paste your provider's config into:      myownvpn.ovpn
3. If it needs a login, put it in:         myownvpnauth.txt
4. In myownvpn.ovpn set:                   auth-user-pass ../Own_VPN_Config/myownvpnauth.txt
5. Any extra setup goes in:                myownvpnsetup
6. Save; connect from the dashboard's VPN tab.
```

### On "the root password from the website is for the ovpn vpn"

Precisely stated, the verifiable facts are:

- The **`r@@t00`** password published on the Kodachi site is the **OS account / `sudo`** password (user *and* root) — it authorises the dashboard's privileged actions, including **bringing the VPN tunnel up** (starting OpenVPN/WireGuard is a root operation).
- It is **not**, by itself, documented as *VPN account credentials*. VPN **provider** logins are separate — either the pre-loaded providers' own credentials or whatever you place in `myownvpnauth.txt`.
- So the accurate reading is: **the website's password unlocks the machine that runs the always-on VPN**, and the OpenVPN client it drives reads its *provider* credentials from `Own_VPN_Config/myownvpnauth.txt`. If a specific build ships a *pre-filled* `myownvpnauth.txt` bundled free VPN, verify that from the mounted image (see [§5](#5-verify-the-image--inspect-it)) rather than assuming the OS password doubles as the VPN password.

---

## 5. Verify the image & inspect it

Kodachi is a strong "check the image" case: an anti-forensic OS that lands in the hands of at-risk users **must** be authenticated before boot. v9 signs every ISO/binary with an **RSA-4096** key and publishes **BLAKE3 + SHA-256** hashes verifiable against a **signed release manifest** (built in direct response to a 2023 checksum-mismatch complaint on an older release).

**Published checksums on file** (also live in the Distro Dossier verifier):

```
linux-kodachi-xfce-9.0.1-amd64.iso       SHA256  b2793ef62881a74fb65040f817e2a7b208555ef4f5713986259bdcbc257a99b6
linux-kodachi-terminal-9.0.1-amd64.iso   SHA256  c1140c7d9f75288b4aeb1f1cb6b961a291172f0deee2cbb8f6f71c5b9ebf0678
kodachi-7.0-64.iso                        MD5     9526cc6b12609f2d704465071f31f688
```

```bash
# 1) Hash match
sha256sum linux-kodachi-xfce-9.0.1-amd64.iso     # compare to the value above
# 2) Signature (preferred) — verify the detached RSA-4096/OpenSSL signature against the signed manifest
#    (grab the .sig / .sig.info from the official download page)
# 3) Inspect WITHOUT booting evidence: loop-mount read-only and extract the squashfs
sudo mount -o loop,ro linux-kodachi-xfce-9.0.1-amd64.iso /mnt/iso
unsquashfs -d ./kodachi-root /mnt/iso/live/filesystem.squashfs   # path varies by build
cat ./kodachi-root/etc/os-release                                # confirm the Debian 13 base
ls  ./kodachi-root/opt/kodachi                                   # the dashboard binaries
```

> Or just drag the ISO into the [Distro Dossier](./distro-dossier.html) verifier — it hashes locally (MD5/SHA-1/SHA-256) and tells you which catalogued image it matches, if any.

---

## 6. Reverse-engineering Kodachi with Ghidra WASM

The interesting targets are the **dashboard's Rust binaries** in `/opt/kodachi/…` — the code that actually chains VPN, Tor, DNSCrypt and the kill-switch. Static analysis answers "what does the anonymity stack really do?" without trusting the marketing.

1. **Verify** the ISO ([§5](#5-verify-the-image--inspect-it)); mount **read-only**.
2. **Locate** the Kodachi binaries: `find ./kodachi-root/opt/kodachi -type f -exec file {} +` → note the ELF executables (Rust compiles to native ELF).
3. **Triage** each (`sha256sum`, `strings`, entropy) — the same discipline as `abbottabad-ghidra/evidence/triage.json`.
4. **Decompile** in [`ghidra-lab.html`](./ghidra-lab.html): drop an ELF in; it's auto-sniffed; read DISASSEMBLY / GHIDRA C / HEX·ENTROPY. Rust binaries are large and monomorphised, so start from the symbols you recognise (e.g. functions referencing `openvpn`, `tor`, `dnscrypt`, config paths).

> Note: Rust's decompiled C is dense; Ghidra's static view is best for confirming *which* binaries touch the network/kill-switch, then focused function-level reading — not for a clean top-to-bottom source recovery.

### 6.1 A real, reproducible pass — done here, from Kodachi's own bytes

The steps above aren't hypothetical. Egress here is GitHub-only and multi-GB ISOs can't be
pulled, but Warith Al Maawali's **official** source repo `github.com/WMAL/kodachios`
commits the Kodachi-8 build tree — which **bakes 81 stock `.deb` packages into the image**.
That is a genuine channel to real distro machine code without the ISO:

```
git clone --depth 1 https://github.com/WMAL/kodachios
cd kodachios/Kodachi-OS-8-EOL/open/bash/etc/bodhibuilder/debs/amd64
cp 'b43-fwcutter_1%3a019-3_amd64.deb' /tmp/p.deb
cd /tmp && ar x p.deb && tar xf data.tar.xz     # -> usr/bin/b43-fwcutter (ELF64 PIE)
```

`usr/bin/b43-fwcutter` (v019; extracts Broadcom 43xx firmware so Kodachi's Wi-Fi works on
live boot) was then decompiled **headlessly with the repo's own Ghidra-WASM engine** — the
same `wasm/ghidra/` bundle `ghidra-lab.html` runs — via the new driver
[`tools/decompile_elf.mjs`](./tools/decompile_elf.mjs):

```
node tools/decompile_elf.mjs usr/bin/b43-fwcutter entry   # _start -> __libc_start_main(main=0x57c0)
node tools/decompile_elf.mjs usr/bin/b43-fwcutter 0x57c0  # full main(): arg parse + blob extraction
```

The output is real C. `_start` tail-calls `__libc_start_main` with `main` at `0x57c0`;
`main` opens the driver file with `fopen`, walks options with `strcmp`/`strlen`, and byte-swaps
firmware blobs. Because the binary is a **stripped PIE** whose executable segment has
`Offset 0x0 → VirtAddr 0x0`, the flat loader uses **base `0x0`** (file offset == virtual
address). PLT stubs were pinned to libc symbols (`objdump -d`) and match the decompiled calls
exactly — evidence the load is faithful. Full corpus with provenance, hashes and per-function
C: **[`abbottabad-ghidra/outputs/kodachi-b43-fwcutter/`](./abbottabad-ghidra/outputs/kodachi-b43-fwcutter/report.md)**.

> Honest scope: these `.deb`s are stock Ubuntu code *shipped in* Kodachi, not Kodachi-authored
> logic — WMAL/kodachios ships no native Kodachi binaries (the dashboard is Bash/Rust built at
> image time), so committed `.deb`s are the only real machine code to decompile without the ISO.
> To reach `/opt/kodachi`'s own binaries you still need an authenticated ISO (§5).

---

## 7. Kodachi vs the neighbours

| | **Kodachi** | **Tails** | **Whonix** | **Buscador** |
| --- | --- | --- | --- | --- |
| Goal | VPN **+** Tor anonymity, daily driver | Tor-only, amnesic | Tor isolation via 2 VMs | OSINT **collection** |
| VPN by default | **Yes** (forced) | No (Tor only) | No | No (Tor available) |
| Persistence | Live **or** installable | Live-only | VM | VM |
| Base | Debian 13 (v9) | Debian | Debian | Debian/Ubuntu family |
| Status | **Active** | Active | Active | **Discontinued** |

Kodachi's VPN-then-Tor default is also its most debated design: layering a VPN, system torrification and Tor-DNS is *not* a configuration the Tor Project recommends, and reviewers note it can complicate rather than strengthen anonymity depending on threat model. Document it; don't oversell it.

---

## 8. Sources

- Kodachi OS — Desktop edition wiki (v9, Debian 13, SHA-256, RSA-4096 signing): https://www.kodachi.cloud/wiki/bina/desktop-debian.html
- Kodachi OS — Terminal Server edition wiki (protocols, SHA-256): https://www.kodachi.cloud/wiki/bina/terminal-version.html
- LinuxForDevices — *Kodachi Linux: complete guide* (v9 rebuild onto Debian 13, Rust dashboard, 14 protocols, signing chain): https://www.linuxfordevices.com/tutorials/linux-kodachi-supreme-level-of-privacy
- MakeUseOf — default creds + the "keep the kodachi user" warning: https://www.makeuseof.com/linux-kodachi-privacy-focused-distro/
- Grokipedia — *Linux Kodachi* (founding date, provider list, OpenVPN/WireGuard failover): https://grokipedia.com/page/linux_kodachi
- archive.ph capture of digi77 Kodachi page — the `Own_VPN_Config/myownvpn.ovpn` bring-your-own steps + creds: https://archive.ph/9qxoZ
- DistroWatch — release listing, ISO sizes, SHA512, creds: https://distrowatch.com/10317
- HandWiki — *Software:Linux Kodachi* version history (Mint → Debian 9.5 → Ubuntu 20.04 → Xubuntu 18 → Debian 13): https://handwiki.org/wiki/Software:Linux_Kodachi
- LinuxInsider — *Kodachi Builds Privacy Tunnel for Linux* (5.6 = Debian 9.5 / Xubuntu 18.04): https://www.linuxinsider.com/story/kodachi-builds-privacy-tunnel-for-linux-85762.html
- r/linux4noobs — v9 login caveats (Live vs hardened, `Security4All` community claim): https://www.reddit.com/r/linux4noobs/comments/1oskmw5/linux_kodachi_login/

---

*Have an authenticated ISO? Verify it in the [Distro Dossier](./distro-dossier.html), extract `/opt/kodachi` ELF binaries, and decompile them in [`ghidra-lab.html`](./ghidra-lab.html). Then the OSINT-collection side is covered in [`buscador-deep-dive.md`](./buscador-deep-dive.md).*
