# Source check — research and curriculum records — 2026-09-28

## Method

This pass checked claims against first-party pages rather than search-result summaries wherever a first-party page was retrievable. Checks covered title, author, identifier, version date, category, event context, publication status, DOI/venue metadata, and the distinction between preprint, proceedings paper, teaching reader, slide deck, and recording.

A direct `curl` probe from the build sandbox returned transport code `000` for most academic hosts while the page-retrieval service successfully loaded them. Those `000` results are treated as a sandbox/network limitation, **not as dead-link evidence**. No record was downgraded solely because command-line HTTP was blocked.

## Checked source families

| Source | First-party evidence checked | Result |
|---|---|---|
| LANL online-archives history | Original `xxx.lanl.gov` name, 1991 creation at Los Alamos, 2001 Cornell migration | Confirmed |
| Cornell 2001 transfer announcement | Los Alamos E-Print Archive transfer context | Confirmed from institutional result; retained alongside LANL account |
| arXiv `cs.CR` archive | Category title, scope, browse/version interface | Confirmed |
| arXiv 2304.03541 | Debris-Alazard title, author, 2023-04-07 v1, ENS Lyon/Budapest school context, cs.CR, CC BY link | Confirmed |
| arXiv 1711.04062 | De Feo title, author, 2017-11-11 v1, Thiès school context, cs.CR/math.NT, guide-not-reference caveat | Confirmed |
| arXiv 2201.07119 | Weger–Gassner–Rosenthal title, v5 date, cs.CR/cs.IT, Springer LNM chapter statement | Confirmed; added to continuing research notes, not duplicated as a hall record |
| IACR ePrint 2024/1287 | Lyubashevsky tutorial title, ML-KEM/ML-DSA scope, 11-revision history through 2025-06-18, preprint status | Confirmed |
| IACR ePrint 2026/1098 | Menezes tutorial scope and audience | Confirmed in prior pass and cross-linked into reader ladder |
| IACR Cryptology Schools | Since-2014 sponsorship, 4–5 day format, audience, pedagogical mission, school directory | Confirmed |
| Crypto 2025 program | Eight LNCS volumes, session/paper links, slide and video links | Confirmed |
| Columbia W4261 readings | Katz–Lindell required/bookstore-reserve status, open readers and background shelf | Confirmed |
| NYU Fall 2025 graduate crypto | Proof maturity, algorithms/theory/probability prerequisites, reader list | Confirmed |
| CMU 15-356/15-856 | Algorithms/theory or probability/discrete-math prerequisite route, lecture sequence | Confirmed |
| Boneh–Shoup course book | Current displayed version 0.6, 2023 date, contents and prerequisite appendices | Confirmed |
| Handbook of Applied Cryptography | Author-hosted chapter list and newer course links | Confirmed |
| IACR book reviews | Publisher-organized review collection and audience distinctions | Confirmed |

## Corrections and boundaries retained

- `xxx.lanl.gov` is represented as the historical address/identity of the service that became arXiv, not as an independent current archive.
- arXiv and IACR ePrint deposits are not silently labeled peer reviewed.
- An arXiv-issued DOI is not treated as proof of journal or conference publication.
- A bookstore listing is used only to document a course-required edition; it is not a license to redistribute that edition.
- Seminar notes are guides whose security claims must be compared with later cryptanalysis and standards.
- Conference slides and videos are presentation evidence, not substitutes for the reviewed proceedings version.
- Command-line transport failures in this sandbox are recorded as inconclusive, not “dead.”

## New records produced by this pass

1. `iacr-school-corridor`
2. `lattice-reader-ladder`
3. `publication-evidence-ladder`

These records establish a defensible sequence:

**mathematical prerequisites → introductory course text → focused cryptology school → specialist reader → current paper → proceedings/version check → implementation and cryptanalysis review.**
