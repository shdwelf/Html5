; Ghidra 12.1.4
; Static disassembly only — the input was never executed
; Program: WVENCYCL.EXE
; SHA-256: 1eceb11ab373acfb08bd6a8e59c6bf1c26eec2404293229b84bbc177bb30dbd8
; Language: x86:LE:16:Protected Mode

FUN_1000_0002:
1000:0002          55                             PUSH BP
1000:0003          89e5                           MOV BP,SP
1000:0005          b80a00                         MOV AX,0xa
1000:0008          9acb036810                     CALLF 0x1068:03cb
1000:000d          83ec0a                         SUB SP,0xa
1000:0010          ff7610                         PUSH word ptr [BP + 0x10]
1000:0013          ff760e                         PUSH word ptr [BP + 0xe]
1000:0016          9aa0016010                     CALLF 0x1060:01a0
1000:001b          8946fa                         MOV word ptr [BP + -0x6],AX
1000:001e          8956fc                         MOV word ptr [BP + -0x4],DX
1000:0021          ff760c                         PUSH word ptr [BP + 0xc]
1000:0024          ff760a                         PUSH word ptr [BP + 0xa]
1000:0027          9aa0016010                     CALLF 0x1060:01a0
1000:002c          8946f6                         MOV word ptr [BP + -0xa],AX
1000:002f          8956f8                         MOV word ptr [BP + -0x8],DX
1000:0032          ff76fc                         PUSH word ptr [BP + -0x4]
1000:0035          ff76fa                         PUSH word ptr [BP + -0x6]
1000:0038          9a58016010                     CALLF 0x1060:0158
1000:003d          8946fa                         MOV word ptr [BP + -0x6],AX
1000:0040          8956fc                         MOV word ptr [BP + -0x4],DX
1000:0043          ff76f8                         PUSH word ptr [BP + -0x8]
1000:0046          ff76f6                         PUSH word ptr [BP + -0xa]
1000:0049          9a58016010                     CALLF 0x1060:0158
1000:004e          8946f6                         MOV word ptr [BP + -0xa],AX
1000:0051          8956f8                         MOV word ptr [BP + -0x8],DX
1000:0054          ff76fc                         PUSH word ptr [BP + -0x4]
1000:0057          ff76fa                         PUSH word ptr [BP + -0x6]
1000:005a          ff76f8                         PUSH word ptr [BP + -0x8]
1000:005d          ff76f6                         PUSH word ptr [BP + -0xa]
1000:0060          c47e06                         LES DI,[BP + 0x6]
1000:0063          06                             PUSH ES
1000:0064          57                             PUSH DI
1000:0065          9a88055010                     CALLF 0x1050:0588
1000:006a          8946fe                         MOV word ptr [BP + -0x2],AX
1000:006d          ff76fc                         PUSH word ptr [BP + -0x4]
1000:0070          ff76fa                         PUSH word ptr [BP + -0x6]
1000:0073          9a0d026010                     CALLF 0x1060:020d
1000:0078          ff76f8                         PUSH word ptr [BP + -0x8]
1000:007b          ff76f6                         PUSH word ptr [BP + -0xa]
1000:007e          9a0d026010                     CALLF 0x1060:020d
1000:0083          8b46fe                         MOV AX,word ptr [BP + -0x2]
1000:0086          c9                             LEAVE
1000:0087          ca0c00                         RETF 0xc
FUN_1000_008a:
1000:008a          55                             PUSH BP
1000:008b          89e5                           MOV BP,SP
1000:008d          31c0                           XOR AX,AX
1000:008f          9acb036810                     CALLF 0x1068:03cb
1000:0094          31ff                           XOR DI,DI
1000:0096          9aef036810                     CALLF 0x1068:03ef
1000:009b          7434                           JZ 0x1000:00d1
1000:009d          ff7612                         PUSH word ptr [BP + 0x12]
1000:00a0          ff7610                         PUSH word ptr [BP + 0x10]
1000:00a3          ff760e                         PUSH word ptr [BP + 0xe]
1000:00a6          ff760c                         PUSH word ptr [BP + 0xc]
1000:00a9          31c0                           XOR AX,AX
1000:00ab          50                             PUSH AX
1000:00ac          c47e06                         LES DI,[BP + 0x6]
1000:00af          06                             PUSH ES
1000:00b0          57                             PUSH DI
1000:00b1          9a02004810                     CALLF 0x1048:0002
1000:00b6          c47e06                         LES DI,[BP + 0x6]
1000:00b9          06                             PUSH ES
1000:00ba          57                             PUSH DI
1000:00bb          6a67                           PUSH 0x67
1000:00bd          b8c818                         MOV AX,0x18c8
1000:00c0          50                             PUSH AX
1000:00c1          31c0                           XOR AX,AX
1000:00c3          50                             PUSH AX
1000:00c4          50                             PUSH AX
1000:00c5          9add044810                     CALLF 0x1048:04dd
1000:00ca          a3c292                         MOV [0x92c2],AX
1000:00cd          8916c492                       MOV word ptr [0x92c4],DX
LAB_1000_00d1:
1000:00d1          c44606                         LES AX,[BP + 0x6]
1000:00d4          8cc2                           MOV DX,ES
1000:00d6          c9                             LEAVE
1000:00d7          ca0e00                         RETF 0xe
FUN_1000_00da:
1000:00da          55                             PUSH BP
1000:00db          89e5                           MOV BP,SP
1000:00dd          31c0                           XOR AX,AX
1000:00df          9acb036810                     CALLF 0x1068:03cb
1000:00e4          c47e06                         LES DI,[BP + 0x6]
1000:00e7          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:00eb          bf6e01                         MOV DI,0x16e
1000:00ee          1e                             PUSH DS
1000:00ef          57                             PUSH DI
1000:00f0          6a02                           PUSH 0x2
1000:00f2          6a00                           PUSH 0x0
1000:00f4          6a00                           PUSH 0x0
1000:00f6          9ab8015011                     CALLF 0x1150:01b8
1000:00fb          31c0                           XOR AX,AX
1000:00fd          50                             PUSH AX
1000:00fe          c47e06                         LES DI,[BP + 0x6]
1000:0101          06                             PUSH ES
1000:0102          57                             PUSH DI
1000:0103          9a7a004810                     CALLF 0x1048:007a
1000:0108          31ff                           XOR DI,DI
1000:010a          9a39046810                     CALLF 0x1068:0439
1000:010f          c9                             LEAVE
1000:0110          ca0600                         RETF 0x6
FUN_1000_0113:
1000:0113          55                             PUSH BP
1000:0114          89e5                           MOV BP,SP
1000:0116          b80400                         MOV AX,0x4
1000:0119          9acb036810                     CALLF 0x1068:03cb
1000:011e          83ec04                         SUB SP,0x4
1000:0121          c47e06                         LES DI,[BP + 0x6]
1000:0124          81c72c00                       ADD DI,0x2c
1000:0128          06                             PUSH ES
1000:0129          57                             PUSH DI
1000:012a          68c409                         PUSH 0x9c4
1000:012d          6a01                           PUSH 0x1
1000:012f          9a120d6810                     CALLF 0x1068:0d12
1000:0134          c47e06                         LES DI,[BP + 0x6]
1000:0137          81c7f009                       ADD DI,0x9f0
1000:013b          06                             PUSH ES
1000:013c          57                             PUSH DI
1000:013d          68a861                         PUSH 0x61a8
1000:0140          6a00                           PUSH 0x0
1000:0142          9a120d6810                     CALLF 0x1068:0d12
1000:0147          c47e06                         LES DI,[BP + 0x6]
1000:014a          81c7a892                       ADD DI,0x92a8
1000:014e          06                             PUSH ES
1000:014f          57                             PUSH DI
1000:0150          68c409                         PUSH 0x9c4
1000:0153          6a00                           PUSH 0x0
1000:0155          9a120d6810                     CALLF 0x1068:0d12
1000:015a          c47e06                         LES DI,[BP + 0x6]
1000:015d          81c76c9c                       ADD DI,0x9c6c
1000:0161          06                             PUSH ES
1000:0162          57                             PUSH DI
1000:0163          68c409                         PUSH 0x9c4
1000:0166          6a00                           PUSH 0x0
1000:0168          9a120d6810                     CALLF 0x1068:0d12
1000:016d          bfa244                         MOV DI,0x44a2
1000:0170          1e                             PUSH DS
1000:0171          57                             PUSH DI
1000:0172          681027                         PUSH 0x2710
1000:0175          6a00                           PUSH 0x0
1000:0177          9a120d6810                     CALLF 0x1068:0d12
1000:017c          bfb26b                         MOV DI,0x6bb2
1000:017f          1e                             PUSH DS
1000:0180          57                             PUSH DI
1000:0181          681027                         PUSH 0x2710
1000:0184          6a00                           PUSH 0x0
1000:0186          9a120d6810                     CALLF 0x1068:0d12
1000:018b          c9                             LEAVE
1000:018c          ca0400                         RETF 0x4
FUN_1000_0195:
1000:0195          55                             PUSH BP
1000:0196          89e5                           MOV BP,SP
1000:0198          b80202                         MOV AX,0x202
1000:019b          9acb036810                     CALLF 0x1068:03cb
1000:01a0          81ec0202                       SUB SP,0x202
1000:01a4          8dbefefd                       LEA DI,[BP + 0xfdfe]
1000:01a8          16                             PUSH SS
1000:01a9          57                             PUSH DI
1000:01aa          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:01af          c47e06                         LES DI,[BP + 0x6]
1000:01b2          03f8                           ADD DI,AX
1000:01b4          268a85e609                     MOV AL,byte ptr ES:[DI + 0x9e6]
1000:01b9          30e4                           XOR AH,AH
1000:01bb          6bf83d                         IMUL DI,AX,0x3d
1000:01be          81c73802                       ADD DI,0x238
1000:01c2          1e                             PUSH DS
1000:01c3          57                             PUSH DI
1000:01c4          9a91086810                     CALLF 0x1068:0891
1000:01c9          bf8f01                         MOV DI,0x18f
1000:01cc          0e                             PUSH CS
1000:01cd          57                             PUSH DI
1000:01ce          9a10096810                     CALLF 0x1068:0910
1000:01d3          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:01d8          c47e06                         LES DI,[BP + 0x6]
1000:01db          03f8                           ADD DI,AX
1000:01dd          268a85e709                     MOV AL,byte ptr ES:[DI + 0x9e7]
1000:01e2          30e4                           XOR AH,AH
1000:01e4          6bf83d                         IMUL DI,AX,0x3d
1000:01e7          81c7a603                       ADD DI,0x3a6
1000:01eb          1e                             PUSH DS
1000:01ec          57                             PUSH DI
1000:01ed          9a10096810                     CALLF 0x1068:0910
1000:01f2          bf8f01                         MOV DI,0x18f
1000:01f5          0e                             PUSH CS
1000:01f6          57                             PUSH DI
1000:01f7          9a10096810                     CALLF 0x1068:0910
1000:01fc          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:0201          c47e06                         LES DI,[BP + 0x6]
1000:0204          03f8                           ADD DI,AX
1000:0206          268a85e809                     MOV AL,byte ptr ES:[DI + 0x9e8]
1000:020b          30e4                           XOR AH,AH
1000:020d          6bf851                         IMUL DI,AX,0x51
1000:0210          81c71405                       ADD DI,0x514
1000:0214          1e                             PUSH DS
1000:0215          57                             PUSH DI
1000:0216          9a10096810                     CALLF 0x1068:0910
1000:021b          bf8f01                         MOV DI,0x18f
1000:021e          0e                             PUSH CS
1000:021f          57                             PUSH DI
1000:0220          9a10096810                     CALLF 0x1068:0910
1000:0225          bfc893                         MOV DI,0x93c8
1000:0228          1e                             PUSH DS
1000:0229          57                             PUSH DI
1000:022a          9a10096810                     CALLF 0x1068:0910
1000:022f          bf8f01                         MOV DI,0x18f
1000:0232          0e                             PUSH CS
1000:0233          57                             PUSH DI
1000:0234          9a10096810                     CALLF 0x1068:0910
1000:0239          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:023d          16                             PUSH SS
1000:023e          57                             PUSH DI
1000:023f          68ff00                         PUSH 0xff
1000:0242          9aab086810                     CALLF 0x1068:08ab
LAB_1000_0247:
1000:0247          bf9101                         MOV DI,0x191
1000:024a          0e                             PUSH CS
1000:024b          57                             PUSH DI
1000:024c          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0250          16                             PUSH SS
1000:0251          57                             PUSH DI
1000:0252          9a3c096810                     CALLF 0x1068:093c
1000:0257          09c0                           OR AX,AX
1000:0259          7453                           JZ 0x1000:02ae
1000:025b          bf9101                         MOV DI,0x191
1000:025e          0e                             PUSH CS
1000:025f          57                             PUSH DI
1000:0260          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0264          16                             PUSH SS
1000:0265          57                             PUSH DI
1000:0266          9a3c096810                     CALLF 0x1068:093c
1000:026b          8846ff                         MOV byte ptr [BP + -0x1],AL
1000:026e          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0272          16                             PUSH SS
1000:0273          57                             PUSH DI
1000:0274          8a46ff                         MOV AL,byte ptr [BP + -0x1]
1000:0277          30e4                           XOR AH,AH
1000:0279          50                             PUSH AX
1000:027a          6a03                           PUSH 0x3
1000:027c          9a6d031010                     CALLF 0x1010:036d
1000:0281          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:0286          c47e06                         LES DI,[BP + 0x6]
1000:0289          03f8                           ADD DI,AX
1000:028b          268a85ef09                     MOV AL,byte ptr ES:[DI + 0x9ef]
1000:0290          30e4                           XOR AH,AH
1000:0292          6bf815                         IMUL DI,AX,0x15
1000:0295          81c75e16                       ADD DI,0x165e
1000:0299          1e                             PUSH DS
1000:029a          57                             PUSH DI
1000:029b          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:029f          16                             PUSH SS
1000:02a0          57                             PUSH DI
1000:02a1          8a46ff                         MOV AL,byte ptr [BP + -0x1]
1000:02a4          30e4                           XOR AH,AH
1000:02a6          50                             PUSH AX
1000:02a7          9aeb021010                     CALLF 0x1010:02eb
1000:02ac          eb99                           JMP 0x1000:0247
LAB_1000_02ae:
1000:02ae          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:02b2          16                             PUSH SS
1000:02b3          57                             PUSH DI
1000:02b4          c47e0a                         LES DI,[BP + 0xa]
1000:02b7          06                             PUSH ES
1000:02b8          57                             PUSH DI
1000:02b9          68ff00                         PUSH 0xff
1000:02bc          9aab086810                     CALLF 0x1068:08ab
1000:02c1          c9                             LEAVE
1000:02c2          ca0400                         RETF 0x4
FUN_1000_02cb:
1000:02cb          55                             PUSH BP
1000:02cc          89e5                           MOV BP,SP
1000:02ce          b80202                         MOV AX,0x202
1000:02d1          9acb036810                     CALLF 0x1068:03cb
1000:02d6          81ec0202                       SUB SP,0x202
1000:02da          8dbefefd                       LEA DI,[BP + 0xfdfe]
1000:02de          16                             PUSH SS
1000:02df          57                             PUSH DI
1000:02e0          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:02e5          c47e06                         LES DI,[BP + 0x6]
1000:02e8          03f8                           ADD DI,AX
1000:02ea          268a85ea09                     MOV AL,byte ptr ES:[DI + 0x9ea]
1000:02ef          30e4                           XOR AH,AH
1000:02f1          6bf851                         IMUL DI,AX,0x51
1000:02f4          81c7760a                       ADD DI,0xa76
1000:02f8          1e                             PUSH DS
1000:02f9          57                             PUSH DI
1000:02fa          9a91086810                     CALLF 0x1068:0891
1000:02ff          bfc502                         MOV DI,0x2c5
1000:0302          0e                             PUSH CS
1000:0303          57                             PUSH DI
1000:0304          9a10096810                     CALLF 0x1068:0910
1000:0309          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:030e          c47e06                         LES DI,[BP + 0x6]
1000:0311          03f8                           ADD DI,AX
1000:0313          268a85eb09                     MOV AL,byte ptr ES:[DI + 0x9eb]
1000:0318          30e4                           XOR AH,AH
1000:031a          6bf851                         IMUL DI,AX,0x51
1000:031d          81c7ba0b                       ADD DI,0xbba
1000:0321          1e                             PUSH DS
1000:0322          57                             PUSH DI
1000:0323          9a10096810                     CALLF 0x1068:0910
1000:0328          bfc502                         MOV DI,0x2c5
1000:032b          0e                             PUSH CS
1000:032c          57                             PUSH DI
1000:032d          9a10096810                     CALLF 0x1068:0910
1000:0332          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:0337          c47e06                         LES DI,[BP + 0x6]
1000:033a          03f8                           ADD DI,AX
1000:033c          268a85ec09                     MOV AL,byte ptr ES:[DI + 0x9ec]
1000:0341          30e4                           XOR AH,AH
1000:0343          6bf85b                         IMUL DI,AX,0x5b
1000:0346          81c7420e                       ADD DI,0xe42
1000:034a          1e                             PUSH DS
1000:034b          57                             PUSH DI
1000:034c          9a10096810                     CALLF 0x1068:0910
1000:0351          bfc502                         MOV DI,0x2c5
1000:0354          0e                             PUSH CS
1000:0355          57                             PUSH DI
1000:0356          9a10096810                     CALLF 0x1068:0910
1000:035b          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:0360          c47e06                         LES DI,[BP + 0x6]
1000:0363          03f8                           ADD DI,AX
1000:0365          268a85ed09                     MOV AL,byte ptr ES:[DI + 0x9ed]
1000:036a          30e4                           XOR AH,AH
1000:036c          6bf851                         IMUL DI,AX,0x51
1000:036f          81c70a10                       ADD DI,0x100a
1000:0373          1e                             PUSH DS
1000:0374          57                             PUSH DI
1000:0375          9a10096810                     CALLF 0x1068:0910
1000:037a          bfc502                         MOV DI,0x2c5
1000:037d          0e                             PUSH CS
1000:037e          57                             PUSH DI
1000:037f          9a10096810                     CALLF 0x1068:0910
1000:0384          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:0388          16                             PUSH SS
1000:0389          57                             PUSH DI
1000:038a          68ff00                         PUSH 0xff
1000:038d          9aab086810                     CALLF 0x1068:08ab
LAB_1000_0392:
1000:0392          bfc702                         MOV DI,0x2c7
1000:0395          0e                             PUSH CS
1000:0396          57                             PUSH DI
1000:0397          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:039b          16                             PUSH SS
1000:039c          57                             PUSH DI
1000:039d          9a3c096810                     CALLF 0x1068:093c
1000:03a2          09c0                           OR AX,AX
1000:03a4          7456                           JZ 0x1000:03fc
1000:03a6          bfc702                         MOV DI,0x2c7
1000:03a9          0e                             PUSH CS
1000:03aa          57                             PUSH DI
1000:03ab          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:03af          16                             PUSH SS
1000:03b0          57                             PUSH DI
1000:03b1          9a3c096810                     CALLF 0x1068:093c
1000:03b6          8886fffe                       MOV byte ptr [BP + 0xfeff],AL
1000:03ba          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:03be          16                             PUSH SS
1000:03bf          57                             PUSH DI
1000:03c0          8a86fffe                       MOV AL,byte ptr [BP + 0xfeff]
1000:03c4          30e4                           XOR AH,AH
1000:03c6          50                             PUSH AX
1000:03c7          6a03                           PUSH 0x3
1000:03c9          9a6d031010                     CALLF 0x1010:036d
1000:03ce          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:03d3          c47e06                         LES DI,[BP + 0x6]
1000:03d6          03f8                           ADD DI,AX
1000:03d8          268a85ef09                     MOV AL,byte ptr ES:[DI + 0x9ef]
1000:03dd          30e4                           XOR AH,AH
1000:03df          6bf815                         IMUL DI,AX,0x15
1000:03e2          81c75e16                       ADD DI,0x165e
1000:03e6          1e                             PUSH DS
1000:03e7          57                             PUSH DI
1000:03e8          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:03ec          16                             PUSH SS
1000:03ed          57                             PUSH DI
1000:03ee          8a86fffe                       MOV AL,byte ptr [BP + 0xfeff]
1000:03f2          30e4                           XOR AH,AH
1000:03f4          50                             PUSH AX
1000:03f5          9aeb021010                     CALLF 0x1010:02eb
1000:03fa          eb96                           JMP 0x1000:0392
LAB_1000_03fc:
1000:03fc          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:0400          16                             PUSH SS
1000:0401          57                             PUSH DI
1000:0402          c47e0a                         LES DI,[BP + 0xa]
1000:0405          06                             PUSH ES
1000:0406          57                             PUSH DI
1000:0407          68ff00                         PUSH 0xff
1000:040a          9aab086810                     CALLF 0x1068:08ab
1000:040f          c9                             LEAVE
1000:0410          ca0400                         RETF 0x4
FUN_1000_04a8:
1000:04a8          55                             PUSH BP
1000:04a9          89e5                           MOV BP,SP
1000:04ab          b88805                         MOV AX,0x588
1000:04ae          9acb036810                     CALLF 0x1068:03cb
1000:04b3          81ec8805                       SUB SP,0x588
1000:04b7          c686fefe00                     MOV byte ptr [BP + 0xfefe],0x0
1000:04bc          a1ca94                         MOV AX,[0x94ca]
1000:04bf          c47e06                         LES DI,[BP + 0x6]
1000:04c2          03f8                           ADD DI,AX
1000:04c4          2680bd6b9c01                   CMP byte ptr ES:[DI + 0x9c6b],0x1
1000:04ca          764f                           JBE 0x1000:051b
1000:04cc          8dbe78fa                       LEA DI,[BP + 0xfa78]
1000:04d0          16                             PUSH SS
1000:04d1          57                             PUSH DI
1000:04d2          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:04d6          16                             PUSH SS
1000:04d7          57                             PUSH DI
1000:04d8          9a91086810                     CALLF 0x1068:0891
1000:04dd          8dbe78fb                       LEA DI,[BP + 0xfb78]
1000:04e1          16                             PUSH SS
1000:04e2          57                             PUSH DI
1000:04e3          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:04e7          16                             PUSH SS
1000:04e8          57                             PUSH DI
1000:04e9          a1ca94                         MOV AX,[0x94ca]
1000:04ec          c47e06                         LES DI,[BP + 0x6]
1000:04ef          03f8                           ADD DI,AX
1000:04f1          268a856b9c                     MOV AL,byte ptr ES:[DI + 0x9c6b]
1000:04f6          30e4                           XOR AH,AH
1000:04f8          50                             PUSH AX
1000:04f9          9a90001010                     CALLF 0x1010:0090
1000:04fe          bf1304                         MOV DI,0x413
1000:0501          0e                             PUSH CS
1000:0502          57                             PUSH DI
1000:0503          9a5a021010                     CALLF 0x1010:025a
1000:0508          9a10096810                     CALLF 0x1068:0910
1000:050d          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0511          16                             PUSH SS
1000:0512          57                             PUSH DI
1000:0513          68ff00                         PUSH 0xff
1000:0516          9aab086810                     CALLF 0x1068:08ab
LAB_1000_051b:
1000:051b          a1ca94                         MOV AX,[0x94ca]
1000:051e          c47e06                         LES DI,[BP + 0x6]
1000:0521          03f8                           ADD DI,AX
1000:0523          2680bd6b9c01                   CMP byte ptr ES:[DI + 0x9c6b],0x1
1000:0529          7529                           JNZ 0x1000:0554
1000:052b          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:052f          16                             PUSH SS
1000:0530          57                             PUSH DI
1000:0531          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0535          16                             PUSH SS
1000:0536          57                             PUSH DI
1000:0537          9a91086810                     CALLF 0x1068:0891
1000:053c          bf3704                         MOV DI,0x437
1000:053f          0e                             PUSH CS
1000:0540          57                             PUSH DI
1000:0541          9a10096810                     CALLF 0x1068:0910
1000:0546          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:054a          16                             PUSH SS
1000:054b          57                             PUSH DI
1000:054c          68ff00                         PUSH 0xff
1000:054f          9aab086810                     CALLF 0x1068:08ab
LAB_1000_0554:
1000:0554          a1ca94                         MOV AX,[0x94ca]
1000:0557          c47e06                         LES DI,[BP + 0x6]
1000:055a          03f8                           ADD DI,AX
1000:055c          2680bd6b9c00                   CMP byte ptr ES:[DI + 0x9c6b],0x0
1000:0562          7703                           JA 0x1000:0567
1000:0564          e91f04                         JMP 0x1000:0986
LAB_1000_0567:
1000:0567          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:056b          16                             PUSH SS
1000:056c          57                             PUSH DI
1000:056d          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:0571          16                             PUSH SS
1000:0572          57                             PUSH DI
1000:0573          bfac99                         MOV DI,0x99ac
1000:0576          1e                             PUSH DS
1000:0577          57                             PUSH DI
1000:0578          9a91086810                     CALLF 0x1068:0891
1000:057d          bf5704                         MOV DI,0x457
1000:0580          0e                             PUSH CS
1000:0581          57                             PUSH DI
1000:0582          9a10096810                     CALLF 0x1068:0910
1000:0587          9a67066810                     CALLF 0x1068:0667
1000:058c          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:0590          16                             PUSH SS
1000:0591          57                             PUSH DI
1000:0592          6a01                           PUSH 0x1
1000:0594          9aab066810                     CALLF 0x1068:06ab
1000:0599          9a8f036810                     CALLF 0x1068:038f
1000:059e          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:05a2          16                             PUSH SS
1000:05a3          57                             PUSH DI
1000:05a4          8b3eca94                       MOV DI,word ptr [0x94ca]
1000:05a8          c1e702                         SHL DI,0x2
1000:05ab          ffb5901d                       PUSH word ptr [DI + 0x1d90]
1000:05af          ffb58e1d                       PUSH word ptr [DI + 0x1d8e]
1000:05b3          9afe076810                     CALLF 0x1068:07fe
1000:05b8          9a8f036810                     CALLF 0x1068:038f
1000:05bd          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:05c1          16                             PUSH SS
1000:05c2          57                             PUSH DI
1000:05c3          8dbe7dfe                       LEA DI,[BP + 0xfe7d]
1000:05c7          16                             PUSH SS
1000:05c8          57                             PUSH DI
1000:05c9          9a60076810                     CALLF 0x1068:0760
1000:05ce          83c404                         ADD SP,0x4
1000:05d1          9a8f036810                     CALLF 0x1068:038f
1000:05d6          8a867dfe                       MOV AL,byte ptr [BP + 0xfe7d]
1000:05da          88867cfe                       MOV byte ptr [BP + 0xfe7c],AL
1000:05de          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:05e2          16                             PUSH SS
1000:05e3          57                             PUSH DI
1000:05e4          8dbe7dfe                       LEA DI,[BP + 0xfe7d]
1000:05e8          16                             PUSH SS
1000:05e9          57                             PUSH DI
1000:05ea          9a60076810                     CALLF 0x1068:0760
1000:05ef          83c404                         ADD SP,0x4
1000:05f2          9a8f036810                     CALLF 0x1068:038f
1000:05f7          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:05fb          16                             PUSH SS
1000:05fc          57                             PUSH DI
1000:05fd          8dbe7dfe                       LEA DI,[BP + 0xfe7d]
1000:0601          16                             PUSH SS
1000:0602          57                             PUSH DI
1000:0603          9a60076810                     CALLF 0x1068:0760
1000:0608          83c404                         ADD SP,0x4
1000:060b          9a8f036810                     CALLF 0x1068:038f
1000:0610          c6867afd00                     MOV byte ptr [BP + 0xfd7a],0x0
1000:0615          8a867cfe                       MOV AL,byte ptr [BP + 0xfe7c]
1000:0619          30e4                           XOR AH,AH
1000:061b          48                             DEC AX
1000:061c          48                             DEC AX
1000:061d          888678fd                       MOV byte ptr [BP + 0xfd78],AL
1000:0621          b001                           MOV AL,0x1
1000:0623          3a8678fd                       CMP AL,byte ptr [BP + 0xfd78]
1000:0627          7761                           JA 0x1000:068a
1000:0629          88867bfe                       MOV byte ptr [BP + 0xfe7b],AL
1000:062d          eb04                           JMP 0x1000:0633
LAB_1000_062f:
1000:062f          fe867bfe                       INC byte ptr [BP + 0xfe7b]
LAB_1000_0633:
1000:0633          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:0637          16                             PUSH SS
1000:0638          57                             PUSH DI
1000:0639          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:063d          16                             PUSH SS
1000:063e          57                             PUSH DI
1000:063f          9a60076810                     CALLF 0x1068:0760
1000:0644          83c404                         ADD SP,0x4
1000:0647          9a8f036810                     CALLF 0x1068:038f
1000:064c          8dbe78fb                       LEA DI,[BP + 0xfb78]
1000:0650          16                             PUSH SS
1000:0651          57                             PUSH DI
1000:0652          8dbe7afd                       LEA DI,[BP + 0xfd7a]
1000:0656          16                             PUSH SS
1000:0657          57                             PUSH DI
1000:0658          9a91086810                     CALLF 0x1068:0891
1000:065d          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:0661          16                             PUSH SS
1000:0662          57                             PUSH DI
1000:0663          8a867afe                       MOV AL,byte ptr [BP + 0xfe7a]
1000:0667          50                             PUSH AX
1000:0668          9aad096810                     CALLF 0x1068:09ad
1000:066d          9a10096810                     CALLF 0x1068:0910
1000:0672          8dbe7afd                       LEA DI,[BP + 0xfd7a]
1000:0676          16                             PUSH SS
1000:0677          57                             PUSH DI
1000:0678          68ff00                         PUSH 0xff
1000:067b          9aab086810                     CALLF 0x1068:08ab
1000:0680          8a867bfe                       MOV AL,byte ptr [BP + 0xfe7b]
1000:0684          3a8678fd                       CMP AL,byte ptr [BP + 0xfd78]
1000:0688          75a5                           JNZ 0x1000:062f
LAB_1000_068a:
1000:068a          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:068e          16                             PUSH SS
1000:068f          57                             PUSH DI
1000:0690          8b3eca94                       MOV DI,word ptr [0x94ca]
1000:0694          c1e702                         SHL DI,0x2
1000:0697          ffb5a044                       PUSH word ptr [DI + 0x44a0]
1000:069b          ffb59e44                       PUSH word ptr [DI + 0x449e]
1000:069f          9afe076810                     CALLF 0x1068:07fe
1000:06a4          9a8f036810                     CALLF 0x1068:038f
1000:06a9          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:06ad          16                             PUSH SS
1000:06ae          57                             PUSH DI
1000:06af          8dbe7dfe                       LEA DI,[BP + 0xfe7d]
1000:06b3          16                             PUSH SS
1000:06b4          57                             PUSH DI
1000:06b5          9a60076810                     CALLF 0x1068:0760
1000:06ba          83c404                         ADD SP,0x4
1000:06bd          9a8f036810                     CALLF 0x1068:038f
1000:06c2          8a867dfe                       MOV AL,byte ptr [BP + 0xfe7d]
1000:06c6          88867cfe                       MOV byte ptr [BP + 0xfe7c],AL
1000:06ca          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:06ce          16                             PUSH SS
1000:06cf          57                             PUSH DI
1000:06d0          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:06d4          16                             PUSH SS
1000:06d5          57                             PUSH DI
1000:06d6          9a91086810                     CALLF 0x1068:0891
1000:06db          bf6304                         MOV DI,0x463
1000:06de          0e                             PUSH CS
1000:06df          57                             PUSH DI
1000:06e0          9a10096810                     CALLF 0x1068:0910
1000:06e5          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:06e9          16                             PUSH SS
1000:06ea          57                             PUSH DI
1000:06eb          68ff00                         PUSH 0xff
1000:06ee          9aab086810                     CALLF 0x1068:08ab
1000:06f3          8a867cfe                       MOV AL,byte ptr [BP + 0xfe7c]
1000:06f7          888678fd                       MOV byte ptr [BP + 0xfd78],AL
1000:06fb          b001                           MOV AL,0x1
1000:06fd          3a8678fd                       CMP AL,byte ptr [BP + 0xfd78]
1000:0701          7603                           JBE 0x1000:0706
1000:0703          e9d400                         JMP 0x1000:07da
LAB_1000_0706:
1000:0706          88867bfe                       MOV byte ptr [BP + 0xfe7b],AL
1000:070a          eb04                           JMP 0x1000:0710
LAB_1000_070c:
1000:070c          fe867bfe                       INC byte ptr [BP + 0xfe7b]
LAB_1000_0710:
1000:0710          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:0714          16                             PUSH SS
1000:0715          57                             PUSH DI
1000:0716          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:071a          16                             PUSH SS
1000:071b          57                             PUSH DI
1000:071c          9a60076810                     CALLF 0x1068:0760
1000:0721          83c404                         ADD SP,0x4
1000:0724          9a8f036810                     CALLF 0x1068:038f
1000:0729          80be7afe2c                     CMP byte ptr [BP + 0xfe7a],0x2c
1000:072e          7529                           JNZ 0x1000:0759
1000:0730          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:0734          16                             PUSH SS
1000:0735          57                             PUSH DI
1000:0736          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:073a          16                             PUSH SS
1000:073b          57                             PUSH DI
1000:073c          9a91086810                     CALLF 0x1068:0891
1000:0741          bf6304                         MOV DI,0x463
1000:0744          0e                             PUSH CS
1000:0745          57                             PUSH DI
1000:0746          9a10096810                     CALLF 0x1068:0910
1000:074b          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:074f          16                             PUSH SS
1000:0750          57                             PUSH DI
1000:0751          68ff00                         PUSH 0xff
1000:0754          9aab086810                     CALLF 0x1068:08ab
LAB_1000_0759:
1000:0759          8dbe78fb                       LEA DI,[BP + 0xfb78]
1000:075d          16                             PUSH SS
1000:075e          57                             PUSH DI
1000:075f          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0763          16                             PUSH SS
1000:0764          57                             PUSH DI
1000:0765          9a91086810                     CALLF 0x1068:0891
1000:076a          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:076e          16                             PUSH SS
1000:076f          57                             PUSH DI
1000:0770          8a867afe                       MOV AL,byte ptr [BP + 0xfe7a]
1000:0774          50                             PUSH AX
1000:0775          9aad096810                     CALLF 0x1068:09ad
1000:077a          9a10096810                     CALLF 0x1068:0910
1000:077f          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0783          16                             PUSH SS
1000:0784          57                             PUSH DI
1000:0785          68ff00                         PUSH 0xff
1000:0788          9aab086810                     CALLF 0x1068:08ab
1000:078d          80be7afe20                     CMP byte ptr [BP + 0xfe7a],0x20
1000:0792          7539                           JNZ 0x1000:07cd
1000:0794          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1000:0798          30e4                           XOR AH,AH
1000:079a          48                             DEC AX
1000:079b          8bf8                           MOV DI,AX
1000:079d          80bbfefe2c                     CMP byte ptr [BP + DI + 0xfefe],0x2c
1000:07a2          7529                           JNZ 0x1000:07cd
1000:07a4          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:07a8          16                             PUSH SS
1000:07a9          57                             PUSH DI
1000:07aa          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:07ae          16                             PUSH SS
1000:07af          57                             PUSH DI
1000:07b0          9a91086810                     CALLF 0x1068:0891
1000:07b5          bf6304                         MOV DI,0x463
1000:07b8          0e                             PUSH CS
1000:07b9          57                             PUSH DI
1000:07ba          9a10096810                     CALLF 0x1068:0910
1000:07bf          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:07c3          16                             PUSH SS
1000:07c4          57                             PUSH DI
1000:07c5          68ff00                         PUSH 0xff
1000:07c8          9aab086810                     CALLF 0x1068:08ab
LAB_1000_07cd:
1000:07cd          8a867bfe                       MOV AL,byte ptr [BP + 0xfe7b]
1000:07d1          3a8678fd                       CMP AL,byte ptr [BP + 0xfd78]
1000:07d5          7403                           JZ 0x1000:07da
1000:07d7          e932ff                         JMP 0x1000:070c
LAB_1000_07da:
1000:07da          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1000:07de          30e4                           XOR AH,AH
1000:07e0          8bf8                           MOV DI,AX
1000:07e2          80bbfefe2c                     CMP byte ptr [BP + DI + 0xfefe],0x2c
1000:07e7          7504                           JNZ 0x1000:07ed
1000:07e9          fe8efefe                       DEC byte ptr [BP + 0xfefe]
LAB_1000_07ed:
1000:07ed          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:07f1          16                             PUSH SS
1000:07f2          57                             PUSH DI
1000:07f3          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:07f7          16                             PUSH SS
1000:07f8          57                             PUSH DI
1000:07f9          9a91086810                     CALLF 0x1068:0891
1000:07fe          bf6304                         MOV DI,0x463
1000:0801          0e                             PUSH CS
1000:0802          57                             PUSH DI
1000:0803          9a10096810                     CALLF 0x1068:0910
1000:0808          bf6504                         MOV DI,0x465
1000:080b          0e                             PUSH CS
1000:080c          57                             PUSH DI
1000:080d          9a10096810                     CALLF 0x1068:0910
1000:0812          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0816          16                             PUSH SS
1000:0817          57                             PUSH DI
1000:0818          68ff00                         PUSH 0xff
1000:081b          9aab086810                     CALLF 0x1068:08ab
1000:0820          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1000:0824          30e4                           XOR AH,AH
1000:0826          48                             DEC AX
1000:0827          48                             DEC AX
1000:0828          88867bfe                       MOV byte ptr [BP + 0xfe7b],AL
1000:082c          c68679fd00                     MOV byte ptr [BP + 0xfd79],0x0
LAB_1000_0831:
1000:0831          fe8e7bfe                       DEC byte ptr [BP + 0xfe7b]
1000:0835          8a867bfe                       MOV AL,byte ptr [BP + 0xfe7b]
1000:0839          30e4                           XOR AH,AH
1000:083b          8bf8                           MOV DI,AX
1000:083d          80bbfefe2c                     CMP byte ptr [BP + DI + 0xfefe],0x2c
1000:0842          7545                           JNZ 0x1000:0889
1000:0844          a1ca94                         MOV AX,[0x94ca]
1000:0847          c47e06                         LES DI,[BP + 0x6]
1000:084a          03f8                           ADD DI,AX
1000:084c          2680bd6b9c02                   CMP byte ptr ES:[DI + 0x9c6b],0x2
1000:0852          7518                           JNZ 0x1000:086c
1000:0854          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0858          16                             PUSH SS
1000:0859          57                             PUSH DI
1000:085a          8a867bfe                       MOV AL,byte ptr [BP + 0xfe7b]
1000:085e          30e4                           XOR AH,AH
1000:0860          50                             PUSH AX
1000:0861          6a01                           PUSH 0x1
1000:0863          9a6d031010                     CALLF 0x1010:036d
1000:0868          fe8e7bfe                       DEC byte ptr [BP + 0xfe7b]
LAB_1000_086c:
1000:086c          bf6804                         MOV DI,0x468
1000:086f          0e                             PUSH CS
1000:0870          57                             PUSH DI
1000:0871          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0875          16                             PUSH SS
1000:0876          57                             PUSH DI
1000:0877          8a867bfe                       MOV AL,byte ptr [BP + 0xfe7b]
1000:087b          30e4                           XOR AH,AH
1000:087d          40                             INC AX
1000:087e          50                             PUSH AX
1000:087f          9aeb021010                     CALLF 0x1010:02eb
1000:0884          c68679fd01                     MOV byte ptr [BP + 0xfd79],0x1
LAB_1000_0889:
1000:0889          8a867cfe                       MOV AL,byte ptr [BP + 0xfe7c]
1000:088d          30e4                           XOR AH,AH
1000:088f          8bd0                           MOV DX,AX
1000:0891          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1000:0895          30e4                           XOR AH,AH
1000:0897          2bc2                           SUB AX,DX
1000:0899          48                             DEC AX
1000:089a          48                             DEC AX
1000:089b          8bd0                           MOV DX,AX
1000:089d          8a867bfe                       MOV AL,byte ptr [BP + 0xfe7b]
1000:08a1          30e4                           XOR AH,AH
1000:08a3          3bc2                           CMP AX,DX
1000:08a5          7407                           JZ 0x1000:08ae
1000:08a7          80be79fd00                     CMP byte ptr [BP + 0xfd79],0x0
1000:08ac          7483                           JZ 0x1000:0831
LAB_1000_08ae:
1000:08ae          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:08b2          16                             PUSH SS
1000:08b3          57                             PUSH DI
1000:08b4          bf6304                         MOV DI,0x463
1000:08b7          0e                             PUSH CS
1000:08b8          57                             PUSH DI
1000:08b9          9a91086810                     CALLF 0x1068:0891
1000:08be          bf921c                         MOV DI,0x1c92
1000:08c1          1e                             PUSH DS
1000:08c2          57                             PUSH DI
1000:08c3          9a10096810                     CALLF 0x1068:0910
1000:08c8          bf6304                         MOV DI,0x463
1000:08cb          0e                             PUSH CS
1000:08cc          57                             PUSH DI
1000:08cd          9a10096810                     CALLF 0x1068:0910
1000:08d2          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:08d6          16                             PUSH SS
1000:08d7          57                             PUSH DI
1000:08d8          9a3c096810                     CALLF 0x1068:093c
1000:08dd          09c0                           OR AX,AX
1000:08df          7461                           JZ 0x1000:0942
1000:08e1          8dbe78fb                       LEA DI,[BP + 0xfb78]
1000:08e5          16                             PUSH SS
1000:08e6          57                             PUSH DI
1000:08e7          bf6304                         MOV DI,0x463
1000:08ea          0e                             PUSH CS
1000:08eb          57                             PUSH DI
1000:08ec          9a91086810                     CALLF 0x1068:0891
1000:08f1          bf921c                         MOV DI,0x1c92
1000:08f4          1e                             PUSH DS
1000:08f5          57                             PUSH DI
1000:08f6          9a10096810                     CALLF 0x1068:0910
1000:08fb          bf6304                         MOV DI,0x463
1000:08fe          0e                             PUSH CS
1000:08ff          57                             PUSH DI
1000:0900          9a10096810                     CALLF 0x1068:0910
1000:0905          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0909          16                             PUSH SS
1000:090a          57                             PUSH DI
1000:090b          9a3c096810                     CALLF 0x1068:093c
1000:0910          40                             INC AX
1000:0911          8846ff                         MOV byte ptr [BP + -0x1],AL
1000:0914          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0918          16                             PUSH SS
1000:0919          57                             PUSH DI
1000:091a          8a46ff                         MOV AL,byte ptr [BP + -0x1]
1000:091d          30e4                           XOR AH,AH
1000:091f          50                             PUSH AX
1000:0920          a0921c                         MOV AL,[0x1c92]
1000:0923          30e4                           XOR AH,AH
1000:0925          50                             PUSH AX
1000:0926          9a6d031010                     CALLF 0x1010:036d
1000:092b          8dbe7afd                       LEA DI,[BP + 0xfd7a]
1000:092f          16                             PUSH SS
1000:0930          57                             PUSH DI
1000:0931          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0935          16                             PUSH SS
1000:0936          57                             PUSH DI
1000:0937          8a46ff                         MOV AL,byte ptr [BP + -0x1]
1000:093a          30e4                           XOR AH,AH
1000:093c          50                             PUSH AX
1000:093d          9aeb021010                     CALLF 0x1010:02eb
LAB_1000_0942:
1000:0942          bf6304                         MOV DI,0x463
1000:0945          0e                             PUSH CS
1000:0946          57                             PUSH DI
1000:0947          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:094b          16                             PUSH SS
1000:094c          57                             PUSH DI
1000:094d          9a3c096810                     CALLF 0x1068:093c
1000:0952          09c0                           OR AX,AX
1000:0954          7420                           JZ 0x1000:0976
1000:0956          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:095a          16                             PUSH SS
1000:095b          57                             PUSH DI
1000:095c          bf6304                         MOV DI,0x463
1000:095f          0e                             PUSH CS
1000:0960          57                             PUSH DI
1000:0961          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0965          16                             PUSH SS
1000:0966          57                             PUSH DI
1000:0967          9a3c096810                     CALLF 0x1068:093c
1000:096c          50                             PUSH AX
1000:096d          6a01                           PUSH 0x1
1000:096f          9a6d031010                     CALLF 0x1010:036d
1000:0974          ebcc                           JMP 0x1000:0942
LAB_1000_0976:
1000:0976          8dbe7efe                       LEA DI,[BP + 0xfe7e]
1000:097a          16                             PUSH SS
1000:097b          57                             PUSH DI
1000:097c          9a2c076810                     CALLF 0x1068:072c
1000:0981          9a8f036810                     CALLF 0x1068:038f
LAB_1000_0986:
1000:0986          a1ca94                         MOV AX,[0x94ca]
1000:0989          c47e06                         LES DI,[BP + 0x6]
1000:098c          03f8                           ADD DI,AX
1000:098e          2680bda79201                   CMP byte ptr ES:[DI + 0x92a7],0x1
1000:0994          764f                           JBE 0x1000:09e5
1000:0996          8dbe78fa                       LEA DI,[BP + 0xfa78]
1000:099a          16                             PUSH SS
1000:099b          57                             PUSH DI
1000:099c          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:09a0          16                             PUSH SS
1000:09a1          57                             PUSH DI
1000:09a2          9a91086810                     CALLF 0x1068:0891
1000:09a7          8dbe78fb                       LEA DI,[BP + 0xfb78]
1000:09ab          16                             PUSH SS
1000:09ac          57                             PUSH DI
1000:09ad          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:09b1          16                             PUSH SS
1000:09b2          57                             PUSH DI
1000:09b3          a1ca94                         MOV AX,[0x94ca]
1000:09b6          c47e06                         LES DI,[BP + 0x6]
1000:09b9          03f8                           ADD DI,AX
1000:09bb          268a85a792                     MOV AL,byte ptr ES:[DI + 0x92a7]
1000:09c0          30e4                           XOR AH,AH
1000:09c2          50                             PUSH AX
1000:09c3          9a90001010                     CALLF 0x1010:0090
1000:09c8          bf6d04                         MOV DI,0x46d
1000:09cb          0e                             PUSH CS
1000:09cc          57                             PUSH DI
1000:09cd          9a5a021010                     CALLF 0x1010:025a
1000:09d2          9a10096810                     CALLF 0x1068:0910
1000:09d7          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:09db          16                             PUSH SS
1000:09dc          57                             PUSH DI
1000:09dd          68ff00                         PUSH 0xff
1000:09e0          9aab086810                     CALLF 0x1068:08ab
LAB_1000_09e5:
1000:09e5          a1ca94                         MOV AX,[0x94ca]
1000:09e8          c47e06                         LES DI,[BP + 0x6]
1000:09eb          03f8                           ADD DI,AX
1000:09ed          2680bda79201                   CMP byte ptr ES:[DI + 0x92a7],0x1
1000:09f3          7529                           JNZ 0x1000:0a1e
1000:09f5          8dbe78fc                       LEA DI,[BP + 0xfc78]
1000:09f9          16                             PUSH SS
1000:09fa          57                             PUSH DI
1000:09fb          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:09ff          16                             PUSH SS
1000:0a00          57                             PUSH DI
1000:0a01          9a91086810                     CALLF 0x1068:0891
1000:0a06          bf8a04                         MOV DI,0x48a
1000:0a09          0e                             PUSH CS
1000:0a0a          57                             PUSH DI
1000:0a0b          9a10096810                     CALLF 0x1068:0910
1000:0a10          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0a14          16                             PUSH SS
1000:0a15          57                             PUSH DI
1000:0a16          68ff00                         PUSH 0xff
1000:0a19          9aab086810                     CALLF 0x1068:08ab
LAB_1000_0a1e:
1000:0a1e          a1ca94                         MOV AX,[0x94ca]
1000:0a21          c47e06                         LES DI,[BP + 0x6]
1000:0a24          03f8                           ADD DI,AX
1000:0a26          268a85a792                     MOV AL,byte ptr ES:[DI + 0x92a7]
1000:0a2b          30e4                           XOR AH,AH
1000:0a2d          a3c894                         MOV [0x94c8],AX
LAB_1000_0a30:
1000:0a30          bfa404                         MOV DI,0x4a4
1000:0a33          0e                             PUSH CS
1000:0a34          57                             PUSH DI
1000:0a35          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0a39          16                             PUSH SS
1000:0a3a          57                             PUSH DI
1000:0a3b          9a3c096810                     CALLF 0x1068:093c
1000:0a40          09c0                           OR AX,AX
1000:0a42          7453                           JZ 0x1000:0a97
1000:0a44          bfa404                         MOV DI,0x4a4
1000:0a47          0e                             PUSH CS
1000:0a48          57                             PUSH DI
1000:0a49          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0a4d          16                             PUSH SS
1000:0a4e          57                             PUSH DI
1000:0a4f          9a3c096810                     CALLF 0x1068:093c
1000:0a54          8846ff                         MOV byte ptr [BP + -0x1],AL
1000:0a57          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0a5b          16                             PUSH SS
1000:0a5c          57                             PUSH DI
1000:0a5d          8a46ff                         MOV AL,byte ptr [BP + -0x1]
1000:0a60          30e4                           XOR AH,AH
1000:0a62          50                             PUSH AX
1000:0a63          6a03                           PUSH 0x3
1000:0a65          9a6d031010                     CALLF 0x1010:036d
1000:0a6a          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:0a6f          c47e06                         LES DI,[BP + 0x6]
1000:0a72          03f8                           ADD DI,AX
1000:0a74          268a85ef09                     MOV AL,byte ptr ES:[DI + 0x9ef]
1000:0a79          30e4                           XOR AH,AH
1000:0a7b          6bf815                         IMUL DI,AX,0x15
1000:0a7e          81c75e16                       ADD DI,0x165e
1000:0a82          1e                             PUSH DS
1000:0a83          57                             PUSH DI
1000:0a84          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0a88          16                             PUSH SS
1000:0a89          57                             PUSH DI
1000:0a8a          8a46ff                         MOV AL,byte ptr [BP + -0x1]
1000:0a8d          30e4                           XOR AH,AH
1000:0a8f          50                             PUSH AX
1000:0a90          9aeb021010                     CALLF 0x1010:02eb
1000:0a95          eb99                           JMP 0x1000:0a30
LAB_1000_0a97:
1000:0a97          8dbefefe                       LEA DI,[BP + 0xfefe]
1000:0a9b          16                             PUSH SS
1000:0a9c          57                             PUSH DI
1000:0a9d          c47e0a                         LES DI,[BP + 0xa]
1000:0aa0          06                             PUSH ES
1000:0aa1          57                             PUSH DI
1000:0aa2          68ff00                         PUSH 0xff
1000:0aa5          9aab086810                     CALLF 0x1068:08ab
1000:0aaa          c9                             LEAVE
1000:0aab          ca0400                         RETF 0x4
FUN_1000_0ab0:
1000:0ab0          55                             PUSH BP
1000:0ab1          89e5                           MOV BP,SP
1000:0ab3          b80001                         MOV AX,0x100
1000:0ab6          9acb036810                     CALLF 0x1068:03cb
1000:0abb          81ec0001                       SUB SP,0x100
1000:0abf          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:0ac3          16                             PUSH SS
1000:0ac4          57                             PUSH DI
1000:0ac5          ff760a                         PUSH word ptr [BP + 0xa]
1000:0ac8          ff7608                         PUSH word ptr [BP + 0x8]
1000:0acb          9a7e016010                     CALLF 0x1060:017e
1000:0ad0          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0ad3          81c75eec                       ADD DI,0xec5e
1000:0ad7          16                             PUSH SS
1000:0ad8          57                             PUSH DI
1000:0ad9          68ff00                         PUSH 0xff
1000:0adc          9aab086810                     CALLF 0x1068:08ab
1000:0ae1          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:0ae5          16                             PUSH SS
1000:0ae6          57                             PUSH DI
1000:0ae7          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0aea          81c75eec                       ADD DI,0xec5e
1000:0aee          16                             PUSH SS
1000:0aef          57                             PUSH DI
1000:0af0          bfae0a                         MOV DI,0xaae
1000:0af3          0e                             PUSH CS
1000:0af4          57                             PUSH DI
1000:0af5          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0af8          81c75eec                       ADD DI,0xec5e
1000:0afc          16                             PUSH SS
1000:0afd          57                             PUSH DI
1000:0afe          9a3c096810                     CALLF 0x1068:093c
1000:0b03          40                             INC AX
1000:0b04          50                             PUSH AX
1000:0b05          6a0a                           PUSH 0xa
1000:0b07          9acf086810                     CALLF 0x1068:08cf
1000:0b0c          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0b0f          81c746eb                       ADD DI,0xeb46
1000:0b13          16                             PUSH SS
1000:0b14          57                             PUSH DI
1000:0b15          9abd0c6810                     CALLF 0x1068:0cbd
1000:0b1a          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0b1d          36898544eb                     MOV word ptr SS:[DI + 0xeb44],AX
1000:0b22          366b8544eb0a                   IMUL AX,word ptr SS:[DI + 0xeb44],0xa
1000:0b28          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0b2b          36c47d06                       LES DI,SS:[DI + 0x6]
1000:0b2f          03f8                           ADD DI,AX
1000:0b31          2680bdee0963                   CMP byte ptr ES:[DI + 0x9ee],0x63
1000:0b37          7503                           JNZ 0x1000:0b3c
1000:0b39          e93801                         JMP 0x1000:0c74
LAB_1000_0b3c:
1000:0b3c          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:0b40          16                             PUSH SS
1000:0b41          57                             PUSH DI
1000:0b42          ff760a                         PUSH word ptr [BP + 0xa]
1000:0b45          ff7608                         PUSH word ptr [BP + 0x8]
1000:0b48          9a7e016010                     CALLF 0x1060:017e
1000:0b4d          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0b50          81c75eec                       ADD DI,0xec5e
1000:0b54          16                             PUSH SS
1000:0b55          57                             PUSH DI
1000:0b56          68ff00                         PUSH 0xff
1000:0b59          9aab086810                     CALLF 0x1068:08ab
1000:0b5e          bfae0a                         MOV DI,0xaae
1000:0b61          0e                             PUSH CS
1000:0b62          57                             PUSH DI
1000:0b63          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0b66          81c75eec                       ADD DI,0xec5e
1000:0b6a          16                             PUSH SS
1000:0b6b          57                             PUSH DI
1000:0b6c          9a3c096810                     CALLF 0x1068:093c
1000:0b71          3d0100                         CMP AX,0x1
1000:0b74          7e1d                           JLE 0x1000:0b93
1000:0b76          bfae0a                         MOV DI,0xaae
1000:0b79          0e                             PUSH CS
1000:0b7a          57                             PUSH DI
1000:0b7b          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0b7e          81c75eec                       ADD DI,0xec5e
1000:0b82          16                             PUSH SS
1000:0b83          57                             PUSH DI
1000:0b84          9a3c096810                     CALLF 0x1068:093c
1000:0b89          48                             DEC AX
1000:0b8a          48                             DEC AX
1000:0b8b          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0b8e          3688855eec                     MOV byte ptr SS:[DI + 0xec5e],AL
LAB_1000_0b93:
1000:0b93          6a23                           PUSH 0x23
1000:0b95          9a2d016810                     CALLF 0x1068:012d
1000:0b9a          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0b9d          3689855eed                     MOV word ptr SS:[DI + 0xed5e],AX
1000:0ba2          36899560ed                     MOV word ptr SS:[DI + 0xed60],DX
1000:0ba7          36ffb560ed                     PUSH word ptr SS:[DI + 0xed60]
1000:0bac          36ffb55eed                     PUSH word ptr SS:[DI + 0xed5e]
1000:0bb1          81c75eec                       ADD DI,0xec5e
1000:0bb5          16                             PUSH SS
1000:0bb6          57                             PUSH DI
1000:0bb7          9a9f006010                     CALLF 0x1060:009f
1000:0bbc          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0bbf          36c47d06                       LES DI,SS:[DI + 0x6]
1000:0bc3          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:0bc7          6a67                           PUSH 0x67
1000:0bc9          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0bcc          36ffb560ed                     PUSH word ptr SS:[DI + 0xed60]
1000:0bd1          36ffb55eed                     PUSH word ptr SS:[DI + 0xed5e]
1000:0bd6          9a02001010                     CALLF 0x1010:0002
1000:0bdb          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0bde          36ffb560ed                     PUSH word ptr SS:[DI + 0xed60]
1000:0be3          36ffb55eed                     PUSH word ptr SS:[DI + 0xed5e]
1000:0be8          6a23                           PUSH 0x23
1000:0bea          9a47016810                     CALLF 0x1068:0147
1000:0bef          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0bf2          36ff8548eb                     INC word ptr SS:[DI + 0xeb48]
1000:0bf7          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:0bfb          16                             PUSH SS
1000:0bfc          57                             PUSH DI
1000:0bfd          ff760a                         PUSH word ptr [BP + 0xa]
1000:0c00          ff7608                         PUSH word ptr [BP + 0x8]
1000:0c03          9a7e016010                     CALLF 0x1060:017e
1000:0c08          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0c0b          81c75eec                       ADD DI,0xec5e
1000:0c0f          16                             PUSH SS
1000:0c10          57                             PUSH DI
1000:0c11          68ff00                         PUSH 0xff
1000:0c14          9aab086810                     CALLF 0x1068:08ab
1000:0c19          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:0c1d          16                             PUSH SS
1000:0c1e          57                             PUSH DI
1000:0c1f          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0c22          81c75eec                       ADD DI,0xec5e
1000:0c26          16                             PUSH SS
1000:0c27          57                             PUSH DI
1000:0c28          bfae0a                         MOV DI,0xaae
1000:0c2b          0e                             PUSH CS
1000:0c2c          57                             PUSH DI
1000:0c2d          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0c30          81c75eec                       ADD DI,0xec5e
1000:0c34          16                             PUSH SS
1000:0c35          57                             PUSH DI
1000:0c36          9a3c096810                     CALLF 0x1068:093c
1000:0c3b          40                             INC AX
1000:0c3c          50                             PUSH AX
1000:0c3d          6a0a                           PUSH 0xa
1000:0c3f          9acf086810                     CALLF 0x1068:08cf
1000:0c44          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0c47          81c746eb                       ADD DI,0xeb46
1000:0c4b          16                             PUSH SS
1000:0c4c          57                             PUSH DI
1000:0c4d          9abd0c6810                     CALLF 0x1068:0cbd
1000:0c52          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0c55          36898544eb                     MOV word ptr SS:[DI + 0xeb44],AX
1000:0c5a          368b9544eb                     MOV DX,word ptr SS:[DI + 0xeb44]
1000:0c5f          368b8548eb                     MOV AX,word ptr SS:[DI + 0xeb48]
1000:0c64          d1e0                           SHL AX,0x1
1000:0c66          8b7e06                         MOV DI,word ptr [BP + 0x6]
1000:0c69          36c47d06                       LES DI,SS:[DI + 0x6]
1000:0c6d          03f8                           ADD DI,AX
1000:0c6f          2689952ea6                     MOV word ptr ES:[DI + 0xa62e],DX
LAB_1000_0c74:
1000:0c74          c9                             LEAVE
1000:0c75          ca0600                         RETF 0x6
FUN_1000_0c97:
1000:0c97          55                             PUSH BP
1000:0c98          89e5                           MOV BP,SP
1000:0c9a          b8bc16                         MOV AX,0x16bc
1000:0c9d          9acb036810                     CALLF 0x1068:03cb
1000:0ca2          81ecbc16                       SUB SP,0x16bc
1000:0ca6          c6068e1a00                     MOV byte ptr [0x1a8e],0x0
1000:0cab          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:0caf          16                             PUSH SS
1000:0cb0          57                             PUSH DI
1000:0cb1          bfac99                         MOV DI,0x99ac
1000:0cb4          1e                             PUSH DS
1000:0cb5          57                             PUSH DI
1000:0cb6          9a91086810                     CALLF 0x1068:0891
1000:0cbb          bf780c                         MOV DI,0xc78
1000:0cbe          0e                             PUSH CS
1000:0cbf          57                             PUSH DI
1000:0cc0          9a10096810                     CALLF 0x1068:0910
1000:0cc5          9ad7042010                     CALLF 0x1020:04d7
1000:0cca          08c0                           OR AL,AL
1000:0ccc          7520                           JNZ 0x1000:0cee
1000:0cce          c47e06                         LES DI,[BP + 0x6]
1000:0cd1          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:0cd5          bf7c01                         MOV DI,0x17c
1000:0cd8          1e                             PUSH DS
1000:0cd9          57                             PUSH DI
1000:0cda          bf9401                         MOV DI,0x194
1000:0cdd          1e                             PUSH DS
1000:0cde          57                             PUSH DI
1000:0cdf          6a10                           PUSH 0x10
1000:0ce1          9a5c005011                     CALLF 0x1150:005c
1000:0ce6          c6068e1a01                     MOV byte ptr [0x1a8e],0x1
1000:0ceb          e98408                         JMP 0x1000:1572
LAB_1000_0cee:
1000:0cee          8dbe62ed                       LEA DI,[BP + 0xed62]
1000:0cf2          16                             PUSH SS
1000:0cf3          57                             PUSH DI
1000:0cf4          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:0cf8          16                             PUSH SS
1000:0cf9          57                             PUSH DI
1000:0cfa          bfac99                         MOV DI,0x99ac
1000:0cfd          1e                             PUSH DS
1000:0cfe          57                             PUSH DI
1000:0cff          9a91086810                     CALLF 0x1068:0891
1000:0d04          bf780c                         MOV DI,0xc78
1000:0d07          0e                             PUSH CS
1000:0d08          57                             PUSH DI
1000:0d09          9a10096810                     CALLF 0x1068:0910
1000:0d0e          9a67066810                     CALLF 0x1068:0667
1000:0d13          8dbe62ed                       LEA DI,[BP + 0xed62]
1000:0d17          16                             PUSH SS
1000:0d18          57                             PUSH DI
1000:0d19          6a01                           PUSH 0x1
1000:0d1b          9aab066810                     CALLF 0x1068:06ab
1000:0d20          9a8f036810                     CALLF 0x1068:038f
1000:0d25          31c0                           XOR AX,AX
1000:0d27          8986f8fd                       MOV word ptr [BP + 0xfdf8],AX
1000:0d2b          31c0                           XOR AX,AX
1000:0d2d          8986f2fd                       MOV word ptr [BP + 0xfdf2],AX
1000:0d31          8986f4fd                       MOV word ptr [BP + 0xfdf4],AX
1000:0d35          31c0                           XOR AX,AX
1000:0d37          8986fcfd                       MOV word ptr [BP + 0xfdfc],AX
1000:0d3b          c686e3ed00                     MOV byte ptr [BP + 0xede3],0x0
1000:0d40          8dbe62ed                       LEA DI,[BP + 0xed62]
1000:0d44          16                             PUSH SS
1000:0d45          57                             PUSH DI
1000:0d46          8dbef2ed                       LEA DI,[BP + 0xedf2]
1000:0d4a          16                             PUSH SS
1000:0d4b          57                             PUSH DI
1000:0d4c          680010                         PUSH 0x1000
1000:0d4f          8dbefafd                       LEA DI,[BP + 0xfdfa]
1000:0d53          16                             PUSH SS
1000:0d54          57                             PUSH DI
1000:0d55          9a96076810                     CALLF 0x1068:0796
1000:0d5a          9a8f036810                     CALLF 0x1068:038f
LAB_1000_0d5f:
1000:0d5f          c6865ceb01                     MOV byte ptr [BP + 0xeb5c],0x1
1000:0d64          8bbefcfd                       MOV DI,word ptr [BP + 0xfdfc]
1000:0d68          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:0d6c          3cb5                           CMP AL,0xb5
1000:0d6e          7403                           JZ 0x1000:0d73
1000:0d70          e96d01                         JMP 0x1000:0ee0
LAB_1000_0d73:
1000:0d73          ff86f8fd                       INC word ptr [BP + 0xfdf8]
1000:0d77          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:0d7b          31d2                           XOR DX,DX
1000:0d7d          0386f2fd                       ADD AX,word ptr [BP + 0xfdf2]
1000:0d81          1396f4fd                       ADC DX,word ptr [BP + 0xfdf4]
1000:0d85          050100                         ADD AX,0x1
1000:0d88          83d200                         ADC DX,0x0
1000:0d8b          8bbef8fd                       MOV DI,word ptr [BP + 0xfdf8]
1000:0d8f          c1e702                         SHL DI,0x2
1000:0d92          89858e1d                       MOV word ptr [DI + 0x1d8e],AX
1000:0d96          8995901d                       MOV word ptr [DI + 0x1d90],DX
1000:0d9a          6a64                           PUSH 0x64
1000:0d9c          9a2d016810                     CALLF 0x1068:012d
1000:0da1          89865eed                       MOV word ptr [BP + 0xed5e],AX
1000:0da5          899660ed                       MOV word ptr [BP + 0xed60],DX
1000:0da9          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:0dad          050400                         ADD AX,0x4
1000:0db0          8bf8                           MOV DI,AX
1000:0db2          8dbbf2ed                       LEA DI,[BP + DI + 0xedf2]
1000:0db6          16                             PUSH SS
1000:0db7          57                             PUSH DI
1000:0db8          8dbe5fec                       LEA DI,[BP + 0xec5f]
1000:0dbc          16                             PUSH SS
1000:0dbd          57                             PUSH DI
1000:0dbe          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:0dc2          40                             INC AX
1000:0dc3          8bf8                           MOV DI,AX
1000:0dc5          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:0dc9          30e4                           XOR AH,AH
1000:0dcb          48                             DEC AX
1000:0dcc          48                             DEC AX
1000:0dcd          50                             PUSH AX
1000:0dce          9aee0c6810                     CALLF 0x1068:0cee
1000:0dd3          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:0dd7          40                             INC AX
1000:0dd8          8bf8                           MOV DI,AX
1000:0dda          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:0dde          30e4                           XOR AH,AH
1000:0de0          48                             DEC AX
1000:0de1          48                             DEC AX
1000:0de2          88865eec                       MOV byte ptr [BP + 0xec5e],AL
1000:0de6          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:0dea          16                             PUSH SS
1000:0deb          57                             PUSH DI
1000:0dec          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:0df0          16                             PUSH SS
1000:0df1          57                             PUSH DI
1000:0df2          9a91086810                     CALLF 0x1068:0891
1000:0df7          bf840c                         MOV DI,0xc84
1000:0dfa          0e                             PUSH CS
1000:0dfb          57                             PUSH DI
1000:0dfc          9a10096810                     CALLF 0x1068:0910
1000:0e01          bf860c                         MOV DI,0xc86
1000:0e04          0e                             PUSH CS
1000:0e05          57                             PUSH DI
1000:0e06          9a10096810                     CALLF 0x1068:0910
1000:0e0b          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:0e0f          16                             PUSH SS
1000:0e10          57                             PUSH DI
1000:0e11          68ff00                         PUSH 0xff
1000:0e14          9aab086810                     CALLF 0x1068:08ab
1000:0e19          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:0e1d          31d2                           XOR DX,DX
1000:0e1f          52                             PUSH DX
1000:0e20          50                             PUSH AX
1000:0e21          6a00                           PUSH 0x0
1000:0e23          8dbe5eeb                       LEA DI,[BP + 0xeb5e]
1000:0e27          16                             PUSH SS
1000:0e28          57                             PUSH DI
1000:0e29          68ff00                         PUSH 0xff
1000:0e2c          9a720c6810                     CALLF 0x1068:0c72
1000:0e31          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:0e35          16                             PUSH SS
1000:0e36          57                             PUSH DI
1000:0e37          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:0e3b          16                             PUSH SS
1000:0e3c          57                             PUSH DI
1000:0e3d          9a91086810                     CALLF 0x1068:0891
1000:0e42          8dbe5eeb                       LEA DI,[BP + 0xeb5e]
1000:0e46          16                             PUSH SS
1000:0e47          57                             PUSH DI
1000:0e48          9a10096810                     CALLF 0x1068:0910
1000:0e4d          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:0e51          16                             PUSH SS
1000:0e52          57                             PUSH DI
1000:0e53          68ff00                         PUSH 0xff
1000:0e56          9aab086810                     CALLF 0x1068:08ab
1000:0e5b          ffb660ed                       PUSH word ptr [BP + 0xed60]
1000:0e5f          ffb65eed                       PUSH word ptr [BP + 0xed5e]
1000:0e63          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:0e67          16                             PUSH SS
1000:0e68          57                             PUSH DI
1000:0e69          9a9f006010                     CALLF 0x1060:009f
1000:0e6e          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:0e72          40                             INC AX
1000:0e73          8bf8                           MOV DI,AX
1000:0e75          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:0e79          30e4                           XOR AH,AH
1000:0e7b          40                             INC AX
1000:0e7c          40                             INC AX
1000:0e7d          0186fcfd                       ADD word ptr [BP + 0xfdfc],AX
1000:0e81          ffb660ed                       PUSH word ptr [BP + 0xed60]
1000:0e85          ffb65eed                       PUSH word ptr [BP + 0xed5e]
1000:0e89          9aa0016010                     CALLF 0x1060:01a0
1000:0e8e          52                             PUSH DX
1000:0e8f          50                             PUSH AX
1000:0e90          c47e06                         LES DI,[BP + 0x6]
1000:0e93          26c47d26                       LES DI,ES:[DI + 0x26]
1000:0e97          06                             PUSH ES
1000:0e98          57                             PUSH DI
1000:0e99          268b3d                         MOV DI,word ptr ES:[DI]
1000:0e9c          ff5d1c                         CALLF [DI + 0x1c]
1000:0e9f          ffb660ed                       PUSH word ptr [BP + 0xed60]
1000:0ea3          ffb65eed                       PUSH word ptr [BP + 0xed5e]
1000:0ea7          6a64                           PUSH 0x64
1000:0ea9          9a47016810                     CALLF 0x1068:0147
1000:0eae          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:0eb2          c47e06                         LES DI,[BP + 0x6]
1000:0eb5          03f8                           ADD DI,AX
1000:0eb7          26c685a79200                   MOV byte ptr ES:[DI + 0x92a7],0x0
1000:0ebd          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:0ec1          c47e06                         LES DI,[BP + 0x6]
1000:0ec4          03f8                           ADD DI,AX
1000:0ec6          26c6856b9c00                   MOV byte ptr ES:[DI + 0x9c6b],0x0
1000:0ecc          8bbef8fd                       MOV DI,word ptr [BP + 0xfdf8]
1000:0ed0          c1e702                         SHL DI,0x2
1000:0ed3          31c0                           XOR AX,AX
1000:0ed5          89859e44                       MOV word ptr [DI + 0x449e],AX
1000:0ed9          8985a044                       MOV word ptr [DI + 0x44a0],AX
1000:0edd          e95c06                         JMP 0x1000:153c
LAB_1000_0ee0:
1000:0ee0          3cb6                           CMP AL,0xb6
1000:0ee2          7403                           JZ 0x1000:0ee7
1000:0ee4          e91602                         JMP 0x1000:10fd
LAB_1000_0ee7:
1000:0ee7          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:0eeb          c47e06                         LES DI,[BP + 0x6]
1000:0eee          03f8                           ADD DI,AX
1000:0ef0          26c6856b9c01                   MOV byte ptr ES:[DI + 0x9c6b],0x1
1000:0ef6          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:0efa          31d2                           XOR DX,DX
1000:0efc          0386f2fd                       ADD AX,word ptr [BP + 0xfdf2]
1000:0f00          1396f4fd                       ADC DX,word ptr [BP + 0xfdf4]
1000:0f04          050100                         ADD AX,0x1
1000:0f07          83d200                         ADC DX,0x0
1000:0f0a          8bbef8fd                       MOV DI,word ptr [BP + 0xfdf8]
1000:0f0e          c1e702                         SHL DI,0x2
1000:0f11          89859e44                       MOV word ptr [DI + 0x449e],AX
1000:0f15          8995a044                       MOV word ptr [DI + 0x44a0],DX
1000:0f19          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:0f1d          40                             INC AX
1000:0f1e          8986fefd                       MOV word ptr [BP + 0xfdfe],AX
1000:0f22          8bbefefd                       MOV DI,word ptr [BP + 0xfdfe]
1000:0f26          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:0f2a          888643eb                       MOV byte ptr [BP + 0xeb43],AL
1000:0f2e          b001                           MOV AL,0x1
1000:0f30          3a8643eb                       CMP AL,byte ptr [BP + 0xeb43]
1000:0f34          7743                           JA 0x1000:0f79
1000:0f36          88865deb                       MOV byte ptr [BP + 0xeb5d],AL
1000:0f3a          eb04                           JMP 0x1000:0f40
LAB_1000_0f3c:
1000:0f3c          fe865deb                       INC byte ptr [BP + 0xeb5d]
LAB_1000_0f40:
1000:0f40          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:0f44          30e4                           XOR AH,AH
1000:0f46          0386fefd                       ADD AX,word ptr [BP + 0xfdfe]
1000:0f4a          8bf8                           MOV DI,AX
1000:0f4c          80bbf2ed2c                     CMP byte ptr [BP + DI + 0xedf2],0x2c
1000:0f51          751c                           JNZ 0x1000:0f6f
1000:0f53          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:0f57          8bbefefd                       MOV DI,word ptr [BP + 0xfdfe]
1000:0f5b          3a83f2ed                       CMP AL,byte ptr [BP + DI + 0xedf2]
1000:0f5f          740e                           JZ 0x1000:0f6f
1000:0f61          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:0f65          c47e06                         LES DI,[BP + 0x6]
1000:0f68          03f8                           ADD DI,AX
1000:0f6a          26fe856b9c                     INC byte ptr ES:[DI + 0x9c6b]
LAB_1000_0f6f:
1000:0f6f          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:0f73          3a8643eb                       CMP AL,byte ptr [BP + 0xeb43]
1000:0f77          75c3                           JNZ 0x1000:0f3c
LAB_1000_0f79:
1000:0f79          c6865eec00                     MOV byte ptr [BP + 0xec5e],0x0
1000:0f7e          6a64                           PUSH 0x64
1000:0f80          9a2d016810                     CALLF 0x1068:012d
1000:0f85          89865eed                       MOV word ptr [BP + 0xed5e],AX
1000:0f89          899660ed                       MOV word ptr [BP + 0xed60],DX
1000:0f8d          c6865deb00                     MOV byte ptr [BP + 0xeb5d],0x0
LAB_1000_0f92:
1000:0f92          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:0f96          30e4                           XOR AH,AH
1000:0f98          40                             INC AX
1000:0f99          88865deb                       MOV byte ptr [BP + 0xeb5d],AL
1000:0f9d          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:0fa1          30e4                           XOR AH,AH
1000:0fa3          0386fefd                       ADD AX,word ptr [BP + 0xfdfe]
1000:0fa7          8bf8                           MOV DI,AX
1000:0fa9          80bbf2ed2c                     CMP byte ptr [BP + DI + 0xedf2],0x2c
1000:0fae          7440                           JZ 0x1000:0ff0
1000:0fb0          8dbe44e9                       LEA DI,[BP + 0xe944]
1000:0fb4          16                             PUSH SS
1000:0fb5          57                             PUSH DI
1000:0fb6          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:0fba          16                             PUSH SS
1000:0fbb          57                             PUSH DI
1000:0fbc          9a91086810                     CALLF 0x1068:0891
1000:0fc1          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:0fc5          16                             PUSH SS
1000:0fc6          57                             PUSH DI
1000:0fc7          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:0fcb          30e4                           XOR AH,AH
1000:0fcd          0386fefd                       ADD AX,word ptr [BP + 0xfdfe]
1000:0fd1          8bf8                           MOV DI,AX
1000:0fd3          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:0fd7          50                             PUSH AX
1000:0fd8          9aad096810                     CALLF 0x1068:09ad
1000:0fdd          9a10096810                     CALLF 0x1068:0910
1000:0fe2          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:0fe6          16                             PUSH SS
1000:0fe7          57                             PUSH DI
1000:0fe8          68ff00                         PUSH 0xff
1000:0feb          9aab086810                     CALLF 0x1068:08ab
LAB_1000_0ff0:
1000:0ff0          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:0ff4          30e4                           XOR AH,AH
1000:0ff6          0386fefd                       ADD AX,word ptr [BP + 0xfdfe]
1000:0ffa          8bf8                           MOV DI,AX
1000:0ffc          80bbf2ed2c                     CMP byte ptr [BP + DI + 0xedf2],0x2c
1000:1001          7411                           JZ 0x1000:1014
1000:1003          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:1007          8bbefefd                       MOV DI,word ptr [BP + 0xfdfe]
1000:100b          3a83f2ed                       CMP AL,byte ptr [BP + DI + 0xedf2]
1000:100f          7303                           JNC 0x1000:1014
1000:1011          e9b600                         JMP 0x1000:10ca
LAB_1000_1014:
1000:1014          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:1018          16                             PUSH SS
1000:1019          57                             PUSH DI
1000:101a          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:101e          16                             PUSH SS
1000:101f          57                             PUSH DI
1000:1020          9a91086810                     CALLF 0x1068:0891
1000:1025          bf840c                         MOV DI,0xc84
1000:1028          0e                             PUSH CS
1000:1029          57                             PUSH DI
1000:102a          9a10096810                     CALLF 0x1068:0910
1000:102f          bf860c                         MOV DI,0xc86
1000:1032          0e                             PUSH CS
1000:1033          57                             PUSH DI
1000:1034          9a10096810                     CALLF 0x1068:0910
1000:1039          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:103d          16                             PUSH SS
1000:103e          57                             PUSH DI
1000:103f          68ff00                         PUSH 0xff
1000:1042          9aab086810                     CALLF 0x1068:08ab
1000:1047          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:104b          31d2                           XOR DX,DX
1000:104d          52                             PUSH DX
1000:104e          50                             PUSH AX
1000:104f          6a00                           PUSH 0x0
1000:1051          8dbe5eeb                       LEA DI,[BP + 0xeb5e]
1000:1055          16                             PUSH SS
1000:1056          57                             PUSH DI
1000:1057          68ff00                         PUSH 0xff
1000:105a          9a720c6810                     CALLF 0x1068:0c72
1000:105f          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:1063          16                             PUSH SS
1000:1064          57                             PUSH DI
1000:1065          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:1069          16                             PUSH SS
1000:106a          57                             PUSH DI
1000:106b          9a91086810                     CALLF 0x1068:0891
1000:1070          8dbe5eeb                       LEA DI,[BP + 0xeb5e]
1000:1074          16                             PUSH SS
1000:1075          57                             PUSH DI
1000:1076          9a10096810                     CALLF 0x1068:0910
1000:107b          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:107f          16                             PUSH SS
1000:1080          57                             PUSH DI
1000:1081          68ff00                         PUSH 0xff
1000:1084          9aab086810                     CALLF 0x1068:08ab
1000:1089          ffb660ed                       PUSH word ptr [BP + 0xed60]
1000:108d          ffb65eed                       PUSH word ptr [BP + 0xed5e]
1000:1091          8dbe5eec                       LEA DI,[BP + 0xec5e]
1000:1095          16                             PUSH SS
1000:1096          57                             PUSH DI
1000:1097          9a9f006010                     CALLF 0x1060:009f
1000:109c          ffb660ed                       PUSH word ptr [BP + 0xed60]
1000:10a0          ffb65eed                       PUSH word ptr [BP + 0xed5e]
1000:10a4          9aa0016010                     CALLF 0x1060:01a0
1000:10a9          52                             PUSH DX
1000:10aa          50                             PUSH AX
1000:10ab          c47e06                         LES DI,[BP + 0x6]
1000:10ae          26c47d26                       LES DI,ES:[DI + 0x26]
1000:10b2          06                             PUSH ES
1000:10b3          57                             PUSH DI
1000:10b4          268b3d                         MOV DI,word ptr ES:[DI]
1000:10b7          ff5d1c                         CALLF [DI + 0x1c]
1000:10ba          c6865eec00                     MOV byte ptr [BP + 0xec5e],0x0
1000:10bf          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:10c3          30e4                           XOR AH,AH
1000:10c5          40                             INC AX
1000:10c6          88865deb                       MOV byte ptr [BP + 0xeb5d],AL
LAB_1000_10ca:
1000:10ca          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:10ce          8bbefefd                       MOV DI,word ptr [BP + 0xfdfe]
1000:10d2          3a83f2ed                       CMP AL,byte ptr [BP + DI + 0xedf2]
1000:10d6          7303                           JNC 0x1000:10db
1000:10d8          e9b7fe                         JMP 0x1000:0f92
LAB_1000_10db:
1000:10db          ffb660ed                       PUSH word ptr [BP + 0xed60]
1000:10df          ffb65eed                       PUSH word ptr [BP + 0xed5e]
1000:10e3          6a64                           PUSH 0x64
1000:10e5          9a47016810                     CALLF 0x1068:0147
1000:10ea          8bbefefd                       MOV DI,word ptr [BP + 0xfdfe]
1000:10ee          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:10f2          30e4                           XOR AH,AH
1000:10f4          40                             INC AX
1000:10f5          40                             INC AX
1000:10f6          0186fcfd                       ADD word ptr [BP + 0xfdfc],AX
1000:10fa          e93f04                         JMP 0x1000:153c
LAB_1000_10fd:
1000:10fd          3cb7                           CMP AL,0xb7
1000:10ff          7403                           JZ 0x1000:1104
1000:1101          e9b200                         JMP 0x1000:11b6
LAB_1000_1104:
1000:1104          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:1108          31d2                           XOR DX,DX
1000:110a          0386f2fd                       ADD AX,word ptr [BP + 0xfdf2]
1000:110e          1396f4fd                       ADC DX,word ptr [BP + 0xfdf4]
1000:1112          050100                         ADD AX,0x1
1000:1115          83d200                         ADC DX,0x0
1000:1118          8bbef8fd                       MOV DI,word ptr [BP + 0xfdf8]
1000:111c          c1e702                         SHL DI,0x2
1000:111f          8985ae6b                       MOV word ptr [DI + 0x6bae],AX
1000:1123          8995b06b                       MOV word ptr [DI + 0x6bb0],DX
LAB_1000_1127:
1000:1127          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:112b          c47e06                         LES DI,[BP + 0x6]
1000:112e          03f8                           ADD DI,AX
1000:1130          26fe85a792                     INC byte ptr ES:[DI + 0x92a7]
1000:1135          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:1139          40                             INC AX
1000:113a          8986fefd                       MOV word ptr [BP + 0xfdfe],AX
1000:113e          8bbefefd                       MOV DI,word ptr [BP + 0xfdfe]
1000:1142          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:1146          888643eb                       MOV byte ptr [BP + 0xeb43],AL
1000:114a          b001                           MOV AL,0x1
1000:114c          3a8643eb                       CMP AL,byte ptr [BP + 0xeb43]
1000:1150          7743                           JA 0x1000:1195
1000:1152          88865deb                       MOV byte ptr [BP + 0xeb5d],AL
1000:1156          eb04                           JMP 0x1000:115c
LAB_1000_1158:
1000:1158          fe865deb                       INC byte ptr [BP + 0xeb5d]
LAB_1000_115c:
1000:115c          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:1160          30e4                           XOR AH,AH
1000:1162          0386fefd                       ADD AX,word ptr [BP + 0xfdfe]
1000:1166          8bf8                           MOV DI,AX
1000:1168          80bbf2ed2c                     CMP byte ptr [BP + DI + 0xedf2],0x2c
1000:116d          751c                           JNZ 0x1000:118b
1000:116f          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:1173          8bbefefd                       MOV DI,word ptr [BP + 0xfdfe]
1000:1177          3a83f2ed                       CMP AL,byte ptr [BP + DI + 0xedf2]
1000:117b          740e                           JZ 0x1000:118b
1000:117d          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:1181          c47e06                         LES DI,[BP + 0x6]
1000:1184          03f8                           ADD DI,AX
1000:1186          26fe85a792                     INC byte ptr ES:[DI + 0x92a7]
LAB_1000_118b:
1000:118b          8a865deb                       MOV AL,byte ptr [BP + 0xeb5d]
1000:118f          3a8643eb                       CMP AL,byte ptr [BP + 0xeb43]
1000:1193          75c3                           JNZ 0x1000:1158
LAB_1000_1195:
1000:1195          8bbefefd                       MOV DI,word ptr [BP + 0xfdfe]
1000:1199          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:119d          30e4                           XOR AH,AH
1000:119f          40                             INC AX
1000:11a0          40                             INC AX
1000:11a1          0186fcfd                       ADD word ptr [BP + 0xfdfc],AX
1000:11a5          8bbefcfd                       MOV DI,word ptr [BP + 0xfdfc]
1000:11a9          80bbf2edb7                     CMP byte ptr [BP + DI + 0xedf2],0xb7
1000:11ae          7503                           JNZ 0x1000:11b3
1000:11b0          e974ff                         JMP 0x1000:1127
LAB_1000_11b3:
1000:11b3          e98603                         JMP 0x1000:153c
LAB_1000_11b6:
1000:11b6          3cb8                           CMP AL,0xb8
1000:11b8          7403                           JZ 0x1000:11bd
1000:11ba          e90503                         JMP 0x1000:14c2
LAB_1000_11bd:
1000:11bd          31c0                           XOR AX,AX
1000:11bf          8986e9ed                       MOV word ptr [BP + 0xede9],AX
1000:11c3          31c0                           XOR AX,AX
1000:11c5          8986ebed                       MOV word ptr [BP + 0xedeb],AX
1000:11c9          31c0                           XOR AX,AX
1000:11cb          8986eded                       MOV word ptr [BP + 0xeded],AX
1000:11cf          31c0                           XOR AX,AX
1000:11d1          8986efed                       MOV word ptr [BP + 0xedef],AX
1000:11d5          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:11d9          40                             INC AX
1000:11da          8bf8                           MOV DI,AX
1000:11dc          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:11e0          30e4                           XOR AH,AH
1000:11e2          8986f6fd                       MOV word ptr [BP + 0xfdf6],AX
1000:11e6          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:11ea          40                             INC AX
1000:11eb          40                             INC AX
1000:11ec          8bf8                           MOV DI,AX
1000:11ee          8dbbf2ed                       LEA DI,[BP + DI + 0xedf2]
1000:11f2          16                             PUSH SS
1000:11f3          57                             PUSH DI
1000:11f4          8dbee4ed                       LEA DI,[BP + 0xede4]
1000:11f8          16                             PUSH SS
1000:11f9          57                             PUSH DI
1000:11fa          ffb6f6fd                       PUSH word ptr [BP + 0xfdf6]
1000:11fe          9aee0c6810                     CALLF 0x1068:0cee
1000:1203          8a86e4ed                       MOV AL,byte ptr [BP + 0xede4]
1000:1207          30e4                           XOR AH,AH
1000:1209          c1e805                         SHR AX,0x5
1000:120c          8ad0                           MOV DL,AL
1000:120e          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:1213          c47e06                         LES DI,[BP + 0x6]
1000:1216          03f8                           ADD DI,AX
1000:1218          268895e609                     MOV byte ptr ES:[DI + 0x9e6],DL
1000:121d          8a86e4ed                       MOV AL,byte ptr [BP + 0xede4]
1000:1221          241c                           AND AL,0x1c
1000:1223          30e4                           XOR AH,AH
1000:1225          c1e802                         SHR AX,0x2
1000:1228          8ad0                           MOV DL,AL
1000:122a          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:122f          c47e06                         LES DI,[BP + 0x6]
1000:1232          03f8                           ADD DI,AX
1000:1234          268895e709                     MOV byte ptr ES:[DI + 0x9e7],DL
1000:1239          8a86e5ed                       MOV AL,byte ptr [BP + 0xede5]
1000:123d          30e4                           XOR AH,AH
1000:123f          c1e805                         SHR AX,0x5
1000:1242          8ad0                           MOV DL,AL
1000:1244          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:1249          c47e06                         LES DI,[BP + 0x6]
1000:124c          03f8                           ADD DI,AX
1000:124e          268895e809                     MOV byte ptr ES:[DI + 0x9e8],DL
1000:1253          8a86e5ed                       MOV AL,byte ptr [BP + 0xede5]
1000:1257          240f                           AND AL,0xf
1000:1259          8ad0                           MOV DL,AL
1000:125b          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:1260          c47e06                         LES DI,[BP + 0x6]
1000:1263          03f8                           ADD DI,AX
1000:1265          268895e909                     MOV byte ptr ES:[DI + 0x9e9],DL
1000:126a          8a86e6ed                       MOV AL,byte ptr [BP + 0xede6]
1000:126e          30e4                           XOR AH,AH
1000:1270          c1e806                         SHR AX,0x6
1000:1273          8ad0                           MOV DL,AL
1000:1275          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:127a          c47e06                         LES DI,[BP + 0x6]
1000:127d          03f8                           ADD DI,AX
1000:127f          268895ea09                     MOV byte ptr ES:[DI + 0x9ea],DL
1000:1284          8a86e6ed                       MOV AL,byte ptr [BP + 0xede6]
1000:1288          2438                           AND AL,0x38
1000:128a          30e4                           XOR AH,AH
1000:128c          c1e803                         SHR AX,0x3
1000:128f          8ad0                           MOV DL,AL
1000:1291          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:1296          c47e06                         LES DI,[BP + 0x6]
1000:1299          03f8                           ADD DI,AX
1000:129b          268895eb09                     MOV byte ptr ES:[DI + 0x9eb],DL
1000:12a0          8a86e6ed                       MOV AL,byte ptr [BP + 0xede6]
1000:12a4          2407                           AND AL,0x7
1000:12a6          8ad0                           MOV DL,AL
1000:12a8          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:12ad          c47e06                         LES DI,[BP + 0x6]
1000:12b0          03f8                           ADD DI,AX
1000:12b2          268895ec09                     MOV byte ptr ES:[DI + 0x9ec],DL
1000:12b7          8a86e7ed                       MOV AL,byte ptr [BP + 0xede7]
1000:12bb          241f                           AND AL,0x1f
1000:12bd          8ad0                           MOV DL,AL
1000:12bf          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:12c4          c47e06                         LES DI,[BP + 0x6]
1000:12c7          03f8                           ADD DI,AX
1000:12c9          268895ed09                     MOV byte ptr ES:[DI + 0x9ed],DL
1000:12ce          8a86e4ed                       MOV AL,byte ptr [BP + 0xede4]
1000:12d2          2401                           AND AL,0x1
1000:12d4          8ad0                           MOV DL,AL
1000:12d6          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:12db          c47e06                         LES DI,[BP + 0x6]
1000:12de          03f8                           ADD DI,AX
1000:12e0          268895ee09                     MOV byte ptr ES:[DI + 0x9ee],DL
1000:12e5          8a86e5ed                       MOV AL,byte ptr [BP + 0xede5]
1000:12e9          2408                           AND AL,0x8
1000:12eb          3c08                           CMP AL,0x8
1000:12ed          7510                           JNZ 0x1000:12ff
1000:12ef          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:12f4          c47e06                         LES DI,[BP + 0x6]
1000:12f7          03f8                           ADD DI,AX
1000:12f9          26c685ee0963                   MOV byte ptr ES:[DI + 0x9ee],0x63
LAB_1000_12ff:
1000:12ff          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:1304          c47e06                         LES DI,[BP + 0x6]
1000:1307          03f8                           ADD DI,AX
1000:1309          2680bdee0900                   CMP byte ptr ES:[DI + 0x9ee],0x0
1000:130f          750e                           JNZ 0x1000:131f
1000:1311          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:1315          c47e06                         LES DI,[BP + 0x6]
1000:1318          03f8                           ADD DI,AX
1000:131a          26c6452b00                     MOV byte ptr ES:[DI + 0x2b],0x0
LAB_1000_131f:
1000:131f          8a86e7ed                       MOV AL,byte ptr [BP + 0xede7]
1000:1323          30e4                           XOR AH,AH
1000:1325          c1e805                         SHR AX,0x5
1000:1328          8ad0                           MOV DL,AL
1000:132a          6b86f8fd0a                     IMUL AX,word ptr [BP + 0xfdf8],0xa
1000:132f          c47e06                         LES DI,[BP + 0x6]
1000:1332          03f8                           ADD DI,AX
1000:1334          268895ef09                     MOV byte ptr ES:[DI + 0x9ef],DL
1000:1339          6a1f                           PUSH 0x1f
1000:133b          9a2d016810                     CALLF 0x1068:012d
1000:1340          8bc8                           MOV CX,AX
1000:1342          8bda                           MOV BX,DX
1000:1344          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:1348          c1e002                         SHL AX,0x2
1000:134b          c47e06                         LES DI,[BP + 0x6]
1000:134e          03f8                           ADD DI,AX
1000:1350          26898d946b                     MOV word ptr ES:[DI + 0x6b94],CX
1000:1355          26899d966b                     MOV word ptr ES:[DI + 0x6b96],BX
1000:135a          83bee9edff                     CMP word ptr [BP + 0xede9],-0x1
1000:135f          7508                           JNZ 0x1000:1369
1000:1361          c68600ff00                     MOV byte ptr [BP + 0xff00],0x0
1000:1366          e92401                         JMP 0x1000:148d
LAB_1000_1369:
1000:1369          83beededff                     CMP word ptr [BP + 0xeded],-0x1
1000:136e          7508                           JNZ 0x1000:1378
1000:1370          c68600ff00                     MOV byte ptr [BP + 0xff00],0x0
1000:1375          e91501                         JMP 0x1000:148d
LAB_1000_1378:
1000:1378          c68600ff00                     MOV byte ptr [BP + 0xff00],0x0
1000:137d          83bee9ed00                     CMP word ptr [BP + 0xede9],0x0
1000:1382          743d                           JZ 0x1000:13c1
1000:1384          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:1388          16                             PUSH SS
1000:1389          57                             PUSH DI
1000:138a          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:138e          16                             PUSH SS
1000:138f          57                             PUSH DI
1000:1390          9a91086810                     CALLF 0x1068:0891
1000:1395          bf880c                         MOV DI,0xc88
1000:1398          0e                             PUSH CS
1000:1399          57                             PUSH DI
1000:139a          9a10096810                     CALLF 0x1068:0910
1000:139f          8dbe44e9                       LEA DI,[BP + 0xe944]
1000:13a3          16                             PUSH SS
1000:13a4          57                             PUSH DI
1000:13a5          ffb6e9ed                       PUSH word ptr [BP + 0xede9]
1000:13a9          9a90001010                     CALLF 0x1010:0090
1000:13ae          9a10096810                     CALLF 0x1068:0910
1000:13b3          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:13b7          16                             PUSH SS
1000:13b8          57                             PUSH DI
1000:13b9          68ff00                         PUSH 0xff
1000:13bc          9aab086810                     CALLF 0x1068:08ab
LAB_1000_13c1:
1000:13c1          83beebed00                     CMP word ptr [BP + 0xedeb],0x0
1000:13c6          743d                           JZ 0x1000:1405
1000:13c8          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:13cc          16                             PUSH SS
1000:13cd          57                             PUSH DI
1000:13ce          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:13d2          16                             PUSH SS
1000:13d3          57                             PUSH DI
1000:13d4          9a91086810                     CALLF 0x1068:0891
1000:13d9          bf8e0c                         MOV DI,0xc8e
1000:13dc          0e                             PUSH CS
1000:13dd          57                             PUSH DI
1000:13de          9a10096810                     CALLF 0x1068:0910
1000:13e3          8dbe44e9                       LEA DI,[BP + 0xe944]
1000:13e7          16                             PUSH SS
1000:13e8          57                             PUSH DI
1000:13e9          ffb6ebed                       PUSH word ptr [BP + 0xedeb]
1000:13ed          9a90001010                     CALLF 0x1010:0090
1000:13f2          9a10096810                     CALLF 0x1068:0910
1000:13f7          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:13fb          16                             PUSH SS
1000:13fc          57                             PUSH DI
1000:13fd          68ff00                         PUSH 0xff
1000:1400          9aab086810                     CALLF 0x1068:08ab
LAB_1000_1405:
1000:1405          83beeded00                     CMP word ptr [BP + 0xeded],0x0
1000:140a          743d                           JZ 0x1000:1449
1000:140c          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:1410          16                             PUSH SS
1000:1411          57                             PUSH DI
1000:1412          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:1416          16                             PUSH SS
1000:1417          57                             PUSH DI
1000:1418          9a91086810                     CALLF 0x1068:0891
1000:141d          bf900c                         MOV DI,0xc90
1000:1420          0e                             PUSH CS
1000:1421          57                             PUSH DI
1000:1422          9a10096810                     CALLF 0x1068:0910
1000:1427          8dbe44e9                       LEA DI,[BP + 0xe944]
1000:142b          16                             PUSH SS
1000:142c          57                             PUSH DI
1000:142d          ffb6eded                       PUSH word ptr [BP + 0xeded]
1000:1431          9a90001010                     CALLF 0x1010:0090
1000:1436          9a10096810                     CALLF 0x1068:0910
1000:143b          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:143f          16                             PUSH SS
1000:1440          57                             PUSH DI
1000:1441          68ff00                         PUSH 0xff
1000:1444          9aab086810                     CALLF 0x1068:08ab
LAB_1000_1449:
1000:1449          83beefed00                     CMP word ptr [BP + 0xedef],0x0
1000:144e          743d                           JZ 0x1000:148d
1000:1450          8dbe44ea                       LEA DI,[BP + 0xea44]
1000:1454          16                             PUSH SS
1000:1455          57                             PUSH DI
1000:1456          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:145a          16                             PUSH SS
1000:145b          57                             PUSH DI
1000:145c          9a91086810                     CALLF 0x1068:0891
1000:1461          bf8e0c                         MOV DI,0xc8e
1000:1464          0e                             PUSH CS
1000:1465          57                             PUSH DI
1000:1466          9a10096810                     CALLF 0x1068:0910
1000:146b          8dbe44e9                       LEA DI,[BP + 0xe944]
1000:146f          16                             PUSH SS
1000:1470          57                             PUSH DI
1000:1471          ffb6efed                       PUSH word ptr [BP + 0xedef]
1000:1475          9a90001010                     CALLF 0x1010:0090
1000:147a          9a10096810                     CALLF 0x1068:0910
1000:147f          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:1483          16                             PUSH SS
1000:1484          57                             PUSH DI
1000:1485          68ff00                         PUSH 0xff
1000:1488          9aab086810                     CALLF 0x1068:08ab
LAB_1000_148d:
1000:148d          8dbe00ff                       LEA DI,[BP + 0xff00]
1000:1491          16                             PUSH SS
1000:1492          57                             PUSH DI
1000:1493          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:1497          c1e002                         SHL AX,0x2
1000:149a          c47e06                         LES DI,[BP + 0x6]
1000:149d          03f8                           ADD DI,AX
1000:149f          26c4bd946b                     LES DI,ES:[DI + 0x6b94]
1000:14a4          06                             PUSH ES
1000:14a5          57                             PUSH DI
1000:14a6          6a1e                           PUSH 0x1e
1000:14a8          9aab086810                     CALLF 0x1068:08ab
1000:14ad          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:14b1          40                             INC AX
1000:14b2          8bf8                           MOV DI,AX
1000:14b4          8a83f2ed                       MOV AL,byte ptr [BP + DI + 0xedf2]
1000:14b8          30e4                           XOR AH,AH
1000:14ba          40                             INC AX
1000:14bb          40                             INC AX
1000:14bc          0186fcfd                       ADD word ptr [BP + 0xfdfc],AX
1000:14c0          eb7a                           JMP 0x1000:153c
LAB_1000_14c2:
1000:14c2          3c07                           CMP AL,0x7
1000:14c4          7561                           JNZ 0x1000:1527
1000:14c6          ff86fcfd                       INC word ptr [BP + 0xfdfc]
1000:14ca          81befcfdac0d                   CMP word ptr [BP + 0xfdfc],0xdac
1000:14d0          7653                           JBE 0x1000:1525
1000:14d2          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1000:14d6          31d2                           XOR DX,DX
1000:14d8          0386f2fd                       ADD AX,word ptr [BP + 0xfdf2]
1000:14dc          1396f4fd                       ADC DX,word ptr [BP + 0xfdf4]
1000:14e0          8986f2fd                       MOV word ptr [BP + 0xfdf2],AX
1000:14e4          8996f4fd                       MOV word ptr [BP + 0xfdf4],DX
1000:14e8          8dbe62ed                       LEA DI,[BP + 0xed62]
1000:14ec          16                             PUSH SS
1000:14ed          57                             PUSH DI
1000:14ee          ffb6f4fd                       PUSH word ptr [BP + 0xfdf4]
1000:14f2          ffb6f2fd                       PUSH word ptr [BP + 0xfdf2]
1000:14f6          9afe076810                     CALLF 0x1068:07fe
1000:14fb          9a8f036810                     CALLF 0x1068:038f
1000:1500          31c0                           XOR AX,AX
1000:1502          8986fcfd                       MOV word ptr [BP + 0xfdfc],AX
1000:1506          8dbe62ed                       LEA DI,[BP + 0xed62]
1000:150a          16                             PUSH SS
1000:150b          57                             PUSH DI
1000:150c          8dbef2ed                       LEA DI,[BP + 0xedf2]
1000:1510          16                             PUSH SS
1000:1511          57                             PUSH DI
1000:1512          680010                         PUSH 0x1000
1000:1515          8dbefafd                       LEA DI,[BP + 0xfdfa]
1000:1519          16                             PUSH SS
1000:151a          57                             PUSH DI
1000:151b          9a96076810                     CALLF 0x1068:0796
1000:1520          9a8f036810                     CALLF 0x1068:038f
LAB_1000_1525:
1000:1525          eb15                           JMP 0x1000:153c
LAB_1000_1527:
1000:1527          3c20                           CMP AL,0x20
1000:1529          7511                           JNZ 0x1000:153c
1000:152b          8b86f8fd                       MOV AX,word ptr [BP + 0xfdf8]
1000:152f          c47e06                         LES DI,[BP + 0x6]
1000:1532          268985b8b9                     MOV word ptr ES:[DI + 0xb9b8],AX
1000:1537          c686e3ed01                     MOV byte ptr [BP + 0xede3],0x1
LAB_1000_153c:
1000:153c          80bee3ed00                     CMP byte ptr [BP + 0xede3],0x0
1000:1541          7503                           JNZ 0x1000:1546
1000:1543          e919f8                         JMP 0x1000:0d5f
LAB_1000_1546:
1000:1546          8dbe62ed                       LEA DI,[BP + 0xed62]
1000:154a          16                             PUSH SS
1000:154b          57                             PUSH DI
1000:154c          9a2c076810                     CALLF 0x1068:072c
1000:1551          9a8f036810                     CALLF 0x1068:038f
1000:1556          31c0                           XOR AX,AX
1000:1558          898648eb                       MOV word ptr [BP + 0xeb48],AX
1000:155c          bfb00a                         MOV DI,0xab0
1000:155f          b80010                         MOV AX,0x1000
1000:1562          50                             PUSH AX
1000:1563          57                             PUSH DI
1000:1564          c47e06                         LES DI,[BP + 0x6]
1000:1567          26c47d26                       LES DI,ES:[DI + 0x26]
1000:156b          06                             PUSH ES
1000:156c          57                             PUSH DI
1000:156d          9a5f025010                     CALLF 0x1050:025f
LAB_1000_1572:
1000:1572          c9                             LEAVE
1000:1573          ca0400                         RETF 0x4
FUN_1000_157a:
1000:157a          55                             PUSH BP
1000:157b          89e5                           MOV BP,SP
1000:157d          b81801                         MOV AX,0x118
1000:1580          9acb036810                     CALLF 0x1068:03cb
1000:1585          81ec1801                       SUB SP,0x118
1000:1589          c606901a02                     MOV byte ptr [0x1a90],0x2
1000:158e          6a00                           PUSH 0x0
1000:1590          6a00                           PUSH 0x0
1000:1592          68027f                         PUSH 0x7f02
1000:1595          9abc015011                     CALLF 0x1150:01bc
1000:159a          50                             PUSH AX
1000:159b          9a4c015011                     CALLF 0x1150:014c
1000:15a0          6a00                           PUSH 0x0
1000:15a2          6a00                           PUSH 0x0
1000:15a4          c47e06                         LES DI,[BP + 0x6]
1000:15a7          06                             PUSH ES
1000:15a8          57                             PUSH DI
1000:15a9          9ad1001010                     CALLF 0x1010:00d1
1000:15ae          6a68                           PUSH 0x68
1000:15b0          c47e06                         LES DI,[BP + 0x6]
1000:15b3          06                             PUSH ES
1000:15b4          57                             PUSH DI
1000:15b5          9a2e021010                     CALLF 0x1010:022e
1000:15ba          bf7615                         MOV DI,0x1576
1000:15bd          0e                             PUSH CS
1000:15be          57                             PUSH DI
1000:15bf          bf921a                         MOV DI,0x1a92
1000:15c2          1e                             PUSH DS
1000:15c3          57                             PUSH DI
1000:15c4          68ff00                         PUSH 0xff
1000:15c7          9aab086810                     CALLF 0x1068:08ab
1000:15cc          c606cc9400                     MOV byte ptr [0x94cc],0x0
1000:15d1          6a45                           PUSH 0x45
1000:15d3          6a13                           PUSH 0x13
1000:15d5          9a0f001810                     CALLF 0x1018:000f
1000:15da          8986f6fe                       MOV word ptr [BP + 0xfef6],AX
1000:15de          803ecc9400                     CMP byte ptr [0x94cc],0x0
1000:15e3          7410                           JZ 0x1000:15f5
1000:15e5          31c0                           XOR AX,AX
1000:15e7          50                             PUSH AX
1000:15e8          c47e06                         LES DI,[BP + 0x6]
1000:15eb          06                             PUSH ES
1000:15ec          57                             PUSH DI
1000:15ed          9ada000010                     CALLF 0x1000:00da
1000:15f2          e9ed00                         JMP 0x1000:16e2
LAB_1000_15f5:
1000:15f5          c47e06                         LES DI,[BP + 0x6]
1000:15f8          06                             PUSH ES
1000:15f9          57                             PUSH DI
1000:15fa          9a13010010                     CALLF 0x1000:0113
1000:15ff          6a64                           PUSH 0x64
1000:1601          6a0a                           PUSH 0xa
1000:1603          b85800                         MOV AX,0x58
1000:1606          50                             PUSH AX
1000:1607          31c0                           XOR AX,AX
1000:1609          50                             PUSH AX
1000:160a          50                             PUSH AX
1000:160b          9aac035010                     CALLF 0x1050:03ac
1000:1610          c47e06                         LES DI,[BP + 0x6]
1000:1613          26894526                       MOV word ptr ES:[DI + 0x26],AX
1000:1617          26895528                       MOV word ptr ES:[DI + 0x28],DX
1000:161b          26c47d26                       LES DI,ES:[DI + 0x26]
1000:161f          26c6450c00                     MOV byte ptr ES:[DI + 0xc],0x0
1000:1624          c47e06                         LES DI,[BP + 0x6]
1000:1627          06                             PUSH ES
1000:1628          57                             PUSH DI
1000:1629          9a970c0010                     CALLF 0x1000:0c97
1000:162e          803e8e1a00                     CMP byte ptr [0x1a8e],0x0
1000:1633          7419                           JZ 0x1000:164e
1000:1635          8dbee8fe                       LEA DI,[BP + 0xfee8]
1000:1639          16                             PUSH SS
1000:163a          57                             PUSH DI
1000:163b          c47e06                         LES DI,[BP + 0x6]
1000:163e          06                             PUSH ES
1000:163f          57                             PUSH DI
1000:1640          268b3d                         MOV DI,word ptr ES:[DI]
1000:1643          b80a80                         MOV AX,0x800a
1000:1646          9a3d0d6810                     CALLF 0x1068:0d3d
1000:164b          e99400                         JMP 0x1000:16e2
LAB_1000_164e:
1000:164e          6a00                           PUSH 0x0
1000:1650          6a00                           PUSH 0x0
1000:1652          68007f                         PUSH 0x7f00
1000:1655          9abc015011                     CALLF 0x1150:01bc
1000:165a          50                             PUSH AX
1000:165b          9a4c015011                     CALLF 0x1150:014c
1000:1660          6a05                           PUSH 0x5
1000:1662          9a2d016810                     CALLF 0x1068:012d
1000:1667          8946fc                         MOV word ptr [BP + -0x4],AX
1000:166a          8956fe                         MOV word ptr [BP + -0x2],DX
1000:166d          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1670          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1673          bf7815                         MOV DI,0x1578
1000:1676          0e                             PUSH CS
1000:1677          57                             PUSH DI
1000:1678          9a9f006010                     CALLF 0x1060:009f
1000:167d          c47e06                         LES DI,[BP + 0x6]
1000:1680          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:1684          6a67                           PUSH 0x67
1000:1686          681004                         PUSH 0x410
1000:1689          6a00                           PUSH 0x0
1000:168b          ff76fe                         PUSH word ptr [BP + -0x2]
1000:168e          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1691          9a64015011                     CALLF 0x1150:0164
1000:1696          a3ca94                         MOV [0x94ca],AX
1000:1699          ff76fe                         PUSH word ptr [BP + -0x2]
1000:169c          ff76fc                         PUSH word ptr [BP + -0x4]
1000:169f          6a05                           PUSH 0x5
1000:16a1          9a47016810                     CALLF 0x1068:0147
1000:16a6          c47e06                         LES DI,[BP + 0x6]
1000:16a9          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:16ad          6a67                           PUSH 0x67
1000:16af          680704                         PUSH 0x407
1000:16b2          ff36ca94                       PUSH word ptr [0x94ca]
1000:16b6          6a00                           PUSH 0x0
1000:16b8          6a00                           PUSH 0x0
1000:16ba          9a64015011                     CALLF 0x1150:0164
1000:16bf          c47e06                         LES DI,[BP + 0x6]
1000:16c2          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:16c6          6a67                           PUSH 0x67
1000:16c8          681804                         PUSH 0x418
1000:16cb          ff36ca94                       PUSH word ptr [0x94ca]
1000:16cf          6a00                           PUSH 0x0
1000:16d1          6a00                           PUSH 0x0
1000:16d3          9a64015011                     CALLF 0x1150:0164
1000:16d8          c47e06                         LES DI,[BP + 0x6]
1000:16db          06                             PUSH ES
1000:16dc          57                             PUSH DI
1000:16dd          9a83170010                     CALLF 0x1000:1783
LAB_1000_16e2:
1000:16e2          c9                             LEAVE
1000:16e3          ca0400                         RETF 0x4
FUN_1000_1783:
1000:1783          55                             PUSH BP
1000:1784          89e5                           MOV BP,SP
1000:1786          b81802                         MOV AX,0x218
1000:1789          9acb036810                     CALLF 0x1068:03cb
1000:178e          81ec1802                       SUB SP,0x218
1000:1792          c47e06                         LES DI,[BP + 0x6]
1000:1795          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:1799          6a67                           PUSH 0x67
1000:179b          680904                         PUSH 0x409
1000:179e          6a00                           PUSH 0x0
1000:17a0          6a00                           PUSH 0x0
1000:17a2          6a00                           PUSH 0x0
1000:17a4          9a64015011                     CALLF 0x1150:0164
1000:17a9          050100                         ADD AX,0x1
1000:17ac          83d200                         ADC DX,0x0
1000:17af          a3ca94                         MOV [0x94ca],AX
1000:17b2          6a32                           PUSH 0x32
1000:17b4          9a2d016810                     CALLF 0x1068:012d
1000:17b9          8946fc                         MOV word ptr [BP + -0x4],AX
1000:17bc          8956fe                         MOV word ptr [BP + -0x2],DX
1000:17bf          a1ca94                         MOV AX,[0x94ca]
1000:17c2          31d2                           XOR DX,DX
1000:17c4          83faff                         CMP DX,-0x1
1000:17c7          7505                           JNZ 0x1000:17ce
1000:17c9          3dffff                         CMP AX,0xffff
1000:17cc          741c                           JZ 0x1000:17ea
LAB_1000_17ce:
1000:17ce          c47e06                         LES DI,[BP + 0x6]
1000:17d1          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:17d5          6a67                           PUSH 0x67
1000:17d7          680a04                         PUSH 0x40a
1000:17da          a1ca94                         MOV AX,[0x94ca]
1000:17dd          48                             DEC AX
1000:17de          50                             PUSH AX
1000:17df          ff76fe                         PUSH word ptr [BP + -0x2]
1000:17e2          ff76fc                         PUSH word ptr [BP + -0x4]
1000:17e5          9a64015011                     CALLF 0x1150:0164
LAB_1000_17ea:
1000:17ea          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:17ee          16                             PUSH SS
1000:17ef          57                             PUSH DI
1000:17f0          ff76fe                         PUSH word ptr [BP + -0x2]
1000:17f3          ff76fc                         PUSH word ptr [BP + -0x4]
1000:17f6          9a7e016010                     CALLF 0x1060:017e
1000:17fb          8dbeeafe                       LEA DI,[BP + 0xfeea]
1000:17ff          16                             PUSH SS
1000:1800          57                             PUSH DI
1000:1801          68ff00                         PUSH 0xff
1000:1804          9aab086810                     CALLF 0x1068:08ab
1000:1809          a1ca94                         MOV AX,[0x94ca]
1000:180c          d1e0                           SHL AX,0x1
1000:180e          c47e06                         LES DI,[BP + 0x6]
1000:1811          03f8                           ADD DI,AX
1000:1813          268b852ea6                     MOV AX,word ptr ES:[DI + 0xa62e]
1000:1818          a3ca94                         MOV [0x94ca],AX
1000:181b          8dbeeafe                       LEA DI,[BP + 0xfeea]
1000:181f          16                             PUSH SS
1000:1820          57                             PUSH DI
1000:1821          bf921c                         MOV DI,0x1c92
1000:1824          1e                             PUSH DS
1000:1825          57                             PUSH DI
1000:1826          68ff00                         PUSH 0xff
1000:1829          9aab086810                     CALLF 0x1068:08ab
1000:182e          68f401                         PUSH 0x1f4
1000:1831          9a2d016810                     CALLF 0x1068:012d
1000:1836          8946f4                         MOV word ptr [BP + -0xc],AX
1000:1839          8956f6                         MOV word ptr [BP + -0xa],DX
1000:183c          68f401                         PUSH 0x1f4
1000:183f          9a2d016810                     CALLF 0x1068:012d
1000:1844          8946f0                         MOV word ptr [BP + -0x10],AX
1000:1847          8956f2                         MOV word ptr [BP + -0xe],DX
1000:184a          68e803                         PUSH 0x3e8
1000:184d          9a2d016810                     CALLF 0x1068:012d
1000:1852          8946f8                         MOV word ptr [BP + -0x8],AX
1000:1855          8956fa                         MOV word ptr [BP + -0x6],DX
1000:1858          68e803                         PUSH 0x3e8
1000:185b          9a2d016810                     CALLF 0x1068:012d
1000:1860          8946ec                         MOV word ptr [BP + -0x14],AX
1000:1863          8956ee                         MOV word ptr [BP + -0x12],DX
1000:1866          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:186b          c47e06                         LES DI,[BP + 0x6]
1000:186e          03f8                           ADD DI,AX
1000:1870          268a85e909                     MOV AL,byte ptr ES:[DI + 0x9e9]
1000:1875          30e4                           XOR AH,AH
1000:1877          6bf851                         IMUL DI,AX,0x51
1000:187a          81c74c07                       ADD DI,0x74c
1000:187e          1e                             PUSH DS
1000:187f          57                             PUSH DI
1000:1880          bfc893                         MOV DI,0x93c8
1000:1883          1e                             PUSH DS
1000:1884          57                             PUSH DI
1000:1885          68ff00                         PUSH 0xff
1000:1888          9aab086810                     CALLF 0x1068:08ab
1000:188d          a1ca94                         MOV AX,[0x94ca]
1000:1890          c1e002                         SHL AX,0x2
1000:1893          c47e06                         LES DI,[BP + 0x6]
1000:1896          03f8                           ADD DI,AX
1000:1898          26c4bd946b                     LES DI,ES:[DI + 0x6b94]
1000:189d          26803d00                       CMP byte ptr ES:[DI],0x0
1000:18a1          743e                           JZ 0x1000:18e1
1000:18a3          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:18a8          c47e06                         LES DI,[BP + 0x6]
1000:18ab          03f8                           ADD DI,AX
1000:18ad          268a85e909                     MOV AL,byte ptr ES:[DI + 0x9e9]
1000:18b2          3c01                           CMP AL,0x1
1000:18b4          7204                           JC 0x1000:18ba
1000:18b6          3c03                           CMP AL,0x3
1000:18b8          7608                           JBE 0x1000:18c2
LAB_1000_18ba:
1000:18ba          3c05                           CMP AL,0x5
1000:18bc          7223                           JC 0x1000:18e1
1000:18be          3c07                           CMP AL,0x7
1000:18c0          771f                           JA 0x1000:18e1
LAB_1000_18c2:
1000:18c2          a1ca94                         MOV AX,[0x94ca]
1000:18c5          c1e002                         SHL AX,0x2
1000:18c8          c47e06                         LES DI,[BP + 0x6]
1000:18cb          03f8                           ADD DI,AX
1000:18cd          26c4bd946b                     LES DI,ES:[DI + 0x6b94]
1000:18d2          06                             PUSH ES
1000:18d3          57                             PUSH DI
1000:18d4          bfc893                         MOV DI,0x93c8
1000:18d7          1e                             PUSH DS
1000:18d8          57                             PUSH DI
1000:18d9          68ff00                         PUSH 0xff
1000:18dc          9aab086810                     CALLF 0x1068:08ab
LAB_1000_18e1:
1000:18e1          bfe616                         MOV DI,0x16e6
1000:18e4          0e                             PUSH CS
1000:18e5          57                             PUSH DI
1000:18e6          bfc893                         MOV DI,0x93c8
1000:18e9          1e                             PUSH DS
1000:18ea          57                             PUSH DI
1000:18eb          9a3c096810                     CALLF 0x1068:093c
1000:18f0          09c0                           OR AX,AX
1000:18f2          7503                           JNZ 0x1000:18f7
1000:18f4          e99000                         JMP 0x1000:1987
LAB_1000_18f7:
1000:18f7          bfeb16                         MOV DI,0x16eb
1000:18fa          0e                             PUSH CS
1000:18fb          57                             PUSH DI
1000:18fc          bfc893                         MOV DI,0x93c8
1000:18ff          1e                             PUSH DS
1000:1900          57                             PUSH DI
1000:1901          9a3c096810                     CALLF 0x1068:093c
1000:1906          09c0                           OR AX,AX
1000:1908          743d                           JZ 0x1000:1947
1000:190a          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:190e          16                             PUSH SS
1000:190f          57                             PUSH DI
1000:1910          bfc893                         MOV DI,0x93c8
1000:1913          1e                             PUSH DS
1000:1914          57                             PUSH DI
1000:1915          9a91086810                     CALLF 0x1068:0891
1000:191a          bff016                         MOV DI,0x16f0
1000:191d          0e                             PUSH CS
1000:191e          57                             PUSH DI
1000:191f          9a10096810                     CALLF 0x1068:0910
1000:1924          bff216                         MOV DI,0x16f2
1000:1927          0e                             PUSH CS
1000:1928          57                             PUSH DI
1000:1929          9a10096810                     CALLF 0x1068:0910
1000:192e          bff816                         MOV DI,0x16f8
1000:1931          0e                             PUSH CS
1000:1932          57                             PUSH DI
1000:1933          9a10096810                     CALLF 0x1068:0910
1000:1938          bfc893                         MOV DI,0x93c8
1000:193b          1e                             PUSH DS
1000:193c          57                             PUSH DI
1000:193d          68ff00                         PUSH 0xff
1000:1940          9aab086810                     CALLF 0x1068:08ab
1000:1945          eb3e                           JMP 0x1000:1985
LAB_1000_1947:
1000:1947          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:194b          16                             PUSH SS
1000:194c          57                             PUSH DI
1000:194d          bfc893                         MOV DI,0x93c8
1000:1950          1e                             PUSH DS
1000:1951          57                             PUSH DI
1000:1952          bffa16                         MOV DI,0x16fa
1000:1955          0e                             PUSH CS
1000:1956          57                             PUSH DI
1000:1957          9a5a021010                     CALLF 0x1010:025a
1000:195c          bfc893                         MOV DI,0x93c8
1000:195f          1e                             PUSH DS
1000:1960          57                             PUSH DI
1000:1961          68ff00                         PUSH 0xff
1000:1964          9aab086810                     CALLF 0x1068:08ab
1000:1969          bfc893                         MOV DI,0x93c8
1000:196c          1e                             PUSH DS
1000:196d          57                             PUSH DI
1000:196e          bf1a17                         MOV DI,0x171a
1000:1971          0e                             PUSH CS
1000:1972          57                             PUSH DI
1000:1973          bfc893                         MOV DI,0x93c8
1000:1976          1e                             PUSH DS
1000:1977          57                             PUSH DI
1000:1978          9a3c096810                     CALLF 0x1068:093c
1000:197d          50                             PUSH AX
1000:197e          6a05                           PUSH 0x5
1000:1980          9a6d031010                     CALLF 0x1010:036d
LAB_1000_1985:
1000:1985          eb5f                           JMP 0x1000:19e6
LAB_1000_1987:
1000:1987          bf2017                         MOV DI,0x1720
1000:198a          0e                             PUSH CS
1000:198b          57                             PUSH DI
1000:198c          bfc893                         MOV DI,0x93c8
1000:198f          1e                             PUSH DS
1000:1990          57                             PUSH DI
1000:1991          9a3c096810                     CALLF 0x1068:093c
1000:1996          09c0                           OR AX,AX
1000:1998          744c                           JZ 0x1000:19e6
1000:199a          bfc893                         MOV DI,0x93c8
1000:199d          1e                             PUSH DS
1000:199e          57                             PUSH DI
1000:199f          6a01                           PUSH 0x1
1000:19a1          6a01                           PUSH 0x1
1000:19a3          9a6d031010                     CALLF 0x1010:036d
1000:19a8          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:19ac          16                             PUSH SS
1000:19ad          57                             PUSH DI
1000:19ae          bfc893                         MOV DI,0x93c8
1000:19b1          1e                             PUSH DS
1000:19b2          57                             PUSH DI
1000:19b3          bf2617                         MOV DI,0x1726
1000:19b6          0e                             PUSH CS
1000:19b7          57                             PUSH DI
1000:19b8          9a5a021010                     CALLF 0x1010:025a
1000:19bd          bfc893                         MOV DI,0x93c8
1000:19c0          1e                             PUSH DS
1000:19c1          57                             PUSH DI
1000:19c2          68ff00                         PUSH 0xff
1000:19c5          9aab086810                     CALLF 0x1068:08ab
1000:19ca          bfc893                         MOV DI,0x93c8
1000:19cd          1e                             PUSH DS
1000:19ce          57                             PUSH DI
1000:19cf          bf2017                         MOV DI,0x1720
1000:19d2          0e                             PUSH CS
1000:19d3          57                             PUSH DI
1000:19d4          bfc893                         MOV DI,0x93c8
1000:19d7          1e                             PUSH DS
1000:19d8          57                             PUSH DI
1000:19d9          9a3c096810                     CALLF 0x1068:093c
1000:19de          50                             PUSH AX
1000:19df          6a05                           PUSH 0x5
1000:19e1          9a6d031010                     CALLF 0x1010:036d
LAB_1000_19e6:
1000:19e6          a1ca94                         MOV AX,[0x94ca]
1000:19e9          c1e002                         SHL AX,0x2
1000:19ec          c47e06                         LES DI,[BP + 0x6]
1000:19ef          03f8                           ADD DI,AX
1000:19f1          26c4bd946b                     LES DI,ES:[DI + 0x6b94]
1000:19f6          26803d00                       CMP byte ptr ES:[DI],0x0
1000:19fa          7465                           JZ 0x1000:1a61
1000:19fc          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:1a01          c47e06                         LES DI,[BP + 0x6]
1000:1a04          03f8                           ADD DI,AX
1000:1a06          268a85e909                     MOV AL,byte ptr ES:[DI + 0x9e9]
1000:1a0b          3c01                           CMP AL,0x1
1000:1a0d          7204                           JC 0x1000:1a13
1000:1a0f          3c03                           CMP AL,0x3
1000:1a11          7608                           JBE 0x1000:1a1b
LAB_1000_1a13:
1000:1a13          3c05                           CMP AL,0x5
1000:1a15          724a                           JC 0x1000:1a61
1000:1a17          3c07                           CMP AL,0x7
1000:1a19          7746                           JA 0x1000:1a61
LAB_1000_1a1b:
1000:1a1b          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:1a1f          16                             PUSH SS
1000:1a20          57                             PUSH DI
1000:1a21          6b06ca940a                     IMUL AX,word ptr [0x94ca],0xa
1000:1a26          c47e06                         LES DI,[BP + 0x6]
1000:1a29          03f8                           ADD DI,AX
1000:1a2b          268a85e909                     MOV AL,byte ptr ES:[DI + 0x9e9]
1000:1a30          30e4                           XOR AH,AH
1000:1a32          6bf851                         IMUL DI,AX,0x51
1000:1a35          81c74c07                       ADD DI,0x74c
1000:1a39          1e                             PUSH DS
1000:1a3a          57                             PUSH DI
1000:1a3b          9a91086810                     CALLF 0x1068:0891
1000:1a40          bff016                         MOV DI,0x16f0
1000:1a43          0e                             PUSH CS
1000:1a44          57                             PUSH DI
1000:1a45          9a10096810                     CALLF 0x1068:0910
1000:1a4a          bfc893                         MOV DI,0x93c8
1000:1a4d          1e                             PUSH DS
1000:1a4e          57                             PUSH DI
1000:1a4f          9a10096810                     CALLF 0x1068:0910
1000:1a54          bfc893                         MOV DI,0x93c8
1000:1a57          1e                             PUSH DS
1000:1a58          57                             PUSH DI
1000:1a59          68ff00                         PUSH 0xff
1000:1a5c          9aab086810                     CALLF 0x1068:08ab
LAB_1000_1a61:
1000:1a61          ff76f6                         PUSH word ptr [BP + -0xa]
1000:1a64          ff76f4                         PUSH word ptr [BP + -0xc]
1000:1a67          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:1a6b          16                             PUSH SS
1000:1a6c          57                             PUSH DI
1000:1a6d          c47e06                         LES DI,[BP + 0x6]
1000:1a70          06                             PUSH ES
1000:1a71          57                             PUSH DI
1000:1a72          9a95010010                     CALLF 0x1000:0195
1000:1a77          9a9f006010                     CALLF 0x1060:009f
1000:1a7c          ff76f2                         PUSH word ptr [BP + -0xe]
1000:1a7f          ff76f0                         PUSH word ptr [BP + -0x10]
1000:1a82          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:1a86          16                             PUSH SS
1000:1a87          57                             PUSH DI
1000:1a88          c47e06                         LES DI,[BP + 0x6]
1000:1a8b          06                             PUSH ES
1000:1a8c          57                             PUSH DI
1000:1a8d          9acb020010                     CALLF 0x1000:02cb
1000:1a92          9a9f006010                     CALLF 0x1060:009f
1000:1a97          ff76ee                         PUSH word ptr [BP + -0x12]
1000:1a9a          ff76ec                         PUSH word ptr [BP + -0x14]
1000:1a9d          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:1aa1          16                             PUSH SS
1000:1aa2          57                             PUSH DI
1000:1aa3          c47e06                         LES DI,[BP + 0x6]
1000:1aa6          06                             PUSH ES
1000:1aa7          57                             PUSH DI
1000:1aa8          9aa8040010                     CALLF 0x1000:04a8
1000:1aad          9a9f006010                     CALLF 0x1060:009f
1000:1ab2          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1ab5          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1ab8          9a58016010                     CALLF 0x1060:0158
1000:1abd          8dbee8fd                       LEA DI,[BP + 0xfde8]
1000:1ac1          16                             PUSH SS
1000:1ac2          57                             PUSH DI
1000:1ac3          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1ac6          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1ac9          9a7e016010                     CALLF 0x1060:017e
1000:1ace          bfc892                         MOV DI,0x92c8
1000:1ad1          1e                             PUSH DS
1000:1ad2          57                             PUSH DI
1000:1ad3          68ff00                         PUSH 0xff
1000:1ad6          9aab086810                     CALLF 0x1068:08ab
1000:1adb          ff76fa                         PUSH word ptr [BP + -0x6]
1000:1ade          ff76f8                         PUSH word ptr [BP + -0x8]
1000:1ae1          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1ae4          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1ae7          9abd006010                     CALLF 0x1060:00bd
1000:1aec          8946f8                         MOV word ptr [BP + -0x8],AX
1000:1aef          8956fa                         MOV word ptr [BP + -0x6],DX
1000:1af2          ff76fa                         PUSH word ptr [BP + -0x6]
1000:1af5          ff76f8                         PUSH word ptr [BP + -0x8]
1000:1af8          bf9a01                         MOV DI,0x19a
1000:1afb          1e                             PUSH DS
1000:1afc          57                             PUSH DI
1000:1afd          9abd006010                     CALLF 0x1060:00bd
1000:1b02          8946f8                         MOV word ptr [BP + -0x8],AX
1000:1b05          8956fa                         MOV word ptr [BP + -0x6],DX
1000:1b08          ff76fa                         PUSH word ptr [BP + -0x6]
1000:1b0b          ff76f8                         PUSH word ptr [BP + -0x8]
1000:1b0e          ff76f6                         PUSH word ptr [BP + -0xa]
1000:1b11          ff76f4                         PUSH word ptr [BP + -0xc]
1000:1b14          9abd006010                     CALLF 0x1060:00bd
1000:1b19          8946f8                         MOV word ptr [BP + -0x8],AX
1000:1b1c          8956fa                         MOV word ptr [BP + -0x6],DX
1000:1b1f          ff76fa                         PUSH word ptr [BP + -0x6]
1000:1b22          ff76f8                         PUSH word ptr [BP + -0x8]
1000:1b25          ff76f2                         PUSH word ptr [BP + -0xe]
1000:1b28          ff76f0                         PUSH word ptr [BP + -0x10]
1000:1b2b          9abd006010                     CALLF 0x1060:00bd
1000:1b30          8946f8                         MOV word ptr [BP + -0x8],AX
1000:1b33          8956fa                         MOV word ptr [BP + -0x6],DX
1000:1b36          ff76fa                         PUSH word ptr [BP + -0x6]
1000:1b39          ff76f8                         PUSH word ptr [BP + -0x8]
1000:1b3c          ff76ee                         PUSH word ptr [BP + -0x12]
1000:1b3f          ff76ec                         PUSH word ptr [BP + -0x14]
1000:1b42          9abd006010                     CALLF 0x1060:00bd
1000:1b47          8946f8                         MOV word ptr [BP + -0x8],AX
1000:1b4a          8956fa                         MOV word ptr [BP + -0x6],DX
1000:1b4d          c47e06                         LES DI,[BP + 0x6]
1000:1b50          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:1b54          6a5b                           PUSH 0x5b
1000:1b56          ff76fa                         PUSH word ptr [BP + -0x6]
1000:1b59          ff76f8                         PUSH word ptr [BP + -0x8]
1000:1b5c          9a5c015011                     CALLF 0x1150:015c
1000:1b61          ff76fa                         PUSH word ptr [BP + -0x6]
1000:1b64          ff76f8                         PUSH word ptr [BP + -0x8]
1000:1b67          68e803                         PUSH 0x3e8
1000:1b6a          9a47016810                     CALLF 0x1068:0147
1000:1b6f          ff76f6                         PUSH word ptr [BP + -0xa]
1000:1b72          ff76f4                         PUSH word ptr [BP + -0xc]
1000:1b75          68f401                         PUSH 0x1f4
1000:1b78          9a47016810                     CALLF 0x1068:0147
1000:1b7d          ff76f2                         PUSH word ptr [BP + -0xe]
1000:1b80          ff76f0                         PUSH word ptr [BP + -0x10]
1000:1b83          68f401                         PUSH 0x1f4
1000:1b86          9a47016810                     CALLF 0x1068:0147
1000:1b8b          ff76ee                         PUSH word ptr [BP + -0x12]
1000:1b8e          ff76ec                         PUSH word ptr [BP + -0x14]
1000:1b91          68e803                         PUSH 0x3e8
1000:1b94          9a47016810                     CALLF 0x1068:0147
1000:1b99          a1ca94                         MOV AX,[0x94ca]
1000:1b9c          c47e06                         LES DI,[BP + 0x6]
1000:1b9f          03f8                           ADD DI,AX
1000:1ba1          26807d2b00                     CMP byte ptr ES:[DI + 0x2b],0x0
1000:1ba6          741f                           JZ 0x1000:1bc7
1000:1ba8          803e901a00                     CMP byte ptr [0x1a90],0x0
1000:1bad          7416                           JZ 0x1000:1bc5
1000:1baf          6a0d                           PUSH 0xd
1000:1bb1          bf4617                         MOV DI,0x1746
1000:1bb4          0e                             PUSH CS
1000:1bb5          57                             PUSH DI
1000:1bb6          c47e06                         LES DI,[BP + 0x6]
1000:1bb9          06                             PUSH ES
1000:1bba          57                             PUSH DI
1000:1bbb          9ab5011010                     CALLF 0x1010:01b5
1000:1bc0          c606901a00                     MOV byte ptr [0x1a90],0x0
LAB_1000_1bc5:
1000:1bc5          eb1d                           JMP 0x1000:1be4
LAB_1000_1bc7:
1000:1bc7          803e901a01                     CMP byte ptr [0x1a90],0x1
1000:1bcc          7416                           JZ 0x1000:1be4
1000:1bce          6a0d                           PUSH 0xd
1000:1bd0          bf6517                         MOV DI,0x1765
1000:1bd3          0e                             PUSH CS
1000:1bd4          57                             PUSH DI
1000:1bd5          c47e06                         LES DI,[BP + 0x6]
1000:1bd8          06                             PUSH ES
1000:1bd9          57                             PUSH DI
1000:1bda          9ab5011010                     CALLF 0x1010:01b5
1000:1bdf          c606901a01                     MOV byte ptr [0x1a90],0x1
LAB_1000_1be4:
1000:1be4          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1be7          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1bea          6a32                           PUSH 0x32
1000:1bec          9a47016810                     CALLF 0x1068:0147
1000:1bf1          833ec89400                     CMP word ptr [0x94c8],0x0
1000:1bf6          750e                           JNZ 0x1000:1c06
1000:1bf8          6a0b                           PUSH 0xb
1000:1bfa          c47e06                         LES DI,[BP + 0x6]
1000:1bfd          06                             PUSH ES
1000:1bfe          57                             PUSH DI
1000:1bff          9a3c001010                     CALLF 0x1010:003c
1000:1c04          eb0c                           JMP 0x1000:1c12
LAB_1000_1c06:
1000:1c06          6a0b                           PUSH 0xb
1000:1c08          c47e06                         LES DI,[BP + 0x6]
1000:1c0b          06                             PUSH ES
1000:1c0c          57                             PUSH DI
1000:1c0d          9a66001010                     CALLF 0x1010:0066
LAB_1000_1c12:
1000:1c12          c9                             LEAVE
1000:1c13          ca0400                         RETF 0x4
FUN_1000_1c16:
1000:1c16          55                             PUSH BP
1000:1c17          89e5                           MOV BP,SP
1000:1c19          31c0                           XOR AX,AX
1000:1c1b          9acb036810                     CALLF 0x1068:03cb
1000:1c20          c47e0a                         LES DI,[BP + 0xa]
1000:1c23          26837d0801                     CMP word ptr ES:[DI + 0x8],0x1
1000:1c28          750a                           JNZ 0x1000:1c34
1000:1c2a          c47e06                         LES DI,[BP + 0x6]
1000:1c2d          06                             PUSH ES
1000:1c2e          57                             PUSH DI
1000:1c2f          9a83170010                     CALLF 0x1000:1783
LAB_1000_1c34:
1000:1c34          c9                             LEAVE
1000:1c35          ca0800                         RETF 0x8
FUN_1000_1c38:
1000:1c38          55                             PUSH BP
1000:1c39          89e5                           MOV BP,SP
1000:1c3b          b80a02                         MOV AX,0x20a
1000:1c3e          9acb036810                     CALLF 0x1068:03cb
1000:1c43          81ec0a02                       SUB SP,0x20a
1000:1c47          68ff00                         PUSH 0xff
1000:1c4a          9a2d016810                     CALLF 0x1068:012d
1000:1c4f          8946fc                         MOV word ptr [BP + -0x4],AX
1000:1c52          8956fe                         MOV word ptr [BP + -0x2],DX
1000:1c55          c47e06                         LES DI,[BP + 0x6]
1000:1c58          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:1c5c          6a69                           PUSH 0x69
1000:1c5e          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1c61          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1c64          68ff00                         PUSH 0xff
1000:1c67          9a60015011                     CALLF 0x1150:0160
1000:1c6c          8dbef6fd                       LEA DI,[BP + 0xfdf6]
1000:1c70          16                             PUSH SS
1000:1c71          57                             PUSH DI
1000:1c72          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1c75          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1c78          9a7e016010                     CALLF 0x1060:017e
1000:1c7d          8dbefcfe                       LEA DI,[BP + 0xfefc]
1000:1c81          16                             PUSH SS
1000:1c82          57                             PUSH DI
1000:1c83          68ff00                         PUSH 0xff
1000:1c86          9aab086810                     CALLF 0x1068:08ab
1000:1c8b          80befcfe00                     CMP byte ptr [BP + 0xfefc],0x0
1000:1c90          7503                           JNZ 0x1000:1c95
1000:1c92          e9cd00                         JMP 0x1000:1d62
LAB_1000_1c95:
1000:1c95          c47e06                         LES DI,[BP + 0x6]
1000:1c98          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:1c9c          6a67                           PUSH 0x67
1000:1c9e          680904                         PUSH 0x409
1000:1ca1          6a00                           PUSH 0x0
1000:1ca3          6a00                           PUSH 0x0
1000:1ca5          6a00                           PUSH 0x0
1000:1ca7          9a64015011                     CALLF 0x1150:0164
1000:1cac          8986fafe                       MOV word ptr [BP + 0xfefa],AX
1000:1cb0          a0921a                         MOV AL,[0x1a92]
1000:1cb3          3a86fcfe                       CMP AL,byte ptr [BP + 0xfefc]
1000:1cb7          7323                           JNC 0x1000:1cdc
1000:1cb9          c47e06                         LES DI,[BP + 0x6]
1000:1cbc          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:1cc0          6a67                           PUSH 0x67
1000:1cc2          681004                         PUSH 0x410
1000:1cc5          8b86fafe                       MOV AX,word ptr [BP + 0xfefa]
1000:1cc9          48                             DEC AX
1000:1cca          50                             PUSH AX
1000:1ccb          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1cce          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1cd1          9a64015011                     CALLF 0x1150:0164
1000:1cd6          8986f6fe                       MOV word ptr [BP + 0xfef6],AX
1000:1cda          eb1d                           JMP 0x1000:1cf9
LAB_1000_1cdc:
1000:1cdc          c47e06                         LES DI,[BP + 0x6]
1000:1cdf          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:1ce3          6a67                           PUSH 0x67
1000:1ce5          681004                         PUSH 0x410
1000:1ce8          6a00                           PUSH 0x0
1000:1cea          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1ced          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1cf0          9a64015011                     CALLF 0x1150:0164
1000:1cf5          8986f6fe                       MOV word ptr [BP + 0xfef6],AX
LAB_1000_1cf9:
1000:1cf9          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1cfc          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1cff          68ff00                         PUSH 0xff
1000:1d02          9a47016810                     CALLF 0x1068:0147
1000:1d07          83bef6feff                     CMP word ptr [BP + 0xfef6],-0x1
1000:1d0c          743f                           JZ 0x1000:1d4d
1000:1d0e          c47e06                         LES DI,[BP + 0x6]
1000:1d11          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:1d15          6a67                           PUSH 0x67
1000:1d17          680704                         PUSH 0x407
1000:1d1a          ffb6f6fe                       PUSH word ptr [BP + 0xfef6]
1000:1d1e          6a00                           PUSH 0x0
1000:1d20          6a00                           PUSH 0x0
1000:1d22          9a64015011                     CALLF 0x1150:0164
1000:1d27          8986f8fe                       MOV word ptr [BP + 0xfef8],AX
1000:1d2b          83bef8feff                     CMP word ptr [BP + 0xfef8],-0x1
1000:1d30          741b                           JZ 0x1000:1d4d
1000:1d32          8b86f8fe                       MOV AX,word ptr [BP + 0xfef8]
1000:1d36          3b86fafe                       CMP AX,word ptr [BP + 0xfefa]
1000:1d3a          7411                           JZ 0x1000:1d4d
1000:1d3c          8b86f8fe                       MOV AX,word ptr [BP + 0xfef8]
1000:1d40          a3ca94                         MOV [0x94ca],AX
1000:1d43          c47e06                         LES DI,[BP + 0x6]
1000:1d46          06                             PUSH ES
1000:1d47          57                             PUSH DI
1000:1d48          9a83170010                     CALLF 0x1000:1783
LAB_1000_1d4d:
1000:1d4d          8dbefcfe                       LEA DI,[BP + 0xfefc]
1000:1d51          16                             PUSH SS
1000:1d52          57                             PUSH DI
1000:1d53          bf921a                         MOV DI,0x1a92
1000:1d56          1e                             PUSH DS
1000:1d57          57                             PUSH DI
1000:1d58          68ff00                         PUSH 0xff
1000:1d5b          9aab086810                     CALLF 0x1068:08ab
1000:1d60          eb0e                           JMP 0x1000:1d70
LAB_1000_1d62:
1000:1d62          ff76fe                         PUSH word ptr [BP + -0x2]
1000:1d65          ff76fc                         PUSH word ptr [BP + -0x4]
1000:1d68          68ff00                         PUSH 0xff
1000:1d6b          9a47016810                     CALLF 0x1068:0147
LAB_1000_1d70:
1000:1d70          c9                             LEAVE
1000:1d71          ca0800                         RETF 0x8
FUN_1000_1e25:
1000:1e25          55                             PUSH BP
1000:1e26          89e5                           MOV BP,SP
1000:1e28          b81e03                         MOV AX,0x31e
1000:1e2b          9acb036810                     CALLF 0x1068:03cb
1000:1e30          81ec1e03                       SUB SP,0x31e
1000:1e34          6a46                           PUSH 0x46
1000:1e36          9a2d016810                     CALLF 0x1068:012d
1000:1e3b          8946fa                         MOV word ptr [BP + -0x6],AX
1000:1e3e          8956fc                         MOV word ptr [BP + -0x4],DX
1000:1e41          8dbef8fe                       LEA DI,[BP + 0xfef8]
1000:1e45          16                             PUSH SS
1000:1e46          57                             PUSH DI
1000:1e47          bf9c01                         MOV DI,0x19c
1000:1e4a          1e                             PUSH DS
1000:1e4b          57                             PUSH DI
1000:1e4c          9a02000810                     CALLF 0x1008:0002
1000:1e51          08c0                           OR AL,AL
1000:1e53          7503                           JNZ 0x1000:1e58
1000:1e55          e9a901                         JMP 0x1000:2001
LAB_1000_1e58:
1000:1e58          bf741d                         MOV DI,0x1d74
1000:1e5b          0e                             PUSH CS
1000:1e5c          57                             PUSH DI
1000:1e5d          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1e61          9ab4010810                     CALLF 0x1008:01b4
1000:1e66          bf761d                         MOV DI,0x1d76
1000:1e69          0e                             PUSH CS
1000:1e6a          57                             PUSH DI
1000:1e6b          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1e6f          9ab4010810                     CALLF 0x1008:01b4
1000:1e74          bfa21d                         MOV DI,0x1da2
1000:1e77          0e                             PUSH CS
1000:1e78          57                             PUSH DI
1000:1e79          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1e7d          9ab4010810                     CALLF 0x1008:01b4
1000:1e82          bf741d                         MOV DI,0x1d74
1000:1e85          0e                             PUSH CS
1000:1e86          57                             PUSH DI
1000:1e87          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1e8b          9ab4010810                     CALLF 0x1008:01b4
1000:1e90          bfce1d                         MOV DI,0x1dce
1000:1e93          0e                             PUSH CS
1000:1e94          57                             PUSH DI
1000:1e95          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1e99          9ab4010810                     CALLF 0x1008:01b4
1000:1e9e          bf741d                         MOV DI,0x1d74
1000:1ea1          0e                             PUSH CS
1000:1ea2          57                             PUSH DI
1000:1ea3          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1ea7          9ab4010810                     CALLF 0x1008:01b4
1000:1eac          bfc892                         MOV DI,0x92c8
1000:1eaf          1e                             PUSH DS
1000:1eb0          57                             PUSH DI
1000:1eb1          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1eb5          9ab4010810                     CALLF 0x1008:01b4
1000:1eba          bf741d                         MOV DI,0x1d74
1000:1ebd          0e                             PUSH CS
1000:1ebe          57                             PUSH DI
1000:1ebf          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1ec3          9ab4010810                     CALLF 0x1008:01b4
1000:1ec8          bf741d                         MOV DI,0x1d74
1000:1ecb          0e                             PUSH CS
1000:1ecc          57                             PUSH DI
1000:1ecd          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1ed1          9ab4010810                     CALLF 0x1008:01b4
1000:1ed6          8dbee2fd                       LEA DI,[BP + 0xfde2]
1000:1eda          16                             PUSH SS
1000:1edb          57                             PUSH DI
1000:1edc          bfc892                         MOV DI,0x92c8
1000:1edf          1e                             PUSH DS
1000:1ee0          57                             PUSH DI
1000:1ee1          9a91086810                     CALLF 0x1068:0891
1000:1ee6          bf741d                         MOV DI,0x1d74
1000:1ee9          0e                             PUSH CS
1000:1eea          57                             PUSH DI
1000:1eeb          9a10096810                     CALLF 0x1068:0910
1000:1ef0          8dbee2fc                       LEA DI,[BP + 0xfce2]
1000:1ef4          16                             PUSH SS
1000:1ef5          57                             PUSH DI
1000:1ef6          c47e06                         LES DI,[BP + 0x6]
1000:1ef9          06                             PUSH ES
1000:1efa          57                             PUSH DI
1000:1efb          9a95010010                     CALLF 0x1000:0195
1000:1f00          9a10096810                     CALLF 0x1068:0910
1000:1f05          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:1f09          16                             PUSH SS
1000:1f0a          57                             PUSH DI
1000:1f0b          68ff00                         PUSH 0xff
1000:1f0e          9aab086810                     CALLF 0x1068:08ab
1000:1f13          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:1f17          16                             PUSH SS
1000:1f18          57                             PUSH DI
1000:1f19          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1f1d          9ab4010810                     CALLF 0x1008:01b4
1000:1f22          bf741d                         MOV DI,0x1d74
1000:1f25          0e                             PUSH CS
1000:1f26          57                             PUSH DI
1000:1f27          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1f2b          9ab4010810                     CALLF 0x1008:01b4
1000:1f30          8dbee2fd                       LEA DI,[BP + 0xfde2]
1000:1f34          16                             PUSH SS
1000:1f35          57                             PUSH DI
1000:1f36          c47e06                         LES DI,[BP + 0x6]
1000:1f39          06                             PUSH ES
1000:1f3a          57                             PUSH DI
1000:1f3b          9acb020010                     CALLF 0x1000:02cb
1000:1f40          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:1f44          16                             PUSH SS
1000:1f45          57                             PUSH DI
1000:1f46          68ff00                         PUSH 0xff
1000:1f49          9aab086810                     CALLF 0x1068:08ab
1000:1f4e          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:1f52          16                             PUSH SS
1000:1f53          57                             PUSH DI
1000:1f54          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1f58          9ab4010810                     CALLF 0x1008:01b4
1000:1f5d          bf741d                         MOV DI,0x1d74
1000:1f60          0e                             PUSH CS
1000:1f61          57                             PUSH DI
1000:1f62          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1f66          9ab4010810                     CALLF 0x1008:01b4
1000:1f6b          8dbee2fd                       LEA DI,[BP + 0xfde2]
1000:1f6f          16                             PUSH SS
1000:1f70          57                             PUSH DI
1000:1f71          c47e06                         LES DI,[BP + 0x6]
1000:1f74          06                             PUSH ES
1000:1f75          57                             PUSH DI
1000:1f76          9aa8040010                     CALLF 0x1000:04a8
1000:1f7b          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:1f7f          16                             PUSH SS
1000:1f80          57                             PUSH DI
1000:1f81          68ff00                         PUSH 0xff
1000:1f84          9aab086810                     CALLF 0x1068:08ab
1000:1f89          80befafe00                     CMP byte ptr [BP + 0xfefa],0x0
1000:1f8e          741d                           JZ 0x1000:1fad
1000:1f90          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:1f94          16                             PUSH SS
1000:1f95          57                             PUSH DI
1000:1f96          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1f9a          9ab4010810                     CALLF 0x1008:01b4
1000:1f9f          bf741d                         MOV DI,0x1d74
1000:1fa2          0e                             PUSH CS
1000:1fa3          57                             PUSH DI
1000:1fa4          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1fa8          9ab4010810                     CALLF 0x1008:01b4
LAB_1000_1fad:
1000:1fad          bf741d                         MOV DI,0x1d74
1000:1fb0          0e                             PUSH CS
1000:1fb1          57                             PUSH DI
1000:1fb2          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1fb6          9ab4010810                     CALLF 0x1008:01b4
1000:1fbb          a1ca94                         MOV AX,[0x94ca]
1000:1fbe          c47e06                         LES DI,[BP + 0x6]
1000:1fc1          03f8                           ADD DI,AX
1000:1fc3          26807d2b00                     CMP byte ptr ES:[DI + 0x2b],0x0
1000:1fc8          742c                           JZ 0x1000:1ff6
1000:1fca          8dbee2fd                       LEA DI,[BP + 0xfde2]
1000:1fce          16                             PUSH SS
1000:1fcf          57                             PUSH DI
1000:1fd0          bfc892                         MOV DI,0x92c8
1000:1fd3          1e                             PUSH DS
1000:1fd4          57                             PUSH DI
1000:1fd5          bfef1d                         MOV DI,0x1def
1000:1fd8          0e                             PUSH CS
1000:1fd9          57                             PUSH DI
1000:1fda          9a5a021010                     CALLF 0x1010:025a
1000:1fdf          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1fe3          9ab4010810                     CALLF 0x1008:01b4
1000:1fe8          bf741d                         MOV DI,0x1d74
1000:1feb          0e                             PUSH CS
1000:1fec          57                             PUSH DI
1000:1fed          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1ff1          9ab4010810                     CALLF 0x1008:01b4
LAB_1000_1ff6:
1000:1ff6          ffb6f8fe                       PUSH word ptr [BP + 0xfef8]
1000:1ffa          9aa7020810                     CALLF 0x1008:02a7
1000:1fff          eb18                           JMP 0x1000:2019
LAB_1000_2001:
1000:2001          c47e06                         LES DI,[BP + 0x6]
1000:2004          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:2008          bfbd01                         MOV DI,0x1bd
1000:200b          1e                             PUSH DS
1000:200c          57                             PUSH DI
1000:200d          bff001                         MOV DI,0x1f0
1000:2010          1e                             PUSH DS
1000:2011          57                             PUSH DI
1000:2012          6a30                           PUSH 0x30
1000:2014          9a5c005011                     CALLF 0x1150:005c
LAB_1000_2019:
1000:2019          ff76fc                         PUSH word ptr [BP + -0x4]
1000:201c          ff76fa                         PUSH word ptr [BP + -0x6]
1000:201f          6a46                           PUSH 0x46
1000:2021          9a47016810                     CALLF 0x1068:0147
1000:2026          c9                             LEAVE
1000:2027          ca0800                         RETF 0x8
FUN_1000_202a:
1000:202a          55                             PUSH BP
1000:202b          89e5                           MOV BP,SP
1000:202d          31c0                           XOR AX,AX
1000:202f          9acb036810                     CALLF 0x1068:03cb
1000:2034          c47e06                         LES DI,[BP + 0x6]
1000:2037          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:203b          bff601                         MOV DI,0x1f6
1000:203e          1e                             PUSH DS
1000:203f          57                             PUSH DI
1000:2040          6a01                           PUSH 0x1
1000:2042          6a00                           PUSH 0x0
1000:2044          6a1f                           PUSH 0x1f
1000:2046          9ab8015011                     CALLF 0x1150:01b8
1000:204b          c9                             LEAVE
1000:204c          ca0800                         RETF 0x8
FUN_1000_204f:
1000:204f          55                             PUSH BP
1000:2050          89e5                           MOV BP,SP
1000:2052          31c0                           XOR AX,AX
1000:2054          9acb036810                     CALLF 0x1068:03cb
1000:2059          c47e06                         LES DI,[BP + 0x6]
1000:205c          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:2060          bf0402                         MOV DI,0x204
1000:2063          1e                             PUSH DS
1000:2064          57                             PUSH DI
1000:2065          6a02                           PUSH 0x2
1000:2067          6a00                           PUSH 0x0
1000:2069          6a00                           PUSH 0x0
1000:206b          9ab8015011                     CALLF 0x1150:01b8
1000:2070          31c0                           XOR AX,AX
1000:2072          50                             PUSH AX
1000:2073          c47e06                         LES DI,[BP + 0x6]
1000:2076          06                             PUSH ES
1000:2077          57                             PUSH DI
1000:2078          9a7a004810                     CALLF 0x1048:007a
1000:207d          c9                             LEAVE
1000:207e          ca0800                         RETF 0x8
FUN_1000_2081:
1000:2081          55                             PUSH BP
1000:2082          89e5                           MOV BP,SP
1000:2084          31c0                           XOR AX,AX
1000:2086          9acb036810                     CALLF 0x1068:03cb
1000:208b          c47e06                         LES DI,[BP + 0x6]
1000:208e          06                             PUSH ES
1000:208f          57                             PUSH DI
1000:2090          bf1202                         MOV DI,0x212
1000:2093          1e                             PUSH DS
1000:2094          57                             PUSH DI
1000:2095          b81601                         MOV AX,0x116
1000:2098          50                             PUSH AX
1000:2099          31c0                           XOR AX,AX
1000:209b          50                             PUSH AX
1000:209c          50                             PUSH AX
1000:209d          9a8a000010                     CALLF 0x1000:008a
1000:20a2          52                             PUSH DX
1000:20a3          50                             PUSH AX
1000:20a4          c43e2218                       LES DI,[0x1822]
1000:20a8          06                             PUSH ES
1000:20a9          57                             PUSH DI
1000:20aa          268b3d                         MOV DI,word ptr ES:[DI]
1000:20ad          ff5d38                         CALLF [DI + 0x38]
1000:20b0          c9                             LEAVE
1000:20b1          ca0800                         RETF 0x8
FUN_1000_20b4:
1000:20b4          55                             PUSH BP
1000:20b5          89e5                           MOV BP,SP
1000:20b7          31c0                           XOR AX,AX
1000:20b9          9acb036810                     CALLF 0x1068:03cb
1000:20be          c47e06                         LES DI,[BP + 0x6]
1000:20c1          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:20c5          bf1a02                         MOV DI,0x21a
1000:20c8          1e                             PUSH DS
1000:20c9          57                             PUSH DI
1000:20ca          6a01                           PUSH 0x1
1000:20cc          6a00                           PUSH 0x0
1000:20ce          6a44                           PUSH 0x44
1000:20d0          9ab8015011                     CALLF 0x1150:01b8
1000:20d5          c9                             LEAVE
1000:20d6          ca0800                         RETF 0x8
FUN_1000_211e:
1000:211e          55                             PUSH BP
1000:211f          89e5                           MOV BP,SP
1000:2121          b89005                         MOV AX,0x590
1000:2124          9acb036810                     CALLF 0x1068:03cb
1000:2129          81ec9005                       SUB SP,0x590
1000:212d          6a00                           PUSH 0x0
1000:212f          6a00                           PUSH 0x0
1000:2131          c47e06                         LES DI,[BP + 0x6]
1000:2134          06                             PUSH ES
1000:2135          57                             PUSH DI
1000:2136          9ad1001010                     CALLF 0x1010:00d1
1000:213b          c47e06                         LES DI,[BP + 0x6]
1000:213e          06                             PUSH ES
1000:213f          57                             PUSH DI
1000:2140          9a840d4010                     CALLF 0x1040:0d84
1000:2145          68ff00                         PUSH 0xff
1000:2148          9a2d016810                     CALLF 0x1068:012d
1000:214d          8946fc                         MOV word ptr [BP + -0x4],AX
1000:2150          8956fe                         MOV word ptr [BP + -0x2],DX
1000:2153          ff76fe                         PUSH word ptr [BP + -0x2]
1000:2156          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2159          bf921c                         MOV DI,0x1c92
1000:215c          1e                             PUSH DS
1000:215d          57                             PUSH DI
1000:215e          9a9f006010                     CALLF 0x1060:009f
1000:2163          c47e06                         LES DI,[BP + 0x6]
1000:2166          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:216a          ff76fe                         PUSH word ptr [BP + -0x2]
1000:216d          ff76fc                         PUSH word ptr [BP + -0x4]
1000:2170          9a10015011                     CALLF 0x1150:0110
1000:2175          ff76fe                         PUSH word ptr [BP + -0x2]
1000:2178          ff76fc                         PUSH word ptr [BP + -0x4]
1000:217b          68ff00                         PUSH 0xff
1000:217e          9a47016810                     CALLF 0x1068:0147
1000:2183          c686fafe00                     MOV byte ptr [BP + 0xfefa],0x0
1000:2188          833ec89401                     CMP word ptr [0x94c8],0x1
1000:218d          7643                           JBE 0x1000:21d2
1000:218f          8dbe70fa                       LEA DI,[BP + 0xfa70]
1000:2193          16                             PUSH SS
1000:2194          57                             PUSH DI
1000:2195          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:2199          16                             PUSH SS
1000:219a          57                             PUSH DI
1000:219b          9a91086810                     CALLF 0x1068:0891
1000:21a0          8dbe70fb                       LEA DI,[BP + 0xfb70]
1000:21a4          16                             PUSH SS
1000:21a5          57                             PUSH DI
1000:21a6          8dbe70fc                       LEA DI,[BP + 0xfc70]
1000:21aa          16                             PUSH SS
1000:21ab          57                             PUSH DI
1000:21ac          ff36c894                       PUSH word ptr [0x94c8]
1000:21b0          9a90001010                     CALLF 0x1010:0090
1000:21b5          bfd920                         MOV DI,0x20d9
1000:21b8          0e                             PUSH CS
1000:21b9          57                             PUSH DI
1000:21ba          9a5a021010                     CALLF 0x1010:025a
1000:21bf          9a10096810                     CALLF 0x1068:0910
1000:21c4          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:21c8          16                             PUSH SS
1000:21c9          57                             PUSH DI
1000:21ca          68ff00                         PUSH 0xff
1000:21cd          9aab086810                     CALLF 0x1068:08ab
LAB_1000_21d2:
1000:21d2          833ec89401                     CMP word ptr [0x94c8],0x1
1000:21d7          7529                           JNZ 0x1000:2202
1000:21d9          8dbe70fc                       LEA DI,[BP + 0xfc70]
1000:21dd          16                             PUSH SS
1000:21de          57                             PUSH DI
1000:21df          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:21e3          16                             PUSH SS
1000:21e4          57                             PUSH DI
1000:21e5          9a91086810                     CALLF 0x1068:0891
1000:21ea          bff620                         MOV DI,0x20f6
1000:21ed          0e                             PUSH CS
1000:21ee          57                             PUSH DI
1000:21ef          9a10096810                     CALLF 0x1068:0910
1000:21f4          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:21f8          16                             PUSH SS
1000:21f9          57                             PUSH DI
1000:21fa          68ff00                         PUSH 0xff
1000:21fd          9aab086810                     CALLF 0x1068:08ab
LAB_1000_2202:
1000:2202          6a02                           PUSH 0x2
1000:2204          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:2208          16                             PUSH SS
1000:2209          57                             PUSH DI
1000:220a          c47e06                         LES DI,[BP + 0x6]
1000:220d          06                             PUSH ES
1000:220e          57                             PUSH DI
1000:220f          9ab5011010                     CALLF 0x1010:01b5
1000:2214          833ec89400                     CMP word ptr [0x94c8],0x0
1000:2219          7703                           JA 0x1000:221e
1000:221b          e95503                         JMP 0x1000:2573
LAB_1000_221e:
1000:221e          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2222          16                             PUSH SS
1000:2223          57                             PUSH DI
1000:2224          8dbe70fc                       LEA DI,[BP + 0xfc70]
1000:2228          16                             PUSH SS
1000:2229          57                             PUSH DI
1000:222a          bfac99                         MOV DI,0x99ac
1000:222d          1e                             PUSH DS
1000:222e          57                             PUSH DI
1000:222f          9a91086810                     CALLF 0x1068:0891
1000:2234          bf1021                         MOV DI,0x2110
1000:2237          0e                             PUSH CS
1000:2238          57                             PUSH DI
1000:2239          9a10096810                     CALLF 0x1068:0910
1000:223e          9a67066810                     CALLF 0x1068:0667
1000:2243          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2247          16                             PUSH SS
1000:2248          57                             PUSH DI
1000:2249          6a01                           PUSH 0x1
1000:224b          9aab066810                     CALLF 0x1068:06ab
1000:2250          9a8f036810                     CALLF 0x1068:038f
1000:2255          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2259          16                             PUSH SS
1000:225a          57                             PUSH DI
1000:225b          8b3eca94                       MOV DI,word ptr [0x94ca]
1000:225f          c1e702                         SHL DI,0x2
1000:2262          ffb5901d                       PUSH word ptr [DI + 0x1d90]
1000:2266          ffb58e1d                       PUSH word ptr [DI + 0x1d8e]
1000:226a          9afe076810                     CALLF 0x1068:07fe
1000:226f          9a8f036810                     CALLF 0x1068:038f
1000:2274          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2278          16                             PUSH SS
1000:2279          57                             PUSH DI
1000:227a          8dbe79fe                       LEA DI,[BP + 0xfe79]
1000:227e          16                             PUSH SS
1000:227f          57                             PUSH DI
1000:2280          9a60076810                     CALLF 0x1068:0760
1000:2285          83c404                         ADD SP,0x4
1000:2288          9a8f036810                     CALLF 0x1068:038f
1000:228d          8a8679fe                       MOV AL,byte ptr [BP + 0xfe79]
1000:2291          888678fe                       MOV byte ptr [BP + 0xfe78],AL
1000:2295          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2299          16                             PUSH SS
1000:229a          57                             PUSH DI
1000:229b          8dbe79fe                       LEA DI,[BP + 0xfe79]
1000:229f          16                             PUSH SS
1000:22a0          57                             PUSH DI
1000:22a1          9a60076810                     CALLF 0x1068:0760
1000:22a6          83c404                         ADD SP,0x4
1000:22a9          9a8f036810                     CALLF 0x1068:038f
1000:22ae          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:22b2          16                             PUSH SS
1000:22b3          57                             PUSH DI
1000:22b4          8dbe79fe                       LEA DI,[BP + 0xfe79]
1000:22b8          16                             PUSH SS
1000:22b9          57                             PUSH DI
1000:22ba          9a60076810                     CALLF 0x1068:0760
1000:22bf          83c404                         ADD SP,0x4
1000:22c2          9a8f036810                     CALLF 0x1068:038f
1000:22c7          c68676fd00                     MOV byte ptr [BP + 0xfd76],0x0
1000:22cc          8a8678fe                       MOV AL,byte ptr [BP + 0xfe78]
1000:22d0          30e4                           XOR AH,AH
1000:22d2          48                             DEC AX
1000:22d3          48                             DEC AX
1000:22d4          88866ffd                       MOV byte ptr [BP + 0xfd6f],AL
1000:22d8          b001                           MOV AL,0x1
1000:22da          3a866ffd                       CMP AL,byte ptr [BP + 0xfd6f]
1000:22de          7761                           JA 0x1000:2341
1000:22e0          888677fe                       MOV byte ptr [BP + 0xfe77],AL
1000:22e4          eb04                           JMP 0x1000:22ea
LAB_1000_22e6:
1000:22e6          fe8677fe                       INC byte ptr [BP + 0xfe77]
LAB_1000_22ea:
1000:22ea          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:22ee          16                             PUSH SS
1000:22ef          57                             PUSH DI
1000:22f0          8dbe76fe                       LEA DI,[BP + 0xfe76]
1000:22f4          16                             PUSH SS
1000:22f5          57                             PUSH DI
1000:22f6          9a60076810                     CALLF 0x1068:0760
1000:22fb          83c404                         ADD SP,0x4
1000:22fe          9a8f036810                     CALLF 0x1068:038f
1000:2303          8dbe6efb                       LEA DI,[BP + 0xfb6e]
1000:2307          16                             PUSH SS
1000:2308          57                             PUSH DI
1000:2309          8dbe76fd                       LEA DI,[BP + 0xfd76]
1000:230d          16                             PUSH SS
1000:230e          57                             PUSH DI
1000:230f          9a91086810                     CALLF 0x1068:0891
1000:2314          8dbe6efc                       LEA DI,[BP + 0xfc6e]
1000:2318          16                             PUSH SS
1000:2319          57                             PUSH DI
1000:231a          8a8676fe                       MOV AL,byte ptr [BP + 0xfe76]
1000:231e          50                             PUSH AX
1000:231f          9aad096810                     CALLF 0x1068:09ad
1000:2324          9a10096810                     CALLF 0x1068:0910
1000:2329          8dbe76fd                       LEA DI,[BP + 0xfd76]
1000:232d          16                             PUSH SS
1000:232e          57                             PUSH DI
1000:232f          68ff00                         PUSH 0xff
1000:2332          9aab086810                     CALLF 0x1068:08ab
1000:2337          8a8677fe                       MOV AL,byte ptr [BP + 0xfe77]
1000:233b          3a866ffd                       CMP AL,byte ptr [BP + 0xfd6f]
1000:233f          75a5                           JNZ 0x1000:22e6
LAB_1000_2341:
1000:2341          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2345          16                             PUSH SS
1000:2346          57                             PUSH DI
1000:2347          8b3eca94                       MOV DI,word ptr [0x94ca]
1000:234b          c1e702                         SHL DI,0x2
1000:234e          ffb5b06b                       PUSH word ptr [DI + 0x6bb0]
1000:2352          ffb5ae6b                       PUSH word ptr [DI + 0x6bae]
1000:2356          9afe076810                     CALLF 0x1068:07fe
1000:235b          9a8f036810                     CALLF 0x1068:038f
LAB_1000_2360:
1000:2360          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2364          16                             PUSH SS
1000:2365          57                             PUSH DI
1000:2366          8dbe79fe                       LEA DI,[BP + 0xfe79]
1000:236a          16                             PUSH SS
1000:236b          57                             PUSH DI
1000:236c          9a60076810                     CALLF 0x1068:0760
1000:2371          83c404                         ADD SP,0x4
1000:2374          9a8f036810                     CALLF 0x1068:038f
1000:2379          8a8679fe                       MOV AL,byte ptr [BP + 0xfe79]
1000:237d          888678fe                       MOV byte ptr [BP + 0xfe78],AL
1000:2381          c686fafe00                     MOV byte ptr [BP + 0xfefa],0x0
1000:2386          8a8678fe                       MOV AL,byte ptr [BP + 0xfe78]
1000:238a          88866ffd                       MOV byte ptr [BP + 0xfd6f],AL
1000:238e          b001                           MOV AL,0x1
1000:2390          3a866ffd                       CMP AL,byte ptr [BP + 0xfd6f]
1000:2394          7603                           JBE 0x1000:2399
1000:2396          e90a01                         JMP 0x1000:24a3
LAB_1000_2399:
1000:2399          888677fe                       MOV byte ptr [BP + 0xfe77],AL
1000:239d          eb04                           JMP 0x1000:23a3
LAB_1000_239f:
1000:239f          fe8677fe                       INC byte ptr [BP + 0xfe77]
LAB_1000_23a3:
1000:23a3          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:23a7          16                             PUSH SS
1000:23a8          57                             PUSH DI
1000:23a9          8dbe76fe                       LEA DI,[BP + 0xfe76]
1000:23ad          16                             PUSH SS
1000:23ae          57                             PUSH DI
1000:23af          9a60076810                     CALLF 0x1068:0760
1000:23b4          83c404                         ADD SP,0x4
1000:23b7          9a8f036810                     CALLF 0x1068:038f
1000:23bc          8dbe6efb                       LEA DI,[BP + 0xfb6e]
1000:23c0          16                             PUSH SS
1000:23c1          57                             PUSH DI
1000:23c2          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:23c6          16                             PUSH SS
1000:23c7          57                             PUSH DI
1000:23c8          9a91086810                     CALLF 0x1068:0891
1000:23cd          8dbe6efc                       LEA DI,[BP + 0xfc6e]
1000:23d1          16                             PUSH SS
1000:23d2          57                             PUSH DI
1000:23d3          8a8676fe                       MOV AL,byte ptr [BP + 0xfe76]
1000:23d7          50                             PUSH AX
1000:23d8          9aad096810                     CALLF 0x1068:09ad
1000:23dd          9a10096810                     CALLF 0x1068:0910
1000:23e2          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:23e6          16                             PUSH SS
1000:23e7          57                             PUSH DI
1000:23e8          68ff00                         PUSH 0xff
1000:23eb          9aab086810                     CALLF 0x1068:08ab
1000:23f0          80be76fe2c                     CMP byte ptr [BP + 0xfe76],0x2c
1000:23f5          7403                           JZ 0x1000:23fa
1000:23f7          e99c00                         JMP 0x1000:2496
LAB_1000_23fa:
1000:23fa          fe8efafe                       DEC byte ptr [BP + 0xfefa]
LAB_1000_23fe:
1000:23fe          80befbfe20                     CMP byte ptr [BP + 0xfefb],0x20
1000:2403          7511                           JNZ 0x1000:2416
1000:2405          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:2409          16                             PUSH SS
1000:240a          57                             PUSH DI
1000:240b          6a01                           PUSH 0x1
1000:240d          6a01                           PUSH 0x1
1000:240f          9a6d031010                     CALLF 0x1010:036d
1000:2414          ebe8                           JMP 0x1000:23fe
LAB_1000_2416:
1000:2416          8dbe6efc                       LEA DI,[BP + 0xfc6e]
1000:241a          16                             PUSH SS
1000:241b          57                             PUSH DI
1000:241c          8dbe76fd                       LEA DI,[BP + 0xfd76]
1000:2420          16                             PUSH SS
1000:2421          57                             PUSH DI
1000:2422          9a91086810                     CALLF 0x1068:0891
1000:2427          bf1c21                         MOV DI,0x211c
1000:242a          0e                             PUSH CS
1000:242b          57                             PUSH DI
1000:242c          9a10096810                     CALLF 0x1068:0910
1000:2431          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:2435          16                             PUSH SS
1000:2436          57                             PUSH DI
1000:2437          9a10096810                     CALLF 0x1068:0910
1000:243c          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:2440          16                             PUSH SS
1000:2441          57                             PUSH DI
1000:2442          68ff00                         PUSH 0xff
1000:2445          9aab086810                     CALLF 0x1068:08ab
1000:244a          6a3c                           PUSH 0x3c
1000:244c          9a2d016810                     CALLF 0x1068:012d
1000:2451          898670fd                       MOV word ptr [BP + 0xfd70],AX
1000:2455          899672fd                       MOV word ptr [BP + 0xfd72],DX
1000:2459          ffb672fd                       PUSH word ptr [BP + 0xfd72]
1000:245d          ffb670fd                       PUSH word ptr [BP + 0xfd70]
1000:2461          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:2465          16                             PUSH SS
1000:2466          57                             PUSH DI
1000:2467          9a9f006010                     CALLF 0x1060:009f
1000:246c          c47e06                         LES DI,[BP + 0x6]
1000:246f          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:2473          6a03                           PUSH 0x3
1000:2475          ffb672fd                       PUSH word ptr [BP + 0xfd72]
1000:2479          ffb670fd                       PUSH word ptr [BP + 0xfd70]
1000:247d          9a02001010                     CALLF 0x1010:0002
1000:2482          ffb672fd                       PUSH word ptr [BP + 0xfd72]
1000:2486          ffb670fd                       PUSH word ptr [BP + 0xfd70]
1000:248a          6a3c                           PUSH 0x3c
1000:248c          9a47016810                     CALLF 0x1068:0147
1000:2491          c686fafe00                     MOV byte ptr [BP + 0xfefa],0x0
LAB_1000_2496:
1000:2496          8a8677fe                       MOV AL,byte ptr [BP + 0xfe77]
1000:249a          3a866ffd                       CMP AL,byte ptr [BP + 0xfd6f]
1000:249e          7403                           JZ 0x1000:24a3
1000:24a0          e9fcfe                         JMP 0x1000:239f
LAB_1000_24a3:
1000:24a3          80befafe00                     CMP byte ptr [BP + 0xfefa],0x0
1000:24a8          7503                           JNZ 0x1000:24ad
1000:24aa          e99300                         JMP 0x1000:2540
LAB_1000_24ad:
1000:24ad          80befbfe20                     CMP byte ptr [BP + 0xfefb],0x20
1000:24b2          7511                           JNZ 0x1000:24c5
1000:24b4          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:24b8          16                             PUSH SS
1000:24b9          57                             PUSH DI
1000:24ba          6a01                           PUSH 0x1
1000:24bc          6a01                           PUSH 0x1
1000:24be          9a6d031010                     CALLF 0x1010:036d
1000:24c3          ebe8                           JMP 0x1000:24ad
LAB_1000_24c5:
1000:24c5          8dbe70fc                       LEA DI,[BP + 0xfc70]
1000:24c9          16                             PUSH SS
1000:24ca          57                             PUSH DI
1000:24cb          8dbe76fd                       LEA DI,[BP + 0xfd76]
1000:24cf          16                             PUSH SS
1000:24d0          57                             PUSH DI
1000:24d1          9a91086810                     CALLF 0x1068:0891
1000:24d6          bf1c21                         MOV DI,0x211c
1000:24d9          0e                             PUSH CS
1000:24da          57                             PUSH DI
1000:24db          9a10096810                     CALLF 0x1068:0910
1000:24e0          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:24e4          16                             PUSH SS
1000:24e5          57                             PUSH DI
1000:24e6          9a10096810                     CALLF 0x1068:0910
1000:24eb          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:24ef          16                             PUSH SS
1000:24f0          57                             PUSH DI
1000:24f1          68ff00                         PUSH 0xff
1000:24f4          9aab086810                     CALLF 0x1068:08ab
1000:24f9          6a3c                           PUSH 0x3c
1000:24fb          9a2d016810                     CALLF 0x1068:012d
1000:2500          898670fd                       MOV word ptr [BP + 0xfd70],AX
1000:2504          899672fd                       MOV word ptr [BP + 0xfd72],DX
1000:2508          ffb672fd                       PUSH word ptr [BP + 0xfd72]
1000:250c          ffb670fd                       PUSH word ptr [BP + 0xfd70]
1000:2510          8dbefafe                       LEA DI,[BP + 0xfefa]
1000:2514          16                             PUSH SS
1000:2515          57                             PUSH DI
1000:2516          9a9f006010                     CALLF 0x1060:009f
1000:251b          c47e06                         LES DI,[BP + 0x6]
1000:251e          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1000:2522          6a03                           PUSH 0x3
1000:2524          ffb672fd                       PUSH word ptr [BP + 0xfd72]
1000:2528          ffb670fd                       PUSH word ptr [BP + 0xfd70]
1000:252c          9a02001010                     CALLF 0x1010:0002
1000:2531          ffb672fd                       PUSH word ptr [BP + 0xfd72]
1000:2535          ffb670fd                       PUSH word ptr [BP + 0xfd70]
1000:2539          6a3c                           PUSH 0x3c
1000:253b          9a47016810                     CALLF 0x1068:0147
LAB_1000_2540:
1000:2540          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2544          16                             PUSH SS
1000:2545          57                             PUSH DI
1000:2546          8dbe76fe                       LEA DI,[BP + 0xfe76]
1000:254a          16                             PUSH SS
1000:254b          57                             PUSH DI
1000:254c          9a60076810                     CALLF 0x1068:0760
1000:2551          83c404                         ADD SP,0x4
1000:2554          9a8f036810                     CALLF 0x1068:038f
1000:2559          80be76feb7                     CMP byte ptr [BP + 0xfe76],0xb7
1000:255e          7503                           JNZ 0x1000:2563
1000:2560          e9fdfd                         JMP 0x1000:2360
LAB_1000_2563:
1000:2563          8dbe7afe                       LEA DI,[BP + 0xfe7a]
1000:2567          16                             PUSH SS
1000:2568          57                             PUSH DI
1000:2569          9a2c076810                     CALLF 0x1068:072c
1000:256e          9a8f036810                     CALLF 0x1068:038f
LAB_1000_2573:
1000:2573          c9                             LEAVE
1000:2574          ca0400                         RETF 0x4
FUN_1000_2577:
1000:2577          55                             PUSH BP
1000:2578          89e5                           MOV BP,SP
1000:257a          31c0                           XOR AX,AX
1000:257c          9acb036810                     CALLF 0x1068:03cb
1000:2581          6a00                           PUSH 0x0
1000:2583          6a00                           PUSH 0x0
1000:2585          6a00                           PUSH 0x0
1000:2587          68c800                         PUSH 0xc8
1000:258a          b8be00                         MOV AX,0xbe
1000:258d          50                             PUSH AX
1000:258e          31c0                           XOR AX,AX
1000:2590          50                             PUSH AX
1000:2591          50                             PUSH AX
1000:2592          9a8a000010                     CALLF 0x1000:008a
1000:2597          c47e06                         LES DI,[BP + 0x6]
1000:259a          26894508                       MOV word ptr ES:[DI + 0x8],AX
1000:259e          2689550a                       MOV word ptr ES:[DI + 0xa],DX
1000:25a2          c9                             LEAVE
1000:25a3          ca0400                         RETF 0x4
FUN_1000_25a6:
1000:25a6          55                             PUSH BP
1000:25a7          89e5                           MOV BP,SP
1000:25a9          b80400                         MOV AX,0x4
1000:25ac          9acb036810                     CALLF 0x1068:03cb
1000:25b1          83ec04                         SUB SP,0x4
1000:25b4          b82802                         MOV AX,0x228
1000:25b7          8cda                           MOV DX,DS
1000:25b9          8946fc                         MOV word ptr [BP + -0x4],AX
1000:25bc          8956fe                         MOV word ptr [BP + -0x2],DX
1000:25bf          8b46fc                         MOV AX,word ptr [BP + -0x4]
1000:25c2          8b56fe                         MOV DX,word ptr [BP + -0x2]
1000:25c5          c9                             LEAVE
1000:25c6          ca0400                         RETF 0x4
FUN_1000_25c9:
1000:25c9          55                             PUSH BP
1000:25ca          89e5                           MOV BP,SP
1000:25cc          31c0                           XOR AX,AX
1000:25ce          9acb036810                     CALLF 0x1068:03cb
1000:25d3          c47e0a                         LES DI,[BP + 0xa]
1000:25d6          06                             PUSH ES
1000:25d7          57                             PUSH DI
1000:25d8          c47e06                         LES DI,[BP + 0x6]
1000:25db          06                             PUSH ES
1000:25dc          57                             PUSH DI
1000:25dd          9a29044810                     CALLF 0x1048:0429
1000:25e2          b85800                         MOV AX,0x58
1000:25e5          ba5011                         MOV DX,0x1150
1000:25e8          c47e0a                         LES DI,[BP + 0xa]
1000:25eb          26894502                       MOV word ptr ES:[DI + 0x2],AX
1000:25ef          26895504                       MOV word ptr ES:[DI + 0x4],DX
1000:25f3          ff364419                       PUSH word ptr [0x1944]
1000:25f7          6a00                           PUSH 0x0
1000:25f9          6a01                           PUSH 0x1
1000:25fb          9ac0015011                     CALLF 0x1150:01c0
1000:2600          c47e0a                         LES DI,[BP + 0xa]
1000:2603          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1000:2607          c9                             LEAVE
1000:2608          ca0800                         RETF 0x8
FUN_1008_0002:
1008:0002          45                             INC BP
1008:0003          55                             PUSH BP
1008:0004          89e5                           MOV BP,SP
1008:0006          1e                             PUSH DS
1008:0007          b80200                         MOV AX,0x2
1008:000a          9acb036810                     CALLF 0x1068:03cb
1008:000f          83ec02                         SUB SP,0x2
1008:0012          bf0617                         MOV DI,0x1706
1008:0015          1e                             PUSH DS
1008:0016          57                             PUSH DI
1008:0017          bf0e17                         MOV DI,0x170e
1008:001a          1e                             PUSH DS
1008:001b          57                             PUSH DI
1008:001c          bf1517                         MOV DI,0x1715
1008:001f          1e                             PUSH DS
1008:0020          57                             PUSH DI
1008:0021          bff096                         MOV DI,0x96f0
1008:0024          1e                             PUSH DS
1008:0025          57                             PUSH DI
1008:0026          6a50                           PUSH 0x50
1008:0028          9a28005011                     CALLF 0x1150:0028
1008:002d          803ef09600                     CMP byte ptr [0x96f0],0x0
1008:0032          7503                           JNZ 0x1008:0037
1008:0034          e9bd00                         JMP 0x1008:00f4
LAB_1008_0037:
1008:0037          bff096                         MOV DI,0x96f0
1008:003a          1e                             PUSH DS
1008:003b          57                             PUSH DI
1008:003c          6a2c                           PUSH 0x2c
1008:003e          9a09016010                     CALLF 0x1060:0109
1008:0043          a3e096                         MOV [0x96e0],AX
1008:0046          8916e296                       MOV word ptr [0x96e2],DX
1008:004a          b8f096                         MOV AX,0x96f0
1008:004d          8cda                           MOV DX,DS
1008:004f          a3e496                         MOV [0x96e4],AX
1008:0052          8916e696                       MOV word ptr [0x96e6],DX
1008:0056          a1e096                         MOV AX,[0x96e0]
1008:0059          8b16e296                       MOV DX,word ptr [0x96e2]
1008:005d          050100                         ADD AX,0x1
1008:0060          a3e896                         MOV [0x96e8],AX
1008:0063          8916ea96                       MOV word ptr [0x96ea],DX
1008:0067          c43ee096                       LES DI,[0x96e0]
1008:006b          26c60500                       MOV byte ptr ES:[DI],0x0
1008:006f          ff36ea96                       PUSH word ptr [0x96ea]
1008:0073          ff36e896                       PUSH word ptr [0x96e8]
1008:0077          6a2c                           PUSH 0x2c
1008:0079          9a09016010                     CALLF 0x1060:0109
1008:007e          a3ec96                         MOV [0x96ec],AX
1008:0081          8916ee96                       MOV word ptr [0x96ee],DX
1008:0085          c43eec96                       LES DI,[0x96ec]
1008:0089          26c60500                       MOV byte ptr ES:[DI],0x0
1008:008d          ff06ec96                       INC word ptr [0x96ec]
1008:0091          ff36ea96                       PUSH word ptr [0x96ea]
1008:0095          ff36e896                       PUSH word ptr [0x96e8]
1008:0099          ff36e696                       PUSH word ptr [0x96e6]
1008:009d          ff36e496                       PUSH word ptr [0x96e4]
1008:00a1          ff36ee96                       PUSH word ptr [0x96ee]
1008:00a5          ff36ec96                       PUSH word ptr [0x96ec]
1008:00a9          6a00                           PUSH 0x0
1008:00ab          6a00                           PUSH 0x0
1008:00ad          9ac4005011                     CALLF 0x1150:00c4
1008:00b2          c47e0a                         LES DI,[BP + 0xa]
1008:00b5          268905                         MOV word ptr ES:[DI],AX
1008:00b8          c706de960100                   MOV word ptr [0x96de],0x1
1008:00be          26833d00                       CMP word ptr ES:[DI],0x0
1008:00c2          741f                           JZ 0x1008:00e3
1008:00c4          26ff35                         PUSH word ptr ES:[DI]
1008:00c7          6a0a                           PUSH 0xa
1008:00c9          ff7608                         PUSH word ptr [BP + 0x8]
1008:00cc          ff7606                         PUSH word ptr [BP + 0x6]
1008:00cf          9a02006010                     CALLF 0x1060:0002
1008:00d4          50                             PUSH AX
1008:00d5          8d7e06                         LEA DI,[BP + 0x6]
1008:00d8          16                             PUSH SS
1008:00d9          57                             PUSH DI
1008:00da          6a00                           PUSH 0x0
1008:00dc          6a00                           PUSH 0x0
1008:00de          9abc005011                     CALLF 0x1150:00bc
LAB_1008_00e3:
1008:00e3          c47e0a                         LES DI,[BP + 0xa]
1008:00e6          26833d00                       CMP word ptr ES:[DI],0x0
1008:00ea          b000                           MOV AL,0x0
1008:00ec          7401                           JZ 0x1008:00ef
1008:00ee          40                             INC AX
LAB_1008_00ef:
1008:00ef          8846fd                         MOV byte ptr [BP + -0x3],AL
1008:00f2          eb04                           JMP 0x1008:00f8
LAB_1008_00f4:
1008:00f4          c646fd00                       MOV byte ptr [BP + -0x3],0x0
LAB_1008_00f8:
1008:00f8          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1008:00fb          89ec                           MOV SP,BP
1008:00fd          5d                             POP BP
1008:00fe          4d                             DEC BP
1008:00ff          ca0800                         RETF 0x8
FUN_1008_0102:
1008:0102          45                             INC BP
1008:0103          55                             PUSH BP
1008:0104          89e5                           MOV BP,SP
1008:0106          1e                             PUSH DS
1008:0107          b80401                         MOV AX,0x104
1008:010a          9acb036810                     CALLF 0x1068:03cb
1008:010f          81ec0401                       SUB SP,0x104
1008:0113          8cd3                           MOV BX,SS
1008:0115          8ec3                           MOV BX,ES
1008:0117          8cdb                           MOV BX,DS
1008:0119          fc                             CLD
1008:011a          8dbefefe                       LEA DI,[BP + 0xfefe]
1008:011e          c57608                         LDS SI,[BP + 0x8]
1008:0121          ac                             LODSB SI
1008:0122          aa                             STOSB ES:DI
1008:0123          91                             XCHG AX,CX
1008:0124          30ed                           XOR CH,CH
1008:0126          f3a4                           MOVSB.REP ES:DI,SI
1008:0128          8edb                           MOV BX,DS
1008:012a          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1008:012e          30e4                           XOR AH,AH
1008:0130          40                             INC AX
1008:0131          50                             PUSH AX
1008:0132          9a2d016810                     CALLF 0x1068:012d
1008:0137          8986fafe                       MOV word ptr [BP + 0xfefa],AX
1008:013b          8996fcfe                       MOV word ptr [BP + 0xfefc],DX
1008:013f          ffb6fcfe                       PUSH word ptr [BP + 0xfefc]
1008:0143          ffb6fafe                       PUSH word ptr [BP + 0xfefa]
1008:0147          8dbefefe                       LEA DI,[BP + 0xfefe]
1008:014b          16                             PUSH SS
1008:014c          57                             PUSH DI
1008:014d          9a9f006010                     CALLF 0x1060:009f
1008:0152          833ede963c                     CMP word ptr [0x96de],0x3c
1008:0157          751a                           JNZ 0x1008:0173
1008:0159          ff7606                         PUSH word ptr [BP + 0x6]
1008:015c          6a01                           PUSH 0x1
1008:015e          6a00                           PUSH 0x0
1008:0160          6a00                           PUSH 0x0
1008:0162          6a00                           PUSH 0x0
1008:0164          6a00                           PUSH 0x0
1008:0166          6a00                           PUSH 0x0
1008:0168          9abc005011                     CALLF 0x1150:00bc
1008:016d          c706de960100                   MOV word ptr [0x96de],0x1
LAB_1008_0173:
1008:0173          ff7606                         PUSH word ptr [BP + 0x6]
1008:0176          6a0a                           PUSH 0xa
1008:0178          6b06de9632                     IMUL AX,word ptr [0x96de],0x32
1008:017d          50                             PUSH AX
1008:017e          ffb6fcfe                       PUSH word ptr [BP + 0xfefc]
1008:0182          ffb6fafe                       PUSH word ptr [BP + 0xfefa]
1008:0186          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1008:018a          30e4                           XOR AH,AH
1008:018c          50                             PUSH AX
1008:018d          9ab8005011                     CALLF 0x1150:00b8
1008:0192          ff06de96                       INC word ptr [0x96de]
1008:0196          ffb6fcfe                       PUSH word ptr [BP + 0xfefc]
1008:019a          ffb6fafe                       PUSH word ptr [BP + 0xfefa]
1008:019e          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1008:01a2          30e4                           XOR AH,AH
1008:01a4          40                             INC AX
1008:01a5          50                             PUSH AX
1008:01a6          9a47016810                     CALLF 0x1068:0147
1008:01ab          89ec                           MOV SP,BP
1008:01ad          5d                             POP BP
1008:01ae          4d                             DEC BP
1008:01af          ca0600                         RETF 0x6
FUN_1008_01b4:
1008:01b4          45                             INC BP
1008:01b5          55                             PUSH BP
1008:01b6          89e5                           MOV BP,SP
1008:01b8          1e                             PUSH DS
1008:01b9          b80204                         MOV AX,0x402
1008:01bc          9acb036810                     CALLF 0x1068:03cb
1008:01c1          81ec0204                       SUB SP,0x402
1008:01c5          8cd3                           MOV BX,SS
1008:01c7          8ec3                           MOV BX,ES
1008:01c9          8cdb                           MOV BX,DS
1008:01cb          fc                             CLD
1008:01cc          8dbefefe                       LEA DI,[BP + 0xfefe]
1008:01d0          c57608                         LDS SI,[BP + 0x8]
1008:01d3          ac                             LODSB SI
1008:01d4          aa                             STOSB ES:DI
1008:01d5          91                             XCHG AX,CX
1008:01d6          30ed                           XOR CH,CH
1008:01d8          f3a4                           MOVSB.REP ES:DI,SI
1008:01da          8edb                           MOV BX,DS
1008:01dc          8dbefefe                       LEA DI,[BP + 0xfefe]
1008:01e0          16                             PUSH SS
1008:01e1          57                             PUSH DI
1008:01e2          8dbefcfc                       LEA DI,[BP + 0xfcfc]
1008:01e6          16                             PUSH SS
1008:01e7          57                             PUSH DI
1008:01e8          68ff00                         PUSH 0xff
1008:01eb          9aab086810                     CALLF 0x1068:08ab
LAB_1008_01f0:
1008:01f0          8dbefefe                       LEA DI,[BP + 0xfefe]
1008:01f4          16                             PUSH SS
1008:01f5          57                             PUSH DI
1008:01f6          8dbefefd                       LEA DI,[BP + 0xfdfe]
1008:01fa          16                             PUSH SS
1008:01fb          57                             PUSH DI
1008:01fc          68ff00                         PUSH 0xff
1008:01ff          9aab086810                     CALLF 0x1068:08ab
1008:0204          80befefd46                     CMP byte ptr [BP + 0xfdfe],0x46
1008:0209          763f                           JBE 0x1008:024a
1008:020b          c786fcfd4700                   MOV word ptr [BP + 0xfdfc],0x47
LAB_1008_0211:
1008:0211          8b86fcfd                       MOV AX,word ptr [BP + 0xfdfc]
1008:0215          48                             DEC AX
1008:0216          8986fcfd                       MOV word ptr [BP + 0xfdfc],AX
1008:021a          8bbefcfd                       MOV DI,word ptr [BP + 0xfdfc]
1008:021e          80bbfefd20                     CMP byte ptr [BP + DI + 0xfdfe],0x20
1008:0223          75ec                           JNZ 0x1008:0211
1008:0225          8dbefcfb                       LEA DI,[BP + 0xfbfc]
1008:0229          16                             PUSH SS
1008:022a          57                             PUSH DI
1008:022b          8dbefefe                       LEA DI,[BP + 0xfefe]
1008:022f          16                             PUSH SS
1008:0230          57                             PUSH DI
1008:0231          6a01                           PUSH 0x1
1008:0233          ffb6fcfd                       PUSH word ptr [BP + 0xfdfc]
1008:0237          9acf086810                     CALLF 0x1068:08cf
1008:023c          8dbefefd                       LEA DI,[BP + 0xfdfe]
1008:0240          16                             PUSH SS
1008:0241          57                             PUSH DI
1008:0242          68ff00                         PUSH 0xff
1008:0245          9aab086810                     CALLF 0x1068:08ab
LAB_1008_024a:
1008:024a          8dbefefe                       LEA DI,[BP + 0xfefe]
1008:024e          16                             PUSH SS
1008:024f          57                             PUSH DI
1008:0250          6a01                           PUSH 0x1
1008:0252          8a86fefd                       MOV AL,byte ptr [BP + 0xfdfe]
1008:0256          30e4                           XOR AH,AH
1008:0258          50                             PUSH AX
1008:0259          9a390a6810                     CALLF 0x1068:0a39
1008:025e          8dbefcfc                       LEA DI,[BP + 0xfcfc]
1008:0262          16                             PUSH SS
1008:0263          57                             PUSH DI
1008:0264          bfb201                         MOV DI,0x1b2
1008:0267          0e                             PUSH CS
1008:0268          57                             PUSH DI
1008:0269          9a82096810                     CALLF 0x1068:0982
1008:026e          7418                           JZ 0x1008:0288
LAB_1008_0270:
1008:0270          80befffd20                     CMP byte ptr [BP + 0xfdff],0x20
1008:0275          7511                           JNZ 0x1008:0288
1008:0277          8dbefefd                       LEA DI,[BP + 0xfdfe]
1008:027b          16                             PUSH SS
1008:027c          57                             PUSH DI
1008:027d          6a01                           PUSH 0x1
1008:027f          6a01                           PUSH 0x1
1008:0281          9a390a6810                     CALLF 0x1068:0a39
1008:0286          ebe8                           JMP 0x1008:0270
LAB_1008_0288:
1008:0288          8dbefefd                       LEA DI,[BP + 0xfdfe]
1008:028c          16                             PUSH SS
1008:028d          57                             PUSH DI
1008:028e          ff7606                         PUSH word ptr [BP + 0x6]
1008:0291          9a02010810                     CALLF 0x1008:0102
1008:0296          80befefe00                     CMP byte ptr [BP + 0xfefe],0x0
1008:029b          7403                           JZ 0x1008:02a0
1008:029d          e950ff                         JMP 0x1008:01f0
LAB_1008_02a0:
1008:02a0          89ec                           MOV SP,BP
1008:02a2          5d                             POP BP
1008:02a3          4d                             DEC BP
1008:02a4          ca0600                         RETF 0x6
FUN_1008_02a7:
1008:02a7          45                             INC BP
1008:02a8          55                             PUSH BP
1008:02a9          89e5                           MOV BP,SP
1008:02ab          1e                             PUSH DS
1008:02ac          31c0                           XOR AX,AX
1008:02ae          9acb036810                     CALLF 0x1068:03cb
1008:02b3          ff7606                         PUSH word ptr [BP + 0x6]
1008:02b6          6a01                           PUSH 0x1
1008:02b8          6a00                           PUSH 0x0
1008:02ba          6a00                           PUSH 0x0
1008:02bc          6a00                           PUSH 0x0
1008:02be          6a00                           PUSH 0x0
1008:02c0          6a00                           PUSH 0x0
1008:02c2          9abc005011                     CALLF 0x1150:00bc
1008:02c7          ff7606                         PUSH word ptr [BP + 0x6]
1008:02ca          6a0b                           PUSH 0xb
1008:02cc          6a00                           PUSH 0x0
1008:02ce          6a00                           PUSH 0x0
1008:02d0          6a00                           PUSH 0x0
1008:02d2          6a00                           PUSH 0x0
1008:02d4          6a00                           PUSH 0x0
1008:02d6          9abc005011                     CALLF 0x1150:00bc
1008:02db          ff7606                         PUSH word ptr [BP + 0x6]
1008:02de          9ac8005011                     CALLF 0x1150:00c8
1008:02e3          89ec                           MOV SP,BP
1008:02e5          5d                             POP BP
1008:02e6          4d                             DEC BP
1008:02e7          ca0200                         RETF 0x2
FUN_1010_0002:
1010:0002          45                             INC BP
1010:0003          55                             PUSH BP
1010:0004          89e5                           MOV BP,SP
1010:0006          1e                             PUSH DS
1010:0007          31c0                           XOR AX,AX
1010:0009          9acb036810                     CALLF 0x1068:03cb
1010:000e          ff760c                         PUSH word ptr [BP + 0xc]
1010:0011          ff760a                         PUSH word ptr [BP + 0xa]
1010:0014          680104                         PUSH 0x401
1010:0017          6a00                           PUSH 0x0
1010:0019          ff7608                         PUSH word ptr [BP + 0x8]
1010:001c          ff7606                         PUSH word ptr [BP + 0x6]
1010:001f          9a64015011                     CALLF 0x1150:0164
1010:0024          83faff                         CMP DX,-0x1
1010:0027          750c                           JNZ 0x1010:0035
1010:0029          3dffff                         CMP AX,0xffff
1010:002c          7507                           JNZ 0x1010:0035
1010:002e          6a01                           PUSH 0x1
1010:0030          9a68015011                     CALLF 0x1150:0168
LAB_1010_0035:
1010:0035          89ec                           MOV SP,BP
1010:0037          5d                             POP BP
1010:0038          4d                             DEC BP
1010:0039          ca0800                         RETF 0x8
FUN_1010_003c:
1010:003c          45                             INC BP
1010:003d          55                             PUSH BP
1010:003e          89e5                           MOV BP,SP
1010:0040          1e                             PUSH DS
1010:0041          31c0                           XOR AX,AX
1010:0043          9acb036810                     CALLF 0x1068:03cb
1010:0048          c47e06                         LES DI,[BP + 0x6]
1010:004b          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1010:004f          ff760a                         PUSH word ptr [BP + 0xa]
1010:0052          9a58015011                     CALLF 0x1150:0158
1010:0057          50                             PUSH AX
1010:0058          6a00                           PUSH 0x0
1010:005a          9a08015011                     CALLF 0x1150:0108
1010:005f          89ec                           MOV SP,BP
1010:0061          5d                             POP BP
1010:0062          4d                             DEC BP
1010:0063          ca0600                         RETF 0x6
FUN_1010_0066:
1010:0066          45                             INC BP
1010:0067          55                             PUSH BP
1010:0068          89e5                           MOV BP,SP
1010:006a          1e                             PUSH DS
1010:006b          31c0                           XOR AX,AX
1010:006d          9acb036810                     CALLF 0x1068:03cb
1010:0072          c47e06                         LES DI,[BP + 0x6]
1010:0075          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1010:0079          ff760a                         PUSH word ptr [BP + 0xa]
1010:007c          9a58015011                     CALLF 0x1150:0158
1010:0081          50                             PUSH AX
1010:0082          6a01                           PUSH 0x1
1010:0084          9a08015011                     CALLF 0x1150:0108
1010:0089          89ec                           MOV SP,BP
1010:008b          5d                             POP BP
1010:008c          4d                             DEC BP
1010:008d          ca0600                         RETF 0x6
FUN_1010_0090:
1010:0090          45                             INC BP
1010:0091          55                             PUSH BP
1010:0092          89e5                           MOV BP,SP
1010:0094          1e                             PUSH DS
1010:0095          b80001                         MOV AX,0x100
1010:0098          9acb036810                     CALLF 0x1068:03cb
1010:009d          81ec0001                       SUB SP,0x100
1010:00a1          8b4606                         MOV AX,word ptr [BP + 0x6]
1010:00a4          99                             CWD
1010:00a5          52                             PUSH DX
1010:00a6          50                             PUSH AX
1010:00a7          6a00                           PUSH 0x0
1010:00a9          8dbefefe                       LEA DI,[BP + 0xfefe]
1010:00ad          16                             PUSH SS
1010:00ae          57                             PUSH DI
1010:00af          68ff00                         PUSH 0xff
1010:00b2          9a720c6810                     CALLF 0x1068:0c72
1010:00b7          8dbefefe                       LEA DI,[BP + 0xfefe]
1010:00bb          16                             PUSH SS
1010:00bc          57                             PUSH DI
1010:00bd          c47e08                         LES DI,[BP + 0x8]
1010:00c0          06                             PUSH ES
1010:00c1          57                             PUSH DI
1010:00c2          68ff00                         PUSH 0xff
1010:00c5          9aab086810                     CALLF 0x1068:08ab
1010:00ca          89ec                           MOV SP,BP
1010:00cc          5d                             POP BP
1010:00cd          4d                             DEC BP
1010:00ce          ca0200                         RETF 0x2
FUN_1010_00d1:
1010:00d1          45                             INC BP
1010:00d2          55                             PUSH BP
1010:00d3          89e5                           MOV BP,SP
1010:00d5          1e                             PUSH DS
1010:00d6          b80c00                         MOV AX,0xc
1010:00d9          9acb036810                     CALLF 0x1068:03cb
1010:00de          83ec0c                         SUB SP,0xc
1010:00e1          6a00                           PUSH 0x0
1010:00e3          9ac8015011                     CALLF 0x1150:01c8
1010:00e8          99                             CWD
1010:00e9          b90200                         MOV CX,0x2
1010:00ec          f7f9                           IDIV CX
1010:00ee          8946f4                         MOV word ptr [BP + -0xc],AX
1010:00f1          6a01                           PUSH 0x1
1010:00f3          9ac8015011                     CALLF 0x1150:01c8
1010:00f8          99                             CWD
1010:00f9          b90200                         MOV CX,0x2
1010:00fc          f7f9                           IDIV CX
1010:00fe          8946f2                         MOV word ptr [BP + -0xe],AX
1010:0101          c47e06                         LES DI,[BP + 0x6]
1010:0104          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1010:0108          8d7ef6                         LEA DI,[BP + -0xa]
1010:010b          16                             PUSH SS
1010:010c          57                             PUSH DI
1010:010d          9a04015011                     CALLF 0x1150:0104
1010:0112          c47e06                         LES DI,[BP + 0x6]
1010:0115          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1010:0119          6a00                           PUSH 0x0
1010:011b          8b46fa                         MOV AX,word ptr [BP + -0x6]
1010:011e          2b46f6                         SUB AX,word ptr [BP + -0xa]
1010:0121          99                             CWD
1010:0122          b90200                         MOV CX,0x2
1010:0125          f7f9                           IDIV CX
1010:0127          8bd0                           MOV DX,AX
1010:0129          8b46f4                         MOV AX,word ptr [BP + -0xc]
1010:012c          2bc2                           SUB AX,DX
1010:012e          03460c                         ADD AX,word ptr [BP + 0xc]
1010:0131          50                             PUSH AX
1010:0132          8b46fc                         MOV AX,word ptr [BP + -0x4]
1010:0135          2b46f8                         SUB AX,word ptr [BP + -0x8]
1010:0138          99                             CWD
1010:0139          b90200                         MOV CX,0x2
1010:013c          f7f9                           IDIV CX
1010:013e          8bd0                           MOV DX,AX
1010:0140          8b46f2                         MOV AX,word ptr [BP + -0xe]
1010:0143          2bc2                           SUB AX,DX
1010:0145          03460a                         ADD AX,word ptr [BP + 0xa]
1010:0148          50                             PUSH AX
1010:0149          ff76fa                         PUSH word ptr [BP + -0x6]
1010:014c          ff76fc                         PUSH word ptr [BP + -0x4]
1010:014f          6a05                           PUSH 0x5
1010:0151          9ad0015011                     CALLF 0x1150:01d0
1010:0156          89ec                           MOV SP,BP
1010:0158          5d                             POP BP
1010:0159          4d                             DEC BP
1010:015a          ca0800                         RETF 0x8
FUN_1010_015d:
1010:015d          45                             INC BP
1010:015e          55                             PUSH BP
1010:015f          89e5                           MOV BP,SP
1010:0161          1e                             PUSH DS
1010:0162          b81200                         MOV AX,0x12
1010:0165          9acb036810                     CALLF 0x1068:03cb
1010:016a          83ec12                         SUB SP,0x12
LAB_1010_016d:
1010:016d          8d7eec                         LEA DI,[BP + -0x14]
1010:0170          16                             PUSH SS
1010:0171          57                             PUSH DI
1010:0172          6a00                           PUSH 0x0
1010:0174          6a00                           PUSH 0x0
1010:0176          6a00                           PUSH 0x0
1010:0178          6a01                           PUSH 0x1
1010:017a          9a78015011                     CALLF 0x1150:0178
1010:017f          09c0                           OR AX,AX
1010:0181          742b                           JZ 0x1010:01ae
1010:0183          c47e06                         LES DI,[BP + 0x6]
1010:0186          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1010:018a          8d7eec                         LEA DI,[BP + -0x14]
1010:018d          16                             PUSH SS
1010:018e          57                             PUSH DI
1010:018f          9a54015011                     CALLF 0x1150:0154
1010:0194          09c0                           OR AX,AX
1010:0196          7514                           JNZ 0x1010:01ac
1010:0198          8d7eec                         LEA DI,[BP + -0x14]
1010:019b          16                             PUSH SS
1010:019c          57                             PUSH DI
1010:019d          9a84015011                     CALLF 0x1150:0184
1010:01a2          8d7eec                         LEA DI,[BP + -0x14]
1010:01a5          16                             PUSH SS
1010:01a6          57                             PUSH DI
1010:01a7          9a88015011                     CALLF 0x1150:0188
LAB_1010_01ac:
1010:01ac          ebbf                           JMP 0x1010:016d
LAB_1010_01ae:
1010:01ae          89ec                           MOV SP,BP
1010:01b0          5d                             POP BP
1010:01b1          4d                             DEC BP
1010:01b2          ca0400                         RETF 0x4
FUN_1010_01b5:
1010:01b5          45                             INC BP
1010:01b6          55                             PUSH BP
1010:01b7          89e5                           MOV BP,SP
1010:01b9          1e                             PUSH DS
1010:01ba          b80401                         MOV AX,0x104
1010:01bd          9acb036810                     CALLF 0x1068:03cb
1010:01c2          81ec0401                       SUB SP,0x104
1010:01c6          8cd3                           MOV BX,SS
1010:01c8          8ec3                           MOV BX,ES
1010:01ca          8cdb                           MOV BX,DS
1010:01cc          fc                             CLD
1010:01cd          8dbefefe                       LEA DI,[BP + 0xfefe]
1010:01d1          c5760a                         LDS SI,[BP + 0xa]
1010:01d4          ac                             LODSB SI
1010:01d5          aa                             STOSB ES:DI
1010:01d6          91                             XCHG AX,CX
1010:01d7          30ed                           XOR CH,CH
1010:01d9          f3a4                           MOVSB.REP ES:DI,SI
1010:01db          8edb                           MOV BX,DS
1010:01dd          680001                         PUSH 0x100
1010:01e0          9a2d016810                     CALLF 0x1068:012d
1010:01e5          8986fafe                       MOV word ptr [BP + 0xfefa],AX
1010:01e9          8996fcfe                       MOV word ptr [BP + 0xfefc],DX
1010:01ed          ffb6fcfe                       PUSH word ptr [BP + 0xfefc]
1010:01f1          ffb6fafe                       PUSH word ptr [BP + 0xfefa]
1010:01f5          8dbefefe                       LEA DI,[BP + 0xfefe]
1010:01f9          16                             PUSH SS
1010:01fa          57                             PUSH DI
1010:01fb          9a9f006010                     CALLF 0x1060:009f
1010:0200          c47e06                         LES DI,[BP + 0x6]
1010:0203          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1010:0207          ff760e                         PUSH word ptr [BP + 0xe]
1010:020a          ffb6fcfe                       PUSH word ptr [BP + 0xfefc]
1010:020e          ffb6fafe                       PUSH word ptr [BP + 0xfefa]
1010:0212          9a5c015011                     CALLF 0x1150:015c
1010:0217          ffb6fcfe                       PUSH word ptr [BP + 0xfefc]
1010:021b          ffb6fafe                       PUSH word ptr [BP + 0xfefa]
1010:021f          680001                         PUSH 0x100
1010:0222          9a47016810                     CALLF 0x1068:0147
1010:0227          89ec                           MOV SP,BP
1010:0229          5d                             POP BP
1010:022a          4d                             DEC BP
1010:022b          ca0a00                         RETF 0xa
FUN_1010_022e:
1010:022e          45                             INC BP
1010:022f          55                             PUSH BP
1010:0230          89e5                           MOV BP,SP
1010:0232          1e                             PUSH DS
1010:0233          31c0                           XOR AX,AX
1010:0235          9acb036810                     CALLF 0x1068:03cb
1010:023a          ff760a                         PUSH word ptr [BP + 0xa]
1010:023d          680104                         PUSH 0x401
1010:0240          6a01                           PUSH 0x1
1010:0242          6a00                           PUSH 0x0
1010:0244          6a00                           PUSH 0x0
1010:0246          c47e06                         LES DI,[BP + 0x6]
1010:0249          06                             PUSH ES
1010:024a          57                             PUSH DI
1010:024b          9a45034810                     CALLF 0x1048:0345
1010:0250          89ec                           MOV SP,BP
1010:0252          5d                             POP BP
1010:0253          4d                             DEC BP
1010:0254          ca0600                         RETF 0x6
FUN_1010_025a:
1010:025a          45                             INC BP
1010:025b          55                             PUSH BP
1010:025c          89e5                           MOV BP,SP
1010:025e          1e                             PUSH DS
1010:025f          b80202                         MOV AX,0x202
1010:0262          9acb036810                     CALLF 0x1068:03cb
1010:0267          81ec0202                       SUB SP,0x202
1010:026b          8cd3                           MOV BX,SS
1010:026d          8ec3                           MOV BX,ES
1010:026f          8cdb                           MOV BX,DS
1010:0271          fc                             CLD
1010:0272          8dbefefe                       LEA DI,[BP + 0xfefe]
1010:0276          c5760a                         LDS SI,[BP + 0xa]
1010:0279          ac                             LODSB SI
1010:027a          aa                             STOSB ES:DI
1010:027b          91                             XCHG AX,CX
1010:027c          30ed                           XOR CH,CH
1010:027e          f3a4                           MOVSB.REP ES:DI,SI
1010:0280          8dbefefd                       LEA DI,[BP + 0xfdfe]
1010:0284          c57606                         LDS SI,[BP + 0x6]
1010:0287          ac                             LODSB SI
1010:0288          aa                             STOSB ES:DI
1010:0289          91                             XCHG AX,CX
1010:028a          30ed                           XOR CH,CH
1010:028c          f3a4                           MOVSB.REP ES:DI,SI
1010:028e          8edb                           MOV BX,DS
1010:0290          bf5702                         MOV DI,0x257
1010:0293          0e                             PUSH CS
1010:0294          57                             PUSH DI
1010:0295          8dbefefd                       LEA DI,[BP + 0xfdfe]
1010:0299          16                             PUSH SS
1010:029a          57                             PUSH DI
1010:029b          9a3c096810                     CALLF 0x1068:093c
1010:02a0          8986fcfd                       MOV word ptr [BP + 0xfdfc],AX
1010:02a4          83befcfd00                     CMP word ptr [BP + 0xfdfc],0x0
1010:02a9          7e26                           JLE 0x1010:02d1
1010:02ab          8dbefefd                       LEA DI,[BP + 0xfdfe]
1010:02af          16                             PUSH SS
1010:02b0          57                             PUSH DI
1010:02b1          ffb6fcfd                       PUSH word ptr [BP + 0xfdfc]
1010:02b5          6a02                           PUSH 0x2
1010:02b7          9a6d031010                     CALLF 0x1010:036d
1010:02bc          8dbefefe                       LEA DI,[BP + 0xfefe]
1010:02c0          16                             PUSH SS
1010:02c1          57                             PUSH DI
1010:02c2          8dbefefd                       LEA DI,[BP + 0xfdfe]
1010:02c6          16                             PUSH SS
1010:02c7          57                             PUSH DI
1010:02c8          ffb6fcfd                       PUSH word ptr [BP + 0xfdfc]
1010:02cc          9aeb021010                     CALLF 0x1010:02eb
LAB_1010_02d1:
1010:02d1          8dbefefd                       LEA DI,[BP + 0xfdfe]
1010:02d5          16                             PUSH SS
1010:02d6          57                             PUSH DI
1010:02d7          c47e0e                         LES DI,[BP + 0xe]
1010:02da          06                             PUSH ES
1010:02db          57                             PUSH DI
1010:02dc          68ff00                         PUSH 0xff
1010:02df          9aab086810                     CALLF 0x1068:08ab
1010:02e4          89ec                           MOV SP,BP
1010:02e6          5d                             POP BP
1010:02e7          4d                             DEC BP
1010:02e8          ca0800                         RETF 0x8
FUN_1010_02eb:
1010:02eb          45                             INC BP
1010:02ec          55                             PUSH BP
1010:02ed          89e5                           MOV BP,SP
1010:02ef          1e                             PUSH DS
1010:02f0          b80001                         MOV AX,0x100
1010:02f3          9acb036810                     CALLF 0x1068:03cb
1010:02f8          81ec0001                       SUB SP,0x100
1010:02fc          8cd3                           MOV BX,SS
1010:02fe          8ec3                           MOV BX,ES
1010:0300          8cdb                           MOV BX,DS
1010:0302          fc                             CLD
1010:0303          8dbefefe                       LEA DI,[BP + 0xfefe]
1010:0307          c5760c                         LDS SI,[BP + 0xc]
1010:030a          ac                             LODSB SI
1010:030b          aa                             STOSB ES:DI
1010:030c          91                             XCHG AX,CX
1010:030d          30ed                           XOR CH,CH
1010:030f          f3a4                           MOVSB.REP ES:DI,SI
1010:0311          8edb                           MOV BX,DS
1010:0313          8b4606                         MOV AX,word ptr [BP + 0x6]
1010:0316          c47e08                         LES DI,[BP + 0x8]
1010:0319          03f8                           ADD DI,AX
1010:031b          06                             PUSH ES
1010:031c          57                             PUSH DI
1010:031d          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1010:0321          30e4                           XOR AH,AH
1010:0323          034606                         ADD AX,word ptr [BP + 0x6]
1010:0326          c47e08                         LES DI,[BP + 0x8]
1010:0329          03f8                           ADD DI,AX
1010:032b          06                             PUSH ES
1010:032c          57                             PUSH DI
1010:032d          c47e08                         LES DI,[BP + 0x8]
1010:0330          268a05                         MOV AL,byte ptr ES:[DI]
1010:0333          fec0                           INC AL
1010:0335          30e4                           XOR AH,AH
1010:0337          2b4606                         SUB AX,word ptr [BP + 0x6]
1010:033a          50                             PUSH AX
1010:033b          9aee0c6810                     CALLF 0x1068:0cee
1010:0340          8dbefffe                       LEA DI,[BP + 0xfeff]
1010:0344          16                             PUSH SS
1010:0345          57                             PUSH DI
1010:0346          8b4606                         MOV AX,word ptr [BP + 0x6]
1010:0349          c47e08                         LES DI,[BP + 0x8]
1010:034c          03f8                           ADD DI,AX
1010:034e          06                             PUSH ES
1010:034f          57                             PUSH DI
1010:0350          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1010:0354          30e4                           XOR AH,AH
1010:0356          50                             PUSH AX
1010:0357          9aee0c6810                     CALLF 0x1068:0cee
1010:035c          8a86fefe                       MOV AL,byte ptr [BP + 0xfefe]
1010:0360          c47e08                         LES DI,[BP + 0x8]
1010:0363          260005                         ADD byte ptr ES:[DI],AL
1010:0366          89ec                           MOV SP,BP
1010:0368          5d                             POP BP
1010:0369          4d                             DEC BP
1010:036a          ca0a00                         RETF 0xa
FUN_1010_036d:
1010:036d          45                             INC BP
1010:036e          55                             PUSH BP
1010:036f          89e5                           MOV BP,SP
1010:0371          1e                             PUSH DS
1010:0372          31c0                           XOR AX,AX
1010:0374          9acb036810                     CALLF 0x1068:03cb
1010:0379          8b4608                         MOV AX,word ptr [BP + 0x8]
1010:037c          034606                         ADD AX,word ptr [BP + 0x6]
1010:037f          c47e0a                         LES DI,[BP + 0xa]
1010:0382          03f8                           ADD DI,AX
1010:0384          06                             PUSH ES
1010:0385          57                             PUSH DI
1010:0386          8b4608                         MOV AX,word ptr [BP + 0x8]
1010:0389          c47e0a                         LES DI,[BP + 0xa]
1010:038c          03f8                           ADD DI,AX
1010:038e          06                             PUSH ES
1010:038f          57                             PUSH DI
1010:0390          c47e0a                         LES DI,[BP + 0xa]
1010:0393          268a05                         MOV AL,byte ptr ES:[DI]
1010:0396          fec0                           INC AL
1010:0398          30e4                           XOR AH,AH
1010:039a          2b4608                         SUB AX,word ptr [BP + 0x8]
1010:039d          2b4606                         SUB AX,word ptr [BP + 0x6]
1010:03a0          50                             PUSH AX
1010:03a1          9aee0c6810                     CALLF 0x1068:0cee
1010:03a6          8a4606                         MOV AL,byte ptr [BP + 0x6]
1010:03a9          c47e0a                         LES DI,[BP + 0xa]
1010:03ac          262805                         SUB byte ptr ES:[DI],AL
1010:03af          89ec                           MOV SP,BP
1010:03b1          5d                             POP BP
1010:03b2          4d                             DEC BP
1010:03b3          ca0800                         RETF 0x8
FUN_1010_03b6:
1010:03b6          55                             PUSH BP
1010:03b7          89e5                           MOV BP,SP
1010:03b9          31c0                           XOR AX,AX
1010:03bb          9acb036810                     CALLF 0x1068:03cb
1010:03c0          6a79                           PUSH 0x79
1010:03c2          9a260d6810                     CALLF 0x1068:0d26
1010:03c7          a24599                         MOV [0x9945],AL
1010:03ca          6a6e                           PUSH 0x6e
1010:03cc          9a260d6810                     CALLF 0x1068:0d26
1010:03d1          a24699                         MOV [0x9946],AL
1010:03d4          c9                             LEAVE
1010:03d5          cb                             RETF
FUN_1018_000f:
1018:000f          45                             INC BP
1018:0010          55                             PUSH BP
1018:0011          89e5                           MOV BP,SP
1018:0013          1e                             PUSH DS
1018:0014          b8b813                         MOV AX,0x13b8
1018:0017          9acb036810                     CALLF 0x1068:03cb
1018:001c          81ecb813                       SUB SP,0x13b8
1018:0020          31c0                           XOR AX,AX
1018:0022          8946fc                         MOV word ptr [BP + -0x4],AX
1018:0025          c606009a00                     MOV byte ptr [0x9a00],0x0
1018:002a          9a66086810                     CALLF 0x1068:0866
1018:002f          09c0                           OR AX,AX
1018:0031          7f03                           JG 0x1018:0036
1018:0033          e99d00                         JMP 0x1018:00d3
LAB_1018_0036:
1018:0036          9a66086810                     CALLF 0x1068:0866
1018:003b          898646ee                       MOV word ptr [BP + 0xee46],AX
1018:003f          b80100                         MOV AX,0x1
1018:0042          3b8646ee                       CMP AX,word ptr [BP + 0xee46]
1018:0046          774f                           JA 0x1018:0097
1018:0048          89864cee                       MOV word ptr [BP + 0xee4c],AX
1018:004c          eb04                           JMP 0x1018:0052
LAB_1018_004e:
1018:004e          ff864cee                       INC word ptr [BP + 0xee4c]
LAB_1018_0052:
1018:0052          8dbe46ec                       LEA DI,[BP + 0xec46]
1018:0056          16                             PUSH SS
1018:0057          57                             PUSH DI
1018:0058          bf009a                         MOV DI,0x9a00
1018:005b          1e                             PUSH DS
1018:005c          57                             PUSH DI
1018:005d          9a91086810                     CALLF 0x1068:0891
1018:0062          8dbe46ed                       LEA DI,[BP + 0xed46]
1018:0066          16                             PUSH SS
1018:0067          57                             PUSH DI
1018:0068          ffb64cee                       PUSH word ptr [BP + 0xee4c]
1018:006c          9a2e086810                     CALLF 0x1068:082e
1018:0071          9a10096810                     CALLF 0x1068:0910
1018:0076          bf0200                         MOV DI,0x2
1018:0079          0e                             PUSH CS
1018:007a          57                             PUSH DI
1018:007b          9a10096810                     CALLF 0x1068:0910
1018:0080          bf009a                         MOV DI,0x9a00
1018:0083          1e                             PUSH DS
1018:0084          57                             PUSH DI
1018:0085          68ff00                         PUSH 0xff
1018:0088          9aab086810                     CALLF 0x1068:08ab
1018:008d          8b864cee                       MOV AX,word ptr [BP + 0xee4c]
1018:0091          3b8646ee                       CMP AX,word ptr [BP + 0xee46]
1018:0095          75b7                           JNZ 0x1018:004e
LAB_1018_0097:
1018:0097          a0009a                         MOV AL,[0x9a00]
1018:009a          30e4                           XOR AH,AH
1018:009c          898646ee                       MOV word ptr [BP + 0xee46],AX
1018:00a0          b80100                         MOV AX,0x1
1018:00a3          3b8646ee                       CMP AX,word ptr [BP + 0xee46]
1018:00a7          772a                           JA 0x1018:00d3
1018:00a9          89864cee                       MOV word ptr [BP + 0xee4c],AX
1018:00ad          eb04                           JMP 0x1018:00b3
LAB_1018_00af:
1018:00af          ff864cee                       INC word ptr [BP + 0xee4c]
LAB_1018_00b3:
1018:00b3          8bbe4cee                       MOV DI,word ptr [BP + 0xee4c]
1018:00b7          8a85009a                       MOV AL,byte ptr [DI + 0x9a00]
1018:00bb          50                             PUSH AX
1018:00bc          9a260d6810                     CALLF 0x1068:0d26
1018:00c1          8bbe4cee                       MOV DI,word ptr [BP + 0xee4c]
1018:00c5          8885009a                       MOV byte ptr [DI + 0x9a00],AL
1018:00c9          8b864cee                       MOV AX,word ptr [BP + 0xee4c]
1018:00cd          3b8646ee                       CMP AX,word ptr [BP + 0xee46]
1018:00d1          75dc                           JNZ 0x1018:00af
LAB_1018_00d3:
1018:00d3          bf0400                         MOV DI,0x4
1018:00d6          0e                             PUSH CS
1018:00d7          57                             PUSH DI
1018:00d8          bf009a                         MOV DI,0x9a00
1018:00db          1e                             PUSH DS
1018:00dc          57                             PUSH DI
1018:00dd          9a3c096810                     CALLF 0x1068:093c
1018:00e2          09c0                           OR AX,AX
1018:00e4          7506                           JNZ 0x1018:00ec
1018:00e6          837e0664                       CMP word ptr [BP + 0x6],0x64
1018:00ea          7e0b                           JLE 0x1018:00f7
LAB_1018_00ec:
1018:00ec          9a66086810                     CALLF 0x1068:0866
1018:00f1          48                             DEC AX
1018:00f2          a3009b                         MOV [0x9b00],AX
1018:00f5          eb0e                           JMP 0x1018:0105
LAB_1018_00f7:
1018:00f7          807e0856                       CMP byte ptr [BP + 0x8],0x56
1018:00fb          7408                           JZ 0x1018:0105
1018:00fd          9a66086810                     CALLF 0x1068:0866
1018:0102          a3009b                         MOV [0x9b00],AX
LAB_1018_0105:
1018:0105          8dbe48ed                       LEA DI,[BP + 0xed48]
1018:0109          16                             PUSH SS
1018:010a          57                             PUSH DI
1018:010b          6a00                           PUSH 0x0
1018:010d          9a2e086810                     CALLF 0x1068:082e
1018:0112          bf5a99                         MOV DI,0x995a
1018:0115          1e                             PUSH DS
1018:0116          57                             PUSH DI
1018:0117          6a50                           PUSH 0x50
1018:0119          9aab086810                     CALLF 0x1068:08ab
1018:011e          8d7e94                         LEA DI,[BP + -0x6c]
1018:0121          16                             PUSH SS
1018:0122          57                             PUSH DI
1018:0123          bf5a99                         MOV DI,0x995a
1018:0126          1e                             PUSH DS
1018:0127          57                             PUSH DI
1018:0128          9a9f006010                     CALLF 0x1060:009f
1018:012d          8d7e94                         LEA DI,[BP + -0x6c]
1018:0130          16                             PUSH SS
1018:0131          57                             PUSH DI
1018:0132          8dbe30ff                       LEA DI,[BP + 0xff30]
1018:0136          16                             PUSH SS
1018:0137          57                             PUSH DI
1018:0138          8dbeccfe                       LEA DI,[BP + 0xfecc]
1018:013c          16                             PUSH SS
1018:013d          57                             PUSH DI
1018:013e          8dbe68fe                       LEA DI,[BP + 0xfe68]
1018:0142          16                             PUSH SS
1018:0143          57                             PUSH DI
1018:0144          9a02003810                     CALLF 0x1038:0002
1018:0149          8dbe48ed                       LEA DI,[BP + 0xed48]
1018:014d          16                             PUSH SS
1018:014e          57                             PUSH DI
1018:014f          8dbe30ff                       LEA DI,[BP + 0xff30]
1018:0153          16                             PUSH SS
1018:0154          57                             PUSH DI
1018:0155          9a7e016010                     CALLF 0x1060:017e
1018:015a          bfac99                         MOV DI,0x99ac
1018:015d          1e                             PUSH DS
1018:015e          57                             PUSH DI
1018:015f          6a50                           PUSH 0x50
1018:0161          9aab086810                     CALLF 0x1068:08ab
1018:0166          bf0800                         MOV DI,0x8
1018:0169          0e                             PUSH CS
1018:016a          57                             PUSH DI
1018:016b          8d7ef8                         LEA DI,[BP + -0x8]
1018:016e          16                             PUSH SS
1018:016f          57                             PUSH DI
1018:0170          6a03                           PUSH 0x3
1018:0172          9aab086810                     CALLF 0x1068:08ab
1018:0177          8a46f9                         MOV AL,byte ptr [BP + -0x7]
1018:017a          50                             PUSH AX
1018:017b          9a260d6810                     CALLF 0x1068:0d26
1018:0180          a2fd99                         MOV [0x99fd],AL
1018:0183          bf0c00                         MOV DI,0xc
1018:0186          0e                             PUSH CS
1018:0187          57                             PUSH DI
1018:0188          8d7ef8                         LEA DI,[BP + -0x8]
1018:018b          16                             PUSH SS
1018:018c          57                             PUSH DI
1018:018d          6a03                           PUSH 0x3
1018:018f          9aab086810                     CALLF 0x1068:08ab
1018:0194          8a46f9                         MOV AL,byte ptr [BP + -0x7]
1018:0197          50                             PUSH AX
1018:0198          9a260d6810                     CALLF 0x1068:0d26
1018:019d          a2fe99                         MOV [0x99fe],AL
1018:01a0          8b46fc                         MOV AX,word ptr [BP + -0x4]
1018:01a3          89ec                           MOV SP,BP
1018:01a5          5d                             POP BP
1018:01a6          4d                             DEC BP
1018:01a7          ca0400                         RETF 0x4
FUN_1018_01aa:
1018:01aa          55                             PUSH BP
1018:01ab          89e5                           MOV BP,SP
1018:01ad          31c0                           XOR AX,AX
1018:01af          9acb036810                     CALLF 0x1068:03cb
1018:01b4          c606589900                     MOV byte ptr [0x9958],0x0
1018:01b9          c606559900                     MOV byte ptr [0x9955],0x0
1018:01be          c606569900                     MOV byte ptr [0x9956],0x0
1018:01c3          c606549900                     MOV byte ptr [0x9954],0x0
1018:01c8          c9                             LEAVE
1018:01c9          cb                             RETF
FUN_1020_0002:
1020:0002          45                             INC BP
1020:0003          55                             PUSH BP
1020:0004          89e5                           MOV BP,SP
1020:0006          1e                             PUSH DS
1020:0007          31c0                           XOR AX,AX
1020:0009          9acb036810                     CALLF 0x1068:03cb
1020:000e          b80003                         MOV AX,0x300
1020:0011          8a5e0a                         MOV BL,byte ptr [BP + 0xa]
1020:0014          b700                           MOV BH,0x0
1020:0016          b90000                         MOV CX,0x0
1020:0019          c47e06                         LES DI,[BP + 0x6]
1020:001c          cd31                           INT 0x31
1020:001e          b80000                         MOV AX,0x0
1020:0021          7303                           JNC 0x1020:0026
1020:0023          b80100                         MOV AX,0x1
LAB_1020_0026:
1020:0026          89ec                           MOV SP,BP
1020:0028          5d                             POP BP
1020:0029          4d                             DEC BP
1020:002a          ca0600                         RETF 0x6
FUN_1020_002d:
1020:002d          45                             INC BP
1020:002e          55                             PUSH BP
1020:002f          89e5                           MOV BP,SP
1020:0031          1e                             PUSH DS
1020:0032          b84e00                         MOV AX,0x4e
1020:0035          9acb036810                     CALLF 0x1068:03cb
1020:003a          83ec4e                         SUB SP,0x4e
1020:003d          8d7eb0                         LEA DI,[BP + -0x50]
1020:0040          16                             PUSH SS
1020:0041          57                             PUSH DI
1020:0042          6a32                           PUSH 0x32
1020:0044          6a00                           PUSH 0x0
1020:0046          9a120d6810                     CALLF 0x1068:0d12
1020:004b          837e0800                       CMP word ptr [BP + 0x8],0x0
1020:004f          765b                           JBE 0x1020:00ac
1020:0051          8b4608                         MOV AX,word ptr [BP + 0x8]
1020:0054          31d2                           XOR DX,DX
1020:0056          52                             PUSH DX
1020:0057          50                             PUSH AX
1020:0058          9a48005011                     CALLF 0x1150:0048
1020:005d          8946f8                         MOV word ptr [BP + -0x8],AX
1020:0060          8956fa                         MOV word ptr [BP + -0x6],DX
1020:0063          8b46f8                         MOV AX,word ptr [BP + -0x8]
1020:0066          0b46fa                         OR AX,word ptr [BP + -0x6]
1020:0069          7508                           JNZ 0x1020:0073
1020:006b          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1020:0070          e9ee01                         JMP 0x1020:0261
LAB_1020_0073:
1020:0073          8b46f8                         MOV AX,word ptr [BP + -0x8]
1020:0076          8946f0                         MOV word ptr [BP + -0x10],AX
1020:0079          8b46fa                         MOV AX,word ptr [BP + -0x6]
1020:007c          8946ec                         MOV word ptr [BP + -0x14],AX
1020:007f          31c0                           XOR AX,AX
1020:0081          8b56f0                         MOV DX,word ptr [BP + -0x10]
1020:0084          8946e6                         MOV word ptr [BP + -0x1a],AX
1020:0087          8956e8                         MOV word ptr [BP + -0x18],DX
1020:008a          c47e0e                         LES DI,[BP + 0xe]
1020:008d          06                             PUSH ES
1020:008e          57                             PUSH DI
1020:008f          c47ee6                         LES DI,[BP + -0x1a]
1020:0092          06                             PUSH ES
1020:0093          57                             PUSH DI
1020:0094          ff7608                         PUSH word ptr [BP + 0x8]
1020:0097          9aee0c6810                     CALLF 0x1068:0cee
1020:009c          31c0                           XOR AX,AX
1020:009e          8946c4                         MOV word ptr [BP + -0x3c],AX
1020:00a1          8946c6                         MOV word ptr [BP + -0x3a],AX
1020:00a4          8b46ec                         MOV AX,word ptr [BP + -0x14]
1020:00a7          8946d4                         MOV word ptr [BP + -0x2c],AX
1020:00aa          eb16                           JMP 0x1020:00c2
LAB_1020_00ac:
1020:00ac          c47e12                         LES DI,[BP + 0x12]
1020:00af          268b450e                       MOV AX,word ptr ES:[DI + 0xe]
1020:00b3          8946d4                         MOV word ptr [BP + -0x2c],AX
1020:00b6          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1020:00ba          31d2                           XOR DX,DX
1020:00bc          8946c4                         MOV word ptr [BP + -0x3c],AX
1020:00bf          8956c6                         MOV word ptr [BP + -0x3a],DX
LAB_1020_00c2:
1020:00c2          837e0600                       CMP word ptr [BP + 0x6],0x0
1020:00c6          766c                           JBE 0x1020:0134
1020:00c8          8b4606                         MOV AX,word ptr [BP + 0x6]
1020:00cb          31d2                           XOR DX,DX
1020:00cd          52                             PUSH DX
1020:00ce          50                             PUSH AX
1020:00cf          9a48005011                     CALLF 0x1150:0048
1020:00d4          8946f4                         MOV word ptr [BP + -0xc],AX
1020:00d7          8956f6                         MOV word ptr [BP + -0xa],DX
1020:00da          8b46f4                         MOV AX,word ptr [BP + -0xc]
1020:00dd          0b46f6                         OR AX,word ptr [BP + -0xa]
1020:00e0          7519                           JNZ 0x1020:00fb
1020:00e2          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1020:00e7          837e0800                       CMP word ptr [BP + 0x8],0x0
1020:00eb          760b                           JBE 0x1020:00f8
1020:00ed          ff76f0                         PUSH word ptr [BP + -0x10]
1020:00f0          9a4c005011                     CALLF 0x1150:004c
1020:00f5          8946f2                         MOV word ptr [BP + -0xe],AX
LAB_1020_00f8:
1020:00f8          e96601                         JMP 0x1020:0261
LAB_1020_00fb:
1020:00fb          8b46f4                         MOV AX,word ptr [BP + -0xc]
1020:00fe          8946ee                         MOV word ptr [BP + -0x12],AX
1020:0101          8b46f6                         MOV AX,word ptr [BP + -0xa]
1020:0104          8946ea                         MOV word ptr [BP + -0x16],AX
1020:0107          31c0                           XOR AX,AX
1020:0109          8b56ee                         MOV DX,word ptr [BP + -0x12]
1020:010c          8946e2                         MOV word ptr [BP + -0x1e],AX
1020:010f          8956e4                         MOV word ptr [BP + -0x1c],DX
1020:0112          c47e0a                         LES DI,[BP + 0xa]
1020:0115          06                             PUSH ES
1020:0116          57                             PUSH DI
1020:0117          c47ee2                         LES DI,[BP + -0x1e]
1020:011a          06                             PUSH ES
1020:011b          57                             PUSH DI
1020:011c          ff7606                         PUSH word ptr [BP + 0x6]
1020:011f          9aee0c6810                     CALLF 0x1068:0cee
1020:0124          31c0                           XOR AX,AX
1020:0126          8946c0                         MOV word ptr [BP + -0x40],AX
1020:0129          8946c2                         MOV word ptr [BP + -0x3e],AX
1020:012c          8b46ea                         MOV AX,word ptr [BP + -0x16]
1020:012f          8946d2                         MOV word ptr [BP + -0x2e],AX
1020:0132          eb16                           JMP 0x1020:014a
LAB_1020_0134:
1020:0134          c47e12                         LES DI,[BP + 0x12]
1020:0137          268b4510                       MOV AX,word ptr ES:[DI + 0x10]
1020:013b          8946d2                         MOV word ptr [BP + -0x2e],AX
1020:013e          268b4502                       MOV AX,word ptr ES:[DI + 0x2]
1020:0142          31d2                           XOR DX,DX
1020:0144          8946c0                         MOV word ptr [BP + -0x40],AX
1020:0147          8956c2                         MOV word ptr [BP + -0x3e],DX
LAB_1020_014a:
1020:014a          c47e12                         LES DI,[BP + 0x12]
1020:014d          268b450c                       MOV AX,word ptr ES:[DI + 0xc]
1020:0151          31d2                           XOR DX,DX
1020:0153          8946b0                         MOV word ptr [BP + -0x50],AX
1020:0156          8956b2                         MOV word ptr [BP + -0x4e],DX
1020:0159          268b450a                       MOV AX,word ptr ES:[DI + 0xa]
1020:015d          31d2                           XOR DX,DX
1020:015f          8946b4                         MOV word ptr [BP + -0x4c],AX
1020:0162          8956b6                         MOV word ptr [BP + -0x4a],DX
1020:0165          268b05                         MOV AX,word ptr ES:[DI]
1020:0168          31d2                           XOR DX,DX
1020:016a          8946cc                         MOV word ptr [BP + -0x34],AX
1020:016d          8956ce                         MOV word ptr [BP + -0x32],DX
1020:0170          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1020:0174          31d2                           XOR DX,DX
1020:0176          8946c8                         MOV word ptr [BP + -0x38],AX
1020:0179          8956ca                         MOV word ptr [BP + -0x36],DX
1020:017c          8a4616                         MOV AL,byte ptr [BP + 0x16]
1020:017f          50                             PUSH AX
1020:0180          8d7eb0                         LEA DI,[BP + -0x50]
1020:0183          16                             PUSH SS
1020:0184          57                             PUSH DI
1020:0185          9a02002010                     CALLF 0x1020:0002
1020:018a          8946f2                         MOV word ptr [BP + -0xe],AX
1020:018d          837ef200                       CMP word ptr [BP + -0xe],0x0
1020:0191          750c                           JNZ 0x1020:019f
1020:0193          8b46d0                         MOV AX,word ptr [BP + -0x30]
1020:0196          c47e12                         LES DI,[BP + 0x12]
1020:0199          26894512                       MOV word ptr ES:[DI + 0x12],AX
1020:019d          eb33                           JMP 0x1020:01d2
LAB_1020_019f:
1020:019f          c47e12                         LES DI,[BP + 0x12]
1020:01a2          26c74512ffff                   MOV word ptr ES:[DI + 0x12],0xffff
1020:01a8          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1020:01ad          837e0600                       CMP word ptr [BP + 0x6],0x0
1020:01b1          760b                           JBE 0x1020:01be
1020:01b3          ff76ee                         PUSH word ptr [BP + -0x12]
1020:01b6          9a4c005011                     CALLF 0x1150:004c
1020:01bb          8946f2                         MOV word ptr [BP + -0xe],AX
LAB_1020_01be:
1020:01be          837e0800                       CMP word ptr [BP + 0x8],0x0
1020:01c2          760b                           JBE 0x1020:01cf
1020:01c4          ff76f0                         PUSH word ptr [BP + -0x10]
1020:01c7          9a4c005011                     CALLF 0x1150:004c
1020:01cc          8946f2                         MOV word ptr [BP + -0xe],AX
LAB_1020_01cf:
1020:01cf          e98f00                         JMP 0x1020:0261
LAB_1020_01d2:
1020:01d2          8b46b0                         MOV AX,word ptr [BP + -0x50]
1020:01d5          c47e12                         LES DI,[BP + 0x12]
1020:01d8          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1020:01dc          8b46b4                         MOV AX,word ptr [BP + -0x4c]
1020:01df          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1020:01e3          8b46cc                         MOV AX,word ptr [BP + -0x34]
1020:01e6          268905                         MOV word ptr ES:[DI],AX
1020:01e9          8b46c8                         MOV AX,word ptr [BP + -0x38]
1020:01ec          26894504                       MOV word ptr ES:[DI + 0x4],AX
1020:01f0          837e0800                       CMP word ptr [BP + 0x8],0x0
1020:01f4          761f                           JBE 0x1020:0215
1020:01f6          c47ee6                         LES DI,[BP + -0x1a]
1020:01f9          06                             PUSH ES
1020:01fa          57                             PUSH DI
1020:01fb          c47e0e                         LES DI,[BP + 0xe]
1020:01fe          06                             PUSH ES
1020:01ff          57                             PUSH DI
1020:0200          ff7608                         PUSH word ptr [BP + 0x8]
1020:0203          9aee0c6810                     CALLF 0x1068:0cee
1020:0208          ff76f0                         PUSH word ptr [BP + -0x10]
1020:020b          9a4c005011                     CALLF 0x1150:004c
1020:0210          8946f2                         MOV word ptr [BP + -0xe],AX
1020:0213          eb11                           JMP 0x1020:0226
LAB_1020_0215:
1020:0215          8b46d4                         MOV AX,word ptr [BP + -0x2c]
1020:0218          c47e12                         LES DI,[BP + 0x12]
1020:021b          2689450e                       MOV word ptr ES:[DI + 0xe],AX
1020:021f          8b46c4                         MOV AX,word ptr [BP + -0x3c]
1020:0222          26894506                       MOV word ptr ES:[DI + 0x6],AX
LAB_1020_0226:
1020:0226          837e0600                       CMP word ptr [BP + 0x6],0x0
1020:022a          761f                           JBE 0x1020:024b
1020:022c          c47ee2                         LES DI,[BP + -0x1e]
1020:022f          06                             PUSH ES
1020:0230          57                             PUSH DI
1020:0231          c47e0a                         LES DI,[BP + 0xa]
1020:0234          06                             PUSH ES
1020:0235          57                             PUSH DI
1020:0236          ff7606                         PUSH word ptr [BP + 0x6]
1020:0239          9aee0c6810                     CALLF 0x1068:0cee
1020:023e          ff76ee                         PUSH word ptr [BP + -0x12]
1020:0241          9a4c005011                     CALLF 0x1150:004c
1020:0246          8946f2                         MOV word ptr [BP + -0xe],AX
1020:0249          eb11                           JMP 0x1020:025c
LAB_1020_024b:
1020:024b          8b46d2                         MOV AX,word ptr [BP + -0x2e]
1020:024e          c47e12                         LES DI,[BP + 0x12]
1020:0251          26894510                       MOV word ptr ES:[DI + 0x10],AX
1020:0255          8b46c0                         MOV AX,word ptr [BP + -0x40]
1020:0258          26894502                       MOV word ptr ES:[DI + 0x2],AX
LAB_1020_025c:
1020:025c          31c0                           XOR AX,AX
1020:025e          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1020_0261:
1020:0261          8b46fc                         MOV AX,word ptr [BP + -0x4]
1020:0264          89ec                           MOV SP,BP
1020:0266          5d                             POP BP
1020:0267          4d                             DEC BP
1020:0268          ca1200                         RETF 0x12
FUN_1020_026b:
1020:026b          45                             INC BP
1020:026c          55                             PUSH BP
1020:026d          89e5                           MOV BP,SP
1020:026f          1e                             PUSH DS
1020:0270          b81800                         MOV AX,0x18
1020:0273          9acb036810                     CALLF 0x1068:03cb
1020:0278          83ec18                         SUB SP,0x18
1020:027b          31c0                           XOR AX,AX
1020:027d          8946fc                         MOV word ptr [BP + -0x4],AX
1020:0280          c646e71a                       MOV byte ptr [BP + -0x19],0x1a
1020:0284          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:0287          d1e7                           SHL DI,0x1
1020:0289          8b85d89c                       MOV AX,word ptr [DI + 0x9cd8]
1020:028d          8946ec                         MOV word ptr [BP + -0x14],AX
1020:0290          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:0293          d1e7                           SHL DI,0x1
1020:0295          8b85989c                       MOV AX,word ptr [DI + 0x9c98]
1020:0299          8946f4                         MOV word ptr [BP + -0xc],AX
1020:029c          6a21                           PUSH 0x21
1020:029e          8d7ee6                         LEA DI,[BP + -0x1a]
1020:02a1          16                             PUSH SS
1020:02a2          57                             PUSH DI
1020:02a3          6a00                           PUSH 0x0
1020:02a5          6a00                           PUSH 0x0
1020:02a7          6a00                           PUSH 0x0
1020:02a9          6a00                           PUSH 0x0
1020:02ab          6a00                           PUSH 0x0
1020:02ad          6a00                           PUSH 0x0
1020:02af          9a2d002010                     CALLF 0x1020:002d
1020:02b4          8946fa                         MOV word ptr [BP + -0x6],AX
1020:02b7          837efa00                       CMP word ptr [BP + -0x6],0x0
1020:02bb          7405                           JZ 0x1020:02c2
1020:02bd          c746fc0100                     MOV word ptr [BP + -0x4],0x1
LAB_1020_02c2:
1020:02c2          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:02c5          d1e7                           SHL DI,0x1
1020:02c7          ffb5189c                       PUSH word ptr [DI + 0x9c18]
1020:02cb          9a4c005011                     CALLF 0x1150:004c
1020:02d0          8946fa                         MOV word ptr [BP + -0x6],AX
1020:02d3          837efa00                       CMP word ptr [BP + -0x6],0x0
1020:02d7          7405                           JZ 0x1020:02de
1020:02d9          c746fc0200                     MOV word ptr [BP + -0x4],0x2
LAB_1020_02de:
1020:02de          8b46fc                         MOV AX,word ptr [BP + -0x4]
1020:02e1          89ec                           MOV SP,BP
1020:02e3          5d                             POP BP
1020:02e4          4d                             DEC BP
1020:02e5          ca0200                         RETF 0x2
FUN_1020_02ea:
1020:02ea          45                             INC BP
1020:02eb          55                             PUSH BP
1020:02ec          89e5                           MOV BP,SP
1020:02ee          1e                             PUSH DS
1020:02ef          b82203                         MOV AX,0x322
1020:02f2          9acb036810                     CALLF 0x1068:03cb
1020:02f7          81ec2203                       SUB SP,0x322
1020:02fb          8cd3                           MOV BX,SS
1020:02fd          8ec3                           MOV BX,ES
1020:02ff          8cdb                           MOV BX,DS
1020:0301          fc                             CLD
1020:0302          8dbefcfe                       LEA DI,[BP + 0xfefc]
1020:0306          c5760e                         LDS SI,[BP + 0xe]
1020:0309          ac                             LODSB SI
1020:030a          aa                             STOSB ES:DI
1020:030b          91                             XCHG AX,CX
1020:030c          30ed                           XOR CH,CH
1020:030e          f3a4                           MOVSB.REP ES:DI,SI
1020:0310          8edb                           MOV BX,DS
1020:0312          c686ddfd2f                     MOV byte ptr [BP + 0xfddd],0x2f
1020:0317          6a21                           PUSH 0x21
1020:0319          8dbedcfd                       LEA DI,[BP + 0xfddc]
1020:031d          16                             PUSH SS
1020:031e          57                             PUSH DI
1020:031f          6a00                           PUSH 0x0
1020:0321          6a00                           PUSH 0x0
1020:0323          6a00                           PUSH 0x0
1020:0325          6a00                           PUSH 0x0
1020:0327          6a00                           PUSH 0x0
1020:0329          6a00                           PUSH 0x0
1020:032b          9a2d002010                     CALLF 0x1020:002d
1020:0330          8986fafe                       MOV word ptr [BP + 0xfefa],AX
1020:0334          83befafe00                     CMP word ptr [BP + 0xfefa],0x0
1020:0339          7408                           JZ 0x1020:0343
1020:033b          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1020:0340          e98a01                         JMP 0x1020:04cd
LAB_1020_0343:
1020:0343          8b86ecfd                       MOV AX,word ptr [BP + 0xfdec]
1020:0347          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:034a          d1e7                           SHL DI,0x1
1020:034c          8985989c                       MOV word ptr [DI + 0x9c98],AX
1020:0350          8b86defd                       MOV AX,word ptr [BP + 0xfdde]
1020:0354          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:0357          d1e7                           SHL DI,0x1
1020:0359          8985d89c                       MOV word ptr [DI + 0x9cd8],AX
1020:035d          6a00                           PUSH 0x0
1020:035f          6a2b                           PUSH 0x2b
1020:0361          9a48005011                     CALLF 0x1150:0048
1020:0366          8986f0fd                       MOV word ptr [BP + 0xfdf0],AX
1020:036a          8996f2fd                       MOV word ptr [BP + 0xfdf2],DX
1020:036e          8b86f0fd                       MOV AX,word ptr [BP + 0xfdf0]
1020:0372          0b86f2fd                       OR AX,word ptr [BP + 0xfdf2]
1020:0376          7508                           JNZ 0x1020:0380
1020:0378          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1020:037d          e94d01                         JMP 0x1020:04cd
LAB_1020_0380:
1020:0380          8b86f0fd                       MOV AX,word ptr [BP + 0xfdf0]
1020:0384          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:0387          d1e7                           SHL DI,0x1
1020:0389          8985189c                       MOV word ptr [DI + 0x9c18],AX
1020:038d          8b86f2fd                       MOV AX,word ptr [BP + 0xfdf2]
1020:0391          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:0394          d1e7                           SHL DI,0x1
1020:0396          8985589c                       MOV word ptr [DI + 0x9c58],AX
1020:039a          c686ddfd1a                     MOV byte ptr [BP + 0xfddd],0x1a
1020:039f          31c0                           XOR AX,AX
1020:03a1          8986e2fd                       MOV word ptr [BP + 0xfde2],AX
1020:03a5          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:03a8          d1e7                           SHL DI,0x1
1020:03aa          8b85589c                       MOV AX,word ptr [DI + 0x9c58]
1020:03ae          8986eafd                       MOV word ptr [BP + 0xfdea],AX
1020:03b2          6a21                           PUSH 0x21
1020:03b4          8dbedcfd                       LEA DI,[BP + 0xfddc]
1020:03b8          16                             PUSH SS
1020:03b9          57                             PUSH DI
1020:03ba          6a00                           PUSH 0x0
1020:03bc          6a00                           PUSH 0x0
1020:03be          6a00                           PUSH 0x0
1020:03c0          6a00                           PUSH 0x0
1020:03c2          6a00                           PUSH 0x0
1020:03c4          6a00                           PUSH 0x0
1020:03c6          9a2d002010                     CALLF 0x1020:002d
1020:03cb          8986fafe                       MOV word ptr [BP + 0xfefa],AX
1020:03cf          83befafe00                     CMP word ptr [BP + 0xfefa],0x0
1020:03d4          741a                           JZ 0x1020:03f0
1020:03d6          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1020:03db          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:03de          d1e7                           SHL DI,0x1
1020:03e0          ffb5189c                       PUSH word ptr [DI + 0x9c18]
1020:03e4          9a4c005011                     CALLF 0x1150:004c
1020:03e9          8986fafe                       MOV word ptr [BP + 0xfefa],AX
1020:03ed          e9dd00                         JMP 0x1020:04cd
LAB_1020_03f0:
1020:03f0          c686ddfd4e                     MOV byte ptr [BP + 0xfddd],0x4e
1020:03f5          8a460c                         MOV AL,byte ptr [BP + 0xc]
1020:03f8          30e4                           XOR AH,AH
1020:03fa          8986e0fd                       MOV word ptr [BP + 0xfde0],AX
1020:03fe          8dbedcfc                       LEA DI,[BP + 0xfcdc]
1020:0402          16                             PUSH SS
1020:0403          57                             PUSH DI
1020:0404          8dbefcfe                       LEA DI,[BP + 0xfefc]
1020:0408          16                             PUSH SS
1020:0409          57                             PUSH DI
1020:040a          9a91086810                     CALLF 0x1068:0891
1020:040f          bfe802                         MOV DI,0x2e8
1020:0412          0e                             PUSH CS
1020:0413          57                             PUSH DI
1020:0414          9a10096810                     CALLF 0x1068:0910
1020:0419          8dbef8fd                       LEA DI,[BP + 0xfdf8]
1020:041d          16                             PUSH SS
1020:041e          57                             PUSH DI
1020:041f          68ff00                         PUSH 0xff
1020:0422          9aab086810                     CALLF 0x1068:08ab
1020:0427          6a21                           PUSH 0x21
1020:0429          8dbedcfd                       LEA DI,[BP + 0xfddc]
1020:042d          16                             PUSH SS
1020:042e          57                             PUSH DI
1020:042f          8dbef9fd                       LEA DI,[BP + 0xfdf9]
1020:0433          16                             PUSH SS
1020:0434          57                             PUSH DI
1020:0435          6a00                           PUSH 0x0
1020:0437          6a00                           PUSH 0x0
1020:0439          68ff00                         PUSH 0xff
1020:043c          6a00                           PUSH 0x0
1020:043e          9a2d002010                     CALLF 0x1020:002d
1020:0443          8986fafe                       MOV word ptr [BP + 0xfefa],AX
1020:0447          83befafe00                     CMP word ptr [BP + 0xfefa],0x0
1020:044c          7407                           JZ 0x1020:0455
1020:044e          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1020:0453          eb78                           JMP 0x1020:04cd
LAB_1020_0455:
1020:0455          31c0                           XOR AX,AX
1020:0457          8b7e06                         MOV DI,word ptr [BP + 0x6]
1020:045a          d1e7                           SHL DI,0x1
1020:045c          8b95189c                       MOV DX,word ptr [DI + 0x9c18]
1020:0460          8986f4fd                       MOV word ptr [BP + 0xfdf4],AX
1020:0464          8996f6fd                       MOV word ptr [BP + 0xfdf6],DX
1020:0468          c4bef4fd                       LES DI,[BP + 0xfdf4]
1020:046c          06                             PUSH ES
1020:046d          57                             PUSH DI
1020:046e          c47e08                         LES DI,[BP + 0x8]
1020:0471          06                             PUSH ES
1020:0472          57                             PUSH DI
1020:0473          6a2b                           PUSH 0x2b
1020:0475          9aee0c6810                     CALLF 0x1068:0cee
1020:047a          bfe802                         MOV DI,0x2e8
1020:047d          0e                             PUSH CS
1020:047e          57                             PUSH DI
1020:047f          c47e08                         LES DI,[BP + 0x8]
1020:0482          81c71e00                       ADD DI,0x1e
1020:0486          06                             PUSH ES
1020:0487          57                             PUSH DI
1020:0488          9a3c096810                     CALLF 0x1068:093c
1020:048d          8986fafe                       MOV word ptr [BP + 0xfefa],AX
1020:0491          c47e08                         LES DI,[BP + 0x8]
1020:0494          81c71e00                       ADD DI,0x1e
1020:0498          06                             PUSH ES
1020:0499          57                             PUSH DI
1020:049a          c47e08                         LES DI,[BP + 0x8]
1020:049d          81c71f00                       ADD DI,0x1f
1020:04a1          06                             PUSH ES
1020:04a2          57                             PUSH DI
1020:04a3          ffb6fafe                       PUSH word ptr [BP + 0xfefa]
1020:04a7          9aee0c6810                     CALLF 0x1068:0cee
1020:04ac          8a86fafe                       MOV AL,byte ptr [BP + 0xfefa]
1020:04b0          c47e08                         LES DI,[BP + 0x8]
1020:04b3          2688451e                       MOV byte ptr ES:[DI + 0x1e],AL
1020:04b7          8a86eefd                       MOV AL,byte ptr [BP + 0xfdee]
1020:04bb          d0e8                           SHR AL,0x1
1020:04bd          7207                           JC 0x1020:04c6
1020:04bf          31c0                           XOR AX,AX
1020:04c1          8946fc                         MOV word ptr [BP + -0x4],AX
1020:04c4          eb07                           JMP 0x1020:04cd
LAB_1020_04c6:
1020:04c6          8b86dcfd                       MOV AX,word ptr [BP + 0xfddc]
1020:04ca          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1020_04cd:
1020:04cd          8b46fc                         MOV AX,word ptr [BP + -0x4]
1020:04d0          89ec                           MOV SP,BP
1020:04d2          5d                             POP BP
1020:04d3          4d                             DEC BP
1020:04d4          ca0c00                         RETF 0xc
FUN_1020_04d7:
1020:04d7          45                             INC BP
1020:04d8          55                             PUSH BP
1020:04d9          89e5                           MOV BP,SP
1020:04db          1e                             PUSH DS
1020:04dc          b82e01                         MOV AX,0x12e
1020:04df          9acb036810                     CALLF 0x1068:03cb
1020:04e4          81ec2e01                       SUB SP,0x12e
1020:04e8          8cd3                           MOV BX,SS
1020:04ea          8ec3                           MOV BX,ES
1020:04ec          8cdb                           MOV BX,DS
1020:04ee          fc                             CLD
1020:04ef          8dbefcfe                       LEA DI,[BP + 0xfefc]
1020:04f3          c57606                         LDS SI,[BP + 0x6]
1020:04f6          ac                             LODSB SI
1020:04f7          aa                             STOSB ES:DI
1020:04f8          91                             XCHG AX,CX
1020:04f9          30ed                           XOR CH,CH
1020:04fb          f3a4                           MOVSB.REP ES:DI,SI
1020:04fd          8edb                           MOV BX,DS
1020:04ff          8dbefcfe                       LEA DI,[BP + 0xfefc]
1020:0503          16                             PUSH SS
1020:0504          57                             PUSH DI
1020:0505          6a3f                           PUSH 0x3f
1020:0507          8dbed0fe                       LEA DI,[BP + 0xfed0]
1020:050b          16                             PUSH SS
1020:050c          57                             PUSH DI
1020:050d          6a1f                           PUSH 0x1f
1020:050f          9aea022010                     CALLF 0x1020:02ea
1020:0514          09c0                           OR AX,AX
1020:0516          b000                           MOV AL,0x0
1020:0518          7501                           JNZ 0x1020:051b
1020:051a          40                             INC AX
LAB_1020_051b:
1020:051b          8846fd                         MOV byte ptr [BP + -0x3],AL
1020:051e          6a1f                           PUSH 0x1f
1020:0520          9a6b022010                     CALLF 0x1020:026b
1020:0525          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1020:0528          89ec                           MOV SP,BP
1020:052a          5d                             POP BP
1020:052b          4d                             DEC BP
1020:052c          ca0400                         RETF 0x4
FUN_1020_052f:
1020:052f          55                             PUSH BP
1020:0530          89e5                           MOV BP,SP
1020:0532          31c0                           XOR AX,AX
1020:0534          9acb036810                     CALLF 0x1068:03cb
1020:0539          31c0                           XOR AX,AX
1020:053b          a3189d                         MOV [0x9d18],AX
1020:053e          eb04                           JMP 0x1020:0544
LAB_1020_0540:
1020:0540          ff06189d                       INC word ptr [0x9d18]
LAB_1020_0544:
1020:0544          8b3e189d                       MOV DI,word ptr [0x9d18]
1020:0548          d1e7                           SHL DI,0x1
1020:054a          31c0                           XOR AX,AX
1020:054c          8985189c                       MOV word ptr [DI + 0x9c18],AX
1020:0550          833e189d1f                     CMP word ptr [0x9d18],0x1f
1020:0555          75e9                           JNZ 0x1020:0540
1020:0557          c9                             LEAVE
1020:0558          cb                             RETF
FUN_1028_0002:
1028:0002          55                             PUSH BP
1028:0003          89e5                           MOV BP,SP
1028:0005          83ec02                         SUB SP,0x2
1028:0008          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:000b          3b4604                         CMP AX,word ptr [BP + 0x4]
1028:000e          7d08                           JGE 0x1028:0018
1028:0010          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0013          8946fe                         MOV word ptr [BP + -0x2],AX
1028:0016          eb06                           JMP 0x1028:001e
LAB_1028_0018:
1028:0018          8b4604                         MOV AX,word ptr [BP + 0x4]
1028:001b          8946fe                         MOV word ptr [BP + -0x2],AX
LAB_1028_001e:
1028:001e          8b46fe                         MOV AX,word ptr [BP + -0x2]
1028:0021          89ec                           MOV SP,BP
1028:0023          5d                             POP BP
1028:0024          c20400                         RET 0x4
FUN_1028_0027:
1028:0027          55                             PUSH BP
1028:0028          89e5                           MOV BP,SP
1028:002a          83ec02                         SUB SP,0x2
1028:002d          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0030          3b4604                         CMP AX,word ptr [BP + 0x4]
1028:0033          7e08                           JLE 0x1028:003d
1028:0035          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0038          8946fe                         MOV word ptr [BP + -0x2],AX
1028:003b          eb06                           JMP 0x1028:0043
LAB_1028_003d:
1028:003d          8b4604                         MOV AX,word ptr [BP + 0x4]
1028:0040          8946fe                         MOV word ptr [BP + -0x2],AX
LAB_1028_0043:
1028:0043          8b46fe                         MOV AX,word ptr [BP + -0x2]
1028:0046          89ec                           MOV SP,BP
1028:0048          5d                             POP BP
1028:0049          c20400                         RET 0x4
FUN_1028_004c:
1028:004c          55                             PUSH BP
1028:004d          89e5                           MOV BP,SP
1028:004f          803e6f1700                     CMP byte ptr [0x176f],0x0
1028:0054          7413                           JZ 0x1028:0069
1028:0056          ff366617                       PUSH word ptr [0x1766]
1028:005a          bf829d                         MOV DI,0x9d82
1028:005d          1e                             PUSH DS
1028:005e          57                             PUSH DI
1028:005f          9a14015011                     CALLF 0x1150:0114
1028:0064          a3809d                         MOV [0x9d80],AX
1028:0067          eb0c                           JMP 0x1028:0075
LAB_1028_0069:
1028:0069          ff366617                       PUSH word ptr [0x1766]
1028:006d          9a44015011                     CALLF 0x1150:0144
1028:0072          a3809d                         MOV [0x9d80],AX
LAB_1028_0075:
1028:0075          ff36809d                       PUSH word ptr [0x9d80]
1028:0079          b81000                         MOV AX,0x10
1028:007c          50                             PUSH AX
1028:007d          9acc005011                     CALLF 0x1150:00cc
1028:0082          50                             PUSH AX
1028:0083          9ac0005011                     CALLF 0x1150:00c0
1028:0088          a3a29d                         MOV [0x9da2],AX
1028:008b          ff36809d                       PUSH word ptr [0x9d80]
1028:008f          b80800                         MOV AX,0x8
1028:0092          50                             PUSH AX
1028:0093          9acc015011                     CALLF 0x1150:01cc
1028:0098          52                             PUSH DX
1028:0099          50                             PUSH AX
1028:009a          9ab4005011                     CALLF 0x1150:00b4
1028:009f          ff36809d                       PUSH word ptr [0x9d80]
1028:00a3          b80500                         MOV AX,0x5
1028:00a6          50                             PUSH AX
1028:00a7          9acc015011                     CALLF 0x1150:01cc
1028:00ac          52                             PUSH DX
1028:00ad          50                             PUSH AX
1028:00ae          9ab0005011                     CALLF 0x1150:00b0
1028:00b3          5d                             POP BP
1028:00b4          c3                             RET
FUN_1028_00b5:
1028:00b5          55                             PUSH BP
1028:00b6          89e5                           MOV BP,SP
1028:00b8          ff36809d                       PUSH word ptr [0x9d80]
1028:00bc          ff36a29d                       PUSH word ptr [0x9da2]
1028:00c0          9ac0005011                     CALLF 0x1150:00c0
1028:00c5          803e6f1700                     CMP byte ptr [0x176f],0x0
1028:00ca          7410                           JZ 0x1028:00dc
1028:00cc          ff366617                       PUSH word ptr [0x1766]
1028:00d0          bf829d                         MOV DI,0x9d82
1028:00d3          1e                             PUSH DS
1028:00d4          57                             PUSH DI
1028:00d5          9a18015011                     CALLF 0x1150:0118
1028:00da          eb0d                           JMP 0x1028:00e9
LAB_1028_00dc:
1028:00dc          ff366617                       PUSH word ptr [0x1766]
1028:00e0          ff36809d                       PUSH word ptr [0x9d80]
1028:00e4          9a48015011                     CALLF 0x1150:0148
LAB_1028_00e9:
1028:00e9          5d                             POP BP
1028:00ea          c3                             RET
FUN_1028_00eb:
1028:00eb          55                             PUSH BP
1028:00ec          89e5                           MOV BP,SP
1028:00ee          ff366617                       PUSH word ptr [0x1766]
1028:00f2          31c0                           XOR AX,AX
1028:00f4          50                             PUSH AX
1028:00f5          ff367a9d                       PUSH word ptr [0x9d7a]
1028:00f9          b80200                         MOV AX,0x2
1028:00fc          50                             PUSH AX
1028:00fd          9aa8015011                     CALLF 0x1150:01a8
1028:0102          a12417                         MOV AX,[0x1724]
1028:0105          2b062817                       SUB AX,word ptr [0x1728]
1028:0109          f7267a9d                       MUL word ptr [0x9d7a]
1028:010d          50                             PUSH AX
1028:010e          a12617                         MOV AX,[0x1726]
1028:0111          2b062a17                       SUB AX,word ptr [0x172a]
1028:0115          f7267c9d                       MUL word ptr [0x9d7c]
1028:0119          03067e9d                       ADD AX,word ptr [0x9d7e]
1028:011d          50                             PUSH AX
1028:011e          9ab0015011                     CALLF 0x1150:01b0
1028:0123          ff366617                       PUSH word ptr [0x1766]
1028:0127          9ab4015011                     CALLF 0x1150:01b4
1028:012c          5d                             POP BP
1028:012d          c3                             RET
FUN_1028_012e:
1028:012e          55                             PUSH BP
1028:012f          89e5                           MOV BP,SP
1028:0131          9aac015011                     CALLF 0x1150:01ac
1028:0136          5d                             POP BP
1028:0137          c3                             RET
FUN_1028_0138:
1028:0138          55                             PUSH BP
1028:0139          89e5                           MOV BP,SP
1028:013b          ff366617                       PUSH word ptr [0x1766]
1028:013f          31c0                           XOR AX,AX
1028:0141          50                             PUSH AX
1028:0142          31c0                           XOR AX,AX
1028:0144          50                             PUSH AX
1028:0145          b80100                         MOV AX,0x1
1028:0148          50                             PUSH AX
1028:0149          ff36769d                       PUSH word ptr [0x9d76]
1028:014d          e8d7fe                         CALL 0x1028:0027
1028:0150          50                             PUSH AX
1028:0151          31c0                           XOR AX,AX
1028:0153          50                             PUSH AX
1028:0154          9a40015011                     CALLF 0x1150:0140
1028:0159          ff366617                       PUSH word ptr [0x1766]
1028:015d          31c0                           XOR AX,AX
1028:015f          50                             PUSH AX
1028:0160          ff362817                       PUSH word ptr [0x1728]
1028:0164          b80100                         MOV AX,0x1
1028:0167          50                             PUSH AX
1028:0168          9a3c015011                     CALLF 0x1150:013c
1028:016d          ff366617                       PUSH word ptr [0x1766]
1028:0171          b80100                         MOV AX,0x1
1028:0174          50                             PUSH AX
1028:0175          31c0                           XOR AX,AX
1028:0177          50                             PUSH AX
1028:0178          b80100                         MOV AX,0x1
1028:017b          50                             PUSH AX
1028:017c          ff36789d                       PUSH word ptr [0x9d78]
1028:0180          e8a4fe                         CALL 0x1028:0027
1028:0183          50                             PUSH AX
1028:0184          31c0                           XOR AX,AX
1028:0186          50                             PUSH AX
1028:0187          9a40015011                     CALLF 0x1150:0140
1028:018c          ff366617                       PUSH word ptr [0x1766]
1028:0190          b80100                         MOV AX,0x1
1028:0193          50                             PUSH AX
1028:0194          ff362a17                       PUSH word ptr [0x172a]
1028:0198          b80100                         MOV AX,0x1
1028:019b          50                             PUSH AX
1028:019c          9a3c015011                     CALLF 0x1150:013c
1028:01a1          5d                             POP BP
1028:01a2          c3                             RET
FUN_1028_01a3:
1028:01a3          55                             PUSH BP
1028:01a4          89e5                           MOV BP,SP
1028:01a6          803e6d1700                     CMP byte ptr [0x176d],0x0
1028:01ab          740a                           JZ 0x1028:01b7
1028:01ad          803e6e1700                     CMP byte ptr [0x176e],0x0
1028:01b2          7403                           JZ 0x1028:01b7
1028:01b4          e877ff                         CALL 0x1028:012e
LAB_1028_01b7:
1028:01b7          b8ff00                         MOV AX,0xff
1028:01ba          9a61006810                     CALLF 0x1068:0061
1028:01bf          5d                             POP BP
1028:01c0          c3                             RET
FUN_1028_01c1:
1028:01c1          45                             INC BP
1028:01c2          55                             PUSH BP
1028:01c3          89e5                           MOV BP,SP
1028:01c5          1e                             PUSH DS
1028:01c6          803e6c1700                     CMP byte ptr [0x176c],0x0
1028:01cb          7503                           JNZ 0x1028:01d0
1028:01cd          e9b300                         JMP 0x1028:0283
LAB_1028_01d0:
1028:01d0          31c0                           XOR AX,AX
1028:01d2          50                             PUSH AX
1028:01d3          ff7608                         PUSH word ptr [BP + 0x8]
1028:01d6          ff36769d                       PUSH word ptr [0x9d76]
1028:01da          e825fe                         CALL 0x1028:0002
1028:01dd          50                             PUSH AX
1028:01de          e846fe                         CALL 0x1028:0027
1028:01e1          894608                         MOV word ptr [BP + 0x8],AX
1028:01e4          31c0                           XOR AX,AX
1028:01e6          50                             PUSH AX
1028:01e7          ff7606                         PUSH word ptr [BP + 0x6]
1028:01ea          ff36789d                       PUSH word ptr [0x9d78]
1028:01ee          e811fe                         CALL 0x1028:0002
1028:01f1          50                             PUSH AX
1028:01f2          e832fe                         CALL 0x1028:0027
1028:01f5          894606                         MOV word ptr [BP + 0x6],AX
1028:01f8          8b4608                         MOV AX,word ptr [BP + 0x8]
1028:01fb          3b062817                       CMP AX,word ptr [0x1728]
1028:01ff          7509                           JNZ 0x1028:020a
1028:0201          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0204          3b062a17                       CMP AX,word ptr [0x172a]
1028:0208          7479                           JZ 0x1028:0283
LAB_1028_020a:
1028:020a          8b4608                         MOV AX,word ptr [BP + 0x8]
1028:020d          3b062817                       CMP AX,word ptr [0x1728]
1028:0211          7413                           JZ 0x1028:0226
1028:0213          ff366617                       PUSH word ptr [0x1766]
1028:0217          31c0                           XOR AX,AX
1028:0219          50                             PUSH AX
1028:021a          ff7608                         PUSH word ptr [BP + 0x8]
1028:021d          b80100                         MOV AX,0x1
1028:0220          50                             PUSH AX
1028:0221          9a3c015011                     CALLF 0x1150:013c
LAB_1028_0226:
1028:0226          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0229          3b062a17                       CMP AX,word ptr [0x172a]
1028:022d          7414                           JZ 0x1028:0243
1028:022f          ff366617                       PUSH word ptr [0x1766]
1028:0233          b80100                         MOV AX,0x1
1028:0236          50                             PUSH AX
1028:0237          ff7606                         PUSH word ptr [BP + 0x6]
1028:023a          b80100                         MOV AX,0x1
1028:023d          50                             PUSH AX
1028:023e          9a3c015011                     CALLF 0x1150:013c
LAB_1028_0243:
1028:0243          ff366617                       PUSH word ptr [0x1766]
1028:0247          a12817                         MOV AX,[0x1728]
1028:024a          2b4608                         SUB AX,word ptr [BP + 0x8]
1028:024d          f7267a9d                       MUL word ptr [0x9d7a]
1028:0251          50                             PUSH AX
1028:0252          a12a17                         MOV AX,[0x172a]
1028:0255          2b4606                         SUB AX,word ptr [BP + 0x6]
1028:0258          f7267c9d                       MUL word ptr [0x9d7c]
1028:025c          50                             PUSH AX
1028:025d          31c0                           XOR AX,AX
1028:025f          31d2                           XOR DX,DX
1028:0261          52                             PUSH DX
1028:0262          50                             PUSH AX
1028:0263          31c0                           XOR AX,AX
1028:0265          31d2                           XOR DX,DX
1028:0267          52                             PUSH DX
1028:0268          50                             PUSH AX
1028:0269          9a38015011                     CALLF 0x1150:0138
1028:026e          8b4608                         MOV AX,word ptr [BP + 0x8]
1028:0271          a32817                         MOV [0x1728],AX
1028:0274          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0277          a32a17                         MOV [0x172a],AX
1028:027a          ff366617                       PUSH word ptr [0x1766]
1028:027e          9a90015011                     CALLF 0x1150:0190
LAB_1028_0283:
1028:0283          89ec                           MOV SP,BP
1028:0285          5d                             POP BP
1028:0286          4d                             DEC BP
1028:0287          ca0400                         RETF 0x4
FUN_1028_028a:
1028:028a          45                             INC BP
1028:028b          55                             PUSH BP
1028:028c          89e5                           MOV BP,SP
1028:028e          1e                             PUSH DS
1028:028f          a12417                         MOV AX,[0x1724]
1028:0292          2b06729d                       SUB AX,word ptr [0x9d72]
1028:0296          40                             INC AX
1028:0297          50                             PUSH AX
1028:0298          ff362817                       PUSH word ptr [0x1728]
1028:029c          ff362417                       PUSH word ptr [0x1724]
1028:02a0          e85ffd                         CALL 0x1028:0002
1028:02a3          50                             PUSH AX
1028:02a4          e880fd                         CALL 0x1028:0027
1028:02a7          50                             PUSH AX
1028:02a8          a12617                         MOV AX,[0x1726]
1028:02ab          2b06749d                       SUB AX,word ptr [0x9d74]
1028:02af          40                             INC AX
1028:02b0          50                             PUSH AX
1028:02b1          ff362a17                       PUSH word ptr [0x172a]
1028:02b5          ff362617                       PUSH word ptr [0x1726]
1028:02b9          e846fd                         CALL 0x1028:0002
1028:02bc          50                             PUSH AX
1028:02bd          e867fd                         CALL 0x1028:0027
1028:02c0          50                             PUSH AX
1028:02c1          9ac1012810                     CALLF 0x1028:01c1
1028:02c6          89ec                           MOV SP,BP
1028:02c8          5d                             POP BP
1028:02c9          4d                             DEC BP
1028:02ca          cb                             RETF
FUN_1028_02cb:
1028:02cb          55                             PUSH BP
1028:02cc          89e5                           MOV BP,SP
1028:02ce          83ec04                         SUB SP,0x4
1028:02d1          a16817                         MOV AX,[0x1768]
1028:02d4          014604                         ADD word ptr [BP + 0x4],AX
1028:02d7          8b4604                         MOV AX,word ptr [BP + 0x4]
1028:02da          3b062217                       CMP AX,word ptr [0x1722]
1028:02de          7c06                           JL 0x1028:02e6
1028:02e0          a12217                         MOV AX,[0x1722]
1028:02e3          294604                         SUB word ptr [BP + 0x4],AX
LAB_1028_02e6:
1028:02e6          8b4604                         MOV AX,word ptr [BP + 0x4]
1028:02e9          f7262017                       MUL word ptr [0x1720]
1028:02ed          034606                         ADD AX,word ptr [BP + 0x6]
1028:02f0          c43e6e9d                       LES DI,[0x9d6e]
1028:02f4          03f8                           ADD DI,AX
1028:02f6          89f8                           MOV AX,DI
1028:02f8          8cc2                           MOV DX,ES
1028:02fa          8946fc                         MOV word ptr [BP + -0x4],AX
1028:02fd          8956fe                         MOV word ptr [BP + -0x2],DX
1028:0300          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:0303          8b56fe                         MOV DX,word ptr [BP + -0x2]
1028:0306          89ec                           MOV SP,BP
1028:0308          5d                             POP BP
1028:0309          c20400                         RET 0x4
FUN_1028_030c:
1028:030c          55                             PUSH BP
1028:030d          89e5                           MOV BP,SP
1028:030f          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0312          3b4604                         CMP AX,word ptr [BP + 0x4]
1028:0315          7d3a                           JGE 0x1028:0351
1028:0317          e832fd                         CALL 0x1028:004c
1028:031a          ff36809d                       PUSH word ptr [0x9d80]
1028:031e          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0321          2b062817                       SUB AX,word ptr [0x1728]
1028:0325          f7267a9d                       MUL word ptr [0x9d7a]
1028:0329          50                             PUSH AX
1028:032a          a12617                         MOV AX,[0x1726]
1028:032d          2b062a17                       SUB AX,word ptr [0x172a]
1028:0331          f7267c9d                       MUL word ptr [0x9d7c]
1028:0335          50                             PUSH AX
1028:0336          ff7606                         PUSH word ptr [BP + 0x6]
1028:0339          ff362617                       PUSH word ptr [0x1726]
1028:033d          e88bff                         CALL 0x1028:02cb
1028:0340          52                             PUSH DX
1028:0341          50                             PUSH AX
1028:0342          8b4604                         MOV AX,word ptr [BP + 0x4]
1028:0345          2b4606                         SUB AX,word ptr [BP + 0x6]
1028:0348          50                             PUSH AX
1028:0349          9ab8005011                     CALLF 0x1150:00b8
1028:034e          e864fd                         CALL 0x1028:00b5
LAB_1028_0351:
1028:0351          5d                             POP BP
1028:0352          c20400                         RET 0x4
FUN_1028_0355:
1028:0355          55                             PUSH BP
1028:0356          89e5                           MOV BP,SP
1028:0358          8b7e04                         MOV DI,word ptr [BP + 0x4]
1028:035b          36ff75fc                       PUSH word ptr SS:[DI + -0x4]
1028:035f          36ff75fa                       PUSH word ptr SS:[DI + -0x6]
1028:0363          e8a6ff                         CALL 0x1028:030c
1028:0366          8b7e04                         MOV DI,word ptr [BP + 0x4]
1028:0369          31c0                           XOR AX,AX
1028:036b          368945fc                       MOV word ptr SS:[DI + -0x4],AX
1028:036f          31c0                           XOR AX,AX
1028:0371          368945fa                       MOV word ptr SS:[DI + -0x6],AX
1028:0375          31c0                           XOR AX,AX
1028:0377          a32417                         MOV [0x1724],AX
1028:037a          ff062617                       INC word ptr [0x1726]
1028:037e          a12617                         MOV AX,[0x1726]
1028:0381          3b062217                       CMP AX,word ptr [0x1722]
1028:0385          7559                           JNZ 0x1028:03e0
1028:0387          ff0e2617                       DEC word ptr [0x1726]
1028:038b          ff066817                       INC word ptr [0x1768]
1028:038f          a16817                         MOV AX,[0x1768]
1028:0392          3b062217                       CMP AX,word ptr [0x1722]
1028:0396          7505                           JNZ 0x1028:039d
1028:0398          31c0                           XOR AX,AX
1028:039a          a36817                         MOV [0x1768],AX
LAB_1028_039d:
1028:039d          31c0                           XOR AX,AX
1028:039f          50                             PUSH AX
1028:03a0          ff362617                       PUSH word ptr [0x1726]
1028:03a4          e824ff                         CALL 0x1028:02cb
1028:03a7          89c7                           MOV DI,AX
1028:03a9          8ec2                           MOV DX,ES
1028:03ab          06                             PUSH ES
1028:03ac          57                             PUSH DI
1028:03ad          ff362017                       PUSH word ptr [0x1720]
1028:03b1          b020                           MOV AL,0x20
1028:03b3          50                             PUSH AX
1028:03b4          9a120d6810                     CALLF 0x1068:0d12
1028:03b9          ff366617                       PUSH word ptr [0x1766]
1028:03bd          31c0                           XOR AX,AX
1028:03bf          50                             PUSH AX
1028:03c0          a17c9d                         MOV AX,[0x9d7c]
1028:03c3          f7d8                           NEG AX
1028:03c5          50                             PUSH AX
1028:03c6          31c0                           XOR AX,AX
1028:03c8          31d2                           XOR DX,DX
1028:03ca          52                             PUSH DX
1028:03cb          50                             PUSH AX
1028:03cc          31c0                           XOR AX,AX
1028:03ce          31d2                           XOR DX,DX
1028:03d0          52                             PUSH DX
1028:03d1          50                             PUSH AX
1028:03d2          9a38015011                     CALLF 0x1150:0138
1028:03d7          ff366617                       PUSH word ptr [0x1766]
1028:03db          9a90015011                     CALLF 0x1150:0190
LAB_1028_03e0:
1028:03e0          5d                             POP BP
1028:03e1          c20200                         RET 0x2
FUN_1028_03e4:
1028:03e4          45                             INC BP
1028:03e5          55                             PUSH BP
1028:03e6          89e5                           MOV BP,SP
1028:03e8          1e                             PUSH DS
1028:03e9          83ec04                         SUB SP,0x4
1028:03ec          9a150d2810                     CALLF 0x1028:0d15
1028:03f1          a12417                         MOV AX,[0x1724]
1028:03f4          8946fc                         MOV word ptr [BP + -0x4],AX
1028:03f7          a12417                         MOV AX,[0x1724]
1028:03fa          8946fa                         MOV word ptr [BP + -0x6],AX
LAB_1028_03fd:
1028:03fd          837e0600                       CMP word ptr [BP + 0x6],0x0
1028:0401          7703                           JA 0x1028:0406
1028:0403          e99a00                         JMP 0x1028:04a0
LAB_1028_0406:
1028:0406          c47e08                         LES DI,[BP + 0x8]
1028:0409          268a05                         MOV AL,byte ptr ES:[DI]
1028:040c          3c20                           CMP AL,0x20
1028:040e          723f                           JC 0x1028:044f
1028:0410          3cff                           CMP AL,0xff
1028:0412          773b                           JA 0x1028:044f
1028:0414          c47e08                         LES DI,[BP + 0x8]
1028:0417          268a05                         MOV AL,byte ptr ES:[DI]
1028:041a          50                             PUSH AX
1028:041b          ff362417                       PUSH word ptr [0x1724]
1028:041f          ff362617                       PUSH word ptr [0x1726]
1028:0423          e8a5fe                         CALL 0x1028:02cb
1028:0426          89c7                           MOV DI,AX
1028:0428          8ec2                           MOV DX,ES
1028:042a          58                             POP AX
1028:042b          268805                         MOV byte ptr ES:[DI],AL
1028:042e          ff062417                       INC word ptr [0x1724]
1028:0432          a12417                         MOV AX,[0x1724]
1028:0435          3b46fa                         CMP AX,word ptr [BP + -0x6]
1028:0438          7e06                           JLE 0x1028:0440
1028:043a          a12417                         MOV AX,[0x1724]
1028:043d          8946fa                         MOV word ptr [BP + -0x6],AX
LAB_1028_0440:
1028:0440          a12417                         MOV AX,[0x1724]
1028:0443          3b062017                       CMP AX,word ptr [0x1720]
1028:0447          7504                           JNZ 0x1028:044d
1028:0449          55                             PUSH BP
1028:044a          e808ff                         CALL 0x1028:0355
LAB_1028_044d:
1028:044d          eb48                           JMP 0x1028:0497
LAB_1028_044f:
1028:044f          3c0d                           CMP AL,0xd
1028:0451          7506                           JNZ 0x1028:0459
1028:0453          55                             PUSH BP
1028:0454          e8fefe                         CALL 0x1028:0355
1028:0457          eb3e                           JMP 0x1028:0497
LAB_1028_0459:
1028:0459          3c08                           CMP AL,0x8
1028:045b          752e                           JNZ 0x1028:048b
1028:045d          833e241700                     CMP word ptr [0x1724],0x0
1028:0462          7e25                           JLE 0x1028:0489
1028:0464          ff0e2417                       DEC word ptr [0x1724]
1028:0468          ff362417                       PUSH word ptr [0x1724]
1028:046c          ff362617                       PUSH word ptr [0x1726]
1028:0470          e858fe                         CALL 0x1028:02cb
1028:0473          89c7                           MOV DI,AX
1028:0475          8ec2                           MOV DX,ES
1028:0477          26c60520                       MOV byte ptr ES:[DI],0x20
1028:047b          a12417                         MOV AX,[0x1724]
1028:047e          3b46fc                         CMP AX,word ptr [BP + -0x4]
1028:0481          7d06                           JGE 0x1028:0489
1028:0483          a12417                         MOV AX,[0x1724]
1028:0486          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1028_0489:
1028:0489          eb0c                           JMP 0x1028:0497
LAB_1028_048b:
1028:048b          3c07                           CMP AL,0x7
1028:048d          7508                           JNZ 0x1028:0497
1028:048f          31c0                           XOR AX,AX
1028:0491          50                             PUSH AX
1028:0492          9a68015011                     CALLF 0x1150:0168
LAB_1028_0497:
1028:0497          ff4608                         INC word ptr [BP + 0x8]
1028:049a          ff4e06                         DEC word ptr [BP + 0x6]
1028:049d          e95dff                         JMP 0x1028:03fd
LAB_1028_04a0:
1028:04a0          ff76fc                         PUSH word ptr [BP + -0x4]
1028:04a3          ff76fa                         PUSH word ptr [BP + -0x6]
1028:04a6          e863fe                         CALL 0x1028:030c
1028:04a9          803e3e1700                     CMP byte ptr [0x173e],0x0
1028:04ae          7405                           JZ 0x1028:04b5
1028:04b0          9a8a022810                     CALLF 0x1028:028a
LAB_1028_04b5:
1028:04b5          89ec                           MOV SP,BP
1028:04b7          5d                             POP BP
1028:04b8          4d                             DEC BP
1028:04b9          ca0600                         RETF 0x6
FUN_1028_04bc:
1028:04bc          45                             INC BP
1028:04bd          55                             PUSH BP
1028:04be          89e5                           MOV BP,SP
1028:04c0          1e                             PUSH DS
1028:04c1          8d7e06                         LEA DI,[BP + 0x6]
1028:04c4          16                             PUSH SS
1028:04c5          57                             PUSH DI
1028:04c6          b80100                         MOV AX,0x1
1028:04c9          50                             PUSH AX
1028:04ca          9ae4032810                     CALLF 0x1028:03e4
1028:04cf          89ec                           MOV SP,BP
1028:04d1          5d                             POP BP
1028:04d2          4d                             DEC BP
1028:04d3          ca0200                         RETF 0x2
FUN_1028_04d6:
1028:04d6          45                             INC BP
1028:04d7          55                             PUSH BP
1028:04d8          89e5                           MOV BP,SP
1028:04da          1e                             PUSH DS
1028:04db          83ec14                         SUB SP,0x14
1028:04de          9a150d2810                     CALLF 0x1028:0d15
LAB_1028_04e3:
1028:04e3          8d7eea                         LEA DI,[BP + -0x16]
1028:04e6          16                             PUSH SS
1028:04e7          57                             PUSH DI
1028:04e8          31c0                           XOR AX,AX
1028:04ea          50                             PUSH AX
1028:04eb          31c0                           XOR AX,AX
1028:04ed          50                             PUSH AX
1028:04ee          31c0                           XOR AX,AX
1028:04f0          50                             PUSH AX
1028:04f1          b80100                         MOV AX,0x1
1028:04f4          50                             PUSH AX
1028:04f5          9a78015011                     CALLF 0x1150:0178
1028:04fa          09c0                           OR AX,AX
1028:04fc          741f                           JZ 0x1028:051d
1028:04fe          837eec12                       CMP word ptr [BP + -0x14],0x12
1028:0502          7503                           JNZ 0x1028:0507
1028:0504          e89cfc                         CALL 0x1028:01a3
LAB_1028_0507:
1028:0507          8d7eea                         LEA DI,[BP + -0x16]
1028:050a          16                             PUSH SS
1028:050b          57                             PUSH DI
1028:050c          9a84015011                     CALLF 0x1150:0184
1028:0511          8d7eea                         LEA DI,[BP + -0x16]
1028:0514          16                             PUSH SS
1028:0515          57                             PUSH DI
1028:0516          9a88015011                     CALLF 0x1150:0188
1028:051b          ebc6                           JMP 0x1028:04e3
LAB_1028_051d:
1028:051d          833e6a1700                     CMP word ptr [0x176a],0x0
1028:0522          b000                           MOV AL,0x0
1028:0524          7e01                           JLE 0x1028:0527
1028:0526          40                             INC AX
LAB_1028_0527:
1028:0527          8846fd                         MOV byte ptr [BP + -0x3],AL
1028:052a          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1028:052d          89ec                           MOV SP,BP
1028:052f          5d                             POP BP
1028:0530          4d                             DEC BP
1028:0531          cb                             RETF
FUN_1028_0532:
1028:0532          45                             INC BP
1028:0533          55                             PUSH BP
1028:0534          89e5                           MOV BP,SP
1028:0536          1e                             PUSH DS
1028:0537          83ec02                         SUB SP,0x2
1028:053a          9a8a022810                     CALLF 0x1028:028a
1028:053f          9ad6042810                     CALLF 0x1028:04d6
1028:0544          08c0                           OR AL,AL
1028:0546          752c                           JNZ 0x1028:0574
1028:0548          c6066e1701                     MOV byte ptr [0x176e],0x1
1028:054d          803e6d1700                     CMP byte ptr [0x176d],0x0
1028:0552          7403                           JZ 0x1028:0557
1028:0554          e894fb                         CALL 0x1028:00eb
LAB_1028_0557:
1028:0557          9a80015011                     CALLF 0x1150:0180
1028:055c          9ad6042810                     CALLF 0x1028:04d6
1028:0561          08c0                           OR AL,AL
1028:0563          74f2                           JZ 0x1028:0557
1028:0565          803e6d1700                     CMP byte ptr [0x176d],0x0
1028:056a          7403                           JZ 0x1028:056f
1028:056c          e8bffb                         CALL 0x1028:012e
LAB_1028_056f:
1028:056f          c6066e1700                     MOV byte ptr [0x176e],0x0
LAB_1028_0574:
1028:0574          a0a49d                         MOV AL,[0x9da4]
1028:0577          8846fd                         MOV byte ptr [BP + -0x3],AL
1028:057a          ff0e6a17                       DEC word ptr [0x176a]
1028:057e          bfa59d                         MOV DI,0x9da5
1028:0581          1e                             PUSH DS
1028:0582          57                             PUSH DI
1028:0583          bfa49d                         MOV DI,0x9da4
1028:0586          1e                             PUSH DS
1028:0587          57                             PUSH DI
1028:0588          ff366a17                       PUSH word ptr [0x176a]
1028:058c          9aee0c6810                     CALLF 0x1068:0cee
1028:0591          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1028:0594          89ec                           MOV SP,BP
1028:0596          5d                             POP BP
1028:0597          4d                             DEC BP
1028:0598          cb                             RETF
FUN_1028_0599:
1028:0599          45                             INC BP
1028:059a          55                             PUSH BP
1028:059b          89e5                           MOV BP,SP
1028:059d          1e                             PUSH DS
1028:059e          83ec06                         SUB SP,0x6
1028:05a1          31c0                           XOR AX,AX
1028:05a3          8946f8                         MOV word ptr [BP + -0x8],AX
LAB_1028_05a6:
1028:05a6          9a32052810                     CALLF 0x1028:0532
1028:05ab          8846fb                         MOV byte ptr [BP + -0x5],AL
1028:05ae          8a46fb                         MOV AL,byte ptr [BP + -0x5]
1028:05b1          3c08                           CMP AL,0x8
1028:05b3          7513                           JNZ 0x1028:05c8
1028:05b5          837ef800                       CMP word ptr [BP + -0x8],0x0
1028:05b9          760b                           JBE 0x1028:05c6
1028:05bb          ff4ef8                         DEC word ptr [BP + -0x8]
1028:05be          b008                           MOV AL,0x8
1028:05c0          50                             PUSH AX
1028:05c1          9abc042810                     CALLF 0x1028:04bc
LAB_1028_05c6:
1028:05c6          eb2c                           JMP 0x1028:05f4
LAB_1028_05c8:
1028:05c8          3c20                           CMP AL,0x20
1028:05ca          7228                           JC 0x1028:05f4
1028:05cc          3cff                           CMP AL,0xff
1028:05ce          7724                           JA 0x1028:05f4
1028:05d0          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:05d3          48                             DEC AX
1028:05d4          48                             DEC AX
1028:05d5          3b46f8                         CMP AX,word ptr [BP + -0x8]
1028:05d8          761a                           JBE 0x1028:05f4
1028:05da          8a56fb                         MOV DL,byte ptr [BP + -0x5]
1028:05dd          8b46f8                         MOV AX,word ptr [BP + -0x8]
1028:05e0          c47e08                         LES DI,[BP + 0x8]
1028:05e3          03f8                           ADD DI,AX
1028:05e5          268815                         MOV byte ptr ES:[DI],DL
1028:05e8          ff46f8                         INC word ptr [BP + -0x8]
1028:05eb          8a46fb                         MOV AL,byte ptr [BP + -0x5]
1028:05ee          50                             PUSH AX
1028:05ef          9abc042810                     CALLF 0x1028:04bc
LAB_1028_05f4:
1028:05f4          807efb0d                       CMP byte ptr [BP + -0x5],0xd
1028:05f8          740d                           JZ 0x1028:0607
1028:05fa          803e3f1700                     CMP byte ptr [0x173f],0x0
1028:05ff          74a5                           JZ 0x1028:05a6
1028:0601          807efb1a                       CMP byte ptr [BP + -0x5],0x1a
1028:0605          759f                           JNZ 0x1028:05a6
LAB_1028_0607:
1028:0607          8a56fb                         MOV DL,byte ptr [BP + -0x5]
1028:060a          8b46f8                         MOV AX,word ptr [BP + -0x8]
1028:060d          c47e08                         LES DI,[BP + 0x8]
1028:0610          03f8                           ADD DI,AX
1028:0612          268815                         MOV byte ptr ES:[DI],DL
1028:0615          ff46f8                         INC word ptr [BP + -0x8]
1028:0618          807efb0d                       CMP byte ptr [BP + -0x5],0xd
1028:061c          7517                           JNZ 0x1028:0635
1028:061e          8b46f8                         MOV AX,word ptr [BP + -0x8]
1028:0621          c47e08                         LES DI,[BP + 0x8]
1028:0624          03f8                           ADD DI,AX
1028:0626          26c6050a                       MOV byte ptr ES:[DI],0xa
1028:062a          ff46f8                         INC word ptr [BP + -0x8]
1028:062d          b00d                           MOV AL,0xd
1028:062f          50                             PUSH AX
1028:0630          9abc042810                     CALLF 0x1028:04bc
LAB_1028_0635:
1028:0635          9a8a022810                     CALLF 0x1028:028a
1028:063a          8b46f8                         MOV AX,word ptr [BP + -0x8]
1028:063d          8946fc                         MOV word ptr [BP + -0x4],AX
1028:0640          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:0643          89ec                           MOV SP,BP
1028:0645          5d                             POP BP
1028:0646          4d                             DEC BP
1028:0647          ca0600                         RETF 0x6
FUN_1028_064a:
1028:064a          55                             PUSH BP
1028:064b          89e5                           MOV BP,SP
1028:064d          c6066c1701                     MOV byte ptr [0x176c],0x1
1028:0652          a12017                         MOV AX,[0x1720]
1028:0655          f7262217                       MUL word ptr [0x1722]
1028:0659          50                             PUSH AX
1028:065a          9a2d016810                     CALLF 0x1068:012d
1028:065f          a36e9d                         MOV [0x9d6e],AX
1028:0662          8916709d                       MOV word ptr [0x9d70],DX
1028:0666          c43e6e9d                       LES DI,[0x9d6e]
1028:066a          06                             PUSH ES
1028:066b          57                             PUSH DI
1028:066c          a12017                         MOV AX,[0x1720]
1028:066f          f7262217                       MUL word ptr [0x1722]
1028:0673          50                             PUSH AX
1028:0674          b020                           MOV AL,0x20
1028:0676          50                             PUSH AX
1028:0677          9a120d6810                     CALLF 0x1068:0d12
1028:067c          803e401700                     CMP byte ptr [0x1740],0x0
1028:0681          751a                           JNZ 0x1028:069d
1028:0683          ff366617                       PUSH word ptr [0x1766]
1028:0687          31c0                           XOR AX,AX
1028:0689          50                             PUSH AX
1028:068a          9aa4015011                     CALLF 0x1150:01a4
1028:068f          50                             PUSH AX
1028:0690          b860f0                         MOV AX,0xf060
1028:0693          50                             PUSH AX
1028:0694          b80300                         MOV AX,0x3
1028:0697          50                             PUSH AX
1028:0698          9aa0015011                     CALLF 0x1150:01a0
LAB_1028_069d:
1028:069d          5d                             POP BP
1028:069e          c3                             RET
FUN_1028_069f:
1028:069f          55                             PUSH BP
1028:06a0          89e5                           MOV BP,SP
1028:06a2          83ec08                         SUB SP,0x8
1028:06a5          c6066f1701                     MOV byte ptr [0x176f],0x1
1028:06aa          e89ff9                         CALL 0x1028:004c
1028:06ad          31c0                           XOR AX,AX
1028:06af          50                             PUSH AX
1028:06b0          a1869d                         MOV AX,[0x9d86]
1028:06b3          99                             CWD
1028:06b4          f73e7a9d                       IDIV word ptr [0x9d7a]
1028:06b8          03062817                       ADD AX,word ptr [0x1728]
1028:06bc          50                             PUSH AX
1028:06bd          e867f9                         CALL 0x1028:0027
1028:06c0          8946fe                         MOV word ptr [BP + -0x2],AX
1028:06c3          ff362017                       PUSH word ptr [0x1720]
1028:06c7          a18a9d                         MOV AX,[0x9d8a]
1028:06ca          03067a9d                       ADD AX,word ptr [0x9d7a]
1028:06ce          48                             DEC AX
1028:06cf          99                             CWD
1028:06d0          f73e7a9d                       IDIV word ptr [0x9d7a]
1028:06d4          03062817                       ADD AX,word ptr [0x1728]
1028:06d8          50                             PUSH AX
1028:06d9          e826f9                         CALL 0x1028:0002
1028:06dc          8946fc                         MOV word ptr [BP + -0x4],AX
1028:06df          31c0                           XOR AX,AX
1028:06e1          50                             PUSH AX
1028:06e2          a1889d                         MOV AX,[0x9d88]
1028:06e5          99                             CWD
1028:06e6          f73e7c9d                       IDIV word ptr [0x9d7c]
1028:06ea          03062a17                       ADD AX,word ptr [0x172a]
1028:06ee          50                             PUSH AX
1028:06ef          e835f9                         CALL 0x1028:0027
1028:06f2          8946fa                         MOV word ptr [BP + -0x6],AX
1028:06f5          ff362217                       PUSH word ptr [0x1722]
1028:06f9          a18c9d                         MOV AX,[0x9d8c]
1028:06fc          03067c9d                       ADD AX,word ptr [0x9d7c]
1028:0700          48                             DEC AX
1028:0701          99                             CWD
1028:0702          f73e7c9d                       IDIV word ptr [0x9d7c]
1028:0706          03062a17                       ADD AX,word ptr [0x172a]
1028:070a          50                             PUSH AX
1028:070b          e8f4f8                         CALL 0x1028:0002
1028:070e          8946f8                         MOV word ptr [BP + -0x8],AX
LAB_1028_0711:
1028:0711          8b46fa                         MOV AX,word ptr [BP + -0x6]
1028:0714          3b46f8                         CMP AX,word ptr [BP + -0x8]
1028:0717          7d38                           JGE 0x1028:0751
1028:0719          ff36809d                       PUSH word ptr [0x9d80]
1028:071d          8b46fe                         MOV AX,word ptr [BP + -0x2]
1028:0720          2b062817                       SUB AX,word ptr [0x1728]
1028:0724          f7267a9d                       MUL word ptr [0x9d7a]
1028:0728          50                             PUSH AX
1028:0729          8b46fa                         MOV AX,word ptr [BP + -0x6]
1028:072c          2b062a17                       SUB AX,word ptr [0x172a]
1028:0730          f7267c9d                       MUL word ptr [0x9d7c]
1028:0734          50                             PUSH AX
1028:0735          ff76fe                         PUSH word ptr [BP + -0x2]
1028:0738          ff76fa                         PUSH word ptr [BP + -0x6]
1028:073b          e88dfb                         CALL 0x1028:02cb
1028:073e          52                             PUSH DX
1028:073f          50                             PUSH AX
1028:0740          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:0743          2b46fe                         SUB AX,word ptr [BP + -0x2]
1028:0746          50                             PUSH AX
1028:0747          9ab8005011                     CALLF 0x1150:00b8
1028:074c          ff46fa                         INC word ptr [BP + -0x6]
1028:074f          ebc0                           JMP 0x1028:0711
LAB_1028_0751:
1028:0751          e861f9                         CALL 0x1028:00b5
1028:0754          c6066f1700                     MOV byte ptr [0x176f],0x0
1028:0759          89ec                           MOV SP,BP
1028:075b          5d                             POP BP
1028:075c          c3                             RET
FUN_1028_075d:
1028:075d          55                             PUSH BP
1028:075e          89e5                           MOV BP,SP
1028:0760          83ec02                         SUB SP,0x2
1028:0763          8b7e04                         MOV DI,word ptr [BP + 0x4]
1028:0766          368b4506                       MOV AX,word ptr SS:[DI + 0x6]
1028:076a          3d0000                         CMP AX,0x0
1028:076d          7509                           JNZ 0x1028:0778
1028:076f          8b460a                         MOV AX,word ptr [BP + 0xa]
1028:0772          48                             DEC AX
1028:0773          8946fe                         MOV word ptr [BP + -0x2],AX
1028:0776          eb5e                           JMP 0x1028:07d6
LAB_1028_0778:
1028:0778          3d0100                         CMP AX,0x1
1028:077b          7509                           JNZ 0x1028:0786
1028:077d          8b460a                         MOV AX,word ptr [BP + 0xa]
1028:0780          40                             INC AX
1028:0781          8946fe                         MOV word ptr [BP + -0x2],AX
1028:0784          eb50                           JMP 0x1028:07d6
LAB_1028_0786:
1028:0786          3d0200                         CMP AX,0x2
1028:0789          750b                           JNZ 0x1028:0796
1028:078b          8b460a                         MOV AX,word ptr [BP + 0xa]
1028:078e          2b4608                         SUB AX,word ptr [BP + 0x8]
1028:0791          8946fe                         MOV word ptr [BP + -0x2],AX
1028:0794          eb40                           JMP 0x1028:07d6
LAB_1028_0796:
1028:0796          3d0300                         CMP AX,0x3
1028:0799          750b                           JNZ 0x1028:07a6
1028:079b          8b460a                         MOV AX,word ptr [BP + 0xa]
1028:079e          034608                         ADD AX,word ptr [BP + 0x8]
1028:07a1          8946fe                         MOV word ptr [BP + -0x2],AX
1028:07a4          eb30                           JMP 0x1028:07d6
LAB_1028_07a6:
1028:07a6          3d0600                         CMP AX,0x6
1028:07a9          7507                           JNZ 0x1028:07b2
1028:07ab          31c0                           XOR AX,AX
1028:07ad          8946fe                         MOV word ptr [BP + -0x2],AX
1028:07b0          eb24                           JMP 0x1028:07d6
LAB_1028_07b2:
1028:07b2          3d0700                         CMP AX,0x7
1028:07b5          7508                           JNZ 0x1028:07bf
1028:07b7          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:07ba          8946fe                         MOV word ptr [BP + -0x2],AX
1028:07bd          eb17                           JMP 0x1028:07d6
LAB_1028_07bf:
1028:07bf          3d0400                         CMP AX,0x4
1028:07c2          750c                           JNZ 0x1028:07d0
1028:07c4          8b7e04                         MOV DI,word ptr [BP + 0x4]
1028:07c7          368b4504                       MOV AX,word ptr SS:[DI + 0x4]
1028:07cb          8946fe                         MOV word ptr [BP + -0x2],AX
1028:07ce          eb06                           JMP 0x1028:07d6
LAB_1028_07d0:
1028:07d0          8b460a                         MOV AX,word ptr [BP + 0xa]
1028:07d3          8946fe                         MOV word ptr [BP + -0x2],AX
LAB_1028_07d6:
1028:07d6          8b46fe                         MOV AX,word ptr [BP + -0x2]
1028:07d9          89ec                           MOV SP,BP
1028:07db          5d                             POP BP
1028:07dc          c20800                         RET 0x8
FUN_1028_07df:
1028:07df          55                             PUSH BP
1028:07e0          89e5                           MOV BP,SP
1028:07e2          83ec04                         SUB SP,0x4
1028:07e5          a12817                         MOV AX,[0x1728]
1028:07e8          8946fe                         MOV word ptr [BP + -0x2],AX
1028:07eb          a12a17                         MOV AX,[0x172a]
1028:07ee          8946fc                         MOV word ptr [BP + -0x4],AX
1028:07f1          8b4608                         MOV AX,word ptr [BP + 0x8]
1028:07f4          3d0000                         CMP AX,0x0
1028:07f7          751a                           JNZ 0x1028:0813
1028:07f9          ff76fe                         PUSH word ptr [BP + -0x2]
1028:07fc          a1729d                         MOV AX,[0x9d72]
1028:07ff          99                             CWD
1028:0800          b90200                         MOV CX,0x2
1028:0803          f7f9                           IDIV CX
1028:0805          50                             PUSH AX
1028:0806          ff36769d                       PUSH word ptr [0x9d76]
1028:080a          55                             PUSH BP
1028:080b          e84fff                         CALL 0x1028:075d
1028:080e          8946fe                         MOV word ptr [BP + -0x2],AX
1028:0811          eb17                           JMP 0x1028:082a
LAB_1028_0813:
1028:0813          3d0100                         CMP AX,0x1
1028:0816          7512                           JNZ 0x1028:082a
1028:0818          ff76fc                         PUSH word ptr [BP + -0x4]
1028:081b          ff36749d                       PUSH word ptr [0x9d74]
1028:081f          ff36789d                       PUSH word ptr [0x9d78]
1028:0823          55                             PUSH BP
1028:0824          e836ff                         CALL 0x1028:075d
1028:0827          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1028_082a:
1028:082a          ff76fe                         PUSH word ptr [BP + -0x2]
1028:082d          ff76fc                         PUSH word ptr [BP + -0x4]
1028:0830          9ac1012810                     CALLF 0x1028:01c1
1028:0835          89ec                           MOV SP,BP
1028:0837          5d                             POP BP
1028:0838          c20600                         RET 0x6
FUN_1028_083b:
1028:083b          55                             PUSH BP
1028:083c          89e5                           MOV BP,SP
1028:083e          803e6d1700                     CMP byte ptr [0x176d],0x0
1028:0843          740a                           JZ 0x1028:084f
1028:0845          803e6e1700                     CMP byte ptr [0x176e],0x0
1028:084a          7403                           JZ 0x1028:084f
1028:084c          e8dff8                         CALL 0x1028:012e
LAB_1028_084f:
1028:084f          8b4606                         MOV AX,word ptr [BP + 0x6]
1028:0852          99                             CWD
1028:0853          f73e7a9d                       IDIV word ptr [0x9d7a]
1028:0857          a3729d                         MOV [0x9d72],AX
1028:085a          8b4604                         MOV AX,word ptr [BP + 0x4]
1028:085d          99                             CWD
1028:085e          f73e7c9d                       IDIV word ptr [0x9d7c]
1028:0862          a3749d                         MOV [0x9d74],AX
1028:0865          31c0                           XOR AX,AX
1028:0867          50                             PUSH AX
1028:0868          a12017                         MOV AX,[0x1720]
1028:086b          2b06729d                       SUB AX,word ptr [0x9d72]
1028:086f          50                             PUSH AX
1028:0870          e8b4f7                         CALL 0x1028:0027
1028:0873          a3769d                         MOV [0x9d76],AX
1028:0876          31c0                           XOR AX,AX
1028:0878          50                             PUSH AX
1028:0879          a12217                         MOV AX,[0x1722]
1028:087c          2b06749d                       SUB AX,word ptr [0x9d74]
1028:0880          50                             PUSH AX
1028:0881          e8a3f7                         CALL 0x1028:0027
1028:0884          a3789d                         MOV [0x9d78],AX
1028:0887          ff362817                       PUSH word ptr [0x1728]
1028:088b          ff36769d                       PUSH word ptr [0x9d76]
1028:088f          e870f7                         CALL 0x1028:0002
1028:0892          a32817                         MOV [0x1728],AX
1028:0895          ff362a17                       PUSH word ptr [0x172a]
1028:0899          ff36789d                       PUSH word ptr [0x9d78]
1028:089d          e862f7                         CALL 0x1028:0002
1028:08a0          a32a17                         MOV [0x172a],AX
1028:08a3          e892f8                         CALL 0x1028:0138
1028:08a6          803e6d1700                     CMP byte ptr [0x176d],0x0
1028:08ab          740a                           JZ 0x1028:08b7
1028:08ad          803e6e1700                     CMP byte ptr [0x176e],0x0
1028:08b2          7403                           JZ 0x1028:08b7
1028:08b4          e834f8                         CALL 0x1028:00eb
LAB_1028_08b7:
1028:08b7          5d                             POP BP
1028:08b8          c20400                         RET 0x4
FUN_1028_08bb:
1028:08bb          55                             PUSH BP
1028:08bc          89e5                           MOV BP,SP
1028:08be          83ec24                         SUB SP,0x24
1028:08c1          e888f7                         CALL 0x1028:004c
1028:08c4          ff36809d                       PUSH word ptr [0x9d80]
1028:08c8          8d7edc                         LEA DI,[BP + -0x24]
1028:08cb          16                             PUSH SS
1028:08cc          57                             PUSH DI
1028:08cd          9ad0005011                     CALLF 0x1150:00d0
1028:08d2          8b46e8                         MOV AX,word ptr [BP + -0x18]
1028:08d5          a37a9d                         MOV [0x9d7a],AX
1028:08d8          8b46dc                         MOV AX,word ptr [BP + -0x24]
1028:08db          0346e4                         ADD AX,word ptr [BP + -0x1c]
1028:08de          a37c9d                         MOV [0x9d7c],AX
1028:08e1          8b46de                         MOV AX,word ptr [BP + -0x22]
1028:08e4          a37e9d                         MOV [0x9d7e],AX
1028:08e7          b82000                         MOV AX,0x20
1028:08ea          50                             PUSH AX
1028:08eb          9ac8015011                     CALLF 0x1150:01c8
1028:08f0          d1e0                           SHL AX,0x1
1028:08f2          50                             PUSH AX
1028:08f3          b80200                         MOV AX,0x2
1028:08f6          50                             PUSH AX
1028:08f7          9ac8015011                     CALLF 0x1150:01c8
1028:08fc          8bc8                           MOV CX,AX
1028:08fe          a12017                         MOV AX,[0x1720]
1028:0901          f7267a9d                       MUL word ptr [0x9d7a]
1028:0905          03c1                           ADD AX,CX
1028:0907          50                             PUSH AX
1028:0908          31c0                           XOR AX,AX
1028:090a          50                             PUSH AX
1028:090b          9ac8015011                     CALLF 0x1150:01c8
1028:0910          50                             PUSH AX
1028:0911          e8eef6                         CALL 0x1028:0002
1028:0914          5a                             POP DX
1028:0915          03c2                           ADD AX,DX
1028:0917          8946fe                         MOV word ptr [BP + -0x2],AX
1028:091a          b82100                         MOV AX,0x21
1028:091d          50                             PUSH AX
1028:091e          9ac8015011                     CALLF 0x1150:01c8
1028:0923          d1e0                           SHL AX,0x1
1028:0925          50                             PUSH AX
1028:0926          b80400                         MOV AX,0x4
1028:0929          50                             PUSH AX
1028:092a          9ac8015011                     CALLF 0x1150:01c8
1028:092f          50                             PUSH AX
1028:0930          b80300                         MOV AX,0x3
1028:0933          50                             PUSH AX
1028:0934          9ac8015011                     CALLF 0x1150:01c8
1028:0939          8bc8                           MOV CX,AX
1028:093b          a12217                         MOV AX,[0x1722]
1028:093e          f7267c9d                       MUL word ptr [0x9d7c]
1028:0942          03c1                           ADD AX,CX
1028:0944          5a                             POP DX
1028:0945          03c2                           ADD AX,DX
1028:0947          50                             PUSH AX
1028:0948          b80100                         MOV AX,0x1
1028:094b          50                             PUSH AX
1028:094c          9ac8015011                     CALLF 0x1150:01c8
1028:0951          50                             PUSH AX
1028:0952          e8adf6                         CALL 0x1028:0002
1028:0955          5a                             POP DX
1028:0956          03c2                           ADD AX,DX
1028:0958          8946fc                         MOV word ptr [BP + -0x4],AX
1028:095b          8b46fe                         MOV AX,word ptr [BP + -0x2]
1028:095e          c47e04                         LES DI,[BP + 0x4]
1028:0961          26894504                       MOV word ptr ES:[DI + 0x4],AX
1028:0965          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:0968          c47e04                         LES DI,[BP + 0x4]
1028:096b          26894506                       MOV word ptr ES:[DI + 0x6],AX
1028:096f          b82000                         MOV AX,0x20
1028:0972          50                             PUSH AX
1028:0973          9ac8015011                     CALLF 0x1150:01c8
1028:0978          d1e0                           SHL AX,0x1
1028:097a          50                             PUSH AX
1028:097b          b80200                         MOV AX,0x2
1028:097e          50                             PUSH AX
1028:097f          9ac8015011                     CALLF 0x1150:01c8
1028:0984          8bd0                           MOV DX,AX
1028:0986          a17a9d                         MOV AX,[0x9d7a]
1028:0989          b104                           MOV CL,0x4
1028:098b          d3e0                           SHL AX,CL
1028:098d          03c2                           ADD AX,DX
1028:098f          5a                             POP DX
1028:0990          03c2                           ADD AX,DX
1028:0992          c47e04                         LES DI,[BP + 0x4]
1028:0995          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1028:0999          b80400                         MOV AX,0x4
1028:099c          50                             PUSH AX
1028:099d          9ac8015011                     CALLF 0x1150:01c8
1028:09a2          50                             PUSH AX
1028:09a3          b82100                         MOV AX,0x21
1028:09a6          50                             PUSH AX
1028:09a7          9ac8015011                     CALLF 0x1150:01c8
1028:09ac          d1e0                           SHL AX,0x1
1028:09ae          50                             PUSH AX
1028:09af          b80300                         MOV AX,0x3
1028:09b2          50                             PUSH AX
1028:09b3          9ac8015011                     CALLF 0x1150:01c8
1028:09b8          8bd0                           MOV DX,AX
1028:09ba          a17c9d                         MOV AX,[0x9d7c]
1028:09bd          d1e0                           SHL AX,0x1
1028:09bf          d1e0                           SHL AX,0x1
1028:09c1          03c2                           ADD AX,DX
1028:09c3          5a                             POP DX
1028:09c4          03c2                           ADD AX,DX
1028:09c6          5a                             POP DX
1028:09c7          03c2                           ADD AX,DX
1028:09c9          c47e04                         LES DI,[BP + 0x4]
1028:09cc          2689450e                       MOV word ptr ES:[DI + 0xe],AX
1028:09d0          8b46fe                         MOV AX,word ptr [BP + -0x2]
1028:09d3          c47e04                         LES DI,[BP + 0x4]
1028:09d6          26894510                       MOV word ptr ES:[DI + 0x10],AX
1028:09da          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:09dd          c47e04                         LES DI,[BP + 0x4]
1028:09e0          26894512                       MOV word ptr ES:[DI + 0x12],AX
1028:09e4          e8cef6                         CALL 0x1028:00b5
1028:09e7          89ec                           MOV SP,BP
1028:09e9          5d                             POP BP
1028:09ea          c20400                         RET 0x4
FUN_1028_09ed:
1028:09ed          55                             PUSH BP
1028:09ee          89e5                           MOV BP,SP
1028:09f0          803e401700                     CMP byte ptr [0x1740],0x0
1028:09f5          7409                           JZ 0x1028:0a00
1028:09f7          807e0403                       CMP byte ptr [BP + 0x4],0x3
1028:09fb          7503                           JNZ 0x1028:0a00
1028:09fd          e8a3f7                         CALL 0x1028:01a3
LAB_1028_0a00:
1028:0a00          833e6a1740                     CMP word ptr [0x176a],0x40
1028:0a05          7d0f                           JGE 0x1028:0a16
1028:0a07          8a4604                         MOV AL,byte ptr [BP + 0x4]
1028:0a0a          8b3e6a17                       MOV DI,word ptr [0x176a]
1028:0a0e          8885a49d                       MOV byte ptr [DI + 0x9da4],AL
1028:0a12          ff066a17                       INC word ptr [0x176a]
LAB_1028_0a16:
1028:0a16          5d                             POP BP
1028:0a17          c20200                         RET 0x2
FUN_1028_0a1a:
1028:0a1a          55                             PUSH BP
1028:0a1b          89e5                           MOV BP,SP
1028:0a1d          83ec08                         SUB SP,0x8
1028:0a20          803e401700                     CMP byte ptr [0x1740],0x0
1028:0a25          7409                           JZ 0x1028:0a30
1028:0a27          807e0403                       CMP byte ptr [BP + 0x4],0x3
1028:0a2b          7503                           JNZ 0x1028:0a30
1028:0a2d          e873f7                         CALL 0x1028:01a3
LAB_1028_0a30:
1028:0a30          b81100                         MOV AX,0x11
1028:0a33          50                             PUSH AX
1028:0a34          9a6c015011                     CALLF 0x1150:016c
1028:0a39          09c0                           OR AX,AX
1028:0a3b          b000                           MOV AL,0x0
1028:0a3d          7d01                           JGE 0x1028:0a40
1028:0a3f          40                             INC AX
LAB_1028_0a40:
1028:0a40          8846ff                         MOV byte ptr [BP + -0x1],AL
1028:0a43          c746fc0100                     MOV word ptr [BP + -0x4],0x1
1028:0a48          eb03                           JMP 0x1028:0a4d
LAB_1028_0a4a:
1028:0a4a          ff46fc                         INC word ptr [BP + -0x4]
LAB_1028_0a4d:
1028:0a4d          8b7efc                         MOV DI,word ptr [BP + -0x4]
1028:0a50          d1e7                           SHL DI,0x1
1028:0a52          d1e7                           SHL DI,0x1
1028:0a54          81c76c17                       ADD DI,0x176c
1028:0a58          1e                             PUSH DS
1028:0a59          07                             POP ES
1028:0a5a          268a05                         MOV AL,byte ptr ES:[DI]
1028:0a5d          3a4604                         CMP AL,byte ptr [BP + 0x4]
1028:0a60          751f                           JNZ 0x1028:0a81
1028:0a62          268a4501                       MOV AL,byte ptr ES:[DI + 0x1]
1028:0a66          3a46ff                         CMP AL,byte ptr [BP + -0x1]
1028:0a69          7516                           JNZ 0x1028:0a81
1028:0a6b          268a4502                       MOV AL,byte ptr ES:[DI + 0x2]
1028:0a6f          30e4                           XOR AH,AH
1028:0a71          50                             PUSH AX
1028:0a72          268a4503                       MOV AL,byte ptr ES:[DI + 0x3]
1028:0a76          30e4                           XOR AH,AH
1028:0a78          50                             PUSH AX
1028:0a79          31c0                           XOR AX,AX
1028:0a7b          50                             PUSH AX
1028:0a7c          e860fd                         CALL 0x1028:07df
1028:0a7f          eb06                           JMP 0x1028:0a87
LAB_1028_0a81:
1028:0a81          837efc0c                       CMP word ptr [BP + -0x4],0xc
1028:0a85          75c3                           JNZ 0x1028:0a4a
LAB_1028_0a87:
1028:0a87          89ec                           MOV SP,BP
1028:0a89          5d                             POP BP
1028:0a8a          c20200                         RET 0x2
FUN_1028_0a8d:
1028:0a8d          55                             PUSH BP
1028:0a8e          89e5                           MOV BP,SP
1028:0a90          c6066d1701                     MOV byte ptr [0x176d],0x1
1028:0a95          803e6e1700                     CMP byte ptr [0x176e],0x0
1028:0a9a          7403                           JZ 0x1028:0a9f
1028:0a9c          e84cf6                         CALL 0x1028:00eb
LAB_1028_0a9f:
1028:0a9f          5d                             POP BP
1028:0aa0          c3                             RET
FUN_1028_0aa1:
1028:0aa1          55                             PUSH BP
1028:0aa2          89e5                           MOV BP,SP
1028:0aa4          803e6e1700                     CMP byte ptr [0x176e],0x0
1028:0aa9          7403                           JZ 0x1028:0aae
1028:0aab          e880f6                         CALL 0x1028:012e
LAB_1028_0aae:
1028:0aae          c6066d1700                     MOV byte ptr [0x176d],0x0
1028:0ab3          5d                             POP BP
1028:0ab4          c3                             RET
FUN_1028_0ab5:
1028:0ab5          55                             PUSH BP
1028:0ab6          89e5                           MOV BP,SP
1028:0ab8          ff36709d                       PUSH word ptr [0x9d70]
1028:0abc          ff366e9d                       PUSH word ptr [0x9d6e]
1028:0ac0          a12017                         MOV AX,[0x1720]
1028:0ac3          f7262217                       MUL word ptr [0x1722]
1028:0ac7          50                             PUSH AX
1028:0ac8          9a47016810                     CALLF 0x1068:0147
1028:0acd          31c0                           XOR AX,AX
1028:0acf          a32417                         MOV [0x1724],AX
1028:0ad2          a32617                         MOV [0x1726],AX
1028:0ad5          31c0                           XOR AX,AX
1028:0ad7          a32817                         MOV [0x1728],AX
1028:0ada          a32a17                         MOV [0x172a],AX
1028:0add          31c0                           XOR AX,AX
1028:0adf          50                             PUSH AX
1028:0ae0          9adc005011                     CALLF 0x1150:00dc
1028:0ae5          c6066c1700                     MOV byte ptr [0x176c],0x0
1028:0aea          5d                             POP BP
1028:0aeb          c3                             RET
FUN_1028_0aec:
1028:0aec          8cd0                           MOV AX,SS
1028:0aee          90                             NOP
1028:0aef          45                             INC BP
1028:0af0          55                             PUSH BP
1028:0af1          89e5                           MOV BP,SP
1028:0af3          1e                             PUSH DS
1028:0af4          8ed8                           MOV AX,DS
1028:0af6          83ec04                         SUB SP,0x4
1028:0af9          56                             PUSH SI
1028:0afa          57                             PUSH DI
1028:0afb          31c0                           XOR AX,AX
1028:0afd          8946fa                         MOV word ptr [BP + -0x6],AX
1028:0b00          8946fc                         MOV word ptr [BP + -0x4],AX
1028:0b03          8b460e                         MOV AX,word ptr [BP + 0xe]
1028:0b06          a36617                         MOV [0x1766],AX
1028:0b09          8b460c                         MOV AX,word ptr [BP + 0xc]
1028:0b0c          3d0100                         CMP AX,0x1
1028:0b0f          7506                           JNZ 0x1028:0b17
1028:0b11          e836fb                         CALL 0x1028:064a
1028:0b14          e9a700                         JMP 0x1028:0bbe
LAB_1028_0b17:
1028:0b17          3d0f00                         CMP AX,0xf
1028:0b1a          7506                           JNZ 0x1028:0b22
1028:0b1c          e880fb                         CALL 0x1028:069f
1028:0b1f          e99c00                         JMP 0x1028:0bbe
LAB_1028_0b22:
1028:0b22          3d1501                         CMP AX,0x115
1028:0b25          7510                           JNZ 0x1028:0b37
1028:0b27          b80100                         MOV AX,0x1
1028:0b2a          50                             PUSH AX
1028:0b2b          ff760a                         PUSH word ptr [BP + 0xa]
1028:0b2e          ff7606                         PUSH word ptr [BP + 0x6]
1028:0b31          e8abfc                         CALL 0x1028:07df
1028:0b34          e98700                         JMP 0x1028:0bbe
LAB_1028_0b37:
1028:0b37          3d1401                         CMP AX,0x114
1028:0b3a          750e                           JNZ 0x1028:0b4a
1028:0b3c          31c0                           XOR AX,AX
1028:0b3e          50                             PUSH AX
1028:0b3f          ff760a                         PUSH word ptr [BP + 0xa]
1028:0b42          ff7606                         PUSH word ptr [BP + 0x6]
1028:0b45          e897fc                         CALL 0x1028:07df
1028:0b48          eb74                           JMP 0x1028:0bbe
LAB_1028_0b4a:
1028:0b4a          3d0500                         CMP AX,0x5
1028:0b4d          750b                           JNZ 0x1028:0b5a
1028:0b4f          ff7606                         PUSH word ptr [BP + 0x6]
1028:0b52          ff7608                         PUSH word ptr [BP + 0x8]
1028:0b55          e8e3fc                         CALL 0x1028:083b
1028:0b58          eb64                           JMP 0x1028:0bbe
LAB_1028_0b5a:
1028:0b5a          3d2400                         CMP AX,0x24
1028:0b5d          750b                           JNZ 0x1028:0b6a
1028:0b5f          ff7608                         PUSH word ptr [BP + 0x8]
1028:0b62          ff7606                         PUSH word ptr [BP + 0x6]
1028:0b65          e853fd                         CALL 0x1028:08bb
1028:0b68          eb54                           JMP 0x1028:0bbe
LAB_1028_0b6a:
1028:0b6a          3d0201                         CMP AX,0x102
1028:0b6d          7509                           JNZ 0x1028:0b78
1028:0b6f          8a460a                         MOV AL,byte ptr [BP + 0xa]
1028:0b72          50                             PUSH AX
1028:0b73          e877fe                         CALL 0x1028:09ed
1028:0b76          eb46                           JMP 0x1028:0bbe
LAB_1028_0b78:
1028:0b78          3d0001                         CMP AX,0x100
1028:0b7b          7509                           JNZ 0x1028:0b86
1028:0b7d          8a460a                         MOV AL,byte ptr [BP + 0xa]
1028:0b80          50                             PUSH AX
1028:0b81          e896fe                         CALL 0x1028:0a1a
1028:0b84          eb38                           JMP 0x1028:0bbe
LAB_1028_0b86:
1028:0b86          3d0700                         CMP AX,0x7
1028:0b89          7505                           JNZ 0x1028:0b90
1028:0b8b          e8fffe                         CALL 0x1028:0a8d
1028:0b8e          eb2e                           JMP 0x1028:0bbe
LAB_1028_0b90:
1028:0b90          3d0800                         CMP AX,0x8
1028:0b93          7505                           JNZ 0x1028:0b9a
1028:0b95          e809ff                         CALL 0x1028:0aa1
1028:0b98          eb24                           JMP 0x1028:0bbe
LAB_1028_0b9a:
1028:0b9a          3d0200                         CMP AX,0x2
1028:0b9d          7505                           JNZ 0x1028:0ba4
1028:0b9f          e813ff                         CALL 0x1028:0ab5
1028:0ba2          eb1a                           JMP 0x1028:0bbe
LAB_1028_0ba4:
1028:0ba4          ff760e                         PUSH word ptr [BP + 0xe]
1028:0ba7          ff760c                         PUSH word ptr [BP + 0xc]
1028:0baa          ff760a                         PUSH word ptr [BP + 0xa]
1028:0bad          ff7608                         PUSH word ptr [BP + 0x8]
1028:0bb0          ff7606                         PUSH word ptr [BP + 0x6]
1028:0bb3          9a70015011                     CALLF 0x1150:0170
1028:0bb8          8946fa                         MOV word ptr [BP + -0x6],AX
1028:0bbb          8956fc                         MOV word ptr [BP + -0x4],DX
LAB_1028_0bbe:
1028:0bbe          8b46fa                         MOV AX,word ptr [BP + -0x6]
1028:0bc1          8b56fc                         MOV DX,word ptr [BP + -0x4]
1028:0bc4          5f                             POP DI
1028:0bc5          5e                             POP SI
1028:0bc6          8d66fe                         LEA SP,[BP + -0x2]
1028:0bc9          1f                             POP DS
1028:0bca          5d                             POP BP
1028:0bcb          4d                             DEC BP
1028:0bcc          ca0a00                         RETF 0xa
FUN_1028_0bcf:
1028:0bcf          45                             INC BP
1028:0bd0          55                             PUSH BP
1028:0bd1          89e5                           MOV BP,SP
1028:0bd3          1e                             PUSH DS
1028:0bd4          83ec02                         SUB SP,0x2
1028:0bd7          c47e06                         LES DI,[BP + 0x6]
1028:0bda          26837d0800                     CMP word ptr ES:[DI + 0x8],0x0
1028:0bdf          741f                           JZ 0x1028:0c00
1028:0be1          26ff750e                       PUSH word ptr ES:[DI + 0xe]
1028:0be5          26ff750c                       PUSH word ptr ES:[DI + 0xc]
1028:0be9          26ff7508                       PUSH word ptr ES:[DI + 0x8]
1028:0bed          9ae4032810                     CALLF 0x1028:03e4
1028:0bf2          c47e06                         LES DI,[BP + 0x6]
1028:0bf5          31c0                           XOR AX,AX
1028:0bf7          26894508                       MOV word ptr ES:[DI + 0x8],AX
1028:0bfb          9ad6042810                     CALLF 0x1028:04d6
LAB_1028_0c00:
1028:0c00          31c0                           XOR AX,AX
1028:0c02          8946fc                         MOV word ptr [BP + -0x4],AX
1028:0c05          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:0c08          89ec                           MOV SP,BP
1028:0c0a          5d                             POP BP
1028:0c0b          4d                             DEC BP
1028:0c0c          ca0400                         RETF 0x4
FUN_1028_0c0f:
1028:0c0f          45                             INC BP
1028:0c10          55                             PUSH BP
1028:0c11          89e5                           MOV BP,SP
1028:0c13          1e                             PUSH DS
1028:0c14          83ec02                         SUB SP,0x2
1028:0c17          c47e06                         LES DI,[BP + 0x6]
1028:0c1a          26ff750e                       PUSH word ptr ES:[DI + 0xe]
1028:0c1e          26ff750c                       PUSH word ptr ES:[DI + 0xc]
1028:0c22          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1028:0c26          9a99052810                     CALLF 0x1028:0599
1028:0c2b          c47e06                         LES DI,[BP + 0x6]
1028:0c2e          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1028:0c32          31c0                           XOR AX,AX
1028:0c34          26894508                       MOV word ptr ES:[DI + 0x8],AX
1028:0c38          31c0                           XOR AX,AX
1028:0c3a          8946fc                         MOV word ptr [BP + -0x4],AX
1028:0c3d          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:0c40          89ec                           MOV SP,BP
1028:0c42          5d                             POP BP
1028:0c43          4d                             DEC BP
1028:0c44          ca0400                         RETF 0x4
FUN_1028_0c47:
1028:0c47          45                             INC BP
1028:0c48          55                             PUSH BP
1028:0c49          89e5                           MOV BP,SP
1028:0c4b          1e                             PUSH DS
1028:0c4c          83ec02                         SUB SP,0x2
1028:0c4f          31c0                           XOR AX,AX
1028:0c51          8946fc                         MOV word ptr [BP + -0x4],AX
1028:0c54          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:0c57          89ec                           MOV SP,BP
1028:0c59          5d                             POP BP
1028:0c5a          4d                             DEC BP
1028:0c5b          ca0400                         RETF 0x4
FUN_1028_0c5e:
1028:0c5e          45                             INC BP
1028:0c5f          55                             PUSH BP
1028:0c60          89e5                           MOV BP,SP
1028:0c62          1e                             PUSH DS
1028:0c63          83ec02                         SUB SP,0x2
1028:0c66          c47e06                         LES DI,[BP + 0x6]
1028:0c69          26817d02b1d7                   CMP word ptr ES:[DI + 0x2],0xd7b1
1028:0c6f          751a                           JNZ 0x1028:0c8b
1028:0c71          b80f0c                         MOV AX,0xc0f
1028:0c74          ba2810                         MOV DX,0x1028
1028:0c77          26894514                       MOV word ptr ES:[DI + 0x14],AX
1028:0c7b          26895516                       MOV word ptr ES:[DI + 0x16],DX
1028:0c7f          31c0                           XOR AX,AX
1028:0c81          26894518                       MOV word ptr ES:[DI + 0x18],AX
1028:0c85          2689451a                       MOV word ptr ES:[DI + 0x1a],AX
1028:0c89          eb25                           JMP 0x1028:0cb0
LAB_1028_0c8b:
1028:0c8b          c47e06                         LES DI,[BP + 0x6]
1028:0c8e          26c74502b2d7                   MOV word ptr ES:[DI + 0x2],0xd7b2
1028:0c94          b8cf0b                         MOV AX,0xbcf
1028:0c97          ba2810                         MOV DX,0x1028
1028:0c9a          26894514                       MOV word ptr ES:[DI + 0x14],AX
1028:0c9e          26895516                       MOV word ptr ES:[DI + 0x16],DX
1028:0ca2          b8cf0b                         MOV AX,0xbcf
1028:0ca5          ba2810                         MOV DX,0x1028
1028:0ca8          26894518                       MOV word ptr ES:[DI + 0x18],AX
1028:0cac          2689551a                       MOV word ptr ES:[DI + 0x1a],DX
LAB_1028_0cb0:
1028:0cb0          b8470c                         MOV AX,0xc47
1028:0cb3          ba2810                         MOV DX,0x1028
1028:0cb6          c47e06                         LES DI,[BP + 0x6]
1028:0cb9          2689451c                       MOV word ptr ES:[DI + 0x1c],AX
1028:0cbd          2689551e                       MOV word ptr ES:[DI + 0x1e],DX
1028:0cc1          31c0                           XOR AX,AX
1028:0cc3          8946fc                         MOV word ptr [BP + -0x4],AX
1028:0cc6          8b46fc                         MOV AX,word ptr [BP + -0x4]
1028:0cc9          89ec                           MOV SP,BP
1028:0ccb          5d                             POP BP
1028:0ccc          4d                             DEC BP
1028:0ccd          ca0400                         RETF 0x4
FUN_1028_0cd0:
1028:0cd0          45                             INC BP
1028:0cd1          55                             PUSH BP
1028:0cd2          89e5                           MOV BP,SP
1028:0cd4          1e                             PUSH DS
1028:0cd5          83ec04                         SUB SP,0x4
1028:0cd8          c47e06                         LES DI,[BP + 0x6]
1028:0cdb          26c705ffff                     MOV word ptr ES:[DI],0xffff
1028:0ce0          26c74502b0d7                   MOV word ptr ES:[DI + 0x2],0xd7b0
1028:0ce6          26c745048000                   MOV word ptr ES:[DI + 0x4],0x80
1028:0cec          268d858000                     LEA AX,[DI + 0x80]
1028:0cf1          8cc2                           MOV DX,ES
1028:0cf3          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1028:0cf7          2689550e                       MOV word ptr ES:[DI + 0xe],DX
1028:0cfb          b85e0c                         MOV AX,0xc5e
1028:0cfe          ba2810                         MOV DX,0x1028
1028:0d01          26894510                       MOV word ptr ES:[DI + 0x10],AX
1028:0d05          26895512                       MOV word ptr ES:[DI + 0x12],DX
1028:0d09          26c6453000                     MOV byte ptr ES:[DI + 0x30],0x0
1028:0d0e          89ec                           MOV SP,BP
1028:0d10          5d                             POP BP
1028:0d11          4d                             DEC BP
1028:0d12          ca0400                         RETF 0x4
FUN_1028_0d15:
1028:0d15          45                             INC BP
1028:0d16          55                             PUSH BP
1028:0d17          89e5                           MOV BP,SP
1028:0d19          1e                             PUSH DS
1028:0d1a          803e6c1700                     CMP byte ptr [0x176c],0x0
1028:0d1f          7552                           JNZ 0x1028:0d73
1028:0d21          ff365a17                       PUSH word ptr [0x175a]
1028:0d25          ff365817                       PUSH word ptr [0x1758]
1028:0d29          bf1a9d                         MOV DI,0x9d1a
1028:0d2c          1e                             PUSH DS
1028:0d2d          57                             PUSH DI
1028:0d2e          31c0                           XOR AX,AX
1028:0d30          baff00                         MOV DX,0xff
1028:0d33          52                             PUSH DX
1028:0d34          50                             PUSH AX
1028:0d35          ff361817                       PUSH word ptr [0x1718]
1028:0d39          ff361a17                       PUSH word ptr [0x171a]
1028:0d3d          ff361c17                       PUSH word ptr [0x171c]
1028:0d41          ff361e17                       PUSH word ptr [0x171e]
1028:0d45          31c0                           XOR AX,AX
1028:0d47          50                             PUSH AX
1028:0d48          31c0                           XOR AX,AX
1028:0d4a          50                             PUSH AX
1028:0d4b          ff364419                       PUSH word ptr [0x1944]
1028:0d4f          31c0                           XOR AX,AX
1028:0d51          31d2                           XOR DX,DX
1028:0d53          52                             PUSH DX
1028:0d54          50                             PUSH AX
1028:0d55          9a1c015011                     CALLF 0x1150:011c
1028:0d5a          a36617                         MOV [0x1766],AX
1028:0d5d          ff366617                       PUSH word ptr [0x1766]
1028:0d61          ff364619                       PUSH word ptr [0x1946]
1028:0d65          9a20015011                     CALLF 0x1150:0120
1028:0d6a          ff366617                       PUSH word ptr [0x1766]
1028:0d6e          9a90015011                     CALLF 0x1150:0190
LAB_1028_0d73:
1028:0d73          89ec                           MOV SP,BP
1028:0d75          5d                             POP BP
1028:0d76          4d                             DEC BP
1028:0d77          cb                             RETF
FUN_1028_0d78:
1028:0d78          45                             INC BP
1028:0d79          55                             PUSH BP
1028:0d7a          89e5                           MOV BP,SP
1028:0d7c          1e                             PUSH DS
1028:0d7d          81ec9600                       SUB SP,0x96
1028:0d81          a16a9d                         MOV AX,[0x9d6a]
1028:0d84          8b166c9d                       MOV DX,word ptr [0x9d6c]
1028:0d88          a35819                         MOV [0x1958],AX
1028:0d8b          89165a19                       MOV word ptr [0x195a],DX
1028:0d8f          803e6c1700                     CMP byte ptr [0x176c],0x0
1028:0d94          7503                           JNZ 0x1028:0d99
1028:0d96          e98900                         JMP 0x1028:0e22
LAB_1028_0d99:
1028:0d99          a15e19                         MOV AX,[0x195e]
1028:0d9c          0b066019                       OR AX,word ptr [0x1960]
1028:0da0          7403                           JZ 0x1028:0da5
1028:0da2          e97d00                         JMP 0x1028:0e22
LAB_1028_0da5:
1028:0da5          b81a9d                         MOV AX,0x9d1a
1028:0da8          8cda                           MOV DX,DS
1028:0daa          8946fa                         MOV word ptr [BP + -0x6],AX
1028:0dad          8956fc                         MOV word ptr [BP + -0x4],DX
1028:0db0          8dbe68ff                       LEA DI,[BP + 0xff68]
1028:0db4          16                             PUSH SS
1028:0db5          57                             PUSH DI
1028:0db6          ff362e17                       PUSH word ptr [0x172e]
1028:0dba          ff362c17                       PUSH word ptr [0x172c]
1028:0dbe          8d7efa                         LEA DI,[BP + -0x6]
1028:0dc1          16                             PUSH SS
1028:0dc2          57                             PUSH DI
1028:0dc3          9ae8015011                     CALLF 0x1150:01e8
1028:0dc8          ff366617                       PUSH word ptr [0x1766]
1028:0dcc          8dbe68ff                       LEA DI,[BP + 0xff68]
1028:0dd0          16                             PUSH SS
1028:0dd1          57                             PUSH DI
1028:0dd2          9a10015011                     CALLF 0x1150:0110
1028:0dd7          ff366617                       PUSH word ptr [0x1766]
1028:0ddb          31c0                           XOR AX,AX
1028:0ddd          50                             PUSH AX
1028:0dde          9aa4015011                     CALLF 0x1150:01a4
1028:0de3          50                             PUSH AX
1028:0de4          b860f0                         MOV AX,0xf060
1028:0de7          50                             PUSH AX
1028:0de8          31c0                           XOR AX,AX
1028:0dea          50                             PUSH AX
1028:0deb          9aa0015011                     CALLF 0x1150:01a0
1028:0df0          c606401700                     MOV byte ptr [0x1740],0x0
LAB_1028_0df5:
1028:0df5          8d7ee8                         LEA DI,[BP + -0x18]
1028:0df8          16                             PUSH SS
1028:0df9          57                             PUSH DI
1028:0dfa          31c0                           XOR AX,AX
1028:0dfc          50                             PUSH AX
1028:0dfd          31c0                           XOR AX,AX
1028:0dff          50                             PUSH AX
1028:0e00          31c0                           XOR AX,AX
1028:0e02          50                             PUSH AX
1028:0e03          9a74015011                     CALLF 0x1150:0174
1028:0e08          09c0                           OR AX,AX
1028:0e0a          7416                           JZ 0x1028:0e22
1028:0e0c          8d7ee8                         LEA DI,[BP + -0x18]
1028:0e0f          16                             PUSH SS
1028:0e10          57                             PUSH DI
1028:0e11          9a84015011                     CALLF 0x1150:0184
1028:0e16          8d7ee8                         LEA DI,[BP + -0x18]
1028:0e19          16                             PUSH SS
1028:0e1a          57                             PUSH DI
1028:0e1b          9a88015011                     CALLF 0x1150:0188
1028:0e20          ebd3                           JMP 0x1028:0df5
LAB_1028_0e22:
1028:0e22          89ec                           MOV SP,BP
1028:0e24          5d                             POP BP
1028:0e25          4d                             DEC BP
1028:0e26          cb                             RETF
FUN_1028_0e27:
1028:0e27          55                             PUSH BP
1028:0e28          89e5                           MOV BP,SP
1028:0e2a          833e421900                     CMP word ptr [0x1942],0x0
1028:0e2f          753a                           JNZ 0x1028:0e6b
1028:0e31          a14419                         MOV AX,[0x1944]
1028:0e34          a34c17                         MOV [0x174c],AX
1028:0e37          31c0                           XOR AX,AX
1028:0e39          50                             PUSH AX
1028:0e3a          b8007f                         MOV AX,0x7f00
1028:0e3d          31d2                           XOR DX,DX
1028:0e3f          52                             PUSH DX
1028:0e40          50                             PUSH AX
1028:0e41          9ac0015011                     CALLF 0x1150:01c0
1028:0e46          a34e17                         MOV [0x174e],AX
1028:0e49          31c0                           XOR AX,AX
1028:0e4b          50                             PUSH AX
1028:0e4c          b8007f                         MOV AX,0x7f00
1028:0e4f          31d2                           XOR DX,DX
1028:0e51          52                             PUSH DX
1028:0e52          50                             PUSH AX
1028:0e53          9abc015011                     CALLF 0x1150:01bc
1028:0e58          a35017                         MOV [0x1750],AX
1028:0e5b          c70652170600                   MOV word ptr [0x1752],0x6
1028:0e61          bf4217                         MOV DI,0x1742
1028:0e64          1e                             PUSH DS
1028:0e65          57                             PUSH DI
1028:0e66          9a34015011                     CALLF 0x1150:0134
LAB_1028_0e6b:
1028:0e6b          bfe49d                         MOV DI,0x9de4
1028:0e6e          1e                             PUSH DS
1028:0e6f          57                             PUSH DI
1028:0e70          9ad00c2810                     CALLF 0x1028:0cd0
1028:0e75          bfe49d                         MOV DI,0x9de4
1028:0e78          1e                             PUSH DS
1028:0e79          57                             PUSH DI
1028:0e7a          9a27056810                     CALLF 0x1068:0527
1028:0e7f          9a8f036810                     CALLF 0x1068:038f
1028:0e84          bfe49e                         MOV DI,0x9ee4
1028:0e87          1e                             PUSH DS
1028:0e88          57                             PUSH DI
1028:0e89          9ad00c2810                     CALLF 0x1028:0cd0
1028:0e8e          bfe49e                         MOV DI,0x9ee4
1028:0e91          1e                             PUSH DS
1028:0e92          57                             PUSH DI
1028:0e93          9a2c056810                     CALLF 0x1068:052c
1028:0e98          9a8f036810                     CALLF 0x1068:038f
1028:0e9d          ff364419                       PUSH word ptr [0x1944]
1028:0ea1          bf1a9d                         MOV DI,0x9d1a
1028:0ea4          1e                             PUSH DS
1028:0ea5          57                             PUSH DI
1028:0ea6          b85000                         MOV AX,0x50
1028:0ea9          50                             PUSH AX
1028:0eaa          9a1c005011                     CALLF 0x1150:001c
1028:0eaf          bf1a9d                         MOV DI,0x9d1a
1028:0eb2          1e                             PUSH DS
1028:0eb3          57                             PUSH DI
1028:0eb4          bf1a9d                         MOV DI,0x9d1a
1028:0eb7          1e                             PUSH DS
1028:0eb8          57                             PUSH DI
1028:0eb9          9afc015011                     CALLF 0x1150:01fc
1028:0ebe          a15819                         MOV AX,[0x1958]
1028:0ec1          8b165a19                       MOV DX,word ptr [0x195a]
1028:0ec5          a36a9d                         MOV [0x9d6a],AX
1028:0ec8          89166c9d                       MOV word ptr [0x9d6c],DX
1028:0ecc          b8780d                         MOV AX,0xd78
1028:0ecf          ba2810                         MOV DX,0x1028
1028:0ed2          a35819                         MOV [0x1958],AX
1028:0ed5          89165a19                       MOV word ptr [0x195a],DX
1028:0ed9          5d                             POP BP
1028:0eda          cb                             RETF
FUN_1030_0002:
1030:0002          55                             PUSH BP
1030:0003          89e5                           MOV BP,SP
1030:0005          b85400                         MOV AX,0x54
1030:0008          ba5011                         MOV DX,0x1150
1030:000b          a32618                         MOV [0x1826],AX
1030:000e          89162818                       MOV word ptr [0x1828],DX
1030:0012          b85000                         MOV AX,0x50
1030:0015          ba5011                         MOV DX,0x1150
1030:0018          a32a18                         MOV [0x182a],AX
1030:001b          89162c18                       MOV word ptr [0x182c],DX
1030:001f          b85800                         MOV AX,0x58
1030:0022          ba5011                         MOV DX,0x1150
1030:0025          a33618                         MOV [0x1836],AX
1030:0028          89163818                       MOV word ptr [0x1838],DX
1030:002c          b85c00                         MOV AX,0x5c
1030:002f          ba5011                         MOV DX,0x1150
1030:0032          a33a18                         MOV [0x183a],AX
1030:0035          89163c18                       MOV word ptr [0x183c],DX
1030:0039          c6063e1801                     MOV byte ptr [0x183e],0x1
1030:003e          c9                             LEAVE
1030:003f          cb                             RETF
FUN_1038_0002:
1038:0002          45                             INC BP
1038:0003          55                             PUSH BP
1038:0004          89e5                           MOV BP,SP
1038:0006          1e                             PUSH DS
1038:0007          83ec10                         SUB SP,0x10
1038:000a          ff7614                         PUSH word ptr [BP + 0x14]
1038:000d          ff7612                         PUSH word ptr [BP + 0x12]
1038:0010          b05c                           MOV AL,0x5c
1038:0012          50                             PUSH AX
1038:0013          9a31016010                     CALLF 0x1060:0131
1038:0018          8946f2                         MOV word ptr [BP + -0xe],AX
1038:001b          8956f4                         MOV word ptr [BP + -0xc],DX
1038:001e          8b46f2                         MOV AX,word ptr [BP + -0xe]
1038:0021          0b46f4                         OR AX,word ptr [BP + -0xc]
1038:0024          7514                           JNZ 0x1038:003a
1038:0026          ff7614                         PUSH word ptr [BP + 0x14]
1038:0029          ff7612                         PUSH word ptr [BP + 0x12]
1038:002c          b03a                           MOV AL,0x3a
1038:002e          50                             PUSH AX
1038:002f          9a31016010                     CALLF 0x1060:0131
1038:0034          8946f2                         MOV word ptr [BP + -0xe],AX
1038:0037          8956f4                         MOV word ptr [BP + -0xc],DX
LAB_1038_003a:
1038:003a          8b46f2                         MOV AX,word ptr [BP + -0xe]
1038:003d          0b46f4                         OR AX,word ptr [BP + -0xc]
1038:0040          750e                           JNZ 0x1038:0050
1038:0042          8b4612                         MOV AX,word ptr [BP + 0x12]
1038:0045          8b5614                         MOV DX,word ptr [BP + 0x14]
1038:0048          8946f2                         MOV word ptr [BP + -0xe],AX
1038:004b          8956f4                         MOV word ptr [BP + -0xc],DX
1038:004e          eb03                           JMP 0x1038:0053
LAB_1038_0050:
1038:0050          ff46f2                         INC word ptr [BP + -0xe]
LAB_1038_0053:
1038:0053          ff76f4                         PUSH word ptr [BP + -0xc]
1038:0056          ff76f2                         PUSH word ptr [BP + -0xe]
1038:0059          b02e                           MOV AL,0x2e
1038:005b          50                             PUSH AX
1038:005c          9a09016010                     CALLF 0x1060:0109
1038:0061          8946ee                         MOV word ptr [BP + -0x12],AX
1038:0064          8956f0                         MOV word ptr [BP + -0x10],DX
1038:0067          8b46ee                         MOV AX,word ptr [BP + -0x12]
1038:006a          0b46f0                         OR AX,word ptr [BP + -0x10]
1038:006d          7511                           JNZ 0x1038:0080
1038:006f          ff76f4                         PUSH word ptr [BP + -0xc]
1038:0072          ff76f2                         PUSH word ptr [BP + -0xe]
1038:0075          9a19006010                     CALLF 0x1060:0019
1038:007a          8946ee                         MOV word ptr [BP + -0x12],AX
1038:007d          8956f0                         MOV word ptr [BP + -0x10],DX
LAB_1038_0080:
1038:0080          8b46f2                         MOV AX,word ptr [BP + -0xe]
1038:0083          2b4612                         SUB AX,word ptr [BP + 0x12]
1038:0086          8946fa                         MOV word ptr [BP + -0x6],AX
1038:0089          837efa43                       CMP word ptr [BP + -0x6],0x43
1038:008d          7605                           JBE 0x1038:0094
1038:008f          c746fa4300                     MOV word ptr [BP + -0x6],0x43
LAB_1038_0094:
1038:0094          8b46ee                         MOV AX,word ptr [BP + -0x12]
1038:0097          2b46f2                         SUB AX,word ptr [BP + -0xe]
1038:009a          8946f8                         MOV word ptr [BP + -0x8],AX
1038:009d          837ef808                       CMP word ptr [BP + -0x8],0x8
1038:00a1          7605                           JBE 0x1038:00a8
1038:00a3          c746f80800                     MOV word ptr [BP + -0x8],0x8
LAB_1038_00a8:
1038:00a8          31c0                           XOR AX,AX
1038:00aa          8946f6                         MOV word ptr [BP + -0xa],AX
1038:00ad          ff76f4                         PUSH word ptr [BP + -0xc]
1038:00b0          ff76f2                         PUSH word ptr [BP + -0xe]
1038:00b3          b03f                           MOV AL,0x3f
1038:00b5          50                             PUSH AX
1038:00b6          9a09016010                     CALLF 0x1060:0109
1038:00bb          09d0                           OR AX,DX
1038:00bd          7512                           JNZ 0x1038:00d1
1038:00bf          ff76f4                         PUSH word ptr [BP + -0xc]
1038:00c2          ff76f2                         PUSH word ptr [BP + -0xe]
1038:00c5          b02a                           MOV AL,0x2a
1038:00c7          50                             PUSH AX
1038:00c8          9a09016010                     CALLF 0x1060:0109
1038:00cd          09d0                           OR AX,DX
1038:00cf          7405                           JZ 0x1038:00d6
LAB_1038_00d1:
1038:00d1          c746f60800                     MOV word ptr [BP + -0xa],0x8
LAB_1038_00d6:
1038:00d6          837efa00                       CMP word ptr [BP + -0x6],0x0
1038:00da          7409                           JZ 0x1038:00e5
1038:00dc          8b46f6                         MOV AX,word ptr [BP + -0xa]
1038:00df          0d0400                         OR AX,0x4
1038:00e2          8946f6                         MOV word ptr [BP + -0xa],AX
LAB_1038_00e5:
1038:00e5          837ef800                       CMP word ptr [BP + -0x8],0x0
1038:00e9          7409                           JZ 0x1038:00f4
1038:00eb          8b46f6                         MOV AX,word ptr [BP + -0xa]
1038:00ee          0d0200                         OR AX,0x2
1038:00f1          8946f6                         MOV word ptr [BP + -0xa],AX
LAB_1038_00f4:
1038:00f4          c47eee                         LES DI,[BP + -0x12]
1038:00f7          26803d00                       CMP byte ptr ES:[DI],0x0
1038:00fb          7409                           JZ 0x1038:0106
1038:00fd          8b46f6                         MOV AX,word ptr [BP + -0xa]
1038:0100          0d0100                         OR AX,0x1
1038:0103          8946f6                         MOV word ptr [BP + -0xa],AX
LAB_1038_0106:
1038:0106          8b460e                         MOV AX,word ptr [BP + 0xe]
1038:0109          0b4610                         OR AX,word ptr [BP + 0x10]
1038:010c          7414                           JZ 0x1038:0122
1038:010e          ff7610                         PUSH word ptr [BP + 0x10]
1038:0111          ff760e                         PUSH word ptr [BP + 0xe]
1038:0114          ff7614                         PUSH word ptr [BP + 0x14]
1038:0117          ff7612                         PUSH word ptr [BP + 0x12]
1038:011a          ff76fa                         PUSH word ptr [BP + -0x6]
1038:011d          9a77006010                     CALLF 0x1060:0077
LAB_1038_0122:
1038:0122          8b460a                         MOV AX,word ptr [BP + 0xa]
1038:0125          0b460c                         OR AX,word ptr [BP + 0xc]
1038:0128          7414                           JZ 0x1038:013e
1038:012a          ff760c                         PUSH word ptr [BP + 0xc]
1038:012d          ff760a                         PUSH word ptr [BP + 0xa]
1038:0130          ff76f4                         PUSH word ptr [BP + -0xc]
1038:0133          ff76f2                         PUSH word ptr [BP + -0xe]
1038:0136          ff76f8                         PUSH word ptr [BP + -0x8]
1038:0139          9a77006010                     CALLF 0x1060:0077
LAB_1038_013e:
1038:013e          8b4606                         MOV AX,word ptr [BP + 0x6]
1038:0141          0b4608                         OR AX,word ptr [BP + 0x8]
1038:0144          7415                           JZ 0x1038:015b
1038:0146          ff7608                         PUSH word ptr [BP + 0x8]
1038:0149          ff7606                         PUSH word ptr [BP + 0x6]
1038:014c          ff76f0                         PUSH word ptr [BP + -0x10]
1038:014f          ff76ee                         PUSH word ptr [BP + -0x12]
1038:0152          b80400                         MOV AX,0x4
1038:0155          50                             PUSH AX
1038:0156          9a77006010                     CALLF 0x1060:0077
LAB_1038_015b:
1038:015b          8b46f6                         MOV AX,word ptr [BP + -0xa]
1038:015e          8946fc                         MOV word ptr [BP + -0x4],AX
1038:0161          8b46fc                         MOV AX,word ptr [BP + -0x4]
1038:0164          89ec                           MOV SP,BP
1038:0166          5d                             POP BP
1038:0167          4d                             DEC BP
1038:0168          ca1000                         RETF 0x10
FUN_1040_0002:
1040:0002          8b7704                         MOV SI,word ptr [BX + 0x4]
1040:0005          09f6                           OR SI,SI
1040:0007          7420                           JZ 0x1040:0029
1040:0009          3b4402                         CMP AX,word ptr [SI + 0x2]
1040:000c          7505                           JNZ 0x1040:0013
1040:000e          8b7c04                         MOV DI,word ptr [SI + 0x4]
1040:0011          eb31                           JMP 0x1040:0044
LAB_1040_0013:
1040:0013          8cdf                           MOV DI,DS
1040:0015          8ec7                           MOV DI,ES
1040:0017          fc                             CLD
LAB_1040_0018:
1040:0018          8b4c06                         MOV CX,word ptr [SI + 0x6]
1040:001b          8d7c08                         LEA DI,[SI + 0x8]
1040:001e          f2af                           SCASW.REPNE ES:DI
1040:0020          740d                           JZ 0x1040:002f
1040:0022          268b34                         MOV SI,word ptr ES:[SI]
1040:0025          09f6                           OR SI,SI
1040:0027          75ef                           JNZ 0x1040:0018
LAB_1040_0029:
1040:0029          01d3                           ADD BX,DX
1040:002b          89df                           MOV DI,BX
1040:002d          eb15                           JMP 0x1040:0044
LAB_1040_002f:
1040:002f          8b5406                         MOV DX,word ptr [SI + 0x6]
1040:0032          4a                             DEC DX
1040:0033          d1e2                           SHL DX,0x1
1040:0035          29ca                           SUB DX,CX
1040:0037          d1e2                           SHL DX,0x1
1040:0039          01d7                           ADD DI,DX
1040:003b          8b7704                         MOV SI,word ptr [BX + 0x4]
1040:003e          894402                         MOV word ptr [SI + 0x2],AX
1040:0041          897c04                         MOV word ptr [SI + 0x4],DI
LAB_1040_0044:
1040:0044          c3                             RET
FUN_1040_0045:
1040:0045          45                             INC BP
1040:0046          55                             PUSH BP
1040:0047          89e5                           MOV BP,SP
1040:0049          1e                             PUSH DS
1040:004a          ff760a                         PUSH word ptr [BP + 0xa]
1040:004d          1e                             PUSH DS
1040:004e          b84e18                         MOV AX,0x184e
1040:0051          50                             PUSH AX
1040:0052          ff7608                         PUSH word ptr [BP + 0x8]
1040:0055          9af8005011                     CALLF 0x1150:00f8
1040:005a          ff760a                         PUSH word ptr [BP + 0xa]
1040:005d          1e                             PUSH DS
1040:005e          b85218                         MOV AX,0x1852
1040:0061          50                             PUSH AX
1040:0062          ff7606                         PUSH word ptr [BP + 0x6]
1040:0065          9af8005011                     CALLF 0x1150:00f8
1040:006a          89ec                           MOV SP,BP
1040:006c          5d                             POP BP
1040:006d          4d                             DEC BP
1040:006e          ca0600                         RETF 0x6
FUN_1040_0071:
1040:0071          45                             INC BP
1040:0072          55                             PUSH BP
1040:0073          89e5                           MOV BP,SP
1040:0075          1e                             PUSH DS
1040:0076          ff7606                         PUSH word ptr [BP + 0x6]
1040:0079          1e                             PUSH DS
1040:007a          b84e18                         MOV AX,0x184e
1040:007d          50                             PUSH AX
1040:007e          9af0005011                     CALLF 0x1150:00f0
1040:0083          ff7606                         PUSH word ptr [BP + 0x6]
1040:0086          1e                             PUSH DS
1040:0087          b85218                         MOV AX,0x1852
1040:008a          50                             PUSH AX
1040:008b          9af0005011                     CALLF 0x1150:00f0
1040:0090          89ec                           MOV SP,BP
1040:0092          5d                             POP BP
1040:0093          4d                             DEC BP
1040:0094          ca0200                         RETF 0x2
FUN_1040_0097:
1040:0097          45                             INC BP
1040:0098          55                             PUSH BP
1040:0099          89e5                           MOV BP,SP
1040:009b          1e                             PUSH DS
1040:009c          ff7606                         PUSH word ptr [BP + 0x6]
1040:009f          9a28015011                     CALLF 0x1150:0128
1040:00a4          09c0                           OR AX,AX
1040:00a6          99                             CWD
1040:00a7          7453                           JZ 0x1040:00fc
1040:00a9          ff7606                         PUSH word ptr [BP + 0x6]
1040:00ac          b8fcff                         MOV AX,0xfffc
1040:00af          50                             PUSH AX
1040:00b0          9a98015011                     CALLF 0x1150:0198
1040:00b5          89c3                           MOV BX,AX
1040:00b7          8ec2                           MOV DX,ES
1040:00b9          31c0                           XOR AX,AX
1040:00bb          99                             CWD
1040:00bc          26803fe8                       CMP byte ptr ES:[BX],0xe8
1040:00c0          751e                           JNZ 0x1040:00e0
1040:00c2          b9ffff                         MOV CX,0xffff
1040:00c5          29d9                           SUB CX,BX
1040:00c7          263b4f01                       CMP CX,word ptr ES:[BX + 0x1]
1040:00cb          7513                           JNZ 0x1040:00e0
1040:00cd          26813e02005b2e                 CMP word ptr ES:[0x2],0x2e5b
1040:00d4          750a                           JNZ 0x1040:00e0
1040:00d6          268b4703                       MOV AX,word ptr ES:[BX + 0x3]
1040:00da          268b5705                       MOV DX,word ptr ES:[BX + 0x5]
1040:00de          eb1c                           JMP 0x1040:00fc
LAB_1040_00e0:
1040:00e0          ff7606                         PUSH word ptr [BP + 0x6]
1040:00e3          1e                             PUSH DS
1040:00e4          b84e18                         MOV AX,0x184e
1040:00e7          50                             PUSH AX
1040:00e8          9af4005011                     CALLF 0x1150:00f4
1040:00ed          50                             PUSH AX
1040:00ee          ff7606                         PUSH word ptr [BP + 0x6]
1040:00f1          1e                             PUSH DS
1040:00f2          b85218                         MOV AX,0x1852
1040:00f5          50                             PUSH AX
1040:00f6          9af4005011                     CALLF 0x1150:00f4
1040:00fb          5a                             POP DX
LAB_1040_00fc:
1040:00fc          89ec                           MOV SP,BP
1040:00fe          5d                             POP BP
1040:00ff          4d                             DEC BP
1040:0100          ca0200                         RETF 0x2
FUN_1040_0103:
1040:0103          55                             PUSH BP
1040:0104          89e5                           MOV BP,SP
1040:0106          57                             PUSH DI
1040:0107          1e                             PUSH DS
1040:0108          c47608                         LES SI,[BP + 0x8]
1040:010b          26ff34                         PUSH word ptr ES:[SI]
1040:010e          26ff7402                       PUSH word ptr ES:[SI + 0x2]
1040:0112          26ff7404                       PUSH word ptr ES:[SI + 0x4]
1040:0116          26ff7408                       PUSH word ptr ES:[SI + 0x8]
1040:011a          26ff7406                       PUSH word ptr ES:[SI + 0x6]
1040:011e          c435                           LES SI,[DI]
1040:0120          06                             PUSH ES
1040:0121          56                             PUSH SI
1040:0122          c47604                         LES SI,[BP + 0x4]
1040:0125          06                             PUSH ES
1040:0126          56                             PUSH SI
1040:0127          ff1e5618                       CALLF [0x1856]
1040:012b          1f                             POP DS
1040:012c          5f                             POP DI
1040:012d          5d                             POP BP
1040:012e          c3                             RET
FUN_1040_0133:
1040:0133          8cd0                           MOV AX,SS
1040:0135          90                             NOP
1040:0136          45                             INC BP
1040:0137          55                             PUSH BP
1040:0138          89e5                           MOV BP,SP
1040:013a          1e                             PUSH DS
1040:013b          8ed8                           MOV AX,DS
1040:013d          56                             PUSH SI
1040:013e          57                             PUSH DI
1040:013f          8b560e                         MOV DX,word ptr [BP + 0xe]
1040:0142          26895704                       MOV word ptr ES:[BX + 0x4],DX
1040:0146          31c0                           XOR AX,AX
1040:0148          50                             PUSH AX
1040:0149          40                             INC AX
1040:014a          50                             PUSH AX
1040:014b          ff7608                         PUSH word ptr [BP + 0x8]
1040:014e          ff7606                         PUSH word ptr [BP + 0x6]
1040:0151          ff760a                         PUSH word ptr [BP + 0xa]
1040:0154          8b460c                         MOV AX,word ptr [BP + 0xc]
1040:0157          50                             PUSH AX
1040:0158          52                             PUSH DX
1040:0159          89e2                           MOV DX,SP
1040:015b          16                             PUSH SS
1040:015c          52                             PUSH DX
1040:015d          06                             PUSH ES
1040:015e          53                             PUSH BX
1040:015f          268b1f                         MOV BX,word ptr ES:[BX]
1040:0162          09c0                           OR AX,AX
1040:0164          7907                           JNS 0x1040:016d
1040:0166          89df                           MOV DI,BX
1040:0168          83c70c                         ADD DI,0xc
1040:016b          eb06                           JMP 0x1040:0173
LAB_1040_016d:
1040:016d          ba0c00                         MOV DX,0xc
1040:0170          e88ffe                         CALL 0x1040:0002
LAB_1040_0173:
1040:0173          8b0e5818                       MOV CX,word ptr [0x1858]
1040:0177          e303                           JCXZ 0x1040:017c
1040:0179          e887ff                         CALL 0x1040:0103
LAB_1040_017c:
1040:017c          ff1d                           CALLF [DI]
1040:017e          83c40a                         ADD SP,0xa
1040:0181          58                             POP AX
1040:0182          5a                             POP DX
1040:0183          5f                             POP DI
1040:0184          5e                             POP SI
1040:0185          1f                             POP DS
1040:0186          5d                             POP BP
1040:0187          4d                             DEC BP
1040:0188          ca0a00                         RETF 0xa
FUN_1040_018b:
1040:018b          8cd0                           MOV AX,SS
1040:018d          90                             NOP
1040:018e          45                             INC BP
1040:018f          55                             PUSH BP
1040:0190          89e5                           MOV BP,SP
1040:0192          1e                             PUSH DS
1040:0193          8ed8                           MOV AX,DS
1040:0195          56                             PUSH SI
1040:0196          57                             PUSH DI
1040:0197          ff760e                         PUSH word ptr [BP + 0xe]
1040:019a          b8fcff                         MOV AX,0xfffc
1040:019d          50                             PUSH AX
1040:019e          c43e4a18                       LES DI,[0x184a]
1040:01a2          26c47d12                       LES DI,ES:[DI + 0x12]
1040:01a6          06                             PUSH ES
1040:01a7          57                             PUSH DI
1040:01a8          9a9c015011                     CALLF 0x1150:019c
1040:01ad          ff760e                         PUSH word ptr [BP + 0xe]
1040:01b0          c43e4a18                       LES DI,[0x184a]
1040:01b4          06                             PUSH ES
1040:01b5          57                             PUSH DI
1040:01b6          9a45004010                     CALLF 0x1040:0045
1040:01bb          ff760e                         PUSH word ptr [BP + 0xe]
1040:01be          ff760c                         PUSH word ptr [BP + 0xc]
1040:01c1          ff760a                         PUSH word ptr [BP + 0xa]
1040:01c4          ff7608                         PUSH word ptr [BP + 0x8]
1040:01c7          ff7606                         PUSH word ptr [BP + 0x6]
1040:01ca          8cd8                           MOV AX,DS
1040:01cc          c43e4a18                       LES DI,[0x184a]
1040:01d0          26ff5d12                       CALLF [DI + 0x12]
1040:01d4          5f                             POP DI
1040:01d5          5e                             POP SI
1040:01d6          1f                             POP DS
1040:01d7          5d                             POP BP
1040:01d8          4d                             DEC BP
1040:01d9          ca0a00                         RETF 0xa
FUN_1040_01dc:
1040:01dc          45                             INC BP
1040:01dd          55                             PUSH BP
1040:01de          89e5                           MOV BP,SP
1040:01e0          1e                             PUSH DS
1040:01e1          83ec0c                         SUB SP,0xc
1040:01e4          a14218                         MOV AX,[0x1842]
1040:01e7          0b064418                       OR AX,word ptr [0x1844]
1040:01eb          7403                           JZ 0x1040:01f0
1040:01ed          e9b300                         JMP 0x1040:02a3
LAB_1040_01f0:
1040:01f0          6a00                           PUSH 0x0
1040:01f2          6a00                           PUSH 0x0
1040:01f4          680001                         PUSH 0x100
1040:01f7          9a00005011                     CALLF 0x1150:0000
1040:01fc          50                             PUSH AX
1040:01fd          9a08005011                     CALLF 0x1150:0008
1040:0202          8946f6                         MOV word ptr [BP + -0xa],AX
1040:0205          8956f8                         MOV word ptr [BP + -0x8],DX
1040:0208          a14018                         MOV AX,[0x1840]
1040:020b          c47ef6                         LES DI,[BP + -0xa]
1040:020e          268905                         MOV word ptr ES:[DI],AX
1040:0211          bf5a18                         MOV DI,0x185a
1040:0214          1e                             PUSH DS
1040:0215          57                             PUSH DI
1040:0216          c47ef6                         LES DI,[BP + -0xa]
1040:0219          81c70200                       ADD DI,0x2
1040:021d          06                             PUSH ES
1040:021e          57                             PUSH DI
1040:021f          6a05                           PUSH 0x5
1040:0221          9aee0c6810                     CALLF 0x1068:0cee
1040:0226          a14618                         MOV AX,[0x1846]
1040:0229          8b164818                       MOV DX,word ptr [0x1848]
1040:022d          c47ef6                         LES DI,[BP + -0xa]
1040:0230          26894507                       MOV word ptr ES:[DI + 0x7],AX
1040:0234          26895509                       MOV word ptr ES:[DI + 0x9],DX
1040:0238          c47ef6                         LES DI,[BP + -0xa]
1040:023b          268d450b                       LEA AX,[DI + 0xb]
1040:023f          8cc2                           MOV DX,ES
1040:0241          8946f2                         MOV word ptr [BP + -0xe],AX
1040:0244          8956f4                         MOV word ptr [BP + -0xc],DX
LAB_1040_0247:
1040:0247          c47ef2                         LES DI,[BP + -0xe]
1040:024a          26c605e8                       MOV byte ptr ES:[DI],0xe8
1040:024e          8b46f2                         MOV AX,word ptr [BP + -0xe]
1040:0251          31d2                           XOR DX,DX
1040:0253          8bc8                           MOV CX,AX
1040:0255          8bda                           MOV BX,DX
1040:0257          b8ffff                         MOV AX,0xffff
1040:025a          baffff                         MOV DX,0xffff
1040:025d          2bc1                           SUB AX,CX
1040:025f          1bd3                           SBB DX,BX
1040:0261          c47ef2                         LES DI,[BP + -0xe]
1040:0264          26894501                       MOV word ptr ES:[DI + 0x1],AX
1040:0268          a14218                         MOV AX,[0x1842]
1040:026b          8b164418                       MOV DX,word ptr [0x1844]
1040:026f          c47ef2                         LES DI,[BP + -0xe]
1040:0272          26894503                       MOV word ptr ES:[DI + 0x3],AX
1040:0276          26895505                       MOV word ptr ES:[DI + 0x5],DX
1040:027a          8b46f2                         MOV AX,word ptr [BP + -0xe]
1040:027d          8b56f4                         MOV DX,word ptr [BP + -0xc]
1040:0280          a34218                         MOV [0x1842],AX
1040:0283          89164418                       MOV word ptr [0x1844],DX
1040:0287          8346f207                       ADD word ptr [BP + -0xe],0x7
1040:028b          817ef20001                     CMP word ptr [BP + -0xe],0x100
1040:0290          75b5                           JNZ 0x1040:0247
1040:0292          8b46f8                         MOV AX,word ptr [BP + -0x8]
1040:0295          a34018                         MOV [0x1840],AX
1040:0298          ff76f8                         PUSH word ptr [BP + -0x8]
1040:029b          ff76f8                         PUSH word ptr [BP + -0x8]
1040:029e          9a44005011                     CALLF 0x1150:0044
LAB_1040_02a3:
1040:02a3          a14218                         MOV AX,[0x1842]
1040:02a6          8b164418                       MOV DX,word ptr [0x1844]
1040:02aa          8946fa                         MOV word ptr [BP + -0x6],AX
1040:02ad          8956fc                         MOV word ptr [BP + -0x4],DX
1040:02b0          a14218                         MOV AX,[0x1842]
1040:02b3          8946f2                         MOV word ptr [BP + -0xe],AX
1040:02b6          ff364418                       PUSH word ptr [0x1844]
1040:02ba          9a3c005011                     CALLF 0x1150:003c
1040:02bf          8946f4                         MOV word ptr [BP + -0xc],AX
1040:02c2          c47ef2                         LES DI,[BP + -0xe]
1040:02c5          268b4503                       MOV AX,word ptr ES:[DI + 0x3]
1040:02c9          268b5505                       MOV DX,word ptr ES:[DI + 0x5]
1040:02cd          a34218                         MOV [0x1842],AX
1040:02d0          89164418                       MOV word ptr [0x1844],DX
1040:02d4          8b4606                         MOV AX,word ptr [BP + 0x6]
1040:02d7          8b5608                         MOV DX,word ptr [BP + 0x8]
1040:02da          c47ef2                         LES DI,[BP + -0xe]
1040:02dd          26894503                       MOV word ptr ES:[DI + 0x3],AX
1040:02e1          26895505                       MOV word ptr ES:[DI + 0x5],DX
1040:02e5          ff76f4                         PUSH word ptr [BP + -0xc]
1040:02e8          9a40005011                     CALLF 0x1150:0040
1040:02ed          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:02f0          8b56fc                         MOV DX,word ptr [BP + -0x4]
1040:02f3          89ec                           MOV SP,BP
1040:02f5          5d                             POP BP
1040:02f6          4d                             DEC BP
1040:02f7          ca0400                         RETF 0x4
FUN_1040_02fa:
1040:02fa          45                             INC BP
1040:02fb          55                             PUSH BP
1040:02fc          89e5                           MOV BP,SP
1040:02fe          1e                             PUSH DS
1040:02ff          83ec04                         SUB SP,0x4
1040:0302          8b4606                         MOV AX,word ptr [BP + 0x6]
1040:0305          8946fa                         MOV word ptr [BP + -0x6],AX
1040:0308          ff7608                         PUSH word ptr [BP + 0x8]
1040:030b          9a3c005011                     CALLF 0x1150:003c
1040:0310          8946fc                         MOV word ptr [BP + -0x4],AX
1040:0313          a14218                         MOV AX,[0x1842]
1040:0316          8b164418                       MOV DX,word ptr [0x1844]
1040:031a          c47efa                         LES DI,[BP + -0x6]
1040:031d          26894503                       MOV word ptr ES:[DI + 0x3],AX
1040:0321          26895505                       MOV word ptr ES:[DI + 0x5],DX
1040:0325          ff76fc                         PUSH word ptr [BP + -0x4]
1040:0328          9a40005011                     CALLF 0x1150:0040
1040:032d          8b4606                         MOV AX,word ptr [BP + 0x6]
1040:0330          8b5608                         MOV DX,word ptr [BP + 0x8]
1040:0333          a34218                         MOV [0x1842],AX
1040:0336          89164418                       MOV word ptr [0x1844],DX
1040:033a          89ec                           MOV SP,BP
1040:033c          5d                             POP BP
1040:033d          4d                             DEC BP
1040:033e          ca0400                         RETF 0x4
FUN_1040_0341:
1040:0341          45                             INC BP
1040:0342          55                             PUSH BP
1040:0343          89e5                           MOV BP,SP
1040:0345          1e                             PUSH DS
1040:0346          31ff                           XOR DI,DI
1040:0348          9aef036810                     CALLF 0x1068:03ef
1040:034d          7503                           JNZ 0x1040:0352
1040:034f          e98b00                         JMP 0x1040:03dd
LAB_1040_0352:
1040:0352          31c0                           XOR AX,AX
1040:0354          50                             PUSH AX
1040:0355          c47e06                         LES DI,[BP + 0x6]
1040:0358          06                             PUSH ES
1040:0359          57                             PUSH DI
1040:035a          9a02005010                     CALLF 0x1050:0002
1040:035f          c47e06                         LES DI,[BP + 0x6]
1040:0362          31c0                           XOR AX,AX
1040:0364          26894502                       MOV word ptr ES:[DI + 0x2],AX
1040:0368          31c0                           XOR AX,AX
1040:036a          26894504                       MOV word ptr ES:[DI + 0x4],AX
1040:036e          31c0                           XOR AX,AX
1040:0370          26894517                       MOV word ptr ES:[DI + 0x17],AX
1040:0374          8b460c                         MOV AX,word ptr [BP + 0xc]
1040:0377          8b560e                         MOV DX,word ptr [BP + 0xe]
1040:037a          26894506                       MOV word ptr ES:[DI + 0x6],AX
1040:037e          26895508                       MOV word ptr ES:[DI + 0x8],DX
1040:0382          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1040:0386          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1040:038a          740f                           JZ 0x1040:039b
1040:038c          06                             PUSH ES
1040:038d          57                             PUSH DI
1040:038e          26c47d06                       LES DI,ES:[DI + 0x6]
1040:0392          06                             PUSH ES
1040:0393          57                             PUSH DI
1040:0394          9ab4064010                     CALLF 0x1040:06b4
1040:0399          eb0d                           JMP 0x1040:03a8
LAB_1040_039b:
1040:039b          c47e06                         LES DI,[BP + 0x6]
1040:039e          31c0                           XOR AX,AX
1040:03a0          26894519                       MOV word ptr ES:[DI + 0x19],AX
1040:03a4          2689451b                       MOV word ptr ES:[DI + 0x1b],AX
LAB_1040_03a8:
1040:03a8          c47e06                         LES DI,[BP + 0x6]
1040:03ab          31c0                           XOR AX,AX
1040:03ad          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:03b1          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1040:03b5          31c0                           XOR AX,AX
1040:03b7          2689450e                       MOV word ptr ES:[DI + 0xe],AX
1040:03bb          26894510                       MOV word ptr ES:[DI + 0x10],AX
1040:03bf          06                             PUSH ES
1040:03c0          57                             PUSH DI
1040:03c1          9adc014010                     CALLF 0x1040:01dc
1040:03c6          c47e06                         LES DI,[BP + 0x6]
1040:03c9          26894512                       MOV word ptr ES:[DI + 0x12],AX
1040:03cd          26895514                       MOV word ptr ES:[DI + 0x14],DX
1040:03d1          26c6451600                     MOV byte ptr ES:[DI + 0x16],0x0
1040:03d6          06                             PUSH ES
1040:03d7          57                             PUSH DI
1040:03d8          9a0d064010                     CALLF 0x1040:060d
LAB_1040_03dd:
1040:03dd          c44606                         LES AX,[BP + 0x6]
1040:03e0          8cc2                           MOV DX,ES
1040:03e2          89ec                           MOV SP,BP
1040:03e4          5d                             POP BP
1040:03e5          4d                             DEC BP
1040:03e6          ca0a00                         RETF 0xa
FUN_1040_03e9:
1040:03e9          45                             INC BP
1040:03ea          55                             PUSH BP
1040:03eb          89e5                           MOV BP,SP
1040:03ed          1e                             PUSH DS
1040:03ee          c47e08                         LES DI,[BP + 0x8]
1040:03f1          06                             PUSH ES
1040:03f2          57                             PUSH DI
1040:03f3          9a1c005010                     CALLF 0x1050:001c
1040:03f8          89ec                           MOV SP,BP
1040:03fa          5d                             POP BP
1040:03fb          4d                             DEC BP
1040:03fc          ca0600                         RETF 0x6
FUN_1040_03ff:
1040:03ff          45                             INC BP
1040:0400          55                             PUSH BP
1040:0401          89e5                           MOV BP,SP
1040:0403          1e                             PUSH DS
1040:0404          c47e06                         LES DI,[BP + 0x6]
1040:0407          06                             PUSH ES
1040:0408          57                             PUSH DI
1040:0409          268b3d                         MOV DI,word ptr ES:[DI]
1040:040c          ff5d24                         CALLF [DI + 0x24]
1040:040f          bfe903                         MOV DI,0x3e9
1040:0412          b84010                         MOV AX,0x1040
1040:0415          50                             PUSH AX
1040:0416          57                             PUSH DI
1040:0417          c47e06                         LES DI,[BP + 0x6]
1040:041a          06                             PUSH ES
1040:041b          57                             PUSH DI
1040:041c          9a74084010                     CALLF 0x1040:0874
1040:0421          c47e06                         LES DI,[BP + 0x6]
1040:0424          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1040:0428          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1040:042c          740d                           JZ 0x1040:043b
1040:042e          06                             PUSH ES
1040:042f          57                             PUSH DI
1040:0430          26c47d06                       LES DI,ES:[DI + 0x6]
1040:0434          06                             PUSH ES
1040:0435          57                             PUSH DI
1040:0436          9a36074010                     CALLF 0x1040:0736
LAB_1040_043b:
1040:043b          c47e06                         LES DI,[BP + 0x6]
1040:043e          26ff7514                       PUSH word ptr ES:[DI + 0x14]
1040:0442          26ff7512                       PUSH word ptr ES:[DI + 0x12]
1040:0446          9afa024010                     CALLF 0x1040:02fa
1040:044b          31c0                           XOR AX,AX
1040:044d          50                             PUSH AX
1040:044e          c47e06                         LES DI,[BP + 0x6]
1040:0451          06                             PUSH ES
1040:0452          57                             PUSH DI
1040:0453          9a36005010                     CALLF 0x1050:0036
1040:0458          31ff                           XOR DI,DI
1040:045a          9a39046810                     CALLF 0x1068:0439
1040:045f          89ec                           MOV SP,BP
1040:0461          5d                             POP BP
1040:0462          4d                             DEC BP
1040:0463          ca0600                         RETF 0x6
FUN_1040_0466:
1040:0466          45                             INC BP
1040:0467          55                             PUSH BP
1040:0468          89e5                           MOV BP,SP
1040:046a          1e                             PUSH DS
1040:046b          83ec02                         SUB SP,0x2
1040:046e          8b7e06                         MOV DI,word ptr [BP + 0x6]
1040:0471          368b45fa                       MOV AX,word ptr SS:[DI + -0x6]
1040:0475          99                             CWD
1040:0476          8bc8                           MOV CX,AX
1040:0478          8bda                           MOV BX,DX
1040:047a          c47e08                         LES DI,[BP + 0x8]
1040:047d          268b4517                       MOV AX,word ptr ES:[DI + 0x17]
1040:0481          31d2                           XOR DX,DX
1040:0483          3bd3                           CMP DX,BX
1040:0485          7504                           JNZ 0x1040:048b
1040:0487          3bc1                           CMP AX,CX
1040:0489          7404                           JZ 0x1040:048f
LAB_1040_048b:
1040:048b          b000                           MOV AL,0x0
1040:048d          eb02                           JMP 0x1040:0491
LAB_1040_048f:
1040:048f          b001                           MOV AL,0x1
LAB_1040_0491:
1040:0491          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:0494          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:0497          89ec                           MOV SP,BP
1040:0499          5d                             POP BP
1040:049a          4d                             DEC BP
1040:049b          ca0600                         RETF 0x6
FUN_1040_049e:
1040:049e          45                             INC BP
1040:049f          55                             PUSH BP
1040:04a0          89e5                           MOV BP,SP
1040:04a2          1e                             PUSH DS
1040:04a3          83ec58                         SUB SP,0x58
1040:04a6          c47e08                         LES DI,[BP + 0x8]
1040:04a9          897ea6                         MOV word ptr [BP + -0x5a],DI
1040:04ac          8c46a8                         MOV word ptr [BP + -0x58],ES
1040:04af          6a04                           PUSH 0x4
1040:04b1          06                             PUSH ES
1040:04b2          57                             PUSH DI
1040:04b3          9a8d064010                     CALLF 0x1040:068d
1040:04b8          08c0                           OR AL,AL
1040:04ba          7413                           JZ 0x1040:04cf
1040:04bc          c47ea6                         LES DI,[BP + -0x5a]
1040:04bf          06                             PUSH ES
1040:04c0          57                             PUSH DI
1040:04c1          268b3d                         MOV DI,word ptr ES:[DI]
1040:04c4          ff5d20                         CALLF [DI + 0x20]
1040:04c7          08c0                           OR AL,AL
1040:04c9          7504                           JNZ 0x1040:04cf
1040:04cb          b000                           MOV AL,0x0
1040:04cd          eb02                           JMP 0x1040:04d1
LAB_1040_04cf:
1040:04cf          b001                           MOV AL,0x1
LAB_1040_04d1:
1040:04d1          8846fc                         MOV byte ptr [BP + -0x4],AL
1040:04d4          807efc00                       CMP byte ptr [BP + -0x4],0x0
1040:04d8          7434                           JZ 0x1040:050e
1040:04da          c47ea6                         LES DI,[BP + -0x5a]
1040:04dd          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:04e1          9a00015011                     CALLF 0x1150:0100
1040:04e6          09c0                           OR AX,AX
1040:04e8          7424                           JZ 0x1040:050e
1040:04ea          c47ea6                         LES DI,[BP + -0x5a]
1040:04ed          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:04f1          8d7eaa                         LEA DI,[BP + -0x56]
1040:04f4          16                             PUSH SS
1040:04f5          57                             PUSH DI
1040:04f6          6a51                           PUSH 0x51
1040:04f8          9a0c015011                     CALLF 0x1150:010c
1040:04fd          c47ea6                         LES DI,[BP + -0x5a]
1040:0500          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0504          8d7eaa                         LEA DI,[BP + -0x56]
1040:0507          16                             PUSH SS
1040:0508          57                             PUSH DI
1040:0509          9a10015011                     CALLF 0x1150:0110
LAB_1040_050e:
1040:050e          807efc00                       CMP byte ptr [BP + -0x4],0x0
1040:0512          b000                           MOV AL,0x0
1040:0514          7501                           JNZ 0x1040:0517
1040:0516          40                             INC AX
LAB_1040_0517:
1040:0517          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:051a          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:051d          89ec                           MOV SP,BP
1040:051f          5d                             POP BP
1040:0520          4d                             DEC BP
1040:0521          ca0600                         RETF 0x6
FUN_1040_0524:
1040:0524          45                             INC BP
1040:0525          55                             PUSH BP
1040:0526          89e5                           MOV BP,SP
1040:0528          1e                             PUSH DS
1040:0529          83ec02                         SUB SP,0x2
1040:052c          c47e08                         LES DI,[BP + 0x8]
1040:052f          26837d1700                     CMP word ptr ES:[DI + 0x17],0x0
1040:0534          7513                           JNZ 0x1040:0549
1040:0536          ff760a                         PUSH word ptr [BP + 0xa]
1040:0539          ff7608                         PUSH word ptr [BP + 0x8]
1040:053c          8b7e06                         MOV DI,word ptr [BP + 0x6]
1040:053f          57                             PUSH DI
1040:0540          9a9e044010                     CALLF 0x1040:049e
1040:0545          08c0                           OR AL,AL
1040:0547          7504                           JNZ 0x1040:054d
LAB_1040_0549:
1040:0549          b000                           MOV AL,0x0
1040:054b          eb02                           JMP 0x1040:054f
LAB_1040_054d:
1040:054d          b001                           MOV AL,0x1
LAB_1040_054f:
1040:054f          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:0552          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:0555          89ec                           MOV SP,BP
1040:0557          5d                             POP BP
1040:0558          4d                             DEC BP
1040:0559          ca0600                         RETF 0x6
FUN_1040_055c:
1040:055c          45                             INC BP
1040:055d          55                             PUSH BP
1040:055e          89e5                           MOV BP,SP
1040:0560          1e                             PUSH DS
1040:0561          83ec0a                         SUB SP,0xa
1040:0564          c746fa0100                     MOV word ptr [BP + -0x6],0x1
1040:0569          c646f500                       MOV byte ptr [BP + -0xb],0x0
LAB_1040_056d:
1040:056d          bf6604                         MOV DI,0x466
1040:0570          b84010                         MOV AX,0x1040
1040:0573          50                             PUSH AX
1040:0574          57                             PUSH DI
1040:0575          c47e06                         LES DI,[BP + 0x6]
1040:0578          06                             PUSH ES
1040:0579          57                             PUSH DI
1040:057a          9a27084010                     CALLF 0x1040:0827
1040:057f          8946f6                         MOV word ptr [BP + -0xa],AX
1040:0582          8956f8                         MOV word ptr [BP + -0x8],DX
1040:0585          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:0588          0b46f8                         OR AX,word ptr [BP + -0x8]
1040:058b          740f                           JZ 0x1040:059c
1040:058d          ff76f8                         PUSH word ptr [BP + -0x8]
1040:0590          ff76f6                         PUSH word ptr [BP + -0xa]
1040:0593          55                             PUSH BP
1040:0594          9a9e044010                     CALLF 0x1040:049e
1040:0599          8846f5                         MOV byte ptr [BP + -0xb],AL
LAB_1040_059c:
1040:059c          ff46fa                         INC word ptr [BP + -0x6]
1040:059f          807ef500                       CMP byte ptr [BP + -0xb],0x0
1040:05a3          7508                           JNZ 0x1040:05ad
1040:05a5          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:05a8          0b46f8                         OR AX,word ptr [BP + -0x8]
1040:05ab          75c0                           JNZ 0x1040:056d
LAB_1040_05ad:
1040:05ad          807ef500                       CMP byte ptr [BP + -0xb],0x0
1040:05b1          7516                           JNZ 0x1040:05c9
1040:05b3          bf2405                         MOV DI,0x524
1040:05b6          b84010                         MOV AX,0x1040
1040:05b9          50                             PUSH AX
1040:05ba          57                             PUSH DI
1040:05bb          c47e06                         LES DI,[BP + 0x6]
1040:05be          06                             PUSH ES
1040:05bf          57                             PUSH DI
1040:05c0          9a27084010                     CALLF 0x1040:0827
1040:05c5          09d0                           OR AX,DX
1040:05c7          7404                           JZ 0x1040:05cd
LAB_1040_05c9:
1040:05c9          b000                           MOV AL,0x0
1040:05cb          eb02                           JMP 0x1040:05cf
LAB_1040_05cd:
1040:05cd          b001                           MOV AL,0x1
LAB_1040_05cf:
1040:05cf          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:05d2          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:05d5          89ec                           MOV SP,BP
1040:05d7          5d                             POP BP
1040:05d8          4d                             DEC BP
1040:05d9          ca0400                         RETF 0x4
FUN_1040_05dc:
1040:05dc          45                             INC BP
1040:05dd          55                             PUSH BP
1040:05de          89e5                           MOV BP,SP
1040:05e0          1e                             PUSH DS
1040:05e1          83ec02                         SUB SP,0x2
1040:05e4          31c0                           XOR AX,AX
1040:05e6          8946fc                         MOV word ptr [BP + -0x4],AX
1040:05e9          8b46fc                         MOV AX,word ptr [BP + -0x4]
1040:05ec          89ec                           MOV SP,BP
1040:05ee          5d                             POP BP
1040:05ef          4d                             DEC BP
1040:05f0          ca0a00                         RETF 0xa
FUN_1040_05f3:
1040:05f3          45                             INC BP
1040:05f4          55                             PUSH BP
1040:05f5          89e5                           MOV BP,SP
1040:05f7          1e                             PUSH DS
1040:05f8          6a01                           PUSH 0x1
1040:05fa          6a01                           PUSH 0x1
1040:05fc          c47e06                         LES DI,[BP + 0x6]
1040:05ff          06                             PUSH ES
1040:0600          57                             PUSH DI
1040:0601          9a5b064010                     CALLF 0x1040:065b
1040:0606          89ec                           MOV SP,BP
1040:0608          5d                             POP BP
1040:0609          4d                             DEC BP
1040:060a          ca0400                         RETF 0x4
FUN_1040_060d:
1040:060d          45                             INC BP
1040:060e          55                             PUSH BP
1040:060f          89e5                           MOV BP,SP
1040:0611          1e                             PUSH DS
1040:0612          6a04                           PUSH 0x4
1040:0614          6a01                           PUSH 0x1
1040:0616          c47e06                         LES DI,[BP + 0x6]
1040:0619          06                             PUSH ES
1040:061a          57                             PUSH DI
1040:061b          9a5b064010                     CALLF 0x1040:065b
1040:0620          89ec                           MOV SP,BP
1040:0622          5d                             POP BP
1040:0623          4d                             DEC BP
1040:0624          ca0400                         RETF 0x4
FUN_1040_0627:
1040:0627          45                             INC BP
1040:0628          55                             PUSH BP
1040:0629          89e5                           MOV BP,SP
1040:062b          1e                             PUSH DS
1040:062c          6a10                           PUSH 0x10
1040:062e          6a01                           PUSH 0x1
1040:0630          c47e06                         LES DI,[BP + 0x6]
1040:0633          06                             PUSH ES
1040:0634          57                             PUSH DI
1040:0635          9a5b064010                     CALLF 0x1040:065b
1040:063a          89ec                           MOV SP,BP
1040:063c          5d                             POP BP
1040:063d          4d                             DEC BP
1040:063e          ca0400                         RETF 0x4
FUN_1040_0641:
1040:0641          45                             INC BP
1040:0642          55                             PUSH BP
1040:0643          89e5                           MOV BP,SP
1040:0645          1e                             PUSH DS
1040:0646          6a04                           PUSH 0x4
1040:0648          6a00                           PUSH 0x0
1040:064a          c47e06                         LES DI,[BP + 0x6]
1040:064d          06                             PUSH ES
1040:064e          57                             PUSH DI
1040:064f          9a5b064010                     CALLF 0x1040:065b
1040:0654          89ec                           MOV SP,BP
1040:0656          5d                             POP BP
1040:0657          4d                             DEC BP
1040:0658          ca0400                         RETF 0x4
FUN_1040_065b:
1040:065b          45                             INC BP
1040:065c          55                             PUSH BP
1040:065d          89e5                           MOV BP,SP
1040:065f          1e                             PUSH DS
1040:0660          807e0a00                       CMP byte ptr [BP + 0xa],0x0
1040:0664          7410                           JZ 0x1040:0676
1040:0666          c47e06                         LES DI,[BP + 0x6]
1040:0669          268a4516                       MOV AL,byte ptr ES:[DI + 0x16]
1040:066d          0a460c                         OR AL,byte ptr [BP + 0xc]
1040:0670          26884516                       MOV byte ptr ES:[DI + 0x16],AL
1040:0674          eb10                           JMP 0x1040:0686
LAB_1040_0676:
1040:0676          8a460c                         MOV AL,byte ptr [BP + 0xc]
1040:0679          f6d0                           NOT AL
1040:067b          c47e06                         LES DI,[BP + 0x6]
1040:067e          26224516                       AND AL,byte ptr ES:[DI + 0x16]
1040:0682          26884516                       MOV byte ptr ES:[DI + 0x16],AL
LAB_1040_0686:
1040:0686          89ec                           MOV SP,BP
1040:0688          5d                             POP BP
1040:0689          4d                             DEC BP
1040:068a          ca0800                         RETF 0x8
FUN_1040_068d:
1040:068d          45                             INC BP
1040:068e          55                             PUSH BP
1040:068f          89e5                           MOV BP,SP
1040:0691          1e                             PUSH DS
1040:0692          83ec02                         SUB SP,0x2
1040:0695          c47e06                         LES DI,[BP + 0x6]
1040:0698          268a4516                       MOV AL,byte ptr ES:[DI + 0x16]
1040:069c          22460a                         AND AL,byte ptr [BP + 0xa]
1040:069f          3a460a                         CMP AL,byte ptr [BP + 0xa]
1040:06a2          b000                           MOV AL,0x0
1040:06a4          7501                           JNZ 0x1040:06a7
1040:06a6          40                             INC AX
LAB_1040_06a7:
1040:06a7          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:06aa          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:06ad          89ec                           MOV SP,BP
1040:06af          5d                             POP BP
1040:06b0          4d                             DEC BP
1040:06b1          ca0600                         RETF 0x6
FUN_1040_06b4:
1040:06b4          45                             INC BP
1040:06b5          55                             PUSH BP
1040:06b6          89e5                           MOV BP,SP
1040:06b8          1e                             PUSH DS
1040:06b9          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:06bc          0b460c                         OR AX,word ptr [BP + 0xc]
1040:06bf          746e                           JZ 0x1040:072f
1040:06c1          c47e06                         LES DI,[BP + 0x6]
1040:06c4          268b450a                       MOV AX,word ptr ES:[DI + 0xa]
1040:06c8          260b450c                       OR AX,word ptr ES:[DI + 0xc]
1040:06cc          7521                           JNZ 0x1040:06ef
1040:06ce          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:06d1          8b560c                         MOV DX,word ptr [BP + 0xc]
1040:06d4          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:06d8          2689550c                       MOV word ptr ES:[DI + 0xc],DX
1040:06dc          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:06df          8b560c                         MOV DX,word ptr [BP + 0xc]
1040:06e2          c47e0a                         LES DI,[BP + 0xa]
1040:06e5          26894519                       MOV word ptr ES:[DI + 0x19],AX
1040:06e9          2689551b                       MOV word ptr ES:[DI + 0x1b],DX
1040:06ed          eb40                           JMP 0x1040:072f
LAB_1040_06ef:
1040:06ef          c47e06                         LES DI,[BP + 0x6]
1040:06f2          26c47d0a                       LES DI,ES:[DI + 0xa]
1040:06f6          268b4519                       MOV AX,word ptr ES:[DI + 0x19]
1040:06fa          268b551b                       MOV DX,word ptr ES:[DI + 0x1b]
1040:06fe          c47e0a                         LES DI,[BP + 0xa]
1040:0701          26894519                       MOV word ptr ES:[DI + 0x19],AX
1040:0705          2689551b                       MOV word ptr ES:[DI + 0x1b],DX
1040:0709          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:070c          8b560c                         MOV DX,word ptr [BP + 0xc]
1040:070f          c47e06                         LES DI,[BP + 0x6]
1040:0712          26c47d0a                       LES DI,ES:[DI + 0xa]
1040:0716          26894519                       MOV word ptr ES:[DI + 0x19],AX
1040:071a          2689551b                       MOV word ptr ES:[DI + 0x1b],DX
1040:071e          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:0721          8b560c                         MOV DX,word ptr [BP + 0xc]
1040:0724          c47e06                         LES DI,[BP + 0x6]
1040:0727          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:072b          2689550c                       MOV word ptr ES:[DI + 0xc],DX
LAB_1040_072f:
1040:072f          89ec                           MOV SP,BP
1040:0731          5d                             POP BP
1040:0732          4d                             DEC BP
1040:0733          ca0800                         RETF 0x8
FUN_1040_0736:
1040:0736          45                             INC BP
1040:0737          55                             PUSH BP
1040:0738          89e5                           MOV BP,SP
1040:073a          1e                             PUSH DS
1040:073b          83ec08                         SUB SP,0x8
1040:073e          c47e06                         LES DI,[BP + 0x6]
1040:0741          268b450a                       MOV AX,word ptr ES:[DI + 0xa]
1040:0745          260b450c                       OR AX,word ptr ES:[DI + 0xc]
1040:0749          7503                           JNZ 0x1040:074e
1040:074b          e9d200                         JMP 0x1040:0820
LAB_1040_074e:
1040:074e          268b450a                       MOV AX,word ptr ES:[DI + 0xa]
1040:0752          268b550c                       MOV DX,word ptr ES:[DI + 0xc]
1040:0756          8946fa                         MOV word ptr [BP + -0x6],AX
1040:0759          8956fc                         MOV word ptr [BP + -0x4],DX
1040:075c          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:075f          8b56fc                         MOV DX,word ptr [BP + -0x4]
1040:0762          8946f6                         MOV word ptr [BP + -0xa],AX
1040:0765          8956f8                         MOV word ptr [BP + -0x8],DX
LAB_1040_0768:
1040:0768          c47ef6                         LES DI,[BP + -0xa]
1040:076b          268b4519                       MOV AX,word ptr ES:[DI + 0x19]
1040:076f          268b551b                       MOV DX,word ptr ES:[DI + 0x1b]
1040:0773          3b56fc                         CMP DX,word ptr [BP + -0x4]
1040:0776          7505                           JNZ 0x1040:077d
1040:0778          3b46fa                         CMP AX,word ptr [BP + -0x6]
1040:077b          7428                           JZ 0x1040:07a5
LAB_1040_077d:
1040:077d          c47ef6                         LES DI,[BP + -0xa]
1040:0780          268b4519                       MOV AX,word ptr ES:[DI + 0x19]
1040:0784          268b551b                       MOV DX,word ptr ES:[DI + 0x1b]
1040:0788          3b560c                         CMP DX,word ptr [BP + 0xc]
1040:078b          7505                           JNZ 0x1040:0792
1040:078d          3b460a                         CMP AX,word ptr [BP + 0xa]
1040:0790          7413                           JZ 0x1040:07a5
LAB_1040_0792:
1040:0792          c47ef6                         LES DI,[BP + -0xa]
1040:0795          268b4519                       MOV AX,word ptr ES:[DI + 0x19]
1040:0799          268b551b                       MOV DX,word ptr ES:[DI + 0x1b]
1040:079d          8946f6                         MOV word ptr [BP + -0xa],AX
1040:07a0          8956f8                         MOV word ptr [BP + -0x8],DX
1040:07a3          ebc3                           JMP 0x1040:0768
LAB_1040_07a5:
1040:07a5          c47ef6                         LES DI,[BP + -0xa]
1040:07a8          268b4519                       MOV AX,word ptr ES:[DI + 0x19]
1040:07ac          268b551b                       MOV DX,word ptr ES:[DI + 0x1b]
1040:07b0          3b560c                         CMP DX,word ptr [BP + 0xc]
1040:07b3          756b                           JNZ 0x1040:0820
1040:07b5          3b460a                         CMP AX,word ptr [BP + 0xa]
1040:07b8          7566                           JNZ 0x1040:0820
1040:07ba          c47ef6                         LES DI,[BP + -0xa]
1040:07bd          268b4519                       MOV AX,word ptr ES:[DI + 0x19]
1040:07c1          268b551b                       MOV DX,word ptr ES:[DI + 0x1b]
1040:07c5          3b56f8                         CMP DX,word ptr [BP + -0x8]
1040:07c8          7514                           JNZ 0x1040:07de
1040:07ca          3b46f6                         CMP AX,word ptr [BP + -0xa]
1040:07cd          750f                           JNZ 0x1040:07de
1040:07cf          c47e06                         LES DI,[BP + 0x6]
1040:07d2          31c0                           XOR AX,AX
1040:07d4          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:07d8          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1040:07dc          eb42                           JMP 0x1040:0820
LAB_1040_07de:
1040:07de          c47ef6                         LES DI,[BP + -0xa]
1040:07e1          268b4519                       MOV AX,word ptr ES:[DI + 0x19]
1040:07e5          268b551b                       MOV DX,word ptr ES:[DI + 0x1b]
1040:07e9          c47e06                         LES DI,[BP + 0x6]
1040:07ec          263b550c                       CMP DX,word ptr ES:[DI + 0xc]
1040:07f0          7514                           JNZ 0x1040:0806
1040:07f2          263b450a                       CMP AX,word ptr ES:[DI + 0xa]
1040:07f6          750e                           JNZ 0x1040:0806
1040:07f8          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:07fb          8b56f8                         MOV DX,word ptr [BP + -0x8]
1040:07fe          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:0802          2689550c                       MOV word ptr ES:[DI + 0xc],DX
LAB_1040_0806:
1040:0806          c47ef6                         LES DI,[BP + -0xa]
1040:0809          26c47d19                       LES DI,ES:[DI + 0x19]
1040:080d          268b4519                       MOV AX,word ptr ES:[DI + 0x19]
1040:0811          268b551b                       MOV DX,word ptr ES:[DI + 0x1b]
1040:0815          c47ef6                         LES DI,[BP + -0xa]
1040:0818          26894519                       MOV word ptr ES:[DI + 0x19],AX
1040:081c          2689551b                       MOV word ptr ES:[DI + 0x1b],DX
LAB_1040_0820:
1040:0820          89ec                           MOV SP,BP
1040:0822          5d                             POP BP
1040:0823          4d                             DEC BP
1040:0824          ca0800                         RETF 0x8
FUN_1040_0827:
1040:0827          45                             INC BP
1040:0828          55                             PUSH BP
1040:0829          89e5                           MOV BP,SP
1040:082b          1e                             PUSH DS
1040:082c          83ec04                         SUB SP,0x4
1040:082f          c47e06                         LES DI,[BP + 0x6]
1040:0832          26c47d0a                       LES DI,ES:[DI + 0xa]
1040:0836          8cc0                           MOV AX,ES
1040:0838          09f8                           OR AX,DI
1040:083a          742d                           JZ 0x1040:0869
1040:083c          897efa                         MOV word ptr [BP + -0x6],DI
1040:083f          8c46fc                         MOV word ptr [BP + -0x4],ES
LAB_1040_0842:
1040:0842          26c47d19                       LES DI,ES:[DI + 0x19]
1040:0846          06                             PUSH ES
1040:0847          57                             PUSH DI
1040:0848          06                             PUSH ES
1040:0849          57                             PUSH DI
1040:084a          8b4600                         MOV AX,word ptr [BP + 0x0]
1040:084d          24fe                           AND AL,0xfe
1040:084f          50                             PUSH AX
1040:0850          ff5e0a                         CALLF [BP + 0xa]
1040:0853          5f                             POP DI
1040:0854          07                             POP ES
1040:0855          08c0                           OR AL,AL
1040:0857          7510                           JNZ 0x1040:0869
1040:0859          3b7efa                         CMP DI,word ptr [BP + -0x6]
1040:085c          75e4                           JNZ 0x1040:0842
1040:085e          8cc0                           MOV AX,ES
1040:0860          3b46fc                         CMP AX,word ptr [BP + -0x4]
1040:0863          75dd                           JNZ 0x1040:0842
1040:0865          31ff                           XOR DI,DI
1040:0867          8ec7                           MOV DI,ES
LAB_1040_0869:
1040:0869          89f8                           MOV AX,DI
1040:086b          8cc2                           MOV DX,ES
1040:086d          89ec                           MOV SP,BP
1040:086f          5d                             POP BP
1040:0870          4d                             DEC BP
1040:0871          ca0800                         RETF 0x8
FUN_1040_0874:
1040:0874          45                             INC BP
1040:0875          55                             PUSH BP
1040:0876          89e5                           MOV BP,SP
1040:0878          1e                             PUSH DS
1040:0879          83ec04                         SUB SP,0x4
1040:087c          c47e06                         LES DI,[BP + 0x6]
1040:087f          26c47d0a                       LES DI,ES:[DI + 0xa]
1040:0883          8cc0                           MOV AX,ES
1040:0885          09f8                           OR AX,DI
1040:0887          7436                           JZ 0x1040:08bf
1040:0889          897efa                         MOV word ptr [BP + -0x6],DI
1040:088c          8c46fc                         MOV word ptr [BP + -0x4],ES
1040:088f          26c47d19                       LES DI,ES:[DI + 0x19]
LAB_1040_0893:
1040:0893          3b7efa                         CMP DI,word ptr [BP + -0x6]
1040:0896          7507                           JNZ 0x1040:089f
1040:0898          8cc0                           MOV AX,ES
1040:089a          3b46fc                         CMP AX,word ptr [BP + -0x4]
1040:089d          7417                           JZ 0x1040:08b6
LAB_1040_089f:
1040:089f          26ff751b                       PUSH word ptr ES:[DI + 0x1b]
1040:08a3          26ff7519                       PUSH word ptr ES:[DI + 0x19]
1040:08a7          06                             PUSH ES
1040:08a8          57                             PUSH DI
1040:08a9          8b4600                         MOV AX,word ptr [BP + 0x0]
1040:08ac          24fe                           AND AL,0xfe
1040:08ae          50                             PUSH AX
1040:08af          ff5e0a                         CALLF [BP + 0xa]
1040:08b2          5f                             POP DI
1040:08b3          07                             POP ES
1040:08b4          ebdd                           JMP 0x1040:0893
LAB_1040_08b6:
1040:08b6          8b4600                         MOV AX,word ptr [BP + 0x0]
1040:08b9          24fe                           AND AL,0xfe
1040:08bb          50                             PUSH AX
1040:08bc          ff5e0a                         CALLF [BP + 0xa]
LAB_1040_08bf:
1040:08bf          89ec                           MOV SP,BP
1040:08c1          5d                             POP BP
1040:08c2          4d                             DEC BP
1040:08c3          ca0800                         RETF 0x8
FUN_1040_08c6:
1040:08c6          45                             INC BP
1040:08c7          55                             PUSH BP
1040:08c8          89e5                           MOV BP,SP
1040:08ca          1e                             PUSH DS
1040:08cb          83ec02                         SUB SP,0x2
1040:08ce          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1040:08d3          8b46fc                         MOV AX,word ptr [BP + -0x4]
1040:08d6          89ec                           MOV SP,BP
1040:08d8          5d                             POP BP
1040:08d9          4d                             DEC BP
1040:08da          ca0400                         RETF 0x4
FUN_1040_08dd:
1040:08dd          45                             INC BP
1040:08de          55                             PUSH BP
1040:08df          89e5                           MOV BP,SP
1040:08e1          1e                             PUSH DS
1040:08e2          8b5606                         MOV DX,word ptr [BP + 0x6]
1040:08e5          8b4608                         MOV AX,word ptr [BP + 0x8]
1040:08e8          c47e0a                         LES DI,[BP + 0xa]
1040:08eb          06                             PUSH ES
1040:08ec          57                             PUSH DI
1040:08ed          c45e0e                         LES BX,[BP + 0xe]
1040:08f0          06                             PUSH ES
1040:08f1          53                             PUSH BX
1040:08f2          268b1f                         MOV BX,word ptr ES:[BX]
1040:08f5          e80af7                         CALL 0x1040:0002
1040:08f8          8b0e5818                       MOV CX,word ptr [0x1858]
1040:08fc          e303                           JCXZ 0x1040:0901
1040:08fe          e802f8                         CALL 0x1040:0103
LAB_1040_0901:
1040:0901          ff1d                           CALLF [DI]
1040:0903          89ec                           MOV SP,BP
1040:0905          5d                             POP BP
1040:0906          4d                             DEC BP
1040:0907          ca0c00                         RETF 0xc
FUN_1040_090a:
1040:090a          45                             INC BP
1040:090b          55                             PUSH BP
1040:090c          89e5                           MOV BP,SP
1040:090e          1e                             PUSH DS
1040:090f          83ec08                         SUB SP,0x8
1040:0912          6a01                           PUSH 0x1
1040:0914          c47e06                         LES DI,[BP + 0x6]
1040:0917          06                             PUSH ES
1040:0918          57                             PUSH DI
1040:0919          9a8d064010                     CALLF 0x1040:068d
1040:091e          08c0                           OR AL,AL
1040:0920          7451                           JZ 0x1040:0973
1040:0922          c47e0a                         LES DI,[BP + 0xa]
1040:0925          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1040:0929          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1040:092d          7544                           JNZ 0x1040:0973
1040:092f          c47e06                         LES DI,[BP + 0x6]
1040:0932          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0936          c47e0a                         LES DI,[BP + 0xa]
1040:0939          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:093d          9a58015011                     CALLF 0x1150:0158
1040:0942          8946fa                         MOV word ptr [BP + -0x6],AX
1040:0945          837efa00                       CMP word ptr [BP + -0x6],0x0
1040:0949          7428                           JZ 0x1040:0973
1040:094b          ff76fa                         PUSH word ptr [BP + -0x6]
1040:094e          688700                         PUSH 0x87
1040:0951          6a00                           PUSH 0x0
1040:0953          6a00                           PUSH 0x0
1040:0955          6a00                           PUSH 0x0
1040:0957          9a7c015011                     CALLF 0x1150:017c
1040:095c          253000                         AND AX,0x30
1040:095f          09c0                           OR AX,AX
1040:0961          7410                           JZ 0x1040:0973
1040:0963          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:0966          c47e0a                         LES DI,[BP + 0xa]
1040:0969          26894506                       MOV word ptr ES:[DI + 0x6],AX
1040:096d          31c0                           XOR AX,AX
1040:096f          26894508                       MOV word ptr ES:[DI + 0x8],AX
LAB_1040_0973:
1040:0973          c47e0a                         LES DI,[BP + 0xa]
1040:0976          26837d0600                     CMP word ptr ES:[DI + 0x6],0x0
1040:097b          7403                           JZ 0x1040:0980
1040:097d          e99700                         JMP 0x1040:0a17
LAB_1040_0980:
1040:0980          26817d040060                   CMP word ptr ES:[DI + 0x4],0x6000
1040:0986          737c                           JNC 0x1040:0a04
1040:0988          9aec005011                     CALLF 0x1150:00ec
1040:098d          8946fc                         MOV word ptr [BP + -0x4],AX
1040:0990          ff76fc                         PUSH word ptr [BP + -0x4]
1040:0993          9a97004010                     CALLF 0x1040:0097
1040:0998          8946f6                         MOV word ptr [BP + -0xa],AX
1040:099b          8956f8                         MOV word ptr [BP + -0x8],DX
LAB_1040_099e:
1040:099e          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:09a1          0b46f8                         OR AX,word ptr [BP + -0x8]
1040:09a4          752d                           JNZ 0x1040:09d3
1040:09a6          837efc00                       CMP word ptr [BP + -0x4],0x0
1040:09aa          7427                           JZ 0x1040:09d3
1040:09ac          8b46fc                         MOV AX,word ptr [BP + -0x4]
1040:09af          c47e06                         LES DI,[BP + 0x6]
1040:09b2          263b4504                       CMP AX,word ptr ES:[DI + 0x4]
1040:09b6          741b                           JZ 0x1040:09d3
1040:09b8          ff76fc                         PUSH word ptr [BP + -0x4]
1040:09bb          9a24015011                     CALLF 0x1150:0124
1040:09c0          8946fc                         MOV word ptr [BP + -0x4],AX
1040:09c3          ff76fc                         PUSH word ptr [BP + -0x4]
1040:09c6          9a97004010                     CALLF 0x1040:0097
1040:09cb          8946f6                         MOV word ptr [BP + -0xa],AX
1040:09ce          8956f8                         MOV word ptr [BP + -0x8],DX
1040:09d1          ebcb                           JMP 0x1040:099e
LAB_1040_09d3:
1040:09d3          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:09d6          0b46f8                         OR AX,word ptr [BP + -0x8]
1040:09d9          750d                           JNZ 0x1040:09e8
1040:09db          c47e06                         LES DI,[BP + 0x6]
1040:09de          89f8                           MOV AX,DI
1040:09e0          8cc2                           MOV DX,ES
1040:09e2          8946f6                         MOV word ptr [BP + -0xa],AX
1040:09e5          8956f8                         MOV word ptr [BP + -0x8],DX
LAB_1040_09e8:
1040:09e8          ff76f8                         PUSH word ptr [BP + -0x8]
1040:09eb          ff76f6                         PUSH word ptr [BP + -0xa]
1040:09ee          c47e0a                         LES DI,[BP + 0xa]
1040:09f1          06                             PUSH ES
1040:09f2          57                             PUSH DI
1040:09f3          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1040:09f7          0500a0                         ADD AX,0xa000
1040:09fa          50                             PUSH AX
1040:09fb          6a10                           PUSH 0x10
1040:09fd          9add084010                     CALLF 0x1040:08dd
1040:0a02          eb10                           JMP 0x1040:0a14
LAB_1040_0a04:
1040:0a04          c47e0a                         LES DI,[BP + 0xa]
1040:0a07          06                             PUSH ES
1040:0a08          57                             PUSH DI
1040:0a09          c47e06                         LES DI,[BP + 0x6]
1040:0a0c          06                             PUSH ES
1040:0a0d          57                             PUSH DI
1040:0a0e          268b3d                         MOV DI,word ptr ES:[DI]
1040:0a11          ff5d0c                         CALLF [DI + 0xc]
LAB_1040_0a14:
1040:0a14          e98100                         JMP 0x1040:0a98
LAB_1040_0a17:
1040:0a17          c47e06                         LES DI,[BP + 0x6]
1040:0a1a          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0a1e          c47e0a                         LES DI,[BP + 0xa]
1040:0a21          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0a25          9a58015011                     CALLF 0x1150:0158
1040:0a2a          50                             PUSH AX
1040:0a2b          9a97004010                     CALLF 0x1040:0097
1040:0a30          8946f6                         MOV word ptr [BP + -0xa],AX
1040:0a33          8956f8                         MOV word ptr [BP + -0x8],DX
1040:0a36          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:0a39          0b46f8                         OR AX,word ptr [BP + -0x8]
1040:0a3c          7424                           JZ 0x1040:0a62
1040:0a3e          c47e0a                         LES DI,[BP + 0xa]
1040:0a41          26817d080010                   CMP word ptr ES:[DI + 0x8],0x1000
1040:0a47          7319                           JNC 0x1040:0a62
1040:0a49          ff76f8                         PUSH word ptr [BP + -0x8]
1040:0a4c          ff76f6                         PUSH word ptr [BP + -0xa]
1040:0a4f          06                             PUSH ES
1040:0a50          57                             PUSH DI
1040:0a51          268b4508                       MOV AX,word ptr ES:[DI + 0x8]
1040:0a55          050090                         ADD AX,0x9000
1040:0a58          50                             PUSH AX
1040:0a59          6a18                           PUSH 0x18
1040:0a5b          9add084010                     CALLF 0x1040:08dd
1040:0a60          eb36                           JMP 0x1040:0a98
LAB_1040_0a62:
1040:0a62          c47e0a                         LES DI,[BP + 0xa]
1040:0a65          26817d040010                   CMP word ptr ES:[DI + 0x4],0x1000
1040:0a6b          731b                           JNC 0x1040:0a88
1040:0a6d          c47e06                         LES DI,[BP + 0x6]
1040:0a70          06                             PUSH ES
1040:0a71          57                             PUSH DI
1040:0a72          c47e0a                         LES DI,[BP + 0xa]
1040:0a75          06                             PUSH ES
1040:0a76          57                             PUSH DI
1040:0a77          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1040:0a7b          050080                         ADD AX,0x8000
1040:0a7e          50                             PUSH AX
1040:0a7f          6a14                           PUSH 0x14
1040:0a81          9add084010                     CALLF 0x1040:08dd
1040:0a86          eb10                           JMP 0x1040:0a98
LAB_1040_0a88:
1040:0a88          c47e0a                         LES DI,[BP + 0xa]
1040:0a8b          06                             PUSH ES
1040:0a8c          57                             PUSH DI
1040:0a8d          c47e06                         LES DI,[BP + 0x6]
1040:0a90          06                             PUSH ES
1040:0a91          57                             PUSH DI
1040:0a92          268b3d                         MOV DI,word ptr ES:[DI]
1040:0a95          ff5d14                         CALLF [DI + 0x14]
LAB_1040_0a98:
1040:0a98          89ec                           MOV SP,BP
1040:0a9a          5d                             POP BP
1040:0a9b          4d                             DEC BP
1040:0a9c          ca0800                         RETF 0x8
FUN_1040_0a9f:
1040:0a9f          45                             INC BP
1040:0aa0          55                             PUSH BP
1040:0aa1          89e5                           MOV BP,SP
1040:0aa3          1e                             PUSH DS
1040:0aa4          83ec08                         SUB SP,0x8
1040:0aa7          c47e0a                         LES DI,[BP + 0xa]
1040:0aaa          26837d0800                     CMP word ptr ES:[DI + 0x8],0x0
1040:0aaf          7477                           JZ 0x1040:0b28
1040:0ab1          26ff7508                       PUSH word ptr ES:[DI + 0x8]
1040:0ab5          9a97004010                     CALLF 0x1040:0097
1040:0aba          8946f8                         MOV word ptr [BP + -0x8],AX
1040:0abd          8956fa                         MOV word ptr [BP + -0x6],DX
1040:0ac0          8b46f8                         MOV AX,word ptr [BP + -0x8]
1040:0ac3          0b46fa                         OR AX,word ptr [BP + -0x6]
1040:0ac6          741c                           JZ 0x1040:0ae4
1040:0ac8          ff76fa                         PUSH word ptr [BP + -0x6]
1040:0acb          ff76f8                         PUSH word ptr [BP + -0x8]
1040:0ace          c47e0a                         LES DI,[BP + 0xa]
1040:0ad1          06                             PUSH ES
1040:0ad2          57                             PUSH DI
1040:0ad3          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1040:0ad7          050090                         ADD AX,0x9000
1040:0ada          50                             PUSH AX
1040:0adb          6a18                           PUSH 0x18
1040:0add          9add084010                     CALLF 0x1040:08dd
1040:0ae2          eb42                           JMP 0x1040:0b26
LAB_1040_0ae4:
1040:0ae4          c47e0a                         LES DI,[BP + 0xa]
1040:0ae7          26ff7508                       PUSH word ptr ES:[DI + 0x8]
1040:0aeb          6af4                           PUSH -0xc
1040:0aed          9a94015011                     CALLF 0x1150:0194
1040:0af2          8946f6                         MOV word ptr [BP + -0xa],AX
1040:0af5          817ef60010                     CMP word ptr [BP + -0xa],0x1000
1040:0afa          731a                           JNC 0x1040:0b16
1040:0afc          c47e06                         LES DI,[BP + 0x6]
1040:0aff          06                             PUSH ES
1040:0b00          57                             PUSH DI
1040:0b01          c47e0a                         LES DI,[BP + 0xa]
1040:0b04          06                             PUSH ES
1040:0b05          57                             PUSH DI
1040:0b06          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:0b09          050080                         ADD AX,0x8000
1040:0b0c          50                             PUSH AX
1040:0b0d          6a14                           PUSH 0x14
1040:0b0f          9add084010                     CALLF 0x1040:08dd
1040:0b14          eb10                           JMP 0x1040:0b26
LAB_1040_0b16:
1040:0b16          c47e0a                         LES DI,[BP + 0xa]
1040:0b19          06                             PUSH ES
1040:0b1a          57                             PUSH DI
1040:0b1b          c47e06                         LES DI,[BP + 0x6]
1040:0b1e          06                             PUSH ES
1040:0b1f          57                             PUSH DI
1040:0b20          268b3d                         MOV DI,word ptr ES:[DI]
1040:0b23          ff5d14                         CALLF [DI + 0x14]
LAB_1040_0b26:
1040:0b26          eb10                           JMP 0x1040:0b38
LAB_1040_0b28:
1040:0b28          c47e0a                         LES DI,[BP + 0xa]
1040:0b2b          06                             PUSH ES
1040:0b2c          57                             PUSH DI
1040:0b2d          c47e06                         LES DI,[BP + 0x6]
1040:0b30          06                             PUSH ES
1040:0b31          57                             PUSH DI
1040:0b32          268b3d                         MOV DI,word ptr ES:[DI]
1040:0b35          ff5d0c                         CALLF [DI + 0xc]
LAB_1040_0b38:
1040:0b38          89ec                           MOV SP,BP
1040:0b3a          5d                             POP BP
1040:0b3b          4d                             DEC BP
1040:0b3c          ca0800                         RETF 0x8
FUN_1040_0b3f:
1040:0b3f          45                             INC BP
1040:0b40          55                             PUSH BP
1040:0b41          89e5                           MOV BP,SP
1040:0b43          1e                             PUSH DS
1040:0b44          c47e06                         LES DI,[BP + 0x6]
1040:0b47          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0b4b          6af0                           PUSH -0x10
1040:0b4d          9a98015011                     CALLF 0x1150:0198
1040:0b52          250000                         AND AX,0x0
1040:0b55          81e22000                       AND DX,0x20
1040:0b59          09d0                           OR AX,DX
1040:0b5b          7512                           JNZ 0x1040:0b6f
1040:0b5d          c47e0a                         LES DI,[BP + 0xa]
1040:0b60          06                             PUSH ES
1040:0b61          57                             PUSH DI
1040:0b62          c47e06                         LES DI,[BP + 0x6]
1040:0b65          06                             PUSH ES
1040:0b66          57                             PUSH DI
1040:0b67          268b3d                         MOV DI,word ptr ES:[DI]
1040:0b6a          ff5d48                         CALLF [DI + 0x48]
1040:0b6d          eb10                           JMP 0x1040:0b7f
LAB_1040_0b6f:
1040:0b6f          c47e0a                         LES DI,[BP + 0xa]
1040:0b72          06                             PUSH ES
1040:0b73          57                             PUSH DI
1040:0b74          c47e06                         LES DI,[BP + 0x6]
1040:0b77          06                             PUSH ES
1040:0b78          57                             PUSH DI
1040:0b79          268b3d                         MOV DI,word ptr ES:[DI]
1040:0b7c          ff5d0c                         CALLF [DI + 0xc]
LAB_1040_0b7f:
1040:0b7f          89ec                           MOV SP,BP
1040:0b81          5d                             POP BP
1040:0b82          4d                             DEC BP
1040:0b83          ca0800                         RETF 0x8
FUN_1040_0b86:
1040:0b86          45                             INC BP
1040:0b87          55                             PUSH BP
1040:0b88          89e5                           MOV BP,SP
1040:0b8a          1e                             PUSH DS
1040:0b8b          c47e06                         LES DI,[BP + 0x6]
1040:0b8e          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0b92          6af0                           PUSH -0x10
1040:0b94          9a98015011                     CALLF 0x1150:0198
1040:0b99          250000                         AND AX,0x0
1040:0b9c          81e21000                       AND DX,0x10
1040:0ba0          09d0                           OR AX,DX
1040:0ba2          7512                           JNZ 0x1040:0bb6
1040:0ba4          c47e0a                         LES DI,[BP + 0xa]
1040:0ba7          06                             PUSH ES
1040:0ba8          57                             PUSH DI
1040:0ba9          c47e06                         LES DI,[BP + 0x6]
1040:0bac          06                             PUSH ES
1040:0bad          57                             PUSH DI
1040:0bae          268b3d                         MOV DI,word ptr ES:[DI]
1040:0bb1          ff5d48                         CALLF [DI + 0x48]
1040:0bb4          eb10                           JMP 0x1040:0bc6
LAB_1040_0bb6:
1040:0bb6          c47e0a                         LES DI,[BP + 0xa]
1040:0bb9          06                             PUSH ES
1040:0bba          57                             PUSH DI
1040:0bbb          c47e06                         LES DI,[BP + 0x6]
1040:0bbe          06                             PUSH ES
1040:0bbf          57                             PUSH DI
1040:0bc0          268b3d                         MOV DI,word ptr ES:[DI]
1040:0bc3          ff5d0c                         CALLF [DI + 0xc]
LAB_1040_0bc6:
1040:0bc6          89ec                           MOV SP,BP
1040:0bc8          5d                             POP BP
1040:0bc9          4d                             DEC BP
1040:0bca          ca0800                         RETF 0x8
FUN_1040_0bcd:
1040:0bcd          45                             INC BP
1040:0bce          55                             PUSH BP
1040:0bcf          89e5                           MOV BP,SP
1040:0bd1          1e                             PUSH DS
1040:0bd2          83ec04                         SUB SP,0x4
1040:0bd5          c47e0a                         LES DI,[BP + 0xa]
1040:0bd8          268b05                         MOV AX,word ptr ES:[DI]
1040:0bdb          c47e06                         LES DI,[BP + 0x6]
1040:0bde          263b4504                       CMP AX,word ptr ES:[DI + 0x4]
1040:0be2          750a                           JNZ 0x1040:0bee
1040:0be4          31c0                           XOR AX,AX
1040:0be6          8946fa                         MOV word ptr [BP + -0x6],AX
1040:0be9          8946fc                         MOV word ptr [BP + -0x4],AX
1040:0bec          eb2e                           JMP 0x1040:0c1c
LAB_1040_0bee:
1040:0bee          c47e06                         LES DI,[BP + 0x6]
1040:0bf1          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1040:0bf5          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1040:0bf9          7410                           JZ 0x1040:0c0b
1040:0bfb          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1040:0bff          268b5508                       MOV DX,word ptr ES:[DI + 0x8]
1040:0c03          8946fa                         MOV word ptr [BP + -0x6],AX
1040:0c06          8956fc                         MOV word ptr [BP + -0x4],DX
1040:0c09          eb11                           JMP 0x1040:0c1c
LAB_1040_0c0b:
1040:0c0b          c47e0a                         LES DI,[BP + 0xa]
1040:0c0e          26ff35                         PUSH word ptr ES:[DI]
1040:0c11          9a97004010                     CALLF 0x1040:0097
1040:0c16          8946fa                         MOV word ptr [BP + -0x6],AX
1040:0c19          8956fc                         MOV word ptr [BP + -0x4],DX
LAB_1040_0c1c:
1040:0c1c          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:0c1f          0b46fc                         OR AX,word ptr [BP + -0x4]
1040:0c22          7512                           JNZ 0x1040:0c36
1040:0c24          c47e0a                         LES DI,[BP + 0xa]
1040:0c27          06                             PUSH ES
1040:0c28          57                             PUSH DI
1040:0c29          c47e06                         LES DI,[BP + 0x6]
1040:0c2c          06                             PUSH ES
1040:0c2d          57                             PUSH DI
1040:0c2e          268b3d                         MOV DI,word ptr ES:[DI]
1040:0c31          ff5d0c                         CALLF [DI + 0xc]
1040:0c34          eb1a                           JMP 0x1040:0c50
LAB_1040_0c36:
1040:0c36          ff76fc                         PUSH word ptr [BP + -0x4]
1040:0c39          ff76fa                         PUSH word ptr [BP + -0x6]
1040:0c3c          c47e0a                         LES DI,[BP + 0xa]
1040:0c3f          06                             PUSH ES
1040:0c40          57                             PUSH DI
1040:0c41          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1040:0c45          0500a0                         ADD AX,0xa000
1040:0c48          50                             PUSH AX
1040:0c49          6a10                           PUSH 0x10
1040:0c4b          9add084010                     CALLF 0x1040:08dd
LAB_1040_0c50:
1040:0c50          89ec                           MOV SP,BP
1040:0c52          5d                             POP BP
1040:0c53          4d                             DEC BP
1040:0c54          ca0800                         RETF 0x8
FUN_1040_0c57:
1040:0c57          45                             INC BP
1040:0c58          55                             PUSH BP
1040:0c59          89e5                           MOV BP,SP
1040:0c5b          1e                             PUSH DS
1040:0c5c          c47e0a                         LES DI,[BP + 0xa]
1040:0c5f          06                             PUSH ES
1040:0c60          57                             PUSH DI
1040:0c61          c47e06                         LES DI,[BP + 0x6]
1040:0c64          06                             PUSH ES
1040:0c65          57                             PUSH DI
1040:0c66          268b3d                         MOV DI,word ptr ES:[DI]
1040:0c69          ff5d0c                         CALLF [DI + 0xc]
1040:0c6c          89ec                           MOV SP,BP
1040:0c6e          5d                             POP BP
1040:0c6f          4d                             DEC BP
1040:0c70          ca0800                         RETF 0x8
FUN_1040_0c73:
1040:0c73          45                             INC BP
1040:0c74          55                             PUSH BP
1040:0c75          89e5                           MOV BP,SP
1040:0c77          1e                             PUSH DS
1040:0c78          c47e06                         LES DI,[BP + 0x6]
1040:0c7b          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1040:0c7f          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1040:0c83          7455                           JZ 0x1040:0cda
1040:0c85          c47e0a                         LES DI,[BP + 0xa]
1040:0c88          26817d021101                   CMP word ptr ES:[DI + 0x2],0x111
1040:0c8e          7521                           JNZ 0x1040:0cb1
1040:0c90          c47e06                         LES DI,[BP + 0x6]
1040:0c93          26ff7508                       PUSH word ptr ES:[DI + 0x8]
1040:0c97          26ff7506                       PUSH word ptr ES:[DI + 0x6]
1040:0c9b          c47e0a                         LES DI,[BP + 0xa]
1040:0c9e          06                             PUSH ES
1040:0c9f          57                             PUSH DI
1040:0ca0          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1040:0ca4          050080                         ADD AX,0x8000
1040:0ca7          50                             PUSH AX
1040:0ca8          6a14                           PUSH 0x14
1040:0caa          9add084010                     CALLF 0x1040:08dd
1040:0caf          eb29                           JMP 0x1040:0cda
LAB_1040_0cb1:
1040:0cb1          c47e06                         LES DI,[BP + 0x6]
1040:0cb4          26ff7508                       PUSH word ptr ES:[DI + 0x8]
1040:0cb8          26ff7506                       PUSH word ptr ES:[DI + 0x6]
1040:0cbc          c47e0a                         LES DI,[BP + 0xa]
1040:0cbf          06                             PUSH ES
1040:0cc0          57                             PUSH DI
1040:0cc1          c47e06                         LES DI,[BP + 0x6]
1040:0cc4          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0cc8          6af4                           PUSH -0xc
1040:0cca          9a94015011                     CALLF 0x1150:0194
1040:0ccf          050080                         ADD AX,0x8000
1040:0cd2          50                             PUSH AX
1040:0cd3          6a14                           PUSH 0x14
1040:0cd5          9add084010                     CALLF 0x1040:08dd
LAB_1040_0cda:
1040:0cda          89ec                           MOV SP,BP
1040:0cdc          5d                             POP BP
1040:0cdd          4d                             DEC BP
1040:0cde          ca0800                         RETF 0x8
FUN_1040_0ce1:
1040:0ce1          45                             INC BP
1040:0ce2          55                             PUSH BP
1040:0ce3          89e5                           MOV BP,SP
1040:0ce5          1e                             PUSH DS
1040:0ce6          c47e08                         LES DI,[BP + 0x8]
1040:0ce9          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:0cee          740a                           JZ 0x1040:0cfa
1040:0cf0          c47e08                         LES DI,[BP + 0x8]
1040:0cf3          06                             PUSH ES
1040:0cf4          57                             PUSH DI
1040:0cf5          9a0d064010                     CALLF 0x1040:060d
LAB_1040_0cfa:
1040:0cfa          89ec                           MOV SP,BP
1040:0cfc          5d                             POP BP
1040:0cfd          4d                             DEC BP
1040:0cfe          ca0600                         RETF 0x6
FUN_1040_0d01:
1040:0d01          45                             INC BP
1040:0d02          55                             PUSH BP
1040:0d03          89e5                           MOV BP,SP
1040:0d05          1e                             PUSH DS
1040:0d06          c47e06                         LES DI,[BP + 0x6]
1040:0d09          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:0d0e          746d                           JZ 0x1040:0d7d
1040:0d10          bfe10c                         MOV DI,0xce1
1040:0d13          b84010                         MOV AX,0x1040
1040:0d16          50                             PUSH AX
1040:0d17          57                             PUSH DI
1040:0d18          c47e06                         LES DI,[BP + 0x6]
1040:0d1b          06                             PUSH ES
1040:0d1c          57                             PUSH DI
1040:0d1d          9a74084010                     CALLF 0x1040:0874
1040:0d22          6a08                           PUSH 0x8
1040:0d24          c47e06                         LES DI,[BP + 0x6]
1040:0d27          06                             PUSH ES
1040:0d28          57                             PUSH DI
1040:0d29          9a8d064010                     CALLF 0x1040:068d
1040:0d2e          08c0                           OR AL,AL
1040:0d30          743f                           JZ 0x1040:0d71
1040:0d32          c47e06                         LES DI,[BP + 0x6]
1040:0d35          26c47d06                       LES DI,ES:[DI + 0x6]
1040:0d39          06                             PUSH ES
1040:0d3a          57                             PUSH DI
1040:0d3b          268b3d                         MOV DI,word ptr ES:[DI]
1040:0d3e          ff5d30                         CALLF [DI + 0x30]
1040:0d41          09d0                           OR AX,DX
1040:0d43          742c                           JZ 0x1040:0d71
1040:0d45          c47e06                         LES DI,[BP + 0x6]
1040:0d48          26c47d06                       LES DI,ES:[DI + 0x6]
1040:0d4c          06                             PUSH ES
1040:0d4d          57                             PUSH DI
1040:0d4e          268b3d                         MOV DI,word ptr ES:[DI]
1040:0d51          ff5d30                         CALLF [DI + 0x30]
1040:0d54          89c7                           MOV DI,AX
1040:0d56          8ec2                           MOV DX,ES
1040:0d58          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0d5c          682102                         PUSH 0x221
1040:0d5f          c47e06                         LES DI,[BP + 0x6]
1040:0d62          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0d66          6a00                           PUSH 0x0
1040:0d68          6a00                           PUSH 0x0
1040:0d6a          9a7c015011                     CALLF 0x1150:017c
1040:0d6f          eb0c                           JMP 0x1040:0d7d
LAB_1040_0d71:
1040:0d71          c47e06                         LES DI,[BP + 0x6]
1040:0d74          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0d78          9a30015011                     CALLF 0x1150:0130
LAB_1040_0d7d:
1040:0d7d          89ec                           MOV SP,BP
1040:0d7f          5d                             POP BP
1040:0d80          4d                             DEC BP
1040:0d81          ca0400                         RETF 0x4
FUN_1040_0d84:
1040:0d84          45                             INC BP
1040:0d85          55                             PUSH BP
1040:0d86          89e5                           MOV BP,SP
1040:0d88          1e                             PUSH DS
1040:0d89          c47e06                         LES DI,[BP + 0x6]
1040:0d8c          06                             PUSH ES
1040:0d8d          57                             PUSH DI
1040:0d8e          9a5c054010                     CALLF 0x1040:055c
1040:0d93          08c0                           OR AL,AL
1040:0d95          750b                           JNZ 0x1040:0da2
1040:0d97          c47e06                         LES DI,[BP + 0x6]
1040:0d9a          26c74502fcff                   MOV word ptr ES:[DI + 0x2],0xfffc
1040:0da0          eb0d                           JMP 0x1040:0daf
LAB_1040_0da2:
1040:0da2          6a02                           PUSH 0x2
1040:0da4          c47e06                         LES DI,[BP + 0x6]
1040:0da7          06                             PUSH ES
1040:0da8          57                             PUSH DI
1040:0da9          268b3d                         MOV DI,word ptr ES:[DI]
1040:0dac          ff5d44                         CALLF [DI + 0x44]
LAB_1040_0daf:
1040:0daf          89ec                           MOV SP,BP
1040:0db1          5d                             POP BP
1040:0db2          4d                             DEC BP
1040:0db3          ca0400                         RETF 0x4
FUN_1040_0db6:
1040:0db6          45                             INC BP
1040:0db7          55                             PUSH BP
1040:0db8          89e5                           MOV BP,SP
1040:0dba          1e                             PUSH DS
1040:0dbb          6a10                           PUSH 0x10
1040:0dbd          c47e08                         LES DI,[BP + 0x8]
1040:0dc0          06                             PUSH ES
1040:0dc1          57                             PUSH DI
1040:0dc2          9a8d064010                     CALLF 0x1040:068d
1040:0dc7          08c0                           OR AL,AL
1040:0dc9          7421                           JZ 0x1040:0dec
1040:0dcb          8b7e06                         MOV DI,word ptr [BP + 0x6]
1040:0dce          36ff75fc                       PUSH word ptr SS:[DI + -0x4]
1040:0dd2          36ff75fa                       PUSH word ptr SS:[DI + -0x6]
1040:0dd6          36ff750a                       PUSH word ptr SS:[DI + 0xa]
1040:0dda          c47e08                         LES DI,[BP + 0x8]
1040:0ddd          06                             PUSH ES
1040:0dde          57                             PUSH DI
1040:0ddf          268b3d                         MOV DI,word ptr ES:[DI]
1040:0de2          ff5d40                         CALLF [DI + 0x40]
1040:0de5          8b7e06                         MOV DI,word ptr [BP + 0x6]
1040:0de8          360145fa                       ADD word ptr SS:[DI + -0x6],AX
LAB_1040_0dec:
1040:0dec          89ec                           MOV SP,BP
1040:0dee          5d                             POP BP
1040:0def          4d                             DEC BP
1040:0df0          ca0600                         RETF 0x6
FUN_1040_0df3:
1040:0df3          45                             INC BP
1040:0df4          55                             PUSH BP
1040:0df5          89e5                           MOV BP,SP
1040:0df7          1e                             PUSH DS
1040:0df8          83ec04                         SUB SP,0x4
1040:0dfb          c47e06                         LES DI,[BP + 0x6]
1040:0dfe          268b450e                       MOV AX,word ptr ES:[DI + 0xe]
1040:0e02          260b4510                       OR AX,word ptr ES:[DI + 0x10]
1040:0e06          7420                           JZ 0x1040:0e28
1040:0e08          268b450e                       MOV AX,word ptr ES:[DI + 0xe]
1040:0e0c          268b5510                       MOV DX,word ptr ES:[DI + 0x10]
1040:0e10          8946fa                         MOV word ptr [BP + -0x6],AX
1040:0e13          8956fc                         MOV word ptr [BP + -0x4],DX
1040:0e16          bfb60d                         MOV DI,0xdb6
1040:0e19          b84010                         MOV AX,0x1040
1040:0e1c          50                             PUSH AX
1040:0e1d          57                             PUSH DI
1040:0e1e          c47e06                         LES DI,[BP + 0x6]
1040:0e21          06                             PUSH ES
1040:0e22          57                             PUSH DI
1040:0e23          9a74084010                     CALLF 0x1040:0874
LAB_1040_0e28:
1040:0e28          89ec                           MOV SP,BP
1040:0e2a          5d                             POP BP
1040:0e2b          4d                             DEC BP
1040:0e2c          ca0600                         RETF 0x6
FUN_1040_0e2f:
1040:0e2f          45                             INC BP
1040:0e30          55                             PUSH BP
1040:0e31          89e5                           MOV BP,SP
1040:0e33          1e                             PUSH DS
1040:0e34          83ec1c                         SUB SP,0x1c
1040:0e37          c646fd01                       MOV byte ptr [BP + -0x3],0x1
1040:0e3b          ff364419                       PUSH word ptr [0x1944]
1040:0e3f          c47e06                         LES DI,[BP + 0x6]
1040:0e42          06                             PUSH ES
1040:0e43          57                             PUSH DI
1040:0e44          268b3d                         MOV DI,word ptr ES:[DI]
1040:0e47          ff5d2c                         CALLF [DI + 0x2c]
1040:0e4a          52                             PUSH DX
1040:0e4b          50                             PUSH AX
1040:0e4c          8d7ee2                         LEA DI,[BP + -0x1e]
1040:0e4f          16                             PUSH SS
1040:0e50          57                             PUSH DI
1040:0e51          9ae4015011                     CALLF 0x1150:01e4
1040:0e56          09c0                           OR AX,AX
1040:0e58          7523                           JNZ 0x1040:0e7d
1040:0e5a          8d7ee2                         LEA DI,[BP + -0x1e]
1040:0e5d          16                             PUSH SS
1040:0e5e          57                             PUSH DI
1040:0e5f          c47e06                         LES DI,[BP + 0x6]
1040:0e62          06                             PUSH ES
1040:0e63          57                             PUSH DI
1040:0e64          268b3d                         MOV DI,word ptr ES:[DI]
1040:0e67          ff5d34                         CALLF [DI + 0x34]
1040:0e6a          8d7ee2                         LEA DI,[BP + -0x1e]
1040:0e6d          16                             PUSH SS
1040:0e6e          57                             PUSH DI
1040:0e6f          9a34015011                     CALLF 0x1150:0134
1040:0e74          f7d8                           NEG AX
1040:0e76          18c0                           SBB AL,AL
1040:0e78          f6d8                           NEG AL
1040:0e7a          8846fd                         MOV byte ptr [BP + -0x3],AL
LAB_1040_0e7d:
1040:0e7d          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:0e80          89ec                           MOV SP,BP
1040:0e82          5d                             POP BP
1040:0e83          4d                             DEC BP
1040:0e84          ca0400                         RETF 0x4
FUN_1040_0e87:
1040:0e87          45                             INC BP
1040:0e88          55                             PUSH BP
1040:0e89          89e5                           MOV BP,SP
1040:0e8b          1e                             PUSH DS
1040:0e8c          c47e06                         LES DI,[BP + 0x6]
1040:0e8f          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:0e94          740c                           JZ 0x1040:0ea2
1040:0e96          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0e9a          ff760a                         PUSH word ptr [BP + 0xa]
1040:0e9d          9a20015011                     CALLF 0x1150:0120
LAB_1040_0ea2:
1040:0ea2          89ec                           MOV SP,BP
1040:0ea4          5d                             POP BP
1040:0ea5          4d                             DEC BP
1040:0ea6          ca0600                         RETF 0x6
FUN_1040_0ea9:
1040:0ea9          45                             INC BP
1040:0eaa          55                             PUSH BP
1040:0eab          89e5                           MOV BP,SP
1040:0ead          1e                             PUSH DS
1040:0eae          83ec02                         SUB SP,0x2
1040:0eb1          c47e08                         LES DI,[BP + 0x8]
1040:0eb4          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:0eb9          740f                           JZ 0x1040:0eca
1040:0ebb          c47e08                         LES DI,[BP + 0x8]
1040:0ebe          06                             PUSH ES
1040:0ebf          57                             PUSH DI
1040:0ec0          268b3d                         MOV DI,word ptr ES:[DI]
1040:0ec3          ff5d3c                         CALLF [DI + 0x3c]
1040:0ec6          08c0                           OR AL,AL
1040:0ec8          7404                           JZ 0x1040:0ece
LAB_1040_0eca:
1040:0eca          b000                           MOV AL,0x0
1040:0ecc          eb02                           JMP 0x1040:0ed0
LAB_1040_0ece:
1040:0ece          b001                           MOV AL,0x1
LAB_1040_0ed0:
1040:0ed0          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:0ed3          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:0ed6          89ec                           MOV SP,BP
1040:0ed8          5d                             POP BP
1040:0ed9          4d                             DEC BP
1040:0eda          ca0600                         RETF 0x6
FUN_1040_0edd:
1040:0edd          45                             INC BP
1040:0ede          55                             PUSH BP
1040:0edf          89e5                           MOV BP,SP
1040:0ee1          1e                             PUSH DS
1040:0ee2          83ec02                         SUB SP,0x2
1040:0ee5          bfa90e                         MOV DI,0xea9
1040:0ee8          b84010                         MOV AX,0x1040
1040:0eeb          50                             PUSH AX
1040:0eec          57                             PUSH DI
1040:0eed          c47e06                         LES DI,[BP + 0x6]
1040:0ef0          06                             PUSH ES
1040:0ef1          57                             PUSH DI
1040:0ef2          9a27084010                     CALLF 0x1040:0827
1040:0ef7          09d0                           OR AX,DX
1040:0ef9          b000                           MOV AL,0x0
1040:0efb          7501                           JNZ 0x1040:0efe
1040:0efd          40                             INC AX
LAB_1040_0efe:
1040:0efe          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:0f01          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:0f04          89ec                           MOV SP,BP
1040:0f06          5d                             POP BP
1040:0f07          4d                             DEC BP
1040:0f08          ca0400                         RETF 0x4
FUN_1040_0f0b:
1040:0f0b          45                             INC BP
1040:0f0c          55                             PUSH BP
1040:0f0d          89e5                           MOV BP,SP
1040:0f0f          1e                             PUSH DS
1040:0f10          c47e06                         LES DI,[BP + 0x6]
1040:0f13          06                             PUSH ES
1040:0f14          57                             PUSH DI
1040:0f15          9a210f4010                     CALLF 0x1040:0f21
1040:0f1a          89ec                           MOV SP,BP
1040:0f1c          5d                             POP BP
1040:0f1d          4d                             DEC BP
1040:0f1e          ca0800                         RETF 0x8
FUN_1040_0f21:
1040:0f21          45                             INC BP
1040:0f22          55                             PUSH BP
1040:0f23          89e5                           MOV BP,SP
1040:0f25          1e                             PUSH DS
1040:0f26          83ec02                         SUB SP,0x2
1040:0f29          c47e06                         LES DI,[BP + 0x6]
1040:0f2c          89f8                           MOV AX,DI
1040:0f2e          8cc2                           MOV DX,ES
1040:0f30          c43e2218                       LES DI,[0x1822]
1040:0f34          263b550a                       CMP DX,word ptr ES:[DI + 0xa]
1040:0f38          7517                           JNZ 0x1040:0f51
1040:0f3a          263b4508                       CMP AX,word ptr ES:[DI + 0x8]
1040:0f3e          7511                           JNZ 0x1040:0f51
1040:0f40          c43e2218                       LES DI,[0x1822]
1040:0f44          06                             PUSH ES
1040:0f45          57                             PUSH DI
1040:0f46          268b3d                         MOV DI,word ptr ES:[DI]
1040:0f49          ff5d44                         CALLF [DI + 0x44]
1040:0f4c          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:0f4f          eb0e                           JMP 0x1040:0f5f
LAB_1040_0f51:
1040:0f51          c47e06                         LES DI,[BP + 0x6]
1040:0f54          06                             PUSH ES
1040:0f55          57                             PUSH DI
1040:0f56          268b3d                         MOV DI,word ptr ES:[DI]
1040:0f59          ff5d3c                         CALLF [DI + 0x3c]
1040:0f5c          8846fd                         MOV byte ptr [BP + -0x3],AL
LAB_1040_0f5f:
1040:0f5f          807efd00                       CMP byte ptr [BP + -0x3],0x0
1040:0f63          740a                           JZ 0x1040:0f6f
1040:0f65          c47e06                         LES DI,[BP + 0x6]
1040:0f68          06                             PUSH ES
1040:0f69          57                             PUSH DI
1040:0f6a          9a1c005010                     CALLF 0x1050:001c
LAB_1040_0f6f:
1040:0f6f          89ec                           MOV SP,BP
1040:0f71          5d                             POP BP
1040:0f72          4d                             DEC BP
1040:0f73          ca0400                         RETF 0x4
FUN_1040_0f76:
1040:0f76          45                             INC BP
1040:0f77          55                             PUSH BP
1040:0f78          89e5                           MOV BP,SP
1040:0f7a          1e                             PUSH DS
1040:0f7b          c47e06                         LES DI,[BP + 0x6]
1040:0f7e          89f8                           MOV AX,DI
1040:0f80          8cc2                           MOV DX,ES
1040:0f82          c43e2218                       LES DI,[0x1822]
1040:0f86          263b550a                       CMP DX,word ptr ES:[DI + 0xa]
1040:0f8a          7512                           JNZ 0x1040:0f9e
1040:0f8c          263b4508                       CMP AX,word ptr ES:[DI + 0x8]
1040:0f90          750c                           JNZ 0x1040:0f9e
1040:0f92          c47e06                         LES DI,[BP + 0x6]
1040:0f95          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0f99          9adc005011                     CALLF 0x1150:00dc
LAB_1040_0f9e:
1040:0f9e          c47e0a                         LES DI,[BP + 0xa]
1040:0fa1          06                             PUSH ES
1040:0fa2          57                             PUSH DI
1040:0fa3          c47e06                         LES DI,[BP + 0x6]
1040:0fa6          06                             PUSH ES
1040:0fa7          57                             PUSH DI
1040:0fa8          268b3d                         MOV DI,word ptr ES:[DI]
1040:0fab          ff5d0c                         CALLF [DI + 0xc]
1040:0fae          89ec                           MOV SP,BP
1040:0fb0          5d                             POP BP
1040:0fb1          4d                             DEC BP
1040:0fb2          ca0800                         RETF 0x8
FUN_1040_0fb5:
1040:0fb5          45                             INC BP
1040:0fb6          55                             PUSH BP
1040:0fb7          89e5                           MOV BP,SP
1040:0fb9          1e                             PUSH DS
1040:0fba          c47e06                         LES DI,[BP + 0x6]
1040:0fbd          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:0fc1          9a71004010                     CALLF 0x1040:0071
1040:0fc6          c47e0a                         LES DI,[BP + 0xa]
1040:0fc9          06                             PUSH ES
1040:0fca          57                             PUSH DI
1040:0fcb          c47e06                         LES DI,[BP + 0x6]
1040:0fce          06                             PUSH ES
1040:0fcf          57                             PUSH DI
1040:0fd0          268b3d                         MOV DI,word ptr ES:[DI]
1040:0fd3          ff5d0c                         CALLF [DI + 0xc]
1040:0fd6          c47e06                         LES DI,[BP + 0x6]
1040:0fd9          31c0                           XOR AX,AX
1040:0fdb          26894504                       MOV word ptr ES:[DI + 0x4],AX
1040:0fdf          89ec                           MOV SP,BP
1040:0fe1          5d                             POP BP
1040:0fe2          4d                             DEC BP
1040:0fe3          ca0800                         RETF 0x8
FUN_1040_0fe6:
1040:0fe6          45                             INC BP
1040:0fe7          55                             PUSH BP
1040:0fe8          89e5                           MOV BP,SP
1040:0fea          1e                             PUSH DS
1040:0feb          c47e0a                         LES DI,[BP + 0xa]
1040:0fee          06                             PUSH ES
1040:0fef          57                             PUSH DI
1040:0ff0          c47e06                         LES DI,[BP + 0x6]
1040:0ff3          06                             PUSH ES
1040:0ff4          57                             PUSH DI
1040:0ff5          268b3d                         MOV DI,word ptr ES:[DI]
1040:0ff8          ff5d0c                         CALLF [DI + 0xc]
1040:0ffb          c47e0a                         LES DI,[BP + 0xa]
1040:0ffe          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:1003          7431                           JZ 0x1040:1036
1040:1005          6a01                           PUSH 0x1
1040:1007          c47e06                         LES DI,[BP + 0x6]
1040:100a          06                             PUSH ES
1040:100b          57                             PUSH DI
1040:100c          9a8d064010                     CALLF 0x1040:068d
1040:1011          08c0                           OR AL,AL
1040:1013          7412                           JZ 0x1040:1027
1040:1015          c47e06                         LES DI,[BP + 0x6]
1040:1018          06                             PUSH ES
1040:1019          57                             PUSH DI
1040:101a          c43e2218                       LES DI,[0x1822]
1040:101e          06                             PUSH ES
1040:101f          57                             PUSH DI
1040:1020          9a301b4010                     CALLF 0x1040:1b30
1040:1025          eb0f                           JMP 0x1040:1036
LAB_1040_1027:
1040:1027          6a00                           PUSH 0x0
1040:1029          6a00                           PUSH 0x0
1040:102b          c43e2218                       LES DI,[0x1822]
1040:102f          06                             PUSH ES
1040:1030          57                             PUSH DI
1040:1031          9a301b4010                     CALLF 0x1040:1b30
LAB_1040_1036:
1040:1036          89ec                           MOV SP,BP
1040:1038          5d                             POP BP
1040:1039          4d                             DEC BP
1040:103a          ca0800                         RETF 0x8
FUN_1040_103d:
1040:103d          45                             INC BP
1040:103e          55                             PUSH BP
1040:103f          89e5                           MOV BP,SP
1040:1041          1e                             PUSH DS
1040:1042          c47e06                         LES DI,[BP + 0x6]
1040:1045          89f8                           MOV AX,DI
1040:1047          8cc2                           MOV DX,ES
1040:1049          c43e2218                       LES DI,[0x1822]
1040:104d          263b550a                       CMP DX,word ptr ES:[DI + 0xa]
1040:1051          7521                           JNZ 0x1040:1074
1040:1053          263b4508                       CMP AX,word ptr ES:[DI + 0x8]
1040:1057          751b                           JNZ 0x1040:1074
1040:1059          c43e2218                       LES DI,[0x1822]
1040:105d          06                             PUSH ES
1040:105e          57                             PUSH DI
1040:105f          268b3d                         MOV DI,word ptr ES:[DI]
1040:1062          ff5d44                         CALLF [DI + 0x44]
1040:1065          98                             CBW
1040:1066          99                             CWD
1040:1067          c47e0a                         LES DI,[BP + 0xa]
1040:106a          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:106e          2689550c                       MOV word ptr ES:[DI + 0xc],DX
1040:1072          eb18                           JMP 0x1040:108c
LAB_1040_1074:
1040:1074          c47e06                         LES DI,[BP + 0x6]
1040:1077          06                             PUSH ES
1040:1078          57                             PUSH DI
1040:1079          268b3d                         MOV DI,word ptr ES:[DI]
1040:107c          ff5d3c                         CALLF [DI + 0x3c]
1040:107f          98                             CBW
1040:1080          99                             CWD
1040:1081          c47e0a                         LES DI,[BP + 0xa]
1040:1084          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:1088          2689550c                       MOV word ptr ES:[DI + 0xc],DX
LAB_1040_108c:
1040:108c          89ec                           MOV SP,BP
1040:108e          5d                             POP BP
1040:108f          4d                             DEC BP
1040:1090          ca0800                         RETF 0x8
FUN_1040_1093:
1040:1093          45                             INC BP
1040:1094          55                             PUSH BP
1040:1095          89e5                           MOV BP,SP
1040:1097          1e                             PUSH DS
1040:1098          c47e06                         LES DI,[BP + 0x6]
1040:109b          89f8                           MOV AX,DI
1040:109d          8cc2                           MOV DX,ES
1040:109f          c43e2218                       LES DI,[0x1822]
1040:10a3          263b550a                       CMP DX,word ptr ES:[DI + 0xa]
1040:10a7          7512                           JNZ 0x1040:10bb
1040:10a9          263b4508                       CMP AX,word ptr ES:[DI + 0x8]
1040:10ad          750c                           JNZ 0x1040:10bb
1040:10af          c47e06                         LES DI,[BP + 0x6]
1040:10b2          06                             PUSH ES
1040:10b3          57                             PUSH DI
1040:10b4          9a210f4010                     CALLF 0x1040:0f21
1040:10b9          eb10                           JMP 0x1040:10cb
LAB_1040_10bb:
1040:10bb          c47e0a                         LES DI,[BP + 0xa]
1040:10be          06                             PUSH ES
1040:10bf          57                             PUSH DI
1040:10c0          c47e06                         LES DI,[BP + 0x6]
1040:10c3          06                             PUSH ES
1040:10c4          57                             PUSH DI
1040:10c5          268b3d                         MOV DI,word ptr ES:[DI]
1040:10c8          ff5d10                         CALLF [DI + 0x10]
LAB_1040_10cb:
1040:10cb          89ec                           MOV SP,BP
1040:10cd          5d                             POP BP
1040:10ce          4d                             DEC BP
1040:10cf          ca0800                         RETF 0x8
FUN_1040_10d2:
1040:10d2          45                             INC BP
1040:10d3          55                             PUSH BP
1040:10d4          89e5                           MOV BP,SP
1040:10d6          1e                             PUSH DS
1040:10d7          83ec04                         SUB SP,0x4
1040:10da          31c0                           XOR AX,AX
1040:10dc          8946fa                         MOV word ptr [BP + -0x6],AX
1040:10df          8946fc                         MOV word ptr [BP + -0x4],AX
1040:10e2          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:10e5          8b56fc                         MOV DX,word ptr [BP + -0x4]
1040:10e8          89ec                           MOV SP,BP
1040:10ea          5d                             POP BP
1040:10eb          4d                             DEC BP
1040:10ec          ca0400                         RETF 0x4
FUN_1040_10ef:
1040:10ef          45                             INC BP
1040:10f0          55                             PUSH BP
1040:10f1          89e5                           MOV BP,SP
1040:10f3          1e                             PUSH DS
1040:10f4          c47e06                         LES DI,[BP + 0x6]
1040:10f7          26ff751f                       PUSH word ptr ES:[DI + 0x1f]
1040:10fb          26ff751d                       PUSH word ptr ES:[DI + 0x1d]
1040:10ff          9a0d026010                     CALLF 0x1060:020d
1040:1104          c47e06                         LES DI,[BP + 0x6]
1040:1107          268b453b                       MOV AX,word ptr ES:[DI + 0x3b]
1040:110b          260b453d                       OR AX,word ptr ES:[DI + 0x3d]
1040:110f          741c                           JZ 0x1040:112d
1040:1111          b001                           MOV AL,0x1
1040:1113          50                             PUSH AX
1040:1114          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:1118          06                             PUSH ES
1040:1119          57                             PUSH DI
1040:111a          268b3d                         MOV DI,word ptr ES:[DI]
1040:111d          ff5d08                         CALLF [DI + 0x8]
1040:1120          c47e06                         LES DI,[BP + 0x6]
1040:1123          31c0                           XOR AX,AX
1040:1125          2689453b                       MOV word ptr ES:[DI + 0x3b],AX
1040:1129          2689453d                       MOV word ptr ES:[DI + 0x3d],AX
LAB_1040_112d:
1040:112d          31c0                           XOR AX,AX
1040:112f          50                             PUSH AX
1040:1130          c47e06                         LES DI,[BP + 0x6]
1040:1133          06                             PUSH ES
1040:1134          57                             PUSH DI
1040:1135          9aff034010                     CALLF 0x1040:03ff
1040:113a          31ff                           XOR DI,DI
1040:113c          9a39046810                     CALLF 0x1068:0439
1040:1141          89ec                           MOV SP,BP
1040:1143          5d                             POP BP
1040:1144          4d                             DEC BP
1040:1145          ca0600                         RETF 0x6
FUN_1040_1148:
1040:1148          45                             INC BP
1040:1149          55                             PUSH BP
1040:114a          89e5                           MOV BP,SP
1040:114c          1e                             PUSH DS
1040:114d          31ff                           XOR DI,DI
1040:114f          9aef036810                     CALLF 0x1068:03ef
1040:1154          7457                           JZ 0x1040:11ad
1040:1156          ff7610                         PUSH word ptr [BP + 0x10]
1040:1159          ff760e                         PUSH word ptr [BP + 0xe]
1040:115c          31c0                           XOR AX,AX
1040:115e          50                             PUSH AX
1040:115f          c47e06                         LES DI,[BP + 0x6]
1040:1162          06                             PUSH ES
1040:1163          57                             PUSH DI
1040:1164          9a41034010                     CALLF 0x1040:0341
1040:1169          6a02                           PUSH 0x2
1040:116b          6a01                           PUSH 0x1
1040:116d          c47e06                         LES DI,[BP + 0x6]
1040:1170          06                             PUSH ES
1040:1171          57                             PUSH DI
1040:1172          9a5b064010                     CALLF 0x1040:065b
1040:1177          c47e06                         LES DI,[BP + 0x6]
1040:117a          81c71d00                       ADD DI,0x1d
1040:117e          06                             PUSH ES
1040:117f          57                             PUSH DI
1040:1180          6a1a                           PUSH 0x1a
1040:1182          6a00                           PUSH 0x0
1040:1184          9a120d6810                     CALLF 0x1068:0d12
1040:1189          8b460c                         MOV AX,word ptr [BP + 0xc]
1040:118c          c47e06                         LES DI,[BP + 0x6]
1040:118f          26894535                       MOV word ptr ES:[DI + 0x35],AX
1040:1193          31c0                           XOR AX,AX
1040:1195          26894537                       MOV word ptr ES:[DI + 0x37],AX
1040:1199          26894539                       MOV word ptr ES:[DI + 0x39],AX
1040:119d          31c0                           XOR AX,AX
1040:119f          2689453b                       MOV word ptr ES:[DI + 0x3b],AX
1040:11a3          2689453d                       MOV word ptr ES:[DI + 0x3d],AX
1040:11a7          31c0                           XOR AX,AX
1040:11a9          2689453f                       MOV word ptr ES:[DI + 0x3f],AX
LAB_1040_11ad:
1040:11ad          c44606                         LES AX,[BP + 0x6]
1040:11b0          8cc2                           MOV DX,ES
1040:11b2          89ec                           MOV SP,BP
1040:11b4          5d                             POP BP
1040:11b5          4d                             DEC BP
1040:11b6          ca0c00                         RETF 0xc
FUN_1040_11b9:
1040:11b9          45                             INC BP
1040:11ba          55                             PUSH BP
1040:11bb          89e5                           MOV BP,SP
1040:11bd          1e                             PUSH DS
1040:11be          c47e0a                         LES DI,[BP + 0xa]
1040:11c1          31c0                           XOR AX,AX
1040:11c3          26894506                       MOV word ptr ES:[DI + 0x6],AX
1040:11c7          31c0                           XOR AX,AX
1040:11c9          26894508                       MOV word ptr ES:[DI + 0x8],AX
1040:11cd          a14419                         MOV AX,[0x1944]
1040:11d0          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:11d4          6a00                           PUSH 0x0
1040:11d6          6a00                           PUSH 0x0
1040:11d8          68007f                         PUSH 0x7f00
1040:11db          9ac0015011                     CALLF 0x1150:01c0
1040:11e0          c47e0a                         LES DI,[BP + 0xa]
1040:11e3          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1040:11e7          6a00                           PUSH 0x0
1040:11e9          6a00                           PUSH 0x0
1040:11eb          68007f                         PUSH 0x7f00
1040:11ee          9abc015011                     CALLF 0x1150:01bc
1040:11f3          c47e0a                         LES DI,[BP + 0xa]
1040:11f6          2689450e                       MOV word ptr ES:[DI + 0xe],AX
1040:11fa          26c745100600                   MOV word ptr ES:[DI + 0x10],0x6
1040:1200          31c0                           XOR AX,AX
1040:1202          26894512                       MOV word ptr ES:[DI + 0x12],AX
1040:1206          26894514                       MOV word ptr ES:[DI + 0x14],AX
1040:120a          c47e06                         LES DI,[BP + 0x6]
1040:120d          06                             PUSH ES
1040:120e          57                             PUSH DI
1040:120f          268b3d                         MOV DI,word ptr ES:[DI]
1040:1212          ff5d2c                         CALLF [DI + 0x2c]
1040:1215          c47e0a                         LES DI,[BP + 0xa]
1040:1218          26894516                       MOV word ptr ES:[DI + 0x16],AX
1040:121c          26895518                       MOV word ptr ES:[DI + 0x18],DX
1040:1220          26c7050300                     MOV word ptr ES:[DI],0x3
1040:1225          b88b01                         MOV AX,0x18b
1040:1228          ba4010                         MOV DX,0x1040
1040:122b          26894502                       MOV word ptr ES:[DI + 0x2],AX
1040:122f          26895504                       MOV word ptr ES:[DI + 0x4],DX
1040:1233          89ec                           MOV SP,BP
1040:1235          5d                             POP BP
1040:1236          4d                             DEC BP
1040:1237          ca0800                         RETF 0x8
FUN_1040_123a:
1040:123a          45                             INC BP
1040:123b          55                             PUSH BP
1040:123c          89e5                           MOV BP,SP
1040:123e          1e                             PUSH DS
1040:123f          83ec02                         SUB SP,0x2
1040:1242          c47e06                         LES DI,[BP + 0x6]
1040:1245          268b4535                       MOV AX,word ptr ES:[DI + 0x35]
1040:1249          8946fc                         MOV word ptr [BP + -0x4],AX
1040:124c          8b46fc                         MOV AX,word ptr [BP + -0x4]
1040:124f          89ec                           MOV SP,BP
1040:1251          5d                             POP BP
1040:1252          4d                             DEC BP
1040:1253          ca0400                         RETF 0x4
FUN_1040_1256:
1040:1256          45                             INC BP
1040:1257          55                             PUSH BP
1040:1258          89e5                           MOV BP,SP
1040:125a          1e                             PUSH DS
1040:125b          c47e06                         LES DI,[BP + 0x6]
1040:125e          26ff7539                       PUSH word ptr ES:[DI + 0x39]
1040:1262          26ff7537                       PUSH word ptr ES:[DI + 0x37]
1040:1266          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:126a          c47e0a                         LES DI,[BP + 0xa]
1040:126d          26ff7502                       PUSH word ptr ES:[DI + 0x2]
1040:1271          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1275          26ff7508                       PUSH word ptr ES:[DI + 0x8]
1040:1279          26ff7506                       PUSH word ptr ES:[DI + 0x6]
1040:127d          9a8c015011                     CALLF 0x1150:018c
1040:1282          c47e0a                         LES DI,[BP + 0xa]
1040:1285          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:1289          2689550c                       MOV word ptr ES:[DI + 0xc],DX
1040:128d          89ec                           MOV SP,BP
1040:128f          5d                             POP BP
1040:1290          4d                             DEC BP
1040:1291          ca0800                         RETF 0x8
FUN_1040_1294:
1040:1294          45                             INC BP
1040:1295          55                             PUSH BP
1040:1296          89e5                           MOV BP,SP
1040:1298          1e                             PUSH DS
1040:1299          83ec26                         SUB SP,0x26
1040:129c          c47e06                         LES DI,[BP + 0x6]
1040:129f          26837d0200                     CMP word ptr ES:[DI + 0x2],0x0
1040:12a4          7403                           JZ 0x1040:12a9
1040:12a6          e9c901                         JMP 0x1040:1472
LAB_1040_12a9:
1040:12a9          06                             PUSH ES
1040:12aa          57                             PUSH DI
1040:12ab          9a41064010                     CALLF 0x1040:0641
1040:12b0          c47e06                         LES DI,[BP + 0x6]
1040:12b3          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1040:12b7          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1040:12bb          7507                           JNZ 0x1040:12c4
1040:12bd          31c0                           XOR AX,AX
1040:12bf          8946fa                         MOV word ptr [BP + -0x6],AX
1040:12c2          eb0e                           JMP 0x1040:12d2
LAB_1040_12c4:
1040:12c4          c47e06                         LES DI,[BP + 0x6]
1040:12c7          26c47d06                       LES DI,ES:[DI + 0x6]
1040:12cb          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1040:12cf          8946fa                         MOV word ptr [BP + -0x6],AX
LAB_1040_12d2:
1040:12d2          6a02                           PUSH 0x2
1040:12d4          c47e06                         LES DI,[BP + 0x6]
1040:12d7          06                             PUSH ES
1040:12d8          57                             PUSH DI
1040:12d9          9a8d064010                     CALLF 0x1040:068d
1040:12de          08c0                           OR AL,AL
1040:12e0          7403                           JZ 0x1040:12e5
1040:12e2          e91e01                         JMP 0x1040:1403
LAB_1040_12e5:
1040:12e5          c47e06                         LES DI,[BP + 0x6]
1040:12e8          06                             PUSH ES
1040:12e9          57                             PUSH DI
1040:12ea          268b3d                         MOV DI,word ptr ES:[DI]
1040:12ed          ff5d1c                         CALLF [DI + 0x1c]
1040:12f0          08c0                           OR AL,AL
1040:12f2          7503                           JNZ 0x1040:12f7
1040:12f4          e90a01                         JMP 0x1040:1401
LAB_1040_12f7:
1040:12f7          c47e06                         LES DI,[BP + 0x6]
1040:12fa          89f8                           MOV AX,DI
1040:12fc          8cc2                           MOV DX,ES
1040:12fe          a34a18                         MOV [0x184a],AX
1040:1301          89164c18                       MOV word ptr [0x184c],DX
1040:1305          6a08                           PUSH 0x8
1040:1307          06                             PUSH ES
1040:1308          57                             PUSH DI
1040:1309          9a8d064010                     CALLF 0x1040:068d
1040:130e          08c0                           OR AL,AL
1040:1310          7566                           JNZ 0x1040:1378
1040:1312          c47e06                         LES DI,[BP + 0x6]
1040:1315          81c71d00                       ADD DI,0x1d
1040:1319          897ed8                         MOV word ptr [BP + -0x28],DI
1040:131c          8c46da                         MOV word ptr [BP + -0x26],ES
1040:131f          26ff750a                       PUSH word ptr ES:[DI + 0xa]
1040:1323          26ff7508                       PUSH word ptr ES:[DI + 0x8]
1040:1327          c47e06                         LES DI,[BP + 0x6]
1040:132a          06                             PUSH ES
1040:132b          57                             PUSH DI
1040:132c          268b3d                         MOV DI,word ptr ES:[DI]
1040:132f          ff5d2c                         CALLF [DI + 0x2c]
1040:1332          52                             PUSH DX
1040:1333          50                             PUSH AX
1040:1334          c47ed8                         LES DI,[BP + -0x28]
1040:1337          26ff7502                       PUSH word ptr ES:[DI + 0x2]
1040:133b          26ff35                         PUSH word ptr ES:[DI]
1040:133e          26ff7506                       PUSH word ptr ES:[DI + 0x6]
1040:1342          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1346          26ff750c                       PUSH word ptr ES:[DI + 0xc]
1040:134a          26ff750e                       PUSH word ptr ES:[DI + 0xe]
1040:134e          26ff7510                       PUSH word ptr ES:[DI + 0x10]
1040:1352          26ff7512                       PUSH word ptr ES:[DI + 0x12]
1040:1356          ff76fa                         PUSH word ptr [BP + -0x6]
1040:1359          26ff7518                       PUSH word ptr ES:[DI + 0x18]
1040:135d          ff364419                       PUSH word ptr [0x1944]
1040:1361          26ff7516                       PUSH word ptr ES:[DI + 0x16]
1040:1365          26ff7514                       PUSH word ptr ES:[DI + 0x14]
1040:1369          9af4015011                     CALLF 0x1150:01f4
1040:136e          c47e06                         LES DI,[BP + 0x6]
1040:1371          26894504                       MOV word ptr ES:[DI + 0x4],AX
1040:1375          e98900                         JMP 0x1040:1401
LAB_1040_1378:
1040:1378          c47e06                         LES DI,[BP + 0x6]
1040:137b          06                             PUSH ES
1040:137c          57                             PUSH DI
1040:137d          268b3d                         MOV DI,word ptr ES:[DI]
1040:1380          ff5d2c                         CALLF [DI + 0x2c]
1040:1383          8946dc                         MOV word ptr [BP + -0x24],AX
1040:1386          8956de                         MOV word ptr [BP + -0x22],DX
1040:1389          c47e06                         LES DI,[BP + 0x6]
1040:138c          268b451d                       MOV AX,word ptr ES:[DI + 0x1d]
1040:1390          268b551f                       MOV DX,word ptr ES:[DI + 0x1f]
1040:1394          8946e0                         MOV word ptr [BP + -0x20],AX
1040:1397          8956e2                         MOV word ptr [BP + -0x1e],DX
1040:139a          a14419                         MOV AX,[0x1944]
1040:139d          8946e4                         MOV word ptr [BP + -0x1c],AX
1040:13a0          268b4529                       MOV AX,word ptr ES:[DI + 0x29]
1040:13a4          8946e6                         MOV word ptr [BP + -0x1a],AX
1040:13a7          268b452b                       MOV AX,word ptr ES:[DI + 0x2b]
1040:13ab          8946e8                         MOV word ptr [BP + -0x18],AX
1040:13ae          268b452d                       MOV AX,word ptr ES:[DI + 0x2d]
1040:13b2          8946ea                         MOV word ptr [BP + -0x16],AX
1040:13b5          268b452f                       MOV AX,word ptr ES:[DI + 0x2f]
1040:13b9          8946ec                         MOV word ptr [BP + -0x14],AX
1040:13bc          268b4521                       MOV AX,word ptr ES:[DI + 0x21]
1040:13c0          268b5523                       MOV DX,word ptr ES:[DI + 0x23]
1040:13c4          8946ee                         MOV word ptr [BP + -0x12],AX
1040:13c7          8956f0                         MOV word ptr [BP + -0x10],DX
1040:13ca          26c47d06                       LES DI,ES:[DI + 0x6]
1040:13ce          06                             PUSH ES
1040:13cf          57                             PUSH DI
1040:13d0          268b3d                         MOV DI,word ptr ES:[DI]
1040:13d3          ff5d30                         CALLF [DI + 0x30]
1040:13d6          8946f6                         MOV word ptr [BP + -0xa],AX
1040:13d9          8956f8                         MOV word ptr [BP + -0x8],DX
1040:13dc          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:13df          0b46f8                         OR AX,word ptr [BP + -0x8]
1040:13e2          741d                           JZ 0x1040:1401
1040:13e4          c47ef6                         LES DI,[BP + -0xa]
1040:13e7          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:13eb          682002                         PUSH 0x220
1040:13ee          6a00                           PUSH 0x0
1040:13f0          8d7edc                         LEA DI,[BP + -0x24]
1040:13f3          16                             PUSH SS
1040:13f4          57                             PUSH DI
1040:13f5          9a7c015011                     CALLF 0x1150:017c
1040:13fa          c47e06                         LES DI,[BP + 0x6]
1040:13fd          26894504                       MOV word ptr ES:[DI + 0x4],AX
LAB_1040_1401:
1040:1401          eb16                           JMP 0x1040:1419
LAB_1040_1403:
1040:1403          ff76fa                         PUSH word ptr [BP + -0x6]
1040:1406          c47e06                         LES DI,[BP + 0x6]
1040:1409          26ff7535                       PUSH word ptr ES:[DI + 0x35]
1040:140d          9a58015011                     CALLF 0x1150:0158
1040:1412          c47e06                         LES DI,[BP + 0x6]
1040:1415          26894504                       MOV word ptr ES:[DI + 0x4],AX
LAB_1040_1419:
1040:1419          c47e06                         LES DI,[BP + 0x6]
1040:141c          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:1421          7508                           JNZ 0x1040:142b
1040:1423          26c74502ffff                   MOV word ptr ES:[DI + 0x2],0xffff
1040:1429          eb47                           JMP 0x1040:1472
LAB_1040_142b:
1040:142b          c47e06                         LES DI,[BP + 0x6]
1040:142e          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1432          9a97004010                     CALLF 0x1040:0097
1040:1437          09d0                           OR AX,DX
1040:1439          7537                           JNZ 0x1040:1472
1040:143b          c47e06                         LES DI,[BP + 0x6]
1040:143e          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1442          06                             PUSH ES
1040:1443          57                             PUSH DI
1040:1444          9a45004010                     CALLF 0x1040:0045
1040:1449          c47e06                         LES DI,[BP + 0x6]
1040:144c          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1450          6afc                           PUSH -0x4
1040:1452          26ff7514                       PUSH word ptr ES:[DI + 0x14]
1040:1456          26ff7512                       PUSH word ptr ES:[DI + 0x12]
1040:145a          9a9c015011                     CALLF 0x1150:019c
1040:145f          c47e06                         LES DI,[BP + 0x6]
1040:1462          26894537                       MOV word ptr ES:[DI + 0x37],AX
1040:1466          26895539                       MOV word ptr ES:[DI + 0x39],DX
1040:146a          06                             PUSH ES
1040:146b          57                             PUSH DI
1040:146c          268b3d                         MOV DI,word ptr ES:[DI]
1040:146f          ff5d38                         CALLF [DI + 0x38]
LAB_1040_1472:
1040:1472          c47e06                         LES DI,[BP + 0x6]
1040:1475          26837d0200                     CMP word ptr ES:[DI + 0x2],0x0
1040:147a          b000                           MOV AL,0x0
1040:147c          7501                           JNZ 0x1040:147f
1040:147e          40                             INC AX
LAB_1040_147f:
1040:147f          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:1482          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:1485          89ec                           MOV SP,BP
1040:1487          5d                             POP BP
1040:1488          4d                             DEC BP
1040:1489          ca0400                         RETF 0x4
FUN_1040_148c:
1040:148c          45                             INC BP
1040:148d          55                             PUSH BP
1040:148e          89e5                           MOV BP,SP
1040:1490          1e                             PUSH DS
1040:1491          c47e06                         LES DI,[BP + 0x6]
1040:1494          26837d3f00                     CMP word ptr ES:[DI + 0x3f],0x0
1040:1499          7429                           JZ 0x1040:14c4
1040:149b          26ff753f                       PUSH word ptr ES:[DI + 0x3f]
1040:149f          9a28015011                     CALLF 0x1150:0128
1040:14a4          09c0                           OR AX,AX
1040:14a6          741c                           JZ 0x1040:14c4
1040:14a8          c47e06                         LES DI,[BP + 0x6]
1040:14ab          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:14af          9a00015011                     CALLF 0x1150:0100
1040:14b4          09c0                           OR AX,AX
1040:14b6          750c                           JNZ 0x1040:14c4
1040:14b8          c47e06                         LES DI,[BP + 0x6]
1040:14bb          26ff753f                       PUSH word ptr ES:[DI + 0x3f]
1040:14bf          9ae8005011                     CALLF 0x1150:00e8
LAB_1040_14c4:
1040:14c4          89ec                           MOV SP,BP
1040:14c6          5d                             POP BP
1040:14c7          4d                             DEC BP
1040:14c8          ca0400                         RETF 0x4
FUN_1040_14cb:
1040:14cb          45                             INC BP
1040:14cc          55                             PUSH BP
1040:14cd          89e5                           MOV BP,SP
1040:14cf          1e                             PUSH DS
1040:14d0          83ec02                         SUB SP,0x2
1040:14d3          9aec005011                     CALLF 0x1150:00ec
1040:14d8          8946fc                         MOV word ptr [BP + -0x4],AX
1040:14db          837efc00                       CMP word ptr [BP + -0x4],0x0
1040:14df          741d                           JZ 0x1040:14fe
1040:14e1          c47e06                         LES DI,[BP + 0x6]
1040:14e4          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:14e8          ff76fc                         PUSH word ptr [BP + -0x4]
1040:14eb          9a2c015011                     CALLF 0x1150:012c
1040:14f0          09c0                           OR AX,AX
1040:14f2          740a                           JZ 0x1040:14fe
1040:14f4          8b46fc                         MOV AX,word ptr [BP + -0x4]
1040:14f7          c47e06                         LES DI,[BP + 0x6]
1040:14fa          2689453f                       MOV word ptr ES:[DI + 0x3f],AX
LAB_1040_14fe:
1040:14fe          89ec                           MOV SP,BP
1040:1500          5d                             POP BP
1040:1501          4d                             DEC BP
1040:1502          ca0400                         RETF 0x4
FUN_1040_1505:
1040:1505          45                             INC BP
1040:1506          55                             PUSH BP
1040:1507          89e5                           MOV BP,SP
1040:1509          1e                             PUSH DS
1040:150a          83ec0c                         SUB SP,0xc
1040:150d          c47e06                         LES DI,[BP + 0x6]
1040:1510          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1514          9a00015011                     CALLF 0x1150:0100
1040:1519          09c0                           OR AX,AX
1040:151b          7403                           JZ 0x1040:1520
1040:151d          e9bb00                         JMP 0x1040:15db
LAB_1040_1520:
1040:1520          c47e06                         LES DI,[BP + 0x6]
1040:1523          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1527          9adc015011                     CALLF 0x1150:01dc
1040:152c          09c0                           OR AX,AX
1040:152e          7403                           JZ 0x1040:1533
1040:1530          e9a800                         JMP 0x1040:15db
LAB_1040_1533:
1040:1533          c47e06                         LES DI,[BP + 0x6]
1040:1536          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:153a          8d7ef6                         LEA DI,[BP + -0xa]
1040:153d          16                             PUSH SS
1040:153e          57                             PUSH DI
1040:153f          9a04015011                     CALLF 0x1150:0104
1040:1544          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:1547          2b46f6                         SUB AX,word ptr [BP + -0xa]
1040:154a          c47e06                         LES DI,[BP + 0x6]
1040:154d          2689452d                       MOV word ptr ES:[DI + 0x2d],AX
1040:1551          8b46fc                         MOV AX,word ptr [BP + -0x4]
1040:1554          2b46f8                         SUB AX,word ptr [BP + -0x8]
1040:1557          2689452f                       MOV word ptr ES:[DI + 0x2f],AX
1040:155b          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1040:155f          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1040:1563          7465                           JZ 0x1040:15ca
1040:1565          26c47d06                       LES DI,ES:[DI + 0x6]
1040:1569          06                             PUSH ES
1040:156a          57                             PUSH DI
1040:156b          268b3d                         MOV DI,word ptr ES:[DI]
1040:156e          ff5d30                         CALLF [DI + 0x30]
1040:1571          8946f2                         MOV word ptr [BP + -0xe],AX
1040:1574          8956f4                         MOV word ptr [BP + -0xc],DX
1040:1577          8b46f2                         MOV AX,word ptr [BP + -0xe]
1040:157a          0b46f4                         OR AX,word ptr [BP + -0xc]
1040:157d          7423                           JZ 0x1040:15a2
1040:157f          6a08                           PUSH 0x8
1040:1581          c47e06                         LES DI,[BP + 0x6]
1040:1584          06                             PUSH ES
1040:1585          57                             PUSH DI
1040:1586          9a8d064010                     CALLF 0x1040:068d
1040:158b          08c0                           OR AL,AL
1040:158d          7413                           JZ 0x1040:15a2
1040:158f          c47ef2                         LES DI,[BP + -0xe]
1040:1592          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1596          8d7ef6                         LEA DI,[BP + -0xa]
1040:1599          16                             PUSH SS
1040:159a          57                             PUSH DI
1040:159b          9afc005011                     CALLF 0x1150:00fc
1040:15a0          eb28                           JMP 0x1040:15ca
LAB_1040_15a2:
1040:15a2          c47e06                         LES DI,[BP + 0x6]
1040:15a5          268b4521                       MOV AX,word ptr ES:[DI + 0x21]
1040:15a9          268b5523                       MOV DX,word ptr ES:[DI + 0x23]
1040:15ad          250000                         AND AX,0x0
1040:15b0          81e20040                       AND DX,0x4000
1040:15b4          09d0                           OR AX,DX
1040:15b6          7412                           JZ 0x1040:15ca
1040:15b8          26c47d06                       LES DI,ES:[DI + 0x6]
1040:15bc          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:15c0          8d7ef6                         LEA DI,[BP + -0xa]
1040:15c3          16                             PUSH SS
1040:15c4          57                             PUSH DI
1040:15c5          9afc005011                     CALLF 0x1150:00fc
LAB_1040_15ca:
1040:15ca          8b46f6                         MOV AX,word ptr [BP + -0xa]
1040:15cd          c47e06                         LES DI,[BP + 0x6]
1040:15d0          26894529                       MOV word ptr ES:[DI + 0x29],AX
1040:15d4          8b46f8                         MOV AX,word ptr [BP + -0x8]
1040:15d7          2689452b                       MOV word ptr ES:[DI + 0x2b],AX
LAB_1040_15db:
1040:15db          89ec                           MOV SP,BP
1040:15dd          5d                             POP BP
1040:15de          4d                             DEC BP
1040:15df          ca0400                         RETF 0x4
FUN_1040_15e2:
1040:15e2          45                             INC BP
1040:15e3          55                             PUSH BP
1040:15e4          89e5                           MOV BP,SP
1040:15e6          1e                             PUSH DS
1040:15e7          83ec02                         SUB SP,0x2
1040:15ea          c47e0a                         LES DI,[BP + 0xa]
1040:15ed          06                             PUSH ES
1040:15ee          57                             PUSH DI
1040:15ef          c47e06                         LES DI,[BP + 0x6]
1040:15f2          06                             PUSH ES
1040:15f3          57                             PUSH DI
1040:15f4          9ae60f4010                     CALLF 0x1040:0fe6
1040:15f9          6a01                           PUSH 0x1
1040:15fb          c47e06                         LES DI,[BP + 0x6]
1040:15fe          06                             PUSH ES
1040:15ff          57                             PUSH DI
1040:1600          9a8d064010                     CALLF 0x1040:068d
1040:1605          08c0                           OR AL,AL
1040:1607          7420                           JZ 0x1040:1629
1040:1609          c47e0a                         LES DI,[BP + 0xa]
1040:160c          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:1611          740c                           JZ 0x1040:161f
1040:1613          c47e06                         LES DI,[BP + 0x6]
1040:1616          06                             PUSH ES
1040:1617          57                             PUSH DI
1040:1618          9a8c144010                     CALLF 0x1040:148c
1040:161d          eb0a                           JMP 0x1040:1629
LAB_1040_161f:
1040:161f          c47e06                         LES DI,[BP + 0x6]
1040:1622          06                             PUSH ES
1040:1623          57                             PUSH DI
1040:1624          9acb144010                     CALLF 0x1040:14cb
LAB_1040_1629:
1040:1629          89ec                           MOV SP,BP
1040:162b          5d                             POP BP
1040:162c          4d                             DEC BP
1040:162d          ca0800                         RETF 0x8
FUN_1040_1630:
1040:1630          45                             INC BP
1040:1631          55                             PUSH BP
1040:1632          89e5                           MOV BP,SP
1040:1634          1e                             PUSH DS
1040:1635          c47e0a                         LES DI,[BP + 0xa]
1040:1638          06                             PUSH ES
1040:1639          57                             PUSH DI
1040:163a          c47e06                         LES DI,[BP + 0x6]
1040:163d          06                             PUSH ES
1040:163e          57                             PUSH DI
1040:163f          268b3d                         MOV DI,word ptr ES:[DI]
1040:1642          b80600                         MOV AX,0x6
1040:1645          9a3d0d6810                     CALLF 0x1068:0d3d
1040:164a          89ec                           MOV SP,BP
1040:164c          5d                             POP BP
1040:164d          4d                             DEC BP
1040:164e          ca0800                         RETF 0x8
FUN_1040_1651:
1040:1651          45                             INC BP
1040:1652          55                             PUSH BP
1040:1653          89e5                           MOV BP,SP
1040:1655          1e                             PUSH DS
1040:1656          c47e06                         LES DI,[BP + 0x6]
1040:1659          06                             PUSH ES
1040:165a          57                             PUSH DI
1040:165b          9a840d4010                     CALLF 0x1040:0d84
1040:1660          6a08                           PUSH 0x8
1040:1662          c47e06                         LES DI,[BP + 0x6]
1040:1665          06                             PUSH ES
1040:1666          57                             PUSH DI
1040:1667          9a8d064010                     CALLF 0x1040:068d
1040:166c          08c0                           OR AL,AL
1040:166e          740c                           JZ 0x1040:167c
1040:1670          c47e06                         LES DI,[BP + 0x6]
1040:1673          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1677          9ae8005011                     CALLF 0x1150:00e8
LAB_1040_167c:
1040:167c          c47e06                         LES DI,[BP + 0x6]
1040:167f          268b453b                       MOV AX,word ptr ES:[DI + 0x3b]
1040:1683          260b453d                       OR AX,word ptr ES:[DI + 0x3d]
1040:1687          740c                           JZ 0x1040:1695
1040:1689          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:168d          06                             PUSH ES
1040:168e          57                             PUSH DI
1040:168f          268b3d                         MOV DI,word ptr ES:[DI]
1040:1692          ff5d10                         CALLF [DI + 0x10]
LAB_1040_1695:
1040:1695          c47e06                         LES DI,[BP + 0x6]
1040:1698          06                             PUSH ES
1040:1699          57                             PUSH DI
1040:169a          9a05154010                     CALLF 0x1040:1505
1040:169f          89ec                           MOV SP,BP
1040:16a1          5d                             POP BP
1040:16a2          4d                             DEC BP
1040:16a3          ca0400                         RETF 0x4
FUN_1040_16a6:
1040:16a6          45                             INC BP
1040:16a7          55                             PUSH BP
1040:16a8          89e5                           MOV BP,SP
1040:16aa          1e                             PUSH DS
1040:16ab          c47e06                         LES DI,[BP + 0x6]
1040:16ae          06                             PUSH ES
1040:16af          57                             PUSH DI
1040:16b0          268b3d                         MOV DI,word ptr ES:[DI]
1040:16b3          ff5d38                         CALLF [DI + 0x38]
1040:16b6          c47e0a                         LES DI,[BP + 0xa]
1040:16b9          06                             PUSH ES
1040:16ba          57                             PUSH DI
1040:16bb          c47e06                         LES DI,[BP + 0x6]
1040:16be          06                             PUSH ES
1040:16bf          57                             PUSH DI
1040:16c0          268b3d                         MOV DI,word ptr ES:[DI]
1040:16c3          ff5d0c                         CALLF [DI + 0xc]
1040:16c6          89ec                           MOV SP,BP
1040:16c8          5d                             POP BP
1040:16c9          4d                             DEC BP
1040:16ca          ca0800                         RETF 0x8
FUN_1040_16cd:
1040:16cd          45                             INC BP
1040:16ce          55                             PUSH BP
1040:16cf          89e5                           MOV BP,SP
1040:16d1          1e                             PUSH DS
1040:16d2          c47e06                         LES DI,[BP + 0x6]
1040:16d5          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:16d9          6af0                           PUSH -0x10
1040:16db          9a98015011                     CALLF 0x1150:0198
1040:16e0          250000                         AND AX,0x0
1040:16e3          81e21000                       AND DX,0x10
1040:16e7          09d0                           OR AX,DX
1040:16e9          7512                           JNZ 0x1040:16fd
1040:16eb          c47e0a                         LES DI,[BP + 0xa]
1040:16ee          06                             PUSH ES
1040:16ef          57                             PUSH DI
1040:16f0          c47e06                         LES DI,[BP + 0x6]
1040:16f3          06                             PUSH ES
1040:16f4          57                             PUSH DI
1040:16f5          268b3d                         MOV DI,word ptr ES:[DI]
1040:16f8          ff5d48                         CALLF [DI + 0x48]
1040:16fb          eb39                           JMP 0x1040:1736
LAB_1040_16fd:
1040:16fd          c47e06                         LES DI,[BP + 0x6]
1040:1700          268b453b                       MOV AX,word ptr ES:[DI + 0x3b]
1040:1704          260b453d                       OR AX,word ptr ES:[DI + 0x3d]
1040:1708          741c                           JZ 0x1040:1726
1040:170a          c47e0a                         LES DI,[BP + 0xa]
1040:170d          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1711          26ff7506                       PUSH word ptr ES:[DI + 0x6]
1040:1715          c47e06                         LES DI,[BP + 0x6]
1040:1718          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:171c          06                             PUSH ES
1040:171d          57                             PUSH DI
1040:171e          268b3d                         MOV DI,word ptr ES:[DI]
1040:1721          ff5d20                         CALLF [DI + 0x20]
1040:1724          eb10                           JMP 0x1040:1736
LAB_1040_1726:
1040:1726          c47e0a                         LES DI,[BP + 0xa]
1040:1729          06                             PUSH ES
1040:172a          57                             PUSH DI
1040:172b          c47e06                         LES DI,[BP + 0x6]
1040:172e          06                             PUSH ES
1040:172f          57                             PUSH DI
1040:1730          268b3d                         MOV DI,word ptr ES:[DI]
1040:1733          ff5d0c                         CALLF [DI + 0xc]
LAB_1040_1736:
1040:1736          89ec                           MOV SP,BP
1040:1738          5d                             POP BP
1040:1739          4d                             DEC BP
1040:173a          ca0800                         RETF 0x8
FUN_1040_173d:
1040:173d          45                             INC BP
1040:173e          55                             PUSH BP
1040:173f          89e5                           MOV BP,SP
1040:1741          1e                             PUSH DS
1040:1742          c47e06                         LES DI,[BP + 0x6]
1040:1745          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1749          6af0                           PUSH -0x10
1040:174b          9a98015011                     CALLF 0x1150:0198
1040:1750          250000                         AND AX,0x0
1040:1753          81e22000                       AND DX,0x20
1040:1757          09d0                           OR AX,DX
1040:1759          7512                           JNZ 0x1040:176d
1040:175b          c47e0a                         LES DI,[BP + 0xa]
1040:175e          06                             PUSH ES
1040:175f          57                             PUSH DI
1040:1760          c47e06                         LES DI,[BP + 0x6]
1040:1763          06                             PUSH ES
1040:1764          57                             PUSH DI
1040:1765          268b3d                         MOV DI,word ptr ES:[DI]
1040:1768          ff5d48                         CALLF [DI + 0x48]
1040:176b          eb39                           JMP 0x1040:17a6
LAB_1040_176d:
1040:176d          c47e06                         LES DI,[BP + 0x6]
1040:1770          268b453b                       MOV AX,word ptr ES:[DI + 0x3b]
1040:1774          260b453d                       OR AX,word ptr ES:[DI + 0x3d]
1040:1778          741c                           JZ 0x1040:1796
1040:177a          c47e0a                         LES DI,[BP + 0xa]
1040:177d          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1781          26ff7506                       PUSH word ptr ES:[DI + 0x6]
1040:1785          c47e06                         LES DI,[BP + 0x6]
1040:1788          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:178c          06                             PUSH ES
1040:178d          57                             PUSH DI
1040:178e          268b3d                         MOV DI,word ptr ES:[DI]
1040:1791          ff5d1c                         CALLF [DI + 0x1c]
1040:1794          eb10                           JMP 0x1040:17a6
LAB_1040_1796:
1040:1796          c47e0a                         LES DI,[BP + 0xa]
1040:1799          06                             PUSH ES
1040:179a          57                             PUSH DI
1040:179b          c47e06                         LES DI,[BP + 0x6]
1040:179e          06                             PUSH ES
1040:179f          57                             PUSH DI
1040:17a0          268b3d                         MOV DI,word ptr ES:[DI]
1040:17a3          ff5d0c                         CALLF [DI + 0xc]
LAB_1040_17a6:
1040:17a6          89ec                           MOV SP,BP
1040:17a8          5d                             POP BP
1040:17a9          4d                             DEC BP
1040:17aa          ca0800                         RETF 0x8
FUN_1040_17ad:
1040:17ad          45                             INC BP
1040:17ae          55                             PUSH BP
1040:17af          89e5                           MOV BP,SP
1040:17b1          1e                             PUSH DS
1040:17b2          83ec20                         SUB SP,0x20
1040:17b5          c47e06                         LES DI,[BP + 0x6]
1040:17b8          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:17bc          8d7ede                         LEA DI,[BP + -0x22]
1040:17bf          16                             PUSH SS
1040:17c0          57                             PUSH DI
1040:17c1          9a14015011                     CALLF 0x1150:0114
1040:17c6          c47e06                         LES DI,[BP + 0x6]
1040:17c9          268b453b                       MOV AX,word ptr ES:[DI + 0x3b]
1040:17cd          260b453d                       OR AX,word ptr ES:[DI + 0x3d]
1040:17d1          7417                           JZ 0x1040:17ea
1040:17d3          ff76de                         PUSH word ptr [BP + -0x22]
1040:17d6          8d7ede                         LEA DI,[BP + -0x22]
1040:17d9          16                             PUSH SS
1040:17da          57                             PUSH DI
1040:17db          c47e06                         LES DI,[BP + 0x6]
1040:17de          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:17e2          06                             PUSH ES
1040:17e3          57                             PUSH DI
1040:17e4          268b3d                         MOV DI,word ptr ES:[DI]
1040:17e7          ff5d14                         CALLF [DI + 0x14]
LAB_1040_17ea:
1040:17ea          ff76de                         PUSH word ptr [BP + -0x22]
1040:17ed          8d7ede                         LEA DI,[BP + -0x22]
1040:17f0          16                             PUSH SS
1040:17f1          57                             PUSH DI
1040:17f2          c47e06                         LES DI,[BP + 0x6]
1040:17f5          06                             PUSH ES
1040:17f6          57                             PUSH DI
1040:17f7          268b3d                         MOV DI,word ptr ES:[DI]
1040:17fa          ff5d4c                         CALLF [DI + 0x4c]
1040:17fd          c47e06                         LES DI,[BP + 0x6]
1040:1800          268b453b                       MOV AX,word ptr ES:[DI + 0x3b]
1040:1804          260b453d                       OR AX,word ptr ES:[DI + 0x3d]
1040:1808          740c                           JZ 0x1040:1816
1040:180a          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:180e          06                             PUSH ES
1040:180f          57                             PUSH DI
1040:1810          268b3d                         MOV DI,word ptr ES:[DI]
1040:1813          ff5d18                         CALLF [DI + 0x18]
LAB_1040_1816:
1040:1816          c47e06                         LES DI,[BP + 0x6]
1040:1819          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:181d          8d7ede                         LEA DI,[BP + -0x22]
1040:1820          16                             PUSH SS
1040:1821          57                             PUSH DI
1040:1822          9a18015011                     CALLF 0x1150:0118
1040:1827          89ec                           MOV SP,BP
1040:1829          5d                             POP BP
1040:182a          4d                             DEC BP
1040:182b          ca0800                         RETF 0x8
FUN_1040_182e:
1040:182e          45                             INC BP
1040:182f          55                             PUSH BP
1040:1830          89e5                           MOV BP,SP
1040:1832          1e                             PUSH DS
1040:1833          89ec                           MOV SP,BP
1040:1835          5d                             POP BP
1040:1836          4d                             DEC BP
1040:1837          ca0a00                         RETF 0xa
FUN_1040_183a:
1040:183a          45                             INC BP
1040:183b          55                             PUSH BP
1040:183c          89e5                           MOV BP,SP
1040:183e          1e                             PUSH DS
1040:183f          83ec08                         SUB SP,0x8
1040:1842          c47e06                         LES DI,[BP + 0x6]
1040:1845          268b453b                       MOV AX,word ptr ES:[DI + 0x3b]
1040:1849          260b453d                       OR AX,word ptr ES:[DI + 0x3d]
1040:184d          7419                           JZ 0x1040:1868
1040:184f          c47e0a                         LES DI,[BP + 0xa]
1040:1852          26837d0401                     CMP word ptr ES:[DI + 0x4],0x1
1040:1857          740f                           JZ 0x1040:1868
1040:1859          c47e06                         LES DI,[BP + 0x6]
1040:185c          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:1860          06                             PUSH ES
1040:1861          57                             PUSH DI
1040:1862          268b3d                         MOV DI,word ptr ES:[DI]
1040:1865          ff5d0c                         CALLF [DI + 0xc]
LAB_1040_1868:
1040:1868          c47e0a                         LES DI,[BP + 0xa]
1040:186b          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:1870          7528                           JNZ 0x1040:189a
1040:1872          c47e06                         LES DI,[BP + 0x6]
1040:1875          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1879          8d7ef6                         LEA DI,[BP + -0xa]
1040:187c          16                             PUSH SS
1040:187d          57                             PUSH DI
1040:187e          9a04015011                     CALLF 0x1150:0104
1040:1883          8b46fc                         MOV AX,word ptr [BP + -0x4]
1040:1886          2b46f8                         SUB AX,word ptr [BP + -0x8]
1040:1889          c47e06                         LES DI,[BP + 0x6]
1040:188c          2689452f                       MOV word ptr ES:[DI + 0x2f],AX
1040:1890          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:1893          2b46f6                         SUB AX,word ptr [BP + -0xa]
1040:1896          2689452d                       MOV word ptr ES:[DI + 0x2d],AX
LAB_1040_189a:
1040:189a          c47e0a                         LES DI,[BP + 0xa]
1040:189d          06                             PUSH ES
1040:189e          57                             PUSH DI
1040:189f          c47e06                         LES DI,[BP + 0x6]
1040:18a2          06                             PUSH ES
1040:18a3          57                             PUSH DI
1040:18a4          268b3d                         MOV DI,word ptr ES:[DI]
1040:18a7          ff5d0c                         CALLF [DI + 0xc]
1040:18aa          89ec                           MOV SP,BP
1040:18ac          5d                             POP BP
1040:18ad          4d                             DEC BP
1040:18ae          ca0800                         RETF 0x8
FUN_1040_18b1:
1040:18b1          45                             INC BP
1040:18b2          55                             PUSH BP
1040:18b3          89e5                           MOV BP,SP
1040:18b5          1e                             PUSH DS
1040:18b6          c47e06                         LES DI,[BP + 0x6]
1040:18b9          06                             PUSH ES
1040:18ba          57                             PUSH DI
1040:18bb          9a05154010                     CALLF 0x1040:1505
1040:18c0          c47e0a                         LES DI,[BP + 0xa]
1040:18c3          06                             PUSH ES
1040:18c4          57                             PUSH DI
1040:18c5          c47e06                         LES DI,[BP + 0x6]
1040:18c8          06                             PUSH ES
1040:18c9          57                             PUSH DI
1040:18ca          268b3d                         MOV DI,word ptr ES:[DI]
1040:18cd          ff5d0c                         CALLF [DI + 0xc]
1040:18d0          89ec                           MOV SP,BP
1040:18d2          5d                             POP BP
1040:18d3          4d                             DEC BP
1040:18d4          ca0800                         RETF 0x8
FUN_1040_18d7:
1040:18d7          45                             INC BP
1040:18d8          55                             PUSH BP
1040:18d9          89e5                           MOV BP,SP
1040:18db          1e                             PUSH DS
1040:18dc          83ec12                         SUB SP,0x12
1040:18df          c47e06                         LES DI,[BP + 0x6]
1040:18e2          268b453b                       MOV AX,word ptr ES:[DI + 0x3b]
1040:18e6          260b453d                       OR AX,word ptr ES:[DI + 0x3d]
1040:18ea          745c                           JZ 0x1040:1948
1040:18ec          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:18f0          26807d2200                     CMP byte ptr ES:[DI + 0x22],0x0
1040:18f5          7451                           JZ 0x1040:1948
1040:18f7          c47e06                         LES DI,[BP + 0x6]
1040:18fa          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:18fe          9ae0005011                     CALLF 0x1150:00e0
LAB_1040_1903:
1040:1903          8d7eec                         LEA DI,[BP + -0x14]
1040:1906          16                             PUSH SS
1040:1907          57                             PUSH DI
1040:1908          6a00                           PUSH 0x0
1040:190a          6a00                           PUSH 0x0
1040:190c          6a00                           PUSH 0x0
1040:190e          6a01                           PUSH 0x1
1040:1910          9a78015011                     CALLF 0x1150:0178
1040:1915          09c0                           OR AX,AX
1040:1917          7414                           JZ 0x1040:192d
1040:1919          8d7eec                         LEA DI,[BP + -0x14]
1040:191c          16                             PUSH SS
1040:191d          57                             PUSH DI
1040:191e          9a84015011                     CALLF 0x1150:0184
1040:1923          8d7eec                         LEA DI,[BP + -0x14]
1040:1926          16                             PUSH SS
1040:1927          57                             PUSH DI
1040:1928          9a88015011                     CALLF 0x1150:0188
LAB_1040_192d:
1040:192d          c47e06                         LES DI,[BP + 0x6]
1040:1930          26c47d3b                       LES DI,ES:[DI + 0x3b]
1040:1934          06                             PUSH ES
1040:1935          57                             PUSH DI
1040:1936          268b3d                         MOV DI,word ptr ES:[DI]
1040:1939          ff5d24                         CALLF [DI + 0x24]
1040:193c          817eee0202                     CMP word ptr [BP + -0x12],0x202
1040:1941          75c0                           JNZ 0x1040:1903
1040:1943          9ae4005011                     CALLF 0x1150:00e4
LAB_1040_1948:
1040:1948          c47e0a                         LES DI,[BP + 0xa]
1040:194b          06                             PUSH ES
1040:194c          57                             PUSH DI
1040:194d          c47e06                         LES DI,[BP + 0x6]
1040:1950          06                             PUSH ES
1040:1951          57                             PUSH DI
1040:1952          268b3d                         MOV DI,word ptr ES:[DI]
1040:1955          ff5d0c                         CALLF [DI + 0xc]
1040:1958          89ec                           MOV SP,BP
1040:195a          5d                             POP BP
1040:195b          4d                             DEC BP
1040:195c          ca0800                         RETF 0x8
FUN_1040_195f:
1040:195f          45                             INC BP
1040:1960          55                             PUSH BP
1040:1961          89e5                           MOV BP,SP
1040:1963          1e                             PUSH DS
1040:1964          6a01                           PUSH 0x1
1040:1966          c47e06                         LES DI,[BP + 0x6]
1040:1969          06                             PUSH ES
1040:196a          57                             PUSH DI
1040:196b          9a8d064010                     CALLF 0x1040:068d
1040:1970          08c0                           OR AL,AL
1040:1972          7427                           JZ 0x1040:199b
1040:1974          c47e0a                         LES DI,[BP + 0xa]
1040:1977          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1040:197b          3d20f0                         CMP AX,0xf020
1040:197e          750c                           JNZ 0x1040:198c
1040:1980          c47e06                         LES DI,[BP + 0x6]
1040:1983          06                             PUSH ES
1040:1984          57                             PUSH DI
1040:1985          9acb144010                     CALLF 0x1040:14cb
1040:198a          eb0f                           JMP 0x1040:199b
LAB_1040_198c:
1040:198c          3d20f1                         CMP AX,0xf120
1040:198f          750a                           JNZ 0x1040:199b
1040:1991          c47e06                         LES DI,[BP + 0x6]
1040:1994          06                             PUSH ES
1040:1995          57                             PUSH DI
1040:1996          9a8c144010                     CALLF 0x1040:148c
LAB_1040_199b:
1040:199b          c47e0a                         LES DI,[BP + 0xa]
1040:199e          06                             PUSH ES
1040:199f          57                             PUSH DI
1040:19a0          c47e06                         LES DI,[BP + 0x6]
1040:19a3          06                             PUSH ES
1040:19a4          57                             PUSH DI
1040:19a5          268b3d                         MOV DI,word ptr ES:[DI]
1040:19a8          ff5d0c                         CALLF [DI + 0xc]
1040:19ab          89ec                           MOV SP,BP
1040:19ad          5d                             POP BP
1040:19ae          4d                             DEC BP
1040:19af          ca0800                         RETF 0x8
FUN_1040_19b2:
1040:19b2          45                             INC BP
1040:19b3          55                             PUSH BP
1040:19b4          89e5                           MOV BP,SP
1040:19b6          1e                             PUSH DS
1040:19b7          31ff                           XOR DI,DI
1040:19b9          9aef036810                     CALLF 0x1068:03ef
1040:19be          7503                           JNZ 0x1040:19c3
1040:19c0          e98a00                         JMP 0x1040:1a4d
LAB_1040_19c3:
1040:19c3          31c0                           XOR AX,AX
1040:19c5          50                             PUSH AX
1040:19c6          c47e06                         LES DI,[BP + 0x6]
1040:19c9          06                             PUSH ES
1040:19ca          57                             PUSH DI
1040:19cb          9a02005010                     CALLF 0x1050:0002
1040:19d0          8b460c                         MOV AX,word ptr [BP + 0xc]
1040:19d3          8b560e                         MOV DX,word ptr [BP + 0xe]
1040:19d6          c47e06                         LES DI,[BP + 0x6]
1040:19d9          26894504                       MOV word ptr ES:[DI + 0x4],AX
1040:19dd          26895506                       MOV word ptr ES:[DI + 0x6],DX
1040:19e1          89f8                           MOV AX,DI
1040:19e3          8cc2                           MOV DX,ES
1040:19e5          a32218                         MOV [0x1822],AX
1040:19e8          89162418                       MOV word ptr [0x1824],DX
1040:19ec          31c0                           XOR AX,AX
1040:19ee          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1040:19f2          31c0                           XOR AX,AX
1040:19f4          26894502                       MOV word ptr ES:[DI + 0x2],AX
1040:19f8          31c0                           XOR AX,AX
1040:19fa          26894508                       MOV word ptr ES:[DI + 0x8],AX
1040:19fe          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1040:1a02          31c0                           XOR AX,AX
1040:1a04          2689450e                       MOV word ptr ES:[DI + 0xe],AX
1040:1a08          26894510                       MOV word ptr ES:[DI + 0x10],AX
1040:1a0c          bf3301                         MOV DI,0x133
1040:1a0f          b84010                         MOV AX,0x1040
1040:1a12          50                             PUSH AX
1040:1a13          57                             PUSH DI
1040:1a14          ff364419                       PUSH word ptr [0x1944]
1040:1a18          9a20005011                     CALLF 0x1150:0020
1040:1a1d          a34618                         MOV [0x1846],AX
1040:1a20          89164818                       MOV word ptr [0x1848],DX
1040:1a24          9ad1005810                     CALLF 0x1058:00d1
1040:1a29          833e421900                     CMP word ptr [0x1942],0x0
1040:1a2e          750b                           JNZ 0x1040:1a3b
1040:1a30          c47e06                         LES DI,[BP + 0x6]
1040:1a33          06                             PUSH ES
1040:1a34          57                             PUSH DI
1040:1a35          268b3d                         MOV DI,word ptr ES:[DI]
1040:1a38          ff5d10                         CALLF [DI + 0x10]
LAB_1040_1a3b:
1040:1a3b          c47e06                         LES DI,[BP + 0x6]
1040:1a3e          26837d0200                     CMP word ptr ES:[DI + 0x2],0x0
1040:1a43          7508                           JNZ 0x1040:1a4d
1040:1a45          06                             PUSH ES
1040:1a46          57                             PUSH DI
1040:1a47          268b3d                         MOV DI,word ptr ES:[DI]
1040:1a4a          ff5d14                         CALLF [DI + 0x14]
LAB_1040_1a4d:
1040:1a4d          c44606                         LES AX,[BP + 0x6]
1040:1a50          8cc2                           MOV DX,ES
1040:1a52          89ec                           MOV SP,BP
1040:1a54          5d                             POP BP
1040:1a55          4d                             DEC BP
1040:1a56          ca0a00                         RETF 0xa
FUN_1040_1a59:
1040:1a59          45                             INC BP
1040:1a5a          55                             PUSH BP
1040:1a5b          89e5                           MOV BP,SP
1040:1a5d          1e                             PUSH DS
1040:1a5e          ff364818                       PUSH word ptr [0x1848]
1040:1a62          ff364618                       PUSH word ptr [0x1846]
1040:1a66          9a24005011                     CALLF 0x1150:0024
1040:1a6b          31c0                           XOR AX,AX
1040:1a6d          50                             PUSH AX
1040:1a6e          c47e06                         LES DI,[BP + 0x6]
1040:1a71          06                             PUSH ES
1040:1a72          57                             PUSH DI
1040:1a73          9a36005010                     CALLF 0x1050:0036
1040:1a78          31ff                           XOR DI,DI
1040:1a7a          9a39046810                     CALLF 0x1068:0439
1040:1a7f          89ec                           MOV SP,BP
1040:1a81          5d                             POP BP
1040:1a82          4d                             DEC BP
1040:1a83          ca0600                         RETF 0x6
FUN_1040_1a86:
1040:1a86          45                             INC BP
1040:1a87          55                             PUSH BP
1040:1a88          89e5                           MOV BP,SP
1040:1a8a          1e                             PUSH DS
1040:1a8b          83ec02                         SUB SP,0x2
1040:1a8e          c646fd00                       MOV byte ptr [BP + -0x3],0x0
1040:1a92          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:1a95          89ec                           MOV SP,BP
1040:1a97          5d                             POP BP
1040:1a98          4d                             DEC BP
1040:1a99          ca0400                         RETF 0x4
FUN_1040_1a9c:
1040:1a9c          45                             INC BP
1040:1a9d          55                             PUSH BP
1040:1a9e          89e5                           MOV BP,SP
1040:1aa0          1e                             PUSH DS
1040:1aa1          89ec                           MOV SP,BP
1040:1aa3          5d                             POP BP
1040:1aa4          4d                             DEC BP
1040:1aa5          ca0400                         RETF 0x4
FUN_1040_1aa8:
1040:1aa8          45                             INC BP
1040:1aa9          55                             PUSH BP
1040:1aaa          89e5                           MOV BP,SP
1040:1aac          1e                             PUSH DS
1040:1aad          c47e06                         LES DI,[BP + 0x6]
1040:1ab0          06                             PUSH ES
1040:1ab1          57                             PUSH DI
1040:1ab2          268b3d                         MOV DI,word ptr ES:[DI]
1040:1ab5          ff5d18                         CALLF [DI + 0x18]
1040:1ab8          c47e06                         LES DI,[BP + 0x6]
1040:1abb          26ff750a                       PUSH word ptr ES:[DI + 0xa]
1040:1abf          26ff7508                       PUSH word ptr ES:[DI + 0x8]
1040:1ac3          06                             PUSH ES
1040:1ac4          57                             PUSH DI
1040:1ac5          268b3d                         MOV DI,word ptr ES:[DI]
1040:1ac8          ff5d34                         CALLF [DI + 0x34]
1040:1acb          c47e06                         LES DI,[BP + 0x6]
1040:1ace          26894508                       MOV word ptr ES:[DI + 0x8],AX
1040:1ad2          2689550a                       MOV word ptr ES:[DI + 0xa],DX
1040:1ad6          268b4508                       MOV AX,word ptr ES:[DI + 0x8]
1040:1ada          260b450a                       OR AX,word ptr ES:[DI + 0xa]
1040:1ade          7411                           JZ 0x1040:1af1
1040:1ae0          ff364619                       PUSH word ptr [0x1946]
1040:1ae4          26c47d08                       LES DI,ES:[DI + 0x8]
1040:1ae8          06                             PUSH ES
1040:1ae9          57                             PUSH DI
1040:1aea          9a870e4010                     CALLF 0x1040:0e87
1040:1aef          eb09                           JMP 0x1040:1afa
LAB_1040_1af1:
1040:1af1          c47e06                         LES DI,[BP + 0x6]
1040:1af4          26c74502fbff                   MOV word ptr ES:[DI + 0x2],0xfffb
LAB_1040_1afa:
1040:1afa          89ec                           MOV SP,BP
1040:1afc          5d                             POP BP
1040:1afd          4d                             DEC BP
1040:1afe          ca0400                         RETF 0x4
FUN_1040_1b01:
1040:1b01          45                             INC BP
1040:1b02          55                             PUSH BP
1040:1b03          89e5                           MOV BP,SP
1040:1b05          1e                             PUSH DS
1040:1b06          c47e06                         LES DI,[BP + 0x6]
1040:1b09          26837d0200                     CMP word ptr ES:[DI + 0x2],0x0
1040:1b0e          750a                           JNZ 0x1040:1b1a
1040:1b10          06                             PUSH ES
1040:1b11          57                             PUSH DI
1040:1b12          268b3d                         MOV DI,word ptr ES:[DI]
1040:1b15          ff5d20                         CALLF [DI + 0x20]
1040:1b18          eb0f                           JMP 0x1040:1b29
LAB_1040_1b1a:
1040:1b1a          c47e06                         LES DI,[BP + 0x6]
1040:1b1d          26ff7502                       PUSH word ptr ES:[DI + 0x2]
1040:1b21          06                             PUSH ES
1040:1b22          57                             PUSH DI
1040:1b23          268b3d                         MOV DI,word ptr ES:[DI]
1040:1b26          ff5d40                         CALLF [DI + 0x40]
LAB_1040_1b29:
1040:1b29          89ec                           MOV SP,BP
1040:1b2b          5d                             POP BP
1040:1b2c          4d                             DEC BP
1040:1b2d          ca0400                         RETF 0x4
FUN_1040_1b30:
1040:1b30          45                             INC BP
1040:1b31          55                             PUSH BP
1040:1b32          89e5                           MOV BP,SP
1040:1b34          1e                             PUSH DS
1040:1b35          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:1b38          8b560c                         MOV DX,word ptr [BP + 0xc]
1040:1b3b          c47e06                         LES DI,[BP + 0x6]
1040:1b3e          2689450e                       MOV word ptr ES:[DI + 0xe],AX
1040:1b42          26895510                       MOV word ptr ES:[DI + 0x10],DX
1040:1b46          89ec                           MOV SP,BP
1040:1b48          5d                             POP BP
1040:1b49          4d                             DEC BP
1040:1b4a          ca0800                         RETF 0x8
FUN_1040_1b4d:
1040:1b4d          45                             INC BP
1040:1b4e          55                             PUSH BP
1040:1b4f          89e5                           MOV BP,SP
1040:1b51          1e                             PUSH DS
1040:1b52          83ec14                         SUB SP,0x14
1040:1b55          c646eb00                       MOV byte ptr [BP + -0x15],0x0
LAB_1040_1b59:
1040:1b59          8d7eec                         LEA DI,[BP + -0x14]
1040:1b5c          16                             PUSH SS
1040:1b5d          57                             PUSH DI
1040:1b5e          6a00                           PUSH 0x0
1040:1b60          6a00                           PUSH 0x0
1040:1b62          6a00                           PUSH 0x0
1040:1b64          6a01                           PUSH 0x1
1040:1b66          9a78015011                     CALLF 0x1150:0178
1040:1b6b          09c0                           OR AX,AX
1040:1b6d          7436                           JZ 0x1040:1ba5
1040:1b6f          837eee12                       CMP word ptr [BP + -0x12],0x12
1040:1b73          7506                           JNZ 0x1040:1b7b
1040:1b75          c646eb01                       MOV byte ptr [BP + -0x15],0x1
1040:1b79          eb28                           JMP 0x1040:1ba3
LAB_1040_1b7b:
1040:1b7b          8d7eec                         LEA DI,[BP + -0x14]
1040:1b7e          16                             PUSH SS
1040:1b7f          57                             PUSH DI
1040:1b80          c47e06                         LES DI,[BP + 0x6]
1040:1b83          06                             PUSH ES
1040:1b84          57                             PUSH DI
1040:1b85          268b3d                         MOV DI,word ptr ES:[DI]
1040:1b88          ff5d24                         CALLF [DI + 0x24]
1040:1b8b          08c0                           OR AL,AL
1040:1b8d          7514                           JNZ 0x1040:1ba3
1040:1b8f          8d7eec                         LEA DI,[BP + -0x14]
1040:1b92          16                             PUSH SS
1040:1b93          57                             PUSH DI
1040:1b94          9a84015011                     CALLF 0x1150:0184
1040:1b99          8d7eec                         LEA DI,[BP + -0x14]
1040:1b9c          16                             PUSH SS
1040:1b9d          57                             PUSH DI
1040:1b9e          9a88015011                     CALLF 0x1150:0188
LAB_1040_1ba3:
1040:1ba3          eb14                           JMP 0x1040:1bb9
LAB_1040_1ba5:
1040:1ba5          c47e06                         LES DI,[BP + 0x6]
1040:1ba8          06                             PUSH ES
1040:1ba9          57                             PUSH DI
1040:1baa          268b3d                         MOV DI,word ptr ES:[DI]
1040:1bad          ff5d0c                         CALLF [DI + 0xc]
1040:1bb0          08c0                           OR AL,AL
1040:1bb2          7505                           JNZ 0x1040:1bb9
1040:1bb4          9a80015011                     CALLF 0x1150:0180
LAB_1040_1bb9:
1040:1bb9          807eeb00                       CMP byte ptr [BP + -0x15],0x0
1040:1bbd          749a                           JZ 0x1040:1b59
1040:1bbf          8b46f0                         MOV AX,word ptr [BP + -0x10]
1040:1bc2          c47e06                         LES DI,[BP + 0x6]
1040:1bc5          26894502                       MOV word ptr ES:[DI + 0x2],AX
1040:1bc9          89ec                           MOV SP,BP
1040:1bcb          5d                             POP BP
1040:1bcc          4d                             DEC BP
1040:1bcd          ca0400                         RETF 0x4
FUN_1040_1bd0:
1040:1bd0          45                             INC BP
1040:1bd1          55                             PUSH BP
1040:1bd2          89e5                           MOV BP,SP
1040:1bd4          1e                             PUSH DS
1040:1bd5          83ec02                         SUB SP,0x2
1040:1bd8          c47e0a                         LES DI,[BP + 0xa]
1040:1bdb          06                             PUSH ES
1040:1bdc          57                             PUSH DI
1040:1bdd          c47e06                         LES DI,[BP + 0x6]
1040:1be0          06                             PUSH ES
1040:1be1          57                             PUSH DI
1040:1be2          268b3d                         MOV DI,word ptr ES:[DI]
1040:1be5          ff5d28                         CALLF [DI + 0x28]
1040:1be8          08c0                           OR AL,AL
1040:1bea          752c                           JNZ 0x1040:1c18
1040:1bec          c47e0a                         LES DI,[BP + 0xa]
1040:1bef          06                             PUSH ES
1040:1bf0          57                             PUSH DI
1040:1bf1          c47e06                         LES DI,[BP + 0x6]
1040:1bf4          06                             PUSH ES
1040:1bf5          57                             PUSH DI
1040:1bf6          268b3d                         MOV DI,word ptr ES:[DI]
1040:1bf9          ff5d30                         CALLF [DI + 0x30]
1040:1bfc          08c0                           OR AL,AL
1040:1bfe          7518                           JNZ 0x1040:1c18
1040:1c00          c47e0a                         LES DI,[BP + 0xa]
1040:1c03          06                             PUSH ES
1040:1c04          57                             PUSH DI
1040:1c05          c47e06                         LES DI,[BP + 0x6]
1040:1c08          06                             PUSH ES
1040:1c09          57                             PUSH DI
1040:1c0a          268b3d                         MOV DI,word ptr ES:[DI]
1040:1c0d          ff5d2c                         CALLF [DI + 0x2c]
1040:1c10          08c0                           OR AL,AL
1040:1c12          7504                           JNZ 0x1040:1c18
1040:1c14          b000                           MOV AL,0x0
1040:1c16          eb02                           JMP 0x1040:1c1a
LAB_1040_1c18:
1040:1c18          b001                           MOV AL,0x1
LAB_1040_1c1a:
1040:1c1a          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:1c1d          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:1c20          89ec                           MOV SP,BP
1040:1c22          5d                             POP BP
1040:1c23          4d                             DEC BP
1040:1c24          ca0800                         RETF 0x8
FUN_1040_1c27:
1040:1c27          45                             INC BP
1040:1c28          55                             PUSH BP
1040:1c29          89e5                           MOV BP,SP
1040:1c2b          1e                             PUSH DS
1040:1c2c          83ec02                         SUB SP,0x2
1040:1c2f          c646fd00                       MOV byte ptr [BP + -0x3],0x0
1040:1c33          c47e06                         LES DI,[BP + 0x6]
1040:1c36          268b450e                       MOV AX,word ptr ES:[DI + 0xe]
1040:1c3a          260b4510                       OR AX,word ptr ES:[DI + 0x10]
1040:1c3e          7429                           JZ 0x1040:1c69
1040:1c40          26c47d0e                       LES DI,ES:[DI + 0xe]
1040:1c44          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1040:1c49          741e                           JZ 0x1040:1c69
1040:1c4b          c47e06                         LES DI,[BP + 0x6]
1040:1c4e          26c47d0e                       LES DI,ES:[DI + 0xe]
1040:1c52          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1c56          c47e0a                         LES DI,[BP + 0xa]
1040:1c59          06                             PUSH ES
1040:1c5a          57                             PUSH DI
1040:1c5b          9a54015011                     CALLF 0x1150:0154
1040:1c60          f7d8                           NEG AX
1040:1c62          18c0                           SBB AL,AL
1040:1c64          f6d8                           NEG AL
1040:1c66          8846fd                         MOV byte ptr [BP + -0x3],AL
LAB_1040_1c69:
1040:1c69          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:1c6c          89ec                           MOV SP,BP
1040:1c6e          5d                             POP BP
1040:1c6f          4d                             DEC BP
1040:1c70          ca0800                         RETF 0x8
FUN_1040_1c73:
1040:1c73          45                             INC BP
1040:1c74          55                             PUSH BP
1040:1c75          89e5                           MOV BP,SP
1040:1c77          1e                             PUSH DS
1040:1c78          83ec02                         SUB SP,0x2
1040:1c7b          c47e06                         LES DI,[BP + 0x6]
1040:1c7e          26837d0c00                     CMP word ptr ES:[DI + 0xc],0x0
1040:1c83          741d                           JZ 0x1040:1ca2
1040:1c85          26c47d08                       LES DI,ES:[DI + 0x8]
1040:1c89          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1c8d          c47e06                         LES DI,[BP + 0x6]
1040:1c90          26ff750c                       PUSH word ptr ES:[DI + 0xc]
1040:1c94          c47e0a                         LES DI,[BP + 0xa]
1040:1c97          06                             PUSH ES
1040:1c98          57                             PUSH DI
1040:1c99          9ac4015011                     CALLF 0x1150:01c4
1040:1c9e          09c0                           OR AX,AX
1040:1ca0          7504                           JNZ 0x1040:1ca6
LAB_1040_1ca2:
1040:1ca2          b000                           MOV AL,0x0
1040:1ca4          eb02                           JMP 0x1040:1ca8
LAB_1040_1ca6:
1040:1ca6          b001                           MOV AL,0x1
LAB_1040_1ca8:
1040:1ca8          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:1cab          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:1cae          89ec                           MOV SP,BP
1040:1cb0          5d                             POP BP
1040:1cb1          4d                             DEC BP
1040:1cb2          ca0800                         RETF 0x8
FUN_1040_1cb5:
1040:1cb5          45                             INC BP
1040:1cb6          55                             PUSH BP
1040:1cb7          89e5                           MOV BP,SP
1040:1cb9          1e                             PUSH DS
1040:1cba          83ec06                         SUB SP,0x6
1040:1cbd          c47e06                         LES DI,[BP + 0x6]
1040:1cc0          26c47d08                       LES DI,ES:[DI + 0x8]
1040:1cc4          06                             PUSH ES
1040:1cc5          57                             PUSH DI
1040:1cc6          268b3d                         MOV DI,word ptr ES:[DI]
1040:1cc9          ff5d30                         CALLF [DI + 0x30]
1040:1ccc          8946f8                         MOV word ptr [BP + -0x8],AX
1040:1ccf          8956fa                         MOV word ptr [BP + -0x6],DX
1040:1cd2          8b46f8                         MOV AX,word ptr [BP + -0x8]
1040:1cd5          0b46fa                         OR AX,word ptr [BP + -0x6]
1040:1cd8          7415                           JZ 0x1040:1cef
1040:1cda          c47ef8                         LES DI,[BP + -0x8]
1040:1cdd          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1040:1ce1          c47e0a                         LES DI,[BP + 0xa]
1040:1ce4          06                             PUSH ES
1040:1ce5          57                             PUSH DI
1040:1ce6          9af0015011                     CALLF 0x1150:01f0
1040:1ceb          09c0                           OR AX,AX
1040:1ced          7504                           JNZ 0x1040:1cf3
LAB_1040_1cef:
1040:1cef          b000                           MOV AL,0x0
1040:1cf1          eb02                           JMP 0x1040:1cf5
LAB_1040_1cf3:
1040:1cf3          b001                           MOV AL,0x1
LAB_1040_1cf5:
1040:1cf5          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:1cf8          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:1cfb          89ec                           MOV SP,BP
1040:1cfd          5d                             POP BP
1040:1cfe          4d                             DEC BP
1040:1cff          ca0800                         RETF 0x8
FUN_1040_1d02:
1040:1d02          45                             INC BP
1040:1d03          55                             PUSH BP
1040:1d04          89e5                           MOV BP,SP
1040:1d06          1e                             PUSH DS
1040:1d07          83ec04                         SUB SP,0x4
1040:1d0a          31c0                           XOR AX,AX
1040:1d0c          8946fa                         MOV word ptr [BP + -0x6],AX
1040:1d0f          8946fc                         MOV word ptr [BP + -0x4],AX
1040:1d12          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:1d15          0b460c                         OR AX,word ptr [BP + 0xc]
1040:1d18          7463                           JZ 0x1040:1d7d
1040:1d1a          9a02005810                     CALLF 0x1058:0002
1040:1d1f          08c0                           OR AL,AL
1040:1d21          7422                           JZ 0x1040:1d45
1040:1d23          6afe                           PUSH -0x2
1040:1d25          c47e06                         LES DI,[BP + 0x6]
1040:1d28          06                             PUSH ES
1040:1d29          57                             PUSH DI
1040:1d2a          268b3d                         MOV DI,word ptr ES:[DI]
1040:1d2d          ff5d40                         CALLF [DI + 0x40]
1040:1d30          b001                           MOV AL,0x1
1040:1d32          50                             PUSH AX
1040:1d33          c47e0a                         LES DI,[BP + 0xa]
1040:1d36          06                             PUSH ES
1040:1d37          57                             PUSH DI
1040:1d38          268b3d                         MOV DI,word ptr ES:[DI]
1040:1d3b          ff5d08                         CALLF [DI + 0x8]
1040:1d3e          9a21005810                     CALLF 0x1058:0021
1040:1d43          eb38                           JMP 0x1040:1d7d
LAB_1040_1d45:
1040:1d45          c47e0a                         LES DI,[BP + 0xa]
1040:1d48          26837d0200                     CMP word ptr ES:[DI + 0x2],0x0
1040:1d4d          7422                           JZ 0x1040:1d71
1040:1d4f          c47e0a                         LES DI,[BP + 0xa]
1040:1d52          26ff7502                       PUSH word ptr ES:[DI + 0x2]
1040:1d56          c47e06                         LES DI,[BP + 0x6]
1040:1d59          06                             PUSH ES
1040:1d5a          57                             PUSH DI
1040:1d5b          268b3d                         MOV DI,word ptr ES:[DI]
1040:1d5e          ff5d40                         CALLF [DI + 0x40]
1040:1d61          b001                           MOV AL,0x1
1040:1d63          50                             PUSH AX
1040:1d64          c47e0a                         LES DI,[BP + 0xa]
1040:1d67          06                             PUSH ES
1040:1d68          57                             PUSH DI
1040:1d69          268b3d                         MOV DI,word ptr ES:[DI]
1040:1d6c          ff5d08                         CALLF [DI + 0x8]
1040:1d6f          eb0c                           JMP 0x1040:1d7d
LAB_1040_1d71:
1040:1d71          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:1d74          8b560c                         MOV DX,word ptr [BP + 0xc]
1040:1d77          8946fa                         MOV word ptr [BP + -0x6],AX
1040:1d7a          8956fc                         MOV word ptr [BP + -0x4],DX
LAB_1040_1d7d:
1040:1d7d          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:1d80          8b56fc                         MOV DX,word ptr [BP + -0x4]
1040:1d83          89ec                           MOV SP,BP
1040:1d85          5d                             POP BP
1040:1d86          4d                             DEC BP
1040:1d87          ca0800                         RETF 0x8
FUN_1040_1d8a:
1040:1d8a          45                             INC BP
1040:1d8b          55                             PUSH BP
1040:1d8c          89e5                           MOV BP,SP
1040:1d8e          1e                             PUSH DS
1040:1d8f          83ec04                         SUB SP,0x4
1040:1d92          31c0                           XOR AX,AX
1040:1d94          8946fa                         MOV word ptr [BP + -0x6],AX
1040:1d97          8946fc                         MOV word ptr [BP + -0x4],AX
1040:1d9a          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:1d9d          0b460c                         OR AX,word ptr [BP + 0xc]
1040:1da0          7452                           JZ 0x1040:1df4
1040:1da2          ff760c                         PUSH word ptr [BP + 0xc]
1040:1da5          ff760a                         PUSH word ptr [BP + 0xa]
1040:1da8          c47e06                         LES DI,[BP + 0x6]
1040:1dab          06                             PUSH ES
1040:1dac          57                             PUSH DI
1040:1dad          268b3d                         MOV DI,word ptr ES:[DI]
1040:1db0          ff5d3c                         CALLF [DI + 0x3c]
1040:1db3          09d0                           OR AX,DX
1040:1db5          743d                           JZ 0x1040:1df4
1040:1db7          c47e0a                         LES DI,[BP + 0xa]
1040:1dba          06                             PUSH ES
1040:1dbb          57                             PUSH DI
1040:1dbc          268b3d                         MOV DI,word ptr ES:[DI]
1040:1dbf          ff5d20                         CALLF [DI + 0x20]
1040:1dc2          08c0                           OR AL,AL
1040:1dc4          7522                           JNZ 0x1040:1de8
1040:1dc6          c47e0a                         LES DI,[BP + 0xa]
1040:1dc9          26ff7502                       PUSH word ptr ES:[DI + 0x2]
1040:1dcd          c47e06                         LES DI,[BP + 0x6]
1040:1dd0          06                             PUSH ES
1040:1dd1          57                             PUSH DI
1040:1dd2          268b3d                         MOV DI,word ptr ES:[DI]
1040:1dd5          ff5d40                         CALLF [DI + 0x40]
1040:1dd8          b001                           MOV AL,0x1
1040:1dda          50                             PUSH AX
1040:1ddb          c47e0a                         LES DI,[BP + 0xa]
1040:1dde          06                             PUSH ES
1040:1ddf          57                             PUSH DI
1040:1de0          268b3d                         MOV DI,word ptr ES:[DI]
1040:1de3          ff5d08                         CALLF [DI + 0x8]
1040:1de6          eb0c                           JMP 0x1040:1df4
LAB_1040_1de8:
1040:1de8          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:1deb          8b560c                         MOV DX,word ptr [BP + 0xc]
1040:1dee          8946fa                         MOV word ptr [BP + -0x6],AX
1040:1df1          8956fc                         MOV word ptr [BP + -0x4],DX
LAB_1040_1df4:
1040:1df4          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:1df7          8b56fc                         MOV DX,word ptr [BP + -0x4]
1040:1dfa          89ec                           MOV SP,BP
1040:1dfc          5d                             POP BP
1040:1dfd          4d                             DEC BP
1040:1dfe          ca0800                         RETF 0x8
FUN_1040_1e01:
1040:1e01          45                             INC BP
1040:1e02          55                             PUSH BP
1040:1e03          89e5                           MOV BP,SP
1040:1e05          1e                             PUSH DS
1040:1e06          83ec04                         SUB SP,0x4
1040:1e09          c746fc0200                     MOV word ptr [BP + -0x4],0x2
1040:1e0e          ff760c                         PUSH word ptr [BP + 0xc]
1040:1e11          ff760a                         PUSH word ptr [BP + 0xa]
1040:1e14          c47e06                         LES DI,[BP + 0x6]
1040:1e17          06                             PUSH ES
1040:1e18          57                             PUSH DI
1040:1e19          268b3d                         MOV DI,word ptr ES:[DI]
1040:1e1c          ff5d3c                         CALLF [DI + 0x3c]
1040:1e1f          09d0                           OR AX,DX
1040:1e21          7438                           JZ 0x1040:1e5b
1040:1e23          c47e0a                         LES DI,[BP + 0xa]
1040:1e26          06                             PUSH ES
1040:1e27          57                             PUSH DI
1040:1e28          268b3d                         MOV DI,word ptr ES:[DI]
1040:1e2b          ff5d4c                         CALLF [DI + 0x4c]
1040:1e2e          8946fa                         MOV word ptr [BP + -0x6],AX
1040:1e31          837efa00                       CMP word ptr [BP + -0x6],0x0
1040:1e35          7d10                           JGE 0x1040:1e47
1040:1e37          ff76fa                         PUSH word ptr [BP + -0x6]
1040:1e3a          c47e06                         LES DI,[BP + 0x6]
1040:1e3d          06                             PUSH ES
1040:1e3e          57                             PUSH DI
1040:1e3f          268b3d                         MOV DI,word ptr ES:[DI]
1040:1e42          ff5d40                         CALLF [DI + 0x40]
1040:1e45          eb06                           JMP 0x1040:1e4d
LAB_1040_1e47:
1040:1e47          8b46fa                         MOV AX,word ptr [BP + -0x6]
1040:1e4a          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1040_1e4d:
1040:1e4d          b001                           MOV AL,0x1
1040:1e4f          50                             PUSH AX
1040:1e50          c47e0a                         LES DI,[BP + 0xa]
1040:1e53          06                             PUSH ES
1040:1e54          57                             PUSH DI
1040:1e55          268b3d                         MOV DI,word ptr ES:[DI]
1040:1e58          ff5d08                         CALLF [DI + 0x8]
LAB_1040_1e5b:
1040:1e5b          8b46fc                         MOV AX,word ptr [BP + -0x4]
1040:1e5e          89ec                           MOV SP,BP
1040:1e60          5d                             POP BP
1040:1e61          4d                             DEC BP
1040:1e62          ca0800                         RETF 0x8
FUN_1040_1e65:
1040:1e65          45                             INC BP
1040:1e66          55                             PUSH BP
1040:1e67          89e5                           MOV BP,SP
1040:1e69          1e                             PUSH DS
1040:1e6a          83ec20                         SUB SP,0x20
1040:1e6d          8d7ede                         LEA DI,[BP + -0x22]
1040:1e70          16                             PUSH SS
1040:1e71          57                             PUSH DI
1040:1e72          bf6018                         MOV DI,0x1860
1040:1e75          1e                             PUSH DS
1040:1e76          57                             PUSH DI
1040:1e77          8d7e0a                         LEA DI,[BP + 0xa]
1040:1e7a          16                             PUSH SS
1040:1e7b          57                             PUSH DI
1040:1e7c          9ae8015011                     CALLF 0x1150:01e8
1040:1e81          6a00                           PUSH 0x0
1040:1e83          8d7ede                         LEA DI,[BP + -0x22]
1040:1e86          16                             PUSH SS
1040:1e87          57                             PUSH DI
1040:1e88          bf7b18                         MOV DI,0x187b
1040:1e8b          1e                             PUSH DS
1040:1e8c          57                             PUSH DI
1040:1e8d          6a14                           PUSH 0x14
1040:1e8f          ff1e3a18                       CALLF [0x183a]
1040:1e93          3d0700                         CMP AX,0x7
1040:1e96          7508                           JNZ 0x1040:1ea0
1040:1e98          8b460a                         MOV AX,word ptr [BP + 0xa]
1040:1e9b          9a61006810                     CALLF 0x1068:0061
LAB_1040_1ea0:
1040:1ea0          89ec                           MOV SP,BP
1040:1ea2          5d                             POP BP
1040:1ea3          4d                             DEC BP
1040:1ea4          ca0600                         RETF 0x6
FUN_1040_1ea7:
1040:1ea7          45                             INC BP
1040:1ea8          55                             PUSH BP
1040:1ea9          89e5                           MOV BP,SP
1040:1eab          1e                             PUSH DS
1040:1eac          83ec02                         SUB SP,0x2
1040:1eaf          c47e06                         LES DI,[BP + 0x6]
1040:1eb2          26c47d08                       LES DI,ES:[DI + 0x8]
1040:1eb6          06                             PUSH ES
1040:1eb7          57                             PUSH DI
1040:1eb8          268b3d                         MOV DI,word ptr ES:[DI]
1040:1ebb          ff5d3c                         CALLF [DI + 0x3c]
1040:1ebe          8846fd                         MOV byte ptr [BP + -0x3],AL
1040:1ec1          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1040:1ec4          89ec                           MOV SP,BP
1040:1ec6          5d                             POP BP
1040:1ec7          4d                             DEC BP
1040:1ec8          ca0400                         RETF 0x4
FUN_1048_0002:
1048:0002          45                             INC BP
1048:0003          55                             PUSH BP
1048:0004          89e5                           MOV BP,SP
1048:0006          1e                             PUSH DS
1048:0007          31ff                           XOR DI,DI
1048:0009          9aef036810                     CALLF 0x1068:03ef
1048:000e          745e                           JZ 0x1048:006e
1048:0010          ff7612                         PUSH word ptr [BP + 0x12]
1048:0013          ff7610                         PUSH word ptr [BP + 0x10]
1048:0016          31c0                           XOR AX,AX
1048:0018          50                             PUSH AX
1048:0019          c47e06                         LES DI,[BP + 0x6]
1048:001c          06                             PUSH ES
1048:001d          57                             PUSH DI
1048:001e          9a41034010                     CALLF 0x1040:0341
1048:0023          c47e06                         LES DI,[BP + 0x6]
1048:0026          06                             PUSH ES
1048:0027          57                             PUSH DI
1048:0028          9a41064010                     CALLF 0x1040:0641
1048:002d          837e0e00                       CMP word ptr [BP + 0xe],0x0
1048:0031          7418                           JZ 0x1048:004b
1048:0033          ff760e                         PUSH word ptr [BP + 0xe]
1048:0036          ff760c                         PUSH word ptr [BP + 0xc]
1048:0039          9aa0016010                     CALLF 0x1060:01a0
1048:003e          c47e06                         LES DI,[BP + 0x6]
1048:0041          2689451d                       MOV word ptr ES:[DI + 0x1d],AX
1048:0045          2689551f                       MOV word ptr ES:[DI + 0x1f],DX
1048:0049          eb11                           JMP 0x1048:005c
LAB_1048_004b:
1048:004b          8b460c                         MOV AX,word ptr [BP + 0xc]
1048:004e          8b560e                         MOV DX,word ptr [BP + 0xe]
1048:0051          c47e06                         LES DI,[BP + 0x6]
1048:0054          2689451d                       MOV word ptr ES:[DI + 0x1d],AX
1048:0058          2689551f                       MOV word ptr ES:[DI + 0x1f],DX
LAB_1048_005c:
1048:005c          c47e06                         LES DI,[BP + 0x6]
1048:005f          31c0                           XOR AX,AX
1048:0061          26894521                       MOV word ptr ES:[DI + 0x21],AX
1048:0065          26894523                       MOV word ptr ES:[DI + 0x23],AX
1048:0069          26c6452500                     MOV byte ptr ES:[DI + 0x25],0x0
LAB_1048_006e:
1048:006e          c44606                         LES AX,[BP + 0x6]
1048:0071          8cc2                           MOV DX,ES
1048:0073          89ec                           MOV SP,BP
1048:0075          5d                             POP BP
1048:0076          4d                             DEC BP
1048:0077          ca0e00                         RETF 0xe
FUN_1048_007a:
1048:007a          45                             INC BP
1048:007b          55                             PUSH BP
1048:007c          89e5                           MOV BP,SP
1048:007e          1e                             PUSH DS
1048:007f          c47e06                         LES DI,[BP + 0x6]
1048:0082          26837d1f00                     CMP word ptr ES:[DI + 0x1f],0x0
1048:0087          740d                           JZ 0x1048:0096
1048:0089          26ff751f                       PUSH word ptr ES:[DI + 0x1f]
1048:008d          26ff751d                       PUSH word ptr ES:[DI + 0x1d]
1048:0091          9a0d026010                     CALLF 0x1060:020d
LAB_1048_0096:
1048:0096          31c0                           XOR AX,AX
1048:0098          50                             PUSH AX
1048:0099          c47e06                         LES DI,[BP + 0x6]
1048:009c          06                             PUSH ES
1048:009d          57                             PUSH DI
1048:009e          9aff034010                     CALLF 0x1040:03ff
1048:00a3          31ff                           XOR DI,DI
1048:00a5          9a39046810                     CALLF 0x1068:0439
1048:00aa          89ec                           MOV SP,BP
1048:00ac          5d                             POP BP
1048:00ad          4d                             DEC BP
1048:00ae          ca0600                         RETF 0x6
FUN_1048_00b1:
1048:00b1          45                             INC BP
1048:00b2          55                             PUSH BP
1048:00b3          89e5                           MOV BP,SP
1048:00b5          1e                             PUSH DS
1048:00b6          83ec04                         SUB SP,0x4
1048:00b9          c47e06                         LES DI,[BP + 0x6]
1048:00bc          26837d0200                     CMP word ptr ES:[DI + 0x2],0x0
1048:00c1          7572                           JNZ 0x1048:0135
1048:00c3          06                             PUSH ES
1048:00c4          57                             PUSH DI
1048:00c5          9a41064010                     CALLF 0x1040:0641
1048:00ca          c47e06                         LES DI,[BP + 0x6]
1048:00cd          06                             PUSH ES
1048:00ce          57                             PUSH DI
1048:00cf          9af3054010                     CALLF 0x1040:05f3
1048:00d4          c47e06                         LES DI,[BP + 0x6]
1048:00d7          26c6452500                     MOV byte ptr ES:[DI + 0x25],0x0
1048:00dc          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1048:00e0          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1048:00e4          7507                           JNZ 0x1048:00ed
1048:00e6          31c0                           XOR AX,AX
1048:00e8          8946fa                         MOV word ptr [BP + -0x6],AX
1048:00eb          eb0e                           JMP 0x1048:00fb
LAB_1048_00ed:
1048:00ed          c47e06                         LES DI,[BP + 0x6]
1048:00f0          26c47d06                       LES DI,ES:[DI + 0x6]
1048:00f4          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1048:00f8          8946fa                         MOV word ptr [BP + -0x6],AX
LAB_1048_00fb:
1048:00fb          ff364419                       PUSH word ptr [0x1944]
1048:00ff          c47e06                         LES DI,[BP + 0x6]
1048:0102          26ff751f                       PUSH word ptr ES:[DI + 0x1f]
1048:0106          26ff751d                       PUSH word ptr ES:[DI + 0x1d]
1048:010a          ff76fa                         PUSH word ptr [BP + -0x6]
1048:010d          26ff7514                       PUSH word ptr ES:[DI + 0x14]
1048:0111          26ff7512                       PUSH word ptr ES:[DI + 0x12]
1048:0115          26ff7523                       PUSH word ptr ES:[DI + 0x23]
1048:0119          26ff7521                       PUSH word ptr ES:[DI + 0x21]
1048:011d          ff1e2618                       CALLF [0x1826]
1048:0121          c47e06                         LES DI,[BP + 0x6]
1048:0124          26894504                       MOV word ptr ES:[DI + 0x4],AX
1048:0128          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1048:012d          7506                           JNZ 0x1048:0135
1048:012f          26c74502ffff                   MOV word ptr ES:[DI + 0x2],0xffff
LAB_1048_0135:
1048:0135          c47e06                         LES DI,[BP + 0x6]
1048:0138          26837d0200                     CMP word ptr ES:[DI + 0x2],0x0
1048:013d          b000                           MOV AL,0x0
1048:013f          7501                           JNZ 0x1048:0142
1048:0141          40                             INC AX
LAB_1048_0142:
1048:0142          8846fd                         MOV byte ptr [BP + -0x3],AL
1048:0145          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1048:0148          89ec                           MOV SP,BP
1048:014a          5d                             POP BP
1048:014b          4d                             DEC BP
1048:014c          ca0400                         RETF 0x4
FUN_1048_014f:
1048:014f          45                             INC BP
1048:0150          55                             PUSH BP
1048:0151          89e5                           MOV BP,SP
1048:0153          1e                             PUSH DS
1048:0154          83ec0a                         SUB SP,0xa
1048:0157          c47e06                         LES DI,[BP + 0x6]
1048:015a          26837d0200                     CMP word ptr ES:[DI + 0x2],0x0
1048:015f          7403                           JZ 0x1048:0164
1048:0161          e9a500                         JMP 0x1048:0209
LAB_1048_0164:
1048:0164          06                             PUSH ES
1048:0165          57                             PUSH DI
1048:0166          9a41064010                     CALLF 0x1040:0641
1048:016b          c47e06                         LES DI,[BP + 0x6]
1048:016e          06                             PUSH ES
1048:016f          57                             PUSH DI
1048:0170          9af3054010                     CALLF 0x1040:05f3
1048:0175          c47e06                         LES DI,[BP + 0x6]
1048:0178          26c6452501                     MOV byte ptr ES:[DI + 0x25],0x1
1048:017d          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1048:0181          260b4508                       OR AX,word ptr ES:[DI + 0x8]
1048:0185          7507                           JNZ 0x1048:018e
1048:0187          31c0                           XOR AX,AX
1048:0189          8946fa                         MOV word ptr [BP + -0x6],AX
1048:018c          eb0e                           JMP 0x1048:019c
LAB_1048_018e:
1048:018e          c47e06                         LES DI,[BP + 0x6]
1048:0191          26c47d06                       LES DI,ES:[DI + 0x6]
1048:0195          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1048:0199          8946fa                         MOV word ptr [BP + -0x6],AX
LAB_1048_019c:
1048:019c          c43e2218                       LES DI,[0x1822]
1048:01a0          268b450e                       MOV AX,word ptr ES:[DI + 0xe]
1048:01a4          268b5510                       MOV DX,word ptr ES:[DI + 0x10]
1048:01a8          8946f4                         MOV word ptr [BP + -0xc],AX
1048:01ab          8956f6                         MOV word ptr [BP + -0xa],DX
1048:01ae          ff364419                       PUSH word ptr [0x1944]
1048:01b2          c47e06                         LES DI,[BP + 0x6]
1048:01b5          26ff751f                       PUSH word ptr ES:[DI + 0x1f]
1048:01b9          26ff751d                       PUSH word ptr ES:[DI + 0x1d]
1048:01bd          ff76fa                         PUSH word ptr [BP + -0x6]
1048:01c0          26ff7514                       PUSH word ptr ES:[DI + 0x14]
1048:01c4          26ff7512                       PUSH word ptr ES:[DI + 0x12]
1048:01c8          26ff7523                       PUSH word ptr ES:[DI + 0x23]
1048:01cc          26ff7521                       PUSH word ptr ES:[DI + 0x21]
1048:01d0          ff1e2a18                       CALLF [0x182a]
1048:01d4          8946f8                         MOV word ptr [BP + -0x8],AX
1048:01d7          8b46f4                         MOV AX,word ptr [BP + -0xc]
1048:01da          8b56f6                         MOV DX,word ptr [BP + -0xa]
1048:01dd          c43e2218                       LES DI,[0x1822]
1048:01e1          2689450e                       MOV word ptr ES:[DI + 0xe],AX
1048:01e5          26895510                       MOV word ptr ES:[DI + 0x10],DX
1048:01e9          837ef8ff                       CMP word ptr [BP + -0x8],-0x1
1048:01ed          7509                           JNZ 0x1048:01f8
1048:01ef          c47e06                         LES DI,[BP + 0x6]
1048:01f2          26c74502ffff                   MOV word ptr ES:[DI + 0x2],0xffff
LAB_1048_01f8:
1048:01f8          c47e06                         LES DI,[BP + 0x6]
1048:01fb          31c0                           XOR AX,AX
1048:01fd          26894504                       MOV word ptr ES:[DI + 0x4],AX
1048:0201          8b46f8                         MOV AX,word ptr [BP + -0x8]
1048:0204          8946fc                         MOV word ptr [BP + -0x4],AX
1048:0207          eb0a                           JMP 0x1048:0213
LAB_1048_0209:
1048:0209          c47e06                         LES DI,[BP + 0x6]
1048:020c          268b4502                       MOV AX,word ptr ES:[DI + 0x2]
1048:0210          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1048_0213:
1048:0213          8b46fc                         MOV AX,word ptr [BP + -0x4]
1048:0216          89ec                           MOV SP,BP
1048:0218          5d                             POP BP
1048:0219          4d                             DEC BP
1048:021a          ca0400                         RETF 0x4
FUN_1048_021d:
1048:021d          45                             INC BP
1048:021e          55                             PUSH BP
1048:021f          89e5                           MOV BP,SP
1048:0221          1e                             PUSH DS
1048:0222          c47e08                         LES DI,[BP + 0x8]
1048:0225          26837d0400                     CMP word ptr ES:[DI + 0x4],0x0
1048:022a          740a                           JZ 0x1048:0236
1048:022c          c47e08                         LES DI,[BP + 0x8]
1048:022f          06                             PUSH ES
1048:0230          57                             PUSH DI
1048:0231          9a0d064010                     CALLF 0x1040:060d
LAB_1048_0236:
1048:0236          89ec                           MOV SP,BP
1048:0238          5d                             POP BP
1048:0239          4d                             DEC BP
1048:023a          ca0600                         RETF 0x6
FUN_1048_023d:
1048:023d          45                             INC BP
1048:023e          55                             PUSH BP
1048:023f          89e5                           MOV BP,SP
1048:0241          1e                             PUSH DS
1048:0242          c47e06                         LES DI,[BP + 0x6]
1048:0245          26807d2500                     CMP byte ptr ES:[DI + 0x25],0x0
1048:024a          7421                           JZ 0x1048:026d
1048:024c          bf1d02                         MOV DI,0x21d
1048:024f          b84810                         MOV AX,0x1048
1048:0252          50                             PUSH AX
1048:0253          57                             PUSH DI
1048:0254          c47e06                         LES DI,[BP + 0x6]
1048:0257          06                             PUSH ES
1048:0258          57                             PUSH DI
1048:0259          9a74084010                     CALLF 0x1040:0874
1048:025e          c47e06                         LES DI,[BP + 0x6]
1048:0261          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:0265          ff760a                         PUSH word ptr [BP + 0xa]
1048:0268          9a50015011                     CALLF 0x1150:0150
LAB_1048_026d:
1048:026d          89ec                           MOV SP,BP
1048:026f          5d                             POP BP
1048:0270          4d                             DEC BP
1048:0271          ca0600                         RETF 0x6
FUN_1048_0274:
1048:0274          45                             INC BP
1048:0275          55                             PUSH BP
1048:0276          89e5                           MOV BP,SP
1048:0278          1e                             PUSH DS
1048:0279          c47e06                         LES DI,[BP + 0x6]
1048:027c          06                             PUSH ES
1048:027d          57                             PUSH DI
1048:027e          268b3d                         MOV DI,word ptr ES:[DI]
1048:0281          ff5d38                         CALLF [DI + 0x38]
1048:0284          89ec                           MOV SP,BP
1048:0286          5d                             POP BP
1048:0287          4d                             DEC BP
1048:0288          ca0800                         RETF 0x8
FUN_1048_028b:
1048:028b          45                             INC BP
1048:028c          55                             PUSH BP
1048:028d          89e5                           MOV BP,SP
1048:028f          1e                             PUSH DS
1048:0290          c47e06                         LES DI,[BP + 0x6]
1048:0293          89f8                           MOV AX,DI
1048:0295          8cc2                           MOV DX,ES
1048:0297          c43e2218                       LES DI,[0x1822]
1048:029b          263b550a                       CMP DX,word ptr ES:[DI + 0xa]
1048:029f          7528                           JNZ 0x1048:02c9
1048:02a1          263b4508                       CMP AX,word ptr ES:[DI + 0x8]
1048:02a5          7522                           JNZ 0x1048:02c9
1048:02a7          c43e2218                       LES DI,[0x1822]
1048:02ab          06                             PUSH ES
1048:02ac          57                             PUSH DI
1048:02ad          268b3d                         MOV DI,word ptr ES:[DI]
1048:02b0          ff5d44                         CALLF [DI + 0x44]
1048:02b3          08c0                           OR AL,AL
1048:02b5          b000                           MOV AL,0x0
1048:02b7          7501                           JNZ 0x1048:02ba
1048:02b9          40                             INC AX
LAB_1048_02ba:
1048:02ba          98                             CBW
1048:02bb          99                             CWD
1048:02bc          c47e0a                         LES DI,[BP + 0xa]
1048:02bf          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1048:02c3          2689550c                       MOV word ptr ES:[DI + 0xc],DX
1048:02c7          eb1f                           JMP 0x1048:02e8
LAB_1048_02c9:
1048:02c9          c47e06                         LES DI,[BP + 0x6]
1048:02cc          06                             PUSH ES
1048:02cd          57                             PUSH DI
1048:02ce          268b3d                         MOV DI,word ptr ES:[DI]
1048:02d1          ff5d3c                         CALLF [DI + 0x3c]
1048:02d4          08c0                           OR AL,AL
1048:02d6          b000                           MOV AL,0x0
1048:02d8          7501                           JNZ 0x1048:02db
1048:02da          40                             INC AX
LAB_1048_02db:
1048:02db          98                             CBW
1048:02dc          99                             CWD
1048:02dd          c47e0a                         LES DI,[BP + 0xa]
1048:02e0          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1048:02e4          2689550c                       MOV word ptr ES:[DI + 0xc],DX
LAB_1048_02e8:
1048:02e8          89ec                           MOV SP,BP
1048:02ea          5d                             POP BP
1048:02eb          4d                             DEC BP
1048:02ec          ca0800                         RETF 0x8
FUN_1048_02ef:
1048:02ef          45                             INC BP
1048:02f0          55                             PUSH BP
1048:02f1          89e5                           MOV BP,SP
1048:02f3          1e                             PUSH DS
1048:02f4          83ec04                         SUB SP,0x4
1048:02f7          c47e0a                         LES DI,[BP + 0xa]
1048:02fa          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:02fe          9ae8005011                     CALLF 0x1150:00e8
1048:0303          c47e0a                         LES DI,[BP + 0xa]
1048:0306          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:030a          9a97004010                     CALLF 0x1040:0097
1048:030f          8946fa                         MOV word ptr [BP + -0x6],AX
1048:0312          8956fc                         MOV word ptr [BP + -0x4],DX
1048:0315          8b46fa                         MOV AX,word ptr [BP + -0x6]
1048:0318          0b46fc                         OR AX,word ptr [BP + -0x4]
1048:031b          741c                           JZ 0x1048:0339
1048:031d          c47efa                         LES DI,[BP + -0x6]
1048:0320          268b4543                       MOV AX,word ptr ES:[DI + 0x43]
1048:0324          260b4545                       OR AX,word ptr ES:[DI + 0x45]
1048:0328          740f                           JZ 0x1048:0339
1048:032a          c47efa                         LES DI,[BP + -0x6]
1048:032d          26c47d43                       LES DI,ES:[DI + 0x43]
1048:0331          06                             PUSH ES
1048:0332          57                             PUSH DI
1048:0333          268b3d                         MOV DI,word ptr ES:[DI]
1048:0336          ff5d0c                         CALLF [DI + 0xc]
LAB_1048_0339:
1048:0339          c6061c1901                     MOV byte ptr [0x191c],0x1
1048:033e          89ec                           MOV SP,BP
1048:0340          5d                             POP BP
1048:0341          4d                             DEC BP
1048:0342          ca0800                         RETF 0x8
FUN_1048_0345:
1048:0345          45                             INC BP
1048:0346          55                             PUSH BP
1048:0347          89e5                           MOV BP,SP
1048:0349          1e                             PUSH DS
1048:034a          83ec04                         SUB SP,0x4
1048:034d          c47e06                         LES DI,[BP + 0x6]
1048:0350          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:0354          ff7612                         PUSH word ptr [BP + 0x12]
1048:0357          ff7610                         PUSH word ptr [BP + 0x10]
1048:035a          ff760e                         PUSH word ptr [BP + 0xe]
1048:035d          ff760c                         PUSH word ptr [BP + 0xc]
1048:0360          ff760a                         PUSH word ptr [BP + 0xa]
1048:0363          9a64015011                     CALLF 0x1150:0164
1048:0368          8946fa                         MOV word ptr [BP + -0x6],AX
1048:036b          8956fc                         MOV word ptr [BP + -0x4],DX
1048:036e          8b46fa                         MOV AX,word ptr [BP + -0x6]
1048:0371          8b56fc                         MOV DX,word ptr [BP + -0x4]
1048:0374          89ec                           MOV SP,BP
1048:0376          5d                             POP BP
1048:0377          4d                             DEC BP
1048:0378          ca0e00                         RETF 0xe
FUN_1048_037b:
1048:037b          45                             INC BP
1048:037c          55                             PUSH BP
1048:037d          89e5                           MOV BP,SP
1048:037f          1e                             PUSH DS
1048:0380          c47e0a                         LES DI,[BP + 0xa]
1048:0383          31c0                           XOR AX,AX
1048:0385          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1048:0389          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1048:038d          89ec                           MOV SP,BP
1048:038f          5d                             POP BP
1048:0390          4d                             DEC BP
1048:0391          ca0800                         RETF 0x8
FUN_1048_0394:
1048:0394          45                             INC BP
1048:0395          55                             PUSH BP
1048:0396          89e5                           MOV BP,SP
1048:0398          1e                             PUSH DS
1048:0399          c47e06                         LES DI,[BP + 0x6]
1048:039c          26807d2500                     CMP byte ptr ES:[DI + 0x25],0x0
1048:03a1          7428                           JZ 0x1048:03cb
1048:03a3          06                             PUSH ES
1048:03a4          57                             PUSH DI
1048:03a5          268b3d                         MOV DI,word ptr ES:[DI]
1048:03a8          ff5d3c                         CALLF [DI + 0x3c]
1048:03ab          08c0                           OR AL,AL
1048:03ad          741a                           JZ 0x1048:03c9
1048:03af          6a01                           PUSH 0x1
1048:03b1          c47e06                         LES DI,[BP + 0x6]
1048:03b4          06                             PUSH ES
1048:03b5          57                             PUSH DI
1048:03b6          268b3d                         MOV DI,word ptr ES:[DI]
1048:03b9          ff5d44                         CALLF [DI + 0x44]
1048:03bc          6a01                           PUSH 0x1
1048:03be          c47e06                         LES DI,[BP + 0x6]
1048:03c1          06                             PUSH ES
1048:03c2          57                             PUSH DI
1048:03c3          268b3d                         MOV DI,word ptr ES:[DI]
1048:03c6          ff5d50                         CALLF [DI + 0x50]
LAB_1048_03c9:
1048:03c9          eb0a                           JMP 0x1048:03d5
LAB_1048_03cb:
1048:03cb          c47e06                         LES DI,[BP + 0x6]
1048:03ce          06                             PUSH ES
1048:03cf          57                             PUSH DI
1048:03d0          9a210f4010                     CALLF 0x1040:0f21
LAB_1048_03d5:
1048:03d5          89ec                           MOV SP,BP
1048:03d7          5d                             POP BP
1048:03d8          4d                             DEC BP
1048:03d9          ca0800                         RETF 0x8
FUN_1048_03dc:
1048:03dc          45                             INC BP
1048:03dd          55                             PUSH BP
1048:03de          89e5                           MOV BP,SP
1048:03e0          1e                             PUSH DS
1048:03e1          c47e06                         LES DI,[BP + 0x6]
1048:03e4          26807d2500                     CMP byte ptr ES:[DI + 0x25],0x0
1048:03e9          740c                           JZ 0x1048:03f7
1048:03eb          6a02                           PUSH 0x2
1048:03ed          06                             PUSH ES
1048:03ee          57                             PUSH DI
1048:03ef          268b3d                         MOV DI,word ptr ES:[DI]
1048:03f2          ff5d50                         CALLF [DI + 0x50]
1048:03f5          eb0a                           JMP 0x1048:0401
LAB_1048_03f7:
1048:03f7          c47e06                         LES DI,[BP + 0x6]
1048:03fa          06                             PUSH ES
1048:03fb          57                             PUSH DI
1048:03fc          9a210f4010                     CALLF 0x1040:0f21
LAB_1048_0401:
1048:0401          89ec                           MOV SP,BP
1048:0403          5d                             POP BP
1048:0404          4d                             DEC BP
1048:0405          ca0800                         RETF 0x8
FUN_1048_0408:
1048:0408          45                             INC BP
1048:0409          55                             PUSH BP
1048:040a          89e5                           MOV BP,SP
1048:040c          1e                             PUSH DS
1048:040d          c47e0a                         LES DI,[BP + 0xa]
1048:0410          06                             PUSH ES
1048:0411          57                             PUSH DI
1048:0412          c47e06                         LES DI,[BP + 0x6]
1048:0415          06                             PUSH ES
1048:0416          57                             PUSH DI
1048:0417          268b3d                         MOV DI,word ptr ES:[DI]
1048:041a          b80280                         MOV AX,0x8002
1048:041d          9a3d0d6810                     CALLF 0x1068:0d3d
1048:0422          89ec                           MOV SP,BP
1048:0424          5d                             POP BP
1048:0425          4d                             DEC BP
1048:0426          ca0800                         RETF 0x8
FUN_1048_0429:
1048:0429          45                             INC BP
1048:042a          55                             PUSH BP
1048:042b          89e5                           MOV BP,SP
1048:042d          1e                             PUSH DS
1048:042e          c47e0a                         LES DI,[BP + 0xa]
1048:0431          26c7050300                     MOV word ptr ES:[DI],0x3
1048:0436          a13618                         MOV AX,[0x1836]
1048:0439          8b163818                       MOV DX,word ptr [0x1838]
1048:043d          26894502                       MOV word ptr ES:[DI + 0x2],AX
1048:0441          26895504                       MOV word ptr ES:[DI + 0x4],DX
1048:0445          31c0                           XOR AX,AX
1048:0447          26894506                       MOV word ptr ES:[DI + 0x6],AX
1048:044b          26c745081e00                   MOV word ptr ES:[DI + 0x8],0x1e
1048:0451          26c745100600                   MOV word ptr ES:[DI + 0x10],0x6
1048:0457          31c0                           XOR AX,AX
1048:0459          26894512                       MOV word ptr ES:[DI + 0x12],AX
1048:045d          26894514                       MOV word ptr ES:[DI + 0x14],AX
1048:0461          a14419                         MOV AX,[0x1944]
1048:0464          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1048:0468          6a00                           PUSH 0x0
1048:046a          6a00                           PUSH 0x0
1048:046c          68007f                         PUSH 0x7f00
1048:046f          9ac0015011                     CALLF 0x1150:01c0
1048:0474          c47e0a                         LES DI,[BP + 0xa]
1048:0477          2689450c                       MOV word ptr ES:[DI + 0xc],AX
1048:047b          6a00                           PUSH 0x0
1048:047d          6a00                           PUSH 0x0
1048:047f          68007f                         PUSH 0x7f00
1048:0482          9abc015011                     CALLF 0x1150:01bc
1048:0487          c47e0a                         LES DI,[BP + 0xa]
1048:048a          2689450e                       MOV word ptr ES:[DI + 0xe],AX
1048:048e          c47e06                         LES DI,[BP + 0x6]
1048:0491          06                             PUSH ES
1048:0492          57                             PUSH DI
1048:0493          268b3d                         MOV DI,word ptr ES:[DI]
1048:0496          ff5d2c                         CALLF [DI + 0x2c]
1048:0499          c47e0a                         LES DI,[BP + 0xa]
1048:049c          26894516                       MOV word ptr ES:[DI + 0x16],AX
1048:04a0          26895518                       MOV word ptr ES:[DI + 0x18],DX
1048:04a4          89ec                           MOV SP,BP
1048:04a6          5d                             POP BP
1048:04a7          4d                             DEC BP
1048:04a8          ca0800                         RETF 0x8
FUN_1048_04ab:
1048:04ab          45                             INC BP
1048:04ac          55                             PUSH BP
1048:04ad          89e5                           MOV BP,SP
1048:04af          1e                             PUSH DS
1048:04b0          83ec02                         SUB SP,0x2
1048:04b3          c646fd00                       MOV byte ptr [BP + -0x3],0x0
1048:04b7          c47e06                         LES DI,[BP + 0x6]
1048:04ba          06                             PUSH ES
1048:04bb          57                             PUSH DI
1048:04bc          268b3d                         MOV DI,word ptr ES:[DI]
1048:04bf          ff5d1c                         CALLF [DI + 0x1c]
1048:04c2          08c0                           OR AL,AL
1048:04c4          740d                           JZ 0x1048:04d3
1048:04c6          c47e06                         LES DI,[BP + 0x6]
1048:04c9          06                             PUSH ES
1048:04ca          57                             PUSH DI
1048:04cb          9ab1004810                     CALLF 0x1048:00b1
1048:04d0          8846fd                         MOV byte ptr [BP + -0x3],AL
LAB_1048_04d3:
1048:04d3          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1048:04d6          89ec                           MOV SP,BP
1048:04d8          5d                             POP BP
1048:04d9          4d                             DEC BP
1048:04da          ca0400                         RETF 0x4
FUN_1048_04dd:
1048:04dd          45                             INC BP
1048:04de          55                             PUSH BP
1048:04df          89e5                           MOV BP,SP
1048:04e1          1e                             PUSH DS
1048:04e2          31ff                           XOR DI,DI
1048:04e4          9aef036810                     CALLF 0x1068:03ef
1048:04e9          7420                           JZ 0x1048:050b
1048:04eb          ff7610                         PUSH word ptr [BP + 0x10]
1048:04ee          ff760e                         PUSH word ptr [BP + 0xe]
1048:04f1          ff760c                         PUSH word ptr [BP + 0xc]
1048:04f4          31c0                           XOR AX,AX
1048:04f6          50                             PUSH AX
1048:04f7          c47e06                         LES DI,[BP + 0x6]
1048:04fa          06                             PUSH ES
1048:04fb          57                             PUSH DI
1048:04fc          9a48114010                     CALLF 0x1040:1148
1048:0501          c47e06                         LES DI,[BP + 0x6]
1048:0504          06                             PUSH ES
1048:0505          57                             PUSH DI
1048:0506          9a27064010                     CALLF 0x1040:0627
LAB_1048_050b:
1048:050b          c44606                         LES AX,[BP + 0x6]
1048:050e          8cc2                           MOV DX,ES
1048:0510          89ec                           MOV SP,BP
1048:0512          5d                             POP BP
1048:0513          4d                             DEC BP
1048:0514          ca0c00                         RETF 0xc
FUN_1048_0517:
1048:0517          45                             INC BP
1048:0518          55                             PUSH BP
1048:0519          89e5                           MOV BP,SP
1048:051b          1e                             PUSH DS
1048:051c          83ec02                         SUB SP,0x2
1048:051f          c646fd01                       MOV byte ptr [BP + -0x3],0x1
1048:0523          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1048:0526          89ec                           MOV SP,BP
1048:0528          5d                             POP BP
1048:0529          4d                             DEC BP
1048:052a          ca0400                         RETF 0x4
FUN_1048_052d:
1048:052d          45                             INC BP
1048:052e          55                             PUSH BP
1048:052f          89e5                           MOV BP,SP
1048:0531          1e                             PUSH DS
1048:0532          c47e0a                         LES DI,[BP + 0xa]
1048:0535          06                             PUSH ES
1048:0536          57                             PUSH DI
1048:0537          c47e06                         LES DI,[BP + 0x6]
1048:053a          06                             PUSH ES
1048:053b          57                             PUSH DI
1048:053c          268b3d                         MOV DI,word ptr ES:[DI]
1048:053f          ff5d0c                         CALLF [DI + 0xc]
1048:0542          89ec                           MOV SP,BP
1048:0544          5d                             POP BP
1048:0545          4d                             DEC BP
1048:0546          ca0800                         RETF 0x8
FUN_1048_0549:
1048:0549          45                             INC BP
1048:054a          55                             PUSH BP
1048:054b          89e5                           MOV BP,SP
1048:054d          1e                             PUSH DS
1048:054e          83ec04                         SUB SP,0x4
1048:0551          b81e19                         MOV AX,0x191e
1048:0554          8cda                           MOV DX,DS
1048:0556          8946fa                         MOV word ptr [BP + -0x6],AX
1048:0559          8956fc                         MOV word ptr [BP + -0x4],DX
1048:055c          8b46fa                         MOV AX,word ptr [BP + -0x6]
1048:055f          8b56fc                         MOV DX,word ptr [BP + -0x4]
1048:0562          89ec                           MOV SP,BP
1048:0564          5d                             POP BP
1048:0565          4d                             DEC BP
1048:0566          ca0400                         RETF 0x4
FUN_1048_0569:
1048:0569          45                             INC BP
1048:056a          55                             PUSH BP
1048:056b          89e5                           MOV BP,SP
1048:056d          1e                             PUSH DS
1048:056e          ff760a                         PUSH word ptr [BP + 0xa]
1048:0571          ff7608                         PUSH word ptr [BP + 0x8]
1048:0574          8b7e06                         MOV DI,word ptr [BP + 0x6]
1048:0577          36c47d06                       LES DI,SS:[DI + 0x6]
1048:057b          06                             PUSH ES
1048:057c          57                             PUSH DI
1048:057d          9a95074810                     CALLF 0x1048:0795
1048:0582          89ec                           MOV SP,BP
1048:0584          5d                             POP BP
1048:0585          4d                             DEC BP
1048:0586          ca0600                         RETF 0x6
FUN_1048_0589:
1048:0589          45                             INC BP
1048:058a          55                             PUSH BP
1048:058b          89e5                           MOV BP,SP
1048:058d          1e                             PUSH DS
1048:058e          83ec12                         SUB SP,0x12
1048:0591          c47e06                         LES DI,[BP + 0x6]
1048:0594          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:0598          6af0                           PUSH -0x10
1048:059a          9a98015011                     CALLF 0x1150:0198
1048:059f          8946f6                         MOV word ptr [BP + -0xa],AX
1048:05a2          8956f8                         MOV word ptr [BP + -0x8],DX
1048:05a5          837e0a01                       CMP word ptr [BP + 0xa],0x1
1048:05a9          7403                           JZ 0x1048:05ae
1048:05ab          e9ab00                         JMP 0x1048:0659
LAB_1048_05ae:
1048:05ae          8b46f6                         MOV AX,word ptr [BP + -0xa]
1048:05b1          8b56f8                         MOV DX,word ptr [BP + -0x8]
1048:05b4          250800                         AND AX,0x8
1048:05b7          81e20000                       AND DX,0x0
1048:05bb          83fa00                         CMP DX,0x0
1048:05be          7505                           JNZ 0x1048:05c5
1048:05c0          3d0800                         CMP AX,0x8
1048:05c3          7427                           JZ 0x1048:05ec
LAB_1048_05c5:
1048:05c5          c47e0c                         LES DI,[BP + 0xc]
1048:05c8          897ef2                         MOV word ptr [BP + -0xe],DI
1048:05cb          8c46f4                         MOV word ptr [BP + -0xc],ES
1048:05ce          c47e06                         LES DI,[BP + 0x6]
1048:05d1          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:05d5          680904                         PUSH 0x409
1048:05d8          6a00                           PUSH 0x0
1048:05da          6a00                           PUSH 0x0
1048:05dc          6a00                           PUSH 0x0
1048:05de          9a7c015011                     CALLF 0x1150:017c
1048:05e3          c47ef2                         LES DI,[BP + -0xe]
1048:05e6          26894504                       MOV word ptr ES:[DI + 0x4],AX
1048:05ea          eb6a                           JMP 0x1048:0656
LAB_1048_05ec:
1048:05ec          c47e0c                         LES DI,[BP + 0xc]
1048:05ef          897ef2                         MOV word ptr [BP + -0xe],DI
1048:05f2          8c46f4                         MOV word ptr [BP + -0xc],ES
1048:05f5          26ff7506                       PUSH word ptr ES:[DI + 0x6]
1048:05f9          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:05fd          9a3c084810                     CALLF 0x1048:083c
1048:0602          c47e06                         LES DI,[BP + 0x6]
1048:0605          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:0609          681104                         PUSH 0x411
1048:060c          6a00                           PUSH 0x0
1048:060e          6a00                           PUSH 0x0
1048:0610          6a00                           PUSH 0x0
1048:0612          9a7c015011                     CALLF 0x1150:017c
1048:0617          8946fa                         MOV word ptr [BP + -0x6],AX
1048:061a          ff76fa                         PUSH word ptr [BP + -0x6]
1048:061d          9aea074810                     CALLF 0x1048:07ea
1048:0622          c47ef2                         LES DI,[BP + -0xe]
1048:0625          26894504                       MOV word ptr ES:[DI + 0x4],AX
1048:0629          26895506                       MOV word ptr ES:[DI + 0x6],DX
1048:062d          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1048:0631          260b4506                       OR AX,word ptr ES:[DI + 0x6]
1048:0635          741f                           JZ 0x1048:0656
1048:0637          c47e06                         LES DI,[BP + 0x6]
1048:063a          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:063e          681204                         PUSH 0x412
1048:0641          ff76fa                         PUSH word ptr [BP + -0x6]
1048:0644          c47ef2                         LES DI,[BP + -0xe]
1048:0647          26c47d04                       LES DI,ES:[DI + 0x4]
1048:064b          81c70200                       ADD DI,0x2
1048:064f          06                             PUSH ES
1048:0650          57                             PUSH DI
1048:0651          9a7c015011                     CALLF 0x1150:017c
LAB_1048_0656:
1048:0656          e90f01                         JMP 0x1048:0768
LAB_1048_0659:
1048:0659          837e0a02                       CMP word ptr [BP + 0xa],0x2
1048:065d          7403                           JZ 0x1048:0662
1048:065f          e90601                         JMP 0x1048:0768
LAB_1048_0662:
1048:0662          8b46f6                         MOV AX,word ptr [BP + -0xa]
1048:0665          8b56f8                         MOV DX,word ptr [BP + -0x8]
1048:0668          250800                         AND AX,0x8
1048:066b          81e20000                       AND DX,0x0
1048:066f          83fa00                         CMP DX,0x0
1048:0672          7505                           JNZ 0x1048:0679
1048:0674          3d0800                         CMP AX,0x8
1048:0677          7450                           JZ 0x1048:06c9
LAB_1048_0679:
1048:0679          c47e0c                         LES DI,[BP + 0xc]
1048:067c          897ef2                         MOV word ptr [BP + -0xe],DI
1048:067f          8c46f4                         MOV word ptr [BP + -0xc],ES
1048:0682          c47e06                         LES DI,[BP + 0x6]
1048:0685          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:0689          680504                         PUSH 0x405
1048:068c          6a00                           PUSH 0x0
1048:068e          6a00                           PUSH 0x0
1048:0690          6a00                           PUSH 0x0
1048:0692          9a7c015011                     CALLF 0x1150:017c
1048:0697          bf6905                         MOV DI,0x569
1048:069a          b84810                         MOV AX,0x1048
1048:069d          50                             PUSH AX
1048:069e          57                             PUSH DI
1048:069f          c47ef2                         LES DI,[BP + -0xe]
1048:06a2          26c43d                         LES DI,ES:[DI]
1048:06a5          06                             PUSH ES
1048:06a6          57                             PUSH DI
1048:06a7          9a5f025010                     CALLF 0x1050:025f
1048:06ac          c47e06                         LES DI,[BP + 0x6]
1048:06af          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:06b3          680704                         PUSH 0x407
1048:06b6          c47ef2                         LES DI,[BP + -0xe]
1048:06b9          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:06bd          6a00                           PUSH 0x0
1048:06bf          6a00                           PUSH 0x0
1048:06c1          9a7c015011                     CALLF 0x1150:017c
1048:06c6          e99f00                         JMP 0x1048:0768
LAB_1048_06c9:
1048:06c9          c47e0c                         LES DI,[BP + 0xc]
1048:06cc          897ef2                         MOV word ptr [BP + -0xe],DI
1048:06cf          8c46f4                         MOV word ptr [BP + -0xc],ES
1048:06d2          c47e06                         LES DI,[BP + 0x6]
1048:06d5          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:06d9          680504                         PUSH 0x405
1048:06dc          6a00                           PUSH 0x0
1048:06de          6a00                           PUSH 0x0
1048:06e0          6a00                           PUSH 0x0
1048:06e2          9a7c015011                     CALLF 0x1150:017c
1048:06e7          bf6905                         MOV DI,0x569
1048:06ea          b84810                         MOV AX,0x1048
1048:06ed          50                             PUSH AX
1048:06ee          57                             PUSH DI
1048:06ef          c47ef2                         LES DI,[BP + -0xe]
1048:06f2          26c43d                         LES DI,ES:[DI]
1048:06f5          06                             PUSH ES
1048:06f6          57                             PUSH DI
1048:06f7          9a5f025010                     CALLF 0x1050:025f
1048:06fc          c47e06                         LES DI,[BP + 0x6]
1048:06ff          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:0703          680604                         PUSH 0x406
1048:0706          6a00                           PUSH 0x0
1048:0708          6aff                           PUSH -0x1
1048:070a          6aff                           PUSH -0x1
1048:070c          9a7c015011                     CALLF 0x1150:017c
1048:0711          c47ef2                         LES DI,[BP + -0xe]
1048:0714          268b4504                       MOV AX,word ptr ES:[DI + 0x4]
1048:0718          260b4506                       OR AX,word ptr ES:[DI + 0x6]
1048:071c          744a                           JZ 0x1048:0768
1048:071e          26c47d04                       LES DI,ES:[DI + 0x4]
1048:0722          897eee                         MOV word ptr [BP + -0x12],DI
1048:0725          8c46f0                         MOV word ptr [BP + -0x10],ES
1048:0728          268b05                         MOV AX,word ptr ES:[DI]
1048:072b          48                             DEC AX
1048:072c          8946ec                         MOV word ptr [BP + -0x14],AX
1048:072f          31c0                           XOR AX,AX
1048:0731          3b46ec                         CMP AX,word ptr [BP + -0x14]
1048:0734          7f32                           JG 0x1048:0768
1048:0736          8946fa                         MOV word ptr [BP + -0x6],AX
1048:0739          eb03                           JMP 0x1048:073e
LAB_1048_073b:
1048:073b          ff46fa                         INC word ptr [BP + -0x6]
LAB_1048_073e:
1048:073e          c47e06                         LES DI,[BP + 0x6]
1048:0741          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:0745          680604                         PUSH 0x406
1048:0748          6a01                           PUSH 0x1
1048:074a          8b46fa                         MOV AX,word ptr [BP + -0x6]
1048:074d          d1e0                           SHL AX,0x1
1048:074f          c47eee                         LES DI,[BP + -0x12]
1048:0752          03f8                           ADD DI,AX
1048:0754          268b4502                       MOV AX,word ptr ES:[DI + 0x2]
1048:0758          99                             CWD
1048:0759          52                             PUSH DX
1048:075a          50                             PUSH AX
1048:075b          9a7c015011                     CALLF 0x1150:017c
1048:0760          8b46fa                         MOV AX,word ptr [BP + -0x6]
1048:0763          3b46ec                         CMP AX,word ptr [BP + -0x14]
1048:0766          75d3                           JNZ 0x1048:073b
LAB_1048_0768:
1048:0768          8b46f6                         MOV AX,word ptr [BP + -0xa]
1048:076b          8b56f8                         MOV DX,word ptr [BP + -0x8]
1048:076e          250800                         AND AX,0x8
1048:0771          81e20000                       AND DX,0x0
1048:0775          83fa00                         CMP DX,0x0
1048:0778          7505                           JNZ 0x1048:077f
1048:077a          3d0800                         CMP AX,0x8
1048:077d          7407                           JZ 0x1048:0786
LAB_1048_077f:
1048:077f          c746fc0600                     MOV word ptr [BP + -0x4],0x6
1048:0784          eb05                           JMP 0x1048:078b
LAB_1048_0786:
1048:0786          c746fc0800                     MOV word ptr [BP + -0x4],0x8
LAB_1048_078b:
1048:078b          8b46fc                         MOV AX,word ptr [BP + -0x4]
1048:078e          89ec                           MOV SP,BP
1048:0790          5d                             POP BP
1048:0791          4d                             DEC BP
1048:0792          ca0a00                         RETF 0xa
FUN_1048_0795:
1048:0795          45                             INC BP
1048:0796          55                             PUSH BP
1048:0797          89e5                           MOV BP,SP
1048:0799          1e                             PUSH DS
1048:079a          83ec02                         SUB SP,0x2
1048:079d          c47e06                         LES DI,[BP + 0x6]
1048:07a0          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1048:07a4          6a00                           PUSH 0x0
1048:07a6          06                             PUSH ES
1048:07a7          57                             PUSH DI
1048:07a8          268b3d                         MOV DI,word ptr ES:[DI]
1048:07ab          ff5d50                         CALLF [DI + 0x50]
1048:07ae          50                             PUSH AX
1048:07af          6a00                           PUSH 0x0
1048:07b1          ff760c                         PUSH word ptr [BP + 0xc]
1048:07b4          ff760a                         PUSH word ptr [BP + 0xa]
1048:07b7          9a7c015011                     CALLF 0x1150:017c
1048:07bc          8946fc                         MOV word ptr [BP + -0x4],AX
1048:07bf          8b46fc                         MOV AX,word ptr [BP + -0x4]
1048:07c2          89ec                           MOV SP,BP
1048:07c4          5d                             POP BP
1048:07c5          4d                             DEC BP
1048:07c6          ca0800                         RETF 0x8
FUN_1048_07c9:
1048:07c9          45                             INC BP
1048:07ca          55                             PUSH BP
1048:07cb          89e5                           MOV BP,SP
1048:07cd          1e                             PUSH DS
1048:07ce          83ec02                         SUB SP,0x2
1048:07d1          8a460a                         MOV AL,byte ptr [BP + 0xa]
1048:07d4          98                             CBW
1048:07d5          8bf8                           MOV DI,AX
1048:07d7          d1e7                           SHL DI,0x1
1048:07d9          8b852619                       MOV AX,word ptr [DI + 0x1926]
1048:07dd          8946fc                         MOV word ptr [BP + -0x4],AX
1048:07e0          8b46fc                         MOV AX,word ptr [BP + -0x4]
1048:07e3          89ec                           MOV SP,BP
1048:07e5          5d                             POP BP
1048:07e6          4d                             DEC BP
1048:07e7          ca0600                         RETF 0x6
FUN_1048_07ea:
1048:07ea          45                             INC BP
1048:07eb          55                             PUSH BP
1048:07ec          89e5                           MOV BP,SP
1048:07ee          1e                             PUSH DS
1048:07ef          83ec08                         SUB SP,0x8
1048:07f2          31c0                           XOR AX,AX
1048:07f4          8946fa                         MOV word ptr [BP + -0x6],AX
1048:07f7          8946fc                         MOV word ptr [BP + -0x4],AX
1048:07fa          837e0600                       CMP word ptr [BP + 0x6],0x0
1048:07fe          742f                           JZ 0x1048:082f
1048:0800          8b4606                         MOV AX,word ptr [BP + 0x6]
1048:0803          40                             INC AX
1048:0804          d1e0                           SHL AX,0x1
1048:0806          50                             PUSH AX
1048:0807          9a44005810                     CALLF 0x1058:0044
1048:080c          8946f6                         MOV word ptr [BP + -0xa],AX
1048:080f          8956f8                         MOV word ptr [BP + -0x8],DX
1048:0812          8b46f6                         MOV AX,word ptr [BP + -0xa]
1048:0815          0b46f8                         OR AX,word ptr [BP + -0x8]
1048:0818          7415                           JZ 0x1048:082f
1048:081a          8b4606                         MOV AX,word ptr [BP + 0x6]
1048:081d          c47ef6                         LES DI,[BP + -0xa]
1048:0820          268905                         MOV word ptr ES:[DI],AX
1048:0823          8b46f6                         MOV AX,word ptr [BP + -0xa]
1048:0826          8b56f8                         MOV DX,word ptr [BP + -0x8]
1048:0829          8946fa                         MOV word ptr [BP + -0x6],AX
1048:082c          8956fc                         MOV word ptr [BP + -0x4],DX
LAB_1048_082f:
1048:082f          8b46fa                         MOV AX,word ptr [BP + -0x6]
1048:0832          8b56fc                         MOV DX,word ptr [BP + -0x4]
1048:0835          89ec                           MOV SP,BP
1048:0837          5d                             POP BP
1048:0838          4d                             DEC BP
1048:0839          ca0200                         RETF 0x2
FUN_1048_083c:
1048:083c          45                             INC BP
1048:083d          55                             PUSH BP
1048:083e          89e5                           MOV BP,SP
1048:0840          1e                             PUSH DS
1048:0841          8b4606                         MOV AX,word ptr [BP + 0x6]
1048:0844          0b4608                         OR AX,word ptr [BP + 0x8]
1048:0847          7415                           JZ 0x1048:085e
1048:0849          ff7608                         PUSH word ptr [BP + 0x8]
1048:084c          ff7606                         PUSH word ptr [BP + 0x6]
1048:084f          c47e06                         LES DI,[BP + 0x6]
1048:0852          268b05                         MOV AX,word ptr ES:[DI]
1048:0855          40                             INC AX
1048:0856          d1e0                           SHL AX,0x1
1048:0858          50                             PUSH AX
1048:0859          9a47016810                     CALLF 0x1068:0147
LAB_1048_085e:
1048:085e          89ec                           MOV SP,BP
1048:0860          5d                             POP BP
1048:0861          4d                             DEC BP
1048:0862          ca0400                         RETF 0x4
FUN_1050_0002:
1050:0002          45                             INC BP
1050:0003          55                             PUSH BP
1050:0004          89e5                           MOV BP,SP
1050:0006          1e                             PUSH DS
1050:0007          31ff                           XOR DI,DI
1050:0009          9aef036810                     CALLF 0x1068:03ef
1050:000e          7400                           JZ 0x1050:0010
LAB_1050_0010:
1050:0010          c44606                         LES AX,[BP + 0x6]
1050:0013          8cc2                           MOV DX,ES
1050:0015          89ec                           MOV SP,BP
1050:0017          5d                             POP BP
1050:0018          4d                             DEC BP
1050:0019          ca0600                         RETF 0x6
FUN_1050_001c:
1050:001c          45                             INC BP
1050:001d          55                             PUSH BP
1050:001e          89e5                           MOV BP,SP
1050:0020          1e                             PUSH DS
1050:0021          b001                           MOV AL,0x1
1050:0023          50                             PUSH AX
1050:0024          c47e06                         LES DI,[BP + 0x6]
1050:0027          06                             PUSH ES
1050:0028          57                             PUSH DI
1050:0029          268b3d                         MOV DI,word ptr ES:[DI]
1050:002c          ff5d08                         CALLF [DI + 0x8]
1050:002f          89ec                           MOV SP,BP
1050:0031          5d                             POP BP
1050:0032          4d                             DEC BP
1050:0033          ca0400                         RETF 0x4
FUN_1050_0036:
1050:0036          45                             INC BP
1050:0037          55                             PUSH BP
1050:0038          89e5                           MOV BP,SP
1050:003a          1e                             PUSH DS
1050:003b          31ff                           XOR DI,DI
1050:003d          9a39046810                     CALLF 0x1068:0439
1050:0042          89ec                           MOV SP,BP
1050:0044          5d                             POP BP
1050:0045          4d                             DEC BP
1050:0046          ca0600                         RETF 0x6
FUN_1050_0049:
1050:0049          45                             INC BP
1050:004a          55                             PUSH BP
1050:004b          89e5                           MOV BP,SP
1050:004d          1e                             PUSH DS
1050:004e          83ec0a                         SUB SP,0xa
1050:0051          8d7ef8                         LEA DI,[BP + -0x8]
1050:0054          16                             PUSH SS
1050:0055          57                             PUSH DI
1050:0056          6a02                           PUSH 0x2
1050:0058          c47e06                         LES DI,[BP + 0x6]
1050:005b          06                             PUSH ES
1050:005c          57                             PUSH DI
1050:005d          268b3d                         MOV DI,word ptr ES:[DI]
1050:0060          ff5d1c                         CALLF [DI + 0x1c]
1050:0063          837ef800                       CMP word ptr [BP + -0x8],0x0
1050:0067          750a                           JNZ 0x1050:0073
1050:0069          31c0                           XOR AX,AX
1050:006b          8946fa                         MOV word ptr [BP + -0x6],AX
1050:006e          8946fc                         MOV word ptr [BP + -0x4],AX
1050:0071          eb3b                           JMP 0x1050:00ae
LAB_1050_0073:
1050:0073          8b46f8                         MOV AX,word ptr [BP + -0x8]
1050:0076          40                             INC AX
1050:0077          50                             PUSH AX
1050:0078          9a2d016810                     CALLF 0x1068:012d
1050:007d          8946f4                         MOV word ptr [BP + -0xc],AX
1050:0080          8956f6                         MOV word ptr [BP + -0xa],DX
1050:0083          c47ef4                         LES DI,[BP + -0xc]
1050:0086          06                             PUSH ES
1050:0087          57                             PUSH DI
1050:0088          ff76f8                         PUSH word ptr [BP + -0x8]
1050:008b          c47e06                         LES DI,[BP + 0x6]
1050:008e          06                             PUSH ES
1050:008f          57                             PUSH DI
1050:0090          268b3d                         MOV DI,word ptr ES:[DI]
1050:0093          ff5d1c                         CALLF [DI + 0x1c]
1050:0096          8b46f8                         MOV AX,word ptr [BP + -0x8]
1050:0099          c47ef4                         LES DI,[BP + -0xc]
1050:009c          03f8                           ADD DI,AX
1050:009e          26c60500                       MOV byte ptr ES:[DI],0x0
1050:00a2          8b46f4                         MOV AX,word ptr [BP + -0xc]
1050:00a5          8b56f6                         MOV DX,word ptr [BP + -0xa]
1050:00a8          8946fa                         MOV word ptr [BP + -0x6],AX
1050:00ab          8956fc                         MOV word ptr [BP + -0x4],DX
LAB_1050_00ae:
1050:00ae          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:00b1          8b56fc                         MOV DX,word ptr [BP + -0x4]
1050:00b4          89ec                           MOV SP,BP
1050:00b6          5d                             POP BP
1050:00b7          4d                             DEC BP
1050:00b8          ca0400                         RETF 0x4
FUN_1050_00bb:
1050:00bb          45                             INC BP
1050:00bc          55                             PUSH BP
1050:00bd          89e5                           MOV BP,SP
1050:00bf          1e                             PUSH DS
1050:00c0          83ec02                         SUB SP,0x2
1050:00c3          8b460a                         MOV AX,word ptr [BP + 0xa]
1050:00c6          0b460c                         OR AX,word ptr [BP + 0xc]
1050:00c9          7507                           JNZ 0x1050:00d2
1050:00cb          31c0                           XOR AX,AX
1050:00cd          8946fc                         MOV word ptr [BP + -0x4],AX
1050:00d0          eb0e                           JMP 0x1050:00e0
LAB_1050_00d2:
1050:00d2          ff760c                         PUSH word ptr [BP + 0xc]
1050:00d5          ff760a                         PUSH word ptr [BP + 0xa]
1050:00d8          9a02006010                     CALLF 0x1060:0002
1050:00dd          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1050_00e0:
1050:00e0          8d7efc                         LEA DI,[BP + -0x4]
1050:00e3          16                             PUSH SS
1050:00e4          57                             PUSH DI
1050:00e5          6a02                           PUSH 0x2
1050:00e7          c47e06                         LES DI,[BP + 0x6]
1050:00ea          06                             PUSH ES
1050:00eb          57                             PUSH DI
1050:00ec          268b3d                         MOV DI,word ptr ES:[DI]
1050:00ef          ff5d28                         CALLF [DI + 0x28]
1050:00f2          8b460a                         MOV AX,word ptr [BP + 0xa]
1050:00f5          0b460c                         OR AX,word ptr [BP + 0xc]
1050:00f8          7413                           JZ 0x1050:010d
1050:00fa          c47e0a                         LES DI,[BP + 0xa]
1050:00fd          06                             PUSH ES
1050:00fe          57                             PUSH DI
1050:00ff          ff76fc                         PUSH word ptr [BP + -0x4]
1050:0102          c47e06                         LES DI,[BP + 0x6]
1050:0105          06                             PUSH ES
1050:0106          57                             PUSH DI
1050:0107          268b3d                         MOV DI,word ptr ES:[DI]
1050:010a          ff5d28                         CALLF [DI + 0x28]
LAB_1050_010d:
1050:010d          89ec                           MOV SP,BP
1050:010f          5d                             POP BP
1050:0110          4d                             DEC BP
1050:0111          ca0800                         RETF 0x8
FUN_1050_0114:
1050:0114          50                             PUSH AX
1050:0115          53                             PUSH BX
1050:0116          06                             PUSH ES
1050:0117          57                             PUSH DI
1050:0118          268b3d                         MOV DI,word ptr ES:[DI]
1050:011b          ff5d0c                         CALLF [DI + 0xc]
1050:011e          c3                             RET
FUN_1050_011f:
1050:011f          45                             INC BP
1050:0120          55                             PUSH BP
1050:0121          89e5                           MOV BP,SP
1050:0123          1e                             PUSH DS
1050:0124          31ff                           XOR DI,DI
1050:0126          9aef036810                     CALLF 0x1068:03ef
1050:012b          7438                           JZ 0x1050:0165
1050:012d          31c0                           XOR AX,AX
1050:012f          50                             PUSH AX
1050:0130          c47e06                         LES DI,[BP + 0x6]
1050:0133          06                             PUSH ES
1050:0134          57                             PUSH DI
1050:0135          9a02005010                     CALLF 0x1050:0002
1050:013a          c47e06                         LES DI,[BP + 0x6]
1050:013d          31c0                           XOR AX,AX
1050:013f          26894502                       MOV word ptr ES:[DI + 0x2],AX
1050:0143          26894504                       MOV word ptr ES:[DI + 0x4],AX
1050:0147          31c0                           XOR AX,AX
1050:0149          26894506                       MOV word ptr ES:[DI + 0x6],AX
1050:014d          31c0                           XOR AX,AX
1050:014f          26894508                       MOV word ptr ES:[DI + 0x8],AX
1050:0153          8b460c                         MOV AX,word ptr [BP + 0xc]
1050:0156          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1050:015a          ff760e                         PUSH word ptr [BP + 0xe]
1050:015d          06                             PUSH ES
1050:015e          57                             PUSH DI
1050:015f          268b3d                         MOV DI,word ptr ES:[DI]
1050:0162          ff5d24                         CALLF [DI + 0x24]
LAB_1050_0165:
1050:0165          c44606                         LES AX,[BP + 0x6]
1050:0168          8cc2                           MOV DX,ES
1050:016a          89ec                           MOV SP,BP
1050:016c          5d                             POP BP
1050:016d          4d                             DEC BP
1050:016e          ca0a00                         RETF 0xa
FUN_1050_0171:
1050:0171          45                             INC BP
1050:0172          55                             PUSH BP
1050:0173          89e5                           MOV BP,SP
1050:0175          1e                             PUSH DS
1050:0176          c47e06                         LES DI,[BP + 0x6]
1050:0179          06                             PUSH ES
1050:017a          57                             PUSH DI
1050:017b          9a93025010                     CALLF 0x1050:0293
1050:0180          6a00                           PUSH 0x0
1050:0182          c47e06                         LES DI,[BP + 0x6]
1050:0185          06                             PUSH ES
1050:0186          57                             PUSH DI
1050:0187          268b3d                         MOV DI,word ptr ES:[DI]
1050:018a          ff5d24                         CALLF [DI + 0x24]
1050:018d          31ff                           XOR DI,DI
1050:018f          9a39046810                     CALLF 0x1068:0439
1050:0194          89ec                           MOV SP,BP
1050:0196          5d                             POP BP
1050:0197          4d                             DEC BP
1050:0198          ca0600                         RETF 0x6
FUN_1050_019b:
1050:019b          45                             INC BP
1050:019c          55                             PUSH BP
1050:019d          89e5                           MOV BP,SP
1050:019f          1e                             PUSH DS
1050:01a0          c47e06                         LES DI,[BP + 0x6]
1050:01a3          8b5e0a                         MOV BX,word ptr [BP + 0xa]
1050:01a6          09db                           OR BX,BX
1050:01a8          7c17                           JL 0x1050:01c1
1050:01aa          263b5d06                       CMP BX,word ptr ES:[DI + 0x6]
1050:01ae          7d11                           JGE 0x1050:01c1
1050:01b0          26c47d02                       LES DI,ES:[DI + 0x2]
1050:01b4          d1e3                           SHL BX,0x1
1050:01b6          d1e3                           SHL BX,0x1
1050:01b8          268b01                         MOV AX,word ptr ES:[BX + DI]
1050:01bb          268b5102                       MOV DX,word ptr ES:[BX + DI + 0x2]
1050:01bf          eb0a                           JMP 0x1050:01cb
LAB_1050_01c1:
1050:01c1          b8ffff                         MOV AX,0xffff
1050:01c4          e84dff                         CALL 0x1050:0114
1050:01c7          31c0                           XOR AX,AX
1050:01c9          89c2                           MOV DX,AX
LAB_1050_01cb:
1050:01cb          89ec                           MOV SP,BP
1050:01cd          5d                             POP BP
1050:01ce          4d                             DEC BP
1050:01cf          ca0600                         RETF 0x6
FUN_1050_01d2:
1050:01d2          45                             INC BP
1050:01d3          55                             PUSH BP
1050:01d4          89e5                           MOV BP,SP
1050:01d6          1e                             PUSH DS
1050:01d7          c47e06                         LES DI,[BP + 0x6]
1050:01da          8b5e0e                         MOV BX,word ptr [BP + 0xe]
1050:01dd          09db                           OR BX,BX
1050:01df          7c53                           JL 0x1050:0234
1050:01e1          268b4d06                       MOV CX,word ptr ES:[DI + 0x6]
1050:01e5          39cb                           CMP BX,CX
1050:01e7          7f4b                           JG 0x1050:0234
1050:01e9          263b4d08                       CMP CX,word ptr ES:[DI + 0x8]
1050:01ed          751a                           JNZ 0x1050:0209
1050:01ef          51                             PUSH CX
1050:01f0          53                             PUSH BX
1050:01f1          26034d0a                       ADD CX,word ptr ES:[DI + 0xa]
1050:01f5          51                             PUSH CX
1050:01f6          06                             PUSH ES
1050:01f7          57                             PUSH DI
1050:01f8          268b3d                         MOV DI,word ptr ES:[DI]
1050:01fb          ff5d24                         CALLF [DI + 0x24]
1050:01fe          5b                             POP BX
1050:01ff          59                             POP CX
1050:0200          c47e06                         LES DI,[BP + 0x6]
1050:0203          263b4d08                       CMP CX,word ptr ES:[DI + 0x8]
1050:0207          7430                           JZ 0x1050:0239
LAB_1050_0209:
1050:0209          26ff4506                       INC word ptr ES:[DI + 0x6]
1050:020d          fd                             STD
1050:020e          26c47d02                       LES DI,ES:[DI + 0x2]
1050:0212          d1e1                           SHL CX,0x1
1050:0214          01cf                           ADD DI,CX
1050:0216          01cf                           ADD DI,CX
1050:0218          47                             INC DI
1050:0219          47                             INC DI
1050:021a          d1e3                           SHL BX,0x1
1050:021c          29d9                           SUB CX,BX
1050:021e          7409                           JZ 0x1050:0229
1050:0220          8d75fc                         LEA SI,[DI + -0x4]
1050:0223          1e                             PUSH DS
1050:0224          06                             PUSH ES
1050:0225          1f                             POP DS
1050:0226          f3a5                           MOVSW.REP ES:DI,SI
1050:0228          1f                             POP DS
LAB_1050_0229:
1050:0229          8b460c                         MOV AX,word ptr [BP + 0xc]
1050:022c          ab                             STOSW ES:DI
1050:022d          8b460a                         MOV AX,word ptr [BP + 0xa]
1050:0230          ab                             STOSW ES:DI
1050:0231          fc                             CLD
1050:0232          eb0d                           JMP 0x1050:0241
LAB_1050_0234:
1050:0234          b8ffff                         MOV AX,0xffff
1050:0237          eb05                           JMP 0x1050:023e
LAB_1050_0239:
1050:0239          b8feff                         MOV AX,0xfffe
1050:023c          89cb                           MOV BX,CX
LAB_1050_023e:
1050:023e          e8d3fe                         CALL 0x1050:0114
LAB_1050_0241:
1050:0241          89ec                           MOV SP,BP
1050:0243          5d                             POP BP
1050:0244          4d                             DEC BP
1050:0245          ca0a00                         RETF 0xa
FUN_1050_0248:
1050:0248          45                             INC BP
1050:0249          55                             PUSH BP
1050:024a          89e5                           MOV BP,SP
1050:024c          1e                             PUSH DS
1050:024d          b8d400                         MOV AX,0xd4
1050:0250          2b460c                         SUB AX,word ptr [BP + 0xc]
1050:0253          9a5d006810                     CALLF 0x1068:005d
1050:0258          89ec                           MOV SP,BP
1050:025a          5d                             POP BP
1050:025b          4d                             DEC BP
1050:025c          ca0800                         RETF 0x8
FUN_1050_025f:
1050:025f          45                             INC BP
1050:0260          55                             PUSH BP
1050:0261          89e5                           MOV BP,SP
1050:0263          1e                             PUSH DS
1050:0264          c47e06                         LES DI,[BP + 0x6]
1050:0267          268b4d06                       MOV CX,word ptr ES:[DI + 0x6]
1050:026b          e31f                           JCXZ 0x1050:028c
1050:026d          26c47d02                       LES DI,ES:[DI + 0x2]
LAB_1050_0271:
1050:0271          06                             PUSH ES
1050:0272          57                             PUSH DI
1050:0273          51                             PUSH CX
1050:0274          26ff7502                       PUSH word ptr ES:[DI + 0x2]
1050:0278          26ff35                         PUSH word ptr ES:[DI]
1050:027b          8b4600                         MOV AX,word ptr [BP + 0x0]
1050:027e          24fe                           AND AL,0xfe
1050:0280          50                             PUSH AX
1050:0281          ff5e0a                         CALLF [BP + 0xa]
1050:0284          59                             POP CX
1050:0285          5f                             POP DI
1050:0286          07                             POP ES
1050:0287          83c704                         ADD DI,0x4
1050:028a          e2e5                           LOOP 0x1050:0271
LAB_1050_028c:
1050:028c          89ec                           MOV SP,BP
1050:028e          5d                             POP BP
1050:028f          4d                             DEC BP
1050:0290          ca0800                         RETF 0x8
FUN_1050_0293:
1050:0293          45                             INC BP
1050:0294          55                             PUSH BP
1050:0295          89e5                           MOV BP,SP
1050:0297          1e                             PUSH DS
1050:0298          83ec04                         SUB SP,0x4
1050:029b          c47e06                         LES DI,[BP + 0x6]
1050:029e          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1050:02a2          48                             DEC AX
1050:02a3          8946fa                         MOV word ptr [BP + -0x6],AX
1050:02a6          31c0                           XOR AX,AX
1050:02a8          3b46fa                         CMP AX,word ptr [BP + -0x6]
1050:02ab          7f2a                           JG 0x1050:02d7
1050:02ad          8946fc                         MOV word ptr [BP + -0x4],AX
1050:02b0          eb03                           JMP 0x1050:02b5
LAB_1050_02b2:
1050:02b2          ff46fc                         INC word ptr [BP + -0x4]
LAB_1050_02b5:
1050:02b5          ff76fc                         PUSH word ptr [BP + -0x4]
1050:02b8          c47e06                         LES DI,[BP + 0x6]
1050:02bb          06                             PUSH ES
1050:02bc          57                             PUSH DI
1050:02bd          9a9b015010                     CALLF 0x1050:019b
1050:02c2          52                             PUSH DX
1050:02c3          50                             PUSH AX
1050:02c4          c47e06                         LES DI,[BP + 0x6]
1050:02c7          06                             PUSH ES
1050:02c8          57                             PUSH DI
1050:02c9          268b3d                         MOV DI,word ptr ES:[DI]
1050:02cc          ff5d10                         CALLF [DI + 0x10]
1050:02cf          8b46fc                         MOV AX,word ptr [BP + -0x4]
1050:02d2          3b46fa                         CMP AX,word ptr [BP + -0x6]
1050:02d5          75db                           JNZ 0x1050:02b2
LAB_1050_02d7:
1050:02d7          c47e06                         LES DI,[BP + 0x6]
1050:02da          31c0                           XOR AX,AX
1050:02dc          26894506                       MOV word ptr ES:[DI + 0x6],AX
1050:02e0          89ec                           MOV SP,BP
1050:02e2          5d                             POP BP
1050:02e3          4d                             DEC BP
1050:02e4          ca0400                         RETF 0x4
FUN_1050_02e7:
1050:02e7          45                             INC BP
1050:02e8          55                             PUSH BP
1050:02e9          89e5                           MOV BP,SP
1050:02eb          1e                             PUSH DS
1050:02ec          83ec04                         SUB SP,0x4
1050:02ef          8b460a                         MOV AX,word ptr [BP + 0xa]
1050:02f2          c47e06                         LES DI,[BP + 0x6]
1050:02f5          263b4506                       CMP AX,word ptr ES:[DI + 0x6]
1050:02f9          7d07                           JGE 0x1050:0302
1050:02fb          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1050:02ff          89460a                         MOV word ptr [BP + 0xa],AX
LAB_1050_0302:
1050:0302          817e0afc3f                     CMP word ptr [BP + 0xa],0x3ffc
1050:0307          7e05                           JLE 0x1050:030e
1050:0309          c7460afc3f                     MOV word ptr [BP + 0xa],0x3ffc
LAB_1050_030e:
1050:030e          8b460a                         MOV AX,word ptr [BP + 0xa]
1050:0311          c47e06                         LES DI,[BP + 0x6]
1050:0314          263b4508                       CMP AX,word ptr ES:[DI + 0x8]
1050:0318          7503                           JNZ 0x1050:031d
1050:031a          e98800                         JMP 0x1050:03a5
LAB_1050_031d:
1050:031d          837e0a00                       CMP word ptr [BP + 0xa],0x0
1050:0321          750a                           JNZ 0x1050:032d
1050:0323          31c0                           XOR AX,AX
1050:0325          8946fa                         MOV word ptr [BP + -0x6],AX
1050:0328          8946fc                         MOV word ptr [BP + -0x4],AX
1050:032b          eb41                           JMP 0x1050:036e
LAB_1050_032d:
1050:032d          8b460a                         MOV AX,word ptr [BP + 0xa]
1050:0330          c1e002                         SHL AX,0x2
1050:0333          50                             PUSH AX
1050:0334          9a2d016810                     CALLF 0x1068:012d
1050:0339          8946fa                         MOV word ptr [BP + -0x6],AX
1050:033c          8956fc                         MOV word ptr [BP + -0x4],DX
1050:033f          c47e06                         LES DI,[BP + 0x6]
1050:0342          26837d0600                     CMP word ptr ES:[DI + 0x6],0x0
1050:0347          7425                           JZ 0x1050:036e
1050:0349          268b4502                       MOV AX,word ptr ES:[DI + 0x2]
1050:034d          260b4504                       OR AX,word ptr ES:[DI + 0x4]
1050:0351          741b                           JZ 0x1050:036e
1050:0353          26c47d02                       LES DI,ES:[DI + 0x2]
1050:0357          06                             PUSH ES
1050:0358          57                             PUSH DI
1050:0359          c47efa                         LES DI,[BP + -0x6]
1050:035c          06                             PUSH ES
1050:035d          57                             PUSH DI
1050:035e          c47e06                         LES DI,[BP + 0x6]
1050:0361          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1050:0365          c1e002                         SHL AX,0x2
1050:0368          50                             PUSH AX
1050:0369          9aee0c6810                     CALLF 0x1068:0cee
LAB_1050_036e:
1050:036e          c47e06                         LES DI,[BP + 0x6]
1050:0371          26837d0800                     CMP word ptr ES:[DI + 0x8],0x0
1050:0376          7415                           JZ 0x1050:038d
1050:0378          26ff7504                       PUSH word ptr ES:[DI + 0x4]
1050:037c          26ff7502                       PUSH word ptr ES:[DI + 0x2]
1050:0380          268b4508                       MOV AX,word ptr ES:[DI + 0x8]
1050:0384          c1e002                         SHL AX,0x2
1050:0387          50                             PUSH AX
1050:0388          9a47016810                     CALLF 0x1068:0147
LAB_1050_038d:
1050:038d          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:0390          8b56fc                         MOV DX,word ptr [BP + -0x4]
1050:0393          c47e06                         LES DI,[BP + 0x6]
1050:0396          26894502                       MOV word ptr ES:[DI + 0x2],AX
1050:039a          26895504                       MOV word ptr ES:[DI + 0x4],DX
1050:039e          8b460a                         MOV AX,word ptr [BP + 0xa]
1050:03a1          26894508                       MOV word ptr ES:[DI + 0x8],AX
LAB_1050_03a5:
1050:03a5          89ec                           MOV SP,BP
1050:03a7          5d                             POP BP
1050:03a8          4d                             DEC BP
1050:03a9          ca0600                         RETF 0x6
FUN_1050_03ac:
1050:03ac          45                             INC BP
1050:03ad          55                             PUSH BP
1050:03ae          89e5                           MOV BP,SP
1050:03b0          1e                             PUSH DS
1050:03b1          31ff                           XOR DI,DI
1050:03b3          9aef036810                     CALLF 0x1068:03ef
1050:03b8          741b                           JZ 0x1050:03d5
1050:03ba          ff760e                         PUSH word ptr [BP + 0xe]
1050:03bd          ff760c                         PUSH word ptr [BP + 0xc]
1050:03c0          31c0                           XOR AX,AX
1050:03c2          50                             PUSH AX
1050:03c3          c47e06                         LES DI,[BP + 0x6]
1050:03c6          06                             PUSH ES
1050:03c7          57                             PUSH DI
1050:03c8          9a1f015010                     CALLF 0x1050:011f
1050:03cd          c47e06                         LES DI,[BP + 0x6]
1050:03d0          26c6450c00                     MOV byte ptr ES:[DI + 0xc],0x0
LAB_1050_03d5:
1050:03d5          c44606                         LES AX,[BP + 0x6]
1050:03d8          8cc2                           MOV DX,ES
1050:03da          89ec                           MOV SP,BP
1050:03dc          5d                             POP BP
1050:03dd          4d                             DEC BP
1050:03de          ca0a00                         RETF 0xa
FUN_1050_03e1:
1050:03e1          45                             INC BP
1050:03e2          55                             PUSH BP
1050:03e3          89e5                           MOV BP,SP
1050:03e5          1e                             PUSH DS
1050:03e6          83ec04                         SUB SP,0x4
1050:03e9          c746fcffff                     MOV word ptr [BP + -0x4],0xffff
1050:03ee          ff760c                         PUSH word ptr [BP + 0xc]
1050:03f1          ff760a                         PUSH word ptr [BP + 0xa]
1050:03f4          c47e06                         LES DI,[BP + 0x6]
1050:03f7          06                             PUSH ES
1050:03f8          57                             PUSH DI
1050:03f9          268b3d                         MOV DI,word ptr ES:[DI]
1050:03fc          ff5d2c                         CALLF [DI + 0x2c]
1050:03ff          52                             PUSH DX
1050:0400          50                             PUSH AX
1050:0401          8d7efa                         LEA DI,[BP + -0x6]
1050:0404          16                             PUSH SS
1050:0405          57                             PUSH DI
1050:0406          c47e06                         LES DI,[BP + 0x6]
1050:0409          06                             PUSH ES
1050:040a          57                             PUSH DI
1050:040b          268b3d                         MOV DI,word ptr ES:[DI]
1050:040e          ff5d30                         CALLF [DI + 0x30]
1050:0411          08c0                           OR AL,AL
1050:0413          744a                           JZ 0x1050:045f
1050:0415          c47e06                         LES DI,[BP + 0x6]
1050:0418          26807d0c00                     CMP byte ptr ES:[DI + 0xc],0x0
1050:041d          742e                           JZ 0x1050:044d
LAB_1050_041f:
1050:041f          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:0422          c47e06                         LES DI,[BP + 0x6]
1050:0425          263b4506                       CMP AX,word ptr ES:[DI + 0x6]
1050:0429          7d22                           JGE 0x1050:044d
1050:042b          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:042e          c1e002                         SHL AX,0x2
1050:0431          26c47d02                       LES DI,ES:[DI + 0x2]
1050:0435          03f8                           ADD DI,AX
1050:0437          268b05                         MOV AX,word ptr ES:[DI]
1050:043a          268b5502                       MOV DX,word ptr ES:[DI + 0x2]
1050:043e          3b560c                         CMP DX,word ptr [BP + 0xc]
1050:0441          7505                           JNZ 0x1050:0448
1050:0443          3b460a                         CMP AX,word ptr [BP + 0xa]
1050:0446          7405                           JZ 0x1050:044d
LAB_1050_0448:
1050:0448          ff46fa                         INC word ptr [BP + -0x6]
1050:044b          ebd2                           JMP 0x1050:041f
LAB_1050_044d:
1050:044d          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:0450          c47e06                         LES DI,[BP + 0x6]
1050:0453          263b4506                       CMP AX,word ptr ES:[DI + 0x6]
1050:0457          7d06                           JGE 0x1050:045f
1050:0459          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:045c          8946fc                         MOV word ptr [BP + -0x4],AX
LAB_1050_045f:
1050:045f          8b46fc                         MOV AX,word ptr [BP + -0x4]
1050:0462          89ec                           MOV SP,BP
1050:0464          5d                             POP BP
1050:0465          4d                             DEC BP
1050:0466          ca0800                         RETF 0x8
FUN_1050_0469:
1050:0469          45                             INC BP
1050:046a          55                             PUSH BP
1050:046b          89e5                           MOV BP,SP
1050:046d          1e                             PUSH DS
1050:046e          83ec02                         SUB SP,0x2
1050:0471          ff760c                         PUSH word ptr [BP + 0xc]
1050:0474          ff760a                         PUSH word ptr [BP + 0xa]
1050:0477          c47e06                         LES DI,[BP + 0x6]
1050:047a          06                             PUSH ES
1050:047b          57                             PUSH DI
1050:047c          268b3d                         MOV DI,word ptr ES:[DI]
1050:047f          ff5d2c                         CALLF [DI + 0x2c]
1050:0482          52                             PUSH DX
1050:0483          50                             PUSH AX
1050:0484          8d7efc                         LEA DI,[BP + -0x4]
1050:0487          16                             PUSH SS
1050:0488          57                             PUSH DI
1050:0489          c47e06                         LES DI,[BP + 0x6]
1050:048c          06                             PUSH ES
1050:048d          57                             PUSH DI
1050:048e          268b3d                         MOV DI,word ptr ES:[DI]
1050:0491          ff5d30                         CALLF [DI + 0x30]
1050:0494          08c0                           OR AL,AL
1050:0496          740a                           JZ 0x1050:04a2
1050:0498          c47e06                         LES DI,[BP + 0x6]
1050:049b          26807d0c00                     CMP byte ptr ES:[DI + 0xc],0x0
1050:04a0          7413                           JZ 0x1050:04b5
LAB_1050_04a2:
1050:04a2          ff76fc                         PUSH word ptr [BP + -0x4]
1050:04a5          ff760c                         PUSH word ptr [BP + 0xc]
1050:04a8          ff760a                         PUSH word ptr [BP + 0xa]
1050:04ab          c47e06                         LES DI,[BP + 0x6]
1050:04ae          06                             PUSH ES
1050:04af          57                             PUSH DI
1050:04b0          9ad2015010                     CALLF 0x1050:01d2
LAB_1050_04b5:
1050:04b5          89ec                           MOV SP,BP
1050:04b7          5d                             POP BP
1050:04b8          4d                             DEC BP
1050:04b9          ca0800                         RETF 0x8
FUN_1050_04bc:
1050:04bc          45                             INC BP
1050:04bd          55                             PUSH BP
1050:04be          89e5                           MOV BP,SP
1050:04c0          1e                             PUSH DS
1050:04c1          83ec04                         SUB SP,0x4
1050:04c4          8b460a                         MOV AX,word ptr [BP + 0xa]
1050:04c7          8b560c                         MOV DX,word ptr [BP + 0xc]
1050:04ca          8946fa                         MOV word ptr [BP + -0x6],AX
1050:04cd          8956fc                         MOV word ptr [BP + -0x4],DX
1050:04d0          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:04d3          8b56fc                         MOV DX,word ptr [BP + -0x4]
1050:04d6          89ec                           MOV SP,BP
1050:04d8          5d                             POP BP
1050:04d9          4d                             DEC BP
1050:04da          ca0800                         RETF 0x8
FUN_1050_04dd:
1050:04dd          45                             INC BP
1050:04de          55                             PUSH BP
1050:04df          89e5                           MOV BP,SP
1050:04e1          1e                             PUSH DS
1050:04e2          83ec0a                         SUB SP,0xa
1050:04e5          c646fd00                       MOV byte ptr [BP + -0x3],0x0
1050:04e9          31c0                           XOR AX,AX
1050:04eb          8946fa                         MOV word ptr [BP + -0x6],AX
1050:04ee          c47e06                         LES DI,[BP + 0x6]
1050:04f1          268b4506                       MOV AX,word ptr ES:[DI + 0x6]
1050:04f5          48                             DEC AX
1050:04f6          8946f8                         MOV word ptr [BP + -0x8],AX
LAB_1050_04f9:
1050:04f9          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:04fc          3b46f8                         CMP AX,word ptr [BP + -0x8]
1050:04ff          7f74                           JG 0x1050:0575
1050:0501          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:0504          0346f8                         ADD AX,word ptr [BP + -0x8]
1050:0507          d1e8                           SHR AX,0x1
1050:0509          8946f6                         MOV word ptr [BP + -0xa],AX
1050:050c          8b46f6                         MOV AX,word ptr [BP + -0xa]
1050:050f          c1e002                         SHL AX,0x2
1050:0512          c47e06                         LES DI,[BP + 0x6]
1050:0515          26c47d02                       LES DI,ES:[DI + 0x2]
1050:0519          03f8                           ADD DI,AX
1050:051b          26ff7502                       PUSH word ptr ES:[DI + 0x2]
1050:051f          26ff35                         PUSH word ptr ES:[DI]
1050:0522          c47e06                         LES DI,[BP + 0x6]
1050:0525          06                             PUSH ES
1050:0526          57                             PUSH DI
1050:0527          268b3d                         MOV DI,word ptr ES:[DI]
1050:052a          ff5d2c                         CALLF [DI + 0x2c]
1050:052d          52                             PUSH DX
1050:052e          50                             PUSH AX
1050:052f          ff7610                         PUSH word ptr [BP + 0x10]
1050:0532          ff760e                         PUSH word ptr [BP + 0xe]
1050:0535          c47e06                         LES DI,[BP + 0x6]
1050:0538          06                             PUSH ES
1050:0539          57                             PUSH DI
1050:053a          268b3d                         MOV DI,word ptr ES:[DI]
1050:053d          ff5d28                         CALLF [DI + 0x28]
1050:0540          8946f4                         MOV word ptr [BP + -0xc],AX
1050:0543          837ef400                       CMP word ptr [BP + -0xc],0x0
1050:0547          7d09                           JGE 0x1050:0552
1050:0549          8b46f6                         MOV AX,word ptr [BP + -0xa]
1050:054c          40                             INC AX
1050:054d          8946fa                         MOV word ptr [BP + -0x6],AX
1050:0550          eb21                           JMP 0x1050:0573
LAB_1050_0552:
1050:0552          8b46f6                         MOV AX,word ptr [BP + -0xa]
1050:0555          48                             DEC AX
1050:0556          8946f8                         MOV word ptr [BP + -0x8],AX
1050:0559          837ef400                       CMP word ptr [BP + -0xc],0x0
1050:055d          7514                           JNZ 0x1050:0573
1050:055f          c646fd01                       MOV byte ptr [BP + -0x3],0x1
1050:0563          c47e06                         LES DI,[BP + 0x6]
1050:0566          26807d0c00                     CMP byte ptr ES:[DI + 0xc],0x0
1050:056b          7506                           JNZ 0x1050:0573
1050:056d          8b46f6                         MOV AX,word ptr [BP + -0xa]
1050:0570          8946fa                         MOV word ptr [BP + -0x6],AX
LAB_1050_0573:
1050:0573          eb84                           JMP 0x1050:04f9
LAB_1050_0575:
1050:0575          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:0578          c47e0a                         LES DI,[BP + 0xa]
1050:057b          268905                         MOV word ptr ES:[DI],AX
1050:057e          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1050:0581          89ec                           MOV SP,BP
1050:0583          5d                             POP BP
1050:0584          4d                             DEC BP
1050:0585          ca0c00                         RETF 0xc
FUN_1050_0588:
1050:0588          45                             INC BP
1050:0589          55                             PUSH BP
1050:058a          89e5                           MOV BP,SP
1050:058c          1e                             PUSH DS
1050:058d          83ec02                         SUB SP,0x2
1050:0590          ff7610                         PUSH word ptr [BP + 0x10]
1050:0593          ff760e                         PUSH word ptr [BP + 0xe]
1050:0596          ff760c                         PUSH word ptr [BP + 0xc]
1050:0599          ff760a                         PUSH word ptr [BP + 0xa]
1050:059c          9ae0006010                     CALLF 0x1060:00e0
1050:05a1          8946fc                         MOV word ptr [BP + -0x4],AX
1050:05a4          8b46fc                         MOV AX,word ptr [BP + -0x4]
1050:05a7          89ec                           MOV SP,BP
1050:05a9          5d                             POP BP
1050:05aa          4d                             DEC BP
1050:05ab          ca0c00                         RETF 0xc
FUN_1050_05ae:
1050:05ae          45                             INC BP
1050:05af          55                             PUSH BP
1050:05b0          89e5                           MOV BP,SP
1050:05b2          1e                             PUSH DS
1050:05b3          ff760c                         PUSH word ptr [BP + 0xc]
1050:05b6          ff760a                         PUSH word ptr [BP + 0xa]
1050:05b9          9a0d026010                     CALLF 0x1060:020d
1050:05be          89ec                           MOV SP,BP
1050:05c0          5d                             POP BP
1050:05c1          4d                             DEC BP
1050:05c2          ca0800                         RETF 0x8
FUN_1050_05c5:
1050:05c5          45                             INC BP
1050:05c6          55                             PUSH BP
1050:05c7          89e5                           MOV BP,SP
1050:05c9          1e                             PUSH DS
1050:05ca          83ec04                         SUB SP,0x4
1050:05cd          c47e0a                         LES DI,[BP + 0xa]
1050:05d0          06                             PUSH ES
1050:05d1          57                             PUSH DI
1050:05d2          9a49005010                     CALLF 0x1050:0049
1050:05d7          8946fa                         MOV word ptr [BP + -0x6],AX
1050:05da          8956fc                         MOV word ptr [BP + -0x4],DX
1050:05dd          8b46fa                         MOV AX,word ptr [BP + -0x6]
1050:05e0          8b56fc                         MOV DX,word ptr [BP + -0x4]
1050:05e3          89ec                           MOV SP,BP
1050:05e5          5d                             POP BP
1050:05e6          4d                             DEC BP
1050:05e7          ca0800                         RETF 0x8
FUN_1050_05ea:
1050:05ea          45                             INC BP
1050:05eb          55                             PUSH BP
1050:05ec          89e5                           MOV BP,SP
1050:05ee          1e                             PUSH DS
1050:05ef          ff760c                         PUSH word ptr [BP + 0xc]
1050:05f2          ff760a                         PUSH word ptr [BP + 0xa]
1050:05f5          c47e0e                         LES DI,[BP + 0xe]
1050:05f8          06                             PUSH ES
1050:05f9          57                             PUSH DI
1050:05fa          9abb005010                     CALLF 0x1050:00bb
1050:05ff          89ec                           MOV SP,BP
1050:0601          5d                             POP BP
1050:0602          4d                             DEC BP
1050:0603          ca0c00                         RETF 0xc
FUN_1058_0002:
1058:0002          45                             INC BP
1058:0003          55                             PUSH BP
1058:0004          89e5                           MOV BP,SP
1058:0006          1e                             PUSH DS
1058:0007          83ec02                         SUB SP,0x2
1058:000a          a13c19                         MOV AX,[0x193c]
1058:000d          0b063e19                       OR AX,word ptr [0x193e]
1058:0011          b000                           MOV AL,0x0
1058:0013          7501                           JNZ 0x1058:0016
1058:0015          40                             INC AX
LAB_1058_0016:
1058:0016          8846fd                         MOV byte ptr [BP + -0x3],AL
1058:0019          8a46fd                         MOV AL,byte ptr [BP + -0x3]
1058:001c          89ec                           MOV SP,BP
1058:001e          5d                             POP BP
1058:001f          4d                             DEC BP
1058:0020          cb                             RETF
FUN_1058_0021:
1058:0021          45                             INC BP
1058:0022          55                             PUSH BP
1058:0023          89e5                           MOV BP,SP
1058:0025          1e                             PUSH DS
1058:0026          9a02005810                     CALLF 0x1058:0002
1058:002b          08c0                           OR AL,AL
1058:002d          7410                           JZ 0x1058:003f
1058:002f          ff363a19                       PUSH word ptr [0x193a]
1058:0033          9a2d016810                     CALLF 0x1068:012d
1058:0038          a33c19                         MOV [0x193c],AX
1058:003b          89163e19                       MOV word ptr [0x193e],DX
LAB_1058_003f:
1058:003f          89ec                           MOV SP,BP
1058:0041          5d                             POP BP
1058:0042          4d                             DEC BP
1058:0043          cb                             RETF
FUN_1058_0044:
1058:0044          45                             INC BP
1058:0045          55                             PUSH BP
1058:0046          89e5                           MOV BP,SP
1058:0048          1e                             PUSH DS
1058:0049          83ec08                         SUB SP,0x8
1058:004c          c606401901                     MOV byte ptr [0x1940],0x1
1058:0051          ff7606                         PUSH word ptr [BP + 0x6]
1058:0054          9a2d016810                     CALLF 0x1068:012d
1058:0059          8946f6                         MOV word ptr [BP + -0xa],AX
1058:005c          8956f8                         MOV word ptr [BP + -0x8],DX
1058:005f          8b46f6                         MOV AX,word ptr [BP + -0xa]
1058:0062          8b56f8                         MOV DX,word ptr [BP + -0x8]
1058:0065          8946fa                         MOV word ptr [BP + -0x6],AX
1058:0068          8956fc                         MOV word ptr [BP + -0x4],DX
1058:006b          c606401900                     MOV byte ptr [0x1940],0x0
1058:0070          8b46fa                         MOV AX,word ptr [BP + -0x6]
1058:0073          8b56fc                         MOV DX,word ptr [BP + -0x4]
1058:0076          89ec                           MOV SP,BP
1058:0078          5d                             POP BP
1058:0079          4d                             DEC BP
1058:007a          ca0200                         RETF 0x2
FUN_1058_007d:
1058:007d          45                             INC BP
1058:007e          55                             PUSH BP
1058:007f          89e5                           MOV BP,SP
1058:0081          1e                             PUSH DS
1058:0082          83ec02                         SUB SP,0x2
1058:0085          837e0600                       CMP word ptr [BP + 0x6],0x0
1058:0089          743c                           JZ 0x1058:00c7
1058:008b          803e401900                     CMP byte ptr [0x1940],0x0
1058:0090          7407                           JZ 0x1058:0099
1058:0092          c746fc0100                     MOV word ptr [BP + -0x4],0x1
1058:0097          eb2e                           JMP 0x1058:00c7
LAB_1058_0099:
1058:0099          9a02005810                     CALLF 0x1058:0002
1058:009e          08c0                           OR AL,AL
1058:00a0          7407                           JZ 0x1058:00a9
1058:00a2          31c0                           XOR AX,AX
1058:00a4          8946fc                         MOV word ptr [BP + -0x4],AX
1058:00a7          eb1e                           JMP 0x1058:00c7
LAB_1058_00a9:
1058:00a9          ff363e19                       PUSH word ptr [0x193e]
1058:00ad          ff363c19                       PUSH word ptr [0x193c]
1058:00b1          ff363a19                       PUSH word ptr [0x193a]
1058:00b5          9a47016810                     CALLF 0x1068:0147
1058:00ba          31c0                           XOR AX,AX
1058:00bc          a33c19                         MOV [0x193c],AX
1058:00bf          a33e19                         MOV [0x193e],AX
1058:00c2          c746fc0200                     MOV word ptr [BP + -0x4],0x2
LAB_1058_00c7:
1058:00c7          8b46fc                         MOV AX,word ptr [BP + -0x4]
1058:00ca          89ec                           MOV SP,BP
1058:00cc          5d                             POP BP
1058:00cd          4d                             DEC BP
1058:00ce          ca0200                         RETF 0x2
FUN_1058_00d1:
1058:00d1          45                             INC BP
1058:00d2          55                             PUSH BP
1058:00d3          89e5                           MOV BP,SP
1058:00d5          1e                             PUSH DS
1058:00d6          9a21005810                     CALLF 0x1058:0021
1058:00db          b87d00                         MOV AX,0x7d
1058:00de          ba5810                         MOV DX,0x1058
1058:00e1          a35419                         MOV [0x1954],AX
1058:00e4          89165619                       MOV word ptr [0x1956],DX
1058:00e8          89ec                           MOV SP,BP
1058:00ea          5d                             POP BP
1058:00eb          4d                             DEC BP
1058:00ec          cb                             RETF
FUN_1060_0002:
1060:0002          55                             PUSH BP
1060:0003          89e5                           MOV BP,SP
1060:0005          fc                             CLD
1060:0006          c47e06                         LES DI,[BP + 0x6]
1060:0009          b9ffff                         MOV CX,0xffff
1060:000c          30c0                           XOR AL,AL
1060:000e          f2ae                           SCASB.REPNE ES:DI
1060:0010          b8feff                         MOV AX,0xfffe
1060:0013          29c8                           SUB AX,CX
1060:0015          5d                             POP BP
1060:0016          ca0400                         RETF 0x4
FUN_1060_0019:
1060:0019          55                             PUSH BP
1060:001a          89e5                           MOV BP,SP
1060:001c          fc                             CLD
1060:001d          c47e06                         LES DI,[BP + 0x6]
1060:0020          b9ffff                         MOV CX,0xffff
1060:0023          30c0                           XOR AL,AL
1060:0025          f2ae                           SCASB.REPNE ES:DI
1060:0027          89f8                           MOV AX,DI
1060:0029          8cc2                           MOV DX,ES
1060:002b          48                             DEC AX
1060:002c          5d                             POP BP
1060:002d          ca0400                         RETF 0x4
FUN_1060_0030:
1060:0030          55                             PUSH BP
1060:0031          89e5                           MOV BP,SP
1060:0033          1e                             PUSH DS
1060:0034          fc                             CLD
1060:0035          c57608                         LDS SI,[BP + 0x8]
1060:0038          c47e0c                         LES DI,[BP + 0xc]
1060:003b          89f8                           MOV AX,DI
1060:003d          8cc2                           MOV DX,ES
1060:003f          8b4e06                         MOV CX,word ptr [BP + 0x6]
1060:0042          39fe                           CMP SI,DI
1060:0044          7307                           JNC 0x1060:004d
1060:0046          fd                             STD
1060:0047          01ce                           ADD SI,CX
1060:0049          01cf                           ADD DI,CX
1060:004b          4e                             DEC SI
1060:004c          4f                             DEC DI
LAB_1060_004d:
1060:004d          f3a4                           MOVSB.REP ES:DI,SI
1060:004f          fc                             CLD
1060:0050          1f                             POP DS
1060:0051          5d                             POP BP
1060:0052          ca0a00                         RETF 0xa
FUN_1060_0055:
1060:0055          55                             PUSH BP
1060:0056          89e5                           MOV BP,SP
1060:0058          1e                             PUSH DS
1060:0059          fc                             CLD
1060:005a          c47e06                         LES DI,[BP + 0x6]
1060:005d          b9ffff                         MOV CX,0xffff
1060:0060          30c0                           XOR AL,AL
1060:0062          f2ae                           SCASB.REPNE ES:DI
1060:0064          f7d1                           NOT CX
1060:0066          c57606                         LDS SI,[BP + 0x6]
1060:0069          c47e0a                         LES DI,[BP + 0xa]
1060:006c          89f8                           MOV AX,DI
1060:006e          8cc2                           MOV DX,ES
1060:0070          f3a4                           MOVSB.REP ES:DI,SI
1060:0072          1f                             POP DS
1060:0073          5d                             POP BP
1060:0074          ca0800                         RETF 0x8
FUN_1060_0077:
1060:0077          55                             PUSH BP
1060:0078          89e5                           MOV BP,SP
1060:007a          1e                             PUSH DS
1060:007b          fc                             CLD
1060:007c          c47e08                         LES DI,[BP + 0x8]
1060:007f          8b4e06                         MOV CX,word ptr [BP + 0x6]
1060:0082          89cb                           MOV BX,CX
1060:0084          30c0                           XOR AL,AL
1060:0086          f2ae                           SCASB.REPNE ES:DI
1060:0088          29cb                           SUB BX,CX
1060:008a          89d9                           MOV CX,BX
1060:008c          c57608                         LDS SI,[BP + 0x8]
1060:008f          c47e0c                         LES DI,[BP + 0xc]
1060:0092          89fb                           MOV BX,DI
1060:0094          8cc2                           MOV DX,ES
1060:0096          f3a4                           MOVSB.REP ES:DI,SI
1060:0098          aa                             STOSB ES:DI
1060:0099          93                             XCHG AX,BX
1060:009a          1f                             POP DS
1060:009b          5d                             POP BP
1060:009c          ca0a00                         RETF 0xa
FUN_1060_009f:
1060:009f          55                             PUSH BP
1060:00a0          89e5                           MOV BP,SP
1060:00a2          1e                             PUSH DS
1060:00a3          fc                             CLD
1060:00a4          c57606                         LDS SI,[BP + 0x6]
1060:00a7          c47e0a                         LES DI,[BP + 0xa]
1060:00aa          89fb                           MOV BX,DI
1060:00ac          8cc2                           MOV DX,ES
1060:00ae          ac                             LODSB SI
1060:00af          30e4                           XOR AH,AH
1060:00b1          91                             XCHG AX,CX
1060:00b2          f3a4                           MOVSB.REP ES:DI,SI
1060:00b4          30c0                           XOR AL,AL
1060:00b6          aa                             STOSB ES:DI
1060:00b7          93                             XCHG AX,BX
1060:00b8          1f                             POP DS
1060:00b9          5d                             POP BP
1060:00ba          ca0800                         RETF 0x8
FUN_1060_00bd:
1060:00bd          55                             PUSH BP
1060:00be          89e5                           MOV BP,SP
1060:00c0          ff760c                         PUSH word ptr [BP + 0xc]
1060:00c3          ff760a                         PUSH word ptr [BP + 0xa]
1060:00c6          0e                             PUSH CS
1060:00c7          e84fff                         CALL 0x1060:0019
1060:00ca          52                             PUSH DX
1060:00cb          50                             PUSH AX
1060:00cc          ff7608                         PUSH word ptr [BP + 0x8]
1060:00cf          ff7606                         PUSH word ptr [BP + 0x6]
1060:00d2          0e                             PUSH CS
1060:00d3          e87fff                         CALL 0x1060:0055
1060:00d6          8b460a                         MOV AX,word ptr [BP + 0xa]
1060:00d9          8b560c                         MOV DX,word ptr [BP + 0xc]
1060:00dc          5d                             POP BP
1060:00dd          ca0800                         RETF 0x8
FUN_1060_00e0:
1060:00e0          55                             PUSH BP
1060:00e1          89e5                           MOV BP,SP
1060:00e3          1e                             PUSH DS
1060:00e4          fc                             CLD
1060:00e5          c47e06                         LES DI,[BP + 0x6]
1060:00e8          89fe                           MOV SI,DI
1060:00ea          b9ffff                         MOV CX,0xffff
1060:00ed          31c0                           XOR AX,AX
1060:00ef          99                             CWD
1060:00f0          f2ae                           SCASB.REPNE ES:DI
1060:00f2          f7d1                           NOT CX
1060:00f4          89f7                           MOV DI,SI
1060:00f6          c5760a                         LDS SI,[BP + 0xa]
1060:00f9          f3a6                           CMPSB.REPE ES:DI,SI
1060:00fb          8a44ff                         MOV AL,byte ptr [SI + -0x1]
1060:00fe          268a55ff                       MOV DL,byte ptr ES:[DI + -0x1]
1060:0102          29d0                           SUB AX,DX
1060:0104          1f                             POP DS
1060:0105          5d                             POP BP
1060:0106          ca0800                         RETF 0x8
FUN_1060_0109:
1060:0109          55                             PUSH BP
1060:010a          89e5                           MOV BP,SP
1060:010c          fc                             CLD
1060:010d          c47e08                         LES DI,[BP + 0x8]
1060:0110          89fe                           MOV SI,DI
1060:0112          b9ffff                         MOV CX,0xffff
1060:0115          30c0                           XOR AL,AL
1060:0117          f2ae                           SCASB.REPNE ES:DI
1060:0119          f7d1                           NOT CX
1060:011b          89f7                           MOV DI,SI
1060:011d          8a4606                         MOV AL,byte ptr [BP + 0x6]
1060:0120          f2ae                           SCASB.REPNE ES:DI
1060:0122          b80000                         MOV AX,0x0
1060:0125          99                             CWD
1060:0126          7505                           JNZ 0x1060:012d
1060:0128          89f8                           MOV AX,DI
1060:012a          8cc2                           MOV DX,ES
1060:012c          48                             DEC AX
LAB_1060_012d:
1060:012d          5d                             POP BP
1060:012e          ca0600                         RETF 0x6
FUN_1060_0131:
1060:0131          55                             PUSH BP
1060:0132          89e5                           MOV BP,SP
1060:0134          fc                             CLD
1060:0135          c47e08                         LES DI,[BP + 0x8]
1060:0138          b9ffff                         MOV CX,0xffff
1060:013b          30c0                           XOR AL,AL
1060:013d          f2ae                           SCASB.REPNE ES:DI
1060:013f          f7d1                           NOT CX
1060:0141          fd                             STD
1060:0142          4f                             DEC DI
1060:0143          8a4606                         MOV AL,byte ptr [BP + 0x6]
1060:0146          f2ae                           SCASB.REPNE ES:DI
1060:0148          b80000                         MOV AX,0x0
1060:014b          99                             CWD
1060:014c          7505                           JNZ 0x1060:0153
1060:014e          89f8                           MOV AX,DI
1060:0150          8cc2                           MOV DX,ES
1060:0152          40                             INC AX
LAB_1060_0153:
1060:0153          fc                             CLD
1060:0154          5d                             POP BP
1060:0155          ca0600                         RETF 0x6
FUN_1060_0158:
1060:0158          55                             PUSH BP
1060:0159          89e5                           MOV BP,SP
1060:015b          1e                             PUSH DS
1060:015c          fc                             CLD
1060:015d          c57606                         LDS SI,[BP + 0x6]
1060:0160          89f3                           MOV BX,SI
1060:0162          8cda                           MOV DX,DS
LAB_1060_0164:
1060:0164          ac                             LODSB SI
1060:0165          08c0                           OR AL,AL
1060:0167          740f                           JZ 0x1060:0178
1060:0169          3c61                           CMP AL,0x61
1060:016b          72f7                           JC 0x1060:0164
1060:016d          3c7a                           CMP AL,0x7a
1060:016f          77f3                           JA 0x1060:0164
1060:0171          2c20                           SUB AL,0x20
1060:0173          8844ff                         MOV byte ptr [SI + -0x1],AL
1060:0176          ebec                           JMP 0x1060:0164
LAB_1060_0178:
1060:0178          93                             XCHG AX,BX
1060:0179          1f                             POP DS
1060:017a          5d                             POP BP
1060:017b          ca0400                         RETF 0x4
FUN_1060_017e:
1060:017e          55                             PUSH BP
1060:017f          89e5                           MOV BP,SP
1060:0181          1e                             PUSH DS
1060:0182          fc                             CLD
1060:0183          c47e06                         LES DI,[BP + 0x6]
1060:0186          b9ffff                         MOV CX,0xffff
1060:0189          30c0                           XOR AL,AL
1060:018b          f2ae                           SCASB.REPNE ES:DI
1060:018d          f7d1                           NOT CX
1060:018f          49                             DEC CX
1060:0190          c57606                         LDS SI,[BP + 0x6]
1060:0193          c47e0a                         LES DI,[BP + 0xa]
1060:0196          88c8                           MOV AL,CL
1060:0198          aa                             STOSB ES:DI
1060:0199          f3a4                           MOVSB.REP ES:DI,SI
1060:019b          1f                             POP DS
1060:019c          5d                             POP BP
1060:019d          ca0400                         RETF 0x4
FUN_1060_01a0:
1060:01a0          45                             INC BP
1060:01a1          55                             PUSH BP
1060:01a2          89e5                           MOV BP,SP
1060:01a4          1e                             PUSH DS
1060:01a5          83ec0a                         SUB SP,0xa
1060:01a8          31c0                           XOR AX,AX
1060:01aa          8946fa                         MOV word ptr [BP + -0x6],AX
1060:01ad          8946fc                         MOV word ptr [BP + -0x4],AX
1060:01b0          8b4606                         MOV AX,word ptr [BP + 0x6]
1060:01b3          0b4608                         OR AX,word ptr [BP + 0x8]
1060:01b6          7448                           JZ 0x1060:0200
1060:01b8          c47e06                         LES DI,[BP + 0x6]
1060:01bb          26803d00                       CMP byte ptr ES:[DI],0x0
1060:01bf          743f                           JZ 0x1060:0200
1060:01c1          ff7608                         PUSH word ptr [BP + 0x8]
1060:01c4          ff7606                         PUSH word ptr [BP + 0x6]
1060:01c7          9a02006010                     CALLF 0x1060:0002
1060:01cc          40                             INC AX
1060:01cd          8946f8                         MOV word ptr [BP + -0x8],AX
1060:01d0          ff76f8                         PUSH word ptr [BP + -0x8]
1060:01d3          9a2d016810                     CALLF 0x1068:012d
1060:01d8          8946f4                         MOV word ptr [BP + -0xc],AX
1060:01db          8956f6                         MOV word ptr [BP + -0xa],DX
1060:01de          8b46f4                         MOV AX,word ptr [BP + -0xc]
1060:01e1          0b46f6                         OR AX,word ptr [BP + -0xa]
1060:01e4          741a                           JZ 0x1060:0200
1060:01e6          ff76f6                         PUSH word ptr [BP + -0xa]
1060:01e9          ff76f4                         PUSH word ptr [BP + -0xc]
1060:01ec          ff7608                         PUSH word ptr [BP + 0x8]
1060:01ef          ff7606                         PUSH word ptr [BP + 0x6]
1060:01f2          ff76f8                         PUSH word ptr [BP + -0x8]
1060:01f5          9a30006010                     CALLF 0x1060:0030
1060:01fa          8946fa                         MOV word ptr [BP + -0x6],AX
1060:01fd          8956fc                         MOV word ptr [BP + -0x4],DX
LAB_1060_0200:
1060:0200          8b46fa                         MOV AX,word ptr [BP + -0x6]
1060:0203          8b56fc                         MOV DX,word ptr [BP + -0x4]
1060:0206          89ec                           MOV SP,BP
1060:0208          5d                             POP BP
1060:0209          4d                             DEC BP
1060:020a          ca0400                         RETF 0x4
FUN_1060_020d:
1060:020d          45                             INC BP
1060:020e          55                             PUSH BP
1060:020f          89e5                           MOV BP,SP
1060:0211          1e                             PUSH DS
1060:0212          8b4606                         MOV AX,word ptr [BP + 0x6]
1060:0215          0b4608                         OR AX,word ptr [BP + 0x8]
1060:0218          7418                           JZ 0x1060:0232
1060:021a          ff7608                         PUSH word ptr [BP + 0x8]
1060:021d          ff7606                         PUSH word ptr [BP + 0x6]
1060:0220          ff7608                         PUSH word ptr [BP + 0x8]
1060:0223          ff7606                         PUSH word ptr [BP + 0x6]
1060:0226          9a02006010                     CALLF 0x1060:0002
1060:022b          40                             INC AX
1060:022c          50                             PUSH AX
1060:022d          9a47016810                     CALLF 0x1068:0147
LAB_1060_0232:
1060:0232          89ec                           MOV SP,BP
1060:0234          5d                             POP BP
1060:0235          4d                             DEC BP
1060:0236          ca0400                         RETF 0x4
FUN_1068_0002:
1068:0002          45                             INC BP
1068:0003          55                             PUSH BP
1068:0004          8bec                           MOV BP,SP
1068:0006          1e                             PUSH DS
1068:0007          0bc0                           OR AX,AX
1068:0009          744d                           JZ 0x1068:0058
1068:000b          8c066219                       MOV word ptr [0x1962],ES
1068:000f          89364219                       MOV word ptr [0x1942],SI
1068:0013          893e4419                       MOV word ptr [0x1944],DI
1068:0017          89164619                       MOV word ptr [0x1946],DX
1068:001b          891e4819                       MOV word ptr [0x1948],BX
1068:001f          8c064a19                       MOV word ptr [0x194a],ES
1068:0023          33c0                           XOR AX,AX
1068:0025          50                             PUSH AX
1068:0026          9a18005011                     CALLF 0x1150:0018
1068:002b          ff364419                       PUSH word ptr [0x1944]
1068:002f          9ad8005011                     CALLF 0x1150:00d8
1068:0034          0bc0                           OR AX,AX
1068:0036          7420                           JZ 0x1068:0058
1068:0038          9a34005011                     CALLF 0x1150:0034
1068:003d          33d2                           XOR DX,DX
1068:003f          a8c0                           TEST AL,0xc0
1068:0041          7506                           JNZ 0x1068:0049
1068:0043          42                             INC DX
1068:0044          a802                           TEST AL,0x2
1068:0046          7501                           JNZ 0x1068:0049
1068:0048          42                             INC DX
LAB_1068_0049:
1068:0049          88166c19                       MOV byte ptr [0x196c],DL
1068:004d          c7066a193000                   MOV word ptr [0x196a],0x30
1068:0053          8be5                           MOV SP,BP
1068:0055          5d                             POP BP
1068:0056          4d                             DEC BP
1068:0057          cb                             RETF
LAB_1068_0058:
1068:0058          b8ff4c                         MOV AX,0x4cff
1068:005b          cd21                           INT 0x21
FUN_1068_005d:
1068:005d          59                             POP CX
1068:005e          5b                             POP BX
1068:005f          eb04                           JMP 0x1068:0065
FUN_1068_0061:
1068:0061          33c9                           XOR CX,CX
1068:0063          33db                           XOR BX,BX
LAB_1068_0065:
1068:0065          a35c19                         MOV [0x195c],AX
1068:0068          8bc1                           MOV AX,CX
1068:006a          0bc3                           OR AX,BX
1068:006c          740c                           JZ 0x1068:007a
1068:006e          83fbff                         CMP BX,-0x1
1068:0071          7407                           JZ 0x1068:007a
1068:0073          8ec3                           MOV BX,ES
1068:0075          268b1e0000                     MOV BX,word ptr ES:[0x0]
LAB_1068_007a:
1068:007a          890e5e19                       MOV word ptr [0x195e],CX
1068:007e          891e6019                       MOV word ptr [0x1960],BX
1068:0082          833e621900                     CMP word ptr [0x1962],0x0
1068:0087          7403                           JZ 0x1068:008c
1068:0089          e84600                         CALL 0x1068:00d2
LAB_1068_008c:
1068:008c          a15e19                         MOV AX,[0x195e]
1068:008f          0b066019                       OR AX,word ptr [0x1960]
1068:0093          7436                           JZ 0x1068:00cb
1068:0095          b90a00                         MOV CX,0xa
1068:0098          a05c19                         MOV AL,[0x195c]
1068:009b          32e4                           XOR AH,AH
1068:009d          bb7f19                         MOV BX,0x197f
1068:00a0          e84d00                         CALL 0x1068:00f0
1068:00a3          b91000                         MOV CX,0x10
1068:00a6          a16019                         MOV AX,[0x1960]
1068:00a9          bb8719                         MOV BX,0x1987
1068:00ac          e84100                         CALL 0x1068:00f0
1068:00af          a15e19                         MOV AX,[0x195e]
1068:00b2          bb8c19                         MOV BX,0x198c
1068:00b5          e83800                         CALL 0x1068:00f0
1068:00b8          33c0                           XOR AX,AX
1068:00ba          50                             PUSH AX
1068:00bb          bb6e19                         MOV BX,0x196e
1068:00be          1e                             PUSH DS
1068:00bf          53                             PUSH BX
1068:00c0          50                             PUSH AX
1068:00c1          50                             PUSH AX
1068:00c2          b81010                         MOV AX,0x1010
1068:00c5          50                             PUSH AX
1068:00c6          9ad4005011                     CALLF 0x1150:00d4
LAB_1068_00cb:
1068:00cb          a05c19                         MOV AL,[0x195c]
1068:00ce          b44c                           MOV AH,0x4c
1068:00d0          cd21                           INT 0x21
FUN_1068_00d2:
1068:00d2          c41e5819                       LES BX,[0x1958]
1068:00d6          8cc0                           MOV AX,ES
1068:00d8          0bc3                           OR AX,BX
1068:00da          7413                           JZ 0x1068:00ef
1068:00dc          33c0                           XOR AX,AX
1068:00de          a35819                         MOV [0x1958],AX
1068:00e1          a35a19                         MOV [0x195a],AX
1068:00e4          a36419                         MOV [0x1964],AX
1068:00e7          b8d200                         MOV AX,0xd2
1068:00ea          0e                             PUSH CS
1068:00eb          50                             PUSH AX
1068:00ec          06                             PUSH ES
1068:00ed          53                             PUSH BX
1068:00ee          cb                             RETF
LAB_1068_00ef:
1068:00ef          c3                             RET
FUN_1068_00f0:
1068:00f0          33d2                           XOR DX,DX
1068:00f2          f7f1                           DIV CX
1068:00f4          80c230                         ADD DL,0x30
1068:00f7          80fa3a                         CMP DL,0x3a
1068:00fa          7203                           JC 0x1068:00ff
1068:00fc          80c207                         ADD DL,0x7
LAB_1068_00ff:
1068:00ff          4b                             DEC BX
1068:0100          8817                           MOV byte ptr [BX],DL
1068:0102          0bc0                           OR AX,AX
1068:0104          75ea                           JNZ 0x1068:00f0
1068:0106          c3                             RET
FUN_1068_012d:
1068:012d          45                             INC BP
1068:012e          55                             PUSH BP
1068:012f          8bec                           MOV BP,SP
1068:0131          1e                             PUSH DS
1068:0132          8b4606                         MOV AX,word ptr [BP + 0x6]
1068:0135          e89200                         CALL 0x1068:01ca
1068:0138          8be5                           MOV SP,BP
1068:013a          5d                             POP BP
1068:013b          4d                             DEC BP
1068:013c          7203                           JC 0x1068:0141
1068:013e          ca0200                         RETF 0x2
LAB_1068_0141:
1068:0141          b8cb00                         MOV AX,0xcb
1068:0144          e916ff                         JMP 0x1068:005d
FUN_1068_0147:
1068:0147          45                             INC BP
1068:0148          55                             PUSH BP
1068:0149          8bec                           MOV BP,SP
1068:014b          1e                             PUSH DS
1068:014c          8b4606                         MOV AX,word ptr [BP + 0x6]
1068:014f          8b4e08                         MOV CX,word ptr [BP + 0x8]
1068:0152          8b5e0a                         MOV BX,word ptr [BP + 0xa]
1068:0155          e87f01                         CALL 0x1068:02d7
1068:0158          8be5                           MOV SP,BP
1068:015a          5d                             POP BP
1068:015b          4d                             DEC BP
1068:015c          7203                           JC 0x1068:0161
1068:015e          ca0600                         RETF 0x6
LAB_1068_0161:
1068:0161          b8cc00                         MOV AX,0xcc
1068:0164          e9f6fe                         JMP 0x1068:005d
FUN_1068_01ca:
1068:01ca          0bc0                           OR AX,AX
1068:01cc          7450                           JZ 0x1068:021e
1068:01ce          a3e49f                         MOV [0x9fe4],AX
LAB_1068_01d1:
1068:01d1          3b064e19                       CMP AX,word ptr [0x194e]
1068:01d5          721f                           JC 0x1068:01f6
1068:01d7          e84800                         CALL 0x1068:0222
1068:01da          7345                           JNC 0x1068:0221
1068:01dc          833e4e1900                     CMP word ptr [0x194e],0x0
1068:01e1          7420                           JZ 0x1068:0203
1068:01e3          a1e49f                         MOV AX,[0x9fe4]
1068:01e6          8b1e5019                       MOV BX,word ptr [0x1950]
1068:01ea          83eb0c                         SUB BX,0xc
1068:01ed          3bc3                           CMP AX,BX
1068:01ef          7712                           JA 0x1068:0203
1068:01f1          e84800                         CALL 0x1068:023c
1068:01f4          eb0b                           JMP 0x1068:0201
LAB_1068_01f6:
1068:01f6          e84300                         CALL 0x1068:023c
1068:01f9          7326                           JNC 0x1068:0221
1068:01fb          a1e49f                         MOV AX,[0x9fe4]
1068:01fe          e82100                         CALL 0x1068:0222
LAB_1068_0201:
1068:0201          731e                           JNC 0x1068:0221
LAB_1068_0203:
1068:0203          a15419                         MOV AX,[0x1954]
1068:0206          0b065619                       OR AX,word ptr [0x1956]
1068:020a          7408                           JZ 0x1068:0214
1068:020c          ff36e49f                       PUSH word ptr [0x9fe4]
1068:0210          ff1e5419                       CALLF [0x1954]
LAB_1068_0214:
1068:0214          3d0100                         CMP AX,0x1
1068:0217          a1e49f                         MOV AX,[0x9fe4]
1068:021a          77b5                           JA 0x1068:01d1
1068:021c          7203                           JC 0x1068:0221
LAB_1068_021e:
1068:021e          33c0                           XOR AX,AX
1068:0220          99                             CWD
LAB_1068_0221:
1068:0221          c3                             RET
FUN_1068_0222:
1068:0222          ff365219                       PUSH word ptr [0x1952]
1068:0226          33d2                           XOR DX,DX
1068:0228          52                             PUSH DX
1068:0229          50                             PUSH AX
1068:022a          9a00005011                     CALLF 0x1150:0000
1068:022f          3d0100                         CMP AX,0x1
1068:0232          7207                           JC 0x1068:023b
1068:0234          50                             PUSH AX
1068:0235          9a08005011                     CALLF 0x1150:0008
1068:023a          f8                             CLC
LAB_1068_023b:
1068:023b          c3                             RET
FUN_1068_023c:
1068:023c          050300                         ADD AX,0x3
1068:023f          24fc                           AND AL,0xfc
1068:0241          8b0e4c19                       MOV CX,word ptr [0x194c]
1068:0245          e312                           JCXZ 0x1068:0259
LAB_1068_0247:
1068:0247          8ec1                           MOV CX,ES
1068:0249          e85a00                         CALL 0x1068:02a6
1068:024c          7313                           JNC 0x1068:0261
1068:024e          268b0e0a00                     MOV CX,word ptr ES:[0xa]
1068:0253          3b0e4c19                       CMP CX,word ptr [0x194c]
1068:0257          75ee                           JNZ 0x1068:0247
LAB_1068_0259:
1068:0259          e80e00                         CALL 0x1068:026a
1068:025c          720b                           JC 0x1068:0269
1068:025e          e84500                         CALL 0x1068:02a6
LAB_1068_0261:
1068:0261          8c064c19                       MOV word ptr [0x194c],ES
1068:0265          8bc3                           MOV AX,BX
1068:0267          8cc2                           MOV DX,ES
LAB_1068_0269:
1068:0269          c3                             RET
FUN_1068_026a:
1068:026a          50                             PUSH AX
1068:026b          a15019                         MOV AX,[0x1950]
1068:026e          e8b1ff                         CALL 0x1068:0222
1068:0271          7231                           JC 0x1068:02a4
1068:0273          8ec2                           MOV DX,ES
1068:0275          33ff                           XOR DI,DI
1068:0277          fc                             CLD
1068:0278          b85450                         MOV AX,0x5054
1068:027b          ab                             STOSW ES:DI
1068:027c          33c0                           XOR AX,AX
1068:027e          ab                             STOSW ES:DI
1068:027f          b80c00                         MOV AX,0xc
1068:0282          ab                             STOSW ES:DI
1068:0283          33c0                           XOR AX,AX
1068:0285          ab                             STOSW ES:DI
1068:0286          a15019                         MOV AX,[0x1950]
1068:0289          2d0c00                         SUB AX,0xc
1068:028c          ab                             STOSW ES:DI
1068:028d          50                             PUSH AX
1068:028e          8cc0                           MOV AX,ES
1068:0290          8b0e4c19                       MOV CX,word ptr [0x194c]
1068:0294          e308                           JCXZ 0x1068:029e
1068:0296          1e                             PUSH DS
1068:0297          8ed9                           MOV CX,DS
1068:0299          87060a00                       XCHG word ptr [0xa],AX
1068:029d          1f                             POP DS
LAB_1068_029e:
1068:029e          ab                             STOSW ES:DI
1068:029f          33c0                           XOR AX,AX
1068:02a1          ab                             STOSW ES:DI
1068:02a2          58                             POP AX
1068:02a3          ab                             STOSW ES:DI
LAB_1068_02a4:
1068:02a4          58                             POP AX
1068:02a5          c3                             RET
FUN_1068_02a6:
1068:02a6          bb0400                         MOV BX,0x4
LAB_1068_02a9:
1068:02a9          8bf3                           MOV SI,BX
1068:02ab          268b1f                         MOV BX,word ptr ES:[BX]
1068:02ae          83fb01                         CMP BX,0x1
1068:02b1          7223                           JC 0x1068:02d6
1068:02b3          268b5702                       MOV DX,word ptr ES:[BX + 0x2]
1068:02b7          2bd0                           SUB DX,AX
1068:02b9          72ee                           JC 0x1068:02a9
1068:02bb          268b0f                         MOV CX,word ptr ES:[BX]
1068:02be          740d                           JZ 0x1068:02cd
1068:02c0          8bfb                           MOV DI,BX
1068:02c2          03f8                           ADD DI,AX
1068:02c4          26890d                         MOV word ptr ES:[DI],CX
1068:02c7          26895502                       MOV word ptr ES:[DI + 0x2],DX
1068:02cb          8bcf                           MOV CX,DI
LAB_1068_02cd:
1068:02cd          26890c                         MOV word ptr ES:[SI],CX
1068:02d0          2629060800                     SUB word ptr ES:[0x8],AX
1068:02d5          f8                             CLC
LAB_1068_02d6:
1068:02d6          c3                             RET
FUN_1068_02d7:
1068:02d7          0bc0                           OR AX,AX
1068:02d9          7465                           JZ 0x1068:0340
1068:02db          e367                           JCXZ 0x1068:0344
1068:02dd          050300                         ADD AX,0x3
1068:02e0          24fc                           AND AL,0xfc
1068:02e2          8ec3                           MOV BX,ES
1068:02e4          8bd9                           MOV BX,CX
1068:02e6          26813e00005450                 CMP word ptr ES:[0x0],0x5054
1068:02ed          7553                           JNZ 0x1068:0342
1068:02ef          f6c303                         TEST BL,0x3
1068:02f2          754e                           JNZ 0x1068:0342
1068:02f4          be0400                         MOV SI,0x4
LAB_1068_02f7:
1068:02f7          8bfe                           MOV DI,SI
1068:02f9          268b34                         MOV SI,word ptr ES:[SI]
1068:02fc          0bf6                           OR SI,SI
1068:02fe          7406                           JZ 0x1068:0306
1068:0300          3bde                           CMP BX,SI
1068:0302          77f3                           JA 0x1068:02f7
1068:0304          743c                           JZ 0x1068:0342
LAB_1068_0306:
1068:0306          268937                         MOV word ptr ES:[BX],SI
1068:0309          26894702                       MOV word ptr ES:[BX + 0x2],AX
1068:030d          2603060800                     ADD AX,word ptr ES:[0x8]
1068:0312          26a30800                       MOV ES:[0x8],AX
1068:0316          050c00                         ADD AX,0xc
1068:0319          3b065019                       CMP AX,word ptr [0x1950]
1068:031d          7443                           JZ 0x1068:0362
1068:031f          e80500                         CALL 0x1068:0327
1068:0322          26891d                         MOV word ptr ES:[DI],BX
1068:0325          8bdf                           MOV BX,DI
FUN_1068_0327:
1068:0327          8bf3                           MOV SI,BX
1068:0329          26037702                       ADD SI,word ptr ES:[BX + 0x2]
1068:032d          263b37                         CMP SI,word ptr ES:[BX]
1068:0330          750e                           JNZ 0x1068:0340
1068:0332          268b04                         MOV AX,word ptr ES:[SI]
1068:0335          268907                         MOV word ptr ES:[BX],AX
1068:0338          268b4402                       MOV AX,word ptr ES:[SI + 0x2]
1068:033c          26014702                       ADD word ptr ES:[BX + 0x2],AX
LAB_1068_0340:
1068:0340          f8                             CLC
1068:0341          c3                             RET
LAB_1068_0342:
1068:0342          f9                             STC
1068:0343          c3                             RET
LAB_1068_0344:
1068:0344          8cd8                           MOV AX,DS
1068:0346          3bc3                           CMP AX,BX
1068:0348          74f8                           JZ 0x1068:0342
1068:034a          53                             PUSH BX
1068:034b          9a10005011                     CALLF 0x1150:0010
1068:0350          0bc0                           OR AX,AX
1068:0352          74ee                           JZ 0x1068:0342
1068:0354          50                             PUSH AX
1068:0355          50                             PUSH AX
1068:0356          9a0c005011                     CALLF 0x1150:000c
1068:035b          9a04005011                     CALLF 0x1150:0004
1068:0360          f8                             CLC
1068:0361          c3                             RET
LAB_1068_0362:
1068:0362          33c0                           XOR AX,AX
1068:0364          8cc3                           MOV BX,ES
1068:0366          268b160a00                     MOV DX,word ptr ES:[0xa]
1068:036b          3bda                           CMP BX,DX
1068:036d          7414                           JZ 0x1068:0383
1068:036f          a14c19                         MOV AX,[0x194c]
LAB_1068_0372:
1068:0372          8ec0                           MOV AX,ES
1068:0374          26a10a00                       MOV AX,ES:[0xa]
1068:0378          3bc3                           CMP AX,BX
1068:037a          75f6                           JNZ 0x1068:0372
1068:037c          2689160a00                     MOV word ptr ES:[0xa],DX
1068:0381          8cc0                           MOV AX,ES
LAB_1068_0383:
1068:0383          a34c19                         MOV [0x194c],AX
1068:0386          ebbc                           JMP 0x1068:0344
FUN_1068_038f:
1068:038f          833e641900                     CMP word ptr [0x1964],0x0
1068:0394          7501                           JNZ 0x1068:0397
1068:0396          cb                             RETF
LAB_1068_0397:
1068:0397          a16419                         MOV AX,[0x1964]
1068:039a          e9c0fc                         JMP 0x1068:005d
FUN_1068_03cb:
1068:03cb          050004                         ADD AX,0x400
1068:03ce          7219                           JC 0x1068:03e9
1068:03d0          2bc4                           SUB AX,SP
1068:03d2          7315                           JNC 0x1068:03e9
1068:03d4          f7d8                           NEG AX
1068:03d6          363b060a00                     CMP AX,word ptr SS:[0xa]
1068:03db          720c                           JC 0x1068:03e9
1068:03dd          363b060e00                     CMP AX,word ptr SS:[0xe]
1068:03e2          7304                           JNC 0x1068:03e8
1068:03e4          36a30e00                       MOV SS:[0xe],AX
LAB_1068_03e8:
1068:03e8          cb                             RETF
LAB_1068_03e9:
1068:03e9          b8ca00                         MOV AX,0xca
1068:03ec          e96efc                         JMP 0x1068:005d
FUN_1068_03ef:
1068:03ef          8b760a                         MOV SI,word ptr [BP + 0xa]
1068:03f2          83fe01                         CMP SI,0x1
1068:03f5          7211                           JC 0x1068:0408
1068:03f7          c45e06                         LES BX,[BP + 0x6]
1068:03fa          8cc0                           MOV AX,ES
1068:03fc          0bc3                           OR AX,BX
1068:03fe          7409                           JZ 0x1068:0409
1068:0400          c7460a0000                     MOV word ptr [BP + 0xa],0x0
LAB_1068_0405:
1068:0405          268931                         MOV word ptr ES:[BX + DI],SI
LAB_1068_0408:
1068:0408          cb                             RETF
LAB_1068_0409:
1068:0409          8b04                           MOV AX,word ptr [SI]
1068:040b          45                             INC BP
1068:040c          55                             PUSH BP
1068:040d          8bec                           MOV BP,SP
1068:040f          1e                             PUSH DS
1068:0410          56                             PUSH SI
1068:0411          57                             PUSH DI
1068:0412          e8b5fd                         CALL 0x1068:01ca
1068:0415          5f                             POP DI
1068:0416          5e                             POP SI
1068:0417          8be5                           MOV SP,BP
1068:0419          5d                             POP BP
1068:041a          4d                             DEC BP
1068:041b          7212                           JC 0x1068:042f
1068:041d          8bc8                           MOV CX,AX
1068:041f          0bca                           OR CX,DX
1068:0421          74e5                           JZ 0x1068:0408
1068:0423          894606                         MOV word ptr [BP + 0x6],AX
1068:0426          895608                         MOV word ptr [BP + 0x8],DX
1068:0429          8ec2                           MOV DX,ES
1068:042b          8bd8                           MOV BX,AX
1068:042d          ebd6                           JMP 0x1068:0405
LAB_1068_042f:
1068:042f          8be5                           MOV SP,BP
1068:0431          5d                             POP BP
1068:0432          4d                             DEC BP
1068:0433          b8cb00                         MOV AX,0xcb
1068:0436          e924fc                         JMP 0x1068:005d
FUN_1068_0439:
1068:0439          837e0a00                       CMP word ptr [BP + 0xa],0x0
1068:043d          741a                           JZ 0x1068:0459
1068:043f          c45e06                         LES BX,[BP + 0x6]
1068:0442          268b31                         MOV SI,word ptr ES:[BX + DI]
1068:0445          8b04                           MOV AX,word ptr [SI]
1068:0447          8bcb                           MOV CX,BX
1068:0449          8cc3                           MOV BX,ES
1068:044b          45                             INC BP
1068:044c          55                             PUSH BP
1068:044d          8bec                           MOV BP,SP
1068:044f          1e                             PUSH DS
1068:0450          e884fe                         CALL 0x1068:02d7
1068:0453          8be5                           MOV SP,BP
1068:0455          5d                             POP BP
1068:0456          4d                             DEC BP
1068:0457          7209                           JC 0x1068:0462
LAB_1068_0459:
1068:0459          33c0                           XOR AX,AX
1068:045b          894606                         MOV word ptr [BP + 0x6],AX
1068:045e          894608                         MOV word ptr [BP + 0x8],AX
1068:0461          cb                             RETF
LAB_1068_0462:
1068:0462          8be5                           MOV SP,BP
1068:0464          5d                             POP BP
1068:0465          4d                             DEC BP
1068:0466          b8cc00                         MOV AX,0xcc
1068:0469          e9f1fb                         JMP 0x1068:005d
FUN_1068_0527:
1068:0527          bab1d7                         MOV DX,0xd7b1
1068:052a          eb08                           JMP 0x1068:0534
FUN_1068_052c:
1068:052c          bab2d7                         MOV DX,0xd7b2
1068:052f          eb03                           JMP 0x1068:0534
FUN_1068_0534:
1068:0534          45                             INC BP
1068:0535          55                             PUSH BP
1068:0536          8bec                           MOV BP,SP
1068:0538          1e                             PUSH DS
1068:0539          c47e06                         LES DI,[BP + 0x6]
1068:053c          268b4502                       MOV AX,word ptr ES:[DI + 0x2]
1068:0540          3db1d7                         CMP AX,0xd7b1
1068:0543          7412                           JZ 0x1068:0557
1068:0545          3db2d7                         CMP AX,0xd7b2
1068:0548          740d                           JZ 0x1068:0557
1068:054a          3db0d7                         CMP AX,0xd7b0
1068:054d          7410                           JZ 0x1068:055f
1068:054f          c70664196600                   MOV word ptr [0x1964],0x66
1068:0555          eb24                           JMP 0x1068:057b
LAB_1068_0557:
1068:0557          52                             PUSH DX
1068:0558          06                             PUSH ES
1068:0559          57                             PUSH DI
1068:055a          0e                             PUSH CS
1068:055b          e82800                         CALL 0x1068:0586
1068:055e          5a                             POP DX
LAB_1068_055f:
1068:055f          33c0                           XOR AX,AX
1068:0561          26895502                       MOV word ptr ES:[DI + 0x2],DX
1068:0565          26894508                       MOV word ptr ES:[DI + 0x8],AX
1068:0569          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1068:056d          bb1000                         MOV BX,0x10
1068:0570          e85400                         CALL 0x1068:05c7
1068:0573          7406                           JZ 0x1068:057b
1068:0575          26c74502b0d7                   MOV word ptr ES:[DI + 0x2],0xd7b0
LAB_1068_057b:
1068:057b          8be5                           MOV SP,BP
1068:057d          5d                             POP BP
1068:057e          4d                             DEC BP
1068:057f          ca0400                         RETF 0x4
FUN_1068_0586:
1068:0586          b001                           MOV AL,0x1
1068:0588          45                             INC BP
1068:0589          55                             PUSH BP
1068:058a          8bec                           MOV BP,SP
1068:058c          1e                             PUSH DS
1068:058d          c47e06                         LES DI,[BP + 0x6]
1068:0590          26817d02b1d7                   CMP word ptr ES:[DI + 0x2],0xd7b1
1068:0596          7418                           JZ 0x1068:05b0
1068:0598          26817d02b2d7                   CMP word ptr ES:[DI + 0x2],0xd7b2
1068:059e          7408                           JZ 0x1068:05a8
1068:05a0          c70664196700                   MOV word ptr [0x1964],0x67
1068:05a6          eb18                           JMP 0x1068:05c0
LAB_1068_05a8:
1068:05a8          50                             PUSH AX
1068:05a9          bb1400                         MOV BX,0x14
1068:05ac          e81800                         CALL 0x1068:05c7
1068:05af          58                             POP AX
LAB_1068_05b0:
1068:05b0          0ac0                           OR AL,AL
1068:05b2          740c                           JZ 0x1068:05c0
1068:05b4          bb1c00                         MOV BX,0x1c
1068:05b7          e80d00                         CALL 0x1068:05c7
1068:05ba          26c74502b0d7                   MOV word ptr ES:[DI + 0x2],0xd7b0
LAB_1068_05c0:
1068:05c0          8be5                           MOV SP,BP
1068:05c2          5d                             POP BP
1068:05c3          4d                             DEC BP
1068:05c4          ca0400                         RETF 0x4
FUN_1068_05c7:
1068:05c7          06                             PUSH ES
1068:05c8          57                             PUSH DI
1068:05c9          06                             PUSH ES
1068:05ca          57                             PUSH DI
1068:05cb          26ff19                         CALLF [BX + DI]
1068:05ce          0bc0                           OR AX,AX
1068:05d0          7403                           JZ 0x1068:05d5
1068:05d2          a36419                         MOV [0x1964],AX
LAB_1068_05d5:
1068:05d5          5f                             POP DI
1068:05d6          07                             POP ES
1068:05d7          c3                             RET
FUN_1068_05d8:
1068:05d8          8bdc                           MOV BX,SP
1068:05da          1e                             PUSH DS
1068:05db          36c47f04                       LES DI,SS:[BX + 0x4]
1068:05df          26c5550c                       LDS DX,ES:[DI + 0xc]
1068:05e3          268b4d04                       MOV CX,word ptr ES:[DI + 0x4]
1068:05e7          268b1d                         MOV BX,word ptr ES:[DI]
1068:05ea          b43f                           MOV AH,0x3f
1068:05ec          cd21                           INT 0x21
1068:05ee          7210                           JC 0x1068:0600
1068:05f0          2689450a                       MOV word ptr ES:[DI + 0xa],AX
1068:05f4          33c0                           XOR AX,AX
LAB_1068_05f6:
1068:05f6          26c745080000                   MOV word ptr ES:[DI + 0x8],0x0
1068:05fc          1f                             POP DS
1068:05fd          ca0400                         RETF 0x4
LAB_1068_0600:
1068:0600          26c7450a0000                   MOV word ptr ES:[DI + 0xa],0x0
1068:0606          ebee                           JMP 0x1068:05f6
FUN_1068_0608:
1068:0608          8bdc                           MOV BX,SP
1068:060a          1e                             PUSH DS
1068:060b          36c47f04                       LES DI,SS:[BX + 0x4]
1068:060f          26c5550c                       LDS DX,ES:[DI + 0xc]
1068:0613          33c9                           XOR CX,CX
1068:0615          26874d08                       XCHG word ptr ES:[DI + 0x8],CX
1068:0619          268b1d                         MOV BX,word ptr ES:[DI]
1068:061c          b440                           MOV AH,0x40
1068:061e          cd21                           INT 0x21
1068:0620          7207                           JC 0x1068:0629
1068:0622          2bc1                           SUB AX,CX
1068:0624          7403                           JZ 0x1068:0629
1068:0626          b86500                         MOV AX,0x65
LAB_1068_0629:
1068:0629          1f                             POP DS
1068:062a          ca0400                         RETF 0x4
FUN_1068_062d:
1068:062d          8bdc                           MOV BX,SP
1068:062f          1e                             PUSH DS
1068:0630          36c47f04                       LES DI,SS:[BX + 0x4]
1068:0634          26c5550c                       LDS DX,ES:[DI + 0xc]
1068:0638          33c9                           XOR CX,CX
1068:063a          26874d08                       XCHG word ptr ES:[DI + 0x8],CX
1068:063e          268b1d                         MOV BX,word ptr ES:[DI]
1068:0641          b440                           MOV AH,0x40
1068:0643          cd21                           INT 0x21
1068:0645          7202                           JC 0x1068:0649
1068:0647          33c0                           XOR AX,AX
LAB_1068_0649:
1068:0649          1f                             POP DS
1068:064a          ca0400                         RETF 0x4
FUN_1068_064d:
1068:064d          8bdc                           MOV BX,SP
1068:064f          36c47f04                       LES DI,SS:[BX + 0x4]
1068:0653          268b1d                         MOV BX,word ptr ES:[DI]
1068:0656          83fb04                         CMP BX,0x4
1068:0659          7606                           JBE 0x1068:0661
1068:065b          b43e                           MOV AH,0x3e
1068:065d          cd21                           INT 0x21
1068:065f          7202                           JC 0x1068:0663
LAB_1068_0661:
1068:0661          33c0                           XOR AX,AX
LAB_1068_0663:
1068:0663          ca0400                         RETF 0x4
FUN_1068_0667:
1068:0667          33d2                           XOR DX,DX
1068:0669          8bdc                           MOV BX,SP
1068:066b          1e                             PUSH DS
1068:066c          36c47f08                       LES DI,SS:[BX + 0x8]
1068:0670          36c57704                       LDS SI,SS:[BX + 0x4]
1068:0674          fc                             CLD
1068:0675          33c0                           XOR AX,AX
1068:0677          ab                             STOSW ES:DI
1068:0678          b8b0d7                         MOV AX,0xd7b0
1068:067b          ab                             STOSW ES:DI
1068:067c          33c0                           XOR AX,AX
1068:067e          b91600                         MOV CX,0x16
1068:0681          f3ab                           STOSW.REP ES:DI
1068:0683          06                             PUSH ES
1068:0684          57                             PUSH DI
1068:0685          06                             PUSH ES
1068:0686          57                             PUSH DI
1068:0687          b94f00                         MOV CX,0x4f
1068:068a          0bd2                           OR DX,DX
1068:068c          7509                           JNZ 0x1068:0697
1068:068e          ac                             LODSB SI
1068:068f          3ac8                           CMP CL,AL
1068:0691          7604                           JBE 0x1068:0697
1068:0693          8ac8                           MOV CL,AL
1068:0695          e308                           JCXZ 0x1068:069f
LAB_1068_0697:
1068:0697          ac                             LODSB SI
1068:0698          0ac0                           OR AL,AL
1068:069a          7403                           JZ 0x1068:069f
1068:069c          aa                             STOSB ES:DI
1068:069d          e2f8                           LOOP 0x1068:0697
LAB_1068_069f:
1068:069f          32c0                           XOR AL,AL
1068:06a1          aa                             STOSB ES:DI
1068:06a2          9af8015011                     CALLF 0x1150:01f8
1068:06a7          1f                             POP DS
1068:06a8          ca0800                         RETF 0x8
FUN_1068_06ab:
1068:06ab          a06d19                         MOV AL,[0x196d]
1068:06ae          b43d                           MOV AH,0x3d
1068:06b0          33d2                           XOR DX,DX
1068:06b2          eb06                           JMP 0x1068:06ba
LAB_1068_06ba:
1068:06ba          55                             PUSH BP
1068:06bb          8bec                           MOV BP,SP
1068:06bd          c47e08                         LES DI,[BP + 0x8]
1068:06c0          26817d02b0d7                   CMP word ptr ES:[DI + 0x2],0xd7b0
1068:06c6          741a                           JZ 0x1068:06e2
1068:06c8          26817d02b3d7                   CMP word ptr ES:[DI + 0x2],0xd7b3
1068:06ce          7408                           JZ 0x1068:06d8
1068:06d0          c70664196600                   MOV word ptr [0x1964],0x66
1068:06d6          eb34                           JMP 0x1068:070c
LAB_1068_06d8:
1068:06d8          50                             PUSH AX
1068:06d9          52                             PUSH DX
1068:06da          06                             PUSH ES
1068:06db          57                             PUSH DI
1068:06dc          0e                             PUSH CS
1068:06dd          e84c00                         CALL 0x1068:072c
1068:06e0          5a                             POP DX
1068:06e1          58                             POP AX
LAB_1068_06e2:
1068:06e2          26807d3000                     CMP byte ptr ES:[DI + 0x30],0x0
1068:06e7          7412                           JZ 0x1068:06fb
1068:06e9          1e                             PUSH DS
1068:06ea          8d5530                         LEA DX,[DI + 0x30]
1068:06ed          06                             PUSH ES
1068:06ee          1f                             POP DS
1068:06ef          33c9                           XOR CX,CX
1068:06f1          cd21                           INT 0x21
1068:06f3          1f                             POP DS
1068:06f4          7306                           JNC 0x1068:06fc
1068:06f6          a36419                         MOV [0x1964],AX
1068:06f9          eb11                           JMP 0x1068:070c
LAB_1068_06fb:
1068:06fb          92                             XCHG AX,DX
LAB_1068_06fc:
1068:06fc          26c74502b3d7                   MOV word ptr ES:[DI + 0x2],0xd7b3
1068:0702          268905                         MOV word ptr ES:[DI],AX
1068:0705          8b4606                         MOV AX,word ptr [BP + 0x6]
1068:0708          26894504                       MOV word ptr ES:[DI + 0x4],AX
LAB_1068_070c:
1068:070c          5d                             POP BP
1068:070d          ca0600                         RETF 0x6
FUN_1068_072c:
1068:072c          8bdc                           MOV BX,SP
1068:072e          36c47f04                       LES DI,SS:[BX + 0x4]
1068:0732          e81c00                         CALL 0x1068:0751
1068:0735          7517                           JNZ 0x1068:074e
1068:0737          268b1d                         MOV BX,word ptr ES:[DI]
1068:073a          83fb04                         CMP BX,0x4
1068:073d          7609                           JBE 0x1068:0748
1068:073f          b43e                           MOV AH,0x3e
1068:0741          cd21                           INT 0x21
1068:0743          7303                           JNC 0x1068:0748
1068:0745          a36419                         MOV [0x1964],AX
LAB_1068_0748:
1068:0748          26c74502b0d7                   MOV word ptr ES:[DI + 0x2],0xd7b0
LAB_1068_074e:
1068:074e          ca0400                         RETF 0x4
FUN_1068_0751:
1068:0751          26817d02b3d7                   CMP word ptr ES:[DI + 0x2],0xd7b3
1068:0757          7406                           JZ 0x1068:075f
1068:0759          c70664196700                   MOV word ptr [0x1964],0x67
LAB_1068_075f:
1068:075f          c3                             RET
FUN_1068_0760:
1068:0760          b43f                           MOV AH,0x3f
1068:0762          ba6400                         MOV DX,0x64
1068:0765          eb05                           JMP 0x1068:076c
LAB_1068_076c:
1068:076c          55                             PUSH BP
1068:076d          8bec                           MOV BP,SP
1068:076f          c47e0a                         LES DI,[BP + 0xa]
1068:0772          e8dcff                         CALL 0x1068:0751
1068:0775          751b                           JNZ 0x1068:0792
1068:0777          1e                             PUSH DS
1068:0778          52                             PUSH DX
1068:0779          c55606                         LDS DX,[BP + 0x6]
1068:077c          268b4d04                       MOV CX,word ptr ES:[DI + 0x4]
1068:0780          268b1d                         MOV BX,word ptr ES:[DI]
1068:0783          cd21                           INT 0x21
1068:0785          5a                             POP DX
1068:0786          1f                             POP DS
1068:0787          7206                           JC 0x1068:078f
1068:0789          3bc1                           CMP AX,CX
1068:078b          7405                           JZ 0x1068:0792
1068:078d          8bc2                           MOV AX,DX
LAB_1068_078f:
1068:078f          a36419                         MOV [0x1964],AX
LAB_1068_0792:
1068:0792          5d                             POP BP
1068:0793          ca0400                         RETF 0x4
FUN_1068_0796:
1068:0796          b33f                           MOV BL,0x3f
1068:0798          b96400                         MOV CX,0x64
1068:079b          eb05                           JMP 0x1068:07a2
LAB_1068_07a2:
1068:07a2          55                             PUSH BP
1068:07a3          8bec                           MOV BP,SP
1068:07a5          c47e10                         LES DI,[BP + 0x10]
1068:07a8          e8a6ff                         CALL 0x1068:0751
1068:07ab          753f                           JNZ 0x1068:07ec
1068:07ad          8b460a                         MOV AX,word ptr [BP + 0xa]
1068:07b0          0bc0                           OR AX,AX
1068:07b2          741c                           JZ 0x1068:07d0
1068:07b4          1e                             PUSH DS
1068:07b5          51                             PUSH CX
1068:07b6          26f76504                       MUL word ptr ES:[DI + 0x4]
1068:07ba          8bc8                           MOV CX,AX
1068:07bc          c5560c                         LDS DX,[BP + 0xc]
1068:07bf          8ae3                           MOV AH,BL
1068:07c1          268b1d                         MOV BX,word ptr ES:[DI]
1068:07c4          cd21                           INT 0x21
1068:07c6          59                             POP CX
1068:07c7          1f                             POP DS
1068:07c8          721f                           JC 0x1068:07e9
1068:07ca          33d2                           XOR DX,DX
1068:07cc          26f77504                       DIV word ptr ES:[DI + 0x4]
LAB_1068_07d0:
1068:07d0          c47e06                         LES DI,[BP + 0x6]
1068:07d3          8cc2                           MOV DX,ES
1068:07d5          0bd7                           OR DX,DI
1068:07d7          7405                           JZ 0x1068:07de
1068:07d9          268905                         MOV word ptr ES:[DI],AX
1068:07dc          eb1c                           JMP 0x1068:07fa
LAB_1068_07de:
1068:07de          3b460a                         CMP AX,word ptr [BP + 0xa]
1068:07e1          7417                           JZ 0x1068:07fa
1068:07e3          890e6419                       MOV word ptr [0x1964],CX
1068:07e7          eb11                           JMP 0x1068:07fa
LAB_1068_07e9:
1068:07e9          a36419                         MOV [0x1964],AX
LAB_1068_07ec:
1068:07ec          c47e06                         LES DI,[BP + 0x6]
1068:07ef          8cc2                           MOV DX,ES
1068:07f1          0bd7                           OR DX,DI
1068:07f3          7405                           JZ 0x1068:07fa
1068:07f5          33c0                           XOR AX,AX
1068:07f7          268905                         MOV word ptr ES:[DI],AX
LAB_1068_07fa:
1068:07fa          5d                             POP BP
1068:07fb          ca0e00                         RETF 0xe
FUN_1068_07fe:
1068:07fe          55                             PUSH BP
1068:07ff          8bec                           MOV BP,SP
1068:0801          c47e0a                         LES DI,[BP + 0xa]
1068:0804          e84aff                         CALL 0x1068:0751
1068:0807          7521                           JNZ 0x1068:082a
1068:0809          8b4608                         MOV AX,word ptr [BP + 0x8]
1068:080c          26f76504                       MUL word ptr ES:[DI + 0x4]
1068:0810          8bc8                           MOV CX,AX
1068:0812          8b4606                         MOV AX,word ptr [BP + 0x6]
1068:0815          26f76504                       MUL word ptr ES:[DI + 0x4]
1068:0819          03ca                           ADD CX,DX
1068:081b          8bd0                           MOV DX,AX
1068:081d          268b1d                         MOV BX,word ptr ES:[DI]
1068:0820          b80042                         MOV AX,0x4200
1068:0823          cd21                           INT 0x21
1068:0825          7303                           JNC 0x1068:082a
1068:0827          a36419                         MOV [0x1964],AX
LAB_1068_082a:
1068:082a          5d                             POP BP
1068:082b          ca0800                         RETF 0x8
FUN_1068_082e:
1068:082e          45                             INC BP
1068:082f          55                             PUSH BP
1068:0830          8bec                           MOV BP,SP
1068:0832          1e                             PUSH DS
1068:0833          8b4e06                         MOV CX,word ptr [BP + 0x6]
1068:0836          e310                           JCXZ 0x1068:0848
1068:0838          1e                             PUSH DS
1068:0839          e83500                         CALL 0x1068:0871
1068:083c          8bf3                           MOV SI,BX
1068:083e          c47e08                         LES DI,[BP + 0x8]
1068:0841          aa                             STOSB ES:DI
1068:0842          91                             XCHG AX,CX
1068:0843          f3a4                           MOVSB.REP ES:DI,SI
1068:0845          1f                             POP DS
1068:0846          eb17                           JMP 0x1068:085f
LAB_1068_0848:
1068:0848          ff364419                       PUSH word ptr [0x1944]
1068:084c          c47e08                         LES DI,[BP + 0x8]
1068:084f          47                             INC DI
1068:0850          06                             PUSH ES
1068:0851          57                             PUSH DI
1068:0852          b8ff00                         MOV AX,0xff
1068:0855          50                             PUSH AX
1068:0856          9a1c005011                     CALLF 0x1150:001c
1068:085b          c47e08                         LES DI,[BP + 0x8]
1068:085e          aa                             STOSB ES:DI
LAB_1068_085f:
1068:085f          8be5                           MOV SP,BP
1068:0861          5d                             POP BP
1068:0862          4d                             DEC BP
1068:0863          ca0200                         RETF 0x2
FUN_1068_0866:
1068:0866          1e                             PUSH DS
1068:0867          33c9                           XOR CX,CX
1068:0869          e80500                         CALL 0x1068:0871
1068:086c          91                             XCHG AX,CX
1068:086d          f7d8                           NEG AX
1068:086f          1f                             POP DS
1068:0870          cb                             RETF
FUN_1068_0871:
1068:0871          c5364819                       LDS SI,[0x1948]
1068:0875          fc                             CLD
LAB_1068_0876:
1068:0876          ac                             LODSB SI
1068:0877          0ac0                           OR AL,AL
1068:0879          7404                           JZ 0x1068:087f
1068:087b          3c20                           CMP AL,0x20
1068:087d          76f7                           JBE 0x1068:0876
LAB_1068_087f:
1068:087f          4e                             DEC SI
1068:0880          8bde                           MOV BX,SI
LAB_1068_0882:
1068:0882          ac                             LODSB SI
1068:0883          3c20                           CMP AL,0x20
1068:0885          77fb                           JA 0x1068:0882
1068:0887          4e                             DEC SI
1068:0888          8bc6                           MOV AX,SI
1068:088a          2bc3                           SUB AX,BX
1068:088c          7402                           JZ 0x1068:0890
1068:088e          e2e6                           LOOP 0x1068:0876
LAB_1068_0890:
1068:0890          c3                             RET
FUN_1068_0891:
1068:0891          fc                             CLD
1068:0892          8bdc                           MOV BX,SP
1068:0894          8cda                           MOV DX,DS
1068:0896          36c47f08                       LES DI,SS:[BX + 0x8]
1068:089a          36c57704                       LDS SI,SS:[BX + 0x4]
1068:089e          ac                             LODSB SI
1068:089f          aa                             STOSB ES:DI
1068:08a0          8ac8                           MOV CL,AL
1068:08a2          32ed                           XOR CH,CH
1068:08a4          f3a4                           MOVSB.REP ES:DI,SI
1068:08a6          8eda                           MOV DX,DS
1068:08a8          ca0400                         RETF 0x4
FUN_1068_08ab:
1068:08ab          fc                             CLD
1068:08ac          8bdc                           MOV BX,SP
1068:08ae          8cda                           MOV DX,DS
1068:08b0          36c5770a                       LDS SI,SS:[BX + 0xa]
1068:08b4          36c47f06                       LES DI,SS:[BX + 0x6]
1068:08b8          368b4f04                       MOV CX,word ptr SS:[BX + 0x4]
1068:08bc          ac                             LODSB SI
1068:08bd          3ac1                           CMP AL,CL
1068:08bf          7602                           JBE 0x1068:08c3
1068:08c1          8ac1                           MOV AL,CL
LAB_1068_08c3:
1068:08c3          aa                             STOSB ES:DI
1068:08c4          8ac8                           MOV CL,AL
1068:08c6          32ed                           XOR CH,CH
1068:08c8          f3a4                           MOVSB.REP ES:DI,SI
1068:08ca          8eda                           MOV DX,DS
1068:08cc          ca0a00                         RETF 0xa
FUN_1068_08cf:
1068:08cf          fc                             CLD
1068:08d0          8bdc                           MOV BX,SP
1068:08d2          8cda                           MOV DX,DS
1068:08d4          36c47f0c                       LES DI,SS:[BX + 0xc]
1068:08d8          36c57708                       LDS SI,SS:[BX + 0x8]
1068:08dc          8a04                           MOV AL,byte ptr [SI]
1068:08de          32e4                           XOR AH,AH
1068:08e0          368b4f06                       MOV CX,word ptr SS:[BX + 0x6]
1068:08e4          0bc9                           OR CX,CX
1068:08e6          7f03                           JG 0x1068:08eb
1068:08e8          b90100                         MOV CX,0x1
LAB_1068_08eb:
1068:08eb          03f1                           ADD SI,CX
1068:08ed          2bc1                           SUB AX,CX
1068:08ef          7213                           JC 0x1068:0904
1068:08f1          40                             INC AX
1068:08f2          368b4f04                       MOV CX,word ptr SS:[BX + 0x4]
1068:08f6          0bc9                           OR CX,CX
1068:08f8          7d02                           JGE 0x1068:08fc
1068:08fa          33c9                           XOR CX,CX
LAB_1068_08fc:
1068:08fc          3bc1                           CMP AX,CX
1068:08fe          7606                           JBE 0x1068:0906
1068:0900          8bc1                           MOV AX,CX
1068:0902          eb02                           JMP 0x1068:0906
LAB_1068_0904:
1068:0904          33c0                           XOR AX,AX
LAB_1068_0906:
1068:0906          aa                             STOSB ES:DI
1068:0907          8bc8                           MOV CX,AX
1068:0909          f3a4                           MOVSB.REP ES:DI,SI
1068:090b          8eda                           MOV DX,DS
1068:090d          ca0800                         RETF 0x8
FUN_1068_0910:
1068:0910          fc                             CLD
1068:0911          8bdc                           MOV BX,SP
1068:0913          8cda                           MOV DX,DS
1068:0915          36c47f08                       LES DI,SS:[BX + 0x8]
1068:0919          36c57704                       LDS SI,SS:[BX + 0x4]
1068:091d          268a0d                         MOV CL,byte ptr ES:[DI]
1068:0920          32ed                           XOR CH,CH
1068:0922          ac                             LODSB SI
1068:0923          260005                         ADD byte ptr ES:[DI],AL
1068:0926          7308                           JNC 0x1068:0930
1068:0928          26c605ff                       MOV byte ptr ES:[DI],0xff
1068:092c          8ac1                           MOV AL,CL
1068:092e          f6d0                           NOT AL
LAB_1068_0930:
1068:0930          03f9                           ADD DI,CX
1068:0932          47                             INC DI
1068:0933          8ac8                           MOV CL,AL
1068:0935          f3a4                           MOVSB.REP ES:DI,SI
1068:0937          8eda                           MOV DX,DS
1068:0939          ca0400                         RETF 0x4
FUN_1068_093c:
1068:093c          55                             PUSH BP
1068:093d          8bec                           MOV BP,SP
1068:093f          1e                             PUSH DS
1068:0940          c5760a                         LDS SI,[BP + 0xa]
1068:0943          fc                             CLD
1068:0944          ac                             LODSB SI
1068:0945          0ac0                           OR AL,AL
1068:0947          742c                           JZ 0x1068:0975
1068:0949          8ad0                           MOV DL,AL
1068:094b          32f6                           XOR DH,DH
1068:094d          c47e06                         LES DI,[BP + 0x6]
1068:0950          268a0d                         MOV CL,byte ptr ES:[DI]
1068:0953          32ed                           XOR CH,CH
1068:0955          2bca                           SUB CX,DX
1068:0957          721c                           JC 0x1068:0975
1068:0959          41                             INC CX
1068:095a          47                             INC DI
LAB_1068_095b:
1068:095b          ac                             LODSB SI
1068:095c          f2ae                           SCASB.REPNE ES:DI
1068:095e          7515                           JNZ 0x1068:0975
1068:0960          8bc7                           MOV AX,DI
1068:0962          8bd9                           MOV BX,CX
1068:0964          8bca                           MOV CX,DX
1068:0966          49                             DEC CX
1068:0967          f3a6                           CMPSB.REPE ES:DI,SI
1068:0969          740e                           JZ 0x1068:0979
1068:096b          8bf8                           MOV DI,AX
1068:096d          8bcb                           MOV CX,BX
1068:096f          8b760a                         MOV SI,word ptr [BP + 0xa]
1068:0972          46                             INC SI
1068:0973          ebe6                           JMP 0x1068:095b
LAB_1068_0975:
1068:0975          33c0                           XOR AX,AX
1068:0977          eb04                           JMP 0x1068:097d
LAB_1068_0979:
1068:0979          48                             DEC AX
1068:097a          2b4606                         SUB AX,word ptr [BP + 0x6]
LAB_1068_097d:
1068:097d          1f                             POP DS
1068:097e          5d                             POP BP
1068:097f          ca0800                         RETF 0x8
FUN_1068_0982:
1068:0982          fc                             CLD
1068:0983          8bdc                           MOV BX,SP
1068:0985          8cda                           MOV DX,DS
1068:0987          36c57708                       LDS SI,SS:[BX + 0x8]
1068:098b          36c47f04                       LES DI,SS:[BX + 0x4]
1068:098f          ac                             LODSB SI
1068:0990          268a25                         MOV AH,byte ptr ES:[DI]
1068:0993          47                             INC DI
1068:0994          8ac8                           MOV CL,AL
1068:0996          3acc                           CMP CL,AH
1068:0998          7602                           JBE 0x1068:099c
1068:099a          8acc                           MOV CL,AH
LAB_1068_099c:
1068:099c          0ac9                           OR CL,CL
1068:099e          7406                           JZ 0x1068:09a6
1068:09a0          32ed                           XOR CH,CH
1068:09a2          f3a6                           CMPSB.REPE ES:DI,SI
1068:09a4          7502                           JNZ 0x1068:09a8
LAB_1068_09a6:
1068:09a6          3ac4                           CMP AL,AH
LAB_1068_09a8:
1068:09a8          8eda                           MOV DX,DS
1068:09aa          ca0800                         RETF 0x8
FUN_1068_09ad:
1068:09ad          fc                             CLD
1068:09ae          8bdc                           MOV BX,SP
1068:09b0          36c47f06                       LES DI,SS:[BX + 0x6]
1068:09b4          b001                           MOV AL,0x1
1068:09b6          aa                             STOSB ES:DI
1068:09b7          368a4704                       MOV AL,byte ptr SS:[BX + 0x4]
1068:09bb          aa                             STOSB ES:DI
1068:09bc          ca0200                         RETF 0x2
FUN_1068_09da:
1068:09da          55                             PUSH BP
1068:09db          8bec                           MOV BP,SP
1068:09dd          81ec0002                       SUB SP,0x200
1068:09e1          837e0601                       CMP word ptr [BP + 0x6],0x1
1068:09e5          7d05                           JGE 0x1068:09ec
1068:09e7          c746060100                     MOV word ptr [BP + 0x6],0x1
LAB_1068_09ec:
1068:09ec          8dbe00ff                       LEA DI,[BP + 0xff00]
1068:09f0          16                             PUSH SS
1068:09f1          57                             PUSH DI
1068:09f2          c47e0a                         LES DI,[BP + 0xa]
1068:09f5          06                             PUSH ES
1068:09f6          57                             PUSH DI
1068:09f7          b80100                         MOV AX,0x1
1068:09fa          50                             PUSH AX
1068:09fb          8b4606                         MOV AX,word ptr [BP + 0x6]
1068:09fe          48                             DEC AX
1068:09ff          50                             PUSH AX
1068:0a00          0e                             PUSH CS
1068:0a01          e8cbfe                         CALL 0x1068:08cf
1068:0a04          c47e0e                         LES DI,[BP + 0xe]
1068:0a07          06                             PUSH ES
1068:0a08          57                             PUSH DI
1068:0a09          0e                             PUSH CS
1068:0a0a          e803ff                         CALL 0x1068:0910
1068:0a0d          8dbe00fe                       LEA DI,[BP + 0xfe00]
1068:0a11          16                             PUSH SS
1068:0a12          57                             PUSH DI
1068:0a13          c47e0a                         LES DI,[BP + 0xa]
1068:0a16          06                             PUSH ES
1068:0a17          57                             PUSH DI
1068:0a18          ff7606                         PUSH word ptr [BP + 0x6]
1068:0a1b          b8ff00                         MOV AX,0xff
1068:0a1e          50                             PUSH AX
1068:0a1f          0e                             PUSH CS
1068:0a20          e8acfe                         CALL 0x1068:08cf
1068:0a23          0e                             PUSH CS
1068:0a24          e8e9fe                         CALL 0x1068:0910
1068:0a27          c47e0a                         LES DI,[BP + 0xa]
1068:0a2a          06                             PUSH ES
1068:0a2b          57                             PUSH DI
1068:0a2c          ff7608                         PUSH word ptr [BP + 0x8]
1068:0a2f          0e                             PUSH CS
1068:0a30          e878fe                         CALL 0x1068:08ab
1068:0a33          8be5                           MOV SP,BP
1068:0a35          5d                             POP BP
1068:0a36          ca0c00                         RETF 0xc
FUN_1068_0a39:
1068:0a39          55                             PUSH BP
1068:0a3a          8bec                           MOV BP,SP
1068:0a3c          81ec0002                       SUB SP,0x200
1068:0a40          837e0600                       CMP word ptr [BP + 0x6],0x0
1068:0a44          7e5c                           JLE 0x1068:0aa2
1068:0a46          837e0800                       CMP word ptr [BP + 0x8],0x0
1068:0a4a          7e56                           JLE 0x1068:0aa2
1068:0a4c          817e08ff00                     CMP word ptr [BP + 0x8],0xff
1068:0a51          7f4f                           JG 0x1068:0aa2
1068:0a53          817e06ff00                     CMP word ptr [BP + 0x6],0xff
1068:0a58          7e05                           JLE 0x1068:0a5f
1068:0a5a          c74606ff00                     MOV word ptr [BP + 0x6],0xff
LAB_1068_0a5f:
1068:0a5f          8dbe00ff                       LEA DI,[BP + 0xff00]
1068:0a63          16                             PUSH SS
1068:0a64          57                             PUSH DI
1068:0a65          c47e0a                         LES DI,[BP + 0xa]
1068:0a68          06                             PUSH ES
1068:0a69          57                             PUSH DI
1068:0a6a          b80100                         MOV AX,0x1
1068:0a6d          50                             PUSH AX
1068:0a6e          8b4608                         MOV AX,word ptr [BP + 0x8]
1068:0a71          48                             DEC AX
1068:0a72          50                             PUSH AX
1068:0a73          0e                             PUSH CS
1068:0a74          e858fe                         CALL 0x1068:08cf
1068:0a77          8dbe00fe                       LEA DI,[BP + 0xfe00]
1068:0a7b          16                             PUSH SS
1068:0a7c          57                             PUSH DI
1068:0a7d          c47e0a                         LES DI,[BP + 0xa]
1068:0a80          06                             PUSH ES
1068:0a81          57                             PUSH DI
1068:0a82          8b4608                         MOV AX,word ptr [BP + 0x8]
1068:0a85          034606                         ADD AX,word ptr [BP + 0x6]
1068:0a88          50                             PUSH AX
1068:0a89          b8ff00                         MOV AX,0xff
1068:0a8c          50                             PUSH AX
1068:0a8d          0e                             PUSH CS
1068:0a8e          e83efe                         CALL 0x1068:08cf
1068:0a91          0e                             PUSH CS
1068:0a92          e87bfe                         CALL 0x1068:0910
1068:0a95          c47e0a                         LES DI,[BP + 0xa]
1068:0a98          06                             PUSH ES
1068:0a99          57                             PUSH DI
1068:0a9a          b8ff00                         MOV AX,0xff
1068:0a9d          50                             PUSH AX
1068:0a9e          0e                             PUSH CS
1068:0a9f          e809fe                         CALL 0x1068:08ab
LAB_1068_0aa2:
1068:0aa2          8be5                           MOV SP,BP
1068:0aa4          5d                             POP BP
1068:0aa5          ca0800                         RETF 0x8
FUN_1068_0aa8:
1068:0aa8          8bdc                           MOV BX,SP
1068:0aaa          1e                             PUSH DS
1068:0aab          36c57f04                       LDS DI,SS:[BX + 0x4]
1068:0aaf          33c9                           XOR CX,CX
1068:0ab1          890d                           MOV word ptr [DI],CX
1068:0ab3          b8003d                         MOV AX,0x3d00
1068:0ab6          817d02b1d7                     CMP word ptr [DI + 0x2],0xd7b1
1068:0abb          740d                           JZ 0x1068:0aca
1068:0abd          b002                           MOV AL,0x2
1068:0abf          ff05                           INC word ptr [DI]
1068:0ac1          817d02b3d7                     CMP word ptr [DI + 0x2],0xd7b3
1068:0ac6          7402                           JZ 0x1068:0aca
1068:0ac8          b43c                           MOV AH,0x3c
LAB_1068_0aca:
1068:0aca          807d3000                       CMP byte ptr [DI + 0x30],0x0
1068:0ace          7409                           JZ 0x1068:0ad9
1068:0ad0          8d5530                         LEA DX,[DI + 0x30]
1068:0ad3          cd21                           INT 0x21
1068:0ad5          725a                           JC 0x1068:0b31
1068:0ad7          8905                           MOV word ptr [DI],AX
LAB_1068_0ad9:
1068:0ad9          b8d805                         MOV AX,0x5d8
1068:0adc          ba6810                         MOV DX,0x1068
1068:0adf          33c9                           XOR CX,CX
1068:0ae1          33db                           XOR BX,BX
1068:0ae3          817d02b1d7                     CMP word ptr [DI + 0x2],0xd7b1
1068:0ae8          742f                           JZ 0x1068:0b19
1068:0aea          8b1d                           MOV BX,word ptr [DI]
1068:0aec          b80044                         MOV AX,0x4400
1068:0aef          cd21                           INT 0x21
1068:0af1          f6c280                         TEST DL,0x80
1068:0af4          b82d06                         MOV AX,0x62d
1068:0af7          ba6810                         MOV DX,0x1068
1068:0afa          8bc8                           MOV CX,AX
1068:0afc          8bda                           MOV BX,DX
1068:0afe          7514                           JNZ 0x1068:0b14
1068:0b00          817d02b3d7                     CMP word ptr [DI + 0x2],0xd7b3
1068:0b05          7503                           JNZ 0x1068:0b0a
1068:0b07          e82b00                         CALL 0x1068:0b35
LAB_1068_0b0a:
1068:0b0a          b80806                         MOV AX,0x608
1068:0b0d          ba6810                         MOV DX,0x1068
1068:0b10          33c9                           XOR CX,CX
1068:0b12          33db                           XOR BX,BX
LAB_1068_0b14:
1068:0b14          c74502b2d7                     MOV word ptr [DI + 0x2],0xd7b2
LAB_1068_0b19:
1068:0b19          894514                         MOV word ptr [DI + 0x14],AX
1068:0b1c          895516                         MOV word ptr [DI + 0x16],DX
1068:0b1f          894d18                         MOV word ptr [DI + 0x18],CX
1068:0b22          895d1a                         MOV word ptr [DI + 0x1a],BX
1068:0b25          c7451c4d06                     MOV word ptr [DI + 0x1c],0x64d
1068:0b2a          c7451e6810                     MOV word ptr [DI + 0x1e],0x1068
1068:0b2f          33c0                           XOR AX,AX
LAB_1068_0b31:
1068:0b31          1f                             POP DS
1068:0b32          ca0400                         RETF 0x4
FUN_1068_0b35:
1068:0b35          33d2                           XOR DX,DX
1068:0b37          33c9                           XOR CX,CX
1068:0b39          8b1d                           MOV BX,word ptr [DI]
1068:0b3b          b80242                         MOV AX,0x4202
1068:0b3e          cd21                           INT 0x21
1068:0b40          2d8000                         SUB AX,0x80
1068:0b43          83da00                         SBB DX,0x0
1068:0b46          7304                           JNC 0x1068:0b4c
1068:0b48          33c0                           XOR AX,AX
1068:0b4a          33d2                           XOR DX,DX
LAB_1068_0b4c:
1068:0b4c          8bca                           MOV CX,DX
1068:0b4e          8bd0                           MOV DX,AX
1068:0b50          8b1d                           MOV BX,word ptr [DI]
1068:0b52          b80042                         MOV AX,0x4200
1068:0b55          cd21                           INT 0x21
1068:0b57          8d958000                       LEA DX,[DI + 0x80]
1068:0b5b          b98000                         MOV CX,0x80
1068:0b5e          8b1d                           MOV BX,word ptr [DI]
1068:0b60          b43f                           MOV AH,0x3f
1068:0b62          cd21                           INT 0x21
1068:0b64          7302                           JNC 0x1068:0b68
1068:0b66          33c0                           XOR AX,AX
LAB_1068_0b68:
1068:0b68          33db                           XOR BX,BX
LAB_1068_0b6a:
1068:0b6a          3bd8                           CMP BX,AX
1068:0b6c          7420                           JZ 0x1068:0b8e
1068:0b6e          80b980001a                     CMP byte ptr [BX + DI + 0x80],0x1a
1068:0b73          7403                           JZ 0x1068:0b78
1068:0b75          43                             INC BX
1068:0b76          ebf2                           JMP 0x1068:0b6a
LAB_1068_0b78:
1068:0b78          8bd3                           MOV DX,BX
1068:0b7a          2bd0                           SUB DX,AX
1068:0b7c          b9ffff                         MOV CX,0xffff
1068:0b7f          8b1d                           MOV BX,word ptr [DI]
1068:0b81          b80242                         MOV AX,0x4202
1068:0b84          cd21                           INT 0x21
1068:0b86          33c9                           XOR CX,CX
1068:0b88          8b1d                           MOV BX,word ptr [DI]
1068:0b8a          b440                           MOV AH,0x40
1068:0b8c          cd21                           INT 0x21
LAB_1068_0b8e:
1068:0b8e          c3                             RET
FUN_1068_0b8f:
1068:0b8f          8bcf                           MOV CX,DI
1068:0b91          be0a00                         MOV SI,0xa
1068:0b94          8bda                           MOV BX,DX
1068:0b96          0bdb                           OR BX,BX
1068:0b98          7911                           JNS 0x1068:0bab
1068:0b9a          f7db                           NEG BX
1068:0b9c          f7d8                           NEG AX
1068:0b9e          83db00                         SBB BX,0x0
1068:0ba1          e80700                         CALL 0x1068:0bab
1068:0ba4          4f                             DEC DI
1068:0ba5          26c6052d                       MOV byte ptr ES:[DI],0x2d
1068:0ba9          41                             INC CX
1068:0baa          c3                             RET
FUN_1068_0bab:
1068:0bab          33d2                           XOR DX,DX
1068:0bad          93                             XCHG AX,BX
1068:0bae          f7f6                           DIV SI
1068:0bb0          93                             XCHG AX,BX
1068:0bb1          f7f6                           DIV SI
1068:0bb3          80c230                         ADD DL,0x30
1068:0bb6          80fa3a                         CMP DL,0x3a
1068:0bb9          7203                           JC 0x1068:0bbe
1068:0bbb          80c207                         ADD DL,0x7
LAB_1068_0bbe:
1068:0bbe          4f                             DEC DI
1068:0bbf          268815                         MOV byte ptr ES:[DI],DL
1068:0bc2          8bd0                           MOV DX,AX
1068:0bc4          0bd3                           OR DX,BX
1068:0bc6          75e3                           JNZ 0x1068:0bab
1068:0bc8          2bcf                           SUB CX,DI
1068:0bca          c3                             RET
FUN_1068_0bcb:
1068:0bcb          33c0                           XOR AX,AX
1068:0bcd          33d2                           XOR DX,DX
1068:0bcf          33f6                           XOR SI,SI
1068:0bd1          e35d                           JCXZ 0x1068:0c30
1068:0bd3          26803d2b                       CMP byte ptr ES:[DI],0x2b
1068:0bd7          7407                           JZ 0x1068:0be0
1068:0bd9          26803d2d                       CMP byte ptr ES:[DI],0x2d
1068:0bdd          7505                           JNZ 0x1068:0be4
1068:0bdf          4e                             DEC SI
LAB_1068_0be0:
1068:0be0          47                             INC DI
1068:0be1          49                             DEC CX
1068:0be2          744c                           JZ 0x1068:0c30
LAB_1068_0be4:
1068:0be4          26803d24                       CMP byte ptr ES:[DI],0x24
1068:0be8          7448                           JZ 0x1068:0c32
LAB_1068_0bea:
1068:0bea          268a1d                         MOV BL,byte ptr ES:[DI]
1068:0bed          80eb3a                         SUB BL,0x3a
1068:0bf0          80c30a                         ADD BL,0xa
1068:0bf3          7325                           JNC 0x1068:0c1a
1068:0bf5          f6c6f0                         TEST DH,0xf0
1068:0bf8          7536                           JNZ 0x1068:0c30
1068:0bfa          53                             PUSH BX
1068:0bfb          d1e0                           SHL AX,0x1
1068:0bfd          d1d2                           RCL DX,0x1
1068:0bff          52                             PUSH DX
1068:0c00          50                             PUSH AX
1068:0c01          d1e0                           SHL AX,0x1
1068:0c03          d1d2                           RCL DX,0x1
1068:0c05          d1e0                           SHL AX,0x1
1068:0c07          d1d2                           RCL DX,0x1
1068:0c09          5b                             POP BX
1068:0c0a          03c3                           ADD AX,BX
1068:0c0c          5b                             POP BX
1068:0c0d          13d3                           ADC DX,BX
1068:0c0f          5b                             POP BX
1068:0c10          32ff                           XOR BH,BH
1068:0c12          03c3                           ADD AX,BX
1068:0c14          83d200                         ADC DX,0x0
1068:0c17          47                             INC DI
1068:0c18          e2d0                           LOOP 0x1068:0bea
LAB_1068_0c1a:
1068:0c1a          8bd8                           MOV BX,AX
1068:0c1c          0bda                           OR BX,DX
1068:0c1e          740f                           JZ 0x1068:0c2f
1068:0c20          0bf6                           OR SI,SI
1068:0c22          7907                           JNS 0x1068:0c2b
1068:0c24          f7da                           NEG DX
1068:0c26          f7d8                           NEG AX
1068:0c28          83da00                         SBB DX,0x0
LAB_1068_0c2b:
1068:0c2b          33f2                           XOR SI,DX
1068:0c2d          7801                           JS 0x1068:0c30
LAB_1068_0c2f:
1068:0c2f          c3                             RET
LAB_1068_0c30:
1068:0c30          f9                             STC
1068:0c31          c3                             RET
LAB_1068_0c32:
1068:0c32          47                             INC DI
1068:0c33          49                             DEC CX
1068:0c34          74fa                           JZ 0x1068:0c30
LAB_1068_0c36:
1068:0c36          268a1d                         MOV BL,byte ptr ES:[DI]
1068:0c39          80fb61                         CMP BL,0x61
1068:0c3c          7203                           JC 0x1068:0c41
1068:0c3e          80eb20                         SUB BL,0x20
LAB_1068_0c41:
1068:0c41          80eb3a                         SUB BL,0x3a
1068:0c44          80c30a                         ADD BL,0xa
1068:0c47          720b                           JC 0x1068:0c54
1068:0c49          80eb17                         SUB BL,0x17
1068:0c4c          80c306                         ADD BL,0x6
1068:0c4f          73c9                           JNC 0x1068:0c1a
1068:0c51          80c30a                         ADD BL,0xa
LAB_1068_0c54:
1068:0c54          b704                           MOV BH,0x4
LAB_1068_0c56:
1068:0c56          d1e0                           SHL AX,0x1
1068:0c58          d1d2                           RCL DX,0x1
1068:0c5a          72d4                           JC 0x1068:0c30
1068:0c5c          fecf                           DEC BH
1068:0c5e          75f6                           JNZ 0x1068:0c56
1068:0c60          0ac3                           OR AL,BL
1068:0c62          47                             INC DI
1068:0c63          e2d1                           LOOP 0x1068:0c36
1068:0c65          0bf6                           OR SI,SI
1068:0c67          7907                           JNS 0x1068:0c70
1068:0c69          f7da                           NEG DX
1068:0c6b          f7d8                           NEG AX
1068:0c6d          83da00                         SBB DX,0x0
LAB_1068_0c70:
1068:0c70          f8                             CLC
1068:0c71          c3                             RET
FUN_1068_0c72:
1068:0c72          55                             PUSH BP
1068:0c73          8bec                           MOV BP,SP
1068:0c75          83ec20                         SUB SP,0x20
1068:0c78          8b460e                         MOV AX,word ptr [BP + 0xe]
1068:0c7b          8b5610                         MOV DX,word ptr [BP + 0x10]
1068:0c7e          8d7e00                         LEA DI,[BP + 0x0]
1068:0c81          16                             PUSH SS
1068:0c82          07                             POP ES
1068:0c83          e809ff                         CALL 0x1068:0b8f
1068:0c86          1e                             PUSH DS
1068:0c87          8bf7                           MOV SI,DI
1068:0c89          16                             PUSH SS
1068:0c8a          1f                             POP DS
1068:0c8b          c47e08                         LES DI,[BP + 0x8]
1068:0c8e          8b5606                         MOV DX,word ptr [BP + 0x6]
1068:0c91          8b460c                         MOV AX,word ptr [BP + 0xc]
1068:0c94          3bc2                           CMP AX,DX
1068:0c96          7e02                           JLE 0x1068:0c9a
1068:0c98          8bc2                           MOV AX,DX
LAB_1068_0c9a:
1068:0c9a          3bca                           CMP CX,DX
1068:0c9c          7e02                           JLE 0x1068:0ca0
1068:0c9e          8bca                           MOV CX,DX
LAB_1068_0ca0:
1068:0ca0          3bc1                           CMP AX,CX
1068:0ca2          7d02                           JGE 0x1068:0ca6
1068:0ca4          8bc1                           MOV AX,CX
LAB_1068_0ca6:
1068:0ca6          fc                             CLD
1068:0ca7          aa                             STOSB ES:DI
1068:0ca8          2bc1                           SUB AX,CX
1068:0caa          7408                           JZ 0x1068:0cb4
1068:0cac          51                             PUSH CX
1068:0cad          8bc8                           MOV CX,AX
1068:0caf          b020                           MOV AL,0x20
1068:0cb1          f3aa                           STOSB.REP ES:DI
1068:0cb3          59                             POP CX
LAB_1068_0cb4:
1068:0cb4          f3a4                           MOVSB.REP ES:DI,SI
1068:0cb6          1f                             POP DS
1068:0cb7          8be5                           MOV SP,BP
1068:0cb9          5d                             POP BP
1068:0cba          ca0c00                         RETF 0xc
FUN_1068_0cbd:
1068:0cbd          55                             PUSH BP
1068:0cbe          8bec                           MOV BP,SP
1068:0cc0          c47e0a                         LES DI,[BP + 0xa]
1068:0cc3          268a0d                         MOV CL,byte ptr ES:[DI]
1068:0cc6          32ed                           XOR CH,CH
1068:0cc8          47                             INC DI
1068:0cc9          e309                           JCXZ 0x1068:0cd4
LAB_1068_0ccb:
1068:0ccb          26803d20                       CMP byte ptr ES:[DI],0x20
1068:0ccf          7503                           JNZ 0x1068:0cd4
1068:0cd1          47                             INC DI
1068:0cd2          e2f7                           LOOP 0x1068:0ccb
LAB_1068_0cd4:
1068:0cd4          e8f4fe                         CALL 0x1068:0bcb
1068:0cd7          7202                           JC 0x1068:0cdb
1068:0cd9          e309                           JCXZ 0x1068:0ce4
LAB_1068_0cdb:
1068:0cdb          8bcf                           MOV CX,DI
1068:0cdd          2b4e0a                         SUB CX,word ptr [BP + 0xa]
1068:0ce0          33c0                           XOR AX,AX
1068:0ce2          33d2                           XOR DX,DX
LAB_1068_0ce4:
1068:0ce4          c47e06                         LES DI,[BP + 0x6]
1068:0ce7          26890d                         MOV word ptr ES:[DI],CX
1068:0cea          5d                             POP BP
1068:0ceb          ca0800                         RETF 0x8
FUN_1068_0cee:
1068:0cee          8bdc                           MOV BX,SP
1068:0cf0          8cda                           MOV DX,DS
1068:0cf2          36c5770a                       LDS SI,SS:[BX + 0xa]
1068:0cf6          36c47f06                       LES DI,SS:[BX + 0x6]
1068:0cfa          368b4f04                       MOV CX,word ptr SS:[BX + 0x4]
1068:0cfe          fc                             CLD
1068:0cff          3bf7                           CMP SI,DI
1068:0d01          7307                           JNC 0x1068:0d0a
1068:0d03          03f1                           ADD SI,CX
1068:0d05          03f9                           ADD DI,CX
1068:0d07          4e                             DEC SI
1068:0d08          4f                             DEC DI
1068:0d09          fd                             STD
LAB_1068_0d0a:
1068:0d0a          f3a4                           MOVSB.REP ES:DI,SI
1068:0d0c          fc                             CLD
1068:0d0d          8eda                           MOV DX,DS
1068:0d0f          ca0a00                         RETF 0xa
FUN_1068_0d12:
1068:0d12          8bdc                           MOV BX,SP
1068:0d14          36c47f08                       LES DI,SS:[BX + 0x8]
1068:0d18          368b4f06                       MOV CX,word ptr SS:[BX + 0x6]
1068:0d1c          368a4704                       MOV AL,byte ptr SS:[BX + 0x4]
1068:0d20          fc                             CLD
1068:0d21          f3aa                           STOSB.REP ES:DI
1068:0d23          ca0800                         RETF 0x8
FUN_1068_0d26:
1068:0d26          8bdc                           MOV BX,SP
1068:0d28          368a4704                       MOV AL,byte ptr SS:[BX + 0x4]
1068:0d2c          3c61                           CMP AL,0x61
1068:0d2e          7206                           JC 0x1068:0d36
1068:0d30          3c7a                           CMP AL,0x7a
1068:0d32          7702                           JA 0x1068:0d36
1068:0d34          2c20                           SUB AL,0x20
LAB_1068_0d36:
1068:0d36          ca0200                         RETF 0x2
FUN_1068_0d3d:
1068:0d3d          e80200                         CALL 0x1068:0d42
1068:0d40          ff2d                           JMPF [DI]
FUN_1068_0d42:
1068:0d42          8b5d04                         MOV BX,word ptr [DI + 0x4]
1068:0d45          3b4702                         CMP AX,word ptr [BX + 0x2]
1068:0d48          7504                           JNZ 0x1068:0d4e
1068:0d4a          8b7f04                         MOV DI,word ptr [BX + 0x4]
1068:0d4d          c3                             RET
LAB_1068_0d4e:
1068:0d4e          8cde                           MOV SI,DS
1068:0d50          8ec6                           MOV SI,ES
1068:0d52          8bf3                           MOV SI,BX
1068:0d54          fc                             CLD
LAB_1068_0d55:
1068:0d55          8b4f06                         MOV CX,word ptr [BX + 0x6]
1068:0d58          8bd1                           MOV DX,CX
1068:0d5a          8d7f08                         LEA DI,[BX + 0x8]
1068:0d5d          f2af                           SCASW.REPNE ES:DI
1068:0d5f          740e                           JZ 0x1068:0d6f
1068:0d61          268b1f                         MOV BX,word ptr ES:[BX]
1068:0d64          0bdb                           OR BX,BX
1068:0d66          75ed                           JNZ 0x1068:0d55
1068:0d68          58                             POP AX
1068:0d69          b8d200                         MOV AX,0xd2
1068:0d6c          e9eef2                         JMP 0x1068:005d
LAB_1068_0d6f:
1068:0d6f          4a                             DEC DX
1068:0d70          d1e2                           SHL DX,0x1
1068:0d72          2bd1                           SUB DX,CX
1068:0d74          d1e2                           SHL DX,0x1
1068:0d76          03fa                           ADD DI,DX
1068:0d78          894402                         MOV word ptr [SI + 0x2],AX
1068:0d7b          897c04                         MOV word ptr [SI + 0x4],DI
1068:0d7e          c3                             RET
