# Cicada 3301 — QR poster locations and the lat/long layer (2012)

*2026-10-23 · backlog T12.1 (S12) · historical/desk research over published
solver documentation. This is a record of a 2012 public event, not a puzzle
walkthrough: no QR payloads, onion addresses, or solution steps are
reproduced, and the final puzzle (Liber Primus) remains unsolved and
untouched here.*

## The physical layer of the 2012 puzzle

Cicada 3301's first puzzle (posted to 4chan on 4 January 2012) crossed from
images into geography on **9 January 2012 at 17:00 UTC**, when a countdown
page published **14 GPS coordinates** with the instruction to find the
cicada symbol "at the location nearest you". At (or near) those coordinates,
solvers found paper posters — cicada glyph plus a QR code — taped to poles.
Twelve of the coordinates also appeared in the puzzle's OutGuess data; two
(Seoul–Gangseo and Fayetteville) were on the website only. A poster was
retrieved from both of those anyway, which is part of why the episode is
well documented: retrieval was a distributed, photographed, public act.

### The 14 published coordinates (9 Jan 2012)

| # | Coordinates | Documented location | Poster outcome (solver matrices) |
| --- | --- | --- | --- |
| 1 | 52.216802, 21.018334 | Oleandrów 6, Warsaw, PL | FOUND |
| 2 | 48.8505706, 2.4068923 | 89–91 Rue de la Plaine, Paris, FR | FOUND |
| 3 | 48.8503014, 2.4075387 | 36 Rue des Maraîchers, Paris, FR | not recovered |
| 4 | 47.664196, −122.313301 | 4739 University Way NE, Seattle, WA | listed; recovery varies by matrix |
| 5 | 47.637520, −122.346277 | 514 Crockett St, Seattle, WA | listed |
| 6 | 47.622993, −122.312576 | 428 15th Ave E, Seattle, WA | listed |
| 7 | 37.577070, 126.813122 | Banghwa-dong, Gangseo-gu, Seoul, KR | FOUND (website-only coordinate) |
| 8 | 37.519667, 126.995000 | Seobinggo-dong, Yongsan-gu, Seoul, KR | not recovered |
| 9 | 36.066547, −94.172642 | W Dickson St, Univ. of Arkansas, Fayetteville, AR | FOUND |
| 10 | 33.966808, −117.650488 | Euclid Ave, Chino, CA | listed |
| 11 | 29.909099, −89.993128 | "State Highway 407", New Orleans, LA area | listed |
| 12 | 25.684702, −80.441289 | SW 152nd Ave, Miami, FL | FOUND |
| 13 | 21.584069, −158.104211 | Kamehameha Hwy, Haleiwa, HI | listed |
| 14 | −33.90281, 151.18421 | Sydney, NSW, AU | listed |

Sources: the coordinate list mirrored in `scream314/cicada3301` (GitHub,
2012.md) and the Uncovering Cicada wiki's poster-location map; contemporary
reporting (SMH, Business Insider, Rolling Stone/Kushner) agrees on the
shape of the event. Matrices disagree on some recovery outcomes; only the
well-attested FOUNDs are marked above.

## What this means for the repo (T12.1 → viewer)

The task asked for this research to feed the US subsurface/historical
viewer. The eight US coordinates (rows 4–6, 9–13) are seeded as a
historical-network pack in the same observation schema as the comms-history
seed — `resources/historical-network/cicada-3301-poster-seed-2026-10-23.json`,
`validateEvidencePack`-clean, `captureReady: false` (citation-only). Design
notes:

- **It is a history layer, not a treasure map.** The posters were paper in
  January 2012; nothing is there now, and every row says so. Rendering
  should use the pack's `validFrom/validTo` (Jan 2012) so the points belong
  to a dated snapshot, like the ARPANET time slices.
- **Precision honesty:** coordinates are reproduced *as published* (some to
  15 decimal places — solver-transcribed false precision). The pack keeps
  them verbatim as historical artifacts with a 300 m context radius rather
  than silently rounding someone else's data.
- **No puzzle content.** QR payloads pointed onward into the puzzle; they
  are not recorded. The layer documents where the physical world was used
  as a distribution channel — the same comms-history question as the
  ARPANET/FidoNet layer, fourteen years and one internet later.

Later Cicada rounds (2013, 2014) and the still-unsolved Liber Primus are
out of scope for the layer; the identity of Cicada 3301 remains unattributed
in public sources, and repeated Cicada-signed warnings about impostor
puzzles are the reason this note sticks to the solver-documented 2012
record.

## Sources

- Uncovering Cicada wiki, *Map of all locations of 3301's posters* —
  https://uncovering-cicada.fandom.com/wiki/Map_of_all_locations_of_3301s_posters
- `scream314/cicada3301`, *2012.md* (coordinate list + addresses) —
  https://github.com/scream314/cicada3301/blob/master/2012.md
- Sydney Morning Herald (2013) and Business Insider (2013) contemporary
  reporting on the 9 Jan 2012 coordinate reveal; Kushner, *Cicada: Solving
  the Web's Deepest Mystery* (Rolling Stone, 2015)

Backlog status: T12.1's QR + lat/long research half is closed by this note
and the US seed pack; the CyberChef/cipher-machine recipe half was covered
by the recipe-corpus rounds (S10), and Hall-of-Fame lecture material
remains with S10/S12 as previously recorded.
