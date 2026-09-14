
uint __cdecl FUN_10004c58(BYTE *param_1,uint param_2,HKEY param_3,LPCSTR param_4)

{
  LSTATUS LVar1;
  
  if (0xf000 < param_2) {
    return 0;
  }
  LVar1 = RegSetValueExA(param_3,param_4,0,3,param_1,param_2);
  return ~-(uint)(LVar1 != 0) & param_2;
}

