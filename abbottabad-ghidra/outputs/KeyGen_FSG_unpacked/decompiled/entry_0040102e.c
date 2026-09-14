
longlong __fastcall entry(undefined4 param_1,uint param_2,HWND param_3,int param_4,HDC param_5)

{
  BOOL BVar1;
  HBRUSH pHVar2;
  undefined4 extraout_EDX;
  undefined4 extraout_EDX_00;
  undefined4 extraout_EDX_01;
  longlong lVar3;
  tagPAINTSTRUCT local_50;
  HDC local_10;
  HGDIOBJ local_c;
  HDC local_8;
  
  if (param_4 == 0x110) {
    DAT_00403270 = FUN_00401550(PTR_DAT_00403274,(LPCSTR)0x1);
    DAT_00403278 = CreateFontA(0xe,0,0,0,900,0,0,0,1,0,0,0,0,&DAT_0040327c);
    SendDlgItemMessageA(param_3,0x3e9,0x30,(WPARAM)DAT_00403278,1);
    SendDlgItemMessageA(param_3,0x3ea,0x30,(WPARAM)DAT_00403278,1);
    CreateThread((LPSECURITY_ATTRIBUTES)0x0,0,FUN_004011fb,param_3,0,(LPDWORD)&stack0xffffff8c);
    FUN_00401299(param_3);
  }
  else {
    if (param_4 == 0xf) {
      local_8 = BeginPaint(param_3,&local_50);
      local_10 = CreateCompatibleDC(local_8);
      local_c = SelectObject(local_10,DAT_00403270);
      BitBlt(local_8,0,0,0x15e,0xfb,local_10,0,0,0xcc0020);
      SelectObject(local_8,local_c);
      DeleteDC(local_10);
      BVar1 = EndPaint(param_3,&local_50);
      return CONCAT44(extraout_EDX,BVar1);
    }
    if (param_4 == 0x201) {
      lVar3 = FUN_00401250(param_3);
      return lVar3;
    }
    if ((param_4 == 0x205) || (param_4 == 0x10)) {
      BVar1 = EndDialog(param_3,0);
      return CONCAT44(extraout_EDX_00,BVar1);
    }
    if ((((param_4 == 0x136) || (param_4 == 0x135)) || (param_4 == 0x133)) || (param_4 == 0x138)) {
      SetTextColor(param_5,0xeaeaeb);
      SetBkColor(param_5,0);
      SetBkMode(param_5,2);
      pHVar2 = CreateSolidBrush(0xffffffff);
      return CONCAT44(extraout_EDX_01,pHVar2);
    }
    if (param_4 != 0x111) {
      if (param_4 != 0x10) {
        return (ulonglong)param_2 << 0x20;
      }
      EndDialog(param_3,0);
    }
  }
  return CONCAT44(param_2,1);
}

