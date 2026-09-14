
undefined4 * FUN_10003410(void)

{
  int iVar1;
  undefined4 *puVar2;
  void *local_8;
  
  iVar1 = FUN_1000407f(&local_8);
  if (iVar1 != 0) {
    puVar2 = (undefined4 *)FUN_100024d7(0x11,DAT_10006010,0);
    return puVar2;
  }
  puVar2 = (undefined4 *)malloc(0x1e6);
  if (puVar2 != (undefined4 *)0x0) {
    *puVar2 = 0x17;
    puVar2[2] = 0x11;
    puVar2[1] = 0x1d4;
    *(undefined *)(puVar2 + 4) = DAT_10006010;
    memcpy((void *)((int)puVar2 + 0x11),local_8,0x1d4);
  }
  return puVar2;
}

