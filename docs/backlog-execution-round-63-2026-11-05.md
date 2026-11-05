# Backlog execution round 63 — 2026-11-05

## Android replacement OS, XPort Pro debug, SDR pause/replay, and QEMU

### Scope and outcome

This was a source-and-documentation review only. No XPort Pro was attached, no board was wired, no firmware was flashed, no SDR transmission was made, and no QEMU or Android virtual machine was booted. The current checkout is at `ca3f946`; `apps/html5-offline-launcher/` is absent here, so this report does not assume that prior launcher work is present or recreate it.

The work resolved several naming and capability questions, but not the hardware-dependent acceptance criteria. **The critical new XPort finding is that Lantronix documented a BDM development path for both Linux and Evolution SDKs; that is not the same thing as a JTAG interface, and no BDM/JTAG implementation or test exists in this checkout.**

### 1. Android replacement OSes: terminology and viable candidates

| Name | What it is | Practical constraint |
| --- | --- | --- |
| **Samsung One UI** | Samsung's proprietary interface/software layer built on Android, not a standalone replacement OS. | It is specific to compatible Galaxy devices. If the target is a Samsung phone, the exact model/variant must be checked against a community OS's device list; One UI itself is not the OS to port to a generic VM. |
| **Ubuntu One** | Canonical's former cloud file-sync/storage service, not a phone OS. Canonical announced shutdown of file services in 2014; the announcement said Ubuntu One single sign-on, payments, and U1DB were not affected. | The likely mobile-OS name is **Ubuntu Touch**; that is a different project. |
| **GrapheneOS** | Android/AOSP-based security- and privacy-focused OS. Its current official support list is Pixel-only, covering listed Pixel 6–10 generation devices, including supported Fold/Tablet models. | Choose only from the official live device list. The GrapheneOS web installer explicitly says installing from an OS running inside a VM is not recommended because USB passthrough is often unreliable. This is a warning about flashing through a VM, not evidence that the OS itself cannot be emulated. |
| **LineageOS** | Android-based replacement distribution with a broad, device-specific official support catalogue. | Match the exact model number and codename to the device guide; similarly named variants are not interchangeable. LineageOS also publishes instructions for building/running generic QEMU/libvirt VM targets, which is a suitable Android-lab route. |
| **Ubuntu Touch (UBports)** | A distinct Linux mobile OS maintained by UBports, not a de-Googled Android ROM. The 24.04-1.0 release notes list specific supported phones/tablets; device maturity and release channels vary. | Use the live UBports device page and its device-specific installation instructions. A device appearing in an archive or community list does not establish a current stable port. |

**Recommendation:** Until the handset is identified, do not select or flash an image. For a disposable Android/QEMU development lab, start with the official LineageOS QEMU/libvirt instructions or Android's AOSP/AVD documentation. Do not use a VM as the USB flashing host for GrapheneOS.

#### GitHub, Archive.org, SearXNG, and RustXNG checks

- GitHub search confirmed official project repositories for GrapheneOS, UBports/Ubuntu Touch, and PortaPack Mayhem. It also surfaced [`jqssun/android-lineage-qemu`](https://github.com/jqssun/android-lineage-qemu), a GPL-3.0 community packaging of LineageOS VM builds; its README points back to LineageOS's QEMU guide and describes GitHub Actions releases. It was not downloaded or run. The official LineageOS device catalogue and QEMU build instructions were more useful than repository-name searches for choosing a supported target.
- Internet Archive's direct `advancedsearch.php` requests returned its **Temporarily Offline** response during this pass. A web-index query still surfaced historical LineageOS backups (2021/2023) and a GrapheneOS video (2022). These are archival references, not current device-support or installation sources; no archived firmware was downloaded.
- I tried SearXNG endpoints `etsi.me`, `baresearch.org`, and `libresearch.space`, and checked the `searx.space` instance directory. The returned results were noisy/irrelevant or empty; metadata for `etsi.me` and `baresearch.org` showed one working upstream engine each (Bing and Google CSE, respectively). Primary project documentation is therefore the evidence base, not metasearch snippets.
- `sahenjp/RustXNG` describes itself as a **self-hosted** metasearch engine based on SearXNG. Its README explains that search terms are sent to configured upstream providers. No RustXNG service endpoint was supplied or running in this workspace, and RustXNG was not installed or launched.

### 2. Lantronix XPort Pro: JTAG status, documented BDM path, and app conversion

#### Answer to “is the JTAG interface finished?”

**No in-repository JTAG or BDM interface is finished.** The checkout contains static Evolution OS firmware analysis, not a board-level debugger, BDM/JTAG driver, pinout, or hardware test. The static Ghidra work for Evolution OS 6.0.0.1R2 remains just that: static analysis, not a device boot or debug session.

The earlier JTAG-focused search correctly found no XPort Pro JTAG implementation; it did not search for BDM. The existing µClinux deep-dive already mentions a BDM connector for the MatchPort AR development kit. A targeted BDM check now confirms that Lantronix's **XPort Universal Demo Board User Guide** documents an XPort Pro Development Board with a **Background Debug Mode (BDM) connector** in both the Linux and Evolution SDK kits, plus a separately purchased **USB BDM Debug Probe, part 930-060-R**. Lantronix's product page currently lists the **XPPDK1000-EVO-02** Evolution Development Kit. The standard Universal Demo Board is described as exposing serial/GPIO; the BDM connector is on the separate XPort Pro Dev Board included in the SDK kit.

That is a documented vendor **BDM** development route—not proof of a JTAG header on the production module. BDM and IEEE 1149.1 JTAG are different debug/test interfaces. The exact DSTni-FX signal mapping, electrical levels, and whether any JTAG pads are exposed on a particular board revision were not established here. **Do not wire a generic JTAG probe based on this report.** The Linux SDK's dBUG boot path/serial recovery is also not the same interface as BDM.

The XPort Pro OS split still matters:

- Evolution OS: `XPP1002000-02R / XPP100200S-02R`.
- Linux/µClinux variants: `XPP1003000-04R / XPP100300S-04R`.

The vendor guide lists separate Linux and Evolution SDKs, and the public product page directs SDK enquiries to Lantronix; no SDK package or hardware was obtained for this investigation. A potential next step is to locate an authentic XPPDK1000-EVO kit and its 930-060-R probe, then verify its board revision and SDK instructions before attempting debug. No SDK or probe should be substituted from a different target.

#### “Convert these apps to Evolution OS”

No app conversion is recorded in this checkout. The phrase is still ambiguous: it could mean porting native applications to a proprietary SDK, or putting a few small pages in Evolution OS's embedded web-content store. Those are different projects.

Current inventory of `public/apps/`:

- 90 top-level directories; 89 have a top-level `index.html` entrypoint.
- 8,035 regular files, **154,615,436 bytes** in total.
- The 89 entrypoint HTML files alone total **10,030,349 bytes**.

The XPort Pro Integration Guide describes its static web-page/Java-applet storage as **1 MB**. Thus, even the current entrypoint HTML alone is about ten times that nominal web-content budget, and the complete app corpus is about 155 times it. Evolution OS is an embedded device-server OS with configuration/web-management features, not a modern client browser for running this repository's HTML/JavaScript applications on the module. A carefully selected, very small web UI might be rewritten for the supported web-content model; porting all 89 entrypoints as-is is not realistic. The exact app subset, SDK/runtime, and target part are prerequisites.

### 3. HackRF/SDR capture, pause, and replay findings

HackRF One's official documentation describes a **half-duplex** transceiver operating from 1 MHz to 6 GHz, with 2–20 Msps quadrature sampling and 8-bit I/Q samples. The host `hackrf_transfer` tool records/sends those 8-bit quadrature sample files. A receive-only RTL-SDR can capture I/Q to a file for offline analysis; a host application can replay that file as a software source, but the dongle itself cannot transmit.

I reviewed PortaPack Mayhem's source at commit `834076356ef40c1cd5160a920ce6d912e83db427` (default `next` branch), including `capture_thread.cpp`, `ui_record_view.cpp`, `replay_thread.cpp`, `ui_playlist.cpp`, and `external/scanner/ui_scanner.cpp`, alongside the project's Capture/Replay wiki:

| Function | What the current Mayhem implementation documents/does |
| --- | --- |
| Capture | Writes IQ to SD as `.C16` or `.C8`, with a paired text metadata file. The record control toggles record/start and stop. The capture thread runs until termination; I found no pause/checkpoint/resume state in this path. |
| Replay | Reads captured IQ into the transmitter. The Replay button toggles play/stop; starting a playlist sets the track index to zero. Looping repeats a playlist. I found no arbitrary seek/pause/resume cursor in this implementation; stopping is not a resumable pause. Replay is transmit-capable on HackRF hardware. |
| Scanner | Has an explicit user pause/resume control for scanning frequencies. This is separate from pausing an IQ recording or pausing Replay. |
| Timing/DSP change | Mayhem PR #3382 is merged (2026-10-23); it adds adaptive interpolation to improve Replay spectral images/high-rate sample handling. It is not a record-pause or replay-seek feature. |

So “pause and replay” is not one unified device capability: Mayhem can pause its scanner, can stop/start recording, and can transmit a saved capture, but the reviewed Capture/Replay code does not provide time-shift-style pause/resume. Other SDR models and desktop apps may behave differently; no other specific model was named.

GitHub searches also returned access-control/vehicle replay projects. I did **not** inspect or run their operational code. Any further modification review should be limited to source URLs supplied by the user and authorized, non-harmful lab targets. No RF transmission or replay test was performed.

### 4. QEMU virtualization: what is feasible and what is not

- **Android:** Android's Emulator/AVD uses a QEMU-based hypervisor, and AOSP documents building `sdk_phone_x86_64` images. LineageOS documents generic QEMU/libvirt targets. This is a practical software test lab for Android apps and OS UI, but it is not a substitute for an exact handset's modem, radios, secure hardware, verified boot, or OEM firmware.
- **XPort Pro µClinux:** QEMU's ColdFire system emulator supports the **MCF5208EVB** reference board and can boot µClinux. That is not a model of the XPort Pro board or its Lantronix peripherals; it can help test a compatible ColdFire µClinux build, not establish XPort Pro compatibility or validate BDM/JTAG.
- **Evolution OS:** No QEMU machine target for the proprietary XPort Pro Evolution OS was found. Static firmware disassembly and a ColdFire reference-board boot do not constitute Evolution OS emulation.
- **HackRF:** QEMU can pass a real USB host device into a guest on supported hosts, but this is pass-through, not RF emulation. QEMU's documentation warns that real-time streaming USB devices are not supported reliably; HackRF's high-throughput sample stream needs physical validation. File-based IQ/DSP tests are the appropriate no-radio first step.

No `qemu-system-m68k`, `qemu-system-x86_64`, Android Emulator, ADB, Android SDK, Java, Gradle, Cargo, Docker, or RustXNG executable/service was available in this workspace, so no VM test ran.

### Status and next blockers

| Workstream | Status | Needed to proceed |
| --- | --- | --- |
| Android replacement OS survey | Research pass complete; install choice blocked | Exact phone model/variant; confirm whether “Ubuntu One” meant Ubuntu Touch. |
| Android QEMU lab | Not run | Install/provision Android SDK/QEMU on a permitted runner; select AVD or official LineageOS VM image and test goal. |
| XPort Pro JTAG/BDM | No implementation in this checkout; vendor BDM route documented | Exact OS SKU, Dev Board revision, SDK kit and probe ownership; clarify BDM vs JTAG. Verify manuals/electrical levels before any wiring. |
| Evolution OS app port | Not started | Select app(s); decide native SDK vs small web-content UI; obtain the matching SDK/dev kit. Whole `public/apps/` corpus does not fit the published 1 MB web-content budget. |
| HackRF/SDR | Mayhem Capture/Replay source audit complete; no hardware test | Exact SDR models/firmware-mod URLs and a non-harmful authorized test objective. |
| XPort/SDR QEMU | Not run | Exact target image/ABI, QEMU runner, and a clear distinction between software emulation and physical-hardware tests. |
| Archive.org/RustXNG | Partial | Retry Archive.org when available; provide a RustXNG endpoint if a live query is required. |

### Sources

**Mobile OS and virtualization**

- [Samsung: What is One UI?](https://www.samsung.com/uk/mobile-phone-buying-guide/what-is-one-ui/)
- [Canonical: Shutting down Ubuntu One file services](http://blog.canonical.com/2014/04/02/shutting-down-ubuntu-one-file-services/)
- [GrapheneOS FAQ](https://grapheneos.org/faq) and [web installer requirements](https://grapheneos.org/install/web)
- [LineageOS device catalogue](https://wiki.lineageos.org/devices/) and [QEMU/libvirt VM guide](https://wiki.lineageos.org/libvirt-qemu)
- [UBports Ubuntu Touch 24.04-1.0 release](https://ubports.com/blog/ubports-news-1/ubuntu-touch-24-04-1-0-release-3973) and [device catalogue](https://devices.ubuntu-touch.io/)
- [AOSP: Android Emulator virtual devices](https://source.android.com/docs/setup/test/avd) and [Android Emulator command line](https://developer.android.com/studio/run/emulator-commandline)
- [Internet Archive LineageOS 2021 backup](https://archive.org/details/lineageos20210217) and [2023 backup](https://archive.org/details/lineageosbackup) — historical material only.
- [RustXNG README](https://github.com/sahenjp/RustXNG/blob/main/README.md); SearXNG endpoints tested: [etsi.me](https://etsi.me/), [baresearch.org](https://baresearch.org/), [libresearch.space](https://libresearch.space/), with [instance metadata directory](https://searx.space/data/instances.json).

**XPort Pro and BDM**

- [Lantronix XPort Universal Demo Board User Guide, 900-563](https://cdn.lantronix.com/wp-content/uploads/pdf/XPort_Universal-Demo-Board_UG.pdf)
- [Lantronix XPort Pro page and SDK listing](https://www.lantronix.com/products/xport-pro/); [XPort Pro Integration Guide](https://cdn.lantronix.com/wp-content/uploads/pdf/XPort-Pro_IG.pdf)
- [NXP Background Debug Mode application note AN1230](https://www.nxp.com/docs/en/application-note/AN1230.pdf); [NXP discussion of ColdFire JTAG vs. BDM](https://community.nxp.com/thread/12442)
- Repository context: `docs/lantronix-uclinux-deep-dive-2026-10-08.md`, `docs/evolution-os-ghidra-assembly.md`, `docs/evolution-os-software-search-2026-10-28.md`, and `docs/xport-pro-synchronet-fit.md`.

**SDR and QEMU**

- [HackRF One hardware documentation](https://hackrf.readthedocs.io/en/latest/hackrf_one.html), [HackRF tools](https://hackrf.readthedocs.io/en/latest/hackrf_tools.html)
- [Mayhem Capture wiki](https://github.com/portapack-mayhem/mayhem-firmware/wiki/Capture), [Replay wiki](https://github.com/portapack-mayhem/mayhem-firmware/wiki/Replay), [Mayhem source repository](https://github.com/portapack-mayhem/mayhem-firmware)
- [Mayhem PR #3382](https://github.com/portapack-mayhem/mayhem-firmware/pull/3382) — merged adaptive Replay interpolation change
- [PySDR RTL-SDR chapter](https://pysdr.org/content/rtlsdr) — receive-only device and file capture example
- [QEMU ColdFire system emulator](https://www.qemu.org/docs/master/system/target-m68k.html) and [QEMU USB passthrough documentation](https://qemu-project.gitlab.io/qemu/system/devices/usb.html)
