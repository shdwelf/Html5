/**
 * SOCAL SUBSURFACE — radio spectrum data pack.
 *
 * Transmitter sites and licensed emitters inside the theater frame, with the
 * numbers a propagation model actually needs: radiation-centre height, ERP,
 * HAAT, carrier frequency.
 *
 * Provenance ladder, same tiers as the rest of the theater:
 *   official   — a figure traceable to an FCC record (ASR registration, LMS /
 *                CDBS facility data as republished by the licensee or by the
 *                station's public technical summary) or to the site operator's
 *                own published site sheet.
 *   community  — well-documented secondary sourcing (site-operator pages,
 *                amateur/ATV network rosters, peak registers, press).
 *   context    — position or figure is generalized for the schematic; treat
 *                the pin as "a transmitter is up here", not as a survey.
 *
 * Nothing here is an engineering record. Coordinates are rounded to roughly
 * 10 m. Heights are radiation centre above ground unless stated. If you need
 * the real thing, the authoritative chain is:
 *
 *   FCC ASR      wireless2.fcc.gov/UlsApp/AsrSearch        structure, AGL/AMSL
 *   FCC LMS      enterpriseefiling.fcc.gov/dataentry       broadcast facility
 *   FCC CDBS     transition.fcc.gov/Bureaus/MB/Databases   legacy facility
 *   FCC ULS      wireless2.fcc.gov/UlsApp/UlsSearch        land mobile / micro
 *   FAA OE/AAA   oeaaa.faa.gov                             obstruction studies
 */

/** Public source chain for the spectrum layer (printed in the UI). */
export const RADIO_SOURCE_URLS = [
  "https://wireless2.fcc.gov/UlsApp/AsrSearch/asrRegistrationSearch.jsp",
  "https://www.fcc.gov/media/radio/fm-query",
  "https://www.fcc.gov/media/television/tv-query",
  "https://www.fcc.gov/media/radio/am-query",
  "https://www.fcc.gov/media/radio/fm-and-tv-propagation-curves",
  "https://transition.fcc.gov/oet/info/documents/bulletins/oet69/oet69.pdf",
  "https://oeaaa.faa.gov/oeaaa/external/portal.jsp",
];

/**
 * Band metadata. `color` drives the scene; `rxDbu` is the field strength this
 * app draws as the service contour, and where that number comes from.
 */
export const BANDS = {
  fm: {
    id: "fm",
    name: "FM broadcast 88–108 MHz",
    color: "#f0abfc",
    rxDbu: 60,
    rxNote: "60 dBµV/m — the F(50,50) protected contour for Class A/C3/C2/C1/C0/C under 47 CFR 73.215.",
  },
  vhf: {
    id: "vhf",
    name: "VHF TV 174–216 MHz (RF 7–13)",
    color: "#60a5fa",
    rxDbu: 36,
    rxNote: "36 dBµV/m — DTV noise-limited service contour for channels 7–13, OET-69 Table 2.",
  },
  uhf: {
    id: "uhf",
    name: "UHF TV 470–608 MHz (RF 14–36)",
    color: "#38bdf8",
    rxDbu: 41,
    rxNote: "41 − 20·log(615/f) dBµV/m — DTV noise-limited contour for channels 14–69, OET-69 Table 2.",
  },
  am: {
    id: "am",
    name: "AM broadcast 530–1700 kHz (groundwave)",
    color: "#fbbf24",
    rxDbu: 54,
    rxNote: "0.5 mV/m (54 dBµV/m) groundwave — the conventional daytime secondary-service reference, 47 CFR 73.182/73.184.",
  },
  lmr: {
    id: "lmr",
    name: "Land mobile / ATV / microwave relay",
    color: "#a3e635",
    rxDbu: 39,
    rxNote: "39 dBµV/m — a working mobile-service threshold; land mobile has no single statutory contour.",
  },
};

/**
 * Transmitter sites. `elevM` is published ground elevation; the app does NOT
 * use it for geometry (the terrain field supplies ground), it is carried so the
 * dossier can state how far the schematic terrain is from the real summit.
 */
export const RADIO_SITES = [
  {
    id: "mt-wilson",
    name: "Mount Wilson antenna farm",
    lon: -118.0671,
    lat: 34.2259,
    elevM: 1722.7,
    tier: "official",
    county: "Los Angeles",
    facts: [
      "The dominant transmitter site for the Los Angeles market: effectively every full-power LA television station plus most of the market's Class B FMs radiate from this ridge, alongside the Mount Wilson Observatory.",
      "ASR 1012836 (the CBS tower, 123 CBS Lane): site elevation 1,724.7 m, structure 274.2 m, overall 296.4 m AGL, 2,021.1 m AMSL — and its FCC lighting paragraph carries an explicit condition that shielding be placed on the light underside to avoid interference to the observatory.",
      "First television from the ridge was KTLA in 1947; KFI-FM was the first FM, 15 July 1946.",
      "Site sheet figures: ground 1,722.7 m, HAAT about 849 m for a 10 m reference antenna — the HAAT the FCC curves want is a per-radial number, and the app recomputes it live from the terrain field.",
    ],
    sources: [
      "FCC ASR registration 1012836 (Mount Wilson, CA; Los Angeles County)",
      "Mobile Relay Associates Mt Wilson site sheet",
      "Station technical summaries (FCC LMS facility data)",
    ],
  },
  {
    id: "mt-harvard",
    name: "Mount Harvard transmitter ridge",
    lon: -118.0792,
    lat: 34.2213,
    elevM: 1694,
    tier: "community",
    county: "Los Angeles",
    facts: [
      "The second summit of the Mount Wilson complex, about 1.2 km west-southwest, carrying its own cluster of broadcast and two-way structures.",
      "Several ASR records inside the Mount Wilson 15 km search ring sit at 1,724–1,740 m site elevation with 83–143 m structures — those are the Wilson/Harvard towers, not valley sticks.",
    ],
    sources: ["FCC ASR coordinate search, 15 km of 34-13-55 N 118-04-18 W"],
  },
  {
    id: "mt-lukens",
    name: "Mount Lukens",
    lon: -118.239,
    lat: 34.2687,
    elevM: 1547,
    tier: "official",
    county: "Los Angeles",
    facts: [
      "Highest point inside the Los Angeles city limits at 1,547 m, which is why the summit is a tower field: FM broadcast, VHF low and high band, UHF, 800/900 MHz and microwave.",
      "Buildings on the summit are held by American Tower, Crown Castle and Mobile Relay Associates among others — it is a leased communications site, not one operator's hill.",
    ],
    sources: ["USGS Condor Peak quad / GNIS", "Site-operator tenant listings"],
  },
  {
    id: "verdugo-peak",
    name: "Verdugo Peak",
    lon: -118.2724,
    lat: 34.2232,
    elevM: 953,
    tier: "community",
    county: "Los Angeles",
    facts: [
      "High point of the Verdugo Mountains, the ridge that separates the San Fernando Valley from the Crescenta Valley.",
      "A secondary broadcast site: FM facilities that could not get onto Mount Wilson, or that hold grandfathered above-class power from a lower site, historically lived on Verdugo or Flint Peak.",
    ],
    sources: ["GNIS summit record", "Market transmitter-site histories"],
  },
  {
    id: "flint-peak",
    name: "Flint Peak (Glendale)",
    lon: -118.2097,
    lat: 34.1858,
    elevM: 550,
    tier: "context",
    county: "Los Angeles",
    facts: [
      "The low-ridge predecessor site above Glendale. 97.1 and 105.9 both radiated from Flint at above-class ERP before moving up to Mount Wilson and cutting power by the corresponding amount — the trade the FCC contour rules force when you gain height.",
    ],
    sources: ["Market transmitter-site histories (position generalized)"],
  },
  {
    id: "oat-mountain",
    name: "Oat Mountain",
    lon: -118.592,
    lat: 34.3131,
    elevM: 1142,
    tier: "community",
    county: "Los Angeles",
    facts: [
      "Highest summit of the Santa Susana Mountains and the west-valley relay ridge, directly above the Aliso Canyon gas storage field this theater already draws.",
      "Amateur television network site: 919.25 MHz vestigial-sideband output from 34-19-45 N 118-36-05 W at 1,129 m.",
    ],
    sources: ["Amateur Television Network Southern California roster", "GNIS summit record"],
  },
  {
    id: "mt-lee",
    name: "Mount Lee (Hollywood)",
    lon: -118.3215,
    lat: 34.1341,
    elevM: 520,
    tier: "community",
    county: "Los Angeles",
    facts: [
      "The HOLLYWOOD sign hill, and the city's first broadcast summit: experimental W6XYZ/KTLA and the 1940s FM pioneer K45LA on 45.5 MHz operated from here before the market moved to Mount Wilson.",
      "Still a City of Los Angeles radio site.",
    ],
    sources: ["Los Angeles broadcast histories", "GNIS summit record"],
  },
  {
    id: "san-pedro-hill",
    name: "San Pedro Hill (Palos Verdes)",
    lon: -118.355,
    lat: 33.7461,
    elevM: 448,
    tier: "community",
    county: "Los Angeles",
    facts: [
      "The Palos Verdes Peninsula high point: a coastal radar, microwave and two-way site with an unobstructed horizon over the San Pedro Channel and the harbor approaches.",
      "Line of sight from here reaches Santa Catalina Island, which is why harbor and marine services use it.",
    ],
    sources: ["GNIS summit record", "Site-operator tenant listings"],
  },
  {
    id: "santiago-peak",
    name: "Santiago Peak (Saddleback)",
    lon: -117.5337,
    lat: 33.7118,
    elevM: 1732.8,
    tier: "official",
    county: "Orange / Riverside",
    facts: [
      "Highest point in Orange County at 1,732 m, straddling the Orange–Riverside line in the Cleveland National Forest, Trabuco Ranger District.",
      "Operator site sheet: ground 1,732.8 m, support structure 36.6 m, 41.1 m with appurtenances, HAAT 1,127 m for a 16.8 m antenna. Land owner USFS.",
      "The US Forest Service put the first radio tower here in 1946 and partnered with Southern California Edison on a joint facility in 1948; nine companies by 1952, about twenty facilities by the early 1990s.",
      "Coverage from this one peak spans San Diego to the San Fernando Valley and coastal Orange County to the Inland Empire.",
    ],
    sources: [
      "Mobile Relay Associates Santiago Peak site sheet",
      "Cleveland National Forest / Trabuco RD",
      "Orange County Register survey of the summit, 19 November 2014",
    ],
  },
  {
    id: "keller-peak",
    name: "Keller Peak",
    lon: -117.0576,
    lat: 34.193,
    elevM: 2225,
    tier: "community",
    county: "San Bernardino",
    facts: [
      "San Bernardino Mountains lookout and communications summit above Running Springs, covering the Inland Empire and the Big Bear plateau this theater already draws.",
    ],
    sources: ["GNIS summit record", "USFS lookout register"],
  },
  {
    id: "jobs-peak",
    name: "Jobs Peak",
    lon: -117.33,
    lat: 34.2575,
    elevM: 1642,
    tier: "community",
    county: "San Bernardino",
    facts: [
      "Amateur Television Network site at 34-15-27 N 117-19-48 W, 1,642 m, covering the High Desert — Victor Valley and Crestline — which is the far side of the Cajon notch from the LA basin.",
    ],
    sources: ["Amateur Television Network Southern California roster"],
  },
  {
    id: "snow-peak",
    name: "Snow Peak (San Gorgonio flank)",
    lon: -116.8144,
    lat: 34.0381,
    elevM: 2418,
    tier: "community",
    county: "San Bernardino",
    facts: [
      "ATN site at 34-02-17 N 116-48-52 W, 2,418 m — the highest emitter in this register and the one with the longest radio horizon.",
      "1242.0 MHz DVB-T output; 2441.5 MHz and 434.0 MHz inputs.",
    ],
    sources: ["Amateur Television Network Southern California roster"],
  },
  {
    id: "gibraltar-peak",
    name: "Gibraltar / Santa Barbara ridge",
    lon: -119.6769,
    lat: 34.4875,
    elevM: 728,
    tier: "community",
    county: "Santa Barbara",
    facts: [
      "The Santa Ynez front-range relay shelf above Santa Barbara, covering the city and the Ventura coastline. ATN site at 34-29-15 N 119-40-37 W, 728 m.",
    ],
    sources: ["Amateur Television Network Southern California roster"],
  },
  {
    id: "frazier-mountain",
    name: "Frazier Mountain",
    lon: -118.9681,
    lat: 34.7761,
    elevM: 2447,
    tier: "community",
    county: "Ventura / Kern",
    facts: [
      "The Grapevine summit site, looking down the Tejon corridor into the San Joaquin Valley on one side and over the Cuyama / Antelope country on the other.",
      "About 25 km east-northeast of the Fort Tejon dragoon post and directly above the San Andreas trace the 1857 rupture followed.",
    ],
    sources: ["GNIS summit record", "USFS Los Padres NF site register"],
  },
  {
    id: "edom-hill",
    name: "Edom Hill (Cathedral City)",
    lon: -116.4556,
    lat: 33.865,
    elevM: 500,
    tier: "community",
    county: "Riverside",
    facts: [
      "The Coachella Valley broadcast hill: the isolated rise north of Cathedral City that serves Palm Springs and the valley floor, with the San Jacinto wall blocking everything to the west.",
    ],
    sources: ["GNIS summit record", "Coachella Valley market transmitter listings"],
  },
  {
    id: "mt-soledad",
    name: "Mount Soledad (La Jolla)",
    lon: -117.2523,
    lat: 32.8398,
    elevM: 249,
    tier: "official",
    county: "San Diego",
    facts: [
      "Coastal San Diego transmitter hill at 249 m. KPBS moved its 89.5 FM transmitter here from Mount San Miguel in 2012 and raised power; the trade was a stronger coastal-city signal for some inland loss.",
      "Low absolute elevation, but it sits right on the population, which is the whole FCC HAAT argument in one hill.",
    ],
    sources: ["USGS La Jolla OE W quad / GNIS", "KPBS transmitter relocation announcement, 4 October 2012"],
  },
  {
    id: "mt-san-miguel",
    name: "Mount San Miguel",
    lon: -116.9354,
    lat: 32.6963,
    elevM: 982,
    tier: "community",
    county: "San Diego",
    facts: [
      "The East County broadcast summit above Jamul: the San Diego market's main FM/TV antenna farm, and the site KPBS left for Mount Soledad.",
      "Burned over in the 2003 Otay and 2007 Harris fires — the same fire/infrastructure overlap this theater draws for Cajon Pass.",
    ],
    sources: ["GNIS summit record", "San Diego market transmitter listings"],
  },
  {
    id: "monument-peak",
    name: "Monument Peak (Mount Laguna)",
    lon: -116.4206,
    lat: 32.8905,
    elevM: 1920,
    tier: "community",
    county: "San Diego",
    facts: [
      "The Laguna Mountains summit site, 1,920 m, looking east over the Anza-Borrego desert and the Salton Trough and west over the back-country.",
      "Shares the ridge with Mount Laguna Air Force Station radar.",
    ],
    sources: ["GNIS summit record", "USFS Cleveland NF site register"],
  },
  {
    id: "kfi-la-mirada",
    name: "KFI 640 kHz tower, La Mirada",
    lon: -118.0247,
    lat: 33.9044,
    elevM: 48,
    tier: "community",
    county: "Los Angeles",
    facts: [
      "Clear-channel Class A AM site on Trojan Way, in use since 1948. The original 750 ft (229 m) half-wave radiator was struck by an aircraft in 2004; the replacement tower was completed in 2008. A 250 ft backup stick stands beside it.",
      "A tall AM radiator is not a mast holding an antenna — the tower is the antenna, series-fed and insulated from ground, which is why this one pin behaves completely differently from every other emitter in this register.",
    ],
    sources: ["Station transmitter-facility tours and photo surveys", "FCC AM query record, facility 34394"],
  },
  {
    id: "knx-torrance",
    name: "KNX 1070 kHz site, Columbia Park, Torrance",
    lon: -118.34972,
    lat: 33.85972,
    elevM: 20,
    tier: "official",
    county: "Los Angeles",
    facts: [
      "Class A clear-channel 50 kW non-directional site in Columbia Park near Hawthorne Blvd and 190th St, with an auxiliary array a few metres north at 33-51-38 N 118-20-57 W.",
      "Low, flat, damp coastal ground — high conductivity — which is exactly what an AM groundwave wants and what the inland sites do not have.",
    ],
    sources: ["FCC AM query record, facility 9616", "Station technical summary"],
  },
  {
    id: "kabc-crenshaw",
    name: "KABC 790 kHz array, Crenshaw District",
    lon: -118.346472,
    lat: 34.01944,
    elevM: 48,
    tier: "official",
    county: "Los Angeles",
    facts: [
      "Directional AM array off West Martin Luther King Blvd, shared with 1330 and 1650 kHz — three services, one patch of ground, because urban AM sites are now land-constrained in a way the 1940s sites were not.",
      "5 kW with a directional night pattern; the station moved 780 → 790 kHz in 1941 under NARBA.",
    ],
    sources: ["FCC AM query record, facility 34425", "Station technical summary"],
  },
];

/**
 * Licensed emitters. One row per radiating facility.
 *
 *   freqMHz   carrier / channel centre frequency
 *   erpKw     effective radiated power, kW (ERP, dipole reference, as filed)
 *   haatM     filed height above average terrain, m (null = not asserted here)
 *   rcAglM    radiation centre above ground at the site, m (estimate where the
 *             filed value is not carried — used only to seat the mast)
 */
export const EMITTERS = [
  /* ---------------------------------------------------------- TV, VHF/UHF */
  {
    id: "kabc-tv",
    call: "KABC-TV",
    site: "mt-wilson",
    band: "vhf",
    service: "DTV",
    channel: "RF 7 (virtual 7)",
    freqMHz: 177,
    erpKw: 28.7,
    haatM: 978,
    rcAglM: 150,
    facilityId: 282,
    tier: "official",
    notes: [
      "ABC West Coast flagship. Lower-VHF-adjacent RF 7 at 28.7 kW looks tiny beside the UHF stations at hundreds of kW — that is the band, not the station: at 177 MHz you need far less power for the same field.",
      "Moved from UHF 53 back to its analog-era channel 7 at the 2009 transition; shares the RF 7 multiplex with KRCA.",
    ],
  },
  {
    id: "kttv",
    call: "KTTV",
    site: "mt-wilson",
    band: "vhf",
    service: "DTV",
    channel: "RF 11 (virtual 11)",
    freqMHz: 201,
    erpKw: 115,
    haatM: 903,
    rcAglM: 140,
    facilityId: 22208,
    tier: "official",
    notes: ["Fox West Coast flagship, high-band VHF from the Wilson ridge."],
  },
  {
    id: "kcbs-tv",
    call: "KCBS-TV",
    site: "mt-wilson",
    band: "uhf",
    service: "DTV",
    channel: "RF 31 (virtual 2)",
    freqMHz: 575,
    erpKw: 485,
    haatM: 1095,
    rcAglM: 240,
    facilityId: 9628,
    tier: "official",
    notes: [
      "Transmitter on the western side of Mount Wilson near Occidental Peak — the highest HAAT in this register at 1,095 m.",
      "Repacked 60 → 43 → 31 across the 2009 transition and the 2017–19 incentive-auction repack.",
    ],
  },
  {
    id: "ktla",
    call: "KTLA",
    site: "mt-wilson",
    band: "uhf",
    service: "DTV",
    channel: "RF 35 (virtual 5)",
    freqMHz: 599,
    erpKw: 1000,
    haatM: 981,
    rcAglM: 200,
    facilityId: 35670,
    tier: "official",
    notes: [
      "1,000 kW ERP — the maximum-power case in this frame, and the first television station on Mount Wilson (1947).",
      "The tower beside the Sunset Blvd studio carries the call letters and radiates nothing; the signal comes off Wilson.",
    ],
  },
  {
    id: "knbc",
    call: "KNBC",
    site: "mt-wilson",
    band: "uhf",
    service: "DTV",
    channel: "RF 36 (virtual 4)",
    freqMHz: 605,
    erpKw: 665,
    haatM: 991,
    rcAglM: 200,
    facilityId: 47906,
    tier: "official",
    notes: ["NBC West Coast flagship; stayed on its pre-transition UHF 36."],
  },

  /* ------------------------------------------------------------------- FM */
  {
    id: "kiis-fm",
    call: "KIIS-FM",
    site: "mt-wilson",
    band: "fm",
    service: "FM Class B",
    channel: "102.7 MHz",
    freqMHz: 102.7,
    erpKw: 8,
    haatM: 902,
    rcAglM: 60,
    facilityId: 19218,
    tier: "official",
    notes: [
      "8 kW at 902 m HAAT. Class B stations trade power against height under 47 CFR 73.211 — the Wilson stations are all low-power, high-HAAT facilities, and their contours are nearly identical.",
    ],
  },
  {
    id: "kcbs-fm",
    call: "KCBS-FM",
    site: "mt-wilson",
    band: "fm",
    service: "FM Class B",
    channel: "93.1 MHz",
    freqMHz: 93.1,
    erpKw: 27.5,
    haatM: 1074,
    rcAglM: 90,
    facilityId: 9612,
    tier: "official",
    notes: ["27.5 kW at 1,074 m HAAT — the biggest FM contour on the hill in this register."],
  },
  {
    id: "kpwr",
    call: "KPWR",
    site: "mt-wilson",
    band: "fm",
    service: "FM Class B",
    channel: "105.9 MHz",
    freqMHz: 105.9,
    erpKw: 25,
    haatM: 925,
    rcAglM: 70,
    tier: "community",
    notes: [
      "About 25 kW at roughly 3,035 ft (925 m). Carried above-class power at Flint Peak and cut it on the move up to Wilson, which is the contour-equivalence trade written into the rules.",
    ],
  },
  {
    id: "kkgo",
    call: "KKGO",
    site: "mt-wilson",
    band: "fm",
    service: "FM Class B",
    channel: "105.1 MHz",
    freqMHz: 105.1,
    erpKw: 20,
    haatM: 920,
    rcAglM: 70,
    facilityId: 43939,
    tier: "community",
    notes: ["Operating from a Mount Wilson transmitter since 1959 — one of the longest continuous tenancies on the ridge."],
  },
  {
    id: "kost",
    call: "KOST",
    site: "mt-wilson",
    band: "fm",
    service: "FM Class B",
    channel: "103.5 MHz",
    freqMHz: 103.5,
    erpKw: 10,
    haatM: 905,
    rcAglM: 60,
    tier: "community",
    notes: ["Wilson Class B; HD2 carries the 640 kHz talk service, which is how an AM clear channel buys an FM-quality path into the basin."],
  },
  {
    id: "klve",
    call: "KLVE",
    site: "mt-wilson",
    band: "fm",
    service: "FM Class B",
    channel: "107.5 MHz",
    freqMHz: 107.5,
    erpKw: 23,
    haatM: 920,
    rcAglM: 70,
    tier: "community",
    notes: ["Wilson Class B at the top of the band."],
  },
  {
    id: "kpcc",
    call: "KPCC",
    site: "mt-wilson",
    band: "fm",
    service: "NCE FM Class B",
    channel: "89.3 MHz",
    freqMHz: 89.3,
    erpKw: 2.9,
    haatM: 892,
    rcAglM: 50,
    tier: "community",
    notes: ["Non-commercial reserved band (88.1–91.9 MHz), licensed to Pasadena, radiating from the Angeles National Forest site on Wilson."],
  },
  {
    id: "kcrw",
    call: "KCRW",
    site: "mt-lee",
    band: "fm",
    service: "NCE FM Class B",
    channel: "89.9 MHz",
    freqMHz: 89.9,
    erpKw: 6.8,
    haatM: 290,
    rcAglM: 40,
    tier: "community",
    notes: [
      "Not on Wilson: the 89.9 transmitter is on the Santa Monica Mountains crest near Mulholland (Laurel Hills), a much lower site chosen for the Westside rather than for reach.",
      "Position here is the Mount Lee / Santa Monica crest pin, generalized along the ridge.",
    ],
  },
  {
    id: "kwve",
    call: "KWVE-FM",
    site: "santiago-peak",
    band: "fm",
    service: "FM Class B",
    channel: "107.9 MHz",
    freqMHz: 107.9,
    erpKw: 4.5,
    haatM: 1000,
    rcAglM: 40,
    tier: "community",
    notes: ["Santa Ana Mountains / Santiago Peak Class B covering Orange County and reaching well into the Inland Empire."],
  },
  {
    id: "kpbs-fm",
    call: "KPBS-FM",
    site: "mt-soledad",
    band: "fm",
    service: "NCE FM Class B",
    channel: "89.5 MHz",
    freqMHz: 89.5,
    erpKw: 5.6,
    haatM: 180,
    rcAglM: 50,
    tier: "community",
    notes: [
      "Moved from Mount San Miguel (982 m, inland) to Mount Soledad (249 m, coastal) in 2012 and increased power. Net effect: a stronger signal over the city, a weaker one over parts of East County — the clearest HAAT-versus-population trade in this register.",
    ],
  },

  /* ------------------------------------------------------------------- AM */
  {
    id: "kfi",
    call: "KFI",
    site: "kfi-la-mirada",
    band: "am",
    service: "AM Class A clear channel",
    channel: "640 kHz",
    freqMHz: 0.64,
    erpKw: 50,
    haatM: null,
    rcAglM: 229,
    tier: "community",
    notes: [
      "50 kW non-directional day, clear channel. The signal is a groundwave over the coastal plain by day and a skywave that reaches most of the western United States at night — neither behaves like the line-of-sight contours drawn for the FM and TV pins.",
      "This app draws the daytime groundwave only, and crudely. Skywave is a different model entirely (47 CFR 73.190).",
    ],
  },
  {
    id: "knx",
    call: "KNX",
    site: "knx-torrance",
    band: "am",
    service: "AM Class A clear channel",
    channel: "1070 kHz",
    freqMHz: 1.07,
    erpKw: 50,
    haatM: null,
    rcAglM: 150,
    facilityId: 9616,
    tier: "official",
    notes: [
      "50 kW non-directional, unlimited time, one of the original clear channels; licensed since 1921 and heard over all of Southern California by day.",
    ],
  },
  {
    id: "kabc-am",
    call: "KABC",
    site: "kabc-crenshaw",
    band: "am",
    service: "AM Class B",
    channel: "790 kHz",
    freqMHz: 0.79,
    erpKw: 5,
    haatM: null,
    rcAglM: 90,
    tier: "official",
    notes: ["5 kW, directional at night to protect co-channel stations. Urban infill site shared with two other AM services."],
  },

  /* ----------------------------------------------- land mobile / ATV / µW */
  {
    id: "atn-santiago",
    call: "W6ATN Santiago",
    site: "santiago-peak",
    band: "lmr",
    service: "Amateur television repeater",
    channel: "1242 MHz DVB-T",
    freqMHz: 1242,
    erpKw: 0.05,
    haatM: 1127,
    rcAglM: 37,
    tier: "community",
    notes: [
      "Digital ATV output on 1242 MHz with 2441.5 MHz and 434.0 MHz inputs; voice on 1286.125 MHz. Covers the LA/Orange basin, the Inland Empire and part of San Diego County from one peak.",
      "50 W into a 1.2 GHz path is a useful control case for the model: at this frequency the first Fresnel zone is small, so terrain clearance matters far more than power.",
    ],
  },
  {
    id: "atn-oat",
    call: "W6ATN Oat Mountain",
    site: "oat-mountain",
    band: "lmr",
    service: "Amateur television repeater",
    channel: "919.25 MHz VSB",
    freqMHz: 919.25,
    erpKw: 0.03,
    haatM: 520,
    rcAglM: 25,
    tier: "community",
    notes: ["West-valley ATV relay, 919.25 MHz vestigial sideband with a 3,380 MHz FM companion."],
  },
  {
    id: "atn-jobs",
    call: "W6ATN Jobs Peak",
    site: "jobs-peak",
    band: "lmr",
    service: "Amateur television repeater",
    channel: "1253 MHz",
    freqMHz: 1253,
    erpKw: 0.02,
    haatM: 600,
    rcAglM: 20,
    tier: "community",
    notes: ["High Desert coverage — Victor Valley and Crestline, the far side of Cajon Pass from the basin sites."],
  },
  {
    id: "mra-wilson-uhf",
    call: "WQKR933",
    site: "mt-wilson",
    band: "lmr",
    service: "Part 90 land mobile (site sheet)",
    channel: "UHF business band",
    freqMHz: 460,
    erpKw: 0.1,
    haatM: 849,
    rcAglM: 15,
    tier: "community",
    notes: [
      "The commercial two-way side of the hill: site sheet lists ground 1,722.7 m, HAAT 849.2 m for a 10 m antenna, wood-frame building and tower on Mt Wilson Circle.",
      "Stated coverage: Pasadena, Los Angeles, the San Gabriel Valley, the southern San Fernando Valley and Orange County.",
    ],
  },
  {
    id: "mra-santiago-uhf",
    call: "WQUF957",
    site: "santiago-peak",
    band: "lmr",
    service: "Part 90 land mobile (site sheet)",
    channel: "UHF business band",
    freqMHz: 460,
    erpKw: 0.1,
    haatM: 1127,
    rcAglM: 17,
    tier: "community",
    notes: ["Block building and tower, 85 kW Kohler generator, 2,000 Ah battery plant — the resilience spec of a mountaintop radio site is part of its coverage."],
  },
];

/** Sites that anchor emitters, indexed for quick joins. */
export const SITE_BY_ID = new Map(RADIO_SITES.map((s) => [s.id, s]));

/** Emitters grouped by their site. */
export function emittersAt(siteId) {
  return EMITTERS.filter((e) => e.site === siteId);
}

/**
 * FCC class reference facilities, 47 CFR 73.211(b)(1). These are the anchors
 * the smooth-earth contour model in socal-propagation.js is fitted against,
 * and the fixtures the test suite checks it against.
 */
export const FM_CLASS_REFERENCE = [
  { cls: "A", erpKw: 6, haatM: 100, dbu: 60, refKm: 28 },
  { cls: "B1", erpKw: 25, haatM: 100, dbu: 57, refKm: 44 },
  { cls: "B", erpKw: 50, haatM: 150, dbu: 54, refKm: 65 },
  { cls: "C3", erpKw: 25, haatM: 100, dbu: 60, refKm: 39 },
  { cls: "C2", erpKw: 50, haatM: 150, dbu: 60, refKm: 52 },
  { cls: "C1", erpKw: 100, haatM: 299, dbu: 60, refKm: 72 },
  { cls: "C0", erpKw: 100, haatM: 450, dbu: 60, refKm: 83 },
  { cls: "C", erpKw: 100, haatM: 600, dbu: 60, refKm: 92 },
];
