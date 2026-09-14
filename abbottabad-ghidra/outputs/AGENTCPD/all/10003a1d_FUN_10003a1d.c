
char __cdecl FUN_10003a1d(char *param_1)

{
  HANDLE pvVar1;
  BOOL BVar2;
  int iVar3;
  undefined4 *puVar4;
  CHAR local_418;
  undefined4 local_417;
  CHAR local_218;
  undefined4 local_217;
  DWORD local_18;
  DWORD local_14;
  DWORD local_10;
  undefined4 local_c;
  byte local_6;
  char local_5;
  
  local_218 = '\0';
  local_c = DAT_10006208;
  puVar4 = &local_217;
  for (iVar3 = 0x7f; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar4 = 0;
    puVar4 = puVar4 + 1;
  }
  local_418 = '\0';
  *(undefined2 *)puVar4 = 0;
  *(undefined *)((int)puVar4 + 2) = 0;
  puVar4 = &local_417;
  for (iVar3 = 0x7f; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar4 = 0;
    puVar4 = puVar4 + 1;
  }
  local_5 = '\0';
  local_6 = 0;
  *(undefined2 *)puVar4 = 0;
  *(undefined *)((int)puVar4 + 2) = 0;
  Sleep(0x32);
  local_c._0_1_ = 'c';
  do {
    if (0x27 < local_6) break;
    iVar3 = 0;
    do {
      memset(&local_218,0,0x200);
      BVar2 = GetVolumeInformationA
                        ((LPCSTR)&local_c,&local_218,0x200,&local_14,&local_18,&local_10,&local_418,
                         0x200);
      pvVar1 = DAT_100062ec;
      if (BVar2 == 0) {
        if ((&DAT_100062a4)[iVar3] == '\x01') {
          (&DAT_100062a4)[iVar3] = 0;
          DAT_10006260 = 0;
          local_5 = '\x02';
          *param_1 = (char)iVar3 + 'c';
        }
      }
      else if ((&DAT_100062a4)[iVar3] == '\0') {
        (&DAT_100062a4)[iVar3] = 1;
        DAT_10006260 = 1;
        FUN_10001000(DAT_100062e8,pvVar1);
        *param_1 = (char)iVar3 + 'c';
        return '\x01';
      }
      local_c._0_1_ = (char)local_c + '\x01';
      iVar3 = iVar3 + 1;
    } while (iVar3 < 0x18);
    local_c._0_1_ = (char)local_c - (char)iVar3;
    local_6 = local_6 + 1;
    Sleep(200);
  } while (local_5 == '\0');
  FUN_10001000(DAT_100062e8,DAT_100062ec);
  return local_5;
}

