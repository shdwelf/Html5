/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: FILEIO.DLL
 * SHA-256: 0b2aba6d615d596573bc243b181596355ef0f77df5bb24c0bec3bde97992316b
 */

/* ------------------------------------------------------------
 * entry @ 1000:13aa
 * selected: program entry point
 * body bytes: 162
 * completed: true
 */

/* WARNING: Removing unreachable block (ram,0x100013f8) */

void __cdecl16far entry(void)

{
  code *pcVar1;
  int iVar2;
  int in_CX;
  undefined2 in_BX;
  undefined2 unaff_SI;
  undefined2 unaff_DI;
  undefined2 unaff_CS;
  undefined2 uVar3;
  undefined2 uVar4;
  
  DAT_1008_0132 = 0x1008;
  uVar3 = unaff_CS;
  DAT_1008_0130 = unaff_DI;
  DAT_1008_0134 = in_CX;
  DAT_1008_0136 = in_BX;
  DAT_1008_0138 = unaff_SI;
  if (in_CX != 0) {
    uVar3 = 0x1018;
    iVar2 = LOCALINIT(unaff_CS,in_CX,0);
    if (iVar2 == 0) {
      return;
    }
  }
  LOCKSEGMENT(uVar3,0xffff);
  uVar4 = 0x13e8;
  uVar3 = GETVERSION(0x1018);
  DAT_1008_0156 = CONCAT11((char)uVar3,(char)((uint)uVar3 >> 8));
  pcVar1 = (code *)swi(0x21);
  DAT_1008_015a = (*pcVar1)();
  DAT_1008_0158 = CONCAT11((char)DAT_1008_015a,(char)((uint)DAT_1008_015a >> 8));
  DAT_1008_015d = 0;
  FUN_1000_1464(uVar4);
  FUN_1000_15ba();
  DAT_1008_013a = DAT_1008_013a + '\x01';
  FUN_1000_133a(DAT_1008_0176,DAT_1008_0178,DAT_1008_017a,DAT_1008_017c,DAT_1008_017e);
  return;
}



/* ------------------------------------------------------------
 * LIBMAIN @ 1000:0000
 * selected: NE entry/export
 * body bytes: 50
 * completed: true
 */

/* Title:  File I/O External Factory
   Format: New Executable (NE) Windows
   CRC:    00000000
   
   Program Entry Point (CS:IP):   0001:13aa
   Initial Stack Pointer (SS:SP): 0000:0000
   Auto Data Segment Index:       0002
   Initial Heap Size:             0080
   Initial Stack Size:            0000
   Minimum Code Swap Size:        0000
   
   Linker Version:  5.50
   Target OS:       Windows
   Windows Version: 3.10
   
   Program Flags:     01
           Single Data
   Application Flags: 83
           Windows P.M. API
           Library Module
   Other Flags:       08
    */

undefined2 __stdcall16far
LIBMAIN(undefined2 param_1,undefined2 param_2,int param_3,undefined2 param_4,undefined2 param_5)

{
  int iVar1;
  undefined2 unaff_CS;
  
                    /* Segment:    1
                       Offset:     00000760
                       Length:     2122
                       Min Alloc:  2122
                       Flags:      1d50
                           Code
                           Discardable
                           Moveable
                           Preload
                           Impure (Non-shareable)
                        */
  if ((param_3 != 0) && (iVar1 = LOCALINIT(unaff_CS,param_3,0), iVar1 == 0)) {
    return 0;
  }
  DAT_1008_02b0 = param_5;
  return 1;
}



/* ------------------------------------------------------------
 * WEP @ 1000:20ce
 * selected: NE entry/export
 * body bytes: 60
 * completed: true
 */

/* WARNING: Removing unreachable block (ram,0x100020e4) */
/* WARNING: Removing unreachable block (ram,0x100020eb) */

undefined2 __stdcall16far WEP(void)

{
  return 1;
}



/* ------------------------------------------------------------
 * _FILEIO_MNEW @ 1000:0032
 * selected: NE entry/export
 * body bytes: 284
 * completed: true
 */

undefined4 __stdcall16far
_FILEIO_MNEW(undefined2 param_1,undefined2 param_2,int param_3,undefined2 param_4,undefined2 param_5
            ,undefined2 param_6,undefined2 param_7,undefined2 param_8)

{
  int iVar1;
  int iVar2;
  undefined2 uVar3;
  undefined4 uVar4;
  undefined4 uVar5;
  long lVar6;
  undefined4 uVar7;
  undefined2 uVar8;
  undefined2 uVar9;
  undefined2 uVar10;
  undefined2 uVar11;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar4 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar5 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar9 = 0;
  uVar8 = 0x18;
  uVar10 = param_1;
  uVar11 = param_2;
  lVar6 = (*(code *)*(undefined2 *)(param_3 + 0x10))();
  if (lVar6 == 0) {
    DAT_1008_0010 = 1;
    DAT_1008_0012 = 0;
  }
  else {
    uVar7 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
    uVar3 = (undefined2)((ulong)uVar7 >> 0x10);
    iVar1 = (int)uVar7;
    *(undefined2 *)(iVar1 + 0x14) = 0xffff;
    *(undefined2 *)(iVar1 + 0x12) = 0;
    *(undefined2 *)(iVar1 + 0x10) = 0;
    *(undefined2 *)(iVar1 + 0x16) = 0;
    iVar2 = FUN_1000_014e(uVar7,uVar4,uVar5,param_3,param_4,param_1,param_2,uVar8,uVar9,uVar10,
                          uVar11,param_5,param_6,param_7,param_8);
    if (iVar2 != 0) {
      FUN_1000_03d0(uVar7,param_3,param_4);
    }
    if (DAT_1008_0012 != 0 || DAT_1008_0010 != 0) {
      if (*(int *)(iVar1 + 0x12) != 0 || *(int *)(iVar1 + 0x10) != 0) {
        (*(code *)*(undefined2 *)(param_3 + 0xc))();
      }
    }
    (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  return CONCAT22(DAT_1008_0012,DAT_1008_0010);
}



/* ------------------------------------------------------------
 * _FILEIO_MDISPOSE @ 1000:04e2
 * selected: NE entry/export
 * body bytes: 143
 * completed: true
 */

undefined4 __stdcall16far _FILEIO_MDISPOSE(undefined2 param_1,undefined2 param_2,int param_3)

{
  int iVar1;
  int iVar2;
  undefined2 uVar3;
  undefined4 uVar4;
  undefined2 uVar5;
  undefined2 uVar6;
  undefined2 uVar7;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar6 = param_1;
  uVar7 = param_2;
  uVar4 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar3 = (undefined2)((ulong)uVar4 >> 0x10);
  iVar1 = (int)uVar4;
  uVar5 = *(undefined2 *)(iVar1 + 0x14);
  iVar2 = _LCLOSE();
  if (iVar2 != 0) {
    DAT_1008_0010 = 0xffda;
    DAT_1008_0012 = 0xffff;
  }
  if (*(int *)(iVar1 + 0x12) != 0 || *(int *)(iVar1 + 0x10) != 0) {
    (*(code *)*(undefined2 *)(param_3 + 0xc))
              (0x1018,*(undefined2 *)(iVar1 + 0x10),*(undefined2 *)(iVar1 + 0x12),uVar5,uVar6,uVar7)
    ;
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2);
  (*(code *)*(undefined2 *)(param_3 + 4))(0x1018,param_1,param_2);
  return CONCAT22(DAT_1008_0012,DAT_1008_0010);
}



/* ------------------------------------------------------------
 * ___EXPORTEDSTUB @ 1000:199e
 * selected: NE entry/export
 * body bytes: 19
 * completed: true
 */

undefined2 __cdecl16far ___EXPORTEDSTUB(void)

{
  return 0;
}



/* ------------------------------------------------------------
 * _FILEIO_MWRITECHAR @ 1000:0896
 * selected: NE entry/export
 * body bytes: 109
 * completed: true
 */

undefined4 __stdcall16far
_FILEIO_MWRITECHAR(undefined2 param_1,undefined2 param_2,int param_3,undefined2 param_4,
                  undefined1 param_5)

{
  int iVar1;
  int unaff_BP;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined4 uVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined1 local_5;
  undefined2 local_4;
  int iStack_2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar4 = param_1;
  uVar5 = param_2;
  uVar2 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  local_5 = param_5;
  uVar3 = *(undefined2 *)((int)uVar2 + 0x14);
  iVar1 = _LWRITE(unaff_CS,1,&local_5,unaff_SS);
  if (iVar1 != 1) {
    DAT_1008_0010 = 0xffdc;
    DAT_1008_0012 = 0xffff;
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2,uVar3,uVar4,uVar5);
  return CONCAT22(DAT_1008_0012,DAT_1008_0010);
}



/* ------------------------------------------------------------
 * _FILEIO_MWRITESTRING @ 1000:0904
 * selected: NE entry/export
 * body bytes: 152
 * completed: true
 */

undefined4 __stdcall16far
_FILEIO_MWRITESTRING
          (undefined2 param_1,undefined2 param_2,int param_3,undefined2 param_4,undefined2 param_5,
          undefined2 param_6)

{
  int iVar1;
  int iVar2;
  undefined2 unaff_CS;
  undefined4 uVar3;
  undefined4 uVar4;
  undefined2 uVar5;
  undefined2 uVar6;
  undefined2 uVar7;
  undefined2 uVar8;
  undefined2 uVar9;
  undefined2 uVar10;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar9 = param_1;
  uVar10 = param_2;
  uVar3 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar7 = param_5;
  uVar8 = param_6;
  uVar4 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar6 = (undefined2)((ulong)uVar4 >> 0x10);
  iVar1 = LSTRLEN(unaff_CS,(int)uVar4);
  uVar5 = *(undefined2 *)((int)uVar3 + 0x14);
  iVar2 = _LWRITE(0x1018,iVar1,uVar4);
  if (iVar2 != iVar1) {
    DAT_1008_0010 = 0xffdc;
    DAT_1008_0012 = 0xffff;
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))
            (0x1018,param_5,param_6,uVar5,uVar6,uVar7,uVar8,uVar9,uVar10);
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2);
  return CONCAT22(DAT_1008_0012,DAT_1008_0010);
}



/* ------------------------------------------------------------
 * _FILEIO_MREADCHAR @ 1000:099c
 * selected: NE entry/export
 * body bytes: 132
 * completed: true
 */

undefined4 __stdcall16far _FILEIO_MREADCHAR(undefined2 param_1,undefined2 param_2,int param_3)

{
  int iVar1;
  int unaff_BP;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined4 uVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  byte local_9;
  uint local_8;
  undefined2 local_6;
  undefined2 local_4;
  int iStack_2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar4 = param_1;
  uVar5 = param_2;
  uVar2 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar3 = *(undefined2 *)((int)uVar2 + 0x14);
  iVar1 = _LREAD(unaff_CS,1,&local_9,unaff_SS);
  if (iVar1 < 0) {
    DAT_1008_0010 = 0xffdc;
    DAT_1008_0012 = 0xffff;
    local_8 = 0xffff;
    local_6 = 0xffff;
  }
  else if (iVar1 == 1) {
    local_8 = (uint)local_9;
    local_6 = 0;
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2,uVar3,uVar4,uVar5);
  return CONCAT22(local_6,local_8);
}



/* ------------------------------------------------------------
 * _FILEIO_MREADWORD @ 1000:0f2c
 * selected: NE entry/export
 * body bytes: 106
 * completed: true
 */

undefined4 __stdcall16far
_FILEIO_MREADWORD(undefined2 param_1,undefined2 param_2,int param_3,undefined2 param_4)

{
  undefined2 uVar1;
  undefined4 uVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined2 uVar6;
  int iVar7;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar6 = 0x1008;
  uVar5 = 0x125;
  uVar4 = 0x1008;
  uVar3 = 0x127;
  iVar7 = param_3;
  uVar2 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar1 = (undefined2)((ulong)uVar2 >> 0x10);
  uVar3 = FUN_1000_0cda(*(undefined2 *)((int)uVar2 + 0x14),param_1,param_2,uVar3,uVar4,uVar5,uVar6,
                        iVar7,param_4);
  (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  return CONCAT22(uVar1,uVar3);
}



/* ------------------------------------------------------------
 * _FILEIO_MREADLINE @ 1000:0a22
 * selected: NE entry/export
 * body bytes: 244
 * completed: true
 */

undefined4 __stdcall16far _FILEIO_MREADLINE(undefined2 param_1,undefined2 param_2,int param_3)

{
  char cVar1;
  int iVar2;
  int unaff_BP;
  uint uVar3;
  undefined2 unaff_CS;
  undefined2 uVar4;
  undefined2 unaff_SS;
  long lVar5;
  char local_94 [130];
  undefined4 local_12;
  uint local_e;
  undefined4 local_c;
  char local_7;
  int local_6;
  undefined2 local_4;
  int iStack_2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  local_7 = '\0';
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  local_c = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar3 = 0;
  local_12 = (*(code *)*(undefined2 *)(param_3 + 8))();
  local_e = 0;
  cVar1 = local_7;
  do {
    uVar4 = unaff_CS;
    if (cVar1 == '\r') {
LAB_1000_0ad9:
      local_e = uVar3;
      local_94[uVar3] = '\0';
      (*(code *)*(undefined2 *)(param_3 + 0x24))
                (uVar4,local_e + 1,(int)(local_e + 1) >> 0xf,local_94);
      (*(code *)*(undefined2 *)(param_3 + 0x1c))(uVar4,param_1,param_2);
      return local_12;
    }
    uVar4 = 0x1018;
    iVar2 = _LREAD(unaff_CS,1,&local_7,unaff_SS);
    if (iVar2 < 1) {
      local_6 = iVar2;
      if (iVar2 != 0) {
        DAT_1008_0010 = 0xffdc;
        DAT_1008_0012 = 0xffff;
      }
      goto LAB_1000_0ad9;
    }
    if (0x7f < uVar3) {
      lVar5 = (*(code *)*(undefined2 *)(param_3 + 0x24))(0x1018,uVar3,(int)uVar3 >> 0xf,local_94);
      if (lVar5 == 0) goto LAB_1000_0ad9;
      uVar3 = 0;
    }
    cVar1 = local_7;
    local_94[uVar3] = local_7;
    uVar3 = uVar3 + 1;
    unaff_CS = uVar4;
  } while( true );
}



/* ------------------------------------------------------------
 * _FILEIO_MREADFILE @ 1000:0b16
 * selected: NE entry/export
 * body bytes: 400
 * completed: true
 */

/* WARNING: Removing unreachable block (ram,0x10000bc8) */

undefined2 __stdcall16far _FILEIO_MREADFILE(undefined2 param_1,undefined2 param_2,int param_3)

{
  int iVar1;
  undefined2 uVar2;
  undefined2 unaff_CS;
  undefined4 uVar3;
  long lVar4;
  long lVar5;
  long lVar6;
  undefined2 uVar7;
  undefined2 uVar8;
  undefined2 uVar9;
  undefined2 uVar10;
  undefined2 uVar11;
  int local_10;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar10 = param_1;
  uVar11 = param_2;
  uVar3 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar2 = (undefined2)((ulong)uVar3 >> 0x10);
  iVar1 = (int)uVar3;
  uVar8 = *(undefined2 *)(iVar1 + 0x14);
  lVar4 = _LLSEEK(unaff_CS,1,0,0);
  uVar7 = *(undefined2 *)(iVar1 + 0x14);
  lVar5 = _LLSEEK(0x1018,2,0,0);
  uVar9 = *(undefined2 *)(iVar1 + 0x14);
  _LLSEEK(0x1018,0,lVar4);
  lVar6 = lVar5 - lVar4;
  if ((-1 < lVar6) && ((0xffff < lVar6 || ((int)lVar6 == -1)))) {
    lVar6 = 0xfffe;
  }
  local_10 = (int)lVar6;
  if ((lVar4 < 0) || (lVar5 < 0)) {
    DAT_1008_0010 = 0xffda;
    DAT_1008_0012 = 0xffff;
    uVar8 = 0x122;
  }
  else {
    if (lVar6 < 1) {
      (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2);
      uVar8 = (*(code *)*(undefined2 *)(param_3 + 0x34))(0x1018,0x123,0x1008);
      return uVar8;
    }
    lVar6 = (*(code *)*(undefined2 *)(param_3 + 8))
                      (0x1018,0,lVar6 + 1,uVar9,uVar7,uVar8,uVar10,uVar11);
    uVar8 = (undefined2)lVar6;
    if (lVar6 == 0) {
      DAT_1008_0010 = 1;
      uVar8 = 0;
      DAT_1008_0012 = 0;
      goto LAB_1000_0c8c;
    }
    uVar3 = (*(code *)*(undefined2 *)(param_3 + 0x18))(0x1018,lVar6);
    uVar7 = *(undefined2 *)(iVar1 + 0x14);
    iVar1 = _LREAD(0x1018,local_10,uVar3);
    if (iVar1 == local_10) {
      (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,lVar6,uVar7);
      goto LAB_1000_0c8c;
    }
    DAT_1008_0010 = 0xffdc;
    DAT_1008_0012 = 0xffff;
    (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,lVar6);
    (*(code *)*(undefined2 *)(param_3 + 0xc))(0x1018,lVar6);
    uVar8 = 0x124;
  }
  uVar8 = (*(code *)*(undefined2 *)(param_3 + 0x34))(0x1018,uVar8,0x1008);
LAB_1000_0c8c:
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2);
  return uVar8;
}



/* ------------------------------------------------------------
 * _FILEIO_MREADTOKEN @ 1000:0f96
 * selected: NE entry/export
 * body bytes: 172
 * completed: true
 */

undefined4 __stdcall16far
_FILEIO_MREADTOKEN(undefined2 param_1,undefined2 param_2,int param_3,undefined2 param_4,
                  undefined2 param_5,undefined2 param_6,undefined2 param_7,undefined2 param_8)

{
  undefined2 uVar1;
  undefined2 uVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  undefined4 uVar5;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar3 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar4 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar5 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar2 = (undefined2)((ulong)uVar5 >> 0x10);
  uVar1 = FUN_1000_0cda(*(undefined2 *)((int)uVar3 + 0x14),uVar4,uVar5,param_3,param_4,param_5,
                        param_6,param_7,param_8,param_1,param_2);
  (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  return CONCAT22(uVar2,uVar1);
}



/* ------------------------------------------------------------
 * _FILEIO_MGETPOSITION @ 1000:0786
 * selected: NE entry/export
 * body bytes: 111
 * completed: true
 */

long __stdcall16far _FILEIO_MGETPOSITION(undefined2 param_1,undefined2 param_2,int param_3)

{
  undefined2 unaff_CS;
  undefined4 uVar1;
  long lVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar4 = param_1;
  uVar5 = param_2;
  uVar1 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar3 = *(undefined2 *)((int)uVar1 + 0x14);
  lVar2 = _LLSEEK(unaff_CS,1,0,0);
  if (lVar2 == -1) {
    DAT_1008_0010 = 0xffda;
    DAT_1008_0012 = 0xffff;
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2,uVar3,uVar4,uVar5);
  return lVar2;
}



/* ------------------------------------------------------------
 * _FILEIO_MSETPOSITION @ 1000:071c
 * selected: NE entry/export
 * body bytes: 105
 * completed: true
 */

undefined4 __stdcall16far
_FILEIO_MSETPOSITION
          (undefined2 param_1,undefined2 param_2,int param_3,undefined2 param_4,undefined2 param_5,
          undefined2 param_6)

{
  undefined2 unaff_CS;
  undefined4 uVar1;
  long lVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar4 = param_1;
  uVar5 = param_2;
  uVar1 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar3 = *(undefined2 *)((int)uVar1 + 0x14);
  lVar2 = _LLSEEK(unaff_CS,0,param_5,param_6);
  if (lVar2 == -1) {
    DAT_1008_0010 = 0xffda;
    DAT_1008_0012 = 0xffff;
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2,uVar3,uVar4,uVar5);
  return CONCAT22(DAT_1008_0012,DAT_1008_0010);
}



/* ------------------------------------------------------------
 * _FILEIO_MGETLENGTH @ 1000:07f6
 * selected: NE entry/export
 * body bytes: 158
 * completed: true
 */

undefined4 __stdcall16far _FILEIO_MGETLENGTH(undefined2 param_1,undefined2 param_2,int param_3)

{
  int iVar1;
  undefined2 uVar2;
  undefined2 unaff_CS;
  undefined4 uVar3;
  long lVar4;
  undefined4 uVar5;
  undefined2 uVar6;
  undefined2 uVar7;
  undefined2 uVar8;
  undefined2 uVar9;
  undefined2 uVar10;
  undefined2 local_8;
  undefined2 local_6;
  
  uVar5 = CONCAT22(local_6,local_8);
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar9 = param_1;
  uVar10 = param_2;
  uVar3 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar2 = (undefined2)((ulong)uVar3 >> 0x10);
  iVar1 = (int)uVar3;
  uVar8 = *(undefined2 *)(iVar1 + 0x14);
  uVar7 = 0;
  uVar6 = 0;
  lVar4 = _LLSEEK(unaff_CS,1,0,0);
  if (lVar4 == -1) {
    DAT_1008_0010 = 0xffda;
    DAT_1008_0012 = 0xffff;
  }
  else {
    uVar7 = *(undefined2 *)(iVar1 + 0x14);
    uVar5 = _LLSEEK(0x1018,2,0,0);
    uVar6 = *(undefined2 *)(iVar1 + 0x14);
    _LLSEEK(0x1018,0,lVar4);
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(0x1018,param_1,param_2,uVar6,uVar7,uVar8,uVar9,uVar10);
  return uVar5;
}



/* ------------------------------------------------------------
 * _FILEIO_MSETFINDERINFO @ 1000:1042
 * selected: NE entry/export
 * body bytes: 23
 * completed: true
 */

void __stdcall16far _FILEIO_MSETFINDERINFO(void)

{
  return;
}



/* ------------------------------------------------------------
 * _FILEIO_MGETFINDERINFO @ 1000:105a
 * selected: NE entry/export
 * body bytes: 30
 * completed: true
 */

void __stdcall16far _FILEIO_MGETFINDERINFO(undefined2 param_1,undefined2 param_2,int param_3)

{
  (*(code *)*(undefined2 *)(param_3 + 0x34))();
  return;
}



/* ------------------------------------------------------------
 * _FILEIO_MFILENAME @ 1000:0572
 * selected: NE entry/export
 * body bytes: 110
 * completed: true
 */

long __stdcall16far _FILEIO_MFILENAME(undefined2 param_1,undefined2 param_2,int param_3)

{
  long lVar1;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  (*(code *)*(undefined2 *)(param_3 + 0x18))();
  lVar1 = (*(code *)*(undefined2 *)(param_3 + 0x20))();
  if (lVar1 != 0) {
    (*(code *)*(undefined2 *)(param_3 + 0x54))();
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  return lVar1;
}



/* ------------------------------------------------------------
 * _FILEIO_MDELETE @ 1000:1078
 * selected: NE entry/export
 * body bytes: 187
 * completed: true
 */

void __stdcall16far _FILEIO_MDELETE(undefined2 param_1,undefined2 param_2,int param_3)

{
  int iVar1;
  int iVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined4 uVar5;
  undefined2 uVar6;
  undefined2 uVar7;
  undefined2 uVar8;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar7 = param_1;
  uVar8 = param_2;
  uVar5 = (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar3 = (undefined2)((ulong)uVar5 >> 0x10);
  iVar1 = (int)uVar5;
  uVar6 = *(undefined2 *)(iVar1 + 0x14);
  uVar4 = 0x1018;
  iVar2 = _LCLOSE();
  if (iVar2 != 0) {
    DAT_1008_0010 = 0xffda;
    DAT_1008_0012 = 0xffff;
  }
  if (*(int *)(iVar1 + 0x12) != 0 || *(int *)(iVar1 + 0x10) != 0) {
    uVar5 = (*(code *)*(undefined2 *)(param_3 + 0x18))
                      (0x1018,*(undefined2 *)(iVar1 + 0x10),*(undefined2 *)(iVar1 + 0x12),uVar6,
                       uVar7,uVar8);
    uVar4 = 0x1000;
    FUN_1000_1e40(uVar5);
    (*(code *)*(undefined2 *)(param_3 + 0x1c))
              (0x1000,*(undefined2 *)(iVar1 + 0x10),*(undefined2 *)(iVar1 + 0x12));
    (*(code *)*(undefined2 *)(param_3 + 0xc))
              (0x1000,*(undefined2 *)(iVar1 + 0x10),*(undefined2 *)(iVar1 + 0x12));
  }
  (*(code *)*(undefined2 *)(param_3 + 0x1c))(uVar4,param_1,param_2);
  (*(code *)*(undefined2 *)(param_3 + 4))(uVar4,param_1,param_2);
  return;
}



/* ------------------------------------------------------------
 * _FILEIO_MSTATUS @ 1000:0644
 * selected: NE entry/export
 * body bytes: 26
 * completed: true
 */

undefined4 __stdcall16far _FILEIO_MSTATUS(void)

{
  return CONCAT22(DAT_1008_0012,DAT_1008_0010);
}



/* ------------------------------------------------------------
 * _FILEIO_MERROR @ 1000:065e
 * selected: NE entry/export
 * body bytes: 173
 * completed: true
 */

void __stdcall16far _FILEIO_MERROR(undefined2 param_1,undefined2 param_2,int param_3)

{
  (*(code *)*(undefined2 *)(param_3 + 0x34))();
  return;
}



/* ------------------------------------------------------------
 * _FILEIO_MREADPICT @ 1000:1164
 * selected: NE entry/export
 * body bytes: 422
 * completed: true
 */

void __stdcall16far
_FILEIO_MREADPICT(undefined2 param_1,undefined2 param_2,undefined4 param_3,undefined2 *param_4)

{
  uint uVar1;
  undefined2 uVar2;
  int iVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined2 unaff_CS;
  undefined2 uVar6;
  bool bVar7;
  undefined4 uVar8;
  undefined4 uVar9;
  undefined2 uVar10;
  undefined4 *puVar11;
  undefined2 uVar12;
  undefined4 local_14;
  int local_c;
  uint local_8;
  int local_6;
  
  local_14 = (undefined4 *)0x0;
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  uVar5 = param_1;
  uVar12 = param_2;
  uVar8 = (*(code *)*(undefined2 *)((int)param_3 + 0x18))();
  uVar4 = (undefined2)((ulong)uVar8 >> 0x10);
  if (*(int *)((int)uVar8 + 0x14) != -1) {
    uVar9 = _FILEIO_MGETLENGTH(param_1,param_2,(int)param_3,param_3._2_2_);
    if (DAT_1008_0012 == 0 && DAT_1008_0010 == 0) {
      local_8 = (uint)uVar9 - 0x200;
      local_6 = (int)((ulong)uVar9 >> 0x10) - (uint)((uint)uVar9 < 0x200);
      if ((-1 < local_6) &&
         (_FILEIO_MSETPOSITION(param_1,param_2,(int)param_3,param_3._2_2_,0x200,0),
         DAT_1008_0012 == 0 && DAT_1008_0010 == 0)) {
        local_14 = (undefined4 *)(*(code *)*(undefined2 *)((int)param_3 + 8))();
        uVar2 = (undefined2)((ulong)local_14 >> 0x10);
        if (local_14 != (undefined4 *)0x0) {
          puVar11 = local_14;
          uVar9 = (*(code *)*(undefined2 *)((int)param_3 + 0x18))();
          local_c = (int)uVar9;
          uVar6 = unaff_CS;
          while( true ) {
            uVar10 = *(undefined2 *)((int)uVar8 + 0x14);
            unaff_CS = 0x1018;
            uVar1 = _LREAD(uVar6,0xfffe,local_c,(int)((ulong)uVar9 >> 0x10));
            bVar7 = local_8 < uVar1;
            local_8 = local_8 - uVar1;
            local_6 = local_6 - (uint)bVar7;
            local_c = local_c + uVar1;
            if (local_6 < 0) break;
            if (((local_6 < 1) && (local_8 == 0)) || (uVar6 = unaff_CS, uVar1 == 0)) break;
          }
          (*(code *)*(undefined2 *)((int)param_3 + 0x1c))(0x1018,local_14,uVar10,puVar11);
          uVar4 = (undefined2)((ulong)*local_14 >> 0x10);
          iVar3 = (int)*local_14;
          if (((*(char *)(iVar3 + 10) == '\x11') && (*(char *)(iVar3 + 0xb) == '\x01')) ||
             (((*(char *)(iVar3 + 10) == '\0' &&
               ((*(char *)(iVar3 + 0xb) == '\x11' && (*(char *)(iVar3 + 0xc) == '\x02')))) &&
              (*(char *)(iVar3 + 0xd) == -1)))) {
            (*(code *)*(undefined2 *)((int)param_3 + 0x78))
                      (0x1018,10,0,2,0,299,0x1008,*(undefined2 *)local_14,
                       *(undefined2 *)((int)(undefined4 *)local_14 + 2));
            uVar5 = (undefined2)((ulong)param_4 >> 0x10);
            *param_4 = 5;
            ((undefined2 *)param_4)[1] = (undefined4 *)local_14;
            ((undefined2 *)param_4)[2] = uVar2;
            goto LAB_1000_12ef;
          }
        }
      }
    }
  }
  if (local_14._2_2_ != 0 || (undefined4 *)local_14 != (undefined4 *)0x0) {
    (*(code *)*(undefined2 *)((int)param_3 + 0xc))
              (unaff_CS,(undefined4 *)local_14,local_14._2_2_,uVar5,uVar12);
  }
LAB_1000_12ef:
  (*(code *)*(undefined2 *)((int)param_3 + 0x1c))(unaff_CS,param_1,param_2);
  return;
}



/* ------------------------------------------------------------
 * _FILEIO_MNATIVEFILENAME @ 1000:05e0
 * selected: NE entry/export
 * body bytes: 100
 * completed: true
 */

undefined4 __stdcall16far _FILEIO_MNATIVEFILENAME(undefined2 param_1,undefined2 param_2,int param_3)

{
  undefined4 uVar1;
  
  DAT_1008_0012 = 0;
  DAT_1008_0010 = 0;
  (*(code *)*(undefined2 *)(param_3 + 0x18))();
  uVar1 = (*(code *)*(undefined2 *)(param_3 + 0x20))();
  (*(code *)*(undefined2 *)(param_3 + 0x1c))();
  return uVar1;
}



/* ------------------------------------------------------------
 * _FILEIO_MSETOVERRIDEDRIVE @ 1000:130a
 * selected: NE entry/export
 * body bytes: 32
 * completed: true
 */

void __stdcall16far _FILEIO_MSETOVERRIDEDRIVE(undefined2 param_1,undefined2 param_2,int param_3)

{
  (*(code *)*(undefined2 *)(param_3 + 0x70))();
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_014e @ 1000:014e
 * selected: address-order fallback
 * body bytes: 399
 * completed: true
 */

bool __cdecl16far
FUN_1000_014e(undefined4 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             undefined2 param_5,undefined4 param_6)

{
  int iVar1;
  int iVar2;
  undefined2 uVar3;
  undefined2 extraout_DX;
  int iVar4;
  int unaff_BP;
  undefined2 unaff_CS;
  undefined2 uVar5;
  undefined4 uVar6;
  undefined2 uVar7;
  undefined2 uVar8;
  undefined2 uVar9;
  undefined2 uVar10;
  undefined2 uVar11;
  undefined1 local_104 [256];
  undefined2 local_4;
  int iStack_2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  uVar5 = param_3;
  uVar6 = LSTRCMPI(unaff_CS,0x14,0x1008,param_2);
  iVar2 = (int)((ulong)uVar6 >> 0x10);
  iVar4 = (int)param_6;
  if ((int)uVar6 == 0) {
    *(undefined2 *)((int)param_1 + 0x16) = 0;
  }
  else {
    uVar9 = 0x1008;
    uVar8 = 0x19;
    uVar7 = 0x1018;
    uVar10 = param_2;
    uVar11 = param_3;
    uVar6 = LSTRCMPI(0x1018,0x19,0x1008,param_2);
    uVar3 = (undefined2)((ulong)uVar6 >> 0x10);
    if ((int)uVar6 == 0) {
      *(undefined2 *)((int)param_1 + 0x16) = 0;
      param_3 = uVar7;
LAB_1000_01da:
      uVar5 = FUN_1000_02e2((int)param_1,param_1._2_2_,param_4,param_5,iVar4,param_6._2_2_,param_3,
                            uVar8,uVar9,uVar10,uVar11,uVar5);
      *(undefined2 *)((int)param_1 + 0x10) = uVar5;
      *(undefined2 *)((int)param_1 + 0x12) = uVar3;
      goto LAB_1000_02c8;
    }
    uVar10 = param_3;
    uVar6 = LSTRCMPI(0x1018,0x1f,0x1008,param_2);
    iVar2 = (int)((ulong)uVar6 >> 0x10);
    if ((int)uVar6 == 0) {
      *(undefined2 *)((int)param_1 + 0x16) = 1;
    }
    else {
      uVar9 = param_3;
      iVar2 = LSTRCMPI(0x1018,0x25,0x1008,param_2);
      if (iVar2 == 0) {
        *(undefined2 *)((int)param_1 + 0x16) = 1;
        (*(code *)*(undefined2 *)(iVar4 + 0x50))(0x1018,0xff,local_104);
        uVar5 = extraout_DX;
        uVar8 = FUN_1000_0372((int)param_1,param_1._2_2_,local_104);
        *(undefined2 *)((int)param_1 + 0x10) = uVar8;
        *(undefined2 *)((int)param_1 + 0x12) = uVar5;
        goto LAB_1000_02c8;
      }
      uVar8 = param_3;
      uVar6 = LSTRCMPI(0x1018,0x2c,0x1008,param_2);
      iVar2 = (int)((ulong)uVar6 >> 0x10);
      if ((int)uVar6 != 0) {
        uVar6 = LSTRCMPI(0x1018,0x33,0x1008,param_2);
        uVar3 = (undefined2)((ulong)uVar6 >> 0x10);
        if ((int)uVar6 != 0) {
          DAT_1008_0010 = -0x25;
          DAT_1008_0012 = -1;
          goto LAB_1000_02c8;
        }
        *(undefined2 *)((int)param_1 + 0x16) = 2;
        goto LAB_1000_01da;
      }
      *(undefined2 *)((int)param_1 + 0x16) = 2;
    }
  }
  uVar5 = 0x1000;
  iVar1 = FUN_1000_1afc(local_104);
  if (iVar2 == 0 && iVar1 == 0) {
    uVar5 = 0x1018;
    LSTRCPY(0x1000,param_4,param_5,local_104);
  }
  uVar6 = (*(code *)*(undefined2 *)(iVar4 + 0x34))(uVar5,local_104);
  *(undefined2 *)((int)param_1 + 0x10) = (int)uVar6;
  *(undefined2 *)((int)param_1 + 0x12) = (int)((ulong)uVar6 >> 0x10);
LAB_1000_02c8:
  return DAT_1008_0012 == 0 && DAT_1008_0010 == 0;
}



/* ------------------------------------------------------------
 * FUN_1000_02e2 @ 1000:02e2
 * selected: address-order fallback
 * body bytes: 143
 * completed: true
 */

void __cdecl16far
FUN_1000_02e2(undefined2 param_1,undefined2 param_2,char *param_3,undefined2 param_4,int param_5)

{
  int iVar1;
  int unaff_BP;
  undefined2 unaff_CS;
  undefined1 local_104 [128];
  undefined1 local_84 [5];
  undefined1 local_7f;
  undefined2 local_4;
  int iStack_2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  if (*param_3 == '\0') {
    LSTRCPY(unaff_CS,0x3e,0x1008,local_84);
  }
  else {
    LSTRCPY(unaff_CS,0x3b,0x1008,local_84);
    LSTRCAT(0x1018,param_3,param_4,local_84);
    local_7f = 0;
  }
  local_104[0] = 0;
  iVar1 = (*(code *)*(undefined2 *)(param_5 + 0x4c))(0x1018,local_104);
  if (iVar1 == 0) {
    DAT_1008_0010 = 0xffd5;
    DAT_1008_0012 = 0xffff;
  }
  (*(code *)*(undefined2 *)(param_5 + 0x34))(0x1018,local_104);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_0372 @ 1000:0372
 * selected: address-order fallback
 * body bytes: 93
 * completed: true
 */

void __cdecl16far
FUN_1000_0372(undefined2 param_1,undefined2 param_2,undefined2 param_3,undefined2 param_4,
             int param_5)

{
  int iVar1;
  int unaff_BP;
  undefined2 unaff_CS;
  undefined1 local_104 [256];
  undefined2 local_4;
  int iStack_2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  LSTRCPY(unaff_CS,param_3,param_4,local_104);
  iVar1 = (*(code *)*(undefined2 *)(param_5 + 0x48))(0x1018,local_104);
  if (iVar1 == 0) {
    DAT_1008_0010 = 0xffd5;
    DAT_1008_0012 = 0xffff;
  }
  (*(code *)*(undefined2 *)(param_5 + 0x34))(0x1018,local_104);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_03d0 @ 1000:03d0
 * selected: address-order fallback
 * body bytes: 270
 * completed: true
 */

bool __cdecl16far FUN_1000_03d0(undefined4 param_1,int param_2)

{
  undefined4 uVar1;
  undefined2 uVar2;
  int iVar3;
  int iVar4;
  int unaff_BP;
  int iVar5;
  undefined2 uVar6;
  undefined2 unaff_CS;
  undefined4 uVar7;
  undefined2 uVar8;
  undefined2 uVar9;
  undefined2 uVar10;
  
  iVar5 = unaff_BP + 1;
  uVar10 = 0x1008;
  uVar6 = (undefined2)((ulong)param_1 >> 0x10);
  iVar4 = (int)param_1;
  uVar9 = *(undefined2 *)(iVar4 + 0x12);
  uVar8 = *(undefined2 *)(iVar4 + 0x10);
  uVar7 = (*(code *)*(undefined2 *)(param_2 + 0x18))();
  uVar2 = (undefined2)uVar7;
  iVar3 = *(int *)(iVar4 + 0x16);
  if (iVar3 == 0) {
    uVar2 = _LOPEN(unaff_CS,0,uVar2);
  }
  else {
    if (iVar3 == 1) {
      iVar3 = _LCREAT(unaff_CS,0,uVar2);
      *(int *)(iVar4 + 0x14) = iVar3;
      if (iVar3 == -1) {
        uVar2 = _LCREAT(0x1018,2,(int)uVar7);
        *(undefined2 *)(iVar4 + 0x14) = uVar2;
      }
      unaff_CS = 0x1018;
      if (*(int *)(iVar4 + 0x14) != -1) goto LAB_1000_0498;
      uVar1 = CONCAT22((int)uVar7,3);
    }
    else {
      if (iVar3 != 2) goto LAB_1000_0498;
      iVar3 = _LOPEN(unaff_CS,*(undefined2 *)(iVar4 + 0x16),uVar2);
      *(int *)(iVar4 + 0x14) = iVar3;
      uVar1 = uVar7;
      if (iVar3 != -1) {
        unaff_CS = 0x1018;
        _LLSEEK(0x1018,2,0,0);
        goto LAB_1000_0498;
      }
    }
    uVar2 = _LCREAT(0x1018,uVar1);
  }
  unaff_CS = 0x1018;
  *(undefined2 *)(iVar4 + 0x14) = uVar2;
LAB_1000_0498:
  if (*(int *)(iVar4 + 0x14) == -1) {
    if (*(int *)(iVar4 + 0x16) == 0) {
      DAT_1008_0010 = -0x2b;
    }
    else {
      DAT_1008_0010 = -0x24;
    }
    DAT_1008_0012 = -1;
  }
  (*(code *)*(undefined2 *)(param_2 + 0x1c))
            (unaff_CS,*(undefined2 *)(iVar4 + 0x10),*(undefined2 *)(iVar4 + 0x12),uVar8,uVar9,uVar7,
             uVar10,iVar5);
  return DAT_1008_0012 == 0 && DAT_1008_0010 == 0;
}



/* ------------------------------------------------------------
 * FUN_1000_0caa @ 1000:0caa
 * selected: address-order fallback
 * body bytes: 47
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_0caa(undefined2 param_1,int *param_2)

{
  int iVar1;
  int unaff_BP;
  undefined2 unaff_CS;
  undefined2 unaff_SS;
  undefined1 local_5;
  undefined2 local_4;
  int iStack_2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  iVar1 = _LREAD(unaff_CS,1,&local_5,unaff_SS);
  if (iVar1 + -1 != 0) {
    *param_2 = *param_2 + 1;
  }
  return CONCAT11((char)((uint)(iVar1 + -1) >> 8),local_5);
}



/* ------------------------------------------------------------
 * FUN_1000_0cda @ 1000:0cda
 * selected: address-order fallback
 * body bytes: 591
 * completed: true
 */

/* WARNING: Removing unreachable block (ram,0x10000e4c) */
/* WARNING: Removing unreachable block (ram,0x10000e98) */

undefined4 * __cdecl16far
FUN_1000_0cda(undefined2 param_1,char *param_2,undefined2 param_3,char *param_4,undefined2 param_5,
             int param_6)

{
  char *pcVar1;
  int unaff_BP;
  int iVar3;
  undefined2 unaff_CS;
  undefined2 uVar4;
  undefined2 unaff_SS;
  long lVar5;
  long lVar6;
  char *pcVar7;
  undefined4 *puVar8;
  undefined2 uVar9;
  undefined4 *puVar10;
  undefined2 uVar11;
  char local_216 [512];
  undefined4 local_16;
  int local_12;
  uint local_10;
  undefined4 local_e;
  undefined4 local_a;
  char local_6;
  char local_5;
  undefined2 local_4;
  int iStack_2;
  byte bVar2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  local_12 = 0;
  local_e._2_2_ = (uint)(*param_4 != '\0');
  local_10 = (uint)(*param_4 == '\0');
  local_16 = (undefined4 *)(*(code *)*(undefined2 *)(param_6 + 8))();
  local_6 = FUN_1000_0caa(param_1,&local_10);
  if (local_10 == 0) {
    local_a._0_2_ = param_4;
    pcVar1 = param_4;
    while( true ) {
      local_a._2_2_ = param_5;
      local_5 = *pcVar1;
      if (local_5 == '\0') break;
      pcVar1 = pcVar1 + 1;
      if (local_5 == local_6) {
        local_6 = FUN_1000_0caa(param_1,&local_10);
        pcVar1 = param_4;
      }
    }
    local_10 = local_10 + 1;
    local_5 = '\0';
  }
  while (local_10 == 1) {
    local_216[local_12] = local_6;
    local_12 = local_12 + 1;
    if (0x1ff < local_12) {
      puVar10 = (undefined4 *)local_16;
      uVar11 = local_16._2_2_;
      local_a = (char *)(*(code *)*(undefined2 *)(param_6 + 0x14))();
      bVar2 = (byte)((ulong)local_a >> 8);
      pcVar1 = (char *)CONCAT11(bVar2 + 2,(char)local_a);
      iVar3 = (int)((ulong)local_a >> 0x10) + (uint)(0xfd < bVar2);
      puVar8 = (undefined4 *)local_16;
      uVar9 = local_16._2_2_;
      lVar6 = (*(code *)*(undefined2 *)(param_6 + 0x10))();
      pcVar7 = (char *)CONCAT22(iVar3,pcVar1);
      if (lVar6 == 0) goto LAB_1000_0f12;
      (*(code *)*(undefined2 *)(param_6 + 0x2c))();
      local_12 = 0;
    }
    local_a._2_2_ = param_3;
    pcVar1 = param_2;
    while( true ) {
      local_5 = *pcVar1;
      if (local_5 == '\0') break;
      pcVar1 = pcVar1 + 1;
      if (local_5 == local_6) {
        local_10 = local_10 + 1;
        goto LAB_1000_0e21;
      }
    }
    local_6 = FUN_1000_0caa(param_1,&local_10);
  }
LAB_1000_0e21:
  puVar10 = (undefined4 *)local_16;
  uVar11 = local_16._2_2_;
  local_a = (char *)(*(code *)*(undefined2 *)(param_6 + 0x14))();
  iVar3 = local_12;
  uVar4 = unaff_CS;
  local_e = CONCAT22(local_e._2_2_,(undefined2)local_e);
  if ((local_e._2_2_ != 0) &&
     (lVar6 = (long)local_12, local_e = CONCAT22(local_e._2_2_,(undefined2)local_e),
     1 < (long)(local_a + local_12))) {
    uVar4 = 0x1018;
    local_e = _LLSEEK(unaff_CS,1,0,0);
    if (local_e != -1) {
      uVar4 = 0x1018;
      lVar5 = _LLSEEK(0x1018,0,(int)local_e + -1,
                      (int)((ulong)local_e >> 0x10) - (uint)((int)local_e == 0));
      if ((lVar5 != -1) && (1 < (long)(local_a + lVar6))) {
        iVar3 = iVar3 + -1;
      }
    }
  }
  pcVar7 = local_a + iVar3;
  puVar8 = (undefined4 *)local_16;
  uVar9 = local_16._2_2_;
  lVar6 = (*(code *)*(undefined2 *)(param_6 + 0x10))
                    (uVar4,pcVar7,(undefined4 *)local_16,local_16._2_2_,puVar10,uVar11);
  unaff_CS = uVar4;
  if (lVar6 == 0) {
LAB_1000_0f12:
    (*(code *)*(undefined2 *)(param_6 + 0xc))
              (unaff_CS,(undefined4 *)local_16,local_16._2_2_,pcVar7,puVar8,uVar9,puVar10,uVar11);
    local_16._0_2_ = (undefined4 *)0x0;
  }
  else {
    (*(code *)*(undefined2 *)(param_6 + 0x2c))(uVar4,iVar3,iVar3 >> 0xf,local_216);
    ((char *)local_a)[iVar3 + (int)*local_16 + -1] = '\0';
  }
  return (undefined4 *)local_16;
}



/* ------------------------------------------------------------
 * FUN_1000_1134 @ 1000:1134
 * selected: address-order fallback
 * body bytes: 47
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_1134(undefined2 param_1)

{
  undefined1 uStack_7;
  
  uStack_7 = (undefined1)((uint)param_1 >> 8);
  return CONCAT11((char)param_1,uStack_7);
}



/* ------------------------------------------------------------
 * FUN_1000_133a @ 1000:133a
 * selected: address-order fallback
 * body bytes: 44
 * completed: true
 */

void __cdecl16far FUN_1000_133a(void)

{
  LIBMAIN(DAT_1008_0136,DAT_1008_0138,DAT_1008_0134,DAT_1008_0132,DAT_1008_0130);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_144c @ 1000:144c
 * selected: address-order fallback
 * body bytes: 24
 * completed: true
 */

undefined2 __stdcall16far FUN_1000_144c(void)

{
  return 1;
}



/* ------------------------------------------------------------
 * FUN_1000_1464 @ 1000:1464
 * selected: address-order fallback
 * body bytes: 72
 * completed: true
 */

void __cdecl16far FUN_1000_1464(void)

{
  int unaff_BP;
  int iVar1;
  bool bVar2;
  undefined2 uVar3;
  
  iVar1 = unaff_BP + 1;
  uVar3 = 0x1008;
  if (DAT_1008_01b8 != 0) {
    bVar2 = false;
    (*DAT_1008_01b6)();
    if (bVar2) {
      FUN_1000_18fc();
      return;
    }
  }
  FUN_1000_1534(uVar3,iVar1);
  FUN_1000_1534();
  FUN_1000_1534();
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_14ac @ 1000:14ac
 * selected: address-order fallback
 * body bytes: 80
 * completed: true
 */

undefined2 __cdecl16far FUN_1000_14ac(void)

{
  DAT_1008_0187 = 1;
  FUN_1000_1534();
  FUN_1000_1534();
  FUN_1000_1534();
  FUN_1000_1534();
  FUN_1000_1ee8();
  FUN_1000_19b2();
  return 0x100;
}



/* ------------------------------------------------------------
 * FUN_1000_1534 @ 1000:1534
 * selected: address-order fallback
 * body bytes: 19
 * completed: true
 */

void __cdecl16near FUN_1000_1534(void)

{
  int *piVar1;
  int *unaff_SI;
  int *unaff_DI;
  int *piVar2;
  
  while (unaff_SI < unaff_DI) {
    piVar2 = unaff_DI + -2;
    piVar1 = unaff_DI + -1;
    unaff_DI = piVar2;
    if (*piVar2 != 0 || *piVar1 != 0) {
      (*(code *)*piVar2)();
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1548 @ 1000:1548
 * selected: address-order fallback
 * body bytes: 35
 * completed: true
 */

void __cdecl16far FUN_1000_1548(void)

{
  FUN_1000_15a3(0xfc);
  FUN_1000_15a3(0xff);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_156c @ 1000:156c
 * selected: address-order fallback
 * body bytes: 55
 * completed: true
 */

int * __stdcall16far FUN_1000_156c(int param_1)

{
  int *piVar1;
  int iVar2;
  int *piVar3;
  int *piVar4;
  
  piVar3 = (int *)&DAT_1008_01ca;
  do {
    piVar1 = piVar3;
    piVar3 = piVar3 + 1;
    piVar4 = piVar3;
    if ((*piVar1 == param_1) || (piVar4 = (int *)0x0, *piVar1 == -1)) {
      return piVar4;
    }
    iVar2 = -1;
    do {
      if (iVar2 == 0) break;
      iVar2 = iVar2 + -1;
      piVar1 = piVar3;
      piVar3 = (int *)((int)piVar3 + 1);
    } while ((char)*piVar1 != '\0');
  } while( true );
}



/* ------------------------------------------------------------
 * FUN_1000_15a3 @ 1000:15a3
 * selected: address-order fallback
 * body bytes: 23
 * completed: true
 */

undefined2 __stdcall16far FUN_1000_15a3(void)

{
  return 0x1008;
}



/* ------------------------------------------------------------
 * FUN_1000_15ba @ 1000:15ba
 * selected: address-order fallback
 * body bytes: 151
 * completed: true
 */

void __cdecl16far FUN_1000_15ba(void)

{
  char cVar1;
  undefined2 *puVar2;
  int iVar3;
  int iVar4;
  undefined2 uVar5;
  undefined2 uVar6;
  int iVar7;
  char *pcVar8;
  char *pcVar9;
  undefined4 uVar10;
  char *pcVar11;
  undefined2 *puVar12;
  
  uVar10 = GETDOSENVIRONMENT();
  iVar4 = (int)((ulong)uVar10 >> 0x10);
  if ((int)uVar10 != 0) {
    iVar4 = 0;
  }
  iVar7 = 0;
  pcVar8 = (char *)0x0;
  iVar3 = -1;
  if (iVar4 != 0) {
    cVar1 = *(char *)0x0;
    while (cVar1 != '\0') {
      do {
        if (iVar3 == 0) break;
        iVar3 = iVar3 + -1;
        pcVar11 = pcVar8;
        pcVar8 = pcVar8 + 1;
      } while (*pcVar11 != '\0');
      iVar7 = iVar7 + 1;
      pcVar11 = pcVar8;
      pcVar8 = pcVar8 + 1;
      cVar1 = *pcVar11;
    }
  }
  pcVar11 = (char *)FUN_1000_1902();
  uVar5 = (undefined2)((ulong)pcVar11 >> 0x10);
  pcVar9 = (char *)pcVar11;
  puVar12 = (undefined2 *)FUN_1000_1902();
  uVar6 = (undefined2)((ulong)puVar12 >> 0x10);
  DAT_1008_017c = (undefined2 *)puVar12;
  pcVar8 = (char *)0x0;
  for (; DAT_1008_017e = (undefined2)((ulong)puVar12 >> 0x10), puVar2 = (undefined2 *)puVar12,
      iVar7 != 0; iVar7 = iVar7 + -1) {
    *puVar2 = pcVar9;
    puVar2[1] = uVar5;
    do {
      pcVar11 = pcVar8;
      pcVar8 = pcVar8 + 1;
      cVar1 = *pcVar11;
      pcVar11 = pcVar9;
      pcVar9 = pcVar9 + 1;
      *pcVar11 = cVar1;
      puVar12 = (undefined2 *)CONCAT22(DAT_1008_017e,puVar2 + 2);
    } while (cVar1 != '\0');
  }
  *puVar2 = 0;
  puVar2[1] = 0;
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_165c @ 1000:165c
 * selected: address-order fallback
 * body bytes: 66
 * completed: true
 */

void FUN_1000_165c(undefined2 param_1,undefined2 param_2)

{
  char *pcVar1;
  undefined2 in_AX;
  char *pcVar2;
  int iVar3;
  int unaff_BP;
  char *pcVar4;
  undefined2 unaff_CS;
  undefined2 in_stack_00000000;
  undefined2 uVar5;
  
  uVar5 = in_AX;
  FUN_1000_1548();
  FUN_1000_15a3(in_AX);
  pcVar2 = (char *)FUN_1000_156c(uVar5);
  if (pcVar2 != (char *)0x0) {
    iVar3 = 9;
    if (*pcVar2 == 'M') {
      iVar3 = 0xf;
    }
    pcVar2 = pcVar2 + iVar3;
    iVar3 = 0x22;
    pcVar4 = pcVar2;
    do {
      if (iVar3 == 0) break;
      iVar3 = iVar3 + -1;
      pcVar1 = pcVar4;
      pcVar4 = pcVar4 + 1;
    } while (*pcVar1 != '\r');
    pcVar4[-1] = '\0';
  }
  uVar5 = 0;
  FATALAPPEXIT(unaff_CS,pcVar2,0x1008);
  FATALEXIT(0x1018,0xff,uVar5);
  FUN_1000_16bc(0,in_stack_00000000,param_1,param_2,0x1008,unaff_BP + 1);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_169e @ 1000:169e
 * selected: address-order fallback
 * body bytes: 29
 * completed: true
 */

void __cdecl16far FUN_1000_169e(undefined2 param_1,undefined2 param_2,undefined2 param_3)

{
  int unaff_BP;
  
  FUN_1000_16bc(0,param_1,param_2,param_3,0x1008,unaff_BP + 1);
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_16bc @ 1000:16bc
 * selected: address-order fallback
 * body bytes: 293
 * completed: true
 */

/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

uint __cdecl16far FUN_1000_16bc(int param_1,uint param_2,uint param_3,int param_4)

{
  int iVar1;
  uint uVar2;
  int unaff_BP;
  undefined2 unaff_SS;
  char *local_130;
  undefined2 local_124;
  int local_118;
  undefined1 local_116;
  undefined1 local_115;
  char local_110;
  char *local_10e;
  char local_108 [260];
  undefined2 local_4;
  int iStack_2;
  
  iStack_2 = unaff_BP + 1;
  local_4 = 0x1008;
  _local_130 = (char *)CONCAT22(unaff_SS,local_108);
  if (param_1 == 0) {
    param_1 = FUN_1000_1a88();
  }
  *_local_130 = (char)param_1 + '@';
  local_108[1] = 0x3a;
  local_10e = local_108 + 3;
  local_108[2] = 0x5c;
  local_115 = 0x47;
  local_110 = (char)param_1;
  FUN_1000_1a0a(&local_116);
  if (local_118 == 0) {
    iVar1 = FUN_1000_19f0(local_108);
    iVar1 = iVar1 + 1;
    local_130 = (char *)param_2;
    param_2 = param_3 | param_2;
    uVar2 = param_3;
    if (param_2 == 0) {
      if (param_4 < iVar1) {
        param_4 = iVar1;
      }
      local_130 = (char *)FUN_1000_1f41(param_4);
      uVar2 = param_2;
      if (param_2 == 0 && local_130 == (char *)0x0) {
        DAT_1008_0152 = 0xc;
        return (uint)local_130;
      }
    }
    if (iVar1 <= param_4) {
      uVar2 = FUN_1000_19b4(local_130,uVar2,local_108);
      return uVar2;
    }
    DAT_1008_0152 = 0x22;
  }
  else {
    DAT_1008_0152 = 0xd;
    _DAT_1008_015e = local_124;
  }
  return 0;
}



/* ------------------------------------------------------------
 * FUN_1000_17e4 @ 1000:17e4
 * selected: address-order fallback
 * body bytes: 145
 * completed: true
 */

void __cdecl16near FUN_1000_17e4(void)

{
  int *piVar1;
  undefined2 uVar2;
  int iVar3;
  uint uVar4;
  int in_CX;
  uint uVar5;
  int iVar6;
  int in_BX;
  uint *unaff_SI;
  undefined2 *puVar7;
  bool bVar8;
  
  if ((*(byte *)(in_BX + 2) & 1) != 0) {
    FUN_1000_18db();
    if ((*unaff_SI & 1) != 0) {
      in_CX = (in_CX - *unaff_SI) + -1;
    }
    uVar4 = *(uint *)(in_BX + 4);
    if (uVar4 != 0) {
      if (!CARRY2(in_CX + 2U,uVar4)) {
        uVar2 = FUN_1000_198e();
        uVar4 = *(uint *)&DAT_1008_018c;
        if (uVar4 == 0x1000) goto LAB_1000_1836;
        uVar5 = 0x8000;
        while (uVar4 <= uVar5) {
          uVar5 = uVar5 >> 1;
          if (uVar5 == 0) goto LAB_1000_184f;
        }
        if (uVar5 < 8) goto LAB_1000_184f;
        uVar4 = uVar5 << 1;
        goto LAB_1000_1836;
      }
      uVar5 = 0xfff0;
      if (in_CX + 2U + uVar4 == 0) {
        while( true ) {
          bVar8 = false;
          iVar3 = FUN_1000_1875();
          if (!bVar8) break;
          if (uVar5 == 0xfff0) {
            return;
          }
LAB_1000_184f:
          uVar4 = 0x10;
LAB_1000_1836:
          uVar5 = ~(uVar4 - 1);
        }
        iVar6 = iVar3 - *(int *)(in_BX + 4);
        *(int *)(in_BX + 4) = iVar3;
        *(undefined2 *)(in_BX + 10) = unaff_SI;
        piVar1 = (int *)*(int *)(in_BX + 0xc);
        *piVar1 = iVar6 + -1;
        puVar7 = (undefined2 *)((int)piVar1 + iVar6);
        *puVar7 = 0xfffe;
        *(undefined2 *)(in_BX + 0xc) = puVar7;
      }
    }
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_1875 @ 1000:1875
 * selected: address-order fallback
 * body bytes: 102
 * completed: true
 */

void __cdecl16near FUN_1000_1875(void)

{
  int in_AX;
  int iVar1;
  int in_BX;
  long lVar2;
  int iVar3;
  int iVar4;
  
  if ((*(byte *)(in_BX + 2) & 4) == 0) {
    iVar3 = *(int *)(in_BX + 6);
    iVar4 = iVar3;
    iVar1 = GLOBALREALLOC(0x1000,0x2020,in_AX,in_AX == 0);
    if (iVar1 != 0) {
      if ((iVar1 != iVar3) || (lVar2 = GLOBALSIZE(0x1018,iVar3,iVar4), lVar2 == 0))
      goto LAB_1000_18d0;
      if ((*(byte *)(iVar3 + 2) & 4) != 0) {
        *(int *)(iVar3 + -2) = in_BX + -1;
      }
    }
    return;
  }
LAB_1000_18d0:
  FUN_1000_165c();
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_18db @ 1000:18db
 * selected: address-order fallback
 * body bytes: 32
 * completed: true
 */

void __cdecl16near FUN_1000_18db(void)

{
  int in_BX;
  uint *puVar1;
  
  puVar1 = (uint *)*(undefined2 *)(in_BX + 10);
  if (puVar1 == (uint *)*(undefined2 *)(in_BX + 0xc)) {
    puVar1 = (uint *)*(undefined2 *)(in_BX + 8);
  }
  while( true ) {
    if (*puVar1 == 0xfffe) break;
    puVar1 = (uint *)((int)puVar1 + (*puVar1 & 0xfffe) + 2);
  }
  return;
}



/* ------------------------------------------------------------
 * FUN_1000_18fc @ 1000:18fc
 * selected: address-order fallback
 * body bytes: 6
 * completed: true
 */

void FUN_1000_18fc(void)

{
  FUN_1000_165c();
  return;
}



