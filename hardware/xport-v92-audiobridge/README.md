# POTS Audio Bridge — `xport-v92-audiobridge`

Telephone line on one side, a sound card microphone input and an agent headset on
the other. Second sheet of the xPort Pro V.92 card family; pairs with
[`../xport-v92-faxcard/`](../xport-v92-faxcard/), which does the fax and data
side of the same line.

Generated from [`tools/xport-v92-audiobridge-model.mjs`](../../tools/xport-v92-audiobridge-model.mjs)
by `tools/build-wallplug-eagle.mjs`, and verified by that tool's `--check`:
XML well-formed, every pin reference resolves, the emitted connectivity matches
the model's net table, and the geometry DRC passes.

## Signal chain

```
PSTN tip/ring
  └─ F1 50 mA ─ R1 100R ─┬─ RV1 275V ─┬─ C1 100nF ─┐   (surge + snubber)
                         └────────────┴────────────┴─ K1 hook relay
                                                        └─ T1 600:600 "wet"
                                                             ├─ centre-tapped hybrid
                                                             │    (620R x2 + RV2 470R trim)
                                                             ├─ 40 dB pad ──────────► J2 MIC IN
                                                             ├─ 15 dB pad ◄────────── J3 CARD OUT
                                                             └─ headset ────────────► J4 HEADSET
```

## Why each part is there

**The transformer has to be the "wet" type.** A wet 600:600 transformer is
specified to carry the 20–50 mA of DC loop current without saturating; a dry
voice transformer of the same impedance will work on the bench and go quiet or
distort the moment the line goes off-hook. Typical wet transformer DC resistance
is 40–150 Ω and inductance a few henries — that inductance is also what sets the
low-frequency response.

**The hybrid converts 2-wire to 4-wire.** The line is one pair; a sound card has
separate send and receive. Without the hybrid the agent hears their own voice a
beat late. This one is the resistive Wheatstone bridge of four 620 Ω arms, one
arm being the line itself in series with a DC blocking capacitor, nulled by the
470 Ω trimmer. The trimmer is not optional: a real line is not 600 Ω, and a
fixed resistor never nulls properly. Adjust for minimum sidetone with a real line
connected.

**The DC loop budget decides whether the exchange acknowledges the off-hook:**

| element | resistance |
| --- | --- |
| R1 surge limiter, tip | 100 Ω |
| R2 surge limiter, ring | 100 Ω |
| K1 relay contact | ~0.1 Ω |
| T1 primary DC resistance | 40–150 Ω |
| **total** | **240–350 Ω** (limit: 400 Ω) |

**The pads are sized from the actual levels**, not copied from a diagram:

- POTS nominal is −9 dBm, 275 mV rms into 600 Ω, 300–3400 Hz.
- A sound card line output is about 1 V rms; its microphone input is about 10 mV
  and supplies a ~5 V bias.
- Line → mic: R8 10 k series + R9 100 Ω shunt = **40 dB**, the conventional pad
  for this interface. R10 2.2 k keeps the card's bias current out of the
  transformer.
- Card → line: R13 470 Ω + R14 100 Ω = **15 dB**, deliberately heavier than the
  ~11 dB the levels need. Better to run the line slightly quiet than to
  overdrive the far end.

## Safety

The left of the board is line-referenced. 48 V DC sits on the pair, ring peaks
above 150 V, and a lightning or power-cross event puts far more on it.

T1 is the **only** isolation barrier between that and the PC. If you replace it
with anything not rated for the line, the sound card and the PC chassis become
part of the telephone circuit.

Isolation resistance from the line side to any touchable metal has to hold
**5 MΩ measured at 100 V DC**. Measure it after assembly.

The 3 mm creepage between the line side and the SELV side is enforced by
`tools/wallplug-drc.mjs` — `BOARD.zones.mains` and `creepageMm: 3.0` — and
T1's primary pins are individually marked line-referenced through
`PARTS[].padZones`, so the checker measures the transformer's own pin spacing
rather than trusting its silk outline. As built, the worst pair is
**T1.1 ↔ T1.6 at 3.28 mm**.

## Regulatory — read before connecting to a public network

**This is not a certified Direct Access Arrangement and is not approved for
connection to a public network.** Connecting terminal equipment to the PSTN is
regulated — FCC Part 68 in the United States, equivalent national approvals
elsewhere — and compliance is what a DAA is for: an approved module providing
the hook switch, the isolation and the impedance. Xecom, Cermetek and Siemens
all make them.

Two ways to stay legal:

1. **Put an approved DAA in front of this board.** Connect the hybrid behind the
   DAA rather than to the line directly.
2. **Keep this board on the private side of the network** — behind a PBX, or on
   a bench line — where no approval applies.

A third option worth considering: the V.92 module in the companion card already
has an approved DAA with 3 kV isolation, so take audio from *its* pins instead
of from the line. Whether the specific module exposes mic/speaker pins is not
something this repository has verified — check the datasheet before committing
to that route.

## Files

| file | what |
| --- | --- |
| `xport-v92-audiobridge.lbr` | 14 packages, 14 symbols, 15 devicesets |
| `xport-v92-audiobridge.sch` | 39 instances on a 520 × 420 sheet |
| `xport-v92-audiobridge.brd` | 88 pads, 43 elements, 29 nets, 120 × 90 mm |
| `BOM.md` | generated bill of materials |

Rebuild with `npm run build:xport-v92-audiobridge`, or check without writing
using `node tools/build-wallplug-eagle.mjs --check --design xport-v92-audiobridge`.

## What is not done

- **No layout routing.** The emitter places parts and verifies clearance; it
  does not route copper. `POUR` and the barrier are declared, traces are not.
- **Not measured.** No prototype, no return-loss measurement against the 10 dB
  requirement, no THD or frequency-response numbers. The hybrid balance in
  particular has to be trimmed against a real line.
- **Component values are computed, not validated.** The pad ratios follow from
  the published POTS and sound-card levels, but no scope trace confirms them.
- **The headset path is passive.** It will drive a headset from the hybrid; it
  will not drive a speaker. An agent needing hands-free volume wants an
  amplifier stage that is not on this board.
