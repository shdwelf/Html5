/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: Setup.exe
 * SHA-256: b2e07ad88050b96b1ad6e121ac259a9f1617b95f8eee78b6d87e65296d243cd7
 *
 * Selection is driven by the JDK probe: functions that reference
 * registry, tool-name, flag and process-creation strings first.
 */

/* FUN_00406d00 @ 00406d00
 * references diagnostic string " error" at 00406e8c */

void FUN_00406d00(undefined4 *param_1,undefined4 *param_2)

{
  undefined4 uVar1;
  int iVar2;
  int iVar3;
  uint uVar4;
  undefined4 extraout_EDX;
  undefined4 extraout_EDX_00;
  undefined4 extraout_EDX_01;
  uint local_20;
  int iStack_1c;
  undefined4 uStack_18;
  int iStack_14;
  undefined1 uStack_10;
  
  FUN_00402738(param_2,0x2054,0);
  *param_2 = param_1;
  FUN_00403cfc(param_1);
  uVar1 = FUN_0040264c();
  param_2[1] = uVar1;
  FUN_00403cfc(param_1);
  iVar2 = FUN_0040264c();
  FUN_00403d40(param_1);
  iVar3 = FUN_0040264c();
  if (iVar3 < iVar2 + 0xc) {
    iVar2 = FUN_004059d4(0x4068b8,CONCAT31((int3)((uint)extraout_EDX >> 8),1),
                         (undefined4 *)"zlib: Compressed data is corrupted");
    FUN_00402e3c(iVar2);
  }
  FUN_00403bf8(param_1,&local_20,4,(uint *)0x0);
  FUN_0040264c();
  FUN_00403bf8(param_1,&iStack_1c,8,(uint *)0x0);
  FUN_0040264c();
  uVar4 = FUN_0040721c((byte *)&iStack_1c,8);
  if (uVar4 != local_20) {
    iVar2 = FUN_004059d4(0x4068b8,CONCAT31((int3)((uint)extraout_EDX_00 >> 8),1),
                         (undefined4 *)"zlib: Compressed data is corrupted");
    FUN_00402e3c(iVar2);
  }
  if (iStack_1c == -1) {
    param_2[2] = uStack_18;
  }
  else {
    *(undefined1 *)(param_2 + 0x814) = 1;
    param_2[2] = iStack_1c;
  }
  FUN_0040697c(param_2 + 0x806);
  if (*(char *)(param_2 + 0x814) != '\0') {
    iVar2 = FUN_00407434((int)(param_2 + 0x806),"1.1.3",0x38);
    iStack_14 = FUN_00406968(iVar2);
    if (iStack_14 != 0) {
      uStack_10 = 0;
      uVar1 = FUN_00405a08(0x4068fc,CONCAT31((int3)((uint)extraout_EDX_01 >> 8),1),
                           (byte *)"zlib: Internal error. Code %d",0,&iStack_14);
      FUN_00402e3c(uVar1);
    }
  }
  param_2[0x809] = param_2 + 0x403;
  param_2[0x80a] = 0x1000;
  return;
}



/* FUN_00406eac @ 00406eac
 * references diagnostic string " error" at 00407164 */

void FUN_00406eac(undefined4 *param_1,undefined4 *param_2,uint param_3)

{
  int iVar1;
  undefined4 uVar2;
  undefined4 extraout_EDX;
  int iVar3;
  undefined4 extraout_EDX_00;
  undefined3 uVar4;
  uint uVar5;
  byte local_20;
  uint uStack_1c;
  int iStack_18;
  undefined1 uStack_14;
  
  local_20 = 0;
  while (param_3 != 0) {
    if (param_1[0x807] == 0) {
      uVar5 = param_1[2];
      if (uVar5 == 0) {
        local_20 = 1;
      }
      else {
        if (0x1000 < (int)uVar5) {
          uVar5 = 0x1000;
        }
        FUN_00403cfc((undefined4 *)*param_1);
        iVar3 = FUN_0040264c();
        iVar3 = iVar3 + 4 + uVar5;
        FUN_00403d40((undefined4 *)*param_1);
        iVar1 = FUN_0040264c();
        if (iVar1 < iVar3) {
          iVar3 = FUN_004059d4(0x4068b8,CONCAT31((int3)((uint)iVar3 >> 8),1),
                               (undefined4 *)"zlib: Compressed data is corrupted");
          FUN_00402e3c(iVar3);
        }
        FUN_00403bf8((undefined4 *)*param_1,&uStack_1c,4,(uint *)0x0);
        FUN_0040264c();
        FUN_00403bf8((undefined4 *)*param_1,param_1 + 3,uVar5,(uint *)0x0);
        FUN_0040264c();
        param_1[2] = param_1[2] - uVar5;
        param_1[0x806] = param_1 + 3;
        param_1[0x807] = uVar5;
        uVar5 = FUN_0040721c((byte *)(param_1 + 3),uVar5);
        if (uVar5 != uStack_1c) {
          iVar3 = FUN_004059d4(0x4068b8,CONCAT31((int3)((uint)extraout_EDX >> 8),1),
                               (undefined4 *)"zlib: Compressed data is corrupted");
          FUN_00402e3c(iVar3);
        }
      }
    }
    if ((param_1[0x80a] != 0) &&
       (iVar3 = param_1[0x809] - ((int)param_1 + param_1[0x804] + 0x100c), iVar3 < (int)param_3)) {
      if (*(char *)((int)param_1 + 0x2051) != '\0') {
        iVar3 = FUN_004059d4(0x4068b8,CONCAT31((int3)((uint)iVar3 >> 8),1),
                             (undefined4 *)"zlib: Compressed data is corrupted");
        FUN_00402e3c(iVar3);
      }
      if (*(char *)(param_1 + 0x814) == '\0') {
        uVar5 = param_1[0x80a];
        if ((uint)param_1[0x807] < (uint)param_1[0x80a]) {
          uVar5 = param_1[0x807];
        }
        FUN_00402688((undefined4 *)param_1[0x806],(undefined4 *)param_1[0x809],uVar5);
        param_1[0x807] = param_1[0x807] - uVar5;
        param_1[0x806] = param_1[0x806] + uVar5;
        param_1[0x808] = param_1[0x808] + uVar5;
        param_1[0x80a] = param_1[0x80a] - uVar5;
        param_1[0x809] = param_1[0x809] + uVar5;
        param_1[0x80b] = param_1[0x80b] + uVar5;
      }
      else {
        iVar3 = FUN_00407460(param_1 + 0x806,*(int *)(&DAT_0040d158 + (uint)local_20 * 4));
        iVar3 = FUN_00406968(iVar3);
        uVar4 = (undefined3)((uint)extraout_EDX_00 >> 8);
        if (iVar3 == -3) {
          iVar3 = FUN_004059d4(0x4068b8,CONCAT31(uVar4,1),
                               (undefined4 *)"zlib: Compressed data is corrupted");
          FUN_00402e3c(iVar3);
        }
        else if (iVar3 != 0) {
          if (iVar3 == 1) {
            *(undefined1 *)((int)param_1 + 0x2051) = 1;
          }
          else {
            uStack_14 = 0;
            iStack_18 = iVar3;
            uVar2 = FUN_00405a08(0x4068fc,CONCAT31(uVar4,1),(byte *)"zlib: Internal error. Code %d",
                                 0,&iStack_18);
            FUN_00402e3c(uVar2);
          }
        }
      }
    }
    iVar3 = param_1[0x804];
    if ((uint)((int)param_1 + iVar3 + 0x100c) < (uint)param_1[0x809]) {
      uVar5 = param_1[0x809] - ((int)param_1 + iVar3 + 0x100c);
      if (param_3 < uVar5) {
        uVar5 = param_3;
      }
      FUN_00402688((undefined4 *)((int)param_1 + iVar3 + 0x100c),param_2,uVar5);
      param_3 = param_3 - uVar5;
      param_2 = (undefined4 *)((int)param_2 + uVar5);
      param_1[0x804] = param_1[0x804] + uVar5;
      if (param_1[0x804] == 0x1000) {
        param_1[0x809] = param_1 + 0x403;
        param_1[0x80a] = 0x1000;
        param_1[0x804] = 0;
      }
    }
  }
  return;
}



/* FUN_00403d80 @ 00403d80
 * references diagnostic string " error" at 0040d014 */

bool FUN_00403d80(UINT param_1)

{
  ulonglong uVar1;
  code *pcVar2;
  UINT UVar3;
  uint uVar4;
  undefined *puVar5;
  char *pcVar6;
  
  DAT_0040f020 = param_1;
  if (DAT_0040f030 != '\0') {
    if (DAT_0040f414 == '\0') goto LAB_00403e5b;
    if ((DAT_0040f414 != '\x01') && (param_1 == 0)) goto LAB_00403e66;
  }
  while (pcVar2 = DAT_0040f024, DAT_0040f024 != (code *)0x0) {
    DAT_0040f024 = (code *)0x0;
    (*pcVar2)();
  }
  if (DAT_0040f028 != 0) {
    pcVar6 = s_Runtime_error_at_00000000_0040d014 + 0x10;
    UVar3 = DAT_0040f020;
    do {
      uVar1 = (ulonglong)UVar3;
      UVar3 = UVar3 / 10;
      *pcVar6 = (char)(uVar1 % 10) + '0';
      pcVar6 = pcVar6 + -1;
    } while (UVar3 != 0);
    pcVar6 = s_Runtime_error_at_00000000_0040d014 + 0x1c;
    uVar4 = DAT_0040f028 - 0x401178;
    do {
      *pcVar6 = (&DAT_00403e98)[uVar4 & 0xf];
      pcVar6 = pcVar6 + -1;
      uVar4 = uVar4 >> 4;
    } while (uVar4 != 0);
    if (DAT_0040f031 == '\0') {
      MessageBoxA((HWND)0x0,s_Runtime_error_at_00000000_0040d014,s_Error_0040d032,0);
    }
    else {
      puVar5 = (undefined *)FUN_004041cc(&DAT_0040f204,s_Runtime_error_at_00000000_0040d014);
      FUN_0040414f(puVar5);
    }
  }
  FUN_00403cc0(&DAT_0040f038);
  FUN_00403cc0(&DAT_0040f204);
  FUN_004019d4();
  if (DAT_0040f414 != '\0') {
LAB_00403e66:
    FUN_0040303c();
    DAT_0040f414 = 0;
    return (bool)('\x01' - (DAT_0040f020 != 0));
  }
  FUN_0040303c();
LAB_00403e5b:
                    /* WARNING: Subroutine does not return */
  ExitProcess(DAT_0040f020);
}



/* FUN_00405b90 @ 00405b90
 * references diagnostic string " error" at 00415806 */

int FUN_00405b90(undefined4 param_1,undefined4 param_2)

{
  LPVOID pvVar1;
  undefined4 extraout_EDX;
  undefined4 extraout_EDX_00;
  int iVar2;
  undefined4 local_c;
  undefined1 local_8;
  
  for (iVar2 = 0; iVar2 < 7; iVar2 = iVar2 + 1) {
    pvVar1 = FUN_004030dc();
    param_2 = extraout_EDX;
    if (*(int *)((int)pvVar1 + 4) == (&DAT_0040d080)[iVar2 * 2]) break;
  }
  if (iVar2 < 7) {
    iVar2 = FUN_00405a84(0x40478c,CONCAT31((int3)((uint)param_2 >> 8),1),(&DAT_0040d084)[iVar2 * 2])
    ;
  }
  else {
    pvVar1 = FUN_004030dc();
    local_c = *(undefined4 *)((int)pvVar1 + 4);
    local_8 = 0;
    iVar2 = FUN_00405af4(0x40478c,CONCAT31((int3)((uint)extraout_EDX_00 >> 8),1),0xff88,0,&local_c);
  }
  pvVar1 = FUN_004030dc();
  *(undefined4 *)(iVar2 + 0xc) = *(undefined4 *)((int)pvVar1 + 4);
  pvVar1 = FUN_004030dc();
  *(undefined4 *)((int)pvVar1 + 4) = 0;
  return iVar2;
}



/* FUN_00405844 @ 00405844
 * references diagnostic string " error" at 00415c08 */

void FUN_00405844(int *param_1,int param_2)

{
  char *pcVar1;
  undefined4 uVar2;
  int iVar3;
  undefined *puVar4;
  char local_2b8 [64];
  byte local_278 [64];
  byte local_238 [256];
  byte *local_138;
  undefined1 local_134;
  undefined1 *local_130;
  undefined1 local_12c;
  int local_128;
  undefined1 local_124;
  char *local_120;
  undefined1 local_11c;
  undefined *local_118;
  undefined1 local_114;
  byte local_110 [256];
  
  GetModuleFileNameA(DAT_0040f014,(LPSTR)local_238,0x100);
  pcVar1 = FUN_00404efc((char *)local_238,'\\');
  FUN_00404ea8(local_2b8,pcVar1 + 1,0x3f);
  pcVar1 = "";
  puVar4 = &DAT_004059c0;
  uVar2 = FUN_004028f4(param_1,0x4046f8);
  if ((char)uVar2 != '\0') {
    pcVar1 = FUN_004033a0((undefined *)param_1[1]);
    iVar3 = FUN_00404e54(pcVar1);
    if ((iVar3 != 0) && (pcVar1[iVar3 + -1] != '.')) {
      puVar4 = &DAT_004059c4;
    }
  }
  LoadStringA(DAT_0040f014,0xff9e,(LPSTR)local_278,0x40);
  uVar2 = 4;
  FUN_00402810(*param_1,local_110);
  local_138 = local_110;
  local_134 = 4;
  local_12c = 6;
  local_130 = local_2b8;
  local_128 = FUN_00405838(param_2);
  local_124 = 5;
  local_11c = 6;
  local_114 = 6;
  local_120 = pcVar1;
  local_118 = puVar4;
  FUN_004052a0(local_238,local_278,&local_138,uVar2);
  LoadStringA(DAT_0040f014,0xff9f,(LPSTR)local_278,0x40);
  if (DAT_0040f031 == '\0') {
    MessageBoxA((HWND)0x0,(LPCSTR)local_238,(LPCSTR)local_278,0x2010);
  }
  else {
    puVar4 = (undefined *)FUN_004041cc(&DAT_0040f204,(char *)local_238);
    FUN_0040414f(puVar4);
    FUN_0040264c();
  }
  return;
}



