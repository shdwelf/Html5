// Curated island reference points for the offline country viewer.
// This is a small, mixed-source starter register, not an all-islands census.
// Rows follow the city gazetteer shape: [name, class, FTT, context, lat, lon,
// elevation, GNIS id, verified, note, source]. A point is a named/reference
// location, never a shoreline polygon or island centroid unless stated.
export const ISLAND_REFERENCE_ROWS = [
  ["Tasmania", "Island", "phys.island", "Australia · Tasmania", -42.0409059, 146.8087322, null, null, 0,
    "Approximate geographic-centre reference supplied by GeoCountries; not an Australian Gazetteer of Placenames authority point or a surveyed island centroid. Tasmania is part of Australia, not a separate country profile.", "https://www.geocountries.com/map/australia/tasmania"],
  ["Flinders Island", "Island", "phys.island", "Tasmania · Australia", -39.860000610, 147.910003662, null, null, 0,
    "Official Australian place-name entry (authority ID TAS05352) and coordinates attributed to Geoscience Australia by the secondary Australian Place Names index. GNIS does not cover Australia.", "https://geodata.us/australia_names_maps/aumaps.php?fid=235685&f=234"],
  ["Botany Bay Island", "Island", "phys.island", "Charleston County · South Carolina", 32.5410186, -80.2325979, null, "1220903", 0,
    "GNIS Feature ID 1220903 and coordinates are cross-referenced by Wikidata; GNIS point, not island shoreline. Verify against the live USGS Domestic Names record before using as authoritative survey data.", "https://www.wikidata.org/wiki/Q32845158"],
  ["Oak Island", "Island", "phys.island", "Beaufort County · South Carolina", 32.4243591, -80.5967729, null, "1225123", 0,
    "GNIS Feature ID 1225123 and coordinate are cross-referenced by Wikidata; GNIS primary point, not island shoreline. This is the Beaufort County, SC island, not Oak Island, Nova Scotia.", "https://www.wikidata.org/wiki/Q49665274"],
  ["Florida Keys", "Island group · generalized reference", "phys.island", "Florida · United States", 24.56, -81.78, null, null, 0,
    "Generalized Florida Keys context reference reused from the Florida subsurface frame near Key West; not an individual island, GNIS feature, or group centroid. The Keys are present in the map context but not as an island-by-island GNIS extract.", "js/city-subsurface-data-florida.js (Florida Keys context)"],
  // Verified island points from the retained 2026-10-22 GNIS territorial register.
  ["Guam","Island","phys.island","Territory of Guam · US territory",13.4444444,144.7366667,null,"1389704",1,"Island frame anchor. USGS GNIS Geocoder (GNIS), FEATURE_ID=1389704; exact official name and Islands type in Territory of Guam cross-checked 2026-10-22. Stored coordinate is the GNIS primary point; it is not a island polygon, shoreline, or land-area centroid.","resources/city-subsurface/gnis-territory-source-register-2026-10-22.json"],
  ["Tutuila Island","Island","phys.island","Eastern District · US territory",-14.2997222,-170.7225,null,"1389316",1,"The Geocoder returned Eastern District as this island record's county value; that returned primary-county value is preserved and is not a claim that Tutuila lies only in the Eastern District. USGS GNIS Geocoder (GNIS), FEATURE_ID=1389316; exact official name and Islands type in Eastern District cross-checked 2026-10-22. Stored coordinate is the GNIS primary point; it is not a island polygon, shoreline, or land-area centroid.","resources/city-subsurface/gnis-territory-source-register-2026-10-22.json"],
  ["Water Island","Island","phys.island","Saint Thomas Island · US territory",18.3207894,-64.9512572,null,"1614413",1,"USGS GNIS Geocoder (GNIS), FEATURE_ID=1614413; exact official name and Islands type in Saint Thomas Island cross-checked 2026-10-22. Stored coordinate is the GNIS primary point; it is not a island polygon, shoreline, or land-area centroid.","resources/city-subsurface/gnis-territory-source-register-2026-10-22.json"],
  ["Buck Island","Island","phys.island","Saint Croix Island · US territory",17.7869174,-64.6193064,null,"1613753",1,"The Saint Croix Island county record was selected rather than the same-name Buck Island in Saint Thomas Island county (FEATURE_ID 1613754). USGS GNIS Geocoder (GNIS), FEATURE_ID=1613753; exact official name and Islands type in Saint Croix Island cross-checked 2026-10-22. Stored coordinate is the GNIS primary point; it is not a island polygon, shoreline, or land-area centroid.","resources/city-subsurface/gnis-territory-source-register-2026-10-22.json"],
  ["Midway Islands","Island","phys.island","U.S. Minor Outlying Islands · US territory",28.2052778,-177.3613889,null,"1393085",1,"The Islands record was selected rather than the separate Midway Islands Counties & Political Divisions record (FEATURE_ID 1802699) at the same returned point. USGS GNIS Geocoder (GNIS), bounded query (latitudeMin/longitudeMin/latitudeMax/longitudeMax around Midway; State returned null), FEATURE_ID=1393085; exact official name and Islands type in U.S. Minor Outlying Islands cross-checked 2026-10-22. Stored coordinate is the GNIS primary point; it is not a island polygon, shoreline, or land-area centroid.","resources/city-subsurface/gnis-territory-source-register-2026-10-22.json"],
  ["Sand Island","Island","phys.island","U.S. Minor Outlying Islands · US territory",28.2041667,-177.3783333,null,"1393170",1,"Bounded query isolates the Midway Sand Island from the many same-name island records elsewhere. USGS GNIS Geocoder (GNIS), bounded query (latitudeMin/longitudeMin/latitudeMax/longitudeMax around Midway; State returned null), FEATURE_ID=1393170; exact official name and Islands type in U.S. Minor Outlying Islands cross-checked 2026-10-22. Stored coordinate is the GNIS primary point; it is not a island polygon, shoreline, or land-area centroid.","resources/city-subsurface/gnis-territory-source-register-2026-10-22.json"],
  ["Eastern Island","Island","phys.island","U.S. Minor Outlying Islands · US territory",28.2061111,-177.3302778,null,"1393009",1,"The Midway record was selected rather than another same-name U.S. Minor Outlying Islands record (FEATURE_ID 1390268) whose returned point lies far outside the Midway frame. USGS GNIS Geocoder (GNIS), bounded query (latitudeMin/longitudeMin/latitudeMax/longitudeMax around Midway; State returned null), FEATURE_ID=1393009; exact official name and Islands type in U.S. Minor Outlying Islands cross-checked 2026-10-22. Stored coordinate is the GNIS primary point; it is not a island polygon, shoreline, or land-area centroid.","resources/city-subsurface/gnis-territory-source-register-2026-10-22.json"]
];

export const ISLAND_REFERENCE_META = Object.freeze({
  coverage: "Curated examples include seven verified GNIS island points across Guam, American Samoa, the U.S. Virgin Islands and Midway, plus named local examples; not a complete global or domestic island extract.",
  gnisScope: "USGS GNIS covers United States domestic/associated areas, not Tasmania or a global island inventory.",
  sources: Object.freeze([
    "https://www.usgs.gov/faqs/what-geographic-names-information-system-gnis",
    "https://www.usgs.gov/national-hydrography/hydrography-and-geographic-names",
    "resources/city-subsurface/gnis-territory-source-register-2026-10-22.json",
    "https://www.geocountries.com/map/australia/tasmania",
    "https://geodata.us/australia_names_maps/aumaps.php?fid=235685&f=234",
    "https://www.wikidata.org/wiki/Q32845158",
    "https://www.wikidata.org/wiki/Q49665274",
  ]),
});
