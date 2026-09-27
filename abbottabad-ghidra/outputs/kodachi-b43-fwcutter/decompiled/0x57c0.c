
/* PLT thunks referenced (addr -> libc symbol):
 *   func_0x000056f8 = free
 *   func_0x00005728 = fclose
 *   func_0x00005738 = __stack_chk_fail
 *   func_0x00005748 = __libc_start_main
 *   func_0x00005758 = strcmp
 *   func_0x00005778 = malloc
 *   func_0x00005788 = __printf_chk
 *   func_0x00005790 = fopen
 *   func_0x00005798 = perror
 *   func_0x000057a0 = exit
 *   func_0x000057b0 = __fprintf_chk
 */
/* ==== 0x57c0  (x86:LE:64:default, gcc, 414 ms) ==== */
xunknown8 0x57c0(int4 param_1,xunknown8 *param_2)

{
  uint4 *puVar1;
  uint4 uVar2;
  uint4 uVar3;
  uint2 uVar4;
  bool bVar5;
  int4 iVar6;
  int8 iVar7;
  uint4 *puVar8;
  uint4 *puVar9;
  uint4 *puVar10;
  uint2 *puVar11;
  uint2 *puVar12;
  uint4 *puVar13;
  uint2 uVar14;
  xunknown8 xVar15;
  uint4 *puVar16;
  xunknown4 xVar17;
  int8 iVar18;
  uint4 uVar19;
  xunknown8 xVar20;
  uint4 uVar21;
  uint8 uVar22;
  uint4 uVar23;
  uint4 uVar24;
  int8 in_FS_OFFSET;
  xunknown1 axVar25 [16];
  int8 iStack_a8;
  uint4 *puStack_a0;
  xunknown8 xStack_98;
  uint8 uStack_90;
  uint2 uStack_7a;
  uint4 uStack_78;
  uint4 uStack_74;
  uint4 uStack_70;
  uint4 uStack_6c;
  uint4 uStack_68;
  uint4 uStack_64;
  uint4 uStack_60;
  xunknown4 xStack_5c;
  xunknown1 xStack_58;
  xunknown1 xStack_57;
  uint4 uStack_54;
  xunknown4 axStack_48 [2];
  int8 iStack_40;
  
  iStack_40 = *(int8 *)(in_FS_OFFSET + 0x28);
  xRam000000000020e858 = 0x8024;
  if (param_1 < 2) {
code_r0x00005aaf:
    func_0x00005788(1,0x808c);
    func_0x00005788(1,0x8c50);
    func_0x00005788(1,0x8c88);
    func_0x00005788(1,0x8cc0,*param_2);
    func_0x00005788(1,0x8cf0);
    func_0x00005788(1,0x8d40);
    func_0x00005788(1,0x8d78);
    func_0x00005788(1,0x8db0);
    func_0x00005788(1,0x8df8);
    func_0x00005788(1,0x8e38);
    func_0x00005788(1,0x8e70);
    func_0x00005788(1,0x8ea0,*param_2);
code_r0x00005b99:
    xVar15 = 0xffffffff;
  }
  else {
    uStack_64 = 1;
    do {
      iVar6 = func_0x00007170(param_2,&uStack_64,0x80a9,0x80a6,0);
      if (iVar6 == 0) {
        iRam000000000020e860 = 1;
      }
      else {
        if (iVar6 == -1) goto code_r0x00005b99;
        iVar6 = func_0x00007170(param_2,&uStack_64,0x80b3,0x80b0,0);
        if (iVar6 == 0) {
          func_0x00005788(1,0x808c);
          xVar15 = 0;
          goto code_r0x00005b9c;
        }
        if (iVar6 == -1) goto code_r0x00005b99;
        iVar6 = func_0x00007170(param_2,&uStack_64,0x80c0,0x80bd,0);
        if (iVar6 == 0) goto code_r0x00005aaf;
        if (iVar6 == -1) goto code_r0x00005b99;
        iVar6 = func_0x00007170(param_2,&uStack_64,0x80ca,0x80c7,0);
        if (iVar6 == 0) {
          iRam000000000020e860 = 2;
        }
        else {
          if (iVar6 == -1) goto code_r0x00005b99;
          iVar6 = func_0x00007170(param_2,&uStack_64,0x80d8,0x80d5,0);
          if (iVar6 == 0) {
            iRam000000000020e860 = 3;
          }
          else {
            if (iVar6 == -1) goto code_r0x00005b99;
            iVar6 = func_0x00006430(param_2,&uStack_64,0x80e3,0);
            if (iVar6 + 1U < 2) {
              if (iVar6 != 0) goto code_r0x00005b99;
              iRam000000000020e864 = 1;
            }
            else {
              iVar6 = func_0x00007170(param_2,&uStack_64,0x80f4,0x80f1,&uStack_60);
              if (iVar6 != 0) {
                if (iVar6 == -1) goto code_r0x00005b99;
                iRam000000000020e850 = param_2[(int4)uStack_64];
                break;
              }
              xRam000000000020e858 = CONCAT44(xStack_5c,uStack_60);
            }
          }
        }
      }
      uStack_64 = uStack_64 + 1;
    } while ((int4)uStack_64 < param_1);
    if (iRam000000000020e850 == 0) {
      if (iRam000000000020e860 != 1) goto code_r0x00005aaf;
    }
    else if (iRam000000000020e860 != 1) {
      iStack_a8 = func_0x00005790(iRam000000000020e850,0x8101);
      if (iStack_a8 == 0) {
        func_0x000057b0(xRam000000000020e840,1,0x8104,iRam000000000020e850);
        xVar15 = 2;
        goto code_r0x00005b9c;
      }
      iVar7 = func_0x00006a90(iStack_a8);
      if (iVar7 == 0) {
        xVar15 = 0xffffffff;
      }
      else {
        uVar24 = *(uint4 *)(iVar7 + 0x20);
        xStack_98 = 0x7f57;
        if ((uVar24 & 2) == 0) {
          xStack_98 = 0x7f5b;
        }
        if (iRam000000000020e860 != 3) {
          if (**(int8 **)(iVar7 + 0x18) != 0) {
            puStack_a0 = (uint4 *)&xStack_58;
            puVar16 = (uint4 *)((int8)*(int8 **)(iVar7 + 0x18) + 0xc);
            do {
              xVar15 = 0x8078;
              puStack_a0[0] = 0;
              puStack_a0[1] = 0;
              xStack_57 = 1;
              uVar21 = (uint4)*(xunknown8 *)(puVar16 + -3);
              if (iRam000000000020e860 != 2) {
                xVar15 = 0x8081;
              }
              func_0x00005788(1,0x81af,xVar15,xStack_98);
              uVar19 = puVar16[-1];
              puVar8 = (uint4 *)func_0x000071e0(iStack_a8,uVar19,puVar16);
              switch(puVar16[1]) {
              default:
                goto code_r0x00005de4;
              case 1:
                iVar6 = 0;
                goto code_r0x00005bda;
              case 2:
                iVar6 = 0;
                goto code_r0x00005bd7;
              case 3:
                iVar6 = 1;
code_r0x00005bd7:
                iVar6 = iVar6 + 1;
code_r0x00005bda:
                uVar23 = *puVar16;
                if (((uVar24 & 1) != 0) && (uVar23 >> 2 != 0)) {
                  puVar9 = puVar8;
                  do {
                    uVar21 = *puVar9;
                    puVar10 = puVar9 + 1;
                    *puVar9 = uVar21 >> 0x18 | (uVar21 & 0xff0000) >> 8 | (uVar21 & 0xff00) << 8 |
                              uVar21 << 0x18;
                    puVar9 = puVar10;
                  } while (puVar10 != puVar8 + (uint8)((uVar23 >> 2) - 1) + 1);
                }
                func_0x00006d90(iVar6 + 1,puVar8,uVar23);
                xStack_58 = 0x75;
                uStack_54 = uVar23 >> 0x18 | (uVar23 & 0xff0000) >> 8 | (uVar23 & 0xff00) << 8 |
                            uVar23 << 0x18;
                uStack_68 = uVar23;
                break;
              case 4:
                uStack_6c = *puVar16;
                if (((uVar24 & 1) != 0) && (uStack_6c >> 2 != 0)) {
                  iVar18 = 0;
                  do {
                    uVar21 = puVar8[iVar18];
                    puVar8[iVar18] =
                         uVar21 >> 0x18 | (uVar21 & 0xff0000) >> 8 | (uVar21 & 0xff00) << 8 |
                         uVar21 << 0x18;
                    iVar18 = iVar18 + 1;
                  } while ((uint4)iVar18 < uStack_6c >> 2);
                }
                uStack_54 = uStack_6c >> 0x18 | (uStack_6c & 0xff0000) >> 8 |
                            (uStack_6c & 0xff00) << 8 | uStack_6c << 0x18;
                xStack_58 = 0x70;
                uVar23 = uStack_6c;
                break;
              case 5:
                xStack_58 = 0x69;
                uVar2 = *puVar16;
                puVar9 = (uint4 *)func_0x00005778(uVar2);
                uVar23 = uVar2;
                if (puVar9 == (uint4 *)0x0) {
code_r0x000062d3:
                  func_0x00005798(0x8041);
                  func_0x000057a0(1);
code_r0x000062e9:
                  uStack_60 = uVar21;
                }
                else {
                  uVar19 = 0;
                  uVar23 = 0;
                  uVar2 = uVar2 >> 3;
                  if (uVar2 != 0) {
                    bVar5 = false;
                    uVar23 = 0;
                    puVar10 = puVar8;
                    puVar13 = puVar9;
                    uVar21 = uStack_60;
                    uVar3 = 0;
                    do {
                      while( true ) {
                        uVar19 = uVar3;
                        uVar14 = (uint2)*puVar10;
                        if ((uVar24 & 1) != 0) {
                          *(uint2 *)((int8)puVar10 + 2) =
                               *(uint2 *)((int8)puVar10 + 2) >> 8 |
                               *(uint2 *)((int8)puVar10 + 2) << 8;
                          uVar3 = puVar10[1];
                          uVar14 = uVar14 >> 8 | uVar14 << 8;
                          *(uint2 *)puVar10 = uVar14;
                          puVar10[1] = uVar3 >> 0x18 | (uVar3 & 0xff0000) >> 8 |
                                       (uVar3 & 0xff00) << 8 | uVar3 << 0x18;
                        }
                        if ((uVar14 & 0x80) != 0) {
                          uVar19 = 0x81bc;
                          func_0x00005788(1,0x81bc,0x7fff);
                          func_0x000057a0(1);
                          goto code_r0x000062d3;
                        }
                        *(uint2 *)puVar13 = uVar14;
                        if (*(uint2 *)((int8)puVar10 + 2) != 0x400) break;
                        uVar23 = uVar23 + 6;
                        *(uint2 *)puVar13 = uVar14 | 0x80;
                        puVar1 = puVar10 + 1;
                        puVar10 = puVar10 + 2;
                        *(uint4 *)((int8)puVar13 + 2) = *puVar1;
                        puVar13 = (uint4 *)((int8)puVar13 + 6);
                        uVar3 = uVar19 + 1;
                        if (uVar2 <= uVar19 + 1) goto code_r0x00005d83;
                      }
                      if (*(uint2 *)((int8)puVar10 + 2) != 0x200) goto code_r0x000062a8;
                      uVar21 = puVar10[1];
                      if ((int2)uVar21 != 0) {
                        xVar15 = 0x9008;
                        do {
                          func_0x00005788(1,xVar15);
                          func_0x000057a0(1);
code_r0x000062a8:
                          xVar15 = 0x81d9;
                        } while( true );
                      }
                      uVar23 = uVar23 + 4;
                      uVar4 = (uint2)(uVar21 >> 8);
                      uVar14 = (uint2)(uint1)(uVar21 >> 0x18);
                      uStack_7a = uVar14 | uVar4 & 0xff00;
                      puVar10 = puVar10 + 2;
                      bVar5 = true;
                      *(uint2 *)((int8)puVar13 + 2) = uVar14 << 8 | uVar4 >> 8;
                      puVar13 = puVar13 + 1;
                      uVar3 = uVar19 + 1;
                    } while (uVar19 + 1 < uVar2);
code_r0x00005d83:
                    uVar19 = uVar19 + 1;
                    if (bVar5) goto code_r0x000062e9;
                  }
                }
                uStack_54 = uVar19 >> 0x18 | (uVar19 & 0xff0000) >> 8 | (uVar19 & 0xff00) << 8 |
                            uVar19 << 0x18;
                uStack_64 = uVar19;
                func_0x000056f8(puVar8);
                puVar8 = puVar9;
              }
              if (iRam000000000020e860 == 0) {
                func_0x000068d0(*(xunknown8 *)(puVar16 + -3),puVar8,uVar23,puStack_a0,uVar24);
              }
              func_0x000056f8(puVar8);
              if (*(int8 *)(puVar16 + 3) == 0) break;
              uVar24 = *(uint4 *)(iVar7 + 0x20);
              puVar16 = puVar16 + 6;
            } while( true );
          }
          goto code_r0x00005dee;
        }
        func_0x00006570();
        puStack_a0 = &uStack_60;
        for (puVar16 = (uint4 *)(*(int8 *)(iVar7 + 0x18) + 0xc); iVar18 = *(int8 *)(puVar16 + -3),
            iVar18 != 0; puVar16 = puVar16 + 6) {
          iVar6 = func_0x00005758(0x811f,iVar18);
          if (iVar6 != 0) {
            xVar17 = 2;
            iVar6 = func_0x00005758(0x8130,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 3;
            iVar6 = func_0x00005758(0x813f,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 4;
            iVar6 = func_0x00005758(0x8150,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 5;
            iVar6 = func_0x00005758(0x815f,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 6;
            iVar6 = func_0x00005758(0x8170,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 7;
            iVar6 = func_0x00005758(0x817f,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 8;
            iVar6 = func_0x00005758(0x8775,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 9;
            iVar6 = func_0x00005758(0x84cb,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 10;
            iVar6 = func_0x00005758(0x818f,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            xVar17 = 0xc;
            iVar6 = func_0x00005758(0x819c,iVar18);
            if (iVar6 == 0) goto code_r0x00005f5b;
            goto code_r0x00006078;
          }
          xVar17 = 1;
code_r0x00005f5b:
          xVar15 = 0x8078;
          uVar24 = *(uint4 *)(iVar7 + 0x20);
          if (iRam000000000020e860 != 2) {
            xVar15 = 0x8081;
          }
          func_0x00005788(1,0x81a8,xVar15,iVar18);
          puVar11 = (uint2 *)func_0x000071e0(iStack_a8,puVar16[-1],puVar16);
          switch(puVar16[1]) {
          case 1:
            iVar6 = 0;
            goto code_r0x00005fc0;
          case 2:
            iVar6 = 0;
            goto code_r0x00005fbd;
          case 3:
            iVar6 = 1;
code_r0x00005fbd:
            iVar6 = iVar6 + 1;
code_r0x00005fc0:
            uVar21 = *puVar16;
            uStack_90 = (uint8)uVar21;
            if ((uVar24 & 1) != 0) {
              for (iVar18 = 0; (uint4)iVar18 < uVar21 >> 2; iVar18 = iVar18 + 1) {
                uVar24 = *(uint4 *)(puVar11 + iVar18 * 2);
                *(uint4 *)(puVar11 + iVar18 * 2) =
                     uVar24 >> 0x18 | (uVar24 & 0xff0000) >> 8 | (uVar24 & 0xff00) << 8 |
                     uVar24 << 0x18;
              }
            }
            xStack_98 = CONCAT44(xStack_98._4_4_,uVar21);
            func_0x00006d90(iVar6 + 1,puVar11,uStack_90);
            for (iVar18 = 0; (uint4)iVar18 < (uint4)xStack_98 >> 2; iVar18 = iVar18 + 1) {
              uVar24 = *(uint4 *)(puVar11 + iVar18 * 2);
              *(uint4 *)(puVar11 + iVar18 * 2) =
                   uVar24 >> 0x18 | (uVar24 & 0xff0000) >> 8 | (uVar24 & 0xff00) << 8 |
                   uVar24 << 0x18;
            }
            uStack_70 = (uint4)xStack_98;
            uStack_60 = (uint4)xStack_98;
            uVar22 = uStack_90;
            break;
          case 4:
            uStack_74 = *puVar16;
            uVar22 = (uint8)uStack_74;
            uStack_60 = uStack_74;
            if ((uVar24 & 1) == 0) {
              for (iVar18 = 0; (uint4)iVar18 < uStack_74 >> 2; iVar18 = iVar18 + 1) {
                uVar24 = *(uint4 *)(puVar11 + iVar18 * 2);
                *(uint4 *)(puVar11 + iVar18 * 2) =
                     uVar24 >> 0x18 | (uVar24 & 0xff0000) >> 8 | (uVar24 & 0xff00) << 8 |
                     uVar24 << 0x18;
              }
            }
            break;
          case 5:
            uStack_78 = *puVar16;
            uVar22 = (uint8)uStack_78;
            uStack_60 = uStack_78;
            if ((uVar24 & 1) == 0) {
              for (puVar12 = puVar11;
                  (uint2 *)((uint8)(uStack_78 & 0xfffffff8) + (int8)puVar11) != puVar12;
                  puVar12 = puVar12 + 4) {
                *puVar12 = *puVar12 >> 8 | *puVar12 << 8;
                puVar12[1] = puVar12[1] >> 8 | puVar12[1] << 8;
                uVar24 = *(uint4 *)(puVar12 + 2);
                *(uint4 *)(puVar12 + 2) =
                     uVar24 >> 0x18 | (uVar24 & 0xff0000) >> 8 | (uVar24 & 0xff00) << 8 |
                     uVar24 << 0x18;
              }
            }
            break;
          default:
            goto code_r0x00005de4;
          }
          func_0x000066f0(xVar17,puVar11,uVar22 & 0xffffffff);
          xVar15 = *(xunknown8 *)(puVar16 + -3);
          iVar6 = func_0x00005758(0x818f,xVar15);
          xVar20 = 0xb;
          if (iVar6 == 0) {
code_r0x00006061:
            func_0x000066f0(xVar20,puStack_a0,4);
          }
          else {
            iVar6 = func_0x00005758(0x819c,xVar15);
            xVar20 = 0xd;
            if (iVar6 == 0) goto code_r0x00006061;
          }
          func_0x000056f8(puVar11);
code_r0x00006078:
        }
        axStack_48[0] = 0;
        func_0x000066f0(7,axStack_48,4);
        func_0x000066f0(0xe,axStack_48,4);
        func_0x000066f0(0xf,axStack_48,4);
        xVar15 = 0;
      }
      goto code_r0x00005df0;
    }
    iVar7 = 0x209b20;
    func_0x00005788(1,0x808c);
    iVar18 = 0x209b20;
    func_0x00005788(1,0x8f40);
    func_0x00005788(1,0x8fd0);
    do {
      if ((((*(uint4 *)(iVar18 + 0x20) & 4) == 0) || (iRam000000000020e864 != 0)) &&
         ((*(uint4 *)(iVar18 + 0x20) & 2) == 0)) {
        func_0x00006f50(iVar18);
      }
      iVar18 = iVar18 + 0x28;
    } while (iVar18 != 0x209d28);
    do {
      if ((((*(uint4 *)(iVar7 + 0x20) & 4) == 0) || (iRam000000000020e864 != 0)) &&
         ((*(uint4 *)(iVar7 + 0x20) & 2) != 0)) {
        func_0x00006f50(iVar7);
      }
      iVar7 = iVar7 + 0x28;
    } while (iVar7 != 0x209d28);
    func_0x00005788(1,0x81f2);
    xVar15 = 0;
  }
code_r0x00005b9c:
  if (iStack_40 == *(int8 *)(in_FS_OFFSET + 0x28)) {
    return xVar15;
  }
  axVar25 = func_0x00005738();
  iVar7 = iStack_a8;
  iStack_a8 = axVar25._0_8_;
  func_0x00005748(0x57c0,iVar7,&puStack_a0,0x7e30,0x7ea0,axVar25._8_8_,&iStack_a8);
  do {
                    /* WARNING: Do nothing block with infinite loop */
  } while( true );
code_r0x00005de4:
  func_0x000057a0(0xff);
code_r0x00005dee:
  xVar15 = 0;
code_r0x00005df0:
  func_0x00005728(iStack_a8);
  goto code_r0x00005b9c;
}
