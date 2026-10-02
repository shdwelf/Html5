#!/usr/bin/env python3
"""Minimal QEMU human-monitor client over a unix socket.
Usage: qemu_mon.py <sock-path> "<monitor command>"
Drains banner, sends one command, prints the reply."""
import socket
import sys
import time


def drain(s):
    s.setblocking(False)
    buf = b""
    try:
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            buf += chunk
    except (BlockingIOError, socket.timeout):
        pass
    return buf


def main():
    sock_path, cmd = sys.argv[1], sys.argv[2]
    s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    s.connect(sock_path)
    drain(s)
    s.sendall(cmd.encode() + b"\n")
    time.sleep(float(sys.argv[3]) if len(sys.argv) > 3 else 0.4)
    print(drain(s).decode(errors="replace"))


if __name__ == "__main__":
    main()
