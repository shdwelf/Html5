# IACR research watch — 2026-09-28

## Scope

Deep-dive review of the IACR home page, current news, and Cryptology ePrint Archive for material that can improve:

- `apps/cyberchef.html` recipe packs; and
- the **Intelligence Lecture Hall** in `apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html`.

IACR describes cryptology as the design of computation and communication systems secure in the presence of adversaries. The ePrint Archive is a rapid-access preprint service: inclusion is **not peer review**. The app records preserve that distinction and link to source metadata and PDFs.

## Findings promoted into the Lecture Hall

1. **Menezes, “A gentle introduction to lattice-based cryptography” (2026/1098)** — a teaching bridge covering ML-KEM, FrodoKEM, ML-DSA, Falcon, and their lattice foundations.
2. **Sun et al., “Efficient Soft Analytical Side-Channel Attacks…” (2026/1811)** — an implementation-security case study reporting practical ML-DSA NTT key recovery under stated ARM Cortex-M4 conditions.
3. **Liu et al., “Practical Null-Branch Witness Attacks…” (2026/2235)** — a current cryptanalytic warning that relation encoding is a separate obligation from OWF hardness and proof-system soundness.
4. **Chayet et al., “Lower Bounds on Random-Oracle-Model Signature Length” (2026/2237)** — a model-specific explanation of hash-based signature size pressure.

Each record states dates, scope, caveats, and primary IACR links. Claims are attributed to authors rather than presented as settled universal facts.

## CyberChef recipe additions

- `IACR · Hash-based signature prehash`
- `IACR · Post-quantum KEM lab (ML-KEM-768)`
- `IACR · Post-quantum signature lab (ML-DSA)`
- `IACR · Authenticated envelope (AES-256-GCM)`
- `IACR · Integrity tag (HMAC-SHA-256)`
- `Lecture Hall · F5 Black Hat 2016 Playfair layer`
- `Research citation fingerprint (SHA3-256 → Base64)`

These are educational presets over existing operations. Passwords, keys, and deterministic seeds in defaults are examples and are visibly labelled for replacement; they are not production key-management guidance.

## Primary sources

- https://iacr.org/
- https://www.iacr.org/news/
- https://eprint.iacr.org/
- https://eprint.iacr.org/2026/1098
- https://eprint.iacr.org/2026/1811
- https://eprint.iacr.org/2026/2235
- https://eprint.iacr.org/2026/2237

## Continuation pass: peer-reviewed hardware work and infrastructure assurance

A second pass widened the review from the ePrint front page to the current issues of **IACR TCHES** and **IACR ToSC**, while continuing through the daily IACR news feed. Four more records were promoted:

5. **Karadağ et al., hardware reverse-engineering SoK, TCHES 2026(4)** — 187-paper map of IC, FPGA and netlist recovery, with reproducibility and benchmark cautions.
6. **Saß and Seifert, the sigma-zero side channel, TCHES 2026(4)** — reported single-trace Hash-DRBG state recovery plus a targeted masking countermeasure.
7. **Cohen et al., “Mind the Gap: Proving and Improving RPKI” (2026/2233)** — separates valid routing-authority objects from end-to-end BGP/IP security conditions.
8. **Xiong and Wang, NGCC round-one cryptanalysis (2026/2232)** — sixteen candidate breaks with public attack packages, preserved as a lesson in evaluation-stage confidence.

Unlike ePrint postings, the two TCHES articles are identified in the hall as journal articles with DOI, issue and page metadata. The two current ePrint papers retain explicit preprint caveats.

Four additional utility recipes were added:

- `Research artifact fingerprint (SHA-256 → Base64)`
- `Research · Legacy digest comparison (not authentication)`
- `Research · Decode URL-safe Base64 payload`
- `Research · Classical ciphertext frequency report`

The legacy digest recipe explicitly avoids presenting MD5, SHA-1 or non-cryptographic checksums as authentication mechanisms.

### Additional primary sources

- https://tches.iacr.org/index.php/TCHES/issue/view/419
- https://tches.iacr.org/index.php/TCHES/article/view/13235
- https://tches.iacr.org/index.php/TCHES/article/view/13255
- https://eprint.iacr.org/2026/2232
- https://eprint.iacr.org/2026/2233
