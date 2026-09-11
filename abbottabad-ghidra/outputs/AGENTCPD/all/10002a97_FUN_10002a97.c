
undefined4 * __cdecl FUN_10002a97(undefined4 *param_1)

{
  FILE *_File;
  undefined4 *_Dst;
  undefined4 *_Size;
  char local_108 [256];
  void *local_8;
  
  if ((param_1 == (undefined4 *)0x0) || (0xff < (uint)param_1[4])) {
    _Dst = (undefined4 *)0x0;
  }
  else {
    memset(local_108,0,0x100);
    memcpy(local_108,param_1 + 5,param_1[4]);
    local_108[param_1[4]] = '\0';
    _File = fopen(local_108,&DAT_1000615c);
    _Dst = param_1;
    if (_File != (FILE *)0x0) {
      fseek(_File,0,2);
      _Dst = (undefined4 *)ftell(_File);
      fseek(_File,0,0);
      if ((_Dst != (undefined4 *)0x0) && (local_8 = malloc((size_t)_Dst), local_8 != (void *)0x0)) {
        _Size = (undefined4 *)fread(local_8,1,(size_t)_Dst,_File);
        if ((_Size == _Dst) &&
           (_Dst = (undefined4 *)malloc((int)_Size + 0x11a), _Dst != (undefined4 *)0x0)) {
          memset(_Dst,0,(int)_Size + 0x11a);
          *(undefined *)((int)_Dst + 0x19) = 0;
          *_Dst = 0x17;
          _Dst[2] = 3;
          _Dst[1] = (int)_Size + 0x109;
          *(undefined *)(_Dst + 4) = DAT_10006010;
          *(undefined4 **)((int)_Dst + 0x11) = _Size;
          *(undefined4 *)((int)_Dst + 0x15) = param_1[4];
          memcpy((void *)((int)_Dst + 0x1a),local_108,param_1[4]);
          memcpy((void *)((int)_Dst + 0x11a),local_8,(size_t)_Size);
        }
        free(local_8);
      }
    }
  }
  return _Dst;
}

