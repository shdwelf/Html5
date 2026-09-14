
undefined4 FUN_10001a85(void)

{
  LSTATUS LVar1;
  undefined4 uVar2;
  DWORD local_8;
  HKEY local_4;
  
  local_8 = 0xffffffff;
  local_4 = (HKEY)0x80000002;
  LVar1 = RegCreateKeyExA((HKEY)0x80000002,s_Software_Microsoft_MSNetMng_1000603c,0,(LPSTR)0x0,0,
                          0xf003f,(LPSECURITY_ATTRIBUTES)0x0,(PHKEY)&DAT_10006250,&local_8);
  if (LVar1 != 0) {
    local_4 = (HKEY)0x80000001;
    LVar1 = RegCreateKeyExA((HKEY)0x80000001,s_Software_Microsoft_MSNetMng_1000603c,0,(LPSTR)0x0,0,
                            0xf003f,(LPSECURITY_ATTRIBUTES)0x0,(PHKEY)&DAT_10006250,&local_8);
    if (LVar1 != 0) {
      DAT_10006264 = 2;
    }
  }
  if (local_8 == 1) {
    uVar2 = FUN_10001b1b(local_4);
  }
  else if (local_8 == 2) {
    uVar2 = FUN_10001e7f(local_4);
  }
  else {
    uVar2 = 0xffffffff;
  }
  return uVar2;
}

