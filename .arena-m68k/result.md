# m68k cross-build result — ftnpkt.c (T6.3 / T7.2)

- run: 40027253569 / attempt 1 · 2026-10-23T21:45:54Z
- compiler: m68k-linux-gnu-gcc (Ubuntu 13.3.0-6ubuntu2~24.04) 13.3.0
- emulator: qemu-m68k version 8.2.2 (Debian 1:8.2.2+ds-0ubuntu1.18)
- linkage: static
- binary: build-m68k/ftnpkt-m68k: ELF 32-bit MSB executable, Motorola m68k, 68020, version 1 (SYSV), statically linked, BuildID[sha1]=8244ea85d28127590b527d58b8763f9e484287a5, for GNU/Linux 3.2.0, not stripped
- elf:   Class:                             ELF32
- elf:   Type:                              EXEC (Executable file)
- elf:   Machine:                           MC68000
- sha256: efb8e6b83a81fa941a57dd89905887b5fbcfb0dcc5da59f0afc41ea07538191a  build-m68k/ftnpkt-m68k

## Parity (host gcc build vs m68k build under qemu-m68k, same fixture)

IDENTICAL — dump and --news outputs byte-match across host and m68k builds.

## Host dump (the m68k dump is byte-identical when parity holds)

```
PKT orig=104/100 dest=104/200 date=1994-09-09 12:30:00 type=2
MSG 1 area=FIDOTEST from="Synthetic Sysop" to="All" subject="Gateway test" msgid="1:104/100 2f3a4b5c" nodes=104/100->104/200 seenby=1
BODY
Hello from a synthetic node.
Second line stays visible.
END
```

Scope: this proves the C99 parser compiles -Werror-clean for
m68k-linux-gnu and executes correctly under user emulation. It is
not yet a uClinux bFLT binary and has not run on ColdFire iron;
live FidoNet peering still needs a real uplink.
