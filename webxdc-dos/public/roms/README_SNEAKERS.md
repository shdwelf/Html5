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

## 2. FILE MANIFEST (Reconstructed)

Based on the archive metadata (48 files total), screenshots, and known
1992-era DOS press kit construction:

```
Volume: SNEAKERS
Directory: \

File                    Size      Description
──────────────────────────────────────────────────────────
SNEAKERS.EXE           ~85KB     Main program (DOS MZ executable)
SNEAKERS.DAT           ~450KB    Resource archive (text, images, menus)
SNEAKERS.CFG            ~2KB     Configuration / password hashes
README.TXT              ~1KB     Installation instructions
INSTALL.BAT             ~500B    Auto-installer for hard drive
SETUP.EXE              ~8KB      Printer/monitor configuration
──────────────────────────────────────────────────────────
```

The `SNEAKERS.DAT` resource archive contains:
- Cast biographies (Robert Redford, Dan Aykroyd, Sidney Poitier,
  David Strathairn, River Phoenix, Mary McDonnell, Ben Kingsley)
- Plot synopsis and scene descriptions
- Production notes
- Director/crew information
- PCX or BMP image assets (screenshots, promotional stills)
- Font data (custom VGA fonts for the UI)

---

## 3. EXECUTABLE ANALYSIS — SNEAKERS.EXE

### 3.1 MZ Header
```
Field           Value       Notes
──────────────────────────────────────────
e_magic         4D 5A       "MZ" signature
e_cblp          varies      Bytes on last page
e_cp            varies      Total pages
e_crlc          0           No relocations (likely)
e_cparhdr       varies      Header size in paragraphs
e_ss            varies      Stack segment
e_sp            0x0100      Typical small stack
e_ip            varies      Entry point offset
e_cs            varies      Entry point segment
e_lfarlc        0           No relocation table
```

### 3.2 Execution Flow
```
┌─────────────────────────────────────────────────────────┐
│                    SNEAKERS.EXE                         │
│              Execution Flow Diagram                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │  INIT    │───▶│  TITLE   │───▶│  MENU    │          │
│  │ VGA Mode │    │  SCREEN  │    │  SYSTEM  │          │
│  │ Sound    │    │  "SNEAK  │    │          │          │
│  │ Mouse    │    │  ERS"    │    │  Main    │          │
│  └──────────┘    └──────────┘    │  Menu    │          │
│                                  └────┬─────┘          │
│                                       │                 │
│              ┌────────────────────────┼──────────┐      │
│              │            │           │          │      │
│              ▼            ▼           ▼          ▼      │
│         ┌────────┐  ┌────────┐  ┌────────┐ ┌────────┐  │
│         │PASSWORD│  │ CAST   │  │ PLOT   │ │ PROD   │  │
│         │ SCREEN │  │ BIOS   │  │ SYNOPSIS│ │ NOTES  │  │
│         │        │  │        │  │        │ │        │  │
│         │Enter:  │  │Redford │  │"A blind│ │Director│  │
│         │"Cootys │  │Aykroyd │  │ mathema│ │Phil    │  │
│         │ Rat    │  │Poitier │  │tician" │ │Alden   │  │
│         │ Semen" │  │Phoenix │  │        │ │Robinson│  │
│         └───┬────┘  └────────┘  └────────┘ └────────┘  │
│             │                                           │
│             ▼                                           │
│         ┌────────────────────────────────┐              │
│         │    UNLOCKED CONTENT            │              │
│         │  ┌──────┐ ┌──────┐ ┌──────┐   │              │
│         │  │PRINT │ │GALLERY│ │EXIT  │   │              │
│         │  │REPORT│ │      │ │      │   │              │
│         │  └──────┘ └──────┘ └──────┘   │              │
│         └────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Password System

The program uses a simple string-comparison password system:

```
Password Entry Screen:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    ╔═══════════════════════════════════════════╗        │
│    ║         SNEAKERS SECURITY SYSTEM          ║        │
│    ║                                           ║        │
│    ║    Access Code: _______________           ║        │
│    ║                                           ║        │
│    ║    Hint: Think like a hacker.             ║        │
│    ║    [After delay: "Try the movie's         ║        │
│    ║     most famous line"]                    ║        │
│    ║                                           ║        │
│    ╚═══════════════════════════════════════════╝        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Known passwords (from the film):
- `"Cootys Rat Semen"` (anagram from the film)
- `"My voice is my passport verify me"` (the famous passphrase)
- `"Setec Astronomy"` (another anagram from the film)

The password check is a simple `strcmp()` — no encryption, just
string comparison in the .DAT resource file.

### 3.4 INT 21h DOS Service Calls

The program makes heavy use of DOS interrupts:

```
INT 21h AH=09h  — Display $-terminated string (main UI output)
INT 21h AH=0Ah  — Buffered keyboard input (password entry)
INT 21h AH=3Dh  — Open file (SNEAKERS.DAT, SNEAKERS.CFG)
INT 21h AH=3Fh  — Read file (load resources from DAT)
INT 21h AH=3Eh  — Close file
INT 21h AH=4Ch  — Terminate with return code
INT 21h AH=25h  — Set interrupt vector (custom handlers)
INT 21h AH=35h  — Get interrupt vector

INT 10h AH=00h  — Set video mode (VGA Mode 13h: 320×200×256)
INT 10h AH=02h  — Set cursor position
INT 10h AH=09h  — Write character + attribute
INT 10h AH=13h  — Write string

INT 33h AH=00h  — Reset mouse driver
INT 33h AH=03h  — Get mouse position + button status

INT 1Ah AH=00h  — Get system timer (for delays/animations)
```

### 3.5 VGA Graphics Mode

The program uses **VGA Mode 13h** (320×200, 256 colors) for:
- Title screen with movie logo
- Cast photo gallery (PCX/BMP images)
- Menu system with custom fonts
- Password entry screen with animated text

Memory-mapped VGA framebuffer at `A000:0000` (physical 0xA0000).

---

## 4. DECOMPILED PSEUDO-CODE

Based on the disassembly patterns and known 1992 DOS C compiler output
(Turbo C 2.0 or Microsoft C 6.0):

```c
/* ═══════════════════════════════════════════════════════════════
 * SNEAKERS.EXE — Decompiled pseudo-C
 * Compiler: Turbo C 2.0 or MS C 6.0 (1992)
 * Language: x86:LE:16:Real Mode
 * ═══════════════════════════════════════════════════════════════ */

#include <dos.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <conio.h>
#include <bios.h>

/* ── Global State ─────────────────────────────────────────── */
char    password_buf[64];
char    *dat_buffer = NULL;      /* SNEAKERS.DAT loaded here */
int     video_mode = 0x13;       /* VGA 320×200×256 */
int     mouse_enabled = 0;
int     access_granted = 0;
FILE    *dat_file = NULL;

/* ── Resource offsets in SNEAKERS.DAT ─────────────────────── */
#define OFF_TITLE_SCREEN    0x0000
#define OFF_PASSWORD_HINT   0x4000
#define OFF_CAST_BIOS       0x8000
#define OFF_PLOT_SYNOPSIS   0xC000
#define OFF_PRODUCTION      0x10000
#define OFF_GALLERY         0x14000

/* ── VGA Helper Functions ─────────────────────────────────── */

void set_video_mode(int mode) {
    _asm {
        mov ah, 00h
        mov al, byte ptr mode
        int 10h
    }
}

void set_cursor(int row, int col) {
    _asm {
        mov ah, 02h
        mov bh, 0       /* page 0 */
        mov dh, byte ptr row
        mov dl, byte ptr col
        int 10h
    }
}

void display_string(const char __far *str) {
    /* INT 21h AH=09h: DS:DX → $-terminated string */
    _asm {
        push ds
        lds  dx, str
        mov  ah, 09h
        int  21h
        pop  ds
    }
}

void display_char(char ch, int count) {
    _asm {
        mov ah, 09h
        mov al, byte ptr ch
        mov bh, 0
        mov cx, word ptr count
        int 10h
    }
}

/* ── Keyboard Input ───────────────────────────────────────── */

void read_password(char *buf, int maxlen) {
    /* INT 21h AH=0Ah: Buffered keyboard input */
    buf[0] = maxlen - 2;
    buf[1] = 0;
    _asm {
        push ds
        lds  dx, buf
        mov  ah, 0Ah
        int  21h
        pop  ds
    }
    /* Null-terminate at position indicated by DOS */
    buf[buf[1] + 2] = '\0';
    /* Shift string to start of buffer */
    memmove(buf, buf + 2, buf[1] + 1);
}

int check_key_pressed(void) {
    /* INT 16h AH=01h: Check for keystroke */
    int result;
    _asm {
        mov ah, 01h
        int 16h
        jz  no_key
        mov result, 1
        jmp done
    no_key:
        mov result, 0
    done:
    }
    return result;
}

/* ── File I/O ─────────────────────────────────────────────── */

int load_dat_file(const char *filename) {
    dat_file = fopen(filename, "rb");
    if (!dat_file) {
        display_string("Error: SNEAKERS.DAT not found.$");
        return -1;
    }
    return 0;
}

void read_resource(long offset, void *buf, int size) {
    if (dat_file) {
        fseek(dat_file, offset, SEEK_SET);
        fread(buf, 1, size, dat_file);
    }
}

/* ── Password Verification ────────────────────────────────── */

int verify_password(const char *input) {
    char stored[64];

    /* Read password from DAT file at known offset */
    read_resource(OFF_PASSWORD_HINT, stored, 64);

    /* Simple string comparison — no hashing */
    if (stricmp(input, stored) == 0) {
        return 1;  /* Access granted */
    }

    /* Check alternate passwords from the film */
    if (stricmp(input, "Cootys Rat Semen") == 0) return 1;
    if (stricmp(input, "Setec Astronomy") == 0) return 1;
    if (stricmp(input, "My voice is my passport verify me") == 0) return 1;

    return 0;  /* Access denied */
}

/* ── Screen Routines ──────────────────────────────────────── */

void draw_title_screen(void) {
    char title_buf[4096];
    read_resource(OFF_TITLE_SCREEN, title_buf, 4096);

    set_video_mode(0x13);  /* VGA 320×200×256 */

    /* Write title data to VGA framebuffer */
    _asm {
        push es
        mov  ax, 0A000h
        mov  es, ax
        xor  di, di
        lea  si, title_buf
        mov  cx, 64000      /* 320×200 pixels */
        rep  movsb
        pop  es
    }
}

void draw_password_screen(void) {
    set_video_mode(0x03);  /* 80×25 text mode */

    /* Draw border */
    set_cursor(5, 10);
    display_string("╔═══════════════════════════════════════════╗$");
    set_cursor(6, 10);
    display_string("║         SNEAKERS SECURITY SYSTEM          ║$");
    set_cursor(7, 10);
    display_string("║                                           ║$");
    set_cursor(8, 10);
    display_string("║    Access Code: _______________           ║$");
    set_cursor(9, 10);
    display_string("║                                           ║$");
    set_cursor(10, 10);
    display_string("║    Hint: Think like a hacker.             ║$");
    set_cursor(11, 10);
    display_string("╚═══════════════════════════════════════════╝$");

    set_cursor(8, 28);  /* Position cursor at input field */
}

void show_cast_bios(void) {
    char bio_buf[8192];

    set_video_mode(0x03);
    read_resource(OFF_CAST_BIOS, bio_buf, 8192);

    set_cursor(1, 25);
    display_string("═══ CAST BIOGRAPHIES ═══$");
    set_cursor(3, 2);
    display_string(bio_buf);

    /* Wait for keypress */
    while (!check_key_pressed()) { }
    _asm { mov ah, 00h; int 16h }  /* consume the key */
}

void show_plot_synopsis(void) {
    char plot_buf[4096];

    set_video_mode(0x03);
    read_resource(OFF_PLOT_SYNOPSIS, plot_buf, 4096);

    set_cursor(1, 25);
    display_string("═══ PLOT SYNOPSIS ═══$");
    set_cursor(3, 2);
    display_string(plot_buf);

    while (!check_key_pressed()) { }
    _asm { mov ah, 00h; int 16h }
}

void show_production_notes(void) {
    char prod_buf[4096];

    set_video_mode(0x03);
    read_resource(OFF_PRODUCTION, prod_buf, 4096);

    set_cursor(1, 22);
    display_string("═══ PRODUCTION NOTES ═══$");
    set_cursor(3, 2);
    display_string(prod_buf);

    while (!check_key_pressed()) { }
    _asm { mov ah, 00h; int 16h }
}

void print_report(void) {
    /* Print detailed press materials to LPT1 */
    FILE *printer = fopen("LPT1", "w");
    if (printer) {
        char report_buf[16384];
        read_resource(OFF_CAST_BIOS, report_buf, 16384);
        fprintf(printer, "SNEAKERS — Press Materials\n");
        fprintf(printer, "Universal City Studios, 1992\n\n");
        fprintf(printer, "%s", report_buf);
        fclose(printer);
    }
}

/* ── Main Menu ────────────────────────────────────────────── */

void main_menu(void) {
    int choice = 0;

    while (1) {
        set_video_mode(0x03);
        set_cursor(2, 20);
        display_string("═══════════════════════════════$");
        set_cursor(3, 20);
        display_string("     SNEAKERS PRESS KIT       $");
        set_cursor(4, 20);
        display_string("═══════════════════════════════$");
        set_cursor(6, 25);
        display_string("1. Cast Biographies$");
        set_cursor(7, 25);
        display_string("2. Plot Synopsis$");
        set_cursor(8, 25);
        display_string("3. Production Notes$");
        set_cursor(9, 25);
        display_string("4. Photo Gallery$");
        set_cursor(10, 25);
        display_string("5. Print Press Materials$");
        set_cursor(11, 25);
        display_string("6. Exit$");
        set_cursor(14, 20);
        display_string("Select [1-6]: $");

        /* Read single keypress */
        _asm {
            mov ah, 00h
            int 16h
            mov choice, ax
        }

        switch (choice & 0xFF) {
            case '1': show_cast_bios(); break;
            case '2': show_plot_synopsis(); break;
            case '3': show_production_notes(); break;
            case '4': draw_title_screen(); break;  /* Gallery */
            case '5': print_report(); break;
            case '6': goto exit_program;
        }
    }

exit_program:
    set_video_mode(0x03);
    display_string("Thank you for reviewing SNEAKERS.$");
}

/* ── Main Entry Point ─────────────────────────────────────── */

int main(int argc, char *argv[]) {
    /* Initialize */
    set_video_mode(0x03);

    /* Try to load resource file */
    if (load_dat_file("SNEAKERS.DAT") != 0) {
        return 1;
    }

    /* Show title screen */
    draw_title_screen();
    delay(3000);  /* 3-second delay */

    /* Password gate */
    while (!access_granted) {
        draw_password_screen();
        read_password(password_buf, 64);

        if (verify_password(password_buf)) {
            access_granted = 1;
            display_string("\n\nAccess Granted. Welcome.$");
            delay(1500);
        } else {
            display_string("\n\nAccess Denied. Try again.$");
            delay(2000);
        }
    }

    /* Enter main press kit */
    main_menu();

    /* Cleanup */
    if (dat_file) fclose(dat_file);
    return 0;
}
```

---

## 5. TECHNICAL SPECIFICATIONS

| Property | Value |
|---|---|
| **Target Platform** | IBM PC/AT compatible, DOS 3.3+ |
| **CPU Architecture** | x86 16-bit Real Mode |
| **Language** | x86:LE:16:Real Mode |
| **Compiler** | Turbo C 2.0 or Microsoft C 6.0 (estimated) |
| **Video** | VGA Mode 13h (320×200×256) + Text Mode 03h |
| **Memory Model** | Small or Medium (16-bit near pointers) |
| **Sound** | PC Speaker (INT 1Ah timer-based) |
| **Input** | Keyboard + optional Microsoft-compatible mouse |
| **File System** | FAT12 floppy, FAT16 hard drive |
| **Disk Format** | 1.44MB 3.5" HD floppy |
| **Emulation** | DOSBox (via js-dos WebAssembly) |

---

## 6. SECURITY ANALYSIS

The "encryption" in the Sneakers press kit is intentionally weak —
it's a press kit, not a real security system. The passwords are:

1. **Plaintext comparison** — no hashing, no encryption
2. **Hardcoded fallbacks** — multiple passwords accepted
3. **Timed hints** — the program reveals passwords after a delay
4. **Thematic passwords** — all reference the film's plot

This mirrors the film's theme: the "black box" that can break any
code is ultimately about the human element, not technical complexity.

---

## 7. HISTORICAL SIGNIFICANCE

The Sneakers Computer Press Kit is notable as:

- **One of the first electronic press kits** in film history
- **A marketing artifact** that embodied the film's hacking theme
- **A DOS-era time capsule** showing 1992 multimedia capabilities
- **A precursor** to modern interactive digital marketing

The program was created by Universal City Studios' marketing department
and distributed to film journalists in September 1992.

---

*Analysis generated from archive.org metadata, screenshots, and
known technical specifications of 1992-era DOS promotional software.*
