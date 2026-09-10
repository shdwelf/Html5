# GazBean Component Architecture: Geospatial Middleware for Digital Libraries

## 1. Architectural Role and Objectives
**GazBean (Gazetteer JavaBean)** was conceived during the development of ADL's Java-based Interactive Graphic Interface (JIGI) and Alexandria Web Portal as a reusable, modular component to isolate spatial query translation, connection management, caching, and multi-format serialization from presentation logic.

```
+-------------------------------------------------------------------------------+
|                             CLIENT APPLICATION LAYER                          |
|    Web UI / Leaflet Map / HTML5 App / Desktop GIS / Geoparsing Middleware     |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                       GAZBEAN MIDDLEWARE ENGINE                               |
|                                                                               |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  |  Query Builder &   |  |   Spatial Buffer   |  |    Toponym Normalizer   |  |
|  |  PostGIS Compiler  |  |    & Geodesics     |  |    & Trigram Evaluator  |  |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  +--------------------+  +--------------------+  +-------------------------+  |
|  | Connection Pool &  |  |   FTT Taxonomy     |  | Serializer: GeoJSON,    |  |
|  | Transaction Guard  |  |   Hierarchical Map |  | ADL XML, GML, Schema.org|  |
|  +--------------------+  +--------------------+  +-------------------------+  |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                        POSTGRESQL / POSTGIS SPATIAL TIER                      |
|           R-Tree GiST Indices | pg_trgm Trigrams | Full-Text Search           |
+-------------------------------------------------------------------------------+
```

## 2. GazBean Internal Processing Pipeline
1. **Request Ingestion & Validation**: Sanitizes geographic bounds, converts coordinate inputs to decimal degrees (WGS84), normalizes query tokens.
2. **Spatial Predicate Optimization**: Employs bounding box operator `&&` prior to expensive geometric function calls (`ST_Intersects`, `ST_DWithin`).
3. **Faceted Taxonomy Resolution**: Expands FTT codes into hierarchical prefix trees (`phys.peak` $\rightarrow$ matches `phys.peak` and subordinate categories).
4. **Fuzzy String Matching via PostgreSQL `pg_trgm`**:
   Generates trigram similarity constraints:
   $$\text{similarity}(s_1, s_2) = \frac{|T(s_1) \cap T(s_2)|}{|T(s_1) \cup T(s_2)|} \ge \tau$$
5. **Output Marshalling**: Transforms PostGIS row streams into ADL GCS XML, RFC 7946 GeoJSON, or Schema.org Place JSON-LD.
