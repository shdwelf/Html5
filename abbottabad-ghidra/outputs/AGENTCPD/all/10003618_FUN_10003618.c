
uint __cdecl FUN_10003618(HKEY param_1)

{
  HKEY hKey;
  LSTATUS LVar1;
  int iVar2;
  undefined4 *puVar3;
  BYTE local_20c;
  undefined4 local_20b;
  DWORD local_c;
  BYTE local_8 [4];
  
  hKey = param_1;
  local_20c = '\0';
  puVar3 = &local_20b;
  for (iVar2 = 0x7f; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  *(undefined2 *)puVar3 = 0;
  *(undefined *)((int)puVar3 + 2) = 0;
  if (param_1 != (HKEY)0x0) {
    DAT_10006288 = param_1;
    param_1 = (HKEY)0x200;
    LVar1 = RegQueryValueExA(hKey,&DAT_10006084,(LPDWORD)0x0,&local_c,&local_20c,(LPDWORD)&param_1);
    if (LVar1 == 0) {
      if (param_1 != (HKEY)0x0) {
        FUN_1000386d(&local_20c);
      }
    }
    else {
      LVar1 = RegSetValueExA(hKey,&DAT_10006084,0,3,local_8,4);
      if (LVar1 != 0) {
        return 0;
      }
    }
    DAT_1000628c = CreateEventA((LPSECURITY_ATTRIBUTES)0x0,1,0,(LPCSTR)0x0);
    if (DAT_1000628c != (HANDLE)0x0) {
      LVar1 = RegNotifyChangeKeyValue(hKey,1,0xf,DAT_1000628c,1);
      return ~-(uint)(LVar1 != 0) & (uint)DAT_1000628c;
    }
  }
  return 0;
}

