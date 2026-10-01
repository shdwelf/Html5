/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: GE2001.exe
 * SHA-256: e4659da37fbf4aea8c4ca4f8c093e07806e7824cdb90d57b389190833d7e87da
 *
 * Selection is driven by the JDK probe: functions that reference
 * registry, tool-name, flag and process-creation strings first.
 */

/* FUN_00401900 @ 00401900
 * references tools string "jdb.exe" at 0040b1fc */

int __cdecl FUN_00401900(uint *param_1,char *param_2)

{
  char cVar1;
  uint *puVar2;
  uint *puVar3;
  HANDLE hObject;
  undefined4 uVar4;
  uint uVar5;
  uint uVar6;
  void *this;
  int iVar7;
  undefined4 *puVar8;
  int iVar9;
  char *pcVar10;
  undefined4 *puVar11;
  char *pcVar12;
  char *pcVar13;
  DWORD local_210;
  int local_20c;
  undefined4 local_208;
  char local_104 [260];
  
  iVar7 = 0xf69b5;
  puVar2 = FUN_00402b20(param_1,&DAT_0040b204);
  uVar5 = 0xffffffff;
  puVar3 = param_1;
  do {
    if (uVar5 == 0) break;
    uVar5 = uVar5 - 1;
    uVar6 = *puVar3;
    puVar3 = (uint *)((int)puVar3 + 1);
  } while ((char)uVar6 != '\0');
  if ((0x1a9 < (int)(~uVar5 - 1)) ||
     (puVar3 = FUN_00402b20(param_1,s_jdb_exe_0040b1fc), puVar3 != (uint *)0x0)) {
    iVar7 = FUN_00401b20();
    return iVar7;
  }
  if (puVar2 != (uint *)0x0) {
    uVar5 = 0xffffffff;
    puVar3 = puVar2;
    do {
      if (uVar5 == 0) break;
      uVar5 = uVar5 - 1;
      uVar6 = *puVar3;
      puVar3 = (uint *)((int)puVar3 + 1);
    } while ((char)uVar6 != '\0');
    if (1 < ~uVar5 - 1) {
      uVar5 = 0xffffffff;
      do {
        puVar3 = puVar2;
        if (uVar5 == 0) break;
        uVar5 = uVar5 - 1;
        puVar3 = (uint *)((int)puVar2 + 1);
        uVar6 = *puVar2;
        puVar2 = puVar3;
      } while ((char)uVar6 != '\0');
      uVar5 = ~uVar5;
      puVar8 = (undefined4 *)((int)puVar3 - uVar5);
      puVar11 = &local_208;
      for (uVar6 = uVar5 >> 2; uVar6 != 0; uVar6 = uVar6 - 1) {
        *puVar11 = *puVar8;
        puVar8 = puVar8 + 1;
        puVar11 = puVar11 + 1;
      }
      for (uVar5 = uVar5 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
        *(undefined1 *)puVar11 = *(undefined1 *)puVar8;
        puVar8 = (undefined4 *)((int)puVar8 + 1);
        puVar11 = (undefined4 *)((int)puVar11 + 1);
      }
      uVar5 = 0xffffffff;
      pcVar10 = (char *)((int)&local_208 + 1);
      do {
        if (uVar5 == 0) break;
        uVar5 = uVar5 - 1;
        cVar1 = *pcVar10;
        pcVar10 = pcVar10 + 1;
      } while (cVar1 != '\0');
      iVar9 = 0;
      if (0 < (int)(~uVar5 - 1)) {
        do {
          this = (void *)(int)*(char *)((int)&local_208 + iVar9 + 1);
          uVar6 = FUN_00402bcf(this,(int)this);
          if (uVar6 != 0) {
            *(undefined1 *)((int)&local_208 + iVar9 + 1) = 0;
            break;
          }
          iVar9 = iVar9 + 1;
        } while (iVar9 < (int)(~uVar5 - 1));
      }
      iVar9 = -1;
      pcVar10 = (char *)((int)&local_208 + 1);
      do {
        if (iVar9 == 0) break;
        iVar9 = iVar9 + -1;
        cVar1 = *pcVar10;
        pcVar10 = pcVar10 + 1;
      } while (cVar1 != '\0');
      if ((iVar9 != -2) && (&stack0x00000000 != (undefined1 *)0x207)) {
        iVar9 = -1;
        pcVar10 = (char *)((int)&local_208 + 1);
        do {
          if (iVar9 == 0) break;
          iVar9 = iVar9 + -1;
          cVar1 = *pcVar10;
          pcVar10 = pcVar10 + 1;
        } while (cVar1 != '\0');
        if (iVar9 != -2) {
          uVar5 = 0xffffffff;
          do {
            pcVar10 = param_2;
            if (uVar5 == 0) break;
            uVar5 = uVar5 - 1;
            pcVar10 = param_2 + 1;
            cVar1 = *param_2;
            param_2 = pcVar10;
          } while (cVar1 != '\0');
          uVar5 = ~uVar5;
          pcVar10 = pcVar10 + -uVar5;
          pcVar13 = local_104;
          for (uVar6 = uVar5 >> 2; uVar6 != 0; uVar6 = uVar6 - 1) {
            *(undefined4 *)pcVar13 = *(undefined4 *)pcVar10;
            pcVar10 = pcVar10 + 4;
            pcVar13 = pcVar13 + 4;
          }
          for (uVar5 = uVar5 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
            *pcVar13 = *pcVar10;
            pcVar10 = pcVar10 + 1;
            pcVar13 = pcVar13 + 1;
          }
          uVar5 = 0xffffffff;
          pcVar10 = &DAT_0040b1f8;
          do {
            pcVar13 = pcVar10;
            if (uVar5 == 0) break;
            uVar5 = uVar5 - 1;
            pcVar13 = pcVar10 + 1;
            cVar1 = *pcVar10;
            pcVar10 = pcVar13;
          } while (cVar1 != '\0');
          uVar5 = ~uVar5;
          iVar9 = -1;
          pcVar10 = local_104;
          do {
            pcVar12 = pcVar10;
            if (iVar9 == 0) break;
            iVar9 = iVar9 + -1;
            pcVar12 = pcVar10 + 1;
            cVar1 = *pcVar10;
            pcVar10 = pcVar12;
          } while (cVar1 != '\0');
          pcVar10 = pcVar13 + -uVar5;
          pcVar13 = pcVar12 + -1;
          for (uVar6 = uVar5 >> 2; uVar6 != 0; uVar6 = uVar6 - 1) {
            *(undefined4 *)pcVar13 = *(undefined4 *)pcVar10;
            pcVar10 = pcVar10 + 4;
            pcVar13 = pcVar13 + 4;
          }
          for (uVar5 = uVar5 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
            *pcVar13 = *pcVar10;
            pcVar10 = pcVar10 + 1;
            pcVar13 = pcVar13 + 1;
          }
          uVar5 = 0xffffffff;
          pcVar10 = (char *)((int)&local_208 + 1);
          do {
            pcVar13 = pcVar10;
            if (uVar5 == 0) break;
            uVar5 = uVar5 - 1;
            pcVar13 = pcVar10 + 1;
            cVar1 = *pcVar10;
            pcVar10 = pcVar13;
          } while (cVar1 != '\0');
          uVar5 = ~uVar5;
          iVar9 = -1;
          pcVar10 = local_104;
          do {
            pcVar12 = pcVar10;
            if (iVar9 == 0) break;
            iVar9 = iVar9 + -1;
            pcVar12 = pcVar10 + 1;
            cVar1 = *pcVar10;
            pcVar10 = pcVar12;
          } while (cVar1 != '\0');
          pcVar10 = pcVar13 + -uVar5;
          pcVar13 = pcVar12 + -1;
          for (uVar6 = uVar5 >> 2; uVar6 != 0; uVar6 = uVar6 - 1) {
            *(undefined4 *)pcVar13 = *(undefined4 *)pcVar10;
            pcVar10 = pcVar10 + 4;
            pcVar13 = pcVar13 + 4;
          }
          for (uVar5 = uVar5 & 3; uVar5 != 0; uVar5 = uVar5 - 1) {
            *pcVar13 = *pcVar10;
            pcVar10 = pcVar10 + 1;
            pcVar13 = pcVar13 + 1;
          }
          hObject = CreateFileA(local_104,0x80000000,1,(LPSECURITY_ATTRIBUTES)0x0,3,0x8000027,
                                (HANDLE)0x0);
          if (hObject != (HANDLE)0xffffffff) {
            local_210 = 0;
            local_20c = 0;
            uVar4 = FUN_00401d50(hObject,&local_210);
            if ((((char)uVar4 != '\0') && (-1 < local_20c)) &&
               ((0 < local_20c || (0x96 < local_210)))) {
              iVar7 = FUN_00401b20();
            }
            if (hObject != (HANDLE)0x0) {
              CloseHandle(hObject);
            }
            return iVar7;
          }
        }
      }
    }
  }
  return 0xf69b5;
}



