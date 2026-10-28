/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: xpico_7003.rom
 * SHA-256: 42fc267a918e8a7232c76fcd8c7e7d0cf7f20605e907cb32fc84d6303507b5b0
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x5c6a;
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x5b9b;
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = (char *)s_Copyright_2004__0000_114d;
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x4bc2;
  return;
}



/* FUN_0000_00d9 @ 0000:00d9 completed=true */

/* WARNING: Unable to track spacebase fully for stack */

void FUN_0000_00d9(void)

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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x5447;
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x393b;
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x3ab0;
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x4ef5;
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x3964;
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
  
  *(uint *)0x5abe =
       (uint)(in_NT & 1) * 0x4000 | (uint)(in_OF & 1) * 0x800 | (uint)(in_IF & 1) * 0x200 |
       (uint)(in_TF & 1) * 0x100 | (uint)(in_SF & 1) * 0x80 | (uint)(in_ZF & 1) * 0x40 |
       (uint)(in_AF & 1) * 0x10 | (uint)(in_PF & 1) * 4 | (uint)(in_CF & 1);
  *(undefined2 *)0x5a7a = in_stack_00000000;
  LOCK();
  iVar1 = *(int *)0xa6e;
  *(int *)0xa6e = (int)&stack0x0002;
  UNLOCK();
  *(undefined2 *)(iVar1 + -2) = unaff_CS;
  *(undefined2 *)(iVar1 + -4) = *(undefined2 *)0x5a7a;
  LOCK();
  iVar2 = *(int *)0xa6e;
  *(int *)0xa6e = iVar1 + -4;
  UNLOCK();
  *(undefined2 *)(iVar2 + -2) = 0x20;
  *(undefined2 *)(iVar2 + -4) = *(undefined2 *)0x5abe;
  *(undefined2 *)((undefined *)&DAT_0000_fffa + iVar2) = 0x200;
  *(undefined2 *)(iVar2 + -8) = 0x259d;
  return;
}



/* FUN_0000_1267 @ 0000:1267 completed=true */

uint __cdecl16near FUN_0000_1267(int param_1)

{
  uint uVar1;
  undefined2 unaff_DS;
  
  uVar1 = *(int *)0x8830 + 1U & 0xfffe;
  if (*(uint *)0xc66 < uVar1 + param_1) {
    uVar1 = 0;
  }
  else {
    *(uint *)0x8830 = uVar1 + param_1;
  }
  return uVar1;
}



/* FUN_0000_1287 @ 0000:1287 completed=true */

void FUN_0000_1287(void)

{
  do {
                    /* WARNING: Do nothing block with infinite loop */
  } while( true );
}



/* FUN_0000_128c @ 0000:128c completed=true */

void FUN_0000_128c(undefined2 param_1)

{
  code *in_stack_00000000;
  
  in(param_1);
                    /* WARNING: Could not recover jumptable at 0x00001292. Too many branches */
                    /* WARNING: Treating indirect jump as call */
  (*in_stack_00000000)();
  return;
}



/* FUN_0000_1294 @ 0000:1294 completed=true */

undefined4 __cdecl16near FUN_0000_1294(undefined2 param_1,undefined2 param_2)

{
  out(param_1,param_2);
  return CONCAT22(param_1,param_2);
}



/* FUN_0000_12a0 @ 0000:12a0 completed=true */

void __cdecl16near FUN_0000_12a0(void)

{
  FUN_0000_6b87(0x3b32);
  FUN_0000_a2c7(0x3b32,0,0x2c0);
  FUN_0000_6b04(0x2eb,0,0x2c0,0x3b32,(code *)FUN_0000_45d4);
  return;
}



/* FUN_0000_12cb @ 0000:12cb completed=true */

void __cdecl16near FUN_0000_12cb(void)

{
  byte bVar1;
  undefined2 uVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  undefined2 unaff_DS;
  code *pcVar7;
  
  if (*(int *)0x7288 != 0) {
    if ((*(byte *)0x370a & 0x40) != 0) {
      FUN_0000_4ffe(0xa1,0);
    }
    if ((*(byte *)0x370a & 2) != 0) {
      FUN_0000_4ffe(0x45,0);
    }
    if ((*(byte *)0x370a & 0x10) == 0) {
      if (*(char *)0xcfb == '\a') {
        if (*(int *)0x57fc == 0) {
          uVar2 = 0x77fe;
        }
        else {
          uVar2 = *(undefined2 *)0x57fc;
        }
        FUN_0000_b1ea(0x2f6,uVar2);
        FUN_0000_4ffe(0x77fe,0);
        FUN_0000_4fdb(uVar2,(code *)FUN_0000_2d67);
      }
      else {
        pcVar7 = (code *)FUN_0000_4749;
        uVar2 = FUN_0000_1267(0x140,(code *)FUN_0000_4749);
        FUN_0000_6b04(0x2f1,0,0x140,uVar2,pcVar7);
      }
    }
    else {
      FUN_0000_4ffe(0x77fe,0);
    }
    if ((*(byte *)0x370a & 8) != 0) {
      *(undefined2 *)0x45a = 0x8b;
      *(undefined2 *)0x45c = 0x10;
    }
    FUN_0000_0064();
    if (((*(byte *)0x370a & 4) != 0) && ((*(byte *)0x37a4 & 1) != 0)) {
      if (*(char *)0x373b == '\0') {
        *(undefined1 *)0x373b = 0x10;
      }
      FUN_0000_998a(0x3a8d,(undefined *)&DAT_0000_370b,0x10);
      FUN_0000_998a(0x3a9d,0x373c,0x10);
      FUN_0000_003d(0x399a,0x3a8d,(uint)*(byte *)0x373b << 3);
    }
  }
  if ((*(byte *)0x370a & 1) == 0) {
    FUN_0000_6b04(0x2eb,0,0x2c0,0x3b32,(code *)FUN_0000_45d4);
  }
  if ((*(byte *)0x370a & 0x20) == 0) {
    if (CONCAT11(*(undefined1 *)0x581b,*(undefined1 *)0x581a) == 0) {
      uVar2 = 0x50;
    }
    else {
      uVar2 = CONCAT11(*(undefined1 *)0x581b,*(undefined1 *)0x581a);
    }
    FUN_0000_b1ea(0x2f9,uVar2);
    pcVar7 = (code *)FUN_0000_429b;
    uVar2 = FUN_0000_1267(0x1c0,(code *)FUN_0000_429b);
    FUN_0000_6b04(0x2fc,0,0x1c0,uVar2,pcVar7);
    if (*(char *)0xcfb != '\a') {
      pcVar7 = (code *)FUN_0000_429b;
      uVar2 = FUN_0000_1267(0x1c0,(code *)FUN_0000_429b);
      FUN_0000_6b04(0x301,0,0x1c0,uVar2,pcVar7);
    }
    if ((*(byte *)0x373a & 0x80) == 0) {
      FUN_0000_00d9(*(undefined1 *)0x7288);
      FUN_0000_425d(0x306,0x127,0x30a);
      FUN_0000_425d(0x306,0x14e,0x31e);
      FUN_0000_425d(0x332,0x100,0x337);
      FUN_0000_425d(0x306,0x127,0x311);
      FUN_0000_425d(0x306,0x14e,0x325);
      FUN_0000_425d(0x332,0x100,0x33e);
    }
  }
  if ((*(char *)0xcfb != '\a') && ((*(byte *)0x373a & 2) == 0)) {
    pcVar7 = (code *)FUN_0000_2465;
    uVar2 = FUN_0000_1267(0x140,(code *)FUN_0000_2465);
    FUN_0000_6b04(0x348,0,0x140,uVar2,pcVar7);
  }
  (*(code *)*(undefined2 *)0x90)();
  FUN_0000_b41f();
  uVar3 = FUN_0000_9e08();
  if (uVar3 < 2) {
    *(undefined1 *)0x15c4 = 1;
  }
  else {
    *(undefined1 *)0x15c4 = 2;
  }
  *(undefined2 *)0x6998 = 0;
  for (iVar6 = 0; iVar6 < (int)(uint)*(byte *)0x15c4; iVar6 = iVar6 + 1) {
    *(undefined1 *)(iVar6 * 0x105a + 0x15d0) = ((undefined *)&DAT_0000_36a0)[iVar6 * 0x30];
    if ((*(byte *)0x37a4 & 8) == 0) {
      *(byte *)*(undefined2 *)0x3684 = *(byte *)*(undefined2 *)0x3684 & 0xfc;
    }
    iVar4 = iVar6 * 0x30;
    *(undefined1 *)(iVar6 * 0x105a + 0x15d1) = *(undefined1 *)(iVar4 + 0x36a1);
    if ((((undefined *)&DAT_0000_36a0)[iVar4] & 3) == 0) {
      bVar1 = 0xff;
    }
    else {
      bVar1 = 0xfd;
    }
    iVar5 = iVar6 * 0x105a;
    *(byte *)(iVar5 + 0x15ea) = ((undefined *)&DAT_0000_36a2)[iVar4] & bVar1;
    *(undefined1 *)(iVar5 + 0x15eb) = 0;
    FUN_0000_998a(iVar5 + 0x15d2,iVar6 * 0x30 + 0x36a8,4);
    FUN_0000_998a(iVar6 * 0x105a + 0x15d6,iVar6 * 0x30 + 0x36a4,4);
    iVar4 = iVar6 * 0x30;
    iVar5 = iVar6 * 0x105a;
    *(undefined1 *)(iVar5 + 0x15dc) = ((undefined *)&DAT_0000_36ac)[iVar4];
    *(undefined1 *)(iVar5 + 0x15de) = ((undefined *)&DAT_0000_36ad)[iVar4];
    *(int *)(iVar5 + 0x15ee) =
         (uint)*(byte *)(iVar4 + 0x36ae) * 0x3c + (uint)*(byte *)(iVar4 + 13999);
    FUN_0000_998a(iVar5 + 0x15df,(undefined *)&DAT_0000_36b0 + iVar4,8);
    *(undefined2 *)(iVar6 * 2 + 0x6994) = 0xffff;
  }
  FUN_0000_6c1e();
  if ((*(int *)0x7288 == 0) || ((*(byte *)0x373a & 1) != 0)) {
    FUN_0000_5d4f();
  }
  if (*(char *)0xcfb == '\a') {
    do {
      (*(code *)*(undefined2 *)0x90)();
    } while( true );
  }
  *(undefined2 *)0x3684 = 0x15d0;
  iVar6 = *(int *)0x3686;
  *(undefined2 *)(iVar6 + 6) = 0;
  *(undefined2 *)(iVar6 + 4) = 0x15d0;
  if ((*(char *)0x36d1 != -1) && (1 < *(byte *)0x15c4)) {
    FUN_0000_6b04(0x34d,1,0x1f0,0x37aa,0x8b);
  }
  FUN_0000_008b();
  return;
}



/* FUN_0000_165e @ 0000:165e completed=true */

void __cdecl16near FUN_0000_165e(void)

{
  char cVar1;
  undefined2 uVar2;
  int iVar3;
  int iVar4;
  int unaff_DI;
  undefined2 unaff_DS;
  undefined1 local_e [2];
  char *local_c [4];
  int local_4;
  
  local_c[0] = (char *)0x24a;
  local_c[1] = local_e;
  local_c[2] = (char *)0x6366;
  uVar2 = FUN_0000_a0f2();
  *(undefined2 *)0x7620 = uVar2;
  FUN_0000_26a6(0x3b2c);
  FUN_0000_2760(0x379e);
  FUN_0000_998a(0x37a4,0x3b2c,6);
  FUN_0000_27a8(0x37a4);
  FUN_0000_a310(0x1120,0x351);
  if (*(int *)0x7620 == 0x439) {
    FUN_0000_a310(0x1120,0x351);
  }
  if (*(int *)0x7620 == 0x421) {
    FUN_0000_a310(0x1120,0x357);
  }
  *(undefined2 *)0x5ccc = *(undefined2 *)0x361;
  *(undefined1 *)0x3aad = *(undefined1 *)0x57f9;
  if (*(int *)0x7288 != 0) {
    if (*(int *)0x57fa == 0) {
      uVar2 = 0x578;
    }
    else {
      uVar2 = *(undefined2 *)0x57fa;
    }
    *(undefined2 *)0x6b70 = uVar2;
    if (*(int *)0x5822 == 0) {
      uVar2 = 500;
    }
    else {
      uVar2 = *(undefined2 *)0x5822;
    }
    *(undefined2 *)0xd80 = uVar2;
    *(undefined2 *)0xcc0 = *(undefined2 *)0x5810;
    if (600 < *(uint *)0xcc0) {
      *(undefined2 *)0x5810 = 600;
      *(undefined2 *)0xcc0 = 600;
      FUN_0000_9ca9(0x7e,0x180,0x57ac);
    }
  }
  if (*(byte *)0x5804 < 0xe0) {
    FUN_0000_998a(0xcb6,0x5804,4);
  }
  if (*(int *)0x635f != 0x600) {
    FUN_0000_998a(0x6366,0x3700,8);
    FUN_0000_998a(0x636e,0x5812,8);
  }
  local_e[0] = *(undefined1 *)0x2b5;
  iVar3 = FUN_0000_9d30(0x7e,0x200,0x3aae);
  if (iVar3 == 0) {
    if ((*(char *)0x3ace != '\0') && (*(byte *)0x3ace < 0x5e)) {
      iVar3 = FUN_0000_badc(0x3acf,0);
      local_c[3] = (char *)(iVar3 + 1);
      unaff_DI = 0;
      do {
        local_4 = FUN_0000_ac70(local_c[3]);
        if ((int)(uint)*(byte *)0x3ace < local_4) break;
        if (*local_c[3] != -1) {
          FUN_0000_a310(local_c[unaff_DI],local_c[3]);
        }
        local_c[3] = local_c[3] + local_4 + 1;
        unaff_DI = unaff_DI + 1;
      } while (unaff_DI < 3);
      *(undefined1 *)0x2b5 = local_e[0];
    }
  }
  else {
    FUN_0000_a2c7(0x3aae,0,0x7e);
    FUN_0000_9ca9(0x7e,0x200,0x3aae);
  }
  if ((*(byte *)0x375a & 8) != 0) {
    cVar1 = FUN_0000_b3e0(0xff);
    if (cVar1 != '\0') {
      cVar1 = FUN_0000_b3e0(0);
      if (cVar1 != '\0') {
        iVar3 = 0;
        do {
          *(undefined1 *)(iVar3 + 0x6359) = *(undefined1 *)(iVar3 + 0x3ab2);
          iVar3 = iVar3 + 1;
        } while (iVar3 < 6);
      }
    }
  }
  iVar3 = FUN_0000_9d30(0x7e,0x380,0x72a3);
  if (iVar3 != 0) {
    FUN_0000_a179();
    FUN_0000_9ca9(0x7e,0x380,0x72a3);
  }
  FUN_0000_a19c();
  FUN_0000_bb13();
  iVar4 = 0;
  uVar2 = 0x184b;
  iVar3 = FUN_0000_bd00(0x17);
  if (iVar3 == 0) {
    uVar2 = 0x19;
    iVar3 = FUN_0000_bd00(0x19);
    if (iVar3 != 0) {
      iVar4 = 1;
      unaff_DI = 0x19;
    }
  }
  else {
    iVar4 = 2;
    unaff_DI = 0x17;
  }
  if (iVar4 != 0) {
    FUN_0000_00b2(0,iVar4,uVar2);
    FUN_0000_998a((undefined *)&DAT_0000_3690,0x582a,0xf8);
    FUN_0000_0175();
    while( true ) {
      iVar3 = FUN_0000_bd00(unaff_DI);
      if (iVar3 == 0) break;
      (*(code *)*(undefined2 *)0x90)();
    }
    uVar2 = 0x1897;
    FUN_0000_1287();
  }
  *(undefined1 *)0xcfc = 1;
  *(undefined1 *)0xcfb = 1;
  *(byte *)0x7622 = *(byte *)0x5820 & 0x40;
  FUN_0000_a310(0x26a,0x24a,uVar2);
  FUN_0000_ac34(0x26a,0x364);
  return;
}



/* FUN_0000_18c5 @ 0000:18c5 completed=true */

void __cdecl16near FUN_0000_18c5(void)

{
  return;
}



/* FUN_0000_18ca @ 0000:18ca completed=true */

void __cdecl16near FUN_0000_18ca(void)

{
  return;
}



/* FUN_0000_18cf @ 0000:18cf completed=true */

void __cdecl16near FUN_0000_18cf(void)

{
  return;
}



/* FUN_0000_242b @ 0000:242b completed=true */

void __cdecl16near FUN_0000_242b(void)

{
  return;
}



/* FUN_0000_2430 @ 0000:2430 completed=true */

undefined2 __cdecl16near FUN_0000_2430(undefined2 param_1,undefined2 param_2,int param_3)

{
  int iVar1;
  undefined2 uVar2;
  undefined2 unaff_DS;
  
  if (*(int *)0x7288 == 0) {
LAB_0000_245f:
    uVar2 = 2;
  }
  else {
    iVar1 = FUN_0000_ac70(0x372c);
    if (iVar1 == param_3) {
      iVar1 = FUN_0000_9bbc(param_2,0x372c,param_3);
      if (iVar1 == 0) goto LAB_0000_245f;
    }
    uVar2 = 1;
  }
  return uVar2;
}



/* FUN_0000_2465 @ 0000:2465 completed=true */

void FUN_0000_2465(void)

{
  undefined1 uVar1;
  int iVar2;
  undefined2 uVar3;
  int iVar4;
  undefined2 unaff_DS;
  
  FUN_0000_4fdb(0x77f0,0x19c);
  iVar2 = FUN_0000_8555();
  *(undefined2 *)(iVar2 + 0x24) = (code *)FUN_0000_4841;
  *(undefined2 *)(iVar2 + 0x22) = (code *)FUN_0000_88d0;
  do {
    uVar3 = FUN_0000_6736(0x59aa,0x10);
    *(undefined2 *)(iVar2 + 0xc) = uVar3;
    uVar3 = FUN_0000_6736(0x59c2,0x10);
    *(undefined2 *)(iVar2 + 0xe) = uVar3;
    FUN_0000_85c6(0,iVar2,0x77f0);
    while (*(int *)(iVar2 + 2) != 2) {
      (*(code *)*(undefined2 *)0x90)();
    }
    while (*(int *)(iVar2 + 2) == 2) {
      (*(code *)*(undefined2 *)0x90)();
      iVar4 = FUN_0000_65e6(0,iVar2 + 0xc);
      if (8 < iVar4) {
        iVar4 = 0;
        do {
          uVar1 = FUN_0000_65e6(1,iVar2 + 0xc);
          *(undefined1 *)(iVar4 + 0x59a0) = uVar1;
          iVar4 = iVar4 + 1;
        } while (iVar4 < 9);
        uVar3 = FUN_0000_252e(0x59a0);
        FUN_0000_65e6(6,iVar2 + 0xe,0x59a0,uVar3);
      }
    }
  } while( true );
}



/* FUN_0000_250e @ 0000:250e completed=true */

void __cdecl16near
FUN_0000_250e(undefined2 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             undefined2 param_5,undefined2 param_6,undefined2 param_7)

{
  undefined2 uVar1;
  
  uVar1 = FUN_0000_252e(param_1);
  FUN_0000_9bf8(param_4,param_7,param_6,param_1,uVar1);
  return;
}



/* FUN_0000_252e @ 0000:252e completed=true */

undefined2 __cdecl16near FUN_0000_252e(char *param_1)

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
    if (*param_1 == '\x18') goto switchD_0000_2549_default;
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
switchD_0000_2549_default:
    *param_1 = -1;
    return 1;
  }
  local_c = 0;
  for (local_4 = 0x20; local_4 < 0x28; local_4 = local_4 + 1) {
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
          FUN_0000_bc01(local_4);
        }
        else {
          FUN_0000_bc0f(local_4);
        }
      }
      uVar4 = FUN_0000_bd00(iVar2,local_4);
    }
    else {
      if (('\x13' < *param_1) &&
         ((*(uint *)(param_1 + 1) & uVar3) != 0 || (*(uint *)(param_1 + 3) & uVar4) != 0)) {
        if ((*(uint *)(param_1 + 5) & uVar3) == 0 && (*(uint *)(param_1 + 7) & uVar4) == 0) {
          uVar4 = *(uint *)(local_4 * 2 + 0x13a8) & ~unaff_DI;
        }
        else {
          uVar4 = *(uint *)(local_4 * 2 + 0x13a8) | unaff_DI;
        }
        *(uint *)(local_4 * 2 + 0x13a8) = uVar4;
      }
      uVar4 = *(uint *)(local_4 * 2 + 0x13a8) & unaff_DI;
    }
    if (uVar4 == 0) {
      uVar3 = 0;
    }
    local_c = local_c | uVar3;
  }
  *(uint *)(param_1 + 1) = local_c;
  if (('\x17' < *param_1) && (*param_1 < '\x1b')) {
    FUN_0000_bb13();
  }
  return 5;
}



/* FUN_0000_2696 @ 0000:2696 completed=true */

void __cdecl16near FUN_0000_2696(void)

{
  FUN_0000_aa6a();
  return;
}



/* FUN_0000_26a6 @ 0000:26a6 completed=true */

void __cdecl16near FUN_0000_26a6(int param_1)

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
      local_3 = 0xaf;
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



/* FUN_0000_26f7 @ 0000:26f7 completed=true */

void __cdecl16near FUN_0000_26f7(byte *param_1)

{
  undefined2 unaff_DS;
  uint local_8;
  uint local_6;
  undefined2 local_4;
  
  FUN_0000_998a(param_1,0x886,6);
  FUN_0000_a2c7(param_1 + 6,0,6);
  FUN_0000_c1af(0x101,0,4,&local_8);
  if ((~local_6 == local_8) && ((local_8 & 1) != 0)) {
    *param_1 = *param_1 | 3;
  }
  local_4 = FUN_0000_2696(6,param_1);
  *(undefined2 *)(param_1 + 10) = local_4;
  FUN_0000_bf2f(0x101,4,0xc,param_1);
  return;
}



/* FUN_0000_2760 @ 0000:2760 completed=true */

void __cdecl16near FUN_0000_2760(undefined2 param_1)

{
  undefined1 local_10 [10];
  int local_6;
  int local_4;
  
  FUN_0000_c1af(0x101,4,0xc,local_10);
  local_4 = FUN_0000_2696(6,local_10);
  if (local_4 == 0) {
    if (local_6 == -1) {
      FUN_0000_26f7(local_10);
    }
    FUN_0000_998a(param_1,local_10,6);
  }
  return;
}



/* FUN_0000_27a8 @ 0000:27a8 completed=true */

void __cdecl16near FUN_0000_27a8(byte *param_1)

{
  undefined2 unaff_DS;
  
  if ((*(byte *)0x379e & 1) == 0) {
    *param_1 = *param_1 & 0xfe;
  }
  return;
}



/* FUN_0000_289d @ 0000:289d completed=true */

undefined4 __cdecl16near FUN_0000_289d(undefined2 param_1,int *param_2)

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
  
  *(undefined2 *)0x5cc0 = param_1;
  *(undefined2 *)0x5cc2 = param_2;
  *(int *)0x1570 = param_2[4];
  *(int *)0x1578 = param_2[5];
  puVar7 = (undefined2 *)0x1580;
  iVar4 = 0xb;
  iVar5 = *(int *)0xa74;
  do {
    puVar2 = puVar7 + 1;
    out(iVar5 + 0x12,*puVar7);
    puVar7 = puVar7 + 2;
    out(iVar5 + 0x10,*puVar2);
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  puVar7 = (undefined2 *)*(undefined2 *)(*param_2 * 2 + 0x63dc);
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
  *(undefined2 *)0x30 = (undefined1 *)&LAB_0000_2928;
  *(undefined2 *)0x32 = unaff_CS;
  uVar3 = in(0xff28);
  out(0xff28,uVar3 & 0xffef);
  out(0xff38,0x17);
  out(*(int *)0xa74 + 0x12,0);
  iVar5 = *(int *)0xa74 + 0x10;
  out(iVar5,0x42);
  return CONCAT22(iVar5,1);
}



/* FUN_0000_2b32 @ 0000:2b32 completed=true */

void __cdecl16near FUN_0000_2b32(int param_1)

{
  undefined2 uVar1;
  undefined2 unaff_DS;
  
  uVar1 = *(undefined2 *)0x7292;
  *(undefined2 *)0x5cc6 = *(undefined2 *)0x4;
  *(undefined1 *)0x5cc9 = 0;
  FUN_0000_4fdb(0x45,(code *)FUN_0000_c45f);
  FUN_0000_4fdb(0x77fe,0x25f);
  *(undefined2 *)0x5cd0 = 0xf000;
  *(undefined2 *)0x5cd2 = *(undefined2 *)0x2;
  FUN_0000_998a(0x5cd4,0x1c,4);
  *(undefined2 *)0x5cd8 = *(undefined2 *)0x4;
  *(undefined2 *)0x5cda = *(undefined2 *)0xe;
  if (param_1 != 0) {
    FUN_0000_9bf8(0,0x77fe,0x77fe,0x5cce,0xe);
  }
  return;
}



/* FUN_0000_2bb0 @ 0000:2bb0 completed=true */

void __cdecl16near FUN_0000_2bb0(void)

{
  FUN_0000_aa6a();
  return;
}



/* FUN_0000_2bc0 @ 0000:2bc0 completed=true */

undefined2 __cdecl16near FUN_0000_2bc0(char *param_1,int param_2)

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
      puVar6 = (uint *)&DAT_0000_2ce8;
      do {
        if (*puVar6 == ((byte)param_1[3] & 0xf0)) {
                    /* WARNING: Could not recover jumptable at 0x00002c3e. Too many branches */
                    /* WARNING: Treating indirect jump as call */
          uVar3 = (*(code *)puVar6[9])();
          return uVar3;
        }
        puVar6 = puVar6 + 1;
        iVar5 = iVar5 + -1;
      } while (iVar5 != 0);
    }
  }
  if ((bVar2) && ((*(byte *)0x373a & 4) != 0)) {
    local_4 = 0;
  }
  else if ((iVar7 != -1) &&
          ((param_2 == iVar7 ||
           (((bVar1 && (iVar7 + 2 == param_2)) && (iVar4 = FUN_0000_2bb0(param_1,iVar4), iVar4 == 0)
            ))))) {
    local_4 = 1;
  }
  return local_4;
}



/* FUN_0000_2d0c @ 0000:2d0c completed=true */

void __cdecl16near
FUN_0000_2d0c(byte param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4)

{
  if ((param_1 & 2) == 0) {
    if ((param_1 & 4) == 0) {
      FUN_0000_65e6(6,param_2,0x5e2a,param_4);
    }
    else {
      FUN_0000_9bf8(param_2,0x77fe,param_3,0x5e2a,param_4);
    }
  }
  else {
    FUN_0000_9be9(param_2,0x77fe,param_3,0x5e2a,param_4);
  }
  if ((param_1 & 1) != 0) {
    FUN_0000_6bb2(0xfa);
    FUN_0000_1287();
  }
  return;
}



/* FUN_0000_2d67 @ 0000:2d67 completed=true */

void __cdecl16near
FUN_0000_2d67(int param_1,undefined2 param_2,undefined2 param_3,int param_4,int param_5)

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
  puVar4 = (uint *)&DAT_0000_31bc;
  do {
    if (*puVar4 == (bVar1 & 0xf0)) {
                    /* WARNING: Could not recover jumptable at 0x00002e03. Too many branches */
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
  iVar3 = FUN_0000_2bc0(param_1,param_2,uVar2);
  if (iVar3 != 0) {
    *(undefined2 *)0x5e2c = 0;
    *(undefined2 *)0x5e2a = 0;
    if ((uint)(bVar1 & 0xf) < *(uint *)0x7288) {
      iVar3 = 9;
      puVar4 = (uint *)&DAT_0000_3198;
      do {
        if (*puVar4 == (bVar1 & 0xf0)) {
                    /* WARNING: Could not recover jumptable at 0x00002e8a. Too many branches */
                    /* WARNING: Treating indirect jump as call */
          (*(code *)puVar4[9])();
          return;
        }
        puVar4 = puVar4 + 1;
        iVar3 = iVar3 + -1;
      } while (iVar3 != 0);
    }
    iVar3 = 0xc;
    puVar4 = (uint *)&DAT_0000_3168;
    do {
      if (*puVar4 == (uint)bVar1) {
                    /* WARNING: Could not recover jumptable at 0x00002f9d. Too many branches */
                    /* WARNING: Treating indirect jump as call */
        (*(code *)puVar4[0xc])();
        return;
      }
      puVar4 = puVar4 + 1;
      iVar3 = iVar3 + -1;
    } while (iVar3 != 0);
    if (*(int *)0xa7e != 0) {
      (*(code *)*(undefined2 *)0xa7e)(&param_1);
    }
  }
  return;
}



/* FUN_0000_31cc @ 0000:31cc completed=true */

undefined2 __cdecl16near FUN_0000_31cc(undefined2 param_1,undefined2 param_2,undefined2 param_3)

{
  char cVar1;
  int iVar2;
  uint uVar3;
  uint uVar4;
  undefined2 unaff_DS;
  
  cVar1 = *(char *)0x603e;
  uVar3 = 0;
  while( true ) {
    iVar2 = FUN_0000_9bf8(param_1,0x77fe,0x77fe,param_2,param_3);
    if (iVar2 != 0) {
      return 1;
    }
    uVar4 = 0;
    while ((uVar4 < 0x14 && (*(char *)0x603e != (char)(cVar1 + '\x01')))) {
      FUN_0000_6bb2(0x32);
      uVar4 = uVar4 + 1;
    }
    if (*(char *)0x603e == (char)(cVar1 + '\x01')) break;
    uVar3 = uVar3 + 1;
    if (2 < uVar3) {
      return 1;
    }
  }
  return 0;
}



/* FUN_0000_3228 @ 0000:3228 completed=true */

undefined2 __cdecl16near FUN_0000_3228(int param_1)

{
  int iVar1;
  int iVar2;
  int *piVar3;
  undefined2 unaff_DS;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined1 local_22 [10];
  undefined1 uStack_18;
  undefined2 uStack_17;
  int iStack_14;
  int local_12;
  int local_c;
  int local_a;
  uint uStack_8;
  int local_6;
  int local_4;
  
  local_a = 0;
  local_c = 0;
  local_12 = 0;
  if (param_1 == 0x78) {
    FUN_0000_0238(1);
    return 0;
  }
  FUN_0000_6535(0xaa0);
  while( true ) {
    uVar4 = 0x325d;
    iVar1 = FUN_0000_64da();
    if (iVar1 == 0) break;
    FUN_0000_6566(uVar4);
  }
  do {
    FUN_0000_64f1(0x3e);
    iVar1 = FUN_0000_a66f(0x100,0x603f);
    if (iVar1 == 0) {
LAB_0000_3999:
      uVar4 = 0x39;
    }
    else {
      iVar1 = FUN_0000_a7f2(0x6041,local_22);
      uStack_18 = 8;
      uStack_17 = 0;
      if ((*(char *)0x603f == 'R') || (*(char *)0x603f == 'W')) {
        local_12 = 1;
      }
      else {
        local_12 = 0;
      }
      if ((((*(int *)0x7288 == 0) && (*(char *)0x6040 != 'C')) ||
          ((local_12 != 0 && (*(char *)0x6040 == 'C')))) ||
         (((*(char *)0x603f != 'G' && (*(char *)0x603f != 'S')) &&
          ((*(int *)0x7288 != 0x1d || (local_12 == 0)))))) {
LAB_0000_3530:
        iStack_14 = *(int *)0x603f;
        iVar1 = 0x14;
        piVar3 = (int *)&DAT_0000_39ae;
        do {
          if (*piVar3 == iStack_14) {
                    /* WARNING: Could not recover jumptable at 0x0000354c. Too many branches */
                    /* WARNING: Treating indirect jump as call */
            uVar4 = (*(code *)piVar3[0x14])();
            return uVar4;
          }
          piVar3 = piVar3 + 1;
          iVar1 = iVar1 + -1;
        } while (iVar1 != 0);
        goto LAB_0000_3999;
      }
      if ((*(char *)0x6041 != '\0') && (*(char *)0x6040 != 'C')) goto LAB_0000_3999;
      if (*(char *)0x6040 == 'C') {
        uStack_8 = 0;
        local_a = 1;
      }
      else if ((*(char *)0x603f == 'S') && (*(char *)0x6040 == 'S')) {
        uStack_8 = 1;
        local_c = 1;
      }
      else {
        if ((*(byte *)0x6040 < 0x30) || (0x39 < *(byte *)0x6040)) {
          if ((*(byte *)0x6040 < 0x61) || (0x66 < *(byte *)0x6040)) goto LAB_0000_3530;
          uStack_8 = *(byte *)0x6040 - 0x57;
        }
        else {
          uStack_8 = *(byte *)0x6040 - 0x30;
        }
        if (local_12 != 0) {
          uStack_8 = uStack_8 + 0x10;
        }
      }
      if (*(uint *)0x7288 <= uStack_8) goto LAB_0000_3999;
      if (uStack_8 == 0) {
        iVar2 = 0x78;
      }
      else {
        iVar2 = 0x7e;
      }
      if ((*(char *)0x603f != 'G') && (*(char *)0x603f != 'R')) {
        FUN_0000_a2c7(0x603f,0,0x100);
        local_6 = iVar2;
        do {
          local_4 = FUN_0000_3b01(0x603f,unaff_DS,iVar2,&local_6);
          if (local_4 == 1) {
            if (iVar1 != 0) {
              FUN_0000_998a(iVar2 + 0x6043,0x603f,iVar2);
              *(undefined1 *)(iVar2 + 0x603f) = 0;
              *(undefined1 *)(iVar2 + 0x6040) = 0;
              *(undefined1 *)(iVar2 + 0x6041) = 0;
              if (local_a == 0) {
                *(byte *)(iVar2 + 0x6042) = (byte)uStack_8 & 0xf | 0xc0;
              }
              else {
                *(undefined1 *)(iVar2 + 0x6042) = 0xfa;
              }
              *(undefined1 *)0x603e = 5;
              iVar1 = FUN_0000_31cc(local_22,iVar2 + 0x603f,iVar2 + 4);
              if (iVar1 == 0) goto LAB_0000_39a6;
              goto LAB_0000_399d;
            }
            if (local_c != 0) {
              FUN_0000_9d30(iVar2,0x80,iVar2 + 0x603f);
              FUN_0000_998a(0x6040,iVar2 + 0x6040,0x10);
              FUN_0000_998a(0x6070,iVar2 + 0x6070,0x11);
              local_c = 0;
            }
            if (uStack_8 == 0) {
              iVar1 = 6;
            }
            else {
              iVar1 = uStack_8 << 7;
            }
            FUN_0000_9ca9(iVar2,iVar1,0x603f);
            if (uStack_8 == 0) {
              FUN_0000_998a((undefined *)&DAT_0000_3690,0x603f,iVar2);
            }
            goto LAB_0000_39a6;
          }
        } while ((-1 < local_4) || (local_4 == -2));
        FUN_0000_6bb2(0xfa);
        while (iVar1 = FUN_0000_64da(), iVar1 != 0) {
          FUN_0000_6566();
        }
        goto LAB_0000_3999;
      }
      if (iVar1 == 0) {
        if ((uStack_8 == 1) || (uStack_8 == 9)) {
          uVar5 = 0x7e;
          uVar4 = 0x603f;
        }
        else {
          if (uStack_8 == 0) {
            iVar1 = 6;
          }
          else {
            iVar1 = uStack_8 << 7;
          }
          FUN_0000_9d30(iVar2,iVar1,0x603f);
          if (uStack_8 != 0) goto LAB_0000_340d;
          uVar5 = 4;
          uVar4 = 0x6047;
        }
        FUN_0000_a2c7(uVar4,0,uVar5);
LAB_0000_340d:
        FUN_0000_39fe(0x10,iVar2,0x603f);
LAB_0000_39a6:
        uVar4 = 0x30;
      }
      else {
        *(uint *)0xa82 = (uStack_8 & 0xf) << 8 | 0xe000;
        *(undefined1 *)0x603e = 1;
        iVar1 = FUN_0000_31cc(local_22,0xa80,4);
        if (iVar1 == 0) goto LAB_0000_340d;
LAB_0000_399d:
        uVar4 = 0x32;
      }
    }
    FUN_0000_64f1(uVar4);
  } while( true );
}



/* FUN_0000_39fe @ 0000:39fe completed=true */

void __cdecl16near FUN_0000_39fe(undefined2 param_1,uint param_2,char *param_3)

{
  uint uVar1;
  char local_7;
  uint local_6;
  int local_4;
  
  local_4 = 0;
  do {
    if (param_2 == 0) {
      local_6 = 0;
      local_4 = 0;
      param_1 = 1;
    }
    else {
      local_6 = param_2;
      if (0x1f < param_2) {
        local_6 = 0x20;
      }
      param_2 = param_2 - local_6;
    }
    FUN_0000_6aa1(0xc54,local_6,local_4,param_1);
    local_7 = (char)((uint)local_4 >> 8) + (char)local_6 + (char)local_4 + (char)param_1;
    uVar1 = local_6;
    while (uVar1 != 0) {
      FUN_0000_6aa1(0xc5b,*param_3);
      local_7 = local_7 + *param_3;
      param_3 = (char *)CONCAT22(param_3._2_2_,(char *)param_3 + 1);
      uVar1 = uVar1 - 1;
    }
    FUN_0000_6aa1(0xc5f,-local_7);
    local_4 = local_4 + local_6;
  } while (local_6 != 0);
  return;
}



/* FUN_0000_3aa8 @ 0000:3aa8 completed=true */

uint __cdecl16near FUN_0000_3aa8(void)

{
  byte bVar1;
  uint uVar2;
  uint uVar3;
  undefined2 unaff_DS;
  
  bVar1 = FUN_0000_6566();
  uVar2 = bVar1 - 0x30;
  if (9 < (int)uVar2) {
    uVar2 = bVar1 - 0x37;
  }
  bVar1 = FUN_0000_6566();
  uVar3 = bVar1 - 0x30;
  if (9 < (int)uVar3) {
    uVar3 = bVar1 - 0x37;
  }
  if (((((int)uVar2 < 0) || (0x10 < (int)uVar2)) || ((int)uVar3 < 0)) || (0x10 < (int)uVar3)) {
    uVar2 = 0xffff;
  }
  else {
    uVar2 = (uVar2 & 0xf) << 4 | uVar3 & 0xf;
    *(int *)0x6168 = *(int *)0x6168 + uVar2;
  }
  return uVar2;
}



/* FUN_0000_3b01 @ 0000:3b01 completed=true */

int FUN_0000_3b01(undefined4 param_1,uint param_2,int *param_3)

{
  char cVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  undefined2 unaff_DS;
  uint local_8;
  undefined1 local_6;
  
  do {
    cVar1 = FUN_0000_6566();
  } while (cVar1 != ':');
  *(undefined2 *)0x6168 = 0;
  iVar2 = FUN_0000_3aa8();
  if ((iVar2 < 0) || (*param_3 < iVar2)) {
    iVar3 = -1;
  }
  else {
    *param_3 = iVar2;
    iVar3 = FUN_0000_3aa8();
    local_8 = FUN_0000_3aa8();
    local_8 = iVar3 << 8 | local_8;
    if ((param_2 == 0) || (local_8 <= param_2)) {
      iVar3 = FUN_0000_3aa8();
      while (iVar2 != 0) {
        iVar4 = FUN_0000_3aa8();
        if (iVar4 < 0) {
          return iVar4;
        }
        local_6 = (undefined1)iVar4;
        *(undefined1 *)((int)param_1 + local_8) = local_6;
        local_8 = local_8 + 1;
        iVar2 = iVar2 + -1;
      }
      FUN_0000_3aa8();
      if ((*(uint *)0x6168 & 0xff) != 0) {
        iVar3 = -2;
      }
    }
    else {
      iVar3 = -3;
    }
  }
  return iVar3;
}



/* FUN_0000_3b98 @ 0000:3b98 completed=true */

void __cdecl16near FUN_0000_3b98(void)

{
  int iVar1;
  int *piVar2;
  int iVar3;
  int *piVar4;
  undefined2 unaff_DS;
  byte local_5;
  int *local_4;
  
  FUN_0000_a2c7((undefined *)&DAT_0000_6192,0,0x18);
  local_4 = (int *)0x102a;
  do {
    if (*local_4 == 0) {
      return;
    }
    for (piVar4 = (int *)0x200; *piVar4 != 0; piVar4 = piVar4 + 8) {
      if (*local_4 == *piVar4) {
        for (local_5 = 0; local_5 < *(byte *)(local_4 + 1); local_5 = local_5 + 1) {
          if ((uint)*(byte *)0x72a0 < *(uint *)0x616a) {
            FUN_0000_6c2c(0x15);
          }
          iVar3 = *(int *)0x616a;
          iVar1 = iVar3 * 0x11;
          piVar2 = (int *)((undefined *)&DAT_0000_6170 + iVar1);
          if (piVar2 != (int *)0x0) {
            *(int **)((undefined *)&DAT_0000_616c + iVar3 * 2) = piVar2;
            *(undefined2 *)((undefined *)&DAT_0000_6172 + iVar1) = 0x100;
            *piVar2 = iVar3;
            ((undefined *)&DAT_0000_6176)[iVar1] = local_5;
            *(int **)((undefined *)&DAT_0000_617c + iVar1) = piVar4;
            *(int *)0x616a = *(int *)0x616a + 1;
          }
          iVar3 = (*(code *)piVar4[2])();
          if (iVar3 == 0) {
LAB_0000_3c31:
            ((undefined *)&DAT_0000_6180)[iVar1] = ((undefined *)&DAT_0000_6180)[iVar1] & 0xfc;
          }
          else if (iVar3 == 1) {
            ((undefined *)&DAT_0000_6180)[iVar1] = ((undefined *)&DAT_0000_6180)[iVar1] & 0xfc;
            ((undefined *)&DAT_0000_6180)[iVar1] = ((undefined *)&DAT_0000_6180)[iVar1] | 1;
          }
          else if (iVar3 == 2) {
            (*(code *)piVar4[7])();
            goto LAB_0000_3c31;
          }
        }
      }
    }
    local_4 = (int *)((int)local_4 + 3);
  } while( true );
}



/* FUN_0000_3c63 @ 0000:3c63 completed=true */

undefined2 __cdecl16near FUN_0000_3c63(int param_1,int param_2)

{
  byte bVar1;
  undefined2 uVar2;
  int iVar3;
  undefined1 uVar4;
  undefined1 extraout_AH;
  undefined2 unaff_DS;
  
  if (*(char *)0xc7d == '\0') {
    if ((*(int *)0x616a == 1) || (*(char *)0xcfc == '\x01')) {
      *(int *)0xc6e = *(int *)0xc6e + 0xc00;
    }
    uVar2 = *(undefined2 *)0xc6e;
    *(undefined2 *)0xc70 = uVar2;
    *(undefined2 *)0xc72 = uVar2;
    *(undefined2 *)0xc66 = uVar2;
  }
  *(char *)0xc7d = *(char *)0xc7d + '\x01';
  iVar3 = *(int *)((undefined *)&DAT_0000_616c + param_1 * 2);
  bVar1 = *(byte *)0xc7d;
  *(int *)(iVar3 + 8) = (uint)bVar1 * -0xc00 + -0x400;
  *(int *)(iVar3 + 10) = (uint)bVar1 * -0xc00 + 0x200;
  *(int *)(iVar3 + 0xe) = param_2;
  *(undefined2 *)(param_2 + 6) = *(undefined2 *)(iVar3 + 2);
  uVar4 = 0;
  if ((*(byte *)(iVar3 + 0x10) & 3) != 0) {
    (*(code *)*(undefined2 *)(*(int *)(iVar3 + 0xc) + 6))(0xc74,iVar3);
    uVar4 = extraout_AH;
  }
  return CONCAT11(uVar4,1);
}



/* FUN_0000_3ce1 @ 0000:3ce1 completed=true */

void __cdecl16near FUN_0000_3ce1(undefined2 *param_1)

{
  undefined2 uVar1;
  undefined2 unaff_DS;
  
  uVar1 = *param_1;
  *(undefined2 *)0xc6a = param_1[1];
  *(undefined2 *)0xc68 = uVar1;
  *(undefined2 *)0xc6c = param_1[2];
  return;
}



/* FUN_0000_3cfd @ 0000:3cfd completed=true */

undefined2 __cdecl16near FUN_0000_3cfd(int param_1,byte *param_2,int param_3)

{
  byte *pbVar1;
  byte bVar2;
  int iVar3;
  undefined2 uVar4;
  undefined2 unaff_DS;
  
  if (param_1 == 0xf0) {
    bVar2 = *param_2;
    iVar3 = *(int *)((undefined *)&DAT_0000_616c + param_3 * 2);
    pbVar1 = (byte *)(iVar3 + 0x10);
    *pbVar1 = *pbVar1 & 0xfb;
    pbVar1 = (byte *)(iVar3 + 0x10);
    *pbVar1 = *pbVar1 | (bVar2 & 1) << 2;
    uVar4 = 0;
  }
  else {
    if (param_1 == 0xf1) {
      *(undefined2 *)(*(int *)((undefined *)&DAT_0000_616c + param_3 * 2) + 0xe) = param_2;
    }
    uVar4 = (*(code *)*(undefined2 *)
                       (*(int *)(*(int *)((undefined *)&DAT_0000_616c + param_3 * 2) + 0xc) + 8))
                      (param_1,param_2);
  }
  return uVar4;
}



/* FUN_0000_3d5b @ 0000:3d5b completed=true */

undefined2 __cdecl16near FUN_0000_3d5b(void)

{
  return 1;
}



/* FUN_0000_3d63 @ 0000:3d63 completed=true */

uint __cdecl16near FUN_0000_3d63(int param_1,char param_2)

{
  byte bVar1;
  undefined2 unaff_DS;
  
  bVar1 = 0;
  while( true ) {
    if (*(uint *)0x616a <= (uint)bVar1) {
      return 0xffff;
    }
    if ((*(int *)*(undefined2 *)(*(int *)((undefined *)&DAT_0000_616c + (uint)bVar1 * 2) + 0xc) ==
         param_1) &&
       (*(char *)(*(int *)((undefined *)&DAT_0000_616c + (uint)bVar1 * 2) + 6) == param_2)) break;
    bVar1 = bVar1 + 1;
  }
  return (uint)bVar1;
}



/* FUN_0000_3dab @ 0000:3dab completed=true */

undefined2 __cdecl16near FUN_0000_3dab(int param_1)

{
  undefined2 unaff_DS;
  
  return *(undefined2 *)*(undefined2 *)(*(int *)((undefined *)&DAT_0000_616c + param_1 * 2) + 0xc);
}



