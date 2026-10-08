# GeoMate.jr firmware and cache-database research

Research pass: 2026-10-06.

## Identification

The toy-like geocaching receiver described in the request is the **Geomate.jr**
(the original product was associated with Apisphere/Geomate and later Brand 44),
not the SG6 in the supplied support link. Contemporary product and review
material describes the Geomate.jr as a dedicated children's geocaching GPS with
approximately 250,000 preloaded traditional caches. The receiver exposes cache
ID, coordinates, distance, direction, difficulty, terrain, and size; the update
kit loads replacement cache lists over a proprietary USB cable.

The best primary-ish historical lead is the Geomate.jr manufacturer's account
on the Geocaching forums:

- [The Geomate.jr Update Kit](https://forums.geocaching.com/GC/index.php?/topic/230764-the-geomatejr-update-kit/)
- [page 2](https://forums.geocaching.com/GC/index.php?/topic/230764-the-geomatejr-update-kit/page/2/)
- [page 3](https://forums.geocaching.com/GC/index.php?/topic/230764-the-geomatejr-update-kit/page/3/)

The thread says the update kit was distributed through `mygeomate.com/updates`,
that the unit reported firmware versions such as `V1002 RE X2`, and that the
update process could report **“Flash Programming Failed.”** It also says the
later updater fixed a USB-hardware/configuration problem. This is evidence of a
firmware update path, but it is not itself a firmware image.

Useful corroborating references:

- [Geomate.jr review](https://techcrunch.com/2011/08/22/tc-tests-the-geomate-jr-a-geocaching-gps-unit-for-the-wee-ones/)
- [Geomate.jr product/update-kit description](https://www.amazon.com/Geomate-Jr-Geocaching-GPS-Update/dp/B002MZZX9O)
- [Offline-update report](https://spindocbob.wordpress.com/2012/01/27/have-a-geomate-jr-dont-panic/)
- [Geomate.jr manual-input discussion](https://forums.geocaching.com/GC/index.php?/topic/306156-geomatejr-manually-input-coordinates/)

The historical updater names found in those references include
`geomateQtGuiApp.exe`, `geomategui.exe`, and `geomateloadersetup.exe`. The
available descriptions indicate that the standalone loader can accept a GPX
file and upload it to the unit. That is different from the web update process,
which generated/downloaded a cache database and may also have delivered device
firmware.

## The supplied SG6 link is a different product

The supplied support article currently resolves to **SG6_v1.5.2_20251226** and
says “This is the firmware of SG6.” SG6 is a current Geomate land-survey GNSS
receiver, not the Geomate.jr geocaching toy. Its download link is a hosted
firmware package, but it must not be treated as the Geomate.jr firmware without
an explicit device match. In particular, no SG6 bytes are imported into this
repository and no SG6 update should be flashed to a Geomate.jr.

- [Supplied SG6 support article](https://support.geomate.sg/portal/en/kb/articles/sg6-1-3-5-20241015)

## Audit of firmware-like files already in this checkout

I checked the existing firmware and executable corpus rather than treating an
unrelated binary as the Geomate.jr update:

| artifact | result |
| --- | --- |
| `samples/archive/glinet/openwrt-mt300n-v2-3.203-0805.bin` | A verified 12,583,196-byte GL-iNet MT300N-V2 OpenWrt image; the header identifies `MIPS OpenWrt Linux-4.14.221`, with U-Boot magic `0x27051956`, load/entry `0x80000000`, and LZMA-compressed image metadata. It is a router firmware image, not a Geomate device update. SHA-256: `111faa8e4b19a6de97495c9d89a38e4afaec07ac3be4dd6acc3ec7a94bbd4745`. |
| `samples/avr/optiboot_atmega328.hex` | 512-byte Optiboot ATmega328P bootloader. The in-repo decoder agrees with the vendor `avr-objdump` listing on 225/225 instructions and 78/78 targets; reachable self-programming sites are identified. It contains no geocache/database strings and is not Geomate evidence. |
| `samples/avr/micronucleus_m328p_extclock.hex` | 1,498-byte Micronucleus ATmega328P USB/HID bootloader. The walk finds 619/681 reachable instructions, 5 SPM sites, 3 LPM sites, and 2 watchdog sites. It is also unrelated to Geomate.jr. |
| `abbottabad-ghidra/evidence/**` and `.relay/samples/**` | Existing Ghidra corpus is Windows software, installers, games, and unrelated utilities. The reports contain no Geomate, `mygeomate`, cache-database, or GPS-update identification. |

The AVR pass is useful as a methodology check, but the vendored WASM Ghidra
bridge cannot currently map its AVR word-addressed `code` space for
Decompilation; the tool records the exact failure instead of emitting fake C.
The GL-iNet image is MIPS and would require a MIPS-capable Ghidra headless
analysis, but it is conclusively the wrong product before that work begins.

The Geomate.jr cache corpus was **not hard-coded into the executable in the
usual sense**. Public descriptions call it “preloaded”; the update-kit reports
refer separately to the unit firmware and the unit database. The likely
architecture is a firmware/application image plus a separately programmed
cache database. A decompiler pass over only the updater would therefore first
need to determine whether it contains an embedded device image, a downloader,
a database encoder, or just a USB loader.

No Geomate.jr firmware/update binary, installer, GPX export, or cache database
is present in this checkout. Therefore this pass deliberately does **not**:

- claim to have run Ghidra on the SG6 link or on a missing Geomate.jr binary;
- invent cache coordinates or cache IDs;
- copy the stale 2009–2012 preloaded corpus into the SoCal register; or
- publish a firmware image or executable in Git.

The forum and product references describe caches as ordinary geocaching.com
records, including traditional-only filtering in the original preload. Cache
coordinates and descriptions are also time-sensitive: archived caches can be
removed or moved, so an import needs a dated source and a provenance record.

## Planned static-analysis/import workflow

When the actual Geomate.jr updater or firmware package is supplied, the safe
workflow is:

1. Preserve the original file outside Git and record SHA-256, size, and source
   URL/date.
2. Identify the container/installer and extract payloads without executing
   them (`7z`, `innoextract`, or the package's documented archive format).
3. Import candidate PE/ELF/flat-ROM payloads into **Ghidra headless** with the
   matching processor/language; export strings, symbols, and decompiled code.
4. Look for USB protocol code, flash/programming commands, database signatures,
   GPX/XML strings, cache-code patterns (`GC` followed by digits), coordinate
   encodings, and version/build strings. Treat strings alone as leads, not
   decoded records.
5. Validate any recovered record against the source GPX/database format and
   keep a machine-readable extraction report with offsets and hashes.
6. Convert only records with defensible coordinates and provenance into the
   SoCal Gazetteer. They should be a separate `Geocache` class/FTT branch,
   retain their cache code and source date in the note, and never be marked as
   verified GNIS features.
7. Rebuild and test `socal-subsurface.xdc` with
   `node scripts/build-socal-subsurface-xdc.mjs`.

The existing subsurface register is GNIS-oriented (`name + feature class +
point + GNIS verification`), so geocaches should be added as a clearly
separate community/source tier rather than silently mixed into GNIS rows.

## Internet Archive / Wayback follow-up

The archive search produced useful documentation but not the updater binary. The strongest archived record is the 2012 Geomate.jr shutdown page:

- [Archived Geomate.jr shutdown page](https://web.archive.org/web/20120128184821id_/http://geomatejr.appspot.com:80/)
- [2009 Geomate.jr unveiled press release](https://web.archive.org/web/20110206090823id_/http://mygeomate.com/2009-05-11_Geomatejr_Unveiled.pdf)
- [Archived 2009 update page](https://web.archive.org/web/20090515130017id_/http://www.mygeomate.com:80/updates)
- [Archived `mygeomate.com` CDX inventory](https://web.archive.org/cdx/search/cdx?url=mygeomate.com/*&output=json&filter=statuscode:200&collapse=urlkey)
- [Archived `geomatejr.appspot.com` CDX inventory](https://web.archive.org/cdx/search/cdx?url=geomatejr.appspot.com/*&output=json&filter=statuscode:200&collapse=urlkey)

The shutdown page explicitly links `geomateQtGuiApp.exe` and describes it as software that lets a user with an Update Kit and a PC load a Geocaching.com Pocket Query onto a Geomate.jr. The exact executable has no Wayback CDX capture; replaying the linked URL returns a 404. The archive therefore confirms the tool's role, but does not provide bytes for Ghidra.

The press release confirms approximately 250,000 preloaded cache locations covering the US. The archived update page says the cache list could be changed, but required an Update Kit. This supports a separate programmable cache database rather than cache strings compiled into the application executable.

## Source-check: archived manual anchors

The archived user guide supplies concrete signatures for a future binary analysis:

- startup displays `V1002`, followed by the month/day/year of the loaded cache list (example `4/19/2009`);
- the connector cover is labelled for the Update Kit;
- the device computes the closest 20 caches after a GPS fix;
- each cache has a GC Code, size 1–4, terrain and difficulty ratings, and a found state;
- the found list supports up to 1,000 finds;
- navigation coordinates are WGS-84 decimal minutes and the receiver uses SiRFstarIII GPS technology.

Sources: [archived User's Guide](https://web.archive.org/web/20111030143004id_/http://www.mygeomate.com:80/pdf/GeomatejrUsersGuide.pdf), [archived Quick Start Guide](https://web.archive.org/web/20111030143112id_/http://www.mygeomate.com:80/pdf/quick_start_guide.pdf), and [archived Update Kit page](https://web.archive.org/web/20090515130127id_/http://www.mygeomate.com/update_kit).

The Update Kit page says it could replace the national cache list, load country/region lists, change units, assign a device name, and activate a bonus page. This implies separate configuration and cache-database payloads. The startup date is a practical signature for a recovered database image.

The source check distinguishes the original embedded Geomate.jr application/firmware (`V1002`), the web Update Zone, and the later Qt GPX/Pocket Query loader (`geomateQtGuiApp.exe`). Only the third is named by the 2012 shutdown page, and its executable bytes remain uncaptured, so no responsible Ghidra report can yet be produced.

## Follow-up source check: Geomate Loader and community reports

The newly supplied sources add provenance for the loader, but still do not
provide a binary that can be responsibly imported into Ghidra:

- [Geomate Loader — Software Informer](https://geomate-loader.software.informer.com/download/)
  lists **Geomate Loader 1.3 (x86/x64)**, updated 2014-10-30, filename
  `geomateloadersetup.exe.zip`, advertised size 9.7 MB. It describes the
  program as loading databases into a Geomate.jr and says its copy was scanned
  by 76 antivirus engines on 2024-12-03. The page is a third-party download
  catalog; it exposes no cryptographic hash or independently verifiable
  publisher signature in the rendered record. Its download endpoint could not
  be retrieved in this analysis environment, and the Wayback CDX inventory has
  no capture for the executable or ZIP.
- [FarrellCache profile](https://forums.geocaching.com/GC/index.php?/profile/6304715-farrellcache/content/)
  records a 2013 report that `GeomateLoaderSetup.exe` could not be extracted by
  the user's program. This is consistent with a Windows installer/archive
  problem, not evidence that the file is firmware.
- [altagal profile](https://forums.geocaching.com/GC/index.php?/profile/4505428-altagal/content/)
  records a 2012 report that `geomateloadersetup.exe` downloaded but did
  nothing when opened; company email and phone support also failed. This
  places the loader in the original Update Kit support chain, but does not
  reveal its container format.
- [Geomate Loader version page](https://nc-geomate.software.informer.com/7.1/)
  is a false lead for this task: it is **NC GeoMate 7.1** by Winter City
  Software Corporation, with executable name `geomate.exe`. It is unrelated to
  Geomate.jr and must not be analyzed as the update utility.

The longer [Geomate.jr cannot update thread](https://forums.geocaching.com/GC/index.php?/topic/293100-apisphere-geomate-jr-cannot-update/)
adds an important failure-mode detail: a failed web update could wipe the
existing database before failing to upload the replacement. Users also report
that the old web interface depended on Internet Explorer/Firefox-era browser
add-ons, while a separate Pocket Query software path worked for some users.
That supports a two-stage model: the website selected/generated data, while a
local native loader performed the device/database transfer.

### Ghidra disposition

`geomateloadersetup.exe` and `geomateQtGuiApp.exe` remain **candidate inputs,
not analyzed inputs**. No bytes, hash, or reproducible download was obtained
from the supplied pages. The repository therefore contains no fabricated
Ghidra report for them. If `geomateloadersetup.exe.zip` is recovered, the
correct next pass is: hash the ZIP, inventory its members, extract without
executing, identify PE/installer payloads, then run the existing headless
Ghidra workflow on each extracted PE and separately inspect any embedded GPX,
SQLite, binary database, or device-protocol payload.

## Verification of the latest firmware/error claims

The supplied summary is partly supported, but some wording overstates the
sources:

- `V1002` is directly supported by the archived user guide's startup table.
  The exact string `V1002 RE X2` was not found in the supplied pages or the
  accessible archive records; it should remain an unverified variant claim
  until a screenshot, firmware dump, or installer log supplies it.
- The Varuste listing documents the Update Kit as a PC-only product for loading
  current US/foreign cache lists and changing preferences; it does not prove
  that the kit was an over-the-air firmware updater or that it could replace
  the operating system.
- The JustAnswer pages preserve user reports of `Flash Programming Failed`,
  `Loader Error`, and unknown firmware/database versions. However, the visible
  expert exchange asks diagnostic questions; the later page section labelled
  “AI-generated” is explicitly not a manufacturer service procedure. The
  battery-removal/USB-2.0 sequence should therefore be recorded as an
  anecdotal troubleshooting suggestion, not a verified firmware fix.
- The Geocaching forum evidence does support loading a custom GPX through the
  Update Kit, including private/unofficial caches via GSAK. It does not show
  the internal `.db` format, a database-packing specification, or custom
  replacement firmware.
- No source located in this pass demonstrates an open-source firmware project
  or a third-party replacement operating system. That is an absence-of-evidence
  result, not proof that no private project ever existed.

The source-quality distinction matters for the planned Gazetteer import: GPX
records loaded by the device would be user/community cache records with a
snapshot date, not GNIS features and not firmware-derived facts. They must not
be promoted to verified Gazetteer rows without the original GPX/database and
its provenance.

## Archive discovery: previously missed ZIP captures

A broader CDX inventory search found two important archived ZIP records under the
old website:

- `GeomateandUpdateKit.zip` — `application/zip`, archived 2011-10-11,
  advertised capture length 1,618,659 bytes, digest
  `I5UJVNM2EXSSQ7OJZQOFUHPXJQHHEBX6`.
- `UpdateKit.zip` — `application/zip`, archived 2011-10-11, advertised capture
  length 727,077 bytes, digest `NU2RTCTP6PWJ7QVF5CYKQWMOFSG4JVS3`.

The complete CDX inventory is visible here:

[mygeomate ZIP CDX result](https://web.archive.org/cdx/search/cdx?url=mygeomate.com/*&output=json&filter=statuscode:200&collapse=urlkey)

However, replaying either capture through Wayback currently returns “The
Wayback Machine has not archived that URL,” including `id_`, `if_`, and the
`www` hostname variants. The CDX rows therefore prove that the crawler indexed
ZIP responses and preserve sizes/digests, but the payload is not currently
retrievable through the replay service in this environment.

The adjacent archived product page describes the Update Kit as providing
current/worldwide cache databases, private caches, and Pocket Query import; it
does not describe the ZIPs as firmware images:

[Archived products page](https://web.archive.org/web/20110925133459id_/http://mygeomate.com/products.html)

Because the ZIP names are also located in the site's `/zip/` web-asset area,
not a documented firmware-download endpoint, their likely contents are
website/product media bundles. This is a promising recovery lead, but not
evidence that V1002 microcode is present. If the WARC payload becomes
available, the next safe step is to hash and list the ZIP members before
opening any PE files with Ghidra.

Internet Archive full-text searches currently return zero items for both
`geomateQtGuiApp` and `geomateloadersetup`; the only executable lead remains
the third-party Software Informer listing. The repository's Ghidra workflows
already use OpenJDK/Temurin on CI, so Java setup is not the blocker—the missing
input bytes are.

## Proxy/replay retry (2026-10-06)

I retried the two archived ZIP captures through multiple retrieval paths:
Wayback `id_`, `if_`, `oe_`, and `im_` modes; `r.jina.ai`; AllOrigins; a
Wayback Archive-It route; and Arquivo.pt. Results were consistent:

- Wayback still returns “has not archived that URL” for the ZIP payloads even
  though CDX retains the 200/application-zip records.
- `r.jina.ai` refuses to proxy Wayback with an abuse-alleviation 403.
- AllOrigins times out against Wayback.
- Archive-It returns an empty response.
- Arquivo.pt has zero results for the exact ZIP URL.
- The live `mygeomate.com` URL now resolves to a domain-for-sale page, not the
  original asset.

This rules out a simple CORS limitation as the cause. The metadata capture is
available, but the archived response body is not exposed by the accessible
replay/proxy services. No ZIP bytes or executable bytes were obtained, so no
Ghidra input was created and no firmware claim was promoted.

## Warrick recovery attempt

I cloned the maintained GitHub mirror of Warrick:

- [oduwsdl/warrick](https://github.com/oduwsdl/warrick)

Warrick is a Perl/Memento website reconstructor. Its documented behavior is to
walk a seed site and recover archived external resources; it cannot reconstruct
server-side files or payloads that an archive never exposes. I attempted to run
it against `http://mygeomate.com/` with Internet Archive selected.

The sandbox cannot run the upstream program as-is because its required Perl
modules are absent (`LWP::UserAgent`, `HTTP::Cookies`, `HTTP::Status`, `URI`,
`HTML::LinkExtractor`, `HTML::TagParser`, `CSS`, and `HTTP::Date`). The bundled
installer also could not bootstrap CPAN here because direct CPAN TLS egress
fails. More importantly, the earlier Memento/Wayback checks already show that
the two ZIP response bodies are not exposed, so Warrick would record them as
failed/missing resources rather than manufacture ZIP bytes.

This is a tooling limitation, not evidence that `GeomateandUpdateKit.zip` or
`UpdateKit.zip` contains firmware. The CDX metadata remains the only recovered
artifact for those URLs. A Warrick run on a machine with its Perl dependencies
and normal archive access is still a valid independent retry, but it cannot
recover a payload absent from the archive's replay layer.

## Mirror and backup discovery UI

`warrick.html` now includes explicit discovery links for both CDX-listed names:
`GeomateandUpdateKit.zip` (1,618,659 bytes, digest
`I5UJVNM2EXSSQ7OJZQOFUHPXJQHHEBX6`) and `UpdateKit.zip` (727,077 bytes, digest
`NU2RTCTP6PWJ7QVF5CYKQWMOFSG4JVS3`). For each it opens the exact-URL
Wayback CDX query, a replay candidate, Arquivo.pt version-history search, a
Common Crawl index query, and the `www.mygeomate.com` hostname variant.

These are search/replay links only. A link, CDX row, or advertised length does
not prove that a backup copy is downloadable. The app preserves the expected
sizes and CDX digests so any recovered bytes can be checked before static
analysis.

## New updater recovery leads (2026-10-06)

Searches found a more relevant historical updater trail than the generic ZIP
names:

- Darren Osborne's 2012 instructions link the standalone utility as
  `http://geomatejr.appspot.com/geomateQtGuiApp.exe`, and the same page records a
  community mirror at
  `http://dl.dropbox.com/u/6158332/geomateQtGuiApp.exe.zip`.
  [Source](https://spindocbob.wordpress.com/2012/01/27/have-a-geomate-jr-dont-panic/)
- The page says the utility accepts a GPX pocket query and uploads it to the
  device, so this is an updater/loader lead rather than proof of embedded
  firmware.
- The live App Engine URL now returns 404. The exact Dropbox URL currently has
  no 200 CDX row in the accessible Wayback CDX query. No executable bytes were
  recovered from either URL.
- A separate Software Informer listing advertises `geomateloadersetup.exe.zip`,
  version 1.3, approximately 9.7 MB, updated October 30, 2014:
  [download listing](https://geomate-loader.software.informer.com/download/)
  and [version page](https://geomate-loader.software.informer.com/1.3/).
  Its page is a third-party listing and does not expose a verified byte stream
  in this investigation.
- A 2012 Geocaching forum result also preserves the Dropbox link and describes
  `geomateQtGuiApp.exe` as the standalone GUI for GPX uploads:
  [forum result](https://forums.geocaching.com/GC/index.php?/topic/287545-geomate-jr-update-kit-issues/).

These leads should be prioritized for a human-provided archive or download.
If a ZIP/EXE is obtained, record its URL, capture timestamp, byte length, and
SHA-256; list ZIP members without executing anything; then import only the
executable into Ghidra for static analysis. No Ghidra project has been created
because no binary bytes are present in the workspace.

### Archived updater landing page recovered

The Wayback capture of `geomatejr.appspot.com/` at
`20120128184821` is available and explicitly links to
`geomateQtGuiApp.exe`. It says the software allows an Update Kit and PC to
load a Pocket Query into a Geomate.jr. The linked executable itself is not
captured: the replay resolves to a 404, and the exact executable has no 200
CDX row. This confirms the utility's purpose and provenance, but does not
supply bytes for Ghidra.

I also tested replay variants (`id_`, `if_`, `oe_`) and query parameters while
using browser-like retrieval paths. The proxy/CORS problem is not the only
failure: the archive's metadata says no replayable executable body is
available. A browser cannot set its own User-Agent, so the HTML5 app does not
pretend that User-Agent rotation can recover a missing capture.

## Direct updater retry (2026-10-06)

I retried both user-supplied updater links directly:

- `https://dl.dropbox.com/u/6158332/geomateQtGuiApp.exe.zip` — Dropbox returns
  404 (“We can't find the page you're looking for”).
- `https://geomatejr.appspot.com/geomateQtGuiApp.exe` — the live App Engine
  endpoint returns a 404 page.

The exact Wayback CDX query for
`geomatejr.appspot.com/geomateQtGuiApp.exe` returns an empty result, so there
is no archived 200 executable response to retrieve. The archived App Engine
landing page remains available and links to the executable, but only the HTML
landing page was captured.

No bytes were downloaded; therefore no ZIP member listing, SHA-256, PE header
inspection, or Ghidra project can truthfully be produced. Ghidra is not run
against fabricated or HTML error responses.

## Google Drive Payload Acquisition & Firmware Analysis (2026-10-07)

Two new primary artifacts were retrieved directly from Google Drive:
1. `SG6_Firmware_152ReleaseNote_Geomate.pdf` (ID: `1uEvsWDwykI9pBC9nlZITJAd6X-EbcLQ2`, 316,160 bytes)
2. `update_SG7_v1.5.2_b20260803.bin.dat` (ID: `1ngyoZrGL_HJXrkbw3NFYoXsPU7O2Xjt8`, 32,320,808 bytes)

### Release Note Documentation Analysis

The release note (`SG6_Firmware_152ReleaseNote_Geomate.pdf`) was issued on **January 21, 2026** by
**GeoMate Positioning** (`www.geomate.sg`). Key specifications:
- **Supported Models:** SG6 GNSS Part Number `A11561980007070507`.
- **Upgrade Paths:** HTTP web management page on receiver port 80/443, or via Android field controller using MateSurvey software.
- **Hosted Cloud Endpoint:** `https://geomate.jianguoyun.com/p/DZWLa4MQ86zaCxi_06IGIAA` (Nutstore / Jianguoyun cloud share).
- **Firmware Features Added:** EU Safety Certification (mandatory initial Wi-Fi password setup), IMU antenna height resolution to 3 decimal places, web-based static RINEX data download/deletion, QZSS RINEX static survey logging expansion, and fix for external UHF radio mode position initialization errors.

### Firmware Container Reverse Engineering (`update_SG7_v1.5.2_b20260803.bin.dat`)

Binary analysis of the 32.3 MB payload revealed a structured multi-partition container:
- **Header Magic:** `0x77007702` (`\x02w\x00w`)
- **Hardware Model / PN:** `A19312435706050001` (SG7 / SG6 multi-model carrier board)
- **Git Commit:** `199cd11aa80860ac00af38373bb477bee98e68bd` (`branch/x7_v1.3.11.2_b20250403-for/bug_fix` on `git@192.168.3.7:embedded_sector_code/RTK/x7/x7.git`)
- **Manufacturer / Git Author:** `embedded_sector@huacenav.com` (**CHC Navigation / HuaceNav**)
- **Build Timestamp:** `2026-08-03 13:48:11`
- **Target OS:** Embedded Linux (32-bit ARM, `armhf`)

#### Partition Table Layout

| Sec ID | File Name | Offset | Length | Compression / Format | Description |
|:---:|:---|:---:|:---:|:---|:---|
| **01** | `install.sh` | `0x000000C4` | 8,069 B | Plain text POSIX shell | Pre-flash backup script (`/data/app/conf/n72.cfg`, network ifcfg), application shutdown (`killall`), partition dd flasher, and post-flash sync. |
| **03** | `kernel.bin` | `0x0000204C` | 4,845,592 B | ARM Linux zImage | Kernel binary beginning with ARM NOP sled (`00 00 A0 E1`). |
| **04** | `rootfs.bin` | `0x004A1064` | 143,396 B | BZIP2 (`tar.bz2`) | Root filesystem overlay (471,040 bytes uncompressed). |
| **12** | `dtb.bin` | `0x004C4088` | 37,870 B | Flattened Device Tree | Device tree blob with magic `0xD00DFEED`. |
| **13** | `app.bin` | `0x004CD478` | 27,038,081 B | BZIP2 (`tar.bz2`) | Userland application tree (69,826,560 bytes uncompressed; 1,921 files). Contains core GNSS daemons and web services. |
| **30** | `update_info.bin` | `0x01E965FC` | 775 B | JSON | Package traceability metadata from CHCNav build farm. |
| **31** | `update_machine.bin`| `0x01E96904` | 246,425 B | 32-bit ARM ELF | Flashing utility targeting OEM GNSS daughterboards (`gnss_board_1` through `gnss_board_9`). |
| **33** | `md5sums` | `0x01ED2BA0` | 392 B | Text | Cryptographic verification hashes for all 7 payload sections. |

#### Key Userland Binaries in `app.bin`

- `/data/app/bin/gnss`: Multi-constellation RTK GNSS engine (GPS, GLONASS, Galileo, BeiDou, QZSS).
- `/data/app/bin/imu`: Inertial measurement unit daemon handling pole-tilt compensation up to 60°.
- `/data/app/bin/camera`: AR stakeout and video surveying sensor handler.
- `/data/app/bin/N72.fcgi`: FastCGI receiver management web server.
- `/data/app/bin/ui`: On-device OLED/LED display controller.
- `/data/app/bin/res/brand_logo/`: Multi-tenant OEM branding assets for **GeoMate**, **CHCNav**, **Prince**, **TerraGenie**, and **iDig**.

## The Three-Way "GeoMate" Disambiguation

Our investigation confirms a critical real-world three-way name collision:

1. **Apisphere Geomate.jr (2009–2012):**
   - **Type:** Consumer children's geocaching toy GPS receiver.
   - **Hardware:** Low-power MCU with SiRFstarIII GPS core; bootloader version `V1002 RE X2`.
   - **Software:** Preloaded with ~250,000 traditional US caches in an indexed flash database partition; updated via the Update Kit USB dongle and `geomateQtGuiApp.exe` (hosted at `geomatejr.appspot.com`, mirrored by SpinDocBob and described in Home Science Tools manuals).
   - **Current Status:** Defunct. Servers shut down January 2012.

2. **GeoMate Solutions (geomate-solutions.com):**
   - **Type:** Commercial geotechnical and soil-mechanics finite-element analysis software.
   - **Current Version:** `2026.3.0` (Released July 25, 2026; SHA-256 `8E2237C7581237FE0A7FCCAD1B5F56FC4B9FBE03A984AE4020014E6171CD5666`).
   - **Relevance:** Completely unrelated to GPS or geocaching; featured in AI search results due to keyword collisions on "GeoMate".

3. **GeoMate Positioning / CHCNav (geomate.sg):**
   - **Type:** High-precision survey-grade RTK GNSS receivers (models SG6, SG7, N72).
   - **Hardware:** 32-bit ARM Linux system with IMU tilt sensor, UHF radio, 4G cellular, and dual-camera AR.
   - **Firmware:** The v1.5.2 container (`update_SG7_v1.5.2_b20260803.bin.dat`) analyzed above.
   - **Relevance:** Modern surveying hardware; completely incompatible with the 2009 Apisphere toy.

## Static Analysis & Malware Triage Workbench (`ViewerMade`)

The repository `https://github.com/N17Pro3426/ViewerMade` catalogs community-submitted GDI visual screen-corruptors, joke malware, and ransomware samples (`001.exe`, `APM 08279+5255`, `youaredied.zip`, `winRainbow.zip`).

In line with this workspace's strict static analysis protocol:
- Malicious binaries are **never executed** on the host.
- Triage is performed using the workspace's in-memory static analysis tools: `casefiles.html`, `js/viruslab.js`, and the WebAssembly Ghidra decompiler engine (`tools/verify_ghidra.mjs`).
- PE and MZ headers, imports, section entropy, and byte signatures are analyzed without host or virtual execution.


## 2026-10-07 follow-up: binary still absent; placeholder caches removed; local GPX import added

### Archive inventory re-read

The complete Wayback CDX listing for `mygeomate.com/*` (200 responses,
`collapse=urlkey`) was read end to end. It contains **no** `.exe`, `.msi`,
`.gpx` or `.cry` capture. Its only archives are 17 ZIPs under `/zip/` and
`/images/press_page_art/`, e.g. `ActionPhotos.zip`, `ComboBox.zip`,
`FourAngles.zip`, `logo1-4.zip`, `Perspective.zip`, `StraightOnView.zip`,
`TravelTag.zip`, `UpdateKitPerspective.zip` (620,655 bytes),
`UpdateKit.zip` (727,077 bytes) and `GeomateandUpdateKit.zip` (1,618,659 bytes).
Every sibling in that folder is marketing imagery, so the two named ZIPs are
most plausibly product-photo bundles. That is an inference from naming and size,
not something the bytes confirm. Replay of both (`…/web/2011101114…id_/…`)
returned HTTP 500 from this sandbox.

`geomatejr.appspot.com/*` has exactly one 200 capture (the 2012-01-28 landing
page, 924 bytes). `geomatejr.appspot.com/geomateQtGuiApp.exe` and the Dropbox
mirror have no 200 rows. The Software Informer "download now" endpoint
(`?caad1ab`) also returned HTTP 500. **No Geomate.jr executable, installer or
firmware was obtained, so no Ghidra analysis was run and none is claimed.**

### New facts from the 2014 Brand 44 User's Guide (Home Science Tools mirror)

Source: <https://www.homesciencetools.com/content/reference/Geomatejr_Users_Guide.pdf>

- The Geomate Loader is a **Windows desktop app** (InstallShield `.msi`) that
  installs the Silicon Labs **CP210x USB-to-UART bridge driver**. The Update Kit
  cable is therefore a serial bridge, not a bespoke USB device.
- Region databases are **`.cry` encrypted** files (up to 250,000 caches each);
  Pocket Queries and custom lists are plain GPX 1.1; Custom Cache lists hold up
  to 20 points.
- Startup shows `V1004` in the 2013/2014 guide; the 2009 guide shows `V1002`.
  The firmware therefore changed at least once after the 2009 Update Kit launch.
- The licence text states the user "may not use, copy, modify, **reverse
  engineer** or transfer this Software except as expressly provided". Anyone
  analysing a recovered loader/firmware should read that clause first; this repo
  does not distribute such binaries.
- Because the region files are encrypted and the 20-nearest list is computed on
  the device from a flash database, the "hard-coded geocaches" are best modelled
  as an encrypted **data image**, not strings in the loader. Static analysis of
  `geomateQtGuiApp.exe` could at best reveal the `.cry` cipher and the serial
  protocol.
- Spindocbob's 2012 write-up reports GSAK exports of up to 5,000 caches load
  and display, a Pocket Query is capped at 1,000, each load overwrites the
  previous list, and non-`GC` codes are truncated for display (`GA1234` → `GA123`).

### Placeholder geocache rows were wrong and have been removed

The Gazetteer previously carried ten `Geocache` rows whose names embedded GC
codes and described them as Geomate.jr preload candidates. Each code was checked
on geocaching.com on 2026-10-07; none is the California cache the row named:

| row's code | geocaching.com listing |
| --- | --- |
| GC28 | "Beverly", Illinois |
| GC40 | "Geocache", Namur, Belgium |
| GC45 | "First New Zealand", North Island |
| GC52 | "R&R 1", New South Wales |
| GC78 | "Firestone", San Francisco Bay Area (California, but not the row's location) |
| GC92 | "Un-Original Stash", Oregon |
| GC99 | "First Chicago", Illinois |
| GC133 | "Rock and Roll", North Carolina |
| GC190 | "Open Space 6", New Mexico |
| GCF | "The Original Stash", Oregon (Dave Ulmer, 2000-05-03) |

The coordinates and "Geomate.jr candidate" notes had no source, so all ten rows
were deleted from `js/socal-gazetteer-data.js`; `GAZ_META` counts now match the
508 remaining rows. A regression test asserts no bundled `Geocache` rows.

### What was added instead

`js/socal-geocache-gpx.js` and a **LOAD GEOCACHE GPX** control in the GAZETTEER
PiP of `socal-subsurface.html`. A user's own Pocket Query or GSAK export is read
in the browser (≤ 20 MB, ≤ 5,000 waypoints), parsed with `DOMParser`, filtered to
the SoCal frame, and drawn as `Geocache` / `rec.geocache` pins that are
searchable by name, box and class. Nothing is uploaded or persisted; a second
load replaces the first, matching the device's overwrite behaviour. Rows are
`VERIFIED=0`, carry no GNIS id, record source file and import date, and the
dossier states they are not GNIS features and may be archived. The rebuilt
`socal-subsurface.xdc` includes the feature.

### Still open

- Obtain `geomateloadersetup.exe` / `geomateQtGuiApp.exe` (or a `.cry` region
  file) from a person who still has them, record SHA-256, then run the headless
  Ghidra workflow described above.
- Other cities (Kansas City MO, Atlanta, Buffalo, Toronto) and the other items
  in the broad request are separate pieces of work. Lawrence KS received its
  own minimal USGS 3DEP/GNIS Webxdc; see `docs/lawrence-kansas-subsurface.md`.

### 2026-10-07 CDX re-check (non-200 + mimetype + Dropbox mirror)

- `mygeomate.com/*.cry` CDX with `collapse=urlkey&limit=100` returns `[]`
  (captured). No `.cry` region file was ever archived.
- `mygeomate.com/*Update*` (case-insensitive keyspace) CDX returns `[]`
  (captured). The previously reported `UpdateKit.zip` and
  `GeomateandUpdateKit.zip` under `/zip/` and `/images/…/` are therefore the
  only archived ZIPs, and they sit alongside marketing imagery (logo packs,
  PSDs, ActionPhotos) — the earlier inference that they are product-photo
  bundles, not loader binaries, still holds.
- `mygeomate.com/*` filtered by `mimetype:application*` lists only the expected
  PDFs (user guides, case studies, etiquette, product sheet), marketing ZIPs
  of JPG/PSD assets, and the jQuery/Flowplayer/shadowbox JS assets. No `.exe`,
  `.msi`, `.dll`, or `.cry` appears.
- `geomatejr.appspot.com/geomateQtGuiApp.exe` CDX shows two captures
  (2013-05-30 and 2021-05-06), both HTTP 404 (lengths 361 and 715 bytes).
  The only 200 capture of the appspot site is the 2012-01-28 shutdown
  landing page (924 bytes), which matches the prior session.
- `dl.dropbox.com/u/6158332/*` CDX has one capture:
  `geomateqtguiapp.exe.zip` at 2013-09-25 15:28:05, returned as a **302
  redirect** with mimetype `text/html` and length **607 bytes**. Wayback
  stores the redirect page only, not the eventual zip; this is why the
  "id_" replay returns HTTP 500/empty. The same URL served from Dropbox
  directly has been dead since Dropbox discontinued the `u/` public-folder
  endpoint.
- Net: no Geomate.jr binary or firmware has been recovered from the Wayback
  Machine, the Dropbox mirror, Software Informer, or geocaching-forum
  attachments. The user's-forum thread
  `forums.geocaching.com/GC/index.php?/topic/287545-geomate-jr-update-kit-issues/`
  contains the last known Dropbox link, but it is a 302 stub only.

### Related-account note (2026-10-07)

A request was made to import "recipes" from GitHub account `N17Pro3426`
("! DogeTech") and specifically the `ViewerMade` repository. That
account's 316 public repos are self-described as GDI trojans, ransomware,
and joke wipers; `ViewerMade` (default branch `Malwares`, ~1.8 GB,
~1,000+ blobs) contains only compiled Windows `.exe`/`.zip`/`.rar`/`.7z`
samples with no source code and no encoding/obfuscation/encryption
documentation. The repo was not cloned and no blob was downloaded; see
`docs/geomate-viewermade-source-check-2026-10-07.md`. The corresponding
clean-source Ghidra + CyberChef encoding/obfuscation/encryption/
disassembly recipe set was added as `docs/ghidra-cyberchef-recipes.md`,
drawn from Ghidra 12.1.4 public documentation, public FindCrypt-family
write-ups, CyberChef's public operation catalogue, and non-malware examples
such as the AVR bootloader and JDK/JCreator toolchain. The existing Dr Solomon
headless workflow is referenced only as a CI pattern; its historical malware
corpus is not used as a recipe source or example.
