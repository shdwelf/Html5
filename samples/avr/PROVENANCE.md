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

Only the compiled Intel HEX images are vendored; the corresponding sources are
**not** copied into this repository (they are GPL-2.0-or-later, so the binary is
redistributed with its license intact — fetch the tagged archive above for the
source). They are used for analysis and as decompiler input.

## What the analysis establishes

`node tools/ghidra_avr.mjs samples/avr/optiboot_atmega328.hex` parses the image
for real — checksums, record types, load address — and locates the instructions a
boot-chain review looks for:

```
image     : 512 bytes (256 words) at 0x7e00..0x7fff, 33 records
security-relevant opcodes (8):
  wdr         2 × 0x7e60 0x7f8a
  spm         6 × 0x7ef8 0x7f0e 0x7f1c 0x7f26 0x7fc2 0x7fd8
```

```
$ node tools/ghidra_avr.mjs samples/avr/micronucleus_m328p_extclock.hex
image     : 1498 bytes (749 words) at 0x7a00..0x7fd9, 96 records
security-relevant opcodes (7):
  spm         5 × 0x7cbe 0x7d5a 0x7d84 0x7ebe 0x7ee0
  wdr         2 × 0x7cd0 0x7d44
```

That is what an AVR bootloader should look like. Optiboot occupies exactly the
last 512 bytes of the 32 KB flash (the `BOOTSZ` region at 0x7E00) with six `SPM`
sites — page erase, page fill and page write for self-programming, which is the
capability a boot vector lock exists to gate — and two `WDR` sites, the strict
watchdog discipline a bootloader needs so it cannot hang waiting for a host that
never finishes an upload. Micronucleus is the same story at a different scale:
1498 bytes from 0x7A00, five `SPM` sites, two `WDR` sites. Two independent
implementations agreeing on the shape is the point: this is the structure to look
for in the vendor firmware once it can be retrieved.

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
