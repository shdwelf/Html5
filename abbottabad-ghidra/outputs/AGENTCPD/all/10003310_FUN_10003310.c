
undefined4 __cdecl FUN_10003310(char *param_1,void *param_2,uint *param_3)

{
  FILE *_File;
  int iVar1;
  uint _Count;
  size_t sVar2;
  undefined4 local_8;
  
  local_8 = 0;
  _File = fopen(param_1,&DAT_1000615c);
  if (_File == (FILE *)0x0) {
    return 0;
  }
  iVar1 = fseek(_File,0,2);
  if (iVar1 == 0) {
    _Count = ftell(_File);
    iVar1 = fseek(_File,0,0);
    if (iVar1 == 0) {
      fprintf((FILE *)(_iob_exref + 0x20),s_file_size____d_bytes_100061d8,_Count);
      if (_Count <= *param_3) {
        sVar2 = fread(param_2,1,_Count,_File);
        if (sVar2 != _Count) goto LAB_100033b4;
        local_8 = 1;
      }
      *param_3 = _Count;
    }
    else {
      fprintf((FILE *)(_iob_exref + 0x20),s_fseek_SEEK_SET__failed_100061f0);
    }
  }
LAB_100033b4:
  fclose(_File);
  return local_8;
}

