
undefined4 FUN_100022e9(undefined4 param_1,int param_2)

{
  if (param_2 != 0) {
    if (param_2 == 1) {
      DAT_10006274 = CreateThread((LPSECURITY_ATTRIBUTES)0x0,0,FUN_1000232f,(LPVOID)0x0,0,
                                  (LPDWORD)&DAT_10006278);
      if (DAT_10006274 == (HANDLE)0x0) {
        return 0;
      }
      return 1;
    }
    if (param_2 != 3) {
      return 0;
    }
  }
  CloseHandle(DAT_10006274);
  return 0;
}

