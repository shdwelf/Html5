# The "CES For Dummies guide" — source check

> **Bibliographic index:** [Source-check bibliography](source-check-bibliography.md) — normalized references, source-status notes, and coverage audit.

**Run:** 28 September 2026. **Prompted by:** the recollection that *"the CES for
dummies guide explains it well"*, and that *"the For Dummies books from the
convention center are a hit."* **Source supplied:** a 2011 gist listing the
personal library —
[GlowScripts/1177334, "Almost 1,000 'For Dummies' eBooks"](https://gist.github.com/GlowScripts/1177334/f2da40d3932d126bc524f191a9f8e4d66deaac34).

## 1. The claim, and the finding in one line

**Revised 28 September 2026 (second pass, after catalogue checks).** There is no
retail title called *Consumer Electronics Show For Dummies*. But the challenge
was right on the substance and this note's first pass was wrong on two counts:
the sponsored *For Dummies* **Special Editions are a real, catalogued
collection** — they carry ISBNs and appear in library catalogues — and the CES
show floor has its own, written by CES exhibitors. The clearest example is
**Qorvo's *Internet of Things For Dummies*, published with Wiley and launched on
5 December 2016**, a month before CES 2017, by the RF-chip company whose
Wireless Connectivity unit sells into exactly the smart-home market CES exists
to show. So: a *For Dummies* guide picked up around CES is entirely real; the
thing that does not exist is a guide *to the show itself*.

## 2. What the supplied library actually contains

The gist is a flat alphabetical list of ~1,000 retail titles with ISBNs,
spanning roughly 2004–2011 — the Wiley trade catalogue of the period, not a
trade-show haul.

| Where a CES/RSA title would sit | What is actually there |
| --- | --- |
| …*Consulting* → **Consumer Electronics Show** → *Container Gardening* | Consulting for Dummies · **Consumer Behavior for Dummies** (0470449837) · Container Gardening for Dummies |
| …*Reverse Mortgages* → **RSA** → *RTLS* | Reverse Mortgages · **RFID for Dummies** (076457910X) · **RTLS for Dummies** (047039868X) · Ruby on Rails |

Neither gap is filled. What the library *does* hold, and what is relevant to
this book's Sanborn and security threads:

- **Cryptography for Dummies** (0764541889)
- **Cracking Codes and Cryptograms for Dummies** (0470591005)
- **Computer Forensics for Dummies** (0470371919), **e-Discovery for Dummies**
  (0470510129), **Biometrics for Dummies** (0470292881)
- **Blocking Spam and Spyware for Dummies**, **Preventing Identity Theft for
  Dummies**, **Computer Viruses for Dummies**
- **Electronics for Dummies** (two editions), **Smart Homes for Dummies**,
  **Digital Video for Dummies**, **TiVo for Dummies** — the consumer-electronics
  shelf, which is probably what fused with "CES" in memory
- **Washington D.C. for Dummies** (047012010X) — noted only because the Sanborn
  thread runs through that city; it is a Frommer's-style travel guide, nothing
  to do with the convention center

**A tell worth recording:** four entries in this retail list are not really
retail titles — **RTLS for Dummies**, **Replication for Dummies** (0470739800),
**DRER for Dummies** (047061076X) and **PHOP for Dummies** (0470610786). Short,
vendor-specific, no consumer market. Sponsored editions leak into catalogue
dumps like this one, which is precisely the blur that makes the memory
plausible: the two product lines look identical on a shelf.

## 3. What the convention-floor books really are

Wiley runs this as a product: **Custom Solutions / Custom For Dummies**, sold to
sponsors as content marketing, with the sponsor named on the cover.
[Wiley's own sales page](https://www.dummies.com/custom-solutions-archive/)
showcases *SASE For Dummies, Palo Alto Networks 2nd Special Edition*,
*Single-Vendor SASE For Dummies, Fortinet Special Edition*, *Application
Security Posture Management For Dummies, Dazz Special Edition* and *Zero Trust
Security For Dummies* — and quotes a customer, Cowbell, on the trade-show
behaviour itself: *"During events, we have had agents grab several books to hand
out to their colleagues as well."*

How to identify one in a pile:

- Cover reads **"<Topic> For Dummies®, <Sponsor> Special Edition"** (or
  *Limited Edition*, or a bare *Special Edition* for an unnamed client).
- Published by **John Wiley & Sons, Inc., 111 River St., Hoboken, NJ**, with
  every page footed *"These materials are © <year> John Wiley & Sons, Inc. Any
  dissemination, distribution, or unauthorized use is strictly prohibited."*
- Roughly 24–80 pages, stapled, no cover price, free at the booth and as a gated
  PDF afterwards — e.g.
  [*Phishing For Dummies*, Cisco Special Edition (2023)](https://www.cisco.com/c/dam/en/us/products/security/phishing-dummies-ebook.pdf).

### 3.1 Correction: they *are* catalogued, and they *do* have ISBNs

The first pass of this note said these booklets carry no ISBN and are absent
from catalogues. **That is wrong.** Open Library returns **128** titles matching
`title:"for dummies" AND title:custom` and **71** matching
`title:"for dummies" AND title:"special edition"`, nearly all published by
"Wiley & Sons, Incorporated, John", and each carries two to four ISBNs (print
and electronic). A sample of the record shape:

| Title | Year | ISBN |
| --- | --- | --- |
| Cloud Data Lakes for Dummies, Snowflake Special Edition (Custom) | 2019 | 9781119666240 |
| Zero Trust Security for Dummies, Edgewise Special Edition (Custom) | 2018 | 9781119542704 |
| Machine Identity Protection for Dummies, Venafi Special Edition (Custom) | 2018 | 9781119491309 |
| SIP Trunking for Dummies, Sonus Special Edition | 2012 | 9781118487679 |
| Green Cleaning For Dummies, ISSA Special Edition | 2007 | 9780470125113 |
| IT Compliance for Dummies (Limited Edition) | 2005 | 9780471752806 |

So the line to use about these books is *"no retail edition, no cover price,
distributed free"* — **not** "no ISBN" and **not** "uncatalogued".

WorldCat itself could not be queried from here: `search.worldcat.org` answers
the fetcher with an OCLC terms-of-service consent page rather than results, and
its `/api/search` endpoint returns HTTP 502 without a key. Open Library and the
Library of Congress JSON API were used instead; LoC's index is dominated by
newspapers with "SPECIAL EDITION" mastheads and returned nothing useful. **If
WorldCat is to be the citation, it needs to be run from a browser session** —
the catalogue records above are the same ones it would show.

### 3.2 The CES floor's own yellow books

No sponsor has ever put the show's name on a cover, but CES exhibitors have
commissioned the books, and the timing is the giveaway:

- **Internet of Things For Dummies®, Qorvo Special Edition** and its companion
  **Internet of Things Applications For Dummies** — written with John Wiley &
  Sons, announced **5 December 2016**, free download, two volumes. Qorvo's
  Wireless Connectivity GM Cees Links fronted it; the content is smart-home
  market opportunity, IoT communications standards, and security. A later
  **2nd Qorvo Special Edition** adds the **Matter** standard. Announced a month
  before CES 2017, aimed squarely at the smart-home audience that fills the
  LVCC. [Qorvo release](https://www.qorvo.com/newsroom/news/2016/new-qorvo-ebook-series-explains-the-internet-of-things-iot) ·
  [download page](https://www.qorvo.com/design-hub/ebooks/internet-of-things-for-dummies) ·
  [EDN](https://www.edn.com/new-qorvo-e-book-series-explains-the-internet-of-things-iot/)
- **IoT Solutions For Dummies, ARM Special Edition** (2018, 9781119503354)
- **Internet of Things For Dummies, Qorvo Special Edition** (2016, 9781119349921)
- **Wi-Fi 6 For Dummies, Extreme Networks Special Edition** (2019, 9781119642855)
- **Time-Sensitive Networking For Dummies, Belden/Hirschmann Special Edition** (2018, 9781119527992)

And the consumer-electronics *retail* channel had its own customs, which is a
second way one of these ends up in a house:

- **Windows XP For Dummies, Limited Edition (Circuit City Custom Book)**, 2003,
  ISBN 9780764549960
- **ACT for Dummies, Student Edition, Wal-mart Custom**, 2006, ISBN 9780470056592

### 3.3 The RSA side is documented twice over

RSA Conference doesn't just receive these books, it reviews them: RSAC's own
library carries a review of **Cryptography For Dummies** and one of **Hacking
For Dummies, 5th Edition**. The security-vendor concentration in the custom
catalogue and the reviews on the conference's own site are two independent
records of the same habit.
[RSAC on Cryptography For Dummies](https://www.rsaconference.com/library/blog/cryptography-for-dummies) ·
[RSAC on Hacking For Dummies](https://www.rsaconference.com/blogs/hacking-for-dummies-5th-edition)

## 4. Internet Archive sweep

Searched via `advancedsearch.php` (the sandbox has no direct network; queries
were run through the fetch tool):

| Query | Result |
| --- | --- |
| `title:("for dummies") AND title:(CES OR "consumer electronics")`, `mediatype:texts` | **0 items** |
| `"consumer electronics show"` (all media) | 682 items — overwhelmingly video: LG/Samsung CES booth reels, G4TV segments, Engadget podcasts |
| `"consumer electronics show"`, `mediatype:texts`, oldest first | 54 items, and none is a show guidebook |

The texts that *do* exist are the genuinely archival CES documents, and they are
better sources than any guidebook would have been:

- **Mattel internal memos**, 1978 — `19780510VideoGameSpecificationsAndCESPlans`
  and `19780531CESRevisedScheduleAndFAQ` (the *mattelinternal* collection)
- **`1982CESLineUp`** (Mattel) and
  **`commodore-1984-winter-ces-show-preparation`**
- **Commodore press releases**, e.g. `19800105CommodoreIntroducesNewCalculatorLineAtCES`
- CES coverage inside *Byte*, *Compute!*, *Compute! Gazette*, *ST Log* and *NZ
  Bits and Bytes*, 1981–1987

No official CTA/CEA show directory appears to be scanned there. If a printed CES
directory is wanted as a source, it will have to come from a physical copy or
from CTA, not from the Archive.

## 5. "Pub crawl" — unresolved

Nothing found. CES is a trade-only event and CTA publishes attendee guides
(registration, badge pickup, venue/campus maps), but no official pub crawl. The
term is standard for *unofficial* after-hours circuits run by vendors, podcasts
and local groups during Vegas tech weeks, and those leave little durable record.
**Flagged, not resolved** — this needs a flyer, a photo, a badge or a dated post
before it can go in the book as anything but recollection.

## 6. What this changes

1. Do not cite a "CES For Dummies guide" **as a guide to the show** — no such
   title exists in any catalogue checked.
2. Do cite the sponsored editions, which are real, ISBN-bearing and catalogued;
   for a CES-floor example use **Qorvo's *Internet of Things For Dummies***
   (Wiley, December 2016, with a 2nd Special Edition covering Matter). For the
   RSA side, use the vendor security editions plus RSAC's own book reviews.
3. Correct the earlier wording in this note and anywhere it was repeated: these
   booklets have ISBNs and library records. What they lack is a retail edition
   and a cover price.
4. The supplied library gist remains a dated record of what the author was
   reading around 2011 — including *Cryptography For Dummies* and *Cracking
   Codes and Cryptograms For Dummies* — and is not evidence of attendance at any
   show.
5. Still open: WorldCat could not be queried from this environment (consent
   wall), and the "pub crawl" is still unverified.
