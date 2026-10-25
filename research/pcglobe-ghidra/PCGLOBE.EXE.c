/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: PCGLOBE.EXE
 * SHA-256: a51878c5d56a3f843610ca484e2adde904b9de43b776a7e0e3ef86c5b5d1734f
 */

/* ------------------------------------------------------------
 * entry @ 348d:0010
 * selected: program entry point
 * body bytes: 34
 * completed: true
 */

void __cdecl16far entry(void)

{
  undefined1 *puVar1;
  undefined1 *puVar2;
  int iVar3;
  undefined1 *puVar4;
  undefined1 *puVar5;
  int unaff_ES;
  
  DAT_348d_0004 = unaff_ES + 0x10;
  DAT_348d_4c1e = DAT_348d_0004 + DAT_348d_000c;
  puVar4 = (undefined1 *)(DAT_348d_0006 + -1);
  puVar5 = puVar4;
  for (iVar3 = DAT_348d_0006; iVar3 != 0; iVar3 = iVar3 + -1) {
    puVar2 = puVar5;
    puVar5 = puVar5 + -1;
    puVar1 = puVar4;
    puVar4 = puVar4 + -1;
    *puVar2 = *puVar1;
  }
  DAT_348d_4c1c = 0x32;
  return;
}



/* ------------------------------------------------------------
 * switchD_1000:1297::caseD_0 @ 1000:004c
 * selected: address-order fallback
 * body bytes: 390
 * completed: true
 */

void __cdecl16far switchD_1000:1297::caseD_0(undefined2 param_1,int param_2,undefined2 *param_3)

{
  uint *puVar1;
  int iVar2;
  undefined2 uVar3;
  uint in_DX;
  int in_BX;
  int unaff_SI;
  undefined2 unaff_DS;
  
  uVar3 = 0x1000;
  puVar1 = (uint *)(in_BX + unaff_SI + 0x60eb);
  iVar2 = (in_DX & 3) - (*puVar1 & 3);
  *puVar1 = *puVar1 + (uint)(0 < iVar2) * iVar2;
  if (param_2 < 2) {
    uVar3 = 0x1e4a;
    iVar2 = FUN_2000_05a0(0x1000,0x43);
    *(int *)0x4024 = iVar2;
    if (iVar2 == 0) goto LAB_1000_00e3;
  }
  else {
    iVar2 = param_3[1];
  }
  FUN_2000_039e(uVar3,0x7f4,iVar2);
LAB_1000_00e3:
  if (*(char *)0x7f4 != '\0') {
    FUN_2000_098a(0x1e4a,0x7f4);
    if (*(char *)0x7f5 == ':') {
      if ((*(char *)0x7f6 != '\0') &&
         (iVar2 = FUN_2000_03d0(0x1e4a,0x7f4), *(char *)(iVar2 + 0x7f3) != '\\')) {
        FUN_2000_035e(0x1e4a,0x7f4,0x4c);
      }
    }
    else {
      *(undefined1 *)0x7f4 = 0;
    }
  }
  *(undefined2 *)0x4024 = 0;
  iVar2 = FUN_2000_05a0(0x1e4a,0x4e);
  if (iVar2 == 0) {
    FUN_2000_039e(0x1e4a,0x784,0x785);
    FUN_2000_039e(0x1e4a,0x790,0x791);
  }
  uVar3 = FUN_2000_098a(0x1e4a,*param_3);
  func_0x0001591e(0x1e4a,uVar3);
  FUN_1000_a194();
  FUN_1000_0243();
  uVar3 = 0x1e4a;
  func_0x00020ee2(0x1a19,0x2fa,0x2f1);
  iVar2 = FUN_1000_07af();
  if (iVar2 == 0) {
    uVar3 = 0x5de;
    func_0x00006e66(0x1e4a);
  }
  func_0x0000713e(uVar3);
  func_0x00000105(0x713);
  *(undefined2 *)0x7f2 = 0;
  func_0x000031d4(0,*(undefined1 *)(*(int *)0x4652 + 0x27),*(undefined1 *)(*(int *)0x4652 + 0x28));
  func_0x00006f2a(0x2f1);
  func_0x000039fa(0x6f2,0);
  func_0x000178e2(0x35c,0);
  *(undefined2 *)0x4680 = 0x27f;
  while (*(int *)0x886 == 0) {
    FUN_1000_7448(*(undefined2 *)(*(int *)0x4106 + *(int *)0x888 * 6 + 4));
  }
  func_0x0001eb0a(0x1744);
  func_0x00006e12(0x1e4a,1,1);
  if (*(int *)0x886 == 1) {
    FUN_1000_036b();
  }
  else {
    func_0x0000716a(0x5de);
  }
  FUN_1000_e644(0);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0243 @ 1000:0243
 * selected: address-order fallback
 * body bytes: 211
 * completed: true
 */

void __cdecl16far FUN_1000_0243(void)

{
  undefined1 *puVar1;
  int iVar2;
  int iVar3;
  undefined2 uVar4;
  undefined2 unaff_DS;
  
  uVar4 = 0x1e4a;
  func_0x000207f2(0x1000,0x4746,0x899,*(undefined2 *)0x4024,*(undefined2 *)0x796);
  if (*(char *)0x3a88 != '1') {
    if ((*(char *)0x3a88 != '4') && (*(char *)0x3a88 != '5')) {
      puVar1 = (undefined1 *)func_0x0002091e(0x1e4a,*(undefined2 *)*(undefined2 *)0x4684,0x32);
      *puVar1 = 0x33;
    }
    FUN_1000_ecf4(*(undefined2 *)*(undefined2 *)0x4684,(int)*(char *)*(undefined2 *)0x796);
    FUN_1000_ecf4(0x89e,*(undefined2 *)0x4658);
    func_0x00002f24(0x1e4a);
    uVar4 = 0x2f1;
    func_0x00002f32(0x2f1);
  }
  iVar2 = FUN_1000_fc44(uVar4,0x4746,0x8000);
  if ((iVar2 == -1) || (*(int *)0x3a78 != 0)) {
    FUN_1000_0317(0);
  }
  iVar3 = FUN_1000_fde8(0x1e4a,iVar2,0x3a8c,*(undefined2 *)0x7ec);
  if (iVar3 != *(int *)0x7ec) {
    FUN_1000_0317(1);
  }
  FUN_1000_fbaa(0x1e4a,iVar2);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0317 @ 1000:0317
 * selected: address-order fallback
 * body bytes: 84
 * completed: true
 */

void __cdecl16far FUN_1000_0317(int param_1)

{
  undefined2 unaff_DS;
  
  func_0x00002f24(0x1000);
  if (*(int *)0x7a2 == -1) {
    FUN_1000_ecf4(0x8a5,0x4746);
  }
  else {
    FUN_1000_ecf4(0x8ac,*(undefined2 *)0x401e,*(undefined2 *)(*(int *)0x4684 + param_1 * 2 + 2),
                  0x4746);
  }
  FUN_1000_e644(param_1 + 10);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_036b @ 1000:036b
 * selected: address-order fallback
 * body bytes: 1089
 * completed: true
 */

void __cdecl16far FUN_1000_036b(void)

{
  bool bVar1;
  int iVar2;
  undefined2 unaff_DS;
  int local_456;
  
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_039e();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  FUN_2000_0a1c();
  if (*(char *)0x7f4 == '\0') {
    func_0x000207f2();
    local_456 = FUN_1000_5622();
  }
  else {
    func_0x000207f2();
    if ((*(char *)0x7f4 == 'A') || (*(char *)0x7f4 == 'B')) {
      FUN_1000_ecf4();
      FUN_1000_ecf4();
      func_0x00002f32();
    }
    local_456 = FUN_1000_fc44();
    if ((local_456 == -1) || (*(int *)0x3a78 != 0)) {
      local_456 = -1;
    }
  }
  func_0x0000716a();
  if (local_456 != -1) {
    bVar1 = false;
    iVar2 = FUN_1000_fec6();
    if ((iVar2 != 0x4a) || ((*(int *)0x3a78 == 0 && (iVar2 = FUN_1000_fec6(), iVar2 != 0x345)))) {
      bVar1 = true;
      *(undefined2 *)0x3a78 = 1;
    }
    if (bVar1) {
      FUN_1000_ecf4();
    }
    if (*(int *)0x3a78 != 0) {
      FUN_1000_ecf4();
    }
    FUN_1000_fbaa();
    return;
  }
  FUN_1000_ecf4();
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_07af @ 1000:07af
 * selected: address-order fallback
 * body bytes: 1007
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_07af(void)

{
  bool bVar1;
  undefined2 uVar2;
  int iVar3;
  int iVar4;
  undefined2 unaff_DS;
  undefined2 uVar5;
  undefined2 uVar6;
  int local_450;
  int local_44e;
  int local_44c;
  undefined2 local_44a;
  undefined2 local_448;
  undefined2 local_446;
  undefined2 local_444;
  undefined2 local_442;
  undefined2 local_440;
  undefined2 local_43e;
  undefined2 local_43c;
  undefined2 local_43a;
  undefined2 local_438;
  undefined2 local_436;
  undefined2 local_434;
  undefined2 local_432;
  undefined1 local_430;
  undefined1 local_42e;
  undefined2 local_42c;
  undefined2 local_42a;
  undefined2 local_428;
  undefined2 local_426;
  char local_424;
  undefined2 local_422;
  undefined2 local_420;
  undefined2 local_41e;
  undefined2 local_41c;
  undefined2 local_41a;
  undefined1 local_418;
  undefined1 local_416;
  undefined1 local_414;
  undefined1 local_412;
  undefined1 local_410;
  undefined2 local_40e;
  undefined2 local_40c;
  undefined2 local_40a;
  undefined2 local_408;
  undefined1 local_3ea [32];
  undefined1 auStack_3ca [8];
  undefined1 auStack_3c2 [92];
  undefined1 auStack_366 [28];
  undefined1 auStack_34a [16];
  undefined1 auStack_33a [16];
  undefined1 auStack_32a [8];
  undefined1 auStack_322 [46];
  undefined1 auStack_2f4 [3];
  undefined1 auStack_2f1 [130];
  undefined1 auStack_26f [3];
  undefined1 auStack_26c [130];
  undefined1 auStack_1ea [3];
  undefined1 auStack_1e7 [130];
  undefined1 auStack_165 [3];
  undefined1 auStack_162 [130];
  undefined1 auStack_e0 [2];
  undefined1 auStack_de [23];
  undefined1 auStack_c7 [11];
  undefined1 auStack_bc [186];
  
  bVar1 = false;
  if (*(char *)0x7f4 == '\0') {
    uVar6 = *(undefined2 *)0x79a;
    uVar5 = *(undefined2 *)0x4024;
    uVar2 = 0x90a;
  }
  else {
    uVar6 = 0x766;
    uVar5 = 0x7f4;
    uVar2 = 0x905;
  }
  func_0x000207f2(0x1000,0x4746,uVar2,uVar5,uVar6);
  iVar3 = FUN_2000_0da8(0x1e4a,0x4746,0);
  if ((iVar3 != -1) && (iVar3 = FUN_1000_fc44(0x1e4a,0x4746,0x8000), iVar3 != -1)) {
    iVar4 = FUN_1000_fde8(0x1e4a,iVar3,&local_450,6);
    if (((iVar4 != 6) ||
        (((*(int *)0x3a78 != 0 ||
          (iVar4 = FUN_1000_fde8(0x1e4a,iVar3,&local_44a,local_44e + -6), iVar4 != local_44e + -6))
         || (*(int *)0x3a78 != 0)))) ||
       (iVar4 = FUN_1000_fde8(0x1e4a,iVar3,local_3ea,local_44c), iVar4 != local_44c)) {
      bVar1 = true;
    }
    FUN_1000_fbaa(0x1e4a,iVar3);
    if (CONCAT11((char)((uint)*(undefined2 *)0x3d56 >> 8) + '5',(char)*(undefined2 *)0x3d56) !=
        local_450) {
      bVar1 = true;
    }
    if ((!bVar1) && (*(int *)0x3a78 == 0)) {
      *(undefined2 *)0x3f84 = local_44a;
      *(undefined2 *)0x3f82 = local_448;
      *(undefined2 *)0x3a72 = local_446;
      FUN_1000_8778(0x1e4a,local_444);
      *(undefined2 *)0x36d4 = local_442;
      *(undefined2 *)0x41b0 = local_440;
      *(undefined2 *)0x4aa0 = local_43e;
      *(undefined2 *)0x4b56 = local_43c;
      *(undefined2 *)0x375c = local_43a;
      *(undefined2 *)0x7f0 = local_438;
      *(undefined2 *)0x46d0 = local_436;
      *(undefined2 *)0x4120 = local_434;
      *(undefined2 *)0x3760 = local_432;
      *(undefined1 *)(*(int *)0x4652 + 0x27) = local_430;
      *(undefined1 *)(*(int *)0x4652 + 0x28) = local_42e;
      *(undefined2 *)0x7ee = local_42c;
      *(undefined2 *)0x3d60 = local_42a;
      *(undefined2 *)0x4688 = local_428;
      *(undefined2 *)0x468a = local_426;
      *(int *)0x3a6e = (int)local_424;
      *(undefined2 *)0x19a = local_422;
      *(undefined2 *)0x3d54 = local_420;
      *(undefined2 *)0x4596 = local_41e;
      *(undefined2 *)0x44ee = local_41c;
      *(undefined2 *)0x1a2 = local_41a;
      *(undefined1 *)0x4020 = local_418;
      *(undefined1 *)0x4502 = local_416;
      *(undefined1 *)0x4450 = local_414;
      *(undefined1 *)0x4474 = local_412;
      *(undefined1 *)0x401c = local_410;
      *(undefined2 *)0x1a4 = local_40e;
      *(undefined2 *)0x47e2 = local_40c;
      *(undefined2 *)0x4122 = local_40a;
      *(undefined2 *)0x4124 = local_408;
      FUN_2000_0a1c(0x1744,0x4430,local_3ea,0x20);
      FUN_2000_0a1c(0x1e4a,0x47e4,auStack_3ca,8);
      FUN_2000_0a1c(0x1e4a,0x43ce,auStack_3c2,0x5c);
      FUN_2000_0a1c(0x1e4a,0x7a8,auStack_366,0x1c);
      FUN_2000_0a1c(0x1e4a,0x447a,auStack_34a,0x10);
      FUN_2000_0a1c(0x1e4a,0x1542,auStack_33a,0x10);
      FUN_2000_0a1c(0x1e4a,0x47f2,auStack_32a,8);
      FUN_2000_039e(0x1e4a,*(undefined2 *)0x4104,auStack_322);
      FUN_2000_0a1c(0x1e4a,0x88a,auStack_2f4,3);
      FUN_2000_0a1c(0x1e4a,0x36d6,auStack_2f1,0x82);
      FUN_2000_0a1c(0x1e4a,0x88e,auStack_26f,3);
      FUN_2000_0a1c(0x1e4a,0x45c0,auStack_26c,0x82);
      FUN_2000_0a1c(0x1e4a,0x892,auStack_1ea,3);
      FUN_2000_0a1c(0x1e4a,0x402a,auStack_1e7,0x82);
      FUN_2000_0a1c(0x1e4a,0x896,auStack_165,3);
      FUN_2000_0a1c(0x1e4a,0x4128,auStack_162,0x82);
      FUN_2000_0a1c(0x1e4a,0x44fc,auStack_e0,2);
      FUN_2000_0a1c(0x1e4a,0x40ec,auStack_de,0x17);
      FUN_2000_0a1c(0x1e4a,0x377e,auStack_c7,0xb);
      FUN_2000_0a1c(0x1e4a,0x4454,auStack_bc,0x17);
      func_0x0000010e(0x1e4a,*(undefined2 *)0x3f82);
      return 1;
    }
  }
  return 0;
}



/* ------------------------------------------------------------
 * FUN_1000_0bad @ 1000:0bad
 * selected: address-order fallback
 * body bytes: 13
 * completed: true
 */

void __cdecl16far FUN_1000_0bad(void)

{
  FUN_2000_090e(0x1000,7);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0bbb @ 1000:0bbb
 * selected: address-order fallback
 * body bytes: 64
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0bbb(void)

{
  int iVar1;
  int local_6;
  int local_4;
  
  iVar1 = FUN_1000_7f06(0x1000,&local_4,&local_6,0);
  if (iVar1 == 3) {
    if ((local_4 != 0) || (local_6 != 0x1b)) {
      return 0;
    }
  }
  else if (iVar1 != 2) {
    return 0;
  }
  return 1;
}



/* ------------------------------------------------------------
 * FUN_1000_0bfb @ 1000:0bfb
 * selected: address-order fallback
 * body bytes: 23
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0bfb(void)

{
  int iVar1;
  undefined2 uVar2;
  undefined1 local_4 [2];
  
  uVar2 = 0x1000;
  do {
    iVar1 = FUN_2000_0696(uVar2);
    if (iVar1 == 0) {
      return 0;
    }
    iVar1 = FUN_1000_0c3b(local_4);
    uVar2 = 0x1e4a;
  } while (iVar1 != 0x1b);
  uVar2 = 0x1b;
  while( true ) {
    iVar1 = FUN_2000_0696(0x1e4a,uVar2);
    if (iVar1 == 0) break;
    func_0x000206aa(0x1e4a);
  }
  return 1;
}



/* ------------------------------------------------------------
 * FUN_1000_0c14 @ 1000:0c14
 * selected: address-order fallback
 * body bytes: 38
 * completed: true
 */

/* WARNING: Instruction at (ram,0x00010c15) overlaps instruction at (ram,0x00010c14)
    */

undefined2 __cdecl16far FUN_1000_0c14(void)

{
  int in_AX;
  int iVar1;
  int unaff_BP;
  undefined2 uVar2;
  undefined2 unaff_SS;
  
  uVar2 = 0x1000;
  while( true ) {
    if (in_AX == 0x1b) {
      while (iVar1 = FUN_2000_0696(uVar2), iVar1 != 0) {
        uVar2 = 0x1e4a;
        func_0x000206aa(0x1e4a);
      }
      return 1;
    }
    iVar1 = FUN_2000_0696(uVar2);
    if (iVar1 == 0) break;
    in_AX = FUN_1000_0c3b(unaff_BP + -2);
    *(int *)(unaff_BP + -4) = in_AX;
    uVar2 = 0x1e4a;
  }
  return 0;
}



/* ------------------------------------------------------------
 * FUN_1000_0c3b @ 1000:0c3b
 * selected: address-order fallback
 * body bytes: 64
 * completed: true
 */

char __cdecl16far FUN_1000_0c3b(undefined2 *param_1)

{
  undefined2 unaff_DS;
  char local_10;
  char local_f;
  
  local_f = '\0';
  func_0x000206c2(0x1000,0x16,&local_10,&local_10);
  if (local_10 == '\0') {
    *param_1 = 1;
  }
  else {
    *param_1 = 0;
    local_f = local_10;
  }
  return local_f;
}



/* ------------------------------------------------------------
 * FUN_1000_0c86 @ 1000:0c86
 * selected: address-order fallback
 * body bytes: 25
 * completed: true
 */

void __cdecl16far FUN_1000_0c86(void)

{
  int unaff_BP;
  
  func_0x000206c2(0x1000,0x10,unaff_BP + -0xe,unaff_BP + -0x1c);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0c9f @ 1000:0c9f
 * selected: address-order fallback
 * body bytes: 36
 * completed: true
 */

void __cdecl16far FUN_1000_0c9f(void)

{
  undefined1 local_1e [14];
  undefined1 local_10;
  undefined1 local_f;
  undefined2 local_c;
  
  local_f = 1;
  local_c = 0x2020;
  func_0x000206c2(0x1000,0x10,&local_10,local_1e);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0cc3 @ 1000:0cc3
 * selected: address-order fallback
 * body bytes: 3
 * completed: true
 */

void FUN_1000_0cc3(undefined2 param_1,undefined2 param_2)

{
  undefined1 uStack_10;
  undefined1 uStack_f;
  undefined1 uStack_d;
  undefined2 uStack_a;
  
  uStack_f = 2;
  uStack_d = 0;
  uStack_a = param_2;
  func_0x000206c2(0x1000,0x10,&uStack_10,&uStack_10);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0cc6 @ 1000:0cc6
 * selected: address-order fallback
 * body bytes: 38
 * completed: true
 */

void __cdecl16far FUN_1000_0cc6(void)

{
  int unaff_BP;
  undefined2 unaff_SS;
  
  *(undefined1 *)(unaff_BP + -0xd) = 2;
  *(undefined1 *)(unaff_BP + -0xb) = 0;
  *(undefined2 *)(unaff_BP + -8) = *(undefined2 *)(unaff_BP + 6);
  func_0x000206c2(0x1000,0x10,unaff_BP + -0xe,unaff_BP + -0xe);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0ced @ 1000:0ced
 * selected: address-order fallback
 * body bytes: 365
 * completed: true
 */

void __cdecl16far
FUN_1000_0ced(int param_1,int param_2,int param_3,int param_4,int param_5,undefined1 *param_6)

{
  int iVar1;
  undefined2 uVar2;
  int iVar3;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar4;
  bool bVar5;
  undefined4 uVar6;
  int local_24;
  int local_20;
  char acStack_1b [21];
  undefined1 local_6;
  int local_4;
  
  bVar5 = param_2 < 0;
  if (bVar5) {
    bVar4 = param_1 != 0;
    param_1 = -param_1;
    param_2 = -(param_2 + (uint)bVar4);
  }
  uVar6 = FUN_2000_0fa2(0x1000,param_1,param_2,param_3,param_3 >> 0xf);
  local_20 = func_0x000207f2(0x1e4a,param_6,0x910,uVar6);
  local_4 = local_20;
  if ((param_4 != 0) && (3 < local_20)) {
    local_24 = 0x13;
    local_6 = 0;
    iVar3 = local_24;
    while (local_24 = iVar3, local_20 = local_20 + -1, -1 < local_20) {
      acStack_1b[local_24 + 1] = param_6[local_20];
      iVar3 = local_24 + -1;
      if ((local_24 + -1) % 4 == 0) {
        acStack_1b[local_24] = *(char *)0x4742;
        iVar3 = local_24 + -2;
      }
    }
    iVar3 = local_24 + 1;
    if (acStack_1b[local_24 + 2] == *(char *)0x4742) {
      iVar3 = local_24 + 2;
    }
    local_24 = iVar3;
    FUN_2000_039e(0x1e4a,param_6,acStack_1b + local_24 + 1);
  }
  if (param_5 == 0) goto LAB_1000_0e2c;
  local_4 = func_0x00021072(0x1e4a,param_1,param_2,param_3,param_3 >> 0xf);
  iVar3 = local_4;
  if (param_3 < 0xb) {
    iVar1 = (int)*(char *)0x4112;
    uVar2 = 0x914;
LAB_1000_0e10:
    func_0x000207f2(0x1e4a,acStack_1b + 1,uVar2,iVar1,iVar3);
  }
  else if (param_3 == 100) {
    if (param_5 == 1) {
      iVar1 = (int)*(char *)0x4112;
      uVar2 = 0x919;
      iVar3 = (local_4 + 5) / 10;
    }
    else {
      iVar1 = (int)*(char *)0x4112;
      uVar2 = 0x91e;
    }
    goto LAB_1000_0e10;
  }
  FUN_2000_035e(0x1e4a,param_6,acStack_1b + 1);
LAB_1000_0e2c:
  if (bVar5) {
    iVar3 = FUN_2000_03d0(0x1e4a,param_6);
    FUN_2000_09ac(0x1e4a,param_6 + 1,param_6,iVar3 + 1);
    *param_6 = 0x2d;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0e5d @ 1000:0e5d
 * selected: address-order fallback
 * body bytes: 53
 * completed: true
 */

void __cdecl16far FUN_1000_0e5d(int param_1,uint param_2)

{
  undefined2 unaff_DS;
  
  if (*(int *)0x4692 == 1) {
    if (1 < (int)param_2) {
      param_2 = param_2 & 1;
      param_1 = param_1 + 0x10;
    }
    *(int *)0x192 = param_1 * 0x100 + param_2;
    func_0x0000014a(0x1000,0);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0e93 @ 1000:0e93
 * selected: address-order fallback
 * body bytes: 104
 * completed: true
 */

void FUN_1000_0e93(void)

{
  undefined2 uVar1;
  undefined2 unaff_DS;
  
  uVar1 = 0x1000;
  if (*(int *)0x7f2 == 0) {
    uVar1 = 0x5de;
    func_0x00006e12(0x1000,1,1);
  }
  *(undefined1 *)0x17c = *(undefined1 *)0x4502;
  func_0x00000138(uVar1);
  func_0x00005d44(0);
  func_0x00000132(0x536,0x101,*(undefined2 *)*(undefined2 *)0x410e);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0ffd @ 1000:0ffd
 * selected: address-order fallback
 * body bytes: 302
 * completed: true
 */

/* WARNING: Control flow encountered bad instruction data */
/* WARNING: Instruction at (ram,0x00011103) overlaps instruction at (ram,0x00011100)
    */

void __cdecl16far FUN_1000_0ffd(char *param_1)

{
  code *pcVar1;
  undefined1 uVar2;
  undefined2 *puVar3;
  undefined1 in_CH;
  undefined2 extraout_DX;
  int extraout_DX_00;
  int extraout_DX_01;
  int extraout_DX_02;
  int iVar4;
  undefined2 extraout_DX_03;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  bool bVar5;
  undefined2 in_stack_0000000c;
  undefined2 uVar6;
  undefined2 uVar7;
  undefined2 uVar8;
  undefined2 uVar9;
  int local_48;
  int local_44;
  char local_42 [43];
  byte bStack_17;
  undefined2 local_16;
  int iStack_14;
  char local_6;
  int local_4;
  
  if (*param_1 == '\0') {
LAB_1000_100d:
    pcVar1 = (code *)swi(0x39);
    (*pcVar1)();
    pcVar1 = (code *)swi(0x3d);
    (*pcVar1)();
    return;
  }
  local_4 = 0;
  local_48 = 0;
  local_44 = 0;
  bVar5 = false;
  while( true ) {
    local_6 = param_1[local_44];
    if (local_6 == '\0') break;
    if ((local_6 < '0') || ('9' < local_6)) {
      if ((local_6 == *(char *)0x4112) && ((!bVar5 && (local_4 == 0)))) {
        local_6 = '.';
        bVar5 = true;
        goto LAB_1000_105c;
      }
      if ((local_6 != *(char *)0x4742) || (bVar5)) goto LAB_1000_100d;
      local_4 = 3;
      local_44 = local_44 + 1;
    }
    else {
LAB_1000_105c:
      if (local_4 != 0) {
        local_4 = local_4 + -1;
      }
      local_42[local_48] = local_6;
      local_48 = local_48 + 1;
      local_44 = local_44 + 1;
    }
  }
  if (local_4 != 0) goto LAB_1000_100d;
  local_42[local_48] = '\0';
  puVar3 = (undefined2 *)FUN_2000_0452(local_42);
  uVar6 = *puVar3;
  uVar7 = puVar3[1];
  uVar8 = puVar3[2];
  uVar9 = puVar3[3];
  pcVar1 = (code *)swi(0x39);
  (*pcVar1)();
  (*(code *)*(undefined2 *)((int)(puVar3 + 5) + local_44 + -0x74ab))(uVar6,uVar7,uVar8,uVar9);
  in(extraout_DX);
  pcVar1 = (code *)swi(0x39);
  (*pcVar1)();
  bVar5 = SCARRY2((int)(puVar3 + 5),1);
  pcVar1 = (code *)swi(0x38);
  uVar2 = (*pcVar1)();
  if (bVar5) {
    out(extraout_DX_00,uVar2);
    iVar4 = extraout_DX_00;
  }
  else {
    pcVar1 = (code *)swi(0x39);
    (*pcVar1)();
    pcVar1 = (code *)swi(0x3d);
    (*pcVar1)();
    if ((bStack_17 & 1) == 0) {
      pcVar1 = (code *)swi(0x39);
      (*pcVar1)();
      bVar5 = (int)(puVar3 + 6) < 0;
      pcVar1 = (code *)swi(0x38);
      (*pcVar1)();
      iVar4 = extraout_DX_01;
      if (bVar5) goto LAB_1000_1122;
    }
    else {
      pcVar1 = (code *)swi(0x39);
      (*pcVar1)();
      pcVar1 = (code *)swi(0x38);
      (*pcVar1)();
      *(char *)0x9d9a = *(char *)0x9d9a + -0x35;
      iVar4 = extraout_DX_02 + -1;
    }
  }
  local_16 = FUN_2000_1a3d();
  iStack_14 = iVar4;
  func_0x00003064(0x1e4a,local_16,iVar4,1,1,0,in_stack_0000000c);
LAB_1000_1122:
  pcVar1 = (code *)swi(0x39);
  (*pcVar1)();
  pcVar1 = (code *)swi(0x36);
  (*pcVar1)();
  in(extraout_DX_03);
  pcVar1 = (code *)swi(0x38);
  (*pcVar1)();
  *(undefined1 *)0x39cd = in_CH;
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}



/* ------------------------------------------------------------
 * FUN_1000_124b @ 1000:124b
 * selected: address-order fallback
 * body bytes: 749
 * completed: true
 */

int __cdecl16far FUN_1000_124b(uint param_1,int *param_2)

{
  uint *puVar1;
  uint uVar2;
  long lVar3;
  int iVar4;
  int iVar5;
  undefined2 uVar6;
  int iVar7;
  char cVar8;
  uint in_DX;
  int *piVar9;
  int iVar10;
  int iVar11;
  int unaff_SI;
  int *unaff_DI;
  undefined2 uVar12;
  undefined2 uVar13;
  undefined2 unaff_DS;
  undefined4 uVar14;
  undefined4 uVar15;
  ulong uVar16;
  int iStack_452;
  int iStack_44e;
  int iStack_44c;
  int iStack_92;
  int iStack_8e;
  int iStack_88;
  int iStack_86;
  undefined1 auStack_84 [20];
  undefined2 uStack_70;
  undefined2 uStack_6e;
  int iStack_6c;
  int iStack_6a;
  undefined2 uStack_68;
  undefined2 uStack_66;
  undefined2 uStack_64;
  undefined4 uStack_62;
  int iStack_5e;
  int iStack_5c;
  int iStack_5a;
  int iStack_58;
  int iStack_56;
  int iStack_54;
  undefined4 uStack_52;
  undefined4 uStack_4e;
  int iStack_4a;
  int iStack_48;
  undefined4 uStack_46;
  undefined4 uStack_42;
  undefined4 uStack_3e;
  int iStack_3a;
  int iStack_38;
  undefined4 uStack_36;
  undefined4 uStack_32;
  int iStack_2e;
  int iStack_2c;
  int iStack_2a;
  int iStack_28;
  int iStack_26;
  uint uStack_24;
  undefined4 uStack_22;
  undefined1 *puStack_1e;
  int local_c;
  
  uVar12 = (undefined2)((ulong)param_2 >> 0x10);
  piVar9 = (int *)param_2;
  *(int *)0x3a7c = (piVar9[2] - *param_2) + 1;
  *(int *)0x3a80 = (piVar9[3] - piVar9[1]) + 1;
  *(undefined2 *)0x4696 = *(undefined2 *)0x172;
  *(undefined2 *)0x46a0 = *(undefined2 *)0x174;
  if (param_1 < 5) {
    switch(param_1) {
    case 1:
      func_0x0000be6a();
      *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x1f);
      func_0x00000153();
      uVar12 = 0;
      func_0x00000153();
      *(int *)0x158 = *(int *)0x16c * 3;
      iStack_86 = 0;
      do {
        puStack_1e = (undefined1 *)
                     *(undefined2 *)((int)*(undefined4 *)0x4642 + iStack_86 * 4 + 0x42);
        uStack_22._0_2_ = 0xb929;
        uStack_22._2_2_ = (undefined1 *)uVar12;
        func_0x00003064();
        uVar12 = 0xbaa;
        func_0x0000be6a();
        iStack_86 = iStack_86 + 1;
      } while (iStack_86 < 3);
      iStack_86 = 1;
      do {
        puStack_1e = (undefined1 *)*(undefined2 *)((int)*(undefined4 *)0x4642 + 0x26);
        uStack_22._0_2_ = 5 - iStack_86;
        uStack_22._2_2_ = (undefined1 *)((int)uStack_22 >> 0xf);
        iStack_26 = 0xb97d;
        uStack_24 = uVar12;
        uVar16 = FUN_2000_103e();
        cVar8 = '\x02';
        do {
          uStack_24 = (uint)(uVar16 >> 0x11);
          iStack_26 = (int)(CONCAT12((uVar16 & 0x10000) != 0,(int)uVar16) >> 1);
          uVar16 = CONCAT22(uStack_24,iStack_26);
          cVar8 = cVar8 + -1;
        } while (cVar8 != '\0');
        iStack_28 = 0x1e4a;
        iStack_2a = -0x4672;
        func_0x00003064();
        puStack_1e = (undefined1 *)0xd28;
        uStack_22._2_2_ = auStack_84;
        uStack_22._0_2_ = 0x2f1;
        uStack_24 = 0xb9a3;
        func_0x000207f2();
        *(int *)0x15a = *(int *)0x16a / 2;
        *(int *)0x158 = *(int *)0x16c * iStack_86 * 4;
        puStack_1e = auStack_84;
        uStack_22._2_2_ = (undefined1 *)0x1e4a;
        uVar12 = 0;
        uStack_22._0_2_ = 0xb9de;
        func_0x00000108();
        iStack_86 = iStack_86 + 1;
      } while (iStack_86 < 5);
      *(int *)0x158 = *(int *)0x16c * 0x15 + -2;
      *(int *)0x15a = (*(int *)0x16a * 0x29) / 2;
      func_0x00000108();
      *(int *)0x158 = *(int *)0x16c * 0x16 + -2;
      iStack_86 = 0;
      do {
        *(int *)0x15a = *(int *)0x16a * 0xc;
        puStack_1e = (undefined1 *)0x0;
        uStack_22._2_2_ = (undefined1 *)0xbab5;
        func_0x0000bc30();
        *(int *)0x15a = *(int *)0x15a + *(int *)0x16a * 2;
        func_0x000207f2();
        puStack_1e = (undefined1 *)0xbb09;
        func_0x000207f2();
        func_0x00000108();
        *(int *)0x158 = *(int *)0x158 + *(int *)0x16c;
        iStack_86 = iStack_86 + 1;
      } while (iStack_86 < 3);
      puStack_1e = (undefined1 *)*(undefined2 *)((int)*(undefined4 *)0x4642 + 0x4e);
      uStack_22._2_2_ = (undefined1 *)0x0;
      uStack_22._0_2_ = 0xbb58;
      func_0x00003064();
      uStack_36._2_2_ = *(int *)0x16a * 0x2e;
      *(int *)0x15a = uStack_36._2_2_;
      *(int *)0x158 = *(int *)0x16c * 0x16 + -1;
      puStack_1e = (undefined1 *)0xbba0;
      func_0x000207f2();
      func_0x00000108();
      puStack_1e = (undefined1 *)*(undefined2 *)((int)*(undefined4 *)0x4642 + 0x50);
      uStack_22._2_2_ = (undefined1 *)0x0;
      uStack_22._0_2_ = 0xbbcd;
      func_0x00003064();
      *(int *)0x15a = uStack_36._2_2_;
      *(int *)0x158 = *(int *)0x158 + *(int *)0x16c;
      puStack_1e = auStack_84;
      uStack_22._2_2_ = (undefined1 *)0x2f1;
      uStack_22._0_2_ = 0xbc0d;
      func_0x000207f2();
      func_0x00000108();
      puStack_1e = (undefined1 *)(uint)*(byte *)((int)*(undefined4 *)0x4642 + 0x3d);
      uStack_22._2_2_ = (undefined1 *)0x0;
      uStack_22._0_2_ = 0xbc40;
      func_0x00003064();
      *(int *)0x15a = uStack_36._2_2_;
      *(int *)0x158 = *(int *)0x158 + *(int *)0x16c;
      puStack_1e = (undefined1 *)0xbc78;
      func_0x000207f2();
      func_0x00000108();
      uStack_32._0_2_ = *(int *)0x16a * 0xb;
      uStack_32._2_2_ = (*(int *)0x16c * 0x29) / 2;
      func_0x00000150();
      func_0x00000153();
      func_0x00000150();
      func_0x00000153();
      func_0x00000150();
      iVar4 = (int)uStack_32;
      func_0x00000153();
      uStack_36._2_2_ = *(int *)0x16a / 2 + iVar4 + 1;
      func_0x00000153();
      iStack_86 = 0;
      do {
        func_0x00000153();
        if (iStack_86 % 2 != 0) {
          func_0x00000153();
        }
        uVar12 = 0;
        iStack_86 = iStack_86 + 1;
      } while (iStack_86 < 7);
      uVar6 = *(undefined2 *)0x2f76;
      uStack_36._2_2_ = (*(int *)0x16a * 0x1f) / 2;
      iStack_88 = *(int *)0x16a << 4;
      iStack_8e = *(int *)0x16a * 0x1d + -1;
      iStack_92 = *(int *)0x16a / 2 + iStack_8e;
      iVar5 = *(int *)0x16a * 0x13;
      iVar4 = *(int *)0x16c << 4;
      for (iStack_86 = 0; iStack_86 < 3; iStack_86 = iStack_86 + 1) {
        uVar6 = (undefined2)((ulong)*(undefined4 *)0x4642 >> 0x10);
        iVar10 = (int)*(undefined4 *)0x4642;
        iVar4 = *(int *)(iVar10 + 0x26);
        puStack_1e = (undefined1 *)*(undefined2 *)(iVar10 + iStack_86 * 4 + 0x42);
        uStack_22._0_2_ = 0xbf0f;
        uStack_22._2_2_ = (undefined1 *)uVar12;
        uStack_22 = FUN_2000_103e();
        uVar12 = (undefined2)((ulong)*(undefined4 *)0x4642 >> 0x10);
        iVar10 = (int)*(undefined4 *)0x4642;
        uVar2 = *(uint *)(iVar10 + 0x28);
        uStack_22 = uStack_22 +
                    CONCAT22(uVar2 >> 1,
                             (int)(CONCAT12((uVar2 & 1) != 0,*(undefined2 *)(iVar10 + 0x26)) >> 1));
        uStack_24 = 0x1e4a;
        iStack_26 = 0xbf2a;
        iVar10 = func_0x00021114();
        iVar7 = uStack_32._2_2_ - iVar10;
        *(undefined1 *)0x17a = 0;
        uStack_24 = iVar4 + -1;
        iStack_26 = iStack_92;
        iStack_2a = uStack_36._2_2_;
        iStack_2c = 0x1e4a;
        iStack_2e = 0xbf58;
        iStack_28 = iVar7;
        func_0x00000126();
        uVar12 = (undefined2)((ulong)*(undefined4 *)0x4642 >> 0x10);
        iVar11 = (int)*(undefined4 *)0x4642;
        iVar7 = (int)((uint)*(byte *)(iVar11 + 0x3a) * iVar10 + 0x32) / 100 + iVar7;
        iVar10 = (int)((uint)*(byte *)(iVar11 + 0x3b) * iVar10 + 0x32) / 100 + iVar7;
        if (*(int *)0x4692 == 2) {
          uStack_24 = 9;
        }
        else {
          uStack_24 = 0x40;
        }
        iStack_28 = iStack_8e;
        iStack_2c = iStack_88;
        iStack_2e = 0;
        uStack_32._2_2_ = 0xbe76;
        iStack_2a = iVar10;
        iStack_26 = iVar4;
        func_0x0000bc30();
        if (*(int *)0x4692 == 2) {
          uStack_24 = 8;
        }
        else {
          uStack_24 = 0x3f;
        }
        iStack_28 = iStack_8e;
        iStack_2c = iStack_88;
        iStack_2e = 0xbaa;
        uStack_32._2_2_ = -0x4164;
        iStack_2a = iVar7;
        iStack_26 = iVar10;
        func_0x0000bc30();
        puStack_1e = (undefined1 *)0xbaa;
        uVar12 = 0xbaa;
        uStack_22._2_2_ = (undefined1 *)0xbec3;
        func_0x0000bc30();
        uStack_36._2_2_ = uStack_36._2_2_ + iVar5;
        iStack_88 = iStack_88 + iVar5;
        iStack_8e = iStack_8e + iVar5;
        iStack_92 = iStack_92 + iVar5;
        iVar4 = iVar5;
      }
      return iVar4;
    case 2:
      iVar4 = FUN_2000_0da8();
      if ((iVar4 != -1) && (iVar4 = FUN_1000_fc44(), iVar4 != -1)) {
        iVar4 = FUN_1000_fde8();
        if ((iVar4 != 6) ||
           ((((*(int *)0x3a78 != 0 || (iVar4 = FUN_1000_fde8(), iVar4 != iStack_44e + -6)) ||
             (*(int *)0x3a78 != 0)) || (iVar4 = FUN_1000_fde8(), iVar4 != iStack_44c)))) {
          iStack_452 = 1;
        }
        FUN_1000_fbaa();
        if (CONCAT11((char)((uint)*(undefined2 *)0x3d56 >> 8) + '5',(char)*(undefined2 *)0x3d56) !=
            *unaff_DI) {
          iStack_452 = 1;
        }
        if ((iStack_452 == 0) && (*(int *)0x3a78 == 0)) {
          *(int *)0x3f84 = unaff_DI[3];
          *(int *)0x3f82 = unaff_DI[4];
          *(int *)0x3a72 = unaff_DI[5];
          FUN_1000_8778();
          *(int *)0x36d4 = unaff_DI[7];
          *(int *)0x41b0 = unaff_DI[8];
          *(int *)0x4aa0 = unaff_DI[9];
          *(int *)0x4b56 = unaff_DI[10];
          *(int *)0x375c = unaff_DI[0xb];
          *(int *)0x7f0 = unaff_DI[0xc];
          *(int *)0x46d0 = unaff_DI[0xd];
          *(int *)0x4120 = unaff_DI[0xe];
          *(int *)0x3760 = unaff_DI[0xf];
          *(undefined1 *)(*(int *)0x4652 + 0x27) = (char)unaff_DI[0x10];
          *(undefined1 *)(*(int *)0x4652 + 0x28) = (char)unaff_DI[0x11];
          *(int *)0x7ee = unaff_DI[0x12];
          *(int *)0x3d60 = unaff_DI[0x13];
          *(int *)0x4688 = unaff_DI[0x14];
          *(int *)0x468a = unaff_DI[0x15];
          *(int *)0x3a6e = (int)(char)unaff_DI[0x16];
          *(int *)0x19a = unaff_DI[0x17];
          *(int *)0x3d54 = unaff_DI[0x18];
          *(int *)0x4596 = unaff_DI[0x19];
          *(int *)0x44ee = unaff_DI[0x1a];
          *(int *)0x1a2 = unaff_DI[0x1b];
          *(undefined1 *)0x4020 = (char)unaff_DI[0x1c];
          *(undefined1 *)0x4502 = (char)unaff_DI[0x1d];
          *(undefined1 *)0x4450 = (char)unaff_DI[0x1e];
          *(undefined1 *)0x4474 = (char)unaff_DI[0x1f];
          *(undefined1 *)0x401c = (char)unaff_DI[0x20];
          *(int *)0x1a4 = unaff_DI[0x21];
          *(int *)0x47e2 = unaff_DI[0x22];
          *(int *)0x4122 = unaff_DI[0x23];
          *(int *)0x4124 = unaff_DI[0x24];
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_039e();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          FUN_2000_0a1c();
          func_0x0000010e();
          return 1;
        }
      }
      return 0;
    case 3:
      FUN_2000_03d0();
      iVar4 = FUN_2000_039e();
      return iVar4;
    case 4:
      func_0x00006d0e();
      iVar4 = func_0x00006dd0();
      iVar5 = FUN_1000_202f();
      if ((iVar5 != 0) && (iVar4 != 0)) {
        iVar4 = FUN_1000_2649();
        if (piVar9 != (int *)0x0) {
          func_0x0000bd60();
        }
        func_0x00002f32();
        if (iVar4 != 0) {
          func_0x00000141();
        }
        func_0x00000141();
        return 0;
      }
      return 1;
    }
    puVar1 = (uint *)(param_1 * 2 + unaff_SI + 0x60eb);
    iVar4 = (in_DX & 3) - (*puVar1 & 3);
    *puVar1 = *puVar1 + (uint)(0 < iVar4) * iVar4;
    if (local_c < 2) {
      iVar4 = FUN_2000_05a0();
      *(int *)0x4024 = iVar4;
      if (iVar4 == 0) goto LAB_1000_00e3;
    }
    FUN_2000_039e();
LAB_1000_00e3:
    if (*(char *)0x7f4 != '\0') {
      FUN_2000_098a();
      if (*(char *)0x7f5 == ':') {
        if ((*(char *)0x7f6 != '\0') && (iVar4 = FUN_2000_03d0(), *(char *)(iVar4 + 0x7f3) != '\\'))
        {
          FUN_2000_035e();
        }
      }
      else {
        *(undefined1 *)0x7f4 = 0;
      }
    }
    *(undefined2 *)0x4024 = 0;
    iVar4 = FUN_2000_05a0();
    if (iVar4 == 0) {
      FUN_2000_039e();
      FUN_2000_039e();
    }
    FUN_2000_098a();
    func_0x0001591e();
    FUN_1000_a194();
    FUN_1000_0243();
    func_0x00020ee2();
    iVar4 = FUN_1000_07af();
    if (iVar4 == 0) {
      func_0x00006e66();
    }
    func_0x0000713e();
    func_0x00000105();
    *(undefined2 *)0x7f2 = 0;
    func_0x000031d4();
    func_0x00006f2a();
    func_0x000039fa();
    func_0x000178e2();
    *(undefined2 *)0x4680 = 0x27f;
    while (*(int *)0x886 == 0) {
      FUN_1000_7448();
    }
    func_0x0001eb0a();
    func_0x00006e12();
    if (*(int *)0x886 == 1) {
      FUN_1000_036b();
    }
    else {
      func_0x0000716a();
    }
    iVar4 = FUN_1000_e644();
    return iVar4;
  }
  *(int *)0x15e = -*param_2;
  *(int *)0x160 = -piVar9[1];
  puStack_1e = (undefined1 *)*(undefined2 *)0x176;
  uStack_22._2_2_ = (undefined1 *)0x1000;
  uStack_22._0_2_ = 0x13b4;
  uStack_22 = FUN_2000_103e();
  uStack_24 = 0x1e4a;
  iStack_26 = 0x13bb;
  uVar14 = FUN_2000_0fa2();
  uStack_24 = 0;
  iStack_26 = 10;
  iStack_2a = *(int *)0x46a0;
  iStack_28 = iStack_2a >> 0xf;
  iStack_2e = *(int *)0x178;
  iStack_2c = iStack_2e >> 0xf;
  uStack_32._2_2_ = 0x1e4a;
  uStack_32._0_2_ = 0x13dd;
  uStack_32 = FUN_2000_103e();
  uStack_36._2_2_ = 0x1e4a;
  uStack_36._0_2_ = 0x13e4;
  uVar15 = FUN_2000_0fa2();
  iStack_3a = *(int *)0x3a7c;
  iStack_38 = iStack_3a >> 0xf;
  uStack_42._2_2_ = 0x1e4a;
  uStack_42._0_2_ = 0x1401;
  uStack_36 = uVar14;
  uStack_3e = uVar15;
  uStack_42 = FUN_2000_103e();
  uStack_46._2_2_ = 0x1e4a;
  uStack_46._0_2_ = 0x1408;
  iVar4 = FUN_2000_0fa2();
  iStack_4a = *(int *)0x3a80;
  if (iStack_4a <= iVar4) {
    if (param_1 == 1) {
      iVar5 = iVar4 / *(int *)0x46a0 + 1;
    }
    else {
      iVar5 = (iVar4 - *(int *)0x3a80) / 2;
    }
    *(int *)0x160 = *(int *)0x160 + iVar5;
    *(int *)0x3a80 = iVar4;
    goto LAB_1000_1506;
  }
  iStack_48 = iStack_4a >> 0xf;
  uStack_52._2_2_ = 0x1e4a;
  uStack_52._0_2_ = 0x142a;
  uStack_4e = uVar14;
  uStack_46 = uVar15;
  uStack_52 = FUN_2000_103e();
  iStack_54 = 0x1e4a;
  iStack_56 = 0x1431;
  iVar4 = FUN_2000_0fa2();
  if (param_1 == 4) {
    iVar5 = (iVar4 - *(int *)0x3a7c) / 10;
  }
  else {
    iVar5 = (iVar4 - *(int *)0x3a7c) / 2;
  }
  *(int *)0x15e = *(int *)0x15e + iVar5;
  if (param_1 == 3) {
    iVar5 = *(int *)0x46a0;
    uStack_46._0_2_ = iVar5 << 1;
    uStack_46._2_2_ = (iVar5 >> 0xf) << 1 | (uint)(iVar5 < 0);
    iStack_4a = *(int *)0x3a80;
    iStack_48 = iStack_4a >> 0xf;
    uStack_4e._0_2_ = *(int *)0x16c;
    uStack_4e._2_2_ = (int)uStack_4e >> 0xf;
    uStack_52._2_2_ = 0x1e4a;
    uStack_52._0_2_ = 0x1482;
    uStack_52 = FUN_2000_103e();
    lVar3 = CONCAT22((int)((ulong)uStack_52 >> 0x10) << 1 | (uint)((int)uStack_52 < 0),
                     (int)uStack_52 << 1);
LAB_1000_14b3:
    uStack_52 = uStack_52 +
                CONCAT22((int)((ulong)lVar3 >> 0x10) << 1 | (uint)((int)lVar3 < 0),(int)lVar3 * 2);
    iStack_54 = 0x1e4a;
    iStack_56 = 0x14c2;
    iVar5 = FUN_2000_0fa2();
    *(int *)0x160 = *(int *)0x160 - iVar5;
  }
  else if (param_1 == 4) {
    uStack_46._0_2_ = *(int *)0x46a0;
    uStack_46._2_2_ = (int)uStack_46 >> 0xf;
    iStack_4a = *(int *)0x3a80;
    iStack_48 = iStack_4a >> 0xf;
    uStack_4e._0_2_ = *(int *)0x16c;
    uStack_4e._2_2_ = (int)uStack_4e >> 0xf;
    uStack_52._2_2_ = 0x1e4a;
    uStack_52._0_2_ = 0x14af;
    uStack_52 = FUN_2000_103e();
    lVar3 = uStack_52;
    goto LAB_1000_14b3;
  }
  *(int *)0x3a7c = iVar4;
LAB_1000_1506:
  *(int *)0x160 = *(int *)0x3a80 - *(int *)0x160;
  uStack_46._0_2_ = *(int *)0x3a7c;
  uStack_46._2_2_ = (int)uStack_46 >> 0xf;
  iStack_48 = *(undefined2 *)0x4696;
  iStack_4a = 0;
  uStack_4e._2_2_ = 0x1e4a;
  uStack_4e._0_2_ = 0x1529;
  uVar6 = func_0x00021114();
  *(undefined2 *)0x162 = uVar6;
  uStack_4e._0_2_ = *(int *)0x3a80;
  uStack_4e._2_2_ = (int)uStack_4e >> 0xf;
  uStack_52._2_2_ = *(undefined2 *)0x46a0;
  uStack_52._0_2_ = 0;
  iStack_54 = 0x1e4a;
  iStack_56 = 0x1544;
  uVar6 = func_0x00021114();
  *(undefined2 *)0x164 = uVar6;
  iStack_56 = *(int *)0x3a7c;
  iStack_54 = iStack_56 >> 0xf;
  iStack_5a = *(int *)0x401a;
  iStack_58 = iStack_5a >> 0xf;
  iStack_5e = *(int *)0x172;
  iStack_5c = iStack_5e >> 0xf;
  uStack_62._2_2_ = 0x1e4a;
  uStack_62._0_2_ = 0x1568;
  uStack_62 = FUN_2000_103e();
  uStack_64 = 0x1e4a;
  uVar13 = 0x1e4a;
  uStack_66 = 0x156f;
  uVar6 = FUN_2000_0fa2();
  *(undefined2 *)0x168 = uVar6;
  iVar4 = (int)param_1 / 4;
  if ((int)param_1 % 4 != 0) {
    uStack_64 = 0;
    uStack_66 = 0x3d5e;
    uStack_68 = 0x3d58;
    iStack_6a = piVar9[1];
    iStack_6c = *param_2;
    uStack_6e = 0x1e4a;
    uStack_70 = 0x15a0;
    FUN_1000_1615();
    uStack_64 = 0;
    uStack_66 = 0x3d5a;
    uStack_68 = 0x3d5c;
    iStack_6a = piVar9[3];
    iStack_6c = piVar9[2];
    uStack_6e = 0x1e4a;
    uStack_70 = 0x15bd;
    FUN_1000_1615();
    if (*(int *)0x4aa0 != 0) {
      *(undefined1 *)0x17a = *(undefined1 *)0x4aa0;
      uStack_64 = *(undefined2 *)0x3d5e;
      uStack_66 = *(undefined2 *)0x3d5c;
      uStack_68 = *(undefined2 *)0x3d5a;
      iStack_6a = *(undefined2 *)0x3d58;
      iStack_6c = 0x1e4a;
      uVar13 = 0;
      uStack_6e = 0x15e7;
      func_0x00000126();
    }
    *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x57);
    uStack_64 = *(undefined2 *)0x3d5e;
    uStack_66 = *(undefined2 *)0x3d5c;
    uStack_68 = *(undefined2 *)0x3d5a;
    iStack_6a = *(undefined2 *)0x3d58;
    uStack_6e = 0x160e;
    iStack_6c = uVar13;
    iVar4 = func_0x0001839e();
  }
  return iVar4;
}



/* ------------------------------------------------------------
 * FUN_1000_1615 @ 1000:1615
 * selected: address-order fallback
 * body bytes: 110
 * completed: true
 */

int __cdecl16far FUN_1000_1615(int param_1,int param_2,int *param_3,int *param_4,uint param_5)

{
  int iVar1;
  int iVar2;
  int extraout_DX;
  int extraout_DX_00;
  undefined2 unaff_DS;
  
  FUN_2000_103e(0x1000,*(int *)0x15e + param_1,*(int *)0x15e + param_1 >> 0xf,*(undefined2 *)0x162,0
               );
  *param_3 = extraout_DX;
  FUN_2000_103e(0x1e4a,*(int *)0x160 - param_2,*(int *)0x160 - param_2 >> 0xf,*(undefined2 *)0x164,0
               );
  *param_4 = extraout_DX_00;
  iVar2 = extraout_DX_00;
  if ((param_5 & 0x7fff) != 0) {
    iVar1 = *param_3 + (param_5 & 0x7fff);
    iVar2 = iVar1 / *(int *)0x172;
    *param_3 = iVar1 % *(int *)0x172;
  }
  return iVar2;
}



/* ------------------------------------------------------------
 * FUN_1000_1683 @ 1000:1683
 * selected: address-order fallback
 * body bytes: 484
 * completed: true
 */

void __cdecl16far FUN_1000_1683(uint param_1)

{
  undefined2 *puVar1;
  uint uVar2;
  undefined2 uVar3;
  undefined2 unaff_DS;
  undefined2 uVar4;
  undefined4 local_c;
  byte *local_6;
  
  func_0x0000012c(0x1000);
  if ((param_1 & 1) == 0) {
    FUN_1000_124b(2,*(undefined2 *)0x464c,*(undefined2 *)0x464e);
    *(undefined2 *)0x166 = *(undefined2 *)0x3a72;
    uVar4 = 1;
  }
  else {
    FUN_1000_124b(param_1,*(int *)0x7a2 * 8 + *(int *)0x464c,*(undefined2 *)0x464e);
    *(undefined2 *)0x166 = 0x8000;
    uVar4 = *(undefined2 *)0x4690;
  }
  uVar3 = 0x1885;
  FUN_1000_997c(uVar4);
  *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x57);
  FUN_1000_23bf(0,*(undefined2 *)0x45be);
  if (*(int *)0x740 == -1) {
    *(undefined1 *)0x4490 = 0;
    FUN_2000_0a48(0x1885,0x4aa4,0,*(int *)0x7ce + 2);
    uVar3 = 0x1e4a;
    FUN_2000_0a48(0x1e4a,0x3762,0,*(undefined2 *)0x7d0);
    if (*(uint *)0x4aa0 != (uint)*(byte *)(*(int *)0x4652 + 0x58)) {
      *(uint *)0x15c = (uint)*(byte *)(*(int *)0x4652 + 0x58);
      FUN_1000_2cab(param_1,*(undefined2 *)0x45be);
    }
    if (((*(int *)0x41b0 != 0) && (FUN_1000_2241(0,*(undefined2 *)0x45be), param_1 == 1)) &&
       ((uint)*(byte *)(*(int *)0x4652 + 0x59) != *(uint *)0x4aa0)) {
      uVar3 = 0;
      func_0x00000111(0x1e4a);
      *(uint *)0x15c = (uint)*(byte *)(*(int *)0x4652 + 0x59);
      local_6 = (byte *)*(undefined2 *)(*(int *)0x7a2 * 2 + 0x72c);
      while( true ) {
        uVar2 = (uint)*local_6;
        if (uVar2 == 0xff) break;
        *(undefined1 *)(uVar2 + 0x4aa4) = *(undefined1 *)0x15c;
        puVar1 = (undefined2 *)(uVar2 * 2 + *(int *)0x41b2);
        local_c = (undefined2 *)CONCAT22(*(undefined2 *)0x41b4,puVar1);
        FUN_1000_234f(*local_c,puVar1[1]);
        local_6 = local_6 + 1;
      }
    }
    FUN_1000_285b();
  }
  else {
    if ((*(int *)0x4692 != 2) && (*(int *)0x740 != *(int *)0x4aa0)) {
      *(undefined2 *)0x15c = *(undefined2 *)0x740;
      FUN_1000_2cab(param_1,*(undefined2 *)0x45be);
    }
    if (*(int *)0x41b0 != 0) {
      FUN_1000_2241(0,*(undefined2 *)0x45be);
    }
  }
  FUN_2000_0a48(uVar3,0x49fe,0,*(undefined2 *)0x47d6);
  *(undefined2 *)0x4656 = 0;
  func_0x00000111(0x1e4a);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1869 @ 1000:1869
 * selected: address-order fallback
 * body bytes: 311
 * completed: true
 */

void __cdecl16far FUN_1000_1869(uint param_1,int param_2)

{
  byte *pbVar1;
  undefined2 uVar2;
  undefined2 uVar3;
  undefined1 uVar4;
  undefined2 *puVar5;
  uint uVar6;
  undefined2 uVar7;
  undefined2 unaff_DS;
  undefined4 local_e;
  byte *local_8;
  
  puVar5 = (undefined2 *)(param_1 * 2 + *(int *)0x41b2);
  local_e = (undefined2 *)CONCAT22(*(undefined2 *)0x41b4,puVar5);
  uVar2 = *local_e;
  uVar3 = puVar5[1];
  if (*(int *)0x740 == -1) {
    FUN_1000_2955(1,param_1);
  }
  if (param_2 == 0) {
    *(undefined1 *)(param_1 + 0x4aa4) = 0;
  }
  else {
    if (*(int *)0x4692 == 2) {
      if (*(int *)0x3f82 == 6) {
        uVar4 = 0;
      }
      else {
        uVar4 = *(undefined1 *)0x3f82;
      }
    }
    else {
      uVar4 = *(undefined1 *)0x3f84;
    }
    *(undefined1 *)(param_1 + 0x4aa4) = uVar4;
  }
  *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x57);
  FUN_1000_23bf(uVar2,uVar3);
  FUN_1000_2241(uVar2,uVar3);
  uVar7 = *(undefined2 *)0x2ed4;
  *(uint *)0x15c = (uint)*(byte *)(*(int *)0x4652 + 0x58);
  if (param_2 == 0) {
    if (((*(uint *)0x3f80 & 0x3fe) == 0) || (*(int *)0x41b0 == 0)) goto LAB_1000_196d;
    local_8 = (byte *)*(undefined2 *)(*(int *)0x7a2 * 2 + 0x72c);
    do {
      pbVar1 = local_8;
      if (*pbVar1 == 0xff) goto LAB_1000_196d;
      local_8 = local_8 + 1;
    } while (*pbVar1 != param_1);
    uVar7 = *(undefined2 *)0x2ed4;
    uVar6 = (uint)*(byte *)(*(int *)0x4652 + 0x59);
  }
  else {
    uVar6 = *(uint *)0x3f84;
  }
  *(uint *)0x15c = uVar6;
LAB_1000_196d:
  FUN_1000_234f(uVar2,uVar3);
  if (param_2 != 0) {
    FUN_1000_2d5d(param_1);
  }
  if (*(int *)0x740 == -1) {
    FUN_1000_2955(0,param_1);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_19a3 @ 1000:19a3
 * selected: address-order fallback
 * body bytes: 643
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_19a3(int param_1,int param_2)

{
  undefined1 uVar1;
  int *piVar2;
  int iVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined2 unaff_DS;
  int local_12;
  int local_e;
  undefined4 local_c;
  undefined4 local_8;
  int local_4;
  
  uVar5 = 0x1000;
  uVar1 = *(undefined1 *)(*(int *)0x3a7a + *(int *)0x44f0);
  if (param_1 != 0) {
    if (*(int *)0x4692 == 2) {
      if (*(char *)(*(int *)0x3a7a + 0x4aa4) == *(char *)0x3f82) {
        return 0;
      }
      uVar5 = 0x5de;
      iVar3 = func_0x00006dd0(0x1000,0x3762,uVar1);
      if (iVar3 != 0) {
        uVar5 = 0x5de;
        func_0x00006d0e(0x5de,0x3762,uVar1);
        *(undefined1 *)(*(int *)0x3a7a + 0x4aa4) = 0;
        FUN_1000_2dc7(0,(*(byte *)0x3f80 & 1) == 0);
        if (param_1 == 1) {
          uVar5 = 0x732;
          func_0x000079fe(0x5de);
        }
      }
      if (*(int *)0x3f82 == 6) {
        func_0x00006d9a(uVar5,0x3762,uVar1);
        return 0;
      }
      FUN_1000_1869(*(undefined2 *)0x3a7a,1);
    }
    else {
      if (*(char *)(*(int *)0x3a7a + 0x4aa4) == *(char *)0x3f84) {
        return 0;
      }
      FUN_1000_1869(*(int *)0x3a7a,1);
      if ((uint)*(byte *)(*(int *)0x4652 + 0x58) == *(uint *)0x3f84) {
        func_0x00006d9a(0x1000,0x3762,uVar1);
        if (*(int *)0x41b0 != 0) {
          return 0;
        }
        FUN_1000_24ab(0);
        FUN_1000_2445(0x3762);
        return 0;
      }
    }
    func_0x00006d64(uVar5,0x3762,uVar1);
    return 0;
  }
  func_0x00006d0e(0x1000,0x3762,uVar1);
  if ((param_2 == 0) || (local_e = func_0x00006dd0(0x5de,0x3762,uVar1), local_e == 0)) {
    uVar5 = 0x5de;
    *(undefined1 *)0x4490 = 0;
  }
  else {
    FUN_2000_039e(0x5de,0x4490,*(undefined2 *)0x45b4);
    uVar5 = 0xbaa;
    func_0x0000bdfe(0x1e4a);
  }
  if ((*(int *)0x4692 == 2) && (local_e == 0)) {
    *(undefined1 *)(*(int *)0x3a7a + 0x4aa4) = 0;
    FUN_1000_2dc7(1,(*(byte *)0x3f80 & 1) == 0);
  }
  else {
    FUN_1000_1869(*(undefined2 *)0x3a7a,local_e);
    if ((*(int *)0x41b0 == 0) && (local_e == 0)) {
      FUN_1000_24ab(0);
      FUN_1000_2445(0x3762);
    }
  }
  if (local_e == 0) {
    return 1;
  }
  piVar2 = (int *)(*(int *)0x3a7a * 2 + *(int *)0x446c);
  local_c = (int *)CONCAT22(*(undefined2 *)0x446e,piVar2);
  iVar3 = (piVar2[1] - *local_c) / 5;
  local_8 = (uint *)CONCAT22(*(undefined2 *)0x45ae,(uint *)(*local_c * 2 + *(int *)0x45ac));
  local_12 = 0;
  do {
    if (iVar3 <= local_12) {
LAB_1000_1bd8:
      uVar4 = 0x2f1;
      func_0x00002f32(uVar5);
      if (local_12 == iVar3) {
        return 0;
      }
      if (local_4 != 0) {
        uVar4 = 0;
        func_0x00000141(0x2f1,*(undefined2 *)0x180,*(undefined2 *)0x182);
      }
      func_0x00000141(uVar4,local_4 * 2 + *(int *)0x180,*(undefined2 *)0x182);
      return 0;
    }
    uVar4 = (undefined2)((ulong)local_8 >> 0x10);
    if ((*local_8 & *(uint *)0x3f80) != 0) {
      local_4 = FUN_1000_2649((uint *)local_8 + 1,uVar4);
      goto LAB_1000_1bd8;
    }
    local_12 = local_12 + 1;
    local_8 = (uint *)CONCAT22(uVar4,(uint *)local_8 + 5);
  } while( true );
}



/* ------------------------------------------------------------
 * FUN_1000_1c29 @ 1000:1c29
 * selected: address-order fallback
 * body bytes: 385
 * completed: true
 */

void __cdecl16far FUN_1000_1c29(int param_1)

{
  bool bVar1;
  undefined1 uVar2;
  byte bVar3;
  uint uVar4;
  int iVar5;
  undefined2 uVar6;
  undefined2 unaff_DS;
  byte local_e;
  int local_6;
  
  uVar6 = 0x1000;
  local_6 = 0;
  local_e = 2;
  bVar1 = false;
  *(undefined1 *)0x4490 = 0;
  for (iVar5 = 1; iVar5 <= *(int *)0x7ce; iVar5 = iVar5 + 1) {
    uVar4 = (uint)*(byte *)(*(int *)0x4a9e + iVar5);
    bVar3 = *(byte *)(local_6 + param_1) & local_e;
    if ((*(byte *)(local_6 + 0x3762) & local_e) != bVar3) {
      if (*(int *)0x4692 == 2) {
        if (bVar3 == 0) {
          *(undefined1 *)(uVar4 + 0x4aa4) = 0;
        }
        else {
          if (*(int *)0x3f82 == 6) {
            uVar2 = 0;
          }
          else {
            uVar2 = *(undefined1 *)0x3f82;
          }
          *(undefined1 *)(uVar4 + 0x4aa4) = uVar2;
        }
      }
      else {
        FUN_1000_1869(uVar4,bVar3);
      }
      if (bVar3 == 0) {
        bVar1 = true;
      }
    }
    local_e = local_e << 1;
    if (local_e == 0) {
      local_e = 1;
      local_6 = local_6 + 1;
    }
  }
  if (*(int *)0x4692 == 2) {
    if (bVar1) {
      uVar6 = 0x1e4a;
      FUN_2000_0a1c(0x1000,0x3762,param_1,*(undefined2 *)0x7d0);
      FUN_1000_2dc7(0,(*(byte *)0x3f80 & 1) == 0);
    }
    else {
      local_6 = 0;
      local_e = 2;
      for (iVar5 = 1; iVar5 <= *(int *)0x7ce; iVar5 = iVar5 + 1) {
        if ((*(byte *)(local_6 + param_1) & local_e) != (*(byte *)(local_6 + 0x3762) & local_e)) {
          FUN_1000_1869(*(undefined1 *)(*(int *)0x4a9e + iVar5),1);
        }
        local_e = local_e << 1;
        if (local_e == 0) {
          local_e = 1;
          local_6 = local_6 + 1;
        }
      }
    }
  }
  else if ((*(int *)0x41b0 == 0) && (bVar1)) {
    FUN_1000_24ab(param_1);
    FUN_1000_2445(param_1);
  }
  FUN_2000_0a1c(uVar6,0x3762,param_1,*(undefined2 *)0x7d0);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1dad @ 1000:1dad
 * selected: address-order fallback
 * body bytes: 258
 * completed: true
 */

void __cdecl16far FUN_1000_1dad(int param_1)

{
  undefined1 uVar1;
  bool bVar2;
  undefined1 uVar3;
  int iVar4;
  uint uVar5;
  undefined2 uVar6;
  undefined2 uVar7;
  undefined2 unaff_DS;
  byte *local_6;
  
  bVar2 = false;
  FUN_2000_039e(0x1000,0x4490,*(undefined2 *)(param_1 * 2 + *(int *)0x40ea));
  uVar6 = 0xbaa;
  func_0x0000bdfe(0x1e4a);
  local_6 = (byte *)*(undefined2 *)(param_1 * 2 + 0x650);
  while( true ) {
    uVar5 = (uint)*local_6;
    if (uVar5 == 0xff) break;
    uVar1 = *(undefined1 *)(*(int *)0x44f0 + uVar5);
    if (*(int *)0x4692 == 2) {
      iVar4 = func_0x00006dd0(uVar6,0x3762,uVar1);
      if ((iVar4 != 0) && (*(char *)(uVar5 + 0x4aa4) != *(char *)0x3f82)) {
        bVar2 = true;
      }
      if (*(int *)0x3f82 == 6) {
        uVar3 = 0;
      }
      else {
        uVar3 = *(undefined1 *)0x3f82;
      }
      *(undefined1 *)(uVar5 + 0x4aa4) = uVar3;
      uVar7 = 0x5de;
    }
    else {
      FUN_1000_1869(uVar5,1);
      uVar7 = uVar6;
    }
    uVar6 = 0x5de;
    func_0x00006d64(uVar7,0x3762,uVar1);
    local_6 = local_6 + 1;
  }
  if (*(int *)0x4692 == 2) {
    if (bVar2) {
      FUN_1000_2dc7(1,(*(byte *)0x3f80 & 1) == 0);
      return;
    }
    local_6 = (byte *)*(undefined2 *)(param_1 * 2 + 0x650);
    while( true ) {
      if (*local_6 == -1) break;
      FUN_1000_1869(*local_6,1);
      local_6 = local_6 + 1;
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1eb3 @ 1000:1eb3
 * selected: address-order fallback
 * body bytes: 247
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_1eb3(undefined2 param_1,int param_2)

{
  int iVar1;
  uint uVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined2 unaff_DS;
  int local_16;
  int local_14;
  int local_12;
  int local_10;
  int local_e;
  int local_c;
  int local_a;
  int local_8;
  int local_6;
  int local_4;
  
  func_0x00006d0e(0x1000,0x49fe,param_1);
  uVar3 = 0x5de;
  local_a = func_0x00006dd0(0x5de,0x49fe,param_1);
  iVar1 = FUN_1000_202f(param_1,local_a,&local_6);
  if ((iVar1 != 0) && (local_a != 0)) {
    uVar2 = (int)*(uint *)0x3a7c >> 0xf;
    local_8 = ((int)((*(uint *)0x3a7c ^ uVar2) - uVar2) >> 5 ^ uVar2) - uVar2;
    local_c = *(int *)0x3a80 / 0x14;
    local_16 = local_6 - local_8;
    local_14 = local_4 - local_c;
    local_12 = local_6 + local_8;
    local_10 = local_4 + local_c;
    local_e = FUN_1000_2649(&local_16);
    if (param_2 != 0) {
      uVar3 = 0xbaa;
      func_0x0000bd60(0x5de,param_1);
    }
    uVar4 = 0x2f1;
    func_0x00002f32(uVar3);
    if (local_e != 0) {
      uVar4 = 0;
      func_0x00000141(0x2f1,*(undefined2 *)0x180,*(undefined2 *)0x182);
    }
    func_0x00000141(uVar4,local_e * 2 + *(int *)0x180,*(undefined2 *)0x182);
    return 0;
  }
  return 1;
}



/* ------------------------------------------------------------
 * FUN_1000_1fab @ 1000:1fab
 * selected: address-order fallback
 * body bytes: 131
 * completed: true
 */

void __cdecl16far FUN_1000_1fab(int param_1)

{
  byte bVar1;
  undefined2 unaff_DS;
  byte local_e;
  int local_c;
  int local_8;
  undefined1 local_6 [4];
  
  local_e = 2;
  local_8 = 0;
  *(undefined1 *)0x4490 = 0;
  for (local_c = 1; local_c < *(int *)0x4b5e; local_c = local_c + 1) {
    bVar1 = *(byte *)(local_8 + param_1) & local_e;
    if ((*(byte *)(local_8 + 0x49fe) & local_e) != bVar1) {
      FUN_1000_202f(local_c,bVar1,local_6);
    }
    local_e = local_e << 1;
    if (local_e == 0) {
      local_e = 1;
      local_8 = local_8 + 1;
    }
  }
  FUN_2000_0a1c(0x1000,0x49fe,param_1,*(undefined2 *)0x47d6);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_202f @ 1000:202f
 * selected: address-order fallback
 * body bytes: 527
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_202f(int param_1,int param_2,undefined2 *param_3)

{
  int iVar1;
  int iVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined2 unaff_DS;
  uint local_c;
  int local_6;
  int local_4;
  
  uVar4 = 0x1000;
  if (param_1 < 1) {
    *param_3 = *(undefined2 *)(param_1 * -4 + 0x47e4);
    uVar3 = *(undefined2 *)(param_1 * -4 + 0x47e6);
  }
  else {
    uVar3 = (undefined2)((ulong)*(undefined4 *)0x3f94 >> 0x10);
    iVar2 = (int)*(undefined4 *)0x3f94;
    if ((*(uint *)(iVar2 + param_1 * 0xe + 2) & *(uint *)0x3f80 & 0x3ff) == 0) {
      return 0;
    }
    *param_3 = *(undefined2 *)(iVar2 + param_1 * 0xe + 8);
    uVar3 = *(undefined2 *)((int)*(undefined4 *)0x3f94 + param_1 * 0xe + 10);
  }
  param_3[1] = uVar3;
  *(undefined2 *)0x4656 = 1;
  FUN_1000_1615(*param_3,param_3[1],&local_4,&local_6,*(undefined2 *)0x166);
  if (param_2 == 0) {
    *(undefined1 *)0x17a = 0;
    if (*(int *)0x4692 == 0) {
      for (local_c = 0; local_c < 5; local_c = local_c + 1) {
        func_0x00000153(uVar4,local_4 + -2,local_6 + local_c + -2,local_4 + 2);
        uVar4 = 0;
      }
      return 1;
    }
    if (*(int *)0x4692 != 1) {
      local_c = 0;
      do {
        func_0x00000153(uVar4,local_4 + -2,local_6 + local_c + -1,local_4 + 1);
        local_c = local_c + 1;
        uVar4 = 0;
      } while (local_c < 3);
      return 1;
    }
LAB_1000_215e:
    func_0x00000153(0x1000,local_4 + -1,local_6 + -1,local_4);
    func_0x00000153(0,local_4 + -1,local_6,local_4);
  }
  else {
    *(undefined1 *)0x17a = *(undefined1 *)0x3f84;
    if (*(int *)0x4692 == 0) {
      local_c = 0;
      do {
        func_0x00000153(uVar4,local_4 + -1,local_6 + local_c + -1,local_4 + 1);
        local_c = local_c + 1;
        uVar4 = 0;
      } while (local_c < 3);
      *(undefined1 *)0x17a = 0xf;
      iVar2 = local_6 + 2;
      iVar1 = local_4 + 2;
      local_6 = local_6 + -2;
    }
    else {
      if (*(int *)0x4692 == 1) goto LAB_1000_215e;
      *(undefined1 *)0x17a = 0;
      func_0x00000153(0x1000,local_4 + -1,local_6,local_4);
      *(undefined1 *)0x17a = 1;
      iVar2 = local_6 + 1;
      iVar1 = local_4 + 1;
      local_6 = local_6 + -1;
    }
    func_0x0001839e(0,local_4 + -2,local_6,iVar1,iVar2);
  }
  return 1;
}



/* ------------------------------------------------------------
 * FUN_1000_2241 @ 1000:2241
 * selected: address-order fallback
 * body bytes: 168
 * completed: true
 */

void __cdecl16far FUN_1000_2241(int param_1,int param_2)

{
  int *piVar1;
  undefined2 *puVar2;
  int iVar3;
  uint uVar4;
  undefined2 uVar5;
  undefined2 unaff_DS;
  int local_12;
  undefined4 local_10;
  undefined4 local_c;
  
  uVar5 = 0x1000;
  for (local_12 = param_1; local_12 < param_2; local_12 = local_12 + 1) {
    if ((*(uint *)(local_12 * 2 + (int)*(undefined4 *)0x4b76) & *(uint *)0x3f80) != 0) {
      iVar3 = local_12 * 0xc + *(int *)0x4026;
      uVar4 = (uint)*(byte *)(iVar3 + 3);
      if (uVar4 != 0) {
        local_c = (int *)CONCAT22(*(undefined2 *)0x469e,
                                  (int *)(*(int *)(iVar3 + 10) * 2 + *(int *)0x469c));
        for (iVar3 = 0; piVar1 = local_c, iVar3 < (int)uVar4; iVar3 = iVar3 + 1) {
          local_c = (int *)CONCAT22(local_c._2_2_,(int *)local_c + 1);
          puVar2 = (undefined2 *)(*piVar1 * 2 + *(int *)0x3f74);
          local_10 = (undefined2 *)CONCAT22(*(undefined2 *)0x3f76,puVar2);
          func_0x00000123(uVar5,*local_10,puVar2 + 1,*(undefined2 *)0x3f76);
          uVar5 = 0;
        }
      }
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_22e9 @ 1000:22e9
 * selected: address-order fallback
 * body bytes: 100
 * completed: true
 */

void __cdecl16far FUN_1000_22e9(int param_1,int param_2)

{
  int iVar1;
  undefined2 unaff_DS;
  
  for (; param_1 < param_2; param_1 = param_1 + 1) {
    if ((*(uint *)(param_1 * 2 + (int)*(undefined4 *)0x4b76) & *(uint *)0x3f80) != 0) {
      iVar1 = param_1 * 0xc + *(int *)0x4026;
      FUN_1000_25d9(*(undefined1 *)(iVar1 + 1),*(int *)(iVar1 + 6) * 2 + *(int *)0x468c,
                    *(undefined2 *)0x468e);
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_234f @ 1000:234f
 * selected: address-order fallback
 * body bytes: 111
 * completed: true
 */

void __cdecl16far FUN_1000_234f(int param_1,int param_2)

{
  int iVar1;
  undefined2 unaff_DS;
  
  for (; param_1 < param_2; param_1 = param_1 + 1) {
    if ((*(uint *)(param_1 * 2 + (int)*(undefined4 *)0x4b76) & *(uint *)0x3f80) != 0) {
      iVar1 = param_1 * 0xc + *(int *)0x4026;
      FUN_1000_2619(*(undefined1 *)(iVar1 + 2),*(int *)(iVar1 + 8) * 2 + *(int *)0x4598,
                    *(undefined2 *)0x459a,*(undefined1 *)0x17a);
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_23bf @ 1000:23bf
 * selected: address-order fallback
 * body bytes: 132
 * completed: true
 */

void __cdecl16far FUN_1000_23bf(int param_1,int param_2)

{
  undefined2 uVar1;
  undefined1 *puVar2;
  undefined2 unaff_DS;
  undefined4 local_6;
  
  for (; param_1 < param_2; param_1 = param_1 + 1) {
    if ((*(uint *)(param_1 * 2 + (int)*(undefined4 *)0x4b76) & *(uint *)0x3f80) != 0) {
      puVar2 = (undefined1 *)(param_1 * 0xc + *(int *)0x4026);
      uVar1 = *(undefined2 *)0x4028;
      local_6 = (undefined1 *)CONCAT22(uVar1,puVar2);
      FUN_1000_25ab(*local_6,*(int *)(puVar2 + 4) * 2 + *(int *)0x49fa,*(undefined2 *)0x49fc);
      FUN_1000_25d9(puVar2[1],*(int *)(puVar2 + 6) * 2 + *(int *)0x468c,*(undefined2 *)0x468e);
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2445 @ 1000:2445
 * selected: address-order fallback
 * body bytes: 101
 * completed: true
 */

void __cdecl16far FUN_1000_2445(undefined2 param_1)

{
  int iVar1;
  int iVar2;
  undefined2 uVar3;
  undefined2 unaff_DS;
  
  *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x57);
  uVar3 = 0x1000;
  for (iVar2 = 1; iVar2 <= *(int *)0x7ce; iVar2 = iVar2 + 1) {
    iVar1 = func_0x00006dd0(uVar3,param_1,iVar2);
    if (iVar1 != 0) {
      FUN_1000_2241(*(undefined2 *)((uint)*(byte *)(*(int *)0x4a9e + iVar2) * 2 + *(int *)0x41b2),
                    *(undefined2 *)
                     ((uint)*(byte *)(*(int *)0x4a9e + iVar2) * 2 + *(int *)0x41b2 + 2));
    }
    uVar3 = 0x5de;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_24ab @ 1000:24ab
 * selected: address-order fallback
 * body bytes: 192
 * completed: true
 */

void __cdecl16far FUN_1000_24ab(int param_1)

{
  undefined2 *puVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  undefined2 uVar5;
  undefined2 unaff_DS;
  undefined4 local_c;
  
  uVar5 = 0x1000;
  if (param_1 == 0) {
    puVar1 = (undefined2 *)(*(int *)0x3a7a * 2 + *(int *)0x41b2);
    local_c = (undefined2 *)CONCAT22(*(undefined2 *)0x41b4,puVar1);
    FUN_1000_256d(*local_c,puVar1[1]);
  }
  else {
    for (iVar4 = 1; iVar4 <= *(int *)0x7ce; iVar4 = iVar4 + 1) {
      iVar2 = func_0x00006dd0(uVar5,param_1,iVar4);
      uVar5 = 0x5de;
      iVar3 = func_0x00006dd0(0x5de,0x3762,iVar4);
      if ((iVar3 != iVar2) && (iVar2 == 0)) {
        FUN_1000_256d(*(undefined2 *)((uint)*(byte *)(*(int *)0x4a9e + iVar4) * 2 + *(int *)0x41b2),
                      *(undefined2 *)
                       ((uint)*(byte *)(*(int *)0x4a9e + iVar4) * 2 + *(int *)0x41b2 + 2));
      }
    }
  }
  *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x57);
  func_0x0001839e(uVar5,*(undefined2 *)0x3d58,*(undefined2 *)0x3d5a,*(undefined2 *)0x3d5c,
                  *(undefined2 *)0x3d5e);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_256d @ 1000:256d
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

void __cdecl16far FUN_1000_256d(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x58);
  FUN_1000_2241(param_1,param_2);
  *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x57);
  FUN_1000_22e9(param_1,param_2);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_25ab @ 1000:25ab
 * selected: address-order fallback
 * body bytes: 44
 * completed: true
 */

void __cdecl16far FUN_1000_25ab(int param_1,undefined2 *param_2)

{
  int iVar1;
  undefined2 uVar2;
  undefined2 uVar3;
  
  uVar3 = 0x1000;
  for (iVar1 = 0; iVar1 < param_1; iVar1 = iVar1 + 1) {
    uVar2 = (undefined2)((ulong)param_2 >> 0x10);
    func_0x00000120(uVar3,*param_2,((undefined2 *)param_2)[1]);
    param_2 = (undefined2 *)CONCAT22(uVar2,(undefined2 *)param_2 + 2);
    uVar3 = 0;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_25d9 @ 1000:25d9
 * selected: address-order fallback
 * body bytes: 63
 * completed: true
 */

void __cdecl16far FUN_1000_25d9(int param_1,int *param_2)

{
  int iVar1;
  undefined2 uVar2;
  
  uVar2 = 0x1000;
  for (iVar1 = 0; iVar1 < param_1; iVar1 = iVar1 + 1) {
    func_0x00000123(uVar2,*param_2,(int *)param_2 + 1,param_2._2_2_);
    param_2 = (int *)CONCAT22(param_2._2_2_,(int *)param_2 + *param_2 * 2 + 1);
    uVar2 = 0;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2619 @ 1000:2619
 * selected: address-order fallback
 * body bytes: 47
 * completed: true
 */

void __cdecl16far FUN_1000_2619(int param_1,undefined2 *param_2,undefined2 param_3)

{
  int iVar1;
  undefined2 uVar2;
  undefined2 uVar3;
  
  uVar3 = 0x1000;
  for (iVar1 = 0; iVar1 < param_1; iVar1 = iVar1 + 1) {
    uVar2 = (undefined2)((ulong)param_2 >> 0x10);
    func_0x00000114(uVar3,*param_2,((undefined2 *)param_2)[1],param_3);
    param_2 = (undefined2 *)CONCAT22(uVar2,(undefined2 *)param_2 + 2);
    uVar3 = 0;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2649 @ 1000:2649
 * selected: address-order fallback
 * body bytes: 504
 * completed: true
 */

int __cdecl16far FUN_1000_2649(undefined2 *param_1)

{
  undefined1 uVar1;
  int iVar2;
  undefined2 *puVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined2 unaff_DS;
  int local_c;
  int local_a;
  int local_8;
  int local_6;
  int local_4;
  
  uVar5 = 0x1000;
  uVar4 = (undefined2)((ulong)param_1 >> 0x10);
  puVar3 = (undefined2 *)param_1;
  FUN_1000_1615(*param_1,puVar3[1],&local_6,&local_c,*(undefined2 *)0x166);
  FUN_1000_1615(puVar3[2],puVar3[3],&local_a,&local_8,*(undefined2 *)0x166);
  if (local_8 < 0) {
    local_8 = 0;
  }
  if (*(int *)0x170 < local_c) {
    local_c = *(int *)0x170;
  }
  if (*(int *)0x4656 != 0) {
    if (local_a < local_6) {
      if (local_a < *(int *)0x16e - local_6) {
        local_a = *(int *)0x16e;
      }
      else {
        local_6 = 0;
      }
    }
    if (local_6 < 0) {
      local_6 = 0;
    }
    if (*(int *)0x16e < local_a) {
      local_a = *(int *)0x16e;
    }
  }
  local_4 = 0;
  if (local_a < local_6) {
    local_4 = func_0x0000013e(0x1000,local_6,local_8,*(undefined2 *)0x16e,local_c,
                              *(undefined2 *)0x180,*(undefined2 *)0x182);
    *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x37);
    func_0x0001839e(0,local_6,local_8,*(undefined2 *)0x16e,local_c);
    *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x38);
    uVar5 = 0x1744;
    func_0x0001839e(0x1744,local_6 + 1,local_8 + 1,*(int *)0x16e + -1,local_c + -1);
    local_6 = 0;
  }
  uVar4 = 0;
  iVar2 = func_0x0000013e(uVar5,local_6,local_8,local_a,local_c,local_4 * 2 + *(int *)0x180,
                          *(undefined2 *)0x182);
  if (*(uint *)0x184 < (uint)(local_4 + iVar2)) {
    uVar4 = 0x1e4a;
    FUN_1000_e644(0x3e5);
  }
  *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x37);
  func_0x0001839e(uVar4,local_6,local_8,local_a,local_c);
  if (*(int *)0x4692 == 0) {
    uVar4 = *(undefined2 *)0x2ed0;
    uVar1 = *(undefined1 *)0x3f84;
  }
  else {
    uVar4 = *(undefined2 *)0x2ed0;
    uVar1 = *(undefined1 *)(*(int *)0x4652 + 0x38);
  }
  *(undefined1 *)0x17a = uVar1;
  func_0x0001839e(0x1744,local_6 + 1,local_8 + 1,local_a + -1,local_c + -1);
  return local_4;
}



/* ------------------------------------------------------------
 * FUN_1000_285b @ 1000:285b
 * selected: address-order fallback
 * body bytes: 249
 * completed: true
 */

void __cdecl16far FUN_1000_285b(void)

{
  uint uVar1;
  int iVar2;
  uint *puVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined2 unaff_DS;
  int local_12;
  undefined1 local_10 [10];
  undefined4 local_6;
  
  uVar4 = 0x1000;
  if (*(int *)0x4120 != 0) {
    iVar2 = *(int *)0x4652;
    *(undefined1 *)0x17a = *(undefined1 *)(iVar2 + 0x57);
    *(undefined1 *)0x156 = *(undefined1 *)(iVar2 + 0x57);
    local_6 = (uint *)CONCAT22(*(undefined2 *)0x44f6,(uint *)*(undefined2 *)0x44f4);
    uVar1 = *(uint *)0x3f80;
    for (local_12 = 0; local_12 < *(int *)0x3a86; local_12 = local_12 + 1) {
      puVar3 = (uint *)local_6;
      if ((*local_6 & uVar1) != 0) {
        if (((*(int *)0x3f80 == 1) && (*(int *)0x166 != 0)) && (puVar3[3] == puVar3[5])) {
          *(undefined2 *)0x166 = 0;
        }
        uVar5 = 0;
        func_0x00000123(uVar4,2,puVar3 + 2,local_6._2_2_);
        uVar4 = (undefined2)((ulong)local_6 >> 0x10);
        if (((uint *)local_6)[1] >> 8 != 0xff) {
          uVar5 = 0x1e4a;
          func_0x000207f2(0,local_10,0x948,((uint *)local_6)[1] >> 8);
          FUN_1000_2b43(local_10,(uint *)local_6 + 2,local_6._2_2_);
        }
        uVar4 = uVar5;
        if (*(int *)0x3f80 == 1) {
          *(undefined2 *)0x166 = *(undefined2 *)0x3a72;
        }
      }
      local_6 = (uint *)CONCAT22(local_6._2_2_,(uint *)local_6 + 6);
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2955 @ 1000:2955
 * selected: address-order fallback
 * body bytes: 485
 * completed: true
 */

void __cdecl16far FUN_1000_2955(int param_1,uint param_2)

{
  undefined1 uVar1;
  uint uVar2;
  int iVar3;
  byte *pbVar4;
  undefined2 uVar5;
  undefined2 uVar6;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  uint local_12;
  undefined1 local_10 [10];
  undefined4 local_6;
  
  uVar6 = 0x1000;
  local_12 = 0;
  if (*(int *)0x4120 != 0) {
    if (param_1 == 0) {
      uVar5 = *(undefined2 *)0x2edc;
      uVar1 = *(undefined1 *)(*(int *)0x4652 + 0x57);
    }
    else {
      if (*(int *)0x4692 == 2) {
        uVar1 = *(undefined1 *)(*(int *)0x4652 + 0x58);
      }
      else {
        uVar1 = *(undefined1 *)(param_2 + 0x4aa4);
      }
      uVar5 = *(undefined2 *)0x2edc;
    }
    *(undefined1 *)0x156 = uVar1;
    local_6 = (uint *)CONCAT22(*(undefined2 *)0x44f6,(uint *)*(undefined2 *)0x44f4);
    if (*(int *)0x7c6 == 0) {
      uVar2 = *(uint *)0x3f80 | 0x800;
    }
    else {
      uVar2 = *(uint *)0x3f80;
    }
    while ((int)local_12 <= (int)param_2) {
      uVar5 = (undefined2)((ulong)local_6 >> 0x10);
      local_12 = (uint)(byte)((uint *)local_6)[1];
      if ((local_12 == param_2) && ((*local_6 & uVar2) != 0)) {
        func_0x000207f2(uVar6,local_10,0x94b,((uint *)local_6)[1] >> 8);
        if ((*(int *)0x4692 == 2) && (param_1 != 0)) {
          iVar3 = FUN_2000_03d0(0x1e4a,local_10);
          FUN_2000_039e(0x1e4a,local_10,0x952);
          local_10[iVar3] = 0;
        }
        uVar6 = 0x1e4a;
        FUN_1000_2b43(local_10,(uint *)local_6 + 2,local_6._2_2_);
      }
      local_6 = (uint *)CONCAT22(local_6._2_2_,(uint *)local_6 + 6);
    }
    if ((*(uint *)0x166 & 0x7fff) != 0) {
      if (param_1 == 0) {
        uVar1 = *(undefined1 *)(*(int *)0x4652 + 0x57);
      }
      else {
        uVar1 = *(undefined1 *)0x4aa0;
      }
      *(undefined1 *)0x156 = uVar1;
      local_6 = (uint *)CONCAT22(*(undefined2 *)0x44f6,(byte *)*(undefined2 *)0x44f4);
      *(undefined2 *)0x166 = 0;
      for (local_12 = 0; (int)local_12 < *(int *)0x3a86; local_12 = local_12 + 1) {
        uVar5 = (undefined2)((ulong)local_6 >> 0x10);
        pbVar4 = (byte *)local_6;
        if ((((*(byte *)local_6 & 1) != 0) && (*(uint *)(pbVar4 + 2) >> 8 != 0xff)) &&
           (*(int *)(pbVar4 + 6) == *(int *)(pbVar4 + 10))) {
          func_0x000207f2(uVar6,local_10,0x94e,*(uint *)(pbVar4 + 2) >> 8);
          if ((*(int *)0x4692 == 2) && (param_1 != 0)) {
            iVar3 = FUN_2000_03d0(0x1e4a,local_10);
            FUN_2000_039e(0x1e4a,local_10,0x952);
            local_10[iVar3] = 0;
          }
          uVar6 = 0x1e4a;
          FUN_1000_2b43(local_10,(byte *)((int)(uint *)local_6 + 4),local_6._2_2_);
        }
        local_6 = (uint *)CONCAT22(local_6._2_2_,(byte *)((int)(uint *)local_6 + 0xc));
      }
      *(undefined2 *)0x166 = *(undefined2 *)0x3a72;
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2b3f @ 1000:2b3f
 * selected: address-order fallback
 * body bytes: 1
 * completed: true
 */

void __cdecl16far FUN_1000_2b3f(void)

{
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2b43 @ 1000:2b43
 * selected: address-order fallback
 * body bytes: 357
 * completed: true
 */

void __cdecl16far FUN_1000_2b43(undefined2 param_1,undefined2 *param_2)

{
  int iVar1;
  int iVar2;
  int iVar3;
  uint uVar4;
  undefined2 *puVar5;
  undefined2 uVar6;
  undefined2 unaff_DS;
  int local_a;
  int local_8;
  int local_6;
  int local_4;
  
  iVar1 = FUN_2000_03d0(0x1000,param_1);
  uVar6 = (undefined2)((ulong)param_2 >> 0x10);
  puVar5 = (undefined2 *)param_2;
  FUN_1000_1615(*param_2,puVar5[1],&local_4,&local_8,*(undefined2 *)0x166);
  FUN_1000_1615(puVar5[2],puVar5[3],&local_6,&local_a,*(undefined2 *)0x166);
  local_4 = local_6 - local_4;
  local_8 = local_a - local_8;
  if ((local_8 == 0) || (iVar2 = FUN_2000_0ad6(local_4 / local_8), 1 < iVar2)) {
    *(int *)0x158 = local_a - *(int *)0x16c / 2;
    if (local_4 < 1) {
      uVar4 = (int)*(uint *)0x16a >> 0xf;
      *(int *)0x15a =
           (local_6 - *(int *)0x16a * iVar1) -
           (((int)((*(uint *)0x16a ^ uVar4) - uVar4) >> 2 ^ uVar4) - uVar4);
    }
    else {
      uVar4 = (int)*(uint *)0x16a >> 0xf;
      *(int *)0x15a = (((int)((*(uint *)0x16a ^ uVar4) - uVar4) >> 2 ^ uVar4) - uVar4) + local_6;
    }
  }
  else {
    iVar2 = *(int *)0x16a;
    iVar3 = (local_6 - (iVar2 * iVar1) / 2) + 1;
    *(int *)0x15a = iVar3;
    if (iVar3 < 0) {
      return;
    }
    if (*(int *)0x172 < iVar3 + iVar2 * iVar1) {
      return;
    }
    if (local_8 < 1) {
      local_a = local_a - *(int *)0x16c;
      uVar6 = *(undefined2 *)0x2ede;
    }
    else {
      uVar6 = *(undefined2 *)0x2ede;
    }
    *(int *)0x158 = local_a;
  }
  func_0x00000108(0x1e4a,param_1);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2cab @ 1000:2cab
 * selected: address-order fallback
 * body bytes: 176
 * completed: true
 */

void __cdecl16far FUN_1000_2cab(int param_1,undefined2 param_2)

{
  undefined2 *puVar1;
  undefined2 unaff_DS;
  undefined4 local_a;
  byte *local_4;
  
  func_0x00000111(0x1000);
  if (param_1 == 0) {
    FUN_1000_234f(0,param_2);
    return;
  }
  local_4 = (byte *)*(undefined2 *)(*(int *)0x7a2 * 2 + 0x650);
  while( true ) {
    if (*local_4 == 0xff) break;
    puVar1 = (undefined2 *)((uint)*local_4 * 2 + *(int *)0x41b2);
    local_a = (undefined2 *)CONCAT22(*(undefined2 *)0x41b4,puVar1);
    FUN_1000_234f(*local_a,puVar1[1]);
    local_4 = local_4 + 1;
  }
  local_4 = (byte *)*(undefined2 *)(*(int *)0x7a2 * 2 + 0x72c);
  while( true ) {
    if (*local_4 == 0xff) break;
    puVar1 = (undefined2 *)((uint)*local_4 * 2 + *(int *)0x41b2);
    local_a = (undefined2 *)CONCAT22(*(undefined2 *)0x41b4,puVar1);
    FUN_1000_234f(*local_a,puVar1[1]);
    local_4 = local_4 + 1;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2d5d @ 1000:2d5d
 * selected: address-order fallback
 * body bytes: 105
 * completed: true
 */

void __cdecl16far FUN_1000_2d5d(int param_1)

{
  undefined2 uVar1;
  undefined2 uVar2;
  undefined2 *puVar3;
  undefined2 unaff_DS;
  undefined4 local_a;
  
  if ((((param_1 == 4) || (param_1 == 0x59)) || (param_1 == 0x66)) || (param_1 == 0x82)) {
    *(undefined1 *)0x17a = *(undefined1 *)0x3f84;
    puVar3 = (undefined2 *)(param_1 * 2 + *(int *)0x41b2);
    local_a = (undefined2 *)CONCAT22(*(undefined2 *)0x41b4,puVar3);
    uVar1 = *local_a;
    uVar2 = puVar3[1];
    FUN_1000_23bf(uVar1,uVar2);
    FUN_1000_2241(uVar1,uVar2);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2dc7 @ 1000:2dc7
 * selected: address-order fallback
 * body bytes: 552
 * completed: true
 */

void __cdecl16far FUN_1000_2dc7(int param_1,int param_2)

{
  char cVar1;
  byte *pbVar2;
  int iVar3;
  undefined2 *puVar4;
  undefined2 uVar5;
  undefined2 uVar6;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined4 local_36;
  int local_32 [20];
  uint local_a;
  int local_8;
  byte *local_6;
  undefined2 local_4;
  
  if (*(int *)0x4692 == 2) {
    local_4 = *(undefined2 *)0x3f82;
  }
  else {
    local_4 = *(undefined2 *)0x3f84;
  }
  uVar5 = 0x1e4a;
  FUN_2000_0a48(0x1000,local_32,0,0x28);
  if ((*(int *)0x4692 == 2) || (*(int *)0x41b0 == 0)) {
    *(undefined2 *)0x740 = 0;
  }
  else {
    if (param_2 == 0) {
      for (local_a = 1; (int)local_a <= *(int *)0x7ce; local_a = local_a + 1) {
        local_32[*(char *)(local_a + 0x4aa4)] = local_32[*(char *)(local_a + 0x4aa4)] + 1;
      }
    }
    else {
      local_6 = (byte *)*(undefined2 *)(*(int *)0x7a2 * 2 + 0x650);
      while( true ) {
        pbVar2 = local_6;
        local_6 = local_6 + 1;
        local_a = (uint)*pbVar2;
        if (local_a == 0xff) break;
        local_32[*(char *)(local_a + 0x4aa4)] = local_32[*(char *)(local_a + 0x4aa4)] + 1;
      }
      local_6 = (byte *)*(undefined2 *)(*(int *)0x7a2 * 2 + 0x72c);
      while( true ) {
        pbVar2 = local_6;
        local_6 = local_6 + 1;
        local_a = (uint)*pbVar2;
        if (local_a == 0xff) break;
        local_32[*(char *)(local_a + 0x4aa4)] = local_32[*(char *)(local_a + 0x4aa4)] + 1;
      }
    }
    local_8 = 0;
    for (local_a = 0; (int)local_a < 0x14; local_a = local_a + 1) {
      if (local_8 < local_32[local_a]) {
        local_8 = local_32[local_a];
        *(int *)0x740 = local_a;
      }
    }
  }
  FUN_1000_1683(param_2);
  local_a = 1;
  do {
    if (*(int *)0x7ce < (int)local_a) {
      if (*(int *)0x4692 == 2) {
        *(undefined2 *)0x3f82 = local_4;
        func_0x0000010e(uVar5,local_4);
        uVar5 = 0;
      }
      else {
        for (local_a = 1; (int)local_a <= *(int *)0x7ce; local_a = local_a + 1) {
          if ((*(int *)0x41b0 != 0) &&
             (cVar1 = *(char *)(local_a + 0x4aa4), *(int *)0x3f84 = (int)cVar1, cVar1 != 0)) {
            FUN_1000_2d5d(local_a);
          }
        }
        *(undefined2 *)0x3f84 = local_4;
      }
      *(undefined2 *)0x740 = 0xffff;
      FUN_1000_285b();
      FUN_1000_2b3f();
      uVar6 = 0x1e4a;
      iVar3 = func_0x0002091e(uVar5,0x4490,0x2c);
      if (iVar3 != 0) {
        *(undefined1 *)0x4490 = 0;
      }
      if (param_1 != 0) {
        uVar6 = 0xbaa;
        func_0x0000bdfe(0x1e4a);
      }
      func_0x00000111(uVar6);
      return;
    }
    if (*(int *)0x4692 == 2) {
      iVar3 = (int)*(char *)(local_a + 0x4aa4);
      *(int *)0x3f82 = iVar3;
      if (iVar3 != 0) {
        func_0x0000010e(uVar5,iVar3);
        uVar5 = 0;
LAB_1000_2f14:
        if (*(int *)0x41b0 == 0) {
          FUN_1000_1869(local_a,1);
        }
        else {
          *(undefined2 *)0x15c = *(undefined2 *)0x3f84;
          *(undefined1 *)0x17a = *(undefined1 *)(*(int *)0x4652 + 0x57);
          puVar4 = (undefined2 *)(local_a * 2 + *(int *)0x41b2);
          local_36 = (undefined2 *)CONCAT22(*(undefined2 *)0x41b4,puVar4);
          FUN_1000_234f(*local_36,puVar4[1]);
        }
      }
    }
    else {
      cVar1 = *(char *)(local_a + 0x4aa4);
      *(int *)0x3f84 = (int)cVar1;
      if ((int)cVar1 != *(int *)0x740) goto LAB_1000_2f14;
    }
    local_a = local_a + 1;
  } while( true );
}



/* ------------------------------------------------------------
 * FUN_1000_2ff5 @ 1000:2ff5
 * selected: address-order fallback
 * body bytes: 122
 * completed: true
 */

void FUN_1000_2ff5(undefined2 param_1,int param_2,int param_3)

{
  undefined2 unaff_DS;
  
  if (*(int *)0x7c6 == 1) {
    *(undefined2 *)0x32ba = 0x401;
  }
  else {
    *(undefined2 *)0x32ba = 1;
  }
  if (0xf < param_3) {
    param_3 = param_3 + -0xf;
  }
  if ((1 < param_3) && (param_3 < 0xb)) {
    *(int *)0x32ba = 1 << ((char)param_3 - 1U & 0x1f);
  }
  *(undefined1 *)0x32c2 = (undefined1)param_2;
  *(undefined1 *)0x17c = *(undefined1 *)0x4502;
  func_0x00000138(0x1000);
  FUN_1000_39cd();
  *(undefined1 *)0x17c = *(undefined1 *)0x4020;
  func_0x00000132(0,0x101,*(undefined2 *)(param_2 * 2 + *(int *)0x44f2));
  return;
}



