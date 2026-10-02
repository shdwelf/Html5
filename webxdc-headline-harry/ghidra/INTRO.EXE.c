/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: INTRO.EXE
 * SHA-256: 01fa47f5a41cc061a59b884f817fe8ec0d9d047691ef452d909975562b74fa11
 */

/* ------------------------------------------------------------
 * entry @ 238e:0010
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
  
  DAT_238e_0004 = unaff_ES + 0x10;
  DAT_238e_21fe = DAT_238e_0004 + DAT_238e_000c;
  puVar4 = (undefined1 *)(DAT_238e_0006 + -1);
  puVar5 = puVar4;
  for (iVar3 = DAT_238e_0006; iVar3 != 0; iVar3 = iVar3 + -1) {
    puVar2 = puVar5;
    puVar5 = puVar5 + -1;
    puVar1 = puVar4;
    puVar4 = puVar4 + -1;
    *puVar2 = *puVar1;
  }
  DAT_238e_21fc = 0x32;
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_003d @ 1000:003d
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_003d(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x53;
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_007a @ 1000:007a
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_007a(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x55;
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_00b7 @ 1000:00b7
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_00b7(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  *(undefined2 *)0x122 = 0x51;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_00ea @ 1000:00ea
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_00ea(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  *(undefined2 *)0x122 = 0x52;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_011d @ 1000:011d
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_011d(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  *(undefined2 *)0x122 = 0x50;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_022c @ 1000:022c
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_022c(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x45;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_025f @ 1000:025f
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_025f(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x49;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0292 @ 1000:0292
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0292(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x48;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_02c5 @ 1000:02c5
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_02c5(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x4e;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_02f8 @ 1000:02f8
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_02f8(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x4d;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_03a2 @ 1000:03a2
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_03a2(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x42;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_03d5 @ 1000:03d5
 * selected: address-order fallback
 * body bytes: 11
 * completed: true
 */

void __cdecl16far FUN_1000_03d5(undefined1 param_1)

{
  undefined2 unaff_DS;
  
  *(undefined1 *)0x46 = param_1;
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_03e0 @ 1000:03e0
 * selected: address-order fallback
 * body bytes: 186
 * completed: true
 */

void __cdecl16far FUN_1000_03e0(undefined1 *param_1)

{
  undefined2 uVar1;
  undefined1 *puVar2;
  undefined2 uVar3;
  undefined2 unaff_DS;
  
  FUN_1000_05ee();
  if (*(char *)0x43 == '\0') {
    *param_1 = 0;
  }
  else {
    *param_1 = *(undefined1 *)(*(byte *)0x43 + 0x2ca);
    uVar3 = (undefined2)((ulong)param_1 >> 0x10);
    puVar2 = (undefined1 *)param_1;
    puVar2[6] = *(undefined1 *)(*(byte *)0x43 + 0x16);
    puVar2[7] = *(undefined1 *)(*(byte *)0x43 + 0x28a);
    *(undefined2 *)(puVar2 + 2) = *(undefined2 *)((uint)*(byte *)0x43 * 2 + 0x17a);
    *(undefined2 *)(puVar2 + 4) = *(undefined2 *)((uint)*(byte *)0x43 * 2 + 0x1fc);
    uVar1 = *(undefined2 *)((uint)*(byte *)0x43 * 4 + 0x66);
    *(undefined2 *)(puVar2 + 8) = *(undefined2 *)((uint)*(byte *)0x43 * 4 + 100);
    *(undefined2 *)(puVar2 + 10) = uVar1;
    *(char *)0x43 = *(char *)0x43 + -1;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_049a @ 1000:049a
 * selected: address-order fallback
 * body bytes: 181
 * completed: true
 */

void __cdecl16far FUN_1000_049a(undefined1 *param_1)

{
  undefined2 uVar1;
  undefined1 *puVar2;
  undefined2 uVar3;
  undefined2 unaff_DS;
  
  FUN_1000_05ee();
  puVar2 = (undefined1 *)param_1;
  uVar3 = (undefined2)((ulong)param_1 >> 0x10);
  if (*(char *)0x43 == '\0') {
    *param_1 = 0;
  }
  else {
    *param_1 = *(undefined1 *)(*(byte *)0x43 + 0x2ca);
    puVar2[6] = *(undefined1 *)(*(byte *)0x43 + 0x16);
    puVar2[7] = *(undefined1 *)(*(byte *)0x43 + 0x28a);
    *(undefined2 *)(puVar2 + 2) = *(undefined2 *)((uint)*(byte *)0x43 * 2 + 0x17a);
    *(undefined2 *)(puVar2 + 4) = *(undefined2 *)((uint)*(byte *)0x43 * 2 + 0x1fc);
  }
  uVar1 = *(undefined2 *)((uint)*(byte *)0x43 * 4 + 0x66);
  *(undefined2 *)(puVar2 + 8) = *(undefined2 *)((uint)*(byte *)0x43 * 4 + 100);
  *(undefined2 *)(puVar2 + 10) = uVar1;
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_054f @ 1000:054f
 * selected: address-order fallback
 * body bytes: 134
 * completed: true
 */

void __cdecl16far FUN_1000_054f(undefined1 *param_1)

{
  undefined2 uVar1;
  undefined2 uVar2;
  uint uVar3;
  undefined1 *puVar4;
  undefined2 uVar5;
  undefined2 unaff_DS;
  
  *(char *)0x43 = *(char *)0x43 + '\x01';
  uVar3 = (uint)*(byte *)0x43;
  *(undefined1 *)(uVar3 + 0x2ca) = *param_1;
  uVar5 = (undefined2)((ulong)param_1 >> 0x10);
  puVar4 = (undefined1 *)param_1;
  *(undefined1 *)(uVar3 + 0x16) = puVar4[6];
  *(undefined1 *)(uVar3 + 0x28a) = puVar4[7];
  *(undefined2 *)(uVar3 * 2 + 0x17a) = *(undefined2 *)(puVar4 + 2);
  *(undefined2 *)(uVar3 * 2 + 0x1fc) = *(undefined2 *)(puVar4 + 4);
  uVar2 = *(undefined2 *)(puVar4 + 10);
  uVar1 = *(undefined2 *)0xf32;
  *(undefined2 *)(uVar3 * 4 + 100) = *(undefined2 *)(puVar4 + 8);
  *(undefined2 *)(uVar3 * 4 + 0x66) = uVar2;
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_05d5 @ 1000:05d5
 * selected: address-order fallback
 * body bytes: 25
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_05d5(void)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x4b;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_05ee @ 1000:05ee
 * selected: address-order fallback
 * body bytes: 632
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_05ee(void)

{
  undefined2 uVar1;
  byte bVar2;
  uint uVar3;
  int iVar4;
  undefined2 uVar5;
  undefined2 unaff_DS;
  
  uVar5 = 0x1000;
  if (*(char *)0x42 == '\0') {
    iVar4 = FUN_1000_05d5();
  }
  else {
    uVar5 = 0x5aa;
    iVar4 = func_0x000073d2(0x1000);
  }
  if (iVar4 == 0) {
    uVar1 = *(undefined2 *)0xf26;
    *(undefined2 *)0x27c = 3;
    *(undefined2 *)0x27e = 0;
    func_0x000073fe(uVar5,0x33,0x27c,0x13ef,0x27c,0x13ef);
    uVar5 = *(undefined2 *)0xf26;
    *(uint *)0x27e = *(uint *)0x27e & 1;
    if ((*(char *)0x45 == '\0') && (*(int *)0x27e != 0)) {
      *(char *)0x43 = *(char *)0x43 + '\x01';
      if (*(char *)0x43 == '@') {
        *(undefined1 *)0x43 = 1;
      }
      bVar2 = *(byte *)0x43;
      *(uint *)((uint)bVar2 * 2 + 0x17a) = *(uint *)0x280 >> 1;
      *(undefined2 *)((uint)bVar2 * 2 + 0x1fc) = *(undefined2 *)0x282;
      *(undefined1 *)0x45 = 1;
      FUN_1000_0867();
      *(undefined1 *)(*(byte *)0x43 + 0x2ca) = 1;
    }
    else if ((*(int *)0x27e == 0) || (*(char *)0x45 == '\0')) {
      uVar5 = *(undefined2 *)0xf26;
      if (*(int *)0x27e != 0) {
        return 0;
      }
      if (*(char *)0x45 == '\0') {
        return 0;
      }
      *(char *)0x43 = *(char *)0x43 + '\x01';
      if (*(char *)0x43 == '@') {
        *(undefined1 *)0x43 = 1;
      }
      bVar2 = *(byte *)0x43;
      *(uint *)((uint)bVar2 * 2 + 0x17a) = *(uint *)0x280 >> 1;
      *(undefined2 *)((uint)bVar2 * 2 + 0x1fc) = *(undefined2 *)0x282;
      *(undefined2 *)0x62 = 1000;
      *(undefined2 *)0x166 = 1000;
      FUN_1000_0867();
      *(undefined1 *)0x45 = 0;
      *(undefined1 *)(*(byte *)0x43 + 0x2ca) = 2;
    }
    else {
      if ((*(uint *)0x280 >> 1 == *(uint *)0x62) && (*(int *)0x282 == *(int *)0x166)) {
        return 0;
      }
      *(char *)0x43 = *(char *)0x43 + '\x01';
      if (*(char *)0x43 == '@') {
        *(undefined1 *)0x43 = 1;
      }
      uVar3 = *(uint *)0x280;
      bVar2 = *(byte *)0x43;
      *(uint *)((uint)bVar2 * 2 + 0x17a) = uVar3 >> 1;
      *(undefined2 *)((uint)bVar2 * 2 + 0x1fc) = *(undefined2 *)0x282;
      *(uint *)0x62 = uVar3 >> 1;
      *(undefined2 *)0x166 = *(undefined2 *)0x282;
      FUN_1000_0867();
      *(undefined1 *)(*(byte *)0x43 + 0x2ca) = 4;
    }
  }
  else {
    *(char *)0x43 = *(char *)0x43 + '\x01';
    if (*(char *)0x43 == '@') {
      *(undefined1 *)0x43 = 1;
    }
    *(undefined1 *)0x27d = 0;
    func_0x000073fe(uVar5,0x16,0x27c,0x13ef,0x27c,0x13ef);
    if (*(char *)0x27c == '\0') {
      bVar2 = *(byte *)0x43;
      *(undefined1 *)(bVar2 + 0x28a) = *(undefined1 *)0x27d;
      *(undefined1 *)(bVar2 + 0x2ca) = 5;
    }
    else {
      bVar2 = *(byte *)0x43;
      *(undefined1 *)(bVar2 + 0x16) = *(undefined1 *)0x27c;
      *(undefined1 *)(bVar2 + 0x2ca) = 3;
    }
    FUN_1000_0867();
  }
  return 1;
}



/* ------------------------------------------------------------
 * FUN_1000_0867 @ 1000:0867
 * selected: address-order fallback
 * body bytes: 65
 * completed: true
 */

void __cdecl16far FUN_1000_0867(void)

{
  undefined2 uVar1;
  byte bVar2;
  undefined2 uVar3;
  undefined2 unaff_DS;
  
  uVar3 = uRam0000046e;
  if (*(char *)0x46 != '\0') {
    bVar2 = *(byte *)0x43;
    uVar1 = *(undefined2 *)0xf32;
    *(undefined2 *)((uint)bVar2 * 4 + 100) = uRam0000046c;
    *(undefined2 *)((uint)bVar2 * 4 + 0x66) = uVar3;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_08a8 @ 1000:08a8
 * selected: address-order fallback
 * body bytes: 34
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_08a8(void)

{
  return uRam0000046c;
}



/* ------------------------------------------------------------
 * FUN_1000_08ca @ 1000:08ca
 * selected: address-order fallback
 * body bytes: 156
 * completed: true
 */

void __cdecl16far FUN_1000_08ca(void)

{
  undefined2 uVar1;
  undefined2 unaff_DS;
  undefined1 local_10 [12];
  int local_4;
  
  local_4 = 0;
  do {
    FUN_1000_03e0(local_10);
    local_4 = local_4 + 1;
  } while (local_4 < 0x14);
  local_4 = 0;
  do {
    *(undefined2 *)(local_4 * 2 + 0x17a) = 0;
    *(undefined2 *)(local_4 * 2 + 0x1fc) = 0;
    *(undefined1 *)(local_4 + 0x16) = 0;
    *(undefined1 *)(local_4 + 0x28a) = 0;
    uVar1 = *(undefined2 *)0xf32;
    *(undefined2 *)(local_4 * 4 + 0x66) = 0;
    *(undefined2 *)(local_4 * 4 + 100) = 0;
    *(undefined1 *)(local_4 + 0x2ca) = 0;
    *(undefined1 *)0x43 = 0;
    *(undefined1 *)0x44 = 0;
    *(undefined1 *)0x45 = 0;
    local_4 = local_4 + 1;
  } while (local_4 < 0x40);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0966 @ 1000:0966
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0966(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  *(undefined2 *)0x122 = 1;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_09a3 @ 1000:09a3
 * selected: address-order fallback
 * body bytes: 189
 * completed: true
 */

void __cdecl16far FUN_1000_09a3(undefined2 *param_1)

{
  undefined2 *puVar1;
  undefined2 uVar2;
  
  *param_1 = 0;
  uVar2 = (undefined2)((ulong)param_1 >> 0x10);
  puVar1 = (undefined2 *)param_1;
  puVar1[1] = 0;
  puVar1[2] = 0;
  *(undefined1 *)(puVar1 + 3) = 0x80;
  puVar1[4] = 0;
  puVar1[6] = 0x13f;
  puVar1[5] = 0;
  puVar1[7] = 199;
  *(undefined1 *)(puVar1 + 8) = 0xff;
  *(undefined1 *)((int)puVar1 + 0x11) = 0xff;
  *(undefined1 *)(puVar1 + 9) = 0xff;
  *(undefined1 *)((int)puVar1 + 0x13) = 0xff;
  *(undefined1 *)(puVar1 + 10) = 0xff;
  *(undefined1 *)((int)puVar1 + 0x15) = 0xff;
  *(undefined1 *)(puVar1 + 0xb) = 0xff;
  *(undefined1 *)((int)puVar1 + 0x17) = 0xff;
  puVar1[0xd] = 0;
  puVar1[0xe] = 0;
  *(undefined1 *)(puVar1 + 0xf) = 1;
  *(undefined1 *)((int)puVar1 + 0x1f) = 1;
  *(undefined1 *)(puVar1 + 0x10) = 0;
  *(undefined1 *)((int)puVar1 + 0x21) = 0xff;
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0a60 @ 1000:0a60
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0a60(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x19;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0a93 @ 1000:0a93
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0a93(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x3d;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0ac6 @ 1000:0ac6
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0ac6(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x46;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0af9 @ 1000:0af9
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0af9(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x3e;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0b2c @ 1000:0b2c
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0b2c(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x3f;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0b5f @ 1000:0b5f
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0b5f(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x18;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0b92 @ 1000:0b92
 * selected: address-order fallback
 * body bytes: 73
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0b92(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 local_6;
  undefined2 local_4;
  
  local_6 = param_1;
  local_4 = param_2;
  *(undefined2 *)0x122 = 0xf;
  *(int *)0x11c = (int)&local_6;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&local_6);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0bdb @ 1000:0bdb
 * selected: address-order fallback
 * body bytes: 73
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0bdb(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 local_6;
  undefined2 local_4;
  
  local_6 = param_1;
  local_4 = param_2;
  *(undefined2 *)0x122 = 0x10;
  *(int *)0x11c = (int)&local_6;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&local_6);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0c24 @ 1000:0c24
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0c24(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x47;
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0c61 @ 1000:0c61
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0c61(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x38;
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0c9e @ 1000:0c9e
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0c9e(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x2f;
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0d3d @ 1000:0d3d
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0d3d(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  *(undefined2 *)0x122 = 0x22;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0d7a @ 1000:0d7a
 * selected: address-order fallback
 * body bytes: 73
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0d7a(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 local_6;
  undefined2 local_4;
  
  local_6 = param_1;
  local_4 = param_2;
  *(undefined2 *)0x122 = 0xe;
  *(int *)0x11c = (int)&local_6;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&local_6);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0dc3 @ 1000:0dc3
 * selected: address-order fallback
 * body bytes: 77
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0dc3(char param_1)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  if (param_1 == '\x7f') {
    param_1 = 0xf;
  }
  else {
    param_1 = 0xf0;
  }
  *(undefined2 *)0x122 = 0xc;
  *(int *)0x11c = (int)&param_1;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&param_1);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0e10 @ 1000:0e10
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0e10(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0xc;
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0e4d @ 1000:0e4d
 * selected: address-order fallback
 * body bytes: 73
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0e4d(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined2 local_6;
  undefined2 local_4;
  
  local_6 = param_1;
  local_4 = param_2;
  *(undefined2 *)0x122 = 0xd;
  *(int *)0x11c = (int)&local_6;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&local_6);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0efb @ 1000:0efb
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0efb(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x12;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0f2e @ 1000:0f2e
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0f2e(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 8;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0f61 @ 1000:0f61
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0f61(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 4;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0f94 @ 1000:0f94
 * selected: address-order fallback
 * body bytes: 51
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0f94(undefined2 param_1,undefined2 param_2)

{
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 0x40;
  *(undefined2 *)0x11c = param_1;
  *(undefined2 *)0x120 = param_2;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_0fc7 @ 1000:0fc7
 * selected: address-order fallback
 * body bytes: 95
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0fc7(int param_1,int param_2)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 local_8;
  undefined1 local_7;
  undefined1 *local_6;
  
  local_6 = &local_8;
  if (param_1 == 0) {
    param_1 = 1;
  }
  if (param_2 == 0) {
    param_2 = 1;
  }
  local_8 = (undefined1)param_1;
  local_7 = (undefined1)param_2;
  *(undefined2 *)0x122 = 10;
  *(int *)0x11c = (int)local_6;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_1026 @ 1000:1026
 * selected: address-order fallback
 * body bytes: 61
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_1026(void)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  
  *(undefined2 *)0x122 = 7;
  *(int *)0x11c = (int)&stack0x0004;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000,&stack0x0004);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_1100 @ 1000:1100
 * selected: address-order fallback
 * body bytes: 82
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_1100(undefined1 param_1,undefined1 param_2,undefined1 param_3)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 local_6;
  undefined1 local_5;
  undefined1 local_4;
  
  local_6 = param_1;
  local_5 = param_2;
  local_4 = param_3;
  *(undefined2 *)0x122 = 0x35;
  *(int *)0x11c = (int)&local_6;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_1152 @ 1000:1152
 * selected: address-order fallback
 * body bytes: 76
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_1152(undefined1 param_1,undefined1 param_2)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 local_4;
  undefined1 local_3;
  
  local_4 = param_1;
  local_3 = param_2;
  *(undefined2 *)0x122 = 0x34;
  *(int *)0x11c = (int)&local_4;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



/* ------------------------------------------------------------
 * FUN_1000_119e @ 1000:119e
 * selected: address-order fallback
 * body bytes: 88
 * completed: true
 */

undefined2 __cdecl16far
FUN_1000_119e(undefined1 param_1,undefined1 param_2,undefined1 param_3,undefined1 param_4)

{
  undefined2 unaff_SS;
  undefined2 unaff_DS;
  undefined1 local_6;
  undefined1 local_5;
  undefined1 local_4;
  undefined1 local_3;
  
  local_6 = param_1;
  local_5 = param_2;
  local_4 = param_3;
  local_3 = param_4;
  *(undefined2 *)0x122 = 0x37;
  *(int *)0x11c = (int)&local_6;
  *(undefined2 *)0x120 = unaff_SS;
  func_0x0000a000(0x1000);
  return *(undefined2 *)0x114;
}



