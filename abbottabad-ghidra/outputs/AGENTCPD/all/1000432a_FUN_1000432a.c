
uint __cdecl FUN_1000432a(LPCSTR param_1,void *param_2,uint *param_3)

{
  int iVar1;
  void *pvVar2;
  DWORD _Seed;
  uint uVar3;
  void *_Src;
  uint *puVar4;
  undefined local_54 [11];
  ushort local_49;
  byte local_47;
  void *local_14;
  uint local_10;
  uint local_c;
  size_t local_8;
  
  iVar1 = FUN_1000461b(param_1,(int *)&local_c,(int *)&local_8);
  if (iVar1 == 0) {
LAB_10004405:
    *param_3 = 0;
    uVar3 = 0;
  }
  else {
    pvVar2 = malloc(local_8);
    if (pvVar2 == (void *)0x0) {
      *param_3 = 0;
      puVar4 = param_3;
    }
    else {
      local_14 = pvVar2;
      iVar1 = FUN_100049db(param_1,local_c,pvVar2,&local_8);
      puVar4 = param_3;
      if ((iVar1 != 5) && (local_10 = 0, local_8 != 0)) {
        do {
          iVar1 = memcmp(s_WS_TMP_1000623c,(void *)((int)pvVar2 + 1),10);
          if (iVar1 == 0) {
            _Seed = GetTickCount();
            srand(_Seed);
            local_10 = 0x40;
            iVar1 = FUN_100049db(param_1,0,local_54,&local_10);
            if (iVar1 == 0) {
              free(local_14);
              goto LAB_10004405;
            }
            _Src = malloc(*(size_t *)((int)pvVar2 + 0x1c));
            if (_Src != (void *)0x0) {
              local_c = local_c + (*(ushort *)((int)pvVar2 + 0x1a) - 2) * (uint)local_47 *
                                  (uint)local_49 + local_8;
              param_3 = *(uint **)((int)pvVar2 + 0x1c);
              iVar1 = FUN_100049db(param_1,local_c,_Src,(uint *)&param_3);
              if ((iVar1 != 0) && (iVar1 != 5)) {
                if (*puVar4 < *(uint *)((int)pvVar2 + 0x1c)) {
                  memcpy(param_2,_Src,*puVar4);
                }
                else {
                  memcpy(param_2,_Src,*(uint *)((int)pvVar2 + 0x1c));
                  *puVar4 = *(uint *)((int)pvVar2 + 0x1c);
                }
              }
              free(_Src);
            }
            break;
          }
          if (*(char *)((int)pvVar2 + 0xb) == '\0') {
            *puVar4 = 0;
            break;
          }
          local_10 = local_10 + 1;
          pvVar2 = (void *)((int)pvVar2 + 0x20);
        } while (local_10 < local_8);
      }
      free(local_14);
    }
    uVar3 = *puVar4;
  }
  return uVar3;
}

