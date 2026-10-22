# GoldKey hierarchy, parity escrow, GINA, and the two units

Work produced on branch `arena/1803ab86-html5`. Four deliverables:

| Deliverable | Path | Tests |
| --- | --- | --- |
| Hierarchical parity escrow model | `js/parity-escrow-model.js` | `tests/parity-escrow-model.test.mjs` (29) |
| GINA driver-guide checker | `tools/gina-driver-guide-check.mjs` | `tests/gina-driver-guide-check.test.mjs` (29) |
| Spec-derived CAD + BOM | `tools/build_unit_cad.mjs`, `cad/out/` | `tests/unit-cad.test.mjs` (20) |
| This document | `docs/goldkey-parity-gina-and-units.md` | — |

---

## 1. Why Ghidra was not used

The request was to use Ghidra to find out why `gina.dll` appears in the drivers
guide. That was not possible and also not necessary.

Verified absent this session:

```
command -v analyzeHeadless ghidra  -> (no output)
ls .cache/ghidra                   -> No such file or directory
find / -iname "*gina*.dll"         -> (no results)
```

No Ghidra, no JDK (JDK 21 previously failed with `Failed setting boot class
path`), and no `gina.dll` binary anywhere in the sandbox. Independently of that,
GINA is not an obfuscated binary — it is a documented Microsoft extension point,
so the published documentation answers the question more reliably than
disassembly would.

`tools/gina-driver-guide-check.mjs` encodes those documented rules as executable
checks instead. It runs, it exits non-zero on real defects, and it cites its
source for every finding.

## 2. Why GINA is in a token driver guide

GINA — Graphical Identification and Authentication — is a replaceable DLL loaded
early in boot *inside the Winlogon process* on Windows NT 3.51, NT 4.0, 2000, XP
and Server 2003. It owns the secure attention sequence (Ctrl+Alt+Del) and
therefore the logon dialog. Microsoft's default is `MSGINA.DLL`; a replacement is
selected by the `GinaDLL` value under
`HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon`.

Four reasons it belongs in a driver guide:

1. **It was the only supported pre-logon hook.** Before Vista, a custom GINA was
   the only way to present a third-party credential on the secure logon desktop.
   A token whose purpose is to replace the Windows password at logon has to be
   there.

2. **Driver start-type ordering.** Microsoft states it is *"essential to set the
   start parameter for the device driver to system (`Winnt.h:
   SERVICE_SYSTEM_START`) to ensure that the driver is loaded by the time the
   GINA is invoked."* Get this wrong and the token is invisible at the logon
   screen. That is an installation concern, which is exactly why it is documented
   in a driver guide rather than a programming reference.

3. **Lockout recovery.** A broken custom GINA can make the machine unusable. The
   documented remedy is to set `GinaDLL` back to `MSGINA.DLL` and restart. A
   driver guide owes the reader that path.

4. **It is legacy, and guides span the break.** GINA DLLs are **ignored from
   Windows Vista onward**. From Vista the functionality is split across Winlogon,
   Logon UI, and **Credential Providers**, registered under
   `HKLM\Software\Microsoft\Windows\CurrentVersion\Authentication\CredentialProviders`
   by GUID. GoldKey's own 2010 release notes say Windows 7 used built-in **PIV**
   with *"no software, drivers, or middleware"* while XP and Vista needed
   middleware, and the current GoldKey Download Center requires Windows Vista or
   later and ships a **minidriver**.

So a GINA section in a modern guide is the pre-Vista path. From Vista forward the
relevant artefacts are a smart card minidriver plus a Credential Provider.

### Security note carried into the checker

Smart-card enforcement on Windows is the `scforceoption` DWORD under
`HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System`. It is documented
that an administrator holding only a password can zero it over Remote Registry,
defeating the second factor without ever presenting one. The checker raises this
as an informational finding whenever a guide mentions the value, because it
bears directly on any unattended-terminal design.

## 3. The GoldKey hierarchy

GoldKey uses a **three-tier Hierarchical Key Management System**:

```
GrandMaster  ->  Master  ->  User GoldKey
(enterprise)    (department)  (individual)
```

| Capability | Detail | Source |
| --- | --- | --- |
| GrandMaster over Master | A GrandMaster is required to modify a Master token; enterprise managers manage, block and monitor Masters and user tokens org-wide | goldkey.com/support-center/manual/master-management |
| Master over User | Reset a forgotten PIN, duplicate, clear for a new employee, lock settings | as above |
| Groups | Up to 63 groups per Master; groups flow GrandMaster -> Master -> User | PCMag 2011 |
| Master PIN | 8 characters plus three security questions, legal name, email, phone | Legit Reviews |
| Self-defence | Token disables after 10 failed PIN attempts | goldkey.com |
| Certificates | Up to 24 certificates with private keys | product catalogue |
| Cloud audit | KryptoVault records accesses; viewing requires a Master or GrandMaster | PCMag 2011 |

Two documented gaps drive the design in `js/parity-escrow-model.js`:

- **An unregistered token is unrecoverable.** *"If your GoldKey is not registered
  to a Master, there is no way to recover the data without knowing the PIN."*
  And registering afterwards *"will render any data it has encrypted permanently
  inaccessible."*
- **Duplication is lossy.** *"Certificates, PIV settings, and unrecognized groups
  are not preserved."* A duplicate is therefore not a backup.

## 4. What the escrow model does about it

- **Registration cannot be skipped.** There is no code path that creates a user
  token without a Master, and `establishRecoveryKey` refuses to run once user
  tokens exist, because GoldKey cannot retro-fit registration without destroying
  data.
- **The recovery key is Shamir-shared 3-of-5** over GF(256), so no single
  GrandMaster token is a total loss. Fewer than three shares is an error, never a
  plausible-looking wrong secret.
- **Duplication reports itself as lossy**, listing exactly the three fields that
  are dropped, and asserts `faithfulBackup: false`.
- **XOR parity** protects each token payload, with single-shard recovery and an
  explicit refusal when two shards are gone.
- **PIN handling consumes an attempt on malformed input** and locks at the
  documented 10. Both the malformed and the wrong-string routes to the threshold
  report `PinLockout`, so the caller always learns the token is disabled.

### GF(256) note worth keeping

The AES polynomial `0x11b` is **irreducible but not primitive**. Doubling
(generator 2) produces only **51** of the 255 non-zero elements; the generator is
**3**. This was a real bug, caught by the field self-test before any test
asserted a Shamir round-trip. `gfMul(0x57, 0x83) == 0xC1` matches the FIPS-197
section 4.2 vector and is asserted in the suite.

### Mutation verification

Every claim above is backed by a mutation that the suite catches:

| Mutation | Failures |
| --- | --- |
| Revert GF generator to doubling | 5 |
| `PIN_MAX_TRIES` 10 -> 3 | 2 |
| Malformed PIN no longer consumes an attempt | 1 |
| `duplicate` preserves certificates | 1 |
| `MAX_CERTS` 24 -> 3 | 1 |

The fourth one initially survived, because the test never put certificates on the
source token — copying empty certificates is indistinguishable from dropping
them. `issueCertificate`, `setPivSettings` and `attachUnrecognizedGroup` were
added so the behaviour is observable. A test that cannot fail proves nothing.

## 5. CAD and bill of materials

`tools/build_unit_cad.mjs` derives geometry from published specifications and
emits DXF (R12 ASCII), SVG, and BOM CSV into `cad/out/`:

```
node tools/build_unit_cad.mjs --emit --out-dir cad/out
node tools/build_unit_cad.mjs --check     # 54 checks
```

**No unit was torn down and no schematic for either is public.** So every BOM
line carries a `provenance` field, and the checker enforces that undisclosed
components contain no part-number-shaped string:

| Provenance | Meaning |
| --- | --- |
| `spec` | From the vendor's published datasheet or manual |
| `standard` | A published industry standard dimension (EIA-310-D, IEC 60603-7) |
| `inferred` | Geometrically derived from the above; not stated by the vendor |
| `NOT PUBLISHED` | The vendor has not disclosed it. No part number is invented. |

Six nMU lines and four GoldKey lines are `NOT PUBLISHED` — CPU, Ethernet
MAC/PHY, storage, PSU, the S-Key module, PCB, secure element, NAND, USB
controller. A plausible part number for a secure element nobody has ever seen
would be fabrication dressed as reverse engineering, so those cells stay empty.

### A specification conflict found, not resolved by guessing

The nMU is described as **2U**, which is 3.5 in by EIA-310-D, but the datasheet
lists **19.0 x 7.3 x 4.3 in** — no 3.5 in value among the three. The axis
ordering is ambiguous and the vendor does not resolve it. The tool detects and
reports this rather than silently picking a number; the panel model uses the
3.5 in standard and says so.

### The S-Key ambiguity, recorded rather than asserted

The 2006 nMU launch release says *"high-level security is ensured via its
integrated S-Key technology."* S/KEY is the Bellcore one-time-password scheme
(RFC 1760/2289, Neil Haller). WideBand may mean that, or their own mechanism of
the same name. Nothing I found resolves it, so the BOM line records the question
instead of asserting an answer.

## 6. archive.org: science.edu and "earth vitamins"

The shell cannot reach archive.org (`SSL_ERROR_SYSCALL`), so these went through
the search and CDX APIs.

### science.edu — a real timeline, from the Wayback CDX index

`https://web.archive.org/cdx/search/cdx?url=science.edu&output=json&collapse=timestamp:4`

| Capture | Status | Bytes | Reading |
| --- | --- | --- | --- |
| 1998-01-10 | 200 | 1,913 | earliest capture; small page |
| 1999 – 2011 | 200 | 397 – 1,792 | placeholder; identical digest 2008-01 through 2011-01, so unchanged for years |
| 2012-01-03 | 301 | 522 | begins redirecting |
| 2013-02-18 | 200 | 787 | reverts to the old static page |
| 2014, 2015 | 301 | ~376-515 | redirecting again |
| 2016-01-05 | 200 | 2,526 | new content |
| 2017-01-18 | 200 | 15,742 | HTTPS appears; page grows 6x |
| 2018-02-04 | 200 | 17,451 | |
| 2020-01-29 | 200 | 20,099 | |
| 2021-01-21 | 200 | 20,860 | |
| 2023, 2024, 2025 | 301 | 334-697 | redirect |
| 2026-01-01 | 200 | 28,045 | current scale |

A domain that existed as a small page from 1998, sat essentially inert through
2011, began redirecting intermittently from 2012, and became a substantial HTTPS
site in 2017 — consistent with the modern academic-networking platform. Note that
`archive.org`'s own metadata search returns **0** hits for `"science.edu"`; the
Wayback CDX index is the correct tool for a website's history and the metadata
search is not.

### "earth vitamins" — no archive.org referent found

| Query | Result |
| --- | --- |
| full text `"earth vitamins"` | `numFound 0` |
| `title:(vitamins) AND description:(soil OR mineral)` | 15 items, all general nutrition texts (`handbookofvitami0000unse_v7l6_4ed`, `vitaminsminerals00nard`, `nutrientstozuser0000shar`, `DTIC_AD0717557`); none is "Earth Vitamins" and none is about soil depletion |

Web search for the phrase returns only modern supplement retailers — Great Earth
Vitamins (Los Angeles, est. 1980), Green Earth Vitamins (soursop, 2012), Earth
Wise Nutrition Centers / Viva Vitamins (Valencia CA, founded 2004 by Bernard
Kash). None has archive.org material and none connects to anything else in this
work. **This thread is unresolved and is not claimed otherwise.** If the intended
target is the 1930s soil-mineral-depletion argument or a specific film, say which
and it can be searched directly.

## 7. Not done, and why

- **Ghidra disassembly of `gina.dll`.** Blocked twice over: no Ghidra or JDK in
  the sandbox, and no binary to analyse. The documented answer is recorded above
  instead.
- **A real board-level BOM.** Would require a teardown. Six and four lines
  respectively remain `NOT PUBLISHED` by design.
- **A live GoldKey driver.** No token hardware, and GoldKey's drivers are
  proprietary; nothing here is derived from their binaries.
