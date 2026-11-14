#!/usr/bin/env python3
"""Bootstrapped Concrete 2.11 circuit: encrypted arithmetic in a tiny field.

Reproduce on CPython 3.11 x86-64 Linux:
    python3 -m pip install -r tools/he-concrete-requirements.txt
    python3 tools/he-concrete-fhe-demo.py

The server receives encrypted numerator AND denominator, plus evaluation keys.
It derives the denominator's inverse via an encrypted lookup, not a plaintext
or client-computed inverse. Division by zero yields (quotient=0, valid=0), NOT
a field quotient; the validity flag is itself encrypted until client decrypts.
The input domain is only 0..3 and the prime modulus is 17. This is a concrete
bootstrapped fixed circuit, not a general-purpose arithmetic API, security
review, or isolated client/server deployment. No keys are seeded or exported.
"""

import json

from concrete import fhe


MODULUS = 17
INPUTSET = [(x, y) for x in range(4) for y in range(4)]
# Every index fits its LUT: x*y+x+1 <= 13, x-y+17 in 14..20,
# and x*inverse(y) <= 27. A field quotient exists only for y != 0.
SQUARES = fhe.LookupTable([n * n for n in range(16)])
INVERSES = fhe.LookupTable([0] + [pow(y, -1, MODULUS) for y in range(1, 4)])
REDUCE = fhe.LookupTable([n % MODULUS for n in range(32)])
DIVISOR_VALID = fhe.LookupTable([0, 1, 1, 1])


def encrypted_function(x, y):
    """Return nonlinear result, sum, difference, product, quotient, valid."""
    product = x * y
    difference = REDUCE[x - y + MODULUS]
    # Both y and the lookup result stay encrypted. Computing x/y using a
    # client-supplied inverse would not demonstrate encrypted-denominator FHE.
    quotient = REDUCE[x * INVERSES[y]]
    return (
        SQUARES[product + x + 1],
        x + y,
        difference,
        product,
        quotient,
        DIVISOR_VALID[y],
    )


def run_demo():
    compiler = fhe.Compiler(encrypted_function, {"x": "encrypted", "y": "encrypted"})
    circuit = compiler.compile(INPUTSET)
    bootstraps = circuit.programmable_bootstrap_count
    if bootstraps < 1:
        raise AssertionError("Compiled circuit did not contain programmable bootstrapping")

    try:
        # Client owns the secret key. The server API gets only ciphertexts and
        # evaluation keys, not plaintext inputs, a decryptor, or the client.
        client, server = circuit.client, circuit.server
        client.keygen()  # library randomness, no fixed seed or key cache
        results = []
        for x, y in INPUTSET:
            encrypted_x, encrypted_y = client.encrypt(x, y)
            if not isinstance(encrypted_x, fhe.Value) or not isinstance(encrypted_y, fhe.Value):
                raise AssertionError("Inputs were not encrypted Concrete values")
            encrypted_result = server.run(
                encrypted_x, encrypted_y, evaluation_keys=client.evaluation_keys
            )
            if not all(isinstance(value, fhe.Value) for value in encrypted_result):
                raise AssertionError("Server produced a non-encrypted result")
            got = tuple(int(value) for value in client.decrypt(encrypted_result))
            quotient = (x * pow(y, -1, MODULUS)) % MODULUS if y else 0
            expected = ((x * y + x + 1) ** 2, x + y, (x - y) % MODULUS,
                        x * y, quotient, int(y != 0))
            if got != expected:
                raise AssertionError(f"FHE mismatch for {x}, {y}: {got} != {expected}")
            if y and (got[4] * y) % MODULUS != x:
                raise AssertionError("Modular quotient does not invert the divisor")
            results.append({
                "x": x, "y": y, "result": got[0], "sum": got[1],
                "difference": got[2], "product": got[3],
                "quotient": got[4], "divisor_valid": got[5],
            })
        return {"modulus": MODULUS, "programmable_bootstraps": bootstraps,
                "results": results}
    finally:
        circuit.cleanup()


if __name__ == "__main__":
    print(json.dumps(run_demo(), sort_keys=True))
