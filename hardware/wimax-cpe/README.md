# WiMAX CPE Wallplug — a mains-powered Mini Card carrier

Generated CAD: `node tools/build-wallplug-eagle.mjs --design=wimax-cpe --check`
re-derives these files from `tools/wimax-cpe-model.mjs` and compares.

| file | what it is |
| --- | --- |
| `wimax-cpe.lbr` | 22 packages, 18 symbols, 21 devicesets |
| `wimax-cpe.sch` | 1 sheet, 40 instances, 25 nets |
| `wimax-cpe.brd` | 140 × 90 mm, 2 layers, 44 elements, 160 pads — **unrouted on purpose** |
| `BOM.md` | every reference, package, fit/DNP, zone, note |

## What it is, and what it is not

A wallplug that powers a **PCI Express Mini Card** WiMAX modem and connects it to a
host over **USB 2.0**. The reference card is an Intel Centrino Advanced-N +
WiMAX 6250 (622ANXHMW): IEEE 802.16e-2005 Wave 2, Mobile WiMAX Release 1 Wave 2
system profile, 2.3 / 2.5 / 3.5 GHz, 20 Mbps down / 6 Mbps up over WiMAX, half
Mini Card 26.65 × 29.85 × 4.39 mm, 4.5 g, 3.3 V, two U.FL antenna jacks.

The honest limitation is in Intel's own product brief: **"Connector interface: PCIe
electrical interface for Wi-Fi, USB 2.0 for WiMAX."** A wallplug has no PCIe root
complex, so this carrier wires the USB half to an upstream micro-USB receptacle and
leaves `REFCLK±`, `PERn0/PERp0`, `PETp0` and `CLKREQ#` open. On this board the
802.11 radio stays dark and the 802.16e radio is the product. `LED_WLAN#` still
drives LED3, which will simply never light.

And the second honest limitation: **there are no WiMAX networks left.** Sprint and
Clearwater shut their 802.16e service down in 2015-2016. This board is therefore a
carrier for surplus cards, a teaching artefact, or — with J4 and U3 fitted — an LTE
mini-PCIe board, which is what `tools/replacement-parts.mjs` recommends.

```
L ── F1 ──┬── PS1 (MPM-20-12, isolated 12 V) ── FB1 ── U1 (LM2576S-3.3) ── 3V3 ──┐
N ────────┘                                                                       │
                                     U2 = mini-PCIe socket, five 3.3 Vaux pins ───┘
                                     J3 = micro-USB upstream: D+/D- to socket 38/36
                                     J4 = micro-SIM (DNP) on UIM_PWR/DATA/CLK/RESET
```

## Design rules

| rule | value | source |
| --- | --- | --- |
| mains ↔ SELV creepage | 6.4 mm | IEC 60664-1 / 62368-1 reinforced insulation at 250 V rms; no powerline module on this board, so the module-specific 8 mm figure does not apply |
| mains ↔ SELV clearance | 4.0 mm | same |
| 3.3 V rail | 3 A buck, five socket contacts | Mini Card EM spec rev 1.2: "Current Rating 0.50 A/power contact (continuous)" |
| card budget | 1100 mA at 3.3 V | PEAK Systems PCIe-miniPCIe adapter manual: 3.3 V max 1100 mA, 1.5 V max 375 mA |

`--check` reports the worst mains↔SELV pair as **TP3.1 ↔ TP8.1 = 16.03 mm**.

## Power budget

| rail | source | loads | margin |
| --- | --- | --- | --- |
| 12 V | MPM-20-12, 20 W / 1.67 A | U1 buck input ≈ 447 mA | 73 % |
| 3.3 V | LM2576S-3.3, 3 A | card 1100 mA + LEDs/pull-ups 30 mA | 62 % |

## The socket, pin by pin

52 positions, 0.8 mm pitch, two staggered rows (0.4 mm offset), two Ø2.6
non-plated mounting holes 24.2 mm apart. Signal names follow the PCI Express Mini
Card Electromechanical Specification rev 1.2, cross-checked against
hardwarebook.info and ARM's DSTREAM documentation (they agree).

| pins | what this board does |
| --- | --- |
| 2, 24, 39, 41, 52 (+3.3 Vaux) | all five tied to the 3.3 V rail, each decoupled locally by C5/C6/C7 |
| 4, 9, 15, 18, 21, 26, 27, 29, 31, 34, 35, 37, 40, 50 (GND) | ground |
| 36, 38 (USB_D−/D+) | to J3 (micro-USB upstream) and to TP7/TP8 |
| 22 (PERST#) | 10 kΩ pull-up R2: no PCIe host, so the card is held out of reset |
| 20, 51 (W_DISABLE#, W_DISABLE2#) | 10 kΩ pull-up R3 + SW4 to ground — the radio-disable the EM spec §3.2.5.2 requires a system to provide |
| 30, 32 (SMB_CLK, SMB_DATA) | 2.2 kΩ pull-ups R4/R5 |
| 42, 43 (LED_WWAN#, LED_WLAN#) | open-drain LED drives through 3.3 kΩ R6/R7 |
| 8, 10, 12, 14 (UIM_PWR, UIM_DATA, UIM_CLK, UIM_RESET) | to J4 micro-SIM (**DNP**: the Intel 6250 has no SIM; an LTE swap-in does) |
| 6, 28, 48 (+1.5 V) | from U3 AMS1117-1.5 (**DNP** — the 6250 is 3.3 V only) |
| 16 (UIM_VPP), 17, 19, 44, 45, 46, 47, 49 | open, each listed in `UNCONNECTED` with a reason |
| 1 (WAKE#), 3/5 (COEX1/2), 7 (CLKREQ#), 11/13 (REFCLK±), 23/25/33 (PCIe pairs) | open: coexistence and PCIe are laptop-host features this carrier does not have |

## Antennas are enclosure items, not board parts

The card carries its own **Hirose U.FL-R-SMT** jacks, which mate with **U.FL-LP-066**
cable connectors (Intel's WiFi Adapter Information Guide names both). So the
carrier board has no RF path to feed: the enclosure takes two U.FL → SMA bulkhead
pigtails and two antennas for the card's band. The silkscreen draws the card
outline (30 × 26.8 mm from the socket) and an RF keep-out over its antenna end;
`BOARD_LINES` in the model is where that drawing lives, and the imported `UFL`,
`SMAV` and `UMTSANT` footprints are available for a board that does need them.

## Bring-up

1. Check 12 V at TP1 and 3.3 V at TP4 before fitting the card.
2. Fit the card, then check 3.3 Vaux at TP5 with the card in circuit — a card that
   drags the rail below 3.15 V is drawing more than this budget allows.
3. Connect J3 to a host (a PC, or a Raspberry Pi's OTG port). The host must
   enumerate a USB device; on Linux the 6250's WiMAX side wants the `i2400m_usb`
   driver and a `wimaxd`-class daemon, both of which are historical now.
4. SW4 must be released (high) for the radio to be enabled.

## Safety

* F1 is in the line conductor only; MOV1 is after the fuse. PE lands on J1.3 and
  TP3 and is not bonded to SELV ground.
* PS1 (MEAN WELL MPM-20-12) provides the isolation; the PCB keeps 6.4 mm creepage
  and 4.0 mm clearance, enforced by `--check`.
* A transmitter has regulatory consequences beyond safety: W_DISABLE# must be
  reachable (SW4), and the antenna keep-out is part of the RF design, not
  decoration. The card's own FCC/RED certification does not transfer to this
  enclosure automatically.
* Not certified. IEC/EN 62368-1 assessment is needed before this goes anywhere
  near a wall.

## Footprint provenance

| package | source |
| --- | --- |
| `MPCIE` | `github.com/drbild/kicad-mini-pci-e` → `mpcie.pretty/mini-PCIe_H1_Half.kicad_mod`; courtyard set to the 30 × 26.8 mm half-size card area |
| `MPM2012` | `github.com/PionixPublic/reference-hardware` → `Yak/lib/ev-devboard.pretty/MPM2012.kicad_mod`; pin roles from that project's symbol (1 AC/N, 2 AC/L, 3 +V, 4 −V) |
| `USBMB` | KiCad official `Connector_USB/USB_Micro-B_Molex-105017-0001` |
| `MICROSIM` | KiCad official `Connector_Card/microSIM_JAE_SF53S006VCBR2000` |
| `LM2576S`, `AMS1117`, `LRAD12`, `CUI_TB003` | KiCad official / PIONIX libraries |

## Not done

* No routing, no RF work (there is no RF on this board), no PCIe.
* `UIM_VPP` is left open: SIM programming voltage is obsolete in 3G/4G UICCs. If a
  card asks for it, that is a different SIM interface than the one wired here.
* The 1.5 V rail is a DNP option, not a tested path — nothing on the reference card
  uses it, so it has never been loaded.
