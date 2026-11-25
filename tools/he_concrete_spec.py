#!/usr/bin/env python3
"""Public Concrete F17 circuit contract; requires only the Python standard library.

Print the canonical specification (the exact bytes hashed by the demo, plus a
trailing newline) without importing Concrete, Torch, or cryptography:
    python3 tools/he_concrete_spec.py

This is declared circuit metadata, not a compiled-artifact attestation or an
FHE evaluation. Keep private keys, evaluation keys and ciphertexts out of it.
"""

import hashlib
import json


MODULUS = 17
PLAINTEXT_MIN = 0
PLAINTEXT_MAX = MODULUS - 1
# Concrete keeps its 128-bit security default. This explicit per-TLU correctness
# target is recorded in the circuit manifest and runtime report; it is not a
# change to the cryptographic security level.
FHE_P_ERROR = 1.6e-6
# Composability changes the compiler contract and must be bound by the manifest.
COMPOSABLE = True
COMPRESS_EVALUATION_KEYS = True

# The real integration exhausts all 289 ordered field pairs after compilation.
# For byte streams, b can be represented as (b // 17, b % 17), one pair of
# field residues per chunk; this arithmetic circuit is not itself a codec.
INPUTSET = [(x, y) for x in range(PLAINTEXT_MIN, PLAINTEXT_MAX + 1)
            for y in range(PLAINTEXT_MIN, PLAINTEXT_MAX + 1)]

# Use the complete domain as the compilation inputset so Concrete observes the
# full range of every chunked intermediate, then exhaust it again under FHE.
COMPILE_INPUTSET = INPUTSET

# Conservative bounds for the small-width modular arithmetic circuit.
RAW_PRODUCT_MAX = PLAINTEXT_MAX ** 2
MAX_REDUCTION_INDEX = 2 * PLAINTEXT_MAX + 1
MAX_SQUARE_INDEX = (MODULUS - 1) + PLAINTEXT_MAX + 1
MULTIPLICATION_CHUNK_WIDTHS = (2, 2, 1)
MAX_MULTIVARIATE_INPUT_BITS = 5 + max(MULTIPLICATION_CHUNK_WIDTHS)

assert {value for pair in COMPILE_INPUTSET for value in pair} == set(range(MODULUS))
assert len(COMPILE_INPUTSET) == MODULUS * MODULUS
assert max(x * y for x, y in COMPILE_INPUTSET) == RAW_PRODUCT_MAX
assert max(x + y for x, y in COMPILE_INPUTSET) == 2 * PLAINTEXT_MAX
assert max(x - y + MODULUS for x, y in COMPILE_INPUTSET) == MAX_REDUCTION_INDEX
assert max((x * y % MODULUS) + x + 1 for x, y in COMPILE_INPUTSET) == MAX_SQUARE_INDEX
assert MAX_MULTIVARIATE_INPUT_BITS == 7

CIRCUIT_ID = "f17-complete-field-arithmetic-v6"
CIRCUIT_SPEC = {
    "schema": "arena-fhe-circuit-manifest-v1",
    "circuit_id": CIRCUIT_ID,
    "frontend": "concrete-python==2.11.0",
    "arithmetic_modulus": MODULUS,
    "security_level_bits": 128,
    "target_p_error_per_tlu": FHE_P_ERROR,
    "compress_evaluation_keys": COMPRESS_EVALUATION_KEYS,
    "composable": COMPOSABLE,
    "input_domain": {"x": [PLAINTEXT_MIN, PLAINTEXT_MAX],
                     "y": [PLAINTEXT_MIN, PLAINTEXT_MAX]},
    "operations": [
        "addition modulo 17",
        "subtraction modulo 17",
        "multiplication modulo 17",
        "partial division modulo 17 with encrypted zero-divisor flag",
        "square modulo 17 of (x*y mod 17)+x+1",
    ],
    "outputs": [
        "square_mod_17", "sum_mod_17", "difference_mod_17", "product_mod_17",
        "quotient_mod_17", "divisor_valid",
    ],
    "table_index_bounds": {
        "modular_reduction_inclusive_max": MAX_REDUCTION_INDEX,
        "square_lookup_inclusive_max": MAX_SQUARE_INDEX,
        "multivariate_packed_input_bit_width_max": MAX_MULTIVARIATE_INPUT_BITS,
    },
    "lookup_implementation": "chunked double-and-add modular multiplication",
    "multiplication_chunk_widths": list(MULTIPLICATION_CHUNK_WIDTHS),
    "semantic_intermediate_bounds": {
        "raw_product_max": RAW_PRODUCT_MAX,
        "reduction_index_max": MAX_REDUCTION_INDEX,
        "square_index_max": MAX_SQUARE_INDEX,
    },
}
CIRCUIT_SPEC_BYTES = json.dumps(
    CIRCUIT_SPEC, sort_keys=True, separators=(",", ":")
).encode("utf-8")
CIRCUIT_SPEC_SHA256 = hashlib.sha256(CIRCUIT_SPEC_BYTES).hexdigest()


if __name__ == "__main__":
    print(CIRCUIT_SPEC_BYTES.decode("utf-8"))
