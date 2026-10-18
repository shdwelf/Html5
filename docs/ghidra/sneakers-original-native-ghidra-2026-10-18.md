# Sneakers: native Ghidra + FindCrypt results

Static analysis only. None of the input executables were launched or emulated by this workflow.

## Reproducible toolchain

- Ghidra: `Ghidra 12.1.4 (20260921), SHA-256 ddac49f903da9d5bac833e5cc79395098b9c33cfd3279be5f31bd00387d2d4db`
- Eclipse Temurin/OpenJDK runtime: `openjdk version "21.0.12.1" 2026-08-18 LTS`
- FindCrypt database: `TorgoTorgo/ghidra-findcrypt database commit 5c2fd5bb50d13a4092da136dc7004becd8129c7b; 126 signatures; database SHA-256 ec3f54412ea1a1ddca05ec39eaa8ad1a9c38ce021297f359dbc0a58b9c7a8897`
- The official Ghidra archive and FindCrypt database were SHA-256 checked before analysis.
- The database-driven scan passed a positive control: its AES encryption S-box matched `CRYPT_AES_Encryption_SBox`.
- This run uses the pinned FindCrypt signature database through Ghidra's `Memory.findBytes` API; it does not claim that the separately compiled FindCrypt extension loaded.

## MZ loader analyses

| Input / provenance | SHA-256 | Ghidra format | Language | Image base | Entry point | Memory blocks / bytes | Functions | Instructions | Defined strings | Decompilations completed |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| `SNEAKERS.EXE` — original promotional program | `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961` | `Old-style DOS Executable (MZ)` | `x86:LE:16:Real Mode` | `0000:0000` | `1000:02d8` | 7 / 124077 B | 600 | 40570 | 239 | 48/48 |

### Address-order disassembly excerpt — `SNEAKERS.EXE`

These are the first instructions in the exported listing, not a claim that the first address is the MZ entry point:

```asm
1000:0000          0000                           ADD byte ptr [BX + SI],AL
1000:0002          0000                           ADD byte ptr [BX + SI],AL
1000:0004          0000                           ADD byte ptr [BX + SI],AL
1000:0006          0000                           ADD byte ptr [BX + SI],AL
1000:0008          0000                           ADD byte ptr [BX + SI],AL
1000:000a          0000                           ADD byte ptr [BX + SI],AL
1000:000c          0000                           ADD byte ptr [BX + SI],AL
1000:000e          0000                           ADD byte ptr [BX + SI],AL
1000:0010          8e26a02d                       MOV FS,word ptr [0x2da0]
1000:0014          55                             PUSH BP
1000:0015          8bec                           MOV BP,SP
1000:0017          57                             PUSH DI
1000:0018          56                             PUSH SI
1000:0019          53                             PUSH BX
1000:001a          33ff                           XOR DI,DI
1000:001c          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:001f          0bc0                           OR AX,AX
1000:0021          7d12                           JGE 0x1000:0035
```

### Native disassembly at Ghidra entry point — `SNEAKERS.EXE` (`1000:02d8`)

For real-mode addresses, the listing may display an equivalent canonical segment:offset alias for the same linear address:

```asm
1000:02d8          8cd8                           MOV AX,DS
1000:02da          8ec0                           MOV AX,ES
1000:02dc          b8402a                         MOV AX,0x2a40
1000:02df          8ed8                           MOV AX,DS
1000:02e1          8c065300                       MOV word ptr [0x53],ES
1000:02e5          8c164d00                       MOV word ptr [0x4d],SS
1000:02e9          89264f00                       MOV word ptr [0x4f],SP
1000:02ed          26a10200                       MOV AX,ES:[0x2]
1000:02f1          3b06ba22                       CMP AX,word ptr [0x22ba]
1000:02f5          7703                           JA 0x1000:02fa
1000:02f7          e9b700                         JMP 0x1000:03b1
1000:02fa          2b06ba22                       SUB AX,word ptr [0x22ba]
1000:02fe          8cdf                           MOV DI,DS
1000:0300          81c70010                       ADD DI,0x1000
1000:0304          3bf8                           CMP DI,AX
1000:0306          7302                           JNC 0x1000:030a
1000:0308          8bc7                           MOV AX,DI
1000:030a          bea82c                         MOV SI,0x2ca8
1000:030d          3bf0                           CMP SI,AX
1000:030f          7203                           JC 0x1000:0314
1000:0311          e99d00                         JMP 0x1000:03b1
1000:0314          2bc6                           SUB AX,SI
1000:0316          3b06b822                       CMP AX,word ptr [0x22b8]
1000:031a          7303                           JNC 0x1000:031f
```

### Ghidra decompiler excerpt — `SNEAKERS.EXE` entry function

C-like pseudocode generated from the native MZ-loader program database; this is not original source:

```c
/* WARNING: Stack frame is not setup normally: Input value of stackpointer is not used */
/* WARNING: This function may have set the stack pointer */
void entry(void)
{
  undefined2 *puVar1;
  undefined2 *puVar2;
  code *pcVar3;
  int iVar4;
  uint uVar5;
  uint uVar6;
  int iVar7;
  undefined2 *puVar8;
  undefined2 *puVar9;
  int iVar10;
  undefined2 *puVar11;
  undefined2 unaff_DS;
  undefined2 uVar12;
  byte in_AF;
  byte in_TF;
  byte in_IF;
  byte in_NT;
  uint uVar13;
  DAT_2a40_004d = 0x2d1a;
  DAT_2a40_004f = 0x100;
  DAT_2a40_0053 = unaff_DS;
  if (DAT_2a40_22ba < *(uint *)0x2) {
    uVar5 = *(uint *)0x2 - DAT_2a40_22ba;
    if (0x3a40 < uVar5) {
      uVar5 = 0x3a40;
    }
    if ((0x2ca8 < uVar5) && (uVar5 = uVar5 + 0xd358, DAT_2a40_22b8 <= uVar5)) {
      if (DAT_2a40_0cf6 < uVar5) {
        uVar5 = DAT_2a40_0cf6;
      }
      iVar10 = 0x2a40;
      uVar6 = uVar5 + 0x268;
      uVar13 = uVar6;
      if (0xfff < uVar6 && uVar5 != 0xd98) {
        uVar6 = 0x1000;
        iVar10 = uVar5 + 0x1ca8;
        uVar13 = uVar5 + 0x2ca8;
      }
      uVar5 = uVar6 * 0x10;
      uVar13 = (uint)(in_NT & 1) * 0x4000 | (uint)SBORROW2(uVar13,0x1000) * 0x800 |
               (uint)(in_IF & 1) * 0x200 | (uint)(in_TF & 1) * 0x100 | (uint)((int)uVar5 < 0) * 0x80
               | (uint)(uVar5 == 0) * 0x40 | (uint)(in_AF & 1) * 0x10 |
               (uint)((POPCOUNT(uVar5 & 0xff) & 1U) == 0) * 4 | (uint)((int)(uVar6 << 3) < 0);
      DAT_2ca8_081e = uVar13;
      *(undefined2 *)(uVar5 - 2) = 0;
      *(uint *)(uVar5 - 4) = uVar13;
      puVar8 = (undefined2 *)(uVar5 - 4);
      *(undefined2 *)(uVar5 - 4) = unaff_DS;
      pcVar3 = (code *)swi(0x21);
      (*pcVar3)();
      uVar12 = *puVar8;
      puVar9 = (undefined2 *)0x80;
      iVar4 = -((byte)(*(char *)0x80 + 3U) & 0xfe);
      puVar11 = (undefined2 *)((int)puVar8 + iVar4 + 2);
      for (uVar5 = (uint)((byte)(*(char *)0x80 + 3U) >> 1); uVar5 != 0; uVar5 = uVar5 - 1) {
        puVar2 = puVar11;
        puVar11 = puVar11 + 1;
        puVar1 = puVar9;
        puVar9 = puVar9 + 1;
        *puVar2 = *puVar1;
      }
      *(undefined1 **)((int)puVar8 + iVar4) = (undefined1 *)((int)puVar8 + iVar4 + 2);
      puVar9 = (undefined2 *)0x268e;
      for (iVar7 = 0x389; iVar7 != 0; iVar7 = iVar7 + -1) {
        puVar1 = puVar9;
        puVar9 = puVar9 + 1;
        *puVar1 = 0;
      }
      *(undefined1 *)puVar9 = 0;
      *(undefined2 *)((int)puVar8 + iVar4 + -2) = 0x398;
      FUN_1000_043a();
      DAT_2a40_0043 = 0x2da2;
      DAT_2a40_0045 = DAT_2a40_0043;
      DAT_2a40_004b = DAT_2a40_0043;
      *(undefined2 *)((int)puVar8 + iVar4 + -2) = 0x1000;
      *(undefined2 *)((int)puVar8 + iVar4 + -4) = 0x3ad;
      FUN_1fc3_4aab();
      FUN_1000_042e();
      return;
    }
  }
  pcVar3 = (code *)swi(0x21);
  (*pcVar3)();
  pcVar3 = (code *)swi(0x21);
  (*pcVar3)();
  return;
/* excerpt truncated; full decompilation is in the CI artifact */
```

Full `.asm`, `.c`, and `.strings.txt` files are retained in the CI artifact for `SNEAKERS.EXE`.

| `SNEAK.EXE` — original LHA SFX companion | `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb` | `Old-style DOS Executable (MZ)` | `x86:LE:16:Real Mode` | `0000:0000` | `0ff0:0100` | 3 / 67172 B | 21 | 605 | 7 | 21/21 |

### Address-order disassembly excerpt — `SNEAK.EXE`

These are the first instructions in the exported listing, not a claim that the first address is the MZ entry point:

```asm
1000:0000          eb79                           JMP 0x1000:007b
1000:007b          fc                             CLD
1000:007c          bc0001                         MOV SP,0x100
1000:007f          8cc8                           MOV AX,CS
1000:0081          058800                         ADD AX,0x88
1000:0084          8ec0                           MOV AX,ES
1000:0086          eb01                           JMP 0x1000:0089
1000:0089          bb0401                         MOV BX,0x104
1000:008c          e85b02                         CALL 0x1000:02ea
1000:008f          06                             PUSH ES
1000:0090          1f                             POP DS
1000:0091          b430                           MOV AH,0x30
1000:0093          cd21                           INT 0x21
1000:0095          8bd8                           MOV BX,AX
1000:0097          1e                             PUSH DS
1000:0098          3c03                           CMP AL,0x3
1000:009a          721c                           JC 0x1000:00b8
1000:009c          368e062c00                     MOV ES,word ptr SS:[0x2c]
```

### Native disassembly at Ghidra entry point — `SNEAK.EXE` (`0ff0:0100`)

For real-mode addresses, the listing may display an equivalent canonical segment:offset alias for the same linear address:

```asm
1000:0000          eb79                           JMP 0x1000:007b
1000:007b          fc                             CLD
1000:007c          bc0001                         MOV SP,0x100
1000:007f          8cc8                           MOV AX,CS
1000:0081          058800                         ADD AX,0x88
1000:0084          8ec0                           MOV AX,ES
1000:0086          eb01                           JMP 0x1000:0089
1000:0089          bb0401                         MOV BX,0x104
1000:008c          e85b02                         CALL 0x1000:02ea
1000:008f          06                             PUSH ES
1000:0090          1f                             POP DS
1000:0091          b430                           MOV AH,0x30
1000:0093          cd21                           INT 0x21
1000:0095          8bd8                           MOV BX,AX
1000:0097          1e                             PUSH DS
1000:0098          3c03                           CMP AL,0x3
1000:009a          721c                           JC 0x1000:00b8
1000:009c          368e062c00                     MOV ES,word ptr SS:[0x2c]
1000:00a1          33c0                           XOR AX,AX
1000:00a3          8bf8                           MOV DI,AX
1000:00a5          b9ffff                         MOV CX,0xffff
1000:00a8          f2ae                           SCASB.REPNE ES:DI
1000:00aa          ae                             SCASB ES:DI
1000:00ab          75fb                           JNZ 0x1000:00a8
```

### Ghidra decompiler excerpt — `SNEAK.EXE` entry function

C-like pseudocode generated from the native MZ-loader program database; this is not original source:

```c
/* WARNING: Stack frame is not setup normally: Input value of stackpointer is not used */
/* WARNING: This function may have set the stack pointer */
void entry(void)
{
  int *piVar1;
  code *pcVar2;
  byte bVar3;
  int iVar4;
  undefined1 *puVar5;
  undefined1 *puVar6;
  int *piVar7;
  uRam0000fffe = 0x8f;
  FUN_1000_02ea();
  puVar5 = (undefined1 *)0x100;
  uRam0000fffe = 0x1088;
  pcVar2 = (code *)swi(0x21);
  bVar3 = (*pcVar2)();
  *(undefined2 *)(puVar5 + -2) = 0x1088;
  if (2 < bVar3) {
    piVar7 = (int *)0x0;
    iVar4 = -1;
LAB_1000_00a8:
    do {
      if (iVar4 != 0) {
        iVar4 = iVar4 + -1;
        piVar1 = piVar7;
        piVar7 = (int *)((int)piVar7 + 1);
        if ((char)*piVar1 != '\0') goto LAB_1000_00a8;
      }
      piVar1 = piVar7;
      piVar7 = (int *)((int)piVar7 + 1);
    } while ((char)*piVar1 != '\0');
    iVar4 = *piVar7;
    *(undefined2 *)(puVar5 + -4) = uRam0000ff2c;
    if (iVar4 == 1) {
      *(undefined2 *)(puVar5 + -4) = 0xb8;
      FUN_1000_00da();
    }
  }
  *(undefined2 *)(puVar5 + -4) = 0x1000;
  *(undefined2 *)(puVar5 + -4) = 0xc0;
  FUN_1000_00da();
  puVar6 = puVar5 + -2;
  if (bVar3 == 2) {
    *(undefined2 *)(puVar5 + -4) = 0xd4;
    FUN_1000_00da();
    puVar6 = puVar5 + -2;
  }
  do {
    *(undefined2 *)(puVar6 + -2) = 0x245;
    FUN_1000_02ea();
    pcVar2 = (code *)swi(0x21);
    (*pcVar2)();
    *(undefined2 *)(puVar6 + -2) = 0x22a;
    FUN_1000_02de();
  } while( true );
}
```

Full `.asm`, `.c`, and `.strings.txt` files are retained in the CI artifact for `SNEAK.EXE`.

| `RECONSTRUCTED_SNEAKERS.EXE` — repository reconstruction (comparison only) | `52e66ef4e192b4a368c0de58cac79a8e81d7ec06180da15bba2675614a0f1920` | `Old-style DOS Executable (MZ)` | `x86:LE:16:Real Mode` | `0000:0000` | `1000:0100` | 2 / 4221 B | 1 | 1837 | 0 | 1/1 |

### Address-order disassembly excerpt — `RECONSTRUCTED_SNEAKERS.EXE`

These are the first instructions in the exported listing, not a claim that the first address is the MZ entry point:

```asm
1000:00f4          8a04                           MOV AL,byte ptr [SI]
1000:00f6          3c24                           CMP AL,0x24
1000:00f8          742b                           JZ 0x1000:0125
1000:00fa          3c41                           CMP AL,0x41
1000:00fc          7224                           JC 0x1000:0122
1000:00fe          3c5a                           CMP AL,0x5a
1000:0100          7614                           JBE 0x1000:0116
1000:0102          3c61                           CMP AL,0x61
1000:0104          721c                           JC 0x1000:0122
1000:0106          3c7a                           CMP AL,0x7a
1000:0108          7718                           JA 0x1000:0122
1000:010a          3c6d                           CMP AL,0x6d
1000:010c          7604                           JBE 0x1000:0112
1000:010e          2c0d                           SUB AL,0xd
1000:0110          eb0e                           JMP 0x1000:0120
1000:0112          040d                           ADD AL,0xd
1000:0114          eb0a                           JMP 0x1000:0120
1000:0116          3c4d                           CMP AL,0x4d
```

### Native disassembly at Ghidra entry point — `RECONSTRUCTED_SNEAKERS.EXE` (`1000:0100`)

For real-mode addresses, the listing may display an equivalent canonical segment:offset alias for the same linear address:

```asm
1000:0100          7614                           JBE 0x1000:0116
1000:0102          3c61                           CMP AL,0x61
1000:0104          721c                           JC 0x1000:0122
1000:0106          3c7a                           CMP AL,0x7a
1000:0108          7718                           JA 0x1000:0122
1000:010a          3c6d                           CMP AL,0x6d
1000:010c          7604                           JBE 0x1000:0112
1000:010e          2c0d                           SUB AL,0xd
1000:0110          eb0e                           JMP 0x1000:0120
1000:0112          040d                           ADD AL,0xd
1000:0114          eb0a                           JMP 0x1000:0120
1000:0116          3c4d                           CMP AL,0x4d
1000:0118          7604                           JBE 0x1000:011e
1000:011a          2c0d                           SUB AL,0xd
1000:011c          eb02                           JMP 0x1000:0120
1000:011e          040d                           ADD AL,0xd
1000:0120          8804                           MOV byte ptr [SI],AL
1000:0122          46                             INC SI
1000:0123          e2cf                           LOOP 0x1000:00f4
1000:0125          b409                           MOV AH,0x9
1000:0127          ba1d09                         MOV DX,0x91d
1000:012a          cd21                           INT 0x21
1000:012c          83f900                         CMP CX,0x0
1000:012f          be8104                         MOV SI,0x481
```

### Ghidra decompiler excerpt — `RECONSTRUCTED_SNEAKERS.EXE` entry function

C-like pseudocode generated from the native MZ-loader program database; this is not original source:

```c
/* WARNING: Control flow encountered bad instruction data */
/* WARNING: Instruction at (ram,0x0001101d) overlaps instruction at (ram,0x0001101c)
    */
/* WARNING: Stack frame is not setup normally: Input value of stackpointer is not used */
/* WARNING: This function may have set the stack pointer */
/* WARNING: Removing unreachable block (ram,0x00011045) */
/* WARNING: Removing unreachable block (ram,0x000110b9) */
/* WARNING: Removing unreachable block (ram,0x00011020) */
/* WARNING: Removing unreachable block (ram,0x00010e4a) */
/* WARNING: Removing unreachable block (ram,0x00010e50) */
/* WARNING: Removing unreachable block (ram,0x00010de2) */
/* WARNING: Removing unreachable block (ram,0x00010de5) */
/* WARNING: Removing unreachable block (ram,0x00010dea) */
/* WARNING: Removing unreachable block (ram,0x00010ded) */
/* WARNING: Removing unreachable block (ram,0x00010e1b) */
/* WARNING: Removing unreachable block (ram,0x00010e7c) */
/* WARNING: Removing unreachable block (ram,0x00010ddb) */
/* WARNING: Removing unreachable block (ram,0x00010d59) */
/* WARNING: Removing unreachable block (ram,0x00010dd1) */
/* WARNING: Removing unreachable block (ram,0x00010dcf) */
/* WARNING: Removing unreachable block (ram,0x00010df1) */
/* WARNING: Removing unreachable block (ram,0x00010def) */
/* WARNING: Removing unreachable block (ram,0x00010e68) */
/* WARNING: Removing unreachable block (ram,0x00010df4) */
/* WARNING: Removing unreachable block (ram,0x00010df8) */
/* WARNING: Removing unreachable block (ram,0x00010dfa) */
/* WARNING: Removing unreachable block (ram,0x00010e60) */
/* WARNING: Removing unreachable block (ram,0x00010dfc) */
/* WARNING: Removing unreachable block (ram,0x00010dff) */
/* WARNING: Removing unreachable block (ram,0x00010e2d) */
/* WARNING: Removing unreachable block (ram,0x00010e62) */
/* WARNING: Removing unreachable block (ram,0x00010e63) */
/* WARNING: Removing unreachable block (ram,0x00010e85) */
/* WARNING: Removing unreachable block (ram,0x00010e65) */
/* WARNING: Removing unreachable block (ram,0x00010e69) */
/* WARNING: Removing unreachable block (ram,0x00010e6e) */
/* WARNING: Removing unreachable block (ram,0x00010d3e) */
/* WARNING: Removing unreachable block (ram,0x00010d44) */
/* WARNING: Removing unreachable block (ram,0x00010d65) */
/* WARNING: Removing unreachable block (ram,0x00010c2c) */
/* WARNING: Removing unreachable block (ram,0x00010c4f) */
/* WARNING: Removing unreachable block (ram,0x00010c2f) */
/* WARNING: Removing unreachable block (ram,0x00010a8c) */
/* WARNING: Removing unreachable block (ram,0x00010a8f) */
/* WARNING: Removing unreachable block (ram,0x00010af7) */
/* WARNING: Removing unreachable block (ram,0x000109eb) */
/* WARNING: Removing unreachable block (ram,0x000109ff) */
/* WARNING: Removing unreachable block (ram,0x00010a01) */
/* WARNING: Removing unreachable block (ram,0x00010855) */
/* WARNING: Removing unreachable block (ram,0x0001085d) */
/* WARNING: Removing unreachable block (ram,0x000108c0) */
/* WARNING: Removing unreachable block (ram,0x000108c5) */
/* WARNING: Removing unreachable block (ram,0x000104e0) */
/* WARNING: Removing unreachable block (ram,0x00010359) */
/* WARNING: Removing unreachable block (ram,0x0001035b) */
/* WARNING: Removing unreachable block (ram,0x0001035d) */
/* WARNING: Removing unreachable block (ram,0x00010361) */
/* WARNING: Removing unreachable block (ram,0x000103d1) */
/* WARNING: Removing unreachable block (ram,0x00010363) */
/* WARNING: Removing unreachable block (ram,0x00010366) */
/* WARNING: Removing unreachable block (ram,0x0001036e) */
/* WARNING: Removing unreachable block (ram,0x00010378) */
/* WARNING: Removing unreachable block (ram,0x0001037a) */
/* WARNING: Removing unreachable block (ram,0x00010386) */
/* WARNING: Removing unreachable block (ram,0x0001039a) */
/* WARNING: Removing unreachable block (ram,0x00010254) */
/* WARNING: Removing unreachable block (ram,0x00010256) */
/* WARNING: Removing unreachable block (ram,0x00010302) */
/* WARNING: Removing unreachable block (ram,0x0001031a) */
/* WARNING: Removing unreachable block (ram,0x00010354) */
/* WARNING: Removing unreachable block (ram,0x000103c1) */
/* WARNING: Removing unreachable block (ram,0x00010406) */
/* WARNING: Removing unreachable block (ram,0x0001040b) */
/* WARNING: Removing unreachable block (ram,0x00010439) */
/* WARNING: Removing unreachable block (ram,0x0001046b) */
/* WARNING: Removing unreachable block (ram,0x0001046d) */
/* WARNING: Removing unreachable block (ram,0x00010472) */
/* WARNING: Removing unreachable block (ram,0x00010926) */
/* WARNING: Removing unreachable block (ram,0x00010929) */
/* WARNING: Removing unreachable block (ram,0x0001090a) */
/* WARNING: Removing unreachable block (ram,0x00010a57) */
/* WARNING: Removing unreachable block (ram,0x00010a59) */
/* WARNING: Removing unreachable block (ram,0x00010a5a) */
/* WARNING: Removing unreachable block (ram,0x00010a60) */
/* WARNING: Removing unreachable block (ram,0x00010a61) */
/* WARNING: Removing unreachable block (ram,0x00010bc4) */
/* WARNING: Removing unreachable block (ram,0x00010bcb) */
/* WARNING: Removing unreachable block (ram,0x00010c35) */
/* WARNING: Removing unreachable block (ram,0x00010bcd) */
/* WARNING: Removing unreachable block (ram,0x00010bdc) */
/* excerpt truncated; full decompilation is in the CI artifact */
```

Full `.asm`, `.c`, and `.strings.txt` files are retained in the CI artifact for `RECONSTRUCTED_SNEAKERS.EXE`.


## Native FindCrypt results

The pinned TorgoTorgo FindCrypt database was scanned inside native Ghidra with `Memory.findBytes` against each complete file imported through `BinaryLoader` at base address zero. This pass covers the MZ header and any file overlay, not just the DOS-loaded image. It uses the extension's signature data, but is a Ghidra script rather than the compiled GUI/auto-analysis extension. The separate MZ-loader analyses above are the source for code disassembly and decompilation.

### `SNEAKERS.EXE` — original promotional program

# Ghidra FindCrypt signature scan — static only

- Ghidra: `12.1.4`
- Program: `SNEAKERS.EXE`
- Loader format: `Raw Binary`
- Language: `x86:LE:32:default`
- SHA-256: `d5738c9a4050d69ca205a03229dad1616d681fbc9312859be3e629f4b3905961`
- FindCrypt database signatures: **126**
- Matching signature occurrences: **0**
- Memory blocks scanned:
  - `ram`: `00000000`–`0021dc6c` (2219117 bytes)

No FindCrypt database signatures matched the loaded bytes.

This is a signature scan, not proof that a cryptographic algorithm is or is not used. A match needs disassembly/xref review; zero hits do not rule out custom, table-free, or unlisted transforms.

### `SNEAK.EXE` — original LHA SFX companion

# Ghidra FindCrypt signature scan — static only

- Ghidra: `12.1.4`
- Program: `SNEAK.EXE`
- Loader format: `Raw Binary`
- Language: `x86:LE:32:default`
- SHA-256: `4710858f7be6461a6d3a267cbc2dec8ca2594e70d28695298ecfb682d99f33bb`
- FindCrypt database signatures: **126**
- Matching signature occurrences: **0**
- Memory blocks scanned:
  - `ram`: `00000000`–`001065c6` (1074631 bytes)

No FindCrypt database signatures matched the loaded bytes.

This is a signature scan, not proof that a cryptographic algorithm is or is not used. A match needs disassembly/xref review; zero hits do not rule out custom, table-free, or unlisted transforms.

### `RECONSTRUCTED_SNEAKERS.EXE` — repository reconstruction (comparison only)

# Ghidra FindCrypt signature scan — static only

- Ghidra: `12.1.4`
- Program: `RECONSTRUCTED_SNEAKERS.EXE`
- Loader format: `Raw Binary`
- Language: `x86:LE:32:default`
- SHA-256: `52e66ef4e192b4a368c0de58cac79a8e81d7ec06180da15bba2675614a0f1920`
- FindCrypt database signatures: **126**
- Matching signature occurrences: **0**
- Memory blocks scanned:
  - `ram`: `00000000`–`0000107c` (4221 bytes)

No FindCrypt database signatures matched the loaded bytes.

This is a signature scan, not proof that a cryptographic algorithm is or is not used. A match needs disassembly/xref review; zero hits do not rule out custom, table-free, or unlisted transforms.

## Interpretation limits

A FindCrypt zero-hit result means only that this pinned database's signatures did not match the bytes scanned. It does not rule out custom/table-free cryptography, XOR/add/sub transforms, compressed or encoded resources, or algorithms with different constants. A hit would still require disassembly and cross-reference review before attributing an algorithm to the program.

The reconstruction comparator is included only to keep its previous puzzle/cipher claims distinct from the original promotional binaries. Do not transfer reconstruction behavior to either original EXE.
