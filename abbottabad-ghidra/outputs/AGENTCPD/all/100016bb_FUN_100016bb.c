
int __cdecl FUN_100016bb(int param_1)

{
  DWORD DVar1;
  HANDLE hFindFile;
  BOOL BVar2;
  char local_558 [260];
  _WIN32_FIND_DATAA local_454;
  char local_314 [260];
  char local_210 [260];
  CHAR local_10c [260];
  int local_8;
  
  local_8 = 0;
  memset(local_314,0,0x104);
  strncpy(local_314,(char *)(param_1 + 4),0x104);
  strcat(local_314,s__restore__10006030);
  DVar1 = GetTempPathA(0x104,local_10c);
  if (DVar1 != 0) {
    strncpy(local_210,local_314,0x104);
    strncpy(local_558,local_314,0x104);
    strcat(local_314,s___bmp_10006028);
    memset(&local_454,0,0x140);
    hFindFile = FindFirstFileA(local_314,&local_454);
    if (hFindFile != (HANDLE)0xffffffff) {
      local_8 = 1;
      strcat(local_210,local_454.cFileName);
      strcat(local_10c,local_454.cFileName);
      CopyFileA(local_210,local_10c,0);
      while( true ) {
        BVar2 = FindNextFileA(hFindFile,&local_454);
        if (BVar2 == 0) break;
        local_8 = local_8 + 1;
        memset(local_210,0,0x104);
        strncpy(local_210,local_558,0x104);
        strcat(local_210,local_454.cFileName);
        memset(local_10c,0,0x104);
        GetTempPathA(0x104,local_10c);
        strcat(local_10c,local_454.cFileName);
        MoveFileA(local_210,local_10c);
      }
      FindClose(hFindFile);
    }
  }
  return local_8;
}

