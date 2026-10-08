# Powerline Bridge — HomePlug Green PHY ↔ 10/100 Ethernet

Generated CAD. Do not edit these files: they are emitted by
`tools/build-wallplug-eagle.mjs --design=plc-bridge` from
`tools/plc-bridge-model.mjs`, and `--check` re-derives them and compares.

| file | what it is |
| --- | --- |
| `plc-bridge.lbr` | 22 packages, 18 symbols, 21 devicesets |
| `plc-bridge.sch` | 1 sheet, 41 instances, 33 nets |
| `plc-bridge.brd` | 160 × 100 mm, 2 layers, 45 elements, 171 pads — **unrouted on purpose** |
| `BOM.md` | every reference, its package, fit/DNP, zone and note |

## What it does

A wallplug that puts Ethernet frames on the building's power wiring and hands them
to a wired 10/100 port:

```
L ── F1 ──┬──────────── PS1 (IRM-05-5, isolated 5 V) ── FB1 ── U1 (LM2576S-3.3) ── 3V3
          │                                                        │
N ────────┼────────────────────────────────────────────────────────┤
          └── U2 pins 16/17 (L) and 15 (N)      U2 = PLC Stamp mini 2 (QCA7005)
                                                  │ SPI slave, mode 3, ≤ 12 MHz
                                                  U3 = ESP32-WROOM-32E, SPI master
                                                  │ VSPI
                                                  U4 = WIZnet WIZ850io → RJ45
```

Green PHY is 10 Mbit/s. It is the ISO 15118 / EV-charging profile and the
smart-grid profile of HomePlug, and it coexists with HomePlug AV/AV2 on the same
wiring. It does **not** interoperate with ITU-T G.hn (turbo coding vs LDPC), so a
G.hn adapter on the same phase degrades both.

## Design rules

| rule | value | where it comes from |
| --- | --- | --- |
| mains ↔ SELV creepage | **8.0 mm** | PLC Stamp mini 2 datasheet rev 13 §8.3: "Isolation between L/N terminals and all other connections: 8 mm creepage / 6.5 mm clearance" |
| mains ↔ SELV clearance | 6.5 mm | same |
| isolation test voltage | 4000 Vac | same (the module provides it; the board must not undo it) |
| minimum pad-to-pad | 0.35 mm | `--check` geometry rule |
| mounting hole ↔ copper | 3.2 mm | `--check` |
| board | 160 × 100 mm, 2 layers, 1.6 mm FR-4 | |

`--check` reports the worst mains↔SELV pair. On this board it is **U2.15 ↔ U2.13 =
13.12 mm** — the modem's own N pad against its own ZC_IN pad, i.e. the vendor's
footprint honouring its own §8.3 claim. `tests/23-variants.mjs` asserts that.

## Power budget (datasheet maxima, not typicals)

| rail | source | loads | margin |
| --- | --- | --- | --- |
| 5 V | IRM-05-5, 5 W / 1 A | U1 buck input ≈ 600 mA | 40 % |
| 3.3 V | LM2576S-3.3, 3 A | U2 300 mA (§8.2 IDD max) + U3 200 mA (radio **off**) + U4 180 mA + LEDs 20 mA = 700 mA | 77 % |

The ESP32's Wi-Fi radio is not needed on a board that has an Ethernet port; if you
enable it anyway, add ≈300 mA of TX burst to the 3.3 V rail and re-check.

## The modem, and the variant trap

Fit **I2PLCBMN-ISC-004-T** (or `-R` for tape and reel): QCA7005, industrial
−40…85 °C, SPI, **CE Class B**, PLC transformer I2PLCTR-1 (1:4:5) and zero-cross
detection **on the module**, pin 13 left floating (§12.1).

The automotive variants (`…-ISE-…` EVSE, `…-ISP-…` PEV) have a 1:1:1 transformer,
no zero-cross detector, and the datasheet says it in terms that cannot be
misread: *"Automotive variants of PLC Stamp mini 2 are not designed to work on
mains."* They tie pins 16/17 to GND and couple through pin 15 only.

That is exactly what the published PIONIX EVerest "Yak" carrier does — it fits the
automotive variant and couples to an EV control pilot through two 2.7 nF / 2 kV
1210 capacitors in series, a GBLC03C TVS and a YT-35636 transformer
(`Yak/everestCM4.xml`, nets `/PLC Modem/CP`, `Net-(C28-Pad2)`, `Net-(C29-Pad2)`).
It is a real Green PHY design and it is **not** a mains coupling. Do not copy it
onto this board.

## Host wiring

| ESP32-WROOM-32E | PLC Stamp mini 2 | note |
| --- | --- | --- |
| IO14 | SERIAL_1 (CLK) | HSPI clock |
| IO12 | SERIAL_3 (MISO) | |
| IO13 | SERIAL_4 (MOSI) | |
| IO15 | SERIAL_2 (CS) | 10 kΩ pull-down R10: IO15 is a strapping pin (MTDO) |
| IO4 | SERIAL_0 (INT) | |
| IO32 | RESET_L | also TP5 |
| IO18/19/23/5 | — | VSPI to the WIZ850io (SCLK/MISO/MOSI/CS) |
| IO33 / IO26 | — | WIZ850io !INT / !RST (R9 10 kΩ pull-up) |
| TXD0 / RXD0 | — | J2 programming header |

SPI is Motorola **mode 3** (CPOL=1, CPHA=1), CS held low for the whole message
(burst), clock period ≥ 83.3 ns → **12 MHz maximum** (datasheet §10.2.2). Software
precedent: `github.com/qca/open-plc-utils` (plctool, slac) and
`github.com/uhi22/wt32eth01-ethernet-to-qca7000-bridge`.

## Bootstrap parts (datasheet figures 3 and 4)

| ref | value | why |
| --- | --- | --- |
| R5, R6 | 3.3 kΩ | GPIO_0 / GPIO_1 LED bootstrap; after boot GPIO_0 = PLC link, GPIO_1 = Simple Connect blink at 1 Hz |
| R4 | 10 kΩ | GPIO_3 pull-up |
| R3 | 100 Ω | GPIO_3 series |
| C5 | 100 pF | across SW3, debounce |
| SW3 | tact | 0.5–3 s Simple Connect, 5–8 s randomise NMK, 10–15 s factory defaults (table 5) |
| R2 | 10 kΩ **DNP** | ZC_IN pull-down — only for DC-line coupling (§8.2 note 2) |

GPIO_0/1/2 are boot straps (table 4): GPIO_0 boot source, GPIO_1 host interface
(the module preloads a 10 kΩ pull-down = SPI slave), GPIO_2 SPI burst/legacy.
GPIO_2 is unused after boot and is listed in `UNCONNECTED`.

## Bring-up

1. Power up with **no** card/host: check 5 V at TP1, 3.3 V at TP4. The LM2576's
   ON/OFF pin is tied to GND (always on) and its FB pin is internally bonded on
   the fixed-output part, so both are left as fitted.
2. Press and hold SW3 for 0.5–3 s, then watch LED3: a 1 Hz blink means the module
   is in Simple Connect mode. LED2 (GPIO_0) lights when the network is joined.
3. Flash the ESP32 over J2 (UART0, 115200 8N1): hold SW2 (IO0) while pressing SW1
   (EN) to enter the download bootloader.
4. From the host, drive the modem with open-plc-utils: `plctool -i <if> …`, then
   `slac` to join, then bridge frames between the QCA7000 SPI interface and the
   W5500's socket buffers.

## Safety

* U2 pads 15/16/17 are at mains potential. The module's isolation is 4000 Vac with
  8 mm creepage / 6.5 mm clearance; the board keeps 8.0 mm, and the silkscreen
  draws the keep-out around those three pads.
* PS1 (MEAN WELL IRM-05-5) is a certified encapsulated supply — EN60950-1 /
  UL60950-1, CB, CE, cURus, TUV. Its isolation is inside the module.
* F1 is in the line conductor only; MOV1 is after the fuse. PE lands on J1.3 and
  TP3 and is **never** bonded to SELV ground on this PCB.
* The module is MSL 3 and tolerates at most two reflows (§13, IPC/JEDEC J-STD-020
  and J-STD-033).
* Not certified. A mains-coupled PLC product needs IEC/EN 62368-1 assessment plus
  the coupling and emissions work; the module's CE Class B variant is the starting
  point, not the finish.

## Footprint provenance

| package | source |
| --- | --- |
| `PLCSTAMP` | `github.com/PionixPublic/reference-hardware` → `Yak/lib/ev-devboard.pretty/PLC_Stamp_mini_2.kicad_mod`; outline and the missing pad 14 per chargebyte datasheet §11 |
| `ESP32WROOM` | KiCad official `RF_Module/ESP32-WROOM-32` |
| `WIZ850IO` | `github.com/es-ude/kicad-library` → `custom_library.pretty/WIZ850IO.kicad_mod`; outline 23 × 25.75 mm from the WIZnet datasheet |
| `IRM055` | `github.com/sebdehne/DehneEVSE-Hardware` → `CONV_IRM-05-5.kicad_mod` (pad names AC/L, AC/N, VNEG, VPOS renumbered 1–4) |
| `LM2576S`, `LRAD12`, `CUI_TB003`, `R0603`, `C0603` | KiCad official library / PIONIX library |
| `DO41` | hand-drawn in `tools/eda-blocks.mjs`, 7.62 mm axial |

`tools/import-kicad-footprints.mjs` re-fetches all of them and records repo, path
and fetch date in `tools/eda-packages.mjs`.

## Not done

* No routing. The board is placed and rule-checked; the traces, the ground pour
  stitching and the RF/analogue separation are left to whoever builds it.
* The chip-level alternative (bare QCA7000 in QFN-68 with 270 nH / 1.5 nF / 120 Ω
  AFE parts, 25 MHz crystal, 25Q16 flash) is documented in
  `tools/replacement-parts.mjs` with its footprint imported, but not laid out: the
  published hobby board that supplies those values is marked "TODO Not tested" by
  its author, and the module route buys a 4000 Vac isolation spec instead.
* The external zero-cross circuit of datasheet figure 6 (2200 pF, 820 kΩ,
  CGRM4007-G, TCLT1000 optocoupler, 100 Ω, 39 kΩ, 220 nF, 1000 pF, 1 µF) is
  recorded in `tools/replacement-parts.mjs` but not placed: only automotive
  variants need it.
