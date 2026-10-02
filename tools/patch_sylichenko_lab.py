#!/usr/bin/env python3
"""Second 2026-10-02 pass: fold the Crow's first solver's published method
(Oleksii Sylichenko, github.com/asilichenko/enigma) into the standalone apps.

Adds to CyberChef:
  * secomExact        — full exact SECOM encrypt/decrypt (triangular
                        disruption included), reproducing the official
                        105-digit worksheet vector;
  * iocFitness        — the fitness ladder's measuring instruments: Friedman
                        IoC, Sylichenko's integer shortcut sum(h^2), English
                        chi-squared and a compact bigram log-score;
  * plugboardHillClimb — a faithful in-browser port of the Sullivan–Weierud /
                        Sylichenko plugboard hill-climb: precompute the
                        alphabet at every step, then climb plug pairs with a
                        staged fitness ladder.

Adds to the Intelligence Lecture Hall: one source-graded record on the
asilichenko/enigma repository and what it does — and does not — say about
the Crow.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHEF = ROOT / "public/apps/cyberchef/index.html"
SUITE = ROOT / "apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html"


def once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise SystemExit(f"{label}: expected one anchor, found {text.count(old)}")
    return text.replace(old, new, 1)

chef = CHEF.read_text()

ops = r'''

/* ============================================================
   SYLICHENKO LAB — the Crow's first solver's published method
   (github.com/asilichenko/enigma, LGPL v3). The repository is
   Enigma tooling; it contains no SECOM code and no Crow
   solution. Only the measurable method discipline is ported.
   ============================================================ */

/* 40. Exact SECOM — full encrypt/decrypt with the authoritative triangular
   disruption, byte-for-byte equal to tools/secom_probe.py.  Control vector:
   the official Rijmenants worksheet phrase and plaintext reproduce the
   published 105-digit cryptogram. */
function sxSeq(text){
  const idx=[...text].map((ch,i)=>({ch,i})).sort((a,b)=>a.ch<b.ch?-1:a.ch>b.ch?1:a.i-b.i);
  const out=new Array(text.length);idx.forEach((x,r)=>out[x.i]=(r+1)%10);return out.join('');
}
function sxChain(seed,count){
  const a=[...seed].map(Number);
  for(let i=0;i<count;i++)a.push((a[i]+a[i+1])%10);
  return a.slice(-count).join('');
}
function sxSchedule(phrase){
  const p=onlyAZ(phrase).slice(0,20);
  if(p.length!==20)throw new Error('SECOM requires at least 20 letters; spaces are ignored');
  const a=sxSeq(p.slice(0,10)),b=sxSeq(p.slice(10));
  let seed='';for(let i=0;i<10;i++)seed+=(Number(a[i])+Number(b[i]))%10;
  const block=sxChain(seed,50),board=sxSeq(block.slice(-10));
  const rev=[...block].reverse(),seen=new Set(),widths=[];let total=0;
  for(const x of rev){
    if(seen.has(x))continue;
    seen.add(x);total+=Number(x);
    if(total>9){widths.push(total);total=0;if(widths.length===2)break;}
  }
  if(widths.length<2)throw new Error('Degenerate chain (even-digit cycle): this phrase cannot derive two transposition widths');
  let mix='';for(let i=0;i<10;i++)mix+=(Number(b[i])+Number(board[i]))%10;
  let stream='';
  for(const d of '1234567890')for(let c=0;c<10;c++)if(mix[c]===d)for(let r=0;r<5;r++)stream+=block[r*10+c];
  return {phrase:p,seed,block,board,widths,keys:[stream.slice(0,widths[0]),stream.slice(widths[0],widths[0]+widths[1])]};
}
function sxKeyCols(key){const out=[];for(const d of '1234567890')for(let i=0;i<key.length;i++)if(key[i]===d)out.push(i);return out;}
function sxCellIds(n,w){const out=[],rows=Math.ceil(n/w);for(let r=0;r<rows;r++)for(let c=0;c<w;c++)if(r*w+c<n)out.push(r*w+c);return out;}
function sxTriangles(n,key){
  const w=key.length,rows=Math.ceil(n/w),cells=new Set(sxCellIds(n,w)),tri=new Set();let row=0;
  for(const col of sxKeyCols(key)){
    for(let delta=0;delta<w-col;delta++){
      const r=row+delta;
      for(let c=col+delta;c<w;c++)if(cells.has(r*w+c))tri.add(r*w+c);
    }
    row+=(w-col)+1;
    if(row>=rows)break;
  }
  return tri;
}
function sxTransEnc(text,key,disrupted){
  const n=text.length,w=key.length,rows=Math.ceil(n/w),all=sxCellIds(n,w);
  let write=all;
  if(disrupted){const tri=sxTriangles(n,key);write=all.filter(x=>!tri.has(x)).concat(all.filter(x=>tri.has(x)));}
  const grid={};write.forEach((cell,i)=>grid[cell]=text[i]);
  let out='';
  for(const c of sxKeyCols(key))for(let r=0;r<rows;r++)if(grid[r*w+c]!==undefined)out+=grid[r*w+c];
  return out;
}
function sxTransDec(text,key,disrupted){
  const n=text.length,w=key.length,rows=Math.ceil(n/w),all=sxCellIds(n,w),cellSet=new Set(all),grid={};let i=0;
  for(const c of sxKeyCols(key))for(let r=0;r<rows;r++)if(cellSet.has(r*w+c))grid[r*w+c]=text[i++];
  let read=all;
  if(disrupted){const tri=sxTriangles(n,key);read=all.filter(x=>!tri.has(x)).concat(all.filter(x=>tri.has(x)));}
  return read.map(x=>grid[x]).join('');
}
function sxBoard(s){
  const top=s.board,heads=[top[2],top[5],top[8]],enc={},dec={};
  const topchars=['E','S',null,'T','O',null,'N','I',null,'A'];
  [...top].forEach((d,i)=>{const ch=topchars[i];if(ch){enc[ch]=d;dec[d]=ch;}});
  ['BCDFGHJKLM','PQRUVWXYZ*','0123456789'].forEach((chars,ri)=>{
    const head=heads[ri],start=top.indexOf(head);
    [...chars].forEach((ch,j)=>{const col=ri===2?j:(start+j)%10;const code=head+top[col];enc[ch]=code;dec[code]=ch;});
  });
  enc[' ']=enc['*'];delete enc['*'];
  for(const k in dec)if(dec[k]==='*')dec[k]=' ';
  return {enc,dec};
}
function sxEncrypt(plain,phrase){
  const s=sxSchedule(phrase),{enc}=sxBoard(s);
  const p=String(plain||'').toUpperCase().replace(/[^A-Z0-9 ]/g,'');
  let digits='';for(const ch of p)digits+=enc[ch];
  while(digits.length%5)digits+='0';
  return {s,digits:sxTransEnc(sxTransEnc(digits,s.keys[0],false),s.keys[1],true)};
}
function sxDecrypt(cipher,phrase){
  const s=sxSchedule(phrase),{dec}=sxBoard(s);
  let digits=String(cipher||'').replace(/\D/g,'');
  digits=sxTransDec(sxTransDec(digits,s.keys[1],true),s.keys[0],false);
  let out='';let i=0;
  while(i<digits.length){
    if(dec[digits[i]]!==undefined){out+=dec[digits[i]];i+=1;}
    else if(dec[digits.slice(i,i+2)]!==undefined){out+=dec[digits.slice(i,i+2)];i+=2;}
    else{out+='?';i+=1;}
  }
  return {s,plain:out};
}
addOp('secomExact','SECOM Exact Encrypt/Decrypt','Classical',
  'Full SECOM with the authoritative triangular disruption, equal to the repository probe tools/secom_probe.py: 20-letter schedule, extended straddling checkerboard, ordinary plus disrupted transposition. Control: the official worksheet phrase and plaintext reproduce the published 105-digit vector. A wrong phrase on the Crow produces letter soup — the probe scored 111 hint-derived phrases and rejected all of them.',
  [
    {key:'phrase',label:'Key phrase (20+ letters)',type:'text',default:'MAKE NEW FRIENDS BUT KEEP THE OLD'},
    {key:'mode',label:'Mode',type:'select',default:'encrypt',options:[['encrypt','Encrypt'],['decrypt','Decrypt']]}
  ],function(t,a){
    if(a.mode==='decrypt'){
      const r=sxDecrypt(t||'77719 38622 00032 04239 60038 29683 14608 06071 78016 73606 06064 63536 06968 67403 69681 89001 40219 06662 60666 08631 60549',a.phrase);
      return ['════ SECOM exact decrypt ════','Phrase : '+r.s.phrase,'Keys   : K1('+r.s.widths[0]+')='+r.s.keys[0]+'  K2('+r.s.widths[1]+')='+r.s.keys[1],'Plain  : '+r.plain].join('\n');
    }
    const r=sxEncrypt(t||'RV TOMORROW AT 1400PM TO COMPLETE TRANSACTION USE DEADDROP AS USUAL',a.phrase);
    return ['════ SECOM exact encrypt ════','Phrase : '+r.s.phrase,'Keys   : K1('+r.s.widths[0]+')='+r.s.keys[0]+'  K2('+r.s.widths[1]+')='+r.s.keys[1],'Digits : '+r.digits.length,'Result : '+(r.digits.match(/.{1,5}/g)||[]).join(' '),'','Control: official worksheet phrase reproduces the published 105-digit vector.'].join('\n');
  });

/* 41. Fitness ladder instruments.  IocFitness in asilichenko/enigma drops
   the constant N(N-1) denominator because only the ranking matters:
   score = sum(h[i]^2) in pure integer arithmetic. */
const SYL_UNI=[8.17,1.49,2.78,4.25,12.70,2.23,2.02,6.09,6.97,0.15,0.77,4.03,2.41,6.75,7.51,1.93,0.10,5.99,6.33,9.06,2.76,0.98,2.36,0.15,1.97,0.07];
const SYL_UNILOG=SYL_UNI.map(x=>Math.log10(x));
const SYL_BI={TH:27.1,HE:23.3,IN:20.3,ER:17.8,AN:16.1,RE:14.1,ES:13.2,ON:13.2,ST:12.5,NT:11.7,EN:11.3,AT:11.2,ED:10.8,ND:10.7,TO:10.7,OR:10.6,EA:10.0,TI:9.9,AR:9.8,TE:9.8,NG:8.9,AL:8.8,IT:8.8,AS:8.7,IS:8.6,HA:8.3,ET:7.6,SE:7.3,OU:7.2,OF:7.1,LE:7.0,SA:6.8,VE:6.8,RO:6.6,RA:6.5,RI:6.3,HI:6.2,NE:6.2,ME:6.1,DE:6.1,CO:5.9,TA:5.8,EC:5.8,SI:5.5,LL:5.4,SO:5.3,NA:5.2,LI:5.0,LA:4.9,EL:4.6,MA:4.4,DI:4.3,IC:4.2,RT:4.2,NS:4.2,IO:4.1,WE:4.1,OM:4.0,UR:4.0,US:3.9,OW:3.3,LO:3.3,UT:3.2,DA:3.0,UN:3.0,WA:3.0,EE:2.8,NO:2.8,CE:2.6,MO:2.5,TR:2.5,BE:2.3};
const SYL_BILOG={};for(const k in SYL_BI)SYL_BILOG[(k.charCodeAt(0)-65)*26+(k.charCodeAt(1)-65)]=Math.log10(SYL_BI[k]);
function sylIdx(s){return [...onlyAZ(s)].map(ch=>ch.charCodeAt(0)-65);}
function sylUniScore(idx){let s=0;for(const c of idx)s+=SYL_UNILOG[c];return s;}
function sylBiScore(idx){let s=0;for(let i=0;i+1<idx.length;i++){const w=SYL_BILOG[idx[i]*26+idx[i+1]];s+=w===undefined?-1:w;}return s;}
function sylIocInt(idx){const h=new Array(26).fill(0);for(const c of idx)h[c]++;let s=0;for(const n of h)s+=n*n;return s;}
addOp('iocFitness','IoC & Fitness Ladder','Classical',
  'The measuring instruments behind the hill-climb published by the Crow’s first listed solver (asilichenko/enigma): Friedman IoC, the integer shortcut Σh² (constant denominator dropped — only ranking matters), English chi-squared and a compact bigram log-score. Stage 1 discipline: calibrate thresholds on a same-length sample text BEFORE trusting any search. On SECOM output the IoC rung is load-bearing: the checkerboard biases wrong-key text toward E,S,T,O,N,I,A, flattering unigram and bigram models.',
  [],function(t){
    const idx=sylIdx(t||'');const n=idx.length;
    if(n<2)throw new Error('Supply at least two letters to score');
    const h=new Array(26).fill(0);for(const c of idx)h[c]++;
    let coinc=0;for(const v of h)coinc+=v*(v-1);
    const ioc=coinc/(n*(n-1));
    let chi2=0;for(let i=0;i<26;i++){const e=n*SYL_UNI[i]/100;chi2+=(h[i]-e)*(h[i]-e)/e;}
    const bg=n>1?sylBiScore(idx)/(n-1):0;
    return ['════ Fitness ladder instruments ════','Letters : '+n,'IoC     : '+ioc.toFixed(4)+'   (English ≈ 0.0667 · uniform ≈ 0.0385 · SECOM wrong-key soup ≈ 0.11–0.17)','Σh²     : '+sylIocInt(idx)+'   (Sylichenko integer IoC — ranking only, no division)','Chi²(EN): '+chi2.toFixed(1)+'   (lower = closer to English letter frequencies)','Bigram  : '+(bg>=0?'+':'')+bg.toFixed(3)+'   (mean log10 per-mille; unseen bigrams floor at -1)','','Stage 1: score a SAME-LENGTH sample in the target language first and derive','thresholds from it; only then trust scores from a search (asilichenko/enigma README).'].join('\n');
  });

/* 42. Plugboard hill-climb.  The decisive optimization from the
   asilichenko/enigma hill-climbing module, ported exactly: with wheels,
   rings and starts held fixed, encipher the WHOLE alphabet at every text
   position once (steps × 26 table).  A plugboard trial then costs only
   lookups: plain = P(E_k(P(cipher))).  The ladder stages the fitness:
   his PlugboardService uses unigram for pairs 1-4, trigram for 5-9 and
   tetragram for the last; this compact port uses unigram then bigram. */
function sylPrecompute(len,opts){
  const rotL=ENI_ROT[opts.L],rotM=ENI_ROT[opts.M],rotR=ENI_ROT[opts.R],ukw=ENI_UKW[opts.ukw||'B'];
  let pL=eniPos(opts.posL),pM=eniPos(opts.posM),pR=eniPos(opts.posR);
  const rL=eniPos(opts.ringL),rM=eniPos(opts.ringM),rR=eniPos(opts.ringR);
  function thru(w,pos,ring,c,inv){const sh=(pos-ring+26)%26,x=(c+sh)%26;const y=inv?w.indexOf(eniChr(x)):eniPos(w[x]);return (y-sh+26)%26;}
  const table=[];
  for(let k=0;k<len;k++){
    const midNotch=eniChr(pM)===rotM.n,rightNotch=eniChr(pR)===rotR.n;
    if(midNotch){pL=(pL+1)%26;pM=(pM+1)%26;}else if(rightNotch)pM=(pM+1)%26;
    pR=(pR+1)%26;
    const row=new Array(26);
    for(let c=0;c<26;c++){
      let x=c;
      x=thru(rotR.w,pR,rR,x,false);x=thru(rotM.w,pM,rM,x,false);x=thru(rotL.w,pL,rL,x,false);
      x=eniPos(ukw[x]);
      x=thru(rotL.w,pL,rL,x,true);x=thru(rotM.w,pM,rM,x,true);x=thru(rotR.w,pR,rR,x,true);
      row[c]=x;
    }
    table.push(row);
  }
  return table;
}
function sylDecode(cipherIdx,table,plug){
  const out=new Array(cipherIdx.length);
  for(let i=0;i<cipherIdx.length;i++)out[i]=plug[table[i][plug[cipherIdx[i]]]];
  return out;
}
addOp('plugboardHillClimb','Enigma Plugboard Hill-Climb','Classical',
  'In-browser port of the Sullivan–Weierud hill-climb as implemented by the Crow’s first listed solver (asilichenko/enigma): wheels, rings and starts are held fixed while plug pairs are climbed greedily over the precomputed step×26 alphabet table. Control: a 274-letter M3 ciphertext with Stecker EN RT OS AI is fully recovered. A real attack also enumerates wheels, rings and indicators — this recipe demonstrates the inner loop, not the whole search.',
  [
    {key:'L',label:'Left rotor',type:'select',default:'II',options:[['I','I'],['II','II'],['III','III'],['IV','IV'],['V','V']]},
    {key:'M',label:'Middle rotor',type:'select',default:'IV',options:[['I','I'],['II','II'],['III','III'],['IV','IV'],['V','V']]},
    {key:'R',label:'Right rotor',type:'select',default:'I',options:[['I','I'],['II','II'],['III','III'],['IV','IV'],['V','V']]},
    {key:'ukw',label:'Reflector',type:'select',default:'B',options:[['B','UKW B'],['C','UKW C']]},
    {key:'pos',label:'Start (LMR)',type:'text',default:'AAA'},
    {key:'ring',label:'Rings (LMR)',type:'text',default:'AAA'},
    {key:'pairs',label:'Max plug pairs (1-10)',type:'number',default:'6'}
  ],function(t,a){
    const cipherIdx=sylIdx(t||'');
    if(cipherIdx.length<40)throw new Error('Supply at least 40 ciphertext letters — the fitness statistics need material');
    if(cipherIdx.length>2000)throw new Error('Keep demo ciphertexts at or below 2000 letters');
    const pos=(a.pos||'AAA').toUpperCase().replace(/[^A-Z]/g,'').padEnd(3,'A'),ring=(a.ring||'AAA').toUpperCase().replace(/[^A-Z]/g,'').padEnd(3,'A');
    const maxPairs=Math.max(1,Math.min(10,parseInt(a.pairs,10)||6));
    const table=sylPrecompute(cipherIdx.length,{L:a.L,M:a.M,R:a.R,ukw:a.ukw,posL:pos[0],posM:pos[1],posR:pos[2],ringL:ring[0],ringM:ring[1],ringR:ring[2]});
    const plug=Array.from({length:26},(_,i)=>i),trace=[];
    for(let plugCnt=0;plugCnt<maxPairs;plugCnt++){
      const fit=plugCnt<4?sylUniScore:sylBiScore,stage=plugCnt<4?'unigram':'bigram';
      const cur=fit(sylDecode(cipherIdx,table,plug));
      let best=null;
      for(let x=0;x<26;x++){
        if(plug[x]!==x)continue;
        for(let y=x+1;y<26;y++){
          if(plug[y]!==y)continue;
          plug[x]=y;plug[y]=x;
          const sc=fit(sylDecode(cipherIdx,table,plug));
          plug[x]=x;plug[y]=y;
          if(!best||sc>best.sc)best={x,y,sc};
        }
      }
      if(!best||best.sc<=cur)break;
      plug[best.x]=best.y;plug[best.y]=best.x;
      trace.push(eniChr(best.x)+eniChr(best.y)+' ('+stage+' '+best.sc.toFixed(1)+')');
    }
    const found=[];for(let x=0;x<26;x++)if(plug[x]>x)found.push(eniChr(x)+eniChr(plug[x]));
    const plainIdx=sylDecode(cipherIdx,table,plug),plain=plainIdx.map(eniChr).join('');
    const iocFinal=sylIocInt(plainIdx);
    return ['════ Plugboard hill-climb (Sullivan–Weierud / Sylichenko) ════','Wheels : '+a.L+'-'+a.M+'-'+a.R+'  UKW '+a.ukw+'  start '+pos+'  rings '+ring+'  (held fixed — plugboard-only search)','Ladder : pairs 1-4 unigram, later pairs bigram (compact port of his unigram/trigram/tetragram stages)','Climb  : '+(trace.length?trace.join('  '):'(no improving pair — empty plugboard kept)'),'Found  : '+(found.length?found.join(' '):'(none)'),'Σh²    : '+iocFinal,'Plain  : '+plain.slice(0,120)+(plain.length>120?'…':'')].join('\n');
  });
'''
chef = once(chef, "\nconst ZW_CPS=", ops + "\nconst ZW_CPS=", "sylichenko ops insert")
chef = once(chef, "369 recipes", "372 recipes", "recipe count")
chef = once(chef,
  " 'Field Ciphers — SECOM & OD Poem Code':[['secomSchedule',{}],['odPoemKey',{}],['straddlingCheckerboard',{}],['doubleColumn',{}]],",
  " 'Field Ciphers — SECOM & OD Poem Code':[['secomSchedule',{}],['secomExact',{}],['odPoemKey',{}],['straddlingCheckerboard',{}],['doubleColumn',{}]],\n"
  " 'Sylichenko Enigma Lab — Hill-Climbing the Plugboard':[['enigma',{}],['plugboardHillClimb',{}],['iocFitness',{}],['secomExact',{}]],",
  "recipe packs")
CHEF.write_text(chef)

suite = SUITE.read_text()
anchor = '{id:"kryptos-enigma-hypothesis"'
pos = suite.find(anchor)
if pos < 0: raise SystemExit('suite record anchor missing')
depth=0; quote=None; esc=False; end=None
for i in range(pos,len(suite)):
    c=suite[i]
    if quote:
        if esc: esc=False
        elif c=='\\': esc=True
        elif c==quote: quote=None
    else:
        if c in "'\"`": quote=c
        elif c=='{': depth+=1
        elif c=='}':
            depth-=1
            if depth==0: end=i+1; break
if end is None: raise SystemExit('could not find record end')

record = r''',{id:"sylichenko-enigma-hillclimb",title:"The Crow’s first solver in public code: Oleksii Sylichenko’s Enigma hill-climbing laboratory",period:"Solve listed 08 February 2023 · repository published 2022 · checked 2 October 2026",location:"github.com/asilichenko/enigma · Cipher Machines and Cryptology table of honor",confidence:"Primary archive",summary:"The Crow page credits Oleksii Sylichenko of Ukraine as its first solver, and his GitHub account publishes something rarer than a claim: a complete, documented cryptanalytic toolchain. The enigma repository implements an M3/M4 simulator plus a Sullivan–Weierud hill-climbing key search with calibrated fitness thresholds. It contains no SECOM code and no Crow material, so it is a primary source for his method discipline, not for his solve. This record extracts the measurable parts — the integer IoC shortcut, the staged fitness ladder, the step×26 precompute, the Stage-1 threshold calibration — and turns each into an executable control in CyberChef and the repository’s SECOM probe.",facts:["The challenge page’s table of honor lists Oleksii Sylichenko (Ukraine) on 8 February 2023 as first solver and Daisuke Kondo (Japan) on 5 September 2026 as second; the page was last changed 5 September 2026 and still publishes neither plaintext nor key phrase.","The GitHub account asilichenko carries the profile name Oleksii Sylichenko, is located in Ukraine, and publishes the enigma repository — ‘Enigma machine simulator + cipher breakers’ — under LGPL v3 as four Maven modules: enigma-machine, enigma-setting, enigma-utils and hill-climbing.","The method lineage is documented, not folklore: his README credits Hillclimbing the Enigma Machine by Geoff Sullivan and Frode Weierud (Cryptologia 2006 approach, cryptocellar PDF) and links Crypto Museum wiring and stepping references for the machine model.","His IocFitness deliberately simplifies the index of coincidence to the integer Σh², dropping the constant N(N−1) denominator because only the ranking matters during a climb; the README even records that X*X beats Math.pow(X,2) in the hot loop.","His PlugboardService stages the fitness ladder by plug count: unigram fitness for pairs one to four, trigram for five to nine, tetragram for the last (thresholds four and nine in the source); long messages can be climbed on IoC alone.","The decisive optimization is precompute: with wheels, rings and starts fixed, encipher the whole alphabet at every text position once into a steps×26 table; each plugboard trial then costs only lookups, plain = P(E_k(P(cipher))). The CyberChef port recovers a four-pair Stecker (EN RT OS AI) and the full 274-letter plaintext from that table in the browser.","His README Stage 1 requires calibrating score thresholds on a same-length sample text in the traffic language before any search is trusted. The repository’s Crow probe now applies exactly that discipline: an English sample and a wrong-phrase null decrypt bracket the thresholds before candidates are scored.","Applying the calibrated ladder to the Crow produced a new negative-control finding: SECOM’s checkerboard maps frequent digits onto E,S,T,O,N,I,A, so wrong-key output flatters unigram and bigram models; the Friedman IoC rung (wrong-key soup scores 0.11–0.17 against English 0.067) is what actually rejects false positives, including one 20-letter hint window that slipped past the n-gram rungs.","The expanded scan rejected all 111 documented hint-derived candidates — eight named phrases and 103 sliding 20-letter windows over the six-line hint — under the exact published SECOM algorithm that first reproduces the official 105-digit worksheet vector.","A transposition-invariant check now precedes any re-encryption: columnar transposition permutes digits but never changes their counts, so the Crow histogram (2:144, 3:116, 8:88, 5:56, 7:46, 6:45, 4:40, 1:33, 0:23, 9:9) must equal the checkerboard-encoded plaintext histogram plus at most four pad zeros for any proposed solution.","What the repository does not contain is part of the record: no SECOM implementation, no Crow ciphertext, no solution file. His German n-gram resources also show the language-model dependency — the Crow is English, so the ported ladder uses English tables.","The hill-climbing demo holds wheels, rings and starts fixed and climbs only the plugboard; his full Java search additionally enumerates reflectors, rotor orders, ring steps and all 26³ indicator settings across threads — the browser recipe demonstrates the inner loop, not the whole keyspace walk."],sourceLinks:[{label:"Cipher Machines and Cryptology — The Crow’s Cryptogram and table of honor",url:"https://www.ciphermachinesandcryptology.com/en/crow.htm"},{label:"asilichenko/enigma — simulator and hill-climbing breaker (LGPL v3)",url:"https://github.com/asilichenko/enigma"},{label:"Sullivan and Weierud — Hillclimbing the Enigma Machine",url:"https://cryptocellar.org/bgac/hillclimb-enigma.pdf"},{label:"Cipher Machines and Cryptology — SECOM procedure",url:"https://www.ciphermachinesandcryptology.com/en/secom.htm"},{label:"GitHub profile — Oleksii Sylichenko (asilichenko)",url:"https://github.com/asilichenko"}],caution:"A solver’s public Enigma toolchain documents his method discipline, not his Crow solution: nothing here reconstructs, claims or implies his SECOM path, and the repository itself predates the listed solve date without referencing the challenge. The ported hill-climb requires known wheels and rings — it is the inner loop of an attack, not a turnkey breaker — and the compact unigram/bigram ladder is weaker than his trigram/tetragram stages. All 111 candidate rejections hold only under the exact published SECOM model; a solve claim still requires exact re-encryption of all 600 digits and confirmation by the challenge maintainer."}'''
suite = suite[:end] + record + suite[end:]
SUITE.write_text(suite)
print('patched CyberChef (+3 recipes, 372) and lecture hall (+1 record, 31)')
