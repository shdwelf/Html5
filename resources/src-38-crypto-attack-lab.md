# Crypto Attack Lab — Portable Self-Contained Quine

> **Register:** src-38 · **Original:** https://bashupload.app/l0yuie.htm
> **Extracted:** 30 August 2026 · **Type:** self-published standalone HTML5 tool

Tabs: 🔍 KPA · 🔓 ORACLE · 🧰 TOOLS · 🧬 AES · #️⃣ HASH · 🧬 QUINE · RESET ALL
Modes covered: ECB · CBC · CFB · OFB · CTR · GCM · CCM · RSA

## Example panel — AES-ECB (CRITICALLY WEAK)
"Electronic Codebook — Each 16-byte block encrypts independently. Identical plaintext
blocks → identical ciphertext blocks. The famous 'ECB Penguin' proves structure leaks
visibly."
- NIST: SP 800-38A (deprecated for most uses)
- Real-world: "Never used in TLS. WEP broken. Image/DB field encryption disasters."
- SESSION: AES-128 key (hex) · IV/nonce (16 bytes) · add plaintext pair · generate 4
  sample pairs · encrypt → set as target · KNOWN PAIRS · TARGET CIPHERTEXT · ⚡ RUN ATTACK

## About this attack
"If the attacker knows even one block of plaintext, they can match any identical
ciphertext block and recover the plaintext for that block — **without ever knowing the
key**. This is why the 'ECB Penguin' image retains its outline when encrypted."
NIST guidance: "Prefer AES-GCM with unique 96-bit nonces or AES-CBC with random IVs +
HMAC. RSA must use OAEP. Never reuse nonces/IVs. Never use ECB for anything other than
key wrapping (and even then, avoid it)."

## Real-World Cryptographic Attacks (timeline)
| Year | Attack | Note |
|---|---|---|
| 1998 | Bleichenbacher → RSA PKCS#1 v1.5 | Padding oracle on SSL RSA (2¹⁵K queries) |
| 2011 | BEAST → TLS 1.0 CBC | Predictable IV → chosen-plaintext |
| 2013 | Lucky 13 → TLS CBC | Timing-based padding oracle (13 hash computations) |
| 2014 | POODLE → SSL 3.0 CBC | Forced downgrade + padding oracle |
| 2014 | CRIME → TLS compression | Compression side-channel leaks session cookies |
| 2016 | Nonce reuse → HTTPS GCM | Böck et al.: production servers reusing AES-GCM nonces |
| 2017 | ROBOT → RSA PKCS#1 v1.5 | Bleichenbacher still worked on Facebook, PayPal |
| 2017 | EFAIL → S/MIME, PGP | CFB/CBC manipulation + HTML oracle |
| 2024 | GCM Collision → AES-GCM 96-bit | <97 bits security with random nonces (Mattsson ePrint 2024/1111) |

"TLS 1.3 (2018) removed CBC, compression, and static RSA. Only AEAD modes
(GCM, ChaCha20-Poly1305) allowed."

## 🔮 Post-Quantum Transition (NIST 2024–2025)
- ML-KEM (Kyber) — FIPS 203 — key encapsulation; replaces RSA/ECDH
- ML-DSA (Dilithium) — FIPS 204 — signatures; primary RSA/ECDSA replacement
- SLH-DSA (SPHINCS+) — FIPS 205 — hash-based signatures; conservative backup
- FN-DSA (FALCON) — FIPS 206 — compact signatures
"NIST finalized PQC standards August 2024. Microsoft, Google, Cloudflare deploying
hybrid classical+PQC in TLS."

## All NIST SP 800-38 Approved Modes
| Mode | Spec | Enc | Auth | KPA Risk |
|---|---|---|---|---|
| ECB | 38A §6.1 | ⚠ | ✗ | 🔴 Block dictionary |
| CBC | 38A §6.2 | ✓ | ✗ | 🟢 Padding oracle only |
| CFB | 38A §6.3 | ✓ | ✗ | 🟡 Block 0 via IV reuse |
| OFB | 38A §6.4 | ✓ | ✗ | 🔴 Full keystream reuse |
| CTR | 38A §6.5 | ✓ | ✗ | 🔴 Full keystream reuse |
| CMAC | 38B | ✗ | ✓ | — |
| CCM | 38C | ✓ | ✓ | 🟡 CTR keystream only |
| GCM | 38D | ✓ | ✓ | 🔴 KS + GHASH key |
| XTS | 38E | ✓ | ✗ | — (disk encryption) |
| KW/KWP | 38F | ✓ | ✓ | — (key wrapping) |
| FF1/FF3 | 38G | ✓ | ✗ | — (format-preserving) |
