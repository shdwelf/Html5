#!/usr/bin/env node
/** Generate USGS 3DEP getSamples URLs for the two theaters' DEM control sets. */
const BASE = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples";
const enc = (obj) => encodeURIComponent(JSON.stringify(obj));

function mpUrl(points, label) {
  const geometry = { points, spatialReference: { wkid: 4326 } };
  return { label, n: points.length, url: `${BASE}?geometry=${enc(geometry)}&geometryType=esriGeometryMultipoint&returnFirstValueOnly=true&f=json` };
}
function lineUrl(path, count, label) {
  const geometry = { paths: [path], spatialReference: { wkid: 4326 } };
  return { label, n: count, url: `${BASE}?geometry=${enc(geometry)}&geometryType=esriGeometryPolyline&returnFirstValueOnly=true&sampleCount=${count}&f=json` };
}

/* ---------------- CHEYENNE PLATE: lon -105.25..-104.45, lat 38.60..39.10 */
const cLon = [-105.23, -105.135, -105.04, -104.945, -104.85, -104.755, -104.66];
const cLat = [38.63, 38.72, 38.81, 38.90, 38.99, 39.08];
const cGrid = [];
for (const la of cLat) for (const lo of cLon) cGrid.push([lo, la]);

const cMassif = [
  [-105.0449, 38.8406], // Pikes Peak
  [-105.0608, 38.8635], // Devils Playground (Teller Co high point area)
  [-104.9935, 38.7912], // Almagre Mountain
  [-104.9480, 38.7542], // Mount Rosa
  [-104.9545, 38.8315], // Cameron Cone
  [-104.9475, 38.8076], // Mount Garfield
  [-104.9419, 38.8094], // Mount Arthur
  [-104.8775, 38.7878], // Mount Cutler
  [-104.9031, 38.8002], // Mount Buckhorn
  [-104.9115, 38.7474], // Saint Peters Dome
  [-104.9149, 38.7333], // Sugarloaf Mountain
  [-104.9221, 38.7267], // Mount Vigil
  [-104.8675, 38.7440], // Cheyenne Mountain summit
  [-104.8806, 38.7371], // Cheyenne Mountain west high point
  [-104.9071, 38.9588], // Blodgett Peak
  [-104.9637, 38.8646], // Mount Manitou
  [-105.0449, 38.8406 - 0.012], // Pikes east slope
  [-105.0449 + 0.02, 38.8406], // Pikes west slope (Devils Playground side)
];

const cPlaces = [
  [38.7425, -104.8483], // Cheyenne Mountain Complex (NORAD) published point
  [38.7560, -104.8540], // Cheyenne Mountain State Park (campground side)
  [38.8603, -104.8792], // Garden of the Gods central
  [38.8575, -104.9129], // Manitou Springs
  [38.8339, -104.8209], // Colorado Springs downtown
  [38.9980, -104.8660], // USAFA cadet area
  [38.8352, -104.6981], // Peterson SFB
  [38.7410, -104.7725], // Fort Carson
  [38.9430, -104.5330], // Schriever SFB
  [38.7466, -105.1850], // Cripple Creek
  [38.7087, -105.1419], // Victor
  [38.7240, -105.1270], // Goldfield
  [38.9985, -105.0594], // Woodland Park
  [38.9344, -105.0238], // Green Mountain Falls
  [38.9086, -104.9750], // Cascade
  [38.0728 + 0, -104.8474], // placeholder replaced below
  [38.9162, -105.0306], // Crystal Creek Reservoir
  [38.9808, -104.9700], // Rampart Reservoir
  [38.9571, -105.1798], // Mueller State Park
  [38.8288, -104.7005], // Fountain
  [38.7467, -105.1630], // Mollie Kathleen mine area
].map(([la, lo]) => [lo, la]);
cPlaces[15] = [-104.8474, 39.0728]; // Monument

const cLoop = [ // Pikes massif ridge loop
  [-105.0449, 38.8406], [-104.9935, 38.7912], [-104.9480, 38.7542], [-104.9115, 38.7474],
  [-104.9149, 38.7333], [-104.9221, 38.7267], [-104.8675, 38.7440], [-104.8806, 38.7371],
  [-104.8775, 38.7878], [-104.9031, 38.8002], [-104.9475, 38.8076], [-104.9545, 38.8315],
  [-105.0449, 38.8406],
];
const cRampart = [[-105.0362, 39.0711], [-105.0158, 38.9757], [-104.975, 38.948], [-104.94, 38.912], [-104.905, 38.870]];
const cFountain = [[-104.847, 39.073], [-104.821, 38.98], [-104.821, 38.89], [-104.821, 38.834], [-104.75, 38.79], [-104.70, 38.75], [-104.70, 38.70]];
const cCheyCanyons = [[-104.8643, 38.7907], [-104.890, 38.792], [-104.9145, 38.7867], [-104.9045, 38.778], [-104.8992, 38.766], [-104.880, 38.772], [-104.8638, 38.7905]];
const cUtePass = [[-104.9129, 38.8575], [-104.975, 38.909], [-105.0238, 38.9344], [-105.0594, 38.9985]];
const cCripple = [[-105.185, 38.7466], [-105.1419, 38.7087], [-105.127, 38.724], [-105.163, 38.756], [-105.1836, 38.7795]];

/* ---------------- ANGELES PLATE: lon -118.35..-117.55, lat 33.95..34.55 */
const aLon = [-118.33, -118.2033, -118.0767, -117.95, -117.8233, -117.6967, -117.57];
const aLat = [33.97, 34.0633, 34.1567, 34.25, 34.3433, 34.4367, 34.53];
const aGrid = [];
for (const la of aLat) for (const lo of aLon) aGrid.push([lo, la]);

const aCrest = [
  [-118.0616, 34.2237], // Mount Wilson
  [-118.0985, 34.2433], // San Gabriel Peak
  [-118.1048, 34.2467], // Mount Disappointment
  [-118.0836, 34.2350], // Occidental Peak
  [-118.1204, 34.2834], // Strawberry Peak
  [-118.1538, 34.2856], // Josephine Peak
  [-118.1051, 34.2586], // Red Box Gap
  [-118.0286, 34.2971], // Vetter Mountain
  [-118.0345, 34.3818], // Pacifico Mountain
  [-118.0809, 34.3917], // Mill Creek Summit
  [-117.9695, 34.2132], // Monrovia Peak
  [-117.8471, 34.3188], // Crystal Lake
  [-117.8506, 34.3569], // Islip Saddle
  [-117.8399, 34.3450], // Mount Islip
  [-117.7991, 34.3505], // Throop Peak
  [-117.8056, 34.3412], // Mount Hawkins
  [-117.7814, 34.3592], // Mount Burnham
  [-117.7646, 34.3586], // Mount Baden-Powell
  [-117.7523, 34.3736], // Vincent Gap
  [-117.7565, 34.3247], // Ross Mountain
  [-117.7133, 34.2883], // Iron Mountain
  [-117.6442, 34.3136], // Pine Mountain
  [-117.6359, 34.3032], // Dawson Peak
  [-117.6461, 34.2891], // Mount San Antonio (Baldy)
  [-117.6330, 34.2863], // Mount Harwood
  [-117.5853, 34.2227], // Cucamonga Peak
  [-118.0809 - 0.06, 34.3917 - 0.02], // west of Mill Creek Summit (Three Points area)
];

const aPlaces = [
  [34.28306, -117.74667], // Bridge to Nowhere
  [34.2370, -117.7650],  // East Fork trailhead
  [34.2406, -117.7631],  // Heaton Flat
  [34.290, -117.732],    // Stanley-Miller Mine (west face Iron Mountain)
  [34.2714, -117.7281],  // Allison Mine (MRDS)
  [34.3567, -117.7445],  // Big Horn Mine (MRDS)
  [34.2872, -117.6984],  // Gold Dollar Mine (MRDS)
  [34.3397, -117.6912],  // Native Son Mine (MRDS)
  [34.4000, -118.2176],  // Acton district mines (Red Rover / Puritan area)
  [34.3866, 34.0, -118.1781], // placeholder
  [34.3230, -117.8530],  // Crystal Lake campground
  [34.3260, -118.0260],  // Chilao campground
  [34.3680, -117.6820],  // Table Mountain campground
  [34.2840, -117.6560],  // Manker Flat campground
  [34.2460, -117.7710],  // Spruce Grove trail camp
  [34.1283, -117.9076],  // Azusa
  [34.1067, -117.8067],  // San Dimas
  [34.1064, -117.5931],  // Rancho Cucamonga
  [34.1478, -118.1445],  // Pasadena
  [34.4690, -118.1965],  // Acton
  [34.3608, -117.5975],  // Wrightwood
  [34.2090, -118.3460],  // Sylmar (San Fernando Valley floor north rim)
  [34.4100, -117.9300],  // Palmdale-side desert floor south rim
].map(([la, lo]) => [lo, la]);
aPlaces[9] = [-118.1781, 34.3866]; // Mount Gleason

const aCrestLine1 = [ // San Fernando Valley rim → Wilson → Strawberry → Pacifico
  [-118.476, 34.28], [-118.35, 34.265], [-118.25, 34.26], [-118.15, 34.26], [-118.0616, 34.2237],
  [-118.0985, 34.2433], [-118.1204, 34.2834], [-118.08, 34.32], [-118.0345, 34.3818],
];
const aCrestLine2 = [ // Pacifico → Waterman → Islip → Baden-Powell → Blue Ridge → Baldy → Cucamonga
  [-118.0345, 34.3818], [-118.0, 34.36], [-117.94, 34.36], [-117.8399, 34.345], [-117.7646, 34.3586],
  [-117.730, 34.380], [-117.63, 34.335], [-117.616, 34.328], [-117.6461, 34.2891], [-117.60, 34.25], [-117.5853, 34.2227],
];
const aEastFork = [ // Azusa → trailhead → Bridge → Narrows → Iron Fork
  [-117.9076, 34.1283], [-117.88, 34.18], [-117.84, 34.21], [-117.774, 34.228], [-117.7631, 34.2406],
  [-117.755, 34.26], [-117.74667, 34.28306], [-117.735, 34.29], [-117.725, 34.30],
];
const aBigTujunga = [ // Big Tujunga canyon + West Fork San Gabriel
  [-118.30, 34.25], [-118.24, 34.26], [-118.16, 34.27], [-118.09, 34.265], [-118.045, 34.255],
  [-117.99, 34.255], [-117.955, 34.258], [-117.93, 34.245],
];
const aFloors = [ // desert floor N + San Gabriel Valley floor S multipoint
  [-117.90, 34.51], [-117.75, 34.52], [-117.62, 34.51], [-118.10, 34.50],
  [-117.87, 34.02], [-117.75, 34.03], [-117.62, 34.05], [-118.10, 34.04], [-118.20, 34.05],
  [-118.31, 34.13], [-118.28, 34.34], [-117.60, 34.16],
];

const calls = [
  mpUrl(cGrid, "C1-grid"), mpUrl(cMassif, "C2-massif"), mpUrl(cPlaces, "C3-places"),
  lineUrl(cLoop, 40, "C4-loop"), lineUrl(cRampart, 12, "C5-rampart"),
  lineUrl(cFountain, 12, "C6-fountain"), lineUrl(cCheyCanyons, 16, "C7-cheycanyons"),
  lineUrl(cUtePass, 10, "C8-utepass"), lineUrl(cCripple, 12, "C9-cripple"),
  mpUrl(aGrid, "A1-grid"), mpUrl(aCrest, "A2-crest"), mpUrl(aPlaces, "A3-places"),
  lineUrl(aCrestLine1, 20, "A4-crestline1"), lineUrl(aCrestLine2, 22, "A5-crestline2"),
  lineUrl(aEastFork, 18, "A6-eastfork"), lineUrl(aBigTujunga, 14, "A7-bigtujunga"),
  mpUrl(aFloors, "A8-floors"),
];
for (const c of calls) console.log(`# ${c.label} (${c.n} pts)\n${c.url}\n`);
