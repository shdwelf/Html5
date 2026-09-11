
undefined4 * __cdecl FUN_100025aa(int param_1)

{
  uint uVar1;
  bool bVar2;
  int iVar3;
  uint *_Dst;
  undefined4 *_Dst_00;
  size_t _Size;
  uint *puVar4;
  undefined4 *_Dst_01;
  uint *puVar5;
  uint *local_10;
  uint local_c;
  uint local_4;
  
  _Dst_01 = (undefined4 *)0x0;
  puVar5 = (uint *)0x0;
  if (DAT_1000627c == (int *)0x0) {
    FUN_10002507();
  }
  if (param_1 != 0) {
    puVar5 = (uint *)(param_1 + 8);
    iVar3 = *puVar5 + *DAT_1000627c;
  }
  else {
    iVar3 = *DAT_1000627c;
  }
  _Dst = (uint *)malloc(iVar3 * 0x61 + 4);
  if (_Dst != (uint *)0x0) {
    memcpy(_Dst,DAT_1000627c,*DAT_1000627c * 0x61 + 4);
    if (param_1 != 0) {
      bVar2 = false;
      local_4 = 0;
      if (*puVar5 != 0) {
        local_10 = puVar5 + 1;
        do {
          uVar1 = *_Dst;
          local_c = 0;
          if (uVar1 != 0) {
            puVar4 = _Dst + 1;
            do {
              if (*(char *)local_10 == *(char *)puVar4) {
                bVar2 = true;
                break;
              }
              local_c = local_c + 1;
              puVar4 = (uint *)((int)puVar4 + 0x61);
            } while (local_c < uVar1);
          }
          if (!bVar2) {
            memcpy((void *)(uVar1 * 0x61 + 4 + (int)_Dst),local_10,0x61);
            *_Dst = *_Dst + 1;
            bVar2 = false;
          }
          local_4 = local_4 + 1;
          local_10 = (uint *)((int)local_10 + 0x61);
        } while (local_4 < *puVar5);
      }
      free(DAT_1000627c);
      DAT_1000627c = (int *)malloc(*_Dst * 0x61 + 4);
      if (DAT_1000627c != (int *)0x0) {
        memcpy(DAT_1000627c,_Dst,*_Dst * 0x61 + 4);
      }
    }
    if ((DAT_10006154 != 0) &&
       (_Dst_00 = (undefined4 *)malloc(*_Dst * 0x61 + 0xd), _Dst_00 != (undefined4 *)0x0)) {
      memset(_Dst_00,0,*_Dst * 0x61 + 0xd);
      *_Dst_00 = 0x16;
      _Size = *_Dst * 0x61 + 4;
      _Dst_00[1] = _Size;
      memcpy(_Dst_00 + 2,DAT_1000627c,_Size);
      FUN_1000243d(0xff,_Dst_00,_Dst_00[1] + 8);
      free(_Dst_00);
      if ((DAT_10006010 == '\0') &&
         (_Dst_01 = (undefined4 *)malloc(*_Dst * 0x61 + 0x16), _Dst_01 != (undefined4 *)0x0)) {
        memset(_Dst_01,0,*_Dst * 0x61 + 0x16);
        *_Dst_01 = 0x17;
        _Dst_01[2] = 0x16;
        _Dst_01[1] = *_Dst * 0x61 + 4;
        *(char *)(_Dst_01 + 4) = DAT_10006010;
        memcpy((void *)((int)_Dst_01 + 0x11),DAT_1000627c,_Dst_01[1]);
      }
    }
  }
  DAT_10006154 = 0;
  if (_Dst_01 == (undefined4 *)0x0) {
    _Dst_01 = (undefined4 *)FUN_100024d7(0x16,DAT_10006010,0xffffffff);
  }
  return _Dst_01;
}

