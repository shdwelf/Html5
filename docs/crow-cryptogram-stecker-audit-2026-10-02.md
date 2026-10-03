# Crow Cryptogram / Stecker audit — 2026-10-02

## Result

The requested `EN RT OS AI` setting is an Enigma plugboard (Steckerbrett) setting, not the key format used by the Crow's Cryptogram. It is still useful as a controlled benchmark for Sylichenko's hill-climbing method, but it does not decrypt the Crow ciphertext.

Canonicalized as unordered plugboard pairs, the setting is:

```text
AI EN OS RT
```

Each pair swaps its two letters; pair order is irrelevant. The four pairs cover eight letters and leave the other 18 letters unpaired.

## Why it does not solve the Crow

The primary Crow page says the puzzle was published in 2010, contains 600 digits in 120 five-digit groups, uses pencil, paper, and a secret key phrase, and that the accompanying verse is a hint to the key—not input used to encrypt the message. The ciphertext is therefore not an ordinary Enigma alphabetic stream.

The local exact implementation models the published SECOM-style pipeline:

1. derive a schedule from a 20-letter key phrase;
2. construct the disrupted checkerboard digit encoding;
3. apply the two transpositions and triangular disruption;
4. compare the resulting 600-digit multiset and decoded text.

Applying the known opening-line candidate produces the recorded non-English output beginning `OYSASOXVEMSA...`, so it is rejected. The 111 documented hint-derived candidates also fail the calibrated English/IoC checks. The six-line hint cannot simply be used as a plaintext or as an Enigma plugboard key.

## What the Sylichenko resource establishes

`asilichenko/enigma` documents a Sullivan–Weierud hill-climbing approach for Enigma: integer IoC as an inexpensive ranking measure, staged n-gram fitness, calibration against target-language text, and precomputation of rotor transforms. The repository contains an M3/M4 Enigma simulator and breaker, but no SECOM implementation and no Crow plaintext.

The local `plugboardHillClimb` benchmark uses a synthetic 274-letter Enigma message with `EN RT OS AI`; it recovers the pairs and plaintext. That validates the method port and its controls only. It is not evidence that the same pairs belong to the Crow.

## Current honest answer

- **Solved:** the Enigma benchmark with Stecker `EN RT OS AI`.
- **Rejected:** using that Stecker setting as a direct Crow decrypt key.
- **Not solved:** the actual Crow plaintext and secret phrase.
- **Next valid step:** obtain an independently supplied Crow candidate key phrase or implement a search over the SECOM key-phrase space; do not substitute an Enigma plugboard setting for that phrase.

Sources:

- [The Crow's Cryptogram](https://www.ciphermachinesandcryptology.com/en/crow.htm)
- [Oleksii Sylichenko's profile](https://github.com/asilichenko)
- [Sylichenko Enigma simulator and breaker](https://github.com/asilichenko/enigma)
- [`tools/secom_probe.py`](../tools/secom_probe.py)
