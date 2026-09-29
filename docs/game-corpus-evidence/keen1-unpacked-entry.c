# /tmp/games/unpacked/KEEN1.unp.exe
# MZ: pages=197 lastPage=132 relo=17 hdrParas=32 (image @file 0x200)
#     minalloc=1386 maxalloc=65535 ss:sp=0x1dca:0x80
#     entry cs:ip=0x0:0x0 -> linear 0x10000 (image +0x0)
#     load image ≈ 0x18684 bytes, file image 99972 bytes, base=0x10000 lang=x86:LE:16:Real Mode

/* ==== 0x10000  (x86:LE:16:Real Mode, default, 269 ms) ==== */
/* WARNING: Possible PIC construction at 0x00010232: Changing call to branch */
/* WARNING: Removing unreachable block (ram,0x00010235) */
/* WARNING: Removing unreachable block (ram,0x0001025f) */
/* WARNING: Removing unreachable block (ram,0x0001026e) */
/* WARNING: Removing unreachable block (ram,0x00010273) */
/* WARNING: Removing unreachable block (ram,0x00010279) */

void 0x10000(void)

{
  char *pcVar1;
  xunknown1 *pxVar2;
  code *pcVar3;
  char *pcVar4;
  uint2 uVar5;
  int2 iVar6;
  int2 iVar7;
  xunknown2 extraout_DX;
  uint2 uVar8;
  uint1 *puVar9;
  char *pcVar10;
  char *pcVar11;
  xunknown1 *pxVar12;
  xunknown2 unaff_ES;
  xunknown2 xVar13;
  xunknown2 unaff_DS;
  xunknown4 xVar14;
  
  xRam00010235 = 0x1305;
  pcVar3 = (code *)swi(0x21);
  xVar14 = (*pcVar3)();
  iVar7 = (int2)((uint4)xVar14 >> 0x10);
  iVar6 = *(int2 *)0x2;
  xVar13 = *(xunknown2 *)0x2c;
  *(xunknown2 *)0x90 = (int2)xVar14;
  *(xunknown2 *)0x8e = unaff_ES;
  *(xunknown2 *)0x8a = xVar13;
  *(int2 *)0xa6 = iVar6;
  func_0x00010165();
  pcVar4 = (char *)*(xunknown4 *)0x88;
  xVar13 = (xunknown2)((uint4)pcVar4 >> 0x10);
  pcVar10 = (char *)pcVar4;
  uVar5 = 0x7fff;
  pcVar11 = pcVar10;
code_r0x00010034:
  do {
    if (uVar5 != 0) {
      uVar5 = uVar5 - 1;
      pcVar1 = pcVar11;
      pcVar11 = pcVar11 + 1;
      if ((char)pcVar4 != *pcVar1) goto code_r0x00010034;
    }
    if (uVar5 == 0) goto code_r0x00010226;
    pcVar10 = pcVar10 + 1;
    if (*pcVar11 == (char)pcVar4) {
      *(int2 *)0x88 = -(uVar5 | 0x8000);
      *(uint2 *)0x8c = (int2)pcVar10 * 2 + 8U & 0xfff8;
      uVar8 = iVar6 - iVar7;
      uVar5 = *(uint2 *)0x554c;
      if (uVar5 < 0x200) {
        uVar5 = 0x200;
        *(xunknown2 *)0x554c = 0x200;
      }
      if (((uVar5 < 0x53ba) && (!CARRY2(uVar5 + 0xac46,*(uint2 *)0x5544))) &&
         (uVar5 = (uVar5 + 0xac46 + *(uint2 *)0x5544 >> 4) + 1, uVar5 <= uVar8)) {
        if (((*(int2 *)0x554c == 0) || (*(int2 *)0x5544 == 0)) && (uVar5 = 0x1000, uVar8 < 0x1001))
        {
          uVar5 = uVar8;
        }
        *(int2 *)0x9e = uVar5 + iVar7;
        *(int2 *)0xa2 = uVar5 + iVar7;
        pcVar3 = (code *)swi(0x21);
        (*pcVar3)();
        xVar13 = xRam00010235;
        pxVar12 = (xunknown1 *)0x563e;
        for (iVar6 = 0x5608; iVar6 != 0; iVar6 = iVar6 + -1) {
          pxVar2 = pxVar12;
          pxVar12 = pxVar12 + 1;
          *pxVar2 = 0;
        }
        pcVar3 = (code *)swi(0x1a);
        (*pcVar3)();
        *(xunknown2 *)0x94 = extraout_DX;
        *(int2 *)0x96 = iVar6;
        func_0x000101d5();
        xVar13 = func_0x000112cf(*(xunknown2 *)0x82,*(xunknown2 *)0x84,*(xunknown2 *)0x86);
        xRam000101e7 = 0x72;
        xRam000101d6 = 0;
        func_0x0001c5d7(xVar13);
        func_0x000101d5();
        xVar13 = xRam00010235;
        (*(code *)*(xunknown2 *)0x53d0)();
        (*(code *)*(xunknown2 *)0x53d2)();
        (*(code *)*(xunknown2 *)0x53d4)();
        goto code_r0x0001012e;
      }
code_r0x00010226:
      do {
        func_0x00010218();
code_r0x0001012e:
        xVar13 = xRam00010235;
        func_0x000101a8();
        iVar6 = 0;
        puVar9 = (uint1 *)0x0;
        iVar7 = 0x2d;
        do {
          iVar6 = CONCAT11((char)((uint2)iVar6 >> 8) + CARRY1((uint1)iVar6,*puVar9),
                           (uint1)iVar6 + *puVar9);
          puVar9 = puVar9 + 1;
          iVar7 = iVar7 + -1;
        } while (iVar7 != 0);
        if (iVar6 != 0xca5) {
          func_0x00010218();
        }
        pcVar3 = (code *)swi(0x21);
        (*pcVar3)();
      } while( true );
    }
  } while( true );
}
