
int __cdecl FUN_10004786(LPCSTR param_1,undefined4 *param_2,void *param_3,size_t param_4)

{
  ushort uVar1;
  ushort uVar2;
  undefined4 *_Src;
  int iVar3;
  void *pvVar4;
  DWORD DVar5;
  int iVar6;
  void *pvVar7;
  undefined local_58 [11];
  ushort local_4d;
  byte local_4b;
  undefined4 *local_18;
  undefined4 *local_14;
  void *local_10;
  undefined4 *local_c;
  uint local_8;
  
  _Src = param_2;
  if (param_2 == (undefined4 *)0x0) {
    return 0;
  }
  if (param_1 == (LPCSTR)0x0) {
    return 0;
  }
  iVar3 = FUN_1000461b(param_1,(int *)&param_2,(int *)&local_8);
  if (iVar3 == 0) {
    return 0;
  }
  local_18 = param_2;
  pvVar4 = malloc(local_8);
  if (pvVar4 == (void *)0x0) {
    return 0;
  }
  local_10 = pvVar4;
  local_14 = (undefined4 *)FUN_10004990(param_1[4]);
  if (local_14 != (undefined4 *)0x0) {
    iVar3 = FUN_100049db(param_1,(uint)param_2,pvVar4,&local_8);
    if (iVar3 == 5) goto LAB_1000492c;
    local_c = (undefined4 *)0x0;
    while (local_c < local_14) {
      iVar3 = FUN_1000493b(pvVar4,local_8,param_3,param_4);
      if (iVar3 != 0) {
        param_2 = (undefined4 *)((int)param_2 + iVar3);
        local_14 = param_2;
        DVar5 = GetTickCount();
        srand(DVar5);
        pvVar7 = (void *)(iVar3 + (int)pvVar4);
        param_4 = 0x40;
        param_3 = pvVar7;
        iVar3 = FUN_100049db(param_1,0,local_58,&param_4);
        if (iVar3 == 0) {
          free(pvVar4);
          return 0;
        }
        uVar1 = *(ushort *)((int)pvVar7 + 0x1a);
        uVar2 = *(ushort *)((int)pvVar7 + 0x14);
        *(undefined *)((int)_Src + 0x11) = 0;
        *(undefined *)((int)_Src + 0xb) = 0x18;
        *(undefined *)((int)_Src + 0x12) = 2;
        iVar3 = rand();
        iVar6 = rand();
        _Src[1] = iVar3 * iVar6;
        if (iVar3 * iVar6 == 0) {
          DVar5 = GetTickCount();
          _Src[1] = DVar5;
        }
        *(undefined *)(_Src + 4) = 2;
        _Src[3] = (undefined4 *)
                  (((uint)uVar1 + (uint)uVar2) * (uint)local_4b * (uint)local_4d + (int)local_18);
        *_Src = 0x98405051;
        memcpy(param_3,_Src,0x20);
        local_8 = 0x20;
        param_2 = local_14;
        iVar3 = FUN_100049f6(param_1,(uint)local_14,_Src,&local_8);
        pvVar4 = local_10;
        if (iVar3 == 0) {
          iVar3 = 0;
        }
        else {
          iVar3 = _Src[1];
        }
        goto LAB_1000492c;
      }
      param_2 = (undefined4 *)((int)param_2 + local_8);
      local_c = (undefined4 *)((int)local_c + local_8);
      FUN_100049db(param_1,(uint)param_2,pvVar4,&local_8);
    }
  }
  iVar3 = 0;
LAB_1000492c:
  free(pvVar4);
  return iVar3;
}

