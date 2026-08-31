# Geospatial Sitemaps & Search Engine Discovery for Spatial Digital Libraries

## 1. The Challenge of Spatial Discoverability
Traditional web search crawlers indexing conventional HTML pages discover documents through hyperlink graphs. However, spatial digital libraries and gazetteers contain deep structured collections where records are best identified by geographic coordinates, bounding extents, and spatial relationships.

## 2. Geospatial Sitemap XML Extension Standard
The **Geospatial Sitemap Standard** extends the core Sitemaps XML 0.9 schema with geographic elements:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0">
  <url>
    <loc>https://alexandria.ucsb.edu/gazetteer/feature/ADL-US-GNIS-244120</loc>
    <lastmod>2026-08-23</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
    <geo:geo>
      <geo:point>
        <geo:lat>34.414000</geo:lat>
        <geo:long>-119.848900</geo:long>
      </geo:point>
      <geo:box>
        <geo:west>-119.855000</geo:west>
        <geo:south>34.409000</geo:south>
        <geo:east>-119.840000</geo:east>
        <geo:north>34.419000</geo:north>
      </geo:box>
    </geo:geo>
  </url>
</urlset>
```

## 3. Schema.org JSON-LD for Semantic Web & OAI-PMH Harvesting
In addition to XML sitemaps, embedding Schema.org `Place` and `DataCatalog` JSON-LD graphs enables modern search engines and OAI-PMH semantic harvesters to index spatial entities directly into knowledge graphs.
