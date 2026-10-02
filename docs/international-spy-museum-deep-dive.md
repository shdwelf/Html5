# International Spy Museum deep dive — how an espionage collection stays together

*Research pass 2026-10-02. Companion record: `intl-spy-museum-provenance` in
the Intelligence Lecture Hall. Cross-reference: `docs/kgb-museum-deep-dive.md`
(the counter-case).*

## Why this museum is in the hall

The KGB Espionage Museum record documents a collection that scattered. The
International Spy Museum is the same era's counter-case: an **independent
nonprofit** that publishes its own custody record — founders, gifts, loans,
governance — and has never had to be sold at auction. Its cryptologic
exhibits (Enigma, PURPLE, JN-25) and its 2021 loan partnership with NSA's
National Cryptologic Museum are where the public can stand in front of the
same machine classes the cipher-suite bundle simulates. The record is built
from the museum's own pages, and its caution section names which claims
remain institutional self-description.

## Custody, documented by the institution itself

| Fact | Date | Source |
|---|---|---|
| Conceived by Milton Maltz — US Navy/NSA Korean-War veteran, Malrite Communications founder — with intelligence-community peers | 1996 onward | spymuseum.org/about |
| Opened **19 July 2002**, 800 F Street NW, Penn Quarter | 2002 | 20-milestone anniversary release (2022) |
| Founding executive director: **Peter Earnest**, 36-year CIA veteran, 20+ years Clandestine Service, Senior Intelligence Service, final posting as principal Agency spokesman | 2002 | board / about pages |
| President Obama and family visit | August 2010 | 2022 milestones |
| "Exquisitely Evil: 50 Years of Bond Villains" opens with EON Productions | November 2012 | 2022 milestones |
| Collection roughly **triples** via the pledged gift of H. Keith and Karen Melton | September 2017 | 2022 milestones |
| **Guinness World Records: largest espionage museum** (artifact collection basis) | April 2020 | 2022 milestones |
| New building at **L'Enfant Plaza** opens — ~$162 million reporting, contributions from Milton and Tamar Maltz; all-new exhibitions (Briefing Center, Stealing Secrets, Making Sense of Secrets, An Uncertain World, Covert Action, Debriefing Center) | May 2019 | worldatlas + museum pages; cost from contemporary journalism |
| Pop-up **"Codes, Ciphers & Mysteries: NSA Treasures Tell Their Secrets"**, Briefing Center, 5 April–31 May 2021 — **13 artifacts on loan from the National Cryptologic Museum** while the NCM was closed for redesign; NCM director Dr. Vince Houghton, SPY historian Dr. Andrew Hammond | March 23 2021 press release | spymuseum.org press archive |
| Loaned objects include **PURPLE analog #1** (US Army codebreakers, 1940 — the exhibition's self-described most important artifact) and **CipherTAC 2000** (NSA's first secure cell phone, late 1990s) | 2021 | pop-up exhibit page |
| Governance: board drawn from the intelligence community, government, media and business; teacher advisory board; five-year strategic vision | current | about pages |

## The cryptologic exhibits

The permanent **Codes** exhibit carries the WWII code-breaking stories —
**Enigma** (a genuine machine beside a console demonstrating how it works,
per the Peter Earnest interview), the Japanese diplomatic machine **PURPLE**,
and **Midway's JN-25** — with hands-on Caesar Cipher and Cardano Grille
interactives. The 2021 NSA pop-up put the NCM's PURPLE analog #1 and
CipherTAC 2000 in front of the public while the NCM itself was closed for
redesign: two institutions, one collection temporarily shared, all documented
in press releases both sides published. That is what a custody chain looks
like when it works.

The specific Enigma machine's model, year and provenance are **not** documented
on the public exhibit pages — the hall record says exactly that rather than
guessing a variant.

## The comparative point (and its limits)

| | KGB Espionage Museum | International Spy Museum |
|---|---|---|
| Status | For-profit, single family | Independent nonprofit |
| Founders' credentials | Collector family (Urbaitis/Urbaityte) | NSA veteran + 36-year CIA officer |
| Collection | 3,500+ claimed, ~240 lots dispersed 2021 | Largest espionage collection on public display (Guinness, 2020) |
| Custody record | Auction catalog + results list | Its own about/board/press pages |
| Outcome | Dispersed in one afternoon | Growing (Melton gift tripled it; NSA loan partnership) |

The limits of the comparison are stated in the record: the Spy Museum facts
above are institutional self-description; "largest collection" and the
Guinness record rest on the museum's own submission; attendance and funding
figures come from its announcements; independent audits of the collection
are not published.

## What this pass changed in the repository

- Lecture Hall record `intl-spy-museum-provenance` (patch tool
  `tools/patch_lecture_hall_museums.py`; assertions in
  `tools/verify_lecture_hall.mjs`).
- Museum tab exhibit `spy-museum-enigma` in the cipher-suite bundle
  (Maltz/Earnest, the Codes exhibit, the NSA pop-up loan pair).
- CyberChef museum recipe packs in both kitchens, including
  `Museum · Enigma I reference vector (expect BDZGO)` and the
  Kriegsmarine M4 pack — the Spy Museum's Enigma console is the public-facing
  counterpart of the upgraded `enigma` operation (now rotors I–VIII, Beta/
  Gamma Zusatzwalze, thin reflectors).

## Standing cautions

- Institutional self-description is the dominant source family; treat
  "largest", "first", "only" as the museum's claims unless independently
  corroborated.
- The L'Enfant Plaza construction cost (~$162M) comes from journalism, not
  the museum's financial statements.
- The Enigma machine's variant/provenance is not published; do not infer a
  model from exhibit photography.
- The NCM loan was temporary (5 April–31 May 2021); the 13 objects returned
  to NSA custody when the pop-up closed. The loan is evidence of
  partnership, not of transfer.
