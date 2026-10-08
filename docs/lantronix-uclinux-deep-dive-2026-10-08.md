# Deep dive: Lantronix, µClinux, and the wallplug that carries one

*A research note for the [Lantronix Lab](../lantronix-lab.html) — the device families, the µClinux stack they
run, how to match an unknown firmware blob to its processor and kernel in Ghidra, what DistroWatch can and
cannot tell you about alternatives, the Java/JVM/Java Card side of the same device class, and a generated EAGLE
design for a mains-powered RS-232 ↔ RJ45 wallplug around a 16 MB xPort Pro.*

Everything below is sourced in [§10](#10-sources). Where a fact could not be confirmed from a primary document,
it is labelled as a third-party claim or left out.

---

## 0. Why this file exists

The request bundled six threads that turn out to be one thread:

1. **Lantronix + µClinux** — the vendor's own Linux is a µClinux distribution, and the part numbers matter
   because two different processors hide behind the same RJ45.
2. **DistroWatch for alternatives** — the natural follow-up question ("what else runs on it?") has a trap in it.
3. **Ghidra for processor/kernel matching** — the actual reverse-engineering task: blob → ISA → kernel.
4. **JavaCardOS / Java bytecode / JVM** — the other virtual machine that shows up on this class of device, and
   the reason "Java applets" appears in a Lantronix datasheet.
5. **"wiki.in.a.jar"** — a Java web app that carries its own HTTP server in one jar; checked against the bytes.
6. **ACME web server** — Jef Poskanzer's family of tiny HTTP servers, and what the device actually runs instead.
7. **EAGLE CAD for a wallplug** — a real, generated, verified EAGLE design: mains in, RS-232 out, RJ45 through
   the module.

Deliverables in this commit:

| Path | What |
| --- | --- |
| [`lantronix-lab.html`](../lantronix-lab.html) | six-panel client-side console: device matrix, firmware triage, µClinux/alternatives, Java/JCVM, EDA viewer, sources |
| [`js/lantronix-lab.js`](../js/lantronix-lab.js) | its controller, including the triage engine and the SVG EDA renderer |
| [`js/jvmdis.js`](../js/jvmdis.js) | class-file / Java Card CAP reader + JVM bytecode disassembler (no dependencies) |
| [`tools/wallplug-model.mjs`](../tools/wallplug-model.mjs) | the single source of truth for the hardware design |
| [`tools/wallplug-drc.mjs`](../tools/wallplug-drc.mjs) | the design-rule checks, pure — used by node and by the browser |
| [`tools/build-wallplug-eagle.mjs`](../tools/build-wallplug-eagle.mjs) | generates `*.lbr/.sch/.brd` + BOM, and `--check` verifies them |
| [`hardware/lantronix-wallplug/`](../hardware/lantronix-wallplug/) | the generated EAGLE files and `BOM.md` |
| [`tests/20-wallplug.mjs`](../tests/20-wallplug.mjs), [`tests/21-jvmdis.mjs`](../tests/21-jvmdis.mjs), [`tests/22-lantronix-lab.mjs`](../tests/22-lantronix-lab.mjs) | 390 assertions |

---

## 1. The device: which Lantronix part is "the 16 MB RS-232 → RJ45 one"?

The **xPort Pro** is the thumb-sized module (33.9 × 16.25 × 13.5 mm, 9.6 g) with an integrated RJ45, magnetics,
LEDs, reset circuit and a +1.5 V core regulator on board. It needs one external 3.3 V supply and exposes an
8-pin 3.3 V CMOS serial interface. Two facts pin down the "16 MB" part of the question:

* **16 MB of flash is standard on every xPort Pro**; SDRAM is 8 or 16 MB depending on the part number.
* The part numbers split by operating system, and **only the Linux ones are µClinux**:

| Part number | SDRAM | OS |
| --- | --- | --- |
| XPP1002000-02R / XPP100200S-02R | 16 MB | Evolution OS |
| XPP1003000-04R / XPP100300S-04R | 16 MB | **Linux (µClinux)** |
| XPP1004000-02R / XPP100400S-02R (Lx6) | 16 MB | **Linux (µClinux) + IPv6** |
| XPP1002000-01R / XPP1003000-01R | 8 MB | Evolution / Linux |

Lantronix's own 2017 product-change notice calls the Linux line **"XPort Pro (uClinux)"** — the vendor uses the
name, so this write-up does too.

The pinout (Integration Guide 900-557 rev K, Table 2-2) is what the wallplug design is built around:

| Pin | Signal | Notes |
| ---: | --- | --- |
| 1 | GND | circuit ground |
| 2 | +3.3 V | 3.15–3.46 V, ≤ 2 % ripple; 200 mA typ / 270 mA max at 100Base-TX on Linux |
| 3 | Reset | external reset in; internal 140 ms power-up reset, power-drop reset at 2.95 V |
| 4 | Data Out | UART TX; **"will float during and immediately after power up or assertion of RESET"** — the guide itself suggests a ≥ 10 kΩ pull-up |
| 5 | Data In | UART RX |
| 6 | CP1 / RTS | flow control, PIO, or RS-485 transmit enable |
| 7 | CP2 / DTR | modem control or PIO (100 kΩ internal pull-up) |
| 8 | CP3 / CTS / DCD | flow control, modem control or PIO (100 kΩ internal pull-up) |

Serial runs 300 bps – 921600 bps (**460800 is explicitly unsupported**), 7/8 data bits, 1/2 stop bits,
odd/even/none. The signals are 3.3 V CMOS and **not 5 V tolerant**, so an RS-232 front end needs a transceiver —
the guide says so outright and points at the RS-232 transceiver Lantronix puts on its own demo board.

The box-level siblings of the same design are the **EDS1100** (one port) and **EDS2100** (two ports): a
100–240 VAC internal supply, RJ45, RS-232, and a choice of Evolution OS or Linux. That is, functionally, the
wallplug in §9 — which is why the wallplug is drawn the way it is (DTE by default, like the EDS2100's DB9M).

### The trap: two processors, one RJ45

| Family | Processor | OS | Ghidra language |
| --- | --- | --- | --- |
| xPort Pro, xPort Pro Lx6, MatchPort AR, EDS1100/2100 (Linux) | **DSTni-FX** — Freescale 32-bit **ColdFire**, 166 MHz | Evolution OS **or** µClinux | `68000:BE:32:Coldfire` |
| xPort (classic), xPort-485, xPico | **DSTni-EX "186"** — x86-class **16-bit** | Evolution OS only | `x86:LE:16:Real Mode` |

Same footprint, same 8-pin header, same RJ45 — different instruction set. The xPico product page states its
architecture outright ("Based on the DSTni-EX Enhanced 16-bit x86 Architecture"), and the xPort data sheet gives
256 KB SRAM / 512 KB flash / 16 KB boot ROM. Lantronix never names the ColdFire part number in the xPort Pro
documentation ("32-bit Freescale ColdFire"); CNX Software's teardown-level write-up identifies it as
**MCF5208-class at up to 166.67 MHz (their own "TBC")**, which is consistent with the DSTni-FX clock figures
MatchPort AR's brief publishes (166 MHz, 159 MIPS Dhrystone 2.1) and with the SDK's
`freescale-coldfire-*` toolchain and `qemu_m68k_mcf5208`-class silicon.

Note also that "MatchPort **AR**" is *not* an ARM part: its product brief names the same DSTni-FX.

---

## 2. µClinux: what it is, and what Lantronix's copy contains

µClinux ("MicroController Linux", pronounced *you-see-Linux*) is Linux configured for processors **without an
MMU**: `CONFIG_MMU=n`, a flat address space, no `fork()` (only `vfork()`), FLAT or ELF-nommu binaries, and a
C library small enough to matter (uClibc). It began in 1998 with D. Jeff Dionne and Kenneth Albanowski porting
2.0.33 to Motorola's DragonBall 68EZ328 (the PalmPilot's CPU); Greg Ungerer added ColdFire in 1999 and shipped
the first µClinux-dist; the no-MMU work merged into mainline at **2.5.46 (November 2002)**, so from then on
"µClinux" names a configuration and a distribution rather than a fork. The last µClinux-dist release was
**September 2016**, and uclinux.org is offline.

Lantronix's Linux SDK (user guide 900-548, covering MatchPort AR, xPort Pro and EDS1100/2100) is a snapshot of
exactly that world:

| Layer | What ships | Evidence |
| --- | --- | --- |
| Boot stage 1 | Lantronix boot loader, present on Evolution and Linux products, **marked read-only** so it cannot be overwritten accidentally | serial-recovery transcript names `RecovLoader_MatchPort.rom` |
| Boot stage 2 | **dBUG** — Freescale ROM monitor, Lantronix-customised | `dnfl/dn/fl/gfl/go/set/show/reset`; options `autoboot`, `bootbank single|1|2`, `safebank`, `maxbootfc`, `kcl`, `romfs_flash`; 128-byte dBUG image header; UDP console via `netcon` |
| Kernel | **Linux 2.6.30**, "custom µClinux distribution" (MatchPort AR dev kit: 2.6.26 + uClibc 0.9.29 from uClinux-dist 20080808) | SDK §1 hardware/software table |
| C library | **uClibc**, in-tree at `linux/uClibc` | installed-directory listing |
| Root filesystem | **ROMFS** (default, read-only, XIP-able via `romfs_flash on`) + optional **JFFS2** writable partition; cramfs/squashfs explicitly unsupported "since they are not part of the standard Linux kernel as of version 2.6.30" | pre-built `romfs.img` / `rootfs.img`; erase commands `fl e 0x00400000 0x00C00000` (xPort Pro) |
| Flash map | 16 MB parallel flash (xPort Pro) / 8 MB (MatchPort AR, EDS1100/2100); dual-bank upgrade with a safe bank; kernel partition 0x180000 on xPort Pro, 0x1C0000 on MatchPort AR; `/dev/mtd4` 3.5 MB, `/dev/mtd5` 4 MB | SDK §5, and `dbug-config` output showing `bootbank`/`safebank` |
| Userland | BusyBox 1.13.3, inetd/telnetd/ftpd, **dropbear 0.52**, **boa 0.94.14rc21** + **axTLS 1.2.4** (axhttpd), mDNSResponder-214.3 / avahi 0.6.25, mii-tool, tcpdump 3.9.8 + libpcap, iperf 2.0.4, openssl 0.9.8k, libgcrypt, libssh, **mbus** (Modbus TCP↔RTU) | SDK §2 CD file table |
| Vendor apps | `s2e` (serial-to-Ethernet), `s2e-ssh`, `s2e-ssl`, `s2e-gpio`, `cpm` (configurable-pin manager), `dbug-config`, `netcon`, VIP Access | SDK §10–§11 |
| Toolchain | CodeSourcery `freescale-coldfire-*`, `env_m68k-uclinux`, uClinux-dist-20090618 + a Lantronix patch collection | SDK §2 CD file table |
| Build profiles | `LTRX_PROFILE_DEFAULT / _DEVELOP / _NO_IPV6 / _COMPACT / _AUFS / _SHARED` | SDK §6 |

Practical consequences for a reverse engineer:

* The **kernel command line** is stored in dBUG (`kcl`), e.g. `noinitrd rootfstype=jffs2 root=/dev/mtdblock5` —
  reading it tells you the root filesystem before you unpack anything.
* `mptpart` overrides the kernel's hard-coded flash partitioning, so partition offsets in a given image may not
  match the SDK's default map.
* `bootfc`/`maxbootfc` is a boot-failure counter: after N failed boots dBUG stops trying and waits at the prompt.
  On a bench device that looks like "the firmware is dead"; it is usually not.
* Firmware can be pushed **to** the device (its own TFTP server, `set tftpsvr on`) and pulled by DeviceInstaller,
  FTP, the web manager or serial recovery — so getting bytes usually does not require desoldering flash.

---

## 3. DistroWatch, and the trap in "alternatives"

DistroWatch is the right instrument for one half of this repository's work: catalogue-shaped questions about
installable images — provenance, default credentials, published checksums, kernel version. That is what
[`distro-dossier.html`](../distro-dossier.html) and the Buscador/Kodachi deep dives do, and DistroWatch's search
even exposes an "OS Type: Embedded" filter plus per-distribution *Architecture* and *kernel* columns — exactly
the shape of question "which distribution, which kernel, which CPU?".

It just has no answers for this silicon. Nothing DistroWatch tracks ships an m68k/ColdFire no-MMU image:
m68k is not a release architecture for Debian (it survives as a community port), and the small-distribution
end of the catalogue (Alpine, Tiny Core, DietPi, DSL, SliTaz, Puppy) publishes x86/ARM builds. Asking
DistroWatch what else runs on a 16 MB-flash MMU-less ColdFire is asking a catalogue of PC distributions a
microcontroller question.

The honest alternatives list is **build systems and kernels**, not distributions:

| Candidate | Kernel | m68k/ColdFire nommu? | Verdict |
| --- | --- | --- | --- |
| Lantronix Linux SDK (µClinux-dist 20090618 + patches) | 2.6.30 | yes — native | The reference. Cost: a 2009 host stack (the guide validates Fedora 9–12 and Ubuntu 8.04–10.04) and a CodeSourcery toolchain that no longer ships |
| Mainline Linux, `arch/m68k` with `CONFIG_MMU=n` | 6.x | yes — maintained upstream | The modern target. You rebuild the board (SDRAM at 0x40000000, 16 MB MTD map, UART, FEC) and rewrite the vendor apps against the SDK's own `s2e`/`cpm` sources |
| **Buildroot** | your choice | yes — the tree ships `configs/qemu_m68k_mcf5208_defconfig` and `arch/Config.in.m68k` | The fastest reproducible replacement, and the defconfig is literally this silicon class. Bootlin publishes `m68k-uclinux` toolchains, so the SDK's habit survives |
| Yocto / OpenEmbedded | current | partial | m68k layers exist; MCF5208-class BSPs are historical. Worth it only if you already run Yocto |
| OpenWrt | current | no — ARM/MIPS/x86/aarch64 | Not a port target, but the best *feature* reference for a serial-to-Ethernet box (dropbear, uhttpd, dual-image sysupgrade — the same idea as dBUG's `bootbank`/`safebank`) |
| RTEMS 6 | n/a (RTOS) | yes — 20 m68k BSPs: `av5282`, `csb360`, `gen68340`, `gen68360`, `genmcf548x`, `mcf5206elite`, `mcf52235`, `mcf5225x`, `mcf5235`, `mcf5329` | The answer if you want determinism and a maintained ColdFire BSP instead of MMU-less Linux. You keep TCP/IP and lose the Linux userland |
| FreeRTOS / Zephyr | n/a (RTOS) | ColdFire ports are historical (FreeRTOS MCF52259 demo) / absent (Zephyr) | Only realistic with a hardware re-spin onto Cortex-M — a new product, not this one |
| SnapGear / Arcturus / Lineo-era µClinux distributions | 2.0–2.6 | yes | Dead as products, valuable as documentation: SnapGear's David McCullough and Greg Ungerer are the names behind the 2.5.46 nommu merge |

---

## 4. Matching a blob to a processor and a kernel

This is the part the lab's **GHIDRA MATCH** tab implements; the order below is the order it runs in.

### 4.1 Containers first

| Magic | Meaning | Move |
| --- | --- | --- |
| `27 05 19 56` | U-Boot legacy **uImage** | Read offset 28 (OS: 5 = Linux), **offset 29 (`IH_ARCH`: 2 ARM, 3 I386, 5 MIPS, 7 PPC, 12 M68K)**, offsets 16/20 (load/entry), 12 (data size), 32–63 (name). Strip 64 bytes, load the payload at `load` |
| `7F 45 4C 46` | ELF | `e_machine` at +18: 3 = EM_386, **4 = EM_M68K (68k *and* ColdFire)**, 8 = EM_MIPS, 40 = EM_ARM, 62 = EM_X86_64 |
| `1F 8B 08` | gzip | The SDK's `imagez.bin` / `linuz.bin` are gzip'd kernel(+romfs): inflate, then triage again |
| `2D 72 6F 6D 31 66 73 2D` | `-rom1fs-` | ROMFS superblock: magic(8), size(4), checksum(4), **volume name at +16**. µClinux's default root |
| `85 19` (LE) / `19 85` (BE) | JFFS2 node | The writable partition (`rootfs.img`, `/dev/mtdblock5`) |
| `45 3D CD 28` / `28 CD 3D 45` | CRAMFS | Not in this SDK — a third-party rebuild |
| `68 73 71 73` (`hsqs`) | SquashFS | Modern Buildroot/Yocto rebuild |
| `53 EF` at 1080 | ext2/3/4 | Block device, not 16 MB of parallel flash |
| `55 AA` at 510 | MBR/boot sector | x86 real mode → DSTni-EX territory |
| `CA FE BA BE` | Java class (or Mach-O FAT) | See §5 |
| `DE CA FF ED` | Java Card **CAP** | Component archive, not an instruction stream |

### 4.2 Strings are the cheapest kernel match

`strings image.bin | grep 'Linux version'` yields version, compiler and build date in one line, and
`scripts/extract-ikconfig` pulls the built-in `.config` when `CONFIG_IKCONFIG` was set — that is the definitive
kernel↔CPU match, because it lists `CONFIG_COLDFIRE`, `CONFIG_MMU=n` and the `CONFIG_MTD_*` map directly.
Around it, the vendor strings name the product: `dBUG`, `Lantronix`, `Evolution` (⇒ *not* Linux), `uClinux`,
`BusyBox v1.13.3`, `uClibc`, `axhttpd`, `boa`, `dropbear`, `mtdpart`, `rootfstype=`.

### 4.3 Raw images: the vector table

A raw m68k/ColdFire image begins with its exception vector table: the first big-endian word is the initial SSP,
the second the reset PC. On MCF5208-class parts SDRAM starts at **0x40000000** — the SDK's own dBUG transcript
shows a download to `Address: 0x4001FF80`. Two words in that range at offset 0 is strong evidence for
big-endian m68k/ColdFire before a single instruction is decoded.

### 4.4 Ghidra languages (quoted from Ghidra's own `.ldefs`)

| Blob | Language id | Notes |
| --- | --- | --- |
| ColdFire firmware (xPort Pro / MatchPort AR / EDS Linux) | `68000:BE:32:Coldfire` | `Ghidra/Processors/68000/data/languages/coldfire.slaspec`; IDA external name `colfire`; big-endian, 32-bit |
| 68020/68030/68040/CPU32 images | `68000:BE:32:MC68020` · `MC68030` · `default` (68040) · `CPU32` | Same module, four more slaspecs — pick the variant or the decompiler accepts illegal encodings |
| DSTni-EX firmware (xPort / xPico / xPort-485) | `x86:LE:16:Real Mode` | The language this repository's [Ghidra Lab](../ghidra-lab.html) already loads for DOS boot-sector viruses |
| ELF userland from the µClinux rootfs | ELF loader → `68000:BE:32:Coldfire` | `e_machine = 4`; uClibc-linked; nommu means no shared mmap of text |
| Java class files | `JVM:BE:32:default` ("Generic JVM") | `Ghidra/Processors/JVM` plus the `ghidra.javaclass` package (`ClassFileJava.java`) — Ghidra reads `.class` natively |
| Android DEX | `Dalvik:…` per Android release | Adjacent, for completeness |

### 4.5 Confirming the ISA after import

A wrong language still "disassembles"; the nonsense is the tell. ColdFire prologues are `lea (-N,%sp),%sp` /
`movem.l`; x86 real mode is `push bp; mov bp,sp`; ARM is `push {lr}`. Check the first function after the vector
table, then check that branch targets land inside the loaded image.

---

## 5. Java, JVM, Java Card — and why a device server cares

### 5.1 The link from the datasheet

The xPort Pro Integration Guide describes the module's internal web server as serving **"static web pages and
Java applets"**, with **1 MB of storage**. That is the whole reason Java shows up in a serial-to-Ethernet
datasheet: the device is a small HTTP server with an applet-delivery budget, and a 1 MB web-content partition is
exactly the design point ACME Labs' servers were written for.

### 5.2 JVM vs Java Card VM

| | JVM (class file) | JCVM (Java Card) |
| --- | --- | --- |
| Container | `.class` (`CAFEBABE`) inside a `.jar` (ZIP) | `.cap` (`DECAFFED`): a component archive the off-card **converter** builds from the same `.class` files |
| Instruction set | 202 opcodes — the whole `0x00–0xC9` space is assigned, plus `breakpoint`, `impdep1/2` | A subset: no `long`/`float`/`double` arithmetic, a reduced `ldc` family, short/token operand encodings |
| Types | all primitives + references | byte, short, int, boolean + object references (classic JCVM has no 64-bit or FP types) |
| Strings | `java.lang.String`, interned, modified-UTF-8 in the pool | No `String` in classic Java Card — text is `byte[]`. This is why [`samples/javacard/`](../samples/javacard/) never mentions String |
| Memory | heap + generational GC | tiny persistent heap, transient object deletion, transaction-backed commits via `JCSystem` |
| Concurrency | many threads, monitors | one selected applet at a time; `monitorenter`/`monitorexit` are meaningless on a card |
| Isolation | class loaders, security manager | applet firewalls, AID-based selection, sharing only through `Shareable` |
| Entry point | `public static void main(String[])` | `install()` / `select()` / `process(APDU)`, driven by ISO 7816-4 command APDUs |
| Toolchain | `javac` → `java` | `javac` → `converter` → `.cap` → GlobalPlatform install; the **JavaCardOS** community (javacardos.com, registered 2014) ships JCIDE and pyApduTool for exactly this loop, and its quick-start guide points you at six specs first: Java Card API, JCVM, JCRE, ISO 7816-3/-4, ISO 14443-3/-4, GlobalPlatform |
| Ghidra | `JVM:BE:32:default` | same language for the pre-conversion `.class`; a `.cap` has no loader — parse its components |

`js/jvmdis.js` implements the reader side of that table: `CAFEBABE` → constant pool (all 20 tag types, with
long/double consuming two slots) → fields/methods → `Code` attributes → disassembly with the full 202-opcode
table (including `tableswitch`/`lookupswitch` alignment padding, `wide`, `invokeinterface`/`invokedynamic`
skipped bytes, and `newarray` atype names), plus `DECAFFED` → CAP component list. `tests/21-jvmdis.mjs` builds a
class file **byte by byte from the JVMS layout** and asserts the parse, so the fixture is an independent
construction rather than the parser's own output; it also audits the opcode table for full `0x00–0xC9` coverage.

### 5.3 "wiki.in.a.jar" — checked against the bytes

* **What it is:** "Wiki in a Jar" (SourceForge `wiki-in-a-jar`), author `rico_g`, GPLv2, Java, web UI; latest
  release `WikiInAJar-0.8-20081128-bin.zip` (123.4 kB). Pitch: a wiki small enough to run from a USB stick,
  replacing a paper notebook and address book — MediaWiki-syntax subset, tag trees, vCards, calendar events,
  served at `http://localhost:3003/wiki`, with **no access control at all**.
* **What the bytes say:** the GitHub mirror `astecenko/Wiki-in-a-Jar` carries `trunk/` and
  `tags/release-0.6.1/`. `src/org/rgse/wikiinajar/server/Server.java` registers eight controllers (Wiki, Vcard,
  Tag, Find, Index, Admin, Calendar, Tab), checks that the docroot exists, and defaults the port to **3003** —
  matching the reviews. `build.xml` builds a dist jar with `dist.version = 0.8`.
* **The embedded server is not Acme.Serve:** `lib/xrays.jar` (26,107 bytes) unzips to
  `net.sf.wikiinajar.xrays.NanoHTTPD`, `NanoHTTPD$HTTPSession`, `NanoHTTPD$Response`, `HttpServer`,
  `ActionMapping`, `PublicController`, `Request`, `View`, `Xml` — a **NanoHTTPD**-derived single-file Java HTTP
  server relocated into the project's package, with an MVC layer on top and XSL skins
  (`master.xsl`, `root.xsl`, per-view `.xml`) doing the rendering.
* **Why it belongs here:** one jar, its own HTTP server, no container, no database server. That is the same
  trick a µClinux device pulls with boa/axhttpd, and the same trick Acme.Serve was written for.

### 5.4 ACME's web servers

"ACME web server" is Jef Poskanzer's **ACME Labs** family — the same ACME whose classic Unix utilities this
repository already rebuilt in [`apps/acme_suite_quine.html`](../apps/acme_suite_quine.html):

| Server | Language / size | Where it turns up |
| --- | --- | --- |
| **thttpd** | C, single process, throttling + CGI | The classic tiny HTTP server for embedded boxes. Acme.Serve's own javadoc: *"This is actually the second HTTP server I've written. The other one is called thttpd, it's written in C, and is also pretty small although much more featureful than this."* |
| **micro_httpd / mini_httpd** | C, inetd-sized / IPv6-capable | Same author, same design point |
| **js_httpd** | server-side JavaScript from inetd | The curiosity entry — written before Node existed |
| **Acme.Serve** | Java, *"about 1500 lines"*, implements the Servlet API | *"provides only the functionality necessary to deliver an Applet's .class files and then start up a Servlet talking to the Applet"* — i.e. built for exactly the applet-serving device the xPort Pro is |
| What the µClinux device actually runs | **boa 0.94.14rc21** + **axTLS 1.2.4** (axhttpd), BusyBox httpd | From the SDK's CD file table and §8 networking list |

So: neither ACME server ships on this device, but they are the same engineering answer to the same 1 MB
web-content budget, and Acme.Serve is the Java-shaped one that would sit naturally next to a jar-wiki.

---

## 6. What the wallplug has to satisfy

From the Integration Guide, the numbers that drive the design:

* **+3.3 V, 3.15–3.46 V, ≤ 2 % ripple**; 100Base-TX active on Linux: **200 mA typ, 270 mA max**; idle 175 mA.
* Absolute maximum supply 3.6 V; **no pin is 5 V tolerant**; CPx/RX input high ≥ 2.0 V, output low ≤ 0.4 V at 4 mA.
* Internal 140 ms power-up reset; power-drop reset at 2.95 V; supply reset threshold 2.85–3.00 V.
* **Shield tabs are chassis ground and the heat sink**: "it is recommended that the PCB have approximately
  1 square inch of copper attached to the shield tabs", and the shield "should be separate from signal ground",
  tied with **high-voltage (~200 V), low-ESR 0.01 µF capacitors** to both signal ground and +3.3 V so an ESD
  spike is imparted equally to both.
* Mounting: 2 × Ø1.60 mm shield-tab holes, 8 × Ø0.90 mm signal holes, 2 × Ø3.25 mm; pin field 17.20 × 19.74 mm;
  body 33.90 × 16.26 × 13.50 mm; RJ45 auto-MDIX; operating −40 °C to +85 °C.
* Appendix A gives the RS-485 wiring (CP1 → DE, with an AD3485-class transceiver), which the design carries as a
  DNP option.

---

## 7. Power stage: picking the AC/DC converter

The module needs ~0.9 W worst case (270 mA × 3.3 V) from mains, with isolation. A PCB-mount isolated module is
the only sane answer for a wallplug:

* **Hi-Link HLK-PM03** — 3.3 V output, 3 W, 85–265 VAC, 1 A peak (≈600 mA continuous), 3 kV isolation,
  34 × 20 × 15 mm, short-circuit and over-current protection with self-recovery. Cheap, ubiquitous, and the
  reason the design fits in a wallplug at all.
* **Certified alternates in the same role:** RECOM RAC03-3.3SK, MEAN WELL IRM-03-3.3. If the enclosure is
  user-accessible, use one of these: the HLK family is not safety-certified, and a mains product needs an
  IEC/EN 62368-1 (or 60950-1) assessment either way.

Pin geometry for the HLK family was cross-checked between two independent KiCad footprints, which agree: the AC
pair is 5.08 mm apart, the DC pair 15.24 mm, and the two rows 29.21 mm apart — i.e. the isolation barrier runs
down the middle of a 34 mm part. The wallplug footprint carries that barrier as a dashed documentation layer and
a copper keep-out.

---

## 8. RS-232 side: DTE or DCE

Lantronix ships both conventions, so the design makes it a strap rather than a decision:

* **UDS1100**: one **DM25F (DCE)** port. **UDS2100 / EDS2100**: **DB9M (DTE)** ports.
* Lantronix's own rule of thumb: on a DB9, if pin 2 is an input the connector is DTE; male is *usually* DTE,
  female usually DCE.
* The wallplug therefore defaults to **DTE** (JP1/JP2 strapped 1-2, like the EDS2100) and becomes **DCE** by
  moving both straps to 2-3 (like the UDS1100) — swapping pins 2 and 3 at the connector without a re-spin.

Level shifting is a **MAX3232** (3.3 V, four 100 nF charge-pump capacitors), because the module's serial pins are
3.3 V CMOS and explicitly not 5 V tolerant. Channel 1 carries the data pair; channel 2 is spare on a one-port
module and is listed as unconnected rather than silently grounded. An optional second MAX3232 (U3, DNP) gives
real ±RS-232 levels for RTS/CTS/DTR/DCD when the CP pins are used as modem control instead of PIO, and an
optional **SP3485** (U4, DNP) plus three 0 Ω links reproduces the guide's appendix A RS-485 front end on the
same TTL pins.

---

## 9. The EAGLE design

`tools/wallplug-model.mjs` is the single source of truth: packages, symbols, devicesets, parts, netlist, board
and sheet placements, BOM. `tools/build-wallplug-eagle.mjs` emits EAGLE 9.6.2 XML for it and verifies it.

### 9.1 Why generated CAD

Hand-drawn CAD cannot be tested. Generated CAD can:

```
node tools/build-wallplug-eagle.mjs --check
  lantronix-wallplug.lbr: 46381 bytes, 21 packages, 19 symbols, 21 devicesets
  lantronix-wallplug.sch: 86035 bytes, 1 sheet, 42 instances, 41 nets
  lantronix-wallplug.brd: 71843 bytes, 46 elements, 147 pads
  worst mains↔SELV creepage: 10.04 mm (MOV1.2 ↔ PS1.4), limit 6.4 mm
  schematic: 42 instances on a 480 × 300 mm sheet, no overlapping label boxes
OK — XML well-formed, every reference resolves, connectivity matches the model, geometry clean.
```

`--check` does four things:

1. **Well-formedness** with a self-contained XML parser (no dependencies).
2. **Reference resolution** — part → deviceset → gate → symbol pin → package pad; element → package;
   contactref → element + pad; and every symbol pin must be in a net or listed in `UNCONNECTED`, with no pin in
   two nets and no net duplicated.
3. **Connectivity equality** — the nets in the `.sch` and the signals in the `.brd` must equal the model's
   `NETS` table pin for pin and pad for pad. A dropped pin is a real wiring bug, so it fails the build.
4. **Geometry** — courtyard overlaps (0.2 mm tolerance), board-outline containment (parts flagged `edge` mate
   through the outline), pad-to-pad ≥ 0.35 mm edge-to-edge with rotation-correct SMD rectangles (so a legal
   1.27 mm SOIC pitch is not reported as an overlap), mains↔SELV **creepage ≥ 6.4 mm** measured per pad with
   per-pad zone tags, mounting holes ≥ 3.2 mm from copper, and a sheet check that no two instance label boxes
   overlap or run off the drawing.

The EAGLE grammar the generator targets is not guessed: it is the DTD documented inside KiCad's own importer
(`common/io/eagle/eagle_parser.h`, with `pcb_io_eagle.cpp` and `sch_io_eagle.cpp` as the readers). A real,
maintained importer is the strongest validator available without a licensed copy of EAGLE. Pad geometry for the
DE-9, SOIC-16 and the 6 mm tact switch comes from KiCad's official footprint libraries; the xPort package comes
from two independent third-party footprints that agree with the Integration Guide's hole pattern.

### 9.2 What is on the board

110 × 64 mm, two layers, 1.6 mm FR-4, 46 references, 41 nets, four M3 mounting holes.

* **Mains zone (top-left):** J1 screw terminal → F1 T500 mA/250 V radial fuse (line only) → PS1 pin 1; N straight
  to PS1 pin 2; MOV1 (S07K275) across L-N **after** the fuse so a varistor failure opens the fuse.
* **Power:** PS1 +Vo → FB1 ferrite → 3V3, with C1 1000 µF/10 V bulk and C2 100 µF local; LED1 + R4 as a
  presence indicator; TP1/TP2 for a meter.
* **Module:** X1 xPort Pro with the RJ45 nose through the right board edge, C3/C4 bypass at the pin field,
  R1 10 kΩ pull-up on Data Out (the guide's own note), SW1 reset to ground with an optional R7 pull-up,
  and C9/C10 = **10 nF / 200 V** from the shield tabs to signal ground and to 3.3 V, exactly as the ESD section
  recommends. TP5 exposes chassis.
* **RS-232:** U2 MAX3232 + C5–C8, JP1/JP2 DTE/DCE straps, J2 right-angle DE-9 through the bottom edge
  (pin row 1 sits 7.70 mm from the outline, per KiCad's `EdgePinOffset`), and J3 a 5-pin field terminal
  (TXD RXD RTS CTS GND) as an alternative to the DE-9.
* **Options (DNP):** U3 second MAX3232 + C11–C14 for modem control; U4 SP3485 + R8/R9/R10 + J5 for RS-485.
* **Break-out:** J4 2 × 5 header with 3V3/GND/TXD/RXD/CP1/CP2/CP3/RESET/DSR/GND at TTL levels — the header you
  probe with a 3.3 V USB-serial adapter before trusting the DE-9 — plus TP3/TP4.
* **Zones:** a tPlace/tRestrict barrier at x = 50 mm separates mains from SELV, and the ground pour is confined
  to x ≥ 52 mm so copper cannot bridge it.

### 9.3 What is deliberately *not* done

* **No routing.** The board is placed, verified and net-listed; traces are the builder's job, because routing is
  where the safety decisions actually live and a generated autoroute would be worse than useless on a mains
  board. The rules are written down instead: ≥ 2.5 mm mains tracks (net class 1, 6.4 mm clearances), ≥ 1.0 mm on
  the 3.3 V rail, serial pair kept away from PS1's switching node, ≥ 1 in² (6.45 cm²) of copper on the shield
  tabs.
* **No certification.** This is a design study. Mains-connected hardware needs IEC/EN 62368-1 assessment, a
  properly rated enclosure, and a certified AC/DC module if a user can touch it.
* **No firmware.** The module keeps its Lantronix firmware; the design does not depend on rebuilding the µClinux
  SDK. If you do rebuild it, §2 and §3 are the map: SDK for authenticity, Buildroot
  (`qemu_m68k_mcf5208_defconfig`) for a reproducible modern tree, mainline `arch/m68k` nommu for the long run.

### 9.4 Bring-up order

1. Fit the power section only. With no module, verify 3.3 V ±2 % and ≤ 2 % ripple at the module header, and check
   the reset behaviour (the module resets below 2.85–3.00 V and holds a 140 ms power-up reset).
2. Fit X1. Connect a **3.3 V** USB-serial adapter to J4 (never RS-232 levels to the TTL header) and look for the
   dBUG banner at 115200 8N1 — `set watchdog off`, `show`, then `dnfl`/`go` if you are loading images.
3. Fit U2 and J2/J3 and check the DTE/DCE straps against the device on the other end of the cable.
4. Only then consider U3 (modem control) or U4 + R8/R9/R10 (RS-485) — one front end at a time, since both share
   the module's TTL pins.

---

## 10. Sources

Vendor documents (read in full):

* Lantronix **xPort Pro Integration Guide**, 900-557 rev K, August 2024 —
  <https://www.lantronix.com/wp-content/uploads/pdf/XPort-Pro_IG.pdf> (Table 2-2 pin functions, Figures 2-4…2-7
  dimensions and PCB hole pattern, absolute maximum ratings and recommended operating conditions, the 10 nF/200 V
  ESD guidance, the 1 in² heat-sink rule, appendix A RS-485 wiring, "Serves static web pages and Java applets ·
  Storage capacity: 1 MB").
* Lantronix **xPort Pro User Guide**, 900-560 rev G, February 2019 —
  <https://www.lantronix.com/wp-content/uploads/pdf/900-560e_XPort_Pro_UG_release.pdf> (part-number/SDRAM/OS
  matrix, Evolution OS features).
* Lantronix **Linux SDK User Guide**, 900-548 —
  <https://cdn.papouch.com/data/user-content/old_eshop/files/XPORT_PRO/linux-sdk_ug.pdf> ("OS: custom µClinux
  distribution / Linux Kernel: 2.6.30"; dBUG commands and options; dual bank and netcon; ROMFS/JFFS2 chapters
  with the exact `fl e` commands and the xPort Pro flash map; CD file table; build profiles; sample applications;
  the `Address: 0x4001FF80` download transcript).
* Lantronix **PCN-485**, September 2017 —
  <https://cdn.lantronix.com/wp-content/uploads/pdf/PCN-485-XPort-Pro_Software_Release_Notification.pdf>
  ("XPort Pro (uClinux)", firmware 5.4.0.2R2, secondary dBUG update).
* Lantronix **xPort Data Sheet** 910-815 and **xPort-485 Data Sheet** 910-463 —
  <https://cdn.lantronix.com/wp-content/uploads/pdf/910-815J_XPort_Data_Sheet_10042022.pdf> (DSTni-EX "186",
  256 KB SRAM, 512 KB flash, 16 KB boot ROM, classic XPort hole pattern).
* Lantronix **xPico** product page — <https://www.lantronix.com/products/xpico/> ("DSTni-EX Enhanced 16-bit x86
  Architecture", 256 KB SRAM / 512 KB flash).
* Lantronix **MatchPort AR** product brief and **Linux DevKit** brief —
  <https://cdn.lantronix.com/wp-content/uploads/pdf/MatchPort-AR_PB.pdf>,
  <https://cdn.lantronix.com/wp-content/uploads/pdf/MatchPort-AR-Linux-DevKit-Product-Brief.pdf> (DSTni-FX
  166 MHz / 159 MIPS, 8 MB SDRAM + 4 MB flash, 7 CP/GPIO; kernel 2.6.26, uClibc 0.9.29, uClinux-dist 20080808,
  CodeSourcery toolchain, BDM connector, gdbserver/iperf/tcpdump).
* Lantronix **EDS1100/EDS2100** product page and **EDS User Guide** —
  <https://www.lantronix.com/products/eds1100-eds2100/>,
  <https://cdn.lantronix.com/wp-content/uploads/pdf/EDS_UG.pdf> (Linux or Evolution OS, 100–240 VAC, part
  numbers, Evolution firmware 7.1.0.0R1).
* Lantronix tech-support notes: **RS232 DTE and DCE connectors** and **RS232 Serial Cable Wiring** —
  <https://ltrxdev.atlassian.net/wiki/spaces/LTRXTS/pages/106889653/> (UDS1100 = DM25F DCE, UDS2100/EDS2100 =
  DB9M DTE; DB9 pin conventions).
* CNX Software, *Lantronix XPort Pro Lx6 is a Tiny Embedded Linux Server Fitted into an RJ45 Connector* (2013) —
  <https://www.cnx-software.com/2013-12-15/lantronix-xport-pro-lx6-is-a-tiny-embedded-linux-server-fitted-into-an-rj45-connector/>
  (the MCF5208 identification, flagged "TBC" by the author).

µClinux and alternatives:

* Wikipedia, **μClinux** — <https://en.wikipedia.org/wiki/%CE%9CClinux> (Dionne + Albanowski 1998 on the
  DragonBall 68EZ328; ColdFire in 1999; mainline merge at 2.5.46; uClibc and µClinux-dist as separate
  deliverables; last µClinux-dist September 2016).
* Buildroot — <https://github.com/buildroot/buildroot/tree/master/configs> (`qemu_m68k_mcf5208_defconfig`,
  `qemu_m68k_q800_defconfig`, `arch/Config.in.m68k`).
* RTEMS User Manual 6.2, §8.6 *m68k (Motorola 68000 / ColdFire)* —
  <https://docs.rtems.org/docs/6.2/user/bsps/index.html> (av5282, csb360, gen68340, gen68360, genmcf548x,
  mcf5206elite, mcf52235, mcf5225x, mcf5235, mcf5329).
* DistroWatch search — <https://distrowatch.com/search.php?ostype=Embedded&status=Active> (the "OS Type:
  Embedded" filter and the distribution/architecture catalogue it returns).

Ghidra and the Java side:

* Ghidra — <https://github.com/NationalSecurityAgency/ghidra/tree/master/Ghidra/Processors> (module list;
  `68000/data/languages/68000.ldefs` for `68000:BE:32:Coldfire`, `MC68020/30`, `CPU32`, `default`;
  `JVM/data/languages/JVM.ldefs` for `JVM:BE:32:default` "Generic JVM"; `Dalvik` languages;
  `Ghidra/Processors/JVM/src/main/java/ghidra/javaclass/format/ClassFileJava.java`).
* ACME Labs — <https://www.acme.com/java/software/Acme.Serve.Serve.html> (Acme.Serve javadoc, quoted),
  <https://acme.com/software/mini_httpd/>, <https://acme.com/software/js_httpd/> (the server family).
* Wiki in a Jar — <https://sourceforge.net/projects/wiki-in-a-jar/> (project facts, 0.8-20081128 release) and
  the mirror <https://github.com/astecenko/Wiki-in-a-Jar> (`Server.java`, `build.xml`, `lib/xrays.jar` →
  `net.sf.wikiinajar.xrays.NanoHTTPD`), plus Linutop's 2009 review for the port-3003/no-access-control details.
* JavaCardOS — <https://javacardos.com/javacardforum/viewtopic.php?t=115> and
  <https://javacardos.com/javacardforum/viewtopic.php?t=43> (JCIDE, pyApduTool, the six-specification reading
  list, `.java` → `.cap` loop).

Hardware footprints and parts:

* KiCad source mirror — <https://github.com/KiCad/kicad-source-mirror> (`common/io/eagle/eagle_parser.h` for the
  EAGLE DTD, `pcbnew/pcb_io/eagle/pcb_io_eagle.cpp`, `eeschema/sch_io/eagle/sch_io_eagle.cpp`).
* KiCad footprints — <https://github.com/KiCad/kicad-footprints>
  (`Connector_Dsub.pretty/DSUB-9_Male_Horizontal_P2.77x2.84mm_EdgePinOffset7.70mm_Housed_MountingHolesOffset9.12mm`,
  `Package_SO.pretty/SOIC-16_3.9x9.9mm_P1.27mm`, `Button_Switch_THT.pretty/SW_PUSH_6mm`,
  `TerminalBlock.pretty/TerminalBlock_bornier-2_P5.08mm`).
* Third-party xPort footprints — <https://github.com/robertstarr/lbr_user> (`lantronix.lbr`, package `XPORT`) and
  <https://github.com/tridrao/SparkFun-KiCad-Libraries> (`XPORT.kicad_mod`).
* Hi-Link HLK-PM03 — <https://www.lcsc.com/product-detail/ac-dc-power-modules_hi-link-hlk-pm03_C209904.html> and
  the two HLK-PM01 KiCad footprints used to cross-check the pin grid
  (<https://github.com/ranseyer/home-automatics>, <https://github.com/CarnivalBen/BGCustomKiCadLibraries>).

This repository:

* [`ghidra-lab.html`](../ghidra-lab.html) (browser Ghidra lab already loading `x86:LE:16:Real Mode`),
  [`docs/GHIDRA_COOKBOOK.md`](./GHIDRA_COOKBOOK.md) (the verify-with-a-second-implementation habit),
  [`samples/javacard/`](../samples/javacard/) + [`tests/14-javacard.mjs`](../tests/14-javacard.mjs),
  [`docs/UEFI_OPENBIOS_JAVAC.md`](./UEFI_OPENBIOS_JAVAC.md),
  [`docs/RESEARCH_SMARTCARD.md`](./RESEARCH_SMARTCARD.md),
  [`distro-dossier.html`](../distro-dossier.html),
  [`apps/acme_suite_quine.html`](../apps/acme_suite_quine.html).
