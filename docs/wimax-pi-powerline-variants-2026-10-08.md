# WiMAX, Raspberry Pi, wall socket and Ethernet-over-powerline — four boards, one pipeline

**Date:** 2026-10-08 · **Branch:** `arena/1ffc7117-html5` · **Companion to:**
`docs/lantronix-uclinux-deep-dive-2026-10-08.md`

The first Lantronix deep dive ended with one generated, rule-checked EAGLE design:
a mains-powered wallplug carrying an xPort Pro (RS-232 ↔ RJ45). This round turns
that single design into a **family** and adds the four things that were asked for:

| design | directory | what it is |
| --- | --- | --- |
| `lantronix-wallplug` | `hardware/lantronix-wallplug/` | the original xPort Pro wallplug (unchanged: 41 nets, 46 parts, 147 pads) |
| `wimax-cpe` | `hardware/wimax-cpe/` | mains-powered PCI Express Mini Card carrier for an 802.16e WiMAX modem, USB to the host |
| `pi-wall-socket` | `hardware/pi-wall-socket/` | Raspberry Pi Zero 2 W carrier for a wall-socket enclosure, with wired Ethernet **and** powerline |
| `plc-bridge` | `hardware/plc-bridge/` | standalone HomePlug Green PHY ↔ 10/100 Ethernet bridge |

Plus a sourced **replacement-parts** dataset (`tools/replacement-parts.mjs`, 27
roles, 83 options) that answers "what do I fit when this is unavailable", and a
**conversion table** that answers "convert for xPort Pro" literally: six Lantronix
part numbers on one PCB, and five board-level conversions (DTE↔DCE, RS-232↔RS-485,
modem control, mains↔DC-line coupling, WiMAX↔LTE).

Everything is generated and verified. Nothing here is a picture of a schematic; the
`.lbr`/`.sch`/`.brd` files open in EAGLE, and the checks that produce them are the
same checks the first design used.

---

## 1. The pipeline, and why it had to change

The first design was three files: a model, a generator, a DRC. To add three boards
without copying 2500 lines, the generator and the DRC became **design-agnostic**:

```
tools/import-kicad-footprints.mjs   GitHub → 31 real footprints → tools/eda-packages.mjs (generated)
tools/eda-core.mjs                  geometry helpers, symbol builders, pick(), grid()/rows(), budgetCheck()
tools/eda-blocks.mjs                the shared library: symbols, devicesets, mainsBlock(), buckBlock(), ldoBlock()
tools/wallplug-model.mjs            design 1 (xPort Pro)          ─┐
tools/wimax-cpe-model.mjs           design 2 (WiMAX Mini Card)     │  same export shape
tools/pi-socket-model.mjs           design 3 (Pi Zero 2 W carrier) │  → import * as D
tools/plc-bridge-model.mjs          design 4 (Green PHY bridge)   ─┘
tools/build-wallplug-eagle.mjs      --design=<name>: emits .lbr/.sch/.brd/BOM.md and verifies them
tools/wallplug-drc.mjs              checkGeometry(D), checkSchematicLayout(D) — pure, runs in node and in the browser
tools/replacement-parts.mjs         substitutes, conversions, documented-not-built
```

`node tools/build-wallplug-eagle.mjs --design=plc-bridge --check` builds, parses
the XML, resolves every reference (part → deviceset → gate → symbol pin → package
pad, element → package, contactref → element+pad), compares the resulting
connectivity against the model's netlist pin for pin, runs the geometry DRC
(courtyard overlap, board containment, pad-to-pad spacing, mains↔SELV creepage,
mounting-hole clearance) and the sheet-layout check (no two instance boxes
overlap, nothing runs off the sheet).

Two things this refactor caught that a human reviewer would probably have missed:

* **The DRC was silently checking the wrong design.** `checkGeometry()` defaulted
  to the xPort model, and inside it `collectPads()` was called with no argument —
  so the first `--check` of the powerline board reported "147 pads, worst creepage
  10.04 mm (MOV1.2 ↔ PS1.4)", which are the *xPort* board's numbers. The build
  said OK. `tests/23-variants.mjs` now asserts the pad count is over 100 for the
  design actually selected, which is what makes that class of bug visible.
* **Rotation flips which pins are live.** The MEAN WELL IRM-05-5 has its AC pins at
  local −x; rotating it 180° to "point the AC pins at the mains side" actually
  pointed them at the SELV side, and the creepage check dropped from comfortable to
  11.40 mm against an 8 mm limit. The part now sits at R0. The MPM-20-12 is the
  opposite (AC pins at local +x), so *it* is the one that gets R180.

Two new generator capabilities were needed for these boards: a `connect` may name
several pads (EAGLE writes `pad="11 18 19 …"`), which is how the PLC module's eight
assembly-only GND pads and the SMA jack's four shell legs attach to one symbol pin;
and `BOARD_LINES` lets a design draw silkscreen that is not a package — card
outlines, RF keep-outs, the dashed continuation of a barrier through a module that
*is* the isolation.

## 2. Where the geometry came from

Every pad coordinate in the three new designs was read from a published footprint
by `tools/import-kicad-footprints.mjs`, which records repository, path, byte count
and fetch date in `tools/eda-packages.mjs`. 31 packages, no hand-measured
guesswork. Two normalisations the importer does, because KiCad and EAGLE disagree:

* **y is negated.** KiCad y grows downward, EAGLE y grows upward.
* **pad names are made unique.** KiCad allows several pads to share a name (every
  shell leg of an SMA jack, every thermal via under a QFN exposed pad); EAGLE does
  not. Repeats become `2_2`, `2_3`, … and the deviceset's connect lists all of
  them.

| package | source | what it fixed |
| --- | --- | --- |
| `PLCSTAMP` | PIONIX EVerest library | 24 SMD pads at 1.27 mm, rows 20.47 mm apart, **pad 14 absent** exactly as the chargebyte datasheet §11 note 4 says |
| `MPCIE` | `drbild/kicad-mini-pci-e` | 52 pads at 0.8 mm in two rows staggered 0.4 mm, two Ø2.6 holes 24.2 mm apart |
| `PIZERO` | `tylercrumpton/CrumpPrints.pretty` | 40 header pads plus four Ø2.75 holes at **58 × 23 mm** centres in a 65 × 30 mm outline — the Pi's real mechanical interface, so the carrier needs no separate hole parts |
| `IRM055` | `sebdehne/DehneEVSE-Hardware` | four pads named AC/L, AC/N, VNEG, VPOS (renumbered 1-4 here), 45.7 × 25.4 mm body |
| `MPM2012`, `AHES4291`, `CUI_TB003`, `WAGO2604`, `T60404`, `PLCREDBEET`, `UMTSANT` | PIONIX EVerest library | pin roles from the same project's symbols |
| `WIZ850IO` | `es-ude/kicad-library` | two 1×6 headers **20.32 mm apart**; pinout from the WIZnet datasheet |
| `ESP32WROOM`, `LM2576S`, `AMS1117`, `LQFP48-7`, `QFN68-8`, `HR911105A`, `G5LE1`, `UFL`, `SMAV`, `XTAL3225`, `USBMB`, `MICROSIM`, `TO92`, `TERM3`, `R0603`, `C0603`, `LRAD12` | KiCad official library | |

## 3. WiMAX: what the research actually said

* **Intel Centrino Advanced-N + WiMAX 6250** (622ANXHMW / 622ANHMW): IEEE
  802.16e-2005 Wave 2, Mobile WiMAX Release 1 Wave 2 system profile, 2.3 / 2.5 /
  3.5 GHz, 20 Mbps down / 6 Mbps up over WiMAX and 300 Mbps over Wi-Fi, **PCIe Half
  Mini Card 26.65 × 29.85 × 4.39 mm, 4.5 g**, two LED outputs (one Wi-Fi, one
  WiMAX, behaviour per the Mini Card specification), radio on/off control in
  hardware and software, 0…+80 °C, FCC ID PD9622ANXH.
* Intel's WiFi Adapter Information Guide gives the interface facts the board is
  built on: **52-pin Mini Card edge connector, voltage 3.3 V, antenna interface
  Hirose U.FL-R-SMT mating with U.FL-LP-066 cable connectors**, on-board
  diversity, Mini Card 50.80 × 30 × 4.5 mm and Half-Mini Card 26.64 × 30 × 4.5 mm.
* The **PCI Express Mini Card Electromechanical Specification rev 1.2** supplies
  the pin table and the current rating — **0.50 A per power contact, continuous** —
  and says W_DISABLE# "requires a pull-up resistor on the card" and is mandatory
  for systems and cards implementing RF. hardwarebook.info and ARM's DSTREAM
  documentation reproduce the same table; all three agree.
* A real host's budget: the PEAK Systems PCIe-miniPCIe adapter manual rates its
  card supply at **3.3 V max 1100 mA** and 1.5 V max 375 mA. That is the number the
  3.3 V rail is sized against, and it is why the board runs a 12 V → 3 A buck
  instead of a 3.3 V AC/DC module: five 3.3 Vaux contacts at 0.5 A each is 2.5 A in
  theory, but a card's TX burst is what matters.

Two findings shaped the design more than any part number:

1. **The card's WiMAX side is USB and its Wi-Fi side is PCIe.** A wallplug has no
   root complex, so `REFCLK±`, `PERn0/PERp0`, `PETp0` and `CLKREQ#` are open, and
   only the 802.16e radio can work. That is a property of the card, recorded in
   `UNCONNECTED` with the reason, not a layout omission.
2. **The antennas are not board parts.** The card carries its own U.FL jacks, so
   the carrier's job is to keep the card's antenna end clear of copper and metal
   (the silkscreen draws that keep-out) and the enclosure's job is two U.FL-LP-066 →
   SMA bulkhead pigtails. The `UFL`, `SMAV` and `UMTSANT` footprints are imported
   and available for a board that does feed RF, and `tools/replacement-parts.mjs`
   lists them; none is fitted here, because there is nothing on this board to
   connect them to.

And the one that decides whether to build it at all: **commercial 802.16e networks
are gone** (Sprint/Clear shut down in 2015-2016). The replacement-parts table says
so in its own vocabulary, as a `not-a-substitute` row: a 6250 in 2026 has nothing to
join, so the realistic use of this carrier is an LTE mini-PCIe module — which is
why the SIM holder and the +1.5 V rail are on the board as DNP options rather than
left out.

## 4. Raspberry Pi: Zero 2 W or Compute Module 4

The Zero 2 W is RP3A0 (BCM2710A1), quad Cortex-A53 at 1 GHz, 512 MB LPDDR2,
2.4 GHz 802.11b/g/n, BT 4.2 + BLE, **no Ethernet**, 40-pin GPIO unpopulated,
mini-HDMI, micro-USB OTG plus micro-USB power, microSD, **65 × 30 × 5 mm**, four
M2.5 mounting holes, about 3 W maximum. The 40-pin map used here (pins 1/17 3.3 V,
2/4 5 V, SPI0 on 19/21/23/24/26, SPI1 on 35/36/38/40, UART0 on 8/10, ID_SD/ID_SC
on 27/28) was cross-checked against the `PI40HAT` and `OX40HAT` symbols in the
PIONIX EVerest library, which list the same 40 names plus the CM4-side RUN and
GLOBAL_EN.

The CM4 is the industrial alternative and the comparison is not close on paper:
its pinout (from the same published symbol) puts `Ethernet_Pair0..3 P/N` on pins
3-12, six +5 V inputs on 77/79/81/83/85/87, 3.3 V and 1.8 V outputs, PCIe, USB,
HDMI and camera — a PHY on the module means a magjack and no SPI Ethernet at all.
It costs two 100-way 0.4 mm mezzanine connectors and a much harder layout. The
PIONIX EVerest **Yak** is exactly such a carrier, and it is the reason this repo
knows as much as it does about Green PHY on a Pi.

Two design decisions worth stating because they are the kind that get copied:

* **The Pi's own 3.3 V output is left open.** Header pins 1/17 supply roughly
  50 mA from the Pi's onboard regulator; this board has a 3 A rail for the modem
  and the W5500. Paralleling two regulators is a mistake, so both pins are in
  `UNCONNECTED` and `tests/23` asserts they are.
* **Two bucks, not one LDO.** The modem alone can take 300 mA (chargebyte §8.2
  gives 150 mA average / 300 mA max) and the WIZ850io 141 mA; an AMS1117 from 5 V
  at that current is 0.85 W in a SOT-223. LM2576S-5.0 for the Pi and LM2576S-3.3
  for the logic, both from a 12 V MPM-20-12.

## 5. Wall socket: the creepage argument that removed a relay

"Wall socket" is the enclosure, not a component: the board takes L/N/PE from the
socket's terminals through a 5.00 mm CUI TB003-500-P03BE and PE goes no further
than a test point. 180 × 120 mm is a wall-mounted enclosure beside the socket, not
a socket box (a UK single-gang box is 86 × 86 mm) — the README says so rather than
pretending otherwise.

The relay-switched outlet is the interesting failure. The Panasonic **AHES4291**
from the PIONIX library has published pin roles, and its footprint puts contact pad
3 at (11.45, −16.75) and coil pad 4 at (3.8, −16.75): **7.65 mm centre-to-centre,
≈4.8 mm between pad edges**. This board keeps 8 mm creepage because the powerline
module's datasheet demands it, so the relay does not fit the rule. The Omron
**G5LE-1** footprint has its two pad rows 12.2–15.4 mm apart and clears it — but
KiCad's symbol for it leaves the pin names empty (coil and contacts are separate
units), so which row is the coil has to come from the Omron datasheet. Both
footprints are imported, both are in `tools/replacement-parts.mjs`, and
`tests/23-variants.mjs` measures the 7.65 mm and 4.8 mm figures so the reason
cannot quietly rot.

A related find, in the same library: WAGO publishes
`2606-1105_increased_creepage.kicad_mod` — a terminal block whose whole purpose is
more creepage. When a mains terminal is the tightest part of a design, that is the
part to reach for.

## 6. Ethernet over powerlines: three standards and one datasheet

| standard | band | peak PHY | interop |
| --- | --- | --- | --- |
| HomePlug AV (IEEE 1901) | 1.8–30 MHz OFDM | 200 Mbps | with AV2 and Green PHY |
| HomePlug AV2 (2012) | 1.8–86 MHz, MIMO on L/N/G, up to 4096-QAM | 600/1000/1500 Mbps classes | with AV and Green PHY |
| HomePlug Green PHY | subset of AV | 10 Mbps | with AV/AV2 |
| ITU-T G.9960/G.9961 (G.hn) | 1.8–100 MHz, 24.41 kHz carrier spacing on powerline, AES-128 | 1–2 Gbps | **not** with HomePlug — turbo coding vs LDPC |

Mixing a G.hn adapter and a HomePlug adapter on the same phase degrades both; IEEE
1901's Inter-System Protocol covers HomePlug/HD-PLC coexistence and retail gear
rarely implements it. For a line-driver-level AV2 design the published parts are
Microsemi/Microchip's **Le87401** (single channel) and **Le87402** (two channel)
Class GH drivers — 16-pin 4 × 4 mm, to 86 MHz — used with Broadcom BCM60500/BCM60333
reference designs, i.e. gateway-class silicon that is not a hobbyist path.

The buildable path is a module, and the module with a real public datasheet is
chargebyte's **PLC Stamp mini 2** (formerly I2SE). The numbers that shaped two
boards:

* QCA7005 default (QCA7000 on request — "the connections and dimensions are exactly
  the same for both chips"; the difference is the QFN package and optical
  inspectability for automotive).
* 3.3 V, 0.5 W, **VDD 3.13–3.46 V operating / 3.46 V absolute max, VDIO 3.63 V
  absolute max, IDD 150 mA average / 300 mA max**, 10 Mbit/s, 300 m reach,
  −40…85 °C industrial, **43.5 × 22 × 6.5 mm**, 5.6 g, MSL 3, at most two reflows.
* Mains: **VAC 85–250 V, VDC to 380 V** (the sum of all AC and DC parts of the
  line), 48.5–51.5 / 57.9–62.1 Hz tolerance.
* **§8.3 Safety: 8 mm creepage / 6.5 mm clearance between L/N and all other
  connections, 4000 Vac isolation test.** Both boards that carry the module set
  `BOARD.creepageMm = 8.0` for this reason, and the checker then verifies the
  module's own footprint against that claim: the worst mains↔SELV pair on either
  board is **U_.15 ↔ U_.13 = 13.12 mm**, i.e. the vendor's pad layout honours its
  own datasheet.
* Pinout (§10): 1-4 GPIO_0..3, 5 RESET_L, 6-10 SERIAL_4..0, 11 GND, 12 VDD,
  13 NC/ZC_IN, **14 not available**, 15 N, 16 L, 17 L, 18-25 GND ("not needed for
  electrical function, only for SMD assembly").
* SERIAL roles (§10.2 table 6): 0 = INT, 1 = CLK, 2 = CS, 3 = MISO, 4 = MOSI; or in
  UART order 1 = RTS, 2 = CTS, 3 = TXD, 4 = RXD at 115200 8N1.
* SPI is Motorola **mode 3** (CPOL=1, CPHA=1), burst (CS low for the whole
  message), clock period ≥ 83.3 ns → **12 MHz maximum**.
* Boot straps (table 4): GPIO_0 boot source, GPIO_1 host interface (the module
  preloads a 10 kΩ pull-down = SPI slave), GPIO_2 burst/legacy, GPIO_3 none. After
  boot (table 5): GPIO_0 = PLC-link output, GPIO_1 = Simple Connect blink output at
  1 Hz, GPIO_2 unused, GPIO_3 = pushbutton input (0.5–3 s Simple Connect, 5–8 s
  randomise NMK, 10–15 s factory defaults). LED bootstrap is 3.3 kΩ series
  (figure 3); switch bootstrap is 100 Ω series + 10 kΩ pull-up + 100 pF across the
  switch (figure 4). All of it is on both boards with those exact values.
* Order codes (§15): `I2PLCBMN-ISC-004-T` = QCA7005, industrial, SPI, CE Class B,
  transformer **I2PLCTR-1 (1:4:5)** and zero-cross **on the module**, tray of 20
  (`-R` = tape and reel, 240). The automotive `…-ISE-…`/`…-ISP-…` variants use
  transformer I2PLCTR-2 (1:1:1) **external** and have no zero-cross detector.
* **§12.2, verbatim: "Automotive variants of PLC Stamp mini 2 are not designed to
  work on mains."**

That last line is why the PIONIX EVerest Yak matters as a *cautionary* reference.
It is a real, published Raspberry Pi CM4 carrier with a Green PHY modem, and its
netlist shows the coupling plainly: `/PLC Modem/CP` → C28 (2.7 nF 2 kV, 1210) →
`Net-(C28-Pad2)` → C29 (2.7 nF 2 kV) → `Net-(C29-Pad2)` → D9 (GBLC03C TVS, other
end grounded) → T1 pin 1 (YT-35636 transformer), with T1 pins 5/8 to RXP/RXN and
6/7 to TXP/TXN, T1 pin 4 (the primary centre tap) grounded, and the module's own
pins 16/17 tied to GND. That is a **control-pilot** coupling for ISO 15118, using
the automotive variant, and its host wiring (`PLC_SCK`/`PLC_MISO`/`PLC_MOSI`/
`PLC_CS`/`PLC_INT` on CM4 pins 38/40/44/39/47) is the SPI pattern both boards here
reproduce. The coupling is not: mains coupling on the CE Class B variant is inside
the module, so the board only brings L and N to pins 16/17 and 15.

The chip-level alternative is documented rather than built, with its evidence:
`github.com/Millisman/QCA7000` publishes a QCA7000 board whose BOM shows what a
bare-chip design needs — QFN-68-1EP 8 × 8 mm at 0.4 mm pitch with a 5.2 × 5.2 mm
exposed pad, a 25 MHz crystal in a 3.2 × 2.5 mm body, a 25Q16 SPI flash in SOP-8,
1.8 µH and 270 nH inductors, 1.5 nF and 6.8 pF capacitors, 22 Ω series and 120 Ω
termination, B5819W Schottkys, a 3V9 SMA zener, BAV99 pairs — and whose README
says "TODO Not tested". The QFN-68 footprint is imported here so the option is one
model file away, but the module route buys a 4000 Vac isolation specification
instead of an untested AFE.

## 7. Replacement parts: how to read the table

`tools/replacement-parts.mjs` is data, and `tests/24-substitutes.mjs` holds it to
rules rather than to formatting:

* every option names a **maker**, a **package**, a **verdict**, a **reason** and a
  **source**;
* a `drop-in` must either name the same package as the fitted part or explain in
  its own reason why the package does not matter;
* `confidence` is one of `datasheet`, `vendor-page`, `open-hardware`,
  `third-party`, `unverified`, `this-repo` — and an `unverified` row must carry a
  `verify` note saying what to check before fitting it. 22 of 83 rows are
  `unverified`, and each says so;
* verdicts are `drop-in`, `re-rated`, `redesign`, `alternative`,
  `not-a-substitute`. The last category exists because plausible-looking swaps are
  how boards fail: a 5 V ADM3202 on a 3.3 V rail, a transformerless capacitive
  dropper, an automotive PLC variant on mains, an ENC28J60 where a W5500 was
  intended, a small-signal SSR where a socket outlet was intended, and a WiMAX
  network that no longer exists.

Highlights with the strongest sourcing: TI's own product pages call the
**MAX3232E** an improved direct drop-in for the MAX3232 and recommend the
**TRS3232E** for new designs; DigiKey lists **LD05-23B05R2** as a part-number alias
of the MEAN WELL **IRM-05-5**, so it is the same footprint and ratings; the
Lantronix Integration Guide's own appendix-A RS-485 circuit uses the **AD3485**;
the **ISL83485** pin names come from a symbol in a manufactured product's library.

## 8. Verification

`tests/23-variants.mjs` (230 assertions) and `tests/24-substitutes.mjs` (108) run
beside the existing suites:

```
node tools/build-wallplug-eagle.mjs --check                      # design 1
node tools/build-wallplug-eagle.mjs --design=plc-bridge --check   # and the other three
node tests/23-variants.mjs && node tests/24-substitutes.mjs
bash tests/run.sh
```

| design | pads | elements | nets | creepage limit | worst pair | sheet |
| --- | --- | --- | --- | --- | --- | --- |
| lantronix-wallplug | 147 | 46 | 41 | 6.4 mm | MOV1.2 ↔ PS1.4 = 10.04 mm | 480 × 300 |
| wimax-cpe | 160 | 44 | 25 | 6.4 mm | TP3.1 ↔ TP8.1 = 16.03 mm | 480 × 460 |
| pi-wall-socket | 175 | 45 | 35 | 8.0 mm | U3.15 ↔ U3.13 = 13.12 mm | 520 × 500 |
| plc-bridge | 171 | 45 | 33 | 8.0 mm | U2.15 ↔ U2.13 = 13.12 mm | 480 × 460 |

Beyond the shared checks, the suite pins the ground truth of the imported
footprints (pad counts, pitches, hole patterns, outlines: PLCSTAMP 24 pads with no
pad 14 and two deliberate 10.16 mm gaps; MPCIE 52 pads, 0.8 mm groups, 24.2 mm hole
spacing; PIZERO 58 × 23 mm holes in a 65 × 30 mm courtyard; IRM055 46.2 × 25.9 mm;
WIZ850IO 20.32 mm header rows; ESP32WROOM 39 pads), the per-design wiring claims
(five 3.3 Vaux contacts on the Mini Card rail, USB D+/D− reaching the receptacle,
PCIe pairs open with reasons, the Pi fed on header pins 2/4 with all eight grounds
tied and its own 3.3 V output left open, SPI0 to the WIZ850io and SPI1 to the
modem), and every power budget against datasheet maxima.

## 9. Not done

* **No routing on any board.** Placement, zones, creepage and connectivity are
  designed and checked; copper is not.
* **No certification, no EMC work, no thermal simulation.** The LM2576 tab and the
  AC/DC modules need copper area that only a routed board can provide.
* **No firmware.** The bridge and the Pi carrier name their software precedents
  (`qca/open-plc-utils`, `uhi22/wt32eth01-ethernet-to-qca7000-bridge`, the W5500
  and QCA7000 SPI protocols) but ship no code.
* **No chip-level designs**: bare QCA7000, bare W5500 + magjack, and the CM4
  mezzanine are all documented with imported footprints and left unbuilt, with the
  reason recorded in `DOCUMENTED_NOT_BUILT`.
* **The magjack pin roles were not extracted.** The Hanrun HR911105A datasheet was
  fetched and gave the electrical specs (1500 Vrms isolation, 350 µH minimum OCL at
  100 kHz with 8 mA DC, insertion/return loss, "connect CHS GND to PCB ground") but
  its pin-assignment drawing is an image, so the WIZ850io module is what the boards
  use and the magjack stays a documented option.
* **Nothing was measured.** Every current and voltage here is a datasheet figure;
  no board was built, powered or probed.

## 10. Sources

Vendor documents: chargebyte **PLC Stamp mini 2 datasheet rev 13** (2023-10-13,
`chargebyte.com/assets/downloads/datasheet_plcstampmini2_rev13-2.pdf`, §3, §6,
§8.1-8.3, §10, §10.1-10.2, §12-15, figures 3, 4, 5, 6); **Intel Centrino
Advanced-N + WiMAX 6250 product brief**; **Intel WiFi Adapter Information Guide**;
**PCI Express Mini Card Electromechanical Specification rev 1.2**;
**PEAK Systems PCIe-miniPCIe adapter user manual**; **Hanrun HR911105A datasheet**;
**WIZnet WIZ850io datasheet v1.0** and `docs.wiznet.io/Product/ioModule/WIZ850io`,
`…/W5500-io`; **MEAN WELL IRM-05-5** (DigiKey 1866-3027-ND, Mouser);
**Hi-Link HLK-5M05** (JLCPCB C209907); Raspberry Pi Zero 2 W specifications
(`raspberry.tips`, `pinouthub.com/raspberry-pi-zero-2w`, `electronics-lab.com`);
TI **MAX3232 / TRS3232 / TRS3232E** product pages; Microsemi/Microchip **Le87401 /
Le87402** HomePlug AV2 Class GH line-driver release; HomePlug and G.hn background
(`en.wikipedia.org/wiki/HomePlug`, electronicdesign.com "What's the Difference
Between HomePlug and G.hn?"), plus the Ethernet-over-power reference guide at
`industrialmonitordirect.com`.

Open hardware read through the GitHub API: `PionixPublic/reference-hardware`
(EVerest **Yak** CM4 carrier: `powerline.kicad_sch`, `everestCM4.xml` netlist,
`lib/ev-devboard.kicad_sym` + `.pretty`, `CM4IO.kicad_sym` + `.pretty`,
`lib/Pionix.kicad_sym`); `Millisman/QCA7000` (BOM + QFN-68 board);
`qca/open-plc-utils`; `uhi22/wt32eth01-ethernet-to-qca7000-bridge`;
`devolo/dlan-greenphy-sdk`; `drbild/kicad-mini-pci-e`;
`tylercrumpton/CrumpPrints.pretty`; `es-ude/kicad-library`;
`sebdehne/DehneEVSE-Hardware`; `KiCad/kicad-footprints` and the
`deepin-community/kicad-symbols` mirror of KiCad's official symbol library.

Everything this repo generated is under `hardware/`, `tools/` and `tests/`; the
commands that reproduce it are in §8.
