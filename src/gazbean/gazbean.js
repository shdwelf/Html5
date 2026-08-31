/**
 * ============================================================================
 * GazBean ES6 Module - Alexandria Digital Library Gazetteer Engine
 * ============================================================================
 * Universal ES6 module implementing GazBean for browser and Node.js.
 * Standard: ADL Gazetteer Content Standard (GCS v1.2)
 * ============================================================================
 */

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371008.8; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const ADL_FTT_TAXONOMY = {
  "phys": { name: "Physiographic Features", facet: "Physiographic", gnis: ["Summit", "Valley", "Ridge", "Cliff", "Range", "Island"] },
  "phys.peak": { name: "Peaks & Summits", facet: "Physiographic", gnis: ["Summit", "Pillar"] },
  "phys.valley": { name: "Valleys & Canyons", facet: "Physiographic", gnis: ["Valley", "Canyon", "Gulch", "Arroyo"] },
  "phys.range": { name: "Mountain Ranges", facet: "Physiographic", gnis: ["Range", "Ridge"] },
  "phys.island": { name: "Islands & Reefs", facet: "Physiographic", gnis: ["Island", "Bar", "Reef"] },
  "hydro": { name: "Hydrographic Structures", facet: "Hydrographic", gnis: ["Stream", "Lake", "Spring", "Bay", "Canal", "Reservoir"] },
  "hydro.stream": { name: "Streams & Rivers", facet: "Hydrographic", gnis: ["Stream", "River", "Creek", "Brook"] },
  "hydro.lake": { name: "Lakes & Ponds", facet: "Hydrographic", gnis: ["Lake", "Pond", "Reservoir"] },
  "hydro.marine": { name: "Marine Coastal Features", facet: "Hydrographic", gnis: ["Bay", "Channel", "Sound", "Harbor"] },
  "hydro.spring": { name: "Springs & Wells", facet: "Hydrographic", gnis: ["Spring", "Well", "Geyser"] },
  "pop": { name: "Populated Places", facet: "Populated Places", gnis: ["Populated Place", "Locale"] },
  "pop.city": { name: "Incorporated Cities", facet: "Populated Places", gnis: ["Populated Place"] },
  "pop.town": { name: "Unincorporated Towns", facet: "Populated Places", gnis: ["Populated Place", "Locale"] },
  "admin": { name: "Administrative Areas", facet: "Administrative", gnis: ["Civil", "Reserve", "Park", "Forest", "Military"] },
  "admin.park": { name: "Parks & Reserves", facet: "Administrative", gnis: ["Park", "Reserve", "Forest"] },
  "admin.civil": { name: "Civil Divisions", facet: "Administrative", gnis: ["Civil"] },
  "admin.military": { name: "Military Installations", facet: "Administrative", gnis: ["Military"] },
  "manmade": { name: "Manmade Structures", facet: "Manmade", gnis: ["Building", "Tower", "Bridge", "Dam", "Airport", "School"] },
  "manmade.transport": { name: "Transportation Facilities", facet: "Manmade", gnis: ["Airport", "Bridge", "Canal", "Crossing"] }
};

export class GazBeanEngine {
  constructor(initialRecords = []) {
    this.records = [...initialRecords];
  }

  addFeature(feature) {
    this.records.push(feature);
  }

  setFeatures(features) {
    this.records = [...features];
  }

  getFeatures() {
    return this.records;
  }

  generatePostGisSql(opts) {
    const lines = [
      "-- GazBean PostGIS Spatial Query Planner",
      "SELECT",
      "    f.adl_id,",
      "    f.gnis_id,",
      "    f.primary_name,",
      "    f.ftt_code,",
      "    f.gnis_feature_class,",
      "    f.state_alpha,",
      "    f.county_name,",
      "    f.ele_in_m,",
      "    f.usgs_quad_name,",
      "    ST_Y(f.geom_point) AS lat,",
      "    ST_X(f.geom_point) AS lon,",
      "    ST_AsGeoJSON(f.geom_point) AS geojson"
    ];

    if (opts.radial) {
      lines.push(`    , ST_Distance(f.geog_point, ST_SetSRID(ST_MakePoint(${opts.radial.lon.toFixed(4)}, ${opts.radial.lat.toFixed(4)}), 4326)::geography) AS distance_meters`);
    }

    lines.push("FROM adl_gazetteer_features f");
    lines.push("WHERE 1=1");

    const explanations = [];

    if (opts.bbox) {
      const b = opts.bbox;
      lines.push(`  -- Spatial Bounding Box Filter (Indexed via GiST R-Tree)`);
      lines.push(`  AND f.geom_point && ST_MakeEnvelope(${b.minLon.toFixed(4)}, ${b.minLat.toFixed(4)}, ${b.maxLon.toFixed(4)}, ${b.maxLat.toFixed(4)}, 4326)`);
      lines.push(`  AND ST_Intersects(f.geom_point, ST_MakeEnvelope(${b.minLon.toFixed(4)}, ${b.minLat.toFixed(4)}, ${b.maxLon.toFixed(4)}, ${b.maxLat.toFixed(4)}, 4326))`);
      explanations.push(`Spatial BBox filter: [${b.minLon.toFixed(3)}, ${b.minLat.toFixed(3)} to ${b.maxLon.toFixed(3)}, ${b.maxLat.toFixed(3)}]`);
    }

    if (opts.radial) {
      const r = opts.radial;
      lines.push(`  -- Radial Geodesic Buffer Filter on WGS84 Spheroid`);
      lines.push(`  AND ST_DWithin(f.geog_point, ST_SetSRID(ST_MakePoint(${r.lon.toFixed(4)}, ${r.lat.toFixed(4)}), 4326)::geography, ${r.radiusMeters})`);
      explanations.push(`Radial filter: ${r.radiusMeters}m around (${r.lat.toFixed(4)}, ${r.lon.toFixed(4)})`);
    }

    if (opts.name && opts.name.trim()) {
      const q = opts.name.trim().replace(/'/g, "''");
      const mode = opts.matchMode || "fuzzy";
      if (mode === "exact") {
        lines.push(`  AND LOWER(f.primary_name) = '${q.toLowerCase()}'`);
        explanations.push(`Exact placename match for '${q}'`);
      } else if (mode === "prefix") {
        lines.push(`  AND LOWER(f.primary_name) LIKE '${q.toLowerCase()}%'`);
        explanations.push(`Prefix placename match for '${q}%'`);
      } else if (mode === "fts") {
        lines.push(`  AND to_tsvector('english', f.primary_name) @@ plainto_tsquery('english', '${q}')`);
        explanations.push(`PostgreSQL GIN Full-Text Search for '${q}'`);
      } else {
        lines.push(`  -- Trigram similarity matching using pg_trgm GIN/GiST index`);
        lines.push(`  AND (f.normalized_name % '${q.toLowerCase()}' OR similarity(f.normalized_name, '${q.toLowerCase()}') >= 0.35 OR f.primary_name ILIKE '%${q}%')`);
        explanations.push(`Fuzzy trigram similarity threshold >= 0.35 for '${q}'`);
      }
    }

    if (opts.fttCode) {
      lines.push(`  -- ADL Feature Type Thesaurus hierarchy containment`);
      lines.push(`  AND (f.ftt_code = '${opts.fttCode}' OR f.ftt_code LIKE '${opts.fttCode}.%')`);
      explanations.push(`ADL FTT category filter: '${opts.fttCode}'`);
    }

    if (opts.state) {
      lines.push(`  AND f.state_alpha = '${opts.state.toUpperCase()}'`);
      explanations.push(`State filter: '${opts.state.toUpperCase()}'`);
    }

    if (opts.radial || opts.sortBy === "distance") {
      lines.push("ORDER BY distance_meters ASC");
    } else if (opts.sortBy === "elevation") {
      lines.push("ORDER BY f.ele_in_m DESC NULLS LAST");
    } else {
      lines.push("ORDER BY f.primary_name ASC");
    }

    lines.push(`LIMIT ${opts.limit || 50} OFFSET ${opts.offset || 0};`);

    return {
      sql: lines.join("\n"),
      explanation: explanations.join(" | ") || "Full gazetteer table scan / index scan"
    };
  }

  query(opts) {
    const results = [];
    const limit = opts.limit || 50;
    const offset = opts.offset || 0;

    for (const feat of this.records) {
      // Spatial BBox
      if (opts.bbox) {
        const b = opts.bbox;
        if (
          feat.longitude < b.minLon ||
          feat.longitude > b.maxLon ||
          feat.latitude < b.minLat ||
          feat.latitude > b.maxLat
        ) {
          continue;
        }
      }

      // Radial Distance
      if (opts.radial) {
        const r = opts.radial;
        const dist = haversineDistance(r.lat, r.lon, feat.latitude, feat.longitude);
        if (dist > r.radiusMeters) continue;
        feat.distanceMeters = dist;
      } else {
        feat.distanceMeters = undefined;
      }

      // Placename search
      if (opts.name && opts.name.trim()) {
        const q = opts.name.trim().toLowerCase();
        let match = false;
        const norm = feat.normalizedName || feat.primaryName.toLowerCase();
        const mode = opts.matchMode || "fuzzy";

        if (mode === "exact") {
          if (norm === q || feat.variantNames.some((v) => v.toLowerCase() === q)) match = true;
        } else if (mode === "prefix") {
          if (norm.startsWith(q) || feat.variantNames.some((v) => v.toLowerCase().startsWith(q))) match = true;
        } else {
          // fuzzy / substring / token match
          if (norm.includes(q) || feat.variantNames.some((v) => v.toLowerCase().includes(q))) {
            match = true;
          } else {
            const tokens = norm.split(/\s+/);
            if (tokens.some((t) => t.startsWith(q))) match = true;
          }
        }

        if (!match) continue;
      }

      // FTT Code
      if (opts.fttCode) {
        if (feat.fttCode !== opts.fttCode && !feat.fttCode.startsWith(opts.fttCode + ".")) {
          continue;
        }
      }

      // State
      if (opts.state && feat.stateAlpha.toUpperCase() !== opts.state.toUpperCase()) {
        continue;
      }

      // Elevation range
      if (opts.minEleMeters !== undefined && (feat.elevationMeters === undefined || feat.elevationMeters < opts.minEleMeters)) {
        continue;
      }
      if (opts.maxEleMeters !== undefined && (feat.elevationMeters === undefined || feat.elevationMeters > opts.maxEleMeters)) {
        continue;
      }

      results.push(feat);
    }

    // Sort
    if (opts.radial || opts.sortBy === "distance") {
      results.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    } else if (opts.sortBy === "elevation") {
      results.sort((a, b) => (b.elevationMeters || 0) - (a.elevationMeters || 0));
    } else {
      results.sort((a, b) => a.primaryName.localeCompare(b.primaryName));
    }

    return results.slice(offset, offset + limit);
  }

  toGeoJson(features) {
    return {
      type: "FeatureCollection",
      metadata: {
        count: features.length,
        standard: "ADL Gazetteer Content Standard v1.2",
        generator: "GazBean Engine HTML5"
      },
      features: features.map((f) => ({
        type: "Feature",
        id: f.adlId,
        geometry: {
          type: "Point",
          coordinates: [f.longitude, f.latitude]
        },
        properties: {
          adl_id: f.adlId,
          gnis_id: f.gnisId,
          primary_name: f.primaryName,
          variant_names: f.variantNames,
          ftt_code: f.fttCode,
          gnis_class: f.gnisFeatureClass,
          state: f.stateAlpha,
          county: f.countyName,
          elevation_m: f.elevationMeters,
          elevation_ft: f.elevationFeet,
          usgs_quad: f.usgsQuadName,
          distance_meters: f.distanceMeters ? Math.round(f.distanceMeters) : undefined,
          metadata: f.metadata
        }
      }))
    };
  }

  toAdlXml(features) {
    const entries = features
      .map(
        (f) => `  <gazetteer-entry identifier="${f.adlId}" gnis-id="${f.gnisId}">
    <names>
      <primary-name>${escapeXml(f.primaryName)}</primary-name>
      ${(f.variantNames || []).map((v) => `<variant-name>${escapeXml(v)}</variant-name>`).join("\n      ")}
    </names>
    <classification ftt-code="${f.fttCode}">${escapeXml(f.gnisFeatureClass)}</classification>
    <spatial-footprint srid="EPSG:4326">
      <point latitude="${f.latitude}" longitude="${f.longitude}"/>
      ${f.elevationMeters !== undefined ? `<elevation units="meters">${f.elevationMeters}</elevation>` : ""}
    </spatial-footprint>
    <administrative-areas>
      <country>USA</country>
      <state>${f.stateAlpha}</state>
      <county>${escapeXml(f.countyName || "")}</county>
      <usgs-quadrangle>${escapeXml(f.usgsQuadName || "")}</usgs-quadrangle>
    </administrative-areas>
  </gazetteer-entry>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<adl-gazetteer-response count="${features.length}" standard="ADL-GCS-1.2">\n${entries}\n</adl-gazetteer-response>`;
  }
}

function escapeXml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
