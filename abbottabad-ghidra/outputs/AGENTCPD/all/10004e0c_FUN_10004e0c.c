
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_10004e0c(undefined4 param_1,int param_2)

{
  undefined4 uVar1;
  undefined4 *_Memory;
  undefined4 *puVar2;
  
  if (param_2 == 0) {
    if (0 < DAT_100062e0) {
      DAT_100062e0 = DAT_100062e0 + -1;
      goto LAB_10004e22;
    }
LAB_10004e4a:
    uVar1 = 0;
  }
  else {
LAB_10004e22:
    _DAT_100062f4 = *(undefined4 *)_adjust_fdiv_exref;
    if (param_2 == 1) {
      DAT_100062fc = (undefined4 *)malloc(0x80);
      if (DAT_100062fc == (undefined4 *)0x0) goto LAB_10004e4a;
      *DAT_100062fc = 0;
      DAT_100062f8 = DAT_100062fc;
      _initterm(&DAT_10006000,&DAT_10006004);
      DAT_100062e0 = DAT_100062e0 + 1;
    }
    else if ((param_2 == 0) &&
            (_Memory = DAT_100062fc, puVar2 = DAT_100062f8, DAT_100062fc != (undefined4 *)0x0)) {
      while (puVar2 = puVar2 + -1, _Memory <= puVar2) {
        if ((code *)*puVar2 != (code *)0x0) {
          (*(code *)*puVar2)();
          _Memory = DAT_100062fc;
        }
      }
      free(_Memory);
      DAT_100062fc = (undefined4 *)0x0;
    }
    uVar1 = 1;
  }
  return uVar1;
}

