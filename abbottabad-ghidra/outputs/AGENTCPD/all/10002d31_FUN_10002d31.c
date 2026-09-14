
LSTATUS __cdecl FUN_10002d31(HKEY param_1)

{
  HKEY pHVar1;
  LSTATUS LVar2;
  int iVar3;
  char *pcVar4;
  CHAR *pCVar5;
  CHAR local_78 [48];
  CHAR local_48 [2];
  CHAR aCStack_46 [22];
  char local_30 [4];
  char acStack_2c [4];
  char acStack_28 [4];
  char acStack_24 [4];
  char local_20 [4];
  char acStack_1c [4];
  char acStack_18 [4];
  LSTATUS local_14;
  DWORD local_10 [3];
  
  pHVar1 = param_1;
  pcVar4 = s_Software_Microsoft_Windows_NT_Cu_10006198;
  pCVar5 = local_78;
  for (iVar3 = 0xb; iVar3 != 0; iVar3 = iVar3 + -1) {
    *(undefined4 *)pCVar5 = *(undefined4 *)pcVar4;
    pcVar4 = pcVar4 + 4;
    pCVar5 = pCVar5 + 4;
  }
  *pCVar5 = *pcVar4;
  local_30 = (char  [4])s_RegisteredOwner_10006188._0_4_;
  acStack_2c = (char  [4])s_RegisteredOwner_10006188._4_4_;
  acStack_28 = (char  [4])s_RegisteredOwner_10006188._8_4_;
  acStack_24 = (char  [4])s_RegisteredOwner_10006188._12_4_;
  local_14 = -1;
  pcVar4 = s_RegisteredOrganization_10006170;
  pCVar5 = local_48;
  for (iVar3 = 5; iVar3 != 0; iVar3 = iVar3 + -1) {
    *(undefined4 *)pCVar5 = *(undefined4 *)pcVar4;
    pcVar4 = pcVar4 + 4;
    pCVar5 = pCVar5 + 4;
  }
  *(undefined2 *)pCVar5 = *(undefined2 *)pcVar4;
  pCVar5[2] = pcVar4[2];
  local_20 = (char  [4])s_ProductId_10006164._0_4_;
  acStack_1c = (char  [4])s_ProductId_10006164._4_4_;
  acStack_18._0_2_ = s_ProductId_10006164._8_2_;
  local_10[0] = 0x108;
  local_10[2] = 0;
  local_10[1] = 1;
  LVar2 = local_14;
  if (param_1 != (HKEY)0x0) {
    param_1->unused = 1;
    ((LPOSVERSIONINFOA)(param_1 + 1))->dwOSVersionInfoSize = 0x94;
    GetVersionExA((LPOSVERSIONINFOA)(param_1 + 1));
    GetSystemInfo((LPSYSTEM_INFO)(pHVar1 + 0x26));
    local_10[0] = 0x20;
    GetComputerNameA((LPSTR)(pHVar1 + 0x38),local_10);
    LVar2 = RegOpenKeyExA((HKEY)0x80000002,local_78,0,0xf003f,&param_1);
    if (LVar2 == 0) {
      local_10[2] = 0x20;
      RegQueryValueExA(param_1,local_30,(LPDWORD)0x0,local_10 + 1,(LPBYTE)(pHVar1 + 0x40),
                       local_10 + 2);
      local_10[2] = 0x20;
      RegQueryValueExA(param_1,local_48,(LPDWORD)0x0,local_10 + 1,(LPBYTE)(pHVar1 + 0x48),
                       local_10 + 2);
      local_10[2] = 0x20;
      RegQueryValueExA(param_1,local_20,(LPDWORD)0x0,local_10 + 1,(LPBYTE)(pHVar1 + 0x50),
                       local_10 + 2);
      RegCloseKey(param_1);
      LVar2 = local_14;
    }
  }
  local_14 = LVar2;
  return local_14;
}

