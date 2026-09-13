#!/usr/bin/env node
/**
 * cookbook_to_javacard.mjs — convert the Crypto Cookbook's recipes into
 * JavaCardOS card programs (+ a JavaOS terminal-side split).
 *
 * The cookbook (public/apps/cookbook/index.html) catalogues ~260 "recipes":
 * block/stream ciphers, asymmetric primitives, MACs, PQC, authenticator apps,
 * and a long tail of codebooks and symbol tables. A smart card can only run a
 * fraction of that: JavaCard Classic gives the card DES/3DES/AES, RSA, ECDSA,
 * ECDH, SHA-1/2 and HMAC, and everything else must either be hand-carried in
 * the Java subset (no Strings, no threads, no long/double/float, tiny RAM) or
 * stay off-card in the terminal program — exactly the two-program split the
 * BasicCard manual describes (ZC-Basic terminal program + card program over
 * ISO 7816-4 APDUs; see docs/RESEARCH_SMARTCARD.md).
 *
 * What this tool does:
 *   1. parses every cookbook card (title, category, badge, status),
 *   2. classifies it PORTABLE / PARTIAL / SOFTWARE / TERMINAL / NOTFIT with a
 *      reason that names the JavaCard API (or the missing piece),
 *   3. emits compilable JavaCard 2.2.2 applet skeletons for the portable core
 *      into samples/javacard/, plus a REPORT.md matrix covering every card.
 *
 * The emitted .java uses only CompilationUnit -> package + imports + one public
 * ClassDeclaration with field/method declarations, i.e. the JavacParser rules
 * parseCompilationUnit / classDeclaration / variableDeclaratorRest /
 * parseStatement (docs/UEFI_OPENBIOS_JAVAC.md cites the exact methods). The
 * JavaCard subset is enforced by tests/14-javacard.mjs, not by trust.
 *
 * Usage:
 *   node tools/cookbook_to_javacard.mjs          # write samples/javacard/*
 *   node tools/cookbook_to_javacard.mjs --check  # verify committed files match
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COOKBOOK = join(ROOT, "public", "apps", "cookbook", "index.html");
const OUTDIR = join(ROOT, "samples", "javacard");

// ------------------------------------------------------------------ parsing

export function parseCards(html) {
  const starts = [...html.matchAll(/<div class="card">/g)].map((m) => m.index);
  const cards = [];
  for (let i = 0; i < starts.length; i++) {
    let slice = html.slice(starts[i], i + 1 < starts.length ? starts[i + 1] : html.length);
    const cut = slice.search(/<h2|<div class="foot/);
    if (cut > 0) slice = slice.slice(0, cut);
    const text = (re) => {
      const m = slice.match(re);
      return m ? m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
    };
    const h3 = slice.match(/<h3>([\s\S]*?)<\/h3>|<h3>([^<\n]*)/);
    const title = h3
      ? (h3[1] ?? h3[2]).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
      : `card-${i}`;
    const badge = /b-ok/.test(slice) ? "Verified" : /b-ref/.test(slice) ? "Reference" : /b-edu/.test(slice) ? "Educational" : "—";
    cards.push({ title, cat: text(/<div class="cat">([\s\S]*?)<\/div>/), badge, status: text(/<p class="status">([\s\S]*?)<\/p>/) });
  }
  return cards;
}

// ---------------------------------------------------------- classification
//
// PORTABLE: a JavaCard Classic (2.2.2) API exists — Cipher/MessageDigest/
//   Signature/KeyPair/KeyAgreement/RandomData cover it.
// PARTIAL:  portable only on newer cards or with off-card help (named).
// SOFTWARE: no API, but the kernel fits the Java subset (arrays + shorts).
// TERMINAL: belongs in the JavaOS terminal program (UI, network, files).
// NOTFIT:   reference material — a table to read, not code to run.

const RULES = [
  // -- the portable core (applets are emitted for these) -------------------
  { re: /^AES\b/, cls: "PORTABLE", why: "Cipher.ALG_AES_BLOCK_128_CBC_NOPAD (+ALG_AES_GCM on JC 3.0.5+); KeyBuilder.TYPE_AES" },
  { re: /^DES$/, cls: "PORTABLE", why: "Cipher.ALG_DES_ECB/CBC_NOPAD; KeyBuilder.TYPE_DES (legacy interop only)" },
  { re: /^Triple DES/, cls: "PORTABLE", why: "Cipher.ALG_DES_CBC_NOPAD with TYPE_DES LENGTH_DES3_2KEY/3KEY" },
  { re: /^RSA$/, cls: "PORTABLE", why: "KeyPair.ALG_RSA + Signature.ALG_RSA_SHA_PKCS1 / ALG_RSA_PKCS1" },
  { re: /^ECC\b/, cls: "PORTABLE", why: "KeyPair.ALG_EC_FP + Signature.ALG_ECDSA_SHA_256 + KeyAgreement.ALG_EC_SVDP_DH" },
  { re: /^SHA-256/, cls: "PORTABLE", why: "MessageDigest.ALG_SHA_256/384/512 (SHA-3 has no Classic API — see PARTIAL note)" },
  { re: /^HMAC$/, cls: "PORTABLE", why: "Signature.ALG_HMAC_SHA_1/256/384/512" },
  { re: /^Poly1305$/, cls: "SOFTWARE", why: "no API; 130-bit multiply fits the subset but needs int arithmetic (JC 2.2 int is optional)" },
  // -- authenticator / smartcard-native apps --------------------------------
  { re: /TOTP|HOTP|OATH/i, cls: "PORTABLE", why: "Signature.ALG_HMAC_SHA_1 + counter in EEPROM; the classic card OTP applet" },
  { re: /Yubico OTP|Modhex/i, cls: "PORTABLE", why: "TYPE_AES credential + modhex is 16 table lookups; card-native" },
  { re: /PIV|Smartcard APDU/i, cls: "PORTABLE", why: "PIV *is* a card app (NIST SP 800-73); RSA/EC ops map 1:1" },
  { re: /FIDO U2F Raw APDU|U2F Deterministic|FIDO2 \/ WebAuthn|WebAuthn/i, cls: "PARTIAL", why: "ECDSA P-256 + SHA-256 + RandomData exist; CBOR parser must be hand-carried, attestation key off-card" },
  { re: /SoloKeys.*(Credential|Bootloader)/i, cls: "PARTIAL", why: "Ed25519 verify is SOFTWARE (no Classic API); wrapping needs AES-GCM (JC 3.0.5+)" },
  { re: /OnlyKey HMAC/i, cls: "PORTABLE", why: "Signature.ALG_HMAC_SHA_1 exactly" },
  { re: /OnlyKey (Deterministic|Encrypted Backup)/i, cls: "PARTIAL", why: "KDF loops portable; SSH/GPG message formats stay terminal-side" },
  { re: /privacyIDEA Challenge-Response/i, cls: "PORTABLE", why: "HMAC challenge-response like OnlyKey" },
  { re: /EveryKey.*AES-128-GCM/i, cls: "PARTIAL", why: "needs ALG_AES_GCM (JC 3.0.5+); BLE transport is terminal-side" },
  { re: /CTAP2 \/ FIDO CBOR/i, cls: "TERMINAL", why: "CBOR inspector is a terminal/debug tool; the card only answers U2F APDUs" },
  // -- stream ciphers: no Classic API, kernels are portable -----------------
  { re: /^(ChaCha20|Rabbit|HC-128)$/, cls: "SOFTWARE", why: "no Classic API; ARX/table kernel fits the Java subset" },
  { re: /^RC4$/, cls: "SOFTWARE", why: "no API and deprecated/broken — portable kernel, do not provision (no applet emitted)" },
  { re: /^Curve25519/, cls: "SOFTWARE", why: "no X25519/Ed25519 API in Classic; 25519 field code is large but portable" },
  { re: /^NaCl secretbox/, cls: "SOFTWARE", why: "XSalsa20+Poly1305 must both be hand-carried" },
  // -- other block ciphers: kernels portable, no API ------------------------
  { re: /^(Camellia|Twofish|IDEA|Blowfish|CAST-128|SEED|TEA|XTEA|XXTEA|Skipjack|RC2|RC5|RC6|SAFER|SHACAL-2|Threefish)/, cls: "SOFTWARE", why: "no API; Feistel/SPN/ARX kernel fits the subset (XXTEA/TEA are trivially small)" },
  { re: /^Enigma|^M-209/, cls: "SOFTWARE", why: "rotor simulation is a few dozen lines of subset Java" },
  { re: /^Bluetooth E1|^E1 official|^E21 official|^E3 Kc/, cls: "SOFTWARE", why: "SAFER+/E1 kernel portable; Bluetooth pairing stays terminal-side" },
  // -- post-quantum: does not fit -------------------------------------------
  { re: /^ML-KEM|^ML-DSA/, cls: "NOTFIT", why: "no API; matrix/ring code + RAM exceed Classic cards (research target for JC 3.2)" },
  { re: /^Paranoia C4/, cls: "NOTFIT", why: "2048-bit eats card RAM; terminal-side reference" },
  // -- wallets: split across the ISO 7816 boundary ---------------------------
  { re: /^BIP39 Mnemonic|^BIP39 Fuzzy/, cls: "TERMINAL", why: "2048-word list + Unicode NFKD cannot live in 8K EEPROM; card may hold the seed, UI stays out" },
  { re: /^BIP44|^BIP84|^Haiku BIP44|^Legacy P2PKH|^Cardano Shelley/, cls: "PARTIAL", why: "HMAC-SHA512 exists but secp256k1 public-child tweak needs point addition (no API); hardened signing portable" },
  { re: /Market Ticker|Coin & Stock/i, cls: "TERMINAL", why: "network reference data — terminal program, not the card" },
  // -- formats / encodings: terminal-side ------------------------------------
  { re: /^(Saltpack|Base|Baudot|BCD |Cross Sum|GPS |Phone Keypad|Roman Numerals|Resistor|Magnet URI|Torrent|RSS |Geocoder|Sneakers|Graybook|Text Input|Timeline|Telegraph Codebooks|Offline|Unicode .*Inspector|GCWizard|Hash Search|Symbol Table|Code 39|POSTNET|ColorAdd|Webdings|Wingdings|WMO |Zodiac|TAE |StVO|DIN 2403|Note values|GC attributes|A-tom-tom|Snooker|Shoes |Solmization|Stippelcode|Cooke-Wheatstone|ISO 3166|Slash & Pipe|Garden Dice|Robots |Maze |Mary Stuart|Halo Covenant|Illuminati|Ice Codes|Hexahue|Download Self|Fox Code|Finger alphabet|Eternity Code|Dragonlords|Dagger |Cicero|Birkenbihl|Sitelen|Birds on|Fakoo|Dotty|Dutton|Moon9|Terzi|Lucas|Klein|ELIA|Raphigraphy|Barbier|Malossi|Fez |Lorm|Allemans|Siekoo|Sunuz|Quadoo|Matoran|Minimoys|Marain|Unown|Ninjargon|ISO 7010|Maya |Hylian|Nyctography|D’ni|Gerudo|Tenctonese|Raph|Dni |Kryptonian|Atlantean|Al Bhed|Aurebesh|Dutton|Stargate|Gnomish|Plejadian|Ottride|Sheliak|Ravkan|Visitor|Futurama|Klingon|Tengwar|Cirth|Daedric|Elia|Haüy|Gall|Howe|Alston|Hebold|Frere|Hymmnos|Interlac|Mascaro|Rila|Zentradi|Dinotopia|Computer Braille|American Braille|Sitelen|Ulog|Xelbet|Yinyang|Zamonian|Vulcanian|Yavin|Yan |Weldon|Unitology|Wind force|Rainbow|Utopian|Doop|Ancient|Pona|Telo|Emoji|Iron|TTFN)/, cls: "TERMINAL", why: "encoding/reference/UI recipe — runs in the terminal program, not in EEPROM" },
  { re: /^Robinson|^Ainslie|^Fuller|^More Gutenberg|^More Symbol|^Formula Solver|^Trifid|^Nihilist|^Playfair|^Polybius|^Baconian|^Kenny Code|^Book \/ Beale|^Zodiac Homophonic|^Knights Templar|^Dancing Men|^TomTom|^TAPIR|^Skipjack.*tap|^Navajo|^Cipher Wheel|^TAPIR|^BCD|^Bidirectional|^Bacon/, cls: "NOTFIT", why: "paper/codebook cipher or puzzle reference — nothing to execute on-card" },
  { re: /Enochian|Voynich|Leet|Pigpen|Morse|Tap Code|Solitaire|Dorabella|I Ching|Chappe|Occult|Rune|Tokki|Honey|Biblio|Quine|SFX installer|Larger Game of Life/, cls: "NOTFIT", why: "educational/puzzle reference — documentation, not an algorithm" },
];

export function classify(title) {
  for (const r of RULES) if (r.re.test(title)) return { cls: r.cls, why: r.why };
  if (/Robinson|Slater|Bentley|Ainslie|Peterson|codebook/i.test(title))
    return { cls: "NOTFIT", why: "telegraph codebook page — reference text, not code" };
  return { cls: "NOTFIT", why: "reference table / symbol page — documentation, not an algorithm" };
}

// ------------------------------------------------------------- applet emit

const HDR = (name, recipe) =>
`/* ${name}.java — ${recipe}, as a JavaCard Classic card program.
 *
 * GENERATED by tools/cookbook_to_javacard.mjs — do not hand-edit.
 * Source recipe: public/apps/cookbook/index.html ("${recipe}").
 * Card side of the two-program split (cf. BasicCard terminal+card model):
 * the JavaOS terminal program sends ISO 7816-4 APDUs, this applet answers.
 * JavaCard 2.2.2 subset only (no String/Thread/long/double/float); enforced
 * by tests/14-javacard.mjs. Grammar: one ClassDeclaration with field and
 * method declarations per JavacParser (see docs/UEFI_OPENBIOS_JAVAC.md).
 */`;

export function generate() {
  const html = readFileSync(COOKBOOK, "utf8");
  const cards = parseCards(html);
  const rows = cards.map((c) => ({ ...c, ...classify(c.title) }));
  // The six portable-core applets are hand templates (reviewed once, emitted
  // byte-stable); REPORT.md is fully generated from the parse.
  const files = {};
  for (const [name, body] of Object.entries(APPLETS)) files[`${name}.java`] = body;
  const counts = {};
  for (const r of rows) counts[r.cls] = (counts[r.cls] || 0) + 1;
  let md = `# Cookbook → JavaCardOS report\n\nGenerated by \`tools/cookbook_to_javacard.mjs\` from \`public/apps/cookbook/index.html\`.\n\n${cards.length} cards parsed. Card side = JavaCard Classic applet (this directory);\nterminal side = JavaOS program issuing ISO 7816-4 APDUs (cf. the BasicCard\ntwo-program model in docs/RESEARCH_SMARTCARD.md).\n\n| class | cards | meaning |\n| --- | --- | --- |\n| PORTABLE | ${counts.PORTABLE || 0} | JavaCard Classic API exists; applet emitted for the core |\n| PARTIAL | ${counts.PARTIAL || 0} | needs a newer card or off-card help (named per row) |\n| SOFTWARE | ${counts.SOFTWARE || 0} | no API; kernel fits the Java subset, hand-carry it |\n| TERMINAL | ${counts.TERMINAL || 0} | belongs in the terminal program, not in EEPROM |\n| NOTFIT | ${counts.NOTFIT || 0} | reference material — read it, don't execute it |\n\n| recipe | badge | class | JavaCard mapping / reason |\n| --- | --- | --- | --- |\n`;
  for (const r of rows) {
    const esc = (s) => s.replace(/\|/g, "\\|");
    md += `| ${esc(r.title)} | ${r.badge} | ${r.cls} | ${esc(r.why)} |\n`;
  }
  files["REPORT.md"] = md;
  return { cards: rows, files };
}

// ------------------------------------------------------------------ applets
// Hand-written once, emitted byte-stable. Each is a single ClassDeclaration
// (JavacParser.classDeclaration), fields via variableDeclaratorRest, bodies via
// parseStatement — no generics, no enums, no annotations, no String.

const APPLETS = {
  AesApplet: `${HDR("AesApplet", "AES — CBC, GCM, CCM")}
package kitchen.card;

import javacard.framework.*;
import javacard.security.*;
import javacardx.crypto.*;

public class AesApplet extends Applet {
    private Cipher cipher;
    private AESKey aesKey;

    protected AesApplet() {
        cipher = Cipher.getInstance(Cipher.ALG_AES_BLOCK_128_CBC_NOPAD, false);
        aesKey = (AESKey) KeyBuilder.buildKey(KeyBuilder.TYPE_AES, KeyBuilder.LENGTH_AES_128, false);
        register();
    }

    public static void install(byte[] bArray, short bOffset, byte bLength) {
        new AesApplet();
    }

    public void process(APDU apdu) {
        if (selectingApplet()) {
            return;
        }
        byte[] buf = apdu.getBuffer();
        byte ins = buf[ISO7816.OFFSET_INS];
        switch (ins) {
            case (byte) 0x10:
                apdu.setIncomingAndReceive();
                setKey(buf);
                break;
            case (byte) 0x20:
                doCrypto(apdu, Cipher.MODE_ENCRYPT);
                break;
            case (byte) 0x21:
                doCrypto(apdu, Cipher.MODE_DECRYPT);
                break;
            default:
                ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }

    private void setKey(byte[] buf) {
        short len = (short) (buf[ISO7816.OFFSET_LC] & 0xFF);
        if (len != (short) 16) {
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        }
        aesKey.setKey(buf, ISO7816.OFFSET_CDATA);
    }

    private void doCrypto(APDU apdu, byte mode) {
        byte[] buf = apdu.getBuffer();
        short got = apdu.setIncomingAndReceive();
        if (got < (short) 32 || (short) (got % 16) != (short) 0) {
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        }
        cipher.init(aesKey, mode, buf, ISO7816.OFFSET_CDATA, (short) 16);
        short n = cipher.doFinal(buf, (short) (ISO7816.OFFSET_CDATA + 16),
                (short) (got - 16), buf, (short) 0);
        apdu.setOutgoingAndSend((short) 0, n);
    }
}
`,
  DesApplet: `${HDR("DesApplet", "DES + Triple DES (3DES / TDEA)")}
package kitchen.card;

import javacard.framework.*;
import javacard.security.*;
import javacardx.crypto.*;

public class DesApplet extends Applet {
    private Cipher cipher;
    private DESKey desKey;

    protected DesApplet() {
        cipher = Cipher.getInstance(Cipher.ALG_DES_CBC_NOPAD, false);
        desKey = (DESKey) KeyBuilder.buildKey(KeyBuilder.TYPE_DES, KeyBuilder.LENGTH_DES3_3KEY, false);
        register();
    }

    public static void install(byte[] bArray, short bOffset, byte bLength) {
        new DesApplet();
    }

    public void process(APDU apdu) {
        if (selectingApplet()) {
            return;
        }
        byte[] buf = apdu.getBuffer();
        byte ins = buf[ISO7816.OFFSET_INS];
        switch (ins) {
            case (byte) 0x10:
                apdu.setIncomingAndReceive();
                setKey(buf);
                break;
            case (byte) 0x20:
                doCrypto(apdu, Cipher.MODE_ENCRYPT);
                break;
            case (byte) 0x21:
                doCrypto(apdu, Cipher.MODE_DECRYPT);
                break;
            default:
                ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }

    private void setKey(byte[] buf) {
        short len = (short) (buf[ISO7816.OFFSET_LC] & 0xFF);
        if (len != (short) 8 && len != (short) 16 && len != (short) 24) {
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        }
        desKey.setKey(buf, ISO7816.OFFSET_CDATA);
    }

    private void doCrypto(APDU apdu, byte mode) {
        byte[] buf = apdu.getBuffer();
        short got = apdu.setIncomingAndReceive();
        if (got < (short) 16 || (short) (got % 8) != (short) 0) {
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        }
        cipher.init(desKey, mode, buf, ISO7816.OFFSET_CDATA, (short) 8);
        short n = cipher.doFinal(buf, (short) (ISO7816.OFFSET_CDATA + 8),
                (short) (got - 8), buf, (short) 0);
        apdu.setOutgoingAndSend((short) 0, n);
    }
}
`,
  RsaApplet: `${HDR("RsaApplet", "RSA")}
package kitchen.card;

import javacard.framework.*;
import javacard.security.*;
import javacardx.crypto.*;

public class RsaApplet extends Applet {
    private KeyPair keyPair;
    private Signature signer;

    protected RsaApplet() {
        keyPair = new KeyPair(KeyPair.ALG_RSA, KeyBuilder.LENGTH_RSA_1024);
        signer = Signature.getInstance(Signature.ALG_RSA_SHA_PKCS1, false);
        register();
    }

    public void process(APDU apdu) {
        if (selectingApplet()) {
            return;
        }
        byte[] buf = apdu.getBuffer();
        byte ins = buf[ISO7816.OFFSET_INS];
        switch (ins) {
            case (byte) 0x30:
                keyPair.genKeyPair();
                break;
            case (byte) 0x31:
                doSign(apdu);
                break;
            case (byte) 0x32:
                doVerify(apdu);
                break;
            default:
                ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }

    public static void install(byte[] bArray, short bOffset, byte bLength) {
        new RsaApplet();
    }

    private void doSign(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short got = apdu.setIncomingAndReceive();
        signer.init(keyPair.getPrivate(), Signature.MODE_SIGN);
        short n = signer.sign(buf, ISO7816.OFFSET_CDATA, got, buf, (short) 0);
        apdu.setOutgoingAndSend((short) 0, n);
    }

    private void doVerify(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short got = apdu.setIncomingAndReceive();
        if (got < (short) 128) {
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        }
        signer.init(keyPair.getPublic(), Signature.MODE_VERIFY);
        short msgLen = (short) (got - 128);
        boolean ok = signer.verify(buf, ISO7816.OFFSET_CDATA, msgLen,
                buf, (short) (ISO7816.OFFSET_CDATA + msgLen), (short) 128);
        if (!ok) {
            ISOException.throwIt(ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED);
        }
    }
}
`,
  EcApplet: `${HDR("EcApplet", "ECC — SECP, Brainpool, Koblitz curves")}
package kitchen.card;

import javacard.framework.*;
import javacard.security.*;
import javacardx.crypto.*;

public class EcApplet extends Applet {
    private KeyPair keyPair;
    private Signature signer;
    private ECPublicKey pub;
    private ECPrivateKey prv;
    private byte[] domain;

    protected EcApplet() {
        keyPair = new KeyPair(KeyPair.ALG_EC_FP, KeyBuilder.LENGTH_EC_FP_256);
        pub = (ECPublicKey) keyPair.getPublic();
        prv = (ECPrivateKey) keyPair.getPrivate();
        setDomainParams();
        keyPair.genKeyPair();
        signer = Signature.getInstance(Signature.ALG_ECDSA_SHA_256, false);
        register();
    }

    public static void install(byte[] bArray, short bOffset, byte bLength) {
        new EcApplet();
    }

    public void process(APDU apdu) {
        if (selectingApplet()) {
            return;
        }
        byte[] buf = apdu.getBuffer();
        byte ins = buf[ISO7816.OFFSET_INS];
        switch (ins) {
            case (byte) 0x30:
                keyPair.genKeyPair();
                break;
            case (byte) 0x31:
                doSign(apdu);
                break;
            case (byte) 0x32:
                doVerify(apdu);
                break;
            default:
                ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }

    private void setDomainParams() {
        domain = new byte[(short) 160];
        short o = (short) 0;
        // p = FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF
        byte[] p = new byte[] {
            (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x01,
            (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00,
            (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
            (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF };
        // a = FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC
        byte[] a = new byte[] {
            (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x01,
            (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00,
            (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
            (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFC };
        // b = 5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B
        byte[] b = new byte[] {
            (byte) 0x5A, (byte) 0xC6, (byte) 0x35, (byte) 0xD8, (byte) 0xAA, (byte) 0x3A, (byte) 0x93, (byte) 0xE7,
            (byte) 0xB3, (byte) 0xEB, (byte) 0xBD, (byte) 0x55, (byte) 0x76, (byte) 0x98, (byte) 0x86, (byte) 0xBC,
            (byte) 0x65, (byte) 0x1D, (byte) 0x06, (byte) 0xB0, (byte) 0xCC, (byte) 0x53, (byte) 0xB0, (byte) 0xF6,
            (byte) 0x3B, (byte) 0xCE, (byte) 0x3C, (byte) 0x3E, (byte) 0x27, (byte) 0xD2, (byte) 0x60, (byte) 0x4B };
        // Gx = 6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296
        byte[] gx = new byte[] {
            (byte) 0x6B, (byte) 0x17, (byte) 0xD1, (byte) 0xF2, (byte) 0xE1, (byte) 0x2C, (byte) 0x42, (byte) 0x47,
            (byte) 0xF8, (byte) 0xBC, (byte) 0xE6, (byte) 0xE5, (byte) 0x63, (byte) 0xA4, (byte) 0x40, (byte) 0xF2,
            (byte) 0x77, (byte) 0x03, (byte) 0x7D, (byte) 0x81, (byte) 0x2D, (byte) 0xEB, (byte) 0x33, (byte) 0xA0,
            (byte) 0xF4, (byte) 0xA1, (byte) 0x39, (byte) 0x45, (byte) 0xD8, (byte) 0x98, (byte) 0xC2, (byte) 0x96 };
        // Gy = 4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5
        byte[] gy = new byte[] {
            (byte) 0x4F, (byte) 0xE3, (byte) 0x42, (byte) 0xE2, (byte) 0xFE, (byte) 0x1A, (byte) 0x7F, (byte) 0x9B,
            (byte) 0x8E, (byte) 0xE7, (byte) 0xEB, (byte) 0x4A, (byte) 0x7C, (byte) 0x0F, (byte) 0x9E, (byte) 0x16,
            (byte) 0x2B, (byte) 0xCE, (byte) 0x33, (byte) 0x57, (byte) 0x6B, (byte) 0x31, (byte) 0x5E, (byte) 0xCE,
            (byte) 0xCB, (byte) 0xB6, (byte) 0x40, (byte) 0x68, (byte) 0x37, (byte) 0xBF, (byte) 0x51, (byte) 0xF5 };
        // r = FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
        byte[] r = new byte[] {
            (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0x00, (byte) 0x00, (byte) 0x00, (byte) 0x00,
            (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF, (byte) 0xFF,
            (byte) 0xBC, (byte) 0xE6, (byte) 0xFA, (byte) 0xAD, (byte) 0xA7, (byte) 0x17, (byte) 0x9E, (byte) 0x84,
            (byte) 0xF3, (byte) 0xB9, (byte) 0xCA, (byte) 0xC2, (byte) 0xFC, (byte) 0x63, (byte) 0x25, (byte) 0x51 };
        pub.setFieldFP(p, (short) 0, (short) 32);
        pub.setA(a, (short) 0, (short) 32);
        pub.setB(b, (short) 0, (short) 32);
        pub.setG(gx, (short) 0, gy, (short) 0, (short) 32);
        pub.setR(r, (short) 0, (short) 32);
        pub.setK((short) 1);
        prv.setFieldFP(p, (short) 0, (short) 32);
        prv.setA(a, (short) 0, (short) 32);
        prv.setB(b, (short) 0, (short) 32);
        prv.setG(gx, (short) 0, gy, (short) 0, (short) 32);
        prv.setR(r, (short) 0, (short) 32);
        prv.setK((short) 1);
        o = (short) (o + 1);
        domain[o] = (byte) 0x01;
    }

    private void doSign(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short got = apdu.setIncomingAndReceive();
        signer.init(prv, Signature.MODE_SIGN);
        short n = signer.sign(buf, ISO7816.OFFSET_CDATA, got, buf, (short) 0);
        apdu.setOutgoingAndSend((short) 0, n);
    }

    private void doVerify(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short got = apdu.setIncomingAndReceive();
        signer.init(pub, Signature.MODE_VERIFY);
        short half = (short) (got / 2);
        boolean ok = signer.verify(buf, ISO7816.OFFSET_CDATA, half,
                buf, (short) (ISO7816.OFFSET_CDATA + half), half);
        if (!ok) {
            ISOException.throwIt(ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED);
        }
    }
}
`,
  ShaApplet: `${HDR("ShaApplet", "SHA-256 · SHA-384 · SHA-512 · SHA-3")}
package kitchen.card;

import javacard.framework.*;
import javacard.security.*;

public class ShaApplet extends Applet {
    private MessageDigest sha256;

    protected ShaApplet() {
        sha256 = MessageDigest.getInstance(MessageDigest.ALG_SHA_256, false);
        register();
    }

    public static void install(byte[] bArray, short bOffset, byte bLength) {
        new ShaApplet();
    }

    public void process(APDU apdu) {
        if (selectingApplet()) {
            return;
        }
        byte[] buf = apdu.getBuffer();
        byte ins = buf[ISO7816.OFFSET_INS];
        switch (ins) {
            case (byte) 0x40:
                doDigest(apdu);
                break;
            default:
                ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }

    private void doDigest(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short got = apdu.setIncomingAndReceive();
        short n = sha256.doFinal(buf, ISO7816.OFFSET_CDATA, got, buf, (short) 0);
        apdu.setOutgoingAndSend((short) 0, n);
    }
}
`,
  HmacApplet: `${HDR("HmacApplet", "HMAC (+ TOTP/HOTP, OnlyKey challenge-response)")}
package kitchen.card;

import javacard.framework.*;
import javacard.security.*;
import javacardx.crypto.*;

public class HmacApplet extends Applet {
    private Signature hmac;
    private HMACKey hmacKey;

    protected HmacApplet() {
        hmac = Signature.getInstance(Signature.ALG_HMAC_SHA_256, false);
        hmacKey = (HMACKey) KeyBuilder.buildKey(KeyBuilder.TYPE_HMAC, KeyBuilder.LENGTH_HMAC_SHA_256_BLOCK_64, false);
        register();
    }

    public static void install(byte[] bArray, short bOffset, byte bLength) {
        new HmacApplet();
    }

    public void process(APDU apdu) {
        if (selectingApplet()) {
            return;
        }
        byte[] buf = apdu.getBuffer();
        byte ins = buf[ISO7816.OFFSET_INS];
        switch (ins) {
            case (byte) 0x10:
                apdu.setIncomingAndReceive();
                setKey(buf);
                break;
            case (byte) 0x41:
                doMac(apdu);
                break;
            default:
                ISOException.throwIt(ISO7816.SW_INS_NOT_SUPPORTED);
        }
    }

    private void setKey(byte[] buf) {
        short len = (short) (buf[ISO7816.OFFSET_LC] & 0xFF);
        if (len == (short) 0 || len > (short) 64) {
            ISOException.throwIt(ISO7816.SW_WRONG_LENGTH);
        }
        hmacKey.setKey(buf, ISO7816.OFFSET_CDATA, len);
    }

    private void doMac(APDU apdu) {
        byte[] buf = apdu.getBuffer();
        short got = apdu.setIncomingAndReceive();
        hmac.init(hmacKey, Signature.MODE_SIGN);
        short n = hmac.sign(buf, ISO7816.OFFSET_CDATA, got, buf, (short) 0);
        apdu.setOutgoingAndSend((short) 0, n);
    }
}
`,
};

// ------------------------------------------------------------------- main

const check = process.argv.includes("--check");
const { cards, files } = generate();
if (check) {
  let bad = 0;
  for (const [name, body] of Object.entries(files)) {
    let have = null;
    try {
      have = readFileSync(join(OUTDIR, name), "utf8");
    } catch {
      have = null;
    }
    if (have !== body) {
      bad = 1;
      console.error(`STALE ${name}: regenerate with: node tools/cookbook_to_javacard.mjs`);
    }
  }
  console.log(`${cards.length} cards parsed, ${Object.keys(files).length} files ${bad ? "STALE" : "fresh"}`);
  process.exit(bad);
}
mkdirSync(OUTDIR, { recursive: true });
for (const [name, body] of Object.entries(files)) writeFileSync(join(OUTDIR, name), body);
const counts = {};
for (const c of cards) counts[c.cls] = (counts[c.cls] || 0) + 1;
console.log(`${cards.length} cards -> ${OUTDIR} (${Object.keys(files).length} files)`, JSON.stringify(counts));
