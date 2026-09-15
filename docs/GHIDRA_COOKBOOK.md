# Ghidra-side fix-ups for the cookbook recipes

"With Ghidra to fix up cookbook recipes" — what that means in a checkout
whose cookbook is a document, not a binary: every machine-checkable claim a
recipe makes gets re-checked by an independent implementation, and anything
that fails, or that cannot be checked from what the card states, becomes a
fix-up. The tool is `tools/cookbook_vectors.mjs`; its report is
`samples/cookbook/VECTORS.md` (regenerated, `--check` gates it).

## Results (node v22, node:crypto as the second implementation)

| recipe | verdict | how |
| --- | --- | --- |
| Camellia-128 | PASS | RFC 3713 A.1 ECB straight through `camellia-128-ecb` → `67673138…` |
| DES | PASS | FIPS 46-3 vector via 3-key 3DES with K1=K2=K3 (EDE collapses to single DES; `des-ecb` is absent from OpenSSL 3 default) → `85E813540F0AB405` |
| 3DES | PASS | NIST all-`01` keys + pt `8000000000000000` → `95F8A5E5DD31D900` |
| RC4 | PASS | KSA+PRGA written from the card's own formula, key `"Key"` → `BBF316E8D940AF0AD3` |
| OnlyKey HMAC-SHA1 | PASS | cited hex matches RFC 2104 T2 (`"Jefe"`, computed locally) |
| ChaCha20 | UNVERIFIABLE | card claims RFC 7539 agreement but cites no vector — open fix-up: add the §2.3.2 keystream hex (not invented here) |
| Twofish / IDEA | SKIP | no node cipher; cards cite `9F589F5C…` / `11FBED2B01986DE5` — needs the in-app harness |
| FIDO/PIV/Yubico APDU | PASS | `0003000000` (U2F VERSION) parses as ISO 7816-4 case 2S |

## Fix-ups applied to the cookbook (4 cards, `public/apps/cookbook/index.html`)

1. **DES** — cited the plaintext (`0123456789ABCDEF`); the card claimed
   key→ciphertext only.
2. **3DES** — cited the input (all-`01` keys, pt `8000000000000000`); the
   card claimed the output only.
3. **OnlyKey HMAC-SHA1** — the real bug. The card cited `f60aadb8…` as an
   "RFC 2104 test vector". It is in no RFC 2104/2202 vector (all recomputed
   locally), in no OnlyKey-App source, and nowhere else on GitHub (code
   search: the cookbook itself is the only hit). Replaced with RFC 2104 T2
   (`effcdf6a…`), which the tool verifies; the OnlyKey port claim is kept
   and labeled as a port.
4. **FIDO U2F Raw APDU** — added the checkable example (`0003000000` →
   `"U2F_V2"` + `9000`); two cards mentioned APDUs with no example to parse.

## The firmware side (where Ghidra proper lives)

No cookbook recipe ships firmware bytes, so there is nothing here for a
disassembler to chew on — and the report says that instead of pretending.
The firmware checks stand where they stood:

- `node tools/ghidra_avr.mjs` + `node tools/verify_avrdis.mjs`: the AVR
  decoder at 225/225 vs `avr-objdump`, 78/78 branch targets; Optiboot
  208/243 reachable with 2 provably dead SPM sites, Micronucleus 619/681
  all live (`samples/avr/`, `avr-lab.html`).
- New in this window: the archive queue (`.arena-archive/requests.txt`) now
  stages the next firmware corpus — digital-laboratory programmer/magstripe
  software, dr7 AVR development tools, and the GL-iNet MT300N-V2 image
  (MIPS, so Ghidra-headless territory, not `ghidra_avr` territory).
- The Ghidra-headless route (JDK via the Actions runner — `.relay/jdk/`
  proves the channel) is still the unconfirmed answer to the dismissed
  question; when confirmed, these bytes are what it decompiles first.
