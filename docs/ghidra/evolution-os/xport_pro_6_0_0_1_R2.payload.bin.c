/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: xport_pro_6_0_0_1_R2.payload.bin
 * SHA-256: 6e67282af187acd8ed13ec5dac4ee62ff556a383c7577a03ee2151e87c54ca81
 */

/* FUN_00000566 @ 00000566 completed=true */

undefined4 FUN_00000566(int param_1,undefined4 param_2)

{
  undefined4 uVar1;
  
  if (DAT_40000400 == '\0') {
    uVar1 = *(undefined4 *)(param_1 + 0x26);
    DAT_40000400 = '\x01';
    (*(code *)&SUB_4007ee04)(uVar1,param_2,0x4016f09f,0x40162692,0x6ee,0,0);
    (*(code *)&SUB_4007ee04)(uVar1,param_2,0x401626ef,0x401626cc,0x694,1,0x401f8684);
    (*(code *)&SUB_4007ee04)(uVar1,param_2,0x40162720,0x401626fc,0x694,1,0x401f8680);
    (*(code *)&SUB_4007ee04)(uVar1,param_2,0x40162767,0x4016272e,0x644,1,0x401f867c);
    (*(code *)&SUB_4007ee04)(uVar1,param_2,0x40162764,0x40162748,0x644,1,0x401f8678);
  }
  return 1;
}



/* FUN_00000644 @ 00000644 completed=true */

void FUN_00000644(int param_1,undefined4 *param_2)

{
  int iVar1;
  char cVar2;
  
  iVar1 = func_0x4014e3c8(*param_2,0x40162776);
  cVar2 = func_0x400837a8(*(undefined4 *)(param_1 + 0x26),-(int)-(iVar1 == 0));
  if (cVar2 == '\0') {
    func_0x400763f4(param_1,0x4016277e);
  }
  return;
}



/* FUN_00000694 @ 00000694 completed=true */

void FUN_00000694(undefined4 param_1,undefined4 *param_2)

{
  int iVar1;
  char cVar2;
  
  iVar1 = func_0x4014e3c8(*param_2,0x40178954);
  cVar2 = func_0x400551a6(-(int)-(iVar1 == 0),1,0x4007680a,param_1);
  if (cVar2 == '\0') {
    func_0x400763f4(param_1,0x4016277e);
  }
  return;
}



/* FUN_000006ee @ 000006ee completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_000006ee(int param_1)

{
  char cVar2;
  undefined4 uVar1;
  undefined1 auStack_a6 [32];
  undefined1 auStack_86 [100];
  undefined4 local_22;
  undefined4 local_1e;
  undefined4 local_1a;
  undefined4 local_16;
  undefined4 local_12;
  undefined2 local_e;
  int local_c;
  undefined2 local_8;
  char local_6;
  
  cVar2 = func_0x4008381a(*(undefined4 *)(param_1 + 0x26),&local_22);
  if (cVar2 == '\0') {
    func_0x400763f4(param_1,0x4016277e);
  }
  else {
    func_0x400763f4(param_1,0x40162796);
    uVar1 = 0x401627bc;
    if (local_6 == '\0') {
      uVar1 = 0x401627ad;
    }
    (*(code *)&SUB_401455b0)(auStack_86,100,0x401627c8,&DAT_401694ae,uVar1);
    (*(code *)&SUB_400763f4)(param_1,auStack_86);
    (*(code *)&SUB_401455b0)(auStack_86,100,0x401627e5,&DAT_401694ae,local_22);
    (*(code *)&SUB_400763f4)(param_1,auStack_86);
    (*(code *)&SUB_401455b0)(auStack_86,100,0x40162803,&DAT_401694ae,local_1e);
    (*(code *)&SUB_400763f4)(param_1,auStack_86);
    (*(code *)&SUB_401455b0)(auStack_86,100,0x40162821,&DAT_401694ae,local_1a);
    (*(code *)&SUB_400763f4)(param_1,auStack_86);
    (*(code *)&SUB_401455b0)(auStack_86,100,0x4016283f,&DAT_401694ae,local_16);
    (*(code *)&SUB_400763f4)(param_1,auStack_86);
    (*(code *)&SUB_401455b0)(auStack_86,100,0x4016285d,&DAT_401694ae,local_12);
    (*(code *)&SUB_400763f4)(param_1,auStack_86);
    if (local_c == 0) {
      (*(code *)&SUB_401455b0)(auStack_86,100,0x4016287b,&DAT_401694ae);
    }
    else {
      func_0x400fca22(local_c,auStack_a6);
      uVar1 = func_0x400f97b0(_DAT_401f8be8);
      func_0x401455b0(auStack_86,100,0x401628b0,&DAT_401694ae,uVar1,local_e,0x401628ad,auStack_a6,
                      local_8);
    }
    func_0x400763f4(param_1,auStack_86);
  }
  return;
}



/* FUN_000008ac @ 000008ac completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

bool FUN_000008ac(void)

{
  bool bVar1;
  
  if (_DAT_40000404 == 0) {
    bVar1 = false;
  }
  else {
    bVar1 = *(char *)(_DAT_40000404 + 0x1c) != '\0';
  }
  return bVar1;
}



/* FUN_000008d4 @ 000008d4 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 * FUN_000008d4(undefined4 *param_1)

{
  undefined4 *puVar1;
  undefined4 *puVar2;
  
  if (_DAT_40000404 == (undefined4 *)0x0) {
    puVar1 = (undefined4 *)0x0;
  }
  else {
    func_0x400f065c();
    puVar1 = _DAT_40000404;
    if (param_1 != (undefined4 *)0x0) {
      puVar2 = _DAT_40000404 + 1;
      *param_1 = *_DAT_40000404;
      param_1[1] = *puVar2;
      param_1[2] = puVar1[2];
      param_1[3] = puVar1[3];
      param_1[4] = puVar1[4];
      param_1[5] = puVar1[5];
      param_1[6] = puVar1[6];
      *(undefined2 *)(param_1 + 7) = *(undefined2 *)(puVar1 + 7);
      puVar1 = param_1;
    }
    func_0x400f06b0();
  }
  return puVar1;
}



/* FUN_00000924 @ 00000924 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_00000924(char param_1)

{
  int iVar1;
  undefined4 uVar2;
  
  iVar1 = _DAT_40000404;
  if (_DAT_40000404 == 0) {
    uVar2 = 0;
  }
  else {
    if (param_1 == '\0') {
      if (*(int *)(_DAT_40000404 + 0x2e) != 0) {
        *(undefined1 *)(_DAT_40000404 + 0x24) = 1;
        iVar1 = *(int *)(iVar1 + 0x20);
        if (-1 < iVar1) {
          func_0x4010027c(iVar1);
        }
        func_0x400f212c(_DAT_40000404 + 0x26,*(undefined4 *)(_DAT_40000404 + 0x2a),0xffffffff,
                        0x401628f8,0xc4);
        *(undefined1 *)(_DAT_40000404 + 0x1c) = 0;
        return 1;
      }
    }
    else if (*(int *)(_DAT_40000404 + 0x2e) == 0) {
      *(undefined1 *)(_DAT_40000404 + 0x24) = 0;
      func_0x400f38a2(100,0xa88,0x401628e6,0xc00,iVar1);
      iVar1 = _DAT_40000404;
      *(undefined4 *)(_DAT_40000404 + 0x2e) = 1;
      *(undefined1 *)(iVar1 + 0x1c) = 1;
      return 1;
    }
    uVar2 = 1;
  }
  return uVar2;
}



/* FUN_000009d6 @ 000009d6 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint FUN_000009d6(char param_1,char param_2,undefined4 param_3,undefined4 param_4)

{
  undefined4 uVar1;
  uint uVar2;
  
  func_0x40059082();
  uVar1 = 0x77fe;
  if (param_1 == '\0') {
    uVar1 = 0;
  }
  func_0x40059248(0x4014f2b2,0,0,0,1,uVar1);
  uVar2 = func_0x40058f3e(param_2,param_3,param_4);
  if ((char)uVar2 != '\0') {
    if (param_2 == '\0') {
      return 1;
    }
    if (_DAT_40000404 != 0) {
      if (param_1 == '\0') {
        uVar2 = func_0x40057970(0xd7,0,0,1);
        if ((int)uVar2 < 0) goto LAB_00000a7c;
      }
      else {
        func_0x400571fa(0xd7,1);
      }
      uVar2 = FUN_00000924(param_1);
      return uVar2;
    }
  }
LAB_00000a7c:
  return uVar2 & 0xffffff00;
}



/* FUN_00000a88 @ 00000a88 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00000a88(int *param_1)

{
  uint uVar1;
  uint uVar2;
  int iVar3;
  undefined2 uVar7;
  undefined4 uVar4;
  undefined4 *puVar5;
  char cVar8;
  undefined4 uVar6;
  int iVar9;
  int iVar10;
  undefined1 local_9a [2];
  undefined4 local_98;
  undefined2 local_94;
  undefined2 local_92;
  undefined4 local_90;
  char local_84;
  byte local_83;
  char local_82;
  char local_81;
  undefined4 local_80;
  undefined2 local_7c;
  undefined2 uStack_7a;
  undefined2 local_78;
  undefined2 uStack_76;
  undefined2 local_74;
  undefined2 uStack_72;
  undefined2 local_70;
  undefined2 uStack_6e;
  undefined4 local_6c;
  uint local_68;
  undefined2 local_64;
  
  iVar9 = -1;
  iVar10 = 0;
  do {
    while( true ) {
      if (*(char *)(param_1 + 9) != '\0') {
        param_1[8] = -1;
        if (-1 < iVar9) {
          func_0x4010027c(iVar9);
        }
        *(undefined1 *)(_DAT_40000404 + 0x24) = 0;
        func_0x400f1934(*(undefined4 *)((int)param_1 + 0x2a));
        *(undefined4 *)(_DAT_40000404 + 0x2e) = 0;
        return;
      }
      if (iVar9 < 0) break;
LAB_00000b10:
      local_94 = 2;
      local_90 = func_0x400fc980(0);
      local_92 = func_0x400fc974(*(undefined2 *)((int)param_1 + 0x1e));
      iVar3 = func_0x400ffae2(iVar9,&local_94,0x10);
      if (iVar3 < 0) {
        func_0x400f32ec(0,2,1000,0x401628f8,0x100);
      }
      else {
        while( true ) {
          local_98 = 0x10;
          iVar3 = func_0x400fdb98(iVar9,&local_84,0x80,0,&local_94,&local_98);
          if (iVar3 < 1) break;
          *(undefined2 *)(param_1 + 5) = *(undefined2 *)((int)param_1 + 0x1e);
          uVar7 = func_0x400fc974(local_92);
          *(undefined2 *)((int)param_1 + 0x1a) = uVar7;
          uVar4 = func_0x400fc980(local_90);
          *(undefined4 *)((int)param_1 + 0x16) = uVar4;
          if (iVar3 < 4) {
            param_1[2] = param_1[2] + 1;
          }
          else if (((local_84 == '\0') && (local_83 < 2)) && (local_82 == '\0')) {
            uVar1 = param_1[1];
            uVar2 = param_1[4];
            if (local_81 == -0xc) {
              *param_1 = *param_1 + 1;
              local_81 = -0xb;
              local_80 = 0;
              local_7c = 0;
              uStack_7a = 0;
              local_78 = 0;
              uStack_76 = 0;
              local_74 = 0;
              uStack_72 = 0;
              local_70 = 0;
              uStack_6e = 0;
              local_6c = 0;
              local_68 = 0;
              local_64 = 0;
              uVar4 = (*(code *)&SUB_40143b0e)();
              uVar4 = func_0x4014e454(uVar4);
              uVar6 = (*(code *)&SUB_40143b0e)();
              func_0x4014d790(&local_74,uVar6,uVar4);
              iVar10 = 0x21;
            }
            else if (local_81 == -10) {
              *param_1 = *param_1 + 1;
              local_81 = -9;
              local_80._2_2_ = 0;
              local_80._0_2_ = 0;
              local_7c = 0;
              uStack_7a = 0;
              local_78 = 0;
              uStack_76 = 0;
              local_74 = 0;
              uStack_72 = 0;
              local_70 = 0;
              uStack_6e = 0;
              local_6c = 0;
              local_68 = local_68 & 0xffff;
              func_0x400e57f4(local_9a);
              local_80 = 6;
              local_7c = *_DAT_401f9770;
              puVar5 = (undefined4 *)func_0x40143d70();
              uStack_7a = (undefined2)((uint)*puVar5 >> 0x10);
              local_78 = (undefined2)*puVar5;
              uStack_76 = (undefined2)((uint)puVar5[1] >> 0x10);
              local_74 = (undefined2)puVar5[1];
              uStack_72 = (undefined2)((uint)puVar5[2] >> 0x10);
              local_70 = (undefined2)puVar5[2];
              uStack_6e = *(undefined2 *)(puVar5 + 3);
              cVar8 = func_0x40101f24(_DAT_401f8be8,&local_6c);
              if (cVar8 == '\0') {
                param_1[4] = param_1[4] + 1;
                iVar10 = 0x1e;
              }
              else {
                iVar10 = 0x1e;
              }
            }
            else {
              param_1[1] = uVar1 + 1;
            }
            if (((uint)param_1[1] <= uVar1) && ((uint)param_1[4] <= uVar2)) {
              iVar3 = func_0x400ff664(iVar9,&local_84,iVar10,0,&local_94,0x10);
              if (iVar3 < 0) break;
              if (iVar3 == iVar10) {
                param_1[3] = param_1[3] + 1;
              }
              else {
                param_1[4] = param_1[4] + 1;
              }
            }
          }
          else {
            param_1[2] = param_1[2] + 1;
          }
        }
        param_1[8] = -1;
        func_0x4010027c(iVar9);
        iVar9 = -1;
      }
    }
    iVar9 = func_0x40100716(2,2,0);
    if (-1 < iVar9) {
      param_1[8] = iVar9;
      goto LAB_00000b10;
    }
    func_0x400f32ec(0,2,1000,0x401628f8,0xf6);
  } while( true );
}



/* FUN_00000d7a @ 00000d7a completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined1 FUN_00000d7a(void)

{
  undefined1 uVar1;
  
  if (_DAT_40000404 == 0) {
    uVar1 = 1;
  }
  else {
    uVar1 = FUN_00000924(0);
    if (*(int *)(_DAT_40000404 + 0x2a) != 0) {
      func_0x400f176a(*(int *)(_DAT_40000404 + 0x2a));
    }
    func_0x400eff12(_DAT_40000404);
    _DAT_40000404 = 0;
  }
  return uVar1;
}



/* FUN_00000dca @ 00000dca completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint FUN_00000dca(void)

{
  int iVar1;
  undefined4 uVar2;
  uint uVar3;
  char cVar4;
  
  if (_DAT_40000404 == 0) {
    iVar1 = func_0x400f0616(0,0x32,0x401628f8,0x28);
    if (iVar1 == 0) {
      _DAT_40000404 = iVar1;
      return 0;
    }
    _DAT_40000404 = iVar1;
    *(undefined4 *)(iVar1 + 0x20) = 0xffffffff;
    *(undefined2 *)(iVar1 + 0x1e) = 0x77fe;
    *(undefined1 *)(iVar1 + 0x1c) = 0;
    uVar2 = func_0x400f16ee(0x40162914);
    *(undefined4 *)(iVar1 + 0x2a) = uVar2;
    if (*(int *)(_DAT_40000404 + 0x2a) == 0) {
      uVar3 = func_0x400eff12(_DAT_40000404);
      _DAT_40000404 = 0;
      return uVar3 & 0xffffff00;
    }
    func_0x400f1636(_DAT_40000404 + 0x26,*(int *)(_DAT_40000404 + 0x2a));
    func_0x400592a6(0x4014f2b2,0,0,0,1,0x77fe);
    iVar1 = func_0x40057426(0xd7);
    if (iVar1 < 0) {
      func_0x40059304(0x4014f2b2,0,0,0,1,0x77fe);
      cVar4 = FUN_00000924(1);
      if (cVar4 == '\0') {
        uVar3 = FUN_00000d7a();
        return uVar3 & 0xffffff00;
      }
    }
  }
  return 1;
}



/* FUN_00000ec0 @ 00000ec0 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00000ec0(undefined4 param_1)

{
  int iVar1;
  undefined1 auStack_a6 [100];
  undefined1 auStack_42 [32];
  undefined4 local_22;
  undefined4 local_1e;
  undefined4 local_1a;
  undefined4 local_16;
  undefined4 local_12;
  undefined2 local_e;
  undefined2 uStack_c;
  undefined2 local_a;
  undefined2 uStack_8;
  undefined2 local_6;
  
  iVar1 = func_0x400550a4(&local_22);
  if (iVar1 == 0) {
    local_22 = 0;
    local_1e = 0;
    local_1a = 0;
    local_16 = 0;
    local_12 = 0;
    local_e = 0;
    uStack_c = 0;
    local_a = 0;
    uStack_8 = 0;
    local_6 = 0;
  }
  if (local_6._0_1_ == '\0') {
    func_0x400e662c(param_1,0x4016293a,_DAT_401f89e4,0x40162946);
  }
  else {
    func_0x400e662c(param_1,0x4016293a,_DAT_401f89e4,0x4016292d);
  }
  (*(code *)&SUB_400e66e8)(param_1,0x40162958,_DAT_401f89e4,local_22);
  (*(code *)&SUB_400e66e8)(param_1,0x40162962,_DAT_401f89e4,local_1e);
  (*(code *)&SUB_400e66e8)(param_1,0x4016296d,_DAT_401f89e4,local_1a);
  (*(code *)&SUB_400e66e8)(param_1,0x40162976,_DAT_401f89e4,local_16);
  (*(code *)&SUB_400e66e8)(param_1,0x40162981,_DAT_401f89e4,local_12);
  if (CONCAT22(uStack_c,local_a) == 0) {
    func_0x400e662c(param_1,0x4016298b,_DAT_401f89e4,0x40162895);
  }
  else {
    func_0x400fca22(CONCAT22(uStack_c,local_a),auStack_42);
    func_0x401455b0(auStack_a6,100,0x40169890,auStack_42,uStack_8);
    func_0x400e662c(param_1,0x4016298b,_DAT_401f89e4,auStack_a6);
  }
  return;
}



/* FUN_00001034 @ 00001034 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_00001034(undefined4 param_1)

{
  int iVar1;
  int iVar2;
  char cVar3;
  
  iVar1 = func_0x400e8764(param_1,0x40162994);
  func_0x400e67ca(param_1);
  func_0x400e6530(param_1,_DAT_401f89e0,0,&DAT_4017a161);
  if (iVar1 != 0) {
    iVar2 = func_0x4014e3c8(iVar1,0x40176944);
    if (iVar2 == 0) {
      cVar3 = func_0x400551a6(1,1,&SUB_400cf8fa,param_1);
      if (cVar3 != '\0') {
        func_0x400ce586(param_1,_DAT_401f89e0,_DAT_401f8a28,1);
LAB_00001180:
        func_0x40056fce(1);
        FUN_00000ec0(param_1);
        goto LAB_0000116a;
      }
      func_0x400ce586(param_1,_DAT_401f89e0,_DAT_401f8a28,0);
    }
    else {
      iVar1 = func_0x4014e3c8(iVar1,0x4016299a);
      if (iVar1 == 0) {
        cVar3 = func_0x400551a6(0,1,&SUB_400cf8fa,param_1);
        if (cVar3 != '\0') {
          func_0x400ce586(param_1,_DAT_401f89e0,_DAT_401f8a28,3);
          goto LAB_00001180;
        }
        func_0x400ce586(param_1,_DAT_401f89e0,_DAT_401f8a28,2);
      }
    }
  }
  func_0x400ce518(param_1,_DAT_401f89f4,2);
LAB_0000116a:
  func_0x400e6564(param_1);
  return 1;
}



/* FUN_0000120c @ 0000120c completed=true */

undefined4 FUN_0000120c(void)

{
  return 0;
}



/* FUN_00001216 @ 00001216 completed=true */

undefined4 FUN_00001216(undefined4 param_1)

{
  return param_1;
}



/* FUN_00001222 @ 00001222 completed=true */

int FUN_00001222(int param_1,int param_2)

{
  return -CONCAT31((int3)((uint)param_2 >> 8),-(param_2 == param_1));
}



/* FUN_00001236 @ 00001236 completed=true */

undefined4 FUN_00001236(undefined4 param_1)

{
  return param_1;
}



/* FUN_00001242 @ 00001242 completed=true */

int FUN_00001242(int param_1,int param_2)

{
  return -CONCAT31((int3)((uint)param_2 >> 8),-(param_2 == param_1));
}



/* FUN_00001256 @ 00001256 completed=true */

void FUN_00001256(void)

{
  return;
}



/* FUN_0000125e @ 0000125e completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_0000125e(void)

{
  return _DAT_40000416;
}



/* FUN_0000126c @ 0000126c completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint FUN_0000126c(void)

{
  uint uVar1;
  
  if (_DAT_40000412 + _DAT_40000416 == 0) {
    uVar1 = 0;
  }
  else {
    uVar1 = (uint)(_DAT_40000416 * 100) / (uint)(_DAT_40000412 + _DAT_40000416);
  }
  return uVar1;
}



/* FUN_00001296 @ 00001296 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00001296(int param_1)

{
  _DAT_40000416 = _DAT_40000416 + param_1;
  return;
}



/* FUN_000012ac @ 000012ac completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_000012ac(int param_1)

{
  _DAT_40000412 = _DAT_40000412 + param_1;
  return;
}



/* FUN_000012c2 @ 000012c2 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_000012c2(void)

{
  _DAT_40000416 = 0;
  _DAT_40000412 = 0;
  return;
}



/* FUN_000012d6 @ 000012d6 completed=true */

uint FUN_000012d6(int param_1,int param_2)

{
  int in_D0;
  int iVar1;
  uint3 uVar2;
  undefined4 unaff_D2;
  uint uVar3;
  
  uVar2 = (uint3)((uint)unaff_D2 >> 8);
  if (param_2 < 1) {
    uVar3 = (uint)uVar2 << 8;
  }
  else {
    iVar1 = 0;
    uVar3 = (uint)uVar2 << 8;
    do {
      in_D0 = CONCAT31((int3)((uint)in_D0 >> 8),*(undefined1 *)(param_1 + iVar1));
      uVar3 = in_D0 + uVar3;
      iVar1 = iVar1 + 1;
    } while (iVar1 < param_2);
  }
  return ~uVar3;
}



/* FUN_00001306 @ 00001306 completed=true */

int FUN_00001306(ushort param_1)

{
  uint uVar1;
  
  uVar1 = param_1 - 1 & 0xffff;
  return -CONCAT31((int3)(uVar1 >> 8),-(uVar1 < 0xfffe));
}



/* FUN_00001324 @ 00001324 completed=true */

undefined1 FUN_00001324(void)

{
  return DAT_40000408;
}



/* FUN_00001332 @ 00001332 completed=true */

uint * FUN_00001332(undefined4 param_1,int param_2,uint *param_3)

{
  int iVar1;
  
  if ((param_2 != 0) && (iVar1 = func_0x400e1b4e(param_1), 0 < iVar1)) {
    func_0x400e303e(param_1,0,0);
  }
  if ((((param_3 != (uint *)0x0) && (iVar1 = func_0x400e2b98(param_3,0x10,1,param_1), iVar1 == 1))
      && (*param_3 < 0x4001)) && (iVar1 = func_0x400e303e(param_1,*param_3,1), iVar1 == 0)) {
    *(undefined4 *)((int)param_3 + 0xe) = 0;
    return param_3;
  }
  return (uint *)0x0;
}



/* FUN_000013ba @ 000013ba completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int FUN_000013ba(void)

{
  int iVar1;
  char cVar2;
  int iVar3;
  undefined1 auStack_20 [4];
  int *local_1c;
  int local_18 [5];
  
  local_1c = local_18;
  iVar1 = func_0x400e4312(0x401629d1,0x401737f7);
  if (iVar1 == 0) {
    iVar3 = 0;
  }
  else {
    local_1c = (int *)FUN_00001332(iVar1,1,local_1c);
    if (local_1c == (int *)0x0) {
      iVar3 = 0;
      local_1c = (int *)0x0;
    }
    else {
      iVar3 = 0;
      do {
        iVar3 = *local_1c + 0x10 + iVar3;
        local_1c = (int *)FUN_00001332(iVar1,0,local_1c);
      } while (local_1c != (int *)0x0);
    }
    func_0x400e30e2(iVar1);
  }
  func_0x400e5db4(_DAT_4000040a,auStack_20);
  while( true ) {
    cVar2 = (*(code *)&SUB_400e5dd2)(_DAT_4000040a,auStack_20,0,&local_1c);
    if (cVar2 == '\0') break;
    iVar3 = *local_1c + 0x10 + iVar3;
  }
  func_0x400e5dca(_DAT_4000040a,auStack_20);
  return iVar3;
}



/* FUN_0000149e @ 0000149e completed=true */

undefined4 FUN_0000149e(undefined4 param_1,undefined4 param_2,int param_3)

{
  int iVar1;
  
  iVar1 = func_0x400e303e(param_1,-param_3,1);
  if ((iVar1 == 0) && (iVar1 = func_0x400e2b98(param_2,1,param_3,param_1), param_3 == iVar1)) {
    return param_2;
  }
  return 0;
}



/* FUN_000014f2 @ 000014f2 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_000014f2(void)

{
  if (_DAT_4000040a != 0) {
    func_0x400e5f08(_DAT_4000040a,FUN_0000153a,0);
  }
  return 0;
}



/* FUN_00001516 @ 00001516 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_00001516(void)

{
  if (_DAT_4000040e != 0) {
    func_0x400e5f08(_DAT_4000040e,FUN_00001256,0);
  }
  return 0;
}



/* FUN_0000153a @ 0000153a completed=true */

void FUN_0000153a(undefined4 param_1,int param_2)

{
  if (*(int *)(param_2 + 0xe) != 0) {
    func_0x400eff12(*(int *)(param_2 + 0xe));
  }
  if (param_2 != 0) {
    func_0x400eff12(param_2);
  }
  return;
}



/* FUN_0000156a @ 0000156a completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int FUN_0000156a(void)

{
  _DAT_4000040a = func_0x400e6008(FUN_00001216,FUN_00001222,0x35,0x401629df);
  DAT_40000408 = 0;
  return (int)-(_DAT_4000040a == 0);
}



/* FUN_000015a0 @ 000015a0 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_000015a0(void)

{
  func_0x400e5f08(_DAT_4000040a,FUN_0000153a,0);
  _DAT_4000040a = 0;
  FUN_0000156a();
  return;
}



/* FUN_000015c8 @ 000015c8 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int FUN_000015c8(void)

{
  _DAT_4000040e = func_0x400e6008(FUN_00001236,FUN_00001242,0x35,0x401629e8);
  return (int)-(_DAT_4000040e == 0);
}



/* FUN_000015f6 @ 000015f6 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_000015f6(void)

{
  func_0x400e5f08(_DAT_4000040e,FUN_00001256,0);
  _DAT_4000040e = 0;
  FUN_000015c8();
  return;
}



/* FUN_0000161e @ 0000161e completed=true */

int FUN_0000161e(undefined4 param_1,int *param_2)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  int local_14;
  undefined2 local_10;
  int local_c;
  undefined1 local_8;
  
  iVar1 = func_0x400e303e(param_1,0,2);
  if (iVar1 == 0) {
    uVar2 = func_0x400e1b4e(param_1);
    local_14 = *param_2;
    local_c = 7;
    local_10 = *(undefined2 *)(param_2 + 1);
    local_8 = *(undefined1 *)(param_2 + 3);
    iVar1 = func_0x400e3fb0(&local_14,0x10,1,param_1);
    if (iVar1 == 1) {
      if (local_14 < 1) {
        iVar1 = 0;
      }
      else {
        iVar1 = func_0x400e3fb0(*(undefined4 *)((int)param_2 + 0xe),1,local_14,param_1);
        if (iVar1 != local_14) {
          return -2;
        }
      }
      func_0x400e2f9e(param_1);
      iVar3 = func_0x400e303e(param_1,uVar2,0);
      if (iVar3 == 0) {
        local_c = param_2[2];
        iVar3 = func_0x400e3fb0(&local_14,0x10,1,param_1);
        if (iVar3 == 1) {
          func_0x400e2f9e(param_1);
          FUN_000012ac(local_14 + 0x14);
          return iVar1;
        }
      }
    }
  }
  return -1;
}



/* FUN_00001750 @ 00001750 completed=true */

undefined4
FUN_00001750(undefined4 param_1,short param_2,int param_3,int param_4,undefined4 *param_5)

{
  int iVar1;
  undefined4 *puVar2;
  char cVar3;
  int local_14;
  short local_10;
  int local_c;
  
  *param_5 = 0;
  iVar1 = func_0x400e1b4e(param_1);
  if ((0 < iVar1) && (iVar1 = func_0x400e303e(param_1,0,0), iVar1 != 0)) {
    puVar2 = (undefined4 *)func_0x400f0954();
    *param_5 = *puVar2;
    return 0xffffffff;
  }
  do {
    iVar1 = (*(code *)&SUB_400e2b98)(&local_14,0x10,1,param_1);
    if (iVar1 != 1) {
      puVar2 = (undefined4 *)func_0x400f0954();
      *param_5 = *puVar2;
      return 0xffffffff;
    }
    if ((param_2 == local_10) && (param_3 == local_c)) {
      func_0x400e303e(param_1,0xfffffff0,1);
      local_c = param_4;
      iVar1 = func_0x400e3fb0(&local_14,0x10,1,param_1);
      if (iVar1 != 1) {
        puVar2 = (undefined4 *)func_0x400f0954();
        *param_5 = *puVar2;
        return 0xffffffff;
      }
      func_0x400e2f9e(param_1);
      if (param_4 != 0) {
        return 1;
      }
      FUN_00001296(local_14 + 0x14);
      return 1;
    }
    iVar1 = (*(code *)&SUB_400e303e)(param_1,local_14,1);
    if (iVar1 != 0) {
      return 0xffffffff;
    }
    cVar3 = (*(code *)&SUB_400e1ad8)(param_1);
  } while (cVar3 == '\0');
  return 0;
}



/* FUN_00001898 @ 00001898 completed=true */

uint * FUN_00001898(undefined4 param_1,int param_2,uint *param_3)

{
  int iVar1;
  undefined4 uVar2;
  uint uVar3;
  
  if (param_2 != 0) {
    iVar1 = func_0x400e1b4e(param_1);
    if (0 < iVar1) {
      func_0x400e303e(param_1,0,0);
    }
  }
  iVar1 = func_0x400e2b98(param_3,0x10,1,param_1);
  if ((iVar1 == 1) && (*param_3 < 0x4001)) {
    uVar2 = func_0x400f0236(0,*param_3,0x401629f7,0x5ba);
    *(undefined4 *)((int)param_3 + 0xe) = uVar2;
    uVar3 = func_0x400e2b98(uVar2,1,*param_3,param_1);
    if (uVar3 != *param_3) {
      func_0x400eff12(*(undefined4 *)((int)param_3 + 0xe));
      param_3 = (uint *)0x0;
    }
  }
  else {
    param_3 = (uint *)0x0;
  }
  return param_3;
}



/* FUN_00001942 @ 00001942 completed=true */

int FUN_00001942(undefined4 param_1)

{
  int iVar1;
  int *piVar2;
  char cVar4;
  char cVar5;
  undefined4 uVar3;
  int iVar6;
  undefined1 auStack_30 [20];
  undefined1 auStack_1c [4];
  undefined1 auStack_18 [20];
  
  piVar2 = (int *)FUN_00001898(param_1,1,auStack_18);
  if (piVar2 == (int *)0x0) {
    iVar6 = 0;
  }
  else {
    iVar6 = 0;
    do {
      cVar4 = FUN_00001306(*(undefined2 *)(piVar2 + 1));
      if (((cVar4 == '\0') || (iVar1 = *piVar2, 0x4000 < iVar1)) || (iVar1 < 0)) {
        func_0x400eff12(*(undefined4 *)((int)piVar2 + 0xe));
        return -1;
      }
      if (((uint)piVar2[2] < 2) ||
         (cVar4 = *(char *)(piVar2 + 3),
         cVar5 = FUN_000012d6(*(undefined4 *)((int)piVar2 + 0xe),iVar1), cVar5 == cVar4)) {
        if (piVar2[2] == 2) {
          uVar3 = func_0x400e1b4e(param_1);
          for (iVar6 = FUN_00001332(param_1,0,auStack_30); iVar6 != 0;
              iVar6 = FUN_00001332(param_1,0,iVar6)) {
            if ((*(short *)(piVar2 + 1) == *(short *)(iVar6 + 4)) && (*(int *)(iVar6 + 8) == 3)) {
              iVar6 = (*(code *)&SUB_40055f20)(param_1,*(short *)(iVar6 + 4),piVar2[2],0,auStack_1c)
              ;
              goto LAB_00001ad0;
            }
          }
          piVar2[2] = 3;
          FUN_0000161e(param_1,piVar2);
          iVar6 = (*(code *)&SUB_40055f20)(param_1,*(undefined2 *)(piVar2 + 1),2,0,auStack_1c);
LAB_00001ad0:
          func_0x400e303e(param_1,uVar3,0);
        }
        if (*(int *)((int)piVar2 + 0xe) != 0) {
          (*(code *)&SUB_400eff12)(*(int *)((int)piVar2 + 0xe));
        }
        piVar2 = (int *)FUN_00001898(param_1,0,piVar2);
      }
      else {
        uVar3 = func_0x400e1b4e(param_1);
        iVar6 = (*(code *)&SUB_40055f20)(param_1,*(undefined2 *)(piVar2 + 1),piVar2[2],0,auStack_1c)
        ;
        if ((iVar6 < 1) && (piVar2[2] == 3)) {
          if (*(int *)((int)piVar2 + 0xe) == 0) {
            return -1;
          }
          func_0x400eff12(*(int *)((int)piVar2 + 0xe));
          return -1;
        }
        if (*(int *)((int)piVar2 + 0xe) != 0) {
          (*(code *)&SUB_400eff12)(*(int *)((int)piVar2 + 0xe));
        }
        func_0x400e303e(param_1,uVar3,0);
        piVar2 = (int *)FUN_00001898(param_1,0,piVar2);
      }
    } while (piVar2 != (int *)0x0);
  }
  return iVar6;
}



/* FUN_00001b3a @ 00001b3a completed=true */

undefined4 FUN_00001b3a(undefined4 param_1)

{
  bool bVar1;
  int iVar2;
  int *piVar3;
  char cVar5;
  undefined4 uVar4;
  undefined1 auStack_2c [20];
  undefined1 auStack_18 [20];
  
  iVar2 = func_0x400e1b4e(param_1);
  if (0 < iVar2) {
    func_0x400e303e(param_1,0,0);
  }
  piVar3 = (int *)FUN_00001332(param_1,1,auStack_18);
  if (piVar3 == (int *)0x0) {
    bVar1 = false;
  }
  else {
    bVar1 = false;
    do {
      if (((*(short *)(piVar3 + 1) == 10) && (piVar3[2] == 3)) && (*piVar3 < 0x14)) {
        iVar2 = FUN_0000149e(param_1,auStack_2c,*piVar3);
        if (iVar2 != 0) {
          *(undefined1 *)(iVar2 + *piVar3) = 0;
          iVar2 = (*(code *)&SUB_4014e3c8)(iVar2,&DAT_40162a10);
          if (iVar2 != 0) goto LAB_00001c12;
          bVar1 = true;
        }
      }
      piVar3 = (int *)FUN_00001332(param_1,0,piVar3);
    } while (piVar3 != (int *)0x0);
  }
  cVar5 = func_0x400e1ad8(param_1);
  if ((cVar5 == '\0') || (!bVar1)) {
LAB_00001c12:
    uVar4 = 0xffffffff;
  }
  else {
    uVar4 = FUN_00001942(param_1);
  }
  return uVar4;
}



/* FUN_00001c1e @ 00001c1e completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int FUN_00001c1e(undefined2 param_1)

{
  char cVar1;
  
  cVar1 = func_0x400e5e64(_DAT_4000040e,param_1,FUN_00001256,0);
  return (int)-(cVar1 == '\0');
}



/* FUN_00001c4a @ 00001c4a completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int FUN_00001c4a(undefined2 param_1,undefined4 param_2)

{
  char cVar1;
  
  func_0x400e5e64(_DAT_4000040e,param_1,FUN_00001256,0);
  cVar1 = func_0x400e5f8c(_DAT_4000040e,param_1,param_2);
  return (int)-(cVar1 == '\0');
}



/* FUN_00001c92 @ 00001c92 completed=true */

undefined4 FUN_00001c92(void)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  int local_14;
  undefined2 local_10;
  int local_c;
  
  iVar1 = func_0x400e4312(0x401629d1,0x401737f7);
  if (iVar1 == 0) {
    uVar2 = 0;
  }
  else {
    FUN_000012c2();
    FUN_000015f6();
    iVar3 = func_0x400e1b4e(iVar1);
    if (0 < iVar3) {
      func_0x400e303e(iVar1,0,0);
    }
    do {
      iVar3 = (*(code *)&SUB_400e2b98)(&local_14,0x10,1,iVar1);
      if (iVar3 != 1) {
        func_0x400e30e2(iVar1);
        return 0;
      }
      if (local_c == 3) {
        iVar3 = (*(code *)&SUB_400e1b4e)(iVar1);
        iVar3 = (*(code *)&SUB_4005641a)(local_10,iVar3 + -0x10);
        if (iVar3 < 0) {
          func_0x400e30e2(iVar1);
          return 0xffffffff;
        }
        FUN_000012ac(local_14 + 0x14);
      }
      else {
        FUN_00001296(local_14 + 0x14);
      }
      iVar3 = (*(code *)&SUB_400e303e)(iVar1,local_14,1);
    } while (iVar3 == 0);
    func_0x400e30e2(iVar1);
    uVar2 = 0xffffffff;
  }
  return uVar2;
}



/* FUN_00001db4 @ 00001db4 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_00001db4(undefined2 param_1,undefined4 *param_2)

{
  char cVar2;
  undefined4 uVar1;
  
  func_0x400e5e64(_DAT_4000040a,param_1,FUN_0000153a,0);
  cVar2 = func_0x400e5f8c(_DAT_4000040a,param_1,param_2);
  if (cVar2 == '\0') {
    uVar1 = 0xffffffff;
  }
  else {
    DAT_40000408 = 1;
    uVar1 = *param_2;
  }
  return uVar1;
}



/* FUN_00001e08 @ 00001e08 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_00001e08(undefined2 param_1)

{
  char cVar1;
  undefined4 local_8;
  
  cVar1 = func_0x400e5cd4(_DAT_4000040e,param_1,&local_8);
  if (cVar1 == '\0') {
    local_8 = 0xffffffff;
  }
  return local_8;
}



/* FUN_00001e38 @ 00001e38 completed=true */

undefined4
FUN_00001e38(undefined4 param_1,short param_2,int param_3,int param_4,undefined4 *param_5)

{
  int iVar1;
  undefined4 *puVar2;
  int local_14;
  short local_10;
  int local_c;
  
  *param_5 = 0;
  iVar1 = func_0x400e1b4e(param_1);
  if ((0 < iVar1) && (iVar1 = func_0x400e303e(param_1,0,0), iVar1 != 0)) {
    puVar2 = (undefined4 *)func_0x400f0954();
    *param_5 = *puVar2;
    return 0xffffffff;
  }
  iVar1 = FUN_00001e08(param_2);
  if (-1 < iVar1) {
    iVar1 = func_0x400e303e(param_1,iVar1,0);
    if (iVar1 != 0) {
      puVar2 = (undefined4 *)func_0x400f0954();
      *param_5 = *puVar2;
      return 0xffffffff;
    }
    iVar1 = func_0x400e2b98(&local_14,0x10,1,param_1);
    if (iVar1 != 1) {
      puVar2 = (undefined4 *)func_0x400f0954();
      *param_5 = *puVar2;
      return 0xffffffff;
    }
    if ((param_2 == local_10) && (param_3 == local_c)) {
      iVar1 = func_0x400e303e(param_1,0xfffffff0,1);
      if (iVar1 != 0) {
        puVar2 = (undefined4 *)func_0x400f0954();
        *param_5 = *puVar2;
        return 0xffffffff;
      }
      local_c = param_4;
      iVar1 = func_0x400e3fb0(&local_14,0x10,1,param_1);
      if (iVar1 != 1) {
        puVar2 = (undefined4 *)func_0x400f0954();
        *param_5 = *puVar2;
        return 0xffffffff;
      }
      func_0x400e2f9e(param_1);
      if (param_4 != 0) {
        return 1;
      }
      FUN_00001296(local_14 + 0x14);
      return 1;
    }
  }
  return 0;
}



