
undefined4 __cdecl FUN_10001e7f(HKEY param_1)

{
  LSTATUS LVar1;
  undefined4 uVar2;
  DWORD local_c;
  DWORD local_8;
  
  local_8 = 4;
  LVar1 = RegQueryValueExA(DAT_10006250,s_Status_10006088,(LPDWORD)0x0,&local_c,
                           (LPBYTE)&DAT_10006264,&local_8);
  uVar2 = DAT_10006264;
  if (((LVar1 != 0) || (local_8 != 4)) ||
     (LVar1 = RegQueryValueExA(DAT_10006250,s_Version_1000607c,(LPDWORD)0x0,&local_c,&DAT_10006010,
                               &local_8), LVar1 != 0)) {
    uVar2 = FUN_10001b1b(param_1);
  }
  return uVar2;
}

