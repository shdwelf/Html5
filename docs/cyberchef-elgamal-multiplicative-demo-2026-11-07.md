# CyberChef ElGamal multiplicative demo — 2026-11-07

## Scope and source

This adds one educational CyberChef operation, `elgamalMulDemo`, plus the named recipe pack **ElGamal Multiplicative Homomorphism (not FHE)**. It is based on the ElGamal example in David J. Wu, *Fully Homomorphic Encryption: Cryptography’s Holy Grail* ([PDF](https://www.cs.utexas.edu/~dwu4/papers/XRDSFHE.pdf), accessed 2026-11-07).

For a prime-order subgroup `G` of a finite field, let `h = g^α`. The example encrypts `m ∈ G` as `(g^r, h^r·m)` and decrypts `(c₀,c₁)` as `c₁/(c₀^α)`. Componentwise multiplication encrypts the product of plaintexts. Since that multiplies the supplied ciphertext randomizers rather than supplying new independent randomness, the example also rerandomizes by multiplying by a separately formed encryption of one, `Enc(1;s)`.

The PDF’s notation uses `p` for the group order. The operation instead uses `P` for the prime field modulus and `q` for the prime subgroup order; it requires `q | P−1`, a non-identity generator of the order-`q` subgroup, and subgroup members for both messages. Its primality check is deterministic Miller–Rabin over unsigned 64-bit integers, which is appropriate only for this bounded teaching example.

## Independently checked default vector

The paper does not supply this numeric vector. It was computed independently with Python’s modular `pow` and then pinned in `tests/cyberchef-elgamal-multiplicative.test.mjs`:

| Value | Result |
|---|---:|
| `P`, `q`, `g`, `α`, `h=g^α mod P` | `23`, `11`, `2`, `3`, `8` |
| `m₀=4`, `r₀=4`, `Enc(m₀;r₀)` | `(16, 8)` |
| `m₁=8`, `r₁=5`, `Enc(m₁;r₁)` | `(9, 13)` |
| Componentwise ciphertext product | `(6, 12)` |
| `m₀·m₁ mod P` and decrypted product | `9` |
| `s=3`, `Enc(1;s)` | `(8, 6)` |
| Rerandomized product ciphertext and decryption | `(2, 3)` → `9` |

The expected values in the test are constants, not computed by a test helper that repeats the application’s exponentiation logic. The test also rejects a composite modulus, a message outside the subgroup, an out-of-range randomizer, and a composite subgroup order.

## Safety and interpretation

- This demonstrates **one multiplicative homomorphism**, not fully homomorphic encryption. It does not implement arbitrary circuits, addition, GSW, bootstrapping, or any other FHE construction from the tutorial.
- The tiny group and explicit exponents are insecure. The operation is deterministic, does not sample randomness, and must not be used to protect data or generate real keys/ciphertexts.
- No existing ElGamal/FHE operation was found in the live local CyberChef registry before implementation. The operation appears once in the registry, once in its dedicated teaching pack, and once in the `Full Coverage — Public Key` pack.
- The Crypto Cookbook entry records the same scope, vector, source, and insecurity warning. The recipe count and coverage checks were updated from 517 to 518.

## Checks

Run:

```sh
node --test tests/cyberchef-elgamal-multiplicative.test.mjs \
  tests/cyberchef-cookbook.test.mjs \
  tests/cyberchef-archive-headers.test.mjs
node scripts/build-cyberchef-xdc.mjs
```

The ElGamal tests assert the independent vector, the not-FHE claim, subgroup validation, and the no-duplicate/dedicated-pack registration. The build synchronizes `public/apps/cyberchef-merged/index.html` and its Webxdc manifest/bundle from the kitchen.
