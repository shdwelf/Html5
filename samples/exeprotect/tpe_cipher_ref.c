/* TPE data-cipher reference harness — transcribed from the Trident Polymorphic
   Engine v1.2 disassembly in samples/src/tpe_v12.asm (do_encrypt, lup, blup).
   Used to independently verify the kitchen tpeCrypt op; see VECTORS.md. */
/* TPE cipher reference — transcribed line-by-line from the Trident
   Polymorphic Engine v1.2 disassembly (samples/src/tpe_v12.asm):
   v3:   mov dx,[xor_val]          ; dx = K0
   lup:  lodsw / call do_encrypt / stosw   (word mode)
   blup: lodsb / xor dh,dh / call do_encrypt / stosb  (byte mode)
   do_encrypt: add dx,[add_val]    ; K += S
               test bl,2 -> xor ax,dx | test bl,1 -> sub ax,dx | add ax,dx
   Compile: gcc -o tpe_ref tpe_ref.c; run: tpe_ref <mode w|b> <method x|a|s> <K0hex> <Shex> <hexbytes>
*/
#include <stdio.h>
#include <stdint.h>
#include <string.h>
int main(int argc,char**argv){
  if(argc<6){fprintf(stderr,"usage: %s w|x|a|s... see header\n",argv[0]);return 2;}
  int word = argv[1][0]=='w';
  char m = argv[2][0];
  unsigned K = strtoul(argv[3],0,16) & 0xFFFF, S = strtoul(argv[4],0,16) & 0xFFFF;
  unsigned char buf[4096]; int n=0;
  const char*h=argv[5];
  for(;h[0]&&h[1];h+=2){unsigned v;sscanf(h,"%2x",&v);buf[n++]=(unsigned char)v;}
  unsigned char out[4096];
  for(int i=0;i<n;i+=(word?2:1)){
    if(word){ unsigned v=buf[i]|(buf[i+1]<<8);
      K=(K+S)&0xFFFF;                       /* do_encrypt: add dx,add_val */
      unsigned r = m=='x'?(v^K): m=='a'?((v+K)&0xFFFF):((v-K)&0xFFFF);
      out[i]=r&0xFF; out[i+1]=(r>>8)&0xFF;
    } else { K=((K&0xFF)+S)&0xFFFF;         /* xor dh,dh then add dx,add_val */
      unsigned v=buf[i];
      unsigned r = m=='x'?((v^(K&0xFF))&0xFF): m=='a'?((v+(K&0xFF))&0xFF):((v-(K&0xFF))&0xFF);
      out[i]=r&0xFF;
    }
  }
  for(int i=0;i<n;i++)printf("%02x",out[i]);
  printf("\n");return 0;
}
