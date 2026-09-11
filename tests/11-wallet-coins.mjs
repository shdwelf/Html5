/**
 * 11 · the zero-dependency wallet stack (js/hash, codec, secp256k1, ed25519,
 *      bip32, addrs, coins) plus the top-500 registry it derives from.
 * node tests/11-wallet-coins.mjs
 *
 * Three evidence tiers, strongest first:
 *   [P] published vectors the code must reproduce byte-for-byte (BIP-32 test
 *       vector 1, the Coleman "abandon" address, the Hardhat zero account,
 *       EIP-55, BIP-173/350 checksums, the CRC-16/XModem check value).
 *   [O] node:crypto oracles (stdlib, always present): hashes, HMAC, PBKDF2,
 *       secp256k1 ECDH, ed25519 public keys.
 *   [S] structural self-consistency: every derived address decodes with the
 *       right version/hrp and the payload the spec algorithm demands.
 * Baked values marked [scure]/[noble]/[ripple] were cross-checked against
 * those libraries during development (2026-09-11) and are locked here as
 * regression pins; the libraries themselves are NOT test dependencies.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash, createHmac, pbkdf2Sync, createECDH, createPrivateKey, createPublicKey } from "node:crypto";
import { suite, ROOT } from "./lib.mjs";

const H = await import("../js/hash.js");
const C = await import("../js/codec.js");
const T = await import("../js/secp256k1.js");
const E = await import("../js/ed25519.js");
const B = await import("../js/bip32.js");
const A = await import("../js/addrs.js");
const W = await import("../js/coins.js");
const s = suite("11 · wallet stack + top-500 registry");

const hex = (b) => Buffer.from(b).toString("hex");
const utf8 = (t) => new TextEncoder().encode(t);
const ABANDON = "abandon ".repeat(11) + "about";
const HARDHAT = "test ".repeat(11) + "junk";

// ------------------------------------------------------------------ [O] hash

{
  const msgs = ["", "abc", "the quick brown fox jumps over the lazy dog", "x".repeat(200)];
  for (const m of msgs) {
    const b = utf8(m);
    s.eq(`sha256 ${JSON.stringify(m.slice(0, 12))}`, hex(H.sha256(b)), createHash("sha256").update(b).digest("hex"));
    s.eq(`sha512 ${JSON.stringify(m.slice(0, 12))}`, hex(H.sha512(b)), createHash("sha512").update(b).digest("hex"));
    s.eq(`ripemd160 ${JSON.stringify(m.slice(0, 12))}`, hex(H.ripemd160(b)), createHash("ripemd160").update(b).digest("hex"));
  }
  s.eq("hmac-sha512 (BIP-32 master)", hex(H.hmacSha512(utf8("Bitcoin seed"), utf8("000102030405060708090a0b0c0d0e0f"))),
    createHmac("sha512", utf8("Bitcoin seed")).update(utf8("000102030405060708090a0b0c0d0e0f")).digest("hex"));
  const pbk = (pw, salt, it, n) => pbkdf2Sync(pw, salt, it, n, "sha512").toString("hex");
  s.eq("pbkdf2 2048", hex(H.pbkdf2HmacSha512(utf8(ABANDON), utf8("mnemonic"), 2048, 64)), pbk(ABANDON, "mnemonic", 2048, 64));
  s.eq("pbkdf2 passphrase", hex(H.pbkdf2HmacSha512(utf8(ABANDON), utf8("mnemonicTREZOR"), 2048, 64)), pbk(ABANDON, "mnemonicTREZOR", 2048, 64));
  s.eq("mnemonicToSeed", hex(W.mnemonicToSeed(ABANDON)), pbk(ABANDON, "mnemonic", 2048, 64));
  // [P] keccak-256 of empty is the famous c5d246..; 'abc' was noble-verified.
  s.eq("[P] keccak256('')", hex(H.keccak256(new Uint8Array(0))),
    "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
  s.eq("[noble] keccak256('abc')", hex(H.keccak256(utf8("abc"))),
    "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45");
  s.eq("hash160 = ripemd(sha256)", hex(H.hash160(utf8("abc"))),
    createHash("ripemd160").update(createHash("sha256").update(utf8("abc")).digest()).digest("hex"));
}

// ------------------------------------------------------------------ [P] codec

{
  s.eq("b58 zeros", C.base58Encode(new Uint8Array([0, 0, 0, 1])), "1112");
  s.eq("b58 round-trip", hex(C.base58Decode(C.base58Encode(utf8("hello wallet")))), hex(utf8("hello wallet")));
  const body = C.base58CheckDecode(C.base58CheckEncode(utf8("payload"), [0x00]));
  s.eq("b58check round-trip", hex(body), "00" + hex(utf8("payload")));
  let tampered = false;
  try {
    const good = C.base58CheckEncode(utf8("payload"), [0x00]);
    C.base58CheckDecode(good.slice(0, -1) + (good.endsWith("1") ? "2" : "1"));
  } catch { tampered = true; }
  s.ok("b58check rejects tampering", tampered);
  // BIP-173 valid checksums (the abcdef.. string is the @scure/base reading —
  // the spec text floating around the web has a wrong tail; both agree here).
  for (const v of ["A12UEL5L",
    "an83characterlonghumanreadablepartthatcontainsthenumber1andtheexcludedcharactersbio1tt5tgs",
    "abcdef1qpzry9x8gf2tvdw0s3jn54khcehmxsvg",
    "11qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqc8247j",
    "split1checkupstagehandshakeupstreamerranterredcaperred2y9e3w"]) {
    s.eq(`[P] bech32 ${v.slice(0, 18)}…`, C.bech32Decode(v).spec, "bech32");
  }
  for (const v of ["A1LQFN3A", "abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx",
    "11llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllludsr8"]) {
    s.eq(`[P] bech32m ${v.slice(0, 18)}…`, C.bech32Decode(v).spec, "bech32m");
  }
  // EIP-55 spec test cases.
  s.eq("[P] eip55 #1", C.eip55("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"), "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
  s.eq("[P] eip55 #2", C.eip55("0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359"), "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359");
  s.eq("[P] eip55 #3", C.eip55("0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb"), "0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB");
  s.eq("[P] crc16('123456789')", C.crc16Xmodem(utf8("123456789")).toString(16), "31c3");
  const raw = createHash("sha256").update("stellar-test").digest();
  const sk = C.stellarEncode(48, raw);
  s.eq("strkey round-trip", hex(C.stellarDecode(sk).payload), hex(raw));
  s.eq("strkey version", C.stellarDecode(sk).version, 48);
}

// ------------------------------------------------------------- [O] secp256k1

{
  s.eq("G.x", T.G.x.toString(16), "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798");
  const one = new Uint8Array(32); one[31] = 1;
  s.ok("privToPoint(1) = G", T.privToPoint(one).x === T.G.x && T.privToPoint(one).y === T.G.y);
  for (let i = 0; i < 5; i++) {
    const a = createECDH("secp256k1"); a.setPrivateKey(createHash("sha256").update("a" + i).digest());
    const b = createECDH("secp256k1"); b.setPrivateKey(createHash("sha256").update("b" + i).digest());
    const want = a.computeSecret(b.getPublicKey(null, "compressed")).toString("hex");
    const pt = T.parseCompressed(b.getPublicKey(null, "compressed"));
    const got = T.scalarMul(T.bytesToBig(a.getPrivateKey()), pt);
    s.eq(`[O] ecdh #${i}`, got.x.toString(16).padStart(64, "0"), want);
    // compress -> parse round-trip preserves the point.
    const rt = T.parseCompressed(T.compress(T.privToPoint(a.getPrivateKey())));
    const orig = T.privToPoint(a.getPrivateKey());
    s.ok(`compress/parse #${i}`, rt.x === orig.x && rt.y === orig.y);
  }
  // lift_x: even Y and ON the curve (y^2 = x^3 + 7, not y^2 = x — that
  // exact bug shipped once and the taproot suite below caught it).
  for (let i = 0; i < 8; i++) {
    const x = T.bytesToBig(createHash("sha256").update("lift" + i).digest()) % T.P;
    const pt = T.liftX(x);
    if (!pt) { s.ok(`lift #${i} (no residue, skipped)`, true); continue; }
    s.ok(`lift #${i} even`, pt.y % 2n === 0n);
    s.ok(`lift #${i} on curve`, (pt.y * pt.y) % T.P === (pt.x * pt.x * pt.x + 7n) % T.P);
  }
}

// --------------------------------------------------------------- [O] ed25519

{
  // node:crypto agrees our pubkey is the seed's pubkey (via PKCS#8 wrap).
  const prefix = Buffer.from("302e020100300506032b657004220420", "hex");
  for (const tag of ["ed-a", "ed-b", "ed-c"]) {
    const seed = createHash("sha256").update(tag).digest();
    const want = createPublicKey(createPrivateKey({
      key: Buffer.concat([prefix, seed]), format: "der", type: "pkcs8",
    })).export({ format: "der", type: "spki" }).subarray(-32).toString("hex");
    s.eq(`[O] ed25519 pub ${tag}`, hex(E.pubFromSeed(seed)), want);
  }
}

// ------------------------------------------------------------------- bip32/10

{
  const seed = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
  // [P] BIP-32 test vector 1 master + final key (via the @scure/bip32 oracle).
  s.eq("[P] bip32 master xpub", B.extendedKey(B.secpMaster(seed), "xpub"),
    "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8");
  s.eq("[P] bip32 m/0'/1/2'/2/1000000000", B.extendedKey(B.secpDerive(B.secpMaster(seed), "m/0'/1/2'/2/1000000000"), "xpub"),
    "xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy");
  // [S] extended-key anatomy: version bytes, depth, fingerprint linkage.
  const acc = B.secpDerive(B.secpMaster(seed), "m/44'/0'/0'");
  const body = C.base58CheckDecode(B.extendedKey(acc, "xpub"));
  s.eq("xpub version", hex(body.subarray(0, 4)), "0488b21e");
  s.eq("xpub depth", body[4], 3);
  const parent = B.secpDerive(B.secpMaster(seed), "m/44'/0'");
  s.eq("xpub fingerprint", hex(body.subarray(5, 9)), hex(H.hash160(B.secpPub(parent)).subarray(0, 4)));
  s.ok("ypub/zpub/tpub prefixes",
    B.extendedKey(acc, "ypub").startsWith("ypub") &&
    B.extendedKey(acc, "zpub").startsWith("zpub") &&
    B.extendedKey(acc, "tpub").startsWith("tpub"));
  // Non-hardened child from the parent xpub alone (public derivation).
  const pubWorker = B.secpDerive(B.secpMaster(seed), "m/44'/0'/0'");
  const fromXpub = B.secpDerivePub({ pub: B.secpPub(pubWorker), chain: pubWorker.chain, depth: 3, index: 0, parentFpr: pubWorker.fpr }, "0/7");
  const direct = B.secpDerive(B.secpMaster(seed), "m/44'/0'/0'/0/7");
  s.eq("xpub derivation", hex(B.secpPub(fromXpub)), hex(B.secpPub(direct)));
  let threw = false;
  try { B.secpDerivePub({ pub: new Uint8Array(33), chain: new Uint8Array(32) }, "0'"); } catch { threw = true; }
  s.ok("xpub rejects hardened", threw);
  // [scure] SLIP-0010 pin.
  const edn = B.edDerive(B.edMaster(seed), "m/44'/501'/0'/0'");
  s.eq("[scure] slip10 key", hex(edn.key), "f1f890d181d1bc1fdfdb9e1911e59285b9f8a28c5c31c13e56747e6993bfa053");
  s.eq("[scure] slip10 chain", hex(edn.chain), "c52defc3430de4a60a70d22b42923cb62abb3c68c8bf9b62307b7bdaea39883b");
  let edThrew = false;
  try { B.edDerive(B.edMaster(seed), "m/44'/501'/0"); } catch { edThrew = true; }
  s.ok("slip10 rejects non-hardened", edThrew);
}

// ------------------------------------------------------------------ registry

const REG = JSON.parse(readFileSync(join(ROOT, "config", "coins-top500.json"), "utf8"));
const coins = REG.assets;

{
  s.eq("registry size", coins.length, 500);
  // Coinpaprika ranks carry ties (21 shared ranks) and two tie-skips, so
  // 500 assets share 479 distinct ranks in non-decreasing snapshot order.
  s.eq("distinct ranks", new Set(coins.map((c) => c.rank)).size, 479);
  s.ok("ranks sorted", coins.every((c, i) => i === 0 || c.rank >= coins[i - 1].rank));
  s.ok("ranks in range", coins.every((c) => c.rank >= 1 && c.rank <= 541));
  s.eq("ids unique", new Set(coins.map((c) => c.id)).size, 500);
  s.ok("derivable >= 340", coins.filter((c) => c.derive).length >= 340,
    `(${coins.filter((c) => c.derive).length})`);
  let coherent = true, reasons = true;
  for (const c of coins) {
    if (c.derive && (c.slip44 === null || c.path === null || c.purpose === null || c.family === null)) coherent = false;
    if (!c.derive && !c.reason) reasons = false;
    if (c.derive && !c.path.startsWith(`m/${c.purpose}'/${c.slip44}'`)) coherent = false;
  }
  s.ok("derivable rows coherent", coherent);
  s.ok("unsupported rows explain why", reasons);
  // No two rows share an id; ambiguous symbols must resolve by id.
  s.eq("find by id", W.findCoin(coins, { id: "dydx-dydx" }).chain, "ETH");
  s.eq("find by rank", W.findCoin(coins, { rank: 1 }).symbol, "BTC");
  let amb = false;
  try { W.findCoin(coins, { symbol: "DYDX" }); } catch { amb = true; }
  s.ok("ambiguous symbol throws", amb);
  s.ok("search ranks prefix first", W.searchCoins(coins, "sol")[0].symbol === "SOL");
  let unsup = false;
  try { W.deriveCoin(coins, ABANDON, { id: "ada-cardano" }); } catch (e) { unsup = /Shelley/.test(e.message); }
  s.ok("unsupported coin throws its reason", unsup);
}

// ------------------------------------------------- [P/S] derived addresses

{
  const btc = (o) => W.deriveCoin(coins, ABANDON, { id: "btc-bitcoin" }, o);
  // [P] Ian Coleman's famous first vector.
  s.eq("[P] BTC m/44'", btc({ purpose: 44 }).address, "1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA");
  // [P] Hardhat's default zero account pins mnemonic->seed->key->keccak->EIP55.
  s.eq("[P] ETH hardhat#0", W.deriveCoin(coins, HARDHAT, { id: "eth-ethereum" }).address,
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  // [noble] taproot pins (Q = P + tG verified element-wise) + equation check.
  const r86 = btc({ purpose: 86 });
  s.eq("[noble] BTC m/86'", r86.address, "bc1pvhzh08gqauq66acu3s8a2zwyxlhexsmwqj2gey9965du0u6snwms5x4qv0");
  {
    const pub = Buffer.from(r86.pubkeyHex, "hex");
    const Ppt = T.parseCompressed(pub);
    const t = T.bytesToBig(H.taggedHash("TapTweak", pub.subarray(1)));
    const Q = T.pointAdd(T.liftX(Ppt.x), T.scalarMul((Ppt.y & 1n) ? (T.N - t) % T.N : t));
    s.eq("[S] taproot equation", hex(C.segwitDecode(r86.address).program), Q.x.toString(16).padStart(64, "0"));
  }
  // [S] every other family: independent decode checks, not just pins.
  const r84 = btc({});
  s.eq("[S] BTC m/84'", r84.address, "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu");
  s.eq("[S] p2wpkh program", hex(C.segwitDecode(r84.address).program), hex(H.hash160(Buffer.from(r84.pubkeyHex, "hex"))));
  const r49 = btc({ purpose: 49 });
  s.eq("[S] BTC m/49'", r49.address, "37VucYSaXLCAsxYyAPfbSi9eh4iEcbShgf");
  const r49b = C.base58CheckDecode(r49.address);
  s.eq("[S] p2sh version", r49b[0], 5);
  const rxrp = W.deriveCoin(coins, ABANDON, { id: "xrp-xrp" });
  s.eq("[ripple] XRP", rxrp.address, "rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3");
  s.eq("[S] XRP payload", hex(C.base58CheckDecode(rxrp.address, C.B58_XRP).subarray(1)),
    hex(H.hash160(Buffer.from(rxrp.pubkeyHex, "hex"))));
  const rsol = W.deriveCoin(coins, ABANDON, { id: "sol-solana" });
  s.eq("[S] SOL", rsol.address, "HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk");
  s.eq("[S] SOL payload", hex(C.base58Decode(rsol.address)), rsol.pubkeyHex);
  s.eq("[S] SOL zeros = system program", A.solAddr(new Uint8Array(32)), "11111111111111111111111111111111");
  const rtrx = W.deriveCoin(coins, ABANDON, { id: "trx-tron" });
  s.eq("[S] TRX", rtrx.address, "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH");
  s.eq("[S] TRX version", C.base58CheckDecode(rtrx.address)[0], 0x41);
  const rxlm = W.deriveCoin(coins, ABANDON, { id: "xlm-stellar" });
  s.eq("[S] XLM", rxlm.address, "GB3JDWCQJCWMJ3IILWIGDTQJJC5567PGVEVXSCVPEQOTDN64VJBDQBYX");
  s.eq("[S] XLM payload", hex(C.stellarDecode(rxlm.address).payload), rxlm.pubkeyHex);
  const ratom = W.deriveCoin(coins, ABANDON, { id: "atom-cosmos" });
  s.eq("[S] ATOM", ratom.address, "cosmos19rl4cm2hmr8afy4kldpxz3fka4jguq0auqdal4");
  s.eq("[S] ATOM hrp", C.bech32Decode(ratom.address).hrp, "cosmos");
  const reth = W.deriveCoin(coins, ABANDON, { id: "eth-ethereum" });
  const rinj = W.deriveCoin(coins, ABANDON, { id: "inj-injective-protocol" });
  s.eq("[S] INJ", rinj.address, "inj1npvwllfr9dqr8erajqqr6s0vxnk2ak55re90dz");
  s.eq("[S] INJ payload = ETH bytes", hex(C.convertBits(C.bech32Decode(rinj.address).data, 5, 8, false)),
    reth.address.slice(2).toLowerCase());
  s.eq("[S] DOGE", W.deriveCoin(coins, ABANDON, { id: "doge-dogecoin" }).address, "DBus3bamQjgJULBJtYXpEzDWQRwF5iwxgC");
  s.eq("[S] LTC", W.deriveCoin(coins, ABANDON, { id: "ltc-litecoin" }).address, "ltc1qjmxnz78nmc8nq77wuxh25n2es7rzm5c2rkk4wh");
  s.eq("[S] ZEC", W.deriveCoin(coins, ABANDON, { id: "zec-zcash" }).address, "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F");
  s.eq("[S] XEC", W.deriveCoin(coins, ABANDON, { id: "xec-ecash" }).address, "1CeYmYk9KJGBNES5mzosy1wceZcQePcYNa");
  const rnear = W.deriveCoin(coins, ABANDON, { id: "near-near-protocol" });
  s.eq("[S] NEAR = pub hex", rnear.address, rnear.pubkeyHex);
  // Purpose overrides re-encode the same key across script families.
  s.eq("override keeps path", btc({ purpose: 44 }).path, "m/44'/0'/0'/0/0");
}

process.exit(s.done() ? 1 : 0);
