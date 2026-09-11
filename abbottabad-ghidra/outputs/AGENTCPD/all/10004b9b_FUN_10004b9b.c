
size_t __cdecl FUN_10004b9b(byte *param_1,size_t param_2)

{
  size_t sVar1;
  DWORD _Value;
  FILE *_File;
  int iVar2;
  undefined4 *puVar3;
  CHAR *_Dest;
  CHAR local_204;
  undefined4 local_203;
  
  local_204 = '\0';
  puVar3 = &local_203;
  for (iVar2 = 0x7f; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar3 = 0;
    puVar3 = puVar3 + 1;
  }
  *(undefined2 *)puVar3 = 0;
  *(undefined *)((int)puVar3 + 2) = 0;
  GetTempPathA(0x200,&local_204);
  strcat(&local_204,&DAT_100061d0);
  iVar2 = 10;
  sVar1 = strlen(&local_204);
  _Dest = &local_204 + sVar1;
  _Value = GetTickCount();
  _itoa(_Value,_Dest,iVar2);
  _File = fopen(&local_204,&DAT_10006158);
  if (_File == (FILE *)0x0) {
    sVar1 = 0;
  }
  else {
    FUN_10004cff(param_1,param_2);
    sVar1 = fwrite(param_1,1,param_2,_File);
    fflush(_File);
    fclose(_File);
  }
  return sVar1;
}

