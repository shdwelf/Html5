
void __cdecl FUN_10003575(int param_1)

{
  byte bVar1;
  ushort uVar2;
  bool bVar3;
  int iVar4;
  undefined4 *puVar5;
  int iVar6;
  
  iVar6 = 0;
  bVar3 = false;
  if (param_1 != 0) {
    bVar1 = *(byte *)(param_1 + 8);
    iVar4 = FUN_1000407f(&param_1);
    if (iVar4 == 0) {
      if (bVar1 != 0) {
        iVar4 = 0x33;
        do {
          uVar2 = *(ushort *)(iVar6 + 0x14 + param_1);
          if (uVar2 == bVar1) {
            FUN_10004231(uVar2);
            bVar3 = true;
          }
          iVar6 = iVar6 + 9;
          iVar4 = iVar4 + -1;
        } while (iVar4 != 0);
      }
      puVar5 = (undefined4 *)malloc(0x14);
      if (puVar5 == (undefined4 *)0x0) {
        return;
      }
      *puVar5 = 0x17;
      puVar5[2] = 0x13;
      puVar5[1] = 2;
      *(undefined *)(puVar5 + 4) = DAT_10006010;
      if (bVar3) {
        *(byte *)((int)puVar5 + 0x11) = bVar1;
        return;
      }
      *(undefined *)((int)puVar5 + 0x11) = 0;
      *(byte *)((int)puVar5 + 0x12) = bVar1;
      return;
    }
  }
  FUN_100024d7(0x13,DAT_10006010,0);
  return;
}

