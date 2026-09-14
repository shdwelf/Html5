
HANDLE FUN_10003907(void)

{
  LSTATUS LVar1;
  BOOL BVar2;
  int iVar3;
  char *pcVar4;
  CHAR *pCVar5;
  undefined4 *puVar6;
  uint uVar7;
  CHAR local_4f8;
  undefined4 local_4f7;
  CHAR local_2f8;
  undefined4 local_2f7;
  _OSVERSIONINFOA local_f8;
  CHAR local_64 [2];
  CHAR aCStack_62 [45];
  undefined4 local_35 [8];
  DWORD local_14;
  DWORD local_10;
  DWORD local_c;
  undefined4 local_8;
  
  pcVar4 = s_System_CurrentControlSet_Service_1000620c;
  pCVar5 = local_64;
  for (iVar3 = 0xb; iVar3 != 0; iVar3 = iVar3 + -1) {
    *(undefined4 *)pCVar5 = *(undefined4 *)pcVar4;
    pcVar4 = pcVar4 + 4;
    pCVar5 = pCVar5 + 4;
  }
  *(undefined2 *)pCVar5 = *(undefined2 *)pcVar4;
  pCVar5[2] = pcVar4[2];
  puVar6 = local_35;
  for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  *(undefined *)puVar6 = 0;
  local_8 = DAT_10006208;
  local_2f8 = '\0';
  puVar6 = &local_2f7;
  for (iVar3 = 0x7f; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  *(undefined2 *)puVar6 = 0;
  *(undefined *)((int)puVar6 + 2) = 0;
  local_4f8 = '\0';
  puVar6 = &local_4f7;
  for (iVar3 = 0x7f; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  *(undefined2 *)puVar6 = 0;
  *(undefined *)((int)puVar6 + 2) = 0;
  local_f8.dwOSVersionInfoSize = 0x94;
  GetVersionExA(&local_f8);
  LVar1 = RegOpenKeyExA((HKEY)0x80000002,local_64,0,0x10,&DAT_100062e8);
  if ((LVar1 == 0) &&
     (DAT_100062ec = CreateEventA((LPSECURITY_ATTRIBUTES)0x0,1,0,(LPCSTR)0x0),
     DAT_100062ec != (HANDLE)0x0)) {
    uVar7 = 0;
    do {
      BVar2 = GetVolumeInformationA
                        ((LPCSTR)&local_8,&local_2f8,0x200,&local_c,&local_10,&local_14,&local_4f8,
                         0x200);
      if (BVar2 != 0) {
        memset(&local_2f8,0,0x200);
        (&DAT_100062a4)[uVar7] = 1;
      }
      local_8 = CONCAT31(local_8._1_3_,(char)local_8 + '\x01');
      uVar7 = uVar7 + 1;
    } while (uVar7 < 0x18);
    FUN_10001000(DAT_100062e8,DAT_100062ec);
    return DAT_100062ec;
  }
  return (HANDLE)0x0;
}

