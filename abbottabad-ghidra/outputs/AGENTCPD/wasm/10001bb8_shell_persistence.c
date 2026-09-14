
int4 0x10001bb8(int4 param_1)

{
  code *pcVar1;
  char *pcVar2;
  uint4 uVar3;
  xunknown1 *pxVar4;
  int4 iVar5;
  int4 iVar6;
  xunknown4 *pxVar7;
  xunknown4 *pxVar8;
  xunknown1 xStack_568;
  xunknown4 xStack_567;
  xunknown1 axStack_4a0 [568];
  xunknown1 xStack_268;
  xunknown4 xStack_267;
  xunknown4 axStack_168 [14];
  xunknown1 xStack_130;
  xunknown4 xStack_12f;
  xunknown4 xStack_10;
  xunknown4 xStack_c;
  xunknown4 xStack_8;
  
  xStack_568 = 0;
  xStack_130 = 0;
  pxVar7 = &xStack_567;
  for (iVar6 = 0xbf; iVar6 != 0; iVar6 = iVar6 + -1) {
    *pxVar7 = 0;
    pxVar7 = pxVar7 + 1;
  }
  xStack_268 = 0;
  *(xunknown2 *)pxVar7 = 0;
  iVar5 = 1;
  *(xunknown1 *)((int4)pxVar7 + 2) = 0;
  pxVar7 = &xStack_12f;
  for (iVar6 = 0x47; iVar6 != 0; iVar6 = iVar6 + -1) {
    *pxVar7 = 0;
    pxVar7 = pxVar7 + 1;
  }
  *(xunknown2 *)pxVar7 = 0;
  *(xunknown1 *)((int4)pxVar7 + 2) = 0;
  pxVar7 = &xStack_267;
  for (iVar6 = 0x3f; iVar6 != 0; iVar6 = iVar6 + -1) {
    *pxVar7 = 0;
    pxVar7 = pxVar7 + 1;
  }
  *(xunknown2 *)pxVar7 = 0;
  *(xunknown1 *)((int4)pxVar7 + 2) = 0;
  xStack_c = 1;
  pxVar7 = (xunknown4 *)0x100060e4;
  pxVar8 = axStack_168;
  for (iVar6 = 0xd; iVar6 != 0; iVar6 = iVar6 + -1) {
    *pxVar8 = *pxVar7;
    pxVar7 = pxVar7 + 1;
    pxVar8 = pxVar8 + 1;
  }
  xStack_10 = 0x300;
  *(xunknown2 *)pxVar8 = *(xunknown2 *)pxVar7;
  pcVar2 = (char *)(*pcRam10005038)();
  if ((pcVar2 != (char *)0x0) && (uVar3 = func_0x10004e06(pcVar2), uVar3 < 0xff)) {
    if (*pcVar2 == '\"') {
      pcVar2 = pcVar2 + 1;
      uVar3 = uVar3 - 1;
    }
    func_0x10004db0(&xStack_268,pcVar2,uVar3);
    pcVar1 = pcRam1000510c;
    pxVar4 = (xunknown1 *)(*pcRam1000510c)(&xStack_268,0x22);
    if (pxVar4 != (xunknown1 *)0x0) {
      *pxVar4 = 0;
    }
    iVar6 = (*pcVar1)(&xStack_268,0x5c);
    if (iVar6 == 0) {
      pxVar4 = &xStack_268;
    }
    else {
      pxVar4 = (xunknown1 *)(iVar6 + 1);
    }
    if ((param_1 == -0x7ffffffe) || (param_1 != -0x7fffffff)) {
      (*pcRam10005034)(0x100060d0,&xStack_130,0x120);
      func_0x10004dbc(&xStack_130,0x100060c4);
    }
    else {
      (*pcRam10005034)(0x100060dc,&xStack_130,0x120);
    }
    func_0x10004dbc(&xStack_130,0x100060c0);
    func_0x10004dbc(&xStack_130,0x100060bc);
    func_0x10004dbc(&xStack_130,0x100060b8);
    func_0x10004dbc(&xStack_130,0x100060b0);
    iVar6 = (*pcRam10005138)(pxVar4,0x100060a8);
    if (iVar6 == 0) {
      func_0x10004dbc(&xStack_268,0x100060a8);
    }
    iVar6 = (*pcRam1000506c)(&xStack_268,&xStack_130);
    if (iVar6 != 0) {
      iVar6 = func_0x10004e06(&xStack_130);
      iVar5 = (*pcRam10005004)(param_1,axStack_168,0,0xf003f,&xStack_8);
      if (iVar5 == 0) {
        iVar5 = (*pcRam10005008)(xStack_8,0x100060a0,0,&xStack_c,&xStack_568,&xStack_10);
        if (iVar5 != 0) {
          func_0x10004e00(&xStack_568,0x10006090);
          xStack_c = 1;
        }
        uVar3 = func_0x10004e06(&xStack_568);
        if (uVar3 < 0xf) {
          iVar5 = func_0x10004e06(&xStack_568);
          func_0x10004db6(&xStack_568 + iVar5,0x20,&xStack_268 + -(int4)(&xStack_568 + iVar5));
          func_0x10004db0(axStack_4a0 + iVar5,&xStack_130,iVar6);
          axStack_4a0[iVar6 + iVar5] = 0;
          xStack_10 = func_0x10004e06(&xStack_568);
          iVar5 = (*pcRam10005010)(xStack_8,0x100060a0,0,xStack_c,&xStack_568,xStack_10);
          if (iVar5 == 0) {
            iVar5 = param_1;
          }
          (*pcRam1000500c)(xStack_8);
        }
        else {
          iVar5 = 1;
        }
      }
    }
  }
  return iVar5;
}
