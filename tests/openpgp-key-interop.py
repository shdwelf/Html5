#!/usr/bin/env python3
"""Optional, independent PGPy 0.6.0 control for synthetic OpenPGP.js keys.

Called by openpgp-key-interop.test.mjs. JSON arrives on stdin, never on argv;
no secret test material is written to disk. This is not a mobile-client test.
"""
import importlib.metadata
import json
import sys

import pgpy
from pgpy.constants import CompressionAlgorithm, SymmetricKeyAlgorithm
from pgpy.errors import PGPDecryptionError

raw = sys.stdin.read(1_048_577)
assert len(raw) <= 1_048_576, "test input exceeds limit"
vector = json.loads(raw)
public, _ = pgpy.PGPKey.from_blob(vector["publicKey"])
private, _ = pgpy.PGPKey.from_blob(vector["privateKey"])
assert str(public.fingerprint) == vector["fingerprint"]
assert str(private.fingerprint) == vector["fingerprint"]
assert public.is_public and not private.is_public
assert private.is_protected and not private.is_unlocked
assert len(private.subkeys) == 1
assert all(subkey.is_protected and not subkey.is_unlocked for subkey in private.subkeys.values())

wrong_refused = False
try:
    with private.unlock("deliberately wrong synthetic passphrase"):
        pass
except PGPDecryptionError:
    wrong_refused = True
assert wrong_refused, "incorrect secret-key passphrase was accepted"

payload = vector["plaintext"].encode("utf-8")
signature = pgpy.PGPSignature.from_blob(vector["signature"])
assert bool(public.verify(payload, signature)), "OpenPGP.js detached signature did not verify independently"
with private.unlock(vector["passphrase"]):
    assert private.is_unlocked and all(key.is_unlocked for key in private.subkeys.values())
    result = private.decrypt(pgpy.PGPMessage.from_blob(vector["encrypted"]))
    plaintext = result.message.encode("utf-8") if isinstance(result.message, str) else bytes(result.message)
    assert plaintext == payload, "RSA encryption subkey or SEIPD/MDC cross-decrypt failed"
    reverse_signature = str(private.sign(payload, detached=True))
assert not private.is_unlocked and all(not(key.is_unlocked) for key in private.subkeys.values())
reverse_message = pgpy.PGPMessage.new(payload, format="b", compression=CompressionAlgorithm.Uncompressed)
reverse_encrypted = str(public.encrypt(reverse_message, cipher=SymmetricKeyAlgorithm.AES256))
print(json.dumps({
    "implementation": "PGPy",
    "version": importlib.metadata.version("PGPy"),
    "fingerprint": str(public.fingerprint),
    "wrongPassphraseRefused": wrong_refused,
    "signature": reverse_signature,
    "encrypted": reverse_encrypted,
}))
