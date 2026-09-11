
undefined4 * __cdecl FUN_10001f65(int param_1)

{
  undefined4 *_Dst;
  
  if (*(int *)(param_1 + 9) == 0x17) {
    _Dst = (undefined4 *)malloc(*(size_t *)(param_1 + 0xd));
    if (_Dst != (undefined4 *)0x0) {
      memcpy(_Dst,(void *)(param_1 + 0x11),*(size_t *)(param_1 + 0xd));
      *_Dst = *(undefined4 *)(param_1 + 9);
    }
  }
  else {
    _Dst = (undefined4 *)malloc(*(int *)(param_1 + 0xd) + 9);
    *_Dst = *(undefined4 *)(param_1 + 9);
    _Dst[1] = *(undefined4 *)(param_1 + 0xd);
    if (*(size_t *)(param_1 + 0xd) != 0) {
      memcpy(_Dst + 2,(void *)(param_1 + 0x11),*(size_t *)(param_1 + 0xd));
    }
  }
  return _Dst;
}

