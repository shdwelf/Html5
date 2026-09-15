
undefined4 __cdecl FUN_10001b1b(HKEY param_1)

{
  DWORD _Seed;
  int iVar1;
  
  DAT_10006264 = 2;
  _Seed = GetTickCount();
  srand(_Seed);
  RegSetValueExA(DAT_10006250,s_Status_10006088,0,3,(BYTE *)&DAT_10006264,4);
  RegSetValueExA(DAT_10006250,&DAT_10006084,0,3,(BYTE *)&DAT_10006264,4);
  do {
    do {
      iVar1 = rand();
      DAT_10006010 = (char)iVar1;
    } while (DAT_10006010 == -1);
  } while (DAT_10006010 == '\0');
  RegSetValueExA(DAT_10006250,s_Version_1000607c,0,3,(BYTE *)&DAT_10006010,1);
  RegSetValueExA(DAT_10006250,s_Policy_10006074,0,3,(BYTE *)&DAT_10006010,1);
  FUN_10001bb8(param_1);
  return 3;
}

