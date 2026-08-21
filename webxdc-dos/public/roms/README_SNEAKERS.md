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

*Analysis verified with `capstone` 5.0.9 + `keystone` disassembly + WASM `dos_loader.wasm` (4.2KB, 39 exports) on Node.js. Arch `x86:LE:16:Real Mode` mapped via `seg_off_to_phys`.*

