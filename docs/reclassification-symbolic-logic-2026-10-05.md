# Formal Proofs in Symbolic Logic: Both Sides of the Marijuana Reclassification

*Research date: 2026-10-05 · Companion to [`federal-reclassification-deep-dive-2026-10-05.md`](./federal-reclassification-deep-dive-2026-10-05.md)*

**Method note.** Each side's position is reconstructed as a *valid* natural-deduction derivation: if the premises are true, the conclusion follows. Validity is symmetric here — the dispute is entirely about **soundness** (which premises are true) and **interpretive authority** (who gets to fix the meaning of the non-logical constants). § 5 locates exactly which premise each side rejects in the other's proof. First-order language with a single constant `m` (marijuana); deontic/legal operators kept to a labeled modality `PERM(·)` = "legally permissible for the agency."

## 0. Lexicon

| Symbol | Reading | Statutory anchor |
| --- | --- | --- |
| `S1(x)`, `S3(x)` | x is properly placed in CSA Schedule I / III | 21 U.S.C. § 812(b) |
| `HiA(x)` | x has high potential for abuse | § 812(b)(1)(A) |
| `LoA(x)` | x has abuse potential **less than** Schedule I & II substances | § 812(b)(3)(A) |
| `CAMU(x)` | x has a currently accepted medical use in U.S. treatment | § 812(b)(1)(B)/(3)(B) |
| `ModD(x)` | abuse of x leads to moderate/low physical or high psychological dependence | § 812(b)(3)(C) |
| `TREQ(x)` | U.S. treaty obligations (Single Convention) require control of x | § 811(d)(1) |
| `ORD(x,s)` | the AG issues a § 811(d)(1) order controlling x under schedule s | § 811(d)(1) |
| `APP(s,x)` | schedule s is the schedule the AG deems most appropriate to carry out treaty obligations for x | § 811(d)(1) |
| `HYB(o)` | order o imposes controls beyond those Congress authorized for the named schedule | petitioners' "hybrid schedule" concept |
| `AUTH(o)` | order o is within delegated statutory authority | ultra vires test |
| `REC(x,s)` | HHS recommends placement of x in schedule s | § 811(b) |

Established empirical anchors (common ground, 2026): `E1`: HHS (Aug. 29, 2023) found `LoA(m) ∧ CAMU(m) ∧ ModD(m)` and issued `REC(m,III)`. `E2`: cannabis remains in Single Convention Schedule I (not IV since Dec. 2020), so some control is treaty-required: `TREQ(m)`.

---

## 1. Argument A (government / proponents): Schedule III placement is warranted on the merits

**Premises**

```
A1  ∀x [ (LoA(x) ∧ CAMU(x) ∧ ModD(x)) → S3(x) ]        (§ 812(b)(3), read as sufficient criteria)
A2  LoA(m)                                             (HHS eight-factor analysis, 2023)
A3  CAMU(m)                                            (HHS two-part CAMU test: ≥30,000 clinicians,
                                                        43 states, credible scientific support)
A4  ModD(m)                                            (HHS dependence findings)
```

**Derivation**

```
1.  LoA(m) ∧ CAMU(m) ∧ ModD(m)            ∧I  A2, A3, A4
2.  (LoA(m) ∧ CAMU(m) ∧ ModD(m)) → S3(m)  ∀E  A1
3.  S3(m)                                  →E  2, 1
∴  S3(m)                                   ■  valid (two inference rules)
```

**Load-bearing premises:** A1's reading of § 812(b) as criteria *sufficient* for placement (the statute literally states "findings required," i.e. necessary conditions; proponents rely on the structure of § 811(a) plus the findings to make them jointly sufficient in rulemaking), and the empirical truth of A2–A4.

---

## 2. Argument B (government): the April 2026 treaty-pathway order is lawful

**Premises**

```
B1  ∀x [ TREQ(x) → PERM(ORD(x, s)) for the s such that APP(s,x) ]   (§ 811(d)(1): "shall issue an
     order … under the schedule he deems most appropriate … without regard to the findings
     required by [§ 811(a), § 812(b)] and without regard to the procedures of § 811(a)-(b)")
B2  TREQ(m)                                                          (E2)
B3  APP(III, m)                                                      (AG determination, resting on
                                                                      2024 OLC opinion: Single
                                                                      Convention obligations remain
                                                                      satisfiable at Schedule III
                                                                      with retained controls)
B4  PERM(ORD(x,s)) ∧ ORD-issued(x,s) → ¬ APA-defect(ORD)             (order ≠ rule; notice & comment
                                                                      inapplicable to § 811(d) orders)
```

**Derivation**

```
1.  TREQ(m)                        B2
2.  TREQ(m) → PERM(ORD(m, III))    ∀E B1, with B3 discharging the APP condition
3.  PERM(ORD(m, III))              →E  2, 1
4.  ¬ APA-defect(ORD)              →E  B4, 3 + fact of issuance
∴  lawful(ORD(m, III))             ■  valid
```

---

## 3. Argument C (petitioners / opponents): the April 2026 order is ultra vires

**Premises** (from the consolidated D.C. Circuit petitions)

```
C1  ∀o [ ¬AUTH(o) → vacate(o) ]                               (APA § 706(2)(C))
C2  ∀x,s [ ORD(x,s) via § 811(d)(1) ∧ below-II(s) ∧
           ¬ConventionCompels(s,x) → ¬AUTH(ORD(x,s)) ]        (NORML v. DEA, 559 F.2d 735 (D.C. Cir.
                                                               1977): § 811(d) has a "limited purpose";
                                                               placement below Schedule II is unavailable
                                                               unless the Convention itself requires it)
C3  below-II(III)                                             (definitional)
C4  ¬ConventionCompels(III, m)                                (the Convention requires control ≥ its own
                                                               Schedule I strictures; it does not compel —
                                                               at most tolerates — CSA Schedule III)
C5  HYB(ORD) → ¬AUTH(ORD)                                     (Congress authorized no hybrid schedule:
                                                               quotas + import/export permits + enhanced
                                                               registration are Schedule I/II controls
                                                               grafted onto a Schedule III placement)
C6  HYB(ORD)                                                  (the order's own retained-controls text)
```

**Derivation (two independent routes to the same conclusion)**

```
Route 1 (NORML route)
1.  ORD(m,III) via § 811(d)(1) ∧ below-II(III) ∧ ¬ConventionCompels(III,m)   ∧I  fact, C3, C4
2.  ¬AUTH(ORD(m,III))                                                        →E  C2, 1
3.  vacate(ORD(m,III))                                                       →E  C1, 2

Route 2 (hybrid route)
1'. HYB(ORD)                               C6
2'. ¬AUTH(ORD)                             →E  C5, 1'
3'. vacate(ORD)                            →E  C1, 2'
∴  vacate(ORD(m,III))                      ■  valid on either route (disjunction of grounds)
```

---

## 4. Argument D (opponents, merits track): Schedule III findings cannot be made

**Premises** (hearing participants NDASA / Finn / DUID Victim Voices)

```
D1  ∀x [ S3(x) → LoA(x) ]                        (§ 812(b)(3)(A) as a necessary condition)
D2  HHS2015: HiA(m) with high-abuse finding;  HHS2023: LoA(m)
D3  ∀x [ (unexplained reversal of material finding) → ¬reliable(evidence for LoA(x)) ]
                                                  (arbitrary-and-capricious standard, State Farm;
                                                   amplified by GAO Sept. 2026: FDA lacks a
                                                   comprehensive written eight-factor policy)
D4  unexplained(HHS2015 → HHS2023 reversal)       (movants' characterization)
D5  ¬reliable(evidence for LoA(m)) → ¬provable(LoA(m)) on this record
```

**Derivation**

```
1.  ¬reliable(evidence for LoA(m))        →E  D3, D4 (with D2 establishing the reversal)
2.  ¬provable(LoA(m)) on this record      →E  D5, 1
3.  S3(m) → LoA(m)                        ∀E  D1
4.  ¬LoA(m)-on-record → ¬S3(m)-on-record  MT-form of 3 under record-relative provability
∴  placement S3(m) unsupported on this record   ■  valid as a record-sufficiency argument
```

Note D's conclusion is deliberately weaker than ¬S3(m): the hearing opponents argue *failure of proof*, not the contrary finding — which is why their procedural motions (the GAO stay) are their strongest moves.

## 5. Where the proofs actually collide

| Premise attacked | Attacked by | The counter-premise |
| --- | --- | --- |
| A1 (sufficiency reading of § 812(b)(3)) | Opponents | Findings are necessary, not sufficient; CAMU requires more (five-part *ACT v. DEA* test pre-2023) |
| A2/A4 (HHS empirics) | Opponents (D2–D4) | 2015↔2023 reversal unexplained; GAO process gaps |
| B1/B3 (§ 811(d) breadth) | Petitioners (C2) | *NORML*: treaty pathway cannot place below Schedule II absent Convention compulsion |
| C2 (NORML's continuing force) | Government | *NORML* predates *Chevron*'s rise *and* fall; the 2024 OLC opinion reads § 811(d)(1) textually: "schedule he deems most appropriate" vests the choice in the AG |
| C4 | Government | Convention compliance is satisfiable at Schedule III **with** retained controls — which simultaneously negates C4 and *generates* C6 (the hybrid), exposing the government to Route 2 exactly insofar as it escapes Route 1. This trade-off is the logical heart of the D.C. Circuit case. |
| C5 (no-hybrid premise) | Government | § 811(d)(1)'s "most appropriate to carry out such obligations" authorizes obligation-tailored controls |
| D3/D4 | Government | The reversal is explained: the 2023 CAMU test is a lawful successor methodology, concurred in by DOJ |

**Formal takeaway.** A, B, C, D are all classically valid. A ∧ B and C ∧ D are jointly unsatisfiable (B concludes `lawful(ORD)`, C concludes `vacate(ORD)` via `¬AUTH`), so at least one side holds a false premise — the courts' job is to decide which. The C4/C6 trade-off is a genuine logical pincer: strengthening the treaty-compliance story (¬C4) is what instantiates the hybrid predicate (C6). The government cannot negate both attack premises at once; it must instead break C5 (the no-hybrid-authority premise) as a matter of statutory interpretation.
