# Wireless charging pad + rechargeable mono Bluetooth speaker

Built: **8 October 2026**. Page: `/wireless-charge-pad.html`. Engine:
`js/wireless-charge.js`. Checks: `node tools/verify_wireless_charge.mjs` (82
assertions) and `node --test tests/wireless-charge.test.mjs` (14 tests, one of
which boots the page in jsdom). Both are wired into `tests/run.sh`.

## The brief, and how I read it

> Create wireless charging pad also rechargeable version for mono Bluetooth
> speakers about one half inch diameter by two inch high

Read as: a cylindrical mono Bluetooth speaker **0.5 in = 12.70 mm diameter ×
2 in = 50.80 mm tall**, a pad that recharges it with no contacts, and a
rechargeable version of the speaker (cell + charge control + receiver coil).

Two readings of "0.5 in × 2 in" are possible — the speaker or the pad. The page
treats both as inputs, so the geometry is not baked in; the defaults are the
speaker. Everything else (coils, cell, electronics) had to be inferred, and
every inference is an editable field on the page rather than a decision hidden
in code.

## The finding that shapes the design

**A Ø12 mm receiver coil cannot meet the WPC receiver requirement, and a
Qi-band link between coils this small is a few percent efficient.** Both halves
are arithmetic, and both are asserted in the test suite:

1. *Quality factor.* TI's `bq5105xB` datasheet, stating the WPC v1.2 receiver
   requirement, asks for `Q = 2πfL/R > 77`. The one real catalogue coil that
   fits this body — TDK `WR121210-27M8-ID`, Ø12.0 × 0.34 mm, 8.32 µH at
   100 kHz — has a DC resistance of 0.95–0.98 Ω. That gives
   **Q = 5.3 at 100 kHz** and **53 at the 1 MHz test point**. Passing would
   need **≤ 68 mΩ** in a 12 mm winding: about fifteen times better than the
   published part, and not achievable in that window with any practical
   conductor.
2. *Link efficiency.* With the coils that actually fit (Ø14 mm pad, Ø10 mm
   speaker, 1.5 mm gap, k = 0.476), driving at 125 kHz inside the WPC band
   gives **2.8 % link efficiency, 13.8 A in the pad coil, and 26.3 W drawn
   from the pad to put 0.57 W into the cell**. ωL at 125 kHz is a fraction of
   an ohm, so the resonant circuit presents almost no impedance and the
   inverter simply dumps current.

Move the same pair to **6.78 MHz** — the ISM band, where FCC Part 18 sets no
in-band power limit — and the same coils give **97.8 % link efficiency, 0.26 A,
761 mW in for 573 mW into the cell**. That is the whole design decision, and
the page's frequency chart is the evidence: efficiency rises monotonically from
3 % at 125 kHz to ~98 % at 6.78 MHz because coil Q rises with frequency while
the coupling stays fixed.

The cost is stated plainly: a proprietary link means no WPC certification, no
Qi interoperability, no riding the Qi ecosystem — and an FCC Part 18 filing
(KDB 680106) instead.

## The three designs on the page

| | **As stated, Qi band** | **Matched micro pair** | **Qi BPP** |
|---|---|---|---|
| body | Ø12.70 × 50.80 mm | Ø12.70 × 50.80 mm | Ø26 × 50.80 mm |
| pad coil | Ø14 mm, 11 T | Ø14 mm, 11 T | A11 Ø43 mm (catalogue) |
| receiver coil | Ø10 mm, 15 T | Ø10 mm, 15 T | Ø22 mm, 11 T |
| frequency | 125 kHz | 6.78 MHz | 125 kHz |
| coupling k | 0.476 | 0.476 | 0.309 |
| Q (TX / RX) | 6 / 8 | 231 / 293 | 124 / 77 |
| link efficiency | 2.8 % | 97.8 % | 37.8 % |
| end to end | 2.2 % | 75.3 % | 29.9 % |
| pad coil current | 13.84 A | 0.26 A | 6.54 A |
| pad input for 0.57 W to cell | 26.3 W | 0.76 W | 6.55 W |
| charge / playback | 2.13 h / 9.3 h | 2.13 h / 9.3 h | 1.79 h / 9.7 h |
| stack | 48.35 of 50.00 mm ✓ | 48.35 of 50.00 mm ✓ | 44.20 of 49.80 mm ✓ |

The Qi row uses **catalogue data, not the model**, where catalogue data exists:
the A11 coil's published 6.3 µH and 40 mΩ (TDK `WT505090-10F2-A11-G1`, 6.3 µH
at 100 kHz / 60 mΩ; Vishay `IWTX5050CZEB6R3KF1`, Q 120, 36–45 mΩ), and the WPC
floor Q = 77 for the receiver. Catalogue values are trusted only within a
factor of two of their test frequency — sweep further and the model takes over
and says so. That matters because the model's reconstruction of the A11 winding
comes out at 4.49 µH / 55 mΩ, which would have made Qi look twice as bad as it
is.

## The recommended build (matched micro pair)

**Speaker, base upward** — 48.35 mm of the 50.00 mm available inside a
Ø12.70 × 50.80 mm body with a 0.8 mm wall:

| # | part | Ø | height |
|---|---|---|---|
| 1 | micro driver, 4 Ω | 10.0 | 2.50 mm |
| 2 | PCB: Qi RX-class IC + BT SoC + I²S amp | 10.5 | 1.00 mm |
| 3 | Li-ion 10440 (Ø10.5 × 44 mm, 320 mAh) | 10.5 | 44.00 mm |
| 4 | ferrite / magnetic sheet | 10.0 | 0.15 mm |
| 5 | RX coil, Ø10 mm, 15 T of 20 × 0.05 mm litz | 10.0 | 0.20 mm |
| 6 | base wall + adhesive | 10.0 | 0.50 mm |

**Electrical:** RX 1.33 µH free × 1.45 (ferrite) = 1.93 µH, 121 mΩ dc →
281 mΩ ac, Q 293. Cs 285 pF, no parallel cap off the Qi band. Pad coil
906 nH, 72 mΩ dc → 167 mΩ ac, Q 231. Pad drive 5.95 V peak at 6.78 MHz.

**Receiver chain:** V_RECT 4.64 V at 143 mA into the cell; 92 % charger,
Schottky bridge. Charge 2.13 h (CC to 98 % SoC, then CV). Playback 9.3 h at
12 mA SoC + 2.4 mA amp quiescent + 18 mA average amplifier draw (0.5 W peak
acoustic ÷ 8 crest ÷ 92 % efficiency).

**Thermal:** 0.18 W of receiver-side loss over 22.8 cm² at h = 10 W/m²K gives
**+7.8 K**, i.e. 32.8 °C in a 25 °C room. Comfortable, but it is a lumped
whole-part number, not a hot spot.

**Acoustics:** the sealed cavity behind the diaphragm is 4.44 cc with its first
standing-wave mode at 1870 Hz (c/4L) — right in the voice band, so it wants
damping. Beyond that, acoustics are *not* modelled: a Ø10 mm driver is an
earpiece-class transducer and its sensitivity, max SPL and low-frequency
behaviour have to be measured, not estimated.

**Bill of materials** — the rows with a source are real, checked parts:

- TDK `WR121210-27M8-ID` — Ø12.0 mm receiver coil, 8.32 µH, 0.95 Ω (Digi-Key
  445-174577-ND). Listed for reference: it *fits*, and its DCR is exactly why
  a 12 mm Qi receiver does not work. The recommended design winds its own
  15-turn litz coil instead.
- TI `BQ51050BRGER` — Qi receiver with integrated Li-ion charge controller.
- ADI `MAX98357A` — I²S class-D mono amp, 3.2 W into 4 Ω at 5 V, 92 % at 1 W,
  2.4 mA quiescent.
- Li-ion **10440** — Ø10–10.5 × 44 mm, 300–400 mAh, plus a protection IC and
  NTC (a bare 10440 has no protection of its own).
- TDK `WT505090-10F2-A11-G1` or Vishay `IWTX5050CZEB6R3KF1` — the Qi-route pad
  coil, if you take that route.
- Ferrite / magnetic sheet with µ′ > 100 at the operating frequency
  (NXP AN4866, TDK Qi coil construction).
- C0G/NP0 25 V tuning capacitors — not X7R, which self-heats in this service
  (TI E2E guidance).
- A Bluetooth 5 audio SoC with I²S output — left as a vendor choice; its
  streaming current is the single biggest number in the runtime budget, so
  measure it before trusting 9.3 h.

The page exports the BOM as CSV, the link as an ngspice deck, and the two
enclosures as OpenSCAD and as binary STL (lathed from a closed profile; the
mesh volume is checked against Pappus to 1.1e-4 relative).

## What is modelled, and what is not

Modelled, and independently checked:

- self inductance by the filament method (pairwise Grover mutuals + the
  round-wire loop formula on the diagonal), cross-checked against a
  brute-force Neumann double integral — agreement ~1e-13 relative;
- coupling between the two coils, coaxial by closed form and misaligned by
  numerical integration;
- the series-series resonant link, solved exactly at one frequency and checked
  against the closed-form optimum-load efficiency `k²Q₁Q₂/(1+√(1+k²Q₁Q₂))²`
  (agreement 5e-3) and against power conservation (exact to 1e-9);
- the rectifier/charger chain, which must return exactly the link's delivered
  power (it does, to 1e-9);
- CC/CV charge integration with energy bookkeeping (in = stored + heat to
  1e-6) and TI's published tuning example (C1 = 158.3 nF, C2 = 1.60 nF for
  Ls′ = 16 µH, against 1.63 nF quoted in TI's forum).

Not modelled, and flagged as such on the page:

- **ferrite field shaping** — collapsed into one multiplier (`ferriteFactor`,
  default 1.45 from TI's published 11 µH → 16 µH example). A real sheet needs
  measurement; this is the single largest uncertainty in the inductances.
- **turn-to-turn proximity effect** — a derate you set (`proximityFactor`,
  default 1.5–2.0). The Q values at 6.78 MHz are optimistic without it.
- **FOD and ASK communication margin**, coil self-resonance, and everything
  acoustic.
- **The ngspice deck is checked structurally, not run** — ngspice is not
  installed here. Node names, element count, the K statement and the element
  values are verified against the solve; the simulation itself is yours to run.

## Sources

- WPC Qi band 110–205 kHz, low-power ≤ 5 W — ST, *Wireless Charging in
  Consumer Applications*; TDK Qi coil portfolio (A1/A9/A10/A11, 43 mm OD,
  6.3 µH / 24 µH).
- Receiver coil Q > 77, `Cs = 1/((2π·f_s)²·Ls′)`, `Ls` vs `Ls′`, 25 V
  capacitors, X7R heating — TI `bq5105xB` datasheet and TI E2E threads.
- Typical WPC coupling 0.5–0.7, small-receiver misalignment sensitivity, A11
  ≈ 50 mm / 6.3 µH, adapting Qi ICs to low-power designs — TI **SLYT570**.
- TDK `WR121210-27M8-ID` — Ø12.0 mm, 8.32 µH at 100 kHz, 0.95–0.98 Ω, 0.34 mm
  tall (Digi-Key 445-174577-ND, RS 185-8378).
- TDK `WT505090-10F2-A11-G1` / `WCT38466-N0E0SST101`; Vishay
  `IWTX5050CZEB6R3KF1` (6.3 µH, Q 120, 36–45 mΩ); litz DCR 20–100 mΩ —
  TDK, Arrow, NXP **AN4866**.
- ADI `MAX98357A` — 3.2 W/4 Ω/5 V, 92 % at 1 W into 8 Ω, 2.4 mA quiescent,
  2.5–5.5 V supply.
- 10440 Li-ion — Ø10–10.5 × 44 mm, 300–400 mAh typical, 4.2 V charge.
- WPT above 9 kHz is an intentional radiator under Part 15 and/or Part 18;
  Part 15 bars 90–110 kHz (§15.205); Part 18 sets no in-band power limit at
  6.78 MHz; RF-exposure compliance applies either way — FCC **KDB 680106**.
