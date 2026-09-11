
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void entry(void)

{
  bool bVar1;
  int iVar2;
  SHORT SVar3;
  char *pcVar4;
  BOOL BVar5;
  char *pcVar6;
  byte *pbVar7;
  short sVar8;
  short sVar9;
  undefined4 *in_FS_OFFSET;
  undefined4 uStack_28;
  undefined *puStack_24;
  undefined *puStack_20;
  
  puStack_20 = (undefined *)0x404547;
  FUN_00403bb0(&DAT_00404504);
  puStack_24 = &LAB_00404730;
  uStack_28 = *in_FS_OFFSET;
  *in_FS_OFFSET = &uStack_28;
  puStack_20 = &stack0xfffffffc;
  FUN_00403dcc();
  DAT_00406548 = 1;
  DAT_00406544 = DAT_004064dc;
  FUN_00402d94(&DAT_0040652c,DAT_004064d8);
  FUN_00402e5c(&DAT_00406538,(byte *)&DAT_004064dd);
  sVar8 = 2;
  pcVar6 = &DAT_004064f8;
  do {
    iVar2 = DAT_00406548;
    bVar1 = false;
    if ((short)DAT_00406548 != 0) {
      pcVar4 = &DAT_00406544;
      sVar9 = (short)DAT_00406548;
      bVar1 = false;
      do {
        if (*pcVar4 == *pcVar6) {
          bVar1 = true;
        }
        pcVar4 = pcVar4 + 1;
        sVar9 = sVar9 + -1;
      } while (sVar9 != 0);
    }
    if (!bVar1) {
      DAT_00406548 = DAT_00406548 + 1;
      (&DAT_00406544)[iVar2] = *pcVar6;
      FUN_00402e5c((int *)(DAT_00406548 * 4 + 0x406534),(byte *)(pcVar6 + 1));
      FUN_00402d94((int *)(&DAT_00406528 + DAT_00406548 * 4),*(undefined4 **)(pcVar6 + -4));
    }
    pcVar6 = pcVar6 + 0x1c;
    sVar8 = sVar8 + -1;
  } while (sVar8 != 0);
  DAT_004065be = 0;
  DAT_004065d0 = GetModuleHandleA((LPCSTR)0x0);
  _DAT_004065c0 = 0x40;
  _DAT_004065c4 = &LAB_00404438;
  _DAT_004065dc = 1;
  _DAT_004065e4 = s_Nosy_Bitch___Stay_OUT_of_my_code_00404740;
  DAT_004065e8 = DAT_004065d0;
  _DAT_004065d8 = LoadCursorA((HINSTANCE)0x0,(LPCSTR)0x7f00);
  _DAT_004065d4 = LoadIconA(DAT_004065d0,&DAT_00404764);
  RegisterClassA((WNDCLASSA *)&DAT_004065c0);
  do {
    sVar9 = 0;
    sVar8 = 3;
    pbVar7 = &DAT_004064dc;
    do {
      SVar3 = GetAsyncKeyState((uint)*pbVar7);
      sVar9 = sVar9 + SVar3;
      pbVar7 = pbVar7 + 0x1c;
      sVar8 = sVar8 + -1;
    } while (sVar8 != 0);
  } while (sVar9 != 0);
  DAT_004065ec = CreateWindowExA(0x40000,s_Nosy_Bitch___Stay_OUT_of_my_code_00404740,
                                 s_Class_Trainer_1999_0040476c,0x10c80000,0x14,10,0x140,0xb4,
                                 (HWND)0x0,(HMENU)0x0,DAT_004065e8,(LPVOID)0x0);
  FUN_00403f74();
  SetTimer(DAT_004065ec,0,100,(TIMERPROC)&LAB_00404324);
  UpdateWindow(DAT_004065ec);
  while( true ) {
    BVar5 = GetMessageA((LPMSG)&DAT_004065f0,DAT_004065ec,0,0);
    if (BVar5 == 0) break;
    TranslateMessage((MSG *)&DAT_004065f0);
    DispatchMessageA((MSG *)&DAT_004065f0);
  }
  *in_FS_OFFSET = uStack_28;
  return;
}

