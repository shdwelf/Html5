# Immutable source retained for a measured historical receipt

`apk_signature-130910469950.py` is the exact 570-byte parser used by source
`130910469950b67319046b808a4f5ec27a48b301` in Magisk/Ghidra run `46054707860`.
SHA-256: `c4e47455426c77fc92c928542a6b028776dd432052a9f2cb35e671e1e950622f`.

It accepted that run's measured `V2 Signer: certificate` output but accidentally
required a colon that the standard `Signer #1 certificate` format does not have.
The live `../apk_signature.py` now handles both. Do not use this historical copy
in current builds. It exists so the old receipt's source hashes remain
reproducible without pretending the repaired parser ran in that past job.
The historical APK/Ghidra input hashes and measured results were not rewritten.
