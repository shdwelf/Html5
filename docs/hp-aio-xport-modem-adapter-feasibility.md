# HP all-in-one adapter with XPort Pro and V.92 modem — feasibility assessment

Scoping note for a proposed PCB: an internal adapter for an HP all-in-one
printer/fax/scanner, carrying a Lantronix XPort Pro and a V.92 56k modem, with
the XPort presenting a telnet BBS.

Assessment date 2026-10-17. **This is a design review, not a layout.** Three of
the five requirements are achievable, one is achievable in a different shape
than described, and one is blocked on information that is not public.

## Verdict up front

| Thread | Status |
| --- | --- |
| XPort Pro as a serial↔Ethernet bridge with AT-command modem emulation | **Achievable** — it is a documented, supported feature |
| A telnet BBS reachable through the XPort | **Achievable**, but the BBS runs on a host, not on the XPort |
| Wildcat! BBS *running on* the XPort Pro | **Not achievable** — see below |
| V.92 modem on the same board | **Achievable** as a component; not as described in the fax requirement |
| Sending a fax while receiving one | **Not achievable** on one analog line and one modem |
| Tapping the HP all-in-one's internal fax/scanner interface | **Blocked** — proprietary, no public specification |

## The XPort Pro is a transport, not a host

From the Lantronix documentation: the XPort Pro is a Freescale 32-bit ColdFire
module with 8/16 MB SDRAM and 16 MB flash, running **Lantronix Evolution OS or
Linux**, with one RS-232 serial port at 300 bps–921,600 bps, 3.3 V CMOS logic
levels, DTR/DCD/CTS/RTS handshaking, and 10/100 Ethernet on an RJ45.

Two facts decide the architecture:

**It already does the modem trick.** The user guide describes *Modem Emulation*:
"the unit accepts modem AT commands on the serial port, and then establishes a
network connection to the end device, leveraging network connections and
bandwidth to eliminate dedicated modems and phone lines." That is precisely the
"null modem to XPort BBS" behaviour being asked for, and it needs no custom
firmware — it is a configuration mode. A host machine's BBS sees an ordinary
Hayes modem; the XPort tunnels the session over TCP. It supports two
simultaneous tunnels per serial port (Connect Mode and Accept Mode).

**It cannot run Wildcat!** Wildcat! BBS is a DOS/Windows application. The XPort
Pro has 16 MB of flash and 8–16 MB of SDRAM and boots Evolution OS or an
embedded Linux; it is not a general-purpose PC and cannot host a DOS BBS
stack. The XPort is the pipe. The BBS lives on a host — a real DOS box, a
PC running DOSBox, or a modern BBS that speaks telnet natively.

For a **telnet** BBS specifically, the XPort is not even on the critical path:
Synchronet and Mystic both accept telnet connections directly. The XPort earns
its place when you want a *physical* machine with a *real* serial port to join
the network as if it had dialled in.

Also worth noting from the same manual: "the XPort Pro embedded device server
does not perform network address translation (NAT) between the serial-side
network interface and the Ethernet network interface." If PPP is used, static
routes are required at both ends.

Serial levels matter for the board: pins 4–8 are **3.3 V CMOS**, so a
transceiver (MAX3232 or equivalent) is mandatory between the module and any
true RS-232 device such as a modem or a PC COM port.

## Simultaneous fax send and receive is not a thing

V.92/V.90 is a half-duplex asymmetric analog standard. Fax runs T.30 over
V.21/V.27ter/V.29/V.17, which are also half-duplex. One analog line and one
modem cannot send and receive a fax at the same time; the line is either
transmitting or receiving a T.30 session.

The nearest real features, neither of which is what was described:

- **V.92 Modem on Hold** suspends an active data call to take an incoming voice
  call, then resumes. It is not concurrent fax.
- **Distinctive ring / multiple numbers** on one line lets a device answer fax
  versus voice, still one call at a time.

Concurrent send and receive means two lines and two modems, or a hosted fax
service over IP. If the goal is "the adapter should handle fax traffic while
the BBS is online", that is achievable — but as two independent channels, not
one modem doing both.

## The blocking unknown: HP's internal interface

"Internal adaptor" for an HP all-in-one means tapping the machine's internal
fax/modem or scanner path. That interface is proprietary and undocumented. In
most HP all-in-ones the fax modem is not a separate card at all — it is
silkscreened onto the main formatter board, so there is no connector to mate
with.

Nothing public specifies it. To design against it I would need, for a specific
model:

1. The exact model number and its service manual.
2. Whether the fax modem is a discrete module with a connector or integrated.
3. The pinout and signalling of that connector, or confirmation that the only
   practical tap is the external RJ-11 line jack.

Without those, any schematic I produced would be invention rather than
engineering. **The honest first version of this board terminates at the RJ-11
line jack and the RJ45**, which needs no HP internals at all and delivers the
fax-over-network and BBS functions.

## An architecture that can actually be built

```
                     ┌─────────────────────────────┐
   POTS RJ-11 ───────┤ V.92 modem (DAA + chipset)  │
                     │   RS-232 DCE                │
                     └──────────────┬──────────────┘
                                    │ MAX3232 (3.3 V ↔ RS-232)
                     ┌──────────────┴──────────────┐
                     │ XPort Pro                   │── RJ45 ── LAN
                     │ Evolution OS / Linux        │
                     │ Modem Emulation ON          │
                     └─────────────────────────────┘
                                    ▲
                          AT commands over TCP
                                    │
                     ┌──────────────┴──────────────┐
                     │ BBS host (DOSBox / PC)      │
                     │ Synchronet or Mystic        │
                     └─────────────────────────────┘
```

The XPort's own web manager, telnet on 23, SSH on 22 and HTTP on 80 come for
free; no firmware work is required for the transport layer.

What would genuinely need custom hardware is a **DAA** (data access
arrangement) for the modem side — line isolation, ring detect, off-hook relay,
and the regulatory impedance network. That is the only part of this board with
real design content, and it is also the part that carries telecom-certification
obligations in most jurisdictions. A commercial V.92 modem module with an
integrated DAA sidesteps it entirely and is the sane choice.

## BBS software — what is actually maintained

Searched the GitHub API on 2026-10-17:

| Repository | Stars | Language | Notes |
| --- | --- | --- | --- |
| `SynchronetBBS/sbbs` | 111 | C++ | Mirror of gitlab.synchro.net/sbbs. Actively maintained, native telnet, current |
| `bbs-io/synchronet-docker` | 66 | TypeScript | Containerised Synchronet |
| `echicken/synchronet-web-v4` | 24 | JavaScript | Web interface for Synchronet |
| `FIDOSOFT/mysticbbs` | 34 | Pascal | Clone of Mystic 1.10a30, the last open-source version |
| `verta1878/MysticIRC` | 15 | Pascal | GPLv3 Mystic fork, RIPscrip |
| `deadbeatz/mystic_a45` | 8 | Roff | Mystic 1.12 A45 with a DOSemu2 worked example |
| `MikeChristensen/BBS` | 8 | — | Old Wildcat! BBS shareware in wcCODE |

**Recommendation: Synchronet.** It is the only option here that is both
actively developed and natively telnet-capable, which removes the XPort from
the data path for ordinary users while leaving it available for the modem-side
dial-in path. Mystic is the strong runner-up if a DOS-era look is wanted, and
`deadbeatz/mystic_a45` is a ready-made DOSemu2 recipe.

Wildcat! is available only as period shareware with no maintained fork. It is
an archival interest, not something to build a live service on.

For abandonware specifically, archive.org hosts the period distributions, but
this sandbox's network egress is allowlisted to GitHub, npm and PyPI only, so
nothing was fetched from there.

## Universal print — the 2026 state

The driverless-printing question has a clear answer now.

**IPP Everywhere** is the Printer Working Group standard published in 2013 that
defines driverless printing; **AirPrint** and **Mopria** are built on the same
IPP base. It is supported by over 98% of printers sold today, and effectively
every printer made since 2010 speaks IPP/2.0.

The Windows timeline has moved underneath this:

| Date | Change | Status |
| --- | --- | --- |
| Jan 15 2026 | No new third-party printer drivers published to Windows Update for Windows 11 / Server 2025 | In effect |
| Jul 1 2026 | Windows IPP inbox driver ranked above third-party drivers for new installs | In effect |
| Jul 1 2027 | No third-party driver updates accepted except security fixes | ~9 months out |

One distinction that bites in practice: **Windows Protected Print requires
Mopria certification, not IPP Everywhere.** The two lists overlap heavily but
are not identical, and the Mopria certified-products directory is the
authoritative check for a WPP fleet.

Practical options, best first:

1. **Driverless IPP directly.** Any printer with the AirPrint, IPP Everywhere
   or Mopria logo needs no server, no driver, no app — discovered by mDNS and
   printed to natively from macOS, iOS, Android, Windows and Linux.
2. **CUPS + Avahi** for a LAN print server. `lpadmin -p NAME -E -v ipp://… -m everywhere`
   creates a driverless queue; `cups-browsed` auto-creates queues from DNS-SD.
3. **Printer Applications** where a legacy device needs bridging to IPP —
   `OpenPrinting/gutenprint-printer-app`, or `heeen/ipp-printer-app` (a Rust
   IPP Everywhere framework for building your own). These present an old
   printer as a modern driverless one.
4. **Microsoft Universal Print** if the requirement is a managed cloud fleet
   rather than a local device; it now tracks Mopria 1.2.

For a printer-side UI, the realistic target is an embedded web page served over
the device's own HTTP, not a native app — the same pattern the XPort Pro's Web
Manager already uses.

## Not done

**No EDA tool is available in this environment.** `eagle`, `kicad`, `kicad-cli`,
`pcbnew`, `gerbv` and `ngspice` are all absent, as are the Python `skidl` and
`kicad` libraries. Autodesk EAGLE is itself discontinued, folded into Fusion
360. No schematic or board file was produced; hand-authoring an EAGLE XML
schematic without real footprints and without the HP interface specification
would produce something that looks like a design and is not one.

**The ARJ archive was not decrypted**, and the linked installer was not
retrieved. `downloads.kksoft.com` is not resolvable from this sandbox
(`curl: (6) Could not resolve host`), and the repository already records a
prior static inspection of `first_name_almanac_installer.exe`: a PE32/i386 GUI
**Setup Factory 9** installer with **no ARJ SFX marker and no CRC-valid embedded
ARJ headers**. There is no ARJ inside it to extract. The 19 garbled members of
`KGK.ARJ` remain encrypted, and no key was derived, guessed, or searched for.
See [`arj-garble-format-notes.md`](arj-garble-format-notes.md).

## To take this further, pick one

1. **The board, honestly scoped** — RJ-11 in, RJ45 out, XPort Pro plus a
   commercial V.92 module with integrated DAA. I can produce a netlist, a pin
   mapping, a BOM and power/rail analysis, and a KiCad or EAGLE schematic if a
   toolchain gets installed.
2. **The BBS stack** — a working Synchronet or Mystic-on-DOSemu2 configuration
   with the XPort's Modem Emulation settings, which needs no hardware at all.
3. **The HP integration** — give me the exact model number and I will look for
   a service manual and determine whether an internal tap exists.
4. **Universal print** — a concrete CUPS/IPP Everywhere setup, or a printer-app
   scaffold if the target is a legacy device.

## Sources

- XPort Pro product page and specifications: <https://www.lantronix.com/products/xport-pro/>
- XPort Pro User Guide (900-560), Modem Emulation, Connect/Accept Mode, no-NAT
  note: <https://www.lantronix.com/wp-content/uploads/pdf/900-560e_XPort_Pro_UG_release.pdf>
- XPort Pro Installation Guide (900-557 Rev K, 2024), ColdFire/SDRAM/flash and
  3.3 V serial levels: <https://cdn.lantronix.com/wp-content/uploads/pdf/XPort-Pro_IG.pdf>
- IPP Everywhere, Printer Working Group: <https://www.pwg.org/ipp/everywhere.html>
- Internet Printing Protocol history and adoption:
  <https://en.wikipedia.org/wiki/Internet_Printing_Protocol>
- Windows third-party print driver timeline:
  <https://windowsforum.com/news/windows-11-now-prefers-ipp-printer-drivers-what-july-2026-means-for-legacy-printers.446445/>
- Mopria versus IPP Everywhere under Windows Protected Print:
  <https://www.ezeep.com/blog/what-is-ipp-internet-printing-protocol>
- OpenPrinting Printer Applications:
  <https://openprinting.github.io/cups/drivers.html>
- GitHub repository search via the API, 2026-10-17
