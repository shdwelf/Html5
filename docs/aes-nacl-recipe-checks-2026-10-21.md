# AES + NaCl recipe checks — 21 Oct 2026

**Request:** "try aes nc recipe and continue." In the CyberChef lab registry
"nc" resolves to the **NaCl** family (`naclSecretbox` = NaCl / TweetNaCl
crypto_secretbox, plus the "NaCl / Keybase Saltpack Encrypt" recipe pack), so
this pass verifies the **AES** and **NaCl** recipes against known-answer
vectors and independent implementations.

Test: [`tests/aes-nacl-recipe-vectors.test.mjs`](../tests/aes-nacl-recipe-vectors.test.mjs)
(9 tests, all PASS). It boots `public/apps/cyberchef/index.html` in JSDOM and
calls the registry ops the way the apply path does — `op.run(data, args)`.

```console
$ node --test tests/aes-nacl-recipe-vectors.test.mjs
# tests 9
# pass 9
```

## 1. Layers of evidence

| # | Recipe | Verified against | Result |
| --- | --- | --- | --- |
| 1 | `naclSecretbox` | **Official NaCl test vector** + tweetnacl (npm, independent impl) | PASS both directions + tamper rejection |
| 2 | `aesGCM` | Re-derived in `node:crypto`: PBKDF2-SHA256 100k, salt = iv, AES-256-GCM | PASS round-trip + wrong-password/tamper rejection |
| 3 | `aesCBC` | Same re-derivation with AES-256-CBC + PKCS#7 | PASS round-trip + wrong-password rejection |
| 4 | `saltpackEncrypt` | Self-consistent seal/open (secretbox core = layer 1) | PASS round-trip + wrong-passphrase rejection |

## 2. The official NaCl vector (pinned)

From the NaCl distribution as mirrored in
[`jedisct1/libsodium`](https://github.com/jedisct1/libsodium) —
`test/default/secretbox.c` (key, nonce, message `m[163]`) + `secretbox.exp`
(expected box). The message is 131 bytes (`m[32..]` of the test array); the box
is 147 bytes = 16-byte Poly1305 tag `f3ffc770…` followed by the ciphertext.
These are exactly the *default argument values* of the `naclSecretbox` op —
the test asserts that too, so the recipe's UI defaults are pinned to the
official example.

```
key   1b27556473e985d462cd51197a9a46c76009549eac6474f206c4ee0844f68389
nonce 69696ee955b62b73cd62bda875fc73d68219e0036b7a0b37
msg   be075fc53c81f2d5cf141316ebeb0c7b5228c52a4c62cbd44b66849b64244ffc
      e5ecbaaf33bd751a1ac728d45e6c61296cdc3c01233561f41db66cce314adb31
      0e3be8250c46f06dceea3a7fa1348057e2f6556ad6b1318a024a838f21af1fde
      048977eb48f59ffd4924ca1c60902e52f0a089bc76897040e082f93776384864
      5e0705
box   f3ffc7703f9400e52a7dfb4b3d3305d98e993b9f48681273c29650ba32fc76ce
      48332ea7164d96a4476fb8c531a1186ac0dfc17c98dce87b4da7f011ec48c97
      271d2c20f9b928fe2270d6fb863d51738b48eeee314a7cc8ab932164548e526a
      e90224368517acfeabd6bb3732bc0e9da99832b61ca01b6de56244a9e88d5f9b
      37973f622a43d14a6599b1f654cb45a74e355a5
```

What the test proves at layer 1:

- `naclSecretbox.run(msgHex, {mode:encrypt, infmt:hex})` emits exactly the
  official box hex (the lab's own XSalsa20-Poly1305 implementation —
  `xsalsa20Stream` + `poly1305` in the app — matches the official artifact).
- `tweetnacl` (npm `dchest/tweetnacl-js`) encrypts the same raw bytes to the
  same box, and opens the official box back to the official message — an
  independent implementation agreeing in both directions.
- `mode:decrypt` on the official box returns the official message; a single
  flipped ciphertext nibble fails the MAC (`secretbox: MAC check failed`).
- Text-mode round-trip (`Too many secrets.`) matches tweetnacl over the UTF-8
  bytes.

## 3. AES recipes (password → PBKDF2 → AES-256)

`aesGCM`/`aesCBC` derive the key with **PBKDF2-SHA256, 100,000 iterations,
salt = iv** (12-byte IV for GCM, 16-byte for CBC), then encrypt with
AES-256-GCM (128-bit tag) or AES-256-CBC (PKCS#7). Output is Base64 of
`iv ‖ ct ‖ tag` (GCM) or `iv ‖ ct` (CBC).

Because the recipe fixes the whole construction, the test re-derives it
independently in `node:crypto` and decrypts the op's output there — a
known-answer cross-check of the KDF parameters, IV placement, tag handling,
and padding. Wrong passwords and a flipped ciphertext byte are rejected.

## 4. Saltpack pack (the NaCl family recipe)

The pack **"NaCl / Keybase Saltpack Encrypt"** is exactly
`[naclSecretbox, saltpackEncrypt]` (asserted). `saltpackEncrypt` derives a
payload key/nonce from the passphrase via SHA-512, wraps a `secretbox` box in
MessagePack framing, and armor-62s it
(`BEGIN KEYBASE SALTPACK ENCRYPTED MESSAGE.` …). Seal → open round-trips;
the wrong passphrase recovers nothing. Honesty note (already in the op's own
description): the secretbox core is **Verified** (§2), the framing is
**Educational / self-consistent** — not keybase-cli byte-identical multi-recipient
Saltpack v2.

## 5. Repro

```console
$ node --test tests/aes-nacl-recipe-vectors.test.mjs    # 9 PASS
$ node --test tests/cyberchef-gb-rom.test.mjs           # 4 PASS (see the ROM doc)
$ node --test tests/uhs-gamegenie.test.mjs tests/haiku-vault-format-vector.test.mjs  # 14 PASS
```

## 6. Provenance

- Official vector: [`jedisct1/libsodium`](https://github.com/jedisct1/libsodium)
  `test/default/secretbox.c` + `secretbox.exp` (first block = `c[16..162]`).
- Independent check: [`dchest/tweetnacl-js`](https://github.com/dchest/tweetnacl-js)
  via npm (devDependency `tweetnacl`).
- AES re-derivation: Node.js built-in `node:crypto` (WebCrypto `crypto.subtle`
  is polyfilled into the JSDOM window from `node:crypto.webcrypto`).
