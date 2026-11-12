# Mobile Device Identifier, SIM/Network Unlock, Rooting & Metasearch Research (T8.4)

**Date**: 2026-11-11
**Scope**: Stream S8 (`T8.4` follow-up & research expansion) — Mobile Baseband, SIM Lock, Android Rooting Ecosystem, and Metasearch Architectures
**Companions**:
- `docs/sim-lock-research-2026-10-23.md`
- `docs/agent-backlog-2026-10-21.json`
- `docs/README.md`

---

## 1. IMEI Structure & Cryptographic Checksum Analysis

The International Mobile Equipment Identity (**IMEI**) is an internationally standardized 15-digit decimal string specified in **3GPP TS 23.003**.

### 1.1 Structural Decomposition of Specimen `351085030363184`

$$\text{IMEI} = \underbrace{35108503}_{\text{TAC (8 digits)}} - \underbrace{036318}_{\text{SNR (6 digits)}} - \underbrace{4}_{\text{CD (1 digit)}}$$

1. **Type Allocation Code (TAC — `35108503`)**:
   - **Reporting Body Identifier (RBI — `35`)**: Issued by BABT (British Approvals Board for Telecommunications), the primary GSMA allocation authority for the UK, European, and global GSM equipment markets.
   - **Model Allocation (`108503`)**: Identifies the specific hardware revision and radio baseband chipset registered with the GSMA Type Approval register.
2. **Serial Number (SNR — `036318`)**:
   - Unique device unit sequence number assigned by the manufacturer within the TAC production batch.
3. **Luhn Check Digit (CD — `4`)**:
   - Derived mathematically across the first 14 digits using the Luhn mod-10 formula:
     $$\sum_{i=1}^{14} \text{doubled\_digit}(d_i) \equiv 0 \pmod{10}$$
   - Digits in odd positions from the right are doubled, and digits $> 9$ have their components summed ($2d - 9$).
   - Evaluation of `35108503036318`:
     $$3 + (10 - 9) + 1 + 0 + 8 + (10 - 9) + 0 + 6 + 0 + 6 + 6 + 6 + 1 + (16 - 9) = 36$$
     $$(10 - (36 \bmod 10)) \bmod 10 = 4$$
   - The check digit matches exactly. The specimen is a valid, syntactically conforming IMEI.

---

## 2. Decoupling the Mobile Identity Stack

A recurring confusion in mobile systems engineering is conflating network routing, radio subsidization, and OS authorization. These exist on separate architectural planes:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Local Number Portability (LNP)                           │
│    Routing: NPAC / SPID / MSISDN / FCC 47 CFR § 52          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Carrier Network
┌──────────────────────────────▼──────────────────────────────┐
│ 2. SIM / Network Subsidy Lock (Baseband / Modem NVRAM)      │
│    Filtering: MCC-MNC / IMSI / Carrier Lock / DMCA § 1201   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Hardware Trust
┌──────────────────────────────▼──────────────────────────────┐
│ 3. Application Processor Bootloader (Android OS / AVB)      │
│    Execution: fastboot / Verified Boot / Magisk / KernelSU  │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Local Number Portability (LNP)
- **Layer**: Telecommunications numbering plane (FCC 47 CFR § 52.20–52.36).
- **Function**: Re-maps an E.164 phone number (`MSISDN`) to a new carrier's Service Provider Identifier (`SPID`) within the Number Portability Administration Center (`NPAC`).
- **Mechanism**: Initiated via Number Transfer PIN (`NTP`) and account authentication. Porting only routes calls/SMS to the new carrier; it does **not** alter device baseband firmware.

### 2.2 SIM / Network Carrier Lock
- **Layer**: Baseband processor (BP) / Non-Volatile Memory (`NVRAM` / `EFS`).
- **Function**: The modem firmware inspects the subscriber identity module's `EF_IMSI` elementary file upon boot and compares the Mobile Country Code (`MCC`) and Mobile Network Code (`MNC`) against a carrier-enforced whitelist.
- **Lawful Path**:
  - Protected under DMCA § 1201 exemptions (Pub. L. 113-144; renewed 89 FR 85437, Oct 2024).
  - Unlocking is performed remotely via authorized carrier provisioning (e.g., Apple GSX activation servers or carrier OMA-DM tokens), clearing the baseband carrier restriction flags permanently.

### 2.3 Bootloader Unlocking & Rooting (Application Processor)
- **Layer**: Application Processor (`AP`) / UEFI / Little Kernel (`LK`) bootloader.
- **Function**: Android Verified Boot (`AVB 2.0`) verifies cryptographic RSA/ECC signatures on `boot`, `init_boot`, and `vendor_boot` partitions.
- **Rooting Ecosystem**:
  - `Magisk` (`topjohnwu/Magisk`): Patches the init binary in the boot image ramdisk to launch a root daemon while maintaining systemless mounts.
  - `KernelSU` (`tiann/KernelSU`): Implements kernel-space root directly inside the Generic Kernel Image (`GKI`), intercepting `execve` system calls without modifying userspace partitions.
  - `APatch`: Hooks the kernel via KernelPatch and inline patching.
- **Isolation Invariant**: An unlocked bootloader cannot remove a baseband SIM lock because the baseband modem operates on an isolated processor core with independent secure boot and encrypted NVRAM.

---

## 3. Privacy-Preserving Metasearch Architecture

Metasearch engines decouple user identity from centralized search indexing by querying multiple backend engines anonymously.

### 3.1 SearXNG & Directory Topology (`searx.space`)
- **Engine Core**: SearXNG (Python-based fork of SearX) aggregates results from up to 240+ search backends (Google, Bing, DuckDuckGo, Qwant, Brave, Startpage, Wikipedia, GitHub, GitLab, Archive.org).
- **Public Instance Directory (`searx.space`)**:
  - Maintains automated probe bots (e.g., `tiekoettercom/searx-instances-uptime`) measuring latency, TLS certificates, DNSSEC status, and upstream blocking.
  - Categorizes instances by logging policy (zero-log guarantees, POST request support, Tor onion routing).

### 3.2 Metasearch Nodes: `libresearch.space`, `baresearch.org`, `utilibre.org`
- Community-hosted, keyless SearXNG nodes designed for privacy-centric browsers and API clients:
  - Strip HTTP referrers, tracking cookies, and user-agent fingerprints.
  - Enforce outgoing queries over local forward proxies to prevent backend correlation.
  - Provide machine-readable JSON interfaces (`/search?q=...&format=json`) for automated developer research without requiring commercial API keys.

---

## 4. Repository Integration & Standing Boundaries

- **Compliance with Standing Decisions (F3/F4)**:
  - Technical analysis is strictly architectural, legal, and educational.
  - No brute-force unlock generators or malicious baseband exploit payloads are hosted.
  - Metasearch and legal reference pathways provide open, free-tier alternatives to commercial legal databases (LexisNexis) and proprietary tracking crawlers.
