# KGB Espionage Museum deep dive — the museum that was sold as 400 auction lots

*Research pass 2026-10-02. Companion record: `kgb-museum-juliens-2021` in the
Intelligence Lecture Hall (apps/Cipher-Machines-and-Cryptology-Suite-2026-08-02
(1).html). Source-check table: `docs/source-check-2026-10-02.md`.*

## Why this museum is in the hall

The Intelligence Lecture Hall's Kryptos K4 record exists because an archive
(the Smithsonian's NMAH) preserves a physical object's custody chain. The KGB
Espionage Museum is the same lesson with the opposite ending: a private,
single-owner, for-profit museum died of a pandemic, and on **13 February 2021**
Julien's Auctions dispersed almost its entire collection in one afternoon.
No institutional archive survived. The auction catalog and the results list
**are** the collection's record now — which makes them a primary source worth
treating with archival care, and makes the difference between "preserved" and
"dispersed" the point of the record.

## The custody chain, link by link

| Link | Date | Evidence |
|---|---|---|
| Kaunas: the Urbaitis family's first museum opens in a former Soviet nuclear bunker near Kaunas, Lithuania | 2014 | PRI/The World interview; museum's own history in press coverage |
| Julius Urbaitis works as collection consultant on HBO's *Chernobyl* (Emmy and Golden Globe winning, 2019) | 2019 | LiveAuctioneers/Julien's sale press |
| **KGB Espionage Museum opens**, 245 West 14th Street, Chelsea, New York | January 2019 | New York Times, 21 January 2019; Patch (Dec 2018 pre-opening) |
| COVID-19 closes the museum | March 2020 | Bloomberg (via Business Times, Nov 2020) |
| Urbaitis confirms permanent closure; collection to be sold — for-profit operations unsustainable | November 2020 | Bloomberg interview |
| **Julien's "The Cold War Relics Auction Featuring The KGB Espionage Museum Collection"** — sale #3292, online catalog id 370, ~400 lots (~240 from the museum), live from Beverly Hills + online | 13 February 2021 | Julien's catalog (closed sale, id 370); Auction Daily preview |
| Results reported | 17 February 2021 | artdaily (auction house figures) |
| Onward owners emerge — e.g. the Fly purse in the Jim Irsay Collection, re-listed by Christie's citing "Julien's, Los Angeles, 13–14 February 2021, lot 147" | 2021 → | Christie's online-only lot page |

The Christie's re-listing is the detail that proves the lesson: one object,
two auction records, one new owner — and the museum itself now appears only
as a name inside a provenance citation.

## The sale, in the auction house's own numbers

All figures are Julien's reported winning bids via its press channels
(artdaily, 17 February 2021); hammer-versus-premium is not always
distinguished, and no independent audit exists. Estimates in parentheses.

| Lot | Object | Result |
|---|---|---|
| 147 | "Fly" spy purse with concealed FED camera | **$32,000** (est. $2,500) — now Jim Irsay Collection |
| — | Hollow-coin concealment device | **$25,600** (est. $200) — 128× estimate |
| 343 | **Fialka M-125-3M cipher machine** with power supply | **$22,400** (est. $8,000–12,000) — top estimate of the sale |
| — | Markov-style syringe umbrella | $19,200 |
| — | "Zaryad" camera bag | $19,200 |
| — | Bugged listening ashtray | $12,800 |
| — | Yacht-1M miniature reel-to-reel recorder | $11,520 |
| — | Stone Lenin from the Kaliningrad KGB headquarters | est. $8,000–12,000 (Forbes preview) |

## The Fialka: marketing lineage versus technical lineage

The sale's marketing copy (and Forbes' preview) described the Fialka as
"developed post-WWII from captured Nazi Enigma technology." Crypto Museum's
technical history contradicts the Enigma-lineage framing:

- M-125 introduced **1956** (M-125-3M in 1965), in Warsaw Pact service into
  the early 1990s, also exported to Cuba — a decade-plus after any captured
  Enigma stock could still be state of the art.
- Design lineage runs through the **Swiss NEMA** idea space; Crypto Museum
  compares it to the US **KL-7 and SIGABA** class, not to Enigma.
- What actually distinguishes it from Enigma: **10 rotors with 30 contacts**
  (Cyrillic alphabet), adjacent rotors stepping in **opposite directions**,
  irregular stepping, a **punched-card commutator** replacing the
  Steckerbrett, and — unlike Enigma — a letter **can** encrypt to itself.
  Later PROTON-2 rotors were field-rewirable (from 1978).
- The "590 quadrillion combinations" figure in Bloomberg's preview is
  marketing arithmetic, not cryptanalysis.

The deep-dive record keeps both claims side by side instead of quietly
picking one: the tension between a collector's story and a technical history
is itself provenance information.

## The museum landscape (comparative frame used by the hall record)

- **Prague KGB Muzeum** — Vlašská 13, Malá Strana (TripAdvisor also lists
  Zborovská 1204/10; the discrepancy is cited, not resolved), €20 guided
  tours, founded by the "Chernyy dozhod" (Black Rain) collector circle; Lenin
  death mask, the garrote nicknamed "Stalin's scarf", 1968 Prague Spring
  photographs. Now **reported permanently closed** (Atlas Obscura /
  TripAdvisor), with relocation rumors — a smaller repeat of the New York
  museum's failure mode.
- **Moscow, Lubyanka** — the FSB's own museum is internal,
  appointment-only, not open to the public, and has never dispersed
  anything. The state keeps its collection; both private museums in this
  record did not keep theirs.
- **International Spy Museum**, Washington DC — the counter-case, a
  nonprofit whose own pages document custody (founders, the Melton gift, the
  NSA loan partnership): see `docs/international-spy-museum-deep-dive.md`.

## What this pass changed in the repository

- Lecture Hall record `kgb-museum-juliens-2021` (26 → 28 records; patch tool
  `tools/patch_lecture_hall_museums.py`; assertions in
  `tools/verify_lecture_hall.mjs`).
- Museum tab exhibit `fialka-juliens-343` in the cipher-suite bundle
  (auction provenance chain, the Forbes-vs-Crypto-Museum tension, the
  Prague/Lubyanka contrast).
- CyberChef: `Museum · KGB Espionage Museum: VIC straddling checkerboard`
  and `Museum · Hollow-nickel mod-10 one-time pad (VENONA class)` recipe
  packs in both kitchens, with the new `otp10` operation (mod-10 pad over
  digits, grouped in fives, warning when the key repeats — the VENONA
  lesson) and the upgraded `enigma` operation.

## Standing cautions

- Prices are the house's own reported bids; "winning bid" vs
  hammer/with-premium is not consistently stated.
- Lot numbers differ per object across sources (343 Fialka, 147 Fly purse);
  some secondary coverage rounds or confuses them.
- "World's largest collection of KGB artifacts" and "only two reproductions
  among 3,500+" are the collector's claims, never independently audited.
- The online catalog of a closed sale is itself ephemeral (the catalog id
  370 pages were not retrievable from this sandbox; the Julien's live
  bidding host returned transport errors). Results press (artdaily) and the
  Christie's re-listing corroborate the headline numbers.
