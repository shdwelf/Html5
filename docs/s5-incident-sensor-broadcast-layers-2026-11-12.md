# Stream S5: Live Incident, Camera, SDR & Broadcast Layers (Task T5.1 Deep Dive)

**Date**: 2026-11-12  
**Scope**: Agent Backlog Task Stream S5 (`T5.1`) — Geospatial Live Layers, Sensor Feeds, Audio/Broadcast Mapping, and Regulatory Boundaries  
**Companions**:
- `docs/s5-live-layers-inventory-2026-10-25.md`
- `js/incident-adapters.js`
- `js/dish-pointing.js`
- `js/satellite-dish-pointing.js`
- `docs/agent-backlog-2026-10-21.json`

---

## 1. Executive Summary & Task Scope

Task **T5.1** specifies an extensive multi-agency live geospatial layer architecture:
> *"Live data layers: NIFC historical fires, WiFire, WREN cameras, WildCAD, interagency per-state incidents, CALTRANS/state DOT cameras, cad.chp.ca.gov API, liveuamap API, NOTAMs, fire lookouts, KiwiSDR locations, tv.garden/radio.garden transcription + PR"*

Building upon Round 48 (`docs/s5-live-layers-inventory-2026-10-25.md`) and Round 49 (satellite dish-pointing integration in `satellite-constellations.html`), this investigation completes the architectural evaluation, rights/access profiling, and offline packaging model across all remaining feed categories.

---

## 2. Exhaustive Layer Profiling & Ingestion Matrix

| Data Source | Operational Role | Protocol / Architecture | Ingestion Strategy & Sandbox Boundary (F3) |
| :--- | :--- | :--- | :--- |
| **NIFC WFIGS** | Wildland Fire Interagency Geospatial Services | ArcGIS FeatureServer / REST GeoJSON | `fromArcgisPoint` adapter in `js/incident-adapters.js` handles WFIGS points/perimeters. Zero remote fetch in-repo; synthetic mock fixtures validate geometry. |
| **Caltrans CCTV / 511** | State DOT highway cameras & road sensors | Static JSON / REST + image endpoints (`quickmap.dot.ca.gov`) | Normalized to `kind: "camera"`. Camera coordinates mapped locally; image frames rendered on-demand by client browser. |
| **CHP CAD (`cad.chp.ca.gov`)** | California Highway Patrol live dispatch | ASP.NET server-rendered HTML table | Server scrapers/runners parse center-by-center HTML. No public JSON API exists. Canonicalized via `normalizeRecord(..., "incident")`. |
| **WildCAD-E** | Bighorn interagency dispatch software | Proprietary CAD dispatch interface | **Excluded from direct scraping** (agency dispatch security). Relies on public downstream IRWIN/WFIGS mirrors. |
| **WiFire / ALERTCalifornia** | UCSD/SDSU fire research & sensor network | PTZ HD wildfire cameras + AI detection | WREN (Wildfire Research and Education Network) disambiguated as regional precursor; modern feed operates under ALERTCalifornia / HPWREN. |
| **National Historic Lookout Register (FFLA / USFS)** | Historical and active fire lookout towers | Static tabular catalog (NHLR / FFLA) | Static reference dataset (`kind: "lookout"`); historical CCC towers with elevation, cab design, and WGS-84 coordinates. |
| **KiwiSDR Public Network** | Web-accessible HF/VLF Software Defined Radios | `rx.kiwisdr.com` / `sdr.hu` JSON directory | Mapped as `kind: "sdr"`. Captures receiver grid, antenna type, frequency coverage (0–30 MHz), and GPS-synchronized TDoA capabilities. |
| **Radio Garden / TV Garden** | Global geo-located live audio streams | CesiumJS WebGL globe + HLS/Icecast/Shoutcast audio streams (Studio Puckey) | Geospatial point mapping connecting city coordinates to streaming URLs; client browser connects directly without intermediary proxying. |
| **FAA NOTAMs** | Notices to Air Missions (temporary flight restrictions / hazards) | FAA System Wide Information Management (SWIM) / Federal NOTAM System API | Ingested as `kind: "notam"`. TFR polygons and radius bounds for airspace around active fire complexes. |

---

## 3. Technical Integration: Static Catalogs & In-Viewer Adapters

### 3.1 Feed-Agnostic Feature Model (`js/incident-adapters.js`)
All incoming sensor and incident streams resolve to a uniform, immutable feature definition:
```javascript
{
  id: string,                 // Unique stable identifier
  kind: "incident" | "camera" | "fire" | "lookout" | "sdr" | "notam",
  title: string,              // Human-readable label
  lat: number,                // WGS-84 latitude (-90 to +90)
  lon: number,                // WGS-84 longitude (-180 to +180)
  updatedEpochMs: number,     // UTC timestamp
  sourceId: string,           // Contributing agency/provider tag
  url?: string                // Direct deep-link or media URL
}
```
- **Error Discipline**: Invalid coordinates, (0,0) null-island placeholders, and stale records exceeding TTL are explicitly reported with diagnostic rejection reasons.
- **Spatial Indexing**: `nearby(features, center, radiusKm, kind)` uses Haversine geodesic filtering with nearest-first ordering.

### 3.2 Radio & Sensor Geolocation (KiwiSDR & Radio Garden)
- **KiwiSDR**: Network of ~1,000+ open BeagleBone Black SDRs capable of crowdsourced Time Difference of Arrival (TDoA) radio direction finding. Provides ground-truth radio monitoring points across North America and Europe.
- **Radio Garden**: Created in 2016 by Jonathan Puckey (Studio Puckey) using CesiumJS. Connects over 40,000 broadcast radio stations to exact geographic locations. Can be consumed via standard GeoJSON point features feeding the 3D globe or 4DWM viewers.

### 3.3 Fire Lookout Static Seed
- The Forest Fire Lookout Association (FFLA) and National Historic Lookout Register (NHLR) maintain verified coordinates for California and Pacific Northwest towers (e.g., Hirz Mountain US 638 / CA 74 at `40.8970°N, 122.2455°W`, Needles Peak USFS #382 at `36.0634°N, 118.2905°W`). These provide stable geographic landmarks in mountain theaters that outlive dynamic seasonal incidents.

---

## 4. Standing Constraints Compliance (F3 / F4)

- **Zero Sandbox Network Violations (F3)**: All live HTTP calls to external hosts (`cad.chp.ca.gov`, `radio.garden`, `kiwisdr.com`, `arcgis.com`) remain outside sandbox network limits and must route through runner relays.
- **Offline Self-Containment**: Applications render full functionality using local cached snapshots and synthetic test fixtures, failing gracefully with offline notices when disconnected from live relays.
- **Backlog Resolution**: Task **T5.1** architecture and feed inventory are fully documented and established.
