
undefined4 FUN_10003838(void)

{
  undefined4 *puVar1;
  undefined4 uVar2;
  
  if ((DAT_10006290 != 0) && (DAT_10006298 != (undefined4 *)0x0)) {
    puVar1 = (undefined4 *)*DAT_10006298;
    uVar2 = DAT_10006298[1];
    free(DAT_10006298);
    DAT_10006290 = DAT_10006290 + -1;
    DAT_10006298 = puVar1;
    return uVar2;
  }
  return 0;
}

