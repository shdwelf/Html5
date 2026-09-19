#!/usr/bin/env node
/**
 * verify_casefiles.mjs — headless proof for the CASEFILES lab.
 *
 *   node tools/serve.mjs 8099 &          # any static server works
 *   node tools/verify_casefiles.mjs 8099
 *
 * Checks, in order:
 *   1. catalog integrity — names, timestamps, lengths, kinds, URL builders
 *   2. base32/SHA-1 plumbing — RFC-4648 round-trips + the SHA-1("abc") vector
 *   3. the MZ sniffer on the repository's demo.exe (replicated header math)
 *   4. the recovery-member path — a synthetic zip → unzipSync → MZ member
 *   5. the real Ghidra wasm decompiles what the sniffer routed to it
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { unzipSync, zipSync, strFromU8, unzlibSync, zlibSync } from "../vendor/fflate/index.mjs";
import { parseSWF, parseMIDI, parseGIF, parseJPEG, parsePNG, dissect } from "../js/artifacts.js";
import { analyze } from "../js/x86dis.js";
import { GhidraWasm } from "../js/ghidra-wasm.js";
import {
  SITE, LIBRARY, NOT_CAPTURED, CURATED, RAMROD, METHOD, REFERENCES,
  RIDDLE, DR7, HACKHU, DIRT, SATMURACH, WARRICK, SHADOWELF,
  VXHEAVENS, TROJANLAIR, TROJANSLAIR, HUUNLOOPER, MAKINT, PERIPHERALS,
  waybackUrl, waybackView, cdxUrl,
} from "../js/krome-catalog.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const PORT = Number(process.argv[2] || process.env.PORT || 8099);
const BASE = `http://127.0.0.1:${PORT}`;

let failures = 0;
const check = (ok, label) => {
  console.log(`   ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures++;
};

/* ------------------------------------------------------------------ catalog */

console.log("── catalog");
check(LIBRARY.length > 100, `library has ${LIBRARY.length} captures`);
const names = new Set();
let catalogOk = true;
for (const e of LIBRARY) {
  if (names.has(e.name)) { catalogOk = false; console.log(`   duplicate name: ${e.name}`); }
  names.add(e.name);
  if (!/^\d{14}$/.test(e.ts)) { catalogOk = false; console.log(`   bad ts: ${e.name} ${e.ts}`); }
  if (!(e.warc > 0)) { catalogOk = false; console.log(`   bad length: ${e.name}`); }
  if (!(e.kind in { z: 1, h: 1, t: 1, "!": 1 })) { catalogOk = false; console.log(`   bad kind: ${e.name} ${e.kind}`); }
  if (!e.name.startsWith("winGateScan") && e.name !== e.name.toLowerCase()) { catalogOk = false; console.log(`   unexpected case: ${e.name}`); }
}
check(catalogOk, "every row: unique name, 14-digit timestamp, positive length, known kind");
check(names.has("winnuke.zip") && names.has("land.zip") && names.has("kr0menfo.zip"), "landmark files present");
check(CURATED["winnuke.zip"]?.body.length > 40, "curated notes attached");
check(NOT_CAPTURED.length === 12, `not-captured list: ${NOT_CAPTURED.length}/12`);
check(METHOD.length === 4 && REFERENCES.length >= 7, "research blocks present");

check(
  waybackUrl("winnuke.zip", "19990203131809") === "https://web.archive.org/web/19990203131809id_/http://members.tripod.com/~retrotech/winnuke.zip",
  "wayback id_ URL builder",
);
check(
  cdxUrl("winnuke.zip", "19990203131809").startsWith("https://web.archive.org/cdx/search/cdx?url=http") && cdxUrl("winnuke.zip", "19990203131809").includes("timestamp=19990203131809"),
  "CDX digest URL builder",
);

check(RAMROD.shareware.md5 === RAMROD.exodos.md5, "shareware zip and eXoDOS repack share the metadata md5");
check(RAMROD.shareware.sha1.length === 40 && RAMROD.full.sha1.length === 40, "ramrod sha1 fields are 40 hex chars");

console.log("── dossier additions");
check(RIDDLE.text.length === 6 && RIDDLE.text[5].includes("fugitive"), "riddle transcribed (6 lines, fugitive ending)");
check(RIDDLE.pointer === "http://kr0mecorp.home.ml.org", "riddle pointer recorded");
check(DR7.files.length >= 20 && DR7.files.every((f) => f.url.startsWith("http://www.dr7.com/dssfiles/")), `DR7 curated files: ${DR7.files.length}`);
check(HACKHU.blurb.includes("Unloopers") && DIRT.cryptome.length >= 6, "hackhu + DIRT dossier rows");
check(SATMURACH.blurb.includes("zero Wayback captures"), "satellitemurach ghost recorded");
check(WARRICK.url.includes("oduwsdl/warrick"), "warrick credited");
check(typeof RIDDLE.hunt === "string" && RIDDLE.hunt.includes("no solution"), "riddle solution-hunt verdict recorded");
check(
  RIDDLE.reading.includes("order-corrected shape is 47.26.47.80") && RIDDLE.reading.includes("never one of the four"),
  "riddle reading applies the riddle's own ordering (King excluded)",
);
{
  const f = SHADOWELF.files;
  const b32 = /^[A-Z2-7]{32}$/;
  const uniq = new Set(f.map((x) => x.name));
  check(
    f.length === 27 && uniq.size === f.length &&
    f.every((x) => /^\d{14}$/.test(x.ts) && b32.test(x.digest) && x.warc > 0) &&
    f.every((x) => x.url.startsWith("http://www.geocities.com/SiliconValley/Park/8099/")) &&
    f.some((x) => x.name === "index.html" && x.url === SHADOWELF.url) &&
    f.some((x) => x.name === "CC.html") && f.some((x) => x.name === "easiest.swf"),
    `shadowelf: ${f.length} pinned rows, unique names, 14-digit ts, 32-char base32 digests`,
  );
  check(f.every((x) => !x.desc || typeof x.desc === "string"), "shadowelf descriptions optional strings");
}
{
  const suite = readFileSync(join(ROOT, "apps", "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html"), "utf8");
  const lectureOk =
    suite.includes('id:"kr0mecorp"') &&
    suite.includes('title:"Kr0meCorp: the hidden.html Riddle"') &&
    suite.includes('confidence:"Primary archive"') &&
    suite.includes("MMOS2TQI5722PUSYVTROIMSZEYIJH5G4") &&
    suite.includes("order-corrected atomic candidates") &&
    suite.includes("Riddle") &&
    !suite.includes("deliberately does not invent");
  check(lectureOk, "cipher suite lecture hall: kr0mecorp record replaced with primary-source dossier");
  check(
    suite.includes('id:"shadowelf"') === false, // lecture hall stays casefiles-free; shadowelf lives in the lab
    "cipher suite lecture hall: no lab-case leakage",
  );
}

/* --------------------------------------- vx heavens / vcl lab (wave 5) ---- */

console.log("── vx heavens / virus creation lab");
{
  const f = VXHEAVENS.files;
  const b32 = /^[A-Z2-7]{32}$/;
  const uniq = new Set(f.map((x) => x.name));
  check(
    f.length === 7 && uniq.size === f.length &&
    f.every((x) => /^\d{14}$/.test(x.ts) && b32.test(x.digest) && x.warc > 0 && x.url.startsWith("http://")) &&
    f.filter((x) => x.name.endsWith(".zip")).length === 3,
    `vxheavens: ${f.length} pinned rows, unique names, 14-digit ts, 32-char base32 digests, 3 zips`,
  );
  const vcl = f.find((x) => x.name === "vcl.zip");
  check(
    vcl.ts === "20141010085240" && vcl.digest === "JXGKSSLP5WW5TYZXJUISVXTAR3MB3ONW" &&
    vcl.md5 === "a82ac0a215221e29b659c11fdffc84d3" && vcl.url === "http://vxheavens.com/dl/gen/vcl.zip",
    "vcl.zip pinned: 2014 capture + CDX sha1 + shelf md5",
  );
  const doc = f.find((x) => x.name === "vcl.txt");
  check(
    doc.digest === "6ZMNQBZ3MVG5LYBMEYTI2DBVLJWQEKHS" && doc.url.includes("textfiles.com"),
    "vcl.txt (VCL.DOC) pinned via textfiles",
  );
  check(
    VXHEAVENS.manifest.length >= 10 && VXHEAVENS.shelf.md5 === "a82ac0a215221e29b659c11fdffc84d3" &&
    VXHEAVENS.shelfNote.includes("Firecracker") && VXHEAVENS.caveat.includes("vxheavens-2010-05-18"),
    "vcl manifest + shelf record + snapshot caveat present",
  );
  check(
    TROJANLAIR.verdict.includes("UNCONFIRMED") && TROJANLAIR.checked.length >= 5,
    "trojanlair lead checked and honestly unconfirmed",
  );
  const cf5 = readFileSync(join(ROOT, "js", "casefiles.js"), "utf8");
  check(
    cf5.includes("renderVclPanel") && cf5.includes("renderVclDossier") &&
    cf5.includes("btnVclSweep") && cf5.includes("vclGhidraReport") && cf5.includes("vclRecovered") &&
    cf5.includes("vcl: {") && cf5.includes('if (id === "vcl")'),
    "casefiles wiring: VCL case entry + panel + dossier + sweep ids",
  );
}

/* --------------------------------------- trojan's lair depot (wave 6) ----- */

console.log("── trojan's lair");
{
  const f = TROJANSLAIR.files;
  const b32 = /^[A-Z2-7]{32}$/;
  const uniq = new Set(f.map((x) => x.name));
  check(
    f.length === 20 && uniq.size === f.length &&
    f.every((x) => /^\d{14}$/.test(x.ts) && b32.test(x.digest) && x.warc > 0 && x.url.startsWith("http://")) &&
    f.filter((x) => x.name.endsWith(".exe")).length === 12,
    `trojanslair: ${f.length} pinned rows, unique names, 14-digit ts, 32-char base32 digests, 12 exes`,
  );
  const sub = f.find((x) => x.name === "backdoors/Subseven.2.2.exe");
  check(
    sub.ts === "20010723022437" && sub.digest === "WL7XYRC5PABMHXOXH6QIPMRNP7GVH73L" &&
    sub.url === "http://www.tlsecurity.net/backdoors/Subseven.2.2.exe",
    "subseven 2.2 pinned: 2001 capture + CDX sha1",
  );
  const bio = f.find((x) => x.name === "backdoors/Backdoor.Bionet.3.12.unpacked.exe");
  check(
    bio.digest === "SPLWRUKN6RLSGAQ2XWP6TZ2VE7HVA5BI" && bio.ts === "20020607041431",
    "bionet 3.12 unpacked pinned",
  );
  const door = f.find((x) => x.name === "doorway/index.html");
  check(
    door.digest === "OOR6MPJYCJ4B45SVKKZBT3TQRYJQJWE6" && door.url === "http://www.trojanslair.com/",
    "trojanslair.com doorway pinned",
  );
  check(
    TROJANSLAIR.shelves.includes("/Incoming/Backdoor") && TROJANSLAIR.blurb.includes("trojanslair.org"),
    "trojanslair shelf map + .org verdict present",
  );
  const cf6 = readFileSync(join(ROOT, "js", "casefiles.js"), "utf8");
  check(
    cf6.includes("renderTrojanPanel") && cf6.includes("renderTrojanDossier") &&
    cf6.includes("btnTrojanSweep") && cf6.includes("trojanGhidraReport") && cf6.includes("trojanRecovered") &&
    cf6.includes("trojanslair: {") && cf6.includes('if (id === "trojanslair")'),
    "casefiles wiring: trojan case entry + panel + dossier + sweep ids",
  );
}

/* ----------------------------------------------- HU unlooper shelf (wave 7) ----- */

console.log("── hu unlooper");
{
  const s = HUUNLOOPER.scripts;
  const hex = (n) => new RegExp(`^[0-9a-f]{${n}}$`);
  check(
    s.length === 9 &&
    s.every((x) => hex(40).test(x.sha1) && hex(32).test(x.md5) && hex(8).test(x.crc32) && x.bytes > 0 && x.note.length > 10),
    `huunloop scripts: ${s.length} rows, full md5/sha1/crc32 each`,
  );
  const ul4 = s.find((x) => x.name === "UL4S_10.xvb");
  const turbo = s.find((x) => x.name === "TurboUnloop_1.1.xvb");
  check(
    ul4.bytes === 13240 && ul4.sha1 === "d90d12bfb6f3e4b2e8d30a8606e0af71ca5abd07" && ul4.note.includes("Gibling") &&
    turbo.bytes === 76247 && turbo.sha1 === "9a6d11311c60c2481f6f0724efbeb4a7518a1e34",
    "UL4S_10 + TurboUnloop 1.1 pins hold",
  );
  const p = HUUNLOOPER.pe;
  check(
    p.length === 2 && p[1].bytes === 1249280 && p[1].sha1 === "9a263bbec3b8b1149080dae7bd39391f48f47ab4" &&
    p[0].note.includes("PACKED") && p[1].note.includes(".pdata"),
    "WinExplorer 4.6/5.0 pins hold (packed verdicts attached)",
  );
  const f = HUUNLOOPER.files;
  const b32 = /^[A-Z2-7]{32}$/;
  const uniq = new Set(f.map((x) => x.name));
  check(
    f.length === 17 && uniq.size === f.length &&
    f.every((x) => /^\d{14}$/.test(x.ts) && b32.test(x.digest) && x.warc > 0 && x.url.startsWith("http://")) &&
    f.filter((x) => x.name.endsWith(".zip")).length === 10,
    `huunloop captures: ${f.length} pinned rows, 10 zips for the sweep`,
  );
  const su2 = f.find((x) => x.name === "dssfiles/su2code.zip");
  check(
    su2.ts === "20001018072714" && su2.digest === "GEHCOEHW4ZAWR2NWFKUZFHM4XCIW4FMA" && su2.warc === 3491,
    "su2code.zip pinned: 2000 capture + CDX sha1",
  );
  const wv = f.find((x) => x.name === "reviews/whiteviper/WhiteViperXunlooper_review.htm");
  const hh = f.find((x) => x.name === "descriptions/huhack.txt");
  check(
    wv.digest === "HC2M6XHQMJMVPGMYM5PRZL4QIKFTUITZ" && hh.digest === "KV3NSDFPRL4JM5VM563OJ7T27ZTSGYXR",
    "WhiteViperX review + HUHack doctrine pinned",
  );
  const ms = f.find((x) => x.name === "makstripe.zip");
  check(
    ms.digest === "K65J3QAURDS37Z4KLYCDEUBMHVKSK3YK" && ms.warc === 2341373 && ms.url.includes("makinterface.net"),
    "MAKStripe software drop pinned (Dec 2005)",
  );
  check(
    HUUNLOOPER.blurb.includes("AT90S2313") && HUUNLOOPER.blurb.includes("UL4S") &&
    HUUNLOOPER.ghidra.includes("analyzeHeadless") && HUUNLOOPER.ghidra.includes("capstone") &&
    HUUNLOOPER.dive.includes("Digital-Laboratory") && HUUNLOOPER.dive.includes("MAKInterface"),
    "ghidra verdict + deep-dive + digital-laboratory resolution in text",
  );
  const cf7 = readFileSync(join(ROOT, "js", "casefiles.js"), "utf8");
  check(
    cf7.includes("renderHuunloopPanel") && cf7.includes("renderHuunloopDossier") &&
    cf7.includes("btnHuSweep") && cf7.includes("huGhidraReport") && cf7.includes("huRecovered") &&
    cf7.includes("huunloop: {") && cf7.includes('if (id === "huunloop")'),
    "casefiles wiring: huunloop case entry + panel + dossier + sweep ids",
  );
  const { createHash } = require("node:crypto");
  const rehash = [...HUUNLOOPER.scripts, ...HUUNLOOPER.pe].map((a) => {
    const bytes = readFileSync(join(ROOT, "samples", "hu-unlooper", a.name));
    return bytes.length === a.bytes && createHash("sha1").update(bytes).digest("hex") === a.sha1;
  });
  check(
    rehash.length === 11 && rehash.every(Boolean),
    `in-repo bytes re-hashed live: ${rehash.filter(Boolean).length}/11 match the catalog`,
  );
}

/* ---------------------------------------------------- MAKInterface (wave 8) */

console.log("── MAKInterface + port peripherals (wave 8)");
{
  const b32 = /^[A-Z2-7]{32}$/;
  const f = MAKINT.files;
  const uniq = new Set(f.map((x) => x.name));
  check(
    f.length === 22 && uniq.size === f.length &&
    f.every((x) => /^\d{14}$/.test(x.ts) && b32.test(x.digest) && x.warc > 0 &&
      x.url.startsWith("http://www.makinterface.net/")),
    `makinterface depot: ${f.length} pinned rows (5 wave-7 + 8 archives + 9 pages), ts + CDX sha1 + length each`,
  );
  // the five wave-7 pins must not have drifted
  const wave7 = {
    "dms.zip": "MKU573ISDNMH7NJFCCWI64NFXQ7GVPRK",
    "MaksAct.zip": "ALM5LHEYGZFES7XMAKRWRHZ3LKHFM47K",
    "makstripe.zip": "K65J3QAURDS37Z4KLYCDEUBMHVKSK3YK",
    "makstripee.zip": "SPLNPY3WHCD4ILZ3P4OREVITSVHOSQ3R",
    "Pinout.zip": "GOBEFEPET63CQHNJNPO6LCEX2JC5L646",
  };
  const drift = Object.entries(wave7).filter(([name, digest]) => {
    const row = f.find((x) => x.name === name);
    return !row || row.digest !== digest;
  });
  check(drift.length === 0, "the five December-2005 drops hold their wave-7 digests");
  const zips = f.filter((x) => x.name.toLowerCase().endsWith(".zip"));
  check(zips.length === 13, `${zips.length} archives ride the sweep (5 pinned + 8 added this wave)`);
  // PRSC.ZIP is SCPROG.ZIP's bytes under a new name — assert the *documented* digest,
  // not the identity, because only PRSC.ZIP is pinned in the table.
  check(
    f.find((x) => x.name === "PRSC.ZIP").digest === "4OIYHEDGZD62BCFIKOEEX2JJMDGX2SPW" &&
    f.find((x) => x.name === "PRSC.ZIP").desc.includes("SCPROG.ZIP"),
    "PRSC/SCPROG rename caught in the pin itself",
  );
  check(
    MAKINT.port.connector.includes("serial") && MAKINT.port.quote.includes("25pole serial port") &&
    MAKINT.port.parallelIsFor.includes("Parallel Ports on the PC are required"),
    "port verdict: serial by default, parallel only for the PROM kit + art. 00605",
  );
  const P = MAKINT.pinouts;
  check(
    P.reader.Reset === "Maki 6" && P.emulator.Reset === "Maki 5" &&
    P.reader.CLK === "Maki 7" && P.emulator.CLK.startsWith("none") &&
    P.reader.IO === "Maki 1+2" && P.emulator.IO === "Maki 1+2" &&
    P.reader.GND === "Maki 4" && P.emulator.GND === "Maki 4",
    "smart-card reader vs emulator rows transcribed from pinout_e.php3",
  );
  check(
    MAKINT.emulation.vendorProducts.includes("00519") && MAKINT.emulation.vendorProducts.includes("00524") &&
    MAKINT.emulation.universalPcb.includes("90S8515") && MAKINT.emulation.universalPcb.includes("24C65") &&
    MAKINT.emulation.answer.includes("js/makint.js"),
    "emulator products + the 00529 chip recipes + where the model lives",
  );
  check(
    MAKINT.disasm.includes("pydisasm") && MAKINT.disasm.includes("1438") &&
    MAKINT.upstream.protocol.includes("38400") && MAKINT.upstream.note.includes("no LICENSE"),
    "disassembly verdict: what ran here, the protocol, and why upstream is not re-hosted",
  );
  check(
    PERIPHERALS.cuecat.what.includes("68-1965") && PERIPHERALS.cuecat.what.includes("modified base64") &&
    PERIPHERALS.cuecat.disasm.includes("No firmware image survives") &&
    PERIPHERALS.clik.what.includes("40 MB") && PERIPHERALS.clik.disasm.includes("IDENTIFY"),
    ":CueCat + Iomega Clik! documented with their honest limits",
  );

  // the module the UI drives, exercised here so a stale export cannot pass
  const mi = await import("../js/makint.js");
  const atr = mi.atrBuild({ ta1: 0x11, td1: 0x50, hist: [0, 0x62] });
  const info = mi.atrParse(atr);
  check(info.tckValid && info.Fi === 372 && info.protocol === 0, "makint.js builds and re-parses its ATR");
  check(Math.abs(mi.etuUs(mi.CRYSTALS.shipped.hz) - 103.924) < 0.01, "shipping crystal → 103.9 µs ETU");
  const benchCard = mi.makeCardImage();
  const frames = mi.resetAndAnswer(benchCard);
  check(
    frames.bytes === benchCard.atr.length && frames.frames.every((fr) => fr.length === 13),
    "reset cycle frames one character per ATR byte, 13 slots each");
  check(
    mi.cuecatDecode("ENr7C3n1C3PWD3rYCxzYChnZ") === "978006093471251300" &&
    mi.cuecatDecode("fbmxChO") === "WPT39",
    ":CueCat decode matches the published vectors",
  );
  check(mi.MAK_HEADER.emulatedCards.length === 9 && mi.SCOPE.includes("no credential"),
    "emulated-card table complete and the scope note present");
  check(
    readFileSync(join(ROOT, "samples", "makint", "analysis.json"), "utf8").includes("woodlands_bulk"),
    "samples/makint/analysis.json present and carries the .mag corpus facts",
  );
  const cf8 = readFileSync(join(ROOT, "js", "casefiles.js"), "utf8");
  check(
    cf8.includes("renderMakintPanel") && cf8.includes("renderMakintDossier") &&
    cf8.includes("runMakintBench") && cf8.includes("btnMiSweep") && cf8.includes("miBench") &&
    cf8.includes("makint: {") && cf8.includes('if (id === "makint")'),
    "casefiles wiring: makint case entry + panel + bench + dossier + sweep ids",
  );
}

/* --------------------------------------------- artifact dissectors (wave 4) */

console.log("── artifact dissectors");
{
  const enc = new TextEncoder();
  const rectBytes = (x0, y0, x1, y1) => {
    const push = (a, v, n) => { for (let i = n - 1; i >= 0; i--) a.push((v >> i) & 1); };
    const s = []; push(s, 16, 5); [x0, y0, x1, y1].forEach((v) => push(s, v, 16));
    while (s.length % 8) s.push(0);
    const out = new Uint8Array(s.length / 8); s.forEach((b, i) => (out[i >> 3] |= b << (7 - (i & 7)))); return out;
  };
  const tag = (code, payload) => {
    const len = payload.length, cl = len < 0x3f ? (code << 6) | len : (code << 6) | 0x3f;
    const h = len < 0x3f ? [cl & 255, cl >> 8] : [cl & 255, cl >> 8, len & 255, (len >> 8) & 255, (len >> 16) & 255, (len >> 24) & 255];
    return new Uint8Array([...h, ...payload]);
  };
  const body = new Uint8Array([
    ...rectBytes(0, 0, 11000, 8000), 0, 12, 1, 0,
    ...tag(9, new Uint8Array([0x11, 0x22, 0x33])),
    ...tag(43, new Uint8Array([...enc.encode("frame1"), 0])),
    ...tag(12, new Uint8Array([0x83, 28, 0, ...enc.encode("http://kr0mecorp.example"), 0, ...enc.encode("_level0"), 0, 0])),
    0, 0,
  ]);
  const L = body.length + 8, fl = new Uint8Array([L & 255, (L >> 8) & 255, (L >> 16) & 255, (L >> 24) & 255]);
  const fws = parseSWF(new Uint8Array([0x46, 0x57, 0x53, 4, ...fl, ...body]), unzlibSync);
  check(!!fws && fws.width === 550 && fws.height === 400 && fws.fps === 12 && fws.frames === 1, `swf FWS: ${fws?.width}×${fws?.height} @ ${fws?.fps}fps, ${fws?.frames} frame`);
  const cws = parseSWF(new Uint8Array([0x43, 0x57, 0x53, 4, ...fl, ...zlibSync(body)]), unzlibSync);
  check(!!cws && cws.width === 550 && cws.tags.some((t) => t.name === "DoAction") && cws.actions.urls[0]?.url === "http://kr0mecorp.example", `swf CWS: ${cws?.tags.length} tags, GetURL → ${cws?.actions.urls[0]?.url}`);
  const vlq = (n) => { const b = [n & 0x7f]; while (n >>= 7) b.unshift((n & 0x7f) | 0x80); return b; };
  const trk = new Uint8Array([
    0, 0xff, 0x03, ...vlq(6), ...enc.encode("Shadow"),
    0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20, // 500000 µs/qn = 120 bpm
    0, 0xc0, 40,
    0, 0x90, 60, 100, 60, 0x80, 60, 0,
    0, 0xff, 5, ...vlq(2), ...enc.encode("Y!"), 0, 0xff, 5, ...vlq(2), ...enc.encode("M!"),
    0, 0xff, 0x2f, 0,
  ]);
  const midiBytes = new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 1, 0xe0, 0x4d, 0x54, 0x72, 0x6b, (trk.length >>> 24) & 255, (trk.length >>> 16) & 255, (trk.length >>> 8) & 255, trk.length & 255, ...trk]);
  const mid = parseMIDI(midiBytes);
  check(!!mid && mid.tracks[0]?.name === "Shadow" && mid.tracks[0]?.bpm === 120 && mid.tracks[0]?.program === 40 && mid.tracks[0]?.noteOns === 1, `midi: "${mid?.tracks[0]?.name}" ${mid?.tracks[0]?.bpm}bpm program ${mid?.tracks[0]?.program}, ${mid?.tracks[0]?.noteOns} note-on, lyrics [${mid?.tracks[0]?.lyrics}]`);
  const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 4, 0, 2, 0, 0x80, 0, 0, ...new Array(48).fill(0), 0x21, 0xfe, 3, 0x68, 0x69, 0x21, 0, 0x2c, 0, 0, 0, 0, 4, 0, 2, 0, 0, 2, 0x02, 0x44, 0x01, 0, 0x3b]);
  const gif = parseGIF(gifBytes);
  check(!!gif && gif.width === 4 && gif.height === 2 && gif.comments[0] === "hi!", `gif: ${gif?.width}×${gif?.height}, comment "${gif?.comments[0]}"`);
  const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xfe, 0, 5, 0x68, 0x69, 0x21, 0xff, 0xc0, 0, 0x0b, 8, 0, 2, 0, 8, 1, 0x11, 0, 0x11, 0, 0xff, 0xd9]);
  const jpg = parseJPEG(jpgBytes);
  check(!!jpg && jpg.width === 8 && jpg.height === 2 && jpg.sof === "SOF0" && jpg.comments[0] === "hi!", `jpeg: ${jpg?.width}×${jpg?.height} ${jpg?.sof}, comment "${jpg?.comments[0]}"`);
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 4, 0, 0, 0, 2, 8, 2, 0, 0, 0, 0, 0, 0, 0]);
  const png = parsePNG(pngBytes);
  check(!!png && png.width === 4 && png.height === 2 && png.depth === 8, `png: ${png?.width}×${png?.height} ${png?.depth}-bit`);
  check(
    dissect(new Uint8Array([0x46, 0x57, 0x53, 4, ...fl, ...body]), unzlibSync)?.type === "swf" &&
    dissect(midiBytes)?.type === "midi" && dissect(gifBytes)?.type === "gif" &&
    dissect(jpgBytes)?.type === "jpeg" && dissect(pngBytes)?.type === "png" &&
    dissect(new Uint8Array(64)) === null,
    "dissect router: swf/midi/gif/jpeg/png routed, non-structures rejected",
  );
  const cf = readFileSync(join(ROOT, "js", "casefiles.js"), "utf8");
  check(
    cf.includes("async function ghidraSweep(") && cf.includes("async function fetchVerified(") &&
    cf.includes("function staticPass(") && cf.includes("dissect(bytes, unzlibSync)") &&
    cf.includes("GHIDRA SWEEP") && cf.includes("kromeGhidraReport") && cf.includes("dssGhidraReport"),
    "casefiles wiring: ghidraSweep + fetchVerified + staticPass + structure views + both sweep buttons",
  );
}

/* --------------------------------------------------------------- base32 */

console.log("── base32 / sha1 plumbing");
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(bytes) {
  let bits = 0, val = 0, out = "";
  for (const b of bytes) {
    val = ((val << 8) | b) >>> 0;
    bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
function b32ToHex(b32) {
  let bits = 0, val = 0; const out = [];
  for (const ch of b32.toUpperCase()) {
    const idx = B32.indexOf(ch);
    if (idx < 0) return null;
    val = (val << 5) | idx; bits += 5;
    if (bits >= 8) { out.push(((val >>> (bits - 8)) & 0xff).toString(16).padStart(2, "0")); bits -= 8; }
  }
  return out.join("");
}
const { createHash, randomBytes } = await import("node:crypto");
const abcDigest = createHash("sha1").update("abc").digest(); // a9993e364706816aba3e25717850c26c9cd0d89d
const abcB32 = base32(abcDigest);
check(abcB32.length === 32, `sha1("abc") base32 is 32 chars: ${abcB32}`);
check(b32ToHex(abcB32) === abcDigest.toString("hex"), "base32 → hex matches node:crypto sha1");

let roundTrip = true;
for (let i = 0; i < 50; i++) {
  const buf = randomBytes(1 + Math.floor(Math.random() * 64));
  if (b32ToHex(base32(buf)) !== buf.toString("hex")) { roundTrip = false; break; }
}
check(roundTrip, "50 random round-trips base32 ↔ bytes");

/* ------------------------------------------------------------- MZ sniffer */

console.log("── sniffer + loader math (demo.exe)");
function sniffMZ(bytes) {
  if (bytes.length < 2 || bytes[0] !== 0x4d || bytes[1] !== 0x5a) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const cparhdr = dv.getUint16(0x08, true);
  const cs = dv.getUint16(0x16, true);
  const ip = dv.getUint16(0x14, true);
  const loadSeg = cparhdr << 4;
  let entry = loadSeg + (cs << 4) + ip;
  let clipped = false;
  if (entry >= bytes.length && loadSeg + ip < bytes.length) { entry = loadSeg + ip; clipped = true; }
  if (entry >= bytes.length) { entry = loadSeg; clipped = true; }
  return { kind: "MZ", cparhdr, cs, ip, loadSeg, entry, clipped };
}

const demo = new Uint8Array(readFileSync(join(ROOT, "demo.exe")));
const demoMeta = sniffMZ(demo);
check(!!demoMeta, `demo.exe sniffed as MZ (header ${demoMeta?.cparhdr << 4} B, entry 0x${demoMeta?.entry.toString(16)}${demoMeta?.clipped ? " clipped" : ""})`);
const demoAnalysis = analyze(demo, { base: demoMeta.loadSeg, entry: demoMeta.entry, mode: 16 });
const demoInsns = [...demoAnalysis.insns.values()].filter((i) => !i.data);
check(demoInsns.length >= 5, `demo.exe sweep: ${demoInsns.length} instructions, ${demoAnalysis.codeBytes} code bytes`);
const demoMnemonics = demoInsns.map((i) => i.repr.split(/\s/)[0]);
check(demoMnemonics.includes("int"), "demo.exe reaches its INT 21h calls");

/* ---------------------------------------------- recovery path: zip → member */

console.log("── recovery path (synthetic zip → unzipSync → member)");
const memberCode = new Uint8Array(64);
{
  const dv = new DataView(memberCode.buffer);
  memberCode.set([0x4d, 0x5a], 0);
  dv.setUint16(0x02, memberCode.length % 512, true); // e_cblp
  dv.setUint16(0x04, 1, true);                       // e_cp
  dv.setUint16(0x08, 2, true);                       // e_cparhdr = 2 paras (32 B header)
  dv.setUint16(0x14, 0, true);                       // e_ip
  dv.setUint16(0x16, 0, true);                       // e_cs
  // entry code at file offset 32 (the load module start)
  memberCode.set([0xb4, 0x09, 0xba, 0x08, 0x00, 0xcd, 0x21, 0xb8, 0x00, 0x4c, 0xcd, 0x21], 32);
  memberCode.set([0x48, 0x49, 0x24], 40);            // "HI$"
}
const fakeZip = zipSync({ "tool/NUKE.EXE": memberCode, "tool/README.TXT": new TextEncoder().encode("hello from 1998\n") }, { level: 0 });
check(fakeZip[0] === 0x50 && fakeZip[1] === 0x4b, "synthetic zip builds");
const reopened = unzipSync(fakeZip);
check(Object.keys(reopened).length === 2 && reopened["tool/NUKE.EXE"].length === memberCode.length, "unzipSync round-trips the members");
const nukeMeta = sniffMZ(reopened["tool/NUKE.EXE"]);
check(nukeMeta.entry === 32 && !nukeMeta.clipped, `member MZ entry resolves to 0x${nukeMeta.entry.toString(16)}`);
const nukeAnalysis = analyze(reopened["tool/NUKE.EXE"], { base: nukeMeta.loadSeg, entry: nukeMeta.entry, mode: 16 });
check([...nukeAnalysis.insns.values()].some((i) => !i.data && i.repr.startsWith("int")), "member sweep recovers INT calls");

/* ---------------------------------------------------------- ghidra engine */

console.log("── ghidra wasm engine");
const require_ = createRequire(import.meta.url);
const BUNDLE = join(ROOT, "wasm", "ghidra", "ghidra_decompiler.js");
function loadUmdBundle(file) {
  const shell = { exports: {} };
  const factory = new Function("module", "exports", "require", "__dirname", "__filename", readFileSync(file, "utf8"));
  factory(shell, shell.exports, require_, dirname(file), file);
  return shell.exports;
}
const GhidraDecompiler = loadUmdBundle(BUNDLE);
const engine = new GhidraWasm({
  root: `${BASE}/wasm/ghidra/`,
  log: () => {},
  loadModule: (self) =>
    GhidraDecompiler({
      locateFile: (p) => join(ROOT, "wasm", "ghidra", p),
      print: () => {},
      printErr: () => {},
    }),
});
await engine.load();
check(engine.languages.length >= 5, `engine ready · ${engine.languages.length} languages`);

function paddedForDecompile(bytes, pad = 64) {
  const out = new Uint8Array(bytes.length + pad);
  out.set(bytes);
  out.fill(0xcb, bytes.length);
  return out;
}

async function decompileExpect(bytes, { lang, compiler, base, func, mustContain }) {
  const res = await engine.decompile(paddedForDecompile(bytes), { lang, compiler, base, func });
  const ok = !/^(\/\*\s*)?(Error|Lowlevel Error|Decoder Error|Standard Exception)/m.test(res.text) && !/^Error:/.test(res.text.trim());
  if (!ok) console.log(`      [decompile raw @${func}] ${res.text.slice(0, 200).replace(/\n/g, " | ")}`);
  const contains = mustContain ? res.text.includes(mustContain) : true;
  return { ok: ok && contains, lines: res.text.split("\n").length, text: res.text };
}

// demo.exe's entry path runs into its string data, so carve the code path the
// way an analyst would: hand Ghidra only the bytes up to the final INT 21h and
// let the RETF padding terminate the function.
const demoCodeEnd = demo.indexOf([0xb8, 0x00, 0x4c, 0xcd, 0x21]) ? demo.indexOf(0x21, demo.indexOf([0xb8, 0x00, 0x4c])) + 1 : demoMeta.loadSeg;
const demoCode = demo.subarray(demoMeta.loadSeg, demoCodeEnd);
const demoDec = await decompileExpect(demoCode, {
  lang: "x86:LE:16:Real Mode", compiler: "default",
  base: "0x" + demoMeta.loadSeg.toString(16), func: "0x" + demoMeta.loadSeg.toString(16),
});
check(demoDec.ok, `demo.exe code carve decompiled (${demoDec.lines} lines)`);

const nukeDec = await decompileExpect(reopened["tool/NUKE.EXE"], {
  lang: "x86:LE:16:Real Mode", compiler: "default",
  base: "0x" + nukeMeta.loadSeg.toString(16), func: "0x" + nukeMeta.entry.toString(16),
});
check(nukeDec.ok, `zip-member decompiled (${nukeDec.lines} lines)`);


/* --------------------------------------------------- PE32+/UEFI decompile */

console.log("── PE32+ (UEFI module) path");
function buildPE32p(code, { imageBase = 0x00400000, entryRVA = 0x1000, rawStart = 0x200 } = {}) {
  const optSize = 240;
  const total = rawStart + code.length;
  const buf = new Uint8Array(total);
  const dv = new DataView(buf.buffer);
  buf.set([0x4d, 0x5a], 0);
  dv.setUint32(0x3c, 0x40, true);                 // e_lfanew
  buf.set([0x50, 0x45, 0x00, 0x00], 0x40);        // PE\0\0
  dv.setUint16(0x44, 0x8664, true);               // machine x64
  dv.setUint16(0x46, 1, true);                    // nsec
  dv.setUint16(0x54, optSize, true);              // optSize
  const opt = 0x58;
  dv.setUint16(opt, 0x20b, true);                 // PE32+ magic
  dv.setUint32(opt + 16, entryRVA, true);         // AddressOfEntryPoint
  dv.setBigUint64(opt + 24, BigInt(imageBase), true); // ImageBase
  const sec = opt + optSize;
  buf.set(new TextEncoder().encode(".text"), sec);
  dv.setUint32(sec + 8, code.length, true);       // virtual size
  dv.setUint32(sec + 12, 0x1000, true);           // virtual address
  dv.setUint32(sec + 16, code.length, true);      // raw size
  dv.setUint32(sec + 20, rawStart, true);         // raw pointer
  buf.set(code, rawStart);
  // mapped image the way the page's parsePE builds it
  const image = new Uint8Array(0x1000 + code.length);
  image.set(code, 0x1000);
  return { file: buf, image };
}
// x86-64: int add2(int a, int b) { return a + b; }  ->  lea eax,[rcx+rdx]; ret
const uefi = buildPE32p(new Uint8Array([0x8d, 0x01, 0xc3]));
const uefiDec = await decompileExpect(uefi.image, {
  lang: "x86:LE:64:default", compiler: "gcc",
  base: "0x400000", func: "0x401000",
});
check(uefiDec.ok, `PE32+/UEFI module decompiled as x86:LE:64 (${uefiDec.lines} lines)`);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECKS FAILED"} · wasm time ${engine.stats.ms.toFixed(0)} ms`);
process.exit(failures ? 1 : 0);
