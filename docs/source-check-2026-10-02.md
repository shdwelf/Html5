# Source check — museum provenance, cipher wirings and the crow investigation — 2026-10-02

## Method

The 2026-10-02 pass covered the KGB Espionage Museum and its Julien's
auction dispersal, the International Spy Museum, the Enigma wiring tables in
the cipher-suite bundle, and the Crow's Cryptogram / Kryptos-misspellings
experiment. First-party pages were preferred over search-result summaries;
auction-house and institutional self-description is labeled as such
everywhere it is used. As in earlier passes, a direct `curl` from this
sandbox returning transport errors is treated as a sandbox limitation,
**not** as dead-link evidence.

## Checked source families

| Source | First-party evidence checked | Result |
|---|---|---|
| ciphermachinesandcryptology.com/en/enigmatech.htm | Enigma rotor/reflector wiring tables, notches, double-step description | Confirmed; canonical reference for the wiring fixes |
| cryptomuseum.com/crypto/enigma/wiring.htm | Full wiring tables incl. Beta/Gamma and thin reflectors; M4 introduction date (2 Feb 1942) | Confirmed; **date discrepancy with Wikipedia's 1 Feb 1942 recorded, not resolved** |
| Wikipedia — Enigma rotor details | Wirings I–VIII, Beta/Gamma, UKW-A/B/C, thin B/C, notches, the AAAAA→BDZGO vector, M4 1 Feb 1942 | Confirmed; three-source agreement on every corrected value |
| ciphermachinesandcryptology.com/en/crow.htm (page dated 05 Sep 2026) | Poem (31 words), 600 digits/120 groups, hint line, Table of Honor (Sylichenko 08 Feb 2023; Kondo 05 Sep 2026), pencil-and-paper + key-phrase description | Confirmed |
| rijmenants.blogspot.com (Enigma Challenge statistics, 20 Apr 2026 post) | 366 solvers / 46 countries for the Enigma Challenge; crow "only one person ever solved" (pre-Kondo) | Confirmed as author's own blog statement |
| New York Times, 21 Jan 2019 | KGB Espionage Museum opening, 245 W 14th St, 3,500+ artifacts, Urbaitis/Urbaityte | Confirmed |
| PRI/The World, Jan 2019 | Kaunas bunker museum (2014), Urbaityte's cipher-machines expertise, two-reproductions claim | Confirmed |
| Bloomberg via Business Times, Nov 2020 | Permanent closure, for-profit unsustainability, ~300 lots, Fialka top estimate $8–12k, "590 quadrillion combinations" | Confirmed; quadrillion figure labeled marketing arithmetic |
| Julien's Auctions — sale #3292 / catalog id 370 (closed) | Catalog existence, sale name/date; live catalog pages themselves | **Not retrievable from this sandbox** (transport 500s); existence corroborated by press mirrors and Christie's citation — catalog remains the named primary record |
| artdaily, 17 Feb 2021 | Results: Fly purse $32,000 (est $2,500), hollow coin $25,600 (est $200), Fialka lot 343 $22,400, umbrella $19,200, Zaryad bag $19,200, ashtray $12,800, Yacht-1M $11,520 | Confirmed (auction-house figures, no independent audit exists) |
| Christie's online-only — Jim Irsay Collection lot | "The Fly" purse with provenance citation 'Julien's, Los Angeles, 13–14 February 2021, lot 147' | Confirmed; the onward-custody link |
| Forbes, 12 Feb 2021 | Sale preview, Stone Lenin est $8–12k, "developed post-WWII from captured Nazi Enigma technology" claim | Confirmed as published; claim itself contradicted by the technical source below |
| cryptomuseum.com/crypto/fialka/ | M-125 1956 / M-125-3M 1965, 10 rotors × 30 contacts, opposite-direction stepping, punch-card commutator, self-encryption allowed, NEMA lineage, KL-7/SIGABA comparison, Warsaw Pact + Cuba service | Confirmed |
| spymuseum.org — about / board pages | Nonprofit status; Maltz (US Navy/NSA Korean War, Malrite); Earnest (36-year CIA, Clandestine Service 20+ years) | Confirmed as institutional self-description |
| spymuseum.org — 20th-anniversary milestones release (19 Jul 2022) | 19 July 2002 opening; Obama visit Aug 2010; Exquisitely Evil Nov 2012 (EON); Melton gift tripling collection Sep 2017; Guinness April 2020 | Confirmed as institutional self-description |
| spymuseum.org — NSA pop-up press release (23 Mar 2021) + exhibit page | "Codes, Ciphers & Mysteries: NSA Treasures Tell Their Secrets", 5 Apr–31 May 2021, Briefing Center, 13 NCM-loaned objects, PURPLE analog #1 (1940), CipherTAC 2000, Houghton (NCM), Hammond (SPY) | Confirmed as institutional self-description |
| spymuseum.org — gallery pages + Earnest interview (BankInfoSecurity) | Permanent Codes exhibit: Enigma + working console, PURPLE, Midway JN-25, Caesar/Cardano interactives | Confirmed; **the displayed Enigma's model/provenance is not published — recorded as unknown, not inferred** |
| Atlas Obscura / TripAdvisor — KGB Muzeum Prague | Permanent closure reported; address discrepancy Vlašská 13 vs Zborovská 1204/10 | Confirmed as reported; discrepancy cited, not resolved |
| Dark-tourism coverage — Lubyanka FSB museum | Internal, appointment-only, not public | Confirmed |

## Corrections and boundaries retained

- **"20 words" → 31 words.** The user's voice note remembered the crow poem
  as 20 words; the poem is 31 words (126 letters). The correction is on the
  record in the doc, the bundle record and the verify harness.
- **Four Enigma wirings in the bundle were wrong and are now fixed** (UKW-A,
  rotor VI, rotor Gamma, UKW-B Thin). The old UKW-B Thin value
  (`ENRQWEZXYSFIPOVBLMDUHGMCKJ`) is a known-wrong internet variant; it fails
  the Beta@A + thinB ≡ wideB composition test, which is now asserted in the
  verify harness. Earlier suite versions (07-27…07-31) carry the same wrong
  wirings and were deliberately left untouched as archival copies.
- The Kryptos-misspellings preset's plugboard is the **legal** UN-DE-RG
  subset; UNDERGRUUND's fourth sequential pair (RU) would reuse R, which a
  Steckerbrett cannot accept. An earlier draft of this pass baked the
  illegal 4-pair plugboard into the suite and CyberChef — caught by
  cross-engine parity testing and fixed.
- Julien's/Bloomberg lot-count figures vary (~300 vs ~400 lots / ~240 KGB
  artifacts); the record states the ranges rather than picking one.
- The M4 introduction date differs by one day between Crypto Museum
  (2 Feb 1942) and Wikipedia (1 Feb 1942); both are cited.
- Prices are the auction house's own reported bids; hammer vs premium is not
  consistently stated. No independent audit of the collection's
  authenticity (the "only two reproductions" claim) exists.
- No public analysis of the crow poem's town riddle was found; the poem's
  candidates are not guessed at. The Enigma experiment's negative result is
  asserted by the harness so it cannot silently become a "maybe solved".
- RR Auction's Fialka lots (2024, $22,000 / $18,750) belong to a different
  auction house than Julien's and are not mixed into this record.

## New records and artifacts produced by this pass

| Artifact | Where |
|---|---|
| Lecture Hall records `kgb-museum-juliens-2021`, `intl-spy-museum-provenance` (hall 26 → 28) | cipher-suite bundle; `tools/patch_lecture_hall_museums.py` |
| Museum exhibits `fialka-juliens-343`, `spy-museum-enigma` (museum tab 13 → 15) | cipher-suite bundle |
| Enigma wiring fixes + M4 preset "Kryptos Misspellings Experiment (2026)" | cipher-suite bundle; asserted in `tools/verify_lecture_hall.mjs` |
| Enigma engine, crow corpus, misspellings data, experiment | `js/lecture-ciphers.js` (JS) + `tools/crow_kryptos_enigma_experiment.py` (Python) — parity-checked |
| Verify harness section 9 (vectors, corpus, experiment) | `tools/verify_lecture_hall.mjs` |
| CyberChef `enigma` (M3/M4) + `otp10` ops, 5 museum packs | `apps/cyberchef.html` |
| CyberChef `enigma` upgraded to I–VIII + Beta/Gamma + thin UKWs, `otp10`, 6 museum packs, count 366 → 369 | `public/apps/cyberchef/index.html`; `test/cyberchef-museum-recipes.test.ts` |
| Research docs | `docs/kgb-museum-deep-dive.md`, `docs/international-spy-museum-deep-dive.md`, `docs/crow-cryptogram-investigation-2026-10-02.md` |
