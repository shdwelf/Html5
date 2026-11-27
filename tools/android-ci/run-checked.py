#!/usr/bin/env python3
"""Bounded, secret-redacted CI diagnostics through Checks when log CDN is blocked.

Streams normal command output. On failure, publishes at most 3 kB of the tail
as a Checks annotation. Never prints environment values or command arguments.
Only use for trusted build/test commands, never personal device probes or keys.
"""
import os
import re
import subprocess
import sys


def main():
    phase, *command = sys.argv[1:]
    if not re.fullmatch(r'[a-z-]{1,40}', phase) or not command:
        raise ValueError('Expected a fixed phase and a trusted command')
    child = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    tail = b''
    while chunk := child.stdout.read1(4096):
        sys.stdout.buffer.write(chunk)
        sys.stdout.buffer.flush()
        tail = (tail + chunk)[-3000:]
    result = child.wait()
    if result:
        message = tail.decode('utf-8', errors='replace')
        for key, value in os.environ.items():
            if len(value) >= 8 and any(word in key.upper() for word in ('PASSWORD', 'SECRET', 'TOKEN')):
                message = message.replace(value, '[REDACTED]')
        message = (f'{phase} failed ({result})\n' + message).replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
        print(f'::error title=Android build {phase}::{message}')
    return result if result >= 0 else 128 - result


if __name__ == '__main__':
    sys.exit(main())
