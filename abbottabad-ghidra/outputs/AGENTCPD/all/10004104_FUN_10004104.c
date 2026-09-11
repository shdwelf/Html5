
int __cdecl
FUN_10004104(undefined param_1,undefined param_2,void *param_3,size_t *param_4,undefined2 *param_5)

{
  size_t sVar1;
  undefined *puVar2;
  uint uVar3;
  int local_8;
  
  local_8 = -1;
  sVar1 = *param_4;
  if ((param_3 == (void *)0x0) || (param_4 == (size_t *)0x0)) {
    local_8 = -1;
  }
  else {
    uVar3 = sVar1 + 0xe;
    puVar2 = (undefined *)malloc(uVar3);
    if (puVar2 != (undefined *)0x0) {
      *puVar2 = param_1;
      puVar2[1] = param_2;
      if (uVar3 < 0x1001) {
        *(undefined2 *)(puVar2 + 2) = 0x1000;
      }
      else {
        *(short *)(puVar2 + 2) = ((short)(uVar3 >> 0xf) + 1) * -0x8000;
      }
      puVar2[0xc] = 2;
      *(size_t *)(puVar2 + 8) = sVar1;
      memcpy(puVar2 + 0xd,param_3,sVar1);
      puVar2[4] = 1;
      puVar2[5] = 1;
      local_8 = FUN_10003eac(puVar2,uVar3,param_5);
      if (local_8 == 0) {
        free(puVar2);
        local_8 = 0;
      }
      else {
        uVar3 = FUN_10003d01();
        if (uVar3 != 0) {
          free(puVar2);
          puVar2 = (undefined *)malloc(uVar3);
          if (puVar2 != (undefined *)0x0) {
            *puVar2 = param_1;
            puVar2[1] = param_2;
            if (uVar3 < 0x1001) {
              *(undefined2 *)(puVar2 + 2) = 0x1000;
            }
            else {
              *(short *)(puVar2 + 2) = (short)uVar3;
            }
            sVar1 = uVar3 - 0xe;
            puVar2[0xc] = 2;
            *(size_t *)(puVar2 + 8) = sVar1;
            memcpy(puVar2 + 0xd,param_3,sVar1);
            puVar2[4] = 1;
            puVar2[5] = 1;
            local_8 = FUN_10003eac(puVar2,uVar3,param_5);
            if (local_8 == 0) {
              *param_4 = sVar1;
            }
            free(puVar2);
          }
        }
      }
    }
  }
  return local_8;
}

