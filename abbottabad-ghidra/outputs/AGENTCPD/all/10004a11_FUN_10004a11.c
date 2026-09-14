
DWORD __cdecl FUN_10004a11(LPCSTR param_1,uint param_2,void *param_3,uint *param_4,char param_5)

{
  uint uVar1;
  uint *puVar2;
  int iVar3;
  HANDLE hFile;
  DWORD DVar4;
  LPVOID lpBuffer;
  BOOL BVar5;
  DWORD local_14;
  uint local_10;
  DWORD local_c;
  uint local_8;
  
  puVar2 = param_4;
  local_10 = param_2 & 0x1ff;
  local_14 = 0;
  if (local_10 == 0) {
    local_10 = 0;
    local_8 = param_2;
  }
  else {
    local_8 = param_2 & 0xfffffe00;
  }
  uVar1 = *param_4;
  if ((uVar1 & 0x1ff) == 0) {
    iVar3 = (uVar1 >> 9) + 1;
  }
  else {
    iVar3 = (uVar1 >> 9) + 2;
  }
  param_4 = (uint *)(iVar3 << 9);
  hFile = CreateFileA(param_1,0xc0000000,3,(LPSECURITY_ATTRIBUTES)0x0,3,0x90000080,(HANDLE)0x0);
  if (hFile == (HANDLE)0xffffffff) {
    DVar4 = GetLastError();
    return DVar4;
  }
  local_c = 0;
  param_2 = (uint)param_4;
  if (((uint)param_4 & 0x1ff) != 0) {
    param_2 = (uint)(param_4 + 0x80) & 0xfffffe00;
  }
  lpBuffer = VirtualAlloc((LPVOID)0x0,param_2,0x1000,0x40);
  if (lpBuffer == (LPVOID)0x0) {
    *puVar2 = 0;
    goto LAB_10004b8b;
  }
  DVar4 = SetFilePointer(hFile,local_8,(PLONG)0x0,0);
  if (DVar4 != 0xffffffff) {
    BVar5 = ReadFile(hFile,lpBuffer,param_2,&local_c,(LPOVERLAPPED)0x0);
    if (BVar5 == 0) {
LAB_10004b73:
      *puVar2 = 0;
    }
    else {
      if (local_c < param_2) {
        local_14 = 0;
        VirtualFree(lpBuffer,0,0x8000);
        goto LAB_10004b8b;
      }
      if (param_5 == '\0') {
        memcpy((void *)(local_10 + (int)lpBuffer),param_3,*puVar2);
        DVar4 = SetFilePointer(hFile,local_8,(PLONG)0x0,0);
        if (DVar4 == 0xffffffff) goto LAB_10004b76;
        param_2 = (uint)param_4;
        BVar5 = WriteFile(hFile,lpBuffer,local_c,&param_2,(LPOVERLAPPED)0x0);
        if (BVar5 == 0) goto LAB_10004b73;
      }
      else {
        if (param_5 != '\x01') goto LAB_10004b73;
        memcpy(param_3,(void *)(local_10 + (int)lpBuffer),*puVar2);
      }
      local_14 = 1;
    }
  }
LAB_10004b76:
  VirtualFree(lpBuffer,0,0x8000);
LAB_10004b8b:
  CloseHandle(hFile);
  return local_14;
}

