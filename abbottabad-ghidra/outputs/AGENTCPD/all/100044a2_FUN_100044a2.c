
undefined4 __cdecl
FUN_100044a2(undefined4 param_1,LPCSTR param_2,byte param_3,void *param_4,size_t param_5,
            uint *param_6)

{
  void *pvVar1;
  undefined4 uVar2;
  FILE *_File;
  int iVar3;
  undefined4 *puVar4;
  char local_128;
  undefined4 local_127;
  undefined local_122;
  undefined local_24 [16];
  char local_14 [4];
  char acStack_10 [4];
  char cStack_c;
  undefined4 local_8;
  
  local_8 = 0xffffffff;
  uVar2 = 0xffffffff;
  if ((param_2 != (LPCSTR)0x0) && (param_6 != (uint *)0x0)) {
    memset(&DAT_100062c0,0,0x20);
    strncpy(&DAT_100062c0,param_2,(uint)param_3);
    pvVar1 = FUN_1000469e(param_2);
    *param_6 = (uint)pvVar1;
    if (pvVar1 == (void *)0x0) {
      pvVar1 = malloc(0x20);
      *param_6 = (uint)pvVar1;
      if (pvVar1 == (void *)0x0) {
        local_8 = 1;
      }
      else {
        local_128 = '\0';
        puVar4 = &local_127;
        for (iVar3 = 0x40; iVar3 != 0; iVar3 = iVar3 + -1) {
          *puVar4 = 0;
          puVar4 = puVar4 + 1;
        }
        *(undefined2 *)puVar4 = 0;
        *(undefined *)((int)puVar4 + 2) = 0;
        local_14[0] = s_FILENAME_1000601c[0];
        local_14[1] = s_FILENAME_1000601c[1];
        local_14[2] = s_FILENAME_1000601c[2];
        local_14[3] = s_FILENAME_1000601c[3];
        acStack_10[0] = s_FILENAME_1000601c[4];
        acStack_10[1] = s_FILENAME_1000601c[5];
        acStack_10[2] = s_FILENAME_1000601c[6];
        acStack_10[3] = s_FILENAME_1000601c[7];
        cStack_c = s_FILENAME_1000601c[8];
        memset(pvVar1,0,0x20);
        strncpy(&local_128,param_2,6);
        local_122 = 0x5c;
        strcat(&local_128,local_14);
        _File = fopen(&local_128,&DAT_10006248);
        if (_File != (FILE *)0x0) {
          iVar3 = fseek(_File,1000000,1);
          if (iVar3 == 0) {
            fwrite(local_24,1,0x10,_File);
          }
          fclose(_File);
          if (param_4 == (void *)0x0) {
            return 0xffffffff;
          }
          iVar3 = FUN_10004786(param_2,(undefined4 *)*param_6,param_4,param_5);
          if (iVar3 == 0) {
            local_8 = 3;
          }
          else {
            iVar3 = FUN_10004249(*param_6);
            if (iVar3 == 0) {
              return 0;
            }
            local_8 = 2;
          }
        }
      }
      free((void *)*param_6);
      *param_6 = 0;
      uVar2 = local_8;
    }
    else {
      local_8 = 0;
      uVar2 = local_8;
    }
  }
  return uVar2;
}

