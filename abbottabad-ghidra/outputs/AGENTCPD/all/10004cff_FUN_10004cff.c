
void __cdecl FUN_10004cff(byte *param_1,int param_2)

{
  byte *pbVar1;
  byte bVar2;
  uint uVar3;
  uint uVar4;
  byte *pbVar5;
  byte local_118 [256];
  char local_18 [16];
  byte *local_8;
  
  pbVar5 = param_1;
  local_18[0] = '\0';
  param_1 = (byte *)0x0;
  pbVar1 = pbVar5 + param_2;
  local_18[1] = '\0';
  local_18[2] = '\0';
  local_18[3] = '\0';
  local_18[4] = '\0';
  local_18[5] = '\0';
  local_18[6] = '\0';
  local_18[7] = '\0';
  local_18[8] = '\0';
  local_18[9] = '\0';
  local_18[10] = '\0';
  local_18[0xb] = '\0';
  local_18[0xc] = '\0';
  param_2 = 0;
  local_18[0xd] = '\0';
  local_18[0xe] = '\0';
  local_18[0xf] = 0;
  local_8 = pbVar1;
  memcpy(local_18,&DAT_10005154,0x10);
  uVar4 = 0;
  do {
    local_18[uVar4] = local_18[uVar4] + (char)uVar4;
    uVar4 = uVar4 + 1;
  } while (uVar4 < 0x10);
  FUN_10004c89((char *)local_118,(int)local_18,0x10);
  if (pbVar5 < pbVar1) {
    do {
      uVar4 = (uint)(byte)(param_1._3_1_ + 1);
      param_1 = (byte *)(uVar4 << 0x18);
      bVar2 = local_118[uVar4];
      uVar3 = (uint)(byte)(param_2._3_1_ + bVar2);
      param_2 = uVar3 << 0x18;
      local_118[uVar4] = local_118[uVar3];
      local_118[uVar3] = bVar2;
      *pbVar5 = *pbVar5 ^ local_118[(byte)(local_118[uVar4] + bVar2)];
      pbVar5 = pbVar5 + 1;
    } while (pbVar5 < local_8);
  }
  return;
}

