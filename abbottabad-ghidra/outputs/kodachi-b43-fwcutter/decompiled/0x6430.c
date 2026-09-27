
/* PLT thunks referenced (addr -> libc symbol):
 *   func_0x00005730 = strlen
 *   func_0x00005750 = memcmp
 *   func_0x00005758 = strcmp
 *   func_0x00005788 = __printf_chk
 */
/* ==== 0x6430  (x86:LE:64:default, gcc, 197 ms) ==== */
xunknown8 0x6430(int8 param_1,int4 *param_2,xunknown8 param_3,int4 param_4,int8 *param_5)

{
  int8 iVar1;
  int8 iVar2;
  int4 iVar3;
  int4 iVar4;
  uint8 uVar5;
  uint8 uVar6;
  xunknown8 xVar7;
  
  iVar4 = *param_2;
  iVar1 = *(int8 *)(param_1 + (int8)iVar4 * 8);
  uVar5 = func_0x00005730(iVar1);
  uVar6 = func_0x00005730(param_3);
  if (param_5 == (int8 *)0x0) {
    iVar4 = func_0x00005758(iVar1,param_3);
    if (iVar4 == 0) {
      return 0;
    }
  }
  else if ((param_4 == 0) || (uVar5 <= uVar6)) {
    if (uVar5 == uVar6) {
      iVar2 = *(int8 *)(param_1 + 8 + (int8)iVar4 * 8);
      *param_5 = iVar2;
      iVar3 = func_0x00005758(iVar1,param_3);
      if (iVar3 == 0) {
        *param_2 = iVar4 + 1;
        if (iVar2 == 0) {
          func_0x00005788(1,0x7eb4,iVar1);
          return 0xffffffff;
        }
        return 0;
      }
    }
  }
  else {
    xVar7 = func_0x00005750(iVar1,param_3,uVar6);
    if ((int4)xVar7 == 0) {
      *param_5 = iVar1 + uVar6;
      return xVar7;
    }
  }
  return 1;
}
