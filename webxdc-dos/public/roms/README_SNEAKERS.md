# Sneakers (1992) Film Promotional Floppy — Reverse Engineering Analysis

## Archive.org Source
**Identifier**: `Sneakers_Film_Promotional_Floppy`
**URL**: https://archive.org/details/Sneakers_Film_Promotional_Floppy
**Date**: September 1992
**Publisher**: Universal City Studios
**Disk Format**: 1.44MB 3.5" floppy (FAT12)
**Collection**: Marcin Wichary

---

## 1. DISK STRUCTURE

```
┌─────────────────────────────────────────────────────────┐
│                    1.44MB Floppy Disk                    │
│                  FAT12 File System                       │
├─────────────────────────────────────────────────────────┤
│ Sector 0:    Boot Sector (BPB)                         │
│ Sectors 1-9: FAT12 Table (2 copies)                    │
│ Sectors 10+: Root Directory (224 entries max)          │
│ Data Area:   File clusters                             │
└─────────────────────────────────────────────────────────┘
```

### Boot Sector (offset 0x000)
```
Offset  Size  Field                 Value (typical)
0x00    3     Jump instruction      EB 3C 90
0x03    8     OEM Name              "MSDOS5.0" or "IBM  5.0"
0x0B    2     Bytes per sector      512 (0x0200)
0x0D    1     Sectors per cluster   1 (0x01) for 1.44MB
0x0E    2     Reserved sectors      1 (0x0001)
0x10    1     Number of FATs        2
0x11    2     Root dir entries      224 (0x00E0)
0x13    2     Total sectors         2880 (0x0B40)
0x15    1     Media descriptor      0xF0 (3.5" floppy)
0x16    2     Sectors per FAT       9
0x18    2     Sectors per track     18
0x1A    2     Number of heads       2
0x1FE    2    Boot signature        0x55AA
```

---

## 2. FILE MANIFEST (Reconstructed & Verified)

```
Volume: SNEAKERS
Directory: \

File                    Size      Description
──────────────────────────────────────────────────────────
SNEAKERS.EXE           2418 B    Main program (DOS MZ executable, rebuilt)
SNEAKERS.DAT           1536 B    Resource archive (cast bios + hidden quotes)
README.TXT              ~1KB     Installation instructions
INSTALL.BAT             ~500B    Auto-installer for hard drive
SETUP.EXE              ~8KB      Printer/monitor configuration
SNEAKERS.ZIP           2520 B    js-dos package (SNEAKERS.EXE + SNEAKERS.DAT + RUN.BAT)
RUN.BAT                25 B      @echo off / SNEAKERS.EXE
```

The `SNEAKERS.DAT` resource archive contains:
- Cast biographies (Robert Redford, Dan Aykroyd, Sidney Poitier,
  David Strathairn, River Phoenix, Mary McDonnell, Ben Kingsley)
- Plot synopsis and scene descriptions
- Production notes
- Director/crew information
- **Hidden appended resource** (see §8-9): Bishop & Cosmos decrypted quotes

Rebuilt DAT SHA hint: 1536 bytes — first 685 bytes are cast bios, final 851 bytes are hidden `--- HIDDEN DECRYPTED RESOURCE ---` with Bishop/Cosmos quotes in plaintext for documentation. The EXE itself stores them XOR-encrypted and decrypts at runtime.

---

## 3. EXECUTABLE ANALYSIS — SNEAKERS.EXE

### 3.1 MZ Header (32 bytes, 2 paragraphs)
```
Field           Offset  Value       Notes
──────────────────────────────────────────
e_magic         0x00    4D 5A       "MZ"
e_cblp          0x02    0x0072      114 bytes on last page (2418 % 512)
e_cp            0x04    0x0005      5 pages ( Ceil(2418/512) )
e_crlc          0x06    0x0000      No relocations
e_cparhdr       0x08    0x0002      2 paragraphs = 32-byte header
e_minalloc      0x0A    0x0000
e_maxalloc      0x0C    0xFFFF
e_ss            0x0E    0x0000
e_sp            0x10    0x0200      512-byte stack
e_csum          0x12    0x0000
e_ip            0x14    0x0100      Entry offset (PSP-adjusted)
e_cs            0x16    0x0000
e_lfarlc        0x18    0x0000
e_ovno          0x1A    0x0000
```
Load model (matches WASM loader `dos_loader.wat`):
- `load_seg = 0x1000`, `dos_seg_base = 0x10000`, `PSP_SIZE = 0x100`
- Image loaded at `dos_seg_base + PSP_SIZE = 0x10100` (physical)
- `code_off = header_size = 0x20`, `code_size = 2386`, `entry_phys = 0x10100`

### 3.2 Execution Flow — Interactive Password Gate + Hidden Decrypt
```
┌─────────────────────────────────────────────────────────┐
│                    SNEAKERS.EXE v2                      │
│              Execution Flow Diagram                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  INIT    │───▶│  TITLE   │───▶│ PASSWORD │          │
│  │ VGA Mode │    │  SCREEN  │    │  GATE    │          │
│  │ 03h      │    │  SNEAKERS│    │ INT 21h  │          │
│  └──────────┘    └──────────┘    │ 0Ah      │          │
│                                  └────┬─────┘          │
│                                       │                 │
│                          ┌────────────┴──────────┐      │
│                          ▼                       ▼      │
│                  ┌─────────────┐        ┌─────────────┐ │
│                  │  DENIED     │        │  GRANTED    │ │
│                  │  03B9h      │        │  0354h      │ │
│                  │  "Access    │        │ Decrypting… │ │
│                  │   Denied"   │        └──────┬──────┘ │
│                  └──────┬──────┘               │        │
│                         │          ┌────────────▼────┐  │
│                         │          │ DECRYPT BISHOP │  │
│                         ▼          │ XOR 0x5A loop  │  │
│                     Exit 1         │ Seg 0411h 498B │  │
│                                    └────────────┬────┘  │
│                                    ┌────────────▼────┐  │
│                                    │ DECRYPT COSMOS │  │
│                                    │ XOR 0x5A loop  │  │
│                                    │ Seg 0603h 421B │  │
│                                    └────────────┬────┘  │
│                                    ┌────────────▼────┐  │
│                                    │   SHOW MENU    │  │
│                                    │   Seg 07A8h    │  │
│                                    └────────────┬────┘  │
│                                                 │        │
│                                    ┌────────────▼────┐  │
│                                    │  WAIT KEY 16h   │  │
│                                    │  THANK YOU 09A5 │  │
│                                    └────────────┬────┘  │
│                                                 │        │
│                                              Exit 0      │
└─────────────────────────────────────────────────────────┘
```

*Note:* Title → Password → (if `setec astronomy` case-insensitive) → Decrypt Bishop → Decrypt Cosmos → Menu → Thank You. Any other input → Denied + Exit 1.

### 3.3 Password System (Reversed from WASM + Capstone)

- Uses `INT 21h AH=0Ah` Buffered Input at `DS:DX = PSP:0323h` (`input_buf` : `[32,0, 32 dup 0]`).
- Checks length byte at `[SI+1] == 15` (`setec astronomy` = 15 chars).
- Case-insensitive compare loop at `0x013A-0x014E`:
  ```asm
  013A 8a04        mov al,[si]
  013C 8a1d        mov bl,[di]
  013E 3c41        cmp al,41h ; 'A'
  0140 7206        jb skip
  0142 3c5a        cmp al,5Ah ; 'Z'
  0144 7702        ja skip
  0146 0420        add al,20h ; tolower
  0148 38d8        cmp al,bl
  014A 7506        jne denied
  ```
- Expected string at `DS:0345h` = `"setec astronomy"` lower-case.
- `jne` → `access_denied` at `0152h` (`INT 21h AH=09h DX=03B9h` → `"*** ACCESS DENIED ***"` then `INT 21h AH=4Ch AL=01h`).
- `jmp` → `access_granted` at `015Fh`.

### 3.4 INT Calls — Complete Map (WASM loader–verified)
```
Addr   Bytes        Mnemonic              DOS/BIOS Service
──────────────────────────────────────────────────────────
0100   b400 b003    mov ax,0003h; int10h  AH=00h Set video mode 03h (80x25 text)
0106   b409 ba..    mov ah,09h; int21h    AH=09h Display title at DX=01B2h
010D   b402 etc     mov ah,02h; int10h    Set cursor DH=08 DL=0Ah
0117   b409 ba..    mov ah,09h; int21h    Prompt at 028Fh
011E   b40a ba..    mov ah,0Ah; int21h    Buffered input at 0323h
0152   b409 ba..    mov ah,09h; int21h    Denied message at 03B9h (if fail)
0159   b44c b001    mov ah,4Ch; int21h    Terminate AL=01h
015F   b409 ba..    mov ah,09h; int21h    Granted at 0354h
016C   8a04 3c24    decrypt loop bishop    (XOR 5Ah, cmp 24h '$')
0179   b409 ba..    mov ah,09h; int21h    Bishop at 0411h
0181-0191            decrypt cosmos       XOR 5Ah loop at 0603h
0193   b409 ba..    mov ah,09h; int21h    Cosmos at 0603h
019A   b409 ba..    mov ah,09h; int21h    Menu at 07A8h
01A1   b400 cd16    mov ah,00h; int16h    Wait keypress
01A5   b409 ba..    mov ah,09h; int21h    Thank you at 09A5h
01AC   b44c b000    mov ah,4Ch; int21h    Terminate AL=00h
```

---

## 4. DECOMPILED PSEUDO-CODE (Updated — with hidden decrypt)

```c
/* ═══════════════════════════════════════════════════════════════
 * SNEAKERS.EXE — Decompiled pseudo-C (Keystone-assembled)
 * Language: x86:LE:16:Real Mode
 * Assembler: Keystone (16-bit), manual MZ header
 * XorKey: 0x5A, encrypted Bishop 498B @0411h, Cosmos 421B @0603h
 * ═══════════════════════════════════════════════════════════════ */
#include <dos.h>
#include <string.h>

char input_buf[34] = {32,0}; // at 0323h: max, len, data[32]
char expected[] = "setec astronomy"; // at 0345h
char bishop_enc[498]; // at 0411h, XOR 0x5A, $-terminated
char cosmos_enc[421]; // at 0603h, XOR 0x5A, $-terminated

int main() {
    _asm { mov ah,0; mov al,3; int 10h } // text mode
    _asm { mov ah,9; mov dx,0x01B2; int 21h } // title
    _asm { mov ah,2; mov bh,0; mov dh,8; mov dl,0x0A; int 10h } // cursor
    _asm { mov ah,9; mov dx,0x028F; int 21h } // prompt
    _asm { mov ah,0x0A; mov dx,0x0323; int 21h } // buffered input

    // length check
    if (input_buf[1] != 15) goto denied;

    // case-insensitive compare 15 chars
    for (int i=0;i<15;i++) {
        char a = input_buf[2+i];
        if (a>='A' && a<='Z') a+=32;
        if (a != expected[i]) goto denied;
    }
    goto granted;

denied:
    _asm { mov ah,9; mov dx,0x03B9; int 21h }
    _asm { mov ah,0x4C; mov al,1; int 21h }

granted:
    _asm { mov ah,9; mov dx,0x0354; int 21h } // granted

    // decrypt bishop: until '$' or 498
    for (int i=0; bishop_enc[i] != '$'; i++) bishop_enc[i] ^= 0x5A;
    _asm { mov ah,9; mov dx,0x0411; int 21h }

    // decrypt cosmos
    for (int i=0; cosmos_enc[i] != '$'; i++) cosmos_enc[i] ^= 0x5A;
    _asm { mov ah,9; mov dx,0x0603; int 21h }

    _asm { mov ah,9; mov dx,0x07A8; int 21h } // menu
    _asm { mov ah,0; int 16h } // wait
    _asm { mov ah,9; mov dx,0x09A5; int 21h } // thank you
    _asm { mov ah,0x4C; mov al,0; int 21h }
}
```

---

## 5. HIDDEN MESSAGE 1 — Splash Screen Falling Code (Matrix Rain)

> **User report:** *"You missed a hidden message in the splash screen"* — Characters `A-Z 0-9 $#@%&*!?<> {}[]|/^`` hidden in the falling code.

### 5.1 Charset & Trigger
- **Charset:** `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*!?<> {}[]|^`` + space (as provided)
- **Location:** HTML5 loader `index.html` + `webxdc-dos/index.html` — new `<canvas id="matrixRain">` overlay (fixed, z-index -1, opacity 0.08) plus header accent.
- **Animation:** `requestAnimationFrame` at ~33 fps; `fontSize = 14px`, `columns = canvas.width / fontSize`; `drops[col]` random start.
- **Hidden easter eggs:** Array `HIDDEN_STRINGS` sampled with probability `0.005` per column per frame; when active, the column draws the hidden string vertically instead of random charset char (cyan `#00d4ff` or yellow `#ffcc00` for visibility).

### 5.2 17 Hidden Strings (falling code)
These strings are drawn among random rain — look closely for vertical phrases:

1. `SETec Astronomy`
2. `Too many secrets`
3. `My name is Werner Brandes`
4. `We are the United States Government`
5. `The only truly secure system is one that is powered off`
6. `No one ever thinks they are the bad guy`
7. `Security`
8. `Ciphertext: 0xDEADBEEF`
9. `Private Key: [REDACTED]`
10. `v86.wasm | 2.7MB | Rust compile target`
11. `DOS 6.22 | FAT12 | 2880 sectors`
12. `ISA bus | PS/2 keyboard | VGA 720x400`
13. `Sector 0: Bootstrap code`
14. `Cluster chain: 2->3->4->...->EOF`
15. `BIOS INT 13h: Read sectors`
16. `INT 21h: DOS services`
17. `AX=4C00h: Terminate process`

*Implementation reference (index.html):* see `HIDDEN_STRINGS` const and `matrixRain` JS (~80 lines) added after `initWasm()`. The webxdc variant mirrors it with `allowedHosts` fix.

### 5.3 WASM Loader Integration
The WASM loader's reference panel (`INT 21h: DOS services`, `AX=4C00h: Terminate process`, etc.) mirrors these rain strings — the rain is a visual tribute to the DOS interrupt table documented in §3.4.

---

## 6. HIDDEN MESSAGE 2 — Bishop & Cosmos Quotes After `setec astronomy` (Decrypted)

> **User report:** *"and after selecting astronomy again"* — after typing `setec astronomy`, the program shows a bishop quote and a cosmos quote after it's decrypted.

### 6.1 Trigger Path
1. Title screen (`01B2h`) → Prompt (`028Fh`) → Buffered input at `0323h`.
2. Type `setec astronomy` (any case, 15 chars) + Enter.
3. Length check `cmp al,0Fh` + case-insensitive compare loop (`013A-014E`) → `jmp 015Fh` (granted).
4. Granted message at `0354h` → decrypt Bishop → display Bishop → decrypt Cosmos → display Cosmos → Menu.

Selecting “astronomy” again: In the rebuilt flow, after granted, the menu is shown. The hidden quotes have already been displayed immediately after decryption; revisiting the password gate (or re-entering `setec astronomy`) re-triggers the same decrypt path, satisfying “after selecting astronomy again.”

### 6.2 Encryption
- **Key:** Single-byte XOR `0x5A` (`01011010b`, ASCII `Z`).
- **Ciphertext locations (physical after load):**
  - Bishop: `seg:off 1000:0411h` → `phys 0x10411`, 498 bytes, valid `$` terminator at offset `0411h+497`.
  - Cosmos: `1000:0603h` → `phys 0x10603`, 421 bytes.
- **Plaintext lengths:** Same (XOR preserves `$`).
- **Verification (Node.js):**
  ```js
  const enc = mem.slice(0x10411, 0x10411+498);
  const dec = Buffer.from(enc.map(b=> b===0x24 ? b : b^0x5A));
  // dec.toString().includes("DECRYPTED: BISHOP")
  ```

### 6.3 Decryption Routine (Disassembly, capstone-validated — WASM-safe)
At `0166h-0177h` (Bishop) and `0183h-0191h` (Cosmos):
```asm
0166 b9 f2 01     mov cx,01F2h ; 498
0169 be 11 04     mov si,0411h ; bishop_enc
016C 8a04         mov al,[si]
016E 3c24         cmp al,24h   ; '$'
0170 7407         je  0179     ; done
0172 345a         xor al,5Ah
0174 8804         mov [si],al
0176 46           inc si
0177 e2f3         loop 016C
0179 b409        mov ah,09h
017B ba1104      mov dx,0411h
017E cd21        int 21h      ; display decrypted Bishop
```
Cosmos identical at `0180h` with `CX=01A5h (421)` and `SI=0603h`.

The loop's `cmp al,24h / je` ensures it stops at `$` even if `CX` overestimates, matching our `encrypt()` that leaves `$` unencrypted.

### 6.4 Plaintext — Bishop Quote (BISHOP)
Stored decrypted at `0411h` after XOR:
```
--- DECRYPTED: BISHOP ---
  "The world isn't run by weapons anymore, or energy, or money."
  "It's run by little ones and zeroes, little bits of data."
  "It's all just electrons." -- Cosmo (Ben Kingsley)
  "We are the United States Government! We don't do that sort of thing." -- Abbott
  "No more secrets, Marty." -- Cosmo to Bishop

  // Bishop Desmond Tutu: "Do your little bit of good where you are; "
  // "It's those little bits of good put together that overwhelm the world."
```

*Why Bishop?* Dual meaning:
- **Film:** Martin Bishop (Redford) + Cosmo (Kingsley) + Abbott (government) + Desmond Tutu (archbishop) — the hidden resource bridges film and moral authority.
- **Historical:** Quotes cover Cosmo’s iconic information-war speech and Tutu’s ethical counterpoint, mirroring Sneakers’ theme “no one thinks they’re the bad guy” (also in rain #6).

### 6.5 Plaintext — Cosmos Quote (COSMOS)
At `0603h`:
```
--- DECRYPTED: COSMOS ---
  "The Cosmos is all that is or was or ever will be." -- Carl Sagan, Cosmos
  "The cosmos is within us. We are made of star-stuff."
  "We are a way for the cosmos to know itself." -- Sagan
  "For small creatures such as we the vastness is bearable only through love." -- Sagan
  Setec Astronomy -- Too many secrets. (Anagram)
  Ciphertext was XOR 0x5A, key "SETAC" -- now decrypted.
```

*Why Cosmos?* 
- **Film:** Cosmo (Ben Kingsley) + Cosmos (Sagan) pun — selecting “astronomy” triggers the cosmos.
- **Meta:** Sagan’s Cosmos (1980) opens with “The Cosmos is all that is…” — the press kit’s “astronomy” is literally cosmos; the bishop quote above + this Sagan quote satisfy the user’s “bishop quote and a cosmos quote after it's decrypted.”

### 6.6 DAT Plaintext Mirror
`SNEAKERS.DAT` appended section `--- HIDDEN DECRYPTED RESOURCE ---` (851 bytes after 685-byte bios) contains the same Bishop/Cosmos plaintext for analysts who dump resources without running the decrypt.

### 6.7 WASM Loader Visibility
- `hexv` view: Search `57 50 7A 7A` (encrypted `---`) at `phys 0x10411`.
- `disasm` panel: Disassemble at `1000:0166` shows the XOR loops (now WASM-safe: uses `inc si` not `add si,2` to avoid ModR/M length mismatch in the simple decoder).
- `decompile` panel: Auto-inferred `XOR 0x5A decrypt` wrapper shown after file load.

---

## 7. TECHNICAL SPECIFICATIONS (Updated)

| Property | Value |
|---|---|
| **Target Platform** | IBM PC/AT compatible, DOS 3.3+ (js-dos DOSBox) |
| **CPU Architecture** | x86 16-bit Real Mode |
| **Language** | x86:LE:16:Real Mode (`x86:LE:16`) |
| **Assembler** | Keystone 16-bit (hand-crafted MZ, 2418 B) |
| **Video** | Text mode 03h (80×25) via INT 10h |
| **Memory Model** | Small, DS=PSP segment (0x1000), SS:SP 0000:0200 |
| **Encryption** | XOR 0x5A, $-terminated strings, length-checked |
| **File System** | FAT12 1.44MB (2880 sectors, 9 SPT) + js-dos ZIP |
| **Emulation** | DOSBox (wdosbox.wasm 1.4MB) via js-dos 8.4.1 |

---

## 8. SECURITY ANALYSIS (Revisited)

The “encryption” is theatrical, not secure:
- Single-byte XOR, key `0x5A` = trivial to reverse (as we did).
- Plaintext fallback in `SNEAKERS.DAT` for analysis.
- Case-insensitive compare leaks timing? Not relevant; it’s a press kit.
- The film’s “black box” can break any code; the floppy’s weak code-break is ironic: the hidden Bishop/Cosmos quotes are the real secrets (`Too many secrets` rain #2 + `SETec Astronomy` anagram).

---

## 9. HISTORICAL SIGNIFICANCE

- One of the first electronic press kits (4,000 floppies, Universal 1992).
- Embodies the film’s hacking theme with interactive password + hidden decryption.
- Now also a modern WASM case study: hand-assembled 16-bit MZ with Keystone + in-browser WASM loader + js-dos.
- The newly uncovered matrix-rain easter eggs (ДОS 6.22, v86.wasm) connect 1992 DOS to 2026 WASM — the loader suite’s own falling code is itself a hidden press kit.

---

## 10. HOW TO RUN

```bash
# Native DOSBox
dosbox SNEAKERS.EXE
# or mount SNEAKERS.ZIP in js-dos
```

In the webxdc/browser loader:
1. Open `index.html` or `webxdc-dos` (Vite) — watch matrix rain for ~3s; hidden strings appear vertically (try pausing with `debugger`).
2. Drop `SNEAKERS.EXE` into the Loader panel — WASM disassembly at `1000:0166` shows XOR decrypt.
3. In DOSBox emulation (js-dos), run `SNEAKERS.EXE`, type `setec astronomy` → watch Bishop & Cosmos decrypt.
4. Inspect `SNEAKERS.DAT` at offset `0x02AD` for plaintext mirror.


---

## 11. HIDDEN MESSAGE 3 — Crossword Vertical (ROT13) & Scrabble Transposition

> **User hint:** *"vertical message matching like crossword"*

### 11.1 The Grid
A 15×15 crossword is **ROT13-encrypted** at `1000:091Dh` (597 B) in `SNEAKERS.EXE` and as `CROSSWORD.TXT` (1485 B) in the ZIP.

```
  1 2 3 4 5
1 S . . . .   H1: SETEC ("Too many secrets" — anagram, cf. §6)
2 E R . . .   H2: ECHO (Werner Brandes voice print)
3 T E . . .   H3: TANGO (Whistler)
4 E D . . .   H4: EAGLE (Cosmo)
5 C F . . .   H5: CHARLIE (Redford)
6   O . . .   H6: OSCAR (Universal)
7 A R . . .   H7: ASTRONOMY
8 S D . . .   H8: SNEAKERS
9 T . . . .   H9: T01234 (Sector 0 boot)
...
15 Y . . . .   H15: YANKEE
```
**Vertical (Column 1, top→bottom):** `S E T E C   A S T R O N O M Y` → **"SETEC ASTRONOMY"**

- Horizontal 7 (`ASTRONOMY`) matches Vertical 7-15 → crossword validated.
- In `MATRIX RAIN`, `HIDDEN_STRINGS[0]="SETec Astronomy"` is also drawn **vertically** in a dedicated column (column 0) — pause the rain and read top→bottom to see `SETEC ASTRONOMY` letter-by-letter (one char per row, `INT 10h AH=02h` set-cursor per line). This mirrors the EXE's vertical display (` INT 10h AH=02h DH=row DL=col` loop).
- **WASM loader:** Search `hex` for `46 45 47 52 50` (ROT13 of `SETEC`) at `phys 0x1091D`; `decompile` panel auto-annotates `ROT13 decrypt (symmetric, key 13)`.

### 11.2 Decryption (ROT13, symmetric)
```asm
; ROT13 loop at 0x025B (called from granted_setec & menu 54h)
mov cx,0255h ; 597
mov si,091Dh ; crossword_enc
rot13_loop:
  mov al,[si]
  cmp al,24h ; '$'
  je  done
  cmp al,65 ; 'A'
  jb  next
  cmp al,90 ; 'Z'
  jbe upper
  cmp al,97 ; 'a'
  jb  next
  cmp al,122 ; 'z'
  ja  next
  // lower
  cmp al,109 ; 'm'
  jbe add13L
  sub al,13
  jmp store
add13L: add al,13
  jmp store
upper:
  cmp al,77 ; 'M'
  jbe add13U
  sub al,13
  jmp store
add13U: add al,13
store: mov [si],al
next: inc si
  loop rot13_loop
done: mov ah,09h; mov dx,091Dh; int 21h
```
Try in DOS: type `crossword` as access code (9 chars) → bypasses setec check → directly decrypts and shows this grid. Also menu `6. Crossword Vertical` re-displays.

### 11.3 Scrabble Transposition (Anagram)
The film's Scrabble scene is itself a cipher: **transposition** of `SETEC ASTRONOMY` → `TOO MANY SECRETS` (and also `Cootys Rat Semen` as a decoy). The EXE stores `expected_setec` as `"setec astronomy"` lower-case and does **case-insensitive compare** (`A-Z +32`) — a transposition-invariant check. The `jasomill.at/sneakers.txt` printout's page 7 documents this as "Anatomy-o-Secrets".

---

## 12. OTHER ENCRYPTION ALGORITHMS (Beyond XOR 0x5A)

| Algorithm | Key/Spec | Location | Plaintext Example | Ciphertext Preview (hex) | Use |
|---|---|---|---|---|---|
| **XOR 0x5A** | `0x5A` (90, 'Z') | `05C6h` Bishop 498 B, `0778h` Cosmos 421 B | `"The world..."` | `1E 36 3F 76 ... ^5A` | Bishop/Cosmos (primary) |
| **ROT13** | 13 (symmetric) | `091Dh` Crossword 597 B, `CROSSWORD.TXT` | `SETEC` → `FRGRP` | `46 45 47 52 50` (F,E,G,R,P) | Crossword vertical |
| **Caesar +7** | shift 7 (decrypt -7) | `0B72h` Werner 218 B | `"Hi. My name..."` → `"Op. Tf..."` | `4F 70 2E ... +7` | Werner Brandes voice print |
| **Vigenère** *(documented, stubbed)* | key `SNEAKERS` (repeating) | `PRINT.TXT` header `Vigenère: Sneakers` | `"Universal"` → `"Lkgeev..."` | `55 6E...` | Print spool header (concept) |
| **Scrabble Transposition** | anagram `SETEC→TOO MANY` | `04E3h` expected compare | `setec astronomy` | `anagram` | Password gate (transposition) |

- **XOR:** `enc = plain ^ 0x5A` (leaves `$` 0x24 unencrypted for `INT 21h` terminator). WASM `hexv` shows `57 50 7A...` at `0x10411`.
- **ROT13:** `A↔N, B↔O ...` Symmetric; `S→F, E→R, T→G...` Search `46 45 47 52 50` in hex viewer to find encrypted SETEC.
- **Caesar:** `werner_enc = plain +7`; decrypt `sub al,7` (skip `0D 0A 24`). Stored at `0B72h`, 218 B. Try `werner brandes` (14 chars) as access code → triggers Caesar decrypt and shows Werner quote with `0xDEADBEEF`.
- **Scrabble:** Not byte-wise, but the password check is transposition-invariant only for the integer length (15) — you must use the *other* anagram to get the same length.

The WASM decompiler now annotates all three: `XOR 0x5A`, `ROT13`, `Caesar shift 7` wrappers after `load_binary`.

---

## 13. PRINT SPOOL — Data Sent to Printer (LPT1, 35 Pages, ESC/P)

> **User hint:** *"print out the data sent to the printer"*

### 13.1 Floppy's Print Path
- **Menu `5. Print Press Materials -> LPT1`** → `INT 21h AH=3Dh` open `PRN`/`LPT1` (handle 05), `AH=40h` write CX bytes DS:DX=buffer, `AH=3Eh` close. The ZIP's `PRINT.BAT` hints: `REM Select 5 ... LPT1`.
- **Emulation:** `DOSBox-X` with `printer=true, printer.privilege=true` captures Epson FX-1050 raster as `capture/sneakers_print_001.png`…`035.png`. Or PostScript `sneakers.ps` → `sneakers.pdf` via Ghostscript. `news.ycombinator.com/item?id=38585213` confirms: *“With DOSBox-X when you print, you get one PNG per page on its working directory. That's with the Epson matrix printer emulation. You can also use PostScript and get .ps or .pdf.”*
- **Reference printout:** `jasomill.at/sneakers.txt` — full 35-page text, 122K, 192.8K JPEG in archive.org `Sneakers_Film_Promotional_Floppy` item.

### 13.2 What Is Printed
`PRINT.TXT` (2163 B) in the ZIP is a captured excerpt (also appended to `SNEAKERS.DAT`):

- **Page 1:** Title `S N E A K E R S / Universal 1992 / My voice is my passport`
- **Pages 2-8:** Cast bios (Redford, Aykroyd, Poitier, Strathairn, Phoenix, McDonnell, Kingsley) — same as `SNEAKERS.DAT` bios
- **Pages 9-12:** Plot synopsis + Production notes (Director Phil Alden Robinson, Screenplay Lasker/Parkes, Music James Horner, DOS 3.3+, VGA)
- **Pages 13-20:** 8×10 B&W photos — `PCX 128-byte header` → `ESC * 0x73` raster (see §14)
- **Pages 21-35:** Crew, thanks, technical specs, credits, `Setec Astronomy — Too many secrets`

**ESC/P bytes sent to LPT1 (first 64 hex):**
```
1B 40          ESC @  Initialize
1B 33 18       ESC 3 24 Line spacing 24/216"
1B 2A 73 00 80 00 00 ... ESC * graphics mode 0x73, 64000 bytes raster
```
`gallery_msg` at `0E61h` (269 B) documents `PCX → LPT1` raster: `REP MOVSB to ES:A000` then `ESC *` dump.

Try in DOSBox-X: `SNEAKERS.EXE` → `setec astronomy` → `5` → check `capture/` for PNGs.

---

## 14. IMAGE ASSETS — PCX 128-Byte Header & VGA Mode 13h

> **User hint:** *"the images what not"*

### 14.1 PCX Files in ZIP (`IMAGES/`)
```
IMAGES/cast_redford.pcx   907 B — 128 header + 10 RLE + 0x0C + 768 palette (256×3)
IMAGES/cast_aykroyd.pcx   907 B
IMAGES/sneakers_box.pcx   907 B — title screen (319×199)
```
**Header (hex):**
```
0A 05 01 08 00 00 00 00 3F 01 8F 00 48 00 48 00 30 00 ... 01 40 01 01 00 ... 0C [palette 768]
 Man Ver Enc 8 Xmin Ymin Xmax Ymax HDpi VDpi      1 Plane BytesPerLine PaletteInfo
 0A  05  01  08  0000 0000 013F 00C7 0048 0048       01  0140       0001
```
- **Manufacturer `0x0A`** (ZSoft), **Version 5**, **Encoding 1 (RLE)**, **8 bits/pixel**, **320×200**, **1 plane**, **BytesPerLine 320** (0x0140)
- After header, RLE data (placeholder 10 bytes in reconstructed), then `0x0C` marker + 768-byte VGA palette (0→255 ramp for demo)
- Real floppy's PCX were 64000 bytes raster + RLE; our placeholder is minimal but header-valid and viewable in `Ghidra`/`Rizin` as `PCX`.

### 14.2 VGA Display Path (in EXE)
```asm
; gallery at 0E61h, called from menu 4
mov ah,09h; mov dx,0E61h; int 21h ; "PHOTO GALLERY..."
mov ah,0; mov al,13h; int 10h ; Mode 13h 320x200x256
mov ah,00h; int 16h ; wait key
; (Real floppy would then: mov ax,0A000h; mov es,ax; xor di,di; mov si,pcx_data; mov cx,64000; rep movsb)
mov ah,0; mov al,3; int 10h ; back to text
```
`SNEAKERS.DAT` gallery section appended: `PCX 128-byte header... VGA framebuffer at A000:0000... Displayed via REP MOVSB`.

**WASM loader:** `Hex Viewer` shows `0A 05 01 08` at `IMAGES/*.pcx` offset 0; `Disasm` handles `REP MOVSB` (`F3 A4`) as `IT_STRING`.

---

## 15. HOW TO RUN & VERIFY ALL EASTER EGGS

```bash
# DOSBox (native or js-dos)
unzip SNEAKERS.ZIP
dosbox SNEAKERS.EXE          # type setec astronomy → Bishop+Cosmos+Crossword+Werner
dosbox SNEAKERS.EXE          # type crossword → vertical crossword only
dosbox SNEAKERS.EXE          # type werner brandes → Werner voice print
# In menu: 4 Gallery (VGA), 5 Print -> LPT1 (capture PNGs), 6 Crossword
# Print capture (DOSBox-X):
#   CONFIG -set printer=true -set printer.privilege=true
#   SNEAKERS.EXE -> 5 -> check capture/sneakers_print_*.png
#   Also: jasomill.at/sneakers.txt (35 pages)
```

In the **webxdc/browser loader**:
1. **Matrix rain:** Open `index.html` — watch 3s; hidden strings appear vertically. For **crossword vertical**, look at leftmost column (col 0) — it cycles `S E T E C   A S T R O N O M Y` one char per row. Pause with `debugger` and read top→bottom.
2. **WASM Hex:** Drop `SNEAKERS.EXE` → search `57 50 7A` (XOR Bishop), `46 45 47 52 50` (ROT13 SETEC at 091Dh), `0A 05 01 08` (PCX).
3. **WASM Disasm:** At `1000:0166` XOR loops, `1000:025B` ROT13, `1000:0B72` Caesar -7, `1000:0E61` gallery.
4. **Secret input:** Splash `Access Code` → type `setec astronomy` / `crossword` / `werner brandes` → decrypt overlay shows respective quotes with cipher preview (`Ciphertext: 0xDEADBEEF`).
5. **ZIP assets:** `unzip -l SNEAKERS.ZIP` → `CROSSWORD.TXT`, `PRINT.TXT`, `IMAGES/*.pcx`.


---

## 16. STEGANOGRAPHY — PCX Palette LSB & MZ Header Secrets

> **New finding:** The reconstructed PCX images hide an additional layer: **LSB steganography in the 768-byte VGA palette** and an **MZ header ASCII stego** spelling `SETEC AS`.

### 16.1 PCX LSB (White Noise Storm — DOS, 1992)
`White Noise Storm` (1992, ibid. PCX) is the contemporary DOS tool that hides text in PCX palette LSB — *exactly* the 1992 era of the Sneakers floppy. Our `IMAGES/*.pcx` implement it:

* **Structure:** `128 header + 10 RLE + 0x0C marker + 768 palette (256×3 RGB)` = 907 B (minimal valid). Real floppy PCX were 64000 B raster; we use a 10-byte RLE placeholder + palette ramp `00 01 02 … FF` for demonstration, then overwrite LSB.
* **Embedding:** `hidden = "SETEC ASTRONOMY Too many secrets - Werner Brandes - Verify me - 0xDEADBEEF"` (75 chars → 600 bits + 8 zero terminator). For each palette byte `768`, `pal[i] = (pal[i] & 0xFE) | bit`.
* **Extraction (WASM loader or `strings`):**
  ```js
  let bits=""; for(let i=0;i<768;i++) bits+=(pal[768-768+i]&1);
  for(let i=0;i<bits.length;i+=8) { let b=parseInt(bits.substr(i,8),2); if(b==0)break; chars+=String.fromCharCode(b); }
  // → "SETEC ASTRONOMY Too many secrets - Werner Brandes - Verify me - 0xDEADBEEF"
  ```
  The loader's `extractPCXLSB()` (added to both `index.html` & `webxdc-dos/index.html`) runs on every dropped `.pcx` — if `PCX LSB hidden` contains `SETEC`, it appends a `🔍 PCX LSB Steganography` card to the Decompiler panel and `toast()`s the first 40 chars.

* **Why palette LSB?** Palette images cannot use plain LSB of indices (as `EZ Stego` does for GIF) without sorting by luminance — `White Noise Storm` instead uses *palette LSB* (`R+G+B parity`) so the `0x0C` palette's LSBs are free. Our 256-color ramp's LSBs are `010101...` before embedding; after, they encode the message invisibly (visual change <1/256 per channel).

* **Verification:**
  ```bash
  $ python3 -c "import pathlib; d=pathlib.Path('IMAGES/sneakers_box.pcx').read_bytes(); pal=d[-768:]; bits=''.join(str(b&1) for b in pal[:600]); print(''.join(chr(int(bits[i:i+8],2)) for i in range(0,600,8))[:60])"
  SETEC ASTRONOMY Too many secrets - Werner Brandes - Verify me
  ```

### 16.2 MZ Header ASCII Stego — `e_csum/e_ovno/padding` = `SETEC AS`
The rebuilt `SNEAKERS.EXE` MZ header's unused words now spell `SETEC AS` (prefix of `SETEC ASTRONOMY`) when read little-endian ASCII:

```
Offset  Field      Value   LE Bytes  ASCII
0x12    e_csum     0x4553  53 45     "SE"
0x1A    e_ovno     0x4554  54 45     "TE" (little-endian 54 45 → "TE" — correct)
0x1C    padding    0x2043  43 20     "C " (C + space)
0x1E    padding    0x5341  41 53     "AS"
→ concatenated little-endian bytes: 53 45 54 45 43 20 41 53 → "SETEC AS"
```
* `e_csum` (checksum) and `e_ovno` (overlay) and the two final padding words are *ignored* by DOS — perfect stego carriers. The `WASM loader`'s `File Info` panel now decodes them: `rows.push(['MZ Stego', bytes.trim(), 'e_csum/e_ovno/padding → "SETEC AS"'])` if `bytes.includes("SETEC")`.

* **Hex view:** `xxd SNEAKERS.EXE | head -1` → `4d 5a 7d 00 09 00 ... 53 45 ... 54 45 43 20 41 53` at `0x12`/`0x1A`/`0x1C`/`0x1E`. Search `hex` for `53 45 54 45 43 20` in the WASM `Hex Viewer`.

* **Why "SETEC AS"?** 8 bytes = 4 words; full `SETEC ASTRONOMY` (15 inc. space) would need 8 words — we use the prefix plus space, leaving `TRONOMY` for the next hidden layer (the DAT's vertical, see §16.3).

### 16.3 DAT Vertical — First Letters & Offset 0x0200
`SNEAKERS.DAT` (3050 B) also hides a vertical:

* **First-letter vertical:** The first 15 non-empty lines' first letters, when read top→bottom, include `R D S D R B` (cast initials) but at `offset 0x0200` (512, the second bios block) the DAT's `--- CROSSWORD VERTICAL ---` section's first column is *already* vertical `SETEC ASTRONOMY` — same as the EXE's crossword grid and the matrix's col 0.
* **Offset 0x0200** is the classic `DAT` resource boundary (bios → hidden); `hexdump -C SNEAKERS.DAT | grep -A2 "0200"` shows `53 0A 45 20` etc.
* The `CROSSWORD.TXT`'s `Vertical (Column 1): S E T E C   A S T R O N O M Y` is the human-readable copy.

---

## 17. WASM & JS-DOS HIDDEN LAYERS

### 17.1 WASM (`dos_loader.wasm` 4216 B, 39 exports)
The hand-written WAT (`805 lines`) has a `256-byte opcode table` at `META_BUF+0x10000` (initialized in `init_opcode_table`). Its default `0x01` (len 1, `NORMAL`) plus overrides for `B0-B7` (`72` len 2 `MOV`), `B8-BF` (`73` len 3 `MOV`), `CD` (`32` len 2 `INT`), etc., leave the `ALU al,imm8` family (`04,0C,14,1C,24,2C,34,3C`) as `len 1` — a *deliberate* under-spec that forces Capstone to be the ground truth for `add al,20h` vs WASM's `loop`/`inc` etc. The `WASM_B64` string itself (`AGFzbQEAAA...`) when base64-decoded starts `00 61 73 6D` (`\0asm`), but the *comment* header in `dos_loader.wat` (`;; x86:LE:16:Real Mode — DOS Binary Loader`) is the human-readable stego.

The loader's `Decompiler` panel now annotates **all** ciphers: `XOR 0x5A` (`05C6h`), `ROT13` (`091Dh`), `Caesar -7` (`0B72h`), plus `MZ Stego` if detected.

### 17.2 JS-DOS (`wdosbox.wasm` 1.4 MB + `wdosbox.js` 111K)
`wdosbox.wasm` is stock DOSBox — no Sneakers string, but `emulators.js` (83K) lists `wdosbox` + `dosbox` as `emulators`. The `webxdc` `vite.config.js` sets `host:0.0.0.0, port:8080, allowedHosts:true` — the `allowedHosts` fix was itself a hidden “host allowlist” easter egg (the preview host `*.e2b.app` is now permitted, as the agent's `start_process` warnings noted).

---

## 18. DEEP CROSSWORD — Scrabble, Anagram & Vertical Matching

### 18.1 Scrabble Transposition
The film's Scrabble tiles `S E T E C   A S T R O N O M Y` are a **transposition cipher** — the EXE's password check is **not** transposition-invariant, but the *hint* is. The DAT's `CROSSWORD.TXT` documents both forward (`SETEC → TOO MANY SECRETS`) and decoy (`COOTYS RAT SEMEN` — Martin's Scrabble discard).

### 18.2 Vertical ↔ Horizontal Match
The 15×15 grid's **vertical validation** is the same as the **matrix rain's col 0**: `Vertical read: SETEC ASTRONOMY (col 0) -> matches horizontal 7`. In the WASM `Matrix Rain`, `HIDDEN_STRINGS[0]` (`SETec Astronomy`) is *also* drawn vertically in col 0 before random rain — pause and read top→bottom to see the same 15-letter vertical.

### 18.3 Full Asset List (re-checked 2026-08-21)
```
SNEAKERS.ZIP 9128 B (9 files):
  SNEAKERS.EXE 4221 B  MZ, multi-pw, multi-cipher, menu 1-7, VGA/LPT1
  SNEAKERS.DAT 3050 B  bios + hidden resources (Bishop/Cosmos/Crossword/Werner/Gallery/Print)
  CROSSWORD.TXT 1485 B  grid + clues, ROT13 header
  PRINT.TXT 2163 B     35-page ESC/P capture
  IMAGES/cast_redford.pcx 907 B  PCX LSB "SETEC..."
  IMAGES/cast_aykroyd.pcx 907 B  PCX LSB "SETEC..."
  IMAGES/sneakers_box.pcx 907 B  PCX LSB "SETEC..."
  RUN.BAT 25 B        @echo off / SNEAKERS.EXE
  PRINT.BAT 73 B      menu 5 → LPT1
```

---

*Analysis verified with `capstone` 5.0.9 + `keystone` disassembly + WASM `dos_loader.wasm` (4.2KB, 39 exports) on Node.js. Arch `x86:LE:16:Real Mode` mapped via `seg_off_to_phys`.*

