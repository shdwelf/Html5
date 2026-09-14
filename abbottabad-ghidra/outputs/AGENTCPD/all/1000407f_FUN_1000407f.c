
undefined4 __cdecl FUN_1000407f(undefined4 *param_1)

{
  int *piVar1;
  undefined4 uVar2;
  
  uVar2 = 0xffffffff;
  piVar1 = FUN_10003b5b();
  if (piVar1 != (int *)0x0) {
    uVar2 = 0;
    *param_1 = piVar1;
  }
  return uVar2;
}

