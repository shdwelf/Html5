
/* PLT thunks referenced (addr -> libc symbol):
 *   func_0x000056f0 = __snprintf_chk
 *   func_0x00005700 = strcasecmp
 *   func_0x00005708 = __errno_location
 *   func_0x00005718 = mkdir
 *   func_0x00005720 = fread
 *   func_0x00005728 = fclose
 *   func_0x00005738 = __stack_chk_fail
 *   func_0x00005790 = fopen
 *   func_0x00005798 = perror
 *   func_0x000057a0 = exit
 *   func_0x000057a8 = fwrite
 *   func_0x000057b0 = __fprintf_chk
 */
/* ==== 0x68d0  (x86:LE:64:default, gcc, 297 ms) ==== */
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

void 0x68d0(xunknown8 param_1,xunknown8 param_2,uint4 param_3,xunknown8 param_4,uint4 param_5)

{
  uint4 uVar1;
  int4 iVar2;
  int4 iVar3;
  int4 *piVar4;
  xunknown1 *pxVar5;
  int8 iVar6;
  uint8 uVar7;
  uint8 uVar8;
  xunknown8 xVar9;
  uint8 uVar10;
  int4 iVar11;
  int8 in_FS_OFFSET;
  xunknown1 axStack_5130 [96];
  xunknown1 xStack_50d0;
  xunknown1 xStack_50cf;
  xunknown1 xStack_50ce;
  xunknown1 xStack_50cd;
  xunknown1 xStack_50cc;
  xunknown1 xStack_50cb;
  xunknown1 xStack_50ca;
  xunknown1 xStack_50c9;
  xunknown1 xStack_50c8;
  xunknown1 xStack_50c7;
  xunknown1 xStack_50c6;
  xunknown1 xStack_50c5;
  xunknown1 xStack_50c4;
  xunknown1 xStack_50c3;
  xunknown1 xStack_50c2;
  xunknown1 xStack_50c1;
  xunknown1 axStack_50c0 [48];
  xunknown1 axStack_5090 [16392];
  xunknown8 xStack_1088;
  uint8 uStack_1078;
  xunknown1 *pxStack_1070;
  uint8 uStack_1068;
  xunknown8 xStack_1060;
  uint8 uStack_1058;
  xunknown8 xStack_1050;
  xunknown1 axStack_1048 [4104];
  int8 iStack_40;
  
  uVar8 = 0x7f57;
  uVar10 = (uint8)param_3;
  pxVar5 = axStack_1048;
  iStack_40 = *(int8 *)(in_FS_OFFSET + 0x28);
  if ((param_5 & 2) == 0) {
    uVar8 = 0x7f5b;
  }
  xStack_1060 = 0x6945;
  uStack_1058 = uVar8;
  uVar1 = func_0x000056f0(axStack_1048,0x1000,1,0x1000,0x7f65,xRam000000000020e858);
  if (uVar1 < 0x1000) {
    xStack_1050 = 0x695f;
    iVar2 = func_0x00005718(axStack_1048,0x1f8);
    if (iVar2 != 0) {
      xStack_1050 = 0x6968;
      piVar4 = (int4 *)func_0x00005708();
      pxStack_1070 = axStack_1048;
      if (*piVar4 != 0x11) goto code_r0x00006a77;
    }
    xStack_1060 = 0x699b;
    uStack_1058 = uVar8;
    xStack_1050 = param_1;
    uVar1 = func_0x000056f0(axStack_1048,0x1000,1,0x1000,0x7f6b,xRam000000000020e858);
    xVar9 = xStack_1050;
    if (0xfff < uVar1) goto code_r0x00006a22;
    xStack_1050 = 0x69b3;
    pxVar5 = (xunknown1 *)func_0x00005790(axStack_1048,0x80f2,uStack_1058,xVar9);
    if (pxVar5 != (xunknown1 *)0x0) {
      xStack_1050 = 0x69d4;
      iVar6 = func_0x000057a8(param_4,8,1,pxVar5);
      if (iVar6 != 1) goto code_r0x00006a46;
      xStack_1050 = 0x69f0;
      uVar7 = func_0x000057a8(param_2,1,uVar10,pxVar5);
      uVar8 = uVar10;
      if (uVar10 != uVar7) goto code_r0x00006a46;
      xStack_1050 = 0x69fd;
      func_0x00005728(pxVar5);
      if (iStack_40 == *(int8 *)(in_FS_OFFSET + 0x28)) {
        return;
      }
      goto code_r0x00006a5c;
    }
  }
  else {
code_r0x00006a22:
    xStack_1050 = 0x6a3c;
    func_0x000057b0(xRam000000000020e840,1,0x7ed2);
    xStack_1050 = 0x6a46;
    func_0x000057a0(2);
code_r0x00006a46:
    xStack_1050 = 0x6a52;
    func_0x00005798(0x7f42);
    xStack_1050 = 0x6a5c;
    func_0x000057a0(2);
code_r0x00006a5c:
    xStack_1050 = 0x6a61;
    func_0x00005738();
  }
  xStack_1050 = 0x6a6d;
  func_0x00005798(0x7f77);
  xStack_1050 = 0x6a77;
  func_0x000057a0(2);
  pxStack_1070 = pxVar5;
code_r0x00006a77:
  xStack_1050 = 0x6a83;
  func_0x00005798(0x8b18);
  xVar9 = 2;
  xStack_1050 = 0x6a8d;
  func_0x000057a0(2);
  xStack_1088 = *(xunknown8 *)(in_FS_OFFSET + 0x28);
  uStack_1078 = uVar8;
  uStack_1068 = uVar10;
  xStack_1060 = param_2;
  uStack_1058 = param_4;
  xStack_1050 = param_1;
  func_0x00007a30(axStack_5130);
  while( true ) {
    iVar2 = func_0x00005720(axStack_5090,1,0x4000,xVar9);
    if (iVar2 < 1) break;
    func_0x00007a60(axStack_5130,axStack_5090,iVar2);
  }
  iVar6 = 0x209b20;
  iVar11 = 0;
  func_0x00007d50(&xStack_50d0,axStack_5130);
  func_0x000056f0(axStack_50c0,0x21,1,0x21,0x8b40,xStack_50d0,xStack_50cf,xStack_50ce,xStack_50cd,
                  xStack_50cc,xStack_50cb,xStack_50ca,xStack_50c9,xStack_50c8,xStack_50c7,
                  xStack_50c6,xStack_50c5,xStack_50c4,xStack_50c3,xStack_50c2,xStack_50c1);
  iVar2 = iRam000000000020e864;
  do {
    if (((*(uint1 *)(iVar6 + 0x20) & 4) == 0) || (iVar2 != 0)) {
      iVar3 = func_0x00005700(axStack_50c0,*(xunknown8 *)(iVar6 + 0x10));
      if (iVar3 == 0) {
        xVar9 = 0x7f8b;
        goto code_r0x00005788;
      }
    }
    iVar11 = iVar11 + 1;
    iVar6 = iVar6 + 0x28;
  } while (iVar11 != 0xd);
  xVar9 = 0x8b88;
code_r0x00005788:
                    /* WARNING: Could not recover jumptable at 0x00005788. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  (*pcRam0000000000209fa0)(1,xVar9);
  return;
}
