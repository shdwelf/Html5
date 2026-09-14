
LSTATUS __cdecl FUN_10002174(undefined4 param_1)

{
  BYTE *_Dst;
  uint uVar1;
  _SYSTEMTIME local_68;
  undefined4 local_58;
  undefined4 local_54;
  DWORD local_10;
  LSTATUS local_c;
  DWORD local_8;
  
  local_8 = 0;
  memset(&local_68,0,0x58);
  FUN_100020fb((HKEY)&local_68);
  local_c = RegQueryValueExA(DAT_10006250,s_Policy_10006074,(LPDWORD)0x0,&local_10,(LPBYTE)&local_68
                             ,&local_8);
  if (local_c != 0) {
    GetSystemTime(&local_68);
    local_54 = 1;
    local_58 = param_1;
    if ((local_c == 0xea) && (_Dst = (BYTE *)malloc(local_8 + 0x58), _Dst != (BYTE *)0x0)) {
      local_c = RegQueryValueExA(DAT_10006250,s_Policy_10006074,(LPDWORD)0x0,&local_10,_Dst + 0x58,
                                 &local_8);
      if (local_c == 0) {
        memcpy(_Dst,&local_68,0x58);
        uVar1 = FUN_10004c58(_Dst,local_8 + 0x58,DAT_10006250,s_Policy_10006074);
        if (uVar1 != 0) {
          local_c = 0;
        }
      }
      free(_Dst);
    }
  }
  return local_c;
}

