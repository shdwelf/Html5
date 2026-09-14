
LSTATUS __cdecl FUN_100020fb(HKEY param_1)

{
  HKEY pHVar1;
  LSTATUS LVar2;
  DWORD local_10;
  LSTATUS local_c;
  DWORD local_8;
  
  pHVar1 = param_1;
  local_c = 0;
  local_8 = 0;
  if (param_1 == (HKEY)0x0) {
    LVar2 = -1;
  }
  else {
    LVar2 = RegOpenKeyExA((HKEY)0x80000002,s_System_CurrentControlSet_Service_10006120,0,0xf003f,
                          &param_1);
    if (LVar2 == 0) {
      local_8 = 0x40;
      LVar2 = RegQueryValueExA(param_1,&DAT_1000611c,(LPDWORD)0x0,&local_10,(LPBYTE)(pHVar1 + 6),
                               &local_8);
      if (LVar2 == 0) {
        LVar2 = local_c;
      }
      RegCloseKey((HKEY)0x80000002);
    }
  }
  return LVar2;
}

