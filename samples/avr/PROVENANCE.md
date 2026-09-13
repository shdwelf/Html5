# AVR firmware samples — what they are and exactly where they came from

The vendor firmware this project set out to read (MAKInterface / MAKInterface Pro,
makinterface.de) could not be retrieved: the host refuses connections from this
environment and every mirror reachable through the public archives is blocked or
gone. That is recorded rather than papered over — see the "External sources"
section of `docs/VCHIP.md` and the probe in `tools/ghidra_avr.mjs --probe`.

What is here instead: two **real, unmodified, commit-pinned Atmel AVR bootloaders**
of exactly the class a MAKInterface-class device would run. A bootloader is the
right stand-in because it is the code that *decides whether to accept new
firmware* — the same decision the vector lock in `rtl/` gates on the host side.
Both images write their own flash with `SPM`, which is the operation the chipset
policy refuses once the measurement chain is broken.

| file | board | what it is |
| --- | --- | --- |
| `optiboot_atmega328.hex` | ATmega328P | Optiboot 8.0, the 512-byte serial (STK500) bootloader that ships on Arduino-class boards |
| `micronucleus_m328p_extclock.hex` | ATmega328P | Micronucleus v2.6, a USB/HID bootloader using the V-USB software stack |
| `optiboot_atmega328.lst` | ATmega328P | the disassembly **upstream ships with that same release** (`optiboot_atmega328.lst`, produced by the vendor's own `avr-objdump`) — used here as an independent implementation to check the decoder in `js/avrdis.js` against |

## Provenance

Both files were downloaded from the upstream repositories over
`codeload.github.com` at the **commit SHA of a release tag**, extracted without
modification, and are byte-for-byte what upstream publishes. Nothing was edited,
re-linked or re-compiled here.

| | Optiboot | Micronucleus |
| --- | --- | --- |
| repository | `Optiboot/optiboot` | `micronucleus/micronucleus` |
| tag | `v8.0` | `v2.6` |
| commit | `f3308fc40dc386a5f655f129ff12c68e7ceb89d6` | `882e7b4af38cb2795353e4e99336616963c6cd12` |
| archive URL | `https://codeload.github.com/Optiboot/optiboot/tar.gz/f3308fc40dc386a5f655f129ff12c68e7ceb89d6` | `https://codeload.github.com/micronucleus/micronucleus/tar.gz/882e7b4af38cb2795353e4e99336616963c6cd12` |
| path in archive | `optiboot/bootloaders/optiboot/optiboot_atmega328.hex` | `firmware/releases/m328p_extclock.hex` |
| license | GPL-2.0-or-later | GPL-2.0-or-later |
| sha256 (this file) | `0d9097a14032b1a882ac660add5d4092ad43e897903309a52d94f9949edf8877` | `e022981e8387c542a267ca413ecae8b08d8cb0fa11370e49df675038302f4641` |
| listing | `optiboot_atmega328.lst` from the same archive, 225 instructions, sha256 `43f4b02038115a340cd053bf…` | — (none shipped) |

Only the compiled Intel HEX images are vendored; the corresponding sources are
**not** copied into this repository (they are GPL-2.0-or-later, so the binary is
redistributed with its license intact — fetch the tagged archive above for the
source). They are used for analysis and as decompiler input.

## What the analysis establishes

`js/avrdis.js` is a complete classic-AVR instruction decoder (every encoding in
the AVR instruction set manual, `tools/ghidra_avr.mjs` included) — and it is not
trusted on its own word. `tools/verify_avrdis.mjs` decodes the vendored
`optiboot_atmega328.hex` and compares instruction-for-instruction against the
listing upstream built with `avr-objdump`:

```
$ node tools/verify_avrdis.mjs
instructions : 225 (from 35 distinct mnemonics)
decoder      : 225/225 agree with avr-objdump
targets      : 78/78 branch/call targets match avr-objdump's own resolution
walk         : 208 of 243 instructions reachable, 50 entry point(s), 4/6 SPM sites reachable
  [ok ] the reset vector resolves to the `main` symbol
  [ok ] the do_spm routine's SPM sites (2) are dead code in this build
  [ok ] every wdr site (2) is reachable
  [ok ] every lpm site (1) is reachable
walk (2nd)   : micronucleus at 0x7a00: 619 of 681 instructions reachable, 5 SPM / 3 LPM / 2 WDR sites
  [ok ] micronucleus: every SPM site is reachable
```

Two things there are worth more than they look. **Branch targets** are checked
against the addresses `avr-objdump` resolves and prints itself (`; 0x7f92
<watchdogConfig>`): 78 of them, including backward branches and the two-word
`jmp`/`call` forms. And the **symbol table** in the same listing names the
function every address belongs to, so the walk's output can be *named* rather
than merely counted.

With the decoder checked, `tools/ghidra_avr.mjs` walks the image instead of
pattern-matching it. The walk follows `rjmp`/`jmp`, enters `rcall`/`call`
targets, takes both sides of conditionals, and takes both sides of the skip
instructions (`sbrs`/`sbrc`/`cpse`/`sbic`/`sbis`) — missing the skip side alone
made most of Optiboot's main loop look unreachable. What it is for is answering
the question a boot-chain review actually has: **which of these flash-write sites
can a redirect reach?**

```
$ node tools/ghidra_avr.mjs samples/avr/optiboot_atmega328.hex
language  : avr8:LE:16:default / gcc (space "code", loaded at word 0x3f00)
reset     : rjmp → 0x7e04
walk      : 208 of 243 instructions reachable from the reset vector / interrupt vectors
security-relevant opcodes (9), decoded not pattern-matched:
  wdr         2 × 0x7e60 <main+0x5c> 0x7f8a <getch+0x10>  all reachable
  spm         6 × 0x7ef8 <main+0xf4> 0x7f0e <main+0x10a> 0x7f1c <main+0x118> 0x7f26 <main+0x122>
                 0x7fc2 <do_spm+0x6> [dead] 0x7fd8 <do_spm+0x1c> [dead]  (4/6 reachable)
  lpm         1 × 0x7f3c <main+0x138>  all reachable
```

That `[dead]` is a real result, not a decoration. Optiboot's `do_spm` is marked
`__attribute__((used))`, so it is still linked into the image and still contains
a working `SPM` sequence — but nothing in this build calls it, and the walk proves
it from the image alone: those two sites are not reachable from the reset vector
or from either side of any conditional. A latent flash-write primitive occupying
the last 32 bytes of the boot region is exactly what a vector lock should be
measuring against, and the tool reports it rather than summing "6 SPM sites" and
moving on. (Micronucleus, by contrast, has all ten of its self-programming sites
live — the check asserts that too, so the walk is not simply called "working"
because it says something interesting about one firmware.)

The rest is what an AVR bootloader should look like: Optiboot occupies exactly
the last 512 bytes of the 32 KB flash (the `BOOTSZ` region at 0x7E00) with the
page erase / page fill / page write sequence for self-programming — the
capability a boot vector lock exists to gate — and two `WDR` sites, the strict
watchdog discipline a bootloader needs so it cannot hang waiting for a host that
never finishes an upload. Micronucleus is the same story at a different scale:
1498 bytes from 0x7A00, five `SPM` sites, two `WDR` sites, all reachable. Two
independent implementations agreeing on the shape is the point: this is the
structure to look for in the vendor firmware once it can be retrieved.

## The decompiler limitation, stated plainly

`tools/ghidra_avr.mjs` can load the AVR SLEIGH specs (they are vendored under
`wasm/ghidra/Processors/Atmel/`, staged by `tools/stage_ghidra_specs.py`) but the
vendored **Ghidra-wasm bridge cannot decompile this firmware**, and the reason is
in the bridge's own C++ rather than in the image:

* `avr8.sinc` declares the program space as `space code ... wordsize=2 default`
  — it is *word* addressed. Data spaces (`mem`, `codebyte`) are separate because
  the AVR core is Harvard;
* `LoadImageXml::open()` files the `<bytechunk>` bytes under the space named in
  the XML, and instruction fetch reads the `code` space through
  `LoadImageXml::loadFill()`, which throws `DataUnavailError` — surfaced as
  `Lowlevel Error: Bytes at 0x… are not mapped` — when that space holds nothing;
* loading into `code` therefore never maps, and loading into `mem`/`codebyte`
  leaves instruction fetch empty. Loading the same bytes into several spaces at
  once — the error text names only an offset, never a space, so the failing read
  could have been a byte read in one space while op fetch happens in another —
  was tried as well (word address, byte address, and both). `--probe` runs every
  combination and reports the score:

```
$ node tools/ghidra_avr.mjs samples/avr/optiboot_atmega328.hex --probe
AVR space probe: 0/42 combinations decompiled
last error: Lowlevel Error: Bytes at 0x7e00 are not mapped
```

Decompiling AVR properly needs either a bridge that can map a word-addressed
Harvard code space, or a JVM for real Ghidra headless (there is no `java` in this
environment). Until then this tool says so instead of printing plausible-looking
wrong C — the x86 side of the same decompiler is unaffected and still verified by
`tools/verify_ghidra.mjs` (21/21 functions).
