
void __cdecl FUN_10001000(HKEY param_1,HANDLE param_2)

{
  RegNotifyChangeKeyValue(param_1,1,0xf,param_2,1);
  return;
}

