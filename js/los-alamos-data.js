export const commons = 'https://commons.wikimedia.org/wiki/';
export const seedRecords = [
  {id:'Bethe-hans a.jpg',name:'Hans A. Bethe',surname:'Bethe',badge:'K-3',image:'assets/los-alamos/bethe.jpg',source:'https://www.osti.gov/opennet/manhattan-project-history/People/Scientists/hans-bethe.html',note:'Badge photograph reproduced by the U.S. Department of Energy. The small source scan includes a modern caption.'},
  {id:'Duffield-priscilla.jpg',name:'Priscilla Duffield',surname:'Duffield',badge:'M-22',image:'assets/los-alamos/duffield.jpg'},
  {id:'Enrico Fermi ID badge.png',name:'Enrico Fermi',surname:'Fermi',badge:'G-24',image:'assets/los-alamos/fermi.png'},
  {id:'Richard P. Feynman Los Alamos ID badge photo.jpg',name:'Richard P. Feynman',surname:'Feynman',badge:'I-11',image:'assets/los-alamos/feynman.jpg'},
  {id:'Frankel-stanley p.jpg',name:'Stanley P. Frankel',surname:'Frankel',badge:'O-2',image:'assets/los-alamos/frankel.jpg',
   note:'The high-resolution photograph is read here as O 2 (letter O), normalized to O-2. This is a visual transcription, not verification against an issue ledger. Commons dates it only to circa the 1940s. A separate older, low-resolution Frankel photograph has different visible markings; these have not been confidently transcribed. No badge sequence, issue date, or clearance is inferred. Photograph: Los Alamos National Laboratory; attribution notice linked below.',
   profile:{
    wartime:'Stanley (Stan) Frankel and Eldred Nelson joined Los Alamos in spring 1943 and helped organize human computing in the Theoretical Division, proposing Marchant desk calculators to support the work. This depended on a wider staff, including many women performing calculations; the T-5 group was led by Donald Flanders. In his 1987 account, Metropolis recalls visiting the ENIAC at the Moore School with Frankel and John von Neumann in March 1945.',
    postwar:'Metropolis states that their ENIAC problems were unfinished when the war ended. Work continued with Anthony Turkevich, and Frankel, Turkevich, and Metropolis presented results at Los Alamos in spring 1946. Thus the wartime visit and the postwar review are different milestones. Frankel subsequently became a computer scientist; this profile does not attribute the ENIAC’s construction to him or claim that its later calculations produced the wartime bombs.',
    references:[
     {label:'Biography — Stan Frankel, Nuclear Museum',url:'https://ahf.nuclearmuseum.org/ahf/profile/stan-frankel/'},
     {label:'The Human Computers of Los Alamos — Nuclear Museum',url:'https://ahf.nuclearmuseum.org/ahf/history/human-computers-los-alamos/'},
     {label:'Metropolis’s 1987 account — Los Alamos Science, pp. 125–130 (PDF)',url:'https://mcnp.lanl.gov/pdf_files/Article_1987_LAS_Metropolis_125--130.pdf'},
     {label:'Alternate Frankel badge photograph — identifier unresolved',url:'https://commons.wikimedia.org/wiki/File:Stanley_P._Frankel_Los_Alamos_ID.png'},
     {label:'Research notes, chronology & next leads',url:'docs/los-alamos-frankel.md'},
     {label:'Photograph credit & required reuse notice',url:'assets/los-alamos/NOTICE-frankel.txt'}
    ]}},
  {id:'Metropolis-nicholas.jpg',name:'Nicholas Metropolis',surname:'Metropolis',badge:'G-15',image:'assets/los-alamos/metropolis.jpg',
   note:'The photograph visibly reads G 15, normalized here as G-15. Wikimedia Commons identifies the sitter as Nicholas Metropolis and dates the image only to circa the 1940s. The exact exposure date, issue date, and clearance are not established. Photograph: Los Alamos National Laboratory; reproduced under the attribution notice linked below.',
   profile:{
    wartime:'Recruited by J. Robert Oppenheimer in 1943, Metropolis worked with Enrico Fermi and Edward Teller on equations describing matter at high temperatures and pressures. He and Richard Feynman repaired mechanical desk calculators and worked with IBM punched-card equipment. His 1993 oral history provides a first-person account of this transition in wartime computing.',
    postwar:'After teaching at the University of Chicago, he returned to Los Alamos in 1948 and led construction of MANIAC, which began operating in March 1952. These developments, and the 1953 paper associated with the Metropolis algorithm, belong to his postwar career—not the wartime Manhattan Project. The 1953 paper had five authors; its history should not be reduced to a sole-inventor claim.',
    references:[
     {label:'Biography — Atomic Heritage Foundation / Nuclear Museum',url:'https://ahf.nuclearmuseum.org/ahf/profile/nicholas-metropolis/'},
     {label:'Oral history — interview with Richard Rhodes, 12 September 1993',url:'https://ahf.nuclearmuseum.org/voices/oral-histories/nicholas-metropolis-interview/'},
     {label:'ENIAC chronology — Metropolis’s 1987 account (PDF)',url:'https://mcnp.lanl.gov/pdf_files/Article_1987_LAS_Metropolis_125--130.pdf'},
     {label:'The Metropolis Collection — LANL historian Nicholas Lewis',url:'https://www.lanl.gov/media/publications/the-vault/0822-metropolis'},
     {label:'Algorithm attribution — J. E. Gubernatis (2005), via OSTI',url:'https://www.osti.gov/biblio/20736632-marshall-rosenbluth-metropolis-algorithm'},
     {label:'Research notes, uncertainties & next leads',url:'docs/los-alamos-metropolis.md'},
     {label:'Photograph credit & required reuse notice',url:'assets/los-alamos/NOTICE-metropolis.txt'}
    ]}},
  {id:'J. R. Oppenheimer Los Alamos ID.jpg',name:'J. Robert Oppenheimer',surname:'Oppenheimer',badge:'K-6',image:'assets/los-alamos/oppenheimer.jpg',source:'https://www.nps.gov/articles/000/the-life-of-j-robert-oppenheimer-the-manhattan-project-years-1941-to-1946.htm'}
].map(r=>({...r,source:r.source || commons+'File:'+encodeURIComponent(r.id),note:r.note || 'Original Los Alamos security badge photograph. Badge identifier transcribed from the visible photograph; the collection date range is approximate.'}));
export function recordFromPage(page, letter){
 const id=page.title.replace(/^File:/,'');
 let name=id.replace(/\.[^.]+$/,'').replace(/_/g,' ').replace(/\s*(Los,? Alamos|ID badge|identity badge|badge photo|badge|ID card|ID photo|ID\.?(?:\s|$)).*$/i,'').replace(/\s*\(cropped\)$/i,'').trim();
 // Only reverse the archive's unambiguous surname-first hyphen format.
 if(/^[A-Za-z]+-[a-z ]+$/i.test(name)){const [last,...first]=name.split('-');name=first.join(' ').replace(/\b\w/g,c=>c.toUpperCase())+' '+last;}
 name=name.replace(/\s+/g,' ').trim();
 const parts=name.replace(/,?\s+(Jr\.?|Sr\.?|II|III)$/i,'').split(' ');
 const surname=parts.at(-1) || name;
 return {id,name,surname,letter,badge:null,image:page.imageinfo?.[0]?.thumburl||page.imageinfo?.[0]?.url||'',source:commons+'File:'+encodeURIComponent(id),note:'Imported from the Commons surname category '+letter+'. Name derived from the source filename, not an independently verified personnel record. Badge number has not been transcribed. Refer to the original file for identification, date, and reuse information.'};
}
export function filterRecords(records,{query='',letter='All',savedOnly=false,saved=new Set(),sort='name'}={}){
 const q=query.toLowerCase().replace(/[\s–—-]/g,'');
 return records.filter(r=>(!savedOnly||saved.has(r.id))&&(letter==='All'||(r.letter||r.surname[0]).toUpperCase()===letter)&&(!q||(r.name+' '+(r.badge||'')+' '+(r.id||'')).toLowerCase().replace(/[\s–—-]/g,'').includes(q))).sort((a,b)=>{
  if(sort==='badge'){if(!a.badge&&!b.badge)return a.surname.localeCompare(b.surname);if(!a.badge)return 1;if(!b.badge)return -1;return a.badge.localeCompare(b.badge,'en',{numeric:true});}
  return ((a.letter||a.surname[0]).toUpperCase().localeCompare((b.letter||b.surname[0]).toUpperCase())||a.surname.localeCompare(b.surname)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id))*(sort==='reverse'?-1:1);
 });
}
