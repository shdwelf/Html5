# The "CES For Dummies guide" — source check

**Run:** 28 September 2026. **Prompted by:** the recollection that *"the CES for
dummies guide explains it well"*, and that *"the For Dummies books from the
convention center are a hit."* **Source supplied:** a 2011 gist listing the
personal library —
[GlowScripts/1177334, "Almost 1,000 'For Dummies' eBooks"](https://gist.github.com/GlowScripts/1177334/f2da40d3932d126bc524f191a9f8e4d66deaac34).

## 1. The claim, and the finding in one line

There is **no** *Consumer Electronics Show For Dummies* and no *RSA For Dummies*
— not in the supplied library, not in Wiley's trade catalogue, and not on the
Internet Archive. The books remembered from a convention floor are real, but
they are a **different product line**: vendor-sponsored *For Dummies, [Company]
Special Edition* booklets, written and published by Wiley for a sponsor and
given away free at trade-show booths. They carry no trade ISBN and are not
listed with the retail titles, which is exactly why searching a library list for
"CES" finds nothing.

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
vendors as content marketing, with the sponsor named on the cover.
[Wiley's own sales page](https://www.dummies.com/custom-solutions-archive/)
showcases *SASE For Dummies, Palo Alto Networks 2nd Special Edition*,
*Single-Vendor SASE For Dummies, Fortinet Special Edition*, *Application
Security Posture Management For Dummies, Dazz Special Edition*, and *Zero Trust
Security For Dummies* — and quotes a customer, Cowbell, explicitly on the
trade-show behaviour: *"During events, we have had agents grab several books to
hand out to their colleagues as well."* That is the memory, sourced.

Physical characteristics that identify one of these in a pile:

- Cover reads **"<Topic> For Dummies®, <Vendor> Special Edition"**.
- Published by **John Wiley & Sons, Inc., 111 River St., Hoboken, NJ** — but
  every page footer reads *"These materials are © <year> John Wiley & Sons,
  Inc. Any dissemination, distribution, or unauthorized use is strictly
  prohibited."*
- Roughly 24–50 pages, stapled, no retail ISBN or price.
- Distributed free from the sponsor's booth and as a gated PDF afterwards; e.g.
  [*Phishing For Dummies*, Cisco Special Edition (2023)](https://www.cisco.com/c/dam/en/us/products/security/phishing-dummies-ebook.pdf).

The security-vendor concentration in that list is why RSA Conference is the show
most associated with the practice — the sponsors are the same companies. The
book should say **"a vendor's *For Dummies* Special Edition picked up at a
booth"**, never "the CES For Dummies guide", which does not exist.

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

1. Do not cite a "CES For Dummies guide"; no such title exists.
2. The convention-floor books are sponsored *Special Editions* — cite Wiley
   Custom Solutions and a concrete example, as §3 does.
3. The library gist is a useful primary document for what the author was reading
   around 2011, and it is evidence of the cryptography interest that the Sanborn
   apps later became. It is **not** evidence of attendance at any show.
