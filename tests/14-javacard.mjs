/**
 * 14 · cookbook -> JavaCardOS: the parse covers the whole cookbook, the
 * classification is sane on the recipes that matter, the emitted applets stay
 * inside the JavaCard 2.2.2 language subset, every API constant they name is a
 * real javacard constant, and the SECP256R1 domain parameters in EcApplet are
 * byte-exact.
 *
 * node tests/14-javacard.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { suite, ROOT } from "./lib.mjs";
import { parseCards, classify, generate } from "../tools/cookbook_to_javacard.mjs";

const s = suite("14 · cookbook-to-JavaCard conversion");
const JC = join(ROOT, "samples", "javacard");

const html = readFileSync(join(ROOT, "public", "apps", "cookbook", "index.html"), "utf8");
const cards = parseCards(html);
s.ok("parsed the whole cookbook", cards.length >= 250, `${cards.length} cards`);
s.ok("every card has a title", cards.every((c) => c.title && c.title.length > 1));

// --- classification spot checks: the recipes the project cares about --------
const expect = [
  ["AES — CBC, GCM, CCM", "PORTABLE"],
  ["DES", "PORTABLE"],
  ["Triple DES (3DES / TDEA)", "PORTABLE"],
  ["RSA", "PORTABLE"],
  ["ECC — SECP, Brainpool, Koblitz curves", "PORTABLE"],
  ["SHA-256 · SHA-384 · SHA-512 · SHA-3", "PORTABLE"],
  ["HMAC", "PORTABLE"],
  ["ChaCha20", "SOFTWARE"],
  ["RC4", "SOFTWARE"],
  ["Camellia", "SOFTWARE"],
  ["Twofish Verified", "SOFTWARE"],
  ["TEA Verified", "SOFTWARE"],
  ["Curve25519 — X25519 (DH) & Ed25519 (signature)", "SOFTWARE"],
  ["ML-KEM (Kyber) — key encapsulation", "NOTFIT"],
  ["BIP39 Mnemonic", "TERMINAL"],
  ["FIDO U2F Raw APDU Packet Parser & Builder ( fidoU2fPacket )", "PARTIAL"],
  ["Yubico OTP Modhex Decoder & AES-128 Decryptor ( yubicoOtpParse , yubicoModhex )", "PORTABLE"],
];
for (const [title, cls] of expect) {
  const got = classify(title);
  s.eq(`classify ${title.slice(0, 40)}`, got.cls, cls);
}
const classes = new Set(cards.map((c) => classify(c.title).cls));
s.ok("all five classes are used", ["PORTABLE", "PARTIAL", "SOFTWARE", "TERMINAL", "NOTFIT"].every((c) => classes.has(c)),
  [...classes].sort().join(","));

// --- regeneration: committed files are what the generator emits --------------
const { files } = generate();
s.eq("emitted file count", Object.keys(files).length, 7);
let fresh = true;
for (const [name, body] of Object.entries(files)) {
  if (readFileSync(join(JC, name), "utf8") !== body) fresh = false;
}
s.ok("samples/javacard/* matches the generator", fresh);

// --- JavaCard 2.2.2 language subset -------------------------------------------
const BANNED = ["String", "System.out", "Thread", " long ", "(long)", "double", "float",
  "enum ", "assert ", "synchronized", " instanceof ", "package java", "import java."];
const applets = Object.keys(files).filter((n) => n.endsWith(".java"));
s.eq("applet count", applets.length, 6);
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
for (const name of applets) {
  const src = stripComments(files[name]);
  const cls = name.replace(".java", "");
  s.ok(`${cls} is one applet class`, new RegExp(`public class ${cls} extends Applet`).test(src));
  s.ok(`${cls} has install/process`, /install\(byte\[\]/.test(src) && /process\(APDU apdu\)/.test(src));
  s.ok(`${cls} package + javacard imports only`,
    /package kitchen\.card;/.test(src) &&
    [...src.matchAll(/^import ([\w.]+);/gm)].every((m) => m[1].startsWith("javacard.")));
  const hits = BANNED.filter((b) => src.includes(b));
  s.ok(`${cls} avoids banned subset tokens`, hits.length === 0, hits.join(" ") || `${src.length} bytes`);
  const bal = (a, b) => (src.split(a).length - 1) === (src.split(b).length - 1);
  s.ok(`${cls} braces/parens/brackets balance`, bal("{", "}") && bal("(", ")") && bal("[", "]"));
}

// --- every API constant named must be a real one ------------------------------
const REAL = new Set([
  "Cipher.ALG_AES_BLOCK_128_CBC_NOPAD", "Cipher.ALG_DES_CBC_NOPAD",
  "Cipher.MODE_ENCRYPT", "Cipher.MODE_DECRYPT",
  "KeyBuilder.TYPE_AES", "KeyBuilder.LENGTH_AES_128",
  "KeyBuilder.TYPE_DES", "KeyBuilder.LENGTH_DES3_3KEY",
  "KeyBuilder.TYPE_HMAC", "KeyBuilder.LENGTH_HMAC_SHA_256_BLOCK_64",
  "KeyBuilder.LENGTH_RSA_1024", "KeyBuilder.LENGTH_EC_FP_256",
  "Signature.ALG_RSA_SHA_PKCS1", "Signature.ALG_ECDSA_SHA_256", "Signature.ALG_HMAC_SHA_256",
  "Signature.MODE_SIGN", "Signature.MODE_VERIFY",
  "MessageDigest.ALG_SHA_256",
  "KeyPair.ALG_RSA", "KeyPair.ALG_EC_FP",
  "ISO7816.OFFSET_CDATA", "ISO7816.OFFSET_INS", "ISO7816.OFFSET_LC",
  "ISO7816.SW_INS_NOT_SUPPORTED", "ISO7816.SW_WRONG_LENGTH",
  "ISO7816.SW_SECURITY_STATUS_NOT_SATISFIED",
]);
const used = new Set();
for (const name of applets) {
  for (const m of files[name].matchAll(/\b(Cipher|Signature|KeyBuilder|MessageDigest|KeyPair|ISO7816)\.[A-Z0-9_]+/g)) {
    used.add(m[0]);
  }
}
const bogus = [...used].filter((u) => !REAL.has(u));
s.ok("all named API constants are real", bogus.length === 0, `${used.size} used${bogus.length ? ": " + bogus.join(" ") : ""}`);

// --- SECP256R1 domain parameters, byte-exact -----------------------------------
const P256 = {
  p: "FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF",
  a: "FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC",
  b: "5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B",
  gx: "6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296",
  gy: "4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5",
  r: "FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551",
};
const ec = files["EcApplet.java"];
for (const [arr, want] of Object.entries(P256)) {
  const m = ec.match(new RegExp(`byte\\[\\] ${arr} = new byte\\[\\] \\{([\\s\\S]*?)\\};`));
  const got = m ? [...m[1].matchAll(/0x([0-9A-Fa-f]{2})/g)].map((x) => x[1]).join("").toUpperCase() : null;
  s.eq(`EcApplet SECP256R1 ${arr}`, got, want);
}

process.exit(s.done() ? 1 : 0);
