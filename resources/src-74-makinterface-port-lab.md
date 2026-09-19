# MAKInterface — pinouts, the five December-2005 drops, and the port bench

> **Register:** src-74 · **Sources:** makinterface.net Wayback captures (CDX-verified), `s3c/PyMAKInt` over GitHub
> **Extracted:** 13 September 2026 · **Type:** research + static disassembly + in-repo emulation model

Wave 8 of the casefile lab. Wave 7 had resolved `makinterface` to the German universal-programmer
vendor and pinned five December-2005 software drops "for disassembly", but had not read the
vendor's own pages, had not verified the pins against the live index, and had left two questions
open: what port the box actually hangs on, and whether a smart-card *emulator* is in scope. This
note closes all four: verified pins, the depot that is bigger than five, the port question
answered in the vendor's words, and a working model of the interface in `js/makint.js`.

## What the archives hold, re-queried

Every row below was read out of the CDX index this session (`url=makinterface.net&matchType=domain`)
and the digest and length compared against what `js/krome-catalog.js` had pinned in wave 7.

| artifact | capture | CDX SHA-1 (base32) | length |
| --- | --- | --- | --- |
| `dms.zip` | 20051211 08:53:16 | `MKU573ISDNMH7NJFCCWI64NFXQ7GVPRK` | 1 457 565 |
| `MaksAct.zip` | 20051211 10:19:32 | `ALM5LHEYGZFES7XMAKRWRHZ3LKHFM47K` | 1 691 962 |
| `makstripe.zip` | 20051211 09:41:37 | `K65J3QAURDS37Z4KLYCDEUBMHVKSK3YK` | 2 341 373 |
| `makstripee.zip` | 20051211 08:32:17 | `SPLNPY3WHCD4ILZ3P4OREVITSVHOSQ3R` | 2 273 175 |
| `Pinout.zip` | 20051220 01:13:57 | `GOBEFEPET63CQHNJNPO6LCEX2JC5L646` | 7 212 |

All five hold. Wave 7's pins were right.

The same crawl caught **eight archives wave 7 never listed**, all on the morning of 11 December
2005, and they are the ones that matter for a disassembly pass because of what they are:

| artifact | capture | CDX SHA-1 | length |
| --- | --- | --- | --- |
| `MAKI_DE.ZIP` | 20051211 09:58:00 | `757MD7VICC3V5AOCJUY7CFEEY5U5TRGV` | 2 615 431 |
| `MAKI_EN.ZIP` | 20051211 08:56:36 | `JOXDCFX5QJIM5OCHVDDRC3PM4X2O2FDI` | 2 608 581 |
| `MAKITEST.ZIP` | 20051211 09:12:16 | `QAPUBDQ5CANNYZJJGMLI23GFQEI3ZAKS` | 936 801 |
| `MAKS_DE.ZIP` | 20051211 09:42:51 | `NABWUJZYJYOWMZUCOLE24LQKIEYOUIDT` | 1 777 851 |
| `MAKS_EN.ZIP` | 20051211 10:09:29 | `2XO6OQX7HYQ4KY5TU3E5IBG2XV56IACW` | 1 775 284 |
| `DMS_EN.ZIP` | 20051211 08:36:27 | `ZKNXAD3CUT5R4UELGWZX62S2IZO4MYTL` | 218 343 |
| `DMS_DE.ZIP` | 20051223 19:03:28 | `G7CJWZZHAXPCTLDJBJOHXIERANKKYNTZ` | 219 094 |
| `PRSC.ZIP` | 20051211 09:37:45 | `4OIYHEDGZD62BCFIKOEEX2JJMDGX2SPW` | 2 224 719 |

Three things the index itself says, without opening a byte:

- **The bytes are stable.** `MAKI_DE.ZIP` carries one digest across nine captures from February 2003
  to March 2006, `DMS_DE.ZIP` the same across eleven from 2002 to 2006. The recorded WARC length
  wobbles by a handful of bytes between captures while the SHA-1 does not move, which is the
  capture record framing, not the file. A digest gate on these is a gate on real bytes, and a
  mismatch will mean a re-encode leaked in — exactly the failure mode the recovery console exists
  to surface rather than hide.
- **`PRSC.ZIP` *is* `SCPROG.ZIP`.** Identical SHA-1 (`4OIYHEDG…`, 2 224 747 bytes in the 2002-06-23
  capture), and `SCPROG.ZIP` had a different digest three weeks earlier. The smart-card programmer
  archive was renamed upstream, not rewritten.
- **`MAKS_DE.ZIP` shows the version chain**: four distinct digests between June 2002 and
  September 2003, then frozen. The depot has a release history visible in the index alone.

## Which port, settled by the vendor

The interesting claim in the order was that MAKInterface maps its hardware to the parallel port.
The vendor's own product page says otherwise, in as many words:

> "MAKInterface has to be connected to a free 25pole serial port. In case the PC has only 9pole
> serial ports, a 25pole-to-9pole adapter is needed." — `home1_e.php3`, capture 20060501030424,
> digest `PUW3WSSU3HPRYZXFVKTZNJN6XDCVSGZY` (unchanged 2005→2007)

and:

> "The required power supply — 5 V for most applications and up to 12 V for PIC programming — is
> taken from the RS232 port and so it is perfectly suitable for mobile application."

So the box is a **serial-port** device, powered from the handshake lines, with an inverter per line
so the same freeware could drive either polarity. The parallel port appears in exactly two places,
and both are different products:

- the optional MCU/EEPROM adapter kit, for wide parallel PROMs — *"27xxx, 27Cxxx, 28Cxxx, 28Fxx,
  29Fxxx,… (only with the optional with our MCU/EEPROM adapter kit, free Parallel Ports on the PC
  are required)"* — that is where the "needs a parallel port" note comes from, and it is true of
  the adapter, not the interface;
- **art. 00605, "Standalone parallel port flashing interface for Nokia GSM phones"**, €14.90 — a
  separate thing on the order form.

Both are in `order-e.txt` (capture 20020824222340). The correction is not a gotcha; it changes the
virtualisation plan, because a serial-line model is a much easier and more faithful target than an
LPT one.

## The pinouts, transcribed

`pinout_e.php3` is an HTML page, which means it is recoverable as text and does not have to wait on
`Pinout.zip`. The 2×5 header (art. 00992, "10 Connectors 2x5 pole for MAKInterface") is documented
with the even column as `+` and the odd as `−`, and the two smart-card rows are the interesting pair:

| mode | VCC | Reset | CLK | GND | I/O |
| --- | --- | --- | --- | --- | --- |
| **Reader** — Dumbmouse, Phoenix, Smartmouse | Maki 8 | Maki 6 | Maki 7 | Maki 4 | Maki 1+2 |
| **Emulator** — Season, ASIM, … | Maki 8 | Maki 5 | — | Maki 4 | Maki 1+2 |

The emulator row has no CLK input and moves Reset from 6 to 5: an emulated card is clocked and
reset by whatever it is sitting in, which is what separates a logger from an emulator. `1+2` and
`5+7` are written as pairs because the interface drives one half and receives on the other — tying
a two-wire UART pair into one half-duplex line is the whole trick behind "compatible with almost
every freeware programmer", and it is precisely how ISO 7816's single I/O pad gets wired.

The memory-device rows confirm the fixed pair: `24Cxx` puts VSS on 4 and VCC on 8; the PIC rows put
VPP on 9. So: **4 = ground, 8 = the supply that comes out of the port, 9 = programming voltage, 1
and 2 = the bidirectional data pair, 5/6/7 = the reassignable control lines**, and every device in
the appendix is a different assignment of the same six lines.

## Emulation is a product category, not an improvisation

The order form sells the emulator directly:

- **art. 00519** "Smartcard Emulator & Datalogger (Small)", €12.90
- **art. 00524** same with an IC socket — "Goldwafer, Goldwafer2, Jupiter1, Funcard, Season1,
  Season2 compatible", €12.90
- **art. 00525** the bare PCB, €7.90, and **art. 00522** the Emu/Log cable to go with it

and `univpcpe.php3` documents **art. 00529**, the socketed universal PCB where *the populated chip
set is the emulated card*: Whitewafer = 16F84; Goldwafer = 16F84 + 24C16; TwinPIC = 2×16F84;
Triple Card = 2×16F84 + 24C16; Quadracard = 2×16F84 + 2×24C16; Jupiter1 = 90S2323/43 + 24C16;
Funcard = 90S8515 + 24C65, with the EEPROM under the Atmel "due to the lowered contacts"; or the
wide option 90S8515 + 24C512 / 89S53 + 24C512.

That answers the question asked — *can it be virtualised, and can such an emulator be emulated* —
at two levels, and the honest answer is yes at both:

1. **The interface is a register model, not an FPGA.** A UART pair, four general-purpose lines, a
   per-line inverter, and a crystal in a socket. Assert VCC, hold Reset, run the clock, bit-bang
   ISO 7816-3. `js/makint.js` is that model.
2. **The card is a memory model plus whatever firmware image you choose to load.** The vendor's own
   emulated cards are an MCU and an EEPROM, so emulating *those* is emulating a small ROM on a
   known bus.

The crystal arithmetic is the part worth writing down, because it is why the box looks arbitrary
and is not: the shipped 3.579545 MHz oscillator with F = 372, D = 1 gives an ETU of 103.924 µs,
i.e. **9622.4 baud** — within a tenth of a percent of the 9600 that every period smart-card COM
driver defaulted to. `3.579545e6 / 372` is the whole explanation, and the 6.0 MHz option is why the
"Pro" version could run cards at other clocks.

**Where this stops, stated in the module itself.** `js/makint.js` models the link and a plain memory
card image, and its last export is a scope note saying so. Reproducing a payment instrument, a SIM's
authentication secrets, or a conditional-access module is a different act from documenting a dead
2005 programmer's electrical interface, and it is not what this file is for.

## What was disassembled, and what stayed pinned

`web.archive.org` and `archive.org` are not routable from this build host (the only reachable hosts
this session were github.com, api.github.com, pypi.org, files.pythonhosted.org), so the twelve
vendor archives could not be opened here — they stay hash-pinned and are recovered in the user's
tab by the existing `ghidraSweep`, which gates each capture on its CDX digest before anything is
disassembled. That is the repository's design, not a workaround to route around.

What *is* reachable is the driver side, and it got the real treatment. `s3c/PyMAKInt` was cloned
over GitHub and put through `tools/makint_static.py`:

- **Bytecode.** Two CPython 3.4 `.pyc` files (magic `ee0c0d0a`), disassembled with `pydisasm`
  (xdis 6.3.0): `pymakint` = 20 code objects / **1438 instructions**, `pymagpar` = 4 / **347**.
  Per-function instruction counts, name tables and constant pools in
  `samples/makint/analysis.json`.
- **Integrity, not decoration.** The `.pyc` header records the source size, and it matches the
  shipped `.py` exactly for both modules (10876 and 3638 bytes) — `source_in_sync: true`. The
  bytecode on the wire is the bytecode of the source in the tree, so reasoning from one about the
  other is safe. The recorded build path is `/home/user/Work/PyMAKInt/pymakint.py`, timestamp
  1442334330 (15 September 2015).
- **The wire protocol, from the constant pool.** 38400 8N1; `?` → 15 bytes beginning `MSUSB`;
  `R`+mask → `Ready`, then `RD `, a u16 transition count, that many 2-byte tick records, `RD=OK`;
  `F`+mask+secs·8+`\` → `FM `/`FM=OK`; `E`/`e`+mask+secs → `Er `/`eR=OK`; `I`+n+`\01` → three
  `#'…'` lines; `H` → `EZ=OK`. Every one of those strings was read out of the disassembly, not
  out of a header comment.
- **The `.mag` container, tested on 144 real captures.** `u32` transition count, then one
  `{u32 trackmask<<4, f32 absolute seconds}` per transition; `filesize == 4 + 8·count`. All
  **144/144** files upstream parse under that rule, across 27 distinct sizes. The clock falls out
  of the data: the widest inter-transition gap in the corpus is 3.406667 s, and 511 ticks at
  150 Hz is 3.406667 s — the payload saturates exactly on the 9-bit ceiling of the on-wire tick
  field, which is the only explanation for a maximum that lands there. Track-2-only captures,
  monotone timestamps, tick counts 411–440 per file.
- **Upstream is hashed, not copied.** PyMAKInt ships no license file, so the repository keeps
  digests, structure and derived facts and re-hosts nothing — including the `woodlands_bulk/`
  ticket captures, which are a real venue's card stock: parsed for format, never published. A
  deterministic synthetic `.mag` is written instead, to `samples/makint/vectors/`, so the format
  has an in-repo fixture that carries nobody's data.

## :CueCat and the Iomega Clik!

**The :CueCat** (Digital:Convergence, RadioShack cat. 68-1965, PS/2 keyboard wedge) has no
disassemblable artifact in any pinnable archive — its firmware is masked into a Hyundai
microcontroller, with a 93Cxx EEPROM holding the serial number. So the disassembly here is of the
*encoding*, which is pure algorithm and therefore testable. The rebuild: map each character into
the custom alphabet `abc…xyzABC…Z0-9+-`, regroup 6-bit values into bytes the way base64 does, then
per byte `(v ^ 3) + 64` with Gage's final step — *"if larger than 128 then subtract 128"*, a fold
into 7-bit ASCII, **not** a `& 0xff`. That fold is the reason a stock cat appears to type digits,
and it is the step the casual ports get wrong. Four independently published scan strings decode
exactly, including `ENr7C3n1C3PWD3rYCxzYChnZ` → `978006093471251300` (whose Bookland prefix yields
ISBN `0060934719`, as the 2006 write-up reported) and `fbmxChO` → `WPT39`. The hardware mod
floating pin 10 of the CPU is documented as the reason two output modes exist, not as a how-to.

**The Iomega Clik!** (1999; 40 MB 1.8″ cartridge, PC Card Type II / parallel cradle / USB bridge,
renamed PocketZip in 2002, 38 ms seek, 150–600 KB/s) is a case of "disassemble the *which*": three
host attachments are three different bodies of work. The PC Card is ATAPI in a PCMCIA envelope — the
one Linux drove from the IDE/floppy path, matching `strcmp(drive->id->model, "IOMEGA Clik! 40 CZ
ATAPI")` until Iomega changed what the drive reported, fixed by comparing the first 11 characters
instead — with the Iomega habit of keeping data in the **fourth** partition. No controller firmware
dump is pinnable and none is claimed. What is reproduced in `js/makint.js` is the part that can be
verified: the ATA IDENTIFY model field with its per-word byte swap, and an MBR reader that returns
the fourth record's LBA and sector count (78 125 × 512 = exactly 40 000 000 bytes).

## Verification

- `node tools/verify_casefiles.mjs` — **ALL CHECKS PASSED, 82 checks** (was 66). New: 22-row
  MAKInterface depot with ts/digest/length each, the five wave-7 pins held, 13 archives in the
  sweep, the PRSC/SCPROG rename caught in the pin text, the port verdict quoted, reader-vs-emulator
  rows transcribed line by line, the 00529 chip recipes, the disassembly verdict, `:CueCat`/Clik!
  limits, live calls into `js/makint.js` (ATR build→parse, ETU, reset-cycle framing, CueCat
  vectors), the `makint` case entry + panel + bench + dossier + sweep ids, and analysis.json.
- `node tests/13-makint.mjs` — **72 assertions**, including that the JS model and the Python tool
  agree on the crystal arithmetic to 0.01 µs and that the `.mag` corpus facts in `analysis.json`
  still say 144/144.
- `bash tests/run.sh` — every suite green **except** a pre-existing `tools/build_coins.mjs
  --check` failure (`coins-top500.json is STALE`), which reproduces identically at HEAD without
  this wave's files. It is a pinned data file regenerated from a market snapshot, unrelated to this
  work, and regenerating it was left to whoever owns that snapshot rather than smuggled into a
  hardware-research commit.
- Fixed on the way: `tests/run.sh`'s `run_stale` was invoked as `run_stale node tests/05…`, so it
  executed `node node tests/05…` and died with MODULE_NOT_FOUND — the two "known-stale" suites
  never ran at all, and their advertised failures were never printed. Now they run and skip
  cleanly on this box (no jsdom, no chromium).
- `node tools/smoke_pipeline.mjs` — pipeline clean; `node tools/check-dom-ids.mjs` — all
  controller ids exist; `node tools/verify_disasm.mjs` — 364/364 instructions agree with objdump.
- `sw.js` precache → **v24**, adding `js/makint.js` and `samples/makint/analysis.json`.
- The five Dec-2005 digests and the eight new ones above were read from the live CDX index in this
  session; the pages quoted were read from the captures named beside them.
