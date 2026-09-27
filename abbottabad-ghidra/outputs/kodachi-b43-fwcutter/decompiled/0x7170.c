
/* PLT thunks referenced (addr -> libc symbol):
 *   func_0x00005730 = strlen
 *   func_0x00005750 = memcmp
 *   func_0x00005758 = strcmp
 *   func_0x00005788 = __printf_chk
 */
/* ==== 0x7170  (x86:LE:64:default, gcc, 210 ms) ==== */
/* WARNING: Possible PIC construction at 0x0000718d: Changing call to branch */
/* WARNING: Removing unreachable block (ram,0x00007192) */

xunknown8 0x7170(int8 param_1,int4 *param_2,int8 param_3,int8 param_4,int8 *param_5)

{
  int8 iVar1;
  int8 iVar2;
  int4 iVar3;
  int4 iVar4;
  xunknown8 xVar5;
  uint8 uVar6;
  xunknown4 xVar7;
  int8 unaff_RBX;
  int8 unaff_RBP;
  int4 *unaff_R12;
  int8 *unaff_R13;
  xunknown8 unaff_R14;
  xunknown8 unaff_R15;
  xunknown8 axStack_30 [2];
  
  if (param_3 == 0) {
    if (param_4 == 0) {
      return 1;
    }
    xVar7 = 1;
    param_3 = param_4;
  }
  else {
    xVar7 = 0;
    register0x00000020 = (BADSPACEBASE *)axStack_30;
    axStack_30[0] = 0x7192;
    unaff_RBX = param_4;
    unaff_RBP = param_1;
    unaff_R12 = param_2;
    unaff_R13 = param_5;
  }
  *(xunknown8 *)((int8)register0x00000020 + -8) = unaff_R15;
  *(xunknown8 *)((int8)register0x00000020 + -0x10) = unaff_R14;
  *(int8 **)((int8)register0x00000020 + -0x18) = unaff_R13;
  *(int4 **)((int8)register0x00000020 + -0x20) = unaff_R12;
  *(int8 *)((int8)register0x00000020 + -0x28) = unaff_RBP;
  *(int8 *)((int8)register0x00000020 + -0x30) = unaff_RBX;
  iVar4 = *param_2;
  *(xunknown4 *)((int8)register0x00000020 + -0x44) = xVar7;
  iVar1 = *(int8 *)(param_1 + (int8)iVar4 * 8);
  *(int8 *)((int8)register0x00000020 + -0x40) = (int8)iVar4 * 8;
  *(xunknown8 *)((int8)register0x00000020 + -0x60) = 0x646d;
  xVar5 = func_0x00005730(iVar1);
  *(xunknown8 *)((int8)register0x00000020 + -0x50) = xVar5;
  *(xunknown8 *)((int8)register0x00000020 + -0x60) = 0x647a;
  uVar6 = func_0x00005730(param_3);
  if (param_5 == (int8 *)0x0) {
    *(xunknown8 *)((int8)register0x00000020 + -0x60) = 0x653b;
    iVar4 = func_0x00005758(iVar1,param_3);
    if (iVar4 == 0) {
      return 0;
    }
  }
  else if ((*(int4 *)((int8)register0x00000020 + -0x44) == 0) ||
          (*(uint8 *)((int8)register0x00000020 + -0x50) <= uVar6)) {
    if (*(uint8 *)((int8)register0x00000020 + -0x50) == uVar6) {
      iVar2 = *(int8 *)(param_1 + 8 + *(int8 *)((int8)register0x00000020 + -0x40));
      *param_5 = iVar2;
      *(xunknown8 *)((int8)register0x00000020 + -0x60) = 0x6508;
      iVar3 = func_0x00005758(iVar1,param_3);
      if (iVar3 == 0) {
        *param_2 = iVar4 + 1;
        if (iVar2 == 0) {
          *(xunknown8 *)((int8)register0x00000020 + -0x60) = 0x6559;
          func_0x00005788(1,0x7eb4,iVar1);
          return 0xffffffff;
        }
        return 0;
      }
    }
  }
  else {
    *(uint8 *)((int8)register0x00000020 + -0x50) = uVar6;
    *(xunknown8 *)((int8)register0x00000020 + -0x60) = 0x64a8;
    xVar5 = func_0x00005750(iVar1,param_3,uVar6);
    if ((int4)xVar5 == 0) {
      *param_5 = iVar1 + *(int8 *)((int8)register0x00000020 + -0x50);
      return xVar5;
    }
  }
  return 1;
}
