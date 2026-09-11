
void FUN_100033c4(void)

{
  void *pvVar1;
  int iVar2;
  undefined4 local_4;
  
  pvVar1 = FUN_1000469e(&DAT_100062c0);
  iVar2 = FUN_1000407f(&local_4);
  if (iVar2 == 0) {
    iVar2 = FUN_10004249((uint)pvVar1);
    FUN_100024d7(0x10,DAT_10006010,iVar2);
  }
  else {
    FUN_100024d7(0x10,DAT_10006010,0);
  }
  return;
}

