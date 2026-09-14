
undefined4 __cdecl FUN_10002254(undefined4 param_1,int param_2,undefined4 param_3)

{
  undefined4 uVar1;
  undefined4 uVar2;
  byte *_Memory;
  size_t sVar3;
  
  uVar2 = (*DAT_10006254)(param_3);
  _Memory = (byte *)malloc(0x17);
  if (_Memory == (byte *)0x0) {
    return uVar2;
  }
  _Memory[4] = 5;
  _Memory[5] = 0;
  _Memory[6] = 0;
  _Memory[7] = 0;
  _Memory[0] = 0x17;
  _Memory[1] = 0;
  _Memory[2] = 0;
  _Memory[3] = 0;
  _Memory[8] = 2;
  _Memory[9] = 0;
  _Memory[10] = 0;
  _Memory[0xb] = 0;
  uVar1 = *(undefined4 *)(param_2 + 4);
  _Memory[0x10] = 0;
  *(undefined4 *)(_Memory + 0xc) = uVar1;
  _Memory[0x11] = (byte)param_3;
  _Memory[0x15] = (byte)param_3;
  *(undefined4 *)(_Memory + 0x11) = uVar2;
  if (DAT_10006010 == '\0') {
    sVar3 = FUN_10004b9b(_Memory,0x17);
    if (sVar3 == 0) goto LAB_100022ca;
  }
  else {
    FUN_1000243d(0,_Memory,*(int *)(_Memory + 4) + 0x11);
  }
  uVar2 = 1;
LAB_100022ca:
  free(_Memory);
  return uVar2;
}

