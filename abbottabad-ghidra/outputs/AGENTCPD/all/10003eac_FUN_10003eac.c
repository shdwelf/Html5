
undefined4 __cdecl FUN_10003eac(undefined *param_1,uint param_2,undefined2 *param_3)

{
  int *_Memory;
  int iVar1;
  char *pcVar2;
  undefined4 uVar3;
  uint uVar4;
  uint local_10;
  uint local_c;
  char local_5;
  
  local_c = 0;
  local_5 = '\0';
  _Memory = FUN_10003b5b();
  if (_Memory == (int *)0x0) {
    uVar3 = 0xffffffff;
  }
  else {
    iVar1 = FUN_10003bc8(param_2,(uint)_Memory);
    if (iVar1 == 0) {
      uVar3 = 0xfffffffe;
    }
    else {
      *param_3 = *(undefined2 *)(_Memory + 1);
      *(undefined2 *)(param_1 + 6) = *(undefined2 *)(_Memory + 1);
      local_10 = param_2;
      FUN_100049f6(&DAT_100062c0,*(int *)(DAT_100062f0 + 0xc) + iVar1,param_1,&local_10);
      uVar4 = 0;
      pcVar2 = (char *)((int)_Memory + 0x16);
      do {
        if (*pcVar2 == '\0') {
          if (param_2 < 0x1001) {
            local_c = 1;
          }
          else {
            local_5 = '\x01';
            local_c = (param_2 >> 0xf) + 1 | 0x80;
          }
          *(char *)((int)_Memory + uVar4 * 9 + 0x16) = (char)local_c;
          *(undefined2 *)((int)_Memory + uVar4 * 9 + 0x14) = *(undefined2 *)(_Memory + 1);
          *(int *)((int)_Memory + uVar4 * 9 + 0x17) = iVar1;
          *(undefined *)((int)_Memory + uVar4 * 9 + 0x12) = *param_1;
          *(undefined *)((int)_Memory + uVar4 * 9 + 0x13) = param_1[1];
          break;
        }
        uVar4 = uVar4 + 1;
        pcVar2 = pcVar2 + 9;
      } while (uVar4 < 0x32);
      *(int *)((int)_Memory + 6) = *(int *)((int)_Memory + 6) + 1;
      *(short *)(_Memory + 1) = *(short *)(_Memory + 1) + 1;
      if (local_5 == '\0') {
        iVar1 = 0xc;
      }
      else {
        iVar1 = 0xf;
      }
      *(int *)((int)_Memory + 10) = *(int *)((int)_Memory + 10) + (local_c << iVar1);
      *(int *)((int)_Memory + 0xe) = *(int *)((int)_Memory + 0xe) - (local_c << iVar1);
      local_10 = 0x1d4;
      FUN_100049f6(&DAT_100062c0,*(uint *)(DAT_100062f0 + 0xc),_Memory,&local_10);
      if (local_10 == 0x512) {
        _Memory = FUN_10003b5b();
      }
      free(_Memory);
      uVar3 = 0;
    }
  }
  return uVar3;
}

