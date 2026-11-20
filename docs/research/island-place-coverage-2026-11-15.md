# Country Viewer island/place coverage update (2026-11-15)

## Coverage boundary

The viewer now has a small, searchable island-reference starter register, not
“all islands and territories.” USGS describes GNIS as the official repository
for domestic United States geographic names and associated areas; it is not a
global island gazetteer. GNIS records include names, feature class, state/county,
and geographic coordinates; a GNIS primary point is not island polygon/shoreline
geometry. This project therefore keeps the country's CIA Factbook profile index
separate from named place records and does not manufacture country profiles for
islands or territories.

Primary scope references:

- USGS FAQ, “What is the Geographic Names Information System (GNIS)?”
  <https://www.usgs.gov/faqs/what-geographic-names-information-system-gnis>
- USGS, “Hydrography and Geographic Names”
  <https://www.usgs.gov/national-hydrography/hydrography-and-geographic-names>

## Added place examples

| Search label | Coordinate (lat, lon) | Record status / basis |
| --- | --- | --- |
| Tasmania | `-42.0409059, 146.8087322` | Approximate geographic-centre reference from GeoCountries; not an official Australian gazetteer point or a surveyed centroid. |
| Flinders Island | `-39.860000610, 147.910003662` | Australian place-name authority ID TAS05352, coordinates attributed to Geoscience Australia by a secondary Australian Place Names index. |
| Botany Bay Island, Charleston County, SC | `32.5410186, -80.2325979` | GNIS ID 1220903 cross-referenced by Wikidata; not directly queried against the current USGS record in this change. Marked unverified. |
| Oak Island, Beaufort County, SC | `32.4243591, -80.5967729` | GNIS ID 1225123 cross-referenced by Wikidata; specifically the South Carolina record, not Oak Island, Nova Scotia. Marked unverified. |
| Florida Keys | `24.56, -81.78` | Generalized context anchor reused from the Florida subsurface app near Key West; not an individual key, GNIS feature or island-group centroid. |

In addition, seven directly verified island points from the retained
`resources/city-subsurface/gnis-territory-source-register-2026-10-22.json` are
now searchable: Guam (1389704), Tutuila Island (1389316), Water Island
(1614413), Buck Island (1613753), Midway Islands (1393085), Sand Island
(1393170), and Eastern Island (1393009). The source register records the USGS
Geocoder identity checks and bounded Midway queries; these are official GNIS
primary points, not shorelines or island polygons. Coverage across these four
territory frames is a useful seed, not every U.S. island or territory.

The exact row notes and source identifiers are in `js/country-viewer-islands.js`.
Botany Bay Island and Oak Island currently carry GNIS IDs as **secondary-source
cross-references**, but `verified: 0`; they must not appear as directly
verified USGS query results. The Florida Keys row remains an approximate
context point rather than a claim that a single GNIS “Florida Keys” island
record represents the archipelago. Tasmania is an island feature in Australia,
not a separate country profile.

Coordinate references reviewed:

- GeoCountries, Tasmania map/reference coordinates:
  <https://www.geocountries.com/map/australia/tasmania>.
- Australian Place Names secondary index, Flinders Island (attributes the
  authority record to Geoscience Australia):
  <https://geodata.us/australia_names_maps/aumaps.php?fid=235685&f=234>.
- Wikidata, Botany Bay Island (GNIS ID 1220903; coordinate statement):
  <https://www.wikidata.org/wiki/Q32845158>.
- Wikidata, Oak Island, South Carolina (GNIS ID 1225123; coordinate statement):
  <https://www.wikidata.org/wiki/Q49665274>.
- Existing generalized Florida Keys context: `js/city-subsurface-data-florida.js`
  (not an island inventory or a separate USGS record).
- Retained territorial GNIS register and query provenance:
  `resources/city-subsurface/gnis-territory-source-register-2026-10-22.json`.

## Implementation

The Country Viewer search indexes these rows alongside its limited city and
locality packs. Selecting a coordinate-bearing place highlights it and focuses
the map; “Zoom to selected place” is available as a second explicit action.
The detail view displays coordinates, point status, and source. The page text
and source metadata disclose that the list is limited and mixed-source.

### Next data-quality step

For a broader U.S. coverage pass, use current USGS GNIS downloadable/domestic
names data or bounded official service queries, preserve each returned
FEATURE_ID, feature class, state/county and primary point, and publish the
extract date and query boundaries. For Australian and other non-U.S. islands,
use each national names authority (e.g. Geoscience Australia's Gazetteer of
Placenames) rather than extending GNIS beyond its remit. Keep boundary/shoreline
geometry sourced separately from a point gazetteer.
