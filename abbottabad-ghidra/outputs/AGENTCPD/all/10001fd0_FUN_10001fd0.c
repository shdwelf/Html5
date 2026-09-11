
uint __cdecl FUN_10001fd0(undefined4 *param_1)

{
  int iVar1;
  undefined4 *puVar2;
  uint uVar3;
  byte *_Memory;
  
  uVar3 = 0;
  _Memory = (byte *)0x0;
  iVar1 = *(int *)((int)param_1 + 9);
  if ((iVar1 < 0x18) && (0 < iVar1)) {
    if (DAT_10006260 == '\0') {
      puVar2 = param_1;
      if (*(char *)(param_1 + 2) == DAT_10006010) {
        if ((((iVar1 == 1) || (iVar1 == 2)) || (iVar1 == 0xf)) ||
           (((iVar1 == 0x11 || (iVar1 == 0x10)) || (iVar1 == 0x13)))) {
          FUN_1000386d(param_1);
        }
        else {
          puVar2 = FUN_10001f65((int)param_1);
          if (puVar2 == (undefined4 *)0x0) {
            return 0;
          }
          _Memory = (byte *)FUN_10001455(puVar2);
        }
      }
      else {
        uVar3 = FUN_1000386d(param_1);
      }
      free(puVar2);
    }
    else {
      puVar2 = FUN_10001f65((int)param_1);
      if (puVar2 == (undefined4 *)0x0) {
        return 0;
      }
      if (*(char *)(param_1 + 2) == DAT_10006010) {
        _Memory = (byte *)FUN_10001455(puVar2);
      }
      else {
        uVar3 = FUN_1000243d(*(char *)(param_1 + 2),puVar2,puVar2[1] + 9);
      }
      free(puVar2);
    }
    if (_Memory != (byte *)0x0) {
      *(undefined4 *)(_Memory + 0xc) = *param_1;
      if (DAT_10006010 == '\0') {
        uVar3 = FUN_10004b9b(_Memory,*(int *)(_Memory + 4) + 0x11);
      }
      else {
        uVar3 = FUN_1000243d(0,_Memory,*(int *)(_Memory + 4) + 0x11);
        if (uVar3 < *(int *)(_Memory + 4) + 0x11U) {
          FUN_10001015((int *)_Memory,*param_1,(*(int *)(_Memory + 4) - uVar3) + 0x11);
        }
      }
      free(_Memory);
    }
  }
  else {
    uVar3 = 0;
  }
  return uVar3;
}

