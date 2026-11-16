# Backlog execution — round 76 (2026-11-15)

This round follows the four research items in the requested order, then records
the completed GRASP extraction/backup, the repository wiki/server inventory,
and the Keyspace Viewer ceiling. Evidence is linked at source level; this is a
research and provenance note, not a new authentication or cryptographic
service.

## 1. LCS35 — replace Rivest's dead description URL

The formerly cited short URL
[`https://people.csail.mit.edu/rivest/lcs35-puzzle-description.txt`](https://people.csail.mit.edu/rivest/lcs35-puzzle-description.txt)
returns HTTP 404. The original 1999 text is available at Rivest's own
publications directory instead:

- [Rivest, “Description of the LCS35 Time Capsule Crypto-Puzzle” (1999),
  `Riv99b.lcs35-puzzle-description.txt`](https://people.csail.mit.edu/rivest/pubs/Riv99b.lcs35-puzzle-description.txt)
  — primary alternate; the content identifies the April 4, 1999 description,
  explains sequential repeated squaring modulo an RSA modulus, the intended
  estimate, and the proof/factorization arrangement.
- [Rivest, CSAIL2019 refreshed puzzle description (PDF)](https://people.csail.mit.edu/rivest/pubs/Riv19f.new-puzzle.pdf)
  — official successor. It explicitly says the original was solved in 2019
  and documents the refreshed 2034 puzzle; it is not a replacement for the
  original specification.
- [Conner-Simons, MIT CSAIL, “Programmers solve MIT’s 20-year-old
  cryptographic puzzle”](https://www.csail.mit.edu/news/programmers-solve-mits-20-year-old-cryptographic-puzzle)
  — MIT's account of the 2019 solution.
- [Conner-Simons et al., “Scalable Time-Lock Puzzle,” ACM CCS Asia 2025](https://dl.acm.org/doi/full/10.1145/3708821.3733907)
  — modern paper that discusses LCS35's unexpectedly early solution and
  restates the RSA-based time-lock construction.

**Status:** alternate official source found and directly checked; replace the
broken URL in any future LCS35 references with the `Riv99b` publications URL.
Do not conflate the original solved puzzle with CSAIL2019's successor.

## 2. FHE + time-based authentication — node-seal BFV is a teaching lead

The existing [`tools/he-bfv-demo.mjs`](../tools/he-bfv-demo.mjs) is the lead
artifact. `npm run demo:bfv` was run locally on this snapshot and returned:

```text
BFV encrypted evaluation: 3 + 5 = 8; 3 − 5 ≡ 1032191 (mod 1032193); 3 × 5 = 15
SEAL context: 128-bit parameter check, 14-bit remaining noise budget
Bounded-depth leveled HE; no encrypted-denominator division or bootstrapping here.
```

It is a **bounded-depth BFV / leveled homomorphic-encryption demonstration**,
not fully homomorphic encryption (no bootstrapping), an authentication
implementation, a deployment template, or a protection claim for real OTP
secrets. Its 128-bit SEAL parameter validation is not a blanket claim that the
demo's narrow integer circuit is suitable for production. The example decrypts
locally to demonstrate its results; it deliberately describes the evaluator
boundary and frees WASM resources.

TOTP (RFC 6238) computes `T = floor((Unix time − T0) / X)` and then
`HOTP(K, T)`. Its standard default step is 30 seconds. The calculation includes
HMAC, byte-level dynamic truncation, and decimal reduction; a real verifier
also needs replay controls, rate limiting, protected shared-secret storage,
clock policy, and recovery. BFV's exact integer additions/multiplications do
not make the HMAC/TOTP circuit cheap or automatically private: faithfully
encoding HMAC's bitwise/byte operations and comparison is a separate circuit
engineering problem, with noise, depth, key-size, leakage, and latency tradeoffs.

**Practical conclusion:** use a well-reviewed conventional TOTP implementation
for account authentication. Keep BFV as a toy to explore encrypted arithmetic
or a future, explicitly specified private-verification protocol; do not route
real credentials or authentication secrets through this demo.

Sources: [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238),
[node-seal (Microsoft SEAL JavaScript/WASM binding)](https://github.com/microsoft/SEAL),
and the in-repo [BFV demonstration](../tools/he-bfv-demo.mjs).

## 3. GitHub search — inspect a TOTP routine, not an account

The public GitHub search lead is [`j256/two-factor-auth`](https://github.com/j256/two-factor-auth),
ISC-licensed, with default branch commit
[`d28c4da7cbe593774a7420a86257b803b67c8f5a`](https://github.com/j256/two-factor-auth/commit/d28c4da7cbe593774a7420a86257b803b67c8f5a)
(last pushed 2022-12-09 when checked). The review was read-only and limited
to `TimeBasedOneTimePasswordUtil.java` and its public README.

- `generateValue` floors Unix milliseconds to a step counter;
  `generateNumberFromKeyValue` HMACs the 8-byte counter using `HmacSHA1`,
  dynamically truncates four bytes, masks the sign bit and reduces modulo
  `10^digits` (the core TOTP shape).
- The default period is 30 seconds and the API has explicit timestamp/period
  arguments for tests. Its validation window is expressed in milliseconds and
  may check several adjacent time counters.
- The inspected verifier compares a generated `int` to the submitted `int`
  using Java `==` and returns on the first match. This is a useful code-review
  observation, **not a remote timing measurement**. The inspected routine does
  not itself persist a “last accepted counter”; callers must add server-side
  replay prevention and throttling. Review secret-at-rest, enrollment,
  provisioning URLs and recovery separately before using any library.

The repository is an implementation example, not a security endorsement. The
source search was static; no GitHub account, login endpoint, MFA challenge, or
third-party service was accessed.

## 4. FindCrypt database vs. CyberChef recipes — scope cross-check

Pinned reference: `TorgoTorgo/ghidra-findcrypt` commit
[`5c2fd5bb50d13a4092da136dc7004becd8129c7b`](https://github.com/TorgoTorgo/ghidra-findcrypt/tree/5c2fd5bb50d13a4092da136dc7004becd8129c7b),
126 signature records, database SHA-256
`ec3f54412ea1a1ddca05ec39eaa8ad1a9c38ce021297f359dbc0a58b9c7a8897`.
The current in-repo CyberChef kitchen (`public/apps/cyberchef/index.html`)
was inspected by the existing recipe comparison script: **521 operations in
48 categories; 279 recipe packs with 832 entries and 521 unique operation IDs**.

A family-level crosswalk (not byte-signature equivalence) shows meaningful
coverage for AES/Rijndael, SHA-1/SHA-2/SHA-3, MD5, CRC-32, DES/3DES, RC5, TEA,
Blowfish, Twofish, Camellia, SEED, Salsa/ChaCha, BLAKE2, SHACAL-2 and Ed/X25519.
The FindCrypt database also covers constants or tables for families/resources
with no corresponding dedicated operation found in the kitchen, including
HAVAL, Sosemanuk, Simon64, LEA, Kalyna, HIGHT, SHARK, SKIPJACK, Whirlpool,
Tiger, WAKE and zlib tables. Conversely, many kitchen operations (formats,
classical ciphers, wallets, encodings, tools) are not FindCrypt constant
signatures at all.

These are two different abstractions: FindCrypt searches exact byte patterns
in program memory; CyberChef recipes are callable transformations and
workflows. A family-name overlap does not imply identical constants,
implementation, parameterization, safe use, or a FindCrypt hit. A signature hit
still needs disassembly/xref review, and a zero-hit scan cannot rule out
constant-free crypto or resource-specific transforms. The repository's
independent [`scripts/crypto-find.py`](../scripts/crypto-find.py) is a third,
smaller heuristic; do not merge its counts with native FindCrypt results.

Reproduce the kitchen inventory with:

```sh
node scripts/compare-cyberchef-recipe-packs.mjs --spotlights
```

For the pinned native results on the original Sneakers executables, see
[`ghidra/sneakers-original-native-ghidra-2026-10-18.md`](ghidra/sneakers-original-native-ghidra-2026-10-18.md)
and the bounded reports under `ghidra/sneakers-original-native-evidence/`.

## GRASP 4.00d — decoded 224-member library

The user-requested “224 members” matches the protected GRASP GL library bound
to the Sneakers press-kit executable. The repository already contains the
static decoder, source ZIP, Xena metadata/29 readable script packages and the
full reproducible member digests. All **224/224** members passed the directory
length-consistency check in the prior extraction record; this round did not
re-execute any extracted files. The decoding details and aggregate SHA-256 are
in [`sneakers-grasp-library-cipher-2026-11-13.md`](sneakers-grasp-library-cipher-2026-11-13.md).
A checksum-verified package of the decoded library and the corresponding Xena
preservation package are already present in the project's authorized archive
location; the source artifacts and digests are enumerated by that report.

## Repository wiki and server inventory

This note is a new Markdown page in the repository research corpus, so the
wiki builders can expose it as a plain-text source tiddler. The server inventory
is deliberately a **catalog**, not a claim that a public service is currently
live. No Html5 project server was running in this workspace at the time of this
check.

| Edition / endpoint | Intended role | Status in this workspace |
| --- | --- | --- |
| `wiki.in.a.jar` — `/` | Classic browser wiki on the ACME/TJWS server | Build target; not running |
| `more.wiki.in.a.jar` — `/` | Repository library and source vault | Build target; not running |
| `tiddlywiki.in.a.jar` — `/` | Native TiddlyWiki 5.4.1 landing page | Build target; not running |
| `GET /api/capabilities` | Edition/write-capability metadata | Available only when a JAR server is started |
| `GET /api/pages/<page-id>` | Read a UTF-8 wiki page with ETag | Available only when a JAR server is started |
| `PUT /api/pages/<page-id>` | Authenticated, revision-checked page update | Available only when a JAR server is started |
| `GET /api/history/<page-id>` and `/api/revisions/<page-id>/<revision>` | Revision history and explicit restore | Available only when a JAR server is started |
| `GET /vault/<sha256>` and `/media/<sha256>` | Exact source bytes and allowlisted media | Available only when a JAR server is started |

The canonical server setup, routes, access boundary and build commands are in
[`tools/wiki-workspace/README.md`](../tools/wiki-workspace/README.md). Do not
publish a snapshot or expose a server to the Internet without reviewing the
manifest and setting appropriate authentication/TLS.

## Keyspace Viewer — every supported length through the maximum

The requested 25+-word support was implemented in PR #218:
[`Keyspace Viewer: every word count 25…512`](https://github.com/shdwelf/Html5/pull/218).
It builds on the generalized checksum rule and exposes each word count from
25 through the implementation ceiling of **512 words** (ENT 5,624 bits, CS 8,
5,632 total bits). The wallet derivation gate intentionally remains limited to
standard BIP-39 counts 12/15/18/21/24. The PR description records the layout,
DOM, browser, and package tests. Per the user's explicit request, PR #218 was
merged on 2026-11-15 as merge commit
[`edc5a48344c4143df0bea6954ef56879a7a7b124`](https://github.com/shdwelf/Html5/commit/edc5a48344c4143df0bea6954ef56879a7b124).
At merge time its `debug-apk` check was failed; GitHub would not rerun that
workflow (“workflow file may be broken”). This is recorded rather than reported
as a green check; the failure remains a follow-up to diagnose.

## Verification snapshot

- `npm run demo:bfv` — passed (outputs above; 14-bit residual noise budget).
- `node scripts/compare-cyberchef-recipe-packs.mjs --spotlights` — passed;
  521 operations, 48 categories, 279 packs.
- `gh api` source inspection of public repository
  `j256/two-factor-auth` — read-only at the commit above.
- Original LCS35 short URL — confirmed 404; the alternate Rivest pubs URL
  returns the full original 1999 description.
