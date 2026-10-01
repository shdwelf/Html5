/* Ghidra 12.1.4
 * Static decompiler output — the input was never executed
 * Program: JCreator.exe
 * SHA-256: faac1dc4a1e0a3fd74d66516c81215d9b71cb9a54530d1fe5ae85664730ff33d
 *
 * Selection is driven by the JDK probe: functions that reference
 * registry, tool-name, flag and process-creation strings first.
 */

/* FUN_0044bd80 @ 0044bd80
 * references registry string "javahome" at 00681b60 */

int * FUN_0044bd80(int param_1)

{
  undefined4 *puVar1;
  int *piVar2;
  char *pcVar3;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f17d2;
  local_c = ExceptionList;
  if (param_1 == 3) {
    ExceptionList = &local_c;
    param_1 = FUN_005b3e8d(1000);
    piVar2 = (int *)0x0;
    local_4 = 0;
    if (param_1 != 0) {
      piVar2 = (int *)FUN_0044bc20();
    }
    local_4 = 0xffffffff;
    puVar1 = (undefined4 *)FUN_0044f480(&param_1);
    local_4 = 1;
    FUN_005b42d5(*puVar1);
    local_4 = 0xffffffff;
    FUN_005b414c();
    FUN_004b24a0(s____JavaHome__bin_jdb_exe__00681b60);
    pcVar3 = s__classpath____ClassPath_____Java_00681b38;
    (**(code **)(*piVar2 + 0x2c))();
    (**(code **)(*piVar2 + 0x50))(s_sun_applet_AppletViewer___FileNa_00681b14);
    piVar2[7] = 0x10402;
    piVar2[0x94] = 0x1134;
    ExceptionList = pcVar3;
    return piVar2;
  }
  ExceptionList = &local_c;
  piVar2 = (int *)FUN_0044f4a0(param_1);
  ExceptionList = local_c;
  return piVar2;
}



/* FUN_0044dc60 @ 0044dc60
 * references registry string "javahome" at 00681d88 */

undefined4 FUN_0044dc60(undefined4 param_1)

{
  char cVar1;
  int iVar2;
  undefined4 uVar3;
  int local_64;
  undefined *local_60;
  undefined4 local_5c;
  undefined4 local_58;
  undefined1 local_54 [4];
  undefined **local_50 [2];
  undefined4 local_48;
  undefined4 local_44;
  undefined *local_40;
  CStdioFile local_3c [48];
  void *local_c;
  undefined1 *puStack_8;
  int local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f1c7f;
  local_c = ExceptionList;
  local_58 = 0;
  ExceptionList = &local_c;
  FUN_005b41ba(&DAT_0068e158);
  local_4 = 1;
  FUN_005066e0();
  local_4._0_1_ = 2;
  FUN_005b41ba(s_Software_JavaSoft_Java_Developme_00681da4);
  local_4._0_1_ = 3;
  iVar2 = FUN_00506710(0x80000002,local_5c,0x20019);
  if (iVar2 == 0) {
    FUN_00506730();
  }
  else {
    local_60 = PTR_DAT_00684df8;
    local_4._0_1_ = 4;
    cVar1 = FUN_005067d0(s_CurrentVersion_00681d94,&local_60);
    if (cVar1 != '\0') {
      FUN_005b4564(&local_60);
      FUN_00506730();
      iVar2 = FUN_00506710(0x80000002,local_5c,0x20019);
      if (iVar2 == 0) {
        FUN_00506730();
      }
      else {
        cVar1 = FUN_005067d0(s_JavaHome_00681d88,&local_64);
        if (cVar1 != '\0') {
          FUN_00506730();
          FUN_0049339a();
          local_4._0_1_ = 5;
          if ((*(int *)(local_64 + -8) < 0x100) && (iVar2 = FUN_0049345d(local_64,0), iVar2 != 0)) {
            FUN_005b3ec1(&local_64);
            local_58 = 1;
            local_4._0_1_ = 4;
            FUN_004933d7();
            local_4._0_1_ = 3;
            goto LAB_0044df6d;
          }
          local_4._0_1_ = 4;
          FUN_004933d7();
        }
      }
    }
    local_4._0_1_ = 3;
    FUN_005b414c();
  }
  FUN_005b8e70();
  local_40 = PTR_DAT_00684df8;
  local_4._0_1_ = 7;
  local_50[0] = &PTR_LAB_00617f4c;
  local_48 = 0;
  local_44 = 0xffffffff;
  FUN_005b42d5(0);
  local_4._0_1_ = 8;
  FUN_005b92b8();
  local_4._0_1_ = 9;
  iVar2 = FUN_005b932d(s_C__autoexec_bat_00681d78,0,local_50);
  if (iVar2 != 0) {
    local_60 = PTR_DAT_00684df8;
    local_4 = CONCAT31(local_4._1_3_,10);
    iVar2 = FUN_005b9510(&local_60);
    while (iVar2 != 0) {
      iVar2 = FUN_005af316(s_JAVA_HOME_00681d6c,0);
      if ((iVar2 != -1) && (iVar2 = FUN_005af316(&DAT_00680e84,iVar2 + 1), iVar2 != -1)) {
        uVar3 = FUN_005af10e(local_54,iVar2 + 1);
        local_4._0_1_ = 0xb;
        FUN_005b4285(uVar3);
        local_4._0_1_ = 10;
        FUN_005b414c();
        FUN_0049339a();
        local_4._0_1_ = 0xc;
        if ((*(int *)(local_64 + -8) < 0x100) && (iVar2 = FUN_0049345d(local_64,0), iVar2 == 0)) {
          FUN_005b42d5(&DAT_0068e158);
        }
        local_4 = CONCAT31(local_4._1_3_,10);
        FUN_004933d7();
        break;
      }
      iVar2 = FUN_005b9510(&local_60);
    }
    FUN_005b965d();
    local_4._0_1_ = 9;
    FUN_005b414c();
  }
  FUN_005b3ec1(&local_64);
  local_58 = 1;
  local_4._0_1_ = 8;
  CStdioFile::~CStdioFile(local_3c);
  local_50[0] = &PTR_LAB_00617f4c;
  local_4._0_1_ = 0xd;
LAB_0044df6d:
  FUN_005b414c();
  local_4._0_1_ = 2;
  FUN_005b414c();
  local_4._0_1_ = 1;
  thunk_FUN_00506730();
  local_4 = (uint)local_4._1_3_ << 8;
  FUN_005b414c();
  ExceptionList = local_c;
  return param_1;
}



/* FUN_0044f4a0 @ 0044f4a0
 * references registry string "javahome" at 00681e30 */

int * FUN_0044f4a0(int param_1)

{
  undefined4 *puVar1;
  int *piVar2;
  void *local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f1f06;
  local_c = ExceptionList;
  piVar2 = (int *)0x0;
  if (param_1 == 0) {
    ExceptionList = &local_c;
    param_1 = FUN_005b3e8d(0x3e0);
    local_4 = 0;
    if (param_1 != 0) {
      piVar2 = (int *)FUN_0044f210(0);
    }
    local_4 = 0xffffffff;
    puVar1 = (undefined4 *)FUN_0044f480(&param_1);
    local_4 = 1;
    FUN_005b42d5(*puVar1);
    local_4 = 0xffffffff;
    FUN_005b414c();
    FUN_004b24a0(s____JavaHome__bin_javac_exe__00681eac);
    (**(code **)(*piVar2 + 0x2c))(s__classpath____ClassPath____d_____00681e70);
    piVar2[7] = 0x412;
    piVar2[0x94] = 0x1130;
    ExceptionList = local_10;
    return piVar2;
  }
  if (param_1 == 1) {
    ExceptionList = &local_c;
    param_1 = FUN_005b3e8d(0x3e0);
    local_4 = 2;
    if (param_1 != 0) {
      piVar2 = (int *)FUN_0044f210(1);
    }
    local_4 = 0xffffffff;
    puVar1 = (undefined4 *)FUN_0044f480(&param_1);
    local_4 = 3;
    FUN_005b42d5(*puVar1);
    local_4 = 0xffffffff;
    FUN_005b414c();
    FUN_004b24a0(s____JavaHome__bin_java_exe__00681e54);
    (**(code **)(*piVar2 + 0x2c))(s__classpath____ClassPath_____Java_00681b38);
    piVar2[7] = 2;
  }
  else {
    if (param_1 != 2) {
      return (int *)0x0;
    }
    ExceptionList = &local_c;
    param_1 = FUN_005b3e8d(0x3e0);
    local_4 = 4;
    if (param_1 != 0) {
      piVar2 = (int *)FUN_0044f210(2);
    }
    local_4 = 0xffffffff;
    puVar1 = (undefined4 *)FUN_0044f480(&local_10);
    local_4 = 5;
    FUN_005b42d5(*puVar1);
    local_4 = 0xffffffff;
    FUN_005b414c();
    FUN_004b24a0(s____JavaHome__bin_appletviewer_ex_00681e30);
    (**(code **)(*piVar2 + 0x2c))(s___FileName__00681e24);
    piVar2[7] = 0x8002;
  }
  piVar2[0x94] = 0x1131;
  ExceptionList = local_c;
  return piVar2;
}



/* FUN_00464900 @ 00464900
 * references registry string "javasoft" at 00682994 */

undefined4 __fastcall FUN_00464900(int param_1)

{
  undefined4 uVar1;
  char *pcStack_24;
  void *pvStack_18;
  undefined1 local_14 [4];
  undefined4 uStack_10;
  void *pvStack_c;
  undefined1 *puStack_8;
  undefined4 uStack_4;
  
  uStack_4 = 0xffffffff;
  puStack_8 = &LAB_005f58c8;
  pvStack_c = ExceptionList;
  pcStack_24 = (char *)0x464921;
  ExceptionList = &pvStack_c;
  FUN_005b4fa9();
  pcStack_24 = s_http___www_javasoft_com_006829b4;
  FUN_004b2a00();
  pcStack_24 = (char *)0x0;
  (**(code **)(*(int *)(param_1 + 0xa4) + 0xdc))(local_14,0);
  FUN_004b6840(s_Visit_the_homepage_of_JavaSoft_00682994);
  uVar1 = FUN_0044dc60(&pcStack_24);
  uStack_10 = 0;
  FUN_005b4285(uVar1);
  uStack_10 = 0xffffffff;
  FUN_005b414c();
  FUN_005b8be9(*(undefined4 *)(param_1 + 100));
  ExceptionList = pvStack_18;
  return 1;
}



/* FUN_00479a70 @ 00479a70
 * references registry string "javahome" at 00683750 */

void __fastcall FUN_00479a70(int param_1)

{
  int iVar1;
  int iVar2;
  int local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f9128;
  local_c = ExceptionList;
  ExceptionList = &local_c;
  local_10 = param_1;
  iVar1 = FUN_00442940(s_Create_Jar_File_00683740,s____JavaHome__bin_jar_exe__00683750,
                       s_cvf___PrjName__jar___0068376c,s____OutputPath___00681980,0x4400,0,0);
  if (iVar1 != 0) {
    iVar2 = FUN_00474ba0(iVar1);
    if (iVar2 == 0) {
      FUN_00442ba0(iVar1);
      FUN_005c137d(s_Error___Insertion_aborted__0068365c,0,0);
      ExceptionList = local_c;
      return;
    }
    FUN_005b41ba(*(undefined4 *)(iVar1 + 4));
    local_4 = 0;
    (**(code **)(*(int *)(param_1 + 100) + 0xb8))(&local_10,iVar1,0xffffffff);
    local_4 = 0xffffffff;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_00479b40 @ 00479b40
 * references registry string "javahome" at 00683798 */

void __fastcall FUN_00479b40(int param_1)

{
  int iVar1;
  int iVar2;
  int local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f9148;
  local_c = ExceptionList;
  ExceptionList = &local_c;
  local_10 = param_1;
  iVar1 = FUN_00442940(s_Create_JNI_Header_00683784,s____JavaHome__bin_javah_exe__00683798,
                       s__classpath____ClassPath____d_____006837b4,s____OutputPath___00681980,0x4400
                       ,0,0);
  if (iVar1 != 0) {
    iVar2 = FUN_00474ba0(iVar1);
    if (iVar2 == 0) {
      FUN_00442ba0(iVar1);
      FUN_005c137d(s_Error___Insertion_aborted__0068365c,0,0);
      ExceptionList = local_c;
      return;
    }
    FUN_005b41ba(*(undefined4 *)(iVar1 + 4));
    local_4 = 0;
    (**(code **)(*(int *)(param_1 + 100) + 0xb8))(&local_10,iVar1,0xffffffff);
    local_4 = 0xffffffff;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_00479c10 @ 00479c10
 * references registry string "javahome" at 00683804 */

void __fastcall FUN_00479c10(int param_1)

{
  int iVar1;
  int iVar2;
  int local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f9168;
  local_c = ExceptionList;
  ExceptionList = &local_c;
  local_10 = param_1;
  iVar1 = FUN_00442940(s_RMI_Compiler_006837f4,s___JavaHome__bin_rmic_exe_00683804,
                       s__v1_2__classpath____ClassPath_____00683820,s____OutputPath___00681980,
                       0x4400,0,0);
  if (iVar1 != 0) {
    iVar2 = FUN_00474ba0(iVar1);
    if (iVar2 == 0) {
      FUN_00442ba0(iVar1);
      FUN_005c137d(s_Error___Insertion_aborted__0068365c,0,0);
      ExceptionList = local_c;
      return;
    }
    FUN_005b41ba(*(undefined4 *)(iVar1 + 4));
    local_4 = 0;
    (**(code **)(*(int *)(param_1 + 100) + 0xb8))(&local_10,iVar1,0xffffffff);
    local_4 = 0xffffffff;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_0048fa40 @ 0048fa40
 * references registry string "javahome" at 00684b50 */

void FUN_0048fa40(void)

{
  FUN_0048f3e0(s___JavaHome__00684b50,s___JavaHome__00684b50);
  return;
}



/* FUN_0044c2e0 @ 0044c2e0
 * references tools string "javadoc" at 00681bc0 */

undefined4 FUN_0044c2e0(undefined ****param_1)

{
  int iVar1;
  undefined4 *puVar2;
  int iVar3;
  undefined ****ppppuStack_64;
  undefined ****local_50;
  undefined4 local_4c;
  undefined ****local_48;
  undefined ****local_44;
  undefined1 local_40 [4];
  int local_3c;
  undefined ****ppppuStack_34;
  undefined ****local_30;
  undefined1 *puStack_2c;
  int local_28;
  void *local_c;
  undefined1 *puStack_8;
  int local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f1980;
  local_c = ExceptionList;
  ppppuStack_64 = (undefined ****)0x44c308;
  ExceptionList = &local_c;
  FUN_00455900();
  ppppuStack_64 = (undefined ****)0x44c30f;
  FUN_00455920();
  ppppuStack_64 = param_1;
  FUN_005b41ba();
  local_4 = 0;
  if (0 < (int)local_50[-2]) {
    if (*(char *)((int)local_50[-2] + -1 + (int)local_50) != '\\') {
      ppppuStack_64 = (undefined ****)&DAT_0067fabc;
      FUN_005b4528();
    }
    ppppuStack_64 = (undefined ****)&local_50;
    FUN_005b3ec1();
    ppppuStack_64 = (undefined ****)s_bin_java_exe_00681c4c;
    local_4._0_1_ = 1;
    FUN_005b4528();
    ppppuStack_64 = (undefined ****)0x44c373;
    FUN_0049339a();
    local_4._0_1_ = 2;
    if (*(int *)(local_3c + -8) < 0x100) {
      ppppuStack_64 = (undefined ****)0x0;
      iVar1 = FUN_0049345d(local_3c);
      if (iVar1 != 0) {
        ppppuStack_64 = (undefined ****)&local_50;
        FUN_005b3ec1();
        ppppuStack_64 = (undefined ****)s_lib_classes__00681c3c;
        local_4._0_1_ = 3;
        FUN_005b4528();
        ppppuStack_64 = (undefined ****)&DAT_00681c38;
        puVar2 = (undefined4 *)FUN_005b43e1(&local_30,local_40);
        ppppuStack_64 = (undefined ****)0x0;
        local_4._0_1_ = 4;
        iVar1 = FUN_0049345d(*puVar2);
        local_4._0_1_ = 3;
        ppppuStack_64 = (undefined ****)0x44c3f5;
        FUN_005b414c();
        if (iVar1 == 0) {
          ppppuStack_64 = (undefined ****)&DAT_00681c34;
          puVar2 = (undefined4 *)FUN_005b43e1(&local_30,local_40);
          ppppuStack_64 = (undefined ****)0x0;
          local_4._0_1_ = 6;
          iVar1 = FUN_0049345d(*puVar2);
          local_4._0_1_ = 3;
          ppppuStack_64 = (undefined ****)0x44c466;
          FUN_005b414c();
          if (iVar1 == 0) {
            ppppuStack_64 = (undefined ****)&local_50;
            FUN_005b3ec1();
            ppppuStack_64 = (undefined ****)s_jre_lib__00681c28;
            local_4._0_1_ = 8;
            FUN_005b4528();
            ppppuStack_64 = (undefined ****)s_rt_jar_00681c20;
            puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_4c);
            ppppuStack_64 = (undefined ****)0x0;
            local_4._0_1_ = 9;
            iVar1 = FUN_0049345d(*puVar2);
            local_4._0_1_ = 8;
            ppppuStack_64 = (undefined ****)0x44c4f8;
            FUN_005b414c();
            if (iVar1 != 0) {
              ppppuStack_64 = (undefined ****)0x44c505;
              FUN_0049367d();
              ppppuStack_64 = (undefined ****)&local_48;
              FUN_0049374c();
              ppppuStack_64 = local_48;
              local_4._0_1_ = 10;
              FUN_004557e0();
              local_4._0_1_ = 8;
              ppppuStack_64 = (undefined ****)0x44c531;
              FUN_005b414c();
            }
            ppppuStack_64 = (undefined ****)s_I18n_jar_00681c14;
            puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_4c);
            ppppuStack_64 = (undefined ****)0x0;
            local_4._0_1_ = 0xb;
            iVar1 = FUN_0049345d(*puVar2);
            local_4._0_1_ = 8;
            ppppuStack_64 = (undefined ****)0x44c567;
            FUN_005b414c();
            if (iVar1 != 0) {
              ppppuStack_64 = (undefined ****)0x44c574;
              FUN_0049367d();
              ppppuStack_64 = (undefined ****)&local_48;
              FUN_0049374c();
              local_4._0_1_ = 0xc;
              ppppuStack_64 = local_48;
              FUN_004557e0();
              local_4._0_1_ = 8;
              ppppuStack_64 = (undefined ****)0x44c5a0;
              FUN_005b414c();
            }
            ppppuStack_64 = (undefined ****)&local_50;
            FUN_005b4285();
            ppppuStack_64 = (undefined ****)&DAT_00681c0c;
            FUN_005b4528();
            ppppuStack_64 = (undefined ****)s_dt_jar_00681c04;
            puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_4c);
            ppppuStack_64 = (undefined ****)0x0;
            local_4._0_1_ = 0xd;
            iVar1 = FUN_0049345d(*puVar2);
            local_4._0_1_ = 8;
            ppppuStack_64 = (undefined ****)0x44c5f2;
            FUN_005b414c();
            if (iVar1 != 0) {
              ppppuStack_64 = (undefined ****)0x44c5ff;
              FUN_0049367d();
              ppppuStack_64 = (undefined ****)&local_48;
              FUN_0049374c();
              ppppuStack_64 = local_48;
              local_4._0_1_ = 0xe;
              FUN_004557e0();
              local_4._0_1_ = 8;
              ppppuStack_64 = (undefined ****)0x44c62b;
              FUN_005b414c();
            }
            ppppuStack_64 = (undefined ****)s_tools_jar_00681bf8;
            puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_4c);
            ppppuStack_64 = (undefined ****)0x0;
            local_4._0_1_ = 0xf;
            iVar1 = FUN_0049345d(*puVar2);
            local_4._0_1_ = 8;
            ppppuStack_64 = (undefined ****)0x44c661;
            FUN_005b414c();
            if (iVar1 != 0) {
              ppppuStack_64 = (undefined ****)0x44c66e;
              FUN_0049367d();
              ppppuStack_64 = (undefined ****)&local_48;
              FUN_0049374c();
              local_4._0_1_ = 0x10;
              ppppuStack_64 = local_48;
              FUN_004557e0();
              local_4._0_1_ = 8;
              ppppuStack_64 = (undefined ****)0x44c69a;
              FUN_005b414c();
            }
            ppppuStack_64 = (undefined ****)&local_50;
            FUN_005b4285();
            ppppuStack_64 = (undefined ****)s_jre_lib_ext_____00681be8;
            FUN_005b4528();
            ppppuStack_64 = (undefined ****)0x0;
            iVar1 = FUN_0049345d(local_4c);
            while (iVar1 != 0) {
              ppppuStack_64 = (undefined ****)0x44c6d7;
              iVar1 = FUN_0049367d();
              ppppuStack_64 = (undefined ****)0x10;
              iVar3 = (**(code **)(local_28 + 0x38))();
              if (iVar3 == 0) {
                ppppuStack_64 = (undefined ****)0x44c6f7;
                iVar3 = FUN_00493644();
                if (iVar3 == 0) {
                  puStack_2c = (undefined1 *)&ppppuStack_64;
                  FUN_00493875(&ppppuStack_64);
                  FUN_004fe1e0(&local_48);
                  local_4._0_1_ = 0x11;
                  ppppuStack_64 = (undefined ****)0x44c72b;
                  FUN_005b46da();
                  ppppuStack_64 = (undefined ****)&DAT_00681c34;
                  iVar3 = FUN_0049c0ba(local_48);
                  if (iVar3 == 0) {
                    ppppuStack_64 = (undefined ****)&ppppuStack_34;
                    FUN_0049374c();
                    local_4._0_1_ = 0x12;
                    ppppuStack_64 = ppppuStack_34;
                    FUN_004557e0();
LAB_0044c7a9:
                    local_4._0_1_ = 0x11;
                    ppppuStack_64 = (undefined ****)0x44c7ae;
                    FUN_005b414c();
                  }
                  else {
                    ppppuStack_64 = (undefined ****)&DAT_00681c38;
                    iVar3 = FUN_0049c0ba(local_48);
                    if (iVar3 == 0) {
                      ppppuStack_64 = (undefined ****)&local_30;
                      FUN_0049374c();
                      local_4._0_1_ = 0x13;
                      ppppuStack_64 = local_30;
                      FUN_004557e0();
                      goto LAB_0044c7a9;
                    }
                  }
                  local_4._0_1_ = 8;
                  ppppuStack_64 = (undefined ****)0x44c7bb;
                  FUN_005b414c();
                }
              }
            }
          }
          else {
            ppppuStack_64 = (undefined ****)0x44c473;
            FUN_0049367d();
            ppppuStack_64 = (undefined ****)&local_48;
            FUN_0049374c();
            local_4._0_1_ = 7;
            ppppuStack_64 = local_48;
            FUN_004557e0();
          }
        }
        else {
          ppppuStack_64 = (undefined ****)0x44c402;
          FUN_0049367d();
          ppppuStack_64 = (undefined ****)&local_48;
          FUN_0049374c();
          ppppuStack_64 = local_48;
          local_4._0_1_ = 5;
          FUN_004557e0();
        }
        local_4._0_1_ = 3;
        ppppuStack_64 = (undefined ****)0x44c7d1;
        FUN_005b414c();
        ppppuStack_64 = (undefined ****)&local_50;
        FUN_005b3ec1();
        ppppuStack_64 = (undefined ****)0x20;
        local_4._0_1_ = 0x14;
        FUN_005b46ec((int)param_1[-2] + -1);
        ppppuStack_64 = (undefined ****)0x44c801;
        FUN_005af77f();
        ppppuStack_64 = (undefined ****)&param_1;
        ppppuStack_64 = (undefined ****)FUN_004fe3c0(&local_30);
        local_4._0_1_ = 0x15;
        FUN_005b4285();
        local_4._0_1_ = 0x14;
        ppppuStack_64 = (undefined ****)0x44c830;
        FUN_005b414c();
        ppppuStack_64 = (undefined ****)&param_1;
        FUN_005b3ec1();
        local_4._0_1_ = 0x16;
        ppppuStack_64 = (undefined ****)0x44c84c;
        FUN_005b46da();
        ppppuStack_64 = (undefined ****)&DAT_00681be4;
        iVar1 = FUN_005af308();
        if (iVar1 == 0) {
          ppppuStack_64 = (undefined ****)0x3;
          ppppuStack_64 = (undefined ****)FUN_005af10e(&local_30);
          local_4._0_1_ = 0x17;
          FUN_005b4285();
          local_4._0_1_ = 0x16;
          ppppuStack_64 = (undefined ****)0x44c88b;
          FUN_005b414c();
          ppppuStack_64 = (undefined ****)&param_1;
          ppppuStack_64 = (undefined ****)FUN_005b4455(&local_30,s_JDK_version_00681bd4);
          local_4._0_1_ = 0x18;
          FUN_005b4285();
          local_4._0_1_ = 0x16;
          ppppuStack_64 = (undefined ****)0x44c8bc;
          FUN_005b414c();
        }
        ppppuStack_64 = param_1;
        FUN_0044c0e0();
        ppppuStack_64 = local_50;
        FUN_0044c180();
        ppppuStack_64 = (undefined ****)&local_50;
        FUN_005b3ec1();
        ppppuStack_64 = (undefined ****)s_javadoc_00681bcc;
        local_4._0_1_ = 0x19;
        FUN_005b4528();
        ppppuStack_64 = (undefined ****)0x0;
        iVar1 = FUN_0049345d(local_44);
        if (iVar1 == 0) {
          ppppuStack_64 = (undefined ****)s_javadocs_00681bc0;
          puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_50);
          ppppuStack_64 = (undefined ****)0x0;
          local_4._0_1_ = 0x1a;
          iVar1 = FUN_0049345d(*puVar2);
          local_4._0_1_ = 0x19;
          ppppuStack_64 = (undefined ****)0x44c951;
          FUN_005b414c();
          if (iVar1 == 0) {
            ppppuStack_64 = (undefined ****)&PTR_DAT_00681bbc;
            puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_50);
            ppppuStack_64 = (undefined ****)0x0;
            local_4._0_1_ = 0x1c;
            iVar1 = FUN_0049345d(*puVar2);
            local_4._0_1_ = 0x19;
            ppppuStack_64 = (undefined ****)0x44c9bb;
            FUN_005b414c();
            if (iVar1 == 0) {
              ppppuStack_64 = (undefined ****)&DAT_00681bb4;
              puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_50);
              ppppuStack_64 = (undefined ****)0x0;
              local_4._0_1_ = 0x1e;
              iVar1 = FUN_0049345d(*puVar2);
              local_4._0_1_ = 0x19;
              ppppuStack_64 = (undefined ****)0x44ca22;
              FUN_005b414c();
              if (iVar1 == 0) goto LAB_0044ca56;
              ppppuStack_64 = (undefined ****)&DAT_00681bb4;
              puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_50);
              ppppuStack_64 = (undefined ****)*puVar2;
              local_4._0_1_ = 0x1f;
              FUN_00455820();
            }
            else {
              ppppuStack_64 = (undefined ****)&PTR_DAT_00681bbc;
              puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_50);
              ppppuStack_64 = (undefined ****)*puVar2;
              local_4._0_1_ = 0x1d;
              FUN_00455820();
            }
          }
          else {
            ppppuStack_64 = (undefined ****)s_javadocs_00681bc0;
            puVar2 = (undefined4 *)FUN_005b43e1(&local_30,&local_50);
            ppppuStack_64 = (undefined ****)*puVar2;
            local_4._0_1_ = 0x1b;
            FUN_00455820();
          }
          local_4._0_1_ = 0x19;
          ppppuStack_64 = (undefined ****)0x44ca56;
          FUN_005b414c();
        }
        else {
          ppppuStack_64 = local_44;
          FUN_00455820();
        }
LAB_0044ca56:
        ppppuStack_64 = local_50;
        FUN_0044cb20();
        local_4._0_1_ = 0x16;
        ppppuStack_64 = (undefined ****)0x44ca70;
        FUN_005b414c();
        local_4._0_1_ = 0x14;
        ppppuStack_64 = (undefined ****)0x44ca7e;
        FUN_005b414c();
        local_4._0_1_ = 3;
        ppppuStack_64 = (undefined ****)0x44ca8c;
        FUN_005b414c();
        local_4._0_1_ = 2;
        ppppuStack_64 = (undefined ****)0x44ca9a;
        FUN_005b414c();
        local_4._0_1_ = 1;
        ppppuStack_64 = (undefined ****)0x44caa8;
        FUN_004933d7();
        local_4 = (uint)local_4._1_3_ << 8;
        ppppuStack_64 = (undefined ****)0x44cab6;
        FUN_005b414c();
        local_4 = 0xffffffff;
        ppppuStack_64 = (undefined ****)0x44cac7;
        FUN_005b414c();
        ExceptionList = local_c;
        return 1;
      }
    }
    local_4._0_1_ = 1;
    ppppuStack_64 = (undefined ****)0x44cadc;
    FUN_004933d7();
    local_4 = (uint)local_4._1_3_ << 8;
    ppppuStack_64 = (undefined ****)0x44caea;
    FUN_005b414c();
  }
  local_4 = 0xffffffff;
  ppppuStack_64 = (undefined ****)0x44cafb;
  FUN_005b414c();
  ExceptionList = local_c;
  return 0;
}



/* FUN_004500a0 @ 004500a0
 * references tools string "appletviewer" at 00681f38 */

undefined4 __fastcall FUN_004500a0(int param_1)

{
  int *piVar1;
  char cVar2;
  int iVar3;
  uint uVar4;
  int unaff_EBX;
  WPARAM wParam;
  int iVar5;
  int unaff_EBP;
  char **ppcVar6;
  int unaff_EDI;
  char *pcVar7;
  char *pcVar8;
  bool bVar9;
  int local_64;
  int iStack_60;
  int local_5c;
  tagRECT local_58;
  char *local_48;
  char *local_44;
  uint local_40;
  undefined4 local_3c;
  undefined1 local_38 [4];
  int local_34;
  int local_2c;
  undefined4 local_28 [2];
  void *pvStack_20;
  char *local_1c;
  int local_18;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f2380;
  local_c = ExceptionList;
  ExceptionList = &local_c;
  FUN_005b4fa9();
  pcVar7 = s_Command_00681fcc;
  local_44 = s_Application_Parameters_00681fb0;
  local_48 = s_Command_00681fcc;
  bVar9 = *(int *)(*(int *)(param_1 + 0x5c) + 0x2c0) == 3;
  wParam = 0;
  if (!bVar9) {
    local_44 = s_Parameters_00681fa0;
  }
  local_40 = -(uint)bVar9 & 0x681f8c;
  local_3c = 0;
  ppcVar6 = &local_48;
  do {
    uVar4 = 0xffffffff;
    local_28[0] = 1;
    pcVar8 = pcVar7;
    do {
      if (uVar4 == 0) break;
      uVar4 = uVar4 - 1;
      cVar2 = *pcVar8;
      pcVar8 = pcVar8 + 1;
    } while (cVar2 != '\0');
    local_18 = ~uVar4 - 1;
    local_1c = pcVar7;
    SendMessageA(*(HWND *)(param_1 + 0x1000),0x1307,wParam,(LPARAM)local_28);
    pcVar7 = ppcVar6[1];
    ppcVar6 = ppcVar6 + 1;
    wParam = wParam + 1;
    if (pcVar7 == (char *)0x0) {
      local_5c = 0;
      FUN_005b41ba(s_Tool_Configuration_00681f78);
      iVar5 = *(int *)(param_1 + 0x5c);
      local_4 = 0;
      iVar3 = *(int *)(iVar5 + 0x2c0);
      if (iVar3 == 0) {
        *(int *)(param_1 + 0xc0) = iVar5;
        FUN_005b495e(0x10f,param_1);
        iVar5 = param_1 + 0x59c;
        *(undefined4 *)(param_1 + 0x5f8) = *(undefined4 *)(param_1 + 0x5c);
        FUN_005b495e(0x10e,param_1);
        pcVar7 = s___Compiler_00681f6c;
      }
      else if (iVar3 == 3) {
        *(int *)(param_1 + 0xc0) = iVar5;
        FUN_005b495e(0x10f,param_1);
        iVar5 = param_1 + 0x920;
        *(undefined4 *)(param_1 + 0x97c) = *(undefined4 *)(param_1 + 0x5c);
        FUN_005b495e(0x6821,param_1);
        local_5c = param_1 + 0xe0c;
        *(undefined4 *)(param_1 + 0xe68) = *(undefined4 *)(param_1 + 0x5c);
        FUN_005b495e(0x111,param_1);
        pcVar7 = s___Debugger_00681f60;
      }
      else if (iVar3 == 1) {
        *(int *)(param_1 + 0xc0) = iVar5;
        FUN_005b495e(0x10f,param_1);
        iVar5 = param_1 + 0xb78;
        *(undefined4 *)(param_1 + 0xbd4) = *(undefined4 *)(param_1 + 0x5c);
        FUN_005b495e(0x110,param_1);
        pcVar7 = s___Run_Application_00681f4c;
      }
      else {
        if (iVar3 != 2) {
          local_4 = 0xffffffff;
          FUN_005b414c();
          ExceptionList = local_c;
          return 0;
        }
        *(int *)(param_1 + 0xc0) = iVar5;
        FUN_005b495e(0x10f,param_1);
        iVar5 = param_1 + 0xe0c;
        *(undefined4 *)(param_1 + 0xe68) = *(undefined4 *)(param_1 + 0x5c);
        FUN_005b495e(0x111,param_1);
        pcVar7 = s___Run_AppletViewer_00681f38;
      }
      FUN_005b4528(pcVar7);
      FUN_005b8be9(local_64);
      SendMessageA(*(HWND *)(param_1 + 0x1000),0x130a,0,(LPARAM)local_38);
      GetWindowRect(*(HWND *)(param_1 + 0x1000),&local_58);
      FUN_005bd23c(&local_58);
      FUN_005cdce7(2,(local_2c - local_34) + 4,2,2);
      FUN_005b8c83(local_58.left,local_58.top,local_58.right - local_58.left,
                   local_58.bottom - local_58.top,1);
      FUN_005b8c83(local_58.left,local_58.top,local_58.right - local_58.left,
                   local_58.bottom - local_58.top,1);
      piVar1 = (int *)(param_1 + 0xfe4);
      (**(code **)(*(int *)(param_1 + 0xfe4) + 0xbc))(param_1 + 0x60,0);
      (**(code **)(*piVar1 + 0xbc))(iVar5,1);
      if (unaff_EBP != 0) {
        FUN_005b8c83(unaff_EBX,local_64,iStack_60 - unaff_EBX,local_5c - local_64,1);
        (**(code **)(*piVar1 + 0xbc))(unaff_EBP,2);
      }
      (**(code **)(*piVar1 + 0xc0))(0);
      FUN_005b41ba(*(undefined4 *)(*(int *)(param_1 + 0x5c) + 4));
      local_18._0_1_ = 1;
      FUN_005af876();
      FUN_005b8be9(unaff_EDI);
      FUN_005b8d55(~*(uint *)(*(int *)(param_1 + 0x5c) + 0x1c) >> 1 & 1);
      FUN_005b8d55(*(int *)(unaff_EDI + -8) != 0);
      local_18 = (uint)local_18._1_3_ << 8;
      FUN_005b414c();
      local_18 = 0xffffffff;
      FUN_005b414c();
      ExceptionList = pvStack_20;
      return 1;
    }
  } while( true );
}



/* FUN_00464290 @ 00464290
 * references tools string "javadoc" at 006829cc */

undefined4 __fastcall FUN_00464290(int param_1)

{
  int iVar1;
  int local_57c;
  void *local_c;
  undefined1 *puStack_8;
  int local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f57cc;
  local_c = ExceptionList;
  ExceptionList = &local_c;
  GetParent(*(HWND *)(param_1 + 0x1c));
  FUN_005b563f();
  FUN_00466010();
  FUN_005b41ba();
  local_4 = 0;
  FUN_005b4528();
  GetParent(*(HWND *)(param_1 + 0x1c));
  FUN_005b563f();
  FUN_005b8be9();
  if (*(int *)(param_1 + 0x1ec) != 0) {
    if (*(int *)(*(int *)(param_1 + 0x1e4) + -8) == 0) {
      FUN_0044dc60();
      local_4._0_1_ = 1;
      FUN_005b4285();
      local_4 = (uint)local_4._1_3_ << 8;
      FUN_005b414c();
    }
    if (*(int *)(*(int *)(param_1 + 0x1e4) + -8) != 0) {
      FUN_0044c020();
      local_4._0_1_ = 2;
      iVar1 = FUN_0044c2e0();
      if ((iVar1 == 0) && (&stack0x00000000 != (undefined1 *)0x568)) {
        FUN_005b2181();
        local_4 = CONCAT31(local_4._1_3_,3);
        FUN_00455a10();
        if (local_57c != 0) {
          FUN_005b4285();
          FUN_005b8be9();
        }
        local_4._0_1_ = 2;
        FUN_005b21f5();
      }
      local_4 = (uint)local_4._1_3_ << 8;
      FUN_0044c0a0();
    }
  }
  *(undefined4 *)(param_1 + 0x1ec) = 0;
  local_4 = 0xffffffff;
  FUN_005b414c();
  ExceptionList = local_c;
  return 1;
}



/* FUN_00464430 @ 00464430
 * references tools string "javadoc" at 006829f0 */

void __fastcall FUN_00464430(int param_1)

{
  int iVar1;
  undefined *local_34 [3];
  undefined1 local_28 [28];
  void *local_c;
  undefined1 *puStack_8;
  uint local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f57f0;
  local_c = ExceptionList;
  ExceptionList = &local_c;
  FUN_00510370();
  local_4 = 0;
  FUN_005b42d5(s_Select_path_00681a48);
  FUN_005b42d5(s_Select_JavaDoc_home_path__e_g_C__006829f0);
  local_34[0] = PTR_DAT_00684df8;
  local_4 = CONCAT31(local_4._1_3_,1);
  FUN_005b6034(local_34);
  if (*(int *)(local_34[0] + -8) == 0) {
    FUN_005b4285(param_1 + 0x1e4);
  }
  FUN_005b4285(local_34);
  iVar1 = FUN_00510460(param_1);
  if (iVar1 == 1) {
    FUN_005b4285(local_28);
    FUN_005b8be9(*(undefined4 *)(param_1 + 0x1e8));
  }
  local_4 = local_4 & 0xffffff00;
  FUN_005b414c();
  local_4 = 0xffffffff;
  FUN_005103e0();
  ExceptionList = local_c;
  return;
}



/* FUN_004816e0 @ 004816e0
 * references tools string "javadoc" at 00683dc4 */

void __fastcall FUN_004816e0(int param_1)

{
  HWND hWnd;
  BOOL BVar1;
  int iVar2;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005fa138;
  local_c = ExceptionList;
  if (*(int *)(*(int *)(param_1 + 0xad8) + -8) != 0) {
    if (param_1 == 0) {
      hWnd = (HWND)0x0;
    }
    else {
      hWnd = *(HWND *)(param_1 + 0x1c);
    }
    ExceptionList = &local_c;
    BVar1 = IsWindow(hWnd);
    if (BVar1 != 0) {
      GetWindowRect(*(HWND *)(param_1 + 0x1c),(LPRECT)(param_1 + 0xadc));
    }
    FUN_004ce9c0(0,0);
    local_4 = 0;
    iVar2 = FUN_004cea60(*(undefined4 *)(param_1 + 0xad8));
    if (iVar2 != 0) {
      FUN_004cf240(s_JavaDocWindow_00683dc4,param_1 + 0xadc);
      FUN_004cec40();
    }
    local_4 = 0xffffffff;
    FUN_004cea10();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_0048f9e0 @ 0048f9e0
 * references tools string "javac" at 00684b40 */

void FUN_0048f9e0(void)

{
  FUN_0048f3e0(s___JavaClass__00684b40,s___JavaClass__00684b40);
  return;
}



/* FUN_0044cb20 @ 0044cb20
 * references jars string "src.jar" at 00681c60 */

void __thiscall FUN_0044cb20(int param_1,int param_2)

{
  undefined4 *puVar1;
  int iVar2;
  undefined1 local_2c [32];
  void *local_c;
  undefined1 *puStack_8;
  int local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f19d0;
  local_c = ExceptionList;
  iVar2 = param_2;
  if (param_2 == 0) {
    iVar2 = param_1 + 0x45c;
  }
  ExceptionList = &local_c;
  FUN_005b41ba(iVar2);
  local_4 = 0;
  if (*(int *)(param_2 + -8) == 0) {
    local_4 = 0xffffffff;
    FUN_005b414c();
    ExceptionList = local_c;
    return;
  }
  if (*(char *)(*(int *)(param_2 + -8) + -1 + param_2) != '\\') {
    FUN_005b4528(&DAT_0067fabc);
  }
  FUN_00455940();
  FUN_0049339a();
  local_4._0_1_ = 1;
  puVar1 = (undefined4 *)FUN_005b43e1(local_2c,&param_2,s_src_zip_00681c68);
  local_4._0_1_ = 2;
  iVar2 = FUN_0049345d(*puVar1,0);
  local_4._0_1_ = 1;
  FUN_005b414c();
  if (iVar2 == 0) {
    puVar1 = (undefined4 *)FUN_005b43e1(local_2c,&param_2,s_src_jar_00681c60);
    local_4._0_1_ = 4;
    iVar2 = FUN_0049345d(*puVar1,0);
    local_4._0_1_ = 1;
    FUN_005b414c();
    if (iVar2 == 0) {
      puVar1 = (undefined4 *)FUN_005b43e1(local_2c,&param_2,&PTR_DAT_00681c5c);
      local_4._0_1_ = 6;
      iVar2 = FUN_0049345d(*puVar1,0);
      local_4._0_1_ = 1;
      FUN_005b414c();
      if (iVar2 == 0) goto LAB_0044ccf4;
      puVar1 = (undefined4 *)FUN_005b43e1(local_2c,&param_2,&PTR_DAT_00681c5c);
      local_4._0_1_ = 7;
      FUN_00455860(*puVar1);
    }
    else {
      puVar1 = (undefined4 *)FUN_005b43e1(local_2c,&param_2,s_src_jar_00681c60);
      local_4._0_1_ = 5;
      FUN_00455860(*puVar1);
    }
  }
  else {
    puVar1 = (undefined4 *)FUN_005b43e1(local_2c,&param_2,s_src_zip_00681c68);
    local_4._0_1_ = 3;
    FUN_00455860(*puVar1);
  }
  local_4._0_1_ = 1;
  FUN_005b414c();
LAB_0044ccf4:
  local_4 = (uint)local_4._1_3_ << 8;
  FUN_004933d7();
  local_4 = 0xffffffff;
  FUN_005b414c();
  ExceptionList = local_c;
  return;
}



/* FUN_0044bac0 @ 0044bac0
 * references flags string "-classpath" at 00681990 */

void __fastcall FUN_0044bac0(undefined *param_1)

{
  LRESULT LVar1;
  uint uVar2;
  undefined *local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f1768;
  local_c = ExceptionList;
  if (*(int *)(param_1 + 100) == 0) {
    ExceptionList = &local_c;
    *(undefined4 *)(param_1 + 100) = 1;
    local_10 = param_1;
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x138),0xf0,0,0);
    FUN_0044b4c0(LVar1,s__verbose_006819bc,0);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x84),0xf0,0,0);
    FUN_0044b4c0(LVar1,s__classpath_00681990,s____ClassPath___0068199c);
    local_10 = PTR_DAT_00684df8;
    local_4 = 0;
    FUN_005b6034(&local_10);
    (**(code **)(**(int **)(param_1 + 0x5c) + 0x2c))(local_10);
    uVar2 = *(uint *)(*(int *)(param_1 + 0x5c) + 0x1c);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0xfc),0xf0,0,0);
    if (LVar1 == 0) {
      uVar2 = uVar2 & 0xffffffbf;
    }
    else {
      uVar2 = uVar2 | 0x40;
    }
    local_4 = 0xffffffff;
    *(uint *)(*(int *)(param_1 + 0x5c) + 0x1c) = uVar2;
    *(undefined4 *)(param_1 + 100) = 0;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_0044b3f0 @ 0044b3f0
 * references flags string "-classpath" at 00681990 */

void __fastcall FUN_0044b3f0(undefined *param_1)

{
  WPARAM WVar1;
  undefined *local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f1648;
  local_c = ExceptionList;
  if (*(int *)(param_1 + 100) == 0) {
    ExceptionList = &local_c;
    *(undefined4 *)(param_1 + 100) = 1;
    local_10 = param_1;
    WVar1 = FUN_0044b770(s__verbose_006819bc);
    SendMessageA(*(HWND *)(param_1 + 0x138),0xf1,WVar1,0);
    WVar1 = FUN_0044b770(s__classpath_00681990);
    SendMessageA(*(HWND *)(param_1 + 0x84),0xf1,WVar1,0);
    *(undefined4 *)(param_1 + 100) = 0;
    local_10 = PTR_DAT_00684df8;
    local_4 = 0;
    FUN_005b6034(&local_10);
    (**(code **)(**(int **)(param_1 + 0x5c) + 0x2c))(local_10);
    local_4 = 0xffffffff;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_0044a3a0 @ 0044a3a0
 * references flags string "-classpath" at 00681990 */

void __fastcall FUN_0044a3a0(undefined *param_1)

{
  LRESULT LVar1;
  uint uVar2;
  undefined *local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f13c8;
  local_c = ExceptionList;
  if (*(int *)(param_1 + 100) == 0) {
    ExceptionList = &local_c;
    *(undefined4 *)(param_1 + 100) = 1;
    local_10 = param_1;
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0xfc),0xf0,0,0);
    FUN_00449f90(LVar1,s__verbose_006819bc,0);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x84),0xf0,0,0);
    FUN_00449f90(LVar1,s__classpath_00681990,s____ClassPath___0068199c);
    local_10 = PTR_DAT_00684df8;
    local_4 = 0;
    FUN_005b6034(&local_10);
    (**(code **)(**(int **)(param_1 + 0x5c) + 0x2c))(local_10);
    uVar2 = *(uint *)(*(int *)(param_1 + 0x5c) + 0x1c);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0xc0),0xf0,0,0);
    if (LVar1 == 0) {
      uVar2 = uVar2 & 0xffffffbf;
    }
    else {
      uVar2 = uVar2 | 0x40;
    }
    local_4 = 0xffffffff;
    *(uint *)(*(int *)(param_1 + 0x5c) + 0x1c) = uVar2;
    *(undefined4 *)(param_1 + 100) = 0;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_00449ec0 @ 00449ec0
 * references flags string "-classpath" at 00681990 */

void __fastcall FUN_00449ec0(undefined *param_1)

{
  WPARAM WVar1;
  undefined *local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f1308;
  local_c = ExceptionList;
  if (*(int *)(param_1 + 100) == 0) {
    ExceptionList = &local_c;
    *(undefined4 *)(param_1 + 100) = 1;
    local_10 = param_1;
    WVar1 = FUN_0044a240(s__verbose_006819bc);
    SendMessageA(*(HWND *)(param_1 + 0xfc),0xf1,WVar1,0);
    WVar1 = FUN_0044a240(s__classpath_00681990);
    SendMessageA(*(HWND *)(param_1 + 0x84),0xf1,WVar1,0);
    *(undefined4 *)(param_1 + 100) = 0;
    local_10 = PTR_DAT_00684df8;
    local_4 = 0;
    FUN_005b6034(&local_10);
    (**(code **)(**(int **)(param_1 + 0x5c) + 0x2c))(local_10);
    local_4 = 0xffffffff;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_00449280 @ 00449280
 * references flags string "-classpath" at 00681990 */

void __fastcall FUN_00449280(int param_1)

{
  LRESULT LVar1;
  int iVar2;
  undefined *local_14;
  undefined *local_10;
  void *local_c;
  undefined1 *puStack_8;
  uint local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f1150;
  local_c = ExceptionList;
  if (*(int *)(param_1 + 100) == 0) {
    ExceptionList = &local_c;
    *(undefined4 *)(param_1 + 100) = 1;
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x364),0xf0,0,0);
    if (LVar1 != 0) {
      FUN_00449510(0,s__g_none_006819d8,0,0);
    }
    FUN_00449510(LVar1 != 0,&DAT_006819d4,0,0);
    local_10 = PTR_DAT_00684df8;
    local_4 = 0;
    FUN_005b6034(&local_10);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x328),0xf0,0,0);
    FUN_00449510(LVar1,&DAT_006819d0,0,0);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x2ec),0xf0,0,0);
    FUN_00449510(LVar1 == 0,s__nowarn_006819c8,0,0);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x238),0xf0,0,0);
    FUN_00449510(LVar1,s__verbose_006819bc,0,0);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x1c0),0xf0,0,0);
    FUN_00449510(LVar1,s__deprecation_006819ac,0,0);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x2b0),0xf0,0,0);
    FUN_00449510(LVar1,s__classpath_00681990,s____ClassPath___0068199c,0);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x274),0xf0,0,0);
    FUN_00449510(LVar1,&DAT_0068197c,s____OutputPath___00681980,0);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x84),0xf0,0,0);
    FUN_00449510(LVar1,s___JavaFiles__0068196c,0,1);
    LVar1 = SendMessageA(*(HWND *)(param_1 + 0x84),0xf0,0,0);
    if ((LVar1 == 0) && (iVar2 = FUN_005af308(s___JavaFiles__0068196c), iVar2 != -1)) {
      LVar1 = SendMessageA(*(HWND *)(param_1 + 0x84),0xf0,0,0);
      FUN_00449510(LVar1 == 0,s___ModJavaFiles__0068195c,0,1);
    }
    else {
      local_14 = PTR_DAT_00684df8;
      local_4 = CONCAT31(local_4._1_3_,1);
      FUN_005b6034(&local_14);
      LVar1 = SendMessageA(*(HWND *)(param_1 + 0x84),0xf0,0,0);
      if ((LVar1 != 0) && (iVar2 = FUN_005af308(s___JavaFiles__0068196c), iVar2 != -1)) {
        FUN_00449510(0,s___ModJavaFiles__0068195c,0,1);
      }
      local_4 = local_4 & 0xffffff00;
      FUN_005b414c();
    }
    *(undefined4 *)(param_1 + 100) = 0;
    FUN_004497f0();
    local_4 = 0xffffffff;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_004497f0 @ 004497f0
 * references flags string "-classpath" at 00681990 */

void __fastcall FUN_004497f0(undefined *param_1)

{
  WPARAM WVar1;
  int iVar2;
  undefined *local_10;
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f11b8;
  local_c = ExceptionList;
  if (*(int *)(param_1 + 100) == 0) {
    ExceptionList = &local_c;
    *(undefined4 *)(param_1 + 100) = 1;
    local_10 = param_1;
    WVar1 = FUN_00449970(s__deprecation_006819ac);
    SendMessageA(*(HWND *)(param_1 + 0x1c0),0xf1,WVar1,0);
    WVar1 = FUN_00449970(s__verbose_006819bc);
    SendMessageA(*(HWND *)(param_1 + 0x238),0xf1,WVar1,0);
    WVar1 = FUN_00449970(&DAT_0068197c);
    SendMessageA(*(HWND *)(param_1 + 0x274),0xf1,WVar1,0);
    WVar1 = FUN_00449970(s__classpath_00681990);
    SendMessageA(*(HWND *)(param_1 + 0x2b0),0xf1,WVar1,0);
    iVar2 = FUN_00449970(s__nowarn_006819c8);
    SendMessageA(*(HWND *)(param_1 + 0x2ec),0xf1,(uint)(iVar2 == 0),0);
    WVar1 = FUN_00449970(&DAT_006819d0);
    SendMessageA(*(HWND *)(param_1 + 0x328),0xf1,WVar1,0);
    WVar1 = FUN_00449970(&DAT_006819d4);
    SendMessageA(*(HWND *)(param_1 + 0x364),0xf1,WVar1,0);
    WVar1 = FUN_00449970(s___JavaFiles__0068196c);
    SendMessageA(*(HWND *)(param_1 + 0x84),0xf1,WVar1,0);
    *(undefined4 *)(param_1 + 100) = 0;
    local_10 = PTR_DAT_00684df8;
    local_4 = 0;
    FUN_005b6034(&local_10);
    (**(code **)(**(int **)(param_1 + 0x5c) + 0x2c))(local_10);
    local_4 = 0xffffffff;
    FUN_005b414c();
  }
  ExceptionList = local_c;
  return;
}



/* FUN_0048fbe0 @ 0048fbe0
 * references flags string "-deprecation" at 006819ac */

void FUN_0048fbe0(int param_1,uint param_2)

{
  CWinThread *pCVar1;
  undefined4 uVar2;
  int iVar3;
  undefined4 *puVar4;
  undefined *puVar5;
  char *pcVar6;
  int local_244;
  int local_240;
  undefined *local_23c;
  undefined *local_238;
  int iStack_234;
  undefined1 auStack_230 [4];
  undefined1 local_22c [12];
  undefined1 local_220 [28];
  CDialog local_204 [504];
  void *local_c;
  undefined1 *puStack_8;
  undefined4 local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005fb4f8;
  local_c = ExceptionList;
  if (param_2 < 0x8149) {
    if (param_2 == 0x8148) {
      puVar5 = &DAT_0068ec00;
    }
    else {
      switch(param_2) {
      case 0xb1f:
        puVar5 = &DAT_0068ecd0;
        break;
      default:
        goto switchD_0048fc1d_caseD_b20;
      case 0xb21:
        puVar5 = &DAT_0068ecc0;
        break;
      case 0xb23:
        puVar5 = &DAT_0068ecb0;
        break;
      case 0xb25:
        puVar5 = &DAT_0068eca0;
        break;
      case 0xb27:
        puVar5 = &DAT_0068ec90;
        break;
      case 0xb29:
        puVar5 = &DAT_0068ec80;
        break;
      case 0xb2a:
        puVar5 = &DAT_0068ec70;
        break;
      case 0xb2b:
        puVar5 = &DAT_0068ec30;
        break;
      case 0xb2c:
        puVar5 = &DAT_0068ec40;
      }
    }
    goto LAB_0048fccc;
  }
  switch(param_2) {
  case 0x8149:
    puVar5 = &DAT_0068ec20;
    break;
  case 0x814a:
    puVar5 = &DAT_0068ec10;
    break;
  case 0x814b:
    puVar5 = &DAT_0068ebd0;
    break;
  case 0x814c:
    puVar5 = &DAT_0068ebe0;
    break;
  default:
    goto switchD_0048fc1d_caseD_b20;
  case 0x8150:
    puVar5 = &DAT_0068ebf0;
    break;
  case 0x81c6:
    puVar5 = &DAT_0068ec60;
    break;
  case 0x81cf:
    puVar5 = &DAT_0068ec50;
    break;
  case 0x81f4:
    puVar5 = &DAT_0068ebc0;
  }
LAB_0048fccc:
  if (puVar5 != (undefined *)0x0) {
    local_23c = PTR_DAT_00684df8;
    local_4 = 0;
    ExceptionList = &local_c;
    FUN_005b6034(&local_23c);
    SendMessageA(*(HWND *)(param_1 + 0x1c),0xb0,(WPARAM)&local_240,(LPARAM)local_22c);
    if ((local_240 < 0) || (*(int *)(local_23c + -8) <= local_240)) {
      FUN_005b4528(*(undefined4 *)(puVar5 + 8));
    }
    else {
      FUN_005aee68(local_240,*(undefined4 *)(puVar5 + 8));
    }
    FUN_005b8be9(local_23c);
    goto LAB_004900bd;
  }
switchD_0048fc1d_caseD_b20:
  ExceptionList = &local_c;
  FUN_005b41ba(&DAT_0068e158);
  local_4 = 1;
  if (param_2 == 0x8141) {
    pCVar1 = AfxGetThread();
    if (pCVar1 == (CWinThread *)0x0) {
      uVar2 = 0;
    }
    else {
      uVar2 = (**(code **)(*(int *)pCVar1 + 0x74))();
    }
    FUN_005af955(1,&DAT_0068e158,&DAT_0068e158,0x81024,s_Programs___exe__com__bat_____exe_00681a9c,
                 uVar2);
    local_4._0_1_ = 2;
    iVar3 = FUN_005afab7();
    if (iVar3 == 1) {
      uVar2 = FUN_005afb92(&local_240);
      local_4._0_1_ = 3;
      FUN_005b4285(uVar2);
      local_4._0_1_ = 2;
      FUN_005b414c();
      iVar3 = FUN_005af308(&DAT_0067ed04);
      if (iVar3 != -1) {
        uVar2 = FUN_005b4455(&local_240,&DAT_0067f3b4,&local_244);
        local_4._0_1_ = 4;
        FUN_005b4285(uVar2);
        local_4._0_1_ = 2;
        FUN_005b414c();
        FUN_005b4528(&DAT_0067f3b4);
      }
    }
    local_4._0_1_ = 5;
    FUN_005b414c();
    local_4 = CONCAT31(local_4._1_3_,1);
    CDialog::~CDialog(local_204);
  }
  else if (param_2 == 0x8143) {
    FUN_00510370();
    local_4 = CONCAT31(local_4._1_3_,6);
    FUN_005b42d5(s_Select_directory_0068062c);
    FUN_005b42d5(s_Select_directory___00680618);
    iVar3 = FUN_00510460(param_1);
    if (iVar3 == 1) {
      FUN_005b4285(local_220);
      puVar4 = (undefined4 *)FUN_005af1c7(&local_240,1);
      iVar3 = FUN_0049bc2a(*puVar4,&DAT_0067fabc);
      FUN_005b414c();
      if (iVar3 != 0) {
        FUN_005b4528(&DAT_0067fabc);
      }
    }
    local_4 = CONCAT31(local_4._1_3_,1);
    FUN_005103e0();
  }
  else {
    switch(param_2) {
    case 0xb2e:
      pcVar6 = &DAT_006819d4;
      break;
    case 0xb2f:
      pcVar6 = s__g_none_006819d8;
      break;
    case 0xb30:
      pcVar6 = s__g__lines_vars_source__00684c00;
      break;
    case 0xb31:
      pcVar6 = &DAT_006819d0;
      break;
    case 0xb32:
      pcVar6 = s__nowarn_006819c8;
      break;
    case 0xb33:
      pcVar6 = s__verbose_006819bc;
      break;
    case 0xb34:
      pcVar6 = s__deprecation_006819ac;
      break;
    case 0xb35:
      pcVar6 = s__classpath_<path>_00684bec;
      break;
    case 0xb36:
      pcVar6 = s__sourcepath_<path>_00684bd8;
      break;
    case 0xb37:
      pcVar6 = s__bootclasspath_<path>_00684bc0;
      break;
    case 0xb38:
      pcVar6 = s__extdirs_<dirs>_00684bb0;
      break;
    case 0xb39:
      pcVar6 = s__d_<directory>_00684ba0;
      break;
    case 0xb3a:
      pcVar6 = s__encoding_<encoding>_00684b88;
      break;
    default:
      goto switchD_0048ff55_caseD_b3b;
    case 0xb3c:
      pcVar6 = s__target_<release>_00684b74;
      break;
    case 0xb3d:
      pcVar6 = s__classpath_<path_path>_00684cac;
      break;
    case 0xb3e:
      pcVar6 = s__0_<name>_<value>_00684c98;
      break;
    case 0xb3f:
      pcVar6 = s__verbose___class___gc___jni__00684c78;
      break;
    case 0xb40:
      pcVar6 = s__version_00684c6c;
      break;
    case 0xb41:
      pcVar6 = s__Xbootclasspath_<path_path>_00684c50;
      break;
    case 0xb43:
      pcVar6 = s__Xnoclassgc_00684c44;
      break;
    case 0xb45:
      pcVar6 = s__Xms_<size>_00684c38;
      break;
    case 0xb48:
      pcVar6 = &DAT_00684c24;
      break;
    case 0xb4a:
      pcVar6 = s_Xcheck_jni_00684c18;
      break;
    case 0xc1d:
      pcVar6 = s__Xmx_<size>_00684c2c;
    }
    FUN_005b42d5(pcVar6);
  }
switchD_0048ff55_caseD_b3b:
  if (*(int *)(local_244 + -8) != 0) {
    local_238 = PTR_DAT_00684df8;
    local_4 = CONCAT31(local_4._1_3_,7);
    FUN_005b6034(&local_238);
    SendMessageA(*(HWND *)(param_1 + 0x1c),0xb0,(WPARAM)&iStack_234,(LPARAM)auStack_230);
    if ((iStack_234 < 0) || (*(int *)(local_238 + -8) <= iStack_234)) {
      FUN_005b4564(&local_244);
    }
    else {
      FUN_005aee68(iStack_234,local_244);
    }
    FUN_005b8be9(local_238);
    local_4 = CONCAT31(local_4._1_3_,1);
    FUN_005b414c();
  }
LAB_004900bd:
  local_4 = 0xffffffff;
  FUN_005b414c();
  ExceptionList = local_c;
  return;
}



/* FUN_00447d10 @ 00447d10
 * references process string "/c " at 006817bc */

undefined4 __fastcall FUN_00447d10(int *param_1)

{
  char cVar1;
  undefined4 *puVar2;
  undefined1 uVar3;
  char *pcVar4;
  char *pcVar5;
  int *piVar6;
  uint uVar7;
  uint uVar8;
  int iVar9;
  char *pcVar10;
  char *pcVar11;
  undefined *puStack_d0;
  char *pcStack_cc;
  uint local_c8;
  char *pcStack_c4;
  undefined *puStack_c0;
  int iStack_bc;
  undefined1 auStack_b8 [4];
  char *pcStack_b4;
  int iStack_b0;
  undefined4 *puStack_ac;
  _OSVERSIONINFOA _Stack_a0;
  void *pvStack_c;
  undefined1 *puStack_8;
  int iStack_4;
  
  iStack_4 = 0xffffffff;
  puStack_8 = &LAB_005f0f12;
  pvStack_c = ExceptionList;
  local_c8 = 0;
  ExceptionList = &pvStack_c;
  (**(code **)(*param_1 + 0x44))();
  iStack_4 = 0;
  puVar2 = (undefined4 *)param_1[0x8d];
  puStack_c0 = PTR_DAT_00684df8;
  do {
    if (puVar2 == (undefined4 *)0x0) {
      FUN_004476f0();
      FUN_005b42d5(&DAT_0068e158);
      if (*(int *)(puStack_c0 + -8) != 0) {
        FUN_005b4528(&DAT_0067ed00);
        (**(code **)(*param_1 + 0x40))(&puStack_c0,0x467,param_1[0x94]);
      }
      PostMessageA((HWND)param_1[0xaf],0x46c,0,0);
      (**(code **)(*param_1 + 0x48))();
      FUN_00523f40();
      iStack_4 = 0xffffffff;
      FUN_005b414c();
      ExceptionList = pvStack_c;
      return 1;
    }
    puStack_ac = (undefined4 *)*puVar2;
    piVar6 = (int *)puVar2[2];
    ResetEvent((HANDLE)param_1[0xa8]);
    FUN_005b41ba(piVar6[2]);
    iStack_4._0_1_ = 1;
    FUN_005b41ba(piVar6[3]);
    iStack_4._0_1_ = 2;
    FUN_005b41ba(piVar6[1]);
    iStack_4._0_1_ = 3;
    uVar3 = (undefined1)iStack_4;
    iStack_4._0_1_ = 3;
    if (((param_1[7] & 0x400U) != 0) || ((param_1[7] & 0x4000U) != 0)) {
      (**(code **)(*piVar6 + 0x1c))(&iStack_b0,param_1);
      iStack_4._0_1_ = 4;
      if (*(int *)(iStack_b0 + -8) != 0) {
        (**(code **)(*param_1 + 0x40))(&iStack_b0,0x467,param_1[0x94]);
      }
      iStack_4._0_1_ = 3;
      FUN_005b414c();
      uVar3 = (undefined1)iStack_4;
    }
    iStack_4._0_1_ = uVar3;
    if (*(int *)(pcStack_cc + -8) == 0) {
      FUN_005b4528(&DAT_0068175c);
      FUN_005b4528(s_Error___Empty_Commandline__00681740);
      FUN_004476f0();
      (**(code **)(*param_1 + 0x40))(&puStack_c0,0x467,param_1[0x94]);
      PostMessageA((HWND)param_1[0xaf],0x46c,0,0);
      (**(code **)(*param_1 + 0x48))();
      FUN_00523f40();
      iStack_4._0_1_ = 2;
      FUN_005b414c();
      iStack_4._0_1_ = 1;
      FUN_005b414c();
      iStack_4 = (uint)iStack_4._1_3_ << 8;
      FUN_005b414c();
      iStack_4 = 0xffffffff;
      FUN_005b414c();
      ExceptionList = pvStack_c;
      return 0;
    }
    if ((param_1[7] & 0x1000U) != 0) {
      _Stack_a0.dwOSVersionInfoSize = 0x94;
      GetVersionExA(&_Stack_a0);
      pcVar4 = s_CMD_EXE__C_006817cc;
      if (_Stack_a0.dwPlatformId == 1) {
        pcVar4 = s_COMMAND_COM__C_006817bc;
      }
      FUN_005b42d5(pcVar4);
    }
    pcVar5 = (char *)FUN_005b3e8d(*(int *)(pcStack_b4 + -8) + 10 + *(int *)(pcStack_cc + -8));
    uVar7 = 0xffffffff;
    pcVar4 = pcStack_cc;
    do {
      pcVar11 = pcVar4;
      if (uVar7 == 0) break;
      uVar7 = uVar7 - 1;
      pcVar11 = pcVar4 + 1;
      cVar1 = *pcVar4;
      pcVar4 = pcVar11;
    } while (cVar1 != '\0');
    uVar7 = ~uVar7;
    pcVar4 = pcVar11 + -uVar7;
    pcVar11 = pcVar5;
    for (uVar8 = uVar7 >> 2; uVar8 != 0; uVar8 = uVar8 - 1) {
      *(undefined4 *)pcVar11 = *(undefined4 *)pcVar4;
      pcVar4 = pcVar4 + 4;
      pcVar11 = pcVar11 + 4;
    }
    for (uVar7 = uVar7 & 3; uVar7 != 0; uVar7 = uVar7 - 1) {
      *pcVar11 = *pcVar4;
      pcVar4 = pcVar4 + 1;
      pcVar11 = pcVar11 + 1;
    }
    uVar7 = 0xffffffff;
    pcVar4 = &DAT_0067ed04;
    do {
      pcVar11 = pcVar4;
      if (uVar7 == 0) break;
      uVar7 = uVar7 - 1;
      pcVar11 = pcVar4 + 1;
      cVar1 = *pcVar4;
      pcVar4 = pcVar11;
    } while (cVar1 != '\0');
    uVar7 = ~uVar7;
    iVar9 = -1;
    pcVar4 = pcVar5;
    do {
      pcVar10 = pcVar4;
      if (iVar9 == 0) break;
      iVar9 = iVar9 + -1;
      pcVar10 = pcVar4 + 1;
      cVar1 = *pcVar4;
      pcVar4 = pcVar10;
    } while (cVar1 != '\0');
    pcVar4 = pcVar11 + -uVar7;
    pcVar11 = pcVar10 + -1;
    for (uVar8 = uVar7 >> 2; uVar8 != 0; uVar8 = uVar8 - 1) {
      *(undefined4 *)pcVar11 = *(undefined4 *)pcVar4;
      pcVar4 = pcVar4 + 4;
      pcVar11 = pcVar11 + 4;
    }
    for (uVar7 = uVar7 & 3; uVar7 != 0; uVar7 = uVar7 - 1) {
      *pcVar11 = *pcVar4;
      pcVar4 = pcVar4 + 1;
      pcVar11 = pcVar11 + 1;
    }
    uVar7 = 0xffffffff;
    pcVar4 = pcStack_b4;
    do {
      pcVar11 = pcVar4;
      if (uVar7 == 0) break;
      uVar7 = uVar7 - 1;
      pcVar11 = pcVar4 + 1;
      cVar1 = *pcVar4;
      pcVar4 = pcVar11;
    } while (cVar1 != '\0');
    uVar7 = ~uVar7;
    iVar9 = -1;
    pcVar4 = pcVar5;
    do {
      pcVar10 = pcVar4;
      if (iVar9 == 0) break;
      iVar9 = iVar9 + -1;
      pcVar10 = pcVar4 + 1;
      cVar1 = *pcVar4;
      pcVar4 = pcVar10;
    } while (cVar1 != '\0');
    pcVar4 = pcVar11 + -uVar7;
    pcVar11 = pcVar10 + -1;
    for (uVar8 = uVar7 >> 2; uVar8 != 0; uVar8 = uVar8 - 1) {
      *(undefined4 *)pcVar11 = *(undefined4 *)pcVar4;
      pcVar4 = pcVar4 + 4;
      pcVar11 = pcVar11 + 4;
    }
    for (uVar7 = uVar7 & 3; uVar7 != 0; uVar7 = uVar7 - 1) {
      *pcVar11 = *pcVar4;
      pcVar4 = pcVar4 + 1;
      pcVar11 = pcVar11 + 1;
    }
    FUN_005b42d5(pcVar5);
    FUN_005b3eb6(pcVar5);
    puStack_d0 = PTR_DAT_00684df8;
    pcStack_c4 = PTR_DAT_00684df8;
    uVar7 = param_1[7];
    iStack_4._0_1_ = 6;
    uVar3 = (undefined1)iStack_4;
    iStack_4._0_1_ = 6;
    if ((uVar7 & 0x400) == 0) {
      iStack_4._0_1_ = uVar3;
      if (((uVar7 & 0x8000) == 0) && ((uVar7 & 0x800) == 0)) {
        FUN_005b42d5(s_GE2001_exe_006817b0);
        FUN_005b4528(&DAT_00681784);
        FUN_005b4528(&DAT_00681780);
        FUN_005b4528(s__r_none_0068178c);
        if (*(int *)(iStack_bc + -8) == 0) {
          piVar6 = (int *)FUN_005b41ba(&DAT_00681788);
          local_c8 = local_c8 | 2;
          iStack_4._0_1_ = 8;
        }
        else {
          piVar6 = &iStack_bc;
        }
        FUN_005b4564(piVar6);
        iStack_4._0_1_ = 6;
        iStack_4._1_3_ = 0;
        if ((local_c8 & 2) != 0) {
          local_c8 = local_c8 & 0xfffffffd;
          FUN_005b414c();
        }
        FUN_005b4528(&DAT_0067ed04);
        goto LAB_00447fc9;
      }
      FUN_005b4564(&pcStack_cc);
      FUN_005b4285(&iStack_bc);
      if ((1 < *(int *)(pcStack_c4 + -8)) && (*pcStack_c4 == '\"')) {
        FUN_005aee10(0,1);
      }
      iVar9 = *(int *)(pcStack_c4 + -8);
      if ((1 < iVar9) && (pcStack_c4[iVar9 + -1] == '\"')) {
        FUN_005aee10(iVar9 + -1,1);
      }
    }
    else {
      FUN_005b42d5(s_GE2001_exe_006817b0);
      FUN_005b4528(s__p_none_006817a4);
      FUN_005b4528(s__c_none_00681798);
      FUN_005b4528(s__r_none_0068178c);
      if (*(int *)(iStack_bc + -8) == 0) {
        piVar6 = (int *)FUN_005b41ba(&DAT_00681788);
        local_c8 = local_c8 | 1;
        iStack_4._0_1_ = 7;
      }
      else {
        piVar6 = &iStack_bc;
      }
      FUN_005b4564(piVar6);
      iStack_4._0_1_ = 6;
      iStack_4._1_3_ = 0;
      if ((local_c8 & 1) != 0) {
        local_c8 = local_c8 & 0xfffffffe;
        FUN_005b414c();
      }
      FUN_005b4528(&DAT_0067ed04);
LAB_00447fc9:
      FUN_005b4564(&pcStack_cc);
      FUN_005b42d5(&DAT_0068e158);
    }
    if ((param_1[7] & 0x4000U) != 0) {
      FUN_005b41ba(s_Command___00681770);
      iStack_4._0_1_ = 9;
      FUN_005b4564(&pcStack_cc);
      FUN_005b4528(&DAT_0067ed00);
      (**(code **)(*param_1 + 0x40))(auStack_b8,0x467,param_1[0x94]);
      FUN_005b42d5(s_Directory___00681760);
      FUN_005b4564(&local_c8);
      FUN_005b4528(&DAT_0067ed00);
      (**(code **)(*param_1 + 0x40))(&pcStack_c4,0x467,param_1[0x94]);
      iStack_4._0_1_ = 6;
      FUN_005b414c();
    }
    FUN_00448380(&puStack_d0,&pcStack_c4,&puStack_c0,param_1);
    iStack_4._0_1_ = 5;
    FUN_005b414c();
    iStack_4._0_1_ = 3;
    FUN_005b414c();
    iStack_4._0_1_ = 2;
    FUN_005b414c();
    iStack_4._0_1_ = 1;
    FUN_005b414c();
    iStack_4 = (uint)iStack_4._1_3_ << 8;
    FUN_005b414c();
    puVar2 = puStack_ac;
  } while( true );
}



/* FUN_00479410 @ 00479410
 * references process string "cmd.exe" at 00683684 */

void __fastcall FUN_00479410(int param_1)

{
  undefined4 uVar1;
  int iVar2;
  undefined4 *puVar3;
  int iVar4;
  undefined4 uStack_10c;
  undefined1 auStack_108 [4];
  undefined1 auStack_104 [4];
  CDialog local_100 [96];
  _OSVERSIONINFOA _Stack_a0;
  void *pvStack_c;
  undefined1 *puStack_8;
  int local_4;
  
  local_4 = 0xffffffff;
  puStack_8 = &LAB_005f902d;
  pvStack_c = ExceptionList;
  ExceptionList = &pvStack_c;
  FUN_0040d150(0);
  local_4 = 0;
  iVar2 = FUN_005b4d23();
  if (iVar2 == 1) {
    FUN_005b41ba(s_COMMAND_COM_0068368c);
    local_4 = CONCAT31(local_4._1_3_,1);
    _Stack_a0.dwOSVersionInfoSize = 0x94;
    GetVersionExA(&_Stack_a0);
    if (_Stack_a0.dwPlatformId != 1) {
      FUN_005b42d5(s_CMD_EXE_00683684);
    }
    puVar3 = (undefined4 *)FUN_004795f0(auStack_104);
    uVar1 = *puVar3;
    local_4._0_1_ = 2;
    puVar3 = (undefined4 *)FUN_004795f0(auStack_108);
    local_4._0_1_ = 3;
    iVar2 = FUN_00442940(*puVar3,uStack_10c,uVar1,s___FileDir__00683678,0x1400,0,0);
    local_4._0_1_ = 2;
    FUN_005b414c();
    local_4._0_1_ = 1;
    FUN_005b414c();
    if (iVar2 != 0) {
      iVar4 = FUN_00474ba0(iVar2);
      if (iVar4 == 0) {
        FUN_00442ba0(iVar2);
        FUN_005c137d(s_Error___Insertion_aborted__0068365c,0,0);
        local_4 = (uint)local_4._1_3_ << 8;
        FUN_005b414c();
        local_4 = 4;
        goto LAB_004795b2;
      }
      FUN_005b41ba(*(undefined4 *)(iVar2 + 4));
      local_4._0_1_ = 5;
      (**(code **)(*(int *)(param_1 + 100) + 0xb8))(auStack_108,iVar2,0xffffffff);
      local_4._0_1_ = 1;
      FUN_005b414c();
    }
    local_4 = (uint)local_4._1_3_ << 8;
    FUN_005b414c();
  }
  local_4 = 6;
LAB_004795b2:
  FUN_005b414c();
  local_4 = 0xffffffff;
  CDialog::~CDialog(local_100);
  ExceptionList = pvStack_c;
  return;
}



/* FUN_0048f8c0 @ 0048f8c0
 * references env string "classpath" at 00684b20 */

void FUN_0048f8c0(void)

{
  FUN_0048f3e0(s___ClassPath__00684b20,s___ClassPath__00684b20);
  return;
}



