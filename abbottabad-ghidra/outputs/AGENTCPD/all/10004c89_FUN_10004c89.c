
void __cdecl FUN_10004c89(char *param_1,int param_2,uint param_3)

{
  char cVar1;
  int iVar2;
  char *pcVar3;
  char *pcVar4;
  uint uVar5;
  ushort uVar6;
  uint uVar7;
  char local_108 [259];
  byte local_5;
  
  pcVar3 = param_1;
  uVar6 = 0;
  uVar7 = 0;
  local_5 = 0;
  do {
    uVar5 = uVar7 % param_3;
    pcVar4 = local_108 + uVar7;
    pcVar4[(int)param_1 - (int)local_108] = (char)uVar6;
    uVar6 = uVar6 + 1;
    uVar7 = uVar7 + 1;
    *pcVar4 = *(char *)(uVar5 + param_2);
  } while (uVar6 < 0x100);
  iVar2 = -(int)param_1;
  param_1 = (char *)0x100;
  pcVar4 = pcVar3;
  do {
    cVar1 = *pcVar4;
    local_5 = local_5 + pcVar4[(int)(local_108 + iVar2)] + cVar1;
    *pcVar4 = pcVar3[local_5];
    pcVar4 = pcVar4 + 1;
    param_1 = param_1 + -1;
    pcVar3[local_5] = cVar1;
  } while (param_1 != (char *)0x0);
  return;
}

