#!/usr/bin/env node
/**
 * cookbook_vectors.mjs — Ghidra-side fix-ups for the cookbook recipes.
 *
 * The cookbook's "Verified" badges claim agreement with published test
 * vectors. This tool re-checks every claim that is machine-checkable from
 * this checkout, with node:crypto as the independent implementation:
 *
 *   Camellia-128 RFC 3713   direct (camellia-128-ecb exists in OpenSSL 3)
 *   DES  NIST vector        via 3-key 3DES with K1=K2=K3 (EDE collapses to E)
 *   3DES NIST vector        reconstructed input (the card cites output only)
 *   RC4  "Plaintext"        tiny KSA+PRGA written from the card's own formula
 *   HMAC-SHA1 OnlyKey card  membership test against RFC 2104/2202 vectors
 *   ChaCha20 / Twofish / IDEA / APDU examples: reported, not checkable here
 *
 * Anything that fails, or that cannot be checked from what the card states, is
 * a FIX-UP item in samples/cookbook/VECTORS.md: either the recipe is wrong or
 * its evidence is missing. UNVERIFIABLE/SKIP do not fail the run; FAIL does.
 *
 * Usage:
 *   node tools/cookbook_vectors.mjs          # write samples/cookbook/VECTORS.md
 *   node tools/cookbook_vectors.mjs --check  # verify the committed report matches
 */

import { createCipheriv, createHmac, getCiphers } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COOKBOOK = join(ROOT, "public", "apps", "cookbook", "index.html");
const OUTDIR = join(ROOT, "samples", "cookbook");

const results = [];
const R = (recipe, verdict, detail) => results.push({ recipe, verdict, detail });

function ecb(algo, keyHex, ptHex) {
  const key = Buffer.from(keyHex, "hex");
  const c = createCipheriv(algo, key, null);
  c.setAutoPadding(false);
  return Buffer.concat([c.update(Buffer.from(ptHex, "hex")), c.final()]).toString("hex");
}

/** RC4 straight from the card's own KSA+PRGA formula. */
function rc4(keyBytes, dataBytes) {
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + keyBytes[i % keyBytes.length]) & 255;
    [S[i], S[j]] = [S[j], S[i]];
  }
  let i = 0;
  j = 0;
  const out = Buffer.alloc(dataBytes.length);
  for (let k = 0; k < dataBytes.length; k++) {
    i = (i + 1) & 255;
    j = (j + S[i]) & 255;
    [S[i], S[j]] = [S[j], S[i]];
    out[k] = dataBytes[k] ^ S[(S[i] + S[j]) & 255];
  }
  return out;
}

function cardSlices(html) {
  const starts = [...html.matchAll(/<div class="card">/g)].map((m) => m.index);
  return starts.map((s, i) => {
    let slice = html.slice(s, i + 1 < starts.length ? starts[i + 1] : html.length);
    const cut = slice.search(/<h2|<div class="foot/);
    return cut > 0 ? slice.slice(0, cut) : slice;
  });
}

export function run() {
  results.length = 0;
  const html = readFileSync(COOKBOOK, "utf8");
  const ciphers = new Set(getCiphers());

  // 1. Camellia-128, RFC 3713 A.1: key = pt = 0123...3210 -> 67673138...
  {
    const want = "67673138549669730857065648eabe43";
    if (!ciphers.has("camellia-128-ecb")) {
      R("Camellia", "SKIP", "node build lacks camellia-128-ecb");
    } else {
      const got = ecb("camellia-128-ecb", "0123456789abcdeffedcba9876543210", "0123456789abcdeffedcba9876543210");
      R("Camellia", got === want ? "PASS" : "FAIL", `RFC 3713 A.1 ECB: got ${got}`);
    }
  }

  // 2. DES NIST vector via the EDE identity: EDE(K,K,K) == E(K).
  {
    const want = "85e813540f0ab405";
    if (!ciphers.has("des-ede3")) {
      R("DES", "SKIP", "node build lacks des-ede3");
    } else {
      const k = "133457799bbcdff1";
      const got = ecb("des-ede3", k + k + k, "0123456789abcdef");
      const cited = html.includes("0123456789ABCDEF");
      R("DES", got === want ? "PASS" : "FAIL",
        `key 133457799BBCDFF1, pt 0123456789ABCDEF: got ${got}${cited ? " (input cited in the card)" : " — FIX-UP: card cites key->ct only"}`);
    }
  }

  // 3. 3DES: the card cites only the output 95F8A5E5DD31D900, so reconstruct.
  {
    const want = "95f8a5e5dd31d900";
    const tries = [
      ["0101010101010101".repeat(3), "8000000000000000", "NIST all-01 keys, pt 8000… (SP 800-67 style)"],
      ["0101010101010101".repeat(3), "0000000000000000", "all-01 keys, zero pt"],
      ["0101010101010101".repeat(3), "0123456789abcdef", "all-01 keys, 0123… pt"],
    ];
    let hit = null;
    for (const [key, pt, note] of tries) {
      if (ecb("des-ede3", key, pt) === want) {
        hit = note;
        break;
      }
    }
    R("Triple DES (3DES / TDEA)", hit ? "PASS" : "FAIL",
      hit ? `matches with ${hit}${html.includes("8000000000000000") ? " (input cited in the card)" : " — FIX-UP: cite the input in the card"}` : "no reconstructed input matches; card cites output only");
  }

  // 4. RC4: key "Key", plaintext "Plaintext" -> BBF316E8D940AF0AD3.
  {
    const got = rc4(Buffer.from("Key"), Buffer.from("Plaintext")).toString("hex");
    R("RC4", got === "bbf316e8d940af0ad3" ? "PASS" : "FAIL", `KSA+PRGA from the card formula: got ${got}`);
  }

  // 5. HMAC-SHA1: whatever 20-byte hex the OnlyKey card cites, it must be one
  // of the RFC vectors the card claims. (The card once cited f60aadb8…, which
  // is in no RFC, in no OnlyKey-App source, and nowhere else on GitHub — the
  // fix-up replaced it with RFC 2104 T2.)
  const slices = cardSlices(html);
  const titleOf = (s) => {
    const m = s.match(/<h3>([\s\S]*?)<\/h3>|<h3>([^<\n]*)/);
    return m ? (m[1] ?? m[2]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "?";
  };
  {
    const card = slices.find((s) => titleOf(s).startsWith("OnlyKey HMAC-SHA1"));
    const claimed = card ? (card.match(/([0-9a-fA-F]{40})/) || [])[1] : null;
    const h = (k, d) => createHmac("sha1", k).update(d).digest("hex");
    const candidates = {
      "RFC2104-T1 Hi There": h(Buffer.alloc(20, 0x0b), "Hi There"),
      "RFC2104-T2 Jefe": h("Jefe", "what do ya want for nothing?"),
      "RFC2104-T3 AA/DD": h(Buffer.alloc(20, 0xaa), Buffer.alloc(50, 0xdd)),
      "RFC2202-T4 01..19/CD": h(Buffer.from(Array.from({ length: 20 }, (_, i) => i + 1)), Buffer.alloc(50, 0xcd)),
      "empty/empty": h("", ""),
    };
    const match = claimed && Object.entries(candidates).find(([, v]) => v === claimed.toLowerCase());
    R("OnlyKey HMAC-SHA1", match ? "PASS" : "FAIL",
      !claimed ? "card cites no 20-byte hex — FIX-UP: add the RFC 2104 vector" :
      match ? `${claimed.slice(0, 12)}… matches ${match[0]}` :
        `${claimed.slice(0, 12)}… matches none of ${Object.keys(candidates).length} RFC candidates — FIX-UP: label it honestly`);
  }

  // 6. Claims with no machine-checkable evidence in the card.
  for (const s of slices) {
    const t = titleOf(s);
    if (t === "ChaCha20") {
      R(t, "UNVERIFIABLE", "card claims RFC 7539 keystream agreement but cites no vector — FIX-UP: add §2.3.2 keystream hex");
    }
    if (t.startsWith("Twofish")) {
      R("Twofish", "SKIP", "node has no twofish cipher; card cites 9F589F5C… (128-bit zero vector) — needs the in-app harness");
    }
    if (t.startsWith("IDEA")) {
      R("IDEA", "SKIP", "node has no idea cipher; card cites 11FBED2B01986DE5 — needs the in-app harness");
    }
  }

  // 7. APDU-bearing cards: short command APDUs must parse as ISO 7816-4
  // case 1 (header only), 2S (header + Le), 3S (+ Lc CData) or 4S (+ Le).
  // Response bytes (e.g. "U2F_V2" + 9000) are not commands and are ignored.
  {
    const apduCards = slices.filter((s) => /APDU/.test(s));
    const hexes = [];
    for (const s of apduCards) {
      for (const m of s.matchAll(/(?:^|[^0-9A-Fa-f])([0-9A-Fa-f]{8,})(?:[^0-9A-Fa-f]|$)/g)) hexes.push(m[1]);
    }
    const shortApduOk = (h) => {
      if (h.length % 2 || h.length < 8) return false;
      if (h.length === 8 || h.length === 10) return true; // case 1 / 2S
      const lc = parseInt(h.slice(8, 10), 16);
      return h.length === 10 + lc * 2 || h.length === 10 + lc * 2 + 2; // 3S / 4S
    };
    const shaped = hexes.filter(shortApduOk);
    // A blob that opens with a command CLA but parses as nothing is corrupt.
    const bad = hexes.filter((h) => /^(00|80|0c|a0|b0)/i.test(h) && !shortApduOk(h) && h.length > 10);
    R("FIDO/PIV/Yubico APDU examples",
      bad.length ? "FAIL" : shaped.length ? "PASS" : "UNVERIFIABLE",
      bad.length ? `length-inconsistent: ${bad.map((b) => b.slice(0, 20)).join(",")}` :
      shaped.length ? `${shaped.length} short-APDU example(s) parse (${shaped.map((b) => b.slice(0, 10)).join(",")}…)` :
        `${apduCards.length} cards mention APDU but embed no checkable example — FIX-UP: add one CLA/INS/P1/P2/Lc walk-through`);
  }

  let md = `# Cookbook vector check — Ghidra-side fix-ups\n\nGenerated by \`tools/cookbook_vectors.mjs\` (node ${process.version}, independent\nimplementation: node:crypto + the card's own stated formulas). Verdicts:\n\n| recipe | verdict | detail |\n| --- | --- | --- |\n`;
  for (const r of results) md += `| ${r.recipe} | ${r.verdict} | ${r.detail} |\n`;
  const fixups = results.filter((r) => r.verdict === "FAIL" || r.verdict === "UNVERIFIABLE");
  md += `\n${fixups.length} open fix-up item(s). FAIL exits non-zero; SKIP/UNVERIFIABLE are recorded, not hidden.\n`;
  md += `\n## Firmware side\n\nNo cookbook recipe ships firmware bytes, so there is nothing for the AVR walk\nto chew on here. The firmware check stays \`node tools/ghidra_avr.mjs\` over the\nvendored bootloaders (Optiboot: 208/243 reachable, 2 provably dead SPM sites;\nMicronucleus: 619/681, all sites live) — see docs/GHIDRA_COOKBOOK.md.\n`;
  return md;
}

const check = process.argv.includes("--check");
const md = run();
const fails = results.filter((r) => r.verdict === "FAIL").length;
if (check) {
  let have = null;
  try {
    have = readFileSync(join(OUTDIR, "VECTORS.md"), "utf8");
  } catch {
    have = null;
  }
  // The report embeds the node version; compare past the header line.
  const norm = (t) => (t || "").replace(/\(node [^)]+/, "(node X");
  if (norm(have) !== norm(md)) {
    console.error("STALE samples/cookbook/VECTORS.md: regenerate with: node tools/cookbook_vectors.mjs");
    process.exit(1);
  }
  console.log(`VECTORS.md fresh (${results.length} checks, ${fails} FAIL)`);
  process.exit(fails ? 1 : 0);
}
mkdirSync(OUTDIR, { recursive: true });
writeFileSync(join(OUTDIR, "VECTORS.md"), md);
for (const r of results) console.log(`${r.verdict.padEnd(12)} ${r.recipe} — ${r.detail}`);
process.exit(fails ? 1 : 0);
