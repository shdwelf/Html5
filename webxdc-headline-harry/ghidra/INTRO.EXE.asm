; Ghidra 12.1.4
; Static disassembly only — the input was never executed
; Program: INTRO.EXE
; SHA-256: 01fa47f5a41cc061a59b884f817fe8ec0d9d047691ef452d909975562b74fa11
; Language: x86:LE:16:Real Mode

switchD_1000:99e7::caseD_2:
1000:000e          fe8e061e                       DEC byte ptr [BP + 0x1e06]
1000:0012          0f26c7                         MOV TR0,EDI
1000:0015          06                             PUSH ES
switchD_1000:8905::caseD_4:
1000:0016          2201                           AND AL,byte ptr [BX + DI]
1000:0018          54                             PUSH SP
switchD_1000:96f1::caseD_1:
1000:0019          008e0620                       ADD byte ptr [BP + 0x2006],CL
FUN_1000_003d:
1000:003d          55                             PUSH BP
1000:003e          8bec                           MOV BP,SP
1000:0040          83ec04                         SUB SP,0x4
switchD_1000:8905::caseD_10:
1000:0043          8d4606                         LEA AX,[BP + 0x6]
1000:0046          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0049          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:004c          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0050          26c70622015300                 MOV word ptr ES:[0x122],0x53
1000:0057          8e06200f                       MOV ES,word ptr [0xf20]
1000:005b          26a31c01                       MOV ES:[0x11c],AX
1000:005f          8e06220f                       MOV ES,word ptr [0xf22]
1000:0063          8cd0                           MOV AX,SS
1000:0065          26a32001                       MOV ES:[0x120],AX
1000:0069          9a0000000a                     CALLF 0x0000:a000
1000:006e          8e06240f                       MOV ES,word ptr [0xf24]
1000:0072          26a11401                       MOV AX,ES:[0x114]
1000:0076          8be5                           MOV SP,BP
1000:0078          5d                             POP BP
1000:0079          cb                             RETF
FUN_1000_007a:
1000:007a          55                             PUSH BP
1000:007b          8bec                           MOV BP,SP
1000:007d          83ec04                         SUB SP,0x4
1000:0080          8d4606                         LEA AX,[BP + 0x6]
1000:0083          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0086          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0089          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:008d          26c70622015500                 MOV word ptr ES:[0x122],0x55
1000:0094          8e06200f                       MOV ES,word ptr [0xf20]
1000:0098          26a31c01                       MOV ES:[0x11c],AX
1000:009c          8e06220f                       MOV ES,word ptr [0xf22]
1000:00a0          8cd0                           MOV AX,SS
1000:00a2          26a32001                       MOV ES:[0x120],AX
1000:00a6          9a0000000a                     CALLF 0x0000:a000
1000:00ab          8e06240f                       MOV ES,word ptr [0xf24]
1000:00af          26a11401                       MOV AX,ES:[0x114]
1000:00b3          8be5                           MOV SP,BP
1000:00b5          5d                             POP BP
1000:00b6          cb                             RETF
FUN_1000_00b7:
1000:00b7          55                             PUSH BP
1000:00b8          8bec                           MOV BP,SP
1000:00ba          8e06200f                       MOV ES,word ptr [0xf20]
1000:00be          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:00c1          26a31c01                       MOV ES:[0x11c],AX
1000:00c5          8e06220f                       MOV ES,word ptr [0xf22]
1000:00c9          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:00cc          26a32001                       MOV ES:[0x120],AX
1000:00d0          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:00d4          26c70622015100                 MOV word ptr ES:[0x122],0x51
1000:00db          9a0000000a                     CALLF 0x0000:a000
1000:00e0          8e06240f                       MOV ES,word ptr [0xf24]
1000:00e4          26a11401                       MOV AX,ES:[0x114]
1000:00e8          5d                             POP BP
1000:00e9          cb                             RETF
FUN_1000_00ea:
1000:00ea          55                             PUSH BP
1000:00eb          8bec                           MOV BP,SP
1000:00ed          8e06200f                       MOV ES,word ptr [0xf20]
1000:00f1          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:00f4          26a31c01                       MOV ES:[0x11c],AX
1000:00f8          8e06220f                       MOV ES,word ptr [0xf22]
1000:00fc          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:00ff          26a32001                       MOV ES:[0x120],AX
1000:0103          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0107          26c70622015200                 MOV word ptr ES:[0x122],0x52
1000:010e          9a0000000a                     CALLF 0x0000:a000
1000:0113          8e06240f                       MOV ES,word ptr [0xf24]
1000:0117          26a11401                       MOV AX,ES:[0x114]
1000:011b          5d                             POP BP
switchD_1000:99e7::caseD_6:
1000:011c          cb                             RETF
FUN_1000_011d:
1000:011d          55                             PUSH BP
LAB_1000_011e:
1000:011e          8bec                           MOV BP,SP
1000:0120          83ec04                         SUB SP,0x4
1000:0123          8d4606                         LEA AX,[BP + 0x6]
1000:0126          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0129          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:012c          8e06200f                       MOV ES,word ptr [0xf20]
1000:0130          26a31c01                       MOV ES:[0x11c],AX
1000:0134          8e06220f                       MOV ES,word ptr [0xf22]
1000:0138          8cd0                           MOV AX,SS
1000:013a          26a32001                       MOV ES:[0x120],AX
1000:013e          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0142          26c70622015000                 MOV word ptr ES:[0x122],0x50
1000:0149          9a0000000a                     CALLF 0x0000:a000
1000:014e          8e06240f                       MOV ES,word ptr [0xf24]
1000:0152          26a11401                       MOV AX,ES:[0x114]
1000:0156          8be5                           MOV SP,BP
1000:0158          5d                             POP BP
1000:0159          cb                             RETF
FUN_1000_022c:
1000:022c          55                             PUSH BP
1000:022d          8bec                           MOV BP,SP
1000:022f          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0233          26c70622014500                 MOV word ptr ES:[0x122],0x45
1000:023a          8e06200f                       MOV ES,word ptr [0xf20]
1000:023e          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0241          26a31c01                       MOV ES:[0x11c],AX
1000:0245          8e06220f                       MOV ES,word ptr [0xf22]
1000:0249          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:024c          26a32001                       MOV ES:[0x120],AX
1000:0250          9a0000000a                     CALLF 0x0000:a000
1000:0255          8e06240f                       MOV ES,word ptr [0xf24]
1000:0259          26a11401                       MOV AX,ES:[0x114]
1000:025d          5d                             POP BP
1000:025e          cb                             RETF
FUN_1000_025f:
1000:025f          55                             PUSH BP
1000:0260          8bec                           MOV BP,SP
1000:0262          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0266          26c70622014900                 MOV word ptr ES:[0x122],0x49
1000:026d          8e06200f                       MOV ES,word ptr [0xf20]
1000:0271          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0274          26a31c01                       MOV ES:[0x11c],AX
1000:0278          8e06220f                       MOV ES,word ptr [0xf22]
switchD_1000:8905::caseD_d:
1000:027c          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:027f          26a32001                       MOV ES:[0x120],AX
1000:0283          9a0000000a                     CALLF 0x0000:a000
1000:0288          8e06240f                       MOV ES,word ptr [0xf24]
1000:028c          26a11401                       MOV AX,ES:[0x114]
1000:0290          5d                             POP BP
1000:0291          cb                             RETF
FUN_1000_0292:
1000:0292          55                             PUSH BP
1000:0293          8bec                           MOV BP,SP
1000:0295          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0299          26c70622014800                 MOV word ptr ES:[0x122],0x48
1000:02a0          8e06200f                       MOV ES,word ptr [0xf20]
1000:02a4          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:02a7          26a31c01                       MOV ES:[0x11c],AX
1000:02ab          8e06220f                       MOV ES,word ptr [0xf22]
1000:02af          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:02b2          26a32001                       MOV ES:[0x120],AX
1000:02b6          9a0000000a                     CALLF 0x0000:a000
1000:02bb          8e06240f                       MOV ES,word ptr [0xf24]
1000:02bf          26a11401                       MOV AX,ES:[0x114]
1000:02c3          5d                             POP BP
1000:02c4          cb                             RETF
FUN_1000_02c5:
1000:02c5          55                             PUSH BP
1000:02c6          8bec                           MOV BP,SP
1000:02c8          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:02cc          26c70622014e00                 MOV word ptr ES:[0x122],0x4e
1000:02d3          8e06200f                       MOV ES,word ptr [0xf20]
1000:02d7          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:02da          26a31c01                       MOV ES:[0x11c],AX
1000:02de          8e06220f                       MOV ES,word ptr [0xf22]
1000:02e2          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:02e5          26a32001                       MOV ES:[0x120],AX
1000:02e9          9a0000000a                     CALLF 0x0000:a000
1000:02ee          8e06240f                       MOV ES,word ptr [0xf24]
1000:02f2          26a11401                       MOV AX,ES:[0x114]
1000:02f6          5d                             POP BP
1000:02f7          cb                             RETF
FUN_1000_02f8:
1000:02f8          55                             PUSH BP
1000:02f9          8bec                           MOV BP,SP
1000:02fb          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:02ff          26c70622014d00                 MOV word ptr ES:[0x122],0x4d
1000:0306          8e06200f                       MOV ES,word ptr [0xf20]
1000:030a          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:030d          26a31c01                       MOV ES:[0x11c],AX
1000:0311          8e06220f                       MOV ES,word ptr [0xf22]
1000:0315          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0318          26a32001                       MOV ES:[0x120],AX
1000:031c          9a0000000a                     CALLF 0x0000:a000
1000:0321          8e06240f                       MOV ES,word ptr [0xf24]
1000:0325          26a11401                       MOV AX,ES:[0x114]
1000:0329          5d                             POP BP
1000:032a          cb                             RETF
FUN_1000_03a2:
1000:03a2          55                             PUSH BP
1000:03a3          8bec                           MOV BP,SP
1000:03a5          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:03a9          26c70622014200                 MOV word ptr ES:[0x122],0x42
1000:03b0          8e06200f                       MOV ES,word ptr [0xf20]
1000:03b4          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:03b7          26a31c01                       MOV ES:[0x11c],AX
1000:03bb          8e06220f                       MOV ES,word ptr [0xf22]
1000:03bf          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:03c2          26a32001                       MOV ES:[0x120],AX
1000:03c6          9a0000000a                     CALLF 0x0000:a000
1000:03cb          8e06240f                       MOV ES,word ptr [0xf24]
1000:03cf          26a11401                       MOV AX,ES:[0x114]
1000:03d3          5d                             POP BP
1000:03d4          cb                             RETF
FUN_1000_03d5:
1000:03d5          55                             PUSH BP
1000:03d6          8bec                           MOV BP,SP
1000:03d8          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:03db          a24600                         MOV [0x46],AL
1000:03de          5d                             POP BP
1000:03df          cb                             RETF
FUN_1000_03e0:
1000:03e0          55                             PUSH BP
1000:03e1          8bec                           MOV BP,SP
1000:03e3          83ec02                         SUB SP,0x2
1000:03e6          0e                             PUSH CS
1000:03e7          e80402                         CALL 0x1000:05ee
1000:03ea          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:03ed          803e430000                     CMP byte ptr [0x43],0x0
1000:03f2          750a                           JNZ 0x1000:03fe
1000:03f4          c45e06                         LES BX,[BP + 0x6]
1000:03f7          26c60700                       MOV byte ptr ES:[BX],0x0
1000:03fb          e99800                         JMP 0x1000:0496
LAB_1000_03fe:
1000:03fe          8a1e4300                       MOV BL,byte ptr [0x43]
1000:0402          2aff                           SUB BH,BH
1000:0404          8e06280f                       MOV ES,word ptr [0xf28]
1000:0408          268a87ca02                     MOV AL,byte ptr ES:[BX + 0x2ca]
1000:040d          c45e06                         LES BX,[BP + 0x6]
1000:0410          268807                         MOV byte ptr ES:[BX],AL
1000:0413          8a1e4300                       MOV BL,byte ptr [0x43]
1000:0417          2aff                           SUB BH,BH
1000:0419          8e062a0f                       MOV ES,word ptr [0xf2a]
1000:041d          268a871600                     MOV AL,byte ptr ES:[BX + 0x16]
1000:0422          c45e06                         LES BX,[BP + 0x6]
1000:0425          26884706                       MOV byte ptr ES:[BX + 0x6],AL
1000:0429          8a1e4300                       MOV BL,byte ptr [0x43]
1000:042d          2aff                           SUB BH,BH
1000:042f          8e062c0f                       MOV ES,word ptr [0xf2c]
1000:0433          268a878a02                     MOV AL,byte ptr ES:[BX + 0x28a]
1000:0438          c45e06                         LES BX,[BP + 0x6]
1000:043b          26884707                       MOV byte ptr ES:[BX + 0x7],AL
1000:043f          8a1e4300                       MOV BL,byte ptr [0x43]
1000:0443          2aff                           SUB BH,BH
1000:0445          d1e3                           SHL BX,0x1
1000:0447          8e062e0f                       MOV ES,word ptr [0xf2e]
1000:044b          268b877a01                     MOV AX,word ptr ES:[BX + 0x17a]
1000:0450          c45e06                         LES BX,[BP + 0x6]
1000:0453          26894702                       MOV word ptr ES:[BX + 0x2],AX
1000:0457          8a1e4300                       MOV BL,byte ptr [0x43]
1000:045b          2aff                           SUB BH,BH
1000:045d          d1e3                           SHL BX,0x1
1000:045f          8e06300f                       MOV ES,word ptr [0xf30]
1000:0463          268b87fc01                     MOV AX,word ptr ES:[BX + 0x1fc]
1000:0468          c45e06                         LES BX,[BP + 0x6]
1000:046b          26894704                       MOV word ptr ES:[BX + 0x4],AX
1000:046f          8a1e4300                       MOV BL,byte ptr [0x43]
1000:0473          2aff                           SUB BH,BH
1000:0475          d1e3                           SHL BX,0x1
1000:0477          d1e3                           SHL BX,0x1
1000:0479          8e06320f                       MOV ES,word ptr [0xf32]
1000:047d          268b876400                     MOV AX,word ptr ES:[BX + 0x64]
1000:0482          268b976600                     MOV DX,word ptr ES:[BX + 0x66]
1000:0487          c45e06                         LES BX,[BP + 0x6]
1000:048a          26894708                       MOV word ptr ES:[BX + 0x8],AX
1000:048e          2689570a                       MOV word ptr ES:[BX + 0xa],DX
1000:0492          fe0e4300                       DEC byte ptr [0x43]
LAB_1000_0496:
1000:0496          8be5                           MOV SP,BP
1000:0498          5d                             POP BP
1000:0499          cb                             RETF
FUN_1000_049a:
1000:049a          55                             PUSH BP
1000:049b          8bec                           MOV BP,SP
1000:049d          83ec02                         SUB SP,0x2
1000:04a0          0e                             PUSH CS
1000:04a1          e84a01                         CALL 0x1000:05ee
1000:04a4          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:04a7          803e430000                     CMP byte ptr [0x43],0x0
1000:04ac          7509                           JNZ 0x1000:04b7
1000:04ae          c45e06                         LES BX,[BP + 0x6]
1000:04b1          26c60700                       MOV byte ptr ES:[BX],0x0
1000:04b5          eb71                           JMP 0x1000:0528
LAB_1000_04b7:
1000:04b7          8a1e4300                       MOV BL,byte ptr [0x43]
1000:04bb          2aff                           SUB BH,BH
1000:04bd          8e06280f                       MOV ES,word ptr [0xf28]
1000:04c1          268a87ca02                     MOV AL,byte ptr ES:[BX + 0x2ca]
1000:04c6          c45e06                         LES BX,[BP + 0x6]
1000:04c9          268807                         MOV byte ptr ES:[BX],AL
1000:04cc          8a1e4300                       MOV BL,byte ptr [0x43]
1000:04d0          2aff                           SUB BH,BH
1000:04d2          8e062a0f                       MOV ES,word ptr [0xf2a]
1000:04d6          268a871600                     MOV AL,byte ptr ES:[BX + 0x16]
1000:04db          c45e06                         LES BX,[BP + 0x6]
1000:04de          26884706                       MOV byte ptr ES:[BX + 0x6],AL
1000:04e2          8a1e4300                       MOV BL,byte ptr [0x43]
1000:04e6          2aff                           SUB BH,BH
1000:04e8          8e062c0f                       MOV ES,word ptr [0xf2c]
1000:04ec          268a878a02                     MOV AL,byte ptr ES:[BX + 0x28a]
1000:04f1          c45e06                         LES BX,[BP + 0x6]
1000:04f4          26884707                       MOV byte ptr ES:[BX + 0x7],AL
1000:04f8          8a1e4300                       MOV BL,byte ptr [0x43]
1000:04fc          2aff                           SUB BH,BH
1000:04fe          d1e3                           SHL BX,0x1
1000:0500          8e062e0f                       MOV ES,word ptr [0xf2e]
1000:0504          268b877a01                     MOV AX,word ptr ES:[BX + 0x17a]
1000:0509          c45e06                         LES BX,[BP + 0x6]
1000:050c          26894702                       MOV word ptr ES:[BX + 0x2],AX
1000:0510          8a1e4300                       MOV BL,byte ptr [0x43]
1000:0514          2aff                           SUB BH,BH
1000:0516          d1e3                           SHL BX,0x1
1000:0518          8e06300f                       MOV ES,word ptr [0xf30]
1000:051c          268b87fc01                     MOV AX,word ptr ES:[BX + 0x1fc]
1000:0521          c45e06                         LES BX,[BP + 0x6]
1000:0524          26894704                       MOV word ptr ES:[BX + 0x4],AX
LAB_1000_0528:
1000:0528          8a1e4300                       MOV BL,byte ptr [0x43]
1000:052c          2aff                           SUB BH,BH
1000:052e          d1e3                           SHL BX,0x1
1000:0530          d1e3                           SHL BX,0x1
1000:0532          8e06320f                       MOV ES,word ptr [0xf32]
1000:0536          268b876400                     MOV AX,word ptr ES:[BX + 0x64]
1000:053b          268b976600                     MOV DX,word ptr ES:[BX + 0x66]
1000:0540          c45e06                         LES BX,[BP + 0x6]
1000:0543          26894708                       MOV word ptr ES:[BX + 0x8],AX
1000:0547          2689570a                       MOV word ptr ES:[BX + 0xa],DX
1000:054b          8be5                           MOV SP,BP
1000:054d          5d                             POP BP
1000:054e          cb                             RETF
FUN_1000_054f:
1000:054f          55                             PUSH BP
1000:0550          8bec                           MOV BP,SP
1000:0552          57                             PUSH DI
1000:0553          56                             PUSH SI
1000:0554          fe064300                       INC byte ptr [0x43]
1000:0558          a04300                         MOV AL,[0x43]
1000:055b          2ae4                           SUB AH,AH
1000:055d          8bf0                           MOV SI,AX
1000:055f          c45e06                         LES BX,[BP + 0x6]
1000:0562          268a07                         MOV AL,byte ptr ES:[BX]
1000:0565          8e06280f                       MOV ES,word ptr [0xf28]
1000:0569          268884ca02                     MOV byte ptr ES:[SI + 0x2ca],AL
1000:056e          c45e06                         LES BX,[BP + 0x6]
1000:0571          268a4706                       MOV AL,byte ptr ES:[BX + 0x6]
1000:0575          8e062a0f                       MOV ES,word ptr [0xf2a]
1000:0579          2688841600                     MOV byte ptr ES:[SI + 0x16],AL
1000:057e          c45e06                         LES BX,[BP + 0x6]
1000:0581          268a4707                       MOV AL,byte ptr ES:[BX + 0x7]
1000:0585          8e062c0f                       MOV ES,word ptr [0xf2c]
1000:0589          2688848a02                     MOV byte ptr ES:[SI + 0x28a],AL
1000:058e          8bfe                           MOV DI,SI
1000:0590          d1e7                           SHL DI,0x1
1000:0592          c45e06                         LES BX,[BP + 0x6]
1000:0595          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:0599          8e062e0f                       MOV ES,word ptr [0xf2e]
1000:059d          2689857a01                     MOV word ptr ES:[DI + 0x17a],AX
1000:05a2          c45e06                         LES BX,[BP + 0x6]
1000:05a5          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:05a9          8e06300f                       MOV ES,word ptr [0xf30]
1000:05ad          268985fc01                     MOV word ptr ES:[DI + 0x1fc],AX
1000:05b2          c45e06                         LES BX,[BP + 0x6]
1000:05b5          268b4708                       MOV AX,word ptr ES:[BX + 0x8]
1000:05b9          268b570a                       MOV DX,word ptr ES:[BX + 0xa]
1000:05bd          8bde                           MOV BX,SI
1000:05bf          d1e3                           SHL BX,0x1
1000:05c1          d1e3                           SHL BX,0x1
1000:05c3          8e06320f                       MOV ES,word ptr [0xf32]
1000:05c7          2689876400                     MOV word ptr ES:[BX + 0x64],AX
1000:05cc          2689976600                     MOV word ptr ES:[BX + 0x66],DX
1000:05d1          5e                             POP SI
1000:05d2          5f                             POP DI
1000:05d3          5d                             POP BP
1000:05d4          cb                             RETF
FUN_1000_05d5:
1000:05d5          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:05d9          26c70622014b00                 MOV word ptr ES:[0x122],0x4b
1000:05e0          9a0000000a                     CALLF 0x0000:a000
1000:05e5          8e06240f                       MOV ES,word ptr [0xf24]
1000:05e9          26a11401                       MOV AX,ES:[0x114]
1000:05ed          cb                             RETF
FUN_1000_05ee:
1000:05ee          55                             PUSH BP
1000:05ef          8bec                           MOV BP,SP
1000:05f1          83ec02                         SUB SP,0x2
1000:05f4          57                             PUSH DI
1000:05f5          56                             PUSH SI
1000:05f6          803e420000                     CMP byte ptr [0x42],0x0
1000:05fb          7407                           JZ 0x1000:0604
1000:05fd          9a3219aa05                     CALLF 0x0000:73d2
1000:0602          eb04                           JMP 0x1000:0608
LAB_1000_0604:
1000:0604          0e                             PUSH CS
1000:0605          e8cdff                         CALL 0x1000:05d5
LAB_1000_0608:
1000:0608          8946fe                         MOV word ptr [BP + -0x2],AX
1000:060b          0bc0                           OR AX,AX
1000:060d          7503                           JNZ 0x1000:0612
1000:060f          e98800                         JMP 0x1000:069a
LAB_1000_0612:
1000:0612          fe064300                       INC byte ptr [0x43]
1000:0616          803e430040                     CMP byte ptr [0x43],0x40
1000:061b          7505                           JNZ 0x1000:0622
1000:061d          c606430001                     MOV byte ptr [0x43],0x1
LAB_1000_0622:
1000:0622          8e06260f                       MOV ES,word ptr [0xf26]
1000:0626          26c6067d0200                   MOV byte ptr ES:[0x27d],0x0
1000:062c          b87c02                         MOV AX,0x27c
switchD_1000:8905::switchdataD_1000:062f:
1000:062f          baef13                         MOV DX,0x13ef
1000:0632          52                             PUSH DX
1000:0633          50                             PUSH AX
1000:0634          52                             PUSH DX
1000:0635          50                             PUSH AX
1000:0636          b81600                         MOV AX,0x16
1000:0639          50                             PUSH AX
1000:063a          9a5e19aa05                     CALLF 0x0000:73fe
1000:063f          83c40a                         ADD SP,0xa
1000:0642          8e06260f                       MOV ES,word ptr [0xf26]
1000:0646          26803e7c0200                   CMP byte ptr ES:[0x27c],0x0
1000:064c          7528                           JNZ 0x1000:0676
1000:064e          a04300                         MOV AL,[0x43]
1000:0651          2ae4                           SUB AH,AH
1000:0653          8bf0                           MOV SI,AX
1000:0655          26a07d02                       MOV AL,ES:[0x27d]
1000:0659          8e062c0f                       MOV ES,word ptr [0xf2c]
1000:065d          2688848a02                     MOV byte ptr ES:[SI + 0x28a],AL
1000:0662          8e06280f                       MOV ES,word ptr [0xf28]
1000:0666          26c684ca0205                   MOV byte ptr ES:[SI + 0x2ca],0x5
LAB_1000_066c:
1000:066c          0e                             PUSH CS
1000:066d          e8f701                         CALL 0x1000:0867
LAB_1000_0670:
1000:0670          b80100                         MOV AX,0x1
1000:0673          e9eb01                         JMP 0x1000:0861
LAB_1000_0676:
1000:0676          a04300                         MOV AL,[0x43]
1000:0679          2ae4                           SUB AH,AH
1000:067b          8bf0                           MOV SI,AX
1000:067d          8e06260f                       MOV ES,word ptr [0xf26]
1000:0681          26a07c02                       MOV AL,ES:[0x27c]
1000:0685          8e062a0f                       MOV ES,word ptr [0xf2a]
1000:0689          2688841600                     MOV byte ptr ES:[SI + 0x16],AL
switchD_1000:96f1::caseD_2:
1000:068e          8e06280f                       MOV ES,word ptr [0xf28]
1000:0692          26c684ca0203                   MOV byte ptr ES:[SI + 0x2ca],0x3
1000:0698          ebd2                           JMP 0x1000:066c
LAB_1000_069a:
1000:069a          8e06260f                       MOV ES,word ptr [0xf26]
1000:069e          26c7067c020300                 MOV word ptr ES:[0x27c],0x3
1000:06a5          26c7067e020000                 MOV word ptr ES:[0x27e],0x0
1000:06ac          b87c02                         MOV AX,0x27c
1000:06af          baef13                         MOV DX,0x13ef
LAB_1000_06b2:
1000:06b2          52                             PUSH DX
1000:06b3          50                             PUSH AX
1000:06b4          52                             PUSH DX
1000:06b5          50                             PUSH AX
1000:06b6          b83300                         MOV AX,0x33
1000:06b9          50                             PUSH AX
1000:06ba          9a5e19aa05                     CALLF 0x0000:73fe
1000:06bf          83c40a                         ADD SP,0xa
1000:06c2          8e06260f                       MOV ES,word ptr [0xf26]
1000:06c6          2683267e0201                   AND word ptr ES:[0x27e],0x1
1000:06cc          803e450000                     CMP byte ptr [0x45],0x0
1000:06d1          755d                           JNZ 0x1000:0730
1000:06d3          26833e7e0200                   CMP word ptr ES:[0x27e],0x0
1000:06d9          7455                           JZ 0x1000:0730
1000:06db          fe064300                       INC byte ptr [0x43]
1000:06df          803e430040                     CMP byte ptr [0x43],0x40
1000:06e4          7505                           JNZ 0x1000:06eb
1000:06e6          c606430001                     MOV byte ptr [0x43],0x1
LAB_1000_06eb:
1000:06eb          a04300                         MOV AL,[0x43]
1000:06ee          2ae4                           SUB AH,AH
1000:06f0          8bf0                           MOV SI,AX
1000:06f2          d1e6                           SHL SI,0x1
1000:06f4          26a18002                       MOV AX,ES:[0x280]
1000:06f8          d1e8                           SHR AX,0x1
1000:06fa          8e062e0f                       MOV ES,word ptr [0xf2e]
1000:06fe          2689847a01                     MOV word ptr ES:[SI + 0x17a],AX
1000:0703          8e06260f                       MOV ES,word ptr [0xf26]
1000:0707          26a18202                       MOV AX,ES:[0x282]
1000:070b          8e06300f                       MOV ES,word ptr [0xf30]
1000:070f          268984fc01                     MOV word ptr ES:[SI + 0x1fc],AX
1000:0714          c606450001                     MOV byte ptr [0x45],0x1
1000:0719          0e                             PUSH CS
1000:071a          e84a01                         CALL 0x1000:0867
1000:071d          8a1e4300                       MOV BL,byte ptr [0x43]
1000:0721          2aff                           SUB BH,BH
1000:0723          8e06280f                       MOV ES,word ptr [0xf28]
1000:0727          26c687ca0201                   MOV byte ptr ES:[BX + 0x2ca],0x1
1000:072d          e940ff                         JMP 0x1000:0670
LAB_1000_0730:
1000:0730          8e06260f                       MOV ES,word ptr [0xf26]
1000:0734          26833e7e0200                   CMP word ptr ES:[0x27e],0x0
1000:073a          7503                           JNZ 0x1000:073f
1000:073c          e9a100                         JMP 0x1000:07e0
LAB_1000_073f:
1000:073f          803e450000                     CMP byte ptr [0x45],0x0
1000:0744          7503                           JNZ 0x1000:0749
1000:0746          e99700                         JMP 0x1000:07e0
LAB_1000_0749:
1000:0749          26a18002                       MOV AX,ES:[0x280]
1000:074d          d1e8                           SHR AX,0x1
1000:074f          8e06340f                       MOV ES,word ptr [0xf34]
1000:0753          263b066200                     CMP AX,word ptr ES:[0x62]
1000:0758          7518                           JNZ 0x1000:0772
1000:075a          8e06360f                       MOV ES,word ptr [0xf36]
1000:075e          26a16601                       MOV AX,ES:[0x166]
1000:0762          8e06260f                       MOV ES,word ptr [0xf26]
1000:0766          2639068202                     CMP word ptr ES:[0x282],AX
1000:076b          7505                           JNZ 0x1000:0772
LAB_1000_076d:
1000:076d          2bc0                           SUB AX,AX
1000:076f          e9ef00                         JMP 0x1000:0861
LAB_1000_0772:
1000:0772          fe064300                       INC byte ptr [0x43]
1000:0776          803e430040                     CMP byte ptr [0x43],0x40
1000:077b          7505                           JNZ 0x1000:0782
1000:077d          c606430001                     MOV byte ptr [0x43],0x1
LAB_1000_0782:
1000:0782          8e06260f                       MOV ES,word ptr [0xf26]
1000:0786          268b368002                     MOV SI,word ptr ES:[0x280]
1000:078b          d1ee                           SHR SI,0x1
1000:078d          a04300                         MOV AL,[0x43]
1000:0790          2ae4                           SUB AH,AH
1000:0792          8bf8                           MOV DI,AX
1000:0794          d1e7                           SHL DI,0x1
1000:0796          8e062e0f                       MOV ES,word ptr [0xf2e]
1000:079a          2689b57a01                     MOV word ptr ES:[DI + 0x17a],SI
1000:079f          8e06260f                       MOV ES,word ptr [0xf26]
1000:07a3          26a18202                       MOV AX,ES:[0x282]
1000:07a7          8e06300f                       MOV ES,word ptr [0xf30]
1000:07ab          268985fc01                     MOV word ptr ES:[DI + 0x1fc],AX
1000:07b0          8e06340f                       MOV ES,word ptr [0xf34]
1000:07b4          2689366200                     MOV word ptr ES:[0x62],SI
1000:07b9          8e06260f                       MOV ES,word ptr [0xf26]
1000:07bd          26a18202                       MOV AX,ES:[0x282]
1000:07c1          8e06360f                       MOV ES,word ptr [0xf36]
1000:07c5          26a36601                       MOV ES:[0x166],AX
1000:07c9          0e                             PUSH CS
1000:07ca          e89a00                         CALL 0x1000:0867
1000:07cd          8a1e4300                       MOV BL,byte ptr [0x43]
1000:07d1          2aff                           SUB BH,BH
1000:07d3          8e06280f                       MOV ES,word ptr [0xf28]
1000:07d7          26c687ca0204                   MOV byte ptr ES:[BX + 0x2ca],0x4
1000:07dd          e990fe                         JMP 0x1000:0670
LAB_1000_07e0:
1000:07e0          8e06260f                       MOV ES,word ptr [0xf26]
1000:07e4          26833e7e0200                   CMP word ptr ES:[0x27e],0x0
1000:07ea          7581                           JNZ 0x1000:076d
1000:07ec          803e450000                     CMP byte ptr [0x45],0x0
1000:07f1          7503                           JNZ 0x1000:07f6
1000:07f3          e977ff                         JMP 0x1000:076d
LAB_1000_07f6:
1000:07f6          fe064300                       INC byte ptr [0x43]
1000:07fa          803e430040                     CMP byte ptr [0x43],0x40
1000:07ff          7505                           JNZ 0x1000:0806
1000:0801          c606430001                     MOV byte ptr [0x43],0x1
LAB_1000_0806:
1000:0806          a04300                         MOV AL,[0x43]
1000:0809          2ae4                           SUB AH,AH
1000:080b          8bf0                           MOV SI,AX
1000:080d          d1e6                           SHL SI,0x1
1000:080f          26a18002                       MOV AX,ES:[0x280]
1000:0813          d1e8                           SHR AX,0x1
1000:0815          8e062e0f                       MOV ES,word ptr [0xf2e]
1000:0819          2689847a01                     MOV word ptr ES:[SI + 0x17a],AX
1000:081e          8e06260f                       MOV ES,word ptr [0xf26]
1000:0822          26a18202                       MOV AX,ES:[0x282]
1000:0826          8e06300f                       MOV ES,word ptr [0xf30]
1000:082a          268984fc01                     MOV word ptr ES:[SI + 0x1fc],AX
1000:082f          8e06340f                       MOV ES,word ptr [0xf34]
1000:0833          26c7066200e803                 MOV word ptr ES:[0x62],0x3e8
1000:083a          8e06360f                       MOV ES,word ptr [0xf36]
1000:083e          26c7066601e803                 MOV word ptr ES:[0x166],0x3e8
1000:0845          0e                             PUSH CS
1000:0846          e81e00                         CALL 0x1000:0867
1000:0849          c606450000                     MOV byte ptr [0x45],0x0
1000:084e          8a1e4300                       MOV BL,byte ptr [0x43]
1000:0852          2aff                           SUB BH,BH
1000:0854          8e06280f                       MOV ES,word ptr [0xf28]
1000:0858          26c687ca0202                   MOV byte ptr ES:[BX + 0x2ca],0x2
1000:085e          e90ffe                         JMP 0x1000:0670
LAB_1000_0861:
1000:0861          5e                             POP SI
1000:0862          5f                             POP DI
1000:0863          8be5                           MOV SP,BP
1000:0865          5d                             POP BP
1000:0866          cb                             RETF
FUN_1000_0867:
1000:0867          55                             PUSH BP
1000:0868          8bec                           MOV BP,SP
1000:086a          83ec04                         SUB SP,0x4
1000:086d          803e460000                     CMP byte ptr [0x46],0x0
1000:0872          7430                           JZ 0x1000:08a4
1000:0874          c746fc6c04                     MOV word ptr [BP + -0x4],0x46c
1000:0879          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:087e          2bdb                           SUB BX,BX
1000:0880          8ec3                           MOV BX,ES
1000:0882          bb6c04                         MOV BX,0x46c
1000:0885          268b07                         MOV AX,word ptr ES:[BX]
1000:0888          268b5702                       MOV DX,word ptr ES:[BX + 0x2]
1000:088c          8a1e4300                       MOV BL,byte ptr [0x43]
1000:0890          2aff                           SUB BH,BH
1000:0892          d1e3                           SHL BX,0x1
1000:0894          d1e3                           SHL BX,0x1
1000:0896          8e06320f                       MOV ES,word ptr [0xf32]
1000:089a          2689876400                     MOV word ptr ES:[BX + 0x64],AX
1000:089f          2689976600                     MOV word ptr ES:[BX + 0x66],DX
LAB_1000_08a4:
1000:08a4          8be5                           MOV SP,BP
1000:08a6          5d                             POP BP
1000:08a7          cb                             RETF
FUN_1000_08a8:
1000:08a8          55                             PUSH BP
1000:08a9          8bec                           MOV BP,SP
1000:08ab          83ec04                         SUB SP,0x4
1000:08ae          c746fc6c04                     MOV word ptr [BP + -0x4],0x46c
1000:08b3          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:08b8          2bdb                           SUB BX,BX
1000:08ba          8ec3                           MOV BX,ES
1000:08bc          bb6c04                         MOV BX,0x46c
1000:08bf          268b07                         MOV AX,word ptr ES:[BX]
1000:08c2          268b5702                       MOV DX,word ptr ES:[BX + 0x2]
1000:08c6          8be5                           MOV SP,BP
1000:08c8          5d                             POP BP
1000:08c9          cb                             RETF
FUN_1000_08ca:
1000:08ca          55                             PUSH BP
1000:08cb          8bec                           MOV BP,SP
1000:08cd          83ec0e                         SUB SP,0xe
1000:08d0          56                             PUSH SI
1000:08d1          c746fe0000                     MOV word ptr [BP + -0x2],0x0
LAB_1000_08d6:
1000:08d6          8d46f2                         LEA AX,[BP + -0xe]
1000:08d9          16                             PUSH SS
1000:08da          50                             PUSH AX
1000:08db          0e                             PUSH CS
1000:08dc          e801fb                         CALL 0x1000:03e0
1000:08df          83c404                         ADD SP,0x4
1000:08e2          ff46fe                         INC word ptr [BP + -0x2]
1000:08e5          837efe14                       CMP word ptr [BP + -0x2],0x14
1000:08e9          7ceb                           JL 0x1000:08d6
1000:08eb          c746fe0000                     MOV word ptr [BP + -0x2],0x0
LAB_1000_08f0:
1000:08f0          8b76fe                         MOV SI,word ptr [BP + -0x2]
1000:08f3          d1e6                           SHL SI,0x1
1000:08f5          8e062e0f                       MOV ES,word ptr [0xf2e]
1000:08f9          26c7847a010000                 MOV word ptr ES:[SI + 0x17a],0x0
1000:0900          8e06300f                       MOV ES,word ptr [0xf30]
1000:0904          26c784fc010000                 MOV word ptr ES:[SI + 0x1fc],0x0
1000:090b          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:090e          8e062a0f                       MOV ES,word ptr [0xf2a]
1000:0912          26c687160000                   MOV byte ptr ES:[BX + 0x16],0x0
1000:0918          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:091b          8e062c0f                       MOV ES,word ptr [0xf2c]
1000:091f          26c6878a0200                   MOV byte ptr ES:[BX + 0x28a],0x0
1000:0925          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:0928          d1e3                           SHL BX,0x1
1000:092a          d1e3                           SHL BX,0x1
1000:092c          8e06320f                       MOV ES,word ptr [0xf32]
1000:0930          2bc0                           SUB AX,AX
1000:0932          2689876600                     MOV word ptr ES:[BX + 0x66],AX
1000:0937          2689876400                     MOV word ptr ES:[BX + 0x64],AX
1000:093c          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:093f          8e06280f                       MOV ES,word ptr [0xf28]
1000:0943          26c687ca0200                   MOV byte ptr ES:[BX + 0x2ca],0x0
1000:0949          c606430000                     MOV byte ptr [0x43],0x0
1000:094e          c606440000                     MOV byte ptr [0x44],0x0
1000:0953          c606450000                     MOV byte ptr [0x45],0x0
1000:0958          ff46fe                         INC word ptr [BP + -0x2]
1000:095b          837efe40                       CMP word ptr [BP + -0x2],0x40
1000:095f          7c8f                           JL 0x1000:08f0
1000:0961          5e                             POP SI
1000:0962          8be5                           MOV SP,BP
1000:0964          5d                             POP BP
1000:0965          cb                             RETF
FUN_1000_0966:
1000:0966          55                             PUSH BP
1000:0967          8bec                           MOV BP,SP
1000:0969          83ec04                         SUB SP,0x4
1000:096c          8d4606                         LEA AX,[BP + 0x6]
1000:096f          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0972          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0975          8e06200f                       MOV ES,word ptr [0xf20]
1000:0979          26a31c01                       MOV ES:[0x11c],AX
1000:097d          8e06220f                       MOV ES,word ptr [0xf22]
1000:0981          8cd0                           MOV AX,SS
1000:0983          26a32001                       MOV ES:[0x120],AX
1000:0987          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:098b          26c70622010100                 MOV word ptr ES:[0x122],0x1
1000:0992          9a0000000a                     CALLF 0x0000:a000
1000:0997          8e06240f                       MOV ES,word ptr [0xf24]
1000:099b          26a11401                       MOV AX,ES:[0x114]
1000:099f          8be5                           MOV SP,BP
1000:09a1          5d                             POP BP
1000:09a2          cb                             RETF
FUN_1000_09a3:
1000:09a3          55                             PUSH BP
1000:09a4          8bec                           MOV BP,SP
1000:09a6          c45e06                         LES BX,[BP + 0x6]
1000:09a9          26c7070000                     MOV word ptr ES:[BX],0x0
1000:09ae          c45e06                         LES BX,[BP + 0x6]
1000:09b1          26c747020000                   MOV word ptr ES:[BX + 0x2],0x0
1000:09b7          c45e06                         LES BX,[BP + 0x6]
1000:09ba          26c747040000                   MOV word ptr ES:[BX + 0x4],0x0
1000:09c0          c45e06                         LES BX,[BP + 0x6]
1000:09c3          26c6470680                     MOV byte ptr ES:[BX + 0x6],0x80
1000:09c8          c45e06                         LES BX,[BP + 0x6]
1000:09cb          26c747080000                   MOV word ptr ES:[BX + 0x8],0x0
1000:09d1          c45e06                         LES BX,[BP + 0x6]
1000:09d4          26c7470c3f01                   MOV word ptr ES:[BX + 0xc],0x13f
1000:09da          c45e06                         LES BX,[BP + 0x6]
1000:09dd          26c7470a0000                   MOV word ptr ES:[BX + 0xa],0x0
1000:09e3          c45e06                         LES BX,[BP + 0x6]
1000:09e6          26c7470ec700                   MOV word ptr ES:[BX + 0xe],0xc7
1000:09ec          c45e06                         LES BX,[BP + 0x6]
1000:09ef          26c64710ff                     MOV byte ptr ES:[BX + 0x10],0xff
1000:09f4          c45e06                         LES BX,[BP + 0x6]
1000:09f7          26c64711ff                     MOV byte ptr ES:[BX + 0x11],0xff
1000:09fc          c45e06                         LES BX,[BP + 0x6]
1000:09ff          26c64712ff                     MOV byte ptr ES:[BX + 0x12],0xff
1000:0a04          c45e06                         LES BX,[BP + 0x6]
1000:0a07          26c64713ff                     MOV byte ptr ES:[BX + 0x13],0xff
1000:0a0c          c45e06                         LES BX,[BP + 0x6]
1000:0a0f          26c64714ff                     MOV byte ptr ES:[BX + 0x14],0xff
1000:0a14          c45e06                         LES BX,[BP + 0x6]
1000:0a17          26c64715ff                     MOV byte ptr ES:[BX + 0x15],0xff
1000:0a1c          c45e06                         LES BX,[BP + 0x6]
1000:0a1f          26c64716ff                     MOV byte ptr ES:[BX + 0x16],0xff
1000:0a24          c45e06                         LES BX,[BP + 0x6]
1000:0a27          26c64717ff                     MOV byte ptr ES:[BX + 0x17],0xff
1000:0a2c          c45e06                         LES BX,[BP + 0x6]
1000:0a2f          26c7471a0000                   MOV word ptr ES:[BX + 0x1a],0x0
1000:0a35          c45e06                         LES BX,[BP + 0x6]
1000:0a38          26c7471c0000                   MOV word ptr ES:[BX + 0x1c],0x0
1000:0a3e          c45e06                         LES BX,[BP + 0x6]
1000:0a41          26c6471e01                     MOV byte ptr ES:[BX + 0x1e],0x1
1000:0a46          c45e06                         LES BX,[BP + 0x6]
1000:0a49          26c6471f01                     MOV byte ptr ES:[BX + 0x1f],0x1
1000:0a4e          c45e06                         LES BX,[BP + 0x6]
1000:0a51          26c6472000                     MOV byte ptr ES:[BX + 0x20],0x0
1000:0a56          c45e06                         LES BX,[BP + 0x6]
1000:0a59          26c64721ff                     MOV byte ptr ES:[BX + 0x21],0xff
1000:0a5e          5d                             POP BP
1000:0a5f          cb                             RETF
FUN_1000_0a60:
1000:0a60          55                             PUSH BP
1000:0a61          8bec                           MOV BP,SP
1000:0a63          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0a67          26c70622011900                 MOV word ptr ES:[0x122],0x19
1000:0a6e          8e06200f                       MOV ES,word ptr [0xf20]
1000:0a72          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0a75          26a31c01                       MOV ES:[0x11c],AX
1000:0a79          8e06220f                       MOV ES,word ptr [0xf22]
1000:0a7d          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0a80          26a32001                       MOV ES:[0x120],AX
1000:0a84          9a0000000a                     CALLF 0x0000:a000
1000:0a89          8e06240f                       MOV ES,word ptr [0xf24]
1000:0a8d          26a11401                       MOV AX,ES:[0x114]
1000:0a91          5d                             POP BP
1000:0a92          cb                             RETF
FUN_1000_0a93:
1000:0a93          55                             PUSH BP
1000:0a94          8bec                           MOV BP,SP
1000:0a96          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0a9a          26c70622013d00                 MOV word ptr ES:[0x122],0x3d
1000:0aa1          8e06200f                       MOV ES,word ptr [0xf20]
1000:0aa5          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0aa8          26a31c01                       MOV ES:[0x11c],AX
1000:0aac          8e06220f                       MOV ES,word ptr [0xf22]
1000:0ab0          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0ab3          26a32001                       MOV ES:[0x120],AX
1000:0ab7          9a0000000a                     CALLF 0x0000:a000
1000:0abc          8e06240f                       MOV ES,word ptr [0xf24]
1000:0ac0          26a11401                       MOV AX,ES:[0x114]
1000:0ac4          5d                             POP BP
1000:0ac5          cb                             RETF
FUN_1000_0ac6:
1000:0ac6          55                             PUSH BP
1000:0ac7          8bec                           MOV BP,SP
1000:0ac9          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0acd          26c70622014600                 MOV word ptr ES:[0x122],0x46
1000:0ad4          8e06200f                       MOV ES,word ptr [0xf20]
1000:0ad8          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0adb          26a31c01                       MOV ES:[0x11c],AX
1000:0adf          8e06220f                       MOV ES,word ptr [0xf22]
1000:0ae3          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0ae6          26a32001                       MOV ES:[0x120],AX
1000:0aea          9a0000000a                     CALLF 0x0000:a000
1000:0aef          8e06240f                       MOV ES,word ptr [0xf24]
1000:0af3          26a11401                       MOV AX,ES:[0x114]
1000:0af7          5d                             POP BP
1000:0af8          cb                             RETF
FUN_1000_0af9:
1000:0af9          55                             PUSH BP
1000:0afa          8bec                           MOV BP,SP
1000:0afc          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0b00          26c70622013e00                 MOV word ptr ES:[0x122],0x3e
1000:0b07          8e06200f                       MOV ES,word ptr [0xf20]
1000:0b0b          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0b0e          26a31c01                       MOV ES:[0x11c],AX
1000:0b12          8e06220f                       MOV ES,word ptr [0xf22]
1000:0b16          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0b19          26a32001                       MOV ES:[0x120],AX
1000:0b1d          9a0000000a                     CALLF 0x0000:a000
1000:0b22          8e06240f                       MOV ES,word ptr [0xf24]
1000:0b26          26a11401                       MOV AX,ES:[0x114]
1000:0b2a          5d                             POP BP
1000:0b2b          cb                             RETF
FUN_1000_0b2c:
1000:0b2c          55                             PUSH BP
1000:0b2d          8bec                           MOV BP,SP
1000:0b2f          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0b33          26c70622013f00                 MOV word ptr ES:[0x122],0x3f
1000:0b3a          8e06200f                       MOV ES,word ptr [0xf20]
1000:0b3e          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0b41          26a31c01                       MOV ES:[0x11c],AX
1000:0b45          8e06220f                       MOV ES,word ptr [0xf22]
1000:0b49          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0b4c          26a32001                       MOV ES:[0x120],AX
1000:0b50          9a0000000a                     CALLF 0x0000:a000
1000:0b55          8e06240f                       MOV ES,word ptr [0xf24]
1000:0b59          26a11401                       MOV AX,ES:[0x114]
1000:0b5d          5d                             POP BP
1000:0b5e          cb                             RETF
FUN_1000_0b5f:
1000:0b5f          55                             PUSH BP
1000:0b60          8bec                           MOV BP,SP
1000:0b62          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0b66          26c70622011800                 MOV word ptr ES:[0x122],0x18
1000:0b6d          8e06200f                       MOV ES,word ptr [0xf20]
1000:0b71          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0b74          26a31c01                       MOV ES:[0x11c],AX
1000:0b78          8e06220f                       MOV ES,word ptr [0xf22]
1000:0b7c          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0b7f          26a32001                       MOV ES:[0x120],AX
1000:0b83          9a0000000a                     CALLF 0x0000:a000
1000:0b88          8e06240f                       MOV ES,word ptr [0xf24]
1000:0b8c          26a11401                       MOV AX,ES:[0x114]
1000:0b90          5d                             POP BP
1000:0b91          cb                             RETF
FUN_1000_0b92:
1000:0b92          55                             PUSH BP
1000:0b93          8bec                           MOV BP,SP
1000:0b95          83ec08                         SUB SP,0x8
1000:0b98          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0b9b          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0b9e          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0ba1          8946fe                         MOV word ptr [BP + -0x2],AX
1000:0ba4          8d46fc                         LEA AX,[BP + -0x4]
1000:0ba7          8946f8                         MOV word ptr [BP + -0x8],AX
1000:0baa          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:0bad          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0bb1          26c70622010f00                 MOV word ptr ES:[0x122],0xf
1000:0bb8          8e06200f                       MOV ES,word ptr [0xf20]
1000:0bbc          26a31c01                       MOV ES:[0x11c],AX
1000:0bc0          8e06220f                       MOV ES,word ptr [0xf22]
1000:0bc4          8cd0                           MOV AX,SS
1000:0bc6          26a32001                       MOV ES:[0x120],AX
1000:0bca          9a0000000a                     CALLF 0x0000:a000
1000:0bcf          8e06240f                       MOV ES,word ptr [0xf24]
1000:0bd3          26a11401                       MOV AX,ES:[0x114]
1000:0bd7          8be5                           MOV SP,BP
1000:0bd9          5d                             POP BP
1000:0bda          cb                             RETF
FUN_1000_0bdb:
1000:0bdb          55                             PUSH BP
1000:0bdc          8bec                           MOV BP,SP
1000:0bde          83ec08                         SUB SP,0x8
1000:0be1          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0be4          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0be7          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0bea          8946fe                         MOV word ptr [BP + -0x2],AX
1000:0bed          8d46fc                         LEA AX,[BP + -0x4]
1000:0bf0          8946f8                         MOV word ptr [BP + -0x8],AX
1000:0bf3          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:0bf6          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0bfa          26c70622011000                 MOV word ptr ES:[0x122],0x10
1000:0c01          8e06200f                       MOV ES,word ptr [0xf20]
1000:0c05          26a31c01                       MOV ES:[0x11c],AX
1000:0c09          8e06220f                       MOV ES,word ptr [0xf22]
1000:0c0d          8cd0                           MOV AX,SS
1000:0c0f          26a32001                       MOV ES:[0x120],AX
1000:0c13          9a0000000a                     CALLF 0x0000:a000
1000:0c18          8e06240f                       MOV ES,word ptr [0xf24]
1000:0c1c          26a11401                       MOV AX,ES:[0x114]
1000:0c20          8be5                           MOV SP,BP
1000:0c22          5d                             POP BP
1000:0c23          cb                             RETF
FUN_1000_0c24:
1000:0c24          55                             PUSH BP
1000:0c25          8bec                           MOV BP,SP
1000:0c27          83ec04                         SUB SP,0x4
1000:0c2a          8d4606                         LEA AX,[BP + 0x6]
1000:0c2d          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0c30          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0c33          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0c37          26c70622014700                 MOV word ptr ES:[0x122],0x47
1000:0c3e          8e06200f                       MOV ES,word ptr [0xf20]
1000:0c42          26a31c01                       MOV ES:[0x11c],AX
1000:0c46          8e06220f                       MOV ES,word ptr [0xf22]
1000:0c4a          8cd0                           MOV AX,SS
1000:0c4c          26a32001                       MOV ES:[0x120],AX
1000:0c50          9a0000000a                     CALLF 0x0000:a000
1000:0c55          8e06240f                       MOV ES,word ptr [0xf24]
1000:0c59          26a11401                       MOV AX,ES:[0x114]
1000:0c5d          8be5                           MOV SP,BP
1000:0c5f          5d                             POP BP
1000:0c60          cb                             RETF
FUN_1000_0c61:
1000:0c61          55                             PUSH BP
1000:0c62          8bec                           MOV BP,SP
1000:0c64          83ec04                         SUB SP,0x4
1000:0c67          8d4606                         LEA AX,[BP + 0x6]
1000:0c6a          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0c6d          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0c70          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0c74          26c70622013800                 MOV word ptr ES:[0x122],0x38
1000:0c7b          8e06200f                       MOV ES,word ptr [0xf20]
1000:0c7f          26a31c01                       MOV ES:[0x11c],AX
1000:0c83          8e06220f                       MOV ES,word ptr [0xf22]
1000:0c87          8cd0                           MOV AX,SS
1000:0c89          26a32001                       MOV ES:[0x120],AX
1000:0c8d          9a0000000a                     CALLF 0x0000:a000
1000:0c92          8e06240f                       MOV ES,word ptr [0xf24]
1000:0c96          26a11401                       MOV AX,ES:[0x114]
1000:0c9a          8be5                           MOV SP,BP
1000:0c9c          5d                             POP BP
1000:0c9d          cb                             RETF
FUN_1000_0c9e:
1000:0c9e          55                             PUSH BP
1000:0c9f          8bec                           MOV BP,SP
1000:0ca1          83ec04                         SUB SP,0x4
1000:0ca4          8d4606                         LEA AX,[BP + 0x6]
1000:0ca7          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0caa          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0cad          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0cb1          26c70622012f00                 MOV word ptr ES:[0x122],0x2f
1000:0cb8          8e06200f                       MOV ES,word ptr [0xf20]
1000:0cbc          26a31c01                       MOV ES:[0x11c],AX
1000:0cc0          8e06220f                       MOV ES,word ptr [0xf22]
1000:0cc4          8cd0                           MOV AX,SS
1000:0cc6          26a32001                       MOV ES:[0x120],AX
1000:0cca          9a0000000a                     CALLF 0x0000:a000
1000:0ccf          8e06240f                       MOV ES,word ptr [0xf24]
1000:0cd3          26a11401                       MOV AX,ES:[0x114]
1000:0cd7          8be5                           MOV SP,BP
1000:0cd9          5d                             POP BP
1000:0cda          cb                             RETF
FUN_1000_0d3d:
1000:0d3d          55                             PUSH BP
1000:0d3e          8bec                           MOV BP,SP
1000:0d40          83ec04                         SUB SP,0x4
1000:0d43          8d4606                         LEA AX,[BP + 0x6]
1000:0d46          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0d49          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0d4c          8e06200f                       MOV ES,word ptr [0xf20]
1000:0d50          26a31c01                       MOV ES:[0x11c],AX
1000:0d54          8e06220f                       MOV ES,word ptr [0xf22]
1000:0d58          8cd0                           MOV AX,SS
1000:0d5a          26a32001                       MOV ES:[0x120],AX
1000:0d5e          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0d62          26c70622012200                 MOV word ptr ES:[0x122],0x22
1000:0d69          9a0000000a                     CALLF 0x0000:a000
1000:0d6e          8e06240f                       MOV ES,word ptr [0xf24]
1000:0d72          26a11401                       MOV AX,ES:[0x114]
1000:0d76          8be5                           MOV SP,BP
1000:0d78          5d                             POP BP
1000:0d79          cb                             RETF
FUN_1000_0d7a:
1000:0d7a          55                             PUSH BP
1000:0d7b          8bec                           MOV BP,SP
1000:0d7d          83ec08                         SUB SP,0x8
1000:0d80          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0d83          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0d86          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0d89          8946fe                         MOV word ptr [BP + -0x2],AX
1000:0d8c          8d46fc                         LEA AX,[BP + -0x4]
1000:0d8f          8946f8                         MOV word ptr [BP + -0x8],AX
1000:0d92          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:0d95          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0d99          26c70622010e00                 MOV word ptr ES:[0x122],0xe
1000:0da0          8e06200f                       MOV ES,word ptr [0xf20]
1000:0da4          26a31c01                       MOV ES:[0x11c],AX
1000:0da8          8e06220f                       MOV ES,word ptr [0xf22]
1000:0dac          8cd0                           MOV AX,SS
1000:0dae          26a32001                       MOV ES:[0x120],AX
1000:0db2          9a0000000a                     CALLF 0x0000:a000
1000:0db7          8e06240f                       MOV ES,word ptr [0xf24]
1000:0dbb          26a11401                       MOV AX,ES:[0x114]
1000:0dbf          8be5                           MOV SP,BP
1000:0dc1          5d                             POP BP
1000:0dc2          cb                             RETF
FUN_1000_0dc3:
1000:0dc3          55                             PUSH BP
1000:0dc4          8bec                           MOV BP,SP
1000:0dc6          83ec04                         SUB SP,0x4
1000:0dc9          807e067f                       CMP byte ptr [BP + 0x6],0x7f
1000:0dcd          7506                           JNZ 0x1000:0dd5
1000:0dcf          c646060f                       MOV byte ptr [BP + 0x6],0xf
1000:0dd3          eb04                           JMP 0x1000:0dd9
LAB_1000_0dd5:
1000:0dd5          c64606f0                       MOV byte ptr [BP + 0x6],0xf0
LAB_1000_0dd9:
1000:0dd9          8d4606                         LEA AX,[BP + 0x6]
1000:0ddc          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0ddf          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0de2          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0de6          26c70622010c00                 MOV word ptr ES:[0x122],0xc
1000:0ded          8e06200f                       MOV ES,word ptr [0xf20]
1000:0df1          26a31c01                       MOV ES:[0x11c],AX
1000:0df5          8e06220f                       MOV ES,word ptr [0xf22]
1000:0df9          8cd0                           MOV AX,SS
1000:0dfb          26a32001                       MOV ES:[0x120],AX
1000:0dff          9a0000000a                     CALLF 0x0000:a000
1000:0e04          8e06240f                       MOV ES,word ptr [0xf24]
1000:0e08          26a11401                       MOV AX,ES:[0x114]
1000:0e0c          8be5                           MOV SP,BP
1000:0e0e          5d                             POP BP
1000:0e0f          cb                             RETF
FUN_1000_0e10:
1000:0e10          55                             PUSH BP
1000:0e11          8bec                           MOV BP,SP
1000:0e13          83ec04                         SUB SP,0x4
1000:0e16          8d4606                         LEA AX,[BP + 0x6]
1000:0e19          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0e1c          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0e1f          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0e23          26c70622010c00                 MOV word ptr ES:[0x122],0xc
1000:0e2a          8e06200f                       MOV ES,word ptr [0xf20]
1000:0e2e          26a31c01                       MOV ES:[0x11c],AX
1000:0e32          8e06220f                       MOV ES,word ptr [0xf22]
1000:0e36          8cd0                           MOV AX,SS
1000:0e38          26a32001                       MOV ES:[0x120],AX
1000:0e3c          9a0000000a                     CALLF 0x0000:a000
1000:0e41          8e06240f                       MOV ES,word ptr [0xf24]
1000:0e45          26a11401                       MOV AX,ES:[0x114]
1000:0e49          8be5                           MOV SP,BP
1000:0e4b          5d                             POP BP
1000:0e4c          cb                             RETF
FUN_1000_0e4d:
1000:0e4d          55                             PUSH BP
1000:0e4e          8bec                           MOV BP,SP
1000:0e50          83ec08                         SUB SP,0x8
1000:0e53          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0e56          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0e59          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0e5c          8946fe                         MOV word ptr [BP + -0x2],AX
1000:0e5f          8d46fc                         LEA AX,[BP + -0x4]
1000:0e62          8946f8                         MOV word ptr [BP + -0x8],AX
1000:0e65          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:0e68          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0e6c          26c70622010d00                 MOV word ptr ES:[0x122],0xd
1000:0e73          8e06200f                       MOV ES,word ptr [0xf20]
1000:0e77          26a31c01                       MOV ES:[0x11c],AX
1000:0e7b          8e06220f                       MOV ES,word ptr [0xf22]
1000:0e7f          8cd0                           MOV AX,SS
1000:0e81          26a32001                       MOV ES:[0x120],AX
1000:0e85          9a0000000a                     CALLF 0x0000:a000
1000:0e8a          8e06240f                       MOV ES,word ptr [0xf24]
1000:0e8e          26a11401                       MOV AX,ES:[0x114]
1000:0e92          8be5                           MOV SP,BP
1000:0e94          5d                             POP BP
1000:0e95          cb                             RETF
FUN_1000_0efb:
1000:0efb          55                             PUSH BP
1000:0efc          8bec                           MOV BP,SP
1000:0efe          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0f02          26c70622011200                 MOV word ptr ES:[0x122],0x12
1000:0f09          8e06200f                       MOV ES,word ptr [0xf20]
1000:0f0d          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0f10          26a31c01                       MOV ES:[0x11c],AX
1000:0f14          8e06220f                       MOV ES,word ptr [0xf22]
1000:0f18          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0f1b          26a32001                       MOV ES:[0x120],AX
1000:0f1f          9a0000000a                     CALLF 0x0000:a000
1000:0f24          8e06240f                       MOV ES,word ptr [0xf24]
switchD_1000:9004::caseD_3:
1000:0f28          26a11401                       MOV AX,ES:[0x114]
1000:0f2c          5d                             POP BP
1000:0f2d          cb                             RETF
FUN_1000_0f2e:
1000:0f2e          55                             PUSH BP
1000:0f2f          8bec                           MOV BP,SP
1000:0f31          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0f35          26c70622010800                 MOV word ptr ES:[0x122],0x8
1000:0f3c          8e06200f                       MOV ES,word ptr [0xf20]
1000:0f40          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0f43          26a31c01                       MOV ES:[0x11c],AX
1000:0f47          8e06220f                       MOV ES,word ptr [0xf22]
1000:0f4b          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0f4e          26a32001                       MOV ES:[0x120],AX
1000:0f52          9a0000000a                     CALLF 0x0000:a000
1000:0f57          8e06240f                       MOV ES,word ptr [0xf24]
1000:0f5b          26a11401                       MOV AX,ES:[0x114]
1000:0f5f          5d                             POP BP
1000:0f60          cb                             RETF
FUN_1000_0f61:
1000:0f61          55                             PUSH BP
1000:0f62          8bec                           MOV BP,SP
1000:0f64          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0f68          26c70622010400                 MOV word ptr ES:[0x122],0x4
1000:0f6f          8e06200f                       MOV ES,word ptr [0xf20]
1000:0f73          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0f76          26a31c01                       MOV ES:[0x11c],AX
1000:0f7a          8e06220f                       MOV ES,word ptr [0xf22]
1000:0f7e          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0f81          26a32001                       MOV ES:[0x120],AX
1000:0f85          9a0000000a                     CALLF 0x0000:a000
1000:0f8a          8e06240f                       MOV ES,word ptr [0xf24]
1000:0f8e          26a11401                       MOV AX,ES:[0x114]
1000:0f92          5d                             POP BP
1000:0f93          cb                             RETF
FUN_1000_0f94:
1000:0f94          55                             PUSH BP
1000:0f95          8bec                           MOV BP,SP
1000:0f97          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0f9b          26c70622014000                 MOV word ptr ES:[0x122],0x40
1000:0fa2          8e06200f                       MOV ES,word ptr [0xf20]
1000:0fa6          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:0fa9          26a31c01                       MOV ES:[0x11c],AX
1000:0fad          8e06220f                       MOV ES,word ptr [0xf22]
1000:0fb1          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:0fb4          26a32001                       MOV ES:[0x120],AX
1000:0fb8          9a0000000a                     CALLF 0x0000:a000
1000:0fbd          8e06240f                       MOV ES,word ptr [0xf24]
1000:0fc1          26a11401                       MOV AX,ES:[0x114]
1000:0fc5          5d                             POP BP
1000:0fc6          cb                             RETF
FUN_1000_0fc7:
1000:0fc7          55                             PUSH BP
1000:0fc8          8bec                           MOV BP,SP
1000:0fca          83ec06                         SUB SP,0x6
1000:0fcd          8d46fa                         LEA AX,[BP + -0x6]
1000:0fd0          8946fc                         MOV word ptr [BP + -0x4],AX
1000:0fd3          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:0fd6          837e0600                       CMP word ptr [BP + 0x6],0x0
1000:0fda          7503                           JNZ 0x1000:0fdf
1000:0fdc          ff4606                         INC word ptr [BP + 0x6]
LAB_1000_0fdf:
1000:0fdf          837e0800                       CMP word ptr [BP + 0x8],0x0
1000:0fe3          7503                           JNZ 0x1000:0fe8
1000:0fe5          ff4608                         INC word ptr [BP + 0x8]
LAB_1000_0fe8:
1000:0fe8          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:0feb          8846fa                         MOV byte ptr [BP + -0x6],AL
1000:0fee          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:0ff1          8846fb                         MOV byte ptr [BP + -0x5],AL
1000:0ff4          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:0ff8          26c70622010a00                 MOV word ptr ES:[0x122],0xa
1000:0fff          8e06200f                       MOV ES,word ptr [0xf20]
1000:1003          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:1006          26a31c01                       MOV ES:[0x11c],AX
1000:100a          8e06220f                       MOV ES,word ptr [0xf22]
1000:100e          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:1011          26a32001                       MOV ES:[0x120],AX
1000:1015          9a0000000a                     CALLF 0x0000:a000
1000:101a          8e06240f                       MOV ES,word ptr [0xf24]
1000:101e          26a11401                       MOV AX,ES:[0x114]
1000:1022          8be5                           MOV SP,BP
1000:1024          5d                             POP BP
1000:1025          cb                             RETF
FUN_1000_1026:
1000:1026          55                             PUSH BP
1000:1027          8bec                           MOV BP,SP
1000:1029          83ec04                         SUB SP,0x4
1000:102c          8d4606                         LEA AX,[BP + 0x6]
1000:102f          8946fc                         MOV word ptr [BP + -0x4],AX
1000:1032          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:1035          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:1039          26c70622010700                 MOV word ptr ES:[0x122],0x7
1000:1040          8e06200f                       MOV ES,word ptr [0xf20]
1000:1044          26a31c01                       MOV ES:[0x11c],AX
1000:1048          8e06220f                       MOV ES,word ptr [0xf22]
1000:104c          8cd0                           MOV AX,SS
1000:104e          26a32001                       MOV ES:[0x120],AX
1000:1052          9a0000000a                     CALLF 0x0000:a000
1000:1057          8e06240f                       MOV ES,word ptr [0xf24]
1000:105b          26a11401                       MOV AX,ES:[0x114]
1000:105f          8be5                           MOV SP,BP
1000:1061          5d                             POP BP
1000:1062          cb                             RETF
FUN_1000_1100:
1000:1100          55                             PUSH BP
1000:1101          8bec                           MOV BP,SP
1000:1103          83ec08                         SUB SP,0x8
1000:1106          8d46fc                         LEA AX,[BP + -0x4]
1000:1109          8946f8                         MOV word ptr [BP + -0x8],AX
1000:110c          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:110f          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:1112          8846fc                         MOV byte ptr [BP + -0x4],AL
1000:1115          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:1118          8846fd                         MOV byte ptr [BP + -0x3],AL
1000:111b          8a460a                         MOV AL,byte ptr [BP + 0xa]
1000:111e          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:1121          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:1125          26c70622013500                 MOV word ptr ES:[0x122],0x35
1000:112c          8e06200f                       MOV ES,word ptr [0xf20]
1000:1130          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:1133          26a31c01                       MOV ES:[0x11c],AX
1000:1137          8e06220f                       MOV ES,word ptr [0xf22]
1000:113b          8cd0                           MOV AX,SS
1000:113d          26a32001                       MOV ES:[0x120],AX
1000:1141          9a0000000a                     CALLF 0x0000:a000
1000:1146          8e06240f                       MOV ES,word ptr [0xf24]
1000:114a          26a11401                       MOV AX,ES:[0x114]
1000:114e          8be5                           MOV SP,BP
1000:1150          5d                             POP BP
1000:1151          cb                             RETF
FUN_1000_1152:
1000:1152          55                             PUSH BP
1000:1153          8bec                           MOV BP,SP
1000:1155          83ec06                         SUB SP,0x6
1000:1158          8d46fe                         LEA AX,[BP + -0x2]
1000:115b          8946fa                         MOV word ptr [BP + -0x6],AX
1000:115e          8c56fc                         MOV word ptr [BP + -0x4],SS
1000:1161          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:1164          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:1167          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:116a          8846ff                         MOV byte ptr [BP + -0x1],AL
1000:116d          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:1171          26c70622013400                 MOV word ptr ES:[0x122],0x34
1000:1178          8e06200f                       MOV ES,word ptr [0xf20]
1000:117c          8b46fa                         MOV AX,word ptr [BP + -0x6]
1000:117f          26a31c01                       MOV ES:[0x11c],AX
1000:1183          8e06220f                       MOV ES,word ptr [0xf22]
1000:1187          8cd0                           MOV AX,SS
1000:1189          26a32001                       MOV ES:[0x120],AX
1000:118d          9a0000000a                     CALLF 0x0000:a000
1000:1192          8e06240f                       MOV ES,word ptr [0xf24]
1000:1196          26a11401                       MOV AX,ES:[0x114]
1000:119a          8be5                           MOV SP,BP
1000:119c          5d                             POP BP
1000:119d          cb                             RETF
FUN_1000_119e:
1000:119e          55                             PUSH BP
1000:119f          8bec                           MOV BP,SP
1000:11a1          83ec08                         SUB SP,0x8
1000:11a4          8d46fc                         LEA AX,[BP + -0x4]
1000:11a7          8946f8                         MOV word ptr [BP + -0x8],AX
1000:11aa          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:11ad          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:11b0          8846fc                         MOV byte ptr [BP + -0x4],AL
1000:11b3          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:11b6          8846fd                         MOV byte ptr [BP + -0x3],AL
1000:11b9          8a460a                         MOV AL,byte ptr [BP + 0xa]
1000:11bc          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:11bf          8a460c                         MOV AL,byte ptr [BP + 0xc]
1000:11c2          8846ff                         MOV byte ptr [BP + -0x1],AL
1000:11c5          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:11c9          26c70622013700                 MOV word ptr ES:[0x122],0x37
1000:11d0          8e06200f                       MOV ES,word ptr [0xf20]
1000:11d4          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:11d7          26a31c01                       MOV ES:[0x11c],AX
1000:11db          8e06220f                       MOV ES,word ptr [0xf22]
1000:11df          8cd0                           MOV AX,SS
1000:11e1          26a32001                       MOV ES:[0x120],AX
1000:11e5          9a0000000a                     CALLF 0x0000:a000
1000:11ea          8e06240f                       MOV ES,word ptr [0xf24]
1000:11ee          26a11401                       MOV AX,ES:[0x114]
1000:11f2          8be5                           MOV SP,BP
1000:11f4          5d                             POP BP
1000:11f5          cb                             RETF
FUN_1000_11f6:
1000:11f6          55                             PUSH BP
1000:11f7          8bec                           MOV BP,SP
1000:11f9          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:11fd          26c70622012400                 MOV word ptr ES:[0x122],0x24
1000:1204          8e06200f                       MOV ES,word ptr [0xf20]
1000:1208          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:120b          26a31c01                       MOV ES:[0x11c],AX
1000:120f          8e06220f                       MOV ES,word ptr [0xf22]
1000:1213          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:1216          26a32001                       MOV ES:[0x120],AX
1000:121a          9a0000000a                     CALLF 0x0000:a000
1000:121f          8e06240f                       MOV ES,word ptr [0xf24]
1000:1223          26a11401                       MOV AX,ES:[0x114]
1000:1227          5d                             POP BP
1000:1228          cb                             RETF
FUN_1000_1229:
1000:1229          55                             PUSH BP
1000:122a          8bec                           MOV BP,SP
1000:122c          83ec08                         SUB SP,0x8
1000:122f          8d46fc                         LEA AX,[BP + -0x4]
1000:1232          8946f8                         MOV word ptr [BP + -0x8],AX
1000:1235          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:1238          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:123b          8946fc                         MOV word ptr [BP + -0x4],AX
1000:123e          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:1241          894600                         MOV word ptr [BP + 0x0],AX
1000:1244          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:1248          26c70622011b00                 MOV word ptr ES:[0x122],0x1b
1000:124f          8e06200f                       MOV ES,word ptr [0xf20]
1000:1253          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:1256          26a31c01                       MOV ES:[0x11c],AX
1000:125a          8e06220f                       MOV ES,word ptr [0xf22]
1000:125e          8cd0                           MOV AX,SS
1000:1260          26a32001                       MOV ES:[0x120],AX
1000:1264          9a0000000a                     CALLF 0x0000:a000
1000:1269          8e06240f                       MOV ES,word ptr [0xf24]
1000:126d          26a11401                       MOV AX,ES:[0x114]
1000:1271          8be5                           MOV SP,BP
1000:1273          5d                             POP BP
1000:1274          cb                             RETF
FUN_1000_1275:
1000:1275          55                             PUSH BP
1000:1276          8bec                           MOV BP,SP
1000:1278          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:127c          26c70622011300                 MOV word ptr ES:[0x122],0x13
1000:1283          8e06200f                       MOV ES,word ptr [0xf20]
1000:1287          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:128a          26a31c01                       MOV ES:[0x11c],AX
1000:128e          8e06220f                       MOV ES,word ptr [0xf22]
1000:1292          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:1295          26a32001                       MOV ES:[0x120],AX
1000:1299          9a0000000a                     CALLF 0x0000:a000
1000:129e          8e06240f                       MOV ES,word ptr [0xf24]
1000:12a2          26a11401                       MOV AX,ES:[0x114]
1000:12a6          5d                             POP BP
1000:12a7          cb                             RETF
FUN_1000_12f4:
1000:12f4          55                             PUSH BP
1000:12f5          8bec                           MOV BP,SP
1000:12f7          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:12fb          26c70622011400                 MOV word ptr ES:[0x122],0x14
1000:1302          8e06200f                       MOV ES,word ptr [0xf20]
1000:1306          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1309          26a31c01                       MOV ES:[0x11c],AX
1000:130d          8e06220f                       MOV ES,word ptr [0xf22]
1000:1311          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:1314          26a32001                       MOV ES:[0x120],AX
1000:1318          9a0000000a                     CALLF 0x0000:a000
1000:131d          8e06240f                       MOV ES,word ptr [0xf24]
1000:1321          26a11401                       MOV AX,ES:[0x114]
1000:1325          5d                             POP BP
1000:1326          cb                             RETF
FUN_1000_1327:
1000:1327          55                             PUSH BP
1000:1328          8bec                           MOV BP,SP
1000:132a          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:132e          26c70622014100                 MOV word ptr ES:[0x122],0x41
1000:1335          8e06200f                       MOV ES,word ptr [0xf20]
1000:1339          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:133c          26a31c01                       MOV ES:[0x11c],AX
1000:1340          8e06220f                       MOV ES,word ptr [0xf22]
1000:1344          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:1347          26a32001                       MOV ES:[0x120],AX
1000:134b          9a0000000a                     CALLF 0x0000:a000
1000:1350          8e06240f                       MOV ES,word ptr [0xf24]
1000:1354          26a11401                       MOV AX,ES:[0x114]
1000:1358          5d                             POP BP
1000:1359          cb                             RETF
FUN_1000_135a:
1000:135a          55                             PUSH BP
1000:135b          8bec                           MOV BP,SP
1000:135d          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:1361          26c70622010600                 MOV word ptr ES:[0x122],0x6
1000:1368          8e06200f                       MOV ES,word ptr [0xf20]
1000:136c          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:136f          26a31c01                       MOV ES:[0x11c],AX
1000:1373          8e06220f                       MOV ES,word ptr [0xf22]
1000:1377          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:137a          26a32001                       MOV ES:[0x120],AX
1000:137e          9a0000000a                     CALLF 0x0000:a000
1000:1383          8e06240f                       MOV ES,word ptr [0xf24]
1000:1387          26a11401                       MOV AX,ES:[0x114]
1000:138b          5d                             POP BP
1000:138c          cb                             RETF
FUN_1000_138d:
1000:138d          55                             PUSH BP
1000:138e          8bec                           MOV BP,SP
1000:1390          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:1394          26c70622013a00                 MOV word ptr ES:[0x122],0x3a
1000:139b          8e06200f                       MOV ES,word ptr [0xf20]
1000:139f          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:13a2          26a31c01                       MOV ES:[0x11c],AX
1000:13a6          8e06220f                       MOV ES,word ptr [0xf22]
1000:13aa          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:13ad          26a32001                       MOV ES:[0x120],AX
1000:13b1          9a0000000a                     CALLF 0x0000:a000
1000:13b6          8e06240f                       MOV ES,word ptr [0xf24]
1000:13ba          26a11401                       MOV AX,ES:[0x114]
1000:13be          5d                             POP BP
1000:13bf          cb                             RETF
FUN_1000_13c0:
1000:13c0          55                             PUSH BP
1000:13c1          8bec                           MOV BP,SP
1000:13c3          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:13c7          26c70622013b00                 MOV word ptr ES:[0x122],0x3b
1000:13ce          8e06200f                       MOV ES,word ptr [0xf20]
1000:13d2          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:13d5          26a31c01                       MOV ES:[0x11c],AX
1000:13d9          8e06220f                       MOV ES,word ptr [0xf22]
1000:13dd          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:13e0          26a32001                       MOV ES:[0x120],AX
1000:13e4          9a0000000a                     CALLF 0x0000:a000
1000:13e9          8e06240f                       MOV ES,word ptr [0xf24]
1000:13ed          26a11401                       MOV AX,ES:[0x114]
1000:13f1          5d                             POP BP
1000:13f2          cb                             RETF
FUN_1000_13f3:
1000:13f3          55                             PUSH BP
1000:13f4          8bec                           MOV BP,SP
1000:13f6          83ec04                         SUB SP,0x4
1000:13f9          8d4606                         LEA AX,[BP + 0x6]
1000:13fc          8946fc                         MOV word ptr [BP + -0x4],AX
1000:13ff          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:1402          8e061e0f                       MOV ES,word ptr [0xf1e]
1000:1406          26c70622013300                 MOV word ptr ES:[0x122],0x33
1000:140d          8e06200f                       MOV ES,word ptr [0xf20]
1000:1411          26a31c01                       MOV ES:[0x11c],AX
1000:1415          8e06220f                       MOV ES,word ptr [0xf22]
1000:1419          8cd0                           MOV AX,SS
1000:141b          26a32001                       MOV ES:[0x120],AX
1000:141f          9a0000000a                     CALLF 0x0000:a000
1000:1424          8e06240f                       MOV ES,word ptr [0xf24]
1000:1428          26a11401                       MOV AX,ES:[0x114]
1000:142c          8be5                           MOV SP,BP
1000:142e          5d                             POP BP
1000:142f          cb                             RETF
FUN_1000_1430:
1000:1430          55                             PUSH BP
1000:1431          8bec                           MOV BP,SP
1000:1433          83ec02                         SUB SP,0x2
1000:1436          b86100                         MOV AX,0x61
1000:1439          50                             PUSH AX
1000:143a          9ae41aaa05                     CALLF 0x0000:7584
1000:143f          83c402                         ADD SP,0x2
1000:1442          8e06380f                       MOV ES,word ptr [0xf38]
1000:1446          26a31000                       MOV ES:[0x10],AX
1000:144a          24fc                           AND AL,0xfc
1000:144c          50                             PUSH AX
1000:144d          b86100                         MOV AX,0x61
1000:1450          50                             PUSH AX
1000:1451          9af21aaa05                     CALLF 0x0000:7592
1000:1456          83c404                         ADD SP,0x4
1000:1459          b8b600                         MOV AX,0xb6
1000:145c          50                             PUSH AX
1000:145d          b84300                         MOV AX,0x43
1000:1460          50                             PUSH AX
1000:1461          9af21aaa05                     CALLF 0x0000:7592
1000:1466          83c404                         ADD SP,0x4
1000:1469          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:146c          2ae4                           SUB AH,AH
1000:146e          8946fe                         MOV word ptr [BP + -0x2],AX
1000:1471          8a46fe                         MOV AL,byte ptr [BP + -0x2]
1000:1474          98                             CBW
1000:1475          50                             PUSH AX
1000:1476          b84200                         MOV AX,0x42
1000:1479          50                             PUSH AX
1000:147a          9af21aaa05                     CALLF 0x0000:7592
1000:147f          83c404                         ADD SP,0x4
1000:1482          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1485          b108                           MOV CL,0x8
1000:1487          d3e8                           SHR AX,CL
1000:1489          8946fe                         MOV word ptr [BP + -0x2],AX
1000:148c          c646ff00                       MOV byte ptr [BP + -0x1],0x0
1000:1490          8a46fe                         MOV AL,byte ptr [BP + -0x2]
1000:1493          98                             CBW
1000:1494          50                             PUSH AX
1000:1495          b84200                         MOV AX,0x42
1000:1498          50                             PUSH AX
1000:1499          9af21aaa05                     CALLF 0x0000:7592
1000:149e          83c404                         ADD SP,0x4
1000:14a1          8e06380f                       MOV ES,word ptr [0xf38]
1000:14a5          26a11000                       MOV AX,ES:[0x10]
1000:14a9          0c03                           OR AL,0x3
1000:14ab          50                             PUSH AX
1000:14ac          b86100                         MOV AX,0x61
1000:14af          50                             PUSH AX
1000:14b0          9af21aaa05                     CALLF 0x0000:7592
1000:14b5          8be5                           MOV SP,BP
1000:14b7          5d                             POP BP
1000:14b8          cb                             RETF
FUN_1000_14b9:
1000:14b9          55                             PUSH BP
1000:14ba          8bec                           MOV BP,SP
1000:14bc          83ec04                         SUB SP,0x4
1000:14bf          8e063a0f                       MOV ES,word ptr [0xf3a]
1000:14c3          26a11e03                       MOV AX,ES:[0x31e]
1000:14c7          260b062003                     OR AX,word ptr ES:[0x320]
1000:14cc          754a                           JNZ 0x1000:1518
1000:14ce          2bc0                           SUB AX,AX
1000:14d0          8946fe                         MOV word ptr [BP + -0x2],AX
1000:14d3          8946fc                         MOV word ptr [BP + -0x4],AX
1000:14d6          eb08                           JMP 0x1000:14e0
LAB_1000_14d8:
1000:14d8          8346fc01                       ADD word ptr [BP + -0x4],0x1
1000:14dc          8356fe00                       ADC word ptr [BP + -0x2],0x0
LAB_1000_14e0:
1000:14e0          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:14e3          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:14e6          3956fe                         CMP word ptr [BP + -0x2],DX
1000:14e9          7707                           JA 0x1000:14f2
1000:14eb          72eb                           JC 0x1000:14d8
1000:14ed          3946fc                         CMP word ptr [BP + -0x4],AX
1000:14f0          72e6                           JC 0x1000:14d8
LAB_1000_14f2:
1000:14f2          2bc0                           SUB AX,AX
1000:14f4          8946fe                         MOV word ptr [BP + -0x2],AX
1000:14f7          8946fc                         MOV word ptr [BP + -0x4],AX
1000:14fa          eb08                           JMP 0x1000:1504
LAB_1000_14fc:
1000:14fc          8346fc01                       ADD word ptr [BP + -0x4],0x1
1000:1500          8356fe00                       ADC word ptr [BP + -0x2],0x0
LAB_1000_1504:
1000:1504          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1507          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:150a          3956fe                         CMP word ptr [BP + -0x2],DX
1000:150d          7744                           JA 0x1000:1553
1000:150f          72eb                           JC 0x1000:14fc
1000:1511          3946fc                         CMP word ptr [BP + -0x4],AX
1000:1514          733d                           JNC 0x1000:1553
1000:1516          ebe4                           JMP 0x1000:14fc
LAB_1000_1518:
1000:1518          8e063a0f                       MOV ES,word ptr [0xf3a]
1000:151c          26ff362003                     PUSH word ptr ES:[0x320]
1000:1521          26ff361e03                     PUSH word ptr ES:[0x31e]
1000:1526          8d4606                         LEA AX,[BP + 0x6]
1000:1529          50                             PUSH AX
1000:152a          9a641daa05                     CALLF 0x0000:7804
1000:152f          2bc0                           SUB AX,AX
1000:1531          8946fe                         MOV word ptr [BP + -0x2],AX
1000:1534          8946fc                         MOV word ptr [BP + -0x4],AX
1000:1537          eb08                           JMP 0x1000:1541
LAB_1000_1539:
1000:1539          8346fc01                       ADD word ptr [BP + -0x4],0x1
1000:153d          8356fe00                       ADC word ptr [BP + -0x2],0x0
LAB_1000_1541:
1000:1541          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1544          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:1547          3956fe                         CMP word ptr [BP + -0x2],DX
1000:154a          7707                           JA 0x1000:1553
1000:154c          72eb                           JC 0x1000:1539
1000:154e          3946fc                         CMP word ptr [BP + -0x4],AX
1000:1551          72e6                           JC 0x1000:1539
LAB_1000_1553:
1000:1553          8be5                           MOV SP,BP
1000:1555          5d                             POP BP
1000:1556          cb                             RETF
FUN_1000_16ec:
1000:16ec          55                             PUSH BP
1000:16ed          8bec                           MOV BP,SP
1000:16ef          83ec02                         SUB SP,0x2
1000:16f2          8d46fe                         LEA AX,[BP + -0x2]
1000:16f5          16                             PUSH SS
1000:16f6          50                             PUSH AX
1000:16f7          b84800                         MOV AX,0x48
1000:16fa          1e                             PUSH DS
1000:16fb          50                             PUSH AX
1000:16fc          9a06005102                     CALLF 0x0000:2516
1000:1701          83c408                         ADD SP,0x8
1000:1704          a3d805                         MOV [0x5d8],AX
1000:1707          8916da05                       MOV word ptr [0x5da],DX
1000:170b          8d46fe                         LEA AX,[BP + -0x2]
1000:170e          16                             PUSH SS
1000:170f          50                             PUSH AX
1000:1710          b85300                         MOV AX,0x53
1000:1713          1e                             PUSH DS
1000:1714          50                             PUSH AX
1000:1715          9a06005102                     CALLF 0x0000:2516
1000:171a          83c408                         ADD SP,0x8
1000:171d          a3ec05                         MOV [0x5ec],AX
1000:1720          8916ee05                       MOV word ptr [0x5ee],DX
1000:1724          8d46fe                         LEA AX,[BP + -0x2]
1000:1727          16                             PUSH SS
1000:1728          50                             PUSH AX
1000:1729          b85e00                         MOV AX,0x5e
1000:172c          1e                             PUSH DS
1000:172d          50                             PUSH AX
1000:172e          9a06005102                     CALLF 0x0000:2516
1000:1733          83c408                         ADD SP,0x8
1000:1736          a3e005                         MOV [0x5e0],AX
1000:1739          8916e205                       MOV word ptr [0x5e2],DX
1000:173d          8d46fe                         LEA AX,[BP + -0x2]
1000:1740          16                             PUSH SS
1000:1741          50                             PUSH AX
1000:1742          b86900                         MOV AX,0x69
1000:1745          1e                             PUSH DS
1000:1746          50                             PUSH AX
1000:1747          9a06005102                     CALLF 0x0000:2516
1000:174c          83c408                         ADD SP,0x8
1000:174f          a3e405                         MOV [0x5e4],AX
1000:1752          8916e605                       MOV word ptr [0x5e6],DX
1000:1756          8d46fe                         LEA AX,[BP + -0x2]
1000:1759          16                             PUSH SS
1000:175a          50                             PUSH AX
1000:175b          b87400                         MOV AX,0x74
1000:175e          1e                             PUSH DS
1000:175f          50                             PUSH AX
1000:1760          9a06005102                     CALLF 0x0000:2516
1000:1765          83c408                         ADD SP,0x8
1000:1768          a3e805                         MOV [0x5e8],AX
1000:176b          8916ea05                       MOV word ptr [0x5ea],DX
1000:176f          8d46fe                         LEA AX,[BP + -0x2]
1000:1772          16                             PUSH SS
1000:1773          50                             PUSH AX
1000:1774          b87f00                         MOV AX,0x7f
1000:1777          1e                             PUSH DS
1000:1778          50                             PUSH AX
1000:1779          9a06005102                     CALLF 0x0000:2516
1000:177e          83c408                         ADD SP,0x8
1000:1781          a3c805                         MOV [0x5c8],AX
1000:1784          8916ca05                       MOV word ptr [0x5ca],DX
1000:1788          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:178c          26833e0e0001                   CMP word ptr ES:[0xe],0x1
1000:1792          7408                           JZ 0x1000:179c
1000:1794          26833e0e0003                   CMP word ptr ES:[0xe],0x3
1000:179a          7519                           JNZ 0x1000:17b5
LAB_1000_179c:
1000:179c          8d46fe                         LEA AX,[BP + -0x2]
1000:179f          16                             PUSH SS
1000:17a0          50                             PUSH AX
1000:17a1          b88900                         MOV AX,0x89
1000:17a4          1e                             PUSH DS
1000:17a5          50                             PUSH AX
1000:17a6          9a06005102                     CALLF 0x0000:2516
1000:17ab          83c408                         ADD SP,0x8
1000:17ae          a3f405                         MOV [0x5f4],AX
1000:17b1          8916f605                       MOV word ptr [0x5f6],DX
LAB_1000_17b5:
1000:17b5          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:17b9          26833e0e0003                   CMP word ptr ES:[0xe],0x3
1000:17bf          7513                           JNZ 0x1000:17d4
1000:17c1          ff76fe                         PUSH word ptr [BP + -0x2]
1000:17c4          ff36f605                       PUSH word ptr [0x5f6]
1000:17c8          ff36f405                       PUSH word ptr [0x5f4]
1000:17cc          9a1c00e508                     CALLF 0x0000:8e6c
1000:17d1          83c406                         ADD SP,0x6
LAB_1000_17d4:
1000:17d4          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:17d8          26833e0e0002                   CMP word ptr ES:[0xe],0x2
1000:17de          7410                           JZ 0x1000:17f0
1000:17e0          26833e0e0006                   CMP word ptr ES:[0xe],0x6
1000:17e6          7408                           JZ 0x1000:17f0
1000:17e8          26833e0e000a                   CMP word ptr ES:[0xe],0xa
1000:17ee          755c                           JNZ 0x1000:184c
LAB_1000_17f0:
1000:17f0          2bc0                           SUB AX,AX
1000:17f2          50                             PUSH AX
1000:17f3          50                             PUSH AX
1000:17f4          b81f00                         MOV AX,0x1f
1000:17f7          50                             PUSH AX
1000:17f8          9a02007503                     CALLF 0x0000:3752
1000:17fd          83c406                         ADD SP,0x6
1000:1800          a3f805                         MOV [0x5f8],AX
1000:1803          8916fa05                       MOV word ptr [0x5fa],DX
1000:1807          2bc0                           SUB AX,AX
1000:1809          50                             PUSH AX
1000:180a          50                             PUSH AX
1000:180b          b82000                         MOV AX,0x20
1000:180e          50                             PUSH AX
1000:180f          9a02007503                     CALLF 0x0000:3752
1000:1814          83c406                         ADD SP,0x6
1000:1817          a3fc05                         MOV [0x5fc],AX
1000:181a          8916fe05                       MOV word ptr [0x5fe],DX
1000:181e          2bc0                           SUB AX,AX
1000:1820          50                             PUSH AX
1000:1821          50                             PUSH AX
1000:1822          b82100                         MOV AX,0x21
1000:1825          50                             PUSH AX
1000:1826          9a02007503                     CALLF 0x0000:3752
1000:182b          83c406                         ADD SP,0x6
1000:182e          a30006                         MOV [0x600],AX
1000:1831          89160206                       MOV word ptr [0x602],DX
1000:1835          2bc0                           SUB AX,AX
1000:1837          50                             PUSH AX
1000:1838          50                             PUSH AX
1000:1839          b82200                         MOV AX,0x22
1000:183c          50                             PUSH AX
1000:183d          9a02007503                     CALLF 0x0000:3752
1000:1842          83c406                         ADD SP,0x6
1000:1845          a30406                         MOV [0x604],AX
1000:1848          89160606                       MOV word ptr [0x606],DX
LAB_1000_184c:
1000:184c          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:1850          26833e0e0004                   CMP word ptr ES:[0xe],0x4
1000:1856          7408                           JZ 0x1000:1860
1000:1858          26833e0e0005                   CMP word ptr ES:[0xe],0x5
1000:185e          7517                           JNZ 0x1000:1877
LAB_1000_1860:
1000:1860          2bc0                           SUB AX,AX
1000:1862          50                             PUSH AX
1000:1863          50                             PUSH AX
1000:1864          b81f00                         MOV AX,0x1f
1000:1867          50                             PUSH AX
1000:1868          9a02007503                     CALLF 0x0000:3752
1000:186d          83c406                         ADD SP,0x6
1000:1870          a3f405                         MOV [0x5f4],AX
1000:1873          8916f605                       MOV word ptr [0x5f6],DX
LAB_1000_1877:
1000:1877          8be5                           MOV SP,BP
1000:1879          5d                             POP BP
1000:187a          cb                             RETF
FUN_1000_187b:
1000:187b          b8cc05                         MOV AX,0x5cc
1000:187e          1e                             PUSH DS
1000:187f          50                             PUSH AX
1000:1880          9a2d059502                     CALLF 0x0000:2e7d
1000:1885          83c404                         ADD SP,0x4
1000:1888          b8d005                         MOV AX,0x5d0
1000:188b          1e                             PUSH DS
1000:188c          50                             PUSH AX
1000:188d          9a2d059502                     CALLF 0x0000:2e7d
1000:1892          83c404                         ADD SP,0x4
1000:1895          b8d405                         MOV AX,0x5d4
1000:1898          1e                             PUSH DS
1000:1899          50                             PUSH AX
1000:189a          9a2d059502                     CALLF 0x0000:2e7d
1000:189f          83c404                         ADD SP,0x4
1000:18a2          b8dc05                         MOV AX,0x5dc
1000:18a5          1e                             PUSH DS
1000:18a6          50                             PUSH AX
1000:18a7          9a2d059502                     CALLF 0x0000:2e7d
1000:18ac          83c404                         ADD SP,0x4
1000:18af          b8d805                         MOV AX,0x5d8
1000:18b2          1e                             PUSH DS
1000:18b3          50                             PUSH AX
1000:18b4          9a2d059502                     CALLF 0x0000:2e7d
1000:18b9          83c404                         ADD SP,0x4
1000:18bc          b8ec05                         MOV AX,0x5ec
1000:18bf          1e                             PUSH DS
1000:18c0          50                             PUSH AX
1000:18c1          9a2d059502                     CALLF 0x0000:2e7d
1000:18c6          83c404                         ADD SP,0x4
1000:18c9          b8e005                         MOV AX,0x5e0
1000:18cc          1e                             PUSH DS
1000:18cd          50                             PUSH AX
1000:18ce          9a2d059502                     CALLF 0x0000:2e7d
1000:18d3          83c404                         ADD SP,0x4
1000:18d6          b8e405                         MOV AX,0x5e4
1000:18d9          1e                             PUSH DS
1000:18da          50                             PUSH AX
1000:18db          9a2d059502                     CALLF 0x0000:2e7d
1000:18e0          83c404                         ADD SP,0x4
1000:18e3          b8e805                         MOV AX,0x5e8
1000:18e6          1e                             PUSH DS
1000:18e7          50                             PUSH AX
1000:18e8          9a2d059502                     CALLF 0x0000:2e7d
1000:18ed          83c404                         ADD SP,0x4
1000:18f0          b8f405                         MOV AX,0x5f4
1000:18f3          1e                             PUSH DS
1000:18f4          50                             PUSH AX
1000:18f5          9a2d059502                     CALLF 0x0000:2e7d
1000:18fa          83c404                         ADD SP,0x4
1000:18fd          b8f805                         MOV AX,0x5f8
1000:1900          1e                             PUSH DS
1000:1901          50                             PUSH AX
1000:1902          9a2d059502                     CALLF 0x0000:2e7d
1000:1907          83c404                         ADD SP,0x4
1000:190a          b8fc05                         MOV AX,0x5fc
1000:190d          1e                             PUSH DS
1000:190e          50                             PUSH AX
1000:190f          9a2d059502                     CALLF 0x0000:2e7d
1000:1914          83c404                         ADD SP,0x4
1000:1917          b80006                         MOV AX,0x600
1000:191a          1e                             PUSH DS
1000:191b          50                             PUSH AX
1000:191c          9a2d059502                     CALLF 0x0000:2e7d
1000:1921          83c404                         ADD SP,0x4
1000:1924          b80406                         MOV AX,0x604
1000:1927          1e                             PUSH DS
1000:1928          50                             PUSH AX
1000:1929          9a2d059502                     CALLF 0x0000:2e7d
1000:192e          83c404                         ADD SP,0x4
1000:1931          cb                             RETF
FUN_1000_1932:
1000:1932          55                             PUSH BP
1000:1933          8bec                           MOV BP,SP
1000:1935          83ec02                         SUB SP,0x2
1000:1938          837e061f                       CMP word ptr [BP + 0x6],0x1f
1000:193c          7328                           JNC 0x1000:1966
1000:193e          2bc0                           SUB AX,AX
1000:1940          50                             PUSH AX
1000:1941          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:1944          8a874c05                       MOV AL,byte ptr [BX + 0x54c]
1000:1948          2ae4                           SUB AH,AH
1000:194a          50                             PUSH AX
1000:194b          d1e3                           SHL BX,0x1
1000:194d          ffb75604                       PUSH word ptr [BX + 0x456]
1000:1951          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1954          40                             INC AX
1000:1955          50                             PUSH AX
1000:1956          ff36da05                       PUSH word ptr [0x5da]
1000:195a          ff36d805                       PUSH word ptr [0x5d8]
switchD_1000:8905::caseD_6:
1000:195e          9a59059502                     CALLF 0x0000:2ea9
1000:1963          83c40c                         ADD SP,0xc
LAB_1000_1966:
1000:1966          837e061e                       CMP word ptr [BP + 0x6],0x1e
1000:196a          7703                           JA 0x1000:196f
1000:196c          e96301                         JMP 0x1000:1ad2
LAB_1000_196f:
1000:196f          837e062c                       CMP word ptr [BP + 0x6],0x2c
1000:1973          7203                           JC 0x1000:1978
1000:1975          e95a01                         JMP 0x1000:1ad2
LAB_1000_1978:
1000:1978          837e061f                       CMP word ptr [BP + 0x6],0x1f
1000:197c          7403                           JZ 0x1000:1981
1000:197e          e92401                         JMP 0x1000:1aa5
LAB_1000_1981:
1000:1981          0e                             PUSH CS
1000:1982          e87d0b                         CALL 0x1000:2502
1000:1985          8e063e0f                       MOV ES,word ptr [0xf3e]
1000:1989          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:198f          7e0f                           JLE 0x1000:19a0
1000:1991          ff36ca05                       PUSH word ptr [0x5ca]
1000:1995          ff36c805                       PUSH word ptr [0x5c8]
1000:1999          9a2c020000                     CALLF 0x0000:022c
1000:199e          eb0d                           JMP 0x1000:19ad
LAB_1000_19a0:
1000:19a0          ff36ca05                       PUSH word ptr [0x5ca]
1000:19a4          ff36c805                       PUSH word ptr [0x5c8]
1000:19a8          9a5f020000                     CALLF 0x0000:025f
LAB_1000_19ad:
1000:19ad          83c404                         ADD SP,0x4
1000:19b0          b81e00                         MOV AX,0x1e
1000:19b3          50                             PUSH AX
1000:19b4          0e                             PUSH CS
1000:19b5          e89e0a                         CALL 0x1000:2456
1000:19b8          83c402                         ADD SP,0x2
1000:19bb          b8d805                         MOV AX,0x5d8
1000:19be          1e                             PUSH DS
1000:19bf          50                             PUSH AX
1000:19c0          9a2d059502                     CALLF 0x0000:2e7d
1000:19c5          83c404                         ADD SP,0x4
1000:19c8          b8c805                         MOV AX,0x5c8
1000:19cb          1e                             PUSH DS
1000:19cc          50                             PUSH AX
1000:19cd          9a2d059502                     CALLF 0x0000:2e7d
1000:19d2          83c404                         ADD SP,0x4
1000:19d5          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:19d9          26833e0e0006                   CMP word ptr ES:[0xe],0x6
1000:19df          7410                           JZ 0x1000:19f1
1000:19e1          26833e0e0002                   CMP word ptr ES:[0xe],0x2
1000:19e7          7408                           JZ 0x1000:19f1
1000:19e9          26833e0e000a                   CMP word ptr ES:[0xe],0xa
1000:19ef          7539                           JNZ 0x1000:1a2a
LAB_1000_19f1:
1000:19f1          9ab20de508                     CALLF 0x0000:9c02
1000:19f6          b8f805                         MOV AX,0x5f8
1000:19f9          1e                             PUSH DS
1000:19fa          50                             PUSH AX
1000:19fb          9a2d059502                     CALLF 0x0000:2e7d
1000:1a00          83c404                         ADD SP,0x4
1000:1a03          b8fc05                         MOV AX,0x5fc
1000:1a06          1e                             PUSH DS
1000:1a07          50                             PUSH AX
1000:1a08          9a2d059502                     CALLF 0x0000:2e7d
1000:1a0d          83c404                         ADD SP,0x4
1000:1a10          b80006                         MOV AX,0x600
1000:1a13          1e                             PUSH DS
1000:1a14          50                             PUSH AX
1000:1a15          9a2d059502                     CALLF 0x0000:2e7d
1000:1a1a          83c404                         ADD SP,0x4
1000:1a1d          b80406                         MOV AX,0x604
1000:1a20          1e                             PUSH DS
1000:1a21          50                             PUSH AX
1000:1a22          9a2d059502                     CALLF 0x0000:2e7d
1000:1a27          83c404                         ADD SP,0x4
LAB_1000_1a2a:
1000:1a2a          8d46fe                         LEA AX,[BP + -0x2]
1000:1a2d          16                             PUSH SS
1000:1a2e          50                             PUSH AX
1000:1a2f          b8c006                         MOV AX,0x6c0
1000:1a32          1e                             PUSH DS
1000:1a33          50                             PUSH AX
1000:1a34          9a06005102                     CALLF 0x0000:2516
1000:1a39          83c408                         ADD SP,0x8
1000:1a3c          a3dc05                         MOV [0x5dc],AX
1000:1a3f          8916de05                       MOV word ptr [0x5de],DX
1000:1a43          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:1a47          26833e0e0004                   CMP word ptr ES:[0xe],0x4
1000:1a4d          7503                           JNZ 0x1000:1a52
1000:1a4f          e91101                         JMP 0x1000:1b63
LAB_1000_1a52:
1000:1a52          26833e0e0005                   CMP word ptr ES:[0xe],0x5
1000:1a58          7503                           JNZ 0x1000:1a5d
1000:1a5a          e90601                         JMP 0x1000:1b63
LAB_1000_1a5d:
1000:1a5d          2bc0                           SUB AX,AX
1000:1a5f          50                             PUSH AX
1000:1a60          50                             PUSH AX
1000:1a61          b82d00                         MOV AX,0x2d
1000:1a64          50                             PUSH AX
1000:1a65          9a02007503                     CALLF 0x0000:3752
1000:1a6a          83c406                         ADD SP,0x6
1000:1a6d          a3cc05                         MOV [0x5cc],AX
1000:1a70          8916ce05                       MOV word ptr [0x5ce],DX
1000:1a74          2bc0                           SUB AX,AX
1000:1a76          50                             PUSH AX
1000:1a77          50                             PUSH AX
1000:1a78          b82e00                         MOV AX,0x2e
1000:1a7b          50                             PUSH AX
1000:1a7c          9a02007503                     CALLF 0x0000:3752
1000:1a81          83c406                         ADD SP,0x6
1000:1a84          a3d005                         MOV [0x5d0],AX
1000:1a87          8916d205                       MOV word ptr [0x5d2],DX
1000:1a8b          2bc0                           SUB AX,AX
1000:1a8d          50                             PUSH AX
1000:1a8e          50                             PUSH AX
1000:1a8f          b82f00                         MOV AX,0x2f
1000:1a92          50                             PUSH AX
1000:1a93          9a02007503                     CALLF 0x0000:3752
1000:1a98          83c406                         ADD SP,0x6
1000:1a9b          a3d405                         MOV [0x5d4],AX
1000:1a9e          8916d605                       MOV word ptr [0x5d6],DX
1000:1aa2          e9be00                         JMP 0x1000:1b63
LAB_1000_1aa5:
1000:1aa5          2bc0                           SUB AX,AX
1000:1aa7          50                             PUSH AX
1000:1aa8          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:1aab          8a874c05                       MOV AL,byte ptr [BX + 0x54c]
1000:1aaf          2ae4                           SUB AH,AH
1000:1ab1          50                             PUSH AX
1000:1ab2          d1e3                           SHL BX,0x1
1000:1ab4          ffb75604                       PUSH word ptr [BX + 0x456]
1000:1ab8          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1abb          2d1e00                         SUB AX,0x1e
1000:1abe          50                             PUSH AX
1000:1abf          ff36ee05                       PUSH word ptr [0x5ee]
1000:1ac3          ff36ec05                       PUSH word ptr [0x5ec]
LAB_1000_1ac7:
1000:1ac7          9a59059502                     CALLF 0x0000:2ea9
1000:1acc          83c40c                         ADD SP,0xc
1000:1acf          e99100                         JMP 0x1000:1b63
LAB_1000_1ad2:
1000:1ad2          837e063d                       CMP word ptr [BP + 0x6],0x3d
1000:1ad6          732a                           JNC 0x1000:1b02
1000:1ad8          837e062b                       CMP word ptr [BP + 0x6],0x2b
1000:1adc          7624                           JBE 0x1000:1b02
1000:1ade          2bc0                           SUB AX,AX
1000:1ae0          50                             PUSH AX
1000:1ae1          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:1ae4          8a874c05                       MOV AL,byte ptr [BX + 0x54c]
1000:1ae8          2ae4                           SUB AH,AH
1000:1aea          50                             PUSH AX
1000:1aeb          d1e3                           SHL BX,0x1
1000:1aed          ffb75604                       PUSH word ptr [BX + 0x456]
1000:1af1          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1af4          2d2b00                         SUB AX,0x2b
1000:1af7          50                             PUSH AX
1000:1af8          ff36e205                       PUSH word ptr [0x5e2]
1000:1afc          ff36e005                       PUSH word ptr [0x5e0]
1000:1b00          ebc5                           JMP 0x1000:1ac7
LAB_1000_1b02:
1000:1b02          837e065a                       CMP word ptr [BP + 0x6],0x5a
1000:1b06          732a                           JNC 0x1000:1b32
1000:1b08          837e063c                       CMP word ptr [BP + 0x6],0x3c
1000:1b0c          7624                           JBE 0x1000:1b32
1000:1b0e          2bc0                           SUB AX,AX
1000:1b10          50                             PUSH AX
1000:1b11          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:1b14          8a874c05                       MOV AL,byte ptr [BX + 0x54c]
1000:1b18          2ae4                           SUB AH,AH
1000:1b1a          50                             PUSH AX
1000:1b1b          d1e3                           SHL BX,0x1
1000:1b1d          ffb75604                       PUSH word ptr [BX + 0x456]
1000:1b21          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1b24          2d3c00                         SUB AX,0x3c
1000:1b27          50                             PUSH AX
1000:1b28          ff36e605                       PUSH word ptr [0x5e6]
1000:1b2c          ff36e405                       PUSH word ptr [0x5e4]
1000:1b30          eb95                           JMP 0x1000:1ac7
LAB_1000_1b32:
1000:1b32          837e067b                       CMP word ptr [BP + 0x6],0x7b
1000:1b36          732b                           JNC 0x1000:1b63
1000:1b38          837e0659                       CMP word ptr [BP + 0x6],0x59
1000:1b3c          7625                           JBE 0x1000:1b63
1000:1b3e          2bc0                           SUB AX,AX
1000:1b40          50                             PUSH AX
1000:1b41          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:1b44          8a874c05                       MOV AL,byte ptr [BX + 0x54c]
1000:1b48          2ae4                           SUB AH,AH
1000:1b4a          50                             PUSH AX
1000:1b4b          d1e3                           SHL BX,0x1
1000:1b4d          ffb75604                       PUSH word ptr [BX + 0x456]
1000:1b51          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:1b54          2d5900                         SUB AX,0x59
1000:1b57          50                             PUSH AX
1000:1b58          ff36ea05                       PUSH word ptr [0x5ea]
1000:1b5c          ff36e805                       PUSH word ptr [0x5e8]
1000:1b60          e964ff                         JMP 0x1000:1ac7
LAB_1000_1b63:
1000:1b63          8be5                           MOV SP,BP
1000:1b65          5d                             POP BP
1000:1b66          cb                             RETF
FUN_1000_1b67:
1000:1b67          55                             PUSH BP
1000:1b68          8bec                           MOV BP,SP
1000:1b6a          81ec8800                       SUB SP,0x88
1000:1b6e          c78678ff0000                   MOV word ptr [BP + 0xff78],0x0
1000:1b74          c7867cff1400                   MOV word ptr [BP + 0xff7c],0x14
1000:1b7a          c7867affaa00                   MOV word ptr [BP + 0xff7a],0xaa
1000:1b80          c7867effb300                   MOV word ptr [BP + 0xff7e],0xb3
1000:1b86          0e                             PUSH CS
1000:1b87          e862fb                         CALL 0x1000:16ec
1000:1b8a          8e06400f                       MOV ES,word ptr [0xf40]
1000:1b8e          26c606460300                   MOV byte ptr ES:[0x346],0x0
1000:1b94          ff36ca05                       PUSH word ptr [0x5ca]
1000:1b98          ff36c805                       PUSH word ptr [0x5c8]
1000:1b9c          9a00019502                     CALLF 0x0000:2a50
1000:1ba1          83c404                         ADD SP,0x4
1000:1ba4          8e06420f                       MOV ES,word ptr [0xf42]
1000:1ba8          26803e140000                   CMP byte ptr ES:[0x14],0x0
1000:1bae          7503                           JNZ 0x1000:1bb3
1000:1bb0          e98b01                         JMP 0x1000:1d3e
LAB_1000_1bb3:
1000:1bb3          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:1bb7          26833e0e0003                   CMP word ptr ES:[0xe],0x3
1000:1bbd          7420                           JZ 0x1000:1bdf
1000:1bbf          26833e0e0001                   CMP word ptr ES:[0xe],0x1
1000:1bc5          7418                           JZ 0x1000:1bdf
1000:1bc7          26833e0e0007                   CMP word ptr ES:[0xe],0x7
1000:1bcd          7410                           JZ 0x1000:1bdf
1000:1bcf          26833e0e0005                   CMP word ptr ES:[0xe],0x5
1000:1bd5          7408                           JZ 0x1000:1bdf
1000:1bd7          26833e0e0004                   CMP word ptr ES:[0xe],0x4
1000:1bdd          751d                           JNZ 0x1000:1bfc
LAB_1000_1bdf:
1000:1bdf          9ae606e508                     CALLF 0x0000:9536
1000:1be4          9a0c05e508                     CALLF 0x0000:935c
1000:1be9          ff36f605                       PUSH word ptr [0x5f6]
1000:1bed          ff36f405                       PUSH word ptr [0x5f4]
1000:1bf1          9a0806e508                     CALLF 0x0000:9458
1000:1bf6          83c404                         ADD SP,0x4
1000:1bf9          e94201                         JMP 0x1000:1d3e
LAB_1000_1bfc:
1000:1bfc          a1f805                         MOV AX,[0x5f8]
1000:1bff          8b16fa05                       MOV DX,word ptr [0x5fa]
1000:1c03          894684                         MOV word ptr [BP + -0x7c],AX
1000:1c06          895686                         MOV word ptr [BP + -0x7a],DX
1000:1c09          894688                         MOV word ptr [BP + -0x78],AX
1000:1c0c          89568a                         MOV word ptr [BP + -0x76],DX
1000:1c0f          a1fc05                         MOV AX,[0x5fc]
1000:1c12          8b16fe05                       MOV DX,word ptr [0x5fe]
1000:1c16          89468c                         MOV word ptr [BP + -0x74],AX
1000:1c19          89568e                         MOV word ptr [BP + -0x72],DX
1000:1c1c          a10006                         MOV AX,[0x600]
1000:1c1f          8b160206                       MOV DX,word ptr [0x602]
1000:1c23          894690                         MOV word ptr [BP + -0x70],AX
1000:1c26          895692                         MOV word ptr [BP + -0x6e],DX
1000:1c29          a10406                         MOV AX,[0x604]
1000:1c2c          8b160606                       MOV DX,word ptr [0x606]
1000:1c30          894694                         MOV word ptr [BP + -0x6c],AX
1000:1c33          895696                         MOV word ptr [BP + -0x6a],DX
1000:1c36          a1fc05                         MOV AX,[0x5fc]
1000:1c39          8b16fe05                       MOV DX,word ptr [0x5fe]
1000:1c3d          894698                         MOV word ptr [BP + -0x68],AX
1000:1c40          89569a                         MOV word ptr [BP + -0x66],DX
1000:1c43          a10006                         MOV AX,[0x600]
1000:1c46          8b160206                       MOV DX,word ptr [0x602]
1000:1c4a          89469c                         MOV word ptr [BP + -0x64],AX
1000:1c4d          89569e                         MOV word ptr [BP + -0x62],DX
1000:1c50          a10406                         MOV AX,[0x604]
1000:1c53          8b160606                       MOV DX,word ptr [0x606]
1000:1c57          8946a0                         MOV word ptr [BP + -0x60],AX
1000:1c5a          8956a2                         MOV word ptr [BP + -0x5e],DX
1000:1c5d          a1fc05                         MOV AX,[0x5fc]
1000:1c60          8b16fe05                       MOV DX,word ptr [0x5fe]
1000:1c64          8946a4                         MOV word ptr [BP + -0x5c],AX
1000:1c67          8956a6                         MOV word ptr [BP + -0x5a],DX
1000:1c6a          a10006                         MOV AX,[0x600]
1000:1c6d          8b160206                       MOV DX,word ptr [0x602]
1000:1c71          8946a8                         MOV word ptr [BP + -0x58],AX
1000:1c74          8956aa                         MOV word ptr [BP + -0x56],DX
1000:1c77          a10406                         MOV AX,[0x604]
1000:1c7a          8b160606                       MOV DX,word ptr [0x606]
1000:1c7e          8946ac                         MOV word ptr [BP + -0x54],AX
1000:1c81          8956ae                         MOV word ptr [BP + -0x52],DX
1000:1c84          a1fc05                         MOV AX,[0x5fc]
1000:1c87          8b16fe05                       MOV DX,word ptr [0x5fe]
1000:1c8b          8946b0                         MOV word ptr [BP + -0x50],AX
1000:1c8e          8956b2                         MOV word ptr [BP + -0x4e],DX
1000:1c91          a10006                         MOV AX,[0x600]
1000:1c94          8b160206                       MOV DX,word ptr [0x602]
1000:1c98          8946b4                         MOV word ptr [BP + -0x4c],AX
1000:1c9b          8956b6                         MOV word ptr [BP + -0x4a],DX
1000:1c9e          a10406                         MOV AX,[0x604]
1000:1ca1          8b160606                       MOV DX,word ptr [0x606]
1000:1ca5          8946b8                         MOV word ptr [BP + -0x48],AX
1000:1ca8          8956ba                         MOV word ptr [BP + -0x46],DX
1000:1cab          a1fc05                         MOV AX,[0x5fc]
1000:1cae          8b16fe05                       MOV DX,word ptr [0x5fe]
1000:1cb2          8946bc                         MOV word ptr [BP + -0x44],AX
1000:1cb5          8956be                         MOV word ptr [BP + -0x42],DX
1000:1cb8          a10006                         MOV AX,[0x600]
1000:1cbb          8b160206                       MOV DX,word ptr [0x602]
1000:1cbf          8946c0                         MOV word ptr [BP + -0x40],AX
1000:1cc2          8956c2                         MOV word ptr [BP + -0x3e],DX
1000:1cc5          a10406                         MOV AX,[0x604]
1000:1cc8          8b160606                       MOV DX,word ptr [0x606]
1000:1ccc          8946c4                         MOV word ptr [BP + -0x3c],AX
1000:1ccf          8956c6                         MOV word ptr [BP + -0x3a],DX
1000:1cd2          a1fc05                         MOV AX,[0x5fc]
1000:1cd5          8b16fe05                       MOV DX,word ptr [0x5fe]
1000:1cd9          8946c8                         MOV word ptr [BP + -0x38],AX
1000:1cdc          8956ca                         MOV word ptr [BP + -0x36],DX
1000:1cdf          a10006                         MOV AX,[0x600]
1000:1ce2          8b160206                       MOV DX,word ptr [0x602]
1000:1ce6          8946cc                         MOV word ptr [BP + -0x34],AX
1000:1ce9          8956ce                         MOV word ptr [BP + -0x32],DX
1000:1cec          a10406                         MOV AX,[0x604]
1000:1cef          8b160606                       MOV DX,word ptr [0x606]
1000:1cf3          8946d0                         MOV word ptr [BP + -0x30],AX
1000:1cf6          8956d2                         MOV word ptr [BP + -0x2e],DX
1000:1cf9          a1fc05                         MOV AX,[0x5fc]
1000:1cfc          8b16fe05                       MOV DX,word ptr [0x5fe]
1000:1d00          8946d4                         MOV word ptr [BP + -0x2c],AX
1000:1d03          8956d6                         MOV word ptr [BP + -0x2a],DX
1000:1d06          a10006                         MOV AX,[0x600]
1000:1d09          8b160206                       MOV DX,word ptr [0x602]
1000:1d0d          8946d8                         MOV word ptr [BP + -0x28],AX
1000:1d10          8956da                         MOV word ptr [BP + -0x26],DX
1000:1d13          a10406                         MOV AX,[0x604]
1000:1d16          8b160606                       MOV DX,word ptr [0x606]
1000:1d1a          8946dc                         MOV word ptr [BP + -0x24],AX
1000:1d1d          8956de                         MOV word ptr [BP + -0x22],DX
1000:1d20          a1fc05                         MOV AX,[0x5fc]
1000:1d23          8b16fe05                       MOV DX,word ptr [0x5fe]
1000:1d27          8946e0                         MOV word ptr [BP + -0x20],AX
1000:1d2a          8956e2                         MOV word ptr [BP + -0x1e],DX
1000:1d2d          8d4684                         LEA AX,[BP + -0x7c]
1000:1d30          16                             PUSH SS
1000:1d31          50                             PUSH AX
1000:1d32          b81800                         MOV AX,0x18
1000:1d35          50                             PUSH AX
1000:1d36          9a3808e508                     CALLF 0x0000:9688
1000:1d3b          83c406                         ADD SP,0x6
LAB_1000_1d3e:
1000:1d3e          0e                             PUSH CS
1000:1d3f          e8c007                         CALL 0x1000:2502
1000:1d42          9aaf0e0000                     CALLF 0x0000:0eaf
1000:1d47          c746e60000                     MOV word ptr [BP + -0x1a],0x0
1000:1d4c          c746e40000                     MOV word ptr [BP + -0x1c],0x0
LAB_1000_1d51:
1000:1d51          c746f40000                     MOV word ptr [BP + -0xc],0x0
LAB_1000_1d56:
1000:1d56          8b5ef4                         MOV BX,word ptr [BP + -0xc]
1000:1d59          8a874c05                       MOV AL,byte ptr [BX + 0x54c]
1000:1d5d          2ae4                           SUB AH,AH
1000:1d5f          50                             PUSH AX
1000:1d60          d1e3                           SHL BX,0x1
1000:1d62          ffb75604                       PUSH word ptr [BX + 0x456]
1000:1d66          ff76f4                         PUSH word ptr [BP + -0xc]
1000:1d69          0e                             PUSH CS
1000:1d6a          e8c5fb                         CALL 0x1000:1932
1000:1d6d          83c406                         ADD SP,0x6
1000:1d70          b80100                         MOV AX,0x1
1000:1d73          50                             PUSH AX
1000:1d74          0e                             PUSH CS
1000:1d75          e8de06                         CALL 0x1000:2456
1000:1d78          83c402                         ADD SP,0x2
1000:1d7b          ff46f4                         INC word ptr [BP + -0xc]
1000:1d7e          837ef41f                       CMP word ptr [BP + -0xc],0x1f
1000:1d82          7cd2                           JL 0x1000:1d56
1000:1d84          9a640d9502                     CALLF 0x0000:36b4
1000:1d89          ff46e4                         INC word ptr [BP + -0x1c]
1000:1d8c          837ee402                       CMP word ptr [BP + -0x1c],0x2
1000:1d90          7cbf                           JL 0x1000:1d51
1000:1d92          c746f41f00                     MOV word ptr [BP + -0xc],0x1f
1000:1d97          e93c03                         JMP 0x1000:20d6
LAB_1000_1d9a:
1000:1d9a          c6468000                       MOV byte ptr [BP + -0x80],0x0
LAB_1000_1d9e:
1000:1d9e          c746e40000                     MOV word ptr [BP + -0x1c],0x0
LAB_1000_1da3:
1000:1da3          b80300                         MOV AX,0x3
1000:1da6          50                             PUSH AX
1000:1da7          0e                             PUSH CS
1000:1da8          e8ab06                         CALL 0x1000:2456
1000:1dab          83c402                         ADD SP,0x2
1000:1dae          a09205                         MOV AL,[0x592]
1000:1db1          2ae4                           SUB AH,AH
1000:1db3          50                             PUSH AX
1000:1db4          ff36e204                       PUSH word ptr [0x4e2]
1000:1db8          b84600                         MOV AX,0x46
1000:1dbb          50                             PUSH AX
1000:1dbc          0e                             PUSH CS
1000:1dbd          e872fb                         CALL 0x1000:1932
1000:1dc0          83c406                         ADD SP,0x6
1000:1dc3          b80300                         MOV AX,0x3
1000:1dc6          50                             PUSH AX
1000:1dc7          0e                             PUSH CS
1000:1dc8          e88b06                         CALL 0x1000:2456
1000:1dcb          83c402                         ADD SP,0x2
1000:1dce          a09305                         MOV AL,[0x593]
1000:1dd1          2ae4                           SUB AH,AH
1000:1dd3          50                             PUSH AX
1000:1dd4          ff36e404                       PUSH word ptr [0x4e4]
1000:1dd8          b84700                         MOV AX,0x47
1000:1ddb          50                             PUSH AX
1000:1ddc          0e                             PUSH CS
1000:1ddd          e852fb                         CALL 0x1000:1932
1000:1de0          83c406                         ADD SP,0x6
1000:1de3          ff46e4                         INC word ptr [BP + -0x1c]
1000:1de6          837ee406                       CMP word ptr [BP + -0x1c],0x6
1000:1dea          7cb7                           JL 0x1000:1da3
1000:1dec          c6468201                       MOV byte ptr [BP + -0x7e],0x1
LAB_1000_1df0:
1000:1df0          837ef455                       CMP word ptr [BP + -0xc],0x55
1000:1df4          7568                           JNZ 0x1000:1e5e
1000:1df6          807e8000                       CMP byte ptr [BP + -0x80],0x0
1000:1dfa          7410                           JZ 0x1000:1e0c
1000:1dfc          ff36d205                       PUSH word ptr [0x5d2]
1000:1e00          ff36d005                       PUSH word ptr [0x5d0]
1000:1e04          9aa1017503                     CALLF 0x0000:38f1
1000:1e09          83c404                         ADD SP,0x4
LAB_1000_1e0c:
1000:1e0c          c746e40000                     MOV word ptr [BP + -0x1c],0x0
LAB_1000_1e11:
1000:1e11          a0a105                         MOV AL,[0x5a1]
1000:1e14          2ae4                           SUB AH,AH
1000:1e16          50                             PUSH AX
1000:1e17          ff360005                       PUSH word ptr [0x500]
1000:1e1b          b85500                         MOV AX,0x55
1000:1e1e          50                             PUSH AX
1000:1e1f          0e                             PUSH CS
1000:1e20          e80ffb                         CALL 0x1000:1932
1000:1e23          83c406                         ADD SP,0x6
1000:1e26          b80300                         MOV AX,0x3
1000:1e29          50                             PUSH AX
1000:1e2a          0e                             PUSH CS
1000:1e2b          e82806                         CALL 0x1000:2456
1000:1e2e          83c402                         ADD SP,0x2
1000:1e31          a0a205                         MOV AL,[0x5a2]
1000:1e34          2ae4                           SUB AH,AH
1000:1e36          50                             PUSH AX
1000:1e37          ff360205                       PUSH word ptr [0x502]
1000:1e3b          b85600                         MOV AX,0x56
1000:1e3e          50                             PUSH AX
1000:1e3f          0e                             PUSH CS
1000:1e40          e8effa                         CALL 0x1000:1932
1000:1e43          83c406                         ADD SP,0x6
1000:1e46          b80300                         MOV AX,0x3
1000:1e49          50                             PUSH AX
1000:1e4a          0e                             PUSH CS
1000:1e4b          e80806                         CALL 0x1000:2456
1000:1e4e          83c402                         ADD SP,0x2
1000:1e51          ff46e4                         INC word ptr [BP + -0x1c]
1000:1e54          837ee404                       CMP word ptr [BP + -0x1c],0x4
1000:1e58          7cb7                           JL 0x1000:1e11
1000:1e5a          c6468201                       MOV byte ptr [BP + -0x7e],0x1
LAB_1000_1e5e:
1000:1e5e          837ef479                       CMP word ptr [BP + -0xc],0x79
1000:1e62          7552                           JNZ 0x1000:1eb6
1000:1e64          c746e40000                     MOV word ptr [BP + -0x1c],0x0
LAB_1000_1e69:
1000:1e69          b80200                         MOV AX,0x2
1000:1e6c          50                             PUSH AX
1000:1e6d          0e                             PUSH CS
1000:1e6e          e8e505                         CALL 0x1000:2456
1000:1e71          83c402                         ADD SP,0x2
1000:1e74          a0c505                         MOV AL,[0x5c5]
1000:1e77          2ae4                           SUB AH,AH
1000:1e79          50                             PUSH AX
1000:1e7a          ff364805                       PUSH word ptr [0x548]
1000:1e7e          b87900                         MOV AX,0x79
1000:1e81          50                             PUSH AX
1000:1e82          0e                             PUSH CS
1000:1e83          e8acfa                         CALL 0x1000:1932
1000:1e86          83c406                         ADD SP,0x6
1000:1e89          b80200                         MOV AX,0x2
1000:1e8c          50                             PUSH AX
1000:1e8d          0e                             PUSH CS
1000:1e8e          e8c505                         CALL 0x1000:2456
1000:1e91          83c402                         ADD SP,0x2
1000:1e94          a0c605                         MOV AL,[0x5c6]
1000:1e97          2ae4                           SUB AH,AH
1000:1e99          50                             PUSH AX
1000:1e9a          ff364a05                       PUSH word ptr [0x54a]
1000:1e9e          b87a00                         MOV AX,0x7a
1000:1ea1          50                             PUSH AX
1000:1ea2          0e                             PUSH CS
1000:1ea3          e88cfa                         CALL 0x1000:1932
1000:1ea6          83c406                         ADD SP,0x6
1000:1ea9          ff46e4                         INC word ptr [BP + -0x1c]
1000:1eac          837ee404                       CMP word ptr [BP + -0x1c],0x4
1000:1eb0          7cb7                           JL 0x1000:1e69
1000:1eb2          c6468201                       MOV byte ptr [BP + -0x7e],0x1
LAB_1000_1eb6:
1000:1eb6          837ef461                       CMP word ptr [BP + -0xc],0x61
1000:1eba          7537                           JNZ 0x1000:1ef3
1000:1ebc          c746e40100                     MOV word ptr [BP + -0x1c],0x1
LAB_1000_1ec1:
1000:1ec1          2bc0                           SUB AX,AX
1000:1ec3          50                             PUSH AX
1000:1ec4          b88700                         MOV AX,0x87
1000:1ec7          50                             PUSH AX
1000:1ec8          b87f00                         MOV AX,0x7f
1000:1ecb          50                             PUSH AX
1000:1ecc          ff76e4                         PUSH word ptr [BP + -0x1c]
1000:1ecf          ff36de05                       PUSH word ptr [0x5de]
1000:1ed3          ff36dc05                       PUSH word ptr [0x5dc]
1000:1ed7          9a59059502                     CALLF 0x0000:2ea9
1000:1edc          83c40c                         ADD SP,0xc
1000:1edf          b80100                         MOV AX,0x1
1000:1ee2          50                             PUSH AX
1000:1ee3          0e                             PUSH CS
1000:1ee4          e86f05                         CALL 0x1000:2456
1000:1ee7          83c402                         ADD SP,0x2
1000:1eea          ff46e4                         INC word ptr [BP + -0x1c]
1000:1eed          837ee406                       CMP word ptr [BP + -0x1c],0x6
1000:1ef1          7cce                           JL 0x1000:1ec1
LAB_1000_1ef3:
1000:1ef3          837ef464                       CMP word ptr [BP + -0xc],0x64
1000:1ef7          7516                           JNZ 0x1000:1f0f
1000:1ef9          807e8000                       CMP byte ptr [BP + -0x80],0x0
1000:1efd          7410                           JZ 0x1000:1f0f
1000:1eff          ff36d605                       PUSH word ptr [0x5d6]
1000:1f03          ff36d405                       PUSH word ptr [0x5d4]
1000:1f07          9ac8017503                     CALLF 0x0000:3918
1000:1f0c          83c404                         ADD SP,0x4
LAB_1000_1f0f:
1000:1f0f          837ef467                       CMP word ptr [BP + -0xc],0x67
1000:1f13          7403                           JZ 0x1000:1f18
1000:1f15          e97a01                         JMP 0x1000:2092
LAB_1000_1f18:
1000:1f18          c746e40000                     MOV word ptr [BP + -0x1c],0x0
LAB_1000_1f1d:
1000:1f1d          b80200                         MOV AX,0x2
1000:1f20          50                             PUSH AX
1000:1f21          0e                             PUSH CS
1000:1f22          e83105                         CALL 0x1000:2456
1000:1f25          83c402                         ADD SP,0x2
1000:1f28          a0b305                         MOV AL,[0x5b3]
1000:1f2b          2ae4                           SUB AH,AH
1000:1f2d          50                             PUSH AX
1000:1f2e          ff362405                       PUSH word ptr [0x524]
1000:1f32          b86700                         MOV AX,0x67
1000:1f35          50                             PUSH AX
1000:1f36          0e                             PUSH CS
1000:1f37          e8f8f9                         CALL 0x1000:1932
1000:1f3a          83c406                         ADD SP,0x6
1000:1f3d          b80200                         MOV AX,0x2
1000:1f40          50                             PUSH AX
1000:1f41          0e                             PUSH CS
1000:1f42          e81105                         CALL 0x1000:2456
1000:1f45          83c402                         ADD SP,0x2
1000:1f48          a0b405                         MOV AL,[0x5b4]
1000:1f4b          2ae4                           SUB AH,AH
1000:1f4d          50                             PUSH AX
1000:1f4e          ff362605                       PUSH word ptr [0x526]
1000:1f52          b86800                         MOV AX,0x68
1000:1f55          50                             PUSH AX
1000:1f56          0e                             PUSH CS
1000:1f57          e8d8f9                         CALL 0x1000:1932
1000:1f5a          83c406                         ADD SP,0x6
1000:1f5d          b80200                         MOV AX,0x2
1000:1f60          50                             PUSH AX
1000:1f61          0e                             PUSH CS
1000:1f62          e8f104                         CALL 0x1000:2456
1000:1f65          83c402                         ADD SP,0x2
1000:1f68          a0b505                         MOV AL,[0x5b5]
1000:1f6b          2ae4                           SUB AH,AH
1000:1f6d          50                             PUSH AX
1000:1f6e          ff362805                       PUSH word ptr [0x528]
1000:1f72          b86900                         MOV AX,0x69
1000:1f75          50                             PUSH AX
1000:1f76          0e                             PUSH CS
1000:1f77          e8b8f9                         CALL 0x1000:1932
1000:1f7a          83c406                         ADD SP,0x6
1000:1f7d          b80200                         MOV AX,0x2
1000:1f80          50                             PUSH AX
1000:1f81          0e                             PUSH CS
1000:1f82          e8d104                         CALL 0x1000:2456
1000:1f85          83c402                         ADD SP,0x2
1000:1f88          a0b605                         MOV AL,[0x5b6]
1000:1f8b          2ae4                           SUB AH,AH
1000:1f8d          50                             PUSH AX
1000:1f8e          ff362a05                       PUSH word ptr [0x52a]
1000:1f92          b86a00                         MOV AX,0x6a
1000:1f95          50                             PUSH AX
1000:1f96          0e                             PUSH CS
1000:1f97          e898f9                         CALL 0x1000:1932
1000:1f9a          83c406                         ADD SP,0x6
1000:1f9d          b80200                         MOV AX,0x2
1000:1fa0          50                             PUSH AX
1000:1fa1          0e                             PUSH CS
LAB_1000_1fa2:
1000:1fa2          e8b104                         CALL 0x1000:2456
1000:1fa5          83c402                         ADD SP,0x2
1000:1fa8          a0b705                         MOV AL,[0x5b7]
1000:1fab          2ae4                           SUB AH,AH
1000:1fad          50                             PUSH AX
1000:1fae          ff362c05                       PUSH word ptr [0x52c]
1000:1fb2          b86b00                         MOV AX,0x6b
1000:1fb5          50                             PUSH AX
1000:1fb6          0e                             PUSH CS
1000:1fb7          e878f9                         CALL 0x1000:1932
1000:1fba          83c406                         ADD SP,0x6
1000:1fbd          b80200                         MOV AX,0x2
1000:1fc0          50                             PUSH AX
1000:1fc1          0e                             PUSH CS
1000:1fc2          e89104                         CALL 0x1000:2456
1000:1fc5          83c402                         ADD SP,0x2
LAB_1000_1fc8:
1000:1fc8          a0b805                         MOV AL,[0x5b8]
1000:1fcb          2ae4                           SUB AH,AH
1000:1fcd          50                             PUSH AX
1000:1fce          ff362e05                       PUSH word ptr [0x52e]
1000:1fd2          b86c00                         MOV AX,0x6c
1000:1fd5          50                             PUSH AX
1000:1fd6          0e                             PUSH CS
1000:1fd7          e858f9                         CALL 0x1000:1932
1000:1fda          83c406                         ADD SP,0x6
1000:1fdd          b80200                         MOV AX,0x2
1000:1fe0          50                             PUSH AX
1000:1fe1          0e                             PUSH CS
1000:1fe2          e87104                         CALL 0x1000:2456
1000:1fe5          83c402                         ADD SP,0x2
1000:1fe8          a0b905                         MOV AL,[0x5b9]
1000:1feb          2ae4                           SUB AH,AH
1000:1fed          50                             PUSH AX
LAB_1000_1fee:
1000:1fee          ff363005                       PUSH word ptr [0x530]
1000:1ff2          b86d00                         MOV AX,0x6d
1000:1ff5          50                             PUSH AX
1000:1ff6          0e                             PUSH CS
1000:1ff7          e838f9                         CALL 0x1000:1932
1000:1ffa          83c406                         ADD SP,0x6
1000:1ffd          b80200                         MOV AX,0x2
1000:2000          50                             PUSH AX
1000:2001          0e                             PUSH CS
1000:2002          e85104                         CALL 0x1000:2456
1000:2005          83c402                         ADD SP,0x2
1000:2008          a0ba05                         MOV AL,[0x5ba]
1000:200b          2ae4                           SUB AH,AH
1000:200d          50                             PUSH AX
1000:200e          ff363205                       PUSH word ptr [0x532]
1000:2012          b86e00                         MOV AX,0x6e
1000:2015          50                             PUSH AX
1000:2016          0e                             PUSH CS
1000:2017          e818f9                         CALL 0x1000:1932
1000:201a          83c406                         ADD SP,0x6
1000:201d          b80200                         MOV AX,0x2
1000:2020          50                             PUSH AX
1000:2021          0e                             PUSH CS
1000:2022          e83104                         CALL 0x1000:2456
1000:2025          83c402                         ADD SP,0x2
1000:2028          a0bb05                         MOV AL,[0x5bb]
1000:202b          2ae4                           SUB AH,AH
1000:202d          50                             PUSH AX
1000:202e          ff363405                       PUSH word ptr [0x534]
1000:2032          b86f00                         MOV AX,0x6f
1000:2035          50                             PUSH AX
1000:2036          0e                             PUSH CS
1000:2037          e8f8f8                         CALL 0x1000:1932
1000:203a          83c406                         ADD SP,0x6
1000:203d          b80200                         MOV AX,0x2
1000:2040          50                             PUSH AX
1000:2041          0e                             PUSH CS
1000:2042          e81104                         CALL 0x1000:2456
1000:2045          83c402                         ADD SP,0x2
1000:2048          a0bc05                         MOV AL,[0x5bc]
1000:204b          2ae4                           SUB AH,AH
1000:204d          50                             PUSH AX
1000:204e          ff363605                       PUSH word ptr [0x536]
1000:2052          b87000                         MOV AX,0x70
1000:2055          50                             PUSH AX
1000:2056          0e                             PUSH CS
1000:2057          e8d8f8                         CALL 0x1000:1932
1000:205a          83c406                         ADD SP,0x6
1000:205d          b80200                         MOV AX,0x2
1000:2060          50                             PUSH AX
1000:2061          0e                             PUSH CS
1000:2062          e8f103                         CALL 0x1000:2456
1000:2065          83c402                         ADD SP,0x2
1000:2068          a0bd05                         MOV AL,[0x5bd]
1000:206b          2ae4                           SUB AH,AH
1000:206d          50                             PUSH AX
1000:206e          ff363805                       PUSH word ptr [0x538]
1000:2072          b87100                         MOV AX,0x71
1000:2075          50                             PUSH AX
1000:2076          0e                             PUSH CS
1000:2077          e8b8f8                         CALL 0x1000:1932
1000:207a          83c406                         ADD SP,0x6
1000:207d          ff46e4                         INC word ptr [BP + -0x1c]
1000:2080          837ee402                       CMP word ptr [BP + -0x1c],0x2
1000:2084          7d03                           JGE 0x1000:2089
1000:2086          e994fe                         JMP 0x1000:1f1d
LAB_1000_2089:
1000:2089          c6468201                       MOV byte ptr [BP + -0x7e],0x1
1000:208d          c746f47100                     MOV word ptr [BP + -0xc],0x71
LAB_1000_2092:
1000:2092          807e8200                       CMP byte ptr [BP + -0x7e],0x0
1000:2096          7525                           JNZ 0x1000:20bd
1000:2098          b80100                         MOV AX,0x1
1000:209b          50                             PUSH AX
1000:209c          0e                             PUSH CS
1000:209d          e8b603                         CALL 0x1000:2456
1000:20a0          83c402                         ADD SP,0x2
1000:20a3          8b5ef4                         MOV BX,word ptr [BP + -0xc]
1000:20a6          8a874c05                       MOV AL,byte ptr [BX + 0x54c]
1000:20aa          2ae4                           SUB AH,AH
1000:20ac          50                             PUSH AX
1000:20ad          d1e3                           SHL BX,0x1
1000:20af          ffb75604                       PUSH word ptr [BX + 0x456]
1000:20b3          ff76f4                         PUSH word ptr [BP + -0xc]
1000:20b6          0e                             PUSH CS
1000:20b7          e878f8                         CALL 0x1000:1932
1000:20ba          83c406                         ADD SP,0x6
LAB_1000_20bd:
1000:20bd          9a3219aa05                     CALLF 0x0000:73d2
1000:20c2          0bc0                           OR AX,AX
1000:20c4          740d                           JZ 0x1000:20d3
1000:20c6          9a4619aa05                     CALLF 0x0000:73e6
1000:20cb          8946e6                         MOV word ptr [BP + -0x1a],AX
1000:20ce          3d7800                         CMP AX,0x78
1000:20d1          7451                           JZ 0x1000:2124
LAB_1000_20d3:
1000:20d3          ff46f4                         INC word ptr [BP + -0xc]
LAB_1000_20d6:
1000:20d6          837ef47a                       CMP word ptr [BP + -0xc],0x7a
1000:20da          7d48                           JGE 0x1000:2124
1000:20dc          c6468200                       MOV byte ptr [BP + -0x7e],0x0
1000:20e0          837ef446                       CMP word ptr [BP + -0xc],0x46
1000:20e4          7403                           JZ 0x1000:20e9
1000:20e6          e907fd                         JMP 0x1000:1df0
LAB_1000_20e9:
1000:20e9          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:20ed          26833e0e0004                   CMP word ptr ES:[0xe],0x4
1000:20f3          7503                           JNZ 0x1000:20f8
1000:20f5          e9a2fc                         JMP 0x1000:1d9a
LAB_1000_20f8:
1000:20f8          26833e0e0005                   CMP word ptr ES:[0xe],0x5
1000:20fe          7503                           JNZ 0x1000:2103
1000:2100          e997fc                         JMP 0x1000:1d9a
LAB_1000_2103:
1000:2103          9adc04e508                     CALLF 0x0000:932c
1000:2108          9a5c04e508                     CALLF 0x0000:92ac
1000:210d          ff36ce05                       PUSH word ptr [0x5ce]
1000:2111          ff36cc05                       PUSH word ptr [0x5cc]
1000:2115          9aa1017503                     CALLF 0x0000:38f1
1000:211a          83c404                         ADD SP,0x4
1000:211d          c6468001                       MOV byte ptr [BP + -0x80],0x1
1000:2121          e97afc                         JMP 0x1000:1d9e
LAB_1000_2124:
1000:2124          b80f00                         MOV AX,0xf
1000:2127          50                             PUSH AX
1000:2128          0e                             PUSH CS
1000:2129          e82a03                         CALL 0x1000:2456
1000:212c          83c402                         ADD SP,0x2
1000:212f          0e                             PUSH CS
1000:2130          e848f7                         CALL 0x1000:187b
1000:2133          8be5                           MOV SP,BP
1000:2135          5d                             POP BP
1000:2136          cb                             RETF
FUN_1000_2137:
1000:2137          55                             PUSH BP
1000:2138          8bec                           MOV BP,SP
1000:213a          83ec32                         SUB SP,0x32
1000:213d          b80000                         MOV AX,0x0
1000:2140          ba9403                         MOV DX,0x394
1000:2143          52                             PUSH DX
1000:2144          50                             PUSH AX
1000:2145          9a801baa05                     CALLF 0x0000:7620
1000:214a          83c404                         ADD SP,0x4
1000:214d          8d46fe                         LEA AX,[BP + -0x2]
1000:2150          16                             PUSH SS
1000:2151          50                             PUSH AX
1000:2152          b8cb06                         MOV AX,0x6cb
1000:2155          1e                             PUSH DS
1000:2156          50                             PUSH AX
1000:2157          9a06005102                     CALLF 0x0000:2516
1000:215c          83c408                         ADD SP,0x8
1000:215f          8946d2                         MOV word ptr [BP + -0x2e],AX
1000:2162          8956d4                         MOV word ptr [BP + -0x2c],DX
1000:2165          c45ed2                         LES BX,[BP + -0x2e]
1000:2168          268a4701                       MOV AL,byte ptr ES:[BX + 0x1]
1000:216c          98                             CBW
1000:216d          8e06440f                       MOV ES,word ptr [0xf44]
1000:2171          26a36f0b                       MOV ES:[0xb6f],AX
1000:2175          8ec2                           MOV DX,ES
1000:2177          268a4702                       MOV AL,byte ptr ES:[BX + 0x2]
1000:217b          98                             CBW
1000:217c          8946fc                         MOV word ptr [BP + -0x4],AX
1000:217f          50                             PUSH AX
1000:2180          9a66090000                     CALLF 0x0000:0966
1000:2185          83c402                         ADD SP,0x2
1000:2188          837efc00                       CMP word ptr [BP + -0x4],0x0
1000:218c          740d                           JZ 0x1000:219b
1000:218e          8e063e0f                       MOV ES,word ptr [0xf3e]
1000:2192          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:2195          26a37401                       MOV ES:[0x174],AX
1000:2199          eb0b                           JMP 0x1000:21a6
LAB_1000_219b:
1000:219b          8e063e0f                       MOV ES,word ptr [0xf3e]
1000:219f          26c70674010200                 MOV word ptr ES:[0x174],0x2
LAB_1000_21a6:
1000:21a6          c45ed2                         LES BX,[BP + -0x2e]
1000:21a9          268a4703                       MOV AL,byte ptr ES:[BX + 0x3]
1000:21ad          98                             CBW
1000:21ae          8946fc                         MOV word ptr [BP + -0x4],AX
1000:21b1          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:21b5          26a30e00                       MOV ES:[0xe],AX
1000:21b9          3d0100                         CMP AX,0x1
1000:21bc          751a                           JNZ 0x1000:21d8
1000:21be          8bc3                           MOV AX,BX
1000:21c0          8b56d4                         MOV DX,word ptr [BP + -0x2c]
1000:21c3          8946ce                         MOV word ptr [BP + -0x32],AX
1000:21c6          8956d0                         MOV word ptr [BP + -0x30],DX
1000:21c9          c45ece                         LES BX,[BP + -0x32]
1000:21cc          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:21d0          8e06460f                       MOV ES,word ptr [0xf46]
1000:21d4          26a3690b                       MOV ES:[0xb69],AX
LAB_1000_21d8:
1000:21d8          b8e880                         MOV AX,0x80e8
1000:21db          50                             PUSH AX
1000:21dc          9ae3049502                     CALLF 0x0000:2e33
1000:21e1          83c402                         ADD SP,0x2
1000:21e4          8e06480f                       MOV ES,word ptr [0xf48]
1000:21e8          26a33e03                       MOV ES:[0x33e],AX
1000:21ec          2689164003                     MOV word ptr ES:[0x340],DX
1000:21f1          52                             PUSH DX
1000:21f2          50                             PUSH AX
1000:21f3          9aa2030000                     CALLF 0x0000:03a2
1000:21f8          83c404                         ADD SP,0x4
1000:21fb          9a63100000                     CALLF 0x0000:1063
1000:2200          8d46d2                         LEA AX,[BP + -0x2e]
1000:2203          16                             PUSH SS
1000:2204          50                             PUSH AX
1000:2205          9a2d059502                     CALLF 0x0000:2e7d
1000:220a          83c404                         ADD SP,0x4
1000:220d          8d46fe                         LEA AX,[BP + -0x2]
1000:2210          16                             PUSH SS
1000:2211          50                             PUSH AX
1000:2212          b8d506                         MOV AX,0x6d5
1000:2215          1e                             PUSH DS
1000:2216          50                             PUSH AX
1000:2217          9a06005102                     CALLF 0x0000:2516
1000:221c          83c408                         ADD SP,0x8
1000:221f          8946d2                         MOV word ptr [BP + -0x2e],AX
1000:2222          8956d4                         MOV word ptr [BP + -0x2c],DX
1000:2225          c45ed2                         LES BX,[BP + -0x2e]
1000:2228          26f60740                       TEST byte ptr ES:[BX],0x40
1000:222c          740c                           JZ 0x1000:223a
1000:222e          8e06420f                       MOV ES,word ptr [0xf42]
1000:2232          26c6061400ff                   MOV byte ptr ES:[0x14],0xff
1000:2238          eb0a                           JMP 0x1000:2244
LAB_1000_223a:
1000:223a          8e06420f                       MOV ES,word ptr [0xf42]
1000:223e          26c606140000                   MOV byte ptr ES:[0x14],0x0
LAB_1000_2244:
1000:2244          8e46d4                         MOV ES,word ptr [BP + -0x2c]
1000:2247          26f60780                       TEST byte ptr ES:[BX],0x80
1000:224b          740c                           JZ 0x1000:2259
1000:224d          8e064a0f                       MOV ES,word ptr [0xf4a]
1000:2251          26c6061200ff                   MOV byte ptr ES:[0x12],0xff
1000:2257          eb0a                           JMP 0x1000:2263
LAB_1000_2259:
1000:2259          8e064a0f                       MOV ES,word ptr [0xf4a]
1000:225d          26c606120000                   MOV byte ptr ES:[0x12],0x0
LAB_1000_2263:
1000:2263          8d46d2                         LEA AX,[BP + -0x2e]
1000:2266          16                             PUSH SS
1000:2267          50                             PUSH AX
1000:2268          9a2d059502                     CALLF 0x0000:2e7d
1000:226d          83c404                         ADD SP,0x4
1000:2270          2bc0                           SUB AX,AX
1000:2272          50                             PUSH AX
1000:2273          50                             PUSH AX
1000:2274          b80800                         MOV AX,0x8
1000:2277          50                             PUSH AX
1000:2278          9a02007503                     CALLF 0x0000:3752
1000:227d          83c406                         ADD SP,0x6
1000:2280          8e064c0f                       MOV ES,word ptr [0xf4c]
1000:2284          26a36801                       MOV ES:[0x168],AX
1000:2288          2689166a01                     MOV word ptr ES:[0x16a],DX
1000:228d          8d46d6                         LEA AX,[BP + -0x2a]
1000:2290          16                             PUSH SS
1000:2291          50                             PUSH AX
1000:2292          9aa3090000                     CALLF 0x0000:09a3
1000:2297          83c404                         ADD SP,0x4
1000:229a          8d46d6                         LEA AX,[BP + -0x2a]
1000:229d          16                             PUSH SS
1000:229e          50                             PUSH AX
1000:229f          9a610f0000                     CALLF 0x0000:0f61
1000:22a4          83c404                         ADD SP,0x4
1000:22a7          b80100                         MOV AX,0x1
1000:22aa          50                             PUSH AX
1000:22ab          50                             PUSH AX
1000:22ac          9ac70f0000                     CALLF 0x0000:0fc7
1000:22b1          83c404                         ADD SP,0x4
1000:22b4          b80500                         MOV AX,0x5
1000:22b7          50                             PUSH AX
1000:22b8          9a240c0000                     CALLF 0x0000:0c24
1000:22bd          83c402                         ADD SP,0x2
1000:22c0          8d46d2                         LEA AX,[BP + -0x2e]
1000:22c3          16                             PUSH SS
1000:22c4          50                             PUSH AX
1000:22c5          9a2d059502                     CALLF 0x0000:2e7d
1000:22ca          83c404                         ADD SP,0x4
1000:22cd          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:22d1          26ff360e00                     PUSH word ptr ES:[0xe]
1000:22d6          9a3a02e508                     CALLF 0x0000:908a
1000:22db          83c402                         ADD SP,0x2
1000:22de          9a5c04e508                     CALLF 0x0000:92ac
1000:22e3          2bc0                           SUB AX,AX
1000:22e5          50                             PUSH AX
1000:22e6          9a0600e508                     CALLF 0x0000:8e56
1000:22eb          83c402                         ADD SP,0x2
1000:22ee          0e                             PUSH CS
1000:22ef          e875f8                         CALL 0x1000:1b67
1000:22f2          b86801                         MOV AX,0x168
1000:22f5          baef13                         MOV DX,0x13ef
1000:22f8          52                             PUSH DX
1000:22f9          50                             PUSH AX
1000:22fa          9a2d059502                     CALLF 0x0000:2e7d
1000:22ff          83c404                         ADD SP,0x4
1000:2302          8d46d2                         LEA AX,[BP + -0x2e]
1000:2305          16                             PUSH SS
1000:2306          50                             PUSH AX
1000:2307          9a2d059502                     CALLF 0x0000:2e7d
1000:230c          83c404                         ADD SP,0x4
1000:230f          b83e03                         MOV AX,0x33e
1000:2312          baef13                         MOV DX,0x13ef
1000:2315          52                             PUSH DX
1000:2316          50                             PUSH AX
1000:2317          9a2d059502                     CALLF 0x0000:2e7d
1000:231c          83c404                         ADD SP,0x4
1000:231f          8d46fe                         LEA AX,[BP + -0x2]
1000:2322          16                             PUSH SS
1000:2323          50                             PUSH AX
1000:2324          b8de06                         MOV AX,0x6de
1000:2327          1e                             PUSH DS
1000:2328          50                             PUSH AX
1000:2329          9a06005102                     CALLF 0x0000:2516
1000:232e          83c408                         ADD SP,0x8
1000:2331          a3c805                         MOV [0x5c8],AX
1000:2334          8916ca05                       MOV word ptr [0x5ca],DX
1000:2338          52                             PUSH DX
1000:2339          50                             PUSH AX
1000:233a          9a4f019502                     CALLF 0x0000:2a9f
1000:233f          83c404                         ADD SP,0x4
1000:2342          9adc04e508                     CALLF 0x0000:932c
1000:2347          9aca080000                     CALLF 0x0000:08ca
1000:234c          8e063e0f                       MOV ES,word ptr [0xf3e]
1000:2350          26833e740105                   CMP word ptr ES:[0x174],0x5
1000:2356          7505                           JNZ 0x1000:235d
1000:2358          9a7c100000                     CALLF 0x0000:107c
LAB_1000_235d:
1000:235d          8e064e0f                       MOV ES,word ptr [0xf4e]
1000:2361          26c70600000000                 MOV word ptr ES:[0x0],0x0
1000:2368          b80000                         MOV AX,0x0
1000:236b          baef13                         MOV DX,0x13ef
1000:236e          52                             PUSH DX
1000:236f          50                             PUSH AX
1000:2370          52                             PUSH DX
1000:2371          50                             PUSH AX
1000:2372          b83300                         MOV AX,0x33
1000:2375          50                             PUSH AX
1000:2376          9a5e19aa05                     CALLF 0x0000:73fe
1000:237b          83c40a                         ADD SP,0xa
1000:237e          2bc0                           SUB AX,AX
1000:2380          50                             PUSH AX
1000:2381          9aae0daa05                     CALLF 0x0000:684e
1000:2386          8be5                           MOV SP,BP
1000:2388          5d                             POP BP
1000:2389          cb                             RETF
FUN_1000_238a:
1000:238a          55                             PUSH BP
1000:238b          8bec                           MOV BP,SP
1000:238d          83ec06                         SUB SP,0x6
LAB_1000_2390:
1000:2390          8e06420f                       MOV ES,word ptr [0xf42]
1000:2394          26803e140000                   CMP byte ptr ES:[0x14],0x0
1000:239a          742d                           JZ 0x1000:23c9
1000:239c          9ac001e508                     CALLF 0x0000:9010
1000:23a1          0bc0                           OR AX,AX
1000:23a3          7524                           JNZ 0x1000:23c9
1000:23a5          803e961000                     CMP byte ptr [0x1096],0x0
1000:23aa          751d                           JNZ 0x1000:23c9
1000:23ac          8e06400f                       MOV ES,word ptr [0xf40]
1000:23b0          26803e460300                   CMP byte ptr ES:[0x346],0x0
1000:23b6          7411                           JZ 0x1000:23c9
1000:23b8          c606961001                     MOV byte ptr [0x1096],0x1
1000:23bd          9aa8080000                     CALLF 0x0000:08a8
1000:23c2          a38e10                         MOV [0x108e],AX
1000:23c5          89169010                       MOV word ptr [0x1090],DX
LAB_1000_23c9:
1000:23c9          9aa8080000                     CALLF 0x0000:08a8
1000:23ce          8946fc                         MOV word ptr [BP + -0x4],AX
1000:23d1          8956fe                         MOV word ptr [BP + -0x2],DX
1000:23d4          8e06500f                       MOV ES,word ptr [0xf50]
1000:23d8          262b064203                     SUB AX,word ptr ES:[0x342]
1000:23dd          261b164403                     SBB DX,word ptr ES:[0x344]
1000:23e2          8b4e06                         MOV CX,word ptr [BP + 0x6]
1000:23e5          2bdb                           SUB BX,BX
1000:23e7          3bd3                           CMP DX,BX
1000:23e9          72a5                           JC 0x1000:2390
1000:23eb          7704                           JA 0x1000:23f1
1000:23ed          3bc1                           CMP AX,CX
1000:23ef          769f                           JBE 0x1000:2390
LAB_1000_23f1:
1000:23f1          803e961000                     CMP byte ptr [0x1096],0x0
1000:23f6          7448                           JZ 0x1000:2440
1000:23f8          9aa8080000                     CALLF 0x0000:08a8
1000:23fd          a39210                         MOV [0x1092],AX
1000:2400          89169410                       MOV word ptr [0x1094],DX
1000:2404          803e961000                     CMP byte ptr [0x1096],0x0
1000:2409          7435                           JZ 0x1000:2440
1000:240b          c606961000                     MOV byte ptr [0x1096],0x0
1000:2410          8e06420f                       MOV ES,word ptr [0xf42]
1000:2414          26803e140000                   CMP byte ptr ES:[0x14],0x0
1000:241a          7424                           JZ 0x1000:2440
1000:241c          8e063c0f                       MOV ES,word ptr [0xf3c]
1000:2420          26833e0e0001                   CMP word ptr ES:[0xe],0x1
1000:2426          7408                           JZ 0x1000:2430
1000:2428          26833e0e0003                   CMP word ptr ES:[0xe],0x3
1000:242e          7510                           JNZ 0x1000:2440
LAB_1000_2430:
1000:2430          ff36f605                       PUSH word ptr [0x5f6]
1000:2434          ff36f405                       PUSH word ptr [0x5f4]
1000:2438          9a8405e508                     CALLF 0x0000:93d4
1000:243d          83c404                         ADD SP,0x4
LAB_1000_2440:
1000:2440          9aa8080000                     CALLF 0x0000:08a8
1000:2445          8e06500f                       MOV ES,word ptr [0xf50]
1000:2449          26a34203                       MOV ES:[0x342],AX
1000:244d          2689164403                     MOV word ptr ES:[0x344],DX
1000:2452          8be5                           MOV SP,BP
1000:2454          5d                             POP BP
1000:2455          cb                             RETF
FUN_1000_2456:
1000:2456          55                             PUSH BP
1000:2457          8bec                           MOV BP,SP
1000:2459          83ec12                         SUB SP,0x12
LAB_1000_245c:
1000:245c          9aa8080000                     CALLF 0x0000:08a8
1000:2461          8946fc                         MOV word ptr [BP + -0x4],AX
1000:2464          8956fe                         MOV word ptr [BP + -0x2],DX
1000:2467          8d46ee                         LEA AX,[BP + -0x12]
1000:246a          16                             PUSH SS
1000:246b          50                             PUSH AX
1000:246c          9ae0030000                     CALLF 0x0000:03e0
1000:2471          83c404                         ADD SP,0x4
1000:2474          807eee00                       CMP byte ptr [BP + -0x12],0x0
1000:2478          7447                           JZ 0x1000:24c1
1000:247a          9adc04e508                     CALLF 0x0000:932c
1000:247f          8e063e0f                       MOV ES,word ptr [0xf3e]
1000:2483          26833e740105                   CMP word ptr ES:[0x174],0x5
1000:2489          7505                           JNZ 0x1000:2490
1000:248b          9a7c100000                     CALLF 0x0000:107c
LAB_1000_2490:
1000:2490          9aca080000                     CALLF 0x0000:08ca
1000:2495          8e064e0f                       MOV ES,word ptr [0xf4e]
1000:2499          26c70600000000                 MOV word ptr ES:[0x0],0x0
1000:24a0          b80000                         MOV AX,0x0
1000:24a3          baef13                         MOV DX,0x13ef
1000:24a6          52                             PUSH DX
1000:24a7          50                             PUSH AX
1000:24a8          52                             PUSH DX
1000:24a9          50                             PUSH AX
1000:24aa          b83300                         MOV AX,0x33
1000:24ad          50                             PUSH AX
1000:24ae          9a5e19aa05                     CALLF 0x0000:73fe
1000:24b3          83c40a                         ADD SP,0xa
1000:24b6          2bc0                           SUB AX,AX
LAB_1000_24b8:
1000:24b8          50                             PUSH AX
LAB_1000_24b9:
1000:24b9          9aae0daa05                     CALLF 0x0000:684e
1000:24be          83c402                         ADD SP,0x2
LAB_1000_24c1:
1000:24c1          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:24c4          8b56fe                         MOV DX,word ptr [BP + -0x2]
1000:24c7          8e06500f                       MOV ES,word ptr [0xf50]
1000:24cb          262b064203                     SUB AX,word ptr ES:[0x342]
1000:24d0          261b164403                     SBB DX,word ptr ES:[0x344]
1000:24d5          8b4e06                         MOV CX,word ptr [BP + 0x6]
1000:24d8          2bdb                           SUB BX,BX
1000:24da          3bd3                           CMP DX,BX
1000:24dc          7303                           JNC 0x1000:24e1
1000:24de          e97bff                         JMP 0x1000:245c
LAB_1000_24e1:
1000:24e1          7707                           JA 0x1000:24ea
1000:24e3          3bc1                           CMP AX,CX
1000:24e5          7703                           JA 0x1000:24ea
1000:24e7          e972ff                         JMP 0x1000:245c
LAB_1000_24ea:
1000:24ea          9aa8080000                     CALLF 0x0000:08a8
1000:24ef          8e06500f                       MOV ES,word ptr [0xf50]
1000:24f3          26a34203                       MOV ES:[0x342],AX
1000:24f7          2689164403                     MOV word ptr ES:[0x344],DX
1000:24fc          2bc0                           SUB AX,AX
1000:24fe          8be5                           MOV SP,BP
1000:2500          5d                             POP BP
1000:2501          cb                             RETF
FUN_1000_2502:
1000:2502          9aa8080000                     CALLF 0x0000:08a8
1000:2507          8e06500f                       MOV ES,word ptr [0xf50]
1000:250b          26a34203                       MOV ES:[0x342],AX
1000:250f          2689164403                     MOV word ptr ES:[0x344],DX
1000:2514          cb                             RETF
FUN_1000_2516:
1000:2516          55                             PUSH BP
1000:2517          8bec                           MOV BP,SP
1000:2519          83ec0c                         SUB SP,0xc
1000:251c          9a7407e508                     CALLF 0x0000:95c4
1000:2521          b80080                         MOV AX,0x8000
1000:2524          50                             PUSH AX
1000:2525          ff7608                         PUSH word ptr [BP + 0x8]
1000:2528          ff7606                         PUSH word ptr [BP + 0x6]
1000:252b          9a6a12aa05                     CALLF 0x0000:6d0a
1000:2530          83c406                         ADD SP,0x6
1000:2533          8946fe                         MOV word ptr [BP + -0x2],AX
1000:2536          3dffff                         CMP AX,0xffff
1000:2539          744f                           JZ 0x1000:258a
1000:253b          50                             PUSH AX
1000:253c          9ae619aa05                     CALLF 0x0000:7486
1000:2541          83c402                         ADD SP,0x2
1000:2544          8946f4                         MOV word ptr [BP + -0xc],AX
1000:2547          8956f6                         MOV word ptr [BP + -0xa],DX
1000:254a          8946fc                         MOV word ptr [BP + -0x4],AX
1000:254d          50                             PUSH AX
1000:254e          9a7115aa05                     CALLF 0x0000:7011
1000:2553          83c402                         ADD SP,0x2
1000:2556          8946f8                         MOV word ptr [BP + -0x8],AX
1000:2559          8956fa                         MOV word ptr [BP + -0x6],DX
1000:255c          0bc2                           OR AX,DX
1000:255e          741f                           JZ 0x1000:257f
1000:2560          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2563          52                             PUSH DX
1000:2564          ff76f8                         PUSH word ptr [BP + -0x8]
1000:2567          ff76fe                         PUSH word ptr [BP + -0x2]
1000:256a          9a1a14aa05                     CALLF 0x0000:6eba
1000:256f          83c408                         ADD SP,0x8
1000:2572          ff76fe                         PUSH word ptr [BP + -0x2]
1000:2575          9ad011aa05                     CALLF 0x0000:6c70
1000:257a          83c402                         ADD SP,0x2
1000:257d          eb1d                           JMP 0x1000:259c
LAB_1000_257f:
1000:257f          ff7608                         PUSH word ptr [BP + 0x8]
1000:2582          ff7606                         PUSH word ptr [BP + 0x6]
1000:2585          b8e806                         MOV AX,0x6e8
1000:2588          eb09                           JMP 0x1000:2593
LAB_1000_258a:
1000:258a          ff7608                         PUSH word ptr [BP + 0x8]
1000:258d          ff7606                         PUSH word ptr [BP + 0x6]
1000:2590          b80d07                         MOV AX,0x70d
LAB_1000_2593:
1000:2593          1e                             PUSH DS
1000:2594          50                             PUSH AX
1000:2595          0e                             PUSH CS
1000:2596          e85003                         CALL 0x1000:28e9
1000:2599          83c408                         ADD SP,0x8
LAB_1000_259c:
1000:259c          c45e0a                         LES BX,[BP + 0xa]
1000:259f          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:25a2          268907                         MOV word ptr ES:[BX],AX
1000:25a5          9a1804e508                     CALLF 0x0000:9268
1000:25aa          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:25ad          8b56fa                         MOV DX,word ptr [BP + -0x6]
1000:25b0          8be5                           MOV SP,BP
1000:25b2          5d                             POP BP
1000:25b3          cb                             RETF
FUN_1000_25b4:
1000:25b4          55                             PUSH BP
1000:25b5          8bec                           MOV BP,SP
1000:25b7          83ec08                         SUB SP,0x8
1000:25ba          9a7407e508                     CALLF 0x0000:95c4
1000:25bf          b80080                         MOV AX,0x8000
1000:25c2          50                             PUSH AX
1000:25c3          ff7608                         PUSH word ptr [BP + 0x8]
1000:25c6          ff7606                         PUSH word ptr [BP + 0x6]
1000:25c9          9a6a12aa05                     CALLF 0x0000:6d0a
1000:25ce          83c406                         ADD SP,0x6
1000:25d1          8946fe                         MOV word ptr [BP + -0x2],AX
1000:25d4          3dffff                         CMP AX,0xffff
1000:25d7          743d                           JZ 0x1000:2616
1000:25d9          50                             PUSH AX
1000:25da          9ae619aa05                     CALLF 0x0000:7486
1000:25df          83c402                         ADD SP,0x2
1000:25e2          8946f8                         MOV word ptr [BP + -0x8],AX
1000:25e5          8956fa                         MOV word ptr [BP + -0x6],DX
1000:25e8          8946fc                         MOV word ptr [BP + -0x4],AX
1000:25eb          50                             PUSH AX
1000:25ec          8e06520f                       MOV ES,word ptr [0xf52]
1000:25f0          26a13e03                       MOV AX,ES:[0x33e]
1000:25f4          268b164003                     MOV DX,word ptr ES:[0x340]
1000:25f9          03460e                         ADD AX,word ptr [BP + 0xe]
1000:25fc          52                             PUSH DX
1000:25fd          50                             PUSH AX
1000:25fe          ff76fe                         PUSH word ptr [BP + -0x2]
1000:2601          9a1a14aa05                     CALLF 0x0000:6eba
switchD_1000:8905::caseD_a:
1000:2606          83c408                         ADD SP,0x8
1000:2609          ff76fe                         PUSH word ptr [BP + -0x2]
1000:260c          9ad011aa05                     CALLF 0x0000:6c70
1000:2611          83c402                         ADD SP,0x2
1000:2614          eb12                           JMP 0x1000:2628
LAB_1000_2616:
1000:2616          ff7608                         PUSH word ptr [BP + 0x8]
1000:2619          ff7606                         PUSH word ptr [BP + 0x6]
1000:261c          b83007                         MOV AX,0x730
1000:261f          1e                             PUSH DS
1000:2620          50                             PUSH AX
1000:2621          0e                             PUSH CS
1000:2622          e8c402                         CALL 0x1000:28e9
1000:2625          83c408                         ADD SP,0x8
LAB_1000_2628:
1000:2628          c45e0a                         LES BX,[BP + 0xa]
1000:262b          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:262e          268907                         MOV word ptr ES:[BX],AX
1000:2631          9a1804e508                     CALLF 0x0000:9268
1000:2636          b80100                         MOV AX,0x1
1000:2639          8be5                           MOV SP,BP
1000:263b          5d                             POP BP
1000:263c          cb                             RETF
FUN_1000_263d:
1000:263d          55                             PUSH BP
1000:263e          8bec                           MOV BP,SP
1000:2640          83ec1c                         SUB SP,0x1c
1000:2643          2bc0                           SUB AX,AX
1000:2645          8946f2                         MOV word ptr [BP + -0xe],AX
1000:2648          8946f0                         MOV word ptr [BP + -0x10],AX
1000:264b          8946ee                         MOV word ptr [BP + -0x12],AX
1000:264e          8946ec                         MOV word ptr [BP + -0x14],AX
1000:2651          8946ea                         MOV word ptr [BP + -0x16],AX
1000:2654          8946e8                         MOV word ptr [BP + -0x18],AX
1000:2657          9a7407e508                     CALLF 0x0000:95c4
1000:265c          b80080                         MOV AX,0x8000
1000:265f          50                             PUSH AX
1000:2660          ff7608                         PUSH word ptr [BP + 0x8]
1000:2663          ff7606                         PUSH word ptr [BP + 0x6]
1000:2666          9a6a12aa05                     CALLF 0x0000:6d0a
1000:266b          83c406                         ADD SP,0x6
1000:266e          8946fc                         MOV word ptr [BP + -0x4],AX
1000:2671          3dffff                         CMP AX,0xffff
1000:2674          7503                           JNZ 0x1000:2679
1000:2676          e9d500                         JMP 0x1000:274e
LAB_1000_2679:
1000:2679          b80200                         MOV AX,0x2
1000:267c          50                             PUSH AX
1000:267d          8d46fe                         LEA AX,[BP + -0x2]
1000:2680          16                             PUSH SS
1000:2681          50                             PUSH AX
1000:2682          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2685          9a1a14aa05                     CALLF 0x0000:6eba
1000:268a          83c408                         ADD SP,0x8
1000:268d          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:2690          d1e0                           SHL AX,0x1
1000:2692          d1e0                           SHL AX,0x1
1000:2694          50                             PUSH AX
1000:2695          9a7115aa05                     CALLF 0x0000:7011
1000:269a          83c402                         ADD SP,0x2
1000:269d          8946ec                         MOV word ptr [BP + -0x14],AX
1000:26a0          8956ee                         MOV word ptr [BP + -0x12],DX
1000:26a3          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:26a6          d1e0                           SHL AX,0x1
1000:26a8          d1e0                           SHL AX,0x1
1000:26aa          50                             PUSH AX
1000:26ab          52                             PUSH DX
1000:26ac          ff76ec                         PUSH word ptr [BP + -0x14]
1000:26af          ff76fc                         PUSH word ptr [BP + -0x4]
1000:26b2          9a1a14aa05                     CALLF 0x0000:6eba
1000:26b7          83c408                         ADD SP,0x8
1000:26ba          8b46ec                         MOV AX,word ptr [BP + -0x14]
1000:26bd          8b56ee                         MOV DX,word ptr [BP + -0x12]
1000:26c0          8946e8                         MOV word ptr [BP + -0x18],AX
1000:26c3          8956ea                         MOV word ptr [BP + -0x16],DX
1000:26c6          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:26c9          d1e0                           SHL AX,0x1
1000:26cb          d1e0                           SHL AX,0x1
1000:26cd          0346e8                         ADD AX,word ptr [BP + -0x18]
1000:26d0          8946e4                         MOV word ptr [BP + -0x1c],AX
1000:26d3          8956e6                         MOV word ptr [BP + -0x1a],DX
1000:26d6          c45ee4                         LES BX,[BP + -0x1c]
1000:26d9          268b07                         MOV AX,word ptr ES:[BX]
1000:26dc          268b5702                       MOV DX,word ptr ES:[BX + 0x2]
1000:26e0          8946f8                         MOV word ptr [BP + -0x8],AX
1000:26e3          8956fa                         MOV word ptr [BP + -0x6],DX
1000:26e6          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:26ea          268b5706                       MOV DX,word ptr ES:[BX + 0x6]
1000:26ee          8946f4                         MOV word ptr [BP + -0xc],AX
1000:26f1          8956f6                         MOV word ptr [BP + -0xa],DX
1000:26f4          2b46f8                         SUB AX,word ptr [BP + -0x8]
1000:26f7          50                             PUSH AX
1000:26f8          9a7115aa05                     CALLF 0x0000:7011
1000:26fd          83c402                         ADD SP,0x2
1000:2700          8946f0                         MOV word ptr [BP + -0x10],AX
1000:2703          8956f2                         MOV word ptr [BP + -0xe],DX
1000:2706          0bc2                           OR AX,DX
1000:2708          7439                           JZ 0x1000:2743
1000:270a          2bc0                           SUB AX,AX
1000:270c          50                             PUSH AX
1000:270d          ff76fa                         PUSH word ptr [BP + -0x6]
1000:2710          ff76f8                         PUSH word ptr [BP + -0x8]
1000:2713          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2716          9af011aa05                     CALLF 0x0000:6c90
1000:271b          83c408                         ADD SP,0x8
1000:271e          8b46f4                         MOV AX,word ptr [BP + -0xc]
1000:2721          2b46f8                         SUB AX,word ptr [BP + -0x8]
1000:2724          50                             PUSH AX
1000:2725          ff76f2                         PUSH word ptr [BP + -0xe]
1000:2728          ff76f0                         PUSH word ptr [BP + -0x10]
1000:272b          ff76fc                         PUSH word ptr [BP + -0x4]
1000:272e          9a1a14aa05                     CALLF 0x0000:6eba
1000:2733          83c408                         ADD SP,0x8
1000:2736          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2739          9ad011aa05                     CALLF 0x0000:6c70
1000:273e          83c402                         ADD SP,0x2
1000:2741          eb1d                           JMP 0x1000:2760
LAB_1000_2743:
1000:2743          ff7608                         PUSH word ptr [BP + 0x8]
1000:2746          ff7606                         PUSH word ptr [BP + 0x6]
1000:2749          b85307                         MOV AX,0x753
1000:274c          eb09                           JMP 0x1000:2757
LAB_1000_274e:
1000:274e          ff7608                         PUSH word ptr [BP + 0x8]
1000:2751          ff7606                         PUSH word ptr [BP + 0x6]
1000:2754          b87c07                         MOV AX,0x77c
LAB_1000_2757:
1000:2757          1e                             PUSH DS
1000:2758          50                             PUSH AX
1000:2759          0e                             PUSH CS
1000:275a          e88c01                         CALL 0x1000:28e9
1000:275d          83c408                         ADD SP,0x8
LAB_1000_2760:
1000:2760          c45e0c                         LES BX,[BP + 0xc]
1000:2763          8b46f4                         MOV AX,word ptr [BP + -0xc]
1000:2766          2b46f8                         SUB AX,word ptr [BP + -0x8]
1000:2769          268907                         MOV word ptr ES:[BX],AX
1000:276c          9a1804e508                     CALLF 0x0000:9268
1000:2771          8b46ec                         MOV AX,word ptr [BP + -0x14]
1000:2774          0b46ee                         OR AX,word ptr [BP + -0x12]
1000:2777          740e                           JZ 0x1000:2787
1000:2779          ff76ee                         PUSH word ptr [BP + -0x12]
1000:277c          ff76ec                         PUSH word ptr [BP + -0x14]
1000:277f          9a5c15aa05                     CALLF 0x0000:6ffc
1000:2784          83c404                         ADD SP,0x4
LAB_1000_2787:
1000:2787          8b46f0                         MOV AX,word ptr [BP + -0x10]
1000:278a          8b56f2                         MOV DX,word ptr [BP + -0xe]
1000:278d          8be5                           MOV SP,BP
1000:278f          5d                             POP BP
1000:2790          cb                             RETF
FUN_1000_2791:
1000:2791          55                             PUSH BP
1000:2792          8bec                           MOV BP,SP
1000:2794          83ec1c                         SUB SP,0x1c
1000:2797          2bc0                           SUB AX,AX
1000:2799          8946f2                         MOV word ptr [BP + -0xe],AX
1000:279c          8946f0                         MOV word ptr [BP + -0x10],AX
1000:279f          8946ee                         MOV word ptr [BP + -0x12],AX
1000:27a2          8946ec                         MOV word ptr [BP + -0x14],AX
1000:27a5          8946ea                         MOV word ptr [BP + -0x16],AX
1000:27a8          8946e8                         MOV word ptr [BP + -0x18],AX
1000:27ab          9a7407e508                     CALLF 0x0000:95c4
1000:27b0          b80080                         MOV AX,0x8000
1000:27b3          50                             PUSH AX
1000:27b4          ff7608                         PUSH word ptr [BP + 0x8]
1000:27b7          ff7606                         PUSH word ptr [BP + 0x6]
1000:27ba          9a6a12aa05                     CALLF 0x0000:6d0a
1000:27bf          83c406                         ADD SP,0x6
1000:27c2          8946fc                         MOV word ptr [BP + -0x4],AX
1000:27c5          3dffff                         CMP AX,0xffff
1000:27c8          7503                           JNZ 0x1000:27cd
1000:27ca          e9d900                         JMP 0x1000:28a6
LAB_1000_27cd:
1000:27cd          b80200                         MOV AX,0x2
1000:27d0          50                             PUSH AX
1000:27d1          8d46fe                         LEA AX,[BP + -0x2]
1000:27d4          16                             PUSH SS
1000:27d5          50                             PUSH AX
1000:27d6          ff76fc                         PUSH word ptr [BP + -0x4]
1000:27d9          9a1a14aa05                     CALLF 0x0000:6eba
1000:27de          83c408                         ADD SP,0x8
1000:27e1          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:27e4          d1e0                           SHL AX,0x1
1000:27e6          d1e0                           SHL AX,0x1
1000:27e8          50                             PUSH AX
1000:27e9          9a7115aa05                     CALLF 0x0000:7011
1000:27ee          83c402                         ADD SP,0x2
1000:27f1          8946ec                         MOV word ptr [BP + -0x14],AX
1000:27f4          8956ee                         MOV word ptr [BP + -0x12],DX
1000:27f7          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:27fa          d1e0                           SHL AX,0x1
1000:27fc          d1e0                           SHL AX,0x1
1000:27fe          50                             PUSH AX
1000:27ff          52                             PUSH DX
1000:2800          ff76ec                         PUSH word ptr [BP + -0x14]
1000:2803          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2806          9a1a14aa05                     CALLF 0x0000:6eba
1000:280b          83c408                         ADD SP,0x8
1000:280e          8b46ec                         MOV AX,word ptr [BP + -0x14]
1000:2811          8b56ee                         MOV DX,word ptr [BP + -0x12]
1000:2814          8946e8                         MOV word ptr [BP + -0x18],AX
1000:2817          8956ea                         MOV word ptr [BP + -0x16],DX
1000:281a          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:281d          d1e0                           SHL AX,0x1
1000:281f          d1e0                           SHL AX,0x1
1000:2821          0346e8                         ADD AX,word ptr [BP + -0x18]
1000:2824          8946e4                         MOV word ptr [BP + -0x1c],AX
1000:2827          8956e6                         MOV word ptr [BP + -0x1a],DX
1000:282a          c45ee4                         LES BX,[BP + -0x1c]
1000:282d          268b07                         MOV AX,word ptr ES:[BX]
1000:2830          268b5702                       MOV DX,word ptr ES:[BX + 0x2]
1000:2834          8946f8                         MOV word ptr [BP + -0x8],AX
1000:2837          8956fa                         MOV word ptr [BP + -0x6],DX
1000:283a          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:283e          268b5706                       MOV DX,word ptr ES:[BX + 0x6]
1000:2842          8946f4                         MOV word ptr [BP + -0xc],AX
1000:2845          8956f6                         MOV word ptr [BP + -0xa],DX
1000:2848          8e06520f                       MOV ES,word ptr [0xf52]
1000:284c          26a13e03                       MOV AX,ES:[0x33e]
1000:2850          268b164003                     MOV DX,word ptr ES:[0x340]
1000:2855          034610                         ADD AX,word ptr [BP + 0x10]
1000:2858          8946f0                         MOV word ptr [BP + -0x10],AX
1000:285b          8956f2                         MOV word ptr [BP + -0xe],DX
1000:285e          0bc2                           OR AX,DX
1000:2860          7439                           JZ 0x1000:289b
1000:2862          2bc0                           SUB AX,AX
1000:2864          50                             PUSH AX
1000:2865          ff76fa                         PUSH word ptr [BP + -0x6]
1000:2868          ff76f8                         PUSH word ptr [BP + -0x8]
1000:286b          ff76fc                         PUSH word ptr [BP + -0x4]
1000:286e          9af011aa05                     CALLF 0x0000:6c90
1000:2873          83c408                         ADD SP,0x8
1000:2876          8b46f4                         MOV AX,word ptr [BP + -0xc]
1000:2879          2b46f8                         SUB AX,word ptr [BP + -0x8]
1000:287c          50                             PUSH AX
1000:287d          ff76f2                         PUSH word ptr [BP + -0xe]
1000:2880          ff76f0                         PUSH word ptr [BP + -0x10]
1000:2883          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2886          9a1a14aa05                     CALLF 0x0000:6eba
1000:288b          83c408                         ADD SP,0x8
1000:288e          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2891          9ad011aa05                     CALLF 0x0000:6c70
1000:2896          83c402                         ADD SP,0x2
1000:2899          eb1d                           JMP 0x1000:28b8
LAB_1000_289b:
1000:289b          ff7608                         PUSH word ptr [BP + 0x8]
1000:289e          ff7606                         PUSH word ptr [BP + 0x6]
1000:28a1          b8a307                         MOV AX,0x7a3
1000:28a4          eb09                           JMP 0x1000:28af
LAB_1000_28a6:
1000:28a6          ff7608                         PUSH word ptr [BP + 0x8]
1000:28a9          ff7606                         PUSH word ptr [BP + 0x6]
1000:28ac          b8cc07                         MOV AX,0x7cc
LAB_1000_28af:
1000:28af          1e                             PUSH DS
1000:28b0          50                             PUSH AX
1000:28b1          0e                             PUSH CS
1000:28b2          e83400                         CALL 0x1000:28e9
1000:28b5          83c408                         ADD SP,0x8
LAB_1000_28b8:
1000:28b8          c45e0c                         LES BX,[BP + 0xc]
1000:28bb          8b46f4                         MOV AX,word ptr [BP + -0xc]
1000:28be          2b46f8                         SUB AX,word ptr [BP + -0x8]
1000:28c1          268907                         MOV word ptr ES:[BX],AX
1000:28c4          9a1804e508                     CALLF 0x0000:9268
1000:28c9          8b46ec                         MOV AX,word ptr [BP + -0x14]
1000:28cc          0b46ee                         OR AX,word ptr [BP + -0x12]
1000:28cf          740e                           JZ 0x1000:28df
1000:28d1          ff76ee                         PUSH word ptr [BP + -0x12]
1000:28d4          ff76ec                         PUSH word ptr [BP + -0x14]
1000:28d7          9a5c15aa05                     CALLF 0x0000:6ffc
1000:28dc          83c404                         ADD SP,0x4
LAB_1000_28df:
1000:28df          8b46f0                         MOV AX,word ptr [BP + -0x10]
1000:28e2          8b56f2                         MOV DX,word ptr [BP + -0xe]
1000:28e5          8be5                           MOV SP,BP
1000:28e7          5d                             POP BP
1000:28e8          cb                             RETF
FUN_1000_28e9:
1000:28e9          55                             PUSH BP
1000:28ea          8bec                           MOV BP,SP
1000:28ec          83ec1a                         SUB SP,0x1a
1000:28ef          c646e601                       MOV byte ptr [BP + -0x1a],0x1
1000:28f3          c646e701                       MOV byte ptr [BP + -0x19],0x1
1000:28f7          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:28fa          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:28fd          8946ec                         MOV word ptr [BP + -0x14],AX
1000:2900          8956ee                         MOV word ptr [BP + -0x12],DX
1000:2903          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:2906          8b560c                         MOV DX,word ptr [BP + 0xc]
1000:2909          8946f0                         MOV word ptr [BP + -0x10],AX
1000:290c          8956f2                         MOV word ptr [BP + -0xe],DX
1000:290f          8e06520f                       MOV ES,word ptr [0xf52]
1000:2913          26ff364003                     PUSH word ptr ES:[0x340]
1000:2918          26ff363e03                     PUSH word ptr ES:[0x33e]
1000:291d          b8bc08                         MOV AX,0x8bc
1000:2920          ba2514                         MOV DX,0x1425
1000:2923          52                             PUSH DX
1000:2924          50                             PUSH AX
1000:2925          2bc0                           SUB AX,AX
1000:2927          50                             PUSH AX
1000:2928          50                             PUSH AX
1000:2929          b80200                         MOV AX,0x2
1000:292c          50                             PUSH AX
1000:292d          8d46e6                         LEA AX,[BP + -0x1a]
1000:2930          16                             PUSH SS
1000:2931          50                             PUSH AX
1000:2932          8d46ec                         LEA AX,[BP + -0x14]
1000:2935          16                             PUSH SS
1000:2936          50                             PUSH AX
1000:2937          b8a00f                         MOV AX,0xfa0
1000:293a          50                             PUSH AX
1000:293b          50                             PUSH AX
1000:293c          9a06009f03                     CALLF 0x0000:39f6
1000:2941          83c41a                         ADD SP,0x1a
1000:2944          9a7c100000                     CALLF 0x0000:107c
1000:2949          9adc04e508                     CALLF 0x0000:932c
1000:294e          2bc0                           SUB AX,AX
1000:2950          50                             PUSH AX
1000:2951          9aae0daa05                     CALLF 0x0000:684e
1000:2956          8be5                           MOV SP,BP
1000:2958          5d                             POP BP
1000:2959          cb                             RETF
FUN_1000_295a:
1000:295a          55                             PUSH BP
1000:295b          8bec                           MOV BP,SP
1000:295d          8e06540f                       MOV ES,word ptr [0xf54]
1000:2961          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:2967          7f03                           JG 0x1000:296c
1000:2969          e9ad00                         JMP 0x1000:2a19
LAB_1000_296c:
1000:296c          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:296f          2ae4                           SUB AH,AH
1000:2971          3d0d00                         CMP AX,0xd
1000:2974          7603                           JBE 0x1000:2979
1000:2976          e9d500                         JMP 0x1000:2a4e
LAB_1000_2979:
1000:2979          03c0                           ADD AX,AX
1000:297b          93                             XCHG AX,BX
1000:297c          2effa7ab00                     JMP word ptr CS:[BX + 0xab]
LAB_1000_2981:
1000:2981          b80806                         MOV AX,0x608
1000:2984          ba2514                         MOV DX,0x1425
1000:2987          eb66                           JMP 0x1000:29ef
LAB_1000_29ef:
1000:29ef          52                             PUSH DX
1000:29f0          50                             PUSH AX
1000:29f1          9a2e0f0000                     CALLF 0x0000:0f2e
1000:29f6          83c404                         ADD SP,0x4
1000:29f9          eb53                           JMP 0x1000:2a4e
LAB_1000_2a19:
1000:2a19          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:2a1c          2ae4                           SUB AH,AH
1000:2a1e          0bc0                           OR AX,AX
1000:2a20          7503                           JNZ 0x1000:2a25
1000:2a22          e95cff                         JMP 0x1000:2981
LAB_1000_2a25:
1000:2a25          3d5500                         CMP AX,0x55
1000:2a28          740c                           JZ 0x1000:2a36
1000:2a2a          3daa00                         CMP AX,0xaa
1000:2a2d          740f                           JZ 0x1000:2a3e
1000:2a2f          3dff00                         CMP AX,0xff
1000:2a32          7412                           JZ 0x1000:2a46
1000:2a34          eb18                           JMP 0x1000:2a4e
LAB_1000_2a36:
1000:2a36          b82006                         MOV AX,0x620
1000:2a39          ba2514                         MOV DX,0x1425
1000:2a3c          ebb1                           JMP 0x1000:29ef
LAB_1000_2a3e:
1000:2a3e          b81806                         MOV AX,0x618
1000:2a41          ba2514                         MOV DX,0x1425
1000:2a44          eba9                           JMP 0x1000:29ef
LAB_1000_2a46:
1000:2a46          b81006                         MOV AX,0x610
1000:2a49          ba2514                         MOV DX,0x1425
1000:2a4c          eba1                           JMP 0x1000:29ef
LAB_1000_2a4e:
1000:2a4e          5d                             POP BP
1000:2a4f          cb                             RETF
FUN_1000_2a50:
1000:2a50          55                             PUSH BP
1000:2a51          8bec                           MOV BP,SP
1000:2a53          8e06540f                       MOV ES,word ptr [0xf54]
1000:2a57          26a17401                       MOV AX,ES:[0x174]
1000:2a5b          3d0100                         CMP AX,0x1
1000:2a5e          7c3d                           JL 0x1000:2a9d
1000:2a60          3d0200                         CMP AX,0x2
1000:2a63          7e0f                           JLE 0x1000:2a74
1000:2a65          3d0300                         CMP AX,0x3
1000:2a68          741a                           JZ 0x1000:2a84
1000:2a6a          3d0400                         CMP AX,0x4
1000:2a6d          7c2e                           JL 0x1000:2a9d
1000:2a6f          3d0500                         CMP AX,0x5
1000:2a72          7f29                           JG 0x1000:2a9d
LAB_1000_2a74:
1000:2a74          ff7608                         PUSH word ptr [BP + 0x8]
1000:2a77          ff7606                         PUSH word ptr [BP + 0x6]
1000:2a7a          9a92020000                     CALLF 0x0000:0292
1000:2a7f          83c404                         ADD SP,0x4
1000:2a82          eb19                           JMP 0x1000:2a9d
LAB_1000_2a84:
1000:2a84          9a7407e508                     CALLF 0x0000:95c4
1000:2a89          b89006                         MOV AX,0x690
1000:2a8c          ba2514                         MOV DX,0x1425
1000:2a8f          52                             PUSH DX
1000:2a90          50                             PUSH AX
1000:2a91          0e                             PUSH CS
1000:2a92          e84c00                         CALL 0x1000:2ae1
1000:2a95          83c404                         ADD SP,0x4
1000:2a98          9a1804e508                     CALLF 0x0000:9268
LAB_1000_2a9d:
1000:2a9d          5d                             POP BP
1000:2a9e          cb                             RETF
FUN_1000_2ae1:
1000:2ae1          55                             PUSH BP
1000:2ae2          8bec                           MOV BP,SP
1000:2ae4          81ec9a00                       SUB SP,0x9a
1000:2ae8          57                             PUSH DI
1000:2ae9          56                             PUSH SI
1000:2aea          9aaf0e0000                     CALLF 0x0000:0eaf
1000:2aef          c68668ff08                     MOV byte ptr [BP + 0xff68],0x8
1000:2af4          c68669ff01                     MOV byte ptr [BP + 0xff69],0x1
1000:2af9          8e06540f                       MOV ES,word ptr [0xf54]
1000:2afd          26833e740103                   CMP word ptr ES:[0x174],0x3
1000:2b03          7403                           JZ 0x1000:2b08
1000:2b05          e95001                         JMP 0x1000:2c58
LAB_1000_2b08:
1000:2b08          c746fc0000                     MOV word ptr [BP + -0x4],0x0
LAB_1000_2b0d:
1000:2b0d          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2b10          c45e06                         LES BX,[BP + 0x6]
1000:2b13          268a4003                       MOV AL,byte ptr ES:[BX + SI + 0x3]
1000:2b17          243f                           AND AL,0x3f
1000:2b19          88826aff                       MOV byte ptr [BP + SI + 0xff6a],AL
1000:2b1d          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2b20          d1e6                           SHL SI,0x1
1000:2b22          c6429a00                       MOV byte ptr [BP + SI + -0x66],0x0
1000:2b26          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2b29          d1e6                           SHL SI,0x1
1000:2b2b          c6429b00                       MOV byte ptr [BP + SI + -0x65],0x0
1000:2b2f          ff46fc                         INC word ptr [BP + -0x4]
1000:2b32          837efc2d                       CMP word ptr [BP + -0x4],0x2d
1000:2b36          72d5                           JC 0x1000:2b0d
1000:2b38          c746fc0000                     MOV word ptr [BP + -0x4],0x0
LAB_1000_2b3d:
1000:2b3d          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2b40          80ba6aff00                     CMP byte ptr [BP + SI + 0xff6a],0x0
1000:2b45          740c                           JZ 0x1000:2b53
1000:2b47          b83f00                         MOV AX,0x3f
1000:2b4a          f6b26aff                       DIV byte ptr [BP + SI + 0xff6a]
1000:2b4e          d1e6                           SHL SI,0x1
1000:2b50          88429a                         MOV byte ptr [BP + SI + -0x66],AL
LAB_1000_2b53:
1000:2b53          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2b56          d1e6                           SHL SI,0x1
1000:2b58          807a9a00                       CMP byte ptr [BP + SI + -0x66],0x0
1000:2b5c          7509                           JNZ 0x1000:2b67
1000:2b5e          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2b61          d1e6                           SHL SI,0x1
1000:2b63          c6429aff                       MOV byte ptr [BP + SI + -0x66],0xff
LAB_1000_2b67:
1000:2b67          ff46fc                         INC word ptr [BP + -0x4]
1000:2b6a          837efc2d                       CMP word ptr [BP + -0x4],0x2d
1000:2b6e          72cd                           JC 0x1000:2b3d
1000:2b70          c746fc0000                     MOV word ptr [BP + -0x4],0x0
LAB_1000_2b75:
1000:2b75          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2b78          c6826aff00                     MOV byte ptr [BP + SI + 0xff6a],0x0
1000:2b7d          ff46fc                         INC word ptr [BP + -0x4]
1000:2b80          837efc2d                       CMP word ptr [BP + -0x4],0x2d
1000:2b84          72ef                           JC 0x1000:2b75
1000:2b86          c746fc0000                     MOV word ptr [BP + -0x4],0x0
1000:2b8b          e9b800                         JMP 0x1000:2c46
LAB_1000_2b8e:
1000:2b8e          8a46fa                         MOV AL,byte ptr [BP + -0x6]
1000:2b91          2ae4                           SUB AH,AH
1000:2b93          8bf0                           MOV SI,AX
1000:2b95          c45e06                         LES BX,[BP + 0x6]
1000:2b98          268a4003                       MOV AL,byte ptr ES:[BX + SI + 0x3]
1000:2b9c          243f                           AND AL,0x3f
1000:2b9e          88826aff                       MOV byte ptr [BP + SI + 0xff6a],AL
LAB_1000_2ba2:
1000:2ba2          fe46fa                         INC byte ptr [BP + -0x6]
LAB_1000_2ba5:
1000:2ba5          807efa2d                       CMP byte ptr [BP + -0x6],0x2d
1000:2ba9          7343                           JNC 0x1000:2bee
1000:2bab          8a46fa                         MOV AL,byte ptr [BP + -0x6]
1000:2bae          2ae4                           SUB AH,AH
1000:2bb0          8bf0                           MOV SI,AX
1000:2bb2          8bfe                           MOV DI,SI
1000:2bb4          d1e7                           SHL DI,0x1
1000:2bb6          fe439b                         INC byte ptr [BP + DI + -0x65]
1000:2bb9          8bfe                           MOV DI,SI
1000:2bbb          d1e7                           SHL DI,0x1
1000:2bbd          8a439a                         MOV AL,byte ptr [BP + DI + -0x66]
1000:2bc0          8bfe                           MOV DI,SI
1000:2bc2          d1e7                           SHL DI,0x1
1000:2bc4          38439b                         CMP byte ptr [BP + DI + -0x65],AL
1000:2bc7          75d9                           JNZ 0x1000:2ba2
1000:2bc9          8bfe                           MOV DI,SI
1000:2bcb          d1e7                           SHL DI,0x1
1000:2bcd          88639b                         MOV byte ptr [BP + DI + -0x65],AH
1000:2bd0          c45e06                         LES BX,[BP + 0x6]
1000:2bd3          268a4003                       MOV AL,byte ptr ES:[BX + SI + 0x3]
1000:2bd7          253f00                         AND AX,0x3f
1000:2bda          2d0800                         SUB AX,0x8
1000:2bdd          8a8a6aff                       MOV CL,byte ptr [BP + SI + 0xff6a]
1000:2be1          2aed                           SUB CH,CH
1000:2be3          3bc1                           CMP AX,CX
1000:2be5          76a7                           JBE 0x1000:2b8e
1000:2be7          80826aff08                     ADD byte ptr [BP + SI + 0xff6a],0x8
1000:2bec          ebb4                           JMP 0x1000:2ba2
LAB_1000_2bee:
1000:2bee          0e                             PUSH CS
1000:2bef          e8f901                         CALL 0x1000:2deb
1000:2bf2          0e                             PUSH CS
1000:2bf3          e82902                         CALL 0x1000:2e1f
1000:2bf6          8d8668ff                       LEA AX,[BP + 0xff68]
1000:2bfa          16                             PUSH SS
1000:2bfb          50                             PUSH AX
1000:2bfc          9aea000000                     CALLF 0x0000:00ea
1000:2c01          83c404                         ADD SP,0x4
1000:2c04          0e                             PUSH CS
1000:2c05          e82102                         CALL 0x1000:2e29
1000:2c08          8a4680                         MOV AL,byte ptr [BP + -0x80]
1000:2c0b          888666ff                       MOV byte ptr [BP + 0xff66],AL
1000:2c0f          8a4681                         MOV AL,byte ptr [BP + -0x7f]
1000:2c12          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:2c15          c6468007                       MOV byte ptr [BP + -0x80],0x7
1000:2c19          c6468109                       MOV byte ptr [BP + -0x7f],0x9
1000:2c1d          0e                             PUSH CS
1000:2c1e          e8ca01                         CALL 0x1000:2deb
1000:2c21          0e                             PUSH CS
1000:2c22          e8fa01                         CALL 0x1000:2e1f
1000:2c25          8d4680                         LEA AX,[BP + -0x80]
1000:2c28          16                             PUSH SS
1000:2c29          50                             PUSH AX
1000:2c2a          9aea000000                     CALLF 0x0000:00ea
1000:2c2f          83c404                         ADD SP,0x4
1000:2c32          0e                             PUSH CS
1000:2c33          e8f301                         CALL 0x1000:2e29
1000:2c36          8a8666ff                       MOV AL,byte ptr [BP + 0xff66]
1000:2c3a          884680                         MOV byte ptr [BP + -0x80],AL
1000:2c3d          8a46fe                         MOV AL,byte ptr [BP + -0x2]
1000:2c40          884681                         MOV byte ptr [BP + -0x7f],AL
1000:2c43          ff46fc                         INC word ptr [BP + -0x4]
LAB_1000_2c46:
1000:2c46          837efc08                       CMP word ptr [BP + -0x4],0x8
1000:2c4a          7307                           JNC 0x1000:2c53
1000:2c4c          c646fa00                       MOV byte ptr [BP + -0x6],0x0
1000:2c50          e952ff                         JMP 0x1000:2ba5
LAB_1000_2c53:
1000:2c53          9a960e0000                     CALLF 0x0000:0e96
LAB_1000_2c58:
1000:2c58          5e                             POP SI
1000:2c59          5f                             POP DI
1000:2c5a          8be5                           MOV SP,BP
1000:2c5c          5d                             POP BP
1000:2c5d          cb                             RETF
FUN_1000_2c5e:
1000:2c5e          55                             PUSH BP
1000:2c5f          8bec                           MOV BP,SP
1000:2c61          81ec9e00                       SUB SP,0x9e
1000:2c65          57                             PUSH DI
1000:2c66          56                             PUSH SI
1000:2c67          9aaf0e0000                     CALLF 0x0000:0eaf
1000:2c6c          c68664ff08                     MOV byte ptr [BP + 0xff64],0x8
1000:2c71          c68665ff01                     MOV byte ptr [BP + 0xff65],0x1
1000:2c76          8e06540f                       MOV ES,word ptr [0xf54]
1000:2c7a          26833e740103                   CMP word ptr ES:[0x174],0x3
1000:2c80          7403                           JZ 0x1000:2c85
1000:2c82          e96001                         JMP 0x1000:2de5
LAB_1000_2c85:
1000:2c85          c746fc0000                     MOV word ptr [BP + -0x4],0x0
LAB_1000_2c8a:
1000:2c8a          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2c8d          c45e06                         LES BX,[BP + 0x6]
1000:2c90          268a4003                       MOV AL,byte ptr ES:[BX + SI + 0x3]
1000:2c94          243f                           AND AL,0x3f
1000:2c96          888266ff                       MOV byte ptr [BP + SI + 0xff66],AL
1000:2c9a          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2c9d          d1e6                           SHL SI,0x1
1000:2c9f          c6429a00                       MOV byte ptr [BP + SI + -0x66],0x0
1000:2ca3          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2ca6          d1e6                           SHL SI,0x1
1000:2ca8          c6429b00                       MOV byte ptr [BP + SI + -0x65],0x0
1000:2cac          ff46fc                         INC word ptr [BP + -0x4]
1000:2caf          837efc2d                       CMP word ptr [BP + -0x4],0x2d
1000:2cb3          72d5                           JC 0x1000:2c8a
1000:2cb5          c746fc0000                     MOV word ptr [BP + -0x4],0x0
LAB_1000_2cba:
1000:2cba          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2cbd          80ba66ff00                     CMP byte ptr [BP + SI + 0xff66],0x0
1000:2cc2          740c                           JZ 0x1000:2cd0
1000:2cc4          b83f00                         MOV AX,0x3f
1000:2cc7          f6b266ff                       DIV byte ptr [BP + SI + 0xff66]
1000:2ccb          d1e6                           SHL SI,0x1
1000:2ccd          88429a                         MOV byte ptr [BP + SI + -0x66],AL
LAB_1000_2cd0:
1000:2cd0          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2cd3          d1e6                           SHL SI,0x1
1000:2cd5          807a9a00                       CMP byte ptr [BP + SI + -0x66],0x0
1000:2cd9          7509                           JNZ 0x1000:2ce4
1000:2cdb          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:2cde          d1e6                           SHL SI,0x1
1000:2ce0          c6429aff                       MOV byte ptr [BP + SI + -0x66],0xff
LAB_1000_2ce4:
1000:2ce4          ff46fc                         INC word ptr [BP + -0x4]
1000:2ce7          837efc2d                       CMP word ptr [BP + -0x4],0x2d
1000:2ceb          72cd                           JC 0x1000:2cba
1000:2ced          c746fc0000                     MOV word ptr [BP + -0x4],0x0
1000:2cf2          e9dd00                         JMP 0x1000:2dd2
LAB_1000_2cf5:
1000:2cf5          8b76fa                         MOV SI,word ptr [BP + -0x6]
1000:2cf8          81e6ff00                       AND SI,0xff
1000:2cfc          c68266ff00                     MOV byte ptr [BP + SI + 0xff66],0x0
LAB_1000_2d01:
1000:2d01          fe46fa                         INC byte ptr [BP + -0x6]
LAB_1000_2d04:
1000:2d04          807efa2d                       CMP byte ptr [BP + -0x6],0x2d
1000:2d08          7344                           JNC 0x1000:2d4e
1000:2d0a          8a46fa                         MOV AL,byte ptr [BP + -0x6]
1000:2d0d          2ae4                           SUB AH,AH
1000:2d0f          8bf0                           MOV SI,AX
1000:2d11          8bfe                           MOV DI,SI
1000:2d13          d1e7                           SHL DI,0x1
1000:2d15          fe439b                         INC byte ptr [BP + DI + -0x65]
1000:2d18          38a266ff                       CMP byte ptr [BP + SI + 0xff66],AH
1000:2d1c          7404                           JZ 0x1000:2d22
1000:2d1e          fe8a66ff                       DEC byte ptr [BP + SI + 0xff66]
LAB_1000_2d22:
1000:2d22          8a46fa                         MOV AL,byte ptr [BP + -0x6]
1000:2d25          2ae4                           SUB AH,AH
1000:2d27          8bf0                           MOV SI,AX
1000:2d29          8bfe                           MOV DI,SI
1000:2d2b          d1e7                           SHL DI,0x1
1000:2d2d          8a439a                         MOV AL,byte ptr [BP + DI + -0x66]
1000:2d30          8bfe                           MOV DI,SI
1000:2d32          d1e7                           SHL DI,0x1
1000:2d34          38439b                         CMP byte ptr [BP + DI + -0x65],AL
1000:2d37          75c8                           JNZ 0x1000:2d01
1000:2d39          8bfe                           MOV DI,SI
1000:2d3b          d1e7                           SHL DI,0x1
1000:2d3d          88639b                         MOV byte ptr [BP + DI + -0x65],AH
1000:2d40          80ba66ff03                     CMP byte ptr [BP + SI + 0xff66],0x3
1000:2d45          76ae                           JBE 0x1000:2cf5
1000:2d47          80aa66ff04                     SUB byte ptr [BP + SI + 0xff66],0x4
1000:2d4c          ebb3                           JMP 0x1000:2d01
LAB_1000_2d4e:
1000:2d4e          c746960000                     MOV word ptr [BP + -0x6a],0x0
1000:2d53          c746980000                     MOV word ptr [BP + -0x68],0x0
LAB_1000_2d58:
1000:2d58          8b7698                         MOV SI,word ptr [BP + -0x68]
1000:2d5b          8a8266ff                       MOV AL,byte ptr [BP + SI + 0xff66]
1000:2d5f          2ae4                           SUB AH,AH
1000:2d61          014696                         ADD word ptr [BP + -0x6a],AX
1000:2d64          ff4698                         INC word ptr [BP + -0x68]
1000:2d67          837e982d                       CMP word ptr [BP + -0x68],0x2d
1000:2d6b          72eb                           JC 0x1000:2d58
1000:2d6d          0e                             PUSH CS
1000:2d6e          e87a00                         CALL 0x1000:2deb
1000:2d71          0e                             PUSH CS
1000:2d72          e8aa00                         CALL 0x1000:2e1f
1000:2d75          8d8664ff                       LEA AX,[BP + 0xff64]
1000:2d79          16                             PUSH SS
1000:2d7a          50                             PUSH AX
1000:2d7b          9aea000000                     CALLF 0x0000:00ea
1000:2d80          83c404                         ADD SP,0x4
1000:2d83          0e                             PUSH CS
1000:2d84          e8a200                         CALL 0x1000:2e29
1000:2d87          8a867cff                       MOV AL,byte ptr [BP + 0xff7c]
1000:2d8b          888662ff                       MOV byte ptr [BP + 0xff62],AL
1000:2d8f          8a867dff                       MOV AL,byte ptr [BP + 0xff7d]
1000:2d93          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:2d96          c6867cff07                     MOV byte ptr [BP + 0xff7c],0x7
1000:2d9b          c6867dff09                     MOV byte ptr [BP + 0xff7d],0x9
1000:2da0          0e                             PUSH CS
1000:2da1          e84700                         CALL 0x1000:2deb
1000:2da4          0e                             PUSH CS
1000:2da5          e87700                         CALL 0x1000:2e1f
1000:2da8          8d867cff                       LEA AX,[BP + 0xff7c]
1000:2dac          16                             PUSH SS
1000:2dad          50                             PUSH AX
1000:2dae          9aea000000                     CALLF 0x0000:00ea
1000:2db3          83c404                         ADD SP,0x4
1000:2db6          0e                             PUSH CS
1000:2db7          e86f00                         CALL 0x1000:2e29
1000:2dba          8a8662ff                       MOV AL,byte ptr [BP + 0xff62]
1000:2dbe          88867cff                       MOV byte ptr [BP + 0xff7c],AL
1000:2dc2          8a46fe                         MOV AL,byte ptr [BP + -0x2]
1000:2dc5          88867dff                       MOV byte ptr [BP + 0xff7d],AL
1000:2dc9          837e9600                       CMP word ptr [BP + -0x6a],0x0
1000:2dcd          7411                           JZ 0x1000:2de0
1000:2dcf          ff46fc                         INC word ptr [BP + -0x4]
LAB_1000_2dd2:
1000:2dd2          817efc1027                     CMP word ptr [BP + -0x4],0x2710
1000:2dd7          7307                           JNC 0x1000:2de0
1000:2dd9          c646fa00                       MOV byte ptr [BP + -0x6],0x0
1000:2ddd          e924ff                         JMP 0x1000:2d04
LAB_1000_2de0:
1000:2de0          9a960e0000                     CALLF 0x0000:0e96
LAB_1000_2de5:
1000:2de5          5e                             POP SI
1000:2de6          5f                             POP DI
1000:2de7          8be5                           MOV SP,BP
1000:2de9          5d                             POP BP
1000:2dea          cb                             RETF
FUN_1000_2deb:
1000:2deb          55                             PUSH BP
1000:2dec          8bec                           MOV BP,SP
1000:2dee          83ec02                         SUB SP,0x2
LAB_1000_2df1:
1000:2df1          b8da03                         MOV AX,0x3da
1000:2df4          50                             PUSH AX
1000:2df5          9ae41aaa05                     CALLF 0x0000:7584
1000:2dfa          83c402                         ADD SP,0x2
1000:2dfd          8946fe                         MOV word ptr [BP + -0x2],AX
1000:2e00          f646fe08                       TEST byte ptr [BP + -0x2],0x8
1000:2e04          75eb                           JNZ 0x1000:2df1
LAB_1000_2e06:
1000:2e06          b8da03                         MOV AX,0x3da
1000:2e09          50                             PUSH AX
1000:2e0a          9ae41aaa05                     CALLF 0x0000:7584
1000:2e0f          83c402                         ADD SP,0x2
1000:2e12          8946fe                         MOV word ptr [BP + -0x2],AX
1000:2e15          f646fe08                       TEST byte ptr [BP + -0x2],0x8
1000:2e19          74eb                           JZ 0x1000:2e06
1000:2e1b          8be5                           MOV SP,BP
1000:2e1d          5d                             POP BP
1000:2e1e          cb                             RETF
FUN_1000_2e1f:
1000:2e1f          55                             PUSH BP
1000:2e20          8bec                           MOV BP,SP
1000:2e22          83ec02                         SUB SP,0x2
1000:2e25          8be5                           MOV SP,BP
1000:2e27          5d                             POP BP
1000:2e28          cb                             RETF
FUN_1000_2e29:
1000:2e29          55                             PUSH BP
1000:2e2a          8bec                           MOV BP,SP
1000:2e2c          83ec02                         SUB SP,0x2
1000:2e2f          8be5                           MOV SP,BP
1000:2e31          5d                             POP BP
1000:2e32          cb                             RETF
FUN_1000_2e33:
1000:2e33          55                             PUSH BP
1000:2e34          8bec                           MOV BP,SP
1000:2e36          83ec0a                         SUB SP,0xa
1000:2e39          ff7606                         PUSH word ptr [BP + 0x6]
1000:2e3c          9a7115aa05                     CALLF 0x0000:7011
1000:2e41          83c402                         ADD SP,0x2
1000:2e44          8946f6                         MOV word ptr [BP + -0xa],AX
1000:2e47          8956f8                         MOV word ptr [BP + -0x8],DX
1000:2e4a          0bc2                           OR AX,DX
1000:2e4c          7405                           JZ 0x1000:2e53
1000:2e4e          8b46f6                         MOV AX,word ptr [BP + -0xa]
1000:2e51          eb26                           JMP 0x1000:2e79
LAB_1000_2e53:
1000:2e53          b80a00                         MOV AX,0xa
1000:2e56          50                             PUSH AX
1000:2e57          8d46fa                         LEA AX,[BP + -0x6]
1000:2e5a          16                             PUSH SS
1000:2e5b          50                             PUSH AX
1000:2e5c          ff7606                         PUSH word ptr [BP + 0x6]
1000:2e5f          9a1619aa05                     CALLF 0x0000:73b6
1000:2e64          83c408                         ADD SP,0x8
1000:2e67          8d46fa                         LEA AX,[BP + -0x6]
1000:2e6a          16                             PUSH SS
1000:2e6b          50                             PUSH AX
1000:2e6c          b8f407                         MOV AX,0x7f4
1000:2e6f          1e                             PUSH DS
1000:2e70          50                             PUSH AX
1000:2e71          9ad9035102                     CALLF 0x0000:28e9
1000:2e76          83c408                         ADD SP,0x8
LAB_1000_2e79:
1000:2e79          8be5                           MOV SP,BP
1000:2e7b          5d                             POP BP
1000:2e7c          cb                             RETF
FUN_1000_2e7d:
1000:2e7d          55                             PUSH BP
1000:2e7e          8bec                           MOV BP,SP
1000:2e80          c45e06                         LES BX,[BP + 0x6]
1000:2e83          268b07                         MOV AX,word ptr ES:[BX]
1000:2e86          260b4702                       OR AX,word ptr ES:[BX + 0x2]
1000:2e8a          740f                           JZ 0x1000:2e9b
1000:2e8c          26ff7702                       PUSH word ptr ES:[BX + 0x2]
1000:2e90          26ff37                         PUSH word ptr ES:[BX]
1000:2e93          9a5c15aa05                     CALLF 0x0000:6ffc
1000:2e98          83c404                         ADD SP,0x4
LAB_1000_2e9b:
1000:2e9b          c45e06                         LES BX,[BP + 0x6]
1000:2e9e          2bc0                           SUB AX,AX
1000:2ea0          26894702                       MOV word ptr ES:[BX + 0x2],AX
1000:2ea4          268907                         MOV word ptr ES:[BX],AX
1000:2ea7          5d                             POP BP
1000:2ea8          cb                             RETF
FUN_1000_2ea9:
1000:2ea9          55                             PUSH BP
1000:2eaa          8bec                           MOV BP,SP
1000:2eac          83ec74                         SUB SP,0x74
1000:2eaf          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:2eb2          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:2eb5          8946a4                         MOV word ptr [BP + -0x5c],AX
1000:2eb8          8956a6                         MOV word ptr [BP + -0x5a],DX
1000:2ebb          8946a8                         MOV word ptr [BP + -0x58],AX
1000:2ebe          8956aa                         MOV word ptr [BP + -0x56],DX
1000:2ec1          8346a802                       ADD word ptr [BP + -0x58],0x2
1000:2ec5          8b46a8                         MOV AX,word ptr [BP + -0x58]
1000:2ec8          894690                         MOV word ptr [BP + -0x70],AX
1000:2ecb          895692                         MOV word ptr [BP + -0x6e],DX
1000:2ece          2bc0                           SUB AX,AX
1000:2ed0          8946aa                         MOV word ptr [BP + -0x56],AX
1000:2ed3          8946a8                         MOV word ptr [BP + -0x58],AX
1000:2ed6          8946fa                         MOV word ptr [BP + -0x6],AX
1000:2ed9          8946f8                         MOV word ptr [BP + -0x8],AX
1000:2edc          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:2edf          d1e0                           SHL AX,0x1
1000:2ee1          d1e0                           SHL AX,0x1
1000:2ee3          034690                         ADD AX,word ptr [BP + -0x70]
1000:2ee6          89468c                         MOV word ptr [BP + -0x74],AX
1000:2ee9          89568e                         MOV word ptr [BP + -0x72],DX
1000:2eec          c45e8c                         LES BX,[BP + -0x74]
1000:2eef          268b47fc                       MOV AX,word ptr ES:[BX + -0x4]
1000:2ef3          8946fe                         MOV word ptr [BP + -0x2],AX
1000:2ef6          268b07                         MOV AX,word ptr ES:[BX]
1000:2ef9          262b47fc                       SUB AX,word ptr ES:[BX + -0x4]
1000:2efd          8946fc                         MOV word ptr [BP + -0x4],AX
1000:2f00          837e0a00                       CMP word ptr [BP + 0xa],0x0
1000:2f04          750b                           JNZ 0x1000:2f11
1000:2f06          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:2f0b          8b4610                         MOV AX,word ptr [BP + 0x10]
1000:2f0e          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1000_2f11:
1000:2f11          8e06560f                       MOV ES,word ptr [0xf56]
1000:2f15          26a13e03                       MOV AX,ES:[0x33e]
1000:2f19          268b164003                     MOV DX,word ptr ES:[0x340]
1000:2f1e          8946a8                         MOV word ptr [BP + -0x58],AX
1000:2f21          8956aa                         MOV word ptr [BP + -0x56],DX
1000:2f24          0bc2                           OR AX,DX
1000:2f26          741c                           JZ 0x1000:2f44
1000:2f28          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2f2b          52                             PUSH DX
1000:2f2c          ff76a8                         PUSH word ptr [BP + -0x58]
1000:2f2f          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:2f32          034606                         ADD AX,word ptr [BP + 0x6]
1000:2f35          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:2f38          52                             PUSH DX
1000:2f39          50                             PUSH AX
1000:2f3a          9a44030000                     CALLF 0x0000:0344
1000:2f3f          83c40a                         ADD SP,0xa
1000:2f42          eb15                           JMP 0x1000:2f59
LAB_1000_2f44:
1000:2f44          9a4619aa05                     CALLF 0x0000:73e6
1000:2f49          9ae606e508                     CALLF 0x0000:9536
1000:2f4e          2bc0                           SUB AX,AX
1000:2f50          50                             PUSH AX
1000:2f51          9aae0daa05                     CALLF 0x0000:684e
1000:2f56          83c402                         ADD SP,0x2
LAB_1000_2f59:
1000:2f59          8b46a8                         MOV AX,word ptr [BP + -0x58]
1000:2f5c          8b56aa                         MOV DX,word ptr [BP + -0x56]
1000:2f5f          8946a4                         MOV word ptr [BP + -0x5c],AX
1000:2f62          8956a6                         MOV word ptr [BP + -0x5a],DX
1000:2f65          8e06540f                       MOV ES,word ptr [0xf54]
1000:2f69          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:2f6f          7f66                           JG 0x1000:2fd7
1000:2f71          8e06560f                       MOV ES,word ptr [0xf56]
1000:2f75          26a13e03                       MOV AX,ES:[0x33e]
1000:2f79          268b164003                     MOV DX,word ptr ES:[0x340]
1000:2f7e          8946f8                         MOV word ptr [BP + -0x8],AX
1000:2f81          8956fa                         MOV word ptr [BP + -0x6],DX
1000:2f84          0bc2                           OR AX,DX
1000:2f86          7438                           JZ 0x1000:2fc0
1000:2f88          52                             PUSH DX
1000:2f89          ff76f8                         PUSH word ptr [BP + -0x8]
1000:2f8c          ff76aa                         PUSH word ptr [BP + -0x56]
1000:2f8f          ff76a8                         PUSH word ptr [BP + -0x58]
1000:2f92          9ad4010000                     CALLF 0x0000:01d4
1000:2f97          83c408                         ADD SP,0x8
1000:2f9a          c45ea4                         LES BX,[BP + -0x5c]
1000:2f9d          268b470c                       MOV AX,word ptr ES:[BX + 0xc]
1000:2fa1          8946a0                         MOV word ptr [BP + -0x60],AX
1000:2fa4          268b470e                       MOV AX,word ptr ES:[BX + 0xe]
1000:2fa8          8946a2                         MOV word ptr [BP + -0x5e],AX
1000:2fab          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:2fae          051000                         ADD AX,0x10
1000:2fb1          894698                         MOV word ptr [BP + -0x68],AX
1000:2fb4          c45ef8                         LES BX,[BP + -0x8]
1000:2fb7          268a4706                       MOV AL,byte ptr ES:[BX + 0x6]
1000:2fbb          88469a                         MOV byte ptr [BP + -0x66],AL
1000:2fbe          eb35                           JMP 0x1000:2ff5
LAB_1000_2fc0:
1000:2fc0          9a4619aa05                     CALLF 0x0000:73e6
1000:2fc5          9ae606e508                     CALLF 0x0000:9536
1000:2fca          2bc0                           SUB AX,AX
1000:2fcc          50                             PUSH AX
1000:2fcd          9aae0daa05                     CALLF 0x0000:684e
1000:2fd2          83c402                         ADD SP,0x2
1000:2fd5          eb1e                           JMP 0x1000:2ff5
LAB_1000_2fd7:
1000:2fd7          c45ea4                         LES BX,[BP + -0x5c]
1000:2fda          268b470c                       MOV AX,word ptr ES:[BX + 0xc]
1000:2fde          8946a0                         MOV word ptr [BP + -0x60],AX
1000:2fe1          268b470e                       MOV AX,word ptr ES:[BX + 0xe]
1000:2fe5          8946a2                         MOV word ptr [BP + -0x5e],AX
1000:2fe8          8b46a8                         MOV AX,word ptr [BP + -0x58]
1000:2feb          051000                         ADD AX,0x10
1000:2fee          894698                         MOV word ptr [BP + -0x68],AX
1000:2ff1          c6469a0a                       MOV byte ptr [BP + -0x66],0xa
LAB_1000_2ff5:
1000:2ff5          8b460c                         MOV AX,word ptr [BP + 0xc]
1000:2ff8          894694                         MOV word ptr [BP + -0x6c],AX
1000:2ffb          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:2ffe          894696                         MOV word ptr [BP + -0x6a],AX
1000:3001          c7469c0000                     MOV word ptr [BP + -0x64],0x0
1000:3006          c7469e0000                     MOV word ptr [BP + -0x62],0x0
1000:300b          8d46ac                         LEA AX,[BP + -0x54]
1000:300e          16                             PUSH SS
1000:300f          50                             PUSH AX
1000:3010          9a940f0000                     CALLF 0x0000:0f94
1000:3015          83c404                         ADD SP,0x4
1000:3018          8d46d2                         LEA AX,[BP + -0x2e]
1000:301b          16                             PUSH SS
1000:301c          50                             PUSH AX
1000:301d          9aa3090000                     CALLF 0x0000:09a3
1000:3022          83c404                         ADD SP,0x4
1000:3025          8d46d2                         LEA AX,[BP + -0x2e]
1000:3028          16                             PUSH SS
1000:3029          50                             PUSH AX
1000:302a          9a610f0000                     CALLF 0x0000:0f61
1000:302f          83c404                         ADD SP,0x4
1000:3032          8e06540f                       MOV ES,word ptr [0xf54]
1000:3036          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:303c          7f08                           JG 0x1000:3046
1000:303e          ff76fa                         PUSH word ptr [BP + -0x6]
1000:3041          ff76f8                         PUSH word ptr [BP + -0x8]
1000:3044          eb06                           JMP 0x1000:304c
LAB_1000_3046:
1000:3046          ff76aa                         PUSH word ptr [BP + -0x56]
1000:3049          ff76a8                         PUSH word ptr [BP + -0x58]
LAB_1000_304c:
1000:304c          9a930a0000                     CALLF 0x0000:0a93
1000:3051          83c404                         ADD SP,0x4
1000:3054          8d4694                         LEA AX,[BP + -0x6c]
1000:3057          16                             PUSH SS
1000:3058          50                             PUSH AX
1000:3059          9af4120000                     CALLF 0x0000:12f4
1000:305e          83c404                         ADD SP,0x4
1000:3061          8d46ac                         LEA AX,[BP + -0x54]
1000:3064          16                             PUSH SS
1000:3065          50                             PUSH AX
1000:3066          9a610f0000                     CALLF 0x0000:0f61
1000:306b          8be5                           MOV SP,BP
1000:306d          5d                             POP BP
1000:306e          cb                             RETF
FUN_1000_306f:
1000:306f          55                             PUSH BP
1000:3070          8bec                           MOV BP,SP
1000:3072          83ec74                         SUB SP,0x74
1000:3075          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:3078          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:307b          8946a4                         MOV word ptr [BP + -0x5c],AX
1000:307e          8956a6                         MOV word ptr [BP + -0x5a],DX
1000:3081          8946a8                         MOV word ptr [BP + -0x58],AX
1000:3084          8956aa                         MOV word ptr [BP + -0x56],DX
1000:3087          8346a802                       ADD word ptr [BP + -0x58],0x2
1000:308b          8b46a8                         MOV AX,word ptr [BP + -0x58]
1000:308e          894690                         MOV word ptr [BP + -0x70],AX
1000:3091          895692                         MOV word ptr [BP + -0x6e],DX
1000:3094          2bc0                           SUB AX,AX
1000:3096          8946aa                         MOV word ptr [BP + -0x56],AX
1000:3099          8946a8                         MOV word ptr [BP + -0x58],AX
1000:309c          8946fa                         MOV word ptr [BP + -0x6],AX
1000:309f          8946f8                         MOV word ptr [BP + -0x8],AX
1000:30a2          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:30a5          d1e0                           SHL AX,0x1
1000:30a7          d1e0                           SHL AX,0x1
1000:30a9          034690                         ADD AX,word ptr [BP + -0x70]
1000:30ac          89468c                         MOV word ptr [BP + -0x74],AX
1000:30af          89568e                         MOV word ptr [BP + -0x72],DX
1000:30b2          c45e8c                         LES BX,[BP + -0x74]
1000:30b5          268b47fc                       MOV AX,word ptr ES:[BX + -0x4]
1000:30b9          8946fe                         MOV word ptr [BP + -0x2],AX
1000:30bc          268b07                         MOV AX,word ptr ES:[BX]
1000:30bf          262b47fc                       SUB AX,word ptr ES:[BX + -0x4]
1000:30c3          8946fc                         MOV word ptr [BP + -0x4],AX
1000:30c6          837e0a00                       CMP word ptr [BP + 0xa],0x0
1000:30ca          750b                           JNZ 0x1000:30d7
1000:30cc          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:30d1          8b4610                         MOV AX,word ptr [BP + 0x10]
1000:30d4          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1000_30d7:
1000:30d7          8e06560f                       MOV ES,word ptr [0xf56]
1000:30db          26a13e03                       MOV AX,ES:[0x33e]
1000:30df          268b164003                     MOV DX,word ptr ES:[0x340]
1000:30e4          8946a8                         MOV word ptr [BP + -0x58],AX
1000:30e7          8956aa                         MOV word ptr [BP + -0x56],DX
1000:30ea          0bc2                           OR AX,DX
1000:30ec          741c                           JZ 0x1000:310a
1000:30ee          ff76fc                         PUSH word ptr [BP + -0x4]
1000:30f1          52                             PUSH DX
1000:30f2          ff76a8                         PUSH word ptr [BP + -0x58]
1000:30f5          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:30f8          034606                         ADD AX,word ptr [BP + 0x6]
1000:30fb          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:30fe          52                             PUSH DX
1000:30ff          50                             PUSH AX
1000:3100          9a44030000                     CALLF 0x0000:0344
1000:3105          83c40a                         ADD SP,0xa
1000:3108          eb15                           JMP 0x1000:311f
LAB_1000_310a:
1000:310a          9a4619aa05                     CALLF 0x0000:73e6
1000:310f          9ae606e508                     CALLF 0x0000:9536
1000:3114          2bc0                           SUB AX,AX
1000:3116          50                             PUSH AX
1000:3117          9aae0daa05                     CALLF 0x0000:684e
1000:311c          83c402                         ADD SP,0x2
LAB_1000_311f:
1000:311f          8b46a8                         MOV AX,word ptr [BP + -0x58]
1000:3122          8b56aa                         MOV DX,word ptr [BP + -0x56]
1000:3125          8946a4                         MOV word ptr [BP + -0x5c],AX
1000:3128          8956a6                         MOV word ptr [BP + -0x5a],DX
1000:312b          8e06540f                       MOV ES,word ptr [0xf54]
1000:312f          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:3135          7f66                           JG 0x1000:319d
1000:3137          8e06560f                       MOV ES,word ptr [0xf56]
1000:313b          26a13e03                       MOV AX,ES:[0x33e]
1000:313f          268b164003                     MOV DX,word ptr ES:[0x340]
1000:3144          8946f8                         MOV word ptr [BP + -0x8],AX
1000:3147          8956fa                         MOV word ptr [BP + -0x6],DX
1000:314a          0bc2                           OR AX,DX
1000:314c          7438                           JZ 0x1000:3186
1000:314e          52                             PUSH DX
1000:314f          ff76f8                         PUSH word ptr [BP + -0x8]
1000:3152          ff76aa                         PUSH word ptr [BP + -0x56]
1000:3155          ff76a8                         PUSH word ptr [BP + -0x58]
1000:3158          9ad4010000                     CALLF 0x0000:01d4
1000:315d          83c408                         ADD SP,0x8
1000:3160          c45ea4                         LES BX,[BP + -0x5c]
1000:3163          268b470c                       MOV AX,word ptr ES:[BX + 0xc]
1000:3167          8946a0                         MOV word ptr [BP + -0x60],AX
1000:316a          268b470e                       MOV AX,word ptr ES:[BX + 0xe]
1000:316e          8946a2                         MOV word ptr [BP + -0x5e],AX
1000:3171          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:3174          051000                         ADD AX,0x10
1000:3177          894698                         MOV word ptr [BP + -0x68],AX
1000:317a          c45ef8                         LES BX,[BP + -0x8]
1000:317d          268a4706                       MOV AL,byte ptr ES:[BX + 0x6]
1000:3181          88469a                         MOV byte ptr [BP + -0x66],AL
1000:3184          eb35                           JMP 0x1000:31bb
LAB_1000_3186:
1000:3186          9a4619aa05                     CALLF 0x0000:73e6
1000:318b          9ae606e508                     CALLF 0x0000:9536
1000:3190          2bc0                           SUB AX,AX
1000:3192          50                             PUSH AX
1000:3193          9aae0daa05                     CALLF 0x0000:684e
1000:3198          83c402                         ADD SP,0x2
1000:319b          eb1e                           JMP 0x1000:31bb
LAB_1000_319d:
1000:319d          c45ea4                         LES BX,[BP + -0x5c]
1000:31a0          268b470c                       MOV AX,word ptr ES:[BX + 0xc]
1000:31a4          8946a0                         MOV word ptr [BP + -0x60],AX
1000:31a7          268b470e                       MOV AX,word ptr ES:[BX + 0xe]
1000:31ab          8946a2                         MOV word ptr [BP + -0x5e],AX
1000:31ae          8b46a8                         MOV AX,word ptr [BP + -0x58]
1000:31b1          051000                         ADD AX,0x10
1000:31b4          894698                         MOV word ptr [BP + -0x68],AX
1000:31b7          c6469a0a                       MOV byte ptr [BP + -0x66],0xa
LAB_1000_31bb:
1000:31bb          8b460c                         MOV AX,word ptr [BP + 0xc]
1000:31be          894694                         MOV word ptr [BP + -0x6c],AX
1000:31c1          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:31c4          894696                         MOV word ptr [BP + -0x6a],AX
LAB_1000_31c7:
1000:31c7          c7469c0000                     MOV word ptr [BP + -0x64],0x0
1000:31cc          c7469e0000                     MOV word ptr [BP + -0x62],0x0
LAB_1000_31d1:
1000:31d1          8d46ac                         LEA AX,[BP + -0x54]
1000:31d4          16                             PUSH SS
LAB_1000_31d5:
1000:31d5          50                             PUSH AX
1000:31d6          9a940f0000                     CALLF 0x0000:0f94
LAB_1000_31db:
1000:31db          83c404                         ADD SP,0x4
1000:31de          8d46d2                         LEA AX,[BP + -0x2e]
LAB_1000_31e1:
1000:31e1          16                             PUSH SS
1000:31e2          50                             PUSH AX
LAB_1000_31e3:
1000:31e3          9aa3090000                     CALLF 0x0000:09a3
1000:31e8          83c404                         ADD SP,0x4
LAB_1000_31eb:
1000:31eb          8d46d2                         LEA AX,[BP + -0x2e]
1000:31ee          16                             PUSH SS
1000:31ef          50                             PUSH AX
1000:31f0          9a610f0000                     CALLF 0x0000:0f61
1000:31f5          83c404                         ADD SP,0x4
1000:31f8          8e06540f                       MOV ES,word ptr [0xf54]
1000:31fc          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:3202          7f08                           JG 0x1000:320c
1000:3204          ff76fa                         PUSH word ptr [BP + -0x6]
1000:3207          ff76f8                         PUSH word ptr [BP + -0x8]
1000:320a          eb06                           JMP 0x1000:3212
LAB_1000_320c:
1000:320c          ff76aa                         PUSH word ptr [BP + -0x56]
1000:320f          ff76a8                         PUSH word ptr [BP + -0x58]
LAB_1000_3212:
1000:3212          9a930a0000                     CALLF 0x0000:0a93
1000:3217          83c404                         ADD SP,0x4
1000:321a          8d4694                         LEA AX,[BP + -0x6c]
1000:321d          16                             PUSH SS
1000:321e          50                             PUSH AX
1000:321f          9a27130000                     CALLF 0x0000:1327
1000:3224          83c404                         ADD SP,0x4
1000:3227          8d46ac                         LEA AX,[BP + -0x54]
1000:322a          16                             PUSH SS
1000:322b          50                             PUSH AX
1000:322c          9a610f0000                     CALLF 0x0000:0f61
1000:3231          8be5                           MOV SP,BP
1000:3233          5d                             POP BP
1000:3234          cb                             RETF
FUN_1000_3235:
1000:3235          55                             PUSH BP
1000:3236          8bec                           MOV BP,SP
1000:3238          83ec02                         SUB SP,0x2
1000:323b          8e06540f                       MOV ES,word ptr [0xf54]
1000:323f          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:3245          7e20                           JLE 0x1000:3267
1000:3247          c45e06                         LES BX,[BP + 0x6]
1000:324a          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:324e          262b07                         SUB AX,word ptr ES:[BX]
1000:3251          8946fe                         MOV word ptr [BP + -0x2],AX
1000:3254          f646fe01                       TEST byte ptr [BP + -0x2],0x1
1000:3258          7408                           JZ 0x1000:3262
LAB_1000_325a:
1000:325a          d1e8                           SHR AX,0x1
1000:325c          40                             INC AX
1000:325d          8946fe                         MOV word ptr [BP + -0x2],AX
1000:3260          eb21                           JMP 0x1000:3283
LAB_1000_3262:
1000:3262          d16efe                         SHR word ptr [BP + -0x2],0x1
1000:3265          eb1c                           JMP 0x1000:3283
LAB_1000_3267:
1000:3267          c45e06                         LES BX,[BP + 0x6]
1000:326a          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:326e          262b07                         SUB AX,word ptr ES:[BX]
1000:3271          8946fe                         MOV word ptr [BP + -0x2],AX
1000:3274          f646fe03                       TEST byte ptr [BP + -0x2],0x3
1000:3278          7404                           JZ 0x1000:327e
1000:327a          d1e8                           SHR AX,0x1
1000:327c          ebdc                           JMP 0x1000:325a
LAB_1000_327e:
1000:327e          b102                           MOV CL,0x2
1000:3280          d36efe                         SHR word ptr [BP + -0x2],CL
LAB_1000_3283:
1000:3283          8a46fe                         MOV AL,byte ptr [BP + -0x2]
1000:3286          2ae4                           SUB AH,AH
1000:3288          8be5                           MOV SP,BP
1000:328a          5d                             POP BP
1000:328b          cb                             RETF
FUN_1000_328c:
1000:328c          55                             PUSH BP
1000:328d          8bec                           MOV BP,SP
1000:328f          83ec5c                         SUB SP,0x5c
1000:3292          56                             PUSH SI
1000:3293          8d46da                         LEA AX,[BP + -0x26]
1000:3296          16                             PUSH SS
1000:3297          50                             PUSH AX
1000:3298          9a940f0000                     CALLF 0x0000:0f94
1000:329d          83c404                         ADD SP,0x4
1000:32a0          8d46b4                         LEA AX,[BP + -0x4c]
1000:32a3          16                             PUSH SS
1000:32a4          50                             PUSH AX
1000:32a5          9aa3090000                     CALLF 0x0000:09a3
1000:32aa          83c404                         ADD SP,0x4
1000:32ad          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:32b0          051000                         ADD AX,0x10
1000:32b3          8946b8                         MOV word ptr [BP + -0x48],AX
1000:32b6          c746a40000                     MOV word ptr [BP + -0x5c],0x0
1000:32bb          c746a60000                     MOV word ptr [BP + -0x5a],0x0
1000:32c0          c45e06                         LES BX,[BP + 0x6]
1000:32c3          268b07                         MOV AX,word ptr ES:[BX]
1000:32c6          8946ac                         MOV word ptr [BP + -0x54],AX
1000:32c9          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:32cd          8946b0                         MOV word ptr [BP + -0x50],AX
1000:32d0          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:32d4          8946ae                         MOV word ptr [BP + -0x52],AX
1000:32d7          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:32db          8946b2                         MOV word ptr [BP + -0x4e],AX
1000:32de          268b37                         MOV SI,word ptr ES:[BX]
1000:32e1          81fe3f01                       CMP SI,0x13f
1000:32e5          761d                           JBE 0x1000:3304
1000:32e7          8e06540f                       MOV ES,word ptr [0xf54]
1000:32eb          26833e740103                   CMP word ptr ES:[0x174],0x3
1000:32f1          7d11                           JGE 0x1000:3304
1000:32f3          8bc6                           MOV AX,SI
1000:32f5          f7d0                           NOT AX
1000:32f7          8946a4                         MOV word ptr [BP + -0x5c],AX
1000:32fa          c746ac0000                     MOV word ptr [BP + -0x54],0x0
1000:32ff          c746b03f01                     MOV word ptr [BP + -0x50],0x13f
LAB_1000_3304:
1000:3304          ff7608                         PUSH word ptr [BP + 0x8]
1000:3307          53                             PUSH BX
1000:3308          0e                             PUSH CS
1000:3309          e829ff                         CALL 0x1000:3235
1000:330c          83c404                         ADD SP,0x4
1000:330f          8846ba                         MOV byte ptr [BP + -0x46],AL
1000:3312          8d46b4                         LEA AX,[BP + -0x4c]
1000:3315          16                             PUSH SS
1000:3316          50                             PUSH AX
1000:3317          9a610f0000                     CALLF 0x0000:0f61
1000:331c          83c404                         ADD SP,0x4
1000:331f          ff760c                         PUSH word ptr [BP + 0xc]
1000:3322          ff760a                         PUSH word ptr [BP + 0xa]
1000:3325          0e                             PUSH CS
1000:3326          e80cff                         CALL 0x1000:3235
1000:3329          83c404                         ADD SP,0x4
1000:332c          8846aa                         MOV byte ptr [BP + -0x56],AL
1000:332f          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:3332          051000                         ADD AX,0x10
1000:3335          8946a8                         MOV word ptr [BP + -0x58],AX
1000:3338          ff7614                         PUSH word ptr [BP + 0x14]
1000:333b          ff7612                         PUSH word ptr [BP + 0x12]
1000:333e          9a930a0000                     CALLF 0x0000:0a93
1000:3343          83c404                         ADD SP,0x4
1000:3346          ff7610                         PUSH word ptr [BP + 0x10]
1000:3349          ff760e                         PUSH word ptr [BP + 0xe]
1000:334c          9ac60a0000                     CALLF 0x0000:0ac6
1000:3351          83c404                         ADD SP,0x4
1000:3354          8d46a4                         LEA AX,[BP + -0x5c]
1000:3357          16                             PUSH SS
1000:3358          50                             PUSH AX
1000:3359          9af4120000                     CALLF 0x0000:12f4
1000:335e          83c404                         ADD SP,0x4
1000:3361          8d46da                         LEA AX,[BP + -0x26]
1000:3364          16                             PUSH SS
1000:3365          50                             PUSH AX
1000:3366          9a610f0000                     CALLF 0x0000:0f61
1000:336b          83c404                         ADD SP,0x4
1000:336e          5e                             POP SI
1000:336f          8be5                           MOV SP,BP
1000:3371          5d                             POP BP
1000:3372          cb                             RETF
FUN_1000_3373:
1000:3373          55                             PUSH BP
1000:3374          8bec                           MOV BP,SP
1000:3376          83ec60                         SUB SP,0x60
1000:3379          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:337c          8b560c                         MOV DX,word ptr [BP + 0xc]
1000:337f          8946a0                         MOV word ptr [BP + -0x60],AX
1000:3382          8956a2                         MOV word ptr [BP + -0x5e],DX
1000:3385          8d46ca                         LEA AX,[BP + -0x36]
1000:3388          16                             PUSH SS
1000:3389          50                             PUSH AX
1000:338a          9a940f0000                     CALLF 0x0000:0f94
1000:338f          83c404                         ADD SP,0x4
1000:3392          8d46a4                         LEA AX,[BP + -0x5c]
1000:3395          16                             PUSH SS
1000:3396          50                             PUSH AX
1000:3397          9aa3090000                     CALLF 0x0000:09a3
1000:339c          83c404                         ADD SP,0x4
1000:339f          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:33a2          051000                         ADD AX,0x10
1000:33a5          8946f4                         MOV word ptr [BP + -0xc],AX
1000:33a8          ff760c                         PUSH word ptr [BP + 0xc]
1000:33ab          ff760a                         PUSH word ptr [BP + 0xa]
1000:33ae          9a930a0000                     CALLF 0x0000:0a93
1000:33b3          83c404                         ADD SP,0x4
1000:33b6          c746f00000                     MOV word ptr [BP + -0x10],0x0
1000:33bb          c746f20000                     MOV word ptr [BP + -0xe],0x0
1000:33c0          c746f80000                     MOV word ptr [BP + -0x8],0x0
1000:33c5          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:33ca          c45ea0                         LES BX,[BP + -0x60]
1000:33cd          268b470c                       MOV AX,word ptr ES:[BX + 0xc]
1000:33d1          8946fc                         MOV word ptr [BP + -0x4],AX
1000:33d4          268b470e                       MOV AX,word ptr ES:[BX + 0xe]
1000:33d8          8946fe                         MOV word ptr [BP + -0x2],AX
1000:33db          c45e0a                         LES BX,[BP + 0xa]
1000:33de          268a4706                       MOV AL,byte ptr ES:[BX + 0x6]
1000:33e2          8846f6                         MOV byte ptr [BP + -0xa],AL
1000:33e5          ff7608                         PUSH word ptr [BP + 0x8]
1000:33e8          ff7606                         PUSH word ptr [BP + 0x6]
1000:33eb          0e                             PUSH CS
1000:33ec          e846fe                         CALL 0x1000:3235
1000:33ef          83c404                         ADD SP,0x4
1000:33f2          8846aa                         MOV byte ptr [BP + -0x56],AL
1000:33f5          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:33f8          051000                         ADD AX,0x10
1000:33fb          8946a8                         MOV word ptr [BP + -0x58],AX
1000:33fe          8d46a4                         LEA AX,[BP + -0x5c]
1000:3401          16                             PUSH SS
1000:3402          50                             PUSH AX
1000:3403          9a610f0000                     CALLF 0x0000:0f61
1000:3408          83c404                         ADD SP,0x4
1000:340b          ff7610                         PUSH word ptr [BP + 0x10]
1000:340e          ff760e                         PUSH word ptr [BP + 0xe]
1000:3411          9ac60a0000                     CALLF 0x0000:0ac6
1000:3416          83c404                         ADD SP,0x4
1000:3419          8d46f0                         LEA AX,[BP + -0x10]
1000:341c          16                             PUSH SS
1000:341d          50                             PUSH AX
1000:341e          9a27130000                     CALLF 0x0000:1327
1000:3423          83c404                         ADD SP,0x4
1000:3426          8d46ca                         LEA AX,[BP + -0x36]
1000:3429          16                             PUSH SS
1000:342a          50                             PUSH AX
1000:342b          9a610f0000                     CALLF 0x0000:0f61
1000:3430          8be5                           MOV SP,BP
1000:3432          5d                             POP BP
1000:3433          cb                             RETF
FUN_1000_3434:
1000:3434          55                             PUSH BP
1000:3435          8bec                           MOV BP,SP
1000:3437          83ec64                         SUB SP,0x64
1000:343a          56                             PUSH SI
1000:343b          8d46d2                         LEA AX,[BP + -0x2e]
1000:343e          8946fc                         MOV word ptr [BP + -0x4],AX
1000:3441          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:3444          8d46ac                         LEA AX,[BP + -0x54]
1000:3447          8946f8                         MOV word ptr [BP + -0x8],AX
1000:344a          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:344d          16                             PUSH SS
1000:344e          ff76fc                         PUSH word ptr [BP + -0x4]
1000:3451          9a940f0000                     CALLF 0x0000:0f94
1000:3456          83c404                         ADD SP,0x4
1000:3459          ff76fa                         PUSH word ptr [BP + -0x6]
1000:345c          ff76f8                         PUSH word ptr [BP + -0x8]
1000:345f          9aa3090000                     CALLF 0x0000:09a3
1000:3464          83c404                         ADD SP,0x4
1000:3467          c746a60000                     MOV word ptr [BP + -0x5a],0x0
1000:346c          c45e06                         LES BX,[BP + 0x6]
1000:346f          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:3473          262b4702                       SUB AX,word ptr ES:[BX + 0x2]
1000:3477          8946aa                         MOV word ptr [BP + -0x56],AX
1000:347a          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:347d          89469e                         MOV word ptr [BP + -0x62],AX
1000:3480          8b460c                         MOV AX,word ptr [BP + 0xc]
1000:3483          051000                         ADD AX,0x10
1000:3486          8946a0                         MOV word ptr [BP + -0x60],AX
1000:3489          c746a40000                     MOV word ptr [BP + -0x5c],0x0
1000:348e          268b07                         MOV AX,word ptr ES:[BX]
1000:3491          89469c                         MOV word ptr [BP + -0x64],AX
1000:3494          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:3498          262b07                         SUB AX,word ptr ES:[BX]
1000:349b          8946a8                         MOV word ptr [BP + -0x58],AX
1000:349e          8e06540f                       MOV ES,word ptr [0xf54]
1000:34a2          26833e740103                   CMP word ptr ES:[0x174],0x3
1000:34a8          7c03                           JL 0x1000:34ad
1000:34aa          e9a800                         JMP 0x1000:3555
LAB_1000_34ad:
1000:34ad          8e4608                         MOV ES,word ptr [BP + 0x8]
1000:34b0          26837f040d                     CMP word ptr ES:[BX + 0x4],0xd
1000:34b5          7d03                           JGE 0x1000:34ba
1000:34b7          e93701                         JMP 0x1000:35f1
LAB_1000_34ba:
1000:34ba          268b37                         MOV SI,word ptr ES:[BX]
1000:34bd          c45e10                         LES BX,[BP + 0x10]
1000:34c0          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:34c4          48                             DEC AX
1000:34c5          48                             DEC AX
1000:34c6          3bc6                           CMP AX,SI
1000:34c8          7309                           JNC 0x1000:34d3
1000:34ca          81fe0080                       CMP SI,0x8000
1000:34ce          7303                           JNC 0x1000:34d3
1000:34d0          e91e01                         JMP 0x1000:35f1
LAB_1000_34d3:
1000:34d3          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:34d7          c45e06                         LES BX,[BP + 0x6]
1000:34da          26394704                       CMP word ptr ES:[BX + 0x4],AX
1000:34de          7637                           JBE 0x1000:3517
1000:34e0          c45e10                         LES BX,[BP + 0x10]
1000:34e3          268b07                         MOV AX,word ptr ES:[BX]
1000:34e6          c45ef8                         LES BX,[BP + -0x8]
1000:34e9          26894708                       MOV word ptr ES:[BX + 0x8],AX
1000:34ed          c45e10                         LES BX,[BP + 0x10]
1000:34f0          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:34f4          c45ef8                         LES BX,[BP + -0x8]
1000:34f7          2689470c                       MOV word ptr ES:[BX + 0xc],AX
1000:34fb          c45e10                         LES BX,[BP + 0x10]
1000:34fe          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:3502          c45ef8                         LES BX,[BP + -0x8]
1000:3505          2689470a                       MOV word ptr ES:[BX + 0xa],AX
1000:3509          c45e10                         LES BX,[BP + 0x10]
1000:350c          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:3510          c45ef8                         LES BX,[BP + -0x8]
1000:3513          2689470e                       MOV word ptr ES:[BX + 0xe],AX
LAB_1000_3517:
1000:3517          c45e06                         LES BX,[BP + 0x6]
1000:351a          268b37                         MOV SI,word ptr ES:[BX]
1000:351d          81fe4001                       CMP SI,0x140
1000:3521          7703                           JA 0x1000:3526
1000:3523          e98400                         JMP 0x1000:35aa
LAB_1000_3526:
1000:3526          c45e10                         LES BX,[BP + 0x10]
1000:3529          268b07                         MOV AX,word ptr ES:[BX]
1000:352c          8bce                           MOV CX,SI
1000:352e          f7d1                           NOT CX
1000:3530          03c1                           ADD AX,CX
1000:3532          8946a4                         MOV word ptr [BP + -0x5c],AX
1000:3535          c45e06                         LES BX,[BP + 0x6]
1000:3538          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:353c          262b07                         SUB AX,word ptr ES:[BX]
1000:353f          8946a8                         MOV word ptr [BP + -0x58],AX
1000:3542          c7469c0000                     MOV word ptr [BP + -0x64],0x0
1000:3547          c45e10                         LES BX,[BP + 0x10]
1000:354a          268b07                         MOV AX,word ptr ES:[BX]
1000:354d          c45ef8                         LES BX,[BP + -0x8]
1000:3550          268907                         MOV word ptr ES:[BX],AX
1000:3553          eb55                           JMP 0x1000:35aa
LAB_1000_3555:
1000:3555          c45e10                         LES BX,[BP + 0x10]
1000:3558          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:355c          c45e06                         LES BX,[BP + 0x6]
1000:355f          26394704                       CMP word ptr ES:[BX + 0x4],AX
1000:3563          770e                           JA 0x1000:3573
1000:3565          c45e10                         LES BX,[BP + 0x10]
1000:3568          268b07                         MOV AX,word ptr ES:[BX]
1000:356b          c45e06                         LES BX,[BP + 0x6]
1000:356e          263907                         CMP word ptr ES:[BX],AX
1000:3571          7d37                           JGE 0x1000:35aa
LAB_1000_3573:
1000:3573          c45e10                         LES BX,[BP + 0x10]
1000:3576          268b07                         MOV AX,word ptr ES:[BX]
1000:3579          c45ef8                         LES BX,[BP + -0x8]
1000:357c          26894708                       MOV word ptr ES:[BX + 0x8],AX
1000:3580          c45e10                         LES BX,[BP + 0x10]
1000:3583          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:3587          c45ef8                         LES BX,[BP + -0x8]
1000:358a          2689470c                       MOV word ptr ES:[BX + 0xc],AX
1000:358e          c45e10                         LES BX,[BP + 0x10]
1000:3591          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:3595          c45ef8                         LES BX,[BP + -0x8]
1000:3598          2689470a                       MOV word ptr ES:[BX + 0xa],AX
1000:359c          c45e10                         LES BX,[BP + 0x10]
1000:359f          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:35a3          c45ef8                         LES BX,[BP + -0x8]
1000:35a6          2689470e                       MOV word ptr ES:[BX + 0xe],AX
LAB_1000_35aa:
1000:35aa          ff7608                         PUSH word ptr [BP + 0x8]
1000:35ad          ff7606                         PUSH word ptr [BP + 0x6]
1000:35b0          0e                             PUSH CS
1000:35b1          e881fc                         CALL 0x1000:3235
1000:35b4          83c404                         ADD SP,0x4
1000:35b7          8846a2                         MOV byte ptr [BP + -0x5e],AL
1000:35ba          ff76fa                         PUSH word ptr [BP + -0x6]
1000:35bd          ff76f8                         PUSH word ptr [BP + -0x8]
1000:35c0          9a610f0000                     CALLF 0x0000:0f61
1000:35c5          83c404                         ADD SP,0x4
1000:35c8          ff760e                         PUSH word ptr [BP + 0xe]
1000:35cb          ff760c                         PUSH word ptr [BP + 0xc]
1000:35ce          9a930a0000                     CALLF 0x0000:0a93
1000:35d3          83c404                         ADD SP,0x4
1000:35d6          8d469c                         LEA AX,[BP + -0x64]
1000:35d9          16                             PUSH SS
1000:35da          50                             PUSH AX
1000:35db          9af4120000                     CALLF 0x0000:12f4
1000:35e0          83c404                         ADD SP,0x4
1000:35e3          ff76fe                         PUSH word ptr [BP + -0x2]
1000:35e6          ff76fc                         PUSH word ptr [BP + -0x4]
1000:35e9          9a610f0000                     CALLF 0x0000:0f61
1000:35ee          83c404                         ADD SP,0x4
LAB_1000_35f1:
1000:35f1          5e                             POP SI
1000:35f2          8be5                           MOV SP,BP
1000:35f4          5d                             POP BP
1000:35f5          cb                             RETF
FUN_1000_35f6:
1000:35f6          55                             PUSH BP
1000:35f7          8bec                           MOV BP,SP
1000:35f9          83ec64                         SUB SP,0x64
1000:35fc          8d46d2                         LEA AX,[BP + -0x2e]
1000:35ff          8946fc                         MOV word ptr [BP + -0x4],AX
1000:3602          8c56fe                         MOV word ptr [BP + -0x2],SS
1000:3605          8d46ac                         LEA AX,[BP + -0x54]
1000:3608          8946f8                         MOV word ptr [BP + -0x8],AX
1000:360b          8c56fa                         MOV word ptr [BP + -0x6],SS
1000:360e          c45e0a                         LES BX,[BP + 0xa]
1000:3611          268b07                         MOV AX,word ptr ES:[BX]
1000:3614          8946a4                         MOV word ptr [BP + -0x5c],AX
1000:3617          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:361b          8946a6                         MOV word ptr [BP + -0x5a],AX
1000:361e          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:3622          8946a8                         MOV word ptr [BP + -0x58],AX
1000:3625          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:3629          8946aa                         MOV word ptr [BP + -0x56],AX
1000:362c          c746a00000                     MOV word ptr [BP + -0x60],0x0
1000:3631          c7469c0000                     MOV word ptr [BP + -0x64],0x0
1000:3636          c7469e0000                     MOV word ptr [BP + -0x62],0x0
1000:363b          c646a280                       MOV byte ptr [BP + -0x5e],0x80
1000:363f          16                             PUSH SS
1000:3640          ff76fc                         PUSH word ptr [BP + -0x4]
1000:3643          9a940f0000                     CALLF 0x0000:0f94
1000:3648          83c404                         ADD SP,0x4
1000:364b          ff76fa                         PUSH word ptr [BP + -0x6]
1000:364e          ff76f8                         PUSH word ptr [BP + -0x8]
1000:3651          9aa3090000                     CALLF 0x0000:09a3
1000:3656          83c404                         ADD SP,0x4
1000:3659          c746ae0000                     MOV word ptr [BP + -0x52],0x0
1000:365e          c746b60000                     MOV word ptr [BP + -0x4a],0x0
1000:3663          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:3666          051000                         ADD AX,0x10
1000:3669          8946b0                         MOV word ptr [BP + -0x50],AX
1000:366c          ff760c                         PUSH word ptr [BP + 0xc]
1000:366f          ff760a                         PUSH word ptr [BP + 0xa]
1000:3672          0e                             PUSH CS
1000:3673          e8bffb                         CALL 0x1000:3235
1000:3676          83c404                         ADD SP,0x4
1000:3679          8846b2                         MOV byte ptr [BP + -0x4e],AL
1000:367c          ff76fa                         PUSH word ptr [BP + -0x6]
1000:367f          ff76f8                         PUSH word ptr [BP + -0x8]
1000:3682          9a610f0000                     CALLF 0x0000:0f61
1000:3687          83c404                         ADD SP,0x4
1000:368a          ff7608                         PUSH word ptr [BP + 0x8]
1000:368d          ff7606                         PUSH word ptr [BP + 0x6]
1000:3690          9ac60a0000                     CALLF 0x0000:0ac6
1000:3695          83c404                         ADD SP,0x4
1000:3698          8d469c                         LEA AX,[BP + -0x64]
1000:369b          16                             PUSH SS
1000:369c          50                             PUSH AX
1000:369d          9af4120000                     CALLF 0x0000:12f4
1000:36a2          83c404                         ADD SP,0x4
1000:36a5          ff76fe                         PUSH word ptr [BP + -0x2]
1000:36a8          ff76fc                         PUSH word ptr [BP + -0x4]
1000:36ab          9a610f0000                     CALLF 0x0000:0f61
1000:36b0          8be5                           MOV SP,BP
1000:36b2          5d                             POP BP
1000:36b3          cb                             RETF
FUN_1000_36b4:
1000:36b4          55                             PUSH BP
1000:36b5          8bec                           MOV BP,SP
1000:36b7          83ec54                         SUB SP,0x54
1000:36ba          8d46da                         LEA AX,[BP + -0x26]
1000:36bd          16                             PUSH SS
1000:36be          50                             PUSH AX
1000:36bf          9a940f0000                     CALLF 0x0000:0f94
1000:36c4          83c404                         ADD SP,0x4
1000:36c7          8d46b4                         LEA AX,[BP + -0x4c]
1000:36ca          16                             PUSH SS
1000:36cb          50                             PUSH AX
1000:36cc          9aa3090000                     CALLF 0x0000:09a3
1000:36d1          83c404                         ADD SP,0x4
1000:36d4          c746c04001                     MOV word ptr [BP + -0x40],0x140
1000:36d9          c746c2c800                     MOV word ptr [BP + -0x3e],0xc8
1000:36de          c746ac0000                     MOV word ptr [BP + -0x54],0x0
1000:36e3          c746b04001                     MOV word ptr [BP + -0x50],0x140
1000:36e8          c746ae0000                     MOV word ptr [BP + -0x52],0x0
1000:36ed          c746b2c800                     MOV word ptr [BP + -0x4e],0xc8
1000:36f2          8d46b4                         LEA AX,[BP + -0x4c]
1000:36f5          16                             PUSH SS
1000:36f6          50                             PUSH AX
1000:36f7          9a610f0000                     CALLF 0x0000:0f61
1000:36fc          83c404                         ADD SP,0x4
1000:36ff          2bc0                           SUB AX,AX
1000:3701          50                             PUSH AX
1000:3702          50                             PUSH AX
1000:3703          0e                             PUSH CS
1000:3704          e853f2                         CALL 0x1000:295a
1000:3707          83c404                         ADD SP,0x4
1000:370a          8e06540f                       MOV ES,word ptr [0xf54]
1000:370e          26833e740101                   CMP word ptr ES:[0x174],0x1
1000:3714          7520                           JNZ 0x1000:3736
1000:3716          b8c700                         MOV AX,0xc7
1000:3719          50                             PUSH AX
1000:371a          b80100                         MOV AX,0x1
1000:371d          50                             PUSH AX
1000:371e          9a7a0d0000                     CALLF 0x0000:0d7a
1000:3723          83c404                         ADD SP,0x4
1000:3726          b8c700                         MOV AX,0xc7
1000:3729          50                             PUSH AX
1000:372a          b83f01                         MOV AX,0x13f
1000:372d          50                             PUSH AX
1000:372e          9adb0b0000                     CALLF 0x0000:0bdb
1000:3733          83c404                         ADD SP,0x4
LAB_1000_3736:
1000:3736          8d46ac                         LEA AX,[BP + -0x54]
1000:3739          16                             PUSH SS
1000:373a          50                             PUSH AX
1000:373b          9ac80e0000                     CALLF 0x0000:0ec8
1000:3740          83c404                         ADD SP,0x4
1000:3743          8d46da                         LEA AX,[BP + -0x26]
1000:3746          16                             PUSH SS
1000:3747          50                             PUSH AX
1000:3748          9a610f0000                     CALLF 0x0000:0f61
1000:374d          8be5                           MOV SP,BP
1000:374f          5d                             POP BP
1000:3750          cb                             RETF
FUN_1000_3752:
1000:3752          55                             PUSH BP
1000:3753          8bec                           MOV BP,SP
1000:3755          83ec1e                         SUB SP,0x1e
1000:3758          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:375b          8946e2                         MOV word ptr [BP + -0x1e],AX
1000:375e          3d1600                         CMP AX,0x16
1000:3761          7305                           JNC 0x1000:3768
1000:3763          b83e08                         MOV AX,0x83e
1000:3766          eb16                           JMP 0x1000:377e
LAB_1000_3768:
1000:3768          837e062d                       CMP word ptr [BP + 0x6],0x2d
1000:376c          7309                           JNC 0x1000:3777
1000:376e          836e0615                       SUB word ptr [BP + 0x6],0x15
1000:3772          b84408                         MOV AX,0x844
1000:3775          eb07                           JMP 0x1000:377e
LAB_1000_3777:
1000:3777          836e062c                       SUB word ptr [BP + 0x6],0x2c
1000:377b          b84a08                         MOV AX,0x84a
LAB_1000_377e:
1000:377e          1e                             PUSH DS
1000:377f          50                             PUSH AX
1000:3780          8d46ec                         LEA AX,[BP + -0x14]
1000:3783          16                             PUSH SS
1000:3784          50                             PUSH AX
1000:3785          9aa418aa05                     CALLF 0x0000:7344
1000:378a          83c408                         ADD SP,0x8
1000:378d          8e06580f                       MOV ES,word ptr [0xf58]
1000:3791          26833e0e0004                   CMP word ptr ES:[0xe],0x4
1000:3797          7408                           JZ 0x1000:37a1
1000:3799          26833e0e0005                   CMP word ptr ES:[0xe],0x5
1000:379f          7514                           JNZ 0x1000:37b5
LAB_1000_37a1:
1000:37a1          8b5ee2                         MOV BX,word ptr [BP + -0x1e]
1000:37a4          80bf0b0800                     CMP byte ptr [BX + 0x80b],0x0
1000:37a9          7405                           JZ 0x1000:37b0
1000:37ab          b80208                         MOV AX,0x802
1000:37ae          eb08                           JMP 0x1000:37b8
LAB_1000_37b0:
1000:37b0          2bc0                           SUB AX,AX
1000:37b2          99                             CWD
1000:37b3          eb7c                           JMP 0x1000:3831
LAB_1000_37b5:
1000:37b5          b80708                         MOV AX,0x807
LAB_1000_37b8:
1000:37b8          1e                             PUSH DS
1000:37b9          50                             PUSH AX
1000:37ba          8d46ec                         LEA AX,[BP + -0x14]
1000:37bd          16                             PUSH SS
1000:37be          50                             PUSH AX
1000:37bf          9a5e18aa05                     CALLF 0x0000:72fe
1000:37c4          83c408                         ADD SP,0x8
1000:37c7          2bc0                           SUB AX,AX
1000:37c9          8946ea                         MOV word ptr [BP + -0x16],AX
1000:37cc          8946e8                         MOV word ptr [BP + -0x18],AX
1000:37cf          807e0800                       CMP byte ptr [BP + 0x8],0x0
1000:37d3          742f                           JZ 0x1000:3804
1000:37d5          ff760a                         PUSH word ptr [BP + 0xa]
1000:37d8          8d46e4                         LEA AX,[BP + -0x1c]
1000:37db          16                             PUSH SS
1000:37dc          50                             PUSH AX
1000:37dd          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:37e0          48                             DEC AX
1000:37e1          50                             PUSH AX
1000:37e2          8d46ec                         LEA AX,[BP + -0x14]
1000:37e5          16                             PUSH SS
1000:37e6          50                             PUSH AX
1000:37e7          9a81025102                     CALLF 0x0000:2791
1000:37ec          83c40c                         ADD SP,0xc
1000:37ef          8946e6                         MOV word ptr [BP + -0x1a],AX
1000:37f2          8e065a0f                       MOV ES,word ptr [0xf5a]
1000:37f6          26a13e03                       MOV AX,ES:[0x33e]
1000:37fa          268b164003                     MOV DX,word ptr ES:[0x340]
1000:37ff          03460a                         ADD AX,word ptr [BP + 0xa]
1000:3802          eb1d                           JMP 0x1000:3821
LAB_1000_3804:
1000:3804          8d46e4                         LEA AX,[BP + -0x1c]
1000:3807          16                             PUSH SS
1000:3808          50                             PUSH AX
1000:3809          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:380c          48                             DEC AX
1000:380d          50                             PUSH AX
1000:380e          8d46ec                         LEA AX,[BP + -0x14]
1000:3811          16                             PUSH SS
1000:3812          50                             PUSH AX
1000:3813          9a2d015102                     CALLF 0x0000:263d
1000:3818          83c40a                         ADD SP,0xa
1000:381b          8946e8                         MOV word ptr [BP + -0x18],AX
1000:381e          8956ea                         MOV word ptr [BP + -0x16],DX
LAB_1000_3821:
1000:3821          52                             PUSH DX
1000:3822          50                             PUSH AX
1000:3823          9a8c06e508                     CALLF 0x0000:94dc
1000:3828          83c404                         ADD SP,0x4
1000:382b          8b46e8                         MOV AX,word ptr [BP + -0x18]
1000:382e          8b56ea                         MOV DX,word ptr [BP + -0x16]
LAB_1000_3831:
1000:3831          8be5                           MOV SP,BP
1000:3833          5d                             POP BP
1000:3834          cb                             RETF
FUN_1000_3835:
1000:3835          55                             PUSH BP
1000:3836          8bec                           MOV BP,SP
1000:3838          83ec30                         SUB SP,0x30
1000:383b          8e06580f                       MOV ES,word ptr [0xf58]
1000:383f          26833e0e0004                   CMP word ptr ES:[0xe],0x4
1000:3845          7408                           JZ 0x1000:384f
1000:3847          26833e0e0005                   CMP word ptr ES:[0xe],0x5
1000:384d          7505                           JNZ 0x1000:3854
LAB_1000_384f:
1000:384f          2bc0                           SUB AX,AX
1000:3851          e99900                         JMP 0x1000:38ed
LAB_1000_3854:
1000:3854          837e0600                       CMP word ptr [BP + 0x6],0x0
1000:3858          74f5                           JZ 0x1000:384f
1000:385a          837e0605                       CMP word ptr [BP + 0x6],0x5
1000:385e          74ef                           JZ 0x1000:384f
1000:3860          837e060a                       CMP word ptr [BP + 0x6],0xa
1000:3864          74e9                           JZ 0x1000:384f
1000:3866          b80a00                         MOV AX,0xa
1000:3869          50                             PUSH AX
1000:386a          8d46d0                         LEA AX,[BP + -0x30]
1000:386d          16                             PUSH SS
1000:386e          50                             PUSH AX
1000:386f          ff7606                         PUSH word ptr [BP + 0x6]
1000:3872          9a1619aa05                     CALLF 0x0000:73b6
1000:3877          83c408                         ADD SP,0x8
1000:387a          b85008                         MOV AX,0x850
1000:387d          1e                             PUSH DS
1000:387e          50                             PUSH AX
1000:387f          8d46ec                         LEA AX,[BP + -0x14]
1000:3882          16                             PUSH SS
1000:3883          50                             PUSH AX
1000:3884          9aa418aa05                     CALLF 0x0000:7344
1000:3889          83c408                         ADD SP,0x8
1000:388c          837e060c                       CMP word ptr [BP + 0x6],0xc
1000:3890          7305                           JNC 0x1000:3897
1000:3892          b85508                         MOV AX,0x855
1000:3895          eb07                           JMP 0x1000:389e
LAB_1000_3897:
1000:3897          836e060c                       SUB word ptr [BP + 0x6],0xc
1000:389b          b85b08                         MOV AX,0x85b
LAB_1000_389e:
1000:389e          1e                             PUSH DS
1000:389f          50                             PUSH AX
1000:38a0          8d46ec                         LEA AX,[BP + -0x14]
1000:38a3          16                             PUSH SS
1000:38a4          50                             PUSH AX
1000:38a5          9a5e18aa05                     CALLF 0x0000:72fe
1000:38aa          83c408                         ADD SP,0x8
1000:38ad          2bc0                           SUB AX,AX
1000:38af          8946ea                         MOV word ptr [BP + -0x16],AX
1000:38b2          8946e8                         MOV word ptr [BP + -0x18],AX
1000:38b5          ff760a                         PUSH word ptr [BP + 0xa]
1000:38b8          8d46e4                         LEA AX,[BP + -0x1c]
1000:38bb          16                             PUSH SS
1000:38bc          50                             PUSH AX
1000:38bd          ff7606                         PUSH word ptr [BP + 0x6]
1000:38c0          8d46ec                         LEA AX,[BP + -0x14]
1000:38c3          16                             PUSH SS
1000:38c4          50                             PUSH AX
1000:38c5          9a81025102                     CALLF 0x0000:2791
1000:38ca          83c40c                         ADD SP,0xc
1000:38cd          8946e6                         MOV word ptr [BP + -0x1a],AX
1000:38d0          8e065a0f                       MOV ES,word ptr [0xf5a]
1000:38d4          26a13e03                       MOV AX,ES:[0x33e]
1000:38d8          268b164003                     MOV DX,word ptr ES:[0x340]
1000:38dd          03460a                         ADD AX,word ptr [BP + 0xa]
1000:38e0          52                             PUSH DX
1000:38e1          50                             PUSH AX
1000:38e2          9a8c06e508                     CALLF 0x0000:94dc
1000:38e7          83c404                         ADD SP,0x4
1000:38ea          b80100                         MOV AX,0x1
LAB_1000_38ed:
1000:38ed          8be5                           MOV SP,BP
1000:38ef          5d                             POP BP
1000:38f0          cb                             RETF
FUN_1000_38f1:
1000:38f1          55                             PUSH BP
1000:38f2          8bec                           MOV BP,SP
1000:38f4          8e065c0f                       MOV ES,word ptr [0xf5c]
1000:38f8          26803e120000                   CMP byte ptr ES:[0x12],0x0
1000:38fe          7416                           JZ 0x1000:3916
1000:3900          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:3903          0b4608                         OR AX,word ptr [BP + 0x8]
1000:3906          740e                           JZ 0x1000:3916
1000:3908          ff7608                         PUSH word ptr [BP + 0x8]
1000:390b          ff7606                         PUSH word ptr [BP + 0x6]
1000:390e          9a840ae508                     CALLF 0x0000:98d4
1000:3913          83c404                         ADD SP,0x4
LAB_1000_3916:
1000:3916          5d                             POP BP
1000:3917          cb                             RETF
FUN_1000_3918:
1000:3918          55                             PUSH BP
1000:3919          8bec                           MOV BP,SP
1000:391b          8e065c0f                       MOV ES,word ptr [0xf5c]
1000:391f          26803e120000                   CMP byte ptr ES:[0x12],0x0
1000:3925          7416                           JZ 0x1000:393d
1000:3927          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:392a          0b4608                         OR AX,word ptr [BP + 0x8]
1000:392d          740e                           JZ 0x1000:393d
1000:392f          ff7608                         PUSH word ptr [BP + 0x8]
1000:3932          ff7606                         PUSH word ptr [BP + 0x6]
1000:3935          9a0a0ce508                     CALLF 0x0000:9a5a
1000:393a          83c404                         ADD SP,0x4
LAB_1000_393d:
1000:393d          5d                             POP BP
1000:393e          cb                             RETF
FUN_1000_3940:
1000:3940          55                             PUSH BP
1000:3941          8bec                           MOV BP,SP
1000:3943          83ec1c                         SUB SP,0x1c
1000:3946          c646e401                       MOV byte ptr [BP + -0x1c],0x1
1000:394a          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:394d          250080                         AND AX,0x8000
1000:3950          8946ea                         MOV word ptr [BP + -0x16],AX
1000:3953          0bc0                           OR AX,AX
1000:3955          7506                           JNZ 0x1000:395d
1000:3957          837e0809                       CMP word ptr [BP + 0x8],0x9
1000:395b          7515                           JNZ 0x1000:3972
LAB_1000_395d:
1000:395d          b87008                         MOV AX,0x870
1000:3960          8946ec                         MOV word ptr [BP + -0x14],AX
1000:3963          8c5eee                         MOV word ptr [BP + -0x12],DS
1000:3966          8e065e0f                       MOV ES,word ptr [0xf5e]
1000:396a          26c606560001                   MOV byte ptr ES:[0x56],0x1
1000:3970          eb14                           JMP 0x1000:3986
LAB_1000_3972:
1000:3972          837e0802                       CMP word ptr [BP + 0x8],0x2
1000:3976          7505                           JNZ 0x1000:397d
1000:3978          b88608                         MOV AX,0x886
1000:397b          eb03                           JMP 0x1000:3980
LAB_1000_397d:
1000:397d          b8a008                         MOV AX,0x8a0
LAB_1000_3980:
1000:3980          8946ec                         MOV word ptr [BP + -0x14],AX
1000:3983          8c5eee                         MOV word ptr [BP + -0x12],DS
LAB_1000_3986:
1000:3986          8e06600f                       MOV ES,word ptr [0xf60]
1000:398a          26c606420001                   MOV byte ptr ES:[0x42],0x1
1000:3990          8e06620f                       MOV ES,word ptr [0xf62]
1000:3994          26ff364003                     PUSH word ptr ES:[0x340]
1000:3999          26ff363e03                     PUSH word ptr ES:[0x33e]
1000:399e          b86208                         MOV AX,0x862
1000:39a1          1e                             PUSH DS
1000:39a2          50                             PUSH AX
1000:39a3          b86808                         MOV AX,0x868
1000:39a6          1e                             PUSH DS
1000:39a7          50                             PUSH AX
1000:39a8          b80100                         MOV AX,0x1
1000:39ab          50                             PUSH AX
1000:39ac          8d46e4                         LEA AX,[BP + -0x1c]
1000:39af          16                             PUSH SS
1000:39b0          50                             PUSH AX
1000:39b1          8d46ec                         LEA AX,[BP + -0x14]
1000:39b4          16                             PUSH SS
1000:39b5          50                             PUSH AX
1000:39b6          b8a00f                         MOV AX,0xfa0
1000:39b9          50                             PUSH AX
1000:39ba          50                             PUSH AX
1000:39bb          9a06009f03                     CALLF 0x0000:39f6
1000:39c0          83c41a                         ADD SP,0x1a
1000:39c3          8946ea                         MOV word ptr [BP + -0x16],AX
1000:39c6          8e06600f                       MOV ES,word ptr [0xf60]
1000:39ca          26c606420000                   MOV byte ptr ES:[0x42],0x0
1000:39d0          0bc0                           OR AX,AX
1000:39d2          750b                           JNZ 0x1000:39df
1000:39d4          b8ffff                         MOV AX,0xffff
1000:39d7          50                             PUSH AX
1000:39d8          9ad61baa05                     CALLF 0x0000:7676
1000:39dd          eb13                           JMP 0x1000:39f2
LAB_1000_39df:
1000:39df          8e065e0f                       MOV ES,word ptr [0xf5e]
1000:39e3          26c606560000                   MOV byte ptr ES:[0x56],0x0
1000:39e9          b80100                         MOV AX,0x1
1000:39ec          50                             PUSH AX
1000:39ed          9acd1baa05                     CALLF 0x0000:766d
LAB_1000_39f2:
1000:39f2          8be5                           MOV SP,BP
1000:39f4          5d                             POP BP
1000:39f5          cb                             RETF
FUN_1000_39f6:
1000:39f6          55                             PUSH BP
1000:39f7          8bec                           MOV BP,SP
1000:39f9          81ec8200                       SUB SP,0x82
1000:39fd          56                             PUSH SI
1000:39fe          c746f00000                     MOV word ptr [BP + -0x10],0x0
1000:3a03          8d46c8                         LEA AX,[BP + -0x38]
1000:3a06          16                             PUSH SS
1000:3a07          50                             PUSH AX
1000:3a08          9a940f0000                     CALLF 0x0000:0f94
1000:3a0d          83c404                         ADD SP,0x4
1000:3a10          8d46a2                         LEA AX,[BP + -0x5e]
1000:3a13          16                             PUSH SS
1000:3a14          50                             PUSH AX
1000:3a15          9aa3090000                     CALLF 0x0000:09a3
1000:3a1a          83c404                         ADD SP,0x4
1000:3a1d          8d46a2                         LEA AX,[BP + -0x5e]
1000:3a20          16                             PUSH SS
1000:3a21          50                             PUSH AX
1000:3a22          9a610f0000                     CALLF 0x0000:0f61
1000:3a27          83c404                         ADD SP,0x4
1000:3a2a          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:3a2f          eb3d                           JMP 0x1000:3a6e
LAB_1000_3a31:
1000:3a31          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:3a34          d1e3                           SHL BX,0x1
1000:3a36          d1e3                           SHL BX,0x1
1000:3a38          c4760a                         LES SI,[BP + 0xa]
1000:3a3b          268b00                         MOV AX,word ptr ES:[BX + SI]
1000:3a3e          268b5002                       MOV DX,word ptr ES:[BX + SI + 0x2]
1000:3a42          89867eff                       MOV word ptr [BP + 0xff7e],AX
1000:3a46          895680                         MOV word ptr [BP + -0x80],DX
1000:3a49          0bc2                           OR AX,DX
1000:3a4b          7410                           JZ 0x1000:3a5d
1000:3a4d          52                             PUSH DX
1000:3a4e          ffb67eff                       PUSH word ptr [BP + 0xff7e]
1000:3a52          9a5f0b0000                     CALLF 0x0000:0b5f
1000:3a57          83c404                         ADD SP,0x4
1000:3a5a          8946f2                         MOV word ptr [BP + -0xe],AX
LAB_1000_3a5d:
1000:3a5d          8b46f0                         MOV AX,word ptr [BP + -0x10]
1000:3a60          3946f2                         CMP word ptr [BP + -0xe],AX
1000:3a63          7e06                           JLE 0x1000:3a6b
1000:3a65          8b46f2                         MOV AX,word ptr [BP + -0xe]
1000:3a68          8946f0                         MOV word ptr [BP + -0x10],AX
LAB_1000_3a6b:
1000:3a6b          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_3a6e:
1000:3a6e          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:3a71          3946fe                         CMP word ptr [BP + -0x2],AX
1000:3a74          7cbb                           JL 0x1000:3a31
1000:3a76          817e06a00f                     CMP word ptr [BP + 0x6],0xfa0
1000:3a7b          751e                           JNZ 0x1000:3a9b
1000:3a7d          8b46f0                         MOV AX,word ptr [BP + -0x10]
1000:3a80          051900                         ADD AX,0x19
1000:3a83          8946f2                         MOV word ptr [BP + -0xe],AX
1000:3a86          b84001                         MOV AX,0x140
1000:3a89          2b46f2                         SUB AX,word ptr [BP + -0xe]
1000:3a8c          8946f2                         MOV word ptr [BP + -0xe],AX
1000:3a8f          b90200                         MOV CX,0x2
1000:3a92          99                             CWD
1000:3a93          f7f9                           IDIV CX
1000:3a95          8946f2                         MOV word ptr [BP + -0xe],AX
1000:3a98          894606                         MOV word ptr [BP + 0x6],AX
LAB_1000_3a9b:
1000:3a9b          817e08a00f                     CMP word ptr [BP + 0x8],0xfa0
1000:3aa0          7521                           JNZ 0x1000:3ac3
1000:3aa2          b80a00                         MOV AX,0xa
1000:3aa5          f76e12                         IMUL word ptr [BP + 0x12]
1000:3aa8          052a00                         ADD AX,0x2a
1000:3aab          8946f2                         MOV word ptr [BP + -0xe],AX
1000:3aae          b8c800                         MOV AX,0xc8
1000:3ab1          2b46f2                         SUB AX,word ptr [BP + -0xe]
1000:3ab4          8946f2                         MOV word ptr [BP + -0xe],AX
1000:3ab7          b90200                         MOV CX,0x2
1000:3aba          99                             CWD
1000:3abb          f7f9                           IDIV CX
1000:3abd          8946f2                         MOV word ptr [BP + -0xe],AX
1000:3ac0          894608                         MOV word ptr [BP + 0x8],AX
LAB_1000_3ac3:
1000:3ac3          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:3ac6          894682                         MOV word ptr [BP + -0x7e],AX
1000:3ac9          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:3acc          894684                         MOV word ptr [BP + -0x7c],AX
1000:3acf          8b46f0                         MOV AX,word ptr [BP + -0x10]
1000:3ad2          034606                         ADD AX,word ptr [BP + 0x6]
1000:3ad5          051900                         ADD AX,0x19
1000:3ad8          894686                         MOV word ptr [BP + -0x7a],AX
1000:3adb          b80a00                         MOV AX,0xa
1000:3ade          f76e12                         IMUL word ptr [BP + 0x12]
1000:3ae1          034608                         ADD AX,word ptr [BP + 0x8]
1000:3ae4          052a00                         ADD AX,0x2a
1000:3ae7          894688                         MOV word ptr [BP + -0x78],AX
1000:3aea          c646fc00                       MOV byte ptr [BP + -0x4],0x0
1000:3aee          8b461c                         MOV AX,word ptr [BP + 0x1c]
1000:3af1          0b461e                         OR AX,word ptr [BP + 0x1e]
1000:3af4          7515                           JNZ 0x1000:3b0b
1000:3af6          ff76ee                         PUSH word ptr [BP + -0x12]
1000:3af9          9a7115aa05                     CALLF 0x0000:7011
1000:3afe          83c402                         ADD SP,0x2
1000:3b01          89461c                         MOV word ptr [BP + 0x1c],AX
1000:3b04          89561e                         MOV word ptr [BP + 0x1e],DX
1000:3b07          c646fc01                       MOV byte ptr [BP + -0x4],0x1
LAB_1000_3b0b:
1000:3b0b          ff761e                         PUSH word ptr [BP + 0x1e]
1000:3b0e          ff761c                         PUSH word ptr [BP + 0x1c]
1000:3b11          9af90a0000                     CALLF 0x0000:0af9
1000:3b16          83c404                         ADD SP,0x4
1000:3b19          8d4682                         LEA AX,[BP + -0x7e]
1000:3b1c          16                             PUSH SS
1000:3b1d          50                             PUSH AX
1000:3b1e          9a8d130000                     CALLF 0x0000:138d
1000:3b23          83c404                         ADD SP,0x4
1000:3b26          8d4682                         LEA AX,[BP + -0x7e]
1000:3b29          16                             PUSH SS
1000:3b2a          50                             PUSH AX
1000:3b2b          0e                             PUSH CS
1000:3b2c          e80e03                         CALL 0x1000:3e3d
1000:3b2f          83c404                         ADD SP,0x4
1000:3b32          8b4682                         MOV AX,word ptr [BP + -0x7e]
1000:3b35          050a00                         ADD AX,0xa
1000:3b38          89469a                         MOV word ptr [BP + -0x66],AX
1000:3b3b          8b4688                         MOV AX,word ptr [BP + -0x78]
1000:3b3e          2d0a00                         SUB AX,0xa
1000:3b41          8946a0                         MOV word ptr [BP + -0x60],AX
1000:3b44          2d0b00                         SUB AX,0xb
1000:3b47          89469c                         MOV word ptr [BP + -0x64],AX
1000:3b4a          ff7616                         PUSH word ptr [BP + 0x16]
1000:3b4d          ff7614                         PUSH word ptr [BP + 0x14]
1000:3b50          9a5f0b0000                     CALLF 0x0000:0b5f
1000:3b55          83c404                         ADD SP,0x4
1000:3b58          03469a                         ADD AX,word ptr [BP + -0x66]
1000:3b5b          050900                         ADD AX,0x9
1000:3b5e          89469e                         MOV word ptr [BP + -0x62],AX
1000:3b61          8b4614                         MOV AX,word ptr [BP + 0x14]
1000:3b64          0b4616                         OR AX,word ptr [BP + 0x16]
1000:3b67          7424                           JZ 0x1000:3b8d
1000:3b69          8b4686                         MOV AX,word ptr [BP + -0x7a]
1000:3b6c          2d0a00                         SUB AX,0xa
1000:3b6f          894696                         MOV word ptr [BP + -0x6a],AX
1000:3b72          ff761a                         PUSH word ptr [BP + 0x1a]
1000:3b75          ff7618                         PUSH word ptr [BP + 0x18]
1000:3b78          9a5f0b0000                     CALLF 0x0000:0b5f
1000:3b7d          83c404                         ADD SP,0x4
1000:3b80          8b4e96                         MOV CX,word ptr [BP + -0x6a]
1000:3b83          2bc8                           SUB CX,AX
1000:3b85          83e909                         SUB CX,0x9
1000:3b88          894e92                         MOV word ptr [BP + -0x6e],CX
1000:3b8b          eb3e                           JMP 0x1000:3bcb
LAB_1000_3b8d:
1000:3b8d          ff761a                         PUSH word ptr [BP + 0x1a]
1000:3b90          ff7618                         PUSH word ptr [BP + 0x18]
1000:3b93          9a5f0b0000                     CALLF 0x0000:0b5f
1000:3b98          83c404                         ADD SP,0x4
1000:3b9b          99                             CWD
1000:3b9c          2bc2                           SUB AX,DX
1000:3b9e          d1f8                           SAR AX,0x1
1000:3ba0          8b4e86                         MOV CX,word ptr [BP + -0x7a]
1000:3ba3          2b4e82                         SUB CX,word ptr [BP + -0x7e]
1000:3ba6          d1e9                           SHR CX,0x1
1000:3ba8          2bc8                           SUB CX,AX
1000:3baa          034e82                         ADD CX,word ptr [BP + -0x7e]
1000:3bad          894e92                         MOV word ptr [BP + -0x6e],CX
1000:3bb0          836e9204                       SUB word ptr [BP + -0x6e],0x4
1000:3bb4          ff761a                         PUSH word ptr [BP + 0x1a]
1000:3bb7          ff7618                         PUSH word ptr [BP + 0x18]
1000:3bba          9a5f0b0000                     CALLF 0x0000:0b5f
1000:3bbf          83c404                         ADD SP,0x4
1000:3bc2          034692                         ADD AX,word ptr [BP + -0x6e]
1000:3bc5          050900                         ADD AX,0x9
1000:3bc8          894696                         MOV word ptr [BP + -0x6a],AX
LAB_1000_3bcb:
1000:3bcb          8b469c                         MOV AX,word ptr [BP + -0x64]
1000:3bce          894694                         MOV word ptr [BP + -0x6c],AX
1000:3bd1          8b46a0                         MOV AX,word ptr [BP + -0x60]
1000:3bd4          894698                         MOV word ptr [BP + -0x68],AX
1000:3bd7          8b4692                         MOV AX,word ptr [BP + -0x6e]
1000:3bda          48                             DEC AX
1000:3bdb          48                             DEC AX
1000:3bdc          8946f4                         MOV word ptr [BP + -0xc],AX
1000:3bdf          8b4696                         MOV AX,word ptr [BP + -0x6a]
1000:3be2          40                             INC AX
1000:3be3          8946f8                         MOV word ptr [BP + -0x8],AX
1000:3be6          8b4694                         MOV AX,word ptr [BP + -0x6c]
1000:3be9          48                             DEC AX
1000:3bea          48                             DEC AX
1000:3beb          8946f6                         MOV word ptr [BP + -0xa],AX
1000:3bee          8b4698                         MOV AX,word ptr [BP + -0x68]
1000:3bf1          40                             INC AX
1000:3bf2          8946fa                         MOV word ptr [BP + -0x6],AX
1000:3bf5          8b469a                         MOV AX,word ptr [BP + -0x66]
1000:3bf8          48                             DEC AX
1000:3bf9          48                             DEC AX
1000:3bfa          89468a                         MOV word ptr [BP + -0x76],AX
1000:3bfd          8b469e                         MOV AX,word ptr [BP + -0x62]
1000:3c00          40                             INC AX
1000:3c01          89468e                         MOV word ptr [BP + -0x72],AX
1000:3c04          8b46f6                         MOV AX,word ptr [BP + -0xa]
1000:3c07          89468c                         MOV word ptr [BP + -0x74],AX
1000:3c0a          8b46fa                         MOV AX,word ptr [BP + -0x6]
1000:3c0d          894690                         MOV word ptr [BP + -0x70],AX
1000:3c10          8d4692                         LEA AX,[BP + -0x6e]
1000:3c13          16                             PUSH SS
1000:3c14          50                             PUSH AX
1000:3c15          9afb0e0000                     CALLF 0x0000:0efb
1000:3c1a          83c404                         ADD SP,0x4
1000:3c1d          2bc0                           SUB AX,AX
1000:3c1f          50                             PUSH AX
1000:3c20          b80800                         MOV AX,0x8
1000:3c23          50                             PUSH AX
1000:3c24          9a0a009502                     CALLF 0x0000:295a
1000:3c29          83c404                         ADD SP,0x4
1000:3c2c          8b4694                         MOV AX,word ptr [BP + -0x6c]
1000:3c2f          40                             INC AX
1000:3c30          50                             PUSH AX
1000:3c31          8b4696                         MOV AX,word ptr [BP + -0x6a]
1000:3c34          48                             DEC AX
1000:3c35          50                             PUSH AX
1000:3c36          9a7a0d0000                     CALLF 0x0000:0d7a
1000:3c3b          83c404                         ADD SP,0x4
1000:3c3e          8b4698                         MOV AX,word ptr [BP + -0x68]
1000:3c41          48                             DEC AX
1000:3c42          50                             PUSH AX
1000:3c43          8b4696                         MOV AX,word ptr [BP + -0x6a]
1000:3c46          48                             DEC AX
1000:3c47          50                             PUSH AX
1000:3c48          9adb0b0000                     CALLF 0x0000:0bdb
1000:3c4d          83c404                         ADD SP,0x4
1000:3c50          8b4698                         MOV AX,word ptr [BP + -0x68]
1000:3c53          48                             DEC AX
1000:3c54          50                             PUSH AX
1000:3c55          ff7692                         PUSH word ptr [BP + -0x6e]
1000:3c58          9adb0b0000                     CALLF 0x0000:0bdb
1000:3c5d          83c404                         ADD SP,0x4
1000:3c60          8b4614                         MOV AX,word ptr [BP + 0x14]
1000:3c63          0b4616                         OR AX,word ptr [BP + 0x16]
1000:3c66          7460                           JZ 0x1000:3cc8
1000:3c68          b80806                         MOV AX,0x608
1000:3c6b          ba2514                         MOV DX,0x1425
1000:3c6e          52                             PUSH DX
1000:3c6f          50                             PUSH AX
1000:3c70          9a2e0f0000                     CALLF 0x0000:0f2e
1000:3c75          83c404                         ADD SP,0x4
1000:3c78          8d469a                         LEA AX,[BP + -0x66]
1000:3c7b          16                             PUSH SS
1000:3c7c          50                             PUSH AX
1000:3c7d          9afb0e0000                     CALLF 0x0000:0efb
1000:3c82          83c404                         ADD SP,0x4
1000:3c85          2bc0                           SUB AX,AX
1000:3c87          50                             PUSH AX
1000:3c88          b80800                         MOV AX,0x8
1000:3c8b          50                             PUSH AX
1000:3c8c          9a0a009502                     CALLF 0x0000:295a
1000:3c91          83c404                         ADD SP,0x4
1000:3c94          8b469c                         MOV AX,word ptr [BP + -0x64]
1000:3c97          40                             INC AX
1000:3c98          50                             PUSH AX
1000:3c99          8b469e                         MOV AX,word ptr [BP + -0x62]
1000:3c9c          48                             DEC AX
1000:3c9d          50                             PUSH AX
1000:3c9e          9a7a0d0000                     CALLF 0x0000:0d7a
1000:3ca3          83c404                         ADD SP,0x4
1000:3ca6          8b46a0                         MOV AX,word ptr [BP + -0x60]
1000:3ca9          48                             DEC AX
1000:3caa          50                             PUSH AX
1000:3cab          8b469e                         MOV AX,word ptr [BP + -0x62]
1000:3cae          48                             DEC AX
1000:3caf          50                             PUSH AX
1000:3cb0          9adb0b0000                     CALLF 0x0000:0bdb
1000:3cb5          83c404                         ADD SP,0x4
1000:3cb8          8b46a0                         MOV AX,word ptr [BP + -0x60]
1000:3cbb          48                             DEC AX
1000:3cbc          50                             PUSH AX
1000:3cbd          ff769a                         PUSH word ptr [BP + -0x66]
1000:3cc0          9adb0b0000                     CALLF 0x0000:0bdb
1000:3cc5          83c404                         ADD SP,0x4
LAB_1000_3cc8:
1000:3cc8          b80100                         MOV AX,0x1
1000:3ccb          50                             PUSH AX
1000:3ccc          8d4692                         LEA AX,[BP + -0x6e]
1000:3ccf          16                             PUSH SS
1000:3cd0          50                             PUSH AX
1000:3cd1          9a45063b05                     CALLF 0x0000:59f5
1000:3cd6          83c406                         ADD SP,0x6
1000:3cd9          b80b00                         MOV AX,0xb
1000:3cdc          50                             PUSH AX
1000:3cdd          9a100e0000                     CALLF 0x0000:0e10
1000:3ce2          83c402                         ADD SP,0x2
1000:3ce5          8b4698                         MOV AX,word ptr [BP + -0x68]
1000:3ce8          48                             DEC AX
1000:3ce9          50                             PUSH AX
1000:3cea          8b4692                         MOV AX,word ptr [BP + -0x6e]
1000:3ced          050500                         ADD AX,0x5
1000:3cf0          50                             PUSH AX
1000:3cf1          9a7a0d0000                     CALLF 0x0000:0d7a
1000:3cf6          83c404                         ADD SP,0x4
1000:3cf9          ff761a                         PUSH word ptr [BP + 0x1a]
1000:3cfc          ff7618                         PUSH word ptr [BP + 0x18]
1000:3cff          9a600a0000                     CALLF 0x0000:0a60
1000:3d04          83c404                         ADD SP,0x4
1000:3d07          8b4614                         MOV AX,word ptr [BP + 0x14]
1000:3d0a          0b4616                         OR AX,word ptr [BP + 0x16]
1000:3d0d          7422                           JZ 0x1000:3d31
1000:3d0f          8b46a0                         MOV AX,word ptr [BP + -0x60]
1000:3d12          48                             DEC AX
1000:3d13          50                             PUSH AX
1000:3d14          8b469a                         MOV AX,word ptr [BP + -0x66]
1000:3d17          050400                         ADD AX,0x4
1000:3d1a          50                             PUSH AX
1000:3d1b          9a7a0d0000                     CALLF 0x0000:0d7a
1000:3d20          83c404                         ADD SP,0x4
1000:3d23          ff7616                         PUSH word ptr [BP + 0x16]
1000:3d26          ff7614                         PUSH word ptr [BP + 0x14]
1000:3d29          9a600a0000                     CALLF 0x0000:0a60
1000:3d2e          83c404                         ADD SP,0x4
LAB_1000_3d31:
1000:3d31          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:3d36          eb48                           JMP 0x1000:3d80
LAB_1000_3d38:
1000:3d38          b80a00                         MOV AX,0xa
1000:3d3b          f76efe                         IMUL word ptr [BP + -0x2]
1000:3d3e          034684                         ADD AX,word ptr [BP + -0x7c]
1000:3d41          051100                         ADD AX,0x11
1000:3d44          50                             PUSH AX
1000:3d45          8b4682                         MOV AX,word ptr [BP + -0x7e]
1000:3d48          050a00                         ADD AX,0xa
1000:3d4b          50                             PUSH AX
1000:3d4c          9a7a0d0000                     CALLF 0x0000:0d7a
1000:3d51          83c404                         ADD SP,0x4
1000:3d54          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:3d57          d1e3                           SHL BX,0x1
1000:3d59          d1e3                           SHL BX,0x1
1000:3d5b          c4760a                         LES SI,[BP + 0xa]
1000:3d5e          268b00                         MOV AX,word ptr ES:[BX + SI]
1000:3d61          268b5002                       MOV DX,word ptr ES:[BX + SI + 0x2]
1000:3d65          89867eff                       MOV word ptr [BP + 0xff7e],AX
1000:3d69          895680                         MOV word ptr [BP + -0x80],DX
1000:3d6c          0bc2                           OR AX,DX
1000:3d6e          740d                           JZ 0x1000:3d7d
1000:3d70          52                             PUSH DX
1000:3d71          ffb67eff                       PUSH word ptr [BP + 0xff7e]
1000:3d75          9a600a0000                     CALLF 0x0000:0a60
1000:3d7a          83c404                         ADD SP,0x4
LAB_1000_3d7d:
1000:3d7d          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_3d80:
1000:3d80          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:3d83          3946fe                         CMP word ptr [BP + -0x2],AX
1000:3d86          7d48                           JGE 0x1000:3dd0
1000:3d88          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:3d8b          c4760e                         LES SI,[BP + 0xe]
1000:3d8e          26803801                       CMP byte ptr ES:[BX + SI],0x1
1000:3d92          75a4                           JNZ 0x1000:3d38
1000:3d94          d1e3                           SHL BX,0x1
1000:3d96          d1e3                           SHL BX,0x1
1000:3d98          c4760a                         LES SI,[BP + 0xa]
1000:3d9b          268b00                         MOV AX,word ptr ES:[BX + SI]
1000:3d9e          268b5002                       MOV DX,word ptr ES:[BX + SI + 0x2]
1000:3da2          89867eff                       MOV word ptr [BP + 0xff7e],AX
1000:3da6          895680                         MOV word ptr [BP + -0x80],DX
1000:3da9          0bc2                           OR AX,DX
1000:3dab          748b                           JZ 0x1000:3d38
1000:3dad          b80a00                         MOV AX,0xa
1000:3db0          f76efe                         IMUL word ptr [BP + -0x2]
1000:3db3          034684                         ADD AX,word ptr [BP + -0x7c]
1000:3db6          051100                         ADD AX,0x11
1000:3db9          50                             PUSH AX
1000:3dba          ff7686                         PUSH word ptr [BP + -0x7a]
1000:3dbd          ff7682                         PUSH word ptr [BP + -0x7e]
1000:3dc0          ff7680                         PUSH word ptr [BP + -0x80]
1000:3dc3          ffb67eff                       PUSH word ptr [BP + 0xff7e]
1000:3dc7          0e                             PUSH CS
1000:3dc8          e84401                         CALL 0x1000:3f0f
1000:3dcb          83c40a                         ADD SP,0xa
1000:3dce          ebad                           JMP 0x1000:3d7d
LAB_1000_3dd0:
1000:3dd0          8b4614                         MOV AX,word ptr [BP + 0x14]
1000:3dd3          0b4616                         OR AX,word ptr [BP + 0x16]
1000:3dd6          7406                           JZ 0x1000:3dde
1000:3dd8          8d469a                         LEA AX,[BP + -0x66]
1000:3ddb          16                             PUSH SS
1000:3ddc          eb03                           JMP 0x1000:3de1
LAB_1000_3dde:
1000:3dde          2bc0                           SUB AX,AX
1000:3de0          50                             PUSH AX
LAB_1000_3de1:
1000:3de1          50                             PUSH AX
1000:3de2          8d4692                         LEA AX,[BP + -0x6e]
1000:3de5          16                             PUSH SS
1000:3de6          50                             PUSH AX
1000:3de7          0e                             PUSH CS
1000:3de8          e86301                         CALL 0x1000:3f4e
1000:3deb          83c408                         ADD SP,0x8
1000:3dee          8946fe                         MOV word ptr [BP + -0x2],AX
1000:3df1          ff761e                         PUSH word ptr [BP + 0x1e]
1000:3df4          ff761c                         PUSH word ptr [BP + 0x1c]
1000:3df7          9a2c0b0000                     CALLF 0x0000:0b2c
1000:3dfc          83c404                         ADD SP,0x4
1000:3dff          8d4682                         LEA AX,[BP + -0x7e]
1000:3e02          16                             PUSH SS
1000:3e03          50                             PUSH AX
1000:3e04          9ac0130000                     CALLF 0x0000:13c0
1000:3e09          83c404                         ADD SP,0x4
1000:3e0c          807efc00                       CMP byte ptr [BP + -0x4],0x0
1000:3e10          7416                           JZ 0x1000:3e28
1000:3e12          8b461c                         MOV AX,word ptr [BP + 0x1c]
1000:3e15          0b461e                         OR AX,word ptr [BP + 0x1e]
1000:3e18          740e                           JZ 0x1000:3e28
1000:3e1a          ff761e                         PUSH word ptr [BP + 0x1e]
1000:3e1d          ff761c                         PUSH word ptr [BP + 0x1c]
1000:3e20          9a5c15aa05                     CALLF 0x0000:6ffc
1000:3e25          83c404                         ADD SP,0x4
LAB_1000_3e28:
1000:3e28          8d46c8                         LEA AX,[BP + -0x38]
1000:3e2b          16                             PUSH SS
1000:3e2c          50                             PUSH AX
1000:3e2d          9a610f0000                     CALLF 0x0000:0f61
1000:3e32          83c404                         ADD SP,0x4
1000:3e35          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:3e38          5e                             POP SI
1000:3e39          8be5                           MOV SP,BP
1000:3e3b          5d                             POP BP
1000:3e3c          cb                             RETF
FUN_1000_3e3d:
1000:3e3d          55                             PUSH BP
1000:3e3e          8bec                           MOV BP,SP
1000:3e40          2bc0                           SUB AX,AX
1000:3e42          50                             PUSH AX
1000:3e43          9a26100000                     CALLF 0x0000:1026
1000:3e48          83c402                         ADD SP,0x2
1000:3e4b          b8ff00                         MOV AX,0xff
1000:3e4e          50                             PUSH AX
1000:3e4f          b80b00                         MOV AX,0xb
1000:3e52          50                             PUSH AX
1000:3e53          9a0a009502                     CALLF 0x0000:295a
1000:3e58          83c404                         ADD SP,0x4
1000:3e5b          ff7608                         PUSH word ptr [BP + 0x8]
1000:3e5e          ff7606                         PUSH word ptr [BP + 0x6]
1000:3e61          9ac80e0000                     CALLF 0x0000:0ec8
1000:3e66          83c404                         ADD SP,0x4
1000:3e69          c45e06                         LES BX,[BP + 0x6]
1000:3e6c          26836f0402                     SUB word ptr ES:[BX + 0x4],0x2
1000:3e71          c45e06                         LES BX,[BP + 0x6]
1000:3e74          26836f0602                     SUB word ptr ES:[BX + 0x6],0x2
1000:3e79          b80200                         MOV AX,0x2
1000:3e7c          50                             PUSH AX
1000:3e7d          50                             PUSH AX
1000:3e7e          9ac70f0000                     CALLF 0x0000:0fc7
1000:3e83          83c404                         ADD SP,0x4
1000:3e86          a0bb08                         MOV AL,[0x8bb]
1000:3e89          98                             CBW
1000:3e8a          50                             PUSH AX
1000:3e8b          a0ba08                         MOV AL,[0x8ba]
1000:3e8e          98                             CBW
1000:3e8f          50                             PUSH AX
1000:3e90          9a0a009502                     CALLF 0x0000:295a
1000:3e95          83c404                         ADD SP,0x4
1000:3e98          ff7608                         PUSH word ptr [BP + 0x8]
1000:3e9b          ff7606                         PUSH word ptr [BP + 0x6]
1000:3e9e          9afb0e0000                     CALLF 0x0000:0efb
1000:3ea3          83c404                         ADD SP,0x4
1000:3ea6          b80806                         MOV AX,0x608
1000:3ea9          ba2514                         MOV DX,0x1425
1000:3eac          52                             PUSH DX
1000:3ead          50                             PUSH AX
1000:3eae          9a2e0f0000                     CALLF 0x0000:0f2e
1000:3eb3          83c404                         ADD SP,0x4
1000:3eb6          c45e06                         LES BX,[BP + 0x6]
1000:3eb9          26830702                       ADD word ptr ES:[BX],0x2
1000:3ebd          c45e06                         LES BX,[BP + 0x6]
1000:3ec0          2683470202                     ADD word ptr ES:[BX + 0x2],0x2
1000:3ec5          b80100                         MOV AX,0x1
1000:3ec8          50                             PUSH AX
1000:3ec9          50                             PUSH AX
1000:3eca          9ac70f0000                     CALLF 0x0000:0fc7
1000:3ecf          83c404                         ADD SP,0x4
1000:3ed2          ff7608                         PUSH word ptr [BP + 0x8]
1000:3ed5          ff7606                         PUSH word ptr [BP + 0x6]
1000:3ed8          9afb0e0000                     CALLF 0x0000:0efb
1000:3edd          83c404                         ADD SP,0x4
1000:3ee0          c45e06                         LES BX,[BP + 0x6]
1000:3ee3          26832f02                       SUB word ptr ES:[BX],0x2
1000:3ee7          c45e06                         LES BX,[BP + 0x6]
1000:3eea          2683470402                     ADD word ptr ES:[BX + 0x4],0x2
1000:3eef          c45e06                         LES BX,[BP + 0x6]
1000:3ef2          26836f0202                     SUB word ptr ES:[BX + 0x2],0x2
1000:3ef7          c45e06                         LES BX,[BP + 0x6]
1000:3efa          2683470602                     ADD word ptr ES:[BX + 0x6],0x2
1000:3eff          ff7608                         PUSH word ptr [BP + 0x8]
1000:3f02          ff7606                         PUSH word ptr [BP + 0x6]
1000:3f05          9afb0e0000                     CALLF 0x0000:0efb
1000:3f0a          83c404                         ADD SP,0x4
1000:3f0d          5d                             POP BP
1000:3f0e          cb                             RETF
FUN_1000_3f0f:
1000:3f0f          55                             PUSH BP
1000:3f10          8bec                           MOV BP,SP
1000:3f12          ff760e                         PUSH word ptr [BP + 0xe]
1000:3f15          ff7608                         PUSH word ptr [BP + 0x8]
1000:3f18          ff7606                         PUSH word ptr [BP + 0x6]
1000:3f1b          9a5f0b0000                     CALLF 0x0000:0b5f
1000:3f20          83c404                         ADD SP,0x4
1000:3f23          99                             CWD
1000:3f24          2bc2                           SUB AX,DX
1000:3f26          d1f8                           SAR AX,0x1
1000:3f28          8b4e0c                         MOV CX,word ptr [BP + 0xc]
1000:3f2b          2b4e0a                         SUB CX,word ptr [BP + 0xa]
1000:3f2e          d1e9                           SHR CX,0x1
1000:3f30          2bc8                           SUB CX,AX
1000:3f32          034e0a                         ADD CX,word ptr [BP + 0xa]
1000:3f35          51                             PUSH CX
1000:3f36          9a7a0d0000                     CALLF 0x0000:0d7a
1000:3f3b          83c404                         ADD SP,0x4
1000:3f3e          ff7608                         PUSH word ptr [BP + 0x8]
1000:3f41          ff7606                         PUSH word ptr [BP + 0x6]
1000:3f44          9a600a0000                     CALLF 0x0000:0a60
1000:3f49          83c404                         ADD SP,0x4
1000:3f4c          5d                             POP BP
1000:3f4d          cb                             RETF
FUN_1000_3f4e:
1000:3f4e          55                             PUSH BP
1000:3f4f          8bec                           MOV BP,SP
1000:3f51          83ec1c                         SUB SP,0x1c
1000:3f54          56                             PUSH SI
1000:3f55          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:3f58          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:3f5b          8946e4                         MOV word ptr [BP + -0x1c],AX
1000:3f5e          8956e6                         MOV word ptr [BP + -0x1a],DX
1000:3f61          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:3f64          8b560c                         MOV DX,word ptr [BP + 0xc]
1000:3f67          8946e8                         MOV word ptr [BP + -0x18],AX
1000:3f6a          8956ea                         MOV word ptr [BP + -0x16],DX
1000:3f6d          c746ec0100                     MOV word ptr [BP + -0x14],0x1
LAB_1000_3f72:
1000:3f72          8d46f2                         LEA AX,[BP + -0xe]
1000:3f75          16                             PUSH SS
1000:3f76          50                             PUSH AX
1000:3f77          9ae0030000                     CALLF 0x0000:03e0
1000:3f7c          83c404                         ADD SP,0x4
1000:3f7f          807ef203                       CMP byte ptr [BP + -0xe],0x3
1000:3f83          7558                           JNZ 0x1000:3fdd
1000:3f85          807ef80d                       CMP byte ptr [BP + -0x8],0xd
1000:3f89          7406                           JZ 0x1000:3f91
1000:3f8b          807ef820                       CMP byte ptr [BP + -0x8],0x20
1000:3f8f          7525                           JNZ 0x1000:3fb6
LAB_1000_3f91:
1000:3f91          8e06640f                       MOV ES,word ptr [0xf64]
1000:3f95          26ff366a01                     PUSH word ptr ES:[0x16a]
1000:3f9a          26ff366801                     PUSH word ptr ES:[0x168]
1000:3f9f          9aa1017503                     CALLF 0x0000:38f1
1000:3fa4          83c404                         ADD SP,0x4
1000:3fa7          837eec00                       CMP word ptr [BP + -0x14],0x0
1000:3fab          7503                           JNZ 0x1000:3fb0
1000:3fad          e9cb01                         JMP 0x1000:417b
LAB_1000_3fb0:
1000:3fb0          b80100                         MOV AX,0x1
1000:3fb3          e9c701                         JMP 0x1000:417d
LAB_1000_3fb6:
1000:3fb6          807ef81b                       CMP byte ptr [BP + -0x8],0x1b
1000:3fba          7503                           JNZ 0x1000:3fbf
1000:3fbc          e9bc01                         JMP 0x1000:417b
LAB_1000_3fbf:
1000:3fbf          807ef809                       CMP byte ptr [BP + -0x8],0x9
1000:3fc3          7518                           JNZ 0x1000:3fdd
1000:3fc5          8d46ec                         LEA AX,[BP + -0x14]
1000:3fc8          16                             PUSH SS
1000:3fc9          50                             PUSH AX
1000:3fca          ff760c                         PUSH word ptr [BP + 0xc]
1000:3fcd          ff760a                         PUSH word ptr [BP + 0xa]
1000:3fd0          ff7608                         PUSH word ptr [BP + 0x8]
1000:3fd3          ff7606                         PUSH word ptr [BP + 0x6]
1000:3fd6          0e                             PUSH CS
1000:3fd7          e82d02                         CALL 0x1000:4207
1000:3fda          83c40c                         ADD SP,0xc
LAB_1000_3fdd:
1000:3fdd          807ef205                       CMP byte ptr [BP + -0xe],0x5
1000:3fe1          7536                           JNZ 0x1000:4019
1000:3fe3          807ef94b                       CMP byte ptr [BP + -0x7],0x4b
1000:3fe7          7418                           JZ 0x1000:4001
1000:3fe9          807ef94d                       CMP byte ptr [BP + -0x7],0x4d
1000:3fed          7412                           JZ 0x1000:4001
1000:3fef          807ef950                       CMP byte ptr [BP + -0x7],0x50
1000:3ff3          740c                           JZ 0x1000:4001
1000:3ff5          807ef948                       CMP byte ptr [BP + -0x7],0x48
1000:3ff9          7406                           JZ 0x1000:4001
1000:3ffb          807ef90f                       CMP byte ptr [BP + -0x7],0xf
1000:3fff          7518                           JNZ 0x1000:4019
LAB_1000_4001:
1000:4001          8d46ec                         LEA AX,[BP + -0x14]
1000:4004          16                             PUSH SS
1000:4005          50                             PUSH AX
1000:4006          ff760c                         PUSH word ptr [BP + 0xc]
1000:4009          ff760a                         PUSH word ptr [BP + 0xa]
1000:400c          ff7608                         PUSH word ptr [BP + 0x8]
1000:400f          ff7606                         PUSH word ptr [BP + 0x6]
1000:4012          0e                             PUSH CS
1000:4013          e8f101                         CALL 0x1000:4207
1000:4016          83c40c                         ADD SP,0xc
LAB_1000_4019:
1000:4019          807ef201                       CMP byte ptr [BP + -0xe],0x1
1000:401d          7403                           JZ 0x1000:4022
1000:401f          e950ff                         JMP 0x1000:3f72
LAB_1000_4022:
1000:4022          ff76f6                         PUSH word ptr [BP + -0xa]
1000:4025          ff76f4                         PUSH word ptr [BP + -0xc]
1000:4028          9a7a0d0000                     CALLF 0x0000:0d7a
1000:402d          83c404                         ADD SP,0x4
1000:4030          c746f00000                     MOV word ptr [BP + -0x10],0x0
1000:4035          eb03                           JMP 0x1000:403a
LAB_1000_4037:
1000:4037          ff46f0                         INC word ptr [BP + -0x10]
LAB_1000_403a:
1000:403a          837ef002                       CMP word ptr [BP + -0x10],0x2
1000:403e          7d1c                           JGE 0x1000:405c
1000:4040          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:4043          d1e6                           SHL SI,0x1
1000:4045          d1e6                           SHL SI,0x1
1000:4047          ff72e6                         PUSH word ptr [BP + SI + -0x1a]
1000:404a          ff72e4                         PUSH word ptr [BP + SI + -0x1c]
1000:404d          9a75120000                     CALLF 0x0000:1275
1000:4052          83c404                         ADD SP,0x4
1000:4055          8946fe                         MOV word ptr [BP + -0x2],AX
1000:4058          0bc0                           OR AX,AX
1000:405a          74db                           JZ 0x1000:4037
LAB_1000_405c:
1000:405c          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:4060          7503                           JNZ 0x1000:4065
1000:4062          e90dff                         JMP 0x1000:3f72
LAB_1000_4065:
1000:4065          c746ee0100                     MOV word ptr [BP + -0x12],0x1
1000:406a          b80200                         MOV AX,0x2
1000:406d          50                             PUSH AX
1000:406e          9a26100000                     CALLF 0x0000:1026
1000:4073          83c402                         ADD SP,0x2
1000:4076          b8ff00                         MOV AX,0xff
1000:4079          50                             PUSH AX
1000:407a          b80b00                         MOV AX,0xb
1000:407d          50                             PUSH AX
1000:407e          9a0a009502                     CALLF 0x0000:295a
1000:4083          83c404                         ADD SP,0x4
1000:4086          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:4089          d1e6                           SHL SI,0x1
1000:408b          d1e6                           SHL SI,0x1
1000:408d          ff72e6                         PUSH word ptr [BP + SI + -0x1a]
1000:4090          ff72e4                         PUSH word ptr [BP + SI + -0x1c]
1000:4093          0e                             PUSH CS
1000:4094          e8eb00                         CALL 0x1000:4182
1000:4097          83c404                         ADD SP,0x4
LAB_1000_409a:
1000:409a          8d46f2                         LEA AX,[BP + -0xe]
1000:409d          16                             PUSH SS
1000:409e          50                             PUSH AX
1000:409f          9ae0030000                     CALLF 0x0000:03e0
1000:40a4          83c404                         ADD SP,0x4
1000:40a7          807ef204                       CMP byte ptr [BP + -0xe],0x4
1000:40ab          7570                           JNZ 0x1000:411d
1000:40ad          ff76f6                         PUSH word ptr [BP + -0xa]
1000:40b0          ff76f4                         PUSH word ptr [BP + -0xc]
1000:40b3          9a7a0d0000                     CALLF 0x0000:0d7a
1000:40b8          83c404                         ADD SP,0x4
1000:40bb          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:40be          d1e6                           SHL SI,0x1
1000:40c0          d1e6                           SHL SI,0x1
1000:40c2          ff72e6                         PUSH word ptr [BP + SI + -0x1a]
1000:40c5          ff72e4                         PUSH word ptr [BP + SI + -0x1c]
1000:40c8          9a75120000                     CALLF 0x0000:1275
1000:40cd          83c404                         ADD SP,0x4
1000:40d0          8946fe                         MOV word ptr [BP + -0x2],AX
1000:40d3          0bc0                           OR AX,AX
1000:40d5          7421                           JZ 0x1000:40f8
1000:40d7          837eee00                       CMP word ptr [BP + -0x12],0x0
1000:40db          751b                           JNZ 0x1000:40f8
1000:40dd          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:40e0          d1e6                           SHL SI,0x1
1000:40e2          d1e6                           SHL SI,0x1
1000:40e4          ff72e6                         PUSH word ptr [BP + SI + -0x1a]
1000:40e7          ff72e4                         PUSH word ptr [BP + SI + -0x1c]
1000:40ea          0e                             PUSH CS
1000:40eb          e89400                         CALL 0x1000:4182
1000:40ee          83c404                         ADD SP,0x4
1000:40f1          c746ee0100                     MOV word ptr [BP + -0x12],0x1
1000:40f6          eb25                           JMP 0x1000:411d
LAB_1000_40f8:
1000:40f8          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:40fc          751f                           JNZ 0x1000:411d
1000:40fe          837eee00                       CMP word ptr [BP + -0x12],0x0
1000:4102          7419                           JZ 0x1000:411d
1000:4104          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:4107          d1e6                           SHL SI,0x1
1000:4109          d1e6                           SHL SI,0x1
1000:410b          ff72e6                         PUSH word ptr [BP + SI + -0x1a]
1000:410e          ff72e4                         PUSH word ptr [BP + SI + -0x1c]
1000:4111          0e                             PUSH CS
1000:4112          e86d00                         CALL 0x1000:4182
1000:4115          83c404                         ADD SP,0x4
1000:4118          c746ee0000                     MOV word ptr [BP + -0x12],0x0
LAB_1000_411d:
1000:411d          807ef202                       CMP byte ptr [BP + -0xe],0x2
1000:4121          7403                           JZ 0x1000:4126
1000:4123          e974ff                         JMP 0x1000:409a
LAB_1000_4126:
1000:4126          ff76f6                         PUSH word ptr [BP + -0xa]
1000:4129          ff76f4                         PUSH word ptr [BP + -0xc]
1000:412c          9a7a0d0000                     CALLF 0x0000:0d7a
1000:4131          83c404                         ADD SP,0x4
1000:4134          837eee00                       CMP word ptr [BP + -0x12],0x0
1000:4138          7419                           JZ 0x1000:4153
1000:413a          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:413d          d1e6                           SHL SI,0x1
1000:413f          d1e6                           SHL SI,0x1
1000:4141          ff72e6                         PUSH word ptr [BP + SI + -0x1a]
1000:4144          ff72e4                         PUSH word ptr [BP + SI + -0x1c]
1000:4147          0e                             PUSH CS
1000:4148          e83700                         CALL 0x1000:4182
1000:414b          83c404                         ADD SP,0x4
1000:414e          c746ee0000                     MOV word ptr [BP + -0x12],0x0
LAB_1000_4153:
1000:4153          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:4156          d1e6                           SHL SI,0x1
1000:4158          d1e6                           SHL SI,0x1
1000:415a          ff72e6                         PUSH word ptr [BP + SI + -0x1a]
1000:415d          ff72e4                         PUSH word ptr [BP + SI + -0x1c]
1000:4160          9a75120000                     CALLF 0x0000:1275
1000:4165          83c404                         ADD SP,0x4
1000:4168          8946fe                         MOV word ptr [BP + -0x2],AX
1000:416b          0bc0                           OR AX,AX
1000:416d          7503                           JNZ 0x1000:4172
1000:416f          e900fe                         JMP 0x1000:3f72
LAB_1000_4172:
1000:4172          837ef000                       CMP word ptr [BP + -0x10],0x0
1000:4176          7503                           JNZ 0x1000:417b
1000:4178          e935fe                         JMP 0x1000:3fb0
LAB_1000_417b:
1000:417b          2bc0                           SUB AX,AX
LAB_1000_417d:
1000:417d          5e                             POP SI
1000:417e          8be5                           MOV SP,BP
1000:4180          5d                             POP BP
1000:4181          cb                             RETF
FUN_1000_4182:
1000:4182          55                             PUSH BP
1000:4183          8bec                           MOV BP,SP
1000:4185          83ec08                         SUB SP,0x8
1000:4188          c45e06                         LES BX,[BP + 0x6]
1000:418b          268b07                         MOV AX,word ptr ES:[BX]
1000:418e          40                             INC AX
1000:418f          8946f8                         MOV word ptr [BP + -0x8],AX
1000:4192          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:4196          48                             DEC AX
1000:4197          48                             DEC AX
1000:4198          8946fc                         MOV word ptr [BP + -0x4],AX
1000:419b          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:419f          40                             INC AX
1000:41a0          8946fa                         MOV word ptr [BP + -0x6],AX
1000:41a3          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:41a7          48                             DEC AX
1000:41a8          8946fe                         MOV word ptr [BP + -0x2],AX
1000:41ab          b80200                         MOV AX,0x2
1000:41ae          50                             PUSH AX
1000:41af          9a26100000                     CALLF 0x0000:1026
1000:41b4          83c402                         ADD SP,0x2
1000:41b7          8e06640f                       MOV ES,word ptr [0xf64]
1000:41bb          26ff366a01                     PUSH word ptr ES:[0x16a]
1000:41c0          26ff366801                     PUSH word ptr ES:[0x168]
1000:41c5          9aa1017503                     CALLF 0x0000:38f1
1000:41ca          83c404                         ADD SP,0x4
1000:41cd          8e06660f                       MOV ES,word ptr [0xf66]
1000:41d1          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:41d7          7e10                           JLE 0x1000:41e9
1000:41d9          8e06680f                       MOV ES,word ptr [0xf68]
1000:41dd          26ff365c00                     PUSH word ptr ES:[0x5c]
1000:41e2          26ff365a00                     PUSH word ptr ES:[0x5a]
1000:41e7          eb08                           JMP 0x1000:41f1
LAB_1000_41e9:
1000:41e9          b81006                         MOV AX,0x610
1000:41ec          ba2514                         MOV DX,0x1425
1000:41ef          52                             PUSH DX
1000:41f0          50                             PUSH AX
LAB_1000_41f1:
1000:41f1          9a2e0f0000                     CALLF 0x0000:0f2e
1000:41f6          83c404                         ADD SP,0x4
1000:41f9          8d46f8                         LEA AX,[BP + -0x8]
1000:41fc          16                             PUSH SS
1000:41fd          50                             PUSH AX
1000:41fe          9ac80e0000                     CALLF 0x0000:0ec8
1000:4203          8be5                           MOV SP,BP
1000:4205          5d                             POP BP
1000:4206          cb                             RETF
FUN_1000_4207:
1000:4207          55                             PUSH BP
1000:4208          8bec                           MOV BP,SP
1000:420a          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:420d          0b460c                         OR AX,word ptr [BP + 0xc]
1000:4210          7461                           JZ 0x1000:4273
1000:4212          c45e0e                         LES BX,[BP + 0xe]
1000:4215          26833f00                       CMP word ptr ES:[BX],0x0
1000:4219          742d                           JZ 0x1000:4248
1000:421b          2bc0                           SUB AX,AX
1000:421d          50                             PUSH AX
1000:421e          ff7608                         PUSH word ptr [BP + 0x8]
1000:4221          ff7606                         PUSH word ptr [BP + 0x6]
1000:4224          9a45063b05                     CALLF 0x0000:59f5
1000:4229          83c406                         ADD SP,0x6
1000:422c          b80100                         MOV AX,0x1
1000:422f          50                             PUSH AX
1000:4230          ff760c                         PUSH word ptr [BP + 0xc]
1000:4233          ff760a                         PUSH word ptr [BP + 0xa]
1000:4236          9a45063b05                     CALLF 0x0000:59f5
1000:423b          83c406                         ADD SP,0x6
1000:423e          c45e0e                         LES BX,[BP + 0xe]
1000:4241          26c7070000                     MOV word ptr ES:[BX],0x0
1000:4246          eb2b                           JMP 0x1000:4273
LAB_1000_4248:
1000:4248          2bc0                           SUB AX,AX
1000:424a          50                             PUSH AX
1000:424b          ff760c                         PUSH word ptr [BP + 0xc]
1000:424e          ff760a                         PUSH word ptr [BP + 0xa]
1000:4251          9a45063b05                     CALLF 0x0000:59f5
1000:4256          83c406                         ADD SP,0x6
1000:4259          b80100                         MOV AX,0x1
1000:425c          50                             PUSH AX
1000:425d          ff7608                         PUSH word ptr [BP + 0x8]
1000:4260          ff7606                         PUSH word ptr [BP + 0x6]
1000:4263          9a45063b05                     CALLF 0x0000:59f5
1000:4268          83c406                         ADD SP,0x6
1000:426b          c45e0e                         LES BX,[BP + 0xe]
1000:426e          26c7070100                     MOV word ptr ES:[BX],0x1
LAB_1000_4273:
1000:4273          5d                             POP BP
1000:4274          cb                             RETF
FUN_1000_4275:
1000:4275          55                             PUSH BP
1000:4276          8bec                           MOV BP,SP
1000:4278          81ecce00                       SUB SP,0xce
1000:427c          56                             PUSH SI
1000:427d          c746b40000                     MOV word ptr [BP + -0x4c],0x0
1000:4282          8d468c                         LEA AX,[BP + -0x74]
1000:4285          16                             PUSH SS
1000:4286          50                             PUSH AX
1000:4287          9a940f0000                     CALLF 0x0000:0f94
1000:428c          83c404                         ADD SP,0x4
1000:428f          8d8666ff                       LEA AX,[BP + 0xff66]
1000:4293          16                             PUSH SS
1000:4294          50                             PUSH AX
1000:4295          9aa3090000                     CALLF 0x0000:09a3
1000:429a          83c404                         ADD SP,0x4
1000:429d          8d8666ff                       LEA AX,[BP + 0xff66]
1000:42a1          16                             PUSH SS
1000:42a2          50                             PUSH AX
1000:42a3          9a610f0000                     CALLF 0x0000:0f61
1000:42a8          83c404                         ADD SP,0x4
1000:42ab          8e066a0f                       MOV ES,word ptr [0xf6a]
1000:42af          8b4614                         MOV AX,word ptr [BP + 0x14]
1000:42b2          26a31803                       MOV ES:[0x318],AX
1000:42b6          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:42bb          eb03                           JMP 0x1000:42c0
LAB_1000_42bd:
1000:42bd          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_42c0:
1000:42c0          8b4614                         MOV AX,word ptr [BP + 0x14]
1000:42c3          3946fe                         CMP word ptr [BP + -0x2],AX
1000:42c6          7d0c                           JGE 0x1000:42d4
1000:42c8          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:42cb          c47616                         LES SI,[BP + 0x16]
1000:42ce          26803800                       CMP byte ptr ES:[BX + SI],0x0
1000:42d2          75e9                           JNZ 0x1000:42bd
LAB_1000_42d4:
1000:42d4          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:42d8          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:42db          26a35800                       MOV ES:[0x58],AX
1000:42df          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:42e3          40                             INC AX
1000:42e4          26a35003                       MOV ES:[0x350],AX
1000:42e8          8e06700f                       MOV ES,word ptr [0xf70]
1000:42ec          26c6063a0300                   MOV byte ptr ES:[0x33a],0x0
1000:42f2          8e06720f                       MOV ES,word ptr [0xf72]
1000:42f6          8d46c2                         LEA AX,[BP + -0x3e]
1000:42f9          26a30c03                       MOV ES:[0x30c],AX
1000:42fd          268c160e03                     MOV word ptr ES:[0x30e],SS
1000:4302          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:4307          eb1b                           JMP 0x1000:4324
LAB_1000_4309:
1000:4309          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:430c          c47616                         LES SI,[BP + 0x16]
1000:430f          268a00                         MOV AL,byte ptr ES:[BX + SI]
1000:4312          8e06720f                       MOV ES,word ptr [0xf72]
1000:4316          26c41e0c03                     LES BX,ES:[0x30c]
1000:431b          8b76fe                         MOV SI,word ptr [BP + -0x2]
1000:431e          268800                         MOV byte ptr ES:[BX + SI],AL
1000:4321          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_4324:
1000:4324          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4328          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:432b          2639065003                     CMP word ptr ES:[0x350],AX
1000:4330          7fd7                           JG 0x1000:4309
1000:4332          8bd8                           MOV BX,AX
1000:4334          8e06720f                       MOV ES,word ptr [0xf72]
1000:4338          26c4360c03                     LES SI,ES:[0x30c]
1000:433d          26c6400100                     MOV byte ptr ES:[BX + SI + 0x1],0x0
1000:4342          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:4347          eb3e                           JMP 0x1000:4387
LAB_1000_4349:
1000:4349          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:434c          d1e3                           SHL BX,0x1
1000:434e          d1e3                           SHL BX,0x1
1000:4350          c4760a                         LES SI,[BP + 0xa]
1000:4353          268b00                         MOV AX,word ptr ES:[BX + SI]
1000:4356          268b5002                       MOV DX,word ptr ES:[BX + SI + 0x2]
1000:435a          898632ff                       MOV word ptr [BP + 0xff32],AX
1000:435e          899634ff                       MOV word ptr [BP + 0xff34],DX
1000:4362          0bc2                           OR AX,DX
1000:4364          7410                           JZ 0x1000:4376
1000:4366          52                             PUSH DX
1000:4367          ffb632ff                       PUSH word ptr [BP + 0xff32]
1000:436b          9a5f0b0000                     CALLF 0x0000:0b5f
1000:4370          83c404                         ADD SP,0x4
1000:4373          8946b6                         MOV word ptr [BP + -0x4a],AX
LAB_1000_4376:
1000:4376          8b46b4                         MOV AX,word ptr [BP + -0x4c]
1000:4379          3946b6                         CMP word ptr [BP + -0x4a],AX
1000:437c          7e06                           JLE 0x1000:4384
1000:437e          8b46b6                         MOV AX,word ptr [BP + -0x4a]
1000:4381          8946b4                         MOV word ptr [BP + -0x4c],AX
LAB_1000_4384:
1000:4384          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_4387:
1000:4387          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:438a          3946fe                         CMP word ptr [BP + -0x2],AX
1000:438d          7cba                           JL 0x1000:4349
1000:438f          8b4614                         MOV AX,word ptr [BP + 0x14]
1000:4392          b103                           MOV CL,0x3
1000:4394          d3e0                           SHL AX,CL
1000:4396          050800                         ADD AX,0x8
1000:4399          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:439c          8b46b4                         MOV AX,word ptr [BP + -0x4c]
1000:439f          3946b6                         CMP word ptr [BP + -0x4a],AX
1000:43a2          7e06                           JLE 0x1000:43aa
1000:43a4          8b46b6                         MOV AX,word ptr [BP + -0x4a]
1000:43a7          8946b4                         MOV word ptr [BP + -0x4c],AX
LAB_1000_43aa:
1000:43aa          817e06a00f                     CMP word ptr [BP + 0x6],0xfa0
1000:43af          751e                           JNZ 0x1000:43cf
1000:43b1          8b46b4                         MOV AX,word ptr [BP + -0x4c]
1000:43b4          051900                         ADD AX,0x19
1000:43b7          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:43ba          b84001                         MOV AX,0x140
1000:43bd          2b46b6                         SUB AX,word ptr [BP + -0x4a]
1000:43c0          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:43c3          b90200                         MOV CX,0x2
1000:43c6          99                             CWD
1000:43c7          f7f9                           IDIV CX
1000:43c9          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:43cc          894606                         MOV word ptr [BP + 0x6],AX
LAB_1000_43cf:
1000:43cf          817e08a00f                     CMP word ptr [BP + 0x8],0xfa0
1000:43d4          7521                           JNZ 0x1000:43f7
1000:43d6          b80a00                         MOV AX,0xa
1000:43d9          f76e12                         IMUL word ptr [BP + 0x12]
1000:43dc          054100                         ADD AX,0x41
1000:43df          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:43e2          b8c800                         MOV AX,0xc8
1000:43e5          2b46b6                         SUB AX,word ptr [BP + -0x4a]
1000:43e8          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:43eb          b90200                         MOV CX,0x2
1000:43ee          99                             CWD
1000:43ef          f7f9                           IDIV CX
1000:43f1          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:43f4          894608                         MOV word ptr [BP + 0x8],AX
LAB_1000_43f7:
1000:43f7          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:43fa          89863eff                       MOV word ptr [BP + 0xff3e],AX
1000:43fe          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:4401          898640ff                       MOV word ptr [BP + 0xff40],AX
1000:4405          8b46b4                         MOV AX,word ptr [BP + -0x4c]
1000:4408          034606                         ADD AX,word ptr [BP + 0x6]
1000:440b          051900                         ADD AX,0x19
1000:440e          898642ff                       MOV word ptr [BP + 0xff42],AX
1000:4412          b80a00                         MOV AX,0xa
1000:4415          f76e12                         IMUL word ptr [BP + 0x12]
1000:4418          034608                         ADD AX,word ptr [BP + 0x8]
1000:441b          054100                         ADD AX,0x41
1000:441e          898644ff                       MOV word ptr [BP + 0xff44],AX
1000:4422          c646c000                       MOV byte ptr [BP + -0x40],0x0
1000:4426          8b4622                         MOV AX,word ptr [BP + 0x22]
1000:4429          0b4624                         OR AX,word ptr [BP + 0x24]
1000:442c          7515                           JNZ 0x1000:4443
1000:442e          ff76b2                         PUSH word ptr [BP + -0x4e]
1000:4431          9a7115aa05                     CALLF 0x0000:7011
1000:4436          83c402                         ADD SP,0x2
1000:4439          894622                         MOV word ptr [BP + 0x22],AX
1000:443c          895624                         MOV word ptr [BP + 0x24],DX
1000:443f          c646c001                       MOV byte ptr [BP + -0x40],0x1
LAB_1000_4443:
1000:4443          ff7624                         PUSH word ptr [BP + 0x24]
1000:4446          ff7622                         PUSH word ptr [BP + 0x22]
1000:4449          9af90a0000                     CALLF 0x0000:0af9
1000:444e          83c404                         ADD SP,0x4
1000:4451          8d863eff                       LEA AX,[BP + 0xff3e]
1000:4455          16                             PUSH SS
1000:4456          50                             PUSH AX
1000:4457          9a8d130000                     CALLF 0x0000:138d
1000:445c          83c404                         ADD SP,0x4
1000:445f          8d863eff                       LEA AX,[BP + 0xff3e]
1000:4463          16                             PUSH SS
1000:4464          50                             PUSH AX
1000:4465          0e                             PUSH CS
1000:4466          e8d4f9                         CALL 0x1000:3e3d
1000:4469          83c404                         ADD SP,0x4
1000:446c          8b863eff                       MOV AX,word ptr [BP + 0xff3e]
1000:4470          050a00                         ADD AX,0xa
1000:4473          89865eff                       MOV word ptr [BP + 0xff5e],AX
1000:4477          8b8644ff                       MOV AX,word ptr [BP + 0xff44]
1000:447b          2d0a00                         SUB AX,0xa
1000:447e          898664ff                       MOV word ptr [BP + 0xff64],AX
1000:4482          2d0b00                         SUB AX,0xb
1000:4485          898660ff                       MOV word ptr [BP + 0xff60],AX
1000:4489          ff761c                         PUSH word ptr [BP + 0x1c]
1000:448c          ff761a                         PUSH word ptr [BP + 0x1a]
1000:448f          9a5f0b0000                     CALLF 0x0000:0b5f
1000:4494          83c404                         ADD SP,0x4
1000:4497          03865eff                       ADD AX,word ptr [BP + 0xff5e]
1000:449b          050900                         ADD AX,0x9
1000:449e          898662ff                       MOV word ptr [BP + 0xff62],AX
1000:44a2          8b461a                         MOV AX,word ptr [BP + 0x1a]
1000:44a5          0b461c                         OR AX,word ptr [BP + 0x1c]
1000:44a8          7428                           JZ 0x1000:44d2
1000:44aa          8b8642ff                       MOV AX,word ptr [BP + 0xff42]
1000:44ae          2d0a00                         SUB AX,0xa
1000:44b1          898652ff                       MOV word ptr [BP + 0xff52],AX
1000:44b5          ff7620                         PUSH word ptr [BP + 0x20]
1000:44b8          ff761e                         PUSH word ptr [BP + 0x1e]
1000:44bb          9a5f0b0000                     CALLF 0x0000:0b5f
1000:44c0          83c404                         ADD SP,0x4
1000:44c3          8b8e52ff                       MOV CX,word ptr [BP + 0xff52]
1000:44c7          2bc8                           SUB CX,AX
1000:44c9          83e909                         SUB CX,0x9
1000:44cc          898e4eff                       MOV word ptr [BP + 0xff4e],CX
1000:44d0          eb45                           JMP 0x1000:4517
LAB_1000_44d2:
1000:44d2          ff7620                         PUSH word ptr [BP + 0x20]
1000:44d5          ff761e                         PUSH word ptr [BP + 0x1e]
1000:44d8          9a5f0b0000                     CALLF 0x0000:0b5f
1000:44dd          83c404                         ADD SP,0x4
1000:44e0          99                             CWD
1000:44e1          2bc2                           SUB AX,DX
1000:44e3          d1f8                           SAR AX,0x1
1000:44e5          8b8e42ff                       MOV CX,word ptr [BP + 0xff42]
1000:44e9          2b8e3eff                       SUB CX,word ptr [BP + 0xff3e]
1000:44ed          d1e9                           SHR CX,0x1
1000:44ef          2bc8                           SUB CX,AX
1000:44f1          038e3eff                       ADD CX,word ptr [BP + 0xff3e]
1000:44f5          898e4eff                       MOV word ptr [BP + 0xff4e],CX
1000:44f9          83ae4eff04                     SUB word ptr [BP + 0xff4e],0x4
1000:44fe          ff7620                         PUSH word ptr [BP + 0x20]
1000:4501          ff761e                         PUSH word ptr [BP + 0x1e]
1000:4504          9a5f0b0000                     CALLF 0x0000:0b5f
1000:4509          83c404                         ADD SP,0x4
1000:450c          03864eff                       ADD AX,word ptr [BP + 0xff4e]
1000:4510          050900                         ADD AX,0x9
1000:4513          898652ff                       MOV word ptr [BP + 0xff52],AX
LAB_1000_4517:
1000:4517          8b8660ff                       MOV AX,word ptr [BP + 0xff60]
1000:451b          898650ff                       MOV word ptr [BP + 0xff50],AX
1000:451f          8b8664ff                       MOV AX,word ptr [BP + 0xff64]
1000:4523          898654ff                       MOV word ptr [BP + 0xff54],AX
1000:4527          8b864eff                       MOV AX,word ptr [BP + 0xff4e]
1000:452b          48                             DEC AX
1000:452c          48                             DEC AX
1000:452d          8946b8                         MOV word ptr [BP + -0x48],AX
1000:4530          8b8652ff                       MOV AX,word ptr [BP + 0xff52]
1000:4534          40                             INC AX
1000:4535          8946bc                         MOV word ptr [BP + -0x44],AX
1000:4538          8b8650ff                       MOV AX,word ptr [BP + 0xff50]
1000:453c          48                             DEC AX
1000:453d          48                             DEC AX
1000:453e          8946ba                         MOV word ptr [BP + -0x46],AX
1000:4541          8b8654ff                       MOV AX,word ptr [BP + 0xff54]
1000:4545          40                             INC AX
1000:4546          8946be                         MOV word ptr [BP + -0x42],AX
1000:4549          8b865eff                       MOV AX,word ptr [BP + 0xff5e]
1000:454d          48                             DEC AX
1000:454e          48                             DEC AX
1000:454f          898646ff                       MOV word ptr [BP + 0xff46],AX
1000:4553          8b8662ff                       MOV AX,word ptr [BP + 0xff62]
1000:4557          40                             INC AX
1000:4558          89864aff                       MOV word ptr [BP + 0xff4a],AX
1000:455c          8b46ba                         MOV AX,word ptr [BP + -0x46]
1000:455f          898648ff                       MOV word ptr [BP + 0xff48],AX
1000:4563          8b46be                         MOV AX,word ptr [BP + -0x42]
1000:4566          89864cff                       MOV word ptr [BP + 0xff4c],AX
1000:456a          8b7614                         MOV SI,word ptr [BP + 0x14]
1000:456d          b103                           MOV CL,0x3
1000:456f          d3e6                           SHL SI,CL
1000:4571          8d4410                         LEA AX,[SI + 0x10]
1000:4574          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:4577          8b8642ff                       MOV AX,word ptr [BP + 0xff42]
1000:457b          2b863eff                       SUB AX,word ptr [BP + 0xff3e]
1000:457f          8946fe                         MOV word ptr [BP + -0x2],AX
1000:4582          2b46b6                         SUB AX,word ptr [BP + -0x4a]
1000:4585          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:4588          b90200                         MOV CX,0x2
1000:458b          99                             CWD
1000:458c          f7f9                           IDIV CX
1000:458e          8946b6                         MOV word ptr [BP + -0x4a],AX
1000:4591          03863eff                       ADD AX,word ptr [BP + 0xff3e]
1000:4595          898656ff                       MOV word ptr [BP + 0xff56],AX
1000:4599          03c6                           ADD AX,SI
1000:459b          051000                         ADD AX,0x10
1000:459e          89865aff                       MOV word ptr [BP + 0xff5a],AX
1000:45a2          b80a00                         MOV AX,0xa
1000:45a5          f76e12                         IMUL word ptr [BP + 0x12]
1000:45a8          038640ff                       ADD AX,word ptr [BP + 0xff40]
1000:45ac          051100                         ADD AX,0x11
1000:45af          898658ff                       MOV word ptr [BP + 0xff58],AX
1000:45b3          050c00                         ADD AX,0xc
1000:45b6          89865cff                       MOV word ptr [BP + 0xff5c],AX
1000:45ba          8b8656ff                       MOV AX,word ptr [BP + 0xff56]
1000:45be          48                             DEC AX
1000:45bf          48                             DEC AX
1000:45c0          898636ff                       MOV word ptr [BP + 0xff36],AX
1000:45c4          8b865aff                       MOV AX,word ptr [BP + 0xff5a]
1000:45c8          40                             INC AX
1000:45c9          89863aff                       MOV word ptr [BP + 0xff3a],AX
1000:45cd          8b8658ff                       MOV AX,word ptr [BP + 0xff58]
1000:45d1          48                             DEC AX
1000:45d2          48                             DEC AX
1000:45d3          898638ff                       MOV word ptr [BP + 0xff38],AX
1000:45d7          8b865cff                       MOV AX,word ptr [BP + 0xff5c]
1000:45db          40                             INC AX
1000:45dc          89863cff                       MOV word ptr [BP + 0xff3c],AX
1000:45e0          8d864eff                       LEA AX,[BP + 0xff4e]
1000:45e4          16                             PUSH SS
1000:45e5          50                             PUSH AX
1000:45e6          9afb0e0000                     CALLF 0x0000:0efb
1000:45eb          83c404                         ADD SP,0x4
1000:45ee          2bc0                           SUB AX,AX
1000:45f0          50                             PUSH AX
1000:45f1          b80800                         MOV AX,0x8
1000:45f4          50                             PUSH AX
1000:45f5          9a0a009502                     CALLF 0x0000:295a
1000:45fa          83c404                         ADD SP,0x4
1000:45fd          8b8650ff                       MOV AX,word ptr [BP + 0xff50]
1000:4601          40                             INC AX
1000:4602          50                             PUSH AX
1000:4603          8b8652ff                       MOV AX,word ptr [BP + 0xff52]
1000:4607          48                             DEC AX
1000:4608          50                             PUSH AX
1000:4609          9a7a0d0000                     CALLF 0x0000:0d7a
1000:460e          83c404                         ADD SP,0x4
1000:4611          8b8654ff                       MOV AX,word ptr [BP + 0xff54]
1000:4615          48                             DEC AX
1000:4616          50                             PUSH AX
1000:4617          8b8652ff                       MOV AX,word ptr [BP + 0xff52]
1000:461b          48                             DEC AX
1000:461c          50                             PUSH AX
1000:461d          9adb0b0000                     CALLF 0x0000:0bdb
1000:4622          83c404                         ADD SP,0x4
1000:4625          8b8654ff                       MOV AX,word ptr [BP + 0xff54]
1000:4629          48                             DEC AX
1000:462a          50                             PUSH AX
1000:462b          ffb64eff                       PUSH word ptr [BP + 0xff4e]
1000:462f          9adb0b0000                     CALLF 0x0000:0bdb
1000:4634          83c404                         ADD SP,0x4
1000:4637          8b461a                         MOV AX,word ptr [BP + 0x1a]
1000:463a          0b461c                         OR AX,word ptr [BP + 0x1c]
1000:463d          7467                           JZ 0x1000:46a6
1000:463f          b80806                         MOV AX,0x608
1000:4642          ba2514                         MOV DX,0x1425
1000:4645          52                             PUSH DX
1000:4646          50                             PUSH AX
1000:4647          9a2e0f0000                     CALLF 0x0000:0f2e
1000:464c          83c404                         ADD SP,0x4
1000:464f          8d865eff                       LEA AX,[BP + 0xff5e]
1000:4653          16                             PUSH SS
1000:4654          50                             PUSH AX
1000:4655          9afb0e0000                     CALLF 0x0000:0efb
1000:465a          83c404                         ADD SP,0x4
1000:465d          2bc0                           SUB AX,AX
1000:465f          50                             PUSH AX
1000:4660          b80800                         MOV AX,0x8
1000:4663          50                             PUSH AX
1000:4664          9a0a009502                     CALLF 0x0000:295a
1000:4669          83c404                         ADD SP,0x4
1000:466c          8b8660ff                       MOV AX,word ptr [BP + 0xff60]
1000:4670          40                             INC AX
1000:4671          50                             PUSH AX
1000:4672          8b8662ff                       MOV AX,word ptr [BP + 0xff62]
1000:4676          48                             DEC AX
1000:4677          50                             PUSH AX
1000:4678          9a7a0d0000                     CALLF 0x0000:0d7a
1000:467d          83c404                         ADD SP,0x4
1000:4680          8b8664ff                       MOV AX,word ptr [BP + 0xff64]
1000:4684          48                             DEC AX
1000:4685          50                             PUSH AX
1000:4686          8b8662ff                       MOV AX,word ptr [BP + 0xff62]
1000:468a          48                             DEC AX
switchD_1000:96f1::caseD_4:
1000:468b          50                             PUSH AX
1000:468c          9adb0b0000                     CALLF 0x0000:0bdb
1000:4691          83c404                         ADD SP,0x4
1000:4694          8b8664ff                       MOV AX,word ptr [BP + 0xff64]
1000:4698          48                             DEC AX
1000:4699          50                             PUSH AX
1000:469a          ffb65eff                       PUSH word ptr [BP + 0xff5e]
1000:469e          9adb0b0000                     CALLF 0x0000:0bdb
1000:46a3          83c404                         ADD SP,0x4
LAB_1000_46a6:
1000:46a6          8d8656ff                       LEA AX,[BP + 0xff56]
1000:46aa          16                             PUSH SS
1000:46ab          50                             PUSH AX
1000:46ac          9afb0e0000                     CALLF 0x0000:0efb
1000:46b1          83c404                         ADD SP,0x4
1000:46b4          2bc0                           SUB AX,AX
1000:46b6          50                             PUSH AX
1000:46b7          b80800                         MOV AX,0x8
1000:46ba          50                             PUSH AX
1000:46bb          9a0a009502                     CALLF 0x0000:295a
1000:46c0          83c404                         ADD SP,0x4
1000:46c3          8b8658ff                       MOV AX,word ptr [BP + 0xff58]
1000:46c7          40                             INC AX
1000:46c8          50                             PUSH AX
1000:46c9          8b865aff                       MOV AX,word ptr [BP + 0xff5a]
1000:46cd          48                             DEC AX
1000:46ce          50                             PUSH AX
1000:46cf          9a7a0d0000                     CALLF 0x0000:0d7a
1000:46d4          83c404                         ADD SP,0x4
1000:46d7          8b865cff                       MOV AX,word ptr [BP + 0xff5c]
1000:46db          48                             DEC AX
1000:46dc          50                             PUSH AX
1000:46dd          8b865aff                       MOV AX,word ptr [BP + 0xff5a]
1000:46e1          48                             DEC AX
1000:46e2          50                             PUSH AX
1000:46e3          9adb0b0000                     CALLF 0x0000:0bdb
1000:46e8          83c404                         ADD SP,0x4
1000:46eb          8b865cff                       MOV AX,word ptr [BP + 0xff5c]
1000:46ef          48                             DEC AX
1000:46f0          50                             PUSH AX
1000:46f1          ffb656ff                       PUSH word ptr [BP + 0xff56]
1000:46f5          9adb0b0000                     CALLF 0x0000:0bdb
1000:46fa          83c404                         ADD SP,0x4
1000:46fd          b80100                         MOV AX,0x1
1000:4700          50                             PUSH AX
1000:4701          8d8656ff                       LEA AX,[BP + 0xff56]
1000:4705          16                             PUSH SS
1000:4706          50                             PUSH AX
1000:4707          9a45063b05                     CALLF 0x0000:59f5
1000:470c          83c406                         ADD SP,0x6
1000:470f          b80b00                         MOV AX,0xb
1000:4712          50                             PUSH AX
1000:4713          9a100e0000                     CALLF 0x0000:0e10
1000:4718          83c402                         ADD SP,0x2
1000:471b          8b8654ff                       MOV AX,word ptr [BP + 0xff54]
1000:471f          48                             DEC AX
1000:4720          50                             PUSH AX
1000:4721          8b864eff                       MOV AX,word ptr [BP + 0xff4e]
1000:4725          050500                         ADD AX,0x5
1000:4728          50                             PUSH AX
1000:4729          9a7a0d0000                     CALLF 0x0000:0d7a
1000:472e          83c404                         ADD SP,0x4
1000:4731          ff7620                         PUSH word ptr [BP + 0x20]
1000:4734          ff761e                         PUSH word ptr [BP + 0x1e]
1000:4737          9a600a0000                     CALLF 0x0000:0a60
1000:473c          83c404                         ADD SP,0x4
1000:473f          8b865cff                       MOV AX,word ptr [BP + 0xff5c]
1000:4743          48                             DEC AX
1000:4744          50                             PUSH AX
1000:4745          8b8656ff                       MOV AX,word ptr [BP + 0xff56]
1000:4749          050500                         ADD AX,0x5
1000:474c          50                             PUSH AX
1000:474d          9a7a0d0000                     CALLF 0x0000:0d7a
1000:4752          83c404                         ADD SP,0x4
1000:4755          ff7618                         PUSH word ptr [BP + 0x18]
1000:4758          ff7616                         PUSH word ptr [BP + 0x16]
1000:475b          9a600a0000                     CALLF 0x0000:0a60
1000:4760          83c404                         ADD SP,0x4
1000:4763          8b461a                         MOV AX,word ptr [BP + 0x1a]
1000:4766          0b461c                         OR AX,word ptr [BP + 0x1c]
1000:4769          7424                           JZ 0x1000:478f
1000:476b          8b8664ff                       MOV AX,word ptr [BP + 0xff64]
1000:476f          48                             DEC AX
1000:4770          50                             PUSH AX
1000:4771          8b865eff                       MOV AX,word ptr [BP + 0xff5e]
1000:4775          050400                         ADD AX,0x4
1000:4778          50                             PUSH AX
1000:4779          9a7a0d0000                     CALLF 0x0000:0d7a
1000:477e          83c404                         ADD SP,0x4
1000:4781          ff761c                         PUSH word ptr [BP + 0x1c]
1000:4784          ff761a                         PUSH word ptr [BP + 0x1a]
1000:4787          9a600a0000                     CALLF 0x0000:0a60
1000:478c          83c404                         ADD SP,0x4
LAB_1000_478f:
1000:478f          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:4794          eb4b                           JMP 0x1000:47e1
LAB_1000_4796:
1000:4796          b80a00                         MOV AX,0xa
1000:4799          f76efe                         IMUL word ptr [BP + -0x2]
1000:479c          038640ff                       ADD AX,word ptr [BP + 0xff40]
1000:47a0          051100                         ADD AX,0x11
1000:47a3          50                             PUSH AX
1000:47a4          8b863eff                       MOV AX,word ptr [BP + 0xff3e]
1000:47a8          050a00                         ADD AX,0xa
1000:47ab          50                             PUSH AX
1000:47ac          9a7a0d0000                     CALLF 0x0000:0d7a
1000:47b1          83c404                         ADD SP,0x4
1000:47b4          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:47b7          d1e3                           SHL BX,0x1
1000:47b9          d1e3                           SHL BX,0x1
1000:47bb          c4760a                         LES SI,[BP + 0xa]
1000:47be          268b00                         MOV AX,word ptr ES:[BX + SI]
1000:47c1          268b5002                       MOV DX,word ptr ES:[BX + SI + 0x2]
1000:47c5          898632ff                       MOV word ptr [BP + 0xff32],AX
1000:47c9          899634ff                       MOV word ptr [BP + 0xff34],DX
1000:47cd          0bc2                           OR AX,DX
1000:47cf          740d                           JZ 0x1000:47de
1000:47d1          52                             PUSH DX
1000:47d2          ffb632ff                       PUSH word ptr [BP + 0xff32]
1000:47d6          9a600a0000                     CALLF 0x0000:0a60
1000:47db          83c404                         ADD SP,0x4
LAB_1000_47de:
1000:47de          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_47e1:
1000:47e1          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:47e4          3946fe                         CMP word ptr [BP + -0x2],AX
1000:47e7          7d4d                           JGE 0x1000:4836
1000:47e9          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:47ec          c4760e                         LES SI,[BP + 0xe]
1000:47ef          26803801                       CMP byte ptr ES:[BX + SI],0x1
1000:47f3          75a1                           JNZ 0x1000:4796
1000:47f5          d1e3                           SHL BX,0x1
1000:47f7          d1e3                           SHL BX,0x1
1000:47f9          c4760a                         LES SI,[BP + 0xa]
1000:47fc          268b00                         MOV AX,word ptr ES:[BX + SI]
1000:47ff          268b5002                       MOV DX,word ptr ES:[BX + SI + 0x2]
1000:4803          898632ff                       MOV word ptr [BP + 0xff32],AX
1000:4807          899634ff                       MOV word ptr [BP + 0xff34],DX
1000:480b          0bc2                           OR AX,DX
1000:480d          7487                           JZ 0x1000:4796
1000:480f          b80a00                         MOV AX,0xa
1000:4812          f76efe                         IMUL word ptr [BP + -0x2]
1000:4815          038640ff                       ADD AX,word ptr [BP + 0xff40]
1000:4819          051100                         ADD AX,0x11
1000:481c          50                             PUSH AX
1000:481d          ffb642ff                       PUSH word ptr [BP + 0xff42]
1000:4821          ffb63eff                       PUSH word ptr [BP + 0xff3e]
1000:4825          ffb634ff                       PUSH word ptr [BP + 0xff34]
1000:4829          ffb632ff                       PUSH word ptr [BP + 0xff32]
1000:482d          0e                             PUSH CS
1000:482e          e8def6                         CALL 0x1000:3f0f
1000:4831          83c40a                         ADD SP,0xa
1000:4834          eba8                           JMP 0x1000:47de
LAB_1000_4836:
1000:4836          8b461a                         MOV AX,word ptr [BP + 0x1a]
1000:4839          0b461c                         OR AX,word ptr [BP + 0x1c]
1000:483c          7407                           JZ 0x1000:4845
1000:483e          8d865eff                       LEA AX,[BP + 0xff5e]
1000:4842          16                             PUSH SS
1000:4843          eb03                           JMP 0x1000:4848
LAB_1000_4845:
1000:4845          2bc0                           SUB AX,AX
1000:4847          50                             PUSH AX
LAB_1000_4848:
1000:4848          50                             PUSH AX
1000:4849          8d864eff                       LEA AX,[BP + 0xff4e]
1000:484d          16                             PUSH SS
1000:484e          50                             PUSH AX
1000:484f          8d8656ff                       LEA AX,[BP + 0xff56]
1000:4853          16                             PUSH SS
1000:4854          50                             PUSH AX
1000:4855          0e                             PUSH CS
1000:4856          e85906                         CALL 0x1000:4eb2
1000:4859          83c40c                         ADD SP,0xc
1000:485c          8946fe                         MOV word ptr [BP + -0x2],AX
1000:485f          ff7624                         PUSH word ptr [BP + 0x24]
1000:4862          ff7622                         PUSH word ptr [BP + 0x22]
1000:4865          9a2c0b0000                     CALLF 0x0000:0b2c
1000:486a          83c404                         ADD SP,0x4
1000:486d          8d863eff                       LEA AX,[BP + 0xff3e]
1000:4871          16                             PUSH SS
1000:4872          50                             PUSH AX
1000:4873          9ac0130000                     CALLF 0x0000:13c0
1000:4878          83c404                         ADD SP,0x4
1000:487b          807ec000                       CMP byte ptr [BP + -0x40],0x0
1000:487f          7416                           JZ 0x1000:4897
1000:4881          8b4622                         MOV AX,word ptr [BP + 0x22]
1000:4884          0b4624                         OR AX,word ptr [BP + 0x24]
1000:4887          740e                           JZ 0x1000:4897
1000:4889          ff7624                         PUSH word ptr [BP + 0x24]
1000:488c          ff7622                         PUSH word ptr [BP + 0x22]
1000:488f          9a5c15aa05                     CALLF 0x0000:6ffc
1000:4894          83c404                         ADD SP,0x4
LAB_1000_4897:
1000:4897          8d468c                         LEA AX,[BP + -0x74]
1000:489a          16                             PUSH SS
1000:489b          50                             PUSH AX
1000:489c          9a610f0000                     CALLF 0x0000:0f61
1000:48a1          83c404                         ADD SP,0x4
1000:48a4          c746b60000                     MOV word ptr [BP + -0x4a],0x0
1000:48a9          eb1a                           JMP 0x1000:48c5
LAB_1000_48ab:
1000:48ab          8e06720f                       MOV ES,word ptr [0xf72]
1000:48af          26c41e0c03                     LES BX,ES:[0x30c]
1000:48b4          8b76b6                         MOV SI,word ptr [BP + -0x4a]
1000:48b7          268a00                         MOV AL,byte ptr ES:[BX + SI]
1000:48ba          8bde                           MOV BX,SI
1000:48bc          c47616                         LES SI,[BP + 0x16]
1000:48bf          268800                         MOV byte ptr ES:[BX + SI],AL
1000:48c2          ff46b6                         INC word ptr [BP + -0x4a]
LAB_1000_48c5:
1000:48c5          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:48c9          8b46b6                         MOV AX,word ptr [BP + -0x4a]
1000:48cc          2639065800                     CMP word ptr ES:[0x58],AX
1000:48d1          7fd8                           JG 0x1000:48ab
1000:48d3          8bd8                           MOV BX,AX
1000:48d5          c47616                         LES SI,[BP + 0x16]
1000:48d8          26c60000                       MOV byte ptr ES:[BX + SI],0x0
1000:48dc          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:48df          5e                             POP SI
1000:48e0          8be5                           MOV SP,BP
1000:48e2          5d                             POP BP
1000:48e3          cb                             RETF
FUN_1000_48e4:
1000:48e4          55                             PUSH BP
1000:48e5          8bec                           MOV BP,SP
1000:48e7          83ec10                         SUB SP,0x10
1000:48ea          56                             PUSH SI
1000:48eb          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:48ef          26833e580000                   CMP word ptr ES:[0x58],0x0
1000:48f5          7503                           JNZ 0x1000:48fa
1000:48f7          e9de00                         JMP 0x1000:49d8
LAB_1000_48fa:
1000:48fa          c45e06                         LES BX,[BP + 0x6]
1000:48fd          268b07                         MOV AX,word ptr ES:[BX]
1000:4900          8946f4                         MOV word ptr [BP + -0xc],AX
1000:4903          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:4907          40                             INC AX
1000:4908          8946f2                         MOV word ptr [BP + -0xe],AX
1000:490b          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:490f          48                             DEC AX
1000:4910          8946f6                         MOV word ptr [BP + -0xa],AX
1000:4913          ff760c                         PUSH word ptr [BP + 0xc]
1000:4916          ff760a                         PUSH word ptr [BP + 0xa]
1000:4919          9a7a0d0000                     CALLF 0x0000:0d7a
1000:491e          83c404                         ADD SP,0x4
1000:4921          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:4926          eb03                           JMP 0x1000:492b
LAB_1000_4928:
1000:4928          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_492b:
1000:492b          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:492f          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:4932          2639065800                     CMP word ptr ES:[0x58],AX
1000:4937          7e75                           JLE 0x1000:49ae
1000:4939          8e06720f                       MOV ES,word ptr [0xf72]
1000:493d          26c41e0c03                     LES BX,ES:[0x30c]
1000:4942          8bf0                           MOV SI,AX
1000:4944          268a00                         MOV AL,byte ptr ES:[BX + SI]
1000:4947          8846f8                         MOV byte ptr [BP + -0x8],AL
1000:494a          c646f900                       MOV byte ptr [BP + -0x7],0x0
1000:494e          8d46f8                         LEA AX,[BP + -0x8]
1000:4951          16                             PUSH SS
1000:4952          50                             PUSH AX
1000:4953          9a5f0b0000                     CALLF 0x0000:0b5f
1000:4958          83c404                         ADD SP,0x4
1000:495b          8946fc                         MOV word ptr [BP + -0x4],AX
1000:495e          8b46f4                         MOV AX,word ptr [BP + -0xc]
1000:4961          8946f0                         MOV word ptr [BP + -0x10],AX
1000:4964          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:4967          0346f0                         ADD AX,word ptr [BP + -0x10]
1000:496a          8946f4                         MOV word ptr [BP + -0xc],AX
1000:496d          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:4971          7504                           JNZ 0x1000:4977
1000:4973          8346f405                       ADD word ptr [BP + -0xc],0x5
LAB_1000_4977:
1000:4977          8d46f0                         LEA AX,[BP + -0x10]
1000:497a          16                             PUSH SS
1000:497b          50                             PUSH AX
1000:497c          9a75120000                     CALLF 0x0000:1275
1000:4981          83c404                         ADD SP,0x4
1000:4984          8946fa                         MOV word ptr [BP + -0x6],AX
1000:4987          0bc0                           OR AX,AX
1000:4989          749d                           JZ 0x1000:4928
1000:498b          8e06700f                       MOV ES,word ptr [0xf70]
1000:498f          26803e3a0300                   CMP byte ptr ES:[0x33a],0x0
1000:4995          740d                           JZ 0x1000:49a4
1000:4997          ff7608                         PUSH word ptr [BP + 0x8]
1000:499a          ff7606                         PUSH word ptr [BP + 0x6]
1000:499d          0e                             PUSH CS
1000:499e          e8c100                         CALL 0x1000:4a62
1000:49a1          83c404                         ADD SP,0x4
LAB_1000_49a4:
1000:49a4          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:49a8          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:49ab          40                             INC AX
1000:49ac          eb26                           JMP 0x1000:49d4
LAB_1000_49ae:
1000:49ae          8e06700f                       MOV ES,word ptr [0xf70]
1000:49b2          26803e3a0300                   CMP byte ptr ES:[0x33a],0x0
1000:49b8          740d                           JZ 0x1000:49c7
1000:49ba          ff7608                         PUSH word ptr [BP + 0x8]
1000:49bd          ff7606                         PUSH word ptr [BP + 0x6]
1000:49c0          0e                             PUSH CS
1000:49c1          e89e00                         CALL 0x1000:4a62
1000:49c4          83c404                         ADD SP,0x4
LAB_1000_49c7:
1000:49c7          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:49cb          26a15800                       MOV AX,ES:[0x58]
1000:49cf          40                             INC AX
1000:49d0          8e066e0f                       MOV ES,word ptr [0xf6e]
LAB_1000_49d4:
1000:49d4          26a35003                       MOV ES:[0x350],AX
LAB_1000_49d8:
1000:49d8          5e                             POP SI
1000:49d9          8be5                           MOV SP,BP
1000:49db          5d                             POP BP
1000:49dc          cb                             RETF
FUN_1000_49dd:
1000:49dd          55                             PUSH BP
1000:49de          8bec                           MOV BP,SP
1000:49e0          807e0a00                       CMP byte ptr [BP + 0xa],0x0
1000:49e4          744c                           JZ 0x1000:4a32
1000:49e6          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:49ea          26a15003                       MOV AX,ES:[0x350]
1000:49ee          48                             DEC AX
1000:49ef          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:49f3          263b065800                     CMP AX,word ptr ES:[0x58]
1000:49f8          7466                           JZ 0x1000:4a60
1000:49fa          8e066a0f                       MOV ES,word ptr [0xf6a]
1000:49fe          26a11803                       MOV AX,ES:[0x318]
1000:4a02          40                             INC AX
1000:4a03          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4a07          263b065003                     CMP AX,word ptr ES:[0x350]
1000:4a0c          7452                           JZ 0x1000:4a60
1000:4a0e          8e06700f                       MOV ES,word ptr [0xf70]
1000:4a12          26803e3a0300                   CMP byte ptr ES:[0x33a],0x0
1000:4a18          740d                           JZ 0x1000:4a27
1000:4a1a          ff7608                         PUSH word ptr [BP + 0x8]
1000:4a1d          ff7606                         PUSH word ptr [BP + 0x6]
1000:4a20          0e                             PUSH CS
1000:4a21          e83e00                         CALL 0x1000:4a62
1000:4a24          83c404                         ADD SP,0x4
LAB_1000_4a27:
1000:4a27          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4a2b          26ff065003                     INC word ptr ES:[0x350]
1000:4a30          eb2e                           JMP 0x1000:4a60
LAB_1000_4a32:
1000:4a32          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4a36          26833e500301                   CMP word ptr ES:[0x350],0x1
1000:4a3c          7422                           JZ 0x1000:4a60
1000:4a3e          8e06700f                       MOV ES,word ptr [0xf70]
1000:4a42          26803e3a0300                   CMP byte ptr ES:[0x33a],0x0
1000:4a48          740d                           JZ 0x1000:4a57
1000:4a4a          ff7608                         PUSH word ptr [BP + 0x8]
1000:4a4d          ff7606                         PUSH word ptr [BP + 0x6]
1000:4a50          0e                             PUSH CS
1000:4a51          e80e00                         CALL 0x1000:4a62
1000:4a54          83c404                         ADD SP,0x4
LAB_1000_4a57:
1000:4a57          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4a5b          26ff0e5003                     DEC word ptr ES:[0x350]
LAB_1000_4a60:
1000:4a60          5d                             POP BP
1000:4a61          cb                             RETF
FUN_1000_4a62:
1000:4a62          55                             PUSH BP
1000:4a63          8bec                           MOV BP,SP
1000:4a65          83ec38                         SUB SP,0x38
1000:4a68          56                             PUSH SI
1000:4a69          8e06700f                       MOV ES,word ptr [0xf70]
1000:4a6d          2680363a03ff                   XOR byte ptr ES:[0x33a],0xff
1000:4a73          b80200                         MOV AX,0x2
1000:4a76          50                             PUSH AX
1000:4a77          9a26100000                     CALLF 0x0000:1026
1000:4a7c          83c402                         ADD SP,0x2
1000:4a7f          b80100                         MOV AX,0x1
1000:4a82          50                             PUSH AX
1000:4a83          50                             PUSH AX
1000:4a84          9ac70f0000                     CALLF 0x0000:0fc7
1000:4a89          83c404                         ADD SP,0x4
1000:4a8c          b8ff00                         MOV AX,0xff
1000:4a8f          50                             PUSH AX
1000:4a90          b80b00                         MOV AX,0xb
1000:4a93          50                             PUSH AX
1000:4a94          9a0a009502                     CALLF 0x0000:295a
1000:4a99          83c404                         ADD SP,0x4
1000:4a9c          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:4aa1          eb15                           JMP 0x1000:4ab8
LAB_1000_4aa3:
1000:4aa3          8e06720f                       MOV ES,word ptr [0xf72]
1000:4aa7          26c41e0c03                     LES BX,ES:[0x30c]
1000:4aac          8b76fe                         MOV SI,word ptr [BP + -0x2]
1000:4aaf          268a00                         MOV AL,byte ptr ES:[BX + SI]
1000:4ab2          8842ca                         MOV byte ptr [BP + SI + -0x36],AL
1000:4ab5          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_4ab8:
1000:4ab8          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4abc          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:4abf          2639065003                     CMP word ptr ES:[0x350],AX
1000:4ac4          7fdd                           JG 0x1000:4aa3
1000:4ac6          8bf0                           MOV SI,AX
1000:4ac8          c642c900                       MOV byte ptr [BP + SI + -0x37],0x0
1000:4acc          8d46ca                         LEA AX,[BP + -0x36]
1000:4acf          16                             PUSH SS
1000:4ad0          50                             PUSH AX
1000:4ad1          9a5f0b0000                     CALLF 0x0000:0b5f
1000:4ad6          83c404                         ADD SP,0x4
1000:4ad9          8946fc                         MOV word ptr [BP + -0x4],AX
1000:4adc          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4ae0          26a15800                       MOV AX,ES:[0x58]
1000:4ae4          40                             INC AX
1000:4ae5          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4ae9          263b065003                     CMP AX,word ptr ES:[0x350]
1000:4aee          7e38                           JLE 0x1000:4b28
1000:4af0          268b365003                     MOV SI,word ptr ES:[0x350]
1000:4af5          8e06720f                       MOV ES,word ptr [0xf72]
1000:4af9          26c41e0c03                     LES BX,ES:[0x30c]
1000:4afe          268a40ff                       MOV AL,byte ptr ES:[BX + SI + -0x1]
1000:4b02          8846c8                         MOV byte ptr [BP + -0x38],AL
1000:4b05          c646c900                       MOV byte ptr [BP + -0x37],0x0
1000:4b09          8d46c8                         LEA AX,[BP + -0x38]
1000:4b0c          16                             PUSH SS
1000:4b0d          50                             PUSH AX
1000:4b0e          9a5f0b0000                     CALLF 0x0000:0b5f
1000:4b13          83c404                         ADD SP,0x4
1000:4b16          8946fe                         MOV word ptr [BP + -0x2],AX
1000:4b19          b80100                         MOV AX,0x1
1000:4b1c          50                             PUSH AX
1000:4b1d          ff76fe                         PUSH word ptr [BP + -0x2]
1000:4b20          9ac70f0000                     CALLF 0x0000:0fc7
1000:4b25          83c404                         ADD SP,0x4
LAB_1000_4b28:
1000:4b28          c45e06                         LES BX,[BP + 0x6]
1000:4b2b          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:4b2f          40                             INC AX
1000:4b30          40                             INC AX
1000:4b31          50                             PUSH AX
1000:4b32          268b07                         MOV AX,word ptr ES:[BX]
1000:4b35          0346fc                         ADD AX,word ptr [BP + -0x4]
1000:4b38          050500                         ADD AX,0x5
1000:4b3b          50                             PUSH AX
1000:4b3c          9a7a0d0000                     CALLF 0x0000:0d7a
1000:4b41          83c404                         ADD SP,0x4
1000:4b44          c45e06                         LES BX,[BP + 0x6]
1000:4b47          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:4b4b          050b00                         ADD AX,0xb
1000:4b4e          50                             PUSH AX
1000:4b4f          268b07                         MOV AX,word ptr ES:[BX]
1000:4b52          0346fc                         ADD AX,word ptr [BP + -0x4]
1000:4b55          050500                         ADD AX,0x5
1000:4b58          50                             PUSH AX
1000:4b59          9adb0b0000                     CALLF 0x0000:0bdb
1000:4b5e          83c404                         ADD SP,0x4
1000:4b61          5e                             POP SI
1000:4b62          8be5                           MOV SP,BP
1000:4b64          5d                             POP BP
1000:4b65          cb                             RETF
FUN_1000_4b66:
1000:4b66          55                             PUSH BP
1000:4b67          8bec                           MOV BP,SP
1000:4b69          83ec0a                         SUB SP,0xa
1000:4b6c          56                             PUSH SI
1000:4b6d          8e06720f                       MOV ES,word ptr [0xf72]
1000:4b71          26ff360e03                     PUSH word ptr ES:[0x30e]
1000:4b76          26ff360c03                     PUSH word ptr ES:[0x30c]
1000:4b7b          9a5f0b0000                     CALLF 0x0000:0b5f
1000:4b80          83c404                         ADD SP,0x4
1000:4b83          c45e08                         LES BX,[BP + 0x8]
1000:4b86          260307                         ADD AX,word ptr ES:[BX]
1000:4b89          2d0300                         SUB AX,0x3
1000:4b8c          8946f6                         MOV word ptr [BP + -0xa],AX
1000:4b8f          050800                         ADD AX,0x8
1000:4b92          8946fa                         MOV word ptr [BP + -0x6],AX
1000:4b95          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:4b99          40                             INC AX
1000:4b9a          8946f8                         MOV word ptr [BP + -0x8],AX
1000:4b9d          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:4ba1          48                             DEC AX
1000:4ba2          8946fc                         MOV word ptr [BP + -0x4],AX
1000:4ba5          807e0600                       CMP byte ptr [BP + 0x6],0x0
1000:4ba9          7416                           JZ 0x1000:4bc1
1000:4bab          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4baf          26833e500301                   CMP word ptr ES:[0x350],0x1
1000:4bb5          7503                           JNZ 0x1000:4bba
1000:4bb7          e91b01                         JMP 0x1000:4cd5
LAB_1000_4bba:
1000:4bba          26a15003                       MOV AX,ES:[0x350]
1000:4bbe          48                             DEC AX
1000:4bbf          eb1b                           JMP 0x1000:4bdc
LAB_1000_4bc1:
1000:4bc1          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4bc5          26a15800                       MOV AX,ES:[0x58]
1000:4bc9          40                             INC AX
1000:4bca          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4bce          263b065003                     CMP AX,word ptr ES:[0x350]
1000:4bd3          7503                           JNZ 0x1000:4bd8
1000:4bd5          e9fd00                         JMP 0x1000:4cd5
LAB_1000_4bd8:
1000:4bd8          26a15003                       MOV AX,ES:[0x350]
LAB_1000_4bdc:
1000:4bdc          48                             DEC AX
1000:4bdd          8946fe                         MOV word ptr [BP + -0x2],AX
1000:4be0          8e06700f                       MOV ES,word ptr [0xf70]
1000:4be4          26803e3a0300                   CMP byte ptr ES:[0x33a],0x0
1000:4bea          7412                           JZ 0x1000:4bfe
1000:4bec          ff760a                         PUSH word ptr [BP + 0xa]
1000:4bef          ff7608                         PUSH word ptr [BP + 0x8]
1000:4bf2          0e                             PUSH CS
1000:4bf3          e86cfe                         CALL 0x1000:4a62
1000:4bf6          83c404                         ADD SP,0x4
1000:4bf9          eb03                           JMP 0x1000:4bfe
LAB_1000_4bfb:
1000:4bfb          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_4bfe:
1000:4bfe          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4c02          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:4c05          2639065800                     CMP word ptr ES:[0x58],AX
1000:4c0a          7e20                           JLE 0x1000:4c2c
1000:4c0c          8bd8                           MOV BX,AX
1000:4c0e          8e06720f                       MOV ES,word ptr [0xf72]
1000:4c12          26c4360c03                     LES SI,ES:[0x30c]
1000:4c17          268a4001                       MOV AL,byte ptr ES:[BX + SI + 0x1]
1000:4c1b          8e06720f                       MOV ES,word ptr [0xf72]
1000:4c1f          26c41e0c03                     LES BX,ES:[0x30c]
1000:4c24          8b76fe                         MOV SI,word ptr [BP + -0x2]
1000:4c27          268800                         MOV byte ptr ES:[BX + SI],AL
1000:4c2a          ebcf                           JMP 0x1000:4bfb
LAB_1000_4c2c:
1000:4c2c          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:4c2f          8e06720f                       MOV ES,word ptr [0xf72]
1000:4c33          26c4360c03                     LES SI,ES:[0x30c]
1000:4c38          26c6400100                     MOV byte ptr ES:[BX + SI + 0x1],0x0
1000:4c3d          807e0600                       CMP byte ptr [BP + 0x6],0x0
1000:4c41          7409                           JZ 0x1000:4c4c
1000:4c43          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4c47          26ff0e5003                     DEC word ptr ES:[0x350]
LAB_1000_4c4c:
1000:4c4c          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4c50          26ff0e5800                     DEC word ptr ES:[0x58]
1000:4c55          b8ff00                         MOV AX,0xff
1000:4c58          50                             PUSH AX
1000:4c59          b80b00                         MOV AX,0xb
1000:4c5c          50                             PUSH AX
1000:4c5d          9a0a009502                     CALLF 0x0000:295a
1000:4c62          83c404                         ADD SP,0x4
1000:4c65          2bc0                           SUB AX,AX
1000:4c67          50                             PUSH AX
1000:4c68          50                             PUSH AX
1000:4c69          9ac70f0000                     CALLF 0x0000:0fc7
1000:4c6e          83c404                         ADD SP,0x4
1000:4c71          2bc0                           SUB AX,AX
1000:4c73          50                             PUSH AX
1000:4c74          9a26100000                     CALLF 0x0000:1026
1000:4c79          83c402                         ADD SP,0x2
1000:4c7c          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4c80          26833e580000                   CMP word ptr ES:[0x58],0x0
1000:4c86          7512                           JNZ 0x1000:4c9a
1000:4c88          c45e08                         LES BX,[BP + 0x8]
1000:4c8b          268b07                         MOV AX,word ptr ES:[BX]
1000:4c8e          050500                         ADD AX,0x5
1000:4c91          8946f6                         MOV word ptr [BP + -0xa],AX
1000:4c94          050800                         ADD AX,0x8
1000:4c97          8946fa                         MOV word ptr [BP + -0x6],AX
LAB_1000_4c9a:
1000:4c9a          8d46f6                         LEA AX,[BP + -0xa]
1000:4c9d          16                             PUSH SS
1000:4c9e          50                             PUSH AX
1000:4c9f          9ac80e0000                     CALLF 0x0000:0ec8
1000:4ca4          83c404                         ADD SP,0x4
1000:4ca7          c45e08                         LES BX,[BP + 0x8]
1000:4caa          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:4cae          48                             DEC AX
1000:4caf          50                             PUSH AX
1000:4cb0          268b07                         MOV AX,word ptr ES:[BX]
1000:4cb3          050500                         ADD AX,0x5
1000:4cb6          50                             PUSH AX
1000:4cb7          9a7a0d0000                     CALLF 0x0000:0d7a
1000:4cbc          83c404                         ADD SP,0x4
1000:4cbf          8e06720f                       MOV ES,word ptr [0xf72]
1000:4cc3          26ff360e03                     PUSH word ptr ES:[0x30e]
1000:4cc8          26ff360c03                     PUSH word ptr ES:[0x30c]
1000:4ccd          9a600a0000                     CALLF 0x0000:0a60
1000:4cd2          83c404                         ADD SP,0x4
LAB_1000_4cd5:
1000:4cd5          5e                             POP SI
1000:4cd6          8be5                           MOV SP,BP
1000:4cd8          5d                             POP BP
1000:4cd9          cb                             RETF
FUN_1000_4cda:
1000:4cda          55                             PUSH BP
1000:4cdb          8bec                           MOV BP,SP
1000:4cdd          83ec0a                         SUB SP,0xa
1000:4ce0          56                             PUSH SI
1000:4ce1          8e066a0f                       MOV ES,word ptr [0xf6a]
1000:4ce5          26a11803                       MOV AX,ES:[0x318]
1000:4ce9          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4ced          2639065800                     CMP word ptr ES:[0x58],AX
1000:4cf2          7503                           JNZ 0x1000:4cf7
1000:4cf4          e9b601                         JMP 0x1000:4ead
LAB_1000_4cf7:
1000:4cf7          26a15800                       MOV AX,ES:[0x58]
1000:4cfb          40                             INC AX
1000:4cfc          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4d00          263b065003                     CMP AX,word ptr ES:[0x350]
1000:4d05          7403                           JZ 0x1000:4d0a
1000:4d07          e9bf00                         JMP 0x1000:4dc9
LAB_1000_4d0a:
1000:4d0a          8e06700f                       MOV ES,word ptr [0xf70]
1000:4d0e          26803e3a0300                   CMP byte ptr ES:[0x33a],0x0
1000:4d14          740d                           JZ 0x1000:4d23
1000:4d16          ff760a                         PUSH word ptr [BP + 0xa]
1000:4d19          ff7608                         PUSH word ptr [BP + 0x8]
1000:4d1c          0e                             PUSH CS
1000:4d1d          e842fd                         CALL 0x1000:4a62
1000:4d20          83c404                         ADD SP,0x4
LAB_1000_4d23:
1000:4d23          2bc0                           SUB AX,AX
1000:4d25          50                             PUSH AX
1000:4d26          9a26100000                     CALLF 0x0000:1026
1000:4d2b          83c402                         ADD SP,0x2
1000:4d2e          b80b00                         MOV AX,0xb
1000:4d31          50                             PUSH AX
1000:4d32          9a100e0000                     CALLF 0x0000:0e10
1000:4d37          83c402                         ADD SP,0x2
1000:4d3a          8e06720f                       MOV ES,word ptr [0xf72]
1000:4d3e          26ff360e03                     PUSH word ptr ES:[0x30e]
1000:4d43          26ff360c03                     PUSH word ptr ES:[0x30c]
1000:4d48          9a5f0b0000                     CALLF 0x0000:0b5f
1000:4d4d          83c404                         ADD SP,0x4
1000:4d50          8946fc                         MOV word ptr [BP + -0x4],AX
1000:4d53          c45e08                         LES BX,[BP + 0x8]
1000:4d56          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:4d5a          48                             DEC AX
1000:4d5b          50                             PUSH AX
1000:4d5c          268b07                         MOV AX,word ptr ES:[BX]
1000:4d5f          0346fc                         ADD AX,word ptr [BP + -0x4]
1000:4d62          050500                         ADD AX,0x5
1000:4d65          50                             PUSH AX
1000:4d66          9a7a0d0000                     CALLF 0x0000:0d7a
LAB_1000_4d6b:
1000:4d6b          83c404                         ADD SP,0x4
1000:4d6e          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:4d71          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:4d74          c646ff00                       MOV byte ptr [BP + -0x1],0x0
1000:4d78          8d46fe                         LEA AX,[BP + -0x2]
1000:4d7b          16                             PUSH SS
1000:4d7c          50                             PUSH AX
1000:4d7d          9a600a0000                     CALLF 0x0000:0a60
1000:4d82          83c404                         ADD SP,0x4
1000:4d85          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4d89          268b1e5800                     MOV BX,word ptr ES:[0x58]
1000:4d8e          8e06720f                       MOV ES,word ptr [0xf72]
1000:4d92          26c4360c03                     LES SI,ES:[0x30c]
1000:4d97          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:4d9a          268800                         MOV byte ptr ES:[BX + SI],AL
1000:4d9d          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4da1          268b365800                     MOV SI,word ptr ES:[0x58]
1000:4da6          8e06720f                       MOV ES,word ptr [0xf72]
1000:4daa          26c41e0c03                     LES BX,ES:[0x30c]
1000:4daf          26c6400100                     MOV byte ptr ES:[BX + SI + 0x1],0x0
1000:4db4          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4db8          26ff065800                     INC word ptr ES:[0x58]
1000:4dbd          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4dc1          26ff065003                     INC word ptr ES:[0x350]
1000:4dc6          e9e400                         JMP 0x1000:4ead
LAB_1000_4dc9:
1000:4dc9          26a15003                       MOV AX,ES:[0x350]
1000:4dcd          48                             DEC AX
1000:4dce          8946fc                         MOV word ptr [BP + -0x4],AX
1000:4dd1          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4dd5          26ff065800                     INC word ptr ES:[0x58]
1000:4dda          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:4ddf          eb2b                           JMP 0x1000:4e0c
LAB_1000_4de1:
1000:4de1          26a15800                       MOV AX,ES:[0x58]
1000:4de5          8e06720f                       MOV ES,word ptr [0xf72]
1000:4de9          2603060c03                     ADD AX,word ptr ES:[0x30c]
1000:4dee          268b160e03                     MOV DX,word ptr ES:[0x30e]
1000:4df3          2b46fa                         SUB AX,word ptr [BP + -0x6]
1000:4df6          8946f6                         MOV word ptr [BP + -0xa],AX
1000:4df9          8956f8                         MOV word ptr [BP + -0x8],DX
1000:4dfc          c45ef6                         LES BX,[BP + -0xa]
1000:4dff          268a47ff                       MOV AL,byte ptr ES:[BX + -0x1]
1000:4e03          268807                         MOV byte ptr ES:[BX],AL
1000:4e06          ff46fa                         INC word ptr [BP + -0x6]
1000:4e09          ff46fc                         INC word ptr [BP + -0x4]
LAB_1000_4e0c:
1000:4e0c          8e066c0f                       MOV ES,word ptr [0xf6c]
1000:4e10          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:4e13          2639065800                     CMP word ptr ES:[0x58],AX
1000:4e18          7fc7                           JG 0x1000:4de1
1000:4e1a          268b365800                     MOV SI,word ptr ES:[0x58]
1000:4e1f          8e06720f                       MOV ES,word ptr [0xf72]
1000:4e23          26c41e0c03                     LES BX,ES:[0x30c]
1000:4e28          26c6400100                     MOV byte ptr ES:[BX + SI + 0x1],0x0
1000:4e2d          8e06700f                       MOV ES,word ptr [0xf70]
1000:4e31          26803e3a0300                   CMP byte ptr ES:[0x33a],0x0
1000:4e37          740d                           JZ 0x1000:4e46
1000:4e39          ff760a                         PUSH word ptr [BP + 0xa]
1000:4e3c          ff7608                         PUSH word ptr [BP + 0x8]
1000:4e3f          0e                             PUSH CS
1000:4e40          e81ffc                         CALL 0x1000:4a62
1000:4e43          83c404                         ADD SP,0x4
LAB_1000_4e46:
1000:4e46          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4e4a          268b365003                     MOV SI,word ptr ES:[0x350]
1000:4e4f          8e06720f                       MOV ES,word ptr [0xf72]
1000:4e53          26c41e0c03                     LES BX,ES:[0x30c]
1000:4e58          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:4e5b          268840ff                       MOV byte ptr ES:[BX + SI + -0x1],AL
1000:4e5f          8e066e0f                       MOV ES,word ptr [0xf6e]
1000:4e63          26ff065003                     INC word ptr ES:[0x350]
1000:4e68          2bc0                           SUB AX,AX
1000:4e6a          50                             PUSH AX
1000:4e6b          9a26100000                     CALLF 0x0000:1026
1000:4e70          83c402                         ADD SP,0x2
1000:4e73          b80b00                         MOV AX,0xb
1000:4e76          50                             PUSH AX
1000:4e77          9a100e0000                     CALLF 0x0000:0e10
1000:4e7c          83c402                         ADD SP,0x2
1000:4e7f          c45e08                         LES BX,[BP + 0x8]
1000:4e82          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:4e86          48                             DEC AX
1000:4e87          50                             PUSH AX
1000:4e88          268b07                         MOV AX,word ptr ES:[BX]
1000:4e8b          050500                         ADD AX,0x5
1000:4e8e          50                             PUSH AX
1000:4e8f          9a7a0d0000                     CALLF 0x0000:0d7a
1000:4e94          83c404                         ADD SP,0x4
1000:4e97          8e06720f                       MOV ES,word ptr [0xf72]
1000:4e9b          26ff360e03                     PUSH word ptr ES:[0x30e]
1000:4ea0          26ff360c03                     PUSH word ptr ES:[0x30c]
1000:4ea5          9a600a0000                     CALLF 0x0000:0a60
1000:4eaa          83c404                         ADD SP,0x4
LAB_1000_4ead:
1000:4ead          5e                             POP SI
1000:4eae          8be5                           MOV SP,BP
1000:4eb0          5d                             POP BP
1000:4eb1          cb                             RETF
FUN_1000_4eb2:
1000:4eb2          55                             PUSH BP
1000:4eb3          8bec                           MOV BP,SP
1000:4eb5          83ec2e                         SUB SP,0x2e
1000:4eb8          56                             PUSH SI
1000:4eb9          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:4ebc          8b560c                         MOV DX,word ptr [BP + 0xc]
1000:4ebf          8946da                         MOV word ptr [BP + -0x26],AX
1000:4ec2          8956dc                         MOV word ptr [BP + -0x24],DX
1000:4ec5          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:4ec8          8b5610                         MOV DX,word ptr [BP + 0x10]
1000:4ecb          8946de                         MOV word ptr [BP + -0x22],AX
1000:4ece          8956e0                         MOV word ptr [BP + -0x20],DX
1000:4ed1          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:4ed4          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:4ed7          8946e2                         MOV word ptr [BP + -0x1e],AX
1000:4eda          8956e4                         MOV word ptr [BP + -0x1c],DX
1000:4edd          c746ea0200                     MOV word ptr [BP + -0x16],0x2
1000:4ee2          9aa8080000                     CALLF 0x0000:08a8
1000:4ee7          8946e6                         MOV word ptr [BP + -0x1a],AX
1000:4eea          8956e8                         MOV word ptr [BP + -0x18],DX
LAB_1000_4eed:
1000:4eed          c646ee00                       MOV byte ptr [BP + -0x12],0x0
1000:4ef1          9aa8080000                     CALLF 0x0000:08a8
1000:4ef6          8946d6                         MOV word ptr [BP + -0x2a],AX
1000:4ef9          8956d8                         MOV word ptr [BP + -0x28],DX
1000:4efc          8b46e6                         MOV AX,word ptr [BP + -0x1a]
1000:4eff          8b56e8                         MOV DX,word ptr [BP + -0x18]
1000:4f02          050300                         ADD AX,0x3
1000:4f05          83d200                         ADC DX,0x0
1000:4f08          3b56d8                         CMP DX,word ptr [BP + -0x28]
1000:4f0b          7725                           JA 0x1000:4f32
1000:4f0d          7205                           JC 0x1000:4f14
1000:4f0f          3b46d6                         CMP AX,word ptr [BP + -0x2a]
1000:4f12          731e                           JNC 0x1000:4f32
LAB_1000_4f14:
1000:4f14          837eea02                       CMP word ptr [BP + -0x16],0x2
1000:4f18          7518                           JNZ 0x1000:4f32
1000:4f1a          ff7608                         PUSH word ptr [BP + 0x8]
1000:4f1d          ff7606                         PUSH word ptr [BP + 0x6]
1000:4f20          0e                             PUSH CS
1000:4f21          e83efb                         CALL 0x1000:4a62
1000:4f24          83c404                         ADD SP,0x4
1000:4f27          9aa8080000                     CALLF 0x0000:08a8
1000:4f2c          8946e6                         MOV word ptr [BP + -0x1a],AX
1000:4f2f          8956e8                         MOV word ptr [BP + -0x18],DX
LAB_1000_4f32:
1000:4f32          8d46f2                         LEA AX,[BP + -0xe]
1000:4f35          16                             PUSH SS
1000:4f36          50                             PUSH AX
1000:4f37          9ae0030000                     CALLF 0x0000:03e0
1000:4f3c          83c404                         ADD SP,0x4
1000:4f3f          807ef203                       CMP byte ptr [BP + -0xe],0x3
1000:4f43          754a                           JNZ 0x1000:4f8f
1000:4f45          8a46f8                         MOV AL,byte ptr [BP + -0x8]
1000:4f48          2ae4                           SUB AH,AH
1000:4f4a          3d0800                         CMP AX,0x8
1000:4f4d          742f                           JZ 0x1000:4f7e
1000:4f4f          3d0900                         CMP AX,0x9
1000:4f52          7503                           JNZ 0x1000:4f57
1000:4f54          e9e200                         JMP 0x1000:5039
LAB_1000_4f57:
1000:4f57          3d0d00                         CMP AX,0xd
1000:4f5a          7474                           JZ 0x1000:4fd0
1000:4f5c          3d1b00                         CMP AX,0x1b
1000:4f5f          7503                           JNZ 0x1000:4f64
1000:4f61          e99200                         JMP 0x1000:4ff6
LAB_1000_4f64:
1000:4f64          3d2000                         CMP AX,0x20
1000:4f67          747a                           JZ 0x1000:4fe3
1000:4f69          3c21                           CMP AL,0x21
1000:4f6b          7222                           JC 0x1000:4f8f
1000:4f6d          3c7d                           CMP AL,0x7d
1000:4f6f          771e                           JA 0x1000:4f8f
1000:4f71          ff7608                         PUSH word ptr [BP + 0x8]
1000:4f74          ff7606                         PUSH word ptr [BP + 0x6]
LAB_1000_4f77:
1000:4f77          50                             PUSH AX
1000:4f78          0e                             PUSH CS
1000:4f79          e85efd                         CALL 0x1000:4cda
1000:4f7c          eb0e                           JMP 0x1000:4f8c
LAB_1000_4f7e:
1000:4f7e          ff7608                         PUSH word ptr [BP + 0x8]
1000:4f81          ff7606                         PUSH word ptr [BP + 0x6]
1000:4f84          b80100                         MOV AX,0x1
1000:4f87          50                             PUSH AX
1000:4f88          0e                             PUSH CS
1000:4f89          e8dafb                         CALL 0x1000:4b66
LAB_1000_4f8c:
1000:4f8c          83c406                         ADD SP,0x6
LAB_1000_4f8f:
1000:4f8f          807ef205                       CMP byte ptr [BP + -0xe],0x5
1000:4f93          7403                           JZ 0x1000:4f98
1000:4f95          e9e600                         JMP 0x1000:507e
LAB_1000_4f98:
1000:4f98          8a46f9                         MOV AL,byte ptr [BP + -0x7]
1000:4f9b          2ae4                           SUB AH,AH
1000:4f9d          3d0f00                         CMP AX,0xf
1000:4fa0          7503                           JNZ 0x1000:4fa5
1000:4fa2          e9c500                         JMP 0x1000:506a
LAB_1000_4fa5:
1000:4fa5          3d4800                         CMP AX,0x48
1000:4fa8          7503                           JNZ 0x1000:4fad
1000:4faa          e9bd00                         JMP 0x1000:506a
LAB_1000_4fad:
1000:4fad          3d4b00                         CMP AX,0x4b
1000:4fb0          7503                           JNZ 0x1000:4fb5
1000:4fb2          e9af00                         JMP 0x1000:5064
LAB_1000_4fb5:
1000:4fb5          3d4d00                         CMP AX,0x4d
1000:4fb8          7503                           JNZ 0x1000:4fbd
1000:4fba          e9df00                         JMP 0x1000:509c
LAB_1000_4fbd:
1000:4fbd          3d5000                         CMP AX,0x50
1000:4fc0          7503                           JNZ 0x1000:4fc5
1000:4fc2          e9dd00                         JMP 0x1000:50a2
LAB_1000_4fc5:
1000:4fc5          3d5300                         CMP AX,0x53
1000:4fc8          7503                           JNZ 0x1000:4fcd
1000:4fca          e90401                         JMP 0x1000:50d1
LAB_1000_4fcd:
1000:4fcd          e9ae00                         JMP 0x1000:507e
LAB_1000_4fd0:
1000:4fd0          8b46ea                         MOV AX,word ptr [BP + -0x16]
1000:4fd3          0bc0                           OR AX,AX
1000:4fd5          741f                           JZ 0x1000:4ff6
1000:4fd7          3d0100                         CMP AX,0x1
1000:4fda          7cb3                           JL 0x1000:4f8f
1000:4fdc          3d0200                         CMP AX,0x2
1000:4fdf          7e30                           JLE 0x1000:5011
1000:4fe1          ebac                           JMP 0x1000:4f8f
LAB_1000_4fe3:
1000:4fe3          8b46ea                         MOV AX,word ptr [BP + -0x16]
1000:4fe6          0bc0                           OR AX,AX
1000:4fe8          740c                           JZ 0x1000:4ff6
1000:4fea          3d0100                         CMP AX,0x1
1000:4fed          7422                           JZ 0x1000:5011
1000:4fef          3d0200                         CMP AX,0x2
1000:4ff2          7439                           JZ 0x1000:502d
1000:4ff4          eb99                           JMP 0x1000:4f8f
LAB_1000_4ff6:
1000:4ff6          8e06640f                       MOV ES,word ptr [0xf64]
1000:4ffa          26ff366a01                     PUSH word ptr ES:[0x16a]
1000:4fff          26ff366801                     PUSH word ptr ES:[0x168]
1000:5004          9aa1017503                     CALLF 0x0000:38f1
1000:5009          83c404                         ADD SP,0x4
LAB_1000_500c:
1000:500c          2bc0                           SUB AX,AX
1000:500e          e99602                         JMP 0x1000:52a7
LAB_1000_5011:
1000:5011          8e06640f                       MOV ES,word ptr [0xf64]
1000:5015          26ff366a01                     PUSH word ptr ES:[0x16a]
1000:501a          26ff366801                     PUSH word ptr ES:[0x168]
1000:501f          9aa1017503                     CALLF 0x0000:38f1
1000:5024          83c404                         ADD SP,0x4
LAB_1000_5027:
1000:5027          b80100                         MOV AX,0x1
1000:502a          e97a02                         JMP 0x1000:52a7
LAB_1000_502d:
1000:502d          ff7608                         PUSH word ptr [BP + 0x8]
1000:5030          ff7606                         PUSH word ptr [BP + 0x6]
1000:5033          b82000                         MOV AX,0x20
1000:5036          e93eff                         JMP 0x1000:4f77
LAB_1000_5039:
1000:5039          b80100                         MOV AX,0x1
1000:503c          50                             PUSH AX
1000:503d          8d46ea                         LEA AX,[BP + -0x16]
1000:5040          16                             PUSH SS
1000:5041          50                             PUSH AX
1000:5042          ff7608                         PUSH word ptr [BP + 0x8]
1000:5045          ff7606                         PUSH word ptr [BP + 0x6]
1000:5048          ff7610                         PUSH word ptr [BP + 0x10]
1000:504b          ff760e                         PUSH word ptr [BP + 0xe]
1000:504e          ff760c                         PUSH word ptr [BP + 0xc]
1000:5051          ff760a                         PUSH word ptr [BP + 0xa]
1000:5054          ff7608                         PUSH word ptr [BP + 0x8]
1000:5057          ff7606                         PUSH word ptr [BP + 0x6]
1000:505a          0e                             PUSH CS
1000:505b          e84e02                         CALL 0x1000:52ac
1000:505e          83c416                         ADD SP,0x16
1000:5061          e92bff                         JMP 0x1000:4f8f
LAB_1000_5064:
1000:5064          837eea02                       CMP word ptr [BP + -0x16],0x2
1000:5068          7404                           JZ 0x1000:506e
LAB_1000_506a:
1000:506a          2bc0                           SUB AX,AX
1000:506c          eb37                           JMP 0x1000:50a5
LAB_1000_506e:
1000:506e          2bc0                           SUB AX,AX
LAB_1000_5070:
1000:5070          50                             PUSH AX
1000:5071          ff7608                         PUSH word ptr [BP + 0x8]
1000:5074          ff7606                         PUSH word ptr [BP + 0x6]
1000:5077          0e                             PUSH CS
1000:5078          e862f9                         CALL 0x1000:49dd
LAB_1000_507b:
1000:507b          83c406                         ADD SP,0x6
LAB_1000_507e:
1000:507e          807ef201                       CMP byte ptr [BP + -0xe],0x1
1000:5082          7403                           JZ 0x1000:5087
1000:5084          e966fe                         JMP 0x1000:4eed
LAB_1000_5087:
1000:5087          ff76f6                         PUSH word ptr [BP + -0xa]
1000:508a          ff76f4                         PUSH word ptr [BP + -0xc]
1000:508d          9a7a0d0000                     CALLF 0x0000:0d7a
1000:5092          83c404                         ADD SP,0x4
1000:5095          c746f00000                     MOV word ptr [BP + -0x10],0x0
1000:509a          eb47                           JMP 0x1000:50e3
LAB_1000_509c:
1000:509c          837eea02                       CMP word ptr [BP + -0x16],0x2
1000:50a0          742a                           JZ 0x1000:50cc
LAB_1000_50a2:
1000:50a2          b80100                         MOV AX,0x1
LAB_1000_50a5:
1000:50a5          50                             PUSH AX
1000:50a6          8d46ea                         LEA AX,[BP + -0x16]
1000:50a9          16                             PUSH SS
1000:50aa          50                             PUSH AX
1000:50ab          ff7608                         PUSH word ptr [BP + 0x8]
1000:50ae          ff7606                         PUSH word ptr [BP + 0x6]
1000:50b1          ff7610                         PUSH word ptr [BP + 0x10]
1000:50b4          ff760e                         PUSH word ptr [BP + 0xe]
1000:50b7          ff760c                         PUSH word ptr [BP + 0xc]
1000:50ba          ff760a                         PUSH word ptr [BP + 0xa]
1000:50bd          ff7608                         PUSH word ptr [BP + 0x8]
1000:50c0          ff7606                         PUSH word ptr [BP + 0x6]
1000:50c3          0e                             PUSH CS
1000:50c4          e8e501                         CALL 0x1000:52ac
1000:50c7          83c416                         ADD SP,0x16
1000:50ca          ebb2                           JMP 0x1000:507e
LAB_1000_50cc:
1000:50cc          b80100                         MOV AX,0x1
1000:50cf          eb9f                           JMP 0x1000:5070
LAB_1000_50d1:
1000:50d1          ff7608                         PUSH word ptr [BP + 0x8]
1000:50d4          ff7606                         PUSH word ptr [BP + 0x6]
1000:50d7          2bc0                           SUB AX,AX
1000:50d9          50                             PUSH AX
1000:50da          0e                             PUSH CS
1000:50db          e888fa                         CALL 0x1000:4b66
1000:50de          eb9b                           JMP 0x1000:507b
LAB_1000_50e0:
1000:50e0          ff46f0                         INC word ptr [BP + -0x10]
LAB_1000_50e3:
1000:50e3          837ef003                       CMP word ptr [BP + -0x10],0x3
1000:50e7          7d2c                           JGE 0x1000:5115
1000:50e9          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:50ec          d1e6                           SHL SI,0x1
1000:50ee          d1e6                           SHL SI,0x1
1000:50f0          8b42da                         MOV AX,word ptr [BP + SI + -0x26]
1000:50f3          8b52dc                         MOV DX,word ptr [BP + SI + -0x24]
1000:50f6          8946d2                         MOV word ptr [BP + -0x2e],AX
1000:50f9          8956d4                         MOV word ptr [BP + -0x2c],DX
1000:50fc          0bc2                           OR AX,DX
1000:50fe          740f                           JZ 0x1000:510f
1000:5100          52                             PUSH DX
1000:5101          ff76d2                         PUSH word ptr [BP + -0x2e]
1000:5104          9a75120000                     CALLF 0x0000:1275
1000:5109          83c404                         ADD SP,0x4
1000:510c          8946fe                         MOV word ptr [BP + -0x2],AX
LAB_1000_510f:
1000:510f          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:5113          74cb                           JZ 0x1000:50e0
LAB_1000_5115:
1000:5115          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:5119          7503                           JNZ 0x1000:511e
1000:511b          e9cffd                         JMP 0x1000:4eed
LAB_1000_511e:
1000:511e          c746ec0100                     MOV word ptr [BP + -0x14],0x1
1000:5123          b80200                         MOV AX,0x2
1000:5126          50                             PUSH AX
1000:5127          9a26100000                     CALLF 0x0000:1026
1000:512c          83c402                         ADD SP,0x2
1000:512f          b8ff00                         MOV AX,0xff
1000:5132          50                             PUSH AX
1000:5133          b80b00                         MOV AX,0xb
1000:5136          50                             PUSH AX
1000:5137          9a0a009502                     CALLF 0x0000:295a
1000:513c          83c404                         ADD SP,0x4
1000:513f          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:5142          d1e6                           SHL SI,0x1
1000:5144          d1e6                           SHL SI,0x1
1000:5146          ff72dc                         PUSH word ptr [BP + SI + -0x24]
1000:5149          ff72da                         PUSH word ptr [BP + SI + -0x26]
1000:514c          0e                             PUSH CS
1000:514d          e832f0                         CALL 0x1000:4182
1000:5150          83c404                         ADD SP,0x4
LAB_1000_5153:
1000:5153          8d46f2                         LEA AX,[BP + -0xe]
1000:5156          16                             PUSH SS
1000:5157          50                             PUSH AX
1000:5158          9ae0030000                     CALLF 0x0000:03e0
1000:515d          83c404                         ADD SP,0x4
1000:5160          807ef204                       CMP byte ptr [BP + -0xe],0x4
1000:5164          7570                           JNZ 0x1000:51d6
1000:5166          ff76f6                         PUSH word ptr [BP + -0xa]
1000:5169          ff76f4                         PUSH word ptr [BP + -0xc]
1000:516c          9a7a0d0000                     CALLF 0x0000:0d7a
1000:5171          83c404                         ADD SP,0x4
1000:5174          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:5177          d1e6                           SHL SI,0x1
1000:5179          d1e6                           SHL SI,0x1
1000:517b          ff72dc                         PUSH word ptr [BP + SI + -0x24]
1000:517e          ff72da                         PUSH word ptr [BP + SI + -0x26]
1000:5181          9a75120000                     CALLF 0x0000:1275
1000:5186          83c404                         ADD SP,0x4
1000:5189          8946fe                         MOV word ptr [BP + -0x2],AX
1000:518c          0bc0                           OR AX,AX
1000:518e          7421                           JZ 0x1000:51b1
1000:5190          837eec00                       CMP word ptr [BP + -0x14],0x0
1000:5194          751b                           JNZ 0x1000:51b1
1000:5196          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:5199          d1e6                           SHL SI,0x1
1000:519b          d1e6                           SHL SI,0x1
1000:519d          ff72dc                         PUSH word ptr [BP + SI + -0x24]
1000:51a0          ff72da                         PUSH word ptr [BP + SI + -0x26]
1000:51a3          0e                             PUSH CS
1000:51a4          e8dbef                         CALL 0x1000:4182
1000:51a7          83c404                         ADD SP,0x4
1000:51aa          c746ec0100                     MOV word ptr [BP + -0x14],0x1
1000:51af          eb25                           JMP 0x1000:51d6
LAB_1000_51b1:
1000:51b1          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:51b5          751f                           JNZ 0x1000:51d6
1000:51b7          837eec00                       CMP word ptr [BP + -0x14],0x0
1000:51bb          7419                           JZ 0x1000:51d6
1000:51bd          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:51c0          d1e6                           SHL SI,0x1
1000:51c2          d1e6                           SHL SI,0x1
1000:51c4          ff72dc                         PUSH word ptr [BP + SI + -0x24]
1000:51c7          ff72da                         PUSH word ptr [BP + SI + -0x26]
1000:51ca          0e                             PUSH CS
1000:51cb          e8b4ef                         CALL 0x1000:4182
1000:51ce          83c404                         ADD SP,0x4
1000:51d1          c746ec0000                     MOV word ptr [BP + -0x14],0x0
LAB_1000_51d6:
1000:51d6          807ef202                       CMP byte ptr [BP + -0xe],0x2
1000:51da          7403                           JZ 0x1000:51df
1000:51dc          e974ff                         JMP 0x1000:5153
LAB_1000_51df:
1000:51df          ff76f6                         PUSH word ptr [BP + -0xa]
1000:51e2          ff76f4                         PUSH word ptr [BP + -0xc]
1000:51e5          9a7a0d0000                     CALLF 0x0000:0d7a
1000:51ea          83c404                         ADD SP,0x4
1000:51ed          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:51f0          d1e6                           SHL SI,0x1
1000:51f2          d1e6                           SHL SI,0x1
1000:51f4          ff72dc                         PUSH word ptr [BP + SI + -0x24]
1000:51f7          ff72da                         PUSH word ptr [BP + SI + -0x26]
1000:51fa          9a75120000                     CALLF 0x0000:1275
1000:51ff          83c404                         ADD SP,0x4
1000:5202          8946fe                         MOV word ptr [BP + -0x2],AX
1000:5205          837eec00                       CMP word ptr [BP + -0x14],0x0
1000:5209          7419                           JZ 0x1000:5224
1000:520b          8b76f0                         MOV SI,word ptr [BP + -0x10]
1000:520e          d1e6                           SHL SI,0x1
1000:5210          d1e6                           SHL SI,0x1
1000:5212          ff72dc                         PUSH word ptr [BP + SI + -0x24]
1000:5215          ff72da                         PUSH word ptr [BP + SI + -0x26]
1000:5218          0e                             PUSH CS
1000:5219          e866ef                         CALL 0x1000:4182
1000:521c          83c404                         ADD SP,0x4
1000:521f          c746ec0000                     MOV word ptr [BP + -0x14],0x0
LAB_1000_5224:
1000:5224          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:5228          7503                           JNZ 0x1000:522d
1000:522a          e9c0fc                         JMP 0x1000:4eed
LAB_1000_522d:
1000:522d          8b46f0                         MOV AX,word ptr [BP + -0x10]
1000:5230          0bc0                           OR AX,AX
1000:5232          7503                           JNZ 0x1000:5237
1000:5234          e9f0fd                         JMP 0x1000:5027
LAB_1000_5237:
1000:5237          3d0100                         CMP AX,0x1
1000:523a          7503                           JNZ 0x1000:523f
1000:523c          e9cdfd                         JMP 0x1000:500c
LAB_1000_523f:
1000:523f          3d0200                         CMP AX,0x2
1000:5242          751d                           JNZ 0x1000:5261
1000:5244          ff76f6                         PUSH word ptr [BP + -0xa]
1000:5247          ff76f4                         PUSH word ptr [BP + -0xc]
1000:524a          ff7608                         PUSH word ptr [BP + 0x8]
1000:524d          ff7606                         PUSH word ptr [BP + 0x6]
switchD_1000:8905::caseD_2:
1000:5250          0e                             PUSH CS
1000:5251          e890f6                         CALL 0x1000:48e4
1000:5254          83c408                         ADD SP,0x8
1000:5257          837eea02                       CMP word ptr [BP + -0x16],0x2
1000:525b          7510                           JNZ 0x1000:526d
LAB_1000_525d:
1000:525d          c646ee01                       MOV byte ptr [BP + -0x12],0x1
LAB_1000_5261:
1000:5261          807eee00                       CMP byte ptr [BP + -0x12],0x0
1000:5265          7403                           JZ 0x1000:526a
1000:5267          e983fc                         JMP 0x1000:4eed
LAB_1000_526a:
1000:526a          e9e6fe                         JMP 0x1000:5153
LAB_1000_526d:
1000:526d          837eea01                       CMP word ptr [BP + -0x16],0x1
1000:5271          7505                           JNZ 0x1000:5278
1000:5273          b80100                         MOV AX,0x1
1000:5276          eb08                           JMP 0x1000:5280
LAB_1000_5278:
1000:5278          837eea00                       CMP word ptr [BP + -0x16],0x0
1000:527c          75e3                           JNZ 0x1000:5261
1000:527e          2bc0                           SUB AX,AX
LAB_1000_5280:
1000:5280          50                             PUSH AX
1000:5281          8d46ea                         LEA AX,[BP + -0x16]
1000:5284          16                             PUSH SS
1000:5285          50                             PUSH AX
1000:5286          ff7608                         PUSH word ptr [BP + 0x8]
1000:5289          ff7606                         PUSH word ptr [BP + 0x6]
1000:528c          ff7610                         PUSH word ptr [BP + 0x10]
1000:528f          ff760e                         PUSH word ptr [BP + 0xe]
1000:5292          ff760c                         PUSH word ptr [BP + 0xc]
1000:5295          ff760a                         PUSH word ptr [BP + 0xa]
1000:5298          ff7608                         PUSH word ptr [BP + 0x8]
1000:529b          ff7606                         PUSH word ptr [BP + 0x6]
1000:529e          0e                             PUSH CS
1000:529f          e80a00                         CALL 0x1000:52ac
1000:52a2          83c416                         ADD SP,0x16
1000:52a5          ebb6                           JMP 0x1000:525d
LAB_1000_52a7:
1000:52a7          5e                             POP SI
1000:52a8          8be5                           MOV SP,BP
1000:52aa          5d                             POP BP
1000:52ab          cb                             RETF
FUN_1000_52ac:
1000:52ac          55                             PUSH BP
1000:52ad          8bec                           MOV BP,SP
1000:52af          83ec04                         SUB SP,0x4
1000:52b2          c45e16                         LES BX,[BP + 0x16]
1000:52b5          268b07                         MOV AX,word ptr ES:[BX]
1000:52b8          0bc0                           OR AX,AX
1000:52ba          740c                           JZ 0x1000:52c8
1000:52bc          3d0100                         CMP AX,0x1
1000:52bf          7420                           JZ 0x1000:52e1
1000:52c1          3d0200                         CMP AX,0x2
1000:52c4          744a                           JZ 0x1000:5310
1000:52c6          eb73                           JMP 0x1000:533b
LAB_1000_52c8:
1000:52c8          2bc0                           SUB AX,AX
1000:52ca          50                             PUSH AX
1000:52cb          ff7610                         PUSH word ptr [BP + 0x10]
1000:52ce          ff760e                         PUSH word ptr [BP + 0xe]
1000:52d1          9a45063b05                     CALLF 0x0000:59f5
1000:52d6          83c406                         ADD SP,0x6
1000:52d9          807e1a00                       CMP byte ptr [BP + 0x1a],0x0
1000:52dd          7421                           JZ 0x1000:5300
1000:52df          eb4e                           JMP 0x1000:532f
LAB_1000_52e1:
1000:52e1          2bc0                           SUB AX,AX
1000:52e3          50                             PUSH AX
1000:52e4          ff760c                         PUSH word ptr [BP + 0xc]
1000:52e7          ff760a                         PUSH word ptr [BP + 0xa]
1000:52ea          9a45063b05                     CALLF 0x0000:59f5
1000:52ef          83c406                         ADD SP,0x6
1000:52f2          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:52f5          0b4610                         OR AX,word ptr [BP + 0x10]
1000:52f8          7406                           JZ 0x1000:5300
1000:52fa          807e1a00                       CMP byte ptr [BP + 0x1a],0x0
1000:52fe          7408                           JZ 0x1000:5308
LAB_1000_5300:
1000:5300          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:5303          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:5306          eb2d                           JMP 0x1000:5335
LAB_1000_5308:
1000:5308          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:530b          8b5610                         MOV DX,word ptr [BP + 0x10]
1000:530e          eb25                           JMP 0x1000:5335
LAB_1000_5310:
1000:5310          2bc0                           SUB AX,AX
1000:5312          50                             PUSH AX
1000:5313          ff7608                         PUSH word ptr [BP + 0x8]
1000:5316          ff7606                         PUSH word ptr [BP + 0x6]
1000:5319          9a45063b05                     CALLF 0x0000:59f5
1000:531e          83c406                         ADD SP,0x6
1000:5321          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:5324          0b4610                         OR AX,word ptr [BP + 0x10]
1000:5327          7406                           JZ 0x1000:532f
1000:5329          807e1a00                       CMP byte ptr [BP + 0x1a],0x0
1000:532d          75d9                           JNZ 0x1000:5308
LAB_1000_532f:
1000:532f          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:5332          8b560c                         MOV DX,word ptr [BP + 0xc]
LAB_1000_5335:
1000:5335          8946fc                         MOV word ptr [BP + -0x4],AX
1000:5338          8956fe                         MOV word ptr [BP + -0x2],DX
LAB_1000_533b:
1000:533b          b80100                         MOV AX,0x1
1000:533e          50                             PUSH AX
1000:533f          ff76fe                         PUSH word ptr [BP + -0x2]
1000:5342          ff76fc                         PUSH word ptr [BP + -0x4]
1000:5345          9a45063b05                     CALLF 0x0000:59f5
1000:534a          83c406                         ADD SP,0x6
1000:534d          c45e16                         LES BX,[BP + 0x16]
1000:5350          26833f02                       CMP word ptr ES:[BX],0x2
1000:5354          7519                           JNZ 0x1000:536f
1000:5356          8e06700f                       MOV ES,word ptr [0xf70]
1000:535a          26803e3a0300                   CMP byte ptr ES:[0x33a],0x0
1000:5360          740d                           JZ 0x1000:536f
1000:5362          ff7614                         PUSH word ptr [BP + 0x14]
1000:5365          ff7612                         PUSH word ptr [BP + 0x12]
1000:5368          0e                             PUSH CS
1000:5369          e8f6f6                         CALL 0x1000:4a62
1000:536c          83c404                         ADD SP,0x4
LAB_1000_536f:
1000:536f          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:5372          8b560c                         MOV DX,word ptr [BP + 0xc]
1000:5375          3946fc                         CMP word ptr [BP + -0x4],AX
1000:5378          750d                           JNZ 0x1000:5387
1000:537a          3956fe                         CMP word ptr [BP + -0x2],DX
1000:537d          7508                           JNZ 0x1000:5387
1000:537f          c45e16                         LES BX,[BP + 0x16]
1000:5382          26c7070100                     MOV word ptr ES:[BX],0x1
LAB_1000_5387:
1000:5387          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:538a          8b5610                         MOV DX,word ptr [BP + 0x10]
1000:538d          3946fc                         CMP word ptr [BP + -0x4],AX
1000:5390          750d                           JNZ 0x1000:539f
1000:5392          3956fe                         CMP word ptr [BP + -0x2],DX
1000:5395          7508                           JNZ 0x1000:539f
1000:5397          c45e16                         LES BX,[BP + 0x16]
1000:539a          26c7070000                     MOV word ptr ES:[BX],0x0
LAB_1000_539f:
1000:539f          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:53a2          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:53a5          3946fc                         CMP word ptr [BP + -0x4],AX
1000:53a8          750d                           JNZ 0x1000:53b7
1000:53aa          3956fe                         CMP word ptr [BP + -0x2],DX
1000:53ad          7508                           JNZ 0x1000:53b7
1000:53af          c45e16                         LES BX,[BP + 0x16]
1000:53b2          26c7070200                     MOV word ptr ES:[BX],0x2
LAB_1000_53b7:
1000:53b7          8be5                           MOV SP,BP
1000:53b9          5d                             POP BP
1000:53ba          cb                             RETF
FUN_1000_54bd:
1000:54bd          55                             PUSH BP
1000:54be          8bec                           MOV BP,SP
1000:54c0          83ec5a                         SUB SP,0x5a
1000:54c3          56                             PUSH SI
1000:54c4          8d46d8                         LEA AX,[BP + -0x28]
1000:54c7          16                             PUSH SS
1000:54c8          50                             PUSH AX
1000:54c9          9a940f0000                     CALLF 0x0000:0f94
1000:54ce          83c404                         ADD SP,0x4
1000:54d1          8d46b2                         LEA AX,[BP + -0x4e]
1000:54d4          16                             PUSH SS
1000:54d5          50                             PUSH AX
1000:54d6          9aa3090000                     CALLF 0x0000:09a3
1000:54db          83c404                         ADD SP,0x4
1000:54de          8d46b2                         LEA AX,[BP + -0x4e]
1000:54e1          16                             PUSH SS
1000:54e2          50                             PUSH AX
1000:54e3          9a610f0000                     CALLF 0x0000:0f61
1000:54e8          83c404                         ADD SP,0x4
1000:54eb          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:54f0          e9ae00                         JMP 0x1000:55a1
LAB_1000_54f3:
1000:54f3          2bc0                           SUB AX,AX
1000:54f5          50                             PUSH AX
1000:54f6          50                             PUSH AX
1000:54f7          9a0a009502                     CALLF 0x0000:295a
1000:54fc          83c404                         ADD SP,0x4
1000:54ff          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:5502          b103                           MOV CL,0x3
1000:5504          d3e0                           SHL AX,CL
1000:5506          034606                         ADD AX,word ptr [BP + 0x6]
1000:5509          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:550c          52                             PUSH DX
1000:550d          50                             PUSH AX
1000:550e          9afb0e0000                     CALLF 0x0000:0efb
1000:5513          83c404                         ADD SP,0x4
1000:5516          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:5519          b103                           MOV CL,0x3
1000:551b          d3e0                           SHL AX,CL
1000:551d          034606                         ADD AX,word ptr [BP + 0x6]
1000:5520          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:5523          8946ae                         MOV word ptr [BP + -0x52],AX
1000:5526          8956b0                         MOV word ptr [BP + -0x50],DX
1000:5529          c45eae                         LES BX,[BP + -0x52]
1000:552c          26ff7702                       PUSH word ptr ES:[BX + 0x2]
1000:5530          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:5534          48                             DEC AX
1000:5535          50                             PUSH AX
1000:5536          9a7a0d0000                     CALLF 0x0000:0d7a
1000:553b          83c404                         ADD SP,0x4
1000:553e          2bc0                           SUB AX,AX
1000:5540          50                             PUSH AX
1000:5541          b80800                         MOV AX,0x8
1000:5544          50                             PUSH AX
1000:5545          9a0a009502                     CALLF 0x0000:295a
1000:554a          83c404                         ADD SP,0x4
1000:554d          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:5550          b103                           MOV CL,0x3
1000:5552          d3e0                           SHL AX,CL
1000:5554          034606                         ADD AX,word ptr [BP + 0x6]
1000:5557          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:555a          8946aa                         MOV word ptr [BP + -0x56],AX
1000:555d          8956ac                         MOV word ptr [BP + -0x54],DX
1000:5560          c45eaa                         LES BX,[BP + -0x56]
1000:5563          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:5567          48                             DEC AX
1000:5568          50                             PUSH AX
1000:5569          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:556d          48                             DEC AX
1000:556e          50                             PUSH AX
1000:556f          9adb0b0000                     CALLF 0x0000:0bdb
1000:5574          83c404                         ADD SP,0x4
1000:5577          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:557a          b103                           MOV CL,0x3
1000:557c          d3e0                           SHL AX,CL
1000:557e          034606                         ADD AX,word ptr [BP + 0x6]
1000:5581          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:5584          8946a6                         MOV word ptr [BP + -0x5a],AX
1000:5587          8956a8                         MOV word ptr [BP + -0x58],DX
1000:558a          c45ea6                         LES BX,[BP + -0x5a]
1000:558d          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:5591          48                             DEC AX
1000:5592          50                             PUSH AX
1000:5593          26ff37                         PUSH word ptr ES:[BX]
1000:5596          9adb0b0000                     CALLF 0x0000:0bdb
1000:559b          83c404                         ADD SP,0x4
1000:559e          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_55a1:
1000:55a1          8b460e                         MOV AX,word ptr [BP + 0xe]
1000:55a4          3946fe                         CMP word ptr [BP + -0x2],AX
1000:55a7          7d03                           JGE 0x1000:55ac
1000:55a9          e947ff                         JMP 0x1000:54f3
LAB_1000_55ac:
1000:55ac          c45e0a                         LES BX,[BP + 0xa]
1000:55af          268b37                         MOV SI,word ptr ES:[BX]
1000:55b2          3bc6                           CMP AX,SI
1000:55b4          7c1b                           JL 0x1000:55d1
1000:55b6          b80100                         MOV AX,0x1
1000:55b9          50                             PUSH AX
1000:55ba          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:55bd          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:55c0          8bde                           MOV BX,SI
1000:55c2          b103                           MOV CL,0x3
1000:55c4          d3e3                           SHL BX,CL
1000:55c6          03c3                           ADD AX,BX
1000:55c8          52                             PUSH DX
1000:55c9          50                             PUSH AX
1000:55ca          0e                             PUSH CS
1000:55cb          e82704                         CALL 0x1000:59f5
1000:55ce          83c406                         ADD SP,0x6
LAB_1000_55d1:
1000:55d1          8d46d8                         LEA AX,[BP + -0x28]
1000:55d4          16                             PUSH SS
1000:55d5          50                             PUSH AX
1000:55d6          9a610f0000                     CALLF 0x0000:0f61
1000:55db          83c404                         ADD SP,0x4
1000:55de          5e                             POP SI
1000:55df          8be5                           MOV SP,BP
1000:55e1          5d                             POP BP
1000:55e2          cb                             RETF
FUN_1000_55e3:
1000:55e3          55                             PUSH BP
1000:55e4          8bec                           MOV BP,SP
1000:55e6          83ec52                         SUB SP,0x52
1000:55e9          c45e0e                         LES BX,[BP + 0xe]
1000:55ec          26c60700                       MOV byte ptr ES:[BX],0x0
1000:55f0          8d46d6                         LEA AX,[BP + -0x2a]
1000:55f3          16                             PUSH SS
1000:55f4          50                             PUSH AX
1000:55f5          9a940f0000                     CALLF 0x0000:0f94
1000:55fa          83c404                         ADD SP,0x4
1000:55fd          8d46b0                         LEA AX,[BP + -0x50]
1000:5600          16                             PUSH SS
1000:5601          50                             PUSH AX
1000:5602          9aa3090000                     CALLF 0x0000:09a3
1000:5607          83c404                         ADD SP,0x4
1000:560a          8d46b0                         LEA AX,[BP + -0x50]
1000:560d          16                             PUSH SS
1000:560e          50                             PUSH AX
1000:560f          9a610f0000                     CALLF 0x0000:0f61
1000:5614          83c404                         ADD SP,0x4
1000:5617          ff7618                         PUSH word ptr [BP + 0x18]
1000:561a          ff7616                         PUSH word ptr [BP + 0x16]
1000:561d          9ae0030000                     CALLF 0x0000:03e0
1000:5622          83c404                         ADD SP,0x4
1000:5625          c45e16                         LES BX,[BP + 0x16]
1000:5628          26803f03                       CMP byte ptr ES:[BX],0x3
1000:562c          7403                           JZ 0x1000:5631
1000:562e          e98400                         JMP 0x1000:56b5
LAB_1000_5631:
1000:5631          26807f060d                     CMP byte ptr ES:[BX + 0x6],0xd
1000:5636          7407                           JZ 0x1000:563f
1000:5638          26807f0620                     CMP byte ptr ES:[BX + 0x6],0x20
1000:563d          7534                           JNZ 0x1000:5673
LAB_1000_563f:
1000:563f          8e06840f                       MOV ES,word ptr [0xf84]
1000:5643          26c606600000                   MOV byte ptr ES:[0x60],0x0
LAB_1000_5649:
1000:5649          c45e0e                         LES BX,[BP + 0xe]
1000:564c          26c60701                       MOV byte ptr ES:[BX],0x1
1000:5650          8d46d6                         LEA AX,[BP + -0x2a]
1000:5653          16                             PUSH SS
1000:5654          50                             PUSH AX
1000:5655          9a610f0000                     CALLF 0x0000:0f61
1000:565a          83c404                         ADD SP,0x4
1000:565d          8e06860f                       MOV ES,word ptr [0xf86]
1000:5661          26ff366a01                     PUSH word ptr ES:[0x16a]
1000:5666          26ff366801                     PUSH word ptr ES:[0x168]
1000:566b          9aa1017503                     CALLF 0x0000:38f1
1000:5670          e90703                         JMP 0x1000:597a
LAB_1000_5673:
1000:5673          c45e16                         LES BX,[BP + 0x16]
1000:5676          26807f061b                     CMP byte ptr ES:[BX + 0x6],0x1b
1000:567b          7514                           JNZ 0x1000:5691
1000:567d          8e06840f                       MOV ES,word ptr [0xf84]
1000:5681          26c606600000                   MOV byte ptr ES:[0x60],0x0
1000:5687          c45e0a                         LES BX,[BP + 0xa]
1000:568a          26c707ffff                     MOV word ptr ES:[BX],0xffff
1000:568f          ebb8                           JMP 0x1000:5649
LAB_1000_5691:
1000:5691          c45e16                         LES BX,[BP + 0x16]
1000:5694          26807f0609                     CMP byte ptr ES:[BX + 0x6],0x9
1000:5699          751a                           JNZ 0x1000:56b5
1000:569b          ff7612                         PUSH word ptr [BP + 0x12]
1000:569e          b80100                         MOV AX,0x1
1000:56a1          50                             PUSH AX
1000:56a2          ff760c                         PUSH word ptr [BP + 0xc]
1000:56a5          ff760a                         PUSH word ptr [BP + 0xa]
1000:56a8          ff7608                         PUSH word ptr [BP + 0x8]
1000:56ab          ff7606                         PUSH word ptr [BP + 0x6]
1000:56ae          0e                             PUSH CS
1000:56af          e8cc02                         CALL 0x1000:597e
1000:56b2          83c40c                         ADD SP,0xc
LAB_1000_56b5:
1000:56b5          c45e16                         LES BX,[BP + 0x16]
1000:56b8          26803f05                       CMP byte ptr ES:[BX],0x5
1000:56bc          7403                           JZ 0x1000:56c1
1000:56be          e98600                         JMP 0x1000:5747
LAB_1000_56c1:
1000:56c1          268a4707                       MOV AL,byte ptr ES:[BX + 0x7]
1000:56c5          2ae4                           SUB AH,AH
1000:56c7          3d0f00                         CMP AX,0xf
1000:56ca          7462                           JZ 0x1000:572e
1000:56cc          3d4800                         CMP AX,0x48
1000:56cf          745d                           JZ 0x1000:572e
1000:56d1          3d4b00                         CMP AX,0x4b
1000:56d4          7412                           JZ 0x1000:56e8
1000:56d6          3d4d00                         CMP AX,0x4d
1000:56d9          7503                           JNZ 0x1000:56de
1000:56db          e98c00                         JMP 0x1000:576a
LAB_1000_56de:
1000:56de          3d5000                         CMP AX,0x50
1000:56e1          7503                           JNZ 0x1000:56e6
1000:56e3          e9c700                         JMP 0x1000:57ad
LAB_1000_56e6:
1000:56e6          eb5f                           JMP 0x1000:5747
LAB_1000_56e8:
1000:56e8          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:56eb          394614                         CMP word ptr [BP + 0x14],AX
1000:56ee          743e                           JZ 0x1000:572e
1000:56f0          b103                           MOV CL,0x3
1000:56f2          d3e0                           SHL AX,CL
1000:56f4          034606                         ADD AX,word ptr [BP + 0x6]
1000:56f7          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:56fa          52                             PUSH DX
1000:56fb          50                             PUSH AX
1000:56fc          9a92079f03                     CALLF 0x0000:4182
1000:5701          83c404                         ADD SP,0x4
1000:5704          c45e0a                         LES BX,[BP + 0xa]
1000:5707          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:570a          268907                         MOV word ptr ES:[BX],AX
1000:570d          c45e0e                         LES BX,[BP + 0xe]
1000:5710          26c60701                       MOV byte ptr ES:[BX],0x1
1000:5714          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:5717          b103                           MOV CL,0x3
1000:5719          d3e0                           SHL AX,CL
1000:571b          034606                         ADD AX,word ptr [BP + 0x6]
1000:571e          8b5608                         MOV DX,word ptr [BP + 0x8]
LAB_1000_5721:
1000:5721          52                             PUSH DX
1000:5722          50                             PUSH AX
1000:5723          9a92079f03                     CALLF 0x0000:4182
1000:5728          83c404                         ADD SP,0x4
1000:572b          e94202                         JMP 0x1000:5970
LAB_1000_572e:
1000:572e          ff7612                         PUSH word ptr [BP + 0x12]
1000:5731          2bc0                           SUB AX,AX
LAB_1000_5733:
1000:5733          50                             PUSH AX
1000:5734          ff760c                         PUSH word ptr [BP + 0xc]
1000:5737          ff760a                         PUSH word ptr [BP + 0xa]
1000:573a          ff7608                         PUSH word ptr [BP + 0x8]
1000:573d          ff7606                         PUSH word ptr [BP + 0x6]
1000:5740          0e                             PUSH CS
1000:5741          e83a02                         CALL 0x1000:597e
1000:5744          83c40c                         ADD SP,0xc
LAB_1000_5747:
1000:5747          c45e16                         LES BX,[BP + 0x16]
1000:574a          26803f01                       CMP byte ptr ES:[BX],0x1
1000:574e          7403                           JZ 0x1000:5753
1000:5750          e91d02                         JMP 0x1000:5970
LAB_1000_5753:
1000:5753          26ff7704                       PUSH word ptr ES:[BX + 0x4]
1000:5757          26ff7702                       PUSH word ptr ES:[BX + 0x2]
1000:575b          9a7a0d0000                     CALLF 0x0000:0d7a
1000:5760          83c404                         ADD SP,0x4
1000:5763          c746fc0000                     MOV word ptr [BP + -0x4],0x0
1000:5768          eb4f                           JMP 0x1000:57b9
LAB_1000_576a:
1000:576a          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:576d          394614                         CMP word ptr [BP + 0x14],AX
1000:5770          743b                           JZ 0x1000:57ad
1000:5772          b103                           MOV CL,0x3
1000:5774          d3e0                           SHL AX,CL
1000:5776          034606                         ADD AX,word ptr [BP + 0x6]
1000:5779          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:577c          050800                         ADD AX,0x8
1000:577f          52                             PUSH DX
1000:5780          50                             PUSH AX
1000:5781          9a92079f03                     CALLF 0x0000:4182
1000:5786          83c404                         ADD SP,0x4
1000:5789          c45e0a                         LES BX,[BP + 0xa]
1000:578c          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:578f          40                             INC AX
1000:5790          268907                         MOV word ptr ES:[BX],AX
1000:5793          c45e0e                         LES BX,[BP + 0xe]
1000:5796          26c60701                       MOV byte ptr ES:[BX],0x1
1000:579a          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:579d          b103                           MOV CL,0x3
1000:579f          d3e0                           SHL AX,CL
1000:57a1          034606                         ADD AX,word ptr [BP + 0x6]
1000:57a4          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:57a7          050800                         ADD AX,0x8
1000:57aa          e974ff                         JMP 0x1000:5721
LAB_1000_57ad:
1000:57ad          ff7612                         PUSH word ptr [BP + 0x12]
1000:57b0          b80100                         MOV AX,0x1
1000:57b3          e97dff                         JMP 0x1000:5733
LAB_1000_57b6:
1000:57b6          ff46fc                         INC word ptr [BP + -0x4]
LAB_1000_57b9:
1000:57b9          8b4614                         MOV AX,word ptr [BP + 0x14]
1000:57bc          3946fc                         CMP word ptr [BP + -0x4],AX
1000:57bf          7d1e                           JGE 0x1000:57df
1000:57c1          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:57c4          b103                           MOV CL,0x3
1000:57c6          d3e0                           SHL AX,CL
1000:57c8          034606                         ADD AX,word ptr [BP + 0x6]
1000:57cb          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:57ce          52                             PUSH DX
1000:57cf          50                             PUSH AX
1000:57d0          9a75120000                     CALLF 0x0000:1275
1000:57d5          83c404                         ADD SP,0x4
1000:57d8          8946fe                         MOV word ptr [BP + -0x2],AX
1000:57db          0bc0                           OR AX,AX
1000:57dd          74d7                           JZ 0x1000:57b6
LAB_1000_57df:
1000:57df          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:57e3          7503                           JNZ 0x1000:57e8
1000:57e5          e98801                         JMP 0x1000:5970
LAB_1000_57e8:
1000:57e8          c746ae0100                     MOV word ptr [BP + -0x52],0x1
1000:57ed          b80200                         MOV AX,0x2
1000:57f0          50                             PUSH AX
1000:57f1          9a26100000                     CALLF 0x0000:1026
1000:57f6          83c402                         ADD SP,0x2
1000:57f9          b8ff00                         MOV AX,0xff
1000:57fc          50                             PUSH AX
1000:57fd          b80b00                         MOV AX,0xb
1000:5800          50                             PUSH AX
1000:5801          9a0a009502                     CALLF 0x0000:295a
1000:5806          83c404                         ADD SP,0x4
1000:5809          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:580c          b103                           MOV CL,0x3
1000:580e          d3e0                           SHL AX,CL
1000:5810          034606                         ADD AX,word ptr [BP + 0x6]
1000:5813          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:5816          52                             PUSH DX
1000:5817          50                             PUSH AX
1000:5818          9a92079f03                     CALLF 0x0000:4182
1000:581d          83c404                         ADD SP,0x4
LAB_1000_5820:
1000:5820          ff7618                         PUSH word ptr [BP + 0x18]
1000:5823          ff7616                         PUSH word ptr [BP + 0x16]
1000:5826          9ae0030000                     CALLF 0x0000:03e0
1000:582b          83c404                         ADD SP,0x4
1000:582e          c45e16                         LES BX,[BP + 0x16]
1000:5831          26803f04                       CMP byte ptr ES:[BX],0x4
1000:5835          757a                           JNZ 0x1000:58b1
1000:5837          26ff7704                       PUSH word ptr ES:[BX + 0x4]
1000:583b          26ff7702                       PUSH word ptr ES:[BX + 0x2]
1000:583f          9a7a0d0000                     CALLF 0x0000:0d7a
1000:5844          83c404                         ADD SP,0x4
1000:5847          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:584a          b103                           MOV CL,0x3
1000:584c          d3e0                           SHL AX,CL
1000:584e          034606                         ADD AX,word ptr [BP + 0x6]
1000:5851          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:5854          52                             PUSH DX
1000:5855          50                             PUSH AX
1000:5856          9a75120000                     CALLF 0x0000:1275
1000:585b          83c404                         ADD SP,0x4
1000:585e          8946fe                         MOV word ptr [BP + -0x2],AX
1000:5861          0bc0                           OR AX,AX
1000:5863          7424                           JZ 0x1000:5889
1000:5865          837eae00                       CMP word ptr [BP + -0x52],0x0
1000:5869          751e                           JNZ 0x1000:5889
1000:586b          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:586e          b103                           MOV CL,0x3
1000:5870          d3e0                           SHL AX,CL
1000:5872          034606                         ADD AX,word ptr [BP + 0x6]
1000:5875          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:5878          52                             PUSH DX
1000:5879          50                             PUSH AX
1000:587a          9a92079f03                     CALLF 0x0000:4182
1000:587f          83c404                         ADD SP,0x4
1000:5882          c746ae0100                     MOV word ptr [BP + -0x52],0x1
1000:5887          eb28                           JMP 0x1000:58b1
LAB_1000_5889:
1000:5889          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:588d          7522                           JNZ 0x1000:58b1
1000:588f          837eae00                       CMP word ptr [BP + -0x52],0x0
1000:5893          741c                           JZ 0x1000:58b1
1000:5895          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:5898          b103                           MOV CL,0x3
1000:589a          d3e0                           SHL AX,CL
1000:589c          034606                         ADD AX,word ptr [BP + 0x6]
1000:589f          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:58a2          52                             PUSH DX
1000:58a3          50                             PUSH AX
1000:58a4          9a92079f03                     CALLF 0x0000:4182
1000:58a9          83c404                         ADD SP,0x4
1000:58ac          c746ae0000                     MOV word ptr [BP + -0x52],0x0
LAB_1000_58b1:
1000:58b1          c45e16                         LES BX,[BP + 0x16]
1000:58b4          26803f02                       CMP byte ptr ES:[BX],0x2
1000:58b8          7403                           JZ 0x1000:58bd
1000:58ba          e963ff                         JMP 0x1000:5820
LAB_1000_58bd:
1000:58bd          26ff7704                       PUSH word ptr ES:[BX + 0x4]
1000:58c1          26ff7702                       PUSH word ptr ES:[BX + 0x2]
1000:58c5          9a7a0d0000                     CALLF 0x0000:0d7a
1000:58ca          83c404                         ADD SP,0x4
1000:58cd          837eae00                       CMP word ptr [BP + -0x52],0x0
1000:58d1          741c                           JZ 0x1000:58ef
1000:58d3          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:58d6          b103                           MOV CL,0x3
1000:58d8          d3e0                           SHL AX,CL
1000:58da          034606                         ADD AX,word ptr [BP + 0x6]
1000:58dd          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:58e0          52                             PUSH DX
1000:58e1          50                             PUSH AX
1000:58e2          9a92079f03                     CALLF 0x0000:4182
1000:58e7          83c404                         ADD SP,0x4
1000:58ea          c746ae0000                     MOV word ptr [BP + -0x52],0x0
LAB_1000_58ef:
1000:58ef          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:58f2          b103                           MOV CL,0x3
1000:58f4          d3e0                           SHL AX,CL
1000:58f6          034606                         ADD AX,word ptr [BP + 0x6]
1000:58f9          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:58fc          52                             PUSH DX
1000:58fd          50                             PUSH AX
1000:58fe          9a75120000                     CALLF 0x0000:1275
1000:5903          83c404                         ADD SP,0x4
1000:5906          8946fe                         MOV word ptr [BP + -0x2],AX
1000:5909          0bc0                           OR AX,AX
1000:590b          7463                           JZ 0x1000:5970
1000:590d          c45e0e                         LES BX,[BP + 0xe]
1000:5910          26c60701                       MOV byte ptr ES:[BX],0x1
1000:5914          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:5917          3946fc                         CMP word ptr [BP + -0x4],AX
1000:591a          7d1c                           JGE 0x1000:5938
1000:591c          2bc0                           SUB AX,AX
1000:591e          50                             PUSH AX
1000:591f          c45e0a                         LES BX,[BP + 0xa]
1000:5922          268b07                         MOV AX,word ptr ES:[BX]
1000:5925          b103                           MOV CL,0x3
1000:5927          d3e0                           SHL AX,CL
1000:5929          034606                         ADD AX,word ptr [BP + 0x6]
1000:592c          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:592f          52                             PUSH DX
1000:5930          50                             PUSH AX
1000:5931          0e                             PUSH CS
1000:5932          e8c000                         CALL 0x1000:59f5
1000:5935          83c406                         ADD SP,0x6
LAB_1000_5938:
1000:5938          c45e0a                         LES BX,[BP + 0xa]
1000:593b          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:593e          268907                         MOV word ptr ES:[BX],AX
1000:5941          8b4612                         MOV AX,word ptr [BP + 0x12]
1000:5944          3946fc                         CMP word ptr [BP + -0x4],AX
1000:5947          7d1d                           JGE 0x1000:5966
1000:5949          b80100                         MOV AX,0x1
1000:594c          50                             PUSH AX
1000:594d          c45e0a                         LES BX,[BP + 0xa]
1000:5950          268b07                         MOV AX,word ptr ES:[BX]
1000:5953          b103                           MOV CL,0x3
1000:5955          d3e0                           SHL AX,CL
1000:5957          034606                         ADD AX,word ptr [BP + 0x6]
1000:595a          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:595d          52                             PUSH DX
1000:595e          50                             PUSH AX
1000:595f          0e                             PUSH CS
1000:5960          e89200                         CALL 0x1000:59f5
1000:5963          83c406                         ADD SP,0x6
LAB_1000_5966:
1000:5966          8e06840f                       MOV ES,word ptr [0xf84]
1000:596a          26c606600001                   MOV byte ptr ES:[0x60],0x1
LAB_1000_5970:
1000:5970          8d46d6                         LEA AX,[BP + -0x2a]
1000:5973          16                             PUSH SS
1000:5974          50                             PUSH AX
1000:5975          9a610f0000                     CALLF 0x0000:0f61
LAB_1000_597a:
1000:597a          8be5                           MOV SP,BP
1000:597c          5d                             POP BP
1000:597d          cb                             RETF
FUN_1000_597e:
1000:597e          55                             PUSH BP
1000:597f          8bec                           MOV BP,SP
1000:5981          2bc0                           SUB AX,AX
1000:5983          50                             PUSH AX
1000:5984          c45e0a                         LES BX,[BP + 0xa]
1000:5987          268b07                         MOV AX,word ptr ES:[BX]
1000:598a          b103                           MOV CL,0x3
1000:598c          d3e0                           SHL AX,CL
1000:598e          034606                         ADD AX,word ptr [BP + 0x6]
1000:5991          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:5994          52                             PUSH DX
1000:5995          50                             PUSH AX
1000:5996          0e                             PUSH CS
1000:5997          e85b00                         CALL 0x1000:59f5
1000:599a          83c406                         ADD SP,0x6
1000:599d          807e0e00                       CMP byte ptr [BP + 0xe],0x0
1000:59a1          741b                           JZ 0x1000:59be
1000:59a3          c45e0a                         LES BX,[BP + 0xa]
1000:59a6          8b4610                         MOV AX,word ptr [BP + 0x10]
1000:59a9          48                             DEC AX
1000:59aa          263907                         CMP word ptr ES:[BX],AX
1000:59ad          7507                           JNZ 0x1000:59b6
1000:59af          26c7070000                     MOV word ptr ES:[BX],0x0
1000:59b4          eb20                           JMP 0x1000:59d6
LAB_1000_59b6:
1000:59b6          c45e0a                         LES BX,[BP + 0xa]
1000:59b9          26ff07                         INC word ptr ES:[BX]
1000:59bc          eb18                           JMP 0x1000:59d6
LAB_1000_59be:
1000:59be          c45e0a                         LES BX,[BP + 0xa]
1000:59c1          26833f00                       CMP word ptr ES:[BX],0x0
1000:59c5          7509                           JNZ 0x1000:59d0
1000:59c7          8b4610                         MOV AX,word ptr [BP + 0x10]
1000:59ca          48                             DEC AX
1000:59cb          268907                         MOV word ptr ES:[BX],AX
1000:59ce          eb06                           JMP 0x1000:59d6
LAB_1000_59d0:
1000:59d0          c45e0a                         LES BX,[BP + 0xa]
1000:59d3          26ff0f                         DEC word ptr ES:[BX]
LAB_1000_59d6:
1000:59d6          b80100                         MOV AX,0x1
1000:59d9          50                             PUSH AX
1000:59da          c45e0a                         LES BX,[BP + 0xa]
1000:59dd          268b07                         MOV AX,word ptr ES:[BX]
1000:59e0          b103                           MOV CL,0x3
1000:59e2          d3e0                           SHL AX,CL
1000:59e4          034606                         ADD AX,word ptr [BP + 0x6]
1000:59e7          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:59ea          52                             PUSH DX
1000:59eb          50                             PUSH AX
1000:59ec          0e                             PUSH CS
1000:59ed          e80500                         CALL 0x1000:59f5
1000:59f0          83c406                         ADD SP,0x6
1000:59f3          5d                             POP BP
1000:59f4          cb                             RETF
FUN_1000_59f5:
1000:59f5          55                             PUSH BP
1000:59f6          8bec                           MOV BP,SP
1000:59f8          83ec08                         SUB SP,0x8
1000:59fb          2bc0                           SUB AX,AX
1000:59fd          50                             PUSH AX
1000:59fe          9a26100000                     CALLF 0x0000:1026
1000:5a03          83c402                         ADD SP,0x2
1000:5a06          b80200                         MOV AX,0x2
1000:5a09          50                             PUSH AX
1000:5a0a          50                             PUSH AX
1000:5a0b          9ac70f0000                     CALLF 0x0000:0fc7
1000:5a10          83c404                         ADD SP,0x4
1000:5a13          807e0a00                       CMP byte ptr [BP + 0xa],0x0
1000:5a17          752c                           JNZ 0x1000:5a45
1000:5a19          8e06820f                       MOV ES,word ptr [0xf82]
1000:5a1d          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:5a23          7e10                           JLE 0x1000:5a35
1000:5a25          8e06780f                       MOV ES,word ptr [0xf78]
1000:5a29          26ff361c03                     PUSH word ptr ES:[0x31c]
1000:5a2e          26ff361a03                     PUSH word ptr ES:[0x31a]
1000:5a33          eb3a                           JMP 0x1000:5a6f
LAB_1000_5a35:
1000:5a35          8e067a0f                       MOV ES,word ptr [0xf7a]
1000:5a39          26ff361403                     PUSH word ptr ES:[0x314]
1000:5a3e          26ff361203                     PUSH word ptr ES:[0x312]
1000:5a43          eb2a                           JMP 0x1000:5a6f
LAB_1000_5a45:
1000:5a45          8e06820f                       MOV ES,word ptr [0xf82]
1000:5a49          26833e740102                   CMP word ptr ES:[0x174],0x2
1000:5a4f          7e10                           JLE 0x1000:5a61
1000:5a51          8e06740f                       MOV ES,word ptr [0xf74]
1000:5a55          26ff364e03                     PUSH word ptr ES:[0x34e]
1000:5a5a          26ff364c03                     PUSH word ptr ES:[0x34c]
1000:5a5f          eb0e                           JMP 0x1000:5a6f
LAB_1000_5a61:
1000:5a61          8e06760f                       MOV ES,word ptr [0xf76]
1000:5a65          26ff364a03                     PUSH word ptr ES:[0x34a]
1000:5a6a          26ff364803                     PUSH word ptr ES:[0x348]
LAB_1000_5a6f:
1000:5a6f          9a2e0f0000                     CALLF 0x0000:0f2e
1000:5a74          83c404                         ADD SP,0x4
1000:5a77          c45e06                         LES BX,[BP + 0x6]
1000:5a7a          268b07                         MOV AX,word ptr ES:[BX]
1000:5a7d          48                             DEC AX
1000:5a7e          48                             DEC AX
1000:5a7f          8946f8                         MOV word ptr [BP + -0x8],AX
1000:5a82          268b4704                       MOV AX,word ptr ES:[BX + 0x4]
1000:5a86          40                             INC AX
1000:5a87          8946fc                         MOV word ptr [BP + -0x4],AX
1000:5a8a          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:5a8e          48                             DEC AX
1000:5a8f          48                             DEC AX
1000:5a90          8946fa                         MOV word ptr [BP + -0x6],AX
1000:5a93          268b4706                       MOV AX,word ptr ES:[BX + 0x6]
1000:5a97          40                             INC AX
1000:5a98          8946fe                         MOV word ptr [BP + -0x2],AX
1000:5a9b          8d46f8                         LEA AX,[BP + -0x8]
1000:5a9e          16                             PUSH SS
1000:5a9f          50                             PUSH AX
1000:5aa0          9afb0e0000                     CALLF 0x0000:0efb
1000:5aa5          8be5                           MOV SP,BP
1000:5aa7          5d                             POP BP
1000:5aa8          cb                             RETF
FUN_1000_683f:
1000:683f          55                             PUSH BP
1000:6840          8bec                           MOV BP,SP
1000:6842          b8fc00                         MOV AX,0xfc
1000:6845          50                             PUSH AX
1000:6846          9a0f11aa05                     CALLF 0x0000:6baf
1000:684b          833ec80e00                     CMP word ptr [0xec8],0x0
1000:6850          7404                           JZ 0x1000:6856
1000:6852          ff1ec60e                       CALLF [0xec6]
LAB_1000_6856:
1000:6856          b8ff00                         MOV AX,0xff
1000:6859          50                             PUSH AX
1000:685a          9a0f11aa05                     CALLF 0x0000:6baf
1000:685f          8be5                           MOV SP,BP
1000:6861          5d                             POP BP
1000:6862          cb                             RETF
FUN_1000_6b02:
1000:6b02          55                             PUSH BP
1000:6b03          8bec                           MOV BP,SP
1000:6b05          57                             PUSH DI
1000:6b06          ff7606                         PUSH word ptr [BP + 0x6]
1000:6b09          9ae410aa05                     CALLF 0x0000:6b84
1000:6b0e          0bc0                           OR AX,AX
1000:6b10          7414                           JZ 0x1000:6b26
1000:6b12          92                             XCHG AX,DX
1000:6b13          8bfa                           MOV DI,DX
1000:6b15          33c0                           XOR AX,AX
1000:6b17          b9ffff                         MOV CX,0xffff
1000:6b1a          f2ae                           SCASB.REPNE ES:DI
1000:6b1c          f7d1                           NOT CX
1000:6b1e          49                             DEC CX
1000:6b1f          bb0200                         MOV BX,0x2
1000:6b22          b440                           MOV AH,0x40
1000:6b24          cd21                           INT 0x21
LAB_1000_6b26:
1000:6b26          5f                             POP DI
1000:6b27          8be5                           MOV SP,BP
1000:6b29          5d                             POP BP
1000:6b2a          ca0200                         RETF 0x2
LAB_1000_6b82:
1000:6b82          7307                           JNC 0x1000:6b8b
1000:6b84          e80e00                         CALL 0x1000:6b95
1000:6b87          b8ffff                         MOV AX,0xffff
1000:6b8a          99                             CWD
LAB_1000_6b8b:
1000:6b8b          8be5                           MOV SP,BP
1000:6b8d          5d                             POP BP
1000:6b8e          cb                             RETF
FUN_1000_6b95:
1000:6b95          a2960e                         MOV [0xe96],AL
1000:6b98          0ae4                           OR AH,AH
1000:6b9a          7523                           JNZ 0x1000:6bbf
1000:6b9c          803e930e03                     CMP byte ptr [0xe93],0x3
1000:6ba1          720d                           JC 0x1000:6bb0
1000:6ba3          3c22                           CMP AL,0x22
1000:6ba5          730d                           JNC 0x1000:6bb4
1000:6ba7          3c20                           CMP AL,0x20
1000:6ba9          7205                           JC 0x1000:6bb0
1000:6bab          b005                           MOV AL,0x5
1000:6bad          eb07                           JMP 0x1000:6bb6
LAB_1000_6bb0:
1000:6bb0          3c13                           CMP AL,0x13
1000:6bb2          7602                           JBE 0x1000:6bb6
LAB_1000_6bb4:
1000:6bb4          b013                           MOV AL,0x13
LAB_1000_6bb6:
1000:6bb6          bbd40e                         MOV BX,0xed4
1000:6bb9          d7                             XLAT BX
LAB_1000_6bba:
1000:6bba          98                             CBW
1000:6bbb          a38b0e                         MOV [0xe8b],AX
1000:6bbe          c3                             RET
LAB_1000_6bbf:
1000:6bbf          8ac4                           MOV AL,AH
1000:6bc1          ebf7                           JMP 0x1000:6bba
FUN_1000_6e0d:
1000:6e0d          55                             PUSH BP
1000:6e0e          8bec                           MOV BP,SP
1000:6e10          83ec02                         SUB SP,0x2
1000:6e13          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:6e16          3b1e980e                       CMP BX,word ptr [0xe98]
1000:6e1a          7206                           JC 0x1000:6e22
1000:6e1c          f9                             STC
1000:6e1d          b80009                         MOV AX,0x900
1000:6e20          eb67                           JMP 0x1000:6e89
LAB_1000_6e22:
1000:6e22          33c0                           XOR AX,AX
1000:6e24          8b4e0c                         MOV CX,word ptr [BP + 0xc]
1000:6e27          e360                           JCXZ 0x1000:6e89
1000:6e29          f6879a0e02                     TEST byte ptr [BX + 0xe9a],0x2
1000:6e2e          7559                           JNZ 0x1000:6e89
1000:6e30          8b4e0c                         MOV CX,word ptr [BP + 0xc]
1000:6e33          1e                             PUSH DS
1000:6e34          c55608                         LDS DX,[BP + 0x8]
1000:6e37          b43f                           MOV AH,0x3f
1000:6e39          cd21                           INT 0x21
1000:6e3b          1f                             POP DS
1000:6e3c          7304                           JNC 0x1000:6e42
1000:6e3e          b409                           MOV AH,0x9
1000:6e40          eb47                           JMP 0x1000:6e89
LAB_1000_6e42:
1000:6e42          f6879a0e80                     TEST byte ptr [BX + 0xe9a],0x80
1000:6e47          7440                           JZ 0x1000:6e89
1000:6e49          80a79a0efb                     AND byte ptr [BX + 0xe9a],0xfb
1000:6e4e          56                             PUSH SI
1000:6e4f          57                             PUSH DI
1000:6e50          1e                             PUSH DS
1000:6e51          07                             POP ES
1000:6e52          8e5e0a                         MOV DS,word ptr [BP + 0xa]
1000:6e55          fc                             CLD
1000:6e56          8bf2                           MOV SI,DX
1000:6e58          8bfa                           MOV DI,DX
1000:6e5a          8bc8                           MOV CX,AX
1000:6e5c          e327                           JCXZ 0x1000:6e85
1000:6e5e          b40d                           MOV AH,0xd
1000:6e60          803c0a                         CMP byte ptr [SI],0xa
1000:6e63          7506                           JNZ 0x1000:6e6b
1000:6e65          26808f9a0e04                   OR byte ptr ES:[BX + 0xe9a],0x4
LAB_1000_6e6b:
1000:6e6b          ac                             LODSB SI
1000:6e6c          3ac4                           CMP AL,AH
1000:6e6e          741c                           JZ 0x1000:6e8c
1000:6e70          3c1a                           CMP AL,0x1a
1000:6e72          7508                           JNZ 0x1000:6e7c
1000:6e74          26808f9a0e02                   OR byte ptr ES:[BX + 0xe9a],0x2
1000:6e7a          eb05                           JMP 0x1000:6e81
LAB_1000_6e7c:
1000:6e7c          8805                           MOV byte ptr [DI],AL
1000:6e7e          47                             INC DI
LAB_1000_6e7f:
1000:6e7f          e2ea                           LOOP 0x1000:6e6b
LAB_1000_6e81:
1000:6e81          8bc7                           MOV AX,DI
1000:6e83          2bc2                           SUB AX,DX
LAB_1000_6e85:
1000:6e85          06                             PUSH ES
1000:6e86          1f                             POP DS
LAB_1000_6e87:
1000:6e87          5f                             POP DI
1000:6e88          5e                             POP SI
LAB_1000_6e89:
1000:6e89          e9f6fc                         JMP 0x1000:6b82
LAB_1000_6e8c:
1000:6e8c          83f901                         CMP CX,0x1
1000:6e8f          7407                           JZ 0x1000:6e98
1000:6e91          803c0a                         CMP byte ptr [SI],0xa
1000:6e94          74e9                           JZ 0x1000:6e7f
1000:6e96          ebe4                           JMP 0x1000:6e7c
LAB_1000_6e98:
1000:6e98          06                             PUSH ES
1000:6e99          1f                             POP DS
1000:6e9a          f6879a0e40                     TEST byte ptr [BX + 0xe9a],0x40
1000:6e9f          7418                           JZ 0x1000:6eb9
1000:6ea1          b80044                         MOV AX,0x4400
1000:6ea4          cd21                           INT 0x21
1000:6ea6          f7c22000                       TEST DX,0x20
1000:6eaa          7509                           JNZ 0x1000:6eb5
1000:6eac          8d56ff                         LEA DX,[BP + -0x1]
1000:6eaf          b43f                           MOV AH,0x3f
1000:6eb1          cd21                           INT 0x21
1000:6eb3          72d2                           JC 0x1000:6e87
LAB_1000_6eb5:
1000:6eb5          b00a                           MOV AL,0xa
1000:6eb7          eb2c                           JMP 0x1000:6ee5
LAB_1000_6eb9:
1000:6eb9          c646ff00                       MOV byte ptr [BP + -0x1],0x0
1000:6ebd          8d56ff                         LEA DX,[BP + -0x1]
1000:6ec0          b43f                           MOV AH,0x3f
1000:6ec2          cd21                           INT 0x21
1000:6ec4          72c1                           JC 0x1000:6e87
1000:6ec6          0bc0                           OR AX,AX
1000:6ec8          7419                           JZ 0x1000:6ee3
1000:6eca          837e0c01                       CMP word ptr [BP + 0xc],0x1
1000:6ece          741f                           JZ 0x1000:6eef
LAB_1000_6ed0:
1000:6ed0          b9ffff                         MOV CX,0xffff
1000:6ed3          8bd1                           MOV DX,CX
1000:6ed5          b80142                         MOV AX,0x4201
1000:6ed8          cd21                           INT 0x21
1000:6eda          b90100                         MOV CX,0x1
1000:6edd          807eff0a                       CMP byte ptr [BP + -0x1],0xa
1000:6ee1          7407                           JZ 0x1000:6eea
LAB_1000_6ee3:
1000:6ee3          b00d                           MOV AL,0xd
LAB_1000_6ee5:
1000:6ee5          c55608                         LDS DX,[BP + 0x8]
1000:6ee8          eb92                           JMP 0x1000:6e7c
LAB_1000_6eea:
1000:6eea          c55608                         LDS DX,[BP + 0x8]
1000:6eed          eb90                           JMP 0x1000:6e7f
LAB_1000_6eef:
1000:6eef          807eff0a                       CMP byte ptr [BP + -0x1],0xa
1000:6ef3          75db                           JNZ 0x1000:6ed0
1000:6ef5          ebbe                           JMP 0x1000:6eb5
FUN_1000_6f09:
1000:6f09          55                             PUSH BP
1000:6f0a          8bec                           MOV BP,SP
1000:6f0c          56                             PUSH SI
1000:6f0d          57                             PUSH DI
1000:6f0e          bbea0e                         MOV BX,0xeea
1000:6f11          833f00                         CMP word ptr [BX],0x0
1000:6f14          7529                           JNZ 0x1000:6f3f
1000:6f16          1e                             PUSH DS
1000:6f17          07                             POP ES
1000:6f18          b80500                         MOV AX,0x5
1000:6f1b          e84d02                         CALL 0x1000:716b
1000:6f1e          7505                           JNZ 0x1000:6f25
1000:6f20          33c0                           XOR AX,AX
1000:6f22          99                             CWD
1000:6f23          eb24                           JMP 0x1000:6f49
LAB_1000_6f25:
1000:6f25          40                             INC AX
1000:6f26          24fe                           AND AL,0xfe
1000:6f28          a3ea0e                         MOV [0xeea],AX
1000:6f2b          a3ec0e                         MOV [0xeec],AX
1000:6f2e          96                             XCHG AX,SI
1000:6f2f          c7040100                       MOV word ptr [SI],0x1
1000:6f33          83c604                         ADD SI,0x4
1000:6f36          c744fefeff                     MOV word ptr [SI + -0x2],0xfffe
1000:6f3b          8936f00e                       MOV word ptr [0xef0],SI
LAB_1000_6f3f:
1000:6f3f          8b4e06                         MOV CX,word ptr [BP + 0x6]
1000:6f42          8cd8                           MOV AX,DS
1000:6f44          8ec0                           MOV AX,ES
1000:6f46          e8e300                         CALL 0x1000:702c
LAB_1000_6f49:
1000:6f49          5f                             POP DI
1000:6f4a          5e                             POP SI
1000:6f4b          8be5                           MOV SP,BP
1000:6f4d          5d                             POP BP
1000:6f4e          cb                             RETF
FUN_1000_6f4f:
1000:6f4f          55                             PUSH BP
1000:6f50          8bec                           MOV BP,SP
1000:6f52          c45e06                         LES BX,[BP + 0x6]
1000:6f55          8cc0                           MOV AX,ES
1000:6f57          0bc3                           OR AX,BX
1000:6f59          7405                           JZ 0x1000:6f60
1000:6f5b          26804ffe01                     OR byte ptr ES:[BX + -0x2],0x1
LAB_1000_6f60:
1000:6f60          8be5                           MOV SP,BP
1000:6f62          5d                             POP BP
1000:6f63          cb                             RETF
FUN_1000_6f64:
1000:6f64          55                             PUSH BP
1000:6f65          8bec                           MOV BP,SP
1000:6f67          83ec02                         SUB SP,0x2
1000:6f6a          56                             PUSH SI
1000:6f6b          57                             PUSH DI
1000:6f6c          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:6f6f          3df1ff                         CMP AX,0xfff1
1000:6f72          731e                           JNC 0x1000:6f92
1000:6f74          833ef40e00                     CMP word ptr [0xef4],0x0
1000:6f79          7508                           JNZ 0x1000:6f83
1000:6f7b          e82500                         CALL 0x1000:6fa3
1000:6f7e          7412                           JZ 0x1000:6f92
1000:6f80          a3f40e                         MOV [0xef4],AX
LAB_1000_6f83:
1000:6f83          e88b00                         CALL 0x1000:7011
1000:6f86          7515                           JNZ 0x1000:6f9d
1000:6f88          e81800                         CALL 0x1000:6fa3
1000:6f8b          7405                           JZ 0x1000:6f92
1000:6f8d          e88100                         CALL 0x1000:7011
1000:6f90          750b                           JNZ 0x1000:6f9d
LAB_1000_6f92:
1000:6f92          ff7606                         PUSH word ptr [BP + 0x6]
1000:6f95          9a1615aa05                     CALLF 0x0000:6fb6
1000:6f9a          83c402                         ADD SP,0x2
LAB_1000_6f9d:
1000:6f9d          5f                             POP DI
1000:6f9e          5e                             POP SI
1000:6f9f          8be5                           MOV SP,BP
1000:6fa1          5d                             POP BP
1000:6fa2          cb                             RETF
FUN_1000_6fa3:
1000:6fa3          bbf000                         MOV BX,0xf0
1000:6fa6          395e06                         CMP word ptr [BP + 0x6],BX
1000:6fa9          7607                           JBE 0x1000:6fb2
1000:6fab          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:6fae          43                             INC BX
1000:6faf          83e3fe                         AND BX,0xfffe
LAB_1000_6fb2:
1000:6fb2          895efe                         MOV word ptr [BP + -0x2],BX
1000:6fb5          33c0                           XOR AX,AX
1000:6fb7          1e                             PUSH DS
1000:6fb8          50                             PUSH AX
1000:6fb9          50                             PUSH AX
1000:6fba          8d4f0e                         LEA CX,[BX + 0xe]
1000:6fbd          51                             PUSH CX
1000:6fbe          b002                           MOV AL,0x2
1000:6fc0          50                             PUSH AX
1000:6fc1          9a9a17aa05                     CALLF 0x0000:723a
1000:6fc6          83c408                         ADD SP,0x8
1000:6fc9          83faff                         CMP DX,-0x1
1000:6fcc          7441                           JZ 0x1000:700f
1000:6fce          8bc2                           MOV AX,DX
1000:6fd0          8716f60e                       XCHG word ptr [0xef6],DX
1000:6fd4          a3f80e                         MOV [0xef8],AX
1000:6fd7          3b06fc0e                       CMP AX,word ptr [0xefc]
1000:6fdb          7603                           JBE 0x1000:6fe0
1000:6fdd          a3fc0e                         MOV [0xefc],AX
LAB_1000_6fe0:
1000:6fe0          0bd2                           OR DX,DX
1000:6fe2          7405                           JZ 0x1000:6fe9
1000:6fe4          8eda                           MOV DX,DS
1000:6fe6          a30800                         MOV [0x8],AX
LAB_1000_6fe9:
1000:6fe9          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:6fec          8ed8                           MOV AX,DS
1000:6fee          33c0                           XOR AX,AX
1000:6ff0          a30800                         MOV [0x8],AX
1000:6ff3          48                             DEC AX
1000:6ff4          48                             DEC AX
1000:6ff5          89470c                         MOV word ptr [BX + 0xc],AX
1000:6ff8          b80a00                         MOV AX,0xa
1000:6ffb          a30000                         MOV [0x0],AX
1000:6ffe          a30200                         MOV [0x2],AX
1000:7001          8d4701                         LEA AX,[BX + 0x1]
1000:7004          a30a00                         MOV [0xa],AX
1000:7007          050d00                         ADD AX,0xd
1000:700a          a30600                         MOV [0x6],AX
1000:700d          8cd8                           MOV AX,DS
LAB_1000_700f:
1000:700f          1f                             POP DS
1000:7010          c3                             RET
FUN_1000_7011:
1000:7011          8cd8                           MOV AX,DS
1000:7013          8ec0                           MOV AX,ES
1000:7015          8b4e06                         MOV CX,word ptr [BP + 0x6]
1000:7018          33db                           XOR BX,BX
1000:701a          8e1ef80e                       MOV DS,word ptr [0xef8]
1000:701e          e80b00                         CALL 0x1000:702c
1000:7021          0bd2                           OR DX,DX
1000:7023          8cc1                           MOV CX,ES
1000:7025          8ed9                           MOV CX,DS
1000:7027          c3                             RET
LAB_1000_7029:
1000:7029          e9ce00                         JMP 0x1000:70fa
FUN_1000_702c:
1000:702c          41                             INC CX
1000:702d          74fa                           JZ 0x1000:7029
1000:702f          80e1fe                         AND CL,0xfe
1000:7032          83f9ee                         CMP CX,-0x12
1000:7035          73f2                           JNC 0x1000:7029
1000:7037          8b7702                         MOV SI,word ptr [BX + 0x2]
1000:703a          fc                             CLD
1000:703b          ad                             LODSW SI
1000:703c          8bfe                           MOV DI,SI
1000:703e          a801                           TEST AL,0x1
1000:7040          7442                           JZ 0x1000:7084
LAB_1000_7042:
1000:7042          48                             DEC AX
1000:7043          3bc1                           CMP AX,CX
1000:7045          7315                           JNC 0x1000:705c
1000:7047          8bd0                           MOV DX,AX
1000:7049          03f0                           ADD SI,AX
1000:704b          ad                             LODSW SI
1000:704c          a801                           TEST AL,0x1
1000:704e          7434                           JZ 0x1000:7084
1000:7050          03c2                           ADD AX,DX
1000:7052          050200                         ADD AX,0x2
1000:7055          8bf7                           MOV SI,DI
1000:7057          8944fe                         MOV word ptr [SI + -0x2],AX
1000:705a          ebe6                           JMP 0x1000:7042
LAB_1000_705c:
1000:705c          8bfe                           MOV DI,SI
1000:705e          740c                           JZ 0x1000:706c
1000:7060          03f9                           ADD DI,CX
1000:7062          894cfe                         MOV word ptr [SI + -0x2],CX
1000:7065          2bc1                           SUB AX,CX
1000:7067          48                             DEC AX
1000:7068          8905                           MOV word ptr [DI],AX
1000:706a          eb05                           JMP 0x1000:7071
LAB_1000_706c:
1000:706c          03f9                           ADD DI,CX
1000:706e          fe4cfe                         DEC byte ptr [SI + -0x2]
LAB_1000_7071:
1000:7071          8bc6                           MOV AX,SI
1000:7073          8cda                           MOV DX,DS
1000:7075          8cd1                           MOV CX,SS
1000:7077          3bd1                           CMP DX,CX
1000:7079          7405                           JZ 0x1000:7080
1000:707b          268c1ef80e                     MOV word ptr ES:[0xef8],DS
LAB_1000_7080:
1000:7080          897f02                         MOV word ptr [BX + 0x2],DI
1000:7083          c3                             RET
LAB_1000_7084:
1000:7084          26c606fe0e02                   MOV byte ptr ES:[0xefe],0x2
LAB_1000_708a:
1000:708a          3dfeff                         CMP AX,0xfffe
1000:708d          7425                           JZ 0x1000:70b4
1000:708f          8bfe                           MOV DI,SI
LAB_1000_7091:
1000:7091          03f0                           ADD SI,AX
LAB_1000_7093:
1000:7093          ad                             LODSW SI
1000:7094          a801                           TEST AL,0x1
1000:7096          74f2                           JZ 0x1000:708a
1000:7098          8bfe                           MOV DI,SI
LAB_1000_709a:
1000:709a          48                             DEC AX
1000:709b          3bc1                           CMP AX,CX
1000:709d          73bd                           JNC 0x1000:705c
1000:709f          8bd0                           MOV DX,AX
1000:70a1          03f0                           ADD SI,AX
1000:70a3          ad                             LODSW SI
1000:70a4          a801                           TEST AL,0x1
1000:70a6          74e2                           JZ 0x1000:708a
1000:70a8          03c2                           ADD AX,DX
1000:70aa          050200                         ADD AX,0x2
1000:70ad          8bf7                           MOV SI,DI
1000:70af          8944fe                         MOV word ptr [SI + -0x2],AX
1000:70b2          ebe6                           JMP 0x1000:709a
LAB_1000_70b4:
1000:70b4          8b4708                         MOV AX,word ptr [BX + 0x8]
1000:70b7          0bc0                           OR AX,AX
1000:70b9          7404                           JZ 0x1000:70bf
1000:70bb          8ed8                           MOV AX,DS
1000:70bd          eb14                           JMP 0x1000:70d3
LAB_1000_70bf:
1000:70bf          26fe0efe0e                     DEC byte ptr ES:[0xefe]
1000:70c4          7411                           JZ 0x1000:70d7
1000:70c6          8cd8                           MOV AX,DS
1000:70c8          8cd7                           MOV DI,SS
1000:70ca          3bc7                           CMP AX,DI
1000:70cc          7405                           JZ 0x1000:70d3
1000:70ce          268e1ef40e                     MOV DS,word ptr ES:[0xef4]
LAB_1000_70d3:
1000:70d3          8b37                           MOV SI,word ptr [BX]
1000:70d5          ebbc                           JMP 0x1000:7093
LAB_1000_70d7:
1000:70d7          8b7706                         MOV SI,word ptr [BX + 0x6]
1000:70da          33c0                           XOR AX,AX
1000:70dc          e86a00                         CALL 0x1000:7149
1000:70df          3bc6                           CMP AX,SI
1000:70e1          740d                           JZ 0x1000:70f0
1000:70e3          2401                           AND AL,0x1
1000:70e5          40                             INC AX
1000:70e6          40                             INC AX
1000:70e7          98                             CBW
1000:70e8          e85e00                         CALL 0x1000:7149
1000:70eb          740d                           JZ 0x1000:70fa
1000:70ed          fe4dfe                         DEC byte ptr [DI + -0x2]
LAB_1000_70f0:
1000:70f0          e81c00                         CALL 0x1000:710f
1000:70f3          7405                           JZ 0x1000:70fa
1000:70f5          96                             XCHG AX,SI
1000:70f6          4e                             DEC SI
1000:70f7          4e                             DEC SI
1000:70f8          eb99                           JMP 0x1000:7093
LAB_1000_70fa:
1000:70fa          8cd8                           MOV AX,DS
1000:70fc          8cd1                           MOV CX,SS
1000:70fe          3bc1                           CMP AX,CX
1000:7100          7404                           JZ 0x1000:7106
1000:7102          26a3f80e                       MOV ES:[0xef8],AX
LAB_1000_7106:
1000:7106          8b07                           MOV AX,word ptr [BX]
1000:7108          894702                         MOV word ptr [BX + 0x2],AX
1000:710b          33c0                           XOR AX,AX
1000:710d          99                             CWD
1000:710e          c3                             RET
FUN_1000_710f:
1000:710f          51                             PUSH CX
1000:7110          8b45fe                         MOV AX,word ptr [DI + -0x2]
1000:7113          a801                           TEST AL,0x1
1000:7115          7403                           JZ 0x1000:711a
1000:7117          2bc8                           SUB CX,AX
1000:7119          49                             DEC CX
LAB_1000_711a:
1000:711a          41                             INC CX
1000:711b          41                             INC CX
1000:711c          baff7f                         MOV DX,0x7fff
LAB_1000_711f:
1000:711f          263b16fa0e                     CMP DX,word ptr ES:[0xefa]
1000:7124          7604                           JBE 0x1000:712a
1000:7126          d1ea                           SHR DX,0x1
1000:7128          75f5                           JNZ 0x1000:711f
LAB_1000_712a:
1000:712a          8bc1                           MOV AX,CX
1000:712c          03c6                           ADD AX,SI
1000:712e          7215                           JC 0x1000:7145
1000:7130          03c2                           ADD AX,DX
1000:7132          720d                           JC 0x1000:7141
1000:7134          f7d2                           NOT DX
1000:7136          23c2                           AND AX,DX
1000:7138          2bc6                           SUB AX,SI
1000:713a          e80c00                         CALL 0x1000:7149
1000:713d          7508                           JNZ 0x1000:7147
1000:713f          f7d2                           NOT DX
LAB_1000_7141:
1000:7141          d1ea                           SHR DX,0x1
1000:7143          75e5                           JNZ 0x1000:712a
LAB_1000_7145:
1000:7145          33c0                           XOR AX,AX
LAB_1000_7147:
1000:7147          59                             POP CX
1000:7148          c3                             RET
FUN_1000_7149:
1000:7149          52                             PUSH DX
1000:714a          51                             PUSH CX
1000:714b          e81d00                         CALL 0x1000:716b
1000:714e          7418                           JZ 0x1000:7168
1000:7150          57                             PUSH DI
1000:7151          8bfe                           MOV DI,SI
1000:7153          8bf0                           MOV SI,AX
1000:7155          03f2                           ADD SI,DX
1000:7157          c744fefeff                     MOV word ptr [SI + -0x2],0xfffe
1000:715c          897706                         MOV word ptr [BX + 0x6],SI
1000:715f          8bd6                           MOV DX,SI
1000:7161          2bd7                           SUB DX,DI
1000:7163          4a                             DEC DX
1000:7164          8955fe                         MOV word ptr [DI + -0x2],DX
1000:7167          58                             POP AX
LAB_1000_7168:
1000:7168          59                             POP CX
1000:7169          5a                             POP DX
1000:716a          c3                             RET
FUN_1000_716b:
1000:716b          53                             PUSH BX
1000:716c          50                             PUSH AX
1000:716d          33d2                           XOR DX,DX
1000:716f          1e                             PUSH DS
1000:7170          52                             PUSH DX
1000:7171          52                             PUSH DX
1000:7172          50                             PUSH AX
1000:7173          b80100                         MOV AX,0x1
1000:7176          50                             PUSH AX
1000:7177          06                             PUSH ES
1000:7178          1f                             POP DS
1000:7179          9a9a17aa05                     CALLF 0x0000:723a
1000:717e          83c408                         ADD SP,0x8
1000:7181          83faff                         CMP DX,-0x1
1000:7184          1f                             POP DS
1000:7185          5a                             POP DX
1000:7186          5b                             POP BX
1000:7187          7402                           JZ 0x1000:718b
1000:7189          0bd2                           OR DX,DX
LAB_1000_718b:
1000:718b          c3                             RET
FUN_1000_7251:
1000:7251          55                             PUSH BP
1000:7252          8bec                           MOV BP,SP
1000:7254          8bd7                           MOV DX,DI
1000:7256          8bde                           MOV BX,SI
1000:7258          1e                             PUSH DS
1000:7259          c47e06                         LES DI,[BP + 0x6]
1000:725c          33c0                           XOR AX,AX
1000:725e          b9ffff                         MOV CX,0xffff
1000:7261          f2ae                           SCASB.REPNE ES:DI
1000:7263          8d75ff                         LEA SI,[DI + -0x1]
1000:7266          c47e0a                         LES DI,[BP + 0xa]
1000:7269          b9ffff                         MOV CX,0xffff
1000:726c          f2ae                           SCASB.REPNE ES:DI
1000:726e          f7d1                           NOT CX
1000:7270          2bf9                           SUB DI,CX
1000:7272          8cc0                           MOV AX,ES
1000:7274          8ed8                           MOV AX,DS
1000:7276          8e4608                         MOV ES,word ptr [BP + 0x8]
1000:7279          87fe                           XCHG SI,DI
1000:727b          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:727e          f7c60100                       TEST SI,0x1
1000:7282          7402                           JZ 0x1000:7286
1000:7284          a4                             MOVSB ES:DI,SI
1000:7285          49                             DEC CX
LAB_1000_7286:
1000:7286          d1e9                           SHR CX,0x1
1000:7288          f3a5                           MOVSW.REP ES:DI,SI
1000:728a          13c9                           ADC CX,CX
1000:728c          f3a4                           MOVSB.REP ES:DI,SI
1000:728e          8bf3                           MOV SI,BX
1000:7290          8bfa                           MOV DI,DX
1000:7292          1f                             POP DS
1000:7293          8cc2                           MOV DX,ES
1000:7295          5d                             POP BP
1000:7296          cb                             RETF
FUN_1000_7297:
1000:7297          55                             PUSH BP
1000:7298          8bec                           MOV BP,SP
1000:729a          8bd7                           MOV DX,DI
1000:729c          8bde                           MOV BX,SI
1000:729e          1e                             PUSH DS
1000:729f          c5760a                         LDS SI,[BP + 0xa]
1000:72a2          8bfe                           MOV DI,SI
1000:72a4          8cd8                           MOV AX,DS
1000:72a6          8ec0                           MOV AX,ES
1000:72a8          33c0                           XOR AX,AX
1000:72aa          b9ffff                         MOV CX,0xffff
1000:72ad          f2ae                           SCASB.REPNE ES:DI
1000:72af          f7d1                           NOT CX
1000:72b1          c47e06                         LES DI,[BP + 0x6]
1000:72b4          8bc7                           MOV AX,DI
1000:72b6          a801                           TEST AL,0x1
1000:72b8          7402                           JZ 0x1000:72bc
1000:72ba          a4                             MOVSB ES:DI,SI
1000:72bb          49                             DEC CX
LAB_1000_72bc:
1000:72bc          d1e9                           SHR CX,0x1
1000:72be          f3a5                           MOVSW.REP ES:DI,SI
1000:72c0          13c9                           ADC CX,CX
1000:72c2          f3a4                           MOVSB.REP ES:DI,SI
1000:72c4          8bf3                           MOV SI,BX
1000:72c6          8bfa                           MOV DI,DX
1000:72c8          1f                             POP DS
1000:72c9          8cc2                           MOV DX,ES
1000:72cb          5d                             POP BP
1000:72cc          cb                             RETF
FUN_1000_72cd:
1000:72cd          55                             PUSH BP
1000:72ce          8bec                           MOV BP,SP
1000:72d0          57                             PUSH DI
1000:72d1          56                             PUSH SI
1000:72d2          1e                             PUSH DS
1000:72d3          8b4e0e                         MOV CX,word ptr [BP + 0xe]
1000:72d6          e327                           JCXZ 0x1000:72ff
1000:72d8          8bd9                           MOV BX,CX
1000:72da          c47e06                         LES DI,[BP + 0x6]
1000:72dd          8bf7                           MOV SI,DI
1000:72df          33c0                           XOR AX,AX
1000:72e1          f2ae                           SCASB.REPNE ES:DI
1000:72e3          f7d9                           NEG CX
1000:72e5          03cb                           ADD CX,BX
1000:72e7          8bfe                           MOV DI,SI
1000:72e9          c5760a                         LDS SI,[BP + 0xa]
1000:72ec          f3a6                           CMPSB.REPE ES:DI,SI
1000:72ee          8a44ff                         MOV AL,byte ptr [SI + -0x1]
1000:72f1          33c9                           XOR CX,CX
1000:72f3          263a45ff                       CMP AL,byte ptr ES:[DI + -0x1]
1000:72f7          7704                           JA 0x1000:72fd
1000:72f9          7404                           JZ 0x1000:72ff
1000:72fb          49                             DEC CX
1000:72fc          49                             DEC CX
LAB_1000_72fd:
1000:72fd          f7d1                           NOT CX
LAB_1000_72ff:
1000:72ff          8bc1                           MOV AX,CX
1000:7301          1f                             POP DS
1000:7302          5e                             POP SI
1000:7303          5f                             POP DI
1000:7304          8be5                           MOV SP,BP
1000:7306          5d                             POP BP
1000:7307          cb                             RETF
FUN_1000_73d9:
1000:73d9          55                             PUSH BP
1000:73da          8bec                           MOV BP,SP
1000:73dc          83ec08                         SUB SP,0x8
1000:73df          56                             PUSH SI
1000:73e0          8b7606                         MOV SI,word ptr [BP + 0x6]
1000:73e3          b80100                         MOV AX,0x1
1000:73e6          50                             PUSH AX
1000:73e7          2bc0                           SUB AX,AX
1000:73e9          50                             PUSH AX
1000:73ea          50                             PUSH AX
1000:73eb          56                             PUSH SI
1000:73ec          9af011aa05                     CALLF 0x0000:6c90
1000:73f1          83c408                         ADD SP,0x8
1000:73f4          8946f8                         MOV word ptr [BP + -0x8],AX
1000:73f7          8956fa                         MOV word ptr [BP + -0x6],DX
1000:73fa          3dffff                         CMP AX,0xffff
1000:73fd          750c                           JNZ 0x1000:740b
1000:73ff          83faff                         CMP DX,-0x1
1000:7402          7507                           JNZ 0x1000:740b
1000:7404          b8ffff                         MOV AX,0xffff
1000:7407          99                             CWD
1000:7408          eb30                           JMP 0x1000:743a
LAB_1000_740b:
1000:740b          b80200                         MOV AX,0x2
1000:740e          50                             PUSH AX
1000:740f          2bc0                           SUB AX,AX
1000:7411          50                             PUSH AX
1000:7412          50                             PUSH AX
1000:7413          56                             PUSH SI
1000:7414          9af011aa05                     CALLF 0x0000:6c90
1000:7419          83c408                         ADD SP,0x8
1000:741c          8946fc                         MOV word ptr [BP + -0x4],AX
1000:741f          8956fe                         MOV word ptr [BP + -0x2],DX
1000:7422          2bc0                           SUB AX,AX
1000:7424          50                             PUSH AX
1000:7425          ff76fa                         PUSH word ptr [BP + -0x6]
1000:7428          ff76f8                         PUSH word ptr [BP + -0x8]
1000:742b          56                             PUSH SI
1000:742c          9af011aa05                     CALLF 0x0000:6c90
1000:7431          83c408                         ADD SP,0x8
1000:7434          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:7437          8b56fe                         MOV DX,word ptr [BP + -0x2]
LAB_1000_743a:
1000:743a          5e                             POP SI
1000:743b          8be5                           MOV SP,BP
1000:743d          5d                             POP BP
1000:743e          cb                             RETF
FUN_1000_743f:
1000:743f          55                             PUSH BP
1000:7440          8bec                           MOV BP,SP
1000:7442          56                             PUSH SI
1000:7443          57                             PUSH DI
1000:7444          1e                             PUSH DS
1000:7445          83ec0a                         SUB SP,0xa
1000:7448          c646f4cd                       MOV byte ptr [BP + -0xc],0xcd
1000:744c          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:744f          8846f5                         MOV byte ptr [BP + -0xb],AL
1000:7452          3c25                           CMP AL,0x25
1000:7454          740a                           JZ 0x1000:7460
1000:7456          3c26                           CMP AL,0x26
1000:7458          7406                           JZ 0x1000:7460
1000:745a          c646f6cb                       MOV byte ptr [BP + -0xa],0xcb
1000:745e          eb0c                           JMP 0x1000:746c
LAB_1000_7460:
1000:7460          c646f8cb                       MOV byte ptr [BP + -0x8],0xcb
1000:7464          c646f744                       MOV byte ptr [BP + -0x9],0x44
1000:7468          c646f644                       MOV byte ptr [BP + -0xa],0x44
LAB_1000_746c:
1000:746c          8c56f2                         MOV word ptr [BP + -0xe],SS
1000:746f          8d46f4                         LEA AX,[BP + -0xc]
1000:7472          8946f0                         MOV word ptr [BP + -0x10],AX
1000:7475          c57e08                         LDS DI,[BP + 0x8]
1000:7478          8b05                           MOV AX,word ptr [DI]
1000:747a          8b5d02                         MOV BX,word ptr [DI + 0x2]
1000:747d          8b4d04                         MOV CX,word ptr [DI + 0x4]
1000:7480          8b5506                         MOV DX,word ptr [DI + 0x6]
1000:7483          8b7508                         MOV SI,word ptr [DI + 0x8]
1000:7486          ff750a                         PUSH word ptr [DI + 0xa]
1000:7489          c57e10                         LDS DI,[BP + 0x10]
1000:748c          8e05                           MOV ES,word ptr [DI]
1000:748e          8e5d06                         MOV DS,word ptr [DI + 0x6]
1000:7491          5f                             POP DI
1000:7492          55                             PUSH BP
1000:7493          ff5ef0                         CALLF [BP + -0x10]
1000:7496          5d                             POP BP
1000:7497          fc                             CLD
1000:7498          57                             PUSH DI
1000:7499          1e                             PUSH DS
1000:749a          c57e10                         LDS DI,[BP + 0x10]
1000:749d          8c05                           MOV word ptr [DI],ES
1000:749f          8f4506                         POP word ptr [DI + 0x6]
1000:74a2          c57e0c                         LDS DI,[BP + 0xc]
1000:74a5          8905                           MOV word ptr [DI],AX
1000:74a7          895d02                         MOV word ptr [DI + 0x2],BX
1000:74aa          894d04                         MOV word ptr [DI + 0x4],CX
1000:74ad          895506                         MOV word ptr [DI + 0x6],DX
1000:74b0          897508                         MOV word ptr [DI + 0x8],SI
1000:74b3          8f450a                         POP word ptr [DI + 0xa]
1000:74b6          7204                           JC 0x1000:74bc
1000:74b8          33f6                           XOR SI,SI
1000:74ba          eb0e                           JMP 0x1000:74ca
LAB_1000_74bc:
1000:74bc          1e                             PUSH DS
1000:74bd          16                             PUSH SS
1000:74be          1f                             POP DS
1000:74bf          9a9c11aa05                     CALLF 0x0000:6c3c
1000:74c4          1f                             POP DS
1000:74c5          be0100                         MOV SI,0x1
1000:74c8          8b05                           MOV AX,word ptr [DI]
LAB_1000_74ca:
1000:74ca          89750c                         MOV word ptr [DI + 0xc],SI
1000:74cd          83c40a                         ADD SP,0xa
1000:74d0          1f                             POP DS
1000:74d1          5f                             POP DI
1000:74d2          5e                             POP SI
1000:74d3          8be5                           MOV SP,BP
1000:74d5          5d                             POP BP
1000:74d6          cb                             RETF
FUN_1000_74d7:
1000:74d7          55                             PUSH BP
1000:74d8          8bec                           MOV BP,SP
1000:74da          8b5606                         MOV DX,word ptr [BP + 0x6]
1000:74dd          ec                             IN AL,DX
1000:74de          32e4                           XOR AH,AH
1000:74e0          8be5                           MOV SP,BP
1000:74e2          5d                             POP BP
1000:74e3          cb                             RETF
switchD_1000:8905::caseD_e:
1000:7500          57                             PUSH DI
1000:7501          1e                             PUSH DS
1000:7502          07                             POP ES
1000:7503          fc                             CLD
1000:7504          93                             XCHG AX,BX
1000:7505          0ac0                           OR AL,AL
1000:7507          7413                           JZ 0x1000:751c
1000:7509          83f90a                         CMP CX,0xa
1000:750c          750e                           JNZ 0x1000:751c
1000:750e          0bd2                           OR DX,DX
1000:7510          790a                           JNS 0x1000:751c
1000:7512          b02d                           MOV AL,0x2d
1000:7514          aa                             STOSB ES:DI
1000:7515          f7db                           NEG BX
1000:7517          83d200                         ADC DX,0x0
1000:751a          f7da                           NEG DX
LAB_1000_751c:
1000:751c          8bf7                           MOV SI,DI
LAB_1000_751e:
1000:751e          92                             XCHG AX,DX
1000:751f          33d2                           XOR DX,DX
1000:7521          0bc0                           OR AX,AX
1000:7523          7402                           JZ 0x1000:7527
1000:7525          f7f1                           DIV CX
LAB_1000_7527:
1000:7527          93                             XCHG AX,BX
1000:7528          f7f1                           DIV CX
1000:752a          92                             XCHG AX,DX
1000:752b          87d3                           XCHG BX,DX
1000:752d          0430                           ADD AL,0x30
1000:752f          3c39                           CMP AL,0x39
1000:7531          7602                           JBE 0x1000:7535
1000:7533          0427                           ADD AL,0x27
LAB_1000_7535:
1000:7535          aa                             STOSB ES:DI
1000:7536          8bc2                           MOV AX,DX
1000:7538          0bc3                           OR AX,BX
1000:753a          75e2                           JNZ 0x1000:751e
1000:753c          8805                           MOV byte ptr [DI],AL
LAB_1000_753e:
1000:753e          4f                             DEC DI
1000:753f          ac                             LODSB SI
1000:7540          8605                           XCHG byte ptr [DI],AL
1000:7542          8844ff                         MOV byte ptr [SI + -0x1],AL
1000:7545          8d4401                         LEA AX,[SI + 0x1]
1000:7548          3bc7                           CMP AX,DI
1000:754a          72f2                           JC 0x1000:753e
1000:754c          8cda                           MOV DX,DS
1000:754e          58                             POP AX
1000:754f          1f                             POP DS
1000:7550          5f                             POP DI
1000:7551          5e                             POP SI
1000:7552          8be5                           MOV SP,BP
1000:7554          5d                             POP BP
1000:7555          cb                             RETF
FUN_1000_76d1:
1000:76d1          55                             PUSH BP
1000:76d2          8bec                           MOV BP,SP
1000:76d4          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:76d7          8b5e0c                         MOV BX,word ptr [BP + 0xc]
1000:76da          0bd8                           OR BX,AX
1000:76dc          8b5e0a                         MOV BX,word ptr [BP + 0xa]
1000:76df          750b                           JNZ 0x1000:76ec
1000:76e1          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:76e4          f7e3                           MUL BX
1000:76e6          8be5                           MOV SP,BP
1000:76e8          5d                             POP BP
1000:76e9          ca0800                         RETF 0x8
LAB_1000_76ec:
1000:76ec          f7e3                           MUL BX
1000:76ee          8bc8                           MOV CX,AX
1000:76f0          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:76f3          f7660c                         MUL word ptr [BP + 0xc]
1000:76f6          03c8                           ADD CX,AX
1000:76f8          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:76fb          f7e3                           MUL BX
1000:76fd          03d1                           ADD DX,CX
1000:76ff          8be5                           MOV SP,BP
1000:7701          5d                             POP BP
1000:7702          ca0800                         RETF 0x8
FUN_1000_7735:
1000:7735          55                             PUSH BP
1000:7736          8bec                           MOV BP,SP
1000:7738          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:773b          8b07                           MOV AX,word ptr [BX]
1000:773d          8b5702                         MOV DX,word ptr [BX + 0x2]
1000:7740          8b4e08                         MOV CX,word ptr [BP + 0x8]
1000:7743          9a121daa05                     CALLF 0x0000:77b2
1000:7748          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:774b          8907                           MOV word ptr [BX],AX
1000:774d          895702                         MOV word ptr [BX + 0x2],DX
1000:7750          8be5                           MOV SP,BP
1000:7752          5d                             POP BP
1000:7753          ca0400                         RETF 0x4
FUN_1000_777b:
1000:777b          55                             PUSH BP
1000:777c          8bec                           MOV BP,SP
1000:777e          53                             PUSH BX
1000:777f          56                             PUSH SI
1000:7780          8b460c                         MOV AX,word ptr [BP + 0xc]
1000:7783          0bc0                           OR AX,AX
1000:7785          7515                           JNZ 0x1000:779c
1000:7787          8b4e0a                         MOV CX,word ptr [BP + 0xa]
1000:778a          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:778d          33d2                           XOR DX,DX
1000:778f          f7f1                           DIV CX
1000:7791          8bd8                           MOV BX,AX
1000:7793          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:7796          f7f1                           DIV CX
1000:7798          8bd3                           MOV DX,BX
1000:779a          eb38                           JMP 0x1000:77d4
LAB_1000_779c:
1000:779c          8bc8                           MOV CX,AX
1000:779e          8b5e0a                         MOV BX,word ptr [BP + 0xa]
1000:77a1          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:77a4          8b4606                         MOV AX,word ptr [BP + 0x6]
LAB_1000_77a7:
1000:77a7          d1e9                           SHR CX,0x1
1000:77a9          d1db                           RCR BX,0x1
1000:77ab          d1ea                           SHR DX,0x1
1000:77ad          d1d8                           RCR AX,0x1
1000:77af          0bc9                           OR CX,CX
1000:77b1          75f4                           JNZ 0x1000:77a7
1000:77b3          f7f3                           DIV BX
1000:77b5          8bf0                           MOV SI,AX
1000:77b7          f7660c                         MUL word ptr [BP + 0xc]
1000:77ba          91                             XCHG AX,CX
1000:77bb          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:77be          f7e6                           MUL SI
1000:77c0          03d1                           ADD DX,CX
1000:77c2          720c                           JC 0x1000:77d0
1000:77c4          3b5608                         CMP DX,word ptr [BP + 0x8]
1000:77c7          7707                           JA 0x1000:77d0
1000:77c9          7206                           JC 0x1000:77d1
1000:77cb          3b4606                         CMP AX,word ptr [BP + 0x6]
1000:77ce          7601                           JBE 0x1000:77d1
LAB_1000_77d0:
1000:77d0          4e                             DEC SI
LAB_1000_77d1:
1000:77d1          33d2                           XOR DX,DX
1000:77d3          96                             XCHG AX,SI
LAB_1000_77d4:
1000:77d4          5e                             POP SI
1000:77d5          5b                             POP BX
1000:77d6          8be5                           MOV SP,BP
1000:77d8          5d                             POP BP
1000:77d9          ca0800                         RETF 0x8
FUN_1000_77fd:
1000:77fd          55                             PUSH BP
1000:77fe          8bec                           MOV BP,SP
1000:7800          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:7803          2d0020                         SUB AX,0x2000
1000:7806          7431                           JZ 0x1000:7839
1000:7808          d1f8                           SAR AX,0x1
1000:780a          d1f8                           SAR AX,0x1
1000:780c          d1f8                           SAR AX,0x1
1000:780e          d1f8                           SAR AX,0x1
1000:7810          d1f8                           SAR AX,0x1
1000:7812          8bc8                           MOV CX,AX
1000:7814          8b1e8212                       MOV BX,word ptr [0x1282]
1000:7818          d1e3                           SHL BX,0x1
1000:781a          f7db                           NEG BX
1000:781c          81c34400                       ADD BX,0x44
1000:7820          ffe3                           JMP BX
LAB_1000_7839:
1000:7839          026608                         ADD AH,byte ptr [BP + 0x8]
1000:783c          050800                         ADD AX,0x8
1000:783f          d1f8                           SAR AX,0x1
1000:7841          d1f8                           SAR AX,0x1
1000:7843          d1f8                           SAR AX,0x1
1000:7845          d1f8                           SAR AX,0x1
1000:7847          7d05                           JGE 0x1000:784e
1000:7849          33c0                           XOR AX,AX
1000:784b          eb09                           JMP 0x1000:7856
LAB_1000_784e:
1000:784e          3dff05                         CMP AX,0x5ff
1000:7851          7c03                           JL 0x1000:7856
1000:7853          b8ff05                         MOV AX,0x5ff
LAB_1000_7856:
1000:7856          8bf8                           MOV DI,AX
1000:7858          d1ef                           SHR DI,0x1
1000:785a          d1ef                           SHR DI,0x1
1000:785c          d1ef                           SHR DI,0x1
1000:785e          d1ef                           SHR DI,0x1
1000:7860          8bd7                           MOV DX,DI
1000:7862          8a9da80a                       MOV BL,byte ptr [DI + 0xaa8]
1000:7866          32ff                           XOR BH,BH
1000:7868          8bfb                           MOV DI,BX
1000:786a          d1e7                           SHL DI,0x1
1000:786c          d1e7                           SHL DI,0x1
1000:786e          d1e7                           SHL DI,0x1
1000:7870          d1e7                           SHL DI,0x1
1000:7872          d1e7                           SHL DI,0x1
1000:7874          d1e0                           SHL AX,0x1
1000:7876          251f00                         AND AX,0x1f
1000:7879          03f8                           ADD DI,AX
1000:787b          8b85c808                       MOV AX,word ptr [DI + 0x8c8]
1000:787f          8bfa                           MOV DI,DX
1000:7881          8a9d480a                       MOV BL,byte ptr [DI + 0xa48]
1000:7885          fecb                           DEC BL
1000:7887          0bc0                           OR AX,AX
1000:7889          7d02                           JGE 0x1000:788d
1000:788b          fec3                           INC BL
LAB_1000_788d:
1000:788d          0adb                           OR BL,BL
1000:788f          7d04                           JGE 0x1000:7895
1000:7891          fec3                           INC BL
1000:7893          d1f8                           SAR AX,0x1
LAB_1000_7895:
1000:7895          53                             PUSH BX
1000:7896          50                             PUSH AX
1000:7897          32e4                           XOR AH,AH
1000:7899          50                             PUSH AX
1000:789a          b0a0                           MOV AL,0xa0
1000:789c          024606                         ADD AL,byte ptr [BP + 0x6]
1000:789f          50                             PUSH AX
1000:78a0          9a0a008807                     CALLF 0x0000:788a
1000:78a5          83c404                         ADD SP,0x4
1000:78a8          58                             POP AX
1000:78a9          5b                             POP BX
1000:78aa          8ac4                           MOV AL,AH
1000:78ac          2403                           AND AL,0x3
1000:78ae          d0e3                           SHL BL,0x1
1000:78b0          d0e3                           SHL BL,0x1
1000:78b2          02c3                           ADD AL,BL
1000:78b4          02460c                         ADD AL,byte ptr [BP + 0xc]
1000:78b7          32e4                           XOR AH,AH
1000:78b9          50                             PUSH AX
1000:78ba          50                             PUSH AX
1000:78bb          b8b000                         MOV AX,0xb0
1000:78be          034606                         ADD AX,word ptr [BP + 0x6]
1000:78c1          50                             PUSH AX
1000:78c2          9a0a008807                     CALLF 0x0000:788a
1000:78c7          83c404                         ADD SP,0x4
1000:78ca          58                             POP AX
1000:78cb          5d                             POP BP
1000:78cc          cb                             RETF
FUN_1000_78f3:
1000:78f3          55                             PUSH BP
1000:78f4          8bec                           MOV BP,SP
1000:78f6          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:78f9          9c                             PUSHF
1000:78fa          fa                             CLI
1000:78fb          2ea30800                       MOV CS:[0x8],AX
1000:78ff          3d0100                         CMP AX,0x1
1000:7902          2ec70606000000                 MOV word ptr CS:[0x6],0x0
1000:7909          2e8316060000                   ADC word ptr CS:[0x6],0x0
1000:790f          9a19009907                     CALLF 0x0000:79a9
1000:7914          9d                             POPF
1000:7915          5d                             POP BP
1000:7916          cb                             RETF
FUN_1000_7974:
1000:7974          55                             PUSH BP
1000:7975          8bec                           MOV BP,SP
1000:7977          9c                             PUSHF
1000:7978          fa                             CLI
1000:7979          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:797c          2ea31600                       MOV CS:[0x16],AX
1000:7980          9d                             POPF
1000:7981          5d                             POP BP
1000:7982          cb                             RETF
FUN_1000_7a2d:
1000:7a2d          55                             PUSH BP
1000:7a2e          8bec                           MOV BP,SP
1000:7a30          803e140d00                     CMP byte ptr [0xd14],0x0
1000:7a35          7504                           JNZ 0x1000:7a3b
1000:7a37          2bc0                           SUB AX,AX
1000:7a39          eb16                           JMP 0x1000:7a51
LAB_1000_7a3b:
1000:7a3b          ff7608                         PUSH word ptr [BP + 0x8]
1000:7a3e          ff7606                         PUSH word ptr [BP + 0x6]
1000:7a41          0e                             PUSH CS
1000:7a42          e89001                         CALL 0x1000:7bd5
1000:7a45          83c404                         ADD SP,0x4
1000:7a48          0e                             PUSH CS
1000:7a49          e87d02                         CALL 0x1000:7cc9
1000:7a4c          b80100                         MOV AX,0x1
1000:7a4f          eb00                           JMP 0x1000:7a51
LAB_1000_7a51:
1000:7a51          8be5                           MOV SP,BP
1000:7a53          5d                             POP BP
1000:7a54          cb                             RETF
FUN_1000_7a55:
1000:7a55          55                             PUSH BP
1000:7a56          8bec                           MOV BP,SP
1000:7a58          803e140d00                     CMP byte ptr [0xd14],0x0
1000:7a5d          7405                           JZ 0x1000:7a64
1000:7a5f          9aa4009907                     CALLF 0x0000:7a34
LAB_1000_7a64:
1000:7a64          c606140d00                     MOV byte ptr [0xd14],0x0
1000:7a69          8be5                           MOV SP,BP
1000:7a6b          5d                             POP BP
1000:7a6c          cb                             RETF
FUN_1000_7a6d:
1000:7a6d          55                             PUSH BP
1000:7a6e          8bec                           MOV BP,SP
1000:7a70          83ec02                         SUB SP,0x2
1000:7a73          c45e06                         LES BX,[BP + 0x6]
1000:7a76          ff4606                         INC word ptr [BP + 0x6]
1000:7a79          268a07                         MOV AL,byte ptr ES:[BX]
1000:7a7c          2ae4                           SUB AH,AH
1000:7a7e          8946fe                         MOV word ptr [BP + -0x2],AX
1000:7a81          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:7a84          ff4606                         INC word ptr [BP + 0x6]
1000:7a87          268a07                         MOV AL,byte ptr ES:[BX]
1000:7a8a          8a6efe                         MOV CH,byte ptr [BP + -0x2]
1000:7a8d          2ac9                           SUB CL,CL
1000:7a8f          03c1                           ADD AX,CX
1000:7a91          8946fe                         MOV word ptr [BP + -0x2],AX
1000:7a94          eb00                           JMP 0x1000:7a96
LAB_1000_7a96:
1000:7a96          8be5                           MOV SP,BP
1000:7a98          5d                             POP BP
1000:7a99          cb                             RETF
FUN_1000_7a9a:
1000:7a9a          55                             PUSH BP
1000:7a9b          8bec                           MOV BP,SP
1000:7a9d          83ec06                         SUB SP,0x6
1000:7aa0          2bc0                           SUB AX,AX
1000:7aa2          8946fe                         MOV word ptr [BP + -0x2],AX
1000:7aa5          8946fc                         MOV word ptr [BP + -0x4],AX
1000:7aa8          8946fa                         MOV word ptr [BP + -0x6],AX
1000:7aab          eb03                           JMP 0x1000:7ab0
LAB_1000_7aad:
1000:7aad          ff46fa                         INC word ptr [BP + -0x6]
LAB_1000_7ab0:
1000:7ab0          837efa04                       CMP word ptr [BP + -0x6],0x4
1000:7ab4          7d27                           JGE 0x1000:7add
1000:7ab6          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:7ab9          8b56fe                         MOV DX,word ptr [BP + -0x2]
1000:7abc          8af2                           MOV DH,DL
1000:7abe          8ad4                           MOV DL,AH
1000:7ac0          8ae0                           MOV AH,AL
1000:7ac2          2ac0                           SUB AL,AL
1000:7ac4          c45e06                         LES BX,[BP + 0x6]
1000:7ac7          ff4606                         INC word ptr [BP + 0x6]
1000:7aca          268a0f                         MOV CL,byte ptr ES:[BX]
1000:7acd          2aed                           SUB CH,CH
1000:7acf          2bdb                           SUB BX,BX
1000:7ad1          03c8                           ADD CX,AX
1000:7ad3          13da                           ADC BX,DX
1000:7ad5          894efc                         MOV word ptr [BP + -0x4],CX
1000:7ad8          895efe                         MOV word ptr [BP + -0x2],BX
1000:7adb          ebd0                           JMP 0x1000:7aad
LAB_1000_7add:
1000:7add          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:7ae0          8b56fe                         MOV DX,word ptr [BP + -0x2]
1000:7ae3          eb00                           JMP 0x1000:7ae5
LAB_1000_7ae5:
1000:7ae5          8be5                           MOV SP,BP
1000:7ae7          5d                             POP BP
1000:7ae8          cb                             RETF
FUN_1000_7ae9:
1000:7ae9          55                             PUSH BP
1000:7aea          8bec                           MOV BP,SP
1000:7aec          83ec0a                         SUB SP,0xa
1000:7aef          56                             PUSH SI
1000:7af0          b89810                         MOV AX,0x1098
1000:7af3          8946f8                         MOV word ptr [BP + -0x8],AX
1000:7af6          8c5efa                         MOV word ptr [BP + -0x6],DS
1000:7af9          c746f60000                     MOV word ptr [BP + -0xa],0x0
1000:7afe          eb03                           JMP 0x1000:7b03
LAB_1000_7b00:
1000:7b00          ff46f6                         INC word ptr [BP + -0xa]
LAB_1000_7b03:
1000:7b03          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:7b06          3946f6                         CMP word ptr [BP + -0xa],AX
1000:7b09          7d3d                           JGE 0x1000:7b48
1000:7b0b          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:7b0e          8b560a                         MOV DX,word ptr [BP + 0xa]
1000:7b11          050400                         ADD AX,0x4
1000:7b14          52                             PUSH DX
1000:7b15          50                             PUSH AX
1000:7b16          0e                             PUSH CS
1000:7b17          e880ff                         CALL 0x1000:7a9a
1000:7b1a          83c404                         ADD SP,0x4
1000:7b1d          8946fc                         MOV word ptr [BP + -0x4],AX
1000:7b20          8956fe                         MOV word ptr [BP + -0x2],DX
1000:7b23          8b5ef6                         MOV BX,word ptr [BP + -0xa]
1000:7b26          d1e3                           SHL BX,0x1
1000:7b28          d1e3                           SHL BX,0x1
1000:7b2a          c476f8                         LES SI,[BP + -0x8]
1000:7b2d          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:7b30          8b560a                         MOV DX,word ptr [BP + 0xa]
1000:7b33          050800                         ADD AX,0x8
1000:7b36          268900                         MOV word ptr ES:[BX + SI],AX
1000:7b39          26895002                       MOV word ptr ES:[BX + SI + 0x2],DX
1000:7b3d          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:7b40          050800                         ADD AX,0x8
1000:7b43          014608                         ADD word ptr [BP + 0x8],AX
1000:7b46          ebb8                           JMP 0x1000:7b00
LAB_1000_7b48:
1000:7b48          5e                             POP SI
1000:7b49          8be5                           MOV SP,BP
1000:7b4b          5d                             POP BP
1000:7b4c          cb                             RETF
FUN_1000_7b4d:
1000:7b4d          55                             PUSH BP
1000:7b4e          8bec                           MOV BP,SP
1000:7b50          83ec0a                         SUB SP,0xa
1000:7b53          56                             PUSH SI
1000:7b54          c41e2e11                       LES BX,[0x112e]
1000:7b58          268b07                         MOV AX,word ptr ES:[BX]
1000:7b5b          268b5702                       MOV DX,word ptr ES:[BX + 0x2]
1000:7b5f          8946fa                         MOV word ptr [BP + -0x6],AX
1000:7b62          8956fc                         MOV word ptr [BP + -0x4],DX
1000:7b65          c45efa                         LES BX,[BP + -0x6]
1000:7b68          ff46fa                         INC word ptr [BP + -0x6]
1000:7b6b          268a07                         MOV AL,byte ptr ES:[BX]
1000:7b6e          2ae4                           SUB AH,AH
1000:7b70          2bd2                           SUB DX,DX
1000:7b72          8946f6                         MOV word ptr [BP + -0xa],AX
1000:7b75          8956f8                         MOV word ptr [BP + -0x8],DX
1000:7b78          a880                           TEST AL,0x80
1000:7b7a          743b                           JZ 0x1000:7bb7
1000:7b7c          8366f67f                       AND word ptr [BP + -0xa],0x7f
LAB_1000_7b80:
1000:7b80          c45efa                         LES BX,[BP + -0x6]
1000:7b83          ff46fa                         INC word ptr [BP + -0x6]
1000:7b86          268a07                         MOV AL,byte ptr ES:[BX]
1000:7b89          8846fe                         MOV byte ptr [BP + -0x2],AL
1000:7b8c          2ae4                           SUB AH,AH
1000:7b8e          257f00                         AND AX,0x7f
1000:7b91          2bd2                           SUB DX,DX
1000:7b93          8b4ef6                         MOV CX,word ptr [BP + -0xa]
1000:7b96          8b5ef8                         MOV BX,word ptr [BP + -0x8]
1000:7b99          8bf1                           MOV SI,CX
1000:7b9b          b107                           MOV CL,0x7
LAB_1000_7b9d:
1000:7b9d          d1e6                           SHL SI,0x1
1000:7b9f          d1d3                           RCL BX,0x1
1000:7ba1          fec9                           DEC CL
1000:7ba3          7402                           JZ 0x1000:7ba7
1000:7ba5          ebf6                           JMP 0x1000:7b9d
LAB_1000_7ba7:
1000:7ba7          03c6                           ADD AX,SI
1000:7ba9          13d3                           ADC DX,BX
1000:7bab          8946f6                         MOV word ptr [BP + -0xa],AX
1000:7bae          8956f8                         MOV word ptr [BP + -0x8],DX
1000:7bb1          f646fe80                       TEST byte ptr [BP + -0x2],0x80
1000:7bb5          75c9                           JNZ 0x1000:7b80
LAB_1000_7bb7:
1000:7bb7          c41e2e11                       LES BX,[0x112e]
1000:7bbb          8b46fa                         MOV AX,word ptr [BP + -0x6]
1000:7bbe          8b56fc                         MOV DX,word ptr [BP + -0x4]
1000:7bc1          268907                         MOV word ptr ES:[BX],AX
1000:7bc4          26895702                       MOV word ptr ES:[BX + 0x2],DX
1000:7bc8          8b46f6                         MOV AX,word ptr [BP + -0xa]
1000:7bcb          8b56f8                         MOV DX,word ptr [BP + -0x8]
1000:7bce          eb00                           JMP 0x1000:7bd0
LAB_1000_7bd0:
1000:7bd0          5e                             POP SI
1000:7bd1          8be5                           MOV SP,BP
1000:7bd3          5d                             POP BP
1000:7bd4          cb                             RETF
FUN_1000_7bd5:
1000:7bd5          55                             PUSH BP
1000:7bd6          8bec                           MOV BP,SP
1000:7bd8          83ec08                         SUB SP,0x8
1000:7bdb          57                             PUSH DI
1000:7bdc          56                             PUSH SI
1000:7bdd          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:7be2          eb03                           JMP 0x1000:7be7
LAB_1000_7be4:
1000:7be4          ff46fa                         INC word ptr [BP + -0x6]
LAB_1000_7be7:
1000:7be7          837efa0b                       CMP word ptr [BP + -0x6],0xb
1000:7beb          7d2b                           JGE 0x1000:7c18
1000:7bed          8b5efa                         MOV BX,word ptr [BP + -0x6]
1000:7bf0          d1e3                           SHL BX,0x1
1000:7bf2          8e06880f                       MOV ES,word ptr [0xf88]
1000:7bf6          26c78724030000                 MOV word ptr ES:[BX + 0x324],0x0
1000:7bfd          2bc0                           SUB AX,AX
1000:7bff          50                             PUSH AX
1000:7c00          ff76fa                         PUSH word ptr [BP + -0x6]
1000:7c03          9a74023b08                     CALLF 0x0000:8624
1000:7c08          83c404                         ADD SP,0x4
1000:7c0b          ff76fa                         PUSH word ptr [BP + -0x6]
1000:7c0e          9ace033b08                     CALLF 0x0000:877e
1000:7c13          83c402                         ADD SP,0x2
1000:7c16          ebcc                           JMP 0x1000:7be4
LAB_1000_7c18:
1000:7c18          2bc0                           SUB AX,AX
1000:7c1a          a30e0d                         MOV [0xd0e],AX
1000:7c1d          a30c0d                         MOV [0xd0c],AX
1000:7c20          a3100d                         MOV [0xd10],AX
1000:7c23          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:7c26          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:7c29          050400                         ADD AX,0x4
1000:7c2c          52                             PUSH DX
1000:7c2d          50                             PUSH AX
1000:7c2e          0e                             PUSH CS
1000:7c2f          e868fe                         CALL 0x1000:7a9a
1000:7c32          83c404                         ADD SP,0x4
1000:7c35          8946fc                         MOV word ptr [BP + -0x4],AX
1000:7c38          8956fe                         MOV word ptr [BP + -0x2],DX
1000:7c3b          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:7c3e          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:7c41          050a00                         ADD AX,0xa
1000:7c44          52                             PUSH DX
1000:7c45          50                             PUSH AX
1000:7c46          0e                             PUSH CS
1000:7c47          e823fe                         CALL 0x1000:7a6d
1000:7c4a          83c404                         ADD SP,0x4
1000:7c4d          a32c11                         MOV [0x112c],AX
1000:7c50          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:7c53          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:7c56          050c00                         ADD AX,0xc
1000:7c59          52                             PUSH DX
1000:7c5a          50                             PUSH AX
1000:7c5b          0e                             PUSH CS
1000:7c5c          e80efe                         CALL 0x1000:7a6d
1000:7c5f          83c404                         ADD SP,0x4
1000:7c62          a32a11                         MOV [0x112a],AX
1000:7c65          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:7c68          050800                         ADD AX,0x8
1000:7c6b          014606                         ADD word ptr [BP + 0x6],AX
1000:7c6e          ff7608                         PUSH word ptr [BP + 0x8]
1000:7c71          ff7606                         PUSH word ptr [BP + 0x6]
1000:7c74          ff362c11                       PUSH word ptr [0x112c]
1000:7c78          0e                             PUSH CS
1000:7c79          e86dfe                         CALL 0x1000:7ae9
1000:7c7c          83c406                         ADD SP,0x6
1000:7c7f          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:7c84          eb03                           JMP 0x1000:7c89
LAB_1000_7c86:
1000:7c86          ff46fa                         INC word ptr [BP + -0x6]
LAB_1000_7c89:
1000:7c89          a12c11                         MOV AX,[0x112c]
1000:7c8c          3946fa                         CMP word ptr [BP + -0x6],AX
1000:7c8f          7d32                           JGE 0x1000:7cc3
1000:7c91          8b76fa                         MOV SI,word ptr [BP + -0x6]
1000:7c94          b102                           MOV CL,0x2
1000:7c96          d3e6                           SHL SI,CL
1000:7c98          8bc6                           MOV AX,SI
1000:7c9a          059810                         ADD AX,0x1098
1000:7c9d          a32e11                         MOV [0x112e],AX
1000:7ca0          8c1e3011                       MOV word ptr [0x1130],DS
1000:7ca4          0e                             PUSH CS
1000:7ca5          e8a5fe                         CALL 0x1000:7b4d
1000:7ca8          8984da10                       MOV word ptr [SI + 0x10da],AX
1000:7cac          8994dc10                       MOV word ptr [SI + 0x10dc],DX
1000:7cb0          8b5efa                         MOV BX,word ptr [BP + -0x6]
1000:7cb3          c43e2e11                       LES DI,[0x112e]
1000:7cb7          26c43d                         LES DI,ES:[DI]
1000:7cba          268a05                         MOV AL,byte ptr ES:[DI]
1000:7cbd          88871a11                       MOV byte ptr [BX + 0x111a],AL
1000:7cc1          ebc3                           JMP 0x1000:7c86
LAB_1000_7cc3:
1000:7cc3          5e                             POP SI
1000:7cc4          5f                             POP DI
1000:7cc5          8be5                           MOV SP,BP
1000:7cc7          5d                             POP BP
1000:7cc8          cb                             RETF
FUN_1000_7cc9:
1000:7cc9          55                             PUSH BP
1000:7cca          8bec                           MOV BP,SP
1000:7ccc          b89810                         MOV AX,0x1098
1000:7ccf          a32e11                         MOV [0x112e],AX
1000:7cd2          8c1e3011                       MOV word ptr [0x1130],DS
1000:7cd6          b81a11                         MOV AX,0x111a
1000:7cd9          a33211                         MOV [0x1132],AX
1000:7cdc          8c1e3411                       MOV word ptr [0x1134],DS
1000:7ce0          c606d81000                     MOV byte ptr [0x10d8],0x0
1000:7ce5          b820a1                         MOV AX,0xa120
1000:7ce8          ba0700                         MOV DX,0x7
1000:7ceb          52                             PUSH DX
1000:7cec          50                             PUSH AX
1000:7ced          2bc0                           SUB AX,AX
1000:7cef          50                             PUSH AX
1000:7cf0          0e                             PUSH CS
1000:7cf1          e84500                         CALL 0x1000:7d39
1000:7cf4          83c406                         ADD SP,0x6
1000:7cf7          0e                             PUSH CS
1000:7cf8          e85b05                         CALL 0x1000:8256
1000:7cfb          50                             PUSH AX
1000:7cfc          9ab9009907                     CALLF 0x0000:7a49
1000:7d01          83c402                         ADD SP,0x2
1000:7d04          8e068a0f                       MOV ES,word ptr [0xf8a]
1000:7d08          26c606130001                   MOV byte ptr ES:[0x13],0x1
1000:7d0e          8be5                           MOV SP,BP
1000:7d10          5d                             POP BP
1000:7d11          cb                             RETF
FUN_1000_7d12:
1000:7d12          55                             PUSH BP
1000:7d13          8bec                           MOV BP,SP
1000:7d15          8e068a0f                       MOV ES,word ptr [0xf8a]
1000:7d19          26c606130000                   MOV byte ptr ES:[0x13],0x0
1000:7d1f          0e                             PUSH CS
1000:7d20          e80400                         CALL 0x1000:7d27
1000:7d23          8be5                           MOV SP,BP
1000:7d25          5d                             POP BP
1000:7d26          cb                             RETF
FUN_1000_7d27:
1000:7d27          55                             PUSH BP
1000:7d28          8bec                           MOV BP,SP
1000:7d2a          2bc0                           SUB AX,AX
1000:7d2c          50                             PUSH AX
1000:7d2d          9a38009907                     CALLF 0x0000:79c8
1000:7d32          83c402                         ADD SP,0x2
1000:7d35          8be5                           MOV SP,BP
1000:7d37          5d                             POP BP
1000:7d38          cb                             RETF
FUN_1000_7d39:
1000:7d39          55                             PUSH BP
1000:7d3a          8bec                           MOV BP,SP
1000:7d3c          83ec04                         SUB SP,0x4
1000:7d3f          837e0600                       CMP word ptr [BP + 0x6],0x0
1000:7d43          750a                           JNZ 0x1000:7d4f
1000:7d45          2bc0                           SUB AX,AX
1000:7d47          8946fe                         MOV word ptr [BP + -0x2],AX
1000:7d4a          8946fc                         MOV word ptr [BP + -0x4],AX
1000:7d4d          eb33                           JMP 0x1000:7d82
LAB_1000_7d4f:
1000:7d4f          b8e803                         MOV AX,0x3e8
1000:7d52          99                             CWD
1000:7d53          52                             PUSH DX
1000:7d54          50                             PUSH AX
1000:7d55          8d4608                         LEA AX,[BP + 0x8]
1000:7d58          50                             PUSH AX
1000:7d59          9a1e1daa05                     CALLF 0x0000:77be
1000:7d5e          2bc0                           SUB AX,AX
1000:7d60          50                             PUSH AX
1000:7d61          ff7606                         PUSH word ptr [BP + 0x6]
1000:7d64          b8aa04                         MOV AX,0x4aa
1000:7d67          99                             CWD
1000:7d68          52                             PUSH DX
1000:7d69          50                             PUSH AX
1000:7d6a          ff760a                         PUSH word ptr [BP + 0xa]
1000:7d6d          ff7608                         PUSH word ptr [BP + 0x8]
1000:7d70          9ade1caa05                     CALLF 0x0000:777e
1000:7d75          52                             PUSH DX
1000:7d76          50                             PUSH AX
1000:7d77          9a881daa05                     CALLF 0x0000:7828
1000:7d7c          8946fc                         MOV word ptr [BP + -0x4],AX
1000:7d7f          8956fe                         MOV word ptr [BP + -0x2],DX
LAB_1000_7d82:
1000:7d82          ff76fc                         PUSH word ptr [BP + -0x4]
1000:7d85          9a38009907                     CALLF 0x0000:79c8
1000:7d8a          83c402                         ADD SP,0x2
1000:7d8d          8be5                           MOV SP,BP
1000:7d8f          5d                             POP BP
1000:7d90          cb                             RETF
FUN_1000_7d91:
1000:7d91          55                             PUSH BP
1000:7d92          8bec                           MOV BP,SP
1000:7d94          83ec08                         SUB SP,0x8
1000:7d97          56                             PUSH SI
1000:7d98          c41e3211                       LES BX,[0x1132]
1000:7d9c          26803f2f                       CMP byte ptr ES:[BX],0x2f
1000:7da0          741c                           JZ 0x1000:7dbe
1000:7da2          0e                             PUSH CS
1000:7da3          e8a7fd                         CALL 0x1000:7b4d
1000:7da6          8946fa                         MOV word ptr [BP + -0x6],AX
1000:7da9          8956fc                         MOV word ptr [BP + -0x4],DX
1000:7dac          8b1e100d                       MOV BX,word ptr [0xd10]
1000:7db0          d1e3                           SHL BX,0x1
1000:7db2          d1e3                           SHL BX,0x1
1000:7db4          0187da10                       ADD word ptr [BX + 0x10da],AX
1000:7db8          1197dc10                       ADC word ptr [BX + 0x10dc],DX
1000:7dbc          eb14                           JMP 0x1000:7dd2
LAB_1000_7dbe:
1000:7dbe          8b1e100d                       MOV BX,word ptr [0xd10]
1000:7dc2          d1e3                           SHL BX,0x1
1000:7dc4          d1e3                           SHL BX,0x1
1000:7dc6          c787da10ffff                   MOV word ptr [BX + 0x10da],0xffff
1000:7dcc          c787dc10ff7f                   MOV word ptr [BX + 0x10dc],0x7fff
LAB_1000_7dd2:
1000:7dd2          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:7dd7          c746f80100                     MOV word ptr [BP + -0x8],0x1
1000:7ddc          eb03                           JMP 0x1000:7de1
LAB_1000_7dde:
1000:7dde          ff46f8                         INC word ptr [BP + -0x8]
LAB_1000_7de1:
1000:7de1          a12c11                         MOV AX,[0x112c]
1000:7de4          3946f8                         CMP word ptr [BP + -0x8],AX
1000:7de7          7d35                           JGE 0x1000:7e1e
1000:7de9          8b5ef8                         MOV BX,word ptr [BP + -0x8]
1000:7dec          d1e3                           SHL BX,0x1
1000:7dee          d1e3                           SHL BX,0x1
1000:7df0          8b76fe                         MOV SI,word ptr [BP + -0x2]
1000:7df3          d1e6                           SHL SI,0x1
1000:7df5          d1e6                           SHL SI,0x1
1000:7df7          8b84da10                       MOV AX,word ptr [SI + 0x10da]
1000:7dfb          8b94dc10                       MOV DX,word ptr [SI + 0x10dc]
1000:7dff          3997dc10                       CMP word ptr [BX + 0x10dc],DX
1000:7e03          7f17                           JG 0x1000:7e1c
1000:7e05          7c06                           JL 0x1000:7e0d
1000:7e07          3987da10                       CMP word ptr [BX + 0x10da],AX
1000:7e0b          730f                           JNC 0x1000:7e1c
LAB_1000_7e0d:
1000:7e0d          8b5ef8                         MOV BX,word ptr [BP + -0x8]
1000:7e10          80bf1a112f                     CMP byte ptr [BX + 0x111a],0x2f
1000:7e15          7405                           JZ 0x1000:7e1c
1000:7e17          8bc3                           MOV AX,BX
1000:7e19          8946fe                         MOV word ptr [BP + -0x2],AX
LAB_1000_7e1c:
1000:7e1c          ebc0                           JMP 0x1000:7dde
LAB_1000_7e1e:
1000:7e1e          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:7e21          80bf1a112f                     CMP byte ptr [BX + 0x111a],0x2f
1000:7e26          750d                           JNZ 0x1000:7e35
1000:7e28          c606d81001                     MOV byte ptr [0x10d8],0x1
1000:7e2d          0e                             PUSH CS
1000:7e2e          e8e1fe                         CALL 0x1000:7d12
1000:7e31          2bc0                           SUB AX,AX
1000:7e33          eb50                           JMP 0x1000:7e85
LAB_1000_7e35:
1000:7e35          8b76fe                         MOV SI,word ptr [BP + -0x2]
1000:7e38          b102                           MOV CL,0x2
1000:7e3a          d3e6                           SHL SI,CL
1000:7e3c          8b84da10                       MOV AX,word ptr [SI + 0x10da]
1000:7e40          8b94dc10                       MOV DX,word ptr [SI + 0x10dc]
1000:7e44          2b060c0d                       SUB AX,word ptr [0xd0c]
1000:7e48          1b160e0d                       SBB DX,word ptr [0xd0e]
1000:7e4c          8946fa                         MOV word ptr [BP + -0x6],AX
1000:7e4f          8956fc                         MOV word ptr [BP + -0x4],DX
1000:7e52          8b84da10                       MOV AX,word ptr [SI + 0x10da]
1000:7e56          8b94dc10                       MOV DX,word ptr [SI + 0x10dc]
1000:7e5a          a30c0d                         MOV [0xd0c],AX
1000:7e5d          89160e0d                       MOV word ptr [0xd0e],DX
1000:7e61          8bc6                           MOV AX,SI
1000:7e63          059810                         ADD AX,0x1098
1000:7e66          a32e11                         MOV [0x112e],AX
1000:7e69          8c1e3011                       MOV word ptr [0x1130],DS
1000:7e6d          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:7e70          051a11                         ADD AX,0x111a
1000:7e73          a33211                         MOV [0x1132],AX
1000:7e76          8c1e3411                       MOV word ptr [0x1134],DS
1000:7e7a          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:7e7d          a3100d                         MOV [0xd10],AX
1000:7e80          8b46fa                         MOV AX,word ptr [BP + -0x6]
1000:7e83          eb00                           JMP 0x1000:7e85
LAB_1000_7e85:
1000:7e85          5e                             POP SI
1000:7e86          8be5                           MOV SP,BP
1000:7e88          5d                             POP BP
1000:7e89          cb                             RETF
FUN_1000_7e8a:
1000:7e8a          55                             PUSH BP
1000:7e8b          8bec                           MOV BP,SP
1000:7e8d          837e0a00                       CMP word ptr [BP + 0xa],0x0
1000:7e91          751e                           JNZ 0x1000:7eb1
1000:7e93          ff7606                         PUSH word ptr [BP + 0x6]
1000:7e96          9ace033b08                     CALLF 0x0000:877e
1000:7e9b          83c402                         ADD SP,0x2
1000:7e9e          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:7ea1          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:7ea4          d1e3                           SHL BX,0x1
1000:7ea6          8e06880f                       MOV ES,word ptr [0xf88]
1000:7eaa          2689872403                     MOV word ptr ES:[BX + 0x324],AX
1000:7eaf          eb3e                           JMP 0x1000:7eef
LAB_1000_7eb1:
1000:7eb1          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:7eb4          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:7eb7          d1e3                           SHL BX,0x1
1000:7eb9          8e06880f                       MOV ES,word ptr [0xf88]
1000:7ebd          2639872403                     CMP word ptr ES:[BX + 0x324],AX
1000:7ec2          741d                           JZ 0x1000:7ee1
1000:7ec4          50                             PUSH AX
1000:7ec5          ff7606                         PUSH word ptr [BP + 0x6]
1000:7ec8          9a74023b08                     CALLF 0x0000:8624
1000:7ecd          83c404                         ADD SP,0x4
1000:7ed0          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:7ed3          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:7ed6          d1e3                           SHL BX,0x1
1000:7ed8          8e06880f                       MOV ES,word ptr [0xf88]
1000:7edc          2689872403                     MOV word ptr ES:[BX + 0x324],AX
LAB_1000_7ee1:
1000:7ee1          ff7608                         PUSH word ptr [BP + 0x8]
1000:7ee4          ff7606                         PUSH word ptr [BP + 0x6]
1000:7ee7          9a26033b08                     CALLF 0x0000:86d6
1000:7eec          83c404                         ADD SP,0x4
LAB_1000_7eef:
1000:7eef          8be5                           MOV SP,BP
1000:7ef1          5d                             POP BP
1000:7ef2          cb                             RETF
FUN_1000_7ef3:
1000:7ef3          55                             PUSH BP
1000:7ef4          8bec                           MOV BP,SP
1000:7ef6          83ec04                         SUB SP,0x4
1000:7ef9          56                             PUSH SI
1000:7efa          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:7efd          b104                           MOV CL,0x4
1000:7eff          d3e8                           SHR AX,CL
1000:7f01          250700                         AND AX,0x7
1000:7f04          8946fc                         MOV word ptr [BP + -0x4],AX
1000:7f07          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:7f0a          250f00                         AND AX,0xf
1000:7f0d          8946fe                         MOV word ptr [BP + -0x2],AX
1000:7f10          3d0b00                         CMP AX,0xb
1000:7f13          7c03                           JL 0x1000:7f18
1000:7f15          e93901                         JMP 0x1000:8051
LAB_1000_7f18:
1000:7f18          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:7f1b          e90d01                         JMP 0x1000:802b
LAB_1000_7f1e:
1000:7f1e          ff76fe                         PUSH word ptr [BP + -0x2]
1000:7f21          9ace033b08                     CALLF 0x0000:877e
1000:7f26          83c402                         ADD SP,0x2
1000:7f29          e92501                         JMP 0x1000:8051
LAB_1000_7f2c:
1000:7f2c          c41e2e11                       LES BX,[0x112e]
1000:7f30          26c41f                         LES BX,ES:[BX]
1000:7f33          268a4701                       MOV AL,byte ptr ES:[BX + 0x1]
1000:7f37          2ae4                           SUB AH,AH
1000:7f39          50                             PUSH AX
1000:7f3a          c41e2e11                       LES BX,[0x112e]
1000:7f3e          26c41f                         LES BX,ES:[BX]
1000:7f41          268a07                         MOV AL,byte ptr ES:[BX]
1000:7f44          50                             PUSH AX
1000:7f45          ff76fe                         PUSH word ptr [BP + -0x2]
1000:7f48          0e                             PUSH CS
1000:7f49          e83eff                         CALL 0x1000:7e8a
1000:7f4c          83c406                         ADD SP,0x6
1000:7f4f          e9ff00                         JMP 0x1000:8051
LAB_1000_7f52:
1000:7f52          c41e2e11                       LES BX,[0x112e]
1000:7f56          26c41f                         LES BX,ES:[BX]
1000:7f59          268a4701                       MOV AL,byte ptr ES:[BX + 0x1]
1000:7f5d          2ae4                           SUB AH,AH
1000:7f5f          8bf0                           MOV SI,AX
1000:7f61          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:7f64          d1e3                           SHL BX,0x1
1000:7f66          8e06880f                       MOV ES,word ptr [0xf88]
1000:7f6a          2639b72403                     CMP word ptr ES:[BX + 0x324],SI
1000:7f6f          7413                           JZ 0x1000:7f84
1000:7f71          833e120d00                     CMP word ptr [0xd12],0x0
1000:7f76          740c                           JZ 0x1000:7f84
1000:7f78          56                             PUSH SI
1000:7f79          ff76fe                         PUSH word ptr [BP + -0x2]
1000:7f7c          9a74023b08                     CALLF 0x0000:8624
1000:7f81          83c404                         ADD SP,0x4
LAB_1000_7f84:
1000:7f84          c41e2e11                       LES BX,[0x112e]
1000:7f88          26c41f                         LES BX,ES:[BX]
1000:7f8b          268a4701                       MOV AL,byte ptr ES:[BX + 0x1]
1000:7f8f          2ae4                           SUB AH,AH
1000:7f91          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:7f94          d1e3                           SHL BX,0x1
1000:7f96          8e06880f                       MOV ES,word ptr [0xf88]
1000:7f9a          2689872403                     MOV word ptr ES:[BX + 0x324],AX
1000:7f9f          e9af00                         JMP 0x1000:8051
LAB_1000_7fa2:
1000:7fa2          c41e2e11                       LES BX,[0x112e]
1000:7fa6          26c41f                         LES BX,ES:[BX]
1000:7fa9          268a07                         MOV AL,byte ptr ES:[BX]
1000:7fac          2ae4                           SUB AH,AH
1000:7fae          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:7fb1          d1e3                           SHL BX,0x1
1000:7fb3          8e06880f                       MOV ES,word ptr [0xf88]
1000:7fb7          2639872403                     CMP word ptr ES:[BX + 0x324],AX
1000:7fbc          7503                           JNZ 0x1000:7fc1
1000:7fbe          e99000                         JMP 0x1000:8051
LAB_1000_7fc1:
1000:7fc1          833e120d00                     CMP word ptr [0xd12],0x0
1000:7fc6          7418                           JZ 0x1000:7fe0
1000:7fc8          c41e2e11                       LES BX,[0x112e]
1000:7fcc          26c41f                         LES BX,ES:[BX]
1000:7fcf          268a07                         MOV AL,byte ptr ES:[BX]
1000:7fd2          2ae4                           SUB AH,AH
1000:7fd4          50                             PUSH AX
1000:7fd5          ff76fe                         PUSH word ptr [BP + -0x2]
1000:7fd8          9a74023b08                     CALLF 0x0000:8624
1000:7fdd          83c404                         ADD SP,0x4
LAB_1000_7fe0:
1000:7fe0          c41e2e11                       LES BX,[0x112e]
1000:7fe4          26c41f                         LES BX,ES:[BX]
1000:7fe7          268a07                         MOV AL,byte ptr ES:[BX]
1000:7fea          2ae4                           SUB AH,AH
1000:7fec          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:7fef          d1e3                           SHL BX,0x1
1000:7ff1          8e06880f                       MOV ES,word ptr [0xf88]
1000:7ff5          2689872403                     MOV word ptr ES:[BX + 0x324],AX
1000:7ffa          eb55                           JMP 0x1000:8051
LAB_1000_7ffc:
1000:7ffc          c41e2e11                       LES BX,[0x112e]
1000:8000          26c41f                         LES BX,ES:[BX]
1000:8003          268a4701                       MOV AL,byte ptr ES:[BX + 0x1]
1000:8007          2ae4                           SUB AH,AH
1000:8009          b107                           MOV CL,0x7
1000:800b          d3e0                           SHL AX,CL
1000:800d          c41e2e11                       LES BX,[0x112e]
1000:8011          26c41f                         LES BX,ES:[BX]
1000:8014          268a0f                         MOV CL,byte ptr ES:[BX]
1000:8017          2aed                           SUB CH,CH
1000:8019          0bc1                           OR AX,CX
1000:801b          50                             PUSH AX
1000:801c          ff76fe                         PUSH word ptr [BP + -0x2]
1000:801f          9aea023b08                     CALLF 0x0000:869a
1000:8024          83c404                         ADD SP,0x4
1000:8027          eb28                           JMP 0x1000:8051
LAB_1000_802b:
1000:802b          0bc0                           OR AX,AX
1000:802d          7503                           JNZ 0x1000:8032
1000:802f          e9ecfe                         JMP 0x1000:7f1e
LAB_1000_8032:
1000:8032          3d0100                         CMP AX,0x1
1000:8035          7503                           JNZ 0x1000:803a
1000:8037          e9f2fe                         JMP 0x1000:7f2c
LAB_1000_803a:
1000:803a          3d0200                         CMP AX,0x2
1000:803d          7503                           JNZ 0x1000:8042
1000:803f          e910ff                         JMP 0x1000:7f52
LAB_1000_8042:
1000:8042          3d0500                         CMP AX,0x5
1000:8045          7503                           JNZ 0x1000:804a
1000:8047          e958ff                         JMP 0x1000:7fa2
LAB_1000_804a:
1000:804a          3d0600                         CMP AX,0x6
1000:804d          74ad                           JZ 0x1000:7ffc
1000:804f          eb00                           JMP 0x1000:8051
LAB_1000_8051:
1000:8051          c41e2e11                       LES BX,[0x112e]
1000:8055          8b76fc                         MOV SI,word ptr [BP + -0x4]
1000:8058          d1e6                           SHL SI,0x1
1000:805a          8b84160d                       MOV AX,word ptr [SI + 0xd16]
1000:805e          260107                         ADD word ptr ES:[BX],AX
1000:8061          5e                             POP SI
1000:8062          8be5                           MOV SP,BP
1000:8064          5d                             POP BP
1000:8065          cb                             RETF
FUN_1000_8066:
1000:8066          55                             PUSH BP
1000:8067          8bec                           MOV BP,SP
1000:8069          83ec3a                         SUB SP,0x3a
1000:806c          56                             PUSH SI
1000:806d          837e0601                       CMP word ptr [BP + 0x6],0x1
1000:8071          753b                           JNZ 0x1000:80ae
1000:8073          c746c60000                     MOV word ptr [BP + -0x3a],0x0
1000:8078          eb03                           JMP 0x1000:807d
LAB_1000_807a:
1000:807a          ff46c6                         INC word ptr [BP + -0x3a]
LAB_1000_807d:
1000:807d          837ec61c                       CMP word ptr [BP + -0x3a],0x1c
1000:8081          7d13                           JGE 0x1000:8096
1000:8083          8b76c6                         MOV SI,word ptr [BP + -0x3a]
1000:8086          c45e08                         LES BX,[BP + 0x8]
1000:8089          268a4001                       MOV AL,byte ptr ES:[BX + SI + 0x1]
1000:808d          2ae4                           SUB AH,AH
1000:808f          d1e6                           SHL SI,0x1
1000:8091          8942c8                         MOV word ptr [BP + SI + -0x38],AX
1000:8094          ebe4                           JMP 0x1000:807a
LAB_1000_8096:
1000:8096          8d46c8                         LEA AX,[BP + -0x38]
1000:8099          16                             PUSH SS
1000:809a          50                             PUSH AX
1000:809b          c45e08                         LES BX,[BP + 0x8]
1000:809e          268a07                         MOV AL,byte ptr ES:[BX]
1000:80a1          2ae4                           SUB AH,AH
1000:80a3          50                             PUSH AX
1000:80a4          9acf013b08                     CALLF 0x0000:857f
1000:80a9          83c406                         ADD SP,0x6
1000:80ac          eb30                           JMP 0x1000:80de
LAB_1000_80ae:
1000:80ae          837e0602                       CMP word ptr [BP + 0x6],0x2
1000:80b2          7513                           JNZ 0x1000:80c7
1000:80b4          c45e08                         LES BX,[BP + 0x8]
1000:80b7          268a07                         MOV AL,byte ptr ES:[BX]
1000:80ba          2ae4                           SUB AH,AH
1000:80bc          50                             PUSH AX
1000:80bd          9ada003b08                     CALLF 0x0000:848a
1000:80c2          83c402                         ADD SP,0x2
1000:80c5          eb17                           JMP 0x1000:80de
LAB_1000_80c7:
1000:80c7          837e0603                       CMP word ptr [BP + 0x6],0x3
1000:80cb          7511                           JNZ 0x1000:80de
1000:80cd          c45e08                         LES BX,[BP + 0x8]
1000:80d0          268a07                         MOV AL,byte ptr ES:[BX]
1000:80d3          2ae4                           SUB AH,AH
1000:80d5          50                             PUSH AX
1000:80d6          9a8b013b08                     CALLF 0x0000:853b
1000:80db          83c402                         ADD SP,0x2
LAB_1000_80de:
1000:80de          5e                             POP SI
1000:80df          8be5                           MOV SP,BP
1000:80e1          5d                             POP BP
1000:80e2          cb                             RETF
FUN_1000_80e3:
1000:80e3          55                             PUSH BP
1000:80e4          8bec                           MOV BP,SP
1000:80e6          83ec08                         SUB SP,0x8
1000:80e9          c41e2e11                       LES BX,[0x112e]
1000:80ed          26c41f                         LES BX,ES:[BX]
1000:80f0          26803f2f                       CMP byte ptr ES:[BX],0x2f
1000:80f4          7512                           JNZ 0x1000:8108
1000:80f6          c41e3211                       LES BX,[0x1132]
1000:80fa          26c6072f                       MOV byte ptr ES:[BX],0x2f
1000:80fe          c41e2e11                       LES BX,[0x112e]
1000:8102          26ff0f                         DEC word ptr ES:[BX]
1000:8105          e90f01                         JMP 0x1000:8217
LAB_1000_8108:
1000:8108          c41e2e11                       LES BX,[0x112e]
1000:810c          26c41f                         LES BX,ES:[BX]
1000:810f          26803f51                       CMP byte ptr ES:[BX],0x51
1000:8113          7403                           JZ 0x1000:8118
1000:8115          e98000                         JMP 0x1000:8198
LAB_1000_8118:
1000:8118          c41e2e11                       LES BX,[0x112e]
1000:811c          26830702                       ADD word ptr ES:[BX],0x2
1000:8120          c41e2e11                       LES BX,[0x112e]
1000:8124          26c41f                         LES BX,ES:[BX]
1000:8127          268a07                         MOV AL,byte ptr ES:[BX]
1000:812a          2ae4                           SUB AH,AH
1000:812c          8946fc                         MOV word ptr [BP + -0x4],AX
1000:812f          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:8134          8b56fe                         MOV DX,word ptr [BP + -0x2]
1000:8137          8af2                           MOV DH,DL
1000:8139          8ad4                           MOV DL,AH
1000:813b          8ae0                           MOV AH,AL
1000:813d          2ac0                           SUB AL,AL
1000:813f          c41e2e11                       LES BX,[0x112e]
1000:8143          26c41f                         LES BX,ES:[BX]
1000:8146          268a4f01                       MOV CL,byte ptr ES:[BX + 0x1]
1000:814a          2aed                           SUB CH,CH
1000:814c          2bdb                           SUB BX,BX
1000:814e          03c8                           ADD CX,AX
1000:8150          13da                           ADC BX,DX
1000:8152          894efc                         MOV word ptr [BP + -0x4],CX
1000:8155          895efe                         MOV word ptr [BP + -0x2],BX
1000:8158          8bc1                           MOV AX,CX
1000:815a          8bd3                           MOV DX,BX
1000:815c          8af2                           MOV DH,DL
1000:815e          8ad4                           MOV DL,AH
1000:8160          8ae0                           MOV AH,AL
1000:8162          2ac0                           SUB AL,AL
1000:8164          c41e2e11                       LES BX,[0x112e]
1000:8168          26c41f                         LES BX,ES:[BX]
1000:816b          268a4f02                       MOV CL,byte ptr ES:[BX + 0x2]
1000:816f          2aed                           SUB CH,CH
1000:8171          2bdb                           SUB BX,BX
1000:8173          03c8                           ADD CX,AX
1000:8175          13da                           ADC BX,DX
1000:8177          894efc                         MOV word ptr [BP + -0x4],CX
1000:817a          895efe                         MOV word ptr [BP + -0x2],BX
1000:817d          c41e2e11                       LES BX,[0x112e]
1000:8181          26830703                       ADD word ptr ES:[BX],0x3
1000:8185          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8188          ff76fc                         PUSH word ptr [BP + -0x4]
1000:818b          ff362a11                       PUSH word ptr [0x112a]
1000:818f          0e                             PUSH CS
1000:8190          e8a6fb                         CALL 0x1000:7d39
1000:8193          83c406                         ADD SP,0x6
1000:8196          eb7f                           JMP 0x1000:8217
LAB_1000_8198:
1000:8198          c41e2e11                       LES BX,[0x112e]
1000:819c          26c41f                         LES BX,ES:[BX]
1000:819f          26803f7f                       CMP byte ptr ES:[BX],0x7f
1000:81a3          7560                           JNZ 0x1000:8205
1000:81a5          c41e2e11                       LES BX,[0x112e]
1000:81a9          26ff07                         INC word ptr ES:[BX]
1000:81ac          0e                             PUSH CS
1000:81ad          e89df9                         CALL 0x1000:7b4d
1000:81b0          8946f8                         MOV word ptr [BP + -0x8],AX
1000:81b3          8956fa                         MOV word ptr [BP + -0x6],DX
1000:81b6          c41e2e11                       LES BX,[0x112e]
1000:81ba          268b07                         MOV AX,word ptr ES:[BX]
1000:81bd          268b5702                       MOV DX,word ptr ES:[BX + 0x2]
1000:81c1          8946fc                         MOV word ptr [BP + -0x4],AX
1000:81c4          8956fe                         MOV word ptr [BP + -0x2],DX
1000:81c7          c45efc                         LES BX,[BP + -0x4]
1000:81ca          26803f00                       CMP byte ptr ES:[BX],0x0
1000:81ce          7529                           JNZ 0x1000:81f9
1000:81d0          26807f0100                     CMP byte ptr ES:[BX + 0x1],0x0
1000:81d5          7522                           JNZ 0x1000:81f9
1000:81d7          26807f023f                     CMP byte ptr ES:[BX + 0x2],0x3f
1000:81dc          751b                           JNZ 0x1000:81f9
1000:81de          050500                         ADD AX,0x5
1000:81e1          52                             PUSH DX
1000:81e2          50                             PUSH AX
1000:81e3          268a6703                       MOV AH,byte ptr ES:[BX + 0x3]
1000:81e7          2ac0                           SUB AL,AL
1000:81e9          268a4f04                       MOV CL,byte ptr ES:[BX + 0x4]
1000:81ed          2aed                           SUB CH,CH
1000:81ef          0bc1                           OR AX,CX
1000:81f1          50                             PUSH AX
1000:81f2          0e                             PUSH CS
1000:81f3          e870fe                         CALL 0x1000:8066
1000:81f6          83c406                         ADD SP,0x6
LAB_1000_81f9:
1000:81f9          c41e2e11                       LES BX,[0x112e]
1000:81fd          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:8200          260107                         ADD word ptr ES:[BX],AX
1000:8203          eb12                           JMP 0x1000:8217
LAB_1000_8205:
1000:8205          c41e2e11                       LES BX,[0x112e]
1000:8209          26ff07                         INC word ptr ES:[BX]
1000:820c          0e                             PUSH CS
1000:820d          e83df9                         CALL 0x1000:7b4d
1000:8210          c41e2e11                       LES BX,[0x112e]
1000:8214          260107                         ADD word ptr ES:[BX],AX
LAB_1000_8217:
1000:8217          8be5                           MOV SP,BP
1000:8219          5d                             POP BP
1000:821a          cb                             RETF
FUN_1000_821b:
1000:821b          55                             PUSH BP
1000:821c          8bec                           MOV BP,SP
1000:821e          83ec04                         SUB SP,0x4
1000:8221          0e                             PUSH CS
1000:8222          e828f9                         CALL 0x1000:7b4d
1000:8225          8946fc                         MOV word ptr [BP + -0x4],AX
1000:8228          8956fe                         MOV word ptr [BP + -0x2],DX
1000:822b          c41e2e11                       LES BX,[0x112e]
1000:822f          260107                         ADD word ptr ES:[BX],AX
1000:8232          8be5                           MOV SP,BP
1000:8234          5d                             POP BP
1000:8235          cb                             RETF
FUN_1000_8236:
1000:8236          55                             PUSH BP
1000:8237          8bec                           MOV BP,SP
1000:8239          8e068a0f                       MOV ES,word ptr [0xf8a]
1000:823d          26803e130000                   CMP byte ptr ES:[0x13],0x0
1000:8243          7507                           JNZ 0x1000:824c
1000:8245          b80100                         MOV AX,0x1
1000:8248          eb08                           JMP 0x1000:8252
LAB_1000_824c:
1000:824c          0e                             PUSH CS
1000:824d          e80600                         CALL 0x1000:8256
1000:8250          eb00                           JMP 0x1000:8252
LAB_1000_8252:
1000:8252          8be5                           MOV SP,BP
1000:8254          5d                             POP BP
1000:8255          cb                             RETF
FUN_1000_8256:
1000:8256          55                             PUSH BP
1000:8257          8bec                           MOV BP,SP
1000:8259          83ec04                         SUB SP,0x4
LAB_1000_825c:
1000:825c          c41e2e11                       LES BX,[0x112e]
1000:8260          26c41f                         LES BX,ES:[BX]
1000:8263          268a07                         MOV AL,byte ptr ES:[BX]
1000:8266          8846fc                         MOV byte ptr [BP + -0x4],AL
1000:8269          f646fc80                       TEST byte ptr [BP + -0x4],0x80
1000:826d          740e                           JZ 0x1000:827d
1000:826f          c41e3211                       LES BX,[0x1132]
1000:8273          268807                         MOV byte ptr ES:[BX],AL
1000:8276          c41e2e11                       LES BX,[0x112e]
1000:827a          26ff07                         INC word ptr ES:[BX]
LAB_1000_827d:
1000:827d          c41e3211                       LES BX,[0x1132]
1000:8281          268a07                         MOV AL,byte ptr ES:[BX]
1000:8284          8846fc                         MOV byte ptr [BP + -0x4],AL
1000:8287          3cf7                           CMP AL,0xf7
1000:8289          7404                           JZ 0x1000:828f
1000:828b          3cf0                           CMP AL,0xf0
1000:828d          750f                           JNZ 0x1000:829e
LAB_1000_828f:
1000:828f          268a07                         MOV AL,byte ptr ES:[BX]
1000:8292          2ae4                           SUB AH,AH
1000:8294          50                             PUSH AX
1000:8295          0e                             PUSH CS
1000:8296          e882ff                         CALL 0x1000:821b
1000:8299          83c402                         ADD SP,0x2
1000:829c          eb21                           JMP 0x1000:82bf
LAB_1000_829e:
1000:829e          c41e3211                       LES BX,[0x1132]
1000:82a2          26803fff                       CMP byte ptr ES:[BX],0xff
1000:82a6          7506                           JNZ 0x1000:82ae
1000:82a8          0e                             PUSH CS
1000:82a9          e837fe                         CALL 0x1000:80e3
1000:82ac          eb11                           JMP 0x1000:82bf
LAB_1000_82ae:
1000:82ae          c41e3211                       LES BX,[0x1132]
1000:82b2          268a07                         MOV AL,byte ptr ES:[BX]
1000:82b5          2ae4                           SUB AH,AH
1000:82b7          50                             PUSH AX
1000:82b8          0e                             PUSH CS
1000:82b9          e837fc                         CALL 0x1000:7ef3
1000:82bc          83c402                         ADD SP,0x2
LAB_1000_82bf:
1000:82bf          0e                             PUSH CS
1000:82c0          e8cefa                         CALL 0x1000:7d91
1000:82c3          8946fe                         MOV word ptr [BP + -0x2],AX
1000:82c6          0bc0                           OR AX,AX
1000:82c8          7507                           JNZ 0x1000:82d1
1000:82ca          803ed81000                     CMP byte ptr [0x10d8],0x0
1000:82cf          748b                           JZ 0x1000:825c
LAB_1000_82d1:
1000:82d1          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:82d5          7507                           JNZ 0x1000:82de
1000:82d7          b80100                         MOV AX,0x1
1000:82da          eb07                           JMP 0x1000:82e3
LAB_1000_82de:
1000:82de          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:82e1          eb00                           JMP 0x1000:82e3
LAB_1000_82e3:
1000:82e3          8be5                           MOV SP,BP
1000:82e5          5d                             POP BP
1000:82e6          cb                             RETF
FUN_1000_82e7:
1000:82e7          55                             PUSH BP
1000:82e8          8bec                           MOV BP,SP
1000:82ea          83ec02                         SUB SP,0x2
1000:82ed          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:82f0          a38012                         MOV [0x1280],AX
1000:82f3          0e                             PUSH CS
1000:82f4          e8cb09                         CALL 0x1000:8cc2
1000:82f7          8946fe                         MOV word ptr [BP + -0x2],AX
1000:82fa          0e                             PUSH CS
1000:82fb          e80900                         CALL 0x1000:8307
1000:82fe          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:8301          eb00                           JMP 0x1000:8303
LAB_1000_8303:
1000:8303          8be5                           MOV SP,BP
1000:8305          5d                             POP BP
1000:8306          cb                             RETF
FUN_1000_8307:
1000:8307          55                             PUSH BP
1000:8308          8bec                           MOV BP,SP
1000:830a          83ec02                         SUB SP,0x2
1000:830d          c746fe0100                     MOV word ptr [BP + -0x2],0x1
1000:8312          eb03                           JMP 0x1000:8317
LAB_1000_8314:
1000:8314          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_8317:
1000:8317          817efef500                     CMP word ptr [BP + -0x2],0xf5
1000:831c          7f10                           JG 0x1000:832e
1000:831e          2bc0                           SUB AX,AX
1000:8320          50                             PUSH AX
1000:8321          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8324          9a0a008807                     CALLF 0x0000:788a
1000:8329          83c404                         ADD SP,0x4
1000:832c          ebe6                           JMP 0x1000:8314
LAB_1000_832e:
1000:832e          b80600                         MOV AX,0x6
1000:8331          50                             PUSH AX
1000:8332          b80400                         MOV AX,0x4
1000:8335          50                             PUSH AX
1000:8336          9a0a008807                     CALLF 0x0000:788a
1000:833b          83c404                         ADD SP,0x4
1000:833e          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:8343          eb03                           JMP 0x1000:8348
LAB_1000_8345:
1000:8345          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_8348:
1000:8348          837efe09                       CMP word ptr [BP + -0x2],0x9
1000:834c          7d1d                           JGE 0x1000:836b
1000:834e          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:8351          d1e3                           SHL BX,0x1
1000:8353          c78750120020                   MOV word ptr [BX + 0x1250],0x2000
1000:8359          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:835c          c687641200                     MOV byte ptr [BX + 0x1264],0x0
1000:8361          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:8364          c6874a1100                     MOV byte ptr [BX + 0x114a],0x0
1000:8369          ebda                           JMP 0x1000:8345
LAB_1000_836b:
1000:836b          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:8370          eb03                           JMP 0x1000:8375
LAB_1000_8372:
1000:8372          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_8375:
1000:8375          837efe0b                       CMP word ptr [BP + -0x2],0xb
1000:8379          7d0a                           JGE 0x1000:8385
1000:837b          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:837e          c6873e117f                     MOV byte ptr [BX + 0x113e],0x7f
1000:8383          ebed                           JMP 0x1000:8372
LAB_1000_8385:
1000:8385          2bc0                           SUB AX,AX
1000:8387          50                             PUSH AX
1000:8388          0e                             PUSH CS
1000:8389          e82900                         CALL 0x1000:83b5
1000:838c          83c402                         ADD SP,0x2
1000:838f          2bc0                           SUB AX,AX
1000:8391          50                             PUSH AX
1000:8392          50                             PUSH AX
1000:8393          50                             PUSH AX
1000:8394          0e                             PUSH CS
1000:8395          e8f100                         CALL 0x1000:8489
1000:8398          83c406                         ADD SP,0x6
1000:839b          b80100                         MOV AX,0x1
1000:839e          50                             PUSH AX
1000:839f          0e                             PUSH CS
1000:83a0          e8c300                         CALL 0x1000:8466
1000:83a3          83c402                         ADD SP,0x2
1000:83a6          b80100                         MOV AX,0x1
1000:83a9          50                             PUSH AX
1000:83aa          0e                             PUSH CS
1000:83ab          e86400                         CALL 0x1000:8412
1000:83ae          83c402                         ADD SP,0x2
1000:83b1          8be5                           MOV SP,BP
1000:83b3          5d                             POP BP
1000:83b4          cb                             RETF
FUN_1000_83b5:
1000:83b5          55                             PUSH BP
1000:83b6          8bec                           MOV BP,SP
1000:83b8          837e0600                       CMP word ptr [BP + 0x6],0x0
1000:83bc          742c                           JZ 0x1000:83ea
1000:83be          c606521118                     MOV byte ptr [0x1152],0x18
1000:83c3          c70660120020                   MOV word ptr [0x1260],0x2000
1000:83c9          b80800                         MOV AX,0x8
1000:83cc          50                             PUSH AX
1000:83cd          0e                             PUSH CS
1000:83ce          e8c208                         CALL 0x1000:8c93
1000:83d1          83c402                         ADD SP,0x2
1000:83d4          c60651111f                     MOV byte ptr [0x1151],0x1f
1000:83d9          c7065e120020                   MOV word ptr [0x125e],0x2000
1000:83df          b80700                         MOV AX,0x7
1000:83e2          50                             PUSH AX
1000:83e3          0e                             PUSH CS
1000:83e4          e8ac08                         CALL 0x1000:8c93
1000:83e7          83c402                         ADD SP,0x2
LAB_1000_83ea:
1000:83ea          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:83ed          a23711                         MOV [0x1137],AL
1000:83f0          837e0600                       CMP word ptr [BP + 0x6],0x0
1000:83f4          7405                           JZ 0x1000:83fb
1000:83f6          b80b00                         MOV AX,0xb
1000:83f9          eb03                           JMP 0x1000:83fe
LAB_1000_83fb:
1000:83fb          b80900                         MOV AX,0x9
LAB_1000_83fe:
1000:83fe          a36212                         MOV [0x1262],AX
1000:8401          c6063d1100                     MOV byte ptr [0x113d],0x0
1000:8406          0e                             PUSH CS
1000:8407          e80103                         CALL 0x1000:870b
1000:840a          0e                             PUSH CS
1000:840b          e8e607                         CALL 0x1000:8bf4
1000:840e          8be5                           MOV SP,BP
1000:8410          5d                             POP BP
1000:8411          cb                             RETF
FUN_1000_8412:
1000:8412          55                             PUSH BP
1000:8413          8bec                           MOV BP,SP
1000:8415          83ec02                         SUB SP,0x2
1000:8418          837e0600                       CMP word ptr [BP + 0x6],0x0
1000:841c          7405                           JZ 0x1000:8423
1000:841e          b82000                         MOV AX,0x20
1000:8421          eb02                           JMP 0x1000:8425
LAB_1000_8423:
1000:8423          2bc0                           SUB AX,AX
LAB_1000_8425:
1000:8425          a33a11                         MOV [0x113a],AX
1000:8428          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:842d          eb03                           JMP 0x1000:8432
LAB_1000_842f:
1000:842f          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_8432:
1000:8432          837efe12                       CMP word ptr [BP + -0x2],0x12
1000:8436          7d1a                           JGE 0x1000:8452
1000:8438          2bc0                           SUB AX,AX
1000:843a          50                             PUSH AX
1000:843b          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:843e          8a87c20d                       MOV AL,byte ptr [BX + 0xdc2]
1000:8442          2ae4                           SUB AH,AH
1000:8444          05e000                         ADD AX,0xe0
1000:8447          50                             PUSH AX
1000:8448          9a0a008807                     CALLF 0x0000:788a
1000:844d          83c404                         ADD SP,0x4
1000:8450          ebdd                           JMP 0x1000:842f
LAB_1000_8452:
1000:8452          ff363a11                       PUSH word ptr [0x113a]
1000:8456          b80100                         MOV AX,0x1
1000:8459          50                             PUSH AX
1000:845a          9a0a008807                     CALLF 0x0000:788a
1000:845f          83c404                         ADD SP,0x4
1000:8462          8be5                           MOV SP,BP
1000:8464          5d                             POP BP
1000:8465          cb                             RETF
FUN_1000_8466:
1000:8466          55                             PUSH BP
1000:8467          8bec                           MOV BP,SP
1000:8469          837e060c                       CMP word ptr [BP + 0x6],0xc
1000:846d          7605                           JBE 0x1000:8474
1000:846f          c746060c00                     MOV word ptr [BP + 0x6],0xc
LAB_1000_8474:
1000:8474          837e0601                       CMP word ptr [BP + 0x6],0x1
1000:8478          7305                           JNC 0x1000:847f
1000:847a          c746060100                     MOV word ptr [BP + 0x6],0x1
LAB_1000_847f:
1000:847f          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:8482          a38212                         MOV [0x1282],AX
1000:8485          8be5                           MOV SP,BP
1000:8487          5d                             POP BP
1000:8488          cb                             RETF
FUN_1000_8489:
1000:8489          55                             PUSH BP
1000:848a          8bec                           MOV BP,SP
1000:848c          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:848f          a23611                         MOV [0x1136],AL
1000:8492          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:8495          a23c11                         MOV [0x113c],AL
1000:8498          8a460a                         MOV AL,byte ptr [BP + 0xa]
1000:849b          a23811                         MOV [0x1138],AL
1000:849e          0e                             PUSH CS
1000:849f          e85207                         CALL 0x1000:8bf4
1000:84a2          0e                             PUSH CS
1000:84a3          e8a905                         CALL 0x1000:8a4f
1000:84a6          8be5                           MOV SP,BP
1000:84a8          5d                             POP BP
1000:84a9          cb                             RETF
FUN_1000_84aa:
1000:84aa          55                             PUSH BP
1000:84ab          8bec                           MOV BP,SP
1000:84ad          83ec10                         SUB SP,0x10
1000:84b0          a16212                         MOV AX,[0x1262]
1000:84b3          394606                         CMP word ptr [BP + 0x6],AX
1000:84b6          7203                           JC 0x1000:84bb
1000:84b8          e99000                         JMP 0x1000:854b
LAB_1000_84bb:
1000:84bb          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:84be          8b560a                         MOV DX,word ptr [BP + 0xa]
1000:84c1          053400                         ADD AX,0x34
1000:84c4          8946f0                         MOV word ptr [BP + -0x10],AX
1000:84c7          8956f2                         MOV word ptr [BP + -0xe],DX
1000:84ca          c45ef0                         LES BX,[BP + -0x10]
1000:84cd          8346f002                       ADD word ptr [BP + -0x10],0x2
1000:84d1          268b07                         MOV AX,word ptr ES:[BX]
1000:84d4          8946fa                         MOV word ptr [BP + -0x6],AX
1000:84d7          8b5ef0                         MOV BX,word ptr [BP + -0x10]
1000:84da          268b07                         MOV AX,word ptr ES:[BX]
1000:84dd          8946f8                         MOV word ptr [BP + -0x8],AX
1000:84e0          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:84e3          051a00                         ADD AX,0x1a
1000:84e6          8946fc                         MOV word ptr [BP + -0x4],AX
1000:84e9          8956fe                         MOV word ptr [BP + -0x2],DX
1000:84ec          803e371100                     CMP byte ptr [0x1137],0x0
1000:84f1          7410                           JZ 0x1000:8503
1000:84f3          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:84f6          d1e0                           SHL AX,0x1
1000:84f8          05ac0d                         ADD AX,0xdac
1000:84fb          8946f4                         MOV word ptr [BP + -0xc],AX
1000:84fe          8c5ef6                         MOV word ptr [BP + -0xa],DS
1000:8501          eb0e                           JMP 0x1000:8511
LAB_1000_8503:
1000:8503          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:8506          d1e0                           SHL AX,0x1
1000:8508          059a0d                         ADD AX,0xd9a
1000:850b          8946f4                         MOV word ptr [BP + -0xc],AX
1000:850e          8c5ef6                         MOV word ptr [BP + -0xa],DS
LAB_1000_8511:
1000:8511          ff76fa                         PUSH word ptr [BP + -0x6]
1000:8514          ff760a                         PUSH word ptr [BP + 0xa]
1000:8517          ff7608                         PUSH word ptr [BP + 0x8]
1000:851a          c45ef4                         LES BX,[BP + -0xc]
1000:851d          268a07                         MOV AL,byte ptr ES:[BX]
1000:8520          2ae4                           SUB AH,AH
1000:8522          50                             PUSH AX
1000:8523          0e                             PUSH CS
1000:8524          e8d602                         CALL 0x1000:87fd
1000:8527          83c408                         ADD SP,0x8
1000:852a          c45ef4                         LES BX,[BP + -0xc]
1000:852d          26807f01ff                     CMP byte ptr ES:[BX + 0x1],0xff
1000:8532          7417                           JZ 0x1000:854b
1000:8534          ff76f8                         PUSH word ptr [BP + -0x8]
1000:8537          ff76fe                         PUSH word ptr [BP + -0x2]
1000:853a          ff76fc                         PUSH word ptr [BP + -0x4]
1000:853d          268a4701                       MOV AL,byte ptr ES:[BX + 0x1]
1000:8541          2ae4                           SUB AH,AH
1000:8543          50                             PUSH AX
1000:8544          0e                             PUSH CS
1000:8545          e8b502                         CALL 0x1000:87fd
1000:8548          83c408                         ADD SP,0x8
LAB_1000_854b:
1000:854b          8be5                           MOV SP,BP
1000:854d          5d                             POP BP
1000:854e          cb                             RETF
FUN_1000_854f:
1000:854f          55                             PUSH BP
1000:8550          8bec                           MOV BP,SP
1000:8552          83ec04                         SUB SP,0x4
1000:8555          a16212                         MOV AX,[0x1262]
1000:8558          394606                         CMP word ptr [BP + 0x6],AX
1000:855b          7202                           JC 0x1000:855f
1000:855d          eb62                           JMP 0x1000:85c1
LAB_1000_855f:
1000:855f          837e087f                       CMP word ptr [BP + 0x8],0x7f
1000:8563          7605                           JBE 0x1000:856a
1000:8565          c746087f00                     MOV word ptr [BP + 0x8],0x7f
LAB_1000_856a:
1000:856a          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:856d          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:8570          88873e11                       MOV byte ptr [BX + 0x113e],AL
1000:8574          803e371100                     CMP byte ptr [0x1137],0x0
1000:8579          7410                           JZ 0x1000:858b
1000:857b          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:857e          d1e0                           SHL AX,0x1
1000:8580          05ac0d                         ADD AX,0xdac
1000:8583          8946fc                         MOV word ptr [BP + -0x4],AX
1000:8586          8c5efe                         MOV word ptr [BP + -0x2],DS
1000:8589          eb0e                           JMP 0x1000:8599
LAB_1000_858b:
1000:858b          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:858e          d1e0                           SHL AX,0x1
1000:8590          059a0d                         ADD AX,0xd9a
1000:8593          8946fc                         MOV word ptr [BP + -0x4],AX
1000:8596          8c5efe                         MOV word ptr [BP + -0x2],DS
LAB_1000_8599:
1000:8599          c45efc                         LES BX,[BP + -0x4]
1000:859c          268a07                         MOV AL,byte ptr ES:[BX]
1000:859f          2ae4                           SUB AH,AH
1000:85a1          50                             PUSH AX
1000:85a2          0e                             PUSH CS
1000:85a3          e8d703                         CALL 0x1000:897d
1000:85a6          83c402                         ADD SP,0x2
1000:85a9          c45efc                         LES BX,[BP + -0x4]
1000:85ac          26807f01ff                     CMP byte ptr ES:[BX + 0x1],0xff
1000:85b1          740e                           JZ 0x1000:85c1
1000:85b3          268a4701                       MOV AL,byte ptr ES:[BX + 0x1]
1000:85b7          2ae4                           SUB AH,AH
1000:85b9          50                             PUSH AX
1000:85ba          0e                             PUSH CS
1000:85bb          e8bf03                         CALL 0x1000:897d
1000:85be          83c402                         ADD SP,0x2
LAB_1000_85c1:
1000:85c1          8be5                           MOV SP,BP
1000:85c3          5d                             POP BP
1000:85c4          cb                             RETF
FUN_1000_85c5:
1000:85c5          55                             PUSH BP
1000:85c6          8bec                           MOV BP,SP
1000:85c8          803e371100                     CMP byte ptr [0x1137],0x0
1000:85cd          7506                           JNZ 0x1000:85d5
1000:85cf          837e0609                       CMP word ptr [BP + 0x6],0x9
1000:85d3          7206                           JC 0x1000:85db
LAB_1000_85d5:
1000:85d5          837e0606                       CMP word ptr [BP + 0x6],0x6
1000:85d9          7722                           JA 0x1000:85fd
LAB_1000_85db:
1000:85db          817e08ff3f                     CMP word ptr [BP + 0x8],0x3fff
1000:85e0          7605                           JBE 0x1000:85e7
1000:85e2          c74608ff3f                     MOV word ptr [BP + 0x8],0x3fff
LAB_1000_85e7:
1000:85e7          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:85ea          d1e3                           SHL BX,0x1
1000:85ec          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:85ef          89875012                       MOV word ptr [BX + 0x1250],AX
1000:85f3          ff7606                         PUSH word ptr [BP + 0x6]
1000:85f6          0e                             PUSH CS
1000:85f7          e89906                         CALL 0x1000:8c93
1000:85fa          83c402                         ADD SP,0x2
LAB_1000_85fd:
1000:85fd          8be5                           MOV SP,BP
1000:85ff          5d                             POP BP
1000:8600          cb                             RETF
FUN_1000_8601:
1000:8601          55                             PUSH BP
1000:8602          8bec                           MOV BP,SP
1000:8604          836e080c                       SUB word ptr [BP + 0x8],0xc
1000:8608          7905                           JNS 0x1000:860f
1000:860a          c746080000                     MOV word ptr [BP + 0x8],0x0
LAB_1000_860f:
1000:860f          803e371100                     CMP byte ptr [0x1137],0x0
1000:8614          7506                           JNZ 0x1000:861c
1000:8616          837e0609                       CMP word ptr [BP + 0x6],0x9
1000:861a          7206                           JC 0x1000:8622
LAB_1000_861c:
1000:861c          837e0606                       CMP word ptr [BP + 0x6],0x6
1000:8620          731e                           JNC 0x1000:8640
LAB_1000_8622:
1000:8622          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8625          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:8628          88874a11                       MOV byte ptr [BX + 0x114a],AL
1000:862c          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:862f          c687641220                     MOV byte ptr [BX + 0x1264],0x20
1000:8634          ff7606                         PUSH word ptr [BP + 0x6]
1000:8637          0e                             PUSH CS
1000:8638          e85806                         CALL 0x1000:8c93
1000:863b          83c402                         ADD SP,0x2
1000:863e          eb65                           JMP 0x1000:86a5
LAB_1000_8640:
1000:8640          803e371100                     CMP byte ptr [0x1137],0x0
1000:8645          745e                           JZ 0x1000:86a5
1000:8647          837e060a                       CMP word ptr [BP + 0x6],0xa
1000:864b          7758                           JA 0x1000:86a5
1000:864d          837e0606                       CMP word ptr [BP + 0x6],0x6
1000:8651          7512                           JNZ 0x1000:8665
1000:8653          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:8656          a25011                         MOV [0x1150],AL
1000:8659          ff7606                         PUSH word ptr [BP + 0x6]
1000:865c          0e                             PUSH CS
1000:865d          e83306                         CALL 0x1000:8c93
1000:8660          83c402                         ADD SP,0x2
1000:8663          eb31                           JMP 0x1000:8696
LAB_1000_8665:
1000:8665          837e0608                       CMP word ptr [BP + 0x6],0x8
1000:8669          752b                           JNZ 0x1000:8696
1000:866b          a05211                         MOV AL,[0x1152]
1000:866e          2ae4                           SUB AH,AH
1000:8670          394608                         CMP word ptr [BP + 0x8],AX
1000:8673          7421                           JZ 0x1000:8696
1000:8675          8a4608                         MOV AL,byte ptr [BP + 0x8]
1000:8678          a25211                         MOV [0x1152],AL
1000:867b          0407                           ADD AL,0x7
1000:867d          a25111                         MOV [0x1151],AL
1000:8680          b80800                         MOV AX,0x8
1000:8683          50                             PUSH AX
1000:8684          0e                             PUSH CS
1000:8685          e80b06                         CALL 0x1000:8c93
1000:8688          83c402                         ADD SP,0x2
1000:868b          b80700                         MOV AX,0x7
1000:868e          50                             PUSH AX
1000:868f          0e                             PUSH CS
1000:8690          e80006                         CALL 0x1000:8c93
1000:8693          83c402                         ADD SP,0x2
LAB_1000_8696:
1000:8696          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8699          8a871e0d                       MOV AL,byte ptr [BX + 0xd1e]
1000:869d          08063d11                       OR byte ptr [0x113d],AL
1000:86a1          0e                             PUSH CS
1000:86a2          e84f05                         CALL 0x1000:8bf4
LAB_1000_86a5:
1000:86a5          8be5                           MOV SP,BP
1000:86a7          5d                             POP BP
1000:86a8          cb                             RETF
FUN_1000_86a9:
1000:86a9          55                             PUSH BP
1000:86aa          8bec                           MOV BP,SP
1000:86ac          803e371100                     CMP byte ptr [0x1137],0x0
1000:86b1          7506                           JNZ 0x1000:86b9
1000:86b3          837e0609                       CMP word ptr [BP + 0x6],0x9
1000:86b7          7206                           JC 0x1000:86bf
LAB_1000_86b9:
1000:86b9          837e0606                       CMP word ptr [BP + 0x6],0x6
1000:86bd          732a                           JNC 0x1000:86e9
LAB_1000_86bf:
1000:86bf          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:86c2          c687641200                     MOV byte ptr [BX + 0x1264],0x0
1000:86c7          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:86ca          80a76e12df                     AND byte ptr [BX + 0x126e],0xdf
1000:86cf          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:86d2          8a876e12                       MOV AL,byte ptr [BX + 0x126e]
1000:86d6          2ae4                           SUB AH,AH
1000:86d8          50                             PUSH AX
1000:86d9          8bc3                           MOV AX,BX
1000:86db          05b000                         ADD AX,0xb0
1000:86de          50                             PUSH AX
1000:86df          9a0a008807                     CALLF 0x0000:788a
1000:86e4          83c404                         ADD SP,0x4
1000:86e7          eb1e                           JMP 0x1000:8707
LAB_1000_86e9:
1000:86e9          803e371100                     CMP byte ptr [0x1137],0x0
1000:86ee          7417                           JZ 0x1000:8707
1000:86f0          837e060a                       CMP word ptr [BP + 0x6],0xa
1000:86f4          7711                           JA 0x1000:8707
1000:86f6          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:86f9          8a871e0d                       MOV AL,byte ptr [BX + 0xd1e]
1000:86fd          f6d0                           NOT AL
1000:86ff          20063d11                       AND byte ptr [0x113d],AL
1000:8703          0e                             PUSH CS
1000:8704          e8ed04                         CALL 0x1000:8bf4
LAB_1000_8707:
1000:8707          8be5                           MOV SP,BP
1000:8709          5d                             POP BP
1000:870a          cb                             RETF
FUN_1000_870b:
1000:870b          55                             PUSH BP
1000:870c          8bec                           MOV BP,SP
1000:870e          83ec02                         SUB SP,0x2
1000:8711          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:8716          eb03                           JMP 0x1000:871b
LAB_1000_8718:
1000:8718          ff46fe                         INC word ptr [BP + -0x2]
LAB_1000_871b:
1000:871b          837efe12                       CMP word ptr [BP + -0x2],0x12
1000:871f          7d30                           JGE 0x1000:8751
1000:8721          8b5efe                         MOV BX,word ptr [BP + -0x2]
1000:8724          80bfd40d00                     CMP byte ptr [BX + 0xdd4],0x0
1000:8729          7412                           JZ 0x1000:873d
1000:872b          2bc0                           SUB AX,AX
1000:872d          50                             PUSH AX
1000:872e          b8380d                         MOV AX,0xd38
1000:8731          1e                             PUSH DS
1000:8732          50                             PUSH AX
1000:8733          53                             PUSH BX
1000:8734          0e                             PUSH CS
1000:8735          e82301                         CALL 0x1000:885b
1000:8738          83c408                         ADD SP,0x8
1000:873b          eb12                           JMP 0x1000:874f
LAB_1000_873d:
1000:873d          2bc0                           SUB AX,AX
1000:873f          50                             PUSH AX
1000:8740          b82a0d                         MOV AX,0xd2a
1000:8743          1e                             PUSH DS
1000:8744          50                             PUSH AX
1000:8745          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8748          0e                             PUSH CS
1000:8749          e80f01                         CALL 0x1000:885b
1000:874c          83c408                         ADD SP,0x8
LAB_1000_874f:
1000:874f          ebc7                           JMP 0x1000:8718
LAB_1000_8751:
1000:8751          803e371100                     CMP byte ptr [0x1137],0x0
1000:8756          7472                           JZ 0x1000:87ca
1000:8758          2bc0                           SUB AX,AX
1000:875a          50                             PUSH AX
1000:875b          b8460d                         MOV AX,0xd46
1000:875e          1e                             PUSH DS
1000:875f          50                             PUSH AX
1000:8760          b80c00                         MOV AX,0xc
1000:8763          50                             PUSH AX
1000:8764          0e                             PUSH CS
1000:8765          e8f300                         CALL 0x1000:885b
1000:8768          83c408                         ADD SP,0x8
1000:876b          2bc0                           SUB AX,AX
1000:876d          50                             PUSH AX
1000:876e          b8540d                         MOV AX,0xd54
1000:8771          1e                             PUSH DS
1000:8772          50                             PUSH AX
1000:8773          b80f00                         MOV AX,0xf
1000:8776          50                             PUSH AX
1000:8777          0e                             PUSH CS
1000:8778          e8e000                         CALL 0x1000:885b
1000:877b          83c408                         ADD SP,0x8
1000:877e          2bc0                           SUB AX,AX
1000:8780          50                             PUSH AX
1000:8781          b8620d                         MOV AX,0xd62
1000:8784          1e                             PUSH DS
1000:8785          50                             PUSH AX
1000:8786          b81000                         MOV AX,0x10
1000:8789          50                             PUSH AX
1000:878a          0e                             PUSH CS
1000:878b          e8cd00                         CALL 0x1000:885b
1000:878e          83c408                         ADD SP,0x8
1000:8791          2bc0                           SUB AX,AX
1000:8793          50                             PUSH AX
1000:8794          b8700d                         MOV AX,0xd70
1000:8797          1e                             PUSH DS
1000:8798          50                             PUSH AX
1000:8799          b80e00                         MOV AX,0xe
1000:879c          50                             PUSH AX
1000:879d          0e                             PUSH CS
1000:879e          e8ba00                         CALL 0x1000:885b
1000:87a1          83c408                         ADD SP,0x8
1000:87a4          2bc0                           SUB AX,AX
1000:87a6          50                             PUSH AX
1000:87a7          b87e0d                         MOV AX,0xd7e
1000:87aa          1e                             PUSH DS
1000:87ab          50                             PUSH AX
1000:87ac          b81100                         MOV AX,0x11
1000:87af          50                             PUSH AX
1000:87b0          0e                             PUSH CS
1000:87b1          e8a700                         CALL 0x1000:885b
1000:87b4          83c408                         ADD SP,0x8
1000:87b7          2bc0                           SUB AX,AX
1000:87b9          50                             PUSH AX
1000:87ba          b88c0d                         MOV AX,0xd8c
1000:87bd          1e                             PUSH DS
1000:87be          50                             PUSH AX
1000:87bf          b80d00                         MOV AX,0xd
1000:87c2          50                             PUSH AX
1000:87c3          0e                             PUSH CS
1000:87c4          e89400                         CALL 0x1000:885b
1000:87c7          83c408                         ADD SP,0x8
LAB_1000_87ca:
1000:87ca          8be5                           MOV SP,BP
1000:87cc          5d                             POP BP
1000:87cd          cb                             RETF
FUN_1000_87ce:
1000:87ce          55                             PUSH BP
1000:87cf          8bec                           MOV BP,SP
1000:87d1          56                             PUSH SI
1000:87d2          8b7606                         MOV SI,word ptr [BP + 0x6]
1000:87d5          8bc6                           MOV AX,SI
1000:87d7          d1e6                           SHL SI,0x1
1000:87d9          03f0                           ADD SI,AX
1000:87db          d1e6                           SHL SI,0x1
1000:87dd          03f0                           ADD SI,AX
1000:87df          d1e6                           SHL SI,0x1
1000:87e1          8b5e08                         MOV BX,word ptr [BP + 0x8]
1000:87e4          8a460a                         MOV AL,byte ptr [BP + 0xa]
1000:87e7          88805411                       MOV byte ptr [BX + SI + 0x1154],AL
1000:87eb          ff7608                         PUSH word ptr [BP + 0x8]
1000:87ee          ff7606                         PUSH word ptr [BP + 0x6]
1000:87f1          0e                             PUSH CS
1000:87f2          e8a900                         CALL 0x1000:889e
1000:87f5          83c404                         ADD SP,0x4
1000:87f8          5e                             POP SI
1000:87f9          8be5                           MOV SP,BP
1000:87fb          5d                             POP BP
1000:87fc          cb                             RETF
FUN_1000_87fd:
1000:87fd          55                             PUSH BP
1000:87fe          8bec                           MOV BP,SP
1000:8800          83ec08                         SUB SP,0x8
1000:8803          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:8808          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:880b          8bc8                           MOV CX,AX
1000:880d          d1e0                           SHL AX,0x1
1000:880f          03c1                           ADD AX,CX
1000:8811          d1e0                           SHL AX,0x1
1000:8813          03c1                           ADD AX,CX
1000:8815          d1e0                           SHL AX,0x1
1000:8817          055411                         ADD AX,0x1154
1000:881a          8946fc                         MOV word ptr [BP + -0x4],AX
1000:881d          8c5efe                         MOV word ptr [BP + -0x2],DS
1000:8820          eb03                           JMP 0x1000:8825
LAB_1000_8822:
1000:8822          ff46fa                         INC word ptr [BP + -0x6]
LAB_1000_8825:
1000:8825          837efa0d                       CMP word ptr [BP + -0x6],0xd
1000:8829          7d15                           JGE 0x1000:8840
1000:882b          c45e08                         LES BX,[BP + 0x8]
1000:882e          83460802                       ADD word ptr [BP + 0x8],0x2
1000:8832          268a07                         MOV AL,byte ptr ES:[BX]
1000:8835          c45efc                         LES BX,[BP + -0x4]
1000:8838          ff46fc                         INC word ptr [BP + -0x4]
1000:883b          268807                         MOV byte ptr ES:[BX],AL
1000:883e          ebe2                           JMP 0x1000:8822
LAB_1000_8840:
1000:8840          c45efc                         LES BX,[BP + -0x4]
1000:8843          83660c03                       AND word ptr [BP + 0xc],0x3
1000:8847          8a460c                         MOV AL,byte ptr [BP + 0xc]
1000:884a          268807                         MOV byte ptr ES:[BX],AL
1000:884d          ff7606                         PUSH word ptr [BP + 0x6]
1000:8850          0e                             PUSH CS
1000:8851          e8de00                         CALL 0x1000:8932
1000:8854          83c402                         ADD SP,0x2
1000:8857          8be5                           MOV SP,BP
1000:8859          5d                             POP BP
1000:885a          cb                             RETF
FUN_1000_885b:
1000:885b          55                             PUSH BP
1000:885c          8bec                           MOV BP,SP
1000:885e          83ec1e                         SUB SP,0x1e
1000:8861          56                             PUSH SI
1000:8862          c746e20000                     MOV word ptr [BP + -0x1e],0x0
1000:8867          eb03                           JMP 0x1000:886c
LAB_1000_8869:
1000:8869          ff46e2                         INC word ptr [BP + -0x1e]
LAB_1000_886c:
1000:886c          837ee20d                       CMP word ptr [BP + -0x1e],0xd
1000:8870          7d15                           JGE 0x1000:8887
1000:8872          c45e08                         LES BX,[BP + 0x8]
1000:8875          ff4608                         INC word ptr [BP + 0x8]
1000:8878          268a07                         MOV AL,byte ptr ES:[BX]
1000:887b          2ae4                           SUB AH,AH
1000:887d          8b76e2                         MOV SI,word ptr [BP + -0x1e]
1000:8880          d1e6                           SHL SI,0x1
1000:8882          8942e4                         MOV word ptr [BP + SI + -0x1c],AX
1000:8885          ebe2                           JMP 0x1000:8869
LAB_1000_8887:
1000:8887          ff760c                         PUSH word ptr [BP + 0xc]
1000:888a          8d46e4                         LEA AX,[BP + -0x1c]
1000:888d          16                             PUSH SS
1000:888e          50                             PUSH AX
1000:888f          ff7606                         PUSH word ptr [BP + 0x6]
1000:8892          0e                             PUSH CS
1000:8893          e867ff                         CALL 0x1000:87fd
1000:8896          83c408                         ADD SP,0x8
1000:8899          5e                             POP SI
1000:889a          8be5                           MOV SP,BP
1000:889c          5d                             POP BP
1000:889d          cb                             RETF
FUN_1000_889e:
1000:889e          55                             PUSH BP
1000:889f          8bec                           MOV BP,SP
1000:88a1          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:88a4          eb57                           JMP 0x1000:88fd
LAB_1000_88fd:
1000:88fd          3d1100                         CMP AX,0x11
1000:8900          772c                           JA 0x1000:892e
1000:8902          03c0                           ADD AX,AX
1000:8904          93                             XCHG AX,BX
switchD_1000:8905::switchD:
1000:8905          2effa72f06                     JMP word ptr CS:[BX + 0x62f]
LAB_1000_892e:
1000:892e          8be5                           MOV SP,BP
1000:8930          5d                             POP BP
1000:8931          cb                             RETF
FUN_1000_8932:
1000:8932          55                             PUSH BP
1000:8933          8bec                           MOV BP,SP
1000:8935          0e                             PUSH CS
1000:8936          e8bb02                         CALL 0x1000:8bf4
1000:8939          0e                             PUSH CS
1000:893a          e81201                         CALL 0x1000:8a4f
1000:893d          ff7606                         PUSH word ptr [BP + 0x6]
1000:8940          0e                             PUSH CS
1000:8941          e83900                         CALL 0x1000:897d
1000:8944          83c402                         ADD SP,0x2
1000:8947          ff7606                         PUSH word ptr [BP + 0x6]
1000:894a          0e                             PUSH CS
1000:894b          e82301                         CALL 0x1000:8a71
1000:894e          83c402                         ADD SP,0x2
1000:8951          ff7606                         PUSH word ptr [BP + 0x6]
1000:8954          0e                             PUSH CS
1000:8955          e86f01                         CALL 0x1000:8ac7
1000:8958          83c402                         ADD SP,0x2
1000:895b          ff7606                         PUSH word ptr [BP + 0x6]
1000:895e          0e                             PUSH CS
1000:895f          e8b301                         CALL 0x1000:8b15
1000:8962          83c402                         ADD SP,0x2
1000:8965          ff7606                         PUSH word ptr [BP + 0x6]
1000:8968          0e                             PUSH CS
1000:8969          e8f701                         CALL 0x1000:8b63
1000:896c          83c402                         ADD SP,0x2
1000:896f          ff7606                         PUSH word ptr [BP + 0x6]
1000:8972          0e                             PUSH CS
1000:8973          e8d202                         CALL 0x1000:8c48
1000:8976          83c402                         ADD SP,0x2
1000:8979          8be5                           MOV SP,BP
1000:897b          5d                             POP BP
1000:897c          cb                             RETF
FUN_1000_897d:
1000:897d          55                             PUSH BP
1000:897e          8bec                           MOV BP,SP
1000:8980          83ec06                         SUB SP,0x6
1000:8983          56                             PUSH SI
1000:8984          803e371100                     CMP byte ptr [0x1137],0x0
1000:8989          740e                           JZ 0x1000:8999
1000:898b          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:898e          8a87f80d                       MOV AL,byte ptr [BX + 0xdf8]
1000:8992          2ae4                           SUB AH,AH
1000:8994          8946fa                         MOV word ptr [BP + -0x6],AX
1000:8997          eb0c                           JMP 0x1000:89a5
LAB_1000_8999:
1000:8999          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:899c          8a87e60d                       MOV AL,byte ptr [BX + 0xde6]
1000:89a0          2ae4                           SUB AH,AH
1000:89a2          8946fa                         MOV word ptr [BP + -0x6],AX
LAB_1000_89a5:
1000:89a5          8bc3                           MOV AX,BX
1000:89a7          8bc8                           MOV CX,AX
1000:89a9          d1e0                           SHL AX,0x1
1000:89ab          03c1                           ADD AX,CX
1000:89ad          d1e0                           SHL AX,0x1
1000:89af          03c1                           ADD AX,CX
1000:89b1          d1e0                           SHL AX,0x1
1000:89b3          8bf0                           MOV SI,AX
1000:89b5          8a845c11                       MOV AL,byte ptr [SI + 0x115c]
1000:89b9          2ae4                           SUB AH,AH
1000:89bb          253f00                         AND AX,0x3f
1000:89be          2d3f00                         SUB AX,0x3f
1000:89c1          f7d8                           NEG AX
1000:89c3          8946fc                         MOV word ptr [BP + -0x4],AX
1000:89c6          803e371100                     CMP byte ptr [0x1137],0x0
1000:89cb          740b                           JZ 0x1000:89d8
1000:89cd          837efa06                       CMP word ptr [BP + -0x6],0x6
1000:89d1          7605                           JBE 0x1000:89d8
1000:89d3          b80100                         MOV AX,0x1
1000:89d6          eb02                           JMP 0x1000:89da
LAB_1000_89d8:
1000:89d8          2bc0                           SUB AX,AX
LAB_1000_89da:
1000:89da          8946fe                         MOV word ptr [BP + -0x2],AX
1000:89dd          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:89e0          80bfd40d00                     CMP byte ptr [BX + 0xdd4],0x0
1000:89e5          7510                           JNZ 0x1000:89f7
1000:89e7          8a846011                       MOV AL,byte ptr [SI + 0x1160]
1000:89eb          2ae4                           SUB AH,AH
1000:89ed          0bc0                           OR AX,AX
1000:89ef          7406                           JZ 0x1000:89f7
1000:89f1          837efe00                       CMP word ptr [BP + -0x2],0x0
1000:89f5          7416                           JZ 0x1000:8a0d
LAB_1000_89f7:
1000:89f7          8b5efa                         MOV BX,word ptr [BP + -0x6]
1000:89fa          8a873e11                       MOV AL,byte ptr [BX + 0x113e]
1000:89fe          2ae4                           SUB AH,AH
1000:8a00          f766fc                         MUL word ptr [BP + -0x4]
1000:8a03          054000                         ADD AX,0x40
1000:8a06          b107                           MOV CL,0x7
1000:8a08          d3e8                           SHR AX,CL
1000:8a0a          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1000_8a0d:
1000:8a0d          b83f00                         MOV AX,0x3f
1000:8a10          2b46fc                         SUB AX,word ptr [BP + -0x4]
1000:8a13          8946fc                         MOV word ptr [BP + -0x4],AX
1000:8a16          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8a19          8bc3                           MOV AX,BX
1000:8a1b          d1e3                           SHL BX,0x1
1000:8a1d          03d8                           ADD BX,AX
1000:8a1f          d1e3                           SHL BX,0x1
1000:8a21          03d8                           ADD BX,AX
1000:8a23          d1e3                           SHL BX,0x1
1000:8a25          8a875411                       MOV AL,byte ptr [BX + 0x1154]
1000:8a29          2ae4                           SUB AH,AH
1000:8a2b          b106                           MOV CL,0x6
1000:8a2d          d3e0                           SHL AX,CL
1000:8a2f          0946fc                         OR word ptr [BP + -0x4],AX
1000:8a32          ff76fc                         PUSH word ptr [BP + -0x4]
1000:8a35          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8a38          8a87c20d                       MOV AL,byte ptr [BX + 0xdc2]
1000:8a3c          2ae4                           SUB AH,AH
1000:8a3e          054000                         ADD AX,0x40
1000:8a41          50                             PUSH AX
1000:8a42          9a0a008807                     CALLF 0x0000:788a
1000:8a47          83c404                         ADD SP,0x4
1000:8a4a          5e                             POP SI
1000:8a4b          8be5                           MOV SP,BP
1000:8a4d          5d                             POP BP
1000:8a4e          cb                             RETF
FUN_1000_8a4f:
1000:8a4f          55                             PUSH BP
1000:8a50          8bec                           MOV BP,SP
1000:8a52          803e381100                     CMP byte ptr [0x1138],0x0
1000:8a57          7405                           JZ 0x1000:8a5e
1000:8a59          b84000                         MOV AX,0x40
1000:8a5c          eb02                           JMP 0x1000:8a60
LAB_1000_8a5e:
1000:8a5e          2bc0                           SUB AX,AX
LAB_1000_8a60:
1000:8a60          50                             PUSH AX
1000:8a61          b80800                         MOV AX,0x8
1000:8a64          50                             PUSH AX
1000:8a65          9a0a008807                     CALLF 0x0000:788a
1000:8a6a          83c404                         ADD SP,0x4
1000:8a6d          8be5                           MOV SP,BP
1000:8a6f          5d                             POP BP
1000:8a70          cb                             RETF
FUN_1000_8a71:
1000:8a71          55                             PUSH BP
1000:8a72          8bec                           MOV BP,SP
1000:8a74          83ec02                         SUB SP,0x2
1000:8a77          56                             PUSH SI
1000:8a78          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8a7b          80bfd40d00                     CMP byte ptr [BX + 0xdd4],0x0
1000:8a80          7402                           JZ 0x1000:8a84
1000:8a82          eb3e                           JMP 0x1000:8ac2
LAB_1000_8a84:
1000:8a84          8bc3                           MOV AX,BX
1000:8a86          8bc8                           MOV CX,AX
1000:8a88          d1e0                           SHL AX,0x1
1000:8a8a          03c1                           ADD AX,CX
1000:8a8c          d1e0                           SHL AX,0x1
1000:8a8e          03c1                           ADD AX,CX
1000:8a90          d1e0                           SHL AX,0x1
1000:8a92          8bf0                           MOV SI,AX
1000:8a94          8a845611                       MOV AL,byte ptr [SI + 0x1156]
1000:8a98          2ae4                           SUB AH,AH
1000:8a9a          d1e0                           SHL AX,0x1
1000:8a9c          8946fe                         MOV word ptr [BP + -0x2],AX
1000:8a9f          8a846011                       MOV AL,byte ptr [SI + 0x1160]
1000:8aa3          2ae4                           SUB AH,AH
1000:8aa5          3d0100                         CMP AX,0x1
1000:8aa8          1bc9                           SBB CX,CX
1000:8aaa          f7d9                           NEG CX
1000:8aac          094efe                         OR word ptr [BP + -0x2],CX
1000:8aaf          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8ab2          8a87e60d                       MOV AL,byte ptr [BX + 0xde6]
1000:8ab6          05c000                         ADD AX,0xc0
1000:8ab9          50                             PUSH AX
1000:8aba          9a0a008807                     CALLF 0x0000:788a
1000:8abf          83c404                         ADD SP,0x4
LAB_1000_8ac2:
1000:8ac2          5e                             POP SI
1000:8ac3          8be5                           MOV SP,BP
1000:8ac5          5d                             POP BP
1000:8ac6          cb                             RETF
FUN_1000_8ac7:
1000:8ac7          55                             PUSH BP
1000:8ac8          8bec                           MOV BP,SP
1000:8aca          83ec02                         SUB SP,0x2
1000:8acd          56                             PUSH SI
1000:8ace          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:8ad1          8bc8                           MOV CX,AX
1000:8ad3          d1e0                           SHL AX,0x1
1000:8ad5          03c1                           ADD AX,CX
1000:8ad7          d1e0                           SHL AX,0x1
1000:8ad9          03c1                           ADD AX,CX
1000:8adb          d1e0                           SHL AX,0x1
1000:8add          8bf0                           MOV SI,AX
1000:8adf          8a845711                       MOV AL,byte ptr [SI + 0x1157]
1000:8ae3          2ae4                           SUB AH,AH
1000:8ae5          b104                           MOV CL,0x4
1000:8ae7          d3e0                           SHL AX,CL
1000:8ae9          8946fe                         MOV word ptr [BP + -0x2],AX
1000:8aec          8a845a11                       MOV AL,byte ptr [SI + 0x115a]
1000:8af0          2ae4                           SUB AH,AH
1000:8af2          250f00                         AND AX,0xf
1000:8af5          0946fe                         OR word ptr [BP + -0x2],AX
1000:8af8          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8afb          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8afe          8a87c20d                       MOV AL,byte ptr [BX + 0xdc2]
1000:8b02          2ae4                           SUB AH,AH
1000:8b04          056000                         ADD AX,0x60
1000:8b07          50                             PUSH AX
1000:8b08          9a0a008807                     CALLF 0x0000:788a
1000:8b0d          83c404                         ADD SP,0x4
1000:8b10          5e                             POP SI
1000:8b11          8be5                           MOV SP,BP
1000:8b13          5d                             POP BP
1000:8b14          cb                             RETF
FUN_1000_8b15:
1000:8b15          55                             PUSH BP
1000:8b16          8bec                           MOV BP,SP
1000:8b18          83ec02                         SUB SP,0x2
1000:8b1b          56                             PUSH SI
1000:8b1c          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:8b1f          8bc8                           MOV CX,AX
1000:8b21          d1e0                           SHL AX,0x1
1000:8b23          03c1                           ADD AX,CX
1000:8b25          d1e0                           SHL AX,0x1
1000:8b27          03c1                           ADD AX,CX
1000:8b29          d1e0                           SHL AX,0x1
1000:8b2b          8bf0                           MOV SI,AX
1000:8b2d          8a845811                       MOV AL,byte ptr [SI + 0x1158]
1000:8b31          2ae4                           SUB AH,AH
1000:8b33          b104                           MOV CL,0x4
1000:8b35          d3e0                           SHL AX,CL
1000:8b37          8946fe                         MOV word ptr [BP + -0x2],AX
1000:8b3a          8a845b11                       MOV AL,byte ptr [SI + 0x115b]
1000:8b3e          2ae4                           SUB AH,AH
1000:8b40          250f00                         AND AX,0xf
1000:8b43          0946fe                         OR word ptr [BP + -0x2],AX
1000:8b46          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8b49          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8b4c          8a87c20d                       MOV AL,byte ptr [BX + 0xdc2]
1000:8b50          2ae4                           SUB AH,AH
1000:8b52          058000                         ADD AX,0x80
1000:8b55          50                             PUSH AX
1000:8b56          9a0a008807                     CALLF 0x0000:788a
1000:8b5b          83c404                         ADD SP,0x4
1000:8b5e          5e                             POP SI
1000:8b5f          8be5                           MOV SP,BP
1000:8b61          5d                             POP BP
1000:8b62          cb                             RETF
FUN_1000_8b63:
1000:8b63          55                             PUSH BP
1000:8b64          8bec                           MOV BP,SP
1000:8b66          83ec02                         SUB SP,0x2
1000:8b69          56                             PUSH SI
1000:8b6a          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:8b6d          8bc8                           MOV CX,AX
1000:8b6f          d1e0                           SHL AX,0x1
1000:8b71          03c1                           ADD AX,CX
1000:8b73          d1e0                           SHL AX,0x1
1000:8b75          03c1                           ADD AX,CX
1000:8b77          d1e0                           SHL AX,0x1
1000:8b79          8bf0                           MOV SI,AX
1000:8b7b          8a845d11                       MOV AL,byte ptr [SI + 0x115d]
1000:8b7f          2ae4                           SUB AH,AH
1000:8b81          0bc0                           OR AX,AX
1000:8b83          7405                           JZ 0x1000:8b8a
1000:8b85          b88000                         MOV AX,0x80
1000:8b88          eb02                           JMP 0x1000:8b8c
LAB_1000_8b8a:
1000:8b8a          2bc0                           SUB AX,AX
LAB_1000_8b8c:
1000:8b8c          8946fe                         MOV word ptr [BP + -0x2],AX
1000:8b8f          8a845e11                       MOV AL,byte ptr [SI + 0x115e]
1000:8b93          2ae4                           SUB AH,AH
1000:8b95          0bc0                           OR AX,AX
1000:8b97          7405                           JZ 0x1000:8b9e
1000:8b99          b84000                         MOV AX,0x40
1000:8b9c          eb02                           JMP 0x1000:8ba0
LAB_1000_8b9e:
1000:8b9e          2bc0                           SUB AX,AX
LAB_1000_8ba0:
1000:8ba0          0146fe                         ADD word ptr [BP + -0x2],AX
1000:8ba3          8a845911                       MOV AL,byte ptr [SI + 0x1159]
1000:8ba7          2ae4                           SUB AH,AH
1000:8ba9          0bc0                           OR AX,AX
1000:8bab          7405                           JZ 0x1000:8bb2
1000:8bad          b82000                         MOV AX,0x20
1000:8bb0          eb02                           JMP 0x1000:8bb4
LAB_1000_8bb2:
1000:8bb2          2bc0                           SUB AX,AX
LAB_1000_8bb4:
1000:8bb4          0146fe                         ADD word ptr [BP + -0x2],AX
1000:8bb7          8a845f11                       MOV AL,byte ptr [SI + 0x115f]
1000:8bbb          2ae4                           SUB AH,AH
1000:8bbd          0bc0                           OR AX,AX
1000:8bbf          7405                           JZ 0x1000:8bc6
1000:8bc1          b81000                         MOV AX,0x10
1000:8bc4          eb02                           JMP 0x1000:8bc8
LAB_1000_8bc6:
1000:8bc6          2bc0                           SUB AX,AX
LAB_1000_8bc8:
1000:8bc8          0146fe                         ADD word ptr [BP + -0x2],AX
1000:8bcb          8a845511                       MOV AL,byte ptr [SI + 0x1155]
1000:8bcf          2ae4                           SUB AH,AH
1000:8bd1          250f00                         AND AX,0xf
1000:8bd4          0146fe                         ADD word ptr [BP + -0x2],AX
1000:8bd7          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8bda          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8bdd          8a87c20d                       MOV AL,byte ptr [BX + 0xdc2]
1000:8be1          2ae4                           SUB AH,AH
1000:8be3          052000                         ADD AX,0x20
1000:8be6          50                             PUSH AX
1000:8be7          9a0a008807                     CALLF 0x0000:788a
1000:8bec          83c404                         ADD SP,0x4
1000:8bef          5e                             POP SI
1000:8bf0          8be5                           MOV SP,BP
1000:8bf2          5d                             POP BP
1000:8bf3          cb                             RETF
FUN_1000_8bf4:
1000:8bf4          55                             PUSH BP
1000:8bf5          8bec                           MOV BP,SP
1000:8bf7          83ec02                         SUB SP,0x2
1000:8bfa          803e361100                     CMP byte ptr [0x1136],0x0
1000:8bff          7405                           JZ 0x1000:8c06
1000:8c01          b88000                         MOV AX,0x80
1000:8c04          eb02                           JMP 0x1000:8c08
LAB_1000_8c06:
1000:8c06          2bc0                           SUB AX,AX
LAB_1000_8c08:
1000:8c08          8946fe                         MOV word ptr [BP + -0x2],AX
1000:8c0b          803e3c1100                     CMP byte ptr [0x113c],0x0
1000:8c10          7405                           JZ 0x1000:8c17
1000:8c12          b84000                         MOV AX,0x40
1000:8c15          eb02                           JMP 0x1000:8c19
LAB_1000_8c17:
1000:8c17          2bc0                           SUB AX,AX
LAB_1000_8c19:
1000:8c19          0946fe                         OR word ptr [BP + -0x2],AX
1000:8c1c          803e371100                     CMP byte ptr [0x1137],0x0
1000:8c21          7405                           JZ 0x1000:8c28
1000:8c23          b82000                         MOV AX,0x20
1000:8c26          eb02                           JMP 0x1000:8c2a
LAB_1000_8c28:
1000:8c28          2bc0                           SUB AX,AX
LAB_1000_8c2a:
1000:8c2a          0946fe                         OR word ptr [BP + -0x2],AX
1000:8c2d          a03d11                         MOV AL,[0x113d]
1000:8c30          2ae4                           SUB AH,AH
1000:8c32          0946fe                         OR word ptr [BP + -0x2],AX
1000:8c35          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8c38          b8bd00                         MOV AX,0xbd
1000:8c3b          50                             PUSH AX
1000:8c3c          9a0a008807                     CALLF 0x0000:788a
1000:8c41          83c404                         ADD SP,0x4
1000:8c44          8be5                           MOV SP,BP
1000:8c46          5d                             POP BP
1000:8c47          cb                             RETF
FUN_1000_8c48:
1000:8c48          55                             PUSH BP
1000:8c49          8bec                           MOV BP,SP
1000:8c4b          83ec02                         SUB SP,0x2
1000:8c4e          833e3a1100                     CMP word ptr [0x113a],0x0
1000:8c53          741d                           JZ 0x1000:8c72
1000:8c55          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8c58          8bc3                           MOV AX,BX
1000:8c5a          d1e3                           SHL BX,0x1
1000:8c5c          03d8                           ADD BX,AX
1000:8c5e          d1e3                           SHL BX,0x1
1000:8c60          03d8                           ADD BX,AX
1000:8c62          d1e3                           SHL BX,0x1
1000:8c64          8a876111                       MOV AL,byte ptr [BX + 0x1161]
1000:8c68          2ae4                           SUB AH,AH
1000:8c6a          250300                         AND AX,0x3
1000:8c6d          8946fe                         MOV word ptr [BP + -0x2],AX
1000:8c70          eb05                           JMP 0x1000:8c77
LAB_1000_8c72:
1000:8c72          c746fe0000                     MOV word ptr [BP + -0x2],0x0
LAB_1000_8c77:
1000:8c77          ff76fe                         PUSH word ptr [BP + -0x2]
1000:8c7a          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8c7d          8a87c20d                       MOV AL,byte ptr [BX + 0xdc2]
1000:8c81          2ae4                           SUB AH,AH
1000:8c83          05e000                         ADD AX,0xe0
1000:8c86          50                             PUSH AX
1000:8c87          9a0a008807                     CALLF 0x0000:788a
1000:8c8c          83c404                         ADD SP,0x4
1000:8c8f          8be5                           MOV SP,BP
1000:8c91          5d                             POP BP
1000:8c92          cb                             RETF
FUN_1000_8c93:
1000:8c93          55                             PUSH BP
1000:8c94          8bec                           MOV BP,SP
1000:8c96          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8c99          8a876412                       MOV AL,byte ptr [BX + 0x1264]
1000:8c9d          2ae4                           SUB AH,AH
1000:8c9f          50                             PUSH AX
1000:8ca0          d1e3                           SHL BX,0x1
1000:8ca2          ffb75012                       PUSH word ptr [BX + 0x1250]
1000:8ca6          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8ca9          8a874a11                       MOV AL,byte ptr [BX + 0x114a]
1000:8cad          50                             PUSH AX
1000:8cae          53                             PUSH BX
1000:8caf          9a06008c07                     CALLF 0x0000:78c6
1000:8cb4          83c408                         ADD SP,0x8
1000:8cb7          8b5e06                         MOV BX,word ptr [BP + 0x6]
1000:8cba          88876e12                       MOV byte ptr [BX + 0x126e],AL
1000:8cbe          8be5                           MOV SP,BP
1000:8cc0          5d                             POP BP
1000:8cc1          cb                             RETF
FUN_1000_8cc2:
1000:8cc2          55                             PUSH BP
1000:8cc3          8bec                           MOV BP,SP
1000:8cc5          83ec06                         SUB SP,0x6
1000:8cc8          b86000                         MOV AX,0x60
1000:8ccb          50                             PUSH AX
1000:8ccc          b80400                         MOV AX,0x4
1000:8ccf          50                             PUSH AX
1000:8cd0          9a0a008807                     CALLF 0x0000:788a
1000:8cd5          83c404                         ADD SP,0x4
1000:8cd8          b88000                         MOV AX,0x80
1000:8cdb          50                             PUSH AX
1000:8cdc          b80400                         MOV AX,0x4
1000:8cdf          50                             PUSH AX
1000:8ce0          9a0a008807                     CALLF 0x0000:788a
1000:8ce5          83c404                         ADD SP,0x4
1000:8ce8          ff368012                       PUSH word ptr [0x1280]
1000:8cec          9ae41aaa05                     CALLF 0x0000:7584
1000:8cf1          83c402                         ADD SP,0x2
1000:8cf4          8946fe                         MOV word ptr [BP + -0x2],AX
1000:8cf7          b8ff00                         MOV AX,0xff
1000:8cfa          50                             PUSH AX
1000:8cfb          b80200                         MOV AX,0x2
1000:8cfe          50                             PUSH AX
1000:8cff          9a0a008807                     CALLF 0x0000:788a
1000:8d04          83c404                         ADD SP,0x4
1000:8d07          b82100                         MOV AX,0x21
1000:8d0a          50                             PUSH AX
1000:8d0b          b80400                         MOV AX,0x4
1000:8d0e          50                             PUSH AX
1000:8d0f          9a0a008807                     CALLF 0x0000:788a
1000:8d14          83c404                         ADD SP,0x4
1000:8d17          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:8d1c          eb03                           JMP 0x1000:8d21
LAB_1000_8d1e:
1000:8d1e          ff46fa                         INC word ptr [BP + -0x6]
LAB_1000_8d21:
1000:8d21          817efac800                     CMP word ptr [BP + -0x6],0xc8
1000:8d26          730e                           JNC 0x1000:8d36
1000:8d28          ff368012                       PUSH word ptr [0x1280]
1000:8d2c          9ae41aaa05                     CALLF 0x0000:7584
1000:8d31          83c402                         ADD SP,0x2
1000:8d34          ebe8                           JMP 0x1000:8d1e
LAB_1000_8d36:
1000:8d36          ff368012                       PUSH word ptr [0x1280]
1000:8d3a          9ae41aaa05                     CALLF 0x0000:7584
1000:8d3f          83c402                         ADD SP,0x2
1000:8d42          8946fc                         MOV word ptr [BP + -0x4],AX
1000:8d45          b86000                         MOV AX,0x60
1000:8d48          50                             PUSH AX
1000:8d49          b80400                         MOV AX,0x4
1000:8d4c          50                             PUSH AX
1000:8d4d          9a0a008807                     CALLF 0x0000:788a
1000:8d52          83c404                         ADD SP,0x4
1000:8d55          b88000                         MOV AX,0x80
1000:8d58          50                             PUSH AX
1000:8d59          b80400                         MOV AX,0x4
1000:8d5c          50                             PUSH AX
1000:8d5d          9a0a008807                     CALLF 0x0000:788a
1000:8d62          83c404                         ADD SP,0x4
1000:8d65          f646fee0                       TEST byte ptr [BP + -0x2],0xe0
1000:8d69          750e                           JNZ 0x1000:8d79
1000:8d6b          8a46fc                         MOV AL,byte ptr [BP + -0x4]
1000:8d6e          24e0                           AND AL,0xe0
1000:8d70          3cc0                           CMP AL,0xc0
1000:8d72          7505                           JNZ 0x1000:8d79
1000:8d74          b80100                         MOV AX,0x1
1000:8d77          eb02                           JMP 0x1000:8d7b
LAB_1000_8d79:
1000:8d79          2bc0                           SUB AX,AX
LAB_1000_8d7b:
1000:8d7b          eb00                           JMP 0x1000:8d7d
LAB_1000_8d7d:
1000:8d7d          8be5                           MOV SP,BP
1000:8d7f          5d                             POP BP
1000:8d80          cb                             RETF
FUN_1000_8d81:
1000:8d81          55                             PUSH BP
1000:8d82          8bec                           MOV BP,SP
1000:8d84          33c0                           XOR AX,AX
1000:8d86          9a760eaa05                     CALLF 0x0000:6916
1000:8d8b          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:8d8e          a30c0e                         MOV [0xe0c],AX
1000:8d91          b80100                         MOV AX,0x1
1000:8d94          5d                             POP BP
1000:8d95          cb                             RETF
FUN_1000_8d97:
1000:8d97          55                             PUSH BP
1000:8d98          8bec                           MOV BP,SP
1000:8d9a          b81600                         MOV AX,0x16
1000:8d9d          9a760eaa05                     CALLF 0x0000:6916
1000:8da2          56                             PUSH SI
1000:8da3          b80400                         MOV AX,0x4
1000:8da6          50                             PUSH AX
1000:8da7          b80e0e                         MOV AX,0xe0e
1000:8daa          1e                             PUSH DS
1000:8dab          50                             PUSH AX
1000:8dac          ff7608                         PUSH word ptr [BP + 0x8]
1000:8daf          ff7606                         PUSH word ptr [BP + 0x6]
1000:8db2          9ada18aa05                     CALLF 0x0000:737a
1000:8db7          83c40a                         ADD SP,0xa
1000:8dba          8946fa                         MOV word ptr [BP + -0x6],AX
1000:8dbd          0bc0                           OR AX,AX
1000:8dbf          7408                           JZ 0x1000:8dc9
LAB_1000_8dc1:
1000:8dc1          2bc0                           SUB AX,AX
1000:8dc3          5e                             POP SI
1000:8dc4          8be5                           MOV SP,BP
1000:8dc6          5d                             POP BP
1000:8dc7          cb                             RETF
LAB_1000_8dc9:
1000:8dc9          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:8dce          eb04                           JMP 0x1000:8dd4
LAB_1000_8dd1:
1000:8dd1          ff46fa                         INC word ptr [BP + -0x6]
LAB_1000_8dd4:
1000:8dd4          817efac800                     CMP word ptr [BP + -0x6],0xc8
1000:8dd9          7d23                           JGE 0x1000:8dfe
1000:8ddb          b80400                         MOV AX,0x4
1000:8dde          50                             PUSH AX
1000:8ddf          b8130e                         MOV AX,0xe13
1000:8de2          1e                             PUSH DS
1000:8de3          50                             PUSH AX
1000:8de4          8b46fa                         MOV AX,word ptr [BP + -0x6]
1000:8de7          034606                         ADD AX,word ptr [BP + 0x6]
1000:8dea          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:8ded          52                             PUSH DX
1000:8dee          50                             PUSH AX
1000:8def          9ada18aa05                     CALLF 0x0000:737a
1000:8df4          83c40a                         ADD SP,0xa
1000:8df7          8946f8                         MOV word ptr [BP + -0x8],AX
1000:8dfa          0bc0                           OR AX,AX
1000:8dfc          75d3                           JNZ 0x1000:8dd1
LAB_1000_8dfe:
1000:8dfe          837ef800                       CMP word ptr [BP + -0x8],0x0
1000:8e02          75bd                           JNZ 0x1000:8dc1
1000:8e04          8346fa06                       ADD word ptr [BP + -0x6],0x6
1000:8e08          eb50                           JMP 0x1000:8e5a
switchD_1000:8905::caseD_9:
1000:8e0a          90                             NOP
LAB_1000_8e0b:
1000:8e0b          8b5efa                         MOV BX,word ptr [BP + -0x6]
1000:8e0e          c47606                         LES SI,[BP + 0x6]
1000:8e11          268a00                         MOV AL,byte ptr ES:[BX + SI]
1000:8e14          2ae4                           SUB AH,AH
1000:8e16          8946f6                         MOV word ptr [BP + -0xa],AX
1000:8e19          8166f6f000                     AND word ptr [BP + -0xa],0xf0
1000:8e1e          817ef69000                     CMP word ptr [BP + -0xa],0x90
1000:8e23          7532                           JNZ 0x1000:8e57
1000:8e25          8bc3                           MOV AX,BX
1000:8e27          03c6                           ADD AX,SI
1000:8e29          8cc2                           MOV DX,ES
1000:8e2b          050200                         ADD AX,0x2
1000:8e2e          8946ea                         MOV word ptr [BP + -0x16],AX
1000:8e31          8956ec                         MOV word ptr [BP + -0x14],DX
1000:8e34          c45eea                         LES BX,[BP + -0x16]
1000:8e37          268a07                         MOV AL,byte ptr ES:[BX]
1000:8e3a          2ae4                           SUB AH,AH
1000:8e3c          8946f4                         MOV word ptr [BP + -0xc],AX
1000:8e3f          b86400                         MOV AX,0x64
1000:8e42          f76ef4                         IMUL word ptr [BP + -0xc]
1000:8e45          8946f4                         MOV word ptr [BP + -0xc],AX
1000:8e48          b9a000                         MOV CX,0xa0
1000:8e4b          99                             CWD
1000:8e4c          f7f9                           IDIV CX
1000:8e4e          8946f4                         MOV word ptr [BP + -0xc],AX
1000:8e51          8a46f4                         MOV AL,byte ptr [BP + -0xc]
1000:8e54          268807                         MOV byte ptr ES:[BX],AL
LAB_1000_8e57:
1000:8e57          ff46fa                         INC word ptr [BP + -0x6]
LAB_1000_8e5a:
1000:8e5a          8b460a                         MOV AX,word ptr [BP + 0xa]
1000:8e5d          2d0300                         SUB AX,0x3
1000:8e60          3b46fa                         CMP AX,word ptr [BP + -0x6]
1000:8e63          77a6                           JA 0x1000:8e0b
1000:8e65          5e                             POP SI
1000:8e66          8be5                           MOV SP,BP
1000:8e68          5d                             POP BP
1000:8e69          cb                             RETF
FUN_1000_8e6b:
1000:8e6b          55                             PUSH BP
1000:8e6c          8bec                           MOV BP,SP
1000:8e6e          b81e00                         MOV AX,0x1e
1000:8e71          9a760eaa05                     CALLF 0x0000:6916
1000:8e76          c646e300                       MOV byte ptr [BP + -0x1d],0x0
1000:8e7a          8d46e2                         LEA AX,[BP + -0x1e]
1000:8e7d          16                             PUSH SS
1000:8e7e          50                             PUSH AX
1000:8e7f          8d46e2                         LEA AX,[BP + -0x1e]
1000:8e82          16                             PUSH SS
1000:8e83          50                             PUSH AX
1000:8e84          b81a00                         MOV AX,0x1a
1000:8e87          50                             PUSH AX
1000:8e88          9a5e19aa05                     CALLF 0x0000:73fe
1000:8e8d          83c40a                         ADD SP,0xa
1000:8e90          8b46e6                         MOV AX,word ptr [BP + -0x1a]
1000:8e93          8946fc                         MOV word ptr [BP + -0x4],AX
1000:8e96          c746fe0000                     MOV word ptr [BP + -0x2],0x0
1000:8e9b          b010                           MOV AL,0x10
1000:8e9d          50                             PUSH AX
1000:8e9e          8d46fc                         LEA AX,[BP + -0x4]
1000:8ea1          50                             PUSH AX
1000:8ea2          9a421daa05                     CALLF 0x0000:77e2
1000:8ea7          8b46e8                         MOV AX,word ptr [BP + -0x18]
1000:8eaa          8946f8                         MOV word ptr [BP + -0x8],AX
1000:8ead          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:8eb2          c746fa0000                     MOV word ptr [BP + -0x6],0x0
1000:8eb7          c746fc0000                     MOV word ptr [BP + -0x4],0x0
1000:8ebc          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:8ebf          8b56fe                         MOV DX,word ptr [BP + -0x2]
1000:8ec2          0946f8                         OR word ptr [BP + -0x8],AX
1000:8ec5          0956fa                         OR word ptr [BP + -0x6],DX
1000:8ec8          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:8ecb          8b56fa                         MOV DX,word ptr [BP + -0x6]
1000:8ece          8be5                           MOV SP,BP
1000:8ed0          5d                             POP BP
1000:8ed1          cb                             RETF
FUN_1000_8ed3:
1000:8ed3          55                             PUSH BP
1000:8ed4          8bec                           MOV BP,SP
1000:8ed6          b80a00                         MOV AX,0xa
1000:8ed9          9a760eaa05                     CALLF 0x0000:6916
1000:8ede          0e                             PUSH CS
1000:8edf          e889ff                         CALL 0x1000:8e6b
1000:8ee2          8946fa                         MOV word ptr [BP + -0x6],AX
1000:8ee5          8956fc                         MOV word ptr [BP + -0x4],DX
1000:8ee8          c746fe0000                     MOV word ptr [BP + -0x2],0x0
LAB_1000_8eed:
1000:8eed          ff46fe                         INC word ptr [BP + -0x2]
1000:8ef0          ff46fe                         INC word ptr [BP + -0x2]
1000:8ef3          ff4efe                         DEC word ptr [BP + -0x2]
1000:8ef6          8346fe02                       ADD word ptr [BP + -0x2],0x2
1000:8efa          836efe02                       SUB word ptr [BP + -0x2],0x2
1000:8efe          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:8f01          3de0ab                         CMP AX,0xabe0
1000:8f04          75e7                           JNZ 0x1000:8eed
LAB_1000_8f06:
1000:8f06          ff46fe                         INC word ptr [BP + -0x2]
1000:8f09          ff46fe                         INC word ptr [BP + -0x2]
1000:8f0c          ff4efe                         DEC word ptr [BP + -0x2]
1000:8f0f          8346fe02                       ADD word ptr [BP + -0x2],0x2
1000:8f13          836efe02                       SUB word ptr [BP + -0x2],0x2
1000:8f17          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:8f1a          3de0ab                         CMP AX,0xabe0
1000:8f1d          75e7                           JNZ 0x1000:8f06
1000:8f1f          0e                             PUSH CS
1000:8f20          e848ff                         CALL 0x1000:8e6b
1000:8f23          8946f6                         MOV word ptr [BP + -0xa],AX
1000:8f26          8956f8                         MOV word ptr [BP + -0x8],DX
1000:8f29          2b46fa                         SUB AX,word ptr [BP + -0x6]
1000:8f2c          8946fe                         MOV word ptr [BP + -0x2],AX
1000:8f2f          8e068c0f                       MOV ES,word ptr [0xf8c]
1000:8f33          26a36f0b                       MOV ES:[0xb6f],AX
1000:8f37          8be5                           MOV SP,BP
1000:8f39          5d                             POP BP
1000:8f3a          cb                             RETF
FUN_1000_8f3b:
1000:8f3b          55                             PUSH BP
1000:8f3c          8bec                           MOV BP,SP
1000:8f3e          b81800                         MOV AX,0x18
1000:8f41          9a760eaa05                     CALLF 0x0000:6916
1000:8f46          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:8f4a          26833e0e0009                   CMP word ptr ES:[0xe],0x9
1000:8f50          7507                           JNZ 0x1000:8f59
LAB_1000_8f52:
1000:8f52          2bc0                           SUB AX,AX
1000:8f54          8be5                           MOV SP,BP
1000:8f56          5d                             POP BP
1000:8f57          cb                             RETF
LAB_1000_8f59:
1000:8f59          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:8f5d          26833e0e0002                   CMP word ptr ES:[0xe],0x2
1000:8f63          7528                           JNZ 0x1000:8f8d
1000:8f65          c746e80081                     MOV word ptr [BP + -0x18],0x8100
1000:8f6a          8d46e8                         LEA AX,[BP + -0x18]
1000:8f6d          16                             PUSH SS
1000:8f6e          50                             PUSH AX
1000:8f6f          8d46e8                         LEA AX,[BP + -0x18]
1000:8f72          16                             PUSH SS
1000:8f73          50                             PUSH AX
1000:8f74          b81a00                         MOV AX,0x1a
1000:8f77          50                             PUSH AX
1000:8f78          9a5e19aa05                     CALLF 0x0000:73fe
1000:8f7d          83c40a                         ADD SP,0xa
1000:8f80          837ef400                       CMP word ptr [BP + -0xc],0x0
LAB_1000_8f84:
1000:8f84          74cc                           JZ 0x1000:8f52
1000:8f86          b80100                         MOV AX,0x1
1000:8f89          8be5                           MOV SP,BP
1000:8f8b          5d                             POP BP
1000:8f8c          cb                             RETF
LAB_1000_8f8d:
1000:8f8d          803e180e00                     CMP byte ptr [0xe18],0x0
1000:8f92          740d                           JZ 0x1000:8fa1
1000:8f94          8e06900f                       MOV ES,word ptr [0xf90]
1000:8f98          26803e740b00                   CMP byte ptr ES:[0xb74],0x0
1000:8f9e          ebe4                           JMP 0x1000:8f84
LAB_1000_8fa1:
1000:8fa1          803e190e00                     CMP byte ptr [0xe19],0x0
1000:8fa6          74aa                           JZ 0x1000:8f52
1000:8fa8          8e06920f                       MOV ES,word ptr [0xf92]
1000:8fac          26a01300                       MOV AL,ES:[0x13]
1000:8fb0          98                             CBW
1000:8fb1          8be5                           MOV SP,BP
1000:8fb3          5d                             POP BP
1000:8fb4          cb                             RETF
FUN_1000_8fb5:
1000:8fb5          55                             PUSH BP
1000:8fb6          8bec                           MOV BP,SP
1000:8fb8          b80600                         MOV AX,0x6
1000:8fbb          9a760eaa05                     CALLF 0x0000:6916
1000:8fc0          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:8fc4          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:8fc7          26a30e00                       MOV ES:[0xe],AX
1000:8fcb          8e06940f                       MOV ES,word ptr [0xf94]
1000:8fcf          26a3710b                       MOV ES:[0xb71],AX
1000:8fd3          8e06960f                       MOV ES,word ptr [0xf96]
1000:8fd7          26a1690b                       MOV AX,ES:[0xb69]
1000:8fdb          8946fa                         MOV word ptr [BP + -0x6],AX
1000:8fde          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:8fe2          26833e0e0009                   CMP word ptr ES:[0xe],0x9
1000:8fe8          7507                           JNZ 0x1000:8ff1
LAB_1000_8fea:
1000:8fea          b80100                         MOV AX,0x1
1000:8fed          8be5                           MOV SP,BP
1000:8fef          5d                             POP BP
1000:8ff0          cb                             RETF
LAB_1000_8ff1:
1000:8ff1          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:8ff5          26a10e00                       MOV AX,ES:[0xe]
1000:8ff9          2d0100                         SUB AX,0x1
1000:8ffc          3d0900                         CMP AX,0x9
1000:8fff          77e9                           JA 0x1000:8fea
1000:9001          03c0                           ADD AX,AX
1000:9003          93                             XCHG AX,BX
switchD_1000:9004::switchD:
1000:9004          2effa70004                     JMP word ptr CS:[BX + 0x400]
FUN_1000_9461:
1000:9461          55                             PUSH BP
1000:9462          8bec                           MOV BP,SP
1000:9464          b81600                         MOV AX,0x16
1000:9467          9a760eaa05                     CALLF 0x0000:6916
1000:946c          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9470          26833e0e0009                   CMP word ptr ES:[0xe],0x9
1000:9476          7507                           JNZ 0x1000:947f
LAB_1000_9478:
1000:9478          b80100                         MOV AX,0x1
1000:947b          8be5                           MOV SP,BP
1000:947d          5d                             POP BP
1000:947e          cb                             RETF
LAB_1000_947f:
1000:947f          803e180e00                     CMP byte ptr [0xe18],0x0
1000:9484          7463                           JZ 0x1000:94e9
1000:9486          0e                             PUSH CS
1000:9487          e8a306                         CALL 0x1000:9b2d
1000:948a          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:948e          26a10e00                       MOV AX,ES:[0xe]
1000:9492          2d0100                         SUB AX,0x1
1000:9495          3d0900                         CMP AX,0x9
1000:9498          7747                           JA 0x1000:94e1
1000:949a          03c0                           ADD AX,AX
1000:949c          93                             XCHG AX,BX
1000:949d          2effa75207                     JMP word ptr CS:[BX + 0x752]
LAB_1000_94e1:
1000:94e1          c606180e00                     MOV byte ptr [0xe18],0x0
1000:94e6          eb90                           JMP 0x1000:9478
LAB_1000_94e9:
1000:94e9          2bc0                           SUB AX,AX
1000:94eb          8be5                           MOV SP,BP
1000:94ed          5d                             POP BP
1000:94ee          cb                             RETF
FUN_1000_94ef:
1000:94ef          55                             PUSH BP
1000:94f0          8bec                           MOV BP,SP
1000:94f2          b81600                         MOV AX,0x16
1000:94f5          9a760eaa05                     CALLF 0x0000:6916
1000:94fa          833e0c0e00                     CMP word ptr [0xe0c],0x0
1000:94ff          7508                           JNZ 0x1000:9509
LAB_1000_9501:
1000:9501          b80100                         MOV AX,0x1
1000:9504          8be5                           MOV SP,BP
1000:9506          5d                             POP BP
1000:9507          cb                             RETF
LAB_1000_9509:
1000:9509          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:950d          26833e0e0009                   CMP word ptr ES:[0xe],0x9
1000:9513          74ec                           JZ 0x1000:9501
1000:9515          26a10e00                       MOV AX,ES:[0xe]
1000:9519          3d0100                         CMP AX,0x1
1000:951c          740f                           JZ 0x1000:952d
1000:951e          3d0300                         CMP AX,0x3
1000:9521          7cde                           JL 0x1000:9501
1000:9523          3d0800                         CMP AX,0x8
1000:9526          7e05                           JLE 0x1000:952d
1000:9528          3d0a00                         CMP AX,0xa
1000:952b          75d4                           JNZ 0x1000:9501
LAB_1000_952d:
1000:952d          803e190e00                     CMP byte ptr [0xe19],0x0
1000:9532          75cd                           JNZ 0x1000:9501
1000:9534          9ad609aa05                     CALLF 0x0000:6476
1000:9539          ebc6                           JMP 0x1000:9501
FUN_1000_95b3:
1000:95b3          55                             PUSH BP
1000:95b4          8bec                           MOV BP,SP
1000:95b6          b82800                         MOV AX,0x28
1000:95b9          9a760eaa05                     CALLF 0x0000:6916
1000:95be          57                             PUSH DI
1000:95bf          56                             PUSH SI
1000:95c0          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:95c4          26833e0e0009                   CMP word ptr ES:[0xe],0x9
1000:95ca          7509                           JNZ 0x1000:95d5
1000:95cc          b80100                         MOV AX,0x1
1000:95cf          5e                             POP SI
1000:95d0          5f                             POP DI
1000:95d1          8be5                           MOV SP,BP
1000:95d3          5d                             POP BP
1000:95d4          cb                             RETF
LAB_1000_95d5:
1000:95d5          803e180e00                     CMP byte ptr [0xe18],0x0
1000:95da          7509                           JNZ 0x1000:95e5
1000:95dc          2bc0                           SUB AX,AX
1000:95de          5e                             POP SI
1000:95df          5f                             POP DI
1000:95e0          8be5                           MOV SP,BP
1000:95e2          5d                             POP BP
1000:95e3          cb                             RETF
LAB_1000_95e5:
1000:95e5          c45e08                         LES BX,[BP + 0x8]
1000:95e8          268b4702                       MOV AX,word ptr ES:[BX + 0x2]
1000:95ec          8e069e0f                       MOV ES,word ptr [0xf9e]
1000:95f0          26a36b0b                       MOV ES:[0xb6b],AX
1000:95f4          8e460a                         MOV ES,word ptr [BP + 0xa]
1000:95f7          268b07                         MOV AX,word ptr ES:[BX]
1000:95fa          8e06a00f                       MOV ES,word ptr [0xfa0]
1000:95fe          26a36d0b                       MOV ES:[0xb6d],AX
1000:9602          c746e6760b                     MOV word ptr [BP + -0x1a],0xb76
1000:9607          c746e8aa05                     MOV word ptr [BP + -0x18],0x5aa
1000:960c          c746eea80b                     MOV word ptr [BP + -0x12],0xba8
1000:9611          c746f0aa05                     MOV word ptr [BP + -0x10],0x5aa
1000:9616          c746eada0b                     MOV word ptr [BP + -0x16],0xbda
1000:961b          c746ecaa05                     MOV word ptr [BP + -0x14],0x5aa
1000:9620          c646fe00                       MOV byte ptr [BP + -0x2],0x0
1000:9624          eb3f                           JMP 0x1000:9665
LAB_1000_9627:
1000:9627          8a46fe                         MOV AL,byte ptr [BP + -0x2]
1000:962a          2ae4                           SUB AH,AH
1000:962c          8bf0                           MOV SI,AX
1000:962e          8bde                           MOV BX,SI
1000:9630          d1e3                           SHL BX,0x1
1000:9632          d1e3                           SHL BX,0x1
1000:9634          c47e08                         LES DI,[BP + 0x8]
1000:9637          268b4102                       MOV AX,word ptr ES:[BX + DI + 0x2]
1000:963b          8bfe                           MOV DI,SI
1000:963d          d1e7                           SHL DI,0x1
1000:963f          c45ee6                         LES BX,[BP + -0x1a]
1000:9642          268901                         MOV word ptr ES:[BX + DI],AX
1000:9645          8a46fe                         MOV AL,byte ptr [BP + -0x2]
1000:9648          2ae4                           SUB AH,AH
1000:964a          8bf0                           MOV SI,AX
1000:964c          8bfe                           MOV DI,SI
1000:964e          d1e7                           SHL DI,0x1
1000:9650          d1e7                           SHL DI,0x1
1000:9652          c45e08                         LES BX,[BP + 0x8]
1000:9655          268b01                         MOV AX,word ptr ES:[BX + DI]
1000:9658          8bfe                           MOV DI,SI
1000:965a          d1e7                           SHL DI,0x1
1000:965c          c45eee                         LES BX,[BP + -0x12]
1000:965f          268901                         MOV word ptr ES:[BX + DI],AX
1000:9662          fe46fe                         INC byte ptr [BP + -0x2]
LAB_1000_9665:
1000:9665          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:9668          3846fe                         CMP byte ptr [BP + -0x2],AL
1000:966b          72ba                           JC 0x1000:9627
1000:966d          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9671          26833e0e0002                   CMP word ptr ES:[0xe],0x2
1000:9677          7539                           JNZ 0x1000:96b2
1000:9679          c646fe00                       MOV byte ptr [BP + -0x2],0x0
1000:967d          eb2b                           JMP 0x1000:96aa
LAB_1000_967f:
1000:967f          8a46fe                         MOV AL,byte ptr [BP + -0x2]
1000:9682          2ae4                           SUB AH,AH
1000:9684          8bf0                           MOV SI,AX
1000:9686          8bfe                           MOV DI,SI
1000:9688          d1e7                           SHL DI,0x1
1000:968a          d1e7                           SHL DI,0x1
1000:968c          c45e08                         LES BX,[BP + 0x8]
1000:968f          26ff7102                       PUSH word ptr ES:[BX + DI + 0x2]
1000:9693          26ff31                         PUSH word ptr ES:[BX + DI]
1000:9696          0e                             PUSH CS
1000:9697          e85f05                         CALL 0x1000:9bf9
1000:969a          83c404                         ADD SP,0x4
1000:969d          8bfe                           MOV DI,SI
1000:969f          d1e7                           SHL DI,0x1
1000:96a1          c45eea                         LES BX,[BP + -0x16]
1000:96a4          268901                         MOV word ptr ES:[BX + DI],AX
1000:96a7          fe46fe                         INC byte ptr [BP + -0x2]
LAB_1000_96aa:
1000:96aa          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:96ad          3846fe                         CMP byte ptr [BP + -0x2],AL
1000:96b0          72cd                           JC 0x1000:967f
LAB_1000_96b2:
1000:96b2          8e06a20f                       MOV ES,word ptr [0xfa2]
1000:96b6          8a4606                         MOV AL,byte ptr [BP + 0x6]
1000:96b9          26a20c0c                       MOV ES:[0xc0c],AL
1000:96bd          8e06a40f                       MOV ES,word ptr [0xfa4]
1000:96c1          26c6060d0c00                   MOV byte ptr ES:[0xc0d],0x0
1000:96c7          8e06a60f                       MOV ES,word ptr [0xfa6]
1000:96cb          26c6060e0c01                   MOV byte ptr ES:[0xc0e],0x1
1000:96d1          8e06a80f                       MOV ES,word ptr [0xfa8]
1000:96d5          26c606750b01                   MOV byte ptr ES:[0xb75],0x1
1000:96db          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:96df          26a10e00                       MOV AX,ES:[0xe]
1000:96e3          2d0100                         SUB AX,0x1
1000:96e6          3d0900                         CMP AX,0x9
1000:96e9          7603                           JBE 0x1000:96ee
1000:96eb          e90b01                         JMP 0x1000:97f9
LAB_1000_96ee:
1000:96ee          03c0                           ADD AX,AX
1000:96f0          93                             XCHG AX,BX
switchD_1000:96f1::switchD:
1000:96f1          2effa76a0a                     JMP word ptr CS:[BX + 0xa6a]
LAB_1000_97f9:
1000:97f9          5e                             POP SI
1000:97fa          5f                             POP DI
1000:97fb          8be5                           MOV SP,BP
1000:97fd          5d                             POP BP
1000:97fe          cb                             RETF
FUN_1000_97ff:
1000:97ff          55                             PUSH BP
1000:9800          8bec                           MOV BP,SP
1000:9802          b81a00                         MOV AX,0x1a
1000:9805          9a760eaa05                     CALLF 0x0000:6916
1000:980a          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:980e          26833e0e0009                   CMP word ptr ES:[0xe],0x9
1000:9814          7507                           JNZ 0x1000:981d
1000:9816          b80100                         MOV AX,0x1
1000:9819          8be5                           MOV SP,BP
1000:981b          5d                             POP BP
1000:981c          cb                             RETF
LAB_1000_981d:
1000:981d          803e180e00                     CMP byte ptr [0xe18],0x0
1000:9822          7507                           JNZ 0x1000:982b
1000:9824          2bc0                           SUB AX,AX
1000:9826          8be5                           MOV SP,BP
1000:9828          5d                             POP BP
1000:9829          cb                             RETF
LAB_1000_982b:
1000:982b          8e06a60f                       MOV ES,word ptr [0xfa6]
1000:982f          26c6060e0c00                   MOV byte ptr ES:[0xc0e],0x0
1000:9835          8e069e0f                       MOV ES,word ptr [0xf9e]
1000:9839          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:983c          26a36b0b                       MOV ES:[0xb6b],AX
1000:9840          8e06a00f                       MOV ES,word ptr [0xfa0]
1000:9844          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:9847          26a36d0b                       MOV ES:[0xb6d],AX
1000:984b          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:984f          26a10e00                       MOV AX,ES:[0xe]
1000:9853          2d0100                         SUB AX,0x1
1000:9856          3d0900                         CMP AX,0x9
1000:9859          7603                           JBE 0x1000:985e
1000:985b          e92301                         JMP 0x1000:9981
LAB_1000_985e:
1000:985e          03c0                           ADD AX,AX
1000:9860          93                             XCHG AX,BX
switchD_1000:9861::switchD:
1000:9861          2effa7f20b                     JMP word ptr CS:[BX + 0xbf2]
LAB_1000_9981:
1000:9981          8be5                           MOV SP,BP
1000:9983          5d                             POP BP
1000:9984          cb                             RETF
FUN_1000_9985:
1000:9985          55                             PUSH BP
1000:9986          8bec                           MOV BP,SP
1000:9988          b81a00                         MOV AX,0x1a
1000:998b          9a760eaa05                     CALLF 0x0000:6916
1000:9990          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9994          26833e0e0009                   CMP word ptr ES:[0xe],0x9
1000:999a          7507                           JNZ 0x1000:99a3
1000:999c          b80100                         MOV AX,0x1
1000:999f          8be5                           MOV SP,BP
1000:99a1          5d                             POP BP
1000:99a2          cb                             RETF
LAB_1000_99a3:
1000:99a3          803e180e00                     CMP byte ptr [0xe18],0x0
1000:99a8          7507                           JNZ 0x1000:99b1
1000:99aa          2bc0                           SUB AX,AX
1000:99ac          8be5                           MOV SP,BP
1000:99ae          5d                             POP BP
1000:99af          cb                             RETF
LAB_1000_99b1:
1000:99b1          8e06a60f                       MOV ES,word ptr [0xfa6]
1000:99b5          26c6060e0c00                   MOV byte ptr ES:[0xc0e],0x0
1000:99bb          8e069e0f                       MOV ES,word ptr [0xf9e]
1000:99bf          8b4608                         MOV AX,word ptr [BP + 0x8]
1000:99c2          26a36b0b                       MOV ES:[0xb6b],AX
1000:99c6          8e06a00f                       MOV ES,word ptr [0xfa0]
1000:99ca          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:99cd          26a36d0b                       MOV ES:[0xb6d],AX
1000:99d1          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:99d5          26a10e00                       MOV AX,ES:[0xe]
1000:99d9          2d0100                         SUB AX,0x1
1000:99dc          3d0900                         CMP AX,0x9
1000:99df          7603                           JBE 0x1000:99e4
1000:99e1          e94501                         JMP 0x1000:9b29
LAB_1000_99e4:
1000:99e4          03c0                           ADD AX,AX
1000:99e6          93                             XCHG AX,BX
switchD_1000:99e7::switchD:
1000:99e7          2effa79a0d                     JMP word ptr CS:[BX + 0xd9a]
switchD_1000:8905::caseD_5:
1000:9a50          16                             PUSH SS
1000:9a51          50                             PUSH AX
1000:9a52          8d46e6                         LEA AX,[BP + -0x1a]
1000:9a55          16                             PUSH SS
1000:9a56          50                             PUSH AX
1000:9a57          b81a00                         MOV AX,0x1a
1000:9a5a          50                             PUSH AX
1000:9a5b          9a5e19aa05                     CALLF 0x0000:73fe
1000:9a60          83c40a                         ADD SP,0xa
1000:9a63          c746e60085                     MOV word ptr [BP + -0x1a],0x8500
1000:9a68          8d46e6                         LEA AX,[BP + -0x1a]
1000:9a6b          16                             PUSH SS
1000:9a6c          50                             PUSH AX
1000:9a6d          8d46e6                         LEA AX,[BP + -0x1a]
1000:9a70          16                             PUSH SS
1000:9a71          50                             PUSH AX
1000:9a72          b81a00                         MOV AX,0x1a
1000:9a75          50                             PUSH AX
1000:9a76          9a5e19aa05                     CALLF 0x0000:73fe
1000:9a7b          83c40a                         ADD SP,0xa
1000:9a7e          c746e60084                     MOV word ptr [BP + -0x1a],0x8400
1000:9a83          8d46e6                         LEA AX,[BP + -0x1a]
1000:9a86          16                             PUSH SS
1000:9a87          50                             PUSH AX
1000:9a88          8d46e6                         LEA AX,[BP + -0x1a]
1000:9a8b          16                             PUSH SS
1000:9a8c          50                             PUSH AX
1000:9a8d          b81a00                         MOV AX,0x1a
1000:9a90          50                             PUSH AX
1000:9a91          9a5e19aa05                     CALLF 0x0000:73fe
1000:9a96          83c40a                         ADD SP,0xa
1000:9a99          c746e60683                     MOV word ptr [BP + -0x1a],0x8306
1000:9a9e          8e06a00f                       MOV ES,word ptr [0xfa0]
1000:9aa2          26a16d0b                       MOV AX,ES:[0xb6d]
1000:9aa6          8946e8                         MOV word ptr [BP + -0x18],AX
1000:9aa9          8146e81001                     ADD word ptr [BP + -0x18],0x110
1000:9aae          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:9ab1          8946ea                         MOV word ptr [BP + -0x16],AX
1000:9ab4          8e06980f                       MOV ES,word ptr [0xf98]
1000:9ab8          26a1170c                       MOV AX,ES:[0xc17]
1000:9abc          8946ec                         MOV word ptr [BP + -0x14],AX
1000:9abf          8e069e0f                       MOV ES,word ptr [0xf9e]
1000:9ac3          26a16b0b                       MOV AX,ES:[0xb6b]
1000:9ac7          8946f4                         MOV word ptr [BP + -0xc],AX
1000:9aca          8e06aa0f                       MOV ES,word ptr [0xfaa]
1000:9ace          26c606100c01                   MOV byte ptr ES:[0xc10],0x1
1000:9ad4          8e069e0f                       MOV ES,word ptr [0xf9e]
1000:9ad8          8e06ac0f                       MOV ES,word ptr [0xfac]
1000:9adc          26a3110c                       MOV ES:[0xc11],AX
1000:9ae0          8e06ae0f                       MOV ES,word ptr [0xfae]
1000:9ae4          8b46e8                         MOV AX,word ptr [BP + -0x18]
1000:9ae7          26a3130c                       MOV ES:[0xc13],AX
1000:9aeb          8e06b00f                       MOV ES,word ptr [0xfb0]
1000:9aef          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:9af2          26a3150c                       MOV ES:[0xc15],AX
1000:9af6          8d46f4                         LEA AX,[BP + -0xc]
1000:9af9          16                             PUSH SS
1000:9afa          50                             PUSH AX
1000:9afb          8d46e6                         LEA AX,[BP + -0x1a]
1000:9afe          16                             PUSH SS
1000:9aff          50                             PUSH AX
1000:9b00          8d46e6                         LEA AX,[BP + -0x1a]
1000:9b03          16                             PUSH SS
1000:9b04          50                             PUSH AX
1000:9b05          b81a00                         MOV AX,0x1a
1000:9b08          50                             PUSH AX
1000:9b09          9a4c1aaa05                     CALLF 0x0000:74ec
1000:9b0e          83c40e                         ADD SP,0xe
1000:9b11          8be5                           MOV SP,BP
1000:9b13          5d                             POP BP
1000:9b14          cb                             RETF
LAB_1000_9b29:
1000:9b29          8be5                           MOV SP,BP
1000:9b2b          5d                             POP BP
1000:9b2c          cb                             RETF
FUN_1000_9b2d:
1000:9b2d          55                             PUSH BP
1000:9b2e          8bec                           MOV BP,SP
1000:9b30          b81800                         MOV AX,0x18
1000:9b33          9a760eaa05                     CALLF 0x0000:6916
1000:9b38          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9b3c          26833e0e0009                   CMP word ptr ES:[0xe],0x9
1000:9b42          7503                           JNZ 0x1000:9b47
1000:9b44          e9ae00                         JMP 0x1000:9bf5
LAB_1000_9b47:
1000:9b47          803e180e00                     CMP byte ptr [0xe18],0x0
1000:9b4c          7445                           JZ 0x1000:9b93
1000:9b4e          8e06900f                       MOV ES,word ptr [0xf90]
1000:9b52          26c606740b00                   MOV byte ptr ES:[0xb74],0x0
1000:9b58          8e06a80f                       MOV ES,word ptr [0xfa8]
1000:9b5c          26c606750b00                   MOV byte ptr ES:[0xb75],0x0
1000:9b62          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9b66          26833e0e0002                   CMP word ptr ES:[0xe],0x2
1000:9b6c          7525                           JNZ 0x1000:9b93
1000:9b6e          8e06aa0f                       MOV ES,word ptr [0xfaa]
1000:9b72          26c606100c00                   MOV byte ptr ES:[0xc10],0x0
1000:9b78          c746e80084                     MOV word ptr [BP + -0x18],0x8400
1000:9b7d          8d46e8                         LEA AX,[BP + -0x18]
1000:9b80          16                             PUSH SS
1000:9b81          50                             PUSH AX
1000:9b82          8d46e8                         LEA AX,[BP + -0x18]
1000:9b85          16                             PUSH SS
1000:9b86          50                             PUSH AX
1000:9b87          b81a00                         MOV AX,0x1a
1000:9b8a          50                             PUSH AX
1000:9b8b          9a5e19aa05                     CALLF 0x0000:73fe
1000:9b90          83c40a                         ADD SP,0xa
LAB_1000_9b93:
1000:9b93          803e190e00                     CMP byte ptr [0xe19],0x0
1000:9b98          7437                           JZ 0x1000:9bd1
1000:9b9a          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9b9e          26833e0e0001                   CMP word ptr ES:[0xe],0x1
1000:9ba4          7408                           JZ 0x1000:9bae
1000:9ba6          26833e0e0003                   CMP word ptr ES:[0xe],0x3
1000:9bac          7523                           JNZ 0x1000:9bd1
LAB_1000_9bae:
1000:9bae          c746fe0000                     MOV word ptr [BP + -0x2],0x0
LAB_1000_9bb3:
1000:9bb3          ff76fe                         PUSH word ptr [BP + -0x2]
1000:9bb6          9ace033b08                     CALLF 0x0000:877e
1000:9bbb          83c402                         ADD SP,0x2
1000:9bbe          ff46fe                         INC word ptr [BP + -0x2]
1000:9bc1          837efe0b                       CMP word ptr [BP + -0x2],0xb
1000:9bc5          7cec                           JL 0x1000:9bb3
1000:9bc7          8e06920f                       MOV ES,word ptr [0xf92]
1000:9bcb          26c606130000                   MOV byte ptr ES:[0x13],0x0
LAB_1000_9bd1:
1000:9bd1          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9bd5          26833e0e0004                   CMP word ptr ES:[0xe],0x4
1000:9bdb          7408                           JZ 0x1000:9be5
1000:9bdd          26833e0e0005                   CMP word ptr ES:[0xe],0x5
1000:9be3          7510                           JNZ 0x1000:9bf5
LAB_1000_9be5:
1000:9be5          b8a600                         MOV AX,0xa6
1000:9be8          50                             PUSH AX
1000:9be9          b84300                         MOV AX,0x43
1000:9bec          50                             PUSH AX
1000:9bed          9af21aaa05                     CALLF 0x0000:7592
1000:9bf2          83c404                         ADD SP,0x4
LAB_1000_9bf5:
1000:9bf5          8be5                           MOV SP,BP
1000:9bf7          5d                             POP BP
1000:9bf8          cb                             RETF
FUN_1000_9bf9:
1000:9bf9          55                             PUSH BP
1000:9bfa          8bec                           MOV BP,SP
1000:9bfc          b80600                         MOV AX,0x6
1000:9bff          9a760eaa05                     CALLF 0x0000:6916
1000:9c04          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:9c07          8b5608                         MOV DX,word ptr [BP + 0x8]
1000:9c0a          8946fc                         MOV word ptr [BP + -0x4],AX
1000:9c0d          8956fe                         MOV word ptr [BP + -0x2],DX
1000:9c10          c45efc                         LES BX,[BP + -0x4]
1000:9c13          268b470a                       MOV AX,word ptr ES:[BX + 0xa]
1000:9c17          8be5                           MOV SP,BP
1000:9c19          5d                             POP BP
1000:9c1a          cb                             RETF
FUN_1000_9c1b:
1000:9c1b          55                             PUSH BP
1000:9c1c          8bec                           MOV BP,SP
1000:9c1e          b80200                         MOV AX,0x2
1000:9c21          9a760eaa05                     CALLF 0x0000:6916
1000:9c26          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9c2a          26a10e00                       MOV AX,ES:[0xe]
1000:9c2e          3d0100                         CMP AX,0x1
1000:9c31          7418                           JZ 0x1000:9c4b
1000:9c33          3d0200                         CMP AX,0x2
1000:9c36          7503                           JNZ 0x1000:9c3b
1000:9c38          e98c00                         JMP 0x1000:9cc7
LAB_1000_9c3b:
1000:9c3b          3d0300                         CMP AX,0x3
1000:9c3e          7471                           JZ 0x1000:9cb1
1000:9c40          3d0a00                         CMP AX,0xa
1000:9c43          7503                           JNZ 0x1000:9c48
1000:9c45          e9a500                         JMP 0x1000:9ced
LAB_1000_9c48:
1000:9c48          eb77                           JMP 0x1000:9cc1
LAB_1000_9c4b:
1000:9c4b          b82002                         MOV AX,0x220
1000:9c4e          50                             PUSH AX
1000:9c4f          0e                             PUSH CS
1000:9c50          e8fe00                         CALL 0x1000:9d51
1000:9c53          83c402                         ADD SP,0x2
1000:9c56          0bc0                           OR AX,AX
1000:9c58          7407                           JZ 0x1000:9c61
LAB_1000_9c5a:
1000:9c5a          b80100                         MOV AX,0x1
1000:9c5d          8be5                           MOV SP,BP
1000:9c5f          5d                             POP BP
1000:9c60          cb                             RETF
LAB_1000_9c61:
1000:9c61          b81002                         MOV AX,0x210
1000:9c64          50                             PUSH AX
1000:9c65          0e                             PUSH CS
1000:9c66          e8e800                         CALL 0x1000:9d51
1000:9c69          83c402                         ADD SP,0x2
1000:9c6c          0bc0                           OR AX,AX
1000:9c6e          75ea                           JNZ 0x1000:9c5a
1000:9c70          b83002                         MOV AX,0x230
1000:9c73          50                             PUSH AX
1000:9c74          0e                             PUSH CS
1000:9c75          e8d900                         CALL 0x1000:9d51
1000:9c78          83c402                         ADD SP,0x2
1000:9c7b          0bc0                           OR AX,AX
1000:9c7d          75db                           JNZ 0x1000:9c5a
1000:9c7f          b84002                         MOV AX,0x240
1000:9c82          50                             PUSH AX
1000:9c83          0e                             PUSH CS
1000:9c84          e8ca00                         CALL 0x1000:9d51
1000:9c87          83c402                         ADD SP,0x2
1000:9c8a          0bc0                           OR AX,AX
1000:9c8c          75cc                           JNZ 0x1000:9c5a
1000:9c8e          b85002                         MOV AX,0x250
1000:9c91          50                             PUSH AX
1000:9c92          0e                             PUSH CS
1000:9c93          e8bb00                         CALL 0x1000:9d51
1000:9c96          83c402                         ADD SP,0x2
1000:9c99          0bc0                           OR AX,AX
1000:9c9b          75bd                           JNZ 0x1000:9c5a
1000:9c9d          b86002                         MOV AX,0x260
1000:9ca0          50                             PUSH AX
1000:9ca1          0e                             PUSH CS
1000:9ca2          e8ac00                         CALL 0x1000:9d51
1000:9ca5          83c402                         ADD SP,0x2
1000:9ca8          0bc0                           OR AX,AX
1000:9caa          7503                           JNZ 0x1000:9caf
1000:9cac          e99e00                         JMP 0x1000:9d4d
LAB_1000_9caf:
1000:9caf          eba9                           JMP 0x1000:9c5a
LAB_1000_9cb1:
1000:9cb1          b88803                         MOV AX,0x388
1000:9cb4          50                             PUSH AX
1000:9cb5          9a0c003b08                     CALLF 0x0000:83bc
1000:9cba          83c402                         ADD SP,0x2
1000:9cbd          0bc0                           OR AX,AX
1000:9cbf          7599                           JNZ 0x1000:9c5a
LAB_1000_9cc1:
1000:9cc1          2bc0                           SUB AX,AX
1000:9cc3          8be5                           MOV SP,BP
1000:9cc5          5d                             POP BP
1000:9cc6          cb                             RETF
LAB_1000_9cc7:
1000:9cc7          9a1008aa05                     CALLF 0x0000:62b0
1000:9ccc          8e06b20f                       MOV ES,word ptr [0xfb2]
1000:9cd0          26803e0f0c00                   CMP byte ptr ES:[0xc0f],0x0
1000:9cd6          7582                           JNZ 0x1000:9c5a
1000:9cd8          9a4108aa05                     CALLF 0x0000:62e1
1000:9cdd          8e06b20f                       MOV ES,word ptr [0xfb2]
1000:9ce1          26803e0f0c00                   CMP byte ptr ES:[0xc0f],0x0
LAB_1000_9ce7:
1000:9ce7          74d8                           JZ 0x1000:9cc1
1000:9ce9          e96eff                         JMP 0x1000:9c5a
LAB_1000_9ced:
1000:9ced          b80a00                         MOV AX,0xa
1000:9cf0          50                             PUSH AX
1000:9cf1          b80402                         MOV AX,0x204
1000:9cf4          50                             PUSH AX
1000:9cf5          9af21aaa05                     CALLF 0x0000:7592
1000:9cfa          83c404                         ADD SP,0x4
1000:9cfd          b85500                         MOV AX,0x55
1000:9d00          50                             PUSH AX
1000:9d01          b80302                         MOV AX,0x203
1000:9d04          50                             PUSH AX
1000:9d05          9af21aaa05                     CALLF 0x0000:7592
1000:9d0a          83c404                         ADD SP,0x4
1000:9d0d          b80202                         MOV AX,0x202
1000:9d10          50                             PUSH AX
1000:9d11          9ae41aaa05                     CALLF 0x0000:7584
1000:9d16          83c402                         ADD SP,0x2
1000:9d19          a808                           TEST AL,0x8
1000:9d1b          75a4                           JNZ 0x1000:9cc1
1000:9d1d          c746fe0000                     MOV word ptr [BP + -0x2],0x0
LAB_1000_9d22:
1000:9d22          b88000                         MOV AX,0x80
1000:9d25          50                             PUSH AX
1000:9d26          b80002                         MOV AX,0x200
1000:9d29          50                             PUSH AX
1000:9d2a          9af21aaa05                     CALLF 0x0000:7592
1000:9d2f          83c404                         ADD SP,0x4
1000:9d32          ff46fe                         INC word ptr [BP + -0x2]
1000:9d35          817efeb80b                     CMP word ptr [BP + -0x2],0xbb8
1000:9d3a          7ce6                           JL 0x1000:9d22
1000:9d3c          b80202                         MOV AX,0x202
1000:9d3f          50                             PUSH AX
1000:9d40          9ae41aaa05                     CALLF 0x0000:7584
1000:9d45          83c402                         ADD SP,0x2
1000:9d48          a808                           TEST AL,0x8
1000:9d4a          eb9b                           JMP 0x1000:9ce7
LAB_1000_9d4d:
1000:9d4d          8be5                           MOV SP,BP
1000:9d4f          5d                             POP BP
1000:9d50          cb                             RETF
FUN_1000_9d51:
1000:9d51          55                             PUSH BP
1000:9d52          8bec                           MOV BP,SP
1000:9d54          b80c00                         MOV AX,0xc
1000:9d57          9a760eaa05                     CALLF 0x0000:6916
1000:9d5c          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:9d5f          050600                         ADD AX,0x6
FUN_1000_9d62:
1000:9d62          8946f4                         MOV word ptr [BP + -0xc],AX
1000:9d65          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:9d68          050e00                         ADD AX,0xe
1000:9d6b          8946f6                         MOV word ptr [BP + -0xa],AX
1000:9d6e          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:9d71          050a00                         ADD AX,0xa
1000:9d74          8946fa                         MOV word ptr [BP + -0x6],AX
1000:9d77          8b4606                         MOV AX,word ptr [BP + 0x6]
1000:9d7a          050c00                         ADD AX,0xc
1000:9d7d          8946f8                         MOV word ptr [BP + -0x8],AX
1000:9d80          b8ff00                         MOV AX,0xff
1000:9d83          50                             PUSH AX
1000:9d84          ff76f4                         PUSH word ptr [BP + -0xc]
1000:9d87          9af21aaa05                     CALLF 0x0000:7592
1000:9d8c          83c404                         ADD SP,0x4
1000:9d8f          c746fc0000                     MOV word ptr [BP + -0x4],0x0
LAB_1000_9d94:
1000:9d94          ff76f6                         PUSH word ptr [BP + -0xa]
1000:9d97          9ae41aaa05                     CALLF 0x0000:7584
1000:9d9c          83c402                         ADD SP,0x2
1000:9d9f          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9da2          f646fe7f                       TEST byte ptr [BP + -0x2],0x7f
1000:9da6          7441                           JZ 0x1000:9de9
1000:9da8          2bc0                           SUB AX,AX
1000:9daa          50                             PUSH AX
1000:9dab          ff76f4                         PUSH word ptr [BP + -0xc]
1000:9dae          9af21aaa05                     CALLF 0x0000:7592
1000:9db3          83c404                         ADD SP,0x4
1000:9db6          c746fc0000                     MOV word ptr [BP + -0x4],0x0
LAB_1000_9dbb:
1000:9dbb          ff76f6                         PUSH word ptr [BP + -0xa]
1000:9dbe          9ae41aaa05                     CALLF 0x0000:7584
1000:9dc3          83c402                         ADD SP,0x2
1000:9dc6          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9dc9          f646fe7f                       TEST byte ptr [BP + -0x2],0x7f
1000:9dcd          742a                           JZ 0x1000:9df9
1000:9dcf          ff76fa                         PUSH word ptr [BP + -0x6]
1000:9dd2          9ae41aaa05                     CALLF 0x0000:7584
1000:9dd7          83c402                         ADD SP,0x2
1000:9dda          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9ddd          3daa00                         CMP AX,0xaa
1000:9de0          7511                           JNZ 0x1000:9df3
1000:9de2          c746fc0000                     MOV word ptr [BP + -0x4],0x0
1000:9de7          eb1f                           JMP 0x1000:9e08
LAB_1000_9de9:
1000:9de9          ff46fc                         INC word ptr [BP + -0x4]
1000:9dec          817efc1027                     CMP word ptr [BP + -0x4],0x2710
1000:9df1          75a1                           JNZ 0x1000:9d94
LAB_1000_9df3:
1000:9df3          2bc0                           SUB AX,AX
1000:9df5          8be5                           MOV SP,BP
1000:9df7          5d                             POP BP
1000:9df8          cb                             RETF
LAB_1000_9df9:
1000:9df9          ff46fc                         INC word ptr [BP + -0x4]
1000:9dfc          817efc1027                     CMP word ptr [BP + -0x4],0x2710
1000:9e01          75b8                           JNZ 0x1000:9dbb
1000:9e03          ebee                           JMP 0x1000:9df3
LAB_1000_9e05:
1000:9e05          ff46fc                         INC word ptr [BP + -0x4]
LAB_1000_9e08:
1000:9e08          817efc3075                     CMP word ptr [BP + -0x4],0x7530
1000:9e0d          7d14                           JGE 0x1000:9e23
1000:9e0f          ff76f8                         PUSH word ptr [BP + -0x8]
1000:9e12          9ae41aaa05                     CALLF 0x0000:7584
1000:9e17          83c402                         ADD SP,0x2
1000:9e1a          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9e1d          f646fe80                       TEST byte ptr [BP + -0x2],0x80
1000:9e21          75e2                           JNZ 0x1000:9e05
LAB_1000_9e23:
1000:9e23          b8d100                         MOV AX,0xd1
1000:9e26          50                             PUSH AX
1000:9e27          ff76f8                         PUSH word ptr [BP + -0x8]
1000:9e2a          9af21aaa05                     CALLF 0x0000:7592
1000:9e2f          83c404                         ADD SP,0x4
1000:9e32          c746fc0000                     MOV word ptr [BP + -0x4],0x0
1000:9e37          eb03                           JMP 0x1000:9e3c
LAB_1000_9e39:
1000:9e39          ff46fc                         INC word ptr [BP + -0x4]
LAB_1000_9e3c:
1000:9e3c          817efc3075                     CMP word ptr [BP + -0x4],0x7530
1000:9e41          7d14                           JGE 0x1000:9e57
1000:9e43          ff76f8                         PUSH word ptr [BP + -0x8]
1000:9e46          9ae41aaa05                     CALLF 0x0000:7584
1000:9e4b          83c402                         ADD SP,0x2
1000:9e4e          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9e51          f646fe80                       TEST byte ptr [BP + -0x2],0x80
1000:9e55          75e2                           JNZ 0x1000:9e39
LAB_1000_9e57:
1000:9e57          b8d000                         MOV AX,0xd0
1000:9e5a          50                             PUSH AX
1000:9e5b          ff76f8                         PUSH word ptr [BP + -0x8]
1000:9e5e          9af21aaa05                     CALLF 0x0000:7592
1000:9e63          83c404                         ADD SP,0x4
1000:9e66          8e06960f                       MOV ES,word ptr [0xf96]
1000:9e6a          8b46f8                         MOV AX,word ptr [BP + -0x8]
1000:9e6d          2d0c00                         SUB AX,0xc
1000:9e70          26a3690b                       MOV ES:[0xb69],AX
1000:9e74          b80100                         MOV AX,0x1
1000:9e77          8be5                           MOV SP,BP
1000:9e79          5d                             POP BP
1000:9e7a          cb                             RETF
FUN_1000_9e7b:
1000:9e7b          55                             PUSH BP
1000:9e7c          8bec                           MOV BP,SP
1000:9e7e          b80200                         MOV AX,0x2
1000:9e81          9a760eaa05                     CALLF 0x0000:6916
1000:9e86          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9e8a          26c7060e000100                 MOV word ptr ES:[0xe],0x1
1000:9e91          0e                             PUSH CS
1000:9e92          e886fd                         CALL 0x1000:9c1b
1000:9e95          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9e98          0bc0                           OR AX,AX
1000:9e9a          7407                           JZ 0x1000:9ea3
LAB_1000_9e9c:
1000:9e9c          b80100                         MOV AX,0x1
1000:9e9f          8be5                           MOV SP,BP
1000:9ea1          5d                             POP BP
1000:9ea2          cb                             RETF
LAB_1000_9ea3:
1000:9ea3          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9ea7          26c7060e000100                 MOV word ptr ES:[0xe],0x1
1000:9eae          0e                             PUSH CS
1000:9eaf          e869fd                         CALL 0x1000:9c1b
1000:9eb2          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9eb5          0bc0                           OR AX,AX
1000:9eb7          75e3                           JNZ 0x1000:9e9c
1000:9eb9          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9ebd          26c7060e000300                 MOV word ptr ES:[0xe],0x3
1000:9ec4          0e                             PUSH CS
1000:9ec5          e853fd                         CALL 0x1000:9c1b
1000:9ec8          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9ecb          0bc0                           OR AX,AX
1000:9ecd          7408                           JZ 0x1000:9ed7
1000:9ecf          b80300                         MOV AX,0x3
1000:9ed2          8be5                           MOV SP,BP
1000:9ed4          5d                             POP BP
1000:9ed5          cb                             RETF
LAB_1000_9ed7:
1000:9ed7          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9edb          26c7060e000200                 MOV word ptr ES:[0xe],0x2
1000:9ee2          0e                             PUSH CS
1000:9ee3          e835fd                         CALL 0x1000:9c1b
1000:9ee6          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9ee9          0bc0                           OR AX,AX
1000:9eeb          7408                           JZ 0x1000:9ef5
1000:9eed          b80200                         MOV AX,0x2
1000:9ef0          8be5                           MOV SP,BP
1000:9ef2          5d                             POP BP
1000:9ef3          cb                             RETF
LAB_1000_9ef5:
1000:9ef5          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9ef9          26c7060e000a00                 MOV word ptr ES:[0xe],0xa
1000:9f00          0e                             PUSH CS
1000:9f01          e817fd                         CALL 0x1000:9c1b
1000:9f04          8946fe                         MOV word ptr [BP + -0x2],AX
1000:9f07          0bc0                           OR AX,AX
1000:9f09          7408                           JZ 0x1000:9f13
1000:9f0b          b80a00                         MOV AX,0xa
1000:9f0e          8be5                           MOV SP,BP
1000:9f10          5d                             POP BP
1000:9f11          cb                             RETF
LAB_1000_9f13:
1000:9f13          8e068e0f                       MOV ES,word ptr [0xf8e]
1000:9f17          26c7060e000400                 MOV word ptr ES:[0xe],0x4
1000:9f1e          b80400                         MOV AX,0x4
1000:9f21          8be5                           MOV SP,BP
1000:9f23          5d                             POP BP
1000:9f24          cb                             RETF
switchD_1000:8905::caseD_f:
1000:a028          0000                           ADD byte ptr [BX + SI],AL
1000:a02a          0000                           ADD byte ptr [BX + SI],AL
1000:a02c          0000                           ADD byte ptr [BX + SI],AL
1000:a02e          0300                           ADD AX,word ptr [BX + SI]
1000:a030          7301                           JNC 0x1000:a033
1000:a032          0e                             PUSH CS
LAB_1000_a033:
1000:a033          0200                           ADD AL,byte ptr [BX + SI]
1000:a035          0000                           ADD byte ptr [BX + SI],AL
1000:a037          0000                           ADD byte ptr [BX + SI],AL
1000:a039          0004                           ADD byte ptr [SI],AL
1000:a03b          00800179                       ADD byte ptr [BX + SI + 0x7901],AL
1000:a03f          0200                           ADD AL,byte ptr [BX + SI]
1000:a041          0000                           ADD byte ptr [BX + SI],AL
1000:a043          0000                           ADD byte ptr [BX + SI],AL
1000:a045          0005                           ADD byte ptr [DI],AL
1000:a047          204420                         AND byte ptr [SI + 0x20],AL
1000:a04a          07                             POP ES
1000:a04b          2000                           AND byte ptr [BX + SI],AL
1000:a04d          0820                           OR byte ptr [BX + SI],AH
1000:a04f          47                             INC DI
1000:a050          61                             POPA
1000:a051          6d                             INSW ES:DI,DX
1000:a052          652008                         AND byte ptr GS:[BX + SI],CL
1000:a055          2000                           AND byte ptr [BX + SI],AL
1000:a057          0b20                           OR SP,word ptr [BX + SI]
1000:a059          4f                             DEC DI
1000:a05a          7074                           JO 0x1000:a0d0
1000:a05c          696f6e7320                     IMUL BP,word ptr [BX + 0x6e],0x2073
1000:a061          0a20                           OR AH,byte ptr [BX + SI]
1000:a063          0008                           ADD byte ptr [BX + SI],CL
1000:a065          20496e                         AND byte ptr [BX + DI + 0x6e],CL
1000:a068          666f                           OUTSD DX,SI
1000:a06a          200c                           AND byte ptr [SI],CL
1000:a06c          2000                           AND byte ptr [BX + SI],AL
1000:a06e          015b00                         ADD word ptr [BP + DI + 0x0],BX
1000:a071          b200                           MOV DL,0x0
1000:a073          0900                           OR word ptr [BX + SI],AX
1000:a075          b096                           MOV AL,0x96
1000:a077          0109                           ADD word ptr [BX + DI],CX
1000:a079          41                             INC CX
1000:a07a          626f75                         BOUND BP,word ptr [BX + 0x75]
1000:a07d          7420                           JZ 0x1000:a09f
1000:a07f          2e2e2e0004                     ADD byte ptr CS:[SI],AL
1000:a084          0e                             PUSH CS
1000:a085          00b20009                       ADD byte ptr [BP + SI + 0x900],DH
1000:a089          00b0bf01                       ADD byte ptr [BX + SI + 0x1bf],DH
1000:a08d          0000                           ADD byte ptr [BX + SI],AL
1000:a08f          0000                           ADD byte ptr [BX + SI],AL
1000:a091          d301                           ROL word ptr [BX + DI],CL
1000:a093          0000                           ADD byte ptr [BX + SI],AL
1000:a095          0000                           ADD byte ptr [BX + SI],AL
1000:a097          e80100                         CALL 0x1000:a09b
1000:a09a          0000                           ADD byte ptr [BX + SI],AL
1000:a09c          00fb                           ADD BL,BH
LAB_1000_a09f:
1000:a09f          124173                         ADC AL,byte ptr [BX + DI + 0x73]
1000:a0a2          7369                           JNC 0x1000:a10d
1000:a0a4          676e                           OUTSB DX,ESI
1000:a0a6          6d                             INSW ES:DI,DX
1000:a0a7          656e                           OUTSB DX,GS:SI
1000:a0a9          741c                           JZ 0x1000:a0c7
1000:a0ab          1c1c                           SBB AL,0x1c
1000:a0ad          1c05                           SBB AL,0x5
1000:a0af          055e41                         ADD AX,0x415e
1000:a0b2          0013                           ADD byte ptr [BP + DI],DL
1000:a0b4          54                             PUSH SP
1000:a0b5          7261                           JC 0x1000:a118
1000:a0b7          7665                           JBE 0x1000:a11e
1000:a0b9          6c                             INSB ES:DI,DX
1000:a0ba          204974                         AND byte ptr [BX + DI + 0x74],CL
1000:a0bd          696e657261                     IMUL BP,word ptr [BP + 0x65],0x6172
1000:a0c2          7279                           JC 0x1000:a13d
1000:a0c4          205e58                         AND byte ptr [BP + 0x58],BL
LAB_1000_a0c7:
1000:a0c7          0011                           ADD byte ptr [BX + DI],DL
1000:a0c9          53                             PUSH BX
1000:a0ca          7461                           JZ 0x1000:a12d
1000:a0cc          7475                           JZ 0x1000:a143
1000:a0ce          731c                           JNC 0x1000:a0ec
LAB_1000_a0d0:
1000:a0d0          1c1c                           SBB AL,0x1c
1000:a0d2          1c1c                           SBB AL,0x1c
1000:a0d4          1c1c                           SBB AL,0x1c
1000:a0d6          2005                           AND byte ptr [DI],AL
1000:a0d8          5e                             POP SI
1000:a0d9          53                             PUSH BX
1000:a0da          0011                           ADD byte ptr [BX + DI],DL
1000:a0dc          45                             INC BP
1000:a0dd          7869                           JS 0x1000:a148
1000:a0df          7455                           JZ 0x1000:a136
1000:a0e1          00b21c09                       ADD byte ptr [BP + SI + 0x91c],DH
1000:a0e5          00b02005                       ADD byte ptr [BX + SI + 0x520],DH
1000:a0e9          5e                             POP SI
1000:a0ea          51                             PUSH CX
1000:a0eb          0003                           ADD byte ptr [BP + DI],AL
1000:a0ed          06                             PUSH ES
1000:a0ee          00b20009                       ADD byte ptr [BP + SI + 0x900],DH
1000:a0f2          00b02c02                       ADD byte ptr [BX + SI + 0x22c],DH
1000:a0f6          0000                           ADD byte ptr [BX + SI],AL
1000:a0f8          0000                           ADD byte ptr [BX + SI],AL
1000:a0fa          40                             INC AX
1000:a0fb          0200                           ADD AL,byte ptr [BX + SI]
1000:a0fd          0000                           ADD byte ptr [BX + SI],AL
1000:a0ff          006202                         ADD byte ptr [BP + SI + 0x2],AH
1000:a102          0000                           ADD byte ptr [BX + SI],AL
1000:a104          0000                           ADD byte ptr [BX + SI],AL
1000:a106          55                             PUSH BP
1000:a107          0212                           ADD DL,byte ptr [BP + SI]
1000:a109          53                             PUSH BX
1000:a10a          6f                             OUTSW DX,SI
1000:a10b          756e                           JNZ 0x1000:a17b
LAB_1000_a10d:
1000:a10d          641a00                         SBB AL,byte ptr FS:[BX + SI]
1000:a110          b21c                           MOV DL,0x1c
1000:a112          0a00                           OR AL,byte ptr [BX + SI]
1000:a114          b005                           MOV AL,0x5
1000:a116          5e                             POP SI
1000:a117          52                             PUSH DX
LAB_1000_a118:
1000:a118          0013                           ADD byte ptr [BP + DI],DL
1000:a11a          4d                             DEC BP
1000:a11b          7573                           JNZ 0x1000:a190
1000:a11d          69630a00b2                     IMUL SP,word ptr [BP + DI + 0xa],-0x4e00
1000:a122          1c0a                           SBB AL,0xa
1000:a124          00b02005                       ADD byte ptr [BX + SI + 0x520],DH
1000:a128          5e                             POP SI
1000:a129          57                             PUSH DI
1000:a12a          000b                           ADD byte ptr [BP + DI],CL
1000:a12c          4d                             DEC BP
LAB_1000_a12d:
1000:a12d          656d                           INSW ES:DI,DX
1000:a12f          6f                             OUTSW DX,SI
1000:a130          7279                           JC 0x1000:a1ab
1000:a132          205465                         AND byte ptr [SI + 0x65],DL
1000:a135          7374                           JNC 0x1000:a1ab
1000:a137          0015                           ADD byte ptr [DI],DL
1000:a139          53                             PUSH BX
1000:a13a          61                             POPA
1000:a13b          7665                           JBE 0x1000:a1a2
LAB_1000_a13d:
1000:a13d          204d65                         AND byte ptr [DI + 0x65],CL
1000:a140          6e                             OUTSB DX,SI
1000:a141          7520                           JNZ 0x1000:a163
LAB_1000_a143:
1000:a143          44                             INC SP
1000:a144          656661                         POPAD
1000:a147          756c                           JNZ 0x1000:a1b5
1000:a149          7473                           JZ 0x1000:a1be
1000:a14b          205e47                         AND byte ptr [BP + 0x47],BL
1000:a14e          0005                           ADD byte ptr [DI],AL
1000:a150          2a00                           SUB AL,byte ptr [BX + SI]
1000:a152          b200                           MOV DL,0x0
1000:a154          0900                           OR word ptr [BX + SI],AX
1000:a156          b09d                           MOV AL,0x9d
1000:a158          0200                           ADD AL,byte ptr [BX + SI]
1000:a15a          0000                           ADD byte ptr [BX + SI],AL
1000:a15c          00dd                           ADD CH,BL
1000:a15e          0200                           ADD AL,byte ptr [BX + SI]
1000:a160          0000                           ADD byte ptr [BX + SI],AL
1000:a162          00f2                           ADD DL,DH
1000:a164          0200                           ADD AL,byte ptr [BX + SI]
1000:a166          0000                           ADD byte ptr [BX + SI],AL
1000:a168          00b40200                       ADD byte ptr [SI + 0x2],DH
1000:a16c          0000                           ADD byte ptr [BX + SI],AL
1000:a16e          00c7                           ADD BH,AL
1000:a170          0215                           ADD DL,byte ptr [DI]
1000:a172          44                             INC SP
1000:a173          6961626f6c                     IMUL SP,word ptr [BX + DI + 0x62],0x6c6f
1000:a178          6963616c73                     IMUL SP,word ptr [BP + DI + 0x61],0x736c
1000:a17d          1c1c                           SBB AL,0x1c
1000:a17f          1c1c                           SBB AL,0x1c
1000:a181          050505                         ADD AX,0x505
1000:a184          1c5e                           SBB AL,0x5e
1000:a186          44                             INC SP
1000:a187          0011                           ADD byte ptr [BX + DI],DL
1000:a189          43                             INC BX
1000:a18a          68726f                         PUSH 0x6f72
1000:a18d          6e                             OUTSB DX,SI
1000:a18e          6f                             OUTSW DX,SI
1000:a18f          6d                             INSW ES:DI,DX
LAB_1000_a190:
1000:a190          657465                         JZ 0x1000:a1f8
1000:a193          721c                           JC 0x1000:a1b1
1000:a195          1c1c                           SBB AL,0x1c
1000:a197          055e43                         ADD AX,0x435e
1000:a19a          0014                           ADD byte ptr [SI],DL
1000:a19c          54                             PUSH SP
1000:a19d          696d657461                     IMUL BP,word ptr [DI + 0x65],0x6174
LAB_1000_a1a2:
1000:a1a2          626c65                         BOUND BP,word ptr [SI + 0x65]
1000:a1a5          1c1c                           SBB AL,0x1c
1000:a1a7          1c1c                           SBB AL,0x1c
1000:a1a9          1c20                           SBB AL,0x20
LAB_1000_a1ab:
1000:a1ab          050505                         ADD AX,0x505
1000:a1ae          5e                             POP SI
1000:a1af          54                             PUSH SP
1000:a1b0          0013                           ADD byte ptr [BP + DI],DL
1000:a1b2          4e                             DEC SI
1000:a1b3          6f                             OUTSW DX,SI
1000:a1b4          7465                           JZ 0x1000:a21b
1000:a1b6          626f6f                         BOUND BP,word ptr [BX + 0x6f]
1000:a1b9          6b2049                         IMUL SP,word ptr [BX + SI],0x49
1000:a1bc          6e                             OUTSB DX,SI
1000:a1bd          666f                           OUTSD DX,SI
1000:a1bf          2e2020                         AND byte ptr CS:[BX + SI],AH
1000:a1c2          1c5e                           SBB AL,0x5e
1000:a1c4          4e                             DEC SI
1000:a1c5          0013                           ADD byte ptr [BP + DI],DL
1000:a1c7          42                             INC DX
1000:a1c8          7269                           JC 0x1000:a233
1000:a1ca          6566636173                     ARPL word ptr GS:[BX + DI + 0x73],SP
1000:a1cf          6520496e                       AND byte ptr GS:[BX + DI + 0x6e],CL
1000:a1d3          666f                           OUTSD DX,SI
1000:a1d5          2e1c20                         SBB AL,0x20
1000:a1d8          5e                             POP SI
1000:a1d9          42                             INC DX
1000:a1da          8300b2                         ADD word ptr [BX + SI],-0x4e
1000:a1dd          000a                           ADD byte ptr [BP + SI],CL
1000:a1df          00b0a11e                       ADD byte ptr [BX + SI + 0x1ea1],DH
1000:a1e3          018ec08b                       ADD word ptr [BP + 0x8bc0],CX
1000:a1e7          361801                         SBB byte ptr SS:[BX + DI],AL
1000:a1ea          268a04                         MOV AL,byte ptr ES:[SI]
1000:a1ed          2ea2349c                       MOV CS:[0x9c34],AL
1000:a1f1          c3                             RET
LAB_1000_a1f8:
1000:a1f8          19c7                           SBB DI,AX
1000:a1fa          06                             PUSH ES
1000:a1fb          51                             PUSH CX
1000:a1fc          0300                           ADD AX,word ptr [BX + SI]
1000:a1fe          00833ea2                       ADD byte ptr [BP + DI + 0xa23e],AL
1000:a202          06                             PUSH ES
1000:a203          05740d                         ADD AX,0xd74
1000:a206          b80200                         MOV AX,0x2
1000:a209          bb0000                         MOV BX,0x0
1000:a20c          8bcb                           MOV CX,BX
1000:a20e          8bd3                           MOV DX,BX
1000:a210          cd33                           INT 0x33
1000:a212          c3                             RET
LAB_1000_a21b:
1000:a21b          c70651030100                   MOV word ptr [0x351],0x1
1000:a221          c3                             RET
LAB_1000_a233:
1000:a233          01bb0000                       ADD word ptr [BP + DI + 0x0],DI
1000:a237          8bcb                           MOV CX,BX
1000:a239          b80900                         MOV AX,0x9
1000:a23c          268b5c40                       MOV BX,word ptr ES:[SI + 0x40]
1000:a240          268b4c42                       MOV CX,word ptr ES:[SI + 0x42]
1000:a244          8bd6                           MOV DX,SI
1000:a246          cd33                           INT 0x33
1000:a248          c3                             RET
switchD_1000:99e7::caseD_5:
1000:a326          00c3                           ADD BL,AL
1000:a328          32db                           XOR BL,BL
1000:a32a          ec                             IN AL,DX
1000:a32b          2480                           AND AL,0x80
1000:a32d          8ae0                           MOV AH,AL
1000:a32f          b90080                         MOV CX,0x8000
LAB_1000_a332:
1000:a332          ec                             IN AL,DX
1000:a333          2480                           AND AL,0x80
1000:a335          3ac4                           CMP AL,AH
1000:a337          7407                           JZ 0x1000:a340
1000:a339          fec3                           INC BL
1000:a33b          80fb19                         CMP BL,0x19
1000:a33e          7709                           JA 0x1000:a349
LAB_1000_a340:
1000:a340          e2f0                           LOOP 0x1000:a332
1000:a342          c70612010000                   MOV word ptr [0x112],0x0
1000:a348          c3                             RET
LAB_1000_a349:
1000:a349          c70612010100                   MOV word ptr [0x112],0x1
1000:a34f          c3                             RET
LAB_1000_b7e3:
1000:b7e3          51                             PUSH CX
1000:b7e4          83e107                         AND CX,0x7
1000:b7e7          b80880                         MOV AX,0x8008
1000:b7ea          d2ec                           SHR AH,CL
1000:b7ec          8bcf                           MOV CX,DI
1000:b7ee          d1e1                           SHL CX,0x1
1000:b7f0          d1e1                           SHL CX,0x1
1000:b7f2          03cf                           ADD CX,DI
1000:b7f4          d1e1                           SHL CX,0x1
1000:b7f6          d1e1                           SHL CX,0x1
1000:b7f8          d1e1                           SHL CX,0x1
1000:b7fa          5b                             POP BX
1000:b7fb          53                             PUSH BX
1000:b7fc          d1eb                           SHR BX,0x1
1000:b7fe          d1eb                           SHR BX,0x1
1000:b800          d1eb                           SHR BX,0x1
1000:b802          03d9                           ADD BX,CX
1000:b804          59                             POP CX
LAB_1000_b805:
1000:b805          b008                           MOV AL,0x8
1000:b807          ef                             OUT DX,AX
1000:b808          268a07                         MOV AL,byte ptr ES:[BX]
1000:b80b          8a04                           MOV AL,byte ptr [SI]
1000:b80d          d0e8                           SHR AL,0x1
1000:b80f          d0e8                           SHR AL,0x1
1000:b811          d0e8                           SHR AL,0x1
1000:b813          d0e8                           SHR AL,0x1
1000:b815          2e3a06a21f                     CMP AL,byte ptr CS:[0x1fa2]
1000:b81a          7408                           JZ 0x1000:b824
1000:b81c          2e3206ee1f                     XOR AL,byte ptr CS:[0x1fee]
1000:b821          268807                         MOV byte ptr ES:[BX],AL
LAB_1000_b824:
1000:b824          41                             INC CX
1000:b825          2e3b0ec81f                     CMP CX,word ptr CS:[0x1fc8]
1000:b82a          732e                           JNC 0x1000:b85a
1000:b82c          d0cc                           ROR AH,0x1
1000:b82e          7301                           JNC 0x1000:b831
1000:b830          43                             INC BX
LAB_1000_b831:
1000:b831          b008                           MOV AL,0x8
1000:b833          ef                             OUT DX,AX
1000:b834          268a07                         MOV AL,byte ptr ES:[BX]
1000:b837          8a04                           MOV AL,byte ptr [SI]
1000:b839          240f                           AND AL,0xf
1000:b83b          2e3a06a21f                     CMP AL,byte ptr CS:[0x1fa2]
1000:b840          7408                           JZ 0x1000:b84a
1000:b842          2e3206ee1f                     XOR AL,byte ptr CS:[0x1fee]
1000:b847          268807                         MOV byte ptr ES:[BX],AL
LAB_1000_b84a:
1000:b84a          46                             INC SI
1000:b84b          41                             INC CX
switchD_1000:8905::caseD_3:
1000:b850          1f                             POP DS
1000:b851          7308                           JNC 0x1000:b85b
1000:b853          d0cc                           ROR AH,0x1
1000:b855          7301                           JNC 0x1000:b858
1000:b857          43                             INC BX
LAB_1000_b858:
1000:b858          ebab                           JMP 0x1000:b805
LAB_1000_b85a:
1000:b85a          46                             INC SI
LAB_1000_b85b:
1000:b85b          47                             INC DI
1000:b85c          2e8b0ec41f                     MOV CX,word ptr CS:[0x1fc4]
1000:b861          2e3b3eca1f                     CMP DI,word ptr CS:[0x1fca]
1000:b866          7303                           JNC 0x1000:b86b
1000:b868          e978ff                         JMP 0x1000:b7e3
LAB_1000_b86b:
1000:b86b          8cc8                           MOV AX,CS
1000:b86d          8ed8                           MOV AX,DS
1000:b86f          e9f801                         JMP 0x1000:ba6a
LAB_1000_ba6a:
1000:ba6a          e86de4                         CALL 0x1000:9eda
1000:ba6d          b80000                         MOV AX,0x0
1000:ba70          a31201                         MOV [0x112],AX
1000:ba73          c3                             RET
switchD_1000:9004::caseD_6:
1000:c402          8606a14e                       XCHG byte ptr [0x4ea1],AL
1000:c406          29a38806                       SUB word ptr [BP + DI + 0x688],SP
1000:c40a          c3                             RET
switchD_1000:8905::caseD_8:
1000:c483          54                             PUSH SP
1000:c484          0a8bc22e                       OR CL,byte ptr [BP + DI + 0x2ec2]
1000:c488          a3d531                         MOV [0x31d5],AX
1000:c48b          268b540e                       MOV DX,word ptr ES:[SI + 0xe]
1000:c48f          2bd0                           SUB DX,AX
1000:c491          2e8916d131                     MOV word ptr CS:[0x31d1],DX
1000:c496          eb0d                           JMP 0x1000:c4a5
LAB_1000_c4a5:
1000:c4a5          8bd0                           MOV DX,AX
1000:c4a7          2e833ed33100                   CMP word ptr CS:[0x31d3],0x0
1000:c4ad          7424                           JZ 0x1000:c4d3
1000:c4af          2e833e6b4d00                   CMP word ptr CS:[0x4d6b],0x0
1000:c4b5          7415                           JZ 0x1000:c4cc
1000:c4b7          57                             PUSH DI
1000:c4b8          2e8b3ed531                     MOV DI,word ptr CS:[0x31d5]
1000:c4bd          d1e7                           SHL DI,0x1
1000:c4bf          2e8b85c53f                     MOV AX,word ptr CS:[DI + 0x3fc5]
1000:c4c4          2ea3c731                       MOV CS:[0x31c7],AX
1000:c4c8          5f                             POP DI
1000:c4c9          eb12                           JMP 0x1000:c4dd
LAB_1000_c4cc:
1000:c4cc          d1e8                           SHR AX,0x1
1000:c4ce          f6e3                           MUL BL
1000:c4d0          eb07                           JMP 0x1000:c4d9
LAB_1000_c4d3:
1000:c4d3          f6e3                           MUL BL
1000:c4d5          26034404                       ADD AX,word ptr ES:[SI + 0x4]
LAB_1000_c4d9:
1000:c4d9          2ea3c731                       MOV CS:[0x31c7],AX
LAB_1000_c4dd:
1000:c4dd          268b440c                       MOV AX,word ptr ES:[SI + 0xc]
1000:c4e1          262b4408                       SUB AX,word ptr ES:[SI + 0x8]
1000:c4e5          268b0c                         MOV CX,word ptr ES:[SI]
1000:c4e8          2e890eeb31                     MOV word ptr CS:[0x31eb],CX
1000:c4ed          2e3b0e7206                     CMP CX,word ptr CS:[0x672]
1000:c4f2          7d28                           JGE 0x1000:c51c
1000:c4f4          2e8b167206                     MOV DX,word ptr CS:[0x672]
1000:c4f9          2e8916eb31                     MOV word ptr CS:[0x31eb],DX
1000:c4fe          2bd1                           SUB DX,CX
1000:c500          26035408                       ADD DX,word ptr ES:[SI + 0x8]
1000:c504          263b540c                       CMP DX,word ptr ES:[SI + 0xc]
1000:c508          7c03                           JL 0x1000:c50d
1000:c50a          e94807                         JMP 0x1000:cc55
LAB_1000_c50d:
1000:c50d          8bc2                           MOV AX,DX
1000:c50f          268b540c                       MOV DX,word ptr ES:[SI + 0xc]
1000:c513          2bd0                           SUB DX,AX
1000:c515          2ea3cf31                       MOV CS:[0x31cf],AX
1000:c519          eb09                           JMP 0x1000:c524
LAB_1000_c51c:
1000:c51c          2ea3cf31                       MOV CS:[0x31cf],AX
1000:c520          268b4408                       MOV AX,word ptr ES:[SI + 0x8]
LAB_1000_c524:
1000:c524          8bd8                           MOV BX,AX
1000:c526          d1e8                           SHR AX,0x1
1000:c528          d1e8                           SHR AX,0x1
1000:c52a          2e0106c731                     ADD word ptr CS:[0x31c7],AX
1000:c52f          2e833e6b4d01                   CMP word ptr CS:[0x4d6b],0x1
1000:c535          740d                           JZ 0x1000:c544
1000:c537          d1ea                           SHR DX,0x1
1000:c539          7309                           JNC 0x1000:c544
1000:c53b          2ea1d331                       MOV AX,CS:[0x31d3]
1000:c53f          2e0106c731                     ADD word ptr CS:[0x31c7],AX
LAB_1000_c544:
1000:c544          83e303                         AND BX,0x3
1000:c547          d1e3                           SHL BX,0x1
1000:c549          2e891ecb31                     MOV word ptr CS:[0x31cb],BX
1000:c54e          2e8b1e6d4d                     MOV BX,word ptr CS:[0x4d6d]
1000:c553          2e891edb31                     MOV word ptr CS:[0x31db],BX
1000:c558          2ec706e1310020                 MOV word ptr CS:[0x31e1],0x2000
1000:c55f          2e8b1e6f4d                     MOV BX,word ptr CS:[0x4d6f]
1000:c564          2e8a0e7006                     MOV CL,byte ptr CS:[0x670]
1000:c569          80f980                         CMP CL,0x80
1000:c56c          7416                           JZ 0x1000:c584
1000:c56e          2e8b166065                     MOV DX,word ptr CS:[0x6560]
1000:c573          2e8916db31                     MOV word ptr CS:[0x31db],DX
1000:c578          2e8a1e7006                     MOV BL,byte ptr CS:[0x670]
1000:c57d          2ec706e1310000                 MOV word ptr CS:[0x31e1],0x0
LAB_1000_c584:
1000:c584          2e891edf31                     MOV word ptr CS:[0x31df],BX
1000:c589          2ea16c06                       MOV AX,CS:[0x66c]
1000:c58d          2e0306e931                     ADD AX,word ptr CS:[0x31e9]
1000:c592          2ea3e331                       MOV CS:[0x31e3],AX
1000:c596          8bd0                           MOV DX,AX
1000:c598          80f980                         CMP CL,0x80
1000:c59b          751b                           JNZ 0x1000:c5b8
1000:c59d          2e833e6b4d01                   CMP word ptr CS:[0x4d6b],0x1
1000:c5a3          7405                           JZ 0x1000:c5aa
1000:c5a5          d1e8                           SHR AX,0x1
1000:c5a7          eb0f                           JMP 0x1000:c5b8
LAB_1000_c5aa:
1000:c5aa          d1e0                           SHL AX,0x1
1000:c5ac          57                             PUSH DI
1000:c5ad          8bf8                           MOV DI,AX
1000:c5af          2e8b85c53f                     MOV AX,word ptr CS:[DI + 0x3fc5]
1000:c5b4          5f                             POP DI
1000:c5b5          eb03                           JMP 0x1000:c5ba
LAB_1000_c5b8:
1000:c5b8          f6e3                           MUL BL
LAB_1000_c5ba:
1000:c5ba          2e03066e06                     ADD AX,word ptr CS:[0x66e]
1000:c5bf          2e8b1e6a06                     MOV BX,word ptr CS:[0x66a]
1000:c5c4          2e031eeb31                     ADD BX,word ptr CS:[0x31eb]
1000:c5c9          2e3b1e7606                     CMP BX,word ptr CS:[0x676]
1000:c5ce          7c03                           JL 0x1000:c5d3
1000:c5d0          e98206                         JMP 0x1000:cc55
LAB_1000_c5d3:
1000:c5d3          8bcb                           MOV CX,BX
1000:c5d5          2e030ecf31                     ADD CX,word ptr CS:[0x31cf]
1000:c5da          2e3b0e7606                     CMP CX,word ptr CS:[0x676]
1000:c5df          7e14                           JLE 0x1000:c5f5
1000:c5e1          2e8b0e7606                     MOV CX,word ptr CS:[0x676]
1000:c5e6          2bcb                           SUB CX,BX
1000:c5e8          2e890ecf31                     MOV word ptr CS:[0x31cf],CX
1000:c5ed          83f901                         CMP CX,0x1
1000:c5f0          7d03                           JGE 0x1000:c5f5
1000:c5f2          e96006                         JMP 0x1000:cc55
LAB_1000_c5f5:
1000:c5f5          8bcb                           MOV CX,BX
1000:c5f7          2e891ee731                     MOV word ptr CS:[0x31e7],BX
1000:c5fc          d1eb                           SHR BX,0x1
1000:c5fe          d1eb                           SHR BX,0x1
1000:c600          03c3                           ADD AX,BX
1000:c602          d1ea                           SHR DX,0x1
1000:c604          730d                           JNC 0x1000:c613
1000:c606          2e833e6b4d01                   CMP word ptr CS:[0x4d6b],0x1
1000:c60c          7405                           JZ 0x1000:c613
1000:c60e          2e0306e131                     ADD AX,word ptr CS:[0x31e1]
LAB_1000_c613:
1000:c613          2ea3d931                       MOV CS:[0x31d9],AX
1000:c617          83e103                         AND CX,0x3
1000:c61a          d1e1                           SHL CX,0x1
1000:c61c          2e890edd31                     MOV word ptr CS:[0x31dd],CX
1000:c621          2e8e06db31                     MOV ES,word ptr CS:[0x31db]
1000:c626          2e8b0ed131                     MOV CX,word ptr CS:[0x31d1]
LAB_1000_c62b:
1000:c62b          51                             PUSH CX
1000:c62c          2ec706d7310000                 MOV word ptr CS:[0x31d7],0x0
1000:c633          eb42                           JMP 0x1000:c677
LAB_1000_c677:
1000:c677          2ea08a06                       MOV AL,CS:[0x68a]
1000:c67b          3c06                           CMP AL,0x6
1000:c67d          7503                           JNZ 0x1000:c682
1000:c67f          e9ff00                         JMP 0x1000:c781
LAB_1000_c682:
1000:c682          3c02                           CMP AL,0x2
1000:c684          7503                           JNZ 0x1000:c689
1000:c686          e91b04                         JMP 0x1000:caa4
LAB_1000_c689:
1000:c689          3c01                           CMP AL,0x1
1000:c68b          7503                           JNZ 0x1000:c690
1000:c68d          e92403                         JMP 0x1000:c9b4
LAB_1000_c690:
1000:c690          3c07                           CMP AL,0x7
1000:c692          7503                           JNZ 0x1000:c697
1000:c694          e9e001                         JMP 0x1000:c877
LAB_1000_c697:
1000:c697          2e8b36c731                     MOV SI,word ptr CS:[0x31c7]
1000:c69c          2e8b3ed931                     MOV DI,word ptr CS:[0x31d9]
1000:c6a1          2e8b1edd31                     MOV BX,word ptr CS:[0x31dd]
1000:c6a6          b90800                         MOV CX,0x8
1000:c6a9          2bcb                           SUB CX,BX
1000:c6ab          268a15                         MOV DL,byte ptr ES:[DI]
1000:c6ae          d2ea                           SHR DL,CL
1000:c6b0          d2e2                           SHL DL,CL
1000:c6b2          b80800                         MOV AX,0x8
1000:c6b5          2bc1                           SUB AX,CX
1000:c6b7          d1e9                           SHR CX,0x1
1000:c6b9          2e890ed731                     MOV word ptr CS:[0x31d7],CX
1000:c6be          8cdb                           MOV BX,DS
1000:c6c0          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c6c5          8b04                           MOV AX,word ptr [SI]
1000:c6c7          8edb                           MOV BX,DS
1000:c6c9          86e0                           XCHG AL,AH
1000:c6cb          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c6d0          d3e0                           SHL AX,CL
1000:c6d2          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c6d7          d3e8                           SHR AX,CL
1000:c6d9          0ae2                           OR AH,DL
1000:c6db          268825                         MOV byte ptr ES:[DI],AH
1000:c6de          47                             INC DI
1000:c6df          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:c6e4          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:c6e9          83f900                         CMP CX,0x0
1000:c6ec          7443                           JZ 0x1000:c731
1000:c6ee          83f904                         CMP CX,0x4
1000:c6f1          7d03                           JGE 0x1000:c6f6
1000:c6f3          eb3c                           JMP 0x1000:c731
LAB_1000_c6f6:
1000:c6f6          1e                             PUSH DS
1000:c6f7          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c6fc          8b04                           MOV AX,word ptr [SI]
1000:c6fe          86e0                           XCHG AL,AH
1000:c700          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c705          d3e0                           SHL AX,CL
1000:c707          46                             INC SI
1000:c708          8b1c                           MOV BX,word ptr [SI]
1000:c70a          86fb                           XCHG BL,BH
1000:c70c          1f                             POP DS
1000:c70d          d3e3                           SHL BX,CL
1000:c70f          8ac7                           MOV AL,BH
1000:c711          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c716          d3e8                           SHR AX,CL
1000:c718          268805                         MOV byte ptr ES:[DI],AL
1000:c71b          47                             INC DI
1000:c71c          2e8306d73104                   ADD word ptr CS:[0x31d7],0x4
1000:c722          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:c727          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:c72c          83f904                         CMP CX,0x4
1000:c72f          7dc5                           JGE 0x1000:c6f6
LAB_1000_c731:
1000:c731          83f900                         CMP CX,0x0
1000:c734          7503                           JNZ 0x1000:c739
1000:c736          e95504                         JMP 0x1000:cb8e
LAB_1000_c739:
1000:c739          1e                             PUSH DS
1000:c73a          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c73f          8b04                           MOV AX,word ptr [SI]
1000:c741          86e0                           XCHG AL,AH
1000:c743          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c748          d3e0                           SHL AX,CL
1000:c74a          46                             INC SI
1000:c74b          8b1c                           MOV BX,word ptr [SI]
1000:c74d          86fb                           XCHG BL,BH
1000:c74f          1f                             POP DS
1000:c750          d3e3                           SHL BX,CL
1000:c752          8ac7                           MOV AL,BH
1000:c754          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c759          d3e8                           SHR AX,CL
1000:c75b          2e8b1ecf31                     MOV BX,word ptr CS:[0x31cf]
1000:c760          2e2b1ed731                     SUB BX,word ptr CS:[0x31d7]
1000:c765          d1e3                           SHL BX,0x1
1000:c767          b90800                         MOV CX,0x8
1000:c76a          2bcb                           SUB CX,BX
1000:c76c          d3e8                           SHR AX,CL
1000:c76e          d3e0                           SHL AX,CL
1000:c770          8bcb                           MOV CX,BX
1000:c772          268a1d                         MOV BL,byte ptr ES:[DI]
1000:c775          d2e3                           SHL BL,CL
1000:c777          d2eb                           SHR BL,CL
1000:c779          0ac3                           OR AL,BL
1000:c77b          268805                         MOV byte ptr ES:[DI],AL
1000:c77e          e90d04                         JMP 0x1000:cb8e
LAB_1000_c781:
1000:c781          2e8b36c731                     MOV SI,word ptr CS:[0x31c7]
1000:c786          2e8b3ed931                     MOV DI,word ptr CS:[0x31d9]
1000:c78b          2e8b1edd31                     MOV BX,word ptr CS:[0x31dd]
1000:c790          b90800                         MOV CX,0x8
1000:c793          2bcb                           SUB CX,BX
1000:c795          268a15                         MOV DL,byte ptr ES:[DI]
1000:c798          b80800                         MOV AX,0x8
1000:c79b          2bc1                           SUB AX,CX
1000:c79d          d1e9                           SHR CX,0x1
1000:c79f          2e890ed731                     MOV word ptr CS:[0x31d7],CX
1000:c7a4          8cdb                           MOV BX,DS
1000:c7a6          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c7ab          8b04                           MOV AX,word ptr [SI]
1000:c7ad          8edb                           MOV BX,DS
1000:c7af          bbffff                         MOV BX,0xffff
1000:c7b2          86e0                           XCHG AL,AH
1000:c7b4          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c7b9          d3e0                           SHL AX,CL
1000:c7bb          d3e3                           SHL BX,CL
1000:c7bd          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c7c2          d3e8                           SHR AX,CL
1000:c7c4          d3eb                           SHR BX,CL
1000:c7c6          33c3                           XOR AX,BX
1000:c7c8          32e2                           XOR AH,DL
1000:c7ca          268825                         MOV byte ptr ES:[DI],AH
1000:c7cd          47                             INC DI
1000:c7ce          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:c7d3          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:c7d8          83f904                         CMP CX,0x4
1000:c7db          7d03                           JGE 0x1000:c7e0
1000:c7dd          eb41                           JMP 0x1000:c820
LAB_1000_c7e0:
1000:c7e0          1e                             PUSH DS
1000:c7e1          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c7e6          8b04                           MOV AX,word ptr [SI]
1000:c7e8          86e0                           XCHG AL,AH
1000:c7ea          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c7ef          d3e0                           SHL AX,CL
1000:c7f1          46                             INC SI
1000:c7f2          8b1c                           MOV BX,word ptr [SI]
1000:c7f4          86fb                           XCHG BL,BH
1000:c7f6          1f                             POP DS
1000:c7f7          d3e3                           SHL BX,CL
1000:c7f9          8ac7                           MOV AL,BH
1000:c7fb          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c800          d3e8                           SHR AX,CL
1000:c802          34ff                           XOR AL,0xff
1000:c804          263205                         XOR AL,byte ptr ES:[DI]
1000:c807          268805                         MOV byte ptr ES:[DI],AL
1000:c80a          47                             INC DI
1000:c80b          2e8306d73104                   ADD word ptr CS:[0x31d7],0x4
1000:c811          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:c816          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:c81b          83f904                         CMP CX,0x4
1000:c81e          7dc0                           JGE 0x1000:c7e0
LAB_1000_c820:
1000:c820          83f900                         CMP CX,0x0
1000:c823          7503                           JNZ 0x1000:c828
1000:c825          e96603                         JMP 0x1000:cb8e
LAB_1000_c828:
1000:c828          1e                             PUSH DS
1000:c829          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c82e          8b04                           MOV AX,word ptr [SI]
1000:c830          86e0                           XCHG AL,AH
1000:c832          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c837          d3e0                           SHL AX,CL
1000:c839          46                             INC SI
1000:c83a          8b1c                           MOV BX,word ptr [SI]
1000:c83c          86fb                           XCHG BL,BH
1000:c83e          1f                             POP DS
1000:c83f          d3e3                           SHL BX,CL
1000:c841          8ac7                           MOV AL,BH
1000:c843          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c848          d3e8                           SHR AX,CL
1000:c84a          2e8b1ecf31                     MOV BX,word ptr CS:[0x31cf]
1000:c84f          2e2b1ed731                     SUB BX,word ptr CS:[0x31d7]
1000:c854          d1e3                           SHL BX,0x1
1000:c856          b90800                         MOV CX,0x8
1000:c859          2bcb                           SUB CX,BX
1000:c85b          53                             PUSH BX
1000:c85c          bbffff                         MOV BX,0xffff
1000:c85f          d3e8                           SHR AX,CL
1000:c861          d3eb                           SHR BX,CL
1000:c863          d3e0                           SHL AX,CL
1000:c865          d3e3                           SHL BX,CL
1000:c867          33c3                           XOR AX,BX
1000:c869          5b                             POP BX
1000:c86a          8bcb                           MOV CX,BX
1000:c86c          268a1d                         MOV BL,byte ptr ES:[DI]
1000:c86f          32c3                           XOR AL,BL
1000:c871          268805                         MOV byte ptr ES:[DI],AL
1000:c874          e91703                         JMP 0x1000:cb8e
LAB_1000_c877:
1000:c877          2e8b36c731                     MOV SI,word ptr CS:[0x31c7]
1000:c87c          2e8b3ed931                     MOV DI,word ptr CS:[0x31d9]
1000:c881          2e8b1edd31                     MOV BX,word ptr CS:[0x31dd]
1000:c886          b90800                         MOV CX,0x8
1000:c889          2bcb                           SUB CX,BX
1000:c88b          268a15                         MOV DL,byte ptr ES:[DI]
1000:c88e          b80800                         MOV AX,0x8
1000:c891          2bc1                           SUB AX,CX
1000:c893          d1e9                           SHR CX,0x1
1000:c895          2e890ed731                     MOV word ptr CS:[0x31d7],CX
1000:c89a          8cdb                           MOV BX,DS
1000:c89c          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c8a1          8b04                           MOV AX,word ptr [SI]
1000:c8a3          8edb                           MOV BX,DS
1000:c8a5          bbffff                         MOV BX,0xffff
1000:c8a8          86e0                           XCHG AL,AH
1000:c8aa          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c8af          d3e0                           SHL AX,CL
1000:c8b1          d3e3                           SHL BX,CL
1000:c8b3          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c8b8          d3e8                           SHR AX,CL
1000:c8ba          d3eb                           SHR BX,CL
1000:c8bc          2e833edd3102                   CMP word ptr CS:[0x31dd],0x2
1000:c8c2          7416                           JZ 0x1000:c8da
1000:c8c4          2e833edd3104                   CMP word ptr CS:[0x31dd],0x4
1000:c8ca          7414                           JZ 0x1000:c8e0
1000:c8cc          2e833edd3106                   CMP word ptr CS:[0x31dd],0x6
1000:c8d2          7412                           JZ 0x1000:c8e6
1000:c8d4          80cc00                         OR AH,0x0
1000:c8d7          eb10                           JMP 0x1000:c8e9
LAB_1000_c8da:
1000:c8da          80ccc0                         OR AH,0xc0
1000:c8dd          eb0a                           JMP 0x1000:c8e9
LAB_1000_c8e0:
1000:c8e0          80ccf0                         OR AH,0xf0
1000:c8e3          eb04                           JMP 0x1000:c8e9
LAB_1000_c8e6:
1000:c8e6          80ccfc                         OR AH,0xfc
LAB_1000_c8e9:
1000:c8e9          22e2                           AND AH,DL
1000:c8eb          268825                         MOV byte ptr ES:[DI],AH
1000:c8ee          47                             INC DI
1000:c8ef          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:c8f4          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:c8f9          83f904                         CMP CX,0x4
1000:c8fc          7d03                           JGE 0x1000:c901
1000:c8fe          eb3f                           JMP 0x1000:c93f
LAB_1000_c901:
1000:c901          1e                             PUSH DS
1000:c902          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c907          8b04                           MOV AX,word ptr [SI]
1000:c909          86e0                           XCHG AL,AH
1000:c90b          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c910          d3e0                           SHL AX,CL
1000:c912          46                             INC SI
1000:c913          8b1c                           MOV BX,word ptr [SI]
1000:c915          86fb                           XCHG BL,BH
1000:c917          1f                             POP DS
1000:c918          d3e3                           SHL BX,CL
1000:c91a          8ac7                           MOV AL,BH
1000:c91c          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c921          d3e8                           SHR AX,CL
1000:c923          262205                         AND AL,byte ptr ES:[DI]
1000:c926          268805                         MOV byte ptr ES:[DI],AL
1000:c929          47                             INC DI
1000:c92a          2e8306d73104                   ADD word ptr CS:[0x31d7],0x4
1000:c930          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:c935          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:c93a          83f904                         CMP CX,0x4
1000:c93d          7dc2                           JGE 0x1000:c901
LAB_1000_c93f:
1000:c93f          83f900                         CMP CX,0x0
1000:c942          7503                           JNZ 0x1000:c947
1000:c944          e94702                         JMP 0x1000:cb8e
LAB_1000_c947:
1000:c947          1e                             PUSH DS
1000:c948          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c94d          8b04                           MOV AX,word ptr [SI]
1000:c94f          86e0                           XCHG AL,AH
1000:c951          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c956          d3e0                           SHL AX,CL
1000:c958          46                             INC SI
1000:c959          8b1c                           MOV BX,word ptr [SI]
1000:c95b          86fb                           XCHG BL,BH
1000:c95d          1f                             POP DS
1000:c95e          d3e3                           SHL BX,CL
1000:c960          8ac7                           MOV AL,BH
1000:c962          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c967          d3e8                           SHR AX,CL
1000:c969          2e8b1ecf31                     MOV BX,word ptr CS:[0x31cf]
1000:c96e          2e2b1ed731                     SUB BX,word ptr CS:[0x31d7]
1000:c973          d1e3                           SHL BX,0x1
1000:c975          b90800                         MOV CX,0x8
1000:c978          2bcb                           SUB CX,BX
1000:c97a          53                             PUSH BX
1000:c97b          bbffff                         MOV BX,0xffff
1000:c97e          d3e8                           SHR AX,CL
1000:c980          d3eb                           SHR BX,CL
1000:c982          d3e0                           SHL AX,CL
1000:c984          d3e3                           SHL BX,CL
1000:c986          5b                             POP BX
1000:c987          8bcb                           MOV CX,BX
1000:c989          268a1d                         MOV BL,byte ptr ES:[DI]
1000:c98c          83f902                         CMP CX,0x2
1000:c98f          7419                           JZ 0x1000:c9aa
1000:c991          83f904                         CMP CX,0x4
1000:c994          740f                           JZ 0x1000:c9a5
1000:c996          83f906                         CMP CX,0x6
1000:c999          7405                           JZ 0x1000:c9a0
1000:c99b          0c00                           OR AL,0x0
1000:c99d          eb0d                           JMP 0x1000:c9ac
LAB_1000_c9a0:
1000:c9a0          0c03                           OR AL,0x3
1000:c9a2          eb08                           JMP 0x1000:c9ac
LAB_1000_c9a5:
1000:c9a5          0c0f                           OR AL,0xf
1000:c9a7          eb03                           JMP 0x1000:c9ac
LAB_1000_c9aa:
1000:c9aa          0c3f                           OR AL,0x3f
LAB_1000_c9ac:
1000:c9ac          22c3                           AND AL,BL
1000:c9ae          268805                         MOV byte ptr ES:[DI],AL
1000:c9b1          e9da01                         JMP 0x1000:cb8e
LAB_1000_c9b4:
1000:c9b4          2e8b36c731                     MOV SI,word ptr CS:[0x31c7]
1000:c9b9          2e8b3ed931                     MOV DI,word ptr CS:[0x31d9]
1000:c9be          2e8b1edd31                     MOV BX,word ptr CS:[0x31dd]
1000:c9c3          b90800                         MOV CX,0x8
1000:c9c6          2bcb                           SUB CX,BX
1000:c9c8          268a15                         MOV DL,byte ptr ES:[DI]
1000:c9cb          b80800                         MOV AX,0x8
1000:c9ce          2bc1                           SUB AX,CX
1000:c9d0          d1e9                           SHR CX,0x1
1000:c9d2          2e890ed731                     MOV word ptr CS:[0x31d7],CX
1000:c9d7          8cdb                           MOV BX,DS
1000:c9d9          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:c9de          8b04                           MOV AX,word ptr [SI]
1000:c9e0          8edb                           MOV BX,DS
1000:c9e2          bbffff                         MOV BX,0xffff
1000:c9e5          86e0                           XCHG AL,AH
1000:c9e7          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:c9ec          d3e0                           SHL AX,CL
1000:c9ee          d3e3                           SHL BX,CL
1000:c9f0          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:c9f5          d3e8                           SHR AX,CL
1000:c9f7          d3eb                           SHR BX,CL
1000:c9f9          0ae2                           OR AH,DL
1000:c9fb          268825                         MOV byte ptr ES:[DI],AH
1000:c9fe          47                             INC DI
1000:c9ff          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:ca04          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:ca09          83f904                         CMP CX,0x4
1000:ca0c          7d03                           JGE 0x1000:ca11
1000:ca0e          eb3f                           JMP 0x1000:ca4f
LAB_1000_ca11:
1000:ca11          1e                             PUSH DS
1000:ca12          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:ca17          8b04                           MOV AX,word ptr [SI]
1000:ca19          86e0                           XCHG AL,AH
1000:ca1b          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:ca20          d3e0                           SHL AX,CL
1000:ca22          46                             INC SI
1000:ca23          8b1c                           MOV BX,word ptr [SI]
1000:ca25          86fb                           XCHG BL,BH
1000:ca27          1f                             POP DS
1000:ca28          d3e3                           SHL BX,CL
1000:ca2a          8ac7                           MOV AL,BH
1000:ca2c          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:ca31          d3e8                           SHR AX,CL
1000:ca33          260a05                         OR AL,byte ptr ES:[DI]
1000:ca36          268805                         MOV byte ptr ES:[DI],AL
1000:ca39          47                             INC DI
1000:ca3a          2e8306d73104                   ADD word ptr CS:[0x31d7],0x4
1000:ca40          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:ca45          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:ca4a          83f904                         CMP CX,0x4
1000:ca4d          7dc2                           JGE 0x1000:ca11
LAB_1000_ca4f:
1000:ca4f          83f900                         CMP CX,0x0
1000:ca52          7503                           JNZ 0x1000:ca57
1000:ca54          e93701                         JMP 0x1000:cb8e
LAB_1000_ca57:
1000:ca57          1e                             PUSH DS
1000:ca58          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:ca5d          8b04                           MOV AX,word ptr [SI]
1000:ca5f          86e0                           XCHG AL,AH
1000:ca61          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:ca66          d3e0                           SHL AX,CL
1000:ca68          46                             INC SI
1000:ca69          8b1c                           MOV BX,word ptr [SI]
1000:ca6b          86fb                           XCHG BL,BH
1000:ca6d          1f                             POP DS
1000:ca6e          d3e3                           SHL BX,CL
1000:ca70          8ac7                           MOV AL,BH
1000:ca72          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:ca77          d3e8                           SHR AX,CL
1000:ca79          2e8b1ecf31                     MOV BX,word ptr CS:[0x31cf]
1000:ca7e          2e2b1ed731                     SUB BX,word ptr CS:[0x31d7]
1000:ca83          d1e3                           SHL BX,0x1
1000:ca85          b90800                         MOV CX,0x8
1000:ca88          2bcb                           SUB CX,BX
1000:ca8a          53                             PUSH BX
1000:ca8b          bbffff                         MOV BX,0xffff
1000:ca8e          d3e8                           SHR AX,CL
1000:ca90          d3eb                           SHR BX,CL
1000:ca92          d3e0                           SHL AX,CL
1000:ca94          d3e3                           SHL BX,CL
1000:ca96          5b                             POP BX
1000:ca97          8bcb                           MOV CX,BX
1000:ca99          268a1d                         MOV BL,byte ptr ES:[DI]
1000:ca9c          0ac3                           OR AL,BL
1000:ca9e          268805                         MOV byte ptr ES:[DI],AL
1000:caa1          e9ea00                         JMP 0x1000:cb8e
LAB_1000_caa4:
1000:caa4          2e8b36c731                     MOV SI,word ptr CS:[0x31c7]
1000:caa9          2e8b3ed931                     MOV DI,word ptr CS:[0x31d9]
1000:caae          2e8b1edd31                     MOV BX,word ptr CS:[0x31dd]
1000:cab3          b90800                         MOV CX,0x8
1000:cab6          2bcb                           SUB CX,BX
1000:cab8          268a15                         MOV DL,byte ptr ES:[DI]
1000:cabb          b80800                         MOV AX,0x8
1000:cabe          2bc1                           SUB AX,CX
1000:cac0          d1e9                           SHR CX,0x1
1000:cac2          2e890ed731                     MOV word ptr CS:[0x31d7],CX
1000:cac7          8cdb                           MOV BX,DS
1000:cac9          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:cace          8b04                           MOV AX,word ptr [SI]
1000:cad0          8edb                           MOV BX,DS
1000:cad2          bbffff                         MOV BX,0xffff
1000:cad5          86e0                           XCHG AL,AH
1000:cad7          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:cadc          d3e0                           SHL AX,CL
1000:cade          d3e3                           SHL BX,CL
1000:cae0          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:cae5          d3e8                           SHR AX,CL
1000:cae7          d3eb                           SHR BX,CL
1000:cae9          32e2                           XOR AH,DL
1000:caeb          268825                         MOV byte ptr ES:[DI],AH
1000:caee          47                             INC DI
1000:caef          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:caf4          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:caf9          83f904                         CMP CX,0x4
1000:cafc          7d03                           JGE 0x1000:cb01
1000:cafe          eb3f                           JMP 0x1000:cb3f
LAB_1000_cb01:
1000:cb01          1e                             PUSH DS
1000:cb02          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:cb07          8b04                           MOV AX,word ptr [SI]
1000:cb09          86e0                           XCHG AL,AH
1000:cb0b          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:cb10          d3e0                           SHL AX,CL
1000:cb12          46                             INC SI
1000:cb13          8b1c                           MOV BX,word ptr [SI]
1000:cb15          86fb                           XCHG BL,BH
1000:cb17          1f                             POP DS
1000:cb18          d3e3                           SHL BX,CL
1000:cb1a          8ac7                           MOV AL,BH
1000:cb1c          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:cb21          d3e8                           SHR AX,CL
1000:cb23          263205                         XOR AL,byte ptr ES:[DI]
1000:cb26          268805                         MOV byte ptr ES:[DI],AL
1000:cb29          47                             INC DI
1000:cb2a          2e8306d73104                   ADD word ptr CS:[0x31d7],0x4
1000:cb30          2e8b0ecf31                     MOV CX,word ptr CS:[0x31cf]
1000:cb35          2e2b0ed731                     SUB CX,word ptr CS:[0x31d7]
1000:cb3a          83f904                         CMP CX,0x4
1000:cb3d          7dc2                           JGE 0x1000:cb01
LAB_1000_cb3f:
1000:cb3f          83f900                         CMP CX,0x0
1000:cb42          744a                           JZ 0x1000:cb8e
1000:cb44          1e                             PUSH DS
1000:cb45          2e8e1ec931                     MOV DS,word ptr CS:[0x31c9]
1000:cb4a          8b04                           MOV AX,word ptr [SI]
1000:cb4c          86e0                           XCHG AL,AH
1000:cb4e          2e8b0ecb31                     MOV CX,word ptr CS:[0x31cb]
1000:cb53          d3e0                           SHL AX,CL
1000:cb55          46                             INC SI
1000:cb56          8b1c                           MOV BX,word ptr [SI]
1000:cb58          86fb                           XCHG BL,BH
1000:cb5a          1f                             POP DS
1000:cb5b          d3e3                           SHL BX,CL
1000:cb5d          8ac7                           MOV AL,BH
1000:cb5f          2e8b0edd31                     MOV CX,word ptr CS:[0x31dd]
1000:cb64          d3e8                           SHR AX,CL
1000:cb66          2e8b1ecf31                     MOV BX,word ptr CS:[0x31cf]
1000:cb6b          2e2b1ed731                     SUB BX,word ptr CS:[0x31d7]
1000:cb70          d1e3                           SHL BX,0x1
1000:cb72          b90800                         MOV CX,0x8
1000:cb75          2bcb                           SUB CX,BX
1000:cb77          53                             PUSH BX
1000:cb78          bbffff                         MOV BX,0xffff
1000:cb7b          d3e8                           SHR AX,CL
1000:cb7d          d3eb                           SHR BX,CL
1000:cb7f          d3e0                           SHL AX,CL
1000:cb81          d3e3                           SHL BX,CL
1000:cb83          5b                             POP BX
1000:cb84          8bcb                           MOV CX,BX
1000:cb86          268a1d                         MOV BL,byte ptr ES:[DI]
1000:cb89          32c3                           XOR AL,BL
1000:cb8b          268805                         MOV byte ptr ES:[DI],AL
LAB_1000_cb8e:
1000:cb8e          2e833ed33100                   CMP word ptr CS:[0x31d3],0x0
1000:cb94          744f                           JZ 0x1000:cbe5
1000:cb96          2eff06d531                     INC word ptr CS:[0x31d5]
1000:cb9b          2e833e6b4d00                   CMP word ptr CS:[0x4d6b],0x0
1000:cba1          7422                           JZ 0x1000:cbc5
1000:cba3          2ea1d531                       MOV AX,CS:[0x31d5]
1000:cba7          d1e8                           SHR AX,0x1
1000:cba9          720f                           JC 0x1000:cbba
1000:cbab          d1e8                           SHR AX,0x1
1000:cbad          720b                           JC 0x1000:cbba
1000:cbaf          b8a65f                         MOV AX,0x5fa6
1000:cbb2          2e2906c731                     SUB word ptr CS:[0x31c7],AX
1000:cbb7          eb35                           JMP 0x1000:cbee
LAB_1000_cbba:
1000:cbba          b8a61f                         MOV AX,0x1fa6
1000:cbbd          2e0106c731                     ADD word ptr CS:[0x31c7],AX
1000:cbc2          eb21                           JMP 0x1000:cbe5
LAB_1000_cbc5:
1000:cbc5          2ea1d531                       MOV AX,CS:[0x31d5]
1000:cbc9          d1e8                           SHR AX,0x1
1000:cbcb          720c                           JC 0x1000:cbd9
1000:cbcd          2ea1d331                       MOV AX,CS:[0x31d3]
1000:cbd1          2e2906c731                     SUB word ptr CS:[0x31c7],AX
1000:cbd6          eb0d                           JMP 0x1000:cbe5
LAB_1000_cbd9:
1000:cbd9          2ea1d331                       MOV AX,CS:[0x31d3]
1000:cbdd          2e0106c731                     ADD word ptr CS:[0x31c7],AX
1000:cbe2          eb0a                           JMP 0x1000:cbee
LAB_1000_cbe5:
1000:cbe5          2ea1cd31                       MOV AX,CS:[0x31cd]
1000:cbe9          2e0106c731                     ADD word ptr CS:[0x31c7],AX
LAB_1000_cbee:
1000:cbee          2e833ee13100                   CMP word ptr CS:[0x31e1],0x0
1000:cbf4          744f                           JZ 0x1000:cc45
1000:cbf6          2eff06e331                     INC word ptr CS:[0x31e3]
1000:cbfb          2e833e6b4d00                   CMP word ptr CS:[0x4d6b],0x0
1000:cc01          7422                           JZ 0x1000:cc25
1000:cc03          2ea1e331                       MOV AX,CS:[0x31e3]
1000:cc07          d1e8                           SHR AX,0x1
1000:cc09          720f                           JC 0x1000:cc1a
1000:cc0b          d1e8                           SHR AX,0x1
1000:cc0d          720b                           JC 0x1000:cc1a
1000:cc0f          b80060                         MOV AX,0x6000
1000:cc12          2e2906d931                     SUB word ptr CS:[0x31d9],AX
1000:cc17          eb2c                           JMP 0x1000:cc45
LAB_1000_cc1a:
1000:cc1a          b80020                         MOV AX,0x2000
1000:cc1d          2e0106d931                     ADD word ptr CS:[0x31d9],AX
1000:cc22          eb2a                           JMP 0x1000:cc4e
LAB_1000_cc25:
1000:cc25          2ea1e331                       MOV AX,CS:[0x31e3]
1000:cc29          d1e8                           SHR AX,0x1
1000:cc2b          720c                           JC 0x1000:cc39
1000:cc2d          2ea1e131                       MOV AX,CS:[0x31e1]
1000:cc31          2e2906d931                     SUB word ptr CS:[0x31d9],AX
1000:cc36          eb0d                           JMP 0x1000:cc45
LAB_1000_cc39:
1000:cc39          2ea1e131                       MOV AX,CS:[0x31e1]
1000:cc3d          2e0106d931                     ADD word ptr CS:[0x31d9],AX
1000:cc42          eb0a                           JMP 0x1000:cc4e
LAB_1000_cc45:
1000:cc45          2ea1df31                       MOV AX,CS:[0x31df]
1000:cc49          2e0106d931                     ADD word ptr CS:[0x31d9],AX
LAB_1000_cc4e:
1000:cc4e          59                             POP CX
1000:cc4f          49                             DEC CX
1000:cc50          7403                           JZ 0x1000:cc55
1000:cc52          e9d6f9                         JMP 0x1000:c62b
LAB_1000_cc55:
1000:cc55          e8f2d1                         CALL 0x1000:9e4a
1000:cc58          c3                             RET
switchD_1000:99e7::caseD_9:
1000:d08c          cb                             RETF
LAB_1000_e3c1:
1000:e3c1          3b0e804d                       CMP CX,word ptr [0x4d80]
1000:e3c5          7254                           JC 0x1000:e41b
1000:e3c7          3b0e844d                       CMP CX,word ptr [0x4d84]
1000:e3cb          774e                           JA 0x1000:e41b
1000:e3cd          3b16824d                       CMP DX,word ptr [0x4d82]
1000:e3d1          7248                           JC 0x1000:e41b
1000:e3d3          3b16864d                       CMP DX,word ptr [0x4d86]
1000:e3d7          7742                           JA 0x1000:e41b
1000:e3d9          53                             PUSH BX
1000:e3da          51                             PUSH CX
1000:e3db          8bda                           MOV BX,DX
1000:e3dd          d1e3                           SHL BX,0x1
1000:e3df          8b87c53f                       MOV AX,word ptr [BX + 0x3fc5]
1000:e3e3          8bd8                           MOV BX,AX
1000:e3e5          51                             PUSH CX
1000:e3e6          d1e9                           SHR CX,0x1
1000:e3e8          d1e9                           SHR CX,0x1
1000:e3ea          03d9                           ADD BX,CX
1000:e3ec          59                             POP CX
1000:e3ed          8a05                           MOV AL,byte ptr [DI]
1000:e3ef          3204                           XOR AL,byte ptr [SI]
1000:e3f1          53                             PUSH BX
1000:e3f2          bbf84d                         MOV BX,0x4df8
1000:e3f5          83e103                         AND CX,0x3
1000:e3f8          03d9                           ADD BX,CX
1000:e3fa          8a27                           MOV AH,byte ptr [BX]
1000:e3fc          22c4                           AND AL,AH
1000:e3fe          5b                             POP BX
1000:e3ff          268a2f                         MOV CH,byte ptr ES:[BX]
1000:e402          80f4ff                         XOR AH,0xff
1000:e405          807c0100                       CMP byte ptr [SI + 0x1],0x0
1000:e409          7407                           JZ 0x1000:e412
1000:e40b          22e8                           AND CH,AL
1000:e40d          8ac5                           MOV AL,CH
1000:e40f          eb05                           JMP 0x1000:e416
LAB_1000_e412:
1000:e412          22ec                           AND CH,AH
1000:e414          0ac5                           OR AL,CH
LAB_1000_e416:
1000:e416          268807                         MOV byte ptr ES:[BX],AL
1000:e419          59                             POP CX
1000:e41a          5b                             POP BX
LAB_1000_e41b:
1000:e41b          43                             INC BX
1000:e41c          41                             INC CX
1000:e41d          833e9a4d01                     CMP word ptr [0x4d9a],0x1
1000:e422          7403                           JZ 0x1000:e427
1000:e424          83f701                         XOR DI,0x1
switchD_1000:8905::caseD_11:
1000:e42a          4d                             DEC BP
1000:e42b          7294                           JC 0x1000:e3c1
1000:e42d          ff069e4d                       INC word ptr [0x4d9e]
1000:e431          a19e4d                         MOV AX,[0x4d9e]
1000:e434          3b069c4d                       CMP AX,word ptr [0x4d9c]
1000:e438          731c                           JNC 0x1000:e456
1000:e43a          3d0400                         CMP AX,0x4
1000:e43d          7317                           JNC 0x1000:e456
1000:e43f          a1984d                         MOV AX,[0x4d98]
1000:e442          250100                         AND AX,0x1
1000:e445          7501                           JNZ 0x1000:e448
1000:e447          47                             INC DI
LAB_1000_e448:
1000:e448          51                             PUSH CX
1000:e449          83e101                         AND CX,0x1
1000:e44c          83f900                         CMP CX,0x0
1000:e44f          59                             POP CX
1000:e450          7401                           JZ 0x1000:e453
1000:e452          47                             INC DI
LAB_1000_e453:
1000:e453          eb13                           JMP 0x1000:e468
LAB_1000_e456:
1000:e456          bfb24d                         MOV DI,0x4db2
1000:e459          a1714d                         MOV AX,[0x4d71]
1000:e45c          3d0000                         CMP AX,0x0
1000:e45f          7401                           JZ 0x1000:e462
1000:e461          47                             INC DI
LAB_1000_e462:
1000:e462          c7069e4d0000                   MOV word ptr [0x4d9e],0x0
LAB_1000_e468:
1000:e468          bb0000                         MOV BX,0x0
1000:e46b          8b0e8e4d                       MOV CX,word ptr [0x4d8e]
1000:e46f          42                             INC DX
1000:e470          3b16944d                       CMP DX,word ptr [0x4d94]
1000:e474          7303                           JNC 0x1000:e479
1000:e476          e948ff                         JMP 0x1000:e3c1
LAB_1000_e479:
1000:e479          8bc2                           MOV AX,DX
1000:e47b          2b06924d                       SUB AX,word ptr [0x4d92]
1000:e47f          3a068906                       CMP AL,byte ptr [0x689]
1000:e483          7303                           JNC 0x1000:e488
1000:e485          e939ff                         JMP 0x1000:e3c1
LAB_1000_e488:
1000:e488          c3                             RET
switchD_1000:8905::caseD_0:
1000:efba          3c04                           CMP AL,0x4
1000:efbc          7500                           JNZ 0x1000:efbe
LAB_1000_efbe:
1000:efbe          3c00                           CMP AL,0x0
1000:efc0          7436                           JZ 0x1000:eff8
1000:efc2          3c04                           CMP AL,0x4
1000:efc4          7202                           JC 0x1000:efc8
1000:efc6          2c04                           SUB AL,0x4
LAB_1000_efc8:
1000:efc8          3c00                           CMP AL,0x0
1000:efca          742c                           JZ 0x1000:eff8
1000:efcc          3c01                           CMP AL,0x1
1000:efce          750d                           JNZ 0x1000:efdd
1000:efd0          b00a                           MOV AL,0xa
1000:efd2          8805                           MOV byte ptr [DI],AL
1000:efd4          c606926501                     MOV byte ptr [0x6592],0x1
1000:efd9          90                             NOP
1000:efda          eb1c                           JMP 0x1000:eff8
LAB_1000_efdd:
1000:efdd          3c02                           CMP AL,0x2
1000:efdf          750d                           JNZ 0x1000:efee
1000:efe1          b032                           MOV AL,0x32
1000:efe3          8805                           MOV byte ptr [DI],AL
1000:efe5          c606926501                     MOV byte ptr [0x6592],0x1
1000:efea          90                             NOP
1000:efeb          eb0b                           JMP 0x1000:eff8
LAB_1000_efee:
1000:efee          b022                           MOV AL,0x22
1000:eff0          8805                           MOV byte ptr [DI],AL
1000:eff2          c606926501                     MOV byte ptr [0x6592],0x1
1000:eff7          90                             NOP
LAB_1000_eff8:
1000:eff8          8b3e6e06                       MOV DI,word ptr [0x66e]
1000:effc          83c71e                         ADD DI,0x1e
1000:efff          8b4408                         MOV AX,word ptr [SI + 0x8]
1000:f002          a38465                         MOV [0x6584],AX
1000:f005          8b440a                         MOV AX,word ptr [SI + 0xa]
1000:f008          a38865                         MOV [0x6588],AX
1000:f00b          8b440c                         MOV AX,word ptr [SI + 0xc]
1000:f00e          a38665                         MOV [0x6586],AX
1000:f011          8b440e                         MOV AX,word ptr [SI + 0xe]
1000:f014          a38a65                         MOV [0x658a],AX
1000:f017          8b04                           MOV AX,word ptr [SI]
1000:f019          03066a06                       ADD AX,word ptr [0x66a]
1000:f01d          034408                         ADD AX,word ptr [SI + 0x8]
1000:f020          a36865                         MOV [0x6568],AX
1000:f023          a36665                         MOV [0x6566],AX
1000:f026          8b4402                         MOV AX,word ptr [SI + 0x2]
1000:f029          03066c06                       ADD AX,word ptr [0x66c]
1000:f02d          03440a                         ADD AX,word ptr [SI + 0xa]
1000:f030          a36a65                         MOV [0x656a],AX
1000:f033          8b440c                         MOV AX,word ptr [SI + 0xc]
1000:f036          a36c65                         MOV [0x656c],AX
1000:f039          8b440e                         MOV AX,word ptr [SI + 0xe]
1000:f03c          a36e65                         MOV [0x656e],AX
1000:f03f          bace03                         MOV DX,0x3ce
1000:f042          a16065                         MOV AX,[0x6560]
1000:f045          8ed8                           MOV AX,DS
LAB_1000_f047:
1000:f047          2ea16a65                       MOV AX,CS:[0x656a]
1000:f04b          8bd8                           MOV BX,AX
1000:f04d          d1e0                           SHL AX,0x1
1000:f04f          d1e0                           SHL AX,0x1
1000:f051          03c3                           ADD AX,BX
1000:f053          d1e0                           SHL AX,0x1
1000:f055          d1e0                           SHL AX,0x1
1000:f057          d1e0                           SHL AX,0x1
1000:f059          2e8b366865                     MOV SI,word ptr CS:[0x6568]
1000:f05e          8bce                           MOV CX,SI
1000:f060          d1ee                           SHR SI,0x1
1000:f062          d1ee                           SHR SI,0x1
1000:f064          d1ee                           SHR SI,0x1
1000:f066          03f0                           ADD SI,AX
1000:f068          80e107                         AND CL,0x7
LAB_1000_f06b:
1000:f06b          b580                           MOV CH,0x80
1000:f06d          d2ed                           SHR CH,CL
1000:f06f          bb0000                         MOV BX,0x0
1000:f072          b80403                         MOV AX,0x304
1000:f075          ef                             OUT DX,AX
1000:f076          268a3c                         MOV BH,byte ptr ES:[SI]
1000:f079          22fd                           AND BH,CH
1000:f07b          f6df                           NEG BH
1000:f07d          d1c3                           ROL BX,0x1
1000:f07f          fecc                           DEC AH
1000:f081          ef                             OUT DX,AX
1000:f082          268a3c                         MOV BH,byte ptr ES:[SI]
1000:f085          22fd                           AND BH,CH
1000:f087          f6df                           NEG BH
1000:f089          d1c3                           ROL BX,0x1
1000:f08b          fecc                           DEC AH
1000:f08d          ef                             OUT DX,AX
1000:f08e          268a3c                         MOV BH,byte ptr ES:[SI]
1000:f091          22fd                           AND BH,CH
1000:f093          f6df                           NEG BH
1000:f095          d1c3                           ROL BX,0x1
1000:f097          fecc                           DEC AH
1000:f099          ef                             OUT DX,AX
1000:f09a          268a3c                         MOV BH,byte ptr ES:[SI]
1000:f09d          22fd                           AND BH,CH
1000:f09f          f6df                           NEG BH
1000:f0a1          d1c3                           ROL BX,0x1
1000:f0a3          2eff066865                     INC word ptr CS:[0x6568]
1000:f0a8          2ea16865                       MOV AX,CS:[0x6568]
1000:f0ac          2e3b066c65                     CMP AX,word ptr CS:[0x656c]
1000:f0b1          7203                           JC 0x1000:f0b6
1000:f0b3          e9be00                         JMP 0x1000:f174
LAB_1000_f0b6:
1000:f0b6          80fd01                         CMP CH,0x1
1000:f0b9          740b                           JZ 0x1000:f0c6
1000:f0bb          2e8b0e6865                     MOV CX,word ptr CS:[0x6568]
1000:f0c0          83e107                         AND CX,0x7
1000:f0c3          eb25                           JMP 0x1000:f0ea
LAB_1000_f0c6:
1000:f0c6          2e8b366865                     MOV SI,word ptr CS:[0x6568]
1000:f0cb          2ea16a65                       MOV AX,CS:[0x656a]
1000:f0cf          8bc8                           MOV CX,AX
1000:f0d1          d1e0                           SHL AX,0x1
1000:f0d3          d1e0                           SHL AX,0x1
1000:f0d5          03c1                           ADD AX,CX
1000:f0d7          d1e0                           SHL AX,0x1
1000:f0d9          d1e0                           SHL AX,0x1
1000:f0db          d1e0                           SHL AX,0x1
1000:f0dd          8bce                           MOV CX,SI
1000:f0df          d1ee                           SHR SI,0x1
1000:f0e1          d1ee                           SHR SI,0x1
1000:f0e3          d1ee                           SHR SI,0x1
1000:f0e5          03f0                           ADD SI,AX
1000:f0e7          83e107                         AND CX,0x7
LAB_1000_f0ea:
1000:f0ea          b580                           MOV CH,0x80
1000:f0ec          d2ed                           SHR CH,CL
1000:f0ee          b80403                         MOV AX,0x304
1000:f0f1          ef                             OUT DX,AX
1000:f0f2          268a3c                         MOV BH,byte ptr ES:[SI]
1000:f0f5          22fd                           AND BH,CH
1000:f0f7          f6df                           NEG BH
1000:f0f9          d1c3                           ROL BX,0x1
1000:f0fb          fecc                           DEC AH
1000:f0fd          ef                             OUT DX,AX
1000:f0fe          268a3c                         MOV BH,byte ptr ES:[SI]
1000:f101          22fd                           AND BH,CH
1000:f103          f6df                           NEG BH
1000:f105          d1c3                           ROL BX,0x1
1000:f107          fecc                           DEC AH
1000:f109          ef                             OUT DX,AX
1000:f10a          268a3c                         MOV BH,byte ptr ES:[SI]
1000:f10d          22fd                           AND BH,CH
1000:f10f          f6df                           NEG BH
1000:f111          d1c3                           ROL BX,0x1
1000:f113          fecc                           DEC AH
1000:f115          ef                             OUT DX,AX
1000:f116          268a3c                         MOV BH,byte ptr ES:[SI]
1000:f119          22fd                           AND BH,CH
1000:f11b          f6df                           NEG BH
1000:f11d          d1c3                           ROL BX,0x1
LAB_1000_f11f:
1000:f11f          2e321e9465                     XOR BL,byte ptr CS:[0x6594]
1000:f124          2e803e926500                   CMP byte ptr CS:[0x6592],0x0
1000:f12a          7402                           JZ 0x1000:f12e
1000:f12c          221d                           AND BL,byte ptr [DI]
LAB_1000_f12e:
1000:f12e          881d                           MOV byte ptr [DI],BL
1000:f130          47                             INC DI
1000:f131          2eff066865                     INC word ptr CS:[0x6568]
1000:f136          2ea16865                       MOV AX,CS:[0x6568]
1000:f13a          2e3b066c65                     CMP AX,word ptr CS:[0x656c]
1000:f13f          7313                           JNC 0x1000:f154
1000:f141          80fd01                         CMP CH,0x1
1000:f144          740b                           JZ 0x1000:f151
1000:f146          2e8b0e6865                     MOV CX,word ptr CS:[0x6568]
1000:f14b          83e107                         AND CX,0x7
1000:f14e          e91aff                         JMP 0x1000:f06b
LAB_1000_f151:
1000:f151          e9f3fe                         JMP 0x1000:f047
LAB_1000_f154:
1000:f154          2eff066a65                     INC word ptr CS:[0x656a]
1000:f159          2ea16665                       MOV AX,CS:[0x6566]
1000:f15d          2ea36865                       MOV CS:[0x6568],AX
1000:f161          2ea16a65                       MOV AX,CS:[0x656a]
1000:f165          2e3b066e65                     CMP AX,word ptr CS:[0x656e]
1000:f16a          7303                           JNC 0x1000:f16f
1000:f16c          e9d8fe                         JMP 0x1000:f047
LAB_1000_f16f:
1000:f16f          8cc8                           MOV AX,CS
1000:f171          8ed8                           MOV AX,DS
1000:f173          c3                             RET
LAB_1000_f174:
1000:f174          d1c3                           ROL BX,0x1
1000:f176          d1c3                           ROL BX,0x1
1000:f178          d1c3                           ROL BX,0x1
1000:f17a          d1c3                           ROL BX,0x1
1000:f17c          eba1                           JMP 0x1000:f11f
switchD_1000:9861::caseD_1:
1000:fa56          8bdf                           MOV BX,DI
1000:fa58          d1e3                           SHL BX,0x1
1000:fa5a          2e8b875541                     MOV AX,word ptr CS:[BX + 0x4155]
1000:fa5f          8bd9                           MOV BX,CX
1000:fa61          d1eb                           SHR BX,0x1
1000:fa63          03d8                           ADD BX,AX
LAB_1000_fa65:
1000:fa65          f7c10100                       TEST CX,0x1
1000:fa69          743b                           JZ 0x1000:faa6
1000:fa6b          8a04                           MOV AL,byte ptr [SI]
1000:fa6d          f7c50100                       TEST BP,0x1
1000:fa71          7508                           JNZ 0x1000:fa7b
1000:fa73          d0e8                           SHR AL,0x1
1000:fa75          d0e8                           SHR AL,0x1
1000:fa77          d0e8                           SHR AL,0x1
1000:fa79          d0e8                           SHR AL,0x1
LAB_1000_fa7b:
1000:fa7b          240f                           AND AL,0xf
1000:fa7d          2e32069465                     XOR AL,byte ptr CS:[0x6594]
1000:fa82          268a27                         MOV AH,byte ptr ES:[BX]
1000:fa85          2e803e956500                   CMP byte ptr CS:[0x6595],0x0
1000:fa8b          7403                           JZ 0x1000:fa90
1000:fa8d          262207                         AND AL,byte ptr ES:[BX]
LAB_1000_fa90:
1000:fa90          80e4f0                         AND AH,0xf0
1000:fa93          0ac4                           OR AL,AH
1000:fa95          268807                         MOV byte ptr ES:[BX],AL
1000:fa98          41                             INC CX
1000:fa99          45                             INC BP
1000:fa9a          43                             INC BX
1000:fa9b          f7c50100                       TEST BP,0x1
1000:fa9f          7501                           JNZ 0x1000:faa2
1000:faa1          46                             INC SI
LAB_1000_faa2:
1000:faa2          3bca                           CMP CX,DX
1000:faa4          7d3c                           JGE 0x1000:fae2
LAB_1000_faa6:
1000:faa6          8a04                           MOV AL,byte ptr [SI]
1000:faa8          f7c50100                       TEST BP,0x1
1000:faac          7408                           JZ 0x1000:fab6
1000:faae          d0e0                           SHL AL,0x1
1000:fab0          d0e0                           SHL AL,0x1
1000:fab2          d0e0                           SHL AL,0x1
1000:fab4          d0e0                           SHL AL,0x1
LAB_1000_fab6:
1000:fab6          24f0                           AND AL,0xf0
1000:fab8          2e32069465                     XOR AL,byte ptr CS:[0x6594]
1000:fabd          268a27                         MOV AH,byte ptr ES:[BX]
1000:fac0          2e803e956500                   CMP byte ptr CS:[0x6595],0x0
1000:fac6          7403                           JZ 0x1000:facb
1000:fac8          262207                         AND AL,byte ptr ES:[BX]
LAB_1000_facb:
1000:facb          80e40f                         AND AH,0xf
1000:face          0ac4                           OR AL,AH
1000:fad0          268807                         MOV byte ptr ES:[BX],AL
1000:fad3          41                             INC CX
1000:fad4          45                             INC BP
1000:fad5          f7c50100                       TEST BP,0x1
1000:fad9          7501                           JNZ 0x1000:fadc
1000:fadb          46                             INC SI
LAB_1000_fadc:
1000:fadc          3bca                           CMP CX,DX
1000:fade          7d02                           JGE 0x1000:fae2
1000:fae0          eb83                           JMP 0x1000:fa65
LAB_1000_fae2:
1000:fae2          47                             INC DI
1000:fae3          2e8b0e6865                     MOV CX,word ptr CS:[0x6568]
1000:fae8          f7c50100                       TEST BP,0x1
1000:faec          7402                           JZ 0x1000:faf0
1000:faee          46                             INC SI
1000:faef          45                             INC BP
LAB_1000_faf0:
1000:faf0          2e3b3e6e65                     CMP DI,word ptr CS:[0x656e]
1000:faf5          7d03                           JGE 0x1000:fafa
1000:faf7          e95cff                         JMP 0x1000:fa56
LAB_1000_fafa:
1000:fafa          8cc8                           MOV AX,CS
1000:fafc          8ed8                           MOV AX,DS
1000:fafe          e9f702                         JMP 0x1000:fdf8
LAB_1000_fdf8:
1000:fdf8          e8679f                         CALL 0x1000:9d62
1000:fdfb          b80000                         MOV AX,0x0
1000:fdfe          a31201                         MOV [0x112],AX
1000:fe01          c3                             RET
switchD_1000:9004::caseD_1:
1000:ff2a          a39170                         MOV [0x7091],AX
1000:ff2d          2ea1b206                       MOV AX,CS:[0x6b2]
1000:ff31          2ea39970                       MOV CS:[0x7099],AX
1000:ff35          8cc8                           MOV AX,CS
1000:ff37          2ea31e01                       MOV CS:[0x11e],AX
1000:ff3b          e80708                         CALL 0x1000:0745
1000:ff3e          2ea1b170                       MOV AX,CS:[0x70b1]
1000:ff42          2ea39170                       MOV CS:[0x7091],AX
1000:ff46          2ea1b370                       MOV AX,CS:[0x70b3]
1000:ff4a          2ea39970                       MOV CS:[0x7099],AX
1000:ff4e          c3                             RET
entry:
238e:0010          8cc0                           MOV AX,ES
238e:0012          051000                         ADD AX,0x10
238e:0015          0e                             PUSH CS
238e:0016          1f                             POP DS
238e:0017          a30400                         MOV [0x4],AX
238e:001a          03060c00                       ADD AX,word ptr [0xc]
238e:001e          8ec0                           MOV AX,ES
238e:0020          8b0e0600                       MOV CX,word ptr [0x6]
238e:0024          8bf9                           MOV DI,CX
238e:0026          4f                             DEC DI
238e:0027          8bf7                           MOV SI,DI
238e:0029          fd                             STD
238e:002a          f3a4                           MOVSB.REP ES:DI,SI
238e:002c          50                             PUSH AX
238e:002d          b83200                         MOV AX,0x32
238e:0030          50                             PUSH AX
238e:0031          cb                             RETF
