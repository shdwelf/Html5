# Pi Wall Socket — a Raspberry Pi Zero 2 W carrier with Ethernet and powerline

Generated CAD: `node tools/build-wallplug-eagle.mjs --design=pi-wall-socket --check`
re-derives these files from `tools/pi-socket-model.mjs` and compares.

| file | what it is |
| --- | --- |
| `pi-wall-socket.lbr` | 22 packages, 18 symbols, 23 devicesets |
| `pi-wall-socket.sch` | 1 sheet (520 × 500 mm), 41 instances, 35 nets |
| `pi-wall-socket.brd` | 180 × 120 mm, 2 layers, 45 elements, 175 pads — **unrouted on purpose** |
| `BOM.md` | every reference, package, fit/DNP, zone, note |

## What it is

A carrier board for a **Raspberry Pi Zero 2 W** that is meant to live in a
wall-socket enclosure. It takes L/N/PE from the socket's own terminals, makes
isolated 12 V, then 5 V for the Pi and 3.3 V for everything else, and gives the Pi
the two network paths it does not have: **wired Ethernet** and
**Ethernet-over-powerline**.

```
L ── F1 ──┬── PS1 (MPM-20-12, 12 V) ──┬── U1 LM2576S-5.0 ── 5 V ── Pi header pins 2/4
          │                           └── U2 LM2576S-3.3 ── 3.3 V ─┬── U4 WIZ850io (SPI0)
N ────────┤                                                        └── U3 PLC Stamp mini 2 (SPI1)
          └── U3 pins 16/17 (L), 15 (N)   ← the modem couples onto the mains
PE ─── J1.3 only, never bonded to SELV ground
```

Why a Zero 2 W and not a Pi 4 or a CM4: the Zero 2 W is 65 × 30 mm with four M2.5
holes on 58 × 23 mm centres, so it fits behind a socket faceplate, and it has no
Ethernet — which is exactly the gap this carrier fills. It is a quad Cortex-A53
(RP3A0/BCM2710A1) at 1 GHz with 512 MB, 2.4 GHz Wi-Fi and BT 4.2, drawing about
3 W max. The industrial alternative is a Compute Module 4, which has an Ethernet
PHY on the module (pins 3-12 are `Ethernet_Pair0..3 P/N`) and takes 5 V on six
pins, but needs two 100-way 0.4 mm DF40C-100DS mezzanine connectors; the PIONIX
EVerest Yak is a published CM4 carrier of exactly that kind.

## Design rules

| rule | value | source |
| --- | --- | --- |
| mains ↔ SELV creepage | **8.0 mm** | PLC Stamp mini 2 datasheet rev 13 §8.3 |
| mains ↔ SELV clearance | 6.5 mm | same |
| isolation | 4000 Vac, inside U3 | same |
| Pi 5 V | header pins 2/4, ≈600 mA max | Pi Zero 2 W: ≈3 W at 5 V |
| Pi 3.3 V output | **left open** | pins 1/17 are the Pi's own regulator, ≈50 mA; paralleling it with a 3 A rail would be a mistake |

`--check` reports the worst mains↔SELV pair as **U3.15 ↔ U3.13 = 13.12 mm** — the
modem's own N pad against its own ZC_IN pad.

## Power budget

| rail | source | loads | margin |
| --- | --- | --- | --- |
| 12 V | MPM-20-12, 20 W | 5 V buck input 391 mA + 3.3 V buck input 206 mA = 597 mA | 64 % |
| 5 V | LM2576S-5.0, 3 A | Pi Zero 2 W 600 mA | 80 % |
| 3.3 V | LM2576S-3.3, 3 A | U3 300 mA (§8.2 max) + U4 180 mA + LEDs/straps/breakout 80 mA = 560 mA | 81 % |

Two buck regulators rather than one: the Pi wants 5 V and the modem wants 3.3 V at
up to 300 mA, and an LDO from 5 V at that current is 0.85 W of heat in a SOT-223.

## The Pi interface

J2 is the Raspberry Pi Zero footprint itself — 40 header pads plus the four Ø2.75
holes in their real relative positions (58 × 23 mm centres, 65 × 30 mm outline) —
so the Pi bolts down onto 2.54 mm female headers with no separate hole parts.

| function | header pins | GPIO |
| --- | --- | --- |
| SPI0 → WIZ850io | 19 MOSI, 21 MISO, 23 SCLK, 24 CE0 | GPIO10/9/11/8 |
| SPI1 → PLC modem | 35 MISO, 38 MOSI, 40 SCLK, 36 CE0 | GPIO19/20/21/16 |
| PLC interrupt / reset | 37 / 31 | GPIO26 / GPIO6 (+ TP6) |
| Ethernet interrupt / reset | 22 / 13 | GPIO25 / GPIO27 (R8 10 kΩ pull-up) |
| UART0 console | 8 TXD, 10 RXD | GPIO14/15, broken out on J3 |
| 5 V in | 2, 4 | from U1 |
| 8 × GND | 6, 9, 14, 20, 25, 30, 34, 39 | |
| spare | 3, 5, 11, 12, 16, 18, 26, 27, 28, 29, 32, 33 | listed in `UNCONNECTED` |

Raspberry Pi OS needs `dtoverlay=spi1-3cs` for the second SPI bus. The Green PHY
side needs Qualcomm's `open-plc-utils` (or chargebyte's V2G Core) and the QCA7000
SPI protocol from chargebyte's AN4; the wired side is a `w5500` SPI device on
`spidev0.0`.

## The socket-outlet relay: considered, and not fitted

A relay-switched outlet was the obvious next block and it is deliberately absent.
The Panasonic **AHES4291** used on the PIONIX EVerest devboard has published pin
roles (1 COM_1, 2 COM_2, 3 COM_3, 4 COIL_1, 5 COIL_2, 6 NC_3, 7 NO_2, 8 NO_1), but
its footprint puts contact pad 3 at (11.45, −16.75) and coil pad 4 at
(3.8, −16.75): **7.65 mm centre-to-centre, ≈4.8 mm between pad edges** — inside
the 8 mm creepage this board keeps for the powerline module. `tests/23-variants.mjs`
measures both numbers so the claim cannot rot.

The Omron **G5LE-1** footprint in the KiCad official library has one pad row at
y = 0/−2 and the other at y = −14.2, i.e. 12.2–15.4 mm between rows, which clears
the rule — but KiCad's symbol leaves the pin names empty (coil and contacts are
separate units), so read the Omron datasheet for which pad is coil+ before routing.
Both footprints are imported and available; see `tools/replacement-parts.mjs`.

Metering is likewise documented rather than fitted: the PIONIX library publishes
the ADE7932ARIZ / ADE7978ACPZ / ADE9078ACPZ energy-metering parts and the
Vacuumschmelze T60404-N4641-X920 current sensor, all imported here.

## Bring-up

1. Power up with no Pi: 12 V at TP1, 5 V at TP4, 3.3 V at TP5.
2. Fit the Pi on 2.54 mm female headers, M2.5 standoffs through the four Ø2.75
   holes. Its own power LED should light from the header 5 V pins.
3. `dtoverlay=spi1-3cs` in `/boot/config.txt`, then check both SPI buses appear.
4. Wired side first: the W5500 driver binds to `spidev0.0`, and link/activity are
   on the module's own RJ45 LEDs.
5. Powerline side: GPIO_0 (LED2) lights when the modem has joined a Green PHY
   network; SW3 held 0.5–3 s starts Simple Connect and LED3 blinks at 1 Hz while
   pairing (datasheet table 5).
6. Console on J3 (UART0, 115200 8N1) — a socket box has no display.

## Safety

* U3 pins 15/16/17 are at mains potential; the module provides 4000 Vac isolation
  with 8 mm creepage / 6.5 mm clearance, and the board keeps 8.0 mm with a
  silkscreen keep-out around those three pads.
* Fit the **CE Class B / North America** variant (`I2PLCBMN-ISC-004-*`) with the
  1:4:5 transformer and on-module zero-cross, pin 13 floating. The automotive
  EVSE/PEV variants are explicitly not for mains (datasheet §12.2).
* PS1 (MPM-20-12) provides the primary isolation; 12 V, 5 V and 3.3 V are SELV.
* F1 is in the line conductor only, MOV1 after it, PE on J1.3 and never bonded to
  SELV ground.
* Both the Pi and the modem have radios, and the modem has a mains coupling: a
  metal faceplate over either changes the result. The silkscreen marks the Pi's
  antenna keep-clear line and the modem's mains keep-out.
* Not certified. A board that lives in a wall-socket enclosure needs IEC/EN 62368-1
  assessment, and the enclosure must keep the socket's live parts further from the
  SELV side than this board alone does.

## Footprint provenance

| package | source |
| --- | --- |
| `PIZERO` | `github.com/tylercrumpton/CrumpPrints.pretty` → `Raspberry_Pi_Zero.kicad_mod`; hole pattern cross-checked against the Raspberry Pi Zero mechanical drawing (65 × 30 mm, four M2.5 holes, 58 × 23 mm centres) |
| `PLCSTAMP` | PIONIX EVerest library; outline and missing pad 14 per chargebyte datasheet §11 |
| `WIZ850IO` | `github.com/es-ude/kicad-library`; pinout from the WIZnet WIZ850io datasheet v1.0 |
| `MPM2012`, `CUI_TB003` | PIONIX EVerest library |
| `LM2576S`, `LRAD12`, `R0603`, `C0603` | KiCad official library |

## Not done

* No routing, and no enclosure. 180 × 120 mm is a wall-mounted enclosure beside or
  behind the socket, not a socket box: a UK single-gang box is 86 × 86 mm.
* No relay, no metering (both documented above with real parts).
* The Pi's mini-HDMI, camera, USB OTG and microSD are on the module and are not
  broken out; a socket-box product provisions over UART0 or Wi-Fi.
