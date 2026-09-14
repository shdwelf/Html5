
HANDLE __stdcall OpenProcess(DWORD dwDesiredAccess,BOOL bInheritHandle,DWORD dwProcessId)

{
  HANDLE pvVar1;
  
                    /* WARNING: Could not recover jumptable at 0x00403c2c. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  pvVar1 = OpenProcess(dwDesiredAccess,bInheritHandle,dwProcessId);
  return pvVar1;
}

