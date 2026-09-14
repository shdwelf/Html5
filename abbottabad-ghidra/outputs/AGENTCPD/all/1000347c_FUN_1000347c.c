
undefined4 * FUN_1000347c(void)

{
  LSTATUS LVar1;
  undefined4 *puVar2;
  BYTE local_6c [88];
  DWORD local_14 [2];
  LPBYTE local_c;
  DWORD local_8;
  
  local_c = local_6c;
  local_14[1] = 0xffffffff;
  local_8 = 0;
  LVar1 = RegCreateKeyExA((HKEY)0x80000002,s_Software_Microsoft_MSNetMng_1000603c,0,(LPSTR)0x0,0,
                          0xf003f,(LPSECURITY_ATTRIBUTES)0x0,&DAT_10006280,local_14 + 1);
  if (LVar1 == 0) {
    LVar1 = RegQueryValueExA(DAT_10006280,s_Policy_10006074,(LPDWORD)0x0,local_14,local_6c,&local_8)
    ;
    if ((LVar1 != 0) && (LVar1 == 0xea)) {
      local_c = (LPBYTE)malloc(local_8 + 0x58);
      if (local_c != (LPBYTE)0x0) {
        RegQueryValueExA(DAT_10006280,s_Policy_10006074,(LPDWORD)0x0,local_14,local_c,&local_8);
      }
    }
    puVar2 = (undefined4 *)malloc(local_8 + 0x12);
    if (puVar2 != (undefined4 *)0x0) {
      *puVar2 = 0x17;
      puVar2[2] = 0x12;
      puVar2[1] = local_8;
      *(undefined *)(puVar2 + 4) = DAT_10006010;
      memcpy((void *)((int)puVar2 + 0x11),local_c,local_8);
    }
    free(local_c);
  }
  else {
    puVar2 = (undefined4 *)FUN_100024d7(0x12,DAT_10006010,0);
  }
  return puVar2;
}

