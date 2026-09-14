
void FUN_1000232f(void)

{
  char cVar1;
  int iVar2;
  DWORD DVar3;
  LSTATUS LVar4;
  uint local_14;
  undefined4 *local_10;
  uint local_c;
  undefined2 *local_8;
  
  SetErrorMode(0x8007);
  SetUnhandledExceptionFilter((LPTOP_LEVEL_EXCEPTION_FILTER)&DAT_10002435);
  iVar2 = FUN_10001893(1);
  if (iVar2 == 0) {
    FUN_10001893(2);
  }
  do {
    do {
      while( true ) {
        do {
          DVar3 = WaitForMultipleObjects(2,&DAT_10006258,0,0xffffffff);
        } while (DVar3 == 0x102);
        if (DVar3 != 0) break;
        ResetEvent(DAT_10006258);
        LVar4 = FUN_100036ee(&local_10,&local_14);
        if (LVar4 == 0) {
          FUN_10001fd0(local_10);
        }
      }
    } while (DVar3 != 1);
    local_8 = (undefined2 *)0x0;
    ResetEvent(DAT_1000625c);
    do {
      while (cVar1 = FUN_10003a1d((char *)&local_c), cVar1 == '\x01') {
        DAT_10006260 = (undefined)local_c;
        iVar2 = FUN_100015a2(local_c,&local_8);
        if ((iVar2 != 0) && (iVar2 == *(int *)(local_8 + 2))) {
          FUN_10002174(iVar2);
          FUN_10001114(iVar2,local_8);
          if (DAT_10006254 != 0) {
            FUN_10002254(iVar2,(int)local_8,local_c);
          }
        }
      }
      if (cVar1 == '\x02') {
        FUN_10001886(local_c);
      }
    } while (cVar1 != '\0');
  } while( true );
}

