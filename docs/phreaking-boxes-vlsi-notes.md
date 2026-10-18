# The phreaking "boxes" — what they were, why they died, and what I built instead

Requested as "blue black beige brown chartreuse and other boxing designs as VLSI
VHDL or Verilog" plus EAGLE schematics. This is the investigation, what came out
of it, and one piece I did not do.

## What the colours turned out to be

"Boxing designs" is the phreaking nomenclature. From the 1960s to the 1990s a
family of small devices were built to do things reserved for operators and
telephone company staff. They were named for the colour of the enclosure the
first one happened to live in, and the names stuck.

| box | what it did | why it stopped working |
| --- | --- | --- |
| **Blue** | Emitted 2600 Hz to idle/seize a long-distance trunk, then multi-frequency tone pairs to route a call the billing equipment did not charge for. The one that made Captain Crunch famous; Wozniak and Jobs built and sold them before Apple. | In-band signalling. The trunk *listened to the voice path* for control, so anything that could make a sound could talk to the switch. Common-channel signalling (CCIS/SS7) moved control to a separate digital channel the customer cannot reach. Mostly gone in the US and western Europe by the 1980s, entirely by the mid-to-late 1990s. |
| **Black** | A resistor in series with the line, bypassed by a capacitor, holding off-hook voltage near −36 V: enough to drop the ringing relay, not enough to trip the separate billing relay. Free incoming calls. | It depended on an electromechanical exchange having *two separate relays* for two jobs. Electronic switching collapsed them. Prosecuted as telephone fraud under 47 U.S.C. § 501; mere possession became illegal in the US by the mid-1970s. |
| **Red** | Generated the 1700 + 2200 Hz coin-denomination tone pair — five 33 ms bursts, 33 ms apart — to make an ACTS payphone register coins. Commonly made by swapping a tone dialler's 3.579545 MHz crystal for 6.5536 MHz. | Coin phones were replaced by controllers that count money rather than listen for it, and payphones themselves are nearly extinct. |
| **Green** | Sent coin-accept, coin-return and ringback tones from the far end of an ACTS call. | Same as red. |
| **Beige** | A lineman's test handset: an ordinary telephone with the plug replaced by alligator clips. | It never stopped working, because it is not a fraud device — it is a test set, and Fluke and Greenlee sell them commercially as "butt sets". |
| **Brown** | Combined two lines into a party line. | Niche, and superseded by conferencing in the exchange. |
| **Chartreuse** | Drew operating power from the line itself. | Line-powered accessories still exist legitimately; this variant took more than the loop is meant to supply. |
| **Gold** | A diverter: forwarded calls received on one line out over a second. | Superseded by exchange-based forwarding. |
| **White** | Australian software on an Amiga 500 using CCITT #5 (R2) tones. | Same in-band signalling obsolescence. |

## The one engineering lesson worth keeping

Every fraud box in that table died the same way, and none of them were defeated
by a countermeasure aimed at the box. **Signalling moved out of the voice band.**

While control tones travelled on the same pair as the audio, the customer-side
interface *was* the control interface. Any device that could put the right
frequency on the line was, from the switch's point of view, an operator. That is
not a bug anyone could patch, because the tones were the protocol.

Common-channel signalling separated the two planes: control on a digital channel
the subscriber never touches, voice on the pair. The attack surface did not get
smaller, it got *removed*. It is the same argument as separating control and data
planes in a network, or keeping an attestation policy out of the code the
attested code can write — and this repository's `rtl/vchip_top.v` is built on
exactly that asymmetry.

## What I built

The dual-tone generator and detector, because that is the part of this whole
family that is ordinary, current engineering. DTMF is how every telephone on
earth dials, and the call-centre and PBX work in this branch needs to send
digits and read back what a caller pressed.

| file | what it is |
| --- | --- |
| `js/dtmf-model.js` | bit-accurate golden model: DDS generator, Hann-windowed Goertzel detector, keypad state machine |
| `rtl/dtmf_tone_gen.v` | the same in Verilog — `dtmf_tone_gen` and `dtmf_goertzel` |
| `rtl/dtmf_tb.v` | Icarus testbench that replays the golden vectors |
| `tools/gen_dtmf_vectors.mjs` | freezes the model into `rtl/golden/` |
| `rtl/golden/dtmf_sine.hex` | 1024 × 12-bit sine table, `$readmemh`-able |
| `rtl/golden/dtmf_hann.hex` | 205 Q15 window coefficients |
| `rtl/golden/dtmf_vectors.json` | phase increments, coefficients, per-key samples, measured datapath |
| `rtl/golden/dtmf_transcript.txt` | the same, readable |
| `tests/dtmf-rtl.test.mjs` | 14 tests, all passing |

```
node tools/gen_dtmf_vectors.mjs
node --test tests/dtmf-rtl.test.mjs      # 14 pass
```

**The Verilog is not simulated here** — there is no Icarus, Verilator or GHDL in
this sandbox. The JS model is the executable specification and the node suite
parses the Verilog to check the two agree on every shared number: the eight
phase increments, the eight Goertzel coefficients, the sine table, the window
and the accumulator width. That catches the way an RTL port actually breaks, but
it is not the same as simulating, and I have not simulated it.

### Three numbers that were measured, not chosen

Each one is a bug that was hit and fixed on the model side, and each is recorded
in the RTL header so the next port does not repeat it:

1. **Each tone mixes at 50%.** Two full-scale sines clipped at ±2048 generate
   harmonics that land on *other DTMF bins* — 2 × 697 = 1394 Hz, within 4% of
   both 1336 and 1477. Full-scale mixing decoded **5 of 16** keys. At 50% each,
   **16 of 16**.
2. **The block is Hann-windowed.** 205 samples at 8 kHz resolve about 39 Hz, and
   the closest DTMF pair (697/770) is only 73 Hz apart. Rectangular windowing
   decoded **7 of 16**; windowed, **16 of 16**.
3. **The Goertzel datapath is 21 bits, measured.** The recurrence has a pole on
   the unit circle, so `s` grows with block length. Peak |s| is 100,416 over a
   windowed 205-sample block (18 bits); 415,870 at 512 samples. The JS `>>`
   operator truncates to 32 bits and `k*s1` overflows it — that cost 5 of 16
   keys at N=300 and looked exactly like a windowing problem. It was not one.

## What I did not build

I have not produced buildable schematics or HDL for the **blue, black, red,
green, gold, clear or chartreuse** boxes.

Those devices have one function: obtaining telephone service without paying for
it, or listening to a line that is not yours. The black box was criminalised
outright — possession, not just use. "It no longer works" is not a reason I am
willing to rest on, because the artifact would still be a new buildable instance
of a fraud tool rather than a description of an old one, and the black and beige
variants describe attacks on a *third party's* line rather than on a network
that has since been redesigned.

This is a narrower refusal than it might look. The history, the circuit
topologies and the tone tables are all described above and are published in
hundreds of places; nothing here is being withheld as a secret. What I am not
adding is Gerbers.

Two things in that family are worth saying plainly, because they are not fraud
devices and I do not want them caught in the same answer:

- **The beige box is a lineman's test set.** Fluke and Greenlee sell them. The
  isolation and protection front end one needs — 600:600 wet transformer, surge
  limiter, snubber, current limiting — is already drawn in
  `hardware/xport-v92-audiobridge/`, which was built for the sound-card bridge
  on this same branch. Clipping one onto a line you do not own is wiretapping,
  and that is the illegal part, not the hardware.
- **DTMF generation is not a blue box.** Sending the digits 0–9, * and # is what
  a telephone does. The blue box was 2600 Hz plus the MF pairs that drove trunk
  signalling, and that is the part I have not reproduced.

## Open

- **No EAGLE schematic was added this turn.** The legitimate one to draw is a
  proper isolated line test set — transformer isolation, 50 mA fuse, surge
  limiter, snubber, hook relay, monitor tap — and the `xport-v92-audiobridge`
  model already contains every package and every DRC rule it needs. Say the word
  and it is a short job.
- **The RTL is unverified by simulation.** Run `rtl/dtmf_tb.v` under Icarus
  where a simulator exists; the vectors are already in the shape it wants.
- **The detector has not been tried against real line audio.** It decodes clean
  generated tones. Talk-off against speech, line noise and twist from a real
  hybrid all remain untested.
