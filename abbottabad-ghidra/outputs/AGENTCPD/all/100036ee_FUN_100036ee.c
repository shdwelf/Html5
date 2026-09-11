
LSTATUS __cdecl FUN_100036ee(undefined4 *param_1,uint *param_2)

{
  uint *puVar1;
  LSTATUS LVar2;
  void *_Dst;
  int iVar3;
  undefined4 *puVar4;
  BYTE local_20c;
  undefined4 local_20b;
  DWORD local_c;
  DWORD local_8;
  
  local_20c = '\0';
  puVar4 = &local_20b;
  for (iVar3 = 0x7f; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar4 = 0;
    puVar4 = puVar4 + 1;
  }
  *(undefined2 *)puVar4 = 0;
  *(undefined *)((int)puVar4 + 2) = 0;
  local_8 = 0x200;
  LVar2 = RegQueryValueExA(DAT_10006288,&DAT_10006084,(LPDWORD)0x0,&local_c,&local_20c,&local_8);
  if (LVar2 == 0) {
    _Dst = malloc(local_8);
    if (_Dst == (void *)0x0) {
LAB_10003785:
      *param_2 = 0;
      *param_1 = 0;
      return 1;
    }
    memcpy(_Dst,&local_20c,local_8);
  }
  else {
    if (LVar2 != 0xea) {
      FUN_10001000(DAT_10006288,DAT_1000628c);
      return LVar2;
    }
    _Dst = malloc(local_8);
    if (_Dst == (void *)0x0) goto LAB_100037e0;
    LVar2 = RegQueryValueExA(DAT_10006288,&DAT_10006084,(LPDWORD)0x0,&local_c,&local_20c,&local_8);
    if (LVar2 != 0) {
      free(_Dst);
      goto LAB_10003785;
    }
  }
  *param_1 = _Dst;
  *param_2 = local_8;
LAB_100037e0:
  puVar1 = param_2;
  if (*param_2 < 9) {
    free(_Dst);
    *puVar1 = 0;
    *param_1 = 0;
    LVar2 = 1;
  }
  else {
    param_2 = (uint *)0x2000000;
    LVar2 = RegSetValueExA(DAT_10006288,&DAT_10006084,0,3,(BYTE *)&param_2,4);
  }
  FUN_10001000(DAT_10006288,DAT_1000628c);
  return LVar2;
}

