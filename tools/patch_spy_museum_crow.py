#!/usr/bin/env python3
"""Add the 2026-10-02 museum/Crow/Kryptos research pass to the standalone apps."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHEF = ROOT / "public/apps/cyberchef/index.html"
SUITE = ROOT / "apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html"


def once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise SystemExit(f"{label}: expected one anchor, found {text.count(old)}")
    return text.replace(old, new, 1)

chef = CHEF.read_text()

m4 = r'''

/* 37. Naval Enigma M4 — the non-stepping Greek wheel sits between the
   left moving rotor and a thin reflector.  At Beta A / thin-B the pair is
   electrically equivalent to the wide UKW-B, giving a useful M3 control. */
const ENI_M4_GREEK={Beta:'LEYJVCNIXWPBQMDRTAKZGFUHOS',Gamma:'FSOKANUERHMBTIYCWLQPZXVGJD'};
const ENI_M4_UKW={Bthin:'ENKQAUYWJICOPBLMDXZVFTHRGS',Cthin:'RDOBJNTKVEHMLFCWZAXGYIPSUQ'};
function enigmaM4Crypt(text,opts){
  const rotL=ENI_ROT[opts.L||'II'],rotM=ENI_ROT[opts.M||'IV'],rotR=ENI_ROT[opts.R||'I'];
  const greek=ENI_M4_GREEK[opts.G||'Beta'],ukw=ENI_M4_UKW[opts.ukw||'Bthin'];
  let pG=eniPos(opts.posG||'A'),pL=eniPos(opts.posL||'A'),pM=eniPos(opts.posM||'A'),pR=eniPos(opts.posR||'A');
  const rG=eniPos(opts.ringG||'A'),rL=eniPos(opts.ringL||'A'),rM=eniPos(opts.ringM||'A'),rR=eniPos(opts.ringR||'A');
  const plug={};const pairs=String(opts.plug||'').toUpperCase().replace(/[^A-Z]/g,'');
  if(new Set(pairs).size!==pairs.length)throw new Error('Each plugboard letter may appear only once');
  for(let i=0;i+1<pairs.length;i+=2){plug[pairs[i]]=pairs[i+1];plug[pairs[i+1]]=pairs[i];}
  function thru(wiring,pos,ring,c,inv){const shift=(pos-ring+26)%26,x=(c+shift)%26;const y=inv?wiring.indexOf(eniChr(x)):eniPos(wiring[x]);return(y-shift+26)%26;}
  let out='';
  for(const ch0 of String(text).toUpperCase()){
    if(ch0<'A'||ch0>'Z'){out+=ch0;continue;}
    const midNotch=eniChr(pM)===rotM.n,rightNotch=eniChr(pR)===rotR.n;
    if(midNotch){pL=(pL+1)%26;pM=(pM+1)%26;}else if(rightNotch)pM=(pM+1)%26;
    pR=(pR+1)%26; // Greek/Beta-Gamma wheel never steps.
    let c=eniPos(plug[ch0]||ch0);
    c=thru(rotR.w,pR,rR,c,false);c=thru(rotM.w,pM,rM,c,false);c=thru(rotL.w,pL,rL,c,false);c=thru(greek,pG,rG,c,false);
    c=eniPos(ukw[c]);
    c=thru(greek,pG,rG,c,true);c=thru(rotL.w,pL,rL,c,true);c=thru(rotM.w,pM,rM,c,true);c=thru(rotR.w,pR,rR,c,true);
    out+=plug[eniChr(c)]||eniChr(c);
  }
  return out;
}
addOp('enigmaM4','Naval Enigma M4','Classical',
  'Kriegsmarine four-wheel Enigma: a stationary Beta or Gamma “Greek” wheel, three stepping naval rotors, and thin B/C reflector. The fourth wheel did not add a fourth stepping lever. Full key material still needs wheel order, four ring settings, four starts, reflector and reciprocal plugboard pairs.',
  [
    {key:'G',label:'Greek wheel',type:'select',default:'Beta',options:[['Beta','Beta'],['Gamma','Gamma']]},
    {key:'L',label:'Left moving rotor',type:'select',default:'I',options:[['I','I'],['II','II'],['III','III'],['IV','IV'],['V','V']]},
    {key:'M',label:'Middle moving rotor',type:'select',default:'II',options:[['I','I'],['II','II'],['III','III'],['IV','IV'],['V','V']]},
    {key:'R',label:'Right moving rotor',type:'select',default:'III',options:[['I','I'],['II','II'],['III','III'],['IV','IV'],['V','V']]},
    {key:'ukw',label:'Thin reflector',type:'select',default:'Bthin',options:[['Bthin','UKW B thin'],['Cthin','UKW C thin']]},
    {key:'pos',label:'Start (G-L-M-R)',type:'text',default:'AAAA'},
    {key:'ring',label:'Rings (G-L-M-R)',type:'text',default:'AAAA'},
    {key:'plug',label:'Plugboard pairs',type:'text',default:''}
  ],function(t,a){
    const pos=(a.pos||'AAAA').toUpperCase().replace(/[^A-Z]/g,'').padEnd(4,'A').slice(0,4),ring=(a.ring||'AAAA').toUpperCase().replace(/[^A-Z]/g,'').padEnd(4,'A').slice(0,4);
    return enigmaM4Crypt(t||'AAAAA',{G:a.G,L:a.L,M:a.M,R:a.R,ukw:a.ukw,posG:pos[0],posL:pos[1],posM:pos[2],posR:pos[3],ringG:ring[0],ringL:ring[1],ringM:ring[2],ringR:ring[3],plug:a.plug||''});
  });
'''
chef = once(chef, "\nconst ZW_CPS=", m4 + "\nconst ZW_CPS=", "M4 insert")

field_ops = r'''

/* 37. SECOM key schedule inspector.  This is deliberately the auditable key
   derivation, not a claim to solve the Crow: a wrong phrase still makes a
   perfectly plausible schedule. */
function secomSequence10(s){
  const ranked=[...s].map((ch,i)=>({ch,i})).sort((a,b)=>a.ch.localeCompare(b.ch)||a.i-b.i),out=Array(10);
  ranked.forEach((x,i)=>out[x.i]=(i+1)%10);return out.join('');
}
function secomSchedule(phrase){
  const p=onlyAZ(phrase);
  if(p.length<20)throw new Error('SECOM needs at least 20 letters; spaces are ignored');
  const first=p.slice(0,10),second=p.slice(10,20),a=secomSequence10(first),b=secomSequence10(second);
  const add=(x,y)=>[...x].map((d,i)=>(Number(d)+Number(y[i]))%10).join('');
  const seed=add(a,b),chain=[...seed].map(Number);
  for(let i=0;chain.length<60;i++)chain.push((chain[i]+chain[i+1])%10);
  const block=chain.slice(10).join(''),last=block.slice(-10);
  const ranked=[...last].map((ch,i)=>({ch:Number(ch),i})).sort((x,y)=>(x.ch===0?10:x.ch)-(y.ch===0?10:y.ch)||x.i-y.i),checker=Array(10);
  ranked.forEach((x,i)=>checker[x.i]=(i+1)%10);
  return {phrase:p.slice(0,20),first,second,firstDigits:a,secondDigits:b,seed,block,checker:checker.join('')};
}
addOp('secomSchedule','SECOM Key Schedule','Classical',
  'Inspect SECOM’s auditable key schedule: rank the two ten-letter halves (1…9,0), add without carry, generate 50 new chain digits, and sequence the checkerboard row. This is not a full decryptor: exact triangular disruption is required. The repository probe reproduces the official full vector and rejects INMYMEMORYIWILLALWAY as the Crow key.',
  [{key:'phrase',label:'Key phrase (20+ letters)',type:'text',default:'MAKE NEW FRIENDS BUT KEEP THE OLD'}],
  function(t,a){const s=secomSchedule(a.phrase||t);return ['Phrase : '+s.phrase.slice(0,10)+' '+s.phrase.slice(10),'Ranks : '+s.firstDigits+' '+s.secondDigits,'Seed   : '+s.seed,'50     : '+s.block.match(/.{10}/g).join(' '),'Board  : '+s.checker].join('\n');});

/* 38. Dutch OD poem-code indicator/key worksheet.  The historical example
   uses the first 20 words, chooses positions 2,6,11,15 and secret 58265. */
const OD_CHECK_SWAP='KLMNOPQRSTABCDEFGHIJUVWXYZ';
addOp('odPoemKey','OD Poem-Code Key & Indicator','Classical',
  'Reproduce Ton van Schendel’s Ordedienst worksheet: select words by 1-based position from the agreed poem, concatenate them as a columnar-transposition key, and hide those positions in a five-letter indicator with a pre-agreed five-digit secret. The exact poem/version is key material; this recipe does not guess it.',
  [
    {key:'poem',label:'Agreed poem (first 20 words)',type:'text',default:'TOEN ONZE MOP EEN MOPJE WAS HET AARDIG HEM TE ZIEN NU BROMT HY ALLE DAGEN EN BYT NOG BOVENDIEN'},
    {key:'positions',label:'Selected positions',type:'text',default:'2,6,11,15'},
    {key:'secret',label:'Five-digit secret',type:'text',default:'58265'}
  ],function(t,a){
    const words=String(a.poem||t).toUpperCase().match(/[A-Z]+/g)||[],pos=String(a.positions).match(/\d+/g)?.map(Number)||[],secret=String(a.secret).replace(/\D/g,'');
    if(words.length<20)throw new Error('Supply at least the agreed first 20 poem words');
    if(!pos.length||pos.some(n=>n<1||n>words.length))throw new Error('Selected positions must exist in the poem');
    if(secret.length!==5)throw new Error('Secret must be exactly five digits');
    const selected=pos.map(n=>words[n-1]),key=selected.join(''),slots=Array(5-pos.length).fill(0).concat(pos);
    if(slots.length!==5)throw new Error('The OD indicator worksheet supports at most five selected words');
    const nums=slots.map((n,i)=>n+Number(secret[i]));
    if(nums.some(n=>n<1||n>26))throw new Error('Position + secret digit must stay in A=1…Z=26');
    const indicator=nums.map(n=>String.fromCharCode(64+n)).join(''),check=[...indicator].map(ch=>OD_CHECK_SWAP[ch.charCodeAt(0)-65]).join('');
    const ranks=deepColumnOrder(key).map((_,i)=>0);deepColumnOrder(key).forEach((col,rank)=>ranks[col]=rank+1);
    return ['Words     : '+selected.join(' | '),'Key       : '+key,'Key ranks : '+ranks.join(' '),'Positions : '+slots.join(' '),'Indicator : '+indicator,'Check     : '+check].join('\n');
  });
'''
chef = once(chef, "\n/* ============================================================\n   MATRIX CIPHER DEEP DIVE", field_ops + "\n\n/* ============================================================\n   MATRIX CIPHER DEEP DIVE", "field recipe insert")
chef = once(chef, "366 recipes", "369 recipes", "recipe count")
chef = once(chef, " 'Wehrmacht Enigma I':[['enigma',{}],['cryptoTimeline',{q:'Enigma'}]],", " 'Wehrmacht Enigma I':[['enigma',{}],['cryptoTimeline',{q:'Enigma'}]],\n 'Museum Rotor Machines — Enigma M3/M4':[['enigma',{}],['enigmaM4',{}],['cryptoTimeline',{q:'Enigma'}]],\n 'Field Ciphers — SECOM & OD Poem Code':[['secomSchedule',{}],['odPoemKey',{}],['straddlingCheckerboard',{}],['doubleColumn',{}]],", "recipe packs")
CHEF.write_text(chef)

suite = SUITE.read_text()
anchor = '{id:"kryptos-k4-smithsonian"'
pos = suite.find(anchor)
if pos < 0: raise SystemExit('suite record anchor missing')
# Find the end of the existing object, quote-aware.
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

records = r''',{id:"kgb-museum-auction",title:"The KGB Espionage Museum dispersal: reading the 2021 auction as a catalog, not a museum label",period:"Museum 2019–2020 · Julien’s sale 13 February 2021",location:"Chelsea, New York · Julien’s Auctions, Beverly Hills and online",confidence:"Primary archive",summary:"The closed KGB Espionage Museum survives unevenly: press stories repeat spectacular gadget names, while Julien’s closed-sale catalog preserves lot numbers, estimates and realized prices. This record separates the private museum’s much larger display inventory from the hundreds of auction lots, follows the Fialka as lot 343, and treats every auction description as seller-supplied provenance requiring corroboration rather than an institutional authentication.",facts:["Lithuanian collector Julius Urbaitis opened the private, for-profit KGB Espionage Museum in Manhattan in January 2019; it shut during the COVID-19 closure and announced a permanent close in October 2020.","Numbers describe different things and should not be merged: contemporary reports describe more than 3,500 objects in the 4,000-square-foot museum; the Julien’s sale page is auction #3292/catalog 370 and reports hundreds of lots, not a one-object/one-lot inventory of the museum.","The sale title and timestamp are preserved by the auction platform: “The Cold War Relics Auction Featuring The KGB Espionage Museum Collection,” closed 13 February 2021 at 10:00 PST.","Auction Daily identifies the rotor machine as lot 343, an M-125-3M Fialka. The catalog estimate was $8,000–$12,000; the reported result was $22,400, so “Soviet Enigma” is an analogy used in the sale literature, not the machine’s model name.","Fialka is a ten-rotor electromechanical machine with direct paper-tape printing. Calling it merely an Enigma that decrypts Enigma traffic is misleading: it is a later Soviet/Warsaw Pact design with its own alphabet, keying and card features.","Auction Daily’s cross-checkable lot trail also names hidden-camera objects: ring lot 128, tie lot 142 and purse lot 147. Those identifiers are more useful for provenance work than a collage of unattributed gadget photographs.","Realized-price reporting provides another checksum on the sale: the Fialka brought $22,400; a hidden-compartment Soviet coin $25,600; the reproduction Markov-style umbrella and a Zaryad camera bag each $19,200; and a listening ashtray $12,800.","The catalog mixed Soviet, U.S., Cuban, space and Che Guevara material. “Entire KGB museum collection” in headlines therefore does not mean every catalog lot was a KGB artifact, nor does a KGB-themed display prove operational use by the KGB.","The museum itself distinguished originals and replicas. The Great Seal “Thing” and assassination umbrella offered in the sale were described as reproductions; labels such as “believed to have been used” must not silently become authenticated chain of custody.","The responsible research path is catalog lot → description/images → maker/model markings → independent technical reference. For Fialka, Sotheby’s 2018 lot description independently records ten coding wheels, spares, reflector, power unit and telegraph key."],sourceLinks:[{label:"Julien’s Auctions — closed catalog #370 / auction #3292",url:"https://bid.juliensauctions.com/auctions/catalog/id/370"},{label:"Auction Daily — lot-numbered KGB collection preview",url:"https://auctiondaily.com/news/kgb-artifacts-come-to-auction-raising-intrigue-and-concerns/"},{label:"The New York Times — museum closure and collection context",url:"https://www.nytimes.com/2020/10/28/arts/design/kgb-museum-closes.html"},{label:"The Register — realized Fialka price and sale follow-up",url:"https://www.theregister.com/2021/02/17/soviet_spy_gadgets_museum_auction/"},{label:"Sotheby’s — independently cataloged M-125-3M Fialka",url:"https://www.sothebys.com/en/auctions/ecatalogue/2018/history-of-science-technology-n09886/lot.43.html"}],caution:"An auction catalog is a primary source for what the seller asserted, the lot number, estimate and recorded bid; it is not automatically a primary source for clandestine operational history. The museum was private, mixed originals with replicas, and the sale mixed many collecting categories. This record therefore does not authenticate a gadget as KGB-issued without maker marks, documentation or an independent technical catalog, and it does not repeat the inaccurate claim that Fialka was used to decrypt German Enigma messages."},{id:"international-spy-museum-machines",title:"International Spy Museum machine trail: M-94, Enigma I and the stationary fourth wheel",period:"1922–1944 artifacts · museum pages checked 2026",location:"International Spy Museum, Washington DC",confidence:"Primary archive",summary:"The International Spy Museum’s own collection filter provides a compact, inspectable machine syllabus: M-94 and M-138-A cylinders, Kryha, two Enigma displays and North Korean code tables. Its four-rotor Enigma page is especially useful because it turns “another rotor” into a precise machine distinction: naval M4 adds a thin, non-stepping Greek wheel and thin reflector; it does not simply make an ordinary three-wheel Enigma step four rotors.",facts:["The museum’s Code/Cipher Machine filter currently returns six highlighted records: Four Rotor Enigma Machine, M-94, Kryha, M-138-A, Enigma Machine 3 and North Korean Code Tables.","Its M-94 page dates U.S. Army tactical use to 1922–1943, says the disks work on the Jefferson-cylinder principle, gives production as nearly 9,432, and notes replacement by M-209.","The highlighted four-rotor object is dated 1943–1944 and carries Japanese characters; the museum says it was built by Germany for ally Japan. That provenance is distinct from the standard Kriegsmarine M4 story.","The museum’s narrative calls the messages “Shark,” says Germany added a rotor in 1942, and connects recovery to captured U-boat key sheets. “Shark” is the British cryptanalytic name for four-wheel naval traffic, not the name of a rotor.","Technically, naval M4 has Beta or Gamma as a thin fourth/Greek wheel at the left, three stepping wheels chosen from naval rotors, and a thin B or C reflector. The Greek wheel is adjustable but does not step during a message.","A full Enigma key cannot be reconstructed from one evocative word. It needs model/wiring, rotor selection and order, Ringstellung, starting windows, reflector, and reciprocal plugboard pairs; M4 additionally needs Greek-wheel identity, ring and start.","The updated CyberChef recipe preserves the machine distinction: enigma remains an M3/Enigma-I model; enigmaM4 adds Beta/Gamma and thin reflectors. Beta at A with ring A plus thin-B is electrically equivalent to wide UKW-B, supplying a regression control.","Rotor stepping happens before each enciphered letter, and the middle wheel double-steps around its notch. A purported setting that ignores this convention can appear close while failing every reproducible vector.","The plugboard is reciprocal and letters cannot be reused across pairs. “Bright” does not name a Stecker setting; a narrower hypothesis is an empty plugboard, which is a valid configuration and a documented cryptanalytic starting approximation. It must not be silently converted into letter pairs.","Collection pages are institutional object labels, but even they compress history for visitors. Machine wiring and test vectors are checked against technical references and executable controls rather than inferred from display prose."],sourceLinks:[{label:"International Spy Museum — Code/Cipher Machine collection filter",url:"https://www.spymuseum.org/exhibition-experiences/about-the-collection/collection-highlights/?filters%5Btype%5D=code-cipher-machine"},{label:"International Spy Museum — Four Rotor Enigma Machine",url:"https://www.spymuseum.org/exhibition-experiences/about-the-collection/collection-highlights/four-rotor-enigma-machine/"},{label:"International Spy Museum — M-94 Cipher Device",url:"https://www.spymuseum.org/exhibition-experiences/about-the-collection/collection-highlights/m-94-cipher-device-2/"},{label:"Wikipedia — Enigma machine models and M4 components",url:"https://en.wikipedia.org/wiki/Enigma_machine"},{label:"NSA — The Cryptographic Mathematics of Enigma",url:"https://www.nsa.gov/portals/75/documents/about/cryptologic-heritage/historical-figures-publications/publications/wwii/CryptoMathEnigma_Miller.pdf"}],caution:"The museum page’s “Germany built this rare Enigma for its ally, Japan” describes the displayed object and should not be generalized to every four-rotor Enigma. Likewise, a fourth visible wheel is not necessarily a fourth stepping wheel. The simulator does not claim the museum artifact’s unknown daily key, and the new recipe deliberately refuses to turn Kryptos spelling anomalies, Morse adjectives or light imagery into rotor order, rings or plugboard cables without a complete deterministic extraction rule."},{id:"crows-cryptogram-secom",title:"The Crow’s Cryptogram: SECOM is visible; the 20-letter phrase is still the key problem",period:"Published 2010 · first listed solve 8 February 2023 · checked 2 October 2026",location:"Cipher Machines and Cryptology challenge archive",confidence:"Archived directory",summary:"The challenge gives 600 digits in 120 groups, a six-line hint and one conspicuous typographic tell: “They SEe and COMe” spells SECOM. That identifies a credible hand-cipher family whose schedule consumes the first twenty letters of a phrase, but it does not identify the phrase. The accompanying lines strongly evoke Phil Coulter’s Derry ballad The Town I Loved So Well; this record turns that into a testable candidate and stops short of publishing invented plaintext from an unverified transposition model.",facts:["The source ciphertext is 600 decimal digits printed as 120 five-digit groups. The page says the plaintext is English, encryption used pencil, paper and a secret key phrase, and the accompanying text is only a hint to that phrase.","The capital anomaly is exact: “The old crows are on the watch. They SEe and COMe...” The adjacent capitals concatenate to SECOM, a manual cipher documented on the same site.","SECOM starts by stripping spaces from a phrase, taking the first twenty letters, splitting 10+10, ranking each half 1 through 9 then 0, adding without carry, and extending the ten-digit seed to fifty digits by chain addition.","SECOM then builds an extended straddling checkerboard, derives two variable-width transposition keys, applies ordinary columnar transposition and a disrupted triangular transposition, and groups the result in fives. That output shape matches the Crow, but shape alone is not proof.","The hint’s “town we loved,” forgetting/remembering, strangers, repeated betrayal, smell and grief all echo the vocabulary and subject of Phil Coulter’s 1973 Derry song “The Town I Loved So Well.” This is a candidate-source identification, not a statement from the puzzle author.","A concrete candidate phrase was the song’s opening “IN MY MEMORY I WILL ALWAYS SEE”; SECOM consumes INMYMEMORYIWILLALWAY as its first twenty letters. The repository’s exact probe now rejects it: authoritative triangular disruption produces no coherent English, so it remains a documented failed candidate rather than an open lead.","The title itself, THETOWNILOVEDSOWELL, has only nineteen letters and therefore cannot be used unchanged by the documented SECOM schedule. Silently padding it would add an unsupported choice.","The current source page lists Oleksii Sylichenko (Ukraine, 8 February 2023) and Daisuke Kondo (Japan, 5 September 2026) in its table of honor, but publishes neither plaintext nor key phrase. A listed solve is not an answer key.","The suite’s older SECOM lab uses a reversible row-rotation teaching model and cannot validate this challenge. The new tools/secom_probe.py implements the published triangular disruption and reproduces the full 105-digit Rijmenants example before testing Crow candidates.","CyberChef includes SECOM Key Schedule as an auditable worksheet, not a one-click “Crow solve.” Exact transposition work lives in the tested probe; the unrelated Dutch OD worksheet remains separate because “first 20 words of a poem” belongs to that resistance method, not Crow’s 20-letter SECOM phrase."],sourceLinks:[{label:"Cipher Machines and Cryptology — The Crow’s Cryptogram (full ciphertext)",url:"https://www.ciphermachinesandcryptology.com/en/crow.htm"},{label:"Cipher Machines and Cryptology — SECOM procedure",url:"https://www.ciphermachinesandcryptology.com/en/secom.htm"},{label:"Crypto Museum — OD Poem code and first-20-word worksheet",url:"https://www.cryptomuseum.com/crypto/od/poem/index.htm"},{label:"The Town I Loved So Well — song background",url:"https://en.wikipedia.org/wiki/The_Town_I_Loved_So_Well"}],caution:"This is not presented as a solved cryptogram. SECOM is a strong identification from the source’s capitalization; the Coulter song is only a source hypothesis, and its opening-line candidate failed the exact published algorithm. The page withholds accepted plaintext and key. Do not score fragments from a simplified model as confirmation; require exact re-encryption of all 600 digits and preferably confirmation from the maintainer."},{id:"kryptos-enigma-hypothesis",title:"Kryptos is not an Enigma key sheet: testing misspellings, Morse fragments and the M4 temptation",period:"Kryptos 1990 · hypothesis audit 2026",location:"CIA Kryptos installation · executable Enigma M3/M4 controls",confidence:"Community archive",summary:"The Enigma analogy is attractive: Kryptos talks about light and shadow, its entrance carries Morse, the solved passages contain conspicuous misspellings, and four-wheel Enigma exists. The most disciplined reading of “bright” is not invented cable pairs but a no/empty-plugboard trial: valid, testable, and consistent with a published cryptanalytic starting approximation. It still leaves rotor order, rings, starts and reflector unspecified, so it is a search hypothesis rather than a key sheet.",facts:["The solved odd spellings are IQLUSION, UNDERGRUUND and DESPARATLY. The entrance Morse also contains unstable/odd transcriptions around DIGETAL INTERPRETATIT, plus VIRTUALLY INVISIBLE, SHADOW FORCES, LUCID MEMORY, T IS YOUR POSITION, SOS and RQ.","Working-chart evidence complicates a single grand typo theory: the K1 PALIMPCEST spelling affects the Vigenère chart; K2’s UNDERGROUND and ABSCISSA are correct on a chart before a sculpture transcription letter changes; K2 also needed a later confirmed omitted S for WESTXLAYERTWO.","The anomalies can generate letter pairs such as wrong→right (Q→L, U→O, A→E), but a military Enigma plugboard requires disjoint reciprocal pairs. Repeated letters, direction and treatment of missing letters need a stated rule; three pairs cannot stand in for a normal full daily key.","An M3 key requires three rotor identities/order, three ring settings, three starting positions, reflector and plugboard. An M4 key requires Beta/Gamma, three moving rotors, four rings, four starts, thin B/C reflector and plugboard.","“Bright” is not a named Enigma field. A modern Enigma-breaking paper nevertheless uses brightness figuratively for plaintext-statistics signal: wrong or additional plugs dim that signal, while an empty plugboard is a useful first approximation during rotor/ring search. That supports testing no plugs—not deriving plug pairs—and does not prove Sanborn intended the analogy.","Morse is a transport/encoding layer in historical Enigma traffic, not normally the source of plugboard settings. To use Kryptos Morse as key material a hypothesis must specify ordering, normalization and an unambiguous mapping before looking at output.","The fourth wheel mentioned in general references is real: naval M4’s Beta/Gamma wheel is stationary during a message and works with a thin reflector. It cannot be simulated by simply adding another ordinary stepping rotor to an M3.","The executable control catches a common modelling error: Beta/A ring A + thin-B reproduces the wide-B reflector behavior of M3 when the moving rotor configuration is otherwise the same. The right, middle and left stepping remains M3-style.","K4 has 97 letters and artist-confirmed crib positions for EAST, NORTHEAST, BERLIN and CLOCK. Any Enigma proposal can be forward-tested against those exact positions; none should be accepted because a few unpositioned words appear in noisy output.","The 2025 archival recovery did not reveal a public Enigma solve. The method remained in the auctioned/private material, so the public record still cannot validate a rotor-machine claim from plaintext alone."],sourceLinks:[{label:"Kryptos overview — ciphertext, misspellings and corrected omission",url:"https://en.wikipedia.org/wiki/Kryptos"},{label:"Wired — Kryptos anomalies and K4 speculation",url:"https://www.wired.com/2009/04/ff-kryptos/"},{label:"International Spy Museum — physical four-rotor Enigma",url:"https://www.spymuseum.org/exhibition-experiences/about-the-collection/collection-highlights/four-rotor-enigma-machine/"},{label:"Ostwald and Weierud — Modern breaking of Enigma ciphertexts",url:"https://cryptocellar.org/pubs/enigma-modern-breaking.pdf"},{label:"Smithsonian AAA — Jim Sanborn papers finding aid",url:"https://www.aaa.si.edu/collections/jim-sanborn-papers-22298"}],caution:"Negative finding, not impossibility proof: the corrected “bright” hypothesis is an empty plugboard, not plug pairs or a standalone brightness setting. It is a legitimate low-complexity trial, but not evidence of Sanborn’s intent and not a complete key. A valid proposal must publish the machine model and every remaining setting, define preprocessing, reproduce all confirmed crib positions, and round-trip the full ciphertext without hand edits."}'''
suite = suite[:end] + records + suite[end:]
SUITE.write_text(suite)
print('patched CyberChef and lecture hall')
