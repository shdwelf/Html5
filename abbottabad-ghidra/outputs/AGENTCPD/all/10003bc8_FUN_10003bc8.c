
int __cdecl FUN_10003bc8(uint param_1,uint param_2)

{
  byte bVar1;
  uint uVar2;
  int iVar3;
  uint uVar4;
  uint uVar5;
  byte *pbVar6;
  undefined4 *puVar7;
  char *pcVar8;
  char local_108;
  undefined4 local_107;
  int local_14;
  uint local_10;
  int local_c;
  int local_8;
  
  local_108 = '\0';
  puVar7 = &local_107;
  for (iVar3 = 0x3c; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar7 = 0;
    puVar7 = puVar7 + 1;
  }
  local_8 = 0;
  *(undefined2 *)puVar7 = 0;
  *(undefined *)((int)puVar7 + 2) = 0;
  if (param_1 < 0xf4241) {
    local_14 = 0x32;
    pbVar6 = (byte *)(param_2 + 0x16);
    do {
      if (*(short *)(pbVar6 + -2) != 0) {
        iVar3 = *(int *)(pbVar6 + 1);
        bVar1 = *pbVar6;
        if (bVar1 < 0x81) {
          param_2 = 1;
          local_10 = (uint)bVar1;
        }
        else {
          param_2 = 8;
          local_10 = bVar1 - 0x80;
        }
        local_c = 0;
        while (local_10 != 0) {
          if (param_2 != 0) {
            uVar4 = param_2 >> 2;
            pcVar8 = &local_108 + local_c + (iVar3 - 0x200U >> 0xc);
            while (uVar4 != 0) {
              uVar4 = uVar4 - 1;
              builtin_strncpy(pcVar8,"\x01\x01\x01\x01",4);
              pcVar8 = pcVar8 + 4;
            }
            for (uVar4 = param_2 & 3; uVar4 != 0; uVar4 = uVar4 - 1) {
              *pcVar8 = '\x01';
              pcVar8 = pcVar8 + 1;
            }
            local_c = local_c + param_2;
          }
          local_10 = local_10 - 1;
        }
      }
      pbVar6 = pbVar6 + 9;
      local_14 = local_14 + -1;
    } while (local_14 != 0);
    if (param_1 < 0x1001) {
      uVar2 = 0;
      do {
        if ((&local_108)[uVar2] == '\0') {
LAB_10003cf1:
          return uVar2 * 0x1000 + 0x200;
        }
        uVar2 = uVar2 + 1;
      } while (uVar2 < 0xf4);
    }
    else {
      uVar4 = param_1 >> 0xc;
      if (uVar4 < 0xf5) {
        uVar2 = 0;
        do {
          if ((&local_108)[uVar2] == '\0') {
            uVar5 = 0;
            if (uVar4 != 0) {
              do {
                if ((&local_108)[uVar5 + uVar2] == '\x01') break;
                uVar5 = uVar5 + 1;
              } while (uVar5 < uVar4);
            }
            if (uVar5 == uVar4) {
              if (0xf4 < uVar5 + uVar2) {
                return local_8;
              }
              goto LAB_10003cf1;
            }
            uVar2 = uVar2 + uVar5;
          }
          uVar2 = uVar2 + 1;
        } while (uVar2 < 0xf4);
      }
    }
  }
  else {
    local_8 = 0;
  }
  return local_8;
}

