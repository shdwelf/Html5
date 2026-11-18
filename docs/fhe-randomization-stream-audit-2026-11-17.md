# FHE randomization, known-input checks, and streaming boundary — 17 Nov 2026

## Decision

Use the encryption randomness already provided by the FHE libraries. Do **not**
XOR an extra bit pair, a timestamp, or a Luby Transform (LT) symbol into the
plaintext/ciphertext to make repeated encryptions look different. Such a mask
would change the value the circuit computes, can invalidate a ciphertext, and
is not a substitute for the scheme's randomized encryption.

For the streaming path, encrypt each bounded input chunk freshly; serialize the
result as a `Concrete` `Value`; authenticate and transport the bytes; then
reassemble the exact bytes before deserializing/evaluating. If the existing LT
fountain code is used, it belongs only around serialized transport packets for
erasure recovery. It does not hide data, authenticate packets, or refresh HE
noise. Its PRNG in `tools/cryptofountain_core.mjs` is a deterministic LCG and is
not a cryptographic nonce or key source.

## Circuit and domain

`tools/he-concrete-fhe-demo.py` now compiles one fixed, bootstrapped circuit
whose arithmetic semantics cover every residue in `F_17` (implemented as
Concrete integer operations and lookup tables, not as BFV's native plaintext
modulus):

- Inputs range over the complete field `x,y ∈ {0,…,16}`; the circuit's
  `INPUTSET` and integration test cover all 289 ordered pairs. A field pair is
  one independent stream chunk. If mapping bytes, one byte `b` can be represented
  as the base-17 pair `(b // 17, b % 17)`; the arithmetic result is not itself a
  reversible codec and does not hide chunk lengths/order.
- The client wrapper rejects values outside `0..16`. That range check is an
  application boundary, not a proof against a malicious client that constructs
  out-of-contract ciphertexts; a remote service would need an enforced range
  proof or a circuit that checks a wider encoding.
- The circuit returns field addition, subtraction, multiplication, partial
  modular division, and `((x*y mod 17) + x + 1)^2 mod 17`. Every arithmetic
  output remains in `F_17`, so the basis is closed under composition. Division
  by zero returns placeholder quotient zero and encrypted `divisor_valid = 0`;
  the client must decrypt and check this flag before using the quotient.
- Bounds are explicit and tested: raw `x*y ≤ 256`, reduction/LUT index `≤ 256`,
  square LUT index `≤ 33`, and square output in `0..16`. Field operations are
  exact modulo 17; this integer/LUT circuit has no approximate arithmetic
  error term.

The stream demonstration compiles once, generates one client keyset, then
evaluates every one of the 289 F_17 input pairs as an independent chunk with
fresh encrypted inputs. The server function is passed only two ciphertext
values and a deserialized **evaluation-only** keyset; it is not passed the
`Client` object, plaintext inputs, or a decryptor. A separate depth-8 test feeds
encrypted sum/product outputs into the same compiled circuit repeatedly and
decrypts only the final output. This checks chaining through this circuit's
compiled bootstraps; it is not a proof for arbitrary circuit families or
unbounded resource use. The stream test does not extend one ciphertext
indefinitely to represent an unbounded file.

## Randomization / known-plaintext smoke test

Both code paths now run concrete checks:

- `tools/he-bfv-demo.mjs` encrypts known values `a` and `b` twice under one
  freshly generated key, compares serialized BFV ciphertext bytes, and
  decrypts both repeats. `tests/he-bfv.test.mjs` asserts that the samples
  differ and preserve the known plaintexts. This remains a leveled BFV example
  with finite noise budget and **no bootstrapping**.
- The Concrete test compares two fresh encryptions of `(2,1)` with a second
  known example `(2,0)`. It checks input ciphertext bytes, evaluates all three
  through the compiled circuit, and client-decrypts the outputs against a
  plaintext oracle. The second vector exercises the zero-divisor flag.

Ciphertext inequality in a small test is a useful regression check for
accidentally deterministic/reused randomness. It is not a literal guarantee
that collisions are mathematically impossible, a statistical IND-CPA test, a
known-plaintext attack that recovers a secret, or independent cryptanalysis.
Fresh randomness gives distinct ciphertexts with overwhelming probability;
security rests on the library's cryptographic construction, correct parameter
selection and its assumptions. FHE is intentionally malleable, so ciphertext
randomization is not message authentication or CCA protection.

The Concrete wrapper also signs a canonical evaluation-key manifest with
Ed25519. The signed manifest binds the serialized evaluation-key digest, a
circuit ID, and the digest of the declared circuit/domain specification. The
opt-in test tampers with the evaluation-key bytes, signature and circuit ID
and requires rejection before key deserialization/evaluation. The demo creates
an ephemeral signing key and pins its public key in-process solely to exercise
this boundary. A real service must independently provision/pin an authorized
client signing key and bind the manifest to the exact compiled artifact,
compiler/runtime version and parameters; this demo is not that service.

## What LT can and cannot do here

1. Encrypt a chunk with Concrete using fresh library randomness.
2. Optionally serialize the encrypted value and packetize/redundantly encode
   those bytes with an erasure code for a lossy stream.
3. Authenticate packet metadata and payloads with a separate protocol, recover
   the byte-exact serialized value, then pass it to `fhe.Value.deserialize`.
4. Evaluate with the authenticated evaluation keys and decrypt client-side.

Do not feed LT XOR symbols to the arithmetic circuit as if they were added
randomness; do not treat LT's seed/packet IDs as nonces; and do not claim
compression, packet redundancy or ZIP/7z changes refresh ciphertext noise.
Only the Concrete compiled programmable bootstraps in this example refresh
noise while evaluating its supported circuit. The BFV demo has no such step.

## Reproduction and gates

```sh
npm ci
node --test tests/he-bfv.test.mjs
npm run demo:bfv

python3.11 -m venv .venv
. .venv/bin/activate
python -m pip install -r tools/he-concrete-requirements.txt
python tools/he-concrete-fhe-demo.py
RUN_CONCRETE_FHE=1 node --test tests/he-concrete.test.mjs
```

The Concrete/Torch dependency environment is optional and large; default
`npm test` skips the Concrete integration rather than faking it. Do not commit
that environment, generated keys, key bundles or serialized ciphertexts. In
this checkout the BFV test and CLI were run; the opt-in Concrete integration was
not run because its Concrete/Torch environment is absent. Python syntax, the
bounded lookup equations, and Ed25519 tamper cases were checked separately with
a local test stub; that is **not** an encrypt/evaluate/decrypt integration run.
Run the opt-in command above to make that claim for this revision. The Ed25519
check authenticates a test manifest, not the quality of the FHE parameters.
SEAL's reported security level is also a library parameter check, not
independent cryptanalysis. Neither example is a production service.

## Source trail

- Concrete 2.11.X [`Client`](https://github.com/zama-ai/concrete/blob/release/2.11.X/frontends/concrete-python/concrete/fhe/compilation/client.py), [`Keys`](https://github.com/zama-ai/concrete/blob/release/2.11.X/frontends/concrete-python/concrete/fhe/compilation/keys.py), [`Value`](https://github.com/zama-ai/concrete/blob/release/2.11.X/frontends/concrete-python/concrete/fhe/compilation/value.py), and [`EvaluationKeys`](https://github.com/zama-ai/concrete/blob/release/2.11.X/frontends/concrete-python/concrete/fhe/compilation/evaluation_keys.py) definitions were checked for the encrypt/decrypt boundary, byte serialization, and evaluation-only key serialization.
- Concrete's [`Csprng.cpp`](https://github.com/zama-ai/concrete/blob/release/2.11.X/compilers/concrete-compiler/compiler/lib/Common/Csprng.cpp) maps an unspecified/zero seed to `getRandomSeed`; its helper calls the backend's secure-random 128-bit source and warns if that source reports a non-cryptographic fallback. This is an implementation inspection, not an independent RNG audit.
- The repository's [`LT implementation`](../tools/cryptofountain_core.mjs) contains its LCG-based robust-soliton sampler and packet peeling decoder. It is a transport erasure code, not an FHE operation.
