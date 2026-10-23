# T8.4 — SIM lock research (2026-10-23)

T8.4 asked for SIM-lock research with "LexisNexis + alternatives".
Verdict up front: for this topic the paywall is optional. Every
operative rule lives in primary sources that are free — the paywalled
databases add citators and headnotes, not law. This brief is written
entirely from the primary layer. It is a research note, not legal
advice, and it documents the lawful path only: no unlock-code
generation, no bypass tooling.

## The three layers that actually govern unlocking (US)

**1. Circumvention legality — DMCA §1201 and its exemptions.**
Unlocking software circumvents an access control, so its legality
rides on 17 U.S.C. §1201 exemptions (37 CFR 201.40):

| Year | Event |
|---|---|
| 2006 | 3rd triennial rulemaking: first handset-unlocking exemption ("sole purpose of lawfully connecting to a network") |
| 2010 | 4th triennial: exemption renewed (broader form) |
| 2012 | 5th triennial: exemption ended for phones acquired after 2013-01-26 — the decision that forced the issue |
| 2014 | **Unlocking Consumer Choice and Wireless Competition Act** (Pub. L. 113-144, signed 2014-08-01): reinstates the 2010 exemption, permits *authorised assistance* (someone may unlock for the owner/family), expressly does **not** permit bulk-resale unlocking |
| 2015 | 6th triennial: exemption broadened beyond handsets to wireless devices generally |
| 2018 / 2021 | 7th / 8th triennial: renewed |
| 2024 | 9th triennial final rule (89 FR 85437, 2024-10-28): unlocking exemption renewed again — the renewal petition drew **no opposition** |

**2. Carrier duties — mostly voluntary code, some licence conditions.**
The operative consumer rules are the six CTIA Consumer Code unlocking
commitments (adopted 2014-02-11, effective 2015-02-11): disclosure;
postpaid unlock after contract/financing/ETF is fulfilled; prepaid
unlock no later than one year after activation; notice of eligibility;
two-business-day response; deployed-military unlock on papers.
Carriers may refuse on reasonable belief of fraud/theft, and may
charge non-customers a reasonable fee. On top of that sit
licence-condition duties for specific carriers (historically
Verizon's 700 MHz / TracFone 60-day automatic-unlock rule). In June
2024 the FCC proposed (NPRM, FCC 24-77) making a uniform 60-day rule
industry-wide; that proposal had **not** been adopted when, on
2026-01-12, the FCC instead *waived* Verizon's 60-day condition
(DA 26-43), aligning Verizon with the voluntary CTIA code. Direction
of travel as of this writing: away from binding per-carrier rules,
toward the voluntary code — worth re-checking before relying on it.

**3. What the law does not give you.** No right to unlock for bulk
resale; no right against a carrier's fraud/theft refusal; the §1201
exemption covers connecting to an *authorised* network — it is not a
general jailbreaking or DRM-stripping licence (jailbreaking is a
separate exemption class, also renewed in 2024).

## How the lock works (mechanics, one paragraph)

A SIM lock is a carrier-personalisation check the handset firmware
runs against the inserted SIM's IMSI (network/subset/service-provider/
corporate levels, per 3GPP personalisation): the phone compares the
SIM's MCC/MNC (and sometimes GID fields) against stored lock data and
refuses service on mismatch. Unlocking through the lawful path means
the carrier (or OEM, e.g. Apple's activation-policy server) marks
the device's IMEI as unlocked in its database and the phone learns
the new state on activation — which is why "unlock services" that
don't touch the carrier database are either reselling carrier
submissions or doing something else entirely, and why the legal
framework above, not code, is the load-bearing layer.

## LexisNexis alternatives (the requested mapping)

| Need | Paywalled default | Free primary source used here |
|---|---|---|
| Statute text | Lexis (USCS) | govinfo / Congress.gov: Pub. L. 113-144; Cornell LII: 17 U.S.C. §1201 |
| Current exemption text | Lexis (CFR) | eCFR: 37 CFR 201.40(b) (unlocking class) |
| Rulemaking history | Lexis regulatory trackers | Federal Register (2006–2024 rules, dockets cited above); copyright.gov/1201 |
| Agency positions | Nexis news/agency wires | FCC consumer guide "Cell Phone Unlocking"; DA 26-43 (2026); NPRM FCC 24-77 (2024) |
| Caselaw + citator | Lexis / Shepard's | CourtListener + RECAP for opinions (free); Google Scholar as fallback. **Honest gap:** no free Shepard's/KeyCite equivalent — for "is this case still good law" the paywall still earns its money; for this topic there is little post-2014 unlocking caselaw to citate |

## T8.4's other strands, status

- **xdc format conversions** — discharged earlier (Tomcat WAR line,
  `tools/build_xdc_wars.mjs`, 54 WARs; docs/apache-struts-jsf-tomcat-xdc-war-2026-10-23.md).
- **QEMU phone lab** — partially de-risked on this branch: user-mode
  emulation is now proven in-house (qemu-m68k running the m68k
  `ftnpkt` build byte-identically, `.arena-m68k/result.md`). A phone
  lab needs `qemu-system-aarch64` plus device images — a runner job
  with real image-sourcing decisions, not attempted here.

## Sources

FCC, "Cell Phone Unlocking" (fcc.gov/general/cell-phone-unlocking);
CTIA Consumer Code for Wireless Service (2014); FCC DA 26-43
(2026-01-12) and fact sheet DOC-403542 (2024-06-27); FCC 24-77 NPRM
(2024); Pub. L. 113-144 (2014) via govinfo FR-2014-08-25 (2014-20077);
Register's Recommendation, 6th triennial (2015); 9th triennial final
rule, 89 FR 85437 (2024-10-28). All retrieved as public primary
sources; no paywalled database was needed or used.
