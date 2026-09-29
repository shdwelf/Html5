# /tmp/games/qfg1demo/sierra/democd/SCIDHUV.EXE
# MZ: pages=246 lastPage=448 relo=1924 hdrParas=512 (image @file 0x2000)
#     minalloc=222 maxalloc=65535 ss:sp=0x1d92:0x80
#     entry cs:ip=0x26:0x7d -> linear 0x102dd (image +0x2dd)
#     load image ≈ 0x1cbc0 bytes, file image 136644 bytes, base=0x10000 lang=x86:LE:16:Real Mode

/* ==== 0x102dd  (x86:LE:16:Real Mode, default, 305 ms) ==== */
/* WARNING: Possible PIC construction at 0x0001031b: Changing call to branch */
/* WARNING: Removing unreachable block (ram,0x0001031e) */
/* WARNING: Restarted to delay deadcode elimination for space: ram */

void 0x102dd(void)

{
  xunknown1 *pxVar1;
  xunknown1 *pxVar2;
  code *pcVar3;
  int2 iVar4;
  xunknown2 xVar5;
  char *pcVar6;
  int2 iVar7;
  xunknown1 *pxVar8;
  char *pcVar9;
  xunknown1 *pxVar10;
  int2 unaff_ES;
  bool bVar11;
  
  bVar11 = 0xefff < 0x1a66U - unaff_ES;
  pcVar3 = (code *)swi(0x21);
  iRam0001a668 = unaff_ES;
  (*pcVar3)();
  if (bVar11) {
    (*pcRam0001acf2)();
  }
  pxVar8 = (xunknown1 *)0xe000;
  xRam0001a66c = 0xe000;
  for (iVar7 = 0x2000; iVar4 = iRam0001a668, iVar7 != 0; iVar7 = iVar7 + -1) {
    pxVar1 = pxVar8;
    pxVar8 = pxVar8 + 1;
    *pxVar1 = 0x73;
  }
  xRam0002a65c = 0x31e;
  xRam0001c29e = 0x1a;
  iRam0001c2b2 = iRam0001c2b2 + 1;
  xRam0002a65a = 0x1a66;
  pxVar8 = (xunknown1 *)0x81;
  if (*(uint1 *)0x80 != 0) {
    pxVar10 = (xunknown1 *)0x1b6e;
    xRam0002a65a = 0x1a66;
    for (iVar7 = *(uint1 *)0x80 + 1; xVar5 = xRam0002a65a, iVar7 != 0; iVar7 = iVar7 + -1) {
      pxVar2 = pxVar10;
      pxVar10 = pxVar10 + 1;
      pxVar1 = pxVar8;
      pxVar8 = pxVar8 + 1;
      *pxVar2 = *pxVar1;
    }
    pxVar10[-1] = 0;
    iVar7 = 2;
    pcVar6 = (char *)0x1b6e;
    do {
      do {
        pcVar9 = pcVar6;
        if (*pcVar9 == '\0') {
          return;
        }
        pcVar6 = pcVar9 + 1;
      } while (*pcVar9 == ' ');
      *(xunknown2 *)(iVar7 + 0x1c3e) = pcVar9;
      *(int2 *)0x1c52 = *(int2 *)0x1c52 + 1;
      iVar7 = iVar7 + 2;
      do {
        pcVar9 = pcVar6;
        if (*pcVar9 == '\0') {
          return;
        }
        pcVar6 = pcVar9 + 1;
      } while (*pcVar9 != ' ');
      *pcVar9 = '\0';
    } while( true );
  }
  return;
}
