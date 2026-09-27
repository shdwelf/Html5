
/* PLT thunks referenced (addr -> libc symbol):
 *   func_0x000056f0 = __snprintf_chk
 *   func_0x00005710 = strncpy
 *   func_0x00005730 = strlen
 *   func_0x00005738 = __stack_chk_fail
 *   func_0x00005750 = memcmp
 *   func_0x00005758 = strcmp
 *   func_0x00005760 = __memcpy_chk
 *   func_0x00005788 = __printf_chk
 */
/* ==== 0x6d90  (x86:LE:64:default, gcc, 298 ms) ==== */
/* WARNING: Possible PIC construction at 0x0000718d: Changing call to branch */
/* WARNING: Removing unreachable block (ram,0x00007192) */

xunknown8 0x6d90(uint4 *param_1,int8 param_2,uint4 param_3,xunknown8 param_4,int8 *param_5)

{
  int8 iVar1;
  int8 iVar2;
  int4 *piVar3;
  int4 iVar4;
  int4 iVar5;
  xunknown8 xVar6;
  uint8 uVar7;
  uint8 uVar8;
  uint4 *puVar9;
  uint4 *puVar10;
  xunknown4 xVar11;
  xunknown8 *pxVar12;
  uint4 uVar13;
  xunknown8 *pxVar14;
  xunknown8 *extraout_RDX;
  uint4 uVar15;
  uint8 unaff_RBX;
  uint4 *puVar16;
  uint4 *puVar17;
  uint4 *unaff_RBP;
  int4 *piVar18;
  xunknown1 *pxVar19;
  int4 *piVar20;
  int8 unaff_R12;
  int8 *piVar21;
  int8 *unaff_R13;
  xunknown8 unaff_R14;
  xunknown8 unaff_R15;
  int8 in_FS_OFFSET;
  xunknown8 axStack_f0 [2];
  xunknown8 *pxStack_e0;
  xunknown1 *pxStack_d8;
  int4 *piStack_d0;
  int8 *piStack_c8;
  uint4 auStack_c0 [8];
  int8 aiStack_a0 [2];
  xunknown1 xStack_8c;
  int8 iStack_78;
  uint8 uStack_68;
  xunknown1 *pxStack_60;
  int8 iStack_58;
  int8 *piStack_50;
  uint4 uStack_48;
  uint2 uStack_44;
  uint2 uStack_42;
  uint2 uStack_40;
  int8 iStack_30;
  
  param_3 = param_3 >> 3;
  iStack_30 = *(int8 *)(in_FS_OFFSET + 0x28);
  if (param_3 != 0) {
    unaff_R13 = (int8 *)(uint8)param_3;
    unaff_RBX = 0;
    do {
      iVar5 = (int4)param_1;
      unaff_R12 = param_2;
      if (iVar5 == 2) goto code_r0x00006e7c;
      if (iVar5 == 3) goto code_r0x00006e10;
      if (iVar5 == 1) goto code_r0x00006ef3;
      uVar15 = (int4)unaff_RBX + 1;
      unaff_RBX = (uint8)uVar15;
    } while (uVar15 < param_3);
  }
code_r0x00006dd8:
  if (iStack_30 == *(int8 *)(in_FS_OFFSET + 0x28)) {
    return 0;
  }
  piStack_50 = (int8 *)0x6f4d;
  func_0x00005738();
  piStack_50 = unaff_R13;
  iStack_58 = unaff_R12;
  pxStack_60 = (xunknown1 *)unaff_RBP;
  uStack_68 = unaff_RBX;
  puVar17 = auStack_c0;
  puVar16 = auStack_c0;
  iStack_78 = *(int8 *)(in_FS_OFFSET + 0x28);
  if ((*(uint1 *)((int8)param_1 + 0x20) & 2) == 0) {
    piStack_c8 = (int8 *)0x70eb;
    func_0x00005788(1,0x8016);
  }
  else {
    piStack_c8 = (int8 *)0x6f88;
    func_0x00005788(1,0x8010);
  }
  piVar3 = *(int4 **)param_1;
  piStack_c8 = (int8 *)0x6f93;
  uVar8 = func_0x00005730(piVar3);
  if (uVar8 < 0x15) {
    piStack_c8 = (int8 *)0x70cf;
    func_0x00005760(auStack_c0,piVar3,uVar8 + 1,0x1e);
  }
  else {
    unaff_R13 = aiStack_a0;
    piStack_c8 = (int8 *)0x6fb5;
    func_0x00005710(unaff_R13,piVar3,0x14);
    param_5 = (int8 *)0x8021;
    xStack_8c = 0;
    piStack_c8 = (int8 *)0x6fdd;
    func_0x000056f0(auStack_c0,0x1e,1,0x1e,0x8021,unaff_R13);
  }
  piStack_c8 = (int8 *)0x6ff3;
  func_0x00005788(1,0x8026,auStack_c0);
  puVar9 = auStack_c0;
  do {
    puVar10 = puVar9;
    uVar13 = *puVar10 + 0xfefefeff & ~*puVar10;
    uVar15 = uVar13 & 0x80808080;
    puVar9 = puVar10 + 1;
  } while (uVar15 == 0);
  if ((uVar13 & 0x8080) == 0) {
    puVar9 = (uint4 *)((int8)puVar10 + 6);
    uVar15 = uVar15 >> 0x10;
  }
  uVar8 = (int8)puVar9 + ((-3 - (uint8)CARRY1((uint1)uVar15,(uint1)uVar15)) - (int8)auStack_c0);
  if (uVar8 < 8) {
    piStack_c8 = (int8 *)0x7103;
    func_0x00005788(1,0x8014);
    puVar9 = auStack_c0;
    do {
      puVar10 = puVar9;
      uVar13 = *puVar10 + 0xfefefeff & ~*puVar10;
      uVar15 = uVar13 & 0x80808080;
      puVar9 = puVar10 + 1;
    } while (uVar15 == 0);
    if ((uVar13 & 0x8080) == 0) {
      puVar9 = (uint4 *)((int8)puVar10 + 6);
      uVar15 = uVar15 >> 0x10;
    }
    uVar8 = (int8)puVar9 + ((-3 - (uint8)CARRY1((uint1)uVar15,(uint1)uVar15)) - (int8)auStack_c0);
  }
  pxVar12 = (xunknown8 *)((int8)puVar10 + 6);
  if (uVar8 < 0x10) {
    piStack_c8 = (int8 *)0x7163;
    func_0x00005788(1,0x8014);
  }
  piStack_c8 = (int8 *)0x705b;
  func_0x00005788(1,0x8026,*(xunknown8 *)((int8)param_1 + 8));
  piStack_c8 = (int8 *)0x7064;
  uVar8 = func_0x00005730(*(xunknown8 *)((int8)param_1 + 8));
  if (uVar8 < 8) {
    piStack_c8 = (int8 *)0x707d;
    func_0x00005788(1,0x8014);
  }
  piVar18 = (int4 *)0x7fe0;
  pxVar19 = (xunknown1 *)0x1;
  piStack_c8 = (int8 *)0x7094;
  func_0x00005788(1,0x7fe0,*(xunknown8 *)((int8)param_1 + 0x10));
  if (iStack_78 != *(int8 *)(in_FS_OFFSET + 0x28)) {
    piStack_c8 = (int8 *)0x716d;
    func_0x00005738();
    if (extraout_RDX == (xunknown8 *)0x0) {
      if (pxVar12 == (xunknown8 *)0x0) {
        return 1;
      }
      xVar11 = 1;
      pxVar14 = pxVar12;
      pxVar12 = (xunknown8 *)param_1;
      piVar20 = piVar3;
      piVar21 = unaff_R13;
    }
    else {
      xVar11 = 0;
      puVar16 = (uint4 *)axStack_f0;
      axStack_f0[0] = 0x7192;
      pxVar14 = extraout_RDX;
      puVar17 = (uint4 *)pxVar19;
      piVar20 = piVar18;
      piVar21 = param_5;
    }
    pxStack_e0 = (xunknown8 *)param_1;
    pxStack_d8 = (xunknown1 *)auStack_c0;
    piStack_d0 = piVar3;
    piStack_c8 = unaff_R13;
    *(xunknown8 *)((int8)puVar16 + -8) = unaff_R15;
    *(xunknown8 *)((int8)puVar16 + -0x10) = unaff_R14;
    *(int8 **)((int8)puVar16 + -0x18) = piVar21;
    *(int4 **)((int8)puVar16 + -0x20) = piVar20;
    *(uint4 **)((int8)puVar16 + -0x28) = puVar17;
    *(xunknown8 **)((int8)puVar16 + -0x30) = pxVar12;
    iVar5 = *piVar18;
    *(xunknown4 *)((int8)puVar16 + -0x44) = xVar11;
    iVar1 = *(int8 *)(pxVar19 + (int8)iVar5 * 8);
    *(int8 *)((int8)puVar16 + -0x40) = (int8)iVar5 * 8;
    *(xunknown8 *)((int8)puVar16 + -0x60) = 0x646d;
    xVar6 = func_0x00005730(iVar1);
    *(xunknown8 *)((int8)puVar16 + -0x50) = xVar6;
    *(xunknown8 *)((int8)puVar16 + -0x60) = 0x647a;
    uVar8 = func_0x00005730(pxVar14);
    if (param_5 == (int8 *)0x0) {
      *(xunknown8 *)((int8)puVar16 + -0x60) = 0x653b;
      iVar5 = func_0x00005758(iVar1,pxVar14);
      if (iVar5 == 0) {
        return 0;
      }
    }
    else if ((*(int4 *)((int8)puVar16 + -0x44) == 0) || (*(uint8 *)((int8)puVar16 + -0x50) <= uVar8)
            ) {
      if (*(uint8 *)((int8)puVar16 + -0x50) == uVar8) {
        iVar2 = *(int8 *)(pxVar19 + *(int8 *)((int8)puVar16 + -0x40) + 8);
        *param_5 = iVar2;
        *(xunknown8 *)((int8)puVar16 + -0x60) = 0x6508;
        iVar4 = func_0x00005758(iVar1,pxVar14);
        if (iVar4 == 0) {
          *piVar18 = iVar5 + 1;
          if (iVar2 == 0) {
            *(xunknown8 *)((int8)puVar16 + -0x60) = 0x6559;
            func_0x00005788(1,0x7eb4,iVar1);
            return 0xffffffff;
          }
          return 0;
        }
      }
    }
    else {
      *(uint8 *)((int8)puVar16 + -0x50) = uVar8;
      *(xunknown8 *)((int8)puVar16 + -0x60) = 0x64a8;
      xVar6 = func_0x00005750(iVar1,pxVar14,uVar8);
      if ((int4)xVar6 == 0) {
        *param_5 = iVar1 + *(int8 *)((int8)puVar16 + -0x50);
        return xVar6;
      }
    }
    return 1;
  }
  return 0;
code_r0x00006e7c:
  do {
    uVar8 = *(uint8 *)(param_2 + unaff_RBX * 8);
    uVar7 = uVar8 << 0x20 | uVar8 >> 0x20;
    uStack_40 = (uint2)(uVar8 >> 0x20) & 0xfff;
    uStack_42 = (uint2)(uVar7 >> 0xc) & 0xfff;
    uStack_48 = (uint4)uVar8 >> 4 & 0xfff;
    uStack_44 = (uint2)(uVar7 >> 0x18) & 0xfff;
    if (uStack_48 == 0x378) {
      piStack_50 = (int8 *)0x6ecf;
      param_1 = &uStack_48;
      func_0x00006cd0();
    }
    uVar15 = (int4)unaff_RBX + 1;
    unaff_RBX = (uint8)uVar15;
    unaff_RBP = &uStack_48;
  } while (uVar15 < param_3);
  goto code_r0x00006dd8;
code_r0x00006e10:
  do {
    uVar8 = *(uint8 *)(param_2 + unaff_RBX * 8);
    uVar7 = uVar8 << 0x20 | uVar8 >> 0x20;
    uStack_40 = (uint2)(uVar8 >> 0x20) & 0x1fff;
    uStack_42 = (uint2)(uVar7 >> 0xd) & 0x1fff;
    uStack_48 = (uint4)uVar8 >> 7 & 0xfff;
    uStack_44 = (uint2)(uVar7 >> 0x1a) & 0x1fff;
    if (uStack_48 == 0x378) {
      piStack_50 = (int8 *)0x6e63;
      param_1 = &uStack_48;
      func_0x00006cd0();
    }
    uVar15 = (int4)unaff_RBX + 1;
    unaff_RBX = (uint8)uVar15;
    unaff_RBP = &uStack_48;
  } while (uVar15 < param_3);
  goto code_r0x00006dd8;
code_r0x00006ef3:
  do {
    uVar8 = *(uint8 *)(param_2 + unaff_RBX * 8);
    uVar7 = uVar8 << 0x20 | uVar8 >> 0x20;
    uStack_40 = (uint2)(uVar8 >> 0x20) & 0xfff;
    uStack_42 = (uint2)(uVar7 >> 0xc) & 0xfff;
    uStack_48 = (uint4)uVar8 >> 4 & 0xfffff;
    uStack_44 = (uint2)(uVar7 >> 0x18) & 0xfff;
    if ((uStack_48 == 0x378) || (uStack_48 == 0x2de00)) {
      piStack_50 = (int8 *)0x6f46;
      param_1 = &uStack_48;
      func_0x00006cd0();
    }
    uVar15 = (int4)unaff_RBX + 1;
    unaff_RBX = (uint8)uVar15;
    unaff_RBP = &uStack_48;
  } while (uVar15 < param_3);
  goto code_r0x00006dd8;
}
