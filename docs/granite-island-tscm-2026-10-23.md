# T10.2 — Granite Island TSCM (2026-10-23)

The backlog's "Granite Island TCSM" (sic) is **Granite Island Group**
of Gloucester, Massachusetts — tscm.com — founded 1987 by James M.
Atkinson, and TSCM is **Technical Surveillance Counter Measures**
(the firm's own expansion; the user's "technical security counter
measures" is the same field). Granite Island is the field's most
visible public practitioner: the firm began providing TSCM/SIGINT
training to the Army Intelligence School at Fort Devens, publishes
its inspection doctrine openly, and Atkinson maintains what he
describes as the world's largest private reference library of
technical-surveillance devices (a quarter-million-device database).
A useful cross-reference for T6.1: Computerworld (2012) records
Atkinson's own statement that he worked as a TSCM engineer for the
CIA and for **In-Q-Tel** — self-reported, but a primary-source-shaped
data point for the In-Q-Tel identification strand.

## What was distilled, and where it lives

`resources/tscm/granite-island-inspection-2026-10-23.json` turns the
firm's two doctrine pages — *Technical Surveillance Threat Levels and
Defensive Countermeasures* and *Sequence of Events for a TSCM
Inspection* — into a structured checklist
(`tests/tscm-checklist.test.mjs`, 4/4):

- **10 threat levels, 4 groupings.** Granite clusters ten levels of
  technical-surveillance threat: consumer/amateur classes at the
  bottom (Level 1: consumer toys — wireless mics, baby monitors,
  Wavecom transmitters, mostly <1 GHz and <50 mW, detectable with
  under $1,500 of kit), professional and law-enforcement classes in
  the middle, state/intelligence classes at the top (Granite's figure
  for the top level: at least **$750,000** of TSCM equipment), and a
  fourth grouping for emerging — or frankly imaginary — threats.
  Detection difficulty rises about an order of magnitude per level,
  which is the doctrine's central planning rule.
- **A 13-phase inspection sequence** that escalates *silently*:
  secure contact (never over a suspect phone) → commissioning →
  external survey → vulnerability analysis → passive walk-through
  (catches PI/spy-shop/amateur devices in ~4 h) → passive RF/light
  monitoring (20 Hz–110 GHz, 300–1710 nm) → active non-alerting
  inspection (wiring, PBX, phone lines traced to the central office;
  the typical corporate level) → alerting scans (chirp detection,
  thermal, cavity inspection) → TDR-verified full evaluation (the
  diplomatic/intelligence level) → NLJD/X-ray specials → preventive
  sealing and monitoring → reporting → and, if a device is found,
  documentation, law-enforcement notification, and forensic analysis
  — in that order, preserve-first.
- **Baseline parameters** for any full inspection (all RF 20 Hz to
  >110 GHz; light 250–1750 nm; every outlet, switch, PBX/LAN/WAN
  connection, copier/fax/imaging device, fibre run, and lock
  evaluated).

## Boundary kept

TSCM is a defensive discipline, and this distillation stays on the
defensive side: threat *classes* are characterised so an inspection
can be planned, exactly as Granite publishes them. The firm's
device-construction and placement detail is not reproduced, no
eavesdropping technique is described operationally, and the
checklist's only "response" content is document-preserve-notify.
This matches the strand's purpose in S10 — reference material for
the recipe corpus — without turning the repo into a bugging manual.

## Remaining in T10.2

Granite Island strand closed. Still open in T10.2: **Ghidra
DTSearch** (needs the JVM/Ghidra runner route, as with T1.2/T2.1)
and the **cookbook recipes** tail (new CyberChef recipes keyed to
the lecture-hall corpus — a build item, not a research item). The
algorithms-book cross-check and the shared lecture-hall induction
were discharged earlier (T10.3, T12.1).

## Sources

Granite Island Group: `tscm.com/threatlvls.html`,
`tscm.com/TSCMSequence.html`, `tscm.com/mission.html`,
`tscm.com/biojma.html` (retrieved 2026-10-23); Computerworld,
"Surveillance counter-measures expert exposes illegal court
eavesdropping" (2012) for the CIA/In-Q-Tel employment statement —
flagged in-text as Atkinson's own account. SANS/GIAC's TEMPEST
introduction (2005) independently cites Atkinson as a 20-year
TEMPEST/TSCM practitioner, corroborating the firm's longevity.
