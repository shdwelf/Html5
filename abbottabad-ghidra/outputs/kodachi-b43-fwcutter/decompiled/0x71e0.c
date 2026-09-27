
/* PLT thunks referenced (addr -> libc symbol):
 *   func_0x00005720 = fread
 *   func_0x00005778 = malloc
 *   func_0x00005780 = fseek
 *   func_0x00005798 = perror
 *   func_0x000057a0 = exit
 */
/* ==== 0x71e0  (x86:LE:64:default, gcc, 280 ms) ==== */
uint8 0x71e0(xunknown8 param_1,uint4 param_2,uint4 *param_3)

{
  int4 iVar1;
  int4 iVar2;
  int4 iVar3;
  int4 iVar4;
  int4 iVar5;
  int4 iVar6;
  int4 iVar7;
  int4 iVar8;
  int4 iVar9;
  int4 iVar10;
  int4 iVar11;
  int4 iVar12;
  int4 iVar13;
  int4 iVar14;
  int4 iVar15;
  int4 iVar16;
  uint4 uVar17;
  uint8 uVar18;
  uint8 uVar19;
  uint4 uVar20;
  int4 *piVar21;
  int4 *piVar22;
  uint4 uVar23;
  uint4 uVar24;
  uint4 uVar25;
  
  piVar21 = (int4 *)(uint8)param_2;
  iVar16 = func_0x00005780(param_1,piVar21,0);
  if (iVar16 == 0) {
    uVar17 = *param_3;
    uVar18 = func_0x00005778(uVar17);
    if (uVar18 == 0) goto code_r0x00007267;
    piVar21 = (int4 *)0x1;
    uVar19 = func_0x00005720(uVar18,1,uVar17,param_1);
    if (uVar19 == *param_3) {
      return uVar18;
    }
  }
  else {
    func_0x00005798(0x802a);
    func_0x000057a0(2);
  }
  func_0x00005798(0x805b);
  func_0x000057a0(3);
code_r0x00007267:
  func_0x00005798(0x8041);
  piVar22 = (int4 *)0x3;
  func_0x000057a0();
  iVar16 = *piVar21;
  iVar1 = piVar21[1];
  iVar2 = piVar21[6];
  uVar17 = ((piVar22[2] ^ piVar22[3]) & piVar22[1] ^ piVar22[3]) + *piVar22 + -0x28955b88 + iVar16;
  uVar17 = (uVar17 * 0x80 | uVar17 >> 0x19) + piVar22[1];
  iVar3 = piVar21[5];
  uVar20 = ((piVar22[1] ^ piVar22[2]) & uVar17 ^ piVar22[2]) + piVar22[3] + -0x173848aa + iVar1;
  iVar4 = piVar21[2];
  uVar20 = (uVar20 * 0x1000 | uVar20 >> 0x14) + uVar17;
  iVar5 = piVar21[3];
  uVar23 = ((piVar22[1] ^ uVar17) & uVar20 ^ piVar22[1]) + piVar22[2] + 0x242070db + iVar4;
  uVar24 = (uVar23 >> 0xf | uVar23 * 0x20000) + uVar20;
  iVar6 = piVar21[4];
  uVar23 = ((uVar17 ^ uVar20) & uVar24 ^ uVar17) + piVar22[1] + -0x3e423112 + iVar5;
  uVar23 = (uVar23 >> 10 | uVar23 * 0x400000) + uVar24;
  iVar7 = piVar21[7];
  iVar8 = piVar21[9];
  iVar9 = piVar21[0xc];
  uVar17 = ((uVar20 ^ uVar24) & uVar23 ^ uVar20) + uVar17 + 0xf57c0faf + iVar6;
  uVar17 = (uVar17 * 0x80 | uVar17 >> 0x19) + uVar23;
  uVar20 = ((uVar24 ^ uVar23) & uVar17 ^ uVar24) + uVar20 + 0x4787c62a + iVar3;
  iVar10 = piVar21[10];
  uVar20 = (uVar20 * 0x1000 | uVar20 >> 0x14) + uVar17;
  uVar24 = ((uVar23 ^ uVar17) & uVar20 ^ uVar23) + uVar24 + 0xa8304613 + iVar2;
  uVar24 = (uVar24 >> 0xf | uVar24 * 0x20000) + uVar20;
  uVar23 = ((uVar17 ^ uVar20) & uVar24 ^ uVar17) + uVar23 + 0xfd469501 + iVar7;
  iVar11 = piVar21[8];
  uVar23 = (uVar23 >> 10 | uVar23 * 0x400000) + uVar24;
  uVar17 = ((uVar20 ^ uVar24) & uVar23 ^ uVar20) + uVar17 + 0x698098d8 + iVar11;
  uVar17 = (uVar17 * 0x80 | uVar17 >> 0x19) + uVar23;
  uVar20 = ((uVar24 ^ uVar23) & uVar17 ^ uVar24) + uVar20 + 0x8b44f7af + iVar8;
  uVar20 = (uVar20 * 0x1000 | uVar20 >> 0x14) + uVar17;
  uVar24 = ((uVar23 ^ uVar17) & uVar20 ^ uVar23) + (uVar24 - 0xa44f) + iVar10;
  iVar12 = piVar21[0xb];
  uVar24 = (uVar24 >> 0xf | uVar24 * 0x20000) + uVar20;
  uVar23 = ((uVar17 ^ uVar20) & uVar24 ^ uVar17) + uVar23 + 0x895cd7be + iVar12;
  uVar23 = (uVar23 >> 10 | uVar23 * 0x400000) + uVar24;
  uVar17 = ((uVar20 ^ uVar24) & uVar23 ^ uVar20) + uVar17 + 0x6b901122 + iVar9;
  iVar13 = piVar21[0xd];
  uVar17 = (uVar17 * 0x80 | uVar17 >> 0x19) + uVar23;
  uVar20 = ((uVar24 ^ uVar23) & uVar17 ^ uVar24) + uVar20 + 0xfd987193 + iVar13;
  iVar14 = piVar21[0xe];
  uVar20 = (uVar20 * 0x1000 | uVar20 >> 0x14) + uVar17;
  uVar24 = ((uVar23 ^ uVar17) & uVar20 ^ uVar23) + uVar24 + 0xa679438e + iVar14;
  iVar15 = piVar21[0xf];
  uVar24 = (uVar24 >> 0xf | uVar24 * 0x20000) + uVar20;
  uVar23 = ((uVar17 ^ uVar20) & uVar24 ^ uVar17) + uVar23 + 0x49b40821 + iVar15;
  uVar23 = (uVar23 >> 10 | uVar23 * 0x400000) + uVar24;
  uVar17 = ((uVar24 ^ uVar23) & uVar20 ^ uVar24) + iVar1 + -0x9e1da9e + uVar17;
  uVar17 = (uVar17 * 0x20 | uVar17 >> 0x1b) + uVar23;
  uVar20 = ((uVar23 ^ uVar17) & uVar24 ^ uVar23) + iVar2 + -0x3fbf4cc0 + uVar20;
  uVar20 = (uVar20 * 0x200 | uVar20 >> 0x17) + uVar17;
  uVar24 = ((uVar17 ^ uVar20) & uVar23 ^ uVar17) + iVar12 + 0x265e5a51 + uVar24;
  uVar24 = (uVar24 * 0x4000 | uVar24 >> 0x12) + uVar20;
  uVar23 = ((uVar20 ^ uVar24) & uVar17 ^ uVar20) + iVar16 + -0x16493856 + uVar23;
  uVar23 = (uVar23 >> 0xc | uVar23 * 0x100000) + uVar24;
  uVar17 = ((uVar24 ^ uVar23) & uVar20 ^ uVar24) + iVar3 + -0x29d0efa3 + uVar17;
  uVar17 = (uVar17 * 0x20 | uVar17 >> 0x1b) + uVar23;
  uVar20 = ((uVar23 ^ uVar17) & uVar24 ^ uVar23) + iVar10 + 0x2441453 + uVar20;
  uVar20 = (uVar20 * 0x200 | uVar20 >> 0x17) + uVar17;
  uVar24 = ((uVar17 ^ uVar20) & uVar23 ^ uVar17) + iVar15 + -0x275e197f + uVar24;
  uVar24 = (uVar24 * 0x4000 | uVar24 >> 0x12) + uVar20;
  uVar23 = ((uVar20 ^ uVar24) & uVar17 ^ uVar20) + iVar6 + -0x182c0438 + uVar23;
  uVar23 = (uVar23 >> 0xc | uVar23 * 0x100000) + uVar24;
  uVar17 = ((uVar24 ^ uVar23) & uVar20 ^ uVar24) + iVar8 + 0x21e1cde6 + uVar17;
  uVar17 = (uVar17 * 0x20 | uVar17 >> 0x1b) + uVar23;
  uVar20 = ((uVar23 ^ uVar17) & uVar24 ^ uVar23) + iVar14 + -0x3cc8f82a + uVar20;
  uVar20 = (uVar20 * 0x200 | uVar20 >> 0x17) + uVar17;
  uVar24 = ((uVar17 ^ uVar20) & uVar23 ^ uVar17) + iVar5 + -0xb2af279 + uVar24;
  uVar24 = (uVar24 * 0x4000 | uVar24 >> 0x12) + uVar20;
  uVar23 = ((uVar20 ^ uVar24) & uVar17 ^ uVar20) + iVar11 + 0x455a14ed + uVar23;
  uVar23 = (uVar23 >> 0xc | uVar23 * 0x100000) + uVar24;
  uVar17 = ((uVar24 ^ uVar23) & uVar20 ^ uVar24) + iVar13 + -0x561c16fb + uVar17;
  uVar17 = (uVar17 * 0x20 | uVar17 >> 0x1b) + uVar23;
  uVar20 = ((uVar23 ^ uVar17) & uVar24 ^ uVar23) + iVar4 + -0x3105c08 + uVar20;
  uVar20 = (uVar20 * 0x200 | uVar20 >> 0x17) + uVar17;
  uVar24 = ((uVar17 ^ uVar20) & uVar23 ^ uVar17) + iVar7 + 0x676f02d9 + uVar24;
  uVar24 = (uVar24 * 0x4000 | uVar24 >> 0x12) + uVar20;
  uVar23 = iVar9 + -0x72d5b376 + uVar23 + (uVar17 & (uVar20 ^ uVar24) ^ uVar20);
  uVar23 = (uVar23 >> 0xc | uVar23 * 0x100000) + uVar24;
  uVar17 = (uVar20 ^ uVar24 ^ uVar23) + iVar3 + -0x5c6be + uVar17;
  uVar25 = (uVar17 * 0x10 | uVar17 >> 0x1c) + uVar23;
  uVar17 = (uVar24 ^ uVar23 ^ uVar25) + iVar11 + -0x788e097f + uVar20;
  uVar20 = (uVar17 * 0x800 | uVar17 >> 0x15) + uVar25;
  uVar17 = (uVar23 ^ uVar25 ^ uVar20) + iVar12 + 0x6d9d6122 + uVar24;
  uVar24 = (uVar17 * 0x10000 | uVar17 >> 0x10) + uVar20;
  uVar17 = (uVar25 ^ uVar20 ^ uVar24) + iVar14 + -0x21ac7f4 + uVar23;
  uVar17 = (uVar17 >> 9 | uVar17 * 0x800000) + uVar24;
  uVar23 = (uVar20 ^ uVar24 ^ uVar17) + iVar1 + -0x5b4115bc + uVar25;
  uVar25 = (uVar23 * 0x10 | uVar23 >> 0x1c) + uVar17;
  uVar20 = (uVar24 ^ uVar17 ^ uVar25) + iVar6 + 0x4bdecfa9 + uVar20;
  uVar20 = (uVar20 * 0x800 | uVar20 >> 0x15) + uVar25;
  uVar23 = (uVar17 ^ uVar25 ^ uVar20) + iVar7 + -0x944b4a0 + uVar24;
  uVar23 = (uVar23 * 0x10000 | uVar23 >> 0x10) + uVar20;
  uVar17 = (uVar25 ^ uVar20 ^ uVar23) + iVar10 + -0x41404390 + uVar17;
  uVar24 = (uVar17 >> 9 | uVar17 * 0x800000) + uVar23;
  uVar17 = (uVar20 ^ uVar23 ^ uVar24) + iVar13 + 0x289b7ec6 + uVar25;
  uVar25 = (uVar17 * 0x10 | uVar17 >> 0x1c) + uVar24;
  uVar17 = (uVar23 ^ uVar24 ^ uVar25) + iVar16 + -0x155ed806 + uVar20;
  uVar17 = (uVar17 * 0x800 | uVar17 >> 0x15) + uVar25;
  uVar20 = (uVar24 ^ uVar25 ^ uVar17) + iVar5 + -0x2b10cf7b + uVar23;
  uVar20 = (uVar20 * 0x10000 | uVar20 >> 0x10) + uVar17;
  uVar23 = (uVar25 ^ uVar17 ^ uVar20) + iVar2 + 0x4881d05 + uVar24;
  uVar24 = (uVar23 >> 9 | uVar23 * 0x800000) + uVar20;
  uVar23 = (uVar17 ^ uVar20 ^ uVar24) + iVar8 + -0x262b2fc7 + uVar25;
  uVar23 = (uVar23 * 0x10 | uVar23 >> 0x1c) + uVar24;
  uVar17 = (uVar20 ^ uVar24 ^ uVar23) + iVar9 + -0x1924661b + uVar17;
  uVar25 = (uVar17 * 0x800 | uVar17 >> 0x15) + uVar23;
  uVar17 = (uVar24 ^ uVar23 ^ uVar25) + iVar15 + 0x1fa27cf8 + uVar20;
  uVar20 = (uVar17 * 0x10000 | uVar17 >> 0x10) + uVar25;
  uVar17 = iVar4 + -0x3b53a99b + uVar24 + (uVar23 ^ uVar25 ^ uVar20);
  uVar17 = (uVar17 >> 9 | uVar17 * 0x800000) + uVar20;
  uVar23 = iVar16 + -0xbd6ddbc + uVar23 + ((~uVar25 | uVar17) ^ uVar20);
  uVar23 = (uVar23 * 0x40 | uVar23 >> 0x1a) + uVar17;
  uVar24 = iVar7 + 0x432aff97 + uVar25 + ((~uVar20 | uVar23) ^ uVar17);
  uVar24 = (uVar24 * 0x400 | uVar24 >> 0x16) + uVar23;
  uVar20 = iVar14 + -0x546bdc59 + uVar20 + ((~uVar17 | uVar24) ^ uVar23);
  uVar20 = (uVar20 * 0x8000 | uVar20 >> 0x11) + uVar24;
  uVar17 = iVar3 + -0x36c5fc7 + uVar17 + ((~uVar23 | uVar20) ^ uVar24);
  uVar17 = (uVar17 >> 0xb | uVar17 * 0x200000) + uVar20;
  uVar23 = iVar9 + 0x655b59c3 + uVar23 + ((~uVar24 | uVar17) ^ uVar20);
  uVar23 = (uVar23 * 0x40 | uVar23 >> 0x1a) + uVar17;
  uVar24 = iVar5 + -0x70f3336e + uVar24 + ((~uVar20 | uVar23) ^ uVar17);
  uVar24 = (uVar24 * 0x400 | uVar24 >> 0x16) + uVar23;
  uVar20 = iVar10 + -0x100b83 + uVar20 + ((~uVar17 | uVar24) ^ uVar23);
  uVar20 = (uVar20 * 0x8000 | uVar20 >> 0x11) + uVar24;
  uVar17 = iVar1 + -0x7a7ba22f + uVar17 + ((~uVar23 | uVar20) ^ uVar24);
  uVar17 = (uVar17 >> 0xb | uVar17 * 0x200000) + uVar20;
  uVar23 = iVar11 + 0x6fa87e4f + uVar23 + ((~uVar24 | uVar17) ^ uVar20);
  uVar23 = (uVar23 * 0x40 | uVar23 >> 0x1a) + uVar17;
  uVar24 = iVar15 + -0x1d31920 + uVar24 + ((~uVar20 | uVar23) ^ uVar17);
  uVar24 = (uVar24 * 0x400 | uVar24 >> 0x16) + uVar23;
  uVar20 = ((~uVar17 | uVar24) ^ uVar23) + iVar2 + -0x5cfebcec + uVar20;
  uVar20 = (uVar20 * 0x8000 | uVar20 >> 0x11) + uVar24;
  uVar17 = ((~uVar23 | uVar20) ^ uVar24) + iVar13 + 0x4e0811a1 + uVar17;
  uVar25 = (uVar17 >> 0xb | uVar17 * 0x200000) + uVar20;
  uVar17 = ((~uVar24 | uVar25) ^ uVar20) + iVar6 + -0x8ac817e + uVar23;
  uVar17 = (uVar17 * 0x40 | uVar17 >> 0x1a) + uVar25;
  uVar23 = ((~uVar20 | uVar17) ^ uVar25) + iVar12 + -0x42c50dcb + uVar24;
  uVar23 = (uVar23 * 0x400 | uVar23 >> 0x16) + uVar17;
  uVar20 = ((~uVar25 | uVar23) ^ uVar17) + iVar4 + 0x2ad7d2bb + uVar20;
  uVar20 = (uVar20 * 0x8000 | uVar20 >> 0x11) + uVar23;
  uVar24 = ((~uVar17 | uVar20) ^ uVar23) + iVar8 + -0x14792c6f + uVar25;
  *piVar22 = uVar17 + *piVar22;
  uVar17 = (uVar24 >> 0xb | uVar24 * 0x200000) + piVar22[1] + uVar20;
  piVar22[1] = uVar17;
  piVar22[2] = uVar20 + piVar22[2];
  piVar22[3] = uVar23 + piVar22[3];
  return (uint8)uVar17;
}
