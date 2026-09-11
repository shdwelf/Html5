
undefined4 * __cdecl FUN_10001eee(int *param_1,undefined param_2,undefined4 param_3)

{
  int iVar1;
  size_t sVar2;
  undefined4 *puVar3;
  int *_Src;
  
  _Src = (int *)0x0;
  if (*param_1 == 0x17) {
    sVar2 = param_1[1] + 0x23;
    _Src = param_1;
  }
  else {
    sVar2 = param_1[1] + 0x1b;
  }
  puVar3 = (undefined4 *)malloc(sVar2);
  if (puVar3 != (undefined4 *)0x0) {
    iVar1 = *param_1;
    puVar3[1] = 0;
    *(int *)((int)puVar3 + 9) = iVar1;
    *(undefined *)(puVar3 + 2) = param_2;
    *puVar3 = param_3;
    if (*param_1 == 0x17) {
      *(int *)((int)puVar3 + 0xd) = _Src[1] + 0x11;
      sVar2 = _Src[1] + 0x11;
    }
    else {
      sVar2 = param_1[1];
      _Src = param_1 + 2;
      *(size_t *)((int)puVar3 + 0xd) = sVar2;
    }
    memcpy((void *)((int)puVar3 + 0x11),_Src,sVar2);
  }
  return puVar3;
}

