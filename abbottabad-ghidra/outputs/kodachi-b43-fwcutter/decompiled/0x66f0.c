
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
/* ==== 0x66f0  (x86:LE:64:default, gcc, 331 ms) ==== */
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

void 0x66f0(uint4 param_1,xunknown8 param_2,uint4 param_3)

{
  uint4 uVar1;
  uint4 uVar2;
  int4 iVar3;
  int4 iVar4;
  xunknown1 *pxVar5;
  int8 iVar6;
  uint8 uVar7;
  int4 *piVar8;
  xunknown1 *pxVar9;
  uint8 uVar10;
  xunknown1 *pxVar11;
  uint4 extraout_EDX;
  xunknown1 *unaff_RBP;
  xunknown8 xVar12;
  xunknown8 xVar13;
  xunknown8 xVar14;
  uint8 uVar15;
  int4 iVar16;
  int8 in_FS_OFFSET;
  xunknown1 axStack_6188 [96];
  xunknown1 xStack_6128;
  xunknown1 xStack_6127;
  xunknown1 xStack_6126;
  xunknown1 xStack_6125;
  xunknown1 xStack_6124;
  xunknown1 xStack_6123;
  xunknown1 xStack_6122;
  xunknown1 xStack_6121;
  xunknown1 xStack_6120;
  xunknown1 xStack_611f;
  xunknown1 xStack_611e;
  xunknown1 xStack_611d;
  xunknown1 xStack_611c;
  xunknown1 xStack_611b;
  xunknown1 xStack_611a;
  xunknown1 xStack_6119;
  xunknown1 axStack_6118 [48];
  xunknown1 axStack_60e8 [16392];
  xunknown8 xStack_20e0;
  uint8 uStack_20d0;
  xunknown1 *pxStack_20c8;
  uint8 uStack_20c0;
  xunknown8 xStack_20b8;
  xunknown1 *pxStack_20b0;
  xunknown8 xStack_20a8;
  xunknown1 axStack_20a0 [4104];
  int8 iStack_1098;
  uint8 uStack_1088;
  xunknown1 *pxStack_1080;
  xunknown1 *pxStack_1078;
  xunknown8 xStack_1070;
  uint8 uStack_1068;
  xunknown4 xStack_1048;
  uint4 uStack_1044;
  uint4 uStack_1040;
  xunknown1 axStack_1038 [4104];
  int8 iStack_30;
  
  uVar2 = 0;
  uVar10 = (uint8)param_3;
  pxVar11 = (xunknown1 *)0x1000;
  pxVar5 = axStack_1038;
  iStack_30 = *(int8 *)(in_FS_OFFSET + 0x28);
  uVar1 = func_0x000056f0(pxVar5,0x1000,1,0x1000,0x7ee0,xRam000000000020e858);
  if (0xfff < uVar1) {
code_r0x0000685f:
    xVar12 = 1;
    func_0x000057b0(xRam000000000020e840,1,0x7ed2);
    func_0x000057a0(2);
    goto code_r0x00006883;
  }
  xVar12 = 0x8076;
  unaff_RBP = (xunknown1 *)func_0x00005790(pxVar5);
  if (unaff_RBP != (xunknown1 *)0x0) {
    func_0x00005780(unaff_RBP,0,2);
    uVar2 = 0x7f0e;
    pxVar11 = (xunknown1 *)0x1000;
    uVar1 = func_0x000056f0(pxVar5,0x1000,1,0x1000,0x7f0e,xRam000000000020e858);
    if (0xfff < uVar1) goto code_r0x0000685f;
    xVar12 = 0x8076;
    pxVar5 = (xunknown1 *)func_0x00005790(pxVar5);
    if (pxVar5 != (xunknown1 *)0x0) {
      func_0x00005780(pxVar5,0,2);
      xStack_1048 = func_0x00005768(unaff_RBP);
      xVar12 = 0xc;
      pxVar11 = pxVar5;
      uStack_1044 = param_3;
      uStack_1040 = param_1;
      iVar6 = func_0x000057a8(&xStack_1048,0xc,1);
      if (iVar6 == 1) {
        func_0x00005728(pxVar5);
        xVar12 = 1;
        pxVar11 = unaff_RBP;
        uVar7 = func_0x000057a8(param_2,1,uVar10);
        if (uVar10 != uVar7) goto code_r0x00006883;
        func_0x00005728(unaff_RBP);
        if (iStack_30 == *(int8 *)(in_FS_OFFSET + 0x28)) {
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
  xVar13 = 2;
  func_0x000057a0();
  uVar7 = 0x7f57;
  uVar15 = (uint8)extraout_EDX;
  pxVar9 = axStack_20a0;
  iStack_1098 = *(int8 *)(in_FS_OFFSET + 0x28);
  if ((uVar2 & 2) == 0) {
    uVar7 = 0x7f5b;
  }
  xStack_20b8 = 0x6945;
  pxStack_20b0 = (xunknown1 *)uVar7;
  uStack_1088 = uVar10;
  pxStack_1080 = unaff_RBP;
  pxStack_1078 = pxVar5;
  xStack_1070 = param_2;
  uStack_1068 = (uint8)param_1;
  uVar2 = func_0x000056f0(axStack_20a0,0x1000,1,0x1000,0x7f65,xRam000000000020e858);
  if (uVar2 < 0x1000) {
    xStack_20a8 = 0x695f;
    iVar3 = func_0x00005718(axStack_20a0,0x1f8);
    if (iVar3 != 0) {
      xStack_20a8 = 0x6968;
      piVar8 = (int4 *)func_0x00005708();
      pxStack_20c8 = axStack_20a0;
      if (*piVar8 != 0x11) goto code_r0x00006a77;
    }
    xStack_20b8 = 0x699b;
    pxStack_20b0 = (xunknown1 *)uVar7;
    xStack_20a8 = xVar13;
    uVar2 = func_0x000056f0(axStack_20a0,0x1000,1,0x1000,0x7f6b,xRam000000000020e858);
    xVar14 = xStack_20a8;
    if (0xfff < uVar2) goto code_r0x00006a22;
    xStack_20a8 = 0x69b3;
    pxVar9 = (xunknown1 *)func_0x00005790(axStack_20a0,0x80f2,pxStack_20b0,xVar14);
    if (pxVar9 != (xunknown1 *)0x0) {
      xStack_20a8 = 0x69d4;
      iVar6 = func_0x000057a8(pxVar11,8,1,pxVar9);
      if (iVar6 != 1) goto code_r0x00006a46;
      xStack_20a8 = 0x69f0;
      uVar10 = func_0x000057a8(xVar12,1,uVar15,pxVar9);
      uVar7 = uVar15;
      if (uVar15 != uVar10) goto code_r0x00006a46;
      xStack_20a8 = 0x69fd;
      func_0x00005728(pxVar9);
      if (iStack_1098 == *(int8 *)(in_FS_OFFSET + 0x28)) {
        return;
      }
      goto code_r0x00006a5c;
    }
  }
  else {
code_r0x00006a22:
    xStack_20a8 = 0x6a3c;
    func_0x000057b0(xRam000000000020e840,1,0x7ed2);
    xStack_20a8 = 0x6a46;
    func_0x000057a0(2);
code_r0x00006a46:
    xStack_20a8 = 0x6a52;
    func_0x00005798(0x7f42);
    xStack_20a8 = 0x6a5c;
    func_0x000057a0(2);
code_r0x00006a5c:
    xStack_20a8 = 0x6a61;
    func_0x00005738();
  }
  xStack_20a8 = 0x6a6d;
  func_0x00005798(0x7f77);
  xStack_20a8 = 0x6a77;
  func_0x000057a0(2);
  pxStack_20c8 = pxVar9;
code_r0x00006a77:
  xStack_20a8 = 0x6a83;
  func_0x00005798(0x8b18);
  xVar14 = 2;
  xStack_20a8 = 0x6a8d;
  func_0x000057a0(2);
  xStack_20e0 = *(xunknown8 *)(in_FS_OFFSET + 0x28);
  uStack_20d0 = uVar7;
  uStack_20c0 = uVar15;
  xStack_20b8 = xVar12;
  pxStack_20b0 = pxVar11;
  xStack_20a8 = xVar13;
  func_0x00007a30(axStack_6188);
  while( true ) {
    iVar3 = func_0x00005720(axStack_60e8,1,0x4000,xVar14);
    if (iVar3 < 1) break;
    func_0x00007a60(axStack_6188,axStack_60e8,iVar3);
  }
  iVar6 = 0x209b20;
  iVar16 = 0;
  func_0x00007d50(&xStack_6128,axStack_6188);
  func_0x000056f0(axStack_6118,0x21,1,0x21,0x8b40,xStack_6128,xStack_6127,xStack_6126,xStack_6125,
                  xStack_6124,xStack_6123,xStack_6122,xStack_6121,xStack_6120,xStack_611f,
                  xStack_611e,xStack_611d,xStack_611c,xStack_611b,xStack_611a,xStack_6119);
  iVar3 = iRam000000000020e864;
  do {
    if (((*(uint1 *)(iVar6 + 0x20) & 4) == 0) || (iVar3 != 0)) {
      iVar4 = func_0x00005700(axStack_6118,*(xunknown8 *)(iVar6 + 0x10));
      if (iVar4 == 0) {
        xVar12 = 0x7f8b;
        goto code_r0x00005788;
      }
    }
    iVar16 = iVar16 + 1;
    iVar6 = iVar6 + 0x28;
  } while (iVar16 != 0xd);
  xVar12 = 0x8b88;
code_r0x00005788:
                    /* WARNING: Could not recover jumptable at 0x00005788. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  (*pcRam0000000000209fa0)(1,xVar12);
  return;
}
