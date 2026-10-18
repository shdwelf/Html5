# xPort Pro V.92 Fax Card — telnet BBS + Group 3 fax in an HP EIO slot

Generated CAD. Do not edit these files: they are emitted by
`tools/build-wallplug-eagle.mjs --design=xport-v92-faxcard` from
`tools/xport-v92-faxcard-model.mjs`, and `--check` re-derives them and compares.

| file | what it is |
| --- | --- |
| `xport-v92-faxcard.lbr` | 18 packages, 15 symbols, 18 devicesets |
| `xport-v92-faxcard.sch` | 1 sheet, 27 instances, 23 nets |
| `xport-v92-faxcard.brd` | 150 × 100 mm, 2 layers, 32 elements, 115 pads — **unrouted on purpose** |
| `BOM.md` | every reference, its package, fit/DNP, zone and note |

## What it does

A card in the HP Enhanced I/O (EIO) expansion-slot form factor that puts a
Lantronix xPort Pro device server and a V.92 56k data/fax modem inside a
printer, bridged by an STM32 Nucleo-64:

```
PSTN ── RJ11 (J3) ── V.92 modem (U3) ── USART1 ── Nucleo-64 (J2) ── USART2 ── xPort Pro (X1) ── RJ45 ── Ethernet
        tip/ring      DAA + Class 1     PA9/PA10                   PA2/PA3                  telnet BBS
```

The xPort Pro's RJ45 and the modem's RJ11 both come out on the EIO faceplate.
The xPort Pro runs the telnet BBS front end; the modem answers and sends Group 3
fax; the Nucleo bridges the two serial links and drives the T.30 session.

## The EIO constraint, and what it forced

EIO uses the **3.3 V signalling of the conventional PCI bus**, will not accept
LIO cards, and is not mechanically interchangeable with MIO. Two consequences:

* **An STM32 cannot enumerate as a PCI target.** Reaching the printer's
  formatter through the slot needs a PCI-to-local-bus bridge. This revision does
  not have one.
* **HP does not publish the EIO pinout.** No finger is energised on a guess.

So `J5` is a 68 × 12 mm **mechanical keep-out carrying no copper**, and the card
takes power from `J1`, a 12 V tap. The card uses the slot for mounting and
faceplate registration and is otherwise electrically independent of the printer.
When the pinout is traced from a donor JetDirect card, `J5` becomes a real
PCI-32 3.3 V finger pattern.

**A Nucleo cannot physically live in the slot** — it is 70 × 70 mm with 8.5 mm of
header above the board. This is a development carrier; a production revision
would put the same MCU down as a bare LQFP.

## Host wiring

| Nucleo-64 | MCU | other side | note |
| --- | --- | --- | --- |
| D1 | PA2 | X1 pin 5 `DIN` | USART2_TX → xPort Pro, via R8 100 Ω |
| D0 | PA3 | X1 pin 4 `DOUT` | USART2_RX ← xPort Pro, via R7 100 Ω |
| D8 | PA9 | U3 `RXD` | USART1_TX → modem, via R4 100 Ω |
| D2 | PA10 | U3 `TXD` | USART1_RX ← modem, via R3 100 Ω |
| D9 | PC7 | U3 `!DCD` | carrier detect |
| D10 | PB6 | U3 `!DTR` | |
| D11 | PA7 | U3 `!RI` | ring indicator |
| VIN | — | 12 V | UM1724 specifies 7–12 V |

**The trap:** on a Nucleo-64, PA2/PA3 are also the ST-LINK virtual COM port
(MB1136 SB62/SB63 ON, SB13/SB14 OFF). Leave the bridges closed and you get a
free USB console, but the ST-LINK shares the xPort Pro link. Open SB62/SB63 for
a production card, or swap the two links.

Both links are 3.3 V TTL end to end — the xPort Pro serial channel and the modem
module are both 3.3 V parts — so there is **no level shifter**. The 100 Ω
resistors are hot-plug and fault limiting, not translation.

No hardware flow control: 115200 8N1 against a 14.4 kbps fax channel leaves 8×
headroom for an interrupt-driven RX. `!RTS`/`!CTS` are in `UNCONNECTED`.

## Design rules

| rule | value | where it comes from |
| --- | --- | --- |
| working clearance | 1.0 mm | SELV only: 12 V in, 3.3 V derived, IPC-2221 B1 for ≤ 30 V |
| minimum pad-to-pad | 0.35 mm | `--check` geometry rule |
| mounting hole ↔ copper | 3.2 mm | `--check` |
| PSTN isolation | 3 kV class | inside the modem module; the board must not undo it |
| board | 150 × 100 mm, 2 layers, 1.57 mm FR-4 | PCI-class card thickness; inside a half-length PCI envelope |

There is no mains zone, so `--check` reports the worst mains↔SELV creepage as
`Infinity` — that is correct here, not a gap in the check.

## Power budget (datasheet maxima, not typicals)

| rail | source | loads | margin |
| --- | --- | --- | --- |
| 12 V | J1 tap, sized 6 W | U1 buck input ≈ 154 mA + Nucleo via VIN ≈ 250 mA = 404 mA | 19 % |
| 3.3 V | LM2576S-3.3, 3 A | xPort Pro 300 mA + modem 100 mA + LEDs 30 mA = 430 mA | 86 % |

`VIN` on the Nucleo power header is specified 7–12 V, which is why the card runs
12 V rather than back-powering the header's 3V3 pin. That pin is deliberately
open and listed in `UNCONNECTED`.

**Known refit before building:** `L1` is the shared block default 100 µH. The
LM2576 nomogram wants more inductance at 12 V in than at 5 V in — re-read the
L-vs-VIN chart and refit. This is on the schematic too.

## The modem

The pinout follows the **Radicom V92HM4-RC** class of part: controller-based, no
external memory, 3.3 V VCC with 5 V tolerant I/O, serial TTL DTE, 3 kV isolation,
V.92 data to 56 kbps, **14.4 kbps fax**, V.253 voice, DTMF, about 1 × 1 × 0.3 in
at 66–78 mA and 270 mW. Multi-Tech's SocketModem is the through-hole alternative
and is specified to connect straight to a UART at up to 230.4 kbps.

**Module pinouts are not standardised.** Confirm the pin order against whichever
module is actually bought before releasing the board.

## Fax protocol

Class 1 is **TIA/EIA-578**; Class 1.0 is **T.31**. The modem handles the
V.21/V.17/V.29/V.27ter modulation; the host drives the T.30 session with
`+FCLASS=1`, `+FRH`, `+FTH`, `+FTM`, `+FRM`, `+FTS`, `+FRS`. Group 3 tops out at
14.4 kbps. `+FAA=1` gives adaptive answer — answer as fax or fall back to data
on the same call, which is what a printer sharing one line wants.

Three details the firmware in `firmware/xport-v92/` encodes because they are
easy to get wrong:

* **The DCE generates the FCS on transmit.** The host sends address + control +
  information only on `+FTH`. On `+FRH` the DCE hands back the frame *including*
  its two FCS octets, so the host verifies on receive and never computes on send.
* **The P/F bit decides whether the call stays up.** Bit 4 of the control octet:
  clear, and the modem answers `CONNECT` and keeps transmitting flags; set, and
  it answers `OK` and drops carrier. That is how TSI and DCS go out in one
  `+FTH` burst — first frame P/F=0, last frame P/F=1.
* **DLE is a second escape layer, not part of HDLC.** `10 10` is one literal
  DLE, `10 1A` is two, `10 03` ends the frame, `10 04` aborts. A 0x10 in a page
  image that is not escaped reads as a control command.

## Bring-up

1. Power from a fused 12 V tap at J1. Check 3.3 V at TP4. The LM2576's ON/OFF is
   tied to GND (always on) and FB is internally bonded on the fixed-output part.
2. Flash the Nucleo over its own USB before fitting, or in place with the ST-LINK
   if SB62/SB63 are still closed.
3. Set the xPort Pro up on its own port: it defaults to 9600 8N1 and boots with
   a setup banner. Give it a static IP or a DHCP reservation, then point the BBS
   front end at port 23.
4. Probe the modem at TP5 (`TXD`) and TP6 (`RXD`) before trusting the bridge:
   `AT` → `OK`, then `AT+FCLASS=?` to confirm Class 1 is available.
5. Only then test against the PSTN — and only with a modem approved for the
   local line.

## Safety

* No mains on this card. Everything is SELV.
* The PSTN is **not** SELV. The isolation is inside the modem module; `TIP` and
  `RING` run only between U3 and J3, with no test point on that pair, because a
  test point there would defeat it.
* Connecting equipment to a telephone line is regulated in most countries. A
  modem not approved for the local PSTN cannot lawfully be connected to it
  whatever this board does.
* The 12 V tap must be fused at the source. This card has a ferrite on the entry,
  not a fuse.
* The EIO pinout is unpublished. Do not energise a finger on a guess, and do not
  assume a JetDirect pinout carries over to another EIO accessory.

## Footprint provenance

| package | source |
| --- | --- |
| `XPORTPRO` | shared with the xPort Wallplug design — Lantronix xPort Pro Integration Guide 900-557 rev K table 2-2, plus `tridrao/SparkFun-KiCad-Libraries` `XPORT.kicad_mod` |
| `NUCLEO64` | **drawn here**: 32 Arduino Uno R3 header pads at 2.54 mm plus 4 × M3. Signal mapping from ST UM1724 (MB1136) rev 14/17. Header body positions at x = ±24.13 mm are a **mechanical approximation** — confirm against the board's mechanical drawing |
| `V92MOD` | **drawn here** to the Radicom V92HM4-RC envelope, 25.4 mm square, 2 × 7 through-hole pads |
| `RJ11-6P4C` | **drawn here**: staggered 2 × 3 contacts so a 1.02 mm pitch is drillable |
| `EIO-EDGE` | **drawn here**, pad-less mechanical keep-out — see the EIO section |
| `LM2576S`, `LRAD12`, `TERM2-5.08`, `R0603`, `C0603`, `DO41`, `TP`, `MOUNT-M3` | the family's verified generic library (`tools/eda-packages.mjs`) |

## Not done

* **No routing.** The board is placed and rule-checked; traces, ground-pour
  stitching and the analogue/DAA separation are left to whoever builds it.
* **The firmware is written and unit-tested, but has never run on hardware.**
  `firmware/xport-v92/` holds the AT parser, the DLE transparent-data codec,
  HDLC FCS-16, the T.30 Class 1 phase machine and the bridge loop, with 883
  host-side checks passing under `-Wall -Wextra -Werror`. Nothing has carried a
  fax page: there is no STM32 `hal.c`, no flashed board, and no page-image
  source wired into `bridge.c`.
* **No EIO pinout.** Deliberate — see above.
* **Not certified.** Telephone-line equipment needs local homologation, and a
  card living inside a printer interacts with that printer's own safety
  certification.
