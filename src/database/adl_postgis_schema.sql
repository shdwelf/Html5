-- ============================================================================
-- ALEXANDRIA DIGITAL LIBRARY (ADL) GAZETTEER & USGS GNIS POSTGRESQL/POSTGIS SCHEMA
-- Production DDL, Spatial Indices, Triggers, Thesaurus & Stored Functions
-- Standard: ADL Gazetteer Content Standard (GCS v1.2) / OGC Simple Features
-- Database: PostgreSQL 15+ with PostGIS 3.3+
-- ============================================================================

-- 1. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE adl_relationship_type AS ENUM (
        'part_of', 'contains', 'administrative_subdivision', 
        'overlaps', 'adjacent_to', 'tributary_of', 'surrounds'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE adl_name_type AS ENUM (
        'primary', 'official_bgn', 'historical', 'variant', 
        'colloquial', 'multilingual', 'etymological', 'abbreviated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ADL FEATURE TYPE THESAURUS (FTT)
-- Hierarchical faceted classification scheme developed by Alexandria Digital Library
CREATE TABLE IF NOT EXISTS adl_feature_thesaurus (
    ftt_code VARCHAR(32) PRIMARY KEY,
    term_name VARCHAR(128) NOT NULL,
    parent_code VARCHAR(32) REFERENCES adl_feature_thesaurus(ftt_code) ON DELETE SET NULL,
    tier_level INT NOT NULL DEFAULT 1,
    facet VARCHAR(64) NOT NULL, -- e.g., 'physiographic features', 'hydrographic structures', 'populated places', 'administrative areas', 'manmade structures'
    scope_note TEXT,
    gnis_class_mapping VARCHAR(64)[], -- Array of mapped USGS GNIS feature classes
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for thesaurus lookups
CREATE INDEX IF NOT EXISTS idx_ftt_parent ON adl_feature_thesaurus(parent_code);
CREATE INDEX IF NOT EXISTS idx_ftt_facet ON adl_feature_thesaurus(facet);

-- 4. HARVEST SOURCES & INGESTION PROVENANCE
CREATE TABLE IF NOT EXISTS adl_harvest_sources (
    source_id VARCHAR(64) PRIMARY KEY,
    source_name VARCHAR(255) NOT NULL,
    agency VARCHAR(128) NOT NULL DEFAULT 'USGS',
    feed_url TEXT,
    license VARCHAR(128) DEFAULT 'Public Domain (USGS / BGN)',
    last_harvest_at TIMESTAMPTZ,
    record_count BIGINT DEFAULT 0,
    metadata_standard VARCHAR(64) DEFAULT 'ADL GCS v1.2'
);

-- 5. CORE GAZETTEER FEATURES TABLE
-- Maps USGS GNIS records into ADL Gazetteer Content Standard
CREATE TABLE IF NOT EXISTS adl_gazetteer_features (
    adl_id VARCHAR(64) PRIMARY KEY, -- e.g., 'ADL-US-GNIS-254421' or UUID
    gnis_id BIGINT UNIQUE,           -- USGS GNIS Feature ID (e.g., 254421)
    primary_name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    source_id VARCHAR(64) REFERENCES adl_harvest_sources(source_id) DEFAULT 'USGS_GNIS',
    ftt_code VARCHAR(32) REFERENCES adl_feature_thesaurus(ftt_code),
    gnis_feature_class VARCHAR(64) NOT NULL,
    
    -- Administrative Hierarchy
    state_alpha VARCHAR(2) NOT NULL,
    state_numeric VARCHAR(2),
    county_name VARCHAR(128),
    county_numeric VARCHAR(3),
    country_code VARCHAR(3) DEFAULT 'USA',
    
    -- Elevation Data
    ele_in_m NUMERIC(8, 2),
    ele_in_ft NUMERIC(8, 2),
    
    -- USGS Quadrangle & Map Metadata
    usgs_quad_name VARCHAR(128),
    quad_scale VARCHAR(32) DEFAULT '1:24,000',
    
    -- Temporal & Authority Metadata
    bgn_date DATE,
    entry_date DATE,
    edit_date DATE,
    status VARCHAR(32) DEFAULT 'official',
    
    -- PostGIS Geometries (WGS 84 - EPSG:4326)
    geom_point GEOMETRY(Point, 4326) NOT NULL,
    geom_bbox GEOMETRY(Polygon, 4326),
    geom_footprint GEOMETRY(Geometry, 4326),
    
    -- Geography column for accurate metric geodesic distance calculations
    geog_point GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (geography(geom_point)) STORED,
    
    -- Flexible metadata payload (ADL GCS XML attributes, history, citations)
    metadata_json JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. VARIANT & HISTORICAL PLACENAMES
CREATE TABLE IF NOT EXISTS adl_variant_names (
    variant_id BIGSERIAL PRIMARY KEY,
    adl_id VARCHAR(64) NOT NULL REFERENCES adl_gazetteer_features(adl_id) ON DELETE CASCADE,
    variant_name VARCHAR(255) NOT NULL,
    normalized_variant VARCHAR(255) NOT NULL,
    name_type adl_name_type DEFAULT 'variant',
    language_iso VARCHAR(8) DEFAULT 'eng',
    script VARCHAR(16) DEFAULT 'Latn',
    citation_authority VARCHAR(255),
    historical_start_year INT,
    historical_end_year INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. SPATIAL & ADMINISTRATIVE HIERARCHIES
CREATE TABLE IF NOT EXISTS adl_spatial_hierarchies (
    hierarchy_id BIGSERIAL PRIMARY KEY,
    parent_adl_id VARCHAR(64) NOT NULL REFERENCES adl_gazetteer_features(adl_id) ON DELETE CASCADE,
    child_adl_id VARCHAR(64) NOT NULL REFERENCES adl_gazetteer_features(adl_id) ON DELETE CASCADE,
    rel_type adl_relationship_type NOT NULL DEFAULT 'part_of',
    confidence NUMERIC(3, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_parent_child_rel UNIQUE (parent_adl_id, child_adl_id, rel_type)
);

-- 8. SITEMAP INDEX & GEOSPATIAL SEARCH DISCOVERY TABLE
CREATE TABLE IF NOT EXISTS adl_sitemap_index (
    sitemap_loc VARCHAR(512) PRIMARY KEY,
    adl_id VARCHAR(64) REFERENCES adl_gazetteer_features(adl_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    geo_lat NUMERIC(9, 6) NOT NULL,
    geo_lon NUMERIC(9, 6) NOT NULL,
    geo_bbox_wkt TEXT,
    changefreq VARCHAR(16) DEFAULT 'monthly',
    priority NUMERIC(2, 1) DEFAULT 0.8,
    lastmod TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SPATIAL & FULL-TEXT PERFORMANCE INDICES
-- ============================================================================

-- Spatial GiST Indices (WGS84 EPSG:4326)
CREATE INDEX IF NOT EXISTS idx_features_geom_point ON adl_gazetteer_features USING GIST(geom_point);
CREATE INDEX IF NOT EXISTS idx_features_geom_bbox ON adl_gazetteer_features USING GIST(geom_bbox);
CREATE INDEX IF NOT EXISTS idx_features_geom_footprint ON adl_gazetteer_features USING GIST(geom_footprint);
CREATE INDEX IF NOT EXISTS idx_features_geog_point ON adl_gazetteer_features USING GIST(geog_point);

-- Trigram Fuzzy String Matching Indices (for placename search e.g. "Santa Barbara", "Yosemite")
CREATE INDEX IF NOT EXISTS idx_features_name_trgm ON adl_gazetteer_features USING GIST (primary_name gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_features_norm_trgm ON adl_gazetteer_features USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_variants_name_trgm ON adl_variant_names USING GIN (normalized_variant gin_trgm_ops);

-- PostgreSQL Full-Text Search TSVector Index
CREATE INDEX IF NOT EXISTS idx_features_fts ON adl_gazetteer_features USING GIN (to_tsvector('english', primary_name || ' ' || COALESCE(county_name, '') || ' ' || COALESCE(gnis_feature_class, '')));

-- Relational Filtering B-Tree Indices
CREATE INDEX IF NOT EXISTS idx_features_state ON adl_gazetteer_features(state_alpha);
CREATE INDEX IF NOT EXISTS idx_features_class ON adl_gazetteer_features(gnis_feature_class);
CREATE INDEX IF NOT EXISTS idx_features_ftt ON adl_gazetteer_features(ftt_code);
CREATE INDEX IF NOT EXISTS idx_features_elevation ON adl_gazetteer_features(ele_in_m);
CREATE INDEX IF NOT EXISTS idx_variants_feature_id ON adl_variant_names(adl_id);
CREATE INDEX IF NOT EXISTS idx_hierarchies_child ON adl_spatial_hierarchies(child_adl_id);

-- JSONB GIN Index on metadata payload
CREATE INDEX IF NOT EXISTS idx_features_meta_jsonb ON adl_gazetteer_features USING GIN (metadata_json);

-- ============================================================================
-- STORED PROCEDURES & OPTIMIZED POSTGIS FUNCTIONS
-- ============================================================================

-- Function 1: Spatial Bounding Box Search (ADL op=search-box)
CREATE OR REPLACE FUNCTION adl_search_spatial_bbox(
    p_min_lon DOUBLE PRECISION,
    p_min_lat DOUBLE PRECISION,
    p_max_lon DOUBLE PRECISION,
    p_max_lat DOUBLE PRECISION,
    p_ftt_code VARCHAR(32) DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    adl_id VARCHAR(64),
    gnis_id BIGINT,
    primary_name VARCHAR(255),
    gnis_feature_class VARCHAR(64),
    ftt_code VARCHAR(32),
    state_alpha VARCHAR(2),
    county_name VARCHAR(128),
    ele_in_m NUMERIC(8, 2),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    geojson TEXT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.adl_id,
        f.gnis_id,
        f.primary_name,
        f.gnis_feature_class,
        f.ftt_code,
        f.state_alpha,
        f.county_name,
        f.ele_in_m,
        ST_Y(f.geom_point) AS lat,
        ST_X(f.geom_point) AS lon,
        ST_AsGeoJSON(f.geom_point)::TEXT AS geojson
    FROM adl_gazetteer_features f
    WHERE f.geom_point && ST_MakeEnvelope(p_min_lon, p_min_lat, p_max_lon, p_max_lat, 4326)
      AND ST_Intersects(f.geom_point, ST_MakeEnvelope(p_min_lon, p_min_lat, p_max_lon, p_max_lat, 4326))
      AND (p_ftt_code IS NULL OR f.ftt_code = p_ftt_code OR f.ftt_code LIKE p_ftt_code || '%')
    ORDER BY f.primary_name ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Function 2: Radial Spatial Distance Search with KNN (ADL op=search-point)
CREATE OR REPLACE FUNCTION adl_search_radial(
    p_center_lon DOUBLE PRECISION,
    p_center_lat DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION,
    p_ftt_code VARCHAR(32) DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    adl_id VARCHAR(64),
    primary_name VARCHAR(255),
    gnis_feature_class VARCHAR(64),
    state_alpha VARCHAR(2),
    distance_meters DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    geojson TEXT
) LANGUAGE plpgsql STABLE AS $$
DECLARE
    center_geog GEOGRAPHY := ST_SetSRID(ST_MakePoint(p_center_lon, p_center_lat), 4326)::geography;
BEGIN
    RETURN QUERY
    SELECT 
        f.adl_id,
        f.primary_name,
        f.gnis_feature_class,
        f.state_alpha,
        ST_Distance(f.geog_point, center_geog) AS distance_meters,
        ST_Y(f.geom_point) AS lat,
        ST_X(f.geom_point) AS lon,
        ST_AsGeoJSON(f.geom_point)::TEXT AS geojson
    FROM adl_gazetteer_features f
    WHERE ST_DWithin(f.geog_point, center_geog, p_radius_meters)
      AND (p_ftt_code IS NULL OR f.ftt_code = p_ftt_code)
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$;

-- Function 3: Trigram Fuzzy Placename Search (ADL op=search-name)
CREATE OR REPLACE FUNCTION adl_search_fuzzy_name(
    p_query_text VARCHAR(255),
    p_similarity_threshold REAL DEFAULT 0.3,
    p_state VARCHAR(2) DEFAULT NULL,
    p_limit INT DEFAULT 25
)
RETURNS TABLE (
    adl_id VARCHAR(64),
    primary_name VARCHAR(255),
    matched_variant VARCHAR(255),
    match_score REAL,
    gnis_feature_class VARCHAR(64),
    state_alpha VARCHAR(2),
    county_name VARCHAR(128),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION
) LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    WITH exact_matches AS (
        SELECT 
            f.adl_id,
            f.primary_name,
            f.primary_name AS matched_variant,
            1.0::REAL AS match_score,
            f.gnis_feature_class,
            f.state_alpha,
            f.county_name,
            ST_Y(f.geom_point) AS lat,
            ST_X(f.geom_point) AS lon
        FROM adl_gazetteer_features f
        WHERE LOWER(f.primary_name) = LOWER(p_query_text)
          AND (p_state IS NULL OR f.state_alpha = p_state)
    ),
    fuzzy_matches AS (
        SELECT 
            f.adl_id,
            f.primary_name,
            COALESCE(v.variant_name, f.primary_name) AS matched_variant,
            GREATEST(
                similarity(f.normalized_name, LOWER(p_query_text)),
                COALESCE(similarity(v.normalized_variant, LOWER(p_query_text)), 0)
            )::REAL AS match_score,
            f.gnis_feature_class,
            f.state_alpha,
            f.county_name,
            ST_Y(f.geom_point) AS lat,
            ST_X(f.geom_point) AS lon
        FROM adl_gazetteer_features f
        LEFT JOIN adl_variant_names v ON f.adl_id = v.adl_id
        WHERE (
            f.normalized_name % LOWER(p_query_text) 
            OR v.normalized_variant % LOWER(p_query_text)
            OR f.primary_name ILIKE '%' || p_query_text || '%'
        )
        AND (p_state IS NULL OR f.state_alpha = p_state)
    )
    SELECT * FROM exact_matches
    UNION
    SELECT * FROM fuzzy_matches
    WHERE match_score >= p_similarity_threshold
    ORDER BY match_score DESC, primary_name ASC
    LIMIT p_limit;
END;
$$;

-- Function 4: Export to ADL Gazetteer Content Standard XML (ADL GCS v1.2 Format)
CREATE OR REPLACE FUNCTION adl_to_gcs_xml(p_adl_id VARCHAR(64))
RETURNS XML LANGUAGE plpgsql STABLE AS $$
DECLARE
    result_xml XML;
BEGIN
    SELECT xmlelement(
        name "gazetteer-entry",
        xmlattributes(
            f.adl_id AS "identifier",
            f.gnis_id AS "gnis-id",
            f.entry_date AS "entry-date",
            'ADL-GCS-1.2' AS "standard-version"
        ),
        xmlelement(
            name "names",
            xmlelement(name "primary-name", f.primary_name),
            (SELECT xmlagg(
                xmlelement(
                    name "variant-name", 
                    xmlattributes(v.name_type AS "type", v.language_iso AS "lang"),
                    v.variant_name
                )
             ) FROM adl_variant_names v WHERE v.adl_id = f.adl_id)
        ),
        xmlelement(
            name "classification",
            xmlelement(name "ftt-code", f.ftt_code),
            xmlelement(name "gnis-class", f.gnis_feature_class)
        ),
        xmlelement(
            name "spatial-footprint",
            xmlelement(
                name "point",
                xmlattributes('EPSG:4326' AS "srid"),
                xmlelement(name "latitude", ST_Y(f.geom_point)),
                xmlelement(name "longitude", ST_X(f.geom_point))
            ),
            CASE WHEN f.ele_in_m IS NOT NULL THEN
                xmlelement(name "elevation", xmlattributes('meters' AS "units"), f.ele_in_m)
            END,
            CASE WHEN f.geom_bbox IS NOT NULL THEN
                xmlelement(
                    name "bounding-box",
                    xmlelement(name "west", ST_XMin(f.geom_bbox)),
                    xmlelement(name "south", ST_YMin(f.geom_bbox)),
                    xmlelement(name "east", ST_XMax(f.geom_bbox)),
                    xmlelement(name "north", ST_YMax(f.geom_bbox))
                )
            END
        ),
        xmlelement(
            name "administrative-areas",
            xmlelement(name "country", f.country_code),
            xmlelement(name "state", xmlattributes(f.state_numeric AS "fips"), f.state_alpha),
            xmlelement(name "county", xmlattributes(f.county_numeric AS "fips"), f.county_name),
            xmlelement(name "usgs-quadrangle", f.usgs_quad_name)
        )
    ) INTO result_xml
    FROM adl_gazetteer_features f
    WHERE f.adl_id = p_adl_id;

    RETURN result_xml;
END;
$$;

-- ============================================================================
-- INITIAL SEED: ADL FEATURE TYPE THESAURUS (FTT) HIERARCHY
-- ============================================================================
INSERT INTO adl_harvest_sources (source_id, source_name, agency, feed_url, record_count)
VALUES 
('USGS_GNIS', 'USGS Geographic Names Information System', 'USGS / BGN', 'https://geonames.usgs.gov/docs/stategaz/', 2800000),
('NIMA_GNS', 'NIMA / NGA GEOnet Names Server', 'National Geospatial-Intelligence Agency', 'https://geonames.nga.mil/', 5600000),
('ADL_UCSB', 'Alexandria Digital Library Testbed', 'UC Santa Barbara / Map & Imagery Lab', 'http://legacy.alexandria.ucsb.edu/', 7900000)
ON CONFLICT (source_id) DO NOTHING;

INSERT INTO adl_feature_thesaurus (ftt_code, term_name, parent_code, tier_level, facet, scope_note, gnis_class_mapping)
VALUES
('phys', 'physiographic features', NULL, 1, 'Physiographic', 'Natural landforms and solid earth features', ARRAY['Summit', 'Valley', 'Ridge', 'Cliff', 'Range', 'Pillar', 'Cape', 'Island']),
('phys.peak', 'peaks and summits', 'phys', 2, 'Physiographic', 'Elevated landform rising notably above surroundings', ARRAY['Summit', 'Pillar']),
('phys.valley', 'valleys and canyons', 'phys', 2, 'Physiographic', 'Low area between hills or mountains typically with river', ARRAY['Valley', 'Canyon', 'Gulch', 'Arroyo', 'Basin']),
('phys.range', 'mountain ranges', 'phys', 2, 'Physiographic', 'Series of mountains or hills ranged in a line', ARRAY['Range', 'Ridge']),
('phys.island', 'islands and reefs', 'phys', 2, 'Physiographic', 'Tract of land surrounded by water', ARRAY['Island', 'Bar', 'Reef']),

('hydro', 'hydrographic structures', NULL, 1, 'Hydrographic', 'Water bodies, streams, wetlands, and drainage features', ARRAY['Stream', 'Lake', 'Spring', 'Bay', 'Canal', 'Reservoir', 'Swamp', 'Falls']),
('hydro.stream', 'streams and rivers', 'hydro', 2, 'Hydrographic', 'Body of running water flowing in a natural channel', ARRAY['Stream', 'River', 'Creek', 'Brook']),
('hydro.lake', 'lakes and ponds', 'hydro', 2, 'Hydrographic', 'Inland body of standing water', ARRAY['Lake', 'Pond', 'Reservoir']),
('hydro.marine', 'marine coastal features', 'hydro', 2, 'Hydrographic', 'Ocean inlets, bays, straits, channels', ARRAY['Bay', 'Channel', 'Sound', 'Harbor', 'Strait']),
('hydro.spring', 'springs and wells', 'hydro', 2, 'Hydrographic', 'Place where water issues naturally from the earth', ARRAY['Spring', 'Well', 'Geyser']),

('pop', 'populated places', NULL, 1, 'Populated Places', 'Human settlements and inhabited locations', ARRAY['Populated Place', 'Locale']),
('pop.city', 'incorporated cities', 'pop', 2, 'Populated Places', 'Legally incorporated municipality or urban center', ARRAY['Populated Place']),
('pop.town', 'unincorporated towns and villages', 'pop', 2, 'Populated Places', 'Settlement lacking formal municipal incorporation', ARRAY['Populated Place', 'Locale']),
('pop.neighborhood', 'neighborhoods and quarters', 'pop', 2, 'Populated Places', 'Distinct named subdivision of a city or settlement', ARRAY['Locale']),

('admin', 'administrative areas', NULL, 1, 'Administrative', 'Political and statutory jurisdictional boundaries', ARRAY['Civil', 'Reserve', 'Park', 'Forest', 'Military']),
('admin.park', 'parks and reserves', 'admin', 2, 'Administrative', 'Protected public parkland, wildlife refuge, or wilderness', ARRAY['Park', 'Reserve', 'Forest']),
('admin.civil', 'civil divisions', 'admin', 2, 'Administrative', 'County, township, parish, borough administrative units', ARRAY['Civil']),
('admin.military', 'military installations', 'admin', 2, 'Administrative', 'Armed forces base, reservation, or testing range', ARRAY['Military']),

('manmade', 'manmade structures', NULL, 1, 'Manmade', 'Built environment infrastructure and facilities', ARRAY['Building', 'Tower', 'Bridge', 'Dam', 'Airport', 'Harbor']),
('manmade.transport', 'transportation facilities', 'manmade', 2, 'Manmade', 'Airports, docks, rail yards, bridges, locks', ARRAY['Airport', 'Bridge', 'Canal', 'Crossing'])
ON CONFLICT (ftt_code) DO NOTHING;

-- Seed Sample ADL / USGS GNIS Features (California ADL Foundation Testbed & Key National Landmarks)
INSERT INTO adl_gazetteer_features (
    adl_id, gnis_id, primary_name, normalized_name, source_id, ftt_code, gnis_feature_class,
    state_alpha, state_numeric, county_name, county_numeric, ele_in_m, ele_in_ft, usgs_quad_name,
    geom_point, geom_bbox, metadata_json
) VALUES
(
    'ADL-US-GNIS-244120', 244120, 'University of California, Santa Barbara', 'university of california santa barbara',
    'ADL_UCSB', 'manmade', 'School', 'CA', '06', 'Santa Barbara', '083', 14.0, 46.0, 'Goleta',
    ST_SetSRID(ST_MakePoint(-119.8489, 34.4140), 4326),
    ST_MakeEnvelope(-119.8550, 34.4090, -119.8400, 34.4190, 4326),
    '{"historical_note": "Birthplace of Alexandria Digital Library (ADL) Project (NSF DLI-1, 1994-1998)", "bgn_status": "Official"}'::jsonb
),
(
    'ADL-US-GNIS-254421', 254421, 'Santa Barbara', 'santa barbara',
    'USGS_GNIS', 'pop.city', 'Populated Place', 'CA', '06', 'Santa Barbara', '083', 15.0, 49.0, 'Santa Barbara',
    ST_SetSRID(ST_MakePoint(-119.6982, 34.4208), 4326),
    ST_MakeEnvelope(-119.7500, 34.3800, -119.6500, 34.4600, 4326),
    '{"population": 88665, "fips_place": "69070"}'::jsonb
),
(
    'ADL-US-GNIS-165987', 165987, 'Isla Vista', 'isla vista',
    'USGS_GNIS', 'pop.town', 'Populated Place', 'CA', '06', 'Santa Barbara', '083', 10.0, 33.0, 'Goleta',
    ST_SetSRID(ST_MakePoint(-119.8608, 34.4133), 4326),
    ST_MakeEnvelope(-119.8700, 34.4070, -119.8500, 34.4200, 4326),
    '{"census_designated_place": true}'::jsonb
),
(
    'ADL-US-GNIS-253810', 253810, 'Santa Barbara Channel', 'santa barbara channel',
    'USGS_GNIS', 'hydro.marine', 'Channel', 'CA', '06', 'Santa Barbara', '083', 0.0, 0.0, 'Santa Barbara',
    ST_SetSRID(ST_MakePoint(-119.7800, 34.2500), 4326),
    ST_MakeEnvelope(-120.4000, 34.0000, -119.2000, 34.5000, 4326),
    '{"marine_sanctuary": "Channel Islands National Marine Sanctuary"}'::jsonb
),
(
    'ADL-US-GNIS-253245', 253245, 'Santa Cruz Island', 'santa cruz island',
    'USGS_GNIS', 'phys.island', 'Island', 'CA', '06', 'Santa Barbara', '083', 740.0, 2428.0, 'Santa Cruz Island',
    ST_SetSRID(ST_MakePoint(-119.7200, 34.0200), 4326),
    ST_MakeEnvelope(-119.9200, 33.9500, -119.5200, 34.0900, 4326),
    '{"island_group": "Channel Islands of California", "highest_peak": "Devils Peak"}'::jsonb
),
(
    'ADL-US-GNIS-253489', 253489, 'Yosemite Valley', 'yosemite valley',
    'USGS_GNIS', 'phys.valley', 'Valley', 'CA', '06', 'Mariposa', '043', 1218.0, 3996.0, 'Yosemite Falls',
    ST_SetSRID(ST_MakePoint(-119.5936, 37.7456), 4326),
    ST_MakeEnvelope(-119.6800, 37.7000, -119.5000, 37.7800, 4326),
    '{"national_park": "Yosemite National Park", "unesco_world_heritage": true}'::jsonb
),
(
    'ADL-US-GNIS-261543', 261543, 'Half Dome', 'half dome',
    'USGS_GNIS', 'phys.peak', 'Summit', 'CA', '06', 'Mariposa', '043', 2694.0, 8839.0, 'Half Dome',
    ST_SetSRID(ST_MakePoint(-119.5332, 37.7460), 4326),
    NULL,
    '{"prominence_m": 414, "granite_batholith": true}'::jsonb
),
(
    'ADL-US-GNIS-254067', 254067, 'Mount Whitney', 'mount whitney',
    'USGS_GNIS', 'phys.peak', 'Summit', 'CA', '06', 'Inyo', '027', 4421.0, 14505.0, 'Mount Whitney',
    ST_SetSRID(ST_MakePoint(-118.2923, 36.5785), 4326),
    NULL,
    '{"highest_point_contiguous_us": true, "sierra_nevada": true}'::jsonb
),
(
    'ADL-US-GNIS-213948', 213948, 'Grand Canyon', 'grand canyon',
    'USGS_GNIS', 'phys.valley', 'Canyon', 'AZ', '04', 'Coconino', '005', 732.0, 2402.0, 'Grand Canyon',
    ST_SetSRID(ST_MakePoint(-112.1401, 36.0544), 4326),
    ST_MakeEnvelope(-113.9000, 35.8000, -111.7000, 36.4500, 4326),
    '{"river": "Colorado River", "national_park": "Grand Canyon National Park"}'::jsonb
),
(
    'ADL-US-GNIS-160933', 160933, 'Mississippi River', 'mississippi river',
    'USGS_GNIS', 'hydro.stream', 'Stream', 'LA', '22', 'Plaquemines', '075', 0.0, 0.0, 'Pilottown',
    ST_SetSRID(ST_MakePoint(-89.2500, 29.1500), 4326),
    ST_MakeEnvelope(-95.0000, 29.0000, -89.0000, 47.5000, 4326),
    '{"drainage_basin_km2": 3220000, "length_km": 3766}'::jsonb
)
ON CONFLICT (adl_id) DO NOTHING;

-- Seed Variant Names
INSERT INTO adl_variant_names (adl_id, variant_name, normalized_variant, name_type, language_iso)
VALUES
('ADL-US-GNIS-244120', 'UCSB', 'ucsb', 'abbreviated', 'eng'),
('ADL-US-GNIS-244120', 'UC Santa Barbara', 'uc santa barbara', 'colloquial', 'eng'),
('ADL-US-GNIS-254421', 'La Ciudad de Santa Bárbara', 'la ciudad de santa barbara', 'historical', 'spa'),
('ADL-US-GNIS-254421', 'Santa Barbara de la Costa', 'santa barbara de la costa', 'historical', 'spa'),
('ADL-US-GNIS-253489', 'Ahwahnee', 'ahwahnee', 'etymological', 'nai'),
('ADL-US-GNIS-253489', 'Yo-semite', 'yo-semite', 'historical', 'eng'),
('ADL-US-GNIS-261543', 'Tis-sa-ack', 'tis-sa-ack', 'etymological', 'nai'),
('ADL-US-GNIS-254067', 'Tumanguya', 'tumanguya', 'etymological', 'nai'),
('ADL-US-GNIS-160933', 'Misi-ziibi', 'misi-ziibi', 'etymological', 'ojb'),
('ADL-US-GNIS-160933', 'Father of Waters', 'father of waters', 'colloquial', 'eng')
ON CONFLICT DO NOTHING;

-- Seed Sitemap Index Entries
INSERT INTO adl_sitemap_index (sitemap_loc, adl_id, title, geo_lat, geo_lon, geo_bbox_wkt, changefreq, priority)
VALUES
('https://alexandria.ucsb.edu/gazetteer/feature/ADL-US-GNIS-244120', 'ADL-US-GNIS-244120', 'University of California, Santa Barbara - ADL Gazetteer', 34.414000, -119.848900, 'POLYGON((-119.855 34.409, -119.840 34.409, -119.840 34.419, -119.855 34.419, -119.855 34.409))', 'monthly', 1.0),
('https://alexandria.ucsb.edu/gazetteer/feature/ADL-US-GNIS-254421', 'ADL-US-GNIS-254421', 'Santa Barbara, California - USGS GNIS Placename Record', 34.420800, -119.698200, 'POLYGON((-119.750 34.380, -119.650 34.380, -119.650 34.460, -119.750 34.460, -119.750 34.380))', 'monthly', 0.9),
('https://alexandria.ucsb.edu/gazetteer/feature/ADL-US-GNIS-165987', 'ADL-US-GNIS-165987', 'Isla Vista, California - USGS GNIS Placename Record', 34.413300, -119.860800, 'POLYGON((-119.870 34.407, -119.850 34.407, -119.850 34.420, -119.870 34.420, -119.870 34.407))', 'monthly', 0.8),
('https://alexandria.ucsb.edu/gazetteer/feature/ADL-US-GNIS-253489', 'ADL-US-GNIS-253489', 'Yosemite Valley, California - ADL Physiographic Record', 37.745600, -119.593600, 'POLYGON((-119.680 37.700, -119.500 37.700, -119.500 37.780, -119.680 37.780, -119.680 37.700))', 'monthly', 0.9),
('https://alexandria.ucsb.edu/gazetteer/feature/ADL-US-GNIS-213948', 'ADL-US-GNIS-213948', 'Grand Canyon, Arizona - ADL Physiographic Record', 36.054400, -112.140100, 'POLYGON((-113.900 35.800, -111.700 35.800, -111.700 36.450, -113.900 36.450, -113.900 35.800))', 'monthly', 0.9)
ON CONFLICT (sitemap_loc) DO NOTHING;
