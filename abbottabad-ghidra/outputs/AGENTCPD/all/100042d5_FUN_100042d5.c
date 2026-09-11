
undefined4 __cdecl FUN_100042d5(LPCSTR param_1,byte param_2)

{
  void *_Memory;
  undefined4 uVar1;
  
  _Memory = FUN_1000469e(param_1);
  if (_Memory == (void *)0x0) {
    GetLastError();
    uVar1 = 0;
  }
  else if (param_2 < 0x20) {
    strncpy(&DAT_100062c0,param_1,(uint)param_2);
    DAT_100062df = 0;
    uVar1 = *(undefined4 *)((int)_Memory + 4);
    free(_Memory);
  }
  else {
    uVar1 = 0;
  }
  return uVar1;
}

