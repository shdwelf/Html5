
undefined4 FUN_10002507(void)

{
  undefined4 uVar1;
  DWORD local_8;
  
  uVar1 = 0;
  local_8 = 0;
  if (DAT_1000627c == (undefined4 *)0x0) {
    DAT_1000627c = (undefined4 *)malloc(0x65);
    if (DAT_1000627c != (undefined4 *)0x0) {
      memset(DAT_1000627c,0,0x65);
      uVar1 = 1;
      *DAT_1000627c = 1;
      *(undefined *)(DAT_1000627c + 1) = DAT_10006010;
      *(undefined4 *)((int)DAT_1000627c + 0x45) = 0;
      local_8 = 0x20;
      GetComputerNameA((LPSTR)((int)DAT_1000627c + 5),&local_8);
      *(undefined *)((int)DAT_1000627c + 0x25) = 0;
      local_8 = 0x20;
      GetUserNameA((LPSTR)((int)DAT_1000627c + 0x25),&local_8);
      *(undefined *)((int)DAT_1000627c + 0x45) = 0;
    }
  }
  else {
    uVar1 = 1;
  }
  return uVar1;
}

