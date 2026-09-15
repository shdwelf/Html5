
undefined4 __cdecl FUN_1000316f(uint param_1)

{
  undefined4 *puVar1;
  size_t *psVar2;
  size_t _Size;
  undefined4 *puVar3;
  void *_Src;
  char *lpLibFileName;
  int iVar4;
  HMODULE hModule;
  FARPROC pFVar5;
  FARPROC pFVar6;
  undefined4 *_Memory;
  uint uVar7;
  undefined4 local_14;
  
  uVar7 = param_1;
  local_14 = 0;
  if (param_1 == 0) {
    local_14 = 0;
  }
  else {
    param_1 = 1000000;
    _Src = malloc(1000000);
    if (_Src != (void *)0x0) {
      lpLibFileName = (char *)malloc(*(int *)(uVar7 + 9) + 1);
      if (lpLibFileName != (char *)0x0) {
        lpLibFileName[*(int *)(uVar7 + 9)] = '\0';
        memcpy(lpLibFileName,(void *)(uVar7 + 0xd),*(size_t *)(uVar7 + 9));
        iVar4 = FUN_10003310(lpLibFileName,_Src,&param_1);
        if (iVar4 != 0) {
          hModule = LoadLibraryA(lpLibFileName);
          if (hModule != (HMODULE)0x0) {
            pFVar5 = GetProcAddress(hModule,(LPCSTR)0x1);
            pFVar6 = GetProcAddress(hModule,(LPCSTR)0x2);
            if ((((pFVar5 != (FARPROC)0x0) && (pFVar6 != (FARPROC)0x0)) &&
                (puVar1 = (undefined4 *)(*(int *)(uVar7 + 9) + 0xd + uVar7),
                puVar1 != (undefined4 *)0x0)) && (iVar4 = (*pFVar5)(*puVar1), iVar4 != 0)) {
              psVar2 = (size_t *)(*(int *)(uVar7 + 9) + 0x11 + uVar7);
              _Size = *(int *)(*(int *)(uVar7 + 9) + 0x11 + uVar7) + 0x17 + param_1;
              _Memory = (undefined4 *)malloc(_Size);
              if (_Memory != (undefined4 *)0x0) {
                *_Memory = 0xe;
                _Memory[1] = _Size - 9;
                _Memory[2] = param_1;
                memcpy(_Memory + 3,_Src,param_1);
                puVar3 = (undefined4 *)(_Memory[2] + 0xc + (int)_Memory);
                if (puVar3 != (undefined4 *)0x0) {
                  *puVar3 = *puVar1;
                }
                iVar4 = _Memory[2];
                *(size_t *)(iVar4 + 0x10 + (int)_Memory) = *psVar2;
                memcpy((void *)((int)_Memory + iVar4 + 0x14),psVar2 + 1,*psVar2);
                uVar7 = FUN_1000243d(*(undefined *)(uVar7 + 8),_Memory,_Size);
                if (uVar7 != 0) {
                  local_14 = FUN_100024d7(0xf,DAT_10006010,1);
                }
                free(_Memory);
              }
            }
            FreeLibrary(hModule);
          }
          free(lpLibFileName);
        }
      }
      free(_Src);
    }
  }
  return local_14;
}

