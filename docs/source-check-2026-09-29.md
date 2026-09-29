# Source check — Sanborn / Kryptos K4 deep dive — 2026-09-29

Companion audit for `docs/sanborn-suite-deep-dive.md` and the K4 text shipped in
`public/apps/kryptos-vrml/index.html` (and its standalone twin
`apps/kryptos_vrml.html`).

## Method

Claims were checked against first-party or primary-reporting pages where
retrievable (RR Auction's own release, Paradigm's own write-up, Scientific
American, Wired, Washington Post), and against the community reference
(solvekryptos.com) only where a claim is explicitly labeled a *reconstruction*.
The recovered/solved distinction was treated as load-bearing and verified in more
than one outlet. Where a claim could not be raised above "community
interpretation," it is labeled as such rather than promoted.

## Checked claims

| Claim | First-party / primary evidence | Result |
|---|---|---|
| K4 plaintext recovered Sep 2025 from Smithsonian archive by Kobek & Byrne; Sanborn authenticated it Sep 3, 2025 | [Scientific American](https://www.scientificamerican.com/article/a-solution-to-the-cias-kryptos-code-is-found-after-35-years/); [Wired](https://www.wired.com/story/crypto-guys-bought-the-answer-to-the-cias-mysterious-kryptos-sculpture/) | Confirmed |
| Recovery is NOT a cryptanalytic solve; method never publicly broken | [Cipher Museum](https://ciphermuseum.com/ciphers/kryptos.html); [verawren](https://verawren.substack.com/p/the-answer-that-isnt-a-solution) ("no way on earth that this is a cryptographic solve") | Confirmed |
| Scraps existed because Sanborn cut plaintext into strips, taped out of order, for the Dept./Center of Historical Intelligence content review | [verawren/Substack](https://verawren.substack.com/p/the-answer-that-isnt-a-solution); [RR Auction](https://content.rrauction.com/jim-sanborns-complete-kryptos-archive-sells-for-962500-at-auction/) ("original scrambled texts shown to the Department of Historical Intelligence") | Confirmed |
| Smithsonian sealed the files 50 years, until 2075 | [Scientific American](https://www.scientificamerican.com/article/a-solution-to-the-cias-kryptos-code-is-found-after-35-years/); [Grokipedia](https://grokipedia.com/page/Kryptos) | Confirmed |
| Auction ran Oct 16–Nov 20 2025; sold $962,500 to anonymous buyer; estimate $300k–$500k | [RR Auction](https://content.rrauction.com/jim-sanborns-complete-kryptos-archive-sells-for-962500-at-auction/); [Washington Post](https://www.washingtonpost.com/entertainment/2025/11/21/kryptos-auction-sale-sanborn-cia/) | Confirmed |
| Sanborn netted ~$770,000 | [Wired](https://www.wired.com/story/crypto-guys-bought-the-answer-to-the-cias-mysterious-kryptos-sculpture/) | Confirmed |
| Lot contents incl. K4 handwritten plaintext, K4 coding system, 1988 alternate K1, 1988 alternate K4 = "K5", signed screen-cutting plaintexts, scrambled DHI texts | [RR Auction](https://content.rrauction.com/jim-sanborns-complete-kryptos-archive-sells-for-962500-at-auction/) | Confirmed |
| Buyer = Paradigm (crypto VC); revealed Jun 12, 2026 | [Paradigm](https://www.paradigm.xyz/writing/kryptos); [Wired](https://www.wired.com/story/crypto-guys-bought-the-answer-to-the-cias-mysterious-kryptos-sculpture/) | Confirmed |
| Verifier = SHA-256 hash → Google Cloud KMS HMAC; nobody sees the answer; $1/submission (was $50); no cash prize for K4; CTF pays $1,000/puzzle | [Paradigm](https://www.paradigm.xyz/writing/kryptos); [Economic Times](https://economictimes.indiatimes.com/news/international/us/a-famous-10-foot-cia-sculpture-just-changed-hands-and-the-crypto-firm-that-bought-its-last-secret-says-it-hasnt-peeked-because-the-mystery-of-kryptos-is-still-the-point/articleshow/131702353.cms) | Confirmed |
| Berlin Clock = Weltzeituhr at Alexanderplatz (not the Mengenlehreuhr); sits on a compass-rose mosaic | [solvekryptos.com/about](https://solvekryptos.com/about); [Boxentriq](https://www.boxentriq.com/guides/kryptos-cipher-solutions) | Confirmed |
| Four anchors EAST(22–25)/NORTHEAST(26–34)/BERLIN(64–69)/CLOCK(70–74) | [solvekryptos.com/resources](https://solvekryptos.com/resources); [Boxentriq](https://www.boxentriq.com/guides/kryptos-cipher-solutions) | Confirmed |
| Deliberate misspellings IQLUSION (K1), UNDERGRUUND (K2), DESPARATLY (K3), DIGETAL (Morse) | [Wired 2009](https://www.wired.com/2009/04/ff-kryptos/); [Popular Mechanics](https://www.popularmechanics.com/technology/security/a30750852/cia-kryptos-puzzle/); [solvekryptos.com/about](https://solvekryptos.com/about) | Confirmed |
| Morse slabs: VIRTUALLY INVISIBLE / DIGETAL INTERPRETATIT / SHADOW FORCES / LUCID MEMORY / T IS YOUR POSITION / SOS / RQ | [solvekryptos.com/about](https://solvekryptos.com/about); [puzzling.stackexchange](https://puzzling.stackexchange.com/questions/25931/unsolved-mysteries-kryptos) | Confirmed |
| QTH Q-signal = "what is / my position"; used by army/military CW operators | [giangrandi.org](https://www.giangrandi.org/electronics/radio/qcode.shtml); [inmorsecode.com](https://inmorsecode.com/learn/q-codes/); [radio-hobbyist](https://radio-hobbyist.com/ham-radio-q-codes/) | Confirmed (Q-signal); "army encryption device" NOT supported |
| Q brackets solved text: K3 `CAN YOU SEE ANYTHING?` bounded by X and Q; Morse RQ; K3 ends in Q | [Wired 2009](https://www.wired.com/2009/04/ff-kryptos/); [puzzling.stackexchange](https://puzzling.stackexchange.com/questions/25931/unsolved-mysteries-kryptos) | Confirmed |
| Full 97-char reading "THE COMPASS ROSE IS HERE X …" | [solvekryptos.com](https://solvekryptos.com/); Reddit repost | **Reconstruction only** — not the sealed authenticated text |
| K4 mechanism = Quagmire-III variant + physical keystream + one-bit gate, keyword KRYPTOS | [solvekryptos.com/about](https://solvekryptos.com/about) | **Back-solved model**, internally consistent, not forward-derived |
| K4 method is a specific "army encryption device" | — no first-party source | **Not supported / downgraded** |

## Boundaries retained

- **"Recovered" ≠ "solved."** The apps say the plaintext was *found in an archive*
  and the *method was never publicly broken*. Do not write "K4 solved."
- The full 97-character reading is labeled a **community reconstruction**, never the
  authenticated plaintext (which is sealed until 2075 and privately held).
- The Quagmire-III mechanism is presented as a **back-solved model** (falsifiable by
  anchors, not forward-derivable from public data).
- The **Q lead** is resolved as a **radiotelegraph Q-signal (QTH = position)** and
  an interpretive/thematic link, **not** as an "army encryption device." No source
  ties K4's method to a named military cipher machine; Scheidt built classical hand
  systems.
- "With/without misspellings": the reconstruction is clean; we note a
  Sanborn-authentic variant *could* carry a deliberate misspelling (his habit
  across K1–K3 and DIGETAL) but we **do not fabricate** a specific misspelled form.
- solvekryptos.com is treated as a **community reference for reconstructions**, not
  as first-party artist confirmation.

## New/updated records produced by this pass

1. `docs/sanborn-suite-deep-dive.md` (new)
2. This source-check note
3. K4 text updates in `public/apps/kryptos-vrml/index.html` and
   `apps/kryptos_vrml.html` (Q-signal note, misspelling-variant caveat, submission
   /archive custody note)
