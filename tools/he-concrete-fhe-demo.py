#!/usr/bin/env python3
"""Real encrypted evaluation with Concrete 2.11 (TFHE-style bootstrapping).

Reproduce on CPython 3.11 x86-64 Linux:
    python3 -m pip install -r tools/he-concrete-requirements.txt
    python3 tools/he-concrete-fhe-demo.py

Small, fixed input domain; a client/server API boundary within ONE process,
not a deployed service. This never seeds, logs, serializes or publishes keys.
Do not mistake a successful demo for a security review or unlimited practical
throughput. Unlike BFV's bounded-depth example, this one verifies that the
compiled circuit contains programmable bootstraps.
"""

import json

from concrete import fhe


# Both inputs are 0..3. The largest table index is 3*3+3+1 = 13.
SQUARES = fhe.LookupTable([n * n for n in range(16)])
INPUTSET = [(x, y) for x in range(4) for y in range(4)]


def encrypted_function(x, y):
    """Nonlinear composition: encrypted multiply, add, then lookup."""
    return SQUARES[x * y + x + 1]


def run_demo():
    compiler = fhe.Compiler(encrypted_function, {"x": "encrypted", "y": "encrypted"})
    circuit = compiler.compile(INPUTSET)
    bootstraps = circuit.programmable_bootstrap_count
    if bootstraps < 1:
        raise AssertionError("Compiled circuit did not contain programmable bootstrapping")

    try:
        # Client holds the secret key. The server call receives encrypted values
        # and evaluation keys; it is not given the client or decrypted inputs.
        client, server = circuit.client, circuit.server
        client.keygen()  # use library randomness, no fixed seed or key cache
        results = []
        for x, y in INPUTSET:
            encrypted_x, encrypted_y = client.encrypt(x, y)
            if not isinstance(encrypted_x, fhe.Value) or not isinstance(encrypted_y, fhe.Value):
                raise AssertionError("Inputs were not encrypted Concrete values")
            encrypted_result = server.run(
                encrypted_x, encrypted_y, evaluation_keys=client.evaluation_keys
            )
            got = int(client.decrypt(encrypted_result))
            expected = (x * y + x + 1) ** 2
            if got != expected:
                raise AssertionError(f"FHE mismatch for {x}, {y}: {got} != {expected}")
            results.append({"x": x, "y": y, "result": got})
        return {"programmable_bootstraps": bootstraps, "results": results}
    finally:
        circuit.cleanup()


if __name__ == "__main__":
    print(json.dumps(run_demo(), sort_keys=True))
