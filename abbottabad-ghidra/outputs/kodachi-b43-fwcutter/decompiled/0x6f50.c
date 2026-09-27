
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
/* ==== 0x6f50  (x86:LE:64:default, gcc, 248 ms) ==== */
/* WARNING: Possible PIC construction at 0x0000718d: Changing call to branch */
/* WARNING: Removing unreachable block (ram,0x00007192) */

xunknown8 0x6f50(xunknown8 *param_1)

{
  int8 iVar1;
  int8 iVar2;
  int4 *piVar3;
  int4 iVar4;
  int4 iVar5;
  xunknown8 xVar6;
  uint8 uVar7;
  uint4 *puVar8;
  uint4 *puVar9;
  xunknown4 xVar10;
  xunknown8 *pxVar11;
  uint4 uVar12;
  uint4 uVar13;
  xunknown8 *pxVar14;
  xunknown8 *extraout_RDX;
  uint4 *puVar15;
  uint4 *puVar16;
  int4 *piVar17;
  xunknown1 *pxVar18;
  int8 *in_R8;
  int4 *piVar19;
  int8 *piVar20;
  int8 *unaff_R13;
  xunknown8 unaff_R14;
  xunknown8 unaff_R15;
  int8 in_FS_OFFSET;
  xunknown8 axStack_a8 [2];
  xunknown8 *pxStack_98;
  xunknown1 *pxStack_90;
  int4 *piStack_88;
  int8 *piStack_80;
  uint4 auStack_78 [8];
  int8 aiStack_58 [2];
  xunknown1 xStack_44;
  int8 iStack_30;
  
  puVar16 = auStack_78;
  puVar15 = auStack_78;
  iStack_30 = *(int8 *)(in_FS_OFFSET + 0x28);
  if ((*(uint1 *)(param_1 + 4) & 2) == 0) {
    piStack_80 = (int8 *)0x70eb;
    func_0x00005788(1,0x8016);
  }
  else {
    piStack_80 = (int8 *)0x6f88;
    func_0x00005788(1,0x8010);
  }
  piVar3 = (int4 *)*param_1;
  piStack_80 = (int8 *)0x6f93;
  uVar7 = func_0x00005730(piVar3);
  if (uVar7 < 0x15) {
    piStack_80 = (int8 *)0x70cf;
    func_0x00005760(auStack_78,piVar3,uVar7 + 1,0x1e);
  }
  else {
    unaff_R13 = aiStack_58;
    piStack_80 = (int8 *)0x6fb5;
    func_0x00005710(unaff_R13,piVar3,0x14);
    in_R8 = (int8 *)0x8021;
    xStack_44 = 0;
    piStack_80 = (int8 *)0x6fdd;
    func_0x000056f0(auStack_78,0x1e,1,0x1e,0x8021,unaff_R13);
  }
  piStack_80 = (int8 *)0x6ff3;
  func_0x00005788(1,0x8026,auStack_78);
  puVar8 = auStack_78;
  do {
    puVar9 = puVar8;
    uVar12 = *puVar9 + 0xfefefeff & ~*puVar9;
    uVar13 = uVar12 & 0x80808080;
    puVar8 = puVar9 + 1;
  } while (uVar13 == 0);
  if ((uVar12 & 0x8080) == 0) {
    puVar8 = (uint4 *)((int8)puVar9 + 6);
    uVar13 = uVar13 >> 0x10;
  }
  uVar7 = (int8)puVar8 + ((-3 - (uint8)CARRY1((uint1)uVar13,(uint1)uVar13)) - (int8)auStack_78);
  if (uVar7 < 8) {
    piStack_80 = (int8 *)0x7103;
    func_0x00005788(1,0x8014);
    puVar8 = auStack_78;
    do {
      puVar9 = puVar8;
      uVar12 = *puVar9 + 0xfefefeff & ~*puVar9;
      uVar13 = uVar12 & 0x80808080;
      puVar8 = puVar9 + 1;
    } while (uVar13 == 0);
    if ((uVar12 & 0x8080) == 0) {
      puVar8 = (uint4 *)((int8)puVar9 + 6);
      uVar13 = uVar13 >> 0x10;
    }
    uVar7 = (int8)puVar8 + ((-3 - (uint8)CARRY1((uint1)uVar13,(uint1)uVar13)) - (int8)auStack_78);
  }
  pxVar11 = (xunknown8 *)((int8)puVar9 + 6);
  if (uVar7 < 0x10) {
    piStack_80 = (int8 *)0x7163;
    func_0x00005788(1,0x8014);
  }
  piStack_80 = (int8 *)0x705b;
  func_0x00005788(1,0x8026,param_1[1]);
  piStack_80 = (int8 *)0x7064;
  uVar7 = func_0x00005730(param_1[1]);
  if (uVar7 < 8) {
    piStack_80 = (int8 *)0x707d;
    func_0x00005788(1,0x8014);
  }
  piVar17 = (int4 *)0x7fe0;
  pxVar18 = (xunknown1 *)0x1;
  piStack_80 = (int8 *)0x7094;
  func_0x00005788(1,0x7fe0,param_1[2]);
  if (iStack_30 != *(int8 *)(in_FS_OFFSET + 0x28)) {
    piStack_80 = (int8 *)0x716d;
    func_0x00005738();
    if (extraout_RDX == (xunknown8 *)0x0) {
      if (pxVar11 == (xunknown8 *)0x0) {
        return 1;
      }
      xVar10 = 1;
      pxVar14 = pxVar11;
      pxVar11 = param_1;
      piVar19 = piVar3;
      piVar20 = unaff_R13;
    }
    else {
      xVar10 = 0;
      puVar15 = (uint4 *)axStack_a8;
      axStack_a8[0] = 0x7192;
      pxVar14 = extraout_RDX;
      puVar16 = (uint4 *)pxVar18;
      piVar19 = piVar17;
      piVar20 = in_R8;
    }
    pxStack_98 = param_1;
    pxStack_90 = (xunknown1 *)auStack_78;
    piStack_88 = piVar3;
    piStack_80 = unaff_R13;
    *(xunknown8 *)((int8)puVar15 + -8) = unaff_R15;
    *(xunknown8 *)((int8)puVar15 + -0x10) = unaff_R14;
    *(int8 **)((int8)puVar15 + -0x18) = piVar20;
    *(int4 **)((int8)puVar15 + -0x20) = piVar19;
    *(uint4 **)((int8)puVar15 + -0x28) = puVar16;
    *(xunknown8 **)((int8)puVar15 + -0x30) = pxVar11;
    iVar5 = *piVar17;
    *(xunknown4 *)((int8)puVar15 + -0x44) = xVar10;
    iVar1 = *(int8 *)(pxVar18 + (int8)iVar5 * 8);
    *(int8 *)((int8)puVar15 + -0x40) = (int8)iVar5 * 8;
    *(xunknown8 *)((int8)puVar15 + -0x60) = 0x646d;
    xVar6 = func_0x00005730(iVar1);
    *(xunknown8 *)((int8)puVar15 + -0x50) = xVar6;
    *(xunknown8 *)((int8)puVar15 + -0x60) = 0x647a;
    uVar7 = func_0x00005730(pxVar14);
    if (in_R8 == (int8 *)0x0) {
      *(xunknown8 *)((int8)puVar15 + -0x60) = 0x653b;
      iVar5 = func_0x00005758(iVar1,pxVar14);
      if (iVar5 == 0) {
        return 0;
      }
    }
    else if ((*(int4 *)((int8)puVar15 + -0x44) == 0) || (*(uint8 *)((int8)puVar15 + -0x50) <= uVar7)
            ) {
      if (*(uint8 *)((int8)puVar15 + -0x50) == uVar7) {
        iVar2 = *(int8 *)(pxVar18 + *(int8 *)((int8)puVar15 + -0x40) + 8);
        *in_R8 = iVar2;
        *(xunknown8 *)((int8)puVar15 + -0x60) = 0x6508;
        iVar4 = func_0x00005758(iVar1,pxVar14);
        if (iVar4 == 0) {
          *piVar17 = iVar5 + 1;
          if (iVar2 == 0) {
            *(xunknown8 *)((int8)puVar15 + -0x60) = 0x6559;
            func_0x00005788(1,0x7eb4,iVar1);
            return 0xffffffff;
          }
          return 0;
        }
      }
    }
    else {
      *(uint8 *)((int8)puVar15 + -0x50) = uVar7;
      *(xunknown8 *)((int8)puVar15 + -0x60) = 0x64a8;
      xVar6 = func_0x00005750(iVar1,pxVar14,uVar7);
      if ((int4)xVar6 == 0) {
        *in_R8 = iVar1 + *(int8 *)((int8)puVar15 + -0x50);
        return xVar6;
      }
    }
    return 1;
  }
  return 0;
}
