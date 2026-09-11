
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void entry(void)

{
  DWORD DVar1;
  int iVar2;
  byte *pbVar3;
  HMODULE pHVar4;
  UINT UVar5;
  undefined4 uVar6;
  _STARTUPINFOA local_60;
  undefined *local_1c;
  _EXCEPTION_POINTERS *local_18;
  void *pvStack_14;
  undefined *puStack_10;
  undefined *puStack_c;
  undefined4 local_8;
  
  local_8 = 0xffffffff;
  puStack_c = &DAT_00405138;
  puStack_10 = &LAB_00402590;
  pvStack_14 = ExceptionList;
  local_1c = &stack0xffffff88;
  ExceptionList = &pvStack_14;
  DVar1 = GetVersion();
  _DAT_004065bc = DVar1 >> 8 & 0xff;
  _DAT_004065b8 = DVar1 & 0xff;
  _DAT_004065b4 = _DAT_004065b8 * 0x100 + _DAT_004065bc;
  _DAT_004065b0 = DVar1 >> 0x10;
  iVar2 = FUN_0040245c(0);
  if (iVar2 == 0) {
    FUN_00401ad4(0x1c);
  }
  local_8 = 0;
  FUN_004022b1();
  DAT_00406ab8 = GetCommandLineA();
  DAT_00406598 = FUN_0040217f();
  FUN_00401f32();
  FUN_00401e79();
  FUN_00401b9b();
  local_60.dwFlags = 0;
  GetStartupInfoA(&local_60);
  pbVar3 = FUN_00401e21();
  uVar6 = 0;
  pHVar4 = GetModuleHandleA((LPCSTR)0x0);
  UVar5 = FUN_004016a0(pHVar4,uVar6,pbVar3);
  FUN_00401bc8(UVar5);
  FUN_00401c9d(local_18->ExceptionRecord->ExceptionCode,local_18);
  return;
}

