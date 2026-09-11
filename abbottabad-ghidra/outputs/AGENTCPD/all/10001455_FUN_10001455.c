
undefined4 * __cdecl FUN_10001455(undefined4 *param_1)

{
  undefined4 *_Dst;
  
  switch(*param_1) {
  case 1:
    _Dst = (undefined4 *)FUN_100027d7((int)param_1);
    break;
  case 2:
    DAT_10006254 = FUN_100029fd((int)param_1);
    _Dst = (undefined4 *)0x0;
    break;
  case 3:
    _Dst = FUN_10002a97(param_1);
    break;
  case 4:
    _Dst = (undefined4 *)FUN_10002c01();
    break;
  case 5:
    _Dst = (undefined4 *)FUN_10002e56();
    break;
  case 6:
    _Dst = (undefined4 *)FUN_10002e69();
    break;
  case 7:
    _Dst = (undefined4 *)FUN_10002bee();
    break;
  case 8:
    _Dst = (undefined4 *)FUN_10002c14();
    break;
  case 0xb:
    FUN_10001893(2);
  default:
    _Dst = param_1;
    break;
  case 0xc:
    _Dst = (undefined4 *)FUN_10002ea2();
    break;
  case 0xd:
    _Dst = (undefined4 *)FUN_10002e7c();
    break;
  case 0xe:
    _Dst = FUN_10002eb5((int)param_1);
    break;
  case 0xf:
    _Dst = (undefined4 *)FUN_1000316f((uint)param_1);
    break;
  case 0x10:
    _Dst = (undefined4 *)FUN_100033c4();
    break;
  case 0x11:
    _Dst = FUN_10003410();
    break;
  case 0x12:
    _Dst = FUN_1000347c();
    break;
  case 0x13:
    _Dst = (undefined4 *)FUN_10003575((int)param_1);
    break;
  case 0x16:
    _Dst = FUN_100025aa((int)param_1);
    break;
  case 0x17:
    _Dst = (undefined4 *)malloc(param_1[1] + 0x12);
    if (_Dst != (undefined4 *)0x0) {
      memcpy(_Dst,param_1,param_1[1] + 0x12);
    }
  }
  return _Dst;
}

