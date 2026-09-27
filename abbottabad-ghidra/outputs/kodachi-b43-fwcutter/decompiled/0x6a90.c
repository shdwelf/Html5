
/* PLT thunks referenced (addr -> libc symbol):
 *   func_0x000056f0 = __snprintf_chk
 *   func_0x00005700 = strcasecmp
 *   func_0x00005720 = fread
 */
/* ==== 0x6a90  (x86:LE:64:default, gcc, 267 ms) ==== */
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

void 0x6a90(xunknown8 param_1)

{
  int4 iVar1;
  int4 iVar2;
  int8 iVar3;
  xunknown8 xVar4;
  int4 iVar5;
  int8 in_FS_OFFSET;
  xunknown1 axStack_40e8 [96];
  xunknown1 xStack_4088;
  xunknown1 xStack_4087;
  xunknown1 xStack_4086;
  xunknown1 xStack_4085;
  xunknown1 xStack_4084;
  xunknown1 xStack_4083;
  xunknown1 xStack_4082;
  xunknown1 xStack_4081;
  xunknown1 xStack_4080;
  xunknown1 xStack_407f;
  xunknown1 xStack_407e;
  xunknown1 xStack_407d;
  xunknown1 xStack_407c;
  xunknown1 xStack_407b;
  xunknown1 xStack_407a;
  xunknown1 xStack_4079;
  xunknown1 axStack_4078 [48];
  xunknown1 axStack_4048 [16392];
  xunknown8 xStack_40;
  
  xStack_40 = *(xunknown8 *)(in_FS_OFFSET + 0x28);
  func_0x00007a30(axStack_40e8);
  while( true ) {
    iVar1 = func_0x00005720(axStack_4048,1,0x4000,param_1);
    if (iVar1 < 1) break;
    func_0x00007a60(axStack_40e8,axStack_4048,iVar1);
  }
  iVar3 = 0x209b20;
  iVar5 = 0;
  func_0x00007d50(&xStack_4088,axStack_40e8);
  func_0x000056f0(axStack_4078,0x21,1,0x21,0x8b40,xStack_4088,xStack_4087,xStack_4086,xStack_4085,
                  xStack_4084,xStack_4083,xStack_4082,xStack_4081,xStack_4080,xStack_407f,
                  xStack_407e,xStack_407d,xStack_407c,xStack_407b,xStack_407a,xStack_4079);
  iVar1 = iRam000000000020e864;
  do {
    if (((*(uint1 *)(iVar3 + 0x20) & 4) == 0) || (iVar1 != 0)) {
      iVar2 = func_0x00005700(axStack_4078,*(xunknown8 *)(iVar3 + 0x10));
      if (iVar2 == 0) {
        xVar4 = 0x7f8b;
        goto code_r0x00005788;
      }
    }
    iVar5 = iVar5 + 1;
    iVar3 = iVar3 + 0x28;
  } while (iVar5 != 0xd);
  xVar4 = 0x8b88;
code_r0x00005788:
                    /* WARNING: Could not recover jumptable at 0x00005788. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  (*pcRam0000000000209fa0)(1,xVar4);
  return;
}
