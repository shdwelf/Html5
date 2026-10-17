# xPort Pro → Nucleo-64 → V.92 fax modem, as an HP EIO slot card

A card in the HP **Enhanced I/O (EIO)** expansion-slot form factor that puts a
Lantronix xPort Pro device server and a V.92 56k data/fax modem inside a
printer, bridged by an STMicroelectronics Nucleo-64. The xPort Pro's RJ45 comes
out on the faceplate and carries the telnet BBS front end; the modem's RJ11
comes out beside it.

Built in the order asked: **xPort Pro → Nucleo-64 → V.92 modem → printer
expansion slot.**

- Board model: `tools/xport-v92-faxcard-model.mjs`
- Output: `hardware/xport-v92-faxcard/{lbr,sch,brd}` + `BOM.md`
- Build and verify: `node tools/build-wallplug-eagle.mjs --check --design xport-v92-faxcard`

## The signal chain

```
PSTN ── RJ11 (J3) ── V.92 modem (U3) ── USART1 ── Nucleo-64 (J2) ── USART2 ── xPort Pro (X1) ── RJ45 ── Ethernet
        tip/ring      DAA + Class 1     PA9/PA10                   PA2/PA3                  telnet BBS
```

| Stage | Part | Link |
| --- | --- | --- |
| 1 | Lantronix xPort Pro `XPP100300S-04R` | RJ45 10/100 on the faceplate; 3.3 V TTL serial, pins 4 `DOUT` / 5 `DIN` |
| 2 | STM32 Nucleo-64 (MB1136 class) | USART2 on D1/D0 = PA2/PA3; USART1 on D8/D2 = PA9/PA10 |
| 3 | V.92 56k controller-based modem module | serial TTL at 3.3 V, DAA and 3 kV isolation on the module |
| 4 | HP EIO card edge | mechanical registration and the faceplate |

Both links are 3.3 V TTL end to end, so there is no level shifter on the board.
The 100 Ω series resistors are hot-plug and fault limiting, not translation.

## The EIO finding, and what it forces

**EIO uses the 3.3 V signalling of the conventional PCI bus**, will not accept
LIO cards, and is not mechanically interchangeable with MIO. That single fact
shapes the whole design:

- **An STM32 cannot enumerate as a PCI target.** Reaching the printer's
  formatter over the slot would need a PCI-to-local-bus bridge in front of the
  MCU. This revision does not do that.
- **HP does not publish the EIO pinout.** Nothing in the public manuals gives a
  connector pin assignment, so no finger is energised on a guess.

So the card uses the slot for **mechanical mounting and faceplate
registration**, and takes power from `J1`, a 12 V tap. `J5` is a 68 × 12 mm
keep-out carrying no copper. When the pinout is committed it gets replaced with
a real PCI-32 3.3 V finger pattern; until then the card is electrically
independent of the printer.

The card is 150 × 100 × 1.57 mm — inside a half-length PCI envelope, which is
the size class EIO cards occupy.

**A Nucleo cannot physically live in the slot.** It is 70 × 70 mm with 8.5 mm
of header above the board. This is a development carrier: the Nucleo is socketed
so it can be reflashed off the card, and a production revision would put the
same MCU down as a bare LQFP.

## The trap worth knowing before you wire it

On a Nucleo-64, **PA2/PA3 are also the ST-LINK virtual COM port**, wired by
default through solder bridges SB62/SB63 with SB13/SB14 OFF. So USART2 — the
port this design gives the xPort Pro — is shared with the on-board debugger:

- **Leave SB62/SB63 closed** and you get a free USB console, but the ST-LINK
  sits on the same pins as the xPort Pro link.
- **Open SB62/SB63** and the xPort Pro owns the port cleanly.
- **Or swap the two links**: xPort Pro to USART1, modem to USART2.

The Arduino-header mapping used here is the revision-independent one,
cross-checked against UM1724 rev 14 and rev 17:

| Arduino | MCU | Function |
| --- | --- | --- |
| D1 | PA2 | USART2_TX → xPort Pro `DIN` |
| D0 | PA3 | USART2_RX ← xPort Pro `DOUT` |
| D8 | PA9 | USART1_TX → modem `RXD` |
| D2 | PA10 | USART1_RX ← modem `TXD` |
| D9 / D10 / D11 | PC7 / PB6 / PA7 | `!DCD` / `!DTR` / `!RI` |

ST's `CN` designators for the four headers are not stable across board
revisions, so the footprint names its pads by Arduino Uno R3 signal instead.
**The header body positions (x = ±24.13 mm) are a mechanical approximation** —
confirm against the board's mechanical drawing before cutting a panel.

## Power

`VIN` on the Nucleo power header is specified **7–12 V**, which is why the card
takes a 12 V tap rather than trying to back-power the header's 3V3 pin (doing
that while VIN is live would fight the Nucleo's own regulator — the pin is left
open and listed as deliberately unconnected).

| Rail | Load | mA |
| --- | --- | --- |
| 12 V | buck input (3.3 V × 0.43 A / 0.77 / 12 V) | 154 |
| 12 V | Nucleo-64 via VIN, MCU + ST-LINK | 250 |
| 3V3 | xPort Pro incl. Ethernet TX | 300 |
| 3V3 | V.92 modem module, 270 mW + DAA peak | 100 |
| 3V3 | LEDs and pull-ups | 30 |

`budgetCheck` passes: 404 of 500 mA on 12 V, 430 of 3000 mA on 3V3.

**One known refit:** `L1` is the shared block default of 100 µH. The LM2576
nomogram wants more inductance at 12 V in than at 5 V in. Re-read the L-vs-VIN
chart and refit before building — this is called out on the schematic too.

## Modem and fax protocol

The pinout follows the **Radicom V92HM4-RC** class of part: controller-based, no
external memory, 3.3 V VCC with 5 V tolerant I/O, serial TTL DTE, 3 kV isolation,
V.92 data to 56 kbps, **14.4 kbps fax**, V.253 voice, DTMF, about 1 × 1 × 0.3 in
at 66–78 mA. Multi-Tech's SocketModem is the through-hole alternative and is
specified to connect straight to a UART at up to 230.4 kbps.

Fax is **Class 1** (TIA/EIA-578) or **Class 1.0** (T.31): the modem handles the
V.21/V.17/V.29/V.27ter modulation and the host drives the T.30 session with
`+FCLASS=1`, `+FRH`, `+FTH`, `+FTM`, `+FRM`, `+FTS`, `+FRS`. Group 3 tops out at
14.4 kbps, so a 115200 8N1 host link leaves 8× headroom and no hardware flow
control is fitted — the modem's `!RTS`/`!CTS` are left open. Add them if the
firmware ever polls instead of running off the RX interrupt.

**Module pinouts are not standardised.** Confirm the pin order against whichever
module is actually bought before releasing the board.

## What is verified, and what is not

The emitter's `--check` is not a lint. It parses all three XML files, resolves
every part → deviceset → gate → symbol pin → package pad chain and every
element → package → contactref, compares the resulting connectivity against the
model's `NETS` table, then runs a geometry DRC (courtyard overlap, board-edge
containment, pad-to-pad spacing, creepage):

```
geometry: 115 pads, 32 placed elements, 23 nets
schematic: 27 instances on a 520 × 520 mm sheet, no overlapping label boxes
OK — XML well-formed, every reference resolves, connectivity matches the model, geometry clean.
```

All four pre-existing designs in the family still pass, and `tests/20-wallplug.mjs`
is green.

**Not verified:**

- **Nothing is fabricated or fitted.** No board house, no assembly, no powered-up
  card. This is a checked netlist and layout, not a working device.
- **The firmware has never run on hardware.** `firmware/xport-v92/` is written
  and passes 883 host-side checks, but there is no STM32 `hal.c`, no flashed
  board, and no page-image source wired into `bridge.c`. Nothing has carried a
  fax page.
- **No EIO pinout.** Deliberate — see the section above.
- **The Nucleo header positions are approximate**, as noted.
- **The modem pin order is a class representative**, not a specific bought part.

## The bridge firmware

`firmware/xport-v92/` is portable C: everything except `bridge.c` compiles and
is tested on the host against `hal.h`, and the same sources go into an STM32
build with only a different `hal.c`.

| module | what it does |
| --- | --- |
| `fcs.c` | HDLC FCS-16 (CRC-16/X.25), checked against the published `0x906E` value and the `0xF0B8` good-frame residue |
| `dle.c` | the T.31 transparent-data escape layer: `10 10`, `10 1A`, `10 03`, `10 04`, `10 11`, `10 13` |
| `at.c` | byte-fed AT result parser — no line buffer beyond one line, never blocks |
| `fax1.c` | frame assembly, receive reassembly with FCS verification, and the T.30 phase machine |
| `xport.c` | guard-time `+++` escape detector and monitor-mode command formatting |
| `bridge.c` | the two-UART bridge loop; type-checked, not unit-tested |

Build and run:

```sh
make -C firmware/xport-v92 test           # 883 checks
make -C firmware/xport-v92 compile-check  # bridge.c type-checks
node --test tests/xport-v92-firmware.test.mjs
```

`DLE <ferr>` — the sequence a DCE uses to say "that frame had a bad FCS" — is
named by T.31 but the octet after DLE is implementation-defined, so the decoder
does not guess it: it comes back as `DLE_EV_UNKNOWN` with the octet preserved
and the caller decides. Worth confirming against whichever module gets bought.

## Regulatory

The PSTN is not SELV. The isolation is inside the modem module; `TIP` and
`RING` run only between `U3` and `J3`, with no test point on that pair, because
a test point there would defeat it. Connecting equipment to a telephone line is
regulated in most countries, and a modem not approved for the local PSTN cannot
lawfully be connected to it whatever this board does. The 12 V tap must be fused
at the source — the card has a ferrite on the entry, not a fuse.

## Reproducing

```sh
node tools/build-wallplug-eagle.mjs --check --design xport-v92-faxcard
```

That writes `hardware/xport-v92-faxcard/` and exits non-zero on any check
failure. Add `--no-write` to verify files already on disk.
