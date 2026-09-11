
/* WARNING: Type propagation algorithm not settling */

undefined4 __cdecl FUN_100015a2(uint param_1,undefined4 *param_2)

{
  int iVar1;
  undefined4 uVar2;
  undefined1 unaff_BP;
  undefined4 *puVar3;
  undefined auStackY_1f2d0 [3];
  undefined uStackY_1f2cd;
  uint uStackY_1f2cc;
  undefined4 uStackY_1f2c8;
  undefined4 uStackY_1f2c4;
  undefined uStackY_1f2c0;
  char local_34;
  undefined4 local_33;
  undefined4 uStackY_2c;
  uint uVar4;
  
  FUN_10004dd0(unaff_BP);
  DAT_10006018 = (char)param_1;
  uVar2 = 0;
  uVar4 = 0;
  uStackY_2c = 0x100015e3;
  iVar1 = FUN_100044a2(2,&DAT_10006014,6,&stack0xffffffec,8,(uint *)&stack0xfffffff8);
  if (iVar1 == 0) {
    _auStackY_1f2d0 = _auStackY_1f2d0 & 0xffffff00;
    puVar3 = (undefined4 *)((int)auStackY_1f2d0 + 1);
    for (iVar1 = 0x7ca6; iVar1 != 0; iVar1 = iVar1 + -1) {
      *puVar3 = 0;
      puVar3 = puVar3 + 1;
    }
    *(undefined2 *)puVar3 = 0;
    *(undefined *)((int)puVar3 + 2) = 0;
    uVar2 = *(undefined4 *)(uVar4 + 4);
    *param_2 = uVar4;
    FUN_100042be(CONCAT31((int3)(uVar4 >> 8),DAT_10006018),uVar4);
    param_1 = 0x1f29c;
    uVar4 = FUN_1000432a(&DAT_10006014,auStackY_1f2d0,&param_1);
    if (uVar4 != 0) {
      uStackY_1f2c8 = 0x17;
      uStackY_1f2c0 = DAT_10006010;
      uStackY_1f2cc = param_1;
      _auStackY_1f2d0 = 0x18;
      uStackY_1f2c4 = uVar2;
      FUN_10004b9b(auStackY_1f2d0,param_1);
    }
    FUN_100016bb(0x10006014);
  }
  else {
    puVar3 = &local_33;
    for (iVar1 = 7; iVar1 != 0; iVar1 = iVar1 + -1) {
      *puVar3 = 0;
      puVar3 = puVar3 + 1;
    }
    *(undefined2 *)puVar3 = 0;
    *(undefined *)((int)puVar3 + 2) = 0;
    local_33._0_1_ = 0x3a;
    local_34 = (char)param_1;
    local_33._1_1_ = 0x5c;
    strcat(&local_34,&stack0xffffffec);
    DeleteFileA(&local_34);
  }
  return uVar2;
}

