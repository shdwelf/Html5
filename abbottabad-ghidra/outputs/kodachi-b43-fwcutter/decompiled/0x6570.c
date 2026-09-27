
/* PLT thunks referenced (addr -> libc symbol):
 *   func_0x000056f0 = __snprintf_chk
 *   func_0x00005700 = strcasecmp
 *   func_0x00005708 = __errno_location
 *   func_0x00005718 = mkdir
 *   func_0x00005720 = fread
 *   func_0x00005728 = fclose
 *   func_0x00005738 = __stack_chk_fail
 *   func_0x00005768 = ftell
 *   func_0x00005780 = fseek
 *   func_0x00005790 = fopen
 *   func_0x00005798 = perror
 *   func_0x000057a0 = exit
 *   func_0x000057a8 = fwrite
 *   func_0x000057b0 = __fprintf_chk
 */
/* ==== 0x6570  (x86:LE:64:default, gcc, 346 ms) ==== */
/* WARNING: Possible PIC construction at 0x00006c11: Changing call to branch */
/* WARNING: Possible PIC construction at 0x00006c50: Changing call to branch */
/* WARNING: Possible PIC construction at 0x00006c81: Changing call to branch */
/* WARNING: Removing unreachable block (ram,0x00006c55) */
/* WARNING: Removing unreachable block (ram,0x00006c16) */
/* WARNING: Removing unreachable block (ram,0x00006c86) */
/* WARNING: Removing unreachable block (ram,0x00006c9c) */
/* WARNING: Removing unreachable block (ram,0x00006cc4) */
/* WARNING: Removing unreachable block (ram,0x00006d78) */
/* WARNING: Removing unreachable block (ram,0x00006cf1) */
/* WARNING: Removing unreachable block (ram,0x00006d60) */
/* WARNING: Removing unreachable block (ram,0x00006cf3) */
/* WARNING: Removing unreachable block (ram,0x00006d08) */
/* WARNING: Removing unreachable block (ram,0x00006cf9) */
/* WARNING: Removing unreachable block (ram,0x00006d38) */
/* WARNING: Removing unreachable block (ram,0x00006cff) */
/* WARNING: Removing unreachable block (ram,0x00006cb2) */

void 0x6570(void)

{
  uint4 uVar1;
  int4 iVar2;
  uint4 uVar3;
  int4 iVar4;
  int4 *piVar5;
  int8 iVar6;
  xunknown8 xVar7;
  xunknown1 *pxVar8;
  uint8 uVar9;
  xunknown1 *pxVar10;
  uint8 uVar11;
  xunknown1 *pxVar12;
  uint4 extraout_EDX;
  uint4 extraout_EDX_00;
  xunknown1 *unaff_RBX;
  xunknown1 *unaff_RBP;
  xunknown8 xVar13;
  uint8 uVar14;
  xunknown8 xVar15;
  uint8 uVar16;
  int4 iVar17;
  int8 in_FS_OFFSET;
  xunknown1 axStack_71a0 [96];
  xunknown1 xStack_7140;
  xunknown1 xStack_713f;
  xunknown1 xStack_713e;
  xunknown1 xStack_713d;
  xunknown1 xStack_713c;
  xunknown1 xStack_713b;
  xunknown1 xStack_713a;
  xunknown1 xStack_7139;
  xunknown1 xStack_7138;
  xunknown1 xStack_7137;
  xunknown1 xStack_7136;
  xunknown1 xStack_7135;
  xunknown1 xStack_7134;
  xunknown1 xStack_7133;
  xunknown1 xStack_7132;
  xunknown1 xStack_7131;
  xunknown1 axStack_7130 [48];
  xunknown1 axStack_7100 [16392];
  xunknown8 xStack_30f8;
  uint8 uStack_30e8;
  xunknown1 *pxStack_30e0;
  uint8 uStack_30d8;
  xunknown8 xStack_30d0;
  xunknown1 *pxStack_30c8;
  xunknown8 xStack_30c0;
  xunknown1 axStack_30b8 [4104];
  int8 iStack_20b0;
  uint8 uStack_20a0;
  xunknown1 *pxStack_2098;
  xunknown1 *pxStack_2090;
  xunknown8 xStack_2088;
  uint8 uStack_2080;
  xunknown4 xStack_2060;
  uint4 uStack_205c;
  xunknown4 xStack_2058;
  xunknown1 axStack_2050 [4104];
  int8 iStack_1048;
  xunknown1 *pxStack_1040;
  xunknown1 axStack_1018 [4104];
  int8 iStack_10;
  
  iStack_10 = *(int8 *)(in_FS_OFFSET + 0x28);
  uVar1 = func_0x000056f0(axStack_1018,0x1000,1,0x1000,0x7eca,xRam000000000020e858);
  if (uVar1 < 0x1000) {
    xVar13 = 0x1f8;
    iVar2 = func_0x00005718(axStack_1018);
    if (iVar2 == 0) {
code_r0x000065dd:
      uVar1 = func_0x000056f0(axStack_1018,0x1000,1,0x1000,0x7ee0,xRam000000000020e858);
      unaff_RBX = axStack_1018;
      if (0xfff < uVar1) goto code_r0x00006690;
      xVar13 = 0x80f2;
      iVar6 = func_0x00005790(axStack_1018);
      unaff_RBX = axStack_1018;
      if (iVar6 != 0) {
        func_0x00005728(iVar6);
        uVar1 = func_0x000056f0(axStack_1018,0x1000,1,0x1000,0x7f0e,xRam000000000020e858);
        unaff_RBX = axStack_1018;
        if (0xfff < uVar1) goto code_r0x00006690;
        xVar13 = 0x80f2;
        xVar7 = func_0x00005790(axStack_1018);
        func_0x00005728(xVar7);
        unaff_RBX = axStack_1018;
        if (iStack_10 == *(int8 *)(in_FS_OFFSET + 0x28)) {
          return;
        }
        goto code_r0x000066b4;
      }
      goto code_r0x000066b9;
    }
    piVar5 = (int4 *)func_0x00005708();
    unaff_RBX = axStack_1018;
    if (*piVar5 == 0x11) goto code_r0x000065dd;
  }
  else {
code_r0x00006690:
    xVar13 = 1;
    func_0x000057b0(xRam000000000020e840,1,0x7ed2);
    func_0x000057a0(2);
code_r0x000066b4:
    func_0x00005738();
code_r0x000066b9:
    func_0x00005798(0x7ef5);
    func_0x000057a0(2);
  }
  func_0x00005798(0x8b18);
  uVar14 = 2;
  func_0x000057a0();
  uVar1 = 0;
  uVar11 = (uint8)extraout_EDX;
  pxVar12 = (xunknown1 *)0x1000;
  pxVar8 = axStack_2050;
  iStack_1048 = *(int8 *)(in_FS_OFFSET + 0x28);
  pxStack_1040 = unaff_RBX;
  uVar3 = func_0x000056f0(pxVar8,0x1000,1,0x1000,0x7ee0,xRam000000000020e858);
  if (0xfff < uVar3) {
code_r0x0000685f:
    xVar7 = 1;
    func_0x000057b0(xRam000000000020e840,1,0x7ed2);
    func_0x000057a0(2);
    goto code_r0x00006883;
  }
  xVar7 = 0x8076;
  unaff_RBP = (xunknown1 *)func_0x00005790(pxVar8);
  if (unaff_RBP != (xunknown1 *)0x0) {
    func_0x00005780(unaff_RBP,0,2);
    uVar1 = 0x7f0e;
    pxVar12 = (xunknown1 *)0x1000;
    uVar3 = func_0x000056f0(pxVar8,0x1000,1,0x1000,0x7f0e,xRam000000000020e858);
    if (0xfff < uVar3) goto code_r0x0000685f;
    xVar7 = 0x8076;
    pxVar8 = (xunknown1 *)func_0x00005790(pxVar8);
    if (pxVar8 != (xunknown1 *)0x0) {
      func_0x00005780(pxVar8,0,2);
      xStack_2060 = func_0x00005768(unaff_RBP);
      xVar7 = 0xc;
      xStack_2058 = (xunknown4)uVar14;
      pxVar12 = pxVar8;
      uStack_205c = extraout_EDX;
      iVar6 = func_0x000057a8(&xStack_2060,0xc,1);
      if (iVar6 == 1) {
        func_0x00005728(pxVar8);
        xVar7 = 1;
        pxVar12 = unaff_RBP;
        uVar9 = func_0x000057a8(xVar13,1,uVar11);
        if (uVar11 != uVar9) goto code_r0x00006883;
        func_0x00005728(unaff_RBP);
        if (iStack_1048 == *(int8 *)(in_FS_OFFSET + 0x28)) {
          return;
        }
      }
      else {
code_r0x00006883:
        func_0x00005798(0x7f42);
        func_0x000057a0(2);
      }
      func_0x00005738();
    }
    func_0x00005798(0x7f27);
    func_0x000057a0(2);
  }
  func_0x00005798(0x7ef5);
  xVar15 = 2;
  func_0x000057a0();
  uVar9 = 0x7f57;
  uVar16 = (uint8)extraout_EDX_00;
  pxVar10 = axStack_30b8;
  iStack_20b0 = *(int8 *)(in_FS_OFFSET + 0x28);
  if ((uVar1 & 2) == 0) {
    uVar9 = 0x7f5b;
  }
  xStack_30d0 = 0x6945;
  pxStack_30c8 = (xunknown1 *)uVar9;
  uStack_20a0 = uVar11;
  pxStack_2098 = unaff_RBP;
  pxStack_2090 = pxVar8;
  xStack_2088 = xVar13;
  uStack_2080 = uVar14 & 0xffffffff;
  uVar1 = func_0x000056f0(axStack_30b8,0x1000,1,0x1000,0x7f65,xRam000000000020e858);
  if (uVar1 < 0x1000) {
    xStack_30c0 = 0x695f;
    iVar2 = func_0x00005718(axStack_30b8,0x1f8);
    if (iVar2 != 0) {
      xStack_30c0 = 0x6968;
      piVar5 = (int4 *)func_0x00005708();
      pxStack_30e0 = axStack_30b8;
      if (*piVar5 != 0x11) goto code_r0x00006a77;
    }
    xStack_30d0 = 0x699b;
    pxStack_30c8 = (xunknown1 *)uVar9;
    xStack_30c0 = xVar15;
    uVar1 = func_0x000056f0(axStack_30b8,0x1000,1,0x1000,0x7f6b,xRam000000000020e858);
    xVar13 = xStack_30c0;
    if (0xfff < uVar1) goto code_r0x00006a22;
    xStack_30c0 = 0x69b3;
    pxVar10 = (xunknown1 *)func_0x00005790(axStack_30b8,0x80f2,pxStack_30c8,xVar13);
    if (pxVar10 != (xunknown1 *)0x0) {
      xStack_30c0 = 0x69d4;
      iVar6 = func_0x000057a8(pxVar12,8,1,pxVar10);
      if (iVar6 != 1) goto code_r0x00006a46;
      xStack_30c0 = 0x69f0;
      uVar11 = func_0x000057a8(xVar7,1,uVar16,pxVar10);
      uVar9 = uVar16;
      if (uVar16 != uVar11) goto code_r0x00006a46;
      xStack_30c0 = 0x69fd;
      func_0x00005728(pxVar10);
      if (iStack_20b0 == *(int8 *)(in_FS_OFFSET + 0x28)) {
        return;
      }
      goto code_r0x00006a5c;
    }
  }
  else {
code_r0x00006a22:
    xStack_30c0 = 0x6a3c;
    func_0x000057b0(xRam000000000020e840,1,0x7ed2);
    xStack_30c0 = 0x6a46;
    func_0x000057a0(2);
code_r0x00006a46:
    xStack_30c0 = 0x6a52;
    func_0x00005798(0x7f42);
    xStack_30c0 = 0x6a5c;
    func_0x000057a0(2);
code_r0x00006a5c:
    xStack_30c0 = 0x6a61;
    func_0x00005738();
  }
  xStack_30c0 = 0x6a6d;
  func_0x00005798(0x7f77);
  xStack_30c0 = 0x6a77;
  func_0x000057a0(2);
  pxStack_30e0 = pxVar10;
code_r0x00006a77:
  xStack_30c0 = 0x6a83;
  func_0x00005798(0x8b18);
  xVar13 = 2;
  xStack_30c0 = 0x6a8d;
  func_0x000057a0(2);
  xStack_30f8 = *(xunknown8 *)(in_FS_OFFSET + 0x28);
  uStack_30e8 = uVar9;
  uStack_30d8 = uVar16;
  xStack_30d0 = xVar7;
  pxStack_30c8 = pxVar12;
  xStack_30c0 = xVar15;
  func_0x00007a30(axStack_71a0);
  while( true ) {
    iVar2 = func_0x00005720(axStack_7100,1,0x4000,xVar13);
    if (iVar2 < 1) break;
    func_0x00007a60(axStack_71a0,axStack_7100,iVar2);
  }
  iVar6 = 0x209b20;
  iVar17 = 0;
  func_0x00007d50(&xStack_7140,axStack_71a0);
  func_0x000056f0(axStack_7130,0x21,1,0x21,0x8b40,xStack_7140,xStack_713f,xStack_713e,xStack_713d,
                  xStack_713c,xStack_713b,xStack_713a,xStack_7139,xStack_7138,xStack_7137,
                  xStack_7136,xStack_7135,xStack_7134,xStack_7133,xStack_7132,xStack_7131);
  iVar2 = iRam000000000020e864;
  do {
    if (((*(uint1 *)(iVar6 + 0x20) & 4) == 0) || (iVar2 != 0)) {
      iVar4 = func_0x00005700(axStack_7130,*(xunknown8 *)(iVar6 + 0x10));
      if (iVar4 == 0) {
        xVar13 = 0x7f8b;
        goto code_r0x00005788;
      }
    }
    iVar17 = iVar17 + 1;
    iVar6 = iVar6 + 0x28;
  } while (iVar17 != 0xd);
  xVar13 = 0x8b88;
code_r0x00005788:
                    /* WARNING: Could not recover jumptable at 0x00005788. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  (*pcRam0000000000209fa0)(1,xVar13);
  return;
}
