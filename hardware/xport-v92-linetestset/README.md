# Isolated Line Test Set — `xport-v92-linetestset`

A lineman's test handset on a board. Test leads on one side, an earpiece and an
electret microphone on the other, with a 600:600 Ω wet isolation transformer in
between and a switch that chooses whether you are *part of* the call or merely
listening to it.

This is the legitimate member of the phreaking "box" family — the **beige box**,
which is not a fraud device at all but a standard telecom maintenance tool that
Fluke and Greenlee sell commercially. Clipping it onto a line that is not yours
is wiretapping and is illegal; the hardware is not. See
[`docs/phreaking-boxes-vlsi-notes.md`](../../docs/phreaking-boxes-vlsi-notes.md)
for the rest of that family and why this one is different.

Generated from
[`tools/xport-v92-linetestset-model.mjs`](../../tools/xport-v92-linetestset-model.mjs)
and verified by that tool's `--check`:

```
geometry: 69 pads, 33 placed elements, 27 nets
worst mains↔SELV creepage: 3.28 mm (T1.1 ↔ T1.6), limit 3 mm
schematic: 29 instances on a 520 × 420 mm sheet
OK — XML well-formed, every reference resolves, connectivity matches the model, geometry clean.
```

## Signal chain

```
test leads
  └─ F1 100mA ─ R1/R2 100R ─┬─ RV1 275V ─┬─ C1 100nF ─┐
                            └────────────┴────────────┴─ BR1 bridge rectifier
                                                            └─ K1 hook relay
                                                                 └─ T1 wet 600:600
                                                                      └─ hybrid
                                                                          ├─ TALK 600R ──► earpiece + electret
                                                                          └─ MON  10k ──► volume ──► earpiece
```

## The three things that make it a test set and not an audio tap

**1. The bridge rectifier.** A test set gets clipped onto pairs whose polarity
nobody knows. Full-wave rectifying ahead of everything else means the rest of
the circuit always sees the same orientation. Without `BR1`, half of every job
is guessing which lead is tip.

**2. TALK versus MONITOR are opposite requirements.** TALK goes off-hook and
terminates the line in 600 Ω so you can join the conversation. MONITOR bridges
at 10 kΩ, which is high enough not to load the line or disturb a call already in
progress, so you can listen and measure without anyone knowing. `SW1` selects
between them; there is no setting that does both.

**3. It runs from the line.** The electret bias (`R7` 2.2 k) and the line-present
LED (`R8` 1 k) are fed from the rectified loop. No battery to be flat when you
are standing at a cabinet in the rain, and the LED glows on ring voltage too, so
it doubles as an EMF indicator.

## DC loop budget in TALK

This decides whether the exchange sees an off-hook at all.

| element | resistance |
| --- | --- |
| F1 fuse | ~0.2 Ω |
| R1 + R2 surge limiters | 200 Ω |
| BR1 bridge | a few Ω effective |
| K1 contact | ~0.1 Ω |
| T1 primary DC resistance | 40–150 Ω |
| **total** | **240–350 Ω** (limit 400 Ω) |

## Safety

The left of the board is line-referenced. 48 V DC sits on the pair, ring peaks
above 150 V, and a lightning or power-cross event puts far more on it.

`T1` is the **only** isolation barrier between the line and the earpiece you put
against your head. It must be the **wet** type — specified to carry 20–50 mA of
DC loop current without saturating. A dry voice transformer of the same
impedance works on the bench and fails the moment the line goes off-hook.

Isolation resistance from the line side to any touchable metal has to hold
**5 MΩ measured at 100 V DC**. Measure it after assembly, before first use.

The 3 mm creepage is enforced by `tools/wallplug-drc.mjs` via
`BOARD.zones.mains` and `creepageMm: 3.0`, and `T1`'s primary pins are marked
line-referenced individually through `PARTS[].padZones`, so the checker measures
the transformer's own pin spacing rather than trusting its silk outline. As
built, the worst pair is **T1.1 ↔ T1.6 at 3.28 mm**.

## Files

| file | what |
| --- | --- |
| `xport-v92-linetestset.lbr` | 18 packages, 18 symbols, 19 devicesets |
| `xport-v92-linetestset.sch` | 29 instances on a 520 × 420 sheet |
| `xport-v92-linetestset.brd` | 69 pads, 33 elements, 27 nets, 110 × 80 mm |
| `BOM.md` | generated bill of materials |

Rebuild with `npm run build:xport-v92-linetestset`, or check without writing:
`node tools/build-wallplug-eagle.mjs --check --design xport-v92-linetestset`.

Fourteen of the packages are shared with
[`../xport-v92-audiobridge/`](../xport-v92-audiobridge/) by direct import rather
than by copy, so the two boards cannot drift apart on a footprint. Only the
bridge rectifier, SPDT toggle, earpiece and electret are new.

## What is not done

- **No routing.** The emitter places parts and verifies clearance; it does not
  route copper. `POUR` and the barrier keep-out are declared, traces are not.
- **Not measured.** No prototype. Return loss against the 10 dB requirement,
  frequency response, sidetone null and THD are all unmeasured, and the hybrid
  balance in particular has to be trimmed against a real line.
- **No sidetone or ringer.** A production butt set has both. This has an
  earpiece, a microphone and a volume control, and nothing else.
- **`LS1` and `MIC1` values are placeholders.** A 150 Ω earpiece and a generic
  electret are assumed; the bias resistor `R7`/`R10` divider was sized for a
  typical 2 V, 0.5 mA capsule, not for a specific part.
- **Hook drive is external.** `J2` expects a control signal; the set does not
  decide for itself when to go off-hook.
