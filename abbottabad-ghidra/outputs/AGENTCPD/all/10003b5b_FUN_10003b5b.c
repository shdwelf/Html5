
int * FUN_10003b5b(void)

{
  int *_Dst;
  int iVar1;
  uint local_c;
  int *local_8;
  
  iVar1 = DAT_100062f0;
  local_8 = (int *)0x0;
  if (DAT_100062f0 != 0) {
    local_c = 0x512;
    _Dst = (int *)malloc(0x512);
    if (_Dst != (int *)0x0) {
      memset(_Dst,0,0x512);
      iVar1 = FUN_100049db(&DAT_100062c0,*(uint *)(iVar1 + 0xc),_Dst,&local_c);
      if ((iVar1 != 0) && (local_8 = _Dst, *_Dst != -0x32313030)) {
        free(_Dst);
        local_8 = (int *)0x0;
      }
    }
  }
  return local_8;
}

