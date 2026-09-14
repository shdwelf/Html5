
void FUN_10002e7c(void)

{
  void *_Memory;
  
  while( true ) {
    _Memory = (void *)FUN_10003838();
    if (_Memory == (void *)0x0) break;
    free(_Memory);
  }
  FUN_100024d7(0xd,DAT_10006010,0);
  return;
}

