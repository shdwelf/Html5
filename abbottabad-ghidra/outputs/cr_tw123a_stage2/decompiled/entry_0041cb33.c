
undefined4 entry(void)

{
  uint uVar1;
  uint in_EAX;
  int iVar2;
  int *unaff_ESI;
  
  uVar1 = unaff_ESI[10];
  iVar2 = -(uint)(in_EAX < uVar1) + 10;
  *(int *)(*unaff_ESI + 4) = *(int *)(*unaff_ESI + 4) + iVar2;
  return *(undefined4 *)
          (unaff_ESI[0x22] +
          ((in_EAX - unaff_ESI[iVar2] >> (0x18U - (char)iVar2 & 0x1f)) +
          unaff_ESI[-(uint)(in_EAX < uVar1) + 0x1b]) * 4);
}

