package edu.ucsb.alexandria.gazetteer;

import java.io.Serializable;
import java.sql.*;
import java.util.*;
import javax.sql.DataSource;

/**
 * ============================================================================
 * GazBean - Alexandria Digital Library (ADL) Gazetteer Component
 * ============================================================================
 * Java Bean component architecture designed for ADL / ADEPT georeferenced
 * digital libraries. Bridges web portals, GIS toolbars, and search middleware
 * to PostgreSQL / PostGIS gazetteer spatial databases and USGS GNIS services.
 *
 * Conforms to: ADL Gazetteer Content Standard (GCS v1.2)
 * Authors: Alexandria Digital Library Project, UC Santa Barbara
 * ============================================================================
 */
public class GazBean implements Serializable {
    private static final long serialVersionUID = 19990823L;

    // Database Connection Parameters
    private String jdbcUrl = "jdbc:postgresql://localhost:5432/adl_gazetteer";
    private String dbUser = "adl_user";
    private String dbPassword = "adl_password";
    private transient DataSource dataSource;

    // Query Criteria / State Variables
    private String placenameQuery;
    private String matchMode = "fuzzy"; // "exact", "fuzzy", "prefix", "fts"
    private double fuzzyThreshold = 0.35;
    private String fttCode; // ADL Feature Type Thesaurus code (e.g. "phys.peak")
    private String gnisFeatureClass;
    private String stateAlpha;
    private String countyName;

    // Spatial Footprint Filter (BBox & Radial)
    private Double minLon;
    private Double minLat;
    private Double maxLon;
    private Double maxLat;
    private Double centerLon;
    private Double centerLat;
    private Double radiusMeters;

    // Pagination & Sorting
    private int maxResults = 50;
    private int offset = 0;
    private String sortBy = "relevance"; // "relevance", "name", "distance", "elevation"

    // Default Constructor
    public GazBean() {}

    public GazBean(String jdbcUrl, String dbUser, String dbPassword) {
        this.jdbcUrl = jdbcUrl;
        this.dbUser = dbUser;
        this.dbPassword = dbPassword;
    }

    public GazBean(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    // ========================================================================
    // GETTERS & SETTERS (JavaBean Spec)
    // ========================================================================
    public String getPlacenameQuery() { return placenameQuery; }
    public void setPlacenameQuery(String placenameQuery) { this.placenameQuery = placenameQuery; }

    public String getMatchMode() { return matchMode; }
    public void setMatchMode(String matchMode) { this.matchMode = matchMode; }

    public double getFuzzyThreshold() { return fuzzyThreshold; }
    public void setFuzzyThreshold(double fuzzyThreshold) { this.fuzzyThreshold = fuzzyThreshold; }

    public String getFttCode() { return fttCode; }
    public void setFttCode(String fttCode) { this.fttCode = fttCode; }

    public String getGnisFeatureClass() { return gnisFeatureClass; }
    public void setGnisFeatureClass(String gnisFeatureClass) { this.gnisFeatureClass = gnisFeatureClass; }

    public String getStateAlpha() { return stateAlpha; }
    public void setStateAlpha(String stateAlpha) { this.stateAlpha = stateAlpha; }

    public String getCountyName() { return countyName; }
    public void setCountyName(String countyName) { this.countyName = countyName; }

    public void setBoundingBox(double minLon, double minLat, double maxLon, double maxLat) {
        this.minLon = minLon;
        this.minLat = minLat;
        this.maxLon = maxLon;
        this.maxLat = maxLat;
    }

    public void setRadialFilter(double centerLon, double centerLat, double radiusMeters) {
        this.centerLon = centerLon;
        this.centerLat = centerLat;
        this.radiusMeters = radiusMeters;
    }

    public int getMaxResults() { return maxResults; }
    public void setMaxResults(int maxResults) { this.maxResults = maxResults; }

    public int getOffset() { return offset; }
    public void setOffset(int offset) { this.offset = offset; }

    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }

    // ========================================================================
    // DATABASE CONNECTION MANAGEMENT
    // ========================================================================
    protected Connection getConnection() throws SQLException {
        if (this.dataSource != null) {
            return this.dataSource.getConnection();
        }
        return DriverManager.getConnection(this.jdbcUrl, this.dbUser, this.dbPassword);
    }

    // ========================================================================
    // QUERY EXECUTION & POSTGIS SQL GENERATION
    // ========================================================================
    
    /**
     * Executes the configured spatial gazetteer query against PostgreSQL/PostGIS.
     * Returns a list of matching GazetteerFeature objects conforming to ADL GCS.
     */
    public List<GazetteerFeature> executeQuery() throws SQLException {
        List<GazetteerFeature> results = new ArrayList<>();
        StringBuilder sql = new StringBuilder();
        List<Object> params = new ArrayList<>();

        sql.append("SELECT f.adl_id, f.gnis_id, f.primary_name, f.ftt_code, f.gnis_feature_class, ")
           .append("f.state_alpha, f.county_name, f.ele_in_m, f.ele_in_ft, f.usgs_quad_name, ")
           .append("ST_Y(f.geom_point) AS lat, ST_X(f.geom_point) AS lon, ")
           .append("ST_AsGeoJSON(f.geom_point) AS geojson_point, ")
           .append("ST_AsGeoJSON(f.geom_bbox) AS geojson_bbox, ")
           .append("f.metadata_json ");

        if (centerLon != null && centerLat != null) {
            sql.append(", ST_Distance(f.geog_point, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_meters ");
            params.add(centerLon);
            params.add(centerLat);
        }

        sql.append("FROM adl_gazetteer_features f ");
        sql.append("WHERE 1=1 ");

        // Spatial Bounding Box Filter using PostGIS R-Tree GiST operator (&&) + ST_Intersects
        if (minLon != null && minLat != null && maxLon != null && maxLat != null) {
            sql.append("AND f.geom_point && ST_MakeEnvelope(?, ?, ?, ?, 4326) ")
               .append("AND ST_Intersects(f.geom_point, ST_MakeEnvelope(?, ?, ?, ?, 4326)) ");
            params.add(minLon); params.add(minLat); params.add(maxLon); params.add(maxLat);
            params.add(minLon); params.add(minLat); params.add(maxLon); params.add(maxLat);
        }

        // Radial Geodesic Filter using PostGIS ST_DWithin on geography
        if (centerLon != null && centerLat != null && radiusMeters != null) {
            sql.append("AND ST_DWithin(f.geog_point, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?) ");
            params.add(centerLon);
            params.add(centerLat);
            params.add(radiusMeters);
        }

        // Placename Filter (Fuzzy Trigram, Exact, Prefix, or FTS)
        if (placenameQuery != null && !placenameQuery.trim().isEmpty()) {
            String q = placenameQuery.trim().toLowerCase();
            switch (matchMode.toLowerCase()) {
                case "exact":
                    sql.append("AND LOWER(f.primary_name) = ? ");
                    params.add(q);
                    break;
                case "prefix":
                    sql.append("AND LOWER(f.primary_name) LIKE ? ");
                    params.add(q + "%");
                    break;
                case "fts":
                    sql.append("AND to_tsvector('english', f.primary_name) @@ plainto_tsquery('english', ?) ");
                    params.add(q);
                    break;
                case "fuzzy":
                default:
                    sql.append("AND (f.normalized_name % ? OR similarity(f.normalized_name, ?) >= ? OR f.primary_name ILIKE ?) ");
                    params.add(q);
                    params.add(q);
                    params.add(fuzzyThreshold);
                    params.add("%" + q + "%");
                    break;
            }
        }

        // Feature Classification Filter (ADL FTT hierarchy)
        if (fttCode != null && !fttCode.isEmpty()) {
            sql.append("AND (f.ftt_code = ? OR f.ftt_code LIKE ?) ");
            params.add(fttCode);
            params.add(fttCode + ".%");
        }

        if (gnisFeatureClass != null && !gnisFeatureClass.isEmpty()) {
            sql.append("AND f.gnis_feature_class = ? ");
            params.add(gnisFeatureClass);
        }

        // State and County Filter
        if (stateAlpha != null && !stateAlpha.isEmpty()) {
            sql.append("AND f.state_alpha = ? ");
            params.add(stateAlpha.toUpperCase());
        }
        if (countyName != null && !countyName.isEmpty()) {
            sql.append("AND LOWER(f.county_name) = ? ");
            params.add(countyName.toLowerCase());
        }

        // Ordering & Pagination
        if ("distance".equalsIgnoreCase(sortBy) && centerLon != null && centerLat != null) {
            sql.append("ORDER BY distance_meters ASC ");
        } else if ("elevation".equalsIgnoreCase(sortBy)) {
            sql.append("ORDER BY f.ele_in_m DESC NULLS LAST ");
        } else {
            sql.append("ORDER BY f.primary_name ASC ");
        }

        sql.append("LIMIT ? OFFSET ?");
        params.add(maxResults);
        params.add(offset);

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    GazetteerFeature feat = new GazetteerFeature();
                    feat.setAdlId(rs.getString("adl_id"));
                    feat.setGnisId(rs.getLong("gnis_id"));
                    feat.setPrimaryName(rs.getString("primary_name"));
                    feat.setFttCode(rs.getString("ftt_code"));
                    feat.setGnisFeatureClass(rs.getString("gnis_feature_class"));
                    feat.setStateAlpha(rs.getString("state_alpha"));
                    feat.setCountyName(rs.getString("county_name"));
                    feat.setElevationMeters(rs.getDouble("ele_in_m"));
                    feat.setElevationFeet(rs.getDouble("ele_in_ft"));
                    feat.setUsgsQuadName(rs.getString("usgs_quad_name"));
                    feat.setLatitude(rs.getDouble("lat"));
                    feat.setLongitude(rs.getDouble("lon"));
                    feat.setGeoJsonPoint(rs.getString("geojson_point"));
                    feat.setGeoJsonBBox(rs.getString("geojson_bbox"));
                    feat.setMetadataJson(rs.getString("metadata_json"));
                    results.add(feat);
                }
            }
        }

        // Populate Variant Names for each feature
        if (!results.isEmpty()) {
            attachVariantNames(results);
        }

        return results;
    }

    private void attachVariantNames(List<GazetteerFeature> features) throws SQLException {
        if (features.isEmpty()) return;
        Map<String, GazetteerFeature> featureMap = new HashMap<>();
        List<String> ids = new ArrayList<>();
        for (GazetteerFeature f : features) {
            featureMap.put(f.getAdlId(), f);
            ids.add("?");
        }

        String sql = "SELECT adl_id, variant_name, name_type, language_iso FROM adl_variant_names WHERE adl_id IN (" 
                   + String.join(",", ids) + ")";

        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < ids.size(); i++) {
                ps.setString(i + 1, features.get(i).getAdlId());
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String adlId = rs.getString("adl_id");
                    GazetteerFeature feat = featureMap.get(adlId);
                    if (feat != null) {
                        feat.addVariantName(rs.getString("variant_name"));
                    }
                }
            }
        }
    }

    // ========================================================================
    // ADL GAZETTEER DATA TRANSFER OBJECT (GCS DTO)
    // ========================================================================
    public static class GazetteerFeature implements Serializable {
        private static final long serialVersionUID = 1L;
        private String adlId;
        private Long gnisId;
        private String primaryName;
        private List<String> variantNames = new ArrayList<>();
        private String fttCode;
        private String gnisFeatureClass;
        private String stateAlpha;
        private String countyName;
        private Double elevationMeters;
        private Double elevationFeet;
        private String usgsQuadName;
        private double latitude;
        private double longitude;
        private String geoJsonPoint;
        private String geoJsonBBox;
        private String metadataJson;

        public String getAdlId() { return adlId; }
        public void setAdlId(String adlId) { this.adlId = adlId; }

        public Long getGnisId() { return gnisId; }
        public void setGnisId(Long gnisId) { this.gnisId = gnisId; }

        public String getPrimaryName() { return primaryName; }
        public void setPrimaryName(String primaryName) { this.primaryName = primaryName; }

        public List<String> getVariantNames() { return variantNames; }
        public void addVariantName(String variant) { this.variantNames.add(variant); }

        public String getFttCode() { return fttCode; }
        public void setFttCode(String fttCode) { this.fttCode = fttCode; }

        public String getGnisFeatureClass() { return gnisFeatureClass; }
        public void setGnisFeatureClass(String gnisFeatureClass) { this.gnisFeatureClass = gnisFeatureClass; }

        public String getStateAlpha() { return stateAlpha; }
        public void setStateAlpha(String stateAlpha) { this.stateAlpha = stateAlpha; }

        public String getCountyName() { return countyName; }
        public void setCountyName(String countyName) { this.countyName = countyName; }

        public Double getElevationMeters() { return elevationMeters; }
        public void setElevationMeters(Double elevationMeters) { this.elevationMeters = elevationMeters; }

        public Double getElevationFeet() { return elevationFeet; }
        public void setElevationFeet(Double elevationFeet) { this.elevationFeet = elevationFeet; }

        public String getUsgsQuadName() { return usgsQuadName; }
        public void setUsgsQuadName(String usgsQuadName) { this.usgsQuadName = usgsQuadName; }

        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }

        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }

        public String getGeoJsonPoint() { return geoJsonPoint; }
        public void setGeoJsonPoint(String geoJsonPoint) { this.geoJsonPoint = geoJsonPoint; }

        public String getGeoJsonBBox() { return geoJsonBBox; }
        public void setGeoJsonBBox(String geoJsonBBox) { this.geoJsonBBox = geoJsonBBox; }

        public String getMetadataJson() { return metadataJson; }
        public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }

        /**
         * Serializes the feature into ADL Gazetteer Content Standard XML.
         */
        public String toAdlXml() {
            StringBuilder xml = new StringBuilder();
            xml.append("<gazetteer-entry identifier=\"").append(adlId).append("\" gnis-id=\"").append(gnisId).append("\">\n")
               .append("  <names>\n")
               .append("    <primary-name>").append(escapeXml(primaryName)).append("</primary-name>\n");
            for (String v : variantNames) {
                xml.append("    <variant-name>").append(escapeXml(v)).append("</variant-name>\n");
            }
            xml.append("  </names>\n")
               .append("  <classification ftt-code=\"").append(fttCode).append("\">")
               .append(escapeXml(gnisFeatureClass)).append("</classification>\n")
               .append("  <spatial-footprint srid=\"EPSG:4326\">\n")
               .append("    <point latitude=\"").append(latitude).append("\" longitude=\"").append(longitude).append("\"/>\n");
            if (elevationMeters != null) {
                xml.append("    <elevation units=\"meters\">").append(elevationMeters).append("</elevation>\n");
            }
            xml.append("  </spatial-footprint>\n")
               .append("  <administrative-areas>\n")
               .append("    <state>").append(stateAlpha).append("</state>\n")
               .append("    <county>").append(escapeXml(countyName)).append("</county>\n")
               .append("    <usgs-quad>").append(escapeXml(usgsQuadName)).append("</usgs-quad>\n")
               .append("  </administrative-areas>\n")
               .append("</gazetteer-entry>");
            return xml.toString();
        }

        private String escapeXml(String text) {
            if (text == null) return "";
            return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
        }
    }
}
