
bool 0x10001893(xunknown4 param_1)

{
  code *pcVar1;
  int4 iVar2;
  int4 iVar3;
  xunknown4 *pxVar4;
  bool bVar5;
  xunknown1 xStack_418;
  xunknown4 xStack_417;
  xunknown1 xStack_218;
  xunknown4 xStack_217;
  xunknown1 axStack_18 [4];
  xunknown1 axStack_14 [4];
  xunknown1 axStack_10 [4];
  xunknown4 xStack_c;
  uint4 uStack_8;
  
  if ((char)param_1 == '\x01') {
    iVar2 = (*pcRam1000502c)(0,1,0x1000605c);
    if (iVar2 != 0) {
      iVar2 = (*pcRam10005028)();
      if (iVar2 == 0xb7) {
        (*pcRam1000511c)(0);
      }
      iRam1000626c = (*pcRam10005128)(0x20000);
      if (iRam1000626c != 0) {
        func_0x10004db6(iRam1000626c,0,0x20000);
        xRam10006270 = 0x20000;
      }
      func_0x10001a85();
      iVar2 = func_0x10003618(xRam10006250);
      if (iVar2 == 0) {
        (*pcRam1000511c)(0);
      }
      iRam10006258 = iVar2;
      iVar3 = func_0x100038e3(0);
      if (iVar3 == 0) {
        (*pcRam10005024)(iVar2);
        (*pcRam10005134)(iRam1000626c);
        iVar3 = (*pcRam1000511c)(0);
      }
      iRam1000625c = iVar3;
      func_0x100024b9();
      xStack_418 = 0;
      pxVar4 = &xStack_417;
      for (iVar2 = 0x7f; iVar2 != 0; iVar2 = iVar2 + -1) {
        *pxVar4 = 0;
        pxVar4 = pxVar4 + 1;
      }
      *(xunknown2 *)pxVar4 = 0;
      *(xunknown1 *)((int4)pxVar4 + 2) = 0;
      xStack_218 = 0;
      pxVar4 = &xStack_217;
      for (iVar2 = 0x7f; iVar2 != 0; iVar2 = iVar2 + -1) {
        *pxVar4 = 0;
        pxVar4 = pxVar4 + 1;
      }
      *(xunknown2 *)pxVar4 = 0;
      *(xunknown1 *)((int4)pxVar4 + 2) = 0;
      param_1._1_3_ = (unkbyte3)((uint4)xRam10006058 >> 8);
      param_1 = CONCAT31(param_1._1_3_,100);
      uStack_8 = 0;
      do {
        iVar2 = (*pcRam1000503c)(&param_1,&xStack_418,0x200,axStack_14,axStack_10,axStack_18,
                                 &xStack_218,0x200);
        if (iVar2 != 0) {
          cRam10006018 = (char)uStack_8 + 'd';
          iVar2 = func_0x100042d5(0x10006014,7);
          if (iVar2 != 0) {
            xStack_c = 0;
            cRam10006260 = cRam10006018;
            iVar3 = func_0x100015a2(cRam10006018,&xStack_c);
            if (iVar3 != 0) {
              func_0x10001114(cRam10006018,xStack_c);
              func_0x10002174(iVar2);
            }
          }
        }
        param_1 = CONCAT31(param_1._1_3_,(char)param_1 + '\x01');
        uStack_8 = uStack_8 + 1;
      } while (uStack_8 < 0x17);
      return true;
    }
    (*pcRam1000511c)(0);
  }
  pcVar1 = pcRam10005024;
  bVar5 = (char)param_1 == '\x02';
  if (bVar5) {
    (*pcRam10005024)(0);
    (*pcVar1)(xRam10006250);
    func_0x100036d4();
    func_0x100038ec();
    func_0x100024b9();
    (*pcRam10005134)(iRam1000626c);
    (*pcRam10005018)(0x80000002,0x1000603c);
    (*pcRam10005058)(0);
  }
  return bVar5;
}
