
undefined4 __cdecl FUN_10004098(undefined *param_1,undefined4 *param_2,uint *param_3,void *param_4)

{
  size_t *psVar1;
  void *pvVar2;
  int iVar3;
  void *_Dst;
  undefined4 local_8;
  
  local_8 = 0xffffffff;
  iVar3 = FUN_10003fda(&param_4,param_3,(short)param_4);
  pvVar2 = param_4;
  if (iVar3 == 0) {
    psVar1 = (size_t *)((int)param_4 + 8);
    _Dst = malloc(*(size_t *)((int)param_4 + 8));
    *param_2 = _Dst;
    if (_Dst != (void *)0x0) {
      memcpy(_Dst,(void *)((int)pvVar2 + 0xd),*psVar1);
      *param_3 = *psVar1;
      local_8 = 0;
      *param_1 = *(undefined *)((int)pvVar2 + 1);
    }
    free(param_4);
  }
  return local_8;
}

