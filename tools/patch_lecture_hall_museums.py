#!/usr/bin/env python3
"""
patch_lecture_hall_museums.py — the 2026-10-02 pass over the Intelligence
Lecture Hall.

Status: **applied** to the bundle on 2026-10-02. Kept for the same reason the
earlier lecture-hall patch tools are kept: the records otherwise exist only as
~14 kB of text spliced into a 1 MB minified file, and this is the reviewable
source of that text plus the only way to re-derive the edit against a clean
copy of the bundle. Every anchor is asserted to occur exactly once, so the
tool cannot double-apply.

What this pass does
  * adds TWO records (hall: 26 -> 28):
      - `kgb-museum-juliens-2021`   — the KGB Espionage Museum, New York:
        opened January 2019, killed by COVID in March 2020, and dispersed as
        ~400 lots of Julien's "Cold War Relics" sale on 13 February 2021. The
        auction catalog and results list are now the collection's only
        complete record — the provenance-chain lesson, continued from
        `kryptos-k4-smithsonian`.
      - `intl-spy-museum-provenance` — the International Spy Museum,
        Washington DC: the counter-case. An independent nonprofit founded by
        Milton Maltz and Peter Earnest, whose own pages document the
        collection's custody (Melton gift, NSA Cryptologic Museum loan
        partnership, Guinness-record artifact collection) instead of letting
        it scatter.
  * widens the hall's own scope line to name museum and collection custody

After running this, bump the record count in tools/verify_lecture_hall.mjs
from 26 to 28 and add both ids to the RAISED list (both done in the same
commit). See docs/kgb-museum-deep-dive.md, docs/international-spy-museum-
deep-dive.md and docs/source-check-2026-10-02.md for the research.
"""
import json
import os
import sys

APP = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps",
    "Cipher-Machines-and-Cryptology-Suite-2026-08-02 (1).html",
)


def js(value):
    """A JS string literal from a Python str (single-quote-safe, no raw quotes).

    Straight apostrophes are promoted to U+2019 so the new prose matches the
    typography of the rest of the hall. URLs pass through untouched.
    """
    if value.startswith(("http://", "https://")):
        return json.dumps(value, ensure_ascii=False)
    return json.dumps(value.replace("'", "\u2019"), ensure_ascii=False)


def record(rid, title, period, location, confidence, summary, facts, links, caution):
    parts = [
        f'id:"{rid}"',
        f"title:{js(title)}",
        f"period:{js(period)}",
        f"location:{js(location)}",
        f"confidence:{js(confidence)}",
        f"summary:{js(summary)}",
        "facts:[" + ",".join(js(f) for f in facts) + "]",
        "sourceLinks:["
        + ",".join("{" + f"label:{js(l)},url:{js(u)}" + "}" for l, u in links)
        + "]",
        f"caution:{js(caution)}",
    ]
    return "{" + ",".join(parts) + "}"


# ---------------------------------------------------------------- the records

R_KGB = record(
    "kgb-museum-juliens-2021",
    "The KGB Espionage Museum: the museum that died of a pandemic and was sold as 400 auction lots",
    "Museum opened January 2019 · closed March 2020 · auctioned 13 February 2021",
    "245 West 14th Street, New York City · Julien's Auctions, Beverly Hills and online (sale #3292, catalog id 370)",
    "Primary archive",
    "The KGB Espionage Museum in Manhattan lasted fourteen months as a public museum. It opened in January 2019 "
    "with 3,500+ Soviet espionage artifacts assembled by Lithuanian collector Julius Urbaitis and his daughter "
    "Agne Urbaityte, COVID closed it in March 2020, and on 13 February 2021 Julien's Auctions dispersed almost the "
    "entire collection as the centerpiece of its Cold War Relics sale. This record treats the dispersal the way the "
    "Kryptos record treats the Smithsonian archive: as a custody chain a researcher can walk — museum, auction "
    "catalog, results list, onward owners — and it carries the hall's recurring lesson in its harshest form: a "
    "single-owner private museum is a single point of failure, and when it fails the auction catalog becomes the "
    "collection's only complete record.",
    [
        "The museum opened at 245 West 14th Street, Chelsea, in January 2019, launched by the father-daughter team "
        "Julius Urbaitis and Agne Urbaityte of Kaunas, Lithuania; the New York Times covered it on 21 January 2019 "
        "as a warehouse-type space of more than 3,500 KGB-related artifacts.",
        "The New York museum was an offshoot of the family's first museum, opened in 2014 inside a former Soviet "
        "nuclear bunker near Kaunas; Urbaitis also worked as collection consultant on HBO's Emmy and Golden Globe "
        "winning 2019 series Chernobyl.",
        "Admission was $25 and the co-founder Agne Urbaityte described herself to PRI/The World as a secret "
        "telephone communications and cipher machines expert; the museum claimed that of its 3,500+ artifacts only "
        "two were reproductions — a collector's claim, never independently audited.",
        "Closed by the pandemic in March 2020, the for-profit museum never reopened; Urbaitis told Bloomberg "
        "(November 2020) the pandemic had made operations unsustainable and the collection would be sold.",
        "The dispersal: Julien's 'The Cold War Relics Auction Featuring The KGB Espionage Museum Collection', live "
        "from Beverly Hills and online on 13 February 2021 — sale #3292, online catalog id 370, roughly 400 lots "
        "of which about 240 were KGB artifacts from the museum.",
        "The sale's cipher machine — the Fialka M-125-3M, 'the Soviet Union's Cold War answer to the Enigma', lot "
        "343, with power supply — carried the top estimate of US$8,000–12,000 and realised $22,400.",
        "Other results reported by the auction house: the 'Fly' spy purse with concealed FED camera $32,000 "
        "(nearly thirteen times its $2,500 estimate); a hollow-coin concealment $25,600 (128 times its $200 "
        "estimate); a Markov-style syringe umbrella $19,200; a 'Zaryad' camera bag $19,200; a bugged listening "
        "ashtray $12,800; a Yacht-1M miniature reel-to-reel recorder $11,520.",
        "The onward custody chain is already traceable: Christie's later re-listed 'The Fly' purse from the Jim "
        "Irsay Collection, citing 'The Cold War Relics Auction Featuring The KGB Espionage Museum Collection, "
        "sold Julien's, Los Angeles, 13–14 February 2021, lot 147' — one object, two auction records, one new "
        "owner, and the museum itself nowhere in the chain except as a name.",
        "Marketing claims and technical history diverge on the headline machine: Forbes' sale preview described "
        "the Fialka as developed post-WWII from captured Nazi Enigma technology, while Crypto Museum's technical "
        "history derives the design from the Swiss NEMA lineage, compares it to the US KL-7 and SIGABA, and lists "
        "the features that actually distinguish it from Enigma — 10 rotors with 30 contacts, opposite-direction "
        "stepping, a punched-card commutator replacing the plugboard, and letters that can encrypt to themselves.",
        "The same single-owner fragility repeats across the KGB museum landscape: the KGB Museum in Prague — "
        "founded by the 'Chernyy dozhd' (Black Rain) collector circle with guided tours, a Lenin death mask and "
        "the garrote nicknamed 'Stalin's scarf' — is now reported permanently closed, and the FSB's own museum "
        "inside the Lubyanka in Moscow is internal, appointment-only, and has never dispersed anything.",
    ],
    [
        ("The New York Times — A Museum for K.G.B. Aficionados? Da! (21 January 2019)",
         "https://www.nytimes.com/2019/01/21/arts/design/kgb-spy-museum-new-york.html"),
        ("Julien's Auctions — The Cold War Relics Auction Featuring The KGB Espionage Museum Collection (closed catalog, id 370)",
         "https://bid.juliensauctions.com/auctions/catalog/id/370"),
        ("artdaily — KGB Espionage Museum collection auction results exceed all estimates at Julien's Auctions (17 February 2021)",
         "https://artdaily.com/news/133064/KGB-Espionage-Museum-collection-auction-results-exceed-all-estimates-at-Julien-s-Auctions-"),
        ("Auction Daily — KGB Artifacts Come to Auction, Raising Intrigue and Concerns (lot 343 identified)",
         "https://auctiondaily.com/news/kgb-artifacts-come-to-auction-raising-intrigue-and-concerns/"),
        ("Forbes — From Russia With Love: Julien's Auctions Stages A Sale Of Vintage KGB Spy Apparatus (12 February 2021)",
         "https://www.forbes.com/sites/guymartin/2021/02/12/from-russia-with-love-juliens-auctions-stages-a-sale-of--vintage-kgb-spy-apparatus-in-beverly-hills/"),
        ("Christie's / Jim Irsay Collection — the KGB spy purse 'The Fly' (Julien's lot 147 provenance)",
         "https://onlineonly.christies.com/s/jim-irsay-collection-online/kgb-spy-purse-hidden-camera-known-the-fly-492/289023"),
        ("Crypto Museum — Fialka M-125 rotor cipher machine (technical history)",
         "https://www.cryptomuseum.com/crypto/fialka/"),
        ("PRI/The World — You can take selfies with once-secret KGB spycraft at this NY museum (January 2019)",
         "https://pri.org/stories/2019-01-16/you-can-take-selfies-once-secret-kgb-spycraft-ny-museum"),
    ],
    "The prices above are the auction house's own reported winning bids via its press releases, not an independent "
    "audit, and hammer versus with-premium figures are not always distinguished; lot numbering varies between the "
    "catalog and later citations (the Fialka is lot 343, the Fly purse lot 147). 'World's largest collection' is "
    "marketing language from the museum and the auction house. The museum itself kept no public archive, so "
    "provenance for individual objects rests on the collector's own claims and the auction catalog; the "
    "authenticity of specific items — especially anything labelled a reproduction — cannot be re-verified now "
    "that the collection is dispersed.",
)

R_SPY = record(
    "intl-spy-museum-provenance",
    "International Spy Museum: how an espionage collection is kept together — founders, gifts, loans, governance",
    "Conceived 1996 · opened 19 July 2002 · L'Enfant Plaza building May 2019 · NSA pop-up April–May 2021",
    "800 F Street NW, Washington DC (2002–2018) · 900 block of L'Enfant Plaza SW (2019– )",
    "Primary archive",
    "The counter-case to the auctioned KGB Espionage Museum. The International Spy Museum is an independent "
    "nonprofit that publishes its own custody record: a founder who worked at NSA, a founding executive director "
    "with a 36-year CIA career, a 2017 pledged gift from collector H. Keith Melton that roughly tripled the "
    "collection, a formal loan partnership with NSA's National Cryptologic Museum, and a Guinness record for the "
    "largest espionage museum collection. Its Codes exhibit and its 2021 NSA pop-up — PURPLE analog #1, "
    "CipherTAC 2000 — are where the public can stand in front of the same machine classes this hall's other "
    "records discuss. The record is built from the museum's own pages, and the caution section names exactly "
    "which claims remain the museum's own self-description.",
    [
        "The museum describes itself as an independent nonprofit and the only public museum in the United States "
        "that lifts the veil on the tradecraft, history and contemporary role of espionage from a global "
        "perspective; it opened in 2002 in the Penn Quarter neighborhood and relocated to a new expanded building "
        "at L'Enfant Plaza in 2019 (spymuseum.org/about).",
        "The founder: Milton Maltz, a US Navy veteran who worked at the National Security Agency during the "
        "Korean War and built Malrite Communications, served as founding chairman; he funded the museum with his "
        "wife Tamar and their family foundation (board of directors page; 2022 milestones release).",
        "The founding executive director: Peter Earnest, a 36-year CIA veteran with more than 20 years in the "
        "Clandestine Service, a member of the Senior Intelligence Service and the Agency's principal spokesman in "
        "his final posting — the intelligence-community credentials the KGB Espionage Museum never had.",
        "It opened to the public on 19 July 2002 at 800 F Street NW; the 2022 twentieth-anniversary release walks "
        "twenty milestones, including the August 2010 visit of President Obama and his family and the November "
        "2012 premiere of 'Exquisitely Evil: 50 Years of Bond Villains' with EON Productions.",
        "The new building at L'Enfant Plaza — about $162 million per contemporary reporting, funded with "
        "contributions from Milton and Tamar Maltz — opened in May 2019 with all-new exhibitions: Briefing "
        "Center, Stealing Secrets, Making Sense of Secrets, An Uncertain World, Covert Action, Debriefing Center.",
        "The cryptologic heart: the permanent Codes exhibit covers the key WWII code-breaking stories — Enigma, "
        "the Japanese diplomatic machine PURPLE, and Midway's JN-25 — with rare code artifacts and hands-on "
        "Caesar Cipher and Cardano Grille interactives; the museum shows a genuine Enigma machine beside a "
        "console demonstrating how it works (exhibit pages; Peter Earnest interview).",
        "In September 2017 the collection roughly tripled in size through the pledged gift of founding board "
        "member H. Keith Melton — the author-collector whose espionage artifact holdings are themselves a "
        "scholarly reference — and his wife Karen Melton.",
        "In April 2020 Guinness World Records named it the largest espionage museum in the world on the basis of "
        "its artifact collection; the museum says it holds the largest collection of international espionage "
        "artifacts on public display.",
        "The loan partnership: while NSA's National Cryptologic Museum was closed for redesign, its director Dr. "
        "Vince Houghton loaned the Spy Museum 13 artifacts for the pop-up 'Codes, Ciphers & Mysteries: NSA "
        "Treasures Tell Their Secrets' (5 April–31 May 2021, Briefing Center), curated with Spy Museum historian "
        "Dr. Andrew Hammond.",
        "The 13 loaned objects included the PURPLE analog #1 decryption device built by US Army codebreakers in "
        "1940 — the exhibition's self-described most important artifact — and CipherTAC 2000, the NSA's first "
        "secure cell phone, from the late 1990s.",
        "Governance is the difference this record exists to show: a board of directors drawn from the intelligence "
        "community, government, media and business, a teacher advisory board for K-12 programming, and a five-year "
        "strategic vision adopted in 2023 — the institutional spine that a for-profit single-collector museum "
        "lacks, and the reason this collection has never had to be sold at auction.",
    ],
    [
        ("International Spy Museum — About the Museum",
         "https://www.spymuseum.org/about/"),
        ("International Spy Museum — Board of Directors (Maltz, Earnest, Gomez)",
         "https://www.spymuseum.org/about/board-of-directors/"),
        ("International Spy Museum — Spy Museum Celebrates 20th Anniversary by Looking Back at 20 Milestones (19 July 2022)",
         "https://www.spymuseum.org/press/press-archive/2022-press-releases/spy-museum-celebrates-20th-ann/"),
        ("International Spy Museum — Spy Museum Launches Limited-Run Pop-Up Exhibit of Extraordinary Codebreaking Artifacts (23 March 2021)",
         "https://www.spymuseum.org/press/press-archive/2021-press-releases/spy-museum-launches-limited-ru/"),
        ("International Spy Museum — Codes, Ciphers & Mysteries: NSA Treasures Tell Their Secrets (exhibit page)",
         "https://www.spymuseum.org/exhibition-experiences/codes-ciphers-mysteries-nsa-tr/"),
        ("International Spy Museum — Gallery: Making Sense of Secrets (Codes / Analysis / Decision Room)",
         "https://www.spymuseum.org/exhibition-experiences/gallery-making-sense-of-secret/"),
        ("BankInfoSecurity — Lessons from Spies: Peter Earnest of the International Spy Museum (the Enigma and its console)",
         "https://www.bankinfosecurity.com/interviews/lessons-from-spies-peter-earnest-international-spy-museum-i-347"),
        ("Crypto Museum — the Fialka M-125 and Enigma wirings used to cross-check the technical claims",
         "https://www.cryptomuseum.com/crypto/fialka/"),
    ],
    "Most facts above are the museum's own institutional self-description — its about pages, board pages and "
    "press releases — and should be read as such: 'largest collection' and the Guinness record rest on the "
    "museum's own submission, attendance and funding figures come from its announcements, and independent "
    "audits of the collection are not published. The specific Enigma machine on display (model, year, "
    "provenance) is not documented on the public exhibit pages, so it is cited here only as a genuine Enigma "
    "machine shown beside a working console. Cost figures for the L'Enfant Plaza building come from "
    "contemporary journalism, not the museum's financial statements.",
)


# ------------------------------------------------------------------- the edits

EDITS = [
    # 1–2. append both records to the hall's data array Pc, after dos-packer-obfuscation
    (
        " they are obfuscation, and the point of the record is how quietly they fail, not how strong they are.\"}],Vv=[",
        " they are obfuscation, and the point of the record is how quietly they fail, not how strong they are.\"},"
        + R_KGB + "," + R_SPY + "],Vv=[",
    ),
    # 3. widen the hall's own scope line to name museum and collection custody
    (
        ", internet puzzle hunts, archival provenance, executable packers and institutional memory",
        ", internet puzzle hunts, archival provenance, executable packers, museum and collection custody and institutional memory",
    ),
]


def main():
    src = open(APP, encoding="utf-8").read()
    original = src
    for i, (old, new) in enumerate(EDITS, 1):
        n = src.count(old)
        if n != 1:
            print(f"FAIL edit {i}: anchor found {n} times (need exactly 1)")
            sys.exit(1)
        src = src.replace(old, new, 1)
    open(APP, "w", encoding="utf-8").write(src)
    print(f"OK · bundle {len(original)} \u2192 {len(src)} bytes ({len(src) - len(original):+d})")


if __name__ == "__main__":
    main()
