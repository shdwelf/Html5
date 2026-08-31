#!/usr/bin/env python3
"""
================================================================================
Alexandria Digital Library (ADL) Geospatial Sitemap Generator
================================================================================
Generates search-engine compliant XML Sitemaps with Google Geospatial Extensions,
OAI-PMH spatial harvesters, and Schema.org JSON-LD spatial catalog mappings.
Enables full indexing of ADL Gazetteer entries, USGS GNIS features, and
spatial collection footprints.

Conforms to: Sitemaps XML 0.9 + Geo Sitemap Extension 1.0
================================================================================
"""

import os
import sys
import json
import datetime
from typing import List, Dict, Any, Optional

class AdlGeospatialSitemapGenerator:
    """Generates Geospatial XML Sitemaps from ADL Gazetteer records."""

    def __init__(self, base_url: str = "https://alexandria.ucsb.edu/gazetteer"):
        self.base_url = base_url.rstrip("/")

    def generate_xml_sitemap(self, features: List[Dict[str, Any]]) -> str:
        """Constructs an XML Sitemap with geospatial extensions."""
        today = datetime.date.today().isoformat()
        
        xml_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
            '        xmlns:geo="http://www.google.com/geo/schemas/sitemap/1.0"',
            '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
            f'  <!-- Alexandria Digital Library Gazetteer Geospatial Sitemap Index -->',
            f'  <!-- Generated: {today} | Target standard: ADL GCS v1.2 -->',
            '',
            '  <!-- Core ADL Application & Hub URL -->',
            '  <url>',
            f'    <loc>{self.base_url}/</loc>',
            f'    <lastmod>{today}</lastmod>',
            '    <changefreq>daily</changefreq>',
            '    <priority>1.0</priority>',
            '  </url>',
            '  <url>',
            f'    <loc>{self.base_url}/thesaurus</loc>',
            f'    <lastmod>{today}</lastmod>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.9</priority>',
            '  </url>'
        ]

        for feat in features:
            adl_id = feat.get("adl_id", "")
            loc = f"{self.base_url}/feature/{adl_id}"
            coords = feat.get("coordinates", {})
            lat = feat.get("latitude") if feat.get("latitude") is not None else coords.get("latitude", 0.0)
            lon = feat.get("longitude") if feat.get("longitude") is not None else coords.get("longitude", 0.0)
            bbox = feat.get("bbox")

            xml_lines.append('  <url>')
            xml_lines.append(f'    <loc>{loc}</loc>')
            xml_lines.append(f'    <lastmod>{today}</lastmod>')
            xml_lines.append('    <changefreq>monthly</changefreq>')
            xml_lines.append('    <priority>0.8</priority>')
            xml_lines.append('    <geo:geo>')
            xml_lines.append('      <geo:point>')
            xml_lines.append(f'        <geo:lat>{lat:.6f}</geo:lat>')
            xml_lines.append(f'        <geo:long>{lon:.6f}</geo:long>')
            xml_lines.append('      </geo:point>')

            if bbox and len(bbox) == 4:
                min_lon, min_lat, max_lon, max_lat = bbox
                xml_lines.append('      <geo:box>')
                xml_lines.append(f'        <geo:west>{min_lon:.6f}</geo:west>')
                xml_lines.append(f'        <geo:south>{min_lat:.6f}</geo:south>')
                xml_lines.append(f'        <geo:east>{max_lon:.6f}</geo:east>')
                xml_lines.append(f'        <geo:north>{max_lat:.6f}</geo:north>')
                xml_lines.append('      </geo:box>')

            xml_lines.append('    </geo:geo>')
            xml_lines.append('  </url>')

        xml_lines.append('</urlset>')
        return "\n".join(xml_lines)

    def generate_jsonld_catalog(self, features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generates Schema.org DataCatalog and Place entities."""
        items = []
        for f in features:
            items.append({
                "@context": "https://schema.org",
                "@type": "Place",
                "@id": f"{self.base_url}/feature/{f.get('adl_id')}",
                "name": f.get("primary_name"),
                "alternateName": f.get("variant_names", []),
                "description": f"USGS GNIS {f.get('gnis_feature_class', 'Feature')} indexed in Alexandria Digital Library",
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": f.get("latitude") or f.get("lat"),
                    "longitude": f.get("longitude") or f.get("lon"),
                    "elevation": f.get("ele_in_m") or f.get("elevation_m")
                },
                "containedInPlace": {
                    "@type": "AdministrativeArea",
                    "name": f.get("county_name"),
                    "address": {
                        "@type": "PostalAddress",
                        "addressRegion": f.get("state_alpha"),
                        "addressCountry": "US"
                    }
                }
            })

        return {
            "@context": "https://schema.org",
            "@type": "DataCatalog",
            "name": "Alexandria Digital Library Gazetteer Index",
            "description": "Geospatial gazetteer catalog linking USGS GNIS and ADL spatial footprints",
            "url": self.base_url,
            "dataset": items
        }


if __name__ == "__main__":
    import sys
    import os
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
    from src.gazbean.gazbean import GazBean
    gb = GazBean()
    feats = [f.to_dict() for f in gb._in_memory_records]
    gen = AdlGeospatialSitemapGenerator()
    xml_out = gen.generate_xml_sitemap(feats)
    
    with open("sitemap_adl_geospatial.xml", "w", encoding="utf-8") as f:
        f.write(xml_out)
    print("Generated sitemap_adl_geospatial.xml successfully.")

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(xml_out)
    print("Generated sitemap.xml successfully.")
