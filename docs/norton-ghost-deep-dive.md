# Norton Ghost deep dive — the GHO container, Fast LZ, the password cipher, and what "processor locking" actually meant

*2026-09-29 · closes the three items left open at the end of
`docs/virus-encyclopedia.md` ("Norton Ghost processor-lock and
IDA/Immunity debugger sections: not completed this round") and finishes
the lore shelf sketched in §6 of `docs/exe-protection-deep-dive.md`.*

*Executable companion: `tools/ghostimg.py` —
`info` (parse a .GHO), `analyse` (the cipher cryptanalysis reproduced
below), `selftest` (21 checks: codec, container, cipher, key recovery).*

---

## 1. Why Ghost belongs in an EXE-protection corpus

GHOST — **G**eneral **H**ardware-**O**riented **S**ystem **T**ransfer —
was written by **Murray Haszard** at **Binary Research** in Auckland, New
Zealand, first sold in 1996, with DOS-based versions running 1995–2003.
Symantec bought the company in July 1998 for **US$27.5 million**,
rebranded it Norton Ghost, and kept the Auckland team for about another
decade. Consumer Ghost was discontinued **30 April 2013**.

The reason it sits next to LZEXE and TPE rather than in a sysadmin
folder: the DOS boot floppy was the native habitat of packed EXEs and of
every anti-debug trick in `samples/src/anti-debug1*.asm`. The same
bootable toolkit that cloned a lab of machines was the toolkit that
cracked licences. Ghost is also a *self-contained protection study* in
its own right — a proprietary container, a proprietary compressor, and a
password feature that looks like encryption and is not.

For the boot-CD crowd: Hiren's BootCD carried commercial tools including
Ghost up to **v10.6** (17 commercial products, Acronis through Paragon);
**v11.0 removed them all**, and people have been bolting Ghost32 back
onto 15.x with HBCD Customizer ever since.

## 2. The .GHO / .GHS container

There is no public specification. Everything below is reverse
engineering of **Ghost 11.5.1**, and it is stated here with its
sourcing, because the sourcing is uneven:

| layer | corroboration |
| --- | --- |
| file header, record stream, block framing | **two independent projects agree** — `nyarime/gho` (Go) and `tomeq82/gho` (Rust) |
| Fast LZ (Z1) codec | single-sourced (`nyarime/gho`, from `sub_4DDD70` via IDA) |
| password cipher | **single-sourced and contested** — see §4 |

### 2.1 File header (512 bytes)

```
offset  size  field
------  ----  -----
0       2     magic, LE u16 = 0xEFFE  (the bytes read FE EF)
2       1     file_type: 1 = first/single file, 9 = span continuation
3       1     compression: 0 none, 2 Fast LZ, 3..9 zlib ("High")
4       4     image_id, LE u32 — shared by every span file of one image
8       3     flags
12      1     encryption indicator (bit 1) — contested, see below
13..    ...   padding to 512
```

Every `.ghs` span file repeats this header, and each partition inside the
image is preceded by another 512-byte header with the same `FE EF`
magic — which is why "FEEF header" is the usual name for both.

### 2.2 Record stream (10-byte header + body)

```
offset  size  field
------  ----  -----
0       4     type  (LE u32)
4       4     magic (LE u32) = 0x012F18D8
8       2     body_len (LE u16)
10..    ...   body
```

| code | name | body |
| --- | --- | --- |
| `0x0006` | TRACK0 | 6-byte mini-header + MBR (+ boot sectors) |
| `0x0603` | PARTITION | 20-byte partition descriptor |
| `0x0703` | CONTINUATION | 20 bytes; links to the next span |
| `0x0023` | END | 24 bytes; terminates the image |

**The one genuine disagreement between the two specs** is this field:
`nyarime` reads it as a single u32 whose low 16 bits are the type and
whose high 16 bits are flags; `tomeq82` reads it as u16 type followed by
u16 padding. These are the same bytes — nobody has produced an image
where the high half is non-zero, so the question is open. `ghostimg.py`
decodes both halves and reports them separately rather than choosing.

### 2.3 Block framing

Between records the payload is a run of framed blocks:

```
[LE u16 stored_len][payload of stored_len - 2 bytes]
```

`stored_len` **counts its own two bytes**, which is the sort of detail
that costs an afternoon if you assume otherwise. Each block decompresses
to 32 768 bytes (the last one in a partition is short), so the maximum
legal `stored_len` is 33 002 = 32768 + 4 + 2.

Inside a Z1 block body, `byte[0] == 1` means *stored*: the raw data
begins at offset 4. Anything else is a Fast LZ token stream, also
starting at offset 4.

## 3. Fast LZ (Z1) — a hash-addressed LZ, not an LZ77

This is the interesting part of the format, and it is genuinely unusual.
A classic LZ77 match token carries a **displacement**: "go back N bytes."
Ghost's Z1 token carries a **hash table index** instead.

The token stream is driven by 16-bit control words consumed LSB-first,
in groups of 16 tokens (the group shrinks to 1 within 32 bytes of the end
of the block):

- control bit `0` → copy one literal byte from the input.
- control bit `1` → a 2-byte match token `(b0, b1)`:
  - `hash_index = b1 | ((b0 & 0xF0) << 4)`  (12 bits → 4096 entries)
  - `length = 3 + (b0 & 0x0F)`  (3…18 bytes)
  - the copy source is `hash_table[hash_index]`, an *absolute position in
    the output buffer so far*.

The hash table is maintained identically by compressor and decompressor:
after every three literals, and after every match, the position of the
last 3-byte group is hashed with

```
h = ((-24993 * (b2 ^ (16 * (b1 ^ (16 * b0))))) >> 4) & 0xFFF
```

and stored. Decoding is therefore only possible by replaying the
encoder's table updates in lockstep — get one update wrong and the stream
silently decodes to garbage rather than failing. (Compare the LZEXE
lesson in `docs/exe-protection-deep-dive.md` §2: there the fatal detail
was *when* the flag word reloads. Same class of bug, same symptom.)

The other tell of a hand-rolled 1990s codec: entries start out pointing
at the string literal **`"123456789012345678"`**. A match token emitted
before its slot was ever filled reproduces those bytes. That is not a
design decision, it is an uninitialised table with a convenient constant
in it — and any faithful decoder has to reproduce the quirk.

`tools/ghostimg.py` implements stored blocks, the literal path, the
token/hash machinery and the hash function, and round-trips them in
`selftest`.

## 4. The password cipher — and why it is not encryption

Ghost's later versions offer password protection on an image. The
reconstruction published by `nyarime/gho` (from the Ghost 11.5.1
encryption routines) is:

```
keystream byte = low 8 bits of a 16-bit state
state         := crc16(state, PLAINTEXT byte)          # CRC-16/ARC, poly 0xA001
initial state := 0xFFFF, then the password bytes run through the same CRC
```

That is an **autokey (self-synchronising) XOR stream cipher** with a
16-bit state.

> **Sourcing caveat, stated plainly.** The competing project
> `tomeq82/gho` documents Ghost's encryption as *not* reverse engineered
> and refuses encrypted images outright. So this construction is
> single-sourced and uncorroborated. Everything below is a sound
> statement about *the published reconstruction*; whether Ghost 11.5.1
> really does this is not settled, and we have no encrypted `.gho` in the
> corpus to settle it with.

With that caveat, the reconstruction is fatally weak, and
`python3 tools/ghostimg.py analyse` demonstrates each point:

**1 — The key schedule throws the password away.** However long the
passphrase, it is folded into 16 bits:

```
'a'                            -> state 0xA87E
'hunter2'                      -> state 0xF0BE
'correct horse battery staple' -> state 0x9814
```

The state *is* the key. Password entropy beyond 16 bits is discarded by
construction.

**2 — Passwords collide, constantly.** At most 65 536 distinct
keystreams exist, so the birthday bound puts the first collision around
√65536 ≈ 320 tries. Searching trivial candidates finds them almost
immediately:

```
'pw405' and 'pw800' -> state 0xA6EB, identical ciphertext: True
'pw404' and 'pw801' -> state 0x662A, identical ciphertext: True
```

found after 803 candidate passwords.

**3 — Exhaustive search costs 2^16 and ignores the password entirely.**
A GHO stream opens with the constant `FE EF`, so there is guaranteed
known plaintext. Using just that 2-byte crib against an image encrypted
with a 45-character passphrase:

```
2-byte crib (the FE EF magic) leaves 1 candidate state
full-stream check confirms it:      0xB91E (true state 0xB91E)
```

65 536 trial decryptions is milliseconds. The passphrase is never
guessed, and its length and entropy are irrelevant.

**4 — It is malleable and self-synchronising.** Because the state
advances on plaintext, recovering the state at *any* offset decrypts the
entire remainder; and an attacker who knows a plaintext prefix can flip
bits in it and have the stream resynchronise afterwards.

There is no MAC, no IV, no salt and no key stretching anywhere in the
construction, so two images made with the same password produce the same
keystream from byte zero.

**Verdict:** a period-appropriate obfuscation layer. It stops a user with
a hex editor; it does not stop anybody who has read this page. Treat a
`.GHO` password as a speed bump, and treat any archived Ghost image as
plaintext for the purpose of deciding whether it is safe to publish.

## 5. Processor-locked licensing — the thing Ghost's era wanted and never got

The protection schemes in `samples/src` all share one problem: in 1990
the CPU offered **nothing to lock to**. So licensing tied itself to
whatever fingerprint the machine did expose — PSP and BIOS data areas,
disk geometry, FPU presence, instruction-timing quirks, the INT 13h
drive table. The anti-debug corpus in
`docs/exe-protection-deep-dive.md` §5 is what that looks like in
practice: if you cannot identify the machine, you at least make the
program hostile to being watched.

The industry then tried to put the identity in silicon.

**Pentium III, 28 February 1999 — the Processor Serial Number.** A 96-bit
number, assembled from two CPUID calls:

```asm
        mov  eax, 1
        cpuid                   ; EDX bit 18 = PSN supported *and enabled*
        ; EAX now holds the processor signature = the top 32 bits of the PSN
        mov  eax, 3
        cpuid                   ; EDX = bits 63..32, ECX = bits 31..0
```

Two details that mattered in practice: the feature bit is cleared both
when PSN is unsupported *and* when it is merely disabled in BIOS, so
software could not distinguish "no serial" from "serial switched off";
and a zero in the low 64 bits means invalid/disabled. Intel's own
application note (241618) specifies displaying it as six groups of four
uppercase hex digits.

It was pitched for e-commerce identity and lasted about five minutes.
EPIC ran a boycott, Rep. Edward Markey wrote to Craig Barrett, the
European Parliament took up a motion
([Wired, Jan 1999](https://www.wired.com/1999/01/intel-on-privacy-whoops/)),
Intel made the off-switch the default, and PSN was dropped from Tualatin,
the Pentium 4 and the Pentium M. On everything since, CPUID leaf 3 is
reserved and the PSN feature bit reads zero. **No AMD part ever had it.**

**The idea came back quietly as PPIN.** Intel's *Protected Processor
Inventory Number*, from Ivy Bridge on, is a 64-bit unique die identifier
— but it lives behind MSRs, not CPUID, so it needs ring 0 and firmware
consent:

| | Intel | AMD (Zen 2 on) |
| --- | --- | --- |
| control MSR | `MSR_PPIN_CTL` `0x4E` | `MSR_AMD_PPIN_CTL` `0xC00102F0` |
| value MSR | `MSR_PPIN` `0x4F` | `MSR_AMD_PPIN` `0xC00102F1` |
| feature probe | CPUID leaf 7 / model list | `CPUID.80000008:EBX[23]` |

In the control MSR, bit 0 is **lockout** and bit 1 is **enable**. Firmware
that sets lockout with enable clear makes PPIN unreadable until the next
reset — the privacy lesson of 1999 encoded as a hardware latch. Linux
exposes it only for machine-check records (`mce_setup` reads it), which
is what PPIN is actually for: RMA and fleet inventory, not licensing.

So the arc is: *no identity* (the DOS corpus) → *a public CPU serial*
(PSN, killed by privacy backlash) → *a privileged, firmware-gated die ID*
(PPIN, deliberately not usable by applications) → *attestation through a
TPM*, which is where hardware-bound licensing actually lives today. A
modern licence hashes a TPM-held key, not a CPU serial, precisely because
the CPU serial was politically impossible.

## 6. The debuggers, and where the lore lived

**IDA Pro** (DataRescue → Hex-Rays) grew from a disassembler into the
professional default; its free tier is deliberately limited, which is why
"buy IDA or know somebody" was the entry toll for two decades. The Ghost
Z1 codec in §3 exists as public knowledge because somebody sat in IDA on
`sub_4DDD70`.

**Immunity Debugger** — OllyDbg 1.1 reborn with a Python 2.7 console,
built by Immunity Inc. for exploit development, home of Corelan's
**mona.py** — is unmaintained; **x64dbg** is its living successor.
**OllyDbg** itself stopped at 2.01 and never got a 64-bit build, which is
what created the gap x64dbg filled.

**Ghidra** (NSA, open-sourced 2019) is the free-software answer this
repo's tooling is built on: `tools/decompile_mz.mjs` is Ghidra's SLEIGH
`x86:LE:16:Real Mode` specification disassembling 1990 packer stubs in a
WASM runtime with no JVM and no network.

The knowledge itself lived on CDs, not websites. **OpenRCE**
(openrce.org, launched at RECon Montréal 2005 by Pedram Amini; now
read-only) preserved OllyBone and the Loop Detection plugins.
**+Fravia** — Francesco Vianello, 1952–2009 — ran *searchlores.org*, the
"searching habits" school of reverse engineering; the domain is parked,
woodmann.com/fravia and search.lores.eu mirror it, and archive.org holds
the 83 MB site zip and his 2006 Recon talk.

## 7. What is verified, and what is not

| claim | how it is backed |
| --- | --- |
| CRC-16 table, init and update order | CRC-16/MODBUS check value over `"123456789"` is **0x4B37** — reproduced in `selftest`, which pins polynomial, init and byte order at once |
| cipher round-trips, streams, and is self-inverse | `selftest`: 6 cipher checks incl. chunked == one-shot |
| 2^16 key recovery with no password | `selftest` + `analyse`: recovers state `0xB91E` from a 45-char passphrase using the `FE EF` crib |
| password collisions | `analyse`: found after 803 candidates, verified by identical ciphertext |
| container layout | round-tripped in `selftest` against a synthetic image (sha256 `fb81665d…`); layout corroborated by two independent RE projects |
| Fast LZ stored + literal paths | `selftest` |

**Honest deferrals.**

- **No real `.gho` in the corpus.** Everything is tested against a
  synthetic image built from the spec, so this verifies *self-consistency
  and agreement with the published layout*, not agreement with Symantec's
  encoder. An archived Ghost image would settle it; none was fetched
  (the useful ones are multi-gigabyte).
- **Fast LZ compression** (the encoder) is not implemented — only
  decoding plus stored blocks. The hash-table replay makes a faithful
  encoder a much bigger job than a decoder.
- **zlib "High" (Z3–Z9)** is documented, not wired up.
- **The pre-11.x GHO dialect** (a FAT-style directory of 8.3 dirents) is
  out of scope; `tomeq82/gho` documents it in `FORMAT_OLD.md`.
- **The encryption reconstruction is uncorroborated** — see the caveat in
  §4. This is the single biggest open question on this page.
- **`ghofixup` / the CD and span flag PRNG** (header offset 55, file
  offset 584) is noted in `nyarime/gho` and not reimplemented here.
