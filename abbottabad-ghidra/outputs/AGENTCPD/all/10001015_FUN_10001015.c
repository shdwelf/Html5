
undefined4 __cdecl FUN_10001015(int *param_1,undefined4 param_2,size_t param_3)

{
  int *_Memory;
  undefined4 *_Memory_00;
  
  if (param_1[2] == 3) {
    _Memory = (int *)malloc(param_3 + 0x11c);
  }
  else {
    _Memory = (int *)malloc(param_3 + 0x12);
  }
  if (_Memory != (int *)0x0) {
    *(undefined *)(_Memory + 4) = DAT_10006010;
    _Memory[2] = param_1[2];
    *_Memory = *param_1;
    if (param_1[2] == 3) {
      memset((size_t *)((int)_Memory + 0x11),0,0x10a);
      *(char *)((int)_Memory + 0x19) = *(char *)((int)param_1 + 0x19) + '\x01';
      *(undefined4 *)((int)_Memory + 0x15) = *(undefined4 *)((int)param_1 + 0x15);
      *(size_t *)((int)_Memory + 0x11) = param_3;
      memcpy((void *)((int)_Memory + 0x1a),(void *)((int)param_1 + 0x1a),
             *(size_t *)((int)_Memory + 0x15));
      memcpy((void *)((int)_Memory + 0x11a),(void *)((param_1[1] - param_3) + 0x11 + (int)param_1),
             param_3);
      _Memory[1] = param_3 + 0x10a;
    }
    else {
      memcpy((void *)((int)_Memory + 0x11),(void *)((param_1[1] - param_3) + 0x11 + (int)param_1),
             param_3);
      _Memory[1] = param_3;
    }
    _Memory_00 = FUN_10001eee(_Memory,0,param_2);
    if (_Memory_00 != (undefined4 *)0x0) {
      FUN_1000386d(_Memory_00);
      free(_Memory_00);
    }
    free(_Memory);
  }
  return 1;
}

