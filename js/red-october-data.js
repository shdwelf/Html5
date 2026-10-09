/** RED OCTOBER · CUTAWAY 4DWM — source data.
 *
 *  Three hulls, one viewer: the Soviet Project 941 SSBN the novel calls the
 *  Red October, the Los Angeles-class boat that finds her, and the Project 971
 *  that carries the name NATO gives to neither.
 *
 *  Every number here is a *published* figure. Where two publications disagree
 *  the disagreement is carried, not averaged — `checks` in
 *  js/red-october-checks.js compares them and reports the spread instead of
 *  quietly repairing it. Tiers follow the convention the other viewers in this
 *  repo use:
 *
 *    official   builder / navy publication or treaty-era declared data
 *    community  well-sourced secondary reference, widely repeated
 *    context    schematic; the model needs a number and no publication gives one
 *
 *  The novel is fiction. Real Project 941 boats carried no caterpillar drive
 *  and no boat named Red October was built; the fictional modifications are
 *  tagged `fiction` so the viewer can show them without implying they existed.
 */

export const TIERS = {
  official: { label: "official", color: "#ffb020" },
  community: { label: "community", color: "#5cd6ff" },
  context: { label: "context", color: "#ff6ec7" },
  fiction: { label: "fiction", color: "#b48cff" },
};

/* ------------------------------------------------------------------ boats */

export const BOATS = [
  {
    id: "typhoon",
    name: "TK-208 · RED OCTOBER",
    project: "Project 941 «Акула»",
    nato: "Typhoon",
    pennant: "TK-208",
    role: "SSBN · heavy ballistic missile submarine",
    flag: "Soviet Navy",
    // The naming collision is the single most confusing thing about this boat
    // and the viewer refuses to paper over it: the *Soviets* called Project 941
    // "Akula" (shark) while NATO calls Project 941 "Typhoon" and reserves
    // "Akula" for Project 971. See checks.js `namingCollision`.
    naming: "Soviet name «Акула» / NATO reporting name “Typhoon”",
    dim: {
      loa: 175.0,
      beam: 23.0,
      draft: 12.0,
      dispSurfaced: 23200,
      dispSubmerged: 48000,
      hullCount: 2,
      hullDiameter: 7.2,
      hullGap: 1.6,
      lightHullBeam: 23.0,
      testDepth: 400,
    },
    dimTier: { loa: "community", beam: "community", hullDiameter: "community", testDepth: "community" },
    propulsion: {
      reactors: 2,
      reactor: "OK-650B PWR",
      shafts: 2,
      shaftPower: 98000,
      speedSurfaced: 22,
      speedSubmerged: 27,
    },
    armament: {
      missiles: 20,
      missile: "R-39 Rif (SS-N-20 Sturgeon)",
      missileRows: 2,
      siloDiameter: 2.25,
      siloPitch: 3.2,
      torpedoTubes: 6,
      torpedoCalibre: 533,
    },
    crew: 160,
    // Deck ranges are fractions of LOA measured from the bow. The model lays
    // compartments out from these so the section view is not a guess about
    // what is where.
    layout: [
      { id: "bow-torpedo", label: "Torpedo room", from: 0.0, to: 0.09 },
      { id: "silo-deck", label: "Missile silos 1–20", from: 0.09, to: 0.44 },
      { id: "sail", label: "Sail / conning tower", from: 0.44, to: 0.52, tall: true },
      { id: "control", label: "Control room", from: 0.44, to: 0.55 },
      { id: "reactor-aft", label: "Reactor compartments", from: 0.55, to: 0.78 },
      { id: "aux", label: "Auxiliary / turbine", from: 0.78, to: 0.92 },
      { id: "shafting", label: "Shaft alley / steering", from: 0.92, to: 1.0 },
    ],
    // The novel's boat. Tagged fiction so the viewer can draw it and say so.
    fiction: [
      { id: "caterpillar", label: "Caterpillar drive — magnetohydrodynamic pump-jet duct", at: 0.85 },
    ],
    notes:
      "Two 7.2 m pressure hulls run side by side inside a wide light hull, with three " +
      "smaller pressure modules around them. The 20 R-39 silos sit forward of the sail, " +
      "which is why this boat's missile deck is at the bow rather than amidships.",
  },

  {
    id: "dallas",
    name: "USS DALLAS",
    project: "Los Angeles class (SSN-688)",
    nato: "Los Angeles",
    pennant: "SSN-688",
    role: "SSN · fast attack submarine",
    flag: "United States Navy",
    naming: "Hull number SSN-688; third ship named for Dallas, Texas",
    dim: {
      loa: 110.0,
      beam: 10.0,
      draft: 9.4,
      dispSurfaced: 6080,
      dispSubmerged: 6927,
      hullCount: 1,
      hullDiameter: 7.0,
      hullGap: 0,
      lightHullBeam: 10.0,
      testDepth: 244,
    },
    dimTier: { loa: "community", beam: "community", hullDiameter: "community", testDepth: "official" },
    propulsion: {
      reactors: 1,
      reactor: "S6G PWR (natural-circulation capable)",
      shafts: 1,
      shaftPower: 35000,
      speedSurfaced: 12,
      speedSubmerged: 25,
    },
    armament: {
      missiles: 0,
      missile: "—",
      missileRows: 0,
      siloDiameter: 0,
      siloPitch: 0,
      torpedoTubes: 4,
      torpedoCalibre: 533,
      weaponLoadout: 21,
    },
    crew: 110,
    crewDetail: "12 officers / 98 enlisted",
    layout: [
      { id: "sonar-dome", label: "Bow sphere / sonar array", from: 0.0, to: 0.08 },
      { id: "torpedo", label: "Torpedo room · 4 × 533 mm", from: 0.08, to: 0.22 },
      { id: "berthing", label: "Crew berthing / sonar shack", from: 0.22, to: 0.44 },
      { id: "sail", label: "Sail · dive planes", from: 0.3, to: 0.38, tall: true },
      { id: "control", label: "Control room / attack centre", from: 0.44, to: 0.52 },
      { id: "reactor", label: "Reactor compartment · S6G", from: 0.52, to: 0.72 },
      { id: "engine", label: "Engine room / turbine", from: 0.72, to: 0.9 },
      { id: "shafting", label: "Shaft alley / steering", from: 0.9, to: 1.0 },
    ],
    fiction: [],
    notes:
      "Single pressure hull with an anechoic-coated light hull over it. The bow sphere is " +
      "the sonar array, not a torpedo room — the tubes are set back and angled outboard so " +
      "the array can look forward. The novel puts Bart Mancuso in command and a sonarman " +
      "named Jones on the phones when the caterpillar is first heard.",
  },

  {
    id: "akula",
    name: "K-284 · AKULA",
    project: "Project 971 «Щука-Б»",
    nato: "Akula",
    pennant: "K-284 (lead boat)",
    role: "SSN · nuclear-powered attack submarine",
    flag: "Soviet Navy / Russian Navy",
    naming: "NATO reporting name “Akula”; the Soviets called this boat «Щука-Б»",
    dim: {
      loa: 110.0,
      beam: 13.6,
      draft: 9.7,
      dispSurfaced: 8140,
      dispSubmerged: 12770,
      hullCount: 1,
      hullDiameter: 9.4,
      hullGap: 0,
      lightHullBeam: 13.6,
      testDepth: 520,
    },
    dimTier: { loa: "community", beam: "community", hullDiameter: "community", testDepth: "community" },
    propulsion: {
      reactors: 1,
      reactor: "OK-650B PWR",
      shafts: 1,
      shaftPower: 43000,
      speedSurfaced: 11.6,
      speedSubmerged: 33,
    },
    armament: {
      missiles: 0,
      missile: "—",
      missileRows: 0,
      siloDiameter: 0,
      siloPitch: 0,
      torpedoTubes: 8,
      torpedoCalibre: "4 × 533 mm + 4 × 650 mm",
    },
    crew: 73,
    layout: [
      { id: "sonar-dome", label: "Bow array", from: 0.0, to: 0.09 },
      { id: "torpedo", label: "Torpedo room · 4 × 650 / 4 × 533", from: 0.09, to: 0.24 },
      { id: "berthing", label: "Crew berthing", from: 0.24, to: 0.44 },
      { id: "sail", label: "Sail · dive planes", from: 0.3, to: 0.38, tall: true },
      { id: "control", label: "Control room", from: 0.44, to: 0.53 },
      { id: "reactor", label: "Reactor compartment · OK-650B", from: 0.53, to: 0.74 },
      { id: "engine", label: "Turbine / motor room", from: 0.74, to: 0.9 },
      { id: "shafting", label: "Shaft alley / steering", from: 0.9, to: 1.0 },
    ],
    fiction: [],
    notes:
      "Single 9.4 m pressure hull in a teardrop light hull with a 7-blade skewed screw. " +
      "Akula I was reported quieter than an improved Los Angeles, which is the whole " +
      "reason the class mattered to Western ASW in the late 1980s.",
  },
];

export const BOATS_BY_ID = Object.fromEntries(BOATS.map((b) => [b.id, b]));

/* ------------------------------------------------------------- storyline */

/**
 * The novel's plot, as a 4D axis. The book gives a clear order of events but
 * not a calendar; dates are therefore expressed as an ordinal day from
 * departure, tier `context`, so the timeline cannot be mistaken for a
 * published date. `t` is 0..1 and drives the viewer's time slider.
 */
export const STORYLINE = [
  {
    t: 0.0,
    day: "day 0",
    title: "Underway from Polyarny",
    body:
      "Marko Ramius takes the boat out of the Kola Inlet under his own orders. The " +
      "letter stating his intent is already in the hands of the Soviet naval political " +
      "directorship; nobody reading it yet believes it.",
    tier: "context",
    boat: "typhoon",
  },
  {
    t: 0.09,
    day: "day 0",
    title: "The political officer dies",
    body:
      "Ivan Putin, the zampolit riding along for the exercise, confronts Ramius over the " +
      "course. The confrontation ends with Putin dead in what is logged as a fall. From " +
      "here the boat answers to Ramius alone.",
    tier: "context",
    boat: "typhoon",
  },
  {
    t: 0.22,
    day: "day 2",
    title: "Caterpillar engaged",
    body:
      "The magnetohydrodynamic duct takes the load. Above a few knots it is quieter than " +
      "the shaft line it replaces, and it leaves no gear-train signature for a passive " +
      "listener to classify.",
    tier: "fiction",
    boat: "typhoon",
  },
  {
    t: 0.34,
    day: "day 3",
    title: "The surge is noticed",
    body:
      "An unexplained fleet movement in the north Atlantic reaches photo intelligence. " +
      "The working assumption in Washington is an exercise; the alternative — that one " +
      "boat has left it and nobody can say where it went — is not yet the consensus.",
    tier: "context",
    boat: null,
  },
  {
    t: 0.47,
    day: "day 4",
    title: "Dallas on station",
    body:
      "USS Dallas is already in the water on a routine patrol and is tasked into the gap. " +
      "She is the closest quiet platform to where the boat has to pass.",
    tier: "context",
    boat: "dallas",
  },
  {
    t: 0.58,
    day: "day 5",
    title: "A sound with no gearbox",
    body:
      "On the towed array, Jones finds a broadband signal that will not resolve into any " +
      "machinery he knows. He keeps it. Classification is what turns a contact into an " +
      "identification, and he cannot classify it.",
    tier: "context",
    boat: "dallas",
  },
  {
    t: 0.68,
    day: "day 6",
    title: "Konovalov hunts her",
    body:
      "The Alfa-class Konovalov, under Tupolev — a former student of Ramius — is ordered " +
      "to find the missing boat. A student who knows how his teacher thinks is the worst " +
      "possible searcher, and the best one the Soviets have.",
    tier: "context",
    boat: null,
  },
  {
    t: 0.78,
    day: "day 7",
    title: "Contact, and contact acknowledged",
    body:
      "Dallas holds the boat long enough for the two captains to understand each other. " +
      "What follows is a negotiation conducted at periscope depth between men who cannot " +
      "prove their intentions to anyone.",
    tier: "context",
    boat: "dallas",
  },
  {
    t: 0.89,
    day: "day 8",
    title: "The crew comes off",
    body:
      "Red October's crew is transferred out to a submarine rescue ship. The transfer is " +
      "the irreversible step: a boat with no crew and a live reactor is a decision that " +
      "has already been made.",
    tier: "context",
    boat: "typhoon",
  },
  {
    t: 1.0,
    day: "day 9",
    title: "Scuttled",
    body:
      "Ramius sinks her himself. The hull goes down with the drive still installed, which " +
      "is what the intelligence services on both sides were actually arguing about.",
    tier: "context",
    boat: "typhoon",
  },
];

/* -------------------------------------------------------------- sources */

export const SOURCES = [
  {
    id: "src-published-dimensions",
    label: "Published class dimensions",
    tier: "community",
    note:
      "Project 941 and Project 971 figures are from open secondary reference; Soviet " +
      "class data was never published by the builder in full, so beam and test depth in " +
      "particular vary by several metres between references. The viewer carries the " +
      "spread rather than picking one.",
  },
  {
    id: "src-ssn688",
    label: "USS Dallas (SSN-688)",
    tier: "official",
    note:
      "Los Angeles-class figures: 360 ft LOA, 33 ft beam, one S6G reactor, four 533 mm " +
      "bow tubes. The Navy's public statement on test depth is the deliberately vague " +
      "“in excess of 800 feet”, which is what the model uses.",
  },
  {
    id: "src-naming",
    label: "The Akula / Typhoon naming collision",
    tier: "official",
    note:
      "Project 941 was named «Акула» by the Soviet Navy and is called Typhoon by NATO. " +
      "Project 971 is «Щука-Б» to the Soviets and Akula to NATO. Both names are correct " +
      "for both boats depending on who is speaking, which is why the switcher shows both.",
  },
  {
    id: "src-novel",
    label: "The Hunt for Red October (Tom Clancy, 1984)",
    tier: "fiction",
    note:
      "The caterpillar drive, the boat named Red October, and the plot are fiction. No " +
      "Project 941 boat carried a magnetohydrodynamic drive. Everything tagged `fiction` " +
      "in this viewer is drawn from the novel and is labelled as such on screen.",
  },
  {
    id: "src-unverified",
    label: "Unverified: the “Lithuanian city school teacher”",
    tier: "context",
    note:
      "Ramius being Lithuanian-born is in the novel and is modelled. A connection to a " +
      "city school teacher could not be verified against the novel or against any " +
      "published Project 941 reference, so it is recorded here as an open question " +
      "rather than built into the model.",
  },
];
