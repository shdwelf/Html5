# Telnet BBS behind an XPort Pro — what was built and what to deploy

Companion to [`hp-aio-xport-modem-adapter-feasibility.md`](hp-aio-xport-modem-adapter-feasibility.md).
This records what actually runs, what could not be built here and why, and the
configuration for the real hardware.

## What was built

`tools/bbs/telnetbbs.py` — a telnet BBS in pure Python stdlib. No dependencies,
no package installs, so it runs anywhere Python 3.8+ does.

It is not Synchronet and does not pretend to be. It exists for two reasons:
Synchronet cannot be built in this sandbox (below), and the XPort Modem
Emulation path needs something on the far end that speaks **plain serial
bytes** rather than telnet framing. DOS-era BBS software only knows serial
ports, so a listener that assumes telnet negotiation will misbehave behind the
XPort.

The design rule is: **negotiate only what the peer initiates.** Nothing is
offered that was not asked for, so one listener serves both cases.

Features: CP437/ANSI rendering, line editing, persistent accounts and message
base under a JSON state file, file list, user list, system info, caller count,
clean `NO CARRIER` hangup.

## What was verified

Started with `--port 6400 --data /tmp/bbsdata`, then driven over a real socket
twice — once as a telnet client that negotiates, once as raw serial that does
not:

```
=== path 1: direct telnet (peer negotiates) ===
  telnet         negotiated 3 IAC replies: 255/251/1 255/251/3 255/253/31
      main menu rendered     PASS
      file area listed       PASS
      system info shown      PASS
      clean hangup           PASS
=== path 2: XPort Modem Emulation (raw serial, no IAC) ===
  raw-serial     no IAC sent (raw serial path)
      main menu rendered     PASS
      file area listed       PASS
      system info shown      PASS
      clean hangup           PASS

RESULT: both paths pass
```

The three replies decode correctly: `IAC WILL ECHO` and `IAC WILL SGA` in
answer to the peer's `DO`, and `IAC DO NAWS` in answer to the peer's `WILL` —
which is how the node learns the caller's terminal width. On the raw path no
IAC is emitted at all, which is what a DOS BBS behind the XPort requires.

**Not browser-reachable.** The sandbox preview proxies HTTP only; a raw telnet
port cannot be rendered through it. The verification above ran inside the
sandbox. To try it yourself:

```sh
python3 tools/bbs/telnetbbs.py --port 6400 --data dist/bbs
telnet localhost 6400          # or: nc localhost 6400
```

Bind is `0.0.0.0` by default, which is what an external node or an XPort needs.

## What could not be built here

Synchronet was the recommended choice and it does not build in this sandbox.
The GitHub mirror clones fine (`SynchronetBBS/sbbs`, 16,252 files), but the
UNIX prerequisites from `BUILDING.md` are mostly absent and `apt-get` has no
reachable package index:

| Required | Status |
| --- | --- |
| GNU make, gcc/g++, perl, patch, python3, unzip | present |
| `pkg-config` / `pkgconf` | **missing** |
| `ncurses.h` | **missing** |
| `archive.h` (libarchive) | **missing** |
| `zlib.h` | **missing** |
| NSPR (`nspr/nspr.h`, `nspr-config`) | **missing** |

The build fails fast, on the vendored SpiderMonkey:

```
checking for nspr-config... no
checking for NSPR - version >= 4.7.0... no
configure: error: your don't have NSPR installed or your version is too old
make[1]: *** [GNUmakefile:121: .../3rdp/gcc.linux.x64.debug/mozjs/lib/libmozjs185-1.0.a] Error 1
```

`deb.debian.org` and `archive.ubuntu.com` both return `000` from this sandbox,
and `gitlab.synchro.net` is unreachable — only `github.com`, `registry.npmjs.org`
and `pypi.org` resolve. So the dependencies cannot be installed, and this is an
environment limit rather than a Synchronet problem. On a normal Debian or
Ubuntu host the prerequisites are one `apt-get` line.

## XPort Pro configuration

From the Lantronix XPort Pro User Guide (900-560) and Installation Guide
(900-557 Rev K):

**Serial side.** Pins 4–8 are **3.3 V CMOS**, not RS-232 levels. A MAX3232 or
equivalent transceiver is mandatory between the module and any real RS-232
device. Rate is software-selectable 300 bps to 921,600 bps; handshaking signals
are DTR, DCD, CTS, RTS; flow control XON/XOFF, CTS/RTS or none. On boot the
module always uses **9600 8N1 no flow control** for configuration.

**Management.** Internal Web Manager on TCP 80 (443 for HTTPS), SSH on 22,
telnet on 23, SNMP on 161. Configuration also works over the serial port, via
telnet/SSH CLI, or through the DeviceInstaller utility. Firmware upgrades over
FTP, web or serial.

**Modem Emulation mode** is the relevant feature and is documented verbatim as:
*"the unit accepts modem AT commands on the serial port, and then establishes a
network connection to the end device, leveraging network connections and
bandwidth to eliminate dedicated modems and phone lines."* In this mode the BBS
host sees a Hayes modem. It dials with the standard `ATDT<host>:<port>` form
and drops with `ATH`; the XPort opens the TCP connection and bridges the bytes
in both directions with **no telnet framing on the serial side** — which is
exactly the raw path exercised above.

**Two tunnels per serial port**, one Connect Mode and one Accept Mode. Connect
Mode has the XPort dial out (disabled by default); Accept Mode has it listen,
with a default local port of **10001** for serial port 1.

**The no-NAT caveat**, quoted from the manual: *"the XPort Pro embedded device
server does not perform network address translation (NAT) between the
serial-side network interface and the Ethernet/WLAN network interface."* If PPP
is used, static routes are required on both the PPP peer and the remote host.

Set Modem Emulation, the serial rate, and the Accept Mode local port through
the Web Manager at `http://<xport-ip>/`. Which AT commands and which
configuration strings the installed firmware revision accepts is documented in
the Command Reference for that revision — check it against the firmware
version the Web Manager reports before assuming a setting exists.

## Deploying Synchronet for real

On a Debian or Ubuntu host:

```sh
sudo apt-get install -y build-essential pkg-config libncurses-dev \
     libarchive-dev zlib1g-dev libnspr4-dev unzip patch perl python3
git clone --depth 1 https://github.com/SynchronetBBS/sbbs.git
make -f sbbs/install/install-sbbs.mk SYMLINK=1
```

Then in `scfg`:

- **System → Configuration** — set the BBS name and sysop.
- **Network → Services → Telnet** — enable, port 6400 (Synchronet's default
  telnet port; 23 needs root).
- **Network → Services → Modem** — only needed if a real serial modem is
  attached. Behind the XPort in Modem Emulation mode, configure this as the
  serial device the XPort presents and let the XPort handle the network side.

For Mystic instead, `deadbeatz/mystic_a45` is a worked DOSemu2 example.

## Not done

File transfers, FidoNet mail, door games and multi-node operation are not
implemented in `telnetbbs.py` — it is a node that proves the transport, not a
production BBS. The file area lists entries with CRC-32 values but serves no
bytes. No Wildcat! configuration is included: Wildcat! exists only as
unmaintained period shareware and is an archival interest, not something to
build a live service on.

The ARJ archive remains encrypted and no key was derived, guessed, or searched
for. See [`arj-garble-format-notes.md`](arj-garble-format-notes.md).

## Sources

- XPort Pro User Guide 900-560 (Modem Emulation, Connect/Accept Mode, default
  ports, no-NAT note): <https://www.lantronix.com/wp-content/uploads/pdf/900-560e_XPort_Pro_UG_release.pdf>
- XPort Pro Installation Guide 900-557 Rev K (3.3 V serial levels, ColdFire,
  SDRAM/flash): <https://cdn.lantronix.com/wp-content/uploads/pdf/XPort-Pro_IG.pdf>
- XPort Pro product page: <https://www.lantronix.com/products/xport-pro/>
- Synchronet build prerequisites: `BUILDING.md` in `SynchronetBBS/sbbs`
- Mystic on DOSemu2 worked example: <https://github.com/deadbeatz/mystic_a45>
