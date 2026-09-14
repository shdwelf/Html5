
undefined4 __cdecl FUN_10003fda(undefined4 *param_1,uint *param_2,short param_3)

{
  byte bVar1;
  int iVar2;
  int *_Memory;
  uint uVar3;
  void *pvVar4;
  int *piVar5;
  size_t _Size;
  undefined4 local_8;
  
  local_8 = 0xffffffff;
  _Memory = FUN_10003b5b();
  if (_Memory != (int *)0x0) {
    uVar3 = 0;
    piVar5 = _Memory + 5;
    do {
      if (*(short *)piVar5 == param_3) {
        iVar2 = *(int *)((int)_Memory + uVar3 * 9 + 0x17);
        bVar1 = *(byte *)((int)_Memory + uVar3 * 9 + 0x16);
        if (bVar1 < 0x81) {
          _Size = (uint)bVar1 << 0xc;
        }
        else {
          _Size = (bVar1 + 0x1ff80) * 0x8000;
        }
        if (_Size != 0) {
          pvVar4 = malloc(_Size);
          *param_1 = pvVar4;
          if (pvVar4 != (void *)0x0) {
            *param_2 = _Size;
            FUN_100049db(&DAT_100062c0,*(int *)(DAT_100062f0 + 0xc) + iVar2,(void *)*param_1,param_2
                        );
            local_8 = 0;
          }
          FUN_10003e02(param_3);
        }
        break;
      }
      uVar3 = uVar3 + 1;
      piVar5 = (int *)((int)piVar5 + 9);
    } while (uVar3 < 0x32);
    free(_Memory);
  }
  return local_8;
}

