/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: JCreatorSetup.exe
 * SHA-256: 1546e96d111900c5293459b4f3bc03e60e3351b1a741b1356a57b86e2f08c98f
 *
 * Selection is driven by the JDK probe: functions that reference
 * registry, tool-name, flag and process-creation strings first.
 */

/* FUN_004021a3 @ 004021a3
 * references registry string "currentversion" at 0040d130 */

void FUN_004021a3(void)

{
  BYTE BVar1;
  short sVar2;
  uint uVar3;
  HANDLE pvVar4;
  HRESULT HVar5;
  BOOL BVar6;
  LPITEMIDLIST pIVar7;
  size_t sVar8;
  HKEY hKey;
  LSTATUS LVar9;
  uint local_18c [90];
  uint *local_24;
  LPCITEMIDLIST local_20;
  int local_1c;
  int local_18;
  uint local_14;
  undefined2 local_10;
  undefined2 local_e;
  int local_c;
  HKEY local_8;
  
  FUN_0040121f(DAT_0040d058);
  if (DAT_0040da34 == 0) {
    if (*DAT_0040d9e4 == '\0') {
      FUN_00403e75((HANDLE)0xffffffff);
    }
    else {
      pvVar4 = FUN_00401000((LPCSTR)DAT_0040d9e4,2);
      FUN_0040113a(pvVar4,0);
      local_1c = FUN_00401103(pvVar4);
      local_10 = 0x1235;
      local_e = 0;
      local_c = 0;
      FUN_00405cca(DAT_0040d9f4);
      local_18 = 0;
      FUN_004010cd(pvVar4,&local_18,(LPCVOID)0x4);
      local_8 = (HKEY)0x0;
      pIVar7 = DAT_0040da28;
      if (DAT_0040da2c != (HKEY)0x0) {
        do {
          FUN_00402585(pIVar7);
          sVar2 = *(short *)((int)&pIVar7[1].mkid.cb + 1);
          if (((sVar2 == 0x17) || (sVar2 == 0x19)) && (pIVar7[3].mkid.abID[0] == '\x01')) {
            BVar1 = pIVar7[2].mkid.abID[0];
            uVar3 = local_14 >> 8;
            local_14 = local_14 & 0xffffff00;
            if ((BVar1 != '\0') && (*(char *)((int)&pIVar7[3].mkid.cb + 1) == '\x01')) {
              local_14 = CONCAT31((int3)uVar3,1);
            }
            if (BVar1 == '\x03') {
              local_14 = local_14 | 2;
            }
            if ((char)pIVar7[4].mkid.cb == '\x02') {
              local_14 = local_14 | 4;
            }
            FUN_0040208f(pvVar4);
            local_18 = local_18 + 1;
          }
          local_24 = (uint *)FUN_00402550((int)pIVar7,4);
          if ((((char)*local_24 != '\0') &&
              (HVar5 = SHGetSpecialFolderLocation((HWND)0x0,0,&local_20), HVar5 == 0)) &&
             (BVar6 = SHGetPathFromIDListA(local_20,(LPSTR)DAT_0040d9f0), BVar6 != 0)) {
            FUN_00405cca(DAT_0040d9f0);
            FUN_00407ac0(DAT_0040d9f0,local_24);
            FUN_00407ac0(DAT_0040d9f0,(uint *)&DAT_0040d168);
            FUN_0040208f(pvVar4);
            local_18 = local_18 + 1;
          }
          local_8 = (HKEY)((int)&local_8->unused + 1);
          pIVar7 = (LPITEMIDLIST)FUN_00401d69((int *)pIVar7);
        } while (local_8 < DAT_0040da2c);
      }
      local_c = FUN_00401103(pvVar4);
      local_c = local_c - local_1c;
      FUN_00401114(pvVar4,local_1c + -8);
      FUN_004010cd(pvVar4,&local_10,(LPCVOID)0x8);
      FUN_004010cd(pvVar4,&local_18,(LPCVOID)0x4);
      FUN_00401127(pvVar4,local_c + -4);
      FUN_00403e75(pvVar4);
      if ((DAT_0040da8c != (uint *)0x0) && ((char)*DAT_0040da8c != '\0')) {
        FUN_00407ab0(local_18c,(uint *)s_Software_Microsoft_Windows_Curre_0040d130);
        FUN_00407ac0(local_18c,DAT_0040da8c);
        RegCreateKeyA((HKEY)0x80000002,(LPCSTR)local_18c,&local_8);
        sVar8 = _strlen((char *)DAT_0040da8c);
        RegSetValueExA(local_8,s_DisplayName_0040d124,0,1,(BYTE *)DAT_0040da8c,sVar8);
        sVar8 = _strlen((char *)DAT_0040d9e4);
        RegSetValueExA(local_8,s_UninstallString_0040d114,0,1,DAT_0040d9e4,sVar8);
        RegCloseKey(local_8);
        local_10 = 0x1238;
        local_e = 0;
        sVar8 = _strlen((char *)local_18c);
        local_c = sVar8 + 6;
        FUN_004010cd(pvVar4,&local_10,(LPCVOID)0x8);
        local_1c = -0x7ffffffe;
        FUN_004010cd(pvVar4,&local_1c,(LPCVOID)0x4);
        FUN_00402167(pvVar4,(char *)local_18c);
      }
      FUN_00401103(pvVar4);
      local_10 = 0x7f7f;
      local_e = 0;
      local_c = 0;
      FUN_004010cd(pvVar4,&local_10,(LPCVOID)0x8);
      FUN_0040121f(pvVar4);
    }
    FUN_00405cf1((char *)DAT_0040d9f4);
    if (((DAT_0040da98 & 4) != 0) && (DAT_0040da7c != (LPCSTR)0x0)) {
      sVar8 = _strlen((char *)DAT_0040d9f4);
      hKey = DAT_0040d060;
      if (DAT_0040da80 < 0x10) {
        hKey = *(HKEY *)(&DAT_0040d05c + DAT_0040da80 * 4);
      }
      LVar9 = RegCreateKeyA(hKey,DAT_0040da7c,&local_8);
      if (LVar9 == 0) {
        RegSetValueExA(local_8,DAT_0040da78,0,1,(BYTE *)DAT_0040d9f4,sVar8 + 1);
        RegCloseKey(local_8);
      }
    }
    if (((((DAT_0040da98 & 8) != 0) && (DAT_0040da74 != (LPCSTR)0x0)) &&
        (DAT_0040da70 != (LPCSTR)0x0)) && (DAT_0040da6c != (LPCSTR)0x0)) {
      WritePrivateProfileStringA(DAT_0040da70,DAT_0040da6c,(LPCSTR)DAT_0040d9f4,DAT_0040da74);
      WritePrivateProfileStringA((LPCSTR)0x0,(LPCSTR)0x0,(LPCSTR)0x0,DAT_0040da74);
    }
    FUN_00405cca(DAT_0040d9f4);
  }
  if (DAT_0040d042 == -1) {
    FUN_004017d5(5);
  }
  DAT_0040da08 = 0;
  return;
}



/* FUN_00402936 @ 00402936
 * references registry string "currentversion" at 0040d194 */

HKEY FUN_00402936(void)

{
  BYTE *pBVar1;
  USHORT UVar2;
  LPITEMIDLIST pIVar3;
  DWORD DVar4;
  HANDLE pvVar5;
  size_t sVar6;
  FILETIME *lpCreationTime;
  LSTATUS LVar7;
  HMODULE hModule;
  FARPROC pFVar8;
  uint *puVar9;
  char *pcVar10;
  HRESULT HVar11;
  BOOL BVar12;
  int iVar13;
  LPITEMIDLIST pIVar14;
  uint local_224 [34];
  undefined4 local_19c [96];
  uint local_1c;
  int local_18;
  DWORD local_14;
  HKEY local_10;
  LPITEMIDLIST local_c;
  uint local_8;
  
  pIVar3 = DAT_0040da00;
  DAT_0040da04 = DAT_0040da04 + 1;
  local_10 = (HKEY)0x0;
  local_18 = 0;
  pIVar14 = (LPITEMIDLIST)0x0;
  if (DAT_0040da2c <= DAT_0040da04) goto LAB_00402dcd;
  DAT_0040da00 = (LPITEMIDLIST)FUN_00401d69((int *)DAT_0040da00);
  *(undefined2 *)((int)&pIVar3[1].mkid.cb + 1) = 0;
  pBVar1 = pIVar3[4].mkid.abID;
  *(uint *)pBVar1 = *(uint *)pBVar1 ^ DAT_0040da40;
  *(undefined1 *)DAT_0040d9ec = 0;
  local_8 = FUN_00402585(pIVar3);
  FUN_00405bb0(DAT_0040d9f0);
  if ((pIVar3[4].mkid.cb & 0x100) != 0) {
    FUN_00407ab0(DAT_0040d9e4,DAT_0040d9f0);
  }
  local_1c = ((DAT_0040da04 + 1) * 100) / DAT_0040da2c;
  pIVar14 = pIVar3;
  if (pIVar3[3].mkid.abID[0] == '\x02') {
LAB_00402d1a:
    if ((char)pIVar3[3].mkid.cb == '\x01') {
      DAT_0040da14 = pIVar3;
    }
    if ((char)pIVar3[3].mkid.cb == '\x02') {
      DAT_0040da10 = pIVar3;
    }
    puVar9 = (uint *)FUN_00402550((int)pIVar3,4);
    if ((char)*puVar9 != '\0') {
      pcVar10 = FUN_00402550((int)pIVar3,5);
      HVar11 = SHGetSpecialFolderLocation((HWND)0x0,0,&local_c);
      if ((HVar11 == 0) && (BVar12 = SHGetPathFromIDListA(local_c,(LPSTR)local_224), BVar12 != 0)) {
        FUN_00405cca(local_224);
        FUN_00407ac0(local_224,puVar9);
        FUN_00407ac0(local_224,(uint *)&DAT_0040d168);
        FUN_0040162b(DAT_0040d9f0,(LPCSTR)local_224,pcVar10,0);
      }
    }
    FUN_00405b8f(local_1c);
    local_10 = (HKEY)0x1;
LAB_00402dc7:
    if (local_10 != (HKEY)0x0) goto LAB_00402dde;
  }
  else {
    iVar13 = 1;
    if (local_8 == 0) {
LAB_00402a2c:
      if ((pIVar3[4].mkid.cb & 0x600) != 0) {
        iVar13 = FUN_004027ca((LPSTR)pIVar3);
      }
    }
    else {
      if (pIVar3[2].mkid.abID[0] != '\x03') {
        local_14 = 0;
        pvVar5 = FUN_00401000((LPCSTR)DAT_0040d9f0,0);
        if (pvVar5 != (HANDLE)0xffffffff) {
          DVar4 = FUN_0040114d(pvVar5);
          if (DVar4 == *(DWORD *)(pIVar3 + 6)) {
            FUN_004039ed(pvVar5,(int *)&local_14,&local_c);
          }
          FUN_0040121f(pvVar5);
        }
        if (local_14 != *(DWORD *)pIVar3[4].mkid.abID) goto LAB_00402a2c;
      }
      iVar13 = 0;
    }
    DAT_0040da34 = 0;
    FUN_004073d3(local_19c);
    if (iVar13 == 0) {
      FUN_0040745c(local_19c,0xffffffff,DAT_0040d058,*(undefined4 *)((int)&pIVar3[7].mkid.cb + 1));
LAB_00402c05:
      thunk_FUN_00407528(local_19c);
      if (DAT_0040da34 == 0) {
        if ((pIVar3[4].mkid.cb & 0x100) != 0) {
          *(undefined2 *)((int)&pIVar3[1].mkid.cb + 1) = 0;
        }
        if (((pIVar3[2].mkid.abID[0] != '\0') && (*(char *)((int)&pIVar3[3].mkid.cb + 1) == '\x01'))
           && (LVar7 = RegOpenKeyExA((HKEY)0x80000002,s_Software_Microsoft_Windows_Curre_0040d194,0,
                                     0xf003f,&local_10), LVar7 == 0)) {
          local_8 = 1;
          local_14 = 4;
          local_c = (LPCITEMIDLIST)0x4;
          LVar7 = RegQueryValueExA(local_10,(LPCSTR)DAT_0040d9f0,(LPDWORD)0x0,&local_14,
                                   (LPBYTE)&local_8,(LPDWORD)&local_c);
          if (LVar7 == 0) {
            local_8 = local_8 + 1;
          }
          else {
            local_8 = 1;
            local_14 = 4;
          }
          RegSetValueExA(local_10,(LPCSTR)DAT_0040d9f0,0,local_14,(BYTE *)&local_8,(DWORD)local_c);
          RegCloseKey(local_10);
        }
        if ((pIVar3[2].mkid.abID[0] == '\x03') &&
           (iVar13 = AddFontResourceA((LPCSTR)DAT_0040d9f0), iVar13 != 0)) {
          SendMessageA((HWND)0xffff,0x1d,0,0);
        }
        if ((char)pIVar3[4].mkid.cb == '\x01') {
          DAT_0040da0c = pIVar3;
        }
        if (((char)pIVar3[4].mkid.cb == '\x02') &&
           (hModule = LoadLibraryA((LPCSTR)DAT_0040d9f0), (HMODULE)0x1f < hModule)) {
          pFVar8 = GetProcAddress(hModule,s_DllRegisterServer_0040d080);
          if (pFVar8 != (FARPROC)0x0) {
            (*pFVar8)();
          }
          FreeLibrary(hModule);
        }
        goto LAB_00402d1a;
      }
    }
    else {
      FUN_00405ef2(DAT_0040d9f0);
      FUN_00407ab0(DAT_0040d9ec,DAT_0040d9f0);
      FUN_00405c8b(DAT_0040d9ec,(uint *)&DAT_0040d078);
      pvVar5 = FUN_00401000((LPCSTR)DAT_0040d9ec,0);
      while (pvVar5 != (HANDLE)0xffffffff) {
        FUN_0040121f(pvVar5);
        sVar6 = _strlen((char *)DAT_0040d9ec);
        pcVar10 = (char *)((sVar6 - 1) + (int)DAT_0040d9ec);
        *pcVar10 = *pcVar10 + '\x01';
        pvVar5 = FUN_00401000((LPCSTR)DAT_0040d9ec,0);
      }
      pvVar5 = FUN_0040104d((LPCSTR)DAT_0040d9ec);
      if (pvVar5 == (HANDLE)0xffffffff) {
        DAT_0040da34 = 0x11;
        FUN_00401ee7(DAT_0040d9ec);
        thunk_FUN_00407528(local_19c);
        goto LAB_00402dc7;
      }
      FUN_0040745c(local_19c,pvVar5,DAT_0040d058,*(undefined4 *)((int)&pIVar3[7].mkid.cb + 1));
      UVar2 = pIVar3[4].mkid.cb;
      if ((UVar2 & 0x800) != 0) {
        lpCreationTime = (FILETIME *)((int)&pIVar3[0xf].mkid.cb + 1);
        if ((UVar2 & 0x600) == 0) {
          lpCreationTime = (FILETIME *)pIVar3[8].mkid.abID;
        }
        SetFileTime(pvVar5,lpCreationTime,lpCreationTime + 1,lpCreationTime + 2);
      }
      FUN_0040121f(pvVar5);
      if ((pIVar3[4].mkid.cb & 0x100) == 0) {
        pvVar5 = FUN_00401000((LPCSTR)DAT_0040d9ec,0);
        if (pvVar5 == (HANDLE)0xffffffff) {
          DAT_0040da34 = 0x10;
          puVar9 = DAT_0040d9ec;
        }
        else {
          FUN_004039ed(pvVar5,(int *)&local_c,&local_14);
          FUN_0040121f(pvVar5);
          if (local_c == *(LPCITEMIDLIST *)pIVar3[4].mkid.abID) goto LAB_00402b95;
          DAT_0040da34 = 0x15;
          puVar9 = DAT_0040d9f0;
        }
      }
      else {
LAB_00402b95:
        if (local_8 == 0) {
          FUN_00402e02((uint *)pIVar3,(LPCSTR)DAT_0040d9ec);
        }
        else {
          FUN_004040d2((LPCSTR)DAT_0040d9f0,(LPCSTR)DAT_0040d9ec);
          DAT_0040da18 = 1;
        }
        if (*(short *)((int)&pIVar3[1].mkid.cb + 1) != 0x1b) goto LAB_00402c05;
        DAT_0040da34 = 0x16;
        puVar9 = DAT_0040d9f0;
      }
      FUN_00401ee7(puVar9);
      thunk_FUN_00407528(local_19c);
    }
  }
LAB_00402dcd:
  if ((char)*DAT_0040d9ec != '\0') {
    FUN_00407eac((LPCSTR)DAT_0040d9ec);
  }
LAB_00402dde:
  if (pIVar14 != (LPITEMIDLIST)0x0) {
    pBVar1 = pIVar14[4].mkid.abID;
    *(uint *)pBVar1 = *(uint *)pBVar1 ^ DAT_0040da40;
  }
  if (local_18 != 0) {
    FUN_00405d7d(&local_18);
  }
  return local_10;
}



/* FUN_00404d2f @ 00404d2f
 * references registry string "currentversion" at 0040d26c */

/* WARNING: Type propagation algorithm not settling */

void FUN_00404d2f(void)

{
  HKEY hKey;
  LSTATUS LVar1;
  DWORD DVar2;
  int iVar3;
  size_t sVar4;
  char *pcVar5;
  uint *puVar6;
  uint local_138 [73];
  DWORD local_14 [2];
  HKEY local_c;
  char local_5;
  
  if (DAT_0040da7c == (LPCSTR)0x0) {
    if (((DAT_0040da74 != (LPCSTR)0x0) && (DAT_0040da70 != (LPCSTR)0x0)) &&
       (DAT_0040da6c != (LPCSTR)0x0)) {
      FUN_00407ab0(DAT_0040d9ec,DAT_0040d9f4);
      DVar2 = GetPrivateProfileStringA
                        (DAT_0040da70,DAT_0040da6c,(LPCSTR)DAT_0040d9ec,(LPSTR)DAT_0040d9f4,0x104,
                         DAT_0040da74);
      if (DVar2 != 0) goto LAB_00404e30;
    }
  }
  else {
    hKey = DAT_0040d060;
    if (DAT_0040da80 < 0x10) {
      hKey = *(HKEY *)(&DAT_0040d05c + DAT_0040da80 * 4);
    }
    *(undefined1 *)DAT_0040d9ec = 0;
    LVar1 = RegOpenKeyExA(hKey,DAT_0040da7c,0,0x20019,&local_c);
    if (LVar1 == 0) {
      local_14[1] = 0x104;
      RegQueryValueExA(local_c,DAT_0040da78,(LPDWORD)0x0,local_14,(LPBYTE)DAT_0040d9ec,local_14 + 1)
      ;
      RegCloseKey(local_c);
    }
    if ((char)*DAT_0040d9ec != '\0') {
      FUN_00407ab0(DAT_0040d9f4,DAT_0040d9ec);
LAB_00404e30:
      while( true ) {
        if ((char)*DAT_0040d9f4 == '\0') {
          return;
        }
        iVar3 = FUN_00407bc7((LPCSTR)DAT_0040d9f4);
        if (iVar3 == 0) break;
        sVar4 = _strlen((char *)DAT_0040d9f4);
        *(undefined1 *)((sVar4 - 1) + (int)DAT_0040d9f4) = 0;
      }
      if ((char)*DAT_0040d9f4 == '\0') {
        return;
      }
      FUN_00404f8b(DAT_0040d9f4);
      return;
    }
  }
  if (((char)*DAT_0040d9f4 == '#') &&
     (pcVar5 = _strchr((char *)((int)DAT_0040d9f4 + 1),0x23), pcVar5 != (char *)0x0)) {
    local_5 = pcVar5[1];
    puVar6 = (uint *)(pcVar5 + 1);
    *(char *)puVar6 = '\0';
    local_138[0]._0_1_ = '\0';
    iVar3 = __strcmpi((char *)DAT_0040d9f4,s__Windows__0040d2b4);
    if (iVar3 == 0) {
      GetWindowsDirectoryA((LPSTR)local_138,0x104);
    }
    else {
      iVar3 = __strcmpi((char *)DAT_0040d9f4,s__System__0040d2a8);
      if (iVar3 == 0) {
        GetSystemDirectoryA((LPSTR)local_138,0x104);
      }
      else {
        iVar3 = __strcmpi((char *)DAT_0040d9f4,s__Program_Files__0040d298);
        if (iVar3 == 0) {
          RegOpenKeyA((HKEY)0x80000002,s_Software_Microsoft_Windows_Curre_0040d26c,&local_c);
          local_14[0] = 0;
          local_14[1] = 0x104;
          RegQueryValueExA(local_c,s_ProgramFilesDir_0040d25c,(LPDWORD)0x0,local_14,
                           (LPBYTE)local_138,local_14 + 1);
          RegCloseKey(local_c);
        }
      }
    }
    *(char *)puVar6 = local_5;
    if (local_5 == '\\') {
      puVar6 = (uint *)(pcVar5 + 2);
    }
    FUN_00405cca(local_138);
    FUN_00407ac0(local_138,puVar6);
    FUN_00407ab0(DAT_0040d9f4,local_138);
  }
  return;
}



