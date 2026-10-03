/**
 * SOCAL SUBSURFACE — utilities and the microwave skyway.
 *
 * Three registers in one pack, because they are the same story told three
 * times: Southern California imports almost everything it runs on, over
 * long thin things that cross the desert.
 *
 *   SUBSTATIONS      bulk power nodes — 500 kV switchyards and HVDC converters
 *   TRANSMISSION     the WECC paths between them, generalized polylines
 *   LONGLINES        AT&T Long Lines microwave relay stations, 1951-1990s
 *   LONGLINE_HOPS    the radio paths between those stations
 *
 * Evidence tiers follow the rest of the theater:
 *   official   — agency / operator record (FAA heliport data, FCC ULS, utility filing)
 *   community  — well-documented public or secondary sourcing
 *   context    — generalized pin or schematic alignment, shape only
 *
 * A note on coordinates. Several of the bulk substations in this frame are
 * located to the foot by an unlikely source: the FAA's airport database. SCE
 * maintains private heliports inside Lugo, Vincent, Devers, Serrano and
 * Eldorado for line patrol, and heliports are public aeronautical records with
 * surveyed positions. Where that exists, `positionSource` says so and the row
 * is `official`. Where it does not, the pin is marked `approx: true` and the
 * tier drops. Nothing here is a survey alignment or a dig ticket.
 *
 * On Long Lines: long-lines.net carries a standing request from AT&T Corporate
 * Security that the names and exact locations of *active* network facilities
 * not be published. Every site in this register is either decommissioned, sold
 * (most went to American Tower in 1999), or located from an independent public
 * record such as the FCC tower database. Sites believed still active are
 * pinned coarsely and flagged.
 */

export const UTILITY_SOURCE_URLS = [
  "https://www.airnav.com/airports/ — FAA airport/heliport records (substation helipad coordinates)",
  "https://www.wecc.org/ — Western Electricity Coordinating Council path ratings",
  "https://en.wikipedia.org/wiki/Pacific_DC_Intertie",
  "https://en.wikipedia.org/wiki/Path_26",
  "https://en.wikipedia.org/wiki/Path_27",
  "https://en.wikipedia.org/wiki/Path_46",
  "https://en.wikipedia.org/wiki/Adelanto_Converter_Station",
  "https://www.sce.com/sites/default/files/inline-files/SCE_LocalCapacityAreaSubstationList.pdf",
  "https://www.long-lines.net/places-routes/ — AT&T Long Lines places and routes",
  "http://www.drgibson.com/towers/turquoise.html — Turquoise site documentation",
  "https://computer.rip/2022-02-14-long-lines-in-the-Mojave.html — Mojave route history",
  "https://www.city-data.com/towers/ — FCC registered tower extracts",
];

/* --------------------------------------------------------------- classes */

/** Conductor classes, coloured the way utility one-lines colour them. */
export const CIRCUIT_CLASSES = {
  hvdc: { id: "hvdc", name: "HVDC bipole", color: "#f43f5e", width: 0.055 },
  kv500: { id: "kv500", name: "500 kV AC", color: "#fbbf24", width: 0.045 },
  kv230: { id: "kv230", name: "230 kV AC", color: "#60a5fa", width: 0.032 },
};

/** Station classes. */
export const STATION_CLASSES = {
  converter: { id: "converter", name: "HVDC converter station", color: "#f43f5e" },
  switchyard: { id: "switchyard", name: "Bulk 500 kV switchyard", color: "#fbbf24" },
  receiving: { id: "receiving", name: "Receiving / distribution station", color: "#60a5fa" },
  electrode: { id: "electrode", name: "Ground electrode terminal", color: "#a3e635" },
};

/* ----------------------------------------------------------- substations */

export const SUBSTATIONS = [
  {
    id: "sylmar-east",
    name: "Sylmar East Converter Station",
    cls: "converter",
    lon: -118.48139,
    lat: 34.31167,
    elevM: 390,
    operator: "LADWP (jointly owned, five utilities)",
    tier: "official",
    positionSource: "Pacific DC Intertie south terminal coordinate, 34°18′42″N 118°28′53″W",
    facts: [
      "South end of the Pacific DC Intertie: ±500 kV DC in from Celilo, Oregon, 1,361 km up the line, inverted here to 230 kV AC and phase-locked to the Los Angeles grid.",
      "3,100 MW in bipolar mode — roughly a third of the city's peak load arriving on two conductors.",
      "Built out in stages: 1970 at ±400 kV, 1984 to ±500 kV, 1989 the east site added two 1,100 MW 12-pulse thyristor groups in parallel with the originals.",
      "The 1971 Sylmar earthquake wrecked the original converter equipment; the station is the reason seismic qualification of HVDC valve halls is a design discipline.",
    ],
    sources: ["Wikipedia — Pacific DC Intertie / Sylmar Converter Station", "LADWP system descriptions"],
  },
  {
    id: "sylmar-west",
    name: "Sylmar West Converter Station",
    cls: "converter",
    lon: -118.48694,
    lat: 34.30889,
    elevM: 385,
    operator: "LADWP / SCE",
    tier: "official",
    positionSource: "Pacific DC Intertie west site coordinate, 34°18′32″N 118°29′13″W",
    facts: [
      "The original 1970 converter site, west of the highway; the 1989 expansion built Sylmar East on the field opposite.",
      "Two six-pulse thyristor valve groups per pole were added in 1985 to take the line from ±400 kV to ±500 kV.",
    ],
    sources: ["Wikipedia — Pacific DC Intertie"],
  },
  {
    id: "kenter-canyon",
    name: "Kenter Canyon electrode line terminal tower",
    cls: "electrode",
    lon: -118.488472,
    lat: 34.0680528,
    elevM: 220,
    operator: "LADWP",
    tier: "official",
    positionSource: "Dead-end tower coordinate, 34°04′05″N 118°29′19″W",
    facts: [
      "End of the Pacific DC Intertie's overhead electrode line, which runs ~48 km from the converter station to a sea electrode.",
      "An HVDC bipole in monopolar operation returns its current through the earth and the ocean; the electrode line is that return path, strung where the ground wires would normally be.",
      "This is the least-known 500 kV-adjacent structure in Los Angeles: a dead-end tower above Brentwood whose job is to let the ground carry 1,600 amps.",
    ],
    sources: ["Wikipedia — Pacific DC Intertie (electrode line)"],
  },
  {
    id: "adelanto",
    name: "Adelanto Converter Station",
    cls: "converter",
    lon: -117.43722,
    lat: 34.55111,
    elevM: 920,
    operator: "LADWP",
    tier: "official",
    positionSource: "Published station coordinate, 34°33′04″N 117°26′14″W",
    facts: [
      "South terminus of Path 27, the Intermountain / Southern Transmission System HVDC line from the Intermountain Power Plant near Delta, Utah.",
      "2,400 MW over 488 miles; redundant thyristor converters rated 1,200 MW continuous, 1,600 MW on overload. ASEA plant, commissioned July 1986, $131 million on 300 acres.",
      "Ties onward at 500 kV AC to Marketplace (Nevada) via Path 64, to Victorville switching twice, and west to Toluca and Rinaldi in the San Fernando Valley.",
      "Its ground electrode is 86 km northeast, on the edge of Coyote Lake playa — the same trick as Sylmar's, out where nobody lives.",
    ],
    sources: ["Wikipedia — Adelanto Converter Station", "Wikipedia — Path 27"],
  },
  {
    id: "lugo",
    name: "Lugo Substation",
    cls: "switchyard",
    lon: -117.3700722,
    lat: 34.3682389,
    elevM: 1138,
    operator: "Southern California Edison",
    tier: "official",
    positionSource: "FAA 01CA Lugo Substation Heliport, 34-22-05.66N 117-22-12.26W, elev 3,733 ft",
    facts: [
      "One of SCE's key bulk stations and the hinge of the desert grid: 500 kV to Vincent (two circuits), to Victorville, to Eldorado and to Mohave.",
      "Everything imported from the Colorado River and the Nevada plants west of the river — Path 46 — lands here or at its neighbours.",
      "The station sits just northeast of Cajon Pass near Hesperia, which is also where the CALNEV products line, the BNSF and UP mains, the SWP East Branch and I-15 all thread the same gap.",
      "Position is the FAA record for SCE's line-patrol helipad inside the yard.",
    ],
    sources: ["FAA/AirNav 01CA", "Wikipedia — Path 46 / Path 61", "San Bernardino County High Desert Corridor transmission analysis"],
  },
  {
    id: "vincent",
    name: "Vincent Substation",
    cls: "switchyard",
    lon: -118.1158972,
    lat: 34.48675,
    elevM: 989,
    operator: "Southern California Edison",
    tier: "official",
    positionSource: "FAA 26CN Vincent Substation Heliport, 34-29-12.30N 118-06-57.23W, elev 3,244 ft",
    facts: [
      "North end of Path 26 — the 500 kV Vincent-to-Midway pair that moves power between Southern and Northern California, rated in the thousands of megawatts and flipped in direction by the season.",
      "Two more 500 kV circuits leave southeast for Lugo, which is how Path 26 and Path 46 are tied together.",
      "Sits beside State Route 14 at Soledad Pass near Acton — the same pass the Southern Pacific used to get out of the Los Angeles basin.",
      "Position is the FAA record for the substation's helipad.",
    ],
    sources: ["FAA/AirNav 26CN", "Wikipedia — Path 26"],
  },
  {
    id: "devers",
    name: "Devers Substation",
    cls: "switchyard",
    lon: -116.5748611,
    lat: 33.9399194,
    elevM: 350,
    operator: "Southern California Edison",
    tier: "official",
    positionSource: "FAA 91CA Devers Substation Heliport, 33-56-23.71N 116-34-29.50W, elev 1,150 ft",
    facts: [
      "West end of Devers–Palo Verde No. 1 and No. 2, the 500 kV lines that bring Arizona nuclear and desert solar across the Colorado River.",
      "Series capacitor stations between Devers and Red Bluff — 'Cal Caps' — compensate the line's reactance; the Arizona equivalents are the 'AZ Caps'.",
      "North of Interstate 10 at the mouth of San Gorgonio Pass, in the middle of the wind resource area: the pass is simultaneously a wind farm, a transmission corridor, a rail main and a gas main.",
      "Position is the FAA record for the substation's helipad.",
    ],
    sources: ["FAA/AirNav 91CA", "Wikipedia — Path 46"],
  },
  {
    id: "serrano",
    name: "Serrano Substation",
    cls: "switchyard",
    lon: -117.7905833,
    lat: 33.8284722,
    elevM: 212,
    operator: "Southern California Edison",
    tier: "official",
    positionSource: "FAA CL55 SCE Serrano Substation Heliport, 33-49-42.50N 117-47-26.10W, elev 697 ft",
    facts: [
      "500/230 kV bulk station at the north end of Orange County, under the Santiago Peak skyline the broadcast and land-mobile sites occupy.",
      "Serrano is one of the load-side terminations of the desert import paths: power that enters at Devers or Lugo is handed down to distribution here.",
      "Position is the FAA record for the substation's helipad.",
    ],
    sources: ["FAA/AirNav CL55", "SCE local capacity area substation list"],
  },
  {
    id: "eldorado",
    name: "Eldorado Substation",
    cls: "switchyard",
    lon: -115.0108192,
    lat: 35.7944267,
    elevM: 549,
    operator: "Southern California Edison (in Nevada)",
    tier: "official",
    positionSource: "FAA NV37 Eldorado Substation Heliport, 35-47-39.94N 115-00-38.95W, elev 1,800 ft",
    facts: [
      "In Eldorado Valley, Nevada — a California utility's switchyard on the far side of the state line, which is the whole point of Path 46.",
      "Eldorado–Lugo runs at 500 kV plus two 230 kV circuits; Marketplace and McCullough are its neighbours in the same desert.",
      "Position is the FAA record for SCE's helipad at the station; the owner address on file is literally 801 El Dorado Valley Drive, Boulder City.",
    ],
    sources: ["FAA/AirNav NV37", "Wikipedia — Path 46"],
  },
  {
    id: "mira-loma",
    name: "Mira Loma Substation",
    cls: "receiving",
    lon: -117.545,
    lat: 34.005,
    elevM: 240,
    operator: "Southern California Edison",
    approx: true,
    tier: "community",
    positionSource: "generalized pin in the Mira Loma / Jurupa district — no public surveyed coordinate used",
    facts: [
      "A 500/220/66 kV 'A' station: the SCE local capacity area list hangs dozens of 'B' substations off it — Archibald, Bain, Anoroc and the rest of the Inland Empire.",
      "Site of the 20 MW / 80 MWh Tesla Powerpack installation energized in January 2017 after the Aliso Canyon gas leak, briefly the largest lithium-ion storage plant in the world.",
      "Pin is generalized. The yard is large and no official point coordinate was used for it.",
    ],
    sources: ["SCE local capacity area substation list", "contemporary reporting on the Mira Loma storage project"],
  },
  {
    id: "victorville-sw",
    name: "Victorville Switching Station",
    cls: "switchyard",
    lon: -117.3,
    lat: 34.54,
    elevM: 880,
    operator: "LADWP / SCE",
    approx: true,
    tier: "context",
    positionSource: "generalized pin near Victorville — schematic node for Path 61 and the Adelanto ties",
    facts: [
      "Path 61 is the Victorville–Lugo 500 kV line; the Adelanto converter feeds Victorville on two 500 kV circuits.",
      "Together with Lugo and Kramer this is the switching triangle that makes the Victor Valley the electrical crossroads of the Mojave.",
      "Schematic pin only.",
    ],
    sources: ["Wikipedia — Path 27 / Path 61", "San Bernardino County High Desert Corridor transmission analysis"],
  },
  {
    id: "imperial-valley-sub",
    name: "Imperial Valley Substation",
    cls: "switchyard",
    lon: -115.572,
    lat: 32.73,
    elevM: -10,
    operator: "SDG&E / IID interconnection",
    approx: true,
    tier: "context",
    positionSource: "generalized pin west of El Centro",
    facts: [
      "West end of the North Gila–Imperial Valley 500 kV line, the southern member of Path 46, and the east end of the Sunrise Powerlink.",
      "Sits in the geothermal and solar field of the Imperial Valley, below sea level, next to the Salton Sea brine resource the theater's `power` layer already pins.",
      "Schematic pin only.",
    ],
    sources: ["Wikipedia — Path 46", "CPUC Sunrise Powerlink record"],
  },
];

export const SUBSTATION_BY_ID = new Map(SUBSTATIONS.map((s) => [s.id, s]));

/* ---------------------------------------------------------- transmission */

/**
 * Transmission corridors. Endpoints are the substations above; the shape
 * between them is a generalized reading line at roughly 5–15 km accuracy,
 * same discipline as the pipeline corridors in socal-subsurface-data.js.
 */
export const TRANSMISSION = [
  {
    id: "pdci",
    name: "Pacific DC Intertie (Path 65) — California reach",
    short: "PDCI · ±500 kV",
    cls: "hvdc",
    operator: "LADWP / BPA",
    ratingMw: 3100,
    tier: "context",
    path: [
      [-118.05, 38.35], [-118.22, 37.95], [-118.15, 37.5], [-117.95, 37.0], [-117.85, 36.5],
      [-117.9, 36.0], [-118.0, 35.5], [-118.12, 35.05], [-118.25, 34.72], [-118.4, 34.45],
      [-118.48694, 34.30889],
    ],
    facts: [
      "846 miles of two conductors from Celilo, Oregon to Sylmar, carrying 3,100 MW at ±500 kV — the largest single transfer into Los Angeles.",
      "The line exists because the Columbia runs in spring and Los Angeles air-conditions in summer: it is a seasonal trade in both directions, sold as surplus hydro north-to-south and surplus thermal south-to-north.",
      "DC over this distance beats AC because there is no charging current and no stability limit — only converter losses at each end.",
      "Alignment through the frame is schematic; it is drawn to read as the north-south import corridor, not surveyed.",
    ],
    sources: ["Wikipedia — Pacific DC Intertie", "WECC path ratings"],
  },
  {
    id: "path26",
    name: "Path 26 — Vincent to Midway 500 kV",
    short: "Path 26 · 500 kV ×2",
    cls: "kv500",
    operator: "Southern California Edison / PG&E",
    ratingMw: 4000,
    tier: "context",
    path: [
      [-118.1158972, 34.48675], [-118.38, 34.72], [-118.62, 34.92], [-118.85, 35.08],
      [-119.1, 35.2], [-119.32, 35.31], [-119.45, 35.38],
    ],
    facts: [
      "The seam between Southern and Northern California: two 500 kV circuits over the Tehachapis between Vincent and Midway near Buttonwillow.",
      "Flow reverses with the season and with hydrology — north in a hot southern summer, south in a wet northern spring.",
      "Drawn as a generalized alignment over the pass.",
    ],
    sources: ["Wikipedia — Path 26", "WECC path ratings"],
  },
  {
    id: "vincent-lugo",
    name: "Vincent – Lugo 500 kV (two circuits)",
    short: "Vincent–Lugo · 500 kV",
    cls: "kv500",
    operator: "Southern California Edison",
    ratingMw: 3000,
    tier: "context",
    path: [
      [-118.1158972, 34.48675], [-117.95, 34.52], [-117.72, 34.5], [-117.55, 34.44],
      [-117.3700722, 34.3682389],
    ],
    facts: [
      "Two 500 kV circuits across the Antelope Valley margin, tying Path 26 at Vincent to Path 46 at Lugo.",
      "Near Llano these share a corridor with LADWP's Rinaldi–Adelanto pair, then split southeast; the crossings with the Hoover–Victorville 287 kV line and I-15 are all inside a few kilometres.",
    ],
    sources: ["Wikipedia — Path 26 (connecting wires to Path 46)"],
  },
  {
    id: "lugo-eldorado",
    name: "Eldorado – Lugo 500 kV",
    short: "Eldorado–Lugo · 500 kV",
    cls: "kv500",
    operator: "Southern California Edison",
    ratingMw: 1500,
    tier: "context",
    path: [
      [-117.3700722, 34.3682389], [-117.0, 34.5], [-116.55, 34.72], [-116.1, 34.95],
      [-115.7, 35.22], [-115.35, 35.5], [-115.0108192, 35.7944267],
    ],
    facts: [
      "Part of Path 46, West of the Colorado River — fourteen lines whose combined rating runs past 10,000 MW.",
      "Roughly parallels the I-15 corridor across the Mojave, through the same desert as the Long Lines microwave route and the UP Cima Subdivision.",
      "Just south of I-40 the Mohave–Lugo line splits off this alignment and turns east.",
    ],
    sources: ["Wikipedia — Path 46"],
  },
  {
    id: "adelanto-rinaldi",
    name: "Adelanto – Rinaldi / Toluca 500 kV",
    short: "Adelanto–Rinaldi · 500 kV",
    cls: "kv500",
    operator: "LADWP",
    ratingMw: 2400,
    tier: "context",
    path: [
      [-117.43722, 34.55111], [-117.75, 34.56], [-118.05, 34.52], [-118.3, 34.42],
      [-118.47, 34.32],
    ],
    facts: [
      "How Utah coal, and now Utah hydrogen-ready gas, reaches the San Fernando Valley: Path 27 arrives as DC at Adelanto and leaves as 500 kV AC to Rinaldi and Toluca.",
      "The Intermountain Power Project is Los Angeles's out-of-state power plant — municipally owned, 800 km away, converted to gas in 2025.",
    ],
    sources: ["Wikipedia — Path 27 / Adelanto Converter Station"],
  },
  {
    id: "devers-palo-verde",
    name: "Devers – Palo Verde 500 kV (to the Colorado River)",
    short: "DPV1 · 500 kV",
    cls: "kv500",
    operator: "Southern California Edison",
    ratingMw: 1600,
    tier: "context",
    path: [
      [-116.5748611, 33.9399194], [-116.2, 33.82], [-115.7, 33.72], [-115.2, 33.62],
      [-114.6, 33.52], [-114.05, 33.48],
    ],
    facts: [
      "Runs north of and roughly parallel to Interstate 10 from San Gorgonio Pass to the river, on its way to the Palo Verde nuclear plant west of Phoenix.",
      "DPV2, approved 2007, added the Colorado River and Red Bluff substations to collect desert solar at 230 kV and step it up.",
      "The series capacitor yards between Devers and Red Bluff are the 'Cal Caps'.",
    ],
    sources: ["Wikipedia — Path 46"],
  },
  {
    id: "sunrise-powerlink",
    name: "Sunrise Powerlink — Imperial Valley to the coast",
    short: "Sunrise · 500/230 kV",
    cls: "kv500",
    operator: "San Diego Gas & Electric",
    ratingMw: 1000,
    tier: "context",
    path: [
      [-115.572, 32.73], [-116.0, 32.78], [-116.35, 32.84], [-116.62, 32.88],
      [-116.85, 32.95], [-117.05, 32.92],
    ],
    facts: [
      "117 miles, energized 2012, after one of the most litigated transmission approvals in California history — routed out of Anza-Borrego at the cost of a tunnel and a lot of money.",
      "Built to move Imperial Valley geothermal and solar to San Diego; also the line that lets San Diego survive the loss of San Onofre.",
    ],
    sources: ["CPUC Sunrise Powerlink proceeding", "SDG&E project record"],
  },
];

/* -------------------------------------------------- AT&T Long Lines sites */

/**
 * Microwave relay stations of the AT&T Long Lines network inside this frame.
 *
 * `hornBand` is the carrier family the horns were cut for: TD-2 at 4 GHz was
 * the backbone system, TH at 6 GHz and TM/TJ at 11 GHz came later. `hardened`
 * marks the sites built to keep running through a nuclear exchange — thick
 * concrete, fallout shelter, diesel, water, and a deep copper ground.
 */
export const LONGLINES = [
  {
    id: "ll-turquoise",
    name: "Turquoise",
    lon: -115.9247,
    lat: 35.4358,
    elevM: 1310,
    structureM: 50.9,
    callSigns: ["KMJ91", "WHO218", "KMM97"],
    hornBand: "4 / 6 / 11 GHz",
    hardened: true,
    staffed: true,
    status: "sold — American Tower, still an antenna farm",
    tier: "official",
    positionSource: "FCC tower records for Turquoise Mountain, 35.435806 N 115.924722 W, overall height 50.9 m",
    facts: [
      "The linchpin of the western Long Lines network: a staffed, three-floor mountaintop junction about 13 miles northwest of Baker, reached off the Halloran Springs exit.",
      "Connected four major routes — the east-west circuit along what is now I-40, the north-south circuit up through Las Vegas to Salt Lake, a backup circuit to Los Angeles, and local independent telephone companies.",
      "Carried an AUTOVON switch and ECHO FOX Ground Entry Point antennas: the radiotelephone path to Air Force One, straight into the military network, for use in a nuclear emergency.",
      "Was a major switching point for the television networks before they moved to satellite — the Mojave is where the evening news physically changed direction.",
    ],
    sources: ["drgibson.com — Turquoise site", "computer.rip — long lines in the Mojave", "FCC tower records via city-data extract"],
  },
  {
    id: "ll-kelso-peak",
    name: "Kelso Peak",
    lon: -115.7759,
    lat: 35.1038,
    elevM: 1290,
    structureM: 15.2,
    callSigns: ["WPNJ838"],
    hornBand: "4 / 6 / 11 GHz",
    hardened: false,
    staffed: false,
    status: "turned down — waveguide stripped, tower reused for PCS",
    tier: "community",
    positionSource: "FCC tower record 'KELSO, E of I-15' 35.103806 N 115.775917 W; site description from long-lines.net",
    facts: [
      "A route-crossing auxiliary repeater on a 50-foot type A2 steel lattice tower, inside what is now Mojave National Preserve.",
      "Four paths off one small tower: north 24 miles to Turquoise, northeast to Cima and on to Scipio, Utah, south to Granite Pass and on to Ranger, and southwest to Hector and on to Los Angeles.",
      "Built in 1964. Southern California Edison had to string miles of new line out of Kelso just to power it and Granite Pass; Kelso itself had only had grid power for a few years.",
      "Turned down and stripped of its outdoor copper waveguide, but the tower lives on carrying PCS antennas.",
    ],
    sources: ["long-lines.net — Kelso Peak, CA", "computer.rip — long lines in the Mojave"],
  },
  {
    id: "ll-cima",
    name: "Cima",
    lon: -115.41,
    lat: 35.238,
    elevM: 1420,
    structureM: 30,
    hornBand: "4 / 6 GHz",
    hardened: false,
    staffed: false,
    approx: true,
    status: "partly reused",
    tier: "context",
    positionSource: "described as five miles due east of the town of Cima; pin derived from that description",
    facts: [
      "Relay on the hill east of Cima, passing traffic northeast toward a Nevada station called Beer Bottle on the way to Las Vegas.",
      "At the town below, a Union Pacific radio tower handles train communications on the Cima Subdivision — the same ridge serving two completely different networks.",
      "Pin is derived from a written description, not a record.",
    ],
    sources: ["computer.rip — long lines in the Mojave", "long-lines.net route descriptions"],
  },
  {
    id: "ll-granite-pass",
    name: "Granite Pass",
    lon: -115.667,
    lat: 34.803,
    elevM: 1250,
    structureM: 30,
    hornBand: "4 / 6 GHz",
    hardened: false,
    staffed: false,
    approx: true,
    status: "original tower reused by Verizon backhaul; AT&T on a newer tower opposite",
    tier: "context",
    positionSource: "Kelbaker Road at Granite Pass; pin from route description",
    facts: [
      "On the Kelso Peak–Ranger leg, at the pass on Kelbaker Road through the Granite Mountains.",
      "The original AT&T tower on the east side of the road now relays Verizon Wireless cell backhaul; a newer AT&T tower and enclosure on the west side still carries telephone service.",
      "That is the honest end state of this network: the paths are still good, so the steel gets re-let to whoever needs a line of sight.",
    ],
    sources: ["computer.rip — long lines in the Mojave"],
  },
  {
    id: "ll-hector",
    name: "Hector",
    lon: -116.43,
    lat: 34.79,
    elevM: 600,
    structureM: 30,
    hornBand: "4 GHz",
    hardened: false,
    staffed: false,
    approx: true,
    status: "abandoned / access road in poor condition",
    tier: "context",
    positionSource: "described as the relay nearest Ludlow on the Kelso Peak–Los Angeles leg; generalized pin",
    facts: [
      "The lonely hop between Kelso Peak and the Los Angeles basin, out on the lava field between Barstow and Ludlow.",
      "long-lines.net notes the access road is in very bad shape, which is the usual fate of a site nobody needs to visit.",
      "Generalized pin.",
    ],
    sources: ["long-lines.net — Kelso Peak, CA (route description)"],
  },
  {
    id: "ll-mojave",
    name: "Mojave (hardened AUTOVON site)",
    lon: -118.174,
    lat: 35.053,
    elevM: 844,
    structureM: 40,
    hornBand: "4 / 6 GHz",
    hardened: true,
    staffed: true,
    approx: true,
    status: "repurposed",
    tier: "community",
    positionSource: "town of Mojave; exact facility location not published — generalized pin",
    facts: [
      "An end office that grew into a gateway: underground, hardened, and equipped with an AUTOVON 4E switch serving the defence network across the western desert.",
      "AUTOVON — the Automatic Voice Network — was the Defense Department's survivable phone system, with its own precedence levels up to FLASH OVERRIDE and its famous four extra red keys.",
      "Pinned to the town, not the building. Facility-exact locations for sites that may still be active are deliberately not published.",
    ],
    sources: ["long-lines.net — Mojave, CA (by Daryl Gibson)", "engineeringradio.us comment thread on western AUTOVON 4Es"],
  },
  {
    id: "ll-baker",
    name: "Baker (hardened cable station)",
    lon: -116.072,
    lat: 35.267,
    elevM: 280,
    structureM: 20,
    hornBand: "cable station with radio",
    hardened: true,
    staffed: false,
    approx: true,
    status: "decommissioned",
    tier: "community",
    positionSource: "town of Baker; generalized pin",
    facts: [
      "A hardened underground station on the L-3I coaxial cable — the 'first blast-resistant coast-to-coast underground communications cable system'.",
      "The cable and the microwave route were built as alternates for each other: bury one, put the other on mountaintops, and hope not to lose both.",
      "Generalized pin.",
    ],
    sources: ["long-lines.net — Baker, CA (by Michael W. Jacobs)"],
  },
  {
    id: "ll-topanga",
    name: "Topanga (Stunt Road)",
    lon: -118.638374,
    lat: 34.083967,
    elevM: 700,
    structureM: 40,
    hornBand: "4 / 6 GHz",
    hardened: true,
    staffed: false,
    status: "abandoned tower, visible from Stunt Road",
    tier: "community",
    positionSource: "published site coordinate 34.083967 N 118.638374 W",
    facts: [
      "The Santa Monica Mountains relay: foot-thick concrete at the base, thick copper grounds into bedrock, fallout showers, generators and bunks — built to keep talking through a war.",
      "Linked Los Angeles 09 (Richmond), Los Angeles 07 (Airport) and Hall Canyon toward Ventura.",
      "One of the seventy California towers Spencer Harding photographed for *The Long Lines* after AT&T sold most of the network in 1999.",
    ],
    sources: ["Roadtrippers/Atlas-style site register", "Wired — The Abandoned Microwave Towers That Once Linked the US", "99% Invisible — Vintage Skynet"],
  },
  {
    id: "ll-la-grande",
    name: "Los Angeles 'Grande' — Madison Complex",
    lon: -118.2525,
    lat: 34.0516,
    elevM: 100,
    structureM: 60,
    hornBand: "4 / 6 / 11 GHz",
    hardened: true,
    staffed: true,
    approx: true,
    status: "active carrier hotel — still a network facility",
    tier: "community",
    positionSource: "downtown Los Angeles AT&T switching complex; block-level pin only",
    facts: [
      "The downtown terminus: horn antennas on the roof of a windowless switching building, the point where the microwave skyway became wire and went into the city.",
      "Still an operating network facility, so it is pinned at block level and no more. AT&T Corporate Security's standing request on long-lines.net is that active facility locations not be published.",
      "Its counterpart tower sites — Richmond (LA 09), Airport (LA 07) — are the other half of the local mesh.",
    ],
    sources: ["long-lines.net — Los Angeles Grande complex (by Mark Foster)"],
  },
  {
    id: "ll-corona",
    name: "Corona (underground junction)",
    lon: -117.57,
    lat: 33.87,
    elevM: 260,
    structureM: 30,
    hornBand: "4 / 6 GHz",
    hardened: true,
    staffed: true,
    approx: true,
    status: "believed still in service",
    tier: "context",
    positionSource: "Corona area; exact location deliberately not resolved",
    facts: [
      "One of the three Southern California underground junction sites people who worked the network name without hesitation: Corona, Mojave, and a cable station near Baker.",
      "Underground sites went where major routes crossed, near military installations and defence contractors, and strategically outside major cities. Corona is all three at once.",
      "Deliberately coarse pin.",
    ],
    sources: ["long-lines.net — Corona, CA (by Mark Foster)", "r/longlines practitioner accounts"],
  },
];

export const LONGLINE_BY_ID = new Map(LONGLINES.map((s) => [s.id, s]));

/**
 * Documented hops. These are the ones named in the site descriptions, not a
 * reconstruction of the whole network — if a path is here, someone wrote down
 * that those two towers pointed at each other.
 *
 * Antenna centreline heights are taken as 0.8 of structure height where no
 * figure is published, which is where the top horn deck usually sat.
 */
export const LONGLINE_HOPS = [
  { from: "ll-turquoise", to: "ll-kelso-peak", band: 4, documented: true, note: "24 miles, the north leg off Kelso Peak's lower deck" },
  { from: "ll-kelso-peak", to: "ll-cima", band: 6, documented: true, note: "northeast toward Beer Bottle, Nevada and on to Scipio, Utah" },
  { from: "ll-kelso-peak", to: "ll-granite-pass", band: 4, documented: true, note: "south on the route to Ranger" },
  { from: "ll-kelso-peak", to: "ll-hector", band: 4, documented: true, note: "southwest, the long leg toward Los Angeles" },
  { from: "ll-topanga", to: "ll-la-grande", band: 6, documented: true, note: "Santa Monica Mountains into the downtown complex, alongside the Los Angeles 07 and 09 paths" },
  { from: "ll-turquoise", to: "ll-baker", band: 6, documented: false, note: "inferred link between the mountaintop junction and the L-3I cable station below it" },
  { from: "ll-corona", to: "ll-la-grande", band: 6, documented: false, note: "inferred: inland underground junction to the downtown complex" },
];

/**
 * Deliberately NOT in the hop list: anything over about 80 km. Real TD-2 and
 * TH hops ran 30 to 60 km, which is what a horn on a 50 m tower buys you
 * against the earth's curvature. The desert route reached Los Angeles through
 * intermediate stations that are not in this register, and drawing a single
 * 200 km beam from Mojave to Turquoise would be a line on a map pretending to
 * be a radio path. The geometry in socal-propagation.js would reject it
 * anyway, which is the useful part: the model and the history agree about
 * what a microwave hop can be.
 */
export const MAX_PLAUSIBLE_HOP_KM = 80;

