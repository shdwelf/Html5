# Source check — "Lost Treasure" mine record (CHEYENNE / ANGELES 4Dwm) — 2026-10-04

> **Bibliographic index:** [Source-check bibliography](source-check-bibliography.md).

Companion audit for the `lost-treasure` node in `js/cheyenne-data.js` (layer
`minesA`, Angeles National Forest plate). The question asked: *where did the
"Lost Treasure" record come from, does the source hold up, and what else does
that same source offer?*

## Where the record came from

The node was ingested in the original 2026-10-02 MRDS WFS bbox pull over the
Angeles plate (see the header of `js/cheyenne-data.js`). It is **not** a
folklore/lost-mine legend layer entry — "Lost Treasure" is simply the
registered *site name* of a USGS Mineral Resources Data System record.

- Primary source: **USGS MRDS record 10187810** —
  `https://mrdata.usgs.gov/mrds/show-mrds.php?dep_id=10187810`
  (machine twins: `/mrds/xml/10187810`, `/mrds/json/10187810`, `/mrds/kml/10187810`).

## Checked claims

| Claim in the data pack | MRDS record 10187810 says | Result |
|---|---|---|
| Name "Lost Treasure" | Current site name: Lost Treasure | Confirmed |
| Prospect status | Development status: Prospect; operation type Surface-Underground; significant: No | Confirmed |
| Commodity Ag | Commodity: Silver, importance Primary; commodity type Metallic | Confirmed |
| Coordinates −117.8117, 34.2014 | −117.81169, 34.20142 (WGS84), point of reference "Ore Body" | Confirmed (rounded 4 dp) |
| `tier: "official"` | USGS federal record; US government work | Confirmed |
| Angeles NF placement | Federal lands: Angeles National Forest (FS) | Confirmed |

Additional record facts now surfaced into the dossier story:

- **Location accuracy is 10,000 m** — the worst accuracy class on the plate.
  The point should be read as "somewhere on the Glendora quad front range,"
  not as an adit you can walk to.
- PLSS: Mount Diablo meridian, T001N R009W (no section given).
- Quadrangles: Glendora 1:24k, San Bernardino 1:100k/1:250k; San Gabriel
  hydrologic unit.
- MAS/MILS cross-id: **0060370037** (U.S. Bureau of Mines Minerals
  Availability System).
- Bibliography: **Calif. Jour. Mines and Geol., v. 50, 1954, p. 635.**
- Reporter: **James Ridenour, U.S. Bureau of Mines, 1991-03-31.**

## Grade of the source

MRDS self-grades this record **"D"** (grade-summary.php): thin, single
bibliographic reference, coarse location, no production or geology sections.
The record is authentic USGS data but low-information — exactly what the
`official` tier plus an honest dossier can carry. The 1954 California Journal
of Mines and Geology citation (California Division of Mines county report
series) was not independently retrievable online at check time; it is carried
as the record's own reference, not re-verified.

## "Create a new one from these sources"

The same source neighborhood — the MRDS near-point sweep around the Lost
Treasure coordinates
(`https://mrdata.usgs.gov/general/near-point.php?x=-117.81169&y=34.20142&d=0.03`)
— yields one sibling record that the 2026-10-02 bbox pull had not been
carried into the data pack:

- **MRDS 10260583 — "Unnamed Location"** (MRDS id **W024049**, MAS
  0060370039): gold Prospect, *same* coordinate pair −117.81169, 34.20142,
  but **±500 m accuracy**, elevation 975 m, PLSS T1N R9W **sec. 3C**, land
  status National Forest. Bibliography: **Mt. Baldy Ranger District (USFS)
  files**; reporter USBM Western Field Operations Center, 1991-03-31.
  Related MRDS records: 10076795 (San Gabriel River Placers family),
  10284857.

Added to `MINES_ANGE` as node `w024049` ("Unnamed Prospect W024049"),
tier `official`, with the co-registration caveat spelled out in the story:
two USBM/MAS records digitized to the identical coordinate pair is a known
MAS/MILS artifact, and the dossier says so rather than nudging either point.

## Boundaries retained

- No treasure-legend content was added: the record is a prosaic silver
  prospect whose *name* happens to be Lost Treasure.
- The duplicate-coordinate artifact is documented, not "fixed" — MRDS is the
  source of record and the theater quotes it verbatim.
- The 1954 CJMG page citation stays attributed to MRDS (not independently
  verified).
