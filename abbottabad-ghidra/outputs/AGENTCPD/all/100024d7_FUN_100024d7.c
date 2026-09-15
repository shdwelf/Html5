
void __cdecl FUN_100024d7(undefined4 param_1,undefined param_2,undefined4 param_3)

{
  undefined4 *puVar1;
  
  puVar1 = (undefined4 *)malloc(0x16);
  if (puVar1 != (undefined4 *)0x0) {
    *puVar1 = 0x17;
    puVar1[2] = param_1;
    *(undefined *)(puVar1 + 4) = param_2;
    puVar1[1] = 4;
    *(undefined4 *)((int)puVar1 + 0x11) = param_3;
  }
  return;
}

