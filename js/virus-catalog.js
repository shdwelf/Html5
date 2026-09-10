/**
 * virus-catalog.js — research data behind the Ghidra lab.
 *
 * Two bodies of material live here:
 *
 *  1. SAMPLES  — the Ontario1024 corpus (github.com/ksaj/Ontario1024) plus the
 *     three entries that have been reassembled into real machine code so the
 *     Ghidra decompiler has something to chew on.  Notes are written from
 *     reading the sources, not copied from vendor write-ups.
 *
 *  2. TIMELINE / LESSONS / REFERENCES — the wider virology research: what the
 *     1989–1995 DOS scene actually invented, and how those ideas mutated into
 *     macro worms, mass mailers, IoT botnets and the ransomware economy.
 *
 * Everything here is inert data. Nothing in this file (or the lab) executes a
 * sample; the samples are 16-bit real-mode DOS code that requires a BIOS and a
 * physical floppy controller to do anything at all.
 */

/* ------------------------------------------------------------------ samples */

const ONT = "https://github.com/ksaj/Ontario1024/blob/master";

/**
 * @typedef {object} Sample
 * @property {string} id
 * @property {string} name
 * @property {string} kind        boot-sector | com-infector | engine | anti-debug | utility
 * @property {string|null} binary path under samples/bin (only when reassembled here)
 * @property {string} source      path under samples/src
 * @property {string} origin      where the source text came from
 */

export const SAMPLES = [
  {
    id: "michelangelo",
    name: "Michelangelo",
    aka: ["Michelangelo.A", "March6", "Stoned.II"],
    kind: "boot-sector",
    era: "1991 (discovered by Roger Riordan, Melbourne)",
    family: "Stoned lineage",
    authored: "unknown",
    binary: "samples/bin/michelangelo.bin",
    source: "samples/src/michelangelo.asm",
    assembled: "samples/src/michelangelo.gas.s",
    origin: `${ONT}/michelangelo.asm`,
    base: "0x7c00",
    entry: "0x7c00",
    lang: "x86:LE:16:Real Mode",
    compiler: "default",
    byteLength: 512,
    signature: "0xAA55 at offset 0x1FE; first bytes E9 ?? ?? then six data words (Hi_JMP, Hi_JMP_Seg, Disk_Number, Track_Sector, INT13_Ofs, INT13_Seg)",
    summary:
      "The most famous boot sector virus of the DOS era, and a pure BIOS-level program: it never calls DOS once. It hooks INT 13h, hides the original boot sector on a spare sector of track 0, and sits resident in the top 2 KB of conventional memory. The destructive payload fires when the BIOS clock reports 6 March, which is why the press called it Michelangelo.",
    whyItMatters:
      "Michelangelo is the cleanest teaching sample in the corpus: 512 bytes that demonstrate IVT hooking, conventional-memory theft, self-relocation, disk-chainloading and a date-triggered payload — every primitive of a pre-network malware economy, in one readable file.",
    techniques: [
      "INT 13h hook (floppy writes only, and only when the drive motor is idle)",
      "Residency by decrementing the BIOS base-memory word at 0040:0013 by 2 KB",
      "Self-relocation to the freed segment and a far jump through a patched pointer",
      "Original boot sector relocated to head 1, sector 3 (360 KB) or sector 0x0E (other media)",
      "Partition table carried across by copying 0x21 words from 0x3BE to 0x1BE",
      "Date trigger: INT 1Ah AH=04, DX == 0x0306",
      "Payload: writes 0x11 sectors per track across heads 0–3, cylinders increasing",
    ],
    narrative: [
      "Machine boots from an infected floppy or MBR. The virus is at 0000:7C00 and starts by relocating itself.",
      "DS=0, SS=0, SP=7C00 — the classic boot-time land-grab. The old INT 13h vector is copied out of the IVT at 0000:004C into the virus's own data words.",
      "WORD 0040:0013 (kilobytes of base memory) is decremented twice, i.e. 2 KB is stolen, and the new top-of-memory segment is computed with a SHL 6.",
      "INT 13h now points at the virus's handler in the stolen segment; 0x1BE bytes are copied up there and the CPU far-jumps to the copy. The original 512 bytes at 7C00 are dead weight from here on.",
      "The handler is deliberately fussy: it only infects when DL=0 (first floppy), the motor-idle bit at 0040:0043F is clear, and the boot sector's first four bytes do not already match.",
      "On 6 March, Detonate stops infecting and starts writing 17 sectors to every track, head 0 through 3, walking cylinders upward — enough to erase the FAT, root directory and MBR.",
    ],
    annotations: [
      { label: "Mich_Boot", addr: "0x7C00", note: "Entry point. A near jump over the 14 bytes of virus state that follow — the same layout trick Stoned used." },
      { label: "Hi_JMP / Track_Sector / INT13_Ofs", addr: "0x7C03", note: "Virus data, not code. Hijacked jump target, saved INT 13h vector (offset/segment) and the track/sector where the real boot sector was hidden." },
      { label: "INT_13h", addr: "0x7C0E", note: "Resident INT 13h handler. Filters on DL=0 and the disk-motor bit at 0040:0043F, then chains to the real BIOS handler via a far call through the saved vector." },
      { label: "Infect", addr: "0x7C36", note: "Reads the boot sector to 0200:0000, compares four signature bytes, then relocates the real boot sector and overwrites sector 1 with itself." },
      { label: "Move_Real_Boot", addr: "0x7C71", note: "Chooses the hiding place: sector 3 for 360 KB floppies (checked via the media descriptor at [BX+0x15] == 0xFD), sector 0x0E otherwise." },
      { label: "Quit", addr: "0x7CA6", note: "Nine pops and RETN — the handler restores every register it touched and returns to the caller of INT 13h." },
      { label: "Second_Entry", addr: "0x7CAF", note: "Installer. Runs once at boot from 7C00: grabs the IVT, steals memory, hooks INT 13h, copies itself to the new segment." },
      { label: "JMP_Here", addr: "0x7CF6", note: "Continuation in the stolen segment. Loads the real boot sector back and chains to it, so the boot looks normal." },
      { label: "Check_Date", addr: "0x7D3F", note: "INT 1Ah AH=04 returns the date in DX as (year<<9)|(month<<5)|day, so 6 March 1992 reads 0x0306. CX is zeroed first because only DX matters." },
      { label: "Detonate", addr: "0x7D4C", note: "The payload. AX=0x0309 (write 9 sectors) upgraded to AL=0x11 (17 sectors) on hard disks, ES=BX=0x5000 as the junk buffer." },
      { label: "Infect_Partition", addr: "0x7D88", note: "MBR infection: original master boot record to cylinder 0 / head 0 / sector 7, partition table copied to 0x1BE of the viral sector, virus written to sector 1." },
      { label: "Partitions", addr: "0x7DBE", note: "ORG 0x1BE — this is the hard limit on virus size. Everything the virus can ever be lives below this offset." },
    ],
    refs: [
      { label: "Wikipedia — Michelangelo (computer virus)", url: "https://en.wikipedia.org/wiki/Michelangelo_(computer_virus)" },
      { label: "F-Secure — Michelangelo description", url: "https://www.f-secure.com/v-descs/michel.shtml" },
      { label: "Graham Cluley — Memories of the Michelangelo virus", url: "https://grahamcluley.com/michelangelo-virus/" },
    ],
  },

  {
    id: "malmsey-habitat-13",
    name: "Malmsey Habitat v1.3",
    aka: ["Malmsey", "Habitat"],
    kind: "com-infector",
    era: "early 1990s",
    family: "Malmsey Habitat (ANARKICK SYSTEMS)",
    authored: "ksaj / ANARKICK SYSTEMS",
    binary: "samples/bin/malmsey-habitat-13.bin",
    source: "samples/src/malms-13.asm",
    assembled: "samples/src/malmsey-habitat-13.gas.s",
    origin: `${ONT}/malms-13.asm`,
    base: "0x100",
    entry: "0x100",
    lang: "x86:LE:16:Real Mode",
    compiler: "default",
    byteLength: 496,
    signature: "first two bytes 0x8B 0xF6 (`mov si,si`, a 2-byte no-op used as the infection marker)",
    summary:
      "A memory-resident .COM appender written to demonstrate a *payload* rather than a payload-free replication engine. It walks the current directory with DOS FindFirst/FindNext, appends itself to every .COM file it can open read/write, and on the 3rd of any month at 22:00 draws an animated 'crunchy face' with BIOS video services, chomping its jaws and printing a credit line.",
    whyItMatters:
      "It shows the file-infector workhorse pattern that replaced boot sectors as the dominant DOS vector: TSR residency, a delta offset for position-independent code, DOS file API abuse, and a marker check so a file is never infected twice.",
    techniques: [
      "`mov si,si` used as a 2-byte, harmless infection marker (compare word at file offset 0 with 0xF68B)",
      "DOS memory block surgery: shrink the MCB at PSP-1, reserve 0xC0 paragraphs, copy up high",
      "Delta offset for relocatable code inside a segment",
      "FindFirst (4Eh) / FindNext (4Fh) directory walk with attribute mask 0x27",
      "Append-at-EOF infection: open 3D02h, seek 4200h, write 40h",
      "Date/time trigger: INT 21h AH=2Ah, DL==3, DH==10",
      "Payload built entirely from INT 10h teletype/scroll calls, tuned with busy-wait LOOP delays",
    ],
    narrative: [
      "A file is executed; the virus is at the top of it. `mov si,si` is both the entry point and the infection marker future copies will check for.",
      "It walks the current directory for *.COM, and for each candidate reads the first two bytes. If they are not `mov si,si`, the file gets the whole 496 bytes written over its first four bytes of code path via the appended-copy routine.",
      "On the 3rd of the month between 22:00 and 23:00 it hijacks the display: it saves the screen, draws eyes and a mouth, then animates by alternating scroll-up and scroll-down on two screen windows while its own teeth march across the bottom row.",
      "Finally it prints a message char-by-char through the teletype service and hangs on a zero byte. The hang is deliberate — no clean exit, because the goal was to be seen.",
    ],
    annotations: [
      { label: "id_bytes", addr: "0x100", note: "`mov si,si` (0x8B 0xF6) — marker byte pair checked before every infection." },
      { label: "main", addr: "0x102", note: "Directory sweep setup: AH=4Eh find-first, CX=0x27 attribute mask (hidden + system + volume + normal)." },
      { label: "infect_file", addr: "0x24B", note: "Open RW (3D02h), read 2 bytes, compare against the marker, seek to 0 (4200h), write the virus (40h), close (3Eh)." },
      { label: "exit_virus", addr: "0x117", note: "Payload gate: INT 21h AH=2Ah returns day in DL and hour in DH." },
      { label: "eat_screen", addr: "0x127", note: "Payload start. Video mode 3 + read attribute via INT 10h AH=08/00." },
      { label: "make_teeth", addr: "0x19C", note: "Draws 0x50 alternating teeth across row 2 and row 0x17 using INT 10h AH=09." },
      { label: "close_jaws", addr: "0x1E2", note: "The animation: scroll-up window 13..24 and scroll-down window 0..12 with the running colour counter in BH." },
      { label: "fuckin_loop", addr: "0x240", note: "Teletype print of the credit string, then an infinite LOADSB loop that hangs the machine when the string runs out." },
      { label: "buffer", addr: "0x27F", note: "Two-byte scratch used for the infection marker comparison." },
      { label: "com_spec", addr: "0x281", note: "The ASCIIZ pattern '*.COM' handed to FindFirst in DX." },
    ],
    refs: [
      { label: "Malmsey Habitat note (ksaj)", url: `${ONT}/malmsey-habitat.md` },
      { label: "Archive.org — MALMSEY.COM payload capture", url: "https://archive.org/details/malware_MALMSEY.COM" },
    ],
  },

  {
    id: "zippy",
    name: "Zippy",
    aka: ["trivial overwriter"],
    kind: "com-infector",
    era: "early 1990s",
    family: "teaching sample",
    authored: "ksaj",
    binary: "samples/bin/zippy.bin",
    source: "samples/src/zippy.asm",
    assembled: "samples/src/zippy.gas.s",
    origin: `${ONT}/zippy.asm`,
    base: "0x100",
    entry: "0x100",
    lang: "x86:LE:16:Real Mode",
    compiler: "default",
    byteLength: 36,
    signature: "36 bytes; DOS FindFirst 4Eh then Open 3D01h then write 40h",
    summary:
      "The smallest possible file infector: 36 bytes, no residency, no stealth, no payload. It finds the first .COM in the current directory and overwrites the start of it with itself, using the DTA filename that DOS leaves at PSP:009E.",
    whyItMatters:
      "Every concept in a virus is visible in three dozen instructions, which makes it the right first sample to hand a disassembler — and it is the perfect size to watch Ghidra turn into C.",
    techniques: [
      "DOS FindFirst (4Eh) with CX=0 (normal attributes) to get a victim name into the DTA",
      "Open at write-only (3D01h) using the ASCIIZ name DOS already placed at offset 0x9E",
      "Write (40h) from DS:SI — a pointer the parent program is expected to have set up",
    ],
    narrative: [
      "Finds the first *.COM in the current directory, opens it for writing, and writes 0x24 bytes over its beginning. That is the entire logic.",
      "Because it is an overwriter, the victim does not survive: this is the 'do not run me' end of the taxonomy, and the reason the sample is only useful with a debugger and a scratch directory.",
    ],
    annotations: [
      { label: "zippy", addr: "0x100", note: "Entry. AH=4Eh find-first with CX=0." },
      { label: "comfile", addr: "0x11E", note: "'*.COM' ASCIIZ pattern, addressed with LEA DX." },
      { label: "virend", addr: "0x124", note: "End marker: the virus writes (virend - zippy) = 0x24 bytes of itself." },
    ],
    refs: [{ label: "zippy.asm", url: `${ONT}/zippy.asm` }],
  },

  /* ----- source-only entries: interesting code, not reassembled here ----- */

  {
    id: "kilroy",
    name: "Kilroy",
    kind: "boot-sector",
    era: "early 1990s",
    family: "boot sector / bootable-OEM",
    binary: null,
    source: "samples/src/kilroy.asm",
    origin: `${ONT}/kilroy.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "A one-sector boot sector virus that plays at being a legitimate boot record. It carries a full BIOS Parameter Block, embeds the OEM name 'KILROY  ', and copies the original boot sector to sector 0x0E so the machine still boots. Its infection decision reads BIOS RAM at 0040:0010 (system info byte) and 0040:0075 (hard disk count) to pick targets.",
    whyItMatters:
      "It shows why boot sector viruses were so hard to spot: this one is a *better* formatted boot sector than most real ones, complete with a BPB table that passes a casual sector dump.",
    techniques: [
      "Fake-but-valid BPB/OEM header fields for camouflage",
      "Reads BIOS data area for drive enumeration (0040:0010, 0040:0075)",
      "Preserves the host by relocating the original boot sector",
      "Assembled as a .COM with ORG 0x100 and a jump stub so the code can be built and tested under DOS",
    ],
  },
  {
    id: "exebug",
    name: "EXEBUG2",
    kind: "boot-sector",
    era: "March-any-year detonator",
    family: "boot sector, 286+",
    binary: null,
    source: "samples/src/exebug.asm",
    origin: `${ONT}/exebug.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "A partially disassembled boot sector virus that requires 80286 features and activates in March of any year, destroying the hard drive. The source is an annotated disassembly rather than authored source — opcode column included — which makes it a nice cross-check for a disassembler.",
    whyItMatters:
      "Where Michelangelo triggers on one date, EXEBUG2 triggers on a whole month: a one-byte change to the day comparison turns a single-day event into a season-long one, and shifts the detection window an analyst gets.",
    techniques: ["80286-only instructions", "Month-only trigger", "Disk destruction payload", "Carries its own opcode listing from a 1990s disassembler"],
  },
  {
    id: "kstest",
    name: "KS Test (encrypted boot sector)",
    kind: "boot-sector",
    era: "early 1990s",
    family: "self-encrypting boot sector",
    binary: null,
    source: "samples/src/kstest.asm",
    origin: `${ONT}/kstest.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "A boot sector that is stored encrypted and decrypts itself at run time: a tight loop ADDs a single byte key across its own body, then falls through into the now-plaintext `first_4` bytes. The key byte is patched at assembly time via the `key equ $-1` idiom, and the decryptor is written so its own instructions mutate between generations.",
    whyItMatters:
      "This is the bridge from 'encrypted' to 'polymorphic'. Once the key and the decryptor instructions vary per infection you have TPE and MtE; the entropy strip in the lab shows exactly what that looks like in a binary — a high-entropy blob behind a few bytes of plaintext loop.",
    techniques: [
      "Self-decrypting body (ADD byte ptr cs:[bx], al)",
      "Assembly-time key patching with `equ $-1`",
      "Self-modifying decryptor so each generation's bytes differ",
      "Installation check via INT 21h with AX=0xFFFF and AL/AH comparison",
      "Classic TSR residency via MCB shrink at PSP-1 and INT 21h vector hook",
    ],
  },
  {
    id: "lezbo",
    name: "Lezbo",
    kind: "com-infector",
    era: "1993",
    family: "386-aware resident infector",
    binary: null,
    source: "samples/src/lezbo.asm",
    origin: `${ONT}/lezbo.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "A 386-aware resident .COM/EXE infector assembled with P386N. It computes its own delta offset from a self-referenced label, checks for an existing installation with the AX=0xFFFF trick, saves the INT 21h vector with a single 32-bit load (`mov eax, ds:21h*4`), then shrinks the host's MCB to build its own high-memory segment.",
    whyItMatters:
      "The delta-offset prologue and the MCB shrink here are the same three paragraphs of code in every 1990s resident virus — recognise them and you can find the resident part of any sample instantly.",
    techniques: ["P386N non-protected-mode 32-bit addressing", "Delta offset for position independence", "32-bit IVT read/write", "MCB shrink at PSP-1", "Restores the host's first four bytes so the original program still runs"],
  },
  {
    id: "proto-3",
    name: "Proto-3",
    kind: "com-infector",
    era: "1993-94",
    family: "80386 resident, encrypted payload",
    binary: null,
    source: "samples/src/proto-3.asm",
    origin: `${ONT}/proto-3.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "A 386-only resident infector that computes a delta offset via CALL/POP, reads and writes the INT 21h vector with 32-bit moves, and encrypts the host's first bytes with XOR plus a fill value so the infection is not a plain byte-for-byte append.",
    whyItMatters:
      "Adding XOR to the infection routine breaks the simplest generic detector of the era (search for the virus signature at file start). Security tooling has been chasing that same regression ever since — signature, then heuristic, then behavioural, then ML.",
    techniques: ["CALL/POP delta offset", "32-bit IVT manipulation", "XOR-encrypted host bytes with a configurable fill value", "Data block laid out at ORG 0xE0 above the code"],
  },
  {
    id: "dos-7c",
    name: "DOS_7 / anti-debug trapdoor",
    kind: "com-infector",
    era: "early 1990s",
    family: "debugger detection",
    binary: null,
    source: "samples/src/dos-7c.asm",
    origin: `${ONT}/dos-7c.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "A short .COM that overwrites its own code with a target offset, aliases INT 3 onto INT 21h by copying two words of the IVT, hooks INT 0 (divide by zero) and then deliberately divides by zero. On real hardware the CPU jumps into the real code path; under a single-stepping debugger the prefetch buffer has already swallowed the unstomped instruction and control lands in a routine that overwrites the hard disk.",
    whyItMatters:
      "It is a time bomb aimed at the analyst, not the user. The modern equivalent is malware that behaves differently under ptrace/ETW instrumentation — and the defensive answer is the same as it was in 1992: analyse in a disposable, isolated environment and expect any observable behaviour to differ under a debugger.",
    techniques: ["Self-modifying code with `EQU $-2` offsets", "IVT aliasing (INT 3 → INT 21h)", "Prefix-prefetch trick", "Debugger-conditional destruction payload"],
  },
  {
    id: "anti-debug-1a",
    name: "Anti-debug 1a — trace poison",
    kind: "anti-debug",
    era: "early 1990s",
    family: "self-modification",
    binary: null,
    source: "samples/src/anti-debug1a.asm",
    origin: `${ONT}/anti-debug1a.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "`mov ax,0FE05h; jmp $-2` — the jump lands back inside the MOV, so the CPU sees a different opcode than a disassembler does. Then the stack pointer is aimed at the code itself so any INT 21h return address lands on a controlled instruction.",
    whyItMatters: "The oldest trick in the book: desynchronise the disassembler from the CPU. Ghidra's linear sweep has to guess; a real CPU cannot.",
    techniques: ["Jump into the middle of an instruction", "Stack pointer used as a control-flow register"],
  },
  {
    id: "anti-debug-1b",
    name: "Anti-debug 1b — patch my own argument",
    kind: "anti-debug",
    era: "early 1990s",
    family: "self-modification",
    binary: null,
    source: "samples/src/anti-debug1b.asm",
    origin: `${ONT}/anti-debug1b.asm`,
    lang: "x86:LE:16:Real Mode",
    summary: "Writes 9 into the byte immediately before `int 21h`, turning AH=4Ch (terminate) into AH=09h (print string) — but only if the value is patched back before the interrupt, which a tracing debugger allows and normal execution does not.",
    whyItMatters: "Presence detection by self-patching: the program decides it is being watched because its own memory changed under conditions that only a debugger produces.",
    techniques: ["Self-patching instruction operand", "Trace-dependent behaviour"],
  },
  {
    id: "anti-debug-1c",
    name: "Anti-debug 1c — message swap",
    kind: "anti-debug",
    era: "early 1990s",
    family: "self-modification",
    binary: null,
    source: "samples/src/anti-debug1c.asm",
    origin: `${ONT}/anti-debug1c.asm`,
    lang: "x86:LE:16:Real Mode",
    summary: "Patches its own string pointer before INT 21h so that a debugger which halts at the interrupt sees a different message than the one that actually reaches DOS.",
    whyItMatters: "A neat demonstration that 'the analyst observed X' is not the same claim as 'the code does X'.",
    techniques: ["Self-modifying pointer operand", "Observable state vs. executed state"],
  },
  {
    id: "anti-debug-1d",
    name: "Anti-debug 1d — INT 0 hijack",
    kind: "anti-debug",
    era: "early 1990s",
    family: "exception redirection",
    binary: null,
    source: "samples/src/anti-debug1d.asm",
    origin: `${ONT}/anti-debug1d.asm`,
    lang: "x86:LE:16:Real Mode",
    summary: "Saves the INT 0 vector, points it at its own routine, then divides by zero on purpose. The exception handler restores the original vector and continues — control flow that no static tool recovers from a linear sweep.",
    whyItMatters: "Exception-vector hijacking as a control-flow obfuscation primitive, twenty years before SEH abuse in Windows malware.",
    techniques: ["INT 0 reprogramming", "Deliberate divide-by-zero", "Handler-based control transfer"],
  },
  {
    id: "anti-debug-1e",
    name: "Anti-debug 1e — timer side channel",
    kind: "anti-debug",
    era: "early 1990s",
    family: "timing",
    binary: null,
    source: "samples/src/anti-debug1e.asm",
    origin: `${ONT}/anti-debug1e.asm`,
    lang: "x86:LE:16:Real Mode",
    summary: "Hooks the timer interrupt (INT 8, installed through INT 21h AH=25h) and then spins on a flag that only the timer tick can set. Under a debugger the loop never completes, because the tick never lands while the debugger owns the machine.",
    whyItMatters: "Timing- and interrupt-based environment checks are the direct ancestor of today's anti-VM and sandbox-evasion logic, which is also a race between the sample and its observer.",
    techniques: ["INT 8 (timer) hook via DOS", "Interrupt-driven flag spin", "Presence check through hardware timing"],
  },
  {
    id: "tpe",
    name: "Trident Polymorphic Engine (v1.1 / v1.2 / v1.3 + generator)",
    kind: "engine",
    era: "1991-1994",
    family: "polymorphic engine",
    authored: "Masud Khafir / TridenT, released in the Netherlands",
    binary: null,
    source: "samples/src/tpe_v13.asm",
    sourceExtra: ["samples/src/tpe_v11.asm", "samples/src/tpe_v12.asm", "samples/src/tpe-gen.asm"],
    origin: `${ONT}/tpe_v13.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "The engine that made 1990s scanners obsolete. Handed a code buffer in DS:DX, ES:BP and a length in CX, it returns an encrypted body with a freshly generated decryptor each time: varying registers, varying instruction selection, optional junk instructions, and a random key. The included tpe-gen.asm links against the engine and drops 50 differently-encrypted test files to disk so the author could check whether any two looked alike.",
    whyItMatters:
      "TPE is where malware stopped being a byte pattern and became a program generator. Every subsequent detection arms race — mutation engines, server-side polymorphic packers, and now ML classifiers over behavioural traces — descends from this shift.",
    techniques: [
      "Random decryptor synthesis (register and opcode variation)",
      "Key generation and encrypted payload",
      "Optional junk/anti-emulation instructions",
      "Memory-relocatable mode (v1.3) so the encrypted body can live anywhere",
      "Deterministic generation testing: 50 samples, one engine",
    ],
    refs: [
      { label: "Fuhs — encryption generators, MtE and TPE", url: "https://www.fuhs.de/en/pub/encryptgen1.shtml" },
      { label: "Malware Wiki — TridenT Polymorphic Engine", url: "https://malwiki.org/index.php?title=TridenT_Polymorphic_Engine" },
    ],
  },
  {
    id: "companion-pof",
    name: "Companion virus demo (INT 2Eh)",
    kind: "com-infector",
    era: "early 1990s",
    family: "companion",
    binary: null,
    source: "samples/src/companion-pof.asm",
    origin: `${ONT}/companion-pof.asm`,
    lang: "x86:LE:16:Real Mode",
    summary:
      "Twelve instructions that do nothing but pass a filename to COMMAND.COM through the undocumented INT 2Eh interface, with the target file named ATTRIB.EXE and terminated with CR. It is the second half of a companion virus: the virus runs first and then hands off to the real program so the user sees normal behaviour.",
    whyItMatters:
      "Companions were the answer to 'the file size changed'. Create PROG.COM next to PROG.EXE, let DOS' extension precedence do the work, and the original binary stays byte-identical — which defeats checksum-based integrity checking of the era.",
    techniques: ["Undocumented INT 2Eh (command interpreter) interface", "CR-terminated filename", "Companion execution handoff"],
  },
  {
    id: "whistleblower",
    name: "Whistleblower (2003, not a virus)",
    kind: "utility",
    era: "2003",
    family: "network scanning tool",
    authored: "KSAJ Inc.",
    binary: null,
    source: "samples/src/whistleblower.c",
    origin: `${ONT}/whistleblower.c`,
    lang: "C",
    summary:
      "Included for contrast rather than for analysis: an NNTP scanner that logs servers carrying illegal newsgroups and reports tally counts. Unlike everything else in the corpus it is a networked, stateful client — which is precisely the shift that happened to malware between 1993 and 2003.",
    whyItMatters:
      "The corpus stops being about viruses around here. Once every host is online, replication stops needing floppies and infection stops being the interesting part; access, persistence and monetisation become the story. The timeline below picks up exactly there.",
    techniques: ["Socket programming", "Protocol enumeration", "Server-side content scanning"],
  },
];

/* ----------------------------------------------------------------- timeline */

/**
 * Selected milestones. Damage figures are the commonly cited estimates and
 * vary wildly between sources — they are marked as estimates for that reason.
 */
export const TIMELINE = [
  { year: 1971, name: "Creeper", platform: "TENEX / ARPANET", class: "experimental worm", note: "Copies itself between DEC PDP-10 machines and prints a message; 'Reaper' is written to delete it. The first self-replicating program on a network." },
  { year: 1981, name: "Elk Cloner", platform: "Apple II", class: "boot sector virus", note: "Spread by floppy boot sector; shows a poem every 50th boot. Widely regarded as the first virus in the wild." },
  { year: 1983, name: "Cohen's experiments", platform: "UNIX", class: "academic", note: "Fred Cohen demonstrates self-replicating code in a controlled experiment and coins the term 'computer virus'." },
  { year: 1986, name: "Brain", platform: "MS-DOS", class: "boot sector virus", note: "Written in Lahore by the Farooq Alvi brothers as a piracy check; the first PC virus in the wild, and the first with a stealth component (it redirects reads of the infected sector)." },
  { year: 1987, name: "Vienna / Cascade / Jerusalem / Stoned", platform: "MS-DOS", class: "file and boot viruses", note: "The year the genre industrialises. Stoned becomes the most common boot virus for years and is the ancestor of Michelangelo; Jerusalem triggers on Friday the 13th." },
  { year: 1988, name: "Morris worm", platform: "UNIX / Internet", class: "network worm", note: "Exploits sendmail, fingerd and weak passwords; ~6,000 machines, an estimated 10% of the internet, and the direct reason CERT was founded." },
  { year: 1989, name: "AIDS trojan / PC Cyborg", platform: "MS-DOS", class: "first ransomware", note: "Mails 20,000 floppies, encrypts file names and demands $189 for the decryption tool. Ransomware is born 24 years before CryptoLocker." },
  { year: 1990, name: "Chameleon / V2P1 / Whale", platform: "MS-DOS", class: "polymorphic virus", note: "First viruses whose bytes differ between infections — the concept that eventually motivates dedicated engines like MtE and TPE." },
  { year: 1991, name: "Michelangelo + MtE", platform: "MS-DOS", class: "boot virus + mutation engine", note: "Michelangelo is discovered in Melbourne; Dark Avenger releases the Mutation Engine, turning polymorphism from a craft into a toolkit. See samples/michelangelo.asm in this lab." },
  { year: 1992, name: "Michelangelo panic, and TPE", platform: "MS-DOS", class: "virus + engine", note: "Predictions of up to 5 million wiped PCs meet a real total of roughly 10,000–20,000 reported cases. In the same year TridenT ships TPE, today's corpus highlight." },
  { year: 1993, name: "DAME, PS-MPC, virus kits", platform: "MS-DOS", class: "engine + construction kit", note: "Polymorphic engines and point-and-click virus factories (PS-MPC, G2) flood the scene; Phalcon/SKISM becomes the best-known group." },
  { year: 1995, name: "Concept", platform: "Microsoft Word", class: "macro virus", note: "The first widespread macro virus: it travels inside ordinary .DOC files using the macro language, which most people did not consider executable. The vector migrates from boot code to documents." },
  { year: 1998, name: "CIH / Chernobyl", platform: "Windows 9x", class: "file infector with firmware payload", note: "Written by a Taiwanese student in ~1 KB. On 26 April it zeroes the first megabyte of the boot drive and tries to overwrite the flash BIOS. Estimates of machines affected range from one million to tens of millions; it is the first malware that could permanently brick hardware." },
  { year: 1999, name: "Melissa", platform: "Windows / Outlook", class: "macro mass-mailer", note: "Emails itself from an infected Word document via Outlook's address book. ~$300–600M in cleanup estimated, and the template for everything through 2004." },
  { year: 2000, name: "ILOVEYOU", platform: "Windows / VBScript", class: "mass-mailing VBScript worm", note: "Overwrites media files and mails itself; tens of millions of machines, roughly $8–10B estimated. The author was not prosecuted because Philippine law had no offence on the books at the time — the direct cause of the Budapest Convention's cybercrime statutes." },
  { year: 2001, name: "Code Red / Nimda", platform: "IIS / Windows", class: "server worm", note: "Code Red exploits an IIS buffer overflow, defaces sites and DDoSes the White House; ~$2.4B estimated. Nimda then combines every vector it can find — email, web, shares, back doors." },
  { year: 2003, name: "SQL Slammer / Blaster", platform: "SQL Server / Windows RPC", class: "network worm", note: "Slammer is ~376 bytes, doubles its infections every 8.5 seconds and saturates links worldwide within ten minutes; overhead 911 dispatch and Korean networks. Blaster's RPC worm adds a DDoS payload against windowsupdate.com." },
  { year: 2004, name: "Mydoom", platform: "Windows / SMTP", class: "mass-mailing worm + backdoor", note: "The fastest-spreading mass mailer on record and, for a while, the largest DDoS engine on the internet. Frequently cited as the most costly single outbreak (~$38B estimated)." },
  { year: 2008, name: "Conficker", platform: "Windows", class: "worm with a botnet-style C2", note: "Exploits MS08-067 using file shares and USB autorun; millions of hosts and a globally scattered rendezvous domain algorithm that made takedown a cryptographic problem." },
  { year: 2010, name: "Stuxnet", platform: "Windows → Siemens PLC", class: "cyber-physical worm", note: "Four Windows zero-days plus PLC-rootkit code that damages centrifuges at Natanz. Malware stops being primarily criminal: the payload is physical." },
  { year: 2013, name: "CryptoLocker", platform: "Windows", class: "public-key ransomware", note: "RSA-keyed encryption with a hosted payment portal and a countdown timer — the business model that defines the following decade." },
  { year: 2016, name: "Mirai", platform: "Linux / IoT", class: "botnet", note: "Its 62-entry hard-coded default credentials build a botnet out of cameras and DVRs; a ~1.2 Tbps DDoS against Dyn DNS proves that consumer-grade hardware is the new attack surface. The source release spawned hundreds of variants." },
  { year: 2017, name: "WannaCry / NotPetya", platform: "Windows", class: "worm + wiper", note: "WannaCry uses the leaked EternalBlue exploit, hits ~200,000 systems in 150 countries and is stopped by a 'kill switch' domain. NotPetya, distributed through Ukrainian accounting software updates, is a wiper wearing ransomware's clothes: an estimated $10B in damages, with Maersk alone losing $200–300M." },
  { year: 2021, name: "Colonial Pipeline / Kaseya", platform: "OT + MSP supply chain", class: "ransomware", note: "A single stolen password shuts the largest US fuel pipeline; weeks later an MSP's management agent pushes ransomware to ~1,500 downstream businesses. The victim is now the supply chain, not the machine." },
  { year: 2024, name: "Change Healthcare, LockBit takedown, RansomHub", platform: "Enterprise", class: "RaaS ecosystem", note: "Operation Cronos seizes LockBit infrastructure in February; ALPHV exits with a scam; RansomHub takes the top spot in the leak-site rankings. Ransomware behaves like a franchise market: brands collapse, affiliates and tooling persist." },
];

/* ------------------------------------------------------------------ lessons */

export const LESSONS = [
  {
    title: "The boot path is still code you own",
    body: "Michelangelo worked because nothing between the BIOS and DOS could say no. Secure Boot, UEFI measured boot and firmware write protection are the modern answer — but the same technique keeps returning as bootkits (a modern sample of the same idea: compromised UEFI modules, ESP-only implants, and 'bootkit as a service' offerings in the RaaS market).",
  },
  {
    title: "Deception is cheaper than prevention",
    body: "Compression, XOR, TPE-style generation, packers, then crypter services: every generation made the bytes lie about their behaviour. Static signatures were never going to win this race alone, which is why detection moved to behaviour and telemetry — and why the analyst workflow in this lab is disassemble-then-decompile rather than match-then-delete.",
  },
  {
    title: "Trust boundaries follow the file format",
    body: "Boot sectors (1986), macro documents (1995), HTML/script attachments (2000), Office OLE + VBA (2010s), ISO/LNK containers, DLL side-loading and now container images and CI pipelines. Each time a format gains 'code with data' semantics, a new infection class appears within a few years.",
  },
  {
    title: "The technician, not the user, is the target",
    body: "The anti-debug samples in this corpus exist to fool whoever is looking at them. Modern equivalents: timing checks against hypervisors, ptrace/ETW detection, EDR-killing drivers (BYOVD), and 'slow' families such as Rombertik that deliberately behave while being analysed. Analysis should therefore always run in a disposable environment, and 'observed behaviour' must be treated as a hypothesis.",
  },
  {
    title: "Escalation is about economics",
    body: "1988's Morris worm wanted to gauge the size of the internet. 2013's CryptoLocker wanted money. 2017's NotPetya wanted destruction with collateral. 2024's leak-site rankings are an affiliate marketplace. Every jump in impact follows a change in who profits and how the work is subdivided.",
  },
  {
    title: "Patch, segment, and keep an offline copy",
    body: "NotPetya's spread used a patch released two months earlier; Colonial Pipeline used one credential. Across four decades the mitigations that actually reduce harm stay boring: patch the exposed protocol, segment the network, back up offline with a tested restore, and hook the interrupt you cannot control — authentication, least privilege, and monitoring — instead of the one you can.",
  },
];

export const REFERENCES = [
  { label: "ksaj / Ontario1024 — early-90s virus source corpus", url: "https://github.com/ksaj/Ontario1024" },
  { label: "Wikipedia — Michelangelo (computer virus)", url: "https://en.wikipedia.org/wiki/Michelangelo_(computer_virus)" },
  { label: "F-Secure — Michelangelo", url: "https://www.f-secure.com/v-descs/michel.shtml" },
  { label: "Fuhs — encryption generators: MtE, TPE, DAME", url: "https://www.fuhs.de/en/pub/encryptgen1.shtml" },
  { label: "Malware Wiki — TridenT Polymorphic Engine", url: "https://malwiki.org/index.php?title=TridenT_Polymorphic_Engine" },
  { label: "Wikipedia — WannaCry ransomware attack", url: "https://en.wikipedia.org/wiki/WannaCry_ransomware_attack" },
  { label: "Krebs on Security — Mirai source code released", url: "https://krebsonsecurity.com/2016/10/source-code-for-iot-botnet-mirai-released/" },
  { label: "GAO testimony — ILOVEYOU and Code Red damages (2001)", url: "https://www.gao.gov/assets/gao-01-1073t.pdf" },
  { label: "Unit 42 — ransomware review, first half 2024", url: "https://unit42.paloaltonetworks.com/unit-42-ransomware-leak-site-data-analysis/" },
  { label: "ODNI CTIIC — worldwide ransomware attacks, 2024", url: "https://www.dni.gov/files/CTIIC/documents/products/Worldwide_Ransomware_Attacks_as_of_June_2024_Consistent_With_Previous_Year_Sep2024.pdf" },
  { label: "@mauricelam/ghidra-decompiler-wasm — Ghidra's C++ decompiler compiled to WebAssembly (Apache-2.0)", url: "https://github.com/mauricelam/ghidra-decompiler" },
  { label: "NSA Ghidra — SLEIGH processor specs (Apache-2.0)", url: "https://github.com/NationalSecurityAgency/ghidra" },
];

/** Samples that have real bytes attached and can therefore be analysed. */
export const ANALYZABLE = SAMPLES.filter((s) => s.binary);

export const byId = (id) => SAMPLES.find((s) => s.id === id) || null;
