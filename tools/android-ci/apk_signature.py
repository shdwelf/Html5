"""Parse certificate fingerprints only after apksigner verify has exited zero.

Build-tools versions use both 'Signer #1 certificate' and scheme-specific
'V2 Signer: certificate' labels (the colon after the signer label is optional).
This extracts the measured certificate, not a trust/safety verdict.
"""
import re


def certificate_fingerprints(text):
    pattern = (
        r'(?im)^(?:V[1-4](?:\.[0-9]+)?[ \t]+)?Signer'
        r'(?:[ \t]+#[1-9][0-9]*|[ \t]*\([^()\r\n]{1,120}\))?:?'
        r'[ \t]+certificate SHA-256 digest:[ \t]*([0-9a-f]{64})[ \t]*$'
    )
    return sorted(set(value.lower() for value in re.findall(pattern, text)))
