# Utilities, the microwave skyway, and orbital windows

Companion to `docs/socal-radio-propagation.md`. Three registers added in the
same pass, because they are one story: Southern California imports nearly
everything it runs on, over long thin things that cross the desert, and the
only way to see the whole arrangement is from orbit.

Modules: `js/socal-utilities-data.js` (register), `js/socal-utilities.js`
(scene), `js/socal-orbital.js` (pass geometry), `test/socal-utilities.test.ts`.

---

## 1. Bulk power

### What is drawn

| Register | Count | Layer |
| --- | --- | --- |
| Substations and converter stations | 12 | `transmission` |
| Transmission corridors | 7 | `transmission` |

Conductors are draped 45 m above the terrain with lattice-tower ticks dropped
to ground, so a line reads as an overhead circuit rather than a buried one —
the opposite convention to every other corridor in this theater, which is the
point.

### Coordinates from an unlikely place

Several of the bulk substations here are located to the foot by the FAA.
Southern California Edison maintains private heliports inside Lugo, Vincent,
Devers, Serrano and Eldorado for line patrol, and heliports are public
aeronautical records with surveyed positions and published elevations:

| Station | FAA ID | Position | Elevation |
| --- | --- | --- | --- |
| Lugo | 01CA | 34-22-05.66 N 117-22-12.26 W | 3,733 ft |
| Vincent | 26CN | 34-29-12.30 N 118-06-57.23 W | 3,244 ft |
| Devers | 91CA | 33-56-23.71 N 116-34-29.50 W | 1,150 ft |
| Serrano | CL55 | 33-49-42.50 N 117-47-26.10 W | 697 ft |
| Eldorado | NV37 | 35-47-39.94 N 115-00-38.95 W | 1,800 ft |

The Eldorado record is worth a second look: a California utility's switchyard
in Nevada, owner address 801 El Dorado Valley Drive, Boulder City. That is
Path 46 in one line of an FAA database.

Where no such record exists — Mira Loma, Victorville switching, Imperial
Valley — the pin is generalized, `approx: true` is set, the tier drops to
`community` or `context`, and **the symbology changes**: approximate stations
draw a dashed ring instead of a solid one. A test enforces that no `approx`
row ever claims `official`. The evidence tier has to survive contact with the
renderer or it is decoration.

### The paths

- **Pacific DC Intertie (Path 65)** — ±500 kV, 846 miles, Celilo to Sylmar,
  3,100 MW. Exists because the Columbia runs in spring and Los Angeles
  air-conditions in summer. The Sylmar end is two stations: the 1970 west site
  and the 1989 east expansion.
- **Path 27 / Intermountain** — 2,400 MW HVDC from Delta, Utah to the Adelanto
  Converter Station, ASEA plant, commissioned July 1986, $131 million.
- **Path 26** — the Vincent-to-Midway 500 kV pair over the Tehachapis, the
  seam between Southern and Northern California, direction set by season and
  hydrology.
- **Path 46, West of the Colorado River** — fourteen lines past 10,000 MW
  combined. Eldorado–Lugo and Devers–Palo Verde are drawn.
- **Sunrise Powerlink** — 117 miles into San Diego, energized 2012.

Both HVDC links have a detail this theater is well placed to show: the
**ground electrode**. A bipole running monopolar returns its current through
the earth, so each converter has an electrode tens of kilometres away — Sylmar's
reached by an overhead electrode line ending at a dead-end tower above
Brentwood (`kenter-canyon`), Adelanto's 86 km northeast on the edge of Coyote
Lake playa. Pinning that tower is the single most obscure 500 kV-adjacent
structure in Los Angeles.

Line geometry between endpoints is generalized at the same 5–15 km accuracy as
the pipeline corridors. Endpoints are not: a test asserts each corridor starts
within 500 m of the substation it claims to leave.

---

## 2. The AT&T Long Lines microwave skyway

### What it was

A $40 million, 107-tower radio relay network inaugurated in 1951 with a
televised address by Truman, carrying long-distance telephone and network
television across the country on microwaves instead of wire. Stations sat
30–40 miles apart on mountaintops and tall buildings, with horn-reflector
antennas, a hardened equipment building, a diesel generator, bunks, fallout
provisions and a thick copper ground into bedrock. Fibre made it redundant;
AT&T sold most of it in 1999, largely to American Tower.

### What is in the register

Ten sites, with the detail that makes the Mojave the interesting part of the
network:

- **Turquoise** (35.4358 N, 115.9247 W, 50.9 m, FCC-registered) — the linchpin
  of the western network, 13 miles northwest of Baker, staffed, three floors,
  an AUTOVON switch, and ECHO FOX Ground Entry Point antennas: the
  radiotelephone path to Air Force One straight into the military network.
  Also a major television switching point before the networks moved to
  satellite. The evening news physically changed direction in the Mojave.
- **Kelso Peak** — a 50-foot type A2 lattice tower carrying four routes: north
  24 miles to Turquoise, northeast to Cima and on to Scipio, Utah, south to
  Granite Pass, southwest to Hector and on to Los Angeles. Built 1964; SCE had
  to string miles of new line out of Kelso just to power it.
- **Granite Pass, Cima, Hector** — the desert repeaters. Granite Pass is the
  honest end state of the whole network: the original AT&T tower now relays
  Verizon cell backhaul, because the path is still good and the steel gets
  re-let to whoever needs a line of sight.
- **Mojave, Baker, Corona** — the hardened junctions. Mojave grew from an end
  office into a gateway with an AUTOVON 4E; Baker was a cable station on the
  L-3I, the "first blast-resistant coast-to-coast underground communications
  cable system"; Corona is the third name people who worked the network give.
- **Topanga** and the **Los Angeles "Grande"** complex — the basin end.

### Deliberate coarseness

long-lines.net carries a standing request from AT&T Corporate Security that
the names and exact locations of *active* facilities not be published. Sites
that are or may still be live — Mojave, Corona, the downtown complex — are
pinned to a town or a block and flagged `approx`, and say so in their own
dossier text. This is a documentation-hygiene decision, not a technical one,
and it is recorded here so nobody later "improves" the coordinates.

### The payoff: every hop is a live path budget

Each hop is run through `analyzePath()` from `js/socal-propagation.js` — the
same core the broadcast layer uses — at its actual carrier frequency (4, 6 or
11 GHz), and coloured by the result:

- **teal** — geometrically clear *and* 0.6 of the first Fresnel zone clear: a
  hop you could commission
- **amber** — line of sight, but Fresnel-obstructed, with the obstruction loss
  quoted
- **red** — blocked, with the controlling obstruction's distance
- **grey** — an inferred link, not a documented one

Terminal heights are pinned to the **published site elevations**, not to the
elevation field: we know what those summits are, we just do not yet know the
ground between them. Letting the synthetic gaussian surface set the tower
bases sinks every hilltop station a few hundred metres and reports the whole
network as blocked — an artefact of the terrain model masquerading as a
finding. That substitution is the single most important line in
`hopAnalysis()` and it goes away the day a real 3DEP grid is installed.

`MAX_PLAUSIBLE_HOP_KM = 80` exists because a horn on a 50 m tower against the
earth's curvature is a 30–60 km instrument. Any "link" longer than that was
several hops through stations not in this register, and a test enforces it.
The nice part is that the geometry and the history agree about what a
microwave hop can be, without being told.

---

## 3. Orbital windows

Minimal on purpose. `js/socal-orbital.js` carries no SGP4, no TLE and no
network, because none of those survive in an offline `.xdc` package. What it
does carry is the geometry that is stable for a sun-synchronous
repeat-ground-track mission, which is most of what you want when you are
standing in the frame looking up.

### What is derived, and is trustworthy

**Local solar time at this latitude.** For a sun-synchronous orbit,

```
LMST(φ) = LMST(node) + Δλ/15°,    Δλ = atan2(cos i · sin u, cos u)
```

where `u` is the argument of latitude from the relevant node and
`sin φ = sin i · sin u`. The Earth-rotation terms cancel exactly — the
satellite's longitude drifts west at precisely the rate the clock does — which
is the small piece of algebra that makes this worth shipping. For Landsat 9
(10:12 descending at the equator) at 34.6 °N it gives **10:35 local**,
i.e. ~18:26 UTC, which is where real Landsat scenes over Los Angeles land.

**Ground-track heading,** including the Earth-rotation correction:
**347° ascending, 193° descending** over this frame. Both lean west by the
same angle, so ascending and descending tracks cross at about 26° — the X
pattern on every SAR coverage map. A sign error here is the classic mistake
(a descending track leaning southeast); there is a test for it.

**Swath width and repeat cycle,** which are mission constants:

| Platform | Band | Altitude | Repeat | Node | Swath |
| --- | --- | --- | --- | --- | --- |
| Sentinel-1A | C 5.405 GHz | 693 km | 12 d | 18:00 asc | 250 km |
| Sentinel-1C | C 5.405 GHz | 693 km | 12 d | 18:00 asc | 250 km |
| NISAR | L 1.257 GHz + S 3.2 GHz | 747 km | 12 d | 18:00 asc | 240 km |
| Landsat 9 | OLI-2 / TIRS-2 | 705 km | 16 d | 10:12 desc | 185 km |
| Landsat 8 | OLI / TIRS | 705 km | 16 d | 10:11 desc | 185 km |

### What is nominal, and says so

The **calendar date** of the next pass. A repeat-ground-track orbit recurs on
an exact cycle, so the date arithmetic is trivial *once you know one true
pass*. `cycleAnchorUtc` is declared nominal, the window list says so in its own
last line, and every window object carries `nominal: true`. Re-anchor one
constant per satellite to one observed acquisition — a Landsat scene ID or a
Sentinel-1 product filename both contain it — and every date becomes real.
That is the documented upgrade path, and it is one line per platform.

### What is drawn

Three lines: the ground track through the frame centre and the two swath
edges, dashed, floating 900 m above the terrain so they clear the ridges. The
interesting part of an overpass is *when*, *which way*, and *how wide* — not a
model of a spacecraft. The swath edges are offset at each sample using that
sample's own latitude, because offsetting once at the frame centre puts the
edge several kilometres out by the top of the frame, and the edge is the one
number the layer exists to show.

### Why these five

The existing `sar` overlay already documents Sentinel-1's 250 km IW swath and
NISAR's millimetre-scale deformation sensitivity over the Antelope Valley
aquifer and the San Andreas. The orbital layer answers the next question —
*when does it come back* — and makes the pairing with the InSAR deformation
bowls explicit: a 12-day interferogram is two of these windows.

---

## 4. Still open

- Re-anchor `cycleAnchorUtc` for each platform to a real acquisition, and note
  the source in the data row.
- Relative-orbit / WRS-2 path awareness: the frame is covered by several
  distinct tracks per cycle, each with its own incidence angle, and the layer
  currently draws one.
- Sentinel-2, and the commercial SAR constellations (ICEYE, Capella) whose
  revisit is measured in hours.
- Transmission line geometry from a real source. CEC and HIFLD publish
  transmission GIS; the corridors here are reading lines.
- Substation one-line detail: bus voltages, transformer counts, and which
  circuits actually terminate where.
- The rest of the Long Lines network inside the frame — Hall Canyon, Oat
  Mountain, the Los Angeles 07 and 09 sites, Blythe — and the FCC callsign
  listings that would let each hop be verified rather than inferred.
