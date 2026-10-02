/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: SPYCRAFT.EXE
 * SHA-256: 0bc0bd01c6ea453e39918c37f5c8af4b5f136c0ddc6350fd1a16fbf88c51c7d2
 */

/* ------------------------------------------------------------
 * MAINWNDPROC @ 1020:021a
 * selected: NE entry/export
 * body bytes: 21
 * completed: true
 */

void MAINWNDPROC(void)

{
  code *pcVar1;
  uint in_AX;
  int in_BX;
  int unaff_SI;
  bool bVar2;

  *(uint *)(in_BX + unaff_SI) = *(uint *)(in_BX + unaff_SI) | 0x7c;
  do {
    bVar2 = in_AX < 0x85;
    in_AX = in_AX - 0x85;
  } while (bVar2);
  pcVar1 = (code *)swi(1);
  (*pcVar1)();
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0031 @ 1000:0031
 * selected: address-order fallback
 * body bytes: 289
 * completed: true
 */

void __cdecl16near FUN_1000_0031(void)

{
  uint *puVar1;
  byte *pbVar2;
  byte *pbVar3;
  byte bVar4;
  char cVar5;
  uint uVar6;
  char cVar8;
  int iVar7;
  int iVar9;
  int extraout_DX;
  int extraout_DX_00;
  int extraout_DX_01;
  int extraout_DX_02;
  int extraout_DX_03;
  int extraout_DX_04;
  uint in_BX;
  char cVar10;
  uint uVar11;
  uint *unaff_SI;
  uint *puVar12;
  byte *pbVar13;
  byte *unaff_DI;
  undefined2 unaff_ES;
  bool bVar14;

  puVar12 = unaff_SI + 1;
  uVar11 = *unaff_SI;
  iVar9 = 0x10;
  do {
    while( true ) {
      iVar7 = 0;
      cVar10 = (char)(in_BX >> 8);
      bVar14 = CARRY2(uVar11,uVar11);
      uVar11 = uVar11 * 2;
      iVar9 = iVar9 + -1;
      if (iVar9 != 0) break;
      uVar11 = *puVar12;
      iVar9 = 0x10;
      puVar12 = puVar12 + 1;
      if (!bVar14) goto LAB_1000_0069;
LAB_1000_0061:
      pbVar2 = unaff_DI;
      unaff_DI = unaff_DI + 1;
      puVar1 = puVar12;
      puVar12 = (uint *)((int)puVar12 + 1);
      *pbVar2 = (byte)*puVar1;
    }
    if (bVar14) goto LAB_1000_0061;
LAB_1000_0069:
    bVar14 = CARRY2(uVar11,uVar11);
    uVar11 = uVar11 * 2;
    iVar9 = iVar9 + -1;
    if (iVar9 == 0) {
      uVar11 = *puVar12;
      iVar9 = 0x10;
      puVar12 = puVar12 + 1;
    }
    if (bVar14) {
      iVar7 = 1;
      bVar14 = CARRY2(uVar11,uVar11);
      uVar11 = uVar11 * 2;
      iVar9 = iVar9 + -1;
      if (iVar9 == 0) {
        puVar1 = puVar12;
        puVar12 = puVar12 + 1;
        uVar11 = *puVar1;
        iVar9 = 0x10;
      }
      if (!bVar14) goto LAB_1000_0072;
      iVar7 = 2;
      bVar14 = CARRY2(uVar11,uVar11);
      uVar11 = uVar11 * 2;
      iVar9 = iVar9 + -1;
      if (iVar9 == 0) {
        puVar1 = puVar12;
        puVar12 = puVar12 + 1;
        uVar11 = *puVar1;
        iVar9 = 0x10;
      }
      if (!bVar14) goto LAB_1000_0072;
      FUN_1000_0154();
      in_BX = 0x802;
      iVar9 = extraout_DX;
      if (!bVar14) {
LAB_1000_0138:
        iVar7 = 0;
        do {
          bVar14 = CARRY2(uVar11,uVar11);
          uVar11 = uVar11 * 2;
          iVar9 = iVar9 + -1;
          if (iVar9 == 0) {
            uVar11 = *puVar12;
            iVar9 = 0x10;
            puVar12 = puVar12 + 1;
          }
          iVar7 = iVar7 * 2 + (uint)bVar14;
          cVar5 = (char)(in_BX >> 8);
          cVar10 = (char)in_BX + -1;
          in_BX = CONCAT11(cVar5,cVar10);
        } while (cVar10 != '\0');
        uVar6 = CONCAT11((char)((uint)iVar7 >> 8),(char)iVar7 + cVar5);
        goto LAB_1000_007f;
      }
      FUN_1000_0154();
      in_BX = 0xc03;
      iVar9 = extraout_DX_00;
      if (!bVar14) goto LAB_1000_0138;
      bVar4 = (byte)*puVar12;
      puVar12 = (uint *)((int)puVar12 + 1);
      uVar6 = (uint)bVar4;
      if (bVar4 < 0x81) goto LAB_1000_007f;
      if (bVar4 != 0x81) {
        return;
      }
    }
    else {
      cVar10 = '\0';
LAB_1000_0072:
      bVar14 = CARRY2(uVar11,uVar11);
      uVar11 = uVar11 * 2;
      iVar9 = iVar9 + -1;
      if (iVar9 == 0) {
        uVar11 = *puVar12;
        iVar9 = 0x10;
        puVar12 = puVar12 + 1;
      }
      uVar6 = (iVar7 + 1) * 2 + (uint)bVar14;
      if (uVar6 != 2) {
LAB_1000_007f:
        cVar10 = '\0';
        bVar14 = CARRY2(uVar11,uVar11);
        uVar11 = uVar11 * 2;
        iVar9 = iVar9 + -1;
        if (iVar9 == 0) {
          puVar1 = puVar12;
          puVar12 = puVar12 + 1;
          uVar11 = *puVar1;
          iVar9 = 0x10;
        }
        if (bVar14) {
          FUN_1000_0154();
          if (bVar14) {
            FUN_1000_0154();
            cVar5 = '\x04';
            cVar8 = '\x10';
            iVar9 = extraout_DX_02;
            if (bVar14) {
              FUN_1000_0154();
              cVar5 = '\x04';
              cVar8 = ' ';
              iVar9 = extraout_DX_03;
              if (bVar14) {
                FUN_1000_0154();
                cVar5 = '\x04';
                cVar8 = '0';
                iVar9 = extraout_DX_04;
                if (bVar14) {
                  cVar5 = '\x06';
                  cVar8 = '@';
                }
              }
            }
          }
          else {
            FUN_1000_0154();
            cVar5 = '\x02';
            cVar8 = '\x04';
            iVar9 = extraout_DX_01;
            if (bVar14) {
              cVar5 = '\x03';
              cVar8 = '\b';
            }
          }
LAB_1000_00ba:
          cVar10 = '\0';
          do {
            bVar14 = CARRY2(uVar11,uVar11);
            uVar11 = uVar11 * 2;
            iVar9 = iVar9 + -1;
            if (iVar9 == 0) {
              puVar1 = puVar12;
              puVar12 = puVar12 + 1;
              uVar11 = *puVar1;
              iVar9 = 0x10;
            }
            cVar10 = cVar10 * '\x02' + bVar14;
            cVar5 = cVar5 + -1;
          } while (cVar5 != '\0');
          cVar10 = cVar10 + cVar8;
        }
        else {
          bVar14 = CARRY2(uVar11,uVar11);
          uVar11 = uVar11 * 2;
          iVar9 = iVar9 + -1;
          if (iVar9 == 0) {
            puVar1 = puVar12;
            puVar12 = puVar12 + 1;
            uVar11 = *puVar1;
            iVar9 = 0x10;
          }
          if (bVar14) {
            cVar10 = '\x01';
            bVar14 = CARRY2(uVar11,uVar11);
            uVar11 = uVar11 * 2;
            iVar9 = iVar9 + -1;
            if (iVar9 == 0) {
              puVar1 = puVar12;
              puVar12 = puVar12 + 1;
              uVar11 = *puVar1;
              iVar9 = 0x10;
            }
            if (bVar14) {
              cVar5 = '\x01';
              cVar8 = '\x02';
              goto LAB_1000_00ba;
            }
          }
        }
      }
      puVar1 = puVar12;
      puVar12 = (uint *)((int)puVar12 + 1);
      in_BX = ~CONCAT11(cVar10,(byte)*puVar1);
      pbVar13 = unaff_DI + in_BX;
      for (; uVar6 != 0; uVar6 = uVar6 - 1) {
        pbVar3 = unaff_DI;
        unaff_DI = unaff_DI + 1;
        pbVar2 = pbVar13;
        pbVar13 = pbVar13 + 1;
        *pbVar3 = *pbVar2;
      }
    }
  } while( true );
}



/* ------------------------------------------------------------
 * FUN_1000_0154 @ 1000:0154
 * selected: address-order fallback
 * body bytes: 14
 * completed: true
 */

void __cdecl16near FUN_1000_0154(void)

{
  int in_DX;

  if (in_DX != 1) {
    return;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0162 @ 1000:0162
 * selected: address-order fallback
 * body bytes: 7
 * completed: true
 */

void __cdecl16near FUN_1000_0162(void)

{
  (*(code *)s_AppIcon_1350_0024._4_2_)();
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0169 @ 1000:0169
 * selected: address-order fallback
 * body bytes: 326
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */
/* WARNING: Instruction at (ram,0x100002c1) overlaps instruction at (ram,0x100002c0)
    */
/* WARNING: Removing unreachable block (ram,0x100002d5) */
/* WARNING: Removing unreachable block (ram,0x1000022d) */

undefined2 __cdecl16near FUN_1000_0169(void)

{
  byte *pbVar1;
  byte *pbVar2;
  uint *puVar3;
  undefined1 *puVar4;
  undefined1 *puVar5;
  int iVar6;
  code *pcVar7;
  byte bVar8;
  byte bVar9;
  undefined1 uVar10;
  int iVar11;
  uint uVar12;
  undefined1 extraout_AH;
  undefined2 uVar13;
  byte bVar14;
  char cVar15;
  int iVar16;
  int iVar17;
  int extraout_DX;
  byte *in_BX;
  uint uVar18;
  uint *puVar19;
  undefined1 *puVar20;
  undefined1 *puVar21;
  undefined2 unaff_SS;
  byte in_AF;
  bool bVar22;
  bool bVar23;
  bool bVar24;
  undefined1 in_XMM1 [16];
  undefined4 uVar25;
  undefined1 *puStack_12;
  int aiStack_10 [3];
  uint *puStack_a;

  puVar19 = (uint *)&stack0xfffe;
  puStack_a = (uint *)0x1c1;
  iVar11 = FUN_1000_0162();
  if (iVar11 == 0) {
    return 0;
  }
  while( true ) {
    puVar21 = (undefined1 *)0x9f1;
    puVar20 = (undefined1 *)0x873;
    for (iVar16 = 0x68d; iVar16 != 0; iVar16 = iVar16 + -1) {
      puVar5 = puVar21;
      puVar21 = puVar21 + -1;
      puVar4 = puVar20;
      puVar20 = puVar20 + -1;
      *puVar5 = *puVar4;
    }
    pbVar1 = puVar21 + 1;
    aiStack_10[2] = 0x1e4;
    puStack_a = puVar19;
    FUN_1000_0031();
    puVar19 = puStack_a;
    bVar14 = (byte)iVar16;
    *(uint *)0x9e0 = puStack_a[4];
    puStack_a = (uint *)0x1f5;
    uVar25 = FUN_1000_093d();
    in_BX[-0x70] = in_BX[-0x70] + 1;
    pbVar2 = in_BX;
    *pbVar2 = *pbVar2 >> 1 | *pbVar2 << 7;
    pbVar2 = pbVar1;
    bVar9 = *pbVar2;
    bVar8 = (byte)uVar25;
    *pbVar2 = *pbVar2 + bVar8;
    if (*pbVar2 != 0) {
      *(undefined2 *)0x906 = 0x7c7;
    }
    puVar3 = (uint *)0x4d8b;
    puVar20 = (undefined1 *)*puVar3;
    uVar12 = *puVar3;
    *puVar3 = (uVar12 - (int)&stack0xfffa) - (uint)CARRY1(bVar9,bVar8);
    uVar10 = (undefined1)((ulong)uVar25 >> 8);
    bVar9 = (bVar8 - 3) -
            (puVar20 < &stack0xfffa || uVar12 - (int)&stack0xfffa < (uint)CARRY1(bVar9,bVar8));
    if (bVar9 != 0) {
      uVar12 = CONCAT11(uVar10,bVar9 | in_BX[(int)pbVar1]);
      goto code_r0x10000236;
    }
    uVar12 = CONCAT11(uVar10,bVar9) + *(int *)(puVar21 + -0x38);
    *(int *)(byte *)((int)puVar19 + (int)pbVar1) = *(int *)(byte *)((int)puVar19 + (int)pbVar1) + 1;
    puVar20 = puVar21 + 0xb;
    uVar18 = *(uint *)0x9dc;
    do {
      if (uVar18 <= uVar12) {
        *(uint *)0x4904 = uVar12;
      }
      if (uVar18 == uVar12) {
        puStack_a = (uint *)in((int)((ulong)uVar25 >> 0x10));
        *puVar19 = *puVar19 | 0x3fe;
        *(int *)0xfe3f = *(int *)0xfe3f - uVar12;
        aiStack_10[2] = 0x1000;
        aiStack_10[1] = 0x264;
        FUN_1000_04c1();
        pbVar2 = (byte *)0x8c10;
        bVar9 = *pbVar2;
        *pbVar2 = *pbVar2 + bVar14;
        aiStack_10[1] = 0x9a72;
        aiStack_10[0] = *(int *)0x47e;
        puStack_12 = (undefined1 *)0x1010;
        puVar21 = (undefined1 *)((int)&puStack_12 + (uint)CARRY1(bVar9,bVar14) + extraout_DX);
        puVar19[0x1cb9] = puVar19[0x1cb9] | (uint)puVar20;
        uVar18 = uVar12 & 0xff00;
        bVar9 = false;
        bVar24 = (char)uVar12 < '\0';
        bVar23 = false;
        bVar22 = true;
        uVar10 = in(0x48);
        uVar12 = CONCAT11(extraout_AH,uVar10);
        iVar16 = iVar11;
        goto LAB_1000_0282;
      }
    } while (uVar18 >= uVar12);
    if (uVar18 < uVar12) break;
    iVar16 = *(int *)0xbff;
    puVar21[-0x42] = 0;
    out(1,(char)iVar16);
    iVar11 = iVar16;
  }
  *(char *)0xaa1 = *(char *)0xaa1 + (char)(uVar12 >> 8);
  *(char *)0x0 = *(char *)0x0 + (byte)uVar12;
  in_BX[(int)puVar20] = in_BX[(int)puVar20] | (byte)uVar12;
code_r0x10000236:
  *(int *)0x9de = uVar12 + 8;
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
LAB_1000_0282:
  do {
    iVar6 = aiStack_10[0];
  } while ((bool)bVar9 || bVar22);
  bVar8 = (byte)uVar12;
  if (bVar24 == bVar23) {
    *(char *)(puVar19 + 0x206c) = (char)puVar19[0x206c] + -1;
    puVar20[uVar18 + 0x5a] = puVar20[uVar18 + 0x5a] + '\x01';
    *(uint *)0x9d8 = uVar12;
    *(uint *)0x9bda = (uint)puVar21;
    in_AF = 9 < (bVar8 % 0 & 0xf) | in_AF;
    uVar12 = CONCAT11(bVar8 / 0 - in_AF,bVar8 % 0 + in_AF * -6) & 0xff0f | 0x48e8;
    bVar9 = (byte)uVar12;
    iVar11 = *(int *)(uVar18 + 0x3973) + (uint)(0xf3 < bVar9);
    *(byte *)0x3926 = *(byte *)0x3926 | 0xa1;
    uVar18 = uVar18 + 1 | (int)puVar19 - 1U;
    if (iVar11 != 0 && uVar18 != 0) {
      return CONCAT11((char)(uVar12 >> 8),bVar9 + 0x8c);
    }
    if ((int)uVar18 < 0) {
      puVar20 = puVar20 + 1;
    }
    puVar20[0x16d8] = puVar20[0x16d8] + (char)iVar11;
    puStack_12 = (undefined1 *)0x33a;
    uVar13 = FUN_1000_074f();
    return uVar13;
  }
  if ((POPCOUNT(0x3972U - *(int *)(uVar18 + 0x7c) & 0xff) & 1U) != 0) goto code_r0x1000028e;
  goto LAB_1000_0292;
code_r0x1000028e:
  bVar9 = false;
  bVar24 = false;
  bVar23 = false;
  bVar22 = (uVar12 & 4) == 0;
  if (bVar22) {
LAB_1000_0292:
    iVar17 = 1;
    puVar21 = (undefined1 *)((uint)puVar21 | *(uint *)0x1a74);
    if ((uVar12 & 1) != 0) {
      *(char *)0x3972 = *(char *)0x3972 + '\x01';
      if (*(int *)(puVar20 + 6) == 0x3972) {
        iVar16 = *(int *)((undefined1 *)((int)puVar19 + (int)puVar20) + 0x51);
      }
      else {
        cVar15 = (char)-*(int *)(uVar18 + 0x3972) << 1;
        puStack_12 = (undefined1 *)CONCAT11((char)((uint)-*(int *)(uVar18 + 0x3972) >> 8),cVar15);
        if (cVar15 != '\0') {
          *(char *)(puVar19 + -0x3ae5) = (char)puVar19[-0x3ae5];
          puStack_12 = (undefined1 *)aiStack_10;
          puVar20[uVar18 + 4] = puVar20[uVar18 + 4];
          uVar12 = uRam100012ab;
          *(int *)0x393c = *(int *)0x393c + (int)puVar19;
          if ((POPCOUNT((byte)uVar12 & 0x4f) & 1U) != 0) {
                    /* WARNING: Bad instruction - Truncating control flow here */
            halt_baddata();
          }
          iVar6 = *(int *)((int)puVar19 + (int)puVar20);
          *(undefined1 *)0x3974 = *puVar20;
          *(undefined1 *)((int)puVar19 + (int)(puVar20 + 1)) = -1 < iVar6;
          if (iVar6 == 0) {
            puVar3 = (uint *)((undefined1 *)((int)puVar19 + (int)(puVar20 + 1)) + -0x4bb3);
            *puVar3 = *puVar3 | uVar12 & 0xff4f;
            *(char *)((int)puVar19 + 0x3983) = *(char *)((int)puVar19 + 0x3983) + '9';
            pcVar7 = (code *)swi(3);
            uVar13 = (*pcVar7)(0,2);
            return uVar13;
          }
                    /* WARNING: Bad instruction - Truncating control flow here */
          halt_baddata();
        }
        in_XMM1 = sqrtps(in_XMM1,*(undefined1 (*) [16])(uVar18 + 0x3900));
      }
      uVar12 = CONCAT11((char)(uVar12 >> 8),bVar8 + *(char *)((int)puVar19 + (int)puVar20));
      aiStack_10[0] = -0x95c;
      iVar17 = iVar6;
      puVar21 = puStack_12;
    }
    bVar9 = 9 < ((byte)uVar12 & 0xf) | in_AF;
    puVar4 = puVar20;
    puVar20 = puVar20 + 1;
    uVar12 = CONCAT11((char)(uVar12 >> 8) - bVar9,*puVar4);
    bVar24 = SCARRY2(iVar17,1);
    bVar23 = iVar17 + 1 < 0;
    bVar22 = iVar17 == -1;
    in_AF = bVar9;
  }
  goto LAB_1000_0282;
}



/* ------------------------------------------------------------
 * FUN_1000_04c1 @ 1000:04c1
 * selected: address-order fallback
 * body bytes: 101
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */
/* WARNING: Instruction at (ram,0x10000515) overlaps instruction at (ram,0x10000513)
    */
/* WARNING: Removing unreachable block (ram,0x1000056d) */
/* WARNING: Removing unreachable block (ram,0x10000586) */
/* WARNING: Removing unreachable block (ram,0x10000515) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_1000_04c1(int param_1)

{
  byte *pbVar1;
  uint *puVar2;
  byte bVar3;
  byte bVar4;
  int in_AX;
  int iVar5;
  undefined2 uVar6;
  int in_CX;
  char *in_BX;
  int iVar7;
  int unaff_BP;
  uint *unaff_SI;
  undefined2 *puVar8;
  int unaff_DI;
  undefined2 unaff_SS;
  uint in_stack_00000000;

  bVar3 = *(byte *)(unaff_BP + (int)unaff_SI);
  bVar4 = (byte)in_AX;
  if (bVar3 == bVar4) {
    *in_BX = *in_BX + (char)in_CX + (bVar3 < bVar4);
    return;
  }
  if ((char)bVar4 < (char)bVar3) {
    unaff_SI = (uint *)((int)unaff_SI + -1);
  }
  iVar5 = in_AX + -0x29b + (uint)(bVar3 < bVar4);
  bVar4 = (byte)iVar5;
  *unaff_SI = *unaff_SI | (uint)&param_1;
  *(int *)(unaff_DI + 0x4200) = *(int *)(unaff_DI + 0x4200) + in_CX;
  puVar8 = (undefined2 *)((uint)unaff_SI | *(uint *)((int)unaff_SI + unaff_BP + 0x4e));
  iVar7 = CONCAT11((char)(in_stack_00000000 >> 8) + '\x01',(char)in_stack_00000000);
  pbVar1 = (byte *)((int)puVar8 + iVar7 + 1);
  bVar3 = *pbVar1;
  *(undefined2 *)(unaff_BP + -8) = CONCAT11((char)((uint)iVar5 >> 8),bVar4 + *pbVar1);
  uVar6 = *puVar8;
  if (CARRY1(bVar4,bVar3) || puVar8 == (undefined2 *)0x0) {
                    /* WARNING: Bad instruction - Truncating control flow here */
    halt_baddata();
  }
  puVar2 = (uint *)(iVar7 + param_1 + -0x5c);
  iVar5 = (in_stack_00000000 & 3) - (*puVar2 & 3);
  *puVar2 = *puVar2 + (uint)(0 < iVar5) * iVar5;
  _DAT_1350_9a9f = uVar6;
  uVar6 = in(0xb6);
  DAT_1350_b309 = (char)uVar6;
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_074f @ 1000:074f
 * selected: address-order fallback
 * body bytes: 26
 * completed: true
 */

void FUN_1000_074f(void)

{
  undefined2 uVar1;
  char in_DL;
  int in_BX;
  int unaff_SI;
  undefined2 *unaff_DI;
  undefined2 unaff_ES;

  uVar1 = in(CONCAT11(0x70,in_DL + '\x01'));
  *unaff_DI = uVar1;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + '\x01';
                    /* WARNING: Could not recover jumptable at 0x10000765. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  (*(code *)(ulong)(uint)unaff_DI[-0xde6])();
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_093d @ 1000:093d
 * selected: address-order fallback
 * body bytes: 34
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */

void FUN_1000_093d(void)

{
  char in_AL;
  int in_BX;
  int unaff_SI;

  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
  *(char *)(in_BX + unaff_SI) = *(char *)(in_BX + unaff_SI) + in_AL;
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}



/* ------------------------------------------------------------
 * FUN_1038_0049 @ 1038:0049
 * selected: address-order fallback
 * body bytes: 3
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */

void FUN_1038_0049(void)

{
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}



/* ------------------------------------------------------------
 * FUN_1050_0096 @ 1050:0096
 * selected: address-order fallback
 * body bytes: 59
 * completed: true
 */

/* WARNING: Removing unreachable block (ram,0x105000cb) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void __stdcall16far FUN_1050_0096(void)

{
  byte in_CL;
  undefined2 *in_BX;
  int unaff_SI;
  int iVar1;
  int iVar2;
  undefined2 unaff_SS;

  (*(code *)*in_BX)();
  iVar2 = 0;
  if (unaff_SI + -1 != 0) {
    iVar2 = 1;
    iVar1 = unaff_SI + -1 >> 1;
    if (iVar1 != 0) goto LAB_1050_00bf;
  }
  iVar1 = ((-_DAT_1350_7fff - (uint)(in_CL & 1)) - *(int *)(&stack0xfffe + iVar2)) -
          (uint)(_DAT_1350_7fff != 0 || (uint)-_DAT_1350_7fff < (uint)(in_CL & 1));
LAB_1050_00bf:
  do {
    *(uint *)(iVar1 + -0x3c01) = *(uint *)(iVar1 + -0x3c01) | 2;
  } while( true );
}



/* ------------------------------------------------------------
 * FUN_10a8_004d @ 10a8:004d
 * selected: address-order fallback
 * body bytes: 9
 * completed: true
 */

void FUN_10a8_004d(void)

{
  code *pcVar1;

  pcVar1 = (code *)swi(1);
  (*pcVar1)();
  return;
}



/* ------------------------------------------------------------
 * FUN_10c0_0066 @ 10c0:0066
 * selected: address-order fallback
 * body bytes: 10
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */

void FUN_10c0_0066(void)

{
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}



/* ------------------------------------------------------------
 * FUN_10f8_0155 @ 10f8:0155
 * selected: address-order fallback
 * body bytes: 194
 * completed: true
 */

/* WARNING: Instruction at (ram,0x10f801c5) overlaps instruction at (ram,0x10f801c4)
    */
/* WARNING: Removing unreachable block (ram,0x10f801a5) */

uint __cdecl16far FUN_10f8_0155(void)

{
  uint *puVar1;
  byte *pbVar2;
  char *pcVar3;
  uint uVar4;
  char cVar6;
  int iVar7;
  undefined4 uVar8;
  byte bVar9;
  char cVar10;
  uint uVar11;
  byte bVar12;
  byte in_CL;
  char in_CH;
  uint uVar13;
  int in_BX;
  byte *pbVar14;
  undefined1 *puVar15;
  undefined1 *puVar16;
  char *unaff_SI;
  uint *puVar17;
  char *unaff_DI;
  char *pcVar18;
  char *pcVar19;
  undefined2 unaff_ES;
  uint unaff_SS;
  undefined2 uVar20;
  bool bVar21;
  byte in_AF;
  undefined1 in_XMM2 [16];
  undefined4 uVar22;
  uint uVar5;

  uVar20 = 0x1350;
  uVar22 = func_0x04122600();
  uVar13 = (uint)((ulong)uVar22 >> 0x10);
  puVar16 = &stack0xfffe +
            (uint)((byte)unaff_SI[in_BX] < (byte)((uint)in_BX >> 8)) +
            *(int *)(unaff_SI + in_BX + -0x18);
  uVar11 = (int)uVar22 + *(int *)(unaff_DI + in_BX + 0xc26);
  bVar21 = CARRY2(DAT_1350_3f1e,uVar13);
  DAT_1350_3f1e = DAT_1350_3f1e + uVar13;
  uVar11 = CONCAT11((char)(uVar11 >> 8),*(undefined1 *)(ulong)(in_BX + (uVar11 & 0xff))) + 0x7e83 +
           (uint)bVar21;
  bVar9 = (byte)uVar11;
  if (bVar9 != 0) {
    unaff_SI[in_BX] = unaff_SI[in_BX] | bVar9;
    in_AF = (unaff_SS & 0x10) != 0;
    in_BX = in_BX - *(int *)(puVar16 + (int)unaff_SI + 0x3510);
  }
  else {
    uVar8 = *(undefined4 *)(puVar16 + 8);
    unaff_ES = (undefined2)((ulong)uVar8 >> 0x10);
    in_BX = (int)uVar8;
    uVar11 = (uVar11 & 0xff23) + 8;
    unaff_SI[in_BX] = unaff_SI[in_BX] - in_CL;
    pbVar2 = (byte *)(unaff_DI + -0x65d5);
    bVar12 = *pbVar2;
    *pbVar2 = *pbVar2 + (byte)uVar8;
    *unaff_DI = *unaff_DI + (char)((ulong)uVar22 >> 0x18) + CARRY1(bVar12,(byte)uVar8);
  }
  bVar21 = bVar9 != 0 && (unaff_SS & 0x400) != 0;
  pbVar14 = (byte *)(in_BX + -1);
  pcVar18 = unaff_DI + (uint)bVar21 * -2 + 1;
  puVar17 = (uint *)(unaff_SI + (uint)bVar21 * -2 + 1);
  *unaff_DI = *unaff_SI;
  rsqrtps(in_XMM2,*(undefined1 (*) [16])(puVar16 + (int)pcVar18));
  bVar21 = CARRY2((uint)DAT_1350_660a,(uint)&stack0xffee);
  DAT_1350_660a = &stack0xffee + (int)DAT_1350_660a;
  bVar9 = (byte)(uVar11 & 0x250e);
  in_AF = 9 < bVar9 | in_AF;
  bVar12 = (byte)((uVar11 & 0x250e) >> 8);
  bVar9 = bVar9 + in_AF * '\x06' + (0x99 < bVar9 || bVar21) * '`';
  do {
    bVar9 = bVar9 | (puVar16 + (int)pcVar18)[-0x80];
    in_AF = 9 < (bVar9 & 0xf) | in_AF;
    cVar10 = bVar9 + in_AF * '\x06' + (0x99 < bVar9) * '`';
    puVar15 = (undefined1 *)((uint)puVar16 | *(uint *)(pbVar14 + (int)puVar17));
    pcVar3 = pcVar18;
    cVar6 = *pcVar3;
    *pcVar3 = *pcVar3 << 1;
    bVar9 = cVar10 + 0x74;
    iVar7 = *(int *)(pbVar14 + (int)puVar17);
    (pbVar14 + (int)(pcVar18 + -1))[-0x7668] = (pbVar14 + (int)(pcVar18 + -1))[-0x7668] | in_CL;
    puVar17 = (uint *)*(uint **)(puVar15 + -6);
    *(uint *)(puVar15 + -0x7620) =
         *(uint *)(puVar15 + -0x7620) ^
         CONCAT11(bVar12,bVar9 + (cVar6 < '\0') + in_CL +
                         (0xfd < (byte)(cVar10 + 0x72U) || CARRY1(bVar9,cVar6 < '\0'))) - iVar7 &
         0xff8bU;
    pcVar19 = pcVar18 + -1;
    uVar11 = unaff_SS;
    while( true ) {
      uVar20 = (undefined2)((ulong)*(char **)(puVar15 + (int)pcVar19 + 0x10) >> 0x10);
      pcVar18 = (char *)*(char **)(puVar15 + (int)pcVar19 + 0x10);
      puVar15[0x1f] = puVar15[0x1f] + (char)pbVar14;
      *puVar17 = *puVar17 & 0x14;
      bVar9 = *(byte *)0x2028;
      *(undefined2 *)(puVar15 + -8) = 2;
      unaff_SS = 0x412;
      in_AF = 9 < (bVar9 & 0xf) | in_AF;
      bVar9 = bVar9 + in_AF * -6 & 0xf;
      bVar12 = (char)((uint)pcVar19 >> 8) - in_AF;
      pbVar14[(int)puVar17] = pbVar14[(int)puVar17] + in_CH;
      uVar11 = 0x412;
      uVar13 = uVar13 - 1;
      in_CL = in_CL & puVar15[(int)puVar17] | pbVar14[(int)puVar17];
      puVar16 = puVar15 + 1;
      if ((int)puVar16 < 0) break;
      (puVar16 + (int)pcVar18)[-8] = (puVar16 + (int)pcVar18)[-8] - bVar12;
      puVar1 = (uint *)(puVar15 + 0x32f9);
      uVar4 = *puVar1;
      uVar5 = *puVar1;
      *puVar1 = (uint)(pcVar18 + *puVar1);
      if (SCARRY2(uVar5,(int)pcVar18) == (int)*puVar1 < 0) {
        *pcVar18 = -1;
        return CONCAT11(bVar12,0xff) | 0x2ac8;
      }
      *puVar17 = CONCAT11(0xff,bVar12);
      *(uint *)(puVar16 + (int)puVar17 + 0xd) =
           *(int *)(puVar16 + (int)puVar17 + 0xd) + uVar13 + (uint)CARRY2(uVar4,(uint)pcVar18);
      *pbVar14 = *pbVar14 | bVar12;
      puVar15 = puVar16;
      pcVar19 = pcVar18;
    }
    bVar12 = bVar12 | puVar15[0x28];
  } while( true );
}



/* ------------------------------------------------------------
 * FUN_1100_0084 @ 1100:0084
 * selected: address-order fallback
 * body bytes: 330
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */

void FUN_1100_0084(void)

{
  undefined1 *puVar1;
  char *pcVar2;
  byte *pbVar3;
  byte bVar4;
  byte *pbVar7;
  undefined4 uVar8;
  uint uVar9;
  byte bVar10;
  uint uVar11;
  byte bVar12;
  byte bVar14;
  byte *pbVar15;
  undefined2 uVar16;
  int iVar17;
  byte bVar18;
  uint in_CX;
  byte bVar19;
  long in_EDX;
  byte bVar20;
  int in_BX;
  byte bVar23;
  byte *pbVar21;
  uint uVar22;
  undefined2 *unaff_SI;
  byte *pbVar25;
  byte *pbVar26;
  int unaff_DI;
  byte *pbVar27;
  undefined2 unaff_ES;
  undefined2 unaff_SS;
  undefined2 in_FS;
  bool bVar28;
  bool bVar29;
  bool bVar30;
  bool in_ZF;
  byte in_TF;
  byte in_NT;
  byte in_stack_0000c2ce;
  undefined3 in_stack_0000c2d0;
  undefined2 uStack_8;
  byte bVar5;
  byte bVar6;
  byte bVar13;
  char cVar24;

  bVar18 = (byte)in_CX;
  if ((in_CX == 0) && (!in_ZF)) {
    puVar1 = (undefined1 *)(((uint)&stack0xfffe | *(uint *)(&stack0x320f + (int)unaff_SI)) - 1);
    *puVar1 = *puVar1;
    return;
  }
  iVar17 = *(int *)(in_BX + unaff_DI + 0xb);
  bVar23 = (byte)((uint)in_BX >> 8);
  uVar22 = CONCAT11((char)((uint)((int)unaff_SI + -1) >> 8),(byte)((int)unaff_SI + -1) ^ bVar23) &
           0xfffe;
  bVar20 = (char)in_BX + (char)(in_CX >> 8);
  pcVar2 = (char *)CONCAT11(bVar23,bVar20);
  bVar14 = (byte)((ulong)in_EDX >> 8);
  *pcVar2 = (*pcVar2 - bVar14) - (0xa165 < CONCAT11((char)(uVar22 >> 8),(char)uVar22 + ']'));
  uStack_8 = &stack0xfffe;
  pcVar2 = (char *)CONCAT11(bVar23,bVar20) + -0x1d;
  *pcVar2 = *pcVar2 + (char)in_EDX;
  pbVar7 = (byte *)*unaff_SI;
  bVar30 = ((uint)pbVar7 & 0x1000) != 0;
  (&stack0x003f)[iVar17] = (&stack0x003f)[iVar17] + '\x01';
  cVar24 = bVar23 + bVar14 + (((uint)pbVar7 & 0x100) != 0);
  pbVar21 = (byte *)CONCAT11(cVar24,bVar20);
  pbVar25 = (byte *)((int)unaff_SI + 1);
  pbVar3 = pbVar21 + (int)pbVar25;
  *(byte **)pbVar3 = pbVar7 + *(int *)pbVar3;
  pbVar15 = pbVar7;
  if (*(int *)pbVar3 != 0) {
    pbVar15 = (byte *)&DAT_1350_380a;
  }
  bVar28 = CARRY2(iVar17 - 1,*(uint *)(pbVar21 + (int)pbVar25 + 0x3e31));
  pbVar3 = pbVar21;
  bVar4 = *pbVar3;
  bVar23 = *pbVar3;
  bVar10 = *pbVar3 - bVar20;
  *pbVar3 = bVar10 - bVar28;
  bVar5 = *pbVar3;
  bVar6 = *pbVar3;
  bVar19 = *pbVar3;
  uVar22 = (uint)bVar30;
  pbVar21[-2] = pbVar21[-2] + bVar18;
  if (pbVar15 == (byte *)0x0) {
    in(0);
    uVar16 = func_0x46aa001e();
    *(int *)(byte *)((int)&uStack_8 + (int)pbVar25) =
         *(int *)(byte *)((int)&uStack_8 + (int)pbVar25) + 1;
    bVar18 = ((byte)uVar16 | 0xf1) - 3;
    *(uint *)(pbVar21 + 0xece) = CONCAT11((char)((uint)uVar16 >> 8),bVar18);
    uVar9 = (uint)(bVar18 < 0x26);
    uVar22 = *(uint *)(pbVar21 + (int)pbVar25 + 0x679);
    pbVar7 = pbVar21 + *(uint *)(pbVar21 + (int)pbVar25 + 0x679);
    *(undefined2 *)0x15 = in_FS;
                    /* WARNING: Could not recover jumptable at 0x11000106. Too many branches */
                    /* WARNING: Treating indirect jump as call */
    (**(code **)(&stack0x0014 +
                (CARRY2((uint)(pbVar7 + uVar9),(uint)pbVar25) ||
                CARRY2((uint)(pbVar7 + uVar9 + (int)pbVar25),
                       (uint)(CARRY2((uint)pbVar21,uVar22) || CARRY2((uint)pbVar7,uVar9))))))();
    return;
  }
  uVar9 = *(uint *)(&stack0x0876 + (int)pbVar15);
  uVar11 = uVar9 - in_CX;
  iVar17 = CONCAT11(((int)uVar11 < 0) << 7 | (uVar11 == 0) << 6 | bVar30 << 4 |
                    ((POPCOUNT(uVar11 & 0xff) & 1U) == 0) << 2 | 2U | uVar9 < in_CX,(char)pbVar15) +
           0x7bde + (uint)(uVar9 < in_CX);
  bVar13 = (byte)iVar17;
  bVar12 = bVar13 - 9;
  uVar16 = CONCAT11((char)((uint)iVar17 >> 8),bVar12);
  pbVar27 = pbVar15 + 1;
  *pbVar15 = bVar12;
  *(uint *)(pbVar27 + (int)&uStack_8 + 1) =
       *(int *)(pbVar27 + (int)&uStack_8 + 1) + (int)in_EDX + (uint)(bVar13 < 9);
  bVar29 = (byte)(&stack0x6695)[(int)pbVar25] < bVar18;
  pbVar26 = pbVar25;
  if ((char)bVar18 <= (char)(&stack0x6695)[(int)pbVar25]) {
    if (in_CX != 1) {
      *(uint *)((int)unaff_SI + -0xf) = *(uint *)((int)unaff_SI + -0xf) | (uint)pbVar27;
      (&stack0x000d)[(int)pbVar27] = (&stack0x000d)[(int)pbVar27] + '\x01';
                    /* WARNING: Bad instruction - Truncating control flow here */
      halt_baddata();
    }
    uVar8 = *(undefined4 *)pbVar21;
    *(uint *)(pbVar21 + (int)pbVar25 + -2) = *(uint *)(pbVar21 + (int)pbVar25 + -2) | 0x3f;
    *(char *)((int)unaff_SI + 0xb) =
         *(char *)((int)unaff_SI + 0xb) + (bVar14 | (byte)((ulong)uVar8 >> 8));
    bVar30 = 9 < ((bVar20 ^ 0x15) & 0xf) || bVar30;
    bVar29 = cVar24 < '\0';
    unaff_ES = (undefined2)((ulong)DAT_1350_2606 >> 0x10);
    *(undefined2 *)DAT_1350_2606 = 1;
    in_EDX = (ulong)in_stack_0000c2ce << 8;
    DAT_1350_850f = DAT_1350_850f + '\x01';
    LOCK();
    uVar16 = *(undefined2 *)(pbVar7 + (int)pbVar15);
    *(int *)(pbVar7 + (int)pbVar15) = (int)((uint3)in_stack_0000c2d0 >> 8);
    UNLOCK();
    *(undefined2 *)
     (((uint)(in_NT & 1) * 0x4000 |
       (uint)(SBORROW1(bVar23,bVar20) != SBORROW1(bVar10,bVar28)) * 0x800 |
       (uint)(in_TF & 1) * 0x100 | (uint)((char)bVar5 < '\0') * 0x80 | (uint)(bVar6 == 0) * 0x40 |
       uVar22 * 0x10 | (uint)((POPCOUNT(bVar19) & 1U) == 0) * 4 |
      (uint)(bVar4 < bVar20 || bVar10 < bVar28)) - 2) = 0x9a23;
    pbVar21 = pbVar7;
    pbVar26 = pbVar15;
    pbVar27 = pbVar25;
  }
  bVar14 = ((char)uVar16 - pbVar27[-0xbfe]) - bVar29;
  bVar18 = 9 < (bVar14 & 0xf) | bVar30;
  bVar20 = (char)((uint)uVar16 >> 8) - bVar18;
  if (&stack0x0000 != (undefined1 *)0x3d2e) {
    *pbVar21 = *pbVar21 + (char)((uint)pbVar21 >> 8) + bVar18;
                    /* WARNING: Bad instruction - Truncating control flow here */
    halt_baddata();
  }
  uVar22 = (uint)pbVar21 & *(uint *)(pbVar21 + (int)pbVar26 + -0x489b);
  pbVar3 = pbVar27 + uVar22 + 0x68b1;
  bVar23 = *pbVar3;
  bVar19 = (byte)((ulong)in_EDX >> 8);
  *pbVar3 = *pbVar3 + bVar19;
  pbVar27[uVar22] = (pbVar27[uVar22] - bVar19) - CARRY1(bVar23,bVar19);
  bVar14 = (bVar14 + bVar18 * -6 & 0xf) + (char)(uVar22 >> 8);
  (pbVar26 + 0x12)[0] = 0xe4;
  (pbVar26 + 0x12)[1] = 0xe1;
  bVar30 = CARRY1(DAT_1350_44c6,bVar20);
  DAT_1350_44c6 = DAT_1350_44c6 + bVar20;
  bVar18 = bVar14 + 0x5a;
  iVar17 = (CONCAT11(bVar20,bVar18 + bVar30) - (uint)(0xa5 < bVar14 || CARRY1(bVar18,bVar30))) +
           -0x3a1e;
  *(uint *)pbVar27 = (*(int *)pbVar27 - iVar17) - (uint)((byte)iVar17 < 0xba);
  pbVar26[-0x13] = pbVar26[-0x13] + 1;
                    /* WARNING: Could not recover jumptable at 0x110002e4. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  (**(code **)pbVar26)();
  return;
}



/* ------------------------------------------------------------
 * FUN_1120_002b @ 1120:002b
 * selected: address-order fallback
 * body bytes: 28
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */

void FUN_1120_002b(void)

{
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}



/* ------------------------------------------------------------
 * FUN_1238_0408 @ 1238:0408
 * selected: address-order fallback
 * body bytes: 9
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */

void FUN_1238_0408(void)

{
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}



/* ------------------------------------------------------------
 * FUN_12c0_0041 @ 12c0:0041
 * selected: address-order fallback
 * body bytes: 25
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */

void FUN_12c0_0041(void)

{
  char in_CL;
  undefined2 unaff_SS;
  char in_CF;
  int in_stack_0000000c;

  (&stack0xfffe)[in_stack_0000000c] = ((&stack0xfffe)[in_stack_0000000c] - in_CL) - in_CF;
  func_0x0060012a();
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}



/* ------------------------------------------------------------
 * FUN_12d0_0060 @ 12d0:0060
 * selected: address-order fallback
 * body bytes: 31
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */

void FUN_12d0_0060(void)

{
  byte in_CL;
  uint *unaff_SI;
  char *unaff_DI;
  char in_CF;

  *unaff_DI = (*unaff_DI + '<') - in_CF;
  DAT_1350_3938 = (in_CL & 3) + 0x81;
  *unaff_SI = *unaff_SI | 0xb;
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}
