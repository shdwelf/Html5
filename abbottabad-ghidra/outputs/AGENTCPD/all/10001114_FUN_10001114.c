
int __cdecl FUN_10001114(int param_1,undefined2 *param_2)

{
  char cVar1;
  undefined4 uVar2;
  byte *pbVar3;
  undefined4 *puVar4;
  int *piVar5;
  int *piVar6;
  uint uVar7;
  code *pcVar8;
  undefined2 *puVar9;
  int iVar10;
  undefined4 local_30;
  undefined4 local_2c;
  undefined uStack_28;
  uint local_24;
  int *local_20;
  uint local_1c;
  undefined2 *local_18;
  int local_14;
  int *local_10;
  int local_c;
  char local_5;
  
  local_5 = '\0';
  iVar10 = 0;
  local_14 = 0;
  local_18 = (undefined2 *)0x0;
  local_1c = 0;
  if ((DAT_1000626c != 0) && (DAT_10006270 != 0)) {
    local_c = FUN_1000407f(&local_10);
    if (local_c == 0) {
      if ((*(uint *)((int)local_10 + 6) < 0x33) && (*local_10 == -0x32313030)) {
        local_14 = 0;
        local_18 = (undefined2 *)malloc(*(uint *)((int)local_10 + 6) * 2);
        if (local_18 != (undefined2 *)0x0) {
          puVar9 = local_18 + -1;
          do {
            if ((*(char *)(iVar10 + 0x16 + (int)local_10) != '\0') &&
               ((cVar1 = *(char *)(iVar10 + 0x12 + (int)local_10), cVar1 == DAT_10006010 ||
                (cVar1 == -1)))) {
              local_14 = local_14 + 1;
              puVar9 = puVar9 + 1;
              *puVar9 = *(undefined2 *)((int)local_10 + iVar10 + 0x14);
            }
            iVar10 = iVar10 + 9;
          } while (iVar10 < 0x1c2);
        }
        pcVar8 = free_exref;
        if (DAT_10006010 == '\0') {
          local_c = 1;
          pbVar3 = (byte *)malloc(0x1e6);
          pcVar8 = free_exref;
          if (pbVar3 != (byte *)0x0) {
            pbVar3[0] = 0x17;
            pbVar3[1] = 0;
            pbVar3[2] = 0;
            pbVar3[3] = 0;
            pbVar3[4] = 0xd4;
            pbVar3[5] = 1;
            pbVar3[6] = 0;
            pbVar3[7] = 0;
            pbVar3[8] = 0x14;
            pbVar3[9] = 0;
            pbVar3[10] = 0;
            pbVar3[0xb] = 0;
            uVar2 = *(undefined4 *)(param_2 + 2);
            pbVar3[0x10] = 0;
            *(undefined4 *)(pbVar3 + 0xc) = uVar2;
            memcpy(pbVar3 + 0x11,local_10,0x1d4);
            FUN_10004b9b(pbVar3,0x1e6);
            pcVar8 = free_exref;
            free(pbVar3);
          }
        }
        (*pcVar8)(local_10);
      }
      else {
        FUN_10004249((uint)param_2);
        pcVar8 = free_exref;
      }
      if (local_14 != 0) {
        param_2 = local_18;
        do {
          local_c = FUN_10002478((void *)CONCAT22((short)((uint)param_2 >> 0x10),*param_2),&local_20
                                 ,&local_24);
          if (local_c != 0) {
            if (local_24 < (uint)local_20[1]) {
              local_20[1] = local_24;
            }
            if (((0 < *local_20) && (*local_20 < 0x18)) &&
               (pbVar3 = (byte *)FUN_10001455(local_20), pbVar3 != (byte *)0x0)) {
              local_c = 1;
              *(int *)(pbVar3 + 0xc) = param_1;
              if (DAT_10006010 == '\0') {
                FUN_10004b9b(pbVar3,*(int *)(pbVar3 + 4) + 0x11);
              }
              else if (*(int *)(pbVar3 + 8) != 0x16) {
                uVar7 = FUN_1000243d(0,pbVar3,*(int *)(pbVar3 + 4) + 0x11);
                if (uVar7 < *(int *)(pbVar3 + 4) + 0x11U) {
                  FUN_10001015((int *)pbVar3,param_1,(*(int *)(pbVar3 + 4) - uVar7) + 0x11);
                  local_5 = '\x01';
                }
              }
              (*pcVar8)(pbVar3);
            }
            (*pcVar8)(local_20);
          }
          param_2 = param_2 + 1;
          local_14 = local_14 + -1;
        } while (local_14 != 0);
      }
      if (((DAT_10006150 != 0) && (DAT_10006154 != 0)) &&
         (puVar4 = FUN_100025aa(0), puVar4 != (undefined4 *)0x0)) {
        FUN_1000243d(0,puVar4,puVar4[1] + 0x11);
        (*pcVar8)(puVar4);
      }
      DAT_10006154 = 1;
      (*pcVar8)(local_18);
      if (local_5 != '\0') {
        return local_c;
      }
      piVar5 = (int *)FUN_10003838();
      do {
        if ((piVar5 == (int *)0x0) || (4 < local_1c)) goto LAB_100013fb;
        if ((*piVar5 == -1) || (*piVar5 == param_1)) {
          if (*(int *)((int)piVar5 + 9) == 0x17) {
            piVar6 = FUN_10001f65((int)piVar5);
            uVar7 = FUN_1000243d(0,piVar6,piVar6[1] + 0x11);
            if (uVar7 < piVar6[1] + 0x11U) {
              FUN_10001015(piVar6,param_1,(piVar6[1] - uVar7) + 0x11);
LAB_100013fb:
              if (DAT_10006010 == '\0') {
                return local_c;
              }
              uStack_28 = 0;
              local_2c = 0;
              local_c = 1;
              local_30 = 8;
              puVar4 = FUN_10001455(&local_30);
              if (puVar4 == (undefined4 *)0x0) {
                return local_c;
              }
              puVar4[3] = param_1;
              FUN_1000243d(0,puVar4,puVar4[1] + 0x12);
              (*pcVar8)(puVar4);
              return local_c;
            }
            if (piVar6 != (int *)0x0) {
              (*pcVar8)(piVar6);
            }
          }
          else {
            FUN_10001fd0(piVar5);
          }
          (*pcVar8)(piVar5);
          piVar6 = (int *)FUN_10003838();
        }
        else {
          piVar6 = (int *)FUN_10003838();
          FUN_1000386d(piVar5);
        }
        local_1c = local_1c + 1;
        piVar5 = piVar6;
      } while( true );
    }
    FUN_10004249((uint)param_2);
  }
  return 0;
}

