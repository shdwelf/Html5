# Crow Cryptogram — Ukrainian-language source check

## Search scope

Searched Ukrainian and Russian variants of the puzzle and solver's name, including:

- `Криптограма ворона` / `Криптограма Крука`
- `Силиченко SECOM шифр Ворон криптограма`
- `Олексій Силиченко криптоаналіз Ворон`
- `Oleksii Sylichenko криптограмма`
- `Олексій Силиченко шифр Enigma`

## Result

No Ukrainian- or Russian-language page containing Sylichenko's Crow plaintext or 20-letter key was found. Results were general cryptography teaching material, unrelated “Voron” references, or translations/discussions of Enigma. The strongest Ukrainian-language result is a German Wikipedia article about Cipher Machines and Cryptology that repeats the public table-of-honor fact: Sylichenko was the first listed Crow solver on 8 February 2023. It does not provide a plaintext or key.

## Important new lead: SECOM GUI

The `asilichenko` profile README lists **SECOM cipher GUI** in its Cryptography section. Indexed GitHub search results describe `asilichenko/secom-cipher-gui` as a Java GUI implemented from Dirk Rijmenants's SECOM description, with GPL-3.0 licensing and a February 2023 release. The indexed README contains the same key-phrase, checkerboard, LFG, and disrupted-transposition procedure used by the local probe.

That repository is not currently retrievable as a live public repository in this pass: the GitHub API returns 404, the direct page returns 404, and raw-file attempts do not provide source. Therefore this is provenance evidence that Sylichenko had a SECOM implementation/reference, not a recoverable Crow solution. It should not be treated as proof that the public GitHub project contains the answer.

## Language conclusion

The Crow plaintext is explicitly English on the primary publisher page. A Ukrainian-language search is useful for finding solver notes or an announcement, but translating the ciphertext or replacing the English language model with Ukrainian would be incorrect. The correct search remains:

- English plaintext scoring
- SECOM's digit/checkerboard model
- a 20-letter key phrase
- exact re-encryption of all 600 digits

No Ukrainian key candidate was promoted because no source supplied one.

## Source grades

- **Primary:** [Crow publisher page](https://www.ciphermachinesandcryptology.com/en/crow.htm), which states the English/600-digit/key-phrase facts.
- **Primary:** [Sylichenko Enigma repository](https://github.com/asilichenko/enigma), whose live README documents Enigma hill-climbing but not Crow.
- **Indexed historical lead:** [SECOM cipher GUI](https://github.com/asilichenko/secom-cipher-gui), whose current live availability could not be verified.
- **Secondary:** [German Wikipedia result](https://de.wikipedia.org/wiki/Cipher_Machines_and_Cryptology), useful only as corroboration for the public solver listing.

## Outcome

The Ukrainian-language search found a **new SECOM provenance lead** but no plaintext, key phrase, or solver attachment. The Crow remains unsolved from publicly verifiable sources.
