/**
 * 13-makint.mjs — the virtual MAKInterface, the :CueCat codec and the Clik!
 * partition habit, checked without a browser, a device, or the network.
 *
 *   node tests/13-makint.mjs
 *
 * Every number asserted here has a source: the MAKInterface claims come from
 * the vendor's own archived pages (home1_e.php3 / pinout_e.php3 / order-e.txt,
 * CDX-verified), the :CueCat vectors are four independently published scan
 * strings, the .mag container facts come from tools/makint_static.py against
 * the 144 captures in the upstream tree, and the Clik! facts from Paul
 * Bristow's ide-floppy work.
 */

import { suite } from "./lib.mjs";
import {
  MAK_HEADER, makeMakLines, etuUs, CRYSTALS, FI_DI, atrBuild, atrParse,
  t0Frame, t0ParityByte, makeCardImage, resetAndAnswer,
  CUECAT_ALPHABET, cuecatDecode, cuecatEncode, cuecatSections,
  CLIK_ID, clikIdentifyModelWords, clikModelFromWords, clikDataPartition, SCOPE,
} from "../js/makint.js";

const t = suite("13-makint");

/* ---------------------------------------------------------------- the header */

{
  const r = MAK_HEADER.smartcard.reader, e = MAK_HEADER.smartcard.emulator;
  t.ok("reader and emulator rows differ only in Reset + CLK",
    r.Reset === 6 && e.Reset === 5 && r.CLK === 7 && e.CLK === undefined
    && r.VCC === 8 && e.VCC === 8 && r.GND === 4 && e.GND === 4,
    "(an emulated card is clocked by its own host, so it has no CLK input)");
}

t.eq("I/O is the 1+2 pair in both modes",
  [MAK_HEADER.smartcard.reader.IO, MAK_HEADER.smartcard.emulator.IO], [[1, 2], [1, 2]]);

t.eq("emulated card recipes", MAK_HEADER.emulatedCards.length, 9);
t.ok("Funcard is 90S8515 + 24C65 as the 00529 page says",
  MAK_HEADER.emulatedCards.find((c) => c.name === "Funcard").chips.join("+") === "90S8515+24C65");

{
  const p = makeMakLines();
  t.eq("no VCC before the port is asserted", p.lines[8], 0);
  p.powerOn(true);
  t.eq("VCC appears on pin 8 once powered", p.lines[8], 1);
  p.set(MAK_HEADER.smartcard.reader.Reset, 0);
  t.eq("reset assert reads 0 on the line", p.get(MAK_HEADER.smartcard.reader.Reset), 0);
  t.eq("apply() spreads the 1+2 pair", p.apply("reader", "IO"), [0, 0]);
  p.set(1, 1); p.set(2, 1);
  t.eq("apply() reads both halves of the pair", p.apply("reader", "IO"), [1, 1]);
}

/* -------------------------------------------------------------- ISO 7816-3 */

{
  const etu = etuUs(CRYSTALS.shipped.hz);
  t.near("3.579545 MHz with F=372 D=1 is a 103.9 µs ETU", etu, 103.924, 0.01);
  t.near("…which is 9622 baud, i.e. the 9600 of every period smart-card COM port",
    1e6 / etu, 9622.4, 1.0);
  t.ok("and 6.0 MHz is not: 62.0 µs", Math.abs(etuUs(CRYSTALS.optional.hz) - 62.0) < 0.5);
  t.ok("bad inputs give NaN, never a silent zero",
    Number.isNaN(etuUs(0)) && Number.isNaN(etuUs(-1)) && Number.isNaN(etuUs(1e6, 0)));
  t.eq("FI_DI covers the 3.579545 MHz default pairing", FI_DI[0x10], [372, 1]);
}

{
  const atr = atrBuild({ ta1: 0x11, td1: 0x50, hist: [0x00, 0x62, 0x02, 0x04] });
  const got = atrParse(atr);
  t.eq("ATR round-trips its interface bytes", got.ta1, 0x11);
  t.eq("ATR round-trips TD1 → T=0 protocol", got.protocol, 0);
  t.eq("historical byte count survives", got.historical.length, 4);
  t.ok("TCK parity checks out", got.tckValid);
  t.eq("derived baud is the shipping-clock baud", Math.round(got.baud), 9622);
  const broken = Uint8Array.from(atr); broken[broken.length - 1] ^= 0xff;
  t.ok("a corrupted TCK is caught", atrParse(broken).tckValid === false);
  t.eq("TS 0x3b is direct convention", got.direct, true);
  t.eq("0x81 would be inverse", atrParse(Uint8Array.from([0x81, 0x00, 0x81])).direct, false);
}

{
  const f = t0Frame(0x3b);
  t.eq("8 data bits + start + stop + parity + 2 guard ETUs", f.length, 13);
  t.eq("line idles high and the start bit pulls low", [f[0], f[f.length - 3]], [0, 1]);
  const nine = f.slice(1, 10);
  t.eq("odd parity over the nine bits", nine.reduce((a, b) => a + b, 0) % 2, 1);
  const inv = t0Frame(0x3b, { invert: true });
  t.eq("the on-board inverter flips every level", inv.map((b) => b ^ 1).join(""), f.join(""));
  // 0x03 has two set bits (even) so the parity bit must be 1; 0x01 has one
  // (odd) so it must be 0. Asserted both ways because a decoder that gets the
  // polarity backwards still produces a plausible-looking bit stream.
  t.eq("parity helper: even-popcount byte needs a set parity bit", t0ParityByte(0x03), 1);
  t.eq("parity helper: odd-popcount byte does not", t0ParityByte(0x01), 0);
}

/* ----------------------------------------------------------- the card on the wire */

{
  const card = makeCardImage();
  const sel = card.exchange(Uint8Array.from([0x00, 0xa4, 0x00, 0x00, 0x02, 0x6f, 0x07]));
  t.eq("SELECT EF_ACC answers 90 00", [sel[sel.length - 2], sel[sel.length - 1]], [0x90, 0x00]);
  t.eq("and it is now the selected file", card.selectedFile(), "6f07");
  const rd = card.exchange(Uint8Array.from([0x00, 0xb0, 0x00, 0x00, 0x04]));
  t.eq("READ BINARY returns the four stored bytes", Array.from(rd.slice(0, 4)), [0, 0, 0, 0]);
  t.eq("followed by 90 00", [rd[rd.length - 2], rd[rd.length - 1]], [0x90, 0x00]);
  const missing = card.exchange(Uint8Array.from([0x00, 0xa4, 0x00, 0x00, 0x02, 0xde, 0xad]));
  t.eq("selecting a file that is not there is 6A 82",
    [missing[0], missing[1]], [0x6a, 0x82]);
  const short = card.exchange(Uint8Array.from([0x00, 0xa4]));
  t.eq("a truncated APDU is 6B 00, not a crash", [short[0], short[1]], [0x6b, 0x00]);
  const nope = card.exchange(Uint8Array.from([0x00, 0xc0, 0x00, 0x00, 0x00]));
  t.eq("GET RESPONSE is honestly unimplemented as 6D 00", [nope[0], nope[1]], [0x6d, 0x00]);

  const cyc = resetAndAnswer(card);
  t.eq("reset answers with exactly the ATR bytes", cyc.bytes, card.atr.length);
  t.eq("every ATR byte becomes one framed character", cyc.frames.length, card.atr.length);
  t.near("at the shipping crystal each character is 10 ETU of link time",
    cyc.etuUs * 10, 1039.24, 0.5);
}

/* ------------------------------------------------------------------- :CueCat */

t.eq("the alphabet is base64's, reordered lowercase-first with + and - last",
  [CUECAT_ALPHABET.length, CUECAT_ALPHABET.slice(-2)], [64, "+-"]);

{
  // Four scan strings published by four different people, all reproduced.
  const vectors = [
    ["hanselman 2006 / Stardust code section", "ENr7C3n1C3PWD3rYCxzYChnZ", "978006093471251300"],
    ["dankohn / bookland EAN", "Dhf2Cxr3E3bYDNT1C3a", "72527483158603"],
    ["rkgage Gage's alphanumeric example", "fbmxChO", "WPT39"],
    ["lincomatic / the :Cat's own catalog barcode", "C3DZCxPWCNzWDNnX", "040293153502"],
  ];
  for (const [label, input, want] of vectors) t.eq(`decode: ${label}`, cuecatDecode(input), want);
}

{
  const raw = ".C3nZC3nZC3nZE3r0Chr3CNnY.cGf2.ENr7C3n1C3PWD3rYCxzYChnZ.";
  const s = cuecatSections(raw);
  t.eq("three sections", s.sections, 3);
  t.eq("serial (a neutered cat types nine zeros per group)", s.serial, "000000000877374101");
  t.eq("type", s.type, "IB5");
  t.eq("code", s.code, "978006093471251300");
  // The 978-prefix + ISBN check digit is the arithmetic the blog post used.
  const isbnBody = s.code.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * Number(isbnBody[i]);
  let x = 11 - (sum % 11);
  const isbn = isbnBody + (x === 10 ? "X" : x === 11 ? "0" : String(x));
  t.eq("Bookland prefix 978 → ISBN 0060934719", isbn, "0060934719");
}

{
  for (const s of ["020626725224", "978006093471251300", "WPT39", "0".repeat(18), "C3nZ"]) {
    const enc = cuecatEncode(s);
    t.ok(`round-trip ${s.length > 20 ? s.slice(0, 20) + "…" : s} (${enc.length} chars)`,
      cuecatDecode(enc) === s);
  }
  // The numeric chart people used in 2000 is the same algorithm, restricted to
  // digits: three barcode digits per four characters, no byte regrouping at all.
  t.eq("digit path: 'Dh'+'f'+'2' = 7,2,5", cuecatDecode("Dhf2").slice(0, 3), "725");
}

/* ----------------------------------------------------------------- Iomega Clik! */

{
  t.eq("the model string ide-floppy matched literally", CLIK_ID.model, "IOMEGA Clik! 40 CZ ATAPI");
  t.ok("and the fix was a prefix compare", CLIK_ID.modelNote.includes("IOMEGA Clik") && CLIK_ID.modelNote.includes("strncmp"));
  t.eq("data lives in partition 4", CLIK_ID.dataPartition, 4);
  const words = clikIdentifyModelWords(CLIK_ID.model);
  t.eq("40 bytes are 20 ATA words", words.length, 20);
  t.eq("byte-swapped per word, and it reads back", clikModelFromWords(words), CLIK_ID.model);
  t.ok("the first word is 'IO' swapped, not 'OI'", words[0] === (("I".charCodeAt(0)) << 8 | "O".charCodeAt(0)));

  const mbr = new Uint8Array(512);
  mbr[0x1be + 16 * 3 + 4] = 0x06;                   // type: FAT16 >=32MB
  for (const [off, val] of [[0x1be + 16 * 3 + 8, 63], [0x1be + 16 * 3 + 12, 78125]]) {
    mbr[off] = val & 0xff; mbr[off + 1] = (val >> 8) & 0xff;
    mbr[off + 2] = (val >> 16) & 0xff; mbr[off + 3] = (val >> 24) & 0xff;
  }
  mbr[510] = 0x55; mbr[511] = 0xaa;
  const p = clikDataPartition(mbr);
  t.eq("fourth MBR record is the data partition", [p.type, p.startLba, p.sectors], [0x06, 63, 78125]);
  t.eq("78125 sectors is 40,000,000 bytes", p.bytes, 40 * 1000 * 1000);
  t.ok("a sector without the 0x55aa signature is refused", (() => {
    try { clikDataPartition(new Uint8Array(512)); return false; } catch { return true; }
  })());
  t.ok("and a short buffer too", (() => {
    try { clikDataPartition(new Uint8Array(16)); return false; } catch { return true; }
  })());
}

/* ----------------------------------------------------------------------- scope */

t.ok("the scope note ships in the module, not just the docs",
  SCOPE.includes("no credential or CA emulation"));

/* ------------------------------------------- cross-language agreement (python ⇄ js) */

{
  // tools/makint_static.py computes the same crystal arithmetic for the dossier;
  // if the two ever drift, this is where it shows up.
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const rep = JSON.parse(readFileSync(join(root, "samples", "makint", "analysis.json"), "utf8"));
  const py = rep.iso7816["3.579545 MHz (shipped)"];
  const js = atrParse(atrBuild({ ta1: 0x11 }));
  t.near("python and js agree on the shipped-crystal ETU", py.etu_us_f372_d1, js.etuUs, 0.01);
  t.near("…and on the derived baud", py.baud_f372_d1, js.baud, 0.5);
  const corpus = rep.mag_format.corpus;
  t.eq("the .mag container parses every capture upstream ships",
    [corpus.parsed, corpus.files], [144, 144]);
  t.ok("and the capture clock proof holds (9-bit tick ceiling observed)",
    corpus.saturated_at_9bit === true && rep.mag_format.tick_hz === 150);
  t.ok("the shipped bytecode is in sync with its own source",
    rep.bytecode.every((b) => b.source_in_sync));
  t.ok("pydisasm-level facts are attached", rep.bytecode.every((b) => b.opcode_total > 0));
  t.ok("the CueCat rebuild matches every published vector it claims",
    rep.cuecat.all_match === true);
}

process.exit(t.done() ? 1 : 0);
