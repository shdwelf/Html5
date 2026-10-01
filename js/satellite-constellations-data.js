/**
 * Satellite constellations 4Dwm data.
 *
 * This is a mathematical theater, not a live tracking product. Orbits are
 * circularized shells using published altitude / inclination / plane-count
 * summaries. No TLEs, no current ephemerides, no conjunction prediction.
 */

export const EARTH_RADIUS_KM = 6371;
export const MU_EARTH_KM3_S2 = 398600.4418;
export const LIGHT_SPEED_KM_S = 299792.458;

export const modelDisclaimer =
  "SCHEMATIC SATELLITE CONSTELLATION VIEWER — circularized orbit shells from public summaries. Not live ephemeris, not TLE propagation, not collision screening, not coverage certification, and not a satellite-operator status page.";

export function orbitalPeriodMinutes(altitudeKm) {
  const a = EARTH_RADIUS_KM + altitudeKm;
  return (2 * Math.PI * Math.sqrt((a ** 3) / MU_EARTH_KM3_S2)) / 60;
}

export function orbitalSpeedKmS(altitudeKm) {
  return Math.sqrt(MU_EARTH_KM3_S2 / (EARTH_RADIUS_KM + altitudeKm));
}

export function oneWayLightTimeMs(altitudeKm) {
  return (altitudeKm / LIGHT_SPEED_KM_S) * 1000;
}

/** Earth-central half angle from the sub-satellite point to the geometric horizon. */
export function horizonHalfAngleDeg(altitudeKm) {
  return Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeKm)) * 180 / Math.PI;
}

export function shellActualCount(shell) {
  return shell.satellites ?? shell.planes * shell.satsPerPlane;
}

export function constellationDesignCount(c) {
  return c.shells.reduce((sum, shell) => sum + shellActualCount(shell), 0);
}

export function countAtYear(c, year) {
  const ms = [...c.milestones].sort((a, b) => a.year - b.year);
  if (!ms.length || year < ms[0].year) return 0;
  for (let i = 0; i < ms.length - 1; i++) {
    const a = ms[i], b = ms[i + 1];
    if (year >= a.year && year < b.year) {
      const t = (year - a.year) / (b.year - a.year);
      return Math.round(a.count + (b.count - a.count) * t);
    }
  }
  return ms[ms.length - 1].count;
}

export function visibleProxyCount(c, shell, year) {
  const totalNow = c.currentSatellites || constellationDesignCount(c);
  const fraction = Math.max(0, Math.min(1, countAtYear(c, year) / Math.max(1, totalNow)));
  return Math.round(shell.renderSatellites * fraction);
}

export const LAYERS = [
  { id: "reference", name: "Earth, terminator, GEO belt", color: "#7dd3fc", on: true },
  { id: "navigation", name: "GNSS navigation shells", color: "#fbbf24", on: true },
  { id: "broadband", name: "LEO broadband megaconstellations", color: "#38bdf8", on: true },
  { id: "mobile", name: "Mobile satellite service", color: "#a78bfa", on: true },
  { id: "earthobs", name: "Weather / Earth observation", color: "#34d399", on: true },
];

const SRC = {
  gpsNasa: ["NASA — GPS overview", "https://www.nasa.gov/directorates/somd/space-communications-navigation-program/gps/"],
  gpsNavcen: ["USCG NavCen — GPS overview", "https://www.navcen.uscg.gov/global-positioning-system-overview"],
  galileoEsa: ["ESA — Galileo 30-satellite constellation", "https://www.esa.int/Space_in_Member_States/Spain/Galileo_una_constelacion_de_30_satelites_de_navegacion"],
  glonassIac: ["GLONASS IAC — constellation parameters", "https://glonass-iac.ru/en/about_glonass/"],
  beidouEo: ["eoPortal — BeiDou / Compass orbit summary", "https://www.eoportal.org/satellite-missions/cnss"],
  starlink: ["Starlink — technology and current constellation summary", "https://www.starlink.com/technology"],
  onewebEo: ["eoPortal — OneWeb minisatellite constellation", "https://www.eoportal.org/satellite-missions/oneweb"],
  iridium: ["Iridium — network overview", "https://www.iridium.com/network"],
  iridiumEo: ["eoPortal — Iridium NEXT architecture", "https://www.eoportal.org/satellite-missions/iridium-next"],
  jpssNoaa: ["NOAA — JPSS fact sheet", "https://www.nesdis.noaa.gov/s3/2024-12/JPSS-factsheet.pdf"],
};

export const CONSTELLATIONS = [
  {
    id: "gps",
    layer: "navigation",
    name: "GPS / Navstar",
    operator: "United States Space Force / US government",
    purpose: "Positioning, navigation, timing",
    short: "GPS",
    introYear: 1978,
    matureYear: 1995,
    currentSatellites: 31,
    color: "#fbbf24",
    facts: [
      "NASA summarizes GPS as at least 24 satellites in six 55° MEO planes at about 20,200 km altitude, circling Earth every 12 hours.",
      "The viewer draws the nominal 24-slot Walker-style shell; extra operational spares are summarized in the dossier rather than packed into exact live slots.",
      "The mathematical reason GPS sits far above LEO is visibility: higher altitude gives a wide Earth footprint and stable repeat geometry, at the cost of signal delay and launch energy.",
    ],
    sources: [SRC.gpsNasa, SRC.gpsNavcen],
    milestones: [
      { year: 1978, count: 1, label: "first NAVSTAR launch" },
      { year: 1995, count: 24, label: "full operational capability era" },
      { year: 2026, count: 31, label: "30+ operational satellites typical" },
    ],
    shells: [{ id: "gps-m", altitudeKm: 20200, inclinationDeg: 55, planes: 6, satsPerPlane: 4, satellites: 24, renderSatellites: 24, phasing: 1 }],
  },
  {
    id: "glonass",
    layer: "navigation",
    name: "GLONASS",
    operator: "Russia",
    purpose: "Positioning, navigation, timing",
    short: "GLO",
    introYear: 1982,
    matureYear: 1995,
    currentSatellites: 24,
    color: "#f97316",
    facts: [
      "The nominal GLONASS space segment uses 24 satellites in three orbital planes, eight per plane, at about 19,100 km altitude and 64.8° inclination.",
      "Its higher inclination than GPS improves geometry at high latitudes; the viewer shows that by tipping the planes farther toward the poles.",
      "As with all shells here, the exact slot health and ephemerides are intentionally omitted.",
    ],
    sources: [SRC.glonassIac],
    milestones: [
      { year: 1982, count: 1, label: "first launch" },
      { year: 1995, count: 24, label: "24-satellite deployment" },
      { year: 2002, count: 7, label: "post-Soviet degradation low point" },
      { year: 2026, count: 24, label: "nominal architecture" },
    ],
    shells: [{ id: "glonass-m", altitudeKm: 19100, inclinationDeg: 64.8, planes: 3, satsPerPlane: 8, satellites: 24, renderSatellites: 24, phasing: 0.5 }],
  },
  {
    id: "galileo",
    layer: "navigation",
    name: "Galileo",
    operator: "European Union / ESA / EUSPA",
    purpose: "Civil-controlled GNSS",
    short: "GAL",
    introYear: 2011,
    matureYear: 2022,
    currentSatellites: 30,
    color: "#fde047",
    facts: [
      "ESA describes Galileo as 30 satellites in three orbital planes at 23,222 km altitude and 56° inclination, with a roughly 14-hour orbit.",
      "The higher altitude compared with GPS is visible in the viewer as a slightly larger MEO shell.",
      "The model draws the planned 30-position architecture, not real-time satellite health.",
    ],
    sources: [SRC.galileoEsa],
    milestones: [
      { year: 2011, count: 2, label: "first operational Galileo satellites" },
      { year: 2016, count: 18, label: "initial services era" },
      { year: 2022, count: 24, label: "24 operational satellites reported" },
      { year: 2026, count: 30, label: "full design shell shown" },
    ],
    shells: [{ id: "galileo-m", altitudeKm: 23222, inclinationDeg: 56, planes: 3, satsPerPlane: 10, satellites: 30, renderSatellites: 30, phasing: 1 }],
  },
  {
    id: "beidou",
    layer: "navigation",
    name: "BeiDou-3 composite",
    operator: "China",
    purpose: "GNSS with MEO + IGSO + GEO components",
    short: "BDS",
    introYear: 2000,
    matureYear: 2020,
    currentSatellites: 30,
    color: "#facc15",
    facts: [
      "BeiDou differs from GPS/Galileo/GLONASS because its global system combines MEO satellites with inclined geosynchronous and geostationary spacecraft.",
      "The MEO core is drawn near 21,528 km and 55° inclination; three IGSO proxies and three GEO proxies show why the system has regional-strength geometry over Asia-Pacific longitudes.",
      "The geostationary markers are schematic longitudes, not current stationkeeping data.",
    ],
    sources: [SRC.beidouEo],
    milestones: [
      { year: 2000, count: 1, label: "BeiDou-1 era begins" },
      { year: 2012, count: 16, label: "regional service era" },
      { year: 2020, count: 30, label: "BeiDou-3 global system completed" },
      { year: 2026, count: 30, label: "composite shell shown" },
    ],
    shells: [
      { id: "beidou-meo", altitudeKm: 21528, inclinationDeg: 55, planes: 3, satsPerPlane: 8, satellites: 24, renderSatellites: 24, phasing: 1 },
      { id: "beidou-igso", altitudeKm: 35786, inclinationDeg: 55, planes: 3, satsPerPlane: 1, satellites: 3, renderSatellites: 3, phasing: 0, longitudeLocked: true },
      { id: "beidou-geo", altitudeKm: 35786, inclinationDeg: 0, planes: 1, satsPerPlane: 3, satellites: 3, renderSatellites: 3, phasing: 0, longitudeLocked: true },
    ],
  },
  {
    id: "iridium",
    layer: "mobile",
    name: "Iridium NEXT",
    operator: "Iridium Communications",
    purpose: "Global mobile voice/data + hosted payloads",
    short: "IRI",
    introYear: 1997,
    matureYear: 1998,
    currentSatellites: 66,
    color: "#c084fc",
    facts: [
      "Iridium states its network is in LEO at approximately 780 km and uses cross-linked satellites to cover the entire Earth, including high latitudes.",
      "The standard architecture is 66 operational satellites in six near-polar planes, 11 per plane.",
      "The 2019 Iridium NEXT upgrade replaced the constellation without service interruption; the viewer shows the NEXT-era architecture.",
    ],
    sources: [SRC.iridium, SRC.iridiumEo],
    milestones: [
      { year: 1997, count: 5, label: "first-generation launches begin" },
      { year: 1998, count: 66, label: "global service architecture" },
      { year: 2019, count: 66, label: "Iridium NEXT upgrade complete" },
      { year: 2026, count: 66, label: "66-slot operational architecture" },
    ],
    shells: [{ id: "iridium-leo", altitudeKm: 780, inclinationDeg: 86.4, planes: 6, satsPerPlane: 11, satellites: 66, renderSatellites: 66, phasing: 0.5 }],
  },
  {
    id: "oneweb",
    layer: "broadband",
    name: "Eutelsat OneWeb Gen 1",
    operator: "Eutelsat Group",
    purpose: "LEO broadband, enterprise / mobility / government",
    short: "OW",
    introYear: 2019,
    matureYear: 2023,
    currentSatellites: 648,
    color: "#22d3ee",
    facts: [
      "OneWeb's first-generation constellation is commonly summarized as 648 satellites at roughly 1,200 km in 12 near-polar orbital planes.",
      "The viewer draws 144 proxy satellites, one visual marker for several real spacecraft, so the pattern remains legible and fast in a browser.",
      "The higher LEO altitude gives a bigger horizon angle than Starlink but also a longer path length and longer natural orbital lifetime.",
    ],
    sources: [SRC.onewebEo],
    milestones: [
      { year: 2019, count: 6, label: "first OneWeb satellites" },
      { year: 2021, count: 182, label: "deployment ramp" },
      { year: 2023, count: 648, label: "first-generation constellation completed" },
      { year: 2026, count: 648, label: "Gen 1 shell shown" },
    ],
    shells: [{ id: "oneweb-leo", altitudeKm: 1200, inclinationDeg: 87.9, planes: 12, satsPerPlane: 12, satellites: 648, renderSatellites: 144, phasing: 1 }],
  },
  {
    id: "starlink",
    layer: "broadband",
    name: "Starlink representative shell",
    operator: "SpaceX",
    purpose: "LEO broadband megaconstellation",
    short: "STL",
    introYear: 2018,
    matureYear: 2026,
    currentSatellites: 6750,
    color: "#38bdf8",
    facts: [
      "SpaceX describes Starlink as thousands of satellites in low Earth orbit, commonly around 550 km, with a current fleet above 6,750 satellites at the source-check date.",
      "Only a representative 53° shell is drawn here. The real system uses multiple authorized and operational shells, revisions, insertion orbits, and ongoing maneuvers.",
      "The timeline makes the mathematical point of a megaconstellation: at low altitude, each satellite sees less Earth, so large counts substitute for MEO height.",
    ],
    sources: [SRC.starlink],
    milestones: [
      { year: 2018, count: 2, label: "pathfinder satellites" },
      { year: 2019, count: 60, label: "first large Starlink launch" },
      { year: 2021, count: 1700, label: "consumer service ramp" },
      { year: 2026, count: 6750, label: "SpaceX page: over 6,750 in orbit" },
    ],
    shells: [{ id: "starlink-leo", altitudeKm: 550, inclinationDeg: 53, planes: 24, satsPerPlane: 12, satellites: 6750, renderSatellites: 288, phasing: 1 }],
  },
  {
    id: "jpss",
    layer: "earthobs",
    name: "NOAA JPSS / polar weather",
    operator: "NOAA / NASA acquisition partnership",
    purpose: "Weather forecasting and environmental observation",
    short: "JPSS",
    introYear: 2011,
    matureYear: 2032,
    currentSatellites: 5,
    color: "#34d399",
    facts: [
      "NOAA's JPSS fact sheet describes polar-orbiting weather satellites that pass over the poles about 14 times per day, observing the whole Earth twice per day.",
      "This layer is intentionally small beside the broadband swarms: Earth-observation constellations often use fewer, sensor-rich spacecraft in sun-synchronous orbits.",
      "The schematic uses the JPSS altitude of about 512 miles / 824 km and a near-polar sun-synchronous inclination.",
    ],
    sources: [SRC.jpssNoaa],
    milestones: [
      { year: 2011, count: 1, label: "Suomi NPP pathfinder" },
      { year: 2017, count: 2, label: "JPSS-1 / NOAA-20" },
      { year: 2022, count: 3, label: "JPSS-2 / NOAA-21" },
      { year: 2032, count: 5, label: "series continuity plan" },
    ],
    shells: [{ id: "jpss-polar", altitudeKm: 824, inclinationDeg: 98.7, planes: 1, satsPerPlane: 5, satellites: 5, renderSatellites: 5, phasing: 0 }],
  },
];

export const TIMELINE_EVENTS = [
  { year: 1957, label: "Sputnik proves satellite radio tracking", note: "GPS history begins with Doppler tracking lessons from Sputnik-era observations." },
  { year: 1978, label: "First NAVSTAR GPS launch", constellation: "gps" },
  { year: 1982, label: "First GLONASS launches", constellation: "glonass" },
  { year: 1995, label: "MEO navigation becomes global infrastructure", note: "GPS and GLONASS both reach 24-satellite-era architecture in the mid-1990s." },
  { year: 1998, label: "Iridium global mobile constellation", constellation: "iridium" },
  { year: 2011, label: "Galileo and Suomi NPP era", constellation: "galileo" },
  { year: 2019, label: "LEO broadband swarm era begins", note: "OneWeb and Starlink deployments turn satellite counts from dozens into hundreds/thousands." },
  { year: 2020, label: "BeiDou-3 global completion", constellation: "beidou" },
  { year: 2023, label: "OneWeb Gen 1 completed", constellation: "oneweb" },
  { year: 2026, label: "Megaconstellation visibility debate", note: "Starlink scale makes debris, conjunction coordination, astronomy brightness, and deorbit practices part of the viewer." },
];

export const VIEW_PRESETS = {
  overview: { pos: [0, 24, 68], target: [0, 0, 0] },
  leo: { pos: [0, 10, 18], target: [0, 0, 0] },
  meo: { pos: [0, 28, 45], target: [0, 0, 0] },
  geo: { pos: [0, 50, 80], target: [0, 0, 0] },
  polar: { pos: [0, 78, 0.1], target: [0, 0, 0] },
};
