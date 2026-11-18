#!/usr/bin/env python3
"""Bootstrapped Concrete circuit and streaming/randomization audit.

Reproduce on CPython 3.11 x86-64 Linux:
    python3 -m pip install -r tools/he-concrete-requirements.txt
    python3 tools/he-concrete-fhe-demo.py
    RUN_CONCRETE_FHE=1 node --test tests/he-concrete.test.mjs

The circuit's arithmetic plaintext domain is the complete field F_17: each
encrypted input is a residue 0..16. Addition, subtraction, multiplication,
and partial division are evaluated modulo 17; the square control result is
also reduced modulo 17 so every arithmetic output remains composable in F_17.
An encrypted divisor-valid flag accompanies division. At y=0 the circuit
returns placeholder quotient 0 and divisor_valid=0; the client must decrypt
and check that flag before treating the quotient as a result.

Each stream chunk is independently encrypted with Concrete's fresh CSPRNG
randomness, evaluated by the server circuit (which compiles programmable
bootstraps), then decrypted by the client. A repeated-plaintext known-input
smoke test checks that two fresh serializations differ and decrypt/evaluate to
the same result. It is a regression check, not an attack or a proof of IND-CPA.

An Ed25519 signature binds the serialized evaluation-key digest to this
circuit's canonical manifest. The demo generates an ephemeral signing key and
pins its public key in-process only to test provenance and tamper rejection;
a deployed service must pin the client's signing key independently and use
separate client/server processes and an authenticated transport. No key is
persisted or printed. This remains an educational fixed circuit, not a
production service, general-purpose arbitrary-software FHE API, security
review, or proof about arbitrary software.
"""

import hashlib
import json

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from concrete import fhe


MODULUS = 17
PLAINTEXT_MIN = 0
PLAINTEXT_MAX = MODULUS - 1

# Exhaust the complete finite-field pair domain when validating the compiled
# circuit. For byte streams, a byte b can be represented as (b // 17, b % 17),
# one pair of field residues per chunk. The arithmetic result is not a codec.
INPUTSET = [(x, y) for x in range(PLAINTEXT_MIN, PLAINTEXT_MAX + 1)
            for y in range(PLAINTEXT_MIN, PLAINTEXT_MAX + 1)]

# Conservative upper bounds for all intermediate lookup indices.
RAW_PRODUCT_MAX = PLAINTEXT_MAX ** 2
MAX_REDUCTION_INDEX = max(
    RAW_PRODUCT_MAX,
    PLAINTEXT_MAX * (MODULUS - 1),  # x * inverse(y)
    2 * PLAINTEXT_MAX,               # x + y
)
MAX_SQUARE_INDEX = (MODULUS - 1) + PLAINTEXT_MAX + 1

CIRCUIT_ID = "f17-complete-field-arithmetic-v3"
CIRCUIT_SPEC = {
    "schema": "arena-fhe-circuit-manifest-v1",
    "circuit_id": CIRCUIT_ID,
    "frontend": "concrete-python==2.11.0",
    "arithmetic_modulus": MODULUS,
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
        "reduction_inclusive_max": MAX_REDUCTION_INDEX,
        "square_inclusive_max": MAX_SQUARE_INDEX,
    },
}
CIRCUIT_SPEC_BYTES = json.dumps(
    CIRCUIT_SPEC, sort_keys=True, separators=(",", ":")
).encode("utf-8")
CIRCUIT_SPEC_SHA256 = hashlib.sha256(CIRCUIT_SPEC_BYTES).hexdigest()
KEY_MANIFEST_DOMAIN = b"ARENA-CONCRETE-EVALUATION-KEY-MANIFEST\x00v1\x00"

SQUARES_MOD_17 = fhe.LookupTable(
    [(n * n) % MODULUS for n in range(MAX_SQUARE_INDEX + 1)]
)
INVERSES = fhe.LookupTable(
    [0] + [pow(y, -1, MODULUS) for y in range(1, PLAINTEXT_MAX + 1)]
)
REDUCE = fhe.LookupTable([n % MODULUS for n in range(MAX_REDUCTION_INDEX + 1)])
DIVISOR_VALID = fhe.LookupTable(
    [int(value != 0) for value in range(PLAINTEXT_MIN, PLAINTEXT_MAX + 1)]
)


def encrypted_function(x, y):
    """Return F_17 arithmetic plus a divisor-valid flag, all encrypted."""
    product = REDUCE[x * y]
    total = REDUCE[x + y]
    difference = REDUCE[x - y + MODULUS]
    # y's encrypted inverse is obtained only through this LUT. y=0 maps to 0,
    # but that placeholder is not a quotient: divisor_valid must be checked.
    quotient = REDUCE[x * INVERSES[y]]
    square = SQUARES_MOD_17[product + x + 1]
    divisor_valid = DIVISOR_VALID[y]
    return square, total, difference, product, quotient, divisor_valid


def _validate_plaintext_inputs(x, y):
    """Reject values outside the complete F_17 residue domain."""
    if type(x) is not int or type(y) is not int:
        raise ValueError("Concrete demo inputs must be integers")
    if not (PLAINTEXT_MIN <= x <= PLAINTEXT_MAX
            and PLAINTEXT_MIN <= y <= PLAINTEXT_MAX):
        raise ValueError("Concrete demo inputs must be residues 0 through 16")


def encrypt_client_inputs(client, x, y):
    """Client-only encryption after the explicit F_17 range check."""
    _validate_plaintext_inputs(x, y)
    encrypted = client.encrypt(x, y)
    if not isinstance(encrypted, tuple) or len(encrypted) != 2:
        raise AssertionError("Concrete did not return two encrypted input values")
    if not all(isinstance(value, fhe.Value) for value in encrypted):
        raise AssertionError("Client inputs were not Concrete encrypted values")
    return encrypted


def _transport_values(values):
    """Serialize/deserialize public ciphertext values across the API boundary."""
    return tuple(fhe.Value.deserialize(value.serialize()) for value in values)


def evaluate_on_server(server, encrypted_inputs, evaluation_keys):
    """Server boundary: ciphertext values and verified evaluation keys only."""
    if len(encrypted_inputs) != 2:
        raise ValueError("The circuit expects exactly two encrypted inputs")
    if not all(isinstance(value, fhe.Value) for value in encrypted_inputs):
        raise ValueError("The server accepts encrypted Concrete values only")
    result = server.run(*encrypted_inputs, evaluation_keys=evaluation_keys)
    result = result if isinstance(result, tuple) else (result,)
    if len(result) != 6 or not all(isinstance(value, fhe.Value) for value in result):
        raise AssertionError("The server did not return six encrypted outputs")
    return result


def expected_outputs(x, y):
    """Plaintext oracle for F_17, used only by client-side tests."""
    product = (x * y) % MODULUS
    quotient = (x * pow(y, -1, MODULUS)) % MODULUS if y != 0 else 0
    square = (product + x + 1) ** 2 % MODULUS
    return (
        square,
        (x + y) % MODULUS,
        (x - y) % MODULUS,
        product,
        quotient,
        int(y != 0),
    )


def _public_key_bytes(public_key):
    return public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )


def _evaluation_key_manifest(evaluation_key_bytes, signer_public_key):
    manifest = {
        "schema": "arena-concrete-evaluation-key-manifest-v1",
        "circuit_id": CIRCUIT_ID,
        "circuit_spec_sha256": CIRCUIT_SPEC_SHA256,
        "evaluation_keys_sha256": hashlib.sha256(evaluation_key_bytes).hexdigest(),
        "signer_public_key_sha256": hashlib.sha256(
            _public_key_bytes(signer_public_key)
        ).hexdigest(),
    }
    return json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode("utf-8")


def verify_evaluation_key_manifest(
    manifest_bytes, signature, evaluation_key_bytes, trusted_signer_public_key
):
    """Verify signer, circuit binding, and exact evaluation-key bytes."""
    try:
        manifest = json.loads(manifest_bytes)
    except (TypeError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Evaluation-key manifest is not valid JSON") from exc
    canonical = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode("utf-8")
    if canonical != manifest_bytes:
        raise ValueError("Evaluation-key manifest is not canonical")

    expected = {
        "schema": "arena-concrete-evaluation-key-manifest-v1",
        "circuit_id": CIRCUIT_ID,
        "circuit_spec_sha256": CIRCUIT_SPEC_SHA256,
        "evaluation_keys_sha256": hashlib.sha256(evaluation_key_bytes).hexdigest(),
        "signer_public_key_sha256": hashlib.sha256(
            _public_key_bytes(trusted_signer_public_key)
        ).hexdigest(),
    }
    if manifest != expected:
        raise ValueError("Evaluation-key manifest does not match keys or circuit")
    try:
        trusted_signer_public_key.verify(
            signature, KEY_MANIFEST_DOMAIN + manifest_bytes
        )
    except InvalidSignature as exc:
        raise ValueError("Evaluation-key manifest signature is invalid") from exc
    return True


def _rejected(action):
    try:
        action()
    except ValueError:
        return True
    return False


def _evaluate_and_decrypt(client, server, server_evaluation_keys, x, y):
    encrypted_inputs = _transport_values(encrypt_client_inputs(client, x, y))
    encrypted_outputs = evaluate_on_server(server, encrypted_inputs, server_evaluation_keys)
    return tuple(int(value) for value in client.decrypt(encrypted_outputs))


def _bootstrapped_composition_audit(client, server, server_evaluation_keys, depth=8):
    """Feed encrypted F_17 outputs into the same bootstrapped circuit repeatedly."""
    x, y = 2, 1
    encrypted_inputs = _transport_values(encrypt_client_inputs(client, x, y))
    final_expected = None
    encrypted_outputs = None
    for _ in range(depth):
        encrypted_outputs = evaluate_on_server(
            server, encrypted_inputs, server_evaluation_keys
        )
        final_expected = expected_outputs(x, y)
        # Sum and product are both encrypted F_17 residues and have the same
        # 5-bit domain as the circuit inputs. No intermediate result is decrypted.
        x, y = final_expected[1], final_expected[3]
        encrypted_inputs = (encrypted_outputs[1], encrypted_outputs[3])

    assert encrypted_outputs is not None and final_expected is not None
    decrypted = tuple(int(value) for value in client.decrypt(encrypted_outputs))
    if decrypted != final_expected:
        raise AssertionError(
            f"Bootstrapped composition failed at depth {depth}: "
            f"{decrypted} != {final_expected}"
        )
    return {"depth": depth, "decryption_matches_oracle": True}


def _known_plaintext_randomization_audit(client, server, server_evaluation_keys):
    """Compare two known examples plus a fresh repeat of the first under one key."""
    first_plaintext = (2, 1)
    second_plaintext = (2, 0)  # zero-divisor control vector
    first_ciphertexts = encrypt_client_inputs(client, *first_plaintext)
    repeated_ciphertexts = encrypt_client_inputs(client, *first_plaintext)
    second_ciphertexts = encrypt_client_inputs(client, *second_plaintext)

    first_wire = tuple(value.serialize() for value in first_ciphertexts)
    repeated_wire = tuple(value.serialize() for value in repeated_ciphertexts)
    second_wire = tuple(value.serialize() for value in second_ciphertexts)
    same_plaintext_ciphertexts_differ = all(
        left != right for left, right in zip(first_wire, repeated_wire)
    )
    different_example_ciphertexts_differ = all(
        left != right for left, right in zip(first_wire, second_wire)
    )
    if not same_plaintext_ciphertexts_differ:
        raise AssertionError("Fresh Concrete encryptions of the same inputs matched")
    if not different_example_ciphertexts_differ:
        raise AssertionError("Ciphertexts for the two known examples unexpectedly matched")

    first_result = evaluate_on_server(
        server, _transport_values(first_ciphertexts), server_evaluation_keys
    )
    repeated_result = evaluate_on_server(
        server, _transport_values(repeated_ciphertexts), server_evaluation_keys
    )
    second_result = evaluate_on_server(
        server, _transport_values(second_ciphertexts), server_evaluation_keys
    )
    first_decrypted = tuple(int(value) for value in client.decrypt(first_result))
    repeated_decrypted = tuple(int(value) for value in client.decrypt(repeated_result))
    second_decrypted = tuple(int(value) for value in client.decrypt(second_result))

    expected_first = expected_outputs(*first_plaintext)
    expected_second = expected_outputs(*second_plaintext)
    if first_decrypted != expected_first or repeated_decrypted != expected_first:
        raise AssertionError("Known plaintext (2, 1) did not decrypt to the expected outputs")
    if second_decrypted != expected_second:
        raise AssertionError("Known zero-divisor plaintext (2, 0) did not decrypt correctly")
    if first_decrypted != repeated_decrypted:
        raise AssertionError("Repeated plaintext evaluations decrypted differently")
    # Check the zero-divisor status only after decryption, then withhold a quotient.
    if second_decrypted[5] != 0 or second_decrypted[4] != 0:
        raise AssertionError("The decrypted zero-divisor validity flag/result is incorrect")

    return {
        "known_plaintexts": [list(first_plaintext), list(second_plaintext)],
        "same_plaintext_ciphertexts_differ": same_plaintext_ciphertexts_differ,
        "different_examples_ciphertexts_differ": different_example_ciphertexts_differ,
        "repeated_evaluations_decrypt_equal": first_decrypted == repeated_decrypted,
        "known_outputs_match_plaintext_oracle": (
            first_decrypted == expected_first and second_decrypted == expected_second
        ),
    }


def run_demo():
    compiler = fhe.Compiler(encrypted_function, {"x": "encrypted", "y": "encrypted"})
    circuit = compiler.compile(INPUTSET)
    bootstraps = circuit.programmable_bootstrap_count
    if bootstraps < 1:
        raise AssertionError("Compiled circuit did not contain programmable bootstrapping")

    try:
        # Client owns the FHE secret key. The server boundary below never receives
        # this Client or any decrypted input/output.
        client, server = circuit.client, circuit.server
        client.keygen()  # Concrete uses OS CSPRNG seeds when no explicit seed is supplied

        # Authenticate the exact evaluation-key bytes and bind them to this circuit
        # description. The server consumes a deserialized evaluation-only keyset.
        # In a real deployment trusted_signer_public_key must be pinned/configured
        # independently; this isolated demo establishes it at process setup only.
        evaluation_key_bytes = client.evaluation_keys.serialize()
        signing_key = Ed25519PrivateKey.generate()
        trusted_signer_public_key = signing_key.public_key()
        manifest_bytes = _evaluation_key_manifest(
            evaluation_key_bytes, trusted_signer_public_key
        )
        signature = signing_key.sign(KEY_MANIFEST_DOMAIN + manifest_bytes)
        provenance_verified = verify_evaluation_key_manifest(
            manifest_bytes,
            signature,
            evaluation_key_bytes,
            trusted_signer_public_key,
        )
        if not provenance_verified:
            raise AssertionError("Evaluation-key provenance was not authenticated")

        tampered_key_rejected = _rejected(lambda: verify_evaluation_key_manifest(
            manifest_bytes,
            signature,
            evaluation_key_bytes + bytes([0]),
            trusted_signer_public_key,
        ))
        tampered_signature = bytes([signature[0] ^ 1]) + signature[1:]
        tampered_signature_rejected = _rejected(lambda: verify_evaluation_key_manifest(
            manifest_bytes,
            tampered_signature,
            evaluation_key_bytes,
            trusted_signer_public_key,
        ))
        wrong_circuit_manifest = json.loads(manifest_bytes)
        wrong_circuit_manifest["circuit_id"] = "different-circuit"
        wrong_circuit_bytes = json.dumps(
            wrong_circuit_manifest, sort_keys=True, separators=(",", ":")
        ).encode("utf-8")
        wrong_circuit_rejected = _rejected(lambda: verify_evaluation_key_manifest(
            wrong_circuit_bytes,
            signature,
            evaluation_key_bytes,
            trusted_signer_public_key,
        ))
        if not (tampered_key_rejected and tampered_signature_rejected and wrong_circuit_rejected):
            raise AssertionError("Evaluation-key provenance failure cases were not rejected")

        server_evaluation_keys = fhe.EvaluationKeys.deserialize(evaluation_key_bytes)
        randomization_audit = _known_plaintext_randomization_audit(
            client, server, server_evaluation_keys
        )
        composition_audit = _bootstrapped_composition_audit(
            client, server, server_evaluation_keys, depth=8
        )

        # Treat each field pair as an independent stream chunk. Every chunk uses
        # fresh client encryption and a fresh server invocation; no ciphertext is
        # accumulated indefinitely or noise-refreshed by an outer transport code.
        results = []
        for sequence, (x, y) in enumerate(INPUTSET):
            decrypted = _evaluate_and_decrypt(
                client, server, server_evaluation_keys, x, y
            )
            expected = expected_outputs(x, y)
            if decrypted != expected:
                raise AssertionError(
                    f"FHE mismatch for F_17 pair {sequence}, inputs {(x, y)}: "
                    f"{decrypted} != {expected}"
                )
            divisor_valid = decrypted[5]
            if divisor_valid != int(y != 0):
                raise AssertionError("Encrypted divisor-valid flag did not decrypt correctly")
            if divisor_valid:
                if (decrypted[4] * y) % MODULUS != x:
                    raise AssertionError("Modular quotient does not invert the divisor")
            elif decrypted[4] != 0:
                raise AssertionError("Zero divisor must yield placeholder quotient 0")
            results.append({
                "sequence": sequence,
                "x": x,
                "y": y,
                "square": decrypted[0],
                "sum": decrypted[1],
                "difference": decrypted[2],
                "product": decrypted[3],
                "quotient": decrypted[4],
                "divisor_valid": divisor_valid,
            })

        out_of_range_rejected = _rejected(
            lambda: encrypt_client_inputs(client, PLAINTEXT_MAX + 1, 0)
        )
        if not out_of_range_rejected:
            raise AssertionError("Input outside the F_17 residue domain was not rejected")

        return {
            "modulus": MODULUS,
            "plaintext_min": PLAINTEXT_MIN,
            "plaintext_max": PLAINTEXT_MAX,
            "bounds": {
                "raw_product_max": RAW_PRODUCT_MAX,
                "reduction_index_max": MAX_REDUCTION_INDEX,
                "square_index_max": MAX_SQUARE_INDEX,
                "square_modulus": MODULUS,
            },
            "programmable_bootstraps": bootstraps,
            "circuit_id": CIRCUIT_ID,
            "circuit_spec_sha256": CIRCUIT_SPEC_SHA256,
            "evaluation_key_provenance_verified": provenance_verified,
            "tampered_evaluation_key_rejected": tampered_key_rejected,
            "tampered_evaluation_key_signature_rejected": tampered_signature_rejected,
            "wrong_circuit_binding_rejected": wrong_circuit_rejected,
            "out_of_range_input_rejected": out_of_range_rejected,
            "randomization_audit": randomization_audit,
            "composition_audit": composition_audit,
            "results": results,
        }
    finally:
        circuit.cleanup()


if __name__ == "__main__":
    print(json.dumps(run_demo(), sort_keys=True))
