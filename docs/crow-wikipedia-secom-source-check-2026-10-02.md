# Crow / Wikipedia / SECOM source check — 2026-10-02

## Correction first

`EN RT OS AI` was never established as the Crow's key. It is an Enigma Steckerbrett control used to validate the Sylichenko-style plugboard hill-climb on synthetic alphabetic Enigma data. The Crow uses a 20-letter SECOM key phrase and a 600-digit ciphertext. These are different cipher models.

## Wikipedia findings

### VIC cipher

The [Wikipedia VIC cipher article](https://en.wikipedia.org/wiki/VIC_cipher) is useful for family resemblance: it describes a Cold War pencil-and-paper cipher using mod-10 chain addition, a lagged Fibonacci generator, a straddling checkerboard, and disrupted double transposition. It also explicitly links SECOM as a VIC variant in its external links.

The article carries a maintenance banner requesting additional citations. It is therefore a secondary orientation source, not the authority for the Crow's exact implementation or solution.

### Straddling checkerboard

The [Wikipedia straddling-checkerboard article](https://en.wikipedia.org/wiki/Straddling_checkerboard) supports the mechanics of variable-length digit encoding and notes its use in the VIC cipher. It also carries a citation-needed notice. It does not provide the Crow key or plaintext.

### SECOM

There does not appear to be a dedicated Wikipedia article for SECOM. The authoritative algorithm description used in this project is the publisher's [SECOM page](https://www.ciphermachinesandcryptology.com/en/secom.htm), which documents the four stages and provides a complete worked 105-digit example.

## Source hierarchy for this investigation

1. **Primary algorithm source:** Dirk Rijmenants / Cipher Machines and Cryptology SECOM page.
2. **Primary puzzle source:** The publisher's Crow page and its 600-digit ciphertext.
3. **Primary solver-method source:** Sylichenko's Enigma README and indexed SECOM GUI description.
4. **Secondary context:** Wikipedia's VIC and straddling-checkerboard pages.
5. **Local verification:** `tools/secom_probe.py`, which reproduces the SECOM control and rejects tested poem candidates.

## What the Wikipedia search changes

It strengthens the classification: the Crow belongs to the same broad family of fractionation plus transposition hand ciphers as SECOM/VIC. It does not produce a solution, and it does not turn an Enigma plugboard setting into a SECOM key.

The poem search remains negative: 103 unique contiguous 20-letter windows and nine exact word-boundary candidates were tested with zero survivors. The next search must target a justified poem extraction rule, not the Wikipedia article's VIC examples as if they were Crow key material.
