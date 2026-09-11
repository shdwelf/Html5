
int __cdecl FUN_10004249(uint param_1)

{
  uint *puVar1;
  int iVar2;
  undefined4 *puVar3;
  undefined4 local_1d8;
  undefined4 local_1d4 [2];
  undefined4 local_1ca;
  
  puVar3 = local_1d4;
  for (iVar2 = 0x74; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  iVar2 = -1;
  if (param_1 != 0) {
    local_1d8 = 0xcdcecfd0;
    local_1d4[0]._0_2_ = 1;
    puVar1 = (uint *)(param_1 + 0xc);
    local_1ca = 1000000;
    param_1 = 0x1d4;
    iVar2 = FUN_100049f6(&DAT_100062c0,*puVar1,&local_1d8,&param_1);
    iVar2 = (iVar2 != 0) - 1;
  }
  return iVar2;
}

