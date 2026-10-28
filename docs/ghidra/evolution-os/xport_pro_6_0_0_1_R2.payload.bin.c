/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: xport_pro_6_0_0_1_R2.payload.bin
 * SHA-256: 6e67282af187acd8ed13ec5dac4ee62ff556a383c7577a03ee2151e87c54ca81
 */

/* FUN_40000566 @ 40000566 completed=true */

undefined4 FUN_40000566(int param_1,undefined4 param_2)

{
  undefined4 uVar1;
  
  if (PTR_DAT_40000400._0_1_ == '\0') {
    uVar1 = *(undefined4 *)(param_1 + 0x26);
    PTR_DAT_40000400._0_1_ = '\x01';
    FUN_4007ee04(uVar1,param_2,s_<h2>HTTP_Configuration<_h2>_<div_4016e92e + 0x771,&DAT_40162692,
                 FUN_400006ee,0,0);
    FUN_4007ee04(uVar1,param_2,&DAT_401626ef,&DAT_401626cc,FUN_40000694,1,0x401f8684);
    FUN_4007ee04(uVar1,param_2,&DAT_40162720,&DAT_401626fc,FUN_40000694,1,0x401f8680);
    FUN_4007ee04(uVar1,param_2,&DAT_40162767,&DAT_4016272e,FUN_40000644,1,0x401f867c);
    FUN_4007ee04(uVar1,param_2,&DAT_40162764,&DAT_40162748,FUN_40000644,1,0x401f8678);
  }
  return 1;
}



/* FUN_40000644 @ 40000644 completed=true */

void FUN_40000644(undefined4 param_1,undefined4 *param_2)

{
                    /* WARNING: Subroutine does not return */
  FUN_4014e3c8(*param_2,&DAT_40162776);
}



/* FUN_40000694 @ 40000694 completed=true */

void FUN_40000694(undefined4 param_1,undefined4 *param_2)

{
                    /* WARNING: Subroutine does not return */
  FUN_4014e3c8(*param_2,s_<h2>PPP_on_Line_<span_id__ppp_><_40178236 + 0x71e);
}



/* FUN_400006ee @ 400006ee completed=true */

void FUN_400006ee(int param_1)

{
  char cVar1;
  undefined1 auStack_22 [30];
  
  cVar1 = FUN_4008381a(*(undefined4 *)(param_1 + 0x26),auStack_22);
  if (cVar1 == '\0') {
                    /* WARNING: Subroutine does not return */
    FUN_400763f4(param_1,&DAT_4016277e);
  }
                    /* WARNING: Subroutine does not return */
  FUN_400763f4(param_1,&DAT_40162796);
}



/* FUN_400008ac @ 400008ac completed=true */

bool FUN_400008ac(void)

{
  bool bVar1;
  
  if (PTR_DAT_40000404 == (undefined *)0x0) {
    bVar1 = false;
  }
  else {
    bVar1 = PTR_DAT_40000404[0x1c] != '\0';
  }
  return bVar1;
}



/* FUN_400008d4 @ 400008d4 completed=true */

undefined4 FUN_400008d4(void)

{
  if (PTR_DAT_40000404 == (undefined *)0x0) {
    return 0;
  }
                    /* WARNING: Subroutine does not return */
  FUN_400f065c();
}



/* FUN_40000924 @ 40000924 completed=true */

undefined4 FUN_40000924(char param_1)

{
  int iVar1;
  undefined *puVar2;
  undefined4 uVar3;
  
  puVar2 = PTR_DAT_40000404;
  if (PTR_DAT_40000404 == (undefined *)0x0) {
    uVar3 = 0;
  }
  else {
    if (param_1 == '\0') {
      if (*(int *)(PTR_DAT_40000404 + 0x2e) != 0) {
        PTR_DAT_40000404[0x24] = 1;
        iVar1 = *(int *)(puVar2 + 0x20);
        if (-1 < iVar1) {
          FUN_4010027c(iVar1);
        }
        FUN_400f212c(PTR_DAT_40000404 + 0x26,*(undefined4 *)(PTR_DAT_40000404 + 0x2a),0xffffffff,
                     &DAT_401628f8,0xc4);
        PTR_DAT_40000404[0x1c] = 0;
        return 1;
      }
    }
    else if (*(int *)(PTR_DAT_40000404 + 0x2e) == 0) {
      PTR_DAT_40000404[0x24] = 0;
      FUN_400f38a2(100,FUN_40000a88,&DAT_401628e6,0xc00,puVar2);
      puVar2 = PTR_DAT_40000404;
      *(undefined4 *)(PTR_DAT_40000404 + 0x2e) = 1;
      puVar2[0x1c] = 1;
      return 1;
    }
    uVar3 = 1;
  }
  return uVar3;
}



/* FUN_400009d6 @ 400009d6 completed=true */

uint FUN_400009d6(char param_1,char param_2,undefined4 param_3,undefined4 param_4)

{
  undefined4 uVar1;
  uint uVar2;
  
  FUN_40059082();
  uVar1 = 0x77fe;
  if (param_1 == '\0') {
    uVar1 = 0;
  }
  FUN_40059248(&DAT_4014f2b2,0,0,0,1,uVar1);
  uVar2 = FUN_40058f3c(param_2,param_3,param_4);
  if ((char)uVar2 != '\0') {
    if (param_2 == '\0') {
      return 1;
    }
    if (PTR_DAT_40000404 != (undefined *)0x0) {
      if (param_1 == '\0') {
        uVar2 = FUN_40057970(0xd7,0,0,1);
        if ((int)uVar2 < 0) goto LAB_40000a7c;
      }
      else {
        FUN_400571fa(0xd7,1);
      }
      uVar2 = FUN_40000924(param_1);
      return uVar2;
    }
  }
LAB_40000a7c:
  return uVar2 & 0xffffff00;
}



/* FUN_40000a88 @ 40000a88 completed=true */

void FUN_40000a88(int param_1)

{
  int iVar1;
  
  iVar1 = -1;
  while( true ) {
    if (*(char *)(param_1 + 0x24) != '\0') {
      *(undefined4 *)(param_1 + 0x20) = 0xffffffff;
      if (-1 < iVar1) {
        FUN_4010027c(iVar1);
      }
      PTR_DAT_40000404[0x24] = 0;
      FUN_400f1934(*(undefined4 *)(param_1 + 0x2a));
      *(undefined4 *)(PTR_DAT_40000404 + 0x2e) = 0;
      return;
    }
    if (-1 < iVar1) break;
    iVar1 = FUN_40100716(2,2,0);
    if (-1 < iVar1) {
      *(int *)(param_1 + 0x20) = iVar1;
      break;
    }
    FUN_400f32ec(0,2,1000,&DAT_401628f8,0xf6);
  }
                    /* WARNING: Subroutine does not return */
  FUN_400fc980(0);
}



/* FUN_40000d7a @ 40000d7a completed=true */

undefined4 FUN_40000d7a(void)

{
  if (PTR_DAT_40000404 == (undefined *)0x0) {
    return 1;
  }
  FUN_40000924(0);
  if (*(int *)(PTR_DAT_40000404 + 0x2a) != 0) {
    FUN_400f176a(*(int *)(PTR_DAT_40000404 + 0x2a));
  }
                    /* WARNING: Subroutine does not return */
  FUN_400eff12(PTR_DAT_40000404);
}



/* FUN_40000dca @ 40000dca completed=true */

uint FUN_40000dca(void)

{
  undefined *puVar1;
  undefined4 uVar2;
  int iVar3;
  char cVar5;
  uint uVar4;
  
  if (PTR_DAT_40000404 == (undefined *)0x0) {
    puVar1 = (undefined *)switchD_400f05ca::caseD_64(0,0x32,&DAT_401628f8,0x28);
    if (puVar1 == (undefined *)0x0) {
      PTR_DAT_40000404 = puVar1;
      return 0;
    }
    PTR_DAT_40000404 = puVar1;
    *(undefined4 *)(puVar1 + 0x20) = 0xffffffff;
    *(undefined2 *)(puVar1 + 0x1e) = 0x77fe;
    puVar1[0x1c] = 0;
    uVar2 = FUN_400f16ee(&DAT_40162914);
    *(undefined4 *)(puVar1 + 0x2a) = uVar2;
    if (*(int *)(PTR_DAT_40000404 + 0x2a) == 0) {
                    /* WARNING: Subroutine does not return */
      FUN_400eff12(PTR_DAT_40000404);
    }
    FUN_400f1636(PTR_DAT_40000404 + 0x26,*(int *)(PTR_DAT_40000404 + 0x2a));
    func_0x400592a6(&DAT_4014f2b2,0,0,0,1,0x77fe);
    iVar3 = FUN_40057426(0xd7);
    if (iVar3 < 0) {
      FUN_40059304(&DAT_4014f2b2,0,0,0,1,0x77fe);
      cVar5 = FUN_40000924(1);
      if (cVar5 == '\0') {
        uVar4 = FUN_40000d7a();
        return uVar4 & 0xffffff00;
      }
    }
  }
  return 1;
}



/* FUN_40000ec0 @ 40000ec0 completed=true */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_40000ec0(undefined4 param_1)

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
  
  iVar1 = FUN_400550a4(&local_22);
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
    FUN_400e662c(param_1,&DAT_4016293a,_DAT_401f89e4,&DAT_40162946);
  }
  else {
    FUN_400e662c(param_1,&DAT_4016293a,_DAT_401f89e4,&DAT_4016292d);
  }
  FUN_400e66e8(param_1,&DAT_40162958,_DAT_401f89e4,local_22);
  FUN_400e66e8(param_1,&DAT_40162962,_DAT_401f89e4,local_1e);
  FUN_400e66e8(param_1,&DAT_4016296d,_DAT_401f89e4,local_1a);
  FUN_400e66e8(param_1,&DAT_40162976,_DAT_401f89e4,local_16);
  FUN_400e66e8(param_1,&DAT_40162981,_DAT_401f89e4,local_12);
  if (CONCAT22(uStack_c,local_a) == 0) {
    FUN_400e662c(param_1,&DAT_4016298b,_DAT_401f89e4,&DAT_40162895);
    return;
  }
  FUN_400fca22(CONCAT22(uStack_c,local_a),auStack_42);
                    /* WARNING: Subroutine does not return */
  FUN_401455b0(auStack_a6,100,s_<h2>Diagnostics__Log<_h2>_<div_i_4016914c + 0x744,auStack_42,
               uStack_8);
}



/* FUN_40001034 @ 40001034 completed=true */

void FUN_40001034(undefined4 param_1)

{
                    /* WARNING: Subroutine does not return */
  FUN_400e8764(param_1,&DAT_40162994);
}



/* FUN_4000120c @ 4000120c completed=true */

undefined4 FUN_4000120c(void)

{
  return 0;
}



/* FUN_40001216 @ 40001216 completed=true */

undefined4 FUN_40001216(undefined4 param_1)

{
  return param_1;
}



/* FUN_40001222 @ 40001222 completed=true */

int FUN_40001222(int param_1,int param_2)

{
  return -CONCAT31((int3)((uint)param_2 >> 8),-(param_2 == param_1));
}



/* FUN_40001236 @ 40001236 completed=true */

undefined4 FUN_40001236(undefined4 param_1)

{
  return param_1;
}



/* FUN_40001242 @ 40001242 completed=true */

int FUN_40001242(int param_1,int param_2)

{
  return -CONCAT31((int3)((uint)param_2 >> 8),-(param_2 == param_1));
}



/* FUN_40001256 @ 40001256 completed=true */

void FUN_40001256(void)

{
  return;
}



/* FUN_4000125e @ 4000125e completed=true */

undefined4 FUN_4000125e(void)

{
  return DAT_40000416;
}



/* FUN_4000126c @ 4000126c completed=true */

uint FUN_4000126c(void)

{
  uint uVar1;
  
  if (DAT_40000412 + DAT_40000416 == 0) {
    uVar1 = 0;
  }
  else {
    uVar1 = (uint)(DAT_40000416 * 100) / (uint)(DAT_40000412 + DAT_40000416);
  }
  return uVar1;
}



/* FUN_40001296 @ 40001296 completed=true */

void FUN_40001296(int param_1)

{
  DAT_40000416 = DAT_40000416 + param_1;
  return;
}



/* FUN_400012ac @ 400012ac completed=true */

void FUN_400012ac(int param_1)

{
  DAT_40000412 = DAT_40000412 + param_1;
  return;
}



/* FUN_400012c2 @ 400012c2 completed=true */

void FUN_400012c2(void)

{
  DAT_40000416 = 0;
  DAT_40000412 = 0;
  return;
}



/* FUN_400012d6 @ 400012d6 completed=true */

uint FUN_400012d6(int param_1,int param_2)

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



/* FUN_40001306 @ 40001306 completed=true */

int FUN_40001306(ushort param_1)

{
  uint uVar1;
  
  uVar1 = param_1 - 1 & 0xffff;
  return -CONCAT31((int3)(uVar1 >> 8),-(uVar1 < 0xfffe));
}



/* FUN_40001324 @ 40001324 completed=true */

undefined1 FUN_40001324(void)

{
  return DAT_40000408;
}



/* FUN_40001332 @ 40001332 completed=true */

uint * FUN_40001332(undefined4 param_1,int param_2,uint *param_3)

{
  int iVar1;
  
  if ((param_2 != 0) && (iVar1 = FUN_400e1b4e(param_1), 0 < iVar1)) {
    FUN_400e303e(param_1,0,0);
  }
  if ((((param_3 != (uint *)0x0) && (iVar1 = FUN_400e2b98(param_3,0x10,1,param_1), iVar1 == 1)) &&
      (*param_3 < 0x4001)) && (iVar1 = FUN_400e303e(param_1,*param_3,1), iVar1 == 0)) {
    *(undefined4 *)((int)param_3 + 0xe) = 0;
    return param_3;
  }
  return (uint *)0x0;
}



/* FUN_400013ba @ 400013ba completed=true */

int FUN_400013ba(void)

{
  int iVar1;
  char cVar2;
  int iVar3;
  undefined1 auStack_20 [4];
  int *local_1c;
  int local_18 [5];
  
  local_1c = local_18;
  iVar1 = FUN_400e4312(&DAT_401629d1,s_<h2>Modbus_Configuration<_h2>_<d_4017344b + 0x3ac);
  if (iVar1 == 0) {
    iVar3 = 0;
  }
  else {
    local_1c = (int *)FUN_40001332(iVar1,1,local_1c);
    if (local_1c == (int *)0x0) {
      iVar3 = 0;
      local_1c = (int *)0x0;
    }
    else {
      iVar3 = 0;
      do {
        iVar3 = *local_1c + 0x10 + iVar3;
        local_1c = (int *)FUN_40001332(iVar1,0,local_1c);
      } while (local_1c != (int *)0x0);
    }
    FUN_400e30e2(iVar1);
  }
  FUN_400e5db4(DAT_4000040a,auStack_20);
  while( true ) {
    cVar2 = FUN_400e5dd2(DAT_4000040a,auStack_20,0,&local_1c);
    if (cVar2 == '\0') break;
    iVar3 = *local_1c + 0x10 + iVar3;
  }
  func_0x400e5dca(DAT_4000040a,auStack_20);
  return iVar3;
}



/* FUN_4000149e @ 4000149e completed=true */

undefined4 FUN_4000149e(undefined4 param_1,undefined4 param_2,int param_3)

{
  int iVar1;
  
  iVar1 = FUN_400e303e(param_1,-param_3,1);
  if ((iVar1 == 0) && (iVar1 = FUN_400e2b98(param_2,1,param_3,param_1), param_3 == iVar1)) {
    return param_2;
  }
  return 0;
}



/* FUN_400014f2 @ 400014f2 completed=true */

undefined4 FUN_400014f2(void)

{
  if (DAT_4000040a != 0) {
    FUN_400e5f08(DAT_4000040a,FUN_4000153a,0);
  }
  return 0;
}



/* FUN_40001516 @ 40001516 completed=true */

undefined4 FUN_40001516(void)

{
  if (DAT_4000040e != 0) {
    FUN_400e5f08(DAT_4000040e,FUN_40001256,0);
  }
  return 0;
}



/* FUN_4000153a @ 4000153a completed=true */

void FUN_4000153a(undefined4 param_1,int param_2)

{
  if (*(int *)(param_2 + 0xe) != 0) {
                    /* WARNING: Subroutine does not return */
    FUN_400eff12(*(int *)(param_2 + 0xe));
  }
  if (param_2 != 0) {
                    /* WARNING: Subroutine does not return */
    FUN_400eff12(param_2);
  }
  return;
}



/* FUN_4000156a @ 4000156a completed=true */

int FUN_4000156a(void)

{
  DAT_4000040a = func_0x400e6008(FUN_40001216,FUN_40001222,0x35,&DAT_401629df);
  DAT_40000408 = 0;
  return (int)-(DAT_4000040a == 0);
}



/* FUN_400015a0 @ 400015a0 completed=true */

void FUN_400015a0(void)

{
  FUN_400e5f08(DAT_4000040a,FUN_4000153a,0);
  DAT_4000040a = 0;
  FUN_4000156a();
  return;
}



/* FUN_400015c8 @ 400015c8 completed=true */

int FUN_400015c8(void)

{
  DAT_4000040e = func_0x400e6008(FUN_40001236,FUN_40001242,0x35,&DAT_401629e8);
  return (int)-(DAT_4000040e == 0);
}



/* FUN_400015f6 @ 400015f6 completed=true */

void FUN_400015f6(void)

{
  FUN_400e5f08(DAT_4000040e,FUN_40001256,0);
  DAT_4000040e = 0;
  FUN_400015c8();
  return;
}



/* FUN_4000161e @ 4000161e completed=true */

int FUN_4000161e(undefined4 param_1,int *param_2)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  int local_14;
  undefined2 local_10;
  int local_c;
  undefined1 local_8;
  
  iVar1 = FUN_400e303e(param_1,0,2);
  if (iVar1 == 0) {
    uVar2 = FUN_400e1b4e(param_1);
    local_14 = *param_2;
    local_c = 7;
    local_10 = *(undefined2 *)(param_2 + 1);
    local_8 = *(undefined1 *)(param_2 + 3);
    iVar1 = FUN_400e3fb0(&local_14,0x10,1,param_1);
    if (iVar1 == 1) {
      if (local_14 < 1) {
        iVar1 = 0;
      }
      else {
        iVar1 = FUN_400e3fb0(*(undefined4 *)((int)param_2 + 0xe),1,local_14,param_1);
        if (iVar1 != local_14) {
          return -2;
        }
      }
      FUN_400e2f9e(param_1);
      iVar3 = FUN_400e303e(param_1,uVar2,0);
      if (iVar3 == 0) {
        local_c = param_2[2];
        iVar3 = FUN_400e3fb0(&local_14,0x10,1,param_1);
        if (iVar3 == 1) {
          FUN_400e2f9e(param_1);
          FUN_400012ac(local_14 + 0x14);
          return iVar1;
        }
      }
    }
  }
  return -1;
}



/* FUN_40001750 @ 40001750 completed=true */

undefined4
FUN_40001750(undefined4 param_1,short param_2,int param_3,int param_4,undefined4 *param_5)

{
  int iVar1;
  undefined4 *puVar2;
  char cVar3;
  int local_14;
  short local_10;
  int local_c;
  
  *param_5 = 0;
  iVar1 = FUN_400e1b4e(param_1);
  if ((0 < iVar1) && (iVar1 = FUN_400e303e(param_1,0,0), iVar1 != 0)) {
    puVar2 = (undefined4 *)func_0x400f0954();
    *param_5 = *puVar2;
    return 0xffffffff;
  }
  do {
    iVar1 = FUN_400e2b98(&local_14,0x10,1,param_1);
    if (iVar1 != 1) {
      puVar2 = (undefined4 *)func_0x400f0954();
      *param_5 = *puVar2;
      return 0xffffffff;
    }
    if ((param_2 == local_10) && (param_3 == local_c)) {
      FUN_400e303e(param_1,0xfffffff0,1);
      local_c = param_4;
      iVar1 = FUN_400e3fb0(&local_14,0x10,1,param_1);
      if (iVar1 != 1) {
        puVar2 = (undefined4 *)func_0x400f0954();
        *param_5 = *puVar2;
        return 0xffffffff;
      }
      FUN_400e2f9e(param_1);
      if (param_4 != 0) {
        return 1;
      }
      FUN_40001296(local_14 + 0x14);
      return 1;
    }
    iVar1 = FUN_400e303e(param_1,local_14,1);
    if (iVar1 != 0) {
      return 0xffffffff;
    }
    cVar3 = FUN_400e1ad8(param_1);
  } while (cVar3 == '\0');
  return 0;
}



/* FUN_40001898 @ 40001898 completed=true */

undefined4 FUN_40001898(undefined4 param_1,int param_2,uint *param_3)

{
  int iVar1;
  
  if (param_2 != 0) {
    iVar1 = FUN_400e1b4e(param_1);
    if (0 < iVar1) {
      FUN_400e303e(param_1,0,0);
    }
  }
  iVar1 = FUN_400e2b98(param_3,0x10,1,param_1);
  if ((iVar1 == 1) && (*param_3 < 0x4001)) {
                    /* WARNING: Subroutine does not return */
    FUN_400f0236(0,*param_3,&DAT_401629f7,0x5ba);
  }
  return 0;
}



/* FUN_40001942 @ 40001942 completed=true */

int FUN_40001942(undefined4 param_1)

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
  
  piVar2 = (int *)FUN_40001898(param_1,1,auStack_18);
  if (piVar2 == (int *)0x0) {
    iVar6 = 0;
  }
  else {
    iVar6 = 0;
    do {
      cVar4 = FUN_40001306(*(undefined2 *)(piVar2 + 1));
      if (((cVar4 == '\0') || (iVar1 = *piVar2, 0x4000 < iVar1)) || (iVar1 < 0)) {
                    /* WARNING: Subroutine does not return */
        FUN_400eff12(*(undefined4 *)((int)piVar2 + 0xe));
      }
      if (((uint)piVar2[2] < 2) ||
         (cVar4 = *(char *)(piVar2 + 3),
         cVar5 = FUN_400012d6(*(undefined4 *)((int)piVar2 + 0xe),iVar1), cVar5 == cVar4)) {
        if (piVar2[2] == 2) {
          uVar3 = FUN_400e1b4e(param_1);
          for (iVar6 = FUN_40001332(param_1,0,auStack_30); iVar6 != 0;
              iVar6 = FUN_40001332(param_1,0,iVar6)) {
            if ((*(short *)(piVar2 + 1) == *(short *)(iVar6 + 4)) && (*(int *)(iVar6 + 8) == 3)) {
              iVar6 = FUN_40055f20(param_1,*(short *)(iVar6 + 4),piVar2[2],0,auStack_1c);
              goto LAB_40001ad0;
            }
          }
          piVar2[2] = 3;
          FUN_4000161e(param_1,piVar2);
          iVar6 = FUN_40055f20(param_1,*(undefined2 *)(piVar2 + 1),2,0,auStack_1c);
LAB_40001ad0:
          FUN_400e303e(param_1,uVar3,0);
        }
        if (*(int *)((int)piVar2 + 0xe) != 0) {
                    /* WARNING: Subroutine does not return */
          FUN_400eff12(*(int *)((int)piVar2 + 0xe));
        }
        piVar2 = (int *)FUN_40001898(param_1,0,piVar2);
      }
      else {
        uVar3 = FUN_400e1b4e(param_1);
        iVar6 = FUN_40055f20(param_1,*(undefined2 *)(piVar2 + 1),piVar2[2],0,auStack_1c);
        if ((iVar6 < 1) && (piVar2[2] == 3)) {
          if (*(int *)((int)piVar2 + 0xe) == 0) {
            return -1;
          }
                    /* WARNING: Subroutine does not return */
          FUN_400eff12(*(int *)((int)piVar2 + 0xe));
        }
        if (*(int *)((int)piVar2 + 0xe) != 0) {
                    /* WARNING: Subroutine does not return */
          FUN_400eff12(*(int *)((int)piVar2 + 0xe));
        }
        FUN_400e303e(param_1,uVar3,0);
        piVar2 = (int *)FUN_40001898(param_1,0,piVar2);
      }
    } while (piVar2 != (int *)0x0);
  }
  return iVar6;
}



/* FUN_40001b3a @ 40001b3a completed=true */

/* WARNING: Removing unreachable block (ram,0x40001c08) */

undefined4 FUN_40001b3a(undefined4 param_1)

{
  int iVar1;
  int *piVar2;
  undefined1 auStack_2c [20];
  undefined1 auStack_18 [20];
  
  iVar1 = FUN_400e1b4e(param_1);
  if (0 < iVar1) {
    FUN_400e303e(param_1,0,0);
  }
  piVar2 = (int *)FUN_40001332(param_1,1,auStack_18);
  if (piVar2 != (int *)0x0) {
    do {
      if ((((*(short *)(piVar2 + 1) == 10) && (piVar2[2] == 3)) && (*piVar2 < 0x14)) &&
         (iVar1 = FUN_4000149e(param_1,auStack_2c,*piVar2), iVar1 != 0)) {
        *(undefined1 *)(iVar1 + *piVar2) = 0;
                    /* WARNING: Subroutine does not return */
        FUN_4014e3c8(iVar1,&DAT_40162a10);
      }
      piVar2 = (int *)FUN_40001332(param_1,0,piVar2);
    } while (piVar2 != (int *)0x0);
  }
  FUN_400e1ad8(param_1);
  return 0xffffffff;
}



/* FUN_40001c1e @ 40001c1e completed=true */

int FUN_40001c1e(undefined2 param_1)

{
  char cVar1;
  
  cVar1 = FUN_400e5e64(DAT_4000040e,param_1,FUN_40001256,0);
  return (int)-(cVar1 == '\0');
}



/* FUN_40001c4a @ 40001c4a completed=true */

int FUN_40001c4a(undefined2 param_1,undefined4 param_2)

{
  char cVar1;
  
  FUN_400e5e64(DAT_4000040e,param_1,FUN_40001256,0);
  cVar1 = func_0x400e5f8c(DAT_4000040e,param_1,param_2);
  return (int)-(cVar1 == '\0');
}



/* FUN_40001c92 @ 40001c92 completed=true */

undefined4 FUN_40001c92(void)

{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  int local_14;
  undefined2 local_10;
  int local_c;
  
  iVar1 = FUN_400e4312(&DAT_401629d1,s_<h2>Modbus_Configuration<_h2>_<d_4017344b + 0x3ac);
  if (iVar1 == 0) {
    uVar2 = 0;
  }
  else {
    FUN_400012c2();
    FUN_400015f6();
    iVar3 = FUN_400e1b4e(iVar1);
    if (0 < iVar3) {
      FUN_400e303e(iVar1,0,0);
    }
    do {
      iVar3 = FUN_400e2b98(&local_14,0x10,1,iVar1);
      if (iVar3 != 1) {
        FUN_400e30e2(iVar1);
        return 0;
      }
      if (local_c == 3) {
        iVar3 = FUN_400e1b4e(iVar1);
        iVar3 = FUN_4005641a(local_10,iVar3 + -0x10);
        if (iVar3 < 0) {
          FUN_400e30e2(iVar1);
          return 0xffffffff;
        }
        FUN_400012ac(local_14 + 0x14);
      }
      else {
        FUN_40001296(local_14 + 0x14);
      }
      iVar3 = FUN_400e303e(iVar1,local_14,1);
    } while (iVar3 == 0);
    FUN_400e30e2(iVar1);
    uVar2 = 0xffffffff;
  }
  return uVar2;
}



/* FUN_40001db4 @ 40001db4 completed=true */

undefined4 FUN_40001db4(undefined2 param_1,undefined4 *param_2)

{
  char cVar2;
  undefined4 uVar1;
  
  FUN_400e5e64(DAT_4000040a,param_1,FUN_4000153a,0);
  cVar2 = func_0x400e5f8c(DAT_4000040a,param_1,param_2);
  if (cVar2 == '\0') {
    uVar1 = 0xffffffff;
  }
  else {
    DAT_40000408 = 1;
    uVar1 = *param_2;
  }
  return uVar1;
}



/* FUN_40001e08 @ 40001e08 completed=true */

undefined4 FUN_40001e08(undefined2 param_1)

{
  char cVar1;
  undefined4 local_8;
  
  cVar1 = FUN_400e5cd4(DAT_4000040e,param_1,&local_8);
  if (cVar1 == '\0') {
    local_8 = 0xffffffff;
  }
  return local_8;
}



/* FUN_40001e38 @ 40001e38 completed=true */

undefined4
FUN_40001e38(undefined4 param_1,short param_2,int param_3,int param_4,undefined4 *param_5)

{
  int iVar1;
  undefined4 *puVar2;
  int local_14;
  short local_10;
  int local_c;
  
  *param_5 = 0;
  iVar1 = FUN_400e1b4e(param_1);
  if ((0 < iVar1) && (iVar1 = FUN_400e303e(param_1,0,0), iVar1 != 0)) {
    puVar2 = (undefined4 *)func_0x400f0954();
    *param_5 = *puVar2;
    return 0xffffffff;
  }
  iVar1 = FUN_40001e08(param_2);
  if (-1 < iVar1) {
    iVar1 = FUN_400e303e(param_1,iVar1,0);
    if (iVar1 != 0) {
      puVar2 = (undefined4 *)func_0x400f0954();
      *param_5 = *puVar2;
      return 0xffffffff;
    }
    iVar1 = FUN_400e2b98(&local_14,0x10,1,param_1);
    if (iVar1 != 1) {
      puVar2 = (undefined4 *)func_0x400f0954();
      *param_5 = *puVar2;
      return 0xffffffff;
    }
    if ((param_2 == local_10) && (param_3 == local_c)) {
      iVar1 = FUN_400e303e(param_1,0xfffffff0,1);
      if (iVar1 != 0) {
        puVar2 = (undefined4 *)func_0x400f0954();
        *param_5 = *puVar2;
        return 0xffffffff;
      }
      local_c = param_4;
      iVar1 = FUN_400e3fb0(&local_14,0x10,1,param_1);
      if (iVar1 != 1) {
        puVar2 = (undefined4 *)func_0x400f0954();
        *param_5 = *puVar2;
        return 0xffffffff;
      }
      FUN_400e2f9e(param_1);
      if (param_4 != 0) {
        return 1;
      }
      FUN_40001296(local_14 + 0x14);
      return 1;
    }
  }
  return 0;
}



