
undefined * __cdecl FUN_100029fd(int param_1)

{
  int *piVar1;
  uint uVar2;
  uint uVar3;
  uint _Size;
  LPCSTR lpLibFileName;
  HMODULE hModule;
  code *pcVar4;
  
  pcVar4 = (code *)0x0;
  if (param_1 != 0) {
    lpLibFileName = (LPCSTR)malloc(*(size_t *)(param_1 + 4));
    if (lpLibFileName == (LPCSTR)0x0) {
      return (undefined *)0x0;
    }
    uVar2 = *(uint *)(param_1 + 8);
    uVar3 = *(uint *)(param_1 + 4);
    if (uVar2 <= uVar3) {
      piVar1 = (int *)(uVar2 + 0xc + param_1);
      _Size = *(uint *)(uVar2 + 0xc + param_1);
      if ((_Size <= uVar3) && (*(uint *)(uVar2 + _Size + 0x10 + param_1) <= uVar3)) {
        memcpy(lpLibFileName,piVar1 + 1,_Size);
        lpLibFileName[*piVar1] = '\0';
        hModule = LoadLibraryA(lpLibFileName);
        if (hModule != (HMODULE)0x0) {
          DAT_100062e4 = GetProcAddress(hModule,(LPCSTR)0x3);
          if (DAT_100062e4 == (FARPROC)0x0) {
            FreeLibrary(hModule);
          }
          else {
            pcVar4 = FUN_100024bd;
          }
        }
        free(lpLibFileName);
        return pcVar4;
      }
    }
    free(lpLibFileName);
  }
  return (undefined *)0x0;
}

