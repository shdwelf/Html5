/**
 * Distro Dossier — privacy / OSINT VM research console.
 *
 * Client-side only. Nothing is uploaded: file verification hashes locally in the
 * browser (WebCrypto for SHA-1/SHA-256, a bundled MD5 for the MD5-only images)
 * and compares against the published checksums baked into the dataset below.
 *
 * Sources are cited per-entry in `refs`. Where a fact is a community claim rather
 * than vendor documentation it is flagged inline.
 */

/* ------------------------------------------------------------- dataset */

const DISTROS = [
  {
    id: "buscador",
    name: "Buscador",
    glyph: "🔎",
    aka: "OSINT Investigative VM",
    status: "discontinued",
    tags: ["OSINT", "Discontinued"],
    author: "David Westcott & Michael Bazzell (IntelTechniques)",
    origin: "United States",
    firstRelease: "2017 (v1.0)",
    latest: "2.0 · January 2019 · build “under 5 GB”",
    lede:
      "A Linux VM pre-configured for online investigators — the OSINT analogue of Kali. It hand-picks collection, recon, capture and privacy tooling behind point-and-click zenity launchers instead of shipping exploitation weaponry. Retired by its authors in favour of a build-it-yourself VM taught in Bazzell's book.",
    lineage: [
      "v1.0–1.2 (2017–2018): Ubuntu-based (GNOME/MATE lineage), ~3–3.5 GB, USB-bootable",
      "v2.0 (Jan 2019): Debian/Ubuntu-family, ~5 GB, tools pulled fresh from Git with a script-only updater",
    ],
    credentials: [
      { role: "User / sudo", user: "osint", pass: "osint", note: "same password used during guest-additions install" },
    ],
    vpn: {
      summary: "Ships Tor pre-installed; no forced always-on VPN. Privacy posture is stealth + evidence capture rather than mandatory tunnelling.",
      ovpn: [],
      providers: ["Tor (preinstalled)"],
    },
    tools: [
      "Maltego CE", "Recon-ng", "Spiderfoot", "theHarvester", "Creepy", "Metagoofil",
      "ExifTool", "EyeWitness", "Sublist3r", "Photon", "Aquatone", "Datasploit",
      "OSRFramework", "Twint", "tinfoleak", "Instaloader", "H8mail", "GHIRO",
      "Hunchly", "HTTrack", "Google Earth Pro", "youtube-dl", "Tor",
    ],
    hashes: [
      { file: "Buscador2VIRTUALBOX.ova", algo: "MD5", value: "09dd771716502771af5f2bb86835e6c2" },
      { file: "Buscador2VMWARE.ova", algo: "MD5", value: "27f2d1ba37d1a15531ff34a050012ef4" },
    ],
    verification:
      "OVA = a tar of .ovf + .mf + .vmdk. Match the whole-file MD5 above, then verify the .mf's internal SHA hashes. Primary disk: Buscador2_export(vbox)(Jan-23-19)-disk001.vmdk (the Jan-2019 date is a provenance tell).",
    book: {
      title: "Open Source Intelligence Techniques — Michael Bazzell",
      note: "The Buscador site linked to Bazzell's OSINT book; later editions replace the VM with a chapter-by-chapter DIY build. Now in its 11th edition (2024).",
      url: "https://inteltechniques.com/books.html",
    },
    ghidra: [
      "Authenticate the OVA against the MD5s above, then unpack: <code>tar xvf Buscador2VIRTUALBOX.ova</code>.",
      "Convert & mount the VMDK <b>read-only</b>: <code>qemu-img convert -O raw …disk001.vmdk b.raw</code> then loop-mount.",
      "Find non-package ELF binaries (the author's custom launchers): <code>find /mnt -type f -exec file {} +</code>.",
      "Drop each ELF into the Ghidra WASM Lab — ELF is auto-sniffed. Read DISASSEMBLY / GHIDRA C / HEX·ENTROPY.",
    ],
    refs: [
      { k: "vendor", label: "IntelTechniques — Buscador 2.0 release (retired)", url: "https://inteltechniques.com/blog/2019/01/25/buscador-2-0-osint-virtual-machine-released/" },
      { k: "guide", label: "Null Byte — Using the Buscador OSINT VM", url: "https://null-byte.wonderhowto.com/how-to/use-buscador-osint-vm-for-conducting-online-investigations-0186611/" },
      { k: "guide", label: "haxf4rall — Buscador OSINT OS (install notes, ~5 GB)", url: "https://haxf4rall.com/2019/06/27/buscador-osint/" },
      { k: "repo", label: "This repo — buscador-deep-dive.md", url: "./buscador-deep-dive.md" },
    ],
  },

  {
    id: "kodachi",
    name: "Linux Kodachi",
    glyph: "刀",
    aka: "Kodachi OS · “The Secure OS”",
    status: "active",
    tags: ["Anti-forensic", "Privacy", "Active"],
    author: "Warith Al Maawali (digi77.com / kodachi.cloud)",
    origin: "Oman",
    firstRelease: "20 October 2013",
    latest: "9.x (Debian 13 “Trixie”, native Rust dashboard)",
    lede:
      "A live, anti-forensic privacy OS that forces every connection through a VPN and then Tor, encrypts DNS with DNSCrypt, and wipes the session from RAM on shutdown. One dashboard controls VPN, Tor, DNS and hardening — Tails-like, but installable as a daily driver with far more routing options.",
    lineage: [
      "Origin: Linux Mint, later Debian 9.5 (v4.3)",
      "v7 “Katana” (2020): Ubuntu 20.04 base",
      "v8.x (–8.27): Xubuntu 18.04 base",
      "v9.x (2026): rebuilt directly on Debian 13 (Trixie), XFCE, Rust dashboard",
    ],
    credentials: [
      { role: "User", user: "kodachi", pass: "r@@t00", note: "the last two characters are ZEROS, not letter O" },
      { role: "Root / sudo", user: "root", pass: "r@@t00", note: "same password; needed for su/sudo" },
      { role: "v9 hardened (community claim)", user: "kodachi", pass: "Security4All", note: "reported for some v9 hardened images — unverified vendor-side; confirm from the docs for your build" },
    ],
    vpn: {
      summary:
        "Outbound traffic is forced through a VPN AND Tor by default, with kill-switch and DNS-leak protection. v9 lists 14 routing protocols (OpenVPN, WireGuard, Shadowsocks, V2Ray, Xray, Hysteria2, AmneziaWG, Dante SOCKS5…). Providers pre-loaded to browse/benchmark/connect.",
      ovpn: [
        "Own config lives in /home/kodachi/Own_VPN_Config/",
        "Paste your provider config into myownvpn.ovpn",
        "Put credentials in myownvpnauth.txt; set auth-user-pass to ../Own_VPN_Config/myownvpnauth.txt",
        "Extra setup goes in myownvpnsetup",
      ],
      providers: ["Mullvad", "ProtonVPN", "IVPN", "NordVPN", "Riseup", "+ paste-your-own .ovpn"],
    },
    tools: [
      "Tor (Multi-Tor exit selection)", "OpenVPN", "WireGuard", "DNSCrypt", "Firejail",
      "VeraCrypt", "ZuluCrypt", "KeePassXC", "GnuPG / Kleopatra", "PeerGuardian",
      "steghide", "mat2", "nmap", "Wireshark", "LibreWolf", "Tor Browser",
      "OnionShare", "i2p", "GNUnet", "BleachBit", "Panic Room / Nuke",
    ],
    hashes: [
      { file: "linux-kodachi-xfce-9.0.1-amd64.iso", algo: "SHA256", value: "b2793ef62881a74fb65040f817e2a7b208555ef4f5713986259bdcbc257a99b6" },
      { file: "linux-kodachi-terminal-9.0.1-amd64.iso", algo: "SHA256", value: "c1140c7d9f75288b4aeb1f1cb6b961a291172f0deee2cbb8f6f71c5b9ebf0678" },
      { file: "kodachi-7.0-64.iso", algo: "MD5", value: "9526cc6b12609f2d704465071f31f688" },
    ],
    verification:
      "v9 ISOs are RSA-4096 signed with BLAKE3 + SHA-256 hashes, verifiable against the signed release manifest (not a hash pasted on a mirror). A 2023 checksum-mismatch complaint on an older release is exactly what the signed-manifest system was built to fix — always verify.",
    ghidra: [
      "Verify the ISO SHA256 against the value above (and the RSA-4096 signature).",
      "Loop-mount the ISO read-only and extract the squashfs, or mount the installed root <b>read-only</b>.",
      "The v9 dashboard is a set of Rust binaries in /opt/kodachi/… — prime targets for static analysis.",
      "Drop a Kodachi ELF binary into the Ghidra WASM Lab and read the decompiled C.",
    ],
    refs: [
      { k: "vendor", label: "Kodachi OS — Desktop edition & checksums", url: "https://www.kodachi.cloud/wiki/bina/desktop-debian.html" },
      { k: "vendor", label: "Kodachi OS — Terminal edition & checksums", url: "https://www.kodachi.cloud/wiki/bina/terminal-version.html" },
      { k: "guide", label: "LinuxForDevices — Kodachi v9 complete guide", url: "https://www.linuxfordevices.com/tutorials/linux-kodachi-supreme-level-of-privacy" },
      { k: "guide", label: "MakeUseOf — default creds & password warning", url: "https://www.makeuseof.com/linux-kodachi-privacy-focused-distro/" },
      { k: "ref", label: "HandWiki — Linux Kodachi version history", url: "https://handwiki.org/wiki/Software:Linux_Kodachi" },
    ],
  },

  {
    id: "crunchbang",
    name: "CrunchBang",
    glyph: "#!",
    aka: "the original #! (Waldorf)",
    status: "discontinued",
    tags: ["Lightweight", "Discontinued"],
    author: "Philip Newborough",
    origin: "United Kingdom",
    firstRelease: "2008 (Ubuntu-based) → Debian from v10",
    latest: "11 “Waldorf” · 6 May 2013 (final)",
    lede:
      "A minimalist, keyboard-driven Debian distro built around the Openbox window manager, tint2 and dmenu — famous for running fast on old hardware. Development stopped 6 Feb 2015; the community carried it on as BunsenLabs and CrunchBang++.",
    lineage: [
      "Early releases based on Ubuntu 9.04",
      "v10 “Statler” (Feb 2011): first Debian-stable (“Squeeze”) base",
      "v11 “Waldorf” (May 2013): Debian “Wheezy” — the last official release",
      "Release code names are Muppet Show characters",
    ],
    credentials: [
      { role: "Note", user: "—", pass: "—", note: "The original #! installer set your own account at install time (no fixed default). See CrunchBang++ for the live-session default." },
    ],
    vpn: { summary: "Not a privacy distro — a general-purpose lightweight desktop. No bundled VPN/Tor stack.", ovpn: [], providers: [] },
    tools: ["Openbox", "tint2", "dmenu", "gmrun", "Conky", "Thunar", "GTK+ apps", "Iceweasel/Firefox"],
    hashes: [],
    verification: "Original #! images are archival; prefer the maintained successors (BunsenLabs / CrunchBang++) and verify their published checksums.",
    refs: [
      { k: "ref", label: "ArchiveOS — CrunchBang Linux (history)", url: "https://archiveos.org/crunchbang/" },
      { k: "successor", label: "BunsenLabs — official-endorsed successor", url: "https://www.bunsenlabs.org/" },
      { k: "successor", label: "CrunchBang++ (#!++)", url: "https://crunchbangplusplus.org/" },
    ],
  },

  {
    id: "crunchbangpp",
    name: "CrunchBang++",
    glyph: "#!++",
    aka: "the living #!",
    status: "active",
    tags: ["Lightweight", "Active"],
    author: "Community fork (Kevin Soul et al.)",
    origin: "Community",
    firstRelease: "2015 (revives #! on Debian 8)",
    latest: "12.0 · June 2023 (Debian 12 “Bookworm”)",
    lede:
      "A community revival that recreates the CrunchBang experience on modern Debian: Openbox 3.6.1, tint2, dmenu, gmrun — still shipping a 32-bit installer for ancient hardware. This is the practical way to run a real, verifiable #! today.",
    lineage: [
      "11.x: Debian 10/11",
      "12.0 (Jun 2023): Debian 12 “Bookworm”, kernel 6.1 LTS, Openbox 3.6.1, both 32-bit & 64-bit",
    ],
    credentials: [
      { role: "Live session", user: "live", pass: "live", note: "used to log into the live ISO before installing" },
    ],
    vpn: { summary: "General lightweight desktop; no privacy tunnelling out of the box (add OpenVPN/WireGuard yourself).", ovpn: [], providers: [] },
    tools: ["Openbox 3.6.1", "tint2", "dmenu", "gmrun", "Thunar 4.18", "Geany 1.38", "Firefox ESR", "VLC 3.0"],
    hashes: [],
    verification: "Grab ISOs from the project's GitHub releases and verify their published hashes/signatures before writing to USB.",
    refs: [
      { k: "vendor", label: "CrunchBang++ project site", url: "https://crunchbangplusplus.org/" },
      { k: "news", label: "OMG!Linux — #!++ 12.0 on Debian 12", url: "https://www.omglinux.com/crunchbang-plus-plus-12-released/" },
    ],
  },

  {
    id: "tracelabs",
    name: "Trace Labs OSINT VM",
    glyph: "◎",
    aka: "the modern Buscador successor",
    status: "active",
    tags: ["OSINT", "Active"],
    author: "Trace Labs",
    origin: "Canada / community",
    firstRelease: "2020",
    latest: "Rolling (Kali-based)",
    lede:
      "A ready-made OSINT VM built on Kali, tuned for Trace Labs' missing-persons Search Party CTFs. The distro people most often migrate to now that Buscador is dead.",
    lineage: ["Built on Kali Linux (Debian)"],
    credentials: [{ role: "Default", user: "osint", pass: "osint", note: "confirm against the current release notes" }],
    vpn: { summary: "Kali base; add your own VPN. Focus is collection tooling, not forced anonymity.", ovpn: [], providers: [] },
    tools: ["Recon-ng", "theHarvester", "Sherlock", "Spiderfoot", "Maltego", "ExifTool", "Photon", "Metagoofil"],
    hashes: [],
    verification: "OVA distributed via the Trace Labs site; verify the published checksum before import.",
    refs: [{ k: "vendor", label: "Trace Labs OSINT VM", url: "https://www.tracelabs.org/trace-labs-osint-vm/" }],
  },

  {
    id: "tails",
    name: "Tails",
    glyph: "▲",
    aka: "The Amnesic Incognito Live System",
    status: "active",
    tags: ["Privacy", "Anti-forensic", "Active"],
    author: "The Tails project (Tor Project affiliate)",
    origin: "International",
    firstRelease: "23 June 2009 (as “Amnesia”)",
    latest: "6.x (Debian 12 “Bookworm” base)",
    lede:
      "The gold-standard amnesic live OS: boots from USB, forces every connection through Tor, blocks any app that tries to connect directly, and forgets everything on shutdown (runs from RAM). Used by journalists, activists and Snowden. Optional encrypted Persistent Storage is opt-in only.",
    lineage: [
      "Debian-based throughout; descends from Incognito + the original Amnesia live CD",
      "6.x: Debian 12 “Bookworm”, Wayland, ships as a .img (USB image)",
    ],
    credentials: [
      { role: "Login", user: "amnesia", pass: "(none)", note: "no login password — nothing to protect on an amnesic system" },
      { role: "Root / sudo", user: "root", pass: "disabled by default", note: "set an optional Administration Password on the Welcome Screen if you need sudo; leaving it unset is a deliberate hardening choice" },
    ],
    vpn: {
      summary:
        "Tor-only by design — NOT a VPN distro. The Tails project actively recommends against adding a VPN, since it can undermine the Tor threat model. All traffic is torified; direct connections are blocked.",
      ovpn: [],
      providers: ["Tor (forced, no VPN)"],
    },
    tools: [
      "Tor Browser", "Thunderbird", "OnionShare", "KeePassXC", "GnuPG", "Electrum",
      "Persistent Storage (LUKS)", "MAT2 (metadata cleaner)", "MAC spoofing", "Kleopatra", "LibreOffice",
    ],
    hashes: [],
    verification:
      "Tails leans on OpenPGP signatures, not pasted hashes: import the Tails signing key and run `gpg --verify tails-amd64-<ver>.img.sig tails-amd64-<ver>.img` — require “Good signature from Tails developers”. The website also offers an in-browser verification extension. Governments are known to circulate fake Tails images, so never skip this.",
    ghidra: [
      "Verify the .img OpenPGP signature; write to USB.",
      "Loop-mount the image / extract the squashfs read-only.",
      "Extract any binary of interest and triage (sha256, strings, entropy).",
      "Decompile in the Ghidra WASM Lab — but note most Tails software is stock Debian, so focus on the Tails-specific greeter/persistence tooling.",
    ],
    refs: [
      { k: "vendor", label: "Tails — official site & verification", url: "https://tails.net/" },
      { k: "guide", label: "AnarSec — Tails guide (admin password, persistence)", url: "https://www.anarsec.guide/posts/tails/" },
      { k: "ref", label: "First Time Linux — Tails users/passwords & no-root design", url: "https://linux.activityworkshop.net/live_distros/tails.html" },
    ],
  },

  {
    id: "whonix",
    name: "Whonix",
    glyph: "◱◲",
    aka: "Gateway + Workstation Tor isolation",
    status: "active",
    tags: ["Privacy", "Active"],
    author: "Patrick Schleizer et al.",
    origin: "International",
    firstRelease: "2012",
    latest: "17 (Debian 12 “Bookworm” base)",
    lede:
      "Two Debian VMs that isolate Tor: a Gateway VM does all Tor routing, a Workstation VM runs your apps and can only reach the internet through the Gateway. Even malware with root on the Workstation can't learn your real IP — the network stack simply can't see it. Not amnesic; designed to run inside VirtualBox/KVM.",
    lineage: [
      "Debian-based two-VM architecture (Gateway + Workstation)",
      "17.x: Debian 12 “Bookworm”; ships as VirtualBox .ova and KVM .qcow2.libvirt.xz",
    ],
    credentials: [
      { role: "User / sudo", user: "user", pass: "changeme", note: "same on Gateway and Workstation; change with `sudo passwd user` immediately" },
    ],
    vpn: {
      summary:
        "Tor isolation, not VPN. The Gateway torifies everything; the Workstation is network-isolated behind it. You CAN tunnel Tor over a VPN (VPN→Tor) if your threat model needs it, but it isn't the default.",
      ovpn: [],
      providers: ["Tor (via Gateway VM)"],
    },
    tools: ["Tor (Gateway)", "Tor Browser", "sdwdate (secure time)", "Whonix firewall", "KVM/VirtualBox images", "stream isolation", "Kloak (keystroke anonymizer)"],
    hashes: [],
    verification:
      "Verify the OpenPGP signature (HulaHoop's key) against the download, e.g. `gpg --verify Whonix-*.libvirt.xz.asc Whonix-*.libvirt.xz`, or check the signed SHA-512 hashes on the site. An onion mirror is available for the download.",
    ghidra: [
      "Verify the .ova/.qcow2 OpenPGP signature.",
      "Mount the qcow2 read-only (qemu-nbd) — inspect, don't boot for analysis.",
      "Extract Whonix-specific binaries/firewall scripts of interest.",
      "Decompile in the Ghidra WASM Lab; stock Debian packages aside, target the Whonix framework components.",
    ],
    refs: [
      { k: "vendor", label: "Whonix — Download & verification", url: "https://www.whonix.org/wiki/Download" },
      { k: "guide", label: "Monero Observer — Whonix on Debian/KVM (verify + creds)", url: "https://monero.observer/cypherpunk-transmission-014-whonix-virtual-machines-debian-kvm/" },
      { k: "guide", label: "Trafotin — Whonix Gateway/Workstation walkthrough", url: "https://trafotin.com/v/whonix-gateway-workstation/" },
    ],
  },

  {
    id: "csilinux",
    name: "CSI Linux",
    glyph: "⌬",
    aka: "Digital Forensics & OSINT OS",
    status: "active",
    tags: ["OSINT", "Anti-forensic", "Active"],
    author: "CSI Linux team",
    origin: "United States",
    firstRelease: "2019",
    latest: "2024.x (Ubuntu 22.04 LTS base)",
    lede:
      "A purpose-built investigation OS spanning OSINT, dark-web, incident response, computer/mobile/vehicle forensics, malware analysis/RE and SIGINT. Historically split into Analyst + Gateway + SIEM VMs (Analyst and Gateway now merged). Notably ships Ghidra itself among its reverse-engineering tools — a natural companion to this repo's WASM lab.",
    lineage: [
      "Ubuntu-based (22.04 LTS as of 2024)",
      "Editions: Analyst (core), Gateway (Tor sandbox via AppArmor/Shorewall), SIEM (Zeek + ELK)",
      "Distributed as a VirtualBox appliance / qcow2 / 7z, plus a legacy bootable & DD triage drive",
    ],
    credentials: [
      { role: "User / sudo", user: "csi", pass: "csi", note: "documented default across all editions; change on first boot" },
    ],
    vpn: {
      summary:
        "Optional Tor routing via the CSI Linux Gateway VM (AppArmor + Shorewall sandbox); when Analyst is paired with Gateway all traffic exits through Tor. Focus is forensics/collection, not forced anonymity.",
      ovpn: [],
      providers: ["Tor (via CSI Gateway)"],
    },
    tools: [
      "Ghidra", "Autopsy", "Maltego CE", "Recon-ng", "theHarvester", "Sherlock", "ExifTool",
      "Metagoofil", "Instaloader", "OnionShare", "Zeek + ELK (SIEM)", "Wireshark",
      "Radare2", "Volatility", "Sleuth Kit", "Sherlock", "Photorec/Scalpel",
    ],
    hashes: [
      { file: "CSI Linux — Bootable Triage Drive (DD)", algo: "MD5", value: "670351f4386f8512e0bd2fc830487ef8" },
    ],
    verification:
      "Download the virtual appliance (7z) or triage drive from csilinux.com and verify the published checksum (the legacy triage-drive DD image publishes the MD5 above). Extract 7z with p7zip, import the .vbox/.qcow2, log in csi/csi.",
    ghidra: [
      "Verify the appliance/triage-drive checksum; extract with p7zip.",
      "Mount the qcow2/DD read-only for offline inspection.",
      "CSI Linux already bundles Ghidra — but for a zero-install, no-upload pass, drop binaries straight into this repo's WASM lab.",
      "Read DISASSEMBLY / GHIDRA C / HEX·ENTROPY.",
    ],
    refs: [
      { k: "vendor", label: "CSI Linux — official site & downloads (csi/csi)", url: "https://csilinux.com/" },
      { k: "guide", label: "HackerNoon — CSI Linux for cyber & OSINT (Ubuntu 22.04)", url: "https://hackernoon.com/csi-linux-linux-distribution-for-cyber-and-osint-investigation" },
      { k: "vendor", label: "CSI Linux — Install guide (PDF)", url: "https://csilinux.com/files/CSIL-CI_Installing_CSI_Linux.pdf" },
    ],
  },
];

/* ------------------------------------------------------------- MD5 (compact, public-domain style) */
/* WebCrypto has no MD5, but Buscador/Kodachi-7 publish MD5 — so we bundle one. */
function md5(bytes) {
  function rol(n, s) { return (n << s) | (n >>> (32 - s)); }
  function add(a, b) { return (a + b) & 0xffffffff; }
  const s = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K = [];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;

  const len = bytes.length;
  const bitLen = len * 8;
  const withOne = len + 1;
  const total = withOne + ((56 - (withOne % 64) + 64) % 64) + 8;
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[len] = 0x80;
  for (let i = 0; i < 8; i++) msg[total - 8 + i] = (bitLen / Math.pow(2, 8 * i)) & 0xff;

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const M = new Int32Array(16);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      M[i] = msg[j] | (msg[j + 1] << 8) | (msg[j + 2] << 16) | (msg[j + 3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = add(add(add(F, A), K[i]), M[g]);
      A = D; D = C; C = B;
      B = add(B, rol(F, s[i]));
    }
    a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
  }
  const out = [a0, b0, c0, d0];
  let hex = "";
  for (const v of out) for (let i = 0; i < 4; i++) hex += ((v >>> (8 * i)) & 0xff).toString(16).padStart(2, "0");
  return hex;
}

async function digestHex(algo, bytes) {
  const buf = await crypto.subtle.digest(algo, bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ------------------------------------------------------------- checksum index */
const HASH_INDEX = new Map();
for (const d of DISTROS) {
  for (const h of d.hashes) {
    HASH_INDEX.set(h.value.toLowerCase(), { distro: d.name, file: h.file, algo: h.algo });
  }
}

/* ------------------------------------------------------------- rendering */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let activeFilter = "All";
let activeId = DISTROS[0].id;
const FILTERS = ["All", "OSINT", "Privacy", "Anti-forensic", "Lightweight", "Active", "Discontinued"];

function renderFilters() {
  const host = $("#filters");
  host.innerHTML = FILTERS.map((f) =>
    `<button class="chip${f === activeFilter ? " on" : ""}" data-filter="${esc(f)}">${esc(f)}</button>`).join("");
  host.querySelectorAll(".chip").forEach((b) => b.addEventListener("click", () => {
    activeFilter = b.dataset.filter; renderCatalog();
  }));
}

function matchesFilter(d) {
  if (activeFilter === "All") return true;
  if (activeFilter === "Active") return d.status === "active";
  if (activeFilter === "Discontinued") return d.status === "discontinued";
  return d.tags.includes(activeFilter);
}

function renderCatalog() {
  const q = ($("#search").value || "").toLowerCase();
  const host = $("#catalog");
  const items = DISTROS.filter(matchesFilter).filter((d) =>
    !q || (d.name + " " + d.aka + " " + d.tools.join(" ") + " " + d.tags.join(" ")).toLowerCase().includes(q));
  host.innerHTML = items.map((d) => `
    <button class="cat-item${d.id === activeId ? " on" : ""}" data-id="${d.id}">
      <span class="name"><span class="glyph">${esc(d.glyph)}</span>${esc(d.name)}
        <span class="status-dot ${d.status}"></span></span>
      <span class="sub">${esc(d.aka)}</span>
    </button>`).join("") || `<p class="panel-note">No matches.</p>`;
  host.querySelectorAll(".cat-item").forEach((b) => b.addEventListener("click", () => {
    activeId = b.dataset.id; renderCatalog(); renderDossier();
  }));
}

function credRows(creds) {
  return creds.map((c) => `
    <div class="hash-row">
      <div class="hfile">${esc(c.role)}</div>
      <div class="hval">user <code class="mono">${esc(c.user)}</code> &nbsp;·&nbsp; pass <code class="mono">${esc(c.pass)}</code></div>
      ${c.note ? `<div class="panel-note">${esc(c.note)}</div>` : ""}
    </div>`).join("");
}

function hashRows(hashes) {
  if (!hashes.length) return `<p class="panel-note">No published image checksums on file for this entry.</p>`;
  return `<div class="hashes">` + hashes.map((h) => `
    <div class="hash-row">
      <button class="copy-btn" data-copy="${esc(h.value)}">COPY</button>
      <div class="hfile">${esc(h.file)}</div>
      <div class="halgo">${esc(h.algo)}</div>
      <div class="hval">${esc(h.value)}</div>
    </div>`).join("") + `</div>`;
}

function renderDossier() {
  const d = DISTROS.find((x) => x.id === activeId);
  const host = $("#dossier");
  const vpnBlock = d.vpn.ovpn.length
    ? `<h3 style="margin-top:12px">OpenVPN — bring your own</h3><ol class="workflow">${d.vpn.ovpn.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`
    : "";
  const providers = d.vpn.providers.length
    ? `<div class="tool-chips" style="margin-top:8px">${d.vpn.providers.map((p) => `<span>${esc(p)}</span>`).join("")}</div>` : "";
  const ghidra = (d.ghidra || [
    "Verify the image checksum/signature (see Verification).",
    "Mount the disk <b>read-only</b> — never boot evidence.",
    "Extract ELF binaries of interest.",
    "Drop each into the Ghidra WASM Lab for static decompilation.",
  ]).map((s) => `<li>${s}</li>`).join("");

  host.innerHTML = `
    <div class="dossier-head">
      <span class="glyph-lg">${esc(d.glyph)}</span>
      <h2>${esc(d.name)}</h2>
      <span class="aka">${esc(d.aka)}</span>
      <span class="badge ${d.status}">${esc(d.status)}</span>
    </div>
    <p class="lede">${esc(d.lede)}</p>

    <div class="grid-2">
      <div class="card">
        <h3>Identity</h3>
        <dl class="kv">
          <dt>Author</dt><dd>${esc(d.author)}</dd>
          <dt>Origin</dt><dd>${esc(d.origin)}</dd>
          <dt>First</dt><dd>${esc(d.firstRelease)}</dd>
          <dt>Latest</dt><dd>${esc(d.latest)}</dd>
        </dl>
      </div>
      <div class="card">
        <h3>Lineage (base OS)</h3>
        <ul style="margin:0;padding-left:18px;color:var(--muted);font-size:12.5px;line-height:1.7">
          ${d.lineage.map((l) => `<li>${esc(l)}</li>`).join("")}
        </ul>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Default credentials</h3>
        ${credRows(d.credentials)}
      </div>
      <div class="card">
        <h3>VPN / anonymity</h3>
        <p class="lede" style="font-size:13px">${esc(d.vpn.summary)}</p>
        ${providers}
        ${vpnBlock}
      </div>
    </div>

    <div class="card">
      <h3>Published image checksums</h3>
      ${hashRows(d.hashes)}
      <p class="panel-note">${esc(d.verification)}</p>
    </div>

    ${d.book ? `<div class="note-warn"><b>Linked book:</b> ${esc(d.book.title)}. ${esc(d.book.note)} <a href="${esc(d.book.url)}" target="_blank" rel="noreferrer" style="color:var(--blue)">${esc(d.book.url)}</a></div>` : ""}

    <div class="card">
      <h3>Toolset</h3>
      <div class="tool-chips">${d.tools.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
    </div>

    <div class="card">
      <h3>Reverse-engineering workflow · extract → Ghidra WASM</h3>
      <ol class="workflow">${ghidra}</ol>
      <a class="btn-link" href="./ghidra-lab.html" target="_top">OPEN GHIDRA WASM LAB ↗</a>
    </div>

    <div class="card">
      <h3>References</h3>
      <div class="refs">
        ${d.refs.map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noreferrer"><span class="rk">${esc(r.k)}</span>${esc(r.label)}</a>`).join("")}
      </div>
    </div>`;

  host.querySelectorAll(".copy-btn").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "COPIED"; setTimeout(() => (b.textContent = "COPY"), 1200); } catch { /* ignore */ }
  }));
}

/* ------------------------------------------------------------- verifier */
function reportMatch(el, matches) {
  if (!matches.length) {
    el.className = "match no";
    el.innerHTML = "No match in the known-checksum index. Either this isn't one of the catalogued images, or the copy differs from what the vendor published.";
    return;
  }
  el.className = "match ok";
  el.innerHTML = "✓ MATCH — " + matches.map((m) => `<b>${esc(m.distro)}</b> · ${esc(m.file)} <span style="color:var(--faint)">(${esc(m.algo)})</span>`).join("<br>");
}

function checkAgainstIndex(...hexes) {
  const found = [];
  for (const h of hexes) {
    const hit = HASH_INDEX.get(h.toLowerCase());
    if (hit) found.push(hit);
  }
  return found;
}

async function hashFile(file) {
  const out = $("#verifyOut");
  const status = $("#verifyMatch");
  out.innerHTML = `<p class="panel-note">Hashing ${esc(file.name)} (${(file.size / 1048576).toFixed(1)} MB) locally…</p>`;
  status.className = "match idle"; status.textContent = "computing…";
  const bytes = new Uint8Array(await file.arrayBuffer());
  const [sha256, sha1] = await Promise.all([digestHex("SHA-256", bytes), digestHex("SHA-1", bytes)]);
  const md5hex = md5(bytes);
  out.innerHTML = `
    <div class="hash-line"><span class="lbl">MD5    </span> ${md5hex}</div>
    <div class="hash-line"><span class="lbl">SHA-1  </span> ${sha1}</div>
    <div class="hash-line"><span class="lbl">SHA-256</span> ${sha256}</div>`;
  reportMatch(status, checkAgainstIndex(md5hex, sha1, sha256));
}

function initVerifier() {
  const drop = $("#verifyDrop");
  const input = $("#verifyInput");
  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", () => { if (input.files[0]) hashFile(input.files[0]); });
  ["dragover", "dragenter"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, () => drop.classList.remove("drag")));
  drop.addEventListener("drop", (ev) => { ev.preventDefault(); if (ev.dataTransfer.files[0]) hashFile(ev.dataTransfer.files[0]); });

  $("#pasteCheck").addEventListener("click", () => {
    const v = ($("#pasteHash").value || "").trim().toLowerCase();
    const status = $("#pasteMatch");
    if (!v) { status.className = "match idle"; status.textContent = "Paste an MD5 / SHA-1 / SHA-256 hex digest."; return; }
    reportMatch(status, checkAgainstIndex(v));
  });
}

/* ------------------------------------------------------------- boot */
document.addEventListener("DOMContentLoaded", () => {
  const countTag = $("#countTag");
  if (countTag) countTag.textContent = `${DISTROS.length} entries`;
  renderFilters();
  renderCatalog();
  renderDossier();
  initVerifier();
  $("#search").addEventListener("input", renderCatalog);
});
