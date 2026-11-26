#!/usr/bin/env python3
"""Keep CI failures readable through Checks API when log artifact CDN is blocked.

Stream the command normally; on failure emit only a bounded, redacted tail as
an error annotation. Never serialize the environment or command-line arguments.
"""
import os
import re
import subprocess
import sys


def main():
    phase, *command = sys.argv[1:]
    if not re.fullmatch(r"[a-z-]{1,32}", phase) or not command:
        raise ValueError("Expected a phase label and command")
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    tail = b""
    while chunk := process.stdout.read1(4096):
        sys.stdout.buffer.write(chunk)
        sys.stdout.buffer.flush()
        tail = (tail + chunk)[-10000:]
    result = process.wait()
    if result:
        message = tail.decode("utf-8", errors="replace")
        for name, value in os.environ.items():
            if len(value) >= 8 and any(word in name.upper() for word in ("PASSWORD", "SECRET", "TOKEN")):
                message = message.replace(value, "[REDACTED]")
        message = (f"{phase} failed ({result})\n" + message).replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
        print(f"::error file=.github/workflows/putty-android.yml,title=PuTTY Android {phase}::{message}")
    return result if result >= 0 else 128 - result


if __name__ == "__main__":
    sys.exit(main())
