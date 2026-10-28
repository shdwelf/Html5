/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: xpt05_7004.rom
 * SHA-256: 6546fa1807b5878ea7d85e286415ac07ee0e33509fb74b553ba667c1ec5da48e
 */

/* FUN_0000_003d @ 0000:003d completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_003d(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x6014;
  return;
}



/* FUN_0000_0064 @ 0000:0064 completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_0064(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x5f45;
  return;
}



/* FUN_0000_008b @ 0000:008b completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_008b(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = (char *)s_Copyright_2004__0000_12ac;
  return;
}



/* FUN_0000_00b2 @ 0000:00b2 completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_00b2(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x57eb;
  return;
}



/* FUN_0000_0175 @ 0000:0175 completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_0175(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x5285;
  return;
}



/* FUN_0000_01c3 @ 0000:01c3 completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_01c3(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x3da9;
  return;
}



/* FUN_0000_01ea @ 0000:01ea completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_01ea(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x5299;
  return;
}



/* FUN_0000_0238 @ 0000:0238 completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_0238(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x3c42;
  return;
}



/* FUN_0000_03be @ 0000:03be completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_03be(void)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  byte in_CF;
  byte in_PF;
  byte in_AF;
  byte in_ZF;
  byte in_SF;
  byte in_TF;
  byte in_IF;
  byte in_OF;
  byte in_NT;
  undefined2 in_stack_00000000;
  
  *(uint *)0x6246 =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x6202 = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xcb0;
  *(int *)0xcb0 = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x6202;
  LOCK();
  iVar2 = *(int *)0xcb0;
  *(int *)0xcb0 = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x6246;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x2725;
  return;
}



/* FUN_0000_13c6 @ 0000:13c6 completed=true */

uint __cdecl16near FUN_0000_13c6(int param_1)

{
  uint uVar1;
  undefined2 unaff_DS;
  
  uVar1 = *(int *)0x8fa0 + 1U & 0xfffe;
  if (*(uint *)0xea8 < uVar1 + param_1) {
    uVar1 = 0;
  }
  else {
    *(uint *)0x8fa0 = uVar1 + param_1;
  }
  return uVar1;
}



/* FUN_0000_13e6 @ 0000:13e6 completed=true */

void FUN_0000_13e6(void)

{
  do {
                    /* WARNING: Do nothing block with infinite loop */
  } while( true );
}



/* FUN_0000_13eb @ 0000:13eb completed=true */

void FUN_0000_13eb(undefined2 param_1)

{
  code *in_stack_00000000;
  
  in(param_1);
                    /* WARNING: Could not recover jumptable at 0x000013f1. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  (*in_stack_00000000)();
  return;
}



/* FUN_0000_13f3 @ 0000:13f3 completed=true */

undefined4 __cdecl16near FUN_0000_13f3(undefined2 param_1,undefined2 param_2)

{
  out(param_1,param_2);
  return CONCAT22(param_1,param_2);
}



/* FUN_0000_13ff @ 0000:13ff completed=true */

void __cdecl16near FUN_0000_13ff(void)

{
  FUN_0000_7b2a(0x3d92);
  FUN_0000_b3ab(0x3d92,0,0x2c0);
  FUN_0000_7aa7(0x2ba,0,0x2c0,0x3d92,(code *)FUN_0000_53c0);
  return;
}



/* FUN_0000_142a @ 0000:142a completed=true */

void __cdecl16near FUN_0000_142a(void)

{
  byte bVar1;
  undefined2 uVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  undefined2 unaff_DS;
  code *pcVar7;
  
  if (*(int *)0x7a12 != 0) {
    if ((*(byte *)0x38ea & 0x40) != 0) {
      FUN_0000_5fa1(0xa1,0);
    }
    if ((*(byte *)0x38ea & 2) != 0) {
      FUN_0000_5fa1(0x45,0);
    }
    if ((*(byte *)0x38ea & 0x10) == 0) {
      if (*(char *)0xf3d == '\a') {
        if (*(int *)0x5a5c == 0) {
          uVar2 = 0x77fe;
        }
        else {
          uVar2 = *(undefined2 *)0x5a5c;
        }
        FUN_0000_c35f(0x2c5,uVar2);
        FUN_0000_5fa1(0x77fe,0);
        FUN_0000_5f7e(uVar2,(code *)FUN_0000_3b53);
      }
      else {
        pcVar7 = (code *)FUN_0000_5542;
        uVar2 = FUN_0000_13c6(0x140,(code *)FUN_0000_5542);
        FUN_0000_7aa7(0x2c0,0,0x140,uVar2,pcVar7);
      }
    }
    else {
      FUN_0000_5fa1(0x77fe,0);
    }
    if ((*(byte *)0x38ea & 8) != 0) {
      *(undefined2 *)0x3ec = 0x8b;
      *(undefined2 *)0x3ee = 0x10;
    }
    FUN_0000_0064();
    if (((*(byte *)0x38ea & 4) != 0) && ((*(byte *)0x3984 & 1) != 0)) {
      if (*(char *)0x391b == '\0') {
        *(undefined1 *)0x391b = 0x10;
      }
      FUN_0000_a96c(0x3ced,0x38eb,0x10);
      FUN_0000_a96c(0x3cfd,0x391c,0x10);
      FUN_0000_003d(0x3bfa,0x3ced,(uint)*(byte *)0x391b << 3);
    }
  }
  if ((*(byte *)0x38ea & 1) == 0) {
    FUN_0000_7aa7(0x2ba,0,0x2c0,0x3d92,(code *)FUN_0000_53c0);
  }
  if ((*(byte *)0x38ea & 0x20) == 0) {
    if (CONCAT11(*(undefined1 *)0x5a7b,*(undefined1 *)0x5a7a) == 0) {
      uVar2 = 0x50;
    }
    else {
      uVar2 = CONCAT11(*(undefined1 *)0x5a7b,*(undefined1 *)0x5a7a);
    }
    FUN_0000_c35f(0x2c8,uVar2);
    pcVar7 = (code *)FUN_0000_5087;
    uVar2 = FUN_0000_13c6(0x1c0,(code *)FUN_0000_5087);
    FUN_0000_7aa7(0x2cb,0,0x1c0,uVar2,pcVar7);
    if (*(char *)0xf3d != '\a') {
      pcVar7 = (code *)FUN_0000_5087;
      uVar2 = FUN_0000_13c6(0x1c0,(code *)FUN_0000_5087);
      FUN_0000_7aa7(0x2d0,0,0x1c0,uVar2,pcVar7);
    }
    if ((*(byte *)0x391a & 0x80) == 0) {
      FUN_0000_00b2(*(undefined1 *)0x7a12);
      FUN_0000_5049(0x2d5,0x100,0x2d9);
      FUN_0000_5049(0x2d5,0x127,0x2ed);
      FUN_0000_5049(0x301,0xd9,0x306);
      FUN_0000_5049(0x2d5,0x100,0x2e0);
      FUN_0000_5049(0x2d5,0x127,0x2f4);
      FUN_0000_5049(0x301,0xd9,0x30d);
    }
  }
  if (*(char *)0xf3d != '\a') {
    if ((*(byte *)0x391a & 2) == 0) {
      pcVar7 = (code *)FUN_0000_32d4;
      uVar2 = FUN_0000_13c6(0x140,(code *)FUN_0000_32d4);
      FUN_0000_7aa7(0x317,0,0x140,uVar2,pcVar7);
    }
    if (CONCAT11(*(undefined1 *)0x5a7d,*(undefined1 *)0x5a7c) == 0) {
      uVar2 = 0x19;
    }
    else {
      uVar2 = CONCAT11(*(undefined1 *)0x5a7d,*(undefined1 *)0x5a7c);
    }
    FUN_0000_c35f(0x31c,uVar2);
    pcVar7 = (code *)FUN_0000_2e1f;
    uVar2 = FUN_0000_13c6(0x140,(code *)FUN_0000_2e1f);
    FUN_0000_7aa7(799,0,0x140,uVar2,pcVar7);
  }
  (*(code *)*(undefined2 *)0x90)();
  FUN_0000_c594();
  uVar3 = FUN_0000_adf9();
  if (uVar3 < 2) {
    *(undefined1 *)0x17a4 = 1;
  }
  else {
    *(undefined1 *)0x17a4 = 2;
  }
  *(undefined2 *)0x7122 = 0;
  for (iVar6 = 0; iVar6 < (int)(uint)*(byte *)0x17a4; iVar6 = iVar6 + 1) {
    *(undefined1 *)(iVar6 * 0x105a + 0x17b0) = ((undefined *)&DAT_0000_3880)[iVar6 * 0x30];
    if ((*(byte *)0x3984 & 8) == 0) {
      *(byte *)*(undefined2 *)0x3864 = *(byte *)*(undefined2 *)0x3864 & 0xfc;
    }
    iVar4 = iVar6 * 0x30;
    *(undefined1 *)(iVar6 * 0x105a + 0x17b1) = *(undefined1 *)(iVar4 + 0x3881);
    if ((((undefined *)&DAT_0000_3880)[iVar4] & 3) == 0) {
      bVar1 = 0xff;
    }
    else {
      bVar1 = 0xfd;
    }
    iVar5 = iVar6 * 0x105a;
    *(byte *)(iVar5 + 0x17ca) = ((undefined *)&DAT_0000_3882)[iVar4] & bVar1;
    *(undefined1 *)(iVar5 + 0x17cb) = 0;
    FUN_0000_a96c(iVar5 + 0x17b2,iVar6 * 0x30 + 0x3888,4);
    FUN_0000_a96c(iVar6 * 0x105a + 0x17b6,iVar6 * 0x30 + 0x3884,4);
    iVar4 = iVar6 * 0x30;
    iVar5 = iVar6 * 0x105a;
    *(undefined1 *)(iVar5 + 0x17bc) = ((undefined *)&DAT_0000_388c)[iVar4];
    *(undefined1 *)(iVar5 + 0x17be) = ((undefined *)&DAT_0000_388d)[iVar4];
    *(int *)(iVar5 + 0x17ce) =
         (uint)*(byte *)(iVar4 + 0x388e) * 0x3c + (uint)*(byte *)(iVar4 + 0x388f);
    FUN_0000_a96c(iVar5 + 0x17bf,(undefined *)&DAT_0000_3890 + iVar4,8);
    *(undefined2 *)(iVar6 * 2 + 0xfb4) = 0xffff;
  }
  FUN_0000_7bc1();
  iVar6 = 0;
  do {
    if (*(char *)(iVar6 + 0x7ab7) != '\0') {
      FUN_0000_c604(0x14e,1);
    }
    iVar6 = iVar6 + 1;
  } while (iVar6 < 3);
  if ((*(int *)0x7a12 == 0) || ((*(byte *)0x391a & 1) != 0)) {
    FUN_0000_6cf2();
  }
  if (*(char *)0xf3d == '\a') {
    do {
      (*(code *)*(undefined2 *)0x90)();
    } while( true );
  }
  *(undefined2 *)0x3864 = 0x17b0;
  iVar6 = *(int *)0x3866;
  *(undefined2 *)(iVar6 + 6) = 0;
  *(undefined2 *)(iVar6 + 4) = 0x17b0;
  if ((*(char *)0x38b1 != -1) && (1 < *(byte *)0x17a4)) {
    FUN_0000_7aa7(0x324,1,0x1f0,0x3a0a,0x8b);
  }
  FUN_0000_008b();
  return;
}



/* FUN_0000_181e @ 0000:181e completed=true */

void __cdecl16near FUN_0000_181e(void)

{
  char cVar1;
  undefined2 uVar2;
  int iVar3;
  char *pcVar4;
  undefined2 unaff_DS;
  undefined1 local_e [2];
  undefined1 *local_c [3];
  int local_6;
  int local_4;
  
  local_c[0] = (undefined1 *)0x245;
  local_c[1] = local_e;
  local_c[2] = (undefined1 *)0x6af4;
  uVar2 = FUN_0000_b10c();
  *(undefined2 *)0x7d90 = uVar2;
  FUN_0000_3509(0x3d8c);
  FUN_0000_355a(0x397e);
  FUN_0000_a96c(0x3984,0x3d8c,6);
  FUN_0000_3594(0x3984);
  FUN_0000_b3f4(0x1314,0x328);
  *(undefined2 *)0x6454 = *(undefined2 *)0x32f;
  *(undefined1 *)0x3d0d = *(undefined1 *)0x5a59;
  if (*(int *)0x7a12 != 0) {
    if (*(int *)0x5a5a == 0) {
      uVar2 = 0x578;
    }
    else {
      uVar2 = *(undefined2 *)0x5a5a;
    }
    *(undefined2 *)0x72fa = uVar2;
    if (*(int *)0x5a82 == 0) {
      uVar2 = 500;
    }
    else {
      uVar2 = *(undefined2 *)0x5a82;
    }
    *(undefined2 *)0xfba = uVar2;
    *(undefined2 *)0xf02 = *(undefined2 *)0x5a70;
    if (600 < *(uint *)0xf02) {
      *(undefined2 *)0x5a70 = 600;
      *(undefined2 *)0xf02 = 600;
      FUN_0000_ac9a(0x7e,0x180,0x5a0c);
    }
  }
  if (*(byte *)0x5a64 < 0xe0) {
    FUN_0000_a96c(0xef8,0x5a64,4);
  }
  if (*(int *)0x6aed != 0x600) {
    FUN_0000_a96c(0x6af4,0x38e0,8);
    FUN_0000_a96c(0x6afc,0x5a72,8);
  }
  local_e[0] = *(undefined1 *)0x2b0;
  iVar3 = FUN_0000_ad21(0x7e,0x200,0x3d0e);
  if (iVar3 == 0) {
    if ((*(char *)0x3d2e != '\0') && (*(byte *)0x3d2e < 0x5e)) {
      iVar3 = FUN_0000_cce7(0x3d2f,0);
      pcVar4 = (char *)(iVar3 + 1);
      local_4 = 0;
      do {
        local_6 = FUN_0000_b418(pcVar4);
        if ((int)(uint)*(byte *)0x3d2e < local_6) break;
        if (*pcVar4 != -1) {
          FUN_0000_b3f4(local_c[local_4],pcVar4);
        }
        pcVar4 = pcVar4 + local_6 + 1;
        local_4 = local_4 + 1;
      } while (local_4 < 3);
      *(undefined1 *)0x2b0 = local_e[0];
    }
  }
  else {
    FUN_0000_b3ab(0x3d0e,0,0x7e);
    FUN_0000_ac9a(0x7e,0x200,0x3d0e);
  }
  if ((*(byte *)0x393a & 8) != 0) {
    cVar1 = FUN_0000_c555(0xff);
    if (cVar1 != '\0') {
      cVar1 = FUN_0000_c555(0);
      if (cVar1 != '\0') {
        iVar3 = 0;
        do {
          *(undefined1 *)(iVar3 + 0x6ae7) = *(undefined1 *)(iVar3 + 0x3d12);
          iVar3 = iVar3 + 1;
        } while (iVar3 < 6);
      }
    }
  }
  iVar3 = FUN_0000_ad21(0x7e,0x380,(undefined *)&DAT_0000_7a2d);
  if (iVar3 != 0) {
    FUN_0000_b193();
    FUN_0000_ac9a(0x7e,0x380,(undefined *)&DAT_0000_7a2d);
  }
  FUN_0000_b1db();
  FUN_0000_cd1e();
  FUN_0000_2737();
  *(undefined1 *)0xf3e = 1;
  *(undefined1 *)0xf3d = 1;
  *(byte *)0x7d92 = *(byte *)0x5a80 & 0x40;
  FUN_0000_b3f4(0x265,0x245);
  FUN_0000_bdb3(0x265,0x332);
  return;
}



/* FUN_0000_1a0d @ 0000:1a0d completed=true */

void __cdecl16near FUN_0000_1a0d(void)

{
  undefined2 uVar1;
  uint uVar2;
  undefined2 unaff_DS;
  byte local_3;
  
  uVar1 = FUN_0000_4b4f(*(undefined2 *)0x210,0);
  uVar2 = FUN_0000_4ae9(2,0,uVar1);
  if (*(uint *)0x242 != uVar2) {
    if (*(char *)0x244 != '\0') {
      *(undefined1 *)0x244 = 0;
    }
    if ((uVar2 & 4) == 0) {
      local_3 = 0;
      do {
        if (*(char *)(local_3 + 0x7ab7) != '\0') {
          if ((*(int *)((uint)*(byte *)((uint)local_3 * 4 + 0x7aab) * 2 + 0x1586) -
               (uint)*(byte *)((uint)local_3 * 4 + 0x7aac) & 0x40) == 0) {
            FUN_0000_ce51(*(undefined1 *)(local_3 + 0x7ab7));
          }
          else {
            FUN_0000_ce2f(*(undefined1 *)(local_3 + 0x7ab7));
          }
        }
        local_3 = local_3 + 1;
      } while (local_3 < 3);
    }
    else {
      local_3 = 0;
      do {
        if (*(char *)(local_3 + 0x7ab7) != '\0') {
          if ((*(int *)((uint)*(byte *)((uint)local_3 * 4 + 0x7aab) * 2 + 0x1586) -
               (uint)*(byte *)((uint)local_3 * 4 + 0x7aac) & 0x40) == 0) {
            FUN_0000_ce2f(*(undefined1 *)(local_3 + 0x7ab7));
          }
          else {
            FUN_0000_ce51(*(undefined1 *)(local_3 + 0x7ab7));
          }
        }
        local_3 = local_3 + 1;
      } while (local_3 < 3);
    }
    *(uint *)0x242 = uVar2;
  }
  *(int *)0x2b8 = *(int *)0x2b8 + 1;
  uVar2 = *(uint *)0x88;
  *(int *)0x240 = *(int *)0x8a + (uint)(0xfffe < uVar2);
  *(int *)0x23e = uVar2 + 1;
  return;
}



/* FUN_0000_1b4b @ 0000:1b4b completed=true */

void __cdecl16near FUN_0000_1b4b(void)

{
  return;
}



/* FUN_0000_1b50 @ 0000:1b50 completed=true */

void __cdecl16near FUN_0000_1b50(void)

{
  return;
}



/* FUN_0000_26e5 @ 0000:26e5 completed=true */

void __cdecl16near FUN_0000_26e5(void)

{
  return;
}



/* FUN_0000_26ea @ 0000:26ea completed=true */

undefined2 __cdecl16near FUN_0000_26ea(undefined2 param_1,undefined2 param_2,int param_3)

{
  int iVar1;
  undefined2 uVar2;
  undefined2 unaff_DS;
  
  if (*(int *)0x7a12 == 0) {
LAB_0000_2719:
    uVar2 = 2;
  }
  else {
    iVar1 = FUN_0000_b418(0x390c);
    if (iVar1 == param_3) {
      iVar1 = FUN_0000_abad(param_2,0x390c,param_3);
      if (iVar1 == 0) goto LAB_0000_2719;
    }
    uVar2 = 1;
  }
  return uVar2;
}



/* FUN_0000_271f @ 0000:271f completed=true */

void __cdecl16near FUN_0000_271f(void)

{
  FUN_0000_7a44(0x83e);
  return;
}



/* FUN_0000_272b @ 0000:272b completed=true */

undefined4 __cdecl16near FUN_0000_272b(void)

{
  undefined2 unaff_DS;
  
  return CONCAT22(*(undefined2 *)0x8a,*(undefined2 *)0x88);
}



/* FUN_0000_2737 @ 0000:2737 completed=true */

void __cdecl16near FUN_0000_2737(void)

{
  int iVar1;
  
  iVar1 = FUN_0000_ad21(0x7e,0x280,0x5c00);
  if (iVar1 == 0) {
    iVar1 = FUN_0000_ad21(0x7e,0x300,0x5c7e);
    if (iVar1 == 0) goto LAB_0000_277d;
  }
  FUN_0000_27b6(0);
  FUN_0000_279b();
  FUN_0000_a96c(0x5c00,0x5cfc,0x7e);
  FUN_0000_a96c(0x5c7e,0x5d7a,0x7e);
LAB_0000_277d:
  FUN_0000_a96c(0x5cfc,0x5c00,0x7e);
  FUN_0000_a96c(0x5d7a,0x5c7e,0x7e);
  return;
}



/* FUN_0000_279b @ 0000:279b completed=true */

void __cdecl16near FUN_0000_279b(void)

{
  FUN_0000_ac9a(0x7e,0x280,0x5cfc);
  FUN_0000_ac9a(0x7e,0x300,0x5d7a);
  return;
}



/* FUN_0000_27b6 @ 0000:27b6 completed=true */

void __cdecl16near FUN_0000_27b6(void)

{
  undefined2 unaff_DS;
  
  FUN_0000_b3ab(0x5cfc,0,0x7e);
  FUN_0000_b3ab(0x5d7a,0,0x7e);
  *(byte *)0x5d94 = *(byte *)0x5d94 & 0xf0;
  *(byte *)0x5d94 = *(byte *)0x5d94 | 3;
  *(undefined1 *)0x5daf = 3;
  *(undefined2 *)0x5db0 = 1;
  *(byte *)0x5db6 = *(byte *)0x5db6 & 0xf0;
  *(byte *)0x5db6 = *(byte *)0x5db6 | 3;
  *(undefined1 *)0x5dd1 = 3;
  *(undefined2 *)0x5dd2 = 1;
  *(byte *)0x5dd8 = *(byte *)0x5dd8 & 0xf0;
  *(byte *)0x5dd8 = *(byte *)0x5dd8 | 3;
  *(undefined1 *)0x5df3 = 3;
  *(undefined2 *)0x5df4 = 1;
  return;
}



/* FUN_0000_2814 @ 0000:2814 completed=true */

/* WARNING: Removing unreachable block (ram,0x00002af2) */
/* WARNING: Removing unreachable block (ram,0x00002b12) */
/* WARNING: Removing unreachable block (ram,0x00002b23) */
/* WARNING: Removing unreachable block (ram,0x00002b1e) */
/* WARNING: Removing unreachable block (ram,0x00002b26) */
/* WARNING: Removing unreachable block (ram,0x00002b47) */
/* WARNING: Removing unreachable block (ram,0x00002b53) */
/* WARNING: Removing unreachable block (ram,0x00002b4c) */
/* WARNING: Removing unreachable block (ram,0x00002b5f) */
/* WARNING: Removing unreachable block (ram,0x00002b74) */
/* WARNING: Removing unreachable block (ram,0x00002b51) */
/* WARNING: Removing unreachable block (ram,0x00002bc4) */

void __cdecl16near FUN_0000_2814(void)

{
  int iVar1;
  undefined2 uVar2;
  uint uVar3;
  int *piVar4;
  undefined2 unaff_DS;
  uint local_8;
  byte bStack_5;
  byte bStack_4;
  char local_3;
  
  FUN_0000_7a44(0x856,0x5cfc);
  FUN_0000_b832(0x5cfc);
  FUN_0000_74ab(0x2f);
  FUN_0000_b815(0x18,0x5d62);
  FUN_0000_74ae(0xb);
  FUN_0000_b815(0x18,0x5d7a);
  FUN_0000_74ae(0x17);
  FUN_0000_b815(0x31,0x5d00);
  iVar1 = FUN_0000_b3c3(0x5d00,0x86b);
  if (iVar1 == 0) {
    *(undefined1 *)0x5d00 = 0;
  }
  FUN_0000_74ae(0x23);
  FUN_0000_b815(0x31,0x5d31);
  iVar1 = FUN_0000_b3c3(0x5d31,0x86b);
  if (iVar1 == 0) {
    *(undefined1 *)0x5d31 = 0;
  }
  FUN_0000_7a44(0x86d,1);
  iVar1 = FUN_0000_b519((*(byte *)0x5d94 & 0xf) != 3);
  if (iVar1 == 0) {
    *(byte *)0x5d94 = *(byte *)0x5d94 & 0xf0;
    *(byte *)0x5d94 = *(byte *)0x5d94 | 3;
  }
  else {
    *(byte *)0x5d94 = *(byte *)0x5d94 & 0xf0;
    if (*(byte *)0x17a4 < 2) {
      *(byte *)0x5d94 = *(byte *)0x5d94 & 0xcf;
    }
    else {
      while( true ) {
        FUN_0000_74ae(0);
        local_8 = ((*(byte *)0x5d94 & 0x30) >> 4) + 1;
        FUN_0000_b6d0(&local_8,0);
        local_8 = local_8 - 1;
        if (local_8 < 2) break;
        FUN_0000_0175(1,2);
      }
      *(byte *)0x5d94 = *(byte *)0x5d94 & 0xcf;
      *(byte *)0x5d94 = *(byte *)0x5d94 | ((byte)local_8 & 3) << 4;
      FUN_0000_74cb();
    }
    while( true ) {
      FUN_0000_7a44(0x89a);
      local_8 = 2 - (*(byte *)0x5d94 >> 6);
      FUN_0000_b6d0(&local_8,0);
      local_8 = local_8 - 1;
      if (local_8 < 2) break;
      FUN_0000_0175(1,2);
    }
    *(byte *)0x5d94 = *(byte *)0x5d94 & 0x3f;
    *(byte *)0x5d94 = *(byte *)0x5d94 | ('\x01' - (char)local_8) * '@';
    FUN_0000_7a44(0x8a9,*(undefined1 *)0x5d95);
    if (local_8 == 0) {
      FUN_0000_7a44(0x868);
    }
    else {
      FUN_0000_7a44(0x8b8,*(undefined1 *)0x5d96);
    }
    FUN_0000_b58c(0x5d95,0x5d95);
    if (local_8 != 0) {
      FUN_0000_7494(0x2c);
      FUN_0000_b58c(0x5d96,0x5d96);
    }
    FUN_0000_74cb();
  }
  bStack_5 = 0;
  do {
    bStack_4 = '\x01' << (bStack_5 & 0x1f);
    if ((*(byte *)0x5d92 & bStack_4) == 0) {
      uVar2 = 0x58;
    }
    else if ((*(byte *)0x5d93 & bStack_4) == 0) {
      uVar2 = 0x49;
    }
    else {
      uVar2 = 0x41;
    }
    FUN_0000_7a44(0x8c1,bStack_5 + 1,uVar2);
    uVar3 = FUN_0000_7509();
    local_3 = (char)(uVar3 & 0xffdf);
    FUN_0000_7494(uVar3 & 0xffdf);
    iVar1 = 4;
    piVar4 = (int *)&DAT_0000_2bc8;
    do {
      if (*piVar4 == (int)local_3) {
                    /* WARNING: Could not recover jumptable at 0x00002a6d. Too many branches */
                    /* WARNING: Treating indirect jump as call */
        (*(code *)piVar4[4])();
        return;
      }
      piVar4 = piVar4 + 1;
      iVar1 = iVar1 + -1;
    } while (iVar1 != 0);
    FUN_0000_7a44(0x8e1);
  } while( true );
}



/* FUN_0000_2d5b @ 0000:2d5b completed=true */

void __cdecl16near FUN_0000_2d5b(void)

{
  byte in_AL;
  byte bVar1;
  uint uVar2;
  byte *pbVar3;
  int unaff_DI;
  undefined2 unaff_DS;
  
  pbVar3 = (byte *)0x5c98;
  do {
    uVar2 = (uint)*pbVar3;
    if ((*pbVar3 & 0x10) == 0) {
      if (unaff_DI == 0x17b0) {
LAB_0000_2d7c:
        while( true ) {
          bVar1 = (byte)(uVar2 & 0xff03);
          if (1 < bVar1) break;
          if (in_AL == pbVar3[(uVar2 & 0xff03) + 1]) {
            if ((*pbVar3 & 0x40) != 0) {
              *pbVar3 = *pbVar3 + 1;
            }
            *pbVar3 = *pbVar3 + 1;
            break;
          }
          if (bVar1 != 1) break;
          *pbVar3 = *pbVar3 - 1;
          uVar2 = (uint)*pbVar3;
        }
      }
    }
    else if (unaff_DI != 0x17b0) goto LAB_0000_2d7c;
    pbVar3 = pbVar3 + 0x22;
    if ((byte *)0x5cfb < pbVar3) {
      return;
    }
  } while( true );
}



/* FUN_0000_2dac @ 0000:2dac completed=true */

undefined1 __cdecl16near FUN_0000_2dac(byte param_1)

{
  char cVar1;
  int iVar2;
  undefined2 uVar3;
  undefined2 unaff_DS;
  char cVar4;
  char cVar5;
  undefined1 local_4;
  
  iVar2 = (uint)param_1 * 0x22;
  local_4 = 0;
  uVar3 = FUN_0000_cf0b(0x14);
  cVar5 = '\x15';
  cVar1 = FUN_0000_cf0b(0x15,uVar3);
  cVar4 = '\x16';
  cVar1 = FUN_0000_cf0b(0x16,cVar5 + cVar1 * '\x02');
  if ((*(byte *)(iVar2 + 0x5c97) == (cVar4 + cVar1 * '\x04' & *(byte *)(iVar2 + 0x5c96))) &&
     (((*(byte *)(iVar2 + 0x5c98) & 0xf) == 2 ||
      (((*(byte *)(iVar2 + 0x5c98) & 0xf) == 3 && (*(byte *)(iVar2 + 0x5c96) != 0)))))) {
    local_4 = 1;
  }
  if ((*(byte *)(iVar2 + 0x5c98) & 0xf) == 2) {
    *(byte *)(iVar2 + 0x5c98) = *(byte *)(iVar2 + 0x5c98) & 0xf0;
  }
  return local_4;
}



/* FUN_0000_2e1f @ 0000:2e1f completed=true */

void FUN_0000_2e1f(void)

{
  byte *pbVar1;
  uint *puVar2;
  uint uVar3;
  char cVar4;
  undefined1 extraout_AH;
  undefined2 uVar5;
  uint uVar6;
  int iVar7;
  int iVar8;
  undefined2 unaff_DS;
  undefined4 uVar9;
  byte local_3;
  
  FUN_0000_300f();
  local_3 = 0;
  do {
    if ((*(byte *)((uint)local_3 * 0x22 + 0x5c98) & 0xf) != 3) {
      pbVar1 = (byte *)((uint)local_3 * 0x22 + 0x5c98);
      *pbVar1 = *pbVar1 & 0xf0;
    }
    uVar9 = FUN_0000_272b();
    iVar7 = (uint)local_3 * 4;
    *(undefined2 *)(iVar7 + 0x610c) = (int)((ulong)uVar9 >> 0x10);
    *(undefined2 *)(iVar7 + 0x610a) = (int)uVar9;
    *(undefined1 *)(local_3 + 0x6122) = 1;
    local_3 = local_3 + 1;
  } while (local_3 < 3);
  do {
    local_3 = 0;
    do {
      (*(code *)*(undefined2 *)0x90)();
      cVar4 = FUN_0000_2dac(CONCAT11(extraout_AH,local_3));
      if (cVar4 == '\0') {
        *(undefined1 *)(local_3 + 0x6122) = 1;
      }
      else if (*(char *)(local_3 + 0x6122) == '\0') {
        uVar9 = FUN_0000_272b();
        uVar6 = (uint)((ulong)uVar9 >> 0x10);
        uVar3 = *(uint *)((uint)local_3 * 4 + 0x6118);
        if ((uVar3 <= uVar6) &&
           ((uVar3 < uVar6 || (*(uint *)((uint)local_3 * 4 + 0x6116) < (uint)uVar9)))) {
          uVar9 = FUN_0000_272b();
          puVar2 = (uint *)((uint)local_3 * 0x22 + 0x5cb4);
          uVar3 = *puVar2;
          iVar7 = (uint)local_3 * 4;
          *(int *)(iVar7 + 0x610c) = (int)((ulong)uVar9 >> 0x10) + (uint)CARRY2((uint)uVar9,*puVar2)
          ;
          *(int *)(iVar7 + 0x610a) = (uint)uVar9 + uVar3;
          uVar9 = FUN_0000_272b();
          iVar7 = (uint)local_3 * 0x22;
          puVar2 = (uint *)(iVar7 + 0x5cb6);
          uVar3 = *puVar2;
          iVar8 = (uint)local_3 * 4;
          *(int *)(iVar8 + 0x6118) = (int)((ulong)uVar9 >> 0x10) + (uint)CARRY2((uint)uVar9,*puVar2)
          ;
          *(int *)(iVar8 + 0x6116) = (uint)uVar9 + uVar3;
          FUN_0000_7a65(0x608a,0xab3,iVar7 + 0x5c9b);
          uVar5 = CONCAT11((char)((uint)local_3 * 0x22 >> 8),
                           *(undefined1 *)((uint)local_3 * 0x22 + 0x5cb3));
LAB_0000_2fe1:
          FUN_0000_3054(0x608a,0x86c,uVar5);
        }
      }
      else {
        uVar9 = FUN_0000_272b();
        uVar6 = (uint)((ulong)uVar9 >> 0x10);
        uVar3 = *(uint *)((uint)local_3 * 4 + 0x610c);
        if ((uVar3 <= uVar6) &&
           ((uVar3 < uVar6 || (*(uint *)((uint)local_3 * 4 + 0x610a) < (uint)uVar9)))) {
          *(undefined1 *)(local_3 + 0x6122) = 0;
          uVar9 = FUN_0000_272b();
          iVar7 = (uint)local_3 * 0x22;
          puVar2 = (uint *)(iVar7 + 0x5cb4);
          uVar3 = *puVar2;
          iVar8 = (uint)local_3 * 4;
          *(int *)(iVar8 + 0x610c) = (int)((ulong)uVar9 >> 0x10) + (uint)CARRY2((uint)uVar9,*puVar2)
          ;
          *(int *)(iVar8 + 0x610a) = (uint)uVar9 + uVar3;
          if (*(int *)(iVar7 + 0x5cb6) == 0) {
            *(undefined2 *)((uint)local_3 * 4 + 0x6118) = 0xffff;
            *(undefined2 *)((uint)local_3 * 4 + 0x6116) = 0xffff;
          }
          else {
            uVar9 = FUN_0000_272b();
            puVar2 = (uint *)((uint)local_3 * 0x22 + 0x5cb6);
            uVar3 = *puVar2;
            iVar7 = (uint)local_3 * 4;
            *(int *)(iVar7 + 0x6118) =
                 (int)((ulong)uVar9 >> 0x10) + (uint)CARRY2((uint)uVar9,*puVar2);
            *(int *)(iVar7 + 0x6116) = (uint)uVar9 + uVar3;
          }
          FUN_0000_7a65(0x608a,0xaa2,(uint)local_3 * 0x22 + 0x5c9b);
          uVar5 = CONCAT11((char)((uint)local_3 * 0x22 >> 8),
                           *(undefined1 *)((uint)local_3 * 0x22 + 0x5cb3));
          goto LAB_0000_2fe1;
        }
      }
      local_3 = local_3 + 1;
    } while (local_3 < 3);
  } while( true );
}



/* FUN_0000_300f @ 0000:300f completed=true */

void __cdecl16near FUN_0000_300f(void)

{
  int iVar1;
  undefined2 uVar2;
  undefined2 unaff_DS;
  
  uVar2 = FUN_0000_9537();
  *(undefined2 *)0x6126 = uVar2;
  iVar1 = *(int *)0x6126;
  *(undefined2 *)(iVar1 + 0x24) = (code *)FUN_0000_563a;
  *(undefined2 *)(iVar1 + 0x22) = (code *)FUN_0000_98b2;
  uVar2 = FUN_0000_76d9(0x5df8,0x100);
  *(undefined2 *)(*(int *)0x6126 + 0xc) = uVar2;
  uVar2 = FUN_0000_76d9(0x5f00,0x100);
  iVar1 = *(int *)0x6126;
  *(undefined2 *)(iVar1 + 0xe) = uVar2;
  *(undefined2 *)(iVar1 + 0x12) = *(undefined2 *)0x23a;
  return;
}



/* FUN_0000_3054 @ 0000:3054 completed=true */

void __cdecl16near FUN_0000_3054(undefined2 param_1,undefined2 param_2,undefined1 param_3)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_DS;
  
  FUN_0000_a96c(*(int *)0x6126 + 0x14,0x5c00,4);
  FUN_0000_95a8(1,*(undefined2 *)0x6126,0);
  *(undefined2 *)(*(int *)0x6126 + 0x10) = 4;
  iVar2 = *(int *)0x8c;
  do {
    if (1999 < (uint)(*(int *)0x8c - iVar2)) break;
    (*(code *)*(undefined2 *)0x90)();
  } while (*(int *)(*(int *)0x6126 + 2) != 2);
  if (*(int *)(*(int *)0x6126 + 2) == 2) {
    FUN_0000_3270(*(int *)0x6126);
    FUN_0000_7a65((code *)FUN_0000_600a,0xac7,0x5c66);
    iVar2 = 0;
    do {
      if (2 < iVar2) break;
      iVar1 = FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,1);
      iVar2 = iVar2 + 1;
    } while (iVar1 != 0xfa);
    FUN_0000_7a65((code *)FUN_0000_600a,0xacf,0x5c66,0x5c7e);
    FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,1);
    FUN_0000_7a65((code *)FUN_0000_600a,0xae2,0x5c04);
    FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,1);
    if (*"" != '\0') {
      FUN_0000_7a65((code *)FUN_0000_600a,0xae2,0x5c35);
      FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,1);
    }
    FUN_0000_321e(*(undefined2 *)0x6126,0xaf0,1);
    FUN_0000_7a65((code *)FUN_0000_600a,0xaf5,0x5c66,0x5c7e);
    FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,0);
    FUN_0000_7a65((code *)FUN_0000_600a,0xb01,0x5c04);
    FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,0);
    if (*"" != '\0') {
      FUN_0000_7a65((code *)FUN_0000_600a,0xb01,0x5c35);
      FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,0);
    }
    FUN_0000_7a65((code *)FUN_0000_600a,0xb08,param_1);
    FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,0);
    FUN_0000_7a65((code *)FUN_0000_600a,0xb14,param_3);
    FUN_0000_321e(*(undefined2 *)0x6126,(code *)FUN_0000_600a,0);
    FUN_0000_321e(*(undefined2 *)0x6126,0xb23,1);
    FUN_0000_321e(*(undefined2 *)0x6126,0xb25,1);
    FUN_0000_a78a(*(undefined2 *)0x6126);
  }
  return;
}



/* FUN_0000_321e @ 0000:321e completed=true */

undefined2 __cdecl16near FUN_0000_321e(int param_1,undefined2 param_2,int param_3)

{
  undefined2 uVar1;
  undefined2 unaff_DS;
  
  uVar1 = FUN_0000_b418(param_2);
  FUN_0000_7589(6,param_1 + 0xe,param_2,uVar1);
  FUN_0000_7589(5,param_1 + 0xe,0xd);
  FUN_0000_7589(5,param_1 + 0xe,10);
  (*(code *)*(undefined2 *)0x90)();
  if (param_3 == 0) {
    uVar1 = 0;
  }
  else {
    uVar1 = FUN_0000_3270(param_1);
  }
  return uVar1;
}



/* FUN_0000_3270 @ 0000:3270 completed=true */

int __cdecl16near FUN_0000_3270(int param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  undefined2 unaff_DS;
  char local_5;
  int local_4;
  
  iVar2 = 0;
  iVar3 = 0;
  do {
    while (local_4 = FUN_0000_7589(0,param_1 + 0xc), local_4 == 0) {
      (*(code *)*(undefined2 *)0x90)();
    }
    while (iVar1 = local_4 + -1, local_4 != 0) {
      local_5 = FUN_0000_7589(1,param_1 + 0xc);
      local_4 = iVar1;
      if (iVar2 < 3) {
        iVar2 = iVar2 + 1;
        iVar3 = (int)local_5 + iVar3 * 10 + -0x30;
      }
    }
  } while (local_5 != '\n');
  return iVar3;
}



/* FUN_0000_32d4 @ 0000:32d4 completed=true */

void FUN_0000_32d4(void)

{
  undefined1 uVar1;
  int iVar2;
  undefined2 uVar3;
  int iVar4;
  undefined2 unaff_DS;
  
  FUN_0000_5f7e(0x77f0,0x19c);
  iVar2 = FUN_0000_9537();
  *(undefined2 *)(iVar2 + 0x24) = (code *)FUN_0000_563a;
  *(undefined2 *)(iVar2 + 0x22) = (code *)FUN_0000_98b2;
  do {
    uVar3 = FUN_0000_76d9(0x6132,0x10);
    *(undefined2 *)(iVar2 + 0xc) = uVar3;
    uVar3 = FUN_0000_76d9(0x614a,0x10);
    *(undefined2 *)(iVar2 + 0xe) = uVar3;
    FUN_0000_95a8(0,iVar2,0x77f0);
    while (*(int *)(iVar2 + 2) != 2) {
      (*(code *)*(undefined2 *)0x90)();
    }
    while (*(int *)(iVar2 + 2) == 2) {
      (*(code *)*(undefined2 *)0x90)();
      iVar4 = FUN_0000_7589(0,iVar2 + 0xc);
      if (8 < iVar4) {
        iVar4 = 0;
        do {
          uVar1 = FUN_0000_7589(1,iVar2 + 0xc);
          *(undefined1 *)(iVar4 + 0x6128) = uVar1;
          iVar4 = iVar4 + 1;
        } while (iVar4 < 9);
        uVar3 = FUN_0000_339d(0x6128);
        FUN_0000_7589(6,iVar2 + 0xe,0x6128,uVar3);
      }
    }
  } while( true );
}



/* FUN_0000_337d @ 0000:337d completed=true */

void __cdecl16near
FUN_0000_337d(undefined2 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             undefined2 param_5,undefined2 param_6,undefined2 param_7)

{
  undefined2 uVar1;
  
  uVar1 = FUN_0000_339d(param_1);
  FUN_0000_abe9(param_4,param_7,param_6,param_1,uVar1);
  return;
}



/* FUN_0000_339d @ 0000:339d completed=true */

undefined2 __cdecl16near FUN_0000_339d(char *param_1)

{
  sbyte sVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;
  uint unaff_DI;
  undefined2 unaff_DS;
  uint local_c;
  int local_4;
  
  switch((int)*param_1 & 0xf7) {
  case 0x10:
    if (*param_1 == '\x18') goto switchD_0000_33b8_default;
    unaff_DI = 0x80;
    break;
  case 0x11:
    unaff_DI = 0x8000;
    break;
  case 0x12:
    unaff_DI = 0x40;
    break;
  case 0x13:
    break;
  default:
switchD_0000_33b8_default:
    *param_1 = -1;
    return 1;
  }
  local_c = 0;
  for (local_4 = 0x20; local_4 < 0x23; local_4 = local_4 + 1) {
    iVar2 = 1 << ((char)local_4 - 0x20U & 0xf);
    if (local_4 + -0x20 < 0x10) {
      sVar1 = 0;
    }
    else {
      sVar1 = 0x10;
    }
    uVar3 = iVar2 << sVar1;
    uVar4 = (int)uVar3 >> 0xf;
    if (((int)*param_1 & 0xf7U) == 0x13) {
      if ((*param_1 == '\x1b') &&
         ((*(uint *)(param_1 + 1) & uVar3) != 0 || (*(uint *)(param_1 + 3) & uVar4) != 0)) {
        iVar2 = local_4;
        if ((*(uint *)(param_1 + 5) & uVar3) == 0 && (*(uint *)(param_1 + 7) & uVar4) == 0) {
          FUN_0000_ce0c(local_4);
        }
        else {
          FUN_0000_ce1a(local_4);
        }
      }
      uVar4 = FUN_0000_cf0b(iVar2,local_4);
    }
    else {
      if (('\x13' < *param_1) &&
         ((*(uint *)(param_1 + 1) & uVar3) != 0 || (*(uint *)(param_1 + 3) & uVar4) != 0)) {
        if ((*(uint *)(param_1 + 5) & uVar3) == 0 && (*(uint *)(param_1 + 7) & uVar4) == 0) {
          uVar4 = *(uint *)(local_4 * 2 + 0x1586) & ~unaff_DI;
        }
        else {
          uVar4 = *(uint *)(local_4 * 2 + 0x1586) | unaff_DI;
        }
        *(uint *)(local_4 * 2 + 0x1586) = uVar4;
      }
      uVar4 = *(uint *)(local_4 * 2 + 0x1586) & unaff_DI;
    }
    if (uVar4 == 0) {
      uVar3 = 0;
    }
    local_c = local_c | uVar3;
  }
  *(uint *)(param_1 + 1) = local_c;
  if (('\x17' < *param_1) && (*param_1 < '\x1b')) {
    FUN_0000_cd1e();
  }
  return 5;
}



/* FUN_0000_34f9 @ 0000:34f9 completed=true */

void __cdecl16near FUN_0000_34f9(void)

{
  FUN_0000_bbe9();
  return;
}



/* FUN_0000_3509 @ 0000:3509 completed=true */

void __cdecl16near FUN_0000_3509(int param_1)

{
  byte bVar1;
  undefined2 unaff_DS;
  undefined1 local_3;
  
  bVar1 = 0;
  do {
    switch(bVar1) {
    case 0:
      local_3 = 0x1f;
      break;
    case 1:
      local_3 = 0xef;
      break;
    case 2:
      local_3 = 0xff;
      break;
    case 3:
    case 4:
    case 5:
      local_3 = 0;
    }
    *(undefined1 *)((uint)bVar1 + param_1) = local_3;
    bVar1 = bVar1 + 1;
  } while (bVar1 < 6);
  return;
}



/* FUN_0000_355a @ 0000:355a completed=true */

void __cdecl16near FUN_0000_355a(undefined2 param_1)

{
  undefined1 local_10 [12];
  int local_4;
  
  FUN_0000_d33e(0x101,4,0xc,local_10);
  local_4 = FUN_0000_34f9(6,local_10);
  if (local_4 == 0) {
    FUN_0000_a96c(param_1,local_10,6);
  }
  return;
}



/* FUN_0000_3594 @ 0000:3594 completed=true */

void __cdecl16near FUN_0000_3594(byte *param_1)

{
  undefined2 unaff_DS;
  
  if ((*(byte *)0x397e & 1) == 0) {
    *param_1 = *param_1 & 0xfe;
  }
  return;
}



/* FUN_0000_3689 @ 0000:3689 completed=true */

undefined4 __cdecl16near FUN_0000_3689(undefined2 param_1,int *param_2)

{
  undefined2 *puVar1;
  undefined2 *puVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  undefined2 *puVar7;
  undefined2 unaff_CS;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x6448 = param_1;
  *(undefined2 *)0x644a = param_2;
  *(int *)0x1750 = param_2[4];
  *(int *)0x1758 = param_2[5];
  puVar7 = (undefined2 *)0x1760;
  iVar4 = 0xb;
  iVar5 = *(int *)0xcb6;
  do {
    puVar2 = puVar7 + 1;
    out(iVar5 + 0x12,*puVar7);
    puVar7 = puVar7 + 2;
    out(iVar5 + 0x10,*puVar2);
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  puVar7 = (undefined2 *)
           *(undefined2 *)
            ((int)(undefined **)&switchD_0000:6935::switchdataD_0000_6b69 + *param_2 * 2 + 1);
  iVar4 = 3;
  iVar6 = 0xc;
  do {
    out(iVar5 + 0x12,iVar6);
    puVar1 = puVar7;
    puVar7 = puVar7 + 1;
    out(iVar5 + 0x10,*puVar1);
    iVar6 = iVar6 + 1;
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  *(undefined2 *)0x30 = (undefined1 *)&LAB_0000_3714;
  *(undefined2 *)0x32 = unaff_CS;
  uVar3 = in(0xff28);
  out(0xff28,uVar3 & 0xffef);
  out(0xff38,0x17);
  out(*(int *)0xcb6 + 0x12,0);
  iVar5 = *(int *)0xcb6 + 0x10;
  out(iVar5,0x42);
  return CONCAT22(iVar5,1);
}



/* FUN_0000_391e @ 0000:391e completed=true */

void __cdecl16near FUN_0000_391e(int param_1)

{
  undefined2 uVar1;
  undefined2 unaff_DS;
  
  uVar1 = *(undefined2 *)0x7a1c;
  *(undefined2 *)0x644e = *(undefined2 *)0x4;
  *(undefined1 *)0x6451 = 0;
  FUN_0000_5f7e(0x45,(code *)FUN_0000_d5ee);
  FUN_0000_5f7e(0x77fe,0x25f);
  *(undefined2 *)0x6458 = 0xf000;
  *(undefined2 *)0x645a = *(undefined2 *)0x2;
  FUN_0000_a96c(0x645c,0x1c,4);
  *(undefined2 *)0x6460 = *(undefined2 *)0x4;
  *(undefined2 *)0x6462 = *(undefined2 *)0xe;
  if (param_1 != 0) {
    FUN_0000_abe9(0,0x77fe,0x77fe,0x6456,0xe);
  }
  return;
}



/* FUN_0000_399c @ 0000:399c completed=true */

void __cdecl16near FUN_0000_399c(void)

{
  FUN_0000_bbe9();
  return;
}



/* FUN_0000_39ac @ 0000:39ac completed=true */

undefined2 __cdecl16near FUN_0000_39ac(char *param_1,int param_2)

{
  bool bVar1;
  bool bVar2;
  undefined2 uVar3;
  int iVar4;
  int iVar5;
  uint *puVar6;
  int iVar7;
  undefined2 unaff_DS;
  undefined2 local_4;
  
  iVar4 = param_2;
  local_4 = 0;
  iVar7 = -1;
  bVar1 = false;
  bVar2 = false;
  if ((*param_1 == '\0') &&
     (((param_1[1] == '\0' || (param_1[1] == '\x01')) && (param_1[2] == '\0')))) {
    param_2 = param_2 + -4;
    if (param_1[3] == '\x03') {
      bVar1 = true;
      bVar2 = false;
      iVar7 = 2;
    }
    else if (param_1[3] == -0x5f) {
      bVar1 = true;
      bVar2 = true;
      iVar7 = 0x7e;
    }
    else {
      iVar5 = 9;
      puVar6 = (uint *)&DAT_0000_3ad4;
      do {
        if (*puVar6 == ((byte)param_1[3] & 0xf0)) {
                    /* WARNING: Could not recover jumptable at 0x00003a2a. Too many branches */
                    /* WARNING: Treating indirect jump as call */
          uVar3 = (*(code *)puVar6[9])();
          return uVar3;
        }
        puVar6 = puVar6 + 1;
        iVar5 = iVar5 + -1;
      } while (iVar5 != 0);
    }
  }
  if ((bVar2) && ((*(byte *)0x391a & 4) != 0)) {
    local_4 = 0;
  }
  else if ((iVar7 != -1) &&
          ((param_2 == iVar7 ||
           (((bVar1 && (iVar7 + 2 == param_2)) && (iVar4 = FUN_0000_399c(param_1,iVar4), iVar4 == 0)
            ))))) {
    local_4 = 1;
  }
  return local_4;
}



/* FUN_0000_3af8 @ 0000:3af8 completed=true */

void __cdecl16near
FUN_0000_3af8(byte param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4)

{
  if ((param_1 & 2) == 0) {
    if ((param_1 & 4) == 0) {
      FUN_0000_7589(6,param_2,0x65b2,param_4);
    }
    else {
      FUN_0000_abe9(param_2,0x77fe,param_3,0x65b2,param_4);
    }
  }
  else {
    FUN_0000_abda(param_2,0x77fe,param_3,0x65b2,param_4);
  }
  if ((param_1 & 1) != 0) {
    FUN_0000_7b55(0xfa);
    FUN_0000_13e6();
  }
  return;
}



/* FUN_0000_3b53 @ 0000:3b53 completed=true */

void __cdecl16near
FUN_0000_3b53(int param_1,undefined2 param_2,undefined2 param_3,int param_4,int param_5)

{
  byte bVar1;
  undefined2 uVar2;
  int iVar3;
  uint *puVar4;
  undefined2 unaff_DS;
  
  if ((((param_4 != 0) && (*(int *)((undefined *)&DAT_0000_ffe8 + param_4) == -1)) &&
      (*(int *)((undefined *)&DAT_0000_ffe6 + param_4) == -1)) &&
     (*(int *)((undefined *)&DAT_0000_ffea + param_4) == -1)) {
    *(undefined1 *)(param_5 + 10) = 0x20;
  }
  bVar1 = *(byte *)(param_1 + 3);
  iVar3 = 4;
  puVar4 = (uint *)&DAT_0000_3fa8;
  do {
    if (*puVar4 == (bVar1 & 0xf0)) {
                    /* WARNING: Could not recover jumptable at 0x00003bef. Too many branches */
                    /* WARNING: Treating indirect jump as call */
      (*(code *)puVar4[4])();
      return;
    }
    puVar4 = puVar4 + 1;
    iVar3 = iVar3 + -1;
  } while (iVar3 != 0);
  if ((bVar1 & 0xf) == 0) {
    uVar2 = 0x78;
  }
  else {
    uVar2 = 0x7e;
  }
  iVar3 = FUN_0000_39ac(param_1,param_2,uVar2);
  if (iVar3 != 0) {
    *(undefined2 *)0x65b4 = 0;
    *(undefined2 *)0x65b2 = 0;
    if ((uint)(bVar1 & 0xf) < *(uint *)0x7a12) {
      iVar3 = 9;
      puVar4 = (uint *)&DAT_0000_3f84;
      do {
        if (*puVar4 == (bVar1 & 0xf0)) {
                    /* WARNING: Could not recover jumptable at 0x00003c76. Too many branches */
                    /* WARNING: Treating indirect jump as call */
          (*(code *)puVar4[9])();
          return;
        }
        puVar4 = puVar4 + 1;
        iVar3 = iVar3 + -1;
      } while (iVar3 != 0);
    }
    iVar3 = 0xc;
    puVar4 = (uint *)&DAT_0000_3f54;
    do {
      if (*puVar4 == (uint)bVar1) {
                    /* WARNING: Could not recover jumptable at 0x00003d89. Too many branches */
                    /* WARNING: Treating indirect jump as call */
        (*(code *)puVar4[0xc])();
        return;
      }
      puVar4 = puVar4 + 1;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if (*(int *)0xcc0 != 0) {
      (*(code *)*(undefined2 *)0xcc0)(&param_1);
    }
  }
  return;
}



/* FUN_0000_3fb8 @ 0000:3fb8 completed=true */

undefined2 __cdecl16near FUN_0000_3fb8(undefined2 param_1,undefined2 param_2,undefined2 param_3)

{
  char cVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;
  undefined2 unaff_DS;
  
  cVar1 = *"\a";
  uVar3 = 0;
  while( true ) {
    iVar2 = FUN_0000_abe9(param_1,0x77fe,0x77fe,param_2,param_3);
    if (iVar2 != 0) {
      return 1;
    }
    uVar4 = 0;
    while ((uVar4 < 0x14 && (*"\a" != (char)(cVar1 + '\x01')))) {
      FUN_0000_7b55(0x32);
      uVar4 = uVar4 + 1;
    }
    if (*"\a" == (char)(cVar1 + '\x01')) break;
    uVar3 = uVar3 + 1;
    if (2 < uVar3) {
      return 1;
    }
  }
  return 0;
}



