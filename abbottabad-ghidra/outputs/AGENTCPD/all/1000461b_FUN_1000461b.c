
undefined4 __cdecl FUN_1000461b(LPCSTR param_1,int *param_2,int *param_3)

{
  int iVar1;
  undefined local_48 [11];
  ushort local_3d;
  byte local_3b;
  ushort local_3a;
  char local_38;
  ushort local_37;
  ushort local_32;
  int local_24;
  uint local_8;
  
  local_8 = 0x40;
  iVar1 = FUN_100049db(param_1,0,local_48,&local_8);
  if ((iVar1 != 0) && (local_38 == '\x02')) {
    if (local_37 == 0) {
      *param_2 = ((uint)local_3a + local_24 * 2) * (uint)local_3d;
      *param_3 = (uint)local_3b * (uint)local_3d;
    }
    else {
      *param_2 = ((uint)local_3a + (uint)local_32 * 2) * (uint)local_3d;
      *param_3 = (uint)local_37 << 5;
    }
    return 1;
  }
  return 0;
}

