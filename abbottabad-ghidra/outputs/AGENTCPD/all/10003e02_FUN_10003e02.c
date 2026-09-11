
undefined4 __cdecl FUN_10003e02(short param_1)

{
  byte bVar1;
  int *_Memory;
  byte *pbVar2;
  int iVar3;
  int iVar4;
  undefined4 local_c;
  uint local_8;
  
  local_c = 0xffffffff;
  local_8 = 0;
  _Memory = FUN_10003b5b();
  if (_Memory != (int *)0x0) {
    pbVar2 = (byte *)((int)_Memory + 0x16);
    iVar4 = 0x32;
    do {
      if (*(short *)(pbVar2 + -2) == param_1) {
        bVar1 = *pbVar2;
        if (bVar1 < 0x81) {
          iVar3 = (uint)bVar1 << 0xc;
        }
        else {
          iVar3 = (bVar1 + 0x1ff80) * 0x8000;
        }
        *pbVar2 = 0;
        pbVar2[-0xffffffff00000002] = 0;
        pbVar2[-0xffffffff00000001] = 0;
        pbVar2[1] = 0;
        pbVar2[2] = 0;
        pbVar2[3] = 0;
        pbVar2[4] = 0;
        pbVar2[-4] = 0;
        pbVar2[-3] = 0;
        *(int *)((int)_Memory + 6) = *(int *)((int)_Memory + 6) + -1;
        *(int *)((int)_Memory + 0xe) = *(int *)((int)_Memory + 0xe) + iVar3;
        *(int *)((int)_Memory + 10) = *(int *)((int)_Memory + 10) - iVar3;
      }
      pbVar2 = pbVar2 + 9;
      iVar4 = iVar4 + -1;
    } while (iVar4 != 0);
    local_8 = 0x1d4;
    FUN_100049f6(&DAT_100062c0,*(uint *)(DAT_100062f0 + 0xc),_Memory,&local_8);
    if (local_8 == 0x1d4) {
      local_c = 0;
    }
    free(_Memory);
  }
  return local_c;
}

