
void * __cdecl FUN_1000469e(LPCSTR param_1)

{
  void *pvVar1;
  int *_Src;
  int iVar2;
  uint uVar3;
  uint uVar4;
  size_t local_1c;
  int *local_18;
  uint local_14;
  uint local_10;
  size_t local_c;
  void *local_8;
  
  local_8 = (void *)0x0;
  pvVar1 = (void *)FUN_1000461b(param_1,(int *)&local_10,(int *)&local_c);
  if (pvVar1 != (void *)0x0) {
    _Src = (int *)malloc(local_c);
    if (_Src == (int *)0x0) {
      local_8 = (void *)0x0;
      pvVar1 = local_8;
    }
    else {
      local_1c = local_c;
      local_18 = _Src;
      iVar2 = FUN_100049db(param_1,local_10,_Src,&local_1c);
      if (iVar2 != 0) {
        local_14 = 0;
        uVar4 = local_c >> 5;
        uVar3 = 0;
        if (uVar4 != 0) {
          do {
            if (*_Src == -0x67bfafaf) {
              if (*(char *)(_Src + 4) == -1) {
                memset(_Src,0,0x20);
                *(undefined *)_Src = 0xe5;
                local_14 = 0x20;
                FUN_100049f6(param_1,(uint)((int)_Src + (local_10 - (int)local_18)),_Src,&local_14);
                local_8 = (void *)0x0;
                uVar3 = uVar4;
              }
              else {
                local_8 = malloc(0x20);
                uVar3 = uVar4;
                if (local_8 != (void *)0x0) {
                  memcpy(local_8,_Src,0x20);
                }
              }
            }
            if (*_Src == 0) {
              uVar3 = uVar4;
            }
            uVar3 = uVar3 + 1;
            _Src = _Src + 8;
          } while (uVar3 < uVar4);
        }
      }
      free(local_18);
      pvVar1 = local_8;
    }
  }
  return pvVar1;
}

