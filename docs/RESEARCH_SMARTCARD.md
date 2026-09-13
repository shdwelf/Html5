# Smartcard + recovery research: what each linked resource is, and what the project takes from it

Every link the task order named, visited for real on 2026-09-12/13 through the
channels this checkout has (sandbox: GitHub API + codeload + `fetch_page`;
Wayback: `fetch_page` CDX + snapshot reads; live-web binaries: the Actions
runner via `.arena-archive/`). Dead ends are recorded, not hidden.

## 1. OpenSC — https://github.com/OpenSC/OpenSC

Open source smart card tools and middleware (PKCS#11 / MiniDriver). 3084
stars, LGPL-2.1, actively pushed (2026-09-10 at visit time). Source layout
(`src/`): `common libopensc minidriver pkcs11 pkcs15init scconf sm smm tests
tools ui`.

- `src/libopensc/` carries one driver per card family, including
  `card-cardos.c` (Siemens/Atos CardOS — the "cardos" in this thread's
  JavaCardOS work), `card-isoApplet.c`, `card-muscle.c`, `card-authentic.c`,
  plus `apdu.c` / `asn1.c` — the ISO 7816-4 framing our applets answer.
- `src/tools/` carries the user-facing CLIs (`cardos-tool`, `cryptoflex-tool`,
  `openpgp-tool`, `opensc-explorer`, …).

What the project takes: the APDU interop target. The applets in
`samples/javacard/` speak plain ISO 7816-4 (`SELECT`, INS/P1/P2/Lc/Le,
`9000`/`6D00`/`6700`), so `opensc-explorer` can drive them on real hardware
with no project-specific tooling; the PIV cookbook recipe maps onto OpenSC's
PIV support 1:1. Nothing is vendored (LGPL source stays upstream).

## 2. PyMAKInt — https://github.com/s3c/PyMAKInt

Reverse-engineered driver for the MAKstripe USB magstripe reader (the vendor
family this whole thread started from: MAKInterface). Single commit, 2016,
4 Python files + `.MAG` swipe captures (`woodlands_bulk/`, `woodlands_paid/`).
Retrieved in full via codeload (259,193-byte tarball) and read, not vendored
(the repo carries no license file).

Protocol facts (from `pymakint.py`): 38,400 baud serial; `?` returns a 15-byte
`MSUSB…` version string (tested on reader `MSUSB CZ.090211`); `R` + track mask
(`TRACK1=0x01 TRACK2=0x02 TRACK3=0x04`) returns `Ready`, then on swipe `RD `,
a 2-byte tick count, the raw timing words, and `RD=OK`. `pymagpar.py` decodes
F2F bitstreams from the timings; `pymakcli.py` reads/writes/formats/erases and
talks to the reader EEPROM. Relevant to the meal-card app: a MAKstripe-class
reader is exactly what swipes a magstripe meal card at a till; the app's
voucher codes are the fallback for cards/tills without one.

## 3. BasicCard / ZeitControl — https://www.basiccard.zeitcontrol.de/download.htm

ZeitControl's BasicCard: an inexpensive BASIC-programmable smart card
(ZC-Basic, "amphibious" — the same language writes the PC terminal program
and the card program, which talk ISO 7816-4). Compact card 1K EEPROM,
Enhanced 8K; ECC needs the Enhanced (page quotes $4.35 in small quantities).

Wayback state: only the site root is captured
(`20240329070603 https://basiccard.zeitcontrol.de/`, page text retrieved and
quoted above); `download.htm` itself was never archived, nor any download.
The live page is queued for the Actions runner (`direct:` line in
`.arena-archive/requests.txt`) so the current ZC-Basic/toolchain links can be
followed up from real bytes rather than memory.

What the project takes: the two-program model. The cookbook conversion
(`tools/cookbook_to_javacard.mjs`) splits every recipe into card side
(`samples/javacard/*.java`) and terminal side (JavaOS program, e.g. the
meal-card page) across the same ISO 7816 boundary BasicCard documents.

## 4. digital-laboratory.de — http://www.digital-laboratory.de/

A MAKInterface-ecosystem download site, well archived. CDX inventory (all
`statuscode:200`, collapsed by URL):

| capture | file | note |
| --- | --- | --- |
| 20000417211846 | `MAKI.RDC` | MAKInterface-related doc/data |
| 20001003210840 | `MAGSR099.ZIP` | magstripe-reader software |
| 20010406204242 | `PCSC.TXT` | PC/SC notes |
| 20001003210216 | `UCE32.ZIP` | card utility |
| 20010619081503 | `SCE-202.ZIP` | card utility |
| 20001003210250 | `VB6LIB.ZIP` | VB6 reader library |
| 20001003210632 | `FT50V099.ZIP` | FT50 programmer software |
| 20010616153533 | `GK-102.ZIP` | programmer software |
| (+ `FT50MOD.TXT FT8000.TXT FT8100.TXT GSME201D.ZIP UNIVV100.ZIP SOFTREP.ZIP UCEBETA5.ZIP ICR2V101.ZIP ICQ7V105.ZIP read107s.zip` inventoried, not queued) |

The first eight are queued in `.arena-archive/requests.txt` under
`samples/archive/digitallab/`. Sizes are omitted (the index query returned no
`length` column for this host), so the fetch log's sha256 + ZIP self-check is
the integrity evidence, not a size band.

## 5. GL-iNet MT300N-V2 firmware

The exact file named in the order,
`firmware/mt300n-v2/testing/openwrt-mt300n-v2-3.204-1112.bin`, is **not** in
the Wayback Machine: the only capture (`20250622064640`) is a 1,264-byte
`404`. Nearby builds *are* archived (prefix query, `statuscode:200`), e.g.
`v1/openwrt-mt300n-v2-3.203-0805.bin` (`20221217212147`, 12,537,312 bytes),
`v1/…-3.211-1227.bin`, `temp/…-3.216-0725.bin`, and the `release4/4.3.x`
series (~14.5 MB each).

Queued both ways: the closest archived build (`3.203-0805`, the release just
before the requested testing build) via the `id_` channel, and the exact
requested testing URL live via the runner (`direct:` line). The MT300N-V2 is
a MediaTek MT7628 (MIPS) box: Ghidra handles MIPS, the AVR walk does not, so
analysis of these bytes belongs to a Ghidra-headless follow-up, not to
`tools/ghidra_avr.mjs` — see `docs/GHIDRA_COOKBOOK.md`.

## 6. Warrick — https://github.com/oduwsdl/warrick

ODU WS-DL "website reconstructor" (McCown 2006, Brunelle 2011): Perl5 +
cURL + Memento aggregation. `perl warrick.pl --help`; a recovery writes
`RECO_NAME_recoveryLog.out` lines of `ORIGINAL URI => MEMENTO URI => LOCAL
FILE`, `FAILED`-prefixed on misses, plus a resumable `PID_SERVERNAME.save`.
(README retrieved via codeload.) This project's `.arena-archive/` channel is
the same idea narrowed to firmware: request list in, verified bytes +
`fetch.log` out.

## 7. Warnick — https://github.com/molivil/warnick

Oliver Molini's bash re-implementation for Protoweb.org (2011–2022, latest
`v2.1.4-3`, "inspired by warrick.pl"): mirrors a domain from the Wayback
Machine at a target date using bash + wget + curl. **License warning that
matters to a corporation: CC BY-NC-SA 4.0 (non-commercial).** The kitchen
project does not vendor or run it; it documents the invocation shape
(`warnick.sh` + `sites/` dir) for the archivist's own licensed use.

## 8. waves-exchange — https://github.com/waves-exchange

GitHub org: "Decentralized exchange on the top of Waves blockchain",
25 public repos, created 2019-10-14. Studied for settlement UX (order
placement, balance display), not for code: the meal-card ledger is a
corporate till system, not a DEX, and takes no dependency on it.

## 9. PirateOcean — https://github.com/PirateNetwork/PirateOcean

Pirate-Qt, "a Qt native wallet for ARRR (Pirate)", Windows/Linux/macOS;
forked from MrMLynch/PirateOcean, KomodoOcean-based, **archived read-only
2020-12-19**. Wallet UX studied (one balance, send/receive, memo, address
book) and credited in the meal-card page; no code taken (a Qt/C++ Zcash-fork
wallet has no reusable part for an offline HTML5 till ledger, and the page
says plainly that there is no shielded pool here).

## 10. dr7.com — the DSS Research site

Satellite/DBS/DVR/HDTV/IPTV + nagravision/nds/kudelski/smart-card categories,
1998–2016 captures. The file bins (`dssfiles/`, `echofiles/`) hold period AVR
development tools that overlap this project's MCU list (AT90S parts). Queued
— development tools and docs only, per the firmware+docs policy (the two
policy questions were dismissed twice, so the recommended default stands):

| capture | file | bytes |
| --- | --- | --- |
| 20000915224717 | `echofiles/avrprogrammer.zip` | 51,425 |
| 20000915224203 | `echofiles/avrsetup.zip` | 71,032 |
| 20000915223903 | `echofiles/avrskels.zip` | 2,325 |
| 20000915225218 | `echofiles/disavr121.zip` | 19,199 |
| 20000915224545 | `echofiles/at90sart.zip` | 9,920 |
| 20000915230604 | `dssfiles/newbieprogramming.zip` | 7,410 |
| 20000915230800 | `dssfiles/prginst.zip` | 6,151 |
| 20000915230656 | `dssfiles/99info.zip` | 30,023 |
| 20000915224055 | `echofiles/esfaq103199.zip` | 24,999 |

Deliberately **not** queued: key/blocker/enabler material (`avrkeys.zip`,
`blocker*.zip`, `enabler2.zip`, `e8515chev.zip`, …) — circumvention tooling,
out of scope for a building-security + kitchen project. The inventory above
is the honest record that they exist and were passed over.

## 11. hackhu.com

Two eras in one domain. The 2000–2006 era is satellite-case research: court
filings (`…_McKenzie_Complaint.pdf`, `…_summary_judgment_against_clifford_jones.pdf`,
`11thcircuit.pdf`), an `analysis/*.txt` series, and — the gem for this
project — `9pincom.htm` (serial-port notes, the era's programmer plumbing).
The 2024+ era is a repurposed French spam blog (unrelated content under the
same name). Queued: `9pincom.htm` (`20010411043206`) and `about.htm`
(`20010605001856`); the legal PDFs stay inventoried-but-unqueued (court
records, not firmware).

## 12. satellitemurach.com

Negative result, checked three ways: CDX (`matchType=domain` and `exact`)
returns HTTP 500 for the domain, the availability API rate-limits (429), and
both `http://` (2020) and `https://` (2024) snapshot reads answer "The Wayback
Machine has not archived that URL." Nothing to queue. If the domain ever
resolves live, the `direct:` channel in `.arena-archive/fetch.py` is the way
back — but as of 2026-09-13 there is no archived copy to recover, with or
without Warrick.
