/**
 * Curated USGS GNIS / The National Map Gazetteer register for the SoCal theater.
 *
 * Source service: https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer
 * Service metadata: "Data Refreshed July, 2026". Curated for this app on
 * 2026-10-03. Coordinates are rounded primary/control locations in WGS 84.
 * MultiPoint features use one representative point; a point locates a named
 * feature but does not describe its extent. GNIS does not contain roads.
 *
 * This is intentionally a readable landmark set, not a dump of every GNIS
 * record in the 700 km theater. tools/socal-gazetteer-query.mjs documents the
 * reproducible ArcGIS REST query used to refresh the selected names.
 */

export const GAZETTEER_META = Object.freeze({
  title: "USGS The National Map Gazetteer / GNIS",
  refreshed: "July 2026",
  curated: "2026-10-03",
  service: "https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer",
  caveat: "A GNIS control point identifies a named feature; it is not a boundary, footprint, survey marker, or navigation fix.",
});

// name, longitude, latitude, feature class, county, optional GNIS feature id,
// label priority (1 = label by default; 2 = searchable/clickable point only).
const RAW = [
  ["Los Angeles",-118.2437,34.0522,"Populated Place","Los Angeles",null,1],
  ["Long Beach",-118.1937,33.7701,"Populated Place","Los Angeles",null,1],
  ["San Diego",-117.1611,32.7157,"Populated Place","San Diego",null,1],
  ["Santa Barbara",-119.6982,34.4208,"Populated Place","Santa Barbara",null,1],
  ["Bakersfield",-119.0187,35.3733,"Populated Place","Kern",null,1],
  ["San Bernardino",-117.2898,34.1083,"Populated Place","San Bernardino",null,1],
  ["Riverside",-117.3962,33.9533,"Populated Place","Riverside",null,1],
  ["Palm Springs",-116.5453,33.8303,"Populated Place","Riverside",null,1],
  ["Barstow",-117.0173,34.8958,"Populated Place","San Bernardino",null,1],
  ["Victorville",-117.2912,34.5361,"Populated Place","San Bernardino",null,2],
  ["Lancaster",-118.1367,34.6868,"Populated Place","Los Angeles",null,2],
  ["Palmdale",-118.1165,34.5794,"Populated Place","Los Angeles",null,2],
  ["Mojave",-118.1739,35.0525,"Populated Place","Kern",null,2],
  ["Tehachapi",-118.4489,35.1322,"Populated Place","Kern",null,2],
  ["Bishop",-118.3997,37.3614,"Populated Place","Inyo",null,1],
  ["Lone Pine",-118.0637,36.6063,"Populated Place","Inyo",null,2],
  ["Mammoth Lakes",-118.9721,37.6485,"Populated Place","Mono",null,1],
  ["Lee Vining",-119.1210,37.9576,"Populated Place","Mono",null,2],
  ["Bodie",-119.0126,38.2121,"Populated Place","Mono",null,1],
  ["Randsburg",-117.6564,35.3680,"Populated Place","Kern",null,2],
  ["Calico",-116.8686,34.9480,"Populated Place","San Bernardino",null,2],
  ["Wrightwood",-117.5975,34.3608,"Populated Place","San Bernardino",null,2],
  ["Big Bear Lake",-116.9114,34.2439,"Populated Place","San Bernardino",null,1],
  ["Solvang",-120.1376,34.5958,"Populated Place","Santa Barbara",null,2],
  ["Mount Whitney",-118.2923,36.5786,"Summit","Inyo",254067,1],
  ["Mount Williamson",-118.3117,36.6569,"Summit","Inyo",null,2],
  ["Mount Langley",-118.2384,36.5233,"Summit","Inyo",null,2],
  ["White Mountain Peak",-118.2557,37.6341,"Summit","Mono",null,1],
  ["Mammoth Mountain",-119.0326,37.6308,"Summit","Mono",null,1],
  ["Mount Dana",-119.2210,37.8999,"Summit","Mono",null,2],
  ["Olancha Peak",-118.1181,36.2627,"Summit","Tulare",null,2],
  ["Telescope Peak",-117.0892,36.1698,"Summit","Inyo",null,1],
  ["San Gorgonio Mountain",-116.8260,34.0992,"Summit","San Bernardino",null,1],
  ["San Jacinto Peak",-116.6792,33.8142,"Summit","Riverside",null,1],
  ["Mount San Antonio (Old Baldy)",-117.6461,34.2891,"Summit","Los Angeles",null,1],
  ["Mount Baden-Powell",-117.7646,34.3586,"Summit","Los Angeles",null,2],
  ["Mount Wilson",-118.0616,34.2237,"Summit","Los Angeles",null,1],
  ["San Gabriel Peak",-118.0985,34.2433,"Summit","Los Angeles",null,2],
  ["Cucamonga Peak",-117.5853,34.2227,"Summit","San Bernardino",270704,2],
  ["Mount Pinos",-119.1454,34.8125,"Summit","Ventura",null,1],
  ["Cajon Pass",-117.4284,34.3258,"Gap","San Bernardino",270155,1],
  ["Tehachapi Pass",-118.2990,35.1025,"Gap","Kern",null,1],
  ["San Gorgonio Pass",-116.6503,33.9286,"Gap","Riverside",null,1],
  ["Walker Pass",-118.0262,35.6638,"Gap","Kern",null,2],
  ["Vincent Gap",-117.7523,34.3736,"Gap","Los Angeles",null,2],
  ["Islip Saddle",-117.8506,34.3569,"Gap","Los Angeles",null,2],
  ["Sierra Nevada",-118.5000,36.5780,"Range","Inyo",null,1],
  ["San Gabriel Mountains",-117.9500,34.3000,"Range","Los Angeles",null,1],
  ["San Bernardino Mountains",-116.9000,34.1700,"Range","San Bernardino",null,1],
  ["Santa Ynez Mountains",-119.7000,34.5000,"Range","Santa Barbara",null,2],
  ["Tehachapi Mountains",-118.5830,35.1000,"Range","Kern",null,2],
  ["Panamint Range",-117.0870,36.1670,"Range","Inyo",null,2],
  ["Coso Range",-117.7545,36.1618,"Range","Inyo",240959,2],
  ["Bodie Hills",-119.0868,38.2347,"Range","Mono",266473,2],
  ["Owens Valley",-118.1800,36.8000,"Valley","Inyo",null,1],
  ["Long Valley",-118.8900,37.7000,"Valley","Mono",null,1],
  ["San Fernando Valley",-118.3733,34.2514,"Valley","Los Angeles",null,2],
  ["Antelope Valley",-118.0638,34.8084,"Valley","Los Angeles",1930539,1],
  ["Victor Valley",-117.3000,34.5000,"Valley","San Bernardino",null,2],
  ["Death Valley",-116.8170,36.2466,"Basin","Inyo",270787,1],
  ["Badwater Basin",-116.8259,36.2502,"Basin","Inyo",255963,2],
  ["Salton Sink",-115.7000,33.3000,"Basin","Imperial",null,1],
  ["Mono Lake",-119.0275,38.0070,"Lake","Mono",null,1],
  ["June Lake",-119.0760,37.7797,"Lake","Mono",null,2],
  ["Silverwood Lake",-117.3245,34.2903,"Reservoir","San Bernardino",null,1],
  ["Big Bear Lake",-116.9731,34.2439,"Reservoir","San Bernardino",null,1],
  ["Lake Arrowhead",-117.1859,34.2522,"Reservoir","San Bernardino",null,2],
  ["Lake Perris",-117.1773,33.8659,"Reservoir","Riverside",null,2],
  ["Lake Mathews",-117.4512,33.8495,"Reservoir","Riverside",null,2],
  ["Castaic Lake",-118.6104,34.5355,"Reservoir","Los Angeles",null,2],
  ["Pyramid Lake",-118.7509,34.6425,"Reservoir","Los Angeles",null,2],
  ["Salton Sea",-115.8325,33.3134,"Lake","Imperial",254500,1],
  ["Santa Barbara Channel",-119.7000,34.2500,"Channel","Santa Barbara",253810,1],
  ["San Pedro Bay",-118.2000,33.7000,"Bay","Los Angeles",null,2],
  ["Point Conception",-120.4710,34.4486,"Cape","Santa Barbara",null,1],
  ["El Mirage Lake",-117.6048,34.6231,"Flat","San Bernardino",null,2],
  ["Rogers Dry Lake",-117.8270,34.8900,"Flat","Kern",null,1],
  ["Searles Lake",-117.3300,35.7100,"Flat","San Bernardino",null,2],
];

const slug = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const SOCAL_GAZETTEER = RAW.map(([name, lon, lat, featureClass, county, gnisId, priority]) => ({
  id: `gnis-${gnisId || slug(`${name}-${county}-${featureClass}`)}`,
  layer: "gazetteer",
  tier: "official",
  name,
  lon,
  lat,
  kind: "gazetteer",
  depthM: 0,
  featureClass,
  county,
  gnisId: gnisId || null,
  labelPriority: priority,
  facts: [
    `${featureClass} in ${county} County; embedded as an offline USGS Gazetteer control point.`,
    GAZETTEER_META.caveat,
  ],
  sources: [
    `${GAZETTEER_META.title} — ${GAZETTEER_META.refreshed} service refresh`,
    GAZETTEER_META.service,
  ],
}));
