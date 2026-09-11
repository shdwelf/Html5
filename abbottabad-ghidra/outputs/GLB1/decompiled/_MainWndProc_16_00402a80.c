
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

UINT _MainWndProc_16(HWND param_1,short *param_2,HWND param_3,uint param_4)

{
  LONG *pLVar1;
  LONG *pLVar2;
  WORD WVar3;
  HDC pHVar4;
  uint uVar5;
  int iVar6;
  HFONT h;
  char *pcVar7;
  LPCSTR lpString;
  COLORREF color;
  HBRUSH h_00;
  HGDIOBJ h_01;
  UINT UVar8;
  HPALETTE hPal;
  int *piVar9;
  int nDenominator;
  int cWidth;
  int cEscapement;
  int cOrientation;
  int cWeight;
  DWORD bItalic;
  DWORD bUnderline;
  DWORD bStrikeOut;
  DWORD iOutPrecision;
  DWORD iClipPrecision;
  DWORD iQuality;
  DWORD iPitchAndFamily;
  tagPAINTSTRUCT local_6c;
  tagRECT local_2c;
  int local_1c;
  undefined local_18;
  undefined local_14;
  uint local_10;
  HGDIOBJ local_c;
  HPALETTE local_8;
  
                    /* 0x2a80  1  _MainWndProc@16 */
  if (param_2 < (short *)0x114) {
    if (param_2 == (short *)0x113) {
      if (param_1 == DAT_00405324) {
        _DAT_0040535c = 0;
        return 0;
      }
      if (param_3 == (HWND)0x2069) {
        _DAT_00405354 = 0;
        return 0;
      }
      (*DAT_004053e8)(0);
      return 0;
    }
    if (param_2 == (short *)0x2) {
      PostQuitMessage(0);
      return 0;
    }
    if (param_2 == (short *)0x5) {
      InvalidateRect(param_1,(RECT *)0x0,1);
      return 0;
    }
    if (param_2 == (short *)0xf) {
      pHVar4 = BeginPaint(param_1,&local_6c);
      if (DAT_0040536c != (HPALETTE)0x0) {
        local_8 = SelectPalette(pHVar4,DAT_0040536c,0);
        RealizePalette(pHVar4);
      }
      if (param_1 == DAT_00405324) {
        if (DAT_004053cc != (BITMAPINFO *)0x0) {
          uVar5 = (uint)DAT_004053fc;
          iPitchAndFamily = 0;
          iQuality = 0;
          iClipPrecision = 0;
          iOutPrecision = 0;
          bStrikeOut = 0;
          bUnderline = 0;
          bItalic = 0;
          cWeight = 700;
          cOrientation = 0;
          cEscapement = 0;
          cWidth = 0;
          nDenominator = 0x48;
          pcVar7 = DAT_004053f8;
          iVar6 = GetDeviceCaps(pHVar4,0x5a);
          iVar6 = MulDiv((uint)DAT_004053fd,iVar6,nDenominator);
          h = CreateFontA(-iVar6,cWidth,cEscapement,cOrientation,cWeight,bItalic,bUnderline,
                          bStrikeOut,uVar5,iOutPrecision,iClipPrecision,iQuality,iPitchAndFamily,
                          pcVar7);
          for (pcVar7 = DAT_004053f8; *pcVar7 != '\0'; pcVar7 = pcVar7 + 1) {
          }
          lpString = pcVar7 + 1;
          if ((DAT_004053cc->bmiHeader).biSize < 0x24) {
            uVar5 = 0;
          }
          else {
            uVar5 = (uint)*(ushort *)&(DAT_004053cc->bmiHeader).biClrUsed;
          }
          if ((short)uVar5 == 0) {
            WVar3 = (DAT_004053cc->bmiHeader).biBitCount;
            if (WVar3 == 0x18) {
              uVar5 = 0;
            }
            else {
              uVar5 = 1 << ((byte)WVar3 & 0x1f);
            }
          }
          pLVar1 = &(DAT_004053cc->bmiHeader).biHeight;
          pLVar2 = &(DAT_004053cc->bmiHeader).biWidth;
          iVar6 = *pLVar2;
          StretchDIBits(pHVar4,0,0,iVar6,*pLVar1,0,0,iVar6,*pLVar1,
                        &DAT_004053cc->bmiColors[(uVar5 & 0xffff) - 10].rgbBlue +
                        (DAT_004053cc->bmiHeader).biSize,DAT_004053cc,0,0xcc0020);
          local_c = SelectObject(pHVar4,h);
          SetBkMode(pHVar4,1);
          SetTextColor(pHVar4,0xffffff);
          if ((DAT_00405360._3_1_ & 0x80) == 0) {
            iVar6 = lstrlenA(lpString);
            TextOutA(pHVar4,8,6,lpString,iVar6);
          }
          for (; *lpString != '\0'; lpString = lpString + 1) {
          }
          local_2c.top = *pLVar1 / 2;
          local_2c.bottom = *pLVar1;
          local_2c.left = 8;
          local_2c.right = *pLVar2 + -8;
          if ((DAT_00405360._3_1_ & 0x80) == 0) {
            DrawTextA(pHVar4,lpString + 1,-1,&local_2c,0x11);
          }
          SelectObject(pHVar4,local_c);
          DeleteObject(h);
        }
        if (DAT_0040536c != (HPALETTE)0x0) {
          SelectPalette(pHVar4,local_8,1);
        }
      }
      else {
        FUN_00402a58();
        if ((DAT_00405364 & 3) == 0) {
          local_2c.bottom = -1;
          param_4 = 0;
          do {
            local_10 = param_4 + 1;
            param_2 = &DAT_00405410;
            piVar9 = &local_1c;
            local_c = (HGDIOBJ)0x3;
            do {
              iVar6 = (int)((int)param_2[3] * param_4) / 0x5f + (int)*param_2;
              *piVar9 = iVar6;
              if (iVar6 < 0) {
                *piVar9 = 0;
              }
              if (0xff < *piVar9) {
                *piVar9 = 0xff;
              }
              param_2 = param_2 + 1;
              piVar9 = piVar9 + 1;
              local_c = (HGDIOBJ)((int)local_c + -1);
            } while (local_c != (HGDIOBJ)0x0);
            if (DAT_0040536c == (HPALETTE)0x0) {
              color = (COLORREF)CONCAT21(CONCAT11(local_14,local_18),(undefined)local_1c);
            }
            else {
              color = param_4 & 0xffff | 0x1000000;
            }
            local_2c.top = local_2c.bottom;
            local_2c.bottom = (int)((param_4 + 1) * DAT_00405350) / 0x60;
            h_00 = CreateSolidBrush(color);
            h_01 = SelectObject(pHVar4,h_00);
            PatBlt(pHVar4,0,local_2c.top,DAT_0040534c,local_2c.bottom - local_2c.top,0xf00021);
            SelectObject(pHVar4,h_01);
            DeleteObject(h_00);
            param_4 = local_10;
          } while ((int)local_10 < 0x60);
        }
        if (DAT_0040536c != (HPALETTE)0x0) {
          SelectPalette(pHVar4,local_8,1);
        }
        if (DAT_004053e4 != (code *)0x0) {
          (*DAT_004053e4)(param_1,pHVar4);
        }
      }
      EndPaint(param_1,&local_6c);
      return 0;
    }
    if (param_2 == (short *)0x14) {
      return 1;
    }
    if (param_2 == (short *)0x112) {
      if (param_3 == (HWND)0xf060) {
        DAT_00405344 = 1;
        return 0;
      }
      param_2 = (short *)0x112;
    }
LAB_00402eac:
    UVar8 = DefWindowProcA(param_1,(UINT)param_2,(WPARAM)param_3,param_4);
    return UVar8;
  }
  if (param_2 != (short *)0x30f) {
    if (param_2 != (short *)0x311) {
      if ((short *)0x400 < param_2) {
        if (param_2 < (short *)0x403) {
          if (DAT_00405400 == (code *)0x0) {
            return 0;
          }
          (*DAT_00405400)(param_2,param_3,param_4);
          return 0;
        }
        if (param_2 == (short *)0x4c8) {
          if (param_4 != 0x20d) {
            return 0;
          }
          if ((DAT_00405364 & 4) == 0) {
            UVar8 = 0x10;
          }
          else {
            UVar8 = 0x806;
          }
          SendMessageA(param_3,UVar8,0,0);
          return 0;
        }
      }
      goto LAB_00402eac;
    }
    if (param_3 == param_1) {
      return 0;
    }
  }
  hPal = DAT_00405368;
  if ((DAT_00405368 == (HPALETTE)0x0) && (hPal = DAT_0040536c, DAT_0040536c == (HPALETTE)0x0)) {
    return 0;
  }
  pHVar4 = GetDC(param_1);
  local_8 = SelectPalette(pHVar4,hPal,0);
  UVar8 = RealizePalette(pHVar4);
  if (UVar8 != 0) {
    InvalidateRect(param_1,(RECT *)0x0,1);
  }
  SelectPalette(pHVar4,local_8,1);
  RealizePalette(pHVar4);
  ReleaseDC(param_1,pHVar4);
  return UVar8;
}

