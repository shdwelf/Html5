
int4 0x100016bb(int4 param_1)

{
  code *pcVar1;
  code *pcVar2;
  int4 iVar3;
  int4 iVar4;
  xunknown1 axStack_558 [260];
  xunknown1 axStack_454 [44];
  xunknown1 axStack_428 [276];
  xunknown1 axStack_314 [260];
  xunknown1 axStack_210 [260];
  xunknown1 axStack_10c [260];
  int4 iStack_8;
  
  iStack_8 = 0;
  func_0x10004db6(axStack_314,0,0x104);
  pcVar2 = pcRam10005120;
  (*pcRam10005120)(axStack_314,param_1 + 4,0x104);
  func_0x10004dbc(axStack_314,0x10006030);
  iVar3 = (*pcRam1000505c)(0x104,axStack_10c);
  if (iVar3 != 0) {
    (*pcVar2)(axStack_210,axStack_314,0x104);
    (*pcVar2)(axStack_558,axStack_314,0x104);
    func_0x10004dbc(axStack_314,0x10006028);
    func_0x10004db6(axStack_454,0,0x140);
    iVar3 = (*pcRam10005060)(axStack_314,axStack_454);
    if (iVar3 != -1) {
      iStack_8 = 1;
      func_0x10004dbc(axStack_210,axStack_428);
      func_0x10004dbc(axStack_10c,axStack_428);
      (*pcRam10005064)(axStack_210,axStack_10c,0);
      pcVar1 = pcRam10005068;
      while( true ) {
        iVar4 = (*pcVar1)(iVar3,axStack_454);
        if (iVar4 == 0) break;
        iStack_8 = iStack_8 + 1;
        func_0x10004db6(axStack_210,0,0x104);
        (*pcVar2)(axStack_210,axStack_558,0x104);
        func_0x10004dbc(axStack_210,axStack_428);
        func_0x10004db6(axStack_10c,0,0x104);
        (*pcRam1000505c)(0x104,axStack_10c);
        func_0x10004dbc(axStack_10c,axStack_428);
        (*pcRam1000506c)(axStack_210,axStack_10c);
      }
      (*pcRam10005070)(iVar3);
    }
  }
  return iStack_8;
}
