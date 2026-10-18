#!/usr/bin/env python3
"""A small but real telnet BBS, stdlib only.

Written for the XPort Pro adapter project. It exists because Synchronet cannot
be built in this sandbox (NSPR, ncurses, libarchive and zlib are all absent and
apt has no reachable package index), and because the XPort Modem Emulation path
needs something on the far end that speaks plain serial bytes.

Two ways to reach it, both supported by the same code:

  * Direct telnet. A user telnets to the listening port. The peer sends telnet
    IAC option negotiation, and this server answers it.
  * Through the XPort in Modem Emulation mode. The BBS host dials
    `ATDT<host>:<port>` out of a serial port; the XPort bridges the bytes to a
    TCP connection. No IAC arrives, so negotiation is skipped and the stream is
    treated as raw 8-bit serial -- which is exactly what DOS-era BBS software
    expects.

The rule the implementation follows: negotiate only what the peer initiates.
Nothing is offered that was not asked for, so the same listener works behind a
telnet client, behind the XPort, and behind a plain socket test harness.

Run:  python3 tools/bbs/telnetbbs.py --port 6400 --data dist/bbs
"""

from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import os
import socket
import socketserver
import sys
import threading
import time

# --- telnet protocol -------------------------------------------------------

IAC, DONT, DO, WONT, WILL, SB, SE = 255, 254, 253, 252, 251, 250, 240
# Options we understand. Everything else is refused politely.
OPT_ECHO, OPT_SGA, OPT_NAWS, OPT_TTYPE = 1, 3, 31, 24

# --- ANSI ------------------------------------------------------------------

ESC = "\x1b["
RESET, BOLD = f"{ESC}0m", f"{ESC}1m"
FG = {
    "black": 30, "red": 31, "green": 32, "yellow": 33,
    "blue": 34, "magenta": 35, "cyan": 36, "white": 37,
}


def ansi(text: str) -> str:
    """Expand {red}...{/} style markers into ANSI escapes."""
    out = text
    for name, code in FG.items():
        out = out.replace("{%s}" % name, f"{ESC}{code}m")
    out = out.replace("{bold}", BOLD).replace("{/}", RESET)
    return out


BANNER = r"""
{cyan}{bold}  +--------------------------------------------------------------+
  |                                                              |
  |        K I R K P A T R I C K   B R O S   B B S               |
  |                                                              |
  |        telnet node  -  80x24  -  ANSI recommended            |
  |                                                              |
  +--------------------------------------------------------------+{/}
"""


class Store:
    """JSON-backed state. Small, explicit, no dependencies."""

    def __init__(self, path: str):
        self.path = path
        self.lock = threading.Lock()
        os.makedirs(path, exist_ok=True)
        self.file = os.path.join(path, "state.json")
        if not os.path.exists(self.file):
            self._write({
                "users": {},
                "messages": [],
                "files": [
                    {"name": "FILE_ID.DIZ", "size": 450, "crc": "CC586221",
                     "desc": "FIRST NAME ALMANAC v1.02 descriptor"},
                    {"name": "SYSOP.DOC", "size": 1970, "crc": "A56D5EB7",
                     "desc": "Sysop and distribution notice"},
                ],
                "calls": 0,
                "sysop": "Sysop",
            })

    def _write(self, data):
        tmp = self.file + ".tmp"
        with open(tmp, "w") as fh:
            json.dump(data, fh, indent=2)
        os.replace(tmp, self.file)

    def load(self):
        with self.lock:
            with open(self.file) as fh:
                return json.load(fh)

    def mutate(self, fn):
        with self.lock:
            with open(self.file) as fh:
                data = json.load(fh)
            fn(data)
            self._write(data)
        return data

    @staticmethod
    def hash_pw(pw: str) -> str:
        return hashlib.sha256(pw.encode()).hexdigest()


class Session:
    """One connected caller."""

    def __init__(self, sock, addr, store):
        self.sock = sock
        self.addr = addr
        self.store = store
        self.alias = None
        self.width = 80
        self.negotiated = False
        self.raw = False
        self.alive = True

    # -- transport ---------------------------------------------------------

    def send(self, text: str):
        if not self.alive:
            return
        try:
            self.sock.sendall(ansi(text).encode("cp437", "replace"))
        except OSError:
            self.alive = False

    def send_raw(self, data: bytes):
        if not self.alive:
            return
        try:
            self.sock.sendall(data)
        except OSError:
            self.alive = False

    def _negotiate(self, cmd: int, opt: int):
        self.send_raw(bytes([IAC, cmd, opt]))

    def handle_iac(self, cmd: int, opt: int):
        """Answer only what the peer initiates."""
        if cmd in (DO, DONT):
            if opt in (OPT_ECHO, OPT_SGA):
                self._negotiate(WILL if cmd == DO else WONT, opt)
                self.negotiated = True
            elif opt == OPT_NAWS and cmd == DO:
                self._negotiate(WILL, opt)
            else:
                self._negotiate(WONT, opt)
        elif cmd in (WILL, WONT):
            if opt == OPT_NAWS and cmd == WILL:
                self._negotiate(DO, opt)
            elif opt == OPT_TTYPE and cmd == WILL:
                self._negotiate(DO, opt)
            else:
                self._negotiate(DONT, opt)

    def feed(self, chunk: bytes) -> str:
        """Strip telnet framing, return printable payload."""
        out, i = [], 0
        while i < len(chunk):
            b = chunk[i]
            if b != IAC:
                if b >= 32 or b in (8, 9, 10, 13):
                    out.append(b)
                i += 1
                continue
            # IAC sequence
            if i + 1 >= len(chunk):
                break
            c = chunk[i + 1]
            if c == IAC:                       # literal 0xFF
                out.append(255)
                i += 2
            elif c in (DO, DONT, WILL, WONT):
                if i + 2 < len(chunk):
                    self.handle_iac(c, chunk[i + 2])
                i += 3
            elif c == SB:
                end = chunk.find(bytes([IAC, SE]), i)
                sub = chunk[i + 2:end] if end > 0 else b""
                if sub[:1] == bytes([OPT_NAWS]) and len(sub) >= 5:
                    self.width = (sub[1] << 8) | sub[2]
                i = (end + 2) if end > 0 else len(chunk)
            else:
                i += 2
        return bytes(out).decode("cp437", "replace")

    # -- prompts -----------------------------------------------------------

    def prompt(self, label: str, echo: bool = True) -> str:
        """Line editor. No IAC is emitted unless the peer negotiated first."""
        self.send(label)
        buf = ""
        while self.alive:
            try:
                chunk = self.sock.recv(256)
            except OSError:
                self.alive = False
                return buf
            if not chunk:
                self.alive = False
                return buf
            for ch in self.feed(chunk):
                if ch in "\r\n":
                    self.send("\r\n")
                    return buf
                if ch == "\x7f" or ch == "\x08":
                    if buf:
                        buf = buf[:-1]
                        if echo:
                            self.send("\x08 \x08")
                    continue
                if ch == "\x03":               # ctrl-C drops the call
                    self.alive = False
                    return buf
                buf += ch
                if echo:
                    self.send(ch)
                else:
                    self.send("*")
        return buf

    # -- screens -----------------------------------------------------------

    def rule(self):
        self.send("{blue}" + "-" * min(self.width, 70) + "{/}\r\n")

    def hangup(self, why: str = "NO CARRIER"):
        self.send("\r\n{yellow}%s{/}\r\n\r\n" % why)
        time.sleep(0.4)
        self.alive = False

    def login(self) -> bool:
        self.send(BANNER)
        self.send("\r\n{white}Node online %s{/}\r\n\r\n"
                  % _dt.datetime.now().strftime("%Y-%m-%d %H:%M"))
        for _ in range(3):
            alias = self.prompt("{green}Handle:{/} ").strip()
            if not alias:
                continue
            pw = self.prompt("{green}Password:{/} ", echo=False).strip()
            users = self.store.load()["users"]
            if alias.lower() in users:
                if users[alias.lower()]["pw"] == Store.hash_pw(pw):
                    self.alias = alias
                    return True
                self.send("{red}Denied.{/}\r\n")
            else:
                if len(alias) < 2 or len(alias) > 24:
                    self.send("{red}Handle must be 2-24 characters.{/}\r\n")
                    continue
                self.store.mutate(lambda d: d["users"].setdefault(
                    alias.lower(), {"alias": alias, "pw": Store.hash_pw(pw),
                                    "first": time.time(), "calls": 0}))
                self.alias = alias
                self.send("{cyan}New account created. Welcome, %s.{/}\r\n" % alias)
                return True
        return False

    def main_menu(self):
        self.store.mutate(lambda d: d.__setitem__("calls", d["calls"] + 1))
        state = self.store.load()
        while self.alive:
            self.send("\r\n{bold}{cyan}[K] {/}{white}Kirkpatrick Bros BBS{/}"
                      "{cyan}   {bold}%s{/}{/}   node 1 of 1\r\n" % self.alias)
            self.rule()
            self.send("  {yellow}M{/}{white}essage base")
            self.send("      {yellow}F{/}{white}ile list\r\n")
            self.send("  {yellow}U{/}{white}ser list")
            self.send("          {yellow}S{/}{white}ystem info\r\n")
            self.send("  {yellow}W{/}{white}ho's online")
            self.send("      {yellow}G{/}{white}oodbye\r\n\r\n")
            choice = self.prompt("{green}Choice:{/} ").strip().upper()[:1]
            if choice == "M":
                self.messages()
            elif choice == "F":
                self.files()
            elif choice == "U":
                self.users()
            elif choice == "S":
                self.system_info(state)
            elif choice == "W":
                self.send("{white}  1 caller: %s (you){/}\r\n" % self.alias)
            elif choice == "G":
                self.hangup()
                return

    def messages(self):
        msgs = self.store.load()["messages"]
        self.send("\r\n{bold}Message base{/} - %d message(s)\r\n" % len(msgs))
        self.rule()
        for i, m in enumerate(msgs, 1):
            self.send(" {cyan}%3d{/} {yellow}%-20s{/} {white}%s{/}\r\n"
                      % (i, m["from"][:20], m["subject"][:44]))
        if not msgs:
            self.send(" {white}(empty){/}\r\n")
        sub = self.prompt("\r\n{green}Post a subject (blank to skip):{/} ").strip()
        if sub:
            self.send("{white}Enter the message, one line, blank line ends:{/}\r\n")
            body = self.prompt("").strip()
            if body:
                self.store.mutate(lambda d: d["messages"].append(
                    {"from": self.alias, "subject": sub, "body": body,
                     "at": time.time()}))
                self.send("{cyan}Posted.{/}\r\n")

    def files(self):
        files = self.store.load()["files"]
        self.send("\r\n{bold}File area{/} - %d file(s)\r\n" % len(files))
        self.rule()
        self.send(" {cyan}%-16s %8s %10s  %s{/}\r\n"
                  % ("NAME", "BYTES", "CRC-32", "DESCRIPTION"))
        for f in files:
            self.send(" {white}%-16s %8d %10s  %s{/}\r\n"
                      % (f["name"], f["size"], f["crc"], f["desc"]))
        self.send("\r\n {yellow}Transfers are not implemented in this node.{/}\r\n")

    def users(self):
        users = self.store.load()["users"]
        self.send("\r\n{bold}User list{/} - %d account(s)\r\n" % len(users))
        self.rule()
        for u in sorted(users.values(), key=lambda x: x["alias"].lower()):
            self.send(" {white}%-24s{/} {yellow}%d call(s){/}\r\n"
                      % (u["alias"], u.get("calls", 0)))

    def system_info(self, state):
        self.send("\r\n{bold}System information{/}\r\n")
        self.rule()
        uptime = time.time() - STARTED
        rows = [
            ("BBS", "Kirkpatrick Bros BBS (telnetbbs.py)"),
            ("Sysop", state.get("sysop", "Sysop")),
            ("Total calls", str(state.get("calls", 0))),
            ("Uptime", "%dh %02dm %02ds"
             % (uptime // 3600, (uptime % 3600) // 60, uptime % 60)),
            ("Transport", "XPort Pro Modem Emulation or direct telnet"),
            ("Encoding", "CP437 / ANSI"),
            ("Python", sys.version.split()[0]),
        ]
        for k, v in rows:
            self.send(" {cyan}%-14s{/} {white}%s{/}\r\n" % (k, v))


STARTED = time.time()
LIVE: list = []
LIVE_LOCK = threading.Lock()


class Handler(socketserver.BaseRequestHandler):
    store: Store = None  # set by main()

    def handle(self):
        sess = Session(self.request, self.client_address, self.store)
        with LIVE_LOCK:
            LIVE.append(sess)
        try:
            if sess.login():
                sess.main_menu()
            else:
                sess.hangup("LOGIN FAILED")
        except (OSError, UnicodeError):
            pass
        finally:
            with LIVE_LOCK:
                if sess in LIVE:
                    LIVE.remove(sess)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--port", type=int, default=6400)
    ap.add_argument("--host", default="0.0.0.0",
                    help="bind address; 0.0.0.0 is required for external reach")
    ap.add_argument("--data", default="dist/bbs")
    args = ap.parse_args()

    Handler.store = Store(args.data)
    srv = Server((args.host, args.port), Handler)
    print("telnetbbs listening on %s:%d  data=%s" % (args.host, args.port,
                                                     args.data), flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
