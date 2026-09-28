/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: WVENCYCL.EXE
 * SHA-256: 1eceb11ab373acfb08bd6a8e59c6bf1c26eec2404293229b84bbc177bb30dbd8
 */

/* ------------------------------------------------------------
 * FUN_1000_2577 @ 1000:2577
 * selected: NE entry/export
 * body bytes: 47
 * completed: true
 */

void __stdcall16far FUN_1000_2577(undefined4 param_1)

{
  undefined2 uVar1;
  undefined4 uVar2;
  
  FUN_1068_03cb();
  uVar2 = FUN_1000_008a(0,0,0xbe,200,0,0,0);
  uVar1 = (undefined2)((ulong)param_1 >> 0x10);
  *(undefined2 *)((int)param_1 + 8) = (int)uVar2;
  *(undefined2 *)((int)param_1 + 10) = (int)((ulong)uVar2 >> 0x10);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0002 @ 1000:0002
 * selected: NE entry/export
 * body bytes: 136
 * completed: true
 */

undefined2 __stdcall16far
FUN_1000_0002(undefined4 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             undefined2 param_5)

{
  undefined2 uVar1;
  undefined4 uVar2;
  undefined4 uVar3;
  
  FUN_1068_03cb();
  uVar2 = FUN_1060_01a0(param_4,param_5);
  uVar3 = FUN_1060_01a0(param_2,param_3);
  uVar2 = FUN_1060_0158(uVar2);
  uVar3 = FUN_1060_0158(uVar3);
  uVar1 = FUN_1050_0588((int)param_1,(int)((ulong)param_1 >> 0x10),uVar3,uVar2);
  FUN_1060_020d(uVar2);
  FUN_1060_020d(uVar3);
  return uVar1;
}



/* ------------------------------------------------------------
 * FUN_1000_008a @ 1000:008a
 * selected: NE entry/export
 * body bytes: 80
 * completed: true
 */

undefined4 __stdcall16far
FUN_1000_008a(undefined4 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             undefined2 param_5,undefined2 param_6)

{
  undefined2 uVar1;
  bool bVar2;
  undefined4 uVar3;
  
  FUN_1068_03cb();
  bVar2 = true;
  FUN_1068_03ef();
  uVar3 = CONCAT22(DAT_1070_92c4,DAT_1070_92c2);
  if (!bVar2) {
    uVar1 = (undefined2)((ulong)param_1 >> 0x10);
    FUN_1048_0002((int)param_1,uVar1,0,param_3,param_4,param_5,param_6);
    uVar3 = FUN_1048_04dd(0,0,0x18c8,0x67,(int)param_1,uVar1);
  }
  DAT_1070_92c4 = (undefined2)((ulong)uVar3 >> 0x10);
  DAT_1070_92c2 = (undefined2)uVar3;
  return param_1;
}



/* ------------------------------------------------------------
 * FUN_1000_00da @ 1000:00da
 * selected: NE entry/export
 * body bytes: 57
 * completed: true
 */

void __stdcall16far FUN_1000_00da(undefined4 param_1)

{
  undefined2 uVar1;
  undefined2 uVar2;
  
  FUN_1068_03cb();
  uVar1 = (undefined2)((ulong)param_1 >> 0x10);
  uVar2 = *(undefined2 *)((int)param_1 + 4);
  WINHELP((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0,0,2,0x16e,
          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1048_007a((int)param_1,uVar1,0);
  FUN_1068_0439(uVar2);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0113 @ 1000:0113
 * selected: NE entry/export
 * body bytes: 124
 * completed: true
 */

void __stdcall16far FUN_1000_0113(undefined4 param_1)

{
  int iVar1;
  undefined2 uVar2;
  
  FUN_1068_03cb();
  uVar2 = (undefined2)((ulong)param_1 >> 0x10);
  iVar1 = (int)param_1;
  FUN_1068_0d12(1,0x9c4,iVar1 + 0x2c,uVar2);
  FUN_1068_0d12(0,25000,iVar1 + 0x9f0,uVar2);
  FUN_1068_0d12(0,0x9c4,iVar1 + -0x6d58,uVar2);
  FUN_1068_0d12(0,0x9c4,iVar1 + -0x6394,uVar2);
  FUN_1068_0d12(0,10000,0x44a2,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0d12(0,10000,0x6bb2,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_157a @ 1000:157a
 * selected: NE entry/export
 * body bytes: 364
 * completed: true
 */

void __stdcall16far FUN_1000_157a(undefined4 param_1)

{
  undefined2 uVar1;
  int iVar2;
  undefined4 uVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined1 local_11a [14];
  undefined2 local_10c;
  char *local_6;
  
  local_6 = (char *)s_This__v__creates_hidden_files__1070_156c + 0x19;
  FUN_1068_03cb();
  DAT_1070_1a90 = 2;
  uVar5 = 0;
  uVar1 = LOADCURSOR((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0x7f02,0);
  SETCURSOR((char *)s_The__v__displays_a_message__1070_114f + 1,uVar1,uVar5);
  uVar1 = (undefined2)((ulong)param_1 >> 0x10);
  iVar2 = (int)param_1;
  FUN_1010_00d1(iVar2,uVar1,0,0);
  FUN_1010_022e(iVar2,uVar1,0x68);
  FUN_1068_08ab(0xff,(undefined1 *)&DAT_1070_1a92,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                (char *)s_This__v__creates_hidden_files__1070_156c + 10,
                (char *)s_There_are_no_other_effects__1070_100b + 5);
  DAT_1070_94cc = '\0';
  local_10c = FUN_1018_000f(0x13,0x45);
  if (DAT_1070_94cc == '\0') {
    FUN_1000_0113(iVar2,uVar1);
    uVar3 = FUN_1050_03ac(0,0,0x58,10,100);
    *(undefined2 *)(iVar2 + 0x26) = (int)uVar3;
    *(undefined2 *)(iVar2 + 0x28) = (int)((ulong)uVar3 >> 0x10);
    *(undefined1 *)((int)*(undefined4 *)(iVar2 + 0x26) + 0xc) = 0;
    FUN_1000_0c97(iVar2,uVar1);
    if (DAT_1070_1a8e == '\0') {
      uVar4 = 0;
      uVar5 = LOADCURSOR(0x1000,0x7f00,0);
      SETCURSOR((char *)s_The__v__displays_a_message__1070_114f + 1,uVar5,uVar4);
      uVar3 = FUN_1068_012d(5);
      uVar5 = (undefined2)((ulong)uVar3 >> 0x10);
      local_6 = (char *)uVar3;
      FUN_1060_009f((char *)s_This__v__creates_hidden_files__1070_156c + 0xc,
                    (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,uVar3);
      DAT_1070_94ca =
           SENDDLGITEMMESSAGE((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,local_6,uVar5
                              ,0,0x410,0x67);
      FUN_1068_0147(5,local_6,uVar5);
      SENDDLGITEMMESSAGE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0,0,
                         DAT_1070_94ca,0x407,0x67);
      SENDDLGITEMMESSAGE((char *)s_The__v__displays_a_message__1070_114f + 1,0,0,DAT_1070_94ca,0x418
                         ,0x67);
      FUN_1000_1783(iVar2,uVar1);
    }
    else {
      FUN_1068_0d3d(0x1000,iVar2,uVar1,local_11a);
    }
  }
  else {
    FUN_1000_00da(iVar2,uVar1,0);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_25a6 @ 1000:25a6
 * selected: NE entry/export
 * body bytes: 35
 * completed: true
 */

char * __stdcall16far FUN_1000_25a6(void)

{
  FUN_1068_03cb();
  return s_bordlg_sands_1070_0228;
}



/* ------------------------------------------------------------
 * FUN_1000_25c9 @ 1000:25c9
 * selected: NE entry/export
 * body bytes: 66
 * completed: true
 */

void __stdcall16far FUN_1000_25c9(undefined4 param_1,undefined4 param_2)

{
  undefined2 uVar1;
  int iVar2;
  undefined2 uVar3;
  
  FUN_1068_03cb();
  uVar3 = (undefined2)((ulong)param_2 >> 0x10);
  iVar2 = (int)param_2;
  FUN_1048_0429((int)param_1,(int)((ulong)param_1 >> 0x10),iVar2,uVar3);
  *(undefined2 *)(iVar2 + 2) = 0x58;
  *(undefined2 *)(iVar2 + 4) = (char *)s_The__v__displays_a_message__1070_114f + 1;
  uVar1 = LOADICON(0x1048,1,0);
  *(undefined2 *)(iVar2 + 0xc) = uVar1;
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0195 @ 1000:0195
 * selected: NE entry/export
 * body bytes: 304
 * completed: true
 */

void __stdcall16far FUN_1000_0195(undefined4 param_1,undefined4 param_2)

{
  undefined1 uVar1;
  int iVar2;
  int iVar3;
  undefined2 uVar4;
  char *pcVar5;
  undefined2 unaff_SS;
  undefined1 *puVar6;
  undefined2 uVar7;
  undefined1 local_204 [256];
  undefined1 local_104 [254];
  undefined2 uStack_6;
  
  uStack_6 = 0x1a0;
  FUN_1068_03cb();
  puVar6 = local_204;
  uVar4 = (undefined2)((ulong)param_1 >> 0x10);
  iVar3 = (int)param_1;
  uVar7 = unaff_SS;
  FUN_1068_0891((uint)*(byte *)(iVar3 + DAT_1070_94ca * 10 + 0x9e6) * 0x3d + 0x238,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(399,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  FUN_1068_0910((uint)*(byte *)(iVar3 + DAT_1070_94ca * 10 + 0x9e7) * 0x3d + 0x3a6,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(399,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  FUN_1068_0910((uint)*(byte *)(iVar3 + DAT_1070_94ca * 10 + 0x9e8) * 0x51 + 0x514,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(399,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  FUN_1068_0910(0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(399,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  pcVar5 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd;
  FUN_1068_08ab(0xff,local_104,unaff_SS,puVar6,uVar7);
  while( true ) {
    iVar2 = FUN_1068_093c(local_104,unaff_SS,0x191,pcVar5);
    if (iVar2 == 0) break;
    uVar1 = FUN_1068_093c(local_104,unaff_SS,0x191,
                          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1010_036d(3,uVar1,local_104,unaff_SS);
    pcVar5 = (char *)s_There_are_no_other_effects__1070_100b + 5;
    FUN_1010_02eb(uVar1,local_104,unaff_SS,
                  (uint)*(byte *)(iVar3 + DAT_1070_94ca * 10 + 0x9ef) * 0x15 + 0x165e,
                  (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  }
  FUN_1068_08ab(0xff,(int)param_2,(int)((ulong)param_2 >> 0x10),local_104,unaff_SS);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_02cb @ 1000:02cb
 * selected: NE entry/export
 * body bytes: 328
 * completed: true
 */

void __stdcall16far FUN_1000_02cb(undefined4 param_1,undefined4 param_2)

{
  int iVar1;
  int iVar2;
  undefined2 uVar3;
  char *pcVar4;
  undefined2 unaff_SS;
  undefined1 *puVar5;
  undefined2 uVar6;
  undefined1 local_204 [257];
  undefined1 local_103;
  undefined1 local_102 [252];
  undefined2 uStack_6;
  
  uStack_6 = 0x2d6;
  FUN_1068_03cb();
  puVar5 = local_204;
  uVar3 = (undefined2)((ulong)param_1 >> 0x10);
  iVar2 = (int)param_1;
  uVar6 = unaff_SS;
  FUN_1068_0891((uint)*(byte *)(iVar2 + DAT_1070_94ca * 10 + 0x9ea) * 0x51 + 0xa76,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(0x2c5,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  FUN_1068_0910((uint)*(byte *)(iVar2 + DAT_1070_94ca * 10 + 0x9eb) * 0x51 + 0xbba,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(0x2c5,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  FUN_1068_0910((uint)*(byte *)(iVar2 + DAT_1070_94ca * 10 + 0x9ec) * 0x5b + 0xe42,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(0x2c5,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  FUN_1068_0910((uint)*(byte *)(iVar2 + DAT_1070_94ca * 10 + 0x9ed) * 0x51 + 0x100a,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(0x2c5,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  pcVar4 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd;
  FUN_1068_08ab(0xff,local_102,unaff_SS,puVar5,uVar6);
  while( true ) {
    iVar1 = FUN_1068_093c(local_102,unaff_SS,0x2c7,pcVar4);
    if (iVar1 == 0) break;
    local_103 = FUN_1068_093c(local_102,unaff_SS,0x2c7,
                              (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1010_036d(3,local_103,local_102,unaff_SS);
    pcVar4 = (char *)s_There_are_no_other_effects__1070_100b + 5;
    FUN_1010_02eb(local_103,local_102,unaff_SS,
                  (uint)*(byte *)(iVar2 + DAT_1070_94ca * 10 + 0x9ef) * 0x15 + 0x165e,
                  (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  }
  FUN_1068_08ab(0xff,(int)param_2,(int)((ulong)param_2 >> 0x10),local_102,unaff_SS);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_04a8 @ 1000:04a8
 * selected: NE entry/export
 * body bytes: 1542
 * completed: true
 */

void __stdcall16far FUN_1000_04a8(undefined4 param_1,undefined4 param_2)

{
  char cVar1;
  undefined1 uVar2;
  undefined1 extraout_AH;
  undefined1 extraout_AH_00;
  undefined2 uVar3;
  int iVar4;
  int iVar5;
  undefined2 uVar6;
  char *pcVar7;
  char *pcVar8;
  undefined2 unaff_SS;
  undefined1 *puVar9;
  undefined2 uVar10;
  undefined1 *puVar11;
  undefined1 *puVar12;
  undefined2 uVar13;
  undefined1 local_58a [256];
  undefined1 local_48a [256];
  undefined1 local_38a [256];
  byte local_28a;
  char local_289;
  undefined1 local_288 [256];
  char local_188;
  byte local_187;
  byte local_186;
  byte local_185;
  undefined1 local_184 [127];
  char acStack_105 [255];
  undefined2 uStack_6;
  
  uStack_6 = 0x4b3;
  FUN_1068_03cb();
  acStack_105[1] = 0;
  uVar6 = (undefined2)((ulong)param_1 >> 0x10);
  iVar5 = (int)param_1;
  if (1 < *(byte *)(iVar5 + DAT_1070_94ca + -0x6395)) {
    puVar12 = local_58a;
    uVar13 = unaff_SS;
    FUN_1068_0891(acStack_105 + 1,unaff_SS);
    puVar11 = local_48a;
    puVar9 = local_38a;
    uVar10 = unaff_SS;
    uVar3 = unaff_SS;
    FUN_1010_0090(*(undefined1 *)(iVar5 + DAT_1070_94ca + -0x6395));
    FUN_1010_025a(0x413,(char *)s_There_are_no_other_effects__1070_100b + 5,puVar9,uVar10);
    FUN_1068_0910(puVar11,uVar3);
    FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar13);
  }
  if (*(char *)(iVar5 + DAT_1070_94ca + -0x6395) == '\x01') {
    puVar12 = local_38a;
    uVar10 = unaff_SS;
    FUN_1068_0891(acStack_105 + 1,unaff_SS);
    FUN_1068_0910(0x437,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar10);
  }
  if (*(char *)(iVar5 + DAT_1070_94ca + -0x6395) != '\0') {
    puVar12 = local_184;
    puVar11 = local_38a;
    uVar10 = unaff_SS;
    uVar3 = unaff_SS;
    FUN_1068_0891(0x99ac,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    FUN_1068_0910(0x457,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_0667(puVar11,uVar10,puVar12,uVar3);
    FUN_1068_06ab(1,local_184,unaff_SS);
    FUN_1068_038f();
    FUN_1068_07fe(*(undefined2 *)(DAT_1070_94ca * 4 + 0x1d8e),
                  *(undefined2 *)(DAT_1070_94ca * 4 + 0x1d90),local_184,unaff_SS);
    FUN_1068_038f();
    FUN_1068_0760(&local_185,unaff_SS);
    FUN_1068_038f();
    local_186 = local_185;
    FUN_1068_0760(&local_185,unaff_SS);
    FUN_1068_038f();
    FUN_1068_0760(&local_185,unaff_SS);
    FUN_1068_038f();
    local_288[0] = 0;
    local_28a = local_186 - 2;
    if (local_28a != 0) {
      local_187 = 1;
      while( true ) {
        FUN_1068_0760(&local_188,unaff_SS);
        FUN_1068_038f();
        puVar12 = local_48a;
        uVar3 = unaff_SS;
        FUN_1068_0891(local_288,unaff_SS);
        puVar11 = local_38a;
        uVar10 = unaff_SS;
        FUN_1068_09ad(CONCAT11(extraout_AH,local_188));
        FUN_1068_0910(puVar11,uVar10);
        FUN_1068_08ab(0xff,local_288,unaff_SS,puVar12,uVar3);
        if (local_187 == local_28a) break;
        local_187 = local_187 + 1;
      }
    }
    FUN_1068_07fe(*(undefined2 *)(DAT_1070_94ca * 4 + 0x449e),
                  *(undefined2 *)(DAT_1070_94ca * 4 + 0x44a0),local_184,unaff_SS);
    FUN_1068_038f();
    FUN_1068_0760(&local_185,unaff_SS);
    FUN_1068_038f();
    local_186 = local_185;
    puVar12 = local_38a;
    uVar10 = unaff_SS;
    FUN_1068_0891(acStack_105 + 1,unaff_SS);
    FUN_1068_0910(0x463,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar10);
    local_28a = local_186;
    if (local_186 != 0) {
      local_187 = 1;
      while( true ) {
        FUN_1068_0760(&local_188,unaff_SS);
        FUN_1068_038f();
        if (local_188 == ',') {
          puVar12 = local_38a;
          uVar10 = unaff_SS;
          FUN_1068_0891(acStack_105 + 1,unaff_SS);
          FUN_1068_0910(0x463,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
          FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar10);
        }
        puVar12 = local_48a;
        uVar3 = unaff_SS;
        FUN_1068_0891(acStack_105 + 1,unaff_SS);
        puVar11 = local_38a;
        uVar10 = unaff_SS;
        FUN_1068_09ad(CONCAT11(extraout_AH_00,local_188));
        FUN_1068_0910(puVar11,uVar10);
        FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar3);
        if ((local_188 == ' ') && (acStack_105[(byte)acStack_105[1]] == ',')) {
          puVar12 = local_38a;
          uVar10 = unaff_SS;
          FUN_1068_0891(acStack_105 + 1,unaff_SS);
          FUN_1068_0910(0x463,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
          FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar10);
        }
        if (local_187 == local_28a) break;
        local_187 = local_187 + 1;
      }
    }
    if (acStack_105[(byte)acStack_105[1] + 1] == ',') {
      acStack_105[1] = acStack_105[1] - 1;
    }
    puVar12 = local_38a;
    uVar10 = unaff_SS;
    FUN_1068_0891(acStack_105 + 1,unaff_SS);
    FUN_1068_0910(0x463,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_0910(0x465,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    pcVar8 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd;
    FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar10);
    local_187 = acStack_105[1] - 2;
    local_289 = '\0';
    do {
      local_187 = local_187 - 1;
      if (acStack_105[local_187 + 1] == ',') {
        pcVar7 = pcVar8;
        if (*(char *)(iVar5 + DAT_1070_94ca + -0x6395) == '\x02') {
          pcVar7 = (char *)s_There_are_no_other_effects__1070_100b + 5;
          FUN_1010_036d(1,local_187,acStack_105 + 1,unaff_SS);
          local_187 = local_187 - 1;
        }
        pcVar8 = (char *)s_There_are_no_other_effects__1070_100b + 5;
        FUN_1010_02eb(local_187 + 1,acStack_105 + 1,unaff_SS,0x468,pcVar7);
        local_289 = '\x01';
      }
    } while (((uint)local_187 != ((uint)(byte)acStack_105[1] - (uint)local_186) - 2) &&
            (local_289 == '\0'));
    puVar12 = local_38a;
    uVar10 = unaff_SS;
    FUN_1068_0891(0x463,pcVar8);
    FUN_1068_0910((undefined1 *)&DAT_1070_1c92,
                  (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    FUN_1068_0910(0x463,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    pcVar8 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd;
    iVar4 = FUN_1068_093c(acStack_105 + 1,unaff_SS,puVar12,uVar10);
    if (iVar4 != 0) {
      puVar12 = local_48a;
      uVar10 = unaff_SS;
      FUN_1068_0891(0x463,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      FUN_1068_0910((undefined1 *)&DAT_1070_1c92,
                    (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
      FUN_1068_0910(0x463,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      cVar1 = FUN_1068_093c(acStack_105 + 1,unaff_SS,puVar12,uVar10);
      FUN_1010_036d(DAT_1070_1c92,cVar1 + '\x01',acStack_105 + 1,unaff_SS);
      pcVar8 = (char *)s_There_are_no_other_effects__1070_100b + 5;
      FUN_1010_02eb(cVar1 + '\x01',acStack_105 + 1,unaff_SS,local_288,unaff_SS);
    }
    while (iVar4 = FUN_1068_093c(acStack_105 + 1,unaff_SS,0x463,pcVar8), iVar4 != 0) {
      pcVar7 = acStack_105 + 1;
      uVar10 = unaff_SS;
      uVar3 = FUN_1068_093c(acStack_105 + 1,unaff_SS,0x463,
                            (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      pcVar8 = (char *)s_There_are_no_other_effects__1070_100b + 5;
      FUN_1010_036d(1,uVar3,pcVar7,uVar10);
    }
    FUN_1068_072c(local_184,unaff_SS);
    FUN_1068_038f();
  }
  if (1 < *(byte *)(iVar5 + DAT_1070_94ca + -0x6d59)) {
    puVar12 = local_58a;
    uVar13 = unaff_SS;
    FUN_1068_0891(acStack_105 + 1,unaff_SS);
    puVar11 = local_48a;
    puVar9 = local_38a;
    uVar10 = unaff_SS;
    uVar3 = unaff_SS;
    FUN_1010_0090(*(undefined1 *)(iVar5 + DAT_1070_94ca + -0x6d59));
    FUN_1010_025a(0x46d,(char *)s_There_are_no_other_effects__1070_100b + 5,puVar9,uVar10);
    FUN_1068_0910(puVar11,uVar3);
    FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar13);
  }
  if (*(char *)(iVar5 + DAT_1070_94ca + -0x6d59) == '\x01') {
    puVar12 = local_38a;
    uVar10 = unaff_SS;
    FUN_1068_0891(acStack_105 + 1,unaff_SS);
    FUN_1068_0910(0x48a,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_08ab(0xff,acStack_105 + 1,unaff_SS,puVar12,uVar10);
  }
  pcVar8 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd;
  DAT_1070_94c8 = (uint)*(byte *)(iVar5 + DAT_1070_94ca + -0x6d59);
  while (iVar4 = FUN_1068_093c(acStack_105 + 1,unaff_SS,0x4a4,pcVar8), iVar4 != 0) {
    uVar2 = FUN_1068_093c(acStack_105 + 1,unaff_SS,0x4a4,
                          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1010_036d(3,uVar2,acStack_105 + 1,unaff_SS);
    pcVar8 = (char *)s_There_are_no_other_effects__1070_100b + 5;
    FUN_1010_02eb(uVar2,acStack_105 + 1,unaff_SS,
                  (uint)*(byte *)(iVar5 + DAT_1070_94ca * 10 + 0x9ef) * 0x15 + 0x165e,
                  (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  }
  FUN_1068_08ab(0xff,(int)param_2,(int)((ulong)param_2 >> 0x10),acStack_105 + 1,unaff_SS);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0c97 @ 1000:0c97
 * selected: NE entry/export
 * body bytes: 2271
 * completed: true
 */

void __stdcall16far FUN_1000_0c97(undefined4 param_1)

{
  char *pcVar1;
  byte bVar2;
  int *piVar3;
  char cVar4;
  int iVar5;
  int iVar6;
  undefined2 unaff_SS;
  bool bVar7;
  undefined4 uVar8;
  undefined1 *puVar9;
  undefined2 uVar10;
  undefined1 *puVar11;
  undefined2 uVar12;
  undefined2 uVar13;
  undefined1 local_16be [256];
  undefined1 local_15be [255];
  byte local_14bf;
  undefined2 local_14ba;
  undefined1 local_14a6;
  byte local_14a5;
  undefined1 local_14a4 [256];
  char local_13a4;
  undefined1 local_13a3 [255];
  undefined4 local_12a4;
  undefined1 local_12a0 [129];
  char local_121f;
  byte local_121e;
  byte local_121d;
  byte local_121c;
  byte local_121b;
  int local_1219;
  int local_1217;
  int local_1215;
  int local_1213;
  byte local_1210 [4096];
  uint local_210;
  int local_20e;
  uint local_20c;
  int local_20a;
  undefined1 local_208 [2];
  uint local_206;
  int local_204;
  undefined1 local_102 [252];
  undefined2 uStack_6;
  
  uStack_6 = 0xca2;
  FUN_1068_03cb();
  DAT_1070_1a8e = 0;
  puVar11 = local_15be;
  uVar12 = unaff_SS;
  FUN_1068_0891(0x99ac,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0910(0xc78,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  cVar4 = FUN_1020_04d7(puVar11,uVar12);
  iVar5 = (int)param_1;
  uVar12 = (undefined2)((ulong)param_1 >> 0x10);
  if (cVar4 == '\0') {
    BWCCMESSAGEBOX((char *)s_There_are_no_other_effects__1070_100b + 0x15,0x10,0x194,
                   (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,0x17c,
                   (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    DAT_1070_1a8e = 1;
  }
  else {
    puVar11 = local_12a0;
    puVar9 = local_15be;
    uVar10 = unaff_SS;
    uVar13 = unaff_SS;
    FUN_1068_0891(0x99ac,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    FUN_1068_0910(0xc78,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_0667(puVar9,uVar10,puVar11,uVar13);
    FUN_1068_06ab(1,local_12a0,unaff_SS);
    FUN_1068_038f();
    local_20a = 0;
    local_210 = 0;
    local_20e = 0;
    local_206 = 0;
    local_121f = '\0';
    FUN_1068_0796(local_208,unaff_SS,0x1000,local_1210,unaff_SS,local_12a0,unaff_SS);
    FUN_1068_038f();
    do {
      local_14a6 = 1;
      bVar2 = local_1210[local_206];
      if (bVar2 == 0xb5) {
        local_20a = local_20a + 1;
        *(int *)(local_20a * 4 + 0x1d8e) = local_206 + local_210 + 1;
        *(int *)(local_20a * 4 + 0x1d90) =
             local_20e + (uint)CARRY2(local_206,local_210) + (uint)(0xfffe < local_206 + local_210);
        uVar8 = FUN_1068_012d(100);
        local_12a4 = uVar8;
        FUN_1068_0cee(local_1210[local_206 + 1] - 2,local_13a3,unaff_SS,local_1210 + local_206 + 4,
                      unaff_SS);
        local_13a4 = local_1210[local_206 + 1] - 2;
        puVar11 = local_15be;
        uVar10 = unaff_SS;
        FUN_1068_0891(&local_13a4,unaff_SS);
        FUN_1068_0910(0xc84,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
        FUN_1068_0910(0xc86,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
        FUN_1068_08ab(0xff,&local_13a4,unaff_SS,puVar11,uVar10);
        FUN_1068_0c72(0xff,local_14a4,unaff_SS,0,local_20a,0);
        puVar11 = local_15be;
        uVar10 = unaff_SS;
        FUN_1068_0891(&local_13a4,unaff_SS);
        FUN_1068_0910(local_14a4,unaff_SS);
        FUN_1068_08ab(0xff,&local_13a4,unaff_SS,puVar11,uVar10);
        FUN_1060_009f(&local_13a4,unaff_SS,local_12a4);
        local_206 = local_206 + local_1210[local_206 + 1] + 2;
        uVar8 = FUN_1060_01a0(local_12a4);
        piVar3 = (int *)*(undefined4 *)(iVar5 + 0x26);
        (*(code *)*(undefined2 *)(*piVar3 + 0x1c))
                  ((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,(int *)piVar3,
                   (int)((ulong)piVar3 >> 0x10),uVar8);
        FUN_1068_0147(100,local_12a4);
        *(undefined1 *)(iVar5 + local_20a + -0x6d59) = 0;
        *(undefined1 *)(iVar5 + local_20a + -0x6395) = 0;
        *(undefined2 *)(local_20a * 4 + 0x449e) = 0;
        *(undefined2 *)(local_20a * 4 + 0x44a0) = 0;
      }
      else if (bVar2 == 0xb6) {
        *(undefined1 *)(iVar5 + local_20a + -0x6395) = 1;
        *(int *)(local_20a * 4 + 0x449e) = local_206 + local_210 + 1;
        *(int *)(local_20a * 4 + 0x44a0) =
             local_20e + (uint)CARRY2(local_206,local_210) + (uint)(0xfffe < local_206 + local_210);
        local_204 = local_206 + 1;
        local_14bf = local_1210[local_206 + 1];
        if (local_14bf != 0) {
          local_14a5 = 1;
          while( true ) {
            if ((local_1210[(uint)local_14a5 + local_204] == 0x2c) &&
               (local_14a5 != local_1210[local_206 + 1])) {
              pcVar1 = (char *)(iVar5 + local_20a + -0x6395);
              *pcVar1 = *pcVar1 + '\x01';
            }
            if (local_14a5 == local_14bf) break;
            local_14a5 = local_14a5 + 1;
          }
        }
        local_13a4 = '\0';
        uVar8 = FUN_1068_012d(100);
        local_14a5 = 0;
        do {
          local_14a5 = local_14a5 + 1;
          local_12a4 = uVar8;
          if (local_1210[(uint)local_14a5 + local_204] != 0x2c) {
            puVar11 = local_16be;
            uVar13 = unaff_SS;
            FUN_1068_0891(&local_13a4,unaff_SS);
            puVar9 = local_15be;
            uVar10 = unaff_SS;
            FUN_1068_09ad(CONCAT11((char)((uint)local_14a5 + local_204 >> 8),
                                   local_1210[(uint)local_14a5 + local_204]));
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,&local_13a4,unaff_SS,puVar11,uVar13);
          }
          if ((local_1210[(uint)local_14a5 + local_204] == 0x2c) ||
             (uVar8 = local_12a4, local_1210[local_204] <= local_14a5)) {
            puVar11 = local_15be;
            uVar10 = unaff_SS;
            FUN_1068_0891(&local_13a4,unaff_SS);
            FUN_1068_0910(0xc84,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            FUN_1068_0910(0xc86,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            FUN_1068_08ab(0xff,&local_13a4,unaff_SS,puVar11,uVar10);
            FUN_1068_0c72(0xff,local_14a4,unaff_SS,0,local_20a,0);
            puVar11 = local_15be;
            uVar10 = unaff_SS;
            FUN_1068_0891(&local_13a4,unaff_SS);
            FUN_1068_0910(local_14a4,unaff_SS);
            FUN_1068_08ab(0xff,&local_13a4,unaff_SS,puVar11,uVar10);
            FUN_1060_009f(&local_13a4,unaff_SS,local_12a4);
            uVar8 = FUN_1060_01a0(local_12a4);
            piVar3 = (int *)*(undefined4 *)(iVar5 + 0x26);
            (*(code *)*(undefined2 *)(*piVar3 + 0x1c))
                      ((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,(int *)piVar3,
                       (int)((ulong)piVar3 >> 0x10),uVar8);
            local_13a4 = '\0';
            local_14a5 = local_14a5 + 1;
            uVar8 = local_12a4;
          }
        } while (local_14a5 < local_1210[local_204]);
        local_12a4 = uVar8;
        FUN_1068_0147(100,uVar8);
        local_206 = local_206 + local_1210[local_204] + 2;
      }
      else if (bVar2 == 0xb7) {
        *(int *)(local_20a * 4 + 0x6bae) = local_206 + local_210 + 1;
        *(int *)(local_20a * 4 + 0x6bb0) =
             local_20e + (uint)CARRY2(local_206,local_210) + (uint)(0xfffe < local_206 + local_210);
        do {
          pcVar1 = (char *)(iVar5 + local_20a + -0x6d59);
          *pcVar1 = *pcVar1 + '\x01';
          local_204 = local_206 + 1;
          local_14bf = local_1210[local_206 + 1];
          if (local_14bf != 0) {
            local_14a5 = 1;
            while( true ) {
              if ((local_1210[(uint)local_14a5 + local_204] == 0x2c) &&
                 (local_14a5 != local_1210[local_206 + 1])) {
                pcVar1 = (char *)(iVar5 + local_20a + -0x6d59);
                *pcVar1 = *pcVar1 + '\x01';
              }
              if (local_14a5 == local_14bf) break;
              local_14a5 = local_14a5 + 1;
            }
          }
          local_206 = local_206 + local_1210[local_206 + 1] + 2;
        } while (local_1210[local_206] == 0xb7);
      }
      else if (bVar2 == 0xb8) {
        local_1219 = 0;
        local_1217 = 0;
        local_1215 = 0;
        local_1213 = 0;
        local_20c = (uint)local_1210[local_206 + 1];
        FUN_1068_0cee(local_20c,&local_121e,unaff_SS,local_1210 + local_206 + 2,unaff_SS);
        *(byte *)(iVar5 + local_20a * 10 + 0x9e6) = local_121e >> 5;
        *(byte *)(iVar5 + local_20a * 10 + 0x9e7) = (local_121e & 0x1c) >> 2;
        *(byte *)(iVar5 + local_20a * 10 + 0x9e8) = local_121d >> 5;
        *(byte *)(iVar5 + local_20a * 10 + 0x9e9) = local_121d & 0xf;
        *(byte *)(iVar5 + local_20a * 10 + 0x9ea) = local_121c >> 6;
        *(byte *)(iVar5 + local_20a * 10 + 0x9eb) = (local_121c & 0x38) >> 3;
        *(byte *)(iVar5 + local_20a * 10 + 0x9ec) = local_121c & 7;
        *(byte *)(iVar5 + local_20a * 10 + 0x9ed) = local_121b & 0x1f;
        *(byte *)(iVar5 + local_20a * 10 + 0x9ee) = local_121e & 1;
        if ((local_121d & 8) == 8) {
          *(undefined1 *)(iVar5 + local_20a * 10 + 0x9ee) = 99;
        }
        if (*(char *)(iVar5 + local_20a * 10 + 0x9ee) == '\0') {
          *(undefined1 *)(iVar5 + local_20a + 0x2b) = 0;
        }
        *(byte *)(iVar5 + local_20a * 10 + 0x9ef) = local_121b >> 5;
        uVar8 = FUN_1068_012d(0x1f);
        iVar6 = iVar5 + local_20a * 4;
        *(undefined2 *)(iVar6 + 0x6b94) = (int)uVar8;
        *(undefined2 *)(iVar6 + 0x6b96) = (int)((ulong)uVar8 >> 0x10);
        if (local_1219 == -1) {
          local_102[0] = 0;
        }
        else if (local_1215 == -1) {
          local_102[0] = 0;
        }
        else {
          local_102[0] = 0;
          if (local_1219 != 0) {
            puVar11 = local_15be;
            uVar13 = unaff_SS;
            FUN_1068_0891(local_102,unaff_SS);
            FUN_1068_0910(0xc88,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            puVar9 = local_16be;
            uVar10 = unaff_SS;
            FUN_1010_0090(local_1219);
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,local_102,unaff_SS,puVar11,uVar13);
          }
          if (local_1217 != 0) {
            puVar11 = local_15be;
            uVar13 = unaff_SS;
            FUN_1068_0891(local_102,unaff_SS);
            FUN_1068_0910(0xc8e,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            puVar9 = local_16be;
            uVar10 = unaff_SS;
            FUN_1010_0090(local_1217);
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,local_102,unaff_SS,puVar11,uVar13);
          }
          if (local_1215 != 0) {
            puVar11 = local_15be;
            uVar13 = unaff_SS;
            FUN_1068_0891(local_102,unaff_SS);
            FUN_1068_0910(0xc90,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            puVar9 = local_16be;
            uVar10 = unaff_SS;
            FUN_1010_0090(local_1215);
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,local_102,unaff_SS,puVar11,uVar13);
          }
          if (local_1213 != 0) {
            puVar11 = local_15be;
            uVar13 = unaff_SS;
            FUN_1068_0891(local_102,unaff_SS);
            FUN_1068_0910(0xc8e,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            puVar9 = local_16be;
            uVar10 = unaff_SS;
            FUN_1010_0090(local_1213);
            FUN_1068_0910(puVar9,uVar10);
            FUN_1068_08ab(0xff,local_102,unaff_SS,puVar11,uVar13);
          }
        }
        uVar8 = *(undefined4 *)(iVar5 + local_20a * 4 + 0x6b94);
        FUN_1068_08ab(0x1e,(int)uVar8,(int)((ulong)uVar8 >> 0x10),local_102,unaff_SS);
        local_206 = local_206 + local_1210[local_206 + 1] + 2;
      }
      else if (bVar2 == 7) {
        local_206 = local_206 + 1;
        if (0xdac < local_206) {
          bVar7 = CARRY2(local_206,local_210);
          local_210 = local_206 + local_210;
          local_20e = local_20e + (uint)bVar7;
          FUN_1068_07fe(local_210,local_20e,local_12a0,unaff_SS);
          FUN_1068_038f();
          local_206 = 0;
          FUN_1068_0796(local_208,unaff_SS,0x1000,local_1210,unaff_SS,local_12a0,unaff_SS);
          FUN_1068_038f();
        }
      }
      else if (bVar2 == 0x20) {
        *(int *)(iVar5 + -0x4648) = local_20a;
        local_121f = '\x01';
      }
    } while (local_121f == '\0');
    FUN_1068_072c(local_12a0,unaff_SS);
    FUN_1068_038f();
    local_14ba = 0;
    FUN_1050_025f((int)*(undefined4 *)(iVar5 + 0x26),
                  (int)((ulong)*(undefined4 *)(iVar5 + 0x26) >> 0x10),0xab0,0x1000);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1783 @ 1000:1783
 * selected: NE entry/export
 * body bytes: 1171
 * completed: true
 */

/* WARNING: Removing unreachable block (ram,0x100017c9) */

void __stdcall16far FUN_1000_1783(undefined4 param_1)

{
  byte bVar1;
  int iVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  int iVar5;
  undefined2 uVar6;
  undefined2 unaff_SS;
  undefined4 uVar7;
  undefined1 *puVar8;
  undefined2 uVar9;
  char *pcVar10;
  undefined1 local_21a [258];
  undefined1 local_118 [258];
  undefined4 local_16;
  undefined4 local_12;
  undefined4 local_e;
  undefined4 local_a;
  undefined2 local_6;
  
  local_6 = 0x178e;
  FUN_1068_03cb();
  uVar6 = (undefined2)((ulong)param_1 >> 0x10);
  iVar5 = (int)param_1;
  iVar2 = SENDDLGITEMMESSAGE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0,0,0,0x409,
                             0x67);
  DAT_1070_94ca = iVar2 + 1;
  uVar7 = FUN_1068_012d(0x32);
  uVar4 = (undefined2)((ulong)uVar7 >> 0x10);
  local_6 = (undefined2)uVar7;
  SENDDLGITEMMESSAGE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,uVar7,
                     DAT_1070_94ca + -1,0x40a,0x67);
  puVar8 = local_21a;
  uVar3 = unaff_SS;
  FUN_1060_017e(local_6,uVar4);
  FUN_1068_08ab(0xff,local_118,unaff_SS,puVar8,uVar3);
  DAT_1070_94ca = *(int *)(iVar5 + DAT_1070_94ca * 2 + -0x59d2);
  FUN_1068_08ab(0xff,(undefined1 *)&DAT_1070_1c92,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,local_118,unaff_SS);
  local_e = FUN_1068_012d(500);
  local_12 = FUN_1068_012d(500);
  local_a = FUN_1068_012d(1000);
  local_16 = FUN_1068_012d(1000);
  FUN_1068_08ab(0xff,0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                (uint)*(byte *)(iVar5 + DAT_1070_94ca * 10 + 0x9e9) * 0x51 + 0x74c,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  if ((*(char *)*(undefined4 *)(iVar5 + DAT_1070_94ca * 4 + 0x6b94) != '\0') &&
     (((bVar1 = *(byte *)(iVar5 + DAT_1070_94ca * 10 + 0x9e9), bVar1 != 0 && (bVar1 < 4)) ||
      ((4 < bVar1 && (bVar1 < 8)))))) {
    uVar7 = *(undefined4 *)(iVar5 + DAT_1070_94ca * 4 + 0x6b94);
    FUN_1068_08ab(0xff,0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,(int)uVar7
                  ,(int)((ulong)uVar7 >> 0x10));
  }
  iVar2 = FUN_1068_093c(0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                        (char *)s_dropper_1070_16dd + 9,
                        (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  if (iVar2 == 0) {
    iVar2 = FUN_1068_093c(0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                          (undefined2 *)&DAT_1070_1720,
                          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    if (iVar2 != 0) {
      FUN_1010_036d(1,1,0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
      puVar8 = local_21a;
      uVar3 = unaff_SS;
      FUN_1010_025a((undefined2 *)&DAT_1070_1726,(char *)s_There_are_no_other_effects__1070_100b + 5
                    ,0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
      FUN_1068_08ab(0xff,0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,puVar8,
                    uVar3);
      pcVar10 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15;
      uVar9 = 0x93c8;
      uVar3 = FUN_1068_093c(0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                            (undefined2 *)&DAT_1070_1720,
                            (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      FUN_1010_036d(5,uVar3,uVar9,pcVar10);
    }
  }
  else {
    iVar2 = FUN_1068_093c(0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,0x16eb,
                          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    if (iVar2 == 0) {
      puVar8 = local_21a;
      uVar3 = unaff_SS;
      FUN_1010_025a(0x16fa,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0x93c8,
                    (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
      FUN_1068_08ab(0xff,0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,puVar8,
                    uVar3);
      pcVar10 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15;
      uVar9 = 0x93c8;
      uVar3 = FUN_1068_093c(0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                            (undefined2 *)&DAT_1070_171a,
                            (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      FUN_1010_036d(5,uVar3,uVar9,pcVar10);
    }
    else {
      puVar8 = local_21a;
      uVar3 = unaff_SS;
      FUN_1068_0891(0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
      FUN_1068_0910(0x16f0,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      FUN_1068_0910((char *)s_virus_1070_16f2,
                    (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      FUN_1068_0910(0x16f8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      FUN_1068_08ab(0xff,0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,puVar8,
                    uVar3);
    }
  }
  if ((*(char *)*(undefined4 *)(iVar5 + DAT_1070_94ca * 4 + 0x6b94) != '\0') &&
     (((bVar1 = *(byte *)(iVar5 + DAT_1070_94ca * 10 + 0x9e9), bVar1 != 0 && (bVar1 < 4)) ||
      ((4 < bVar1 && (bVar1 < 8)))))) {
    puVar8 = local_21a;
    uVar3 = unaff_SS;
    FUN_1068_0891((uint)*(byte *)(iVar5 + DAT_1070_94ca * 10 + 0x9e9) * 0x51 + 0x74c,
                  (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    FUN_1068_0910(0x16f0,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_0910(0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    FUN_1068_08ab(0xff,0x93c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,puVar8,
                  uVar3);
  }
  puVar8 = local_21a;
  uVar3 = unaff_SS;
  uVar7 = local_e;
  FUN_1000_0195(iVar5,uVar6);
  FUN_1060_009f(puVar8,uVar3,uVar7);
  puVar8 = local_21a;
  uVar3 = unaff_SS;
  uVar7 = local_12;
  FUN_1000_02cb(iVar5,uVar6);
  FUN_1060_009f(puVar8,uVar3,uVar7);
  puVar8 = local_21a;
  uVar3 = unaff_SS;
  uVar7 = local_16;
  FUN_1000_04a8(iVar5,uVar6);
  FUN_1060_009f(puVar8,uVar3,uVar7);
  FUN_1060_0158(local_6,uVar4);
  puVar8 = local_21a;
  FUN_1060_017e(local_6,uVar4);
  FUN_1068_08ab(0xff,0x92c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,puVar8,
                unaff_SS);
  uVar7 = FUN_1060_00bd(local_6,uVar4,local_a);
  local_a = uVar7;
  uVar7 = FUN_1060_00bd(0x19a,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,uVar7);
  local_a = uVar7;
  uVar7 = FUN_1060_00bd(local_e,uVar7);
  local_a = uVar7;
  uVar7 = FUN_1060_00bd(local_12,uVar7);
  local_a = uVar7;
  uVar7 = FUN_1060_00bd(local_16,uVar7);
  local_a = uVar7;
  SETDLGITEMTEXT((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,uVar7,0x5b);
  FUN_1068_0147(1000,local_a);
  FUN_1068_0147(500,local_e);
  FUN_1068_0147(500,local_12);
  FUN_1068_0147(1000,local_16);
  if (*(char *)(iVar5 + DAT_1070_94ca + 0x2b) == '\0') {
    if (DAT_1070_1a90 != '\x01') {
      FUN_1010_01b5(iVar5,uVar6,0x1765,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,
                    0xd);
      DAT_1070_1a90 = '\x01';
    }
  }
  else if (DAT_1070_1a90 != '\0') {
    FUN_1010_01b5(iVar5,uVar6,0x1746,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0xd)
    ;
    DAT_1070_1a90 = '\0';
  }
  FUN_1068_0147(0x32,local_6,uVar4);
  if (DAT_1070_94c8 == 0) {
    FUN_1010_003c(iVar5,uVar6,0xb);
  }
  else {
    FUN_1010_0066(iVar5,uVar6,0xb);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1c16 @ 1000:1c16
 * selected: NE entry/export
 * body bytes: 34
 * completed: true
 */

void __stdcall16far FUN_1000_1c16(undefined4 param_1,undefined4 param_2)

{
  FUN_1068_03cb();
  if (*(int *)((int)param_2 + 8) == 1) {
    FUN_1000_1783((int)param_1,(int)((ulong)param_1 >> 0x10));
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1c38 @ 1000:1c38
 * selected: NE entry/export
 * body bytes: 316
 * completed: true
 */

void __stdcall16far FUN_1000_1c38(undefined4 param_1)

{
  undefined2 uVar1;
  undefined2 unaff_SS;
  undefined4 uVar2;
  undefined1 *puVar3;
  undefined2 uVar4;
  undefined1 local_20c [256];
  int local_10c;
  int local_10a;
  int local_108;
  byte local_106 [256];
  undefined2 local_6;
  
  local_6 = 0x1c43;
  FUN_1068_03cb();
  uVar2 = FUN_1068_012d(0xff);
  uVar1 = (undefined2)((ulong)uVar2 >> 0x10);
  local_6 = (undefined2)uVar2;
  GETDLGITEMTEXT((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0xff,uVar2,0x69);
  puVar3 = local_20c;
  uVar4 = unaff_SS;
  FUN_1060_017e(local_6,uVar1);
  FUN_1068_08ab(0xff,local_106,unaff_SS,puVar3,uVar4);
  if (local_106[0] == 0) {
    FUN_1068_0147(0xff,local_6,uVar1);
  }
  else {
    local_108 = SENDDLGITEMMESSAGE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0,0,0,
                                   0x409,0x67);
    if (DAT_1070_1a92 < local_106[0]) {
      local_10c = SENDDLGITEMMESSAGE((char *)s_The__v__displays_a_message__1070_114f + 1,local_6,
                                     uVar1,local_108 + -1,0x410,0x67);
    }
    else {
      local_10c = SENDDLGITEMMESSAGE((char *)s_The__v__displays_a_message__1070_114f + 1,local_6,
                                     uVar1,0,0x410,0x67);
    }
    FUN_1068_0147(0xff,local_6,uVar1);
    if (local_10c != -1) {
      local_10a = SENDDLGITEMMESSAGE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0,0,
                                     local_10c,0x407,0x67);
      if ((local_10a != -1) && (local_10a != local_108)) {
        DAT_1070_94ca = local_10a;
        FUN_1000_1783((int)param_1,(int)((ulong)param_1 >> 0x10));
      }
    }
    FUN_1068_08ab(0xff,(undefined1 *)&DAT_1070_1a92,
                  (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,local_106,unaff_SS);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1e25 @ 1000:1e25
 * selected: NE entry/export
 * body bytes: 517
 * completed: true
 */

void __stdcall16far FUN_1000_1e25(undefined4 param_1)

{
  char cVar1;
  int iVar2;
  undefined2 uVar3;
  char *pcVar4;
  undefined2 unaff_SS;
  undefined1 *puVar5;
  undefined2 uVar6;
  undefined1 *puVar7;
  undefined2 uVar8;
  undefined1 local_320 [256];
  undefined1 local_220 [278];
  undefined2 local_10a;
  char local_108 [256];
  undefined4 local_8;
  
  local_8._2_2_ = 0x1e30;
  FUN_1068_03cb();
  local_8 = FUN_1068_012d(0x46);
  cVar1 = FUN_1008_0002(0x19c,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,&local_10a
                        ,unaff_SS);
  iVar2 = (int)param_1;
  uVar3 = (undefined2)((ulong)param_1 >> 0x10);
  if (cVar1 == '\0') {
    BWCCMESSAGEBOX(0x1008,0x30,0x1f0,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                   0x1bd,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  }
  else {
    FUN_1008_01b4(local_10a,0x1d74,0x1008);
    FUN_1008_01b4(local_10a,0x1d76,0x1008);
    FUN_1008_01b4(local_10a,0x1da2,0x1008);
    FUN_1008_01b4(local_10a,0x1d74,0x1008);
    FUN_1008_01b4(local_10a,0x1dce,0x1008);
    FUN_1008_01b4(local_10a,0x1d74,0x1008);
    FUN_1008_01b4(local_10a,0x92c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    FUN_1008_01b4(local_10a,0x1d74,0x1008);
    FUN_1008_01b4(local_10a,0x1d74,0x1008);
    puVar7 = local_220;
    uVar8 = unaff_SS;
    FUN_1068_0891(0x92c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    FUN_1068_0910(0x1d74,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    puVar5 = local_320;
    uVar6 = unaff_SS;
    FUN_1000_0195(iVar2,uVar3);
    FUN_1068_0910(puVar5,uVar6);
    FUN_1068_08ab(0xff,local_108,unaff_SS,puVar7,uVar8);
    FUN_1008_01b4(local_10a,local_108,unaff_SS);
    FUN_1008_01b4(local_10a,0x1d74,0x1008);
    puVar7 = local_220;
    uVar6 = unaff_SS;
    FUN_1000_02cb(iVar2,uVar3);
    FUN_1068_08ab(0xff,local_108,unaff_SS,puVar7,uVar6);
    FUN_1008_01b4(local_10a,local_108,unaff_SS);
    FUN_1008_01b4(local_10a,0x1d74,0x1008);
    puVar7 = local_220;
    uVar6 = unaff_SS;
    FUN_1000_04a8(iVar2,uVar3);
    pcVar4 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd;
    FUN_1068_08ab(0xff,local_108,unaff_SS,puVar7,uVar6);
    if (local_108[0] != '\0') {
      FUN_1008_01b4(local_10a,local_108,unaff_SS);
      pcVar4 = (char *)0x1008;
      FUN_1008_01b4(local_10a,0x1d74,0x1008);
    }
    FUN_1008_01b4(local_10a,0x1d74,pcVar4);
    if (*(char *)(iVar2 + DAT_1070_94ca + 0x2b) != '\0') {
      puVar7 = local_220;
      FUN_1010_025a(0x1def,0x1008,0x92c8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15
                   );
      FUN_1008_01b4(local_10a,puVar7,unaff_SS);
      FUN_1008_01b4(local_10a,0x1d74,0x1008);
    }
    FUN_1008_02a7(local_10a);
  }
  FUN_1068_0147(0x46,local_8);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_202a @ 1000:202a
 * selected: NE entry/export
 * body bytes: 37
 * completed: true
 */

void __stdcall16far FUN_1000_202a(void)

{
  FUN_1068_03cb();
  WINHELP((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0x1f,0,1,0x1f6,
          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_204f @ 1000:204f
 * selected: NE entry/export
 * body bytes: 50
 * completed: true
 */

void __stdcall16far FUN_1000_204f(undefined4 param_1)

{
  FUN_1068_03cb();
  WINHELP((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0,0,2,0x204,
          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1048_007a((int)param_1,(int)((ulong)param_1 >> 0x10),0);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_2081 @ 1000:2081
 * selected: NE entry/export
 * body bytes: 51
 * completed: true
 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void __stdcall16far FUN_1000_2081(undefined4 param_1)

{
  undefined4 uVar1;
  
  FUN_1068_03cb();
  uVar1 = FUN_1000_008a(0,0,0x116,0x212,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                        (int)param_1,(int)((ulong)param_1 >> 0x10));
  (*(code *)*(undefined2 *)(*_DAT_1070_1822 + 0x38))
            (0x1000,(int *)_DAT_1070_1822,(int)((ulong)_DAT_1070_1822 >> 0x10),uVar1);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_20b4 @ 1000:20b4
 * selected: NE entry/export
 * body bytes: 37
 * completed: true
 */

void __stdcall16far FUN_1000_20b4(void)

{
  FUN_1068_03cb();
  WINHELP((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0x44,0,1,0x21a,
          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_211e @ 1000:211e
 * selected: NE entry/export
 * body bytes: 1113
 * completed: true
 */

void __stdcall16far FUN_1000_211e(undefined4 param_1)

{
  undefined1 extraout_AH;
  undefined1 extraout_AH_00;
  int iVar1;
  undefined2 uVar2;
  undefined2 unaff_SS;
  undefined4 uVar3;
  undefined1 *puVar4;
  undefined2 uVar5;
  undefined1 *puVar6;
  undefined2 uVar7;
  undefined1 *puVar8;
  undefined2 uVar9;
  undefined1 local_592 [254];
  undefined1 local_494 [2];
  undefined1 local_492 [254];
  undefined1 local_394 [2];
  undefined1 local_392 [255];
  char local_293;
  undefined4 local_292;
  undefined1 local_28c [256];
  char local_18c;
  char local_18b;
  char local_18a;
  char local_189;
  undefined1 local_188 [128];
  char local_108;
  char local_107;
  undefined2 local_6;
  
  local_6 = 0x2129;
  FUN_1068_03cb();
  uVar2 = (undefined2)((ulong)param_1 >> 0x10);
  iVar1 = (int)param_1;
  FUN_1010_00d1(iVar1,uVar2,0,0);
  FUN_1040_0d84(iVar1,uVar2);
  uVar3 = FUN_1068_012d(0xff);
  uVar5 = (undefined2)((ulong)uVar3 >> 0x10);
  local_6 = (undefined2)uVar3;
  FUN_1060_009f((undefined1 *)&DAT_1070_1c92,
                (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,uVar3);
  SETWINDOWTEXT((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,local_6,uVar5,
                *(undefined2 *)(iVar1 + 4));
  FUN_1068_0147(0xff,local_6,uVar5);
  local_108 = '\0';
  if (1 < DAT_1070_94c8) {
    puVar8 = local_592;
    uVar9 = unaff_SS;
    FUN_1068_0891(&local_108,unaff_SS);
    puVar6 = local_492;
    puVar4 = local_392;
    uVar5 = unaff_SS;
    uVar7 = unaff_SS;
    FUN_1010_0090(DAT_1070_94c8);
    FUN_1010_025a(0x20d9,(char *)s_There_are_no_other_effects__1070_100b + 5,puVar4,uVar5);
    FUN_1068_0910(puVar6,uVar7);
    FUN_1068_08ab(0xff,&local_108,unaff_SS,puVar8,uVar9);
  }
  if (DAT_1070_94c8 == 1) {
    puVar8 = local_392;
    uVar5 = unaff_SS;
    FUN_1068_0891(&local_108,unaff_SS);
    FUN_1068_0910(0x20f6,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_08ab(0xff,&local_108,unaff_SS,puVar8,uVar5);
  }
  FUN_1010_01b5(iVar1,uVar2,&local_108,unaff_SS,2);
  if (DAT_1070_94c8 != 0) {
    puVar8 = local_188;
    puVar6 = local_392;
    uVar5 = unaff_SS;
    uVar7 = unaff_SS;
    FUN_1068_0891(0x99ac,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    FUN_1068_0910(0x2110,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_0667(puVar6,uVar5,puVar8,uVar7);
    FUN_1068_06ab(1,local_188,unaff_SS);
    FUN_1068_038f();
    FUN_1068_07fe(*(undefined2 *)(DAT_1070_94ca * 4 + 0x1d8e),
                  *(undefined2 *)(DAT_1070_94ca * 4 + 0x1d90),local_188,unaff_SS);
    FUN_1068_038f();
    FUN_1068_0760(&local_189,unaff_SS);
    FUN_1068_038f();
    local_18a = local_189;
    FUN_1068_0760(&local_189,unaff_SS);
    FUN_1068_038f();
    FUN_1068_0760(&local_189,unaff_SS);
    FUN_1068_038f();
    local_28c[0] = 0;
    local_293 = local_18a + -2;
    if (local_293 != '\0') {
      local_18b = '\x01';
      while( true ) {
        FUN_1068_0760(&local_18c,unaff_SS);
        FUN_1068_038f();
        puVar8 = local_494;
        uVar7 = unaff_SS;
        FUN_1068_0891(local_28c,unaff_SS);
        puVar6 = local_394;
        uVar5 = unaff_SS;
        FUN_1068_09ad(CONCAT11(extraout_AH,local_18c));
        FUN_1068_0910(puVar6,uVar5);
        FUN_1068_08ab(0xff,local_28c,unaff_SS,puVar8,uVar7);
        if (local_18b == local_293) break;
        local_18b = local_18b + '\x01';
      }
    }
    FUN_1068_07fe(*(undefined2 *)(DAT_1070_94ca * 4 + 0x6bae),
                  *(undefined2 *)(DAT_1070_94ca * 4 + 0x6bb0),local_188,unaff_SS);
    FUN_1068_038f();
    do {
      FUN_1068_0760(&local_189,unaff_SS);
      FUN_1068_038f();
      local_18a = local_189;
      local_108 = '\0';
      local_293 = local_189;
      if (local_189 != '\0') {
        local_18b = '\x01';
        while( true ) {
          FUN_1068_0760(&local_18c,unaff_SS);
          FUN_1068_038f();
          puVar8 = local_494;
          uVar7 = unaff_SS;
          FUN_1068_0891(&local_108,unaff_SS);
          puVar6 = local_394;
          uVar5 = unaff_SS;
          FUN_1068_09ad(CONCAT11(extraout_AH_00,local_18c));
          FUN_1068_0910(puVar6,uVar5);
          FUN_1068_08ab(0xff,&local_108,unaff_SS,puVar8,uVar7);
          if (local_18c == ',') {
            local_108 = local_108 + -1;
            while (local_107 == ' ') {
              FUN_1010_036d(1,1,&local_108,unaff_SS);
            }
            puVar8 = local_394;
            uVar5 = unaff_SS;
            FUN_1068_0891(local_28c,unaff_SS);
            FUN_1068_0910(0x211c,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
            FUN_1068_0910(&local_108,unaff_SS);
            FUN_1068_08ab(0xff,&local_108,unaff_SS,puVar8,uVar5);
            uVar3 = FUN_1068_012d(0x3c);
            local_292 = uVar3;
            FUN_1060_009f(&local_108,unaff_SS,uVar3);
            FUN_1010_0002(local_292,3,*(undefined2 *)(iVar1 + 4));
            FUN_1068_0147(0x3c,local_292);
            local_108 = '\0';
          }
          if (local_18b == local_293) break;
          local_18b = local_18b + '\x01';
        }
      }
      if (local_108 != '\0') {
        while (local_107 == ' ') {
          FUN_1010_036d(1,1,&local_108,unaff_SS);
        }
        puVar8 = local_392;
        uVar5 = unaff_SS;
        FUN_1068_0891(local_28c,unaff_SS);
        FUN_1068_0910(0x211c,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
        FUN_1068_0910(&local_108,unaff_SS);
        FUN_1068_08ab(0xff,&local_108,unaff_SS,puVar8,uVar5);
        uVar3 = FUN_1068_012d(0x3c);
        local_292 = uVar3;
        FUN_1060_009f(&local_108,unaff_SS,uVar3);
        FUN_1010_0002(local_292,3,*(undefined2 *)(iVar1 + 4));
        FUN_1068_0147(0x3c,local_292);
      }
      FUN_1068_0760(&local_18c,unaff_SS);
      FUN_1068_038f();
    } while (local_18c == -0x49);
    FUN_1068_072c(local_188,unaff_SS);
    FUN_1068_038f();
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0ab0 @ 1000:0ab0
 * selected: NE entry/export
 * body bytes: 456
 * completed: true
 */

void __stdcall16far FUN_1000_0ab0(int param_1,undefined2 param_2,undefined2 param_3)

{
  char cVar1;
  int iVar2;
  undefined2 uVar3;
  int iVar4;
  undefined2 unaff_SS;
  undefined4 uVar5;
  undefined1 *puVar6;
  undefined2 uVar7;
  undefined1 local_102 [252];
  undefined2 uStack_6;
  
  uStack_6 = 0xabb;
  FUN_1068_03cb();
  puVar6 = local_102;
  uVar3 = unaff_SS;
  FUN_1060_017e(param_2,param_3);
  FUN_1068_08ab(0xff,param_1 + -0x13a2,unaff_SS,puVar6,uVar3);
  puVar6 = local_102;
  iVar4 = param_1 + -0x13a2;
  uVar3 = unaff_SS;
  uVar7 = unaff_SS;
  iVar2 = FUN_1068_093c(param_1 + -0x13a2,unaff_SS,0xaae,
                        (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  FUN_1068_08cf(10,iVar2 + 1,iVar4,uVar3);
  uVar3 = FUN_1068_0cbd(param_1 + -0x14ba,unaff_SS,puVar6,uVar7);
  *(undefined2 *)(param_1 + -0x14bc) = uVar3;
  if (*(char *)((int)*(undefined4 *)(param_1 + 6) + *(int *)(param_1 + -0x14bc) * 10 + 0x9ee) != 'c'
     ) {
    puVar6 = local_102;
    uVar3 = unaff_SS;
    FUN_1060_017e(param_2,param_3);
    FUN_1068_08ab(0xff,param_1 + -0x13a2,unaff_SS,puVar6,uVar3);
    iVar2 = FUN_1068_093c(param_1 + -0x13a2,unaff_SS,0xaae,
                          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    if (1 < iVar2) {
      cVar1 = FUN_1068_093c(param_1 + -0x13a2,unaff_SS,0xaae,
                            (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
      *(char *)(param_1 + -0x13a2) = cVar1 + -2;
    }
    uVar5 = FUN_1068_012d(0x23);
    *(undefined2 *)(param_1 + -0x12a2) = (int)uVar5;
    *(undefined2 *)(param_1 + -0x12a0) = (int)((ulong)uVar5 >> 0x10);
    FUN_1060_009f(param_1 + -0x13a2,unaff_SS,*(undefined2 *)(param_1 + -0x12a2),
                  *(undefined2 *)(param_1 + -0x12a0));
    FUN_1010_0002(*(undefined2 *)(param_1 + -0x12a2),*(undefined2 *)(param_1 + -0x12a0),0x67,
                  *(undefined2 *)((int)*(undefined4 *)(param_1 + 6) + 4));
    FUN_1068_0147(0x23,*(undefined2 *)(param_1 + -0x12a2),*(undefined2 *)(param_1 + -0x12a0));
    *(int *)(param_1 + -0x14b8) = *(int *)(param_1 + -0x14b8) + 1;
    puVar6 = local_102;
    uVar3 = unaff_SS;
    FUN_1060_017e(param_2,param_3);
    FUN_1068_08ab(0xff,param_1 + -0x13a2,unaff_SS,puVar6,uVar3);
    puVar6 = local_102;
    iVar4 = param_1 + -0x13a2;
    uVar3 = unaff_SS;
    uVar7 = unaff_SS;
    iVar2 = FUN_1068_093c(param_1 + -0x13a2,unaff_SS,0xaae,
                          (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
    FUN_1068_08cf(10,iVar2 + 1,iVar4,uVar3);
    uVar3 = FUN_1068_0cbd(param_1 + -0x14ba,unaff_SS,puVar6,uVar7);
    *(undefined2 *)(param_1 + -0x14bc) = uVar3;
    *(undefined2 *)((int)*(undefined4 *)(param_1 + 6) + *(int *)(param_1 + -0x14b8) * 2 + -0x59d2) =
         *(undefined2 *)(param_1 + -0x14bc);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1008_0002 @ 1008:0002
 * selected: NE entry/export
 * body bytes: 256
 * completed: true
 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

bool __stdcall16far FUN_1008_0002(undefined2 param_1,undefined2 param_2,int *param_3)

{
  undefined1 *puVar1;
  int iVar2;
  undefined2 uVar3;
  int unaff_BP;
  undefined2 unaff_SS;
  bool bVar4;
  undefined2 uVar5;
  
  FUN_1068_03cb((char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,unaff_BP + 1);
  GETPROFILESTRING((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0x50,
                   (undefined1 *)&DAT_1070_96f0,
                   (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                   (char *)s_device_1070_170e + 7,
                   (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                   (char *)s_device_1070_170e,
                   (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,
                   (char *)s_windows_1070_1706);
  if (DAT_1070_96f0 == '\0') {
    bVar4 = false;
  }
  else {
    DAT_1070_96e0 =
         (undefined1 *)
         FUN_1060_0109(0x2c,(undefined1 *)&DAT_1070_96f0,
                       (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    DAT_1070_96ea = (undefined2)((ulong)DAT_1070_96e0 >> 0x10);
    DAT_1070_96e4 = (undefined1 *)&DAT_1070_96f0;
    DAT_1070_96e6 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15;
    DAT_1070_96e8 = (undefined1 *)DAT_1070_96e0 + 1;
    *DAT_1070_96e0 = 0;
    _DAT_1070_96ec = (undefined1 *)FUN_1060_0109(0x2c,DAT_1070_96e8,DAT_1070_96ea);
    *_DAT_1070_96ec = 0;
    puVar1 = DAT_1070_96ec + 1;
    _DAT_1070_96ec = (undefined1 *)CONCAT22(DAT_1070_96ee,puVar1);
    iVar2 = CREATEDC((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,0,0,puVar1,
                     DAT_1070_96ee,DAT_1070_96e4,DAT_1070_96e6,DAT_1070_96e8);
    *param_3 = iVar2;
    DAT_1070_96de = 1;
    if (*param_3 != 0) {
      uVar5 = 10;
      uVar3 = FUN_1060_0002(param_1,param_2);
      ESCAPE((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,0,0,&param_1,unaff_SS,uVar3,
             uVar5);
    }
    bVar4 = *param_3 != 0;
  }
  return bVar4;
}



/* ------------------------------------------------------------
 * FUN_1008_0102 @ 1008:0102
 * selected: NE entry/export
 * body bytes: 176
 * completed: true
 */

void __stdcall16far FUN_1008_0102(undefined2 param_1,byte *param_2)

{
  byte *pbVar1;
  byte *pbVar2;
  uint uVar3;
  byte *pbVar4;
  char *pcVar5;
  undefined2 unaff_SS;
  undefined4 uVar6;
  byte local_104;
  byte abStack_103 [251];
  undefined2 uStack_8;
  
  uStack_8 = 0x10f;
  FUN_1068_03cb();
  pbVar4 = (byte *)param_2;
  local_104 = *param_2;
  pbVar2 = abStack_103;
  for (uVar3 = (uint)local_104; pbVar4 = pbVar4 + 1, uVar3 != 0; uVar3 = uVar3 - 1) {
    pbVar1 = pbVar2;
    pbVar2 = pbVar2 + 1;
    *pbVar1 = *pbVar4;
  }
  uVar6 = FUN_1068_012d(local_104 + 1);
  pcVar5 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 5;
  FUN_1060_009f(&local_104,unaff_SS,uVar6);
  if (DAT_1070_96de == 0x3c) {
    pcVar5 = (char *)s_The__v__displays_a_message__1070_114f + 1;
    ESCAPE((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,0,0,0,0,0,1);
    DAT_1070_96de = 1;
  }
  TEXTOUT(pcVar5,local_104,uVar6,DAT_1070_96de * 0x32,10);
  DAT_1070_96de = DAT_1070_96de + 1;
  FUN_1068_0147(local_104 + 1,uVar6);
  return;
}



/* ------------------------------------------------------------
 * FUN_1008_01b4 @ 1008:01b4
 * selected: NE entry/export
 * body bytes: 243
 * completed: true
 */

void __stdcall16far FUN_1008_01b4(undefined2 param_1,byte *param_2)

{
  byte *pbVar1;
  byte *pbVar2;
  int iVar3;
  int iVar4;
  uint uVar5;
  byte *pbVar6;
  undefined2 unaff_SS;
  undefined1 uVar7;
  undefined1 *puVar8;
  undefined2 uVar9;
  undefined1 local_406 [256];
  undefined1 local_306 [256];
  undefined2 local_206;
  byte local_204;
  char local_203;
  byte local_104;
  byte abStack_103 [251];
  undefined2 uStack_8;
  
  uStack_8 = 0x1c1;
  FUN_1068_03cb();
  pbVar6 = (byte *)param_2;
  local_104 = *param_2;
  pbVar2 = abStack_103;
  for (uVar5 = (uint)local_104; pbVar6 = pbVar6 + 1, uVar5 != 0; uVar5 = uVar5 - 1) {
    pbVar1 = pbVar2;
    pbVar2 = pbVar2 + 1;
    *pbVar1 = *pbVar6;
  }
  FUN_1068_08ab(0xff,local_306,unaff_SS,&local_104,unaff_SS);
  do {
    FUN_1068_08ab(0xff,&local_204,unaff_SS,&local_104,unaff_SS);
    if (0x46 < local_204) {
      local_206 = 0x47;
      do {
        iVar4 = local_206 + -1;
        iVar3 = local_206 + 1;
        local_206 = iVar4;
      } while (*(char *)((int)&local_206 + iVar3) != ' ');
      puVar8 = local_406;
      uVar9 = unaff_SS;
      FUN_1068_08cf(iVar4,1,&local_104,unaff_SS);
      FUN_1068_08ab(0xff,&local_204,unaff_SS,puVar8,uVar9);
    }
    uVar7 = 1;
    FUN_1068_0a39(local_204,1,&local_104,unaff_SS);
    FUN_1068_0982(0x1b2,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,local_306,
                  unaff_SS);
    if (!(bool)uVar7) {
      while (local_203 == ' ') {
        FUN_1068_0a39(1,1,&local_204,unaff_SS);
      }
    }
    FUN_1008_0102(param_1,&local_204,unaff_SS);
  } while (local_104 != 0);
  return;
}



/* ------------------------------------------------------------
 * FUN_1008_02a7 @ 1008:02a7
 * selected: NE entry/export
 * body bytes: 67
 * completed: true
 */

void __stdcall16far FUN_1008_02a7(undefined2 param_1)

{
  int unaff_BP;
  undefined2 uVar1;
  undefined2 uVar2;
  
  FUN_1068_03cb((char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,unaff_BP + 1);
  uVar2 = param_1;
  ESCAPE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0,0,0,0,0,1);
  uVar1 = param_1;
  ESCAPE((char *)s_The__v__displays_a_message__1070_114f + 1,0,0,0,0,0,0xb);
  DELETEDC((char *)s_The__v__displays_a_message__1070_114f + 1,param_1,uVar1,uVar2);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_03b6 @ 1010:03b6
 * selected: NE entry/export
 * body bytes: 32
 * completed: true
 */

void __cdecl16far FUN_1010_03b6(void)

{
  FUN_1068_03cb();
  DAT_1070_9945 = FUN_1068_0d26(0x79);
  DAT_1070_9946 = FUN_1068_0d26(0x6e);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_003c @ 1010:003c
 * selected: NE entry/export
 * body bytes: 42
 * completed: true
 */

void __stdcall16far FUN_1010_003c(undefined2 param_1,undefined2 param_2,undefined2 param_3)

{
  int unaff_BP;
  
  FUN_1068_03cb((char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,unaff_BP + 1);
  GETDLGITEM((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,param_3);
  ENABLEWINDOW((char *)s_The__v__displays_a_message__1070_114f + 1,0);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_0066 @ 1010:0066
 * selected: NE entry/export
 * body bytes: 42
 * completed: true
 */

void __stdcall16far FUN_1010_0066(undefined2 param_1,undefined2 param_2,undefined2 param_3)

{
  int unaff_BP;
  
  FUN_1068_03cb((char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,unaff_BP + 1);
  GETDLGITEM((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,param_3);
  ENABLEWINDOW((char *)s_The__v__displays_a_message__1070_114f + 1,1);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_00d1 @ 1010:00d1
 * selected: NE entry/export
 * body bytes: 140
 * completed: true
 */

void __stdcall16far FUN_1010_00d1(undefined2 param_1,undefined2 param_2,int param_3,int param_4)

{
  int iVar1;
  int iVar2;
  int unaff_CS;
  undefined2 unaff_SS;
  int local_c;
  int local_a;
  int local_8;
  
  local_8 = 0xde;
  FUN_1068_03cb();
  iVar1 = GETSYSTEMMETRICS((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0);
  iVar2 = GETSYSTEMMETRICS((char *)s_The__v__displays_a_message__1070_114f + 1,1);
  GETWINDOWRECT((char *)s_The__v__displays_a_message__1070_114f + 1,&local_c,unaff_SS);
  SETWINDOWPOS((char *)s_The__v__displays_a_message__1070_114f + 1,5,unaff_CS,local_8,
               (iVar2 / 2 - (unaff_CS - local_a) / 2) + param_3,
               (iVar1 / 2 - (local_8 - local_c) / 2) + param_4,0);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_015d @ 1010:015d
 * selected: NE entry/export
 * body bytes: 88
 * completed: true
 */

void __stdcall16far FUN_1010_015d(void)

{
  int iVar1;
  char *pcVar2;
  undefined2 unaff_SS;
  undefined1 local_16 [14];
  undefined2 uStack_8;
  
  pcVar2 = (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd;
  uStack_8 = 0x16a;
  FUN_1068_03cb();
  while( true ) {
    iVar1 = PEEKMESSAGE(pcVar2,1,0,0,0,local_16,unaff_SS);
    if (iVar1 == 0) break;
    iVar1 = ISDIALOGMESSAGE((char *)s_The__v__displays_a_message__1070_114f + 1,local_16,unaff_SS);
    if (iVar1 == 0) {
      TRANSLATEMESSAGE((char *)s_The__v__displays_a_message__1070_114f + 1,local_16);
      DISPATCHMESSAGE((char *)s_The__v__displays_a_message__1070_114f + 1,local_16);
    }
    pcVar2 = (char *)s_The__v__displays_a_message__1070_114f + 1;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_01b5 @ 1010:01b5
 * selected: NE entry/export
 * body bytes: 121
 * completed: true
 */

void __stdcall16far
FUN_1010_01b5(undefined2 param_1,undefined2 param_2,byte *param_3,undefined2 param_4)

{
  byte *pbVar1;
  byte *pbVar2;
  uint uVar3;
  byte *pbVar4;
  undefined2 unaff_SS;
  undefined4 uVar5;
  byte local_104;
  byte abStack_103 [251];
  undefined2 uStack_8;
  
  uStack_8 = 0x1c2;
  FUN_1068_03cb();
  pbVar4 = (byte *)param_3;
  local_104 = *param_3;
  pbVar2 = abStack_103;
  for (uVar3 = (uint)local_104; pbVar4 = pbVar4 + 1, uVar3 != 0; uVar3 = uVar3 - 1) {
    pbVar1 = pbVar2;
    pbVar2 = pbVar2 + 1;
    *pbVar1 = *pbVar4;
  }
  uVar5 = FUN_1068_012d(0x100);
  FUN_1060_009f(&local_104,unaff_SS,uVar5);
  SETDLGITEMTEXT((char *)s__This__v__overwrites_infected_fi_1070_105b + 5,uVar5,param_4);
  FUN_1068_0147(0x100,uVar5);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_022e @ 1010:022e
 * selected: NE entry/export
 * body bytes: 41
 * completed: true
 */

void __stdcall16far FUN_1010_022e(undefined4 param_1,undefined2 param_2)

{
  int unaff_BP;
  
  FUN_1068_03cb((char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,unaff_BP + 1);
  FUN_1048_0345((int)param_1,(int)((ulong)param_1 >> 0x10),0,0,1,0x401,param_2);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_0002 @ 1010:0002
 * selected: NE entry/export
 * body bytes: 58
 * completed: true
 */

void __stdcall16far
FUN_1010_0002(undefined2 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4)

{
  int unaff_BP;
  long lVar1;
  
  FUN_1068_03cb((char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,unaff_BP + 1);
  lVar1 = SENDDLGITEMMESSAGE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,param_1,
                             param_2,0,0x401,param_3);
  if (lVar1 == -1) {
    MESSAGEBEEP((char *)s_The__v__displays_a_message__1070_114f + 1,1,param_4);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_0090 @ 1010:0090
 * selected: NE entry/export
 * body bytes: 65
 * completed: true
 */

void __stdcall16far FUN_1010_0090(int param_1,undefined4 param_2)

{
  undefined2 unaff_SS;
  undefined1 local_104 [252];
  undefined2 uStack_8;
  
  uStack_8 = 0x9d;
  FUN_1068_03cb();
  FUN_1068_0c72(0xff,local_104,unaff_SS,0,param_1,param_1 >> 0xf);
  FUN_1068_08ab(0xff,(int)param_2,(int)((ulong)param_2 >> 0x10),local_104,unaff_SS);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_025a @ 1010:025a
 * selected: NE entry/export
 * body bytes: 145
 * completed: true
 */

void __stdcall16far FUN_1010_025a(byte *param_1,byte *param_2,undefined4 param_3)

{
  byte *pbVar1;
  byte *pbVar2;
  int iVar3;
  uint uVar4;
  byte *pbVar5;
  undefined2 unaff_SS;
  byte local_204;
  byte abStack_203 [255];
  byte local_104;
  byte abStack_103 [251];
  undefined2 uStack_8;
  
  uStack_8 = 0x267;
  FUN_1068_03cb();
  pbVar5 = (byte *)param_2;
  local_104 = *param_2;
  pbVar2 = abStack_103;
  for (uVar4 = (uint)local_104; pbVar5 = pbVar5 + 1, uVar4 != 0; uVar4 = uVar4 - 1) {
    pbVar1 = pbVar2;
    pbVar2 = pbVar2 + 1;
    *pbVar1 = *pbVar5;
  }
  pbVar5 = (byte *)param_1;
  local_204 = *param_1;
  pbVar2 = abStack_203;
  for (uVar4 = (uint)local_204; pbVar5 = pbVar5 + 1, uVar4 != 0; uVar4 = uVar4 - 1) {
    pbVar1 = pbVar2;
    pbVar2 = pbVar2 + 1;
    *pbVar1 = *pbVar5;
  }
  iVar3 = FUN_1068_093c(&local_204,unaff_SS,599,
                        (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  if (0 < iVar3) {
    FUN_1010_036d(2,iVar3,&local_204,unaff_SS);
    FUN_1010_02eb(iVar3,&local_204,unaff_SS,&local_104,unaff_SS);
  }
  FUN_1068_08ab(0xff,(int)param_3,(int)((ulong)param_3 >> 0x10),&local_204,unaff_SS);
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_02eb @ 1010:02eb
 * selected: NE entry/export
 * body bytes: 130
 * completed: true
 */

void __stdcall16far FUN_1010_02eb(int param_1,char *param_2,byte *param_3)

{
  byte bVar1;
  byte *pbVar2;
  byte *pbVar3;
  uint uVar4;
  byte *pbVar5;
  char *pcVar6;
  undefined2 uVar7;
  undefined2 unaff_SS;
  byte local_103 [251];
  undefined2 uStack_8;
  
  uStack_8 = 0x2f8;
  FUN_1068_03cb();
  pbVar5 = (byte *)param_3;
  bVar1 = *param_3;
  pbVar3 = local_103;
  for (uVar4 = (uint)bVar1; pbVar5 = pbVar5 + 1, uVar4 != 0; uVar4 = uVar4 - 1) {
    pbVar2 = pbVar3;
    pbVar3 = pbVar3 + 1;
    *pbVar2 = *pbVar5;
  }
  uVar7 = (undefined2)((ulong)param_2 >> 0x10);
  pcVar6 = (char *)param_2;
  FUN_1068_0cee((uint)(byte)(*param_2 + 1) - param_1,pcVar6 + (uint)bVar1 + param_1,uVar7,
                pcVar6 + param_1,uVar7);
  FUN_1068_0cee(bVar1,pcVar6 + param_1,uVar7,local_103,unaff_SS);
  *param_2 = *param_2 + bVar1;
  return;
}



/* ------------------------------------------------------------
 * FUN_1010_036d @ 1010:036d
 * selected: NE entry/export
 * body bytes: 73
 * completed: true
 */

void __stdcall16far FUN_1010_036d(int param_1,int param_2,char *param_3)

{
  int unaff_BP;
  undefined2 uVar1;
  
  FUN_1068_03cb((char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,unaff_BP + 1);
  uVar1 = (undefined2)((ulong)param_3 >> 0x10);
  FUN_1068_0cee(((uint)(byte)(*param_3 + 1) - param_2) - param_1,(char *)param_3 + param_2,uVar1,
                (char *)param_3 + param_2 + param_1,uVar1);
  *param_3 = *param_3 - (char)param_1;
  return;
}



/* ------------------------------------------------------------
 * FUN_1018_01aa @ 1018:01aa
 * selected: NE entry/export
 * body bytes: 32
 * completed: true
 */

void __cdecl16far FUN_1018_01aa(void)

{
  FUN_1068_03cb();
  DAT_1070_9958 = 0;
  DAT_1070_9955 = 0;
  DAT_1070_9956 = 0;
  DAT_1070_9954 = 0;
  return;
}



/* ------------------------------------------------------------
 * FUN_1018_000f @ 1018:000f
 * selected: NE entry/export
 * body bytes: 411
 * completed: true
 */

undefined2 __stdcall16far FUN_1018_000f(int param_1,char param_2)

{
  undefined1 uVar1;
  int iVar2;
  undefined1 extraout_AH;
  undefined1 extraout_AH_00;
  undefined2 unaff_SS;
  undefined1 *puVar3;
  undefined2 uVar4;
  undefined1 *puVar5;
  undefined2 uVar6;
  undefined1 local_13bc [256];
  undefined1 local_12bc [2];
  undefined1 local_12ba [254];
  uint local_11bc;
  uint local_11b6;
  undefined1 local_19a [100];
  undefined1 local_136 [100];
  undefined1 local_d2 [100];
  undefined1 local_6e [100];
  undefined1 local_a;
  undefined1 local_9;
  undefined2 uStack_8;
  
  uStack_8 = 0x1c;
  FUN_1068_03cb();
  DAT_1070_9a00 = 0;
  iVar2 = FUN_1068_0866();
  if (0 < iVar2) {
    local_11bc = FUN_1068_0866();
    if (local_11bc != 0) {
      local_11b6 = 1;
      while( true ) {
        puVar5 = local_13bc;
        uVar6 = unaff_SS;
        FUN_1068_0891((undefined1 *)&DAT_1070_9a00,
                      (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
        puVar3 = local_12bc;
        uVar4 = unaff_SS;
        FUN_1068_082e(local_11b6);
        FUN_1068_0910(puVar3,uVar4);
        FUN_1068_0910(2,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
        FUN_1068_08ab(0xff,(undefined1 *)&DAT_1070_9a00,
                      (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,puVar5,uVar6);
        if (local_11b6 == local_11bc) break;
        local_11b6 = local_11b6 + 1;
      }
    }
    local_11bc = (uint)DAT_1070_9a00;
    if (local_11bc != 0) {
      local_11b6 = 1;
      while( true ) {
        uVar1 = FUN_1068_0d26(((undefined1 *)&DAT_1070_9a00)[local_11b6]);
        ((undefined1 *)&DAT_1070_9a00)[local_11b6] = uVar1;
        if (local_11b6 == local_11bc) break;
        local_11b6 = local_11b6 + 1;
      }
    }
  }
  iVar2 = FUN_1068_093c((undefined1 *)&DAT_1070_9a00,
                        (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,4,
                        (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  if ((iVar2 == 0) && (param_1 < 0x65)) {
    if (param_2 != 'V') {
      DAT_1070_9b00 = FUN_1068_0866();
    }
  }
  else {
    iVar2 = FUN_1068_0866();
    DAT_1070_9b00 = iVar2 + -1;
  }
  puVar5 = local_12ba;
  uVar4 = unaff_SS;
  FUN_1068_082e(0);
  FUN_1068_08ab(0x50,0x995a,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,puVar5,uVar4
               );
  FUN_1060_009f(0x995a,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,local_6e,unaff_SS
               );
  FUN_1038_0002(local_19a,unaff_SS,local_136,unaff_SS,local_d2,unaff_SS,local_6e,unaff_SS);
  puVar5 = local_12ba;
  uVar4 = unaff_SS;
  FUN_1060_017e(local_d2,unaff_SS);
  FUN_1068_08ab(0x50,0x99ac,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,puVar5,uVar4
               );
  FUN_1068_08ab(3,&local_a,unaff_SS,8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  DAT_1070_99fd = FUN_1068_0d26(CONCAT11(extraout_AH,local_9));
  FUN_1068_08ab(3,&local_a,unaff_SS,0xc,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
  DAT_1070_99fe = FUN_1068_0d26(CONCAT11(extraout_AH_00,local_9));
  return 0;
}



/* ------------------------------------------------------------
 * FUN_1020_052f @ 1020:052f
 * selected: NE entry/export
 * body bytes: 42
 * completed: true
 */

void __cdecl16far FUN_1020_052f(void)

{
  FUN_1068_03cb();
  DAT_1070_9d18 = 0;
  while (((undefined2 *)&DAT_1070_9c18)[DAT_1070_9d18] = 0, DAT_1070_9d18 != 0x1f) {
    DAT_1070_9d18 = DAT_1070_9d18 + 1;
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1020_0002 @ 1020:0002
 * selected: NE entry/export
 * body bytes: 43
 * completed: true
 */

undefined1 __stdcall16far FUN_1020_0002(void)

{
  code *pcVar1;
  int unaff_BP;
  undefined1 uVar2;
  
  uVar2 = 0;
  FUN_1068_03cb((char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,unaff_BP + 1);
  pcVar1 = (code *)swi(0x31);
  (*pcVar1)();
  return uVar2;
}



/* ------------------------------------------------------------
 * FUN_1020_002d @ 1020:002d
 * selected: NE entry/export
 * body bytes: 574
 * completed: true
 */

undefined2 __stdcall16far
FUN_1020_002d(int param_1,int param_2,undefined4 param_3,undefined4 param_4,undefined2 *param_5,
             undefined1 param_6)

{
  undefined2 *puVar1;
  undefined2 uVar2;
  undefined2 uVar3;
  char *pcVar4;
  undefined2 unaff_SS;
  undefined2 uVar5;
  undefined2 local_52;
  undefined2 local_50;
  undefined2 local_4e;
  undefined2 local_4c;
  undefined2 local_42;
  undefined2 local_40;
  undefined2 local_3e;
  undefined2 local_3c;
  undefined2 local_3a;
  undefined2 local_38;
  undefined2 local_36;
  undefined2 local_34;
  undefined2 local_32;
  undefined2 local_30;
  undefined2 local_2e;
  long local_20;
  long local_1c;
  undefined2 local_18;
  undefined2 local_16;
  undefined2 local_14;
  undefined2 local_12;
  int local_10;
  undefined4 local_e;
  undefined2 local_a;
  undefined2 local_8;
  undefined2 uVar6;
  
  local_8 = 0x3a;
  FUN_1068_03cb();
  FUN_1068_0d12(0,0x32,&local_52,unaff_SS);
  uVar2 = (undefined2)((ulong)param_4 >> 0x10);
  puVar1 = (undefined2 *)param_5;
  uVar6 = (undefined2)((ulong)param_5 >> 0x10);
  if (param_2 == 0) {
    local_2e = puVar1[7];
    local_3e = puVar1[3];
  }
  else {
    local_1c = GLOBALDOSALLOC((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,param_2);
    local_16 = (undefined2)((ulong)local_1c >> 0x10);
    local_12 = (undefined2)local_1c;
    if (local_1c == 0) {
      return 0xffff;
    }
    local_1c = local_1c << 0x10;
    local_a = local_12;
    local_8 = local_16;
    FUN_1068_0cee(param_2,0,local_12,(int)param_4,uVar2);
    local_3e = 0;
    local_2e = local_16;
  }
  local_3c = 0;
  uVar3 = (undefined2)((ulong)param_3 >> 0x10);
  if (param_1 == 0) {
    local_30 = puVar1[8];
    local_42 = puVar1[1];
  }
  else {
    uVar5 = 0;
    local_e = GLOBALDOSALLOC((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,param_1);
    local_18 = (undefined2)((ulong)local_e >> 0x10);
    local_14 = (undefined2)local_e;
    if (local_e == 0) {
      if (param_2 == 0) {
        return 0xffff;
      }
      GLOBALDOSFREE((char *)s_The__v__displays_a_message__1070_114f + 1,local_12,uVar5);
      return 0xffff;
    }
    local_20 = local_e << 0x10;
    local_e._0_2_ = local_14;
    local_e._2_2_ = local_18;
    FUN_1068_0cee(param_1,0,local_14,(int)param_3,uVar3);
    local_42 = 0;
    local_30 = local_18;
  }
  local_40 = 0;
  local_52 = puVar1[6];
  local_50 = 0;
  local_4e = puVar1[5];
  local_4c = 0;
  local_36 = *param_5;
  local_34 = 0;
  local_3a = puVar1[2];
  local_38 = 0;
  pcVar4 = (char *)s_There_are_no_other_effects__1070_100b + 0x15;
  local_10 = FUN_1020_0002(&local_52,unaff_SS,CONCAT11((char)((uint)local_3a >> 8),param_6));
  if (local_10 == 0) {
    puVar1[9] = local_32;
    puVar1[6] = local_52;
    puVar1[5] = local_4e;
    *param_5 = local_36;
    puVar1[2] = local_3a;
    if (param_2 == 0) {
      puVar1[7] = local_2e;
      puVar1[3] = local_3e;
      local_10 = 0;
    }
    else {
      FUN_1068_0cee(param_2,(int)param_4,uVar2,(int)local_1c,(int)((ulong)local_1c >> 0x10));
      local_10 = GLOBALDOSFREE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,local_12);
    }
    if (param_1 == 0) {
      puVar1[8] = local_30;
      puVar1[1] = local_42;
    }
    else {
      FUN_1068_0cee(param_1,(int)param_3,uVar3,(int)local_20,(int)((ulong)local_20 >> 0x10));
      GLOBALDOSFREE((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,local_14);
    }
    uVar6 = 0;
  }
  else {
    puVar1[9] = 0xffff;
    uVar6 = 0xffff;
    if (param_1 != 0) {
      pcVar4 = (char *)s_The__v__displays_a_message__1070_114f + 1;
      local_10 = GLOBALDOSFREE((char *)s_There_are_no_other_effects__1070_100b + 0x15,local_14);
    }
    if (param_2 != 0) {
      GLOBALDOSFREE(pcVar4,local_12);
    }
  }
  return uVar6;
}



/* ------------------------------------------------------------
 * FUN_1020_02ea @ 1020:02ea
 * selected: NE entry/export
 * body bytes: 493
 * completed: true
 */

undefined2 __stdcall16far FUN_1020_02ea(int param_1,undefined4 param_2,byte param_3,byte *param_4)

{
  byte *pbVar1;
  byte *pbVar2;
  uint uVar3;
  byte *pbVar4;
  int iVar5;
  undefined2 unaff_SS;
  undefined1 *puVar6;
  undefined2 uVar7;
  undefined1 local_326 [256];
  undefined2 local_226;
  undefined2 local_224;
  uint local_222;
  undefined2 local_220;
  undefined2 local_218;
  undefined2 local_216;
  byte local_214;
  long local_212;
  long local_20e;
  undefined1 local_20a;
  undefined1 local_209 [257];
  int local_108;
  byte local_106;
  byte abStack_105 [253];
  undefined2 uStack_8;
  
  uStack_8 = 0x2f7;
  FUN_1068_03cb();
  pbVar4 = (byte *)param_4;
  local_106 = *param_4;
  pbVar2 = abStack_105;
  for (uVar3 = (uint)local_106; pbVar4 = pbVar4 + 1, uVar3 != 0; uVar3 = uVar3 - 1) {
    pbVar1 = pbVar2;
    pbVar2 = pbVar2 + 1;
    *pbVar1 = *pbVar4;
  }
  local_226 = CONCAT11(0x2f,(undefined1)local_226);
  local_108 = FUN_1020_002d(0,0,0,0,0,0,&local_226,unaff_SS,0x21);
  if (local_108 == 0) {
    *(undefined2 *)(param_1 * 2 + -0x6368) = local_216;
    *(undefined2 *)(param_1 * 2 + -0x6328) = local_224;
    uVar7 = 0;
    local_212 = GLOBALDOSALLOC((char *)s_There_are_no_other_effects__1070_100b + 0x15,0x2b);
    if (local_212 == 0) {
      local_226 = 0xffff;
    }
    else {
      ((undefined2 *)&DAT_1070_9c18)[param_1] = (int)local_212;
      *(undefined2 *)(param_1 * 2 + -0x63a8) = (int)((ulong)local_212 >> 0x10);
      local_226 = CONCAT11(0x1a,(undefined1)local_226);
      local_220 = 0;
      local_218 = *(undefined2 *)(param_1 * 2 + -0x63a8);
      local_108 = FUN_1020_002d(0,0,0,0,0,0,&local_226,unaff_SS,0x21);
      if (local_108 == 0) {
        local_226 = CONCAT11(0x4e,(undefined1)local_226);
        local_222 = (uint)param_3;
        puVar6 = local_326;
        uVar7 = unaff_SS;
        FUN_1068_0891(&local_106,unaff_SS);
        FUN_1068_0910(0x2e8,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
        FUN_1068_08ab(0xff,&local_20a,unaff_SS,puVar6,uVar7);
        local_108 = FUN_1020_002d(0,0xff,0,0,local_209,unaff_SS,&local_226,unaff_SS,0x21);
        if (local_108 == 0) {
          local_20e = (ulong)(uint)((undefined2 *)&DAT_1070_9c18)[param_1] << 0x10;
          uVar7 = (undefined2)((ulong)param_2 >> 0x10);
          iVar5 = (int)param_2;
          FUN_1068_0cee(0x2b,iVar5,uVar7,0,((undefined2 *)&DAT_1070_9c18)[param_1]);
          local_108 = FUN_1068_093c(iVar5 + 0x1e,uVar7,0x2e8,
                                    (char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd);
          FUN_1068_0cee(local_108,iVar5 + 0x1f,uVar7,iVar5 + 0x1e,uVar7);
          *(undefined1 *)(iVar5 + 0x1e) = (undefined1)local_108;
          if (!(bool)(local_214 & 1)) {
            local_226 = 0;
          }
        }
        else {
          local_226 = 0xffff;
        }
      }
      else {
        GLOBALDOSFREE((char *)s_There_are_no_other_effects__1070_100b + 0x15,
                      ((undefined2 *)&DAT_1070_9c18)[param_1],uVar7);
        local_226 = 0xffff;
      }
    }
  }
  else {
    local_226 = 0xffff;
  }
  return local_226;
}



/* ------------------------------------------------------------
 * FUN_1020_026b @ 1020:026b
 * selected: NE entry/export
 * body bytes: 125
 * completed: true
 */

undefined1 __stdcall16far FUN_1020_026b(int param_1)

{
  int iVar1;
  undefined2 unaff_SS;
  undefined1 uVar2;
  undefined1 local_1c;
  undefined1 local_1b;
  undefined2 local_16;
  undefined2 local_e;
  int local_8;
  
  local_8 = 0x278;
  FUN_1068_03cb();
  local_1b = 0x1a;
  local_16 = *(undefined2 *)(param_1 * 2 + -0x6328);
  local_e = *(undefined2 *)(param_1 * 2 + -0x6368);
  local_8 = FUN_1020_002d(0,0,0,0,0,0,&local_1c,unaff_SS,0x21);
  uVar2 = local_8 != 0;
  iVar1 = GLOBALDOSFREE((char *)s_There_are_no_other_effects__1070_100b + 0x15,
                        ((undefined2 *)&DAT_1070_9c18)[param_1]);
  if (iVar1 != 0) {
    uVar2 = 2;
  }
  return uVar2;
}



/* ------------------------------------------------------------
 * FUN_1020_04d7 @ 1020:04d7
 * selected: NE entry/export
 * body bytes: 88
 * completed: true
 */

bool __stdcall16far FUN_1020_04d7(byte *param_1)

{
  byte *pbVar1;
  byte *pbVar2;
  int iVar3;
  uint uVar4;
  byte *pbVar5;
  undefined2 unaff_SS;
  undefined1 local_132 [44];
  byte local_106;
  byte abStack_105 [253];
  undefined2 uStack_8;
  
  uStack_8 = 0x4e4;
  FUN_1068_03cb();
  pbVar5 = (byte *)param_1;
  local_106 = *param_1;
  pbVar2 = abStack_105;
  for (uVar4 = (uint)local_106; pbVar5 = pbVar5 + 1, uVar4 != 0; uVar4 = uVar4 - 1) {
    pbVar1 = pbVar2;
    pbVar2 = pbVar2 + 1;
    *pbVar1 = *pbVar5;
  }
  iVar3 = FUN_1020_02ea(0x1f,local_132,unaff_SS,0x3f,&local_106,unaff_SS);
  FUN_1020_026b(0x1f);
  return iVar3 == 0;
}



/* ------------------------------------------------------------
 * FUN_1028_0e27 @ 1028:0e27
 * selected: NE entry/export
 * body bytes: 180
 * completed: true
 */

void __cdecl16far FUN_1028_0e27(void)

{
  undefined2 unaff_CS;
  undefined2 uVar1;
  
  if (DAT_1070_1942 == 0) {
    DAT_1070_174c = DAT_1070_1944;
    DAT_1070_174e = LOADICON(unaff_CS,0x7f00,0);
    DAT_1070_1750 = LOADCURSOR((char *)s_The__v__displays_a_message__1070_114f + 1,0x7f00,0);
    DAT_1070_1752 = 6;
    REGISTERCLASS((char *)s_The__v__displays_a_message__1070_114f + 1,0x1742);
  }
  FUN_1028_0cd0(0x9de4,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_0527(0x1028,0x9de4,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_038f();
  FUN_1028_0cd0(0x9ee4,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_052c(0x1028,0x9ee4,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  FUN_1068_038f();
  uVar1 = DAT_1070_1944;
  GETMODULEFILENAME((char *)s__This__v__overwrites_infected_fi_1070_105b + 0xd,0x50,0x9d1a,
                    (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
  Ordinal_6((char *)s_The__v__displays_a_message__1070_114f + 1,0x9d1a,
            (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,0x9d1a,
            (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,uVar1);
  DAT_1070_9d6a = DAT_1070_1958;
  DAT_1070_9d6c = DAT_1070_195a;
  DAT_1070_1958 = 0xd78;
  DAT_1070_195a = 0x1028;
  return;
}



/* ------------------------------------------------------------
 * FUN_1028_0d15 @ 1028:0d15
 * selected: NE entry/export
 * body bytes: 99
 * completed: true
 */

void __cdecl16far FUN_1028_0d15(void)

{
  int unaff_BP;
  int iVar1;
  undefined2 unaff_CS;
  undefined2 uVar2;
  
  iVar1 = unaff_BP + 1;
  if (DAT_1070_176c == '\0') {
    DAT_1070_1766 =
         CREATEWINDOW(unaff_CS,0,0,DAT_1070_1944,0,0,DAT_1070_171e,DAT_1070_171c,DAT_1070_171a,
                      DAT_1070_1718,0,0xff,0x9d1a,
                      (char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15,DAT_1070_1758,
                      DAT_1070_175a,(char *)s__This__v__overwrites_infected_fi_1070_105b + 0x15);
    uVar2 = DAT_1070_1766;
    SHOWWINDOW((char *)s_The__v__displays_a_message__1070_114f + 1,DAT_1070_1946);
    UPDATEWINDOW((char *)s_The__v__displays_a_message__1070_114f + 1,DAT_1070_1766,uVar2,iVar1);
  }
  return;
}



