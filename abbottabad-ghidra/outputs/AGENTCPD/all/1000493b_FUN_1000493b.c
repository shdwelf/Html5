
int __cdecl FUN_1000493b(void *param_1,uint param_2,void *param_3,size_t param_4)

{
  int iVar1;
  void *_Buf2;
  uint uVar2;
  
  uVar2 = 0;
  if ((((param_1 != (void *)0x0) && (param_2 != 0)) && (param_3 != (void *)0x0)) &&
     ((param_4 != 0 && (_Buf2 = param_1, param_2 != 0)))) {
    do {
      iVar1 = memcmp(param_3,_Buf2,param_4);
      if (iVar1 == 0) {
        return (int)_Buf2 - (int)param_1;
      }
      uVar2 = uVar2 + 0x20;
      _Buf2 = (void *)((int)_Buf2 + 0x20);
    } while (uVar2 < param_2);
  }
  return 0;
}

