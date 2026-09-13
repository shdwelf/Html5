/**
 * krome-catalog.js — research data behind the CASEFILES lab.
 *
 * Two dossiers live here:
 *
 *  1. KR0ME CORP — the 1995–98 "kr0me corp" underground software library that
 *     lived at http://members.tripod.com/~retrotech/ (indexed by the GeoCities
 *     hacking link pages of the day as "kr0mecorp — Retrocomputing, Hacking,
 *     Cyberpunk resources").  The Wayback Machine's Green Crawl walked the
 *     whole directory in Dec 1998 – Mar 1999.  This catalog stores each
 *     capture's NAME and TIMESTAMP; the authoritative SHA-1 of the original
 *     bytes is fetched from the CDX index at recover time and enforced before
 *     anything reaches the disassembler — no hand-transcribed digests in the
 *     middle, the archive's own index is the ground truth.
 *
 *  2. RODGER RAMROD — the 1996 Nonaz Inc. MS-DOS title.  The Internet Archive
 *     holds the shareware ZIP (stream-only), the eXoDOS repack (byte-identical
 *     MD5 to the shareware ZIP), and the full-game RAR (public-domain mark).
 *     All hashes below were read from the archive.org metadata API.
 *
 * Everything here is inert data plus references. Nothing executes: the lab
 * disassembles and decompiles, it never runs a sample.
 */

/* ------------------------------------------------------------------- site */

export const SITE = {
  name: "kr0me corp",
  url: "http://members.tripod.com/~retrotech/",
  years: "1995–98",
  operator: "Njord, from Kr0me BBS",
  copyright: "Copyright © 1995-98 Kr0me Corp - All rights reserved",
  blurb:
    "An underground file archive in the 1998 Tripod belt: kr0me corp's own releases " +
    "(\"Tools coded by Njord, from Kr0me BBS\"), plus the era's nukers, spoofers, " +
    "scanners, Cybertek zines, phreak docs and PGP anonymity papers. The Wayback " +
    "Machine holds ~120 captures of the site and its files, each with a SHA-1 of the " +
    "original bytes — which is what makes this dossier possible: every byte that " +
    "reaches the Ghidra engine is checked against the archive's own CDX index first.",
  pages: {
    files: { ts: "19990508015502", title: "Kr0me Corp - Archives" },
    index: { ts: "19981205065406", title: "kr0me corp - pointer to the new site" },
  },
};

const ORIGIN = "http://members.tripod.com/~retrotech/";

/** Wayback raw-capture URL (id_ = original bytes, no toolbar). */
export const waybackUrl = (name, ts) => `https://web.archive.org/web/${ts}id_/${ORIGIN}${name}`;

/** Human view URL for the dossier. */
export const waybackView = (name, ts) => `https://web.archive.org/web/${ts}/${ORIGIN}${name}`;

/** CDX row for one pinned capture — the source of the expected SHA-1 (base32). */
export const cdxUrl = (name, ts) =>
  `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(ORIGIN + name)}&timestamp=${ts}&limit=1&output=json`;

/* ---------------------------------------------------------------- library */
/*
 * One line per Wayback capture of the archive, from the CDX index:
 *
 *   name | capture-timestamp | compressed-warc-length | class
 *
 * class: z = file capture, h = html page, t = text,
 *        ! = late capture (1999-2000) whose CDX mimetype came back text/html —
 *            Tripod was serving error pages by then, so the digest check will
 *            happily refuse anything that is not the real bytes.
 * desc: from the site's own files.html catalogue where one exists.
 */
const LIB = `
100ways.zip|19990128155635|16523|z|100 ways to disappear and live free
aaacard.zip|19990128172058|2457|z|
abcpay.zip|19991011231906|3593|!|
account.zip|19990128190039|2502|z|
advanced.zip|19991013161747|3587|!|
aicard.zip|19990128234244|2898|z|
airfone.zip|19990129001220|3848|z|
akill2.zip|19981206081249|2435|z|
alert.html|19990129025933|2009|h|
analgsig.zip|19990129045155|4489|z|
angelfir.zip|19990129053928|1543|z|
anonfaq.zip|19990129070541|4978|z|Anonymity FAQ
aolkw.zip|19990202011231|3209|z|
backdoor.zip|19991014015931|3577|!|
banner.html|19981205223515|1131|h|
bashps1.zip|19981205100612|2779|z|
bboxc5.zip|19990202082801|4932|z|
bbs.html|19981201051655|947|h|
bbsbdoor.zip|19981203104634|7625|z|
boink.zip|19990202112935|2798|z|Boink — Win95/NT fragment nuke variant
bored.zip|19991018214353|3587|!|
brazen.zip|19990202155914|31781|z|Brazen 1.10 — forge news posts, control messages
breaksk.zip|19981206014807|10469|z|
bufferow.zip|19990202183416|7630|z|
bufover.zip|19990202191734|15793|z|Buffer overflow papers
c2myazz.zip|19981205013240|9076|z|Win95 OOB "nuke" — the c2myazz attack family
caching.zip|19990202223926|25194|z|Caching techniques
cardchk.zip|19990203000736|1001|z|
cardcop.zip|19990203003814|17476|z|
carding.html|19981202174000|1508|h|
cartefr.zip|19990203030158|4430|z|
ccformat.zip|19990203042129|1467|z|
ccnumber.zip|19990203052721|1520|z|
cellphrk.zip|19990203071203|4866|z|
celltv.zip|19990203084352|1272|z|Cellular listening with a TV
cgibasic.zip|19990203091404|3606|z|
cgibin.zip|19990203103354|4221|z|
cha0scan.zip|19990203122155|4733|z|CHA0SCAN — incremental port scanner
checksum.zip|19981202034820|1877|z|
ciabwash.zip|19990203145715|17477|z|CIA Brainwashing Methods (1956)
contact.html|19981203112841|1776|h|
countcgi.zip|19981206063626|2580|z|
countmea.zip|19990203193412|6788|z|Countermeasures
covertr2.html|19990203231039|5366|h|
crdtcard.zip|19990204000206|7655|z|
crypto.html|19981205192156|2689|h|
ctelec2.zip|19990204052445|17919|z|Cybertek Electric zine #2
ctelec4.zip|19990208233545|22203|z|Cybertek Electric zine #4
dally.zip|19981202210957|34567|z|
dayaft1.zip|19990209032038|4204|z|The day after
dcd3c.zip|19981207002209|4456|z|
denial.zip|19990209060053|17762|z|
dialuptn.zip|19990209091116|5973|z|
digirad.zip|19990209094348|3314|z|Digital communications via radio
digisign.zip|19990209112140|5599|z|
docs.html|19981206121923|2745|h|
drspewfy.zip|19990209154422|5958|z|IRC hostname spoofer for Windows
econsurv.zip|19990209185823|4903|z|Economic survival
elecexp.zip|19990302023803|3112|z|Electronic expertise
erect97.zip|19990302041254|9688|z|Windows spoofer
esperant.zip|19990302044758|34568|z|
ethics.html|19981201043428|3452|h|
eurobbox.zip|19990302094201|7863|z|
faq.html|19990210081743|2805|h|
feedback.html|19990210110353|1144|h|
files.html|19990508015502|3529|h|The archive catalogue itself
fortune.zip|19981202034831|13114|z|
freeacct.zip|19990210175411|1669|z|
freq1.zip|19990218035911|3417|z|
freq2.zip|19990218050711|3105|z|
fuzz.zip|19990218065733|3027|z|
fwbkdoor.zip|19981205135052|11838|z|
gblue.zip|19990218100905|13022|z|
geocit.zip|19990218114324|2779|z|
gewse5.zip|19981203090546|1717|z|
glide.zip|19990218144501|1818|z|
govdialp.zip|19990218151742|2347|z|
govsfreq.zip|19990218170552|993|z|
gthh1-3.zip|19990218173637|4199|z|
gthh1-6.zip|19990218191607|8147|z|
gthh2-1.zip|19990218204717|10867|z|
gthh3-3.zip|19990222074347|6959|z|
hacktec.zip|19990219082647|4710|z|
hackweb.zip|19990219102526|4917|z|
hanson.zip|19990219125109|1649|z|
hidden.html|19981206004351|1106|h|
hiding.zip|19990219170326|8452|z|Hiding yourself
hlinks.html|19981206100925|2772|h|
hotmail.zip|19990219210716|1753|z|
icqanon.zip|19981202103314|1126|z|
icqcrash.zip|19981203000324|2114|z|
icqflood.zip|19981203072442|2122|z|
icqipcrk.zip|19981206084436|5707|z|
icqsniff.zip|19981203160713|3608|z|
icqspoof.zip|19981206132257|2196|z|
iftp.zip|19981207015901|1989|z|
index-2.html|19990220115342|630|h|
index.html|19990420062100|581|h|
ipstuff.zip|19990220131515|8775|z|Misc C sources useful for coding spoofers
ircseq.zip|19990220152501|6045|z|C source of an IRC sequencer
janet1.zip|19991022001034|3573|!|
janet2.zip|19991022011122|3586|!|
jolt.zip|19981201051654|2274|z|Jolt — Win95 flood tool
keyserv.zip|19991022025725|3578|!|PGP key servers
kr0menfo.zip|19981203061628|2145|z|kr0me corp's own info file
land.zip|19990221003817|1506|z|Land — the TCP self-connect crash (m3lt)
letters.html|19981206200356|2024|h|
log.html|19981202095919|2118|h|
loopdiv.zip|19990221053349|1916|z|
lou.zip|19990221063226|13639|z|
lowfaq.zip|19990221083030|6528|z|
machack1.zip|19990221101641|5463|z|
machack2.zip|19990221105210|1930|z|
main.html|19981202144535|1743|h|
media.html|19981205083009|1205|h|
milgov.html|19981206172402|1827|h|
milufo.html|19990221195819|15724|h|The Military UFO Underground
mutilate.zip|19981202092529|2119|z|
namedspl.zip|19981205090236|6079|z|
nasa0803.zip|19990222125954|11288|z|
nasa0925.zip|19990222133803|10790|z|
nasaint2.zip|19990222155240|23316|z|
nasaint3.zip|19990222162902|4199|z|
nasaintl.zip|19990223190950|20240|z|
nestea.zip|19981202095912|2760|z|Nestea — the ICE-nuke sequel (route)
netcat.zip|19990223212617|24573|z|
netwar.html|19981202034817|3546|h|The Armory — net war tools page
news.html|19981203000331|3098|h|
newtear.zip|19981207075123|3337|z|NewTear — teardrop refinement
novhfaq.zip|19990224073230|41806|z|
ntcrack.zip|19981202214507|2064|z|
nthakfaq.zip|19990224110338|44292|z|
ntpptp.zip|19981202052929|2467|z|
nymhelp.zip|19990224135229|22349|z|Nym documentation
octopus.zip|19981202181426|2425|z|
overdrop.zip|19981206081235|1887|z|Overdrop — OOB drop variant
pb_hbbs1.zip|19981206121911|3683|z|
pedo.html|19990224211400|2420|h|
phreak.html|19990225000515|1331|h|
phreakin.zip|19990225082302|12343|z|
pir8rad.zip|19990225113243|2785|z|An intro to pirate radio
plcodes.zip|19990225131853|5051|z|
pop3scan.zip|19990225152821|3332|z|
portscan.zip|19990225161046|11663|z|7th Sphere Port Scanner
pscan.zip|19990127095958|12281|z|Port Scanner
ptech.zip|19990127112309|5051|z|
pubkey.zip|19991002065446|3583|!|Our PGP public key
pwlview.zip|19981207051457|13205|z|Win95 .PWL password viewer
remobs.zip|19990127175345|3521|z|
resources.html|19981207041046|2197|h|
rfc.html|19990127213605|1445|h|
scan.zip|19991002162831|3563|!|IP Scanner
scanner.zip|19981205230727|5846|z|
search.html|19981206132253|1137|h|
secret.html|19981202181447|2837|h|
secretfr.zip|19990128102627|10420|z|
secserv.zip|19990128111856|3127|z|
servu-ki.zip|19981205192203|1961|z|
shells.html|19981205020446|1254|h|
shithead.html|19990128153716|1529|h|
siemens.zip|19990128172012|2549|z|
sirc.zip|19990128181721|12631|z|IRC spoofer, sources included
space.zip|19991003110228|3568|!|
ss1.zip|19990129001255|3274|z|
sscodes.zip|19990129021220|3554|z|
staog.zip|19990129025642|4938|z|Staog — the first Linux virus (VLAD, 1996)
synk4.zip|19981206142646|3618|z|SYN flood generation 4 (route)
takeover.zip|19990129052404|3420|z|
tapper.zip|19990129064355|4470|z|
teardrop.zip|19990129073624|2965|z|Teardrop — IP fragmentation crash
tech.html|19981202110709|1618|h|
thehaq.zip|19990202061539|39509|z|
tools.html|19981202130235|3123|h|
tracemail.txt|19990202094118|17135|t|
treasury.zip|19990202101637|844|z|
tripod.zip|19990202121532|3753|z|
tripod2.zip|19990202131419|1095|z|
trw-ips.zip|19990202140838|9833|z|
trwaddrs.zip|19990202161112|1603|z|
trwdefs.zip|19990202174124|2732|z|
trwinfo.zip|19991004111155|3578|!|
unixhack.zip|19990202210653|32197|z|
virii.html|19981202092527|2004|h|
visahack.zip|19990203001851|2635|z|
webproxy.zip|19990203015837|2165|z|
whycp.zip|19990203051646|2189|z|Cyberpunk movement info
wietse.zip|19990203054145|21148|z|
win95hack1.txt|19990203065011|824|t|
win95hack2.txt|19990203081629|2936|t|
win95pw.txt|19990203091024|2000|t|
winGateScan95-2_1.zip|19981201205517|29758|z|WinGate scanner 2.1
winhackgold.zip|19981203043535|17684|z|
winnuke.zip|19990203131809|1259|z|WinNuke — the OOB attack that named a year
winspoof.zip|19990203141220|4189|z|Windows 95/NT spoofer (untested)
wscan.zip|19991005031125|3617|!|Port Scanner
wsockspy.zip|19981205152719|27924|z|
wtmped.zip|19981202192435|1181|z|
x25.zip|19981206060415|1103|z|
zap2.zip|19990203233635|1167|z|
`.trim();

/** @type {{name:string, ts:string, warc:number, kind:string, suspect:boolean, desc:string}[]} */
export const LIBRARY = LIB.split("\n").map((line) => {
  const [name, ts, warc, kind, desc = ""] = line.split("|");
  return { name, ts, warc: Number(warc), kind, suspect: kind === "!", desc: desc.trim() };
});

/** Files the site's own catalogue links but the crawlers never captured with HTTP 200. */
export const NOT_CAPTURED = [
  ["phAse-0.zip", "phAse zero v1.0 beta — RAS and hacking tool for Win95/98/NT"],
  ["euthan.zip", "Euthanasia 1.52 — anonymous fast mailer/mailbomber"],
  ["scythe.zip", "Death Scythe 2.40 — wipe newsgroups from news servers"],
  ["deshadow.zip", "DeShadow 0.2 — passwd de-shadowing tool for Windows"],
  ["ether.zip", "EtherMail IV — post through remailers"],
  ["theta.zip", "Thetahedron 1.03 — automated fake-news tool"],
  ["pin-g.zip", "Pin-G 1.02b — asynchronous ping flooder"],
  ["spoofit.zip", "IP spoofers, blind and non-blind, with full sources"],
  ["ctelec1.zip", "Cybertek Electric zine #1"],
  ["ctelec3.zip", "Cybertek Electric zine #3"],
  ["radcommo.zip", "Intro to radio communications"],
  ["ciasws.zip", "CIA Secret Weapon System — documentation"],
].map(([name, desc]) => ({ name, desc, note: "linked from files.html — never captured with HTTP 200" }));

/* --------------------------------------------------------------- curation */

/** Long-form notes for the tools worth a Ghidra session. */
export const CURATED = {
  "winnuke.zip": {
    tag: "the famous one",
    body:
      "WinNuke sent a single OOB (URG-flag) TCP segment to port 139 and blue-screened " +
      "unpatched Windows 95 across the internet in the summer of 1997. Most copies " +
      "circulating today are later recompiles; this capture is a Dec-1998 snapshot of " +
      "the file Tripod actually served, digest-checked before anything reaches the " +
      "decompiler.",
  },
  "c2myazz.zip": {
    tag: "the family",
    body:
      "\"c2myazz\" is the name the scene gave the Win95 OOB exploit family after the " +
      "original leaked through #myazz. The zip gathers the variants; diffing their " +
      "code against winnuke's is a five-minute exercise in how attack code mutated " +
      "before CVE culture existed.",
  },
  "land.zip": {
    tag: "protocol pathology",
    body:
      "land.c sets the SYN packet's source = destination, and every vulnerable TCP " +
      "stack of 1997 spins forever resolving the handshake against itself. The zip is " +
      "1.5 KB compressed — source and binary in the same handful of kilobytes as the " +
      "RFC they break.",
  },
  "nestea.zip": {
    tag: "fragmentation",
    body:
      "Nestea (route) refined teardrop's overlapping-fragment offset bug into a tool " +
      "with a banner and options. Together with teardrop.zip and newtear.zip this " +
      "folder is the complete 1997 fragmentation-attack lineage.",
  },
  "teardrop.zip": {
    tag: "fragmentation",
    body: "The original IP overlapping-fragment crasher that took networks down in late 1997.",
  },
  "newtear.zip": {
    tag: "fragmentation",
    body: "NewTear — teardrop rewritten after the patches, probing the same bug class.",
  },
  "synk4.zip": {
    tag: "flooding",
    body: "SYN flood generation 4 — the attack class that took down Panix in 1996 and forced RFC 1948.",
  },
  "staog.zip": {
    tag: "malware history",
    body:
      "Staog (VLAD the Impaler, 1996) was the first Linux virus ever written — 80386 " +
      "assembly exploiting stack-buffer bugs in su/mount, distributed as source and " +
      "build script. Kr0me Corp filed it under tools; history files it under firsts.",
  },
  "pwlview.zip": {
    tag: "the tool that made .PWL famous",
    body:
      "Win95 cached dial-up and LAN passwords in .PWL files under a stream cipher " +
      "whose keystream collapsed under chosen-ciphertext. PWL viewers turned that " +
      "weakness into a household story and forced Microsoft's SP1 fix.",
  },
  "winGateScan95-2_1.zip": {
    tag: "the open-proxy era",
    body:
      "Wingate scans were 1998's shodan query: find an open WinGate proxy, bounce " +
      "through it. The scanner automates class-C sweeps for the wingate banner.",
  },
  "portscan.zip": {
    tag: "scanning",
    body: "7th Sphere port scanner — the Win9x scanner a whole generation started with.",
  },
  "kr0menfo.zip": {
    tag: "self-portrait",
    body: "kr0me corp's own info file — the group describing itself, in its own words.",
  },
};

/* ----------------------------------------------------------------- ramrod */

/** Rodger Ramrod dossier — all numbers below were read from the archive.org metadata API. */
export const RAMROD = {
  title: "Rodger Ramrod",
  publisher: "Nonaz Inc., St Charles, Illinois",
  team: "Frank Settimio, Paul and Derrick Stringini",
  released: "December 28, 1996",
  price: "$39.99 + $5 shipping",
  platform: "MS-DOS, 640×400, 256 colours, DOS4GW.EXE 32-bit DOS extender",
  adult: true,

  shareware: {
    item: "msdos_Rodger_Ramrod_1996",
    file: "Rodger_Ramrod_1996.zip",
    bytes: 8433873,
    md5: "d09be88736b388ea4dbb0887db8adfec",
    sha1: "40154b55114302155ea19ffeb63102e7959ed98f",
    crc32: "af02c1c1",
    filecount: 16,
    access: "stream_only — plays in the archive's emulator, direct download is refused",
    url: "https://archive.org/details/msdos_Rodger_Ramrod_1996",
  },

  /** The eXoDOS repack is byte-identical to the shareware zip (same MD5), and
   *  its parent item is a public torrent — this is the copy the browser can
   *  actually fetch. */
  exodos: {
    item: "exov5_2",
    path: "eXo/eXoDOS/Rodger Ramrod (1996).zip",
    fetchUrl: "https://archive.org/download/exov5_2/eXo/eXoDOS/Rodger%20Ramrod%20%281996%29.zip",
    bytes: 8433873,
    md5: "d09be88736b388ea4dbb0887db8adfec",
    sha1: "40154b55114302155ea19ffeb63102e7959ed98f",
    crc32: "af02c1c1",
    note: "byte-identical to the stream-only shareware zip (same MD5/SHA-1/CRC-32)",
  },

  full: {
    item: "cdfwps",
    file: "cdfwps.rar",
    bytes: 78051394,
    md5: "37c882b3e8b740c2ca5e6466dca947fc",
    sha1: "aa7393ee651214879e1fcc3710772a6c285f8ea9",
    crc32: "e7a7e120",
    filecount: 34,
    license: "publicdomain/mark/1.0",
    url: "https://archive.org/details/cdfwps",
    note: "RAR container — no in-browser unrar here, so the dossier lists it for provenance only",
  },

  /** Package manifest as documented in resources/src-62 (extracted from the eXoDOS zip). */
  manifest: [
    { file: "rodger/RRR.BAT", bytes: 29, role: "launch batch file → STKRUN MAIN.EXE" },
    { file: "rodger/STKRUN.EXE", bytes: 39936, role: "runtime loader — 16-bit real-mode MZ, the lab's primary decompile target" },
    { file: "rodger/MAIN.EXE", bytes: 657920, role: "main executable — check the header: MZ stub or LE/DOS4GW payload" },
    { file: "rodger/RRR.DAT", bytes: 23276544, role: "primary game data" },
    { file: "rodger/READ.ME", bytes: 9114, role: "1996 shareware licence + adult-content notice" },
    { file: "rodger/*.DWM", bytes: 97280, role: "music assets" },
  ],

  whyItMatters:
    "A four-step batch chain — RRR.BAT → STKRUN.EXE → MAIN.EXE — wrapping a DOS4GW " +
    "protected-mode game built by three brothers in St Charles, Illinois. The " +
    "shareware zip is the same artifact the 2016 4chan thread dug up, the same bytes " +
    "eXoDOS repacked; the archive.org metadata API lets us pin all of it to MD5, " +
    "SHA-1 and CRC-32 before a single instruction is disassembled.",
};

/* ------------------------------------------------------------------ riddle */

/** The hidden.html riddle, verbatim from the 1998-12-06 capture. */
export const RIDDLE = {
  page: "hidden.html",
  ts: "19981206004351",
  preamble:
    "Solve the following riddle and you will come up with four numbers forming an IP address.",
  hint: "the order of the numbers is also given by the riddle.",
  text: [
    "Follow the path of the one who hath her face covered;",
    "clothed in white, holding in her left hand, four keys.",
    "One is the red Servant, contrary to the King;",
    "One is the white Jayre; dying, and recreated;",
    "One is the Camelion; something more sublime",
    "than the King, the last One; but fugitive.",
  ],
  footer: "Kv QW n df",
  pointer: "http://kr0mecorp.home.ml.org",
  reading:
    "The imagery is the hermetic allegory of the great work, and the riddle itself " +
    "supplies the ordering — the hint says so: \"the order of the numbers is also " +
    "given by the riddle.\" The verses enumerate their figures: the veiled lady in " +
    "white comes first (the albedo, Luna's white queen — silver, 47), then \"the red " +
    "Servant, contrary to the King\" (the red man — Mars's iron, 26; sulphur is the " +
    "older identification), then \"the white Jayre; dying, and recreated\" (the moon " +
    "that dies and is reborn every month — silver again, 47), and \"the Camelion … the " +
    "last One\" (mercurius, whom the alchemists literally called the chameleon because " +
    "he takes every form, a parting pun on Maier's Atalanta Fugiens — mercury, 80). " +
    "Note the King is never one of the four: he appears only as the measure " +
    "(\"contrary to the King\", \"more sublime than the King\"), so 79 — or 97 reversed — " +
    "does not belong in the address, despite this archive's first-pass guess of " +
    "26.47.79.80, which also broke the stated order. The order-corrected shape is " +
    "47.26.47.80, with the doubled silver an honest warning that the colour→metal " +
    "mapping is probably not the whole mechanism. Nobody has publicly confirmed any " +
    "reading; we file it open.",
  hunt:
    "The hunt for a posted solution: every later capture of hidden.html " +
    "(2004–2012) is a 404 — the page died unforgiven. letters.html survives but " +
    "holds only fan mail (Attacker of Webfringe, L0rd Binary, others); Lord " +
    "Shinva's Hacking Encyclopedia Vol. 14 uses kr0mecorp.home.ml.org merely as " +
    "its proxy-tutorial example URL; and the open web preserves no solution. " +
    "Claimed solutions exist only as private memories — the address itself died " +
    "with Monolith, so even a correct answer can no longer be checked against " +
    "anything. Filed open, permanently.",
  trail:
    "The riddle's own pointer, kr0mecorp.home.ml.org, was a Monolith redirect. " +
    "Monolith Internet Services shut down on Dec 15, 1998 — the Wayback's captures " +
    "of the redirect are 301s into that funeral, so the address it pointed at is " +
    "gone from the record. By April 1999 the Tripod index itself read: \"This site " +
    "is closed. Special thanks and greetings to: Web Fringe … AEON Laboratories — " +
    "thanks for your invaluable help with channel 66 — Attacker.\"",
};

/* --------------------------------------------------------------- dss sites */

/** dr7.com — "DR7 DSS Digital Corruption — Digital Satellite Info You Can Trust!" */
export const DR7 = {
  name: "DR7 DSS Digital Corruption",
  url: "http://www.dr7.com/",
  years: "1998–2008",
  blurb:
    "A DirecTV/DSS smart-card site from the card wars: news (\"Paul Maxwell King " +
    "arrested\", Nov 21 1998), an ECM watch, a Ultimate.cgi forum, Echostar tools " +
    "(Rev052 disassembly by The Crack), and a /dssfiles/ depot of card utilities, " +
    "bin images and stealth scripts. Dozens of those files are captured 200-OK in " +
    "the Wayback and are first-class Ghidra targets.",
  files: [
    "26to34.zip|20001018050235|19236|H-card bin patch 26→34",
    "asic.zip|20000915230742|93724|ASIC gate-array material",
    "atr.zip|20000118205200|24337|ATR (answer-to-reset) collections",
    "axacard2.zip|20000118230808|35597|AXA card tooling",
    "axaprogrammer.zip|20000118004716|10364|card programmer software",
    "blocker25.zip|20000303080501|12798|ECM blocker v2.5",
    "dssstealthpro30b.zip|20000620092241|19145|DSS Stealth Pro 3.0b",
    "emulpcb.zip|20000118121022|16610|emulator PCB material",
    "examiner.zip|20000118141843|22169|card examiner",
    "openit.zip|20000915230729|223721|\"open it\" archive",
    "sc99tamper.zip|20000915230618|654574|SC99 tamper material",
    "su2code.zip|20001018072714|3491|SU2 code",
    "suv2.zip|20001017125031|27596|SU v2",
    "vcipherjulyfinalfix.zip|20000118171407|38735|VCipher final fix",
    "x2000-21a.zip|20001017123259|16448|x2000 2.1a",
    "x3m.zip|20000301122826|12586|3M script material",
    "spoofer8.zip|20001018151657|11353|Spoofer 8",
    "obiwan28.zip|20000407211609|11004|Obiwan 2.8",
    "phantom34.zip|20001018223458|13371|Phantom 3.4",
    "stealthchecker330.zip|20001017145656|11478|Stealth Checker 3.30",
  ].map((row) => {
    const [name, ts, warc, desc] = row.split("|");
    return { name, ts, warc: Number(warc), desc, url: `http://www.dr7.com/dssfiles/${name}` };
  }),
};

/** hackhu.com — the other great DSS depot; later a court-records archive. */
export const HACKHU = {
  name: "HackHu",
  url: "http://www.hackhu.com/",
  years: "1999–2005",
  blurb:
    "\"DSS Hacking, Scripts, Cloning, Bins, ZKT, Programmers, Unloopers\" — 475 " +
    "Wayback captures. Its files.htm served Script ID, Spoofer, Nitro3m, x2000. " +
    "After the card wars it turned into a court-records archive: the McKenzie " +
    "complaint, judgments against Clifford Jones, \"two brothers pirating and " +
    "fraud\" — DirecTV's lawsuits, filed by the scene itself.",
  url_note: "no per-file rows pinned here — use WARRICK MODE on hackhu.com/files.htm",
};

/** D.I.R.T. — the keylogger the user half-remembered. */
export const DIRT = {
  name: "D.I.R.T. (Data Interception by Remote Transmission)",
  vendor: "Codex Data Systems",
  years: "1998–2002",
  blurb:
    "The commercial remote-deploy keylogger/spyware: Codex Data Systems sold " +
    "D.I.R.T. to law enforcement, and in 2002 Cryptome published the program " +
    "itself — moredirt.zip (\"Enabled DIRT Program\"), dirty-war.zip (installer " +
    "+ guides) and the DIRT Reference Guide — alongside the story of DIRT's " +
    "author and Frank Jones's conviction.",
  cryptome: [
    ["dirt-files.htm", "the index page (still live on cryptome.org)"],
    ["dirt-guide.htm", "Reference Guide/Operations Manual (HTM)"],
    ["moredirt.zip", "the enabled D.I.R.T. program, 1.2 MB"],
    ["dirty-war.zip", "program + installation and user guide, 2.4 MB"],
    ["dirty-jones.htm", "D.I.R.T./Frank Jones conviction and probation docs"],
    ["dirty-secrets2.htm", "\"Data Interception by Remote Transmission\""],
  ].map(([file, desc]) => ({
    file,
    desc,
    url: `http://cryptome.org/${file}`,
    wayback: file === "dirt-files.htm" ? "captured" : "only 404/403 captures — the binaries were never archived",
  })),
  verdict:
    "The D.I.R.T. binaries are not in the Wayback Machine — every capture of " +
    "moredirt.zip and dirty-war.zip is a 404. The dossier stands on Cryptome's " +
    "own index and the 2002 Register coverage. If a copy surfaces elsewhere, " +
    "the drop zone feeds it straight into the same pipeline.",
};

/** satellitemurach.com — checked; the Wayback has nothing. */
export const SATMURACH = {
  name: "satellitemurach.com",
  blurb: "zero Wayback captures — not even a 404 was archived. A ghost in the CDX.",
};

/* ------------------------------------------------------------- shadow elf */

/**
 * The archivist's own homepage — "The Shadow Elf's Homepage",
 * www.geocities.com/SiliconValley/Park/8099. Every file the Wayback still
 * serves with a 200-OK, each row pinned with its CDX SHA-1 (base32) so the
 * recovery gate can verify before it displays. Rows: name|ts|warc|digest|desc.
 */
export const SHADOWELF = {
  name: "The Shadow Elf's Homepage",
  url: "http://www.geocities.com/SiliconValley/Park/8099/",
  years: "1998–2009 · 39 root captures",
  blurb:
    "The lab's own archivist grew up here: GeoCities SiliconValley/Park/8099, " +
    "“The Shadow Elf's Homepage” — a splash page that demands 800×600 and " +
    "Netscape Navigator 3.0, visitor-submitted C&C cheats, a links page naming " +
    "LoD, cDc, CCC, l0pht and the Jargon File, five MIDIs and one Flash toy. " +
    "Twenty-seven files still answer 200-OK in the Wayback; every one below is " +
    "recoverable through the same SHA-1 gate as the attack tools.",
  files: [
    "|19990204033556|1224|AFJVA4GH62S2THDX3TRWFHM4SYJEY4XI|splash page — “best viewed in 800x600 … Netscape Navigator 3.0”",
    "index2.htm|19990209035429|997|MKP5N3PN2KOBIL3JOVHJBFXW2ZHJWUWY|the real front door behind the splash",
    "intro.htm|19990209044842|4409|ODMNVK6R3UU4DCLG4SIZJ44M4VVLI2C7|",
    "menu.htm|19990209072941|1809|26HNIY7AP4TJMDBIH6UIQS5OU23MIADC|",
    "CC.html|19990208211722|5214|7O4IGSDNB4FOCYPKT4PDUWSGFG2C6U7D|Shadow Elf's C&C Cheats — visitor-submitted, submitter emails included",
    "cna.htm|19990208234501|3030|6FDZ4E4ELWUPR4KQGNC3ODU6FDCIOFXU|",
    "email.html|19990209003017|1333|BP5Y65QUYYSUYOTPTV3H3KFGVISZ6KCB|",
    "members.html|19990209053551|1134|DVVMVRJNQEBHKIN6K63KWLHYDLZRDKO7|",
    "news.html|19990209080858|1607|JP2LBNLDAEW7UZVYSGFMNV4ISVQENNP3|",
    "faq.html|19991007180747|1584|K4KZUD66WUCWS7SQJNV7ISGL3VNJO3OF|",
    "bio.html|20000310114657|889|B2XVQTA3AHMQXJLVAN2R23M6MVZES22B|",
    "sites.htm|19991008031725|4785|I557IBJ6HFY6DCADO635YSGEAHKQXDYD|the underground links page: LoD, cDc, CCC, l0pht, Jargon File, phreaking",
    "menu.jpg|20000430014404|44581|QE3KUKQUWCG33SBM2RJ54SOSWZTNUG63|menu image map",
    "shadow3.gif|20000428181046|735|D5PPR7OH33KUGF7XYZWFWDG3CF4FAZWO|the shadow-elf mark",
    "back3.jpg|20000830041708|7817|ZQFUTWSDSVLQCFAZZZBRXD7PEYWOVD4S|background tile",
    "ccring.jpg|20000422102508|12648|AEMXG3Z3EU6DVMY7O6EPSQTUUC3M7QEJ|C&C webring banner",
    "netbutton.gif|20000423202141|19756|MQBVICORB26DHVXIZOMK2VPMT2LDFDNR|“Netscape NOW” button",
    "lpagebutton.gif|20000429155307|2390|RWKK4WYEUSSB63VGZPSJTBB3CZYPRGU4|guestbook button",
    "line.gif|20000428151326|1754|7HV7AIHYXEP63F5QMNVXZBESWPNGQZZM|rule line",
    "hipline2.gif|20000428142634|4181|35AVBRMVYKYXPQMC3L2HOYQ75PSRAPBN|decoration",
    "palette.jpg|20000822140540|2138|MFJFI5LVH2GFYBFPF4N45TPXLW5BX46R|",
    "y-m-c-a.mid|20000229201855|5976|J4EDFCZ6OUFRPNG75VLKYRYSERTBDHN2|Village People, MIDI'd",
    "cool4.mid|20000619174019|5761|2SQRMOJM4NOMKZK6NCCBNZ5HT2LZH6HT|",
    "digital.mid|20000616182812|4387|BD4EZ7ULXUWCT7UY7YOCPOOKNHQPNH73|",
    "idontknow.mid|20000620013655|2718|7V5PCNCM2KJDUZAR6HZ3HGL77EHJLBRL|",
    "n13.mid|20000303110226|13109|BIKID7V457NNSXB5OCLC44QHKHTUQSUO|",
    "easiest.swf|20000619203827|7009|3YTOW2DVDCF2WTME6RQDVJGKFG45FJHQ|the Flash toy",
  ].map((row) => {
    const [name, ts, warc, digest, desc] = row.split("|");
    const base = "http://www.geocities.com/SiliconValley/Park/8099/";
    return {
      name: name || "index.html",
      ts, warc: Number(warc), digest, desc,
      url: name ? `${base}${name}` : base,
    };
  }),
};

/** Warrick — the inspiration for this lab's recovery mode. */
export const WARRICK = {
  name: "Warrick",
  url: "https://github.com/oduwsdl/warrick",
  blurb:
    "Frank McCown's Warrick (Old Dominion University, 2006; Memento redesign by " +
    "Justin Brunelle) reconstructs lost websites by walking the archives — the " +
    "same CDX→memento→local-file loop this lab runs, parallelized in Perl. The " +
    "sandbox cannot reach the archives over raw sockets, so our WARRICK MODE is " +
    "the browser-native rendition: the CDX listing is fetched in your tab and " +
    "every capture is SHA-1-gated before analysis.",
};

/* ------------------------------------------------- vx heavens / vcl ----- */

/**
 * VX HEAVENS — the Virus Creation Laboratory. Nowhere Man ([NuKE]) published
 * VCL 1.00 in July 1992: a menu-driven DOS IDE that writes commented assembler
 * for COM-infecting, companion and overwriting viruses, plus trojans and logic
 * bombs. VX Heavens' Constructors shelf still serves the [VCL]-cracked vcl.zip
 * with its shelf page, and textfiles.com mirrors VCL.DOC verbatim. Every row
 * below is a 200-OK capture pinned with its CDX SHA-1 (base32) at catalog time.
 */
export const VXHEAVENS = {
  name: "VX Heavens — Virus Creation Laboratory",
  url: "http://vxheavens.com/",
  years: "1992 (tool) · 1997–2014 (archive)",
  blurb:
    "VX Heavens called it the Virus Creation Laboratory: Nowhere Man's July-1992 " +
    "constructor that let anyone with no assembler produce COM viruses, trojans " +
    "and logic bombs from menus. The Constructors shelf still serves the " +
    "[VCL]-cracked vcl.zip (190,066 B per the shelf page, MD5 a82ac0a2…) with " +
    "its shelf page, and textfiles.com mirrors VCL.DOC word for word — all " +
    "seven captures pinned below with their CDX SHA-1, all recoverable through " +
    "the same gate as the kr0me and DSS cases. VCL.EXE itself is 16-bit " +
    "Borland C++ — the sweep's real target.",
  /** The shelf page's own record for vcl.zip (vx.php?id=tv03, Oct 10 2014). */
  shelf: {
    page: "vx.php?id=tv03",
    ts: "20141010043629",
    digest: "J3RQTZMI3G2BUJFSN7253OJCIUWP7SXP",
    file: "vcl.zip",
    size: 190066,
    md5: "a82ac0a215221e29b659c11fdffc84d3",
    note: "[VCL] (cracked version) · Jul 1992",
  },
  shelfNote:
    "Late summer 1992, Nowhere Man of the American group [NuKE] published VCL " +
    "1.00: a menu-driven IDE of near-commercial quality (mouse, drop-down " +
    "menus, separate installer, ICO/PIF for the Program Manager) that writes " +
    "commented assembler for COM-infecting, companion and overwriting viruses — " +
    "plus trojans and logic bombs — with selectable triggers (date, time, " +
    "infection count, country code, DOS version, free RAM) and payloads " +
    "(crash, corrupt, print, wipe whole disks, play a composed tune). The " +
    "shelf is candid about the flop: F-PROT caught most VCL viruses before VCL " +
    "was even analyzed, and much of its output won't assemble. In April 1994 " +
    "Firecracker (then NuKE) released a VCL Mutator to make VCL viruses " +
    "unscannable again — reported on the shelf page; no capture pinned yet.",
  /** Expected contents of vcl.zip, from the VCL.DOC File List (vcl.txt). */
  manifest: [
    ["INSTALL.EXE", "installation program — ties VCL to one machine (the shelf copy is the cracked build)"],
    ["INSTALL.DOC", "installer documentation"],
    ["NMVCL.ZIP", "remaining files (deleted after install)"],
    ["VCL.EXE", "main executable — Borland C++ 3.0 small model, the sweep's target"],
    ["VCL.CFG", "configuration file"],
    ["VCL.DAT", "routine data"],
    ["VCL.HLP", "on-line help"],
    ["VCL.DOC", "main documentation — this is vcl.txt, pinned below"],
    ["ROUTINES.DOC", "description of included routines"],
    ["EXAMPLES.DOC", "description of example creations"],
    ["FILE2DB.DOC", "documentation for FILE2DB"],
    ["KINISON.VCL … RICHARDS.VCL", "8 example creations (each + data files + .ASM + .COM)"],
  ],
  files: [
    {
      name: "vcl.zip", ts: "20141010085240", warc: 190060, digest: "JXGKSSLP5WW5TYZXJUISVXTAR3MB3ONW",
      md5: "a82ac0a215221e29b659c11fdffc84d3", url: "http://vxheavens.com/dl/gen/vcl.zip",
      desc: "[VCL] (cracked version), Jul 1992, 190,066 B — VCL.EXE + INSTALL.EXE + docs",
    },
    {
      name: "vcl32.zip", ts: "20141010054124", warc: 163187, digest: "I5FNKABEHIAVFO2XKILBXIQVBKUP3OKK",
      url: "http://vxheavens.com/dl/gen/vcl32.zip",
      desc: "VCL32 — later 32-bit build on the same shelf (contents unverified until recovered)",
    },
    {
      name: "nxvcl.zip", ts: "20141010053701", warc: 296728, digest: "EDCM227TCTTWQO4VIAQVTDEIZ4GAM7NK",
      url: "http://vxheavens.com/dl/gen/nxvcl.zip",
      desc: "NXVCL — companion build on the same shelf (contents unverified until recovered)",
    },
    {
      name: "tv03.shelf.html", ts: "20141010043629", warc: 4371, digest: "J3RQTZMI3G2BUJFSN7253OJCIUWP7SXP",
      url: "http://vxheavens.com/vx.php?id=tv03",
      desc: "Virus Creation Lab — the shelf page: history, Nowhere Man, vcl.zip MD5",
    },
    {
      name: "tidx.index.html", ts: "20101129093503", warc: 2767, digest: "MMDNZWPZ5V4FIM2NXMLJR56RO7UOGCRF",
      url: "http://vxheavens.com/vx.php?id=tidx",
      desc: "Virus Construction Tools index — 200 constructors",
    },
    {
      name: "Virus.DOS.VCL.collection.html", ts: "20141010092440", warc: 11267, digest: "6NN345DT3OZDJ4VNT3XEQNXKBXBC3CSD",
      url: "http://vxheavens.com/vl.php?dir=Virus.DOS.VCL",
      desc: "216 VCL-made samples cataloged with MD5 + SHA-1",
    },
    {
      name: "vcl.txt", ts: "20030128200211", warc: 8707, digest: "6ZMNQBZ3MVG5LYBMEYTI2DBVLJWQEKHS",
      url: "http://www.textfiles.com/virus/DOCUMENTATION/vcl.txt",
      desc: "Nowhere Man's VCL 1.00 documentation (VCL.DOC) via textfiles — digest-stable 2003–2012",
    },
  ],
  caveat:
    "Also in the library: archive.org/details/vxheavens-2010-05-18 — a 112 GB " +
    "snapshot (47 GB bz2 + 64 GB tar, 271,094 files) with a 2025 review " +
    "reporting corruption around 16% extraction. Too big for a browser tab and " +
    "untrusted until verified; the lab recovers the individual file captures " +
    "above instead.",
};

/**
 * TROJANLAIR — the September 2026 user lead ("the trojanlair in archive.org
 * might have the virus creation laboratory"), checked and honestly unconfirmed.
 * Nothing under that name exists in archive.org metadata or the Wayback under
 * any host spelling tried. If a URL surfaces, it gets pinned like the rest.
 */
export const TROJANLAIR = {
  name: "trojanlair",
  lead:
    "September 2026 user lead: the trojanlair in archive.org might hold the " +
    "Virus Creation Laboratory. Checked the library metadata, the likely " +
    "Wayback hosts, and the era link lists — nothing under that name exists " +
    "in either archive. The VCL itself needed no trojanlair: it sits on VX " +
    "Heavens' Constructors shelf, pinned above.",
  checked: [
    "archive.org metadata (identifiers, titles, descriptions, uploaders): zero hits for trojanlair in every spelling tried",
    "trojanlair.com + www.trojanlair.com: parked — 302s and robots.txt only, no content captures",
    "trojan-lair.com: robots.txt only · thetrojanlair.com: nothing at all",
    "trojanlair.tripod.com, members.tripod.com/~trojanlair, members.aol.com/trojanlair: no captures",
    "VX Heavens links + constructors index, textfiles.com/virus, Malware Museum items: no trojanlair entry",
  ],
  verdict:
    "UNCONFIRMED — the trojanlair lead names nothing the archives hold. " +
    "Standing offer: paste a URL and the lab will CDX-pin it and run it " +
    "through the same SHA-1 gate as every other case.",
};

/* ---------------------------------------------------------------- research */

export const METHOD = [
  {
    h: "Why hash-first",
    p: "The Wayback Machine's CDX index stores a SHA-1 (RFC-4648 base32) of every capture's original bytes. The recovery console asks the index for the digest of the exact pinned capture, fetches the raw capture (the id_ variant, no toolbar), hashes it with WebCrypto and refuses to hand anything to the disassembler unless the two match. A mismatch is displayed, never hidden: it means Tripod's later error pages or a re-encode leaked in — and that capture becomes evidence of that instead.",
  },
  {
    h: "What the lab does with a recovered file",
    p: "Zips are opened with fflate in memory. Every member is sniffed (MZ / NE / LE / PE / COM / text) and can be pushed through the same pipeline the virus lab uses: a linear-sweep + recursive-descent x86 disassembler (16- and 32-bit), technique tables, an entropy map, and Ghidra's C++ decompiler compiled to WebAssembly with vendored SLEIGH specs. Nothing is ever executed — several of these zips are, after all, attack tools.",
  },
  {
    h: "Why the browser, not a server",
    p: "The recovery step is the only part of the lab that touches the network, and it runs in your tab against web.archive.org and archive.org directly. There is no backend here; the sandbox that builds this page cannot even reach the Wayback Machine. What ships in the repo is the manifest, the timestamps and the code — the bytes come to you from the archives, and the analysis never leaves your machine.",
  },
  {
    h: "Ground rules",
    p: "Static analysis only. The attack tools here target operating systems that stopped receiving patches when XP was young; they are studied the way the virus corpus in the main lab is studied — as machine code that documents an era. Nothing is executed, nothing is re-hosted, and every artifact points back at its archive.org capture.",
  },
];

export const REFERENCES = [
  { label: "Wayback CDX index — members.tripod.com/~retrotech", url: "https://web.archive.org/cdx/search/cdx?url=members.tripod.com/~retrotech/*&output=json" },
  { label: "kr0me corp index capture (Dec 5, 1998)", url: "https://web.archive.org/web/19981205065406/http://members.tripod.com/~retrotech/" },
  { label: "Kr0me Corp archive catalogue (May 8, 1999)", url: "https://web.archive.org/web/19990508015502/http://members.tripod.com/~retrotech/files.html" },
  { label: "GeoCities hacking links page indexing kr0mecorp", url: "https://www.oocities.org/timessquare/lair/6606/hacks1.html" },
  { label: "Internet Archive — Rodger Ramrod (shareware, stream-only)", url: "https://archive.org/details/msdos_Rodger_Ramrod_1996" },
  { label: "Internet Archive — Rodger Ramrod full game (public domain mark)", url: "https://archive.org/details/cdfwps" },
  { label: "Internet Archive — eXoDOS v5.2 (the byte-identical repack)", url: "https://archive.org/details/exov5_2" },
  { label: "src-62 — the Rodger Ramrod HTML5 wrapper in this repository", url: "https://github.com/shdwelf/Html5/blob/arena/01a098c1-html5/resources/src-62-rodger-ramrod-html5-app.md" },
];
