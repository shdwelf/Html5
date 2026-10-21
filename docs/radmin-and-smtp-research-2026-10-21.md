# Radmin disassembly notes + SMTP ports carrying other-than-mail (21 Oct 2026)

*Requests: “disassemble radmin” and “search github for smtp port for other than
mail”. Both are network-tooling research threads in the same posture as
[`gfi-languard-nss-research.md`](gfi-languard-nss-research.md) and the
[`software-protection-encyclopedia.md`](software-protection-encyclopedia.md)
“Radmin and remote administration tools” entry (which this deepens). F4
throughout: catalog and method only — **no brute-force, exploitation, scanning,
or relay-abuse procedures**; authorized lab use only.*

## Part A — Radmin (Famatech Remote Administrator)

### A.1 What it is

Radmin is commercial Windows remote-control software (remote desktop, file
transfer, telnet-style admin) from Famatech — a legitimate admin tool that
attackers also deploy as a stealth RAT (AV families flag misuse as
`Backdoor/Win32.Radmin` / “Radmin RAT”). Two product lines matter:
**Radmin 1.x–3.x** (client/server remote control) and **Radmin VPN** (free
LAN-over-VPN, a different codebase).

### A.2 Protocol & security facts (sources pinned)

- **Port 4899 TCP/UDP**, IANA-registered “Radmin Remote Administration”;
  default but movable (vendor helpdesk: any unused port 1–65535).
- **nmap fingerprint** (nmap-dev, 2008, in nmap-service-probes):
  probe `01 00 00 00 01 00 00 00 08 08`, match `^01 00 00 00 25` →
  `RAdmin Remote Control Software`. A fixed byte-level handshake — the natural
  first static-analysis target.
- **v2.x** (RCM, 2004): password auth became **mandatory** in 2.2 (per-user or
  NTLMv2/AD); vendor-era claims: “strong 128-bit” password storage, traffic
  “encrypted using … MD5 and TwoFish”.
- **v3.x “Radmin Security”**: per-user passwords/permissions; vendor claims
  **modified Diffie-Hellman, 2048-bit**, session keys **AES-256** per
  connection (Famatech FAQ; SC World 3.0 review).
- **Empirical census** — Shadowserver “Accessible Radmin” report (2020):
  ~36k IPv4 hosts answering with “Radmin v3.X Radmin Authentication”, plus
  v3.0/v3.3 “Windows Authentication”, v2.X remnants (152 + 28 hosts).
  Exposure data like this is why the tool deserves defensive study.
- **Detection**: Nessus plugin 11123 “Radmin Port 4899 Detection” (family
  *Backdoors*); Netify DPI catalog entry for the Radmin protocol.

### A.3 Open-source RE material on GitHub (searched 2026-10-21)

| Repo | ★ | What it documents (study source, not a how-to) |
| --- | --- | --- |
| `synacktiv/Radmin3-Password-Cracker` | 56 | Radmin Server 3 **credential-storage format** analysis (published security research). Reference for the v3 auth structure — F4: format study only, no cracking recipes reproduced here. |
| `x-ViRKiS-x/RadminRpbParser` | 6 | **`.RPB` address-book** import/export format (viewer phonebooks) — a clean file-format target. |
| `xjj0906/RadminSavePassword` | 16 | saved-password blob structures. |
| `baptisterajaut/radmin-vpn-linux` | 255 | Radmin VPN: kernel driver `\\.\RVPNNETMP` + **custom UDP protocol** bridged to TAP (for Wine) — protocol-shape documentation in code. |
| `Noodle2199453/RadminVPNForLinuxUnofficial` | 1 | same driver-protocol emulation, independent. |
| `dwj0/Remote-management`, `GMYXDS/MstscManager` | 326 / 319 | multi-tool remote-management consoles aggregating Radmin/VNC/SSH (deployment context). |

### A.4 Ghidra disassembly plan (specimen = your own licensed install or a
captured lab build)

1. `r_server.exe` / viewer: PE triage (`tools/exe_triage.py`), imports around
   WinSock + service install + auth providers (Radmin Security vs NT security).
2. The **4899 handshake** (A.2) first — locate the dispatcher that answers
   `01 00 00 00 25`, then the version/auth-mode branches (matches the
   Shadowserver census categories).
3. **Crypto inventory** (FindCrypt pass): DH parameters, AES S-boxes, whatever
   the v2 “MD5+Twofish” claim maps to in bytes. Confirm vendor claims against
   the binary — that is the deliverable, not an attack.
4. `.RPB`/saved-password parsers (A.3) as data-format case studies.
5. Boundary: isolated VMs, synthetic credentials, consented captures — the
   encyclopedia's existing Radmin paragraph stands unchanged.

## Part B — SMTP ports carrying other-than-mail

“SMTP port for other than mail” covers three GitHub research clusters
(searched via `gh api search/repositories`, 2026-10-21):

### B.1 Service identification on 25/465/587

Before abuse questions: *what is actually listening?* Tools catalogued:
`jac11/Smtp-Vrfy` (VRFY/EXPN-style enumeration across 25/465/587, SSL-aware),
`ugurcivak/smtp-port-finder` (TLS-combination discovery),
`Mosheshe664/SMTP-Enumeration`, `Daloshka/block_smtp_ports` (defensive: block
+ scan), `Greg2627/smtp-port-scanner-ceh`. The classic non-mail cases: a
honeypot/tarpit, a C2 or proxy dressed on 25/587 (fingerprint the banner —
anything that does not speak `220 … ESMTP` is a finding), and provider
retirement effects (e.g. Microsoft 365 basic-auth SMTP retirement →
`Infinihash/scanrelay`'s SMTP→Graph relay pattern).

### B.2 SMTP smuggling (the modern “other than mail” attack surface)

SEC Consult's 2023 **SMTP smuggling** research (end-of-data delimiter
confusion across gateways; CVE-2023-51764 = Postfix) lets an attacker inject
messages that one MTA sees as one mail and another sees as several —
i.e. the SMTP channel used to smuggle *non-mail-shaped* streams past
filters. GitHub: `The-Login/SMTP-Smuggling-Tools` (★152, the finding tool),
`riramar/SmuggleTP`, `suuhm/smtp_smuggling_checker.py`,
`duy-31/CVE-2023-51764` (Postfix POC), `renini/suricata-smtp-smuggling` +
`LVy-H/smtp-smuggling-lab` (Zeek detection; Wang et al., USENIX Security '25).
**Defensive direction:** the Suricata/Zeek rules and the containerized lab are
the study path; smuggling payloads are not reproduced here (F4).

### B.3 Open-relay abuse tooling (context only)

`bl4ckmamb4/OpenRelayMagic` (★82), `aziz0x48/xSMTP` (★83),
`Nitr4x/ORFinder`, `tg12/OpenMailRelayFuzzer` — open-relay finders feeding
spam infrastructure. Catalogued to understand the abuse ecosystem; do not run
against third-party mail servers (same authorization rule as Radmin).

## Cross-links

- Obtainment hygiene + mirrors for Radmin VPN, plus the LAN-gaming/DOSBox-IPX
  use case: [`abandonware-download-portals-2026-10-21.md`](abandonware-download-portals-2026-10-21.md) §1.
- Network-scanner tooling of the same era: [`gfi-languard-nss-research.md`](gfi-languard-nss-research.md).
- Remote-admin boundary language: [`software-protection-encyclopedia.md`](software-protection-encyclopedia.md)
  “Radmin and remote administration tools”.
- DOS/PE disassembly protocol: [`dos-game-disassembly.md`](dos-game-disassembly.md),
  [`exe-protection-deep-dive.md`](exe-protection-deep-dive.md).
