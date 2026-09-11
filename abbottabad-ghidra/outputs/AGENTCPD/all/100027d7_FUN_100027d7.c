
undefined4 __cdecl FUN_100027d7(int param_1)

{
  char *lpBuffer;
  FILE *_File;
  size_t _Size;
  void *_DstBuf;
  size_t sVar1;
  FILE *_File_00;
  undefined4 uVar2;
  int iVar3;
  size_t *psVar4;
  undefined4 *puVar5;
  undefined4 local_118;
  uint uStack_114;
  char cStack_104;
  undefined4 uStack_103;
  undefined uStack_fe;
  
  local_118 = 0;
  if ((param_1 == 0) || (lpBuffer = (char *)malloc(0x104), lpBuffer == (char *)0x0)) {
    uVar2 = 0;
  }
  else {
    cStack_104 = '\0';
    puVar5 = &uStack_103;
    for (iVar3 = 0x40; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar5 = 0;
      puVar5 = puVar5 + 1;
    }
    uStack_114 = 0;
    psVar4 = (size_t *)(param_1 + 0xc);
    *(undefined2 *)puVar5 = 0;
    *(undefined *)((int)puVar5 + 2) = 0;
    if (*(int *)(param_1 + 8) != 0) {
      do {
        memset(lpBuffer,0,0x104);
        GetEnvironmentVariableA(s_SYSTEMROOT_100060d0,lpBuffer,0x104);
        strcat(lpBuffer,s__System32_100060c4);
        strcat(lpBuffer,&DAT_10006160);
        strncat(lpBuffer,(char *)(psVar4 + 1),*psVar4);
        _File = fopen(lpBuffer,&DAT_1000615c);
        if (_File == (FILE *)0x0) {
          local_118 = 0;
          uStack_114 = *(uint *)(param_1 + 8);
        }
        else {
          fseek(_File,0,2);
          _Size = ftell(_File);
          fseek(_File,0,0);
          if ((_Size != 0) && (_DstBuf = malloc(_Size), _DstBuf != (void *)0x0)) {
            sVar1 = fread(_DstBuf,1,_Size,_File);
            if (sVar1 == 0) {
              local_118 = 0;
            }
            else {
              memset(&cStack_104,0,0x104);
              strncpy(&cStack_104,&DAT_10006014,6);
              uStack_fe = 0x5c;
              strncat(&cStack_104,(char *)(psVar4 + 1),*psVar4);
              _File_00 = fopen(&cStack_104,&DAT_10006158);
              if (_File_00 != (FILE *)0x0) {
                fwrite(_DstBuf,1,_Size,_File_00);
                fclose(_File_00);
                SetFileAttributesA(&cStack_104,6);
                local_118 = 1;
              }
            }
            free(_DstBuf);
          }
          fclose(_File);
          psVar4 = (size_t *)((int)psVar4 + *psVar4 + 4);
          memset(lpBuffer,0,*(size_t *)(param_1 + 4));
        }
        uStack_114 = uStack_114 + 1;
      } while (uStack_114 < *(uint *)(param_1 + 8));
    }
    free(lpBuffer);
    uVar2 = FUN_100024d7(1,DAT_10006010,local_118);
  }
  return uVar2;
}

