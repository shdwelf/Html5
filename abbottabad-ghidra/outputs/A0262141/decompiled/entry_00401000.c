
/* WARNING: Instruction at (ram,0x00401040) overlaps instruction at (ram,0x0040103e)
    */
/* WARNING: Control flow encountered bad instruction data */
/* WARNING: Unable to track spacebase fully for stack */
/* WARNING: Removing unreachable block (ram,0x0040109f) */
/* WARNING: Removing unreachable block (ram,0x004010a1) */
/* WARNING: Removing unreachable block (ram,0x004010b4) */
/* WARNING: Removing unreachable block (ram,0x004010d0) */
/* WARNING: Removing unreachable block (ram,0x004010d2) */
/* WARNING: Removing unreachable block (ram,0x00401145) */
/* WARNING: Removing unreachable block (ram,0x00401040) */
/* WARNING: Removing unreachable block (ram,0x004010d6) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int entry(undefined4 param_1,int param_2,int param_3,undefined4 param_4,int *param_5,int param_6,
         undefined4 param_7,undefined *param_8)

{
  undefined4 *puVar1;
  undefined4 uVar2;
  code *pcVar3;
  int iVar4;
  char extraout_CH;
  undefined2 uVar5;
  char cVar6;
  int unaff_EBX;
  undefined4 *unaff_ESI;
  undefined4 *puVar7;
  undefined4 *unaff_EDI;
  char *pcVar8;
  undefined2 in_CS;
  int *in_FS_OFFSET;
  bool bVar9;
  char *pcStack_8;
  undefined4 *puStack_4;
  
  puStack_4 = (undefined4 *)&LAB_004cc7dc;
  pcStack_8 = (char *)*in_FS_OFFSET;
  *in_FS_OFFSET = (int)&pcStack_8;
  iVar4 = 0;
  bVar9 = SCARRY4(unaff_EBX,1);
  puVar1 = unaff_ESI + 1;
  uVar5 = (undefined2)param_2;
  out(*unaff_ESI,uVar5);
  uVar2 = in(uVar5);
  iRam00000000 = param_3;
  *unaff_EDI = uVar2;
  puVar7 = puVar1;
  if (!bVar9) {
    *(undefined2 *)(param_2 + (int)puVar1) = *(undefined2 *)(param_2 + (int)puVar1);
    *(byte *)(unaff_EBX + 0x6f) = *(byte *)(unaff_EBX + 0x6f) | (byte)param_2;
    *(char *)((int)unaff_EDI + 0x1b) =
         *(char *)((int)unaff_EDI + 0x1b) + (char)((uint)(unaff_EBX + 2) >> 8);
    cVar6 = (char)(unaff_EBX + 2);
    bVar9 = SCARRY1(DAT_a5cc4569,cVar6);
    DAT_a5cc4569 = DAT_a5cc4569 + cVar6;
    puVar7 = puStack_4;
    pcVar8 = pcStack_8;
    if (bVar9 == SCARRY1(DAT_a5cc4569,'\0')) {
      *(byte *)((int)unaff_ESI + 0x4204073f) = *(byte *)((int)unaff_ESI + 0x4204073f) | 0x79;
      param_5 = (int *)(unaff_EBX + 3);
      out(*puVar1,uVar5);
      param_8 = &DAT_a5cc4569;
      param_7 = 0x402112b;
      param_6 = param_2;
      puVar7 = unaff_ESI + 2;
      pcVar8 = (char *)(unaff_EDI + 1);
    }
    iVar4 = (*(code *)(param_8 + 0x5c614308))(param_8,param_6 + *param_5,param_7,in_CS);
    bVar9 = SBORROW1(*pcVar8,extraout_CH);
  }
  pcVar3 = (code *)swi(4);
  if (bVar9 == true) {
    iVar4 = (*pcVar3)();
  }
  if ((char)puVar7 != '\0' ||
      *(char *)((int)puVar7 + (iVar4 + -0x4f6ffee9) * 4 + 0x53060b0b) != '\0') {
    if (_DAT_56070c23 == 0) {
      return _DAT_56070c27 + 0x30f658b2;
    }
    pcVar3 = (code *)swi(3);
    iVar4 = (*pcVar3)();
    return iVar4;
  }
                    /* WARNING: Bad instruction - Truncating control flow here */
  halt_baddata();
}

