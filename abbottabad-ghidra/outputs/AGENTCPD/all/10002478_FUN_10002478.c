
undefined4 __cdecl FUN_10002478(void *param_1,undefined4 *param_2,uint *param_3)

{
  int iVar1;
  uint local_c;
  undefined4 local_8;
  
  local_8 = 0;
  local_c = 0;
  iVar1 = FUN_10004098((undefined *)((int)&param_1 + 3),&local_8,&local_c,param_1);
  if (iVar1 == 0) {
    *param_2 = local_8;
    *param_3 = local_c;
    return 1;
  }
  return 0;
}

