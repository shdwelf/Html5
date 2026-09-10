# Virus research notes

> Generated from `js/virus-catalog.js` — edit the module, then run
> `node tools/render_research.mjs`. Nothing here executes anything: the
> samples are 16-bit real-mode DOS code and need a BIOS, an interrupt
> vector table and a floppy controller to do anything at all.

## 1. The source corpus

All assembler sources come from [ksaj/Ontario1024](https://github.com/ksaj/Ontario1024),
a collection of early-90s virus code. Three of the entries have been
reassembled into real binaries for this lab (marked **binary**); the rest are
read as source.

| sample | kind | era | binary | notes |
| --- | --- | --- | --- | --- |
| **Michelangelo** | boot-sector | 1991 (discovered by Roger Riordan, Melbourne) | `samples/bin/michelangelo.bin` | The most famous boot sector virus of the DOS era, and a pure BIOS-level program: it never calls DOS once. It hooks INT 13h, hides the original boot sector on a |
| **Malmsey Habitat v1.3** | com-infector | early 1990s | `samples/bin/malmsey-habitat-13.bin` | A memory-resident .COM appender written to demonstrate a *payload* rather than a payload-free replication engine. It walks the current directory with DOS FindFi… |
| **Zippy** | com-infector | early 1990s | `samples/bin/zippy.bin` | The smallest possible file infector: 36 bytes, no residency, no stealth, no payload. It finds the first .COM in the current directory and overwrites the start o… |
| **Kilroy** | boot-sector | early 1990s | — | A one-sector boot sector virus that plays at being a legitimate boot record. It carries a full BIOS Parameter Block, embeds the OEM name 'KILROY ', and copies t… |
| **EXEBUG2** | boot-sector | March-any-year detonator | — | A partially disassembled boot sector virus that requires 80286 features and activates in March of any year, destroying the hard drive. The source is an annotate… |
| **KS Test (encrypted boot sector)** | boot-sector | early 1990s | — | A boot sector that is stored encrypted and decrypts itself at run time: a tight loop ADDs a single byte key across its own body, then falls through into the now… |
| **Lezbo** | com-infector | 1993 | — | A 386-aware resident .COM/EXE infector assembled with P386N. It computes its own delta offset from a self-referenced label, checks for an existing installation |
| **Proto-3** | com-infector | 1993-94 | — | A 386-only resident infector that computes a delta offset via CALL/POP, reads and writes the INT 21h vector with 32-bit moves, and encrypts the host's first byt… |
| **DOS_7 / anti-debug trapdoor** | com-infector | early 1990s | — | A short .COM that overwrites its own code with a target offset, aliases INT 3 onto INT 21h by copying two words of the IVT, hooks INT 0 (divide by zero) and the… |
| **Anti-debug 1a — trace poison** | anti-debug | early 1990s | — | `mov ax,0FE05h; jmp $-2` — the jump lands back inside the MOV, so the CPU sees a different opcode than a disassembler does. Then the stack pointer is aimed at t… |
| **Anti-debug 1b — patch my own argument** | anti-debug | early 1990s | — | Writes 9 into the byte immediately before `int 21h`, turning AH=4Ch (terminate) into AH=09h (print string) — but only if the value is patched back before the in… |
| **Anti-debug 1c — message swap** | anti-debug | early 1990s | — | Patches its own string pointer before INT 21h so that a debugger which halts at the interrupt sees a different message than the one that actually reaches DOS. |
| **Anti-debug 1d — INT 0 hijack** | anti-debug | early 1990s | — | Saves the INT 0 vector, points it at its own routine, then divides by zero on purpose. The exception handler restores the original vector and continues — contro… |
| **Anti-debug 1e — timer side channel** | anti-debug | early 1990s | — | Hooks the timer interrupt (INT 8, installed through INT 21h AH=25h) and then spins on a flag that only the timer tick can set. Under a debugger the loop never c… |
| **Trident Polymorphic Engine (v1.1 / v1.2 / v1.3 + generator)** | engine | 1991-1994 | — | The engine that made 1990s scanners obsolete. Handed a code buffer in DS:DX, ES:BP and a length in CX, it returns an encrypted body with a freshly generated dec… |
| **Companion virus demo (INT 2Eh)** | com-infector | early 1990s | — | Twelve instructions that do nothing but pass a filename to COMMAND.COM through the undocumented INT 2Eh interface, with the target file named ATTRIB.EXE and ter… |
| **Whistleblower (2003, not a virus)** | utility | 2003 | — | Included for contrast rather than for analysis: an NNTP scanner that logs servers carrying illegal newsgroups and reports tally counts. Unlike everything else i… |

### Michelangelo

*Also known as:* Michelangelo.A, March6, Stoned.II  
*Family:* Stoned lineage  
*Attributed to:* unknown  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/michelangelo.asm  
*Binary in this lab:* `samples/bin/michelangelo.bin` (512 bytes at 0x7c00, x86:LE:16:Real Mode)  

The most famous boot sector virus of the DOS era, and a pure BIOS-level program: it never calls DOS once. It hooks INT 13h, hides the original boot sector on a spare sector of track 0, and sits resident in the top 2 KB of conventional memory. The destructive payload fires when the BIOS clock reports 6 March, which is why the press called it Michelangelo.

**Techniques**

- INT 13h hook (floppy writes only, and only when the drive motor is idle)
- Residency by decrementing the BIOS base-memory word at 0040:0013 by 2 KB
- Self-relocation to the freed segment and a far jump through a patched pointer
- Original boot sector relocated to head 1, sector 3 (360 KB) or sector 0x0E (other media)
- Partition table carried across by copying 0x21 words from 0x3BE to 0x1BE
- Date trigger: INT 1Ah AH=04, DX == 0x0306
- Payload: writes 0x11 sectors per track across heads 0–3, cylinders increasing

**Reconstructed execution** (read from the source, not observed)

1. Machine boots from an infected floppy or MBR. The virus is at 0000:7C00 and starts by relocating itself.
2. DS=0, SS=0, SP=7C00 — the classic boot-time land-grab. The old INT 13h vector is copied out of the IVT at 0000:004C into the virus's own data words.
3. WORD 0040:0013 (kilobytes of base memory) is decremented twice, i.e. 2 KB is stolen, and the new top-of-memory segment is computed with a SHL 6.
4. INT 13h now points at the virus's handler in the stolen segment; 0x1BE bytes are copied up there and the CPU far-jumps to the copy. The original 512 bytes at 7C00 are dead weight from here on.
5. The handler is deliberately fussy: it only infects when DL=0 (first floppy), the motor-idle bit at 0040:0043F is clear, and the boot sector's first four bytes do not already match.
6. On 6 March, Detonate stops infecting and starts writing 17 sectors to every track, head 0 through 3, walking cylinders upward — enough to erase the FAT, root directory and MBR.

**Why it matters.** Michelangelo is the cleanest teaching sample in the corpus: 512 bytes that demonstrate IVT hooking, conventional-memory theft, self-relocation, disk-chainloading and a date-triggered payload — every primitive of a pre-network malware economy, in one readable file.

**Annotated addresses**

| address | label | note |
| --- | --- | --- |
| `0x7C00` | Mich_Boot | Entry point. A near jump over the 14 bytes of virus state that follow — the same layout trick Stoned used. |
| `0x7C03` | Hi_JMP / Track_Sector / INT13_Ofs | Virus data, not code. Hijacked jump target, saved INT 13h vector (offset/segment) and the track/sector where the real boot sector was hidden. |
| `0x7C0E` | INT_13h | Resident INT 13h handler. Filters on DL=0 and the disk-motor bit at 0040:0043F, then chains to the real BIOS handler via a far call through the saved vector. |
| `0x7C36` | Infect | Reads the boot sector to 0200:0000, compares four signature bytes, then relocates the real boot sector and overwrites sector 1 with itself. |
| `0x7C71` | Move_Real_Boot | Chooses the hiding place: sector 3 for 360 KB floppies (checked via the media descriptor at [BX+0x15] == 0xFD), sector 0x0E otherwise. |
| `0x7CA6` | Quit | Nine pops and RETN — the handler restores every register it touched and returns to the caller of INT 13h. |
| `0x7CAF` | Second_Entry | Installer. Runs once at boot from 7C00: grabs the IVT, steals memory, hooks INT 13h, copies itself to the new segment. |
| `0x7CF6` | JMP_Here | Continuation in the stolen segment. Loads the real boot sector back and chains to it, so the boot looks normal. |
| `0x7D3F` | Check_Date | INT 1Ah AH=04 returns the date in DX as (year<<9)\|(month<<5)\|day, so 6 March 1992 reads 0x0306. CX is zeroed first because only DX matters. |
| `0x7D4C` | Detonate | The payload. AX=0x0309 (write 9 sectors) upgraded to AL=0x11 (17 sectors) on hard disks, ES=BX=0x5000 as the junk buffer. |
| `0x7D88` | Infect_Partition | MBR infection: original master boot record to cylinder 0 / head 0 / sector 7, partition table copied to 0x1BE of the viral sector, virus written to sector 1. |
| `0x7DBE` | Partitions | ORG 0x1BE — this is the hard limit on virus size. Everything the virus can ever be lives below this offset. |

- [Wikipedia — Michelangelo (computer virus)](https://en.wikipedia.org/wiki/Michelangelo_(computer_virus))
- [F-Secure — Michelangelo description](https://www.f-secure.com/v-descs/michel.shtml)
- [Graham Cluley — Memories of the Michelangelo virus](https://grahamcluley.com/michelangelo-virus/)

### Malmsey Habitat v1.3

*Also known as:* Malmsey, Habitat  
*Family:* Malmsey Habitat (ANARKICK SYSTEMS)  
*Attributed to:* ksaj / ANARKICK SYSTEMS  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/malms-13.asm  
*Binary in this lab:* `samples/bin/malmsey-habitat-13.bin` (496 bytes at 0x100, x86:LE:16:Real Mode)  

A memory-resident .COM appender written to demonstrate a *payload* rather than a payload-free replication engine. It walks the current directory with DOS FindFirst/FindNext, appends itself to every .COM file it can open read/write, and on the 3rd of any month at 22:00 draws an animated 'crunchy face' with BIOS video services, chomping its jaws and printing a credit line.

**Techniques**

- `mov si,si` used as a 2-byte, harmless infection marker (compare word at file offset 0 with 0xF68B)
- DOS memory block surgery: shrink the MCB at PSP-1, reserve 0xC0 paragraphs, copy up high
- Delta offset for relocatable code inside a segment
- FindFirst (4Eh) / FindNext (4Fh) directory walk with attribute mask 0x27
- Append-at-EOF infection: open 3D02h, seek 4200h, write 40h
- Date/time trigger: INT 21h AH=2Ah, DL==3, DH==10
- Payload built entirely from INT 10h teletype/scroll calls, tuned with busy-wait LOOP delays

**Reconstructed execution** (read from the source, not observed)

1. A file is executed; the virus is at the top of it. `mov si,si` is both the entry point and the infection marker future copies will check for.
2. It walks the current directory for *.COM, and for each candidate reads the first two bytes. If they are not `mov si,si`, the file gets the whole 496 bytes written over its first four bytes of code path via the appended-copy routine.
3. On the 3rd of the month between 22:00 and 23:00 it hijacks the display: it saves the screen, draws eyes and a mouth, then animates by alternating scroll-up and scroll-down on two screen windows while its own teeth march across the bottom row.
4. Finally it prints a message char-by-char through the teletype service and hangs on a zero byte. The hang is deliberate — no clean exit, because the goal was to be seen.

**Why it matters.** It shows the file-infector workhorse pattern that replaced boot sectors as the dominant DOS vector: TSR residency, a delta offset for position-independent code, DOS file API abuse, and a marker check so a file is never infected twice.

**Annotated addresses**

| address | label | note |
| --- | --- | --- |
| `0x100` | id_bytes | `mov si,si` (0x8B 0xF6) — marker byte pair checked before every infection. |
| `0x102` | main | Directory sweep setup: AH=4Eh find-first, CX=0x27 attribute mask (hidden + system + volume + normal). |
| `0x24B` | infect_file | Open RW (3D02h), read 2 bytes, compare against the marker, seek to 0 (4200h), write the virus (40h), close (3Eh). |
| `0x117` | exit_virus | Payload gate: INT 21h AH=2Ah returns day in DL and hour in DH. |
| `0x127` | eat_screen | Payload start. Video mode 3 + read attribute via INT 10h AH=08/00. |
| `0x19C` | make_teeth | Draws 0x50 alternating teeth across row 2 and row 0x17 using INT 10h AH=09. |
| `0x1E2` | close_jaws | The animation: scroll-up window 13..24 and scroll-down window 0..12 with the running colour counter in BH. |
| `0x240` | fuckin_loop | Teletype print of the credit string, then an infinite LOADSB loop that hangs the machine when the string runs out. |
| `0x27F` | buffer | Two-byte scratch used for the infection marker comparison. |
| `0x281` | com_spec | The ASCIIZ pattern '*.COM' handed to FindFirst in DX. |

- [Malmsey Habitat note (ksaj)](https://github.com/ksaj/Ontario1024/blob/master/malmsey-habitat.md)
- [Archive.org — MALMSEY.COM payload capture](https://archive.org/details/malware_MALMSEY.COM)

### Zippy

*Also known as:* trivial overwriter  
*Family:* teaching sample  
*Attributed to:* ksaj  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/zippy.asm  
*Binary in this lab:* `samples/bin/zippy.bin` (36 bytes at 0x100, x86:LE:16:Real Mode)  

The smallest possible file infector: 36 bytes, no residency, no stealth, no payload. It finds the first .COM in the current directory and overwrites the start of it with itself, using the DTA filename that DOS leaves at PSP:009E.

**Techniques**

- DOS FindFirst (4Eh) with CX=0 (normal attributes) to get a victim name into the DTA
- Open at write-only (3D01h) using the ASCIIZ name DOS already placed at offset 0x9E
- Write (40h) from DS:SI — a pointer the parent program is expected to have set up

**Reconstructed execution** (read from the source, not observed)

1. Finds the first *.COM in the current directory, opens it for writing, and writes 0x24 bytes over its beginning. That is the entire logic.
2. Because it is an overwriter, the victim does not survive: this is the 'do not run me' end of the taxonomy, and the reason the sample is only useful with a debugger and a scratch directory.

**Why it matters.** Every concept in a virus is visible in three dozen instructions, which makes it the right first sample to hand a disassembler — and it is the perfect size to watch Ghidra turn into C.

**Annotated addresses**

| address | label | note |
| --- | --- | --- |
| `0x100` | zippy | Entry. AH=4Eh find-first with CX=0. |
| `0x11E` | comfile | '*.COM' ASCIIZ pattern, addressed with LEA DX. |
| `0x124` | virend | End marker: the virus writes (virend - zippy) = 0x24 bytes of itself. |

- [zippy.asm](https://github.com/ksaj/Ontario1024/blob/master/zippy.asm)

### Kilroy

*Family:* boot sector / bootable-OEM  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/kilroy.asm  

A one-sector boot sector virus that plays at being a legitimate boot record. It carries a full BIOS Parameter Block, embeds the OEM name 'KILROY  ', and copies the original boot sector to sector 0x0E so the machine still boots. Its infection decision reads BIOS RAM at 0040:0010 (system info byte) and 0040:0075 (hard disk count) to pick targets.

**Techniques**

- Fake-but-valid BPB/OEM header fields for camouflage
- Reads BIOS data area for drive enumeration (0040:0010, 0040:0075)
- Preserves the host by relocating the original boot sector
- Assembled as a .COM with ORG 0x100 and a jump stub so the code can be built and tested under DOS

**Why it matters.** It shows why boot sector viruses were so hard to spot: this one is a *better* formatted boot sector than most real ones, complete with a BPB table that passes a casual sector dump.

### EXEBUG2

*Family:* boot sector, 286+  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/exebug.asm  

A partially disassembled boot sector virus that requires 80286 features and activates in March of any year, destroying the hard drive. The source is an annotated disassembly rather than authored source — opcode column included — which makes it a nice cross-check for a disassembler.

**Techniques**

- 80286-only instructions
- Month-only trigger
- Disk destruction payload
- Carries its own opcode listing from a 1990s disassembler

**Why it matters.** Where Michelangelo triggers on one date, EXEBUG2 triggers on a whole month: a one-byte change to the day comparison turns a single-day event into a season-long one, and shifts the detection window an analyst gets.

### KS Test (encrypted boot sector)

*Family:* self-encrypting boot sector  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/kstest.asm  

A boot sector that is stored encrypted and decrypts itself at run time: a tight loop ADDs a single byte key across its own body, then falls through into the now-plaintext `first_4` bytes. The key byte is patched at assembly time via the `key equ $-1` idiom, and the decryptor is written so its own instructions mutate between generations.

**Techniques**

- Self-decrypting body (ADD byte ptr cs:[bx], al)
- Assembly-time key patching with `equ $-1`
- Self-modifying decryptor so each generation's bytes differ
- Installation check via INT 21h with AX=0xFFFF and AL/AH comparison
- Classic TSR residency via MCB shrink at PSP-1 and INT 21h vector hook

**Why it matters.** This is the bridge from 'encrypted' to 'polymorphic'. Once the key and the decryptor instructions vary per infection you have TPE and MtE; the entropy strip in the lab shows exactly what that looks like in a binary — a high-entropy blob behind a few bytes of plaintext loop.

### Lezbo

*Family:* 386-aware resident infector  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/lezbo.asm  

A 386-aware resident .COM/EXE infector assembled with P386N. It computes its own delta offset from a self-referenced label, checks for an existing installation with the AX=0xFFFF trick, saves the INT 21h vector with a single 32-bit load (`mov eax, ds:21h*4`), then shrinks the host's MCB to build its own high-memory segment.

**Techniques**

- P386N non-protected-mode 32-bit addressing
- Delta offset for position independence
- 32-bit IVT read/write
- MCB shrink at PSP-1
- Restores the host's first four bytes so the original program still runs

**Why it matters.** The delta-offset prologue and the MCB shrink here are the same three paragraphs of code in every 1990s resident virus — recognise them and you can find the resident part of any sample instantly.

### Proto-3

*Family:* 80386 resident, encrypted payload  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/proto-3.asm  

A 386-only resident infector that computes a delta offset via CALL/POP, reads and writes the INT 21h vector with 32-bit moves, and encrypts the host's first bytes with XOR plus a fill value so the infection is not a plain byte-for-byte append.

**Techniques**

- CALL/POP delta offset
- 32-bit IVT manipulation
- XOR-encrypted host bytes with a configurable fill value
- Data block laid out at ORG 0xE0 above the code

**Why it matters.** Adding XOR to the infection routine breaks the simplest generic detector of the era (search for the virus signature at file start). Security tooling has been chasing that same regression ever since — signature, then heuristic, then behavioural, then ML.

### DOS_7 / anti-debug trapdoor

*Family:* debugger detection  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/dos-7c.asm  

A short .COM that overwrites its own code with a target offset, aliases INT 3 onto INT 21h by copying two words of the IVT, hooks INT 0 (divide by zero) and then deliberately divides by zero. On real hardware the CPU jumps into the real code path; under a single-stepping debugger the prefetch buffer has already swallowed the unstomped instruction and control lands in a routine that overwrites the hard disk.

**Techniques**

- Self-modifying code with `EQU $-2` offsets
- IVT aliasing (INT 3 → INT 21h)
- Prefix-prefetch trick
- Debugger-conditional destruction payload

**Why it matters.** It is a time bomb aimed at the analyst, not the user. The modern equivalent is malware that behaves differently under ptrace/ETW instrumentation — and the defensive answer is the same as it was in 1992: analyse in a disposable, isolated environment and expect any observable behaviour to differ under a debugger.

### Anti-debug 1a — trace poison

*Family:* self-modification  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/anti-debug1a.asm  

`mov ax,0FE05h; jmp $-2` — the jump lands back inside the MOV, so the CPU sees a different opcode than a disassembler does. Then the stack pointer is aimed at the code itself so any INT 21h return address lands on a controlled instruction.

**Techniques**

- Jump into the middle of an instruction
- Stack pointer used as a control-flow register

**Why it matters.** The oldest trick in the book: desynchronise the disassembler from the CPU. Ghidra's linear sweep has to guess; a real CPU cannot.

### Anti-debug 1b — patch my own argument

*Family:* self-modification  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/anti-debug1b.asm  

Writes 9 into the byte immediately before `int 21h`, turning AH=4Ch (terminate) into AH=09h (print string) — but only if the value is patched back before the interrupt, which a tracing debugger allows and normal execution does not.

**Techniques**

- Self-patching instruction operand
- Trace-dependent behaviour

**Why it matters.** Presence detection by self-patching: the program decides it is being watched because its own memory changed under conditions that only a debugger produces.

### Anti-debug 1c — message swap

*Family:* self-modification  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/anti-debug1c.asm  

Patches its own string pointer before INT 21h so that a debugger which halts at the interrupt sees a different message than the one that actually reaches DOS.

**Techniques**

- Self-modifying pointer operand
- Observable state vs. executed state

**Why it matters.** A neat demonstration that 'the analyst observed X' is not the same claim as 'the code does X'.

### Anti-debug 1d — INT 0 hijack

*Family:* exception redirection  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/anti-debug1d.asm  

Saves the INT 0 vector, points it at its own routine, then divides by zero on purpose. The exception handler restores the original vector and continues — control flow that no static tool recovers from a linear sweep.

**Techniques**

- INT 0 reprogramming
- Deliberate divide-by-zero
- Handler-based control transfer

**Why it matters.** Exception-vector hijacking as a control-flow obfuscation primitive, twenty years before SEH abuse in Windows malware.

### Anti-debug 1e — timer side channel

*Family:* timing  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/anti-debug1e.asm  

Hooks the timer interrupt (INT 8, installed through INT 21h AH=25h) and then spins on a flag that only the timer tick can set. Under a debugger the loop never completes, because the tick never lands while the debugger owns the machine.

**Techniques**

- INT 8 (timer) hook via DOS
- Interrupt-driven flag spin
- Presence check through hardware timing

**Why it matters.** Timing- and interrupt-based environment checks are the direct ancestor of today's anti-VM and sandbox-evasion logic, which is also a race between the sample and its observer.

### Trident Polymorphic Engine (v1.1 / v1.2 / v1.3 + generator)

*Family:* polymorphic engine  
*Attributed to:* Masud Khafir / TridenT, released in the Netherlands  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/tpe_v13.asm  

The engine that made 1990s scanners obsolete. Handed a code buffer in DS:DX, ES:BP and a length in CX, it returns an encrypted body with a freshly generated decryptor each time: varying registers, varying instruction selection, optional junk instructions, and a random key. The included tpe-gen.asm links against the engine and drops 50 differently-encrypted test files to disk so the author could check whether any two looked alike.

**Techniques**

- Random decryptor synthesis (register and opcode variation)
- Key generation and encrypted payload
- Optional junk/anti-emulation instructions
- Memory-relocatable mode (v1.3) so the encrypted body can live anywhere
- Deterministic generation testing: 50 samples, one engine

**Why it matters.** TPE is where malware stopped being a byte pattern and became a program generator. Every subsequent detection arms race — mutation engines, server-side polymorphic packers, and now ML classifiers over behavioural traces — descends from this shift.

- [Fuhs — encryption generators, MtE and TPE](https://www.fuhs.de/en/pub/encryptgen1.shtml)
- [Malware Wiki — TridenT Polymorphic Engine](https://malwiki.org/index.php?title=TridenT_Polymorphic_Engine)

### Companion virus demo (INT 2Eh)

*Family:* companion  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/companion-pof.asm  

Twelve instructions that do nothing but pass a filename to COMMAND.COM through the undocumented INT 2Eh interface, with the target file named ATTRIB.EXE and terminated with CR. It is the second half of a companion virus: the virus runs first and then hands off to the real program so the user sees normal behaviour.

**Techniques**

- Undocumented INT 2Eh (command interpreter) interface
- CR-terminated filename
- Companion execution handoff

**Why it matters.** Companions were the answer to 'the file size changed'. Create PROG.COM next to PROG.EXE, let DOS' extension precedence do the work, and the original binary stays byte-identical — which defeats checksum-based integrity checking of the era.

### Whistleblower (2003, not a virus)

*Family:* network scanning tool  
*Attributed to:* KSAJ Inc.  
*Source:* https://github.com/ksaj/Ontario1024/blob/master/whistleblower.c  

Included for contrast rather than for analysis: an NNTP scanner that logs servers carrying illegal newsgroups and reports tally counts. Unlike everything else in the corpus it is a networked, stateful client — which is precisely the shift that happened to malware between 1993 and 2003.

**Techniques**

- Socket programming
- Protocol enumeration
- Server-side content scanning

**Why it matters.** The corpus stops being about viruses around here. Once every host is online, replication stops needing floppies and infection stops being the interesting part; access, persistence and monetisation become the story. The timeline below picks up exactly there.

## 2. Wider timeline

Damage figures are the widely-cited estimates and vary between sources —
treat them as order-of-magnitude, not audited numbers.

| year | milestone | platform | class |
| --- | --- | --- | --- |
| 1971 | **Creeper** | TENEX / ARPANET | experimental worm |
| 1981 | **Elk Cloner** | Apple II | boot sector virus |
| 1983 | **Cohen's experiments** | UNIX | academic |
| 1986 | **Brain** | MS-DOS | boot sector virus |
| 1987 | **Vienna / Cascade / Jerusalem / Stoned** | MS-DOS | file and boot viruses |
| 1988 | **Morris worm** | UNIX / Internet | network worm |
| 1989 | **AIDS trojan / PC Cyborg** | MS-DOS | first ransomware |
| 1990 | **Chameleon / V2P1 / Whale** | MS-DOS | polymorphic virus |
| 1991 | **Michelangelo + MtE** | MS-DOS | boot virus + mutation engine |
| 1992 | **Michelangelo panic, and TPE** | MS-DOS | virus + engine |
| 1993 | **DAME, PS-MPC, virus kits** | MS-DOS | engine + construction kit |
| 1995 | **Concept** | Microsoft Word | macro virus |
| 1998 | **CIH / Chernobyl** | Windows 9x | file infector with firmware payload |
| 1999 | **Melissa** | Windows / Outlook | macro mass-mailer |
| 2000 | **ILOVEYOU** | Windows / VBScript | mass-mailing VBScript worm |
| 2001 | **Code Red / Nimda** | IIS / Windows | server worm |
| 2003 | **SQL Slammer / Blaster** | SQL Server / Windows RPC | network worm |
| 2004 | **Mydoom** | Windows / SMTP | mass-mailing worm + backdoor |
| 2008 | **Conficker** | Windows | worm with a botnet-style C2 |
| 2010 | **Stuxnet** | Windows → Siemens PLC | cyber-physical worm |
| 2013 | **CryptoLocker** | Windows | public-key ransomware |
| 2016 | **Mirai** | Linux / IoT | botnet |
| 2017 | **WannaCry / NotPetya** | Windows | worm + wiper |
| 2021 | **Colonial Pipeline / Kaseya** | OT + MSP supply chain | ransomware |
| 2024 | **Change Healthcare, LockBit takedown, RansomHub** | Enterprise | RaaS ecosystem |

### 1971 — Creeper

TENEX / ARPANET · experimental worm

Copies itself between DEC PDP-10 machines and prints a message; 'Reaper' is written to delete it. The first self-replicating program on a network.

### 1981 — Elk Cloner

Apple II · boot sector virus

Spread by floppy boot sector; shows a poem every 50th boot. Widely regarded as the first virus in the wild.

### 1983 — Cohen's experiments

UNIX · academic

Fred Cohen demonstrates self-replicating code in a controlled experiment and coins the term 'computer virus'.

### 1986 — Brain

MS-DOS · boot sector virus

Written in Lahore by the Farooq Alvi brothers as a piracy check; the first PC virus in the wild, and the first with a stealth component (it redirects reads of the infected sector).

### 1987 — Vienna / Cascade / Jerusalem / Stoned

MS-DOS · file and boot viruses

The year the genre industrialises. Stoned becomes the most common boot virus for years and is the ancestor of Michelangelo; Jerusalem triggers on Friday the 13th.

### 1988 — Morris worm

UNIX / Internet · network worm

Exploits sendmail, fingerd and weak passwords; ~6,000 machines, an estimated 10% of the internet, and the direct reason CERT was founded.

### 1989 — AIDS trojan / PC Cyborg

MS-DOS · first ransomware

Mails 20,000 floppies, encrypts file names and demands $189 for the decryption tool. Ransomware is born 24 years before CryptoLocker.

### 1990 — Chameleon / V2P1 / Whale

MS-DOS · polymorphic virus

First viruses whose bytes differ between infections — the concept that eventually motivates dedicated engines like MtE and TPE.

### 1991 — Michelangelo + MtE

MS-DOS · boot virus + mutation engine

Michelangelo is discovered in Melbourne; Dark Avenger releases the Mutation Engine, turning polymorphism from a craft into a toolkit. See samples/michelangelo.asm in this lab.

### 1992 — Michelangelo panic, and TPE

MS-DOS · virus + engine

Predictions of up to 5 million wiped PCs meet a real total of roughly 10,000–20,000 reported cases. In the same year TridenT ships TPE, today's corpus highlight.

### 1993 — DAME, PS-MPC, virus kits

MS-DOS · engine + construction kit

Polymorphic engines and point-and-click virus factories (PS-MPC, G2) flood the scene; Phalcon/SKISM becomes the best-known group.

### 1995 — Concept

Microsoft Word · macro virus

The first widespread macro virus: it travels inside ordinary .DOC files using the macro language, which most people did not consider executable. The vector migrates from boot code to documents.

### 1998 — CIH / Chernobyl

Windows 9x · file infector with firmware payload

Written by a Taiwanese student in ~1 KB. On 26 April it zeroes the first megabyte of the boot drive and tries to overwrite the flash BIOS. Estimates of machines affected range from one million to tens of millions; it is the first malware that could permanently brick hardware.

### 1999 — Melissa

Windows / Outlook · macro mass-mailer

Emails itself from an infected Word document via Outlook's address book. ~$300–600M in cleanup estimated, and the template for everything through 2004.

### 2000 — ILOVEYOU

Windows / VBScript · mass-mailing VBScript worm

Overwrites media files and mails itself; tens of millions of machines, roughly $8–10B estimated. The author was not prosecuted because Philippine law had no offence on the books at the time — the direct cause of the Budapest Convention's cybercrime statutes.

### 2001 — Code Red / Nimda

IIS / Windows · server worm

Code Red exploits an IIS buffer overflow, defaces sites and DDoSes the White House; ~$2.4B estimated. Nimda then combines every vector it can find — email, web, shares, back doors.

### 2003 — SQL Slammer / Blaster

SQL Server / Windows RPC · network worm

Slammer is ~376 bytes, doubles its infections every 8.5 seconds and saturates links worldwide within ten minutes; overhead 911 dispatch and Korean networks. Blaster's RPC worm adds a DDoS payload against windowsupdate.com.

### 2004 — Mydoom

Windows / SMTP · mass-mailing worm + backdoor

The fastest-spreading mass mailer on record and, for a while, the largest DDoS engine on the internet. Frequently cited as the most costly single outbreak (~$38B estimated).

### 2008 — Conficker

Windows · worm with a botnet-style C2

Exploits MS08-067 using file shares and USB autorun; millions of hosts and a globally scattered rendezvous domain algorithm that made takedown a cryptographic problem.

### 2010 — Stuxnet

Windows → Siemens PLC · cyber-physical worm

Four Windows zero-days plus PLC-rootkit code that damages centrifuges at Natanz. Malware stops being primarily criminal: the payload is physical.

### 2013 — CryptoLocker

Windows · public-key ransomware

RSA-keyed encryption with a hosted payment portal and a countdown timer — the business model that defines the following decade.

### 2016 — Mirai

Linux / IoT · botnet

Its 62-entry hard-coded default credentials build a botnet out of cameras and DVRs; a ~1.2 Tbps DDoS against Dyn DNS proves that consumer-grade hardware is the new attack surface. The source release spawned hundreds of variants.

### 2017 — WannaCry / NotPetya

Windows · worm + wiper

WannaCry uses the leaked EternalBlue exploit, hits ~200,000 systems in 150 countries and is stopped by a 'kill switch' domain. NotPetya, distributed through Ukrainian accounting software updates, is a wiper wearing ransomware's clothes: an estimated $10B in damages, with Maersk alone losing $200–300M.

### 2021 — Colonial Pipeline / Kaseya

OT + MSP supply chain · ransomware

A single stolen password shuts the largest US fuel pipeline; weeks later an MSP's management agent pushes ransomware to ~1,500 downstream businesses. The victim is now the supply chain, not the machine.

### 2024 — Change Healthcare, LockBit takedown, RansomHub

Enterprise · RaaS ecosystem

Operation Cronos seizes LockBit infrastructure in February; ALPHV exits with a scam; RansomHub takes the top spot in the leak-site rankings. Ransomware behaves like a franchise market: brands collapse, affiliates and tooling persist.

## 3. What carries forward

### The boot path is still code you own

Michelangelo worked because nothing between the BIOS and DOS could say no. Secure Boot, UEFI measured boot and firmware write protection are the modern answer — but the same technique keeps returning as bootkits (a modern sample of the same idea: compromised UEFI modules, ESP-only implants, and 'bootkit as a service' offerings in the RaaS market).

### Deception is cheaper than prevention

Compression, XOR, TPE-style generation, packers, then crypter services: every generation made the bytes lie about their behaviour. Static signatures were never going to win this race alone, which is why detection moved to behaviour and telemetry — and why the analyst workflow in this lab is disassemble-then-decompile rather than match-then-delete.

### Trust boundaries follow the file format

Boot sectors (1986), macro documents (1995), HTML/script attachments (2000), Office OLE + VBA (2010s), ISO/LNK containers, DLL side-loading and now container images and CI pipelines. Each time a format gains 'code with data' semantics, a new infection class appears within a few years.

### The technician, not the user, is the target

The anti-debug samples in this corpus exist to fool whoever is looking at them. Modern equivalents: timing checks against hypervisors, ptrace/ETW detection, EDR-killing drivers (BYOVD), and 'slow' families such as Rombertik that deliberately behave while being analysed. Analysis should therefore always run in a disposable environment, and 'observed behaviour' must be treated as a hypothesis.

### Escalation is about economics

1988's Morris worm wanted to gauge the size of the internet. 2013's CryptoLocker wanted money. 2017's NotPetya wanted destruction with collateral. 2024's leak-site rankings are an affiliate marketplace. Every jump in impact follows a change in who profits and how the work is subdivided.

### Patch, segment, and keep an offline copy

NotPetya's spread used a patch released two months earlier; Colonial Pipeline used one credential. Across four decades the mitigations that actually reduce harm stay boring: patch the exposed protocol, segment the network, back up offline with a tested restore, and hook the interrupt you cannot control — authentication, least privilege, and monitoring — instead of the one you can.

## 4. References

- [ksaj / Ontario1024 — early-90s virus source corpus](https://github.com/ksaj/Ontario1024)
- [Wikipedia — Michelangelo (computer virus)](https://en.wikipedia.org/wiki/Michelangelo_(computer_virus))
- [F-Secure — Michelangelo](https://www.f-secure.com/v-descs/michel.shtml)
- [Fuhs — encryption generators: MtE, TPE, DAME](https://www.fuhs.de/en/pub/encryptgen1.shtml)
- [Malware Wiki — TridenT Polymorphic Engine](https://malwiki.org/index.php?title=TridenT_Polymorphic_Engine)
- [Wikipedia — WannaCry ransomware attack](https://en.wikipedia.org/wiki/WannaCry_ransomware_attack)
- [Krebs on Security — Mirai source code released](https://krebsonsecurity.com/2016/10/source-code-for-iot-botnet-mirai-released/)
- [GAO testimony — ILOVEYOU and Code Red damages (2001)](https://www.gao.gov/assets/gao-01-1073t.pdf)
- [Unit 42 — ransomware review, first half 2024](https://unit42.paloaltonetworks.com/unit-42-ransomware-leak-site-data-analysis/)
- [ODNI CTIIC — worldwide ransomware attacks, 2024](https://www.dni.gov/files/CTIIC/documents/products/Worldwide_Ransomware_Attacks_as_of_June_2024_Consistent_With_Previous_Year_Sep2024.pdf)
- [@mauricelam/ghidra-decompiler-wasm — Ghidra's C++ decompiler compiled to WebAssembly (Apache-2.0)](https://github.com/mauricelam/ghidra-decompiler)
- [NSA Ghidra — SLEIGH processor specs (Apache-2.0)](https://github.com/NationalSecurityAgency/ghidra)
