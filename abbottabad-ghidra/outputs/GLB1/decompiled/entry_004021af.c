
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 entry(void)

{
  char *pcVar1;
  char cVar2;
  ATOM AVar3;
  LONG LVar4;
  undefined2 extraout_var;
  HFILE HVar5;
  LPCSTR pCVar6;
  HMODULE hModule;
  HANDLE ProcessHandle;
  BOOL BVar7;
  UINT uFlags;
  int iVar8;
  char *pcVar9;
  DWORD DesiredAccess;
  HANDLE *TokenHandle;
  undefined local_530 [256];
  undefined local_430 [128];
  CHAR local_3b0 [256];
  CHAR local_2b0 [108];
  undefined local_244 [16];
  DWORD local_234;
  CHAR local_1b0 [128];
  CHAR local_130 [256];
  _TOKEN_PRIVILEGES local_30;
  int local_20;
  uint local_1c;
  int local_18;
  HANDLE local_14;
  char *local_10;
  HMODULE local_c;
  byte local_5;
  
  local_1c = 1;
  SetErrorMode(4);
  local_10 = GetCommandLineA();
  cVar2 = *local_10;
  if (cVar2 == '\"') {
    cVar2 = local_10[1];
    pcVar9 = local_10;
    while ((local_10 = pcVar9 + 1, cVar2 != '\0' && (cVar2 != '\"'))) {
      cVar2 = pcVar9[2];
      pcVar9 = local_10;
    }
    if (*local_10 == '\"') {
      local_10 = pcVar9 + 2;
    }
  }
  else {
    while ((cVar2 != '\0' && (cVar2 != ' '))) {
      pcVar9 = local_10 + 1;
      local_10 = local_10 + 1;
      cVar2 = *pcVar9;
    }
  }
  cVar2 = *local_10;
  pcVar9 = local_10;
  while (cVar2 == ' ') {
    pcVar9 = pcVar9 + 1;
    cVar2 = *pcVar9;
  }
  local_10 = pcVar9;
  local_c = GetModuleHandleA((LPCSTR)0x0);
  if (*pcVar9 == '/') {
    if ((pcVar9[1] == 'S') || (pcVar9[1] == 's')) {
      DAT_00405358 = 1;
    }
    if (((pcVar9[1] == 'M') || (pcVar9[1] == 'm')) && (pcVar9[2] == '4')) {
      DAT_004053ec = 1;
    }
    if (((pcVar9[1] == 'X') || (pcVar9[1] == 'x')) && (pcVar9[2] == '=')) {
      DAT_0040541c = 1;
      DAT_004053ec = 1;
    }
    if (((pcVar9[1] == 'M') || (pcVar9[1] == 'm')) && ((pcVar9[2] == '5' && (pcVar9[3] == '=')))) {
      DAT_004053f4 = pcVar9 + 4;
    }
  }
  GetModuleFileNameA(local_c,local_3b0,0x100);
  cVar2 = *pcVar9;
  while ((cVar2 != '\0' && (cVar2 != '\x7f'))) {
    pcVar1 = pcVar9 + 1;
    pcVar9 = pcVar9 + 1;
    cVar2 = *pcVar1;
  }
  if (*pcVar9 != '\0') {
    *pcVar9 = '\0';
    iVar8 = 0;
    while( true ) {
      cVar2 = pcVar9[1];
      if ((cVar2 == '\0') || (cVar2 == ' ')) break;
      iVar8 = cVar2 + -0x30 + iVar8 * 10;
      pcVar9 = pcVar9 + 1;
    }
    DAT_00405178 = DAT_00405178 + iVar8;
    lstrcpyA(local_3b0,pcVar9 + 2);
  }
  DAT_00405340 = _lopen(local_3b0,0);
  if ((int)DAT_00405340 < 0) {
    pCVar6 = local_3b0;
LAB_004025e2:
    FUN_00402feb(pCVar6);
    return 0;
  }
  FUN_00401000();
  _DAT_004053d4 = local_3b0;
  DAT_00405324 = 0;
  _DAT_00405334 = DAT_00405178;
  DAT_0040532c = DAT_00405178;
  _llseek(DAT_00405340,DAT_00405178,0);
  _lread(DAT_00405340,&local_5,1);
  if (local_5 != 0) {
    _lread(DAT_00405340,local_130,(uint)local_5);
    _lread(DAT_00405340,&local_20,4);
    local_14 = (HANDLE)_lopen(local_130,0);
    if ((int)local_14 < 0) {
      local_130[0] = '\0';
    }
    else {
      LVar4 = _llseek((HFILE)local_14,0,2);
      if (local_20 != LVar4) {
        local_130[0] = '\0';
      }
      _lclose((HFILE)local_14);
    }
  }
  _lread(DAT_00405340,&DAT_00405360,4);
  _lread(DAT_00405340,&DAT_00405410,0xc);
  _lread(DAT_00405340,&DAT_004053b4,8);
  _lread(DAT_00405340,&DAT_00405374,0x40);
  _lread(DAT_00405340,&DAT_004053fc,3);
  if ((DAT_00405360._3_1_ & 0x40) != 0) {
    DAT_004053ec = 1;
  }
  DAT_004053f8 = local_530;
  _lread(DAT_00405340,local_530,(uint)DAT_004053fe);
  _DAT_004053d8 = FUN_00401edf;
  _DAT_004053dc = FUN_004020a0;
  DAT_004053f0 = _StubFileWrite_12;
  if (DAT_004053b0 < 1) {
    DAT_004053ec = 1;
  }
  else {
    _DAT_004053c8 = GlobalAlloc(2,DAT_004053b0 + 1);
    DAT_004053cc = GlobalLock(_DAT_004053c8);
    DAT_004053d0 = DAT_004053cc;
    FUN_00401edf(DAT_00405340,0,DAT_004053ac,(uint *)0x0);
    DAT_004053d0 = (LPVOID)0x0;
  }
  if ((DAT_00405360._1_1_ & 0x10) != 0) {
    DAT_00405364 = 1;
  }
  AVar3 = FUN_004027db(local_c);
  if (CONCAT22(extraout_var,AVar3) == 0) {
    return 0;
  }
  iVar8 = FUN_0040283a(local_c);
  if (iVar8 == 0) {
    return 0;
  }
  _DAT_00405320 = DAT_00405300;
  _DAT_00405328 = local_c;
  _DAT_004053bc = &DAT_00405410;
  if (DAT_004053a8 != (HMODULE)0x0) {
    local_14 = (HANDLE)_llseek(DAT_00405340,0,1);
    local_c = (HMODULE)_llseek(DAT_00405340,0,2);
    _llseek(DAT_00405340,(LONG)local_14,0);
    if (local_c != DAT_004053a8) {
      wsprintfA(local_2b0,s_File_size_expected__ld__size_ret_00405298,DAT_004053a8,local_c);
      FUN_00402feb(local_2b0);
      return 0;
    }
  }
  _DAT_004053c0 = GlobalAlloc(2,DAT_00405374 + 1);
  _DAT_004053c4 = GlobalLock(_DAT_004053c0);
  DAT_004053d0 = _DAT_004053c4;
  FUN_00401edf(DAT_00405340,0,DAT_00405378,(uint *)0x0);
  DAT_004053d0 = (LPVOID)0x0;
  if (local_5 == 0) {
    FUN_00402f36(local_130);
    HVar5 = _lcreat(local_130,0);
    _lclose(HVar5);
    HVar5 = _lopen(local_130,2);
    if (HVar5 < 0) {
      pCVar6 = local_130;
      goto LAB_004025e2;
    }
    FUN_00401edf(DAT_00405340,HVar5,DAT_0040537c,(uint *)0x0);
    _lclose(HVar5);
  }
  local_18 = 1;
  local_1b0[0] = '\0';
  if (DAT_00405348 == '\0') {
    hModule = LoadLibraryA(local_130);
    if (hModule != (HMODULE)0x0) {
      DAT_00405420 = GetProcAddress(hModule,s_WiseMain_00405250);
      DAT_004053e8 = GetProcAddress(hModule,s_UpdateScreen_00405240);
      DAT_004053e4 = GetProcAddress(hModule,s_DisplayGraphics_00405230);
      DAT_00405304 = GetProcAddress(hModule,s_DiskPrompt_00405224);
      DAT_004053f0 = GetProcAddress(hModule,s_FileWrite_00405218);
      DAT_00405400 = GetProcAddress(hModule,s_HandleFtp_0040520c);
    }
    if (DAT_00405420 == (FARPROC)0x0) {
      if (local_5 == 0) {
        FUN_00402feb(s_System_DLLs_corrupt_or_missing__004051a0);
      }
      else {
        MessageBoxA(DAT_00405300,s_Demo_installations_only_run_on_t_004051c0,s_Install_00405204,0);
      }
    }
    else {
      local_1c = (*DAT_00405420)(&DAT_00405320,local_10,&local_18,local_1b0,local_430);
      local_1c = local_1c & 0xffff;
      FreeLibrary(hModule);
    }
  }
  else {
    wsprintfA(local_2b0,s_Could_not_extract_Wise0132_dll_t_0040525c);
    FUN_00402feb(local_2b0);
  }
  FUN_00401083();
  if (local_5 == 0) {
    OpenFile(local_130,(LPOFSTRUCT)(local_244 + 0xc),0x200);
  }
  if (DAT_0040536c != (HGDIOBJ)0x0) {
    DeleteObject(DAT_0040536c);
  }
  if (local_18 != 1) {
    local_244._0_4_ = 0x94;
    GetVersionExA((LPOSVERSIONINFOA)local_244);
    TokenHandle = &local_14;
    DesiredAccess = 0x28;
    ProcessHandle = GetCurrentProcess();
    BVar7 = OpenProcessToken(ProcessHandle,DesiredAccess,TokenHandle);
    if (BVar7 != 0) {
      LookupPrivilegeValueA((LPCSTR)0x0,s_SeShutdownPrivilege_0040518c,&local_30.Privileges[0].Luid)
      ;
      local_30.PrivilegeCount = 1;
      local_30.Privileges[0].Attributes = 2;
      AdjustTokenPrivileges(local_14,0,&local_30,0,(PTOKEN_PRIVILEGES)0x0,(PDWORD)0x0);
    }
    uFlags = 2;
    if ((local_234 == 2) && (local_18 == 0x42)) {
      uFlags = 0;
    }
    ExitWindowsEx(uFlags,0);
  }
  if (local_1b0[0] != '\0') {
    WinExec(local_1b0,5);
  }
                    /* WARNING: Subroutine does not return */
  ExitProcess(local_1c);
}

