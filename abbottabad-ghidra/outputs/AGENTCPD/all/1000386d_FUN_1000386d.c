
undefined4 __cdecl FUN_1000386d(void *param_1)

{
  undefined4 *_Memory;
  void *_Dst;
  
  if ((((param_1 != (void *)0x0) && (*(int *)((int)param_1 + 9) != 0)) &&
      ((*(int *)((int)param_1 + 0xd) != 0 || (*(int *)((int)param_1 + 9) == 0xb)))) &&
     (_Memory = (undefined4 *)malloc(8), _Memory != (undefined4 *)0x0)) {
    _Dst = malloc(*(int *)((int)param_1 + 0xd) + 0x12);
    _Memory[1] = _Dst;
    if (_Dst != (void *)0x0) {
      memcpy(_Dst,param_1,*(int *)((int)param_1 + 0xd) + 0x12);
      *_Memory = DAT_10006298;
      DAT_10006290 = DAT_10006290 + 1;
      DAT_10006298 = _Memory;
      return 1;
    }
    free(_Memory);
  }
  return 0;
}

