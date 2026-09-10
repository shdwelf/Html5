# The ADL Gazetteer Content Standard (ADL GCS v1.2) & Feature Type Thesaurus (FTT)

## 1. The Tripartite Model of Geographic Identity
The **ADL Gazetteer Content Standard (ADL GCS v1.2)** formalizes a gazetteer entry around three mandatory orthogonal pillars:

$$\text{Gazetteer Entry} = \langle \text{Name Set}, \text{Spatial Footprint}, \text{Classification} \rangle$$

```
                       +-------------------------------+
                       |   ADL Gazetteer Entry (GCS)   |
                       +---------------+---------------+
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
+-------v-------+              +-------v-------+              +-------v-------+
|   NAMES SET   |              | SPATIAL FOOTPRINT             | CLASSIFICATION|
+---------------+              +---------------+              +---------------+
| Primary Name  |              | Point Lat/Lon |              | ADL FTT Code  |
| Variant Names |              | Bounding Box  |              | USGS GNIS Cls |
| Language ISO  |              | Footprint Poly|              | Facet Tier    |
| BGN Status    |              | Elevation (m) |              | Scope Notes   |
+---------------+              +---------------+              +---------------+
```

### 1.1 Names Set
- **Primary Name**: The authorized, standard toponym approved by the relevant authority (e.g., U.S. Board on Geographic Names - BGN).
- **Variant Names**: Historical, colloquial, multilingual, or dialectal alternatives (e.g., *"Tis-sa-ack"* for Half Dome, *"Ahwahnee"* for Yosemite Valley).
- **Linguistic Metadata**: ISO 639-2 language code, script, etymology, and historical temporal bounds.

### 1.2 Spatial Footprint
- **Coordinate Reference System (CRS)**: Standardized to **EPSG:4326 (WGS 84)**.
- **Representative Point (Centroid/Label Point)**: Decimal degrees with precision to 6 decimal places ($\approx 0.11\text{ m}$).
- **Bounding Box (BBox)**: 4-tuple $(\text{minLon}, \text{minLat}, \text{maxLon}, \text{maxLat})$ representing the spatial envelope.
- **Elevational Extent**: Elevation in meters and feet above NAVD88 datum.

### 1.3 Classification & ADL Feature Type Thesaurus (FTT)
The ADL FTT is a 6-level faceted thesaurus designed to resolve semantic ambiguities between differing agencies (such as USGS GNIS vs. NGA GNS vs. Alexandria holdings):

| Primary Facet | FTT Code Prefix | Scope & USGS Mappings |
| :--- | :--- | :--- |
| **Physiographic** | `phys.*` | Landforms, peaks, valleys, ranges, canyons, islands, cliffs |
| **Hydrographic** | `hydro.*` | Streams, rivers, lakes, reservoirs, bays, springs, estuaries |
| **Populated Places** | `pop.*` | Cities, towns, villages, boroughs, neighborhoods, locales |
| **Administrative** | `admin.*` | Counties, townships, national parks, reserves, military |
| **Manmade Structures** | `manmade.*` | Schools, bridges, airports, dams, towers, harbors |

## 2. ADL Gazetteer Service Protocol (ADL GSP v1.2)
The ADL GSP protocol standardizes HTTP/REST operations:
1. `op=get-capabilities`: Service metadata, supported SRS, bounding hulls, and available vocabularies.
2. `op=search-box`: Enclosed or intersecting spatial features within a bounding box.
3. `op=search-point`: Geodesic radial distance search around a focal coordinate.
4. `op=search-name`: Exact, substring prefix, or trigram fuzzy toponym matching.
5. `op=describe`: Full GCS record return in XML or GeoJSON.
