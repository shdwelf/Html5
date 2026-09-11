
int FUN_10003d01(void)

{
  byte bVar1;
  uint uVar2;
  int iVar3;
  uint uVar4;
  byte *pbVar5;
  int iVar6;
  char *pcVar7;
  undefined4 *puVar8;
  char *pcVar9;
  char local_10c;
  undefined4 local_10b;
  int *local_18;
  uint local_14;
  int local_10;
  uint local_c;
  uint local_8;
  
  local_10c = '\0';
  iVar6 = 0;
  puVar8 = &local_10b;
  for (iVar3 = 0x3c; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar8 = 0;
    puVar8 = puVar8 + 1;
  }
  local_8 = 0;
  *(undefined2 *)puVar8 = 0;
  *(undefined *)((int)puVar8 + 2) = 0;
  local_18 = FUN_10003b5b();
  if (local_18 != (int *)0x0) {
    pbVar5 = (byte *)((int)local_18 + 0x16);
    local_10 = 0x32;
    do {
      if (*(short *)(pbVar5 + -2) != 0) {
        bVar1 = *pbVar5;
        if (bVar1 < 0x81) {
          local_14 = 1;
          uVar2 = (uint)bVar1;
        }
        else {
          local_14 = 8;
          uVar2 = bVar1 - 0x80;
        }
        if (uVar2 != 0) {
          pcVar7 = &local_10c + (*(int *)(pbVar5 + 1) - 0x200U >> 0xc);
          local_c = uVar2;
          do {
            uVar2 = local_14;
            if (local_14 != 0) {
              uVar4 = local_14 >> 2;
              pcVar9 = pcVar7;
              while (uVar4 != 0) {
                uVar4 = uVar4 - 1;
                builtin_strncpy(pcVar9,"\x01\x01\x01\x01",4);
                pcVar9 = pcVar9 + 4;
              }
              for (uVar2 = uVar2 & 3; uVar2 != 0; uVar2 = uVar2 - 1) {
                *pcVar9 = '\x01';
                pcVar9 = pcVar9 + 1;
              }
            }
            pcVar7 = pcVar7 + 1;
            local_c = local_c - 1;
          } while (local_c != 0);
        }
      }
      pbVar5 = pbVar5 + 9;
      local_10 = local_10 + -1;
    } while (local_10 != 0);
    uVar2 = 0;
    do {
      uVar4 = uVar2;
      if ((&local_10c)[uVar2] == '\0') {
        for (; (uVar4 < 0xf4 && ((&local_10c)[uVar4 + uVar2] != '\x01')); uVar4 = uVar4 + 1) {
        }
        if (local_8 < uVar4 - uVar2) {
          local_8 = uVar4 - uVar2;
        }
        uVar2 = uVar2 + uVar4;
      }
      iVar6 = local_8 << 0xc;
      uVar2 = uVar2 + 1;
    } while (uVar2 < 0xf4);
    free(local_18);
  }
  return iVar6;
}

