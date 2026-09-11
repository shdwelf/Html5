
undefined4 * __cdecl FUN_10002c27(undefined4 param_1,undefined param_2)

{
  HANDLE hObject;
  undefined4 *puVar1;
  int iVar2;
  uint uVar3;
  HKEY__ *pHVar4;
  undefined local_698;
  HKEY__ local_697 [89];
  uint local_533;
  char local_52f [15];
  undefined auStack_520 [1012];
  undefined4 local_12c [9];
  char local_108 [260];
  
  uVar3 = 0;
  pHVar4 = local_697;
  for (iVar2 = 0x15a; iVar2 != 0; iVar2 = iVar2 + -1) {
    pHVar4->unused = 0;
    pHVar4 = pHVar4 + 1;
  }
  local_698 = 1;
  FUN_10002d31(local_697 + 1);
  hObject = (HANDLE)CreateToolhelp32Snapshot(2,0);
  if (hObject != (HANDLE)0xffffffff) {
    local_12c[0] = 0x128;
    iVar2 = Process32First(hObject,local_12c);
    if (iVar2 != 0) {
      do {
        strncpy(local_52f + uVar3,local_108,0xf);
        auStack_520[uVar3] = 0;
        uVar3 = uVar3 + 0x10;
        iVar2 = Process32Next(hObject,local_12c);
        if (iVar2 == 0) break;
      } while (uVar3 < 0x400);
      local_533 = uVar3 >> 4;
      CloseHandle(hObject);
      puVar1 = (undefined4 *)malloc(0x584);
      if (puVar1 == (undefined4 *)0x0) {
        return (undefined4 *)0x0;
      }
      puVar1[2] = param_1;
      *(undefined *)(puVar1 + 4) = param_2;
      *puVar1 = 0x17;
      puVar1[1] = 0x572;
      *(undefined4 *)((int)puVar1 + 0x11) = 2;
      memcpy((void *)((int)puVar1 + 0x19),&local_698,0x569);
      *(undefined4 *)((int)puVar1 + 0x15) = 0x569;
      return puVar1;
    }
    CloseHandle(hObject);
  }
  return (undefined4 *)0x0;
}

